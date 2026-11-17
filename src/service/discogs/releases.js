import 'server-only'
import { RECORD_COVERS_BUCKET, coverUrl, getAdminClient, getPublicClient } from '@/service/supabase'
import { sniffImageType } from '@/service/lists/validation'
import { downloadImage, fetchDiscogsLists, searchSpotifyAlbums } from '@/service/discogs/api'
import {
  coverExtension,
  dedupeRecords,
  discogsUrl,
  largestImage,
  mergeLists,
  pickSpotifyAlbum,
  spotifyUrl
} from '@/service/discogs/records'

const TABLE = 'discogs_releases'

// ---------- Public page ----------

const PAGE_COLUMNS =
  'release_id, artist, title, year, format, discogs_image_url, spotify_id, cover_path, in_wantlist, in_collection, wantlist_added_at, collection_added_at'

const toRecord = (row, list) => {
  const cover = coverUrl(row.cover_path, RECORD_COVERS_BUCKET)
  return {
    id: String(row.release_id),
    artist: row.artist,
    title: row.title,
    year: row.year,
    format: row.format,
    // Covers from our Storage can be WebGL textures (CORS); outside images can only be shown as <img>
    image: cover ?? row.discogs_image_url ?? null,
    imageSource: cover ? 'cover' : row.discogs_image_url ? 'external' : 'none',
    discogsUrl: discogsUrl(row.release_id, list),
    spotifyUrl: spotifyUrl(row.spotify_id)
  }
}

const listOf = (rows, list) =>
  dedupeRecords(
    rows
      .filter((r) => r[`in_${list}`])
      .sort((a, b) => (b[`${list}_added_at`] ?? '').localeCompare(a[`${list}_added_at`] ?? ''))
  ).map((r) => toRecord(r, list))

// Never throws, so a Supabase outage shows empty lists instead of breaking the page.
export const getDiscogsLists = async () => {
  try {
    const { data, error } = await getPublicClient().from(TABLE).select(PAGE_COLUMNS)
    if (error) throw error
    return { wantlist: listOf(data, 'wantlist'), collection: listOf(data, 'collection') }
  } catch (error) {
    console.error('[discogs] Could not load releases', error)
    return { wantlist: [], collection: [] }
  }
}

// ---------- Admin ----------

export const getDiscogsStats = async () => {
  const { data, error } = await getAdminClient()
    .from(TABLE)
    .select('in_wantlist, in_collection, cover_path, cover_checked_at, synced_at')
  if (error) throw error
  return {
    wantlist: data.filter((r) => r.in_wantlist).length,
    collection: data.filter((r) => r.in_collection).length,
    withCover: data.filter((r) => r.cover_path).length,
    unchecked: data.filter((r) => !r.cover_checked_at).length,
    total: data.length,
    lastSync: data.reduce((last, r) => (r.synced_at > (last ?? '') ? r.synced_at : last), null)
  }
}

// Best effort: an orphaned file is not worth failing the sync for.
const removeCoverFiles = async (paths) => {
  const existing = paths.filter(Boolean)
  if (!existing.length) return
  const { error } = await getAdminClient().storage.from(RECORD_COVERS_BUCKET).remove(existing)
  if (error) console.error('[discogs] Could not remove covers', existing, error)
}

// Discogs → Supabase: upsert every release of the wantlist and the collection, delete the ones gone from both.
// Cover columns are left untouched, so a release moving from the wantlist to the collection keeps its cover.
export const syncFromDiscogs = async () => {
  const db = getAdminClient()
  const lists = await fetchDiscogsLists()
  const rows = mergeLists(lists)

  const { data: existing, error: readError } = await db.from(TABLE).select('release_id, cover_path')
  if (readError) throw readError
  // An empty answer from Discogs is much more likely a glitch than an emptied wantlist and collection
  if (!rows.length && existing.length) throw new Error('Discogs returned no releases, nothing was changed.')

  const syncedAt = new Date().toISOString()
  if (rows.length) {
    const { error } = await db
      .from(TABLE)
      .upsert(rows.map((r) => ({ ...r, synced_at: syncedAt })), { onConflict: 'release_id' })
    if (error) throw error
  }

  const current = new Set(rows.map((r) => r.release_id))
  const gone = existing.filter((r) => !current.has(Number(r.release_id)))
  if (gone.length) {
    const { error } = await db
      .from(TABLE)
      .delete()
      .in('release_id', gone.map((r) => r.release_id))
    if (error) throw error
    await removeCoverFiles(gone.map((r) => r.cover_path))
  }

  const known = new Set(existing.map((r) => Number(r.release_id)))
  return {
    added: rows.filter((r) => !known.has(r.release_id)).length,
    removed: gone.length,
    wantlist: rows.filter((r) => r.in_wantlist).length,
    collection: rows.filter((r) => r.in_collection).length
  }
}

// Spotify album for a release: field search first, plain search as a fallback (self-titled albums, odd titles).
const findSpotifyAlbum = async (release) => {
  const artist = release.artists?.[0] ?? release.artist
  const strict = pickSpotifyAlbum(await searchSpotifyAlbums(`album:${release.title} artist:${artist}`), release)
  return strict ?? pickSpotifyAlbum(await searchSpotifyAlbums(`${artist} ${release.title}`), release)
}

const storeCover = async (release, source, url) => {
  const bytes = await downloadImage(url)
  const contentType = sniffImageType(bytes)
  if (!contentType) throw new Error(`Not an image: ${url}`)
  const path = `${release.release_id}-${source}.${coverExtension(contentType)}`
  const { error } = await getAdminClient()
    .storage.from(RECORD_COVERS_BUCKET)
    .upload(path, bytes, { contentType, cacheControl: '31536000', upsert: true })
  if (error) throw error
  return path
}

// Look for a cover (Spotify, else Discogs), copy it to Storage and mark the release as checked.
const fetchCover = async (release) => {
  const album = await findSpotifyAlbum(release)
  const candidates = [
    ['spotify', largestImage(album?.images)],
    ['discogs', release.discogs_image_url]
  ].filter(([, url]) => url)

  let cover = { path: null, source: null }
  for (const [source, url] of candidates) {
    try {
      cover = { path: await storeCover(release, source, url), source }
      break
    } catch (error) {
      console.error(`[discogs] ${source} cover failed for ${release.release_id}`, error)
    }
  }

  const { error } = await getAdminClient()
    .from(TABLE)
    .update({
      spotify_id: album?.id ?? null,
      cover_path: cover.path,
      cover_source: cover.source,
      cover_checked_at: new Date().toISOString()
    })
    .eq('release_id', release.release_id)
  if (error) throw error
  if (release.cover_path && release.cover_path !== cover.path) await removeCoverFiles([release.cover_path])
  return Boolean(cover.path)
}

// The heavy part: processes releases not checked yet, a few at a time, until the time budget runs out.
// The admin calls it again while `remaining` > 0.
export const fetchCovers = async ({ timeBudgetMs = 40_000, concurrency = 4 } = {}) => {
  const started = Date.now()
  const db = getAdminClient()
  const { data: pending, error } = await db
    .from(TABLE)
    .select('release_id, artist, artists, title, discogs_image_url, cover_path')
    .is('cover_checked_at', null)
    .order('release_id')
  if (error) throw error

  let processed = 0
  let found = 0
  let failed = 0
  let lastError = null
  for (let i = 0; i < pending.length && Date.now() - started < timeBudgetMs; i += concurrency) {
    const results = await Promise.allSettled(pending.slice(i, i + concurrency).map(fetchCover))
    for (const result of results) {
      if (result.status === 'fulfilled') {
        processed += 1
        if (result.value) found += 1
      } else {
        failed += 1
        lastError = result.reason?.message ?? String(result.reason)
        console.error('[discogs] fetchCover', result.reason)
      }
    }
    // Every release of the batch failed (Spotify down, rate limited…): stop, the next run retries them
    if (results.every((r) => r.status === 'rejected')) break
  }

  return { processed, found, failed, remaining: pending.length - processed, lastError }
}

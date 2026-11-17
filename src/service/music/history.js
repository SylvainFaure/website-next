import 'server-only'
import { getAdminClient, getPublicClient } from '@/service/supabase'
import {
  SpotifyAuthError,
  exchangeCode,
  getCurrentlyPlaying,
  getProfile,
  getRecentlyPlayed,
  getSavedPage,
  getTop,
  refreshAccessToken
} from '@/service/music/spotify'
import {
  TOP_LIMITS,
  TOP_RANGES,
  albumRuns,
  currentTrack,
  groupPlaysByDay,
  hasScope,
  removedIds,
  toLibraryRow,
  toPlay,
  toPlayRow,
  toPlayer,
  toTopRows,
  tokenExpiry,
  topLists
} from '@/service/music/tracks'
import { todayIso } from '@/service/lists/format'

const ACCOUNTS = 'music_accounts'
const PLAYS = 'music_plays'
const LIBRARY = 'music_library'
const TOP = 'music_top'
const TOP_SCOPE = 'user-top-read'
const SOURCE = 'spotify'
const PLAY_COLUMNS = 'id, played_at, track_name, artists, album_id, album_name, image_url, url'
const DAY = 24 * 60 * 60 * 1000

// Supabase returns 1000 rows at most per request.
const selectAll = async (query) => {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query().range(from, from + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

// ---------- Connection ----------

const getAccount = async () => {
  const { data, error } = await getAdminClient().from(ACCOUNTS).select('*').eq('source', SOURCE).maybeSingle()
  if (error) throw error
  return data
}

const updateAccount = async (fields) => {
  const { error } = await getAdminClient()
    .from(ACCOUNTS)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('source', SOURCE)
  if (error) console.error('[music] Could not update the Spotify account', error)
}

// Access tokens last an hour; kept per server instance.
let cachedToken = null

const accessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const account = await getAccount()
  if (!account) throw new SpotifyAuthError('Spotify is not connected.')
  try {
    const json = await refreshAccessToken(account.refresh_token)
    if (json.refresh_token && json.refresh_token !== account.refresh_token) {
      await updateAccount({ refresh_token: json.refresh_token })
    }
    cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
    return cachedToken.value
  } catch (error) {
    if (error instanceof SpotifyAuthError) {
      await updateAccount({ last_error: 'Spotify authorization expired or was revoked: connect again.' })
    }
    throw error
  }
}

// Called by the OAuth callback with the code Spotify sent back.
export const connectSpotify = async (code, redirectUri) => {
  const tokens = await exchangeCode(code, redirectUri)
  const profile = await getProfile(tokens.access_token).catch(() => null)
  const now = new Date().toISOString()
  const { error } = await getAdminClient()
    .from(ACCOUNTS)
    .upsert({
      source: SOURCE,
      refresh_token: tokens.refresh_token,
      account_name: profile?.display_name ?? profile?.id ?? null,
      scopes: tokens.scope ?? null,
      authorized_at: now,
      last_error: null,
      updated_at: now
    })
  if (error) throw error
  cachedToken = { value: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 }
}

// ---------- Footer player ----------

const lastStoredPlay = async () => {
  const { data } = await getPublicClient()
    .from(PLAYS)
    .select(PLAY_COLUMNS)
    .order('played_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? toPlayer(toPlay(data), false) : null
}

// The track playing now, else the last one played. Never throws (null = nothing to show).
export const getNowPlaying = async () => {
  try {
    const token = await accessToken()
    const current = currentTrack(await getCurrentlyPlaying(token))
    if (current) return current
    const last = (await getRecentlyPlayed(token, 1))?.items?.[0]
    if (last) return toPlayer(toPlay({ ...toPlayRow(last), id: null }), false)
  } catch (error) {
    console.error('[music] Now playing from Spotify failed', error.message)
  }
  try {
    return await lastStoredPlay()
  } catch {
    return null
  }
}

// ---------- Collection (hourly cron + admin button) ----------

// Spotify's last 50 plays; already stored ones are skipped by the (source, played_at) constraint.
const savePlays = async (token) => {
  const items = (await getRecentlyPlayed(token))?.items ?? []
  if (!items.length) return { added: 0, possibleGap: false }
  const rows = items.filter((item) => item.track?.id).map(toPlayRow)
  const { data: latest } = await getAdminClient()
    .from(PLAYS)
    .select('played_at')
    .order('played_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const { data, error } = await getAdminClient()
    .from(PLAYS)
    .upsert(rows, { onConflict: 'source,played_at', ignoreDuplicates: true })
    .select('id')
  if (error) throw error
  // All 50 new and older ones exist: some plays in between were probably missed
  const possibleGap = Boolean(latest) && data.length === rows.length && rows.length === 50
  return { added: data.length, possibleGap }
}

// Incremental: new saves only (stops at the first already known one).
// Full: walks the whole library and marks what is no longer saved as removed.
const syncLibrary = async (token, kind, full) => {
  const admin = getAdminClient()
  const saved = await selectAll(() =>
    admin.from(LIBRARY).select('item_id, added_at').eq('source', SOURCE).eq('kind', kind).is('removed_at', null)
  )
  const known = new Map(saved.map((r) => [r.item_id, new Date(r.added_at).getTime()]))
  const syncedAt = new Date().toISOString()
  const fetched = []

  for (let offset = 0; ; offset += 50) {
    const page = await getSavedPage(token, kind, offset)
    const items = (page?.items ?? []).filter((item) => (kind === 'track' ? item.track?.id : item.album?.id))
    const rows = items.map((item) => toLibraryRow(kind, item, syncedAt))
    const reachedKnown = rows.some((r) => known.get(r.item_id) === new Date(r.added_at).getTime())
    fetched.push(...rows)
    if (!page?.next || (!full && reachedKnown)) break
  }

  const fresh = fetched.filter((r) => known.get(r.item_id) !== new Date(r.added_at).getTime())
  if (fresh.length) {
    const { error } = await admin.from(LIBRARY).upsert(fresh, { onConflict: 'source,kind,item_id' })
    if (error) throw error
  }

  let removed = 0
  if (full) {
    const gone = removedIds([...known.keys()], fetched.map((r) => r.item_id))
    for (let i = 0; i < gone.length; i += 200) {
      const { error } = await admin
        .from(LIBRARY)
        .update({ removed_at: syncedAt })
        .eq('source', SOURCE)
        .eq('kind', kind)
        .in('item_id', gone.slice(i, i + 200))
      if (error) throw error
    }
    removed = gone.length
  }
  return { added: fresh.length, removed }
}

const latestTopDate = async (client = getPublicClient()) => {
  const { data, error } = await client
    .from(TOP)
    .select('taken_on')
    .order('taken_on', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.taken_on ?? null
}

// Today's snapshot of Spotify's top artists and tracks for each period (replaces today's if any).
const syncTops = async (token) => {
  const takenOn = todayIso()
  const rows = []
  for (const { key } of TOP_RANGES) {
    for (const kind of ['artist', 'track']) {
      const page = await getTop(token, kind, key, TOP_LIMITS[kind])
      rows.push(...toTopRows(kind, key, page?.items ?? [], takenOn))
    }
  }
  const admin = getAdminClient()
  // A shorter list than earlier today would leave stale ranks behind: clear the day first
  const { error: deleteError } = await admin.from(TOP).delete().eq('source', SOURCE).eq('taken_on', takenOn)
  if (deleteError) throw deleteError
  const { error } = await admin.from(TOP).insert(rows)
  if (error) throw error
  return { saved: rows.length }
}

// Never throws. A full library pass and the top snapshot run once a day (or on demand from the admin).
export const collectHistory = async ({ full = false } = {}) => {
  let account
  try {
    account = await getAccount()
  } catch (error) {
    return { ok: false, error: error.message }
  }
  if (!account) return { ok: false, error: 'Spotify is not connected.' }

  const lastFull = account.last_full_sync_at ? new Date(account.last_full_sync_at).getTime() : 0
  const fullPass = full || Date.now() - lastFull > DAY
  try {
    const token = await accessToken()
    const plays = await savePlays(token)
    const tracks = await syncLibrary(token, 'track', fullPass)
    const albums = await syncLibrary(token, 'album', fullPass)
    // Older connections didn't ask for the top permission: skipped until Spotify is connected again
    const topsDue = hasScope(account.scopes, TOP_SCOPE) && (full || (await latestTopDate(getAdminClient())) !== todayIso())
    const tops = topsDue ? await syncTops(token) : null
    const now = new Date().toISOString()
    await updateAccount({ last_sync_at: now, last_error: null, ...(fullPass ? { last_full_sync_at: now } : {}) })
    return { ok: true, full: fullPass, plays, tracks, albums, tops }
  } catch (error) {
    console.error('[music] Collect failed', error)
    if (!(error instanceof SpotifyAuthError)) await updateAccount({ last_error: error.message })
    return { ok: false, error: error.message }
  }
}

// ---------- Admin ----------

const count = async (table, filter = (q) => q) => {
  const { count: total, error } = await filter(
    getAdminClient().from(table).select('*', { count: 'exact', head: true })
  )
  if (error) throw error
  return total
}

export const getMusicStatus = async () => {
  const account = await getAccount()
  const saved = (kind) => (q) => q.eq('kind', kind).is('removed_at', null)
  const [plays, tracks, albums] = await Promise.all([
    count(PLAYS),
    count(LIBRARY, saved('track')),
    count(LIBRARY, saved('album'))
  ])
  return {
    connected: Boolean(account),
    accountName: account?.account_name ?? null,
    authorizedAt: account?.authorized_at ?? null,
    expiresAt: account ? tokenExpiry(account.authorized_at).toISOString() : null,
    lastSyncAt: account?.last_sync_at ?? null,
    lastFullSyncAt: account?.last_full_sync_at ?? null,
    lastError: account?.last_error ?? null,
    canReadTop: hasScope(account?.scopes, TOP_SCOPE),
    counts: { plays, tracks, albums }
  }
}

// ---------- Public page ----------

const RECENT_PLAYS = 150

const toSaved = (row) => ({
  id: row.item_id,
  name: row.name,
  artists: row.artists ?? [],
  album: row.album_name,
  image: row.image_url,
  url: row.url,
  addedAt: row.added_at
})

const latestSaved = async (kind, limit) => {
  const { data, error } = await getPublicClient()
    .from(LIBRARY)
    .select('item_id, name, artists, album_name, image_url, url, added_at')
    .eq('kind', kind)
    .is('removed_at', null)
    .order('added_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.map(toSaved)
}

// Never throws, so a Supabase outage shows an empty page instead of an error.
export const getMusicPage = async () => {
  try {
    const client = getPublicClient()
    const topDate = await latestTopDate(client)
    const [topRows, recentRows, firstPlay, albums, tracks] = await Promise.all([
      topDate ? client.from(TOP).select('*').eq('taken_on', topDate) : { data: [] },
      client.from(PLAYS).select(PLAY_COLUMNS).order('played_at', { ascending: false }).limit(RECENT_PLAYS),
      client.from(PLAYS).select('played_at').order('played_at', { ascending: true }).limit(1).maybeSingle(),
      latestSaved('album', 12),
      latestSaved('track', 20)
    ])
    for (const result of [topRows, recentRows, firstPlay]) if (result.error) throw result.error
    return {
      days: groupPlaysByDay(recentRows.data.map(toPlay)).map(({ day, plays }) => ({ day, runs: albumRuns(plays) })),
      tops: topLists(topRows.data),
      historySince: firstPlay.data?.played_at ?? null,
      savedAlbums: albums,
      savedTracks: tracks
    }
  } catch (error) {
    console.error('[music] Could not load the history', error)
    return { days: [], tops: topLists([]), historySince: null, savedAlbums: [], savedTracks: [] }
  }
}

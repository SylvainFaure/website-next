// Pure helpers for the Discogs lists (no framework imports, unit-tested).

export const LISTS = ['wantlist', 'collection']

// Discogs adds " (2)", " (3)"… to tell apart artists with the same name.
export const cleanArtistName = (name = '') => name.replace(/\s*\(\d+\)$/, '').trim()

// "A", "B & C" from Discogs' artists array, honoring their join words.
export const artistLabel = (artists = []) =>
  artists
    .map((a, i) => {
      const name = cleanArtistName(a.name)
      if (i === artists.length - 1) return name
      const join = (a.join ?? '').trim()
      return !join || join === ',' ? `${name}, ` : `${name} ${join} `
    })
    .join('')

const coverImage = (url) => (url && !url.includes('spacer.gif') ? url : null)

// One Discogs wantlist/collection entry → the fields we keep from Discogs.
export const toRelease = (entry) => {
  const info = entry.basic_information
  return {
    release_id: info.id,
    artist: artistLabel(info.artists),
    artists: (info.artists ?? []).map((a) => cleanArtistName(a.name)),
    title: info.title.trim(),
    year: info.year || null,
    format: info.formats?.[0]?.name ?? null,
    discogs_image_url: coverImage(info.cover_image)
  }
}

// Wantlist + collection entries → one row per release, flagged with the lists it belongs to.
export const mergeLists = ({ wantlist = [], collection = [] }) => {
  const rows = new Map()
  const add = (entries, list) => {
    for (const entry of entries) {
      const release = toRelease(entry)
      const row = rows.get(release.release_id) ?? {
        ...release,
        in_wantlist: false,
        in_collection: false,
        wantlist_added_at: null,
        collection_added_at: null
      }
      row[`in_${list}`] = true
      // A release can be in a list twice (two copies): keep the earliest date
      const key = `${list}_added_at`
      if (!row[key] || entry.date_added < row[key]) row[key] = entry.date_added
      rows.set(release.release_id, row)
    }
  }
  add(wantlist, 'wantlist')
  add(collection, 'collection')
  return [...rows.values()]
}

// Lowercase, no accents, no punctuation, "&" = "and", no leading "the". Keeps non-Latin letters.
// Names made only of symbols (">>>") are compared as written.
export const matchKey = (value = '') => {
  const key = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/&/g, 'and')
    .replace(/^the\s+/, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
  return key || value.trim().toLowerCase()
}

// "Title (Remastered 2011)", "Title - Deluxe Edition", "Title [Bonus Tracks]" → "Title"
const stripEdition = (title = '') =>
  title
    .replace(/\s*[([][^)\]]*[)\]]\s*$/g, '')
    .replace(/\s+-\s+.*$/, '')
    .trim()

const sameTitle = (a, b) => matchKey(a) === matchKey(b) || matchKey(stripEdition(a)) === matchKey(stripEdition(b))

// First Spotify album (from a search) that really is this release: same artist and same title.
export const pickSpotifyAlbum = (albums = [], release) => {
  const artistKeys = new Set((release.artists?.length ? release.artists : [release.artist]).map(matchKey))
  return (
    albums.find(
      (album) =>
        album?.artists?.some((a) => artistKeys.has(matchKey(a.name))) && sameTitle(album.name, release.title)
    ) ?? null
  )
}

// Largest image of a Spotify album (Spotify lists them biggest first, but don't rely on it).
export const largestImage = (images = []) =>
  images.reduce((best, img) => (!best || (img.width ?? 0) > (best.width ?? 0) ? img : best), null)?.url ?? null

// Two pressings of the same album show once: same artist + title, keep the first (most recent).
export const dedupeRecords = (records) => {
  const seen = new Set()
  return records.filter((r) => {
    const key = `${matchKey(r.artist)}|${matchKey(r.title)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Wantlist links to the marketplace (to buy it), collection to the release page.
export const discogsUrl = (releaseId, list) =>
  list === 'wantlist'
    ? `https://www.discogs.com/sell/release/${releaseId}?ev=rb`
    : `https://www.discogs.com/release/${releaseId}`

export const spotifyUrl = (spotifyId) => (spotifyId ? `https://open.spotify.com/album/${spotifyId}` : null)

export const coverExtension = (contentType) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[contentType] ?? null

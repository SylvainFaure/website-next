// Pure helpers for the music history (no framework or network imports, unit-tested).

export const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-library-read',
  'user-top-read'
]

// Spotify refresh tokens die 6 months after the authorization; refreshing doesn't extend them.
export const TOKEN_LIFETIME_MONTHS = 6

export const tokenExpiry = (authorizedAt) => {
  const date = new Date(authorizedAt)
  date.setUTCMonth(date.getUTCMonth() + TOKEN_LIFETIME_MONTHS)
  return date
}

// SPOTIFY_CLIENT = base64("client_id:client_secret")
export const clientIdFrom = (encoded) => Buffer.from(encoded, 'base64').toString('utf8').split(':')[0]

export const authorizeUrl = ({ clientId, redirectUri, state }) =>
  `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES.join(' '),
    redirect_uri: redirectUri,
    state,
    show_dialog: 'true'
  })}`

// Smallest image at least `minWidth` wide (Spotify gives 640, 300 and 64), else the largest.
export const pickImage = (images = [], minWidth = 300) => {
  const sorted = [...images].filter((i) => i?.url).sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
  return (sorted.find((i) => (i.width ?? 0) >= minWidth) ?? sorted.at(-1))?.url ?? null
}

const names = (artists = []) => artists.map((a) => a.name).filter(Boolean)

// /me/player/recently-played item → music_plays row
export const toPlayRow = ({ track, played_at }) => ({
  source: 'spotify',
  played_at,
  track_id: track.id,
  track_name: track.name,
  artists: names(track.artists),
  album_id: track.album?.id ?? null,
  album_name: track.album?.name ?? null,
  image_url: pickImage(track.album?.images),
  duration_ms: track.duration_ms ?? null,
  url: track.external_urls?.spotify ?? null
})

// /me/tracks or /me/albums item → music_library row
export const toLibraryRow = (kind, item, syncedAt) => {
  const entity = kind === 'track' ? item.track : item.album
  return {
    source: 'spotify',
    kind,
    item_id: entity.id,
    name: entity.name,
    artists: names(entity.artists),
    album_name: kind === 'track' ? entity.album?.name ?? null : null,
    image_url: pickImage(kind === 'track' ? entity.album?.images : entity.images),
    url: entity.external_urls?.spotify ?? null,
    added_at: item.added_at,
    removed_at: null,
    synced_at: syncedAt
  }
}

// Ids we still list as saved but Spotify doesn't return any more.
export const removedIds = (savedIds, fetchedIds) => {
  const fetched = new Set(fetchedIds)
  return savedIds.filter((id) => !fetched.has(id))
}

// What the footer player shows: the current track, else the last one played.
export const toPlayer = ({ name, artists, album, image, url }, playing) => ({
  song: name,
  artists: artists.join(', '),
  album,
  image,
  url,
  currently_playing: playing
})

// /me/player/currently-playing body → player, or null (paused, podcast, ad…)
export const currentTrack = (body) => {
  const track = body?.currently_playing_type === 'track' && body.is_playing ? body.item : null
  if (!track) return null
  return toPlayer(
    {
      name: track.name,
      artists: names(track.artists),
      album: track.album?.name,
      image: pickImage(track.album?.images),
      url: track.external_urls?.spotify
    },
    true
  )
}

// music_plays row → page item
export const toPlay = (row) => ({
  id: row.id,
  playedAt: row.played_at,
  name: row.track_name,
  artists: row.artists ?? [],
  album: row.album_name,
  albumId: row.album_id,
  image: row.image_url,
  url: row.url
})

const dayFormatter = (timeZone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })

// Plays (most recent first) → [{ day: 'YYYY-MM-DD', plays }] in the site's time zone.
export const groupPlaysByDay = (plays, timeZone = 'Europe/Rome') => {
  const format = dayFormatter(timeZone)
  const days = []
  for (const play of plays) {
    const day = format.format(new Date(play.playedAt))
    if (days.at(-1)?.day !== day) days.push({ day, plays: [] })
    days.at(-1).plays.push(play)
  }
  return days
}

// Plays (most recent first) → runs of consecutive plays from the same album, so listening to a
// whole album shows its cover once. Each run's plays are in listening order (oldest first).
export const albumRuns = (plays) => {
  const runs = []
  for (const play of plays) {
    const key = play.albumId ?? play.album
    const run = runs.at(-1)
    if (run && key && run.key === key) run.plays.unshift(play)
    else runs.push({ key: key ?? play.id, plays: [play] })
  }
  return runs.map(({ key, plays: items }) => {
    const { album, artists, image } = items[0]
    return { key: String(key), album, artists, image, plays: items }
  })
}

// ---------- Spotify's top artists / tracks ----------

// Spotify's periods, as labelled on the page
export const TOP_RANGES = [
  { key: 'short_term', label: '4 weeks' },
  { key: 'medium_term', label: '6 months' },
  { key: 'long_term', label: '12 months' }
]
export const TOP_LIMITS = { artist: 20, track: 50 }

export const hasScope = (scopes, scope) => (scopes ?? '').split(' ').includes(scope)

// /me/top/{artists|tracks} items → music_top rows (rank starts at 1)
export const toTopRows = (kind, timeRange, items, takenOn) =>
  items
    .filter((item) => item?.id)
    .map((item, index) => ({
      source: 'spotify',
      kind,
      time_range: timeRange,
      taken_on: takenOn,
      rank: index + 1,
      item_id: item.id,
      name: item.name,
      artists: kind === 'track' ? names(item.artists) : [],
      album_id: kind === 'track' ? item.album?.id ?? null : null,
      album_name: kind === 'track' ? item.album?.name ?? null : null,
      album_url: kind === 'track' ? item.album?.external_urls?.spotify ?? null : null,
      // shown at 40 px: big enough for 2x screens
      image_url: pickImage(kind === 'track' ? item.album?.images : item.images, 120),
      url: item.external_urls?.spotify ?? null
    }))

// Albums ranked from the top tracks: each track scores more the higher it ranks, so an album with
// several well-ranked tracks comes first. Ties go to the album with the best-ranked track.
export const topAlbumsFromTracks = (tracks, limit = 10) => {
  const albums = new Map()
  for (const track of tracks) {
    if (!track.albumId) continue
    const album = albums.get(track.albumId) ?? {
      key: track.albumId,
      name: track.album,
      secondary: track.artists.join(', '),
      image: track.image,
      url: track.albumUrl,
      score: 0,
      best: track.rank
    }
    album.score += tracks.length + 1 - track.rank
    album.best = Math.min(album.best, track.rank)
    albums.set(track.albumId, album)
  }
  return [...albums.values()]
    .sort((a, b) => b.score - a.score || a.best - b.best)
    .slice(0, limit)
    .map(({ key, name, secondary, image, url }) => ({ key, name, secondary, image, url }))
}

// music_top rows of one snapshot → { short_term: { artists, albums }, ... } ready for the page
export const topLists = (rows, limit = 10) =>
  Object.fromEntries(
    TOP_RANGES.map(({ key }) => {
      const ofRange = rows.filter((r) => r.time_range === key).sort((a, b) => a.rank - b.rank)
      const artists = ofRange
        .filter((r) => r.kind === 'artist')
        .slice(0, limit)
        .map((r) => ({ key: r.item_id, name: r.name, image: r.image_url, url: r.url }))
      const tracks = ofRange
        .filter((r) => r.kind === 'track')
        .map((r) => ({
          rank: r.rank,
          artists: r.artists ?? [],
          albumId: r.album_id,
          album: r.album_name,
          albumUrl: r.album_url,
          image: r.image_url
        }))
      return [key, { artists, albums: topAlbumsFromTracks(tracks, limit) }]
    })
  )

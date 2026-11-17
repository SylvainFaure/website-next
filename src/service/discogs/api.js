import 'server-only'

// Clients for the Discogs and Spotify APIs, only used by the admin sync.

const DISCOGS_API = 'https://api.discogs.com'
const DISCOGS_USER = 'nolandskid'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search'
// Discogs asks every client to identify itself
const USER_AGENT = 'sylvainfaure-website/1.0'

const required = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

const discogsGet = async (path) => {
  const res = await fetch(`${DISCOGS_API}/${path}`, {
    headers: { Authorization: `Discogs token=${required('DISCOGS_TOKEN')}`, 'User-Agent': USER_AGENT },
    cache: 'no-store'
  })
  if (!res.ok) throw new Error(`Discogs ${path} answered ${res.status}`)
  return res.json()
}

// All pages of a paginated Discogs list.
const discogsAll = async (path, key) => {
  const entries = []
  let page = 1
  let pages = 1
  do {
    const json = await discogsGet(`${path}?page=${page}&per_page=100`)
    entries.push(...json[key])
    pages = json.pagination.pages
    page += 1
  } while (page <= pages)
  return entries
}

export const fetchDiscogsLists = async () => {
  const [wantlist, collection] = await Promise.all([
    discogsAll(`users/${DISCOGS_USER}/wants`, 'wants'),
    // Folder 0 = "All" folders of the collection
    discogsAll(`users/${DISCOGS_USER}/collection/folders/0/releases`, 'releases')
  ])
  return { wantlist, collection }
}

// App-only Spotify token (client credentials): enough for search, no user account involved.
// SPOTIFY_CLIENT = base64("client_id:client_secret")
let spotifyToken = null

const getSpotifyToken = async () => {
  if (spotifyToken && spotifyToken.expiresAt > Date.now() + 60_000) return spotifyToken.value
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${required('SPOTIFY_CLIENT')}`
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store'
  })
  const json = await res.json()
  if (!res.ok || !json.access_token) throw new Error(`Spotify token request failed (${res.status})`)
  spotifyToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return spotifyToken.value
}

export const searchSpotifyAlbums = async (query) => {
  const url = `${SPOTIFY_SEARCH_URL}?type=album&limit=10&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await getSpotifyToken()}` }, cache: 'no-store' })
  if (!res.ok) throw new Error(`Spotify search answered ${res.status}`)
  return (await res.json()).albums?.items ?? []
}

// Image bytes from Spotify's or Discogs' CDN.
export const downloadImage = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, cache: 'no-store' })
  if (!res.ok) throw new Error(`Image download answered ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

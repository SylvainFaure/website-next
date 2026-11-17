import 'server-only'

// Spotify Web API calls on behalf of the connected account (authorization code flow).
// SPOTIFY_CLIENT = base64("client_id:client_secret") of the Spotify app.

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'

// The refresh token is dead (revoked or older than 6 months): the admin must connect again.
export class SpotifyAuthError extends Error {}

const clientCredentials = () => {
  const value = process.env.SPOTIFY_CLIENT
  if (!value) throw new Error('Missing environment variable SPOTIFY_CLIENT')
  return value
}

const tokenRequest = async (params) => {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${clientCredentials()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(params),
    cache: 'no-store'
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = `Spotify token request failed (${res.status} ${json.error ?? ''}${
      json.error_description ? `: ${json.error_description}` : ''
    })`
    throw json.error === 'invalid_grant' ? new SpotifyAuthError(message) : new Error(message)
  }
  return json
}

// → { access_token, refresh_token, expires_in, scope }
export const exchangeCode = (code, redirectUri) =>
  tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri })

// → { access_token, expires_in, refresh_token? } (Spotify may rotate the refresh token)
export const refreshAccessToken = (refreshToken) =>
  tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken })

const get = async (accessToken, path) => {
  const res = await fetch(`${API}/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store'
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`Spotify ${path.split('?')[0]} answered ${res.status}`)
  return res.json()
}

export const getProfile = (accessToken) => get(accessToken, 'me')

// null when nothing is playing
export const getCurrentlyPlaying = (accessToken) => get(accessToken, 'me/player/currently-playing')

// Last plays, most recent first (Spotify keeps 50 at most)
export const getRecentlyPlayed = (accessToken, limit = 50) =>
  get(accessToken, `me/player/recently-played?limit=${limit}`)

// Spotify's ranking of the user's artists or tracks over a period (needs user-top-read)
export const getTop = (accessToken, kind, timeRange, limit) =>
  get(accessToken, `me/top/${kind}s?time_range=${timeRange}&limit=${limit}`)

// Saved tracks or albums, most recently saved first: { items, total, next }
export const getSavedPage = (accessToken, kind, offset = 0) =>
  get(accessToken, `me/${kind === 'track' ? 'tracks' : 'albums'}?limit=50&offset=${offset}`)

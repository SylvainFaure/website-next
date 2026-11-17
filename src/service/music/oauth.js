import 'server-only'
import { timingSafeEqual } from 'node:crypto'

export const STATE_COOKIE = 'spotify_oauth_state'
export const CALLBACK_PATH = '/admin/spotify/callback'

const isLoopback = (host) => /^(127\.0\.0\.1|\[::1\]|localhost)(:\d+)?$/.test(host)

// The site's own origin, from the request headers (Vercel sets x-forwarded-*).
export const requestOrigin = (headers) => {
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? ''
  const proto = headers.get('x-forwarded-proto') ?? (isLoopback(host) ? 'http' : 'https')
  return { host, origin: `${proto}://${host}`, secure: proto === 'https' }
}

// Spotify refuses "localhost" redirect URIs (only 127.0.0.1 / [::1] for http).
export const isLocalhostName = (host) => /^localhost(:\d+)?$/.test(host)

export const redirectUriFor = (origin) => `${origin}${CALLBACK_PATH}`

export const sameSecret = (a, b) => {
  if (!a || !b) return false
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

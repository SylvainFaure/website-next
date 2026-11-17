import { getNowPlaying } from '@/service/music/history'

export const dynamic = 'force-dynamic'

// One Spotify lookup per instance every 30 s at most; the CDN caches the answer as long.
const TTL = 30_000
let cache = { at: 0, value: null }

export async function GET() {
  if (Date.now() - cache.at > TTL) cache = { at: Date.now(), value: await getNowPlaying() }
  return Response.json(cache.value, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' }
  })
}

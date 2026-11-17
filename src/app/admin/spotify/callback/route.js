import { NextResponse } from 'next/server'
import { isAdmin } from '@/service/auth/admin'
import { connectSpotify } from '@/service/music/history'
import { CALLBACK_PATH, STATE_COOKIE, redirectUriFor, requestOrigin, sameSecret } from '@/service/music/oauth'

// Spotify sends the browser back here after the consent page (?code=… or ?error=…).
export async function GET(request) {
  const { origin } = requestOrigin(request.headers)
  const back = (status) => {
    const response = NextResponse.redirect(new URL(`/admin/music?spotify=${status}`, origin))
    response.cookies.set(STATE_COOKIE, '', { path: CALLBACK_PATH, maxAge: 0 })
    return response
  }

  if (!(await isAdmin())) return NextResponse.redirect(new URL('/admin/login', origin))

  const params = request.nextUrl.searchParams
  if (!sameSecret(params.get('state'), request.cookies.get(STATE_COOKIE)?.value)) return back('state')
  if (params.get('error') || !params.get('code')) return back('denied')

  try {
    await connectSpotify(params.get('code'), redirectUriFor(origin))
    return back('connected')
  } catch (error) {
    console.error('[admin] Spotify connection failed', error)
    return back('error')
  }
}

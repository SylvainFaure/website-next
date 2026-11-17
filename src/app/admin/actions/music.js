'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/service/auth/admin'
import { collectHistory } from '@/service/music/history'
import { CALLBACK_PATH, STATE_COOKIE, isLocalhostName, redirectUriFor, requestOrigin } from '@/service/music/oauth'
import { authorizeUrl, clientIdFrom } from '@/service/music/tracks'

// Sends the browser to Spotify's consent page; Spotify comes back to /admin/spotify/callback.
export async function connectSpotifyAction() {
  await requireAdmin()
  const { host, origin, secure } = requestOrigin(await headers())
  if (isLocalhostName(host)) redirect('/admin/music?spotify=localhost')

  const state = randomBytes(16).toString('hex')
  const store = await cookies()
  store.set(STATE_COOKIE, state, { httpOnly: true, sameSite: 'lax', secure, path: CALLBACK_PATH, maxAge: 600 })
  redirect(
    authorizeUrl({
      clientId: clientIdFrom(process.env.SPOTIFY_CLIENT ?? ''),
      redirectUri: redirectUriFor(origin),
      state
    })
  )
}

export async function syncMusicAction() {
  await requireAdmin()
  const result = await collectHistory({ full: true })
  revalidatePath('/music')
  revalidatePath('/admin/music')
  return result
}

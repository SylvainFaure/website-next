import Link from 'next/link'
import { headers } from 'next/headers'
import { requireAdmin } from '@/service/auth/admin'
import { getMusicStatus } from '@/service/music/history'
import { isLocalhostName, redirectUriFor, requestOrigin } from '@/service/music/oauth'
import { connectSpotifyAction } from '@/app/admin/actions/music'
import { buttonClass } from '@/components/Admin/fields'
import MusicSyncPanel from '@/components/Admin/MusicSyncPanel'

export const maxDuration = 300

const formatDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(
        new Date(iso)
      )
    : 'never'

const NOTICES = {
  connected: { text: 'Spotify connected.' },
  denied: { error: true, text: 'Spotify access was not granted.' },
  state: { error: true, text: 'The Spotify answer could not be verified, try again.' },
  error: { error: true, text: 'Spotify connection failed (see the server logs).' },
  localhost: { error: true, text: 'Spotify refuses "localhost": open the admin on 127.0.0.1 instead.' }
}

const SOON = 14 * 24 * 60 * 60 * 1000

export default async function AdminMusicPage({ searchParams }) {
  await requireAdmin()
  const [status, { spotify }, { host, origin }] = await Promise.all([
    getMusicStatus(),
    searchParams,
    headers().then(requestOrigin)
  ])
  const notice = NOTICES[spotify]
  const expiresSoon = status.expiresAt && new Date(status.expiresAt).getTime() - Date.now() < SOON

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline gap-4 mb-6">
        <h1>Music</h1>
        <Link href="/music" className="text-sm hover:underline">
          View page
        </Link>
      </div>

      {notice && <p className={`mb-6 text-sm ${notice.error ? '!text-contrast' : ''}`}>{notice.text}</p>}

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          ['Plays', status.counts.plays],
          ['Saved tracks', status.counts.tracks],
          ['Saved albums', status.counts.albums],
          ['Last sync', formatDate(status.lastSyncAt)]
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[rgba(240,240,201,0.25)] p-4">
            <dt className="text-sm opacity-70">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4">
        <section className="rounded-md border border-[rgba(240,240,201,0.25)] p-6">
          <h2>Spotify connection</h2>
          {status.connected ? (
            <p className="text-sm opacity-80 mb-4">
              Connected{status.accountName ? ` as ${status.accountName}` : ''} on {formatDate(status.authorizedAt)}.
              Spotify ends the access on <strong>{formatDate(status.expiresAt)}</strong> (6 months), connect again
              before that.
            </p>
          ) : (
            <p className="text-sm opacity-80 mb-4">Not connected: the footer player and the history are empty.</p>
          )}
          {status.lastError && <p className="text-sm !text-contrast mb-4">Last sync failed: {status.lastError}</p>}
          {status.connected && !status.canReadTop && (
            <p className="text-sm !text-contrast mb-4">
              Connect again to allow the top artists and tracks (new permission).
            </p>
          )}
          {expiresSoon &&<p className="text-sm !text-contrast mb-4">The access ends soon: connect again.</p>}
          {isLocalhostName(host) ? (
            <p className="text-sm !text-contrast">
              Spotify refuses &quot;localhost&quot;: open this page on 127.0.0.1 to connect.
            </p>
          ) : (
            <form action={connectSpotifyAction}>
              <button type="submit" className={buttonClass}>
                {status.connected ? 'Connect again' : 'Connect Spotify'}
              </button>
            </form>
          )}
          <p className="text-xs opacity-60 mt-4">
            Redirect URI to allow in the Spotify app: <code>{redirectUriFor(origin)}</code>
          </p>
        </section>

        <MusicSyncPanel disabled={!status.connected} lastFullSyncAt={formatDate(status.lastFullSyncAt)} />
      </div>
    </div>
  )
}

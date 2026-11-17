'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { syncMusicAction } from '@/app/admin/actions/music'
import { buttonClass } from '@/components/Admin/fields'

const summary = ({ plays, tracks, albums, tops }) =>
  `${plays.added} new plays, ${tracks.added} tracks and ${albums.added} albums saved, ${
    tracks.removed + albums.removed
  } no longer saved${tops ? ', top lists updated' : ''}.${
    plays.possibleGap ? ' Some plays may have been missed since the last sync.' : ''
  }`

const MusicSyncPanel = ({ disabled, lastFullSyncAt }) => {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const sync = async () => {
    setBusy(true)
    setMessage(null)
    const res = await syncMusicAction()
    setMessage(res.ok ? { text: `Done: ${summary(res)}` } : { error: true, text: `Sync failed: ${res.error}` })
    setBusy(false)
    router.refresh()
  }

  return (
    <section className="rounded-md border border-[rgba(240,240,201,0.25)] p-6">
      <h2>Sync now</h2>
      <p className="text-sm opacity-80 mb-4">
        Runs every hour on its own: saves the last 50 plays and new saved tracks and albums. Once a day it also
        checks the whole library for removed ones and saves Spotify&apos;s top artists and tracks. This button does the full pass now. Last full pass: {lastFullSyncAt}.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className={buttonClass} disabled={disabled || busy} onClick={sync}>
          {busy ? 'Syncing…' : 'Sync now'}
        </button>
        {message && <p className={`text-sm ${message.error ? '!text-contrast' : ''}`}>{message.text}</p>}
      </div>
    </section>
  )
}

export default MusicSyncPanel

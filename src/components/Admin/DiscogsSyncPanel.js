'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchCoversAction, syncDiscogsAction } from '@/app/admin/actions/discogs'
import { buttonClass } from '@/components/Admin/fields'

const Step = ({ title, description, label, busyLabel, busy, disabled, onClick, message }) => (
  <section className="rounded-md border border-[rgba(240,240,201,0.25)] p-6">
    <h2>{title}</h2>
    <p className="text-sm opacity-80 mb-4">{description}</p>
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" className={buttonClass} disabled={disabled} onClick={onClick}>
        {busy ? busyLabel : label}
      </button>
      {message && <p className={`text-sm ${message.error ? '!text-contrast' : ''}`}>{message.text}</p>}
    </div>
  </section>
)

const DiscogsSyncPanel = ({ unchecked }) => {
  const router = useRouter()
  const [busy, setBusy] = useState(null)
  const [syncMessage, setSyncMessage] = useState(null)
  const [coversMessage, setCoversMessage] = useState(null)

  const sync = async () => {
    setBusy('sync')
    setSyncMessage(null)
    const res = await syncDiscogsAction()
    setSyncMessage(
      res.ok
        ? { text: `Done: ${res.added} added, ${res.removed} removed (${res.wantlist} wanted, ${res.collection} owned).` }
        : { error: true, text: `Sync failed: ${res.error}` }
    )
    setBusy(null)
    router.refresh()
  }

  // Calls the action batch after batch until every release has been looked at.
  const covers = async () => {
    setBusy('covers')
    setCoversMessage(null)
    let processed = 0
    let found = 0
    let failed = 0
    let res
    do {
      res = await fetchCoversAction()
      if (!res.ok) break
      processed += res.processed
      found += res.found
      failed = res.failed
      setCoversMessage({ text: `${processed} checked, ${found} covers saved, ${res.remaining} to go…` })
    } while (res.remaining > 0 && res.processed > 0)

    setCoversMessage(
      !res.ok
        ? { error: true, text: `Failed: ${res.error}` }
        : failed
          ? { error: true, text: `${processed} checked, ${found} covers saved. ${failed} failed (${res.lastError}), run it again to retry.` }
          : { text: `Done: ${processed} checked, ${found} covers saved.` }
    )
    setBusy(null)
    router.refresh()
  }

  return (
    <div className="grid gap-4">
      <Step
        title="1. Sync from Discogs"
        description="Reads the wantlist and the collection on Discogs, adds new releases and removes the ones that are gone. Takes a few seconds."
        label="Sync from Discogs"
        busyLabel="Syncing…"
        busy={busy === 'sync'}
        disabled={!!busy}
        onClick={sync}
        message={syncMessage}
      />
      <Step
        title="2. Fetch covers"
        description={`Finds a cover for new releases (Spotify, else Discogs) and copies it to Supabase. ${
          unchecked ? `${unchecked} release${unchecked > 1 ? 's' : ''} to check.` : 'Nothing to check.'
        }`}
        label="Fetch covers"
        busyLabel="Fetching…"
        busy={busy === 'covers'}
        disabled={!!busy || !unchecked}
        onClick={covers}
        message={coversMessage}
      />
    </div>
  )
}

export default DiscogsSyncPanel

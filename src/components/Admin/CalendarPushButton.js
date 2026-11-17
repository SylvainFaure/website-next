'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { pushMissingToCalendarAction } from '@/app/admin/actions/concerts'

const CalendarPushButton = ({ count }) => {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const push = async () => {
    setBusy(true)
    const res = await pushMissingToCalendarAction()
    setMessage(res.failed ? `${res.pushed} added, ${res.failed} failed: ${res.error}` : `${res.pushed} added to the calendar.`)
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button type="button" onClick={push} disabled={busy} className="underline hover:opacity-80 disabled:opacity-50">
        {busy ? 'Adding…' : `Add ${count} missing to the calendar`}
      </button>
      {message && <span className="opacity-80">{message}</span>}
    </div>
  )
}

export default CalendarPushButton

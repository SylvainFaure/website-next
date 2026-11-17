// Concert → Google Calendar event (pure, unit-tested).

// Google event ids may only use the characters a-v and 0-9. Deriving it from the concert id makes
// pushes idempotent and means we never have to store Google's id.
export const calendarEventId = (concertId) => `sfconcert${concertId}`

// "2024-06-30" + 1 → "2024-07-01" (UTC arithmetic, no time zone involved)
export const addDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// All-day event over the concert's days. Google's end date is exclusive.
export const toCalendarEvent = (concert) => ({
  summary: `${concert.maybe ? '(maybe) ' : ''}${concert.artists.join(', ')}${concert.event ? ` @ ${concert.event}` : ''}`,
  location: [concert.venue, concert.city].filter(Boolean).join(', '),
  description: concert.event ? `${concert.event}\n${concert.artists.join('\n')}` : concert.artists.join('\n'),
  start: { date: concert.date },
  end: { date: addDays(concert.endDate ?? concert.date, 1) },
  // Free, not busy: a gig shouldn't block the day
  transparency: 'transparent',
  // Also restores an event that was deleted from the calendar
  status: 'confirmed'
})

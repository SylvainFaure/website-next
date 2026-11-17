import 'server-only'
import { getAdminClient, getPublicClient } from '@/service/supabase'
import { formatConcertDate, groupByYear, isUpcoming, todayIso, uniqueSorted, yearOf } from '@/service/lists/format'
import { calendarEventId, toCalendarEvent } from '@/service/lists/calendarEvent'
import { deleteCalendarEvent, isCalendarConfigured, upsertCalendarEvent } from '@/service/google/calendar'

const COLUMNS = 'id, date, end_date, artists, event, venue, city, maybe, calendar_synced_at'

const toConcert = (row) => ({
  id: row.id,
  date: row.date,
  endDate: row.end_date,
  dateLabel: formatConcertDate(row.date, row.end_date),
  artists: row.artists ?? [],
  event: row.event,
  venue: row.venue,
  city: row.city,
  maybe: row.maybe ?? false,
  inCalendar: Boolean(row.calendar_synced_at)
})

const toRow = (data) => ({
  date: data.date,
  end_date: data.endDate,
  artists: data.artists,
  event: data.event,
  venue: data.venue,
  city: data.city,
  maybe: data.maybe ?? false
})

// Most recent first.
export const listConcerts = async () => {
  const { data, error } = await getPublicClient()
    .from('concerts')
    .select(COLUMNS)
    .order('date', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw error
  return data.map(toConcert)
}

const pastByYear = (concerts) =>
  groupByYear([...concerts].reverse(), (c) => yearOf(c.date)).map(({ year, items }) => ({ year, concerts: items }))

// For the public pages: upcoming soonest first; past by year, most recent year first,
// concerts in chronological order inside a year.
// Never throws, so a Supabase outage shows empty lists instead of breaking the page.
export const getConcertLists = async () => {
  try {
    const today = todayIso()
    const concerts = await listConcerts()
    return {
      upcoming: concerts.filter((c) => isUpcoming(c, today)).reverse(),
      pastByYear: pastByYear(concerts.filter((c) => !isUpcoming(c, today)))
    }
  } catch (error) {
    console.error('[lists] Could not load concerts', error)
    return { upcoming: [], pastByYear: [] }
  }
}

export const getPastConcertsByYear = async () => (await getConcertLists()).pastByYear

export const getConcert = async (id) => {
  const { data, error } = await getPublicClient().from('concerts').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toConcert(data) : null
}

export const concertSuggestions = (concerts) => ({
  venues: uniqueSorted(concerts.map((c) => c.venue)),
  cities: uniqueSorted(concerts.map((c) => c.city)),
  events: uniqueSorted(concerts.map((c) => c.event))
})

export const createConcert = async (data) => {
  const { data: row, error } = await getAdminClient().from('concerts').insert(toRow(data)).select('id').single()
  if (error) throw error
  return row.id
}

export const updateConcert = async (id, data) => {
  const { error } = await getAdminClient().from('concerts').update(toRow(data)).eq('id', id)
  if (error) throw error
}

// ---------- Google Calendar ----------

const markCalendarSync = async (id, syncedAt) => {
  const { error } = await getAdminClient().from('concerts').update({ calendar_synced_at: syncedAt }).eq('id', id)
  if (error) console.error('[lists] Could not save the calendar sync state', id, error)
}

// Pushes an upcoming concert (or one already in the calendar) to Google Calendar.
// Never throws: returns null when fine, or a message saying what went wrong.
export const syncConcertToCalendar = async (id) => {
  if (!isCalendarConfigured()) return null
  try {
    const concert = await getConcert(id)
    if (!concert) return null
    if (!isUpcoming(concert, todayIso()) && !concert.inCalendar) return null
    await upsertCalendarEvent(calendarEventId(id), toCalendarEvent(concert))
    await markCalendarSync(id, new Date().toISOString())
    return null
  } catch (error) {
    console.error('[lists] Calendar sync failed for concert', id, error)
    // null = "not in the calendar": shows up as missing in the admin, to push again
    await markCalendarSync(id, null)
    return error.message
  }
}

// Upcoming concerts not in the calendar yet (never pushed, or the last push failed).
export const pushMissingToCalendar = async () => {
  if (!isCalendarConfigured()) return { pushed: 0, failed: 0, error: 'Google Calendar is not configured.' }
  const today = todayIso()
  const missing = (await listConcerts()).filter((c) => isUpcoming(c, today) && !c.inCalendar)
  let pushed = 0
  let error = null
  for (const concert of missing) {
    const failure = await syncConcertToCalendar(concert.id)
    if (failure) error = failure
    else pushed += 1
  }
  return { pushed, failed: missing.length - pushed, error }
}

export const deleteConcert = async (id) => {
  const concert = await getConcert(id)
  const { error } = await getAdminClient().from('concerts').delete().eq('id', id)
  if (error) throw error
  // Best effort: the concert is gone either way, a leftover event can be deleted by hand
  if (concert?.inCalendar && isCalendarConfigured()) {
    try {
      await deleteCalendarEvent(calendarEventId(id))
    } catch (calendarError) {
      console.error('[lists] Could not delete the calendar event of concert', id, calendarError)
    }
  }
}

export { isCalendarConfigured }

import 'server-only'
import { getAdminClient, getPublicClient } from '@/service/supabase'
import { formatConcertDate, groupByYear, uniqueSorted, yearOf } from '@/service/lists/format'

const COLUMNS = 'id, date, end_date, artists, event, venue, city'

const toConcert = (row) => ({
  id: row.id,
  date: row.date,
  endDate: row.end_date,
  dateLabel: formatConcertDate(row.date, row.end_date),
  artists: row.artists ?? [],
  event: row.event,
  venue: row.venue,
  city: row.city
})

const toRow = (data) => ({
  date: data.date,
  end_date: data.endDate,
  artists: data.artists,
  event: data.event,
  venue: data.venue,
  city: data.city
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

// For the public pages: years most recent first, concerts in chronological order inside a year.
// Never throws, so a Supabase outage shows an empty list instead of breaking the page.
export const getPastConcertsByYear = async () => {
  try {
    const concerts = (await listConcerts()).reverse()
    return groupByYear(concerts, (c) => yearOf(c.date)).map(({ year, items }) => ({ year, concerts: items }))
  } catch (error) {
    console.error('[lists] Could not load concerts', error)
    return []
  }
}

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
  const { error } = await getAdminClient().from('concerts').insert(toRow(data))
  if (error) throw error
}

export const updateConcert = async (id, data) => {
  const { error } = await getAdminClient().from('concerts').update(toRow(data)).eq('id', id)
  if (error) throw error
}

export const deleteConcert = async (id) => {
  const { error } = await getAdminClient().from('concerts').delete().eq('id', id)
  if (error) throw error
}

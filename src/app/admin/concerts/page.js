import Link from 'next/link'
import ConcertForm from '@/components/Admin/ConcertForm'
import CalendarPushButton from '@/components/Admin/CalendarPushButton'
import DeleteButton from '@/components/Admin/DeleteButton'
import YearGroup from '@/components/Admin/YearGroup'
import { deleteConcertAction } from '@/app/admin/actions/concerts'
import { requireAdmin } from '@/service/auth/admin'
import { concertSuggestions, isCalendarConfigured, listConcerts } from '@/service/lists/concerts'
import { groupByYear, isUpcoming, todayIso, yearOf } from '@/service/lists/format'

const ConcertRow = ({ concert, calendarStatus }) => (
  <li className="flex items-center gap-4 py-2">
    <span className="w-20 shrink-0 text-xs font-semibold text-contrast">{concert.dateLabel}</span>
    <span className={`min-w-0 flex-1 text-sm ${concert.maybe ? 'opacity-60' : ''}`}>
      <span className="font-semibold">{concert.artists.join(', ')}</span>{' '}
      <span className="opacity-70">— {[concert.event, concert.venue, concert.city].filter(Boolean).join(', ')}</span>
      {concert.maybe && <span className="ml-2 text-xs">(maybe)</span>}
    </span>
    {calendarStatus && (
      <span className={`text-xs ${concert.inCalendar ? 'opacity-60' : 'text-contrast'}`}>
        {concert.inCalendar ? 'In calendar' : 'Not in calendar'}
      </span>
    )}
    <Link href={`/admin/concerts/${concert.id}`} className="text-sm hover:underline">
      Edit
    </Link>
    <DeleteButton action={deleteConcertAction} id={concert.id} label={concert.artists.join(', ')} />
  </li>
)

const listClass = 'flex flex-col divide-y divide-[rgba(240,240,201,0.15)]'

export default async function AdminConcertsPage() {
  await requireAdmin()
  const concerts = await listConcerts()
  const today = todayIso()
  const upcoming = concerts.filter((c) => isUpcoming(c, today)).reverse()
  const past = concerts.filter((c) => !isUpcoming(c, today))
  const groups = groupByYear(past, (c) => yearOf(c.date))
  const calendarOn = isCalendarConfigured()
  const missing = upcoming.filter((c) => !c.inCalendar).length

  return (
    <div className="flex flex-col gap-12 pb-16">
      <section>
        <h1>Concerts</h1>
        <h2>Add a concert</h2>
        <p className="text-sm opacity-80 mb-4 max-w-xl">
          Upcoming concerts are added to the Google Calendar when saved
          {calendarOn ? '.' : ' — not configured yet (GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_CALENDAR_ID).'}
        </p>
        <ConcertForm suggestions={concertSuggestions(concerts)} />
      </section>

      <section>
        <h2>Upcoming ({upcoming.length})</h2>
        {calendarOn && missing > 0 && <CalendarPushButton count={missing} />}
        {upcoming.length ? (
          <ul className={listClass}>
            {upcoming.map((concert) => (
              <ConcertRow key={concert.id} concert={concert} calendarStatus={calendarOn} />
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-80">No upcoming concerts.</p>
        )}
      </section>

      <section>
        <h2>Past concerts ({past.length})</h2>
        {/* Accordion with the latest year open */}
        {groups.map(({ year, items }, i) => (
          <YearGroup key={year} year={year} count={items.length} unit="concert" open={i === 0} accordion="admin-concert-years">
            <ul className={listClass}>
              {items.map((concert) => (
                <ConcertRow key={concert.id} concert={concert} />
              ))}
            </ul>
          </YearGroup>
        ))}
      </section>
    </div>
  )
}

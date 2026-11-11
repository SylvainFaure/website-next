import Link from 'next/link'
import ConcertForm from '@/components/Admin/ConcertForm'
import DeleteButton from '@/components/Admin/DeleteButton'
import YearGroup from '@/components/Admin/YearGroup'
import { deleteConcertAction } from '@/app/admin/actions/concerts'
import { requireAdmin } from '@/service/auth/admin'
import { concertSuggestions, listConcerts } from '@/service/lists/concerts'
import { groupByYear, yearOf } from '@/service/lists/format'

export default async function AdminConcertsPage() {
  await requireAdmin()
  const concerts = await listConcerts()
  const groups = groupByYear(concerts, (c) => yearOf(c.date))

  return (
    <div className="flex flex-col gap-12 pb-16">
      <section>
        <h1>Concerts</h1>
        <h2>Add a concert</h2>
        <ConcertForm suggestions={concertSuggestions(concerts)} />
      </section>

      <section>
        <h2>All concerts ({concerts.length})</h2>
        {/* Accordion with the latest year open */}
        {groups.map(({ year, items }, i) => (
          <YearGroup key={year} year={year} count={items.length} unit="concert" open={i === 0} accordion="admin-concert-years">
            <ul className="flex flex-col divide-y divide-[rgba(240,240,201,0.15)]">
              {items.map((concert) => (
                <li key={concert.id} className="flex items-center gap-4 py-2">
                  <span className="w-20 shrink-0 text-xs font-semibold text-contrast">{concert.dateLabel}</span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{concert.artists.join(', ')}</span>{' '}
                    <span className="opacity-70">
                      — {[concert.event, concert.venue, concert.city].filter(Boolean).join(', ')}
                    </span>
                  </span>
                  <Link href={`/admin/concerts/${concert.id}`} className="text-sm hover:underline">
                    Edit
                  </Link>
                  <DeleteButton action={deleteConcertAction} id={concert.id} label={concert.artists.join(', ')} />
                </li>
              ))}
            </ul>
          </YearGroup>
        ))}
      </section>
    </div>
  )
}

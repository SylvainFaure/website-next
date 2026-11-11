'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import PastEvent from '@/components/PastEvent'
import ListSearch from '@/components/ListSearch'
import YearNav from '@/components/YearNav'
import useYearNav, { sectionId } from '@/utils/useYearNav'
import { matchesQuery } from '@/utils/search'

const concertFields = (concert) => [
  concert.dateLabel,
  concert.venue,
  concert.city,
  concert.event,
  ...(concert.artists ?? [])
]

// concertsByYear: [{ year, concerts: [{ id, dateLabel, artists, event, venue, city }] }]
const PastConcerts = ({ concertsByYear = [], image }) => {
  const [query, setQuery] = useState('')

  const filteredPastEventsByYear = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return concertsByYear

    return concertsByYear
      .map(({ year, concerts }) => ({
        year,
        concerts: (concerts ?? []).filter((concert) => matchesQuery(concertFields(concert), q))
      }))
      .filter(({ concerts }) => concerts.length > 0)
  }, [concertsByYear, query])

  const navItems = useMemo(
    () => filteredPastEventsByYear.map(({ year }) => ({ key: String(year), label: String(year) })),
    [filteredPastEventsByYear]
  )
  const keys = useMemo(() => navItems.map(({ key }) => key), [navItems])
  const { activeKey, scrollTo } = useYearNav(keys)

  const resultsCount = filteredPastEventsByYear.reduce((acc, y) => acc + y.concerts.length, 0)

  return (
    <div>
      {image?.src ? (
        <Image
          className="mt-6 mb-8 rounded-md"
          src={image.src}
          alt={image.alt ?? ''}
          width={image.width ?? 1200}
          height={image.height ?? 800}
          priority={image.priority ?? true}
        />
      ) : null}

      <div className={['flex items-start gap-8', image?.src ? 'pt-4' : 'pt-24'].join(' ')}>
        <YearNav items={navItems} activeKey={activeKey} onSelect={scrollTo} />

        <section className="min-w-0 flex-1 pb-12">
          <h1 className="text-2xl font-semibold !pb-0">Past concerts</h1>
          <p className="text-text text-sm pb-4">This is the list of concerts I have been to</p>

          <ListSearch
            value={query}
            onChange={setQuery}
            placeholder="Search by band, venue or date…"
            resultsCount={resultsCount}
          />

          {!filteredPastEventsByYear.length ? (
            <p className="text-text text-sm opacity-80">No results.</p>
          ) : (
            filteredPastEventsByYear.map(({ year, concerts }) => (
              <div key={`year-${year}`}>
                <h3
                  id={sectionId(year)}
                  className="scroll-mt-28 !text-[62px] text-shadow-lg text-shadow-year font-semibold mt-4 text-text-bg"
                >
                  {year}
                </h3>
                <div className="flex flex-col gap-2">
                  {concerts.map(({ id, dateLabel, ...concert }) => (
                    <PastEvent key={`past-event-${id}`} {...concert} date={dateLabel} query={query} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

export default PastConcerts

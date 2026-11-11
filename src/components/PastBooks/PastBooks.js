'use client'

import { useMemo, useState } from 'react'
import BookItem from '@/components/BookItem'
import EditionFilter from '@/components/EditionFilter'
import { countBy, matchesBookFilters } from '@/service/lists/bookFilters'
import LangFilter from '@/components/LangFilter'
import LangFlag from '@/components/LangFlag'
import ListSearch from '@/components/ListSearch'
import YearNav from '@/components/YearNav'
import useYearNav, { sectionId } from '@/utils/useYearNav'
import { highlight, matchesQuery } from '@/utils/search'

const EARLIER_KEY = 'earlier'
const yearHeadingClass = 'scroll-mt-28 !text-[62px] text-shadow-lg text-shadow-year font-semibold mt-4 text-text-bg'

const bookFields = (book) => [book.title, book.author, book.edition]

const PastBooks = ({ booksByYear = [], earlierBooks = [] }) => {
  const [query, setQuery] = useState('')
  const [lang, setLang] = useState(null)
  const [edition, setEdition] = useState(null)

  // Counts on the full list, so the filter options don't change while searching
  const { langCounts, editionCounts } = useMemo(() => {
    const all = [...booksByYear.flatMap(({ books }) => books), ...earlierBooks]
    return { langCounts: countBy(all, (b) => b.lang), editionCounts: countBy(all, (b) => b.edition) }
  }, [booksByYear, earlierBooks])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q && !lang && !edition) return { byYear: booksByYear, earlier: earlierBooks }
    const keep = (book) =>
      matchesBookFilters(book, { lang: lang ?? '', edition: edition ?? '' }) &&
      (!q || matchesQuery(bookFields(book), q))
    return {
      byYear: booksByYear
        .map(({ year, books }) => ({ year, books: books.filter(keep) }))
        .filter(({ books }) => books.length > 0),
      earlier: earlierBooks.filter(keep)
    }
  }, [booksByYear, earlierBooks, query, lang, edition])

  // Label of the last section, based on the full list so it doesn't change while filtering
  const oldestYear = booksByYear.at(-1)?.year
  const earlierLabel = oldestYear ? `Before ${oldestYear}` : 'Earlier'

  const navItems = useMemo(
    () => [
      ...filtered.byYear.map(({ year }) => ({ key: String(year), label: String(year) })),
      ...(filtered.earlier.length ? [{ key: EARLIER_KEY, label: 'Earlier' }] : [])
    ],
    [filtered]
  )
  const keys = useMemo(() => navItems.map(({ key }) => key), [navItems])
  const { activeKey, scrollTo } = useYearNav(keys)

  const resultsCount = filtered.byYear.reduce((acc, y) => acc + y.books.length, 0) + filtered.earlier.length
  const isFiltering = !!query.trim() || !!lang || !!edition

  return (
    <div className="flex items-start gap-8 pt-24">
      <YearNav items={navItems} activeKey={activeKey} onSelect={scrollTo} />

      <section className="min-w-0 flex-1 pb-12">
        <h1 className="text-2xl font-semibold !pb-0">Books</h1>
        <p className="text-text text-sm pb-4">This is the list of books I have read</p>

        <ListSearch
          value={query}
          onChange={setQuery}
          placeholder="Search by title, author or edition…"
          resultsCount={resultsCount}
        >
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <LangFilter value={lang} onChange={setLang} counts={langCounts} />
            <EditionFilter value={edition} onChange={setEdition} counts={editionCounts} />
          </div>
        </ListSearch>

        {!resultsCount && <p className="text-text text-sm opacity-80">{isFiltering ? 'No results.' : 'No books yet.'}</p>}

        {filtered.byYear.map(({ year, books }) => (
          <div key={`year-${year}`}>
            <h3 id={sectionId(year)} className={yearHeadingClass}>
              {year}
            </h3>
            <div className="flex flex-col gap-4 pt-2">
              {books.map((book) => (
                <BookItem key={book.id} {...book} query={query} />
              ))}
            </div>
          </div>
        ))}

        {!!filtered.earlier.length && (
          <div>
            <h3 id={sectionId(EARLIER_KEY)} className={yearHeadingClass}>
              {earlierLabel}
            </h3>
            <ul className="list-disc pl-5 flex flex-col gap-1 pt-2 text-text">
              {filtered.earlier.map((book) => (
                <li key={book.id}>
                  <span className="font-semibold">{highlight(book.title, query)}</span>
                  <LangFlag lang={book.lang} className="ml-2 align-middle" /> — {highlight(book.author, query)}
                  {book.edition && <span className="opacity-70"> · {highlight(book.edition, query)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

export default PastBooks

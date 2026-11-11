import CoverZoom from '@/components/CoverZoom'
import Link from 'next/link'
import BookFilters from '@/components/Admin/BookFilters'
import BookForm from '@/components/Admin/BookForm'
import ScrollToElement from '@/components/Admin/ScrollToElement'
import YearGroup from '@/components/Admin/YearGroup'
import { BOOK_LANGUAGES } from '@/service/lists/languages'
import { parseId } from '@/service/lists/validation'
import {
  EARLIER,
  NO_EDITION,
  bookFiltersQuery,
  byLastName,
  countBy,
  hasActiveFilters,
  matchesBookFilters,
  parseBookFilters
} from '@/service/lists/bookFilters'
import DeleteButton from '@/components/Admin/DeleteButton'
import LangFlag from '@/components/LangFlag'
import { deleteBookAction } from '@/app/admin/actions/books'
import { requireAdmin } from '@/service/auth/admin'
import { bookSuggestions, getBooksForAdmin } from '@/service/lists/books'

// filterQuery: current filters, carried to the edit page so saving comes back to the same filtered list
const BookRow = ({ book, filterQuery, highlighted }) => (
  <li
    id={`book-${book.id}`}
    className={`flex items-center gap-4 py-2 ${highlighted ? 'rounded-md bg-[rgba(242,187,5,0.12)] px-2' : ''}`}
  >
    {book.cover ? (
      <CoverZoom src={book.cover} alt={`Cover of ${book.title}`} width={48} height={72} className="w-12 h-[72px]" />
    ) : (
      <span className="w-12 h-[72px] rounded-sm shrink-0 border border-[rgba(240,240,201,0.25)]" aria-hidden />
    )}
    <span className="min-w-0 flex-1 text-sm">
      <span className="font-semibold">{book.title}</span>{' '}
      <span className="opacity-70">
        — {book.author}
        {book.edition && ` · ${book.edition}`}
      </span>
      <LangFlag lang={book.lang} />
    </span>
    <Link href={`/admin/books/${book.id}${filterQuery ? `?${filterQuery}` : ''}`} className="text-sm hover:underline">
      Edit
    </Link>
    <DeleteButton action={deleteBookAction} id={book.id} label={`“${book.title}”`} />
  </li>
)

const withCounts = (counts, label = (value) => value) => (value) => ({
  value,
  label: `${label(value)} (${counts[value] ?? 0})`
})

const filterOptions = (all, earlierCount) => {
  const years = countBy(all, (b) => b.year)
  const authors = countBy(all, (b) => b.author)
  const editions = countBy(all, (b) => b.edition)
  const langs = countBy(all, (b) => b.lang)
  const withoutEdition = all.filter((b) => !b.edition).length
  return {
    years: [
      ...Object.keys(years).sort((a, b) => b - a).map(withCounts(years)),
      ...(earlierCount ? [{ value: EARLIER, label: `Earlier (${earlierCount})` }] : [])
    ],
    authors: Object.keys(authors).sort(byLastName).map(withCounts(authors)),
    editions: [
      ...Object.keys(editions).sort((a, b) => a.localeCompare(b)).map(withCounts(editions)),
      ...(withoutEdition ? [{ value: NO_EDITION, label: `— No publisher (${withoutEdition})` }] : [])
    ],
    langs: Object.keys(BOOK_LANGUAGES).filter((code) => langs[code]).map(withCounts(langs, (code) => BOOK_LANGUAGES[code]))
  }
}

export default async function AdminBooksPage({ searchParams }) {
  await requireAdmin()
  const params = await searchParams
  const filters = parseBookFilters(params)
  // Book just saved from its edit page: its year is opened and the list scrolls to it
  const editedId = parseId(params.edited)
  const { byYear, earlier } = await getBooksForAdmin()
  const all = [...byYear.flatMap(({ books }) => books), ...earlier]
  const keep = (book) => matchesBookFilters(book, filters)
  const groups = [...byYear, ...(earlier.length ? [{ year: 'Earlier', books: earlier }] : [])]
    .map(({ year, books }) => ({ year, books: books.filter(keep) }))
    .filter(({ books }) => books.length > 0)
  const shown = groups.reduce((acc, { books }) => acc + books.length, 0)
  const filtering = hasActiveFilters(filters)
  const editedGroup = editedId ? groups.findIndex(({ books }) => books.some((b) => b.id === editedId)) : -1
  const openGroup = editedGroup === -1 ? 0 : editedGroup

  return (
    <div className="flex flex-col gap-12 pb-16">
      <section>
        <h1>Books</h1>
        <h2>Add a book</h2>
        <BookForm suggestions={bookSuggestions(all)} />
      </section>

      <section>
        <h2>All books ({all.length})</h2>
        <BookFilters filters={filters} options={filterOptions(all, earlier.length)} shown={shown} total={all.length} />
        {editedGroup !== -1 && <ScrollToElement id={`book-${editedId}`} />}
        {!shown && <p className="text-sm opacity-80">No books match these filters.</p>}
        {/* Accordion with the latest year open; while filtering, every matching year is open */}
        {groups.map(({ year, books }, i) => (
          <YearGroup
            key={year}
            year={year}
            count={books.length}
            unit="book"
            open={filtering || i === openGroup}
            accordion={filtering ? undefined : 'admin-book-years'}
          >
            <ul className="flex flex-col divide-y divide-[rgba(240,240,201,0.15)]">
              {books.map((book) => (
                <BookRow
                  key={book.id}
                  book={book}
                  filterQuery={bookFiltersQuery(filters)}
                  highlighted={book.id === editedId}
                />
              ))}
            </ul>
          </YearGroup>
        ))}
      </section>
    </div>
  )
}

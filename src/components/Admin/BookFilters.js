'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bookFiltersQuery } from '@/service/lists/bookFilters'

const selectClass =
  'rounded-md px-2 py-1.5 text-sm bg-[rgba(31,41,53,0.55)] border border-[rgba(240,240,201,0.25)] text-text outline-none focus:border-[rgba(242,187,5,0.6)] max-w-56'

const FilterSelect = ({ label, value, options, onChange }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs font-semibold text-text">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">All</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

// Filters live in the URL (?year=&author=&edition=&lang=) so a filtered view can be reloaded or bookmarked.
// options: { years, authors, editions, langs }, each [{ value, label }]
const BookFilters = ({ filters, options, shown, total }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const navigate = (next) => {
    const query = bookFiltersQuery(next)
    startTransition(() => router.replace(`/admin/books${query ? `?${query}` : ''}`, { scroll: false }))
  }
  const set = (key) => (value) => navigate({ ...filters, [key]: value })
  const active = Object.values(filters).some(Boolean)

  return (
    <div className={`flex flex-wrap items-end gap-3 pb-6 transition-opacity ${pending ? 'opacity-60' : ''}`}>
      <FilterSelect label="Year" value={filters.year} options={options.years} onChange={set('year')} />
      <FilterSelect label="Author" value={filters.author} options={options.authors} onChange={set('author')} />
      <FilterSelect label="Publisher" value={filters.edition} options={options.editions} onChange={set('edition')} />
      <FilterSelect label="Language" value={filters.lang} options={options.langs} onChange={set('lang')} />
      {active && (
        <button
          type="button"
          onClick={() => navigate({})}
          className="py-1.5 text-sm font-semibold opacity-70 hover:opacity-100"
        >
          Reset
        </button>
      )}
      <span className="py-1.5 text-xs opacity-70">
        {shown} of {total} books
      </span>
    </div>
  )
}

export default BookFilters

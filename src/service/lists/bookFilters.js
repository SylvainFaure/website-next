// Book list filters (year, author, publisher, language), shared by the admin and the public page.
// Pure module (no framework imports, unit-tested).

import { isBookLanguage } from './languages.js'

export const EARLIER = 'earlier'
export const NO_EDITION = '__none'

const first = (value) => (Array.isArray(value) ? value[0] : value) ?? ''

// Reads filters from URL search params; invalid values are ignored.
export const parseBookFilters = (params = {}) => {
  const year = String(first(params.year))
  const lang = String(first(params.lang))
  return {
    year: year === EARLIER || /^\d{4}$/.test(year) ? year : '',
    author: String(first(params.author)).slice(0, 200),
    edition: String(first(params.edition)).slice(0, 200),
    lang: isBookLanguage(lang) ? lang : ''
  }
}

export const hasActiveFilters = (filters) => Object.values(filters).some(Boolean)

// Filters → query string without the "?" ('' when no filter is active)
export const bookFiltersQuery = (filters) =>
  new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString()

// Admin list URL for a raw query string (e.g. from a form field). The string is re-parsed,
// so only valid filters survive and the path can't be changed (no open redirect).
// `edited` (not a #hash: Next.js drops it on server action redirects) lets the list scroll to that book.
export const adminBooksUrl = (rawQuery = '', bookId) => {
  const params = new URLSearchParams(bookFiltersQuery(parseBookFilters(Object.fromEntries(new URLSearchParams(String(rawQuery))))))
  if (Number.isInteger(bookId) && bookId > 0) params.set('edited', String(bookId))
  const query = params.toString()
  return `/admin/books${query ? `?${query}` : ''}`
}

export const matchesBookFilters = (book, { year = '', author = '', edition = '', lang = '' } = {}) =>
  (!year || (year === EARLIER ? book.year === null : book.year === Number(year))) &&
  (!author || book.author === author) &&
  (!edition || (edition === NO_EDITION ? !book.edition : book.edition === edition)) &&
  (!lang || book.lang === lang)

// { value: count } for a book field, ignoring empty values
export const countBy = (books, getValue) =>
  books.reduce((acc, book) => {
    const value = getValue(book)
    if (value !== null && value !== undefined && value !== '') acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})

const lastName = (author) => author.trim().split(/\s+/).at(-1)

export const byLastName = (a, b) => lastName(a).localeCompare(lastName(b)) || a.localeCompare(b)

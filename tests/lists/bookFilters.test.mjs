import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  EARLIER,
  NO_EDITION,
  adminBooksUrl,
  bookFiltersQuery,
  byLastName,
  countBy,
  hasActiveFilters,
  matchesBookFilters,
  parseBookFilters
} from '../../src/service/lists/bookFilters.js'

const books = [
  { id: 1, title: 'Kairos', author: 'Jenny Erpenbeck', edition: 'Sellerio', lang: 'it', year: 2025 },
  { id: 2, title: "L'Anomalie", author: 'Hervé Le Tellier', edition: null, lang: 'fr', year: 2022 },
  { id: 3, title: 'Le Grand Meaulnes', author: 'Alain-Fournier', edition: 'Folio', lang: 'fr', year: null }
]
const ids = (filters) => books.filter((b) => matchesBookFilters(b, filters)).map((b) => b.id)

test('parseBookFilters keeps valid values and drops invalid ones', () => {
  assert.deepEqual(parseBookFilters({ year: '2025', author: 'Jenny Erpenbeck', edition: 'Sellerio', lang: 'it' }), {
    year: '2025',
    author: 'Jenny Erpenbeck',
    edition: 'Sellerio',
    lang: 'it'
  })
  assert.deepEqual(parseBookFilters({ year: '25', lang: 'en' }), { year: '', author: '', edition: '', lang: '' })
  assert.equal(parseBookFilters({ year: EARLIER }).year, EARLIER)
  assert.equal(parseBookFilters({ year: ['2024', '2025'] }).year, '2024')
  assert.equal(parseBookFilters({ author: 'x'.repeat(500) }).author.length, 200)
  assert.deepEqual(parseBookFilters(), { year: '', author: '', edition: '', lang: '' })
})

test('matchesBookFilters combines every filter', () => {
  assert.deepEqual(ids({}), [1, 2, 3])
  assert.deepEqual(ids({ year: '2025' }), [1])
  assert.deepEqual(ids({ year: EARLIER }), [3])
  assert.deepEqual(ids({ lang: 'fr' }), [2, 3])
  assert.deepEqual(ids({ edition: 'Folio' }), [3])
  assert.deepEqual(ids({ edition: NO_EDITION }), [2])
  assert.deepEqual(ids({ author: 'Hervé Le Tellier', lang: 'fr' }), [2])
  assert.deepEqual(ids({ author: 'Hervé Le Tellier', lang: 'it' }), [])
})

test('bookFiltersQuery round-trips through parseBookFilters', () => {
  const filters = parseBookFilters({ year: '2025', author: 'Hervé Le Tellier', lang: 'fr' })
  const query = bookFiltersQuery(filters)
  assert.equal(query, 'year=2025&author=Herv%C3%A9+Le+Tellier&lang=fr')
  assert.deepEqual(parseBookFilters(Object.fromEntries(new URLSearchParams(query))), filters)
  assert.equal(bookFiltersQuery(parseBookFilters({})), '')
})

test('adminBooksUrl keeps valid filters only and never leaves /admin/books', () => {
  assert.equal(adminBooksUrl('lang=fr&year=2025', 42), '/admin/books?year=2025&lang=fr&edited=42')
  assert.equal(adminBooksUrl('', 42), '/admin/books?edited=42')
  assert.equal(adminBooksUrl('edited=7'), '/admin/books') // only the id passed explicitly is kept
  assert.equal(adminBooksUrl(), '/admin/books')
  assert.equal(adminBooksUrl('lang=en&evil=https://evil.com&year=abc'), '/admin/books')
  assert.equal(adminBooksUrl('//evil.com'), '/admin/books')
})

test('hasActiveFilters', () => {
  assert.equal(hasActiveFilters(parseBookFilters({})), false)
  assert.equal(hasActiveFilters(parseBookFilters({ lang: 'fr' })), true)
})

test('countBy ignores empty values', () => {
  assert.deepEqual(countBy(books, (b) => b.edition), { Sellerio: 1, Folio: 1 })
  assert.deepEqual(countBy(books, (b) => b.lang), { it: 1, fr: 2 })
})

test('byLastName sorts authors by last name', () => {
  assert.deepEqual(['Jenny Erpenbeck', 'Alain-Fournier', 'Hervé Le Tellier', 'Elsa Morante'].sort(byLastName), [
    'Alain-Fournier',
    'Jenny Erpenbeck',
    'Elsa Morante',
    'Hervé Le Tellier'
  ])
})

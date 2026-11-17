import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeIsbn,
  parseBookForm,
  parseConcertForm,
  parseId,
  sniffImageType
} from '../../src/service/lists/validation.js'

const form = (fields) => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) fd.append(key, value)
  return fd
}

const validConcert = {
  date: '2024-06-04',
  endDate: '',
  artists: 'Dry Cleaning\n  New Candys \n\n',
  event: 'Ferrara Sotto le Stelle',
  venue: 'Piazza Castello',
  city: 'Ferrara'
}

test('parseConcertForm accepts a valid concert and normalises fields', () => {
  const { data, errors } = parseConcertForm(form(validConcert))
  assert.equal(errors, undefined)
  assert.deepEqual(data, {
    date: '2024-06-04',
    endDate: null,
    artists: ['Dry Cleaning', 'New Candys'],
    event: 'Ferrara Sotto le Stelle',
    venue: 'Piazza Castello',
    city: 'Ferrara',
    maybe: false
  })
  assert.equal(parseConcertForm(form({ ...validConcert, maybe: 'on' })).data.maybe, true)
})

test('parseConcertForm reports missing required fields', () => {
  const { errors } = parseConcertForm(form({ date: '', artists: ' \n ', venue: '', city: '' }))
  assert.deepEqual(Object.keys(errors).sort(), ['artists', 'city', 'date', 'venue'])
})

test('parseConcertForm rejects impossible dates and end dates before the start', () => {
  assert.ok(parseConcertForm(form({ ...validConcert, date: '2024-02-30' })).errors.date)
  assert.ok(parseConcertForm(form({ ...validConcert, endDate: '2024-06-01' })).errors.endDate)
})

test('parseConcertForm keeps a multi-day range and drops an end date equal to the start', () => {
  assert.equal(parseConcertForm(form({ ...validConcert, endDate: '2024-06-06' })).data.endDate, '2024-06-06')
  assert.equal(parseConcertForm(form({ ...validConcert, endDate: '2024-06-04' })).data.endDate, null)
})

test('parseConcertForm limits text length', () => {
  assert.ok(parseConcertForm(form({ ...validConcert, venue: 'x'.repeat(201) })).errors.venue)
})

test('parseBookForm accepts a book without year (earlier list) or cover', () => {
  const result = parseBookForm(form({ title: ' La Storia ', author: 'Elsa Morante', edition: '', lang: 'it', year: '' }))
  assert.deepEqual(result.data, {
    title: 'La Storia',
    author: 'Elsa Morante',
    edition: null,
    lang: 'it',
    isbn: null,
    year: null
  })
  assert.equal(result.cover, null)
  assert.equal(result.removeCover, false)
})

test('parseBookForm requires a known language', () => {
  const base = { title: 'Kairos', author: 'Jenny Erpenbeck' }
  assert.equal(parseBookForm(form({ ...base, lang: 'fr' })).data.lang, 'fr')
  for (const lang of [undefined, '', 'en', 'IT', 'constructor', '__proto__']) {
    const fields = lang === undefined ? base : { ...base, lang }
    assert.ok(parseBookForm(form(fields)).errors.lang, String(lang))
  }
})

test('parseBookForm validates the year', () => {
  const base = { title: 'Kairos', author: 'Jenny Erpenbeck', lang: 'it' }
  assert.equal(parseBookForm(form({ ...base, year: '2025' }), { currentYear: 2026 }).data.year, 2025)
  for (const year of ['1850', '2030', '20x5', '25']) {
    assert.ok(parseBookForm(form({ ...base, year }), { currentYear: 2026 }).errors.year, year)
  }
})

test('parseBookForm validates the cover type and size', () => {
  const base = { title: 'Kairos', author: 'Jenny Erpenbeck', lang: 'it' }
  const ok = parseBookForm(form({ ...base, cover: new File([new Uint8Array(10)], 'c.jpg', { type: 'image/jpeg' }) }))
  assert.ok(ok.cover)
  const svg = parseBookForm(form({ ...base, cover: new File(['<svg/>'], 'c.svg', { type: 'image/svg+xml' }) }))
  assert.ok(svg.errors.cover)
  const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'c.png', { type: 'image/png' })
  assert.ok(parseBookForm(form({ ...base, cover: big })).errors.cover)
  const empty = parseBookForm(form({ ...base, cover: new File([], '', { type: 'application/octet-stream' }) }))
  assert.equal(empty.cover, null)
})

test('sniffImageType recognises real image signatures only', () => {
  assert.equal(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'image/jpeg')
  assert.equal(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), 'image/png')
  const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')
  assert.equal(sniffImageType(webp), 'image/webp')
  assert.equal(sniffImageType(new TextEncoder().encode('<svg onload=alert(1)>')), null)
  assert.equal(sniffImageType(new Uint8Array([])), null)
})

test('normalizeIsbn validates and converts to ISBN-13', () => {
  assert.equal(normalizeIsbn('978-2-07-296582-1'), '9782072965821')
  assert.equal(normalizeIsbn(' 9788806272364 '), '9788806272364')
  assert.equal(normalizeIsbn('2-07-036822-X'), '9782070368228') // ISBN-10 with X check digit
  for (const bad of ['9782072965822', '978207296582', '2070368229', 'abc', '', null]) {
    assert.equal(normalizeIsbn(bad), null, String(bad))
  }
})

test('parseBookForm normalises an optional ISBN', () => {
  const base = { title: "L'Anomalie", author: 'Hervé Le Tellier', lang: 'fr' }
  assert.equal(parseBookForm(form(base)).data.isbn, null)
  assert.equal(parseBookForm(form({ ...base, isbn: '978-2-07-296582-1' })).data.isbn, '9782072965821')
  assert.ok(parseBookForm(form({ ...base, isbn: '123' })).errors.isbn)
})

test('parseId accepts positive integers only', () => {
  assert.equal(parseId('42'), 42)
  for (const bad of ['0', '-1', '1.5', 'abc', '', null, undefined, '1e3']) assert.equal(parseId(bad), null, String(bad))
})

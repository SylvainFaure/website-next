// Pure form parsing/validation for the lists CMS (no framework imports, unit-tested).
// Each parser returns either { errors } (field → message) or { data }.

import { isBookLanguage } from './languages.js'

export const COVER_MAX_BYTES = 4 * 1024 * 1024
export const COVER_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const MAX_ARTISTS = 50

const str = (formData, name) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

const text = (errors, field, value, { label, required = false, max = 200 }) => {
  if (!value) {
    if (required) errors[field] = `${label} is required.`
    return null
  }
  if (value.length > max) errors[field] = `${label} must be at most ${max} characters.`
  return value
}

const result = (errors, payload) => (Object.keys(errors).length ? { errors } : payload)

// Raw string values, used to refill a form after a validation error.
export const formValues = (formData, names) => Object.fromEntries(names.map((name) => [name, str(formData, name)]))

const isbn13CheckDigit = (first12) => {
  const sum = [...first12].reduce((acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1), 0)
  return String((10 - (sum % 10)) % 10)
}

// Returns the ISBN-13 (ISBN-10 is converted), or null if invalid.
export const normalizeIsbn = (value) => {
  const s = String(value ?? '').replace(/[\s-]/g, '').toUpperCase()
  if (/^97[89]\d{10}$/.test(s)) return isbn13CheckDigit(s.slice(0, 12)) === s[12] ? s : null
  if (/^\d{9}[\dX]$/.test(s)) {
    const sum = [...s].reduce((acc, c, i) => acc + (c === 'X' ? 10 : Number(c)) * (10 - i), 0)
    if (sum % 11 !== 0) return null
    const first12 = `978${s.slice(0, 9)}`
    return first12 + isbn13CheckDigit(first12)
  }
  return null
}

export const parseId = (value) => {
  const s = String(value ?? '').trim()
  return /^[1-9]\d{0,14}$/.test(s) ? Number(s) : null
}

export const parseConcertForm = (formData) => {
  const errors = {}

  const date = str(formData, 'date')
  if (!isValidIsoDate(date)) errors.date = 'A valid date is required.'

  let endDate = str(formData, 'endDate') || null
  if (endDate) {
    if (!isValidIsoDate(endDate)) errors.endDate = 'Invalid end date.'
    else if (!errors.date && endDate < date) errors.endDate = 'The end date must be after the start date.'
    else if (endDate === date) endDate = null
  }

  const artists = str(formData, 'artists')
    .split('\n')
    .map((artist) => artist.trim())
    .filter(Boolean)
  if (!artists.length) errors.artists = 'At least one artist is required.'
  else if (artists.length > MAX_ARTISTS) errors.artists = `At most ${MAX_ARTISTS} artists.`
  else if (artists.some((artist) => artist.length > 200)) errors.artists = 'Artist names must be at most 200 characters.'

  const data = {
    date,
    endDate,
    artists,
    event: text(errors, 'event', str(formData, 'event'), { label: 'Event' }),
    venue: text(errors, 'venue', str(formData, 'venue'), { label: 'Venue', required: true }),
    city: text(errors, 'city', str(formData, 'city'), { label: 'City', required: true }),
    maybe: formData.get('maybe') === 'on'
  }

  return result(errors, { data })
}

export const parseBookForm = (formData, { currentYear = new Date().getFullYear() } = {}) => {
  const errors = {}

  const data = {
    title: text(errors, 'title', str(formData, 'title'), { label: 'Title', required: true, max: 300 }),
    author: text(errors, 'author', str(formData, 'author'), { label: 'Author', required: true }),
    edition: text(errors, 'edition', str(formData, 'edition'), { label: 'Edition' }),
    lang: str(formData, 'lang'),
    year: null
  }

  if (!isBookLanguage(data.lang)) errors.lang = 'Choose a language.'

  data.isbn = null
  const isbn = str(formData, 'isbn')
  if (isbn) {
    data.isbn = normalizeIsbn(isbn)
    if (!data.isbn) errors.isbn = 'Invalid ISBN (10 or 13 digits, dashes allowed).'
  }

  const year = str(formData, 'year')
  if (year) {
    const n = Number(year)
    if (!/^\d{4}$/.test(year) || n < 1900 || n > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}, or empty for "earlier".`
    } else {
      data.year = n
    }
  }

  const file = formData.get('cover')
  const cover = file && typeof file === 'object' && file.size > 0 ? file : null
  if (cover) {
    if (!COVER_TYPES[cover.type]) errors.cover = 'The cover must be a JPEG, PNG or WebP image.'
    else if (cover.size > COVER_MAX_BYTES) errors.cover = 'The cover must be 4 MB or less.'
  }

  return result(errors, { data, cover, removeCover: formData.get('removeCover') === 'on' })
}

// Detects the real image type from the file's first bytes: the browser-provided MIME type can't be trusted.
export const sniffImageType = (bytes) => {
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end))
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => bytes[i] === byte)) return 'image/png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

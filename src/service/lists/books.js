import 'server-only'
import { COVERS_BUCKET, coverUrl, getAdminClient, getPublicClient } from '@/service/supabase'
import { byAuthorThenTitle, groupByYear, uniqueSorted } from '@/service/lists/format'
import { COVER_TYPES } from '@/service/lists/validation'

const COLUMNS = 'id, title, author, edition, lang, isbn, year, cover_path'

const toBook = (row) => ({
  id: row.id,
  title: row.title,
  author: row.author,
  edition: row.edition,
  lang: row.lang,
  isbn: row.isbn,
  year: row.year,
  coverPath: row.cover_path,
  cover: coverUrl(row.cover_path)
})

const toRow = (data) => ({
  title: data.title,
  author: data.author,
  edition: data.edition,
  lang: data.lang,
  isbn: data.isbn,
  year: data.year
})

// In entry order.
export const listBooks = async () => {
  const { data, error } = await getPublicClient().from('books').select(COLUMNS).order('id')
  if (error) throw error
  return data.map(toBook)
}

const splitBooks = (books) => ({
  byYear: groupByYear(
    books.filter((b) => b.year !== null),
    (b) => b.year
  ).map(({ year, items }) => ({ year, books: items })),
  earlier: books.filter((b) => b.year === null).sort(byAuthorThenTitle)
})

// For the public page. Never throws, so a Supabase outage shows an empty list instead of breaking the page.
export const getBooks = async () => {
  try {
    return splitBooks(await listBooks())
  } catch (error) {
    console.error('[lists] Could not load books', error)
    return { byYear: [], earlier: [] }
  }
}

export const getBooksForAdmin = async () => splitBooks(await listBooks())

export const getBook = async (id) => {
  const { data, error } = await getPublicClient().from('books').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toBook(data) : null
}

export const bookSuggestions = (books) => ({
  authors: uniqueSorted(books.map((b) => b.author)),
  editions: uniqueSorted(books.map((b) => b.edition))
})

// cover: { bytes: Uint8Array, contentType } with a contentType already checked by sniffImageType
const uploadCover = async ({ bytes, contentType }) => {
  const path = `${crypto.randomUUID()}.${COVER_TYPES[contentType]}`
  const { error } = await getAdminClient()
    .storage.from(COVERS_BUCKET)
    .upload(path, bytes, { contentType, cacheControl: '31536000', upsert: false })
  if (error) throw error
  return path
}

// Best effort: an orphaned file is not worth failing the request for.
const removeCovers = async (paths) => {
  const existing = paths.filter(Boolean)
  if (!existing.length) return
  const { error } = await getAdminClient().storage.from(COVERS_BUCKET).remove(existing)
  if (error) console.error('[lists] Could not remove covers', existing, error)
}

export const createBook = async (data, cover) => {
  const coverPath = cover ? await uploadCover(cover) : null
  const { error } = await getAdminClient()
    .from('books')
    .insert({ ...toRow(data), cover_path: coverPath })
  if (error) {
    await removeCovers([coverPath])
    throw error
  }
}

export const updateBook = async (id, data, { cover, removeCover }) => {
  const existing = await getBook(id)
  if (!existing) throw new Error('Book not found')

  const newPath = cover ? await uploadCover(cover) : null
  const coverPath = newPath ?? (removeCover ? null : existing.coverPath)

  const { error } = await getAdminClient()
    .from('books')
    .update({ ...toRow(data), cover_path: coverPath })
    .eq('id', id)
  if (error) {
    await removeCovers([newPath])
    throw error
  }
  if (existing.coverPath !== coverPath) await removeCovers([existing.coverPath])
}

export const deleteBook = async (id) => {
  const { data, error } = await getAdminClient().from('books').delete().eq('id', id).select('cover_path')
  if (error) throw error
  await removeCovers(data.map((row) => row.cover_path))
}

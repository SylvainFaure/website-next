import Link from 'next/link'
import { notFound } from 'next/navigation'
import BookForm from '@/components/Admin/BookForm'
import { requireAdmin } from '@/service/auth/admin'
import { adminBooksUrl, bookFiltersQuery, parseBookFilters } from '@/service/lists/bookFilters'
import { bookSuggestions, getBook, listBooks } from '@/service/lists/books'
import { parseId } from '@/service/lists/validation'

export default async function EditBookPage({ params, searchParams }) {
  await requireAdmin()
  const id = parseId((await params).id)
  if (!id) notFound()

  // Filters of the list this page was opened from, to return to it after saving
  const filterQuery = bookFiltersQuery(parseBookFilters(await searchParams))

  const [book, books] = await Promise.all([getBook(id), listBooks()])
  if (!book) notFound()

  return (
    <div className="pb-16">
      <Link href={adminBooksUrl(filterQuery, id)} className="text-sm hover:underline">
        ← Back to books
      </Link>
      <h1>Edit book</h1>
      <BookForm book={book} suggestions={bookSuggestions(books)} returnQuery={filterQuery} />
    </div>
  )
}

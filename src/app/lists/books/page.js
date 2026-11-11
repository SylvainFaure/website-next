import DefaultLayout from '@/components/Layouts/DefaultLayout'
import PastBooks from '@/components/PastBooks'
import { getBooks } from '@/service/lists/books'

// Rebuilt at most hourly; admin edits revalidate it immediately.
export const revalidate = 3600

export default async function BooksPage() {
  const { byYear, earlier } = await getBooks()
  return (
    <DefaultLayout>
      <PastBooks booksByYear={byYear} earlierBooks={earlier} />
    </DefaultLayout>
  )
}

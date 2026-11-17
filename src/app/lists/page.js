import DefaultLayout from '@/components/Layouts/DefaultLayout'
import ListsHub from '@/components/ListsHub'
import { getConcertLists } from '@/service/lists/concerts'
import { getBooks } from '@/service/lists/books'
import { getDiscogsLists } from '@/service/discogs/releases'
import { listsOverview } from '@/service/lists/overview'

// Rebuilt at most hourly; admin edits to any list revalidate it immediately.
export const revalidate = 3600

export const metadata = {
  title: 'Lists · Sylvain Faure',
  description: 'Concerts, books and records I keep track of'
}

export default async function ListsPage() {
  // Each loader never throws (empty lists on error)
  const [concerts, books, records] = await Promise.all([getConcertLists(), getBooks(), getDiscogsLists()])
  return (
    <DefaultLayout>
      <ListsHub overview={listsOverview({ concerts, books, records })} />
    </DefaultLayout>
  )
}

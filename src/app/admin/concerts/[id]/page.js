import Link from 'next/link'
import { notFound } from 'next/navigation'
import ConcertForm from '@/components/Admin/ConcertForm'
import { requireAdmin } from '@/service/auth/admin'
import { concertSuggestions, getConcert, listConcerts } from '@/service/lists/concerts'
import { parseId } from '@/service/lists/validation'

export default async function EditConcertPage({ params }) {
  await requireAdmin()
  const id = parseId((await params).id)
  if (!id) notFound()

  const [concert, concerts] = await Promise.all([getConcert(id), listConcerts()])
  if (!concert) notFound()

  return (
    <div className="pb-16">
      <Link href="/admin/concerts" className="text-sm hover:underline">
        ← Back to concerts
      </Link>
      <h1>Edit concert</h1>
      <ConcertForm concert={concert} suggestions={concertSuggestions(concerts)} />
    </div>
  )
}

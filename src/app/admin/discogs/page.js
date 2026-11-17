import Link from 'next/link'
import { requireAdmin } from '@/service/auth/admin'
import { getDiscogsStats } from '@/service/discogs/releases'
import DiscogsSyncPanel from '@/components/Admin/DiscogsSyncPanel'

// Covers can take a few batches; each server action call stays well under this.
export const maxDuration = 60

const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(iso)) : 'never'

export default async function AdminDiscogsPage() {
  await requireAdmin()
  const stats = await getDiscogsStats()

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline gap-4 mb-6">
        <h1>Discogs</h1>
        <Link href="/lists/my-discogs" className="text-sm hover:underline">
          View page
        </Link>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          ['Wantlist', stats.wantlist],
          ['Collection', stats.collection],
          ['With a cover', `${stats.withCover} / ${stats.total}`],
          ['Last sync', formatDate(stats.lastSync)]
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[rgba(240,240,201,0.25)] p-4">
            <dt className="text-sm opacity-70">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <DiscogsSyncPanel unchecked={stats.unchecked} />
    </div>
  )
}

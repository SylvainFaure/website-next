import Link from 'next/link'
import { requireAdmin } from '@/service/auth/admin'

const SECTIONS = [
  { href: '/admin/concerts', label: 'Concerts', description: 'Past concerts shown on /lists/concerts/past' },
  { href: '/admin/books', label: 'Books', description: 'Books shown on /lists/books' },
  { href: '/admin/discogs', label: 'Discogs', description: 'Sync the wantlist and collection shown on /lists/my-discogs' },
  { href: '/admin/music', label: 'Music', description: 'Spotify connection and the listening history shown on /music' }
]

export default async function AdminHomePage() {
  await requireAdmin()

  return (
    <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
      {SECTIONS.map(({ href, label, description }) => (
        <Link
          key={href}
          href={href}
          className="rounded-md border border-[rgba(240,240,201,0.25)] p-6 hover:border-[rgba(242,187,5,0.6)]"
        >
          <h2>{label}</h2>
          <p className="text-sm opacity-80">{description}</p>
        </Link>
      ))}
    </div>
  )
}

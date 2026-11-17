import Link from 'next/link'
import { isAdmin } from '@/service/auth/admin'
import { logout } from '@/app/admin/actions/auth'

export const metadata = {
  title: 'Admin · Sylvain Faure',
  robots: { index: false, follow: false }
}

export default async function AdminLayout({ children }) {
  const loggedIn = await isAdmin()

  return (
    <main className="bg-gray-600 text-lime-100 min-h-screen">
      <div className="container py-6">
        <header className="flex flex-wrap items-center gap-4 pb-4 mb-8 border-b border-lime-100">
          <Link href="/admin" className="font-semibold">
            Admin
          </Link>
          {loggedIn && (
            <>
              <Link href="/admin/concerts" className="hover:underline">
                Concerts
              </Link>
              <Link href="/admin/books" className="hover:underline">
                Books
              </Link>
              <Link href="/admin/discogs" className="hover:underline">
                Discogs
              </Link>
              <Link href="/admin/music" className="hover:underline">
                Music
              </Link>
              <Link href="/"className="ml-auto text-sm hover:underline">
                View site
              </Link>
              <form action={logout}>
                <button type="submit" className="text-sm opacity-70 hover:opacity-100">
                  Log out
                </button>
              </form>
            </>
          )}
        </header>
        {children}
      </div>
    </main>
  )
}

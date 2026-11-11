import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, verifySessionToken } from '@/service/auth/session'

export const isAdmin = async () => {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET)
}

// Middleware already guards /admin, but every page and server action checks again.
export const requireAdmin = async () => {
  if (!(await isAdmin())) redirect('/admin/login')
}

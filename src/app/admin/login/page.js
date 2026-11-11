import { redirect } from 'next/navigation'
import LoginForm from '@/components/Admin/LoginForm'
import { isAdmin } from '@/service/auth/admin'

export default async function AdminLoginPage({ searchParams }) {
  if (await isAdmin()) redirect('/admin')
  const { next } = await searchParams

  return (
    <div className="max-w-sm">
      <h1>Log in</h1>
      <LoginForm next={typeof next === 'string' ? next : ''} />
    </div>
  )
}

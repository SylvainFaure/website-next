'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isUsableSecret,
  passwordMatches,
  safeAdminPath
} from '@/service/auth/session'

const FAILED_LOGIN_DELAY_MS = 750

export async function login(_prevState, formData) {
  const secret = process.env.ADMIN_SESSION_SECRET
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !isUsableSecret(secret)) {
    return { error: 'Admin is not configured: set ADMIN_PASSWORD and ADMIN_SESSION_SECRET (32+ characters).' }
  }

  const password = formData.get('password')
  if (!(await passwordMatches(typeof password === 'string' ? password : '', expected, secret))) {
    // Slows down password guessing
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS))
    return { error: 'Wrong password.' }
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  })
  redirect(safeAdminPath(formData.get('next')))
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/admin/login')
}

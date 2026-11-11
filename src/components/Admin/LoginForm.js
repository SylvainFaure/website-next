'use client'

import { useActionState } from 'react'
import { login } from '@/app/admin/actions/auth'
import { Field, buttonClass, inputClass } from './fields'

const LoginForm = ({ next }) => {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="Password" error={state?.error}>
        <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}

export default LoginForm

'use client'

export default function AdminError({ error, reset }) {
  return (
    <div className="max-w-xl">
      <h2>Something went wrong</h2>
      <p className="text-sm opacity-80 pb-4">
        {error?.message || 'Unexpected error.'} Check the Supabase environment variables and that the migration has
        been applied.
      </p>
      <button type="button" onClick={reset} className="font-semibold hover:underline">
        Try again
      </button>
    </div>
  )
}

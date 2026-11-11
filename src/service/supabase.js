import 'server-only'
import { createClient } from '@supabase/supabase-js'

export const COVERS_BUCKET = 'book-covers'

const options = { auth: { persistSession: false, autoRefreshToken: false } }

const required = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

let publicClient
let adminClient

// Read-only client (publishable key, subject to RLS: select only).
export const getPublicClient = () =>
  (publicClient ??= createClient(required('SUPABASE_URL'), required('SUPABASE_PUBLISHABLE_KEY'), options))

// Write client (secret key, bypasses RLS). Only use it from admin server actions.
export const getAdminClient = () =>
  (adminClient ??= createClient(required('SUPABASE_URL'), required('SUPABASE_SECRET_KEY'), options))

export const coverUrl = (path) => {
  if (!path) return null
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${required('SUPABASE_URL')}/storage/v1/object/public/${COVERS_BUCKET}/${encoded}`
}

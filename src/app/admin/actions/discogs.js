'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/service/auth/admin'
import { fetchCovers, syncFromDiscogs } from '@/service/discogs/releases'

const revalidateDiscogs = () => {
  revalidatePath('/lists/my-discogs')
  revalidatePath('/admin/discogs')
}

export async function syncDiscogsAction() {
  await requireAdmin()
  try {
    const result = await syncFromDiscogs()
    revalidateDiscogs()
    return { ok: true, ...result }
  } catch (error) {
    console.error('[admin] syncDiscogs', error)
    return { ok: false, error: error.message }
  }
}

export async function fetchCoversAction() {
  await requireAdmin()
  try {
    const result = await fetchCovers()
    if (result.processed) revalidateDiscogs()
    return { ok: true, ...result }
  } catch (error) {
    console.error('[admin] fetchCovers', error)
    return { ok: false, error: error.message }
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/service/auth/admin'
import {
  createConcert,
  deleteConcert,
  pushMissingToCalendar,
  syncConcertToCalendar,
  updateConcert
} from '@/service/lists/concerts'
import { formValues, parseConcertForm, parseId } from '@/service/lists/validation'

const FIELDS = ['date', 'endDate', 'artists', 'event', 'venue', 'city', 'maybe']

const revalidateConcerts = () => {
  revalidatePath('/lists/concerts')
  revalidatePath('/lists/concerts/past')
  revalidatePath('/admin/concerts')
}

export async function saveConcert(_prevState, formData) {
  await requireAdmin()

  const isEdit = formData.has('id')
  const id = isEdit ? parseId(formData.get('id')) : null
  if (isEdit && !id) return { errors: { form: 'Invalid concert id.' } }

  const values = formValues(formData, FIELDS)
  const { data, errors } = parseConcertForm(formData)
  if (errors) return { errors, values }

  let savedId = id
  try {
    if (isEdit) await updateConcert(id, data)
    else savedId = await createConcert(data)
  } catch (error) {
    console.error('[admin] saveConcert', error)
    return { errors: { form: `Could not save the concert: ${error.message}` }, values }
  }

  // The concert is saved either way; a calendar failure is reported, not fatal
  const calendarError = await syncConcertToCalendar(savedId)
  revalidateConcerts()
  const warning = calendarError ? ` But the calendar could not be updated: ${calendarError}` : ''

  if (isEdit && !warning) redirect('/admin/concerts')
  return { ok: true, message: `${isEdit ? 'Saved' : 'Added'} ${data.artists.join(', ')}.${warning}` }
}

export async function deleteConcertAction(formData) {
  await requireAdmin()
  const id = parseId(formData.get('id'))
  if (!id) return
  await deleteConcert(id)
  revalidateConcerts()
}

export async function pushMissingToCalendarAction() {
  await requireAdmin()
  const result = await pushMissingToCalendar()
  revalidatePath('/admin/concerts')
  return result
}

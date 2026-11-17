'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/service/auth/admin'
import { adminBooksUrl } from '@/service/lists/bookFilters'
import { createBook, deleteBook, updateBook } from '@/service/lists/books'
import { formValues, parseBookForm, parseId, sniffImageType } from '@/service/lists/validation'

const FIELDS = ['title', 'author', 'edition', 'lang', 'isbn', 'year']

const revalidateBooks = () => {
  revalidatePath('/lists')
  revalidatePath('/lists/books')
  revalidatePath('/admin/books')
}

export async function saveBook(_prevState, formData) {
  await requireAdmin()

  const isEdit = formData.has('id')
  const id = isEdit ? parseId(formData.get('id')) : null
  if (isEdit && !id) return { errors: { form: 'Invalid book id.' } }

  const values = formValues(formData, FIELDS)
  const parsed = parseBookForm(formData)
  if (parsed.errors) return { errors: parsed.errors, values }

  let cover = null
  if (parsed.cover) {
    const bytes = new Uint8Array(await parsed.cover.arrayBuffer())
    const contentType = sniffImageType(bytes)
    if (!contentType) return { errors: { cover: 'This file is not a valid JPEG, PNG or WebP image.' }, values }
    cover = { bytes, contentType }
  }

  try {
    if (isEdit) await updateBook(id, parsed.data, { cover, removeCover: parsed.removeCover })
    else await createBook(parsed.data, cover)
  } catch (error) {
    console.error('[admin] saveBook', error)
    return { errors: { form: `Could not save the book: ${error.message}` }, values }
  }

  revalidateBooks()
  // Back to the list with the filters it was opened from, scrolled to the edited book
  if (isEdit) redirect(adminBooksUrl(formData.get('returnQuery') ?? '', id))
  return { ok: true, message: `Added “${parsed.data.title}”.` }
}

export async function deleteBookAction(formData) {
  await requireAdmin()
  const id = parseId(formData.get('id'))
  if (!id) return
  await deleteBook(id)
  revalidateBooks()
}

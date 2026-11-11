'use client'

import { useActionState } from 'react'
import CoverZoom from '@/components/CoverZoom'
import { saveBook } from '@/app/admin/actions/books'
import LangFlag from '@/components/LangFlag'
import { BOOK_LANGUAGES } from '@/service/lists/languages'
import { Field, FormFooter, Suggestions, inputClass } from './fields'

const toValues = (book) => ({
  title: book?.title ?? '',
  author: book?.author ?? '',
  edition: book?.edition ?? '',
  lang: book?.lang ?? '',
  isbn: book?.isbn ?? '',
  year: book?.year ? String(book.year) : ''
})

const BookForm = ({ book, suggestions, returnQuery }) => {
  const [state, formAction, pending] = useActionState(saveBook, null)
  // After a failed submit the form is reset, so it is refilled with the submitted values
  const values = state?.values ?? toValues(book)
  const errors = state?.errors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      {book && <input type="hidden" name="id" value={book.id} />}
      {book && <input type="hidden" name="returnQuery" value={returnQuery ?? ''} />}

      <Field label="Title" error={errors.title}>
        <input name="title" required defaultValue={values.title} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Author" error={errors.author}>
          <input name="author" list="book-authors" required defaultValue={values.author} className={inputClass} />
        </Field>
        <Field label="Edition" hint="optional" error={errors.edition}>
          <input name="edition" list="book-editions" defaultValue={values.edition} className={inputClass} />
        </Field>
      </div>

      <Field label="ISBN" hint="optional · links the bookshops to this exact edition" error={errors.isbn}>
        <input name="isbn" inputMode="numeric" defaultValue={values.isbn} className={`${inputClass} md:w-60`} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Year read" hint="empty = “earlier” list" error={errors.year}>
          <input
            type="number"
            name="year"
            min={1900}
            max={new Date().getFullYear() + 1}
            defaultValue={values.year}
            className={inputClass}
          />
        </Field>
        {/* Radios rather than a <select>: React restores defaultChecked after a failed submit */}
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-semibold text-text pb-1">Language</legend>
          <div className="flex gap-4 py-2">
            {Object.entries(BOOK_LANGUAGES).map(([code, label]) => (
              <label key={code} className="flex items-center gap-2 text-sm">
                <input type="radio" name="lang" value={code} required defaultChecked={values.lang === code} />
                <LangFlag lang={code} />
                {label}
              </label>
            ))}
          </div>
          {errors.lang && <span className="text-xs text-contrast">{errors.lang}</span>}
        </fieldset>
      </div>

      <Field label="Cover" hint="JPEG, PNG or WebP, 4 MB max" error={errors.cover}>
        <input
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-text file:mr-3 file:rounded-md file:border-0 file:bg-contrast file:px-3 file:py-1 file:font-semibold file:text-secondary"
        />
      </Field>

      {book?.cover && (
        <div className="flex items-center gap-4">
          <CoverZoom src={book.cover} alt={`Cover of ${book.title}`} width={80} height={120} className="w-20 h-[120px]" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="removeCover" /> Remove the current cover
          </label>
        </div>
      )}

      <Suggestions id="book-authors" values={suggestions?.authors} />
      <Suggestions id="book-editions" values={suggestions?.editions} />

      <FormFooter pending={pending} state={state} label={book ? 'Save changes' : 'Add book'} />
    </form>
  )
}

export default BookForm

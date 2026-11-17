'use client'

import { useActionState } from 'react'
import { saveConcert } from '@/app/admin/actions/concerts'
import { Field, FormFooter, Suggestions, inputClass } from './fields'

const toValues = (concert) => ({
  date: concert?.date ?? '',
  endDate: concert?.endDate ?? '',
  artists: concert?.artists?.join('\n') ?? '',
  event: concert?.event ?? '',
  venue: concert?.venue ?? '',
  city: concert?.city ?? '',
  maybe: concert?.maybe ? 'on' : ''
})

const ConcertForm = ({ concert, suggestions }) => {
  const [state, formAction, pending] = useActionState(saveConcert, null)
  // After a failed submit the form is reset, so it is refilled with the submitted values
  const values = state?.values ?? toValues(concert)
  const errors = state?.errors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      {concert && <input type="hidden" name="id" value={concert.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date" error={errors.date}>
          <input type="date" name="date" required defaultValue={values.date} className={inputClass} />
        </Field>
        <Field label="End date" hint="multi-day" error={errors.endDate}>
          <input type="date" name="endDate" defaultValue={values.endDate} className={inputClass} />
        </Field>
      </div>

      <Field label="Artists" hint="one per line" error={errors.artists}>
        <textarea name="artists" rows={4} required defaultValue={values.artists} className={inputClass} />
      </Field>

      <Field label="Event / festival" hint="optional" error={errors.event}>
        <input name="event" list="concert-events" defaultValue={values.event} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Venue" error={errors.venue}>
          <input name="venue" list="concert-venues" required defaultValue={values.venue} className={inputClass} />
        </Field>
        <Field label="City" error={errors.city}>
          <input name="city" list="concert-cities" required defaultValue={values.city} className={inputClass} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="maybe" defaultChecked={values.maybe === 'on'} />
        <span>
          <span className="font-semibold">Maybe</span>
          <span className="opacity-60"> · not sure to go yet (shown dimmed, &quot;(maybe)&quot; in the calendar)</span>
        </span>
      </label>

      <Suggestions id="concert-events" values={suggestions?.events} />
      <Suggestions id="concert-venues" values={suggestions?.venues} />
      <Suggestions id="concert-cities" values={suggestions?.cities} />

      <FormFooter pending={pending} state={state} label={concert ? 'Save changes' : 'Add concert'} />
    </form>
  )
}

export default ConcertForm

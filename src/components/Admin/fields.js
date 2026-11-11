export const inputClass =
  'w-full rounded-md px-3 py-2 bg-[rgba(31,41,53,0.55)] border border-[rgba(240,240,201,0.25)] text-text outline-none focus:border-[rgba(242,187,5,0.6)]'

export const buttonClass =
  'rounded-md bg-contrast text-secondary font-semibold px-4 py-2 transition-opacity hover:opacity-90 disabled:opacity-50'

export const Field = ({ label, hint, error, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm font-semibold text-text">
      {label}
      {hint && <span className="font-normal opacity-60"> · {hint}</span>}
    </span>
    {children}
    {error && <span className="text-xs text-contrast">{error}</span>}
  </label>
)

export const FormFooter = ({ pending, label, state }) => (
  <div className="flex items-center gap-4">
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? 'Saving…' : label}
    </button>
    {state?.errors?.form && <p className="text-sm !text-contrast">{state.errors.form}</p>}
    {state?.ok && <p className="text-sm">{state.message}</p>}
  </div>
)

export const Suggestions = ({ id, values }) =>
  values?.length ? (
    <datalist id={id}>
      {values.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>
  ) : null

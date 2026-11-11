import LangFlag from '@/components/LangFlag'
import { BOOK_LANGUAGES } from '@/service/lists/languages'

const buttonClass = (active) =>
  [
    'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-opacity',
    active
      ? 'border-[rgba(242,187,5,0.6)] text-contrast opacity-100'
      : 'border-[rgba(240,240,201,0.25)] text-text opacity-60 hover:opacity-100'
  ].join(' ')

// counts: { it: 81, fr: 27 } — languages without books are not shown
const LangFilter = ({ value, onChange, counts }) => {
  const languages = Object.keys(BOOK_LANGUAGES).filter((code) => counts[code] > 0)
  if (languages.length < 2) return null
  const total = languages.reduce((acc, code) => acc + counts[code], 0)

  return (
    <div role="group" aria-label="Filter by language" className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={!value} onClick={() => onChange(null)} className={buttonClass(!value)}>
        All <span className="opacity-60">{total}</span>
      </button>
      {languages.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={value === code}
          onClick={() => onChange(value === code ? null : code)}
          className={buttonClass(value === code)}
        >
          <LangFlag lang={code} />
          {BOOK_LANGUAGES[code]} <span className="opacity-60">{counts[code]}</span>
        </button>
      ))}
    </div>
  )
}

export default LangFilter

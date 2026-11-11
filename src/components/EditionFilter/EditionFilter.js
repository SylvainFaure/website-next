// Publisher ("edition" field) dropdown for the public books list.
// counts: { Adelphi: 3, … } — hidden when no book has a publisher
const EditionFilter = ({ value, onChange, counts }) => {
  const editions = Object.keys(counts).sort((a, b) => a.localeCompare(b))
  if (!editions.length) return null
  const active = !!value

  return (
    <label className="flex items-center">
      <span className="sr-only">Filter by publisher</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={[
          'rounded-md border bg-transparent px-2 py-1 text-xs font-semibold outline-none transition-opacity',
          active
            ? 'border-[rgba(242,187,5,0.6)] text-contrast opacity-100'
            : 'border-[rgba(240,240,201,0.25)] text-text opacity-60 hover:opacity-100 focus:opacity-100'
        ].join(' ')}
      >
        <option value="" className="bg-secondary text-text">
          All publishers
        </option>
        {editions.map((edition) => (
          <option key={edition} value={edition} className="bg-secondary text-text">
            {edition} ({counts[edition]})
          </option>
        ))}
      </select>
    </label>
  )
}

export default EditionFilter

// `children` (e.g. extra filters) render between the input and the results count.
const ListSearch = ({ value, onChange, placeholder, resultsCount, children }) => (
  <div className="pb-6">
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full md:w-[420px] rounded-md px-3 py-2 bg-[rgba(31,41,53,0.55)] border border-[rgba(240,240,201,0.25)] text-text outline-none focus:border-[rgba(242,187,5,0.6)]"
    />
    {!!value.trim() && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="ml-2 text-sm font-semibold opacity-70 hover:opacity-100"
      >
        Clear
      </button>
    )}
    {children}
    <p className="text-text text-xs pt-2 opacity-70">{resultsCount} result(s)</p>
  </div>
)

export default ListSearch

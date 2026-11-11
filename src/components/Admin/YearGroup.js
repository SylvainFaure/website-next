// Collapsible year section for the admin lists, using native <details>: no JS, keyboard accessible.
// Sections sharing a `name` form an exclusive accordion (opening one closes the others).
const YearGroup = ({ year, count, unit, open = false, accordion, children }) => (
  <details name={accordion} open={open} className="group border-b border-[rgba(240,240,201,0.15)]">
    <summary className="flex cursor-pointer list-none items-center gap-3 py-3 hover:opacity-90 [&::-webkit-details-marker]:hidden">
      <span className="text-xl font-bold text-contrast">{year}</span>
      <span className="text-xs opacity-60">
        {count} {unit}
        {count === 1 ? '' : 's'}
      </span>
      <span aria-hidden className="ml-auto text-sm opacity-60 transition-transform group-open:rotate-180">
        ▾
      </span>
    </summary>
    <div className="pb-4">{children}</div>
  </details>
)

export default YearGroup

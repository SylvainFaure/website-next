const YearNav = ({ items, activeKey, onSelect, title = 'Years' }) => (
  <aside className="hidden md:block w-[84px] shrink-0">
    <div className="sticky top-24">
      <p className="text-[10px] font-semibold text-text pb-2">{title}</p>
      <nav className="flex flex-col gap-1">
        {items.map(({ key, label }) => (
          <button
            key={`year-link-${key}`}
            type="button"
            onClick={() => onSelect(key)}
            className={[
              'text-left text-sm font-semibold transition-opacity hover:opacity-100',
              key === activeKey ? 'opacity-100 text-contrast' : 'opacity-50 text-text'
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  </aside>
)

export default YearNav

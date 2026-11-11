import CoverZoom from '@/components/CoverZoom'
import LangFlag from '@/components/LangFlag'
import { shopLinks } from '@/service/lists/shops'
import { highlight } from '@/utils/search'

// The cover slot is always rendered so rows stay aligned with or without a cover.
const BookItem = ({ title, author, edition, lang, isbn, cover, query }) => (
  <div className="flex gap-4 items-start">
    {cover ? (
      <CoverZoom src={cover} alt={`Cover of ${title}`} width={80} height={120} className="w-20 h-[120px]" />
    ) : (
      <div className="w-20 h-[120px] rounded-sm shrink-0 border border-[rgba(240,240,201,0.25)]" aria-hidden />
    )}
    <div className="pt-1">
      <h3 className="!leading-none !pb-1">
        {highlight(title, query)}
        <LangFlag lang={lang} className="ml-2 align-middle" />
      </h3>
      <p className="text-text text-sm">
        {highlight(author, query)}
        {edition && <span className="opacity-70"> · {highlight(edition, query)}</span>}
      </p>
      <p className="text-text text-xs pt-1 opacity-70">
        Find it at{' '}
        {shopLinks({ title, author, lang, isbn }).map(({ key, name, href }, i) => (
          <span key={key}>
            {i > 0 && ' · '}
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-contrast">
              {name}
            </a>
          </span>
        ))}
      </p>
    </div>
  </div>
)

export default BookItem

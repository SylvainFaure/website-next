/* eslint-disable @next/next/no-img-element -- small thumbnails from Supabase and Discogs */
import Link from 'next/link'

const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const formatDate = (iso) => longDate.format(new Date(`${iso}T12:00:00Z`))
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const Card = ({ href, title, tagline, stat, children }) => (
  <li className="min-w-0">
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-md border border-[rgba(240,240,201,0.25)] p-6 transition-colors hover:border-[rgba(242,187,5,0.6)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:max-w-[45%]">
        <h2 className="text-xl font-semibold !pb-1">
          {title} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </h2>
        <p className="m-0 text-sm text-text">{tagline}</p>
        <p className="m-0 mt-3 font-semibold">{stat}</p>
      </div>
      <div className="min-w-0 sm:w-[50%]">{children}</div>
    </Link>
  </li>
)

const Covers = ({ items }) =>
  items.length > 0 && (
    <div className="grid grid-cols-4 gap-2">
      {items.map(({ id, src, alt }) => (
        <img key={id} src={src} alt={alt} loading="lazy" className="aspect-square w-full rounded-sm object-cover" />
      ))}
    </div>
  )

// overview: listsOverview()
const ListsHub = ({ overview: { concerts, books, records } }) => (
  <div className="pt-12 pb-16">
    <h1 className="text-2xl font-semibold !pb-0">Lists</h1>
    <p className="text-text text-sm pb-8">The things I keep track of.</p>

    <ul className="flex flex-col gap-4">
      <Card
        href="/lists/concerts"
        title="Concerts"
        tagline="The gigs I'm going to, and all the ones I've been to."
        stat={`${plural(concerts.count, 'concert')}${concerts.since ? ` since ${concerts.since}` : ''}`}>
        {concerts.next ? (
          <p className="m-0 text-sm">
            <span className="opacity-70">Next: </span>
            <span className="font-semibold">{concerts.next.artists.join(', ')}</span>
            <span className="opacity-70">
              {' '}
              · {formatDate(concerts.next.date)}
              {concerts.next.city ? `, ${concerts.next.city}` : ''}
            </span>
            {concerts.upcomingCount > 1 && (
              <span className="block opacity-70">and {plural(concerts.upcomingCount - 1, 'more')} planned</span>
            )}
          </p>
        ) : (
          <>
            <p className="m-0 text-sm opacity-70">Lately:</p>
            <ul className="m-0 text-sm">
              {concerts.recent.map((c) => (
                <li key={c.id} className="truncate">
                  {c.artists.join(', ')}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card
        href="/lists/books"
        title="Books"
        tagline="What I've read, with links to buy them from independent bookshops."
        stat={plural(books.count, 'book')}>
        <Covers items={books.covers.map((b) => ({ id: b.id, src: b.cover, alt: `${b.title}, ${b.author}` }))} />
      </Card>

      <Card
        href="/lists/my-discogs"
        title="My Discogs"
        tagline="My records, and the ones I'm still looking for."
        stat={`${plural(records.collection, 'record')} · ${records.wantlist} wanted`}>
        <Covers items={records.covers.map((r) => ({ id: r.id, src: r.image, alt: `${r.artist}, ${r.title}` }))} />
      </Card>
    </ul>
  </div>
)

export default ListsHub

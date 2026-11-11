// Independent bookshops to find a book at (no Amazon / big tech), by reading language.
// With an ISBN the link targets that exact edition; otherwise it is a search.

const SHOPS = {
  leslibraires: {
    name: 'Leslibraires.fr',
    // An ISBN search redirects straight to the product page
    url: ({ isbn, title, author }) => `https://www.leslibraires.fr/recherche/?q=${encodeURIComponent(isbn ?? `${title} ${author}`)}`
  },
  ubik: {
    name: 'Ubik',
    // Ubik's search finds nothing for "title author" combined, so fall back to the title alone
    url: ({ isbn, title }) => `https://www.ubiklibri.it/catalogo-libri?q=${encodeURIComponent(isbn ?? title)}`
  },
  coop: {
    name: 'Librerie.coop',
    // Its search doesn't understand ISBNs (returns unrelated books), so always search title + author
    url: ({ title, author }) => `https://www.librerie.coop/search/?q=${encodeURIComponent(`${title} ${author}`)}`
  }
}

const SHOPS_BY_LANG = {
  fr: ['leslibraires'],
  it: ['ubik', 'coop']
}

export const shopLinks = (book) =>
  (SHOPS_BY_LANG[book.lang] ?? []).map((key) => ({ key, name: SHOPS[key].name, href: SHOPS[key].url(book) }))

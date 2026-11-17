// Pure: what the /lists hub shows about each list (counts, a few recent items).

const COVERS = 4

// concerts: getConcertLists() · books: getBooks() · records: getDiscogsLists()
export const listsOverview = ({ concerts, books, records }) => {
  // pastByYear: most recent year first, concerts in chronological order inside a year
  const past = concerts.pastByYear.flatMap(({ concerts: items }) => [...items].reverse())
  const years = concerts.pastByYear.map(({ year }) => Number(year)).filter(Boolean)

  // Book ids follow the order they were entered: highest = last read
  const allBooks = [...books.byYear.flatMap(({ books: items }) => items), ...books.earlier]
  const latestBooks = allBooks
    .filter((b) => b.cover)
    .sort((a, b) => b.id - a.id)
    .slice(0, COVERS)

  return {
    concerts: {
      count: past.length,
      since: years.length ? Math.min(...years) : null,
      next: concerts.upcoming[0] ?? null,
      upcomingCount: concerts.upcoming.length,
      recent: past.slice(0, 3)
    },
    books: {
      count: allBooks.length,
      covers: latestBooks.map(({ id, title, author, cover }) => ({ id, title, author, cover }))
    },
    records: {
      collection: records.collection.length,
      wantlist: records.wantlist.length,
      // collection: most recently added first
      covers: records.collection
        .filter((r) => r.image)
        .slice(0, COVERS)
        .map(({ id, artist, title, image }) => ({ id, artist, title, image }))
    }
  }
}

// Pure formatting helpers for the lists (no framework imports, unit-tested).

const dateParts = (iso) => {
  const [y, m, d] = String(iso).split('-')
  return { y, m, d }
}

// "2024-06-03" → "03/06"; with an end date → "03>06/06" (same month) or "30/05>02/06"
export const formatConcertDate = (date, endDate) => {
  const start = dateParts(date)
  if (!endDate || endDate === date) return `${start.d}/${start.m}`
  const end = dateParts(endDate)
  if (start.y === end.y && start.m === end.m) return `${start.d}>${end.d}/${start.m}`
  return `${start.d}/${start.m}>${end.d}/${end.m}`
}

export const yearOf = (iso) => Number(String(iso).slice(0, 4))

// Groups items by year, most recent year first, keeping the items' order inside each year.
export const groupByYear = (items, getYear) => {
  const groups = new Map()
  for (const item of items) {
    const year = getYear(item)
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(item)
  }
  return [...groups.entries()].sort(([a], [b]) => b - a).map(([year, grouped]) => ({ year, items: grouped }))
}

export const uniqueSorted = (values) =>
  [...new Set(values.filter(Boolean).map((v) => String(v).trim()))].sort((a, b) => a.localeCompare(b))

export const byAuthorThenTitle = (a, b) => a.author.localeCompare(b.author) || a.title.localeCompare(b.title)

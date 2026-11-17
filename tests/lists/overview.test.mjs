import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listsOverview } from '../../src/service/lists/overview.js'

const concert = (id, date) => ({ id, date, artists: [`Band ${id}`] })

test('the lists hub sums each list and picks the latest items', () => {
  const overview = listsOverview({
    concerts: {
      upcoming: [concert(9, '2026-12-01'), concert(10, '2027-01-01')],
      pastByYear: [
        { year: 2026, concerts: [concert(7, '2026-03-01'), concert(8, '2026-10-01')] },
        { year: 2019, concerts: [concert(1, '2019-05-01')] }
      ]
    },
    books: {
      byYear: [{ year: 2026, books: [{ id: 3, cover: 'c3' }, { id: 5, cover: null }, { id: 4, cover: 'c4' }] }],
      earlier: [{ id: 1, cover: 'c1' }]
    },
    records: {
      collection: [{ id: 'r2', image: 'i2' }, { id: 'r1', image: null }, { id: 'r0', image: 'i0' }],
      wantlist: [{ id: 'w1' }]
    }
  })

  assert.equal(overview.concerts.count, 3)
  assert.equal(overview.concerts.since, 2019)
  assert.equal(overview.concerts.next.id, 9)
  assert.equal(overview.concerts.upcomingCount, 2)
  assert.deepEqual(overview.concerts.recent.map((c) => c.id), [8, 7, 1])

  assert.equal(overview.books.count, 4)
  assert.deepEqual(overview.books.covers.map((b) => b.id), [4, 3, 1])

  assert.equal(overview.records.collection, 3)
  assert.equal(overview.records.wantlist, 1)
  assert.deepEqual(overview.records.covers.map((r) => r.id), ['r2', 'r0'])
})

test('empty lists (e.g. Supabase down) still give a usable overview', () => {
  const overview = listsOverview({
    concerts: { upcoming: [], pastByYear: [] },
    books: { byYear: [], earlier: [] },
    records: { collection: [], wantlist: [] }
  })
  assert.equal(overview.concerts.since, null)
  assert.equal(overview.concerts.next, null)
  assert.deepEqual(overview.books.covers, [])
})

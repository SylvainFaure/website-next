import { test } from 'node:test'
import assert from 'node:assert/strict'
import { byAuthorThenTitle, formatConcertDate, groupByYear, uniqueSorted, yearOf } from '../../src/service/lists/format.js'

test('formatConcertDate keeps the legacy "dd/mm" and "dd>dd/mm" labels', () => {
  assert.equal(formatConcertDate('2024-02-10'), '10/02')
  assert.equal(formatConcertDate('2024-02-10', null), '10/02')
  assert.equal(formatConcertDate('2022-06-03', '2022-06-06'), '03>06/06')
  assert.equal(formatConcertDate('2022-05-30', '2022-06-02'), '30/05>02/06')
})

test('yearOf reads the year of an ISO date', () => {
  assert.equal(yearOf('2019-11-03'), 2019)
})

test('groupByYear sorts years descending and keeps item order', () => {
  const items = [{ y: 2021, n: 'a' }, { y: 2023, n: 'b' }, { y: 2021, n: 'c' }]
  assert.deepEqual(groupByYear(items, (i) => i.y), [
    { year: 2023, items: [{ y: 2023, n: 'b' }] },
    { year: 2021, items: [{ y: 2021, n: 'a' }, { y: 2021, n: 'c' }] }
  ])
})

test('uniqueSorted dedupes, trims and drops empty values', () => {
  assert.deepEqual(uniqueSorted(['Covo Club', null, ' Covo Club', 'Binario69', '']), ['Binario69', 'Covo Club'])
})

test('byAuthorThenTitle sorts by author, then title', () => {
  const books = [
    { author: 'Morante', title: 'La Storia' },
    { author: 'Calvino', title: 'Palomar' },
    { author: 'Calvino', title: 'Le città invisibili' }
  ]
  assert.deepEqual(books.sort(byAuthorThenTitle).map((b) => b.title), ['Le città invisibili', 'Palomar', 'La Storia'])
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isUpcoming, todayIso } from '../../src/service/lists/format.js'
import { addDays, calendarEventId, toCalendarEvent } from '../../src/service/lists/calendarEvent.js'

test('todayIso uses the site time zone, not UTC', () => {
  // 23:30 UTC on Dec 31 is already Jan 1 in Rome
  assert.equal(todayIso(new Date('2026-12-31T23:30:00Z')), '2027-01-01')
  assert.equal(todayIso(new Date('2026-06-15T10:00:00Z')), '2026-06-15')
})

test('a concert stays upcoming until its last day is over', () => {
  const today = '2026-07-10'
  assert.equal(isUpcoming({ date: '2026-07-10', endDate: null }, today), true)
  assert.equal(isUpcoming({ date: '2026-07-09', endDate: null }, today), false)
  // Festival that started yesterday and ends tomorrow
  assert.equal(isUpcoming({ date: '2026-07-09', endDate: '2026-07-11' }, today), true)
})

test('calendar event ids only use the characters Google accepts', () => {
  assert.match(calendarEventId(1234), /^[a-v0-9]{5,1024}$/)
})

test('addDays crosses months and years', () => {
  assert.equal(addDays('2026-06-30', 1), '2026-07-01')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(addDays('2028-02-28', 1), '2028-02-29')
})

test('toCalendarEvent makes an all-day event over the concert days (exclusive end)', () => {
  const event = toCalendarEvent({
    date: '2026-07-09',
    endDate: '2026-07-11',
    artists: ['Dry Cleaning', 'Shame'],
    event: 'Ferrara Sotto le Stelle',
    venue: 'Piazza Castello',
    city: 'Ferrara',
    maybe: false
  })
  assert.equal(event.summary, 'Dry Cleaning, Shame @ Ferrara Sotto le Stelle')
  assert.equal(event.location, 'Piazza Castello, Ferrara')
  assert.deepEqual(event.start, { date: '2026-07-09' })
  assert.deepEqual(event.end, { date: '2026-07-12' })
  assert.equal(event.transparency, 'transparent')
})

test('single-day and "maybe" concerts', () => {
  const event = toCalendarEvent({ date: '2026-07-09', endDate: null, artists: ['Slint'], event: null, venue: 'Bronson', city: 'Ravenna', maybe: true })
  assert.equal(event.summary, '(maybe) Slint')
  assert.deepEqual(event.end, { date: '2026-07-10' })
})

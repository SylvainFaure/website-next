import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  artistLabel,
  cleanArtistName,
  dedupeRecords,
  discogsUrl,
  largestImage,
  matchKey,
  mergeLists,
  pickSpotifyAlbum,
  toRelease
} from '../../src/service/discogs/records.js'

const entry = (id, { title = 'Album', artists = [{ name: 'Artist', join: '' }], date = '2024-01-01T00:00:00-08:00', cover = 'https://i.discogs.com/x.jpeg' } = {}) => ({
  id,
  date_added: date,
  basic_information: { id, title, year: 2001, cover_image: cover, artists, formats: [{ name: 'Vinyl' }] }
})

test('artist names lose the Discogs disambiguation number and keep join words', () => {
  assert.equal(cleanArtistName('Sparks (2)'), 'Sparks')
  assert.equal(cleanArtistName('Beak>'), 'Beak>')
  assert.equal(
    artistLabel([{ name: 'Steve Reich', join: ',' }, { name: 'Steve Reich And Musicians (3)', join: '' }]),
    'Steve Reich, Steve Reich And Musicians'
  )
  assert.equal(artistLabel([{ name: 'A', join: '&' }, { name: 'B', join: '' }]), 'A & B')
})

test('toRelease keeps what the page and the cover search need', () => {
  assert.deepEqual(toRelease(entry(1, { title: ' Spiderland ', artists: [{ name: 'Slint (2)', join: '' }] })), {
    release_id: 1,
    artist: 'Slint',
    artists: ['Slint'],
    title: 'Spiderland',
    year: 2001,
    format: 'Vinyl',
    discogs_image_url: 'https://i.discogs.com/x.jpeg'
  })
  // Discogs' placeholder image means "no cover"
  assert.equal(toRelease(entry(1, { cover: 'https://st.discogs.com/images/spacer.gif' })).discogs_image_url, null)
  assert.equal(toRelease({ ...entry(1), basic_information: { ...entry(1).basic_information, year: 0 } }).year, null)
})

test('mergeLists flags releases in both lists and keeps the earliest date of duplicates', () => {
  const rows = mergeLists({
    wantlist: [entry(1, { date: '2024-03-01' }), entry(2)],
    collection: [entry(1, { date: '2024-05-01' }), entry(1, { date: '2024-04-01' })]
  })
  assert.equal(rows.length, 2)
  const both = rows.find((r) => r.release_id === 1)
  assert.equal(both.in_wantlist, true)
  assert.equal(both.in_collection, true)
  assert.equal(both.wantlist_added_at, '2024-03-01')
  assert.equal(both.collection_added_at, '2024-04-01')
  const wantOnly = rows.find((r) => r.release_id === 2)
  assert.equal(wantOnly.in_collection, false)
  assert.equal(wantOnly.collection_added_at, null)
})

test('matchKey ignores case, accents, punctuation and a leading "the", but not non-Latin letters', () => {
  assert.equal(matchKey('The Raincoats'), matchKey('Raincoats'))
  assert.equal(matchKey('Fresques Sur Les Parois Secrètes Du Crâne'), matchKey('Fresques sur les parois secretes du crane'))
  assert.equal(matchKey('Q & Not U'), matchKey('Q And Not U'))
  assert.notEqual(matchKey('Утро'), matchKey('Три кофе под утро'))
  assert.notEqual(matchKey('>>>'), matchKey('>>>>'))
})

const album = (artist, name, id = name) => ({ id, name, artists: [{ name: artist }], images: [] })

test('pickSpotifyAlbum needs the same artist and title', () => {
  const sparks = { artist: 'Sparks', artists: ['Sparks'], title: 'Sparks' }
  assert.equal(pickSpotifyAlbum([album('Jordin Sparks', 'Jordin Sparks')], sparks), null)

  const electric = { artist: 'Electric Electric', artists: ['Electric Electric'], title: 'Electric Electric III' }
  assert.equal(pickSpotifyAlbum([album('Electric Mary', 'Electric Mary III')], electric), null)

  // Not the first result, but the right one
  const mogwai = { artist: 'Mogwai', artists: ['Mogwai'], title: 'Young Team' }
  const picked = pickSpotifyAlbum([album('Mogwai', 'Mr Beast'), album('Mogwai', 'Young Team (Deluxe Edition)', 'yt')], mogwai)
  assert.equal(picked.id, 'yt')

  const blur = { artist: 'Blur', artists: ['Blur'], title: '13' }
  assert.ok(pickSpotifyAlbum([album('Blur', '13 - 2012 Remaster')], blur))

  // Any of the Discogs artists can match
  const reich = { artist: 'Steve Reich, Ensemble', artists: ['Steve Reich', 'Ensemble'], title: 'Drumming' }
  assert.ok(pickSpotifyAlbum([album('Steve Reich', 'Drumming')], reich))
})

test('largestImage picks the widest Spotify image', () => {
  assert.equal(largestImage([{ url: 's', width: 64 }, { url: 'l', width: 640 }, { url: 'm', width: 300 }]), 'l')
  assert.equal(largestImage([]), null)
  assert.equal(largestImage(undefined), null)
})

test('dedupeRecords shows two pressings of the same album once, keeping the first', () => {
  const records = [
    { id: '1', artist: 'Slint', title: 'Spiderland' },
    { id: '2', artist: 'slint', title: 'Spiderland ' },
    { id: '3', artist: 'Other', title: 'Spiderland' }
  ]
  assert.deepEqual(dedupeRecords(records).map((r) => r.id), ['1', '3'])
})

test('wantlist links to the marketplace, collection to the release page', () => {
  assert.equal(discogsUrl(42, 'wantlist'), 'https://www.discogs.com/sell/release/42?ev=rb')
  assert.equal(discogsUrl(42, 'collection'), 'https://www.discogs.com/release/42')
})

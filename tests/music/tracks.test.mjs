import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  albumRuns,
  authorizeUrl,
  clientIdFrom,
  currentTrack,
  groupPlaysByDay,
  hasScope,
  pickImage,
  removedIds,
  toLibraryRow,
  toPlay,
  toPlayRow,
  toTopRows,
  tokenExpiry,
  topAlbumsFromTracks,
  topLists
} from '../../src/service/music/tracks.js'

const images = [
  { url: 'big', width: 640 },
  { url: 'small', width: 64 },
  { url: 'medium', width: 300 }
]

const track = {
  id: 't1',
  name: 'Song',
  artists: [{ name: 'Band' }, { name: 'Guest' }],
  album: { id: 'a1', name: 'Album', images },
  duration_ms: 1000,
  external_urls: { spotify: 'https://open.spotify.com/track/t1' }
}

test('pickImage takes the smallest image wide enough, else the largest', () => {
  assert.equal(pickImage(images), 'medium')
  assert.equal(pickImage(images, 600), 'big')
  assert.equal(pickImage(images, 1000), 'big')
  assert.equal(pickImage([]), null)
})

test('the refresh token expires 6 months after the authorization', () => {
  assert.equal(tokenExpiry('2026-11-17T10:00:00Z').toISOString(), '2027-05-17T10:00:00.000Z')
})

test('authorize URL asks for the history scopes and carries the state', () => {
  const clientId = clientIdFrom(Buffer.from('my-id:my-secret').toString('base64'))
  assert.equal(clientId, 'my-id')
  const url = new URL(authorizeUrl({ clientId, redirectUri: 'http://127.0.0.1:3000/admin/spotify/callback', state: 'abc' }))
  assert.equal(url.searchParams.get('client_id'), 'my-id')
  assert.equal(url.searchParams.get('state'), 'abc')
  assert.equal(url.searchParams.get('response_type'), 'code')
  assert.match(url.searchParams.get('scope'), /user-read-recently-played/)
  assert.match(url.searchParams.get('scope'), /user-library-read/)
})

test('a recently played item becomes a play row', () => {
  assert.deepEqual(toPlayRow({ track, played_at: '2026-11-17T10:00:00Z' }), {
    source: 'spotify',
    played_at: '2026-11-17T10:00:00Z',
    track_id: 't1',
    track_name: 'Song',
    artists: ['Band', 'Guest'],
    album_id: 'a1',
    album_name: 'Album',
    image_url: 'medium',
    duration_ms: 1000,
    url: 'https://open.spotify.com/track/t1'
  })
})

test('saved tracks keep their album, saved albums their own cover', () => {
  const savedTrack = toLibraryRow('track', { added_at: '2026-01-01T00:00:00Z', track }, 'now')
  assert.equal(savedTrack.item_id, 't1')
  assert.equal(savedTrack.album_name, 'Album')
  assert.equal(savedTrack.removed_at, null)

  const album = { id: 'a1', name: 'Album', artists: [{ name: 'Band' }], images, external_urls: { spotify: 'u' } }
  const savedAlbum = toLibraryRow('album', { added_at: '2026-01-01T00:00:00Z', album }, 'now')
  assert.equal(savedAlbum.kind, 'album')
  assert.equal(savedAlbum.album_name, null)
  assert.equal(savedAlbum.image_url, 'medium')
})

test('removedIds lists what is no longer saved', () => {
  assert.deepEqual(removedIds(['a', 'b', 'c'], ['c', 'a', 'd']), ['b'])
})

test('currentTrack only shows a track that is actually playing', () => {
  assert.equal(currentTrack(null), null)
  assert.equal(currentTrack({ is_playing: false, currently_playing_type: 'track', item: track }), null)
  assert.equal(currentTrack({ is_playing: true, currently_playing_type: 'episode', item: {} }), null)
  assert.deepEqual(currentTrack({ is_playing: true, currently_playing_type: 'track', item: track }), {
    song: 'Song',
    artists: 'Band, Guest',
    album: 'Album',
    image: 'medium',
    url: 'https://open.spotify.com/track/t1',
    currently_playing: true
  })
})

const play = (playedAt, artists, albumId) =>
  toPlay({ id: playedAt, played_at: playedAt, track_name: 's', artists, album_id: albumId, album_name: albumId })

test('plays are grouped by day in the Rome time zone', () => {
  const days = groupPlaysByDay([
    play('2026-11-17T08:00:00Z', ['A']),
    play('2026-11-16T23:30:00Z', ['A']), // 00:30 on the 17th in Rome
    play('2026-11-16T10:00:00Z', ['B'])
  ])
  assert.deepEqual(
    days.map(({ day, plays }) => [day, plays.length]),
    [
      ['2026-11-17', 2],
      ['2026-11-16', 1]
    ]
  )
})

test('consecutive plays of the same album become one run, in listening order', () => {
  const runs = albumRuns([
    play('2026-11-17T10:10:00Z', ['A'], 'x'),
    play('2026-11-17T10:05:00Z', ['A'], 'x'),
    play('2026-11-17T10:00:00Z', ['A'], 'x'),
    play('2026-11-17T09:00:00Z', ['B'], 'y'),
    play('2026-11-17T08:00:00Z', ['A'], 'x')
  ])
  assert.deepEqual(
    runs.map((r) => [r.key, r.plays.map((p) => p.playedAt.slice(11, 16))]),
    [
      ['x', ['10:00', '10:05', '10:10']],
      ['y', ['09:00']],
      ['x', ['08:00']]
    ]
  )
  assert.equal(runs[0].album, 'x')
})

test('hasScope reads the space-separated scopes Spotify returns', () => {
  assert.equal(hasScope('user-library-read user-top-read', 'user-top-read'), true)
  assert.equal(hasScope('user-library-read', 'user-top-read'), false)
  assert.equal(hasScope(null, 'user-top-read'), false)
})

test('top items become ranked rows', () => {
  const artist = { id: 'ar1', name: 'Makaya McCraven', images, external_urls: { spotify: 'u' } }
  const [artistRow] = toTopRows('artist', 'short_term', [artist], '2026-11-17')
  assert.equal(artistRow.rank, 1)
  assert.equal(artistRow.image_url, 'medium')
  assert.deepEqual(artistRow.artists, [])
  assert.equal(artistRow.album_id, null)

  const rows = toTopRows('track', 'long_term', [track, { ...track, id: 't2' }], '2026-11-17')
  assert.deepEqual(rows.map((r) => [r.rank, r.item_id, r.album_id]), [
    [1, 't1', 'a1'],
    [2, 't2', 'a1']
  ])
})

test('top albums favour albums with several well-ranked tracks', () => {
  const t = (rank, albumId) => ({ rank, albumId, album: albumId, artists: ['X'], image: null, albumUrl: null })
  // 'b' has the #1 track alone; 'a' has #2, #3 and #4
  const albums = topAlbumsFromTracks([t(1, 'b'), t(2, 'a'), t(3, 'a'), t(4, 'a'), t(5, 'c')])
  assert.deepEqual(albums.map((a) => a.key), ['a', 'b', 'c'])
  // equal scores (3 vs 2 + 1): the album with the best-ranked track first
  assert.deepEqual(topAlbumsFromTracks([t(2, 'y'), t(1, 'x'), t(3, 'y')]).map((a) => a.key), ['x', 'y'])
})

test('topLists splits a snapshot by period, artists and derived albums', () => {
  const row = (kind, timeRange, rank, id, albumId = null) => ({
    kind,
    time_range: timeRange,
    rank,
    item_id: id,
    name: id,
    artists: ['X'],
    album_id: albumId,
    album_name: albumId,
    album_url: null,
    image_url: null,
    url: null
  })
  const lists = topLists([
    row('artist', 'short_term', 2, 'second'),
    row('artist', 'short_term', 1, 'first'),
    row('track', 'short_term', 1, 't1', 'al1'),
    row('artist', 'long_term', 1, 'old')
  ])
  assert.deepEqual(lists.short_term.artists.map((a) => a.key), ['first', 'second'])
  assert.deepEqual(lists.short_term.albums.map((a) => a.key), ['al1'])
  assert.deepEqual(lists.medium_term, { artists: [], albums: [] })
  assert.deepEqual(lists.long_term.artists.map((a) => a.key), ['old'])
})

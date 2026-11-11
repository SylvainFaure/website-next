import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  passwordMatches,
  safeAdminPath,
  verifySessionToken
} from '../../src/service/auth/session.js'

const SECRET = 'a'.repeat(40)
const OTHER_SECRET = 'b'.repeat(40)

test('a fresh token verifies', async () => {
  const token = await createSessionToken(SECRET)
  assert.equal(await verifySessionToken(token, SECRET), true)
})

test('a token signed with another secret is rejected', async () => {
  const token = await createSessionToken(OTHER_SECRET)
  assert.equal(await verifySessionToken(token, SECRET), false)
})

test('an expired token is rejected', async () => {
  const now = Date.now()
  const token = await createSessionToken(SECRET, now)
  assert.equal(await verifySessionToken(token, SECRET, now + SESSION_MAX_AGE_SECONDS * 1000 + 1), false)
})

test('a token with a tampered expiry is rejected', async () => {
  const token = await createSessionToken(SECRET)
  const [expiresAt, signature] = token.split('.')
  const forged = `${Number(expiresAt) + 1000 * 60 * 60 * 24 * 365}.${signature}`
  assert.equal(await verifySessionToken(forged, SECRET), false)
})

test('malformed tokens and missing secrets are rejected', async () => {
  for (const token of [undefined, '', 'abc', '123', '123.zz', '123.ab.cd', `${Date.now() + 1000}.`]) {
    assert.equal(await verifySessionToken(token, SECRET), false, String(token))
  }
  const token = await createSessionToken(SECRET)
  assert.equal(await verifySessionToken(token, undefined), false)
  assert.equal(await verifySessionToken(token, 'short'), false)
})

test('creating a token requires a long enough secret', async () => {
  await assert.rejects(() => createSessionToken('short'))
})

test('passwordMatches compares passwords', async () => {
  assert.equal(await passwordMatches('hunter2', 'hunter2', SECRET), true)
  assert.equal(await passwordMatches('hunter3', 'hunter2', SECRET), false)
  assert.equal(await passwordMatches('', 'hunter2', SECRET), false)
  assert.equal(await passwordMatches('', '', SECRET), false)
  assert.equal(await passwordMatches('hunter2', undefined, SECRET), false)
})

test('safeAdminPath only allows admin pages', () => {
  assert.equal(safeAdminPath('/admin/books'), '/admin/books')
  assert.equal(safeAdminPath('/admin/books/12'), '/admin/books/12')
  assert.equal(safeAdminPath('/admin'), '/admin')
  for (const bad of ['https://evil.com', '//evil.com', '/admin/../x', '/adminx', '/admin/login', '/lists', null, '']) {
    assert.equal(safeAdminPath(bad), '/admin', String(bad))
  }
})

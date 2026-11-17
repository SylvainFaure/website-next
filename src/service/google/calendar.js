import 'server-only'
import { createSign } from 'node:crypto'

// Google Calendar through a service account: the "Concerts" calendar is shared with the service
// account's email ("Make changes to events"), so it can only touch that calendar.
// GOOGLE_SERVICE_ACCOUNT_JSON = base64 of the key file Google gives you
// GOOGLE_CALENDAR_ID = the calendar's id (Settings → Integrate calendar)

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API = 'https://www.googleapis.com/calendar/v3'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'

export const isCalendarConfigured = () =>
  Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_CALENDAR_ID)

const serviceAccount = () => {
  const { client_email, private_key } = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8')
  )
  if (!client_email || !private_key) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not a service account key')
  return { email: client_email, key: private_key }
}

const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

let token = null

// Signed JWT → access token (valid one hour, reused while it lasts).
const getAccessToken = async () => {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value
  const { email, key } = serviceAccount()
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${base64url({ alg: 'RS256', typ: 'JWT' })}.${base64url({
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600
  })}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key, 'base64url')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`
    }),
    cache: 'no-store'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Google token request failed (${res.status} ${json.error ?? ''})`)
  token = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return token.value
}

const eventsUrl = (eventId = '') =>
  `${API}/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID)}/events${eventId ? `/${eventId}` : ''}`

const request = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  })
  if (res.ok || res.status === 404 || res.status === 410) return res
  const detail = await res.text()
  throw new Error(`Google Calendar answered ${res.status}: ${detail.slice(0, 200)}`)
}

// Update the event with this id, or create it if it doesn't exist yet.
export const upsertCalendarEvent = async (eventId, event) => {
  const updated = await request('PUT', eventsUrl(eventId), event)
  if (updated.ok) return
  const created = await request('POST', eventsUrl(), { id: eventId, ...event })
  if (!created.ok) throw new Error(`Google Calendar could not create event ${eventId}`)
}

// Already gone is fine.
export const deleteCalendarEvent = async (eventId) => {
  await request('DELETE', eventsUrl(eventId))
}

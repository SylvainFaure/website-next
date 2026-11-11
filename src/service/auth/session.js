// Signed admin session tokens, using Web Crypto only so it runs in middleware (edge) and Node.
// Token format: "<expiresAtMs>.<hex HMAC-SHA256 of expiresAtMs>"

export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
export const MIN_SECRET_LENGTH = 32

const encoder = new TextEncoder()

const importKey = (secret) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify'
  ])

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')

const fromHex = (hex) => {
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/.test(hex)) return null
  return Uint8Array.from(hex.match(/../g), (pair) => parseInt(pair, 16))
}

export const isUsableSecret = (secret) => typeof secret === 'string' && secret.length >= MIN_SECRET_LENGTH

export const createSessionToken = async (secret, now = Date.now()) => {
  if (!isUsableSecret(secret)) throw new Error(`Session secret must be at least ${MIN_SECRET_LENGTH} characters`)
  const expiresAt = String(now + SESSION_MAX_AGE_SECONDS * 1000)
  const signature = await crypto.subtle.sign('HMAC', await importKey(secret), encoder.encode(expiresAt))
  return `${expiresAt}.${toHex(signature)}`
}

export const verifySessionToken = async (token, secret, now = Date.now()) => {
  if (typeof token !== 'string' || !isUsableSecret(secret)) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [expiresAt, signatureHex] = parts
  if (!/^\d{1,16}$/.test(expiresAt) || Number(expiresAt) <= now) return false
  const signature = fromHex(signatureHex)
  if (!signature) return false
  // crypto.subtle.verify compares in constant time
  return crypto.subtle.verify('HMAC', await importKey(secret), signature, encoder.encode(expiresAt))
}

// Constant-time password check: sign the expected password, then verify the candidate against it.
export const passwordMatches = async (candidate, expected, secret) => {
  if (typeof candidate !== 'string' || typeof expected !== 'string' || !expected || !isUsableSecret(secret)) {
    return false
  }
  const key = await importKey(secret)
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(expected))
  return crypto.subtle.verify('HMAC', key, expectedSignature, encoder.encode(candidate))
}

// Only allow redirecting back to admin pages after login (no open redirect).
export const safeAdminPath = (value) => {
  const path = String(value ?? '')
  return /^\/admin(\/[\w-]+)*\/?$/.test(path) && path !== '/admin/login' ? path : '/admin'
}

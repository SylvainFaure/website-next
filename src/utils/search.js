const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// `query` must already be trimmed and lowercased.
export const matchesQuery = (fields, query) =>
  fields.filter(Boolean).some((field) => String(field).toLowerCase().includes(query))

// Wraps the parts of `text` matching `query` in a <mark>.
export const highlight = (text, query) => {
  if (!text) return text
  const q = (query ?? '').trim()
  if (!q) return text

  const re = new RegExp(`(${escapeRegExp(q)})`, 'ig')
  const parts = String(text).split(re)
  if (parts.length === 1) return text

  return parts.map((part, idx) => {
    if (!part) return null
    const isMatch = part.toLowerCase() === q.toLowerCase()
    return isMatch ? (
      <mark
        key={`h-${idx}`}
        style={{
          backgroundColor: 'rgba(242, 187, 5, 0.25)',
          color: 'inherit',
          borderRadius: 2,
          padding: '0 2px'
        }}
      >
        {part}
      </mark>
    ) : (
      <span key={`t-${idx}`}>{part}</span>
    )
  })
}

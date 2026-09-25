// CMS link fields are rendered as <a href> / <iframe src> on the public site,
// so only allow absolute http(s) URLs or same-site paths ("/demos/...").
// Anything else (javascript:, data:, protocol-relative "//host") is rejected.
export function isSafeUrl(value) {
  if (value === undefined || value === null || value === '') return true
  const v = String(value).trim()
  if (v.startsWith('/')) return !v.startsWith('//') && !v.startsWith('/\\')
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// Returns the name of the first unsafe field in `fields`, or null.
export function firstUnsafe(fields) {
  for (const [name, value] of Object.entries(fields)) {
    if (!isSafeUrl(value)) return name
  }
  return null
}

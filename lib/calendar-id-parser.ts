/**
 * Parses user input (which can be a raw calendar ID, custom name with spaces, or a full URL)
 * and returns a clean, URL-safe calendar ID and optional query parameters.
 */
export function parseCalendarId(rawInput: string): string {
  if (!rawInput || !rawInput.trim()) return 'new'

  let cleaned = rawInput.replace(/[\r\n\t]+/g, ' ').trim()

  // Extract query parameters if present (e.g., ?passcode=123456)
  let queryPart = ''
  if (cleaned.includes('?')) {
    const parts = cleaned.split('?')
    cleaned = parts[0]
    queryPart = parts.slice(1).join('?')
  }

  // Strip hash fragment
  if (cleaned.includes('#')) {
    cleaned = cleaned.split('#')[0]
  }

  // Extract calendar ID if full URL is pasted (e.g., https://.../c/my-calendar-id/)
  if (cleaned.includes('/c/')) {
    const afterC = cleaned.split('/c/')[1]
    if (afterC) {
      cleaned = afterC
    }
  } else if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const url = new URL(cleaned)
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        cleaned = pathParts[pathParts.length - 1]
      }
    } catch {}
  }

  // Decode URI components in case encoded
  try {
    cleaned = decodeURIComponent(cleaned)
  } catch {}

  // Preserve casing (nanoid IDs are case-sensitive!), replace spaces & consecutive hyphens
  cleaned = cleaned
    .trim()
    .replace(/\/+$/, '') // remove trailing slashes
    .replace(/\s+/g, '-') // replace spaces with single hyphen
    .replace(/[^a-zA-Z0-9_\-]/g, '') // keep valid URL slug chars
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '') // trim leading and trailing hyphens

  if (!cleaned) return 'new'

  // Re-attach query parameters if present (e.g., ?passcode=...)
  if (queryPart) {
    return `${cleaned}?${queryPart}`
  }

  return cleaned
}

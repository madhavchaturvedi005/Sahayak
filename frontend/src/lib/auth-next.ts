export function safeNext(next?: string | null) {
  if (!next) return ''
  if (!next.startsWith('/') || next.startsWith('//')) return ''
  return next
}

export function signInHref(next?: string | null) {
  const href = safeNext(next)
  return href ? `/auth/signin?next=${encodeURIComponent(href)}` : '/auth/signin'
}

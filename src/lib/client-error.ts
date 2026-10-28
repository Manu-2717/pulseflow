'use client'

let lastReport = 0

export function reportClientError(source: 'boundary' | 'global-boundary' | 'runtime', digest?: string) {
  if (Date.now() - lastReport < 30_000) return
  lastReport = Date.now()
  const pathname = window.location.pathname
  const area = pathname.startsWith('/w/') ? 'workspace' : pathname.startsWith('/api/') ? 'api' : 'public'
  void fetch('/api/errors', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', keepalive: true,
    body: JSON.stringify({ source, area, digest: digest?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) }),
  }).catch(() => {})
}

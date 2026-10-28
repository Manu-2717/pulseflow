import type { Instrumentation } from 'next'

// Log route patterns, never request headers, bodies, query strings, or exception messages.
export const onRequestError: Instrumentation.onRequestError = (error, _request, context) => {
  const digest = typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string'
    ? error.digest.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) : undefined
  console.error(JSON.stringify({ event: 'pulseflow.server_error', route: context.routePath, kind: context.routeType, digest }))
}

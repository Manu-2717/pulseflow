const origin = new URL(process.env.MONITOR_ORIGIN || 'https://pulseflow-theta.vercel.app')
if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('Invalid monitor origin.')

const checks = [
  { path: '/', valid: (text) => /pulseflow/i.test(text) },
  { path: '/sitemap.xml', valid: (text) => text.includes('<urlset') && text.includes(`${origin.origin}/`) },
  ...(process.env.CHECK_DATABASE === 'true' ? [{ path: '/api/health', valid: (text) => { try { return JSON.parse(text).status === 'ok' } catch { return false } } }] : []),
]

let failed = false
for (const check of checks) {
  let passed = false
  for (let attempt = 1; attempt <= 3; attempt++) {
    const started = Date.now()
    try {
      const response = await fetch(new URL(check.path, origin), { signal: AbortSignal.timeout(25_000), redirect: 'error', cache: 'no-store' })
      const body = await response.text()
      passed = response.status === 200 && check.valid(body)
      console.log(JSON.stringify({ path: check.path, status: response.status, passed, attempt, durationMs: Date.now() - started }))
    } catch {
      console.error(JSON.stringify({ path: check.path, passed: false, attempt, reason: 'network_or_timeout' }))
    }
    if (passed) break
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 5000))
  }
  failed ||= !passed
}
if (failed) process.exitCode = 1

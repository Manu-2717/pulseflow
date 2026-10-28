import { NextRequest } from 'next/server'

let windowStart = 0
let reports = 0

export async function POST(request: NextRequest) {
  const headers = {'Cache-Control':'no-store','X-Robots-Tag':'noindex'}
  const origin = request.headers.get('origin')
  const allowed = new Set([new URL(request.url).origin, ...(process.env.SITE_URL ? [new URL(process.env.SITE_URL).origin] : [])])
  if (!origin || !allowed.has(origin) || request.headers.get('sec-fetch-site') !== 'same-origin') return new Response(null, {status:403,headers})
  if (!request.headers.get('content-type')?.startsWith('application/json')) return new Response(null,{status:415,headers})
  if (Number(request.headers.get('content-length') || 0) > 512) return new Response(null,{status:413,headers})
  const reader = request.body?.getReader()
  if (!reader) return new Response(null,{status:400,headers})
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const {done,value} = await reader.read()
    if (done) break
    length += value.length
    if (length > 512) { await reader.cancel(); return new Response(null,{status:413,headers}) }
    chunks.push(value)
  }
  let data: {source?:unknown;area?:unknown;digest?:unknown}
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return new Response(null,{status:400,headers}) }
  if (!data || !['boundary','global-boundary','runtime'].includes(String(data.source)) || !['workspace','api','public'].includes(String(data.area)) || (data.digest !== undefined && (typeof data.digest !== 'string' || !/^[a-zA-Z0-9_-]{0,80}$/.test(data.digest)))) return new Response(null,{status:400,headers})
  if (Date.now() - windowStart >= 60_000) { windowStart = Date.now(); reports = 0 }
  if (++reports > 60) return new Response(null,{status:429,headers:{...headers,'Retry-After':'60'}})
  console.error(JSON.stringify({event:'pulseflow.client_error',source:data.source,area:data.area,digest:data.digest}))
  return new Response(null,{status:204,headers})
}

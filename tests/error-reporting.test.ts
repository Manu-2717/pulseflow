import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/errors/route'

async function main(){
 const original=console.error
 const events:string[]=[]
 console.error=(value:unknown)=>events.push(String(value))
 const request=(body:string,origin='http://localhost:3000',site='same-origin')=>new NextRequest('http://localhost:3000/api/errors',{method:'POST',headers:{origin,'sec-fetch-site':site,'content-type':'application/json'},body})
 try{
  assert.equal((await POST(request('{}','https://other.example'))).status,403)
  assert.equal((await POST(request('{}','http://localhost:3000','cross-site'))).status,403)
  assert.equal((await POST(request('x'.repeat(513)))).status,413)
  assert.equal((await POST(request('null'))).status,400)
  assert.equal((await POST(request(JSON.stringify({source:'runtime',area:'public',digest:'contains private text'})))).status,400)
  assert.equal((await POST(request(JSON.stringify({source:'boundary',area:'workspace',digest:'12345',message:'PRIVATE_WORKSPACE_TEXT',url:'/w/private-id?token=secret'})))).status,204)
  assert.equal(events.length,1)
  assert.deepEqual(JSON.parse(events[0]),{event:'pulseflow.client_error',source:'boundary',area:'workspace',digest:'12345'})
  assert.ok(!events.join('').includes('PRIVATE_WORKSPACE_TEXT'))
  for(let i=1;i<60;i++)assert.equal((await POST(request('{"source":"runtime","area":"public"}'))).status,204)
  const limited=await POST(request('{"source":"runtime","area":"public"}'))
  assert.equal(limited.status,429)
  assert.equal(limited.headers.get('Retry-After'),'60')
 }finally{console.error=original}
 console.log('PASS: error reporting rejects cross-origin/oversized/invalid events, excludes private fields, and limits log volume.')
}
main().catch(error=>{console.error(error);process.exitCode=1})

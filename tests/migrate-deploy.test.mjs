import assert from 'node:assert/strict'
import { migrateWithRetry } from '../scripts/migrate-deploy.mjs'
let calls = 0
const delays = []
await migrateWithRetry(async () => (++calls < 3 ? { code: 1, output: 'Error: P1017 Server has closed the connection.' } : { code: 0, output: '' }), async delay => { delays.push(delay) })
assert.equal(calls, 3)
assert.deepEqual(delays, [2000, 5000])
calls = 0
await assert.rejects(migrateWithRetry(async () => { calls++; return { code: 1, output: 'Error: P3018 Migration failed.' } }, async () => {}), /migration failed/)
assert.equal(calls, 1)
calls = 0
await assert.rejects(migrateWithRetry(async () => { calls++; return { code: 1, output: 'Error: P1001 Cannot reach database.' } }, async () => {}), /migration failed/)
assert.equal(calls, 4)
calls = 0
await assert.rejects(migrateWithRetry(async () => { calls++; return { code: null, output: 'Process terminated' } }, async () => {}), /migration failed/)
assert.equal(calls, 1)
console.log('PASS: connection recovery, bounded retries, migration errors fail immediately, terminated process fails.')

import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

// Retry only connection failures. Schema and migration errors must fail the build.
export async function migrateWithRetry(run, wait = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  const delays = [2000, 5000, 10000]
  for (let attempt = 0; ; attempt++) {
    const result = await run()
    if (result.code === 0) return
    if (attempt >= delays.length || !/\bP(?:1001|1002|1008|1017)\b/.test(result.output)) {
      throw new Error(`Database migration failed (exit ${result.code}).`)
    }
    console.error(`Temporary database connection failure. Retrying migration (${attempt + 1}/${delays.length})…`)
    await wait(delays[attempt])
  }
}

function runPrisma() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env })
    let output = ''
    for (const [source, target] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      source.on('data', data => { output = (output + data.toString()).slice(-65536); target.write(data) })
    }
    child.once('error', reject)
    child.once('close', code => resolve({ code, output }))
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrateWithRetry(runPrisma).catch(error => { console.error(error.message); process.exitCode = 1 })
}

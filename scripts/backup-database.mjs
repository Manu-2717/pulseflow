import { spawn } from 'node:child_process'
import { mkdir, open, readFile, unlink, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { postgresEnv } from './postgres-env.mjs'

const recipient = (process.env.BACKUP_RECIPIENT || (await readFile(new URL('../ops/backup-recipient.txt', import.meta.url), 'utf8'))).trim()
if (!/^age1[a-z0-9]{58}$/.test(recipient)) throw new Error('A valid age public recipient is required.')
const env = postgresEnv(process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL)
const directory = resolve(process.env.BACKUP_OUTPUT_DIR || 'backups')
await mkdir(directory, { recursive: true, mode: 0o700 })
const filename = join(directory, `pulseflow-${new Date().toISOString().replaceAll(':', '-')}.dump.age`)
const output = await open(filename, 'wx', 0o600)
const result = (child, name) => new Promise((resolve, reject) => {
  child.on('error', () => reject(new Error(`${name} could not start.`)))
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${name} failed; no valid backup was retained.`)))
})
let dump, encrypt
try {
  const databaseArgs = ['--format=custom', '--no-owner', '--no-acl', '--no-password']
  const command = process.env.PG_DUMP_CONTAINER ? 'docker' : (process.env.PG_DUMP_BIN || 'pg_dump')
  const args = process.env.PG_DUMP_CONTAINER
    ? ['run','--rm',...['PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE','PGSSLMODE','PGCONNECT_TIMEOUT'].flatMap(key=>['-e',key]),process.env.PG_DUMP_CONTAINER,'pg_dump',...databaseArgs]
    : databaseArgs
  dump = spawn(command, args, { env, stdio: ['ignore','pipe','ignore'] })
  encrypt = spawn(process.env.AGE_BIN || 'age', ['--encrypt','--recipient',recipient], { stdio: ['pipe',output.fd,'ignore'] })
  await Promise.all([result(dump,'Database export'),result(encrypt,'Backup encryption'),pipeline(dump.stdout,encrypt.stdin)])
  await output.close()
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(filename)) hash.update(chunk)
  const checksum = hash.digest('hex')
  await writeFile(`${filename}.sha256`,`${checksum}  ${filename.split('/').pop()}\n`,{mode:0o600})
  console.log(`Encrypted backup created: ${filename}`)
} catch (error) {
  dump?.kill(); encrypt?.kill()
  await output.close().catch(()=>{})
  await unlink(filename).catch(()=>{})
  throw error
}

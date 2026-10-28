import { spawn, spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { postgresEnv } from './postgres-env.mjs'

const [backup, identity] = process.argv.slice(2)
if (!backup || !identity) throw new Error('Usage: node scripts/restore-database.mjs backup.dump.age recovery-key.txt')
const env = postgresEnv(process.env.RESTORE_DATABASE_URL)
if (!/^pulseflow_restore_[a-z0-9_]+$/.test(env.PGDATABASE)) throw new Error('Restore target must be a separate pulseflow_restore_* database.')
const check = spawnSync(process.env.PSQL_BIN || 'psql',['-X','-A','-t','--no-password','-c',"SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')"],{env,encoding:'utf8'})
if (check.status !== 0 || check.stdout.trim() !== '0') throw new Error('Restore target must be reachable and empty. Existing data will never be overwritten.')
const decrypt = spawn(process.env.AGE_BIN || 'age',['--decrypt','--identity',resolve(identity),resolve(backup)],{stdio:['ignore','pipe','ignore']})
const restore = spawn(process.env.PG_RESTORE_BIN || 'pg_restore',['--no-owner','--no-acl','--exit-on-error','--single-transaction','--dbname',env.PGDATABASE],{env,stdio:['pipe','ignore','ignore']})
const result = (child,name) => new Promise((resolve,reject)=>{child.on('error',()=>reject(new Error(`${name} could not start.`)));child.on('exit',code=>code===0?resolve():reject(new Error(`${name} failed. Restore was rolled back.`)))})
try { await Promise.all([result(decrypt,'Decryption'),result(restore,'Restore'),pipeline(decrypt.stdout,restore.stdin)]);console.log('Restored backup into the isolated recovery database.') }
catch(error){decrypt.kill();restore.kill();throw error}

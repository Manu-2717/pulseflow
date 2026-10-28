import assert from 'node:assert/strict'
import { projectAssignees } from '../src/lib/assignment-options'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { authorizeProject,authorizeRoleChange,assertTaskProjectMove,insertProjectDependency } from '../src/lib/project-policy'
async function main(){
const db=new PrismaClient()
const url=new URL(process.env.DATABASE_URL??'')
if(!['localhost','127.0.0.1','::1'].includes(url.hostname))throw new Error('Authorization fixtures require a local database.')
const prefix=`rbac-${randomUUID()}`
const owner=prefix+'owner',admin=prefix+'admin',member=prefix+'member',other=prefix+'other'
let workspaceId=''
try{
 await db.user.createMany({data:[owner,admin,member,other].map(id=>({id,name:id,email:id+'@test.invalid'}))})
 const workspace=await db.workspace.create({data:{name:prefix,slug:prefix,members:{create:[{userId:owner,role:'LEADER'},... [admin,member,other].map(userId=>({userId,role:'MEMBER'}))]}}});workspaceId=workspace.id
 const a=await db.project.create({data:{workspaceId,name:'A',members:{create:[{userId:admin,role:'ADMIN'},{userId:member}]}}})
 const b=await db.project.create({data:{workspaceId,name:'B',members:{create:[{userId:other,role:'ADMIN'},{userId:member}]}}})
 const ta=await db.task.create({data:{workspaceId,projectId:a.id,code:'A',title:'A private task',description:'',priority:'HIGH',status:'IN_PROGRESS',estimatedPts:2,assigneeId:member}})
 await db.task.create({data:{workspaceId,projectId:b.id,code:'B',title:'B private task',description:'',priority:'HIGH',status:'IN_PROGRESS',estimatedPts:5,assigneeId:member}})
 assert.equal((await authorizeProject(db,workspaceId,a.id,admin,true)).projectRole,'ADMIN')
 await assert.rejects(authorizeProject(db,workspaceId,b.id,admin))
 await assert.rejects(authorizeProject(db,workspaceId,b.id,admin,true))
 await assert.rejects(authorizeProject(db,workspaceId,a.id,member,true))
 await assert.rejects(authorizeProject(db,workspaceId,null,member))
 assert.equal((await authorizeProject(db,workspaceId,null,owner,true)).projectRole,'OWNER')
 assert.equal((await authorizeProject(db,workspaceId,b.id,owner,true)).projectRole,'OWNER')
 const visible=await db.task.findMany({where:{workspaceId,projectId:a.id}})
 assert.deepEqual(visible.map(t=>t.code),['A'])
 assert.equal(visible.filter(t=>t.assigneeId===member).reduce((n,t)=>n+t.estimatedPts,0),2)
 for(const projectId of [a.id,b.id])assert.equal((await authorizeProject(db,workspaceId,projectId,member)).projectRole,'MEMBER')
 assert.throws(()=>authorizeRoleChange(false,undefined,'ADMIN'))
 assert.throws(()=>authorizeRoleChange(false,'ADMIN','MEMBER'))
 assert.throws(()=>authorizeRoleChange(false,'ADMIN',null))
 authorizeRoleChange(false,undefined,'MEMBER');authorizeRoleChange(true,'MEMBER','ADMIN')
 // An authorized project assignment uses that project's roster, including a shared user.
 await authorizeProject(db,workspaceId,a.id,admin,true)
 assert.ok(await db.projectMembership.findUnique({where:{projectId_userId:{projectId:a.id,userId:member}}}))
 assert.equal(await db.projectMembership.findUnique({where:{projectId_userId:{projectId:a.id,userId:other}}}),null)
 await db.task.update({where:{id:ta.id},data:{assigneeId:member}})
 // Task form choices follow the selected project, including edits in owner All scope.
 const people=[{id:owner},{id:admin},{id:member},{id:other}]
 const rosters=[{id:a.id,memberIds:[admin,member]},{id:b.id,memberIds:[other,member]}]
 assert.deepEqual(projectAssignees(people,rosters,a.id).map(p=>p.id),[admin,member])
 assert.deepEqual(projectAssignees(people,rosters,b.id).map(p=>p.id),[member,other])
 assert.equal(projectAssignees(people,rosters,null).length,4)
 // Both ends of a dependency must stay within their project when moving either task.
 const dependent=await db.task.create({data:{workspaceId,projectId:a.id,code:'A2',title:'Dependent',description:'',priority:'LOW',status:'QUEUED',estimatedPts:1}})
 await db.taskDependency.create({data:{taskId:dependent.id,dependsOnId:ta.id}})
 await assert.rejects(assertTaskProjectMove(db,dependent.id,b.id),/Remove task dependencies/)
 await assert.rejects(assertTaskProjectMove(db,ta.id,b.id),/Remove task dependencies/)
 await assert.rejects(assertTaskProjectMove(db,ta.id,null),/Remove task dependencies/)
 await assertTaskProjectMove(db,ta.id,a.id)
 await db.taskDependency.deleteMany({where:{taskId:dependent.id}})
 await assertTaskProjectMove(db,ta.id,b.id)
 // Interleave fresh dependency reads with a committed task move before the insert.
 let readDependency!:()=>void,continueDependency!:()=>void
 const readSignal=new Promise<void>(resolve=>{readDependency=resolve})
 const continueSignal=new Promise<void>(resolve=>{continueDependency=resolve})
 const dependencyWrite=db.$transaction(async tx=>{
  const wrapped={task:tx.task,taskDependency:new Proxy(tx.taskDependency,{get(target,property){
   if(property==='upsert')return async(args:Parameters<typeof target.upsert>[0])=>{readDependency();await continueSignal;return target.upsert(args)}
   return Reflect.get(target,property)
  }})}
  await insertProjectDependency(wrapped,dependent.id,ta.id,a.id)
 },{isolationLevel:'Serializable'})
 const conflict=assert.rejects(dependencyWrite,(error:unknown)=>(error as {code?:string}).code==='P2034')
 await readSignal
 await db.$transaction(async tx=>{await assertTaskProjectMove(tx,dependent.id,b.id);await tx.task.update({where:{id:dependent.id},data:{projectId:b.id}})},{isolationLevel:'Serializable'})
 continueDependency()
 await conflict
 assert.equal(await db.taskDependency.count({where:{taskId:dependent.id,dependsOnId:ta.id}}),0)
 await assert.rejects(db.$transaction(tx=>insertProjectDependency(tx,dependent.id,ta.id,b.id),{isolationLevel:'Serializable'}),/same project/)
 // Reproduce a stale recurrence/dispatch assignment while removal holds its row lock.
 const stale=await db.task.findUniqueOrThrow({where:{id:ta.id}})
 let deleted!:()=>void,release!:()=>void
 const deletedSignal=new Promise<void>(resolve=>{deleted=resolve})
 const releaseSignal=new Promise<void>(resolve=>{release=resolve})
 const removal=db.$transaction(async tx=>{
  await tx.projectMembership.delete({where:{projectId_userId:{projectId:a.id,userId:member}}})
  deleted()
  await releaseSignal
 })
 await deletedSignal
 // This separate connection tries to reuse the previously read assignee while deletion is in flight.
 const staleWrite=db.task.create({data:{workspaceId,projectId:a.id,code:'STALE',title:'Stale recurrence',description:'',priority:'LOW',status:'QUEUED',estimatedPts:1,assigneeId:stale.assigneeId}})
 const denied=assert.rejects(staleWrite,(error:unknown)=>(error as {code?:string}).code==='P2003')
 release()
 await Promise.all([removal,denied])
 const unassigned=await db.task.findUniqueOrThrow({where:{id:ta.id}})
 assert.equal(unassigned.assigneeId,null)
 assert.equal(unassigned.projectId,a.id)
 assert.equal(await db.task.count({where:{workspaceId,code:'STALE'}}),0)
 await assert.rejects(db.task.update({where:{id:ta.id},data:{assigneeId:member}}),(error:unknown)=>(error as {code?:string}).code==='P2003')
 // Unprojected owner tasks retain the existing workspace-only assignment model.
 const legacy=await db.task.create({data:{workspaceId,code:'LEGACY',title:'Legacy',description:'',priority:'LOW',status:'QUEUED',estimatedPts:1,assigneeId:member}})
 assert.equal(legacy.projectId,null)
 // Verify every existing projected assignee was preserved by the migration backfill.
 const missing=await db.$queryRaw<{count:bigint}[]>`SELECT count(*) FROM "Task" t JOIN "Membership" m ON m."workspaceId"=t."workspaceId" AND m."userId"=t."assigneeId" WHERE t."projectId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ProjectMembership" pm WHERE pm."projectId"=t."projectId" AND pm."userId"=t."assigneeId")`
 assert.equal(Number(missing[0].count),0)
 console.log('PASS: project read/manage isolation, shared-user capacity scope, owner override, legacy denial, admin escalation, assignments, roster options, dependency moves, concurrent dependency insert/move, concurrent removal/stale assignment, backfill')
}finally{
 if(workspaceId)await db.workspace.delete({where:{id:workspaceId}})
 await db.user.deleteMany({where:{id:{in:[owner,admin,member,other]}}})
 await db.$disconnect()
}

}
main().catch(error=>{console.error(error);process.exitCode=1})

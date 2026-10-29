import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { transitionTask,postTaskComment } from '../src/lib/task-review'
import { authorizeProject,authorizeRoleChange } from '../src/lib/project-policy'
async function main(){
const db=new PrismaClient()
if(!['localhost','127.0.0.1','::1'].includes(new URL(process.env.DATABASE_URL??'').hostname))throw new Error('Review fixtures require a local database.')
const prefix='review-'+randomUUID(),ids=['owner','admin','mentor','member','outsider'].map(role=>prefix+role)
let workspaceId=''
try{
 await db.user.createMany({data:ids.map(id=>({id,name:id,email:id+'@test.invalid'}))})
 const [owner,admin,mentor,member,outsider]=ids
 const workspace=await db.workspace.create({data:{name:prefix,slug:prefix,members:{create:ids.map(userId=>({userId,role:userId===owner?'LEADER':'MEMBER'}))}}});workspaceId=workspace.id
 const project=await db.project.create({data:{workspaceId,name:'Review',members:{create:[{userId:admin,role:'ADMIN'},{userId:mentor,role:'MENTOR'},{userId:member,role:'MEMBER'}]}}})
 const otherProject=await db.project.create({data:{workspaceId,name:'Private',members:{create:{userId:outsider}}}})
 const task=await db.task.create({data:{workspaceId,projectId:project.id,assigneeId:member,code:'REVIEW-1',title:'Review test',description:'',priority:'MEDIUM',estimatedPts:2,status:'QUEUED'}})
 await transitionTask(db,task.id,member,'advance')
 assert.equal((await db.task.findUniqueOrThrow({where:{id:task.id}})).status,'IN_PROGRESS')
 await postTaskComment(db,task.id,member,'Implementation is ready. <script>alert(1)</script>')
 await postTaskComment(db,task.id,mentor,'I will check the implementation.')
 await assert.rejects(postTaskComment(db,task.id,outsider,'Not allowed'),/access denied/)
 await assert.rejects(postTaskComment(db,task.id,member,'   '),/1–5,000/)
 await assert.rejects(postTaskComment(db,task.id,member,'a'.repeat(5001)),/1–5,000/)
 await transitionTask(db,task.id,member,'advance')
 assert.equal((await db.task.findUniqueOrThrow({where:{id:task.id}})).status,'IN_REVIEW')
 assert.equal((await db.task.findUniqueOrThrow({where:{id:task.id}})).completedAt,null)
 await assert.rejects(transitionTask(db,task.id,member,'advance'),/Waiting/)
 await assert.rejects(transitionTask(db,task.id,member,'approve'),/Only a leader/)
 await assert.rejects(transitionTask(db,task.id,outsider,'approve'),/access denied/)
 await assert.rejects(transitionTask(db,task.id,mentor,'request_changes',''),/Explain/)
 await transitionTask(db,task.id,mentor,'request_changes','Please add a regression check.')
 assert.equal((await db.task.findUniqueOrThrow({where:{id:task.id}})).status,'IN_PROGRESS')
 await transitionTask(db,task.id,member,'advance')
 const results=await Promise.allSettled([transitionTask(db,task.id,mentor,'approve','Verified the fix.'),transitionTask(db,task.id,admin,'approve','Verified too.')])
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1)
 assert.equal((await db.task.findUniqueOrThrow({where:{id:task.id}})).status,'DONE')
 assert.ok((await db.task.findUniqueOrThrow({where:{id:task.id}})).completedAt)
 assert.equal(await db.taskComment.count({where:{taskId:task.id,kind:'APPROVED'}}),1)
 await assert.rejects(transitionTask(db,task.id,member,'advance'),/Only a reviewer/)
 await transitionTask(db,task.id,owner,'advance')
 await db.task.update({where:{id:task.id},data:{assigneeId:mentor,status:'IN_REVIEW'}})
 await assert.rejects(transitionTask(db,task.id,mentor,'approve'),/own task/)
 await transitionTask(db,task.id,owner,'approve')
 await assert.rejects(authorizeProject(db,workspaceId,otherProject.id,mentor),/access denied/)
 await assert.rejects(authorizeProject(db,workspaceId,project.id,mentor,true),/access denied/)
 authorizeRoleChange(false,'MEMBER','MENTOR')
 assert.throws(()=>authorizeRoleChange(false,'MENTOR','ADMIN'))
 await db.task.update({where:{id:task.id},data:{status:'IN_PROGRESS'}})
 await db.subtask.create({data:{taskId:task.id,title:'Required check'}})
 await assert.rejects(transitionTask(db,task.id,mentor,'advance'),/subtasks/)
 await db.subtask.updateMany({where:{taskId:task.id},data:{done:true}})
 await db.issueThread.create({data:{workspaceId,taskId:task.id,title:'Blocker',category:'BUG',authorId:mentor}})
 await assert.rejects(transitionTask(db,task.id,mentor,'advance'),/blockers/)
 await db.issueThread.updateMany({where:{taskId:task.id},data:{status:'RESOLVED'}})
 await transitionTask(db,task.id,mentor,'advance')
 await db.projectMembership.delete({where:{projectId_userId:{projectId:project.id,userId:admin}}})
 await assert.rejects(transitionTask(db,task.id,admin,'approve'),/access denied/)
 const privateTask=await db.task.create({data:{workspaceId,projectId:otherProject.id,assigneeId:outsider,code:'PRIVATE',title:'Private task',description:'',priority:'MEDIUM',estimatedPts:2,status:'IN_REVIEW'}})
 await assert.rejects(postTaskComment(db,privateTask.id,mentor,'Cross-project comment'),/access denied/)
 console.log('PASS: review lifecycle, changes requested, independent approval, atomic audit, concurrent approval, project boundaries, removed reviewer, mentor permissions, comment validation, blockers and subtasks.')
}finally{
 if(workspaceId)await db.workspace.delete({where:{id:workspaceId}})
 await db.user.deleteMany({where:{id:{in:ids}}})
 await db.$disconnect()
}

}
main().catch(error=>{console.error(error);process.exitCode=1})

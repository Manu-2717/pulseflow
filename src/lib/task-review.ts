import type { PrismaClient } from '@prisma/client'
import { authorizeProject } from './project-policy'

export type ReviewAction = 'advance'|'approve'|'request_changes'
export function isTaskReviewer(workspaceRole:string,projectRole:string){return workspaceRole==='LEADER'||['ADMIN','MENTOR'].includes(projectRole)}

export async function transitionTask(db:PrismaClient,taskId:string,userId:string,action:ReviewAction,feedback=''){
 if(!['advance','approve','request_changes'].includes(action))throw new Error('Invalid task action.')
 if(feedback.trim().length>5000)throw new Error('Feedback must be at most 5,000 characters.')
 for(let attempt=0;attempt<3;attempt++){
  try{return await db.$transaction(async tx=>{
   const task=await tx.task.findUniqueOrThrow({where:{id:taskId},include:{threads:true,subtasks:true}})
   const {membership,projectRole}=await authorizeProject(tx,task.workspaceId,task.projectId,userId)
   const reviewer=isTaskReviewer(membership.role,projectRole)
   let next:string,kind:string|undefined,content=feedback.trim()
   if(action==='approve'||action==='request_changes'){
    if(!reviewer)throw new Error('Only a leader, project admin, or mentor can review tasks.')
    if(task.assigneeId===userId)throw new Error('Another reviewer must check your work. You cannot approve or review your own task.')
    if(task.status!=='IN_REVIEW')throw new Error('This task is not awaiting review. Refresh and try again.')
    if(action==='request_changes'){
     if(!content)throw new Error('Explain the changes needed before sending this task back.')
     next='IN_PROGRESS';kind='CHANGES_REQUESTED'
    }else{next='DONE';kind='APPROVED';content=content||'Reviewed and approved this task.'}
   }else{
    if(task.assigneeId!==userId&&!reviewer)throw new Error('Only the assignee or a reviewer can update this task.')
    if(task.status==='QUEUED')next='IN_PROGRESS'
    else if(task.status==='IN_PROGRESS'){next='IN_REVIEW';kind='SUBMITTED';content='Submitted this task for review.'}
    else if(task.status==='DONE'){
     if(!reviewer)throw new Error('Only a reviewer can reopen a completed task.')
     next='QUEUED';kind='REOPENED';content='Reopened this task.'
    }else if(task.status==='IN_REVIEW')throw new Error('Waiting for a leader, admin, or mentor to review this task.')
    else throw new Error('Resolve this task’s blockers before submitting work.')
   }
   if(next==='IN_REVIEW'||next==='DONE'){
    if(task.threads.some(thread=>thread.status==='OPEN'))throw new Error('Resolve open blockers before submitting or approving this task.')
    if(task.subtasks.some(step=>!step.done))throw new Error('Finish all subtasks before submitting or approving this task.')
   }
   if(['IN_PROGRESS','IN_REVIEW','DONE'].includes(next)){
    const dependencies=await tx.taskDependency.count({where:{taskId,dependsOn:{status:{not:'DONE'}}}})
    if(dependencies)throw new Error('Complete dependent tasks first.')
   }
   await tx.task.update({where:{id:taskId},data:{status:next,completedAt:next==='DONE'?new Date():null}})
   if(kind)await tx.taskComment.create({data:{taskId,authorId:userId,kind,content}})
   return {task,next}
  },{isolationLevel:'Serializable'})}
  catch(error){if((error as {code?:string}).code==='P2034'&&attempt<2)continue;throw error}
 }
 throw new Error('Please try again.')
}

export async function postTaskComment(db:PrismaClient,taskId:string,userId:string,content:string){
 const value=content.trim()
 if(!value||value.length>5000)throw new Error('Comment must be 1–5,000 characters.')
 return db.$transaction(async tx=>{
  const task=await tx.task.findUniqueOrThrow({where:{id:taskId}})
  await authorizeProject(tx,task.workspaceId,task.projectId,userId)
  return tx.taskComment.create({data:{taskId,authorId:userId,content:value}})
 },{isolationLevel:'Serializable'})
}

import { createHash, randomBytes } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { authorizeProject } from './project-policy'

export async function issueInvitation(db:PrismaClient,workspaceId:string,actorId:string,projectId?:string){
 await authorizeProject(db,workspaceId,projectId||null,actorId,true)
 const token=randomBytes(32).toString('base64url')
 await db.invite.create({data:{workspaceId,projectId:projectId||null,tokenHash:createHash('sha256').update(token).digest('hex'),createdById:actorId,role:'MEMBER',expiresAt:new Date(Date.now()+7*24*60*60*1000),maxUses:10}})
 return token
}

export async function redeemInvitation(db:PrismaClient,token:string,userId:string){
 if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))throw new Error('Invalid invitation link.')
 const tokenHash=createHash('sha256').update(token).digest('hex')
 for(let attempt=0;attempt<3;attempt++){
  try{return await db.$transaction(async tx=>{
   const now=new Date()
   const invite=await tx.invite.findUnique({where:{tokenHash},include:{workspace:true,project:true}})
   if(!invite||invite.expiresAt<=now||invite.useCount>=invite.maxUses)throw new Error('This invitation has expired or has been used up.')
   if(invite.projectId&&(!invite.project||invite.project.workspaceId!==invite.workspaceId))throw new Error('This project invitation is invalid.')
   const workspaceMember=await tx.membership.findUnique({where:{workspaceId_userId:{workspaceId:invite.workspaceId,userId}}})
   const projectMember=invite.projectId?await tx.projectMembership.findUnique({where:{projectId_userId:{projectId:invite.projectId,userId}}}):null
   if(!workspaceMember||(invite.projectId&&!projectMember)){
    const changed=await tx.invite.updateMany({where:{id:invite.id,useCount:{lt:invite.maxUses},expiresAt:{gt:now}},data:{useCount:{increment:1}}})
    if(changed.count!==1)throw new Error('This invitation is no longer available.')
    await tx.membership.upsert({where:{workspaceId_userId:{workspaceId:invite.workspaceId,userId}},create:{workspaceId:invite.workspaceId,userId,role:'MEMBER'},update:{}})
    if(invite.projectId)await tx.projectMembership.upsert({where:{projectId_userId:{projectId:invite.projectId,userId}},create:{projectId:invite.projectId,userId,role:'MEMBER'},update:{}})
   }
   return {slug:invite.workspace.slug,projectId:invite.projectId}
  },{isolationLevel:'Serializable'})}
  catch(error){if((error as {code?:string}).code==='P2034'&&attempt<2)continue;throw error}
 }
 throw new Error('Please try joining again.')
}

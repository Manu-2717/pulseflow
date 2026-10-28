import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './auth'
import { authorizeProject } from './project-policy'
import { prisma } from './prisma'

export async function currentUser(){
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}
export async function requireUser(){
  const user = await currentUser()
  if(!user) redirect('/login')
  return user
}
export async function requireMembership(workspaceId:string){
  const user=await requireUser()
  const membership=await prisma.membership.findUnique({where:{workspaceId_userId:{workspaceId,userId:user.id}}})
  if(!membership) throw new Error('Workspace access denied.')
  return {user,membership}
}
export async function requireLeader(workspaceId:string){
  const context=await requireMembership(workspaceId)
  if(context.membership.role!=='LEADER') throw new Error('Leader access required.')
  return context
}

export async function requireProject(workspaceId:string,projectId:string|null,manage=false){
 const user=await requireUser()
 const policy=await authorizeProject(prisma,workspaceId,projectId,user.id,manage)
 return {user,...policy}
}
export async function requireTask(taskId:string,manage=false){
 const task=await prisma.task.findUniqueOrThrow({where:{id:taskId}})
 const context=await requireProject(task.workspaceId,task.projectId,manage)
 return {task,...context}
}
export async function requireAssignee(workspaceId:string,projectId:string|null,userId:string){
 const member=await prisma.membership.findUnique({where:{workspaceId_userId:{workspaceId,userId}}})
 if(!member)throw new Error('Assignee is not in this workspace.')
 if(projectId&&!await prisma.projectMembership.findUnique({where:{projectId_userId:{projectId,userId}}}))throw new Error('Assignee must belong to this project.')
}

'use server'
import { randomBytes } from 'node:crypto'
import { issueInvitation,redeemInvitation } from '@/lib/invitations'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { authorizeRoleChange } from '@/lib/project-policy'
import { prisma } from '@/lib/prisma'
import { requireUser,requireMembership } from '@/lib/access'

const slugify=(text:string)=>text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)
export async function createWorkspace(name:string,specialty:string){
  const user=await requireUser()
  const trimmed=name.trim()
  if(trimmed.length<2||trimmed.length>80)throw new Error('Workspace name must be 2–80 characters.')
  if(specialty.length>40)throw new Error('Specialty is too long.')
  const slug=`${slugify(trimmed)||'team'}-${randomBytes(3).toString('hex')}`
  await prisma.$transaction(async tx=>{
    await tx.workspace.create({data:{name:trimmed,slug,members:{create:{userId:user.id,role:'LEADER'}}}})
    await tx.user.update({where:{id:user.id},data:{specialty:specialty.trim()||'General'}})
  })
  revalidatePath('/')
  return slug
}
export async function createInvite(workspaceId:string,projectId?:string){
  const user=await requireUser()
  return issueInvitation(prisma,workspaceId,user.id,projectId)
}
export async function acceptInvite(token:string){
  const user=await requireUser()
  const result=await redeemInvitation(prisma,token,user.id)
  revalidatePath('/','layout')
  redirect(`/w/${result.slug}${result.projectId?`?project=${result.projectId}`:''}`)
}
export async function updateProfile(workspaceId:string,specialty:string){
  const {user}=await requireMembership(workspaceId)
  const value=specialty.trim()
  if(value.length<2||value.length>40)throw new Error('Specialty must be 2–40 characters.')
  await prisma.user.update({where:{id:user.id},data:{specialty:value}})
  revalidatePath('/')
}

export async function setProjectMember(projectId:string,userId:string,role:'ADMIN'|'MEMBER'|'MENTOR'|null){
 const project=await prisma.project.findUniqueOrThrow({where:{id:projectId}})
 const {requireProject}=await import('@/lib/access')
 const context=await requireProject(project.workspaceId,projectId,true)
 const target=await prisma.membership.findUnique({where:{workspaceId_userId:{workspaceId:project.workspaceId,userId}}})
 if(!target)throw new Error('Choose a workspace member.')
 if(role!==null&&role!=='ADMIN'&&role!=='MEMBER'&&role!=='MENTOR')throw new Error('Invalid project role.')
 const existing=await prisma.projectMembership.findUnique({where:{projectId_userId:{projectId,userId}}})
 authorizeRoleChange(context.membership.role==='LEADER',existing?.role,role)
 await prisma.$transaction(async tx=>{
  if(role===null){await tx.task.updateMany({where:{projectId,assigneeId:userId},data:{assigneeId:null}});await tx.projectMembership.deleteMany({where:{projectId,userId}})}
  else await tx.projectMembership.upsert({where:{projectId_userId:{projectId,userId}},create:{projectId,userId,role},update:{role}})
 })
 revalidatePath('/','layout')
}

export async function addProjectMemberByEmail(projectId:string,email:string){
 const project=await prisma.project.findUniqueOrThrow({where:{id:projectId}})
 const {requireProject}=await import('@/lib/access')
 await requireProject(project.workspaceId,projectId,true)
 const target=await prisma.membership.findFirst({where:{workspaceId:project.workspaceId,user:{email:email.trim().toLowerCase()}},select:{userId:true}})
 if(!target)throw new Error('No workspace member has that email.')
 // Adding an existing admin is a no-op, never an implicit demotion.
 await prisma.projectMembership.upsert({where:{projectId_userId:{projectId,userId:target.userId}},create:{projectId,userId:target.userId,role:'MEMBER'},update:{}})
 revalidatePath('/','layout')
}

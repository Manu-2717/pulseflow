'use server'
import { randomBytes,createHash } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser,requireLeader,requireMembership } from '@/lib/access'

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
export async function createInvite(workspaceId:string){
  const {user}=await requireLeader(workspaceId)
  const token=randomBytes(32).toString('base64url')
  const tokenHash=createHash('sha256').update(token).digest('hex')
  await prisma.invite.create({data:{workspaceId,tokenHash,createdById:user.id,role:'MEMBER',expiresAt:new Date(Date.now()+7*24*60*60*1000),maxUses:10}})
  return token
}
export async function acceptInvite(token:string){
  const user=await requireUser()
  if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))throw new Error('Invalid invitation link.')
  const tokenHash=createHash('sha256').update(token).digest('hex')
  const invite=await prisma.invite.findUnique({where:{tokenHash},include:{workspace:true}})
  if(!invite||invite.expiresAt<new Date()||invite.useCount>=invite.maxUses)throw new Error('This invitation has expired or has been used up.')
  const existing=await prisma.membership.findUnique({where:{workspaceId_userId:{workspaceId:invite.workspaceId,userId:user.id}}})
  if(!existing){
    await prisma.$transaction(async tx=>{
      const updated=await tx.invite.updateMany({where:{id:invite.id,useCount:{lt:invite.maxUses},expiresAt:{gt:new Date()}},data:{useCount:{increment:1}}})
      if(updated.count!==1)throw new Error('This invitation is no longer available.')
      await tx.membership.create({data:{workspaceId:invite.workspaceId,userId:user.id,role:invite.role}})
    })
  }
  revalidatePath('/')
  redirect(`/w/${invite.workspace.slug}`)
}
export async function updateProfile(workspaceId:string,specialty:string){
  const {user}=await requireMembership(workspaceId)
  const value=specialty.trim()
  if(value.length<2||value.length>40)throw new Error('Specialty must be 2–40 characters.')
  await prisma.user.update({where:{id:user.id},data:{specialty:value}})
  revalidatePath('/')
}

import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './auth'
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

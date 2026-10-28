import 'server-only'
import { prisma } from './prisma'
import { requireMembership } from './access'
export async function projectScope(workspaceId:string,selected?:string){
 const context=await requireMembership(workspaceId)
 const owner=context.membership.role==='LEADER'
 const projects=await prisma.project.findMany({where:{workspaceId,...(!owner?{members:{some:{userId:context.user.id}}}:{})},include:{members:true},orderBy:{createdAt:'asc'}})
 if(selected&&!projects.some(p=>p.id===selected))throw new Error('Project access denied.')
 const projectId=selected||(!owner?projects[0]?.id:undefined)
 const taskWhere={workspaceId,...(projectId?{projectId}:!owner?{projectId:{in:[] as string[]}}:{})}
 const active=projects.find(p=>p.id===projectId)
 const manage=owner||active?.members.some(m=>m.userId===context.user.id&&m.role==='ADMIN')===true
 const memberships=await prisma.membership.findMany({where:{workspaceId,...(active?{OR:[{userId:{in:active.members.map(m=>m.userId)}},{userId:context.user.id}]}:!owner?{userId:context.user.id}:{})},include:{user:true},orderBy:{joinedAt:'asc'}})
 return {...context,owner,projects,projectId,taskWhere,manage,memberships,active}
}

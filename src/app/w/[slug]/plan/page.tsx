import { notFound, redirect } from 'next/navigation'
import { currentUser } from '@/lib/access'
import { prisma } from '@/lib/prisma'
import { Planner } from '@/components/planner'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Planning | PulseFlow', robots: { index: false, follow: false } }

export default async function PlanningPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 const user=await currentUser()
 if(!user)redirect(`/login?next=${encodeURIComponent(`/w/${slug}/plan`)}`)
 const workspace=await prisma.workspace.findUnique({where:{slug}})
 if(!workspace)notFound()
 const membership=await prisma.membership.findUnique({where:{workspaceId_userId:{workspaceId:workspace.id,userId:user.id}}})
 if(!membership)notFound()
 const [tasks,projects,documents,goals,automation]=await Promise.all([
  prisma.task.findMany({where:{workspaceId:workspace.id},orderBy:{createdAt:'desc'},include:{assignee:{select:{name:true}},project:true,subtasks:{orderBy:{createdAt:'asc'}},predecessors:{include:{dependsOn:{select:{id:true,code:true,title:true,status:true}}}},timeEntries:{include:{user:{select:{name:true}}},orderBy:{createdAt:'desc'}}}}),
  prisma.project.findMany({where:{workspaceId:workspace.id},orderBy:{createdAt:'asc'}}),
  prisma.workspaceDocument.findMany({where:{workspaceId:workspace.id},orderBy:{updatedAt:'desc'}}),
  prisma.goal.findMany({where:{workspaceId:workspace.id},orderBy:{createdAt:'desc'}}),
  prisma.automationRule.findUnique({where:{workspaceId_trigger_action:{workspaceId:workspace.id,trigger:'TASK_COMPLETED',action:'AUTO_PULL_NEXT'}}})
 ])
 return <Planner workspace={{id:workspace.id,name:workspace.name,slug}} role={membership.role} tasks={JSON.parse(JSON.stringify(tasks))} projects={JSON.parse(JSON.stringify(projects))} documents={JSON.parse(JSON.stringify(documents))} goals={JSON.parse(JSON.stringify(goals))} automationEnabled={automation?.enabled??false}/>
}

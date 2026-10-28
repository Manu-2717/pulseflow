import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { currentUser } from '@/lib/access'
import { projectScope } from '@/lib/project-scope'
import { prisma } from '@/lib/prisma'
import { Planner } from '@/components/planner'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Planning | PulseFlow', robots: { index: false, follow: false } }

export default async function PlanningPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{project?:string}>}){
 const {slug}=await params
 const user=await currentUser()
 if(!user)redirect(`/login?next=${encodeURIComponent(`/w/${slug}/plan`)}`)
 const workspace=await prisma.workspace.findUnique({where:{slug}})
 if(!workspace)notFound()
 const membership=await prisma.membership.findUnique({where:{workspaceId_userId:{workspaceId:workspace.id,userId:user.id}}})
 if(!membership)notFound()
 const scope=await projectScope(workspace.id,(await searchParams).project)
 const [tasks,projects,documents,goals,automation,sprints,customFields,templates]=await Promise.all([
  prisma.task.findMany({where:scope.taskWhere,orderBy:{createdAt:'desc'},include:{assignee:{select:{name:true}},project:true,subtasks:{orderBy:{createdAt:'asc'}},predecessors:{where:{dependsOn:scope.taskWhere},include:{dependsOn:{select:{id:true,code:true,title:true,status:true}}}},timeEntries:{include:{user:{select:{name:true}}},orderBy:{createdAt:'desc'}},fieldValues:scope.owner,externalLinks:true}}),
  Promise.resolve(scope.projects),
  prisma.workspaceDocument.findMany({where:{workspaceId:scope.owner?workspace.id:'__denied__'},orderBy:{updatedAt:'desc'}}),
  prisma.goal.findMany({where:{workspaceId:scope.owner?workspace.id:'__denied__'},orderBy:{createdAt:'desc'}}),
  scope.owner?prisma.automationRule.findUnique({where:{workspaceId_trigger_action:{workspaceId:workspace.id,trigger:'TASK_COMPLETED',action:'AUTO_PULL_NEXT'}}}):Promise.resolve(null),
  prisma.sprint.findMany({where:{workspaceId:scope.owner?workspace.id:'__denied__'},orderBy:{startDate:'desc'}}),
  prisma.customField.findMany({where:{workspaceId:scope.owner?workspace.id:'__denied__'},orderBy:{createdAt:'asc'}}),
  prisma.taskTemplate.findMany({where:{workspaceId:scope.owner?workspace.id:'__denied__'},orderBy:{createdAt:'desc'}})
 ])
 if(!scope.owner&&!scope.active)return <main className="planner-page"><div className="planner-wrap"><h1>Project access needed</h1><p>Ask your workspace owner or a project admin to add you to a project before planning work.</p><Link href={`/w/${slug}`}>Return to workspace</Link></div></main>
 return <><div className="project-selector"><strong>Project scope</strong>{scope.owner&&<Link href={`/w/${slug}/plan`}>All projects</Link>}{scope.projects.map(p=><Link key={p.id} href={`/w/${slug}/plan?project=${p.id}`} aria-current={scope.projectId===p.id?'page':undefined}>{p.name}</Link>)}</div><Planner key={scope.projectId??'all-projects'} selectedProjectId={scope.projectId} workspace={{id:workspace.id,name:workspace.name,slug}} role={scope.owner?'LEADER':scope.manage?'ADMIN':'MEMBER'} asOf={new Date().toISOString()} tasks={JSON.parse(JSON.stringify(tasks))} projects={JSON.parse(JSON.stringify((scope.owner?projects:projects.filter(p=>p.id===scope.projectId)).map(p=>({id:p.id,name:p.name,color:p.color}))))} documents={JSON.parse(JSON.stringify(documents))} goals={JSON.parse(JSON.stringify(goals))} sprints={JSON.parse(JSON.stringify(sprints))} customFields={JSON.parse(JSON.stringify(customFields))} templates={JSON.parse(JSON.stringify(templates))} automationEnabled={automation?.enabled??false}/></>
}

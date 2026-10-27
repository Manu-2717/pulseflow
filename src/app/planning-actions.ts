'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireLeader, requireMembership } from '@/lib/access'

const refresh = () => revalidatePath('/w/[slug]/plan', 'page')
function title(value:string){const result=value.trim();if(result.length<2||result.length>160)throw new Error('Use a title between 2 and 160 characters.');return result}
function date(value:string|null){if(!value)return null;const result=new Date(`${value}T12:00:00.000Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(result.getTime()))throw new Error('Invalid date.');return result}
async function taskContext(taskId:string){const task=await prisma.task.findUniqueOrThrow({where:{id:taskId}});const access=await requireMembership(task.workspaceId);return {task,...access}}

export async function createProject(workspaceId:string,name:string){await requireLeader(workspaceId);await prisma.project.create({data:{workspaceId,name:title(name)}});refresh()}
export async function setTaskPlanning(taskId:string,input:{projectId?:string|null;startDate?:string|null;dueDate?:string|null}){
 const {task}=await taskContext(taskId);await requireLeader(task.workspaceId)
 const data:{projectId?:string|null;startDate?:Date|null;dueDate?:Date|null}={}
 if(input.projectId!==undefined){if(input.projectId){const project=await prisma.project.findFirst({where:{id:input.projectId,workspaceId:task.workspaceId}});if(!project)throw new Error('Invalid project.')}data.projectId=input.projectId}
 if(input.startDate!==undefined)data.startDate=date(input.startDate)
 if(input.dueDate!==undefined)data.dueDate=date(input.dueDate)
 const start=data.startDate===undefined?task.startDate:data.startDate,due=data.dueDate===undefined?task.dueDate:data.dueDate
 if(start&&due&&start>due)throw new Error('Due date must be after the start date.')
 await prisma.task.update({where:{id:taskId},data});refresh()
}
export async function addSubtask(taskId:string,name:string){await taskContext(taskId);await prisma.subtask.create({data:{taskId,title:title(name)}});refresh()}
export async function toggleSubtask(subtaskId:string){const item=await prisma.subtask.findUniqueOrThrow({where:{id:subtaskId},include:{task:true}});await requireMembership(item.task.workspaceId);await prisma.subtask.update({where:{id:subtaskId},data:{done:!item.done}});refresh()}
export async function addDependency(taskId:string,dependsOnId:string){const {task}=await taskContext(taskId);await requireLeader(task.workspaceId);if(taskId===dependsOnId)throw new Error('A task cannot depend on itself.');const source=await prisma.task.findFirst({where:{id:dependsOnId,workspaceId:task.workspaceId}});if(!source)throw new Error('Select a task in this workspace.');const reverse=await prisma.taskDependency.findUnique({where:{taskId_dependsOnId:{taskId:dependsOnId,dependsOnId:taskId}}});if(reverse)throw new Error('This creates a circular dependency.');await prisma.taskDependency.upsert({where:{taskId_dependsOnId:{taskId,dependsOnId}},create:{taskId,dependsOnId},update:{}});refresh()}
export async function logTime(taskId:string,minutes:number,note:string){const {user}=await taskContext(taskId);if(!Number.isInteger(minutes)||minutes<1||minutes>1440)throw new Error('Log between 1 and 1440 minutes.');if(note.length>500)throw new Error('Note is too long.');await prisma.timeEntry.create({data:{taskId,userId:user.id,minutes,note:note.trim()}});refresh()}
export async function createDocument(workspaceId:string,name:string){await requireMembership(workspaceId);await prisma.workspaceDocument.create({data:{workspaceId,title:title(name)}});refresh()}
export async function saveDocument(documentId:string,name:string,content:string){const doc=await prisma.workspaceDocument.findUniqueOrThrow({where:{id:documentId}});await requireMembership(doc.workspaceId);if(content.length>50000)throw new Error('Document is too long.');await prisma.workspaceDocument.update({where:{id:documentId},data:{title:title(name),content}});refresh()}
export async function createGoal(workspaceId:string,name:string,target:number,dueDate:string|null){await requireLeader(workspaceId);if(!Number.isInteger(target)||target<1||target>1000000)throw new Error('Target must be a positive number.');await prisma.goal.create({data:{workspaceId,title:title(name),target,dueDate:date(dueDate)}});refresh()}
export async function updateGoal(goalId:string,current:number){const goal=await prisma.goal.findUniqueOrThrow({where:{id:goalId}});await requireLeader(goal.workspaceId);if(!Number.isInteger(current)||current<0||current>1000000)throw new Error('Progress must be a nonnegative number.');await prisma.goal.update({where:{id:goalId},data:{current}});refresh()}
export async function setAutomation(workspaceId:string,enabled:boolean){await requireLeader(workspaceId);await prisma.automationRule.upsert({where:{workspaceId_trigger_action:{workspaceId,trigger:'TASK_COMPLETED',action:'AUTO_PULL_NEXT'}},create:{workspaceId,trigger:'TASK_COMPLETED',action:'AUTO_PULL_NEXT',enabled},update:{enabled}});refresh()}

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

export async function createSprint(workspaceId:string,input:{name:string;goal:string;startDate:string;endDate:string}){
 await requireLeader(workspaceId)
 const start=date(input.startDate),end=date(input.endDate)
 if(!start||!end||end<start)throw new Error('Sprint dates must be in order.')
 if(input.goal.length>500)throw new Error('Sprint goal is too long.')
 await prisma.sprint.create({data:{workspaceId,name:title(input.name),goal:input.goal.trim(),startDate:start,endDate:end}});refresh()
}
export async function assignSprint(taskId:string,sprintId:string|null){const {task}=await taskContext(taskId);await requireLeader(task.workspaceId);if(sprintId){const sprint=await prisma.sprint.findFirst({where:{id:sprintId,workspaceId:task.workspaceId}});if(!sprint)throw new Error('Sprint is not in this workspace.')}await prisma.task.update({where:{id:taskId},data:{sprintId}});refresh()}
export async function createCustomField(workspaceId:string,input:{name:string;type:string;options?:string}){
 await requireLeader(workspaceId)
 const type=input.type
 if(!['TEXT','NUMBER','DATE','SELECT'].includes(type))throw new Error('Unsupported field type.')
 const options=type==='SELECT'?[...new Set((input.options??'').split(',').map(v=>v.trim()).filter(Boolean))]:[]
 if(type==='SELECT'&&(options.length<2||options.length>30||options.some(v=>v.length>80)))throw new Error('Add 2–30 short dropdown choices.')
 await prisma.customField.create({data:{workspaceId,name:title(input.name),type,options:type==='SELECT'?options:undefined}});refresh()
}
export async function setCustomFieldValue(taskId:string,fieldId:string,value:string){
 const {task}=await taskContext(taskId)
 const field=await prisma.customField.findFirst({where:{id:fieldId,workspaceId:task.workspaceId}})
 if(!field)throw new Error('Field is not in this workspace.')
 const clean=value.trim()
 if(clean.length>500)throw new Error('Value is too long.')
 if(field.type==='NUMBER'&&clean!==''&&!Number.isFinite(Number(clean)))throw new Error('Enter a valid number.')
 if(field.type==='DATE'&&clean!==''&&!date(clean))throw new Error('Enter a valid date.')
 if(field.type==='SELECT'&&clean!==''&&!(Array.isArray(field.options)&&field.options.includes(clean)))throw new Error('Choose an allowed option.')
 if(clean)await prisma.taskFieldValue.upsert({where:{taskId_fieldId:{taskId,fieldId}},create:{taskId,fieldId,value:clean},update:{value:clean}})
 else await prisma.taskFieldValue.deleteMany({where:{taskId,fieldId}})
 refresh()
}
export async function setTaskRecurrence(taskId:string,recurrence:string|null){const {task}=await taskContext(taskId);await requireLeader(task.workspaceId);if(recurrence&&!['DAILY','WEEKLY','MONTHLY'].includes(recurrence))throw new Error('Choose a valid repeat interval.');await prisma.task.update({where:{id:taskId},data:{recurrence}});refresh()}
export async function saveTaskTemplate(taskId:string,name:string){const {task}=await taskContext(taskId);await requireLeader(task.workspaceId);await prisma.taskTemplate.create({data:{workspaceId:task.workspaceId,name:title(name),description:task.description,priority:task.priority,estimatedPts:task.estimatedPts}});refresh()}
export async function createFromTemplate(templateId:string){const template=await prisma.taskTemplate.findUniqueOrThrow({where:{id:templateId}});await requireMembership(template.workspaceId);const result=await prisma.$transaction(async tx=>{const workspace=await tx.workspace.update({where:{id:template.workspaceId},data:{nextTaskNumber:{increment:1}},select:{nextTaskNumber:true}});const n=workspace.nextTaskNumber-1;return tx.task.create({data:{workspaceId:template.workspaceId,code:`TSK-${String(n).padStart(2,'0')}`,title:template.name,description:template.description,priority:template.priority,estimatedPts:template.estimatedPts,status:'QUEUED'}})});refresh();return result.code}

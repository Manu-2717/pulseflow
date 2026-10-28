import type { PrismaClient } from '@prisma/client'
export async function authorizeProject(db:PrismaClient,workspaceId:string,projectId:string|null,userId:string,manage=false){
 const membership=await db.membership.findUnique({where:{workspaceId_userId:{workspaceId,userId}}})
 if(!membership)throw new Error('Workspace access denied.')
 const project=projectId?await db.project.findFirst({where:{id:projectId,workspaceId}}):null
 if(projectId&&!project)throw new Error('Project access denied.')
 if(membership.role==='LEADER')return {membership,projectRole:'OWNER'}
 if(!project)throw new Error('Project access denied.')
 const member=await db.projectMembership.findUnique({where:{projectId_userId:{projectId:project.id,userId}}})
 if(!member||(manage&&member.role!=='ADMIN'))throw new Error('Project access denied.')
 return {membership,projectRole:member.role}
}
export function authorizeRoleChange(owner:boolean,existingRole:string|undefined,newRole:string|null){
 if(newRole!==null&&newRole!=='ADMIN'&&newRole!=='MEMBER')throw new Error('Invalid project role.')
 if(!owner&&(newRole==='ADMIN'||existingRole==='ADMIN'))throw new Error('Only the workspace owner manages project admins.')
}

export async function assertTaskProjectMove(db:Pick<PrismaClient,'taskDependency'>,taskId:string,projectId:string|null){
 const edges=await db.taskDependency.findMany({where:{OR:[{taskId},{dependsOnId:taskId}]},select:{taskId:true,task:{select:{projectId:true}},dependsOn:{select:{projectId:true}}}})
 if(edges.some(edge=>(edge.taskId===taskId?edge.dependsOn.projectId:edge.task.projectId)!==projectId))throw new Error('Remove task dependencies before moving this task to another project.')
}

export async function insertProjectDependency(tx:Pick<PrismaClient,'task'|'taskDependency'>,taskId:string,dependsOnId:string,authorizedProjectId?:string|null){
 if(taskId===dependsOnId)throw new Error('A task cannot depend on itself.')
 const [task,source]=await Promise.all([tx.task.findUniqueOrThrow({where:{id:taskId}}),tx.task.findUniqueOrThrow({where:{id:dependsOnId}})])
 if(authorizedProjectId!==undefined&&task.projectId!==authorizedProjectId)throw new Error('The project changed. Refresh and try again.')
 if(task.workspaceId!==source.workspaceId||task.projectId!==source.projectId)throw new Error('Dependencies must belong to the same project.')
 const reverse=await tx.taskDependency.findUnique({where:{taskId_dependsOnId:{taskId:dependsOnId,dependsOnId:taskId}}})
 if(reverse)throw new Error('This creates a circular dependency.')
 await tx.taskDependency.upsert({where:{taskId_dependsOnId:{taskId,dependsOnId}},create:{taskId,dependsOnId},update:{}})
}

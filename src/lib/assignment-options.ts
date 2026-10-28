export function projectAssignees<T extends {id:string}>(users:T[],projects:{id:string;memberIds:string[]}[],projectId:string|null){
 if(!projectId)return users
 const memberIds=new Set(projects.find(p=>p.id===projectId)?.memberIds??[])
 return users.filter(user=>memberIds.has(user.id))
}

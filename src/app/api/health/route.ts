import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export async function GET(){const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex'};try{await prisma.$queryRaw`SELECT 1`;return Response.json({status:'ok'},{headers})}catch{return Response.json({status:'unhealthy'},{status:503,headers:{...headers,'Retry-After':'60'}})}}

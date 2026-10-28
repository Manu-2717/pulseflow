import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/access'
import { prisma } from '@/lib/prisma'

export const metadata = {title:'Search | PulseFlow',robots:{index:false,follow:false}}

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){const {q}=await searchParams;const query=typeof q==='string'?q.trim().slice(0,160):'';const user=await currentUser();if(!user)redirect(`/login?next=${encodeURIComponent('/search?q='+encodeURIComponent(query))}`);const membership=await prisma.membership.findFirst({where:{userId:user.id},include:{workspace:true},orderBy:{joinedAt:'asc'}});redirect(membership?`/w/${membership.workspace.slug}?q=${encodeURIComponent(query)}`:'/onboarding')}

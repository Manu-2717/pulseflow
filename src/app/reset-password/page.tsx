import { notFound } from 'next/navigation'
import { PasswordRecovery } from '@/components/password-recovery'
import { emailEnabled } from '@/lib/email'
export const dynamic = 'force-dynamic'
export default async function ResetPassword({searchParams}:{searchParams:Promise<{token?:string}>}){if(!emailEnabled)notFound();const {token}=await searchParams;if(!token)notFound();return <PasswordRecovery token={token}/>}

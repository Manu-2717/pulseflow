export const metadata = { title: 'Reset your password', robots: { index: false, follow: false } }
import { notFound } from 'next/navigation'
import { PasswordRecovery } from '@/components/password-recovery'
import { emailEnabled } from '@/lib/email'
export const dynamic = 'force-dynamic'
export default function ForgotPassword(){if(!emailEnabled)notFound();return <PasswordRecovery/>}

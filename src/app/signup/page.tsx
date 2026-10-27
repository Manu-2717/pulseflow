export const metadata = { title: 'Create your PulseFlow account', robots: { index: false, follow: false } }
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/access'
import { safeNextPath } from '@/lib/redirect-path'
import { AuthForm } from '@/components/auth-form'
import { emailEnabled, passwordEnabled } from '@/lib/email'
export default async function Signup({searchParams}:{searchParams:Promise<{next?:string}>}){const params=await searchParams;const next=safeNextPath(params.next);if(await currentUser())redirect(next);return <AuthForm mode="signup" googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)} githubEnabled={Boolean(process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET)} appleEnabled={Boolean(process.env.APPLE_CLIENT_ID&&process.env.APPLE_TEAM_ID&&process.env.APPLE_KEY_ID&&process.env.APPLE_PRIVATE_KEY)} emailEnabled={emailEnabled} passwordEnabled={passwordEnabled} nextPath={next}/>}

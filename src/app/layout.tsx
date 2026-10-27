import type { Metadata } from 'next'
import './globals.css'
const origin = process.env.SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
export const metadata:Metadata={
  metadataBase:new URL(origin),
  title:'PulseFlow — Team command center',
  description:'Live team capacity, smart dispatch, and focused blocker resolution.',
  alternates:{canonical:'/'},
  openGraph:{title:'PulseFlow — Team command center',description:'See who has room, send work with context, and resolve blockers together.',type:'website',url:'/'},
  twitter:{card:'summary',title:'PulseFlow — Team command center',description:'A little more flow, a little less friction.'},
}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

import type { Metadata } from 'next'
import './globals.css'
import './workspace.css'
import './club-theme.css'
import { RuntimeMonitor } from '@/components/runtime-monitor'
const origin = process.env.SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
export const metadata:Metadata={
  metadataBase:new URL(origin),
  verification:{google:'DPatEe9fNhRRmhpv1TgtMu2jfzDqIwBRJMUDdWZOSQ0',other:process.env.BING_SITE_VERIFICATION?{'msvalidate.01':process.env.BING_SITE_VERIFICATION}:undefined},
  title:'PulseFlow — Team command center',
  description:'Live team capacity, smart dispatch, and focused blocker resolution.',
  alternates:{canonical:'/'},
  openGraph:{title:'PulseFlow — Team command center',description:'See who has room, send work with context, and resolve blockers together.',type:'website',url:'/'},
  twitter:{card:'summary_large_image',title:'PulseFlow — Team command center',description:'A little more flow, a little less friction.'},
}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><RuntimeMonitor/>{children}</body></html>}

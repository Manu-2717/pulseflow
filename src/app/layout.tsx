import type { Metadata } from 'next'
import './globals.css'
export const metadata:Metadata={title:'PulseFlow — Team command center',description:'Live team capacity, smart dispatch, and focused blocker resolution.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

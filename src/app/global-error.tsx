'use client'

import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
import './globals.css'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main className="status-page"><header className="status-header"><Link href="/" className="status-logo"><span>⌁</span> pulseflow</Link><span>TEAM OS / 001</span></header><section className="status-panel" role="alert"><div className="status-kicker">THE FLOW HIT A PAUSE</div><div className="status-code status-code-error" aria-hidden="true">Oops<span>✳</span></div><h1>Something went<br/><em>off course.</em></h1><p>We couldn&apos;t load PulseFlow right now. Please try again in a moment.</p><div className="status-actions"><button className="status-primary" onClick={()=>reset()}><RotateCcw size={17}/> Try again</button><Link href="/" className="status-secondary">Return home</Link></div></section></main></body></html>
}

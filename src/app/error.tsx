'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { reportClientError } from '@/lib/client-error'
import { ArrowUpRight, RotateCcw, TriangleAlert } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(()=>reportClientError('boundary',error.digest),[error.digest])
  return <main className="status-page">
    <header className="status-header"><Link href="/" className="status-logo"><span>⌁</span> pulseflow</Link><span>TEAM OS / 001</span></header>
    <section className="status-panel" aria-labelledby="error-title" role="alert">
      <div className="status-kicker"><TriangleAlert size={17}/> SOMETHING INTERRUPTED THE FLOW</div>
      <div className="status-code status-code-error" aria-hidden="true">Oops<span>✳</span></div>
      <h1 id="error-title">A small pause.<br/><em>We&apos;ll get moving.</em></h1>
      <p>Something went wrong while loading this page. Try again; if it keeps happening, return to your workspace and refresh.</p>
      <div className="status-actions"><button onClick={()=>reset()} className="status-primary"><RotateCcw size={17}/> Try again</button><Link href="/" className="status-secondary">Go to PulseFlow <ArrowUpRight size={17}/></Link></div>
    </section>
    <footer className="status-footer">Your work is still here. <span>✳</span></footer>
  </main>
}

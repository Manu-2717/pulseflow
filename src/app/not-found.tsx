import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Compass } from 'lucide-react'

export default function NotFound() {
  return <main className="status-page">
    <header className="status-header"><Link href="/" className="status-logo"><span>⌁</span> pulseflow</Link><span>TEAM OS / 001</span></header>
    <section className="status-panel" aria-labelledby="not-found-title">
      <div className="status-kicker"><Compass size={17}/> LOST YOUR PLACE? / 404</div>
      <div className="status-code" aria-hidden="true">404<span>✳</span></div>
      <h1 id="not-found-title">This page took<br/><em>a different route.</em></h1>
      <p>We couldn&apos;t find the page you were looking for. The link may have changed, or this workspace may no longer be available to you.</p>
      <form action="/search" method="get" className="status-search"><label htmlFor="status-query">Looking for a task? Sign in and search your workspace.</label><input id="status-query" name="q" type="search" placeholder="Search PulseFlow"/><button type="submit">Search</button></form>
      <div className="status-actions"><Link href="/" className="status-primary">Back to PulseFlow <ArrowUpRight size={18}/></Link><Link href="/login" className="status-secondary"><ArrowLeft size={17}/> Sign in</Link><Link href="/about" className="status-secondary">About</Link></div>
    </section>
    <footer className="status-footer">A little more flow, a little less friction. <span>✳</span></footer>
  </main>
}

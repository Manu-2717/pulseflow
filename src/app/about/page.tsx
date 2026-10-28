import Link from 'next/link'

export const metadata = { title: 'About PulseFlow', description: 'Why PulseFlow helps teams keep work moving.', alternates: { canonical: '/about' } }

export default function AboutPage() { return <main className="legal-page"><Link href="/" className="legal-back">← PulseFlow</Link><h1>About PulseFlow</h1><p>PulseFlow gives teams one place to see capacity, plan work, and resolve blockers in context. It is built for the daily handoffs that help good work move forward.</p><h2>What we believe</h2><p>Clear ownership, focused discussion, and a realistic view of workload make collaboration easier.</p><p>Questions or feedback? Reach us through the <a href="https://github.com/Manu-2717/pulseflow/issues" target="_blank" rel="noopener noreferrer">project issue tracker</a>.</p><Link href="/signup">Start a workspace →</Link></main> }

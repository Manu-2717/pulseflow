import Link from 'next/link'

export const metadata = { title: 'Contact PulseFlow', description: 'How to reach the PulseFlow team.', alternates: { canonical: '/contact' } }

export default function ContactPage() { return <main className="legal-page"><Link href="/" className="legal-back">← PulseFlow</Link><h1>Contact</h1><p>For product questions and feedback, open an issue in our <a href="https://github.com/Manu-2717/pulseflow/issues" target="_blank" rel="noopener noreferrer">public issue tracker</a>. For security reports, use our <a href="https://github.com/Manu-2717/pulseflow/security/advisories/new" target="_blank" rel="noopener noreferrer">private vulnerability reporting page</a>.</p><p>We do not ask you to include passwords, access tokens, or private workspace content in public issues.</p></main> }

import Link from 'next/link'

export const metadata = { title: 'Cookie Policy | PulseFlow', description: 'How PulseFlow uses cookies.', alternates: { canonical: '/cookies' } }

export default function CookiePage() { return <main className="legal-page"><Link href="/" className="legal-back">← PulseFlow</Link><h1>Cookie policy</h1><p>PulseFlow uses essential session cookies to keep you signed in and protect your account. The app does not currently set advertising or analytics cookies.</p><h2>Your choices</h2><p>You can sign out to end your session. You can also clear site cookies in your browser; this will sign you out.</p><p>See our <Link href="/privacy">privacy policy</Link> for more details about account and workspace data.</p></main> }

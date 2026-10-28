import Link from 'next/link'

export const metadata = { title: 'Accessibility | PulseFlow', description: 'PulseFlow accessibility statement.', alternates: { canonical: '/accessibility' } }

export default function AccessibilityPage() { return <main className="legal-page"><Link href="/" className="legal-back">← PulseFlow</Link><h1>Accessibility</h1><p>We aim to make PulseFlow usable with a keyboard, screen reader, and a range of screen sizes. The interface uses visible labels and focus states and respects reduced-motion preferences.</p><p>If you encounter an accessibility barrier, please <a href="https://github.com/Manu-2717/pulseflow/issues" target="_blank" rel="noopener noreferrer">report it</a> with the page, browser, and the action you were trying to complete.</p></main> }

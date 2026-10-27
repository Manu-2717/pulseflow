import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PulseFlow — Team command center',
    short_name: 'PulseFlow',
    description: 'Team capacity, smart dispatch, and focused blocker resolution.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f7ed',
    theme_color: '#f5f0df',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}

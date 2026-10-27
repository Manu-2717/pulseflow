import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const origin = (process.env.SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/w/', '/invite/', '/api/', '/login', '/signup', '/onboarding', '/forgot-password', '/reset-password'] },
    sitemap: `${origin}/sitemap.xml`,
  }
}

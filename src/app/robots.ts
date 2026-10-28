import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const origin = (process.env.SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/w/', '/invite/', '/api/', '/login', '/signup', '/onboarding', '/forgot-password', '/reset-password', '/401', '/403', '/500', '/503', '/search', '/admin/', '/staging/'] },
    sitemap: `${origin}/sitemap.xml`,
  }
}

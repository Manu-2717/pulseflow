import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = (process.env.SITE_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  return [{ url: origin, changeFrequency: 'monthly', priority: 1 },...['about','contact','privacy','terms','cookies','accessibility'].map(path=>({url:`${origin}/${path}`,changeFrequency:'yearly' as const,priority:0.2}))]
}

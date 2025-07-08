import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cvkonnekt.co.za'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/cv-templates',
          '/cover-letter-templates',
          '/cv-examples',
          '/cover-letter-examples',
          '/create',
          '/create-cover-letter',
          '/jobs',
          '/faq',
          '/blog',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/analytics/',
          '/auth/',
          '/login',
          '/signup',
          '/*?*',
          '/search?*',
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

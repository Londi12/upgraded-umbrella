import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Metadata } from "next"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// SEO Metadata utilities
export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  twitterCard?: 'summary' | 'summary_large_image'
  noIndex?: boolean
  structuredData?: object
}

export function generateMetadata(config: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cvkonnekt.co.za'
  const siteName = 'CVKonnekt'

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords?.join(', '),
    canonical: config.canonical ? `${baseUrl}${config.canonical}` : undefined,
    robots: config.noIndex ? 'noindex,nofollow' : 'index,follow',
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.canonical ? `${baseUrl}${config.canonical}` : baseUrl,
      siteName,
      images: config.ogImage ? [
        {
          url: config.ogImage.startsWith('http') ? config.ogImage : `${baseUrl}${config.ogImage}`,
          width: 1200,
          height: 630,
          alt: config.title,
        }
      ] : undefined,
      locale: 'en_ZA',
      type: config.ogType || 'website',
    },
    twitter: {
      card: config.twitterCard || 'summary_large_image',
      title: config.title,
      description: config.description,
      images: config.ogImage ? [config.ogImage.startsWith('http') ? config.ogImage : `${baseUrl}${config.ogImage}`] : undefined,
    },
    alternates: {
      canonical: config.canonical ? `${baseUrl}${config.canonical}` : baseUrl,
    },
    other: {
      'application-name': siteName,
      'apple-mobile-web-app-title': siteName,
      'msapplication-TileColor': '#10b981',
      'theme-color': '#10b981',
    }
  }
}

export function generateStructuredData(data: object): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    ...data
  })
}

// Structured Data Generators
export function generateOrganizationStructuredData() {
  return generateStructuredData({
    '@type': 'Organization',
    name: 'CVKonnekt',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cvkonnekt.co.za',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cvkonnekt.co.za'}/logo.png`,
    description: 'Professional CV builder designed for South African job seekers. Create professional CVs and cover letters with free templates.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'CVKonnekt Team'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ZA',
      addressRegion: 'South Africa'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Afrikaans']
    },
    sameAs: [
      'https://twitter.com/cvkonnekt',
      'https://linkedin.com/company/cvkonnekt'
    ]
  })
}

export function generateWebsiteStructuredData() {
  return generateStructuredData({
    '@type': 'WebSite',
    name: 'CVKonnekt',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cvkonnekt.co.za',
    description: 'Professional CV builder for South African job seekers',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cvkonnekt.co.za'}/jobs?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  })
}

export function generateJobPostingStructuredData(job: any) {
  return generateStructuredData({
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      sameAs: job.company_url
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'ZA'
      }
    },
    datePosted: job.posted_date,
    validThrough: job.expires_date,
    employmentType: job.job_type || 'FULL_TIME',
    baseSalary: job.salary ? {
      '@type': 'MonetaryAmount',
      currency: 'ZAR',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salary,
        unitText: 'YEAR'
      }
    } : undefined,
    qualifications: job.requirements,
    skills: job.keywords?.join(', '),
    workHours: job.work_hours,
    benefits: job.benefits
  })
}

export function generateProductStructuredData(template: any) {
  return generateStructuredData({
    '@type': 'Product',
    name: template.name,
    description: `Professional ${template.name} CV template designed for South African job seekers`,
    brand: {
      '@type': 'Brand',
      name: 'CVKonnekt'
    },
    category: 'CV Template',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'CVKonnekt'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1'
    }
  })
}

export function generateBreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>) {
  return generateStructuredData({
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  })
}

export function generateFAQStructuredData(faqs: Array<{question: string, answer: string}>) {
  return generateStructuredData({
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  })
}

export function generateHowToStructuredData(title: string, steps: Array<{name: string, text: string}>) {
  return generateStructuredData({
    '@type': 'HowTo',
    name: title,
    description: `Step-by-step guide: ${title}`,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text
    }))
  })
}

// Common SEO configurations
export const seoConfigs = {
  home: {
    title: 'CVKonnekt - Professional CV Builder for South Africans',
    description: 'Create professional CVs and cover letters designed for the South African job market. Free CV builder with templates, ATS optimization, and job search integration.',
    keywords: ['CV builder', 'resume builder', 'South Africa', 'job search', 'career', 'professional CV', 'ATS optimization', 'cover letter'],
    canonical: '/',
    ogImage: '/og-image-home.png',
  },
  cvTemplates: {
    title: 'Professional CV Templates - Free Download | CVKonnekt',
    description: 'Browse our collection of professional CV templates designed for South African job seekers. Modern, ATS-friendly templates that get results.',
    keywords: ['CV templates', 'resume templates', 'professional CV', 'South Africa', 'ATS friendly', 'modern CV'],
    canonical: '/cv-templates',
    ogImage: '/og-image-templates.png',
  },
  coverLetterTemplates: {
    title: 'Cover Letter Templates - Professional Examples | CVKonnekt',
    description: 'Professional cover letter templates and examples for South African job applications. Customizable templates that complement your CV.',
    keywords: ['cover letter templates', 'cover letter examples', 'job application', 'South Africa', 'professional cover letter'],
    canonical: '/cover-letter-templates',
    ogImage: '/og-image-cover-letters.png',
  },
  jobs: {
    title: 'Job Search - Find Your Next Opportunity | CVKonnekt',
    description: 'Search for jobs in South Africa with CV matching and application tracking. Get personalized job recommendations based on your CV.',
    keywords: ['job search', 'South Africa jobs', 'career opportunities', 'job matching', 'application tracking'],
    canonical: '/jobs',
    ogImage: '/og-image-jobs.png',
  },
  create: {
    title: 'Create Your Professional CV - Free CV Builder | CVKonnekt',
    description: 'Build your professional CV with our free online CV builder. Choose from templates, get ATS feedback, and download instantly.',
    keywords: ['create CV', 'CV builder', 'online CV maker', 'professional CV', 'free CV builder'],
    canonical: '/create',
    ogImage: '/og-image-create.png',
  },
  createCoverLetter: {
    title: 'Create Cover Letter - Free Cover Letter Builder | CVKonnekt',
    description: 'Create professional cover letters with our free online builder. Match your CV style and customize for any job application.',
    keywords: ['create cover letter', 'cover letter builder', 'online cover letter maker', 'professional cover letter'],
    canonical: '/create-cover-letter',
    ogImage: '/og-image-cover-letter.png',
  },
  faq: {
    title: 'Frequently Asked Questions - CV Builder Help | CVKonnekt',
    description: 'Get answers to common questions about creating CVs, using templates, and optimizing for ATS systems in South Africa.',
    keywords: ['CV help', 'FAQ', 'CV builder questions', 'ATS optimization', 'South Africa CV tips'],
    canonical: '/faq',
    ogImage: '/og-image-faq.png',
  },
  cvExamples: {
    title: 'CV Examples - Professional CV Samples | CVKonnekt',
    description: 'View professional CV examples and samples for different industries in South Africa. Get inspiration for your own CV.',
    keywords: ['CV examples', 'CV samples', 'professional CV', 'South Africa', 'CV inspiration'],
    canonical: '/cv-examples',
    ogImage: '/og-image-examples.png',
  },
  coverLetterExamples: {
    title: 'Cover Letter Examples - Professional Samples | CVKonnekt',
    description: 'Browse professional cover letter examples for different industries and job types in South Africa.',
    keywords: ['cover letter examples', 'cover letter samples', 'professional cover letter', 'South Africa'],
    canonical: '/cover-letter-examples',
    ogImage: '/og-image-cover-examples.png',
  },
  analytics: {
    title: 'CV Analytics Dashboard | CVKonnekt',
    description: 'Track your CV performance, application success rates, and get insights to improve your job search strategy.',
    keywords: ['CV analytics', 'application tracking', 'job search analytics', 'CV performance'],
    canonical: '/analytics',
    ogImage: '/og-image-analytics.png',
  },
  blog: {
    title: 'Career Advice Blog | CVKonnekt',
    description: 'Expert career advice, job search tips, and CV writing guidance for South African professionals.',
    keywords: ['career advice', 'job search tips', 'CV writing', 'South Africa careers', 'professional development'],
    canonical: '/blog',
    ogImage: '/og-image-blog.png',
  },
}

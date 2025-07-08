import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react"
import Link from "next/link"
import { Metadata } from 'next'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StructuredData } from "@/components/structured-data"
import { generateBreadcrumbStructuredData, generateStructuredData } from "@/lib/utils"

// Blog post data (in a real app, this would come from a CMS or database)
const blogPosts = {
  "how-to-write-cv-south-africa": {
    title: "How to Write a CV for South African Employers",
    excerpt: "Learn the essential elements of a South African CV, including format preferences, required sections, and local hiring practices.",
    author: "CVKonnekt Team",
    publishedDate: "2024-01-15",
    modifiedDate: "2024-01-15",
    readTime: "8 min read",
    category: "CV Writing",
    tags: ["CV Tips", "South Africa", "Job Search"],
    content: `
# How to Write a CV for South African Employers

Creating a CV that resonates with South African employers requires understanding local hiring practices and preferences. This comprehensive guide will help you craft a CV that stands out in the competitive South African job market.

## Understanding the South African CV Format

South African CVs typically follow a specific format that differs from international standards. Here are the key elements:

### 1. Personal Information
- Full name
- Contact details (phone, email, address)
- Date of birth (optional but commonly included)
- ID number (for South African citizens)
- Nationality/citizenship status

### 2. Professional Summary
A brief 2-3 sentence summary highlighting your key qualifications and career objectives.

### 3. Work Experience
List your work experience in reverse chronological order, including:
- Job title
- Company name
- Employment dates
- Key responsibilities and achievements

### 4. Education
Include your educational qualifications, starting with the highest level achieved.

### 5. Skills
Both technical and soft skills relevant to the position.

### 6. Additional Sections
- Languages spoken
- Professional memberships
- Volunteer work
- References (usually "Available on request")

## Key Tips for South African CVs

### Keep It Concise
South African employers prefer CVs that are 2-3 pages maximum. Be concise and focus on relevant information.

### Use Local Terminology
Use South African business terminology and spelling conventions (e.g., "organisation" instead of "organization").

### Include Relevant Certifications
Professional certifications and industry-specific qualifications are highly valued in South Africa.

### Highlight Local Experience
If you have experience working in South Africa or with South African companies, make sure to highlight this.

## Common Mistakes to Avoid

1. **Including a photo** - Unless specifically requested, don't include a photo
2. **Salary expectations** - Don't include salary information unless requested
3. **Personal details** - Avoid including marital status, religion, or political affiliations
4. **Outdated information** - Keep your CV current and remove outdated skills or experiences

## Conclusion

A well-crafted CV is your first opportunity to make a positive impression on South African employers. By following these guidelines and tailoring your CV to local preferences, you'll significantly improve your chances of landing interviews and securing job offers.

Remember to customize your CV for each application, highlighting the most relevant experience and skills for the specific role you're applying for.
    `
  },
  "ats-optimization-tips": {
    title: "ATS Optimization: Making Your CV Scanner-Friendly",
    excerpt: "Discover how to optimize your CV for Applicant Tracking Systems (ATS) used by South African companies.",
    author: "CVKonnekt Team",
    publishedDate: "2024-01-10",
    modifiedDate: "2024-01-10",
    readTime: "6 min read",
    category: "ATS Optimization",
    tags: ["ATS", "CV Optimization", "Technology"],
    content: `
# ATS Optimization: Making Your CV Scanner-Friendly

Applicant Tracking Systems (ATS) are widely used by South African companies to filter and rank CVs before they reach human recruiters. Understanding how to optimize your CV for these systems is crucial for job search success.

## What is an ATS?

An ATS is software that automatically scans, parses, and ranks CVs based on specific criteria set by employers. These systems help companies manage large volumes of applications efficiently.

## Key ATS Optimization Strategies

### 1. Use Standard Formatting
- Stick to simple, clean layouts
- Use standard fonts (Arial, Calibri, Times New Roman)
- Avoid complex graphics, tables, or columns
- Use standard section headings

### 2. Include Relevant Keywords
- Study the job description carefully
- Include industry-specific terms and skills
- Use both acronyms and full terms (e.g., "HR" and "Human Resources")
- Naturally incorporate keywords throughout your CV

### 3. Choose the Right File Format
- PDF is generally safe for most ATS systems
- Word documents (.docx) are also widely accepted
- Avoid image files or unusual formats

### 4. Optimize Section Headings
Use standard headings that ATS systems recognize:
- "Work Experience" or "Professional Experience"
- "Education"
- "Skills"
- "Certifications"

## Testing Your CV

Before submitting your CV, test it by:
1. Copying and pasting the text into a plain text editor
2. Checking if the formatting remains readable
3. Ensuring all important information is preserved

## Conclusion

ATS optimization doesn't mean sacrificing readability for humans. The best CVs are those that successfully pass through ATS filters while remaining engaging and informative for human recruiters.
    `
  }
}

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = blogPosts[params.slug as keyof typeof blogPosts]
  
  if (!post) {
    return {
      title: 'Post Not Found | CVKonnekt Blog'
    }
  }

  return {
    title: `${post.title} | CVKonnekt Blog`,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedDate,
      modifiedTime: post.modifiedDate,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    }
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts[params.slug as keyof typeof blogPosts]

  if (!post) {
    notFound()
  }

  // Breadcrumb structured data
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${params.slug}` }
  ]

  // Article structured data
  const articleStructuredData = generateStructuredData({
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: post.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'CVKonnekt',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
      }
    },
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${params.slug}`
    },
    articleSection: post.category,
    keywords: post.tags.join(', ')
  })

  return (
    <div className="min-h-screen bg-white">
      <StructuredData data={generateBreadcrumbStructuredData(breadcrumbs)} />
      <StructuredData data={articleStructuredData} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back to Blog */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          <div className="mb-4">
            <Badge variant="secondary">{post.category}</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900">
            {post.title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {post.author}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(post.publishedDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none mb-12">
          <div className="whitespace-pre-line leading-relaxed">
            {post.content}
          </div>
        </article>

        {/* Tags */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-semibold mb-4">Ready to Apply These Tips?</h3>
            <p className="text-gray-600 mb-6">
              Create your professional CV with our free builder and put these strategies into practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  Create My CV
                </Button>
              </Link>
              <Link href="/cv-templates">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Templates
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

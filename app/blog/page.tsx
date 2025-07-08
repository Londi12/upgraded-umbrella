import { ArrowRight, Calendar, Clock, User, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StructuredData } from "@/components/structured-data"
import { generateMetadata as generateSEOMetadata, seoConfigs, generateBreadcrumbStructuredData } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.blog)

// Blog post data
const blogPosts = [
  {
    id: 1,
    title: "How to Write a CV for South African Employers",
    slug: "how-to-write-cv-south-africa",
    excerpt: "Learn the essential elements of a South African CV, including format preferences, required sections, and local hiring practices.",
    content: "A comprehensive guide to creating CVs that resonate with South African employers...",
    author: "CVKonnekt Team",
    publishedDate: "2024-01-15",
    readTime: "8 min read",
    category: "CV Writing",
    tags: ["CV Tips", "South Africa", "Job Search"],
    featured: true,
    image: "/blog/cv-writing-guide.jpg"
  },
  {
    id: 2,
    title: "ATS Optimization: Making Your CV Scanner-Friendly",
    slug: "ats-optimization-tips",
    excerpt: "Discover how to optimize your CV for Applicant Tracking Systems (ATS) used by South African companies.",
    content: "Understanding ATS systems and how to format your CV for maximum visibility...",
    author: "CVKonnekt Team",
    publishedDate: "2024-01-10",
    readTime: "6 min read",
    category: "ATS Optimization",
    tags: ["ATS", "CV Optimization", "Technology"],
    featured: true,
    image: "/blog/ats-optimization.jpg"
  },
  {
    id: 3,
    title: "Cover Letter Writing Guide for South African Job Applications",
    slug: "cover-letter-writing-guide",
    excerpt: "Master the art of writing compelling cover letters that complement your CV and grab employer attention.",
    content: "Step-by-step guide to writing effective cover letters for the South African job market...",
    author: "CVKonnekt Team",
    publishedDate: "2024-01-05",
    readTime: "7 min read",
    category: "Cover Letters",
    tags: ["Cover Letter", "Job Application", "Writing Tips"],
    featured: false,
    image: "/blog/cover-letter-guide.jpg"
  },
  {
    id: 4,
    title: "Top CV Mistakes to Avoid in 2024",
    slug: "cv-mistakes-to-avoid-2024",
    excerpt: "Common CV mistakes that could cost you job opportunities and how to avoid them.",
    content: "Learn about the most common CV mistakes and how to create a standout application...",
    author: "CVKonnekt Team",
    publishedDate: "2024-01-01",
    readTime: "5 min read",
    category: "CV Writing",
    tags: ["CV Tips", "Common Mistakes", "Best Practices"],
    featured: false,
    image: "/blog/cv-mistakes.jpg"
  },
  {
    id: 5,
    title: "Industry-Specific CV Tips for South African Professionals",
    slug: "industry-specific-cv-tips",
    excerpt: "Tailor your CV for different industries including finance, tech, healthcare, and more.",
    content: "Industry-specific advice for creating CVs that stand out in your field...",
    author: "CVKonnekt Team",
    publishedDate: "2023-12-28",
    readTime: "10 min read",
    category: "Industry Advice",
    tags: ["Industry Tips", "Professional Development", "Career Advice"],
    featured: false,
    image: "/blog/industry-tips.jpg"
  },
  {
    id: 6,
    title: "Job Interview Preparation: From CV to Offer",
    slug: "job-interview-preparation-guide",
    excerpt: "Complete guide to preparing for job interviews, from CV submission to salary negotiation.",
    content: "Everything you need to know about the job interview process in South Africa...",
    author: "CVKonnekt Team",
    publishedDate: "2023-12-20",
    readTime: "12 min read",
    category: "Interview Tips",
    tags: ["Interview", "Job Search", "Career Development"],
    featured: false,
    image: "/blog/interview-prep.jpg"
  }
]

const categories = ["All", "CV Writing", "ATS Optimization", "Cover Letters", "Industry Advice", "Interview Tips"]

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured)
  const recentPosts = blogPosts.filter(post => !post.featured).slice(0, 4)

  // Breadcrumb structured data
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <StructuredData data={generateBreadcrumbStructuredData(breadcrumbs)} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">
            Career Advice Blog
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Expert tips, guides, and insights to help you succeed in your career journey
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map(post => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">{post.title}</span>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.publishedDate).toLocaleDateString()}
                      <Clock className="h-4 w-4 ml-2" />
                      {post.readTime}
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{post.category}</Badge>
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                          Read More
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recent Posts */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Recent Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.publishedDate).toLocaleDateString()}
                    <Clock className="h-4 w-4 ml-2" />
                    {post.readTime}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{post.category}</Badge>
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                        Read More
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <Link key={category} href={`/blog/category/${category.toLowerCase().replace(' ', '-')}`}>
                <Badge variant="outline" className="hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">
                  {category}
                </Badge>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Ready to Create Your Professional CV?
              </CardTitle>
              <CardDescription className="text-gray-600">
                Put our advice into practice with our free CV builder
              </CardDescription>
            </CardHeader>
            <CardContent>
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
        </section>
      </div>
    </div>
  )
}

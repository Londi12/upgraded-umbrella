import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { supabase } from "@/lib/supabase"
import { generateMetadata as generateSEOMetadata } from "@/lib/utils"

interface JobPageProps {
  params: Promise<{ id: string }>
}

interface PublicJob {
  id: string
  title: string
  snippet: string
  url: string
  source: string
  company?: string | null
  location?: string | null
  posted_date?: string | null
  description?: string | null
}

async function getJob(id: string): Promise<PublicJob | null> {
  const { data, error } = await supabase
    .from("scraped_jobs")
    .select("id,title,snippet,url,source,company,location,posted_date,description")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Failed to load shared job", error)
    return null
  }

  return data
}

function getJobDescription(job: PublicJob) {
  const summary = job.snippet?.trim() || job.description?.trim() || "View this South African job opportunity on CVKonnekt."
  return summary.length > 160 ? `${summary.slice(0, 157)}...` : summary
}

function getMetaDescription(job: PublicJob) {
  const company = job.company || job.source || "CVKonnekt"
  const location = job.location || "South Africa"
  const summary = getJobDescription(job)
  const prefix = `${job.title} at ${company} in ${location}.`
  const combined = `${prefix} ${summary}`
  return combined.length > 200 ? `${combined.slice(0, 197)}...` : combined
}

function formatPostedDate(value?: string | null) {
  if (!value) return "Recent"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recent"
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date)
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    return generateSEOMetadata({
      title: "Job Not Found | CVKonnekt",
      description: "This job is no longer available.",
      canonical: `/jobs/${id}`,
      ogImage: "/og-image-jobs.png",
      noIndex: true,
    })
  }

  const company = job.company || job.source || "CVKonnekt"
  const location = job.location || "South Africa"

  return generateSEOMetadata({
    title: `${job.title} at ${company} | CVKonnekt`,
    description: getMetaDescription(job),
    canonical: `/jobs/${job.id}`,
    ogImage: `/jobs/${job.id}/opengraph-image`,
    ogType: "article",
    twitterCard: "summary_large_image",
    keywords: [job.title, company, location, "South Africa jobs", "job vacancy"],
  })
}

export default async function JobPublicPage({ params }: JobPageProps) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  const company = job.company || job.source || "CVKonnekt"

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-900 px-6 py-8 text-white sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Shared job</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{job.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-200">
              <span className="rounded-full bg-white/10 px-3 py-1">{company}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{job.location || "South Africa"}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Posted {formatPostedDate(job.posted_date)}</span>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8">
            <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-6">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <Button className="bg-blue-600 hover:bg-blue-700">Apply on {job.source}</Button>
              </a>
              <Link href="/jobs">
                <Button variant="outline">Browse more jobs</Button>
              </Link>
            </div>

            <section className="pt-6">
              <h2 className="text-lg font-semibold text-slate-900">Job description</h2>
              <MarkdownRenderer
                content={job.description || job.snippet || "No description available."}
                className="mt-4 text-sm text-slate-700 leading-relaxed"
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
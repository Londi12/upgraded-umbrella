import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { supabase } from "@/lib/supabase"
import { generateMetadata as generateSEOMetadata } from "@/lib/utils"

interface JobPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ u?: string }>
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

async function getJobByUrl(url: string): Promise<PublicJob | null> {
  const { data, error } = await supabase
    .from("scraped_jobs")
    .select("id,title,snippet,url,source,company,location,posted_date,description")
    .eq("url", url)
    .maybeSingle()

  if (error) {
    console.error("Failed to load shared job by URL", error)
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

export async function generateMetadata({ params, searchParams }: JobPageProps): Promise<Metadata> {
  const { id } = await params
  const { u } = await searchParams
  let job = await getJob(id)

  if (!job && u) {
    job = await getJobByUrl(u)
  }

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

export default async function JobPublicPage({ params, searchParams }: JobPageProps) {
  const { id } = await params
  const { u } = await searchParams
  let job = await getJob(id)

  if (!job && u) {
    job = await getJobByUrl(u)
  }

  if (!job) {
    notFound()
  }

  const company = job.company || job.source || "CVKonnekt"
  const location = job.location || "South Africa"

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Shared job</p>
            <h1 className="mt-2 font-semibold text-slate-900 text-xl leading-snug">{job.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{company}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{location}</span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Posted {formatPostedDate(job.posted_date)}</span>
            </div>
          </div>

          <div className="p-5 border-b">
            <MarkdownRenderer
              content={job.description || job.snippet || "No description available."}
              className="text-sm text-slate-700 leading-relaxed"
            />
          </div>

          <div className="px-5 py-3 bg-white">
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Apply on {job.source}</Button>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
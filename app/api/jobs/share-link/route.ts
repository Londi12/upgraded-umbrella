import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { buildJobSharePath } from "@/lib/job-share-url"

type ShareableJob = {
  id: string | number
  title: string
  snippet: string
  url: string
  source: string
  company?: string | null
  location?: string | null
  posted_date?: string | null
  description?: string | null
}

async function snapshotJob(job: {
  id: string | number
  title: string
  snippet: string
  url: string
  source: string
  company?: string | null
  location?: string | null
  posted_date?: string | null
  description?: string | null
}) {
  // Fire-and-forget upsert into shared_jobs so this link survives future purges.
  // Errors are non-fatal — the share link still works if the job is in scraped_jobs.
  await supabase.from("shared_jobs").upsert(
    {
      id: String(job.id),
      title: job.title,
      snippet: job.snippet ?? "",
      url: job.url,
      source: job.source,
      company: job.company ?? null,
      location: job.location ?? null,
      posted_date: job.posted_date ?? null,
      description: job.description ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )
}

async function findJobByIdOrUrl(table: "scraped_jobs" | "shared_jobs", id?: string, url?: string): Promise<ShareableJob | null> {
  if (id) {
    const { data, error } = await supabase
      .from(table)
      .select("id,title,snippet,url,source,company,location,posted_date,description")
      .eq("id", id)
      .maybeSingle()
    if (!error && data) return data
  }

  if (url) {
    // Some sources store canonical URLs differently (e.g. encoded vs decoded).
    // Try both forms so share-link resolution is more tolerant.
    const urlCandidates = Array.from(new Set([
      url,
      (() => {
        try {
          return decodeURIComponent(url)
        } catch {
          return url
        }
      })(),
    ]))

    for (const candidate of urlCandidates) {
      const { data, error } = await supabase
        .from(table)
        .select("id,title,snippet,url,source,company,location,posted_date,description")
        .eq("url", candidate)
        .maybeSingle()
      if (!error && data) return data
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")?.trim()
  const url = searchParams.get("url")?.trim()

  if (!id && !url) {
    return NextResponse.json({ error: "Missing id or url" }, { status: 400 })
  }

  try {
    let job = await findJobByIdOrUrl("scraped_jobs", id, url)

    // If already purged from scraped_jobs, check existing snapshots.
    if (!job) {
      job = await findJobByIdOrUrl("shared_jobs", id, url)
    }

    if (!job) {
      // If we can't resolve to an internal record, keep users on CVKonnekt
      // by sending them to a fallback shared-job page that includes the
      // original source URL in ?u=.
      if (url) {
        const fallbackId = id || "shared"
        const urlParam = encodeURIComponent(url)
        return NextResponse.json({ path: `/jobs/${fallbackId}?u=${urlParam}`, fallback: true })
      }

      return NextResponse.json(
        { error: "Job not found in scraped_jobs or shared_jobs" },
        { status: 404 }
      )
    }

    // Snapshot so the link keeps working after the job is purged
    await snapshotJob(job)

    return NextResponse.json({ path: buildJobSharePath(job) })
  } catch {
    return NextResponse.json({ error: "Failed to resolve share link" }, { status: 500 })
  }
}

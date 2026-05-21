import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")?.trim()
  const url = searchParams.get("url")?.trim()

  if (!id && !url) {
    return NextResponse.json({ error: "Missing id or url" }, { status: 400 })
  }

  try {
    let job: {
      id: string | number
      title: string
      snippet: string
      url: string
      source: string
      company?: string | null
      location?: string | null
      posted_date?: string | null
      description?: string | null
    } | null = null

    if (id) {
      const { data, error } = await supabase
        .from("scraped_jobs")
        .select("id,title,snippet,url,source,company,location,posted_date,description")
        .eq("id", id)
        .maybeSingle()
      if (!error && data) job = data
    }

    if (!job && url) {
      const { data, error } = await supabase
        .from("scraped_jobs")
        .select("id,title,snippet,url,source,company,location,posted_date,description")
        .eq("url", url)
        .maybeSingle()
      if (!error && data) job = data
    }

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Snapshot so the link keeps working after the job is purged
    await snapshotJob(job)

    const urlParam = encodeURIComponent(job.url)
    return NextResponse.json({ path: `/jobs/${job.id}?u=${urlParam}` })
  } catch {
    return NextResponse.json({ error: "Failed to resolve share link" }, { status: 500 })
  }
}

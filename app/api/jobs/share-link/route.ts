import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")?.trim()
  const title = searchParams.get("title")?.trim()

  if (!url && !title) {
    return NextResponse.json({ error: "Missing lookup params" }, { status: 400 })
  }

  try {
    if (url) {
      const byUrl = await supabase
        .from("scraped_jobs")
        .select("id")
        .eq("url", url)
        .maybeSingle()

      if (!byUrl.error && byUrl.data?.id) {
        const urlParam = encodeURIComponent(url)
        return NextResponse.json({ path: `/jobs/${byUrl.data.id}?u=${urlParam}` })
      }
    }

    if (title) {
      const byTitle = await supabase
        .from("scraped_jobs")
        .select("id")
        .ilike("title", title)
        .order("posted_date", { ascending: false })
        .limit(1)

      const id = byTitle.data?.[0]?.id
      if (!byTitle.error && id) {
        const urlSuffix = url ? `?u=${encodeURIComponent(url)}` : ""
        return NextResponse.json({ path: `/jobs/${id}${urlSuffix}` })
      }
    }

    return NextResponse.json({ error: "No internal job page found" }, { status: 404 })
  } catch {
    return NextResponse.json({ error: "Failed to resolve share link" }, { status: 500 })
  }
}

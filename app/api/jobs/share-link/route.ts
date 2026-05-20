import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")?.trim()

  if (!url) {
    return NextResponse.json({ error: "Missing job URL" }, { status: 400 })
  }

  try {
    const byUrl = await supabase
      .from("scraped_jobs")
      .select("id")
      .eq("url", url)
      .maybeSingle()

    if (!byUrl.error && byUrl.data?.id) {
      const urlParam = encodeURIComponent(url)
      return NextResponse.json({ path: `/jobs/${byUrl.data.id}?u=${urlParam}` })
    }

    return NextResponse.json({ error: "No exact internal job page found for this URL" }, { status: 404 })
  } catch {
    return NextResponse.json({ error: "Failed to resolve share link" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { parseJobIdFromRouteParam } from "@/lib/job-share-url"

interface RouteParams {
  params: Promise<{ jobId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { jobId: rawJobId } = await params
  const jobId = parseJobIdFromRouteParam(rawJobId)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const target = `${baseUrl}/jobs/${encodeURIComponent(jobId)}/opengraph-image`
  return NextResponse.redirect(target, { status: 307 })
}

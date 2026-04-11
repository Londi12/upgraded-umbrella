import { NextRequest, NextResponse } from 'next/server'
import { JobScraperService } from '@/lib/job-scraper-service'

// Vercel Edge configuration is optional but can be set if needed
// export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 })
  }
  
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const linkedinKey = process.env.LINKEDIN_RAPIDAPI_KEY
  if (!linkedinKey) {
    return NextResponse.json({ error: 'LinkedIn RapidAPI key missing' }, { status: 500 })
  }

  const scraper = new JobScraperService()
  
  // Unlike the JSearch scrape, we don't necessarily want to purge the whole table 
  // on every hourly run to avoid race conditions. Purge logic is managed by the daily JSearch scrape.
  // We just scrape LinkedIn and insert.
  const { inserted, errors } = await scraper.scrapeLinkedInSites()

  return NextResponse.json({
    success: true,
    inserted,
    errors,
    timestamp: new Date().toISOString(),
  })
}

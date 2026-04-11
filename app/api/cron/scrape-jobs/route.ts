import { NextRequest, NextResponse } from 'next/server'
import { JobScraperService } from '@/lib/job-scraper-service'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scraper = new JobScraperService()
  await scraper.purgeOldJobs()

  const jsearchKey = !!process.env.JSEARCH_API_KEY
  const { inserted, errors } = await scraper.scrapeAllSites()

  return NextResponse.json({
    success: true,
    inserted,
    errors,
    env: { jsearch_key_set: jsearchKey },
    timestamp: new Date().toISOString(),
  })
}

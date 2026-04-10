import { NextRequest, NextResponse } from 'next/server'
import { JobScraperService } from '@/lib/job-scraper-service'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scraper = new JobScraperService()
  await scraper.purgeOldJobs()
  const { inserted, errors } = await scraper.scrapeAllSites()

  return NextResponse.json({
    success: true,
    inserted,
    errors,
    timestamp: new Date().toISOString(),
  })
}

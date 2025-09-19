import { NextRequest, NextResponse } from 'next/server'
import { RealJobScraper } from '@/lib/real-job-scraper'

interface JobResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  fetched_at: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const location = searchParams.get('location')

  if (!query) {
    return NextResponse.json({ results: [], error: "Missing query parameter" })
  }

  try {
    const scraper = new RealJobScraper()
    
    // Check if we need to scrape (if database is empty or old)
    const jobCount = await scraper.getJobCount()
    if (jobCount < 10) {
      // Trigger scraping in background
      scraper.scrapeAllSites().catch(console.error)
    }
    
    // Get jobs from database
    const scrapedJobs = await scraper.searchJobs(query, location || undefined)
    
    // Convert to API format
    const results: JobResult[] = scrapedJobs.map(job => ({
      title: `[External from ${job.source}]: ${job.title}`,
      snippet: job.snippet,
      url: job.url,
      source: job.source,
      fetched_at: job.posted_date
    }))

    return NextResponse.json({ results, error: null })

  } catch (error) {
    console.error('SA job search error:', error)
    return NextResponse.json(
      { results: [], error: "Server error" },
      { status: 500 }
    )
  }
}
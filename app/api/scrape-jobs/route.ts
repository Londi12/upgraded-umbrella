import { NextRequest, NextResponse } from 'next/server'
import { JobScraperService } from '@/lib/job-scraper-service'

export async function POST(request: NextRequest) {
  try {
    const scraper = new JobScraperService()
    
    // Check if scraping is needed
    if (!scraper.shouldScrape()) {
      return NextResponse.json({ message: 'Scraping not needed yet' })
    }

    // Run scraping in background
    scraper.scrapeAllSites().catch(error => {
      console.error('Background scraping failed:', error)
    })

    return NextResponse.json({ 
      message: 'Scraping started',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Scrape API error:', error)
    return NextResponse.json(
      { error: 'Failed to start scraping' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const scraper = new JobScraperService()
    const lastScrape = await scraper.getLastScrapeTime()
    
    return NextResponse.json({
      last_scrape: lastScrape,
      next_scrape: lastScrape ? new Date(lastScrape.getTime() + 5 * 60 * 60 * 1000) : null,
      status: 'ready'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get scrape status' },
      { status: 500 }
    )
  }
}
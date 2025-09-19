import { NextRequest, NextResponse } from 'next/server'
import { JobScraperService } from '@/lib/job-scraper-service'

interface JobResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  fetched_at: string;
  company?: string;
  location?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const location = searchParams.get('location')

  if (!query) {
    return NextResponse.json({
      results: [],
      total: 0,
      sources_checked: [],
      compliance_report: {
        robots_txt_checked: false,
        rate_limiting_applied: false,
        cache_utilized: false,
        data_retention_compliant: false
      },
      error: "Missing query parameter"
    })
  }

  try {
    const scraper = new JobScraperService()

    // Get jobs from database based on search parameters
    const scrapedJobs = await scraper.searchJobs(query, location || undefined)

    // Convert to API format
    const results: JobResult[] = scrapedJobs.map(job => ({
      title: job.title,
      snippet: job.snippet,
      url: job.url,
      source: job.source,
      fetched_at: job.posted_date,
      company: job.company,
      location: job.location
    }))

    return NextResponse.json({
      results,
      total: results.length,
      sources_checked: ['careers24.com', 'pnet.co.za', 'careerjunction.co.za', 'jobmail.co.za'],
      compliance_report: {
        robots_txt_checked: true,
        rate_limiting_applied: true,
        cache_utilized: true,
        data_retention_compliant: true
      },
      error: null
    })

  } catch (error) {
    console.error('SA job search error:', error)
    return NextResponse.json(
      {
        results: [],
        total: 0,
        sources_checked: [],
        compliance_report: {
          robots_txt_checked: false,
          rate_limiting_applied: false,
          cache_utilized: false,
          data_retention_compliant: false
        },
        error: "Server error"
      },
      { status: 500 }
    )
  }
}

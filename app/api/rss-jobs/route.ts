import { NextResponse } from 'next/server'
import { SimpleJobAggregator } from '@/lib/simple-job-aggregator'

// Initialize the simple aggregator
const jobAggregator = new SimpleJobAggregator()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keywords = searchParams.get('keywords') || ''
    const location = searchParams.get('location') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log(`🔍 Searching jobs: "${keywords}" in "${location}"`)

    // Fetch jobs from all sources
    const result = await jobAggregator.getJobs(keywords, location)

    // Limit results
    const limitedJobs = result.jobs.slice(0, limit)

    console.log(`✅ Found ${result.total} jobs from ${result.sources.length} sources`)

    return NextResponse.json({
      success: true,
      jobs: limitedJobs,
      total: limitedJobs.length,
      totalFound: result.total,
      sources: result.sources,
      sourceStats: jobAggregator.getSourceStats()
    })

  } catch (error) {
    console.error('❌ Job search failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, feedKey } = body

    if (action === 'refresh') {
      // Force refresh a specific feed or all feeds
      if (feedKey) {
        // Refresh specific feed (implementation would clear cache for that feed)
        console.log(`Refreshing feed: ${feedKey}`)
      } else {
        // Refresh all feeds (clear all cache)
        console.log('Refreshing all RSS feeds')
      }
      
      const jobs = await rssAggregator.fetchAllJobs()
      
      return NextResponse.json({
        success: true,
        message: 'Feeds refreshed successfully',
        jobCount: jobs.length,
        sources: rssAggregator.getFeedStats()
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in RSS jobs POST:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

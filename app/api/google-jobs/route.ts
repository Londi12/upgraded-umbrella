import { NextRequest, NextResponse } from 'next/server'
import { GoogleJobSearch } from '@/lib/google-job-search'

/**
 * GET /api/google-jobs
 * Search for jobs using Google Custom Search API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keywords = searchParams.get('keywords') || ''
    const location = searchParams.get('location') || 'South Africa'
    const limit = parseInt(searchParams.get('limit') || '20')

    const googleSearch = new GoogleJobSearch()
    
    if (!googleSearch.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Google Search API not configured',
        hint: 'Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables'
      }, { status: 400 })
    }

    console.log(`🔍 Google Search: "${keywords}" in "${location}"`)
    
    const jobs = await googleSearch.searchJobs(keywords, location, limit)
    
    console.log(`✅ Google Search returned ${jobs.length} jobs`)
    
    return NextResponse.json({
      success: true,
      jobs,
      total: jobs.length,
      source: 'Google Custom Search',
      stats: googleSearch.getStats()
    })

  } catch (error) {
    console.error('❌ Google Search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search jobs via Google',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/google-jobs
 * Search for jobs with advanced parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords = '', location = 'South Africa', limit = 20, filters = {} } = body

    const googleSearch = new GoogleJobSearch()
    
    if (!googleSearch.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Google Search API not configured',
        hint: 'Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables'
      }, { status: 400 })
    }

    console.log(`🔍 Google Search POST: "${keywords}" in "${location}"`)
    
    const jobs = await googleSearch.searchJobs(keywords, location, limit)
    
    // Apply additional filters if provided
    let filteredJobs = jobs
    
    if (filters.industry) {
      filteredJobs = filteredJobs.filter(job => 
        job.industry?.toLowerCase().includes(filters.industry.toLowerCase())
      )
    }
    
    if (filters.jobType) {
      filteredJobs = filteredJobs.filter(job => 
        job.jobType === filters.jobType
      )
    }
    
    if (filters.experienceLevel) {
      filteredJobs = filteredJobs.filter(job => 
        job.experienceLevel === filters.experienceLevel
      )
    }
    
    console.log(`✅ Google Search returned ${filteredJobs.length} jobs (${jobs.length} total, ${jobs.length - filteredJobs.length} filtered)`)
    
    return NextResponse.json({
      success: true,
      jobs: filteredJobs,
      total: filteredJobs.length,
      source: 'Google Custom Search',
      filters: filters,
      stats: googleSearch.getStats()
    })

  } catch (error) {
    console.error('❌ Google Search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search jobs via Google',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


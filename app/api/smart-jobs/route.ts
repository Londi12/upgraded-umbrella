import { NextRequest, NextResponse } from 'next/server'
import { SmartJobAggregator } from '@/lib/smart-job-aggregator'

/**
 * GET /api/smart-jobs
 * Get jobs using intelligent source prioritization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keywords = searchParams.get('keywords') || ''
    const location = searchParams.get('location') || 'South Africa'
    const limit = parseInt(searchParams.get('limit') || '50')

    const aggregator = new SmartJobAggregator()
    
    console.log(`🚀 Smart Job Search: "${keywords}" in "${location}"`)
    
    const result = await aggregator.getJobs(keywords, location, limit)
    
    console.log(`✅ Smart aggregation complete: ${result.total} jobs from ${result.sources.length} sources`)
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Smart job aggregation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to aggregate jobs',
      details: error instanceof Error ? error.message : 'Unknown error',
      jobs: [],
      total: 0,
      sources: [],
      aggregationTime: 0,
      fallbackUsed: false,
      recommendations: ['Check API configurations and network connectivity']
    }, { status: 500 })
  }
}

/**
 * POST /api/smart-jobs
 * Get jobs with advanced parameters and filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      keywords = '', 
      location = 'South Africa', 
      limit = 50,
      filters = {},
      preferences = {}
    } = body

    const aggregator = new SmartJobAggregator()
    
    console.log(`🚀 Smart Job Search POST: "${keywords}" in "${location}"`)
    
    const result = await aggregator.getJobs(keywords, location, limit)
    
    // Apply additional client-side filters if provided
    let filteredJobs = result.jobs
    
    if (filters.industry) {
      filteredJobs = filteredJobs.filter(job => 
        job.description.toLowerCase().includes(filters.industry.toLowerCase()) ||
        job.company.toLowerCase().includes(filters.industry.toLowerCase())
      )
    }
    
    if (filters.jobType) {
      filteredJobs = filteredJobs.filter(job => 
        job.type === filters.jobType
      )
    }
    
    if (filters.experienceLevel) {
      const level = filters.experienceLevel.toLowerCase()
      filteredJobs = filteredJobs.filter(job => 
        job.description.toLowerCase().includes(level) ||
        job.title.toLowerCase().includes(level)
      )
    }
    
    if (filters.salaryMin) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.salary) return false
        const salaryMatch = job.salary.match(/\d+/g)
        if (salaryMatch) {
          const minSalary = Math.min(...salaryMatch.map(Number))
          return minSalary >= filters.salaryMin
        }
        return false
      })
    }
    
    if (filters.postedWithinDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - filters.postedWithinDays)
      
      filteredJobs = filteredJobs.filter(job => {
        const postedDate = new Date(job.postedDate)
        return postedDate >= cutoffDate
      })
    }
    
    console.log(`✅ Smart aggregation complete: ${filteredJobs.length} jobs (${result.total} total, ${result.total - filteredJobs.length} filtered)`)
    
    return NextResponse.json({
      success: true,
      jobs: filteredJobs,
      total: filteredJobs.length,
      sources: result.sources,
      aggregationTime: result.aggregationTime,
      fallbackUsed: result.fallbackUsed,
      recommendations: result.recommendations,
      filters: filters,
      preferences: preferences,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Smart job aggregation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to aggregate jobs',
      details: error instanceof Error ? error.message : 'Unknown error',
      jobs: [],
      total: 0,
      sources: [],
      aggregationTime: 0,
      fallbackUsed: false,
      recommendations: ['Check API configurations and network connectivity']
    }, { status: 500 })
  }
}





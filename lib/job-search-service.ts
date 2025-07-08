import { supabase } from "./supabase"
import { EthicalJobAggregator } from "./crawler/ethical-job-aggregator"

// Job search interfaces
export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  salary_range?: string
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience_level: 'entry' | 'mid' | 'senior' | 'executive'
  industry: string
  posted_date: string
  application_url: string
  source: string // job board name
  keywords: string[]
}

export interface JobSearchFilters {
  keywords?: string
  location?: string
  industry?: string
  experience_level?: string
  job_type?: string
  salary_min?: number
  salary_max?: number
  posted_within_days?: number
}

export interface JobMatchScore {
  job_id: string
  match_percentage: number
  matching_keywords: string[]
  missing_keywords: string[]
  recommendations: string[]
}

// South African job boards configuration
const SA_JOB_BOARDS = {
  'careers24': {
    name: 'Careers24',
    base_url: 'https://www.careers24.com',
    search_endpoint: '/jobs/search',
    has_api: false, // Most SA job boards don't have public APIs
    scraping_allowed: true
  },
  'pnet': {
    name: 'PNet',
    base_url: 'https://www.pnet.co.za',
    search_endpoint: '/jobs',
    has_api: false,
    scraping_allowed: true
  },
  'jobmail': {
    name: 'JobMail',
    base_url: 'https://www.jobmail.co.za',
    search_endpoint: '/jobs',
    has_api: false,
    scraping_allowed: true
  },
  'careerjet': {
    name: 'CareerJet',
    base_url: 'https://www.careerjet.co.za',
    search_endpoint: '/search/jobs',
    has_api: true, // CareerJet has a partner API
    api_key_required: true
  },
  'indeed': {
    name: 'Indeed South Africa',
    base_url: 'https://za.indeed.com',
    search_endpoint: '/jobs',
    has_api: true, // Indeed has a publisher API
    api_key_required: true
  }
}

// Global ethical aggregator instance
let ethicalAggregator: EthicalJobAggregator | null = null

// Initialize ethical aggregator
const getEthicalAggregator = (): EthicalJobAggregator => {
  if (!ethicalAggregator) {
    ethicalAggregator = new EthicalJobAggregator({
      enableEthicalCrawling: true,
      respectRobotsTxt: true,
      maxConcurrentRequests: 3,
      defaultTimeout: 15000,
      complianceMode: true,
      dataRetentionDays: 30,
      contactInfo: 'crawler@cvkonnekt.co.za'
    })
  }
  return ethicalAggregator
}

// Job search function now uses the ethical aggregator with persistent storage
// This replaces the old searchJobs function with the enhanced storage-backed approach
export const searchJobs = async (filters: JobSearchFilters): Promise<JobListing[]> => {
  try {
    // Use ethical aggregator with persistent storage for job aggregation
    const aggregator = getEthicalAggregator()
    const result = await aggregator.getJobs(
      filters.keywords || '',
      filters.location || ''
    )

    let jobs = result.jobs

    // Apply additional filters (most filtering is now done at the database level)
    if (filters.industry && filters.industry !== 'all') {
      jobs = jobs.filter(job => job.industry === filters.industry)
    }

    if (filters.experience_level && filters.experience_level !== 'all') {
      jobs = jobs.filter(job => job.experience_level === filters.experience_level)
    }

    if (filters.job_type && filters.job_type !== 'all') {
      jobs = jobs.filter(job => job.job_type === filters.job_type)
    }

    if (filters.posted_within_days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - filters.posted_within_days)
      jobs = jobs.filter(job => new Date(job.posted_date) >= cutoffDate)
    }

    // Log compliance and storage information
    console.log('Job search compliance report:', result.complianceReport)
    console.log('Storage statistics:', result.storageStats)
    console.log(`Found ${jobs.length} jobs from ${result.sources.length} sources (${result.storageStats.totalJobs} total in storage)`)

    return jobs.slice(0, 50) // Limit to 50 results

  } catch (error) {
    console.error('Error with persistent job search:', error)
    // Return empty array on error - the system should be robust enough to handle this
    return []
  }
}

// Calculate job match score based on CV data
export const calculateJobMatch = (cvData: any, job: JobListing): JobMatchScore => {
  // Extract keywords from CV
  const cvText = [
    cvData.personalInfo?.jobTitle || '',
    cvData.summary || '',
    ...(cvData.experience?.map((exp: any) => `${exp.title} ${exp.description}`) || []),
    typeof cvData.skills === 'string' ? cvData.skills : cvData.skills?.map((s: any) => s.name).join(' ') || ''
  ].join(' ').toLowerCase()

  const cvKeywords = new Set(
    cvText.split(/\W+/).filter(word => word.length > 2)
  )

  // Calculate matches
  const matchingKeywords: string[] = []
  const missingKeywords: string[] = []

  job.keywords.forEach(keyword => {
    if (cvKeywords.has(keyword.toLowerCase())) {
      matchingKeywords.push(keyword)
    } else {
      missingKeywords.push(keyword)
    }
  })

  // Calculate match percentage
  const matchPercentage = job.keywords.length > 0 
    ? Math.round((matchingKeywords.length / job.keywords.length) * 100)
    : 0

  // Generate recommendations
  const recommendations: string[] = []
  
  if (matchPercentage < 50) {
    recommendations.push(`Add keywords: ${missingKeywords.slice(0, 3).join(', ')}`)
  }
  
  if (matchPercentage < 30) {
    recommendations.push('Consider updating your skills section to better match this role')
  }
  
  if (job.requirements.length > 0) {
    const missingRequirements = job.requirements.filter(req => 
      !cvText.includes(req.toLowerCase())
    )
    if (missingRequirements.length > 0) {
      recommendations.push(`Highlight experience with: ${missingRequirements.slice(0, 2).join(', ')}`)
    }
  }

  return {
    job_id: job.id,
    match_percentage: matchPercentage,
    matching_keywords: matchingKeywords,
    missing_keywords: missingKeywords,
    recommendations
  }
}

// Get job recommendations based on user's CV
export const getJobRecommendations = async (cvData: any, limit: number = 10): Promise<JobListing[]> => {
  // Extract user's industry and skills for better matching
  const userSkills = typeof cvData.skills === 'string' 
    ? cvData.skills.toLowerCase()
    : cvData.skills?.map((s: any) => s.name.toLowerCase()).join(' ') || ''

  // Determine likely industry from job title and experience
  const jobTitle = cvData.personalInfo?.jobTitle?.toLowerCase() || ''
  const experience = cvData.experience?.map((exp: any) => exp.title.toLowerCase()).join(' ') || ''
  
  let likelyIndustry = 'general'
  if (jobTitle.includes('developer') || jobTitle.includes('programmer') || userSkills.includes('programming')) {
    likelyIndustry = 'technology'
  } else if (jobTitle.includes('marketing') || experience.includes('marketing')) {
    likelyIndustry = 'marketing'
  } else if (jobTitle.includes('finance') || jobTitle.includes('accounting')) {
    likelyIndustry = 'finance'
  }

  // Search for jobs in the user's industry
  const jobs = await searchJobs({ 
    industry: likelyIndustry,
    keywords: jobTitle.split(' ')[0] // Use first word of job title
  })

  // Calculate match scores and sort by relevance
  const jobsWithScores = jobs.map(job => ({
    ...job,
    matchScore: calculateJobMatch(cvData, job)
  }))

  return jobsWithScores
    .sort((a, b) => b.matchScore.match_percentage - a.matchScore.match_percentage)
    .slice(0, limit)
}

// Track job search activity
export const trackJobSearch = async (searchQuery: string, jobBoard: string, resultsCount: number) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("job_search_analytics")
    .insert({
      user_id: user.id,
      search_query: searchQuery,
      job_board: jobBoard,
      results_count: resultsCount,
      search_date: new Date().toISOString()
    })
}

// Get popular job searches for insights
export const getPopularSearches = async (): Promise<{ query: string, count: number }[]> => {
  const { data } = await supabase
    .from("job_search_analytics")
    .select("search_query")
    .gte("search_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

  if (!data) return []

  // Count search frequency
  const searchCounts: Record<string, number> = {}
  data.forEach(item => {
    const query = item.search_query.toLowerCase()
    searchCounts[query] = (searchCounts[query] || 0) + 1
  })

  return Object.entries(searchCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

// Get crawler statistics and compliance information
export const getCrawlerStats = () => {
  if (!ethicalAggregator) {
    return {
      error: 'Ethical aggregator not initialized',
      initialized: false
    }
  }

  return {
    ...ethicalAggregator.getStats(),
    initialized: true
  }
}

// Get compliance report for audit purposes
export const getComplianceReport = () => {
  const stats = getCrawlerStats()

  if (!stats.initialized) {
    return { error: 'Crawler not initialized' }
  }

  return {
    timestamp: new Date().toISOString(),
    complianceInfo: stats.complianceInfo,
    sources: stats.sources,
    crawlerStats: stats.crawlerStats,
    lastCrawlStats: Array.from(stats.lastCrawlStats.entries()).map(([source, data]) => ({
      source,
      ...data
    })),
    recommendations: [
      'Continue using RSS feeds as primary source',
      'Monitor rate limiting effectiveness',
      'Regular robots.txt compliance checks',
      'Maintain data retention policies'
    ]
  }
}

// Cleanup crawler resources (call on app shutdown)
export const cleanupCrawler = () => {
  if (ethicalAggregator) {
    ethicalAggregator.destroy()
    ethicalAggregator = null
  }
}

// Integration helper for external job board APIs
export const integrateJobBoard = async (boardName: string, apiKey?: string) => {
  const board = SA_JOB_BOARDS[boardName as keyof typeof SA_JOB_BOARDS]

  if (!board) {
    throw new Error(`Unsupported job board: ${boardName}`)
  }

  if (board.api_key_required && !apiKey) {
    throw new Error(`API key required for ${board.name}`)
  }

  // Implementation would vary by job board
  // For CareerJet: Use their affiliate API
  // For Indeed: Use their publisher API
  // For others: Implement ethical web scraping with the ethical crawler

  return {
    name: board.name,
    integrated: board.has_api && apiKey ? true : false,
    scraping_available: board.scraping_allowed,
    ethical_crawler_ready: ethicalAggregator !== null
  }
}

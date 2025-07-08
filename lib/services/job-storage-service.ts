/**
 * Persistent Job Storage Service
 * Handles storing, retrieving, and managing crawled job data with intelligent deduplication
 */

import { supabase } from '@/lib/supabase'
import { JobListing } from '@/lib/job-search-service'

export interface StoredJobListing extends JobListing {
  id: string
  external_id: string
  first_crawled_at: string
  last_crawled_at: string
  last_updated_at: string
  crawl_count: number
  is_active: boolean
  content_hash: string
}

export interface JobStorageStats {
  totalJobs: number
  activeJobs: number
  inactiveJobs: number
  jobsBySource: Record<string, number>
  recentlyAdded: number
  recentlyUpdated: number
  trackedJobs: number
}

export interface CrawlSession {
  id: string
  session_start: string
  session_end?: string
  sources_crawled: string[]
  total_jobs_found: number
  new_jobs_added: number
  jobs_updated: number
  errors_encountered: number
  robots_txt_checked: boolean
  rate_limiting_applied: boolean
  compliance_mode: boolean
}

export class JobStorageService {
  /**
   * Store or update a job listing
   */
  async storeJob(job: JobListing, sessionId?: string): Promise<StoredJobListing> {
    try {
      // Generate external ID if not provided
      const externalId = job.id || `${job.source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Check if job already exists
      const { data: existingJob } = await supabase
        .from('job_listings')
        .select('*')
        .eq('external_id', externalId)
        .eq('source', job.source)
        .single()

      if (existingJob) {
        // Update existing job
        const { data: updatedJob, error } = await supabase
          .from('job_listings')
          .update({
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            requirements: job.requirements,
            salary_range: job.salary_range,
            job_type: job.job_type,
            experience_level: job.experience_level,
            industry: job.industry,
            posted_date: job.posted_date,
            expires_date: job.expires_date,
            application_url: job.application_url,
            keywords: job.keywords,
            last_crawled_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
            crawl_count: existingJob.crawl_count + 1,
            is_active: true
          })
          .eq('id', existingJob.id)
          .select()
          .single()

        if (error) throw error
        return updatedJob as StoredJobListing
      } else {
        // Insert new job
        const { data: newJob, error } = await supabase
          .from('job_listings')
          .insert({
            external_id: externalId,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            requirements: job.requirements,
            salary_range: job.salary_range,
            job_type: job.job_type,
            experience_level: job.experience_level,
            industry: job.industry,
            posted_date: job.posted_date,
            expires_date: job.expires_date,
            application_url: job.application_url,
            source: job.source,
            keywords: job.keywords
          })
          .select()
          .single()

        if (error) throw error
        return newJob as StoredJobListing
      }
    } catch (error) {
      console.error('Error storing job:', error)
      throw error
    }
  }

  /**
   * Store multiple jobs in batch
   */
  async storeJobsBatch(jobs: JobListing[], sessionId?: string): Promise<{
    stored: number
    updated: number
    errors: number
    newJobs: StoredJobListing[]
  }> {
    let stored = 0
    let updated = 0
    let errors = 0
    const newJobs: StoredJobListing[] = []

    for (const job of jobs) {
      try {
        const storedJob = await this.storeJob(job, sessionId)
        if (storedJob.crawl_count === 1) {
          stored++
          newJobs.push(storedJob)
        } else {
          updated++
        }
      } catch (error) {
        console.error(`Error storing job ${job.title}:`, error)
        errors++
      }
    }

    return { stored, updated, errors, newJobs }
  }

  /**
   * Search stored jobs with filters
   */
  async searchJobs(filters: {
    keywords?: string
    location?: string
    industry?: string
    experience_level?: string
    job_type?: string
    source?: string
    posted_within_days?: number
    limit?: number
    offset?: number
    only_active?: boolean
  }): Promise<{ jobs: StoredJobListing[]; total: number }> {
    try {
      let query = supabase
        .from('job_listings')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.only_active !== false) {
        query = query.eq('is_active', true)
      }

      if (filters.keywords) {
        query = query.or(`title.ilike.%${filters.keywords}%,description.ilike.%${filters.keywords}%,company.ilike.%${filters.keywords}%`)
      }

      if (filters.location && filters.location !== 'South Africa') {
        query = query.ilike('location', `%${filters.location}%`)
      }

      if (filters.industry && filters.industry !== 'all') {
        query = query.eq('industry', filters.industry)
      }

      if (filters.experience_level && filters.experience_level !== 'all') {
        query = query.eq('experience_level', filters.experience_level)
      }

      if (filters.job_type && filters.job_type !== 'all') {
        query = query.eq('job_type', filters.job_type)
      }

      if (filters.source) {
        query = query.eq('source', filters.source)
      }

      if (filters.posted_within_days) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - filters.posted_within_days)
        query = query.gte('posted_date', cutoffDate.toISOString().split('T')[0])
      }

      // Pagination
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
      } else {
        query = query.limit(filters.limit || 50)
      }

      // Order by posted date (newest first)
      query = query.order('posted_date', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        jobs: (data || []) as StoredJobListing[],
        total: count || 0
      }
    } catch (error) {
      console.error('Error searching jobs:', error)
      throw error
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(id: string): Promise<StoredJobListing | null> {
    try {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as StoredJobListing | null
    } catch (error) {
      console.error('Error getting job by ID:', error)
      throw error
    }
  }

  /**
   * Check if jobs need to be crawled for a source
   */
  async shouldCrawlSource(sourceName: string): Promise<{
    shouldCrawl: boolean
    lastCrawl?: string
    hoursUntilNext?: number
  }> {
    try {
      const { data: source } = await supabase
        .from('job_sources')
        .select('*')
        .eq('name', sourceName)
        .eq('is_active', true)
        .single()

      if (!source) {
        return { shouldCrawl: false }
      }

      if (!source.last_successful_crawl) {
        return { shouldCrawl: true }
      }

      const lastCrawl = new Date(source.last_successful_crawl)
      const now = new Date()
      const hoursSinceLastCrawl = (now.getTime() - lastCrawl.getTime()) / (1000 * 60 * 60)
      const hoursUntilNext = Math.max(0, source.crawl_frequency_hours - hoursSinceLastCrawl)

      return {
        shouldCrawl: hoursSinceLastCrawl >= source.crawl_frequency_hours,
        lastCrawl: source.last_successful_crawl,
        hoursUntilNext: Math.round(hoursUntilNext * 100) / 100
      }
    } catch (error) {
      console.error('Error checking crawl schedule:', error)
      return { shouldCrawl: true } // Default to crawling on error
    }
  }

  /**
   * Start a new crawl session
   */
  async startCrawlSession(sources: string[]): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('crawl_sessions')
        .insert({
          sources_crawled: sources,
          robots_txt_checked: true,
          rate_limiting_applied: true,
          compliance_mode: true
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error starting crawl session:', error)
      throw error
    }
  }

  /**
   * End a crawl session with statistics
   */
  async endCrawlSession(sessionId: string, stats: {
    totalJobsFound: number
    newJobsAdded: number
    jobsUpdated: number
    errorsEncountered: number
    totalRequests: number
    cachedResponses: number
    averageResponseTime?: number
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('crawl_sessions')
        .update({
          session_end: new Date().toISOString(),
          total_jobs_found: stats.totalJobsFound,
          new_jobs_added: stats.newJobsAdded,
          jobs_updated: stats.jobsUpdated,
          errors_encountered: stats.errorsEncountered,
          total_requests: stats.totalRequests,
          cached_responses: stats.cachedResponses,
          average_response_time_ms: stats.averageResponseTime
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('Error ending crawl session:', error)
    }
  }

  /**
   * Update job source statistics
   */
  async updateSourceStats(sourceName: string, jobsFound: number, successful: boolean): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_job_source_stats', {
        source_name: sourceName,
        jobs_found: jobsFound,
        crawl_successful: successful
      })

      if (error) throw error
    } catch (error) {
      console.error('Error updating source stats:', error)
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<JobStorageStats> {
    try {
      // Get total counts
      const { count: totalJobs } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })

      const { count: activeJobs } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { count: inactiveJobs } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)

      // Get jobs by source
      const { data: sourceData } = await supabase
        .from('job_listings')
        .select('source')
        .eq('is_active', true)

      const jobsBySource: Record<string, number> = {}
      sourceData?.forEach(job => {
        jobsBySource[job.source] = (jobsBySource[job.source] || 0) + 1
      })

      // Get recently added (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { count: recentlyAdded } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .gte('first_crawled_at', yesterday.toISOString())

      const { count: recentlyUpdated } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .gte('last_updated_at', yesterday.toISOString())
        .lt('first_crawled_at', yesterday.toISOString())

      // Get tracked jobs count
      const { count: trackedJobs } = await supabase
        .from('job_applications')
        .select('job_listing_id', { count: 'exact', head: true })

      return {
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        inactiveJobs: inactiveJobs || 0,
        jobsBySource,
        recentlyAdded: recentlyAdded || 0,
        recentlyUpdated: recentlyUpdated || 0,
        trackedJobs: trackedJobs || 0
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      throw error
    }
  }

  /**
   * Run data cleanup based on retention policies
   */
  async runDataCleanup(): Promise<{
    jobsMarkedInactive: number
    searchAnalyticsDeleted: number
    oldSessionsDeleted: number
  }> {
    try {
      // Mark old jobs as inactive (preserving tracked ones)
      const { data: inactiveResult } = await supabase.rpc('mark_old_jobs_inactive')
      
      // Clean up old search analytics
      const { data: analyticsResult } = await supabase.rpc('cleanup_old_search_analytics')
      
      // Clean up old crawl sessions (older than 90 days)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      
      const { count: sessionsDeleted } = await supabase
        .from('crawl_sessions')
        .delete({ count: 'exact' })
        .lt('session_start', ninetyDaysAgo.toISOString())

      return {
        jobsMarkedInactive: inactiveResult || 0,
        searchAnalyticsDeleted: analyticsResult || 0,
        oldSessionsDeleted: sessionsDeleted || 0
      }
    } catch (error) {
      console.error('Error running data cleanup:', error)
      throw error
    }
  }

  /**
   * Get jobs that users are tracking (to preserve during cleanup)
   */
  async getTrackedJobs(userId?: string): Promise<StoredJobListing[]> {
    try {
      let query = supabase
        .from('job_applications')
        .select(`
          job_listing_id,
          job_listings (*)
        `)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || [])
        .map(app => app.job_listings)
        .filter(job => job !== null) as StoredJobListing[]
    } catch (error) {
      console.error('Error getting tracked jobs:', error)
      throw error
    }
  }
}

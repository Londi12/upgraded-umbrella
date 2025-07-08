/**
 * Intelligent Data Retention Service
 * Manages data lifecycle with smart preservation of user-tracked jobs
 */

import { supabase } from '@/lib/supabase'
import { JobStorageService } from './job-storage-service'

export interface RetentionPolicy {
  id: string
  policy_name: string
  description: string
  default_retention_days: number
  preserve_tracked_jobs: boolean
  preserve_applied_jobs: boolean
  preserve_recent_searches_days: number
  cleanup_frequency_hours: number
  last_cleanup_run?: string
  next_cleanup_due?: string
  is_active: boolean
}

export interface RetentionReport {
  timestamp: string
  policy_applied: string
  jobs_processed: number
  jobs_preserved: number
  jobs_marked_inactive: number
  jobs_permanently_deleted: number
  search_analytics_deleted: number
  crawl_sessions_deleted: number
  storage_freed_mb: number
  preservation_reasons: {
    user_tracked: number
    user_applied: number
    recently_posted: number
    high_engagement: number
  }
}

export interface DataRetentionStats {
  total_jobs: number
  active_jobs: number
  inactive_jobs: number
  tracked_jobs: number
  applied_jobs: number
  jobs_due_for_cleanup: number
  storage_usage_mb: number
  last_cleanup: string | null
  next_cleanup: string | null
}

export class DataRetentionService {
  private jobStorage: JobStorageService

  constructor() {
    this.jobStorage = new JobStorageService()
  }

  /**
   * Get active retention policy
   */
  async getActivePolicy(): Promise<RetentionPolicy | null> {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as RetentionPolicy | null
    } catch (error) {
      console.error('Error getting retention policy:', error)
      return null
    }
  }

  /**
   * Run intelligent data cleanup
   */
  async runIntelligentCleanup(): Promise<RetentionReport> {
    const startTime = Date.now()
    const policy = await this.getActivePolicy()
    
    if (!policy) {
      throw new Error('No active retention policy found')
    }

    const report: RetentionReport = {
      timestamp: new Date().toISOString(),
      policy_applied: policy.policy_name,
      jobs_processed: 0,
      jobs_preserved: 0,
      jobs_marked_inactive: 0,
      jobs_permanently_deleted: 0,
      search_analytics_deleted: 0,
      crawl_sessions_deleted: 0,
      storage_freed_mb: 0,
      preservation_reasons: {
        user_tracked: 0,
        user_applied: 0,
        recently_posted: 0,
        high_engagement: 0
      }
    }

    try {
      // Step 1: Identify jobs eligible for cleanup
      const eligibleJobs = await this.getJobsEligibleForCleanup(policy)
      report.jobs_processed = eligibleJobs.length

      // Step 2: Categorize jobs for preservation
      const preservationAnalysis = await this.analyzeJobsForPreservation(eligibleJobs, policy)
      
      // Step 3: Apply retention rules
      const cleanupResults = await this.applyRetentionRules(preservationAnalysis, policy)
      
      // Step 4: Clean up related data
      const relatedCleanup = await this.cleanupRelatedData(policy)

      // Compile final report
      report.jobs_preserved = preservationAnalysis.preserve.length
      report.jobs_marked_inactive = cleanupResults.markedInactive
      report.jobs_permanently_deleted = cleanupResults.permanentlyDeleted
      report.search_analytics_deleted = relatedCleanup.searchAnalyticsDeleted
      report.crawl_sessions_deleted = relatedCleanup.crawlSessionsDeleted
      
      // Calculate preservation reasons
      report.preservation_reasons = await this.calculatePreservationReasons(preservationAnalysis.preserve)

      // Update policy last run time
      await this.updatePolicyLastRun(policy.id)

      // Estimate storage freed (rough calculation)
      report.storage_freed_mb = Math.round(
        (cleanupResults.permanentlyDeleted * 0.05) + // ~50KB per job
        (relatedCleanup.searchAnalyticsDeleted * 0.001) + // ~1KB per search
        (relatedCleanup.crawlSessionsDeleted * 0.01) // ~10KB per session
      )

      console.log('Data retention cleanup completed:', report)
      return report

    } catch (error) {
      console.error('Error during intelligent cleanup:', error)
      throw error
    }
  }

  /**
   * Get jobs eligible for cleanup based on policy
   */
  private async getJobsEligibleForCleanup(policy: RetentionPolicy): Promise<any[]> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - policy.default_retention_days)

      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          job_applications!inner(id, user_id, status, application_date)
        `)
        .eq('is_active', true)
        .lt('last_crawled_at', cutoffDate.toISOString())

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting jobs eligible for cleanup:', error)
      return []
    }
  }

  /**
   * Analyze jobs to determine which should be preserved
   */
  private async analyzeJobsForPreservation(jobs: any[], policy: RetentionPolicy): Promise<{
    preserve: any[]
    cleanup: any[]
  }> {
    const preserve: any[] = []
    const cleanup: any[] = []

    for (const job of jobs) {
      let shouldPreserve = false
      const reasons: string[] = []

      // Check if job has applications (always preserve if policy says so)
      if (policy.preserve_applied_jobs && job.job_applications?.length > 0) {
        shouldPreserve = true
        reasons.push('has_applications')
      }

      // Check if job is being tracked by users
      if (policy.preserve_tracked_jobs) {
        const { data: trackingData } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_listing_id', job.id)
          .limit(1)

        if (trackingData && trackingData.length > 0) {
          shouldPreserve = true
          reasons.push('user_tracked')
        }
      }

      // Check if job was posted recently (within last 7 days)
      const postedDate = new Date(job.posted_date)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      if (postedDate > sevenDaysAgo) {
        shouldPreserve = true
        reasons.push('recently_posted')
      }

      // Check for high engagement (multiple crawls indicate active job)
      if (job.crawl_count > 5) {
        shouldPreserve = true
        reasons.push('high_engagement')
      }

      // Check if job is from a premium source
      const premiumSources = ['Adzuna SA', 'LinkedIn Jobs']
      if (premiumSources.includes(job.source)) {
        shouldPreserve = true
        reasons.push('premium_source')
      }

      if (shouldPreserve) {
        preserve.push({ ...job, preservation_reasons: reasons })
      } else {
        cleanup.push(job)
      }
    }

    return { preserve, cleanup }
  }

  /**
   * Apply retention rules to jobs
   */
  private async applyRetentionRules(analysis: { preserve: any[]; cleanup: any[] }, policy: RetentionPolicy): Promise<{
    markedInactive: number
    permanentlyDeleted: number
  }> {
    let markedInactive = 0
    let permanentlyDeleted = 0

    try {
      // Mark cleanup jobs as inactive (soft delete)
      if (analysis.cleanup.length > 0) {
        const jobIds = analysis.cleanup.map(job => job.id)
        
        const { count } = await supabase
          .from('job_listings')
          .update({ 
            is_active: false, 
            last_updated_at: new Date().toISOString() 
          })
          .in('id', jobIds)
          .select('id', { count: 'exact', head: true })

        markedInactive = count || 0
      }

      // Permanently delete very old inactive jobs (older than 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { count: deletedCount } = await supabase
        .from('job_listings')
        .delete({ count: 'exact' })
        .eq('is_active', false)
        .lt('last_updated_at', sixMonthsAgo.toISOString())
        .not('id', 'in', `(SELECT DISTINCT job_listing_id FROM job_applications WHERE job_listing_id IS NOT NULL)`)

      permanentlyDeleted = deletedCount || 0

    } catch (error) {
      console.error('Error applying retention rules:', error)
    }

    return { markedInactive, permanentlyDeleted }
  }

  /**
   * Clean up related data (search analytics, crawl sessions)
   */
  private async cleanupRelatedData(policy: RetentionPolicy): Promise<{
    searchAnalyticsDeleted: number
    crawlSessionsDeleted: number
  }> {
    let searchAnalyticsDeleted = 0
    let crawlSessionsDeleted = 0

    try {
      // Clean up old search analytics
      const searchCutoff = new Date()
      searchCutoff.setDate(searchCutoff.getDate() - policy.preserve_recent_searches_days)

      const { count: searchCount } = await supabase
        .from('job_search_analytics')
        .delete({ count: 'exact' })
        .lt('search_date', searchCutoff.toISOString())

      searchAnalyticsDeleted = searchCount || 0

      // Clean up old crawl sessions (keep last 90 days)
      const sessionCutoff = new Date()
      sessionCutoff.setDate(sessionCutoff.getDate() - 90)

      const { count: sessionCount } = await supabase
        .from('crawl_sessions')
        .delete({ count: 'exact' })
        .lt('session_start', sessionCutoff.toISOString())

      crawlSessionsDeleted = sessionCount || 0

    } catch (error) {
      console.error('Error cleaning up related data:', error)
    }

    return { searchAnalyticsDeleted, crawlSessionsDeleted }
  }

  /**
   * Calculate preservation reasons statistics
   */
  private async calculatePreservationReasons(preservedJobs: any[]): Promise<{
    user_tracked: number
    user_applied: number
    recently_posted: number
    high_engagement: number
  }> {
    const reasons = {
      user_tracked: 0,
      user_applied: 0,
      recently_posted: 0,
      high_engagement: 0
    }

    for (const job of preservedJobs) {
      if (job.preservation_reasons?.includes('user_tracked')) reasons.user_tracked++
      if (job.preservation_reasons?.includes('has_applications')) reasons.user_applied++
      if (job.preservation_reasons?.includes('recently_posted')) reasons.recently_posted++
      if (job.preservation_reasons?.includes('high_engagement')) reasons.high_engagement++
    }

    return reasons
  }

  /**
   * Update policy last run timestamp
   */
  private async updatePolicyLastRun(policyId: string): Promise<void> {
    try {
      const nextCleanup = new Date()
      nextCleanup.setHours(nextCleanup.getHours() + 24) // Next cleanup in 24 hours

      await supabase
        .from('data_retention_policies')
        .update({
          last_cleanup_run: new Date().toISOString(),
          next_cleanup_due: nextCleanup.toISOString()
        })
        .eq('id', policyId)
    } catch (error) {
      console.error('Error updating policy last run:', error)
    }
  }

  /**
   * Get data retention statistics
   */
  async getRetentionStats(): Promise<DataRetentionStats> {
    try {
      const [
        totalJobs,
        activeJobs,
        inactiveJobs,
        trackedJobs,
        appliedJobs,
        policy
      ] = await Promise.all([
        supabase.from('job_listings').select('id', { count: 'exact', head: true }),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('job_applications').select('job_listing_id', { count: 'exact', head: true }),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }),
        this.getActivePolicy()
      ])

      // Calculate jobs due for cleanup
      const cutoffDate = new Date()
      if (policy) {
        cutoffDate.setDate(cutoffDate.getDate() - policy.default_retention_days)
      }

      const { count: jobsDueForCleanup } = await supabase
        .from('job_listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('last_crawled_at', cutoffDate.toISOString())

      return {
        total_jobs: totalJobs.count || 0,
        active_jobs: activeJobs.count || 0,
        inactive_jobs: inactiveJobs.count || 0,
        tracked_jobs: trackedJobs.count || 0,
        applied_jobs: appliedJobs.count || 0,
        jobs_due_for_cleanup: jobsDueForCleanup || 0,
        storage_usage_mb: Math.round(((totalJobs.count || 0) * 0.05) * 100) / 100, // Rough estimate
        last_cleanup: policy?.last_cleanup_run || null,
        next_cleanup: policy?.next_cleanup_due || null
      }
    } catch (error) {
      console.error('Error getting retention stats:', error)
      throw error
    }
  }

  /**
   * Schedule automatic cleanup
   */
  async scheduleAutomaticCleanup(): Promise<void> {
    const policy = await this.getActivePolicy()
    if (!policy) return

    const now = new Date()
    const nextCleanup = policy.next_cleanup_due ? new Date(policy.next_cleanup_due) : now

    if (now >= nextCleanup) {
      console.log('Running scheduled data retention cleanup...')
      try {
        const report = await this.runIntelligentCleanup()
        console.log('Scheduled cleanup completed:', report)
      } catch (error) {
        console.error('Scheduled cleanup failed:', error)
      }
    }
  }

  /**
   * Create or update retention policy
   */
  async updateRetentionPolicy(policy: Partial<RetentionPolicy>): Promise<RetentionPolicy> {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .upsert({
          policy_name: policy.policy_name || 'default_policy',
          description: policy.description,
          default_retention_days: policy.default_retention_days || 30,
          preserve_tracked_jobs: policy.preserve_tracked_jobs !== false,
          preserve_applied_jobs: policy.preserve_applied_jobs !== false,
          preserve_recent_searches_days: policy.preserve_recent_searches_days || 90,
          cleanup_frequency_hours: policy.cleanup_frequency_hours || 24,
          is_active: policy.is_active !== false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as RetentionPolicy
    } catch (error) {
      console.error('Error updating retention policy:', error)
      throw error
    }
  }
}

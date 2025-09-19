/**
 * Smart Job Aggregator with Intelligent Source Prioritization
 * Combines multiple job sources with intelligent fallback and prioritization
 */

import { GoogleJobSearch, GoogleJobResult } from './google-job-search'
import { EthicalJobAggregator } from './crawler/ethical-job-aggregator'
import { JobListing } from './job-matching-service'
import { JobStorageService } from './services/job-storage-service'

export interface JobSource {
  name: string
  type: 'api' | 'rss' | 'scraping' | 'google-search' | 'ai-synthesis'
  priority: number // 1-10, higher = more important
  reliability: number // 0-100, percentage
  cost: number // Cost per request (0 = free)
  rateLimit: number // Requests per hour
  lastUsed?: Date
  successRate?: number
  avgResponseTime?: number
}

export interface SmartAggregationResult {
  jobs: JobListing[]
  sources: Array<{
    name: string
    type: string
    count: number
    success: boolean
    responseTime: number
    priority: number
    reliability: number
  }>
  total: number
  aggregationTime: number
  fallbackUsed: boolean
  recommendations: string[]
}

export class SmartJobAggregator {
  private googleSearch: GoogleJobSearch
  private ethicalAggregator: EthicalJobAggregator
  private jobStorage: JobStorageService
  private sources: JobSource[]
  private performanceMetrics = new Map<string, {
    successCount: number
    failureCount: number
    totalResponseTime: number
    lastUsed: Date
  }>()

  constructor() {
    this.googleSearch = new GoogleJobSearch()
    this.ethicalAggregator = new EthicalJobAggregator()
    this.jobStorage = new JobStorageService()
    
    this.sources = this.initializeSources()
  }

  /**
   * Initialize job sources with priorities and metrics
   */
  private initializeSources(): JobSource[] {
    return [
      {
        name: 'Google Custom Search',
        type: 'google-search',
        priority: 9,
        reliability: 95,
        cost: 0.005, // $5 per 1000 queries
        rateLimit: 100,
        successRate: 0
      },
      {
        name: 'Job Storage Cache',
        type: 'api',
        priority: 8,
        reliability: 99,
        cost: 0,
        rateLimit: 1000,
        successRate: 0
      },
      {
        name: 'Ethical RSS Aggregator',
        type: 'rss',
        priority: 7,
        reliability: 80,
        cost: 0,
        rateLimit: 50,
        successRate: 0
      },
      {
        name: 'AI Job Synthesis',
        type: 'ai-synthesis',
        priority: 6,
        reliability: 90,
        cost: 0.01, // AI API costs
        rateLimit: 20,
        successRate: 0
      }
    ]
  }

  /**
   * Get jobs with intelligent source prioritization
   */
  async getJobs(keywords: string = '', location: string = 'South Africa', limit: number = 50): Promise<SmartAggregationResult> {
    const startTime = Date.now()
    const allJobs: JobListing[] = []
    const sourceResults: SmartAggregationResult['sources'] = []
    let fallbackUsed = false
    const recommendations: string[] = []

    console.log(`🚀 Smart Job Aggregation: "${keywords}" in "${location}"`)

    // Sort sources by priority and current performance
    const prioritizedSources = await this.prioritizeSources(keywords, location)

    // Try sources in priority order
    for (const source of prioritizedSources) {
      if (allJobs.length >= limit) {
        console.log(`✅ Target limit (${limit}) reached, stopping aggregation`)
        break
      }

      try {
        const sourceStartTime = Date.now()
        const jobs = await this.fetchFromSource(source, keywords, location, limit - allJobs.length)
        const responseTime = Date.now() - sourceStartTime

        if (jobs.length > 0) {
          allJobs.push(...jobs)
          
          sourceResults.push({
            name: source.name,
            type: source.type,
            count: jobs.length,
            success: true,
            responseTime,
            priority: source.priority,
            reliability: source.reliability
          })

          // Update performance metrics
          this.updateSourceMetrics(source.name, true, responseTime)
          
          console.log(`✅ ${source.name}: ${jobs.length} jobs in ${responseTime}ms`)

          // Store jobs in cache for future use
          if (source.type !== 'api') {
            await this.jobStorage.storeJobsBatch(jobs, `smart-aggregation-${Date.now()}`)
          }
        } else {
          sourceResults.push({
            name: source.name,
            type: source.type,
            count: 0,
            success: false,
            responseTime,
            priority: source.priority,
            reliability: source.reliability
          })

          this.updateSourceMetrics(source.name, false, responseTime)
          console.log(`⚠️ ${source.name}: No jobs found`)
        }

      } catch (error) {
        console.error(`❌ ${source.name} failed:`, error)
        
        sourceResults.push({
          name: source.name,
          type: source.type,
          count: 0,
          success: false,
          responseTime: 0,
          priority: source.priority,
          reliability: source.reliability
        })

        this.updateSourceMetrics(source.name, false, 0)
      }
    }

    // If no jobs found, use AI synthesis as final fallback
    if (allJobs.length === 0) {
      console.log('🔄 No jobs found from any source, using AI synthesis fallback')
      fallbackUsed = true
      
      try {
        const aiJobs = await this.generateAIJobs(keywords, location, limit)
        allJobs.push(...aiJobs)
        
        sourceResults.push({
          name: 'AI Synthesis Fallback',
          type: 'ai-synthesis',
          count: aiJobs.length,
          success: true,
          responseTime: 0,
          priority: 5,
          reliability: 85
        })
        
        recommendations.push('Consider adding more job sources or improving search terms')
      } catch (error) {
        console.error('❌ AI synthesis fallback failed:', error)
        recommendations.push('All job sources failed. Check API configurations and network connectivity.')
      }
    }

    // Generate recommendations based on results
    this.generateRecommendations(sourceResults, allJobs.length, recommendations)

    const aggregationTime = Date.now() - startTime

    console.log(`🎯 Smart Aggregation complete: ${allJobs.length} jobs in ${aggregationTime}ms`)

    return {
      jobs: allJobs.slice(0, limit),
      sources: sourceResults,
      total: allJobs.length,
      aggregationTime,
      fallbackUsed,
      recommendations
    }
  }

  /**
   * Prioritize sources based on performance and context
   */
  private async prioritizeSources(keywords: string, location: string): Promise<JobSource[]> {
    const sources = [...this.sources]

    // Update source priorities based on current performance
    for (const source of sources) {
      const metrics = this.performanceMetrics.get(source.name)
      if (metrics) {
        const totalRequests = metrics.successCount + metrics.failureCount
        if (totalRequests > 0) {
          source.successRate = metrics.successCount / totalRequests
          source.avgResponseTime = metrics.totalResponseTime / totalRequests
          
          // Adjust priority based on performance
          if (source.successRate > 0.8) {
            source.priority = Math.min(source.priority + 1, 10)
          } else if (source.successRate < 0.5) {
            source.priority = Math.max(source.priority - 1, 1)
          }
        }
      }
    }

    // Context-based prioritization
    if (keywords) {
      // For specific keywords, prioritize Google Search
      const googleSource = sources.find(s => s.name === 'Google Custom Search')
      if (googleSource) {
        googleSource.priority = 10
      }
    }

    if (location !== 'South Africa') {
      // For specific locations, prioritize sources with better location data
      const storageSource = sources.find(s => s.name === 'Job Storage Cache')
      if (storageSource) {
        storageSource.priority = 9
      }
    }

    // Sort by priority (descending) and reliability (descending)
    return sources.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return b.reliability - a.reliability
    })
  }

  /**
   * Fetch jobs from a specific source
   */
  private async fetchFromSource(source: JobSource, keywords: string, location: string, limit: number): Promise<JobListing[]> {
    switch (source.type) {
      case 'google-search':
        if (!this.googleSearch.isConfigured()) {
          throw new Error('Google Search API not configured')
        }
        const googleResults = await this.googleSearch.searchJobs(keywords, location, limit)
        return this.convertGoogleResultsToJobListings(googleResults)

      case 'api':
        const storageResults = await this.jobStorage.searchJobs({
          keywords,
          location,
          posted_within_days: 30,
          limit,
          only_active: true
        })
        return this.convertStorageResultsToJobListings(storageResults.jobs || [])

      case 'rss':
        const rssResults = await this.ethicalAggregator.getJobs(keywords, location)
        return rssResults.jobs.slice(0, limit)

      case 'ai-synthesis':
        return await this.generateAIJobs(keywords, location, limit)

      default:
        throw new Error(`Unknown source type: ${source.type}`)
    }
  }

  /**
   * Convert Google Search results to JobListing format
   */
  private convertGoogleResultsToJobListings(googleResults: GoogleJobResult[]): JobListing[] {
    return googleResults.map(result => ({
      id: result.id,
      title: result.title,
      company: result.company,
      location: result.location,
      description: result.description,
      requirements: [],
      salary: result.salary,
      type: result.jobType as 'full-time' | 'part-time' | 'contract' | 'internship' || 'full-time',
      postedDate: result.postedDate,
      keywords: result.keywords
    }))
  }

  /**
   * Convert storage results to JobListing format
   */
  private convertStorageResultsToJobListings(storageJobs: any[]): JobListing[] {
    return storageJobs.map(job => ({
      id: job.external_id || job.id,
      title: job.title,
      company: job.company,
      location: job.location || 'South Africa',
      description: job.description || '',
      requirements: job.requirements || [],
      salary: job.salary_range,
      type: (job.job_type || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
      postedDate: job.posted_date || new Date().toISOString(),
      keywords: job.keywords || []
    }))
  }

  /**
   * Generate AI jobs as fallback
   */
  private async generateAIJobs(keywords: string, location: string, limit: number): Promise<JobListing[]> {
    try {
      const response = await fetch('/api/gemini-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: null,
          location,
          keywords
        })
      })

      if (response.ok) {
        const aiJobs = await response.json()
        return Array.isArray(aiJobs) ? aiJobs.slice(0, limit) : []
      }
    } catch (error) {
      console.error('AI job generation failed:', error)
    }

    return []
  }

  /**
   * Update source performance metrics
   */
  private updateSourceMetrics(sourceName: string, success: boolean, responseTime: number): void {
    const metrics = this.performanceMetrics.get(sourceName) || {
      successCount: 0,
      failureCount: 0,
      totalResponseTime: 0,
      lastUsed: new Date()
    }

    if (success) {
      metrics.successCount++
    } else {
      metrics.failureCount++
    }

    metrics.totalResponseTime += responseTime
    metrics.lastUsed = new Date()

    this.performanceMetrics.set(sourceName, metrics)
  }

  /**
   * Generate recommendations based on aggregation results
   */
  private generateRecommendations(sourceResults: SmartAggregationResult['sources'], totalJobs: number, recommendations: string[]): void {
    const successfulSources = sourceResults.filter(s => s.success)
    const failedSources = sourceResults.filter(s => !s.success)

    if (totalJobs === 0) {
      recommendations.push('No jobs found. Try broader search terms or different location.')
    } else if (totalJobs < 10) {
      recommendations.push('Few jobs found. Consider expanding search criteria or adding more job sources.')
    }

    if (failedSources.length > 0) {
      recommendations.push(`Some sources failed: ${failedSources.map(s => s.name).join(', ')}. Check their configurations.`)
    }

    if (successfulSources.length === 1) {
      recommendations.push('Only one source is working. Consider configuring additional job sources for better coverage.')
    }

    const avgResponseTime = successfulSources.reduce((sum, s) => sum + s.responseTime, 0) / successfulSources.length
    if (avgResponseTime > 5000) {
      recommendations.push('Slow response times detected. Consider optimizing source configurations or adding caching.')
    }
  }

  /**
   * Get aggregation statistics
   */
  getStats(): {
    sources: JobSource[]
    performanceMetrics: Map<string, any>
    recommendations: string[]
  } {
    return {
      sources: this.sources,
      performanceMetrics: this.performanceMetrics,
      recommendations: [
        'Configure Google Custom Search API for best results',
        'Set up official job board APIs (Adzuna, Careers24)',
        'Monitor source performance and adjust priorities',
        'Consider implementing job deduplication'
      ]
    }
  }

  /**
   * Force refresh of source priorities
   */
  async refreshSourcePriorities(): Promise<void> {
    console.log('🔄 Refreshing source priorities...')
    
    // Reset performance metrics
    this.performanceMetrics.clear()
    
    // Reinitialize sources
    this.sources = this.initializeSources()
    
    console.log('✅ Source priorities refreshed')
  }
}



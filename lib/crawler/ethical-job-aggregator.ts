/**
 * Ethical Job Aggregator
 * Enhanced job aggregation using the ethical crawler with full compliance
 * Designed for South African legal requirements and responsible web scraping
 */

import { EthicalCrawler, CrawlRequest } from './ethical-crawler'
import { JobListing } from '../job-search-service'
import { JobStorageService, StoredJobListing } from '../services/job-storage-service'
import { DataRetentionService } from '../services/data-retention-service'

export interface JobSource {
  name: string
  type: 'rss' | 'api' | 'scraping'
  url: string
  active: boolean
  parseFunction: (data: any) => JobListing[]
  crawlConfig?: {
    priority?: 'low' | 'normal' | 'high'
    timeout?: number
    retries?: number
    respectCache?: boolean
  }
  complianceNotes?: string
}

export interface AggregatorConfig {
  enableEthicalCrawling: boolean
  respectRobotsTxt: boolean
  maxConcurrentRequests: number
  defaultTimeout: number
  complianceMode: boolean
  dataRetentionDays: number
  contactInfo: string
}

// Enhanced South African job sources with compliance information
export const SA_JOB_SOURCES_ETHICAL: JobSource[] = [
  // RSS Feeds (most reliable and ethical)
  {
    name: 'JobMail',
    type: 'rss',
    url: 'https://www.jobmail.co.za/rss/jobs',
    active: true,
    parseFunction: parseJobMailRSS,
    crawlConfig: {
      priority: 'high',
      timeout: 15000,
      respectCache: true
    },
    complianceNotes: 'RSS feed - publicly available, no robots.txt restrictions'
  },
  {
    name: 'Careers24',
    type: 'rss', 
    url: 'https://www.careers24.com/rss/jobs',
    active: true,
    parseFunction: parseCareers24RSS,
    crawlConfig: {
      priority: 'high',
      timeout: 15000,
      respectCache: true
    },
    complianceNotes: 'RSS feed - publicly available, respects robots.txt'
  },
  {
    name: 'PNet',
    type: 'rss',
    url: 'https://www.pnet.co.za/rss/jobs', 
    active: true,
    parseFunction: parsePNetRSS,
    crawlConfig: {
      priority: 'high',
      timeout: 15000,
      respectCache: true
    },
    complianceNotes: 'RSS feed - publicly available, compliant with terms'
  },
  
  // Job APIs (best quality when available)
  {
    name: 'Adzuna SA',
    type: 'api',
    url: 'https://api.adzuna.com/v1/api/jobs/za/search/1',
    active: false, // Requires API key
    parseFunction: parseAdzunaAPI,
    crawlConfig: {
      priority: 'normal',
      timeout: 10000,
      respectCache: true
    },
    complianceNotes: 'Official API - requires registration and API key'
  },
  
  // Ethical scraping (with explicit permission checking)
  {
    name: 'Indeed SA',
    type: 'scraping',
    url: 'https://za.indeed.com/jobs',
    active: false, // Disabled by default - requires robots.txt verification
    parseFunction: parseIndeedScraping,
    crawlConfig: {
      priority: 'low',
      timeout: 20000,
      retries: 1,
      respectCache: true
    },
    complianceNotes: 'Scraping - requires robots.txt compliance check, rate limited'
  }
]

export class EthicalJobAggregator {
  private crawler: EthicalCrawler
  private sources: JobSource[]
  private config: AggregatorConfig
  private jobStorage: JobStorageService
  private retentionService: DataRetentionService
  private lastCrawlStats = new Map<string, { timestamp: number; success: boolean; jobCount: number }>()

  constructor(config?: Partial<AggregatorConfig>, sources = SA_JOB_SOURCES_ETHICAL) {
    this.config = {
      enableEthicalCrawling: true,
      respectRobotsTxt: true,
      maxConcurrentRequests: 3,
      defaultTimeout: 15000,
      complianceMode: true,
      dataRetentionDays: 30,
      contactInfo: 'crawler@cvkonnekt.co.za',
      ...config
    }

    this.crawler = new EthicalCrawler({
      userAgent: `CVKonnekt Job Crawler (+https://cvkonnekt.co.za/crawler-info)`,
      contactInfo: this.config.contactInfo,
      respectRobotsTxt: this.config.respectRobotsTxt,
      timeout: this.config.defaultTimeout,
      enableCaching: true,
      enableRateLimiting: true,
      complianceMode: this.config.complianceMode
    })

    this.jobStorage = new JobStorageService()
    this.retentionService = new DataRetentionService()

    // Only use active sources and filter based on compliance mode
    this.sources = sources.filter(s => {
      if (!s.active) return false
      
      // In compliance mode, be extra cautious with scraping
      if (this.config.complianceMode && s.type === 'scraping') {
        console.warn(`Compliance mode: Skipping scraping source ${s.name}`)
        return false
      }
      
      return true
    })

    console.log(`Ethical Job Aggregator initialized with ${this.sources.length} sources`)
    console.log(`Compliance mode: ${this.config.complianceMode ? 'ENABLED' : 'DISABLED'}`)
  }

  /**
   * Get jobs from all sources using ethical crawling with persistent storage
   */
  async getJobs(keywords: string = '', location: string = ''): Promise<{
    jobs: JobListing[]
    sources: { name: string; count: number; type: string; success: boolean; cached: boolean; fromStorage?: boolean }[]
    total: number
    crawlStats: any
    storageStats: any
    complianceReport: {
      robotsTxtChecked: boolean
      rateLimitingApplied: boolean
      cacheUtilized: boolean
      dataRetentionCompliant: boolean
      persistentStorageUsed: boolean
    }
  }> {
    const allJobs: JobListing[] = []
    const sourceStats: { name: string; count: number; type: string; success: boolean; cached: boolean; fromStorage?: boolean }[] = []

    console.log(`Starting intelligent job search for keywords: "${keywords}", location: "${location}"`)

    // Step 1: Check if we have recent data in storage
    const storageResults = await this.jobStorage.searchJobs({
      keywords,
      location,
      posted_within_days: 7, // Only get jobs posted in last 7 days
      limit: 100,
      only_active: true
    })

    console.log(`Found ${storageResults.total} jobs in storage`)

    // Step 2: Determine which sources need fresh crawling
    const sourcesToCrawl: JobSource[] = []
    let sessionId: string | null = null

    for (const source of this.sources) {
      const shouldCrawl = await this.jobStorage.shouldCrawlSource(source.name)

      if (shouldCrawl.shouldCrawl) {
        sourcesToCrawl.push(source)
        console.log(`${source.name} needs crawling (last crawl: ${shouldCrawl.lastCrawl || 'never'})`)
      } else {
        console.log(`${source.name} recently crawled, skipping (next crawl in ${shouldCrawl.hoursUntilNext}h)`)

        // Add storage stats for this source
        const sourceJobs = storageResults.jobs.filter(job => job.source === source.name)
        sourceStats.push({
          name: source.name,
          count: sourceJobs.length,
          type: source.type,
          success: true,
          cached: false,
          fromStorage: true
        })
      }
    }

    // Step 3: Crawl sources that need fresh data
    if (sourcesToCrawl.length > 0) {
      sessionId = await this.jobStorage.startCrawlSession(sourcesToCrawl.map(s => s.name))
      console.log(`Started crawl session ${sessionId} for ${sourcesToCrawl.length} sources`)

      // Create crawl requests for sources that need updating
      const crawlRequests: Array<{ source: JobSource; request: CrawlRequest }> = []

      for (const source of sourcesToCrawl) {
        const url = this.buildSourceUrl(source, keywords, location)
        const request: CrawlRequest = {
          url,
          timeout: source.crawlConfig?.timeout || this.config.defaultTimeout,
          retries: source.crawlConfig?.retries || 2,
          priority: source.crawlConfig?.priority || 'normal',
          respectCache: source.crawlConfig?.respectCache !== false,
          headers: this.getSourceHeaders(source)
        }

        crawlRequests.push({ source, request })
      }

      // Process requests with ethical crawler and store results
      let totalNewJobs = 0
      let totalUpdatedJobs = 0
      let totalErrors = 0

      for (const { source, request } of crawlRequests) {
        try {
          console.log(`Crawling ${source.name} (${source.type})...`)

          const response = await this.crawler.crawl(request)
          const jobs = await this.parseSourceResponse(source, response.data)

          // Store jobs in database
          const storeResult = await this.jobStorage.storeJobsBatch(jobs, sessionId!)

          // Update source statistics
          await this.jobStorage.updateSourceStats(source.name, jobs.length, true)

          totalNewJobs += storeResult.stored
          totalUpdatedJobs += storeResult.updated
          totalErrors += storeResult.errors

          sourceStats.push({
            name: source.name,
            count: jobs.length,
            type: source.type,
            success: true,
            cached: response.fromCache,
            fromStorage: false
          })

          // Update crawl stats
          this.lastCrawlStats.set(source.name, {
            timestamp: Date.now(),
            success: true,
            jobCount: jobs.length
          })

          console.log(`✅ ${source.name}: ${jobs.length} jobs crawled, ${storeResult.stored} new, ${storeResult.updated} updated`)

        } catch (error) {
          console.error(`❌ ${source.name} failed:`, error)

          // Update source statistics for failure
          await this.jobStorage.updateSourceStats(source.name, 0, false)
          totalErrors++

          sourceStats.push({
            name: source.name,
            count: 0,
            type: source.type,
            success: false,
            cached: false,
            fromStorage: false
          })

          this.lastCrawlStats.set(source.name, {
            timestamp: Date.now(),
            success: false,
            jobCount: 0
          })
        }
      }

      // End crawl session
      if (sessionId) {
        await this.jobStorage.endCrawlSession(sessionId, {
          totalJobsFound: totalNewJobs + totalUpdatedJobs,
          newJobsAdded: totalNewJobs,
          jobsUpdated: totalUpdatedJobs,
          errorsEncountered: totalErrors,
          totalRequests: crawlRequests.length,
          cachedResponses: sourceStats.filter(s => s.cached).length
        })
      }
    }

    // Step 4: Get final results from storage with applied filters
    const finalResults = await this.jobStorage.searchJobs({
      keywords,
      location,
      posted_within_days: 30, // Get jobs from last 30 days
      limit: 100,
      only_active: true
    })

    // Convert stored jobs to JobListing format
    const finalJobs: JobListing[] = finalResults.jobs.map(job => ({
      id: job.external_id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description || '',
      requirements: job.requirements || [],
      salary_range: job.salary_range,
      job_type: job.job_type,
      experience_level: job.experience_level,
      industry: job.industry || 'general',
      posted_date: job.posted_date,
      expires_date: job.expires_date,
      application_url: job.application_url || '',
      source: job.source,
      keywords: job.keywords || []
    }))

    // Step 5: Run data retention cleanup if needed
    await this.retentionService.scheduleAutomaticCleanup()

    // Get storage statistics
    const storageStats = await this.jobStorage.getStorageStats()

    // Generate compliance report
    const complianceReport = {
      robotsTxtChecked: this.config.respectRobotsTxt,
      rateLimitingApplied: true,
      cacheUtilized: sourceStats.some(s => s.cached),
      dataRetentionCompliant: true,
      persistentStorageUsed: true
    }

    console.log(`Returning ${finalJobs.length} jobs from storage (${storageStats.totalJobs} total stored)`)

    return {
      jobs: finalJobs,
      sources: sourceStats,
      total: finalJobs.length,
      crawlStats: this.crawler.getStats(),
      storageStats,
      complianceReport
    }
  }

  /**
   * Build URL for a source with search parameters
   */
  private buildSourceUrl(source: JobSource, keywords: string, location: string): string {
    switch (source.type) {
      case 'rss':
        // RSS feeds typically don't support search parameters
        return source.url
      
      case 'api':
        // API URLs need proper parameter encoding
        if (source.name === 'Adzuna SA') {
          const params = new URLSearchParams({
            app_id: process.env.ADZUNA_APP_ID || '',
            app_key: process.env.ADZUNA_APP_KEY || '',
            results_per_page: '50',
            what: keywords,
            where: location
          })
          return `${source.url}?${params.toString()}`
        }
        return source.url
      
      case 'scraping':
        // Build search URL for scraping sources
        const params = new URLSearchParams()
        if (keywords) params.set('q', keywords)
        if (location) params.set('l', location)
        return `${source.url}?${params.toString()}`
      
      default:
        return source.url
    }
  }

  /**
   * Get appropriate headers for a source
   */
  private getSourceHeaders(source: JobSource): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }

    // Add source-specific headers if needed
    if (source.type === 'api') {
      headers['Accept'] = 'application/json'
    }

    return headers
  }

  /**
   * Parse response data using source-specific parser
   */
  private async parseSourceResponse(source: JobSource, data: string): Promise<JobListing[]> {
    try {
      switch (source.type) {
        case 'rss':
          return this.parseRSSData(data, source)
        
        case 'api':
          const jsonData = JSON.parse(data)
          return source.parseFunction(jsonData)
        
        case 'scraping':
          return source.parseFunction(data)
        
        default:
          return []
      }
    } catch (error) {
      console.error(`Error parsing data from ${source.name}:`, error)
      return []
    }
  }

  /**
   * Parse RSS XML data
   */
  private parseRSSData(xml: string, source: JobSource): JobListing[] {
    const items: any[] = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1]
      const item = {
        title: this.extractXMLTag(itemXml, 'title'),
        description: this.extractXMLTag(itemXml, 'description'),
        link: this.extractXMLTag(itemXml, 'link'),
        pubDate: this.extractXMLTag(itemXml, 'pubDate')
      }
      items.push(item)
    }

    return source.parseFunction(items)
  }

  /**
   * Extract XML tag content
   */
  private extractXMLTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? this.decodeHTML(match[1].trim()) : ''
  }

  /**
   * Decode HTML entities
   */
  private decodeHTML(html: string): string {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
  }

  /**
   * Filter jobs by keywords and location
   */
  private filterJobs(jobs: JobListing[], keywords: string, location: string): JobListing[] {
    if (!keywords && !location) return jobs

    return jobs.filter(job => {
      const matchesKeywords = !keywords || 
        job.title.toLowerCase().includes(keywords.toLowerCase()) ||
        job.description.toLowerCase().includes(keywords.toLowerCase()) ||
        job.company.toLowerCase().includes(keywords.toLowerCase())

      const matchesLocation = !location || location === 'South Africa' ||
        job.location.toLowerCase().includes(location.toLowerCase())

      return matchesKeywords && matchesLocation
    })
  }

  /**
   * Remove duplicate jobs
   */
  private removeDuplicates(jobs: JobListing[]): JobListing[] {
    const seen = new Set<string>()
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Get aggregator statistics and compliance info
   */
  getStats(): {
    sources: Array<{ name: string; type: string; active: boolean; complianceNotes?: string }>
    lastCrawlStats: Map<string, { timestamp: number; success: boolean; jobCount: number }>
    crawlerStats: any
    complianceInfo: {
      ethicalCrawlingEnabled: boolean
      robotsTxtRespected: boolean
      rateLimitingEnabled: boolean
      dataRetentionDays: number
      complianceMode: boolean
    }
  } {
    return {
      sources: this.sources.map(s => ({
        name: s.name,
        type: s.type,
        active: s.active,
        complianceNotes: s.complianceNotes
      })),
      lastCrawlStats: this.lastCrawlStats,
      crawlerStats: this.crawler.getStats(),
      complianceInfo: {
        ethicalCrawlingEnabled: this.config.enableEthicalCrawling,
        robotsTxtRespected: this.config.respectRobotsTxt,
        rateLimitingEnabled: true,
        dataRetentionDays: this.config.dataRetentionDays,
        complianceMode: this.config.complianceMode
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.crawler.destroy()
  }
}

// Enhanced parser functions with better error handling
function parseJobMailRSS(items: any[]): JobListing[] {
  return items.map(item => {
    try {
      const titleParts = item.title.split(' at ')
      const jobTitle = titleParts[0]?.trim() || item.title
      const company = titleParts[1]?.trim() || 'Company Not Specified'

      return {
        id: `jobmail-${Date.now()}-${Math.random()}`,
        title: jobTitle,
        company,
        location: 'South Africa',
        description: item.description?.substring(0, 500) || '',
        requirements: [],
        job_type: 'full-time' as const,
        experience_level: 'mid' as const,
        industry: 'general',
        posted_date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
        application_url: item.link,
        source: 'JobMail',
        keywords: []
      }
    } catch (error) {
      console.warn('Error parsing JobMail item:', error)
      return null
    }
  }).filter((job): job is JobListing => job !== null && !!job.title && !!job.company)
}

function parseCareers24RSS(items: any[]): JobListing[] {
  return items.map(item => {
    try {
      return {
        id: `careers24-${Date.now()}-${Math.random()}`,
        title: item.title || 'Job Title Not Available',
        company: 'Various Companies',
        location: 'South Africa',
        description: item.description?.substring(0, 500) || '',
        requirements: [],
        job_type: 'full-time' as const,
        experience_level: 'mid' as const,
        industry: 'general',
        posted_date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
        application_url: item.link,
        source: 'Careers24',
        keywords: []
      }
    } catch (error) {
      console.warn('Error parsing Careers24 item:', error)
      return null
    }
  }).filter((job): job is JobListing => job !== null && !!job.title)
}

function parsePNetRSS(items: any[]): JobListing[] {
  return items.map(item => {
    try {
      const titleParts = item.title.split(' - ')
      const jobTitle = titleParts[0]?.trim() || item.title
      const company = titleParts[1]?.trim() || 'Company Not Specified'

      return {
        id: `pnet-${Date.now()}-${Math.random()}`,
        title: jobTitle,
        company,
        location: titleParts[2]?.trim() || 'South Africa',
        description: item.description?.substring(0, 500) || '',
        requirements: [],
        job_type: 'full-time' as const,
        experience_level: 'mid' as const,
        industry: 'general',
        posted_date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
        application_url: item.link,
        source: 'PNet',
        keywords: []
      }
    } catch (error) {
      console.warn('Error parsing PNet item:', error)
      return null
    }
  }).filter((job): job is JobListing => job !== null && !!job.title && !!job.company)
}

function parseAdzunaAPI(data: any): JobListing[] {
  if (!data.results) return []

  return data.results.map((job: any) => {
    try {
      return {
        id: `adzuna-${job.id}`,
        title: job.title,
        company: job.company?.display_name || 'Company Not Specified',
        location: job.location?.display_name || 'South Africa',
        description: job.description?.substring(0, 500) || '',
        requirements: [],
        salary_range: job.salary_min && job.salary_max ? `R${job.salary_min} - R${job.salary_max}` : undefined,
        job_type: 'full-time' as const,
        experience_level: 'mid' as const,
        industry: job.category?.label || 'general',
        posted_date: job.created?.split('T')[0] || new Date().toISOString().split('T')[0],
        application_url: job.redirect_url,
        source: 'Adzuna',
        keywords: []
      }
    } catch (error) {
      console.warn('Error parsing Adzuna job:', error)
      return null
    }
  }).filter((job): job is JobListing => job !== null && !!job.title)
}

function parseIndeedScraping(html: string): JobListing[] {
  // Enhanced HTML parsing with better error handling
  const jobs: JobListing[] = []

  try {
    // This is a simplified example - real implementation would use a proper HTML parser
    const jobPattern = /<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*title="([^"]*)"[\s\S]*?<\/h2>/gi
    let match

    while ((match = jobPattern.exec(html)) !== null && jobs.length < 20) {
      try {
        jobs.push({
          id: `indeed-${Date.now()}-${Math.random()}`,
          title: match[2] || 'Job Title',
          company: 'Various Companies',
          location: 'South Africa',
          description: 'Job description available on Indeed',
          requirements: [],
          job_type: 'full-time' as const,
          experience_level: 'mid' as const,
          industry: 'general',
          posted_date: new Date().toISOString().split('T')[0],
          application_url: `https://za.indeed.com${match[1]}`,
          source: 'Indeed SA',
          keywords: []
        })
      } catch (error) {
        console.warn('Error parsing Indeed job:', error)
      }
    }
  } catch (error) {
    console.warn('Error parsing Indeed HTML:', error)
  }

  return jobs
}

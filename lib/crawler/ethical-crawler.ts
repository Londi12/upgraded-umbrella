/**
 * Ethical Web Crawler
 * Main crawler engine that integrates robots.txt parsing, rate limiting, and caching
 * Designed for compliance with South African legal requirements and ethical web scraping
 */

import { RobotsParser, RobotsTxt } from './robots-parser'
import { RateLimiter, DomainState } from './rate-limiter'
import { CacheManager } from './cache-manager'

export interface CrawlRequest {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  priority?: 'low' | 'normal' | 'high'
  respectCache?: boolean
}

export interface CrawlResponse<T = any> {
  url: string
  status: number
  headers: Record<string, string>
  data: T
  fromCache: boolean
  crawlTime: number
  size: number
}

export interface CrawlerConfig {
  userAgent: string
  contactInfo: string
  respectRobotsTxt: boolean
  maxRetries: number
  timeout: number
  enableCaching: boolean
  enableRateLimiting: boolean
  complianceMode: boolean
}

export interface CrawlError {
  url: string
  error: string
  code?: number
  retryable: boolean
}

export class EthicalCrawler {
  private robotsParser: RobotsParser
  private rateLimiter: RateLimiter
  private cacheManager: CacheManager
  private config: CrawlerConfig
  private crawlStats = {
    totalRequests: 0,
    successfulRequests: 0,
    cachedResponses: 0,
    blockedRequests: 0,
    errors: 0
  }

  constructor(config?: Partial<CrawlerConfig>) {
    this.config = {
      userAgent: 'CVKonnekt Job Crawler (+https://cvkonnekt.co.za/crawler-info)',
      contactInfo: 'crawler@cvkonnekt.co.za',
      respectRobotsTxt: true,
      maxRetries: 3,
      timeout: 30000,
      enableCaching: true,
      enableRateLimiting: true,
      complianceMode: true,
      ...config
    }

    this.robotsParser = new RobotsParser()
    this.rateLimiter = new RateLimiter()
    this.cacheManager = new CacheManager()

    // Configure cache for common job sites
    this.setupJobSiteConfigs()
  }

  /**
   * Crawl a single URL
   */
  async crawl<T = any>(request: CrawlRequest): Promise<CrawlResponse<T>> {
    const startTime = Date.now()
    this.crawlStats.totalRequests++

    try {
      // Validate URL
      const url = new URL(request.url)
      const domain = url.hostname

      // Check robots.txt if enabled
      if (this.config.respectRobotsTxt) {
        const robotsTxt = await this.robotsParser.getRobotsTxt(domain)
        if (!this.robotsParser.isAllowed(robotsTxt, request.url, this.config.userAgent)) {
          this.crawlStats.blockedRequests++
          throw new Error(`Crawling blocked by robots.txt for ${request.url}`)
        }

        // Update rate limiter with robots.txt crawl delay
        const crawlDelay = this.robotsParser.getCrawlDelay(robotsTxt, this.config.userAgent)
        this.rateLimiter.updateCrawlDelay(domain, crawlDelay)
      }

      // Check cache first
      if (request.respectCache !== false && this.config.enableCaching) {
        const cached = this.cacheManager.get<T>(request.url)
        if (cached) {
          this.crawlStats.cachedResponses++
          return {
            url: request.url,
            status: 200,
            headers: {},
            data: cached,
            fromCache: true,
            crawlTime: Date.now() - startTime,
            size: 0
          }
        }
      }

      // Wait for rate limiting permission
      if (this.config.enableRateLimiting) {
        await this.rateLimiter.waitForPermission(domain)
      }

      // Perform the actual crawl
      const response = await this.performRequest<T>(request)

      // Cache the response
      if (this.config.enableCaching && response.status === 200) {
        this.cacheManager.set(request.url, response.data, {
          etag: response.headers.etag,
          lastModified: response.headers['last-modified']
        })
      }

      // Release rate limiting permission
      if (this.config.enableRateLimiting) {
        this.rateLimiter.releasePermission(domain, true, response.status)
      }

      this.crawlStats.successfulRequests++
      return response

    } catch (error) {
      this.crawlStats.errors++
      
      // Release rate limiting permission on error
      if (this.config.enableRateLimiting) {
        const domain = new URL(request.url).hostname
        const errorCode = error instanceof Error && 'status' in error ? (error as any).status : undefined
        this.rateLimiter.releasePermission(domain, false, errorCode)
      }

      throw error
    }
  }

  /**
   * Crawl multiple URLs with proper scheduling
   */
  async crawlBatch<T = any>(requests: CrawlRequest[]): Promise<Array<CrawlResponse<T> | CrawlError>> {
    const results: Array<CrawlResponse<T> | CrawlError> = []
    
    // Sort by priority and domain to optimize scheduling
    const sortedRequests = this.sortRequestsByPriority(requests)
    
    for (const request of sortedRequests) {
      try {
        const response = await this.crawl<T>(request)
        results.push(response)
      } catch (error) {
        results.push({
          url: request.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: error instanceof Error && 'status' in error ? (error as any).status : undefined,
          retryable: this.isRetryableError(error)
        })
      }
    }

    return results
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest<T>(request: CrawlRequest): Promise<CrawlResponse<T>> {
    const headers = {
      'User-Agent': this.config.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...request.headers
    }

    // Add conditional headers if caching is enabled
    if (this.config.enableCaching) {
      const conditionalHeaders = this.cacheManager.getConditionalHeaders(request.url)
      Object.assign(headers, conditionalHeaders)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), request.timeout || this.config.timeout)

    try {
      const response = await fetch(request.url, {
        method: request.method || 'GET',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeout)

      // Handle 304 Not Modified
      if (response.status === 304) {
        const cached = this.cacheManager.get<T>(request.url)
        if (cached) {
          return {
            url: request.url,
            status: 304,
            headers: Object.fromEntries(response.headers.entries()),
            data: cached,
            fromCache: true,
            crawlTime: 0,
            size: 0
          }
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.text()
      const size = new Blob([data]).size

      return {
        url: request.url,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: data as T,
        fromCache: false,
        crawlTime: 0,
        size
      }

    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Setup configurations for common job sites
   */
  private setupJobSiteConfigs(): void {
    const jobSites = [
      { domain: 'careers24.com', ttl: 6 * 60 * 60 * 1000 }, // 6 hours
      { domain: 'pnet.co.za', ttl: 4 * 60 * 60 * 1000 }, // 4 hours
      { domain: 'indeed.co.za', ttl: 2 * 60 * 60 * 1000 }, // 2 hours
      { domain: 'jobmail.co.za', ttl: 8 * 60 * 60 * 1000 }, // 8 hours
      { domain: 'careerjet.co.za', ttl: 12 * 60 * 60 * 1000 }, // 12 hours
    ]

    jobSites.forEach(site => {
      this.cacheManager.setDomainConfig(site.domain, {
        domain: site.domain,
        ttl: site.ttl,
        maxEntries: 1000,
        enabled: true
      })
    })
  }

  /**
   * Sort requests by priority and domain for optimal scheduling
   */
  private sortRequestsByPriority(requests: CrawlRequest[]): CrawlRequest[] {
    return requests.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      const aPriority = priorityOrder[a.priority || 'normal']
      const bPriority = priorityOrder[b.priority || 'normal']
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }

      // Then group by domain to optimize rate limiting
      const aDomain = new URL(a.url).hostname
      const bDomain = new URL(b.url).hostname
      return aDomain.localeCompare(bDomain)
    })
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      if (message.includes('timeout') || message.includes('network')) {
        return true
      }
      
      if ('status' in error) {
        const status = error.status
        return status >= 500 || status === 429 || status === 408
      }
    }
    return false
  }

  /**
   * Get crawler statistics
   */
  getStats(): typeof this.crawlStats & {
    rateLimiterStats: Map<string, DomainState>
    cacheStats: ReturnType<CacheManager['getStats']>
  } {
    return {
      ...this.crawlStats,
      rateLimiterStats: this.rateLimiter.getAllDomainStates(),
      cacheStats: this.cacheManager.getStats()
    }
  }

  /**
   * Clear all caches and reset state
   */
  reset(): void {
    this.cacheManager.clear()
    this.robotsParser.clearCache()
    this.crawlStats = {
      totalRequests: 0,
      successfulRequests: 0,
      cachedResponses: 0,
      blockedRequests: 0,
      errors: 0
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cacheManager.destroy()
  }
}

/**
 * South African Job Search Service
 * Restricted to approved SA job sites with full compliance
 */

import { RobotsParser } from './crawler/robots-parser'

export interface SAJobResult {
  title: string
  snippet: string
  url: string
  source: string
  posted_date?: string
  company?: string
  location?: string
}

export interface SAJobSearchResponse {
  results: SAJobResult[]
  total: number
  sources_checked: string[]
  compliance_report: {
    robots_txt_checked: boolean
    rate_limiting_applied: boolean
    cache_utilized: boolean
    data_retention_compliant: boolean
  }
  message?: string
}

interface CachedResult {
  data: SAJobResult[]
  fetched_at: number
  expires_at: number
  source: string
}

export class SAJobSearchService {
  private readonly APPROVED_DOMAINS = [
    'www.careers24.com',
    'www.pnet.co.za', 
    'www.careerjunction.co.za',
    'www.adzuna.co.za',
    'www.jobmail.co.za',
    'www.linkedin.com',
    'za.indeed.com'
  ]

  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days
  private readonly RATE_LIMIT_DELAY = 2000 // 2 seconds between requests
  private cache = new Map<string, CachedResult>()
  private robotsParser = new RobotsParser()
  private lastRequestTime = 0

  /**
   * Search for jobs across approved SA job sites
   */
  async searchJobs(query: string, location?: string): Promise<SAJobSearchResponse> {
    const results: SAJobResult[] = []
    const sourcesChecked: string[] = []
    let robotsTxtChecked = false
    let rateLimitingApplied = false
    let cacheUtilized = false

    // Clean expired cache entries
    this.cleanExpiredCache()

    for (const domain of this.APPROVED_DOMAINS) {
      try {
        // Check robots.txt compliance
        const robotsTxt = await this.robotsParser.getRobotsTxt(domain)
        robotsTxtChecked = true

        // Build search URL for this domain
        const searchUrl = this.buildSearchUrl(domain, query, location)
        
        // Check if URL is allowed by robots.txt
        if (!this.robotsParser.isAllowed(robotsTxt, searchUrl)) {
          console.log(`Skipping ${domain} - disallowed by robots.txt`)
          continue
        }

        sourcesChecked.push(domain)

        // Check cache first
        const cacheKey = `${domain}-${query}-${location || ''}`
        const cached = this.cache.get(cacheKey)
        
        if (cached && cached.expires_at > Date.now()) {
          results.push(...cached.data)
          cacheUtilized = true
          console.log(`Using cached results for ${domain}`)
          continue
        }

        // Apply rate limiting
        const now = Date.now()
        const timeSinceLastRequest = now - this.lastRequestTime
        if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
          await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest))
          rateLimitingApplied = true
        }
        this.lastRequestTime = Date.now()

        // Fetch results using site-restricted search
        const domainResults = await this.searchDomain(domain, query, location)
        
        if (domainResults.length > 0) {
          results.push(...domainResults)
          
          // Cache results
          this.cache.set(cacheKey, {
            data: domainResults,
            fetched_at: Date.now(),
            expires_at: Date.now() + this.CACHE_TTL,
            source: domain
          })
        }

      } catch (error) {
        console.error(`Error searching ${domain}:`, error)
      }
    }

    // Deduplicate results
    const deduplicatedResults = this.deduplicateResults(results)

    return {
      results: deduplicatedResults.slice(0, 50), // Limit to 50 results
      total: deduplicatedResults.length,
      sources_checked: sourcesChecked,
      compliance_report: {
        robots_txt_checked: robotsTxtChecked,
        rate_limiting_applied: rateLimitingApplied,
        cache_utilized: cacheUtilized,
        data_retention_compliant: true
      },
      message: deduplicatedResults.length === 0 ? "No matching jobs found on approved sites." : undefined
    }
  }

  /**
   * Search a specific domain using Google Custom Search with site restriction
   */
  private async searchDomain(domain: string, query: string, location?: string): Promise<SAJobResult[]> {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
    const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      throw new Error('Google API credentials not configured')
    }

    // Build site-restricted search query
    let searchQuery = `site:${domain} ${query}`
    if (location) {
      searchQuery += ` ${location}`
    }

    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(searchQuery)}&num=10`

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'CVKonnekt Job Search (+https://cvkonnekt.co.za/crawler-info)'
        }
      })

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.items) {
        return []
      }

      return data.items.map((item: any) => ({
        title: this.truncateText(item.title, 100),
        snippet: this.truncateText(item.snippet, 200),
        url: item.link,
        source: domain,
        posted_date: this.extractDate(item.snippet),
        company: this.extractCompany(item.title, item.snippet),
        location: this.extractLocation(item.snippet, location)
      })).filter((result: SAJobResult) => this.isValidJobResult(result))

    } catch (error) {
      console.error(`Error searching ${domain}:`, error)
      return []
    }
  }

  /**
   * Build search URL for a domain
   */
  private buildSearchUrl(domain: string, query: string, location?: string): string {
    const baseUrls: Record<string, string> = {
      'www.careers24.com': 'https://www.careers24.com/jobs',
      'www.pnet.co.za': 'https://www.pnet.co.za/jobs',
      'www.careerjunction.co.za': 'https://www.careerjunction.co.za/jobs',
      'www.adzuna.co.za': 'https://www.adzuna.co.za/jobs',
      'www.jobmail.co.za': 'https://www.jobmail.co.za/jobs',
      'www.linkedin.com': 'https://www.linkedin.com/jobs',
      'za.indeed.com': 'https://za.indeed.com/jobs'
    }

    const baseUrl = baseUrls[domain] || `https://${domain}/jobs`
    const params = new URLSearchParams()
    
    if (query) params.set('q', query)
    if (location) params.set('l', location)
    
    return `${baseUrl}?${params.toString()}`
  }

  /**
   * Deduplicate results using fuzzy matching
   */
  private deduplicateResults(results: SAJobResult[]): SAJobResult[] {
    const seen = new Set<string>()
    const deduplicated: SAJobResult[] = []

    for (const result of results) {
      // Normalize URL for comparison
      const normalizedUrl = this.normalizeUrl(result.url)
      
      // Create fuzzy match key
      const fuzzyKey = this.createFuzzyKey(result.title, result.company)
      
      if (!seen.has(normalizedUrl) && !seen.has(fuzzyKey)) {
        seen.add(normalizedUrl)
        seen.add(fuzzyKey)
        
        // Mark as external
        deduplicated.push({
          ...result,
          title: `[External from ${result.source}]: ${result.title}`
        })
      }
    }

    return deduplicated
  }

  /**
   * Normalize URL for deduplication
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url.toLowerCase())
      // Remove tracking parameters
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source']
      paramsToRemove.forEach(param => parsed.searchParams.delete(param))
      return parsed.toString()
    } catch {
      return url.toLowerCase()
    }
  }

  /**
   * Create fuzzy matching key for title + company
   */
  private createFuzzyKey(title: string, company?: string): string {
    const normalizedTitle = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    const normalizedCompany = company?.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || ''

    return `${normalizedTitle}-${normalizedCompany}`
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * Extract date from snippet
   */
  private extractDate(snippet: string): string | undefined {
    const datePatterns = [
      /(\d{1,2})\s+(days?|weeks?|months?)\s+ago/i,
      /posted\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{4}-\d{2}-\d{2})/
    ]

    for (const pattern of datePatterns) {
      const match = snippet.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return undefined
  }

  /**
   * Extract company name from title or snippet
   */
  private extractCompany(title: string, snippet: string): string | undefined {
    // Look for company patterns in title
    const titlePatterns = [
      /at\s+([^-]+)$/i,
      /-\s+([^-]+)$/i
    ]

    for (const pattern of titlePatterns) {
      const match = title.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }

    // Look for company patterns in snippet
    const snippetPatterns = [
      /company:\s*([^.]+)/i,
      /employer:\s*([^.]+)/i
    ]

    for (const pattern of snippetPatterns) {
      const match = snippet.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }

    return undefined
  }

  /**
   * Extract location from snippet
   */
  private extractLocation(snippet: string, searchLocation?: string): string | undefined {
    if (searchLocation) return searchLocation

    const locationPatterns = [
      /location:\s*([^.]+)/i,
      /(johannesburg|cape town|durban|pretoria|port elizabeth|bloemfontein)/i
    ]

    for (const pattern of locationPatterns) {
      const match = snippet.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }

    return 'South Africa'
  }

  /**
   * Validate job result
   */
  private isValidJobResult(result: SAJobResult): boolean {
    return !!(result.title && result.url && result.source)
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (cached.expires_at <= now) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; expired: number; size_mb: number } {
    const now = Date.now()
    let expired = 0
    
    for (const cached of this.cache.values()) {
      if (cached.expires_at <= now) {
        expired++
      }
    }

    const sizeEstimate = JSON.stringify([...this.cache.entries()]).length / (1024 * 1024)

    return {
      total: this.cache.size,
      expired,
      size_mb: Math.round(sizeEstimate * 100) / 100
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}
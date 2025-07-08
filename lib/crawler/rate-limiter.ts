/**
 * Ethical Rate Limiter and Scheduler
 * Implements domain-specific rate limiting, exponential backoff, and smart scheduling
 */

export interface DomainState {
  domain: string
  lastCrawlTime: number
  crawlDelay: number
  backoffMultiplier: number
  consecutiveErrors: number
  crawlFrequency: 'daily' | 'weekly' | 'monthly'
  lastSuccessfulCrawl: number
  requestCount: number
  requestWindowStart: number
  isBlocked: boolean
  blockUntil?: number
}

export interface RateLimitConfig {
  defaultCrawlDelay: number // milliseconds
  maxConcurrentRequests: number
  maxRequestsPerHour: number
  maxBackoffDelay: number // milliseconds
  backoffMultiplier: number
  errorThreshold: number
  blockDuration: number // milliseconds
}

export class RateLimiter {
  private domainStates = new Map<string, DomainState>()
  private activeRequests = new Set<string>()
  private requestQueue: Array<{ domain: string; resolve: () => void; reject: (error: Error) => void }> = []
  private config: RateLimitConfig

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      defaultCrawlDelay: 10000, // 10 seconds
      maxConcurrentRequests: 5,
      maxRequestsPerHour: 100,
      maxBackoffDelay: 300000, // 5 minutes
      backoffMultiplier: 2,
      errorThreshold: 3,
      blockDuration: 3600000, // 1 hour
      ...config
    }
  }

  /**
   * Wait for permission to crawl a domain
   */
  async waitForPermission(domain: string, crawlDelay?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const state = this.getDomainState(domain)
      
      // Check if domain is blocked
      if (state.isBlocked && state.blockUntil && Date.now() < state.blockUntil) {
        reject(new Error(`Domain ${domain} is blocked until ${new Date(state.blockUntil).toISOString()}`))
        return
      }

      // Clear block if expired
      if (state.isBlocked && state.blockUntil && Date.now() >= state.blockUntil) {
        state.isBlocked = false
        state.blockUntil = undefined
        state.consecutiveErrors = 0
        state.backoffMultiplier = 1
      }

      // Check concurrent request limit
      if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
        this.requestQueue.push({ domain, resolve, reject })
        return
      }

      // Check rate limit for this domain
      const effectiveDelay = crawlDelay || state.crawlDelay
      const timeSinceLastCrawl = Date.now() - state.lastCrawlTime
      
      if (timeSinceLastCrawl < effectiveDelay) {
        const waitTime = effectiveDelay - timeSinceLastCrawl
        setTimeout(() => {
          this.waitForPermission(domain, crawlDelay).then(resolve).catch(reject)
        }, waitTime)
        return
      }

      // Check hourly request limit
      if (!this.checkHourlyLimit(state)) {
        reject(new Error(`Hourly request limit exceeded for domain ${domain}`))
        return
      }

      // Grant permission
      this.activeRequests.add(domain)
      state.lastCrawlTime = Date.now()
      state.requestCount++
      resolve()
    })
  }

  /**
   * Release permission after crawling
   */
  releasePermission(domain: string, success: boolean, responseCode?: number): void {
    this.activeRequests.delete(domain)
    const state = this.getDomainState(domain)

    if (success) {
      state.lastSuccessfulCrawl = Date.now()
      state.consecutiveErrors = 0
      state.backoffMultiplier = 1
      
      // Adjust crawl frequency based on success
      this.adjustCrawlFrequency(state, true)
    } else {
      state.consecutiveErrors++
      
      // Handle 429 Too Many Requests
      if (responseCode === 429) {
        this.handleRateLimitError(state)
      } else {
        this.handleGeneralError(state)
      }
    }

    // Process next request in queue
    this.processQueue()
  }

  /**
   * Handle 429 Too Many Requests response
   */
  private handleRateLimitError(state: DomainState): void {
    state.backoffMultiplier = Math.min(
      state.backoffMultiplier * this.config.backoffMultiplier,
      this.config.maxBackoffDelay / state.crawlDelay
    )
    
    state.crawlDelay = Math.min(
      state.crawlDelay * state.backoffMultiplier,
      this.config.maxBackoffDelay
    )

    console.warn(`Rate limit hit for ${state.domain}. New delay: ${state.crawlDelay}ms`)
  }

  /**
   * Handle general errors
   */
  private handleGeneralError(state: DomainState): void {
    if (state.consecutiveErrors >= this.config.errorThreshold) {
      state.isBlocked = true
      state.blockUntil = Date.now() + this.config.blockDuration
      console.warn(`Domain ${state.domain} blocked due to consecutive errors`)
    }
  }

  /**
   * Get or create domain state
   */
  private getDomainState(domain: string): DomainState {
    if (!this.domainStates.has(domain)) {
      this.domainStates.set(domain, {
        domain,
        lastCrawlTime: 0,
        crawlDelay: this.config.defaultCrawlDelay,
        backoffMultiplier: 1,
        consecutiveErrors: 0,
        crawlFrequency: 'daily',
        lastSuccessfulCrawl: 0,
        requestCount: 0,
        requestWindowStart: Date.now(),
        isBlocked: false
      })
    }
    return this.domainStates.get(domain)!
  }

  /**
   * Check hourly request limit
   */
  private checkHourlyLimit(state: DomainState): boolean {
    const now = Date.now()
    const hourAgo = now - 3600000 // 1 hour

    // Reset window if needed
    if (state.requestWindowStart < hourAgo) {
      state.requestWindowStart = now
      state.requestCount = 0
    }

    return state.requestCount < this.config.maxRequestsPerHour
  }

  /**
   * Adjust crawl frequency based on site activity
   */
  private adjustCrawlFrequency(state: DomainState, success: boolean): void {
    // This is a simple heuristic - in practice, you might want more sophisticated logic
    if (success) {
      const timeSinceLastSuccess = Date.now() - state.lastSuccessfulCrawl
      const oneDayMs = 24 * 60 * 60 * 1000

      if (timeSinceLastSuccess < oneDayMs && state.crawlFrequency === 'weekly') {
        state.crawlFrequency = 'daily'
      } else if (timeSinceLastSuccess > 7 * oneDayMs && state.crawlFrequency === 'daily') {
        state.crawlFrequency = 'weekly'
      }
    }
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    if (this.requestQueue.length === 0) return
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) return

    const next = this.requestQueue.shift()
    if (next) {
      this.waitForPermission(next.domain).then(next.resolve).catch(next.reject)
    }
  }

  /**
   * Get next crawl time for a domain
   */
  getNextCrawlTime(domain: string): number {
    const state = this.getDomainState(domain)
    
    if (state.isBlocked && state.blockUntil) {
      return state.blockUntil
    }

    const frequencyMs = this.getFrequencyMs(state.crawlFrequency)
    return state.lastSuccessfulCrawl + frequencyMs
  }

  /**
   * Convert crawl frequency to milliseconds
   */
  private getFrequencyMs(frequency: DomainState['crawlFrequency']): number {
    switch (frequency) {
      case 'daily': return 24 * 60 * 60 * 1000
      case 'weekly': return 7 * 24 * 60 * 60 * 1000
      case 'monthly': return 30 * 24 * 60 * 60 * 1000
      default: return 24 * 60 * 60 * 1000
    }
  }

  /**
   * Get domain statistics
   */
  getDomainStats(domain: string): DomainState | null {
    return this.domainStates.get(domain) || null
  }

  /**
   * Update crawl delay for a domain
   */
  updateCrawlDelay(domain: string, delay: number): void {
    const state = this.getDomainState(domain)
    state.crawlDelay = Math.max(delay, 1000) // Minimum 1 second
  }

  /**
   * Clear domain state
   */
  clearDomainState(domain: string): void {
    this.domainStates.delete(domain)
  }

  /**
   * Get all domain states for monitoring
   */
  getAllDomainStates(): Map<string, DomainState> {
    return new Map(this.domainStates)
  }
}

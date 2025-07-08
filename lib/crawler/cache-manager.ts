/**
 * Ethical Crawler Cache Manager
 * Implements configurable caching with TTL, data retention policies, and compliance features
 */

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  expires: number
  domain: string
  url: string
  etag?: string
  lastModified?: string
  size: number
}

export interface CacheConfig {
  defaultTTL: number // milliseconds
  maxCacheSize: number // bytes
  maxEntries: number
  cleanupInterval: number // milliseconds
  compressionEnabled: boolean
  persistToDisk: boolean
  retentionPolicy: {
    maxAge: number // milliseconds
    maxSizePerDomain: number // bytes
    autoCleanup: boolean
  }
}

export interface DomainCacheConfig {
  domain: string
  ttl: number
  maxEntries: number
  enabled: boolean
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>()
  private domainConfigs = new Map<string, DomainCacheConfig>()
  private config: CacheConfig
  private cleanupTimer?: NodeJS.Timeout
  private totalSize = 0

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 10000,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      compressionEnabled: true,
      persistToDisk: false,
      retentionPolicy: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxSizePerDomain: 10 * 1024 * 1024, // 10MB per domain
        autoCleanup: true
      },
      ...config
    }

    this.startCleanupTimer()
  }

  /**
   * Set cache configuration for a specific domain
   */
  setDomainConfig(domain: string, config: Partial<DomainCacheConfig>): void {
    const existing = this.domainConfigs.get(domain)
    this.domainConfigs.set(domain, {
      domain,
      ttl: this.config.defaultTTL,
      maxEntries: 1000,
      enabled: true,
      ...existing,
      ...config
    })
  }

  /**
   * Get cached data for a URL
   */
  get<T = any>(url: string): T | null {
    const key = this.generateKey(url)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.delete(url)
      return null
    }

    // Check domain configuration
    const domain = this.extractDomain(url)
    const domainConfig = this.domainConfigs.get(domain)
    
    if (domainConfig && !domainConfig.enabled) {
      return null
    }

    return entry.data
  }

  /**
   * Set cached data for a URL
   */
  set<T = any>(url: string, data: T, options?: {
    ttl?: number
    etag?: string
    lastModified?: string
  }): boolean {
    const domain = this.extractDomain(url)
    const domainConfig = this.domainConfigs.get(domain)

    // Check if caching is enabled for this domain
    if (domainConfig && !domainConfig.enabled) {
      return false
    }

    const key = this.generateKey(url)
    const ttl = options?.ttl || domainConfig?.ttl || this.config.defaultTTL
    const dataSize = this.calculateSize(data)

    // Check cache limits
    if (!this.canAddEntry(domain, dataSize)) {
      this.makeSpace(domain, dataSize)
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
      domain,
      url,
      etag: options?.etag,
      lastModified: options?.lastModified,
      size: dataSize
    }

    // Remove existing entry if it exists
    const existing = this.cache.get(key)
    if (existing) {
      this.totalSize -= existing.size
    }

    this.cache.set(key, entry)
    this.totalSize += dataSize

    return true
  }

  /**
   * Delete cached data for a URL
   */
  delete(url: string): boolean {
    const key = this.generateKey(url)
    const entry = this.cache.get(key)
    
    if (entry) {
      this.totalSize -= entry.size
      return this.cache.delete(key)
    }
    
    return false
  }

  /**
   * Check if URL is cached and not expired
   */
  has(url: string): boolean {
    return this.get(url) !== null
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number
    totalSize: number
    domainStats: Map<string, { entries: number; size: number }>
    hitRate: number
  } {
    const domainStats = new Map<string, { entries: number; size: number }>()
    
    for (const entry of this.cache.values()) {
      const existing = domainStats.get(entry.domain) || { entries: 0, size: 0 }
      domainStats.set(entry.domain, {
        entries: existing.entries + 1,
        size: existing.size + entry.size
      })
    }

    return {
      totalEntries: this.cache.size,
      totalSize: this.totalSize,
      domainStats,
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    }
  }

  /**
   * Clear cache for a specific domain
   */
  clearDomain(domain: string): number {
    let cleared = 0
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.domain === domain) {
        toDelete.push(key)
        this.totalSize -= entry.size
        cleared++
      }
    }

    toDelete.forEach(key => this.cache.delete(key))
    return cleared
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.totalSize = 0
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      // Check expiration
      if (now > entry.expires) {
        toDelete.push(key)
        this.totalSize -= entry.size
        cleaned++
        continue
      }

      // Check retention policy
      const age = now - entry.timestamp
      if (age > this.config.retentionPolicy.maxAge) {
        toDelete.push(key)
        this.totalSize -= entry.size
        cleaned++
      }
    }

    toDelete.forEach(key => this.cache.delete(key))
    return cleaned
  }

  /**
   * Get conditional request headers for a URL
   */
  getConditionalHeaders(url: string): Record<string, string> {
    const entry = this.cache.get(this.generateKey(url))
    const headers: Record<string, string> = {}

    if (entry) {
      if (entry.etag) {
        headers['If-None-Match'] = entry.etag
      }
      if (entry.lastModified) {
        headers['If-Modified-Since'] = entry.lastModified
      }
    }

    return headers
  }

  /**
   * Generate cache key for URL
   */
  private generateKey(url: string): string {
    // Normalize URL and create hash
    const normalized = new URL(url).toString()
    return Buffer.from(normalized).toString('base64')
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      return JSON.stringify(data).length * 2 // Rough estimate
    }
  }

  /**
   * Check if we can add a new entry
   */
  private canAddEntry(domain: string, size: number): boolean {
    // Check global limits
    if (this.cache.size >= this.config.maxEntries) {
      return false
    }
    
    if (this.totalSize + size > this.config.maxCacheSize) {
      return false
    }

    // Check domain limits
    const domainConfig = this.domainConfigs.get(domain)
    if (domainConfig) {
      const domainStats = this.getDomainStats(domain)
      if (domainStats.entries >= domainConfig.maxEntries) {
        return false
      }
      if (domainStats.size + size > this.config.retentionPolicy.maxSizePerDomain) {
        return false
      }
    }

    return true
  }

  /**
   * Make space in cache
   */
  private makeSpace(domain: string, neededSize: number): void {
    // First, cleanup expired entries
    this.cleanup()

    // If still not enough space, remove oldest entries from the same domain
    if (!this.canAddEntry(domain, neededSize)) {
      const domainEntries = Array.from(this.cache.entries())
        .filter(([_, entry]) => entry.domain === domain)
        .sort(([_, a], [__, b]) => a.timestamp - b.timestamp)

      let freedSpace = 0
      for (const [key, entry] of domainEntries) {
        this.cache.delete(key)
        this.totalSize -= entry.size
        freedSpace += entry.size
        
        if (freedSpace >= neededSize) {
          break
        }
      }
    }
  }

  /**
   * Get statistics for a specific domain
   */
  private getDomainStats(domain: string): { entries: number; size: number } {
    let entries = 0
    let size = 0

    for (const entry of this.cache.values()) {
      if (entry.domain === domain) {
        entries++
        size += entry.size
      }
    }

    return { entries, size }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.config.retentionPolicy.autoCleanup) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup()
      }, this.config.cleanupInterval)
    }
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
  }

  /**
   * Export cache data for compliance/audit purposes
   */
  exportData(domain?: string): Array<{
    url: string
    domain: string
    timestamp: number
    expires: number
    size: number
  }> {
    const exports: Array<{
      url: string
      domain: string
      timestamp: number
      expires: number
      size: number
    }> = []

    for (const entry of this.cache.values()) {
      if (!domain || entry.domain === domain) {
        exports.push({
          url: entry.url,
          domain: entry.domain,
          timestamp: entry.timestamp,
          expires: entry.expires,
          size: entry.size
        })
      }
    }

    return exports
  }

  /**
   * Purge data older than specified age for compliance
   */
  purgeOldData(maxAge: number): number {
    const cutoff = Date.now() - maxAge
    let purged = 0
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < cutoff) {
        toDelete.push(key)
        this.totalSize -= entry.size
        purged++
      }
    }

    toDelete.forEach(key => this.cache.delete(key))
    return purged
  }
}

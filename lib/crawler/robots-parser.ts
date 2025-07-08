/**
 * Ethical Robots.txt Parser
 * Parses and validates robots.txt files to ensure compliance with site crawling rules
 */

export interface RobotsRule {
  userAgent: string
  allow: string[]
  disallow: string[]
  crawlDelay?: number
  requestRate?: string
  visitTime?: string
}

export interface RobotsTxt {
  rules: RobotsRule[]
  sitemaps: string[]
  host?: string
  cleanParam?: string[]
}

export class RobotsParser {
  private cache = new Map<string, { data: RobotsTxt; expires: number }>()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Fetch and parse robots.txt for a given domain
   */
  async getRobotsTxt(domain: string): Promise<RobotsTxt> {
    const cacheKey = domain.toLowerCase()
    const cached = this.cache.get(cacheKey)
    
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    try {
      const robotsUrl = `https://${domain}/robots.txt`
      const response = await fetch(robotsUrl, {
        headers: {
          'User-Agent': 'CVKonnekt Job Crawler (+https://cvkonnekt.co.za/crawler-info)',
        },
        timeout: 10000,
      })

      if (!response.ok) {
        // If robots.txt doesn't exist, return permissive default
        return this.getDefaultRobotsTxt()
      }

      const content = await response.text()
      const parsed = this.parseRobotsTxt(content)
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: parsed,
        expires: Date.now() + this.CACHE_TTL
      })

      return parsed
    } catch (error) {
      console.warn(`Failed to fetch robots.txt for ${domain}:`, error)
      return this.getDefaultRobotsTxt()
    }
  }

  /**
   * Parse robots.txt content
   */
  private parseRobotsTxt(content: string): RobotsTxt {
    const lines = content.split('\n').map(line => line.trim())
    const rules: RobotsRule[] = []
    const sitemaps: string[] = []
    let host: string | undefined
    const cleanParam: string[] = []

    let currentRule: Partial<RobotsRule> | null = null

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue

      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      const lowerKey = key.toLowerCase().trim()

      switch (lowerKey) {
        case 'user-agent':
          // Save previous rule if exists
          if (currentRule && currentRule.userAgent) {
            rules.push(this.completeRule(currentRule))
          }
          // Start new rule
          currentRule = {
            userAgent: value.toLowerCase(),
            allow: [],
            disallow: []
          }
          break

        case 'allow':
          if (currentRule) {
            currentRule.allow = currentRule.allow || []
            currentRule.allow.push(value)
          }
          break

        case 'disallow':
          if (currentRule) {
            currentRule.disallow = currentRule.disallow || []
            currentRule.disallow.push(value)
          }
          break

        case 'crawl-delay':
          if (currentRule) {
            const delay = parseInt(value, 10)
            if (!isNaN(delay)) {
              currentRule.crawlDelay = delay
            }
          }
          break

        case 'request-rate':
          if (currentRule) {
            currentRule.requestRate = value
          }
          break

        case 'visit-time':
          if (currentRule) {
            currentRule.visitTime = value
          }
          break

        case 'sitemap':
          sitemaps.push(value)
          break

        case 'host':
          host = value
          break

        case 'clean-param':
          cleanParam.push(value)
          break
      }
    }

    // Add the last rule
    if (currentRule && currentRule.userAgent) {
      rules.push(this.completeRule(currentRule))
    }

    return {
      rules,
      sitemaps,
      host,
      cleanParam: cleanParam.length > 0 ? cleanParam : undefined
    }
  }

  /**
   * Complete a partial rule with defaults
   */
  private completeRule(partial: Partial<RobotsRule>): RobotsRule {
    return {
      userAgent: partial.userAgent || '*',
      allow: partial.allow || [],
      disallow: partial.disallow || [],
      crawlDelay: partial.crawlDelay,
      requestRate: partial.requestRate,
      visitTime: partial.visitTime
    }
  }

  /**
   * Get default permissive robots.txt when none exists
   */
  private getDefaultRobotsTxt(): RobotsTxt {
    return {
      rules: [{
        userAgent: '*',
        allow: ['/'],
        disallow: []
      }],
      sitemaps: []
    }
  }

  /**
   * Check if a URL is allowed to be crawled
   */
  isAllowed(robotsTxt: RobotsTxt, url: string, userAgent = 'cvkonnekt job crawler'): boolean {
    const urlPath = new URL(url).pathname
    const lowerUserAgent = userAgent.toLowerCase()

    // Find the most specific rule for our user agent
    let applicableRule: RobotsRule | null = null

    // First, look for exact user agent match
    for (const rule of robotsTxt.rules) {
      if (rule.userAgent === lowerUserAgent) {
        applicableRule = rule
        break
      }
    }

    // If no exact match, look for wildcard
    if (!applicableRule) {
      for (const rule of robotsTxt.rules) {
        if (rule.userAgent === '*') {
          applicableRule = rule
          break
        }
      }
    }

    // If no applicable rule found, allow by default
    if (!applicableRule) {
      return true
    }

    // Check disallow rules first (more restrictive)
    for (const disallowPath of applicableRule.disallow) {
      if (this.pathMatches(urlPath, disallowPath)) {
        // Check if there's a more specific allow rule
        for (const allowPath of applicableRule.allow) {
          if (this.pathMatches(urlPath, allowPath) && allowPath.length > disallowPath.length) {
            return true
          }
        }
        return false
      }
    }

    // If not explicitly disallowed, check allow rules
    if (applicableRule.allow.length > 0) {
      for (const allowPath of applicableRule.allow) {
        if (this.pathMatches(urlPath, allowPath)) {
          return true
        }
      }
      // If there are allow rules but none match, disallow
      return false
    }

    // Default to allow if no specific rules
    return true
  }

  /**
   * Get crawl delay for a domain
   */
  getCrawlDelay(robotsTxt: RobotsTxt, userAgent = 'cvkonnekt job crawler'): number {
    const lowerUserAgent = userAgent.toLowerCase()

    // Find applicable rule
    for (const rule of robotsTxt.rules) {
      if (rule.userAgent === lowerUserAgent || rule.userAgent === '*') {
        if (rule.crawlDelay !== undefined) {
          return rule.crawlDelay * 1000 // Convert to milliseconds
        }
      }
    }

    // Default to 10 seconds if not specified
    return 10000
  }

  /**
   * Check if a path matches a robots.txt pattern
   */
  private pathMatches(path: string, pattern: string): boolean {
    if (!pattern) return false
    
    // Handle empty pattern
    if (pattern === '/') return true
    
    // Convert robots.txt pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\$/g, '$')
    
    try {
      const regex = new RegExp(`^${regexPattern}`)
      return regex.test(path)
    } catch {
      // If regex is invalid, fall back to simple string matching
      return path.startsWith(pattern)
    }
  }

  /**
   * Clear cache for a specific domain
   */
  clearCache(domain?: string): void {
    if (domain) {
      this.cache.delete(domain.toLowerCase())
    } else {
      this.cache.clear()
    }
  }
}

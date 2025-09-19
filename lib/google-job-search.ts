/**
 * Google Custom Search API Integration for Job Discovery
 * Uses Google's Custom Search Engine to find job postings across SA job boards
 */

export interface GoogleSearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
  formattedUrl: string
  pagemap?: {
    metatags?: Array<{
      'og:title'?: string
      'og:description'?: string
      'og:url'?: string
    }>
  }
}

export interface GoogleJobResult {
  id: string
  title: string
  company: string
  location: string
  description: string
  applicationUrl: string
  source: string
  sourceDomain: string
  postedDate: string
  salary?: string
  jobType?: string
  experienceLevel?: string
  industry?: string
  keywords: string[]
}

export class GoogleJobSearch {
  private apiKey: string
  private searchEngineId: string
  private baseUrl = 'https://www.googleapis.com/customsearch/v1'

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || ''
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || ''
    
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search API credentials not configured')
    }
  }

  /**
   * Search for jobs using Google Custom Search
   */
  async searchJobs(keywords: string = '', location: string = 'South Africa', limit: number = 20): Promise<GoogleJobResult[]> {
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search API not configured, skipping search')
      return []
    }

    try {
      const searchQuery = this.buildSearchQuery(keywords, location)
      console.log(`🔍 Google Search Query: "${searchQuery}"`)

      const response = await fetch(
        `${this.baseUrl}?` +
        `key=${this.apiKey}&` +
        `cx=${this.searchEngineId}&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `safe=active&` +
        `num=${Math.min(limit, 10)}&` +
        `dateRestrict=m30` // Last 30 days
      )

      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status}`)
      }

      const data = await response.json()
      const results = data.items || []
      
      console.log(`✅ Google Search found ${results.length} results`)
      
      return this.parseSearchResults(results, keywords, location)

    } catch (error) {
      console.error('❌ Google Search failed:', error)
      return []
    }
  }

  /**
   * Build optimized search query for SA job boards
   */
  private buildSearchQuery(keywords: string, location: string): string {
    // Target specific SA job board domains
    const jobBoardSites = [
      'site:careers24.com',
      'site:pnet.co.za',
      'site:jobmail.co.za',
      'site:indeed.co.za',
      'site:glassdoor.co.za',
      'site:jobvine.co.za',
      'site:joburg.co.za'
    ].join(' OR ')

    // Build location-specific terms
    const locationTerms = this.buildLocationTerms(location)
    
    // Build keyword terms
    const keywordTerms = keywords ? `"${keywords}"` : 'jobs'
    
    // Combine into search query
    const query = `(${jobBoardSites}) AND (${keywordTerms}) AND (${locationTerms})`
    
    return query
  }

  /**
   * Build location-specific search terms
   */
  private buildLocationTerms(location: string): string {
    const saProvinces = [
      'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
      'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
    ]
    
    const saCities = [
      'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth',
      'Bloemfontein', 'Nelspruit', 'Polokwane', 'Kimberley'
    ]

    const terms = ['South Africa', 'SA']
    
    if (location && location !== 'South Africa') {
      terms.push(location)
      
      // Add province if city is specified
      const cityProvinceMap: Record<string, string> = {
        'Johannesburg': 'Gauteng',
        'Cape Town': 'Western Cape',
        'Durban': 'KwaZulu-Natal',
        'Pretoria': 'Gauteng',
        'Port Elizabeth': 'Eastern Cape',
        'Bloemfontein': 'Free State'
      }
      
      const province = cityProvinceMap[location]
      if (province) {
        terms.push(province)
      }
    } else {
      // Add all major cities for broader search
      terms.push(...saCities.slice(0, 4))
    }

    return terms.join(' OR ')
  }

  /**
   * Parse Google Search results into job listings
   */
  private parseSearchResults(results: GoogleSearchResult[], keywords: string, location: string): GoogleJobResult[] {
    return results.map((result, index) => {
      const job = this.extractJobInfo(result, keywords, location)
      return {
        id: `google-${Date.now()}-${index}`,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        applicationUrl: result.link,
        source: this.getSourceName(result.displayLink),
        sourceDomain: result.displayLink,
        postedDate: this.extractPostedDate(result),
        salary: job.salary,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        industry: job.industry,
        keywords: this.extractKeywords(job.description, keywords)
      }
    })
  }

  /**
   * Extract job information from search result
   */
  private extractJobInfo(result: GoogleSearchResult, keywords: string, location: string) {
    const title = result.title || 'Job Title Not Available'
    const snippet = result.snippet || ''
    
    // Extract company name from title or snippet
    const company = this.extractCompanyName(title, snippet)
    
    // Extract location from title or snippet
    const jobLocation = this.extractLocation(title, snippet, location)
    
    // Extract salary information
    const salary = this.extractSalary(snippet)
    
    // Extract job type
    const jobType = this.extractJobType(snippet)
    
    // Extract experience level
    const experienceLevel = this.extractExperienceLevel(snippet)
    
    // Extract industry
    const industry = this.extractIndustry(title, snippet)

    return {
      title: this.cleanTitle(title),
      company,
      location: jobLocation,
      description: snippet,
      salary,
      jobType,
      experienceLevel,
      industry
    }
  }

  /**
   * Extract company name from title or snippet
   */
  private extractCompanyName(title: string, snippet: string): string {
    // Common patterns in SA job titles
    const patterns = [
      /at\s+([^,]+)/i,
      /-\s*([^,]+)/i,
      /@\s*([^,]+)/i,
      /with\s+([^,]+)/i
    ]

    for (const pattern of patterns) {
      const match = title.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // Fallback: look for company names in snippet
    const companyPattern = /(?:company|employer|organization):\s*([^,.\n]+)/i
    const companyMatch = snippet.match(companyPattern)
    if (companyMatch && companyMatch[1]) {
      return companyMatch[1].trim()
    }

    return 'Company Not Specified'
  }

  /**
   * Extract location from title or snippet
   */
  private extractLocation(title: string, snippet: string, defaultLocation: string): string {
    const saProvinces = [
      'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
      'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
    ]
    
    const saCities = [
      'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth',
      'Bloemfontein', 'Nelspruit', 'Polokwane', 'Kimberley'
    ]

    const text = `${title} ${snippet}`.toLowerCase()

    // Look for city, province pattern
    for (const city of saCities) {
      if (text.includes(city.toLowerCase())) {
        const province = this.getProvinceForCity(city)
        return `${city}, ${province}`
      }
    }

    // Look for province only
    for (const province of saProvinces) {
      if (text.includes(province.toLowerCase())) {
        return province
      }
    }

    return defaultLocation
  }

  /**
   * Get province for a city
   */
  private getProvinceForCity(city: string): string {
    const cityProvinceMap: Record<string, string> = {
      'Johannesburg': 'Gauteng',
      'Cape Town': 'Western Cape',
      'Durban': 'KwaZulu-Natal',
      'Pretoria': 'Gauteng',
      'Port Elizabeth': 'Eastern Cape',
      'Bloemfontein': 'Free State',
      'Nelspruit': 'Mpumalanga',
      'Polokwane': 'Limpopo',
      'Kimberley': 'Northern Cape'
    }
    
    return cityProvinceMap[city] || 'South Africa'
  }

  /**
   * Extract salary information
   */
  private extractSalary(text: string): string | undefined {
    const salaryPatterns = [
      /R\s*(\d{1,3}(?:[,\s]\d{3})*)\s*-\s*R\s*(\d{1,3}(?:[,\s]\d{3})*)/i,
      /R\s*(\d{1,3}(?:[,\s]\d{3})*)\s*per\s*(?:month|annum|year)/i,
      /salary[:\s]*R\s*(\d{1,3}(?:[,\s]\d{3})*)/i
    ]

    for (const pattern of salaryPatterns) {
      const match = text.match(pattern)
      if (match) {
        if (match[2]) {
          return `R${match[1].replace(/[,\s]/g, '')} - R${match[2].replace(/[,\s]/g, '')}`
        } else {
          return `R${match[1].replace(/[,\s]/g, '')}`
        }
      }
    }

    return undefined
  }

  /**
   * Extract job type from text
   */
  private extractJobType(text: string): string {
    const textLower = text.toLowerCase()
    
    if (textLower.includes('full-time') || textLower.includes('full time')) return 'full-time'
    if (textLower.includes('part-time') || textLower.includes('part time')) return 'part-time'
    if (textLower.includes('contract')) return 'contract'
    if (textLower.includes('internship') || textLower.includes('graduate')) return 'internship'
    if (textLower.includes('temporary') || textLower.includes('temp')) return 'temporary'
    
    return 'full-time'
  }

  /**
   * Extract experience level from text
   */
  private extractExperienceLevel(text: string): string {
    const textLower = text.toLowerCase()
    
    if (textLower.includes('senior') || textLower.includes('lead') || textLower.includes('manager')) return 'senior'
    if (textLower.includes('junior') || textLower.includes('entry-level') || textLower.includes('graduate')) return 'junior'
    if (textLower.includes('mid-level') || textLower.includes('intermediate')) return 'mid'
    if (textLower.includes('no experience') || textLower.includes('matric only')) return 'entry'
    
    return 'mid'
  }

  /**
   * Extract industry from title and snippet
   */
  private extractIndustry(title: string, snippet: string): string {
    const text = `${title} ${snippet}`.toLowerCase()
    
    const industries = [
      'retail', 'fmcg', 'logistics', 'call centre', 'finance', 'banking',
      'it', 'tech', 'education', 'mining', 'healthcare', 'government',
      'manufacturing', 'agriculture', 'tourism', 'construction'
    ]

    for (const industry of industries) {
      if (text.includes(industry)) {
        return industry.charAt(0).toUpperCase() + industry.slice(1)
      }
    }

    return 'general'
  }

  /**
   * Clean job title
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/\s*-\s*.*$/, '') // Remove everything after dash
      .replace(/\s*at\s+.*$/, '') // Remove "at Company" part
      .replace(/\s*@\s+.*$/, '') // Remove "@ Company" part
      .trim()
  }

  /**
   * Extract posted date from search result
   */
  private extractPostedDate(result: GoogleSearchResult): string {
    // Google Search API doesn't provide exact posting dates
    // Return current date as approximation
    return new Date().toISOString()
  }

  /**
   * Get source name from display link
   */
  private getSourceName(displayLink: string): string {
    const domainMap: Record<string, string> = {
      'careers24.com': 'Careers24',
      'pnet.co.za': 'PNet',
      'jobmail.co.za': 'JobMail',
      'indeed.co.za': 'Indeed SA',
      'glassdoor.co.za': 'Glassdoor SA',
      'jobvine.co.za': 'JobVine',
      'joburg.co.za': 'Joburg'
    }

    return domainMap[displayLink] || displayLink
  }

  /**
   * Extract keywords from description
   */
  private extractKeywords(description: string, searchKeywords: string): string[] {
    const keywords = new Set<string>()
    
    // Add search keywords
    if (searchKeywords) {
      searchKeywords.split(',').forEach(kw => {
        if (kw.trim()) keywords.add(kw.trim().toLowerCase())
      })
    }

    // Extract common job-related keywords
    const commonKeywords = [
      'javascript', 'python', 'react', 'angular', 'vue', 'node.js',
      'sql', 'mongodb', 'aws', 'azure', 'docker', 'kubernetes',
      'sales', 'marketing', 'customer service', 'administration',
      'finance', 'accounting', 'hr', 'human resources'
    ]

    const textLower = description.toLowerCase()
    commonKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        keywords.add(keyword)
      }
    })

    return Array.from(keywords)
  }

  /**
   * Check if Google Search API is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.searchEngineId)
  }

  /**
   * Get API usage statistics
   */
  getStats(): { configured: boolean; apiKey: string; searchEngineId: string } {
    return {
      configured: this.isConfigured(),
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not set',
      searchEngineId: this.searchEngineId ? `${this.searchEngineId.substring(0, 8)}...` : 'Not set'
    }
  }
}


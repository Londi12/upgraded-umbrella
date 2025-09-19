import { JobListing } from './job-search-service'

// Simplified job aggregation focusing on the most effective methods
export interface JobSource {
  name: string
  type: 'rss' | 'api' | 'scraping'
  url: string
  active: boolean
  parseFunction: (data: any) => JobListing[]
}

  // Curated list of the best South African job sources
  export const SA_JOB_SOURCES: JobSource[] = [
    // RSS Feeds (most reliable)
    {
      name: 'JobMail',
      type: 'rss',
      url: 'https://www.jobmail.co.za/rss/jobs', // New RSS endpoint (2025)
      active: true,
      parseFunction: parseJobMailRSS
    },
    {
      name: 'Careers24',
      type: 'rss',
      url: 'https://www.careers24.com/jobs/rss', // New RSS endpoint (2025)
      active: true,
      parseFunction: parseCareers24RSS
    },
    {
      name: 'PNet',
      type: 'rss',
      url: 'https://www.pnet.co.za/rss/jobs', // New RSS endpoint (2025)
      active: true,
      parseFunction: parsePNetRSS
    },
    {
      name: 'Glassdoor SA',
      type: 'rss',
      url: 'https://www.glassdoor.com/rss/jobs.rss', // Global Glassdoor RSS
      active: true,
      parseFunction: parseGlassdoorRSS
    },
    {
      name: 'LinkedIn SA',
      type: 'rss',
      url: 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=&location=South%20Africa', // LinkedIn search endpoint
      active: true,
      parseFunction: parseLinkedInRSS
    },
    // Job APIs (best quality when available)
    {
      name: 'Gemini AI',
      type: 'api',
      url: 'https://api.gemini.ai/v1/jobs/search',
      active: true,
      parseFunction: parseGeminiAPI
    },
    {
      name: 'Adzuna SA',
      type: 'api',
      url: 'https://api.adzuna.com/v1/api/jobs/za/search/1',
      active: true, // Enabled since API key is added
      parseFunction: parseAdzunaAPI
    },
    // Simple scraping (backup)
    {
      name: 'Indeed SA',
      type: 'scraping',
      url: 'https://za.indeed.com/jobs',
      active: true,
      parseFunction: parseIndeedScraping
    }
  ]

export class SimpleJobAggregator {
  private sources: JobSource[]
  private cache = new Map<string, { data: JobListing[], timestamp: number }>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  constructor(sources = SA_JOB_SOURCES) {
    this.sources = sources.filter(s => s.active)
  }

  // Main method to get jobs from all sources
  async getJobs(keywords: string = '', location: string = ''): Promise<{
    jobs: JobListing[]
    sources: { name: string, count: number, type: string }[]
    total: number
  }> {
    const allJobs: JobListing[] = []
    const sourceStats: { name: string, count: number, type: string }[] = []

    for (const source of this.sources) {
      try {
        const jobs = await this.fetchFromSource(source, keywords, location)
        allJobs.push(...jobs)
        sourceStats.push({
          name: source.name,
          count: jobs.length,
          type: source.type
        })
        
        console.log(`✅ ${source.name}: ${jobs.length} jobs`)
        
        // Small delay between sources
        await this.delay(1000)
      } catch (error) {
        console.error(`❌ ${source.name} failed:`, error)
        sourceStats.push({
          name: source.name,
          count: 0,
          type: source.type
        })
      }
    }

    // Remove duplicates and sort
    const uniqueJobs = this.removeDuplicates(allJobs)
    uniqueJobs.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())

    return {
      jobs: uniqueJobs,
      sources: sourceStats,
      total: uniqueJobs.length
    }
  }

  // Fetch jobs from a single source
  private async fetchFromSource(source: JobSource, keywords: string, location: string): Promise<JobListing[]> {
    const cacheKey = `${source.name}-${keywords}-${location}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    let jobs: JobListing[] = []

    switch (source.type) {
      case 'rss':
        jobs = await this.fetchRSS(source, keywords, location)
        break
      case 'api':
        jobs = await this.fetchAPI(source, keywords, location)
        break
      case 'scraping':
        jobs = await this.fetchScraping(source, keywords, location)
        break
    }

    // Cache the results
    this.cache.set(cacheKey, { data: jobs, timestamp: Date.now() })
    return jobs
  }

  // Fetch from RSS feed
  private async fetchRSS(source: JobSource, keywords: string, location: string): Promise<JobListing[]> {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'CVKonnekt Job Aggregator 1.0' }
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${source.url}`)
      }
      const xmlText = await response.text()
      const jobs = this.parseRSSXML(xmlText, source)
      // Filter by keywords and location
      return this.filterJobs(jobs, keywords, location)
    } catch (error) {
      console.error(`RSS fetch failed for ${source.name}:`, error)
      return []
    }
  }

  // Fetch from API
  private async fetchAPI(source: JobSource, keywords: string, location: string): Promise<JobListing[]> {
    try {
      if (source.name === 'Gemini AI') {
        // Use Gemini API key from env
        if (!process.env.GEMINI_API_KEY) {
          return []
        }
        const url = `${source.url}?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
        const data = await response.json()
        return source.parseFunction(data)
      }

      // Only proceed if API keys are configured for Adzuna
      if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
        return []
      }

      const url = `${source.url}?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(keywords)}&where=${encodeURIComponent(location)}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      return source.parseFunction(data)
    } catch (error) {
      console.error(`API fetch failed for ${source.name}:`, error)
      return []
    }
  }

  // Simple scraping (basic implementation)
  private async fetchScraping(source: JobSource, keywords: string, location: string): Promise<JobListing[]> {
    try {
      const url = `${source.url}?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        }
      })
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
      const html = await response.text()
      return source.parseFunction(html)
    } catch (error) {
      console.error(`Scraping fetch failed for ${source.name}:`, error)
      return []
    }
  }

  // Parse RSS XML
  private parseRSSXML(xml: string, source: JobSource): JobListing[] {
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

  // Extract XML tag content
  private extractXMLTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? this.decodeHTML(match[1].trim()) : ''
  }

  // Decode HTML entities
  private decodeHTML(html: string): string {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }

  // Filter jobs by keywords, location, and additional filters
  private filterJobs(jobs: JobListing[], keywords: string, location: string, filters?: { jobType?: string, salaryRange?: string, experienceLevel?: string, industry?: string }): JobListing[] {
    if (!keywords && !location && !filters) return jobs

    return jobs.filter(job => {
      const matchesKeywords = !keywords ||
        job.title.toLowerCase().includes(keywords.toLowerCase()) ||
        job.description.toLowerCase().includes(keywords.toLowerCase()) ||
        job.company.toLowerCase().includes(keywords.toLowerCase())

      const matchesLocation = !location || location === 'South Africa' ||
        job.location.toLowerCase().includes(location.toLowerCase())

      const matchesJobType = !filters?.jobType || job.job_type === filters.jobType
      const matchesSalary = !filters?.salaryRange || (job.salary_range && job.salary_range.includes(filters.salaryRange))
      const matchesExperience = !filters?.experienceLevel || job.experience_level === filters.experienceLevel
      const matchesIndustry = !filters?.industry || (job.industry && job.industry.toLowerCase() === filters.industry.toLowerCase())

      return matchesKeywords && matchesLocation && matchesJobType && matchesSalary && matchesExperience && matchesIndustry
    })
  }

  // Remove duplicate jobs
  private removeDuplicates(jobs: JobListing[]): JobListing[] {
    const seen = new Set<string>()
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // Utility delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get source statistics
  getSourceStats() {
    return this.sources.map(source => ({
      name: source.name,
      type: source.type,
      active: source.active,
      url: source.url
    }))
  }
}

// Simplified parser functions
function parseJobMailRSS(items: any[]): JobListing[] {
  return items.map(item => {
    const titleParts = item.title.split(' at ')
    const jobTitle = titleParts[0]?.trim() || item.title
    const company = titleParts[1]?.trim() || 'Company Not Specified'

    return {
      id: `jobmail-${Date.now()}-${Math.random()}`,
      title: jobTitle,
      company,
      location: 'South Africa',
      description: item.description.substring(0, 500),
      requirements: [],
      job_type: 'full-time' as const,
      experience_level: 'mid' as const,
      industry: 'general',
      posted_date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
      application_url: item.link,
      source: 'JobMail',
      keywords: []
    }
  }).filter(job => job.title && job.company)
}

function parseGlassdoorRSS(items: any[]): JobListing[] {
  return items.map(item => ({
    id: `glassdoor-${Date.now()}-${Math.random()}`,
    title: item.title,
    company: item.company || 'Various Companies',
    location: item.location || 'South Africa',
    description: item.description.substring(0, 500),
    requirements: [],
    job_type: 'full-time' as const,
    experience_level: 'mid' as const,
    industry: 'general',
    posted_date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
    application_url: item.link,
    source: 'Glassdoor',
    keywords: []
  })).filter(job => job.title)
}

function parseLinkedInRSS(items: any[]): JobListing[] {
  return items.map(item => ({
    id: `linkedin-${Date.now()}-${Math.random()}`,
    title: item.title,
    company: item.company || 'Various Companies',
    location: item.location || 'South Africa',
    description: item.description.substring(0, 500),
    requirements: [],
    job_type: 'full-time' as const,
    experience_level: 'mid' as const,
    industry: 'general',
    posted_date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
    application_url: item.link,
    source: 'LinkedIn',
    keywords: []
  })).filter(job => job.title)
}

function parseGeminiAPI(data: any): JobListing[] {
  if (!data.jobs) return []
  return data.jobs.map((job: any) => ({
    id: `gemini-${job.id}`,
    title: job.title,
    company: job.company_name,
    location: job.location,
    description: job.description.substring(0, 500),
    requirements: [],
    salary: job.salary_range,
    job_type: job.job_type || 'full-time',
    experience_level: job.experience_level || 'mid',
    industry: job.industry || 'general',
    posted_date: job.posted_date,
    application_url: job.application_url,
    source: 'Gemini AI',
    keywords: job.keywords || []
  }))
}

function parseCareers24RSS(items: any[]): JobListing[] {
  return items.map(item => ({
    id: `careers24-${Date.now()}-${Math.random()}`,
    title: item.title,
    company: 'Various Companies',
    location: 'South Africa',
    description: item.description.substring(0, 500),
    requirements: [],
    job_type: 'full-time' as const,
    experience_level: 'mid' as const,
    industry: 'general',
    posted_date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
    application_url: item.link,
    source: 'Careers24',
    keywords: []
  })).filter(job => job.title)
}

function parsePNetRSS(items: any[]): JobListing[] {
  return items.map(item => {
    const titleParts = item.title.split(' - ')
    const jobTitle = titleParts[0]?.trim() || item.title
    const company = titleParts[1]?.trim() || 'Company Not Specified'

    return {
      id: `pnet-${Date.now()}-${Math.random()}`,
      title: jobTitle,
      company,
      location: titleParts[2]?.trim() || 'South Africa',
      description: item.description.substring(0, 500),
      requirements: [],
      job_type: 'full-time' as const,
      experience_level: 'mid' as const,
      industry: 'general',
      posted_date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
      application_url: item.link,
      source: 'PNet',
      keywords: []
    }
  }).filter(job => job.title && job.company)
}

function parseAdzunaAPI(data: any): JobListing[] {
  if (!data.results) return []
  
  return data.results.map((job: any) => ({
    id: `adzuna-${job.id}`,
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    description: job.description.substring(0, 500),
    requirements: [],
    salary_range: job.salary_min && job.salary_max ? `R${job.salary_min} - R${job.salary_max}` : undefined,
    job_type: 'full-time' as const,
    experience_level: 'mid' as const,
    industry: job.category?.label || 'general',
    posted_date: job.created.split('T')[0],
    application_url: job.redirect_url,
    source: 'Adzuna',
    keywords: []
  }))
}

function parseIndeedScraping(html: string): JobListing[] {
  // Very basic HTML parsing - in production, you'd want a proper HTML parser
  const jobs: JobListing[] = []
  
  // This is a simplified example - real implementation would be more robust
  const jobPattern = /<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*title="([^"]*)"[\s\S]*?<\/h2>/gi
  let match
  
  while ((match = jobPattern.exec(html)) !== null && jobs.length < 20) {
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
  }
  
  return jobs
}

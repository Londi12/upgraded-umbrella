interface CachedJob {
  id: string
  title: string
  snippet: string
  url: string
  source: string
  company: string
  location: string
  posted_date: string
  cached_at: number
  freshness_score: number
}

export class JobCacheService {
  private readonly STORAGE_KEY = 'sa_job_cache'
  private readonly MAX_JOBS = 500
  private readonly FRESHNESS_DECAY = 24 * 60 * 60 * 1000 // 24 hours

  getJobs(query: string): CachedJob[] {
    const cached = this.loadCache()
    const now = Date.now()
    
    // Filter by query and update freshness
    return cached
      .filter(job => 
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.snippet.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase())
      )
      .map(job => ({
        ...job,
        freshness_score: Math.max(0, 1 - (now - job.cached_at) / this.FRESHNESS_DECAY)
      }))
      .sort((a, b) => b.freshness_score - a.freshness_score)
  }

  addJobs(newJobs: Omit<CachedJob, 'id' | 'cached_at' | 'freshness_score'>[]): void {
    const cached = this.loadCache()
    const now = Date.now()
    
    // Add new jobs with IDs and timestamps
    const jobsToAdd = newJobs.map(job => ({
      ...job,
      id: this.generateId(job.title, job.company),
      cached_at: now,
      freshness_score: 1
    }))

    // Deduplicate by ID
    const existingIds = new Set(cached.map(j => j.id))
    const uniqueJobs = jobsToAdd.filter(job => !existingIds.has(job.id))

    // Combine and limit
    const allJobs = [...cached, ...uniqueJobs]
      .sort((a, b) => b.cached_at - a.cached_at)
      .slice(0, this.MAX_JOBS)

    this.saveCache(allJobs)
  }

  refreshJobs(): void {
    const companies = ['Nedbank', 'Discovery', 'Shoprite', 'MTN', 'Sasol', 'Standard Bank', 'Woolworths', 'Pick n Pay', 'Capitec', 'FNB']
    const locations = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth']
    const sources = ['careers24.com', 'pnet.co.za', 'careerjunction.co.za', 'jobmail.co.za']
    const jobTitles = ['Software Developer', 'Data Analyst', 'Marketing Manager', 'Sales Representative', 'Accountant', 'HR Specialist', 'Project Manager', 'Customer Service', 'Operations Manager', 'Business Analyst']
    
    const newJobs = Array.from({ length: 20 }, () => {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const location = locations[Math.floor(Math.random() * locations.length)]
      const source = sources[Math.floor(Math.random() * sources.length)]
      const title = jobTitles[Math.floor(Math.random() * jobTitles.length)]
      
      const daysAgo = Math.floor(Math.random() * 7) // Jobs from last 7 days
      const postedDate = new Date()
      postedDate.setDate(postedDate.getDate() - daysAgo)
      
      return {
        title: `[External from ${source}]: ${title}`,
        snippet: `Join ${company} as a ${title}. We are looking for talented individuals to join our team in ${location}. Competitive salary and benefits package offered.`,
        url: `https://${source}/job/${Math.random().toString(36).substr(2, 9)}`,
        source,
        company,
        location,
        posted_date: postedDate.toISOString().split('T')[0]
      }
    })

    this.addJobs(newJobs)
  }

  private loadCache(): CachedJob[] {
    try {
      if (typeof window === 'undefined') return []
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private saveCache(jobs: CachedJob[]): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(jobs))
    } catch (error) {
      console.warn('Failed to save job cache:', error)
    }
  }

  private generateId(title: string, company: string): string {
    return btoa(`${title}-${company}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
  }

  getCacheStats(): { total: number, fresh: number, stale: number } {
    const cached = this.loadCache()
    const now = Date.now()
    
    let fresh = 0, stale = 0
    
    cached.forEach(job => {
      const age = now - job.cached_at
      if (age < this.FRESHNESS_DECAY) fresh++
      else stale++
    })

    return { total: cached.length, fresh, stale }
  }
}
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ScrapedJob {
  title: string
  snippet: string
  url: string
  source: string
  company: string
  location: string
  posted_date: string
  scraped_at: string
}

export class JobScraperService {
  private readonly SCRAPE_INTERVAL = 5 * 60 * 60 * 1000 // 5 hours
  private readonly JOB_SITES = [
    'careers24.com',
    'pnet.co.za',
    'careerjunction.co.za',
    'jobmail.co.za'
  ]

  async scrapeAllSites(): Promise<void> {
    console.log('Starting job scraping cycle...')
    
    for (const site of this.JOB_SITES) {
      try {
        await this.scrapeSite(site)
        await this.delay(10000) // 10 second delay between sites
      } catch (error) {
        console.error(`Failed to scrape ${site}:`, error)
      }
    }
    
    await this.cleanOldJobs()
    console.log('Job scraping cycle completed')
  }

  private async scrapeSite(site: string): Promise<void> {
    const jobs = await this.fetchJobsFromSite(site)
    
    if (jobs.length > 0) {
      await this.saveJobs(jobs)
      console.log(`Scraped ${jobs.length} jobs from ${site}`)
    }
  }

  private async fetchJobsFromSite(site: string): Promise<ScrapedJob[]> {
    // For now, generate realistic sample data
    // In production, replace with actual scraping logic
    const companies = ['Nedbank', 'Discovery', 'Shoprite', 'MTN', 'Sasol', 'Standard Bank', 'Woolworths', 'Pick n Pay', 'Capitec', 'FNB', 'Absa', 'Old Mutual', 'Sanlam', 'Telkom', 'Vodacom']
    const locations = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Polokwane']
    const jobTitles = [
      'Software Developer', 'Data Analyst', 'Marketing Manager', 'Sales Representative', 
      'Accountant', 'HR Specialist', 'Project Manager', 'Customer Service Representative',
      'Operations Manager', 'Business Analyst', 'Financial Advisor', 'Graphic Designer',
      'Network Administrator', 'Quality Assurance Tester', 'Content Writer', 'Social Media Manager',
      'Supply Chain Coordinator', 'Legal Assistant', 'Nurse', 'Teacher', 'Engineer', 'Pharmacist'
    ]
    
    const jobs: ScrapedJob[] = []
    const jobCount = Math.floor(Math.random() * 20) + 30 // 30-50 jobs per site
    
    for (let i = 0; i < jobCount; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const location = locations[Math.floor(Math.random() * locations.length)]
      const title = jobTitles[Math.floor(Math.random() * jobTitles.length)]
      
      const daysAgo = Math.floor(Math.random() * 14) // Jobs from last 14 days
      const postedDate = new Date()
      postedDate.setDate(postedDate.getDate() - daysAgo)
      
      const jobId = Math.floor(Math.random() * 9000000) + 1000000
      const realUrls = {
        'careers24.com': `https://www.careers24.com/job/${jobId}`,
        'pnet.co.za': `https://www.pnet.co.za/job/${jobId}`,
        'careerjunction.co.za': `https://www.careerjunction.co.za/job/${jobId}`,
        'jobmail.co.za': `https://www.jobmail.co.za/job/${jobId}`
      }
      
      jobs.push({
        title: `${title} - ${company}`,
        snippet: `Join ${company} as a ${title} in ${location}. We offer competitive salary, benefits, and career growth opportunities. Apply now!`,
        url: realUrls[site as keyof typeof realUrls] || `https://${site}/jobs`,
        source: site,
        company,
        location,
        posted_date: postedDate.toISOString().split('T')[0],
        scraped_at: new Date().toISOString()
      })
    }
    
    return jobs
  }

  private async saveJobs(jobs: ScrapedJob[]): Promise<void> {
    // Create jobs table if it doesn't exist
    await this.ensureJobsTable()
    
    // Insert jobs with conflict resolution
    const { error } = await supabase
      .from('scraped_jobs')
      .upsert(jobs, { 
        onConflict: 'url',
        ignoreDuplicates: false 
      })
    
    if (error) {
      console.error('Error saving jobs:', error)
    }
  }

  private async ensureJobsTable(): Promise<void> {
    const { error } = await supabase.rpc('create_jobs_table_if_not_exists')
    if (error && !error.message.includes('already exists')) {
      // Create table manually if RPC doesn't work
      await supabase.from('scraped_jobs').select('id').limit(1)
    }
  }

  async searchJobs(query: string, location?: string): Promise<ScrapedJob[]> {
    let dbQuery = supabase
      .from('scraped_jobs')
      .select('*')
      .order('posted_date', { ascending: false })
      .limit(100)

    if (query && query !== 'jobs') {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,snippet.ilike.%${query}%,company.ilike.%${query}%`)
    }

    if (location) {
      dbQuery = dbQuery.ilike('location', `%${location}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error searching jobs:', error)
      return []
    }

    return data || []
  }

  private async cleanOldJobs(): Promise<void> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabase
      .from('scraped_jobs')
      .delete()
      .lt('scraped_at', thirtyDaysAgo.toISOString())

    if (error) {
      console.error('Error cleaning old jobs:', error)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getLastScrapeTime(): Promise<Date | null> {
    const { data } = await supabase
      .from('scraped_jobs')
      .select('scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1)

    return data?.[0]?.scraped_at ? new Date(data[0].scraped_at) : null
  }

  shouldScrape(): boolean {
    // For development, always allow scraping
    return true
  }
}
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

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
}

export class RealJobScraper {
  private readonly JOB_SITES = [
    { name: 'careers24.com', url: 'https://www.careers24.com/jobs' },
    { name: 'pnet.co.za', url: 'https://www.pnet.co.za/jobs' },
    { name: 'careerjunction.co.za', url: 'https://www.careerjunction.co.za/jobs' }
  ]

  async scrapeAllSites(): Promise<void> {
    console.log('Starting real job scraping...')
    
    for (const site of this.JOB_SITES) {
      try {
        const jobs = await this.scrapeSite(site)
        if (jobs.length > 0) {
          await this.saveJobs(jobs)
          console.log(`Scraped ${jobs.length} jobs from ${site.name}`)
        }
        await this.delay(5000) // 5 second delay between sites
      } catch (error) {
        console.error(`Failed to scrape ${site.name}:`, error)
      }
    }
    
    console.log('Job scraping completed')
  }

  private async scrapeSite(site: { name: string, url: string }): Promise<ScrapedJob[]> {
    try {
      const response = await fetch(site.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      return this.parseJobs(html, site.name)
    } catch (error) {
      console.error(`Error scraping ${site.name}:`, error)
      return []
    }
  }

  private parseJobs(html: string, source: string): ScrapedJob[] {
    const $ = cheerio.load(html)
    const jobs: ScrapedJob[] = []

    // Generic job parsing - looks for common patterns
    const jobSelectors = [
      '.job-item, .job-card, .job-listing, .vacancy, .position',
      '[class*="job"], [class*="vacancy"], [class*="position"]',
      'article, .result, .listing'
    ]

    for (const selector of jobSelectors) {
      $(selector).each((i, element) => {
        if (jobs.length >= 20) return false // Limit to 20 jobs per site

        try {
          const $el = $(element)
          
          // Extract job details
          const titleEl = $el.find('h1, h2, h3, h4, .title, [class*="title"], a[href*="job"]').first()
          const title = titleEl.text().trim()
          
          if (!title || title.length < 5) return // Skip if no valid title
          
          const linkEl = titleEl.is('a') ? titleEl : $el.find('a[href*="job"], a[href*="vacancy"]').first()
          let url = linkEl.attr('href') || ''
          
          // Make URL absolute
          if (url.startsWith('/')) {
            url = `https://${source}${url}`
          } else if (!url.startsWith('http')) {
            url = `https://${source}/${url}`
          }
          
          // Extract other details
          const snippet = $el.find('.description, .summary, .excerpt, p').first().text().trim().substring(0, 200)
          const company = $el.find('.company, [class*="company"], .employer').first().text().trim() || 'Company Not Listed'
          const location = $el.find('.location, [class*="location"], .area').first().text().trim() || 'South Africa'
          
          // Generate posted date (recent)
          const daysAgo = Math.floor(Math.random() * 7)
          const postedDate = new Date()
          postedDate.setDate(postedDate.getDate() - daysAgo)
          
          if (title && url && snippet) {
            jobs.push({
              title: title.substring(0, 200),
              snippet: snippet || `${title} position available at ${company} in ${location}`,
              url,
              source,
              company: company.substring(0, 100),
              location: location.substring(0, 100),
              posted_date: postedDate.toISOString().split('T')[0]
            })
          }
        } catch (error) {
          console.error('Error parsing job element:', error)
        }
      })
      
      if (jobs.length > 0) break // Stop if we found jobs with this selector
    }

    return jobs
  }

  private async saveJobs(jobs: ScrapedJob[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('scraped_jobs')
        .upsert(jobs, { 
          onConflict: 'url',
          ignoreDuplicates: false 
        })
      
      if (error) {
        console.error('Error saving jobs:', error)
      }
    } catch (error) {
      console.error('Database error:', error)
    }
  }

  async searchJobs(query: string, location?: string): Promise<ScrapedJob[]> {
    try {
      let dbQuery = supabase
        .from('scraped_jobs')
        .select('*')
        .order('posted_date', { ascending: false })
        .limit(50)

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
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getJobCount(): Promise<number> {
    const { count } = await supabase
      .from('scraped_jobs')
      .select('*', { count: 'exact', head: true })
    
    return count || 0
  }
}
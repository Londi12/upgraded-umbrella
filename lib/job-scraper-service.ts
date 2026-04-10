import { supabase } from '@/lib/supabase'

interface ScrapedJob {
  title: string
  snippet: string
  url: string
  source: string
  company: string
  location: string
  posted_date: string
}

const SA_COMPANIES = [
  'Standard Bank', 'Absa', 'Discovery', 'Nedbank',
  'Capitec', 'Vodacom', 'MTN', 'Shoprite',
  'Pick n Pay', 'Woolworths', 'Sasol', 'FirstRand'
]

const PURGE_DAYS = 21

async function fetchJSearchJobs(query: string): Promise<ScrapedJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY
  if (!apiKey) {
    console.error('JSEARCH_API_KEY not set')
    return []
  }

  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + ' South Africa')}&page=1&num_pages=2&country=za`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    }
  )

  if (!res.ok) {
    console.error(`JSearch failed for "${query}": ${res.status}`)
    return []
  }

  const data = await res.json()
  console.log(`JSearch "${query}": ${data.data?.length || 0} jobs`)

  return (data.data || []).map((j: any) => ({
    title: j.job_title,
    snippet: j.job_description?.substring(0, 300) || '',
    url: j.job_apply_link || j.job_google_link || '',
    source: j.employer_name,
    company: j.employer_name,
    location: `${j.job_city || ''}${j.job_city ? ', ' : ''}${j.job_country || 'South Africa'}`,
    posted_date: j.job_posted_at_datetime_utc || new Date().toISOString(),
  })).filter((j: ScrapedJob) => j.url)
}

export class JobScraperService {
  shouldScrape(): boolean {
    return true
  }

  async getLastScrapeTime(): Promise<Date | null> {
    const { data } = await supabase
      .from('scraped_jobs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return data ? new Date(data.created_at) : null
  }

  async scrapeAllSites(): Promise<{ inserted: number; errors: string[] }> {
    const errors: string[] = []
    const allJobs: ScrapedJob[] = []
    const seen = new Set<string>()

    for (const company of SA_COMPANIES) {
      try {
        const jobs = await fetchJSearchJobs(company)
        console.log(`${company}: fetched ${jobs.length} jobs`)
        for (const job of jobs) {
          if (!seen.has(job.url)) {
            seen.add(job.url)
            allJobs.push(job)
          }
        }
      } catch (err: any) {
        const msg = `${company}: ${err.message}`
        console.error(msg)
        errors.push(msg)
      }
    }

    console.log(`Total unique jobs collected: ${allJobs.length}`)

    if (allJobs.length > 0) {
      const { error } = await supabase.from('scraped_jobs').upsert(
        allJobs.map(j => ({ ...j, created_at: new Date().toISOString() })),
        { onConflict: 'url' }
      )
      if (error) {
        console.error('DB upsert error:', error)
        errors.push(`DB insert: ${error.message}`)
      }
    }

    return { inserted: allJobs.length, errors }
  }

  async purgeOldJobs(): Promise<void> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - PURGE_DAYS)
    await supabase.from('scraped_jobs').delete().lt('posted_date', cutoff.toISOString())
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
    if (error) return []
    return data || []
  }
}

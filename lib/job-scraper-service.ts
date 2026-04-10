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

const SOURCES = [
  // Workday companies — JSON API
  {
    company: 'Standard Bank',
    url: 'https://standardbank.wd3.myworkdayjobs.com/wday/cxs/standardbank/StandardBankGroup/jobs',
    type: 'workday',
  },
  {
    company: 'Absa',
    url: 'https://absa.wd3.myworkdayjobs.com/wday/cxs/absa/ABSAExternalCareers/jobs',
    type: 'workday',
  },
  {
    company: 'Discovery',
    url: 'https://discovery.wd3.myworkdayjobs.com/wday/cxs/discovery/DiscoveryExternalCareers/jobs',
    type: 'workday',
  },
  {
    company: 'Vodacom',
    url: 'https://api.smartrecruiters.com/v1/companies/Vodacom/postings?limit=50',
    type: 'smartrecruiters',
  },
  {
    company: 'Capitec',
    url: 'https://boards-api.greenhouse.io/v1/boards/capitec/jobs?content=true',
    type: 'greenhouse',
  },
  {
    company: 'Shoprite',
    url: 'https://careers.shoprite.co.za/api/jobs?limit=50',
    type: 'pageup',
    fallbackUrl: 'https://careers.shoprite.co.za',
  },
  {
    company: 'Pick n Pay',
    url: 'https://careers.pnp.co.za/api/jobs?limit=50',
    type: 'pageup',
    fallbackUrl: 'https://careers.pnp.co.za',
  },
  {
    company: 'Woolworths',
    url: 'https://careers.woolworths.co.za/api/jobs?limit=50',
    type: 'pageup',
    fallbackUrl: 'https://careers.woolworths.co.za',
  },
]

const PURGE_DAYS = 21

async function fetchWorkday(source: typeof SOURCES[0]): Promise<ScrapedJob[]> {
  const res = await fetch(source.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit: 50, offset: 0, searchText: '', locations: [], appliedFacets: {} }),
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.jobPostings || []).map((j: any) => ({
    title: j.title,
    snippet: j.locationsText || '',
    url: `https://${new URL(source.url).hostname}${j.externalPath}`,
    source: source.company,
    company: source.company,
    location: j.locationsText || 'South Africa',
    posted_date: j.postedOn || new Date().toISOString(),
  }))
}

async function fetchGreenhouse(source: typeof SOURCES[0]): Promise<ScrapedJob[]> {
  const res = await fetch(source.url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.jobs || []).map((j: any) => ({
    title: j.title,
    snippet: j.departments?.[0]?.name || '',
    url: j.absolute_url,
    source: source.company,
    company: source.company,
    location: j.location?.name || 'South Africa',
    posted_date: j.updated_at || new Date().toISOString(),
  }))
}

async function fetchSmartRecruiters(source: typeof SOURCES[0]): Promise<ScrapedJob[]> {
  const res = await fetch(source.url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.content || []).map((j: any) => ({
    title: j.name,
    snippet: j.department?.label || '',
    url: `https://jobs.smartrecruiters.com/${source.company.replace(/\s/g, '')}/${j.id}`,
    source: source.company,
    company: source.company,
    location: j.location?.city || 'South Africa',
    posted_date: j.releasedDate || new Date().toISOString(),
  }))
}

async function fetchPageUp(source: typeof SOURCES[0]): Promise<ScrapedJob[]> {
  try {
    const res = await fetch(source.url)
    if (!res.ok) return []
    const data = await res.json()
    const jobs = data.jobs || data.data || data.results || []
    return jobs.map((j: any) => ({
      title: j.title || j.job_title || '',
      snippet: j.category || j.department || '',
      url: j.apply_url || j.url || source.fallbackUrl || '',
      source: source.company,
      company: source.company,
      location: j.location || 'South Africa',
      posted_date: j.date_posted || j.created_at || new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

export class JobScraperService {
  shouldScrape(): boolean {
    return true // controlled by cron
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

    for (const source of SOURCES) {
      try {
        let jobs: ScrapedJob[] = []
        if (source.type === 'workday') jobs = await fetchWorkday(source)
        else if (source.type === 'greenhouse') jobs = await fetchGreenhouse(source)
        else if (source.type === 'smartrecruiters') jobs = await fetchSmartRecruiters(source)
        else if (source.type === 'pageup') jobs = await fetchPageUp(source)
        allJobs.push(...jobs)
      } catch (err: any) {
        errors.push(`${source.company}: ${err.message}`)
      }
    }

    if (allJobs.length > 0) {
      const { error } = await supabase.from('scraped_jobs').upsert(
        allJobs.map(j => ({ ...j, created_at: new Date().toISOString() })),
        { onConflict: 'url' }
      )
      if (error) errors.push(`DB insert: ${error.message}`)
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

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

const SA_CITIES = [
  'johannesburg', 'cape town', 'durban', 'pretoria', 'sandton', 'midrand',
  'port elizabeth', 'gqeberha', 'bloemfontein', 'east london', 'polokwane',
  'nelspruit', 'mbombela', 'kimberley', 'rustenburg', 'george', 'pietermaritzburg',
  'centurion', 'soweto', 'benoni', 'boksburg', 'randburg', 'roodepoort',
  'germiston', 'springs', 'krugersdorp', 'vanderbijlpark', 'vereeniging',
  'witbank', 'emalahleni', 'klerksdorp', 'potchefstroom', 'upington',
  'stellenbosch', 'paarl', 'worcester', 'bellville', 'mitchells plain'
]

const SA_PROVINCES = [
  'gauteng', 'western cape', 'kwazulu-natal', 'eastern cape', 'limpopo',
  'mpumalanga', 'north west', 'northern cape', 'free state'
]

const PURGE_DAYS = 21

function isSALocation(city: string, state: string, country: string): boolean {
  const all = [city, state, country].map(s => s?.toLowerCase() || '')
  if (all.some(s => s.includes('south africa') || s === 'za')) return true
  if (all.some(s => SA_PROVINCES.some(p => s.includes(p)))) return true
  if (all.some(s => SA_CITIES.some(c => s.includes(c)))) return true
  return false
}

function formatLocation(city: string, state: string): string {
  const parts = [city, state].filter(Boolean)
  return parts.length ? `${parts.join(', ')}, South Africa` : 'South Africa'
}

async function fetchJSearchJobs(query: string): Promise<ScrapedJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY
  if (!apiKey) {
    console.error('JSEARCH_API_KEY not set')
    return []
  }

  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=2&country=za`,
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

  const mapped = (data.data || []).map((j: any) => ({
    title: j.job_title,
    snippet: j.job_description?.substring(0, 300) || '',
    url: j.job_apply_link || j.job_google_link || '',
    source: j.employer_name,
    company: j.employer_name,
    location: formatLocation(j.job_city || '', j.job_state || ''),
    posted_date: j.job_posted_at_datetime_utc || new Date().toISOString(),
    _city: j.job_city || '',
    _state: j.job_state || '',
    _country: j.job_country || '',
  }))

  return mapped
    .filter((j: any) => j.url && isSALocation(j._city, j._state, j._country))
    .map(({ _city, _state, _country, ...j }: any) => j as ScrapedJob)
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

    const queries = ['jobs South Africa', 'careers South Africa']

    for (const query of queries) {
      try {
        const jobs = await fetchJSearchJobs(query)
        console.log(`"${query}": fetched ${jobs.length} jobs`)
        for (const job of jobs) {
          if (!seen.has(job.url)) {
            seen.add(job.url)
            allJobs.push(job)
          }
        }
      } catch (err: any) {
        const msg = `Query "${query}": ${err.message}`
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

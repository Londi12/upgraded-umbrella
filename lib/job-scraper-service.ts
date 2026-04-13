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

function shouldRunLowQuotaProviders(now: Date = new Date()): boolean {
  // Free-tier friendly cadence: run on 1st, 8th, 15th, and 22nd UTC (~4 runs/month).
  const day = now.getUTCDate()
  return day === 1 || day === 8 || day === 15 || day === 22
}

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
  const apiKey = process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.error('JSEARCH_API_KEY/RAPIDAPI_KEY not set')
    return []
  }

  // num_pages=1 = 1 API request returning up to 10 results.
  // 6 queries/day × 1 request = 6 req/day = 186 req/month — within the 200/month free cap.
  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1&country=za`,
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

  // Trust country=za — no post-filter needed. Just drop jobs with no URL.
  return (data.data || [])
    .filter((j: any) => !!(j.job_apply_link || j.job_google_link))
    .map((j: any): ScrapedJob => ({
      title: j.job_title || 'Untitled',
      snippet: j.job_description?.substring(0, 1500) || '',
      url: j.job_apply_link || j.job_google_link,
      source: 'JSearch',
      company: j.employer_name || 'Unknown',
      location: [
        j.job_city,
        j.job_state,
        j.job_country || 'South Africa',
      ].filter(Boolean).join(', '),
      posted_date: j.job_posted_at_datetime_utc || new Date().toISOString(),
    }))
}

function isSouthAfricaText(value: string): boolean {
  const v = (value || '').toLowerCase()
  if (!v) return false
  if (v.includes('south africa') || v.includes('remote')) return true
  if (SA_PROVINCES.some((p) => v.includes(p))) return true
  if (SA_CITIES.some((c) => v.includes(c))) return true
  return false
}

function truncateSnippet(value: string, max = 1500): string {
  return (value || '').slice(0, max)
}

async function fetchActiveJobsDBJobs(): Promise<ScrapedJob[]> {
  const apiKey = process.env.ACTIVE_JOBS_DB_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.error('ACTIVE_JOBS_DB_RAPIDAPI_KEY/RAPIDAPI_KEY not set')
    return []
  }

  try {
    const params = new URLSearchParams({
      offset: '0',
      description_type: 'text',
      location_filter: '"South Africa"',
    })

    const res = await fetch(`https://active-jobs-db.p.rapidapi.com/active-ats-1h?${params.toString()}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com',
      },
    })

    if (!res.ok) {
      console.error(`ActiveJobsDB failed: ${res.status}`)
      return []
    }

    const data = await res.json()
    const rawJobs = data?.data || data?.jobs || data || []

    const mapped = (Array.isArray(rawJobs) ? rawJobs : []).map((j: any) => {
      const city = j.job_city || j.city || ''
      const state = j.job_state || j.state || ''
      const country = j.job_country || j.country || ''
      const location = j.job_location || j.location || formatLocation(city, state)

      return {
        title: j.job_title || j.title || 'Untitled',
        snippet: truncateSnippet(j.job_description || j.description || j.snippet || ''),
        url: j.job_url || j.job_apply_link || j.linkedin_job_url_cleaned || j.url || '',
        source: 'ActiveJobsDB',
        company: j.employer_name || j.company_name || j.company || 'Unknown',
        location,
        posted_date: j.job_posted_at_datetime_utc || j.posted_date || j.date || new Date().toISOString(),
        _city: city,
        _state: state,
        _country: country,
      }
    })

    return mapped
      .filter((j: any) => j.url)
      .filter((j: any) => isSALocation(j._city, j._state, j._country) || isSouthAfricaText(j.location))
      .map(({ _city, _state, _country, ...j }: any) => j as ScrapedJob)
  } catch (err) {
    console.error('Error fetching ActiveJobsDB jobs:', err)
    return []
  }
}

async function fetchIndeedJobs(query: string): Promise<ScrapedJob[]> {
  const apiKey = process.env.RAPIDAPI_INDEED_KEY || process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.error('RAPIDAPI_INDEED_KEY/RAPIDAPI_KEY not set')
    return []
  }

  try {
    const params = new URLSearchParams({
      query,
      location: 'South Africa',
      country_code: 'za',
      page_id: '1',
      from_age: '7',
    })

    const res = await fetch(`https://indeed12.p.rapidapi.com/jobs/search?${params.toString()}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'indeed12.p.rapidapi.com',
      },
    })

    if (!res.ok) {
      console.error(`Indeed failed for "${query}": ${res.status}`)
      return []
    }

    const data = await res.json()
    const rawJobs = data?.hits || data?.jobs || data?.data || []

    return (Array.isArray(rawJobs) ? rawJobs : [])
      .map((j: any) => ({
        title: j.title || j.job_title || 'Untitled',
        snippet: truncateSnippet(j.description || j.job_description || j.snippet || ''),
        url: j.link || j.job_url || j.url || '',
        source: 'Indeed',
        company: j.company?.name || j.employer_name || j.company_name || j.company || 'Unknown',
        location:
          j.location?.formatted ||
          [j.location?.city, j.location?.country].filter(Boolean).join(', ') ||
          j.job_location ||
          'South Africa',
        posted_date: j.date || j.job_posted_at_datetime_utc || j.posted_date || new Date().toISOString(),
      }))
      .filter((j: any) => j.url && isSouthAfricaText(j.location))
  } catch (err) {
    console.error('Error fetching Indeed jobs:', err)
    return []
  }
}

async function fetchLinkedInJobs(): Promise<ScrapedJob[]> {
  const apiKey = process.env.LINKEDIN_RAPIDAPI_KEY
  if (!apiKey) {
    console.error('LINKEDIN_RAPIDAPI_KEY not set')
    return []
  }

  try {
    const res = await fetch(
      'https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h?limit=100&offset=0&description_type=text',
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'linkedin-job-search-api.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
      }
    )

    if (!res.ok) {
      console.error(`LinkedIn job search failed: ${res.status}`)
      return []
    }

    const data = await res.json()
    console.log(`LinkedIn Job Search: ${data.data?.length || 0} jobs found`)

    // Defensive mapping against common field names
    const mapped = (data.data || []).map((j: any) => ({
      title: j.job_title || j.title || 'Untitled',
      snippet: (j.job_description || j.description || j.snippet || '').substring(0, 1500),
      url: j.job_url || j.linkedin_job_url_cleaned || j.url || '',
      source: j.employer_name || j.company_name || j.company || 'LinkedIn',
      company: j.employer_name || j.company_name || j.company || 'LinkedIn',
      location: j.job_location || j.location || 'South Africa',
      posted_date: j.job_posted_at_datetime_utc || j.posted_date || j.posted_time || new Date().toISOString(),
    }))

    return mapped
      .filter((j: any) => j.url)
      .map((j: any) => j as ScrapedJob)
  } catch (err) {
    console.error('Error fetching LinkedIn jobs:', err)
    return []
  }
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

    // 6 queries × ~30 results = up to 180 jobs from JSearch.
    // 6 calls/day × 31 days = 186 requests/month — within the 200/month free cap.
    const queries = [
      'jobs South Africa',
      'software developer engineer IT South Africa',
      'finance accountant auditor South Africa',
      'sales marketing manager South Africa',
      'nurse doctor healthcare South Africa',
      'driver admin clerk operations South Africa',
    ]

    console.log(`Starting multi-source scrape with ${queries.length} JSearch queries...`)

    const jsearchResults = await Promise.allSettled(
      queries.map(async (query) => {
        try {
          return await fetchJSearchJobs(query)
        } catch (err: any) {
          errors.push(`JSearch "${query}": ${err.message}`)
          return []
        }
      })
    )

    for (const result of jsearchResults) {
      if (result.status === 'fulfilled') {
        for (const job of result.value) {
          if (!seen.has(job.url)) {
            seen.add(job.url)
            allJobs.push(job)
          }
        }
      }
    }

    if (shouldRunLowQuotaProviders()) {
      console.log('Running low-quota providers (ActiveJobsDB, Indeed) this cycle')
      const providerRuns = await Promise.allSettled([
        fetchActiveJobsDBJobs(),
        fetchIndeedJobs('jobs South Africa'),
        fetchIndeedJobs('software engineer South Africa'),
      ])

      providerRuns.forEach((run, index) => {
        const label = index === 0 ? 'ActiveJobsDB' : 'Indeed'
        if (run.status === 'rejected') {
          errors.push(`${label}: ${run.reason?.message || 'Unknown error'}`)
          return
        }

        for (const job of run.value) {
          if (!seen.has(job.url)) {
            seen.add(job.url)
            allJobs.push(job)
          }
        }
      })
    } else {
      console.log('Skipping low-quota providers this cycle to preserve free-tier limits')
    }

    console.log(`Total unique jobs collected across all providers: ${allJobs.length}`)

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

  async scrapeLinkedInSites(): Promise<{ inserted: number; errors: string[] }> {
    const errors: string[] = []
    const allJobs: ScrapedJob[] = []
    const seen = new Set<string>()

    try {
      console.log(`Starting LinkedIn hourly scrape...`)
      const jobs = await fetchLinkedInJobs()
      console.log(`LinkedIn: fetched ${jobs.length} valid jobs`)
      
      for (const job of jobs) {
        if (!seen.has(job.url)) {
          seen.add(job.url)
          allJobs.push(job)
        }
      }
    } catch (err: any) {
      const msg = `LinkedIn Scrape error: ${err.message}`
      console.error(msg)
      errors.push(msg)
    }

    console.log(`Total unique LinkedIn jobs collected: ${allJobs.length}`)

    if (allJobs.length > 0) {
      const { error } = await supabase.from('scraped_jobs').upsert(
        allJobs.map(j => ({ ...j, created_at: new Date().toISOString() })),
        { onConflict: 'url' }
      )
      if (error) {
        console.error('DB upsert error (LinkedIn):', error)
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

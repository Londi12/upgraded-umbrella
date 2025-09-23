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

export class JobScraperService {
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
}

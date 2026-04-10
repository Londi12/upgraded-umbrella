import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface JobResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  posted_date: string;
  company?: string;
  location?: string;
  description?: string;
  qualifications?: string[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const location = searchParams.get('location')
  const jobType = searchParams.get('jobType')
  const experience = searchParams.get('experience')
  const datePosted = searchParams.get('datePosted')
  const sortBy = searchParams.get('sortBy') || 'newest'

  try {
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

    if (jobType) {
      const jobTypeKeywords: Record<string, string> = {
        'full-time': 'full-time',
        'part-time': 'part-time',
        'contract': 'contract',
        'learnership': 'learnership',
      }
      const kw = jobTypeKeywords[jobType]
      if (kw) dbQuery = dbQuery.or(`title.ilike.%${kw}%,snippet.ilike.%${kw}%`)
    }

    if (experience) {
      const expKeywords: Record<string, string[]> = {
        entry: ['junior', 'graduate', 'entry', 'learnership', 'no experience'],
        mid: ['intermediate', 'mid', '3 years', '4 years', '2-5'],
        senior: ['senior', 'lead', 'principal', 'head of', '5+'],
      }
      const keywords = expKeywords[experience] || []
      if (keywords.length > 0) {
        dbQuery = dbQuery.or(keywords.map(k => `title.ilike.%${k}%,snippet.ilike.%${k}%`).join(','))
      }
    }

    if (datePosted) {
      const daysAgo = parseInt(datePosted)
      if (!isNaN(daysAgo)) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - daysAgo)
        dbQuery = dbQuery.gte('posted_date', cutoff.toISOString())
      }
    }

    if (sortBy === 'newest') {
      dbQuery = dbQuery.order('posted_date', { ascending: false })
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({
        results: [],
        total: 0,
        sources_checked: [],
        compliance_report: {},
        error: "Server error"
      }, { status: 500 })
    }

    const results: JobResult[] = (data || []).map(job => ({
      title: job.title,
      snippet: job.snippet,
      url: job.url,
      source: job.source,
      posted_date: job.posted_date,
      company: job.company,
      location: job.location,
      description: job.description,
      qualifications: job.qualifications || []
    }))

    return NextResponse.json({
      results,
      total: results.length,
      sources_checked: [],
      compliance_report: {},
      error: null
    })

  } catch (error) {
    console.error('SA job search error:', error)
    return NextResponse.json({
      results: [],
      total: 0,
      sources_checked: [],
      compliance_report: {},
      error: "Server error"
    }, { status: 500 })
  }
}

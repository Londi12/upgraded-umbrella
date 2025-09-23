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

  if (!query) {
    return NextResponse.json({
      results: [],
      total: 0,
      sources_checked: [],
      compliance_report: {},
      error: "Missing query parameter"
    })
  }

  try {
    let dbQuery = supabase
      .from('scraped_jobs')
      .select('*, qualifications')
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

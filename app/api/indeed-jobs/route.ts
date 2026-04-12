import { NextRequest, NextResponse } from 'next/server'

interface IndeedJob {
  id: string
  title: string
  company: {
    name: string
  }
  location: {
    city?: string
    country?: string
    formatted?: string
  }
  salary?: {
    min?: number
    max?: number
    currency?: string
    type?: string
  }
  date: string
  description?: string
  link: string
  jobType?: string[]
}

interface JobResult {
  title: string
  snippet: string
  url: string
  source: string
  posted_date: string
  company?: string
  location?: string
  description?: string
  qualifications?: string[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'jobs'
  const location = searchParams.get('location') || 'South Africa'
  const country = searchParams.get('country') || 'za'
  const page = searchParams.get('page') || '1'
  const jobType = searchParams.get('jobType')
  const datePosted = searchParams.get('datePosted')

  const apiKey = process.env.RAPIDAPI_INDEED_KEY
  if (!apiKey) {
    return NextResponse.json(
      { results: [], total: 0, error: 'Indeed API key not configured' },
      { status: 500 }
    )
  }

  const params = new URLSearchParams({
    query,
    location,
    country_code: country,
    page_id: page,
  })

  if (jobType) {
    // Map internal job type to Indeed job type param
    const typeMap: Record<string, string> = {
      'full-time': 'fulltime',
      'part-time': 'parttime',
      'contract': 'contract',
      'internship': 'internship',
    }
    const mapped = typeMap[jobType]
    if (mapped) params.set('job_type', mapped)
  }

  if (datePosted) {
    const daysAgo = parseInt(datePosted)
    if (!isNaN(daysAgo)) {
      // Indeed supports: 1, 3, 7, 14 days
      let fromAge = 14
      if (daysAgo <= 1) fromAge = 1
      else if (daysAgo <= 3) fromAge = 3
      else if (daysAgo <= 7) fromAge = 7
      params.set('from_age', String(fromAge))
    }
  }

  try {
    const response = await fetch(
      `https://indeed12.p.rapidapi.com/jobs/search?${params.toString()}`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'indeed12.p.rapidapi.com',
        },
        // Ensure this fits within Vercel free plan 10s limit
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Indeed API error:', response.status, errorText)
      return NextResponse.json(
        { results: [], total: 0, error: `Indeed API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const jobs: IndeedJob[] = data?.hits ?? data?.jobs ?? []

    const results: JobResult[] = jobs.map((job) => ({
      title: job.title,
      snippet: job.description?.slice(0, 200) ?? '',
      url: job.link,
      source: 'Indeed',
      posted_date: job.date,
      company: job.company?.name,
      location:
        job.location?.formatted ??
        [job.location?.city, job.location?.country].filter(Boolean).join(', '),
      description: job.description ?? '',
      qualifications: [],
    }))

    return NextResponse.json({
      results,
      total: results.length,
      source: 'indeed',
      error: null,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { results: [], total: 0, error: 'Indeed API request timed out' },
        { status: 504 }
      )
    }
    console.error('Indeed jobs error:', error)
    return NextResponse.json(
      { results: [], total: 0, error: 'Server error' },
      { status: 500 }
    )
  }
}

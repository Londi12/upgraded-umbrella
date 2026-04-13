import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

function createRequestClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (bearerToken) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    })
    return { supabase, bearerToken }
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )
}

export async function POST(request: NextRequest) {
  // Require authenticated admin
  const requestClient = createRequestClient(request) as any
  const supabase = requestClient.supabase || requestClient
  const bearerToken = requestClient.bearerToken as string | undefined

  const { data: { user }, error: authError } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()
  if (!adminRecord) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    let jobs: any[] = []

    // Parse CSV format
    if (file.name.endsWith('.csv')) {
      const fileContent = await file.text()
      jobs = parseCSV(fileContent)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Parse Excel files using exceljs
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const bytes = new Uint8Array(await file.arrayBuffer())
      await workbook.xlsx.load(bytes as any)
      const worksheet = workbook.worksheets[0]
      const headers: string[] = []
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => { headers.push((cell.value?.toString() ?? '').trim().toLowerCase()) })
        } else {
          const job: any = {}
          row.eachCell((cell, colNumber) => {
            job[headers[colNumber - 1]] = cell.value?.toString()?.trim() ?? ''
          })
          jobs.push(job)
        }
      })
    } else {
      return NextResponse.json({ 
        error: 'Unsupported file format. Please upload CSV or Excel files.' 
      }, { status: 400 })
    }

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'No valid jobs found in file' }, { status: 400 })
    }

    // Validate required fields and collapse duplicate URLs within the uploaded file.
    const dedupedByUrl = new Map<string, any>()
    for (const job of jobs) {
      if (!(job.title && job.company && job.location && job.snippet && job.url && job.source)) {
        continue
      }
      const normalizedUrl = String(job.url).trim().toLowerCase()
      if (!normalizedUrl) continue
      dedupedByUrl.set(normalizedUrl, {
        title: String(job.title).trim(),
        company: String(job.company).trim(),
        location: String(job.location).trim(),
        snippet: String(job.snippet).trim(),
        url: String(job.url).trim(),
        source: String(job.source).trim(),
        posted_date: job.posted_date || new Date().toISOString().split('T')[0],
      })
    }

    const validJobs = Array.from(dedupedByUrl.values())

    if (validJobs.length === 0) {
      return NextResponse.json({ 
        error: 'No jobs with required fields (title, company, location, snippet, url, source)' 
      }, { status: 400 })
    }

    // Upsert jobs into database by URL so re-uploads update existing rows instead of failing.
    const { data, error } = await supabase
      .from('scraped_jobs')
      .upsert(validJobs, { onConflict: 'url' })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to save jobs to database: ' + error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      jobs: data || []
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to process file' 
    }, { status: 500 })
  }
}

function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const jobs: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue

    const job: any = {}
    headers.forEach((header, index) => {
      job[header] = values[index]?.trim() || ''
    })

    jobs.push(job)
  }

  return jobs
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}
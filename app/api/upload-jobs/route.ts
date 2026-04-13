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
    let rowsWithRequiredFields = 0
    for (const job of jobs) {
      if (!(job.title && job.company && job.location && job.snippet && job.url && job.source)) {
        continue
      }
      rowsWithRequiredFields += 1
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
  const skippedMissingRequired = jobs.length - rowsWithRequiredFields
  const duplicateRowsCollapsed = rowsWithRequiredFields - validJobs.length

    if (validJobs.length === 0) {
      return NextResponse.json({ 
        error: 'No jobs with required fields (title, company, location, snippet, url, source)' 
      }, { status: 400 })
    }

    const normalizedUploadUrls = validJobs
      .map((job) => String(job.url || '').trim().toLowerCase())
      .filter(Boolean)

    const existingUrlSet = new Set<string>()
    const chunkSize = 200
    for (let i = 0; i < normalizedUploadUrls.length; i += chunkSize) {
      const chunk = normalizedUploadUrls.slice(i, i + chunkSize)
      const { data: existingRows, error: existingError } = await supabase
        .from('scraped_jobs')
        .select('url')
        .in('url', chunk)

      if (existingError) {
        console.error('Error checking existing job URLs:', existingError)
      } else {
        for (const row of existingRows || []) {
          const url = String((row as any).url || '').trim().toLowerCase()
          if (url) existingUrlSet.add(url)
        }
      }
    }

    const insertedCount = validJobs.filter(
      (job) => !existingUrlSet.has(String(job.url || '').trim().toLowerCase())
    ).length
    const updatedCount = validJobs.length - insertedCount

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
      parsedRows: jobs.length,
      insertedCount,
      updatedCount,
      skippedMissingRequired,
      duplicateRowsCollapsed,
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
  const rows = parseCSVRows(content)
  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim().toLowerCase())
  const jobs: any[] = []

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i]
    if (values.length !== headers.length) continue

    const job: any = {}
    headers.forEach((header, index) => {
      job[header] = values[index]?.trim() || ''
    })
    jobs.push(job)
  }

  return jobs
}

function parseCSVRows(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"') {
      // Handle escaped double quote inside a quoted field.
      if (inQuotes && next === '"') {
        field += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++
      row.push(field)
      const hasContent = row.some((v) => v.trim() !== '')
      if (hasContent) rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    const hasContent = row.some((v) => v.trim() !== '')
    if (hasContent) rows.push(row)
  }

  return rows
}
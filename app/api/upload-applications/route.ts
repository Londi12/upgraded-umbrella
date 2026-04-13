import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

type ParsedRow = Record<string, string>

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

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function normalizeCell(value: unknown): string {
  return value?.toString()?.trim() || ''
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

function parseCSV(content: string): ParsedRow[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map((h) => normalizeHeader(h))
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue

    const row: ParsedRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })
    rows.push(row)
  }

  return rows
}

function parseDateOrToday(value: string): string {
  if (!value) return new Date().toISOString().split('T')[0]
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0]
  return parsed.toISOString().split('T')[0]
}

function parseStatus(value: string): 'applied' | 'viewed' | 'interview' | 'rejected' | 'offered' | 'hired' {
  const allowed = new Set(['applied', 'viewed', 'interview', 'rejected', 'offered', 'hired'])
  const normalized = (value || '').trim().toLowerCase()
  return (allowed.has(normalized) ? normalized : 'applied') as 'applied' | 'viewed' | 'interview' | 'rejected' | 'offered' | 'hired'
}

export async function POST(request: NextRequest) {
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

    let rows: ParsedRow[] = []
    if (file.name.endsWith('.csv')) {
      const fileContent = await file.text()
      rows = parseCSV(fileContent)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const bytes = new Uint8Array(await file.arrayBuffer())
      await workbook.xlsx.load(bytes as any)

      const worksheet = workbook.worksheets[0]
      const headers: string[] = []
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => headers.push(normalizeHeader(normalizeCell(cell.value))))
          return
        }

        const item: ParsedRow = {}
        row.eachCell((cell, colNumber) => {
          item[headers[colNumber - 1]] = normalizeCell(cell.value)
        })
        rows.push(item)
      })
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Please upload CSV or Excel files.' }, { status: 400 })
    }

    if (!rows.length) {
      return NextResponse.json({ error: 'No valid rows found in uploaded file' }, { status: 400 })
    }

    const { data: jobs, error: jobsError } = await supabase
      .from('scraped_jobs')
      .select('title, company, source, snippet, url')
      .limit(10000)

    if (jobsError) {
      return NextResponse.json({ error: `Failed to load current jobs: ${jobsError.message}` }, { status: 500 })
    }

    const jobsByUrl = new Map<string, any>()
    const jobsByTitleCompany = new Map<string, any>()

    for (const j of jobs || []) {
      const url = String(j.url || '').trim().toLowerCase()
      if (url) jobsByUrl.set(url, j)

      const key = `${String(j.title || '').trim().toLowerCase()}::${String(j.company || '').trim().toLowerCase()}`
      if (j.title && j.company && !jobsByTitleCompany.has(key)) jobsByTitleCompany.set(key, j)
    }

    const toInsert: any[] = []
    const skipped: Array<{ row: number; reason: string }> = []

    rows.forEach((row, index) => {
      const rowNumber = index + 2
      const jobTitle = (row.job_title || row.title || '').trim()
      const companyName = (row.company_name || row.company || '').trim()
      const rowUrl = (row.url || row.job_url || '').trim().toLowerCase()

      if (!jobTitle || !companyName) {
        skipped.push({ row: rowNumber, reason: 'Missing title/company' })
        return
      }

      let matchedJob: any = null
      if (rowUrl) matchedJob = jobsByUrl.get(rowUrl) || null
      if (!matchedJob) {
        const key = `${jobTitle.toLowerCase()}::${companyName.toLowerCase()}`
        matchedJob = jobsByTitleCompany.get(key) || null
      }

      if (!matchedJob) {
        skipped.push({ row: rowNumber, reason: 'No matching current job by url or title+company' })
        return
      }

      const ats = Number.parseInt((row.ats_score_at_application || row.ats_score || '0').trim(), 10)

      toInsert.push({
        user_id: user.id,
        cv_id: (row.cv_id || '').trim() || null,
        job_title: jobTitle,
        company_name: companyName,
        job_board: (row.job_board || row.source || matchedJob.source || 'Other').trim(),
        application_date: parseDateOrToday((row.application_date || '').trim()),
        status: parseStatus((row.status || '').trim()),
        ats_score_at_application: Number.isNaN(ats) ? 0 : ats,
        job_description: (row.job_description || matchedJob.snippet || '').trim(),
        notes: (row.notes || '').trim(),
      })
    })

    if (!toInsert.length) {
      return NextResponse.json({
        error: 'No valid application rows matched current jobs',
        inserted: 0,
        skipped: skipped.length,
        skipDetails: skipped.slice(0, 50),
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('application_tracking')
      .insert(toInsert)
      .select('id')

    if (error) {
      return NextResponse.json({ error: `Failed to insert applications: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      skipped: skipped.length,
      skipDetails: skipped.slice(0, 50),
      totalRows: rows.length,
    })
  } catch (error) {
    console.error('Upload applications error:', error)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}

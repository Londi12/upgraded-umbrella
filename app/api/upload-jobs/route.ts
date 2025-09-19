import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const fileContent = await file.text()
    let jobs: any[] = []

    // Parse CSV format
    if (file.name.endsWith('.csv')) {
      jobs = parseCSV(fileContent)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Parse Excel files using 'xlsx' library
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(fileContent, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      jobs = XLSX.utils.sheet_to_json(worksheet)
    } else {
      return NextResponse.json({ 
        error: 'Unsupported file format. Please upload CSV or Excel files.' 
      }, { status: 400 })
    }

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'No valid jobs found in file' }, { status: 400 })
    }

    // Validate required fields
    const validJobs = jobs.filter(job => 
      job.title && job.company && job.location && job.snippet && job.url && job.source
    )

    if (validJobs.length === 0) {
      return NextResponse.json({ 
        error: 'No jobs with required fields (title, company, location, snippet, url, source)' 
      }, { status: 400 })
    }

    // Insert jobs into database
    const { data, error } = await supabase
      .from('scraped_jobs')
      .insert(validJobs.map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        snippet: job.snippet,
        url: job.url,
        source: job.source,
        posted_date: job.posted_date || new Date().toISOString().split('T')[0]
      })))
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
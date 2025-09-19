import { NextRequest, NextResponse } from 'next/server'
import type { JobListing } from '@/lib/job-matching-service'

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function pick<T>(items: T[], count: number): T[] {
  const copy = [...items]
  const result: T[] = []
  while (result.length < Math.min(count, copy.length)) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

function recentISO(daysAgoMax: number = 14): string {
  const now = Date.now()
  const delta = Math.floor(Math.random() * daysAgoMax * 24 * 60 * 60 * 1000)
  return new Date(now - delta).toISOString()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const cvData = body?.cvData || null
    const locationFromBody: string | undefined = body?.location
    const keywordsFromBody: string | undefined = body?.keywords

    // Derive inputs
    const skills: string[] = Array.isArray(cvData?.skills)
      ? cvData.skills.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
      : typeof cvData?.skills === 'string'
        ? cvData.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
    const expTitles: string[] = Array.isArray(cvData?.experience)
      ? cvData.experience.map((e: any) => e?.title).filter(Boolean)
      : []
    const education: string[] = Array.isArray(cvData?.education)
      ? cvData.education.map((e: any) => e?.degree).filter(Boolean)
      : []
    const derivedKeywords: string[] = [
      ...skills,
      ...expTitles,
      ...education
    ].filter(Boolean)

    const keywords: string[] = (keywordsFromBody ? String(keywordsFromBody).split(',') : derivedKeywords)
      .map(k => k.trim())
      .filter(Boolean)

    const location: string = locationFromBody
      || cvData?.personalInfo?.location
      || 'South Africa'

    // If we truly have zero signal, return a few generic SA roles
    const baselineTitles = [
      'Sales Consultant', 'Customer Service Agent', 'Office Administrator', 'Junior Data Analyst',
      'Marketing Assistant', 'IT Support Technician', 'Logistics Coordinator', 'Finance Clerk'
    ]

    const inferredTitles = (
      expTitles.length > 0 ? expTitles :
      (skills.length > 0 ? skills.map((s: string) => `${toTitleCase(s)} Specialist`) : [])
    ).map(toTitleCase)

    const titles = (inferredTitles.length > 0 ? inferredTitles : baselineTitles)
      .slice(0, 6)

    const companies = [
      'TechCorp SA', 'Woolworths', 'Shoprite', 'Pepkor', 'Discovery', 'Standard Bank', 'Takealot', 'Momentum Metropolitan'
    ]

    const provinces = [
      'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
    ]
    const cities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria']

    const types: JobListing['type'][] = ['full-time', 'part-time', 'contract', 'internship']

    const synthJobs: JobListing[] = titles.map((title, i) => {
      const company = companies[i % companies.length]
      const city = cities[i % cities.length]
      const province = provinces[i % provinces.length]
      const loc = `${city}, ${province}`
      const kw = pick(keywords.length > 0 ? keywords : ['communication', 'excel', 'sales', 'support', 'analysis', 'javascript', 'sql'], 6)
        .map(k => String(k).toLowerCase())
      const reqs = kw.slice(0, 4).map(k => toTitleCase(k))
      const salary = i % 2 === 0 ? `R${(8000 + i * 1500).toLocaleString()} - R${(15000 + i * 2000).toLocaleString()}` : undefined
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        title: toTitleCase(title),
        company,
        location: location.includes(',') ? location : loc,
        description: `We are seeking a ${toTitleCase(title)} to join ${company} in ${loc}. Responsibilities include using ${kw.slice(0,3).join(', ')}.`,
        requirements: reqs,
        salary,
        type: types[i % types.length],
        postedDate: recentISO(21),
        keywords: kw
      }
    })

    return NextResponse.json(synthJobs, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate AI jobs' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'Use POST with { cvData, location?, keywords? }' })
}




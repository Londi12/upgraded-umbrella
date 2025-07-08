import { NextRequest, NextResponse } from 'next/server'
import type { CVData } from '@/types/cv-types'

export async function POST(request: NextRequest) {
  try {
    const { cvData, location = 'South Africa' }: { cvData: CVData, location?: string } = await request.json()
    
    // Check cache first
    const cacheKey = `jobs_${location}_${cvData.personalInfo?.jobTitle || 'general'}`
    const cached = getCachedJobs(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const jobs = await generateJobsWithGemini(cvData, location)
    
    // Cache for 24 hours
    setCachedJobs(cacheKey, jobs)
    
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Gemini job generation error:', error)
    return NextResponse.json({ error: 'Job generation failed' }, { status: 500 })
  }
}

async function generateJobsWithGemini(cvData: CVData, location: string) {
  const prompt = createJobGenerationPrompt(cvData, location)
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error('Gemini API failed')
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    return parseGeneratedJobs(generatedText)
  } catch (error) {
    console.error('Gemini API error:', error)
    return generateFallbackJobs(cvData, location)
  }
}

function createJobGenerationPrompt(cvData: CVData, location: string): string {
  const userSkills = cvData.skills || ''
  const userTitle = cvData.personalInfo?.jobTitle || 'Professional'
  const userExperience = cvData.experience?.length || 0
  
  return `Generate 20 realistic job listings for ${location} job market in JSON format. 
  
User Profile:
- Current Role: ${userTitle}
- Skills: ${userSkills}
- Experience: ${userExperience} positions
- Location: ${cvData.personalInfo?.location || location}

Requirements:
- Mix of entry, mid, and senior level positions
- Include South African companies (Standard Bank, Woolworths, Discovery, etc.)
- Realistic salaries in ZAR
- Various industries (tech, finance, retail, healthcare)
- Include remote and hybrid options

JSON Format:
[{
  "id": "unique_id",
  "title": "Job Title",
  "company": "Company Name",
  "location": "City, Province",
  "description": "Detailed job description",
  "requirements": ["skill1", "skill2", "skill3"],
  "salary": "R400,000 - R600,000",
  "type": "full-time",
  "postedDate": "2024-01-15",
  "keywords": ["keyword1", "keyword2"],
  "workArrangement": "hybrid"
}]

Generate diverse, realistic jobs that match the user's profile and career progression.`
}

function parseGeneratedJobs(generatedText: string) {
  try {
    // Extract JSON from the generated text
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    
    const jobs = JSON.parse(jsonMatch[0])
    
    // Validate and clean the jobs
    return jobs.map((job: any, index: number) => ({
      id: job.id || `gemini_${Date.now()}_${index}`,
      title: job.title || 'Software Developer',
      company: job.company || 'Tech Company',
      location: job.location || 'Johannesburg, GP',
      description: job.description || 'Exciting opportunity to join our team.',
      requirements: Array.isArray(job.requirements) ? job.requirements : ['Experience required'],
      salary: job.salary || 'Competitive',
      type: job.type || 'full-time',
      postedDate: job.postedDate || new Date().toISOString().split('T')[0],
      keywords: Array.isArray(job.keywords) ? job.keywords : ['general'],
      workArrangement: job.workArrangement || 'onsite'
    }))
  } catch (error) {
    console.error('Failed to parse generated jobs:', error)
    return []
  }
}

function generateFallbackJobs(cvData: CVData, location: string) {
  const userTitle = cvData.personalInfo?.jobTitle || 'Professional'
  const skills = cvData.skills?.split(',').map(s => s.trim()) || ['General']
  
  return [
    {
      id: `fallback_1`,
      title: `Senior ${userTitle}`,
      company: 'Leading SA Company',
      location: `${location}`,
      description: `We are looking for an experienced ${userTitle} to join our dynamic team.`,
      requirements: skills.slice(0, 5),
      salary: 'R500,000 - R700,000',
      type: 'full-time',
      postedDate: new Date().toISOString().split('T')[0],
      keywords: skills.slice(0, 3),
      workArrangement: 'hybrid'
    },
    {
      id: `fallback_2`,
      title: `${userTitle} - Remote`,
      company: 'Tech Startup',
      location: 'Remote, SA',
      description: `Remote opportunity for a skilled ${userTitle} with growth potential.`,
      requirements: skills.slice(0, 4),
      salary: 'R400,000 - R600,000',
      type: 'full-time',
      postedDate: new Date().toISOString().split('T')[0],
      keywords: skills.slice(0, 3),
      workArrangement: 'remote'
    }
  ]
}

// Simple in-memory cache (in production, use Redis or database)
const jobCache = new Map<string, { jobs: any[], timestamp: number }>()

function getCachedJobs(key: string) {
  const cached = jobCache.get(key)
  if (!cached) return null
  
  // Check if cache is older than 24 hours
  const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000
  if (isExpired) {
    jobCache.delete(key)
    return null
  }
  
  return cached.jobs
}

function setCachedJobs(key: string, jobs: any[]) {
  jobCache.set(key, {
    jobs,
    timestamp: Date.now()
  })
}
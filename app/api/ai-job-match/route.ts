import { NextRequest, NextResponse } from 'next/server'
import type { CVData } from '@/types/cv-types'

interface AIJobMatch {
  jobId: string
  matchScore: number
  reasoning: string
  skillsMatch: string[]
  skillsGap: string[]
  atsKeywords: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { cvData, jobs } = await request.json()
    const cvText = createCVText(cvData)
    const matches: AIJobMatch[] = []

    for (const job of jobs) {
      const jobText = `${job.title} ${job.description} ${job.requirements?.join(' ') || ''}`
      const similarity = await getSemanticSimilarity(cvText, jobText)
      const skillsAnalysis = analyzeSkills(cvData, job)
      
      matches.push({
        jobId: job.id,
        matchScore: Math.round(similarity * 100),
        reasoning: generateReasoning(similarity, job),
        skillsMatch: skillsAnalysis.matched,
        skillsGap: skillsAnalysis.missing,
        atsKeywords: extractATSKeywords(job)
      })
    }

    return NextResponse.json(matches.sort((a, b) => b.matchScore - a.matchScore))
  } catch (error) {
    console.error('AI matching error:', error)
    return NextResponse.json({ error: 'AI matching failed' }, { status: 500 })
  }
}

async function getSemanticSimilarity(cvText: string, jobText: string): Promise<number> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_demo'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            source_sentence: cvText,
            sentences: [jobText]
          }
        })
      }
    )

    if (!response.ok) return calculateBasicSimilarity(cvText, jobText)
    const result = await response.json()
    return result[0] || 0.5
  } catch (error) {
    return calculateBasicSimilarity(cvText, jobText)
  }
}

function calculateBasicSimilarity(cvText: string, jobText: string): number {
  const cvWords = cvText.toLowerCase().split(/\W+/)
  const jobWords = jobText.toLowerCase().split(/\W+/)
  const commonWords = cvWords.filter(word => word.length > 3 && jobWords.includes(word))
  return Math.min(0.9, commonWords.length / Math.max(jobWords.length, 10))
}

function createCVText(cvData: CVData): string {
  return [
    cvData.personalInfo?.jobTitle || '',
    cvData.summary || '',
    cvData.skills || '',
    cvData.experience?.map(exp => `${exp.title} ${exp.description}`).join(' ') || ''
  ].filter(Boolean).join(' ')
}

function analyzeSkills(cvData: CVData, job: any): { matched: string[], missing: string[] } {
  const cvSkills = (cvData.skills || '').toLowerCase().split(',').map(s => s.trim())
  const jobSkills = (job.requirements || []).map((req: string) => req.toLowerCase())
  
  const matched = jobSkills.filter((skill: string) => 
    cvSkills.some(cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill))
  )
  
  return { 
    matched, 
    missing: jobSkills.filter((skill: string) => !matched.includes(skill)).slice(0, 3)
  }
}

function extractATSKeywords(job: any): string[] {
  const text = `${job.title} ${job.description} ${job.requirements?.join(' ') || ''}`
  const words = text.toLowerCase().split(/\W+/)
  const keywords = words.filter(word => 
    word.length > 3 && 
    !['the', 'and', 'for', 'with', 'you', 'will'].includes(word)
  )
  
  const frequency: Record<string, number> = {}
  keywords.forEach(word => frequency[word] = (frequency[word] || 0) + 1)
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([word]) => word)
}

function generateReasoning(similarity: number, job: any): string {
  if (similarity > 0.8) return `Excellent match for ${job.title}! Strong skill alignment.`
  if (similarity > 0.6) return `Good match for ${job.title}. Highlight relevant experience.`
  if (similarity > 0.4) return `Moderate match. Focus on transferable skills.`
  return `Consider developing skills for better match.`
}
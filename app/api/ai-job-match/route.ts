import { NextRequest, NextResponse } from 'next/server'
import type { CVData } from '@/types/cv-types'
import { SA_JOB_PROFILES, detectJobFamily } from '@/lib/sa-job-knowledgebase'

export interface JobMatchResult {
  jobId: string
  matchScore: number
  confidence: 'high' | 'medium' | 'low'
  recommendation: string
  reasoning: string
  strengths: string[]
  gaps: string[]
  dealBreakers: string[]
  skillsMatch: string[]
  skillsGap: string[]
  atsKeywords: string[]
  detectedCVFamily: string
  detectedJobFamily: string
  isAmbiguous: boolean
  breakdown: {
    nqf: number
    skills: number
    registrations: number
    experience: number
    saFlags: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cvData, jobs, confirmedFamily } = await request.json()

    console.log(`[AI-MATCH] Processing ${jobs.length} jobs for CV with ${cvData?.personalInfo?.fullName || 'Unknown'}`)

    if (!cvData || !cvData.personalInfo) {
      console.error('[AI-MATCH] Invalid cvData:', cvData)
      return NextResponse.json({ error: 'Valid CV data required', matches: [] })
    }
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      console.error('[AI-MATCH] Invalid jobs:', jobs)
      return NextResponse.json({ error: 'Jobs array required', matches: [] })
    }

    // Simple CV family guess (fallback to general)
    const cvFamily = guessCVFamily(cvData)
    const isAmbiguous = false // Simplified

    // Safe per-job scoring
    const results: JobMatchResult[] = jobs.map((job, index) => {
      try {
        return scoreJobAgainstCV(cvData, job, cvFamily)
      } catch (err) {
        console.error(`[AI-MATCH] Job ${index} (${job.title}):`, err)
        return {
          jobId: job.id || job.url || `job-${index}`,
          matchScore: 0,
          confidence: 'low' as const,
          recommendation: 'Unable to score',
          reasoning: 'Scoring error - check job data',
          strengths: [],
          gaps: [],
          dealBreakers: [],
          skillsMatch: [],
          skillsGap: [],
          atsKeywords: [],
          detectedCVFamily: cvFamily,
          detectedJobFamily: 'unknown',
          isAmbiguous: false,
          breakdown: { nqf: 0, skills: 0, registrations: 0, experience: 0, saFlags: 0 }
        }
      }
    }).sort((a, b) => b.matchScore - a.matchScore)

    console.log(`[AI-MATCH] Complete: ${results.length} scored jobs, top score: ${results[0]?.matchScore}`)

    return NextResponse.json({
      matches: results,
      cvClassification: {
        detectedFamily: cvFamily,
        confidence: 'medium',
        tier: 'mid',
        isAmbiguous
      }
    })

  } catch (error) {
    console.error('[AI-MATCH] Fatal error:', error)
    return NextResponse.json({ 
      error: 'Job matching service unavailable', 
      matches: [],
      details: error instanceof Error ? error.message : 'Unknown' 
    })
  }
}

function guessCVFamily(cvData: CVData): string {
  const title = cvData.personalInfo?.jobTitle?.toLowerCase() || ''
  const skillsText = (cvData.skills || []).map((s: any) => s.name || s).join(' ').toLowerCase()
  
  const profiles = SA_JOB_PROFILES || []
  let bestMatch = 'general'
  let bestScore = 0

  for (const profile of profiles) {
    let score = 0
    // Title match
    if (title.includes(profile.family.toLowerCase()) || profile.typicalTitles.some(t => title.includes(t.toLowerCase()))) {
      score += 50
    }
    // Skills overlap
    const matches = profile.industryKeywords.filter(kw => skillsText.includes(kw.toLowerCase()))
    score += matches.length * 5
    if (score > bestScore) {
      bestScore = score
      bestMatch = profile.family
    }
  }
  
  return bestScore > 20 ? bestMatch : 'general'
}

function scoreJobAgainstCV(cvData: CVData, job: any, cvFamily: string): JobMatchResult {
  const jobText = `${(job.title || '')} ${(job.description || '')} ${((job.requirements || []).join(' '))}`.toLowerCase()
  const cvText = buildCVText(cvData).toLowerCase()
  
  let score = 0
  const strengths: string[] = []
  const gaps: string[] = []
  const dealBreakers: string[] = []

  // 1. Title match (40 pts)
  const cvTitles = (cvData.experience || []).map((e: any) => (e.title || '').toLowerCase())
  const jobTitleLower = (job.title || '').toLowerCase()
  const titleMatch = cvTitles.some((t: string) => jobTitleLower.includes(t) || t.includes(jobTitleLower))
  if (titleMatch) {
    score += 40
    strengths.push('Title/experience alignment')
  } else {
    gaps.push('Limited matching experience')
  }

  // 2. Skills overlap (35 pts)
  const cvSkills = normalizeSkills(cvData.skills)
  const jobSkills = extractJobSkills(jobText)
  const matchedSkills = cvSkills.filter((s: string) => jobSkills.some((js: string) => js.includes(s) || s.includes(js)))
  score += Math.min(matchedSkills.length * 7, 35)
  strengths.push(...matchedSkills.slice(0, 3).map((s: string) => `Skill: ${s}`))
  if (matchedSkills.length === 0) {
    gaps.push('No matching skills detected')
  }

  // 3. Seniority (15 pts)
  const cvYears = calculateYearsExperience(cvData)
  const seniorityScore = scoreSeniority(cvYears, jobText)
  score += seniorityScore

  // 4. Location (10 pts)
  const locationScore = scoreLocation(cvData, job)
  score += Math.round(locationScore / 10)

  // Final
  score = Math.max(0, Math.min(100, score))

  const jobFamily = (detectJobFamily({title: job.title, description: job.description}) as any)?.family || 'unknown'

  return {
    jobId: job.id || job.url || job.title || 'unknown',
    matchScore: score,
    confidence: score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low' as const,
    recommendation: score >= 75 ? 'Strong match' : score >= 55 ? 'Good match' : score >= 35 ? 'Moderate' : 'Review manually',
    reasoning: buildSimpleReasoning(score, job.title || 'Job', matchedSkills, seniorityScore, cvYears),
    strengths,
    gaps,
    dealBreakers: score < 20 ? ['Major gaps - low fit'] : [],
    skillsMatch: matchedSkills,
    skillsGap: jobSkills.filter((js: string) => !matchedSkills.some((ms: string) => ms.includes(js))).slice(0, 3),
    atsKeywords: extractATSKeywords(jobText),
    detectedCVFamily: cvFamily,
    detectedJobFamily: jobFamily,
    isAmbiguous: false,
    breakdown: {
      nqf: 0,
      skills: matchedSkills.length * 10,
      registrations: 0,
      experience: seniorityScore,
      saFlags: Math.round(locationScore / 10)
    }
  }
}

function normalizeSkills(skills: string | any[]): string[] {
  if (typeof skills === 'string') {
    return skills.split(/[,;|]/).map((s: string) => s.trim().toLowerCase()).filter((s: string) => s.length > 2)
  }
  return (skills as any[]).map((s: any) => ((s.name || s) as string).toLowerCase()).filter((s: string) => s.length > 2)
}

function extractJobSkills(jobText: string): string[] {
  const candidates = (jobText.match(/\b\w{4,}\b/g) || [])
  const stopWords = new Set(['the', 'and', 'for', 'with', 'experience', 'years', 'team', 'client', 'develop', 'manage'])
  return candidates.filter((w: string) => !stopWords.has(w) && w.length > 4).slice(0, 20)
}

function calculateYearsExperience(cvData: CVData): number {
  if (!cvData.experience || !Array.isArray(cvData.experience)) return 0
  let totalYears = 0
  for (const exp of cvData.experience) {
    try {
      const start = new Date(exp.startDate || 0)
      const end = (exp.endDate || '').toLowerCase().includes('present') ? new Date() : new Date(exp.endDate || 0)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const years = end.getFullYear() - start.getFullYear()
        totalYears += Math.max(0, years)
      }
    } catch {
      // Safe skip
    }
  }
  return Math.round(totalYears)
}

function scoreSeniority(years: number, jobText: string): number {
  const isSenior = /senior|lead|manager|director|head|executive/i.test(jobText)
  const isJunior = /junior|entry|graduate|intern|trainee/i.test(jobText)
  
  if (isSenior && years >= 5) return 15
  if (isSenior && years < 3) return 0
  if (isJunior && years <= 3) return 15
  if (isJunior && years > 5) return 5
  return 10
}

function buildCVText(cvData: CVData): string {
  return [
    cvData.summary || '',
    ...(cvData.experience || []).map((e: any) => `${e.title || ''} ${e.company || ''} ${e.description || ''}`),
    Array.isArray(cvData.skills) ? (cvData.skills as any[]).map((s: any) => s.name || s).join(' ') : '',
    ...(cvData.education || []).map((e: any) => e.degree || '')
  ].join(' ')
}

function buildSimpleReasoning(score: number, jobTitle: string, skills: string[], seniorityScore: number, years: number): string {
  const parts: string[] = [`${score}% match: ${jobTitle}`]
  if (skills.length > 0) parts.push(`Skills: ${skills.slice(0, 2).join(', ')}`)
  parts.push(`${years}yrs → ${seniorityScore === 15 ? 'Perfect seniority' : 'Good fit'}`)
  return parts.join(' | ')
}

function scoreLocation(cvData: CVData, job: any): number {
  const cvLocation = (cvData.personalInfo?.location || '').toLowerCase()
  const jobLocation = (job.location || '').toLowerCase()

  if (!jobLocation || jobLocation.includes('remote')) return 100
  if (cvLocation.includes(jobLocation) || jobLocation.includes(cvLocation)) return 100

  const provinces = ['gauteng', 'western cape', 'kwazulu-natal', 'eastern cape', 'free state', 'limpopo', 'mpumalanga', 'northern cape', 'north west']
  const cvProvince = provinces.find(p => cvLocation.includes(p))
  const jobProvince = provinces.find(p => jobLocation.includes(p))
  if (cvProvince && cvProvince === jobProvince) return 80

  return 50
}

function extractATSKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'and', 'for', 'with', 'you', 'will', 'this', 'that', 'from', 'have', 'been', 'are', 'was', 'were'])
  const words = text.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3 && !stopWords.has(w))
  const freq: Record<string, number> = {}
  words.forEach((w: string) => freq[w] = (freq[w] || 0) + 1)
  return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 8).map(([w]) => w)
}



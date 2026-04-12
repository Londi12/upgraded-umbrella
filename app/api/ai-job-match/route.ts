import { NextRequest, NextResponse } from 'next/server'
import type { CVData } from '@/types/cv-types'
import knowledgebase, { SA_JOB_PROFILES } from '@/lib/sa-job-knowledgebase'

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

    if (!cvData) {
      console.error('[AI-MATCH] Missing cvData')
      return NextResponse.json({ error: 'CV data is required', matches: [] })
    }
    // Ensure personalInfo exists so downstream scoring doesn't crash on undefined access
    if (!cvData.personalInfo) cvData.personalInfo = { fullName: '', email: '', phone: '', location: '', jobTitle: '' }
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

    // Top profile families the CV is ACTUALLY strong against (for "Better matches" redirect UX)
    const cvYearsGlobal = calculateYearsExperience(cvData)
    const recommendedFamilies = (SA_JOB_PROFILES || [])
      .map(profile => {
        let s = 0
        const cvSkillsGlobal = normalizeSkills(cvData.skills)
        const profileSkills = [
          ...profile.industryKeywords,
          ...Object.values(profile.experienceTiers).flatMap(t => t.coreSkills)
        ].map(k => k.toLowerCase())
        s += Math.min(cvSkillsGlobal.filter(cs => cs.length >= 4 && profileSkills.some(ps => ps.length >= 4 && (ps === cs || ps.includes(cs)))).length * 8, 40)
        const titleLower = (cvData.personalInfo?.jobTitle || '').toLowerCase()
        if (profile.typicalTitles.some(t => titleLower.includes(t.toLowerCase()))) s += 25
        return { family: profile.family, score: s }
      })
      .filter(r => r.family !== cvFamily)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.family)

    return NextResponse.json({
      matches: results,
      recommendedFamilies,
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
  const jobText = `${job.title || ''} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase()

  // Use a strict title match first. If a role is outside the knowledgebase, leave it unknown
  // rather than forcing an unrelated family from loose description keywords.
  const jobProfile = resolveJobProfile(job)
  const jobFamily = jobProfile?.family || 'unknown'

  let score = 0
  const strengths: string[] = []
  const gaps: string[] = []

  // 1. Title/experience alignment (25 pts)
  const cvTitles = (cvData.experience || []).map((e: any) => (e.title || '').toLowerCase())
  const jobTitleLower = (job.title || '').toLowerCase()
  // Require titles to be >= 4 chars to prevent generic words ('at', 'in') from matching
  const titleMatch = cvTitles.some((t: string) =>
    t.length >= 4 && jobTitleLower.length >= 4 &&
    (jobTitleLower.includes(t) || t.includes(jobTitleLower))
  )
  if (titleMatch) {
    score += 25
    strengths.push('Title/experience alignment')
  } else {
    gaps.push('Limited matching experience')
  }

  // 2. Skills overlap (40 pts) — blend profile keywords with keywords extracted from
  //    the actual job description so different jobs in the same family score differently.
  const cvSkills = normalizeSkills(cvData.skills)
  const profileSkills = jobProfile
    ? [
        ...jobProfile.industryKeywords,
        ...Object.values(jobProfile.experienceTiers).flatMap(t => t.coreSkills)
      ].map(s => s.toLowerCase())
    : []
  const descriptionSkills = extractJobSkillsFallback(jobText)
  // Union: profile gives the baseline, description adds job-specific terms
  const jobSkillsSet: Set<string> = new Set([...profileSkills, ...descriptionSkills])
  const jobSkills = Array.from(jobSkillsSet)
  // Only forward containment: job skill contains CV skill (not reverse) to prevent
  // "java" matching "javascript", "r" matching "react", etc. Min 4 chars on both sides.
  const matchedSkills = cvSkills.filter(s =>
    s.length >= 4 && jobSkills.some(js => js.length >= 4 && (js === s || js.includes(s)))
  )
  const skillsPts = Math.min(matchedSkills.length * 8, 40)
  score += skillsPts
  strengths.push(...matchedSkills.slice(0, 3).map(s => `Skill: ${s}`))
  if (matchedSkills.length === 0) gaps.push('No matching skills detected')

  // 3. Profile-based NQF (10 pts) + registration (10 pts)
  let nqfScore = 0
  let registrationsScore = 0
  if (jobProfile) {
    const cvYears = calculateYearsExperience(cvData)
    const tier = cvYears >= jobProfile.experienceTiers.senior.minYears ? 'senior'
      : cvYears >= jobProfile.experienceTiers.mid.minYears ? 'mid' : 'junior'
    const profScore = knowledgebase.scoreAgainstProfile(cvData, jobProfile, tier)
    // Use boolean flags — not string-grepping on human-readable messages
    nqfScore = profScore.meetsNQF ? 10 : 0
    registrationsScore = profScore.hasRegistration ? 10 : 0
    score += nqfScore + registrationsScore
    strengths.push(...profScore.strengths.filter(s => !strengths.includes(s)).slice(0, 2))
    gaps.push(...profScore.gaps.filter(g => !gaps.includes(g)).slice(0, 2))
  }

  // 4. Seniority (10 pts)
  const cvYears = calculateYearsExperience(cvData)
  const seniorityScore = scoreSeniority(cvYears, jobText)
  score += seniorityScore

  // 5. Location (5 pts)
  const locationPts = scoreLocation(cvData, job)
  score += locationPts

  // Max possible: 25 + 40 + 10 + 10 + 10 + 5 = 100 — no clamp needed
  score = Math.max(0, Math.min(100, score))

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
    skillsGap: jobSkills.filter(js => !matchedSkills.some(ms => ms.includes(js) || js.includes(ms))).slice(0, 5),
    atsKeywords: jobProfile ? jobProfile.industryKeywords.slice(0, 8) : extractATSKeywords(jobText),
    detectedCVFamily: cvFamily,
    detectedJobFamily: jobFamily,
    isAmbiguous: false,
    breakdown: {
      nqf: nqfScore,
      skills: skillsPts,
      registrations: registrationsScore,
      experience: seniorityScore,
      location: locationPts
    }
  }
}

function resolveJobProfile(job: any) {
  const jobTitle = `${job?.title || ''}`.trim()
  if (!jobTitle) return null

  const titleMatch = knowledgebase.getClosestProfile(jobTitle, { threshold: 0.55 })
  if (titleMatch) return titleMatch

  const jobText = `${jobTitle} ${job?.description || ''} ${(job?.requirements || []).join(' ')}`.toLowerCase()
  let bestProfile: typeof SA_JOB_PROFILES[number] | null = null
  let bestScore = 0

  for (const profile of SA_JOB_PROFILES || []) {
    const exactTitleHit = profile.typicalTitles.some(title => jobTitle.toLowerCase().includes(title.toLowerCase()))
    const keywordHits = profile.industryKeywords.filter(keyword => {
      const normalized = keyword.toLowerCase()
      return normalized.length >= 5 && jobText.includes(normalized)
    }).length
    const score = (exactTitleHit ? 4 : 0) + keywordHits

    if (score > bestScore) {
      bestScore = score
      bestProfile = profile
    }
  }

  return bestScore >= 3 ? bestProfile : null
}

function normalizeSkills(skills: string | any[]): string[] {
  if (typeof skills === 'string') {
    return skills.split(/[,;|]/).map((s: string) => s.trim().toLowerCase()).filter((s: string) => s.length > 2)
  }
  return (skills as any[]).map((s: any) => ((s.name || s) as string).toLowerCase()).filter((s: string) => s.length > 2)
}

function extractJobSkillsFallback(jobText: string): string[] {
  // Checked against common SA job posting vocabulary
  const knownSkills = [
    'excel', 'word', 'powerpoint', 'outlook', 'sql', 'python', 'javascript', 'typescript',
    'react', 'node', 'java', 'aws', 'azure', 'docker', 'git', 'linux',
    'power bi', 'tableau', 'sap', 'pastel', 'sage', 'xero', 'quickbooks',
    'autocad', 'revit', 'solidworks', 'matlab',
    'project management', 'communication', 'leadership', 'stakeholder management',
    'customer service', 'problem solving', 'data analysis', 'reporting',
    'recruitment', 'procurement', 'budgeting', 'forecasting',
    'ifrs', 'tax', 'audit', 'compliance', 'risk management'
  ]
  return knownSkills.filter(skill => jobText.includes(skill))
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

  if (isSenior && years >= 5) return 10
  if (isSenior && years < 3) return 0
  if (isJunior && years <= 3) return 10
  if (isJunior && years > 5) return 3
  return 7
}

function buildSimpleReasoning(score: number, jobTitle: string, skills: string[], seniorityScore: number, years: number): string {
  const parts: string[] = [`${score}% match: ${jobTitle}`]
  if (skills.length > 0) parts.push(`Skills: ${skills.slice(0, 2).join(', ')}`)
  parts.push(`${years}yrs → ${seniorityScore === 15 ? 'Perfect seniority' : 'Good fit'}`)
  return parts.join(' | ')
}

// Returns pts directly (max 5) — cleaner than returning 0-100 then dividing
function scoreLocation(cvData: CVData, job: any): number {
  const cvLocation = (cvData.personalInfo?.location || '').toLowerCase()
  const jobLocation = (job.location || '').toLowerCase()

  if (!jobLocation || jobLocation.includes('remote')) return 5
  if (cvLocation.includes(jobLocation) || jobLocation.includes(cvLocation)) return 5

  const provinces = ['gauteng', 'western cape', 'kwazulu-natal', 'eastern cape', 'free state', 'limpopo', 'mpumalanga', 'northern cape', 'north west']
  const cvProvince = provinces.find(p => cvLocation.includes(p))
  const jobProvince = provinces.find(p => jobLocation.includes(p))
  if (cvProvince && cvProvince === jobProvince) return 3

  return 0
}

function extractATSKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'and', 'for', 'with', 'you', 'will', 'this', 'that', 'from', 'have', 'been', 'are', 'was', 'were'])
  const words = text.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3 && !stopWords.has(w))
  const freq: Record<string, number> = {}
  words.forEach((w: string) => freq[w] = (freq[w] || 0) + 1)
  return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 8).map(([w]) => w)
}



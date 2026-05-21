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
    location: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cvData, jobs, confirmedFamily } = await request.json()

    if (!cvData) {
      return NextResponse.json({ error: 'CV data is required', matches: [] })
    }
    // Ensure personalInfo exists so downstream scoring doesn't crash on undefined access
    if (!cvData.personalInfo) cvData.personalInfo = { fullName: '', email: '', phone: '', location: '', jobTitle: '' }
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Jobs array required', matches: [] })
    }

    const normalizedConfirmedFamily = typeof confirmedFamily === 'string' ? confirmedFamily.trim() : ''
    const hasConfirmedFamily = normalizedConfirmedFamily.length > 0 &&
      (SA_JOB_PROFILES || []).some(profile => profile.family.toLowerCase() === normalizedConfirmedFamily.toLowerCase())
    const detectedFamily = guessCVFamily(cvData)
    // Use user-confirmed family when valid so API scoring stays in sync with user disambiguation choice.
    const cvFamily = hasConfirmedFamily ? normalizedConfirmedFamily : detectedFamily

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
          breakdown: { nqf: 0, skills: 0, registrations: 0, experience: 0, location: 0 }
        }
      }
    }).sort((a, b) => b.matchScore - a.matchScore)

    const cvSkillsGlobal = normalizeSkills(cvData.skills)
    // For recommendations: also consider skills mentioned in experience descriptions
    const cvDescTextGlobal = [
      cvData.summary || '',
      ...(cvData.experience || []).map((e: any) => e.description || ''),
    ].join(' ').toLowerCase()
    const cvDescSkillsGlobal = extractJobSkillsFallback(cvDescTextGlobal)
    const cvAllSkillsGlobal = [...new Set([...cvSkillsGlobal, ...cvDescSkillsGlobal])]
    // All title text for better profile matching (not just current job title)
    const cvAllTitlesGlobal = [
      (cvData.personalInfo?.jobTitle || '').toLowerCase(),
      ...(cvData.experience || []).map((e: any) => (e.title || '').toLowerCase()),
    ].join(' ')
    const recommendedFamilies = (SA_JOB_PROFILES || [])
      .map(profile => {
        let s = 0
        const profileSkills = [
          ...profile.industryKeywords,
          ...Object.values(profile.experienceTiers).flatMap(t => t.coreSkills)
        ].map(k => k.toLowerCase())
        s += Math.min(cvAllSkillsGlobal.filter(cs => cs.length >= 4 && profileSkills.some(ps => ps.length >= 4 && (ps === cs || ps.includes(cs)))).length * 8, 40)
        if (profile.typicalTitles.some(t => t.length >= 4 && cvAllTitlesGlobal.includes(t.toLowerCase()))) s += 25
        return { family: profile.family, score: s }
      })
      // Only recommend profiles with genuine evidence; filter avoids returning Mining/Geo
      // when all scores are 0 simply because they appear first in the profile array
      .filter(r => r.family !== cvFamily && r.score > 0)
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
        isAmbiguous: false
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
  const personalTitle = (cvData.personalInfo?.jobTitle || '').toLowerCase()
  // Collect all past experience titles — critical when personalInfo.jobTitle is empty
  const expTitles = (cvData.experience || []).map((e: any) => (e.title || '').toLowerCase()).join(' ')

  // Normalised skills list, plus token set for word-boundary-safe short-keyword matching
  const skills = normalizeSkills(cvData.skills)
  const skillsText = skills.join(' ')
  // Split multi-word skills into individual tokens so 'R' doesn't match 'react'/'javascript'
  const skillsTokenSet = new Set(skills.flatMap((s: string) => s.split(/\s+/)))

  // Also look at certifications and registrations — strong family signals (e.g. 'SAICA', 'ECSA')
  const certsText = [
    ...(cvData.certifications || []),
    ...(cvData.registrations || []),
  ].join(' ').toLowerCase()

  const profiles = SA_JOB_PROFILES || []
  let bestMatch = 'general'
  let bestScore = 0

  for (const profile of profiles) {
    let score = 0

    // Title matching — current title weighted more than historical titles
    if (
      personalTitle.includes(profile.family.toLowerCase()) ||
      profile.typicalTitles.some(t => t.length >= 4 && personalTitle.includes(t.toLowerCase()))
    ) {
      score += 50
    } else if (
      profile.typicalTitles.some(t => t.length >= 4 && expTitles.includes(t.toLowerCase()))
    ) {
      // Past experience title match — valid evidence but weighted less than current title
      score += 30
    }

    // Keyword matching — word-boundary-safe for short keywords to prevent
    // single-char 'R' matching 'react', 'docker', 'javascript' etc.
    for (const kw of profile.industryKeywords) {
      const kwLower = kw.toLowerCase()
      let matched: boolean
      if (kwLower.length <= 3) {
        // Exact token match — 'r' only matches if the skill IS 'r' (the language)
        matched = skillsTokenSet.has(kwLower)
      } else {
        // Substring match is fine for longer keywords; also check certs/registrations
        matched = skillsText.includes(kwLower) || certsText.includes(kwLower)
      }
      if (matched) score += 5
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = profile.family
    }
  }

  return bestScore > 20 ? bestMatch : 'general'
}

function scoreJobAgainstCV(cvData: CVData, job: any, cvFamily: string): JobMatchResult {
  const jobText = `${job.title || ''} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase()

  const jobProfile = resolveJobProfile(job)
  const jobFamily = jobProfile?.family || 'unknown'

  let score = 0
  const strengths: string[] = []
  const gaps: string[] = []

  // 1. Title/experience alignment (25 pts)
  const cvTitles = [
    (cvData.personalInfo?.jobTitle || '').toLowerCase(),
    ...(cvData.experience || []).map((e: any) => (e.title || '').toLowerCase()),
  ].filter(t => t.length >= 3)
  const jobTitleLower: string = `${job.title || ''}`.toLowerCase()
  const jobTitleWords = jobTitleLower.split(/\s+/).filter((w: string) => w.length >= 3)
  const titleWordMatches = jobTitleWords.filter((w: string) => cvTitles.some(t => t.includes(w)))
  const titleScore = jobTitleWords.length
    ? Math.round((titleWordMatches.length / jobTitleWords.length) * 25)
    : 0
  score += titleScore
  if (titleScore >= 15) {
    strengths.push('Title/experience alignment')
  } else if (titleScore === 0) {
    gaps.push('Limited matching experience')
  }

  // 2. Skills overlap (40 pts)
  // Primary source: explicit skills field
  const cvExplicitSkills = normalizeSkills(cvData.skills)
  // Secondary source: extract recognised skill tokens from experience descriptions + summary
  // This bridges the gap where tools are mentioned in work history but not listed as skills
  const cvDescText = [
    cvData.summary || '',
    ...(cvData.experience || []).map((e: any) => e.description || ''),
  ].join(' ').toLowerCase()
  const cvDescSkills = extractJobSkillsFallback(cvDescText)
  // Merge, deduped — explicit skills take precedence but descriptions fill the gaps
  const cvSkills = [...new Set([...cvExplicitSkills, ...cvDescSkills])]
  const profileSkills = jobProfile
    ? [
        ...jobProfile.industryKeywords,
        ...Object.values(jobProfile.experienceTiers).flatMap(t => t.coreSkills)
      ].map(s => s.toLowerCase())
    : []
  const descriptionSkills = extractJobSkillsFallback(jobText)
  const jobSkillsSet: Set<string> = new Set([...profileSkills, ...descriptionSkills])
  const jobSkills = Array.from(jobSkillsSet)
  const matchedSkills = cvSkills.filter(s =>
    s.length >= 2 && jobSkills.some(js => js.length >= 2 && (js === s || js.includes(s) || s.includes(js)))
  ).filter((s, _, arr) => {
    // Remove short tokens that are substrings of another matched skill to avoid false positives
    // e.g. 'it' inside 'audit', 'net' inside '.net'
    if (s.length <= 3) return arr.every(other => other === s || !other.includes(s))
    return true
  })
  // Scale: 1 match = 10pts, 2 = 18, 3 = 25, 4 = 31, 5+ = 40 (diminishing returns)
  const skillsPts = matchedSkills.length === 0 ? 0
    : Math.min(Math.round(40 * (1 - Math.pow(0.75, matchedSkills.length))), 40)
  score += skillsPts
  strengths.push(...matchedSkills.slice(0, 3).map(s => `Skill: ${s}`))
  if (matchedSkills.length === 0) gaps.push('No matching skills detected')

  // 3. Profile-based NQF (10 pts) + registration (10 pts)
  // Fall back to a text-based education/registration check when no profile resolves
  let nqfScore = 0
  let registrationsScore = 0
  if (jobProfile) {
    const cvYears = calculateYearsExperience(cvData)
    const tier = cvYears >= jobProfile.experienceTiers.senior.minYears ? 'senior'
      : cvYears >= jobProfile.experienceTiers.mid.minYears ? 'mid' : 'junior'
    const profScore = knowledgebase.scoreAgainstProfile(cvData, jobProfile, tier) as any
    nqfScore = profScore.meetsNQF ? 10 : 5
    registrationsScore = profScore.hasRegistration ? 10 : 0
    score += nqfScore + registrationsScore
    strengths.push(...(profScore.strengths as string[]).filter(s => !strengths.includes(s)).slice(0, 2))
    gaps.push(...(profScore.gaps as string[]).filter(g => !gaps.includes(g)).slice(0, 2))
  } else {
    // No profile matched — award partial NQF credit if CV has any education
    nqfScore = cvData.education?.length ? 5 : 0
    score += nqfScore
  }

  // 4. Seniority (10 pts)
  const cvYears = calculateYearsExperience(cvData)
  const seniorityScore = scoreSeniority(cvYears, jobText)
  score += seniorityScore

  // 5. Location (5 pts)
  const locationPts = scoreLocation(cvData, job)
  score += locationPts

  score = Math.max(0, Math.min(100, score))

  return {
    jobId: job.id || job.url || job.title || 'unknown',
    matchScore: score,
    confidence: score >= 65 ? 'high' : score >= 45 ? 'medium' : 'low' as const,
    recommendation: score >= 68 ? 'Strong match' : score >= 50 ? 'Good match' : score >= 30 ? 'Moderate' : 'Review manually',
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

  const titleMatch = knowledgebase.getClosestProfile(jobTitle, { threshold: 0.35 })
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

// Handles both string ("js, python") and array ([{name:"js"}, "python"]) skills
function normalizeSkills(skills: any): string[] {
  if (!skills) return []
  if (typeof skills === 'string') {
    return skills.split(/[,;|]/).map((s: string) => s.trim().toLowerCase()).filter((s: string) => s.length > 2)
  }
  if (Array.isArray(skills)) {
    return skills.map((s: any) => ((s?.name || s) as string).toLowerCase()).filter((s: string) => s && s.length > 2)
  }
  return []
}

function extractJobSkillsFallback(jobText: string): string[] {
  const knownSkills = [
    // Office / productivity
    'excel', 'word', 'powerpoint', 'outlook', 'sharepoint', 'ms office',
    // Web / software development
    'sql', 'python', 'javascript', 'typescript', 'react', 'angular', 'vue',
    'node', 'java', 'c#', '.net', 'spring', 'php', 'ruby', 'kotlin', 'swift',
    'html', 'css', 'graphql', 'rest api', 'microservices',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
    'ci/cd', 'jenkins', 'github actions', 'git', 'linux', 'bash',
    // IT infrastructure / networking / virtualisation
    'vmware', 'vsphere', 'hyper-v', 'virtualisation', 'virtualization',
    'active directory', 'windows server', 'powershell', 'sccm', 'scom',
    'cisco', 'firewall', 'dns', 'dhcp', 'vpn', 'vlan', 'lan', 'wan',
    'tcp/ip', 'networking', 'network', 'storage', 'san', 'nas', 'backup',
    'veeam', 'itil', 'monitoring', 'nagios', 'zabbix',
    // Data & BI
    'power bi', 'tableau', 'qlik', 'ssrs', 'ssis', 'ssas',
    'data analysis', 'data analytics', 'machine learning', 'ai',
    'etl', 'data warehouse', 'big data', 'spark', 'hadoop',
    // ERP / finance systems
    'sap', 'pastel', 'sage', 'xero', 'quickbooks', 'oracle',
    // CAD / engineering
    'autocad', 'revit', 'solidworks', 'matlab', 'archicad',
    // Finance / accounting
    'ifrs', 'tax', 'audit', 'compliance', 'risk management',
    'financial reporting', 'budgeting', 'forecasting', 'financial modelling',
    // Soft / management skills
    'project management', 'stakeholder management', 'leadership',
    'communication', 'customer service', 'problem solving',
    'recruitment', 'procurement', 'reporting',
    // HR
    'ccma', 'labour relations', 'performance management', 'payroll',
    // Construction / QS
    'bill of quantities', 'cost estimation', 'jbcc', 'nec', 'ccs candy',
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
        totalYears += Math.max(0, end.getFullYear() - start.getFullYear())
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
  parts.push(`${years}yrs → ${seniorityScore === 10 ? 'Good seniority fit' : 'Reviewed'}`)
  return parts.join(' | ')
}

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

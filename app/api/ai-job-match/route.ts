import { NextRequest, NextResponse } from 'next/server'
import type { CVData } from '@/types/cv-types'

interface AIJobMatch {
  jobId: string
  matchScore: number
  reasoning: string
  skillsMatch: string[]
  skillsGap: string[]
  atsKeywords: string[]
  breakdown: {
    skills: number
    seniority: number
    experience: number
    education: number
    location: number
  }
}

const SENIORITY_LEVELS = {
  junior: ['junior', 'entry', 'graduate', 'intern', 'trainee', 'assistant'],
  mid: ['mid', 'intermediate', 'developer', 'analyst', 'specialist', 'officer'],
  senior: ['senior', 'lead', 'principal', 'expert', 'architect'],
  executive: ['manager', 'head', 'director', 'vp', 'chief', 'executive', 'ceo', 'cto', 'cfo']
}

const SA_QUALIFICATIONS = {
  matric: { nqf: 4, keywords: ['matric', 'grade 12', 'n3'] },
  certificate: { nqf: 5, keywords: ['certificate', 'n4', 'n5', 'n6'] },
  diploma: { nqf: 6, keywords: ['diploma', 'national diploma'] },
  degree: { nqf: 7, keywords: ['degree', 'bachelor', 'bcom', 'bsc', 'ba', 'beng'] },
  honours: { nqf: 8, keywords: ['honours', 'hons', 'postgraduate diploma'] },
  masters: { nqf: 9, keywords: ['masters', 'mba', 'msc', 'ma'] },
  doctorate: { nqf: 10, keywords: ['phd', 'doctorate', 'dba'] }
}

const SA_REGISTRATIONS = ['saica', 'ecsa', 'hpcsa', 'sacpcmp', 'sacap', 'saqa']

const SKILL_FAMILIES = {
  'javascript': ['js', 'javascript', 'typescript', 'react', 'vue', 'angular', 'node'],
  'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
  'java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
  'cloud': ['aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker'],
  'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'database', 'nosql'],
  'accounting': ['ifrs', 'gaap', 'financial reporting', 'audit', 'tax', 'sage', 'pastel'],
  'project management': ['agile', 'scrum', 'pmp', 'prince2', 'jira', 'project management']
}

export async function POST(request: NextRequest) {
  try {
    const { cvData, jobs } = await request.json()

    if (!cvData) {
      return NextResponse.json({ error: 'CV data is required' }, { status: 400 })
    }

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Jobs data is required' }, { status: 400 })
    }

    const matches: AIJobMatch[] = []

    for (const job of jobs) {
      try {
        const match = calculateJobMatch(cvData, job)
        matches.push(match)
      } catch (jobError) {
        console.error(`Error processing job ${job.id || job.title}:`, jobError)
      }
    }

    return NextResponse.json(matches.sort((a, b) => b.matchScore - a.matchScore))
  } catch (error) {
    console.error('AI matching error:', error)
    return NextResponse.json({
      error: 'AI matching failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function calculateJobMatch(cvData: CVData, job: any): AIJobMatch {
  const skillsScore = scoreSkills(cvData, job)
  const seniorityScore = scoreSeniority(cvData, job)
  const experienceScore = scoreExperience(cvData, job)
  const educationScore = scoreEducation(cvData, job)
  const locationScore = scoreLocation(cvData, job)

  const weights = { skills: 0.35, seniority: 0.25, experience: 0.20, education: 0.15, location: 0.05 }
  
  const matchScore = Math.round(
    skillsScore.score * weights.skills +
    seniorityScore.score * weights.seniority +
    experienceScore.score * weights.experience +
    educationScore.score * weights.education +
    locationScore.score * weights.location
  )

  const reasoning = generateReasoning(matchScore, skillsScore, seniorityScore, experienceScore, educationScore, job)

  return {
    jobId: job.id || job.url,
    matchScore,
    reasoning,
    skillsMatch: skillsScore.matched,
    skillsGap: skillsScore.missing,
    atsKeywords: extractATSKeywords(job),
    breakdown: {
      skills: Math.round(skillsScore.score),
      seniority: Math.round(seniorityScore.score),
      experience: Math.round(experienceScore.score),
      education: Math.round(educationScore.score),
      location: Math.round(locationScore.score)
    }
  }
}

function scoreSkills(cvData: CVData, job: any): { score: number, matched: string[], missing: string[] } {
  const cvSkills = extractSkills(cvData)
  const jobSkills = extractJobSkills(job)

  if (jobSkills.length === 0) return { score: 50, matched: [], missing: [] }

  const matched: string[] = []
  const cvSkillsLower = cvSkills.map(s => s.toLowerCase())

  for (const jobSkill of jobSkills) {
    const jobSkillLower = jobSkill.toLowerCase()
    
    // Direct match
    if (cvSkillsLower.some(cv => cv.includes(jobSkillLower) || jobSkillLower.includes(cv))) {
      matched.push(jobSkill)
      continue
    }

    // Skill family match
    for (const [family, variants] of Object.entries(SKILL_FAMILIES)) {
      if (variants.some(v => jobSkillLower.includes(v))) {
        if (cvSkillsLower.some(cv => variants.some(v => cv.includes(v)))) {
          matched.push(jobSkill)
          break
        }
      }
    }
  }

  const missing = jobSkills.filter(s => !matched.includes(s)).slice(0, 5)
  const score = (matched.length / jobSkills.length) * 100

  return { score, matched, missing }
}

function scoreSeniority(cvData: CVData, job: any): { score: number, reason: string } {
  const cvSeniority = detectSeniority(cvData)
  const jobSeniority = detectJobSeniority(job)

  if (cvSeniority === jobSeniority) return { score: 100, reason: 'Perfect seniority match' }
  
  const levels = ['junior', 'mid', 'senior', 'executive']
  const cvIndex = levels.indexOf(cvSeniority)
  const jobIndex = levels.indexOf(jobSeniority)
  const gap = Math.abs(cvIndex - jobIndex)

  if (gap === 1) return { score: 70, reason: 'One level difference' }
  if (gap === 2) return { score: 40, reason: 'Two levels difference' }
  return { score: 20, reason: 'Significant seniority mismatch' }
}

function scoreExperience(cvData: CVData, job: any): { score: number } {
  const yearsExp = calculateYearsOfExperience(cvData)
  const requiredYears = extractRequiredYears(job)

  if (requiredYears === 0) return { score: 70 }
  if (yearsExp >= requiredYears) return { score: 100 }
  if (yearsExp >= requiredYears * 0.7) return { score: 80 }
  if (yearsExp >= requiredYears * 0.5) return { score: 60 }
  return { score: 30 }
}

function scoreEducation(cvData: CVData, job: any): { score: number } {
  const cvNQF = getHighestNQF(cvData)
  const requiredNQF = extractRequiredNQF(job)

  if (requiredNQF === 0) return { score: 70 }
  if (cvNQF >= requiredNQF) return { score: 100 }
  if (cvNQF === requiredNQF - 1) return { score: 70 }
  if (cvNQF === requiredNQF - 2) return { score: 40 }
  return { score: 20 }
}

function scoreLocation(cvData: CVData, job: any): { score: number } {
  const cvLocation = (cvData.personalInfo?.location || '').toLowerCase()
  const jobLocation = (job.location || '').toLowerCase()

  if (!jobLocation || jobLocation.includes('remote')) return { score: 100 }
  if (cvLocation.includes(jobLocation) || jobLocation.includes(cvLocation)) return { score: 100 }
  
  const cvProvince = extractProvince(cvLocation)
  const jobProvince = extractProvince(jobLocation)
  if (cvProvince && cvProvince === jobProvince) return { score: 80 }
  
  return { score: 50 }
}

function extractSkills(cvData: CVData): string[] {
  if (typeof cvData.skills === 'string') {
    return cvData.skills.split(',').map(s => s.trim()).filter(Boolean)
  }
  if (Array.isArray(cvData.skills)) {
    return cvData.skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)
  }
  return []
}

function extractJobSkills(job: any): string[] {
  const text = `${job.description || ''} ${job.requirements?.join(' ') || ''}`
  const skills: string[] = []

  for (const [family, variants] of Object.entries(SKILL_FAMILIES)) {
    for (const variant of variants) {
      if (text.toLowerCase().includes(variant)) {
        skills.push(variant)
      }
    }
  }

  return [...new Set(skills)]
}

function detectSeniority(cvData: CVData): string {
  const title = (cvData.personalInfo?.jobTitle || '').toLowerCase()
  const yearsExp = calculateYearsOfExperience(cvData)

  for (const [level, keywords] of Object.entries(SENIORITY_LEVELS)) {
    if (keywords.some(k => title.includes(k))) return level
  }

  if (yearsExp >= 10) return 'senior'
  if (yearsExp >= 5) return 'mid'
  if (yearsExp >= 2) return 'mid'
  return 'junior'
}

function detectJobSeniority(job: any): string {
  const title = (job.title || '').toLowerCase()
  const desc = (job.description || '').toLowerCase()

  for (const [level, keywords] of Object.entries(SENIORITY_LEVELS)) {
    if (keywords.some(k => title.includes(k) || desc.includes(k))) return level
  }

  return 'mid'
}

function calculateYearsOfExperience(cvData: CVData): number {
  if (!cvData.experience || cvData.experience.length === 0) return 0

  let totalMonths = 0
  for (const exp of cvData.experience) {
    const start = new Date(exp.startDate)
    const end = exp.endDate.toLowerCase().includes('present') ? new Date() : new Date(exp.endDate)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    totalMonths += Math.max(0, months)
  }

  return Math.round(totalMonths / 12)
}

function extractRequiredYears(job: any): number {
  const text = `${job.title || ''} ${job.description || ''} ${job.requirements?.join(' ') || ''}`
  const match = text.match(/(\d+)\+?\s*years?/i)
  return match ? parseInt(match[1]) : 0
}

function getHighestNQF(cvData: CVData): number {
  if (!cvData.education || cvData.education.length === 0) return 4

  let highest = 4
  for (const edu of cvData.education) {
    if (edu.nqfLevel) {
      highest = Math.max(highest, edu.nqfLevel)
    } else {
      const degree = (edu.degree || '').toLowerCase()
      for (const [qual, data] of Object.entries(SA_QUALIFICATIONS)) {
        if (data.keywords.some(k => degree.includes(k))) {
          highest = Math.max(highest, data.nqf)
        }
      }
    }
  }

  return highest
}

function extractRequiredNQF(job: any): number {
  const text = `${job.description || ''} ${job.requirements?.join(' ') || ''}`.toLowerCase()

  for (const [qual, data] of Object.entries(SA_QUALIFICATIONS).reverse()) {
    if (data.keywords.some(k => text.includes(k))) {
      return data.nqf
    }
  }

  return 0
}

function extractProvince(location: string): string | null {
  const provinces = ['gauteng', 'western cape', 'kwazulu-natal', 'eastern cape', 'free state', 'limpopo', 'mpumalanga', 'northern cape', 'north west']
  for (const province of provinces) {
    if (location.includes(province)) return province
  }
  return null
}

function extractATSKeywords(job: any): string[] {
  const text = `${job.title} ${job.description} ${job.requirements?.join(' ') || ''}`
  const words = text.toLowerCase().split(/\W+/)
  const keywords = words.filter(word => 
    word.length > 3 && 
    !['the', 'and', 'for', 'with', 'you', 'will', 'this', 'that', 'from', 'have', 'been'].includes(word)
  )
  
  const frequency: Record<string, number> = {}
  keywords.forEach(word => frequency[word] = (frequency[word] || 0) + 1)
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([word]) => word)
}

function generateReasoning(
  matchScore: number,
  skillsScore: any,
  seniorityScore: any,
  experienceScore: any,
  educationScore: any,
  job: any
): string {
  const parts: string[] = []

  if (matchScore >= 80) {
    parts.push(`Strong ${matchScore}% match for ${job.title}.`)
  } else if (matchScore >= 60) {
    parts.push(`Good ${matchScore}% match for ${job.title}.`)
  } else if (matchScore >= 40) {
    parts.push(`Moderate ${matchScore}% match for ${job.title}.`)
  } else {
    parts.push(`${matchScore}% match for ${job.title}.`)
  }

  if (skillsScore.matched.length > 0) {
    parts.push(`${skillsScore.matched.length} matching skills.`)
  }

  if (skillsScore.missing.length > 0) {
    parts.push(`Missing: ${skillsScore.missing.slice(0, 3).join(', ')}.`)
  }

  if (seniorityScore.score < 70) {
    parts.push(`Seniority mismatch detected.`)
  }

  return parts.join(' ')
}

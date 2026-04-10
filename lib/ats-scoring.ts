import type { CVData } from '../types/cv-types'
import { classifyCV, scoreAgainstProfile, getHighestNQF, extractRegistrations, detectSAFlags } from './profile-scorer'
import { detectJobFamily } from './sa-job-knowledgebase'

export interface ATSScore {
  totalScore: number
  maxScore: number
  profileFamily: string
  profileConfidence: 'high' | 'medium' | 'low'
  sections: {
    [key: string]: {
      score: number
      maxScore: number
      feedback: string[]
      priority: 'high' | 'medium' | 'low'
    }
  }
}

export interface DetailedSuggestion {
  type: 'add' | 'modify' | 'remove' | 'format'
  section: string
  field?: string
  current?: string
  suggested: string
  reason: string
  impact: 'high' | 'medium' | 'low'
  examples?: string[]
}

const ACTION_VERBS = [
  'achieved', 'developed', 'implemented', 'managed', 'increased', 'created', 'led', 'improved',
  'optimized', 'streamlined', 'enhanced', 'delivered', 'executed', 'coordinated', 'facilitated',
  'generated', 'launched', 'maintained', 'negotiated', 'organized', 'performed', 'produced',
  'reduced', 'resolved', 'secured', 'supervised', 'transformed', 'utilized', 'validated'
]

export const calculateATSScore = (cvData: CVData, jobDescription?: string): ATSScore => {
  const sections: ATSScore['sections'] = {}
  let totalScore = 0
  const maxScore = 100

  // Classify CV against SA job profiles
  const classification = classifyCV(cvData)
  const topProfile = classification.topMatch

  // Detect job profile from description if provided
  const jobProfile = jobDescription
    ? detectJobFamily(jobDescription)[0]?.profile
    : null

  // Use job profile for scoring if available, otherwise use CV's detected profile
  const scoringProfile = jobProfile || topProfile.profileId
    ? require('./sa-job-knowledgebase').SA_JOB_PROFILES.find((p: any) => p.id === (jobProfile?.id || topProfile.profileId))
    : null

  // ── SECTION 1: Contact completeness (15 pts) ──
  const contactScore = scoreContact(cvData)
  sections.contact = contactScore
  totalScore += contactScore.score

  // ── SECTION 2: Profile-aware skills (30 pts) ──
  const skillsScore = scoreSkillsWithProfile(cvData, scoringProfile)
  sections.skills = skillsScore
  totalScore += skillsScore.score

  // ── SECTION 3: Experience quality (20 pts) ──
  const expScore = scoreExperience(cvData)
  sections.experience = expScore
  totalScore += expScore.score

  // ── SECTION 4: Education & NQF (15 pts) ──
  const eduScore = scoreEducation(cvData, scoringProfile)
  sections.education = eduScore
  totalScore += eduScore.score

  // ── SECTION 5: SA-specific (10 pts) ──
  const saScore = scoreSAContext(cvData, scoringProfile)
  sections.sa_context = saScore
  totalScore += saScore.score

  // ── SECTION 6: Job description match (10 pts) ──
  if (jobDescription) {
    const jdScore = scoreJobDescriptionMatch(cvData, jobDescription, scoringProfile)
    sections.job_match = jdScore
    totalScore += jdScore.score
  } else {
    totalScore += 10 // full points if no JD provided
  }

  return {
    totalScore: Math.min(100, Math.round(totalScore)),
    maxScore,
    profileFamily: topProfile.profileFamily,
    profileConfidence: topProfile.confidence,
    sections
  }
}

function scoreContact(cvData: CVData) {
  const feedback: string[] = []
  let score = 0

  if (cvData.personalInfo?.email && cvData.personalInfo?.phone) {
    score += 8
  } else {
    if (!cvData.personalInfo?.email) feedback.push('Add your email address')
    if (!cvData.personalInfo?.phone) feedback.push('Add your phone number')
  }

  if (cvData.personalInfo?.location) score += 4
  else feedback.push('Add your location (city and province)')

  if (cvData.personalInfo?.linkedIn) score += 3
  else feedback.push('Add your LinkedIn profile URL')

  return { score, maxScore: 15, feedback, priority: 'high' as const }
}

function scoreSkillsWithProfile(cvData: CVData, profile: any) {
  const feedback: string[] = []
  let score = 0

  const skillsArray = Array.isArray(cvData.skills)
    ? cvData.skills.map(s => typeof s === 'string' ? s : s.name)
    : typeof cvData.skills === 'string'
    ? cvData.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  if (skillsArray.length === 0) {
    feedback.push('Add your skills section — this is critical for ATS systems')
    return { score: 0, maxScore: 30, feedback, priority: 'high' as const }
  }

  score += Math.min(10, skillsArray.length) // up to 10 pts for having skills

  if (profile) {
    const cvSkillsLower = skillsArray.map(s => s.toLowerCase())
    const criticalSkills = profile.coreSkills.technical.slice(0, 5)
    const matched = criticalSkills.filter((s: string) =>
      cvSkillsLower.some(cv => cv.includes(s.toLowerCase()) || s.toLowerCase().includes(cv))
    )
    score += (matched.length / criticalSkills.length) * 15

    const missing = criticalSkills.filter((s: string) =>
      !cvSkillsLower.some(cv => cv.includes(s.toLowerCase()) || s.toLowerCase().includes(cv))
    )
    if (missing.length > 0) {
      feedback.push(`Add these ${profile.family} skills: ${missing.slice(0, 3).join(', ')}`)
    }

    // Tool skills
    const toolMatches = profile.coreSkills.tools.filter((t: string) =>
      cvSkillsLower.some(cv => cv.includes(t.toLowerCase()) || t.toLowerCase().includes(cv))
    )
    score += Math.min(5, toolMatches.length * 1.5)
    if (toolMatches.length === 0) {
      feedback.push(`Add tool proficiencies relevant to ${profile.family} (e.g. ${profile.coreSkills.tools.slice(0, 3).join(', ')})`)
    }
  } else {
    score += 10 // no profile — give partial credit
    feedback.push('Categorize your skills into Technical, Tools, and Soft Skills')
  }

  return { score: Math.round(score), maxScore: 30, feedback, priority: 'high' as const }
}

function scoreExperience(cvData: CVData) {
  const feedback: string[] = []
  let score = 0

  if (!cvData.experience?.length) {
    feedback.push('Add your work experience')
    return { score: 0, maxScore: 20, feedback, priority: 'high' as const }
  }

  score += Math.min(8, cvData.experience.length * 3) // up to 8 pts for entries

  const hasActionVerbs = cvData.experience.some(exp =>
    ACTION_VERBS.some(verb => (exp.description || '').toLowerCase().includes(verb))
  )
  if (hasActionVerbs) score += 6
  else feedback.push('Start bullet points with action verbs (achieved, implemented, managed, etc.)')

  const hasQuantified = cvData.experience.some(exp =>
    /\d+%|\d+\s*(million|thousand|k\b)|r\s*\d+/i.test(exp.description || '')
  )
  if (hasQuantified) score += 6
  else feedback.push('Add quantifiable achievements (e.g. "Increased revenue by 23%", "Managed R2M budget")')

  return { score: Math.round(score), maxScore: 20, feedback, priority: 'high' as const }
}

function scoreEducation(cvData: CVData, profile: any) {
  const feedback: string[] = []
  let score = 0

  if (!cvData.education?.length) {
    feedback.push('Add your education history')
    return { score: 0, maxScore: 15, feedback, priority: 'medium' as const }
  }

  score += 5 // has education

  const nqf = getHighestNQF(cvData)
  if (profile) {
    if (nqf >= profile.preferredNQF) {
      score += 10
    } else if (nqf >= profile.minNQF) {
      score += 7
      feedback.push(`NQF ${profile.preferredNQF} preferred for ${profile.family} roles — consider further study`)
    } else {
      score += 3
      feedback.push(`NQF ${profile.minNQF} is the minimum for ${profile.family} roles — your highest is NQF ${nqf}`)
    }
  } else {
    score += nqf >= 7 ? 10 : nqf >= 6 ? 7 : 4
  }

  return { score: Math.round(score), maxScore: 15, feedback, priority: 'medium' as const }
}

function scoreSAContext(cvData: CVData, profile: any) {
  const feedback: string[] = []
  let score = 0

  const regs = extractRegistrations(cvData)
  const flags = detectSAFlags(cvData)

  if (profile) {
    const requiredRegs = profile.professionalRegistrations.filter((r: any) => r.required)
    if (requiredRegs.length > 0) {
      const hasRequired = requiredRegs.some((r: any) =>
        regs.some(cv => cv.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(cv))
      )
      if (hasRequired) {
        score += 6
      } else {
        feedback.push(`Add your ${requiredRegs[0].name} registration — required for ${profile.family} roles`)
      }
    } else {
      score += 4
    }

    if (profile.saSpecificFlags.driversLicenceRequired && !flags.driversLicence) {
      feedback.push("Add your driver's licence — required for this role type")
    } else if (flags.driversLicence) {
      score += 2
    }
  }

  if (cvData.personalInfo?.professionalRegistration) score += 2
  if (flags.eeStatus) score += 1
  if ((cvData.personalInfo?.languages?.length || 0) > 1) score += 1

  return { score: Math.min(10, Math.round(score)), maxScore: 10, feedback, priority: 'medium' as const }
}

function scoreJobDescriptionMatch(cvData: CVData, jobDescription: string, profile: any) {
  const feedback: string[] = []
  let score = 0

  const cvText = [
    cvData.summary || '',
    ...(cvData.experience?.map(e => e.description) || []),
    typeof cvData.skills === 'string' ? cvData.skills : (cvData.skills as any[])?.map((s: any) => s.name || s).join(' ') || ''
  ].join(' ').toLowerCase()

  const jdWords = jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 4)
  const stopWords = new Set(['their', 'about', 'which', 'would', 'should', 'could', 'have', 'will', 'with', 'from', 'this', 'that', 'they', 'been'])
  const meaningful = [...new Set(jdWords.filter(w => !stopWords.has(w)))]

  const matched = meaningful.filter(w => cvText.includes(w))
  const matchRate = matched.length / Math.max(meaningful.length, 1)

  score = Math.round(matchRate * 10)

  if (matchRate < 0.4) {
    feedback.push('Your CV has low keyword overlap with this job description — tailor it more closely')
  } else if (matchRate < 0.6) {
    feedback.push('Good keyword match — consider adding a few more terms from the job description')
  }

  return { score, maxScore: 10, feedback, priority: 'high' as const }
}

export const getATSReadinessPercentage = (score: ATSScore): number => {
  return Math.round((score.totalScore / score.maxScore) * 100)
}

export const getSectionTips = (section: string): string[] => {
  const tips: Record<string, string[]> = {
    contact: ['Include a professional email', 'Add phone with country code (+27)', 'Specify city and province', 'Add LinkedIn URL'],
    skills: ['List technical skills first', 'Include tool proficiencies', 'Match skills to job requirements', 'Use industry-standard terminology'],
    experience: ['Start bullets with action verbs', 'Quantify achievements with numbers', 'Focus on impact not just duties', 'Include relevant SA industry context'],
    education: ['List most recent first', 'Include NQF level if known', 'Add SAQA ID for SA qualifications', 'Mention relevant certifications'],
    sa_context: ['Add professional registration numbers', "Include driver's licence if applicable", 'Mention EE status if relevant', 'List SA-specific tools and systems'],
    job_match: ['Mirror key phrases from the job description', 'Include industry-specific terminology', 'Highlight relevant achievements', 'Tailor your summary to the role']
  }
  return tips[section] || []
}

/**
 * SA Profile Scoring Engine
 * Scores a CV against a job family profile with partial credit,
 * deal-breakers, gap messaging, and confidence scores.
 */

import Fuse from 'fuse.js'
import type { CVData, SAFlags } from '@/types/cv-types'
import { SA_JOB_PROFILES, type SAJobProfile, type SeniorityTier } from './sa-job-knowledgebase'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ScoredSkill {
  name: string
  level?: 'beginner' | 'intermediate' | 'expert'
  yearsOfExperience?: number
}

export interface ProfileMatchResult {
  profileId: string
  profileFamily: string
  matchScore: number          // 0-100
  confidence: 'high' | 'medium' | 'low'
  detectedTier: SeniorityTier
  strengths: string[]
  gaps: string[]
  dealBreakers: string[]
  recommendation: 'Strong match' | 'Moderate match' | 'Weak match' | 'Not suitable'
  breakdown: {
    nqf: number
    skills: number
    registrations: number
    experience: number
    saFlags: number
  }
}

export interface ClassificationResult {
  topMatch: ProfileMatchResult
  allMatches: ProfileMatchResult[]
  isAmbiguous: boolean        // true if top 2 scores are within 10 points
  fallbackToGeneralist: boolean
}

// ─────────────────────────────────────────────
// NQF DETECTION
// ─────────────────────────────────────────────

const NQF_MAP: Record<string, number> = {
  'matric': 4, 'grade 12': 4, 'n3': 4,
  'n4': 5, 'n5': 5, 'n6': 5, 'certificate': 5,
  'national diploma': 6, 'nd ': 6, 'diploma': 6,
  'bcom': 7, 'bsc': 7, 'ba ': 7, 'beng': 7, 'btech': 7,
  'bachelor': 7, 'degree': 7, 'llb': 7, 'mbchb': 7, 'mbbch': 7,
  'bcur': 7, 'bpharm': 7, 'bsoc': 7,
  'honours': 8, 'hons': 8, 'postgraduate diploma': 8, 'pgdip': 8,
  'masters': 9, 'mba': 9, 'msc': 9, 'mcom': 9, 'ma ': 9, 'meng': 9, 'llm': 9,
  'phd': 10, 'doctorate': 10, 'dba': 10, 'dphil': 10
}

export function getHighestNQF(cvData: CVData): number {
  let highest = 4

  if (!cvData.education?.length) return highest

  for (const edu of cvData.education) {
    // Use explicit nqfLevel if set
    if (edu.nqfLevel) {
      highest = Math.max(highest, edu.nqfLevel)
      continue
    }

    const qual = (edu.degree || '').toLowerCase()
    for (const [key, level] of Object.entries(NQF_MAP)) {
      if (qual.includes(key)) {
        highest = Math.max(highest, level)
      }
    }
  }

  return highest
}

// ─────────────────────────────────────────────
// SKILL EXTRACTION
// ─────────────────────────────────────────────

export function extractScoredSkills(cvData: CVData): ScoredSkill[] {
  const skills: ScoredSkill[] = []

  // From structured skills field
  if (Array.isArray(cvData.skills)) {
    for (const s of cvData.skills) {
      if (typeof s === 'string') {
        skills.push({ name: s })
      } else {
        skills.push({ name: s.name, level: s.level, yearsOfExperience: s.yearsOfExperience })
      }
    }
  } else if (typeof cvData.skills === 'string') {
    cvData.skills.split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
      skills.push({ name })
    })
  }

  // Also extract from experience descriptions (surface-level keyword extraction)
  const expText = cvData.experience?.map(e => e.description || '').join(' ').toLowerCase() || ''
  const summaryText = (cvData.summary || '').toLowerCase()
  const allText = `${expText} ${summaryText}`

  // Common SA market skills to detect from free text
  const detectableSkills = [
    'ifrs', 'gaap', 'sap', 'sage', 'pastel', 'xero', 'excel', 'power bi',
    'python', 'javascript', 'typescript', 'react', 'node', 'sql', 'aws', 'azure',
    'autocad', 'solidworks', 'revit', 'ms project', 'primavera',
    'agile', 'scrum', 'jira', 'git', 'docker', 'kubernetes',
    'popia', 'king iv', 'b-bbee', 'nhi', 'ohs act', 'mhsa',
    'salesforce', 'hubspot', 'google analytics', 'seo',
    'meditech', 'goodx', 'elixir'
  ]

  const existingNames = new Set(skills.map(s => s.name.toLowerCase()))
  for (const skill of detectableSkills) {
    if (allText.includes(skill) && !existingNames.has(skill)) {
      skills.push({ name: skill })
      existingNames.add(skill)
    }
  }

  return skills
}

// ─────────────────────────────────────────────
// REGISTRATION EXTRACTION
// ─────────────────────────────────────────────

const KNOWN_REGISTRATIONS = [
  'saica', 'ca(sa)', 'chartered accountant',
  'ecsa', 'pr.eng', 'pr eng',
  'hpcsa',
  'sanc',
  'sapc',
  'sacssp',
  'sacpcmp',
  'irba',
  'cima', 'acca', 'cfa',
  'pmp', 'prince2',
  'cissp', 'cisa',
  'aws certified', 'azure certified', 'google cloud certified',
  'lsca', 'admitted attorney', 'advocate',
  'apics', 'cscp',
  'iodsa'
]

export function extractRegistrations(cvData: CVData): string[] {
  const regs = new Set<string>()

  // From explicit registrations field
  if (cvData.registrations?.length) {
    cvData.registrations.forEach(r => regs.add(r.toLowerCase()))
  }

  // From personalInfo.professionalRegistration
  if (cvData.personalInfo?.professionalRegistration) {
    regs.add(cvData.personalInfo.professionalRegistration.toLowerCase())
  }

  // Scan all text
  const allText = [
    cvData.summary || '',
    cvData.personalInfo?.jobTitle || '',
    ...(cvData.experience?.map(e => e.description) || []),
    ...(cvData.education?.map(e => `${e.degree} ${e.institution}`) || []),
    ...(cvData.certifications || [])
  ].join(' ').toLowerCase()

  for (const reg of KNOWN_REGISTRATIONS) {
    if (allText.includes(reg)) {
      regs.add(reg)
    }
  }

  return Array.from(regs)
}

// ─────────────────────────────────────────────
// SA FLAG DETECTION
// ─────────────────────────────────────────────

export function detectSAFlags(cvData: CVData): SAFlags {
  const allText = [
    cvData.summary || '',
    ...(cvData.experience?.map(e => e.description) || []),
    cvData.personalInfo?.location || ''
  ].join(' ').toLowerCase()

  const flags: SAFlags = { ...cvData.saFlags }

  // EE status detection
  if (!flags.eeStatus) {
    flags.eeStatus =
      allText.includes('employment equity') ||
      allText.includes('ee candidate') ||
      allText.includes('ee compliant') ||
      allText.includes('previously disadvantaged')
  }

  // Driver's licence detection
  if (!flags.driversLicence) {
    flags.driversLicence =
      allText.includes("driver's licence") ||
      allText.includes("drivers licence") ||
      allText.includes("driver's license") ||
      allText.includes('code 8') ||
      allText.includes('code 10') ||
      allText.includes('code 14')
  }

  // Own vehicle detection
  if (!flags.ownVehicle) {
    flags.ownVehicle =
      allText.includes('own vehicle') ||
      allText.includes('own reliable transport') ||
      allText.includes('own transport')
  }

  // Citizenship detection
  if (!flags.citizenship) {
    if (allText.includes('south african citizen') || allText.includes('sa citizen')) {
      flags.citizenship = 'South Africa'
    }
  }

  // Security clearance detection
  if (!flags.securityClearance) {
    flags.securityClearance =
      allText.includes('security clearance') ||
      allText.includes('top secret') ||
      allText.includes('secret clearance')
  }

  return flags
}

// ─────────────────────────────────────────────
// SENIORITY DETECTION
// ─────────────────────────────────────────────

function calculateYearsExperience(cvData: CVData): number {
  if (!cvData.experience?.length) return 0
  let totalMonths = 0
  for (const exp of cvData.experience) {
    try {
      const start = new Date(exp.startDate)
      const end = exp.endDate?.toLowerCase().includes('present') ? new Date() : new Date(exp.endDate)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      totalMonths += Math.max(0, months)
    } catch { continue }
  }
  return Math.round(totalMonths / 12)
}

function detectSeniority(cvData: CVData, profile: SAJobProfile): SeniorityTier {
  const years = calculateYearsExperience(cvData)
  const title = (cvData.personalInfo?.jobTitle || '').toLowerCase()

  // Check title against profile tiers first
  for (const tier of [...profile.experienceTiers].reverse()) {
    if (tier.typicalTitles.some(t => title.includes(t.toLowerCase()))) {
      return tier.level
    }
  }

  // Fall back to years
  const sorted = [...profile.experienceTiers].sort((a, b) => b.minYears - a.minYears)
  for (const tier of sorted) {
    if (years >= tier.minYears) return tier.level
  }

  return 'junior'
}

// ─────────────────────────────────────────────
// CORE SCORING
// ─────────────────────────────────────────────

export function scoreAgainstProfile(cvData: CVData, profile: SAJobProfile): ProfileMatchResult {
  const detectedTier = detectSeniority(cvData, profile)
  const cvNQF = getHighestNQF(cvData)
  const cvSkills = extractScoredSkills(cvData)
  const cvRegs = extractRegistrations(cvData)
  const saFlags = detectSAFlags(cvData)
  const years = calculateYearsExperience(cvData)

  const strengths: string[] = []
  const gaps: string[] = []
  const dealBreakers: string[] = []
  let totalScore = 0

  const breakdown = { nqf: 0, skills: 0, registrations: 0, experience: 0, saFlags: 0 }

  // ── NQF SCORING (25 points) ──────────────────
  const nqfDiff = cvNQF - profile.minNQF
  if (nqfDiff >= 1) {
    breakdown.nqf = 25
    strengths.push(`Qualification meets or exceeds NQF ${profile.minNQF} requirement`)
  } else if (nqfDiff === 0) {
    breakdown.nqf = 25
    strengths.push(`Qualification meets NQF ${profile.minNQF} requirement`)
  } else if (nqfDiff === -1) {
    breakdown.nqf = 12
    gaps.push(`NQF ${profile.minNQF} preferred — your highest qualification is NQF ${cvNQF}`)
  } else {
    breakdown.nqf = 0
    dealBreakers.push(`Qualification is significantly below the NQF ${profile.minNQF} minimum for this role`)
  }

  // ── SKILLS SCORING (35 points) ───────────────
  const cvSkillNames = cvSkills.map(s => s.name.toLowerCase())
  const criticalSkills = profile.coreSkills.technical.slice(0, 5)
  const supportingSkills = profile.coreSkills.technical.slice(5)
  const toolSkills = profile.coreSkills.tools

  let criticalMatches = 0
  for (const skill of criticalSkills) {
    if (cvSkillNames.some(cv => cv.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cv))) {
      criticalMatches++
      strengths.push(`Has ${skill}`)
    } else {
      gaps.push(`Missing ${skill} — critical for ${profile.family} roles`)
    }
  }

  const supportingMatches = supportingSkills.filter(skill =>
    cvSkillNames.some(cv => cv.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cv))
  ).length

  const toolMatches = toolSkills.filter(tool =>
    cvSkillNames.some(cv => cv.includes(tool.toLowerCase()) || tool.toLowerCase().includes(cv))
  ).length

  const criticalScore = (criticalMatches / Math.max(criticalSkills.length, 1)) * 20
  const supportingScore = (supportingMatches / Math.max(supportingSkills.length, 1)) * 10
  const toolScore = (toolMatches / Math.max(toolSkills.length, 1)) * 5
  breakdown.skills = Math.round(criticalScore + supportingScore + toolScore)

  if (criticalMatches === 0 && criticalSkills.length > 0) {
    dealBreakers.push(`No critical ${profile.family} skills detected`)
  }

  // ── REGISTRATION SCORING (20 points) ─────────
  const requiredRegs = profile.professionalRegistrations.filter(r => r.required)
  const preferredRegs = profile.professionalRegistrations.filter(r => !r.required)

  if (requiredRegs.length > 0) {
    const requiredMatches = requiredRegs.filter(reg =>
      cvRegs.some(cv => cv.includes(reg.name.toLowerCase()) || reg.name.toLowerCase().includes(cv))
    )
    const requiredMissing = requiredRegs.filter(reg =>
      !cvRegs.some(cv => cv.includes(reg.name.toLowerCase()) || reg.name.toLowerCase().includes(cv))
    )

    if (requiredMatches.length === requiredRegs.length) {
      breakdown.registrations += 15
      strengths.push(`All required registrations confirmed (${requiredMatches.map(r => r.name).join(', ')})`)
    } else if (requiredMatches.length > 0) {
      breakdown.registrations += 8
      gaps.push(`Missing required registration: ${requiredMissing.map(r => `${r.name} (${r.body})`).join(', ')}`)
    } else {
      dealBreakers.push(`Missing required professional registration: ${requiredMissing.map(r => `${r.name} via ${r.body}`).join(', ')}`)
    }
  } else {
    breakdown.registrations += 15 // No required regs — full points
  }

  const preferredMatches = preferredRegs.filter(reg =>
    cvRegs.some(cv => cv.includes(reg.name.toLowerCase()) || reg.name.toLowerCase().includes(cv))
  )
  if (preferredMatches.length > 0) {
    breakdown.registrations += 5
    strengths.push(`Has preferred registration: ${preferredMatches.map(r => r.name).join(', ')}`)
  }

  // ── EXPERIENCE SCORING (15 points) ───────────
  const tierDef = profile.experienceTiers.find(t => t.level === detectedTier)
  if (tierDef) {
    if (years >= tierDef.minYears) {
      breakdown.experience = 15
      strengths.push(`${years} years experience aligns with ${detectedTier} tier`)
    } else if (years >= tierDef.minYears * 0.7) {
      breakdown.experience = 10
      gaps.push(`${tierDef.minYears} years preferred for ${detectedTier} roles — you have ${years}`)
    } else {
      breakdown.experience = 5
      gaps.push(`Experience below typical ${detectedTier} threshold of ${tierDef.minYears} years`)
    }
  } else {
    breakdown.experience = 8
  }

  // ── SA FLAGS SCORING (5 points) ──────────────
  let flagScore = 0
  if (profile.saSpecificFlags.driversLicenceRequired && saFlags.driversLicence) {
    flagScore += 2
    strengths.push("Driver's licence confirmed")
  } else if (profile.saSpecificFlags.driversLicenceRequired && !saFlags.driversLicence) {
    gaps.push("Driver's licence required for this role")
  }
  if (profile.saSpecificFlags.eePreferred && saFlags.eeStatus) {
    flagScore += 2
    strengths.push('EE candidate — preferred for this role')
  }
  if (profile.saSpecificFlags.securityClearance && saFlags.securityClearance) {
    flagScore += 1
    strengths.push('Security clearance confirmed')
  }
  breakdown.saFlags = Math.min(5, flagScore)

  // ── TOTAL + DEAL-BREAKER PENALTY ─────────────
  totalScore = breakdown.nqf + breakdown.skills + breakdown.registrations + breakdown.experience + breakdown.saFlags

  // Apply gap penalties from profile
  for (const penalty of profile.gapPenalties) {
    const hasPenaltySkill = cvSkillNames.some(cv =>
      cv.includes(penalty.skill.toLowerCase()) || penalty.skill.toLowerCase().includes(cv)
    )
    if (!hasPenaltySkill && penalty.weight >= 0.7) {
      gaps.push(penalty.message)
    }
  }

  // Deal-breaker penalty: halve the score
  if (dealBreakers.length > 0) {
    totalScore = Math.round(totalScore * 0.5)
  }

  totalScore = Math.max(0, Math.min(100, totalScore))

  const recommendation =
    totalScore >= 75 ? 'Strong match' :
    totalScore >= 55 ? 'Moderate match' :
    totalScore >= 35 ? 'Weak match' : 'Not suitable'

  const confidence =
    totalScore >= 70 ? 'high' :
    totalScore >= 45 ? 'medium' : 'low'

  return {
    profileId: profile.id,
    profileFamily: profile.family,
    matchScore: totalScore,
    confidence,
    detectedTier,
    strengths,
    gaps,
    dealBreakers,
    recommendation,
    breakdown
  }
}

// ─────────────────────────────────────────────
// FUZZY PROFILE CLASSIFIER
// ─────────────────────────────────────────────

export function classifyCV(cvData: CVData): ClassificationResult {
  // Build text corpus from CV
  const cvText = [
    cvData.personalInfo?.jobTitle || '',
    cvData.summary || '',
    ...(cvData.experience?.map(e => `${e.title} ${e.description}`) || []),
    ...(cvData.education?.map(e => e.degree) || []),
    typeof cvData.skills === 'string' ? cvData.skills : (cvData.skills as any[])?.map((s: any) => s.name || s).join(' ') || ''
  ].join(' ')

  // Fuse.js fuzzy match against detection keywords
  const fuseData = SA_JOB_PROFILES.map(profile => ({
    id: profile.id,
    family: profile.family,
    keywords: profile.detectionKeywords.join(' '),
    titles: profile.typicalTitles.join(' ')
  }))

  const fuse = new Fuse(fuseData, {
    keys: ['keywords', 'titles', 'family'],
    threshold: 0.4,
    includeScore: true
  })

  const fuseResults = fuse.search(cvText.toLowerCase())

  // Also do keyword frequency scoring as a secondary signal
  const keywordScores = SA_JOB_PROFILES.map(profile => {
    const lower = cvText.toLowerCase()
    const matches = profile.detectionKeywords.filter(kw => lower.includes(kw)).length
    return { id: profile.id, keywordScore: matches / profile.detectionKeywords.length }
  })

  // Score each profile fully
  const allMatches = SA_JOB_PROFILES.map(profile => {
    const result = scoreAgainstProfile(cvData, profile)

    // Boost score if fuse.js also matched this profile
    const fuseMatch = fuseResults.find(r => r.item.id === profile.id)
    const fuseBoost = fuseMatch ? (1 - (fuseMatch.score || 1)) * 10 : 0

    const kwMatch = keywordScores.find(k => k.id === profile.id)
    const kwBoost = (kwMatch?.keywordScore || 0) * 10

    return {
      ...result,
      matchScore: Math.min(100, Math.round(result.matchScore + fuseBoost + kwBoost))
    }
  }).sort((a, b) => b.matchScore - a.matchScore)

  const topMatch = allMatches[0]
  const secondMatch = allMatches[1]
  const isAmbiguous = Math.abs(topMatch.matchScore - secondMatch.matchScore) <= 10
  const fallbackToGeneralist = topMatch.matchScore < 30

  return {
    topMatch,
    allMatches,
    isAmbiguous,
    fallbackToGeneralist
  }
}

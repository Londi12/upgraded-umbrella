import { NextRequest, NextResponse } from 'next/server'
import type { CVData } from '@/types/cv-types'
import { classifyCV, scoreAgainstProfile, extractRegistrations, detectSAFlags } from '@/lib/profile-scorer'
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

    if (!cvData) {
      return NextResponse.json({ error: 'CV data is required' }, { status: 400 })
    }
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Jobs data is required' }, { status: 400 })
    }

    // Step 1: Classify the CV
    const classification = classifyCV(cvData as CVData)
    const cvProfile = confirmedFamily
      ? SA_JOB_PROFILES.find(p => p.id === confirmedFamily) || classification.topMatch
      : classification.topMatch

    // If ambiguous and no confirmed family, return disambiguation request
    if (classification.isAmbiguous && !confirmedFamily) {
      return NextResponse.json({
        needsDisambiguation: true,
        topMatches: classification.allMatches.slice(0, 3).map(m => ({
          id: m.profileId,
          family: m.profileFamily,
          confidence: m.matchScore,
          tier: m.detectedTier
        }))
      })
    }

    // Step 2: Score each job against the CV using the knowledgebase
    const results: JobMatchResult[] = []

    for (const job of jobs) {
      try {
        const result = scoreJobAgainstCV(cvData as CVData, job, cvProfile.profileId, classification.isAmbiguous)
        results.push(result)
      } catch (err) {
        console.error(`Error scoring job ${job.id || job.title}:`, err)
      }
    }

    return NextResponse.json({
      matches: results.sort((a, b) => b.matchScore - a.matchScore),
      cvClassification: {
        detectedFamily: cvProfile.profileFamily,
        confidence: cvProfile.confidence,
        tier: cvProfile.detectedTier,
        isAmbiguous: classification.isAmbiguous
      }
    })

  } catch (error) {
    console.error('Job match error:', error)
    return NextResponse.json({
      error: 'Job matching failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function scoreJobAgainstCV(
  cvData: CVData,
  job: any,
  cvProfileId: string,
  isAmbiguous: boolean
): JobMatchResult {
  // Detect the job's family from its title + description
  const jobText = `${job.title || ''} ${job.description || ''} ${(job.requirements || []).join(' ')}`
  const jobFamilyMatches = detectJobFamily(jobText)
  const jobProfile = jobFamilyMatches[0]?.profile || null

  // Score CV against the job's detected profile
  // If job profile matches CV profile — use full knowledgebase scoring
  // If different — use cross-profile scoring with penalty
  const cvProfile = SA_JOB_PROFILES.find(p => p.id === cvProfileId)

  let profileResult
  if (jobProfile && cvProfile) {
    if (jobProfile.id === cvProfile.id) {
      // Same family — full knowledgebase scoring
      profileResult = scoreAgainstProfile(cvData, jobProfile)
    } else {
      // Different families — score against job's profile, apply cross-family penalty
      profileResult = scoreAgainstProfile(cvData, jobProfile)
      profileResult = {
        ...profileResult,
        matchScore: Math.round(profileResult.matchScore * 0.75),
        gaps: [
          `Your CV is classified as ${cvProfile.family} — this role is in ${jobProfile.family}`,
          ...profileResult.gaps
        ]
      }
    }
  } else {
    // Fallback: score against CV's own profile
    profileResult = scoreAgainstProfile(cvData, cvProfile || SA_JOB_PROFILES[0])
  }

  // Location scoring (kept from original — lightweight)
  const locationBoost = scoreLocation(cvData, job)
  const finalScore = Math.min(100, Math.round(profileResult.matchScore * 0.95 + locationBoost * 0.05))

  // Extract ATS keywords from job
  const atsKeywords = extractATSKeywords(jobText)

  // Build reasoning string
  const reasoning = buildReasoning(finalScore, profileResult, job, jobProfile?.family)

  return {
    jobId: job.id || job.url,
    matchScore: finalScore,
    confidence: profileResult.confidence,
    recommendation: profileResult.recommendation,
    reasoning,
    strengths: profileResult.strengths,
    gaps: profileResult.gaps,
    dealBreakers: profileResult.dealBreakers,
    skillsMatch: profileResult.strengths.filter(s => s.startsWith('Has ')).map(s => s.replace('Has ', '')),
    skillsGap: profileResult.gaps.filter(s => s.startsWith('Missing ')).map(s => s.replace('Missing ', '')),
    atsKeywords,
    detectedCVFamily: cvProfile?.family || 'Unknown',
    detectedJobFamily: jobProfile?.family || 'Unknown',
    isAmbiguous,
    breakdown: profileResult.breakdown
  }
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
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w))
  const freq: Record<string, number> = {}
  words.forEach(w => freq[w] = (freq[w] || 0) + 1)
  return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 8).map(([w]) => w)
}

function buildReasoning(
  score: number,
  profileResult: any,
  job: any,
  jobFamily?: string
): string {
  const parts: string[] = []

  if (score >= 75) parts.push(`Strong ${score}% match for ${job.title}.`)
  else if (score >= 55) parts.push(`Good ${score}% match for ${job.title}.`)
  else if (score >= 35) parts.push(`Moderate ${score}% match for ${job.title}.`)
  else parts.push(`${score}% match for ${job.title} — significant gaps detected.`)

  if (jobFamily) parts.push(`Role is in ${jobFamily}.`)

  if (profileResult.dealBreakers.length > 0) {
    parts.push(`⚠️ ${profileResult.dealBreakers[0]}`)
  } else if (profileResult.gaps.length > 0) {
    parts.push(`Key gap: ${profileResult.gaps[0]}`)
  }

  if (profileResult.strengths.length > 0) {
    parts.push(`Strength: ${profileResult.strengths[0]}`)
  }

  return parts.join(' ')
}

import type { CVData } from "@/types/cv-types"

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

export interface CVClassification {
  detectedFamily: string
  confidence: 'high' | 'medium' | 'low'
  tier: string
  isAmbiguous: boolean
}

export interface DisambiguationOption {
  id: string
  family: string
  confidence: number
  tier: string
}

export interface JobMatchResponse {
  matches: JobMatchResult[]
  cvClassification: CVClassification
}

export interface DisambiguationResponse {
  needsDisambiguation: true
  topMatches: DisambiguationOption[]
}

// Keep AIJobMatch as alias for backwards compatibility
export type AIJobMatch = JobMatchResult

export async function getJobMatches(
  cvData: CVData,
  jobs: any[],
  confirmedFamily?: string
): Promise<JobMatchResponse | DisambiguationResponse> {
  if (!cvData) throw new Error('CV data is required')
  if (!jobs?.length) throw new Error('Jobs data is required')

  const response = await fetch('/api/ai-job-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvData, jobs, confirmedFamily })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Job matching failed: ${err.error || response.statusText}`)
  }

  return response.json()
}

// Backwards-compatible wrapper used by existing components
export async function getAIJobMatches(cvData: CVData, jobs: any[]): Promise<JobMatchResult[]> {
  const result = await getJobMatches(cvData, jobs)
  if ('needsDisambiguation' in result) {
    // Auto-pick top match if disambiguation needed — existing components don't handle it yet
    const topId = result.topMatches[0]?.id
    const confirmed = await getJobMatches(cvData, jobs, topId)
    if ('matches' in confirmed) return confirmed.matches
    return []
  }
  return result.matches
}

import type { CVData } from "@/types/cv-types"

export interface AIJobMatch {
  jobId: string
  matchScore: number
  reasoning: string
  skillsMatch: string[]
  skillsGap: string[]
  atsKeywords: string[]
}

export async function getAIJobMatches(cvData: CVData, jobs: any[]): Promise<AIJobMatch[]> {
  try {
    const response = await fetch('/api/ai-job-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvData, jobs })
    })
    
    if (!response.ok) throw new Error('AI matching failed')
    return await response.json()
  } catch (error) {
    console.error('AI job matching error:', error)
    return []
  }
}

export function enhanceJobWithAI(job: any, aiMatch?: AIJobMatch) {
  if (!aiMatch) return job
  
  return {
    ...job,
    aiMatchScore: aiMatch.matchScore,
    aiReasoning: aiMatch.reasoning,
    aiSkillsMatch: aiMatch.skillsMatch,
    aiSkillsGap: aiMatch.skillsGap,
    aiATSKeywords: aiMatch.atsKeywords,
    isAIEnhanced: true
  }
}
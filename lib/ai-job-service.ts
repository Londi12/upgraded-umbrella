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
    // Validate input data
    if (!cvData) {
      throw new Error('CV data is required for AI job matching');
    }

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      throw new Error('Jobs data is required for AI job matching');
    }

    // Validate CV data structure
    if (!cvData.personalInfo || !cvData.personalInfo.jobTitle) {
      console.warn('CV data is missing personal info or job title');
    }

    if (!cvData.skills) {
      console.warn('CV data is missing skills information');
    }

    console.log(`Starting AI job matching for ${jobs.length} jobs`);

    const response = await fetch('/api/ai-job-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvData, jobs })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`AI matching failed: ${errorData.error || response.statusText}`);
    }

    const matches = await response.json();

    if (!Array.isArray(matches)) {
      throw new Error('Invalid response format from AI matching service');
    }

    console.log(`AI job matching completed successfully. Found ${matches.length} matches`);
    return matches;
  } catch (error) {
    console.error('Error getting AI job matches:', error);

    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to AI matching service. Please check your internet connection.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('AI job matching failed due to an unknown error');
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
import { supabase, hasValidCredentials } from "./supabase"
import type { CVData } from "@/types/cv-types"

// Analytics interfaces
export interface ApplicationTracking {
  id?: string
  user_id?: string
  cv_id: string
  job_title: string
  company_name: string
  job_board: string
  application_date: string
  status: 'applied' | 'viewed' | 'interview' | 'rejected' | 'offered' | 'hired'
  ats_score_at_application: number
  job_description?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface CVPerformanceMetrics {
  cv_id: string
  total_applications: number
  response_rate: number
  interview_rate: number
  success_rate: number
  avg_ats_score: number
  top_performing_sections: string[]
  improvement_suggestions: string[]
}

export interface UserAnalytics {
  user_id: string
  total_cvs_created: number
  total_applications: number
  overall_response_rate: number
  most_successful_template: string
  avg_time_to_response: number
  industry_performance: Record<string, number>
}

// Track job application
export const trackApplication = async (applicationData: Omit<ApplicationTracking, "id" | "user_id" | "created_at" | "updated_at">) => {
  if (!hasValidCredentials) {
    return { data: null, error: null }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: { message: "Not authenticated" } }

  const { data, error } = await supabase
    .from("application_tracking")
    .insert({
      user_id: user.id,
      ...applicationData,
    })
    .select()
    .single()

  return { data, error }
}

// Update application status
export const updateApplicationStatus = async (applicationId: string, status: ApplicationTracking['status'], notes?: string) => {
  if (!hasValidCredentials) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from("application_tracking")
    .update({ 
      status, 
      notes,
      updated_at: new Date().toISOString()
    })
    .eq("id", applicationId)
    .select()
    .single()

  return { data, error }
}

// Get user's application history
export const getUserApplications = async () => {
  if (!hasValidCredentials) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from("application_tracking")
    .select(`
      *,
      saved_cvs (
        name,
        template_type,
        template_name
      )
    `)
    .order("application_date", { ascending: false })

  return { data: data || [], error }
}

// Calculate CV performance metrics
export const calculateCVPerformance = async (cvId: string): Promise<CVPerformanceMetrics | null> => {
  if (!hasValidCredentials) return null

  const { data: applications } = await supabase
    .from("application_tracking")
    .select("*")
    .eq("cv_id", cvId)

  if (!applications || applications.length === 0) {
    return {
      cv_id: cvId,
      total_applications: 0,
      response_rate: 0,
      interview_rate: 0,
      success_rate: 0,
      avg_ats_score: 0,
      top_performing_sections: [],
      improvement_suggestions: []
    }
  }

  const totalApplications = applications.length
  const responses = applications.filter(app => ['viewed', 'interview', 'offered', 'hired'].includes(app.status))
  const interviews = applications.filter(app => ['interview', 'offered', 'hired'].includes(app.status))
  const successes = applications.filter(app => ['offered', 'hired'].includes(app.status))

  const responseRate = (responses.length / totalApplications) * 100
  const interviewRate = (interviews.length / totalApplications) * 100
  const successRate = (successes.length / totalApplications) * 100
  const avgATSScore = applications.reduce((sum, app) => sum + app.ats_score_at_application, 0) / totalApplications

  return {
    cv_id: cvId,
    total_applications: totalApplications,
    response_rate: Math.round(responseRate * 100) / 100,
    interview_rate: Math.round(interviewRate * 100) / 100,
    success_rate: Math.round(successRate * 100) / 100,
    avg_ats_score: Math.round(avgATSScore * 100) / 100,
    top_performing_sections: [], // To be implemented based on successful applications
    improvement_suggestions: generateImprovementSuggestions(responseRate, interviewRate, avgATSScore)
  }
}

// Generate improvement suggestions based on performance
const generateImprovementSuggestions = (responseRate: number, interviewRate: number, avgATSScore: number): string[] => {
  const suggestions: string[] = []

  if (responseRate < 10) {
    suggestions.push("Your response rate is low. Consider improving your ATS score and keyword optimization.")
  }
  
  if (interviewRate < 5) {
    suggestions.push("Few interviews are being scheduled. Review your summary and experience descriptions.")
  }
  
  if (avgATSScore < 70) {
    suggestions.push("Your ATS score is below optimal. Focus on keyword optimization and formatting.")
  }
  
  if (responseRate > 15 && interviewRate < 8) {
    suggestions.push("You're getting responses but few interviews. Strengthen your experience section with quantifiable achievements.")
  }

  return suggestions
}

// Get user analytics dashboard data
export const getUserAnalytics = async (): Promise<UserAnalytics | null> => {
  if (!hasValidCredentials) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's CVs
  const { data: cvs } = await supabase
    .from("saved_cvs")
    .select("*")
    .eq("user_id", user.id)

  // Get user's applications
  const { data: applications } = await supabase
    .from("application_tracking")
    .select("*")
    .eq("user_id", user.id)

  if (!cvs || !applications) return null

  const totalCVs = cvs.length
  const totalApplications = applications.length
  const responses = applications.filter(app => ['viewed', 'interview', 'offered', 'hired'].includes(app.status))
  const overallResponseRate = totalApplications > 0 ? (responses.length / totalApplications) * 100 : 0

  // Find most successful template
  const templatePerformance: Record<string, { applications: number, responses: number }> = {}
  
  applications.forEach(app => {
    const cv = cvs.find(c => c.id === app.cv_id)
    if (cv) {
      const template = cv.template_type
      if (!templatePerformance[template]) {
        templatePerformance[template] = { applications: 0, responses: 0 }
      }
      templatePerformance[template].applications++
      if (['viewed', 'interview', 'offered', 'hired'].includes(app.status)) {
        templatePerformance[template].responses++
      }
    }
  })

  let mostSuccessfulTemplate = 'none'
  let bestRate = 0
  
  Object.entries(templatePerformance).forEach(([template, perf]) => {
    const rate = perf.applications > 0 ? (perf.responses / perf.applications) * 100 : 0
    if (rate > bestRate) {
      bestRate = rate
      mostSuccessfulTemplate = template
    }
  })

  return {
    user_id: user.id,
    total_cvs_created: totalCVs,
    total_applications: totalApplications,
    overall_response_rate: Math.round(overallResponseRate * 100) / 100,
    most_successful_template: mostSuccessfulTemplate,
    avg_time_to_response: 0, // To be calculated based on response dates
    industry_performance: {} // To be implemented based on job categories
  }
}

// Track CV views/downloads for analytics
export const trackCVInteraction = async (cvId: string, interactionType: 'view' | 'download' | 'share') => {
  if (!hasValidCredentials) return { data: null, error: null }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: { message: "Not authenticated" } }

  const { data, error } = await supabase
    .from("cv_interactions")
    .insert({
      user_id: user.id,
      cv_id: cvId,
      interaction_type: interactionType,
      timestamp: new Date().toISOString()
    })

  return { data, error }
}

// Save ATS score history
export const saveATSScore = async (cvId: string, overallScore: number, sectionScores: any, suggestions: any[], jobDescription?: string) => {
  if (!hasValidCredentials) return { data: null, error: null }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: { message: "Not authenticated" } }

  const { data, error } = await supabase
    .from("ats_score_history")
    .insert({
      user_id: user.id,
      cv_id: cvId,
      overall_score: overallScore,
      section_scores: sectionScores,
      suggestions: suggestions,
      job_description_used: jobDescription
    })

  return { data, error }
}

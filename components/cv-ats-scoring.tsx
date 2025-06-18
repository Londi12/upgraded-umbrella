"use client"

import { useState, useMemo } from 'react'
import { BarChart, Check, AlertCircle, ChevronDown, ChevronUp, Lightbulb, TrendingUp } from 'lucide-react'
import type { CVData } from '@/types/cv-types'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ATSScoringPanelProps {
  cvData: CVData
  currentSection: string
}

interface SectionScore {
  score: number
  feedback: string[]
  suggestions: string[]
}

interface ATSScore {
  overallScore: number
  sections: Record<string, SectionScore>
}

export function ATSScoringPanel({ cvData, currentSection }: ATSScoringPanelProps) {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [jobDescription, setJobDescription] = useState('')

  // Calculate scores for each section
  const scores = useMemo(() => {
    return calculateATSScores(cvData)
  }, [cvData])

  // Calculate job match score when job description is provided
  const jobMatchScore = useMemo(() => {
    if (!jobDescription.trim()) return null
    return calculateJobMatch(cvData, jobDescription)
  }, [cvData, jobDescription])

  // Get current section score details
  const currentSectionScore = useMemo(() => {
    const sectionKey = getSectionKey(currentSection)
    return scores.sections[sectionKey] || { score: 0, feedback: [], suggestions: [] }
  }, [scores, currentSection])

  // Keywords extraction from CV for visualization
  const keywordData = useMemo(() => {
    return extractKeywords(cvData)
  }, [cvData])

  // Helper to get section title for display
  const getSectionTitle = (section: string) => {
    const titles: Record<string, string> = {
      personal: 'Personal Information',
      summary: 'Professional Summary',
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills'
    }
    return titles[section] || section
  }

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-emerald-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  // Get progress color based on value
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 60) return 'bg-emerald-600'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  if (isPanelCollapsed) {
    return (
      <div className="mt-4">
        <div 
          className="bg-white rounded-lg border p-3 flex justify-between items-center cursor-pointer"
          onClick={() => setIsPanelCollapsed(false)}
        >
          <h3 className="text-sm font-medium flex items-center">
            <BarChart className="h-4 w-4 mr-2 text-emerald-600" />
            ATS Score: <span className={`ml-1 ${getScoreColor(scores.overallScore)}`}>{scores.overallScore}%</span>
          </h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => {
            e.stopPropagation()
            setIsPanelCollapsed(false)
          }}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <Card className="border rounded-lg overflow-hidden">
        <div 
          className="bg-white p-3 flex justify-between items-center cursor-pointer border-b"
          onClick={() => setIsPanelCollapsed(true)}
        >
          <h3 className="text-sm font-medium flex items-center">
            <BarChart className="h-4 w-4 mr-2 text-emerald-600" />
            ATS Score: <span className={`ml-1 ${getScoreColor(scores.overallScore)}`}>{scores.overallScore}%</span>
          </h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => {
            e.stopPropagation()
            setIsPanelCollapsed(true)
          }}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          {/* Overall score */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Overall ATS Score</span>
              <span className={`text-sm font-medium ${getScoreColor(scores.overallScore)}`}>{scores.overallScore}%</span>
            </div>
            <Progress value={scores.overallScore} className="h-2" indicatorClassName={getProgressColor(scores.overallScore)} />
            <p className="text-xs text-gray-500 mt-1">Higher scores increase chances of passing ATS filters</p>
          </div>

          {/* Current section feedback */}
          <div className="p-3 bg-gray-50 rounded-md mb-4">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1 text-amber-500" />
              {getSectionTitle(currentSection)} Feedback
            </h4>

            <div className="flex justify-between mb-1">
              <span className="text-xs">Section Score</span>
              <span className={`text-xs font-medium ${getScoreColor(currentSectionScore.score)}`}>
                {currentSectionScore.score}%
              </span>
            </div>
            <Progress 
              value={currentSectionScore.score} 
              className="h-1.5 mb-2" 
              indicatorClassName={getProgressColor(currentSectionScore.score)} 
            />

            {currentSectionScore.feedback.length > 0 ? (
              <ul className="space-y-1.5">
                {currentSectionScore.feedback.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">
                      <AlertCircle className="h-3 w-3" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-green-600 flex items-center">
                <Check className="h-3 w-3 mr-1" /> 
                This section looks good!
              </p>
            )}

            {/* Quick suggestions */}
            {currentSectionScore.suggestions.length > 0 && (
              <div className="mt-3">
                <span className="text-xs text-gray-600 block mb-2">Try these improvements:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentSectionScore.suggestions.map((suggestion, idx) => (
                    <Button 
                      key={idx}
                      variant="outline" 
                      size="sm" 
                      className="text-xs py-1 h-auto text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Job Description Matching */}
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />
              Match to Job Description
            </h4>

            <div className="mb-3">
              <Textarea
                placeholder="Paste job description here to see how well your CV matches..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="text-xs min-h-[100px]"
              />
            </div>

            {jobDescription && jobMatchScore && (
              <>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Job Match Score</span>
                  <span className={`text-xs font-medium ${getScoreColor(jobMatchScore.score)}`}>
                    {jobMatchScore.score}%
                  </span>
                </div>
                <Progress 
                  value={jobMatchScore.score} 
                  className="h-1.5 mb-3" 
                  indicatorClassName={getProgressColor(jobMatchScore.score)} 
                />

                {/* Keyword analysis */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium block mb-1">Matching Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {jobMatchScore.matchingKeywords.slice(0, 10).map((keyword, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium block mb-1">Missing Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {jobMatchScore.missingKeywords.slice(0, 10).map((keyword, i) => (
                        <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// Helper function to get the section key
function getSectionKey(section: string): string {
  // Handle nested sections like 'experience-0'
  if (section.includes('-')) {
    return section.split('-')[0]
  }
  return section
}

// Extract keywords from CV for visualization
function extractKeywords(cvData: CVData): Array<{ keyword: string, count: number }> {
  // Combine all text from CV
  const skillsText = typeof cvData.skills === 'string' ? cvData.skills : ''

  const cvText = [
    ...(cvData.experience?.map(exp => exp.description) || []),
    skillsText,
    cvData.summary || '',
  ].join(' ')

  const words = cvText.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3) // Ignore short words

  const wordFrequency = new Map<string, number>()
  words.forEach(word => {
    const count = wordFrequency.get(word) || 0
    wordFrequency.set(word, count + 1)
  })

  // Convert to array and sort
  return Array.from(wordFrequency.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

// Calculate ATS scores for the CV
function calculateATSScores(cvData: CVData): ATSScore {
  const scores: ATSScore = {
    overallScore: 0,
    sections: {
      personal: { score: 0, feedback: [], suggestions: [] },
      summary: { score: 0, feedback: [], suggestions: [] },
      experience: { score: 0, feedback: [], suggestions: [] },
      education: { score: 0, feedback: [], suggestions: [] },
      skills: { score: 0, feedback: [], suggestions: [] },
    }
  }

  // Personal info scoring
  const personalScore = calculatePersonalScore(cvData)
  scores.sections.personal = personalScore

  // Summary scoring
  const summaryScore = calculateSummaryScore(cvData)
  scores.sections.summary = summaryScore

  // Experience scoring
  const experienceScore = calculateExperienceScore(cvData)
  scores.sections.experience = experienceScore

  // Education scoring
  const educationScore = calculateEducationScore(cvData)
  scores.sections.education = educationScore

  // Skills scoring
  const skillsScore = calculateSkillsScore(cvData)
  scores.sections.skills = skillsScore

  // Calculate overall score (weighted average)
  scores.overallScore = Math.round(
    (personalScore.score * 0.15) +
    (summaryScore.score * 0.2) +
    (experienceScore.score * 0.3) +
    (educationScore.score * 0.15) +
    (skillsScore.score * 0.2)
  )

  return scores
}

// Score personal information
function calculatePersonalScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100

  const { personalInfo } = cvData

  if (!personalInfo.fullName) {
    feedback.push('Missing full name')
    suggestions.push('Add your full name')
    score -= 20
  }

  if (!personalInfo.jobTitle) {
    feedback.push('Missing job title')
    suggestions.push('Add a clear job title')
    score -= 20
  }

  if (!personalInfo.email) {
    feedback.push('Missing email address')
    suggestions.push('Add your email address')
    score -= 20
  }

  if (!personalInfo.phone) {
    feedback.push('Missing phone number')
    suggestions.push('Add your phone number')
    score -= 20
  }

  if (!personalInfo.location) {
    feedback.push('Missing location')
    suggestions.push('Add your location')
    score -= 20
  }

  return { score: Math.max(0, score), feedback, suggestions }
}

// Score professional summary
function calculateSummaryScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100

  if (!cvData.summary) {
    feedback.push('Missing professional summary')
    suggestions.push('Add a professional summary')
    score = 0
  } else {
    const wordCount = cvData.summary.split(/\s+/).length

    if (wordCount < 30) {
      feedback.push('Summary is too short (less than 30 words)')
      suggestions.push('Expand your summary to 50-100 words')
      score -= 50
    } else if (wordCount > 200) {
      feedback.push('Summary is too long (more than 200 words)')
      suggestions.push('Shorten your summary to 50-100 words')
      score -= 20
    }

    // Check for quantifiable achievements
    const hasNumbers = /\d+/.test(cvData.summary)
    if (!hasNumbers) {
      feedback.push('Summary lacks quantifiable achievements')
      suggestions.push('Add 1-2 quantifiable achievements')
      score -= 30
    }
  }

  return { score: Math.max(0, score), feedback, suggestions }
}

// Score work experience
function calculateExperienceScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100

  if (!cvData.experience || cvData.experience.length === 0) {
    feedback.push('No work experience listed')
    suggestions.push('Add at least one work experience')
    return { score: 0, feedback, suggestions }
  }

  // Check each experience entry
  let emptyDescriptions = 0
  let shortDescriptions = 0
  let missingDates = 0
  let missingCompany = 0
  let missingTitle = 0

  cvData.experience.forEach(exp => {
    if (!exp.description) {
      emptyDescriptions++
    } else if (exp.description.split(/\s+/).length < 20) {
      shortDescriptions++
    }
    if (!exp.startDate || !exp.endDate) missingDates++
    if (!exp.company) missingCompany++
    if (!exp.title) missingTitle++
  })

  if (emptyDescriptions > 0) {
    feedback.push(`${emptyDescriptions} experience entries missing descriptions`)
    suggestions.push('Add descriptions to all experience entries')
    score -= Math.min(40, emptyDescriptions * 20)
  }

  if (shortDescriptions > 0) {
    feedback.push(`${shortDescriptions} experience descriptions are too brief`)
    suggestions.push('Expand job descriptions with 3-5 bullet points')
    score -= Math.min(30, shortDescriptions * 15)
  }

  if (missingDates > 0) {
    feedback.push(`${missingDates} experience entries missing start/end dates`)
    suggestions.push('Add dates to all experience entries')
    score -= Math.min(30, missingDates * 15)
  }

  if (missingCompany > 0) {
    feedback.push(`${missingCompany} experience entries missing company names`)
    suggestions.push('Add company names to all experience entries')
    score -= Math.min(20, missingCompany * 10)
  }

  if (missingTitle > 0) {
    feedback.push(`${missingTitle} experience entries missing job titles`)
    suggestions.push('Add job titles to all experience entries')
    score -= Math.min(20, missingTitle * 10)
  }

  // Check for action verbs and achievements
  const actionVerbPattern = /\b(managed|developed|created|implemented|led|achieved|improved|increased|decreased|reduced|negotiated|coordinated|organized)\b/i
  const numberPattern = /\d+/

  let missingActionVerbs = 0
  let missingNumbers = 0

  cvData.experience.forEach(exp => {
    if (exp.description) {
      if (!actionVerbPattern.test(exp.description)) missingActionVerbs++
      if (!numberPattern.test(exp.description)) missingNumbers++
    }
  })

  if (missingActionVerbs > 0) {
    feedback.push('Use more action verbs in your job descriptions')
    suggestions.push('Start bullet points with action verbs (e.g., Managed, Developed)')
    score -= Math.min(20, missingActionVerbs * 10)
  }

  if (missingNumbers > 0) {
    feedback.push('Add quantifiable achievements to your job descriptions')
    suggestions.push('Include numbers to quantify achievements (e.g., Increased sales by 25%)')
    score -= Math.min(20, missingNumbers * 10)
  }

  return { score: Math.max(0, score), feedback, suggestions }
}

// Score education
function calculateEducationScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100

  if (!cvData.education || cvData.education.length === 0) {
    feedback.push('No education information listed')
    suggestions.push('Add at least one education entry')
    return { score: 0, feedback, suggestions }
  }

  // Check each education entry
  let missingDegree = 0
  let missingInstitution = 0
  let missingGraduation = 0

  cvData.education.forEach(edu => {
    if (!edu.degree) missingDegree++
    if (!edu.institution) missingInstitution++
    if (!edu.graduationDate) missingGraduation++
  })

  if (missingDegree > 0) {
    feedback.push(`${missingDegree} education entries missing degree/qualification`)
    suggestions.push('Add degree names to all education entries')
    score -= Math.min(40, missingDegree * 20)
  }

  if (missingInstitution > 0) {
    feedback.push(`${missingInstitution} education entries missing institution names`)
    suggestions.push('Add institution names to all education entries')
    score -= Math.min(40, missingInstitution * 20)
  }

  if (missingGraduation > 0) {
    feedback.push(`${missingGraduation} education entries missing graduation dates`)
    suggestions.push('Add graduation dates to all education entries')
    score -= Math.min(20, missingGraduation * 10)
  }

  return { score: Math.max(0, score), feedback, suggestions }
}

// Score skills section
function calculateSkillsScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100

  // Handle different formats of skills
  const skillsText = typeof cvData.skills === 'string' ? cvData.skills : ''

  if (!skillsText || skillsText.trim() === '') {
    feedback.push('No skills listed')
    suggestions.push('Add 5-10 relevant skills')
    return { score: 0, feedback, suggestions }
  }

  // Count skills (assuming comma separated)
  const skillsList = skillsText.split(/,|\n/).map(s => s.trim()).filter(s => s)

  if (skillsList.length < 5) {
    feedback.push('Not enough skills listed (less than 5)')
    suggestions.push('Add more relevant skills (aim for 8-12)')
    score -= 50
  }

  // Check for technical and soft skills balance
  const technicalSkillsPattern = /\b(software|programming|coding|data|analysis|excel|sql|python|java|javascript|typescript|react|angular|vue|node|aws|azure|cloud|machine learning|ai)\b/i
  const softSkillsPattern = /\b(communication|teamwork|leadership|problem solving|analytical|time management|project management|collaboration|adaptability|creativity)\b/i

  const hasTechnicalSkills = technicalSkillsPattern.test(skillsText)
  const hasSoftSkills = softSkillsPattern.test(skillsText)

  if (!hasTechnicalSkills) {
    feedback.push('Consider adding technical skills')
    suggestions.push('Add relevant technical skills for your field')
    score -= 30
  }

  if (!hasSoftSkills) {
    feedback.push('Consider adding soft skills')
    suggestions.push('Add relevant soft skills (e.g., communication, leadership)')
    score -= 20
  }

  return { score: Math.max(0, score), feedback, suggestions }
}

// Calculate job match score
function calculateJobMatch(cvData: CVData, jobDescription: string): {
  score: number,
  matchingKeywords: string[],
  missingKeywords: string[]
} {
  // Extract potential keywords from job description
  const commonWords = new Set([
    'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'as', 'by', 'of', 'about',
    'you', 'will', 'have', 'be', 'are', 'our', 'we', 'is', 'from', 'that', 'this', 'who', 'or',
    'not', 'can', 'your', 'their', 'has', 'they', 'would', 'could', 'should', 'than', 'then',
    'all', 'more', 'other', 'new', 'some', 'what', 'when', 'which', 'been', 'were', 'was',
    'job', 'work', 'role', 'position', 'candidate', 'applicant', 'application', 'company',
    'please', 'looking', 'required', 'must', 'need', 'wants', 'desired', 'ability', 'able', 'years'
  ])

  const jobText = jobDescription.toLowerCase()
  const jobWords = jobText
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))

  // Count frequency of each word
  const jobKeywordFrequency = new Map<string, number>()
  jobWords.forEach(word => {
    const count = jobKeywordFrequency.get(word) || 0
    jobKeywordFrequency.set(word, count + 1)
  })

  // Get most frequent words as keywords (excluding common words)
  const jobKeywords = Array.from(jobKeywordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(entry => entry[0])

  // Check which keywords are in the CV
  const cvText = [
    cvData.personalInfo?.jobTitle || '',
    cvData.summary || '',
    ...(cvData.experience?.map(exp => `${exp.title} ${exp.company} ${exp.description}`) || []),
    ...(cvData.education?.map(edu => `${edu.degree} ${edu.institution}`) || []),
    typeof cvData.skills === 'string' ? cvData.skills : ''
  ].join(' ').toLowerCase()

  const matchingKeywords: string[] = []
  const missingKeywords: string[] = []

  jobKeywords.forEach(keyword => {
    if (cvText.includes(keyword)) {
      matchingKeywords.push(keyword)
    } else {
      missingKeywords.push(keyword)
    }
  })

  // Calculate score based on matching keywords
  const score = Math.round((matchingKeywords.length / jobKeywords.length) * 100)

  return { score, matchingKeywords, missingKeywords }
}

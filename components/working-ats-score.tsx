"use client"

import { useState, useEffect } from "react"
import { BarChart, TrendingUp, AlertCircle, CheckCircle, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "./loading-spinner"
import type { CVData } from "@/types/cv-types"

interface WorkingATSScoreProps {
  cvData: CVData
  onImprove?: () => void
}

interface ATSAnalysis {
  overallScore: number
  sections: {
    [key: string]: {
      score: number
      issues: string[]
      improvements: string[]
    }
  }
  keywordDensity: number
  recommendations: string[]
}

export function WorkingATSScore({ cvData, onImprove }: WorkingATSScoreProps) {
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (cvData) {
      analyzeCV()
    }
  }, [cvData])

  const analyzeCV = async () => {
    setIsAnalyzing(true)
    
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockAnalysis: ATSAnalysis = {
      overallScore: calculateOverallScore(cvData),
      sections: {
        personal: analyzPersonalInfo(cvData),
        summary: analyzeSummary(cvData),
        experience: analyzeExperience(cvData),
        education: analyzeEducation(cvData),
        skills: analyzeSkills(cvData)
      },
      keywordDensity: calculateKeywordDensity(cvData),
      recommendations: generateRecommendations(cvData)
    }
    
    setAnalysis(mockAnalysis)
    setIsAnalyzing(false)
  }

  const calculateOverallScore = (cv: CVData): number => {
    let score = 0
    let maxScore = 0

    // Personal info (20 points)
    maxScore += 20
    if (cv.personalInfo?.fullName) score += 5
    if (cv.personalInfo?.email) score += 5
    if (cv.personalInfo?.phone) score += 5
    if (cv.personalInfo?.location) score += 5

    // Summary (20 points)
    maxScore += 20
    if (cv.summary) {
      const wordCount = cv.summary.split(' ').length
      if (wordCount >= 30 && wordCount <= 100) score += 15
      else if (wordCount > 0) score += 10
      if (/\d+/.test(cv.summary)) score += 5 // Has numbers
    }

    // Experience (30 points)
    maxScore += 30
    if (cv.experience?.length) {
      score += Math.min(15, cv.experience.length * 5)
      const hasDescriptions = cv.experience.some(exp => exp.description && exp.description.length > 50)
      if (hasDescriptions) score += 15
    }

    // Education (15 points)
    maxScore += 15
    if (cv.education?.length) {
      score += Math.min(15, cv.education.length * 7)
    }

    // Skills (15 points)
    maxScore += 15
    if (cv.skills) {
      const skillsText = typeof cv.skills === 'string' ? cv.skills : ''
      const skillCount = skillsText.split(',').length
      score += Math.min(15, skillCount * 2)
    }

    return Math.round((score / maxScore) * 100)
  }

  const analyzPersonalInfo = (cv: CVData) => {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100

    if (!cv.personalInfo?.fullName) {
      issues.push('Missing full name')
      improvements.push('Add your complete name')
      score -= 25
    }
    if (!cv.personalInfo?.email) {
      issues.push('Missing email address')
      improvements.push('Add professional email')
      score -= 25
    }
    if (!cv.personalInfo?.phone) {
      issues.push('Missing phone number')
      improvements.push('Add contact number')
      score -= 25
    }
    if (!cv.personalInfo?.location) {
      issues.push('Missing location')
      improvements.push('Add city and province')
      score -= 25
    }

    return { score: Math.max(0, score), issues, improvements }
  }

  const analyzeSummary = (cv: CVData) => {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100

    if (!cv.summary) {
      return { score: 0, issues: ['No professional summary'], improvements: ['Add 2-3 sentence summary'] }
    }

    const wordCount = cv.summary.split(' ').length
    if (wordCount < 20) {
      issues.push('Summary too short')
      improvements.push('Expand to 30-80 words')
      score -= 40
    }
    if (wordCount > 120) {
      issues.push('Summary too long')
      improvements.push('Shorten to 30-80 words')
      score -= 20
    }
    if (!/\d+/.test(cv.summary)) {
      issues.push('No quantifiable achievements')
      improvements.push('Add numbers/percentages')
      score -= 30
    }

    return { score: Math.max(0, score), issues, improvements }
  }

  const analyzeExperience = (cv: CVData) => {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100

    if (!cv.experience?.length) {
      return { score: 0, issues: ['No work experience'], improvements: ['Add at least one job'] }
    }

    cv.experience.forEach((exp, i) => {
      if (!exp.title) {
        issues.push(`Job ${i + 1}: Missing title`)
        improvements.push(`Add job title for position ${i + 1}`)
        score -= 15
      }
      if (!exp.company) {
        issues.push(`Job ${i + 1}: Missing company`)
        improvements.push(`Add company name for position ${i + 1}`)
        score -= 15
      }
      if (!exp.description || exp.description.length < 50) {
        issues.push(`Job ${i + 1}: Weak description`)
        improvements.push(`Add detailed bullet points for position ${i + 1}`)
        score -= 20
      }
    })

    return { score: Math.max(0, score), issues, improvements }
  }

  const analyzeEducation = (cv: CVData) => {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100

    if (!cv.education?.length) {
      return { score: 0, issues: ['No education listed'], improvements: ['Add your qualifications'] }
    }

    cv.education.forEach((edu, i) => {
      if (!edu.degree) {
        issues.push(`Education ${i + 1}: Missing degree`)
        improvements.push(`Add qualification name`)
        score -= 30
      }
      if (!edu.institution) {
        issues.push(`Education ${i + 1}: Missing institution`)
        improvements.push(`Add school/university name`)
        score -= 20
      }
    })

    return { score: Math.max(0, score), issues, improvements }
  }

  const analyzeSkills = (cv: CVData) => {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100

    const skillsText = typeof cv.skills === 'string' ? cv.skills : ''
    
    if (!skillsText) {
      return { score: 0, issues: ['No skills listed'], improvements: ['Add 8-12 relevant skills'] }
    }

    const skillCount = skillsText.split(',').length
    if (skillCount < 5) {
      issues.push('Too few skills')
      improvements.push('Add more relevant skills')
      score -= 50
    }
    if (skillCount > 20) {
      issues.push('Too many skills')
      improvements.push('Focus on most relevant skills')
      score -= 20
    }

    return { score: Math.max(0, score), issues, improvements }
  }

  const calculateKeywordDensity = (cv: CVData): number => {
    const allText = [
      cv.summary || '',
      ...(cv.experience?.map(exp => exp.description || '') || []),
      typeof cv.skills === 'string' ? cv.skills : ''
    ].join(' ')

    const words = allText.toLowerCase().split(/\W+/).filter(word => word.length > 3)
    const uniqueWords = new Set(words)
    
    return Math.round((uniqueWords.size / words.length) * 100)
  }

  const generateRecommendations = (cv: CVData): string[] => {
    const recs: string[] = []
    
    if (!cv.summary) recs.push('Add a professional summary')
    if (!cv.experience?.length) recs.push('Add work experience')
    if (!cv.skills) recs.push('List your key skills')
    if (cv.experience?.some(exp => !exp.description)) recs.push('Add job descriptions with bullet points')
    
    return recs
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (score >= 60) return { text: 'Good', color: 'bg-blue-100 text-blue-800' }
    if (score >= 40) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Needs Work', color: 'bg-red-100 text-red-800' }
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner message="Analyzing your CV..." stage="analyzing" />
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Click to analyze your CV's ATS compatibility</p>
          <Button onClick={analyzeCV}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Analyze ATS Score
          </Button>
        </CardContent>
      </Card>
    )
  }

  const scoreBadge = getScoreBadge(analysis.overallScore)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-blue-600" />
            ATS Compatibility Score
          </CardTitle>
          <Badge className={scoreBadge.color}>
            {scoreBadge.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)} mb-2`}>
            {analysis.overallScore}%
          </div>
          <Progress value={analysis.overallScore} className="h-3" />
          <p className="text-sm text-gray-600 mt-2">
            {analysis.overallScore >= 80 ? 'Excellent! Your CV should pass most ATS systems.' :
             analysis.overallScore >= 60 ? 'Good score. A few improvements will help.' :
             'Needs improvement to pass ATS screening.'}
          </p>
        </div>

        {analysis.recommendations.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1" />
              Quick Wins
            </h4>
            <ul className="space-y-1">
              {analysis.recommendations.slice(0, 3).map((rec, i) => (
                <li key={i} className="text-sm text-blue-800 flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          {onImprove && (
            <Button onClick={onImprove} className="flex-1">
              Improve Score
            </Button>
          )}
        </div>

        {showDetails && (
          <div className="space-y-3 pt-4 border-t">
            {Object.entries(analysis.sections).map(([section, data]) => (
              <div key={section} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{section}</span>
                  <span className={`text-sm font-medium ${getScoreColor(data.score)}`}>
                    {data.score}%
                  </span>
                </div>
                {data.issues.length > 0 && (
                  <div className="text-sm">
                    {data.issues.map((issue, i) => (
                      <div key={i} className="flex items-center text-red-600 mb-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
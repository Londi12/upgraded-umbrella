"use client"

import { useState, useMemo, useEffect } from 'react'
import { BarChart, TrendingUp, AlertCircle, CheckCircle, Lightbulb, Download, Target, Award, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from './loading-spinner'
import type { CVData } from '@/types/cv-types'
import { ATSScoreBreakdown } from './ats-score-breakdown'
import { JobMatchAnalyzer } from './job-match-analyzer'
import { ATSImprovementSuggestions } from './ats-improvement-suggestions'
import { EnhancedATSOptimizer } from '@/lib/enhanced-ats-optimizer';

interface EnhancedATSAnalysisProps {
  cvData: CVData
  availableJobs?: any[]
  onImprove?: () => void
  className?: string
}

interface DetailedATSScore {
  overallScore: number
  sectionScores: {
    [section: string]: {
      score: number
      maxScore: number
      subScores: {
        completeness: number
        formatting: number
        keywords: number
        impact: number
      }
      issues: string[]
      improvements: string[]
      priority: 'high' | 'medium' | 'low'
    }
  }
  industryAnalysis: {
    detectedIndustry: string
    compliance: number
    recommendations: string[]
  }
  jobMatchAnalysis?: {
    score: number
    matchingKeywords: string[]
    missingKeywords: string[]
    skillsGap: string[]
    suggestions: string[]
  }
}

export function EnhancedCVATSAnalysis({
  cvData,
  availableJobs = [],
  onImprove,
  className = ""
}: EnhancedATSAnalysisProps) {
  const [analysis, setAnalysis] = useState<DetailedATSScore | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const optimizer = useMemo(() => new EnhancedATSOptimizer(), []);

  // Auto-detect job description from available jobs
  useEffect(() => {
    if (availableJobs.length > 0 && !jobDescription) {
      // Find the most recent or most relevant job
      const latestJob = availableJobs[0]
      if (latestJob?.description) {
        setJobDescription(latestJob.description)
        setSelectedJob(latestJob)
      }
    }
  }, [availableJobs, jobDescription])

  // Perform detailed ATS analysis
  useEffect(() => {
    if (cvData) {
      analyzeCV()
    }
  }, [cvData, jobDescription, optimizer])

  const analyzeCV = async () => {
    setIsAnalyzing(true)

    // Simulate analysis time for better UX
    await new Promise(resolve => setTimeout(resolve, 1500))

    const detailedAnalysis = await performDetailedAnalysis(cvData, jobDescription)
    setAnalysis(detailedAnalysis)
    setIsAnalyzing(false)
  }

  const performDetailedAnalysis = async (cv: CVData, jobDesc: string): Promise<DetailedATSScore> => {
    const analysisResult = await optimizer.analyzeCV(cv, undefined, jobDesc);

    const sectionScores = Object.entries(analysisResult.sectionScores).reduce((acc, [key, value]) => {
      acc[key] = {
        score: value.score,
        maxScore: value.maxScore,
        subScores: { completeness: 0, formatting: 0, keywords: 0, impact: 0 }, // Not in the new model
        issues: value.issues,
        improvements: value.improvements,
        priority: value.priority
      }
      return acc
    }, {} as DetailedATSScore['sectionScores'])

    return {
      overallScore: analysisResult.overallScore,
      sectionScores: sectionScores,
      industryAnalysis: {
        detectedIndustry: analysisResult.industrySpecific.industry,
        compliance: analysisResult.industrySpecific.compliance,
        recommendations: analysisResult.industrySpecific.missingRequirements,
      },
      jobMatchAnalysis: {
        score: analysisResult.keywordOptimization.density, // Using density for score
        matchingKeywords: [], // Not in the new model
        missingKeywords: analysisResult.keywordOptimization.missing,
        skillsGap: [], // Not in the new model
        suggestions: [], // Not in the new model
      },
    };
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 55) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: 'bg-green-100 text-green-800', icon: Award }
    if (score >= 70) return { text: 'Good', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    if (score >= 55) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    return { text: 'Needs Work', color: 'bg-red-100 text-red-800', icon: AlertCircle }
  }

  const exportReport = () => {
    if (!analysis) return

    const reportData = {
      generatedAt: new Date().toISOString(),
      overallScore: analysis.overallScore,
      sectionScores: analysis.sectionScores,
      industryAnalysis: analysis.industryAnalysis,
      jobMatchAnalysis: analysis.jobMatchAnalysis,
      recommendations: Object.values(analysis.sectionScores)
        .flatMap(section => section.improvements)
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ats-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isAnalyzing) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <LoadingSpinner message="Performing detailed ATS analysis..." stage="analyzing" />
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Click to analyze your CV's ATS compatibility</p>
          <Button onClick={analyzeCV}>
            <Zap className="h-4 w-4 mr-2" />
            Analyze ATS Score
          </Button>
        </CardContent>
      </Card>
    )
  }

  const scoreBadge = getScoreBadge(analysis.overallScore)
  const ScoreIcon = scoreBadge.icon

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with overall score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              Enhanced ATS Compatibility Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={scoreBadge.color}>
                <ScoreIcon className="h-3 w-3 mr-1" />
                {scoreBadge.text}
              </Badge>
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)} mb-2`}>
              {analysis.overallScore}%
            </div>
            <Progress value={analysis.overallScore} className="h-4 mb-2" />
            <p className="text-sm text-gray-600">
              {analysis.overallScore >= 85 ? 'Excellent! Your CV should pass most ATS systems.' :
               analysis.overallScore >= 70 ? 'Good score. Minor improvements will help.' :
               analysis.overallScore >= 55 ? 'Fair score. Several improvements needed.' :
               'Needs significant improvement to pass ATS screening.'}
            </p>
          </div>

          {/* Industry Analysis */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Industry Analysis
            </h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-800">Detected Industry: {analysis.industryAnalysis.detectedIndustry}</span>
              <span className="text-sm font-medium text-blue-800">{analysis.industryAnalysis.compliance}% Compliant</span>
            </div>
            <Progress value={analysis.industryAnalysis.compliance} className="h-2 mb-2" />
            <div className="flex flex-wrap gap-1">
              {analysis.industryAnalysis.recommendations.slice(0, 3).map((rec, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  {rec}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed interface for detailed analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
          <TabsTrigger value="jobmatch">Job Matching</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysis.sectionScores).map(([section, data]) => (
              <Card key={section}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{section}</span>
                    <span className={`text-sm font-medium ${getScoreColor(data.score)}`}>
                      {data.score}%
                    </span>
                  </div>
                  <Progress value={data.score} className="h-2 mb-2" />
                  <div className="text-xs text-gray-600">
                    Priority: <span className="capitalize font-medium">{data.priority}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="breakdown">
          <ATSScoreBreakdown sectionScores={analysis.sectionScores} />
        </TabsContent>

        <TabsContent value="jobmatch">
          <JobMatchAnalyzer
            cvData={cvData}
            jobDescription={jobDescription}
            selectedJob={selectedJob}
            availableJobs={availableJobs}
            onJobDescriptionChange={setJobDescription}
            onJobSelect={setSelectedJob}
            jobMatchAnalysis={analysis.jobMatchAnalysis}
          />
        </TabsContent>

        <TabsContent value="improvements">
          <ATSImprovementSuggestions sectionScores={analysis.sectionScores} />
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
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
            <Lightbulb className="h-4 w-4 mr-2" />
            Improve Score
          </Button>
        )}
      </div>
    </div>
  )
}

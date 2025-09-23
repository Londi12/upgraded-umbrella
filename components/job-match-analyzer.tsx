"use client"

import { useState, useMemo } from 'react'
import { TrendingUp, Target, Search, Plus, Minus, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CVData } from '@/types/cv-types'

interface JobMatchAnalyzerProps {
  cvData: CVData
  jobDescription: string
  selectedJob?: any
  availableJobs?: any[]
  onJobDescriptionChange: (value: string) => void
  onJobSelect: (job: any) => void
  jobMatchAnalysis?: {
    score: number
    matchingKeywords: string[]
    missingKeywords: string[]
    skillsGap: string[]
    suggestions: string[]
  }
}

export function JobMatchAnalyzer({
  cvData,
  jobDescription,
  selectedJob,
  availableJobs = [],
  onJobDescriptionChange,
  onJobSelect,
  jobMatchAnalysis
}: JobMatchAnalyzerProps) {

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent Match', color: 'bg-green-100 text-green-800' }
    if (score >= 60) return { text: 'Good Match', color: 'bg-blue-100 text-blue-800' }
    if (score >= 40) return { text: 'Fair Match', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Poor Match', color: 'bg-red-100 text-red-800' }
  }

  const handleJobSelect = (jobId: string) => {
    const job = availableJobs.find(j => j.id === jobId)
    if (job) {
      onJobSelect(job)
      onJobDescriptionChange(job.description || '')
    }
  }

  return (
    <div className="space-y-6">
      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Job Description Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job Selection Dropdown */}
          {availableJobs.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select from Available Jobs
              </label>
              <Select onValueChange={handleJobSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job to analyze against..." />
                </SelectTrigger>
                <SelectContent>
                  {availableJobs.slice(0, 10).map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{job.title}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {job.company}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Manual Job Description Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Or paste job description manually
            </label>
            <Textarea
              placeholder="Paste the job description here to see how well your CV matches the requirements..."
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              className="min-h-[120px] text-sm"
            />
          </div>

          {selectedJob && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{selectedJob.title}</h4>
                  <p className="text-sm text-blue-700">{selectedJob.company}</p>
                </div>
                {selectedJob.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedJob.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Match Results */}
      {jobDescription && jobMatchAnalysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Job Match Analysis
              </CardTitle>
              <Badge className={getScoreBadge(jobMatchAnalysis.score).color}>
                {getScoreBadge(jobMatchAnalysis.score).text}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Match Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(jobMatchAnalysis.score)} mb-2`}>
                {jobMatchAnalysis.score}%
              </div>
              <Progress value={jobMatchAnalysis.score} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">
                {jobMatchAnalysis.score >= 80 ? 'Excellent match! You\'re highly qualified for this role.' :
                 jobMatchAnalysis.score >= 60 ? 'Good match. You meet most requirements.' :
                 jobMatchAnalysis.score >= 40 ? 'Fair match. Consider highlighting transferable skills.' :
                 'Poor match. Focus on developing the missing skills.'}
              </p>
            </div>

            {/* Keyword Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matching Keywords */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center text-green-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Matching Keywords ({jobMatchAnalysis.matchingKeywords.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {jobMatchAnalysis.matchingKeywords.slice(0, 12).map((keyword, index) => (
                    <Badge key={index} className="bg-green-100 text-green-800 text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                {jobMatchAnalysis.matchingKeywords.length > 12 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{jobMatchAnalysis.matchingKeywords.length - 12} more matching keywords
                  </p>
                )}
              </div>

              {/* Missing Keywords */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center text-amber-700">
                  <Minus className="h-4 w-4 mr-1" />
                  Missing Keywords ({jobMatchAnalysis.missingKeywords.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {jobMatchAnalysis.missingKeywords.slice(0, 12).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="bg-amber-100 text-amber-800 text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                {jobMatchAnalysis.missingKeywords.length > 12 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{jobMatchAnalysis.missingKeywords.length - 12} more missing keywords
                  </p>
                )}
              </div>
            </div>

            {/* Skills Gap Analysis */}
            {jobMatchAnalysis.skillsGap.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center text-orange-700">
                  <Search className="h-4 w-4 mr-1" />
                  Skills Gap Analysis
                </h4>
                <div className="space-y-2">
                  {jobMatchAnalysis.skillsGap.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium text-orange-800">{skill}</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 text-xs">
                        To Develop
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {jobMatchAnalysis.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center text-blue-700">
                  <Target className="h-4 w-4 mr-1" />
                  Application Suggestions
                </h4>
                <div className="space-y-2">
                  {jobMatchAnalysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-blue-800">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Job Description Message */}
      {!jobDescription && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Analyze Job Match</h3>
            <p className="text-gray-600 mb-4">
              Select a job from the dropdown above or paste a job description to see how well your CV matches the requirements.
            </p>
            <div className="text-sm text-gray-500">
              <p>• <strong>Keyword matching:</strong> See which important terms appear in both your CV and the job description</p>
              <p>• <strong>Skills gap analysis:</strong> Identify skills you need to develop</p>
              <p>• <strong>Application tips:</strong> Get specific advice for this role</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

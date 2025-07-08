"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin, Building, Calendar, DollarSign, ExternalLink } from "lucide-react"
import { getJobMatches, type JobMatch } from "@/lib/job-matching-service"
import type { CVData } from "@/types/cv-types"

interface JobMatcherProps {
  cvData: CVData
  className?: string
}

export function JobMatcher({ cvData, className = "" }: JobMatcherProps) {
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMatches = async () => {
      setIsLoading(true)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      const matches = getJobMatches(cvData, 50) // Lower threshold for demo
      setJobMatches(matches)
      setIsLoading(false)
    }

    if (cvData.personalInfo?.fullName) {
      loadMatches()
    }
  }, [cvData])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Finding Job Matches...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (jobMatches.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Job Matches</CardTitle>
          <CardDescription>No matching jobs found. Try adding more skills to your CV.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recommended Jobs</CardTitle>
        <CardDescription>
          Based on your CV, we found {jobMatches.length} matching job{jobMatches.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobMatches.map((match) => (
          <Card key={match.job.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {match.job.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {match.job.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {match.job.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{match.matchScore}%</div>
                  <div className="text-xs text-gray-500">Match</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Progress value={match.matchScore} className="h-2" />
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-2">
                {match.job.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                {match.job.salary && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {match.job.salary}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(match.job.postedDate).toLocaleDateString()}
                </div>
                <Badge variant="secondary" className="capitalize">
                  {match.job.type.replace('-', ' ')}
                </Badge>
              </div>

              {match.matchedKeywords.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Matching Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {match.matchedKeywords.slice(0, 5).map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        {keyword}
                      </Badge>
                    ))}
                    {match.matchedKeywords.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{match.matchedKeywords.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  Apply Now
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="outline" size="sm">
                  Save Job
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
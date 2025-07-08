"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import type { JobMatch } from "@/lib/job-matching-service"

interface EnhancedJobCardProps {
  jobMatch: JobMatch
  onApply: (jobId: string) => void
  onSave: (jobId: string) => void
  isSaved?: boolean
}

export function EnhancedJobCard({ jobMatch, onApply, onSave, isSaved = false }: EnhancedJobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { job, matchScore, matchedKeywords, missingKeywords } = jobMatch

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getMatchIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <TrendingUp className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <Card className="border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
              {job.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {job.company}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(job.postedDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Match Score */}
          <div className={`text-center p-3 rounded-lg border ${getMatchColor(matchScore)}`}>
            <div className="flex items-center gap-1 mb-1">
              {getMatchIcon(matchScore)}
              <span className="text-2xl font-bold">{matchScore}%</span>
            </div>
            <div className="text-xs font-medium">Match</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Match Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Skill Match</span>
            <span className="text-gray-600">{matchedKeywords.length}/{matchedKeywords.length + missingKeywords.length} skills</span>
          </div>
          <Progress value={matchScore} className="h-2" />
        </div>

        {/* Job Description */}
        <p className="text-gray-700 text-sm leading-relaxed">
          {isExpanded ? job.description : `${job.description.substring(0, 150)}...`}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        </p>

        {/* Job Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {job.salary && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {job.salary}
            </div>
          )}
          <Badge variant="secondary" className="capitalize">
            {job.type.replace('-', ' ')}
          </Badge>
        </div>

        {/* Matched Skills */}
        {matchedKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Your Matching Skills
            </div>
            <div className="flex flex-wrap gap-1">
              {matchedKeywords.slice(0, 6).map((keyword) => (
                <Badge 
                  key={keyword} 
                  variant="outline" 
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  {keyword}
                </Badge>
              ))}
              {matchedKeywords.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{matchedKeywords.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {missingKeywords.length > 0 && isExpanded && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Skills to Develop
            </div>
            <div className="flex flex-wrap gap-1">
              {missingKeywords.slice(0, 4).map((keyword) => (
                <Badge 
                  key={keyword} 
                  variant="outline" 
                  className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => onApply(job.id)}
          >
            Apply Now
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onSave(job.id)}
            className={isSaved ? "bg-blue-50 border-blue-300 text-blue-600" : ""}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>

        {/* Application Tips */}
        {matchScore < 70 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">Improve your chances</p>
                <p className="text-yellow-700">
                  Consider adding skills like {missingKeywords.slice(0, 2).join(", ")} to your CV
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
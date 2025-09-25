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
import { ModernJobCard } from "./modern-job-card"

interface ModernEnhancedJobCardProps {
  jobMatch: JobMatch
  onApply: (jobId: string) => void
  onSave: (jobId: string) => void
  isSaved?: boolean
}

export function ModernEnhancedJobCard({ jobMatch, onApply, onSave, isSaved = false }: ModernEnhancedJobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(isSaved)
  const { job, matchScore, matchedKeywords, missingKeywords } = jobMatch

  const handleSave = async () => {
    if (saving) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title: job.title,
          company_name: job.company,
          job_url: job.url || `#job-${job.id}`,
          job_description: job.description,
          location: job.location,
          posted_date: job.postedDate,
          source: 'Job Matching'
        })
      })
      
      if (response.ok) {
        setSaved(true)
        onSave(job.id)
      }
    } catch (error) {
      console.error('Error saving job:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleApply = async () => {
    // Track application automatically
    try {
      await fetch('/api/track-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_id: 'default-cv',
          job_title: job.title,
          company_name: job.company,
          job_board: 'Job Matching',
          application_date: new Date().toISOString().split('T')[0],
          status: 'applied',
          ats_score_at_application: matchScore,
          job_description: job.description,
          notes: `Applied via job matching (${matchScore}% match)`
        })
      })
    } catch (error) {
      console.error('Error tracking application:', error)
    }
    
    // Open job URL
    if (job.url) {
      window.open(job.url, '_blank')
    }
    onApply(job.id)
  }

  // Generate company initials for logo
  const getCompanyInitials = (companyName: string) => {
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate random color for logo based on company name
  const getLogoColor = (companyName: string) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-blue-500'
    ];
    const index = companyName.length % colors.length;
    return colors[index];
  };

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
      <CardContent className="p-5">
        {/* Header with Logo and Basic Info */}
        <div className="flex gap-3 mb-4">
          {/* Company Logo */}
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getLogoColor(job.company)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
            {getCompanyInitials(job.company)}
          </div>

          {/* Job Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
              {job.title}
            </h3>
            <div className="text-sm text-gray-600 mb-2">
              {job.company}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs">
                {job.type.replace('-', ' ')}
              </Badge>
              {job.salary && (
                <Badge variant="outline" className="text-xs">
                  {job.salary}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {job.location}
              </Badge>
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

        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          {isExpanded ? job.description : `${job.description.substring(0, 150)}...`}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        </p>

        {/* Match Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Skill Match</span>
            <span className="text-gray-600">{matchedKeywords.length}/{matchedKeywords.length + missingKeywords.length} skills</span>
          </div>
          <Progress value={matchScore} className="h-2" />
        </div>

        {/* Matched Skills */}
        {matchedKeywords.length > 0 && (
          <div className="space-y-2 mb-4">
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
          <div className="space-y-2 mb-4">
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {new Date(job.postedDate).toLocaleDateString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleApply}
              className="text-xs"
            >
              Apply Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSave}
              disabled={saving || saved}
              className={saved ? "bg-blue-50 border-blue-300 text-blue-600" : ""}
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Application Tips */}
        {matchScore < 70 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
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

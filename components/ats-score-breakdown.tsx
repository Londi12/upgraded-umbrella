"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SubScore {
  completeness: number
  formatting: number
  keywords: number
  impact: number
}

interface SectionScore {
  score: number
  maxScore: number
  subScores: SubScore
  issues: string[]
  improvements: string[]
  priority: 'high' | 'medium' | 'low'
}

interface ATSScoreBreakdownProps {
  sectionScores: {
    [section: string]: SectionScore
  }
}

export function ATSScoreBreakdown({ sectionScores }: ATSScoreBreakdownProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 55) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubScoreLabel = (key: string) => {
    const labels: Record<string, string> = {
      completeness: 'Completeness',
      formatting: 'Formatting',
      keywords: 'Keywords',
      impact: 'Impact'
    }
    return labels[key] || key
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Detailed Score Breakdown</h3>
        <p className="text-sm text-gray-600">
          Each section is evaluated across multiple dimensions for comprehensive ATS analysis
        </p>
      </div>

      {Object.entries(sectionScores).map(([section, data]) => (
        <Card key={section} className="overflow-hidden">
          <Collapsible
            open={expandedSections.has(section)}
            onOpenChange={() => toggleSection(section)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base capitalize">{section}</CardTitle>
                    <Badge className={getPriorityColor(data.priority)}>
                      {data.priority} priority
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                      {data.score}%
                    </span>
                    {expandedSections.has(section) ?
                      <ChevronUp className="h-4 w-4" /> :
                      <ChevronDown className="h-4 w-4" />
                    }
                  </div>
                </div>
                <Progress value={data.score} className="h-2" />
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Sub-scores */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Score Components
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(data.subScores).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{getSubScoreLabel(key)}</span>
                            <span className={`text-sm font-medium ${getScoreColor(value)}`}>
                              {value}%
                            </span>
                          </div>
                          <Progress value={value} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issues */}
                  {data.issues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center text-red-700">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Issues Found ({data.issues.length})
                      </h4>
                      <ul className="space-y-1">
                        {data.issues.map((issue, index) => (
                          <li key={index} className="text-sm text-red-600 flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {data.improvements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center text-blue-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Suggested Improvements ({data.improvements.length})
                      </h4>
                      <div className="space-y-2">
                        {data.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded text-sm">
                            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-blue-800">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  )
}

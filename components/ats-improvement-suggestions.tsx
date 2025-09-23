"use client"

import { useState } from 'react'
import { Lightbulb, ArrowRight, CheckCircle, AlertCircle, Star, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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

interface ATSImprovementSuggestionsProps {
  sectionScores: {
    [section: string]: SectionScore
  }
}

export function ATSImprovementSuggestions({ sectionScores }: ATSImprovementSuggestionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['high']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Group improvements by priority
  const improvementsByPriority = {
    high: [] as Array<{ section: string, improvement: string, impact: string }>,
    medium: [] as Array<{ section: string, improvement: string, impact: string }>,
    low: [] as Array<{ section: string, improvement: string, impact: string }>
  }

  Object.entries(sectionScores).forEach(([section, data]) => {
    data.improvements.forEach(improvement => {
      const impact = getImprovementImpact(data.priority, data.score)
      improvementsByPriority[data.priority].push({
        section,
        improvement,
        impact
      })
    })
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'medium': return <Star className="h-4 w-4 text-yellow-600" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <Lightbulb className="h-4 w-4 text-gray-600" />
    }
  }

  const getImprovementImpact = (priority: string, score: number) => {
    if (priority === 'high') {
      return score < 50 ? 'High Impact (+15-20%)' : 'Medium Impact (+10-15%)'
    } else if (priority === 'medium') {
      return 'Medium Impact (+5-10%)'
    } else {
      return 'Low Impact (+2-5%)'
    }
  }

  const getQuickWins = () => {
    return Object.values(sectionScores)
      .filter(section => section.priority === 'high' && section.improvements.length > 0)
      .slice(0, 3)
      .map(section => ({
        section: Object.keys(sectionScores).find(key => sectionScores[key] === section) || '',
        improvement: section.improvements[0],
        potentialGain: section.score < 50 ? 20 : 15
      }))
  }

  const quickWins = getQuickWins()

  return (
    <div className="space-y-6">
      {/* Quick Wins Section */}
      {quickWins.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Zap className="h-5 w-5" />
              Quick Wins - High Impact Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 mb-4">
              Focus on these high-priority improvements first for the biggest score increase:
            </p>
            <div className="space-y-3">
              {quickWins.map((win, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-blue-900 capitalize">{win.section}</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        +{win.potentialGain}% potential
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-800">{win.improvement}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-blue-700 border-blue-300">
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority-based Improvements */}
      {(['high', 'medium', 'low'] as const).map((priority) => {
        const improvements = improvementsByPriority[priority]
        if (improvements.length === 0) return null

        return (
          <Card key={priority} className={getPriorityColor(priority)}>
            <Collapsible
              open={expandedSections.has(priority)}
              onOpenChange={() => toggleSection(priority)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-opacity-75 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {getPriorityIcon(priority)}
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Improvements
                      <Badge variant="outline" className="ml-2">
                        {improvements.length}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {getImprovementImpact(priority, 50)}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {improvements.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                        <div className="flex-shrink-0">
                          {getPriorityIcon(item.section)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">{item.section}</span>
                            <Badge
                              className={
                                priority === 'high' ? 'bg-red-100 text-red-800' :
                                priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }
                              variant="outline"
                            >
                              {item.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{item.improvement}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Apply Suggestion
                            </Button>
                            <Button size="sm" variant="ghost">
                              Mark as Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Improvement Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {improvementsByPriority.high.length}
              </div>
              <div className="text-sm text-red-700">High Priority</div>
              <div className="text-xs text-red-600 mt-1">Critical fixes needed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {improvementsByPriority.medium.length}
              </div>
              <div className="text-sm text-yellow-700">Medium Priority</div>
              <div className="text-xs text-yellow-600 mt-1">Important improvements</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {improvementsByPriority.low.length}
              </div>
              <div className="text-sm text-green-700">Low Priority</div>
              <div className="text-xs text-green-600 mt-1">Optional enhancements</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Expected Score Improvement</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Implement all high priority:</span>
                <span className="font-medium">+{Math.min(25, improvementsByPriority.high.length * 8)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Implement all medium priority:</span>
                <span className="font-medium">+{Math.min(15, improvementsByPriority.medium.length * 4)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Implement all low priority:</span>
                <span className="font-medium">+{Math.min(10, improvementsByPriority.low.length * 2)}%</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Maximum potential improvement:</span>
                <span className="text-green-600">
                  +{Math.min(40, improvementsByPriority.high.length * 8 + improvementsByPriority.medium.length * 4 + improvementsByPriority.low.length * 2)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

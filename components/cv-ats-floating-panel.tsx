"use client"

import { useState } from 'react'
import { BarChart, X, AlertCircle, Check, TrendingUp } from 'lucide-react'
import type { CVData } from '@/types/cv-types'
import { FloatingButton } from '@/components/ui/floating-button'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'

interface ATSFloatingPanelProps {
  cvData: CVData
  currentSection: string
}

const defaultScore = 70

export function ATSFloatingPanel({ cvData, currentSection }: ATSFloatingPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('score')
  const [jobDescription, setJobDescription] = useState('')

  // Simple function to get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-emerald-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  // Simple function to get progress bar color
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 60) return 'bg-emerald-600'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // Get a simple score for current section
  const getCurrentSectionScore = () => {
    const sectionScores: Record<string, number> = {
      personal: 80,
      summary: 65,
      experience: 75,
      education: 90,
      skills: 60
    }

    // Extract the base section from section-specific IDs (like experience-0)
    const baseSection = currentSection.split('-')[0]
    return sectionScores[baseSection] || 70
  }

  const sectionScore = getCurrentSectionScore()

  return (
    <>
      <FloatingButton 
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full"
        position="bottom-right"
      >
        <div className="flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          <span className="font-medium">ATS Score: <span className={getScoreColor(defaultScore)}>{defaultScore}%</span></span>
        </div>
      </FloatingButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-80 md:w-96"
          >
            <Card className="border rounded-lg shadow-xl">
              <div className="p-3 border-b flex items-center justify-between bg-white">
                <h3 className="text-sm font-semibold">ATS Optimization</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 p-1 m-2">
                  <TabsTrigger value="score" className="text-xs">CV Score</TabsTrigger>
                  <TabsTrigger value="match" className="text-xs">Job Match</TabsTrigger>
                </TabsList>

                <TabsContent value="score" className="p-3 space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Overall ATS Score</span>
                      <span className={`text-sm font-medium ${getScoreColor(defaultScore)}`}>{defaultScore}%</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`absolute inset-y-0 left-0 ${getProgressColor(defaultScore)} transition-all`}
                        style={{ width: `${defaultScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Higher scores increase chances of passing ATS filters</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                      Current Section: {currentSection.split('-')[0].toUpperCase()}
                    </h4>

                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Section Score</span>
                      <span className={`text-xs font-medium ${getScoreColor(sectionScore)}`}>
                        {sectionScore}%
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary mb-2">
                      <div
                        className={`absolute inset-y-0 left-0 ${getProgressColor(sectionScore)} transition-all`}
                        style={{ width: `${sectionScore}%` }}
                      />
                    </div>

                    {sectionScore < 70 ? (
                      <div className="text-xs flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">
                          <AlertCircle className="h-3 w-3" />
                        </span>
                        <span>This section could use improvement.</span>
                      </div>
                    ) : (
                      <p className="text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" /> 
                        This section looks good!
                      </p>
                    )}

                    <div className="mt-3">
                      <span className="text-xs text-gray-600 block mb-2">Quick tips:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {sectionScore < 70 && currentSection.startsWith('personal') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs py-1 h-auto text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          >
                            Complete all fields
                          </Button>
                        )}
                        {sectionScore < 70 && currentSection.startsWith('summary') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs py-1 h-auto text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          >
                            Add quantifiable achievements
                          </Button>
                        )}
                        {sectionScore < 70 && currentSection.startsWith('experience') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs py-1 h-auto text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          >
                            Use action verbs
                          </Button>
                        )}
                        {sectionScore < 70 && currentSection.startsWith('skills') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs py-1 h-auto text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          >
                            Add more skills
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="match" className="p-3 space-y-4">
                  <div>
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

                    {jobDescription && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">Job Match Score</span>
                          <span className={`text-xs font-medium ${getScoreColor(65)}`}>
                            65%
                          </span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary mb-3">
                          <div
                            className={`absolute inset-y-0 left-0 ${getProgressColor(65)} transition-all`}
                            style={{ width: '65%' }}
                          />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-medium block mb-1">Matching Keywords</span>
                            <div className="flex flex-wrap gap-1">
                              {['experienced', 'team', 'management', 'analysis', 'communication'].map((keyword, i) => (
                                <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-medium block mb-1">Missing Keywords</span>
                            <div className="flex flex-wrap gap-1">
                              {['excel', 'powerpoint', 'strategy', 'budget', 'forecasting'].map((keyword, i) => (
                                <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

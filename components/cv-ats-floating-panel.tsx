"use client"

import { useState, useEffect } from 'react'
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
  const [isMounted, setIsMounted] = useState(false)

  // Only render on client-side to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Simple function to get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-amber-700'
    if (score >= 60) return 'text-amber-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  // Simple function to get progress bar color
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-amber-600 to-amber-500'
    if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-amber-400'
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-amber-400'
    return 'bg-gradient-to-r from-red-500 to-red-400'
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
        className="bg-amber-500 hover:bg-amber-600 text-white h-12 w-12 rounded-full font-medium shadow-lg ring-1 ring-amber-700/10 transition-all duration-300 ease-in-out flex items-center justify-center"
        position="top-right"
        offset={24}
      >
        <BarChart className="h-5 w-5" />
      </FloatingButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 right-6 z-50 w-[450px] md:w-[550px] lg:w-[600px]"
          >
            <Card className="border rounded-lg shadow-xl">
              <div className="px-6 py-5 border-b flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
                <h3 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-amber-600" />
                  ATS Optimization
                </h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-amber-100" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 p-1.5 mx-6 mt-6 mb-2 bg-amber-50/70 rounded-lg">
                  <TabsTrigger value="score" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-md px-4 py-2.5">CV Score</TabsTrigger>
                  <TabsTrigger value="match" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-md px-4 py-2.5">Job Match</TabsTrigger>
                </TabsList>

                <TabsContent value="score" className="p-6 space-y-6">
                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="text-base font-semibold text-gray-800">Overall ATS Score</span>
                      <span className="text-base font-bold text-amber-700 bg-amber-50 px-3 py-0.5 rounded-md">{defaultScore}%</span>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-500"
                        style={{ width: `${defaultScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      Higher scores increase chances of passing ATS filters
                    </p>
                  </div>

                                      <div className="bg-gradient-to-br from-amber-50/70 to-white p-4 rounded-lg border border-amber-100 shadow-sm">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-1">
                      Current Section: {currentSection.split('-')[0].toUpperCase()}
                    </h4>

                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Section Score</span>
                      <span className="text-sm font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        {sectionScore}%
                      </span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100 mb-3">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${sectionScore}%` }}
                      />
                    </div>

                    {sectionScore < 70 ? (
                      <div className="text-xs bg-amber-50 border border-amber-200 rounded-md p-2 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-amber-700 font-medium">This section could use improvement.</span>
                      </div>
                    ) : (
                      <p className="text-xs bg-green-50 border border-green-200 rounded-md p-2 text-green-700 font-medium flex items-center">
                        <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> 
                        This section looks good!
                      </p>
                    )}

                    <div className="mt-4">
                      <span className="text-xs text-gray-700 font-semibold block mb-2">Quick tips:</span>
                      <div className="flex flex-wrap gap-2">
                        {sectionScore < 70 && currentSection.startsWith('personal') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs py-1.5 h-auto text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 border-amber-200 rounded-md font-medium"
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
                              className="text-xs py-1 h-auto text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
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

                <TabsContent value="match" className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-amber-500" />
                      Match to Job Description
                    </h4>

                    <div className="mb-4">
                      <Textarea
                        placeholder="Paste job description here to see how well your CV matches..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="text-sm min-h-[120px] border-gray-200 focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50 rounded-md resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1 text-amber-500" />
                        We'll analyze the job description to suggest matching keywords
                      </p>
                    </div>

                    {jobDescription && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Job Match Score</span>
                          <span className="text-sm font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                            65%
                          </span>
                        </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100 mb-4">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                            style={{ width: '65%' }}
                          />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-gray-700 block mb-2">Matching Keywords</span>
                            <div className="flex flex-wrap gap-1.5">
                              {['experienced', 'team', 'management', 'analysis', 'communication'].map((keyword, i) => (
                                <span key={i} className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-md border border-amber-200 flex items-center">
                                  <Check className="h-3 w-3 mr-1 text-amber-500" />
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4">
                            <span className="text-xs font-semibold text-gray-700 block mb-2">Missing Keywords</span>
                            <div className="flex flex-wrap gap-1.5">
                              {['excel', 'powerpoint', 'strategy', 'budget', 'forecasting'].map((keyword, i) => (
                                <span key={i} className="text-xs bg-gray-50 text-gray-700 px-3 py-1 rounded-md border border-gray-200 flex items-center">
                                  <span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5"></span>
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

"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MapPin, Building, Calendar, DollarSign, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/ui/page-header"
import { mockJobListings, getJobMatches, type JobListing, type JobMatch } from "@/lib/job-matching-service"
import { getSavedCVs } from "@/lib/user-data-service"
import type { SavedCV } from "@/lib/user-data-service"
import { getAIJobMatches, enhanceJobWithAI, type AIJobMatch } from "@/lib/ai-job-service"
import { AIJobMatchingLoader, JobSearchLoader } from "@/components/loading-animations"

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListing[]>(mockJobListings)
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([])
  const [aiMatches, setAIMatches] = useState<AIJobMatch[]>([])
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [aiEnabled, setAIEnabled] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      try {
        // Load saved CVs
        const { data: cvs, error } = await getSavedCVs()
        if (error) {
          console.error('Error loading CVs:', error)
          setIsLoading(false)
          return
        }
        
        // Try to get active CV first, then fall back to saved CVs
        const activeCV = localStorage.getItem('active_cv')
        if (activeCV) {
          const parsedCV = JSON.parse(activeCV)
          setSavedCVs([parsedCV])
          if (parsedCV.cvData) {
            const matches = getJobMatches(parsedCV.cvData, 30)
            setJobMatches(matches)
          }
        } else if (cvs && cvs.length > 0) {
          setSavedCVs(cvs)
          // Get job matches for the most recent CV
          const mostRecentCV = cvs.sort((a, b) => 
            new Date(b.updated_at || b.created_at).getTime() - 
            new Date(a.updated_at || a.created_at).getTime()
          )[0]
          
          if (mostRecentCV.cv_data) {
            const matches = getJobMatches(mostRecentCV.cv_data, 30)
            setJobMatches(matches)
            
            // Get AI matches
            if (aiEnabled) {
              const aiMatches = await getAIJobMatches(mostRecentCV.cv_data, mockJobListings)
              setAIMatches(aiMatches)
            }
          }
        } else {
          // Check localStorage for saved CVs
          const localCVs = localStorage.getItem('saved_cvs')
          if (localCVs) {
            const parsedCVs = JSON.parse(localCVs)
            if (parsedCVs.length > 0) {
              setSavedCVs(parsedCVs)
              const matches = getJobMatches(parsedCVs[0].cvData, 30)
              setJobMatches(matches)
              
              // Get AI matches
              if (aiEnabled) {
                const aiMatches = await getAIJobMatches(parsedCVs[0].cvData, mockJobListings)
                setAIMatches(aiMatches)
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load job matching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = !selectedLocation || job.location.includes(selectedLocation)
    return matchesSearch && matchesLocation
  })

  const locations = [...new Set(jobs.map(job => job.location.split(',')[1]?.trim()).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Find Your Next Job"
        description="Discover job opportunities that match your skills and experience. Get personalized recommendations based on your CV."
      >
        <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
              placeholder="Search jobs, companies, or keywords..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="h-12 px-4 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          <Button size="lg" className="h-12 px-8">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
            <JobSearchLoader />
            {aiEnabled && <AIJobMatchingLoader />}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Job Listings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredJobs.length} Job{filteredJobs.length !== 1 ? 's' : ''} Found
                </h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={aiEnabled} 
                      onChange={(e) => setAIEnabled(e.target.checked)}
                      className="rounded"
                    />
                    AI Matching
                  </label>
                  <div className="text-sm text-gray-600">
                    Sorted by {aiEnabled ? 'AI relevance' : 'relevance'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredJobs.map((job) => {
                  const match = jobMatches.find(m => m.job.id === job.id)
                  const aiMatch = aiMatches.find(m => m.jobId === job.id)
                  const enhancedJob = enhanceJobWithAI(job, aiMatch)
                  
                  return (
                    <Card key={job.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                              {job.title}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {job.company}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </div>
                            </div>
                          </div>
                          {(match || aiMatch) && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {aiMatch ? aiMatch.matchScore : match?.matchScore}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {aiMatch ? 'AI Match' : 'Match'}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(match || aiMatch) && (
                          <div>
                            <Progress value={aiMatch ? aiMatch.matchScore : match?.matchScore || 0} className="h-2" />
                            {aiMatch && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                <strong>AI Insight:</strong> {aiMatch.reasoning}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-gray-700">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.salary}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(job.postedDate).toLocaleDateString()}
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {job.type.replace('-', ' ')}
                          </Badge>
                        </div>

                        {((match && match.matchedKeywords.length > 0) || (aiMatch && aiMatch.skillsMatch.length > 0)) && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Your Matching Skills:</div>
                            <div className="flex flex-wrap gap-1">
                              {(aiMatch ? aiMatch.skillsMatch : match?.matchedKeywords || []).slice(0, 6).map((keyword) => (
                                <Badge key={keyword} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                            {aiMatch && aiMatch.skillsGap.length > 0 && (
                              <div className="mt-2">
                                <div className="text-sm font-medium text-gray-700 mb-1">Skills to Develop:</div>
                                <div className="flex flex-wrap gap-1">
                                  {aiMatch.skillsGap.map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button className="flex-1">
                            Apply Now
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                          <Button variant="outline">
                            Save Job
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* CV Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Your CV Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {savedCVs.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active CV:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {savedCVs.find(cv => cv.cv_data) ? 
                            savedCVs.find(cv => cv.cv_data)?.name || 'Latest CV' : 
                            'No CV Data'
                          }
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Job matches are based on your most recent CV. {savedCVs.length > 1 && 'Switch CV or '} Update your CV to get better matches.
                      </div>
                      <div className="flex gap-2">
                        {savedCVs.length > 1 && (
                          <select 
                            className="flex-1 text-xs p-2 border rounded"
                            onChange={(e) => {
                              const selectedCV = savedCVs.find(cv => cv.id === e.target.value)
                              if (selectedCV?.cv_data) {
                                const matches = getJobMatches(selectedCV.cv_data, 30)
                                setJobMatches(matches)
                              }
                            }}
                          >
                            {savedCVs.map(cv => (
                              <option key={cv.id} value={cv.id}>{cv.name}</option>
                            ))}
                          </select>
                        )}
                        <Button variant="outline" size="sm" className={savedCVs.length > 1 ? "" : "w-full"}>
                          Update CV
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="text-sm text-gray-600">
                        Create a CV to get personalized job recommendations
                      </div>
                      <Button size="sm" className="w-full">
                        Create CV
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Alerts</CardTitle>
                  <CardDescription>Get notified about new jobs that match your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email notifications</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly digest</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                    <Button size="sm" className="w-full">
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Market Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Jobs</span>
                    <span className="font-semibold">{jobs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Your Matches</span>
                    <span className="font-semibold text-green-600">{jobMatches.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New This Week</span>
                    <span className="font-semibold">12</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  FileText, 
  Target,
  Calendar,
  Award,
  Briefcase,
  Eye,
  Download,
  Share2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  getUserAnalytics, 
  getUserApplications, 
  calculateCVPerformance,
  type ApplicationTracking,
  type UserAnalytics,
  type CVPerformanceMetrics
} from '@/lib/analytics-service'

export default function AnalyticsPage() {
  const { user, loading, isConfigured } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [applications, setApplications] = useState<ApplicationTracking[]>([])
  const [cvPerformance, setCvPerformance] = useState<Record<string, CVPerformanceMetrics>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && isConfigured && !user) {
      router.push("/login?redirect=analytics&message=Please sign in to view your analytics")
    }
  }, [user, loading, router, isConfigured])

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!isConfigured || !user) return

      setIsLoading(true)
      setError(null)

      try {
        // Load user analytics
        const userAnalytics = await getUserAnalytics()
        if (userAnalytics) {
          setAnalytics(userAnalytics)
        }

        // Load applications
        const { data: applicationsData, error: appsError } = await getUserApplications()
        if (appsError) {
          throw new Error(appsError.message)
        }
        setApplications(applicationsData || [])

        // Load CV performance for each unique CV
        const uniqueCvIds = [...new Set(applicationsData?.map(app => app.cv_id) || [])]
        const performanceData: Record<string, CVPerformanceMetrics> = {}
        
        for (const cvId of uniqueCvIds) {
          if (cvId) {
            const performance = await calculateCVPerformance(cvId)
            if (performance) {
              performanceData[cvId] = performance
            }
          }
        }
        setCvPerformance(performanceData)

      } catch (err) {
        console.error('Error loading analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [user, isConfigured])

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <Alert className="border-blue-200 bg-blue-50">
            <BarChart className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Demo Mode:</strong> Analytics features require authentication setup. 
              This is a preview of what your analytics dashboard would look like.
            </AlertDescription>
          </Alert>
          
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600 mb-8">Track your CV performance and job application success rates</p>
            
            {/* Demo analytics cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total CVs</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">+1 from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Applications</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+4 from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">25%</div>
                  <p className="text-xs text-muted-foreground">+5% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg ATS Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Error loading analytics: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your CV performance and job application success rates</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total CVs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total_cvs_created || 0}</div>
              <p className="text-xs text-muted-foreground">CVs created</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total_applications || 0}</div>
              <p className="text-xs text-muted-foreground">Jobs applied to</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.overall_response_rate || 0}%</div>
              <p className="text-xs text-muted-foreground">Employer responses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Template</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold capitalize">{analytics?.most_successful_template || 'None'}</div>
              <p className="text-xs text-muted-foreground">Top performing</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="cvs">CV Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications tracked yet</h3>
                    <p className="text-gray-600 mb-4">Start tracking your job applications to see analytics here.</p>
                    <Button onClick={() => router.push('/create')}>Create Your First CV</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.slice(0, 10).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{app.job_title}</h4>
                          <p className="text-sm text-gray-600">{app.company_name}</p>
                          <p className="text-xs text-gray-500">{app.job_board} • {app.application_date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              app.status === 'hired' ? 'default' :
                              app.status === 'interview' ? 'secondary' :
                              app.status === 'viewed' ? 'outline' :
                              'destructive'
                            }
                          >
                            {app.status}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            ATS: {app.ats_score_at_application}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cvs" className="space-y-6">
            <div className="grid gap-6">
              {Object.entries(cvPerformance).map(([cvId, performance]) => (
                <Card key={cvId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>CV Performance</span>
                      <Badge variant="outline">{performance.total_applications} applications</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{performance.response_rate}%</div>
                        <p className="text-sm text-gray-600">Response Rate</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{performance.interview_rate}%</div>
                        <p className="text-sm text-gray-600">Interview Rate</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{performance.success_rate}%</div>
                        <p className="text-sm text-gray-600">Success Rate</p>
                      </div>
                    </div>
                    
                    {performance.improvement_suggestions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Improvement Suggestions:</h4>
                        <ul className="space-y-1">
                          {performance.improvement_suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Response Rate Trend</p>
                      <p className="text-sm text-gray-600">Your response rate is above average for your industry</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">ATS Optimization</p>
                      <p className="text-sm text-gray-600">CVs with 80+ ATS scores get 3x more responses</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Best Application Days</p>
                      <p className="text-sm text-gray-600">Tuesday-Thursday applications get better response rates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">Optimize Your ATS Score</p>
                    <p className="text-sm text-blue-700">Use our enhanced ATS feedback to improve keyword matching</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-900">Track More Applications</p>
                    <p className="text-sm text-green-700">Add job applications to get better insights and trends</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">Try Different Templates</p>
                    <p className="text-sm text-purple-700">Test various CV templates to find what works best</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

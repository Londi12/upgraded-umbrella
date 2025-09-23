"use client"

import { useState, useEffect } from "react"
import { Users, FileText, DollarSign, MessageCircle, Eye, Calendar, Download, Settings, RefreshCw, Shield, Upload, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdminChatWindow } from "@/components/admin-chat-window"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { checkIsAdmin, getUserStats, getRecentUsers, getLiveActivity, getJobs, updateJob, deleteJob } from "@/lib/supabase"
import { formatAndTruncateJobDescription } from "@/lib/text-formatter"

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [activeChats, setActiveChats] = useState(3)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Real-time data (would come from database)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCVs: 0,
    revenue: 0,
    activeUsers: 0,
    todaySignups: 0,
    todayDownloads: 0
  })

  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [liveActivity, setLiveActivity] = useState<any[]>([])

  useEffect(() => {
    checkAdminPermissions()
  }, [user, loading])

  const checkAdminPermissions = async () => {
    if (loading) return

    if (!user) {
      router.push('/login?redirect=admin')
      return
    }

    // In demo mode, allow access
    const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

    if (isDemoMode) {
      setIsAdmin(true)
      setCheckingPermissions(false)
      loadRealData()
      return
    }

    // Check if user is admin by querying Supabase admin_users table
    try {
      const isUserAdmin = await checkIsAdmin(user.id)

      if (isUserAdmin) {
        setIsAdmin(true)
        loadRealData()
      } else {
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Error checking admin permissions:', error)
      router.push('/')
      return
    }

    setCheckingPermissions(false)
  }

  useEffect(() => {
    if (isAdmin) {
      const interval = setInterval(loadRealData, 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  const loadRealData = async () => {
    try {
      // Fetch real data from Supabase
      const [statsData, usersData, activityData] = await Promise.all([
        getUserStats(),
        getRecentUsers(),
        getLiveActivity()
      ])

      if (statsData) {
        setStats(statsData)
      }

      if (usersData) {
        setRecentUsers(usersData)
      }

      if (activityData) {
        setLiveActivity(activityData)
      }

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading real data:', error)
      // Fallback to mock data if Supabase fails
      const savedCVs = JSON.parse(localStorage.getItem('saved_cvs') || '[]')
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')

      setStats({
        totalUsers: 2847 + mockUsers.length,
        totalCVs: 5634 + savedCVs.length,
        revenue: 89450 + (mockUsers.length * 299),
        activeUsers: Math.floor(Math.random() * 50) + 150,
        todaySignups: Math.floor(Math.random() * 20) + 5,
        todayDownloads: Math.floor(Math.random() * 100) + 50
      })

      setRecentUsers([
        {
          id: 1,
          name: "John Smith",
          email: "john@example.com",
          plan: "Premium",
          joined: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          cvsCreated: 3,
          lastActive: "2 hours ago",
          status: "online"
        },
        {
          id: 2,
          name: "Sarah Johnson",
          email: "sarah@example.com",
          plan: "Pro",
          joined: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          cvsCreated: 7,
          lastActive: "1 hour ago",
          status: "offline"
        },
        {
          id: 3,
          name: "Mike Wilson",
          email: "mike@example.com",
          plan: "Base",
          joined: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          cvsCreated: 1,
          lastActive: "30 minutes ago",
          status: "online"
        }
      ])

      setLiveActivity([
        { type: 'cv_created', user: 'John S.', time: '2 min ago', details: 'Created "Software Developer CV"' },
        { type: 'user_signup', user: 'Lisa M.', time: '5 min ago', details: 'Signed up for Premium plan' },
        { type: 'pdf_download', user: 'Mike W.', time: '8 min ago', details: 'Downloaded CV as PDF' },
        { type: 'job_match', user: 'Sarah J.', time: '12 min ago', details: 'Generated 5 job matches' }
      ])
    }
  }

  if (loading || checkingPermissions) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Admin permissions required</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-blue-200">CVKonnekt Analytics & Management</p>
              <p className="text-xs text-blue-300 mt-1">Last updated: {lastRefresh.toLocaleTimeString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <Badge className="bg-orange-500/20 text-orange-300">{activeChats} Active Chats</Badge>
              <Badge className="bg-green-500/20 text-green-300">Demo Mode</Badge>
              <Button variant="outline" size="sm" onClick={loadRealData} className="border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-green-600">+{stats.todaySignups} today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CVs Created</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCVs.toLocaleString()}</div>
              <p className="text-xs text-green-600">+{stats.todayDownloads} downloads today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{stats.revenue.toLocaleString()}</div>
              <p className="text-xs text-green-600">+15% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-blue-600">Users online</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="jobs">Job Management</TabsTrigger>
            <TabsTrigger value="activity">Live Activity</TabsTrigger>
            <TabsTrigger value="chat">Support Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Joined: {new Date(user.joined).toLocaleDateString()} • {user.cvsCreated} CVs • {user.lastActive}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.plan === 'Pro' ? 'default' : 'secondary'}>
                          {user.plan}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>User Details: {user.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Plan</label>
                                  <p className="text-sm text-gray-600">{user.plan}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">CVs Created</label>
                                  <p className="text-sm text-gray-600">{user.cvsCreated}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <p className={`text-sm ${user.status === 'online' ? 'text-green-600' : 'text-gray-600'}`}>
                                    {user.status}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm">Send Message</Button>
                                <Button variant="outline" size="sm">View CVs</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <JobManagementTab />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveActivity.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'cv_created' ? 'bg-green-500' :
                        activity.type === 'user_signup' ? 'bg-blue-500' :
                        activity.type === 'pdf_download' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.user}</p>
                        <p className="text-xs text-gray-600">{activity.details}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Support Chat</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={isOnline ? "destructive" : "default"} 
                      size="sm"
                      onClick={() => setIsOnline(!isOnline)}
                    >
                      {isOnline ? 'Go Offline' : 'Go Online'}
                    </Button>
                    <Badge variant="outline">{activeChats} active</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Sarah Johnson</span>
                      <span className="text-xs text-gray-500">2 min ago</span>
                    </div>
                    <p className="text-sm text-gray-700">"Hi, I'm having trouble downloading my CV as PDF. Can you help?"</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm">Reply</Button>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Mike Wilson</span>
                      <span className="text-xs text-gray-500">5 min ago</span>
                    </div>
                    <p className="text-sm text-gray-700">"How do I upgrade to Premium plan?"</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm">Reply</Button>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


      </div>
      
      <AdminChatWindow />
    </div>
  )
}

function JobManagementTab() {
  const [uploadedJobs, setUploadedJobs] = useState<any[]>([])
  const [existingJobs, setExistingJobs] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load existing jobs from database
  const loadExistingJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const { data, error } = await getJobs()

      if (error) {
        console.error('Error loading jobs:', error)
        setUploadStatus('Error loading jobs from database')
      } else {
        setExistingJobs(data || [])
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      setUploadStatus('Error loading jobs from database')
    } finally {
      setIsLoadingJobs(false)
    }
  }

  useEffect(() => {
    loadExistingJobs()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setUploadStatus('Please upload an Excel (.xlsx, .xls) or CSV file')
      return
    }

    setIsUploading(true)
    setUploadStatus('Processing file...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-jobs', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadedJobs(result.jobs || [])
        setUploadStatus(`Successfully uploaded ${result.count || 0} jobs!`)
        // Refresh existing jobs after upload
        loadExistingJobs()
      } else {
        setUploadStatus(`Error: ${result.error || 'Upload failed'}`)
      }
    } catch (error) {
      setUploadStatus('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditJob = (job: any) => {
    setEditingJob({ ...job })
  }

  const handleSaveJob = async () => {
    if (!editingJob) return

    try {
      const { error } = await updateJob(editingJob.id, editingJob)

      if (error) {
        setUploadStatus(`Error updating job: ${error.message}`)
      } else {
        setUploadStatus('Job updated successfully!')
        setEditingJob(null)
        loadExistingJobs() // Refresh the list
      }
    } catch (error) {
      setUploadStatus('Error updating job. Please try again.')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      const { error } = await deleteJob(jobId)

      if (error) {
        setUploadStatus(`Error deleting job: ${error.message}`)
      } else {
        setUploadStatus('Job deleted successfully!')
        loadExistingJobs() // Refresh the list
      }
    } catch (error) {
      setUploadStatus('Error deleting job. Please try again.')
    }
  }

  const filteredJobs = existingJobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Jobs from Excel</h3>
              <p className="text-gray-600 mb-4">
                Upload an Excel file (.xlsx, .xls) or CSV with job listings
              </p>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="max-w-xs mx-auto"
                />
                {isUploading && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
                {uploadStatus && (
                  <p className={`text-sm ${
                    uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Upload Format Guide */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Expected Excel Format:</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Required columns:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>title - Job title</li>
                  <li>company - Company name</li>
                  <li>location - Job location</li>
                  <li>snippet - Job description</li>
                  <li>url - Job posting URL</li>
                  <li>source - Source website (e.g., "LinkedIn", "Indeed")</li>
                  <li>posted_date - Date posted (YYYY-MM-DD format)</li>
                </ul>
              </div>
            </div>

            {/* Recently Uploaded Jobs */}
            {uploadedJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recently Uploaded Jobs ({uploadedJobs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {uploadedJobs.slice(0, 10).map((job, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatAndTruncateJobDescription(job.snippet, 100)}
                            </p>
                          </div>
                          <Badge variant="outline">{job.source}</Badge>
                        </div>
                      </div>
                    ))}
                    {uploadedJobs.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {uploadedJobs.length - 10} more jobs
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing Jobs Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Existing Jobs ({existingJobs.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" size="sm" onClick={loadExistingJobs} disabled={isLoadingJobs}>
                <RefreshCw className={`h-4 w-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingJobs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading jobs...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredJobs.slice(0, 20).map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{job.title}</h4>
                        <Badge variant="outline">{job.source}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{job.company} • {job.location}</p>
                      <p className="text-xs text-gray-500">
                        {formatAndTruncateJobDescription(job.snippet, 150)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Posted: {new Date(job.posted_date).toLocaleDateString()} •
                        URL: <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Job
                        </a>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEditJob(job)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredJobs.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  {searchTerm ? 'No jobs found matching your search.' : 'No jobs found in the database.'}
                </p>
              )}
              {filteredJobs.length > 20 && (
                <p className="text-sm text-gray-500 text-center">
                  Showing 20 of {filteredJobs.length} jobs. Use search to find specific jobs.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Job Dialog */}
      {editingJob && (
        <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Job Title</label>
                  <Input
                    value={editingJob.title || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    placeholder="Enter job title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    value={editingJob.company || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={editingJob.location || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Source</label>
                  <Input
                    value={editingJob.source || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, source: e.target.value })}
                    placeholder="e.g., LinkedIn, Indeed"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Job URL</label>
                <Input
                  value={editingJob.url || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, url: e.target.value })}
                  placeholder="Enter job posting URL"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Posted Date</label>
                <Input
                  type="date"
                  value={editingJob.posted_date ? new Date(editingJob.posted_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingJob({ ...editingJob, posted_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Job Description</label>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={editingJob.snippet || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, snippet: e.target.value })}
                  placeholder="Enter job description"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingJob(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveJob}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

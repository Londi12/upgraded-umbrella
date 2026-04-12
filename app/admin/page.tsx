"use client"

import { useState, useEffect } from "react"
import { Users, FileText, BarChart2, RefreshCw, Shield, Upload, Briefcase, LogOut, Menu, X, Trash2, Pencil } from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge, 
  Button, 
  Input,
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { checkIsAdmin, getUserStats, getRecentUsers, getLiveActivity, getJobs, updateJob, deleteJob } from "@/lib/supabase"
import { formatAndTruncateJobDescription } from "@/lib/text-formatter"

const NAV = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'activity', label: 'Activity', icon: FileText },
]

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const [stats, setStats] = useState({ totalUsers: 0, totalCVs: 0, revenue: 0, activeUsers: 0, todaySignups: 0, todayDownloads: 0 })
  const [recentUsers, setRecentUsers] = useState<{id: string, name: string, email: string, plan: string, joined: string, cvsCreated: number, lastActive: string, status: string}[]>([])
  const [liveActivity, setLiveActivity] = useState<{type: string, user: string, time: string, details: string}[]>([])

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login?redirect=admin'); setCheckingPermissions(false); return }
    checkIsAdmin(user.id)
      .then(isUserAdmin => {
        if (isUserAdmin) { setIsAdmin(true); loadData() }
        else router.push('/')
      })
      .catch(() => router.push('/'))
      .finally(() => setCheckingPermissions(false))
  }, [user, loading])



  useEffect(() => {
    if (!isAdmin) return
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [isAdmin])

  const loadData = async () => {
    const [statsData, usersData, activityData] = await Promise.all([getUserStats(), getRecentUsers(), getLiveActivity()])
    if (statsData) setStats(statsData)
    if (usersData) setRecentUsers(usersData)
    if (activityData) setLiveActivity(activityData)
    setLastRefresh(new Date())
  }

  if (loading || checkingPermissions) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-4">Admin permissions required</p>
          <Button onClick={() => router.push('/')} variant="outline" className="border-slate-600 text-slate-300">Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <p className="text-white font-semibold">CVKonnekt</p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 px-3 mb-2">{user?.email}</p>
          <button
            onClick={() => { signOut(); router.push('/') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-white font-semibold capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Updated {lastRefresh.toLocaleTimeString()}</span>
            <Button variant="ghost" size="sm" onClick={loadData} className="text-slate-400 hover:text-white">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && <UsersTab users={recentUsers} />}
          {activeTab === 'jobs' && <JobsTab />}
          {activeTab === 'activity' && <ActivityTab activity={liveActivity} />}
        </main>
      </div>
    </div>
  )
}

function OverviewTab({ stats }: { stats: { totalUsers: number, totalCVs: number, revenue: number, activeUsers: number, todaySignups: number, todayDownloads: number } }) {
  const cards = [
    { label: 'Total Users', value: stats.totalUsers, sub: `+${stats.todaySignups} today`, color: 'text-blue-400' },
    { label: 'CVs Created', value: stats.totalCVs, sub: `+${stats.todayDownloads} downloads today`, color: 'text-green-400' },
    { label: 'Revenue', value: `R${stats.revenue.toLocaleString()}`, sub: 'Lifetime', color: 'text-yellow-400' },
    { label: 'Active Users', value: stats.activeUsers, sub: 'Currently online', color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsersTab({ users }: { users: {id: string, name: string, email: string, plan: string, joined: string}[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h2 className="text-white font-medium">Recent Users</h2>
      </div>
      {users.length === 0 ? (
        <p className="text-slate-500 text-sm p-6">No users found.</p>
      ) : (
        <div className="divide-y divide-slate-800">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-white text-sm font-medium">{u.name}</p>
                <p className="text-slate-400 text-xs">{u.email}</p>
                <p className="text-slate-500 text-xs mt-0.5">Joined {new Date(u.joined).toLocaleDateString()}</p>
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">{u.plan}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityTab({ activity }: { activity: {type: string, user: string, time: string, details: string}[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h2 className="text-white font-medium">Recent Activity</h2>
      </div>
      {activity.length === 0 ? (
        <p className="text-slate-500 text-sm p-6">No recent activity.</p>
      ) : (
        <div className="divide-y divide-slate-800">
          {activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-6 py-4">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm">{a.details}</p>
                <p className="text-slate-500 text-xs mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function JobsTab() {
  const [existingJobs, setExistingJobs] = useState<{id: string, title: string, company: string, location: string, source: string, snippet: string, posted_date: string, url: string}[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingJob, setEditingJob] = useState<{id: string, title: string, company: string, location: string, source: string, snippet: string, posted_date: string, url: string} | null>(null)

  const loadJobs = async () => {
    setIsLoading(true)
    const { data } = await getJobs()
    setExistingJobs(data || [])
    setIsLoading(false)
  }

  useEffect(() => { loadJobs() }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadStatus('Uploading...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-jobs', { method: 'POST', body: formData })
      const result = await res.json()
      if (res.ok) { setUploadStatus(`Uploaded ${result.count || 0} jobs`); loadJobs() }
      else setUploadStatus(`Error: ${result.error || 'Upload failed'}`)
    } catch { setUploadStatus('Upload failed') }
    finally { setIsUploading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job?')) return
    await deleteJob(id)
    loadJobs()
  }

  const handleSave = async () => {
    if (!editingJob) return
    await updateJob(editingJob.id, editingJob)
    setEditingJob(null)
    loadJobs()
  }

  const filtered = existingJobs.filter(j =>
    j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white font-medium mb-4">Upload Jobs</h2>
        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-3">Upload Excel (.xlsx, .xls) or CSV</p>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={isUploading} className="max-w-xs mx-auto bg-slate-800 border-slate-700 text-slate-300" />
          {uploadStatus && <p className={`text-sm mt-2 ${uploadStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{uploadStatus}</p>}
        </div>
      </div>

      {/* Jobs list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-medium">Jobs ({existingJobs.length})</h2>
          <div className="flex items-center gap-2">
            <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-48 bg-slate-800 border-slate-700 text-slate-300 text-sm" />
            <Button variant="ghost" size="sm" onClick={loadJobs} className="text-slate-400 hover:text-white">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
          {filtered.slice(0, 50).map(job => (
            <div key={job.id} className="flex items-start justify-between px-6 py-4">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-white text-sm font-medium">{job.title}</p>
                <p className="text-slate-400 text-xs">{job.company} · {job.location}</p>
                <p className="text-slate-500 text-xs mt-0.5">{formatAndTruncateJobDescription(job.snippet, 80)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setEditingJob({ ...job })} className="text-slate-400 hover:text-white h-8 w-8 p-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)} className="text-red-400 hover:text-red-300 h-8 w-8 p-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-sm p-6">{searchTerm ? 'No jobs match your search.' : 'No jobs in database.'}</p>}
        </div>
      </div>

      {/* Edit dialog */}
      {editingJob && (
        <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {['title', 'company', 'location', 'source', 'url'].map(field => (
                <div key={field}>
                  <label className="text-xs text-slate-400 capitalize">{field}</label>
                  <Input value={editingJob[field] || ''} onChange={e => setEditingJob({ ...editingJob, [field]: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400">Description</label>
                <textarea value={editingJob.snippet || ''} onChange={e => setEditingJob({ ...editingJob, snippet: e.target.value })} className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm min-h-[80px]" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingJob(null)} className="border-slate-700 text-slate-300">Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart2,
  Briefcase,
  Eye,
  FileText,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
  Users,
  X,
  Download,
  Activity,
  Ban,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  checkIsAdmin,
  getAdminCVs,
  getAdminOverviewStats,
  getAdminUserDetail,
  getAdminUserActivity,
  getAdminUsers,
  getJobs,
  getLiveActivity,
  supabase,
  updateJob,
  deleteJob,
  setAdminUserStatus,
  deleteAdminUser,
  deleteAdminCV,
  type AdminCVItem,
  type AdminManagedUser,
  type AdminOverviewStats,
  type AdminUserApplicationItem,
  type AdminUserDetail,
  type AdminUserActivityItem,
} from "@/lib/supabase"
import { formatAndTruncateJobDescription } from "@/lib/text-formatter"

type AdminTab = "overview" | "users" | "cvs" | "jobs" | "activity"

const NAV: Array<{ id: AdminTab; label: string; icon: any }> = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "users", label: "Users", icon: Users },
  { id: "cvs", label: "CVs", icon: FileText },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "activity", label: "Activity", icon: Activity },
]

const EMPTY_STATS: AdminOverviewStats = {
  totalUsers: 0,
  newSignupsToday: 0,
  newSignupsWeek: 0,
  newSignupsMonth: 0,
  activeJobListings: 0,
  filledPositions: 0,
  cvUploadsCount: 0,
  platformEngagement: {
    logins: 0,
    searches: 0,
    applications: 0,
  },
}

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const [stats, setStats] = useState<AdminOverviewStats>(EMPTY_STATS)
  const [users, setUsers] = useState<AdminManagedUser[]>([])
  const [cvs, setCvs] = useState<AdminCVItem[]>([])
  const [recentActivity, setRecentActivity] = useState<{ type: string; user: string; time: string; details: string }[]>([])

  const [userSearch, setUserSearch] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "job-seeker" | "employer">("all")
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "suspended">("all")

  const [cvSearch, setCvSearch] = useState("")

  const [selectedUserActivity, setSelectedUserActivity] = useState<AdminUserActivityItem[]>([])
  const [selectedUserName, setSelectedUserName] = useState("")
  const [activityOpen, setActivityOpen] = useState(false)
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail>({ cvs: [], applications: [], templatesUsed: [] })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/login?redirect=admin")
      setCheckingPermissions(false)
      return
    }

    checkIsAdmin(user.id)
      .then((isUserAdmin) => {
        if (!isUserAdmin) {
          router.push("/")
          return
        }
        setIsAdmin(true)
        void loadAllData()
      })
      .catch(() => router.push("/"))
      .finally(() => setCheckingPermissions(false))
  }, [user, loading])

  useEffect(() => {
    if (!isAdmin) return
    const interval = setInterval(() => {
      void loadAllData(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [isAdmin, userSearch, userRoleFilter, userStatusFilter, cvSearch])

  const loadAllData = async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true)
    try {
      const [
        statsData,
        usersData,
        cvsData,
        activityData,
      ] = await Promise.all([
        getAdminOverviewStats(),
        getAdminUsers({ search: userSearch, role: userRoleFilter, status: userStatusFilter }),
        getAdminCVs(cvSearch),
        getLiveActivity(),
      ])

      if (statsData) setStats(statsData)
      setUsers(usersData || [])
      setCvs(cvsData || [])
      setRecentActivity(activityData || [])
      setLastRefresh(new Date())
    } finally {
      if (showSpinner) setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    void loadAllData(false)
  }, [userSearch, userRoleFilter, userStatusFilter, cvSearch])

  const handleUserStatus = async (targetUserId: string, status: "active" | "suspended") => {
    await setAdminUserStatus(targetUserId, status)
    await loadAllData(false)
  }

  const handleDeleteUser = async (targetUserId: string) => {
    if (!window.confirm("Delete this user and their app data? This cannot be undone.")) return
    await deleteAdminUser(targetUserId)
    await loadAllData(false)
  }

  const openUserActivity = async (targetUserId: string, userName: string) => {
    const logs = await getAdminUserActivity(targetUserId)
    setSelectedUserActivity(logs)
    setSelectedUserName(userName)
    setActivityOpen(true)
  }

  const openUserDetails = async (targetUserId: string, userName: string) => {
    setSelectedUserName(userName)
    setDetailsLoading(true)
    setDetailsOpen(true)

    try {
      const detail = await getAdminUserDetail(targetUserId)
      setSelectedUserDetail(detail)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleDeleteCV = async (cvId: string) => {
    if (!window.confirm("Delete this CV?")) return
    await deleteAdminCV(cvId)
    await loadAllData(false)
  }

  if (loading || checkingPermissions) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
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
          <Button onClick={() => router.push("/")} variant="outline" className="border-slate-600 text-slate-300">Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <p className="text-white font-semibold">CVKonnekt</p>
            <p className="text-xs text-slate-400">Admin Dashboard</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
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
            onClick={() => {
              void signOut()
              router.push("/")
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-white font-semibold capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Updated {lastRefresh.toLocaleTimeString()}</span>
            <Button variant="ghost" size="sm" onClick={() => void loadAllData()} className="text-slate-400 hover:text-white">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "overview" && <OverviewTab stats={stats} />}

          {activeTab === "users" && (
            <UsersTab
              users={users}
              search={userSearch}
              setSearch={setUserSearch}
              roleFilter={userRoleFilter}
              setRoleFilter={setUserRoleFilter}
              statusFilter={userStatusFilter}
              setStatusFilter={setUserStatusFilter}
              onActivate={(id) => void handleUserStatus(id, "active")}
              onSuspend={(id) => void handleUserStatus(id, "suspended")}
              onDelete={(id) => void handleDeleteUser(id)}
              onViewActivity={(id, name) => void openUserActivity(id, name)}
              onViewDetails={(id, name) => void openUserDetails(id, name)}
            />
          )}

          {activeTab === "cvs" && (
            <CVManagementTab
              cvs={cvs}
              search={cvSearch}
              setSearch={setCvSearch}
              onDelete={(id) => void handleDeleteCV(id)}
            />
          )}

          {activeTab === "jobs" && <JobsTab />}

          {activeTab === "activity" && <ActivityTab activity={recentActivity} />}
        </main>
      </div>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Activity Log: {selectedUserName}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-800">
            {selectedUserActivity.length === 0 ? (
              <p className="text-slate-400 text-sm p-4">No activity found for this user.</p>
            ) : (
              selectedUserActivity.map((item) => (
                <div key={item.id} className="p-4">
                  <p className="text-sm text-slate-200">{item.details}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(item.time).toLocaleString()} • {item.type}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">User Details: {selectedUserName}</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>
          ) : (
            <UserDetailsContent detail={selectedUserDetail} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OverviewTab({ stats }: { stats: AdminOverviewStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Total Users" value={stats.totalUsers} subtitle={`${stats.newSignupsToday} today`} color="text-blue-400" />
        <MetricCard title="CV Uploads" value={stats.cvUploadsCount} subtitle="All time" color="text-green-400" />
        <MetricCard title="Active Listings" value={stats.activeJobListings} subtitle={`${stats.filledPositions} filled`} color="text-amber-400" />
        <MetricCard title="Applications" value={stats.platformEngagement.applications} subtitle="Platform total" color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 text-base">Signups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SignupRow label="Today" value={stats.newSignupsToday} />
            <SignupRow label="This Week" value={stats.newSignupsWeek} />
            <SignupRow label="This Month" value={stats.newSignupsMonth} />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 text-base">Platform Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SignupRow label="Logins (activity proxy)" value={stats.platformEngagement.logins} />
            <SignupRow label="Searches" value={stats.platformEngagement.searches} />
            <SignupRow label="Applications" value={stats.platformEngagement.applications} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, subtitle, color }: { title: string; value: number; subtitle: string; color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  )
}

function SignupRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-100 font-semibold">{value}</span>
    </div>
  )
}

function UsersTab(props: {
  users: AdminManagedUser[]
  search: string
  setSearch: (v: string) => void
  roleFilter: 'all' | 'job-seeker' | 'employer'
  setRoleFilter: (v: 'all' | 'job-seeker' | 'employer') => void
  statusFilter: 'all' | 'active' | 'suspended'
  setStatusFilter: (v: 'all' | 'active' | 'suspended') => void
  onActivate: (userId: string) => void
  onSuspend: (userId: string) => void
  onDelete: (userId: string) => void
  onViewActivity: (userId: string, userName: string) => void
  onViewDetails: (userId: string, userName: string) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={props.search} onChange={(e) => props.setSearch(e.target.value)} placeholder="Search users by name or email" className="pl-9 bg-slate-800 border-slate-700 text-slate-100" />
            </div>
            <select value={props.roleFilter} onChange={(e) => props.setRoleFilter(e.target.value as any)} className="h-10 rounded-md bg-slate-800 border border-slate-700 text-slate-100 px-3 text-sm">
              <option value="all">All roles</option>
              <option value="job-seeker">Job seekers</option>
              <option value="employer">Employers</option>
            </select>
            <select value={props.statusFilter} onChange={(e) => props.setStatusFilter(e.target.value as any)} className="h-10 rounded-md bg-slate-800 border border-slate-700 text-slate-100 px-3 text-sm">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-medium">Users ({props.users.length})</h2>
        </div>

        {props.users.length === 0 ? (
          <p className="text-slate-500 text-sm p-6">No users found for selected filters.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {props.users.map((u) => (
              <div key={u.profileId} className="px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-slate-100 font-medium text-sm">{u.name}</p>
                    <p className="text-slate-400 text-xs">{u.email || "No email"}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Joined {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : "-"} • Last active {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : "-"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-slate-700 text-slate-300">{u.role}</Badge>
                    <Badge variant="outline" className={u.status === "active" ? "border-emerald-700 text-emerald-300" : "border-amber-700 text-amber-300"}>{u.status}</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-300">CVs {u.cvsCount}</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-300">Apps {u.applicationsCount}</Badge>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => props.onViewDetails(u.userId, u.name)}>
                    <FileText className="h-3.5 w-3.5 mr-1" /> Details
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => props.onViewActivity(u.userId, u.name)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Activity
                  </Button>
                  {u.status !== "active" ? (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => props.onActivate(u.userId)}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Activate
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => props.onSuspend(u.userId)}>
                      <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => props.onDelete(u.userId)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UserDetailsContent({ detail }: { detail: AdminUserDetail }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="User CVs" value={detail.cvs.length} subtitle="Saved CV records" color="text-blue-400" />
        <MetricCard title="Templates Used" value={detail.templatesUsed.length} subtitle="Unique template types" color="text-emerald-400" />
        <MetricCard title="Applications" value={detail.applications.length} subtitle="Tracked job applications" color="text-amber-400" />
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base">Templates Used</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.templatesUsed.length === 0 ? (
            <p className="text-slate-500 text-sm">No templates recorded.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {detail.templatesUsed.map((template) => (
                <Badge key={template} variant="outline" className="border-slate-700 text-slate-300">
                  {template}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base">User CVs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.cvs.length === 0 ? (
            <p className="text-slate-500 text-sm">No CVs found for this user.</p>
          ) : (
            detail.cvs.map((cv) => (
              <div key={cv.id} className="rounded-lg border border-slate-800 px-4 py-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-slate-100 text-sm font-medium">{cv.cvName}</p>
                  <p className="text-slate-500 text-xs mt-1">Template: {cv.templateType}</p>
                  <p className="text-slate-500 text-xs mt-1">Updated {cv.updatedAt ? new Date(cv.updatedAt).toLocaleString() : "-"}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="border-slate-700 text-slate-300">Views {cv.viewCount}</Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">Downloads {cv.downloadCount}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base">Job Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.applications.length === 0 ? (
            <p className="text-slate-500 text-sm">No tracked applications found for this user.</p>
          ) : (
            detail.applications.map((application) => (
              <ApplicationTrackerCard key={application.id} application={application} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ApplicationTrackerCard({ application }: { application: AdminUserApplicationItem }) {
  return (
    <div className="rounded-lg border border-slate-800 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-slate-100 text-sm font-medium">{application.jobTitle}</p>
          <p className="text-slate-400 text-xs">{application.companyName} • {application.jobBoard}</p>
          <p className="text-slate-500 text-xs mt-1">
            Applied {application.applicationDate ? new Date(application.applicationDate).toLocaleDateString() : "-"}
            {application.createdAt ? ` • Recorded ${new Date(application.createdAt).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="border-slate-700 text-slate-300">{application.status}</Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-300">ATS {application.atsScore}</Badge>
        </div>
      </div>

      {application.notes && (
        <p className="text-slate-400 text-xs mt-3">Notes: {application.notes}</p>
      )}
    </div>
  )
}

function CVManagementTab({ cvs, search, setSearch, onDelete }: { cvs: AdminCVItem[]; search: string; setSearch: (v: string) => void; onDelete: (id: string) => void }) {
  const totalViews = useMemo(() => cvs.reduce((sum, c) => sum + c.viewCount, 0), [cvs])
  const totalDownloads = useMemo(() => cvs.reduce((sum, c) => sum + c.downloadCount, 0), [cvs])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="CVs" value={cvs.length} subtitle="Uploaded" color="text-blue-400" />
        <MetricCard title="CV Views" value={totalViews} subtitle="Tracked interactions" color="text-emerald-400" />
        <MetricCard title="CV Downloads" value={totalDownloads} subtitle="Tracked interactions" color="text-violet-400" />
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search CVs by CV name or owner" className="pl-9 bg-slate-800 border-slate-700 text-slate-100" />
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-medium">Uploaded CVs ({cvs.length})</h2>
        </div>
        {cvs.length === 0 ? (
          <p className="text-slate-500 text-sm p-6">No CVs found.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {cvs.map((cv) => (
              <div key={cv.id} className="px-6 py-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-slate-100 text-sm font-medium">{cv.cvName}</p>
                  <p className="text-slate-400 text-xs">{cv.ownerName} • {cv.ownerEmail || "no email"}</p>
                  <p className="text-slate-500 text-xs mt-1">Template: {cv.templateType} • Updated {cv.updatedAt ? new Date(cv.updatedAt).toLocaleString() : "-"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    <Eye className="h-3 w-3 mr-1" /> {cv.viewCount}
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    <Download className="h-3 w-3 mr-1" /> {cv.downloadCount}
                  </Badge>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(cv.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityTab({ activity }: { activity: { type: string; user: string; time: string; details: string }[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h2 className="text-white font-medium">Recent Platform Activity</h2>
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
  const [existingJobs, setExistingJobs] = useState<{ id: string; title: string; company: string; location: string; source: string; snippet: string; posted_date: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [applicationUploadStatus, setApplicationUploadStatus] = useState("")
  const [isUploadingApplications, setIsUploadingApplications] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingJob, setEditingJob] = useState<{ id: string; title: string; company: string; location: string; source: string; snippet: string; posted_date: string; url: string } | null>(null)

  const loadJobs = async () => {
    setIsLoading(true)
    const { data } = await getJobs(undefined, undefined, 1000)
    setExistingJobs(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadJobs()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadStatus("Uploading...")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        setUploadStatus("Error: Unauthorized")
        return
      }

      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload-jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })
      const result = await res.json()
      if (res.ok) {
        const inserted = Number(result.insertedCount || 0)
        const updated = Number(result.updatedCount || 0)
        const skipped = Number(result.skippedMissingRequired || 0)
        const duplicates = Number(result.duplicateRowsCollapsed || 0)
        const parsed = Number(result.parsedRows || result.count || 0)
        setUploadStatus(
          `Parsed ${parsed}: inserted ${inserted}, updated ${updated}, skipped ${skipped}, duplicate rows collapsed ${duplicates}`
        )
        await loadJobs()
      } else {
        setUploadStatus(`Error: ${result.error || "Upload failed"}`)
      }
    } catch {
      setUploadStatus("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this job?")) return
    await deleteJob(id)
    await loadJobs()
  }

  const handleApplicationFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingApplications(true)
    setApplicationUploadStatus("Uploading applications...")

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        setApplicationUploadStatus("Error: Unauthorized")
        return
      }

      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload-applications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })
      const result = await res.json()

      if (!res.ok) {
        setApplicationUploadStatus(`Error: ${result.error || "Upload failed"}`)
        return
      }

      const inserted = Number(result.inserted || 0)
      const skipped = Number(result.skipped || 0)
      const totalRows = Number(result.totalRows || inserted + skipped)
      setApplicationUploadStatus(`Uploaded ${inserted}/${totalRows} applications (skipped ${skipped})`)
    } catch {
      setApplicationUploadStatus("Upload failed")
    } finally {
      setIsUploadingApplications(false)
    }
  }

  const handleSave = async () => {
    if (!editingJob) return
    await updateJob(editingJob.id, editingJob)
    setEditingJob(null)
    await loadJobs()
  }

  const filtered = existingJobs.filter((j) => j.title?.toLowerCase().includes(searchTerm.toLowerCase()) || j.company?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white font-medium mb-4">Upload Jobs</h2>
        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-3">Upload Excel (.xlsx, .xls) or CSV</p>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={isUploading} className="max-w-xs mx-auto bg-slate-800 border-slate-700 text-slate-300" />
          {uploadStatus && <p className={`text-sm mt-2 ${uploadStatus.includes("Error") ? "text-red-400" : "text-green-400"}`}>{uploadStatus}</p>}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white font-medium mb-4">Upload Job Applications</h2>
        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Upload CSV/Excel of applications</p>
          <p className="text-slate-500 text-xs mt-1 mb-3">
            Required columns: title or job_title, company or company_name. Optional: url, application_date, status, source/job_board, notes, ats_score.
          </p>
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleApplicationFileUpload}
            disabled={isUploadingApplications}
            className="max-w-xs mx-auto bg-slate-800 border-slate-700 text-slate-300"
          />
          {applicationUploadStatus && (
            <p className={`text-sm mt-2 ${applicationUploadStatus.includes("Error") ? "text-red-400" : "text-green-400"}`}>
              {applicationUploadStatus}
            </p>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-medium">Jobs ({existingJobs.length})</h2>
          <div className="flex items-center gap-2">
            <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 bg-slate-800 border-slate-700 text-slate-300 text-sm" />
            <Button variant="ghost" size="sm" onClick={() => void loadJobs()} className="text-slate-400 hover:text-white">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
          {filtered.map((job) => (
            <div key={job.id} className="flex items-start justify-between px-6 py-4">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-white text-sm font-medium">{job.title}</p>
                <p className="text-slate-400 text-xs">{job.company} • {job.location}</p>
                <p className="text-slate-500 text-xs mt-0.5">{formatAndTruncateJobDescription(job.snippet, 80)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setEditingJob({ ...job })} className="text-slate-400 hover:text-white h-8 w-8 p-0">
                  <FileText className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void handleDelete(job.id)} className="text-red-400 hover:text-red-300 h-8 w-8 p-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-sm p-6">{searchTerm ? "No jobs match your search." : "No jobs in database."}</p>}
        </div>
      </div>

      {editingJob && (
        <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {["title", "company", "location", "source", "url"].map((field) => (
                <div key={field}>
                  <label className="text-xs text-slate-400 capitalize">{field}</label>
                  <Input value={(editingJob as any)[field] || ""} onChange={(e) => setEditingJob({ ...editingJob, [field]: e.target.value } as any)} className="bg-slate-800 border-slate-700 text-white mt-1" />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400">Description</label>
                <textarea value={editingJob.snippet || ""} onChange={(e) => setEditingJob({ ...editingJob, snippet: e.target.value })} className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm min-h-[80px]" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingJob(null)} className="border-slate-700 text-slate-300">Cancel</Button>
                <Button onClick={() => void handleSave()} className="bg-blue-600 hover:bg-blue-700">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

import { createClient } from "@supabase/supabase-js"

// Fallback values for development/preview
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-key"

// Check if we have real Supabase credentials
const hasValidCredentials = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("demo") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers with error handling
export const signUp = async (email: string, password: string) => {
  if (!hasValidCredentials) {
    return {
      data: null,
      error: { message: "Authentication is not configured. Please set up Supabase credentials." },
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/callback`,
    },
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  if (!hasValidCredentials) {
    return {
      data: null,
      error: { message: "Authentication is not configured. Please set up Supabase credentials." },
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  } catch (err) {
    return { data: null, error: { message: "Network error. Please check your connection." } }
  }
}

export const signOut = async () => {
  if (!hasValidCredentials) {
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  if (!hasValidCredentials) {
    return { user: null, error: null }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

// Check if user is admin by querying admin_users table
export const checkIsAdmin = async (userId: string) => {
  if (!hasValidCredentials) {
    console.log('checkIsAdmin: no valid credentials')
    return false
  }

  try {
    console.log('checkIsAdmin: checking userId', userId)
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    console.log('checkIsAdmin result:', { data, error })

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking admin status:', error)
      return false
    }

    return !!data
  } catch (err) {
    console.error('Error checking admin status:', err)
    return false
  }
}

// Admin dashboard data functions
export const getUserStats = async () => {
  if (!hasValidCredentials) return null

  try {
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalCVs } = await supabase
      .from('saved_cvs')
      .select('*', { count: 'exact', head: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todaySignups } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    return {
      totalUsers: totalUsers || 0,
      totalCVs: totalCVs || 0,
      revenue: 0,
      activeUsers: 0,
      todaySignups: todaySignups || 0,
      todayDownloads: 0
    }
  } catch (err) {
    console.error('Error fetching user stats:', err)
    return null
  }
}

export const getRecentUsers = async () => {
  if (!hasValidCredentials) return []

  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent users:', error)
      return []
    }

    return users?.map(user => ({
      id: user.id,
      name: user.full_name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      plan: 'Base',
      joined: user.created_at,
      cvsCreated: 0,
      lastActive: 'Recently',
      status: 'offline'
    })) || []
  } catch (err) {
    console.error('Error fetching recent users:', err)
    return []
  }
}

export const getLiveActivity = async () => {
  if (!hasValidCredentials) return []

  try {
    const { data, error } = await supabase
      .from('application_tracking')
      .select('user_id, job_title, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) return []

    return (data || []).map(row => ({
      type: 'application',
      user: row.user_id?.slice(0, 8) + '...',
      time: new Date(row.created_at).toLocaleTimeString(),
      details: `Applied to ${row.job_title} at ${row.company_name}`
    }))
  } catch (err) {
    console.error('Error fetching live activity:', err)
    return []
  }
}

export const trackLoginEvent = async (userId: string, provider?: string | null) => {
  if (!hasValidCredentials) {
    return { error: { message: "Database not configured" } }
  }

  try {
    const { error } = await supabase
      .from('login_events')
      .insert({
        user_id: userId,
        provider: provider || 'email',
      })

    return { error }
  } catch (err) {
    console.error('Error tracking login event:', err)
    return { error: { message: 'Failed to track login event' } }
  }
}

export const startUserSession = async (userId: string, sessionId: string) => {
  if (!hasValidCredentials) {
    return { error: { message: "Database not configured" } }
  }

  try {
    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from('user_sessions')
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          started_at: nowIso,
          last_seen_at: nowIso,
          ended_at: null,
          end_reason: null,
        },
        { onConflict: 'session_id' }
      )

    return { error }
  } catch (err) {
    console.error('Error starting user session:', err)
    return { error: { message: 'Failed to start user session' } }
  }
}

export const heartbeatUserSession = async (userId: string, sessionId: string) => {
  if (!hasValidCredentials) {
    return { error: { message: "Database not configured" } }
  }

  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .is('ended_at', null)

    return { error }
  } catch (err) {
    console.error('Error sending user session heartbeat:', err)
    return { error: { message: 'Failed to send session heartbeat' } }
  }
}

export const endUserSession = async (
  userId: string,
  sessionId: string,
  reason: 'sign_out' | 'tab_hidden' | 'app_unmount' = 'app_unmount'
) => {
  if (!hasValidCredentials) {
    return { error: { message: "Database not configured" } }
  }

  try {
    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from('user_sessions')
      .update({
        last_seen_at: nowIso,
        ended_at: nowIso,
        end_reason: reason,
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .is('ended_at', null)

    return { error }
  } catch (err) {
    console.error('Error ending user session:', err)
    return { error: { message: 'Failed to end user session' } }
  }
}

// Job data functions (used by both job cards and admin)
export const getJobs = async (query?: string, location?: string, limit = 100) => {
  if (!hasValidCredentials) {
    return { data: [], error: { message: "Database not configured" } }
  }

  try {
    let dbQuery = supabase
      .from('scraped_jobs')
      .select('*')
      .order('posted_date', { ascending: false })
      .limit(limit)

    if (query && query !== 'jobs') {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,snippet.ilike.%${query}%,company.ilike.%${query}%`)
    }

    if (location) {
      dbQuery = dbQuery.ilike('location', `%${location}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error fetching jobs:', error)
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return { data: null, error: { message: "Server error" } }
  }
}

export const createJob = async (jobData: any) => {
  if (!hasValidCredentials) {
    return { data: null, error: { message: "Database not configured" } }
  }

  try {
    const { data, error } = await supabase
      .from('scraped_jobs')
      .insert([jobData])
      .select()

    if (error) {
      console.error('Error creating job:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error creating job:', error)
    return { data: null, error: { message: "Server error" } }
  }
}

export const updateJob = async (jobId: string, jobData: any) => {
  if (!hasValidCredentials) {
    return { data: null, error: { message: "Database not configured" } }
  }

  try {
    const { data, error } = await supabase
      .from('scraped_jobs')
      .update(jobData)
      .eq('id', jobId)
      .select()

    if (error) {
      console.error('Error updating job:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error updating job:', error)
    return { data: null, error: { message: "Server error" } }
  }
}

export const deleteJob = async (jobId: string) => {
  if (!hasValidCredentials) {
    return { data: null, error: { message: "Database not configured" } }
  }

  try {
    const { data, error } = await supabase
      .from('scraped_jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      console.error('Error deleting job:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error deleting job:', error)
    return { data: null, error: { message: "Server error" } }
  }
}

export interface AdminOverviewStats {
  totalUsers: number
  newSignupsToday: number
  newSignupsWeek: number
  newSignupsMonth: number
  activeJobListings: number
  filledPositions: number
  cvUploadsCount: number
  platformEngagement: {
    logins: number
    searches: number
    applications: number
  }
}

export interface AdminManagedUser {
  userId: string
  profileId: string
  name: string
  email: string
  role: 'job-seeker' | 'employer'
  status: 'active' | 'suspended'
  joinedAt: string
  lastActiveAt: string
  cvsCount: number
  applicationsCount: number
}

export interface AdminCVItem {
  id: string
  userId: string
  cvName: string
  templateType: string
  ownerName: string
  ownerEmail: string
  createdAt: string
  updatedAt: string
  viewCount: number
  downloadCount: number
}

export interface AdminUserApplicationItem {
  id: string
  jobTitle: string
  companyName: string
  jobBoard: string
  status: string
  applicationDate: string
  atsScore: number
  createdAt: string
  notes: string
}

export interface AdminUserDetail {
  cvs: AdminCVItem[]
  applications: AdminUserApplicationItem[]
  templatesUsed: string[]
}

export interface AdminUserActivityItem {
  id: string
  type: 'login' | 'search' | 'application' | 'cv_view' | 'cv_download' | 'session_start' | 'session_end'
  time: string
  details: string
}

function inferUserRole(personalInfo: any): 'job-seeker' | 'employer' {
  const roleSignals = [
    personalInfo?.role,
    personalInfo?.userType,
    personalInfo?.accountType,
    personalInfo?.profileType,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (roleSignals.includes('employer') || roleSignals.includes('recruiter') || roleSignals.includes('hiring')) {
    return 'employer'
  }

  return 'job-seeker'
}

function inferAccountStatus(personalInfo: any): 'active' | 'suspended' {
  const status = String(personalInfo?.accountStatus || personalInfo?.status || 'active').toLowerCase()
  return status === 'suspended' ? 'suspended' : 'active'
}

export const getAdminOverviewStats = async (): Promise<AdminOverviewStats | null> => {
  if (!hasValidCredentials) return null

  try {
    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const monthStart = new Date(now)
    monthStart.setDate(now.getDate() - 30)

    const [
      totalUsersRes,
      signupsTodayRes,
      signupsWeekRes,
      signupsMonthRes,
      cvUploadsRes,
      applicationsRes,
      searchesRes,
      recentActiveRes,
      loginEventsRes,
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', dayStart.toISOString()),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
      supabase.from('saved_cvs').select('*', { count: 'exact', head: true }),
      supabase.from('application_tracking').select('*', { count: 'exact', head: true }),
      supabase.from('job_search_analytics').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('updated_at', weekStart.toISOString()),
      supabase.from('login_events').select('*', { count: 'exact', head: true }).gte('logged_in_at', weekStart.toISOString()),
    ])

    let activeJobListings = 0
    let filledPositions = 0

    const jobsWithStatus = await supabase.from('scraped_jobs').select('id, status, is_active')
    if (!jobsWithStatus.error && jobsWithStatus.data) {
      const jobs = jobsWithStatus.data as any[]
      activeJobListings = jobs.filter(j => {
        const status = String(j?.status || '').toLowerCase()
        const isActive = j?.is_active !== false
        return isActive && !['filled', 'closed', 'expired', 'hired'].includes(status)
      }).length
      filledPositions = jobs.filter(j => ['filled', 'hired', 'closed'].includes(String(j?.status || '').toLowerCase())).length
    } else {
      const jobsFallback = await supabase.from('scraped_jobs').select('id', { count: 'exact' })
      activeJobListings = jobsFallback.count || 0
      filledPositions = 0
    }

    return {
      totalUsers: totalUsersRes.count || 0,
      newSignupsToday: signupsTodayRes.count || 0,
      newSignupsWeek: signupsWeekRes.count || 0,
      newSignupsMonth: signupsMonthRes.count || 0,
      activeJobListings,
      filledPositions,
      cvUploadsCount: cvUploadsRes.count || 0,
      platformEngagement: {
        // Fall back to profile activity count when explicit login events are unavailable.
        logins: loginEventsRes.error ? (recentActiveRes.count || 0) : (loginEventsRes.count || 0),
        searches: searchesRes.count || 0,
        applications: applicationsRes.count || 0,
      },
    }
  } catch (err) {
    console.error('Error fetching admin overview stats:', err)
    return null
  }
}

export const getAdminUsers = async (options?: {
  search?: string
  role?: 'all' | 'job-seeker' | 'employer'
  status?: 'all' | 'active' | 'suspended'
}): Promise<AdminManagedUser[]> => {
  if (!hasValidCredentials) return []

  try {
    const [profilesRes, cvsRes, appsRes] = await Promise.all([
      supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('saved_cvs').select('id, user_id'),
      supabase.from('application_tracking').select('id, user_id, created_at'),
    ])

    if (profilesRes.error) {
      console.error('Error fetching admin users:', profilesRes.error)
      return []
    }

    const cvCountByUser = new Map<string, number>()
    for (const row of cvsRes.data || []) {
      const uid = String((row as any).user_id || '')
      if (!uid) continue
      cvCountByUser.set(uid, (cvCountByUser.get(uid) || 0) + 1)
    }

    const appCountByUser = new Map<string, number>()
    const lastAppByUser = new Map<string, string>()
    for (const row of appsRes.data || []) {
      const uid = String((row as any).user_id || '')
      const createdAt = String((row as any).created_at || '')
      if (!uid) continue
      appCountByUser.set(uid, (appCountByUser.get(uid) || 0) + 1)
      if (createdAt) {
        const current = lastAppByUser.get(uid)
        if (!current || new Date(createdAt) > new Date(current)) lastAppByUser.set(uid, createdAt)
      }
    }

    const search = (options?.search || '').toLowerCase().trim()

    let users = (profilesRes.data || []).map((profile: any) => {
      const personalInfo = profile.personal_info || {}
      const userId = String(profile.user_id || '')
      const name = String(profile.full_name || personalInfo.fullName || personalInfo.name || 'Unknown')
      const email = String(profile.email || personalInfo.email || '')
      const role = inferUserRole(personalInfo)
      const status = inferAccountStatus(personalInfo)
      const joinedAt = String(profile.created_at || '')
      const lastActiveAt = String(lastAppByUser.get(userId) || profile.updated_at || profile.created_at || '')

      return {
        userId,
        profileId: String(profile.id || ''),
        name,
        email,
        role,
        status,
        joinedAt,
        lastActiveAt,
        cvsCount: cvCountByUser.get(userId) || 0,
        applicationsCount: appCountByUser.get(userId) || 0,
      } as AdminManagedUser
    })

    if (search) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      )
    }

    if (options?.role && options.role !== 'all') users = users.filter(u => u.role === options.role)
    if (options?.status && options.status !== 'all') users = users.filter(u => u.status === options.status)

    return users
  } catch (err) {
    console.error('Error fetching admin users:', err)
    return []
  }
}

export const setAdminUserStatus = async (
  userId: string,
  status: 'active' | 'suspended'
) => {
  if (!hasValidCredentials) return { data: null, error: { message: 'Database not configured' } }

  try {
    const { data: profile, error: readError } = await supabase
      .from('user_profiles')
      .select('id, personal_info')
      .eq('user_id', userId)
      .single()

    if (readError || !profile) {
      return { data: null, error: readError || { message: 'User profile not found' } }
    }

    const currentInfo = (profile as any).personal_info || {}
    const nextInfo = {
      ...currentInfo,
      accountStatus: status,
      suspendedAt: status === 'suspended' ? new Date().toISOString() : null,
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ personal_info: nextInfo })
      .eq('user_id', userId)
      .select()
      .single()

    return { data, error }
  } catch (err) {
    console.error('Error updating admin user status:', err)
    return { data: null, error: { message: 'Failed to update user status' } }
  }
}

export const deleteAdminUser = async (userId: string) => {
  if (!hasValidCredentials) return { error: { message: 'Database not configured' } }

  try {
    // Best-effort cleanup for app data owned by this user.
    await Promise.allSettled([
      supabase.from('application_tracking').delete().eq('user_id', userId),
      supabase.from('job_search_analytics').delete().eq('user_id', userId),
      supabase.from('cv_interactions').delete().eq('user_id', userId),
      supabase.from('saved_cvs').delete().eq('user_id', userId),
    ])

    const { error } = await supabase.from('user_profiles').delete().eq('user_id', userId)
    return { error }
  } catch (err) {
    console.error('Error deleting admin user:', err)
    return { error: { message: 'Failed to delete user' } }
  }
}

export const getAdminUserActivity = async (userId: string): Promise<AdminUserActivityItem[]> => {
  if (!hasValidCredentials) return []

  try {
    const [appsRes, searchesRes, cvRes, profileRes, loginRes, sessionRes] = await Promise.all([
      supabase.from('application_tracking').select('id, job_title, company_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
      supabase.from('job_search_analytics').select('id, search_query, search_date').eq('user_id', userId).order('search_date', { ascending: false }).limit(30),
      supabase.from('cv_interactions').select('id, interaction_type, timestamp').eq('user_id', userId).order('timestamp', { ascending: false }).limit(30),
      supabase.from('user_profiles').select('updated_at').eq('user_id', userId).single(),
      supabase.from('login_events').select('id, logged_in_at, provider').eq('user_id', userId).order('logged_in_at', { ascending: false }).limit(30),
      supabase.from('user_sessions').select('session_id, started_at, last_seen_at, ended_at').eq('user_id', userId).order('started_at', { ascending: false }).limit(30),
    ])

    const activity: AdminUserActivityItem[] = []

    const profileUpdatedAt = (profileRes.data as any)?.updated_at
    if (profileUpdatedAt) {
      activity.push({
        id: `login-${userId}`,
        type: 'login',
        time: profileUpdatedAt,
        details: 'Recent profile/session activity detected',
      })
    }

    for (const row of loginRes.data || []) {
      const item = row as any
      const provider = String(item.provider || 'email')
      activity.push({
        id: `auth-${item.id}`,
        type: 'login',
        time: item.logged_in_at,
        details: `Signed in via ${provider}`,
      })
    }

    for (const row of sessionRes.data || []) {
      const item = row as any
      const startedAt = String(item.started_at || '')
      const endedAt = String(item.ended_at || item.last_seen_at || '')
      const start = startedAt ? new Date(startedAt).getTime() : 0
      const end = endedAt ? new Date(endedAt).getTime() : 0
      const durationMinutes = start > 0 && end >= start ? Math.max(1, Math.round((end - start) / 60000)) : 0

      if (startedAt) {
        activity.push({
          id: `session-start-${item.session_id}`,
          type: 'session_start',
          time: startedAt,
          details: 'Session started',
        })
      }

      if (endedAt) {
        activity.push({
          id: `session-end-${item.session_id}`,
          type: 'session_end',
          time: endedAt,
          details: durationMinutes > 0 ? `Session ended (${durationMinutes} min)` : 'Session ended',
        })
      }
    }

    for (const row of searchesRes.data || []) {
      const item = row as any
      activity.push({
        id: item.id,
        type: 'search',
        time: item.search_date,
        details: `Search: ${item.search_query}`,
      })
    }

    for (const row of appsRes.data || []) {
      const item = row as any
      activity.push({
        id: item.id,
        type: 'application',
        time: item.created_at,
        details: `Applied to ${item.job_title} at ${item.company_name}`,
      })
    }

    for (const row of cvRes.data || []) {
      const item = row as any
      activity.push({
        id: item.id,
        type: item.interaction_type === 'download' ? 'cv_download' : 'cv_view',
        time: item.timestamp,
        details: `CV ${item.interaction_type}`,
      })
    }

    return activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  } catch (err) {
    console.error('Error fetching admin user activity:', err)
    return []
  }
}

export const getAdminCVs = async (search = ''): Promise<AdminCVItem[]> => {
  if (!hasValidCredentials) return []

  try {
    const [cvsRes, profilesRes, interactionsRes] = await Promise.all([
      supabase.from('saved_cvs').select('id, user_id, name, template_type, created_at, updated_at, cv_data').order('updated_at', { ascending: false }).limit(1000),
      supabase.from('user_profiles').select('*').limit(1000),
      supabase.from('cv_interactions').select('cv_id, interaction_type'),
    ])

    if (cvsRes.error) {
      console.error('Error fetching admin CVs:', cvsRes.error)
      return []
    }

    const profileByUser = new Map<string, any>()
    for (const p of profilesRes.data || []) profileByUser.set(String((p as any).user_id || ''), p)

    const counts = new Map<string, { views: number; downloads: number }>()
    for (const row of interactionsRes.data || []) {
      const cvId = String((row as any).cv_id || '')
      if (!cvId) continue
      const current = counts.get(cvId) || { views: 0, downloads: 0 }
      const interaction = String((row as any).interaction_type || '')
      if (interaction === 'download') current.downloads += 1
      if (interaction === 'view') current.views += 1
      counts.set(cvId, current)
    }

    let items = (cvsRes.data || []).map((cv: any) => {
      const profile = profileByUser.get(String(cv.user_id || '')) || {}
      const personalInfo = profile.personal_info || {}
      const metrics = counts.get(String(cv.id)) || { views: 0, downloads: 0 }

      return {
        id: String(cv.id),
        userId: String(cv.user_id || ''),
        cvName: String(cv.name || 'Untitled CV'),
        templateType: String(cv.template_type || 'unknown'),
        ownerName: String(profile.full_name || personalInfo.fullName || 'Unknown user'),
        ownerEmail: String(profile.email || personalInfo.email || ''),
        createdAt: String(cv.created_at || ''),
        updatedAt: String(cv.updated_at || ''),
        viewCount: metrics.views,
        downloadCount: metrics.downloads,
      } as AdminCVItem
    })

    const q = search.trim().toLowerCase()
    if (q) {
      items = items.filter(item =>
        item.cvName.toLowerCase().includes(q) ||
        item.ownerName.toLowerCase().includes(q) ||
        item.ownerEmail.toLowerCase().includes(q)
      )
    }

    return items
  } catch (err) {
    console.error('Error fetching admin CVs:', err)
    return []
  }
}

export const getAdminUserDetail = async (userId: string): Promise<AdminUserDetail> => {
  if (!hasValidCredentials) {
    return { cvs: [], applications: [], templatesUsed: [] }
  }

  try {
    const [cvsRes, profileRes, interactionsRes, appsRes] = await Promise.all([
      supabase
        .from('saved_cvs')
        .select('id, user_id, name, template_type, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('cv_interactions').select('cv_id, interaction_type').eq('user_id', userId),
      supabase
        .from('application_tracking')
        .select('id, job_title, company_name, job_board, status, application_date, ats_score_at_application, created_at, notes')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    const profile = profileRes.data || {}
    const personalInfo = (profile as any).personal_info || {}

    const counts = new Map<string, { views: number; downloads: number }>()
    for (const row of interactionsRes.data || []) {
      const cvId = String((row as any).cv_id || '')
      if (!cvId) continue

      const current = counts.get(cvId) || { views: 0, downloads: 0 }
      const interaction = String((row as any).interaction_type || '')
      if (interaction === 'view') current.views += 1
      if (interaction === 'download') current.downloads += 1
      counts.set(cvId, current)
    }

    const cvs = (cvsRes.data || []).map((cv: any) => {
      const metrics = counts.get(String(cv.id)) || { views: 0, downloads: 0 }

      return {
        id: String(cv.id),
        userId: String(cv.user_id || ''),
        cvName: String(cv.name || 'Untitled CV'),
        templateType: String(cv.template_type || 'unknown'),
        ownerName: String((profile as any).full_name || personalInfo.fullName || 'Unknown user'),
        ownerEmail: String((profile as any).email || personalInfo.email || ''),
        createdAt: String(cv.created_at || ''),
        updatedAt: String(cv.updated_at || ''),
        viewCount: metrics.views,
        downloadCount: metrics.downloads,
      } as AdminCVItem
    })

    const applications = (appsRes.data || []).map((application: any) => ({
      id: String(application.id || ''),
      jobTitle: String(application.job_title || 'Untitled job'),
      companyName: String(application.company_name || 'Unknown company'),
      jobBoard: String(application.job_board || 'Unknown source'),
      status: String(application.status || 'applied'),
      applicationDate: String(application.application_date || ''),
      atsScore: Number(application.ats_score_at_application || 0),
      createdAt: String(application.created_at || ''),
      notes: String(application.notes || ''),
    }))

    const templatesUsed = Array.from(new Set(cvs.map((cv) => cv.templateType).filter(Boolean))).sort()

    return { cvs, applications, templatesUsed }
  } catch (err) {
    console.error('Error fetching admin user detail:', err)
    return { cvs: [], applications: [], templatesUsed: [] }
  }
}

export const deleteAdminCV = async (cvId: string) => {
  if (!hasValidCredentials) return { error: { message: 'Database not configured' } }

  try {
    await supabase.from('cv_interactions').delete().eq('cv_id', cvId)
    const { error } = await supabase.from('saved_cvs').delete().eq('id', cvId)
    return { error }
  } catch (err) {
    console.error('Error deleting admin CV:', err)
    return { error: { message: 'Failed to delete CV' } }
  }
}

// Export the credentials status for components to check
export { hasValidCredentials }

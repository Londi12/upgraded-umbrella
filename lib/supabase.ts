import { createClient } from "@supabase/supabase-js"

// Fallback values for development/preview
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-key"

// Check if we have real Supabase credentials
const hasValidCredentials =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("demo") &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

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
    // Demo mode - simulate successful login
    return {
      data: {
        user: {
          id: 'demo-user',
          email: email,
          user_metadata: { role: 'user' }
        }
      },
      error: null,
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  } catch (err) {
    return {
      data: null,
      error: { message: "Network error. Please check your connection." }
    }
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

// Export the credentials status for components to check
export { hasValidCredentials }

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
    // In demo mode, check if user email contains 'admin'
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.email?.includes('admin') || false
    } catch (err) {
      console.error('Error in demo mode admin check:', err)
      return false
    }
  }

  try {
    // First try the database table
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking admin status:', error)
      // Fall back to email check
      try {
        const { data: { user } } = await supabase.auth.getUser()
        return user?.email === 'admin@watashi.com'
      } catch (fallbackErr) {
        console.error('Fallback admin check failed:', fallbackErr)
        return false
      }
    }

    return !!data
  } catch (err) {
    console.error('Error checking admin status:', err)
    // Fall back to email check
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.email === 'admin@watashi.com'
    } catch (fallbackErr) {
      console.error('Fallback admin check failed:', fallbackErr)
      return false
    }
  }
}

// Admin dashboard data functions
export const getUserStats = async () => {
  if (!hasValidCredentials) {
    // Return mock data for demo mode
    return {
      totalUsers: 2847,
      totalCVs: 5634,
      revenue: 89450,
      activeUsers: Math.floor(Math.random() * 50) + 150,
      todaySignups: Math.floor(Math.random() * 20) + 5,
      todayDownloads: Math.floor(Math.random() * 100) + 50
    }
  }

  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('Error fetching user count:', usersError)
      return null
    }

    // Get CV count (assuming you have a cvs table)
    const { count: totalCVs, error: cvsError } = await supabase
      .from('cvs')
      .select('*', { count: 'exact', head: true })

    if (cvsError) {
      console.error('Error fetching CV count:', cvsError)
    }

    // Get today's signups
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todaySignups, error: signupsError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    if (signupsError) {
      console.error('Error fetching today signups:', signupsError)
    }

    return {
      totalUsers: totalUsers || 0,
      totalCVs: totalCVs || 0,
      revenue: 0, // Would need a payments table for this
      activeUsers: Math.floor(Math.random() * 50) + 50, // Mock for now
      todaySignups: todaySignups || 0,
      todayDownloads: Math.floor(Math.random() * 100) + 25 // Mock for now
    }
  } catch (err) {
    console.error('Error fetching user stats:', err)
    return null
  }
}

export const getRecentUsers = async () => {
  if (!hasValidCredentials) {
    // Return mock users for demo mode
    return [
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
    ]
  }

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent users:', error)
      return []
    }

    // Transform the data to match expected format
    return users?.map(user => ({
      id: user.id,
      name: user.full_name || user.email?.split('@')[0] || 'Unknown User',
      email: user.email || '',
      plan: 'Base', // Default plan, would need a subscription table
      joined: user.created_at,
      cvsCreated: 0, // Would need to count from cvs table
      lastActive: 'Recently',
      status: Math.random() > 0.5 ? 'online' : 'offline'
    })) || []
  } catch (err) {
    console.error('Error fetching recent users:', err)
    return []
  }
}

export const getLiveActivity = async () => {
  if (!hasValidCredentials) {
    // Return mock activity for demo mode
    return [
      { type: 'cv_created', user: 'John S.', time: '2 min ago', details: 'Created "Software Developer CV"' },
      { type: 'user_signup', user: 'Lisa M.', time: '5 min ago', details: 'Signed up for Premium plan' },
      { type: 'pdf_download', user: 'Mike W.', time: '8 min ago', details: 'Downloaded CV as PDF' },
      { type: 'job_match', user: 'Sarah J.', time: '12 min ago', details: 'Generated 5 job matches' }
    ]
  }

  try {
    // This would typically come from an activity log table
    // For now, return mock data since we don't have activity tracking
    return [
      { type: 'user_signup', user: 'New User', time: 'Just now', details: 'User registered' },
      { type: 'cv_created', user: 'Recent User', time: '5 min ago', details: 'Created new CV' }
    ]
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

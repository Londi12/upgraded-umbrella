import { createClient } from "@supabase/supabase-js"

// Fallback values for development/preview
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Check if we have real Supabase credentials
const hasValidCredentials =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
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
    return {
      data: null,
      error: { message: "Authentication is not configured. Please set up Supabase credentials." },
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
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

// Export the credentials status for components to check
export { hasValidCredentials }

"use client"

import type React from "react"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"
import {
  endUserSession,
  hasValidCredentials,
  heartbeatUserSession,
  startUserSession,
  supabase,
  trackLoginEvent,
} from "@/lib/supabase"
import { generateId } from "@/lib/uuid-fallback"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef<User | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }

  const beginSessionTracking = async (activeUser: User) => {
    if (sessionIdRef.current) return

    const sessionId = generateId()
    sessionIdRef.current = sessionId
    await startUserSession(activeUser.id, sessionId)

    heartbeatRef.current = setInterval(() => {
      if (!sessionIdRef.current) return
      void heartbeatUserSession(activeUser.id, sessionIdRef.current)
    }, 60000)
  }

  const closeSessionTracking = async (
    activeUser: User | null,
    reason: 'sign_out' | 'tab_hidden' | 'app_unmount'
  ) => {
    const sessionId = sessionIdRef.current
    if (!activeUser || !sessionId) {
      stopHeartbeat()
      sessionIdRef.current = null
      return
    }

    stopHeartbeat()
    await endUserSession(activeUser.id, sessionId, reason)
    sessionIdRef.current = null
  }

  useEffect(() => {
    if (!hasValidCredentials) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const initialUser = session?.user ?? null
      userRef.current = initialUser
      setUser(initialUser)
      if (initialUser) {
        await beginSessionTracking(initialUser)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null

      if (event === 'SIGNED_OUT') {
        await closeSessionTracking(userRef.current, 'sign_out')
      }

      if (event === 'SIGNED_IN' && currentUser) {
        await trackLoginEvent(currentUser.id, currentUser.app_metadata?.provider)
      }

      if (currentUser) {
        await beginSessionTracking(currentUser)
      }

      userRef.current = currentUser
      setUser(currentUser)
      setLoading(false)
    })

    const onVisibilityChange = () => {
      if (document.hidden) {
        void closeSessionTracking(userRef.current, 'tab_hidden')
      } else if (userRef.current) {
        void beginSessionTracking(userRef.current)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void closeSessionTracking(userRef.current, 'app_unmount')
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!hasValidCredentials) {
      return { error: { message: "Authentication is not configured. Please set up Supabase credentials." } }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    if (!hasValidCredentials) {
      return { error: { message: "Authentication is not configured. Please set up Supabase credentials." } }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    if (hasValidCredentials) {
      await supabase.auth.signOut()
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isConfigured: hasValidCredentials,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

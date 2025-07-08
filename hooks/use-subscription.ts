"use client"

import { useState, useEffect, useContext, createContext } from 'react'
import { SubscriptionManager, type UserSubscription, type PlanType } from '@/lib/subscription-manager'

interface SubscriptionContextType {
  subscription: UserSubscription | null
  loading: boolean
  canAccessFeature: (feature: string) => boolean
  canUseJobMatching: () => { allowed: boolean, remaining: number, message?: string }
  canDownloadCV: () => { allowed: boolean, remaining: number, message?: string }
  canCreateCoverLetter: () => { allowed: boolean, remaining: number, message?: string }
  useJobMatch: () => Promise<boolean>
  useDownload: () => Promise<boolean>
  useCoverLetter: () => Promise<boolean>
  getAvailableTemplates: () => string[]
  getATSLevel: () => 'basic' | 'advanced' | 'pro'
  isTrialExpired: () => boolean
  getTrialDaysRemaining: () => number
  upgradePlan: (plan: PlanType) => Promise<void>
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionManager] = useState(() => new SubscriptionManager())

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const sub = await subscriptionManager.getUserSubscription('current_user')
      setSubscription(sub)
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAccessFeature = (feature: string): boolean => {
    return subscriptionManager.canAccessFeature(feature)
  }

  const canUseJobMatching = () => {
    return subscriptionManager.canUseJobMatching()
  }

  const canDownloadCV = () => {
    return subscriptionManager.canDownloadCV()
  }

  const canCreateCoverLetter = () => {
    return subscriptionManager.canCreateCoverLetter()
  }

  const useJobMatch = async (): Promise<boolean> => {
    const success = await subscriptionManager.useJobMatch()
    if (success) {
      await loadSubscription() // Refresh to update usage
    }
    return success
  }

  const useDownload = async (): Promise<boolean> => {
    const success = await subscriptionManager.useDownload()
    if (success) {
      await loadSubscription()
    }
    return success
  }

  const useCoverLetter = async (): Promise<boolean> => {
    const success = await subscriptionManager.useCoverLetter()
    if (success) {
      await loadSubscription()
    }
    return success
  }

  const getAvailableTemplates = (): string[] => {
    return subscriptionManager.getAvailableTemplates()
  }

  const getATSLevel = () => {
    return subscriptionManager.getATSOptimizationLevel()
  }

  const isTrialExpired = (): boolean => {
    return subscriptionManager.isTrialExpired()
  }

  const getTrialDaysRemaining = (): number => {
    return subscriptionManager.getTrialDaysRemaining()
  }

  const upgradePlan = async (plan: PlanType): Promise<void> => {
    await subscriptionManager.upgradePlan(plan)
    await loadSubscription()
  }

  const refreshSubscription = async (): Promise<void> => {
    await loadSubscription()
  }

  const value: SubscriptionContextType = {
    subscription,
    loading,
    canAccessFeature,
    canUseJobMatching,
    canDownloadCV,
    canCreateCoverLetter,
    useJobMatch,
    useDownload,
    useCoverLetter,
    getAvailableTemplates,
    getATSLevel,
    isTrialExpired,
    getTrialDaysRemaining,
    upgradePlan,
    refreshSubscription
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
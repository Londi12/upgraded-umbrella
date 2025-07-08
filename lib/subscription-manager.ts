export type PlanType = 'free' | 'base' | 'premium' | 'pro'

export interface UserSubscription {
  userId: string
  planType: PlanType
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  startDate: string
  endDate: string
  trialEndsAt?: string
  jobMatchesUsed: number
  cvDownloadsUsed: number
  coverLettersUsed: number
  lastResetDate: string
}

export interface PlanLimits {
  jobMatchesPerWeek: number
  cvDownloadsPerMonth: number
  coverLettersPerMonth: number
  templatesAccess: 'basic' | 'premium' | 'all'
  atsOptimization: 'basic' | 'advanced' | 'pro'
  supportLevel: 'email' | 'priority' | 'phone'
  features: string[]
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    jobMatchesPerWeek: 0,
    cvDownloadsPerMonth: 1,
    coverLettersPerMonth: 0,
    templatesAccess: 'basic',
    atsOptimization: 'basic',
    supportLevel: 'email',
    features: ['basic_templates', 'single_download']
  },
  base: {
    jobMatchesPerWeek: 1,
    cvDownloadsPerMonth: 10,
    coverLettersPerMonth: 3,
    templatesAccess: 'basic',
    atsOptimization: 'basic',
    supportLevel: 'email',
    features: ['basic_templates', 'pdf_word_download', 'basic_ats', 'job_matching']
  },
  premium: {
    jobMatchesPerWeek: 5,
    cvDownloadsPerMonth: 50,
    coverLettersPerMonth: 15,
    templatesAccess: 'premium',
    atsOptimization: 'advanced',
    supportLevel: 'priority',
    features: ['premium_templates', 'advanced_ats', 'cover_letter_builder', 'priority_support']
  },
  pro: {
    jobMatchesPerWeek: -1, // unlimited
    cvDownloadsPerMonth: -1, // unlimited
    coverLettersPerMonth: -1, // unlimited
    templatesAccess: 'all',
    atsOptimization: 'pro',
    supportLevel: 'phone',
    features: ['all_templates', 'pro_ats', 'linkedin_optimization', 'career_coaching', 'phone_support']
  }
}

export class SubscriptionManager {
  private subscription: UserSubscription | null = null

  async getUserSubscription(userId: string): Promise<UserSubscription> {
    // In real app, fetch from database
    const stored = localStorage.getItem(`subscription_${userId}`)
    if (stored) {
      this.subscription = JSON.parse(stored)
    } else {
      // New user gets 7-day trial
      this.subscription = {
        userId,
        planType: 'premium',
        status: 'trial',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        jobMatchesUsed: 0,
        cvDownloadsUsed: 0,
        coverLettersUsed: 0,
        lastResetDate: new Date().toISOString()
      }
      this.saveSubscription()
    }
    return this.subscription
  }

  canAccessFeature(feature: string): boolean {
    if (!this.subscription) return false
    
    const limits = PLAN_LIMITS[this.subscription.planType]
    return limits.features.includes(feature)
  }

  canUseJobMatching(): { allowed: boolean, remaining: number, message?: string } {
    if (!this.subscription) return { allowed: false, remaining: 0, message: 'No subscription found' }
    
    if (this.subscription.status === 'expired') {
      return { allowed: false, remaining: 0, message: 'Subscription expired. Please renew.' }
    }

    const limits = PLAN_LIMITS[this.subscription.planType]
    
    if (limits.jobMatchesPerWeek === 0) {
      return { allowed: false, remaining: 0, message: 'Upgrade to access job matching' }
    }
    
    if (limits.jobMatchesPerWeek === -1) {
      return { allowed: true, remaining: -1 } // unlimited
    }

    this.resetWeeklyLimitsIfNeeded()
    const remaining = limits.jobMatchesPerWeek - this.subscription.jobMatchesUsed
    
    if (remaining <= 0) {
      return { allowed: false, remaining: 0, message: 'Weekly job match limit reached. Upgrade for more.' }
    }

    return { allowed: true, remaining }
  }

  canDownloadCV(): { allowed: boolean, remaining: number, message?: string } {
    if (!this.subscription) return { allowed: false, remaining: 0 }
    
    if (this.subscription.status === 'expired') {
      return { allowed: false, remaining: 0, message: 'Subscription expired' }
    }

    const limits = PLAN_LIMITS[this.subscription.planType]
    
    if (limits.cvDownloadsPerMonth === -1) {
      return { allowed: true, remaining: -1 }
    }

    this.resetMonthlyLimitsIfNeeded()
    const remaining = limits.cvDownloadsPerMonth - this.subscription.cvDownloadsUsed
    
    if (remaining <= 0) {
      return { allowed: false, remaining: 0, message: 'Monthly download limit reached' }
    }

    return { allowed: true, remaining }
  }

  canCreateCoverLetter(): { allowed: boolean, remaining: number, message?: string } {
    if (!this.subscription) return { allowed: false, remaining: 0 }
    
    const limits = PLAN_LIMITS[this.subscription.planType]
    
    if (limits.coverLettersPerMonth === 0) {
      return { allowed: false, remaining: 0, message: 'Upgrade to access cover letter builder' }
    }
    
    if (limits.coverLettersPerMonth === -1) {
      return { allowed: true, remaining: -1 }
    }

    this.resetMonthlyLimitsIfNeeded()
    const remaining = limits.coverLettersPerMonth - this.subscription.coverLettersUsed
    
    if (remaining <= 0) {
      return { allowed: false, remaining: 0, message: 'Monthly cover letter limit reached' }
    }

    return { allowed: true, remaining }
  }

  getAvailableTemplates(): string[] {
    if (!this.subscription) return ['basic_1', 'basic_2']
    
    const limits = PLAN_LIMITS[this.subscription.planType]
    
    switch (limits.templatesAccess) {
      case 'basic':
        return ['basic_1', 'basic_2', 'basic_3']
      case 'premium':
        return ['basic_1', 'basic_2', 'basic_3', 'premium_1', 'premium_2', 'premium_3', 'premium_4']
      case 'all':
        return ['basic_1', 'basic_2', 'basic_3', 'premium_1', 'premium_2', 'premium_3', 'premium_4', 'pro_1', 'pro_2', 'pro_3']
      default:
        return ['basic_1', 'basic_2']
    }
  }

  getATSOptimizationLevel(): 'basic' | 'advanced' | 'pro' {
    if (!this.subscription) return 'basic'
    return PLAN_LIMITS[this.subscription.planType].atsOptimization
  }

  async useJobMatch(): Promise<boolean> {
    const canUse = this.canUseJobMatching()
    if (!canUse.allowed) return false
    
    if (this.subscription && canUse.remaining !== -1) {
      this.subscription.jobMatchesUsed++
      this.saveSubscription()
    }
    return true
  }

  async useDownload(): Promise<boolean> {
    const canUse = this.canDownloadCV()
    if (!canUse.allowed) return false
    
    if (this.subscription && canUse.remaining !== -1) {
      this.subscription.cvDownloadsUsed++
      this.saveSubscription()
    }
    return true
  }

  async useCoverLetter(): Promise<boolean> {
    const canUse = this.canCreateCoverLetter()
    if (!canUse.allowed) return false
    
    if (this.subscription && canUse.remaining !== -1) {
      this.subscription.coverLettersUsed++
      this.saveSubscription()
    }
    return true
  }

  isTrialExpired(): boolean {
    if (!this.subscription?.trialEndsAt) return false
    return new Date() > new Date(this.subscription.trialEndsAt)
  }

  getTrialDaysRemaining(): number {
    if (!this.subscription?.trialEndsAt) return 0
    const remaining = new Date(this.subscription.trialEndsAt).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
  }

  async upgradePlan(newPlan: PlanType): Promise<void> {
    if (!this.subscription) return
    
    this.subscription.planType = newPlan
    this.subscription.status = 'active'
    this.subscription.trialEndsAt = undefined
    this.saveSubscription()
  }

  private resetWeeklyLimitsIfNeeded(): void {
    if (!this.subscription) return
    
    const lastReset = new Date(this.subscription.lastResetDate)
    const now = new Date()
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (24 * 60 * 60 * 1000))
    
    if (daysSinceReset >= 7) {
      this.subscription.jobMatchesUsed = 0
      this.subscription.lastResetDate = now.toISOString()
      this.saveSubscription()
    }
  }

  private resetMonthlyLimitsIfNeeded(): void {
    if (!this.subscription) return
    
    const lastReset = new Date(this.subscription.lastResetDate)
    const now = new Date()
    
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      this.subscription.cvDownloadsUsed = 0
      this.subscription.coverLettersUsed = 0
      this.subscription.lastResetDate = now.toISOString()
      this.saveSubscription()
    }
  }

  private saveSubscription(): void {
    if (this.subscription && typeof window !== 'undefined') {
      localStorage.setItem(`subscription_${this.subscription.userId}`, JSON.stringify(this.subscription))
    }
  }
}
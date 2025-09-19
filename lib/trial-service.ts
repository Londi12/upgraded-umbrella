export interface TrialStatus {
  isActive: boolean
  daysRemaining: number
  startDate: string
  endDate: string
  hasExpired: boolean
}

export class TrialService {
  private readonly TRIAL_DAYS = 7
  private readonly STORAGE_KEY = 'cvkonnekt_trial'

  startTrial(): TrialStatus {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + this.TRIAL_DAYS)

    const trial = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trial))
    }

    return this.getTrialStatus()
  }

  getTrialStatus(): TrialStatus {
    if (typeof window === 'undefined') {
      return { isActive: false, daysRemaining: 0, startDate: '', endDate: '', hasExpired: true }
    }

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) {
      return { isActive: false, daysRemaining: 0, startDate: '', endDate: '', hasExpired: false }
    }

    try {
      const trial = JSON.parse(stored)
      const now = new Date()
      const endDate = new Date(trial.endDate)
      const startDate = new Date(trial.startDate)
      
      const msRemaining = endDate.getTime() - now.getTime()
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
      
      return {
        isActive: msRemaining > 0,
        daysRemaining,
        startDate: trial.startDate,
        endDate: trial.endDate,
        hasExpired: msRemaining <= 0
      }
    } catch {
      return { isActive: false, daysRemaining: 0, startDate: '', endDate: '', hasExpired: true }
    }
  }

  hasTrialAccess(): boolean {
    const status = this.getTrialStatus()
    return status.isActive
  }
}
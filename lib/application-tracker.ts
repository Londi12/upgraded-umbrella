export interface JobApplication {
  id: string
  jobId: string
  jobTitle: string
  company: string
  appliedDate: string
  status: 'applied' | 'viewed' | 'interview' | 'rejected' | 'offered' | 'accepted'
  source: string
  cvVersion: string
  coverLetterUsed: boolean
  matchScore: number
  followUpDate?: string
  notes?: string
  interviewDates?: string[]
  salaryOffered?: number
  feedback?: string
}

export interface ApplicationStats {
  totalApplications: number
  responseRate: number
  interviewRate: number
  offerRate: number
  averageMatchScore: number
  topPerformingCV: string
  bestSources: string[]
  industryBreakdown: { [industry: string]: number }
  monthlyTrends: { month: string, applications: number, responses: number }[]
}

export interface ApplicationInsights {
  recommendations: string[]
  cvOptimizations: string[]
  bestApplicationTimes: string[]
  successPatterns: string[]
}

export class ApplicationTracker {
  private applications: JobApplication[] = []

  async trackApplication(application: Omit<JobApplication, 'id' | 'appliedDate'>): Promise<string> {
    const newApplication: JobApplication = {
      ...application,
      id: this.generateId(),
      appliedDate: new Date().toISOString()
    }
    
    this.applications.push(newApplication)
    await this.saveToStorage(newApplication)
    
    return newApplication.id
  }

  async updateApplicationStatus(id: string, status: JobApplication['status'], notes?: string): Promise<void> {
    const application = this.applications.find(app => app.id === id)
    if (application) {
      application.status = status
      if (notes) application.notes = notes
      
      // Set follow-up dates based on status
      if (status === 'applied') {
        application.followUpDate = this.addDays(new Date(), 7).toISOString()
      } else if (status === 'interview') {
        application.followUpDate = this.addDays(new Date(), 3).toISOString()
      }
      
      await this.saveToStorage(application)
    }
  }

  async getApplicationStats(): Promise<ApplicationStats> {
    const total = this.applications.length
    const responses = this.applications.filter(app => 
      ['viewed', 'interview', 'offered', 'accepted'].includes(app.status)
    ).length
    const interviews = this.applications.filter(app => 
      ['interview', 'offered', 'accepted'].includes(app.status)
    ).length
    const offers = this.applications.filter(app => 
      ['offered', 'accepted'].includes(app.status)
    ).length

    const responseRate = total > 0 ? (responses / total) * 100 : 0
    const interviewRate = total > 0 ? (interviews / total) * 100 : 0
    const offerRate = total > 0 ? (offers / total) * 100 : 0

    const averageMatchScore = this.applications.reduce((sum, app) => sum + app.matchScore, 0) / total || 0

    // Find top performing CV
    const cvPerformance = new Map<string, { applications: number, success: number }>()
    this.applications.forEach(app => {
      const current = cvPerformance.get(app.cvVersion) || { applications: 0, success: 0 }
      current.applications++
      if (['interview', 'offered', 'accepted'].includes(app.status)) {
        current.success++
      }
      cvPerformance.set(app.cvVersion, current)
    })

    const topPerformingCV = Array.from(cvPerformance.entries())
      .sort((a, b) => (b[1].success / b[1].applications) - (a[1].success / a[1].applications))[0]?.[0] || ''

    // Best sources
    const sourcePerformance = new Map<string, { applications: number, success: number }>()
    this.applications.forEach(app => {
      const current = sourcePerformance.get(app.source) || { applications: 0, success: 0 }
      current.applications++
      if (['interview', 'offered', 'accepted'].includes(app.status)) {
        current.success++
      }
      sourcePerformance.set(app.source, current)
    })

    const bestSources = Array.from(sourcePerformance.entries())
      .sort((a, b) => (b[1].success / b[1].applications) - (a[1].success / a[1].applications))
      .slice(0, 3)
      .map(entry => entry[0])

    // Industry breakdown
    const industryBreakdown: { [industry: string]: number } = {}
    this.applications.forEach(app => {
      const industry = this.detectIndustry(app.jobTitle, app.company)
      industryBreakdown[industry] = (industryBreakdown[industry] || 0) + 1
    })

    // Monthly trends
    const monthlyTrends = this.calculateMonthlyTrends()

    return {
      totalApplications: total,
      responseRate: Math.round(responseRate),
      interviewRate: Math.round(interviewRate),
      offerRate: Math.round(offerRate),
      averageMatchScore: Math.round(averageMatchScore),
      topPerformingCV,
      bestSources,
      industryBreakdown,
      monthlyTrends
    }
  }

  async getApplicationInsights(): Promise<ApplicationInsights> {
    const stats = await this.getApplicationStats()
    const recommendations: string[] = []
    const cvOptimizations: string[] = []
    const bestApplicationTimes: string[] = []
    const successPatterns: string[] = []

    // Generate recommendations based on stats
    if (stats.responseRate < 10) {
      recommendations.push('Your response rate is low. Consider improving your CV and targeting more relevant jobs.')
      cvOptimizations.push('Optimize your CV for ATS systems to improve visibility.')
    }

    if (stats.interviewRate < 5) {
      recommendations.push('Focus on jobs with higher match scores (80%+) to improve interview chances.')
    }

    if (stats.averageMatchScore < 70) {
      cvOptimizations.push('Update your skills section to better match job requirements.')
      cvOptimizations.push('Add more industry-specific keywords to your experience descriptions.')
    }

    // Analyze successful applications
    const successfulApps = this.applications.filter(app => 
      ['interview', 'offered', 'accepted'].includes(app.status)
    )

    if (successfulApps.length > 0) {
      const avgSuccessScore = successfulApps.reduce((sum, app) => sum + app.matchScore, 0) / successfulApps.length
      if (avgSuccessScore > stats.averageMatchScore + 10) {
        successPatterns.push(`Jobs with ${Math.round(avgSuccessScore)}%+ match scores have higher success rates.`)
      }

      // Analyze timing patterns
      const successfulDays = successfulApps.map(app => new Date(app.appliedDate).getDay())
      const dayCount = new Map<number, number>()
      successfulDays.forEach(day => dayCount.set(day, (dayCount.get(day) || 0) + 1))
      
      const bestDay = Array.from(dayCount.entries()).sort((a, b) => b[1] - a[1])[0]
      if (bestDay) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        bestApplicationTimes.push(`${dayNames[bestDay[0]]} applications have higher success rates.`)
      }
    }

    // Source-specific insights
    if (stats.bestSources.length > 0) {
      recommendations.push(`Focus on ${stats.bestSources[0]} - your most successful job source.`)
    }

    return {
      recommendations,
      cvOptimizations,
      bestApplicationTimes,
      successPatterns
    }
  }

  async getApplicationsNeedingFollowUp(): Promise<JobApplication[]> {
    const today = new Date()
    return this.applications.filter(app => 
      app.followUpDate && 
      new Date(app.followUpDate) <= today &&
      ['applied', 'viewed'].includes(app.status)
    )
  }

  async addInterviewDate(applicationId: string, interviewDate: string): Promise<void> {
    const application = this.applications.find(app => app.id === applicationId)
    if (application) {
      if (!application.interviewDates) application.interviewDates = []
      application.interviewDates.push(interviewDate)
      application.status = 'interview'
      await this.saveToStorage(application)
    }
  }

  async recordFeedback(applicationId: string, feedback: string): Promise<void> {
    const application = this.applications.find(app => app.id === applicationId)
    if (application) {
      application.feedback = feedback
      await this.saveToStorage(application)
    }
  }

  // Export data for analysis
  async exportApplicationData(): Promise<string> {
    const csvHeaders = [
      'Date Applied', 'Job Title', 'Company', 'Status', 'Match Score', 
      'Source', 'CV Version', 'Cover Letter', 'Response Time', 'Notes'
    ]
    
    const csvRows = this.applications.map(app => [
      app.appliedDate,
      app.jobTitle,
      app.company,
      app.status,
      app.matchScore.toString(),
      app.source,
      app.cvVersion,
      app.coverLetterUsed ? 'Yes' : 'No',
      this.calculateResponseTime(app),
      app.notes || ''
    ])

    return [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n')
  }

  // Private helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  private async saveToStorage(application: JobApplication): Promise<void> {
    // In a real implementation, this would save to a database
    // For now, we'll use localStorage or IndexedDB
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('job_applications') || '[]'
      const applications = JSON.parse(stored)
      const index = applications.findIndex((app: JobApplication) => app.id === application.id)
      
      if (index >= 0) {
        applications[index] = application
      } else {
        applications.push(application)
      }
      
      localStorage.setItem('job_applications', JSON.stringify(applications))
    }
  }

  private detectIndustry(jobTitle: string, company: string): string {
    const text = `${jobTitle} ${company}`.toLowerCase()
    
    if (text.includes('bank') || text.includes('financial')) return 'Banking'
    if (text.includes('software') || text.includes('developer') || text.includes('tech')) return 'Technology'
    if (text.includes('mining') || text.includes('mine')) return 'Mining'
    if (text.includes('healthcare') || text.includes('medical')) return 'Healthcare'
    if (text.includes('retail') || text.includes('store')) return 'Retail'
    if (text.includes('education') || text.includes('school')) return 'Education'
    
    return 'Other'
  }

  private calculateMonthlyTrends(): { month: string, applications: number, responses: number }[] {
    const trends = new Map<string, { applications: number, responses: number }>()
    
    this.applications.forEach(app => {
      const date = new Date(app.appliedDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const current = trends.get(monthKey) || { applications: 0, responses: 0 }
      current.applications++
      
      if (['viewed', 'interview', 'offered', 'accepted'].includes(app.status)) {
        current.responses++
      }
      
      trends.set(monthKey, current)
    })
    
    return Array.from(trends.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private calculateResponseTime(application: JobApplication): string {
    if (!['viewed', 'interview', 'offered', 'accepted'].includes(application.status)) {
      return 'No response'
    }
    
    // This would need to track when status was updated
    // For now, return a placeholder
    return '3-5 days'
  }
}
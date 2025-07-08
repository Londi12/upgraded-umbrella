import type { CVData } from '@/types/cv-types'
import type { SAJobListing } from './sa-job-scraper'

export interface SemanticJobMatch {
  job: SAJobListing
  overallScore: number
  skillsMatch: number
  experienceMatch: number
  locationMatch: number
  salaryMatch: number
  atsCompatibility: number
  matchReasons: string[]
  improvementSuggestions: string[]
  applicationSuccess: number // Predicted success rate
}

export class SemanticJobMatcher {
  // Skill synonyms for better matching
  private skillSynonyms = new Map([
    ['javascript', ['js', 'ecmascript', 'node', 'react', 'vue', 'angular']],
    ['python', ['django', 'flask', 'pandas', 'numpy', 'ml', 'ai']],
    ['sql', ['database', 'mysql', 'postgresql', 'oracle', 'mssql']],
    ['project management', ['pm', 'scrum', 'agile', 'kanban', 'pmp']],
    ['marketing', ['digital marketing', 'social media', 'seo', 'sem', 'campaigns']]
  ])

  // Industry-specific weight adjustments
  private industryWeights = {
    'Banking': { skills: 0.4, experience: 0.3, ats: 0.2, location: 0.1 },
    'Technology': { skills: 0.5, experience: 0.25, ats: 0.15, location: 0.1 },
    'Mining': { skills: 0.3, experience: 0.4, ats: 0.15, location: 0.15 },
    'Healthcare': { skills: 0.35, experience: 0.35, ats: 0.2, location: 0.1 }
  }

  async findMatches(cvData: CVData, jobs: SAJobListing[], userPreferences?: {
    preferredProvinces?: string[]
    minSalary?: number
    maxSalary?: number
    jobTypes?: string[]
  }): Promise<SemanticJobMatch[]> {
    
    const matches = jobs.map(job => this.calculateMatch(cvData, job))
    
    // Filter by user preferences
    let filteredMatches = matches
    if (userPreferences) {
      filteredMatches = this.applyFilters(matches, userPreferences)
    }
    
    // Sort by overall score and predicted success
    return filteredMatches
      .sort((a, b) => (b.overallScore + b.applicationSuccess) - (a.overallScore + a.applicationSuccess))
      .slice(0, 50) // Top 50 matches
  }

  private calculateMatch(cvData: CVData, job: SAJobListing): SemanticJobMatch {
    const skillsMatch = this.calculateSkillsMatch(cvData, job)
    const experienceMatch = this.calculateExperienceMatch(cvData, job)
    const locationMatch = this.calculateLocationMatch(cvData, job)
    const salaryMatch = this.calculateSalaryMatch(cvData, job)
    const atsCompatibility = this.calculateATSCompatibility(cvData, job)
    
    // Get industry weights
    const weights = this.industryWeights[job.industry] || this.industryWeights['Technology']
    
    const overallScore = Math.round(
      skillsMatch * weights.skills +
      experienceMatch * weights.experience +
      atsCompatibility * weights.ats +
      locationMatch * weights.location
    )

    const matchReasons = this.generateMatchReasons(cvData, job, {
      skillsMatch, experienceMatch, locationMatch, salaryMatch, atsCompatibility
    })

    const improvementSuggestions = this.generateImprovementSuggestions(cvData, job, {
      skillsMatch, experienceMatch, atsCompatibility
    })

    const applicationSuccess = this.predictApplicationSuccess(overallScore, job, cvData)

    return {
      job,
      overallScore,
      skillsMatch,
      experienceMatch,
      locationMatch,
      salaryMatch,
      atsCompatibility,
      matchReasons,
      improvementSuggestions,
      applicationSuccess
    }
  }

  private calculateSkillsMatch(cvData: CVData, job: SAJobListing): number {
    const cvSkills = this.extractSkills(cvData)
    const jobSkills = job.keywords.concat(job.requirements)
    
    let matchCount = 0
    let totalJobSkills = jobSkills.length
    
    for (const jobSkill of jobSkills) {
      if (this.hasSkillMatch(cvSkills, jobSkill)) {
        matchCount++
      }
    }
    
    return Math.round((matchCount / totalJobSkills) * 100)
  }

  private hasSkillMatch(cvSkills: string[], jobSkill: string): boolean {
    const jobSkillLower = jobSkill.toLowerCase()
    
    // Direct match
    if (cvSkills.some(skill => skill.toLowerCase().includes(jobSkillLower))) {
      return true
    }
    
    // Synonym match
    for (const [key, synonyms] of this.skillSynonyms) {
      if (synonyms.includes(jobSkillLower) && cvSkills.some(skill => 
        skill.toLowerCase().includes(key) || synonyms.some(syn => skill.toLowerCase().includes(syn))
      )) {
        return true
      }
    }
    
    return false
  }

  private calculateExperienceMatch(cvData: CVData, job: SAJobListing): number {
    const cvYears = this.calculateExperienceYears(cvData)
    const requiredYears = this.extractRequiredYears(job)
    
    if (requiredYears === 0) return 100
    
    if (cvYears >= requiredYears) {
      return 100
    } else if (cvYears >= requiredYears * 0.8) {
      return 80
    } else if (cvYears >= requiredYears * 0.6) {
      return 60
    } else {
      return Math.max(20, (cvYears / requiredYears) * 100)
    }
  }

  private calculateLocationMatch(cvData: CVData, job: SAJobListing): number {
    const userLocation = cvData.personalInfo?.location?.toLowerCase() || ''
    const jobLocation = job.location.toLowerCase()
    
    if (userLocation.includes(jobLocation) || jobLocation.includes(userLocation)) {
      return 100
    }
    
    // Same province match
    const userProvince = this.extractProvince(userLocation)
    if (userProvince === job.province) {
      return 70
    }
    
    // Remote work consideration
    if (job.description.toLowerCase().includes('remote')) {
      return 90
    }
    
    return 30 // Different location penalty
  }

  private calculateSalaryMatch(cvData: CVData, job: SAJobListing): number {
    if (!job.salary) return 50
    
    const salaryRange = this.parseSalaryRange(job.salary)
    const expectedSalary = this.getExpectedSalary(cvData)
    
    if (!expectedSalary) return 50
    
    if (expectedSalary >= salaryRange.min && expectedSalary <= salaryRange.max) {
      return 100
    } else if (expectedSalary < salaryRange.min) {
      return Math.min(100, (expectedSalary / salaryRange.min) * 100 + 20)
    } else {
      return Math.max(60, 100 - ((expectedSalary - salaryRange.max) / salaryRange.max) * 50)
    }
  }

  private calculateATSCompatibility(cvData: CVData, job: SAJobListing): number {
    // Use existing ATS scoring logic
    return job.atsScore || 75
  }

  private predictApplicationSuccess(overallScore: number, job: SAJobListing, cvData: CVData): number {
    let successRate = overallScore * 0.8
    
    // Adjust based on competition (job age)
    const daysSincePosted = this.getDaysSincePosted(job.postedDate)
    if (daysSincePosted < 3) successRate += 10 // Fresh jobs
    if (daysSincePosted > 14) successRate -= 15 // Old jobs
    
    // Adjust based on company size/prestige
    const prestigeCompanies = ['capitec', 'discovery', 'standard bank', 'nedbank', 'absa']
    if (prestigeCompanies.some(company => job.company.toLowerCase().includes(company))) {
      successRate -= 10 // More competitive
    }
    
    return Math.max(5, Math.min(95, Math.round(successRate)))
  }

  private generateMatchReasons(cvData: CVData, job: SAJobListing, scores: any): string[] {
    const reasons: string[] = []
    
    if (scores.skillsMatch >= 80) reasons.push(`Strong skills match (${scores.skillsMatch}%)`)
    if (scores.experienceMatch >= 80) reasons.push('Experience level matches')
    if (scores.locationMatch >= 80) reasons.push('Preferred location')
    if (scores.atsCompatibility >= 80) reasons.push('CV is ATS-optimized')
    if (job.beeRequirement && this.isBEECandidate(cvData)) reasons.push('BEE requirements met')
    
    return reasons
  }

  private generateImprovementSuggestions(cvData: CVData, job: SAJobListing, scores: any): string[] {
    const suggestions: string[] = []
    
    if (scores.skillsMatch < 60) suggestions.push('Add missing skills to your CV')
    if (scores.experienceMatch < 60) suggestions.push('Highlight relevant experience')
    if (scores.atsCompatibility < 70) suggestions.push('Optimize CV for ATS systems')
    
    return suggestions
  }

  // Helper methods
  private extractSkills(cvData: CVData): string[] {
    const skills: string[] = []
    
    if (typeof cvData.skills === 'string') {
      skills.push(...cvData.skills.split(',').map(s => s.trim()))
    }
    
    // Extract from experience descriptions
    cvData.experience?.forEach(exp => {
      if (exp.description) {
        skills.push(...this.extractSkillsFromText(exp.description))
      }
    })
    
    return [...new Set(skills)]
  }

  private extractSkillsFromText(text: string): string[] {
    const commonSkills = ['javascript', 'python', 'sql', 'excel', 'powerpoint', 'project management']
    return commonSkills.filter(skill => text.toLowerCase().includes(skill))
  }

  private calculateExperienceYears(cvData: CVData): number {
    if (!cvData.experience?.length) return 0
    
    let totalMonths = 0
    cvData.experience.forEach(exp => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate)
        const end = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate)
        totalMonths += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
      }
    })
    
    return Math.round(totalMonths / 12)
  }

  private extractRequiredYears(job: SAJobListing): number {
    const text = job.description + ' ' + job.requirements.join(' ')
    const match = text.match(/(\d+)\+?\s*years?\s*(experience|exp)/i)
    return match ? parseInt(match[1]) : 0
  }

  private extractProvince(location: string): string {
    const provinceMap: { [key: string]: string } = {
      'cape town': 'WC', 'stellenbosch': 'WC', 'george': 'WC',
      'johannesburg': 'GP', 'pretoria': 'GP', 'sandton': 'GP',
      'durban': 'KZN', 'pietermaritzburg': 'KZN',
      'port elizabeth': 'EC', 'east london': 'EC',
      'bloemfontein': 'FS',
      'polokwane': 'LP',
      'nelspruit': 'MP',
      'kimberley': 'NC',
      'mahikeng': 'NW'
    }
    
    for (const [city, province] of Object.entries(provinceMap)) {
      if (location.includes(city)) return province
    }
    
    return 'GP' // Default to Gauteng
  }

  private parseSalaryRange(salary: string): { min: number, max: number } {
    const match = salary.match(/R(\d+,?\d*)\s*-\s*R(\d+,?\d*)/)
    if (match) {
      return {
        min: parseInt(match[1].replace(',', '')),
        max: parseInt(match[2].replace(',', ''))
      }
    }
    return { min: 0, max: 0 }
  }

  private getExpectedSalary(cvData: CVData): number | null {
    // This would come from user preferences or be calculated based on experience
    return null
  }

  private getDaysSincePosted(postedDate: string): number {
    const posted = new Date(postedDate)
    const now = new Date()
    return Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24))
  }

  private isBEECandidate(cvData: CVData): boolean {
    // This would be based on user's demographic information (optional)
    return false
  }

  private applyFilters(matches: SemanticJobMatch[], preferences: any): SemanticJobMatch[] {
    return matches.filter(match => {
      if (preferences.preferredProvinces?.length && 
          !preferences.preferredProvinces.includes(match.job.province)) {
        return false
      }
      
      if (preferences.jobTypes?.length && 
          !preferences.jobTypes.includes(match.job.type)) {
        return false
      }
      
      return true
    })
  }
}
import type { CVData } from '@/types/cv-types'

export interface IndustryATSRules {
  industry: string
  requiredSections: string[]
  keywordDensity: number
  formatRules: string[]
  commonATS: string[]
  specificRequirements: string[]
}

export interface ATSTestResult {
  system: string
  score: number
  issues: string[]
  recommendations: string[]
  beforeAfterComparison?: {
    before: number
    after: number
    improvements: string[]
  }
}

export interface DetailedATSScore {
  overallScore: number
  sectionScores: {
    [section: string]: {
      score: number
      maxScore: number
      issues: string[]
      improvements: string[]
      priority: 'high' | 'medium' | 'low'
    }
  }
  industrySpecific: {
    industry: string
    compliance: number
    missingRequirements: string[]
  }
  atsTestResults: ATSTestResult[]
  keywordOptimization: {
    density: number
    missing: string[]
    overused: string[]
  }
}

export class EnhancedATSOptimizer {
  private industryRules: IndustryRules = {
    'Banking': {
      industry: 'Banking',
      requiredSections: ['experience', 'education', 'skills', 'certifications'],
      keywordDensity: 2.5,
      formatRules: ['no-tables', 'standard-fonts', 'clear-headings'],
      commonATS: ['Workday', 'SAP SuccessFactors', 'Taleo'],
      specificRequirements: ['Financial qualifications', 'Compliance experience', 'Risk management']
    },
    'Technology': {
      industry: 'Technology',
      requiredSections: ['experience', 'skills', 'projects', 'education'],
      keywordDensity: 3.0,
      formatRules: ['no-graphics', 'standard-sections', 'bullet-points'],
      commonATS: ['Greenhouse', 'Lever', 'BambooHR'],
      specificRequirements: ['Technical skills', 'Programming languages', 'Frameworks']
    },
    'Mining': {
      industry: 'Mining',
      requiredSections: ['experience', 'education', 'certifications', 'safety'],
      keywordDensity: 2.0,
      formatRules: ['safety-emphasis', 'certification-prominent', 'experience-detailed'],
      commonATS: ['SAP SuccessFactors', 'Oracle HCM'],
      specificRequirements: ['Safety certifications', 'Mining experience', 'Equipment operation']
    },
    'Healthcare': {
      industry: 'Healthcare',
      requiredSections: ['experience', 'education', 'licenses', 'certifications'],
      keywordDensity: 2.2,
      formatRules: ['license-prominent', 'patient-care-focus', 'compliance-emphasis'],
      commonATS: ['Cerner', 'Epic', 'Workday'],
      specificRequirements: ['Medical licenses', 'Patient care experience', 'Healthcare compliance']
    }
  }

  async analyzeCV(cvData: CVData, targetIndustry?: string, jobDescription?: string): Promise<DetailedATSScore> {
    const industry = targetIndustry || this.detectIndustry(cvData)
    const rules = this.industryRules[industry] || this.industryRules['Technology']
    
    const sectionScores = this.analyzeSections(cvData, rules)
    const industryCompliance = this.checkIndustryCompliance(cvData, rules)
    const atsTestResults = await this.testAgainstATS(cvData, rules)
    const keywordOptimization = this.analyzeKeywords(cvData, jobDescription, rules)
    
    const overallScore = this.calculateOverallScore(sectionScores, industryCompliance.compliance, atsTestResults)
    
    return {
      overallScore,
      sectionScores,
      industrySpecific: industryCompliance,
      atsTestResults,
      keywordOptimization
    }
  }

  private analyzeSections(cvData: CVData, rules: IndustryATSRules) {
    const sections: DetailedATSScore['sectionScores'] = {}
    
    // Personal Information
    sections.personal = this.analyzePersonalSection(cvData)
    
    // Professional Summary
    sections.summary = this.analyzeSummarySection(cvData, rules)
    
    // Experience
    sections.experience = this.analyzeExperienceSection(cvData, rules)
    
    // Education
    sections.education = this.analyzeEducationSection(cvData, rules)
    
    // Skills
    sections.skills = this.analyzeSkillsSection(cvData, rules)
    
    // Industry-specific sections
    if (rules.requiredSections.includes('certifications')) {
      sections.certifications = this.analyzeCertificationsSection(cvData)
    }
    
    if (rules.requiredSections.includes('projects')) {
      sections.projects = this.analyzeProjectsSection(cvData)
    }
    
    return sections
  }

  private analyzePersonalSection(cvData: CVData) {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100
    
    if (!cvData.personalInfo?.fullName) {
      issues.push('Missing full name')
      improvements.push('Add your complete full name')
      score -= 20
    }
    
    if (!cvData.personalInfo?.email) {
      issues.push('Missing email address')
      improvements.push('Add professional email address')
      score -= 25
    } else if (!this.isValidEmail(cvData.personalInfo.email)) {
      issues.push('Email format may not be ATS-friendly')
      improvements.push('Use standard email format (name@domain.com)')
      score -= 10
    }
    
    if (!cvData.personalInfo?.phone) {
      issues.push('Missing phone number')
      improvements.push('Add phone number with country code (+27)')
      score -= 20
    }
    
    if (!cvData.personalInfo?.location) {
      issues.push('Missing location')
      improvements.push('Add city and province (e.g., Cape Town, Western Cape)')
      score -= 15
    }
    
    return {
      score: Math.max(0, score),
      maxScore: 100,
      issues,
      improvements,
      priority: issues.length > 2 ? 'high' : issues.length > 0 ? 'medium' : 'low' as const
    }
  }

  private analyzeSummarySection(cvData: CVData, rules: IndustryATSRules) {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100
    
    if (!cvData.summary) {
      issues.push('Missing professional summary')
      improvements.push('Add 3-4 sentence professional summary')
      return {
        score: 0,
        maxScore: 100,
        issues,
        improvements,
        priority: 'high' as const
      }
    }
    
    const wordCount = cvData.summary.split(/\s+/).length
    if (wordCount < 30) {
      issues.push('Summary too short (less than 30 words)')
      improvements.push('Expand to 50-80 words with key achievements')
      score -= 30
    } else if (wordCount > 100) {
      issues.push('Summary too long (over 100 words)')
      improvements.push('Condense to 50-80 words, focus on key points')
      score -= 20
    }
    
    // Check for quantifiable achievements
    if (!/\d+/.test(cvData.summary)) {
      issues.push('No quantifiable achievements in summary')
      improvements.push('Add 1-2 specific numbers or percentages')
      score -= 25
    }
    
    // Check for industry keywords
    const industryKeywords = this.getIndustryKeywords(rules.industry)
    const hasIndustryKeywords = industryKeywords.some(keyword => 
      cvData.summary.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (!hasIndustryKeywords) {
      issues.push(`Missing ${rules.industry.toLowerCase()} industry keywords`)
      improvements.push(`Include relevant ${rules.industry.toLowerCase()} terms`)
      score -= 20
    }
    
    return {
      score: Math.max(0, score),
      maxScore: 100,
      issues,
      improvements,
      priority: score < 60 ? 'high' : score < 80 ? 'medium' : 'low' as const
    }
  }

  private analyzeExperienceSection(cvData: CVData, rules: IndustryATSRules) {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100
    
    if (!cvData.experience?.length) {
      return {
        score: 0,
        maxScore: 100,
        issues: ['No work experience listed'],
        improvements: ['Add at least one work experience entry'],
        priority: 'high' as const
      }
    }
    
    // Check each experience entry
    cvData.experience.forEach((exp, index) => {
      if (!exp.title) {
        issues.push(`Experience ${index + 1}: Missing job title`)
        improvements.push(`Add job title for experience ${index + 1}`)
        score -= 15
      }
      
      if (!exp.company) {
        issues.push(`Experience ${index + 1}: Missing company name`)
        improvements.push(`Add company name for experience ${index + 1}`)
        score -= 15
      }
      
      if (!exp.startDate || !exp.endDate) {
        issues.push(`Experience ${index + 1}: Missing dates`)
        improvements.push(`Add start and end dates for experience ${index + 1}`)
        score -= 10
      }
      
      if (!exp.description) {
        issues.push(`Experience ${index + 1}: Missing job description`)
        improvements.push(`Add 3-5 bullet points describing your role`)
        score -= 20
      } else {
        // Check description quality
        const bulletPoints = exp.description.split('\n').filter(line => line.trim())
        if (bulletPoints.length < 2) {
          issues.push(`Experience ${index + 1}: Too few bullet points`)
          improvements.push(`Add 3-5 bullet points for better ATS parsing`)
          score -= 15
        }
        
        // Check for action verbs
        const actionVerbs = ['managed', 'developed', 'implemented', 'led', 'created', 'improved', 'increased']
        const hasActionVerbs = actionVerbs.some(verb => 
          exp.description.toLowerCase().includes(verb)
        )
        
        if (!hasActionVerbs) {
          issues.push(`Experience ${index + 1}: Missing action verbs`)
          improvements.push(`Start bullet points with action verbs (managed, developed, etc.)`)
          score -= 10
        }
        
        // Check for quantifiable results
        if (!/\d+/.test(exp.description)) {
          issues.push(`Experience ${index + 1}: No quantifiable achievements`)
          improvements.push(`Add numbers/percentages to show impact`)
          score -= 15
        }
      }
    })
    
    return {
      score: Math.max(0, score),
      maxScore: 100,
      issues,
      improvements,
      priority: score < 50 ? 'high' : score < 75 ? 'medium' : 'low' as const
    }
  }

  private analyzeEducationSection(cvData: CVData, rules: IndustryATSRules) {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100
    
    if (!cvData.education?.length) {
      return {
        score: 0,
        maxScore: 100,
        issues: ['No education information'],
        improvements: ['Add at least your highest qualification'],
        priority: 'high' as const
      }
    }
    
    cvData.education.forEach((edu, index) => {
      if (!edu.degree) {
        issues.push(`Education ${index + 1}: Missing degree/qualification`)
        improvements.push(`Add degree name for education ${index + 1}`)
        score -= 25
      }
      
      if (!edu.institution) {
        issues.push(`Education ${index + 1}: Missing institution`)
        improvements.push(`Add institution name for education ${index + 1}`)
        score -= 20
      }
      
      if (!edu.graduationDate) {
        issues.push(`Education ${index + 1}: Missing graduation date`)
        improvements.push(`Add graduation year for education ${index + 1}`)
        score -= 15
      }
    })
    
    return {
      score: Math.max(0, score),
      maxScore: 100,
      issues,
      improvements,
      priority: score < 60 ? 'high' : score < 80 ? 'medium' : 'low' as const
    }
  }

  private analyzeSkillsSection(cvData: CVData, rules: IndustryATSRules) {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100
    
    const skillsText = typeof cvData.skills === 'string' ? cvData.skills : ''
    
    if (!skillsText || skillsText.trim() === '') {
      return {
        score: 0,
        maxScore: 100,
        issues: ['No skills listed'],
        improvements: ['Add 8-12 relevant skills'],
        priority: 'high' as const
      }
    }
    
    const skillsList = skillsText.split(/,|\n/).map(s => s.trim()).filter(s => s)
    
    if (skillsList.length < 5) {
      issues.push('Too few skills listed (less than 5)')
      improvements.push('Add more relevant skills (aim for 8-12)')
      score -= 40
    } else if (skillsList.length > 20) {
      issues.push('Too many skills listed (over 20)')
      improvements.push('Focus on most relevant 10-15 skills')
      score -= 20
    }
    
    // Check for industry-relevant skills
    const industrySkills = this.getIndustrySkills(rules.industry)
    const hasIndustrySkills = industrySkills.some(skill => 
      skillsList.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
    )
    
    if (!hasIndustrySkills) {
      issues.push(`Missing ${rules.industry.toLowerCase()} industry skills`)
      improvements.push(`Add relevant ${rules.industry.toLowerCase()} skills`)
      score -= 30
    }
    
    return {
      score: Math.max(0, score),
      maxScore: 100,
      issues,
      improvements,
      priority: score < 60 ? 'high' : score < 80 ? 'medium' : 'low' as const
    }
  }

  private analyzeCertificationsSection(cvData: CVData) {
    // Mock implementation for certifications
    return {
      score: 50,
      maxScore: 100,
      issues: ['No certifications section found'],
      improvements: ['Add relevant professional certifications'],
      priority: 'medium' as const
    }
  }

  private analyzeProjectsSection(cvData: CVData) {
    // Mock implementation for projects
    return {
      score: 50,
      maxScore: 100,
      issues: ['No projects section found'],
      improvements: ['Add 2-3 relevant projects with descriptions'],
      priority: 'medium' as const
    }
  }

  private async testAgainstATS(cvData: CVData, rules: IndustryATSRules): Promise<ATSTestResult[]> {
    const results: ATSTestResult[] = []
    
    for (const atsSystem of rules.commonATS) {
      const result = await this.testSingleATS(cvData, atsSystem)
      results.push(result)
    }
    
    return results
  }

  private async testSingleATS(cvData: CVData, system: string): Promise<ATSTestResult> {
    // Mock ATS testing - in reality, this would test against actual ATS parsing
    const baseScore = 75
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Simulate different ATS system requirements
    switch (system) {
      case 'Workday':
        if (!cvData.personalInfo?.email) {
          issues.push('Email required for Workday parsing')
          recommendations.push('Add email address')
        }
        break
      case 'SAP SuccessFactors':
        if (!cvData.summary) {
          issues.push('Professional summary improves SAP parsing')
          recommendations.push('Add professional summary')
        }
        break
      case 'Taleo':
        if (!cvData.skills) {
          issues.push('Skills section critical for Taleo matching')
          recommendations.push('Add comprehensive skills section')
        }
        break
    }
    
    const score = Math.max(40, baseScore - (issues.length * 15))
    
    return {
      system,
      score,
      issues,
      recommendations
    }
  }

  private checkIndustryCompliance(cvData: CVData, rules: IndustryATSRules) {
    const missingRequirements: string[] = []
    let compliance = 100
    
    rules.specificRequirements.forEach(requirement => {
      if (!this.hasRequirement(cvData, requirement)) {
        missingRequirements.push(requirement)
        compliance -= 20
      }
    })
    
    return {
      industry: rules.industry,
      compliance: Math.max(0, compliance),
      missingRequirements
    }
  }

  private analyzeKeywords(cvData: CVData, jobDescription?: string, rules?: IndustryATSRules) {
    const cvText = this.extractAllText(cvData)
    const words = cvText.toLowerCase().split(/\W+/)
    const wordCount = words.length
    
    // Calculate keyword density
    const keywordCounts = new Map<string, number>()
    words.forEach(word => {
      if (word.length > 3) {
        keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1)
      }
    })
    
    const density = (keywordCounts.size / wordCount) * 100
    
    return {
      density: Math.round(density * 10) / 10,
      missing: [], // Would be populated based on job description analysis
      overused: Array.from(keywordCounts.entries())
        .filter(([_, count]) => count > wordCount * 0.05)
        .map(([word]) => word)
    }
  }

  private calculateOverallScore(sectionScores: any, industryCompliance: number, atsResults: ATSTestResult[]): number {
    const sectionAverage = Object.values(sectionScores).reduce((sum: number, section: any) => 
      sum + (section.score / section.maxScore) * 100, 0) / Object.keys(sectionScores).length
    
    const atsAverage = atsResults.reduce((sum, result) => sum + result.score, 0) / atsResults.length
    
    return Math.round((sectionAverage * 0.6) + (industryCompliance * 0.2) + (atsAverage * 0.2))
  }

  // Helper methods
  private detectIndustry(cvData: CVData): string {
    const text = this.extractAllText(cvData).toLowerCase()
    
    if (text.includes('bank') || text.includes('financial') || text.includes('finance')) return 'Banking'
    if (text.includes('software') || text.includes('developer') || text.includes('programming')) return 'Technology'
    if (text.includes('mining') || text.includes('mine') || text.includes('mineral')) return 'Mining'
    if (text.includes('healthcare') || text.includes('medical') || text.includes('nurse')) return 'Healthcare'
    
    return 'Technology' // Default
  }

  private getIndustryKeywords(industry: string): string[] {
    const keywords = {
      'Banking': ['financial', 'banking', 'credit', 'risk', 'compliance', 'audit'],
      'Technology': ['software', 'development', 'programming', 'agile', 'cloud', 'api'],
      'Mining': ['mining', 'safety', 'operations', 'equipment', 'production', 'geology'],
      'Healthcare': ['patient', 'clinical', 'medical', 'healthcare', 'treatment', 'diagnosis']
    }
    
    return keywords[industry] || keywords['Technology']
  }

  private getIndustrySkills(industry: string): string[] {
    const skills = {
      'Banking': ['Excel', 'SQL', 'Risk Management', 'Financial Analysis', 'Compliance'],
      'Technology': ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Git'],
      'Mining': ['Safety Management', 'Equipment Operation', 'Project Management', 'AutoCAD'],
      'Healthcare': ['Patient Care', 'Medical Records', 'Clinical Skills', 'Healthcare Compliance']
    }
    
    return skills[industry] || skills['Technology']
  }

  private hasRequirement(cvData: CVData, requirement: string): boolean {
    const text = this.extractAllText(cvData).toLowerCase()
    return text.includes(requirement.toLowerCase())
  }

  private extractAllText(cvData: CVData): string {
    const texts = [
      cvData.summary || '',
      cvData.personalInfo?.jobTitle || '',
      ...(cvData.experience?.map(exp => `${exp.title} ${exp.company} ${exp.description}`) || []),
      ...(cvData.education?.map(edu => `${edu.degree} ${edu.institution}`) || []),
      typeof cvData.skills === 'string' ? cvData.skills : ''
    ]
    
    return texts.join(' ')
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}

type IndustryRules = {
  [key: string]: IndustryATSRules
}
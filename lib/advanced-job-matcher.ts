import type { CVData } from '@/types/cv-types'

export interface KeywordMatch {
  keyword: string
  inCV: boolean
  inJob: boolean
  weight: number
  category: 'technical' | 'soft' | 'industry' | 'general'
}

export interface SkillsGap {
  skill: string
  category: string
  priority: 'high' | 'medium' | 'low'
  learningResources: string[]
  estimatedTimeToLearn: string
}

export interface JobMatchResult {
  overallScore: number
  keywordMatches: KeywordMatch[]
  skillsGap: SkillsGap[]
  matchingKeywords: string[]
  missingKeywords: string[]
  recommendations: string[]
  industryAlignment: number
  experienceAlignment: number
  educationAlignment: number
}

export class AdvancedJobMatcher {
  private industryKeywords: Record<string, string[]> = {
    technology: [
      'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java',
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'Agile', 'Scrum', 'DevOps',
      'Machine Learning', 'AI', 'Data Science', 'Cloud Computing', 'Microservices',
      'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Linux', 'Docker'
    ],
    finance: [
      'Financial Analysis', 'Risk Management', 'Compliance', 'Regulatory', 'Banking',
      'Investment', 'Portfolio Management', 'Financial Modeling', 'Excel', 'VBA',
      'Bloomberg', 'Reuters', 'CFA', 'CPA', 'IFRS', 'GAAP', 'Basel', 'SOX',
      'Anti-Money Laundering', 'KYC', 'Due Diligence', 'Credit Analysis'
    ],
    healthcare: [
      'Patient Care', 'Medical Records', 'HIPAA', 'Clinical', 'Healthcare IT',
      'Electronic Health Records', 'EHR', 'Medical Coding', 'Nursing', 'Pharmacy',
      'Medical Terminology', 'Healthcare Compliance', 'Quality Improvement',
      'Patient Safety', 'Healthcare Analytics', 'Telemedicine', 'Medical Devices'
    ],
    marketing: [
      'Digital Marketing', 'SEO', 'SEM', 'Social Media', 'Content Marketing',
      'Google Analytics', 'Facebook Ads', 'LinkedIn Marketing', 'Brand Management',
      'Market Research', 'Campaign Management', 'CRM', 'Marketing Automation',
      'Adobe Creative Suite', 'Google Ads', 'Email Marketing', 'Conversion Optimization'
    ]
  }

  private skillCategories = {
    technical: ['programming', 'software', 'development', 'engineering', 'data', 'cloud', 'infrastructure'],
    soft: ['communication', 'leadership', 'teamwork', 'management', 'presentation', 'negotiation'],
    industry: ['compliance', 'regulatory', 'domain', 'specialized', 'certified'],
    general: ['office', 'administration', 'customer service', 'project management']
  }

  async analyzeJobMatch(cvData: CVData, jobDescription: string): Promise<JobMatchResult> {
    // Extract keywords from job description
    const jobKeywords = this.extractKeywordsFromJobDescription(jobDescription)

    // Extract keywords from CV
    const cvKeywords = this.extractKeywordsFromCV(cvData)

    // Perform detailed keyword matching
    const keywordMatches = this.performKeywordMatching(cvKeywords, jobKeywords)

    // Analyze skills gap
    const skillsGap = this.analyzeSkillsGap(cvData, jobKeywords)

    // Calculate alignment scores
    const industryAlignment = this.calculateIndustryAlignment(cvData, jobKeywords)
    const experienceAlignment = this.calculateExperienceAlignment(cvData, jobDescription)
    const educationAlignment = this.calculateEducationAlignment(cvData, jobDescription)

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      keywordMatches,
      industryAlignment,
      experienceAlignment,
      educationAlignment
    )

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      keywordMatches,
      skillsGap,
      overallScore
    )

    return {
      overallScore,
      keywordMatches,
      skillsGap,
      matchingKeywords: keywordMatches.filter(k => k.inCV && k.inJob).map(k => k.keyword),
      missingKeywords: keywordMatches.filter(k => !k.inCV && k.inJob).map(k => k.keyword),
      recommendations,
      industryAlignment,
      experienceAlignment,
      educationAlignment
    }
  }

  private extractKeywordsFromJobDescription(jobDescription: string): string[] {
    const commonWords = new Set([
      'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'as', 'by', 'of', 'about',
      'you', 'will', 'have', 'be', 'are', 'our', 'we', 'is', 'from', 'that', 'this', 'who', 'or',
      'not', 'can', 'your', 'their', 'has', 'they', 'would', 'could', 'should', 'than', 'then',
      'all', 'more', 'other', 'new', 'some', 'what', 'when', 'which', 'been', 'were', 'was',
      'job', 'work', 'role', 'position', 'candidate', 'applicant', 'application', 'company',
      'please', 'looking', 'required', 'must', 'need', 'wants', 'desired', 'ability', 'able',
      'years', 'experience', 'skills', 'knowledge', 'understanding', 'familiarity'
    ])

    const words = jobDescription.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))

    // Count frequency and get most important keywords
    const wordFrequency = new Map<string, number>()
    words.forEach(word => {
      const count = wordFrequency.get(word) || 0
      wordFrequency.set(word, count + 1)
    })

    return Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word]) => word)
  }

  private extractKeywordsFromCV(cvData: CVData): string[] {
    const cvText = [
      cvData.personalInfo?.jobTitle || '',
      cvData.summary || '',
      ...(cvData.experience?.map(exp => `${exp.title} ${exp.company} ${exp.description}`) || []),
      ...(cvData.education?.map(edu => `${edu.degree} ${edu.institution}`) || []),
      typeof cvData.skills === 'string' ? cvData.skills : ''
    ].join(' ').toLowerCase()

    const words = cvText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)

    return [...new Set(words)] // Remove duplicates
  }

  private performKeywordMatching(cvKeywords: string[], jobKeywords: string[]): KeywordMatch[] {
    const matches: KeywordMatch[] = []

    jobKeywords.forEach(jobKeyword => {
      const inCV = cvKeywords.some(cvKeyword =>
        cvKeyword.includes(jobKeyword) || jobKeyword.includes(cvKeyword) ||
        this.calculateSimilarity(cvKeyword, jobKeyword) > 0.8
      )

      const category = this.categorizeKeyword(jobKeyword)
      const weight = this.calculateKeywordWeight(jobKeyword, category)

      matches.push({
        keyword: jobKeyword,
        inCV,
        inJob: true,
        weight,
        category
      })
    })

    return matches
  }

  private categorizeKeyword(keyword: string): 'technical' | 'soft' | 'industry' | 'general' {
    const lowerKeyword = keyword.toLowerCase()

    for (const [category, keywords] of Object.entries(this.skillCategories)) {
      if (keywords.some(skill => lowerKeyword.includes(skill))) {
        return category as 'technical' | 'soft' | 'industry' | 'general'
      }
    }

    return 'general'
  }

  private calculateKeywordWeight(keyword: string, category: string): number {
    const weights = {
      technical: 1.5,
      industry: 1.3,
      soft: 1.2,
      general: 1.0
    }

    return weights[category as keyof typeof weights] || 1.0
  }

  private calculateSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1.0

    const longer = word1.length > word2.length ? word1 : word2
    const shorter = word1.length > word2.length ? word2 : word1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  private analyzeSkillsGap(cvData: CVData, jobKeywords: string[]): SkillsGap[] {
    const gaps: SkillsGap[] = []

    // Extract CV skills
    const cvSkills = typeof cvData.skills === 'string'
      ? cvData.skills.split(',').map(s => s.trim().toLowerCase())
      : []

    jobKeywords.forEach(keyword => {
      const inCV = cvSkills.some(cvSkill =>
        cvSkill.includes(keyword) || keyword.includes(cvSkill) ||
        this.calculateSimilarity(cvSkill, keyword) > 0.8
      )

      if (!inCV) {
        const category = this.categorizeKeyword(keyword)
        const priority = this.determineSkillPriority(keyword, category)

        gaps.push({
          skill: keyword,
          category,
          priority,
          learningResources: this.getLearningResources(keyword),
          estimatedTimeToLearn: this.getEstimatedLearningTime(keyword, priority)
        })
      }
    })

    return gaps.slice(0, 10) // Limit to top 10 gaps
  }

  private determineSkillPriority(skill: string, category: string): 'high' | 'medium' | 'low' {
    // Technical skills are usually high priority
    if (category === 'technical') return 'high'
    if (category === 'industry') return 'high'
    if (category === 'soft') return 'medium'
    return 'low'
  }

  private getLearningResources(skill: string): string[] {
    const resources: Record<string, string[]> = {
      'javascript': ['MDN Web Docs', 'JavaScript.info', 'FreeCodeCamp'],
      'react': ['React Official Docs', 'React Tutorial', 'Egghead.io'],
      'python': ['Python.org Tutorial', 'Automate the Boring Stuff', 'Real Python'],
      'aws': ['AWS Documentation', 'AWS Training', 'CloudAcademy'],
      'docker': ['Docker Documentation', 'Play with Docker', 'Docker Curriculum']
    }

    return resources[skill.toLowerCase()] || ['Online tutorials', 'Documentation', 'Practice projects']
  }

  private getEstimatedLearningTime(skill: string, priority: string): string {
    const times = {
      high: '2-4 weeks',
      medium: '1-3 weeks',
      low: '3-7 days'
    }

    return times[priority] || '1-2 weeks'
  }

  private calculateIndustryAlignment(cvData: CVData, jobKeywords: string[]): number {
    // Detect industry from CV
    const cvIndustry = this.detectIndustryFromCV(cvData)

    // Check alignment with job keywords
    const industryKeywords = this.industryKeywords[cvIndustry] || []
    const matchingIndustryKeywords = jobKeywords.filter(keyword =>
      industryKeywords.some(industryKeyword =>
        keyword.includes(industryKeyword.toLowerCase()) ||
        industryKeyword.toLowerCase().includes(keyword)
      )
    )

    return Math.round((matchingIndustryKeywords.length / Math.max(industryKeywords.length, 1)) * 100)
  }

  private detectIndustryFromCV(cvData: CVData): string {
    const cvText = [
      cvData.personalInfo?.jobTitle || '',
      cvData.summary || '',
      ...(cvData.experience?.map(exp => `${exp.title} ${exp.company}`) || []),
      typeof cvData.skills === 'string' ? cvData.skills : ''
    ].join(' ').toLowerCase()

    let bestMatch = 'general'
    let highestScore = 0

    Object.entries(this.industryKeywords).forEach(([industry, keywords]) => {
      const score = keywords.filter(keyword =>
        cvText.includes(keyword.toLowerCase())
      ).length

      if (score > highestScore) {
        highestScore = score
        bestMatch = industry
      }
    })

    return bestMatch
  }

  private calculateExperienceAlignment(cvData: CVData, jobDescription: string): number {
    const experienceYears = this.extractExperienceYears(cvData)
    const requiredYears = this.extractRequiredYears(jobDescription)

    if (requiredYears === 0) return 100 // No specific requirement
    if (experienceYears >= requiredYears) return 100
    if (experienceYears >= requiredYears * 0.7) return 75
    if (experienceYears >= requiredYears * 0.5) return 50
    return 25
  }

  private extractExperienceYears(cvData: CVData): number {
    // This is a simplified calculation - in reality you'd parse dates
    return cvData.experience?.length || 0
  }

  private extractRequiredYears(jobDescription: string): number {
    const matches = jobDescription.match(/(\d+)\+?\s*(?:years?|yrs?)/i)
    return matches ? parseInt(matches[1]) : 0
  }

  private calculateEducationAlignment(cvData: CVData, jobDescription: string): number {
    const cvEducationLevel = this.getEducationLevel(cvData)
    const requiredEducationLevel = this.getRequiredEducationLevel(jobDescription)

    const levels = { 'high school': 1, 'diploma': 2, 'bachelor': 3, 'master': 4, 'phd': 5 }
    const cvLevel = levels[cvEducationLevel as keyof typeof levels] || 1
    const requiredLevel = levels[requiredEducationLevel as keyof typeof levels] || 1

    if (cvLevel >= requiredLevel) return 100
    if (cvLevel >= requiredLevel - 1) return 75
    return 50
  }

  private getEducationLevel(cvData: CVData): string {
    const highestEducation = cvData.education?.[0]?.degree || ''
    const lowerEducation = highestEducation.toLowerCase()

    if (lowerEducation.includes('phd') || lowerEducation.includes('doctorate')) return 'phd'
    if (lowerEducation.includes('master')) return 'master'
    if (lowerEducation.includes('bachelor') || lowerEducation.includes('degree')) return 'bachelor'
    if (lowerEducation.includes('diploma')) return 'diploma'
    return 'high school'
  }

  private getRequiredEducationLevel(jobDescription: string): string {
    const lowerJobDesc = jobDescription.toLowerCase()

    if (lowerJobDesc.includes('phd') || lowerJobDesc.includes('doctorate')) return 'phd'
    if (lowerJobDesc.includes('master')) return 'master'
    if (lowerJobDesc.includes('bachelor') || lowerJobDesc.includes('degree')) return 'bachelor'
    if (lowerJobDesc.includes('diploma')) return 'diploma'
    return 'high school'
  }

  private calculateOverallScore(
    keywordMatches: KeywordMatch[],
    industryAlignment: number,
    experienceAlignment: number,
    educationAlignment: number
  ): number {
    const keywordScore = keywordMatches.filter(k => k.inCV).length / Math.max(keywordMatches.length, 1) * 100
    const weights = { keywords: 0.4, industry: 0.3, experience: 0.2, education: 0.1 }

    return Math.round(
      keywordScore * weights.keywords +
      industryAlignment * weights.industry +
      experienceAlignment * weights.experience +
      educationAlignment * weights.education
    )
  }

  private generateRecommendations(
    keywordMatches: KeywordMatch[],
    skillsGap: SkillsGap[],
    overallScore: number
  ): string[] {
    const recommendations: string[] = []

    if (overallScore < 50) {
      recommendations.push('Consider gaining more relevant experience before applying')
    }

    const missingKeywords = keywordMatches.filter(k => !k.inCV && k.inJob)
    if (missingKeywords.length > 0) {
      const highPriorityMissing = missingKeywords.filter(k => k.category === 'technical' || k.category === 'industry')
      if (highPriorityMissing.length > 0) {
        recommendations.push(`Focus on learning these key skills: ${highPriorityMissing.slice(0, 3).map(k => k.keyword).join(', ')}`)
      }
    }

    const highPriorityGaps = skillsGap.filter(g => g.priority === 'high')
    if (highPriorityGaps.length > 0) {
      recommendations.push(`Address high-priority skill gaps: ${highPriorityGaps.slice(0, 2).map(g => g.skill).join(', ')}`)
    }

    if (overallScore >= 70) {
      recommendations.push('Your profile is a strong match - consider applying soon')
    } else if (overallScore >= 50) {
      recommendations.push('Highlight transferable skills and relevant experience in your application')
    } else {
      recommendations.push('Consider building more relevant experience before applying')
    }

    return recommendations
  }
}

// Export singleton instance
export const advancedJobMatcher = new AdvancedJobMatcher()

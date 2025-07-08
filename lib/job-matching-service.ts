import type { CVData } from "@/types/cv-types"

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  salary?: string
  type: "full-time" | "part-time" | "contract" | "internship"
  postedDate: string
  keywords: string[]
}

export interface JobMatch {
  job: JobListing
  matchScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
}

// Extract keywords from CV data
export function extractCVKeywords(cvData: CVData): string[] {
  const keywords: string[] = []
  
  // Extract from skills
  if (cvData.skills) {
    const skillsArray = Array.isArray(cvData.skills) 
      ? cvData.skills 
      : cvData.skills.split(',').map(s => s.trim())
    keywords.push(...skillsArray)
  }
  
  // Extract from job titles
  if (cvData.experience) {
    cvData.experience.forEach(exp => {
      if (exp.title) keywords.push(exp.title)
      if (exp.description) {
        // Simple keyword extraction from description
        const descWords = exp.description.toLowerCase()
          .split(/\W+/)
          .filter(word => word.length > 3)
        keywords.push(...descWords)
      }
    })
  }
  
  // Extract from education
  if (cvData.education) {
    cvData.education.forEach(edu => {
      if (edu.degree) keywords.push(edu.degree)
    })
  }
  
  // Clean and deduplicate
  return [...new Set(keywords.map(k => k.toLowerCase().trim()).filter(Boolean))]
}

// Calculate match score between CV and job
export function calculateJobMatch(cvKeywords: string[], job: JobListing): JobMatch {
  const jobKeywords = job.keywords.map(k => k.toLowerCase())
  const matchedKeywords: string[] = []
  const missingKeywords: string[] = []
  
  // Find matches
  jobKeywords.forEach(jobKeyword => {
    const isMatch = cvKeywords.some(cvKeyword => 
      cvKeyword.includes(jobKeyword) || jobKeyword.includes(cvKeyword)
    )
    
    if (isMatch) {
      matchedKeywords.push(jobKeyword)
    } else {
      missingKeywords.push(jobKeyword)
    }
  })
  
  // Calculate score (percentage of job keywords matched)
  const matchScore = jobKeywords.length > 0 
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : 0
  
  return {
    job,
    matchScore,
    matchedKeywords,
    missingKeywords
  }
}

// Mock job listings for demo
export const mockJobListings: JobListing[] = [
  {
    id: "1",
    title: "Senior Software Developer",
    company: "TechCorp SA",
    location: "Cape Town, WC",
    description: "We are looking for a senior software developer with experience in React, Node.js, and cloud technologies.",
    requirements: ["5+ years experience", "React", "Node.js", "AWS", "TypeScript"],
    salary: "R600,000 - R800,000",
    type: "full-time",
    postedDate: "2024-01-15",
    keywords: ["react", "nodejs", "javascript", "typescript", "aws", "software", "developer", "senior"]
  },
  {
    id: "2",
    title: "Financial Analyst",
    company: "Standard Bank",
    location: "Johannesburg, GP",
    description: "Join our finance team as a financial analyst. Experience with Excel, financial modeling, and data analysis required.",
    requirements: ["BCom Finance", "Excel", "Financial Modeling", "3+ years experience"],
    salary: "R450,000 - R550,000",
    type: "full-time",
    postedDate: "2024-01-14",
    keywords: ["finance", "analyst", "excel", "modeling", "data", "banking", "financial"]
  },
  {
    id: "3",
    title: "Marketing Manager",
    company: "Woolworths",
    location: "Cape Town, WC",
    description: "Lead our marketing initiatives with focus on digital marketing, brand management, and campaign execution.",
    requirements: ["Marketing degree", "Digital marketing", "Brand management", "5+ years experience"],
    salary: "R500,000 - R650,000",
    type: "full-time",
    postedDate: "2024-01-13",
    keywords: ["marketing", "digital", "brand", "manager", "campaigns", "social media"]
  },
  {
    id: "4",
    title: "Data Scientist",
    company: "Discovery",
    location: "Sandton, GP",
    description: "Analyze large datasets using Python, SQL, and machine learning to drive business insights.",
    requirements: ["Python", "SQL", "Machine Learning", "Statistics", "Masters degree preferred"],
    salary: "R700,000 - R900,000",
    type: "full-time",
    postedDate: "2024-01-12",
    keywords: ["python", "sql", "data", "machine learning", "statistics", "analytics", "scientist"]
  },
  {
    id: "5",
    title: "UX/UI Designer",
    company: "Takealot",
    location: "Cape Town, WC",
    description: "Design user-centered digital experiences for our e-commerce platform using Figma and user research.",
    requirements: ["Figma", "User Research", "Prototyping", "3+ years experience"],
    salary: "R400,000 - R550,000",
    type: "full-time",
    postedDate: "2024-01-11",
    keywords: ["ux", "ui", "design", "figma", "user research", "prototyping", "designer"]
  }
]

// Get job matches for a CV
export function getJobMatches(cvData: CVData, threshold: number = 60): JobMatch[] {
  const cvKeywords = extractCVKeywords(cvData)
  
  return mockJobListings
    .map(job => calculateJobMatch(cvKeywords, job))
    .filter(match => match.matchScore >= threshold)
    .sort((a, b) => b.matchScore - a.matchScore)
}
export interface CustomSection {
  id: string
  title: string
  content: string
}

export interface PersonalInfo {
  fullName: string
  jobTitle: string
  email: string
  phone: string
  location?: string
  idNumber?: string
  linkedIn?: string
  professionalRegistration?: string
  languages?: string[]
  photo?: string
}

export interface Experience {
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  description: string
  isLearnership?: boolean
  isInternship?: boolean
}

export interface Education {
  degree: string
  institution: string
  location: string
  graduationDate: string
  nqfLevel?: number
  saqa?: string
  internationalEquivalence?: string
}

export interface Skill {
  name: string
  category?: string
  level?: 'beginner' | 'intermediate' | 'expert'
  yearsOfExperience?: number
}

export interface SAFlags {
  eeStatus?: boolean
  driversLicence?: boolean
  ownVehicle?: boolean
  citizenship?: string
  willingToRelocate?: string[]
  securityClearance?: boolean
  workPermit?: string
}

export interface CVData {
  personalInfo: PersonalInfo
  summary: string
  experience: Experience[]
  education: Education[]
  skills: string | Skill[]
  customSections?: CustomSection[]
  // Extended fields for SA knowledgebase matching
  registrations?: string[]        // ['SAICA', 'ECSA', 'HPCSA', etc.]
  certifications?: string[]       // ['AWS Certified', 'PMP', 'CISSP', etc.]
  saFlags?: SAFlags
  detectedJobFamily?: string      // Set by classifier after parsing
  familyConfidence?: number       // 0-1 confidence score
}

export interface RecipientInfo {
  name: string
  title: string
  company: string
  address: string
}

export interface LetterContent {
  date: string
  greeting: string
  opening: string
  body: string
  closing: string
  signature: string
}

export interface CoverLetterData {
  personalInfo: PersonalInfo
  recipientInfo: RecipientInfo
  letterContent: LetterContent
}

export type TemplateType =
  | "professional"
  | "modern"
  | "creative"
  | "simple"
  | "executive"
  | "technical"
  | "graduate"
  | "digital"
  | "sa-professional"
  | "sa-modern"
  | "sa-executive"
  | "compact"
  | "chronological"
  | "functional"
  | "sidebar"
  | "matric"

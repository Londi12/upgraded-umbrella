export interface PersonalInfo {
  fullName: string
  jobTitle: string
  email: string
  phone: string
  location?: string
  idNumber?: string // South African ID number
  linkedIn?: string
  professionalRegistration?: string // For regulated professions in South Africa
  languages?: string[] // Important in multilingual South Africa
}

export interface Experience {
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  description: string
  isLearnership?: boolean // Common in South African employment
  isInternship?: boolean
}

export interface Education {
  degree: string
  institution: string
  location: string
  graduationDate: string
  nqfLevel?: number // South African National Qualifications Framework level
  saqa?: string // South African Qualifications Authority ID
  internationalEquivalence?: string // For international qualifications
}

export interface Skill {
  name: string
  category?: string
}

export interface CVData {
  personalInfo: PersonalInfo
  summary: string
  experience: Experience[]
  education: Education[]
  skills: string | Skill[]
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
  | "sa-professional" // South African Professional template
  | "sa-modern" // South African Modern template
  | "sa-executive" // South African Executive template

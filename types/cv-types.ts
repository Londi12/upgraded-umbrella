export interface PersonalInfo {
  fullName: string
  jobTitle: string
  email: string
  phone: string
  location?: string
}

export interface Experience {
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  description: string
}

export interface Education {
  degree: string
  institution: string
  location: string
  graduationDate: string
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
  personalInfo: Omit<PersonalInfo, "location">
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

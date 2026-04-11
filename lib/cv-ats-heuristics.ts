/**
 * Shared heuristic CV quality + job overlap scoring (client-side).
 * Used by `components/cv-ats-scoring.tsx` (Jobs / Build flows).
 */
import type { CVData } from '@/types/cv-types'

export interface SectionScore {
  score: number
  feedback: string[]
  suggestions: string[]
}

export interface ATSScore {
  overallScore: number
  sections: Record<AtsSectionKey, SectionScore>
}

export interface JobMatchResult {
  overallScore: number
  skillsScore: number
  titleScore: number
  experienceScore: number
  educationScore: number
  matchedSkills: string[]
  missingSkills: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  yearsRequired: number | null
  yearsCandidate: number
  verdict: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Weak Match'
  tips: string[]
}

export const ATS_SECTION_KEYS = ['personal', 'summary', 'experience', 'education', 'skills'] as const
export type AtsSectionKey = (typeof ATS_SECTION_KEYS)[number]

export const STOP_WORDS = new Set([
  'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'as', 'by', 'of', 'about',
  'you', 'will', 'have', 'be', 'are', 'our', 'we', 'is', 'from', 'that', 'this', 'who', 'or',
  'not', 'can', 'your', 'their', 'has', 'they', 'would', 'could', 'should', 'than', 'then',
  'all', 'more', 'other', 'new', 'some', 'what', 'when', 'which', 'been', 'were', 'was',
  'job', 'work', 'role', 'position', 'candidate', 'applicant', 'application', 'company',
  'please', 'looking', 'required', 'must', 'need', 'wants', 'desired', 'ability', 'able',
  'years', 'experience', 'including', 'following', 'responsibilities', 'duties', 'skills',
  'knowledge', 'understanding', 'strong', 'excellent', 'good', 'great', 'team', 'working',
  'ensure', 'provide', 'support', 'manage', 'within', 'across', 'between', 'through',
])

export const SKILL_GROUPS: Record<string, string[]> = {
  javascript: ['javascript', 'js', 'node', 'nodejs', 'react', 'vue', 'angular', 'typescript', 'ts'],
  python: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy'],
  java: ['java', 'spring', 'springboot', 'maven', 'gradle'],
  sql: ['sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'mssql', 'sqlite', 'database'],
  cloud: ['aws', 'azure', 'gcp', 'cloud', 's3', 'ec2', 'lambda', 'kubernetes', 'docker', 'devops'],
  data: ['data analysis', 'analytics', 'power bi', 'tableau', 'excel', 'reporting', 'dashboards'],
  accounting: ['accounting', 'bookkeeping', 'ifrs', 'gaap', 'financial statements', 'balance sheet'],
  finance: ['financial analysis', 'budgeting', 'forecasting', 'financial modelling', 'treasury'],
  hr: ['recruitment', 'talent acquisition', 'onboarding', 'payroll', 'performance management', 'hris'],
  management: ['project management', 'agile', 'scrum', 'pmp', 'prince2', 'stakeholder management'],
  communication: ['communication', 'presentation', 'report writing', 'stakeholder engagement'],
  leadership: ['leadership', 'team management', 'mentoring', 'coaching', 'people management'],
}

const EXTRA_CURATED_TOKENS = [
  'stakeholder', 'stakeholders', 'compliance', 'budget', 'forecast', 'procurement', 'vendor',
  'learnership', 'matric', 'nqf', 'saica', 'ecsa', 'hpcsa', 'sanc', 'bee', 'bbbee',
  'logistics', 'warehouse', 'inventory', 'retail', 'banking', 'underwriting', 'kyc',
]

function normaliseText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

let _curatedTokenSet: Set<string> | null = null

function getCuratedTokenSet(): Set<string> {
  if (_curatedTokenSet) return _curatedTokenSet
  const s = new Set<string>()
  for (const variants of Object.values(SKILL_GROUPS)) {
    for (const v of variants) {
      for (const w of normaliseText(v).split(/\s+/)) {
        if (w.length > 2 && !STOP_WORDS.has(w)) s.add(w)
      }
    }
  }
  EXTRA_CURATED_TOKENS.forEach(w => s.add(w))
  _curatedTokenSet = s
  return s
}

/**
 * Skill / focus signals: taxonomy groups (when phrases match) plus curated tokens only —
 * not every long word in the posting.
 */
export function extractSkillsFromText(text: string): string[] {
  const norm = normaliseText(text)
  const out = new Set<string>()
  for (const [group, variants] of Object.entries(SKILL_GROUPS)) {
    if (variants.some(v => norm.includes(v))) out.add(group)
  }
  const curated = getCuratedTokenSet()
  for (const w of norm.split(/\s+/)) {
    if (w.length < 3 || STOP_WORDS.has(w)) continue
    if (curated.has(w)) out.add(w)
  }
  return [...out]
}

export function extractYearsRequired(text: string): number | null {
  const match = text.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years?\s*(?:of\s*)?(?:relevant\s*)?experience/i)
  return match ? parseInt(match[1], 10) : null
}

export function estimateCandidateYears(cvData: CVData): number {
  if (!cvData.experience?.length) return 0
  let total = 0
  cvData.experience.forEach(exp => {
    if (exp.startDate) {
      const start = new Date(exp.startDate).getFullYear() || parseInt(exp.startDate, 10)
      const end = exp.endDate?.toLowerCase().includes('present')
        ? new Date().getFullYear()
        : (new Date(exp.endDate || '').getFullYear() || parseInt(exp.endDate || '', 10) || new Date().getFullYear())
      if (!isNaN(start) && !isNaN(end) && end >= start) total += end - start
    }
  })
  return Math.min(total, 40)
}

export function extractKeywordsFromJob(jobText: string): string[] {
  const norm = normaliseText(jobText)
  const freq = new Map<string, number>()
  norm.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)).forEach(w => {
    freq.set(w, (freq.get(w) || 0) + 1)
  })
  return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 40).map(e => e[0])
}

export function getCVText(cvData: CVData): string {
  return [
    cvData.personalInfo?.jobTitle || '',
    cvData.summary || '',
    ...(cvData.experience?.map(e => `${e.title} ${e.company} ${e.description}`) || []),
    ...(cvData.education?.map(e => `${e.degree} ${e.institution}`) || []),
    typeof cvData.skills === 'string' ? cvData.skills : '',
  ].join(' ')
}

/** First meaningful line: skip empty lines and very short boilerplate lines. */
export function extractJobTitleLine(jobDescription: string): string {
  const lines = jobDescription.split(/\n/).map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (line.length >= 8 && line.length < 120) return line.toLowerCase()
  }
  return lines[0]?.toLowerCase() || ''
}

export function calculateJobMatch(cvData: CVData, jobDescription: string): JobMatchResult {
  const jobNorm = normaliseText(jobDescription)
  const cvText = getCVText(cvData)
  const cvNorm = normaliseText(cvText)

  const jobSkills = extractSkillsFromText(jobDescription)
  const cvSkills = extractSkillsFromText(cvText)
  const matchedSkills = jobSkills.filter(s => cvSkills.includes(s))
  const missingSkills = jobSkills.filter(s => !cvSkills.includes(s)).slice(0, 8)
  const skillsScore = jobSkills.length ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 50

  const jobTitle = extractJobTitleLine(jobDescription)
  const cvTitle = (cvData.personalInfo?.jobTitle || '').toLowerCase()
  const titleWords = jobTitle.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w))
  const titleMatches = titleWords.filter(w => cvTitle.includes(w) || cvNorm.includes(w))
  const titleScore = titleWords.length ? Math.round((titleMatches.length / titleWords.length) * 100) : 50

  const yearsRequired = extractYearsRequired(jobDescription)
  const yearsCandidate = estimateCandidateYears(cvData)
  let experienceScore = 70
  if (yearsRequired !== null) {
    if (yearsCandidate >= yearsRequired) experienceScore = 100
    else if (yearsCandidate >= yearsRequired * 0.7) experienceScore = 70
    else if (yearsCandidate >= yearsRequired * 0.5) experienceScore = 50
    else experienceScore = 30
  }

  const degreeKeywords = ['degree', 'diploma', 'certificate', 'bachelor', 'honours', 'masters', 'phd', 'bcom', 'bsc', 'beng', 'btech', 'matric', 'grade 12', 'nqf']
  const jobNeedsQual = degreeKeywords.some(d => jobNorm.includes(d))
  const cvHasQual = cvData.education?.some(e => e.degree || e.institution)
  const educationScore = !jobNeedsQual ? 80 : cvHasQual ? 90 : 30

  const jobKeywords = extractKeywordsFromJob(jobDescription)
  const matchedKeywords = jobKeywords.filter(k => cvNorm.includes(k))
  const missingKeywords = jobKeywords.filter(k => !cvNorm.includes(k)).slice(0, 10)

  const overallScore = Math.round(
    skillsScore * 0.35 +
    titleScore * 0.15 +
    experienceScore * 0.25 +
    educationScore * 0.15 +
    (matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 100 * 0.10,
  )

  const verdict: JobMatchResult['verdict'] =
    overallScore >= 75 ? 'Strong Match' :
    overallScore >= 55 ? 'Good Match' :
    overallScore >= 35 ? 'Partial Match' : 'Weak Match'

  const tips: string[] = []
  if (missingSkills.length) tips.push(`Surface these focus areas on your CV if they apply: ${missingSkills.slice(0, 4).join(', ')}`)
  if (yearsRequired && yearsCandidate < yearsRequired) tips.push(`Job asks for ${yearsRequired} years — highlight all relevant experience with dates`)
  if (!cvHasQual && jobNeedsQual) tips.push('Add your qualifications — this role expects a formal credential')
  if (missingKeywords.length) tips.push(`Consider these recurring terms from the posting: ${missingKeywords.slice(0, 4).join(', ')}`)
  if (!(cvData.summary)) tips.push('Add a short professional summary aimed at this type of role')

  return {
    overallScore,
    skillsScore,
    titleScore,
    experienceScore,
    educationScore,
    matchedSkills: matchedSkills.slice(0, 10),
    missingSkills,
    matchedKeywords: matchedKeywords.slice(0, 10),
    missingKeywords,
    yearsRequired,
    yearsCandidate,
    verdict,
    tips,
  }
}

export function getSectionKey(section: string): string {
  return section.includes('-') ? section.split('-')[0]! : section
}

export function isValidAtsSectionKey(key: string): key is AtsSectionKey {
  return (ATS_SECTION_KEYS as readonly string[]).includes(key)
}

export function atsSectionTitle(key: AtsSectionKey): string {
  const titles: Record<AtsSectionKey, string> = {
    personal: 'Personal details',
    summary: 'Professional summary',
    experience: 'Work experience',
    education: 'Education',
    skills: 'Skills',
  }
  return titles[key]
}

export function aggregateAtsFeedback(scores: ATSScore): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of ATS_SECTION_KEYS) {
    for (const f of scores.sections[k]?.feedback ?? []) {
      if (!seen.has(f)) {
        seen.add(f)
        out.push(f)
      }
    }
  }
  return out.slice(0, 12)
}

function calculatePersonalScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100
  const p = cvData.personalInfo
  if (!p) {
    return { score: 0, feedback: ['Missing personal information'], suggestions: ['Add your contact details'] }
  }
  if (!p.fullName) { feedback.push('Missing full name'); score -= 20 }
  if (!p.jobTitle) { feedback.push('Missing job title'); score -= 20 }
  if (!p.email) { feedback.push('Missing email'); score -= 20 }
  if (!p.phone) { feedback.push('Missing phone number'); score -= 20 }
  if (!p.location) { feedback.push('Missing location'); score -= 20 }
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateSummaryScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100
  if (!cvData.summary) { return { score: 0, feedback: ['Missing professional summary'], suggestions: ['Add a professional summary'] } }
  const wc = cvData.summary.split(/\s+/).length
  if (wc < 30) { feedback.push('Summary too short'); score -= 50 }
  if (!/\d+/.test(cvData.summary)) { feedback.push('No quantifiable achievements'); score -= 30 }
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateExperienceScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100
  if (!cvData.experience?.length) return { score: 0, feedback: ['No work experience'], suggestions: ['Add work experience'] }
  cvData.experience.forEach(exp => {
    if (!exp.description) { feedback.push('Missing job description'); score -= 20 }
    if (!exp.startDate) { feedback.push('Missing dates'); score -= 10 }
  })
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateEducationScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100
  if (!cvData.education?.length) return { score: 0, feedback: ['No education listed'], suggestions: ['Add education'] }
  cvData.education.forEach(edu => {
    if (!edu.degree) { feedback.push('Missing degree'); score -= 20 }
    if (!edu.institution) { feedback.push('Missing institution'); score -= 20 }
  })
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateSkillsScore(cvData: CVData): SectionScore {
  const feedback: string[] = []
  const suggestions: string[] = []
  let score = 100
  const s = typeof cvData.skills === 'string' ? cvData.skills : ''
  if (!s.trim()) return { score: 0, feedback: ['No skills listed'], suggestions: ['Add skills'] }
  const list = s.split(/,|\n/).filter(x => x.trim())
  if (list.length < 5) { feedback.push('Less than 5 skills listed'); score -= 50 }
  return { score: Math.max(0, score), feedback, suggestions }
}

export function calculateATSScores(cvData: CVData): ATSScore {
  const personal = calculatePersonalScore(cvData)
  const summary = calculateSummaryScore(cvData)
  const experience = calculateExperienceScore(cvData)
  const education = calculateEducationScore(cvData)
  const skills = calculateSkillsScore(cvData)
  return {
    overallScore: Math.round(
      personal.score * 0.15 + summary.score * 0.2 + experience.score * 0.3 + education.score * 0.15 + skills.score * 0.2,
    ),
    sections: { personal, summary, experience, education, skills },
  }
}

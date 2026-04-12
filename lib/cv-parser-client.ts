/**
 * Browser-safe CV parser — no Node.js / server deps.
 * Text extraction is done by the caller (FileReader + mammoth).
 * This module only converts a plain-text string into structured CVData.
 */
import type { CVData, PersonalInfo, Experience, Education, Skill } from '@/types/cv-types'

export interface CVParseResult {
  success: boolean
  data?: CVData
  rawText?: string
  error?: string
  confidence: number
}

// ─── Public entry point ──────────────────────────────────────────────────────

export function parseTextToCV(text: string): CVParseResult {
  try {
    const personalInfo = extractPersonalInfo(text)
    const summary      = extractSummary(text)
    const experience   = extractExperience(text)
    const education    = extractEducation(text)
    const skills       = extractSkills(text)

    const cvData: CVData = {
      personalInfo,
      summary,
      experience,
      education,
      skills,
    }

    const confidence = calculateConfidence(cvData)

    return { success: true, data: cvData, rawText: text, confidence }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      confidence: 0,
    }
  }
}

// ─── Personal info ────────────────────────────────────────────────────────────

function extractPersonalInfo(text: string): PersonalInfo {
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ')
  const lines = cleanText.split('\n').filter(l => l.trim())
  const firstLine = lines[0] || ''

  let fullName = ''

  const nameMatch1 = firstLine.match(/^([^|@\d\n\r]+?)(?:\s*\||\s*@|\s*\d|$)/)
  if (nameMatch1 && nameMatch1[1].trim().length > 2) fullName = nameMatch1[1].trim()

  if (!fullName) {
    const nameMatch2 = firstLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/)
    if (nameMatch2) fullName = nameMatch2[1].trim()
  }

  if (!fullName) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim()
      const m =
        line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/) ||
        line.match(/^([A-Z][A-Z]+\s+[A-Z][a-z]+)/) ||
        line.match(/^([A-Z][a-z]+\s+[A-Z][A-Z]+)/)
      if (m && m[1].length > 3) { fullName = m[1].trim(); break }
    }
  }

  // Job title
  let jobTitle = ''
  const summaryMatch = cleanText.match(/(?:professional\s+summary|profile|summary)[\s:]*\n+([^\n]+)/i)
  if (summaryMatch && summaryMatch[1].length < 100) jobTitle = summaryMatch[1].trim()

  if (!jobTitle) {
    for (let i = 1; i < Math.min(8, lines.length); i++) {
      const line = lines[i].trim()
      if (
        line.includes('@') || line.includes('|') ||
        line.match(/\(\d{3}\)/) ||
        line.match(/\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/i) ||
        line.match(/^\d+\s/) ||
        (line.includes(',') && line.match(/\d{5}/))
      ) continue

      if (
        (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/) ||
          line.match(/Manager|Director|Engineer|Developer|Analyst|Coordinator|Specialist|Assistant|Executive|Officer|Consultant|Administrator|Supervisor|Lead|Senior|Junior/i)) &&
        line.length < 60 && line.length > 5 &&
        !line.match(/\d{4}/) &&
        !line.match(/Profile|Summary|Experience|Education|Skills|Contact/i)
      ) { jobTitle = line; break }
    }
  }

  if (!jobTitle) {
    const m =
      cleanText.match(/(?:^|\n)([^|\n\r]+?)\s*\|\s*[^|\n\r]+(?:\s*–|\s*to|\s*-)/im) ||
      cleanText.match(/(?:job title|position|role)[\s:]*([^\n]+)/i)
    if (m) jobTitle = m[1].trim()
  }

  const emailMatch = cleanText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  const email = emailMatch ? emailMatch[1].trim() : ''

  const usPhoneMatch = cleanText.match(/\((\d{3})\)\s*(\d{3})-(\d{4})/)
  const phoneMatch =
    !usPhoneMatch &&
    (cleanText.match(/(?:^|\s)(?:\+\d{1,3}|0)?[\s.-]?(\d{1,3})[\s.-]?(\d{3})[\s.-]?(\d{4})(?:\s|$)/) ||
      cleanText.match(/(?:phone|tel|mobile|cell)[\s:]*([+\d\s.-]{7,})/i))

  let phone = ''
  if (usPhoneMatch) {
    phone = `(${usPhoneMatch[1]}) ${usPhoneMatch[2]}-${usPhoneMatch[3]}`
  } else if (phoneMatch) {
    if (phoneMatch[1] && phoneMatch[2] && phoneMatch[3]) {
      phone = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`
    } else if (phoneMatch[1]) {
      phone = phoneMatch[1].trim()
    }
  }

  let location = ''
  const locationPatterns = [
    /(\d+\s+[^|\n\r]+?(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)[^|\n\r]*?,\s*[^|\n\r]+?,\s*[A-Z]{2}\s*\d{5})/im,
    /(\d+\s+[^|\n\r]+?(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)[^|\n\r]*?,\s*[^|\n\r]+?,\s*[A-Z]{2})/im,
    /(\d+\s+[^|\n\r]+?(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr))/im,
    /([A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5})/,
    /([A-Z][a-z]+,\s*[A-Z]{2})/,
    /(?:address|location)[\s:]*([^\n]+)/i,
  ]
  for (const pattern of locationPatterns) {
    const m = cleanText.match(pattern)
    if (m?.[1]) {
      const loc = m[1].trim()
      if (!loc.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+$/) || loc.includes(',') || loc.match(/\d/)) {
        location = loc; break
      }
    }
  }

  return { fullName, jobTitle, email, phone, location }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function extractSummary(text: string): string {
  const profilePatterns = [
    /(?:profile|summary|professional\s+summary|objective|about\s+me)[:.\s]*\n+([^]*?)(?=\n\s*(?:experience|education|skills|activities|interests|work|employment):)/i,
    /PROFESSIONAL\s+SUMMARY\s*\n+([^]*?)(?=\n\s*(?:EXPERIENCE|EDUCATION|SKILLS|WORK|EMPLOYMENT):)/i,
    /(?:profile|summary|professional\s+summary|objective|about\s+me)[:.\s]*\n+([^]*?)(?=\n\s*\n\s*[A-Z][A-Z\s]+\s*\n)/i,
    /(?:profile|summary|professional\s+summary|objective|about\s+me)[:.\s]*\n+([^]*?)(?=\n\s*\n)/i,
  ]

  for (const pattern of profilePatterns) {
    const m = text.match(pattern)
    if (m?.[1]?.trim()) {
      return m[1].trim().replace(/^\s*[-•*]\s*/gm, '').replace(/\n+/g, ' ')
    }
  }

  const lines = text.split('\n')
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim()
    if (
      line.length > 50 && !line.includes('|') && !line.includes('@') &&
      !line.match(/^\d/) && !line.match(/^(education|experience|skills|work|employment)/i)
    ) return line
  }

  const firstThird = lines.slice(0, Math.floor(lines.length / 3))
  for (const line of firstThird) {
    if (line.length > 80) return line
  }

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    if (lines[i].trim().length > 30 && lines[i + 1]?.trim().length > 30) {
      const combined = lines.slice(i, i + 3).join(' ').trim()
      if (combined.length > 60) return combined
    }
  }

  return ''
}

// ─── Experience ───────────────────────────────────────────────────────────────

function extractExperience(text: string): Experience[] {
  const experiences: Experience[] = []
  const saSectionPatterns = [
    /EXPERIENCE|WORK|EMPLOYMENT|CAREER|PROFESSIONAL EXP/i,
    /^.{0,1000}EXPERIENCE/i,
  ]

  let experienceText = ''
  let maxScore = 0

  for (const pattern of saSectionPatterns) {
    const m = text.match(pattern)
    if (m) {
      const score = m[0].toUpperCase().includes('WORK EXPERIENCE') ? 3
        : m[0].toUpperCase().includes('EXPERIENCE') ? 2 : 1
      if (score > maxScore) {
        maxScore = score
        experienceText = text.slice(m.index ?? 0 + m[0].length).split(/\n{2,}/)[0] || ''
      }
    }
  }

  if (!experienceText) return []

  const lines = experienceText.split('\n').map(l => l.trim()).filter(l => l)
  let state = 'HEADER'
  let currentJob: Partial<Experience> = {}
  const dateParser = createSADateParser()

  for (const line of lines) {
    switch (state) {
      case 'HEADER':
        if (isJobTitle(line)) { currentJob.title = line; state = 'JOB_TITLE' }
        break
      case 'JOB_TITLE':
        if (isCompany(line) || isDate(line)) { currentJob.company = line; state = 'DETAILS' }
        else if (isDescription(line)) { currentJob.description = line; state = 'DESCRIPTION' }
        break
      case 'DETAILS': {
        const dates = dateParser(line)
        if (dates) { currentJob.startDate = dates.start; currentJob.endDate = dates.end || 'Present'; state = 'DESCRIPTION' }
        else if (isLocation(line)) currentJob.location = line
        break
      }
      case 'DESCRIPTION':
        if (isNewJob(line) || line.length < 3) {
          if (currentJob.title && currentJob.company) experiences.push(currentJob as Experience)
          currentJob = { title: line }; state = 'JOB_TITLE'
        } else {
          currentJob.description = (currentJob.description ? currentJob.description + '\n' : '') + line
        }
        break
    }
  }

  if (currentJob.title && currentJob.company) experiences.push(currentJob as Experience)
  return experiences
}

function isJobTitle(line: string): boolean {
  return ['Developer','Manager','Analyst','Engineer','Consultant','Specialist'].some(kw => line.includes(kw)) &&
    !line.match(/\d{4}/) && line.length > 5
}
function isCompany(line: string): boolean { return !line.match(/^\d/) && !line.includes('|') && line.length > 3 }
function isDate(line: string): boolean { return /\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(line) }
function isLocation(line: string): boolean {
  return !!(line.match(/, [A-Z]{2}$/) || line.match(/(Cape|Durban|Joburg|Pretoria|Gauteng)/i))
}
function isDescription(line: string): boolean {
  return line.startsWith('•') || line.startsWith('-') || line.includes('responsible for')
}
function isNewJob(line: string): boolean {
  return isJobTitle(line) || !!line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:at|with)/)
}

function createSADateParser() {
  const patterns = [
    /(\w{3,})\s+20(XX|\d{2})\s*(?:–|-|to)\s*(\w{3,})/i,
    /(\w{3,})\s+20\d{2}/i,
    /20\d{2}\s*(?:–|-|to)\s*20\d{2}|Present/i,
  ]
  return (line: string) => {
    for (const pattern of patterns) {
      const m = line.match(pattern)
      if (m) return { start: m[1] || m[0], end: m[3] || m[2] || 'Present' }
    }
    return null
  }
}

// ─── Education ────────────────────────────────────────────────────────────────

function extractEducation(text: string): Education[] {
  const education: Education[] = []

  const sectionPatterns = [
    /(?:education|academic|qualifications|academics|academic background)[:.\s]*\n([^]*?)(?=\n\s*(?:skills|activities|interests|experience|projects|work):)/is,
    /EDUCATION\s*\n([^]*?)(?=\n\s*(?:SKILLS|ACTIVITIES|INTERESTS|EXPERIENCE|PROJECTS|WORK))/is,
    /QUALIFICATIONS\s*\n([^]*?)(?=\n\s*(?:SKILLS|ACTIVITIES|INTERESTS|EXPERIENCE|PROJECTS|WORK))/is,
    /(?:education|academic|qualifications)[:.\s]*\n([^]*?)(?=\n\s*\n\s*[A-Z][A-Z\s]+\s*\n)/is,
    /(?:education|academic|qualifications|academics|academic background)[:.\s]*\n([^]*?)$/is,
    /EDUCATION\s*\n([^]*?)$/is,
  ]

  let educationText = ''
  for (const pattern of sectionPatterns) {
    const m = text.match(pattern)
    if (m?.[1]?.trim()) { educationText = m[1].trim(); break }
  }

  if (!educationText) return []

  // Format 1: pipe-separated lines
  for (const line of educationText.split('\n')) {
    const t = line.trim()
    if (!t || !t.includes('|')) continue
    const parts = t.split('|').map(p => p.trim()).filter(p => p.length > 0)
    if (parts.length >= 2) {
      const datePattern = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2}(?:XX|\d{2})|\d{4})/i
      let location = '', graduationDate = ''
      for (const part of parts.slice(2)) {
        if (datePattern.test(part)) { const dm = part.match(datePattern); if (dm) graduationDate = dm[0] }
        else if (part.length > 2 && !part.match(/^\d+$/)) location = part
      }
      if (parts[0].length > 1 && parts[1].length > 1) {
        education.push({ degree: parts[0], institution: parts[1], location, graduationDate })
      }
    }
  }

  if (education.length > 0) return education

  // Format 2: degree/institution on separate lines
  const lines2 = educationText.split('\n')
  let currentEdu: Partial<Education> | null = null
  const dateRe = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}/i

  for (const line of lines2) {
    const l = line.trim()
    if (!l) continue
    const degreeM = l.match(/^((?:Bachelor|Master|Doctor|Ph\.?D|B\.?S|M\.?S|B\.?A|M\.?A|M\.?B\.?A|Associate|Diploma|Certificate|Matric|National Senior Certificate)[^,]*)/i)
    const dateM = l.match(dateRe)
    const instM = l.match(/^(?:at|from)?\s*([A-Z][A-Za-z0-9\s&.,]+)(?:\s*[-–—]\s*|\s*,\s*|\s+in\s+)([A-Za-z\s,]+)?$/)

    if (degreeM) {
      if (currentEdu?.degree && currentEdu.institution) education.push(currentEdu as Education)
      currentEdu = { degree: degreeM[1].trim(), institution: '', location: '', graduationDate: '' }
    } else if (instM && currentEdu) {
      currentEdu.institution = instM[1].trim()
      if (instM[2]) currentEdu.location = instM[2].trim()
    } else if (dateM && currentEdu) {
      currentEdu.graduationDate = dateM[0].trim()
    } else if (currentEdu?.degree && !currentEdu.institution) {
      currentEdu.institution = l
    }
  }
  if (currentEdu?.degree && currentEdu.institution) education.push(currentEdu as Education)

  return education
}

// ─── Skills ───────────────────────────────────────────────────────────────────

function extractSkills(text: string): Skill[] {
  const skillsPatterns = [
    /(?:skills|technical skills|competencies|expertise|key skills|core competencies)[:.\s]*\n([^]*?)(?=\n\s*(?:experience|education|activities|interests|projects|work|academic):)/is,
    /SKILLS\s*\n([^]*?)(?=\n\s*(?:EXPERIENCE|EDUCATION|WORK|EMPLOYMENT):)/is,
    /(?:skills|technical skills|competencies|expertise|key skills|core competencies)[:.\s]*\n([^]*?)(?=\n\s*\n\s*[A-Z][A-Z\s]+\s*\n)/is,
    /(?:skills|technical skills|competencies|expertise|key skills|core competencies|abilities)[:.\s]*\n([^]*?)$/is,
    /SKILLS(?:\s*&\s*ABILITIES)?[:.\s]*\n([^]*?)$/is,
  ]

  let skillsText = ''
  for (const pattern of skillsPatterns) {
    const m = text.match(pattern)
    if (m?.[1]?.trim()) { skillsText = m[1]; break }
  }

  const skillsArray: Skill[] = []

  if (skillsText) {
    const toSkill = (name: string) => ({ name, category: inferSkillCategory(name) })

    if (skillsText.includes(',')) {
      skillsText.replace(/\n/g, ', ').split(',')
        .map(s => s.trim()).filter(Boolean)
        .forEach(s => skillsArray.push(toSkill(s)))
    } else if (skillsText.includes('|')) {
      skillsText.split('|').map(s => s.trim()).filter(Boolean)
        .forEach(s => skillsArray.push(toSkill(s)))
    } else {
      skillsText.split('\n').map(l => l.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
        .forEach(s => skillsArray.push(toSkill(s)))
    }

    if (skillsArray.length > 0) return skillsArray
  }

  // Fallback: keyword scan
  const skillKeywords = [
    'JavaScript','TypeScript','Python','Java','C++','C#','PHP','Ruby','Go','Swift',
    'React','Angular','Vue','Node.js','Express','Django','Flask',
    'HTML','CSS','Tailwind','Bootstrap',
    'SQL','MySQL','PostgreSQL','MongoDB','Redis',
    'AWS','Azure','Google Cloud','Docker','Kubernetes',
    'Git','GitHub','Agile','Scrum','DevOps','CI/CD',
    'Machine Learning','Data Science','Analytics',
    'Project Management','Leadership','Communication',
    'Microsoft Office','Excel','Word','PowerPoint',
    'Customer Service','Sales','Marketing','Accounting','Finance',
    'Teamwork','Time Management','Budgeting','Scheduling','Negotiation',
  ]

  skillKeywords
    .filter(sk => text.toLowerCase().includes(sk.toLowerCase()))
    .forEach(sk => skillsArray.push({ name: sk, category: inferSkillCategory(sk) }))

  return skillsArray
}

function inferSkillCategory(skill: string): string {
  const s = skill.toLowerCase()
  if (/javascript|typescript|python|java|c\+\+|react|node|php|ruby|go|swift/.test(s)) return 'Programming'
  if (/excel|word|powerpoint|outlook|office/.test(s)) return 'Office'
  if (/photoshop|illustrator|figma|design/.test(s)) return 'Design'
  if (/sql|mysql|postgresql|mongodb|redis/.test(s)) return 'Database'
  if (/aws|azure|google cloud|docker|kubernetes|ci\/cd/.test(s)) return 'DevOps'
  return 'Other'
}

// ─── Confidence ───────────────────────────────────────────────────────────────

function calculateConfidence(cvData: CVData): number {
  let score = 0
  if (cvData.personalInfo.fullName) score += 15
  if (cvData.personalInfo.jobTitle) score += 10
  if (cvData.personalInfo.email) score += 10
  if (cvData.personalInfo.phone) score += 8
  if (cvData.personalInfo.location) score += 7
  if (cvData.summary) score += 12
  if (cvData.experience.length > 0) score += 15
  if (cvData.education.length > 0) score += 10
  const hasSkills = Array.isArray(cvData.skills) ? cvData.skills.length > 0 : !!cvData.skills?.trim()
  if (hasSkills) score += 8
  if (cvData.personalInfo.fullName && cvData.personalInfo.email && cvData.personalInfo.phone) score += 5
  if (cvData.experience.length >= 2) score += 5
  if (cvData.education.length >= 2) score += 3
  return Math.min(score, 100)
}

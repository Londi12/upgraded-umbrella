import type { CVData } from "@/types/cv-types"

export interface SimpleParseResult {
  success: boolean
  data?: CVData
  error?: string
}

export function parseSimpleCV(text: string): SimpleParseResult {
  try {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
    
    const personalInfo = {
      fullName: extractName(lines),
      jobTitle: extractJobTitle(lines),
      email: extractEmail(text),
      phone: extractPhone(text),
      location: extractLocation(text)
    }

    const summary = extractSummary(text)
    const experience = extractExperience(text)
    const education = extractEducation(text)
    const skills = extractSkills(text)

    return {
      success: true,
      data: {
        personalInfo,
        summary,
        experience,
        education,
        skills,
        projects: []
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse failed'
    }
  }
}

function extractName(lines: string[]): string {
  // Name is usually the first non-empty line
  const firstLine = lines[0] || ''
  
  // Remove common prefixes and clean up
  const cleaned = firstLine
    .replace(/^(CV|RESUME|CURRICULUM VITAE)\s*/i, '')
    .replace(/[|@\d]/g, ' ')
    .trim()
  
  // Check if it looks like a name (2+ words, proper case)
  if (cleaned.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/)) {
    return cleaned.split(/\s+/).slice(0, 3).join(' ')
  }
  
  return ''
}

function extractJobTitle(lines: string[]): string {
  // Look for job title in first few lines
  for (let i = 1; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    
    // Skip contact info lines
    if (line.includes('@') || line.match(/\d{3}/) || line.includes('|')) continue
    
    // Look for professional titles
    if (line.match(/\b(Manager|Director|Engineer|Developer|Analyst|Specialist|Coordinator|Assistant|Executive|Officer|Consultant|Administrator|Supervisor|Lead|Senior|Junior)\b/i)) {
      return line
    }
    
    // If it's a reasonable length and doesn't look like an address
    if (line.length > 5 && line.length < 60 && !line.match(/\d+.*\w+.*Street|Road|Ave/i)) {
      return line
    }
  }
  
  return ''
}

function extractEmail(text: string): string {
  const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  return match ? match[1] : ''
}

function extractPhone(text: string): string {
  const patterns = [
    /\((\d{3})\)\s*(\d{3})-(\d{4})/,
    /(\d{3})[-.\s](\d{3})[-.\s](\d{4})/,
    /\+?(\d{1,3})[-.\s]?(\d{2,3})[-.\s]?(\d{3,4})[-.\s]?(\d{4})/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0]
    }
  }
  
  return ''
}

function extractLocation(text: string): string {
  const patterns = [
    /([A-Z][a-z]+,\s*[A-Z]{2})/,
    /([A-Z][a-z]+,\s*[A-Z][a-z]+)/,
    /\d+\s+[^,\n]+,\s*[A-Z][a-z]+/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }
  
  return ''
}

function extractSummary(text: string): string {
  const patterns = [
    /(?:SUMMARY|PROFILE|OBJECTIVE|ABOUT)[\s:]*\n+([^]*?)(?=\n\s*(?:EXPERIENCE|EDUCATION|SKILLS|WORK))/i,
    /(?:summary|profile|objective|about)[\s:]*\n+([^]*?)(?=\n\s*(?:experience|education|skills|work))/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim().replace(/\n+/g, ' ').substring(0, 500)
    }
  }
  
  return ''
}

function extractExperience(text: string): any[] {
  const experience = []
  const patterns = [
    /(?:EXPERIENCE|WORK|EMPLOYMENT)[\s:]*\n+([^]*?)(?=\n\s*(?:EDUCATION|SKILLS))/i,
    /(?:experience|work|employment)[\s:]*\n+([^]*?)(?=\n\s*(?:education|skills))/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const expText = match[1]
      
      // Look for pipe-separated entries
      const entries = expText.match(/([^|\n]+)\s*\|\s*([^|\n]+)(?:\s*\|\s*([^|\n]+))?/g)
      
      if (entries) {
        for (const entry of entries) {
          const parts = entry.split('|').map(p => p.trim())
          if (parts.length >= 2) {
            experience.push({
              title: parts[0],
              company: parts[1],
              startDate: '',
              endDate: parts[2] || '',
              description: '',
              location: ''
            })
          }
        }
      }
      break
    }
  }
  
  return experience.length > 0 ? experience : [{
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
    location: ''
  }]
}

function extractEducation(text: string): any[] {
  const education = []
  const patterns = [
    /(?:EDUCATION|ACADEMIC)[\s:]*\n+([^]*?)(?=\n\s*(?:SKILLS|EXPERIENCE))/i,
    /(?:education|academic)[\s:]*\n+([^]*?)(?=\n\s*(?:skills|experience))/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const eduText = match[1]
      
      // Look for pipe-separated entries
      const entries = eduText.match(/([^|\n]+)\s*\|\s*([^|\n]+)(?:\s*\|\s*([^|\n]+))?/g)
      
      if (entries) {
        for (const entry of entries) {
          const parts = entry.split('|').map(p => p.trim())
          if (parts.length >= 2) {
            education.push({
              degree: parts[0],
              institution: parts[1],
              graduationDate: parts[2] || '',
              location: ''
            })
          }
        }
      }
      break
    }
  }
  
  return education.length > 0 ? education : [{
    degree: '',
    institution: '',
    graduationDate: '',
    location: ''
  }]
}

function extractSkills(text: string): string {
  const patterns = [
    /(?:SKILLS|COMPETENCIES)[\s:]*\n+([^]*?)(?=\n\s*$|\n\s*[A-Z]{3,})/i,
    /(?:skills|competencies)[\s:]*\n+([^]*?)(?=\n\s*$|\n\s*[a-z]{3,})/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1]
        .replace(/\n/g, ', ')
        .replace(/[•\-*]/g, '')
        .replace(/,\s*,/g, ',')
        .trim()
    }
  }
  
  // Fallback: look for common skills
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
    'Excel', 'Word', 'PowerPoint', 'Communication', 'Leadership', 'Management',
    'Analysis', 'Problem Solving', 'Teamwork', 'Project Management'
  ]
  
  const foundSkills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  )
  
  return foundSkills.join(', ')
}
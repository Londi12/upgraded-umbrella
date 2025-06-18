import { CVData, PersonalInfo, Experience, Education } from '@/types/cv-types';
import mammoth from 'mammoth';
import { fileTypeFromBuffer } from 'file-type';

if (typeof window === 'undefined') {
  // Polyfill DOMMatrix for Node.js environment to fix pdfjs-dist error
  // Minimal functional polyfill for DOMMatrix
  class DOMMatrixPolyfill {
    constructor() {
      // Minimal properties to satisfy pdfjs-dist
      this.isIdentity = true;
    }
    multiply() {
      return this;
    }
    invertSelf() {
      return this;
    }
    translate() {
      return this;
    }
    scale() {
      return this;
    }
    rotate() {
      return this;
    }
  }
  global.DOMMatrix = global.DOMMatrix || DOMMatrixPolyfill;
}


import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure PDF.js worker for server-side usage
if (typeof window === 'undefined') {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;
}


/**
 * Type declarations for third-party modules are defined in lib/custom-types.d.ts
 */

/**
 * Supported file types for CV parsing
 */
export enum CVFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  UNKNOWN = 'unknown'
}

// Ensure the enum is properly exported
if (typeof CVFileType === 'undefined') {
  // Fallback in case of enum issues
  (window as any).CVFileType = {
    PDF: 'pdf',
    DOCX: 'docx',
    TXT: 'txt',
    UNKNOWN: 'unknown'
  };
}

/**
 * Result of the CV parsing operation
 */
export interface CVParseResult {
  success: boolean;
  data?: CVData;
  rawText?: string;
  error?: string;
  confidence: number; // 0-100 indicating confidence in the parsing accuracy
}

/**
 * Detects the type of file from the buffer
 */
export async function detectFileType(buffer: Buffer): Promise<CVFileType> {
  try {
    // First check if it's a text file by content
    const isText = isTextFile(buffer);
    if (isText) {
      return CVFileType.TXT; // Directly return enum value
    }
    
    const type = await fileTypeFromBuffer(buffer);
    
    if (!type) {
      // If fileType can't detect it and it's not text, log details and return unknown
      console.warn('Failed to detect file type using fileTypeFromBuffer:', buffer.slice(0, 10).toString('hex'));
      return CVFileType.UNKNOWN; // Directly return enum value
    }
    
    switch (type.mime) {
      case 'application/pdf':
        return CVFileType.PDF; // Directly return enum value
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return CVFileType.DOCX; // Directly return enum value
      default:
        console.warn('Unsupported file type detected:', type.mime);
        return CVFileType.UNKNOWN; // Directly return enum value
    }
  } catch (error) {
    console.error('Error detecting file type:', error);
    // If there's an error, try to check if it's text as fallback and log the error
    console.error('Fallback to text check:', error);
    const isText = isTextFile(buffer);
    return isText ? CVFileType.TXT : CVFileType.UNKNOWN; // Directly return enum value
  }
}

/**
 * Simple check to determine if a buffer might be a text file
 */
function isTextFile(buffer: Buffer): boolean {
  // Check if the buffer contains mostly printable ASCII characters
  let printableCount = 0;
  let totalCount = Math.min(buffer.length, 1000);
  
  for (let i = 0; i < totalCount; i++) {
    const byte = buffer[i];
    // Allow printable ASCII (32-126), newlines (10), carriage returns (13), tabs (9)
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      printableCount++;
    } else if (byte === 0) {
      // Null bytes indicate binary file
      return false;
    }
  }
  
  // If more than 80% of characters are printable, consider it text
  return (printableCount / totalCount) > 0.8;
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(buffer);
    
    // Convert Uint8Array to ArrayBuffer
    const arrayBuffer = uint8Array.buffer;

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    
    // Iterate through each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      return ''; // Return empty string instead of throwing
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return ''; // Return empty string on error
  }
}

/**
 * Extract text from a DOCX file
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value || !result.value.trim()) {
      throw new Error('No text extracted from DOCX');
    }
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Extract text from a text file
 */
export function extractTextFromTXT(buffer: Buffer): string {
  try {
    const text = buffer.toString('utf-8');
    if (!text.trim()) {
      throw new Error('No text extracted from TXT');
    }
    return text;
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    throw new Error('Failed to extract text from TXT');
  }
}

/**
 * Extract text from a file based on its type
 */
export async function extractTextFromFile(buffer: Buffer, fileType: CVFileType): Promise<string> {
  switch (fileType) {
    case CVFileType.PDF:
      return extractTextFromPDF(buffer);
    case CVFileType.DOCX:
      return extractTextFromDOCX(buffer);
    case CVFileType.TXT:
      return extractTextFromTXT(buffer);
    default:
      throw new Error('Unsupported file type');
  }
}

/**
 * Parse extracted text into a structured CV data object
 */
export function parseTextToCV(text: string): CVParseResult {
  try {
    // Don't normalize the text too aggressively - preserve line breaks for section parsing
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Initialize the CV data structure
    const cvData: CVData = {
      personalInfo: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: ''
    };
    
    try {
      // Extract personal information
      const personalInfo = extractPersonalInfo(cleanText);
      if (personalInfo) {
        cvData.personalInfo = personalInfo;
      }

      // Extract summary/objective
      const summary = extractSummary(cleanText);
      if (summary) {
        cvData.summary = summary;
      }

      // Extract experience
      const experience = extractExperience(cleanText);
      if (Array.isArray(experience)) {
        cvData.experience = experience;
      }

      // Extract education
      const education = extractEducation(cleanText);
      if (Array.isArray(education)) {
        cvData.education = education;
      }

      // Extract skills (always as comma-separated string)
      const extractedSkills = extractSkills(cleanText);
      if (Array.isArray(extractedSkills)) {
        cvData.skills = extractedSkills.map(s => s?.name || '').filter(Boolean).join(', ');
      } else if (typeof extractedSkills === 'string') {
        cvData.skills = extractedSkills;
      }
    } catch (extractionError) {
      console.error('Error during extraction process:', extractionError);
      // Continue with default values if extraction fails
    }
    // Ensure all fields are present and in correct format
    if (!cvData.personalInfo) {
      cvData.personalInfo = { fullName: '', jobTitle: '', email: '', phone: '', location: '' };
    }
    if (!cvData.summary) cvData.summary = '';
    if (!Array.isArray(cvData.experience)) cvData.experience = [];
    if (!Array.isArray(cvData.education)) cvData.education = [];
    if (typeof cvData.skills !== 'string') cvData.skills = '';
    // Calculate confidence score based on how much information was extracted
    const confidence = calculateConfidence(cvData);
    
    return {
      success: true,
      data: cvData,
      rawText: text,
      confidence
    };
  } catch (error) {
    console.error('Error parsing CV text:', error);
    return {
      success: false,
      rawText: text,
      error: 'Failed to parse CV text',
      confidence: 0
    };
  }
}

/**
 * Extract personal information from the CV text
 */
function extractPersonalInfo(text: string): PersonalInfo {
  const personalInfo: PersonalInfo = {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: ''
  };
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    personalInfo.email = emailMatch[0];
  }
  
  // Extract phone number (various formats)
  const phoneRegex = /(\+?1?\s*\(?[\d\s()-]{10,})/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    personalInfo.phone = phoneMatch[0].trim();
  }
  
  // Extract name (usually the first line)
  if (lines.length > 0) {
    const firstLine = lines[0];
    // Check if the first line looks like a name (letters, spaces, common name characters)
    if (firstLine.length < 50 && /^[A-Za-z\s.'-]+$/.test(firstLine) && 
        !firstLine.includes('@') && !phoneRegex.test(firstLine)) {
      personalInfo.fullName = firstLine;
    }
  }
  
  // Extract job title (usually the second line, before contact info)
  if (lines.length > 1) {
    for (let i = 1; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      // Skip lines with email or phone
      if (line.includes('@') || phoneRegex.test(line)) continue;
      
      // Check if it looks like a job title
      if (line.length > 5 && line.length < 80 && 
          /^[A-Za-z\s,&.-]+$/.test(line) &&
          !line.toUpperCase().includes('SUMMARY') &&
          !line.toUpperCase().includes('EXPERIENCE') &&
          !line.toUpperCase().includes('EDUCATION') &&
          !line.toUpperCase().includes('SKILLS')) {
        personalInfo.jobTitle = line;
        break;
      }
    }
  }
  
  // Extract location (look for city, state patterns)
  const locationPatterns = [
    /([A-Za-z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/g, // City, ST or City, ST 12345
    /([A-Za-z\s]+,\s*[A-Za-z\s]+)/g // City, State
  ];
  
  for (const pattern of locationPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Find the most likely location (not in email addresses)
      for (const match of matches) {
        if (!match.includes('@') && match.length < 50) {
          personalInfo.location = match.trim();
          break;
        }
      }
      if (personalInfo.location) break;
    }
  }
  
  return personalInfo;
}

/**
 * Extract summary/objective from the CV text
 */
function extractSummary(text: string): string {
  const summaryPatterns = [
    /(?:PROFESSIONAL SUMMARY|SUMMARY|PROFILE|OBJECTIVE|ABOUT ME)\s*\n([^]*?)(?=\n(?:WORK EXPERIENCE|EXPERIENCE|EDUCATION|SKILLS|[A-Z]{2,}))/i,
    /(?:Professional Summary|Summary|Profile|Objective|About Me)(?::|.)\s*([^]*?)(?=\n\n|\n[A-Z]{2,})/i
  ];
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

/**
 * Extract experience entries from the CV text
 */
function extractExperience(text: string): Experience[] {
  const experiences: Experience[] = [];
  
  // Look for experience section with more flexible patterns
  const experienceSectionPatterns = [
    /(?:WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT HISTORY|PROFESSIONAL EXPERIENCE)\s*\n([\s\S]*?)(?=\n(?:EDUCATION|SKILLS|QUALIFICATIONS|[A-Z]{2,}\s*(?:\n|$))|$)/i,
    /(?:EMPLOYMENT HISTORY|WORK HISTORY)\s*\n([\s\S]*?)(?=\n(?:EDUCATION|SKILLS|[A-Z]{2,}\s*(?:\n|$))|$)/i
  ];
  
  let experienceText = '';
  for (const pattern of experienceSectionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      experienceText = match[1];
      break;
    }
  }
  
  if (experienceText) {
    const lines = experienceText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for job title patterns first
    const jobTitlePatterns = [
      /(?:Senior|Junior|Lead|Principal)?\s*(?:Software|Web|Full Stack|Frontend|Backend)?\s*(?:Engineer|Developer|Programmer)/i,
      /(?:Senior|Junior|Lead|Principal)?\s*(?:Teacher|Manager|Analyst|Director|Coordinator|Assistant|Specialist|Consultant)/i,
      /(?:Senior|Junior|Lead|Principal)?\s*(?:Data|Business|Financial|Marketing|Product|Project)\s*(?:Analyst|Manager|Specialist)/i
    ];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Check if this line looks like a job title
      const isJobTitle = jobTitlePatterns.some(pattern => pattern.test(line)) && 
                        line.length < 100 && 
                        !line.includes('@') && 
                        !line.match(/\d{4}/); // Avoid lines with years
      
      if (isJobTitle) {
        const experience: Experience = {
          title: line,
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: ''
        };
        
        // Look for company/location in the next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.includes('-') && !nextLine.match(/\d{4}/)) {
            // Format: "Company Name - Location"
            const parts = nextLine.split('-').map(p => p.trim());
            if (parts.length >= 2) {
              experience.company = parts[0];
              experience.location = parts[1];
            } else {
              experience.company = nextLine;
            }
            i++; // Skip the company line
          } else if (nextLine.includes(',')) {
            // Format: "Company Name, Location"
            const parts = nextLine.split(',').map(p => p.trim());
            experience.company = parts[0];
            if (parts.length > 1) {
              experience.location = parts.slice(1).join(', ');
            }
            i++; // Skip the company line
          }
        }
        
        // Look for date range in the next line
        if (i + 1 < lines.length) {
          const dateLine = lines[i + 1];
          const datePattern = /(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(?:January|February|March|April|May|June|July|August|September|October|November|December|Present|\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/i;
          const dateMatch = dateLine.match(datePattern);
          
          if (dateMatch) {
            const dates = dateMatch[0].split(/[-–]/);
            if (dates.length >= 2) {
              experience.startDate = dates[0].trim();
              experience.endDate = dates[1].trim();
            }
            i++; // Skip the date line
          }
        }
        
        // Collect description lines (bullet points and regular text)
        const descriptionLines = [];
        i++; // Move to next line after job title/company/date
        
        while (i < lines.length) {
          const descLine = lines[i];
          
          // Stop if we hit another job title (but not bullet points that start with job-related words)
          if (jobTitlePatterns.some(pattern => pattern.test(descLine)) && 
              descLine.length < 100 && 
              !descLine.includes('@') && 
              !descLine.match(/\d{4}/) &&
              !descLine.startsWith('•') && 
              !descLine.startsWith('-') && 
              !descLine.startsWith('*')) {
            break;
          }
          
          // Stop if we hit a section header
          if (descLine.match(/^[A-Z\s]{3,}$/) && descLine.length < 30) {
            break;
          }
          
          // Add description lines (especially bullet points and regular text)
          if (descLine.startsWith('•') || descLine.startsWith('-') || descLine.startsWith('*') || 
              (descLine.length > 10 && !descLine.includes('-') && !descLine.includes(',') && !descLine.includes('.'))) {
            descriptionLines.push(descLine);
          }
          
          i++;
        }
        
        experience.description = descriptionLines.join('\n');
        
        if (experience.title) {
          experiences.push(experience);
        }
        
        // Don't increment i here as we've already moved past this entry
        continue;
      }
      
      i++;
    }
  }
  
  return experiences;
}

/**
 * Extract education entries from the CV text
 */
function extractEducation(text: string): Education[] {
  const educationEntries: Education[] = [];
  
  // Look for education section
  const educationSectionRegex = /(?:EDUCATION|ACADEMIC BACKGROUND)\s*\n([\s\S]*?)(?=\n(?:SKILLS|EXPERIENCE|[A-Z]{2,}\s*(?:\n|$))|$)/i;
  const educationMatch = text.match(educationSectionRegex);
  
  if (educationMatch && educationMatch[1]) {
    const educationText = educationMatch[1];
    const lines = educationText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const education: Education = {
      degree: '',
      institution: '',
      location: '',
      graduationDate: ''
    };
    
    // Process all lines to extract education information
    for (const line of lines) {
      // Look for degree patterns
      if (!education.degree && line.match(/(?:Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Degree)\s+(?:of|in)\s+/i)) {
        education.degree = line;
        continue;
      }
      
      // Look for institution - location pattern
      const institutionMatch = line.match(/^([^-]+)\s*-\s*(.+)$/);
      if (institutionMatch && !education.institution) {
        education.institution = institutionMatch[1].trim();
        education.location = institutionMatch[2].trim();
        continue;
      }
      
      // Look for graduation date
      const gradMatch = line.match(/(?:Graduated|Completed|Finished):\s*(\w+\s+\d{4}|\d{4})/i);
      if (gradMatch && !education.graduationDate) {
        education.graduationDate = gradMatch[1];
        continue;
      }
      
      // Look for just a date
      const dateMatch = line.match(/(?:May|June|July|August|September|October|November|December|January|February|March|April)\s+\d{4}/i);
      if (dateMatch && !education.graduationDate) {
        education.graduationDate = dateMatch[0];
        continue;
      }
      
      // If we haven't found a degree yet, check if this could be one
      if (!education.degree && line.length > 10 && line.length < 100 && 
          !line.includes('@') && !line.match(/graduated|completed|finished/i)) {
        education.degree = line;
        continue;
      }
      
      // If we haven't found an institution yet, check if this could be one
      if (!education.institution && line.length > 5 && line.length < 100 && 
          !line.includes('@') && !line.match(/graduated|completed|finished/i) && 
          line !== education.degree) {
        education.institution = line;
      }
    }
    
    // Only add if we have meaningful information
    if (education.degree || education.institution) {
      educationEntries.push(education);
    }
  }
  
  return educationEntries;
}

/**
 * Extract skills from the CV text
 */
function extractSkills(text: string): { name: string; category?: string }[] {
  // Look for skills section with multiple patterns
  const skillsSectionPatterns = [
    /(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|KEY SKILLS)\s*\n([\s\S]*?)(?=\n(?:[A-Z]{2,}\s*(?:\n|$))|$)/i,
    /(?:Skills|Technical Skills|Core Competencies|Key Skills)(?::|.)\s*([\s\S]*?)(?=\n\n|\n[A-Z]{2,})/i
  ];
  
  let skillsText = '';
  for (const pattern of skillsSectionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      skillsText = match[1].trim();
      break;
    }
  }
  
  if (skillsText) {
    const skills: { name: string; category?: string }[] = [];
    
    // Handle paragraph-style skills (like in the screenshot)
    const lines = skillsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      // Check if line contains skill categories or descriptions
      if (line.includes(':')) {
        // Format: "Category: skill1, skill2, skill3"
        const [category, skillsStr] = line.split(':').map(s => s.trim());
        if (skillsStr) {
          const categorySkills = skillsStr
            .split(/[,;]+/)
            .map(skill => skill.trim())
            .filter(skill => skill.length > 2 && skill.length < 50)
            .map(skill => ({
              name: skill,
              category: category.toLowerCase().replace(/\s+/g, '')
            }));
          skills.push(...categorySkills);
        }
      } else if (line.length > 10 && line.length < 200) {
        // Handle descriptive skill lines
        const extractedSkills = extractSkillsFromDescription(line);
        skills.push(...extractedSkills);
      } else {
        // Handle simple comma-separated skills
        const simpleSkills = line
          .split(/[,•|\n;]+/)
          .map(skill => skill.trim())
          .filter(skill => skill.length > 2 && skill.length < 50)
          .map(skill => ({
            name: skill,
            category: inferSkillCategory(skill)
          }));
        skills.push(...simpleSkills);
      }
    }
    
    // Remove duplicates and return
    const uniqueSkills = skills.filter((skill, index, self) => 
      index === self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase())
    );
    
    return uniqueSkills.length > 0 ? uniqueSkills : [];
  }
  
  return [];
}

/**
 * Extract skills from descriptive text
 */
function extractSkillsFromDescription(description: string): { name: string; category?: string }[] {
  const skills: { name: string; category?: string }[] = [];
  
  // Common skill keywords to look for
  const skillKeywords = [
    // Technical skills
    'Microsoft Office', 'Word', 'Excel', 'PowerPoint', 'Outlook', 'OneNote',
    'Google Suite', 'Gmail', 'Drive', 'Sheets', 'Docs', 'Canva',
    'JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS', 'React', 'Node.js',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git',
    
    // Soft skills
    'Communication', 'Leadership', 'Management', 'Teamwork', 'Problem Solving',
    'Critical Thinking', 'Time Management', 'Organization', 'Adaptability',
    'Collaboration', 'Creativity', 'Innovation', 'Analytical',
    
    // Teaching/Education specific
    'Classroom Management', 'Lesson Planning', 'Curriculum Development',
    'Student Assessment', 'Parent Communication', 'Educational Technology',
    'Differentiated Instruction', 'Behavior Management',
    
    // Languages
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean'
  ];
  
  // Look for skill keywords in the description
  for (const keyword of skillKeywords) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(description)) {
      skills.push({
        name: keyword,
        category: inferSkillCategory(keyword)
      });
    }
  }
  
  // Also try to extract skills from parentheses (common format)
  const parenthesesMatch = description.match(/\(([^)]+)\)/g);
  if (parenthesesMatch) {
    for (const match of parenthesesMatch) {
      const content = match.slice(1, -1); // Remove parentheses
      const extractedSkills = content
        .split(/[,;]+/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 2 && skill.length < 30)
        .map(skill => ({
          name: skill,
          category: inferSkillCategory(skill)
        }));
      skills.push(...extractedSkills);
    }
  }
  
  return skills;
}

/**
 * Infer skill category based on common keywords
 */
function inferSkillCategory(skill: string): string {
  const categories = {
    technical: ['programming', 'software', 'database', 'framework', 'language', 'sql', 'python', 'java', 'javascript', 'react', 'node', 'aws', 'cloud', 'docker', 'kubernetes'],
    softSkills: ['communication', 'leadership', 'management', 'teamwork', 'collaboration', 'problem solving', 'analytical', 'organization'],
    tools: ['excel', 'word', 'powerpoint', 'photoshop', 'illustrator', 'figma', 'jira', 'git'],
    languages: ['english', 'spanish', 'french', 'german', 'chinese', 'japanese']
  };

  const skillLower = skill.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => skillLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

/**
 * Calculate confidence score based on how much information was extracted
 */
function calculateConfidence(cvData: CVData): number {
  let score = 0;
  const maxScore = 100;
  
  // Personal info (30%)
  if (cvData.personalInfo.fullName) score += 6;
  if (cvData.personalInfo.email) score += 6;
  if (cvData.personalInfo.phone) score += 6;
  if (cvData.personalInfo.jobTitle) score += 6;
  if (cvData.personalInfo.location) score += 6;
  
  // Summary (15%)
  if (cvData.summary && cvData.summary.length > 50) score += 15;
  
  // Experience (25%)
  if (cvData.experience.length > 0) {
    const expScore = Math.min(cvData.experience.length * 5, 25);
    score += expScore;
  }
  
  // Education (15%)
  if (cvData.education.length > 0) {
    const eduScore = Math.min(cvData.education.length * 7.5, 15);
    score += eduScore;
  }
  
  // Skills (15%)
  if (cvData.skills && cvData.skills.length > 0) score += 15;
  
  return Math.min(score, maxScore);
}

/**
 * Main function to parse a CV from a file buffer
 */
export async function parseCV(buffer: Buffer): Promise<CVParseResult> {
  try {
    // Detect file type
    const fileType = await detectFileType(buffer);
    
    if (fileType === CVFileType.UNKNOWN) {
      return {
        success: false,
        error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.',
        confidence: 0
      };
    }
    
    // Extract text from the file
    let text: string;
    try {
      text = await extractTextFromFile(buffer, fileType);
    } catch (extractErr: any) {
      if (extractErr.message && extractErr.message.includes('No text extracted')) {
        return {
          success: false,
          error: 'The uploaded file contains no readable text. Please check your file and try again.',
          confidence: 0
        };
      }
      throw extractErr;
    }
    if (!text || !text.trim()) {
      return {
        success: false,
        error: 'The uploaded file contains no readable text. Please check your file and try again.',
        confidence: 0
      };
    }
    // Parse the text into a structured CV
    return parseTextToCV(text);
  } catch (error) {
    console.error('CV parsing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    let errorMessage = 'Failed to parse CV. Please try a different file or enter details manually.';
    if (error instanceof Error) {
      if (error.message.includes('Invalid or empty PDF buffer') || error.message.includes('No text extracted from PDF')) {
        errorMessage = 'Invalid or unreadable PDF file. Please ensure the PDF contains text and try again, or convert to DOCX/TXT.';
      } else if (error.message.includes('Worker was destroyed') || error.message.includes('Worker error')) {
        errorMessage = 'PDF parsing failed due to a processing error. Please try a different PDF or convert to DOCX/TXT.';
      } else if (error.message.includes('No text extracted')) {
        errorMessage = 'The uploaded file contains no readable text. Please check your file and try again.';
      }
    }
    
    // 添加调试信息
    console.debug('Error message:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      confidence: 0
    };
  }
}

import { CVData, PersonalInfo, Experience, Education, Skill, Project } from '@/types/cv-types';
import mammoth from 'mammoth';
import { fileTypeFromBuffer } from 'file-type';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure PDF.js worker for server-side usage
if (typeof window === 'undefined') {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;
  
  // Polyfill DOMMatrix for Node.js environment
  class DOMMatrixPolyfill {
    constructor() {
      this.isIdentity = true;
    }
    multiply() { return this; }
    invertSelf() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
  }
  global.DOMMatrix = global.DOMMatrix || DOMMatrixPolyfill;
}

/**
 * Supported file types for CV parsing
 */
export enum CVFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  UNKNOWN = 'unknown'
}

export enum TemplateType {
  PROFESSIONAL = 'professional',
  MODERN = 'modern',
  CREATIVE = 'creative',
  SIMPLE = 'simple',
  EXECUTIVE = 'executive',
  TECHNICAL = 'technical',
  GRADUATE = 'graduate',
  DIGITAL = 'digital'
}

/**
 * Result of the CV parsing operation
 */
export interface CVParseResult {
  success: boolean;
  data?: CVData;
  rawText?: string;
  error?: string;
  confidence: number;
  ownTemplate?: boolean;
  templateType?: string;
}

/**
 * Detects the type of file from the buffer
 */
export async function detectFileType(buffer: Buffer): Promise<CVFileType> {
  try {
    const type = await fileTypeFromBuffer(buffer);
    
    if (!type) {
      return CVFileType.UNKNOWN;
    }
    
    switch (type.mime) {
      case 'application/pdf':
        return CVFileType.PDF;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return CVFileType.DOCX;
      default:
        return CVFileType.UNKNOWN;
    }
  } catch (error) {
    console.error('Error detecting file type:', error);
    return CVFileType.UNKNOWN;
  }
}

/**
 * Extract text from a PDF file using pdfjs-dist with better formatting
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Better text extraction with positioning
      const items = textContent.items as any[];
      let lastY = 0;
      let lineText = '';
      
      for (const item of items) {
        const y = item.transform[5]; // Y position
        
        // If Y position changes significantly, it's a new line
        if (Math.abs(y - lastY) > 5) {
          if (lineText.trim()) {
            text += lineText.trim() + '\n';
          }
          lineText = item.str;
          lastY = y;
        } else {
          lineText += ' ' + item.str;
        }
      }
      
      // Add the last line
      if (lineText.trim()) {
        text += lineText.trim() + '\n';
      }
      
      text += '\n'; // Page separator
    }
    
    if (!text.trim()) {
      throw new Error('No text extracted from PDF');
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from a DOCX file with better formatting
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value || !result.value.trim()) {
      throw new Error('No text extracted from DOCX');
    }
    
    // Clean up the extracted text
    let text = result.value
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n\s*\n/g, '\n') // Remove excessive blank lines
      .trim();
    
    return text;
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
      return await extractTextFromPDF(buffer);
    case CVFileType.DOCX:
      return await extractTextFromDOCX(buffer);
    case CVFileType.TXT:
      return extractTextFromTXT(buffer);
    default:
      throw new Error('Unsupported file type');
  }
}

/**
 * Detect if this is one of our own templates
 */
function detectOwnTemplate(text: string): { isOwnTemplate: boolean; templateType?: string } {
  // Look for our template markers
  const templateMarkers = [
    { type: TemplateType.PROFESSIONAL, patterns: ['professional template', 'corporate professional', 'cvkonnekt professional'] },
    { type: TemplateType.MODERN, patterns: ['modern template', 'modern minimalist', 'cvkonnekt modern'] },
    { type: TemplateType.CREATIVE, patterns: ['creative template', 'creative design', 'cvkonnekt creative'] },
    { type: TemplateType.SIMPLE, patterns: ['simple template', 'simple clean', 'cvkonnekt simple'] },
    { type: TemplateType.EXECUTIVE, patterns: ['executive template', 'executive elite', 'cvkonnekt executive'] },
    { type: TemplateType.TECHNICAL, patterns: ['technical template', 'technical expert', 'cvkonnekt technical'] },
    { type: TemplateType.GRADUATE, patterns: ['graduate template', 'graduate entry', 'cvkonnekt graduate'] },
    { type: TemplateType.DIGITAL, patterns: ['digital template', 'digital portfolio', 'cvkonnekt digital'] }
  ];

  const lowerText = text.toLowerCase();
  
  for (const marker of templateMarkers) {
    for (const pattern of marker.patterns) {
      if (lowerText.includes(pattern)) {
        return { isOwnTemplate: true, templateType: marker.type };
      }
    }
  }

  // Also check for our specific formatting patterns
  if (lowerText.includes('cvkonnekt') || lowerText.includes('generated by cvkonnekt')) {
    return { isOwnTemplate: true, templateType: TemplateType.PROFESSIONAL };
  }

  return { isOwnTemplate: false };
}

/**
 * Main CV parsing function
 */
export async function parseCV(buffer: Buffer): Promise<CVParseResult> {
  try {
    // Detect file type
    const fileType = await detectFileType(buffer);
    
    // Extract text
    const rawText = await extractTextFromFile(buffer, fileType);
    
    // Detect if it's our own template
    const templateDetection = detectOwnTemplate(rawText);
    
    // Parse the text into CV data
    const result = parseTextToCV(rawText, templateDetection.isOwnTemplate);
    
    return {
      success: true,
      data: result.data,
      rawText,
      confidence: result.confidence,
      ownTemplate: templateDetection.isOwnTemplate,
      templateType: templateDetection.templateType
    };
  } catch (error) {
    console.error('Error parsing CV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      confidence: 0
    };
  }
}

/**
 * Parse text into CV data structure
 */
export function parseTextToCV(text: string, isOwnTemplate: boolean = false): CVParseResult {
  try {
    console.log('Starting CV parsing with text:', text.substring(0, 200) + '...'); // Debug log
    
    const personalInfo = extractPersonalInfo(text);
    console.log('Extracted personal info:', personalInfo); // Debug log
    
    const summary = extractSummary(text);
    console.log('Extracted summary:', summary.substring(0, 100) + '...'); // Debug log
    
    const experience = extractExperience(text);
    console.log('Extracted experience:', experience); // Debug log
    
    const education = extractEducation(text);
    console.log('Extracted education:', education); // Debug log
    
    const skills = extractSkills(text);
    console.log('Extracted skills:', skills); // Debug log

    const cvData: CVData = {
      personalInfo,
      summary,
      experience,
      education,
      skills,
      projects: []
    };

    const confidence = calculateConfidence(cvData, isOwnTemplate);
    console.log('Final CV data:', cvData); // Debug log
    console.log('Confidence score:', confidence); // Debug log

    return {
      success: true,
      data: cvData,
      rawText: text,
      confidence,
      ownTemplate: isOwnTemplate
    };
  } catch (error) {
    console.error('Error parsing text to CV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      confidence: 0
    };
  }
}

/**
 * Extract personal information from text
 */
function extractPersonalInfo(text: string): PersonalInfo {
  // Clean the text first
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ');
  
  // Extract name from the first line (assuming it's the first non-empty line)
  const lines = cleanText.split('\n').filter(line => line.trim());
  const firstLine = lines[0] || '';
  
  // Try to extract name from the first line (before any contact info)
  const nameMatch = firstLine.match(/^([^|@\d\n\r]+?)(?:\s*\||\s*@|\s*\d|$)/);
  
  // Look for job title in the experience section or near the top
  const jobTitleMatch = cleanText.match(/(?:^|\n)([^|\n\r]+?)\s*\|\s*[^|\n\r]+(?:\s*–|\s*to|\s*-)/im);
  
  // Look for email with more flexible pattern
  const emailMatch = cleanText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  
  // Look for phone number with various formats
  const phoneMatch = cleanText.match(/\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/);
  
  // Look for location/address with more flexible patterns
  const locationMatch = cleanText.match(/(?:^|\n)([^|\n\r]+?),\s*[^|\n\r]+,\s*[A-Z]{2}\s*\d{5}/im) ||
                       cleanText.match(/(?:^|\n)([^|\n\r]+?),\s*[^|\n\r]+,\s*[A-Z]{2}/im) ||
                       cleanText.match(/(?:^|\n)([^|\n\r]+?),\s*[A-Z]{2}\s*\d{5}/im);

  return {
    fullName: nameMatch ? nameMatch[1].trim() : '',
    jobTitle: jobTitleMatch ? jobTitleMatch[1].trim() : '',
    email: emailMatch ? emailMatch[1].trim() : '',
    phone: phoneMatch ? `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}` : '',
    location: locationMatch ? locationMatch[1].trim() : ''
  };
}

/**
 * Extract summary from text
 */
function extractSummary(text: string): string {
  // Look for profile/summary section
  const profileMatch = text.match(/(?:profile|summary|objective):\s*\n([^]*?)(?=\n\s*(?:experience|education|skills|activities|interests):)/i);
  if (profileMatch) {
    return profileMatch[1].trim();
  }
  
  // Fallback: look for any paragraph that seems like a summary
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length > 50 && !line.includes('|') && !line.includes('@') && !line.match(/^\d/)) {
      return line;
    }
  }
  
  return '';
}

/**
 * Extract experience from text
 */
function extractExperience(text: string): Experience[] {
  const experiences: Experience[] = [];
  
  // Look for experience section with more flexible patterns
  const experienceSection = text.match(/(?:experience|work history|employment|work experience):\s*\n([^]*?)(?=\n\s*(?:education|skills|activities|interests|projects):)/is);
  
  if (experienceSection) {
    const experienceText = experienceSection[1];
    console.log('Experience section found:', experienceText); // Debug log
    
    const lines = experienceText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Match pattern: "Job Title | Company | Date Range"
      const match = trimmedLine.match(/^([^|]+?)\s*\|\s*([^|]+?)(?:\s*\|\s*([^|]+))?/);
      if (match && match[1].trim() && match[2].trim()) {
        console.log('Experience match:', match); // Debug log
        experiences.push({
          title: match[1].trim(),
          company: match[2].trim(),
          location: '',
          startDate: '',
          endDate: '',
          description: ''
        });
      }
    }
  } else {
    console.log('No experience section found'); // Debug log
  }
  
  return experiences;
}

/**
 * Extract education from text
 */
function extractEducation(text: string): Education[] {
  const education: Education[] = [];
  
  // Look for education section with more flexible patterns
  const educationSection = text.match(/(?:education|academic|qualifications|academics):\s*\n([^]*?)(?=\n\s*(?:skills|activities|interests|experience|projects):)/is);
  
  if (educationSection) {
    const educationText = educationSection[1];
    console.log('Education section found:', educationText); // Debug log
    
    const lines = educationText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Match pattern: "Degree | Date | Institution"
      const match = trimmedLine.match(/^([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+)/);
      if (match && match[1].trim() && match[3].trim()) {
        console.log('Education match:', match); // Debug log
        education.push({
          degree: match[1].trim(),
          institution: match[3].trim(),
          location: '',
          graduationDate: match[2].trim()
        });
      }
    }
  } else {
    console.log('No education section found'); // Debug log
  }
  
  return education;
}

/**
 * Extract skills from text
 */
function extractSkills(text: string): string {
  const skills: string[] = [];
  
  // Look for skills section
  const skillsSection = text.match(/(?:skills|abilities|competencies|expertise):\s*\n([^]*?)(?=\n\s*(?:activities|interests|experience|education):)/i);
  
  if (skillsSection) {
    const skillsText = skillsSection[1];
    const lines = skillsText.split('\n');
    
    for (const line of lines) {
      const lineSkills = line.split(/[,;]/).map(s => s.trim()).filter(s => s && s.length > 2);
      skills.push(...lineSkills);
    }
  }
  
  return skills.join(', ');
}

/**
 * Infer skill category based on skill name
 */
function inferSkillCategory(skill: string): string {
  const skillLower = skill.toLowerCase();
  
  if (skillLower.includes('javascript') || skillLower.includes('typescript') || skillLower.includes('react') || skillLower.includes('node')) {
    return 'Programming';
  }
  if (skillLower.includes('python') || skillLower.includes('java') || skillLower.includes('c++')) {
    return 'Programming';
  }
  if (skillLower.includes('excel') || skillLower.includes('word') || skillLower.includes('powerpoint')) {
    return 'Office';
  }
  if (skillLower.includes('photoshop') || skillLower.includes('illustrator') || skillLower.includes('figma')) {
    return 'Design';
  }
  
  return 'Other';
}

/**
 * Calculate confidence score for parsed data
 */
function calculateConfidence(cvData: CVData, isOwnTemplate: boolean): number {
  let score = 0;
  
  // Base scoring for all CVs
  if (cvData.personalInfo.fullName) score += 15;
  if (cvData.personalInfo.jobTitle) score += 10;
  if (cvData.personalInfo.email) score += 10;
  if (cvData.personalInfo.phone) score += 8;
  if (cvData.personalInfo.location) score += 7;
  if (cvData.summary) score += 12;
  if (cvData.experience.length > 0) score += 15;
  if (cvData.education.length > 0) score += 10;
  if (typeof cvData.skills === 'string' && cvData.skills.trim()) score += 8;
  
  // Bonus for our own templates (they should have higher confidence)
  if (isOwnTemplate) {
    score += 20; // 20% bonus for our own templates
    console.log('Own template detected - applying confidence bonus');
  }
  
  // Additional bonuses for completeness
  if (cvData.personalInfo.fullName && cvData.personalInfo.email && cvData.personalInfo.phone) {
    score += 5; // Complete contact info bonus
  }
  
  if (cvData.experience.length >= 2) {
    score += 5; // Multiple experiences bonus
  }
  
  if (cvData.education.length >= 2) {
    score += 3; // Multiple education entries bonus
  }
  
  return Math.min(score, 100);
}

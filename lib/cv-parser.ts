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
 * Extract text from a PDF file using pdfjs-dist
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
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
 * Main CV parsing function
 */
export async function parseCV(buffer: Buffer): Promise<CVParseResult> {
  try {
    // Detect file type
    const fileType = await detectFileType(buffer);
    
    // Extract text
    const rawText = await extractTextFromFile(buffer, fileType);
    
    // Parse the text into CV data
    const result = parseTextToCV(rawText);
    
    return {
      success: true,
      data: result.data,
      rawText,
      confidence: result.confidence,
      ownTemplate: result.ownTemplate,
      templateType: result.templateType
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
export function parseTextToCV(text: string): CVParseResult {
  try {
    const personalInfo = extractPersonalInfo(text);
    const summary = extractSummary(text);
    const experience = extractExperience(text);
    const education = extractEducation(text);
    const skills = extractSkills(text);

    const cvData: CVData = {
      personalInfo,
      summary,
      experience,
      education,
      skills,
      projects: []
    };

    const confidence = calculateConfidence(cvData);

    return {
      success: true,
      data: cvData,
      rawText: text,
      confidence,
      ownTemplate: false
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
  const nameMatch = text.match(/(?:name|full name):\s*([^\n]+)/i);
  const emailMatch = text.match(/(?:email|e-mail):\s*([^\n@]+@[^\n]+)/i);
  const phoneMatch = text.match(/(?:phone|tel|telephone):\s*([^\n]+)/i);
  const locationMatch = text.match(/(?:location|address|city):\s*([^\n]+)/i);

  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    email: emailMatch ? emailMatch[1].trim() : '',
    phone: phoneMatch ? phoneMatch[1].trim() : '',
    location: locationMatch ? locationMatch[1].trim() : '',
    website: '',
    linkedIn: ''
  };
}

/**
 * Extract summary from text
 */
function extractSummary(text: string): string {
  const summaryMatch = text.match(/(?:summary|profile|objective):\s*([^\n]+(?:\n[^\n]+)*)/i);
  return summaryMatch ? summaryMatch[1].trim() : '';
}

/**
 * Extract experience from text
 */
function extractExperience(text: string): Experience[] {
  const experiences: Experience[] = [];
  const experienceRegex = /(?:company|employer):\s*([^\n]+)\s*(?:position|title|role):\s*([^\n]+)/gi;
  
  let match;
  while ((match = experienceRegex.exec(text)) !== null) {
    experiences.push({
      company: match[1].trim(),
      position: match[2].trim(),
      startDate: '',
      endDate: '',
      description: '',
      highlights: [],
      location: ''
    });
  }
  
  return experiences;
}

/**
 * Extract education from text
 */
function extractEducation(text: string): Education[] {
  const education: Education[] = [];
  const educationRegex = /(?:institution|university|school):\s*([^\n]+)\s*(?:degree|qualification):\s*([^\n]+)/gi;
  
  let match;
  while ((match = educationRegex.exec(text)) !== null) {
    education.push({
      institution: match[1].trim(),
      degree: match[2].trim(),
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
      location: ''
    });
  }
  
  return education;
}

/**
 * Extract skills from text
 */
function extractSkills(text: string): Skill[] {
  const skills: Skill[] = [];
  const skillRegex = /(?:skills|technologies|tools):\s*([^\n]+)/gi;
  
  let match;
  while ((match = skillRegex.exec(text)) !== null) {
    const skillNames = match[1].split(/[,;]/).map(s => s.trim()).filter(s => s);
    skillNames.forEach(name => {
      skills.push({
        name,
        category: inferSkillCategory(name),
        level: 'intermediate'
      });
    });
  }
  
  return skills;
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
function calculateConfidence(cvData: CVData): number {
  let score = 0;
  
  if (cvData.personalInfo.name) score += 20;
  if (cvData.personalInfo.email) score += 15;
  if (cvData.personalInfo.phone) score += 10;
  if (cvData.summary) score += 15;
  if (cvData.experience.length > 0) score += 20;
  if (cvData.education.length > 0) score += 10;
  if (cvData.skills.length > 0) score += 10;
  
  return Math.min(score, 100);
}

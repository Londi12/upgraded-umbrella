import { CVData, PersonalInfo, Experience, Education, Skill, Project } from '@/types/cv-types';
import mammoth from 'mammoth';
import { fileTypeFromBuffer } from 'file-type';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure PDF.js worker for server-side usage
if (typeof window === 'undefined') {
  // For server-side rendering, we need to handle PDF.js differently
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
    console.log('Starting PDF text extraction...');
    
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Better text extraction with positioning and formatting
      const items = textContent.items as any[];
      let lastY = 0;
      let lineText = '';
      let pageText = '';
      
      // Sort items by Y position (top to bottom)
      const sortedItems = items.sort((a, b) => b.transform[5] - a.transform[5]);
      
      for (const item of sortedItems) {
        const y = item.transform[5]; // Y position
        const x = item.transform[4]; // X position
        
        // If Y position changes significantly, it's a new line
        if (Math.abs(y - lastY) > 8) {
          if (lineText.trim()) {
            pageText += lineText.trim() + '\n';
          }
          lineText = item.str;
          lastY = y;
        } else {
          // Same line, add space if there's a significant X gap
          const lastItem = sortedItems[sortedItems.indexOf(item) - 1];
          if (lastItem && Math.abs(x - lastItem.transform[4]) > 20) {
            lineText += ' ' + item.str;
          } else {
            lineText += item.str;
          }
        }
      }
      
      // Add the last line
      if (lineText.trim()) {
        pageText += lineText.trim() + '\n';
      }
      
      text += pageText + '\n'; // Page separator
    }
    
    console.log('PDF text extraction completed');
    console.log('Extracted text length:', text.length);
    console.log('First 200 characters:', text.substring(0, 200));
    
    if (!text.trim()) {
      throw new Error('No text extracted from PDF');
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  
  console.log('First line for name extraction:', firstLine); // Debug log
  
  // Try multiple patterns for name extraction
  let fullName = '';
  
  // Pattern 1: Name before any contact info (email, phone, etc.)
  const nameMatch1 = firstLine.match(/^([^|@\d\n\r]+?)(?:\s*\||\s*@|\s*\d|$)/);
  if (nameMatch1 && nameMatch1[1].trim().length > 2) {
    fullName = nameMatch1[1].trim();
  }
  
  // Pattern 2: Look for capitalized name pattern
  if (!fullName) {
    const nameMatch2 = firstLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (nameMatch2) {
      fullName = nameMatch2[1].trim();
    }
  }
  
  // Pattern 3: Look for name in the first few lines
  if (!fullName) {
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      if (nameMatch && nameMatch[1].length > 3) {
        fullName = nameMatch[1].trim();
        break;
      }
    }
  }
  
  console.log('Extracted name:', fullName); // Debug log
  
  // Look for job title in the experience section or near the top
  let jobTitle = '';
  const jobTitleMatch = cleanText.match(/(?:^|\n)([^|\n\r]+?)\s*\|\s*[^|\n\r]+(?:\s*–|\s*to|\s*-)/im);
  if (jobTitleMatch) {
    jobTitle = jobTitleMatch[1].trim();
  }
  
  // Look for email with more flexible pattern
  const emailMatch = cleanText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1].trim() : '';
  
  // Look for phone number with various formats (including South African)
  const phoneMatch = cleanText.match(/(?:^|\s)(?:\+27|0)?[\s.-]?(\d{1,3})[\s.-]?(\d{3})[\s.-]?(\d{4})(?:\s|$)/);
  const phone = phoneMatch ? `+27 ${phoneMatch[1]} ${phoneMatch[2]} ${phoneMatch[3]}` : '';
  
  // Look for location/address with more flexible patterns
  let location = '';
  const locationMatch = cleanText.match(/(?:^|\n)([^|\n\r]+?),\s*[^|\n\r]+,\s*[A-Z]{2}\s*\d{5}/im) ||
                       cleanText.match(/(?:^|\n)([^|\n\r]+?),\s*[^|\n\r]+,\s*[A-Z]{2}/im) ||
                       cleanText.match(/(?:^|\n)([^|\n\r]+?),\s*[A-Z]{2}\s*\d{5}/im);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }

  console.log('Extracted personal info:', { fullName, jobTitle, email, phone, location }); // Debug log

  return {
    fullName,
    jobTitle,
    email,
    phone,
    location
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
  const experienceSection = text.match(/(?:experience|work history|employment|work experience|professional experience|career history):\s*\n([^]*?)(?=\n\s*(?:education|skills|activities|interests|projects|academic|qualifications):)/is);
  
  if (experienceSection) {
    const experienceText = experienceSection[1];
    console.log('Experience section found:', experienceText.substring(0, 200) + '...'); // Debug log
    
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
  const educationSection = text.match(/(?:education|academic|qualifications|academics|academic background):\s*\n([^]*?)(?=\n\s*(?:skills|activities|interests|experience|projects|work):)/is);
  
  if (educationSection) {
    const educationText = educationSection[1];
    console.log('Education section found:', educationText.substring(0, 200) + '...'); // Debug log
    
    const lines = educationText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Match pattern: "Degree | Institution | Date"
      const match = trimmedLine.match(/^([^|]+?)\s*\|\s*([^|]+?)(?:\s*\|\s*([^|]+))?/);
      if (match && match[1].trim() && match[2].trim()) {
        console.log('Education match:', match); // Debug log
        education.push({
          degree: match[1].trim(),
          institution: match[2].trim(),
          location: '',
          graduationDate: match[3] ? match[3].trim() : ''
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
  // Look for skills section with more flexible patterns
  const skillsSection = text.match(/(?:skills|technical skills|competencies|expertise|key skills|core competencies):\s*\n([^]*?)(?=\n\s*(?:experience|education|activities|interests|projects|work|academic):)/is);
  
  if (skillsSection) {
    const skillsText = skillsSection[1];
    console.log('Skills section found:', skillsText.substring(0, 200) + '...'); // Debug log
    
    // Clean up the skills text
    let skills = skillsText
      .replace(/\n/g, ', ') // Replace newlines with commas
      .replace(/,\s*,/g, ',') // Remove double commas
      .replace(/^\s*,\s*/, '') // Remove leading comma
      .replace(/\s*,\s*$/, '') // Remove trailing comma
      .trim();
    
    // If skills are pipe-separated, convert to comma-separated
    if (skills.includes('|')) {
      skills = skills.replace(/\s*\|\s*/g, ', ');
    }
    
    console.log('Extracted skills:', skills); // Debug log
    return skills;
  }
  
  // Fallback: look for common skill keywords in the text
  const skillKeywords = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Laravel',
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'Material-UI',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins',
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
    'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'Microservices',
    'Machine Learning', 'AI', 'Data Science', 'Analytics', 'Statistics',
    'Project Management', 'Leadership', 'Communication', 'Problem Solving'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  if (foundSkills.length > 0) {
    console.log('Found skills from keywords:', foundSkills); // Debug log
    return foundSkills.join(', ');
  }
  
  console.log('No skills section found'); // Debug log
  return '';
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

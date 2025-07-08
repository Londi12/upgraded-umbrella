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
  DIGITAL = 'digital',
  SA_PROFESSIONAL = 'sa-professional',
  SA_MODERN = 'sa-modern',
  SA_EXECUTIVE = 'sa-executive'
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

    // Convert Buffer to Uint8Array as required by PDF.js
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded with ${pdf.numPages} pages`);

    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Improved text extraction with better positioning and formatting
      const items = textContent.items as any[];

      // Group items by their vertical position (Y coordinate)
      const lineMap = new Map<number, {items: any[], x: number}[]>();

      for (const item of items) {
        if (!item.str.trim()) continue; // Skip empty strings

        const y = Math.round(item.transform[5]); // Round Y position to group nearby items
        const x = item.transform[4]; // X position

        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }

        lineMap.get(y)!.push({
          items: [item],
          x: x
        });
      }

      // Sort lines by Y position (top to bottom) and items by X position (left to right)
      const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a); // Descending order (top to bottom)

      let pageText = '';

      for (const y of sortedYs) {
        const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x); // Sort by X position

        let lineText = '';
        let lastX = 0;

        for (const item of lineItems) {
          const x = item.x;
          const str = item.items[0].str;

          // Add appropriate spacing between words based on X distance
          if (lineText && x - lastX > 10) {
            lineText += ' ';
          }

          lineText += str;
          lastX = x + (str.length * 5); // Approximate the end position
        }

        if (lineText.trim()) {
          pageText += lineText.trim() + '\n';
        }
      }

      text += pageText + '\n'; // Page separator
    }

    // Post-processing to clean up the text
    text = text
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .split('\n')
      .map(line => {
        // Preserve structure but clean up excessive spaces within each line
        return line.replace(/\s{2,}/g, ' ').trim();
      })
      .join('\n')
      .trim();

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
    { type: TemplateType.DIGITAL, patterns: ['digital template', 'digital portfolio', 'cvkonnekt digital'] },
    { type: TemplateType.SA_PROFESSIONAL, patterns: ['sa professional template', 'sa corporate professional', 'cvkonnekt sa professional', 'south african professional'] },
    { type: TemplateType.SA_MODERN, patterns: ['sa modern template', 'sa modern minimalist', 'cvkonnekt sa modern', 'south african modern'] },
    { type: TemplateType.SA_EXECUTIVE, patterns: ['sa executive template', 'sa executive elite', 'cvkonnekt sa executive', 'south african executive'] }
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
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // More flexible name pattern for PDF files
      const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/) || 
                        line.match(/^([A-Z][A-Z]+\s+[A-Z][a-z]+)/) ||  // ALL CAPS first name
                        line.match(/^([A-Z][a-z]+\s+[A-Z][A-Z]+)/);    // ALL CAPS last name
      if (nameMatch && nameMatch[1].length > 3) {
        fullName = nameMatch[1].trim();
        break;
      }
    }
  }

  console.log('Extracted name:', fullName); // Debug log

  // Look for professional summary or job title
  let jobTitle = '';

  // First try to find a job title in a professional summary section
  const summaryMatch = cleanText.match(/(?:professional\s+summary|profile|summary)[\s:]*\n+([^\n]+)/i);
  if (summaryMatch && summaryMatch[1].length < 100) { // Not too long to be a full summary
    jobTitle = summaryMatch[1].trim();
  }

  // Look for job title patterns in the first few lines after the name
  if (!jobTitle) {
    for (let i = 1; i < Math.min(8, lines.length); i++) {
      const line = lines[i].trim();

      // Skip lines that look like contact info or addresses
      if (line.includes('@') ||
          line.includes('|') ||
          line.match(/\(\d{3}\)/) ||
          line.match(/\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/i) ||
          line.match(/^\d+\s/) || // Starts with a number (likely address)
          line.includes(',') && line.match(/\d{5}/) // Contains zip code
         ) {
        continue;
      }

      // Look for job title patterns - professional titles
      if ((line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/) ||
           line.match(/Manager|Director|Engineer|Developer|Analyst|Coordinator|Specialist|Assistant|Executive|Officer|Consultant|Administrator|Supervisor|Lead|Senior|Junior/i)) &&
          line.length < 60 &&
          line.length > 5 &&
          !line.match(/\d{4}/) && // Not a date
          !line.match(/Profile|Summary|Experience|Education|Skills|Contact/i)) { // Not a section header
        jobTitle = line;
        break;
      }
    }
  }

  // If still not found, look for job title in the experience section
  if (!jobTitle) {
    const jobTitleMatch = cleanText.match(/(?:^|\n)([^|\n\r]+?)\s*\|\s*[^|\n\r]+(?:\s*–|\s*to|\s*-)/im) ||
                          cleanText.match(/(?:job title|position|role)[\s:]*([^\n]+)/i);
    if (jobTitleMatch) {
      jobTitle = jobTitleMatch[1].trim();
    }
  }

  // Look for email with more flexible pattern
  const emailMatch = cleanText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1].trim() : '';

  // Look for phone number with various formats
  // First try to find a phone number in standard US format (XXX) XXX-XXXX
  const usPhoneMatch = cleanText.match(/\((\d{3})\)\s*(\d{3})-(\d{4})/);

  // Then try other international formats
  const phoneMatch = !usPhoneMatch && (
    cleanText.match(/(?:^|\s)(?:\+\d{1,3}|0)?[\s.-]?(\d{1,3})[\s.-]?(\d{3})[\s.-]?(\d{4})(?:\s|$)/) ||
    cleanText.match(/(?:phone|tel|mobile|cell)[\s:]*([+\d\s.-]{7,})/i)
  );

  let phone = '';
  if (usPhoneMatch) {
    // Preserve the US format
    phone = `(${usPhoneMatch[1]}) ${usPhoneMatch[2]}-${usPhoneMatch[3]}`;
  } else if (phoneMatch) {
    if (phoneMatch[1] && phoneMatch[2] && phoneMatch[3]) {
      // Format the phone number consistently if we have the parts
      phone = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;
    } else if (phoneMatch[1]) {
      // Just use the matched phone string
      phone = phoneMatch[1].trim();
    }
  }

  // Look for location/address with more flexible patterns
  let location = '';

  // Try multiple location patterns, being more specific to avoid job titles
  const locationPatterns = [
    // Full address with street number and zip
    /(\d+\s+[^|\n\r]+?(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)[^|\n\r]*?,\s*[^|\n\r]+?,\s*[A-Z]{2}\s*\d{5})/im,
    // Street address with city and state
    /(\d+\s+[^|\n\r]+?(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)[^|\n\r]*?,\s*[^|\n\r]+?,\s*[A-Z]{2})/im,
    // Just street address
    /(\d+\s+[^|\n\r]+?(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr))/im,
    // City, State, ZIP format
    /([A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5})/,
    // City, State format
    /([A-Z][a-z]+,\s*[A-Z]{2})/,
    // Address labeled
    /(?:address|location)[\s:]*([^\n]+)/i
  ];

  for (const pattern of locationPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const potentialLocation = match[1].trim();
      // Make sure it's not a job title or name
      if (!potentialLocation.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+$/) ||
          potentialLocation.includes(',') ||
          potentialLocation.match(/\d/)) {
        location = potentialLocation;
        break;
      }
    }
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
  // Look for profile/summary section with more flexible patterns
  const profilePatterns = [
    // Standard section header with content until next major section
    /(?:profile|summary|professional\s+summary|objective|about\s+me)[:.\s]*\n+([^]*?)(?=\n\s*(?:experience|education|skills|activities|interests|work|employment):)/i,

    // Look for PROFESSIONAL SUMMARY as a standalone header until next major section
    /PROFESSIONAL\s+SUMMARY\s*\n+([^]*?)(?=\n\s*(?:EXPERIENCE|EDUCATION|SKILLS|WORK|EMPLOYMENT):)/i,

    // Section header without clear end marker but ending at a capitalized section header
    /(?:profile|summary|professional\s+summary|objective|about\s+me)[:.\s]*\n+([^]*?)(?=\n\s*\n\s*[A-Z][A-Z\s]+\s*\n)/i,

    // Section header with content until double newline (less strict fallback)
    /(?:profile|summary|professional\s+summary|objective|about\s+me)[:.\s]*\n+([^]*?)(?=\n\s*\n)/i
  ];

  for (const pattern of profilePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim()) {
      // Clean up the summary
      let summary = match[1].trim()
        .replace(/^\s*[-•*]\s*/gm, '') // Remove bullet points
        .replace(/\n+/g, ' '); // Join multiple lines

      console.log('Summary found with pattern:', summary.substring(0, 100) + '...'); // Debug log
      return summary;
    }
  }

  // Fallback: look for any paragraph that seems like a summary
  // Usually appears near the top of the document after the contact info
  const lines = text.split('\n');
  const startLine = Math.min(15, lines.length); // Look in the first 15 lines (increased from 10)

  // Look for a substantial paragraph in the first few lines
  for (let i = 0; i < startLine; i++) {
    const line = lines[i].trim();
    // Look for a substantial paragraph that's likely to be a summary
    if (line.length > 50 && !line.includes('|') && !line.includes('@') && !line.match(/^\d/) && 
        !line.match(/^(education|experience|skills|work|employment)/i)) {
      console.log('Summary found in first lines:', line.substring(0, 100) + '...'); // Debug log
      return line;
    }
  }

  // Second fallback: look for a longer paragraph anywhere in the first part of the document
  const firstThird = lines.slice(0, Math.floor(lines.length / 3));
  for (const line of firstThird) {
    if (line.length > 80) { // Reduced from 100 to catch more potential summaries
      console.log('Summary found in first third:', line.substring(0, 100) + '...'); // Debug log
      return line;
    }
  }

  // Third fallback: try to find multiple consecutive lines that might form a summary
  for (let i = 0; i < startLine; i++) {
    if (lines[i].trim().length > 30 && lines[i+1] && lines[i+1].trim().length > 30) {
      const combinedLines = lines.slice(i, i+3).join(' ').trim();
      if (combinedLines.length > 60) {
        console.log('Summary found from consecutive lines:', combinedLines.substring(0, 100) + '...'); // Debug log
        return combinedLines;
      }
    }
  }

  console.log('No summary found'); // Debug log
  return '';
}

/**
 * Extract experience from text
 */
function extractExperience(text: string): Experience[] {
  const experiences: Experience[] = [];

  // Look for experience section with more flexible patterns
  const experienceSectionPatterns = [
    // Standard format with colon
    /(?:experience|work history|employment|work experience|professional experience|career history)[:.\s]*\n([^]*?)(?=\n\s*(?:education|skills|activities|interests|projects|academic|qualifications):)/is,

    // Uppercase headers
    /WORK EXPERIENCE\s*\n([^]*?)(?=\n\s*(?:EDUCATION|SKILLS|ACTIVITIES|INTERESTS|PROJECTS|ACADEMIC|QUALIFICATIONS))/is,
    /EXPERIENCE\s*\n([^]*?)(?=\n\s*(?:EDUCATION|SKILLS|ACTIVITIES|INTERESTS|PROJECTS|ACADEMIC|QUALIFICATIONS))/is,
    /EMPLOYMENT\s*\n([^]*?)(?=\n\s*(?:EDUCATION|SKILLS|ACTIVITIES|INTERESTS|PROJECTS|ACADEMIC|QUALIFICATIONS))/is,

    // Headers without clear end marker but ending at a capitalized section header
    /(?:experience|work history|employment|work experience|professional experience|career history)[:.\s]*\n([^]*?)(?=\n\s*\n\s*[A-Z][A-Z\s]+\s*\n)/is,

    // Experience section at the end of the document
    /(?:experience|work history|employment|work experience|professional experience|career history)[:.\s]*\n([^]*?)$/is,
    /WORK EXPERIENCE\s*\n([^]*?)$/is,
    /EXPERIENCE\s*\n([^]*?)$/is
  ];

  let experienceText = '';
  for (const pattern of experienceSectionPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim()) {
      experienceText = match[1].trim();
      console.log('Experience section found:', experienceText.substring(0, 200) + '...'); // Debug log
      break;
    }
  }

  if (experienceText) {
    // Split experience text into lines and process each line that contains pipes
    const lines = experienceText.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines or lines without pipes
      if (!trimmedLine || !trimmedLine.includes('|')) {
        continue;
      }

      // Split by pipe and clean up each part
      const parts = trimmedLine.split('|').map(part => part.trim()).filter(part => part.length > 0);

      if (parts.length >= 2) {
        let title = parts[0];
        let company = parts[1];
        let location = '';
        let startDate = '';
        let endDate = '';
        let uncertain = false;

        // Enhanced date pattern to catch more formats
        const datePattern = /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}(?:XX|\d{2})\s*(?:–|—|-|to)\s*(?:Present|Current|Now|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}(?:XX|\d{2}))|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}(?:XX|\d{2})|\d{4}\s*(?:–|—|-|to)\s*(?:\d{4}|Present|Current|Now)|\d{4}/i;

        // Check remaining parts for dates and locations
        const remainingParts = parts.slice(2);

        for (const part of remainingParts) {
          if (datePattern.test(part)) {
            // Parse the date range
            const dateMatch = part.match(datePattern);
            if (dateMatch) {
              const fullDate = dateMatch[0];
              if (fullDate.includes('–') || fullDate.includes('-') || fullDate.includes('to')) {
                const dateParts = fullDate.split(/\s*(?:-|to|–|—)\s*/);
                startDate = dateParts[0]?.trim() || '';
                endDate = dateParts[1]?.trim() || '';
              } else {
                startDate = fullDate;
              }
            }
          } else if (part.length > 2 && !part.match(/^\d+$/)) {
            // Likely a location if it's not just numbers
            location = part;
          }
        }

        // Only add if we have meaningful title and company
        if (title.length > 1 && company.length > 1) {
          experiences.push({
            title,
            company,
            location,
            startDate,
            endDate,
            description: '',
            uncertain
          });
        }
      }
    }

    // Format 2: Job Title followed by Company and Date on separate lines
    if (experiences.length === 0) {
      const lines = experienceText.split('\n');
      let currentJob: Partial<Experience> | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Look for job title patterns (often in bold or at the start of an entry)
        const jobTitleMatch = line.match(/^([A-Z][A-Za-z\s]+)$/);

        // Enhanced date pattern to match formats like "September 20XX – Present"
        const dateMatch = line.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}))\s*(?:-|to|–|—)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:Present|Current|Now|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}))/i) ||
                          line.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2}(?:XX|\d{2}))\s*(?:–|-|to)\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2}(?:XX|\d{2})|Present)/i);

        const companyMatch = line.match(/^(?:at|with)?\s*([A-Z][A-Za-z0-9\s&.,]+)(?:\s*[-–—]\s*|\s*,\s*|\s+in\s+)([A-Za-z\s,]+)$/);

        // Check for bullet points that might be part of job descriptions
        const bulletMatch = line.match(/^[\s•\-*]+(.+)$/);

        if (jobTitleMatch && !dateMatch && !line.includes(',')) {
          // Start a new job entry
          if (currentJob && currentJob.title && currentJob.company) {
            experiences.push(currentJob as Experience);
          }

          currentJob = {
            title: jobTitleMatch[1].trim(),
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            description: ''
          };
        } else if (companyMatch && currentJob) {
          // Company and possibly location
          currentJob.company = companyMatch[1].trim();
          if (companyMatch[2]) {
            currentJob.location = companyMatch[2].trim();
          }
        } else if (dateMatch && currentJob) {
          // Date range
          if (dateMatch[0].includes('–') || dateMatch[0].includes('-') || dateMatch[0].includes('to')) {
            const dates = dateMatch[0].split(/\s*(?:-|to|–|—)\s*/);
            if (dates.length >= 2) {
              currentJob.startDate = dates[0].trim();
              currentJob.endDate = dates[1].trim();
            }
          } else if (dateMatch[1] && dateMatch[2]) {
            // Handle the full month name format
            currentJob.startDate = dateMatch[1].trim();
            currentJob.endDate = dateMatch[2].trim();
          }
        } else if (bulletMatch && currentJob && currentJob.title && currentJob.company) {
          // This is a bullet point in the job description
          const bulletContent = bulletMatch[1].trim();
          if (currentJob.description) {
            currentJob.description += '\n• ' + bulletContent;
          } else {
            currentJob.description = '• ' + bulletContent;
          }
        } else if (currentJob && currentJob.title && !currentJob.company) {
          // If we have a title but no company yet, this line might be the company
          currentJob.company = line;
        } else if (currentJob && currentJob.title && currentJob.company) {
          // This might be part of the description
          if (currentJob.description) {
            // Check if this is a continuation of a bullet point or a new paragraph
            if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
              currentJob.description += '\n' + line.trim();
            } else {
              currentJob.description += ' ' + line;
            }
          } else {
            currentJob.description = line;
          }
        }
      }

      // Add the last job if it exists
      if (currentJob && currentJob.title && currentJob.company) {
        experiences.push(currentJob as Experience);
      }
    }

    // Format 3: Bullet point style with job title as header
    if (experiences.length === 0) {
      const sections = experienceText.split(/\n\s*\n/);

      for (const section of sections) {
        if (!section.trim()) continue;

        const lines = section.split('\n');
        if (lines.length < 2) continue;

        const titleLine = lines[0].trim();
        const companyLine = lines[1].trim();

        // Check if this looks like a job entry
        if (titleLine && companyLine) {
          const dateMatch = companyLine.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}))\s*(?:-|to|–|—)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:Present|Current|Now|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}))/i);

          experiences.push({
            title: titleLine,
            company: dateMatch ? companyLine.replace(dateMatch[0], '').trim() : companyLine,
            location: '',
            startDate: dateMatch ? dateMatch[0].split(/\s*(?:-|to|–|—)\s*/)[0].trim() : '',
            endDate: dateMatch ? dateMatch[0].split(/\s*(?:-|to|–|—)\s*/)[1].trim() : '',
            description: lines.slice(2).join(' ').trim()
          });
        }
      }
    }
  } else {
    console.log('No experience section found'); // Debug log
  }

  console.log('Extracted experiences:', experiences.length); // Debug log
  return experiences;
}

/**
 * Extract education from text
 */
function extractEducation(text: string): Education[] {
  const education: Education[] = [];

  // Look for education section with more flexible patterns
  const educationSectionPatterns = [
    // Standard format with colon
    /(?:education|academic|qualifications|academics|academic background)[:.\s]*\n([^]*?)(?=\n\s*(?:skills|activities|interests|experience|projects|work):)/is,

    // Uppercase headers
    /EDUCATION\s*\n([^]*?)(?=\n\s*(?:SKILLS|ACTIVITIES|INTERESTS|EXPERIENCE|PROJECTS|WORK))/is,
    /ACADEMIC\s*\n([^]*?)(?=\n\s*(?:SKILLS|ACTIVITIES|INTERESTS|EXPERIENCE|PROJECTS|WORK))/is,
    /QUALIFICATIONS\s*\n([^]*?)(?=\n\s*(?:SKILLS|ACTIVITIES|INTERESTS|EXPERIENCE|PROJECTS|WORK))/is,

    // Headers without clear end marker but ending at a capitalized section header
    /(?:education|academic|qualifications|academics|academic background)[:.\s]*\n([^]*?)(?=\n\s*\n\s*[A-Z][A-Z\s]+\s*\n)/is,

    // Education section at the end of the document
    /(?:education|academic|qualifications|academics|academic background)[:.\s]*\n([^]*?)$/is,
    /EDUCATION\s*\n([^]*?)$/is,
    /ACADEMIC\s*\n([^]*?)$/is,
    /QUALIFICATIONS\s*\n([^]*?)$/is
  ];

  let educationText = '';
  for (const pattern of educationSectionPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim()) {
      educationText = match[1].trim();
      console.log('Education section found:', educationText.substring(0, 200) + '...'); // Debug log
      break;
    }
  }

  if (educationText) {
    // Split education text into lines and process each line that contains pipes
    const lines = educationText.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines or lines without pipes
      if (!trimmedLine || !trimmedLine.includes('|')) {
        continue;
      }

      // Split by pipe and clean up each part
      const parts = trimmedLine.split('|').map(part => part.trim()).filter(part => part.length > 0);

      if (parts.length >= 2) {
        let degree = parts[0];
        let institution = parts[1];
        let location = '';
        let graduationDate = '';
        let uncertain = false;

        // Enhanced date pattern for education (including XX format)
        const datePattern = /(?:(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}(?:XX|\d{2})|\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}XX)/i;

        // Check remaining parts for dates and locations
        const remainingParts = parts.slice(2);

        for (const part of remainingParts) {
          if (datePattern.test(part)) {
            const dateMatch = part.match(datePattern);
            if (dateMatch) {
              graduationDate = dateMatch[0];
            }
          } else if (part.length > 2 && !part.match(/^\d+$/)) {
            // Likely a location if it's not just numbers
            location = part;
          }
        }

        // Only add if we have meaningful degree and institution
        if (degree.length > 1 && institution.length > 1) {
          education.push({
            degree,
            institution,
            location,
            graduationDate,
            uncertain
          });
        }
      }
    }

    // Format 2: Degree followed by Institution and Date on separate lines
    if (education.length === 0) {
      const lines = educationText.split('\n');
      let currentEdu: Partial<Education> | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Look for degree patterns (Bachelor's, Master's, etc.)
        const degreeMatch = line.match(/^((?:Bachelor|Master|Doctor|Ph\.?D|B\.?S|M\.?S|B\.?A|M\.?A|M\.?B\.?A|Associate)[^,]*)/i);

        // Enhanced date pattern to match more formats including full month names
        const dateMatch = line.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})/i) ||
                          line.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i) ||
                          line.match(/Graduation\s+Date:?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})/i) ||
                          line.match(/(?:Graduated|Completed|Earned|Received|Conferred)(?:\s+in|\s+on)?\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})/i);

        const institutionMatch = line.match(/^(?:at|from)?\s*([A-Z][A-Za-z0-9\s&.,]+)(?:\s*[-–—]\s*|\s*,\s*|\s+in\s+)([A-Za-z\s,]+)?$/);

        if (degreeMatch) {
          // Start a new education entry
          if (currentEdu && currentEdu.degree && currentEdu.institution) {
            education.push(currentEdu as Education);
          }

          currentEdu = {
            degree: degreeMatch[1].trim(),
            institution: '',
            location: '',
            graduationDate: ''
          };

          // Check if the degree line also contains the institution
          const restOfLine = line.substring(degreeMatch[0].length).trim();
          if (restOfLine.startsWith(',') || restOfLine.startsWith('-') || restOfLine.startsWith('from')) {
            const instMatch = restOfLine.match(/(?:,|from|-)\s*([^,]+)(?:,|$)/i);
            if (instMatch) {
              currentEdu.institution = instMatch[1].trim();

              // Check if there's a date at the end of the line
              const dateInLine = restOfLine.match(/,\s*(\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})$/i);
              if (dateInLine) {
                currentEdu.graduationDate = dateInLine[1].trim();
              }
            }
          }
        } else if (institutionMatch && currentEdu) {
          // Institution and possibly location
          currentEdu.institution = institutionMatch[1].trim();
          if (institutionMatch[2]) {
            currentEdu.location = institutionMatch[2].trim();
          }
        } else if (dateMatch && currentEdu) {
          // Graduation date
          if (dateMatch[1]) {
            // If it's a match with a capturing group (like "Graduation Date: May 2020")
            currentEdu.graduationDate = dateMatch[1].trim();
          } else {
            // Direct date match
            currentEdu.graduationDate = dateMatch[0].trim();
          }
        } else if (currentEdu && currentEdu.degree && !currentEdu.institution) {
          // If we have a degree but no institution yet, this line might be the institution
          currentEdu.institution = line;

          // Check if there's a date in this line too
          const dateInLine = line.match(/,\s*(\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})$/i);
          if (dateInLine) {
            currentEdu.graduationDate = dateInLine[1].trim();
          }
        }
      }

      // Add the last education entry if it exists
      if (currentEdu && currentEdu.degree && currentEdu.institution) {
        education.push(currentEdu as Education);
      }
    }

    // Format 3: Bullet point or simple list style
    if (education.length === 0) {
      const sections = educationText.split(/\n\s*\n/);

      for (const section of sections) {
        if (!section.trim()) continue;

        const lines = section.split('\n');
        if (lines.length < 1) continue;

        // Try to extract degree and institution from a single line
        for (const line of lines) {
          if (!line.trim()) continue;

          // Look for patterns like "Degree in X, Institution, Year"
          const fullMatch = line.match(/([^,]+),\s*([^,]+)(?:,\s*(\d{4}))?/);
          if (fullMatch) {
            const degreeText = fullMatch[1].trim();
            const institutionText = fullMatch[2].trim();
            const yearText = fullMatch[3] ? fullMatch[3].trim() : '';

            // Check if this looks like a degree
            if (degreeText.match(/(?:degree|bachelor|master|doctor|diploma|certificate|ph\.?d|b\.?s|m\.?s|b\.?a|m\.?a|m\.?b\.?a)/i) || 
                institutionText.match(/(?:university|college|school|institute|academy)/i)) {
              education.push({
                degree: degreeText,
                institution: institutionText,
                location: '',
                graduationDate: yearText
              });
            }
          }
        }
      }
    }

    // Format 4: Simple degree detection
    if (education.length === 0) {
      // Look for common degree patterns in the text
      const degreePatterns = [
        /(?:Bachelor|B\.?S|B\.?A)[^,\n]*(?:in|of)[^,\n]+/gi,
        /(?:Master|M\.?S|M\.?A|M\.?B\.?A)[^,\n]*(?:in|of)[^,\n]+/gi,
        /(?:Ph\.?D|Doctor|Doctorate)[^,\n]*(?:in|of)[^,\n]+/gi,
        /Associate[^,\n]*(?:in|of)[^,\n]+/gi
      ];

      for (const pattern of degreePatterns) {
        const matches = educationText.match(pattern);
        if (matches) {
          for (const match of matches) {
            // Try to find the institution near the degree
            const degreeIndex = educationText.indexOf(match);
            const contextStart = Math.max(0, degreeIndex - 50);
            const contextEnd = Math.min(educationText.length, degreeIndex + match.length + 100);
            const context = educationText.substring(contextStart, contextEnd);

            // Look for institution names
            const institutionMatch = context.match(/(?:at|from)\s+([A-Z][A-Za-z\s&]+)/) || 
                                    context.match(/([A-Z][A-Za-z\s&]+)(?:University|College|Institute|School)/);

            // Look for dates
            const dateMatch = context.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})/i);

            education.push({
              degree: match.trim(),
              institution: institutionMatch ? institutionMatch[1].trim() : '',
              location: '',
              graduationDate: dateMatch ? dateMatch[0].trim() : ''
            });
          }
        }
      }
    }
  } else {
    console.log('No education section found'); // Debug log
  }

  console.log('Extracted education:', education.length); // Debug log
  return education;
}

/**
 * Extract skills from text
 */
function extractSkills(text: string): Skill[] {
  // Look for skills section with more flexible patterns
  const skillsPatterns = [
    // Standard skills section
    /(?:skills|technical skills|competencies|expertise|key skills|core competencies)[:.\s]*\n([^]*?)(?=\n\s*(?:experience|education|activities|interests|projects|work|academic):)/is,

    // Skills section with uppercase header
    /SKILLS\s*\n([^]*?)(?=\n\s*(?:EXPERIENCE|EDUCATION|WORK|EMPLOYMENT):)/is,

    // Skills section without clear end marker
    /(?:skills|technical skills|competencies|expertise|key skills|core competencies)[:.\s]*\n([^]*?)(?=\n\s*\n\s*[A-Z][A-Z\s]+\s*\n)/is,

    // Skills section at the end of the document
    /(?:skills|technical skills|competencies|expertise|key skills|core competencies|abilities)[:.\s]*\n([^]*?)$/is,
    /SKILLS(?:\s*&\s*ABILITIES)?[:.\s]*\n([^]*?)$/is
  ];

  // First try to find a dedicated skills section
  let skillsText = '';
  for (const pattern of skillsPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim()) {
      skillsText = match[1];
      console.log('Skills section found:', skillsText.substring(0, 200) + '...'); // Debug log
      break;
    }
  }

  const skillsArray: Skill[] = [];

  if (skillsText) {
    // Extract skills from bullet points or lines
    const skillLines = skillsText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-•*]\s*/, '')); // Remove bullet points

    // Process skills based on format
    if (skillsText.includes(',')) {
      // If skills are comma-separated
      const commaSkills = skillsText
        .replace(/\n/g, ', ') // Replace newlines with commas
        .replace(/,\s*,/g, ',') // Remove double commas
        .replace(/^\s*,\s*/, '') // Remove leading comma
        .replace(/\s*,\s*$/, '') // Remove trailing comma
        .trim()
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      commaSkills.forEach(skill => {
        skillsArray.push({
          name: skill,
          category: inferSkillCategory(skill)
        });
      });
    } else if (skillsText.includes('|')) {
      // If skills are pipe-separated
      const pipeSkills = skillsText
        .split('|')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      pipeSkills.forEach(skill => {
        skillsArray.push({
          name: skill,
          category: inferSkillCategory(skill)
        });
      });
    } else {
      // If skills are on separate lines
      skillLines.forEach(skill => {
        if (skill.length > 0) {
          skillsArray.push({
            name: skill,
            category: inferSkillCategory(skill)
          });
        }
      });
    }

    console.log('Extracted skills from section:', skillsArray.length); // Debug log

    if (skillsArray.length > 0) {
      return skillsArray;
    }
  }

  // If no dedicated skills section found or no skills extracted, try to extract skills from the entire text
  // First, look for phrases that are likely to be skills
  const skillPhrases = [];

  // Common skill phrase patterns
  const skillPhrasePatterns = [
    /(?:proficient|skilled|experienced|expert|knowledgeable)\s+(?:in|with)\s+([^.,;]+)/gi,
    /(?:strong|excellent|advanced|intermediate|basic)\s+([^.,;]+?)\s+(?:skills|knowledge|abilities|proficiency)/gi,
    /([^.,;:]+?)\s+(?:skills|proficiency|expertise|knowledge)/gi
  ];

  for (const pattern of skillPhrasePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].trim().length > 3) {
        skillPhrases.push(match[1].trim());
      }
    }
  }

  // Also look for bullet points that might be skills
  const bulletPointSkills = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      const skillText = trimmedLine.substring(1).trim();
      if (skillText.length > 3 && skillText.length < 50 && !skillText.includes('.')) {
        bulletPointSkills.push(skillText);
      }
    }
  }

  // Combine the extracted skill phrases with bullet points
  const extractedPhrases = [...new Set([...skillPhrases, ...bulletPointSkills])];

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
    'Project Management', 'Leadership', 'Communication', 'Problem Solving',
    'Microsoft Office', 'Excel', 'Word', 'PowerPoint', 'Outlook',
    'Customer Service', 'Sales', 'Marketing', 'Accounting', 'Finance',
    'Teamwork', 'Time Management', 'Organization', 'Attention to Detail',
    'POS systems', 'Poised under pressure', 'Interpersonal', 'Budgeting',
    'Recruiting', 'Training', 'Inventory management', 'Scheduling',
    'Presentation', 'Negotiation', 'Research', 'Analysis', 'Writing',
    'Editing', 'Public speaking', 'Event planning', 'Social media'
  ];

  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );

  // Combine all found skills
  const allSkills = [...new Set([...extractedPhrases, ...foundSkills])];

  // Convert to Skill objects
  allSkills.forEach(skill => {
    skillsArray.push({
      name: skill,
      category: inferSkillCategory(skill)
    });
  });

  console.log('Extracted skills:', skillsArray.length); // Debug log
  return skillsArray;
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
  if (typeof cvData.skills === 'string' && cvData.skills.trim()) {
    score += 8;
  } else if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
    score += 8;
  }

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

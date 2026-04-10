import { NextResponse } from 'next/server';
import * as cvParser from '../../../lib/cv-parser';
import { CVFileType } from '../../../lib/cv-parser';
import { classifyCV, extractRegistrations, detectSAFlags } from '../../../lib/profile-scorer';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // File size check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Please upload a file smaller than 10MB.' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Add file type check with fallback
    let fileType;
    try {
      fileType = await cvParser.detectFileType(buffer);
    } catch (error) {
      // Fallback to file extension
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension === 'pdf') fileType = CVFileType.PDF;
      else if (extension === 'docx') fileType = CVFileType.DOCX;
      else if (extension === 'txt') fileType = CVFileType.TXT;
      else fileType = CVFileType.UNKNOWN;
    }
    
    if (fileType === CVFileType.UNKNOWN) {
      return NextResponse.json({ 
        error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.' 
      }, { status: 400 });
    }
    

    
    let rawText = '';
    let result: any = { success: false };
    
    // Multiple parsing attempts with fallbacks
    try {
      rawText = await cvParser.extractTextFromFile(buffer, fileType);
      if (rawText && rawText.length > 10) {
        const complexResult = await cvParser.parseCV(buffer);
        if (complexResult.success) result = complexResult;
      }
    } catch {
      // fall through to next attempt
    }
    
    if (!result.success) {
      try {
        // Attempt 2: Complex parser
        const complexResult = await cvParser.parseCV(buffer);
        if (complexResult.success) {
          return NextResponse.json({ 
            data: complexResult.data, 
            confidence: complexResult.confidence,
            rawText: complexResult.rawText
          });
        }
      } catch {
        // fall through to basic extraction
      }
    }
    
    if (!result.success && rawText) {
      // Attempt 3: Basic text extraction with minimal parsing
      result = {
        success: true,
        data: {
          personalInfo: {
            fullName: extractName(rawText) || '',
            email: extractEmail(rawText) || '',
            phone: extractPhone(rawText) || '',
            location: '',
            jobTitle: ''
          },
          summary: '',
          experience: [],
          education: [],
          skills: extractSkills(rawText) || ''
        },
        confidence: 30
      };
    }



    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Parsing failed',
        rawText: rawText
      }, { status: 500 });
    }

    // Phase 5: Enrich parsed CV with profile classification, registrations, SA flags
    if (result.success && result.data) {
      try {
        const registrations = extractRegistrations(result.data)
        const saFlags = detectSAFlags(result.data)
        const classification = classifyCV(result.data)

        result.data.registrations = registrations
        result.data.saFlags = saFlags
        result.data.detectedJobFamily = classification.topMatch.profileId
        result.data.familyConfidence = classification.topMatch.matchScore / 100
      } catch {
        // enrichment is best-effort — don't fail the parse if it errors
      }
    }

    return NextResponse.json({ 
      data: result.data, 
      confidence: result.confidence || 50,
      rawText: rawText,
      parseMethod: result.success ? 'success' : 'partial',
      classification: result.data?.detectedJobFamily ? {
        family: result.data.detectedJobFamily,
        confidence: result.data.familyConfidence
      } : null
    });
  } catch (error) {
    console.error('Error parsing CV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Return user-friendly error with suggestions
    return NextResponse.json({ 
      error: 'Unable to parse CV automatically. Please try:', 
      suggestions: [
        'Use a different file format (PDF works best)',
        'Ensure the file is not password protected',
        'Try a simpler CV format without complex layouts',
        'Enter your details manually using the form below'
      ],
      technical: errorMessage
    }, { status: 500 });
  }
}

// Helper functions for basic text extraction
function extractName(text: string): string | null {
  const lines = text.split('\n').slice(0, 5);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 2 && trimmed.length < 50 && /^[A-Za-z\s]+$/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const phoneRegex = /(?:\+27|0)[0-9\s-]{8,}/;
  const match = text.match(phoneRegex);
  return match ? match[0].trim() : null;
}

function extractSkills(text: string): string | null {
  const skillKeywords = ['javascript', 'python', 'java', 'react', 'angular', 'vue', 'nodejs', 'sql', 'html', 'css'];
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill)
  );
  return foundSkills.length > 0 ? foundSkills.join(', ') : null;
}

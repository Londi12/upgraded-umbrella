import { NextResponse } from 'next/server';
import * as cvParser from '../../../lib/cv-parser';
import { parseSimpleCV } from '../../../lib/simple-cv-parser';
import { CVFileType } from '../../../lib/cv-parser';

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
    
      console.log(`Processing ${file.name} (${fileType}) - size: ${buffer.length} bytes`);
    
    let rawText = '';
    let result: any = { success: false };
    
    // Multiple parsing attempts with fallbacks
    try {
      // Attempt 1: Extract text and use simple parser
      rawText = await cvParser.extractTextFromFile(buffer, fileType);
      if (rawText && rawText.length > 10) {
        result = parseSimpleCV(rawText);
      }
    } catch (error) {
      console.log('Simple parser failed, trying complex parser');
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
      } catch (error) {
        console.log('Complex parser failed, using basic extraction');
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

    // Log template detection result
    if (result.success) {
      if (result.ownTemplate) {
        console.log(`Detected our own template: ${result.templateType} (confidence: ${result.confidence}%)`);
      } else {
        console.log(`Parsed external CV (confidence: ${result.confidence}%)`);
      }
    }

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Parsing failed',
        rawText: rawText
      }, { status: 500 });
    }

    return NextResponse.json({ 
      data: result.data, 
      confidence: result.confidence || 50,
      rawText: rawText,
      parseMethod: result.success ? 'success' : 'partial'
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

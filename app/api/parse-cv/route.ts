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

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Add file type check
    const fileType = await cvParser.detectFileType(buffer);
    if (fileType === CVFileType.UNKNOWN) {
      return NextResponse.json({ 
        error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.' 
      }, { status: 400 });
    }
    
      console.log(`Processing ${file.name} (${fileType}) - size: ${buffer.length} bytes`);
    
    // Extract text first
    const rawText = await cvParser.extractTextFromFile(buffer, fileType);
    
    // Use simple parser for better reliability
    const result = parseSimpleCV(rawText);
    
    if (!result.success) {
      // Fallback to complex parser
      const complexResult = await cvParser.parseCV(buffer);
      if (complexResult.success) {
        return NextResponse.json({ 
          data: complexResult.data, 
          confidence: complexResult.confidence,
          rawText: complexResult.rawText
        });
      }
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
      confidence: 85, // Default confidence for simple parser
      rawText: rawText
    });
  } catch (error) {
    console.error('Error parsing CV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    console.error('Error details:', errorMessage);
    console.error('Stack trace:', errorStack);
    return NextResponse.json({ error: `Failed to parse CV: ${errorMessage}. Debug Info: Check the browser console for detailed error logs. There might be an issue with the file processing library. Please try a different file format or enter your details manually.` }, { status: 500 });
  }
}

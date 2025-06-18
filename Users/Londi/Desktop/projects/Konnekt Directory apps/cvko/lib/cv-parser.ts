
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
      // If fileType can't detect it and it's not text, it's unknown
      return CVFileType.UNKNOWN; // Directly return enum value
    }
    
    switch (type.mime) {
      case 'application/pdf':
        return CVFileType.PDF; // Directly return enum value
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return CVFileType.DOCX; // Directly return enum value
      default:
        return CVFileType.UNKNOWN; // Directly return enum value
    }
  } catch (error) {
    console.error('Error detecting file type:', error);
    // If there's an error, try to check if it's text as fallback
    const isText = isTextFile(buffer);
    return isText ? CVFileType.TXT : CVFileType.UNKNOWN; // Directly return enum value
  }
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

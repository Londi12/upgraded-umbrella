import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseCV, CVFileType, detectFileType } from '../lib/cv-parser';

describe('CV Parser', () => {
  describe('File Type Detection', () => {
    it('should detect PDF files', async () => {
      // This is a mock test since we don't have actual files
      // In a real test, you would read a real PDF file
      const mockPDFBuffer = Buffer.from('%PDF-1.4\n');
      const fileType = await detectFileType(mockPDFBuffer);
      expect(fileType).toBe(CVFileType.PDF);
    });

    it('should detect DOCX files', async () => {
      // Mock DOCX file header
      // In a real test, you would read a real DOCX file
      const mockDOCXBuffer = Buffer.from('PK\u0003\u0004', 'utf8');
      const fileType = await detectFileType(mockDOCXBuffer);
      expect(fileType).toBe(CVFileType.DOCX);
    });

    it('should detect TXT files', async () => {
      const mockTXTBuffer = Buffer.from('This is a text file content');
      const fileType = await detectFileType(mockTXTBuffer);
      expect(fileType).toBe(CVFileType.TXT);
    });
  });

  describe('Template Detection', () => {
    it('should detect our own templates', async () => {
      // Create a mock CV with our template marker
      const mockOwnTemplateCV = Buffer.from(
        'John Doe\n' +
        'Software Engineer\n' +
        'john.doe@example.com\n' +
        '<!-- CV generated using Professional template (professional) -->\n' +
        'SUMMARY\n' +
        'Experienced software engineer with expertise in React and TypeScript.'
      );

      const result = await parseCV(mockOwnTemplateCV);

      expect(result.success).toBe(true);
      expect(result.ownTemplate).toBe(true);
      expect(result.templateType).toBe('professional');
    });

    it('should parse external CVs', async () => {
      // Create a mock external CV without our template marker
      const mockExternalCV = Buffer.from(
        'John Doe\n' +
        'Software Engineer\n' +
        'john.doe@example.com\n' +
        'SUMMARY\n' +
        'Experienced software engineer with expertise in React and TypeScript.'
      );

      const result = await parseCV(mockExternalCV);

      expect(result.success).toBe(true);
      expect(result.ownTemplate).toBeFalsy();
    });
  });
});

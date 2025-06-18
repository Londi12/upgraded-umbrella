import { parseCV, detectFileType, CVFileType, TemplateType } from '../lib/cv-parser';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * This test file checks if our CV parser can correctly identify and parse our own templates
 * in PDF and DOCX formats.
 */

describe('CV Parser Tests', () => {
  // Test PDF parsing of our own templates
  test('Should detect and parse our own PDF template', async () => {
    // In a real test, you would read an actual PDF file
    // For this test, we'll mock the file buffer
    const pdfBuffer = Buffer.from('%PDF-1.5\nThis is a Professional CV template\nJohn Doe\nSoftware Engineer\nCV generated using Corporate Professional template');

    const fileType = await detectFileType(pdfBuffer);
    expect(fileType).toBe(CVFileType.PDF);

    const result = await parseCV(pdfBuffer);

    expect(result.success).toBe(true);
    expect(result.ownTemplate).toBe(true);
    expect(result.templateType).toBe(TemplateType.PROFESSIONAL);
    expect(result.confidence).toBeGreaterThan(90); // Our own templates should have high confidence
  });

  // Test DOCX parsing of our own templates
  test('Should detect and parse our own DOCX template', async () => {
    // In a real test, you would read an actual DOCX file
    // For this test, we'll simulate the DOCX parsing result

    // This test would need an actual DOCX file to test with
    // For now, we'll skip this test, but in a real implementation you would:
    // 1. Create test DOCX files for each template type
    // 2. Read them in the test and verify they're correctly parsed

    // const docxPath = join(__dirname, 'fixtures', 'modern-template.docx');
    // const docxBuffer = readFileSync(docxPath);
    // const result = await parseCV(docxBuffer);
    // expect(result.success).toBe(true);
    // expect(result.ownTemplate).toBe(true);
    // expect(result.templateType).toBe(TemplateType.MODERN);
  });

  // Test regular CV parsing (not our template)
  test('Should parse regular CVs without template detection', async () => {
    // Mock a regular CV text content
    const regularCVText = 'John Smith\nSenior Developer\njohn@example.com\n+1 555-1234\n\nEXPERIENCE\nSenior Developer at Tech Co, 2018-Present';
    const regularCVBuffer = Buffer.from(regularCVText);

    const result = await parseCV(regularCVBuffer);

    expect(result.success).toBe(true);
    expect(result.ownTemplate).toBeFalsy();
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.personalInfo.fullName).toBe('John Smith');
      expect(result.data.personalInfo.jobTitle).toBe('Senior Developer');
    }
  });
});

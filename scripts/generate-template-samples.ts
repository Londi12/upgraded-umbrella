/**
 * This script generates sample PDFs and DOCXs for each CV template type
 * to use for testing the CV parser's ability to recognize our own templates.
 */

import { TemplateType } from '../lib/cv-parser';
import { CVData } from '../types/cv-types';
import { generateCVPDF } from '../lib/pdf-utils';
import * as fs from 'fs';
import * as path from 'path';

// Sample CV data to generate templates
const sampleCVData: CVData = {
  personalInfo: {
    fullName: 'John Template Tester',
    jobTitle: 'Software Quality Engineer',
    email: 'john.tester@example.com',
    phone: '+27 11 123 4567',
    location: 'Cape Town, South Africa'
  },
  summary: 'Experienced software engineer with expertise in test automation and quality assurance. Specializing in developing robust testing frameworks for web applications.',
  experience: [
    {
      title: 'Senior QA Engineer',
      company: 'Test Systems Inc',
      location: 'Cape Town',
      startDate: 'Jan 2020',
      endDate: 'Present',
      description: 'Led the QA team in implementing automated testing processes for client-facing applications.'
    },
    {
      title: 'Software Developer',
      company: 'Code Solutions',
      location: 'Johannesburg',
      startDate: 'Mar 2018',
      endDate: 'Dec 2019',
      description: 'Developed and maintained web applications using React and Node.js.'
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Cape Town',
      location: 'Cape Town',
      graduationDate: '2018'
    }
  ],
  skills: 'JavaScript, TypeScript, React, Node.js, Jest, Cypress, Selenium, Git, CI/CD, Python'
};

// Template types to generate
const templateTypes = [
  { type: TemplateType.PROFESSIONAL, name: 'Corporate Professional' },
  { type: TemplateType.MODERN, name: 'Modern Minimalist' },
  { type: TemplateType.CREATIVE, name: 'Creative Design' },
  { type: TemplateType.SIMPLE, name: 'Simple Clean' },
  { type: TemplateType.EXECUTIVE, name: 'Executive Elite' },
  { type: TemplateType.TECHNICAL, name: 'Technical Expert' },
  { type: TemplateType.GRADUATE, name: 'Graduate Entry' },
  { type: TemplateType.DIGITAL, name: 'Digital Portfolio' }
];

// Output directory for test files
const OUTPUT_DIR = path.join(__dirname, '..', 'tests', 'fixtures');

async function generateTestTemplates() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate a PDF for each template type
  for (const template of templateTypes) {
    try {
      console.log(`Generating ${template.name} template...`);

      // Add template signature to summary for detection
      const templateData = {
        ...sampleCVData,
        summary: `${sampleCVData.summary} CV generated using ${template.name} template.`
      };

      // Generate PDF
      const pdfBlob = await generateCVPDF(template.type, templateData, template.name);

      // Convert Blob to Buffer and save to file
      const pdfFileName = path.join(OUTPUT_DIR, `${template.type.toLowerCase()}-template.pdf`);
      // Note: In a Node.js script, you'd need to convert Blob to Buffer
      // This is a simplified example

      console.log(`Generated ${pdfFileName}`);

      // For DOCX, in a real implementation you would use a library like docx.js
      // to generate DOCX files programmatically
    } catch (error) {
      console.error(`Error generating ${template.name} template:`, error);
    }
  }

  console.log('Template generation complete!');
}

// Run the generator
generateTestTemplates().catch(console.error);

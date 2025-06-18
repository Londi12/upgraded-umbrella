import { TemplateType } from './cv-parser';

/**
 * Generate a hidden marker for inclusion in exported documents to help with template detection
 * This adds a signature that can be detected when the PDF is parsed back
 */
export function generateTemplateMarker(templateType: TemplateType, templateName: string): string {
  return `<!-- CV generated using ${templateName} template (${templateType}) -->`;
}

/**
 * Generate metadata for inclusion in exported documents
 * This adds identifiable information to help with parsing our own templates
 */
export function generateTemplateMetadata(templateType: TemplateType, templateName: string): Record<string, string> {
  return {
    'generator': 'CV Builder Application',
    'template-type': templateType,
    'template-name': templateName
  };
}

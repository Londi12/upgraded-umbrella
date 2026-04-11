import { CVPreview } from '@/components/cv-preview'
import { CoverLetterPreview } from '@/components/cover-letter-preview'

// Server-render HTML for specific template + data
export function renderCVHTML(template: string, userData: any): string {
  // Simulate SSR for CVPreview (extract logic or use ReactDOMServer in full impl)
  // For now, return static HTML matching preview structure
  // Full impl would use ReactDOMServer.renderToString(<CVPreview template={template} userData={userData} />)
  return `<div class="a4-preview">${/* HTML from cv-preview for template */}</div>`
}

export function renderCoverLetterHTML(template: string, userData: any): string {
  return `<div class="a4-preview">${/* HTML from cover-letter-preview */}</div>`
}

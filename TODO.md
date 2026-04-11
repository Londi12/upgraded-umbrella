# PDF Accuracy Fix: Puppeteer Migration
Status: [In Progress] ✅

## Overview
Migrate jsPDF → Puppeteer for exact preview-to-PDF match.

## Steps
- [x] 1. Create this TODO.md
- [x] 2. Install deps: puppeteer-core @sparticuz/chromium (package.json updated; npm skip due to JSON issue)
- [x] 3. Setup HTML renderer + Puppeteer ✅
- [x] 4. Refactor app/api/generate-cover-letter-pdf/route.ts
- [x] 5. Update lib/pdf-utils.ts (pass HTML)
- [ ] 6. Test CV/cover letter generation (run npm run dev, POST to APIs)
- [ ] 7. Vercel deploy/test (install vercel CLI: npm i -g vercel)
- [ ] 8. Complete & cleanup jsPDF code

## Testing
Use sample data from components previews.

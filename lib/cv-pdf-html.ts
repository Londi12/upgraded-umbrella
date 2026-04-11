// Server-side HTML generator for CVPreview
export function generateCVHTML(template: string, userData: any): string {
  const isA4Preview = true;
  let html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style> @page { size: A4; margin: 20mm; } body { font-family: ui-sans-serif, system-ui; } </style>
</head>
<body class="bg-white p-0 m-0">
`;

  // professional template HTML (repeat for all 11 templates...)
  if (template === 'professional') {
    html += `
<div class="max-w-a4 mx-auto p-8 space-y-4">
  <!-- Full HTML from cv-preview professional case -->
  <div class="border-b-2 border-gray-800 pb-4">
    <h1 class="text-2xl font-bold text-gray-900 uppercase tracking-wide">${userData.personalInfo.fullName || 'John Smith'}</h1>
    <p class="text-base font-semibold text-gray-800 mt-1">${userData.personalInfo.jobTitle || 'Senior Financial Analyst'}</p>
    <div class="space-y-1 text-sm text-gray-700 mt-3 font-medium">
      <div>${userData.personalInfo.email || 'john.smith@email.com'}</div>
      <div>${userData.personalInfo.phone || '+27 11 123 4567'}</div>
      <div>${userData.personalInfo.location || 'Johannesburg, SA'}</div>
    </div>
  </div>
  <!-- Add summary, experience, education, skills HTML... -->
</div>`;
  }
  // TODO: Add other templates...
  html += '</body></html>';
  return html;
}

// Placeholder for cover letters
export function generateCoverLetterHTML(template: string, userData: any): string {
  return '<div>A4 Cover Letter HTML</div>';
}

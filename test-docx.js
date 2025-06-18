const fs = require('fs');

async function testDOCXParsing() {
  try {
    // Create a simple DOCX file with CV content
    const docxContent = `
John Smith
Software Engineer

Email: john.smith@email.com
Phone: +1 555-123-4567
Location: San Francisco, CA

SUMMARY
Experienced software engineer with expertise in full-stack development.

EXPERIENCE
Senior Software Engineer
Tech Company Inc. - San Francisco, CA
January 2020 - Present
• Led development of microservices architecture
• Implemented CI/CD pipelines

EDUCATION
B.S. Computer Science
University of California - Berkeley, CA
Graduated: May 2015

SKILLS
Programming: JavaScript, Python, Java
Frameworks: React, Node.js, Django
Tools: Git, Docker, AWS
`;

    // Write content to file
    fs.writeFileSync('test-cv.docx', docxContent);
    
    // Test DOCX parsing
    const fileBuffer = fs.readFileSync('test-cv.docx');
    
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    formData.append('file', blob, 'test-cv.docx');

    const response = await fetch('http://localhost:3001/api/parse-cv', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('DOCX Parsing Test:');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('DOCX Test Error:', error);
  }
}

testDOCXParsing();

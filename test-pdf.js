const fs = require('fs');

async function testPDFParsing() {
  try {
    // Create a minimal valid PDF with CV content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(John Doe) Tj
0 -20 Td
(Software Engineer) Tj
0 -20 Td
(john.doe@email.com) Tj
0 -20 Td
(+1 555-123-4567) Tj
0 -40 Td
(EXPERIENCE) Tj
0 -20 Td
(Senior Developer at Tech Corp) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000251 00000 n 
0000000503 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
580
%%EOF`;

    // Write PDF to file
    fs.writeFileSync('test-cv.pdf', pdfContent);
    
    // Test the PDF parsing
    const fileBuffer = fs.readFileSync('test-cv.pdf');
    
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'test-cv.pdf');

    const response = await fetch('http://localhost:3001/api/parse-cv', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('PDF Parsing Test:');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('PDF Test Error:', error);
  }
}

testPDFParsing();

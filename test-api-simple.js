const fs = require('fs');

async function testCVParsing() {
  try {
    // Read the file content as buffer
    const fileBuffer = fs.readFileSync('test-invalid.txt');
    
    // Create a proper FormData using the built-in FormData API
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'text/plain' });
    formData.append('file', blob, 'test-invalid.txt');

    const response = await fetch('http://localhost:3001/api/parse-cv', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testCVParsing();

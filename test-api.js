const fs = require('fs');

async function testCVParsing() {
  try {
    // Read the file content
    const fileContent = fs.readFileSync('test-cv.txt');
    
    // Create a simple FormData-like structure
    const boundary = '----formdata-boundary-' + Math.random().toString(36);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test-cv.txt"',
      'Content-Type: text/plain',
      '',
      fileContent.toString(),
      `--${boundary}--`
    ].join('\r\n');

    const response = await fetch('http://localhost:3000/api/parse-cv', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
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

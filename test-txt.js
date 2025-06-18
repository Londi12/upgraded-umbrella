const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testTXTParsing() {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync('test-cv.txt');
    formData.append('file', fileBuffer, 'test-cv.txt');
    
    const response = await fetch('http://localhost:3000/api/parse-cv', {
      method: 'POST',
      body: formData
    });
    
    console.log('TXT CV Parsing Test:');
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('TXT Test Error:', error.message);
  }
}

testTXTParsing();

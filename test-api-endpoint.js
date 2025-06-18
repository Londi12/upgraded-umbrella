const fs = require('fs');
const path = require('path');

async function testAPIEndpoint() {
  try {
    console.log('Testing CV Parser API Endpoint...\n');
    
    // Test 1: Check if test file exists
    const testFilePath = path.join(__dirname, 'test-cv.txt');
    if (!fs.existsSync(testFilePath)) {
      console.error('❌ Test file not found:', testFilePath);
      return;
    }
    
    console.log('✅ Test file found');
    
    // Test 2: Read file content
    const fileBuffer = fs.readFileSync(testFilePath);
    console.log('✅ File read successfully, size:', fileBuffer.length, 'bytes');
    
    // Test 3: Create FormData manually (simulating browser behavior)
    const boundary = '----formdata-boundary-' + Math.random().toString(36);
    const formDataBody = createFormDataBody(fileBuffer, 'test-cv.txt', boundary);
    
    console.log('✅ FormData created');
    
    // Test 4: Make API request
    console.log('🔄 Making API request to http://localhost:3000/api/parse-cv...');
    
    const response = await fetch('http://localhost:3000/api/parse-cv', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: formDataBody
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    try {
      const data = JSON.parse(responseText);
      
      if (response.ok) {
        console.log('\n✅ API Response Success!');
        console.log('📊 Confidence Score:', data.confidence);
        
        if (data.data) {
          console.log('\n📋 Parsed CV Data:');
          console.log('👤 Personal Info:');
          console.log('  - Name:', data.data.personalInfo?.fullName || 'Not found');
          console.log('  - Email:', data.data.personalInfo?.email || 'Not found');
          console.log('  - Phone:', data.data.personalInfo?.phone || 'Not found');
          console.log('  - Job Title:', data.data.personalInfo?.jobTitle || 'Not found');
          console.log('  - Location:', data.data.personalInfo?.location || 'Not found');
          
          console.log('\n📝 Summary:', data.data.summary ? 'Found' : 'Not found');
          if (data.data.summary) {
            console.log('  Preview:', data.data.summary.substring(0, 100) + '...');
          }
          
          console.log('\n💼 Experience:', data.data.experience?.length || 0, 'entries');
          if (data.data.experience && data.data.experience.length > 0) {
            data.data.experience.forEach((exp, i) => {
              console.log(`  ${i + 1}. ${exp.title} at ${exp.company}`);
            });
          }
          
          console.log('\n🎓 Education:', data.data.education?.length || 0, 'entries');
          if (data.data.education && data.data.education.length > 0) {
            data.data.education.forEach((edu, i) => {
              console.log(`  ${i + 1}. ${edu.degree} from ${edu.institution}`);
            });
          }
          
          console.log('\n🛠️ Skills:', data.data.skills ? 'Found' : 'Not found');
          if (data.data.skills) {
            if (Array.isArray(data.data.skills)) {
              console.log('  Count:', data.data.skills.length);
              console.log('  Sample:', data.data.skills.slice(0, 5).map(s => s.name || s).join(', '));
            } else {
              console.log('  Preview:', data.data.skills.substring(0, 100) + '...');
            }
          }
        }
      } else {
        console.log('\n❌ API Error:', data.error);
      }
    } catch (parseError) {
      console.log('\n❌ Failed to parse JSON response:', parseError.message);
      console.log('Raw response was:', responseText);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the development server is running with: npm run dev');
    }
  }
}

function createFormDataBody(fileBuffer, filename, boundary) {
  const chunks = [];
  
  // Add file field
  chunks.push(`--${boundary}\r\n`);
  chunks.push(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`);
  chunks.push(`Content-Type: text/plain\r\n\r\n`);
  chunks.push(fileBuffer);
  chunks.push(`\r\n--${boundary}--\r\n`);
  
  return Buffer.concat(chunks.map(chunk => 
    typeof chunk === 'string' ? Buffer.from(chunk) : chunk
  ));
}

// Use dynamic import for fetch if not available
async function fetch(url, options) {
  if (typeof globalThis.fetch === 'undefined') {
    const { default: nodeFetch } = await import('node-fetch');
    return nodeFetch(url, options);
  }
  return globalThis.fetch(url, options);
}

testAPIEndpoint();

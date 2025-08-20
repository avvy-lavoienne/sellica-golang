#!/usr/bin/env node

/**
 * Test Heroku deployment of SELLY with IndoBERT
 */

async function testHerokuDeployment() {
  console.log('🚀 Testing SELLY Heroku Deployment\n');

  // Get app URLs from command line arguments or use defaults
  const frontendUrl = process.argv[2] || 'https://selly-frontend.herokuapp.com';
  const backendUrl = process.argv[3] || 'https://selly-indobert.herokuapp.com';

  console.log('📋 Testing URLs:');
  console.log(`   Frontend: ${frontendUrl}`);
  console.log(`   Backend:  ${backendUrl}`);
  console.log('');

  // Test 1: Backend Health Check
  console.log('🔍 Test 1: Backend Health Check');
  try {
    const response = await fetch(`${backendUrl}/`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running');
      console.log(`   Status: ${data.status}`);
      console.log(`   Service: ${data.service}`);
    } else {
      console.log(`❌ Backend health check failed: ${response.status}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to backend: ${error.message}`);
    console.log('💡 Make sure your backend app is deployed and running');
    return;
  }

  // Test 2: Backend IndoBERT Processing
  console.log('\n🔍 Test 2: IndoBERT Processing');
  try {
    const response = await fetch(`${backendUrl}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Halo, saya adalah SELLY, asisten AI untuk sistem SELLICA.',
        task: 'feature-extraction',
        model_name: 'indobert-base',
        max_length: 512
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('✅ IndoBERT processing works');
        console.log(`   Processing time: ${result.processing_time.toFixed(3)}s`);
        console.log(`   Model used: ${result.model_used}`);
      } else {
        console.log(`❌ IndoBERT processing failed: ${result.error}`);
      }
    } else {
      console.log(`❌ IndoBERT request failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ IndoBERT test error: ${error.message}`);
  }

  // Test 3: Frontend Health Check
  console.log('\n🔍 Test 3: Frontend Health Check');
  try {
    const response = await fetch(frontendUrl);
    if (response.ok) {
      console.log('✅ Frontend is accessible');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log(`❌ Frontend not accessible: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Cannot connect to frontend: ${error.message}`);
  }

  // Test 4: Frontend API Integration
  console.log('\n🔍 Test 4: Frontend-Backend Integration');
  try {
    const response = await fetch(`${frontendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Halo SELLY, tolong analisis teks ini menggunakan IndoBERT',
        context: { test: true, deployment: 'heroku' }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Frontend-Backend integration works');
      console.log(`   Response: "${result.response?.substring(0, 100)}..."`);
      console.log(`   AI Provider: ${result.metadata?.aiProvider || 'unknown'}`);
    } else {
      console.log(`❌ Integration test failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Integration test error: ${error.message}`);
  }

  // Test 5: Test Page Accessibility
  console.log('\n🔍 Test 5: Test Page Accessibility');
  try {
    const response = await fetch(`${frontendUrl}/test-hf`);
    if (response.ok) {
      console.log('✅ Test page is accessible');
      console.log(`   URL: ${frontendUrl}/test-hf`);
    } else {
      console.log(`❌ Test page not accessible: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Test page error: ${error.message}`);
  }

  // Performance Test
  console.log('\n🔍 Performance Test: Response Times');
  const performanceTests = [
    { name: 'Backend Health', url: `${backendUrl}/` },
    { name: 'Frontend Home', url: frontendUrl },
    { name: 'IndoBERT Process', url: `${backendUrl}/process`, method: 'POST', body: {
      text: 'Test performance',
      task: 'feature-extraction',
      model_name: 'indobert-base'
    }}
  ];

  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      
      const options = {
        method: test.method || 'GET',
        headers: test.body ? { 'Content-Type': 'application/json' } : {},
        body: test.body ? JSON.stringify(test.body) : undefined
      };

      const response = await fetch(test.url, options);
      const duration = Date.now() - startTime;

      if (response.ok) {
        console.log(`   ✅ ${test.name}: ${duration}ms`);
      } else {
        console.log(`   ❌ ${test.name}: ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: Error - ${error.message}`);
    }
  }

  console.log('\n🎉 Heroku Deployment Test Complete!');
  
  console.log('\n📋 Summary:');
  console.log('   🌐 Frontend URL:', frontendUrl);
  console.log('   🤖 Backend URL:', backendUrl);
  console.log('   🧪 Test Page:', `${frontendUrl}/test-hf`);
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Open the test page and try Indonesian queries');
  console.log('   2. Monitor logs: heroku logs --tail -a your-app-name');
  console.log('   3. Scale dynos if needed: heroku ps:scale web=1:standard-2x');
  console.log('   4. Set up monitoring and alerts');
}

// Run the test
if (require.main === module) {
  testHerokuDeployment().catch(console.error);
}

module.exports = { testHerokuDeployment };

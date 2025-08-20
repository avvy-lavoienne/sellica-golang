/**
 * Test Script for Enhanced Response System
 * Run this to verify the DeepSeek enhancement integration
 */

// This script can be run in the browser console or Node.js environment

async function testEnhancedResponse() {
  console.log('🧪 Testing Enhanced Response System...');
  
  try {
    // Test basic query
    const testQuery = "Berapa total pengajuan salah rekam bulan ini?";
    console.log(`📝 Testing query: "${testQuery}"`);
    
    // Make API call to chat endpoint
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testQuery,
        context: {
          userId: 'test-user',
          sessionId: 'test-session'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received:');
    console.log('📊 Response Data:', {
      success: data.success,
      type: data.type,
      contentLength: data.response?.length || 0,
      aiProvider: data.metadata?.aiProvider,
      deepSeekEnhanced: data.metadata?.deepSeekEnhanced,
      confidence: data.metadata?.confidence,
      processingTime: data.metadata?.enhancementMetadata?.processingTime
    });
    
    console.log('📝 Response Content:');
    console.log(data.response);
    
    // Check if enhancement worked
    if (data.metadata?.deepSeekEnhanced) {
      console.log('🎯 ✅ DeepSeek enhancement was applied successfully!');
      
      if (data.metadata?.originalContent) {
        console.log('📈 Enhancement Comparison:');
        console.log(`  Original length: ${data.metadata.originalContent.length} chars`);
        console.log(`  Enhanced length: ${data.response.length} chars`);
        console.log(`  Improvement ratio: ${(data.response.length / data.metadata.originalContent.length).toFixed(2)}x`);
      }
    } else {
      console.log('⚠️ DeepSeek enhancement was not applied (fallback used)');
      
      if (data.metadata?.enhancementMetadata?.error) {
        console.log(`❌ Enhancement error: ${data.metadata.enhancementMetadata.error}`);
      }
    }
    
    return {
      success: true,
      enhanced: data.metadata?.deepSeekEnhanced || false,
      response: data.response,
      metadata: data.metadata
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test multiple queries
async function testMultipleQueries() {
  console.log('🧪 Testing Multiple Queries...');
  
  const testQueries = [
    "Berapa total pengajuan salah rekam bulan ini?",
    "Tampilkan statistik pengguna SELLICA",
    "Bagaimana cara menggunakan sistem ini?",
    "Cari data dengan NIK 1234567890123456"
  ];
  
  const results = [];
  
  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n📝 Test ${i + 1}/${testQueries.length}: "${query}"`);
    
    const result = await testSingleQuery(query);
    results.push({
      query,
      ...result
    });
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`Total queries: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Enhanced: ${results.filter(r => r.enhanced).length}`);
  console.log(`Enhancement rate: ${(results.filter(r => r.enhanced).length / results.length * 100).toFixed(1)}%`);
  
  return results;
}

async function testSingleQuery(query) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        context: {
          userId: 'test-user',
          sessionId: 'test-session'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    const enhanced = data.metadata?.deepSeekEnhanced || false;
    console.log(`  ${enhanced ? '🎯' : '⚪'} Enhanced: ${enhanced}`);
    console.log(`  📏 Length: ${data.response?.length || 0} chars`);
    
    return {
      success: true,
      enhanced,
      response: data.response,
      metadata: data.metadata
    };
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return {
      success: false,
      enhanced: false,
      error: error.message
    };
  }
}

// Configuration test
async function testConfiguration() {
  console.log('🔧 Testing Configuration...');
  
  // Check environment variables
  const config = {
    deepSeekEnabled: typeof process !== 'undefined' ? 
      process.env?.NEXT_PUBLIC_ENABLE_DEEPSEEK_ENHANCEMENT === 'true' : 
      'Unknown (browser environment)',
    deepSeekApiKey: typeof process !== 'undefined' ? 
      !!process.env?.DEEPSEEK_API_KEY : 
      'Unknown (browser environment)',
    huggingFaceEnabled: typeof process !== 'undefined' ? 
      process.env?.NEXT_PUBLIC_ENABLE_HUGGINGFACE === 'true' : 
      'Unknown (browser environment)',
    tensorFlowEnabled: typeof process !== 'undefined' ? 
      process.env?.NEXT_PUBLIC_ENABLE_TENSORFLOW === 'true' : 
      'Unknown (browser environment)'
  };
  
  console.log('📋 Configuration Status:', config);
  
  return config;
}

// Export functions for use
if (typeof window !== 'undefined') {
  // Browser environment
  window.testEnhancedResponse = testEnhancedResponse;
  window.testMultipleQueries = testMultipleQueries;
  window.testConfiguration = testConfiguration;
  
  console.log('🎯 Enhanced Response Test Functions Available:');
  console.log('  - testEnhancedResponse()');
  console.log('  - testMultipleQueries()');
  console.log('  - testConfiguration()');
} else {
  // Node.js environment
  module.exports = {
    testEnhancedResponse,
    testMultipleQueries,
    testConfiguration
  };
}

// Auto-run configuration test
testConfiguration();

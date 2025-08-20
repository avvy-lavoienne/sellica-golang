/**
 * Debug Script for DeepSeek Enhancement
 * Run this in browser console to debug why enhancement isn't working
 */

async function debugDeepSeekEnhancement() {
  console.log('🔍 Debugging DeepSeek Enhancement...');
  
  try {
    // Test 1: Check environment variables
    console.log('\n📋 Step 1: Environment Variables Check');
    const envCheck = {
      deepSeekEnabled: 'NEXT_PUBLIC_ENABLE_DEEPSEEK_ENHANCEMENT should be true',
      huggingFaceEnabled: 'NEXT_PUBLIC_ENABLE_HUGGINGFACE should be true',
      tensorFlowEnabled: 'NEXT_PUBLIC_ENABLE_TENSORFLOW should be true'
    };
    console.log('Environment variables (client-side):', envCheck);
    
    // Test 2: Make API call with detailed logging
    console.log('\n📋 Step 2: API Call Test');
    const testQuery = "ada berapa kolom adjudicate record";
    console.log(`Testing query: "${testQuery}"`);
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testQuery,
        context: {
          userId: 'debug-user',
          sessionId: 'debug-session',
          debug: true
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Test 3: Analyze response metadata
    console.log('\n📋 Step 3: Response Analysis');
    console.log('✅ API Response received');
    console.log('📊 Response Metadata:', {
      success: data.success,
      type: data.type,
      contentLength: data.response?.length || 0,
      aiProvider: data.metadata?.aiProvider,
      deepSeekEnhanced: data.metadata?.deepSeekEnhanced,
      originalContent: data.metadata?.originalContent ? 'Available' : 'Not available',
      enhancementMetadata: data.metadata?.enhancementMetadata,
      confidence: data.metadata?.confidence,
      aiEnhanced: data.metadata?.aiEnhanced
    });
    
    // Test 4: Check for enhancement indicators
    console.log('\n📋 Step 4: Enhancement Indicators');
    const enhancementIndicators = {
      deepSeekEnhanced: data.metadata?.deepSeekEnhanced || false,
      hasOriginalContent: !!data.metadata?.originalContent,
      hasEnhancementMetadata: !!data.metadata?.enhancementMetadata,
      enhancementError: data.metadata?.enhancementMetadata?.error,
      fallbackUsed: data.metadata?.enhancementMetadata?.fallbackUsed
    };
    
    console.log('Enhancement Status:', enhancementIndicators);
    
    // Test 5: Content comparison
    if (data.metadata?.originalContent) {
      console.log('\n📋 Step 5: Content Comparison');
      console.log('📝 Original Response:');
      console.log(data.metadata.originalContent);
      console.log('\n📝 Enhanced Response:');
      console.log(data.response);
      
      const improvementRatio = data.response.length / data.metadata.originalContent.length;
      console.log(`📈 Improvement Ratio: ${improvementRatio.toFixed(2)}x`);
    } else {
      console.log('\n⚠️ Step 5: No original content available for comparison');
    }
    
    // Test 6: Check for common issues
    console.log('\n📋 Step 6: Common Issues Check');
    const issues = [];
    
    if (!data.metadata?.deepSeekEnhanced) {
      issues.push('DeepSeek enhancement was not applied');
    }
    
    if (data.metadata?.enhancementMetadata?.fallbackUsed) {
      issues.push('Enhancement fallback was used');
    }
    
    if (data.metadata?.enhancementMetadata?.error) {
      issues.push(`Enhancement error: ${data.metadata.enhancementMetadata.error}`);
    }
    
    if (data.metadata?.aiProvider !== 'huggingface' && data.metadata?.aiProvider !== 'deepseek') {
      issues.push(`Unexpected AI provider: ${data.metadata.aiProvider}`);
    }
    
    if (issues.length > 0) {
      console.log('❌ Issues Found:');
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ No obvious issues found');
    }
    
    return {
      success: true,
      enhanced: data.metadata?.deepSeekEnhanced || false,
      issues,
      metadata: data.metadata,
      response: data.response
    };
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test configuration endpoint
async function testConfigurationEndpoint() {
  console.log('🔧 Testing Configuration...');
  
  try {
    // Create a simple test to check if our services are properly configured
    const testResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "test configuration",
        context: { test: true }
      })
    });
    
    if (!testResponse.ok) {
      throw new Error(`Configuration test failed: ${testResponse.status}`);
    }
    
    const data = await testResponse.json();
    
    console.log('📋 Configuration Test Results:');
    console.log('  API Endpoint: ✅ Working');
    console.log('  AI Provider:', data.metadata?.aiProvider || 'Unknown');
    console.log('  DeepSeek Enhanced:', data.metadata?.deepSeekEnhanced || false);
    console.log('  Response Type:', data.type);
    
    return data;
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    return null;
  }
}

// Test specific enhancement service
async function testEnhancementService() {
  console.log('🎯 Testing Enhancement Service Directly...');
  
  // This would need to be run server-side, but we can check if the client can detect it
  console.log('Note: This test requires server-side access to enhancement services');
  console.log('Check the server console logs for enhancement processing messages');
  
  // Make a call that should trigger enhancement
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: "Berapa total pengajuan salah rekam bulan ini?",
      context: {
        userId: 'test-enhancement',
        sessionId: 'test-session'
      }
    })
  });
  
  const data = await response.json();
  
  console.log('🎯 Enhancement Service Test Results:');
  console.log('  Enhanced:', data.metadata?.deepSeekEnhanced || false);
  console.log('  Processing Time:', data.metadata?.enhancementMetadata?.processingTime || 'N/A');
  console.log('  Model Used:', data.metadata?.enhancementMetadata?.model || 'N/A');
  console.log('  Fallback Used:', data.metadata?.enhancementMetadata?.fallbackUsed || false);
  
  return data;
}

// Export functions for browser console
if (typeof window !== 'undefined') {
  window.debugDeepSeekEnhancement = debugDeepSeekEnhancement;
  window.testConfigurationEndpoint = testConfigurationEndpoint;
  window.testEnhancementService = testEnhancementService;
  
  console.log('🎯 DeepSeek Enhancement Debug Functions Available:');
  console.log('  - debugDeepSeekEnhancement()');
  console.log('  - testConfigurationEndpoint()');
  console.log('  - testEnhancementService()');
  console.log('');
  console.log('💡 Run debugDeepSeekEnhancement() to start debugging');
}

// Auto-run basic configuration test
testConfigurationEndpoint();

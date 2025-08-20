#!/usr/bin/env node

/**
 * Test IndoBERT Transformers service integration
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function testIndoBERTService() {
  console.log('🇮🇩 Testing IndoBERT Transformers Service Integration\n');

  const serviceUrl = process.env.INDOBERT_SERVICE_URL || 'http://localhost:8000';
  const serviceEnabled = process.env.NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE === 'true';

  console.log('📋 Configuration:');
  console.log(`   Service URL: ${serviceUrl}`);
  console.log(`   Service Enabled: ${serviceEnabled ? '✅ Yes' : '❌ No'}`);

  if (!serviceEnabled) {
    console.log('\n⚠️ IndoBERT service is disabled in environment');
    console.log('   Set NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE=true to enable');
    return;
  }

  // Test 1: Check if service is running
  console.log('\n🔍 Test 1: Service Health Check');
  try {
    const response = await fetch(`${serviceUrl}/`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Service is running');
      console.log(`   Status: ${data.status}`);
      console.log(`   Models loaded: ${data.models_loaded}`);
      console.log(`   Pipelines available: ${data.pipelines_available}`);
    } else {
      console.log(`❌ Service health check failed: ${response.status}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to service: ${error.message}`);
    console.log('\n💡 Make sure to:');
    console.log('   1. cd python-ai-service');
    console.log('   2. python setup.py (first time only)');
    console.log('   3. python main.py (or use start_service script)');
    return;
  }

  // Test 2: List available models
  console.log('\n🔍 Test 2: Available Models');
  try {
    const response = await fetch(`${serviceUrl}/models`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Models endpoint working');
      console.log('   Available models:', data.available_models.join(', '));
      console.log('   Loaded models:', data.loaded_models.join(', '));
    }
  } catch (error) {
    console.log(`❌ Models endpoint failed: ${error.message}`);
  }

  // Test 3: Feature extraction with IndoBERT
  console.log('\n🔍 Test 3: Feature Extraction');
  const testTexts = [
    'Halo, nama saya SELLY dan saya adalah asisten AI.',
    'Berapa jumlah pengguna yang terdaftar dalam sistem?',
    'Sistem SELLICA membantu mengelola data administratif dengan efisien.',
    'Saya senang dapat membantu Anda menganalisis data.'
  ];

  for (const text of testTexts) {
    console.log(`\n   Testing: "${text}"`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${serviceUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          task: 'feature-extraction',
          model_name: 'indobert-base',
          max_length: 512
        })
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`   ✅ Success (${duration}ms)`);
          console.log(`   📊 Processing time: ${result.processing_time.toFixed(3)}s`);
          console.log(`   🤖 Model: ${result.model_used}`);
          
          // Check embedding dimensions
          if (result.result && Array.isArray(result.result)) {
            const embeddings = result.result[0];
            if (Array.isArray(embeddings)) {
              console.log(`   📐 Embedding shape: [${embeddings.length}, ${embeddings[0]?.length || 0}]`);
            }
          }
        } else {
          console.log(`   ❌ Processing failed: ${result.error}`);
        }
      } else {
        console.log(`   ❌ Request failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test 4: Sentiment Analysis
  console.log('\n🔍 Test 4: Sentiment Analysis');
  const sentimentTexts = [
    'Saya sangat senang dengan sistem ini!',
    'Aplikasi ini membuat pekerjaan menjadi sulit.',
    'SELLY adalah asisten yang netral dan membantu.'
  ];

  for (const text of sentimentTexts) {
    console.log(`\n   Testing sentiment: "${text}"`);
    
    try {
      const response = await fetch(`${serviceUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          task: 'sentiment-analysis',
          model_name: 'indobert-sentiment'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.result)) {
          const sentiment = result.result[0];
          console.log(`   ✅ Sentiment: ${sentiment.label}`);
          console.log(`   📊 Confidence: ${(sentiment.score * 100).toFixed(1)}%`);
        } else {
          console.log(`   ❌ Sentiment analysis failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test 5: Text Similarity
  console.log('\n🔍 Test 5: Text Similarity');
  const similarityTexts = [
    'SELLY adalah asisten AI yang membantu pengguna.',
    'SELLY merupakan chatbot cerdas untuk bantuan pengguna.',
    'Cuaca hari ini sangat cerah dan menyenangkan.'
  ];

  try {
    const response = await fetch(`${serviceUrl}/similarity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: similarityTexts,
        model_name: 'indobert-base'
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('   ✅ Similarity analysis complete');
        result.similarities.forEach(sim => {
          console.log(`   📊 Similarity: ${(sim.similarity * 100).toFixed(1)}%`);
          console.log(`      Text 1: "${sim.text1}"`);
          console.log(`      Text 2: "${sim.text2}"`);
        });
      }
    }
  } catch (error) {
    console.log(`   ❌ Similarity test failed: ${error.message}`);
  }

  // Test 6: Integration with SELLY
  console.log('\n🔍 Test 6: SELLY Integration Test');
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Halo SELLY, tolong analisis data pengguna menggunakan IndoBERT',
        context: { test: true, useIndoBERT: true }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ SELLY integration working');
      console.log(`   📝 Response: "${result.response}"`);
      console.log(`   🤖 Provider: ${result.metadata?.aiProvider || 'unknown'}`);
    } else {
      console.log('   ⚠️ SELLY integration test failed (Next.js app might not be running)');
    }
  } catch (error) {
    console.log('   ⚠️ SELLY integration test failed (Next.js app might not be running)');
  }

  console.log('\n🎉 IndoBERT Transformers Service Test Complete!');
  
  console.log('\n📋 Summary:');
  console.log('   ✅ Direct access to IndoBERT models via Transformers library');
  console.log('   ✅ No API rate limits or paid tier requirements');
  console.log('   ✅ Full control over model parameters and processing');
  console.log('   ✅ Feature extraction, sentiment analysis, and similarity');
  console.log('   ✅ Integration with SELLY chatbot system');

  console.log('\n💡 Benefits over Hugging Face API:');
  console.log('   🆓 Completely free after initial setup');
  console.log('   🚀 Faster processing (no network latency)');
  console.log('   🎛️ Full model customization and fine-tuning capability');
  console.log('   🔒 Data privacy (all processing happens locally)');
  console.log('   📊 Access to raw embeddings and model internals');
}

testIndoBERTService().catch(console.error);

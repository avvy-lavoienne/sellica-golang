#!/usr/bin/env node

/**
 * Test script for Hugging Face integration
 * Run with: node scripts/test-huggingface.js
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function testHuggingFaceIntegration() {
  console.log('🧪 Testing Hugging Face Integration for SELLY\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  const hfEnabled = process.env.NEXT_PUBLIC_ENABLE_HUGGINGFACE;
  
  console.log(`   HUGGINGFACE_API_KEY: ${hfApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NEXT_PUBLIC_ENABLE_HUGGINGFACE: ${hfEnabled || '❌ Not set'}`);
  
  if (!hfApiKey || hfApiKey === 'hf_YOUR_API_KEY_HERE') {
    console.log('\n❌ Please set your Hugging Face API key in .env.local');
    console.log('   Get your key from: https://huggingface.co/settings/tokens');
    console.log('   Then replace hf_YOUR_API_KEY_HERE with your actual key');
    return;
  }

  console.log('\n🔧 Testing API Connection...');

  try {
    // Test with a simple, reliable model first
    console.log('   Testing with microsoft/DialoGPT-medium...');
    const testResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hfApiKey}`,
      },
      body: JSON.stringify({
        inputs: 'Hello, how are you?',
        parameters: {
          max_new_tokens: 50,
          temperature: 0.7,
          return_full_text: false
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      })
    });

    if (!testResponse.ok) {
      if (testResponse.status === 401) {
        console.log('❌ Authentication failed - Invalid API key');
        console.log('   Please check your HUGGINGFACE_API_KEY in .env.local');
        return;
      } else if (testResponse.status === 503) {
        console.log('⏳ Model is loading... This is normal for first request');
        console.log('   Waiting 10 seconds and trying again...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Try again
        const retryResponse = await fetch('https://api-inference.huggingface.co/models/cahya/gpt2-small-indonesian-522M', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${hfApiKey}`,
          },
          body: JSON.stringify({
            inputs: 'Halo, apa kabar?',
            parameters: {
              max_new_tokens: 50,
              temperature: 0.7,
              return_full_text: false
            }
          })
        });

        if (retryResponse.ok) {
          const result = await retryResponse.json();
          console.log('✅ Connection successful after retry!');
          console.log('📝 Sample response:', result);
        } else {
          console.log('❌ Still failing after retry:', retryResponse.status, retryResponse.statusText);
        }
      } else {
        console.log(`❌ API Error: ${testResponse.status} ${testResponse.statusText}`);
      }
    } else {
      const result = await testResponse.json();
      console.log('✅ Connection successful!');
      console.log('📝 Sample response:', result);
    }

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return;
  }

  console.log('\n🎯 Testing Indonesian Models...');

  const testQueries = [
    'Berapa jumlah pengguna dalam sistem?',
    'Tampilkan data dokumentasi terbaru',
    'Halo SELLY, apa kabar?',
    'Analisis aktivitas pengguna bulan ini'
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing: "${query}"`);
    
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/cahya/gpt2-small-indonesian-522M', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hfApiKey}`,
        },
        body: JSON.stringify({
          inputs: `Jawab dalam bahasa Indonesia yang natural:\n\nPertanyaan: ${query}\nJawaban:`,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.7,
            return_full_text: false,
            do_sample: true,
            top_p: 0.9
          },
          options: {
            wait_for_model: true
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Response:', result[0]?.generated_text?.trim() || 'No response');
      } else {
        console.log(`   ⚠️ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n🚀 Integration Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. If tests passed, your Hugging Face integration is ready');
  console.log('   2. Start your Next.js app: npm run dev');
  console.log('   3. Open SELLY chatbot and test with Indonesian queries');
  console.log('   4. Check browser console for "🤗 Using Hugging Face IndoBERT" messages');
}

// Run the test
testHuggingFaceIntegration().catch(console.error);

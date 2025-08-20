#!/usr/bin/env node

/**
 * Simple Hugging Face API test
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function simpleTest() {
  console.log('🧪 Simple Hugging Face API Test\n');

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  console.log(`API Key: ${hfApiKey ? hfApiKey.substring(0, 10) + '...' : 'Missing'}`);

  if (!hfApiKey) {
    console.log('❌ No API key found');
    return;
  }

  try {
    // First, test if API key is valid by checking user info
    console.log('🔍 Testing API key validity...');

    const userResponse = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: {
        'Authorization': `Bearer ${hfApiKey}`,
      }
    });

    if (userResponse.ok) {
      const userInfo = await userResponse.json();
      console.log('✅ API key is valid!');
      console.log(`   User: ${userInfo.name || 'Unknown'}`);
      console.log(`   Type: ${userInfo.type || 'user'}`);
    } else {
      console.log('❌ API key validation failed');
      console.log(`   Status: ${userResponse.status}`);
      return;
    }

    // Now test inference with a simple model
    console.log('\n🔍 Testing inference with distilbert-base-uncased-finetuned-sst-2-english...');

    const response = await fetch('https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'I love this product!'
      })
    });

    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Failed');
      console.log('Error:', errorText);
      
      if (response.status === 401) {
        console.log('\n💡 This means your API key is invalid or expired');
        console.log('   Please check: https://huggingface.co/settings/tokens');
      }
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

simpleTest().catch(console.error);

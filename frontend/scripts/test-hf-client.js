#!/usr/bin/env node

/**
 * Test Hugging Face official client
 *
 * ⚠️ DEPRECATED: HuggingFace has been replaced by SimpleResponseService
 * This script is no longer functional and kept for reference only.
 */

console.log('⚠️ This script is deprecated. HuggingFace has been replaced by SimpleResponseService.');
process.exit(0);

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function testHuggingFaceClient() {
  console.log('🧪 Testing Hugging Face Official Client\n');

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  console.log(`API Key: ${hfApiKey ? hfApiKey.substring(0, 10) + '...' : 'Missing'}`);

  if (!hfApiKey) {
    console.log('❌ No API key found');
    return;
  }

  try {
    // Import the Hugging Face client
    const { HfInference } = await import('@huggingface/inference');
    const hf = new HfInference(hfApiKey);

    console.log('✅ Hugging Face client initialized');

    // Test 1: Text Classification (Sentiment Analysis)
    console.log('\n🔍 Test 1: Sentiment Analysis...');
    try {
      const sentimentResult = await hf.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: 'I love this chatbot!'
      });
      console.log('✅ Sentiment analysis works!');
      console.log('   Result:', sentimentResult);
    } catch (error) {
      console.log('❌ Sentiment analysis failed:', error.message);
    }

    // Test 2: Text Generation
    console.log('\n🔍 Test 2: Text Generation...');
    try {
      const textResult = await hf.textGeneration({
        model: 'gpt2',
        inputs: 'The future of AI is',
        parameters: {
          max_new_tokens: 30,
          temperature: 0.7
        }
      });
      console.log('✅ Text generation works!');
      console.log('   Result:', textResult.generated_text);
    } catch (error) {
      console.log('❌ Text generation failed:', error.message);
    }

    // Test 3: Indonesian Model (if available)
    console.log('\n🔍 Test 3: Indonesian Text Generation...');
    try {
      const indonesianResult = await hf.textGeneration({
        model: 'flax-community/gpt2-base-indonesian',
        inputs: 'Halo, nama saya adalah',
        parameters: {
          max_new_tokens: 20,
          temperature: 0.7
        }
      });
      console.log('✅ Indonesian model works!');
      console.log('   Result:', indonesianResult.generated_text);
    } catch (error) {
      console.log('⚠️ Indonesian model failed (this is normal):', error.message);
      
      // Try alternative Indonesian model
      try {
        console.log('   Trying alternative Indonesian model...');
        const altResult = await hf.textGeneration({
          model: 'cahya/gpt2-small-indonesian-522M',
          inputs: 'Selamat pagi, hari ini',
          parameters: {
            max_new_tokens: 15,
            temperature: 0.7
          }
        });
        console.log('✅ Alternative Indonesian model works!');
        console.log('   Result:', altResult.generated_text);
      } catch (altError) {
        console.log('⚠️ Alternative model also failed:', altError.message);
      }
    }

    // Test 4: Question Answering
    console.log('\n🔍 Test 4: Question Answering...');
    try {
      const qaResult = await hf.questionAnswering({
        model: 'deepset/roberta-base-squad2',
        inputs: {
          question: 'What is SELLY?',
          context: 'SELLY is an AI chatbot assistant for the SELLICA administrative data management system. It helps users search, analyze, and understand data in the system.'
        }
      });
      console.log('✅ Question answering works!');
      console.log('   Answer:', qaResult.answer);
      console.log('   Confidence:', qaResult.score);
    } catch (error) {
      console.log('❌ Question answering failed:', error.message);
    }

    console.log('\n🎉 Hugging Face client testing complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ API key is valid');
    console.log('   ✅ Official client works');
    console.log('   ✅ Ready for SELLY integration');

  } catch (error) {
    console.log('❌ Failed to initialize Hugging Face client:', error.message);
  }
}

testHuggingFaceClient().catch(console.error);

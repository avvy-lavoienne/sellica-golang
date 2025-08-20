#!/usr/bin/env node

/**
 * Test available IndoBERT models on Hugging Face
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function testIndoBERTModels() {
  console.log('🇮🇩 Testing IndoBERT Models on Hugging Face\n');

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!hfApiKey) {
    console.log('❌ No API key found');
    return;
  }

  try {
    const { HfInference } = await import('@huggingface/inference');
    const hf = new HfInference(hfApiKey);

    // List of IndoBERT and Indonesian models to test
    const indonesianModels = [
      {
        id: 'indobenchmark/indobert-base-p1',
        name: 'IndoBERT Base P1',
        task: 'fill-mask',
        testInput: 'Saya adalah [MASK] yang membantu pengguna.'
      },
      {
        id: 'indobenchmark/indobert-base-p2',
        name: 'IndoBERT Base P2', 
        task: 'fill-mask',
        testInput: 'SELLY adalah [MASK] cerdas untuk sistem data.'
      },
      {
        id: 'indobenchmark/indobert-large-p1',
        name: 'IndoBERT Large P1',
        task: 'fill-mask',
        testInput: 'Sistem SELLICA membantu [MASK] data administratif.'
      },
      {
        id: 'cahya/gpt2-small-indonesian-522M',
        name: 'GPT-2 Indonesian Small',
        task: 'text-generation',
        testInput: 'Halo, nama saya SELLY dan saya adalah'
      },
      {
        id: 'flax-community/gpt2-base-indonesian',
        name: 'GPT-2 Base Indonesian',
        task: 'text-generation', 
        testInput: 'Selamat datang di sistem SELLICA,'
      },
      {
        id: 'indonesian-nlp/gpt2-indonesian-base',
        name: 'GPT-2 Indonesian Base (Alt)',
        task: 'text-generation',
        testInput: 'Hari ini cuaca sangat'
      }
    ];

    console.log(`Testing ${indonesianModels.length} Indonesian models...\n`);

    const workingModels = [];

    for (const model of indonesianModels) {
      console.log(`🔍 Testing: ${model.name} (${model.id})`);
      
      try {
        let result;
        
        if (model.task === 'fill-mask') {
          result = await hf.fillMask({
            model: model.id,
            inputs: model.testInput
          });
          
          if (result && result.length > 0) {
            console.log(`   ✅ Works! Best prediction: "${result[0].sequence}"`);
            console.log(`   📊 Confidence: ${(result[0].score * 100).toFixed(1)}%`);
            workingModels.push({
              ...model,
              status: 'working',
              sample: result[0].sequence,
              confidence: result[0].score
            });
          }
        } else if (model.task === 'text-generation') {
          result = await hf.textGeneration({
            model: model.id,
            inputs: model.testInput,
            parameters: {
              max_new_tokens: 20,
              temperature: 0.7,
              return_full_text: false
            }
          });
          
          if (result && result.generated_text) {
            console.log(`   ✅ Works! Generated: "${result.generated_text.trim()}"`);
            workingModels.push({
              ...model,
              status: 'working',
              sample: result.generated_text.trim()
            });
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        
        // Check if it's a loading issue
        if (error.message.includes('loading')) {
          console.log(`   ⏳ Model might be loading, trying again in 10 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          try {
            let retryResult;
            if (model.task === 'fill-mask') {
              retryResult = await hf.fillMask({
                model: model.id,
                inputs: model.testInput
              });
            } else {
              retryResult = await hf.textGeneration({
                model: model.id,
                inputs: model.testInput,
                parameters: { max_new_tokens: 20, temperature: 0.7 }
              });
            }
            
            if (retryResult) {
              console.log(`   ✅ Works after retry!`);
              workingModels.push({
                ...model,
                status: 'working-after-retry'
              });
            }
          } catch (retryError) {
            console.log(`   ❌ Still failed after retry: ${retryError.message}`);
          }
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Testing Complete!\n');
    
    if (workingModels.length > 0) {
      console.log('✅ Working Indonesian Models:');
      workingModels.forEach((model, index) => {
        console.log(`\n${index + 1}. ${model.name}`);
        console.log(`   ID: ${model.id}`);
        console.log(`   Task: ${model.task}`);
        console.log(`   Status: ${model.status}`);
        if (model.sample) {
          console.log(`   Sample: "${model.sample}"`);
        }
        if (model.confidence) {
          console.log(`   Confidence: ${(model.confidence * 100).toFixed(1)}%`);
        }
      });
      
      console.log('\n📋 Recommended for SELLY:');
      const recommended = workingModels.filter(m => 
        m.id.includes('indobert') || 
        (m.task === 'text-generation' && m.status === 'working')
      );
      
      if (recommended.length > 0) {
        recommended.forEach(model => {
          console.log(`   🌟 ${model.name} - ${model.id}`);
        });
      } else {
        console.log('   🔄 Use the working models above as fallbacks');
      }
      
    } else {
      console.log('❌ No Indonesian models are currently working with free tier');
      console.log('💡 This might be due to:');
      console.log('   - Models requiring paid inference endpoints');
      console.log('   - Models being temporarily unavailable');
      console.log('   - Rate limiting on free tier');
    }

  } catch (error) {
    console.log('❌ Failed to test models:', error.message);
  }
}

testIndoBERTModels().catch(console.error);

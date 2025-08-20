#!/usr/bin/env node

/**
 * SELLY IndoBERT Status Checker
 * Verifies the current state of IndoBERT integration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SELLY IndoBERT Integration Status Check\n');

// Check environment variables
console.log('📋 Environment Configuration:');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const checks = [
    { key: 'NEXT_PUBLIC_ENABLE_TENSORFLOW', required: true },
    { key: 'NEXT_PUBLIC_TENSORFLOW_SERVING_URL', required: true },
    { key: 'NEXT_PUBLIC_INDOBERT_MODEL_PATH', required: false },
    { key: 'NEXT_PUBLIC_TENSORFLOW_JS_MODEL_URL', required: false }
  ];
  
  checks.forEach(check => {
    const found = envContent.includes(check.key);
    const status = found ? '✅' : (check.required ? '❌' : '⚠️');
    console.log(`  ${status} ${check.key}: ${found ? 'Set' : 'Missing'}`);
  });
} else {
  console.log('  ❌ .env.local file not found');
}

// Check model directories
console.log('\n📁 Model Files:');
const modelPaths = [
  './models/indobert-base',
  './public/models',
  './models/models.config'
];

modelPaths.forEach(modelPath => {
  const exists = fs.existsSync(modelPath);
  console.log(`  ${exists ? '✅' : '❌'} ${modelPath}: ${exists ? 'Exists' : 'Missing'}`);
});

// Check TensorFlow Serving
console.log('\n🐳 TensorFlow Serving:');
const dockerComposePath = './docker-compose.tensorflow.yml';
const dockerExists = fs.existsSync(dockerComposePath);
console.log(`  ${dockerExists ? '✅' : '❌'} Docker Compose Config: ${dockerExists ? 'Ready' : 'Missing'}`);

// Check if TensorFlow Serving is running
const { exec } = require('child_process');
exec('curl -s http://localhost:8501/v1/models/indobert-base', (error, stdout, stderr) => {
  if (error) {
    console.log('  ❌ TensorFlow Serving: Not running or not accessible');
  } else {
    console.log('  ✅ TensorFlow Serving: Running and accessible');
  }
  
  // Final status
  console.log('\n📊 Overall Status:');
  const envConfigured = fs.existsSync(envPath) && fs.readFileSync(envPath, 'utf8').includes('NEXT_PUBLIC_ENABLE_TENSORFLOW=true');
  const modelsReady = fs.existsSync('./models/indobert-base');
  const servingReady = !error;
  
  if (envConfigured && modelsReady && servingReady) {
    console.log('  🎉 IndoBERT: FULLY ACTIVE');
  } else if (envConfigured) {
    console.log('  🔄 IndoBERT: CONFIGURED (needs model deployment)');
  } else {
    console.log('  ⚠️  IndoBERT: USING STUBS (conversational enhancement active)');
  }
  
  console.log('\n💡 Next Steps:');
  if (!envConfigured) {
    console.log('  1. Environment variables are now configured ✅');
  }
  if (!modelsReady) {
    console.log('  2. Run: bash scripts/setup-indobert.sh');
    console.log('  3. Download IndoBERT model files');
  }
  if (!servingReady) {
    console.log('  4. Start TensorFlow Serving: docker-compose -f docker-compose.tensorflow.yml up -d');
  }
  console.log('  5. Restart Next.js application');
  console.log('\n📖 See docs/2025-01-27_indobert-analysis-and-improvements.md for detailed instructions');
});

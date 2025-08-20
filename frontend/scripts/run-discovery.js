#!/usr/bin/env node
/**
 * Simple runner for the database schema discovery script
 * This allows running the TypeScript script without additional setup
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting SELLY Database Schema Discovery...\n');

// Check if environment variables are set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env.local file or environment.');
  process.exit(1);
}

// Try to run with tsx first, then fall back to ts-node
const scriptPath = path.join(__dirname, 'discover-database-schema.ts');

function runWithTsx() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', scriptPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tsx exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function runWithTsNode() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['ts-node', scriptPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ts-node exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runDiscovery() {
  try {
    console.log('📦 Attempting to run with tsx...');
    await runWithTsx();
  } catch (error) {
    console.log('⚠️ tsx failed, trying ts-node...');
    try {
      await runWithTsNode();
    } catch (tsNodeError) {
      console.error('❌ Both tsx and ts-node failed.');
      console.error('Please install one of them:');
      console.error('  npm install -g tsx');
      console.error('  or');
      console.error('  npm install -g ts-node');
      process.exit(1);
    }
  }
}

runDiscovery().catch((error) => {
  console.error('❌ Discovery failed:', error.message);
  process.exit(1);
});

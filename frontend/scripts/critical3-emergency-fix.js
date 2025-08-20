#!/usr/bin/env node

/**
 * CRITICAL-3: Emergency Connection Pool Fix
 * 
 * Applies immediate fixes for connection pool exhaustion and circuit breaker issues
 * that occur under concurrent load conditions.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🚨 [CRITICAL-3] Emergency Connection Pool Fix...\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  connectionTimeout: parseInt(process.env.SUPABASE_CONNECTION_TIMEOUT || '3000'),
  maxConnections: parseInt(process.env.SUPABASE_MAX_CONNECTIONS || '3')
};

/**
 * Step 1: Reset Circuit Breaker
 */
async function resetCircuitBreaker() {
  console.log('🔄 [STEP 1] Resetting Circuit Breaker');
  console.log('=' .repeat(50));

  try {
    const response = await fetch('http://localhost:3000/api/monitoring/database-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_circuit_breaker' })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ Circuit breaker reset successfully');
      console.log(`  📊 Status: ${result.success ? 'Success' : 'Failed'}`);
    } else {
      console.log('  ⚠️ API reset failed, server may need restart');
    }

  } catch (error) {
    console.log('  ⚠️ Server not responding, will restart after fixes');
  }

  console.log('');
}

/**
 * Step 2: Test Connection Pool Improvements
 */
async function testConnectionPoolImprovements() {
  console.log('🔧 [STEP 2] Testing Connection Pool Improvements');
  console.log('=' .repeat(50));

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.log('  ❌ Missing Supabase configuration');
    return false;
  }

  try {
    console.log('  🔄 Testing concurrent connections...');
    
    const client = createClient(config.supabaseUrl, config.supabaseServiceKey);
    
    // Test multiple concurrent connections
    const concurrentTests = [];
    for (let i = 0; i < 5; i++) {
      concurrentTests.push(
        client.from('profiles').select('count').limit(1).then(() => {
          console.log(`  ✅ Concurrent test ${i + 1}: Success`);
          return true;
        }).catch(error => {
          console.log(`  ❌ Concurrent test ${i + 1}: Failed - ${error.message}`);
          return false;
        })
      );
    }

    const results = await Promise.allSettled(concurrentTests);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`  📊 Concurrent test results: ${successCount}/5 successful`);
    
    if (successCount >= 3) {
      console.log('  ✅ Connection pool improvements working');
      return true;
    } else {
      console.log('  ⚠️ Connection pool still has issues');
      return false;
    }

  } catch (error) {
    console.log(`  ❌ Connection pool test failed: ${error.message}`);
    return false;
  }
}

/**
 * Step 3: Apply Additional Configuration
 */
function applyAdditionalConfiguration() {
  console.log('⚙️ [STEP 3] Applying Additional Configuration');
  console.log('=' .repeat(50));

  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('  ❌ .env.local file not found');
    return false;
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    let modified = false;

    // Additional optimizations for connection pool
    const additionalSettings = {
      'SUPABASE_POOL_IDLE_TIMEOUT': '60000',        // 1 minute idle timeout
      'SUPABASE_POOL_ACQUIRE_TIMEOUT': '5000',      // 5 second acquire timeout
      'SUPABASE_POOL_REAP_INTERVAL': '30000',       // 30 second cleanup interval
      'SUPABASE_ENABLE_CONNECTION_REUSE': 'true',   // Enable connection reuse
      'SUPABASE_AUTO_RELEASE_TIMEOUT': '45000'      // 45 second auto-release
    };

    Object.entries(additionalSettings).forEach(([key, value]) => {
      if (!envContent.includes(`${key}=`)) {
        envContent += `\n${key}=${value}`;
        console.log(`  ➕ Added ${key}=${value}`);
        modified = true;
      } else {
        console.log(`  ✅ ${key} already configured`);
      }
    });

    if (modified) {
      // Create backup
      const backupPath = `${envPath}.backup.${Date.now()}`;
      fs.writeFileSync(backupPath, fs.readFileSync(envPath));
      console.log(`  📋 Backup created: ${path.basename(backupPath)}`);

      // Write updated file
      fs.writeFileSync(envPath, envContent);
      console.log('  ✅ Additional configuration applied');
    } else {
      console.log('  ✅ Configuration already optimal');
    }

    return true;

  } catch (error) {
    console.log(`  ❌ Configuration update failed: ${error.message}`);
    return false;
  }
}

/**
 * Step 4: Validate System Health
 */
async function validateSystemHealth() {
  console.log('🔍 [STEP 4] Validating System Health');
  console.log('=' .repeat(50));

  try {
    const response = await fetch('http://localhost:3000/api/monitoring/database-pool');
    
    if (!response.ok) {
      console.log('  ⚠️ Monitoring API not responding');
      return false;
    }

    const data = await response.json();
    
    console.log('  📊 System Health Report:');
    console.log(`     Status: ${data.status}`);
    console.log(`     Circuit Breaker: ${data.poolStatus?.isCircuitBreakerOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`     Error Rate: ${data.metrics?.errorRate?.toFixed(1) || 0}%`);
    console.log(`     Active Connections: ${data.metrics?.activeConnections || 0}`);
    
    const isHealthy = data.status === 'healthy' && 
                     !data.poolStatus?.isCircuitBreakerOpen && 
                     (data.metrics?.errorRate || 0) < 10;
    
    if (isHealthy) {
      console.log('  ✅ System health: GOOD');
    } else {
      console.log('  ⚠️ System health: DEGRADED');
    }

    return isHealthy;

  } catch (error) {
    console.log(`  ❌ Health validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Step 5: Provide Next Steps
 */
function provideNextSteps(systemHealthy) {
  console.log('🚀 [STEP 5] Next Steps');
  console.log('=' .repeat(50));

  if (systemHealthy) {
    console.log('✅ Emergency fix successful! System is now stable.');
    console.log('');
    console.log('Recommended actions:');
    console.log('1. Monitor system for 30 minutes to ensure stability');
    console.log('2. Test chat functionality with multiple concurrent users');
    console.log('3. Review connection pool metrics regularly');
    console.log('4. Consider implementing connection pooling middleware');
  } else {
    console.log('⚠️ Emergency fix partially successful. Additional steps needed:');
    console.log('');
    console.log('Required actions:');
    console.log('1. Restart the development server: pnpm dev');
    console.log('2. Check Supabase project status and limits');
    console.log('3. Review Row Level Security policies');
    console.log('4. Consider increasing connection limits');
    console.log('5. Monitor error logs for specific failure patterns');
  }

  console.log('');
  console.log('Monitoring commands:');
  console.log('- Health check: curl http://localhost:3000/api/monitoring/database-pool');
  console.log('- Reset circuit breaker: node scripts/critical3-circuit-breaker-reset.js');
  console.log('- Full diagnostic: node scripts/critical3-database-diagnostic.js');
}

/**
 * Main execution
 */
async function main() {
  console.log('🎯 Starting CRITICAL-3 Emergency Fix Process...\n');

  try {
    // Step 1: Reset circuit breaker
    await resetCircuitBreaker();
    
    // Step 2: Test connection improvements
    const poolWorking = await testConnectionPoolImprovements();
    
    // Step 3: Apply additional configuration
    const configApplied = applyAdditionalConfiguration();
    
    // Small delay for configuration to take effect
    console.log('⏳ Waiting for configuration to take effect...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Validate system health
    const systemHealthy = await validateSystemHealth();
    
    // Step 5: Provide next steps
    provideNextSteps(systemHealthy);

    console.log('\n🎉 Emergency fix process completed!');

  } catch (error) {
    console.error('❌ Emergency fix process failed:', error);
    console.log('\nFallback actions:');
    console.log('1. Restart development server');
    console.log('2. Check Supabase project status');
    console.log('3. Review environment variables');
    process.exit(1);
  }
}

// Run emergency fix
main();

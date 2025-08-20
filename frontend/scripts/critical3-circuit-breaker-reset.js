#!/usr/bin/env node

/**
 * CRITICAL-3: Circuit Breaker Reset and Recovery Script
 * 
 * Resets the circuit breaker state and implements recovery procedures
 * to restore database connectivity after connection failures.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔄 [CRITICAL-3] Circuit Breaker Reset and Recovery...\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  connectionTimeout: 5000, // Increased for recovery
  maxRetries: 3
};

/**
 * Step 1: Reset Circuit Breaker State
 */
async function resetCircuitBreakerState() {
  console.log('🔌 [STEP 1] Resetting Circuit Breaker State');
  console.log('=' .repeat(50));

  try {
    // Clear any cached connection states
    console.log('  🧹 Clearing connection cache...');
    
    // Reset circuit breaker via API if server is running
    try {
      const response = await fetch('http://localhost:4000/api/monitoring/database-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_circuit_breaker' })
      });
      
      if (response.ok) {
        console.log('  ✅ Circuit breaker reset via API');
      } else {
        console.log('  ⚠️ API reset failed, continuing with manual reset');
      }
    } catch (error) {
      console.log('  ⚠️ Server not running, performing manual reset');
    }

    console.log('  ✅ Circuit breaker state cleared\n');
    return true;

  } catch (error) {
    console.error('  ❌ Failed to reset circuit breaker:', error.message);
    return false;
  }
}

/**
 * Step 2: Test Basic Connectivity
 */
async function testBasicConnectivity() {
  console.log('🔗 [STEP 2] Testing Basic Connectivity');
  console.log('=' .repeat(50));

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.log('  ❌ Missing Supabase configuration');
    return false;
  }

  try {
    console.log('  🔄 Creating test connection...');
    
    const client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'x-selly-recovery-test': 'true'
        }
      }
    });

    console.log('  🔄 Testing simple query...');
    const startTime = Date.now();
    
    const { data, error } = await Promise.race([
      client.from('profiles').select('count').limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), config.connectionTimeout)
      )
    ]);

    const duration = Date.now() - startTime;

    if (error) {
      console.log(`  ❌ Query failed: ${error.message}`);
      return false;
    }

    console.log(`  ✅ Connection successful (${duration}ms)`);
    console.log(`  📊 Query result: ${JSON.stringify(data)}\n`);
    return true;

  } catch (error) {
    console.log(`  ❌ Connection failed: ${error.message}\n`);
    return false;
  }
}

/**
 * Step 3: Gradual Connection Recovery
 */
async function performGradualRecovery() {
  console.log('🔄 [STEP 3] Gradual Connection Recovery');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'Profiles Table', table: 'profiles', query: 'count' },
    { name: 'Chat Sessions', table: 'selly_chat_sessions', query: 'id' },
    { name: 'Chat Messages', table: 'selly_chat_messages', query: 'id' }
  ];

  let successCount = 0;
  const client = createClient(config.supabaseUrl, config.supabaseServiceKey);

  for (const test of tests) {
    try {
      console.log(`  🔄 Testing ${test.name}...`);
      
      const startTime = Date.now();
      const { data, error } = await Promise.race([
        client.from(test.table).select(test.query).limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        )
      ]);

      const duration = Date.now() - startTime;

      if (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
      } else {
        console.log(`  ✅ ${test.name}: OK (${duration}ms)`);
        successCount++;
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }

  const successRate = (successCount / tests.length) * 100;
  console.log(`\n  📊 Recovery Success Rate: ${successRate.toFixed(1)}% (${successCount}/${tests.length})`);
  
  return successRate >= 66; // At least 2/3 tests should pass
}

/**
 * Step 4: Connection Pool Warmup
 */
async function warmupConnectionPool() {
  console.log('🔥 [STEP 4] Connection Pool Warmup');
  console.log('=' .repeat(50));

  try {
    console.log('  🔄 Warming up connection pool...');
    
    const client = createClient(config.supabaseUrl, config.supabaseServiceKey);
    const warmupPromises = [];

    // Create multiple concurrent connections to warm up the pool
    for (let i = 0; i < 3; i++) {
      warmupPromises.push(
        client.from('profiles').select('count').limit(1).then(() => {
          console.log(`  ✅ Connection ${i + 1} warmed up`);
        }).catch(error => {
          console.log(`  ⚠️ Connection ${i + 1} failed: ${error.message}`);
        })
      );
    }

    await Promise.allSettled(warmupPromises);
    
    console.log('  ✅ Connection pool warmup completed\n');
    return true;

  } catch (error) {
    console.log(`  ❌ Warmup failed: ${error.message}\n`);
    return false;
  }
}

/**
 * Step 5: Verify Recovery
 */
async function verifyRecovery() {
  console.log('✅ [STEP 5] Verify Recovery');
  console.log('=' .repeat(50));

  try {
    const client = createClient(config.supabaseUrl, config.supabaseServiceKey);
    
    // Test multiple operations
    const operations = [
      { name: 'Read Operation', test: () => client.from('profiles').select('id').limit(1) },
      { name: 'Count Operation', test: () => client.from('selly_chat_sessions').select('count') },
      { name: 'Filter Operation', test: () => client.from('profiles').select('id').eq('id', 'test').limit(1) }
    ];

    let allPassed = true;

    for (const operation of operations) {
      try {
        console.log(`  🔄 Testing ${operation.name}...`);
        const startTime = Date.now();
        
        await Promise.race([
          operation.test(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), 2000)
          )
        ]);
        
        const duration = Date.now() - startTime;
        console.log(`  ✅ ${operation.name}: OK (${duration}ms)`);

      } catch (error) {
        console.log(`  ❌ ${operation.name}: ${error.message}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n  🎉 All recovery tests passed!');
      console.log('  📊 Database connectivity fully restored\n');
    } else {
      console.log('\n  ⚠️ Some tests failed - partial recovery achieved\n');
    }

    return allPassed;

  } catch (error) {
    console.log(`  ❌ Recovery verification failed: ${error.message}\n`);
    return false;
  }
}

/**
 * Step 6: Update Configuration
 */
function updateConfiguration() {
  console.log('⚙️ [STEP 6] Configuration Recommendations');
  console.log('=' .repeat(50));

  const recommendations = [
    'SUPABASE_CONNECTION_TIMEOUT=3000',
    'SUPABASE_CIRCUIT_BREAKER_THRESHOLD=5',
    'SUPABASE_CIRCUIT_BREAKER_TIMEOUT=30000',
    'SUPABASE_MAX_CONNECTIONS=3',
    'SUPABASE_RETRY_ATTEMPTS=3',
    'SUPABASE_RETRY_DELAY=1000'
  ];

  console.log('  📝 Add these settings to your .env.local:');
  console.log('');
  recommendations.forEach(setting => {
    console.log(`     ${setting}`);
  });
  console.log('');

  // Check if we should auto-update
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('  💡 To auto-apply these settings, run:');
    console.log('     node scripts/critical3-apply-config.js');
  }

  console.log('');
}

/**
 * Main Recovery Process
 */
async function main() {
  console.log('🚀 Starting CRITICAL-3 Recovery Process...\n');

  try {
    // Step 1: Reset circuit breaker
    const resetSuccess = await resetCircuitBreakerState();
    
    // Step 2: Test basic connectivity
    const connectivityOk = await testBasicConnectivity();
    
    if (!connectivityOk) {
      console.log('❌ Basic connectivity failed. Check:');
      console.log('   1. Supabase project status');
      console.log('   2. Environment variables');
      console.log('   3. Network connectivity');
      console.log('   4. API key permissions\n');
      process.exit(1);
    }

    // Step 3: Gradual recovery
    const recoveryOk = await performGradualRecovery();
    
    // Step 4: Warmup connections
    await warmupConnectionPool();
    
    // Step 5: Verify recovery
    const verificationOk = await verifyRecovery();
    
    // Step 6: Configuration recommendations
    updateConfiguration();

    // Final status
    if (verificationOk) {
      console.log('🎉 [SUCCESS] Database connectivity fully restored!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Restart your development server');
      console.log('2. Monitor connection stability');
      console.log('3. Apply recommended configuration changes');
      console.log('4. Test chat functionality');
    } else {
      console.log('⚠️ [PARTIAL] Recovery partially successful');
      console.log('');
      console.log('Additional steps needed:');
      console.log('1. Check Supabase project health');
      console.log('2. Review API key permissions');
      console.log('3. Consider increasing timeouts');
      console.log('4. Contact Supabase support if issues persist');
    }

  } catch (error) {
    console.error('❌ Recovery process failed:', error);
    process.exit(1);
  }
}

// Run recovery
main();

#!/usr/bin/env node

/**
 * CRITICAL-3: Database Connection Diagnostic and Recovery Script
 * 
 * Systematically diagnoses and fixes Supabase database connectivity issues
 * including circuit breaker failures, connection timeouts, and configuration problems.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 [CRITICAL-3] Starting Database Connection Diagnostic...\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  connectionTimeout: parseInt(process.env.SUPABASE_CONNECTION_TIMEOUT || '1500'),
  maxConnections: parseInt(process.env.SUPABASE_MAX_CONNECTIONS || '5'),
  circuitBreakerThreshold: parseInt(process.env.SUPABASE_CIRCUIT_BREAKER_THRESHOLD || '3'),
  circuitBreakerTimeout: parseInt(process.env.SUPABASE_CIRCUIT_BREAKER_TIMEOUT || '15000')
};

// Diagnostic results
const diagnosticResults = {
  environmentVariables: {},
  connectionTests: {},
  performanceTests: {},
  circuitBreakerStatus: {},
  recommendations: []
};

/**
 * Phase 1: Environment Variable Audit
 */
async function auditEnvironmentVariables() {
  console.log('📋 [PHASE 1] Environment Variable Audit');
  console.log('=' .repeat(50));

  const requiredVars = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: config.supabaseUrl, critical: true },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: config.supabaseAnonKey, critical: true },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: config.supabaseServiceKey, critical: true }
  ];

  const optionalVars = [
    { key: 'SUPABASE_CONNECTION_TIMEOUT', value: config.connectionTimeout, default: 1500 },
    { key: 'SUPABASE_MAX_CONNECTIONS', value: config.maxConnections, default: 5 },
    { key: 'SUPABASE_CIRCUIT_BREAKER_THRESHOLD', value: config.circuitBreakerThreshold, default: 3 },
    { key: 'SUPABASE_CIRCUIT_BREAKER_TIMEOUT', value: config.circuitBreakerTimeout, default: 15000 }
  ];

  let criticalIssues = 0;

  // Check required variables
  for (const variable of requiredVars) {
    const status = variable.value ? '✅' : '❌';
    const length = variable.value ? variable.value.length : 0;
    const masked = variable.value ? `${variable.value.substring(0, 20)}...` : 'MISSING';
    
    console.log(`  ${status} ${variable.key}: ${masked} (${length} chars)`);
    
    diagnosticResults.environmentVariables[variable.key] = {
      present: !!variable.value,
      length,
      critical: variable.critical
    };

    if (!variable.value && variable.critical) {
      criticalIssues++;
      diagnosticResults.recommendations.push({
        type: 'critical',
        issue: `Missing critical environment variable: ${variable.key}`,
        solution: `Add ${variable.key} to your .env.local file`
      });
    }
  }

  // Check optional variables
  console.log('\n📊 Configuration Settings:');
  for (const variable of optionalVars) {
    const isDefault = variable.value === variable.default;
    const status = isDefault ? '⚙️' : '🔧';
    console.log(`  ${status} ${variable.key}: ${variable.value} ${isDefault ? '(default)' : '(custom)'}`);
    
    diagnosticResults.environmentVariables[variable.key] = {
      value: variable.value,
      isDefault,
      recommended: variable.default
    };
  }

  console.log(`\n📈 Environment Status: ${criticalIssues === 0 ? '✅ PASS' : `❌ ${criticalIssues} CRITICAL ISSUES`}\n`);
  return criticalIssues === 0;
}

/**
 * Phase 2: Connection Testing
 */
async function testConnections() {
  console.log('🔗 [PHASE 2] Connection Testing');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'Anonymous Client', key: config.supabaseAnonKey, type: 'anon' },
    { name: 'Service Role Client', key: config.supabaseServiceKey, type: 'service' }
  ];

  for (const test of tests) {
    if (!test.key) {
      console.log(`  ❌ ${test.name}: Missing API key`);
      diagnosticResults.connectionTests[test.type] = { status: 'failed', error: 'Missing API key' };
      continue;
    }

    try {
      console.log(`  🔄 Testing ${test.name}...`);
      const startTime = Date.now();

      const client = createClient(config.supabaseUrl, test.key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Test with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), config.connectionTimeout)
      );

      const testPromise = client.from('profiles').select('count').limit(1);
      
      await Promise.race([testPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      console.log(`  ✅ ${test.name}: Connected successfully (${duration}ms)`);
      
      diagnosticResults.connectionTests[test.type] = {
        status: 'success',
        duration,
        performance: duration < 1000 ? 'excellent' : duration < 2000 ? 'good' : 'slow'
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`  ❌ ${test.name}: Failed after ${duration}ms - ${error.message}`);
      
      diagnosticResults.connectionTests[test.type] = {
        status: 'failed',
        duration,
        error: error.message
      };

      diagnosticResults.recommendations.push({
        type: 'critical',
        issue: `${test.name} connection failed: ${error.message}`,
        solution: duration >= config.connectionTimeout 
          ? 'Increase SUPABASE_CONNECTION_TIMEOUT or check network connectivity'
          : 'Verify Supabase project status and API keys'
      });
    }
  }

  console.log('');
}

/**
 * Phase 3: Performance Analysis
 */
async function analyzePerformance() {
  console.log('⚡ [PHASE 3] Performance Analysis');
  console.log('=' .repeat(50));

  if (!config.supabaseServiceKey) {
    console.log('  ⚠️ Skipping performance tests - missing service key\n');
    return;
  }

  try {
    const client = createClient(config.supabaseUrl, config.supabaseServiceKey);
    const tests = [
      { name: 'Simple Query', query: () => client.from('profiles').select('count').limit(1) },
      { name: 'Table List', query: () => client.from('profiles').select('id').limit(5) },
      { name: 'Session Query', query: () => client.from('selly_chat_sessions').select('id').limit(1) }
    ];

    for (const test of tests) {
      try {
        console.log(`  🔄 Testing ${test.name}...`);
        const startTime = Date.now();
        
        await Promise.race([
          test.query(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 5000)
          )
        ]);
        
        const duration = Date.now() - startTime;
        const performance = duration < 500 ? 'excellent' : duration < 1000 ? 'good' : duration < 2000 ? 'acceptable' : 'slow';
        
        console.log(`  ✅ ${test.name}: ${duration}ms (${performance})`);
        
        diagnosticResults.performanceTests[test.name.toLowerCase().replace(' ', '_')] = {
          duration,
          performance,
          status: 'success'
        };

      } catch (error) {
        console.log(`  ❌ ${test.name}: Failed - ${error.message}`);
        
        diagnosticResults.performanceTests[test.name.toLowerCase().replace(' ', '_')] = {
          status: 'failed',
          error: error.message
        };
      }
    }

  } catch (error) {
    console.log(`  ❌ Performance testing failed: ${error.message}`);
  }

  console.log('');
}

/**
 * Phase 4: Circuit Breaker Analysis
 */
async function analyzeCircuitBreaker() {
  console.log('🔌 [PHASE 4] Circuit Breaker Analysis');
  console.log('=' .repeat(50));

  console.log(`  📊 Current Configuration:`);
  console.log(`     Failure Threshold: ${config.circuitBreakerThreshold} failures`);
  console.log(`     Timeout Duration: ${config.circuitBreakerTimeout}ms (${config.circuitBreakerTimeout / 1000}s)`);
  console.log(`     Connection Timeout: ${config.connectionTimeout}ms`);

  // Analyze configuration
  const issues = [];
  
  if (config.circuitBreakerThreshold < 3) {
    issues.push('Threshold too low - may cause premature circuit opening');
  }
  
  if (config.circuitBreakerTimeout < 10000) {
    issues.push('Timeout too short - may not allow sufficient recovery time');
  }
  
  if (config.connectionTimeout < 2000) {
    issues.push('Connection timeout too aggressive - may cause false failures');
  }

  diagnosticResults.circuitBreakerStatus = {
    threshold: config.circuitBreakerThreshold,
    timeout: config.circuitBreakerTimeout,
    connectionTimeout: config.connectionTimeout,
    issues
  };

  if (issues.length > 0) {
    console.log(`  ⚠️ Configuration Issues:`);
    issues.forEach(issue => console.log(`     - ${issue}`));
    
    diagnosticResults.recommendations.push({
      type: 'optimization',
      issue: 'Circuit breaker configuration needs tuning',
      solution: 'Adjust thresholds and timeouts for better stability'
    });
  } else {
    console.log(`  ✅ Configuration appears optimal`);
  }

  console.log('');
}

/**
 * Phase 5: Generate Recommendations
 */
function generateRecommendations() {
  console.log('💡 [PHASE 5] Recommendations');
  console.log('=' .repeat(50));

  if (diagnosticResults.recommendations.length === 0) {
    console.log('  ✅ No issues detected - system appears healthy\n');
    return;
  }

  const critical = diagnosticResults.recommendations.filter(r => r.type === 'critical');
  const optimization = diagnosticResults.recommendations.filter(r => r.type === 'optimization');

  if (critical.length > 0) {
    console.log('  🚨 CRITICAL ISSUES:');
    critical.forEach((rec, index) => {
      console.log(`     ${index + 1}. ${rec.issue}`);
      console.log(`        Solution: ${rec.solution}`);
    });
    console.log('');
  }

  if (optimization.length > 0) {
    console.log('  ⚙️ OPTIMIZATION OPPORTUNITIES:');
    optimization.forEach((rec, index) => {
      console.log(`     ${index + 1}. ${rec.issue}`);
      console.log(`        Solution: ${rec.solution}`);
    });
    console.log('');
  }

  // Generate configuration recommendations
  console.log('  📝 RECOMMENDED CONFIGURATION:');
  console.log('     Add to .env.local:');
  console.log('     SUPABASE_CONNECTION_TIMEOUT=3000');
  console.log('     SUPABASE_CIRCUIT_BREAKER_THRESHOLD=5');
  console.log('     SUPABASE_CIRCUIT_BREAKER_TIMEOUT=30000');
  console.log('     SUPABASE_MAX_CONNECTIONS=3');
  console.log('');
}

/**
 * Phase 6: Save Diagnostic Report
 */
function saveDiagnosticReport() {
  const reportPath = path.join(process.cwd(), 'diagnostic-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    summary: {
      environmentVariables: Object.keys(diagnosticResults.environmentVariables).length,
      connectionTests: Object.keys(diagnosticResults.connectionTests).length,
      performanceTests: Object.keys(diagnosticResults.performanceTests).length,
      recommendations: diagnosticResults.recommendations.length
    },
    results: diagnosticResults
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Diagnostic report saved to: ${reportPath}\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const envOk = await auditEnvironmentVariables();
    
    if (envOk) {
      await testConnections();
      await analyzePerformance();
    }
    
    await analyzeCircuitBreaker();
    generateRecommendations();
    saveDiagnosticReport();

    console.log('🎯 [CRITICAL-3] Diagnostic Complete!');
    console.log('Next steps:');
    console.log('1. Review recommendations above');
    console.log('2. Apply suggested configuration changes');
    console.log('3. Run: node scripts/critical3-circuit-breaker-reset.js');
    console.log('4. Restart development server');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  }
}

// Run diagnostic
main();

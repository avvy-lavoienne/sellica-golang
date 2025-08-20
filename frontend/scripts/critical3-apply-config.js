#!/usr/bin/env node

/**
 * CRITICAL-3: Apply Optimized Database Configuration
 * 
 * Applies optimized Supabase configuration settings to resolve
 * circuit breaker failures and connection timeout issues.
 */

const fs = require('fs');
const path = require('path');

console.log('⚙️ [CRITICAL-3] Applying Optimized Database Configuration...\n');

const envPath = path.join(process.cwd(), '.env.local');

// Optimized configuration for CRITICAL-3 recovery
const optimizedConfig = {
  // Connection Management
  'SUPABASE_CONNECTION_TIMEOUT': '3000',           // Increased from 1500ms
  'SUPABASE_MAX_CONNECTIONS': '3',                 // Reduced from 5 to prevent pool exhaustion
  'SUPABASE_IDLE_TIMEOUT': '45000',                // Increased from 30000ms
  'SUPABASE_HEALTH_CHECK_INTERVAL': '45000',       // Increased from 30000ms
  
  // Retry Configuration
  'SUPABASE_RETRY_ATTEMPTS': '3',                  // Keep at 3
  'SUPABASE_RETRY_DELAY': '1000',                  // Increased from 500ms
  
  // Circuit Breaker Tuning
  'SUPABASE_ENABLE_CIRCUIT_BREAKER': 'true',       // Keep enabled
  'SUPABASE_CIRCUIT_BREAKER_THRESHOLD': '5',       // Increased from 3 (more tolerant)
  'SUPABASE_CIRCUIT_BREAKER_TIMEOUT': '30000',     // Increased from 15000ms (longer recovery)
  
  // Debug and Monitoring
  'SELLY_DEBUG_POOL': 'true',                      // Enable pool debugging
  'SELLY_DEBUG_CACHE': 'false',                    // Disable cache debugging to reduce noise
  
  // Performance Optimization
  'SELLY_CACHE_MAX_MEMORY': '5242880',             // 5MB (reduced from 10MB)
  'SELLY_CACHE_MAX_ENTRIES': '250',                // Reduced from 500
  'SELLY_CACHE_CLEANUP_INTERVAL': '180000',        // 3 minutes (reduced from 5 minutes)
  'SELLY_CACHE_PRESSURE_THRESHOLD': '0.7'          // Reduced from 0.8
};

/**
 * Read current .env.local file
 */
function readCurrentEnv() {
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    return null;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const env = {};

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return { content, lines, env };
}

/**
 * Apply configuration updates
 */
function applyConfiguration() {
  console.log('📝 Reading current configuration...');
  
  const current = readCurrentEnv();
  if (!current) {
    return false;
  }

  console.log('🔧 Applying optimized settings...\n');

  let updatedLines = [...current.lines];
  let addedCount = 0;
  let updatedCount = 0;

  // Process each optimized setting
  Object.entries(optimizedConfig).forEach(([key, value]) => {
    const existingIndex = updatedLines.findIndex(line => 
      line.trim().startsWith(`${key}=`)
    );

    const currentValue = current.env[key];
    const isNewValue = currentValue !== value;

    if (existingIndex !== -1) {
      // Update existing setting
      if (isNewValue) {
        const oldLine = updatedLines[existingIndex];
        updatedLines[existingIndex] = `${key}=${value}`;
        console.log(`  🔄 Updated ${key}: ${currentValue} → ${value}`);
        updatedCount++;
      } else {
        console.log(`  ✅ ${key}: Already optimal (${value})`);
      }
    } else {
      // Add new setting
      // Find a good place to insert (after Supabase section or at end)
      let insertIndex = updatedLines.length;
      
      // Look for Supabase configuration section
      const supabaseIndex = updatedLines.findIndex(line => 
        line.includes('Supabase') && line.includes('#')
      );
      
      if (supabaseIndex !== -1) {
        // Find the end of the Supabase section
        let endIndex = supabaseIndex + 1;
        while (endIndex < updatedLines.length && 
               (updatedLines[endIndex].trim() === '' || 
                updatedLines[endIndex].startsWith('SUPABASE_') ||
                updatedLines[endIndex].startsWith('NEXT_PUBLIC_SUPABASE_'))) {
          endIndex++;
        }
        insertIndex = endIndex;
      }

      updatedLines.splice(insertIndex, 0, `${key}=${value}`);
      console.log(`  ➕ Added ${key}=${value}`);
      addedCount++;
    }
  });

  // Write updated configuration
  if (addedCount > 0 || updatedCount > 0) {
    console.log(`\n💾 Saving configuration...`);
    
    // Create backup
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, current.content);
    console.log(`  📋 Backup created: ${path.basename(backupPath)}`);

    // Write updated file
    fs.writeFileSync(envPath, updatedLines.join('\n'));
    console.log(`  ✅ Configuration updated`);
    console.log(`  📊 Changes: ${updatedCount} updated, ${addedCount} added`);
  } else {
    console.log(`\n✅ Configuration already optimal - no changes needed`);
  }

  return true;
}

/**
 * Validate configuration
 */
function validateConfiguration() {
  console.log('\n🔍 Validating configuration...');

  const current = readCurrentEnv();
  if (!current) {
    return false;
  }

  const issues = [];
  const warnings = [];

  // Check critical settings
  const connectionTimeout = parseInt(current.env.SUPABASE_CONNECTION_TIMEOUT || '0');
  const circuitBreakerThreshold = parseInt(current.env.SUPABASE_CIRCUIT_BREAKER_THRESHOLD || '0');
  const circuitBreakerTimeout = parseInt(current.env.SUPABASE_CIRCUIT_BREAKER_TIMEOUT || '0');

  if (connectionTimeout < 2000) {
    issues.push(`Connection timeout too low: ${connectionTimeout}ms (recommended: ≥3000ms)`);
  }

  if (circuitBreakerThreshold < 3) {
    warnings.push(`Circuit breaker threshold low: ${circuitBreakerThreshold} (recommended: ≥5)`);
  }

  if (circuitBreakerTimeout < 20000) {
    warnings.push(`Circuit breaker timeout short: ${circuitBreakerTimeout}ms (recommended: ≥30000ms)`);
  }

  // Report validation results
  if (issues.length === 0 && warnings.length === 0) {
    console.log('  ✅ Configuration validation passed');
  } else {
    if (issues.length > 0) {
      console.log('  ❌ Critical issues found:');
      issues.forEach(issue => console.log(`     - ${issue}`));
    }
    
    if (warnings.length > 0) {
      console.log('  ⚠️ Warnings:');
      warnings.forEach(warning => console.log(`     - ${warning}`));
    }
  }

  return issues.length === 0;
}

/**
 * Display next steps
 */
function displayNextSteps() {
  console.log('\n🚀 Next Steps:');
  console.log('=' .repeat(50));
  console.log('1. Restart your development server:');
  console.log('   pnpm dev');
  console.log('');
  console.log('2. Reset the circuit breaker:');
  console.log('   node scripts/critical3-circuit-breaker-reset.js');
  console.log('');
  console.log('3. Test database connectivity:');
  console.log('   node scripts/critical3-database-diagnostic.js');
  console.log('');
  console.log('4. Monitor chat functionality for stability');
  console.log('');
  console.log('📊 Expected improvements:');
  console.log('   - Reduced connection timeouts');
  console.log('   - More stable circuit breaker behavior');
  console.log('   - Better connection pool management');
  console.log('   - Improved error recovery');
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🎯 Optimizing database configuration for CRITICAL-3 recovery...\n');

    const success = applyConfiguration();
    if (!success) {
      process.exit(1);
    }

    const valid = validateConfiguration();
    if (!valid) {
      console.log('\n⚠️ Configuration applied but validation found issues');
      console.log('Please review the warnings above before proceeding');
    }

    displayNextSteps();

    console.log('\n✅ Configuration optimization complete!');

  } catch (error) {
    console.error('❌ Configuration update failed:', error);
    process.exit(1);
  }
}

// Run configuration update
main();

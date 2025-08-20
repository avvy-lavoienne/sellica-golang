#!/usr/bin/env node

/**
 * Safety Infrastructure Initialization Script - Phase 4
 * MUST be run and pass ALL checkpoints before ANY AI development begins
 * 
 * Historical Context: Prevents repeat of August 2025 catastrophe
 * - Previous Issues: 36s loading, 400MB memory, 2000ms response times
 * - This script ensures all safety systems are operational FIRST
 * - NO AI development allowed until ALL safety checkpoints pass
 */

import { SafetyInfrastructureManager } from '../services/safety/SafetyInfrastructureManager';

interface InitializationResult {
  success: boolean;
  duration: number;
  checkpointsPassed: number;
  totalCheckpoints: number;
  failedCheckpoints: string[];
  readyForAIDevelopment: boolean;
  emergencyProceduresTested: boolean;
  recommendations: string[];
}

/**
 * Initialize Phase 4 Safety Infrastructure
 * This is the FIRST and MOST CRITICAL step before any AI development
 */
async function initializeSafetyInfrastructure(): Promise<InitializationResult> {
  const startTime = performance.now();
  let safetyManager: SafetyInfrastructureManager | null = null;

  try {
    console.log('🚨 ========================================');
    console.log('🚨 PHASE 4 SAFETY INFRASTRUCTURE INITIALIZATION');
    console.log('🚨 ========================================');
    console.log('');
    console.log('⚠️  CRITICAL: This script MUST complete successfully');
    console.log('⚠️  before ANY AI/ML development can begin');
    console.log('');
    console.log('📋 Historical Context:');
    console.log('   August 2025: TensorFlow.js/IndoBERT removed due to:');
    console.log('   - 36+ second loading times');
    console.log('   - 400MB+ memory usage');
    console.log('   - 2000ms response times');
    console.log('   - System instability');
    console.log('');
    console.log('🎯 Phase 4 Goal: Reintroduce AI safely with:');
    console.log('   - <3s loading times (vs 36s previous)');
    console.log('   - <200MB memory usage (vs 400MB+ previous)');
    console.log('   - <500ms response times (vs 2000ms previous)');
    console.log('   - Automatic rollback protection');
    console.log('');
    console.log('🚀 Starting safety infrastructure initialization...');
    console.log('');

    // Step 1: Get Safety Infrastructure Manager
    console.log('📦 [INIT] Getting Safety Infrastructure Manager...');
    safetyManager = SafetyInfrastructureManager.getInstance();

    // Step 2: Initialize all safety systems
    console.log('🔧 [INIT] Initializing safety systems...');
    await safetyManager.initializeSafetyInfrastructure();

    // Step 3: Validate readiness for AI development
    console.log('🔍 [INIT] Validating readiness for AI development...');
    const readinessCheck = await safetyManager.validateReadinessForAIDevelopment();

    // Step 4: Generate comprehensive safety report
    console.log('📊 [INIT] Generating safety infrastructure report...');
    const safetyReport = await safetyManager.generateSafetyReport();

    // Step 5: Test emergency procedures
    console.log('🧪 [INIT] Testing emergency procedures...');
    const emergencyTest = await testEmergencyProcedures(safetyManager);

    const duration = performance.now() - startTime;

    // Final validation
    const success = readinessCheck.ready && emergencyTest.success && safetyReport.overallStatus === 'operational';

    console.log('');
    console.log('📊 ========================================');
    console.log('📊 SAFETY INFRASTRUCTURE INITIALIZATION RESULTS');
    console.log('📊 ========================================');
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`✅ Checkpoints Passed: ${readinessCheck.passedCheckpoints}/${readinessCheck.totalCheckpoints}`);
    console.log(`🛡️  Overall Status: ${safetyReport.overallStatus.toUpperCase()}`);
    console.log(`🚀 Ready for AI Development: ${readinessCheck.ready ? 'YES' : 'NO'}`);
    console.log(`🚨 Emergency Procedures: ${emergencyTest.success ? 'TESTED & OPERATIONAL' : 'FAILED'}`);

    if (readinessCheck.failedCheckpoints.length > 0) {
      console.log('');
      console.log('❌ Failed Checkpoints:');
      readinessCheck.failedCheckpoints.forEach(checkpoint => {
        console.log(`   - ${checkpoint.name}`);
      });
    }

    if (safetyReport.recommendations.length > 0) {
      console.log('');
      console.log('💡 Recommendations:');
      safetyReport.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }

    console.log('');
    if (success) {
      console.log('✅ ========================================');
      console.log('✅ SAFETY INFRASTRUCTURE FULLY OPERATIONAL');
      console.log('✅ ========================================');
      console.log('🚀 Phase 4 AI development can now begin with safety constraints');
      console.log('🛡️  All safety systems monitoring and ready for automatic rollback');
      console.log('📊 Performance targets: <200MB memory, <500ms response, <3s loading');
      console.log('🔄 Fallback architecture preserved and tested');
    } else {
      console.log('❌ ========================================');
      console.log('❌ SAFETY INFRASTRUCTURE INITIALIZATION FAILED');
      console.log('❌ ========================================');
      console.log('🚫 AI development BLOCKED until all safety systems operational');
      console.log('⚠️  Fix all failed checkpoints before proceeding');
    }

    return {
      success,
      duration,
      checkpointsPassed: readinessCheck.passedCheckpoints,
      totalCheckpoints: readinessCheck.totalCheckpoints,
      failedCheckpoints: readinessCheck.failedCheckpoints.map(cp => cp.name),
      readyForAIDevelopment: readinessCheck.ready,
      emergencyProceduresTested: emergencyTest.success,
      recommendations: safetyReport.recommendations
    };

  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.log('');
    console.log('❌ ========================================');
    console.log('❌ SAFETY INFRASTRUCTURE INITIALIZATION FAILED');
    console.log('❌ ========================================');
    console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log('🚫 AI development BLOCKED until safety infrastructure operational');

    return {
      success: false,
      duration,
      checkpointsPassed: 0,
      totalCheckpoints: 5,
      failedCheckpoints: ['Safety infrastructure initialization failed'],
      readyForAIDevelopment: false,
      emergencyProceduresTested: false,
      recommendations: [
        'Review error logs and fix initialization issues',
        'Ensure all safety system dependencies are available',
        'Re-run initialization script after fixes'
      ]
    };
  }
}

/**
 * Test emergency procedures
 */
async function testEmergencyProcedures(safetyManager: SafetyInfrastructureManager): Promise<{
  success: boolean;
  testsRun: number;
  testsPassed: number;
  issues: string[];
}> {
  console.log('🧪 [EMERGENCY_TEST] Testing emergency procedures...');
  
  const issues: string[] = [];
  let testsRun = 0;
  let testsPassed = 0;

  try {
    // Test 1: Emergency rollback simulation
    testsRun++;
    console.log('🔄 [EMERGENCY_TEST] Test 1: Emergency rollback simulation...');
    
    const rollbackTest = await safetyManager.executeEmergencyRollback('Safety infrastructure test');
    if (rollbackTest.success && rollbackTest.executionTime < 900000) { // 15 minutes
      testsPassed++;
      console.log(`✅ [EMERGENCY_TEST] Emergency rollback: ${(rollbackTest.executionTime / 1000).toFixed(1)}s`);
    } else {
      issues.push(`Emergency rollback failed or took too long: ${(rollbackTest.executionTime / 1000).toFixed(1)}s`);
      console.log(`❌ [EMERGENCY_TEST] Emergency rollback failed`);
    }

    // Test 2: Safety report generation
    testsRun++;
    console.log('📊 [EMERGENCY_TEST] Test 2: Safety report generation...');
    
    const report = await safetyManager.generateSafetyReport();
    if (report.overallStatus !== 'emergency') {
      testsPassed++;
      console.log(`✅ [EMERGENCY_TEST] Safety report: ${report.overallStatus}`);
    } else {
      issues.push('Safety report shows emergency status');
      console.log(`❌ [EMERGENCY_TEST] Safety report shows emergency status`);
    }

    const success = testsPassed === testsRun;
    
    console.log(`🧪 [EMERGENCY_TEST] Emergency procedures test: ${testsPassed}/${testsRun} passed`);
    
    return {
      success,
      testsRun,
      testsPassed,
      issues
    };

  } catch (error) {
    issues.push(`Emergency procedure test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      success: false,
      testsRun,
      testsPassed,
      issues
    };
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const result = await initializeSafetyInfrastructure();
    
    // Exit with appropriate code
    if (result.success) {
      console.log('');
      console.log('🎉 Safety infrastructure initialization completed successfully!');
      console.log('🚀 Ready to proceed with Phase 4 AI development');
      process.exit(0);
    } else {
      console.log('');
      console.log('💥 Safety infrastructure initialization failed!');
      console.log('🚫 AI development blocked until issues resolved');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Fatal error during safety infrastructure initialization:', error);
    console.error('🚫 AI development blocked until issues resolved');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { initializeSafetyInfrastructure, testEmergencyProcedures };

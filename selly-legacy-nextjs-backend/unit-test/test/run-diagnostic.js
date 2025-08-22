#!/usr/bin/env node

/**
 * SELLY Diagnostic Test Runner
 * Simple script to execute the comprehensive diagnostic
 */

const SELLYDiagnostic = require('./selly-diagnostic');

console.log('🚀 SELLY Diagnostic Test Runner');
console.log('===============================');
console.log('');

async function runDiagnostic() {
  try {
    console.log('🔍 Initializing SELLY diagnostic...');
    const diagnostic = new SELLYDiagnostic();
    
    console.log('📊 Running comprehensive analysis...');
    console.log('');
    
    const result = await diagnostic.runFullDiagnostic();
    
    if (result) {
      console.log('');
      console.log('✅ Diagnostic completed successfully!');
      console.log(`📊 Overall Score: ${result.overallScore}%`);
      console.log(`🎯 Status: ${result.status}`);
      
      if (result.overallScore >= 70) {
        console.log('');
        console.log('🎉 READY FOR ACTIVATION!');
        console.log('Next: Follow the technical implementation guide to activate administrative intelligence.');
      } else {
        console.log('');
        console.log('🔧 WORK REQUIRED');
        console.log('Next: Address the identified gaps before proceeding with activation.');
      }
    } else {
      console.log('❌ Diagnostic failed to complete');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error running diagnostic:', error.message);
    process.exit(1);
  }
}

// Run the diagnostic
runDiagnostic();

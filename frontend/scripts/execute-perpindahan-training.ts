#!/usr/bin/env npx tsx

/**
 * Execute Perpindahan (Migration/Relocation) Continuous Training
 * Implementation script for comprehensive SELLY Perpindahan training with Groq API enhancement
 * 
 * This script implements the Perpindahan Continuous Training requirements:
 * - Load all Perpindahan training data from JSON files and research material
 * - Execute training pipeline with Phase2Priority1Integration
 * - Apply persona guidelines from persona_dr.md
 * - Enable Perpindahan scenario system (A, B, C, D, E, special cases)
 * - Integrate Groq API for response enhancement
 * - Validate training with test queries
 * - Generate comprehensive training report
 */

import { PerpindahanContinuousTraining } from '../src/services/ai/perpindahanContinuousTraining';

async function executePerpindahanTraining() {
  console.log('🚀 Starting Perpindahan (Migration/Relocation) Continuous Training Implementation');
  console.log('=' .repeat(80));
  
  try {
    // Initialize Perpindahan training system
    const perpindahanTraining = PerpindahanContinuousTraining.getInstance();
    await perpindahanTraining.initialize();
    
    console.log('✅ Perpindahan training system initialized successfully');
    
    // Check Groq API availability
    const groqEnabled = process.env.NEXT_PUBLIC_ENABLE_GROQ_ENHANCEMENT === 'true' && process.env.GROQ_API_KEY;
    console.log(`🤖 Groq API Enhancement: ${groqEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    // Execute comprehensive Perpindahan training
    console.log('\n🎯 Executing Perpindahan training pipeline...');
    const trainingResult = await perpindahanTraining.executePerpindahanTraining({
      targetAccuracy: 0.95,
      maxTrainingTime: 4 * 60 * 60 * 1000, // 4 hours
      validationSplit: 0.2,
      learningRate: 0.001,
      batchSize: 32,
      enableGroqEnhancement: Boolean(groqEnabled)
    });
    
    // Display training results
    console.log('\n📊 Perpindahan Training Results:');
    console.log('=' .repeat(50));
    console.log(`✅ Success: ${trainingResult.success}`);
    console.log(`🎯 Final Accuracy: ${(trainingResult.finalAccuracy * 100).toFixed(1)}%`);
    console.log(`⏱️ Training Duration: ${(trainingResult.trainingDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`📚 Total Training Pairs: ${trainingResult.totalTrainingPairs}`);
    console.log(`🎭 Persona Integration: ${trainingResult.personaIntegration}`);
    console.log(`🎬 Scenario Support: ${trainingResult.scenarioSupport.join(', ')}`);
    
    // Display Groq enhancement results
    console.log('\n🤖 Groq API Enhancement Results:');
    console.log('=' .repeat(40));
    console.log(`✅ Enabled: ${trainingResult.groqEnhancement.enabled}`);
    console.log(`📈 Enhanced Responses: ${trainingResult.groqEnhancement.enhancedResponses}`);
    console.log(`⚡ Average Enhancement Time: ${trainingResult.groqEnhancement.averageEnhancementTime.toFixed(0)}ms`);
    
    // Display test results
    console.log('\n🧪 Validation Test Results:');
    console.log('=' .repeat(50));
    trainingResult.testResults.forEach((test, index) => {
      console.log(`\n${index + 1}. Query: "${test.query}"`);
      console.log(`   Accuracy: ${(test.accuracyScore * 100).toFixed(1)}%`);
      console.log(`   Scenario: ${test.scenarioDetected}`);
      console.log(`   Groq Enhanced: ${test.groqEnhanced ? 'YES' : 'NO'}`);
      if (test.groqEnhanced && test.enhancementTime) {
        console.log(`   Enhancement Time: ${test.enhancementTime}ms`);
      }
      console.log(`   Response: ${test.response.substring(0, 100)}...`);
    });
    
    // Display next steps
    console.log('\n📋 Next Steps:');
    console.log('=' .repeat(30));
    trainingResult.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
    
    // Training completion summary
    console.log('\n🎉 Perpindahan Continuous Training Implementation Completed!');
    console.log('=' .repeat(60));
    
    if (trainingResult.success && trainingResult.finalAccuracy >= 0.95) {
      console.log('✅ SUCCESS: Perpindahan training achieved target accuracy of 95%+');
      console.log('🚀 SELLY is now ready to handle Perpindahan queries with high accuracy');
      console.log('📈 Perpindahan knowledge base has been successfully integrated');
      if (trainingResult.groqEnhancement.enabled) {
        console.log('🤖 Groq API enhancement is active for natural response improvement');
      }
    } else {
      console.log('⚠️ PARTIAL SUCCESS: Training completed but may need optimization');
      console.log(`📊 Achieved accuracy: ${(trainingResult.finalAccuracy * 100).toFixed(1)}%`);
      console.log('🔧 Consider adjusting training parameters for better results');
    }
    
    console.log('\n📄 Training report saved to: docs/training-reports/perpindahan-continuous-training-report.json');
    console.log('📚 Check the report for detailed training metrics and analysis');
    
  } catch (error) {
    console.error('\n❌ Perpindahan Training Failed:');
    console.error('=' .repeat(30));
    console.error(error);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check if all Perpindahan training data files exist in src/data/material/perpindahan/');
    console.log('2. Verify persona_dr.md exists in src/data/material/persona/');
    console.log('3. Ensure all dependencies are properly initialized');
    console.log('4. Check system resources and memory availability');
    console.log('5. Review error logs for specific failure points');
    console.log('6. Verify Groq API configuration if enhancement is enabled');
    
    process.exit(1);
  }
}

// Execute Perpindahan training if run directly
if (require.main === module) {
  executePerpindahanTraining()
    .then(() => {
      console.log('\n🎊 Perpindahan Training Execution Completed Successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Perpindahan Training Execution Failed:', error);
      process.exit(1);
    });
}

export { executePerpindahanTraining };

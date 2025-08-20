#!/usr/bin/env node

/**
 * EMERGENCY: Disable all console.log statements in critical files
 * This is a temporary fix to stop the massive logging flood
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY: Disabling verbose logging...\n');

// Critical files causing the most logging
const criticalFiles = [
  'src/services/ai/aktaKelahiranContinuousTraining.ts',
  'src/services/ai/continuousLearningEngine.ts',
  'src/services/ai/customModelTrainer.ts',
  'src/services/monitoring/monitoringInitializer.ts',
  'src/services/monitoring/performanceMonitor.ts',
  'src/services/chatbot/visualization/RealTimeChartGenerator.ts',
  'src/components/chatbot/ChatbotIntegration.tsx'
];

let totalReplacements = 0;

criticalFiles.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;
    
    // Replace console.log with commented version
    const beforeReplace = content.split('\n').length;
    content = content.replace(/(\s*)console\.log\(/g, '$1// console.log(');
    content = content.replace(/(\s*)console\.warn\(/g, '$1// console.warn(');
    content = content.replace(/(\s*)console\.info\(/g, '$1// console.info(');
    const afterReplace = content.split('\n').length;
    
    // Don't disable console.error - we still need error logging
    
    const newLength = content.length;
    const replacements = (originalLength - newLength + content.split('// console.').length - 1);
    
    if (replacements > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}: ${replacements} log statements disabled`);
      totalReplacements += replacements;
    } else {
      console.log(`ℹ️ ${filePath}: No log statements found`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Emergency fix completed!`);
console.log(`📊 Total log statements disabled: ${totalReplacements}`);
console.log(`\n⚠️ This is a temporary fix. Proper logging should be implemented later.`);

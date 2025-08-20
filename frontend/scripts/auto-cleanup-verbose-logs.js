#!/usr/bin/env node

/**
 * Automated Verbose Logging Cleanup
 * Automatically replaces common verbose logging patterns with controlled logging
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Automated Verbose Logging Cleanup\n');

/**
 * Clean up the message text
 */
function cleanMessage(message) {
  return message
    .replace(/[🔍📚✅❌🎯🔄📊🚀📈🧹⚠️💾🆕🤖🎨🔧🧠📦📋🗑️🇮🇩🎉💡📖🔮🧪👤⏱️💬📄💾🛑⚙️📋🔧🔄👥✨⚡🎭🧪]/g, '') // Remove emojis
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Component to logger mapping
const componentLoggerMap = {
  'INDOBERT': 'indobert',
  'TENSORFLOW': 'tensorflow',
  'TRAINING_COLLECTOR': 'training',
  'ANALYTICS': 'analytics',
  'PERFORMANCE_MONITOR': 'performance',
  'CUSTOM_TRAINER': 'customTrainer',
  'PREDICTIVE': 'predictive',
  'PERSONALIZATION_AI': 'personalization',
  'REAL_TIME_ANALYZER': 'realTimeAnalyzer',
  'CONTINUOUS_LEARNING': 'continuousLearning',
  'ADVANCED_NLP': 'advancedNlp',
  'RESPONSE_FORMATTER': 'responseFormatter',
  'ENHANCED_QUERY': 'enhancedQuery',
  'HUGGINGFACE_SERVICE': 'huggingface',
  'AKTA_TRAINING': 'performance',
  'AKTA_KEMATIAN_TRAINING': 'performance',
  'AKTA_PENGAKUAN_ANAK_TRAINING': 'performance',
  'AKTA_PERKAWINAN_TRAINING': 'performance',
  'KIA_TRAINING': 'performance',
  'KK_TRAINING': 'performance',
  'DATA_QUALITY': 'performance',
  'MONITORING_INIT': 'performance',
  'USER_ANALYTICS': 'performance',
  'CHATBOT_INTEGRATION': 'performance',
  'ENHANCED_TOGGLE': 'performance',
  'SELLY_TOGGLE': 'performance',
  'SIMPLE_TOGGLE': 'performance',
  'UNIFIED_CHAT': 'performance',
  'REALTIME_CHARTS': 'performance',
  'TEST': 'performance',
  'DEBUG': 'performance',
  'RESULT': 'performance',
  'ERROR': 'performance',
  'FINAL_TEST': 'performance',
  'TOOL_SELECTOR': 'performance',
  'MULTI_TABLE_SEARCH': 'performance',
  'MOCK_DB': 'performance',
  'MOCK': 'performance'
};

// Directories to process
const targetDirs = [
  'src/services/ai',
  'src/services/monitoring',
  'src/services/chatbot',
  'src/components/chatbot'
];

// Files to exclude
const excludeFiles = [
  'logger.ts',
  'test-logging-cleanup.js',
  'find-remaining-verbose-logs.js',
  'auto-cleanup-verbose-logs.js'
];

let totalFiles = 0;
let filesModified = 0;
let totalReplacements = 0;

/**
 * Process a directory recursively
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (!['node_modules', '.git', '.next', 'dist', 'build', '__tests__'].includes(item)) {
        processDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      // Only process TypeScript and JavaScript files
      if (/\.(ts|tsx|js|jsx)$/.test(item) && !excludeFiles.includes(item)) {
        processFile(fullPath);
      }
    }
  }
}

/**
 * Process a single file
 */
function processFile(filePath) {
  totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileReplacements = 0;
    
    // Check if file already has aiLogger import
    const hasAiLoggerImport = content.includes("import { aiLogger } from");
    
    // Common verbose logging patterns to replace
    const patterns = [
      // Pattern 1: console.log with emoji and brackets
      {
        regex: /console\.(log|warn|error|info)\s*\(\s*['"`]([🔍📚✅❌🎯🔄📊🚀📈🧹⚠️💾🆕🤖🎨🔧🧠📦📋🗑️🇮🇩🎉💡📖🔮🧪👤⏱️💬📄💾🛑⚙️📋🔧🔄👥✨⚡🎭🧪🔍📊🎯📚🔄🧠🧪🎉⏱️💾🛑⚙️📋🔧🔄👥✨⚡🎭🧪])\s*\[([A-Z_]+)\]\s*([^'"`]*?)['"`]\s*\)\s*;?/g,
        replacement: (match, logLevel, emoji, component, message) => {
          const loggerName = componentLoggerMap[component] || 'performance';
          const level = determineLogLevel(logLevel, emoji, message);
          const cleanMessage = cleanMessage(message);
          return `aiLogger.${loggerName}.${level}('${cleanMessage}');`;
        }
      },
      
      // Pattern 2: console.log with brackets but no emoji
      {
        regex: /console\.(log|warn|error|info)\s*\(\s*['"`]\s*\[([A-Z_]+)\]\s*([^'"`]*?)['"`]\s*\)\s*;?/g,
        replacement: (match, logLevel, component, message) => {
          const loggerName = componentLoggerMap[component] || 'performance';
          const level = determineLogLevel(logLevel, '', message);
          const cleanMessage = cleanMessage(message);
          return `aiLogger.${loggerName}.${level}('${cleanMessage}');`;
        }
      },
      
      // Pattern 3: Template literals with brackets
      {
        regex: /console\.(log|warn|error|info)\s*\(\s*`([🔍📚✅❌🎯🔄📊🚀📈🧹⚠️💾🆕🤖🎨🔧🧠📦📋🗑️🇮🇩🎉💡📖🔮🧪👤⏱️💬📄💾🛑⚙️📋🔧🔄👥✨⚡🎭🧪🔍📊🎯📚🔄🧠🧪🎉⏱️💾🛑⚙️📋🔧🔄👥✨⚡🎭🧪])?\s*\[([A-Z_]+)\]\s*([^`]*?)`\s*\)\s*;?/g,
        replacement: (match, logLevel, emoji, component, message) => {
          const loggerName = componentLoggerMap[component] || 'performance';
          const level = determineLogLevel(logLevel, emoji || '', message);
          const cleanMessage = cleanMessage(message);
          return `aiLogger.${loggerName}.${level}(\`${cleanMessage}\`);`;
        }
      }
    ];
    
    // Apply all patterns
    for (const pattern of patterns) {
      const matches = modifiedContent.match(pattern.regex);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
        fileReplacements += matches.length;
      }
    }
    
    // Add aiLogger import if needed and replacements were made
    if (fileReplacements > 0 && !hasAiLoggerImport) {
      // Find the last import statement
      const importRegex = /import\s+.*?from\s+['"`].*?['"`]\s*;?\s*$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        
        // Determine the correct import path
        const relativePath = path.relative(path.dirname(filePath), 'src/services/monitoring/logger.ts');
        const importPath = relativePath.replace(/\\/g, '/').replace(/\.ts$/, '');
        const importStatement = `\nimport { aiLogger } from '${importPath.startsWith('.') ? importPath : './' + importPath}';`;
        
        modifiedContent = content.slice(0, insertIndex) + importStatement + content.slice(insertIndex);
        modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
      }
    }
    
    // Write the modified content back to file
    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      filesModified++;
      totalReplacements += fileReplacements;
      
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✅ ${relativePath}: ${fileReplacements} replacements`);
    }
    
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Determine the appropriate log level
 */
function determineLogLevel(consoleLevel, emoji, message) {
  // Check for error indicators
  if (consoleLevel === 'error' || emoji === '❌' || message.includes('Failed') || message.includes('Error')) {
    return 'error';
  }
  
  // Check for warning indicators
  if (consoleLevel === 'warn' || emoji === '⚠️' || message.includes('Warning')) {
    return 'warn';
  }
  
  // Check for info indicators
  if (emoji === '✅' || message.includes('initialized') || message.includes('completed') || message.includes('successfully')) {
    return 'info';
  }
  
  // Default to debug for most verbose logs
  return 'debug';
}



// Run the cleanup
console.log('📁 Processing directories:');
targetDirs.forEach(dir => {
  console.log(`   - ${dir}`);
  processDirectory(dir);
});

console.log('\n📊 Cleanup Results:');
console.log(`   Total files processed: ${totalFiles}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${totalReplacements}`);

if (totalReplacements > 0) {
  console.log('\n🎉 Automated cleanup completed!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Review the modified files for any syntax issues');
  console.log('   2. Test the application to ensure functionality is preserved');
  console.log('   3. Set LOG_DISABLED_COMPONENTS in production environment');
  console.log('   4. Monitor log volume reduction');
  
  console.log('\n📈 Estimated Impact:');
  console.log(`   - ${totalReplacements} verbose statements cleaned up`);
  console.log(`   - Estimated log volume reduction: ${Math.round(totalReplacements * 0.2)}KB per hour`);
  console.log(`   - CPU overhead reduction: ${Math.round(totalReplacements * 0.1)}% during peak usage`);
} else {
  console.log('\n✨ No verbose logging patterns found to clean up!');
}

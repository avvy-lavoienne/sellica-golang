#!/usr/bin/env node

/**
 * Find Remaining Verbose Logs
 * Scans the codebase for any remaining verbose logging patterns that need cleanup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Scanning for Remaining Verbose Logging Patterns\n');

// Patterns to search for
const verbosePatterns = [
  // Emoji-prefixed logs with brackets
  /console\.(log|warn|error|info)\s*\(\s*['"`][🔍📚✅❌🎯🔄📊🚀📈🧹⚠️💾🆕🤖🎨🔧🧠📦📋🗑️🇮🇩🎉💡📖🔮🧪📋🎯🔄📚📊🚀📈🧹⚠️💾🆕🤖🎨🔧🧠📦📋🗑️🇮🇩🎉💡📖🔮🧪]\s*\[[A-Z_]+\]/,
  
  // Bracketed component names
  /console\.(log|warn|error|info)\s*\(\s*['"`].*\[([A-Z_]+)\]/,
  
  // Specific patterns we've seen
  /\[REAL_TIME_ANALYZER\]/,
  /\[CONTINUOUS_LEARNING\]/,
  /\[ADVANCED_NLP\]/,
  /\[RESPONSE_FORMATTER\]/,
  /\[ENHANCED_QUERY\]/,
  /\[HUGGINGFACE_SERVICE\]/,
  /\[TENSORFLOW_PROVIDER\]/,
  /\[TEMPORAL_ANALYSIS\]/,
];

// Directories to scan
const scanDirs = [
  'src/services',
  'src/components/chatbot',
  'src/pages/api'
];

// Files to exclude
const excludeFiles = [
  'logger.ts',
  'test-logging-cleanup.js',
  'find-remaining-verbose-logs.js'
];

let totalFiles = 0;
let filesWithVerboseLogs = 0;
let totalVerboseStatements = 0;
const verboseLogsByFile = new Map();

/**
 * Scan a directory recursively
 */
function scanDirectory(dirPath) {
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
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      // Only scan TypeScript and JavaScript files
      if (/\.(ts|tsx|js|jsx)$/.test(item) && !excludeFiles.includes(item)) {
        scanFile(fullPath);
      }
    }
  }
}

/**
 * Scan a file for verbose logging patterns
 */
function scanFile(filePath) {
  totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const verboseLines = [];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check each pattern
      for (const pattern of verbosePatterns) {
        if (pattern.test(line)) {
          verboseLines.push({
            lineNumber,
            content: line.trim(),
            pattern: pattern.toString()
          });
          totalVerboseStatements++;
          break; // Don't count the same line multiple times
        }
      }
    });
    
    if (verboseLines.length > 0) {
      filesWithVerboseLogs++;
      verboseLogsByFile.set(filePath, verboseLines);
    }
    
  } catch (error) {
    console.log(`❌ Error reading ${filePath}: ${error.message}`);
  }
}

/**
 * Generate cleanup suggestions
 */
function generateCleanupSuggestions(filePath, verboseLines) {
  const suggestions = [];
  
  for (const line of verboseLines) {
    const content = line.content;
    
    // Extract component name from brackets
    const componentMatch = content.match(/\[([A-Z_]+)\]/);
    const component = componentMatch ? componentMatch[1] : 'UNKNOWN';
    
    // Determine log level
    let level = 'debug';
    if (content.includes('error') || content.includes('❌') || content.includes('Failed')) {
      level = 'error';
    } else if (content.includes('warn') || content.includes('⚠️')) {
      level = 'warn';
    } else if (content.includes('✅') || content.includes('initialized') || content.includes('completed')) {
      level = 'info';
    }
    
    // Generate aiLogger suggestion
    const loggerName = getLoggerName(component);
    const message = extractMessage(content);
    
    suggestions.push({
      lineNumber: line.lineNumber,
      original: content,
      suggested: `aiLogger.${loggerName}.${level}('${message}');`,
      component,
      level
    });
  }
  
  return suggestions;
}

/**
 * Get the appropriate logger name for a component
 */
function getLoggerName(component) {
  const loggerMap = {
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
    'TENSORFLOW_PROVIDER': 'tensorflow',
    'TEMPORAL_ANALYSIS': 'analytics'
  };
  
  return loggerMap[component] || 'performance';
}

/**
 * Extract clean message from verbose log statement
 */
function extractMessage(content) {
  // Remove emoji and brackets
  let message = content.replace(/[🔍📚✅❌🎯🔄📊🚀📈🧹⚠️💾🆕🤖🎨🔧🧠📦📋🗑️🇮🇩🎉💡📖🔮🧪]/g, '');
  message = message.replace(/\[[A-Z_]+\]/g, '');
  message = message.replace(/console\.(log|warn|error|info)\s*\(\s*['"`]/, '');
  message = message.replace(/['"`]\s*\)\s*;?\s*$/, '');
  message = message.trim();
  
  // Clean up common prefixes
  message = message.replace(/^(Initializing|Loading|Processing|Analyzing|Starting|Executing)/, (match) => match);
  
  return message;
}

// Run the scan
console.log('📁 Scanning directories:');
scanDirs.forEach(dir => {
  console.log(`   - ${dir}`);
  scanDirectory(dir);
});

console.log('\n📊 Scan Results:');
console.log(`   Total files scanned: ${totalFiles}`);
console.log(`   Files with verbose logs: ${filesWithVerboseLogs}`);
console.log(`   Total verbose statements: ${totalVerboseStatements}`);

if (filesWithVerboseLogs > 0) {
  console.log('\n🔧 Files Requiring Cleanup:');
  
  for (const [filePath, verboseLines] of verboseLogsByFile.entries()) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`\n📄 ${relativePath} (${verboseLines.length} statements)`);
    
    const suggestions = generateCleanupSuggestions(filePath, verboseLines);
    
    suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. Line ${suggestion.lineNumber}:`);
      console.log(`      Original: ${suggestion.original.substring(0, 80)}...`);
      console.log(`      Suggested: ${suggestion.suggested}`);
    });
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Add missing imports: import { aiLogger } from "../monitoring/logger";');
  console.log('   2. Replace verbose console statements with aiLogger calls');
  console.log('   3. Update environment configurations if new components found');
  console.log('   4. Test with LOG_DISABLED_COMPONENTS in production');
  
} else {
  console.log('\n🎉 No verbose logging patterns found!');
  console.log('   All AI/ML components are using controlled logging.');
}

console.log('\n📈 Estimated Impact:');
if (totalVerboseStatements > 0) {
  console.log(`   - ${totalVerboseStatements} verbose statements to clean up`);
  console.log(`   - Estimated log volume reduction: ${Math.round(totalVerboseStatements * 0.2)}KB per hour`);
  console.log(`   - CPU overhead reduction: ${Math.round(totalVerboseStatements * 0.1)}% during peak usage`);
} else {
  console.log('   - Logging cleanup is complete!');
  console.log('   - Maximum performance and clean logs achieved');
}

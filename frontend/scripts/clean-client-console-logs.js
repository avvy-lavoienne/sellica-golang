#!/usr/bin/env node

/**
 * Clean Client-Side Console Logs
 * Removes or comments out console.log statements from React components
 * to prevent browser console flooding
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning Client-Side Console Logs\n');

// Client-side directories to scan
const clientDirs = [
  'src/components',
  'src/contexts',
  'src/hooks',
  'src/app/(protected)',
  'src/pages'
];

// Patterns to clean up
const consolePatterns = [
  // Dashboard and component logs
  /console\.log\s*\(\s*['"`]🏠\s*Dashboard:[^'"`]*['"`][^)]*\)\s*;?\s*\n?/g,
  
  // Chat context logs
  /console\.log\s*\(\s*['"`]ChatContext:[^'"`]*['"`][^)]*\)\s*;?\s*\n?/g,
  
  // useChatHistory logs
  /console\.log\s*\(\s*['"`]useChatHistory:[^'"`]*['"`][^)]*\)\s*;?\s*\n?/g,
  
  // AI response logs
  /console\.log\s*\(\s*['"`]✅\s*\[CHAT_CONTEXT\][^'"`]*['"`][^)]*\)\s*;?\s*\n?/g,
  
  // Recent Activities logs
  /console\.log\s*\(\s*['"`]Recent Activities:[^'"`]*['"`][^)]*\)\s*;?\s*\n?/g,
  
  // Generic component debugging logs
  /console\.log\s*\(\s*['"`][🔧🔄✨🔍🎯📊🏠][^'"`]*['"`][^)]*\)\s*;?\s*\n?/g,
  
  // Performance logs in client components
  /console\.log\s*\(\s*['"`]📊\s*\[PERFORMANCE\][^'"`]*['"`][^)]*\)\s*;?\s*\n?/g
];

let totalFiles = 0;
let filesFixed = 0;
let totalRemovals = 0;

/**
 * Clean console logs from a file
 */
function cleanFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return;
    }

    const originalContent = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = originalContent;
    let fileRemovals = 0;

    // Apply all console log removal patterns
    for (const pattern of consolePatterns) {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern, '');
        fileRemovals += matches.length;
      }
    }

    // Additional specific patterns for client-side components
    const specificPatterns = [
      // Comment out instead of removing for debugging purposes
      {
        regex: /^(\s*)console\.log\s*\(\s*(['"`][^'"`]*Recent Activities[^'"`]*['"`][^)]*)\)\s*;?\s*$/gm,
        replacement: '$1// console.log($2);'
      },
      {
        regex: /^(\s*)console\.log\s*\(\s*(['"`][^'"`]*Dashboard:[^'"`]*['"`][^)]*)\)\s*;?\s*$/gm,
        replacement: '$1// console.log($2);'
      },
      {
        regex: /^(\s*)console\.log\s*\(\s*(['"`][^'"`]*ChatContext:[^'"`]*['"`][^)]*)\)\s*;?\s*$/gm,
        replacement: '$1// console.log($2);'
      },
      {
        regex: /^(\s*)console\.log\s*\(\s*(['"`][^'"`]*useChatHistory:[^'"`]*['"`][^)]*)\)\s*;?\s*$/gm,
        replacement: '$1// console.log($2);'
      }
    ];

    // Apply specific commenting patterns
    for (const pattern of specificPatterns) {
      const matches = modifiedContent.match(pattern.regex);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
        fileRemovals += matches.length;
      }
    }

    // Only write if changes were made
    if (modifiedContent !== originalContent) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`✅ ${filePath}: ${fileRemovals} console logs cleaned`);
      filesFixed++;
      totalRemovals += fileRemovals;
    }

    totalFiles++;

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Scan directory for React/TypeScript files
 */
function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Directory not found: ${dirPath}`);
    return;
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (!['node_modules', '.git', '.next', 'dist', 'build', '__tests__'].includes(item)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      // Process React/TypeScript files
      if (/\.(tsx|jsx|ts)$/.test(item)) {
        cleanFile(fullPath);
      }
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning client-side directories for console logs...\n');

  // Scan each client directory
  clientDirs.forEach(dir => {
    console.log(`📁 Scanning: ${dir}`);
    scanDirectory(dir);
  });

  console.log('\n📊 Cleanup Results:');
  console.log(`   Files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${filesFixed}`);
  console.log(`   Console logs cleaned: ${totalRemovals}`);

  if (totalRemovals > 0) {
    console.log('\n🎉 Client-side console log cleanup completed!');
    console.log('\n💡 Benefits:');
    console.log('   ✅ Cleaner browser console');
    console.log('   ✅ Better debugging experience');
    console.log('   ✅ Reduced client-side noise');
    console.log('   ✅ Professional production logs');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Test the application in browser');
    console.log('   2. Verify console is clean');
    console.log('   3. Check that functionality is preserved');
    console.log('   4. Consider adding development-only logging if needed');
  } else {
    console.log('\n✨ No client-side console logs found to clean!');
    console.log('   Browser console should already be clean.');
  }
}

// Run the cleanup
main();

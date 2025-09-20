#!/usr/bin/env node

/**
 * Fix Legacy Imports Script
 * This script finds and comments out all imports pointing to the legacy backend
 */

const fs = require('fs');
const path = require('path');

const LEGACY_IMPORT_PATTERNS = [
  /import.*from.*selly-legacy-nextjs-backend/g,
  /import.*from.*\.\.\/\.\.\/\.\.\/selly-legacy-nextjs-backend/g,
  /import.*from.*\.\.\/\.\.\/\.\.\/\.\.\/selly-legacy-nextjs-backend/g,
  /import.*from.*\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/selly-legacy-nextjs-backend/g,
];

function findTSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTSFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    for (const pattern of LEGACY_IMPORT_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          const commented = `// DISABLED FOR CORE BUILD\n// ${match}`;
          newContent = newContent.replace(match, commented);
          modified = true;
          console.log(`📝 Fixed import in: ${filePath}`);
          console.log(`   ${match} -> ${commented.replace('\n', ' ')}`);
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing legacy backend imports...');
  
  const srcDir = path.join(__dirname, 'src');
  const tsFiles = findTSFiles(srcDir);
  
  let fixedFiles = 0;
  
  for (const file of tsFiles) {
    if (fixImportsInFile(file)) {
      fixedFiles++;
    }
  }
  
  console.log(`✨ Done! Fixed imports in ${fixedFiles} files.`);
  
  if (fixedFiles > 0) {
    console.log('\n📝 Note: You may need to add mock implementations for disabled services.');
    console.log('   Check the console for any runtime errors and add fallbacks as needed.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixImportsInFile, findTSFiles };

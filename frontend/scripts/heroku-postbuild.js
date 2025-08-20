#!/usr/bin/env node

/**
 * Heroku Post-Build Optimization Script
 * Reduces bundle size by removing unnecessary files and optimizing assets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Heroku post-build optimization...');

// Remove unnecessary files to reduce slug size
const filesToRemove = [
  // Remove test files (keep src/app for Next.js)
  '__tests__',
  'coverage',
  'jest.config.js',
  'jest.config.enhanced.js',
  'jest.setup.js',
  'jest.canvas.setup.js',

  // Remove specific test files within src
  'src/test',
  'src/services/chatbot/__tests__',
  'src/services/chatbot/test-groq.ts',
  'src/services/chatbot/test-hf.ts',

  // Remove documentation
  'docs',
  'README.md',
  'CHANGELOG.md',

  // Remove development scripts (keep this script until after execution)
  'build.js',

  // TensorFlow modules removed - no longer needed

  // Remove Canvas native binaries (use web version)
  'node_modules/canvas/build',
  'node_modules/canvas/src',

  // Remove MUI source maps and unnecessary files
  'node_modules/@mui/*/src',
  'node_modules/@mui/*/*.map',
  'node_modules/@mui/*/build',
  'node_modules/@mui/*/es',

  // Remove Emotion source maps and dev files
  'node_modules/@emotion/*/*.map',
  'node_modules/@emotion/*/src',
  'node_modules/@emotion/*/dist/emotion-*.dev.js',

  // Remove development dependencies that might have been installed
  'node_modules/@types',
  'node_modules/typescript',
  'node_modules/eslint',
  'node_modules/jest',
  'node_modules/@testing-library',
  'node_modules/ts-jest',
  'node_modules/tsx',

  // Remove large chart library files we don't need
  'node_modules/apexcharts/dist/apexcharts.amd.js',
  'node_modules/chart.js/dist/chart.umd.js',

  // Remove Framer Motion dev files
  'node_modules/framer-motion/dist/es',
  'node_modules/framer-motion/dist/size-rollup-plugin.js',

  // Remove React dev files
  'node_modules/react/cjs/react.development.js',
  'node_modules/react-dom/cjs/react-dom.development.js',

  // Remove Next.js dev files (keep babel - needed for build)
  'node_modules/next/dist/compiled/webpack',
  // 'node_modules/next/dist/compiled/babel', // Keep babel - required for build process
  'node_modules/next/dist/compiled/terser',
];

function removeFileOrDir(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`📁 Removed directory: ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`📄 Removed file: ${filePath}`);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not remove ${filePath}:`, error.message);
  }
}

// Remove unnecessary files
console.log('🧹 Removing unnecessary files...');
filesToRemove.forEach(removeFileOrDir);

// Optimize Next.js build
console.log('⚡ Optimizing Next.js build...');
try {
  // Remove Next.js cache to save space
  if (fs.existsSync('.next/cache')) {
    fs.rmSync('.next/cache', { recursive: true, force: true });
    console.log('🗑️  Removed Next.js cache');
  }
  
  // Remove trace files
  if (fs.existsSync('.next/trace')) {
    fs.rmSync('.next/trace', { recursive: true, force: true });
    console.log('🗑️  Removed Next.js trace files');
  }
  
  // Remove webpack artifacts
  const nextStaticPath = '.next/static/chunks';
  if (fs.existsSync(nextStaticPath)) {
    const files = fs.readdirSync(nextStaticPath);
    files.forEach(file => {
      if (file.startsWith('webpack-') && file.endsWith('.js')) {
        fs.unlinkSync(path.join(nextStaticPath, file));
        console.log(`🗑️  Removed webpack artifact: ${file}`);
      }
    });
  }
} catch (error) {
  console.warn('⚠️  Error optimizing Next.js build:', error.message);
}

// Clean up node_modules aggressively
console.log('📦 Cleaning up node_modules...');
try {
  // Use PowerShell commands for Windows compatibility
  const commands = [
    // Remove .cache directories
    'Get-ChildItem -Path node_modules -Recurse -Directory -Name ".cache" | ForEach-Object { Remove-Item -Path "node_modules/$_" -Recurse -Force -ErrorAction SilentlyContinue }',

    // Remove source maps
    'Get-ChildItem -Path node_modules -Recurse -File -Name "*.map" | ForEach-Object { Remove-Item -Path "node_modules/$_" -Force -ErrorAction SilentlyContinue }',

    // Remove README files
    'Get-ChildItem -Path node_modules -Recurse -File -Name "README*" | ForEach-Object { Remove-Item -Path "node_modules/$_" -Force -ErrorAction SilentlyContinue }',

    // Remove CHANGELOG files
    'Get-ChildItem -Path node_modules -Recurse -File -Name "CHANGELOG*" | ForEach-Object { Remove-Item -Path "node_modules/$_" -Force -ErrorAction SilentlyContinue }',

    // Remove test files
    'Get-ChildItem -Path node_modules -Recurse -File -Name "*.test.js" | ForEach-Object { Remove-Item -Path "node_modules/$_" -Force -ErrorAction SilentlyContinue }',

    // Remove TypeScript declaration files we don't need
    'Get-ChildItem -Path node_modules -Recurse -File -Name "*.d.ts" | Where-Object { $_.FullName -notlike "*/@types/*" } | ForEach-Object { Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue }',
  ];

  commands.forEach(cmd => {
    try {
      execSync(`powershell -Command "${cmd}"`, { stdio: 'pipe' });
    } catch (error) {
      // Ignore errors for individual cleanup commands
    }
  });

  console.log('✅ Node modules cleanup completed');
} catch (error) {
  console.warn('⚠️  Error cleaning node_modules:', error.message);
}

// Report final size
try {
  const result = execSync('du -sh . 2>/dev/null || echo "Size calculation not available"', { encoding: 'utf8' });
  console.log(`📊 Final build size: ${result.trim()}`);
} catch (error) {
  console.log('📊 Size calculation not available on this system');
}

// Final cleanup - remove scripts directory after execution
console.log('🧹 Final cleanup...');
setTimeout(() => {
  try {
    if (fs.existsSync('scripts')) {
      fs.rmSync('scripts', { recursive: true, force: true });
      console.log('📁 Removed scripts directory');
    }
  } catch (error) {
    console.warn('⚠️  Could not remove scripts directory:', error.message);
  }
}, 1000);

console.log('✅ Heroku post-build optimization completed!');

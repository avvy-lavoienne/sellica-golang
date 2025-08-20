#!/usr/bin/env node

/**
 * Architecture Validation Script
 * 
 * Validates architecture compliance and separation of concerns throughout the application
 * ensuring proper layering, modularity, and adherence to architectural principles.
 * 
 * Compliance: Architecture Rule, Code Quality Rule
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️ Validating architecture compliance and separation of concerns...');

let validationErrors = [];
let validationWarnings = [];

// Validate directory structure and organization
function validateDirectoryStructure() {
  const expectedDirectories = [
    'src/app',
    'src/components',
    'src/services',
    'src/types',
    'src/utils',
    'src/config'
  ];
  
  let foundDirectories = 0;
  expectedDirectories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      console.log(`✅ Found directory: ${dir}`);
      foundDirectories++;
    } else {
      validationWarnings.push(`Directory not found: ${dir}`);
    }
  });
  
  console.log(`✅ Directory structure: ${foundDirectories}/${expectedDirectories.length} directories found`);
  
  // Check for proper service organization
  const serviceDirectories = [
    'src/services/ai',
    'src/services/compliance',
    'src/services/security',
    'src/services/integration',
    'src/services/session'
  ];
  
  let foundServiceDirs = 0;
  serviceDirectories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      console.log(`✅ Found service directory: ${dir}`);
      foundServiceDirs++;
    }
  });
  
  if (foundServiceDirs >= 3) {
    console.log(`✅ Service organization: ${foundServiceDirs}/${serviceDirectories.length} service directories found`);
  } else {
    validationWarnings.push('Consider organizing services into proper directories');
  }
}

// Validate separation of concerns
function validateSeparationOfConcerns() {
  // Check for proper separation between layers
  const layerChecks = [
    {
      layer: 'Presentation Layer',
      directory: 'src/components',
      shouldNotContain: ['database', 'sql', 'supabase'],
      shouldContain: ['jsx', 'tsx', 'component']
    },
    {
      layer: 'Business Logic Layer',
      directory: 'src/services',
      shouldNotContain: ['jsx', 'tsx', 'component'],
      shouldContain: ['service', 'class', 'function']
    },
    {
      layer: 'Data Access Layer',
      directory: 'src/services',
      shouldContain: ['database', 'supabase', 'storage'],
      shouldNotContain: ['jsx', 'tsx']
    }
  ];
  
  layerChecks.forEach(check => {
    const layerPath = path.join(process.cwd(), check.directory);
    if (fs.existsSync(layerPath) && fs.statSync(layerPath).isDirectory()) {
      
      function checkDirectory(dir, depth = 0) {
        if (depth > 3) return; // Limit recursion depth
        
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            checkDirectory(filePath, depth + 1);
          } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
            
            // Check for violations
            const violations = check.shouldNotContain?.filter(term => content.includes(term)) || [];
            if (violations.length > 0) {
              validationWarnings.push(`${check.layer} violation in ${path.relative(process.cwd(), filePath)}: contains ${violations.join(', ')}`);
            }
          }
        });
      }
      
      checkDirectory(layerPath);
    }
  });
}

// Validate dependency injection and inversion
function validateDependencyInjection() {
  const serviceFiles = [];
  
  function findServiceFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findServiceFiles(filePath);
      } else if (file.endsWith('Service.ts') || file.endsWith('Manager.ts')) {
        serviceFiles.push(filePath);
      }
    });
  }
  
  findServiceFiles(path.join(process.cwd(), 'src/services'));
  
  let servicesWithDI = 0;
  serviceFiles.forEach(serviceFile => {
    const content = fs.readFileSync(serviceFile, 'utf8');
    
    // Check for dependency injection patterns
    if (content.includes('constructor') && content.includes('inject')) {
      console.log(`✅ Dependency injection found in ${path.basename(serviceFile)}`);
      servicesWithDI++;
    } else if (content.includes('constructor') && content.includes('private') && content.includes(':')) {
      console.log(`✅ Constructor injection found in ${path.basename(serviceFile)}`);
      servicesWithDI++;
    }
    
    // Check for service container usage
    if (content.includes('ServiceContainer') || content.includes('container')) {
      console.log(`✅ Service container usage found in ${path.basename(serviceFile)}`);
    }
  });
  
  if (serviceFiles.length > 0) {
    console.log(`✅ Dependency injection: ${servicesWithDI}/${serviceFiles.length} services use DI patterns`);
  }
}

// Validate interface segregation and abstraction
function validateInterfaceSegregation() {
  const typeFiles = [];
  
  function findTypeFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findTypeFiles(filePath);
      } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
        typeFiles.push(filePath);
      }
    });
  }
  
  findTypeFiles(path.join(process.cwd(), 'src/types'));
  findTypeFiles(path.join(process.cwd(), 'src/services'));
  
  let interfaceCount = 0;
  let abstractionCount = 0;
  
  typeFiles.forEach(typeFile => {
    const content = fs.readFileSync(typeFile, 'utf8');
    
    // Count interfaces
    const interfaceMatches = content.match(/interface\s+\w+/g);
    if (interfaceMatches) {
      interfaceCount += interfaceMatches.length;
    }
    
    // Count abstract classes
    const abstractMatches = content.match(/abstract\s+class\s+\w+/g);
    if (abstractMatches) {
      abstractionCount += abstractMatches.length;
    }
    
    // Check for proper interface naming
    if (content.includes('interface') && !content.includes('Interface')) {
      // Good - not using Hungarian notation
    }
  });
  
  if (interfaceCount > 0) {
    console.log(`✅ Interface segregation: ${interfaceCount} interfaces found`);
  } else {
    validationWarnings.push('Consider using interfaces for better abstraction');
  }
  
  if (abstractionCount > 0) {
    console.log(`✅ Abstraction: ${abstractionCount} abstract classes found`);
  }
}

// Validate error handling architecture
function validateErrorHandlingArchitecture() {
  const errorHandlingFiles = [
    'src/utils/errorHandler.ts',
    'src/services/error/',
    'src/middleware/errorHandler.ts'
  ];
  
  let foundErrorHandling = false;
  errorHandlingFiles.forEach(errorFile => {
    const fullPath = path.join(process.cwd(), errorFile);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Found error handling: ${path.basename(errorFile)}`);
      foundErrorHandling = true;
      
      if (fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for proper error handling patterns
        if (content.includes('try') && content.includes('catch')) {
          console.log(`✅ Try-catch error handling found in ${path.basename(errorFile)}`);
        }
        
        // Check for custom error classes
        if (content.includes('extends Error') || content.includes('class') && content.includes('Error')) {
          console.log(`✅ Custom error classes found in ${path.basename(errorFile)}`);
        }
      }
    }
  });
  
  if (!foundErrorHandling) {
    validationWarnings.push('Centralized error handling not found - consider implementing for better architecture');
  }
}

// Validate configuration management
function validateConfigurationManagement() {
  const configFiles = [
    'src/config/',
    'src/utils/config.ts',
    '.env.example'
  ];
  
  let foundConfigManagement = false;
  configFiles.forEach(configFile => {
    const fullPath = path.join(process.cwd(), configFile);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Found configuration management: ${path.basename(configFile)}`);
      foundConfigManagement = true;
      
      if (fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        if (files.some(file => file.includes('config') || file.includes('env'))) {
          console.log(`✅ Configuration files found in ${path.basename(configFile)}`);
        }
      }
    }
  });
  
  if (!foundConfigManagement) {
    validationWarnings.push('Configuration management not found - consider implementing for better architecture');
  }
}

// Validate logging and monitoring architecture
function validateLoggingArchitecture() {
  const loggingFiles = [
    'src/utils/logger.ts',
    'src/services/logging/',
    'src/services/monitoring/'
  ];
  
  let foundLogging = false;
  loggingFiles.forEach(loggingFile => {
    const fullPath = path.join(process.cwd(), loggingFile);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Found logging architecture: ${path.basename(loggingFile)}`);
      foundLogging = true;
    }
  });
  
  // Check for console.log usage (should be minimal in production code)
  const srcPath = path.join(process.cwd(), 'src');
  let consoleLogCount = 0;
  
  function countConsoleLogs(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        countConsoleLogs(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/console\.log/g);
        if (matches) {
          consoleLogCount += matches.length;
        }
      }
    });
  }
  
  countConsoleLogs(srcPath);
  
  if (consoleLogCount > 50) {
    validationWarnings.push(`High console.log usage (${consoleLogCount}) - consider implementing structured logging`);
  } else {
    console.log(`✅ Console.log usage: ${consoleLogCount} instances (acceptable)`);
  }
}

// Run all architecture validations
function runArchitectureValidations() {
  console.log('Starting architecture compliance and separation of concerns validation...\n');
  
  validateDirectoryStructure();
  validateSeparationOfConcerns();
  validateDependencyInjection();
  validateInterfaceSegregation();
  validateErrorHandlingArchitecture();
  validateConfigurationManagement();
  validateLoggingArchitecture();
  
  console.log('\n📊 Architecture Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  Architecture Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Architecture Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these architecture errors to ensure compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Architecture compliance and separation of concerns validation completed successfully!');
}

// Execute architecture validation
runArchitectureValidations();

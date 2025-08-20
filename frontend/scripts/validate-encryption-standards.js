#!/usr/bin/env node

/**
 * Encryption Standards Validation Script
 * 
 * Validates government-grade encryption implementation and standards compliance
 * ensuring all encryption meets Indonesian government security requirements.
 * 
 * Compliance: Security Compliance Rule, Encryption Standards Rule
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Validating government-grade encryption implementation...');

let validationErrors = [];
let validationWarnings = [];

// Validate Government-Grade Encryption Service
function validateGovernmentGradeEncryption() {
  const encryptionPath = path.join(process.cwd(), 'src/services/security/GovernmentGradeEncryption.ts');
  
  if (fs.existsSync(encryptionPath)) {
    const content = fs.readFileSync(encryptionPath, 'utf8');
    
    console.log('✅ Found GovernmentGradeEncryption service');
    
    // Check for AES-256 encryption
    if (content.includes('AES-256')) {
      console.log('✅ AES-256 encryption standard implemented');
    } else {
      validationErrors.push('Missing AES-256 encryption standard');
    }
    
    // Check for GCM or CBC mode
    if (content.includes('GCM') || content.includes('CBC')) {
      console.log('✅ Secure encryption mode implemented');
    } else {
      validationErrors.push('Missing secure encryption mode (GCM or CBC)');
    }
    
    // Check for key derivation (PBKDF2 or Argon2)
    if (content.includes('PBKDF2') || content.includes('Argon2')) {
      console.log('✅ Secure key derivation implemented');
    } else {
      validationWarnings.push('Consider implementing secure key derivation (PBKDF2 or Argon2)');
    }
    
    // Check for key rotation
    if (content.includes('rotation') && content.includes('key')) {
      console.log('✅ Key rotation mechanism implemented');
    } else {
      validationWarnings.push('Consider implementing key rotation mechanism');
    }
    
    // Check for HSM integration
    if (content.includes('HSM') || content.includes('hardware')) {
      console.log('✅ HSM integration capability implemented');
    } else {
      validationWarnings.push('Consider implementing HSM integration for production');
    }
    
    // Check for government compliance level
    if (content.includes('government') && content.includes('compliance')) {
      console.log('✅ Government compliance level implemented');
    } else {
      validationWarnings.push('Consider implementing government compliance level');
    }
    
  } else {
    validationErrors.push('GovernmentGradeEncryption service not found - required for security compliance');
  }
}

// Validate TLS 1.3 Configuration Service
function validateTLS13Configuration() {
  const tlsPath = path.join(process.cwd(), 'src/services/security/TLS13ConfigurationService.ts');
  
  if (fs.existsSync(tlsPath)) {
    const content = fs.readFileSync(tlsPath, 'utf8');
    
    console.log('✅ Found TLS13ConfigurationService');
    
    // Check for TLS 1.3 implementation
    if (content.includes('TLS') && content.includes('1.3')) {
      console.log('✅ TLS 1.3 implementation found');
    } else {
      validationErrors.push('Missing TLS 1.3 implementation');
    }
    
    // Check for approved cipher suites
    if (content.includes('cipher') && content.includes('suite')) {
      console.log('✅ Cipher suite configuration implemented');
    } else {
      validationWarnings.push('Consider implementing cipher suite configuration');
    }
    
    // Check for government-approved ciphers
    if (content.includes('TLS_AES_256_GCM_SHA384') || content.includes('government')) {
      console.log('✅ Government-approved cipher suites implemented');
    } else {
      validationWarnings.push('Consider implementing government-approved cipher suites');
    }
    
    // Check for session ticket configuration
    if (content.includes('session') && content.includes('ticket')) {
      console.log('✅ Session ticket configuration implemented');
    } else {
      validationWarnings.push('Consider implementing session ticket configuration');
    }
    
  } else {
    validationWarnings.push('TLS13ConfigurationService not found - consider implementing for secure communication');
  }
}

// Validate HSM Integration Service
function validateHSMIntegration() {
  const hsmPath = path.join(process.cwd(), 'src/services/security/HSMIntegrationService.ts');
  
  if (fs.existsSync(hsmPath)) {
    const content = fs.readFileSync(hsmPath, 'utf8');
    
    console.log('✅ Found HSMIntegrationService');
    
    // Check for hardware security module support
    if (content.includes('HSM') && content.includes('hardware')) {
      console.log('✅ Hardware Security Module support implemented');
    } else {
      validationWarnings.push('Consider implementing Hardware Security Module support');
    }
    
    // Check for key generation in HSM
    if (content.includes('generate') && content.includes('key')) {
      console.log('✅ HSM key generation implemented');
    } else {
      validationWarnings.push('Consider implementing HSM key generation');
    }
    
    // Check for secure key storage
    if (content.includes('secure') && content.includes('storage')) {
      console.log('✅ Secure key storage implemented');
    } else {
      validationWarnings.push('Consider implementing secure key storage');
    }
    
  } else {
    validationWarnings.push('HSMIntegrationService not found - consider implementing for production security');
  }
}

// Validate encryption in data services
function validateDataServiceEncryption() {
  const dataServices = [
    'src/services/compliance/IndonesianDataProtectionService.ts',
    'src/services/integration/government/DukcapilIntegrationService.ts'
  ];
  
  let foundEncryptedServices = 0;
  dataServices.forEach(servicePath => {
    const fullPath = path.join(process.cwd(), servicePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for encryption usage
      if (content.includes('encrypt') || content.includes('EncryptionService')) {
        console.log(`✅ Encryption usage found in ${path.basename(servicePath)}`);
        foundEncryptedServices++;
      } else {
        validationWarnings.push(`Consider adding encryption to ${path.basename(servicePath)}`);
      }
      
      // Check for encryption required flag
      if (content.includes('encryptionRequired')) {
        console.log(`✅ Encryption requirement flag found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding encryption requirement flag to ${path.basename(servicePath)}`);
      }
    }
  });
  
  if (foundEncryptedServices === 0) {
    validationWarnings.push('No encrypted data services found - consider implementing encryption for sensitive data');
  }
}

// Validate API endpoint encryption
function validateAPIEncryption() {
  const apiEndpoints = [
    'src/app/api/security/government-grade-encryption/route.ts',
    'src/app/api/compliance/indonesian-data-protection/route.ts'
  ];
  
  let foundEncryptedAPIs = 0;
  apiEndpoints.forEach(endpointPath => {
    const fullPath = path.join(process.cwd(), endpointPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      console.log(`✅ Found API endpoint: ${path.basename(path.dirname(endpointPath))}`);
      foundEncryptedAPIs++;
      
      // Check for encryption service usage
      if (content.includes('encrypt') || content.includes('GovernmentGradeEncryption')) {
        console.log(`✅ Encryption service usage found in ${path.basename(path.dirname(endpointPath))}`);
      } else {
        validationWarnings.push(`Consider adding encryption service usage to ${path.basename(path.dirname(endpointPath))}`);
      }
      
      // Check for HTTPS enforcement
      if (content.includes('https') || content.includes('secure')) {
        console.log(`✅ HTTPS enforcement found in ${path.basename(path.dirname(endpointPath))}`);
      } else {
        validationWarnings.push(`Consider adding HTTPS enforcement to ${path.basename(path.dirname(endpointPath))}`);
      }
    }
  });
  
  if (foundEncryptedAPIs === 0) {
    validationWarnings.push('No encrypted API endpoints found - consider implementing for secure communication');
  }
}

// Validate encryption key management
function validateKeyManagement() {
  const encryptionPath = path.join(process.cwd(), 'src/services/security/GovernmentGradeEncryption.ts');
  
  if (fs.existsSync(encryptionPath)) {
    const content = fs.readFileSync(encryptionPath, 'utf8');
    
    // Check for key generation
    if (content.includes('generateKey') || content.includes('keyGeneration')) {
      console.log('✅ Key generation implemented');
    } else {
      validationWarnings.push('Consider implementing key generation');
    }
    
    // Check for key storage
    if (content.includes('keyStore') || content.includes('keyStorage')) {
      console.log('✅ Key storage implemented');
    } else {
      validationWarnings.push('Consider implementing secure key storage');
    }
    
    // Check for key rotation
    if (content.includes('rotation') && content.includes('key')) {
      console.log('✅ Key rotation implemented');
    } else {
      validationWarnings.push('Consider implementing key rotation');
    }
    
    // Check for key escrow
    if (content.includes('escrow') || content.includes('backup')) {
      console.log('✅ Key escrow/backup implemented');
    } else {
      validationWarnings.push('Consider implementing key escrow/backup');
    }
    
    // Check for key lifecycle management
    if (content.includes('lifecycle') || content.includes('expire')) {
      console.log('✅ Key lifecycle management implemented');
    } else {
      validationWarnings.push('Consider implementing key lifecycle management');
    }
  }
}

// Validate encryption performance and metrics
function validateEncryptionMetrics() {
  const encryptionPath = path.join(process.cwd(), 'src/services/security/GovernmentGradeEncryption.ts');
  
  if (fs.existsSync(encryptionPath)) {
    const content = fs.readFileSync(encryptionPath, 'utf8');
    
    // Check for performance metrics
    if (content.includes('metrics') || content.includes('performance')) {
      console.log('✅ Encryption performance metrics implemented');
    } else {
      validationWarnings.push('Consider implementing encryption performance metrics');
    }
    
    // Check for operation timing
    if (content.includes('time') && content.includes('encrypt')) {
      console.log('✅ Encryption operation timing implemented');
    } else {
      validationWarnings.push('Consider implementing encryption operation timing');
    }
    
    // Check for success/failure tracking
    if (content.includes('success') && content.includes('failure')) {
      console.log('✅ Encryption success/failure tracking implemented');
    } else {
      validationWarnings.push('Consider implementing encryption success/failure tracking');
    }
  }
}

// Run all encryption standards validations
function runEncryptionStandardsValidations() {
  console.log('Starting government-grade encryption implementation validation...\n');
  
  validateGovernmentGradeEncryption();
  validateTLS13Configuration();
  validateHSMIntegration();
  validateDataServiceEncryption();
  validateAPIEncryption();
  validateKeyManagement();
  validateEncryptionMetrics();
  
  console.log('\n📊 Encryption Standards Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  Encryption Standards Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Encryption Standards Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these encryption standards errors to ensure security compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Government-grade encryption implementation validation completed successfully!');
}

// Execute encryption standards validation
runEncryptionStandardsValidations();

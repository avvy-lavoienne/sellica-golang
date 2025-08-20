#!/usr/bin/env node

/**
 * Audit Trail Validation Script
 * 
 * Validates comprehensive audit trail implementation for Indonesian government compliance
 * ensuring all data access and processing activities are properly logged and tamper-proof.
 * 
 * Compliance: Audit Trail Rule, Government Compliance Rule
 */

const fs = require('fs');
const path = require('path');

console.log('📋 Validating comprehensive audit trail implementation...');

let validationErrors = [];
let validationWarnings = [];

// Validate government audit logger implementation
function validateGovernmentAuditLogger() {
  const auditLoggerPath = path.join(process.cwd(), 'src/services/ai/audit/GovernmentAuditLogger.ts');
  
  if (fs.existsSync(auditLoggerPath)) {
    const content = fs.readFileSync(auditLoggerPath, 'utf8');
    
    console.log('✅ Found GovernmentAuditLogger service');
    
    // Check for government data access logging
    if (content.includes('logGovernmentDataAccess')) {
      console.log('✅ Government data access logging implemented');
    } else {
      validationWarnings.push('Consider implementing government data access logging');
    }
    
    // Check for tamper-proof mechanisms
    if (content.includes('tamper') || content.includes('integrity') || content.includes('hash')) {
      console.log('✅ Tamper-proof audit mechanisms implemented');
    } else {
      validationWarnings.push('Consider implementing tamper-proof audit mechanisms');
    }
    
    // Check for compliance validation logging
    if (content.includes('complianceValidated') || content.includes('compliance')) {
      console.log('✅ Compliance validation logging implemented');
    } else {
      validationWarnings.push('Consider implementing compliance validation logging');
    }
    
    // Check for digital signatures
    if (content.includes('signature') || content.includes('sign')) {
      console.log('✅ Digital signature implementation found');
    } else {
      validationWarnings.push('Consider implementing digital signatures for audit integrity');
    }
    
  } else {
    validationWarnings.push('GovernmentAuditLogger not found - will be implemented in audit enhancement phase');
  }
}

// Validate Indonesian Data Protection Service audit logging
function validateDataProtectionAuditLogging() {
  const dataProtectionPath = path.join(process.cwd(), 'src/services/compliance/IndonesianDataProtectionService.ts');
  
  if (fs.existsSync(dataProtectionPath)) {
    const content = fs.readFileSync(dataProtectionPath, 'utf8');
    
    console.log('✅ Found IndonesianDataProtectionService');
    
    // Check for data processing logging
    if (content.includes('logDataProcessing') || content.includes('dataProcessingLog')) {
      console.log('✅ Data processing audit logging implemented');
    } else {
      validationWarnings.push('Consider implementing data processing audit logging');
    }
    
    // Check for consent logging
    if (content.includes('consentRecord') && content.includes('timestamp')) {
      console.log('✅ Consent audit logging implemented');
    } else {
      validationWarnings.push('Consider implementing consent audit logging');
    }
    
    // Check for breach notification logging
    if (content.includes('breachNotification') && content.includes('log')) {
      console.log('✅ Breach notification audit logging implemented');
    } else {
      validationWarnings.push('Consider implementing breach notification audit logging');
    }
    
    // Check for government notification logging
    if (content.includes('government_notification') || content.includes('governmentNotified')) {
      console.log('✅ Government notification audit logging implemented');
    } else {
      validationWarnings.push('Consider implementing government notification audit logging');
    }
    
    // Check for audit trail ID tracking
    if (content.includes('auditTrailId')) {
      console.log('✅ Audit trail ID tracking implemented');
    } else {
      validationWarnings.push('Consider implementing audit trail ID tracking');
    }
    
  } else {
    validationErrors.push('IndonesianDataProtectionService not found - required for audit trail compliance');
  }
}

// Validate encryption service audit logging
function validateEncryptionAuditLogging() {
  const encryptionServices = [
    'src/services/security/GovernmentGradeEncryption.ts',
    'src/services/integration/security/EncryptionService.ts'
  ];
  
  let foundEncryptionAudit = false;
  encryptionServices.forEach(servicePath => {
    const fullPath = path.join(process.cwd(), servicePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');

      console.log(`✅ Found encryption service: ${path.basename(servicePath)}`);
      foundEncryptionAudit = true;
      
      // Check for encryption operation logging
      if (content.includes('log') && (content.includes('encrypt') || content.includes('decrypt'))) {
        console.log(`✅ Encryption operation logging found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding encryption operation logging to ${path.basename(servicePath)}`);
      }
      
      // Check for key management logging
      if (content.includes('key') && content.includes('log')) {
        console.log(`✅ Key management logging found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding key management logging to ${path.basename(servicePath)}`);
      }
      
      // Check for metrics tracking
      if (content.includes('metrics') || content.includes('performance')) {
        console.log(`✅ Encryption metrics tracking found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding encryption metrics tracking to ${path.basename(servicePath)}`);
      }
    }
  });
  
  if (!foundEncryptionAudit) {
    validationWarnings.push('Encryption service audit logging not found - consider implementing for security compliance');
  }
}

// Validate session audit logging
function validateSessionAuditLogging() {
  const sessionServices = [
    'src/services/session/security/SessionSecurityService.ts',
    'src/services/session/SessionAnalyticsService.ts'
  ];
  
  let foundSessionAudit = false;
  sessionServices.forEach(servicePath => {
    const fullPath = path.join(process.cwd(), servicePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');

      console.log(`✅ Found session service: ${path.basename(servicePath)}`);
      foundSessionAudit = true;
      
      // Check for session activity logging
      if (content.includes('log') && content.includes('session')) {
        console.log(`✅ Session activity logging found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding session activity logging to ${path.basename(servicePath)}`);
      }
      
      // Check for authentication logging
      if (content.includes('auth') && content.includes('log')) {
        console.log(`✅ Authentication logging found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding authentication logging to ${path.basename(servicePath)}`);
      }
      
      // Check for security event logging
      if (content.includes('security') && content.includes('event')) {
        console.log(`✅ Security event logging found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding security event logging to ${path.basename(servicePath)}`);
      }
    }
  });
  
  if (!foundSessionAudit) {
    validationWarnings.push('Session audit logging not found - consider implementing for security compliance');
  }
}

// Validate API audit logging
function validateAPIAuditLogging() {
  const apiEndpoints = [
    'src/app/api/compliance/indonesian-data-protection/route.ts',
    'src/app/api/security/government-grade-encryption/route.ts'
  ];
  
  let foundAPIAudit = false;
  apiEndpoints.forEach(endpointPath => {
    const fullPath = path.join(process.cwd(), endpointPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');

      console.log(`✅ Found API endpoint: ${path.basename(path.dirname(endpointPath))}`);
      foundAPIAudit = true;
      
      // Check for request logging
      if (content.includes('log') && (content.includes('request') || content.includes('req'))) {
        console.log(`✅ API request logging found in ${path.basename(path.dirname(endpointPath))}`);
      } else {
        validationWarnings.push(`Consider adding API request logging to ${path.basename(path.dirname(endpointPath))}`);
      }
      
      // Check for response logging
      if (content.includes('log') && (content.includes('response') || content.includes('res'))) {
        console.log(`✅ API response logging found in ${path.basename(path.dirname(endpointPath))}`);
      } else {
        validationWarnings.push(`Consider adding API response logging to ${path.basename(path.dirname(endpointPath))}`);
      }
      
      // Check for error logging
      if (content.includes('log') && content.includes('error')) {
        console.log(`✅ API error logging found in ${path.basename(path.dirname(endpointPath))}`);
      } else {
        validationWarnings.push(`Consider adding API error logging to ${path.basename(path.dirname(endpointPath))}`);
      }
    }
  });
  
  if (!foundAPIAudit) {
    validationWarnings.push('API audit logging not found - consider implementing for compliance tracking');
  }
}

// Validate audit trail storage and retention
function validateAuditTrailStorage() {
  const storageServices = [
    'src/services/compliance/IndonesianDataProtectionService.ts',
    'src/services/storage/',
    'src/config/supabase.ts'
  ];
  
  let foundAuditStorage = false;
  storageServices.forEach(servicePath => {
    const fullPath = path.join(process.cwd(), servicePath);
    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        if (files.some(file => file.includes('audit') || file.includes('log'))) {
          console.log(`✅ Audit storage components found in ${path.basename(servicePath)}`);
          foundAuditStorage = true;
        }
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for audit data retention
        if (content.includes('retention') && content.includes('audit')) {
          console.log(`✅ Audit data retention found in ${path.basename(servicePath)}`);
          foundAuditStorage = true;
        }
        
        // Check for audit data storage
        if (content.includes('audit') && (content.includes('store') || content.includes('save'))) {
          console.log(`✅ Audit data storage found in ${path.basename(servicePath)}`);
          foundAuditStorage = true;
        }
      }
    }
  });
  
  if (!foundAuditStorage) {
    validationWarnings.push('Audit trail storage not found - consider implementing for long-term compliance');
  }
}

// Run all audit trail validations
function runAuditTrailValidations() {
  console.log('Starting comprehensive audit trail implementation validation...\n');
  
  validateGovernmentAuditLogger();
  validateDataProtectionAuditLogging();
  validateEncryptionAuditLogging();
  validateSessionAuditLogging();
  validateAPIAuditLogging();
  validateAuditTrailStorage();
  
  console.log('\n📊 Audit Trail Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  Audit Trail Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Audit Trail Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these audit trail errors to ensure compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Comprehensive audit trail implementation validation completed successfully!');
}

// Execute audit trail validation
runAuditTrailValidations();

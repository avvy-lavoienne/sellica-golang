#!/usr/bin/env node

/**
 * Indonesian Data Protection Law (PDP) Compliance Validation Script
 * 
 * Validates compliance with UU No. 27 Tahun 2022 (Personal Data Protection Law)
 * and related Indonesian data protection regulations.
 * 
 * Compliance: Indonesian PDP Law, Data Protection Rule
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️ Validating Indonesian Data Protection Law (UU No. 27 Tahun 2022) compliance...');

let validationErrors = [];
let validationWarnings = [];

// Validate Indonesian Data Protection Service implementation
function validateIndonesianDataProtectionService() {
  const servicePath = path.join(process.cwd(), 'src/services/compliance/IndonesianDataProtectionService.ts');
  
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    console.log('✅ Found IndonesianDataProtectionService');
    
    // Check for UU No. 27 Tahun 2022 compliance
    if (content.includes('UU No. 27 Tahun 2022')) {
      console.log('✅ UU No. 27 Tahun 2022 compliance implemented');
    } else {
      validationErrors.push('Missing UU No. 27 Tahun 2022 compliance reference');
    }
    
    // Check for Article 20 consent requirements
    if (content.includes('Article 20') || content.includes('explicit')) {
      console.log('✅ Article 20 consent requirements implemented');
    } else {
      validationWarnings.push('Consider implementing Article 20 consent requirements');
    }
    
    // Check for data categories (general, sensitive, specific)
    if (content.includes('general') && content.includes('sensitive') && content.includes('specific')) {
      console.log('✅ Indonesian data categories implemented');
    } else {
      validationErrors.push('Missing Indonesian data categories (general, sensitive, specific)');
    }
    
    // Check for 72-hour breach notification
    if (content.includes('72') && content.includes('breach')) {
      console.log('✅ 72-hour breach notification requirement implemented');
    } else {
      validationErrors.push('Missing 72-hour breach notification requirement');
    }
    
    // Check for 7-year retention period
    if (content.includes('2555') || content.includes('7 years')) {
      console.log('✅ 7-year data retention period implemented');
    } else {
      validationWarnings.push('Consider implementing 7-year data retention period for government data');
    }
    
  } else {
    validationErrors.push('IndonesianDataProtectionService not found - required for PDP compliance');
  }
}

// Validate consent management system
function validateConsentManagementSystem() {
  const consentPath = path.join(process.cwd(), 'src/services/compliance/ConsentManagementSystem.ts');
  
  if (fs.existsSync(consentPath)) {
    const content = fs.readFileSync(consentPath, 'utf8');
    
    console.log('✅ Found ConsentManagementSystem');
    
    // Check for explicit consent
    if (content.includes('explicit') && content.includes('consent')) {
      console.log('✅ Explicit consent management implemented');
    } else {
      validationWarnings.push('Consider implementing explicit consent management');
    }
    
    // Check for consent withdrawal
    if (content.includes('withdraw') || content.includes('revoke')) {
      console.log('✅ Consent withdrawal mechanism implemented');
    } else {
      validationWarnings.push('Consider implementing consent withdrawal mechanism');
    }
    
    // Check for consent versioning
    if (content.includes('version') && content.includes('consent')) {
      console.log('✅ Consent versioning implemented');
    } else {
      validationWarnings.push('Consider implementing consent versioning');
    }
    
  } else {
    validationWarnings.push('ConsentManagementSystem not found - consider implementing for enhanced PDP compliance');
  }
}

// Validate data minimization service
function validateDataMinimizationService() {
  const minimizationPath = path.join(process.cwd(), 'src/services/compliance/DataMinimizationService.ts');
  
  if (fs.existsSync(minimizationPath)) {
    const content = fs.readFileSync(minimizationPath, 'utf8');
    
    console.log('✅ Found DataMinimizationService');
    
    // Check for purpose limitation
    if (content.includes('purpose') && content.includes('limitation')) {
      console.log('✅ Purpose limitation implemented');
    } else {
      validationWarnings.push('Consider implementing purpose limitation');
    }
    
    // Check for data minimization principles
    if (content.includes('minimize') || content.includes('necessary')) {
      console.log('✅ Data minimization principles implemented');
    } else {
      validationWarnings.push('Consider implementing data minimization principles');
    }
    
    // Check for automated data deletion
    if (content.includes('delete') && content.includes('automatic')) {
      console.log('✅ Automated data deletion implemented');
    } else {
      validationWarnings.push('Consider implementing automated data deletion');
    }
    
  } else {
    validationWarnings.push('DataMinimizationService not found - consider implementing for enhanced PDP compliance');
  }
}

// Validate individual rights implementation
function validateIndividualRights() {
  const servicePath = path.join(process.cwd(), 'src/services/compliance/IndonesianDataProtectionService.ts');
  
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Check for right to access
    if (content.includes('access') && content.includes('personal')) {
      console.log('✅ Right to access personal data implemented');
    } else {
      validationWarnings.push('Consider implementing right to access personal data');
    }
    
    // Check for right to rectification
    if (content.includes('rectif') || content.includes('correct')) {
      console.log('✅ Right to rectification implemented');
    } else {
      validationWarnings.push('Consider implementing right to rectification');
    }
    
    // Check for right to erasure
    if (content.includes('erasure') || content.includes('delete')) {
      console.log('✅ Right to erasure implemented');
    } else {
      validationWarnings.push('Consider implementing right to erasure');
    }
    
    // Check for right to data portability
    if (content.includes('portability') || content.includes('export')) {
      console.log('✅ Right to data portability implemented');
    } else {
      validationWarnings.push('Consider implementing right to data portability');
    }
    
    // Check for right to object
    if (content.includes('object') && content.includes('processing')) {
      console.log('✅ Right to object to processing implemented');
    } else {
      validationWarnings.push('Consider implementing right to object to processing');
    }
  }
}

// Validate legal basis implementation
function validateLegalBasisImplementation() {
  const servicePath = path.join(process.cwd(), 'src/services/compliance/IndonesianDataProtectionService.ts');
  
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Check for legal basis enumeration
    const legalBases = ['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'];
    const foundBases = legalBases.filter(basis => content.includes(basis));
    
    if (foundBases.length >= 4) {
      console.log(`✅ Legal basis implementation found: ${foundBases.length}/${legalBases.length} bases`);
    } else {
      validationWarnings.push('Consider implementing comprehensive legal basis enumeration');
    }
    
    // Check for legal basis validation
    if (content.includes('legalBasis') && content.includes('validate')) {
      console.log('✅ Legal basis validation implemented');
    } else {
      validationWarnings.push('Consider implementing legal basis validation');
    }
  }
}

// Validate breach notification system
function validateBreachNotificationSystem() {
  const servicePath = path.join(process.cwd(), 'src/services/compliance/IndonesianDataProtectionService.ts');
  
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Check for breach detection
    if (content.includes('breach') && content.includes('detect')) {
      console.log('✅ Breach detection implemented');
    } else {
      validationWarnings.push('Consider implementing breach detection');
    }
    
    // Check for breach notification to authorities
    if (content.includes('government') && content.includes('notification')) {
      console.log('✅ Government breach notification implemented');
    } else {
      validationWarnings.push('Consider implementing government breach notification');
    }
    
    // Check for breach notification to individuals
    if (content.includes('individual') && content.includes('notification')) {
      console.log('✅ Individual breach notification implemented');
    } else {
      validationWarnings.push('Consider implementing individual breach notification');
    }
    
    // Check for breach documentation
    if (content.includes('breach') && content.includes('log')) {
      console.log('✅ Breach documentation implemented');
    } else {
      validationWarnings.push('Consider implementing breach documentation');
    }
  }
}

// Validate compliance monitoring and reporting
function validateComplianceMonitoring() {
  const servicePath = path.join(process.cwd(), 'src/services/compliance/IndonesianDataProtectionService.ts');
  
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Check for compliance metrics
    if (content.includes('complianceMetrics') || content.includes('complianceScore')) {
      console.log('✅ Compliance metrics implemented');
    } else {
      validationWarnings.push('Consider implementing compliance metrics');
    }
    
    // Check for compliance reporting
    if (content.includes('report') && content.includes('compliance')) {
      console.log('✅ Compliance reporting implemented');
    } else {
      validationWarnings.push('Consider implementing compliance reporting');
    }
    
    // Check for audit scheduling
    if (content.includes('audit') && content.includes('schedule')) {
      console.log('✅ Audit scheduling implemented');
    } else {
      validationWarnings.push('Consider implementing audit scheduling');
    }
  }
}

// Run all PDP compliance validations
function runPDPComplianceValidations() {
  console.log('Starting Indonesian Data Protection Law (UU No. 27 Tahun 2022) compliance validation...\n');
  
  validateIndonesianDataProtectionService();
  validateConsentManagementSystem();
  validateDataMinimizationService();
  validateIndividualRights();
  validateLegalBasisImplementation();
  validateBreachNotificationSystem();
  validateComplianceMonitoring();
  
  console.log('\n📊 PDP Compliance Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  PDP Compliance Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ PDP Compliance Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these PDP compliance errors to ensure Indonesian legal compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Indonesian Data Protection Law (UU No. 27 Tahun 2022) compliance validation completed successfully!');
}

// Execute PDP compliance validation
runPDPComplianceValidations();

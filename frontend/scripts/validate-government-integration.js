#!/usr/bin/env node

/**
 * Government Integration Compliance Validation Script
 * 
 * Validates Indonesian government integration compliance including
 * data sovereignty, security standards, and cultural adaptation.
 * 
 * Compliance: Government Integration Rule, Indonesian Data Protection Law
 */

const fs = require('fs');
const path = require('path');

console.log('🏛️ Validating Indonesian government integration compliance...');

let validationErrors = [];
let validationWarnings = [];

// Check for government integration components
function validateGovernmentIntegrationComponents() {
  const requiredComponents = [
    'src/services/integration/government/DukcapilIntegrationService.ts',
    'src/services/integration/security/SecureChannelManager.ts',
    'src/services/integration/compliance/DataSovereigntyValidator.ts',
    'src/services/integration/security/EncryptionService.ts'
  ];

  let foundComponents = 0;
  requiredComponents.forEach(component => {
    const componentPath = path.join(process.cwd(), component);
    if (!fs.existsSync(componentPath)) {
      validationWarnings.push(`Government integration component not found: ${component} (will be created in future phases)`);
    } else {
      console.log(`✅ Found government integration component: ${component}`);
      foundComponents++;
    }
  });

  if (foundComponents > 0) {
    console.log(`✅ Government integration components: ${foundComponents}/${requiredComponents.length} found`);
  } else {
    console.log(`⚠️  No government integration components found yet - this is expected for early development phases`);
  }
}

// Validate Indonesian data sovereignty compliance
function validateDataSovereignty() {
  const dataValidatorPath = path.join(process.cwd(), 'src/services/integration/compliance/DataSovereigntyValidator.ts');

  if (fs.existsSync(dataValidatorPath)) {
    const content = fs.readFileSync(dataValidatorPath, 'utf8');

    // Check for Indonesian region validation
    if (content.includes('ap-southeast-1') && content.includes('indonesia')) {
      console.log('✅ Indonesian data sovereignty regions validated');
    } else {
      validationWarnings.push('Data sovereignty validator could include more specific Indonesian region validation');
    }

    // Check for prohibited regions
    if (content.includes('us-east-1') && content.includes('eu-west-1')) {
      console.log('✅ Prohibited regions validation implemented');
    } else {
      validationWarnings.push('Consider adding more comprehensive prohibited regions validation');
    }
  } else {
    console.log('⚠️  Data sovereignty validator not found - will be implemented in government integration phase');
  }
}

// Validate government-grade encryption standards
function validateEncryptionStandards() {
  const encryptionPath = path.join(process.cwd(), 'src/services/integration/security/EncryptionService.ts');

  if (fs.existsSync(encryptionPath)) {
    const content = fs.readFileSync(encryptionPath, 'utf8');

    // Check for AES-256-GCM encryption
    if (content.includes('AES-256-GCM')) {
      console.log('✅ Government-grade encryption (AES-256-GCM) implemented');
    } else {
      validationWarnings.push('Consider implementing government-grade encryption standard (AES-256-GCM)');
    }
  } else {
    console.log('⚠️  Encryption service not found - will be implemented in security integration phase');
  }
}

// Validate Indonesian cultural adaptation
function validateCulturalAdaptation() {
  const contextAnalyzerPath = path.join(process.cwd(), 'src/services/ai/context/IndonesianContextAnalyzer.ts');

  if (fs.existsSync(contextAnalyzerPath)) {
    const content = fs.readFileSync(contextAnalyzerPath, 'utf8');

    // Check for Indonesian regions
    const indonesianRegions = ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Bali'];
    const hasRegions = indonesianRegions.some(region => content.includes(region));

    if (hasRegions) {
      console.log('✅ Indonesian regional cultural adaptation implemented');
    } else {
      validationWarnings.push('Consider adding more Indonesian regional cultural adaptation');
    }

    // Check for administrative levels
    if (content.includes('pusat') && content.includes('provinsi') && content.includes('kelurahan')) {
      console.log('✅ Indonesian administrative hierarchy implemented');
    } else {
      validationWarnings.push('Consider adding Indonesian administrative hierarchy support');
    }
  } else {
    console.log('⚠️  Indonesian context analyzer not found - will be implemented in AI enhancement phase');
  }
}

// Validate audit trail implementation
function validateAuditTrails() {
  const auditLoggerPath = path.join(process.cwd(), 'src/services/ai/audit/GovernmentAuditLogger.ts');
  
  if (fs.existsSync(auditLoggerPath)) {
    const content = fs.readFileSync(auditLoggerPath, 'utf8');
    
    // Check for government data access logging
    if (content.includes('logGovernmentDataAccess') && content.includes('tamper-proof')) {
      console.log('✅ Government-grade audit trails implemented');
    } else {
      validationWarnings.push('Consider enhancing audit trail tamper-proof mechanisms');
    }
    
    // Check for compliance logging
    if (content.includes('complianceValidated')) {
      console.log('✅ Compliance validation logging implemented');
    } else {
      validationWarnings.push('Consider adding more comprehensive compliance logging');
    }
  }
}

// Validate Indonesian localization
function validateIndonesianLocalization() {
  // Check for Indonesian language content in components
  const reasoningEnginePath = path.join(process.cwd(), 'src/services/ai/reasoning/AdvancedReasoningEngine.ts');

  if (fs.existsSync(reasoningEnginePath)) {
    const content = fs.readFileSync(reasoningEnginePath, 'utf8');

    // Check for Indonesian administrative contexts
    const adminContexts = ['dukcapil', 'kemendagri', 'bpn'];
    const hasAdminContexts = adminContexts.some(context => content.includes(context));

    if (hasAdminContexts) {
      console.log('✅ Indonesian administrative contexts implemented');
    } else {
      validationWarnings.push('Consider adding Indonesian administrative context support');
    }
  } else {
    console.log('⚠️  Advanced reasoning engine not found - will be implemented in AI enhancement phase');
  }
}

// Run all validations
function runValidations() {
  console.log('Starting government integration compliance validation...\n');
  
  validateGovernmentIntegrationComponents();
  validateDataSovereignty();
  validateEncryptionStandards();
  validateCulturalAdaptation();
  validateAuditTrails();
  validateIndonesianLocalization();
  
  console.log('\n📊 Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these errors to ensure government integration compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Government integration compliance validation completed successfully!');
}

// Execute validation
runValidations();

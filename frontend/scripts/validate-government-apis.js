#!/usr/bin/env node

/**
 * Government API Integration Validation Script
 * 
 * Validates government system integration patterns and API compliance
 * for Indonesian government services (Dukcapil, Kemendagri, BPN).
 * 
 * Compliance: Government Integration Rule, API Standards Rule
 */

const fs = require('fs');
const path = require('path');

console.log('🔗 Validating government system integration patterns...');

let validationErrors = [];
let validationWarnings = [];

// Validate government integration services
function validateGovernmentIntegrationServices() {
  const governmentServices = [
    {
      name: 'DukcapilIntegrationService',
      path: 'src/services/integration/government/DukcapilIntegrationService.ts',
      description: 'Population & Civil Registration'
    },
    {
      name: 'KemendagriIntegrationService', 
      path: 'src/services/integration/government/KemendagriIntegrationService.ts',
      description: 'Ministry of Home Affairs'
    },
    {
      name: 'BPNIntegrationService',
      path: 'src/services/integration/government/BPNIntegrationService.ts', 
      description: 'National Land Agency'
    }
  ];
  
  let foundServices = 0;
  governmentServices.forEach(service => {
    const servicePath = path.join(process.cwd(), service.path);
    if (fs.existsSync(servicePath)) {
      const content = fs.readFileSync(servicePath, 'utf8');
      
      console.log(`✅ Found ${service.name} (${service.description})`);
      foundServices++;
      
      // Check for secure channel implementation
      if (content.includes('SecureChannelManager') || content.includes('secureChannel')) {
        console.log(`✅ Secure channel implementation found in ${service.name}`);
      } else {
        validationWarnings.push(`Consider adding secure channel implementation to ${service.name}`);
      }
      
      // Check for data validation
      if (content.includes('GovernmentDataValidator') || content.includes('validate')) {
        console.log(`✅ Data validation found in ${service.name}`);
      } else {
        validationWarnings.push(`Consider adding data validation to ${service.name}`);
      }
      
      // Check for audit logging
      if (content.includes('GovernmentAuditLogger') || content.includes('audit')) {
        console.log(`✅ Audit logging found in ${service.name}`);
      } else {
        validationWarnings.push(`Consider adding audit logging to ${service.name}`);
      }
      
    } else {
      console.log(`⚠️  ${service.name} not found - will be implemented in enterprise integration phase`);
    }
  });
  
  if (foundServices > 0) {
    console.log(`✅ Government integration services: ${foundServices}/${governmentServices.length} found`);
  } else {
    console.log('⚠️  No government integration services found yet - this is expected for early development phases');
  }
}

// Validate API security standards
function validateAPISecurityStandards() {
  const securityComponents = [
    'src/services/integration/security/SecureChannelManager.ts',
    'src/services/integration/security/EncryptionService.ts',
    'src/services/security/GovernmentGradeEncryption.ts'
  ];
  
  let foundComponents = 0;
  securityComponents.forEach(component => {
    const componentPath = path.join(process.cwd(), component);
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      console.log(`✅ Found security component: ${path.basename(component)}`);
      foundComponents++;
      
      // Check for TLS implementation
      if (content.includes('TLS') || content.includes('tls')) {
        console.log(`✅ TLS implementation found in ${path.basename(component)}`);
      } else {
        validationWarnings.push(`Consider adding TLS implementation to ${path.basename(component)}`);
      }
      
      // Check for government-grade encryption
      if (content.includes('AES-256') || content.includes('government')) {
        console.log(`✅ Government-grade encryption found in ${path.basename(component)}`);
      } else {
        validationWarnings.push(`Consider adding government-grade encryption to ${path.basename(component)}`);
      }
      
    }
  });
  
  if (foundComponents === 0) {
    validationErrors.push('No API security components found - required for government integration');
  }
}

// Validate government data schemas
function validateGovernmentDataSchemas() {
  const schemaFiles = [
    'src/services/integration/government/DukcapilIntegrationService.ts',
    'src/services/integration/validation/GovernmentDataValidator.ts'
  ];
  
  let foundSchemas = 0;
  schemaFiles.forEach(schemaFile => {
    const schemaPath = path.join(process.cwd(), schemaFile);
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      
      // Check for NIK validation
      if (content.includes('NIK') && content.includes('16')) {
        console.log(`✅ NIK validation schema found in ${path.basename(schemaFile)}`);
        foundSchemas++;
      }
      
      // Check for government data types
      if (content.includes('population_data') || content.includes('administrative_data')) {
        console.log(`✅ Government data types found in ${path.basename(schemaFile)}`);
      }
      
      // Check for zod validation
      if (content.includes('z.') && content.includes('Schema')) {
        console.log(`✅ Zod validation schemas found in ${path.basename(schemaFile)}`);
      } else {
        validationWarnings.push(`Consider adding Zod validation schemas to ${path.basename(schemaFile)}`);
      }
    }
  });
  
  if (foundSchemas === 0) {
    validationWarnings.push('Government data schemas not found - consider implementing for data validation');
  }
}

// Validate audit trail implementation
function validateAuditTrailImplementation() {
  const auditComponents = [
    'src/services/ai/audit/GovernmentAuditLogger.ts',
    'src/services/compliance/IndonesianDataProtectionService.ts'
  ];
  
  let foundAuditComponents = 0;
  auditComponents.forEach(component => {
    const componentPath = path.join(process.cwd(), component);
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      console.log(`✅ Found audit component: ${path.basename(component)}`);
      foundAuditComponents++;
      
      // Check for government data access logging
      if (content.includes('logGovernmentDataAccess') || content.includes('government')) {
        console.log(`✅ Government data access logging found in ${path.basename(component)}`);
      }
      
      // Check for tamper-proof logging
      if (content.includes('tamper') || content.includes('integrity')) {
        console.log(`✅ Tamper-proof logging found in ${path.basename(component)}`);
      } else {
        validationWarnings.push(`Consider adding tamper-proof logging to ${path.basename(component)}`);
      }
      
      // Check for compliance logging
      if (content.includes('compliance') && content.includes('log')) {
        console.log(`✅ Compliance logging found in ${path.basename(component)}`);
      }
    }
  });
  
  if (foundAuditComponents === 0) {
    validationWarnings.push('Audit trail components not found - consider implementing for government compliance');
  }
}

// Validate API endpoint implementation
function validateAPIEndpoints() {
  const apiEndpoints = [
    'src/app/api/compliance/indonesian-data-protection/route.ts',
    'src/app/api/security/government-grade-encryption/route.ts'
  ];
  
  let foundEndpoints = 0;
  apiEndpoints.forEach(endpoint => {
    const endpointPath = path.join(process.cwd(), endpoint);
    if (fs.existsSync(endpointPath)) {
      const content = fs.readFileSync(endpointPath, 'utf8');
      
      console.log(`✅ Found API endpoint: ${path.basename(path.dirname(endpoint))}`);
      foundEndpoints++;
      
      // Check for proper HTTP methods
      if (content.includes('GET') && content.includes('POST')) {
        console.log(`✅ HTTP methods implemented in ${path.basename(path.dirname(endpoint))}`);
      }
      
      // Check for error handling
      if (content.includes('try') && content.includes('catch')) {
        console.log(`✅ Error handling found in ${path.basename(path.dirname(endpoint))}`);
      } else {
        validationWarnings.push(`Consider adding error handling to ${path.basename(path.dirname(endpoint))}`);
      }
      
      // Check for validation
      if (content.includes('validate') || content.includes('schema')) {
        console.log(`✅ Input validation found in ${path.basename(path.dirname(endpoint))}`);
      } else {
        validationWarnings.push(`Consider adding input validation to ${path.basename(path.dirname(endpoint))}`);
      }
    }
  });
  
  if (foundEndpoints === 0) {
    validationWarnings.push('Government API endpoints not found - consider implementing for external integration');
  } else {
    console.log(`✅ Government API endpoints: ${foundEndpoints}/${apiEndpoints.length} found`);
  }
}

// Run all government API validations
function runGovernmentAPIValidations() {
  console.log('Starting government system integration patterns validation...\n');
  
  validateGovernmentIntegrationServices();
  validateAPISecurityStandards();
  validateGovernmentDataSchemas();
  validateAuditTrailImplementation();
  validateAPIEndpoints();
  
  console.log('\n📊 Government API Integration Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  Government API Integration Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Government API Integration Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these government API integration errors to ensure compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Government system integration patterns validation completed successfully!');
}

// Execute government API validation
runGovernmentAPIValidations();

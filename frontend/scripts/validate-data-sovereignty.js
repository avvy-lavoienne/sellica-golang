#!/usr/bin/env node

/**
 * Data Sovereignty Validation Script
 * 
 * Validates Indonesian data sovereignty compliance (UU No. 27 Tahun 2022)
 * ensuring all government data processing occurs within Indonesian jurisdiction.
 * 
 * Compliance: Government Integration Rule, Data Sovereignty Rule
 */

const fs = require('fs');
const path = require('path');

console.log('🏛️ Validating Indonesian data sovereignty compliance...');

let validationErrors = [];
let validationWarnings = [];

// Validate data sovereignty validator implementation
function validateDataSovereigntyValidator() {
  const validatorPath = path.join(process.cwd(), 'src/services/integration/compliance/DataSovereigntyValidator.ts');
  
  if (fs.existsSync(validatorPath)) {
    const content = fs.readFileSync(validatorPath, 'utf8');
    
    // Check for Indonesian allowed regions
    if (content.includes('ap-southeast-1') && content.includes('ap-southeast-3')) {
      console.log('✅ Indonesian allowed regions properly configured');
    } else {
      validationErrors.push('Missing Indonesian allowed regions (ap-southeast-1, ap-southeast-3)');
    }
    
    // Check for prohibited regions
    if (content.includes('us-east-1') && content.includes('eu-west-1')) {
      console.log('✅ Prohibited regions validation implemented');
    } else {
      validationWarnings.push('Consider adding comprehensive prohibited regions validation');
    }
    
    // Check for data classification compliance
    if (content.includes('secret') && content.includes('indonesia')) {
      console.log('✅ Secret data classification sovereignty implemented');
    } else {
      validationWarnings.push('Consider enhancing secret data classification sovereignty rules');
    }
    
    // Check for government data types
    if (content.includes('population_data') && content.includes('administrative_data')) {
      console.log('✅ Government data types sovereignty validation implemented');
    } else {
      validationWarnings.push('Consider adding more government data types for sovereignty validation');
    }
    
  } else {
    validationErrors.push('DataSovereigntyValidator not found - required for Indonesian compliance');
  }
}

// Validate Indonesian Data Protection Service compliance
function validateIndonesianDataProtection() {
  const servicePath = path.join(process.cwd(), 'src/services/compliance/IndonesianDataProtectionService.ts');
  
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Check for UU No. 27 Tahun 2022 compliance
    if (content.includes('UU No. 27 Tahun 2022')) {
      console.log('✅ UU No. 27 Tahun 2022 compliance implemented');
    } else {
      validationErrors.push('Missing UU No. 27 Tahun 2022 compliance reference');
    }
    
    // Check for data location logging
    if (content.includes('ap-southeast-1') && content.includes('dataLocation')) {
      console.log('✅ Data location logging for sovereignty implemented');
    } else {
      validationWarnings.push('Consider enhancing data location logging for sovereignty compliance');
    }
    
    // Check for government notification compliance
    if (content.includes('government_notification') && content.includes('indonesian')) {
      console.log('✅ Indonesian government notification compliance implemented');
    } else {
      validationWarnings.push('Consider enhancing Indonesian government notification compliance');
    }
    
  } else {
    validationErrors.push('IndonesianDataProtectionService not found - required for data sovereignty');
  }
}

// Validate government integration services sovereignty
function validateGovernmentIntegrationSovereignty() {
  const integrationServices = [
    'src/services/integration/government/DukcapilIntegrationService.ts',
    'src/services/integration/government/KemendagriIntegrationService.ts',
    'src/services/integration/government/BPNIntegrationService.ts'
  ];
  
  let foundServices = 0;
  integrationServices.forEach(servicePath => {
    const fullPath = path.join(process.cwd(), servicePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for sovereignty validation
      if (content.includes('sovereigntyValidator') || content.includes('DataSovereigntyValidator')) {
        console.log(`✅ Sovereignty validation found in ${path.basename(servicePath)}`);
        foundServices++;
      } else {
        validationWarnings.push(`Consider adding sovereignty validation to ${path.basename(servicePath)}`);
      }
      
      // Check for Indonesian region enforcement
      if (content.includes('indonesia') && content.includes('region')) {
        console.log(`✅ Indonesian region enforcement found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding Indonesian region enforcement to ${path.basename(servicePath)}`);
      }
    }
  });
  
  if (foundServices === 0) {
    console.log('⚠️  No government integration services found - will be implemented in enterprise integration phase');
  } else {
    console.log(`✅ Government integration sovereignty: ${foundServices}/${integrationServices.length} services validated`);
  }
}

// Validate environment configuration for sovereignty
function validateEnvironmentSovereignty() {
  const envFiles = ['.env.example', '.env.local.example'];
  let hasRegionConfig = false;
  
  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      // Check for region configuration
      if (content.includes('REGION') || content.includes('AWS_REGION')) {
        console.log(`✅ Region configuration documented in ${envFile}`);
        hasRegionConfig = true;
      }
      
      // Check for Indonesian region defaults
      if (content.includes('ap-southeast-1') || content.includes('ap-southeast-3')) {
        console.log(`✅ Indonesian region defaults found in ${envFile}`);
      }
    }
  });
  
  if (!hasRegionConfig) {
    validationWarnings.push('Consider documenting region configuration in environment files');
  }
}

// Validate database sovereignty compliance
function validateDatabaseSovereignty() {
  // Check for Supabase configuration with Indonesian regions
  const configFiles = [
    'src/config/supabase.ts',
    'src/lib/supabase.ts',
    'src/utils/supabase.ts'
  ];
  
  let foundSupabaseConfig = false;
  configFiles.forEach(configFile => {
    const configPath = path.join(process.cwd(), configFile);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      
      if (content.includes('supabase')) {
        foundSupabaseConfig = true;
        console.log(`✅ Supabase configuration found in ${path.basename(configFile)}`);
        
        // Check for region awareness
        if (content.includes('region') || content.includes('ap-southeast')) {
          console.log(`✅ Region awareness found in ${path.basename(configFile)}`);
        } else {
          validationWarnings.push(`Consider adding region awareness to ${path.basename(configFile)}`);
        }
      }
    }
  });
  
  if (!foundSupabaseConfig) {
    validationWarnings.push('Supabase configuration not found - ensure database sovereignty compliance');
  }
}

// Run all data sovereignty validations
function runDataSovereigntyValidations() {
  console.log('Starting Indonesian data sovereignty compliance validation...\n');
  
  validateDataSovereigntyValidator();
  validateIndonesianDataProtection();
  validateGovernmentIntegrationSovereignty();
  validateEnvironmentSovereignty();
  validateDatabaseSovereignty();
  
  console.log('\n📊 Data Sovereignty Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  Data Sovereignty Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Data Sovereignty Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these data sovereignty errors to ensure Indonesian compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Indonesian data sovereignty compliance validation completed successfully!');
}

// Execute data sovereignty validation
runDataSovereigntyValidations();

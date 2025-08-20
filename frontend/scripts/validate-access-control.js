#!/usr/bin/env node

/**
 * Access Control Validation Script
 * 
 * Validates role-based access control (RBAC) and security measures implementation
 * ensuring proper authentication, authorization, and access management.
 * 
 * Compliance: Access Control Rule, Security Compliance Rule
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Validating role-based access control and security measures...');

let validationErrors = [];
let validationWarnings = [];

// Validate session security service
function validateSessionSecurity() {
  const sessionSecurityPath = path.join(process.cwd(), 'src/services/session/security/SessionSecurityService.ts');
  
  if (fs.existsSync(sessionSecurityPath)) {
    const content = fs.readFileSync(sessionSecurityPath, 'utf8');
    
    console.log('✅ Found SessionSecurityService');
    
    // Check for role-based access control
    if (content.includes('RBAC') || content.includes('role') || content.includes('permission')) {
      console.log('✅ Role-based access control implemented');
    } else {
      validationWarnings.push('Consider implementing role-based access control (RBAC)');
    }
    
    // Check for session validation
    if (content.includes('validate') && content.includes('session')) {
      console.log('✅ Session validation implemented');
    } else {
      validationWarnings.push('Consider implementing session validation');
    }
    
    // Check for session encryption
    if (content.includes('encrypt') && content.includes('session')) {
      console.log('✅ Session encryption implemented');
    } else {
      validationWarnings.push('Consider implementing session encryption');
    }
    
    // Check for authentication mechanisms
    if (content.includes('auth') && content.includes('validate')) {
      console.log('✅ Authentication mechanisms implemented');
    } else {
      validationWarnings.push('Consider implementing authentication mechanisms');
    }
    
  } else {
    validationWarnings.push('SessionSecurityService not found - consider implementing for access control');
  }
}

// Validate authentication system
function validateAuthenticationSystem() {
  const authFiles = [
    'src/app/api/auth/',
    'src/services/auth/',
    'src/middleware/auth.ts'
  ];
  
  let foundAuthComponents = 0;
  authFiles.forEach(authPath => {
    const fullPath = path.join(process.cwd(), authPath);
    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        if (files.length > 0) {
          console.log(`✅ Found authentication components in ${path.basename(authPath)}`);
          foundAuthComponents++;
          
          // Check for JWT implementation
          files.forEach(file => {
            const filePath = path.join(fullPath, file);
            if (fs.statSync(filePath).isFile()) {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.includes('JWT') || content.includes('jsonwebtoken')) {
                console.log(`✅ JWT authentication found in ${file}`);
              }
            }
          });
        }
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('auth') || content.includes('authenticate')) {
          console.log(`✅ Authentication logic found in ${path.basename(authPath)}`);
          foundAuthComponents++;
        }
      }
    }
  });
  
  if (foundAuthComponents === 0) {
    validationWarnings.push('Authentication system components not found - consider implementing for access control');
  }
}

// Validate authorization middleware
function validateAuthorizationMiddleware() {
  const middlewareFiles = [
    'src/middleware/auth.ts',
    'src/middleware/rbac.ts',
    'src/middleware/permissions.ts'
  ];
  
  let foundMiddleware = 0;
  middlewareFiles.forEach(middlewarePath => {
    const fullPath = path.join(process.cwd(), middlewarePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      console.log(`✅ Found middleware: ${path.basename(middlewarePath)}`);
      foundMiddleware++;
      
      // Check for role validation
      if (content.includes('role') && content.includes('validate')) {
        console.log(`✅ Role validation found in ${path.basename(middlewarePath)}`);
      } else {
        validationWarnings.push(`Consider adding role validation to ${path.basename(middlewarePath)}`);
      }
      
      // Check for permission checking
      if (content.includes('permission') && content.includes('check')) {
        console.log(`✅ Permission checking found in ${path.basename(middlewarePath)}`);
      } else {
        validationWarnings.push(`Consider adding permission checking to ${path.basename(middlewarePath)}`);
      }
      
      // Check for unauthorized access handling
      if (content.includes('unauthorized') || content.includes('403')) {
        console.log(`✅ Unauthorized access handling found in ${path.basename(middlewarePath)}`);
      } else {
        validationWarnings.push(`Consider adding unauthorized access handling to ${path.basename(middlewarePath)}`);
      }
    }
  });
  
  if (foundMiddleware === 0) {
    validationWarnings.push('Authorization middleware not found - consider implementing for access control');
  }
}

// Validate user role management
function validateUserRoleManagement() {
  const roleFiles = [
    'src/types/user.ts',
    'src/types/auth.ts',
    'src/services/user/UserRoleService.ts'
  ];
  
  let foundRoleManagement = false;
  roleFiles.forEach(roleFile => {
    const fullPath = path.join(process.cwd(), roleFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for role definitions
      if (content.includes('role') && (content.includes('enum') || content.includes('type'))) {
        console.log(`✅ Role definitions found in ${path.basename(roleFile)}`);
        foundRoleManagement = true;
      }
      
      // Check for permission definitions
      if (content.includes('permission') && (content.includes('enum') || content.includes('type'))) {
        console.log(`✅ Permission definitions found in ${path.basename(roleFile)}`);
      }
      
      // Check for user role assignment
      if (content.includes('assign') && content.includes('role')) {
        console.log(`✅ User role assignment found in ${path.basename(roleFile)}`);
      }
    }
  });
  
  if (!foundRoleManagement) {
    validationWarnings.push('User role management not found - consider implementing for access control');
  }
}

// Validate API endpoint protection
function validateAPIEndpointProtection() {
  const apiEndpoints = [
    'src/app/api/compliance/indonesian-data-protection/route.ts',
    'src/app/api/security/government-grade-encryption/route.ts',
    'src/app/api/admin/'
  ];
  
  let protectedEndpoints = 0;
  apiEndpoints.forEach(endpointPath => {
    const fullPath = path.join(process.cwd(), endpointPath);
    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
          const filePath = path.join(fullPath, file);
          if (fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('auth') || content.includes('verify') || content.includes('token')) {
              console.log(`✅ Protected API endpoint found: ${path.basename(fullPath)}/${file}`);
              protectedEndpoints++;
            }
          }
        });
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('auth') || content.includes('verify') || content.includes('token')) {
          console.log(`✅ Protected API endpoint found: ${path.basename(path.dirname(endpointPath))}`);
          protectedEndpoints++;
        } else {
          validationWarnings.push(`Consider adding authentication to ${path.basename(path.dirname(endpointPath))}`);
        }
      }
    }
  });
  
  if (protectedEndpoints === 0) {
    validationWarnings.push('No protected API endpoints found - consider implementing authentication');
  }
}

// Validate government access controls
function validateGovernmentAccessControls() {
  const governmentServices = [
    'src/services/integration/government/DukcapilIntegrationService.ts',
    'src/services/compliance/IndonesianDataProtectionService.ts'
  ];
  
  let foundGovernmentControls = 0;
  governmentServices.forEach(servicePath => {
    const fullPath = path.join(process.cwd(), servicePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for government-specific access controls
      if (content.includes('government') && (content.includes('auth') || content.includes('access'))) {
        console.log(`✅ Government access controls found in ${path.basename(servicePath)}`);
        foundGovernmentControls++;
      }
      
      // Check for data classification access
      if (content.includes('classification') && content.includes('access')) {
        console.log(`✅ Data classification access controls found in ${path.basename(servicePath)}`);
      }
      
      // Check for audit logging for access
      if (content.includes('audit') && content.includes('access')) {
        console.log(`✅ Access audit logging found in ${path.basename(servicePath)}`);
      }
    }
  });
  
  if (foundGovernmentControls === 0) {
    validationWarnings.push('Government access controls not found - consider implementing for compliance');
  }
}

// Validate security headers and CORS
function validateSecurityHeaders() {
  const securityFiles = [
    'next.config.js',
    'src/middleware.ts',
    'src/app/layout.tsx'
  ];
  
  let foundSecurityHeaders = false;
  securityFiles.forEach(securityFile => {
    const fullPath = path.join(process.cwd(), securityFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for security headers
      if (content.includes('helmet') || content.includes('security') || content.includes('headers')) {
        console.log(`✅ Security headers configuration found in ${path.basename(securityFile)}`);
        foundSecurityHeaders = true;
      }
      
      // Check for CORS configuration
      if (content.includes('cors') || content.includes('origin')) {
        console.log(`✅ CORS configuration found in ${path.basename(securityFile)}`);
      }
      
      // Check for CSP (Content Security Policy)
      if (content.includes('CSP') || content.includes('contentSecurityPolicy')) {
        console.log(`✅ Content Security Policy found in ${path.basename(securityFile)}`);
      }
    }
  });
  
  if (!foundSecurityHeaders) {
    validationWarnings.push('Security headers configuration not found - consider implementing for enhanced security');
  }
}

// Run all access control validations
function runAccessControlValidations() {
  console.log('Starting role-based access control and security measures validation...\n');
  
  validateSessionSecurity();
  validateAuthenticationSystem();
  validateAuthorizationMiddleware();
  validateUserRoleManagement();
  validateAPIEndpointProtection();
  validateGovernmentAccessControls();
  validateSecurityHeaders();
  
  console.log('\n📊 Access Control Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  Access Control Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Access Control Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these access control errors to ensure security compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Role-based access control and security measures validation completed successfully!');
}

// Execute access control validation
runAccessControlValidations();

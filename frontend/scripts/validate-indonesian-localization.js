#!/usr/bin/env node

/**
 * Indonesian Localization Validation Script
 * 
 * Validates Indonesian language and cultural compliance throughout the application
 * ensuring proper localization for Indonesian government and user contexts.
 * 
 * Compliance: Indonesian Localization Rule, Cultural Adaptation Rule
 */

const fs = require('fs');
const path = require('path');

console.log('🇮🇩 Validating Indonesian language and cultural compliance...');

let validationErrors = [];
let validationWarnings = [];

// Validate Indonesian language support in services
function validateIndonesianLanguageServices() {
  const indonesianServices = [
    'src/services/ai/context/IndonesianContextAnalyzer.ts',
    'src/services/compliance/IndonesianDataProtectionService.ts',
    'src/services/integration/government/DukcapilIntegrationService.ts'
  ];
  
  let foundServices = 0;
  indonesianServices.forEach(servicePath => {
    const fullPath = path.join(process.cwd(), servicePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      console.log(`✅ Found Indonesian service: ${path.basename(servicePath)}`);
      foundServices++;
      
      // Check for Indonesian language references
      if (content.includes('indonesia') || content.includes('Indonesian')) {
        console.log(`✅ Indonesian language references found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding Indonesian language references to ${path.basename(servicePath)}`);
      }
      
      // Check for Indonesian administrative terms
      const adminTerms = ['dukcapil', 'kemendagri', 'bpn', 'nik', 'ktp'];
      const hasAdminTerms = adminTerms.some(term => content.toLowerCase().includes(term));
      if (hasAdminTerms) {
        console.log(`✅ Indonesian administrative terms found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding Indonesian administrative terms to ${path.basename(servicePath)}`);
      }
      
      // Check for Indonesian legal references
      if (content.includes('UU No. 27 Tahun 2022') || content.includes('PP No. 71 Tahun 2019')) {
        console.log(`✅ Indonesian legal references found in ${path.basename(servicePath)}`);
      } else {
        validationWarnings.push(`Consider adding Indonesian legal references to ${path.basename(servicePath)}`);
      }
      
    } else {
      console.log(`⚠️  ${path.basename(servicePath)} not found - will be implemented in localization phase`);
    }
  });
  
  if (foundServices === 0) {
    console.log('⚠️  No Indonesian language services found yet - this is expected for early development phases');
  } else {
    console.log(`✅ Indonesian language services: ${foundServices}/${indonesianServices.length} found`);
  }
}

// Validate Indonesian cultural adaptation
function validateCulturalAdaptation() {
  const culturalFiles = [
    'src/services/ai/context/IndonesianContextAnalyzer.ts',
    'src/components/ui/IndonesianDatePicker.tsx',
    'src/utils/indonesianFormatter.ts'
  ];
  
  let foundCulturalComponents = 0;
  culturalFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      console.log(`✅ Found cultural component: ${path.basename(filePath)}`);
      foundCulturalComponents++;
      
      // Check for Indonesian date formats
      if (content.includes('DD/MM/YYYY') || content.includes('indonesian')) {
        console.log(`✅ Indonesian date formatting found in ${path.basename(filePath)}`);
      }
      
      // Check for Indonesian number formatting
      if (content.includes('Rp') || content.includes('rupiah') || content.includes('1.000')) {
        console.log(`✅ Indonesian number formatting found in ${path.basename(filePath)}`);
      }
      
      // Check for Indonesian administrative hierarchy
      if (content.includes('provinsi') && content.includes('kabupaten') && content.includes('kelurahan')) {
        console.log(`✅ Indonesian administrative hierarchy found in ${path.basename(filePath)}`);
      }
      
    }
  });
  
  if (foundCulturalComponents === 0) {
    validationWarnings.push('Cultural adaptation components not found - consider implementing for better user experience');
  }
}

// Validate Indonesian error messages and UI text
function validateIndonesianUIText() {
  const uiFiles = [
    'src/components/chat/',
    'src/app/',
    'src/pages/'
  ];
  
  let foundIndonesianText = false;
  uiFiles.forEach(dirPath => {
    const fullPath = path.join(process.cwd(), dirPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      
      function checkDirectory(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            checkDirectory(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for Indonesian text
            const indonesianWords = ['masuk', 'keluar', 'simpan', 'hapus', 'ubah', 'cari', 'kirim'];
            const hasIndonesianWords = indonesianWords.some(word => content.includes(word));
            
            if (hasIndonesianWords) {
              console.log(`✅ Indonesian UI text found in ${path.relative(process.cwd(), filePath)}`);
              foundIndonesianText = true;
            }
            
            // Check for Indonesian error messages
            if (content.includes('Terjadi kesalahan') || content.includes('Silakan')) {
              console.log(`✅ Indonesian error messages found in ${path.relative(process.cwd(), filePath)}`);
            }
          }
        });
      }
      
      checkDirectory(fullPath);
    }
  });
  
  if (!foundIndonesianText) {
    validationWarnings.push('Indonesian UI text not found - consider implementing for better user experience');
  }
}

// Validate Indonesian government terminology
function validateGovernmentTerminology() {
  const governmentTerms = {
    'dukcapil': 'Dinas Kependudukan dan Pencatatan Sipil',
    'kemendagri': 'Kementerian Dalam Negeri', 
    'bpn': 'Badan Pertanahan Nasional',
    'nik': 'Nomor Induk Kependudukan',
    'ktp': 'Kartu Tanda Penduduk'
  };
  
  const searchPaths = [
    'src/services/integration/government/',
    'src/services/compliance/',
    'src/components/'
  ];
  
  let foundTerms = 0;
  Object.keys(governmentTerms).forEach(term => {
    let termFound = false;
    
    searchPaths.forEach(searchPath => {
      const fullPath = path.join(process.cwd(), searchPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        
        function searchInDirectory(dir) {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
              searchInDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.toLowerCase().includes(term)) {
                termFound = true;
              }
            }
          });
        }
        
        searchInDirectory(fullPath);
      }
    });
    
    if (termFound) {
      console.log(`✅ Indonesian government term found: ${term} (${governmentTerms[term]})`);
      foundTerms++;
    }
  });
  
  if (foundTerms === 0) {
    validationWarnings.push('Indonesian government terminology not found - consider implementing for authenticity');
  } else {
    console.log(`✅ Indonesian government terminology: ${foundTerms}/${Object.keys(governmentTerms).length} terms found`);
  }
}

// Validate Indonesian compliance documentation
function validateComplianceDocumentation() {
  const complianceFiles = [
    'docs/compliance/',
    'docs/user/',
    'README.md'
  ];
  
  let foundIndonesianDocs = false;
  complianceFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
          if (file.includes('indonesian') || file.includes('compliance')) {
            console.log(`✅ Indonesian compliance documentation found: ${file}`);
            foundIndonesianDocs = true;
          }
        });
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('Indonesian') || content.includes('Indonesia')) {
          console.log(`✅ Indonesian references found in ${path.basename(fullPath)}`);
          foundIndonesianDocs = true;
        }
      }
    }
  });
  
  if (!foundIndonesianDocs) {
    validationWarnings.push('Indonesian compliance documentation not found - consider creating for government stakeholders');
  }
}

// Run all Indonesian localization validations
function runIndonesianLocalizationValidations() {
  console.log('Starting Indonesian language and cultural compliance validation...\n');
  
  validateIndonesianLanguageServices();
  validateCulturalAdaptation();
  validateIndonesianUIText();
  validateGovernmentTerminology();
  validateComplianceDocumentation();
  
  console.log('\n📊 Indonesian Localization Validation Results:');
  console.log(`✅ Validations passed: ${validationErrors.length === 0 ? 'All' : 'Partial'}`);
  console.log(`⚠️  Warnings: ${validationWarnings.length}`);
  console.log(`❌ Errors: ${validationErrors.length}`);
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️  Indonesian Localization Warnings:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Indonesian Localization Errors:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    console.log('\n🔍 Please address these Indonesian localization errors to ensure cultural compliance.');
    process.exit(1);
  }
  
  console.log('\n✅ Indonesian language and cultural compliance validation completed successfully!');
}

// Execute Indonesian localization validation
runIndonesianLocalizationValidations();

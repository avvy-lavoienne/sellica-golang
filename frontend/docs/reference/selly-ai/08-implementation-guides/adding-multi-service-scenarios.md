# Adding Multi-Service Scenarios Guide
**Implementation Guide for Custom Cross-Service Processes**

**Version**: 6.0 (Enhanced Cross-Service)
**Created**: August 9, 2025
**Audience**: Developers, System Administrators
**Complexity**: Intermediate

---

## 🎯 **Overview**

This guide explains how to add new multi-service scenarios to SELLY's Enhanced Cross-Service Query System. Multi-service scenarios handle complex administrative processes that involve multiple documents and services with specific dependencies and ordering requirements.

### **When to Add Multi-Service Scenarios**
- **Complex Life Events** - Marriage, divorce, death, birth requiring multiple documents
- **Administrative Changes** - Address changes, name changes affecting multiple services
- **Document Recovery** - Loss of multiple documents requiring coordinated replacement
- **Business Processes** - New government procedures involving multiple departments

---

## 🏗️ **Architecture Overview**

### **Key Components**
1. **CrossServiceDependencyMapper** - Defines scenarios and service relationships
2. **MultiServiceQueryAnalyzer** - Detects when scenarios apply to user queries
3. **MultiServiceResponseSynthesizer** - Generates comprehensive guidance

### **Scenario Structure**
```typescript
interface CrossServiceScenario {
  scenarioId: string;
  name: string;
  description: string;
  triggerPatterns: RegExp[];
  primaryServices: string[];
  dependentServices: ServiceDependency[];
  processOrder: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedDuration: string;
}
```

---

## 📝 **Step-by-Step Implementation**

### **Step 1: Define the Scenario**

Create a new scenario in `CrossServiceDependencyMapper`:

```typescript
// Example: Divorce Documentation Scenario
const divorceScenario: CrossServiceScenario = {
  scenarioId: 'divorce_documentation',
  name: 'Dokumentasi Perceraian',
  description: 'Proses lengkap dokumentasi setelah perceraian resmi',
  
  // Patterns that trigger this scenario
  triggerPatterns: [
    /setelah.*cerai.*dokumen/i,
    /perceraian.*dokumen.*apa/i,
    /habis.*bercerai.*urus/i,
    /dokumen.*pasca.*perceraian/i
  ],
  
  // Primary services always needed
  primaryServices: ['akta_perceraian'],
  
  // Dependent services with conditions
  dependentServices: [
    {
      serviceId: 'kk_perubahan',
      dependencyType: 'required',
      trigger: 'status_change',
      priority: 9,
      description: 'Update status perkawinan di Kartu Keluarga'
    },
    {
      serviceId: 'ktp_perubahan',
      dependencyType: 'required', 
      trigger: 'status_change',
      priority: 8,
      description: 'Update status perkawinan di KTP'
    },
    {
      serviceId: 'kia_perubahan',
      dependencyType: 'conditional',
      trigger: 'has_children',
      priority: 7,
      description: 'Update KIA anak jika ada perubahan wali'
    }
  ],
  
  // Recommended processing order
  processOrder: ['akta_perceraian', 'kk_perubahan', 'ktp_perubahan', 'kia_perubahan'],
  
  complexity: 'complex',
  estimatedDuration: '4-6 minggu'
};
```

### **Step 2: Add to Dependency Mapper**

Register the scenario in `CrossServiceDependencyMapper.initializeScenarios()`:

```typescript
private initializeScenarios(): void {
  // Existing scenarios...
  
  // Add new divorce scenario
  this.scenarios.set('divorce_documentation', divorceScenario);
  
  console.log(`📋 [CROSS_SERVICE] Registered scenario: divorce_documentation`);
}
```

### **Step 3: Define Service Dependencies**

Add service dependency mappings in `initializeServiceDependencies()`:

```typescript
private initializeServiceDependencies(): void {
  // Existing dependencies...
  
  // Divorce-related dependencies
  this.serviceDependencies.set('akta_perceraian', [
    {
      serviceId: 'kk_perubahan',
      dependencyType: 'required',
      trigger: 'status_change',
      priority: 9,
      description: 'KK harus diperbarui setelah akta perceraian jadi'
    }
  ]);
  
  this.serviceDependencies.set('kk_perubahan', [
    {
      serviceId: 'ktp_perubahan',
      dependencyType: 'required',
      trigger: 'status_change', 
      priority: 8,
      description: 'KTP diperbarui setelah KK selesai'
    }
  ]);
}
```

### **Step 4: Add Query Patterns**

Update `MultiServiceQueryAnalyzer.initializeMultiServicePatterns()`:

```typescript
private initializeMultiServicePatterns(): void {
  this.multiServicePatterns = [
    // Existing patterns...
    
    // Divorce-specific patterns
    /setelah.*cerai.*dokumen.*apa/i,
    /perceraian.*dokumen.*lengkap/i,
    /pasca.*perceraian.*urus/i,
    /cerai.*resmi.*dokumen/i,
  ];
}
```

### **Step 5: Add Service Keywords**

Update service keyword mapping in `MultiServiceQueryAnalyzer.initializeServiceKeywords()`:

```typescript
private initializeServiceKeywords(): void {
  // Existing keywords...
  
  this.serviceKeywords.set('akta_perceraian', [
    'akta perceraian', 'perceraian', 'cerai', 'bercerai', 'surat cerai'
  ]);
}
```

### **Step 6: Create Knowledge Base Entry**

Add the service to `KnowledgeService.initializeKnowledgeBase()`:

```typescript
// Akta Perceraian
this.knowledgeBase.set('akta_perceraian', {
  serviceName: 'Akta Perceraian',
  serviceCode: 'PERCERAIAN-001',
  serviceType: 'Pencatatan Perceraian',
  requirements: [
    { name: 'Putusan Pengadilan yang telah berkekuatan hukum tetap', required: true },
    { name: 'Fotokopi KTP suami dan istri', required: true },
    { name: 'Fotokopi Akta Perkawinan', required: true },
    { name: 'Fotokopi Kartu Keluarga', required: true }
  ],
  processSteps: [
    { step: 1, description: 'Persiapkan dokumen persyaratan', estimatedTime: '1-2 hari' },
    { step: 2, description: 'Datang ke Dinas Dukcapil dengan dokumen asli', estimatedTime: '1 hari' },
    { step: 3, description: 'Verifikasi dan validasi dokumen', estimatedTime: '1-2 hari' },
    { step: 4, description: 'Penerbitan Akta Perceraian', estimatedTime: '7-14 hari' }
  ],
  duration: '2-3 minggu',
  cost: 'Gratis',
  officeHours: '08:00-15:00 WIB (Senin-Jumat)',
  notes: [
    'Putusan pengadilan harus sudah berkekuatan hukum tetap',
    'Kedua belah pihak tidak perlu hadir bersamaan',
    'Akta perceraian diperlukan untuk update dokumen lainnya'
  ]
});
```

---

## 🧪 **Testing New Scenarios**

### **Create Test Cases**

Add test cases to `multiServiceTestCases.ts`:

```typescript
// Divorce Documentation Test Cases
{
  id: 'divorce_docs_1',
  name: 'Post-Divorce Documentation',
  query: 'Setelah cerai dokumen apa saja yang harus diurus?',
  expectedScenario: 'divorce_documentation',
  expectedServices: ['akta_perceraian', 'kk_perubahan', 'ktp_perubahan'],
  expectedComplexity: 'complex',
  description: 'Complete post-divorce documentation process'
},
{
  id: 'divorce_docs_2', 
  name: 'Divorce with Children',
  query: 'Cerai dengan anak, dokumen apa yang perlu diperbarui?',
  expectedScenario: 'divorce_documentation',
  expectedServices: ['akta_perceraian', 'kk_perubahan', 'ktp_perubahan', 'kia_perubahan'],
  expectedComplexity: 'complex',
  description: 'Divorce scenario involving children'
}
```

### **Run Tests**

```typescript
import { MultiServiceTestRunner } from './multiServiceTestCases';

const testRunner = new MultiServiceTestRunner(knowledgeService);
const results = await testRunner.runAllTests();

// Check specific scenario
const divorceTests = results.filter(r => r.testCase.id.startsWith('divorce_'));
console.log(`Divorce scenario tests: ${divorceTests.length} passed`);
```

---

## 📊 **Best Practices**

### **Scenario Design**
- **Clear Trigger Patterns** - Use specific, unambiguous patterns
- **Logical Dependencies** - Ensure service ordering makes administrative sense
- **Realistic Timelines** - Base estimates on actual government processing times
- **Comprehensive Coverage** - Include all related services and documents

### **Pattern Creation**
- **Multiple Variations** - Include formal and casual language patterns
- **Regional Variations** - Consider local terminology and expressions
- **Negative Cases** - Ensure patterns don't trigger incorrectly

### **Testing Strategy**
- **Edge Cases** - Test boundary conditions and unusual combinations
- **Performance** - Ensure new scenarios don't impact response times
- **User Experience** - Validate responses provide clear, actionable guidance

---

## 🔧 **Configuration Options**

### **Scenario Complexity Levels**
- **Simple** (1-2 services) - Basic dependencies, 1-2 week timeline
- **Moderate** (3-4 services) - Some dependencies, 2-4 week timeline  
- **Complex** (4+ services) - Multiple dependencies, 4+ week timeline

### **Dependency Types**
- **Required** - Always needed for this scenario
- **Conditional** - Needed based on user circumstances
- **Optional** - Recommended but not mandatory

### **Priority Levels**
- **10** - Critical, must be done first
- **8-9** - High priority, early in process
- **6-7** - Medium priority, middle of process
- **4-5** - Lower priority, later in process
- **1-3** - Optional or final steps

---

## 📈 **Monitoring and Optimization**

### **Performance Metrics**
Monitor new scenarios for:
- **Detection Accuracy** - Are queries correctly identified?
- **Response Quality** - Do users find guidance helpful?
- **Completion Rates** - Do users successfully complete processes?

### **Continuous Improvement**
- **User Feedback** - Collect feedback on scenario guidance
- **Pattern Refinement** - Update trigger patterns based on usage
- **Dependency Updates** - Adjust service relationships as needed

---

## 🎉 **Deployment**

### **Production Checklist**
- [ ] Scenario tested with comprehensive test cases
- [ ] Performance impact validated (<1000ms response times)
- [ ] Documentation updated with new scenario details
- [ ] User acceptance testing completed
- [ ] Monitoring configured for new scenario

### **Rollback Plan**
If issues arise:
1. Comment out scenario registration in `initializeScenarios()`
2. Remove trigger patterns from analyzer
3. Deploy updated code
4. Monitor for resolution

New multi-service scenarios enhance SELLY's ability to guide users through complex administrative processes. Follow this guide to ensure new scenarios are well-designed, thoroughly tested, and provide excellent user experience.

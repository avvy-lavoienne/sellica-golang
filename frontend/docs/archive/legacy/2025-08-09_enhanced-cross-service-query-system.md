# Enhanced Cross-Service Query System for SELLY

**Date:** 2025-08-09  
**Version:** 1.0  
**Status:** ✅ IMPLEMENTED

## 🎯 **Overview**

The Enhanced Cross-Service Query System enables SELLY to handle complex multi-document scenarios where users need guidance across multiple Disdukcapil services. This system intelligently identifies when a query involves multiple services and provides comprehensive, step-by-step guidance.

## 🏗️ **Architecture Components**

### **1. CrossServiceDependencyMapper**
**File:** `src/services/chatbot/crossServiceDependencyMapper.ts`

Maps relationships between the 24+ Disdukcapil services and defines common multi-service scenarios:

- **Address Change Scenarios:** Pindah domisili affecting KTP, KK, KIA
- **Marriage Documentation:** Post-marriage document updates
- **Child Birth Documentation:** Complete newborn documentation process
- **Document Loss Recovery:** Recovery from multiple document loss

### **2. MultiServiceQueryAnalyzer**
**File:** `src/services/chatbot/multiServiceQueryAnalyzer.ts`

Analyzes user queries to identify multi-service scenarios:

- **Pattern Recognition:** Detects multi-service indicators
- **Service Detection:** Identifies mentioned services in queries
- **Confidence Scoring:** Calculates likelihood of multi-service need
- **Complexity Assessment:** Determines processing approach

### **3. MultiServiceResponseSynthesizer**
**File:** `src/services/chatbot/multiServiceResponseSynthesizer.ts`

Combines information from multiple knowledge base entries:

- **Response Synthesis:** Merges multiple service information
- **Process Ordering:** Determines optimal service sequence
- **Timeline Calculation:** Estimates total completion time
- **Warning & Tips Generation:** Provides contextual guidance

## 🔄 **Processing Flow**

```
User Query → MultiServiceQueryAnalyzer → CrossServiceDependencyMapper → MultiServiceResponseSynthesizer → Formatted Response
     ↓                    ↓                           ↓                              ↓
[Pattern Detection] [Scenario Matching] [Service Dependencies] [Comprehensive Guidance]
```

## 📝 **Usage Examples**

### **Example 1: Address Change**
**Query:** "Saya mau pindah domisili, dokumen apa saja yang perlu diperbarui?"

**System Response:**
```
🎯 Perubahan Alamat/Domisili

Halo kak! 😊 Saya SELLY akan membantu kakak dengan proses perubahan alamat/domisili yang melibatkan 3 jenis dokumen.

📋 Langkah-langkah Lengkap:

1️⃣ Kepindahan
⏱️ Estimasi waktu: 1-2 minggu
📄 Persyaratan utama:
   • Formulir Kepindahan F-1.03
   • KTP-el yang masih berlaku
   • Kartu Keluarga

2️⃣ Perubahan Data Kartu Keluarga
⏱️ Estimasi waktu: 1 minggu
📄 Persyaratan utama:
   • Formulir Perubahan Elemen Data F-1.06
   • KK lama
   • Surat kepindahan yang sudah jadi

3️⃣ Kartu Tanda Penduduk elektronik (KTP-el)
⏱️ Estimasi waktu: 1 minggu
📄 Persyaratan utama:
   • KK yang sudah diperbarui
   • KTP lama
   • Surat kepindahan

⏰ Estimasi Waktu Total: 3-4 minggu

⚠️ Hal Penting yang Perlu Diperhatikan:
• Beberapa dokumen saling bergantung. Ikuti urutan yang disarankan untuk menghindari penolakan.

💡 Tips dari SELLY:
• Urus surat kepindahan terlebih dahulu sebelum memperbarui dokumen lainnya
• Siapkan fotokopi semua dokumen yang diperlukan sebelum datang ke kantor
• Datang pagi hari untuk menghindari antrian panjang
```

### **Example 2: Marriage Documentation**
**Query:** "Setelah nikah dokumen apa saja yang harus diurus?"

**Detected Scenario:** Marriage Documentation  
**Involved Services:** Akta Perkawinan, KK Baru (Marriage), KTP Update  
**Complexity:** Complex  
**Estimated Duration:** 3-4 minggu

## 🎛️ **Configuration & Extensibility**

### **Adding New Scenarios**
```typescript
// Add to CrossServiceDependencyMapper
this.scenarios.set('new_scenario', {
  scenarioId: 'new_scenario',
  name: 'New Scenario Name',
  description: 'Scenario description',
  triggerPatterns: [/pattern1/i, /pattern2/i],
  primaryServices: ['service1'],
  dependentServices: [
    {
      serviceId: 'service2',
      dependencyType: 'required',
      trigger: 'condition',
      priority: 8,
      description: 'Why this service is needed'
    }
  ],
  // ... other configuration
});
```

### **Adding Service Dependencies**
```typescript
// Add to service dependency mapping
this.serviceDependencies.set('service_id', [
  {
    serviceId: 'dependent_service',
    dependencyType: 'required',
    trigger: 'trigger_condition',
    priority: 9,
    description: 'Dependency explanation'
  }
]);
```

## 📊 **Performance Metrics**

### **Response Time Targets**
- **Multi-Service Analysis:** <200ms
- **Response Synthesis:** <300ms
- **Total Processing:** <1000ms (including Groq enhancement)

### **Accuracy Targets**
- **Scenario Detection:** 90%+ accuracy for defined scenarios
- **Service Identification:** 95%+ accuracy for mentioned services
- **Dependency Mapping:** 100% accuracy for configured relationships

## 🧪 **Testing**

### **Test Cases Included**
- **Address Change Scenarios:** 3 test cases
- **Marriage Documentation:** 3 test cases  
- **Child Birth Documentation:** 2 test cases
- **Document Loss Recovery:** 2 test cases
- **General Multi-Service:** 2 test cases

### **Running Tests**
```typescript
import { MultiServiceTestRunner } from './multiServiceTestCases';
import { KnowledgeService } from './knowledgeService';

const knowledgeService = KnowledgeService.getInstance();
const testRunner = new MultiServiceTestRunner(knowledgeService);

// Run all tests
const results = await testRunner.runAllTests();

// Run specific test
const singleResult = await testRunner.runSingleTest(testCases[0]);
```

## 🔗 **Integration Points**

### **KnowledgeService Integration**
The system seamlessly integrates with existing KnowledgeService:

```typescript
// Enhanced getServiceInfo method
public getServiceInfo(query: string): ServiceInfo | null {
  // Step 1: Check for multi-service scenarios
  const multiServiceResult = this.analyzeMultiServiceQuery(query);
  
  if (multiServiceResult.isMultiService && multiServiceResult.scenario) {
    return this.createMultiServiceInfo(multiServiceResult);
  }
  
  // Step 2: Fall back to single-service processing
  return this.getSingleServiceInfo(query);
}
```

### **SimpleResponseService Integration**
No changes required - existing `knowledgeService.getServiceInfo()` calls automatically handle multi-service scenarios.

### **Caching Integration**
Multi-service responses work with existing AdministrativeResponseCache patterns, bypassing cache for specific document queries while maintaining performance for generic queries.

## 🚀 **Future Enhancements**

### **Phase 2 Improvements**
1. **Dynamic Learning:** Learn new service relationships from user interactions
2. **Personalization:** Customize scenarios based on user history
3. **Predictive Suggestions:** Proactively suggest related services

### **Advanced Features**
1. **Visual Process Maps:** Generate flowcharts for complex scenarios
2. **Progress Tracking:** Track user progress through multi-service processes
3. **Appointment Scheduling:** Integrate with office scheduling systems

## 📈 **Impact Assessment**

### **User Experience Improvements**
- **Comprehensive Guidance:** Users get complete process overview
- **Reduced Confusion:** Clear step-by-step instructions
- **Time Savings:** Optimal service ordering prevents rework

### **System Benefits**
- **Reduced Support Load:** Fewer follow-up questions
- **Higher Success Rate:** Better process completion rates
- **Improved Satisfaction:** More helpful, complete responses

## 🔧 **Maintenance**

### **Regular Updates**
- **Service Relationships:** Review and update dependencies quarterly
- **Scenario Patterns:** Add new patterns based on user queries
- **Performance Monitoring:** Track response times and accuracy

### **Configuration Management**
- **Centralized Configuration:** All scenarios and dependencies in dedicated files
- **Version Control:** Track changes to service relationships
- **Testing Integration:** Automated tests for all scenarios

This Enhanced Cross-Service Query System transforms SELLY from a single-service assistant into a comprehensive guide for complex administrative processes, significantly improving user experience while maintaining the performance and reliability of the existing architecture.

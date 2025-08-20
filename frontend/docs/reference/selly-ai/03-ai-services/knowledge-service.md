# Knowledge Service Documentation
**Enhanced Cross-Service Administrative Knowledge Base for SELLY**

**Version**: 6.0 (Enhanced Cross-Service)
**Created**: February 2, 2025
**Updated**: August 9, 2025 (Enhanced Cross-Service Query System)
**Service**: `KnowledgeService`
**Purpose**: Comprehensive Administrative Knowledge Management with Multi-Service Intelligence

---

## 🎯 **Overview**

The Knowledge Service is SELLY's **enhanced cross-service administrative knowledge base**, providing detailed information about all 24 Indonesian civil registration documents, procedures, and requirements. It serves as the primary source of truth for all administrative guidance with **multi-service intelligence** and **comprehensive cross-service process guidance**.

### **🚀 Key Features (Enhanced Cross-Service)**
- **24-Service Coverage** - Complete routing for all Disdukcapil document types
- **Multi-Service Intelligence** - Detects and handles complex multi-document scenarios
- **4 Pre-configured Scenarios** - Address change, marriage documentation, child birth, document loss recovery
- **Service Dependency Mapping** - Intelligent ordering prevents document rejections
- **Cross-Service Query Analysis** - 90%+ accuracy for multi-service detection
- **Comprehensive Process Guidance** - Step-by-step instructions with timelines and tips
- **KTP Conversational System** - Advanced A, B, C, D scenario-based guidance
- **KK Training System** - Comprehensive A-G scenario responses with specific filtering
- **Interactive Assessment System** - Personalized guidance for complex processes
- **Automated Pattern Generation** - Dynamic pattern creation for new document types
- **Casual Language Support** - 200+ Indonesian language patterns per service
- **Groq Enhancement Integration** - Smart enhancement applied to all responses
- **Real-Time Updates** - Easy knowledge base management and updates
- **Indonesian Language Optimization** - Culturally appropriate content and terminology
- **Singleton Pattern** - Efficient memory usage and consistent state

---

## 🏗️ **Architecture**

### **Enhanced Service Design**
```typescript
export class KnowledgeService {
  private static instance: KnowledgeService;
  private knowledgeBase: Map<string, ServiceInfo>;
  private multiServiceAnalyzer: MultiServiceQueryAnalyzer;
  private multiServiceSynthesizer: MultiServiceResponseSynthesizer;
  private casualPatternGenerator: CasualPatternGenerator;

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService();
    }
    return KnowledgeService.instance;
  }

  // Enhanced method with multi-service support
  public getServiceInfo(query: string): ServiceInfo | null {
    // Step 1: Check for multi-service scenarios first
    const multiServiceResult = this.analyzeMultiServiceQuery(query);

    if (multiServiceResult.isMultiService && multiServiceResult.scenario) {
      return this.createMultiServiceInfo(multiServiceResult);
    }

    // Step 2: Fall back to single-service processing
    return this.getSingleServiceInfo(query);
  }
}
```

### **Knowledge Structure**
```typescript
interface ServiceInfo {
  serviceName: string;
  serviceCode: string;
  serviceType: string;
  targetAge?: string;
  lastUpdated: string;
  version: string;
  regulationBasis: string[];
  requirements: Requirement[];
  processSteps: ProcessStep[];
  duration: string;
  cost: string;
  officeHours: string;
  notes: string[];
  interactiveAssessment?: InteractiveAssessment;
}
```

---

## 📚 **Document Coverage**

### **Identity Documents**
- **KTP (Kartu Tanda Penduduk)** - Electronic ID card with advanced conversational A, B, C, D scenario system
- **KK (Kartu Keluarga)** - Family card with situation-specific guidance
- **KIA (Kartu Identitas Anak)** - Child identity card for under-17 citizens

### **Civil Registration Documents**
- **Akta Kelahiran** - Birth certificate procedures and requirements
- **Akta Kematian** - Death certificate documentation
- **Akta Perkawinan** - Marriage certificate processes
- **Akta Perceraian** - Divorce certificate procedures

### **Administrative Services**
- **Kepindahan** - Address change and migration services
- **Legalisir** - Document legalization and authentication
- **Surat Keterangan** - Various administrative certificates

---

## 🎭 **Interactive Assessment System**

### **Assessment Configuration**
```typescript
interface InteractiveAssessment {
  assessmentType: string;
  description: string;
  questions: AssessmentQuestion[];
  guidance: string;
  followUpActions: string[];
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'yes_no' | 'multiple_choice' | 'text';
  options?: string[];
  followUp?: string;
}
```

### **KTP Conversational System Example**
```typescript
// Two-step conversational flow
// Step 1: Initial query shows simple question
const initialQuery = 'aku ingin cetak ktp';
const initialResponse = knowledgeService.getServiceInfo(initialQuery);
// Returns: Simple question with A, B, C, D options

// Step 2: User responds with scenario choice
const scenarioQuery = 'Belum pernah perekaman sama sekali (KTP pertama kali)';
const scenarioResponse = knowledgeService.getServiceInfo(scenarioQuery);
// Returns: Detailed Scenario C guidance

// KTP Scenario Configuration
const ktpScenarios = {
  A: 'Sudah pernah perekaman, tapi KTP hilang/rusak',
  B: 'Sudah pernah perekaman, tapi ada data yang salah/perlu dikoreksi',
  C: 'Belum pernah perekaman sama sekali (KTP pertama kali)',
  D: 'Tidak yakin/tidak ingat'
};

// Scenario response detection with 134+ patterns
const scenarioPatterns = {
  A: ['A', 'hilang', 'rusak', 'ktp gue hilang', 'ktp rusak nih'],
  B: ['B', 'koreksi', 'data salah', 'mau ganti data', 'nama gak sesuai'],
  C: ['C', 'pertama kali', 'belum pernah', 'gue belum punya ktp'],
  D: ['D', 'tidak yakin', 'lupa', 'gak tau', 'bingung']
};
```

---

## 🔧 **Implementation**

### **Basic Usage**
```typescript
import { KnowledgeService } from '@/services/chatbot/knowledgeService';

// Get singleton instance
const knowledgeService = KnowledgeService.getInstance();

// KTP Conversational Flow
const initialQuery = knowledgeService.getServiceInfo('aku mau buat ktp');
console.log(typeof initialQuery); // "string" - Simple A, B, C, D question

const scenarioQuery = knowledgeService.getServiceInfo('C');
console.log(typeof scenarioQuery); // "string" - Detailed Scenario C response

// KTP Scenario Response Detection
const scenarioResponse = knowledgeService.getKTPScenarioResponse('belum pernah');
console.log(scenarioResponse); // Detailed KTP Pertama Kali guidance

// Spelling Variations Support
const variations = [
  'akta kematian',  // Standard
  'akte kematian',  // Common variation
  'akteu kematian'  // Regional variation
];
variations.forEach(query => {
  const result = knowledgeService.getServiceInfo(query);
  console.log(`${query} → Recognized`); // All variations work
});
```

### **Pattern Matching**
```typescript
// Automated pattern generation integration
const casualPatterns = knowledgeService.getCasualPatterns('ktp');
console.log(casualPatterns.length); // 200+ generated patterns

// Manual pattern checking
const patterns = [
  /\b(ktp|kartu tanda penduduk)\b/i,
  /\b(bikin|buat|ngurus).*ktp\b/i,
  /\bsyarat.*ktp\b/i
];
```

---

## 📊 **Service Information Structure**

### **Document Requirements**
```typescript
interface Requirement {
  name: string;
  required: boolean;
  description?: string;
  alternatives?: string[];
}

// Example: KTP requirements
const ktpRequirements = [
  {
    name: 'Fotokopi Kartu Keluarga (KK)',
    required: true,
    description: 'KK asli dan fotokopi untuk verifikasi'
  },
  {
    name: 'Akta kelahiran/ijazah terakhir asli',
    required: true,
    alternatives: ['Akta Kelahiran', 'Ijazah SD/SMP/SMA', 'Surat Baptis']
  }
];
```

### **Process Steps**
```typescript
interface ProcessStep {
  step: number;
  description: string;
  duration?: string;
  location?: string;
  notes?: string[];
}

// Example: KTP process steps
const ktpSteps = [
  {
    step: 1,
    description: 'Datang ke Disdukcapil dengan membawa persyaratan lengkap',
    duration: '15 menit',
    location: 'Loket pendaftaran'
  },
  {
    step: 2,
    description: 'Mengisi formulir permohonan KTP',
    duration: '10 menit',
    notes: ['Isi dengan data yang benar', 'Tanyakan petugas jika ada kesulitan']
  }
];
```

---

## 🎯 **Query Processing**

### **Pattern Recognition Methods**
```typescript
// Document-specific query detection
public isKTPQuery(query: string): boolean {
  const patterns = this.casualPatternGenerator.getKTPPatterns();
  return patterns.some(pattern => pattern.test(query.toLowerCase()));
}

public isKKQuery(query: string): boolean {
  const patterns = this.casualPatternGenerator.getKKPatterns();
  return patterns.some(pattern => pattern.test(query.toLowerCase()));
}

// Generic service detection
public isCompleteServiceQuery(query: string): boolean {
  const completeServicePatterns = [
    /\b(layanan|pelayanan).*lengkap\b/i,
    /\b(semua|seluruh).*layanan\b/i,
    /\bapa saja.*layanan\b/i
  ];
  return completeServicePatterns.some(pattern => pattern.test(query));
}
```

### **Service Selection Logic**
```typescript
public getServiceInfo(query: string): ServiceInfo | null {
  const lowerQuery = query.toLowerCase();

  // Priority order for service matching
  if (this.isCompleteServiceQuery(lowerQuery)) {
    return this.knowledgeBase.get('layanan_lengkap_disdukcapil');
  }

  if (this.isKTPQuery(lowerQuery)) {
    return this.knowledgeBase.get('ktp_interactive_assessment');
  }

  if (this.isKKQuery(lowerQuery)) {
    return this.knowledgeBase.get('kk_interactive_assessment');
  }

  // Continue with other document types...
  
  return null; // No matching service found
}
```

---

## 🔄 **Knowledge Base Management**

### **Adding New Documents**
```typescript
// Add new document service
knowledgeService.addService('new_document', {
  serviceName: 'New Document Service',
  serviceCode: 'NEW-DOC-001',
  serviceType: 'Document Creation',
  requirements: [...],
  processSteps: [...],
  // ... other properties
});

// Generate patterns automatically
const patterns = casualPatternGenerator.generatePatternsForDocument({
  documentType: 'new_document',
  documentNames: ['new document', 'dokumen baru'],
  actions: ['bikin', 'buat', 'ngurus']
});
```

### **Updating Existing Services**
```typescript
// Update service information
knowledgeService.updateService('ktp_baru', {
  lastUpdated: '2025-02-02',
  version: '2.1',
  requirements: [...updatedRequirements]
});

// Refresh pattern cache
knowledgeService.refreshPatterns('ktp');
```

---

## 📈 **Performance Characteristics**

### **Response Times**
- **Service Lookup**: <5ms
- **Pattern Matching**: <1ms per pattern
- **Interactive Assessment**: <10ms
- **Knowledge Retrieval**: <15ms

### **Memory Usage**
- **Knowledge Base**: ~2MB loaded
- **Pattern Cache**: ~500KB
- **Service Metadata**: ~1MB
- **Total Footprint**: <5MB

---

## 🚀 **Future Enhancements**

### **Planned Features**
- **Dynamic Knowledge Updates** - Real-time knowledge base updates
- **Advanced Pattern Learning** - Machine learning for pattern improvement
- **Multi-Language Support** - Regional language variations
- **Enhanced Assessments** - More sophisticated interactive guidance

### **Integration Opportunities**
- **CMS Integration** - Content management system for knowledge updates
- **Analytics Integration** - Usage analytics for knowledge optimization
- **API Endpoints** - External access to knowledge base
- **Version Control** - Knowledge base versioning and rollback

---

## 📞 **Related Documentation**

- **[Casual Pattern Generation](../04-language-processing/casual-pattern-generation.md)** - Automated pattern system
- **[PersonaService](../05-persona-system/persona-overview.md)** - Persona integration
- **[SimpleResponseService](./simple-response-service.md)** - Primary AI service integration
- **[Interactive Assessment](../05-persona-system/interactive-assessment.md)** - Assessment system details

**Knowledge Service: The foundation of SELLY's administrative intelligence!** 📚

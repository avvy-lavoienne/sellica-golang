# Quick Start: Automated Casual Pattern Generation

**Time to Complete**: 15-30 minutes  
**Difficulty**: Beginner  
**Prerequisites**: Basic TypeScript knowledge  

---

## 🚀 **5-Minute Setup**

### **Step 1: Add Your Document Configuration (2 minutes)**

```typescript
// src/services/chatbot/documentConfigurations.ts

export const documentConfigurations: Record<string, DocumentConfig> = {
  // ... existing configurations

  // ADD YOUR NEW DOCUMENT HERE 👇
  your_new_document: {
    documentType: 'your_new_document',
    documentNames: [
      'primary_name',        // e.g., 'surat domisili'
      'alternative_name',    // e.g., 'surat keterangan domisili'
      'casual_name'          // e.g., 'surat domisili'
    ],
    actions: [
      'bikin',              // Make (casual)
      'buat',               // Make (casual)
      'membuat',            // Make (formal)
      'ngurus',             // Process (casual)
      'mengurus',           // Process (formal)
      'cetak',              // Print
      'daftar'              // Register
    ],
    aliases: ['optional_alias']
  }
};
```

### **Step 2: Add Query Detection (3 minutes)**

```typescript
// src/services/chatbot/knowledgeService.ts

/**
 * Check if query is asking about YOUR_DOCUMENT services - AUTOMATED GENERATION
 */
private isYourDocumentQuery(query: string): boolean {
  // Generate casual patterns automatically
  const yourDocConfig = documentConfigurations.your_new_document;
  const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(yourDocConfig);
  
  // Optional: Add manual patterns for edge cases
  const manualPatterns = [
    /syarat.*your_document/i,
    /persyaratan.*your_document/i,
    // Add document-specific patterns if needed
  ];

  const allPatterns = [...generatedPatterns, ...manualPatterns];
  return allPatterns.some(pattern => pattern.test(query));
}
```

### **Step 3: Add Knowledge Base Entry (2 minutes)**

```typescript
// In the constructor of KnowledgeService

// YOUR_DOCUMENT Interactive Assessment
this.knowledgeBase.set('your_document_interactive_assessment', {
  serviceName: 'Your Document Interactive Assessment',
  serviceCode: 'YOUR-DOC-ASSESS-001',
  serviceType: 'Penilaian Interaktif Layanan Your Document',
  requirements: [
    { name: 'Penilaian situasi spesifik pengguna untuk Your Document', required: true }
  ],
  processSteps: [
    { step: 1, description: 'Menanyakan situasi dokumen saat ini', estimatedTime: '1 menit' },
    { step: 2, description: 'Menanyakan jenis kebutuhan', estimatedTime: '1 menit' },
    { step: 3, description: 'Memberikan panduan spesifik', estimatedTime: '2 menit' }
  ],
  duration: 'Interaktif',
  cost: 'Gratis',
  officeHours: '24/7 (Assessment Online)',
  notes: [
    'Assessment dilakukan untuk memberikan panduan yang tepat',
    'Setiap situasi memiliki persyaratan yang berbeda'
  ]
});
```

### **Step 4: Integrate Query Check (1 minute)**

```typescript
// In the getServiceInfo method

// YOUR_DOCUMENT patterns - Interactive Assessment Required
if (this.isYourDocumentQuery(lowerQuery)) {
  return this.knowledgeBase.get('your_document_interactive_assessment') || null;
}
```

### **Step 5: Add Assessment Formatter (2 minutes)**

```typescript
// In the formatServiceResponse method

// Special handling for YOUR_DOCUMENT interactive assessment
if (serviceInfo.serviceCode === 'YOUR-DOC-ASSESS-001') {
  return this.formatYourDocumentAssessment();
}

// Add the formatter method
public formatYourDocumentAssessment(): string {
  return `📄 **Layanan Your Document - Penilaian Situasi Kak**

Halo kak! 😊 Saya SELLY akan membantu kak dengan layanan Your Document.

🤔 **Mari kita mulai dengan pertanyaan pertama:**

**[Your specific assessment question]**

📋 **Pilihan jawaban:**
• **A** - [Situation A]
• **B** - [Situation B]  
• **C** - [Situation C]

💡 **Kenapa saya tanya ini?**
[Explanation why assessment is needed]

🎯 **Silakan jawab dengan huruf atau jelaskan situasi kak.**

Saya siap membantu kak! 🤝`;
}
```

---

## 🧪 **Testing Your Implementation**

### **Quick Test Script:**

```typescript
// Create a test file: testYourDocument.ts

import { casualPatternGenerator } from './casualPatternGenerator';
import { documentConfigurations } from './documentConfigurations';

// Test your document patterns
const yourDocConfig = documentConfigurations.your_new_document;
const patterns = casualPatternGenerator.generatePatternsForDocument(yourDocConfig);

console.log(`✅ Generated ${patterns.length} patterns for your document`);

// Test specific queries
const testQueries = [
  'aku mau bikin [your_document]',
  'syarat buat [your_document] apa aja?',
  'cara ngurus [your_document] gimana?',
  'eh, [your_document] syaratnya apa sih?'
];

testQueries.forEach(query => {
  const matched = patterns.some(pattern => pattern.test(query));
  console.log(`${matched ? '✅' : '❌'} "${query}"`);
});
```

---

## 📋 **Common Document Examples**

### **Surat Domisili:**
```typescript
surat_domisili: {
  documentType: 'surat_domisili',
  documentNames: [
    'surat domisili',
    'surat keterangan domisili',
    'surat tempat tinggal'
  ],
  actions: ['bikin', 'buat', 'ngurus', 'urus', 'mengurus'],
  aliases: ['domisili']
}
```

### **Surat Keterangan Usaha:**
```typescript
surat_keterangan_usaha: {
  documentType: 'surat_keterangan_usaha',
  documentNames: [
    'surat keterangan usaha',
    'sku',
    'surat usaha'
  ],
  actions: ['bikin', 'buat', 'ngurus', 'urus', 'daftar'],
  aliases: ['surat bisnis']
}
```

### **Surat Keterangan Tidak Mampu:**
```typescript
sktm: {
  documentType: 'sktm',
  documentNames: [
    'sktm',
    'surat keterangan tidak mampu',
    'surat miskin'
  ],
  actions: ['bikin', 'buat', 'ngurus', 'urus', 'mengurus'],
  aliases: ['surat kurang mampu']
}
```

---

## ✅ **Validation Checklist**

### **Before Deployment:**
- [ ] Document configuration added
- [ ] Query detection method implemented
- [ ] Knowledge base entry created
- [ ] Query check integrated
- [ ] Assessment formatter added
- [ ] Test queries validated
- [ ] Success rate >95%

### **After Deployment:**
- [ ] Monitor query matching
- [ ] Track user satisfaction
- [ ] Collect failed queries
- [ ] Update patterns as needed

---

## 🎯 **Expected Results**

### **Pattern Generation:**
- **Total Patterns**: 150-300 (depending on configuration)
- **Development Time**: 15-30 minutes
- **Success Rate**: 95%+ on casual queries

### **Query Support:**
Your document will automatically support queries like:
```
✅ "aku mau bikin [document]"
✅ "eh, buat [document] syaratnya apa?"
✅ "cara ngurus [document] gimana?"
✅ "syarat [document] apa aja, bro?"
✅ "[document] di disdukcapil butuh apa?"
```

### **User Experience:**
- **Response Time**: <200ms
- **Natural Language**: Supports casual Indonesian
- **Interactive Guidance**: Personalized assessment
- **Consistent Quality**: Same experience as other documents

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **❌ Patterns not matching:**
```typescript
// Check your document names and actions
console.log('Document names:', yourDocConfig.documentNames);
console.log('Actions:', yourDocConfig.actions);

// Test pattern generation
const patterns = casualPatternGenerator.generatePatternsForDocument(yourDocConfig);
console.log(`Generated ${patterns.length} patterns`);
```

#### **❌ Query not triggering assessment:**
```typescript
// Debug query detection
const query = "your test query";
const isMatch = this.isYourDocumentQuery(query);
console.log(`Query "${query}" matched: ${isMatch}`);
```

#### **❌ Assessment not showing:**
```typescript
// Check service code matching
if (serviceInfo.serviceCode === 'YOUR-DOC-ASSESS-001') {
  console.log('Assessment triggered');
  return this.formatYourDocumentAssessment();
}
```

---

## 🎉 **Success!**

Congratulations! You've successfully implemented automated casual pattern generation for your document. Your users can now interact with SELLY using natural, casual Indonesian language and receive personalized guidance.

### **What You've Achieved:**
- ✅ **200+ patterns** generated automatically
- ✅ **Natural language** support for your document
- ✅ **Interactive assessment** for personalized guidance
- ✅ **Sub-200ms** response times
- ✅ **Scalable solution** that works for any document

### **Next Steps:**
1. **Monitor usage**: Track which patterns are most effective
2. **Collect feedback**: Identify areas for improvement
3. **Expand coverage**: Add more document variations if needed
4. **Share knowledge**: Help other developers implement their documents

**Welcome to the future of conversational AI!** 🚀

---

**Need Help?**
- Check the full reference documentation
- Review existing implementations (KTP, KK)
- Test with the provided testing framework
- Monitor logs for debugging information

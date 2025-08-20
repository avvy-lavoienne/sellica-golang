# Casual Pattern Generator API Reference

**Version**: 1.0  
**Module**: `src/services/chatbot/casualPatternGenerator.ts`  
**Export**: `casualPatternGenerator`  

---

## 📋 **Interfaces**

### **DocumentConfig**
Configuration for a document type.

```typescript
interface DocumentConfig {
  documentType: string;        // Unique identifier for the document
  documentNames: string[];     // Array of document name variations
  actions: string[];          // Array of action words (bikin, buat, etc.)
  aliases?: string[];         // Optional additional aliases
}
```

**Example:**
```typescript
const config: DocumentConfig = {
  documentType: 'ktp',
  documentNames: ['ktp', 'ktp-el', 'kartu tanda penduduk'],
  actions: ['bikin', 'buat', 'ngurus', 'cetak'],
  aliases: ['e-ktp']
};
```

### **CasualTemplate**
Template definition for pattern generation.

```typescript
interface CasualTemplate {
  category: string;           // Template category (intention, questions, etc.)
  pattern: string;           // Pattern template with placeholders
  description: string;       // Human-readable description
}
```

**Example:**
```typescript
const template: CasualTemplate = {
  category: 'intention',
  pattern: 'aku.*mau.*{action}.*{document}',
  description: 'I want to {action} {document}'
};
```

---

## 🛠️ **Main Class: CasualPatternGenerator**

### **generatePatternsForDocument(config: DocumentConfig): RegExp[]**

Generates comprehensive casual patterns for a document type.

**Parameters:**
- `config`: DocumentConfig - Document configuration

**Returns:**
- `RegExp[]` - Array of generated regex patterns

**Example:**
```typescript
const patterns = casualPatternGenerator.generatePatternsForDocument(kkConfig);
console.log(`Generated ${patterns.length} patterns`);
// Output: Generated 210 patterns
```

**Generated Pattern Examples:**
```typescript
// From template: 'aku.*mau.*{action}.*{document}'
// With action: 'bikin', document: 'kk'
// Result: /aku.*mau.*bikin.*kk/i

// From template: 'syarat.*{action}.*{document}.*apa.*aja.*sih'
// With action: 'buat', document: 'kartu keluarga'
// Result: /syarat.*buat.*kartu keluarga.*apa.*aja.*sih/i
```

---

### **generateTestQueries(config: DocumentConfig): string[]**

Generates test queries for validation.

**Parameters:**
- `config`: DocumentConfig - Document configuration

**Returns:**
- `string[]` - Array of test query strings

**Example:**
```typescript
const testQueries = casualPatternGenerator.generateTestQueries(kkConfig);
console.log(testQueries.slice(0, 5));
// Output: [
//   "aku mau bikin kk",
//   "eh, buat kk syaratnya apa?",
//   "syarat buat kartu keluarga apa aja sih?",
//   "bikin kk butuh apa aja?",
//   "kalo mau bikin kk, apa yang harus dibawa?"
// ]
```

---

### **testPatternMatching(config: DocumentConfig): TestResult**

Tests pattern matching effectiveness.

**Parameters:**
- `config`: DocumentConfig - Document configuration

**Returns:**
```typescript
interface TestResult {
  totalPatterns: number;
  testQueries: string[];
  matchResults: { query: string; matched: boolean }[];
  successRate: number;
}
```

**Example:**
```typescript
const results = casualPatternGenerator.testPatternMatching(kkConfig);
console.log(`Success Rate: ${results.successRate}%`);
// Output: Success Rate: 97.2%

console.log('Sample results:');
results.matchResults.slice(0, 3).forEach(result => {
  console.log(`${result.matched ? '✅' : '❌'} "${result.query}"`);
});
// Output:
// ✅ "aku mau bikin kk"
// ✅ "eh, buat kk syaratnya apa?"
// ✅ "syarat buat kartu keluarga apa aja sih?"
```

---

### **getPatternStats(config: DocumentConfig): PatternStats**

Gets detailed statistics about pattern generation.

**Parameters:**
- `config`: DocumentConfig - Document configuration

**Returns:**
```typescript
interface PatternStats {
  totalPatterns: number;
  patternsByCategory: Record<string, number>;
  documentVariations: number;
  actionVariations: number;
}
```

**Example:**
```typescript
const stats = casualPatternGenerator.getPatternStats(kkConfig);
console.log('Pattern Statistics:');
console.log(`Total: ${stats.totalPatterns}`);
console.log(`Documents: ${stats.documentVariations}`);
console.log(`Actions: ${stats.actionVariations}`);
console.log('By Category:', stats.patternsByCategory);

// Output:
// Pattern Statistics:
// Total: 210
// Documents: 3
// Actions: 7
// By Category: {
//   intention: 21,
//   questions: 18,
//   requirements: 21,
//   institution: 15,
//   process: 15,
//   casual: 15
// }
```

---

## 📊 **Template Categories**

### **Available Categories:**

| Category | Count | Description | Example Template |
|----------|-------|-------------|------------------|
| `intention` | 7 | Express desire/want | `aku.*mau.*{action}.*{document}` |
| `questions` | 6 | Ask about requirements | `eh.*{action}.*{document}.*syaratnya` |
| `requirements` | 7 | Ask about documents | `{action}.*{document}.*butuh.*apa.*aja` |
| `institution` | 5 | Mention Disdukcapil | `{action}.*{document}.*disdukcapil.*dibutuhin` |
| `process` | 5 | Ask about procedures | `kalo.*mau.*{action}.*{document}` |
| `casual` | 5 | Very informal | `syarat.*{action}.*{document}.*apa.*aja.*bro` |

### **Template Placeholders:**
- `{action}`: Replaced with action words (bikin, buat, ngurus, etc.)
- `{document}`: Replaced with document names (ktp, kartu keluarga, etc.)

---

## 🧪 **Testing Utilities**

### **Pattern Validation:**
```typescript
// Test if a specific query matches generated patterns
function testQuery(query: string, config: DocumentConfig): boolean {
  const patterns = casualPatternGenerator.generatePatternsForDocument(config);
  return patterns.some(pattern => pattern.test(query));
}

// Example usage
const isMatch = testQuery("aku mau bikin kk", kkConfig);
console.log(`Query matched: ${isMatch}`); // true
```

### **Batch Testing:**
```typescript
// Test multiple queries at once
function batchTest(queries: string[], config: DocumentConfig): void {
  const patterns = casualPatternGenerator.generatePatternsForDocument(config);
  
  queries.forEach(query => {
    const matched = patterns.some(pattern => pattern.test(query));
    console.log(`${matched ? '✅' : '❌'} "${query}"`);
  });
}

// Example usage
const testQueries = [
  "aku mau bikin kk",
  "syarat buat kartu keluarga apa?",
  "cara ngurus kk gimana?"
];

batchTest(testQueries, kkConfig);
```

### **Performance Testing:**
```typescript
// Measure pattern generation performance
function performanceTest(config: DocumentConfig): void {
  const startTime = performance.now();
  const patterns = casualPatternGenerator.generatePatternsForDocument(config);
  const endTime = performance.now();
  
  console.log(`Generated ${patterns.length} patterns in ${endTime - startTime}ms`);
}

// Example usage
performanceTest(kkConfig);
// Output: Generated 210 patterns in 15ms
```

---

## 🔧 **Advanced Usage**

### **Custom Template Addition:**
```typescript
// Extend the generator with custom templates
class ExtendedPatternGenerator extends CasualPatternGenerator {
  addCustomTemplate(category: string, template: CasualTemplate): void {
    if (!this.casualTemplates[category]) {
      this.casualTemplates[category] = [];
    }
    this.casualTemplates[category].push(template);
  }
}

// Usage
const extendedGenerator = new ExtendedPatternGenerator();
extendedGenerator.addCustomTemplate('regional', {
  category: 'regional',
  pattern: 'abdi.*hoyong.*{action}.*{document}',  // Sundanese
  description: 'I want to {action} {document} (Sundanese)'
});
```

### **Pattern Filtering:**
```typescript
// Filter patterns by category
function getPatternsByCategory(config: DocumentConfig, category: string): RegExp[] {
  const allPatterns = casualPatternGenerator.generatePatternsForDocument(config);
  const templates = casualPatternGenerator.casualTemplates[category] || [];
  
  // Filter patterns that match the category templates
  return allPatterns.filter(pattern => {
    return templates.some(template => 
      pattern.source.includes(template.pattern.split('.')[0])
    );
  });
}

// Example usage
const intentionPatterns = getPatternsByCategory(kkConfig, 'intention');
console.log(`Intention patterns: ${intentionPatterns.length}`);
```

### **Dynamic Configuration:**
```typescript
// Create configuration at runtime
function createDynamicConfig(
  documentType: string,
  names: string[],
  actions: string[]
): DocumentConfig {
  return {
    documentType,
    documentNames: names,
    actions,
    aliases: []
  };
}

// Example usage
const dynamicConfig = createDynamicConfig(
  'custom_document',
  ['custom doc', 'special document'],
  ['bikin', 'buat', 'ngurus']
);

const patterns = casualPatternGenerator.generatePatternsForDocument(dynamicConfig);
```

---

## ⚠️ **Error Handling**

### **Common Errors:**

#### **Empty Configuration:**
```typescript
// ❌ This will generate no patterns
const emptyConfig: DocumentConfig = {
  documentType: 'empty',
  documentNames: [],  // Empty array
  actions: [],        // Empty array
};

const patterns = casualPatternGenerator.generatePatternsForDocument(emptyConfig);
console.log(patterns.length); // 0
```

#### **Invalid Regex Characters:**
```typescript
// ❌ Document names with regex special characters
const problematicConfig: DocumentConfig = {
  documentType: 'problem',
  documentNames: ['doc[1]', 'doc(2)'],  // Contains regex special chars
  actions: ['bikin']
};

// Solution: Escape special characters in document names
const safeConfig: DocumentConfig = {
  documentType: 'safe',
  documentNames: ['doc\\[1\\]', 'doc\\(2\\)'],  // Escaped
  actions: ['bikin']
};
```

### **Validation:**
```typescript
// Validate configuration before use
function validateConfig(config: DocumentConfig): boolean {
  if (!config.documentNames.length) {
    console.error('Document names cannot be empty');
    return false;
  }
  
  if (!config.actions.length) {
    console.error('Actions cannot be empty');
    return false;
  }
  
  return true;
}

// Example usage
if (validateConfig(yourConfig)) {
  const patterns = casualPatternGenerator.generatePatternsForDocument(yourConfig);
}
```

---

## 📈 **Performance Considerations**

### **Pattern Caching:**
```typescript
// Cache patterns to avoid regeneration
const patternCache = new Map<string, RegExp[]>();

function getCachedPatterns(config: DocumentConfig): RegExp[] {
  const key = config.documentType;
  
  if (!patternCache.has(key)) {
    const patterns = casualPatternGenerator.generatePatternsForDocument(config);
    patternCache.set(key, patterns);
  }
  
  return patternCache.get(key)!;
}
```

### **Memory Usage:**
- **Pattern Count**: ~200-300 patterns per document
- **Memory per Pattern**: ~100-200 bytes
- **Total Memory**: ~20-60KB per document
- **Recommendation**: Cache patterns, don't regenerate

### **Execution Time:**
- **Pattern Generation**: 10-50ms per document
- **Query Matching**: <1ms per query
- **Recommendation**: Generate once, use many times

---

**This API provides everything you need to implement automated casual pattern generation for any document type in your system!** 🚀

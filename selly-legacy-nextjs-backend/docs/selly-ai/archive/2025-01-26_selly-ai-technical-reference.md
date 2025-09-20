# SELLY AI Technical Reference
**Date**: 2025-01-26  
**Version**: 3.0  
**Type**: Developer Documentation

## 🏗️ System Architecture

### **Core AI Components**

```
┌─────────────────────────────────────────────────────────────┐
│                    SELLY AI Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Next.js)                                       │
│  ├── /api/chat/route.ts                                    │
│  └── aiService.processEnhancedQuery()                      │
├─────────────────────────────────────────────────────────────┤
│  AI Service Layer                                          │
│  ├── aiServiceTensorFlow.ts (Main AI Engine)               │
│  ├── aiService.ts (Coordinator)                            │
│  └── enhancedQueryIntelligence.ts (Fallback)               │
├─────────────────────────────────────────────────────────────┤
│  AI Infrastructure                                         │
│  ├── tensorflowService.ts (Core TF.js)                     │
│  ├── modelManager.ts (Model Lifecycle)                     │
│  ├── webglAccelerator.ts (GPU Acceleration)                │
│  └── aiPipeline.ts (Processing Pipeline)                   │
├─────────────────────────────────────────────────────────────┤
│  Models & Data                                             │
│  ├── /models/basic-nlp/model.json                          │
│  ├── /models/intent-classifier/model.json                  │
│  └── Database Integration (Supabase)                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 API Reference

### **Main AI Service**

#### `aiServiceTensorFlow.processEnhancedQuery()`
```typescript
async processEnhancedQuery(
  query: string, 
  context?: any
): Promise<EnhancedAIResponse>
```

**Parameters:**
- `query`: User input string in Indonesian
- `context`: Optional conversation context

**Returns:**
```typescript
interface EnhancedAIResponse {
  content: string;
  type: 'text' | 'data' | 'error';
  metadata: {
    confidence: number;
    suggestions: string[];
    aiEnhanced: boolean;
    aiMetadata?: {
      aiProcessingTime: number;
      modelsUsed: string[];
      pipelineUsed: string;
      accelerated: boolean;
      confidence: number;
    };
  };
}
```

### **AI Enhancement Pipeline**

#### `applyAIEnhancements()`
```typescript
private async applyAIEnhancements(
  query: string,
  originalContent: string,
  context?: any
): Promise<EnhancedAIResponse>
```

**Process Flow:**
1. **AI Service Initialization**: Ensure AI service is ready
2. **Response Enhancement**: Add AI insights and suggestions
3. **Performance Monitoring**: Track processing metrics
4. **Graceful Fallback**: Return original response if AI fails

## 🤖 Model Management

### **Model Loading Strategy**

```typescript
interface LoadingStrategy {
  immediate: string[];    // Load on startup
  onDemand: string[];     // Load when needed
  background: string[];   // Load in background
  lazy: string[];         // Load on first use
}

const strategy = {
  immediate: ['intent-classifier', 'basic-nlp'],
  onDemand: ['sentiment-analyzer', 'entity-extractor'],
  background: ['advanced-nlp', 'trend-analyzer'],
  lazy: ['indoBERT', 'image-processor']
};
```

### **Model Configuration**

```typescript
interface AIModelConfig {
  name: string;
  url: string;
  version: string;
  size: number;        // MB
  priority: 'high' | 'medium' | 'low';
  backend: 'webgl' | 'cpu' | 'auto';
}
```

### **Available Models**

| Model | Size | Purpose | Status |
|-------|------|---------|--------|
| `basic-nlp` | 2.5MB | Basic Indonesian NLP | ✅ Active |
| `intent-classifier` | 1.8MB | Query intent detection | ✅ Active |
| `sentiment-analyzer` | 3.2MB | Sentiment analysis | ✅ Active |
| `entity-extractor` | 4.1MB | Named entity recognition | ✅ Active |
| `advanced-nlp` | 12.5MB | Advanced language processing | ⚠️ Background |
| `trend-analyzer` | 2.5MB | Data trend analysis | ✅ Active |

## 🔄 Processing Pipeline

### **Query Processing Flow**

```typescript
// 1. Query Reception
const query = "berapa total user bulan ini?";

// 2. Intent Detection
const intent = await intentClassifier.classify(query);
// Result: { type: 'statistics', confidence: 0.95 }

// 3. Entity Extraction
const entities = await entityExtractor.extract(query);
// Result: ['user', 'bulan ini', 'total']

// 4. Database Query
const data = await executeDataQuery(intent, entities);

// 5. Response Generation
const response = await generateResponse(data, intent);

// 6. AI Enhancement
const enhanced = await applyAIEnhancements(query, response);
```

### **AI Enhancement Process**

```typescript
// Enhancement Pipeline
const enhancement = {
  insights: [
    "📊 Volume data tinggi - pertimbangkan analisis trend",
    "🔍 Data tersedia - bisa dilakukan analisis lebih lanjut"
  ],
  suggestions: [
    "Coba pertanyaan yang lebih spesifik",
    "Gunakan kata kunci yang jelas"
  ],
  followUp: [
    "Ada yang ingin ditanyakan lebih lanjut?",
    "Perlu bantuan dengan data lain?"
  ]
};
```

## 🛠️ Configuration

### **Environment Variables**

```bash
# Core AI Configuration
NEXT_PUBLIC_ENABLE_TENSORFLOW=true
NEXT_PUBLIC_TENSORFLOW_JS_MODEL_URL=/models/basic-nlp/model.json

# TensorFlow Serving (Optional)
NEXT_PUBLIC_TENSORFLOW_SERVING_URL=http://localhost:8501
NEXT_PUBLIC_INDOBERT_MODEL_PATH=/models/indobert-base

# Performance Tuning
TENSORFLOW_CACHE_SIZE=100
TENSORFLOW_SERVING_TIMEOUT=10000
TENSORFLOW_SERVING_RETRY_ATTEMPTS=2
```

### **Model Paths**

```
public/models/
├── basic-nlp/
│   ├── model.json
│   ├── weights.bin
│   └── metadata.json
├── intent-classifier/
│   ├── model.json
│   └── weights.bin
├── sentiment-analyzer/
│   ├── model.json
│   └── weights.bin
└── entity-extractor/
    ├── model.json
    └── weights.bin
```

## 🔍 Debugging & Monitoring

### **Debug Logging**

Enable detailed logging by setting:
```bash
TENSORFLOW_DEBUG_LOGGING=true
```

**Key Log Messages:**
```
🚀 Using TensorFlow-enhanced processing...
📊 Executing database query...
✅ Database query completed
📝 Generating enhanced response...
✅ Enhanced response generated
🧠 Attempting to apply AI enhancements...
✅ AI enhancement complete in 452.05ms
🎯 AI enhanced: true
```

### **Performance Monitoring**

```typescript
// Performance Metrics
interface AIMetrics {
  aiProcessingTime: number;      // AI enhancement time
  modelsUsed: string[];          // Models involved
  pipelineUsed: string;          // Pipeline name
  accelerated: boolean;          // GPU acceleration used
  confidence: number;            // Overall confidence
}
```

### **Health Checks**

```typescript
// AI Service Health Check
const healthStatus = await aiServiceTensorFlow.healthCheck();
// Returns:
{
  tensorflowJS: boolean;
  tensorflowServing: boolean;
  modelManager: boolean;
  overall: boolean;
}
```

## 🚨 Error Handling

### **Common Issues & Solutions**

#### 1. **Model Loading Failures**
```typescript
// Error: Failed to parse URL from /models/basic-nlp/model.json
// Solution: URL resolution implemented
let fullModelUrl = modelUrl.startsWith('/') 
  ? `${window.location.origin}${modelUrl}`
  : modelUrl;
```

#### 2. **Server-Side WebGL Errors**
```typescript
// Error: document is not defined
// Solution: Environment detection
if (typeof window === 'undefined') {
  return { webglSupported: false };
}
```

#### 3. **AI Service Not Ready**
```typescript
// Error: AI service not ready
// Solution: Automatic initialization
if (!aiService.isReady()) {
  await aiService.initialize();
}
```

### **Graceful Degradation**

```typescript
// Fallback Chain
try {
  return await aiEnhancedResponse();
} catch (aiError) {
  try {
    return await enhancedQueryIntelligence();
  } catch (enhancedError) {
    return await basicResponse();
  }
}
```

## 📈 Performance Optimization

### **Model Loading Optimization**
- **Immediate Loading**: Critical models (2-3 models)
- **Background Loading**: Enhancement models (5s delay)
- **Lazy Loading**: Specialized models (on-demand)

### **Memory Management**
```typescript
// Model Disposal
if (this.model) {
  this.model.dispose();
  this.model = null;
}

// Variable Cleanup
tensorflow.disposeVariables();
```

### **Caching Strategy**
- **Model Cache**: In-memory model storage
- **Response Cache**: Temporary response caching
- **Database Cache**: Query result caching (TTL: 300s)

## 🔧 Development Guidelines

### **Adding New Models**

1. **Register Model Configuration**
```typescript
this.registerModel({
  name: 'new-model',
  url: '/models/new-model/model.json',
  version: '1.0.0',
  size: 5.0,
  priority: 'medium',
  backend: 'webgl'
});
```

2. **Update Loading Strategy**
```typescript
this.loadingStrategy = {
  immediate: ['intent-classifier', 'basic-nlp'],
  background: ['new-model'], // Add here
};
```

3. **Implement Model Usage**
```typescript
const model = await modelManager.getModel('new-model');
const result = await model.predict(inputData);
```

### **Extending AI Enhancements**

```typescript
// Custom Enhancement
private async customEnhancement(
  query: string,
  response: string
): Promise<Enhancement> {
  // Your custom AI logic here
  return {
    insights: [...],
    suggestions: [...],
    followUp: [...]
  };
}
```

## 🎯 Best Practices

1. **Always Handle Errors**: Implement graceful fallbacks
2. **Monitor Performance**: Track AI processing times
3. **Optimize Model Loading**: Use appropriate loading strategies
4. **Cache Intelligently**: Balance performance and memory
5. **Test Thoroughly**: Verify AI enhancements work correctly

---

**Last Updated**: 2025-01-26  
**Maintainer**: AI Development Team  
**Status**: ✅ Production Ready

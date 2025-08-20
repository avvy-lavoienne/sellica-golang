# UnifiedAIService Documentation
**Provider Pattern Orchestration for SELLY AI Services**

**Version**: 3.0  
**Created**: February 2, 2025  
**Status**: Core Architecture Component  
**Purpose**: AI Provider Orchestration and Management  

---

## 🎯 **Overview**

UnifiedAIService is SELLY's core AI orchestration system that implements a provider pattern for managing multiple AI services. It provides intelligent provider selection, fallback handling, and unified response formatting across all AI providers.

### **🚀 Key Features**
- **Provider Pattern Architecture** - Modular AI service management
- **Intelligent Provider Selection** - Dynamic routing based on query complexity
- **Unified Response Format** - Consistent response structure across providers
- **Fallback Chain Management** - Graceful degradation and error handling
- **Performance Monitoring** - Real-time provider health and performance tracking
- **Query Preprocessing** - Unified query normalization and analysis

---

## 🏗️ **Architecture**

### **Provider Pattern Design**
```typescript
interface AIProvider {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;
  
  processQuery(query: ProcessedQuery, context?: any): Promise<ProviderResponse>;
  isAvailable(): Promise<boolean>;
  getHealthStatus(): Promise<ProviderHealthStatus>;
  initialize(): Promise<void>;
}
```

### **Core Components**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Query Processor │ -> │ Provider Selector │ -> │ Response Format │
│   & Analysis    │    │   & Routing      │    │  & Enhancement  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         v                        v                        v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Error Handler   │    │ Performance      │    │ Fallback Chain  │
│ & Recovery      │    │ Monitor          │    │ Management      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Registered Providers**
1. **Enhanced Provider** - Advanced intelligence with schema insights
2. **TensorFlow Provider** - TensorFlow.js and TensorFlow Serving integration
3. **SimpleResponse Provider** - Fast, reliable local processing (via Enhanced)

---

## 🚀 **Implementation**

### **Basic Usage**
```typescript
import { UnifiedAIService } from '@/services/chatbot/core/UnifiedAIService';

// Initialize service
const aiService = new UnifiedAIService({
  defaultProvider: 'enhanced',
  fallbackChain: ['enhanced', 'tensorflow'],
  enablePerformanceMonitoring: true
});

await aiService.initialize();

// Process query with automatic provider selection
const response = await aiService.processQuery(
  "berapa jumlah data KTP yang sudah diproses bulan ini?",
  { userId: "user123" }
);
```

### **Configuration Options**
```typescript
interface UnifiedAIConfig {
  defaultProvider: string;
  fallbackChain: string[];
  enablePerformanceMonitoring: boolean;
  maxRetries: number;
  timeoutMs: number;
  enableQueryPreprocessing: boolean;
  enableResponseFormatting: boolean;
}
```

### **Provider Capabilities**
```typescript
interface ProviderCapabilities {
  indonesianLanguage: boolean;
  tensorflowIntegration: boolean;
  enhancedIntelligence: boolean;
  conversationalMode: boolean;
  realTimeProcessing: boolean;
  maxTokens: number;
  supportedResponseTypes: string[];
}
```

---

## 🎯 **Provider Selection Logic**

### **Query Complexity Analysis**
```typescript
interface QueryComplexity {
  level: 'simple' | 'moderate' | 'advanced' | 'complex';
  score: number;
  factors: {
    requiresDatabase: boolean;
    requiresVisualization: boolean;
    requiresCalculation: boolean;
    requiresMultiStep: boolean;
    hasTemporalElements: boolean;
  };
}
```

### **Selection Algorithm**
```typescript
// Provider selection based on query characteristics
if (complexity.level === 'simple' && requirements.conversationalMode) {
  return ['enhanced', 'tensorflow']; // Fast conversational responses
}

if (complexity.level === 'advanced' || requirements.tensorflowIntegration) {
  return ['tensorflow', 'enhanced']; // Advanced AI processing
}

if (requirements.enhancedIntelligence || complexity.factors.requiresDatabase) {
  return ['enhanced', 'tensorflow']; // Database intelligence
}

// Default fallback chain
return this.config.fallbackChain;
```

### **Provider Priority Matrix**
| Query Type | Primary | Secondary | Fallback |
|------------|---------|-----------|----------|
| **Simple Greeting** | Enhanced | TensorFlow | - |
| **Document Info** | Enhanced | TensorFlow | - |
| **Database Query** | Enhanced | TensorFlow | - |
| **Complex Analysis** | TensorFlow | Enhanced | - |
| **Visualization** | Enhanced | TensorFlow | - |

---

## 🔧 **Core Services**

### **1. Query Preprocessor**
```typescript
interface ProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  intent: QueryIntent;
  complexity: QueryComplexity;
  requirements: QueryRequirements;
  metadata: QueryMetadata;
}
```

**Features:**
- Query normalization and cleaning
- Intent classification and analysis
- Complexity scoring and categorization
- Requirement identification for provider selection

### **2. Response Formatter**
```typescript
interface UnifiedResponse {
  content: string;
  type: ResponseType;
  metadata: ResponseMetadata;
  provider: string;
  processingTime: number;
  confidence: number;
}
```

**Features:**
- Consistent response structure across providers
- Metadata enrichment and standardization
- Performance metrics integration
- Error handling and recovery information

### **3. Performance Monitor**
```typescript
interface ProviderMetrics {
  providerId: string;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  lastHealthCheck: Date;
  totalQueries: number;
}
```

**Features:**
- Real-time provider performance tracking
- Health status monitoring and alerts
- Response time analytics and optimization
- Error rate tracking and analysis

---

## 🛡️ **Error Handling & Fallback**

### **Fallback Chain Execution**
```typescript
async processWithFallback(query: ProcessedQuery, context?: any): Promise<AIResponse> {
  const providers = this.getProviderPriority(query.complexity, query.requirements);
  
  for (const providerId of providers) {
    try {
      const provider = this.providers.get(providerId);
      if (provider && await provider.isAvailable()) {
        return await this.processWithProvider(provider, query, context);
      }
    } catch (error) {
      console.warn(`Provider ${providerId} failed, trying next...`);
      continue;
    }
  }
  
  throw new Error('All providers failed');
}
```

### **Error Recovery Strategies**
1. **Provider Failure**: Automatic fallback to next available provider
2. **Timeout Handling**: Configurable timeout with graceful degradation
3. **Rate Limiting**: Built-in rate limiting and backoff strategies
4. **Health Monitoring**: Continuous provider health assessment

### **Graceful Degradation**
```typescript
// If all providers fail, return helpful fallback response
return {
  content: "Maaf, sistem sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat.",
  type: "error",
  metadata: {
    error: "All providers unavailable",
    fallbackUsed: true,
    retryAfter: 30
  }
};
```

---

## 📊 **Performance Monitoring**

### **Real-Time Metrics**
```typescript
interface SystemMetrics {
  totalQueries: number;
  averageResponseTime: number;
  successRate: number;
  providerDistribution: Record<string, number>;
  errorBreakdown: Record<string, number>;
}
```

### **Provider Health Dashboard**
```typescript
// Monitor provider health and performance
const healthStatus = await aiService.getSystemHealth();
console.log({
  overallHealth: healthStatus.overall,
  providerStatus: healthStatus.providers,
  systemLoad: healthStatus.load,
  recommendations: healthStatus.recommendations
});
```

### **Performance Optimization**
- **Automatic Load Balancing**: Distributes queries based on provider performance
- **Caching Strategy**: Intelligent response caching for common queries
- **Resource Management**: Efficient memory and CPU usage optimization
- **Predictive Scaling**: Anticipates load and adjusts provider allocation

---

## 🔄 **Provider Management**

### **Dynamic Provider Registration**
```typescript
// Register new providers at runtime
await aiService.registerProvider('custom-provider', customProvider);

// Update provider configuration
await aiService.updateProviderConfig('enhanced', {
  maxConcurrentRequests: 100,
  timeoutMs: 5000
});

// Disable/enable providers
await aiService.disableProvider('tensorflow');
await aiService.enableProvider('tensorflow');
```

### **Provider Health Checks**
```typescript
// Automatic health monitoring
setInterval(async () => {
  for (const [id, provider] of this.providers) {
    const health = await provider.getHealthStatus();
    if (!health.available) {
      console.warn(`Provider ${id} is unhealthy:`, health);
      // Automatic recovery or notification
    }
  }
}, 30000); // Check every 30 seconds
```

---

## 🚀 **Advanced Features**

### **Query Routing Intelligence**
```typescript
// Intelligent routing based on query patterns
const routingRules = {
  databaseQueries: ['enhanced'],
  visualizationRequests: ['enhanced', 'tensorflow'],
  complexAnalysis: ['tensorflow', 'enhanced'],
  simpleConversation: ['enhanced']
};
```

### **Response Caching**
```typescript
// Intelligent caching for performance optimization
interface CacheStrategy {
  ttl: number; // Time to live
  keyGenerator: (query: string, context?: any) => string;
  invalidationRules: string[];
}
```

### **A/B Testing Support**
```typescript
// Built-in A/B testing for provider comparison
const abTestConfig = {
  enabled: true,
  trafficSplit: { enhanced: 80, tensorflow: 20 },
  metrics: ['responseTime', 'accuracy', 'userSatisfaction']
};
```

---

## 🔄 **Future Enhancements**

### **Planned Features**
- **Machine Learning Provider Selection**: AI-driven provider routing
- **Advanced Caching**: Semantic caching with vector similarity
- **Multi-Modal Support**: Text, voice, and image processing
- **Distributed Processing**: Multi-node provider deployment

### **Integration Roadmap**
- **Gemini API Integration**: Google Gemini provider
- **Custom Model Support**: User-defined AI model integration
- **Edge Computing**: Edge-deployed provider support
- **Real-Time Analytics**: Advanced analytics and insights

---

## 📞 **Getting Started**

### **Quick Setup**
```typescript
// 1. Import and configure
import { UnifiedAIService } from '@/services/chatbot/core/UnifiedAIService';

// 2. Initialize with configuration
const aiService = new UnifiedAIService({
  defaultProvider: 'enhanced',
  fallbackChain: ['enhanced', 'tensorflow'],
  enablePerformanceMonitoring: true
});

// 3. Initialize and start processing
await aiService.initialize();
const response = await aiService.processQuery("Halo SELLY!");
```

### **Related Documentation**
- **[Enhanced Provider](./enhanced-provider.md)** - Advanced intelligence provider
- **[TensorFlow Provider](./tensorflow-provider.md)** - TensorFlow integration
- **[SimpleResponseService](./simple-response-service.md)** - Fast local processing
- **[Performance Optimization](../08-implementation-guides/performance-optimization.md)** - Optimization guide

**UnifiedAIService: The foundation for scalable, reliable AI service orchestration!** 🚀

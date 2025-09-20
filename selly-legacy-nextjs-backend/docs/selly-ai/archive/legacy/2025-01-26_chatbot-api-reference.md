# SELLY Chatbot API Reference
**Date**: 2025-01-26  
**Version**: 3.0  
**Type**: API Documentation

## 🎯 Overview

This document provides detailed API reference for all public methods and interfaces in the SELLY chatbot components.

## 🏗️ Core Service APIs

### **aiService.ts**

#### **Main Methods**

```typescript
class AIService {
  // Primary query processing
  async processEnhancedQuery(
    query: string, 
    context?: QueryContext
  ): Promise<AIResponse>

  // Service health check
  async healthCheck(): Promise<ServiceHealthStatus>

  // Configuration management
  updateConfig(config: AIServiceConfig): void
  getConfig(): AIServiceConfig

  // Service status
  isReady(): boolean
  getTensorFlowStatus(): Promise<TensorFlowStatus>
}
```

#### **Interfaces**

```typescript
interface AIResponse {
  content: string;
  type: 'text' | 'data' | 'error';
  metadata: {
    confidence: number;
    suggestions: string[];
    aiEnhanced?: boolean;
  };
}

interface QueryContext {
  userId?: string;
  sessionId?: string;
  previousQueries?: string[];
  userPreferences?: UserPreferences;
}

interface ServiceHealthStatus {
  overall: boolean;
  tensorflow: boolean;
  models: boolean;
  database: boolean;
  cache: boolean;
}
```

---

### **aiServiceTensorFlow.ts**

#### **Main Methods**

```typescript
class AIServiceTensorFlow {
  // Enhanced AI processing
  async processEnhancedQuery(
    query: string, 
    context?: any
  ): Promise<EnhancedAIResponse>

  // AI enhancement pipeline
  private async applyAIEnhancements(
    query: string,
    originalContent: string,
    context?: any
  ): Promise<EnhancedAIResponse>

  // Service initialization
  async initialize(): Promise<void>
  
  // Health monitoring
  async healthCheck(): Promise<TensorFlowHealthStatus>
}
```

#### **Enhanced Response Interface**

```typescript
interface EnhancedAIResponse extends AIResponse {
  metadata: AIResponse['metadata'] & {
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

---

### **dataService.ts**

#### **Main Methods**

```typescript
class ChatbotDataService {
  // Database overview
  async getDatabaseOverview(): Promise<DatabaseOverview>
  
  // User statistics
  async getUserStatistics(): Promise<UserStatistics>
  
  // Search operations
  async searchData(
    query: string, 
    filters?: SearchFilters
  ): Promise<SearchResults>
  
  // Data analysis
  async getDataAnalysis(
    analysisType: AnalysisType,
    parameters: AnalysisParameters
  ): Promise<AnalysisResults>
}
```

#### **Data Interfaces**

```typescript
interface DatabaseOverview {
  totalRecords: number;
  totalTables: number;
  tables: TableInfo[];
  lastUpdated: Date;
}

interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  userGrowth: GrowthMetrics;
}

interface SearchResults {
  results: any[];
  totalCount: number;
  searchTime: number;
  suggestions: string[];
}
```

## 🤖 AI & ML Component APIs

### **modelManager.ts**

#### **Main Methods**

```typescript
class ModelManager {
  // Model loading
  async loadModel(modelName: string): Promise<void>
  async preloadModels(): Promise<void>
  
  // Model management
  isModelLoaded(modelName: string): boolean
  getLoadedModels(): string[]
  
  // Model information
  getModelInfo(modelName: string): ModelInfo
  getLoadingStats(): LoadingStats
  
  // Cleanup
  dispose(): void
}
```

#### **Model Interfaces**

```typescript
interface ModelInfo {
  name: string;
  version: string;
  size: number;
  status: 'loading' | 'loaded' | 'error';
  loadTime?: number;
}

interface LoadingStats {
  totalModels: number;
  loadedModels: number;
  failedModels: number;
  totalLoadTime: number;
}
```

---

### **tensorflowJSService.ts**

#### **Main Methods**

```typescript
class TensorFlowJSService {
  // Model operations
  async loadModel(modelUrl: string): Promise<void>
  async predict(inputData: any): Promise<PredictionResult>
  
  // Tokenization
  tokenize(text: string): number[]
  detokenize(tokens: number[]): string
  
  // Service status
  getStatus(): ModelStatus
  dispose(): void
}
```

#### **Prediction Interface**

```typescript
interface PredictionResult {
  predictions: number[];
  confidence: number;
  processingTime: number;
  modelUsed: string;
}
```

---

### **hybridNLPProcessor.ts**

#### **Main Methods**

```typescript
class HybridNLPProcessor {
  // NLP processing
  async processQuery(query: string): Promise<NLPResult>
  async extractEntities(text: string): Promise<Entity[]>
  async classifyIntent(text: string): Promise<IntentClassification>
  
  // Language detection
  detectLanguage(text: string): LanguageDetection
  
  // Initialization
  async initialize(): Promise<void>
}
```

#### **NLP Interfaces**

```typescript
interface NLPResult {
  intent: IntentClassification;
  entities: Entity[];
  sentiment: SentimentAnalysis;
  language: LanguageDetection;
  confidence: number;
}

interface IntentClassification {
  intent: string;
  confidence: number;
  subIntents?: string[];
}

interface Entity {
  text: string;
  type: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}
```

## 🗣️ Language Processing APIs

### **indonesianNLP.ts**

#### **Main Methods**

```typescript
class IndonesianNLP {
  // Text processing
  async processText(text: string): Promise<ProcessedText>
  async tokenize(text: string): Promise<Token[]>
  
  // Language understanding
  async extractMeaning(text: string): Promise<SemanticAnalysis>
  async detectFormality(text: string): Promise<FormalityLevel>
  
  // Cultural context
  async analyzeCulturalContext(text: string): Promise<CulturalContext>
  
  // Query enhancement
  async enhanceQuery(query: string): Promise<EnhancedQuery>
}
```

#### **Indonesian NLP Interfaces**

```typescript
interface ProcessedText {
  originalText: string;
  normalizedText: string;
  tokens: Token[];
  pos: POSTag[];
  sentiment: SentimentScore;
}

interface SemanticAnalysis {
  mainConcepts: Concept[];
  relationships: Relationship[];
  abstractness: number;
  complexity: number;
}

interface CulturalContext {
  formalityLevel: 'formal' | 'informal' | 'mixed';
  regionalVariant?: string;
  culturalMarkers: string[];
  appropriateness: number;
}
```

---

### **enhancedQueryIntelligence.ts**

#### **Main Methods**

```typescript
class EnhancedQueryIntelligence {
  // Query processing
  async processQuery(query: string): Promise<QueryResult>
  async analyzeIntent(query: string): Promise<IntentAnalysis>
  
  // Query enhancement
  async generateSuggestions(query: string): Promise<string[]>
  async generateFollowUps(query: string): Promise<string[]>
  
  // Context management
  async updateContext(context: QueryContext): Promise<void>
  getContext(): QueryContext
}
```

#### **Query Intelligence Interfaces**

```typescript
interface QueryResult {
  processedQuery: string;
  intent: IntentAnalysis;
  entities: ExtractedEntity[];
  suggestions: string[];
  followUps: string[];
  confidence: number;
}

interface IntentAnalysis {
  primaryIntent: string;
  secondaryIntents: string[];
  confidence: number;
  parameters: IntentParameter[];
}
```

## 📊 Data & Schema APIs

### **schemaIntelligence.ts**

#### **Main Methods**

```typescript
class SchemaIntelligence {
  // Schema analysis
  async analyzeSchema(): Promise<SchemaAnalysis>
  async getTableRelationships(): Promise<TableRelationship[]>
  
  // Query optimization
  async optimizeQuery(query: string): Promise<OptimizedQuery>
  async suggestIndexes(): Promise<IndexSuggestion[]>
  
  // Performance insights
  async getPerformanceInsights(): Promise<PerformanceInsight[]>
}
```

#### **Schema Interfaces**

```typescript
interface SchemaAnalysis {
  tables: TableSchema[];
  relationships: TableRelationship[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  statistics: SchemaStatistics;
}

interface TableRelationship {
  fromTable: string;
  toTable: string;
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
  strength: number;
}
```

---

### **databaseTools.ts**

#### **Main Methods**

```typescript
class DatabaseTools {
  // Query building
  buildQuery(intent: QueryIntent): string
  buildSearchQuery(searchParams: SearchParameters): string
  
  // Data transformation
  transformResults(results: any[], format: OutputFormat): any
  aggregateData(data: any[], aggregationType: AggregationType): any
  
  // Performance optimization
  optimizeQuery(query: string): OptimizedQuery
  analyzeQueryPerformance(query: string): PerformanceAnalysis
}
```

## 🛠️ Infrastructure APIs

### **cacheService.ts**

#### **Main Methods**

```typescript
class CacheService {
  // Cache operations
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async delete(key: string): Promise<void>
  async clear(): Promise<void>
  
  // Cache management
  getStats(): CacheStats
  optimize(): Promise<void>
}
```

#### **Cache Interfaces**

```typescript
interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  memoryUsage: number;
  itemCount: number;
}
```

---

### **performanceMonitor.ts**

#### **Main Methods**

```typescript
class PerformanceMonitor {
  // Monitoring
  startTimer(operation: string): string
  endTimer(timerId: string): number
  
  // Metrics
  getMetrics(): PerformanceMetrics
  getAverageResponseTime(): number
  
  // Reporting
  generateReport(): PerformanceReport
}
```

#### **Performance Interfaces**

```typescript
interface PerformanceMetrics {
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  throughput: number;
  memoryUsage: MemoryUsage;
}

interface PerformanceReport {
  summary: PerformanceMetrics;
  trends: TrendData[];
  recommendations: string[];
  alerts: Alert[];
}
```

## 🔧 Configuration Interfaces

### **Global Configuration**

```typescript
interface ChatbotConfig {
  ai: {
    enableTensorFlow: boolean;
    modelPath: string;
    fallbackToBasic: boolean;
    maxProcessingTime: number;
  };
  cache: {
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'fifo';
  };
  performance: {
    enableMonitoring: boolean;
    sampleRate: number;
    alertThresholds: AlertThresholds;
  };
}
```

### **Error Handling**

```typescript
interface ChatbotError {
  code: string;
  message: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: any;
}
```

---

**API Version**: 3.0  
**Last Updated**: 2025-01-26  
**Compatibility**: TypeScript 5.0+, Node.js 18+  
**Status**: ✅ Production Ready

---
type: "always_apply"
---

# SELLY-Specific Migration Patterns and Rules

**Rule Category**: SELLY Migration Patterns  
**Priority**: Critical  
**Scope**: SELLY AI system migrations  
**Enforcement**: Mandatory for all SELLY-specific migrations  

## Rule 1: SELLY AI Service Migration Patterns

### **1.1 Multi-Provider AI Architecture Migration**
```typescript
// BEFORE: SELLY Next.js AI Provider System
// /frontend/src/services/chatbot/core/UnifiedAIService.ts
export class UnifiedAIService {
  private providers: Map<string, AIProvider> = new Map();
  
  async processQuery(query: string, context?: any): Promise<AIResponse> {
    const provider = this.selectBestProvider(query, context);
    return await this.providers.get(provider).process(query, context);
  }
  
  private selectBestProvider(query: string, context?: any): string {
    if (context?.enhancementMode) return 'enhanced';
    if (this.isIndonesianQuery(query)) return 'huggingface';
    return 'basic';
  }
}
```

```go
// AFTER: SELLY Go AI Service
// /backend/internal/services/ai/unified_service.go
type UnifiedAIService struct {
    providers       map[string]AIProvider
    providerSelector *ProviderSelector
    fallbackChain   []string
    performanceMonitor *PerformanceMonitor
    cache           *IntelligentCache
}

func (uas *UnifiedAIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    // Enhanced provider selection with performance metrics
    providerName := uas.providerSelector.SelectOptimalProvider(req)
    
    // Try primary provider
    provider := uas.providers[providerName]
    response, err := uas.processWithProvider(ctx, provider, req)
    if err == nil {
        return response, nil
    }
    
    // Fallback chain with intelligent selection
    for _, fallbackProvider := range uas.fallbackChain {
        if fallbackProvider == providerName {
            continue // Skip already tried provider
        }
        
        provider = uas.providers[fallbackProvider]
        if response, err = uas.processWithProvider(ctx, provider, req); err == nil {
            uas.performanceMonitor.RecordFallback(providerName, fallbackProvider)
            return response, nil
        }
    }
    
    return nil, fmt.Errorf("all providers failed: %w", err)
}
```

### **1.2 Indonesian NLP Processing Migration**
```typescript
// BEFORE: SELLY Indonesian NLP
// /frontend/src/services/ai/advancedIndonesianNLP.ts
export class AdvancedIndonesianNLP {
  async analyzeIndonesianText(text: string, options?: NLPOptions): Promise<IndonesianTextAnalysis> {
    const [morphological, syntactic, semantic, administrative] = await Promise.all([
      this.performMorphologicalAnalysis(text),
      this.performSyntacticAnalysis(text),
      this.performSemanticAnalysis(text),
      this.classifyAdministrativeContent(text)
    ]);
    
    return {
      morphological,
      syntactic,
      semantic,
      administrative,
      confidence: this.calculateOverallConfidence(morphological, syntactic, semantic)
    };
  }
}
```

```go
// AFTER: SELLY Go Indonesian NLP Service
// /backend/internal/services/nlp/indonesian_service.go
type IndonesianNLPService struct {
    morphologyAnalyzer  *MorphologyAnalyzer
    syntaxAnalyzer      *SyntaxAnalyzer
    semanticAnalyzer    *SemanticAnalyzer
    adminClassifier     *AdministrativeClassifier
    culturalProcessor   *CulturalContextProcessor
    cache              *NLPCache
    performanceMonitor *NLPPerformanceMonitor
}

func (inlp *IndonesianNLPService) AnalyzeIndonesianText(
    ctx context.Context, 
    text string, 
    options *NLPOptions,
) (*IndonesianTextAnalysis, error) {
    // Check cache first for performance
    if cached := inlp.cache.Get(text, options); cached != nil {
        return cached, nil
    }
    
    // Parallel processing for performance optimization
    var wg sync.WaitGroup
    results := make(chan AnalysisResult, 4)
    
    // Morphological analysis
    wg.Add(1)
    go func() {
        defer wg.Done()
        result := inlp.morphologyAnalyzer.Analyze(text)
        results <- AnalysisResult{Type: "morphological", Data: result}
    }()
    
    // Syntactic analysis
    wg.Add(1)
    go func() {
        defer wg.Done()
        result := inlp.syntaxAnalyzer.Analyze(text)
        results <- AnalysisResult{Type: "syntactic", Data: result}
    }()
    
    // Semantic analysis
    wg.Add(1)
    go func() {
        defer wg.Done()
        result := inlp.semanticAnalyzer.Analyze(text)
        results <- AnalysisResult{Type: "semantic", Data: result}
    }()
    
    // Administrative classification
    wg.Add(1)
    go func() {
        defer wg.Done()
        result := inlp.adminClassifier.Classify(text)
        results <- AnalysisResult{Type: "administrative", Data: result}
    }()
    
    // Collect results
    go func() {
        wg.Wait()
        close(results)
    }()
    
    analysis := &IndonesianTextAnalysis{
        OriginalText: text,
        ProcessingTime: time.Now(),
    }
    
    for result := range results {
        switch result.Type {
        case "morphological":
            analysis.Morphological = result.Data.(MorphologicalResult)
        case "syntactic":
            analysis.Syntactic = result.Data.(SyntacticResult)
        case "semantic":
            analysis.Semantic = result.Data.(SemanticResult)
        case "administrative":
            analysis.Administrative = result.Data.(AdministrativeClassification)
        }
    }
    
    analysis.Confidence = inlp.calculateOverallConfidence(analysis)
    analysis.ProcessingTime = time.Since(analysis.ProcessingTime)
    
    // Cache result for future use
    inlp.cache.Set(text, options, analysis)
    
    return analysis, nil
}
```

## Rule 2: SELLY Training Data Migration

### **2.1 Training Data Collection Migration**
```typescript
// BEFORE: SELLY Training Data Collector
// /frontend/src/services/chatbot/trainingDataCollector.ts
export class TrainingDataCollector {
  async logUnansweredQuery(
    query: string,
    serviceType: string,
    context: UserContext
  ): Promise<void> {
    const unansweredQuery: UnansweredQuery = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId: context.userId || 'anonymous',
      query: query.trim(),
      detectedServiceType: serviceType,
      conversationContext: context.conversationContext,
      priority: this.calculatePriority(query, serviceType)
    };
    
    this.unansweredQueries.push(unansweredQuery);
    await this.saveToFile();
  }
}
```

```go
// AFTER: SELLY Go Training Service
// /backend/internal/services/training/collector.go
type TrainingDataCollector struct {
    db              *database.Service
    cache           *cache.Service
    analyzer        *QueryAnalyzer
    classifier      *ServiceClassifier
    priorityEngine  *PriorityEngine
    batchProcessor  *BatchProcessor
}

func (tdc *TrainingDataCollector) LogUnansweredQuery(
    ctx context.Context,
    query string,
    serviceType string,
    userContext *UserContext,
) error {
    // Real-time query analysis
    analysis := tdc.analyzer.AnalyzeQuery(query)
    classification := tdc.classifier.ClassifyService(query, serviceType)
    priority := tdc.priorityEngine.CalculatePriority(query, serviceType, userContext)
    
    trainingData := &TrainingData{
        ID:                uuid.New().String(),
        Timestamp:         time.Now(),
        UserID:           userContext.UserID,
        Query:            strings.TrimSpace(query),
        DetectedServiceType: serviceType,
        ConversationContext: userContext.ConversationContext,
        Priority:         priority,
        Analysis:         analysis,
        Classification:   classification,
        Status:          TrainingStatusPending,
    }
    
    // Batch processing for performance
    if err := tdc.batchProcessor.AddToBatch(trainingData); err != nil {
        // Fallback to immediate processing
        return tdc.db.InsertTrainingData(ctx, trainingData)
    }
    
    // Cache for immediate access
    tdc.cache.SetTrainingData(trainingData.ID, trainingData, 1*time.Hour)
    
    return nil
}
```

### **2.2 Continuous Learning Migration**
```typescript
// BEFORE: SELLY Continuous Learning Engine
// /frontend/src/services/ai/continuousLearningEngine.ts
export class ContinuousLearningEngine {
  async startLearningSession(
    modelType: string,
    targetAccuracy: number
  ): Promise<LearningSession> {
    const trainingData = await this.getTrainingData(modelType);
    const session = this.createLearningSession(modelType, targetAccuracy, trainingData);
    
    // Start training process
    this.executeLearningProcess(session);
    
    return session;
  }
}
```

```go
// AFTER: SELLY Go Continuous Learning Service
// /backend/internal/services/learning/engine.go
type ContinuousLearningEngine struct {
    trainingService    *TrainingService
    modelManager       *ModelManager
    learningScheduler  *LearningScheduler
    performanceTracker *PerformanceTracker
    validationEngine   *ValidationEngine
    resourceManager    *ResourceManager
}

func (cle *ContinuousLearningEngine) StartLearningSession(
    ctx context.Context,
    modelType string,
    targetAccuracy float64,
) (*LearningSession, error) {
    // Resource allocation check
    if !cle.resourceManager.CanStartLearningSession() {
        return nil, ErrInsufficientResources
    }
    
    // Get training data with intelligent sampling
    trainingData, err := cle.trainingService.GetOptimizedTrainingData(ctx, &TrainingDataRequest{
        ModelType:    modelType,
        MinQuality:   0.8,
        MaxSamples:   10000,
        Balanced:     true,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to get training data: %w", err)
    }
    
    // Create learning session with resource allocation
    session := &LearningSession{
        ID:              uuid.New().String(),
        ModelType:       modelType,
        TargetAccuracy:  targetAccuracy,
        Status:          LearningStatusInitializing,
        StartTime:       time.Now(),
        TrainingData:    trainingData.Data,
        ValidationData:  trainingData.ValidationData,
        ResourceAllocation: cle.resourceManager.AllocateResources(modelType),
    }
    
    // Start learning process asynchronously with monitoring
    go func() {
        defer cle.resourceManager.ReleaseResources(session.ResourceAllocation)
        
        if err := cle.executeLearningProcess(ctx, session); err != nil {
            logrus.WithError(err).Error("Learning process failed")
            session.Status = LearningStatusFailed
            session.Error = err.Error()
        }
    }()
    
    return session, nil
}
```

## Rule 3: SELLY Session Management Migration

### **3.1 Session-Aware AI Processing**
```typescript
// BEFORE: SELLY Session-Aware AI
// /frontend/src/services/session/sessionAwareKnowledgeService.ts
export class SessionAwareKnowledgeService {
  async getContextualResponse(
    query: string,
    sessionId: string
  ): Promise<ContextualKnowledgeResponse> {
    const sessionData = await this.sessionManager.getSession(sessionId);
    const contextualFactors = this.buildContextualFactors(sessionData, query);
    const baseKnowledge = await this.knowledgeBase.getServiceInfo(query);
    
    return this.enhanceWithSessionContext(
      baseKnowledge,
      sessionData,
      query,
      contextualFactors
    );
  }
}
```

```go
// AFTER: SELLY Go Session-Aware Service
// /backend/internal/services/session/aware_service.go
type SessionAwareAIService struct {
    aiService          *ai.UnifiedAIService
    sessionManager     *SessionManager
    contextBuilder     *ConversationContextBuilder
    knowledgeService   *KnowledgeService
    personalizationEngine *PersonalizationEngine
    cache              *SessionCache
}

func (saas *SessionAwareAIService) GetContextualResponse(
    ctx context.Context,
    query string,
    sessionID string,
) (*ContextualKnowledgeResponse, error) {
    // Get session with caching
    session, err := saas.sessionManager.GetSessionWithCache(ctx, sessionID)
    if err != nil {
        return nil, fmt.Errorf("failed to get session: %w", err)
    }
    
    // Build contextual factors with performance optimization
    contextualFactors := saas.contextBuilder.BuildContextualFactors(session, query)
    
    // Parallel processing for performance
    var wg sync.WaitGroup
    var baseKnowledge interface{}
    var personalization *PersonalizationData
    var knowledgeErr, personalizationErr error
    
    // Get base knowledge
    wg.Add(1)
    go func() {
        defer wg.Done()
        baseKnowledge, knowledgeErr = saas.knowledgeService.GetServiceInfo(ctx, query)
    }()
    
    // Get personalization data
    wg.Add(1)
    go func() {
        defer wg.Done()
        personalization, personalizationErr = saas.personalizationEngine.GetPersonalization(
            ctx, session.UserID, contextualFactors)
    }()
    
    wg.Wait()
    
    if knowledgeErr != nil {
        return nil, fmt.Errorf("failed to get base knowledge: %w", knowledgeErr)
    }
    
    // Enhance with session context and personalization
    response := saas.enhanceWithSessionContext(
        baseKnowledge,
        session,
        query,
        contextualFactors,
        personalization,
    )
    
    // Update session context asynchronously
    go saas.updateSessionContext(ctx, session, query, response)
    
    return response, nil
}
```

## Rule 4: SELLY Performance Optimization Patterns

### **4.1 Intelligent Caching Migration**
```typescript
// BEFORE: SELLY Frontend Caching
// /frontend/src/services/cache/documentPatternCache.ts
export class DocumentPatternCache {
  async cacheDocumentResponse(
    query: string,
    response: string,
    confidence: number,
    sessionId?: string
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(query, sessionId);
    const cacheEntry = {
      response,
      confidence,
      timestamp: Date.now(),
      sessionId
    };
    
    await this.redis.setex(cacheKey, 3600, JSON.stringify(cacheEntry));
  }
}
```

```go
// AFTER: SELLY Go Intelligent Cache
// /backend/internal/services/cache/intelligent_cache.go
type IntelligentCache struct {
    l1Cache         *fastcache.Cache      // Ultra-fast memory cache
    l2Cache         *redis.Client         // Distributed cache
    l3Cache         *database.Service     // Persistent cache
    bloomFilter     *bloom.BloomFilter    // Fast negative lookups
    cacheAnalyzer   *CacheAnalyzer        // Usage pattern analysis
    prefetchEngine  *PrefetchEngine       // Predictive prefetching
}

func (ic *IntelligentCache) CacheDocumentResponse(
    ctx context.Context,
    query string,
    response string,
    confidence float64,
    sessionID string,
) error {
    cacheKey := ic.buildIntelligentCacheKey(query, sessionID)
    
    cacheEntry := &CacheEntry{
        Response:    response,
        Confidence:  confidence,
        Timestamp:   time.Now(),
        SessionID:   sessionID,
        AccessCount: 1,
        Quality:     ic.calculateCacheQuality(response, confidence),
    }
    
    // Multi-level caching strategy
    ttl := ic.calculateIntelligentTTL(cacheEntry)
    
    // L1 Cache (Memory) - Ultra fast access
    ic.l1Cache.Set([]byte(cacheKey), ic.serializeCacheEntry(cacheEntry))
    
    // L2 Cache (Redis) - Distributed access
    go func() {
        if err := ic.l2Cache.SetEX(ctx, cacheKey, cacheEntry, ttl).Err(); err != nil {
            logrus.WithError(err).Error("Failed to cache in L2")
        }
    }()
    
    // L3 Cache (Database) - Persistent storage for high-value entries
    if cacheEntry.Quality > 0.8 {
        go func() {
            if err := ic.l3Cache.InsertCacheEntry(ctx, cacheEntry); err != nil {
                logrus.WithError(err).Error("Failed to cache in L3")
            }
        }()
    }
    
    // Update bloom filter
    ic.bloomFilter.Add([]byte(cacheKey))
    
    // Analyze for prefetching opportunities
    ic.cacheAnalyzer.AnalyzeAccessPattern(query, sessionID, cacheEntry)
    
    // Trigger intelligent prefetching if pattern detected
    if ic.cacheAnalyzer.ShouldPrefetch(query, sessionID) {
        go ic.prefetchEngine.PrefetchRelatedQueries(query, sessionID)
    }
    
    return nil
}
```

**These SELLY-specific migration patterns ensure that the unique characteristics and requirements of the SELLY AI system are properly addressed during the Next.js to Go migration process.**

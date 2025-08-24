# Phase 1: Core AI Infrastructure Implementation

**Document**: Phase 1 - Core AI Infrastructure Migration  
**Project Date**: 2025-08-20  
**Created**: 2025-08-20  
**Version**: 1.0  
**Status**: 🚀 Ready  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team  

## Phase 1 Overview

**Duration**: 2 weeks (10 working days)  
**Goal**: Establish core AI infrastructure in Go backend with training data collection and basic AI processing  
**Target Performance**: 2x improvement over frontend AI processing  

## 📋 Implementation Timeline

### **Week 1: Training Data Infrastructure**

#### **Day 1-2: Training Data Service Foundation**
```go
// Training data service structure
type TrainingService struct {
    db          *database.Service
    cache       *cache.Service
    validator   *TrainingDataValidator
    collector   *DataCollector
    analyzer    *QueryAnalyzer
}

// Core training data types
type TrainingData struct {
    ID              string                 `json:"id" db:"id"`
    Query           string                 `json:"query" db:"query"`
    Response        string                 `json:"response" db:"response"`
    UserID          string                 `json:"user_id" db:"user_id"`
    SessionID       string                 `json:"session_id" db:"session_id"`
    Timestamp       time.Time              `json:"timestamp" db:"timestamp"`
    Classification  QueryClassification    `json:"classification" db:"classification"`
    Metadata        TrainingMetadata       `json:"metadata" db:"metadata"`
    Quality         QualityMetrics         `json:"quality" db:"quality"`
    Status          TrainingStatus         `json:"status" db:"status"`
}

type QueryClassification struct {
    ServiceType    string  `json:"service_type"`
    Intent         string  `json:"intent"`
    Confidence     float64 `json:"confidence"`
    Complexity     string  `json:"complexity"`
    Priority       int     `json:"priority"`
}

type TrainingMetadata struct {
    ProcessingTime    float64           `json:"processing_time"`
    EnhancementMode   bool              `json:"enhancement_mode"`
    ProviderUsed      string            `json:"provider_used"`
    ContextLayers     []string          `json:"context_layers"`
    UserFeedback      *UserFeedback     `json:"user_feedback,omitempty"`
    SemanticAnalysis  *SemanticData     `json:"semantic_analysis,omitempty"`
}
```

#### **Day 3-4: Database Schema and API Endpoints**
```sql
-- Training data tables
CREATE TABLE training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    classification JSONB NOT NULL,
    metadata JSONB NOT NULL,
    quality JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    conversation_data JSONB NOT NULL,
    analytics JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_queries INTEGER DEFAULT 0,
    successful_responses INTEGER DEFAULT 0,
    failed_responses INTEGER DEFAULT 0,
    average_quality_score DECIMAL(3,2),
    top_service_types JSONB,
    improvement_suggestions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

```go
// API endpoints implementation
func (h *TrainingHandler) RegisterRoutes(r *gin.RouterGroup) {
    training := r.Group("/training-data")
    {
        training.POST("", h.SubmitTrainingData)           // Submit training data
        training.GET("", h.GetTrainingData)               // Retrieve training data
        training.POST("/enhanced", h.SubmitEnhancedData)  // Submit enhanced training data
        training.GET("/enhanced", h.GetEnhancedData)      // Retrieve enhanced training data
        training.GET("/stats", h.GetTrainingStats)        // Training statistics
        training.GET("/suggestions", h.GetTrainingSuggestions) // Training suggestions
    }
}
```

#### **Day 5: Real AI Provider Integration**
```go
// Real AI providers implementation
type GroqProvider struct {
    apiKey     string
    model      string
    timeout    time.Duration
    client     *http.Client
    rateLimiter *rate.Limiter
}

func (g *GroqProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    // Real Groq API integration
    payload := GroqRequest{
        Model: g.model,
        Messages: []GroqMessage{
            {
                Role:    "system",
                Content: g.buildSystemPrompt(req),
            },
            {
                Role:    "user", 
                Content: req.Query,
            },
        },
        Temperature: 0.7,
        MaxTokens:   1000,
    }
    
    response, err := g.callGroqAPI(ctx, payload)
    if err != nil {
        return nil, fmt.Errorf("groq API call failed: %w", err)
    }
    
    return &AIResponse{
        Content:         response.Choices[0].Message.Content,
        Provider:        "groq",
        Confidence:      0.9,
        ProcessingTime:  time.Since(startTime).Milliseconds(),
        TokensUsed:      response.Usage.TotalTokens,
    }, nil
}

type HuggingFaceProvider struct {
    apiKey     string
    models     map[string]string // Indonesian models
    timeout    time.Duration
    client     *http.Client
}

func (h *HuggingFaceProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    // Indonesian-optimized processing
    model := h.selectIndonesianModel(req.Query)
    
    payload := HuggingFaceRequest{
        Inputs: h.prepareIndonesianPrompt(req.Query, req.Context),
        Parameters: HuggingFaceParams{
            Temperature:    0.7,
            MaxNewTokens:   500,
            DoSample:       true,
            TopP:          0.9,
        },
    }
    
    response, err := h.callHuggingFaceAPI(ctx, model, payload)
    if err != nil {
        return nil, fmt.Errorf("huggingface API call failed: %w", err)
    }
    
    return &AIResponse{
        Content:         h.postProcessIndonesianResponse(response.GeneratedText),
        Provider:        "huggingface",
        Model:          model,
        Confidence:     h.calculateConfidence(response),
        ProcessingTime: time.Since(startTime).Milliseconds(),
    }, nil
}
```

### **Week 2: AI Processing and Integration**

#### **Day 6-7: Multi-Provider AI Service**
```go
// Enhanced AI service with real providers
type AIService struct {
    providers    map[string]AIProvider
    fallback     AIProvider
    monitor      *PerformanceMonitor
    trainingService *TrainingService
    cache        *cache.Service
}

func (s *AIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    startTime := time.Now()
    
    // Select best provider based on query analysis
    providerName := s.selectOptimalProvider(req)
    provider := s.providers[providerName]
    
    // Process with selected provider
    response, err := provider.ProcessQuery(ctx, req)
    if err != nil {
        // Fallback to next best provider
        response, err = s.processWithFallback(ctx, req, providerName)
        if err != nil {
            return nil, fmt.Errorf("all providers failed: %w", err)
        }
    }
    
    // Collect training data asynchronously
    go s.collectTrainingData(req, response)
    
    // Update performance metrics
    s.monitor.RecordAIOperation(providerName, time.Since(startTime), err == nil)
    
    return response, nil
}

func (s *AIService) selectOptimalProvider(req *AIRequest) string {
    // Intelligent provider selection based on:
    // 1. Query complexity
    // 2. Enhancement mode
    // 3. Provider health status
    // 4. Historical performance
    
    if req.EnhancementMode {
        return "groq" // Best for complex queries
    }
    
    if s.isIndonesianQuery(req.Query) {
        return "huggingface" // Best for Indonesian processing
    }
    
    return "groq" // Default to most reliable
}
```

#### **Day 8-9: Performance Monitoring and Caching**
```go
// AI-specific performance monitoring
type AIPerformanceMonitor struct {
    metrics     *prometheus.Registry
    aiLatency   *prometheus.HistogramVec
    aiErrors    *prometheus.CounterVec
    aiThroughput *prometheus.CounterVec
    providerHealth *prometheus.GaugeVec
}

func (m *AIPerformanceMonitor) RecordAIOperation(provider string, duration time.Duration, success bool) {
    m.aiLatency.WithLabelValues(provider).Observe(duration.Seconds())
    m.aiThroughput.WithLabelValues(provider, fmt.Sprintf("%t", success)).Inc()
    
    if !success {
        m.aiErrors.WithLabelValues(provider).Inc()
    }
}

// Intelligent AI response caching
type AICache struct {
    redis       *redis.Client
    memory      *cache.MemoryCache
    ttl         time.Duration
    keyBuilder  *CacheKeyBuilder
}

func (c *AICache) GetCachedResponse(query string, context *AIContext) (*AIResponse, bool) {
    key := c.keyBuilder.BuildAIKey(query, context)
    
    // Try memory cache first (fastest)
    if response, found := c.memory.Get(key); found {
        return response.(*AIResponse), true
    }
    
    // Try Redis cache (persistent)
    if response, err := c.getFromRedis(key); err == nil {
        // Warm memory cache
        c.memory.Set(key, response, c.ttl)
        return response, true
    }
    
    return nil, false
}

func (c *AICache) CacheResponse(query string, context *AIContext, response *AIResponse) {
    key := c.keyBuilder.BuildAIKey(query, context)
    
    // Cache in both memory and Redis
    c.memory.Set(key, response, c.ttl)
    c.cacheInRedis(key, response, c.ttl)
}
```

#### **Day 10: Integration Testing and Validation**
```go
// Comprehensive AI system testing
func TestAISystemIntegration(t *testing.T) {
    // Test training data collection
    t.Run("TrainingDataCollection", func(t *testing.T) {
        req := &AIRequest{
            Query:     "Bagaimana cara mengurus KTP yang hilang?",
            UserID:    "test-user",
            SessionID: "test-session",
        }
        
        response, err := aiService.ProcessQuery(context.Background(), req)
        assert.NoError(t, err)
        assert.NotEmpty(t, response.Content)
        
        // Verify training data was collected
        time.Sleep(100 * time.Millisecond) // Allow async collection
        trainingData, err := trainingService.GetTrainingData(context.Background(), &TrainingDataRequest{
            UserID: "test-user",
            Limit:  1,
        })
        assert.NoError(t, err)
        assert.Len(t, trainingData.Data, 1)
    })
    
    // Test provider fallback
    t.Run("ProviderFallback", func(t *testing.T) {
        // Simulate provider failure
        aiService.providers["groq"] = &FailingProvider{}
        
        response, err := aiService.ProcessQuery(context.Background(), &AIRequest{
            Query: "Test query",
        })
        assert.NoError(t, err)
        assert.Equal(t, "huggingface", response.Provider)
    })
    
    // Test performance requirements
    t.Run("PerformanceRequirements", func(t *testing.T) {
        start := time.Now()
        response, err := aiService.ProcessQuery(context.Background(), &AIRequest{
            Query: "Simple test query",
        })
        duration := time.Since(start)
        
        assert.NoError(t, err)
        assert.Less(t, duration, 200*time.Millisecond) // 2x improvement target
        assert.NotEmpty(t, response.Content)
    })
}
```

## 📊 Phase 1 Success Metrics

### **Performance Targets**
- **AI Response Time**: < 200ms (vs 400-800ms frontend)
- **Training Data Collection**: < 50ms overhead
- **Memory Usage**: < 100MB (vs 200MB frontend)
- **Concurrent Requests**: 200+ (vs 100 frontend)

### **Functional Requirements**
- [ ] Training data collection system operational
- [ ] Real AI providers (Groq, HuggingFace) integrated
- [ ] Multi-provider fallback system working
- [ ] Performance monitoring dashboard functional
- [ ] API endpoints fully implemented and tested

### **Quality Gates**
- [ ] 95%+ API endpoint test coverage
- [ ] All integration tests passing
- [ ] Performance benchmarks met
- [ ] Training data collection validated
- [ ] Provider health monitoring operational

## 🔧 Technical Deliverables

1. **Training Data Service** - Complete implementation with database schema
2. **AI Provider Integration** - Real Groq and HuggingFace API integration
3. **Multi-Provider AI Service** - Intelligent provider selection and fallback
4. **Performance Monitoring** - AI-specific metrics and dashboards
5. **API Endpoints** - All 4 training data endpoints implemented
6. **Integration Tests** - Comprehensive test suite with performance validation

## 📋 Next Phase Preparation

Phase 1 establishes the foundation for Phase 2 advanced features:
- Training data collection system ready for continuous learning
- AI provider architecture ready for Indonesian NLP integration
- Performance monitoring ready for advanced analytics
- Database schema ready for session-aware processing

**Phase 2 will build upon this foundation to implement advanced AI features and achieve 5x performance improvements.**

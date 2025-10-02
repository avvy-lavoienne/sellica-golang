# SELLY AI Service Integration Reference

**Document**: AI Service Integration Patterns
**Project Date**: 2025-08-28
**Created**: 2025-08-28
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team

## AI Provider Architecture

### Multi-Provider Orchestration

The SELLY AI backend implements a sophisticated multi-provider AI system with intelligent routing, fallback mechanisms, and performance optimization.

**File**: `backend/internal/services/chat/ai_service.go`

```go
type AIService struct {
    providers              map[string]AIProvider
    fallback               AIProvider
    variationEngine        *ResponseVariationEngine
    providerSelector       *EnhancedProviderSelector
    variationEnabled       bool
    enhancedSelectionEnabled bool
}
```

### Provider Interface

All AI providers implement the standardized `AIProvider` interface:

```go
type AIProvider interface {
    ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error)
    GetProviderName() string
    IsHealthy() bool
}
```

## Provider Types

### 1. Enhanced AI Provider

**Purpose**: Advanced Indonesian government service processing with cultural context.

**Characteristics**:
- **Response Type**: `administrative`
- **Confidence**: 0.92
- **Model**: "Enhanced Indonesian AI (Go)"
- **Processing Time**: ~100ms
- **Cache Layer**: `enhanced`

**Implementation**:
```go
func (p *EnhancedAIProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    // Simulate enhanced processing time
    time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)
    
    response := p.generateEnhancedResponse(req.Query, req.Context)
    
    return &AIResponse{
        Content:    response,
        Type:       "administrative",
        Confidence: 0.92,
        Model:      "Enhanced Indonesian AI (Go)",
        CacheHit:   false,
        CacheLayer: "enhanced",
    }, nil
}
```

### 2. Simple AI Provider

**Purpose**: Fast responses for basic queries and fallback scenarios.

**Characteristics**:
- **Response Type**: `text`
- **Confidence**: 0.85
- **Model**: "Simple Response Service (Go)"
- **Processing Time**: ~50ms
- **Cache Layer**: `none`

### 3. Groq SELLY Provider

**Purpose**: High-performance AI processing with Groq integration.

**Features**:
- External API integration
- Advanced query processing
- Performance optimization
- Error handling and retry logic

**Adapter Pattern**:
```go
type GroqSELLYProviderAdapter struct {
    provider providers.GroqSELLYProvider
}

func (a *GroqSELLYProviderAdapter) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    // Convert chat.AIRequest to providers.AIRequest
    providerReq := &providers.AIRequest{
        Query:           req.Query,
        UserID:          req.UserID,
        SessionID:       req.SessionID,
        Context:         req.Context,
        EnhancementMode: req.EnhancementMode,
    }
    
    // Call the SELLY-enhanced provider
    providerResp, err := a.provider.ProcessQuery(ctx, providerReq)
    if err != nil {
        return nil, err
    }
    
    // Convert response back
    return convertProviderResponse(providerResp), nil
}
```

## Provider Selection Logic

### Enhanced Provider Selection

**File**: `backend/internal/services/chat/ai_service.go`

The system uses intelligent provider selection based on query characteristics:

```go
func (s *AIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    var providerName string
    
    if s.enhancedSelectionEnabled {
        // Use enhanced provider selection with ML-based routing
        selectionReq := &ProviderSelectionRequest{
            Query:           req.Query,
            UserContext:     req.Context,
            EnhancementMode: req.EnhancementMode,
        }
        
        selectionResp, err := s.providerSelector.SelectProvider(ctx, selectionReq)
        if err != nil {
            logrus.WithError(err).Warn("Enhanced provider selection failed, using fallback")
            providerName = s.selectBestProvider(req)
        } else {
            providerName = selectionResp.SelectedProvider
            logrus.WithFields(logrus.Fields{
                "selected_provider": providerName,
                "confidence":        selectionResp.Confidence,
                "reasoning":         selectionResp.Reasoning,
                "complexity_level":  selectionResp.QueryComplexity.Level,
            }).Debug("Enhanced provider selection completed")
        }
    } else {
        // Fallback to simple provider selection
        providerName = s.selectBestProvider(req)
    }
    
    provider, exists := s.providers[providerName]
    if !exists || !provider.IsHealthy() {
        logrus.WithField("provider", providerName).Warn("Provider not available, using fallback")
        provider = s.fallback
    }
    
    return provider.ProcessQuery(ctx, req)
}
```

### Simple Provider Selection

```go
func (s *AIService) selectBestProvider(req *AIRequest) string {
    // Use enhanced provider for complex queries or when explicitly requested
    if req.EnhancementMode == "enhanced" || len(req.Query) > 100 {
        return "enhanced"
    }
    
    // Use simple provider for basic queries
    return "simple"
}
```

## Session-Aware Processing

### Session Context Building

```go
func (s *AIService) ProcessSessionQuery(ctx context.Context, req *SessionAIRequest) (*AIResponse, error) {
    // Convert session request to standard AI request
    aiReq := &AIRequest{
        Query:     req.Query,
        UserID:    req.UserID,
        SessionID: req.Session.ID,
        Context:   s.buildSessionContext(req.Session, req.Context),
    }
    
    // Use enhanced provider for session-aware processing
    provider := s.providers["enhanced"]
    if provider == nil || !provider.IsHealthy() {
        provider = s.fallback
    }
    
    return provider.ProcessQuery(ctx, aiReq)
}
```

### Context Enhancement

```go
func (s *AIService) buildSessionContext(session *Session, baseContext map[string]interface{}) map[string]interface{} {
    context := make(map[string]interface{})
    
    // Copy base context
    for k, v := range baseContext {
        context[k] = v
    }
    
    // Add session-specific context
    context["session_id"] = session.ID
    context["conversation_history"] = session.Messages[max(0, len(session.Messages)-5):] // Last 5 messages
    context["user_expertise_level"] = session.UserExpertiseLevel
    context["preferred_language"] = session.PreferredLanguage
    context["service_context"] = session.ServiceContext
    
    return context
}
```

## Response Variation Engine

### Intelligent Response Diversification

```go
type ResponseVariationEngine struct {
    templates    map[string][]string
    usageTracker map[string]int
    enabled      bool
}

func (rve *ResponseVariationEngine) VaryResponse(originalResponse string, context map[string]interface{}) string {
    if !rve.enabled {
        return originalResponse
    }
    
    // Analyze response type and context
    responseType := rve.analyzeResponseType(originalResponse)
    userLevel := rve.getUserExpertiseLevel(context)
    
    // Apply appropriate variation strategy
    switch responseType {
    case "procedural":
        return rve.varyProceduralResponse(originalResponse, userLevel)
    case "informational":
        return rve.varyInformationalResponse(originalResponse, userLevel)
    default:
        return rve.applyGenericVariation(originalResponse)
    }
}
```

## Concurrent AI Processing

### Integration with Concurrent Service

**File**: `backend/internal/services/chat/concurrent_integration.go`

```go
func (ccs *ConcurrentChatService) ProcessChatWithConcurrency(ctx context.Context, req *ChatRequest, authContext interface{}) (*ChatResponse, error) {
    // Convert to AI request
    aiRequest := &AIRequest{
        Query:           req.Message,
        UserID:          authContext.(*auth.AuthContext).UserID,
        SessionID:       sessionID,
        Context:         req.Context,
        EnhancementMode: req.EnhancementMode,
    }
    
    // Process with concurrent AI manager
    concurrentRequest := convertToConcurrentAIRequest(aiRequest)
    concurrentResponse, err := ccs.concurrentManager.ProcessRequest(ctx, concurrentRequest)
    if err != nil {
        logrus.WithError(err).Warn("Concurrent processing failed, falling back to sequential")
        // Fall back to sequential processing
        return ccs.Service.ProcessChat(ctx, req, authContext.(*auth.AuthContext))
    }
    
    // Convert response back to chat service format
    aiResponse := convertFromConcurrentAIResponse(concurrentResponse)
    
    return &ChatResponse{
        Response:        aiResponse.Content,
        Type:            aiResponse.Type,
        Confidence:      aiResponse.Confidence,
        Model:           aiResponse.Model,
        ProcessingTime:  aiResponse.ProcessingTime,
        CacheHit:        aiResponse.CacheHit,
        SessionID:       sessionID,
    }, nil
}
```

## Performance Monitoring

### AI Service Metrics

```go
type AIServiceMetrics struct {
    TotalRequests     int64
    SuccessfulRequests int64
    FailedRequests    int64
    AverageResponseTime float64
    ProviderUsage     map[string]int64
    CacheHitRate      float64
}
```

### Provider Health Monitoring

```go
func (s *AIService) monitorProviderHealth() {
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            for name, provider := range s.providers {
                if !provider.IsHealthy() {
                    logrus.WithField("provider", name).Warn("Provider health check failed")
                    // Implement recovery logic
                }
            }
        }
    }
}
```

## Error Handling & Fallback

### Graceful Degradation

```go
func (s *AIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    response, err := provider.ProcessQuery(ctx, req)
    if err != nil {
        // Log error and attempt fallback
        logrus.WithError(err).WithField("provider", provider.GetProviderName()).Error("AI processing failed")
        
        // Try fallback provider
        if s.fallback != nil && s.fallback.IsHealthy() {
            return s.fallback.ProcessQuery(ctx, req)
        }
        
        return nil, fmt.Errorf("AI processing failed: %w", err)
    }
    
    return response, nil
}
```

## Configuration

### AI Service Configuration

```go
type AIServiceConfig struct {
    EnableVariation       bool
    EnableEnhancedSelection bool
    FallbackProvider     string
    ProviderTimeout      time.Duration
    MaxRetries          int
    HealthCheckInterval time.Duration
}
```

### Environment Variables

- **AI_ENABLE_VARIATION**: Enable response variation (default: true)
- **AI_ENHANCED_SELECTION**: Enable ML-based provider selection (default: true)
- **AI_PROVIDER_TIMEOUT**: Provider timeout in seconds (default: 30)
- **AI_MAX_RETRIES**: Maximum retry attempts (default: 3)

## Integration Examples

### Basic AI Query Processing

```go
aiService := chat.NewAIService(config)
response, err := aiService.ProcessQuery(ctx, &chat.AIRequest{
    Query:           "Bagaimana cara mengurus akta kelahiran?",
    UserID:          "user123",
    EnhancementMode: "enhanced",
})
```

### Session-Aware Processing

```go
sessionResponse, err := aiService.ProcessSessionQuery(ctx, &chat.SessionAIRequest{
    Query:   "Lanjutkan proses sebelumnya",
    UserID:  "user123",
    Session: currentSession,
    Context: additionalContext,
})
```

This AI service integration provides the foundation for intelligent, scalable, and reliable AI processing in the SELLY backend system.

# SELLY Training Migration - Phase 1: Foundation Setup

**Document**: Phase 1 Foundation Setup - Database & Core Infrastructure
**Project Date**: 2025-08-24
**Created**: 2025-08-24
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team

---

## 📋 **PHASE 1 OVERVIEW**

### **🎯 Objectives**
- Fix Supabase database connection and execute migration scripts
- Establish core SELLY persona infrastructure in Go backend
- Validate training data storage and retrieval systems
- Ensure seamless integration with existing Groq provider

### **⏱️ Timeline: Days 1-3**
- **Day 1**: Database setup and connection resolution
- **Day 2**: Core persona service implementation
- **Day 3**: Integration testing and validation

### **🎯 Success Criteria**
- ✅ Database fully operational with all training tables
- ✅ Core SELLY persona responding with proper identity
- ✅ Training data collection pipeline functional
- ✅ Response times maintained under 100ms

---

## 🗄️ **DAY 1: DATABASE FOUNDATION**

### **Current Status Analysis**
```bash
# Current Issues Identified:
ERRO[2025-08-24] Database connection test failed: database ping failed: (42P01) relation "public.auth.users" does not exist
ERRO[2025-08-24] Redis connection failed: EOF

# Infrastructure Status:
✅ Migration scripts exist: backend/migrations/001_training_data_schema.sql
✅ Supabase configuration present in .env
✅ Go database service implemented
⚠️ Connection configuration needs resolution
```

### **Task 1.1: Supabase Connection Resolution**

#### **Environment Configuration Validation**
```bash
# Verify environment variables
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_SERVICE_ROLE_KEY: $SUPABASE_SERVICE_ROLE_KEY"
echo "SUPABASE_ANON_KEY: $SUPABASE_ANON_KEY"

# Test connection manually
curl -X GET "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

#### **Database Service Enhancement**
```go
// backend/internal/services/database/service.go
func (s *Service) Ping() error {
    if s.client == nil {
        return fmt.Errorf("database client not initialized")
    }

    // Enhanced health check - use a more reliable table
    _, _, err := s.client.From("information_schema.tables").
        Select("table_name", "", false).
        Limit(1, "").
        Execute()
    
    if err != nil {
        s.mu.Lock()
        s.isHealthy = false
        s.mu.Unlock()
        return fmt.Errorf("database ping failed: %w", err)
    }

    s.mu.Lock()
    s.isHealthy = true
    s.mu.Unlock()
    return nil
}
```

### **Task 1.2: Migration Script Execution**

#### **Training Data Schema Deployment**
```sql
-- Execute existing migration: backend/migrations/001_training_data_schema.sql
-- Key tables to be created:
-- ✅ training_data - Core AI training interactions
-- ✅ training_sessions - Session-level conversation data
-- ✅ training_analytics - Daily aggregated analytics
-- ✅ selly_persona_config - SELLY persona configuration
-- ✅ indonesian_cultural_context - Cultural adaptation data
```

#### **Validation Queries**
```sql
-- Verify table creation
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%training%' OR table_name LIKE '%selly%';

-- Test data insertion
INSERT INTO training_data (query, response, classification, metadata, quality)
VALUES (
    'Test query',
    'Test response',
    '{"service_type": "test", "intent": "validation"}',
    '{"processing_time": 50, "provider": "groq"}',
    '{"accuracy": 1.0, "relevance": 1.0}'
);
```

### **Task 1.3: Performance Baseline Establishment**

#### **Database Performance Metrics**
```go
// backend/internal/services/database/metrics.go
type DatabaseMetrics struct {
    ConnectionTime    time.Duration
    QueryTime         time.Duration
    InsertTime        time.Duration
    UpdateTime        time.Duration
    ConnectionPool    int
    ActiveConnections int
}

func (s *Service) GetPerformanceMetrics() *DatabaseMetrics {
    return &DatabaseMetrics{
        ConnectionTime:    s.measureConnectionTime(),
        QueryTime:         s.measureQueryTime(),
        InsertTime:        s.measureInsertTime(),
        UpdateTime:        s.measureUpdateTime(),
        ConnectionPool:    s.pool.maxSize,
        ActiveConnections: len(s.pool.connections),
    }
}
```

#### **Target Performance Benchmarks**
- **Connection Time**: <100ms
- **Query Time**: <50ms
- **Insert Time**: <30ms
- **Concurrent Connections**: 100+
- **Throughput**: 1000+ operations/second

---

## 🤖 **DAY 2: CORE SELLY PERSONA SERVICE**

### **Task 2.1: SELLY Persona Service Implementation**

#### **Core Persona Structure**
```go
// backend/internal/services/persona/selly_persona.go
package persona

import (
    "context"
    "fmt"
    "time"
    "strings"
)

type SELLYPersonaService struct {
    config           *PersonaConfig
    culturalProcessor *IndonesianCulturalProcessor
    greetingManager  *GreetingManager
    responseEnhancer *ResponseEnhancer
    cache           *cache.Service
    db              *database.Service
}

type PersonaConfig struct {
    Identity struct {
        Name        string `json:"name"`        // "SELLY"
        Role        string `json:"role"`        // "AI Agent Specialist Pelayanan Publik"
        Institution string `json:"institution"` // "Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut"
        Developer   string `json:"developer"`   // "VyuApp Technology Solutions"
    } `json:"identity"`
    
    Personality struct {
        Warmth       float64 `json:"warmth"`       // 0.8
        Formality    float64 `json:"formality"`    // 0.6
        Enthusiasm   float64 `json:"enthusiasm"`   // 0.7
        Patience     float64 `json:"patience"`     // 0.9
        Helpfulness  float64 `json:"helpfulness"`  // 0.95
    } `json:"personality"`
    
    CommunicationStyle struct {
        Tone            string   `json:"tone"`             // "formal-friendly"
        AddressStyle    string   `json:"address_style"`    // "adaptive"
        GreetingStyle   string   `json:"greeting_style"`   // "time-based"
        CulturalContext string   `json:"cultural_context"` // "indonesian_government"
        Traits          []string `json:"traits"`           // ["profesional", "empati", "responsif", "budaya-lokal"]
        Values          []string `json:"values"`           // ["integritas", "akuntabilitas", "inovasi", "inklusivitas"]
    } `json:"communication_style"`
}
```

#### **Indonesian Cultural Processor**
```go
// backend/internal/services/persona/cultural_processor.go
type IndonesianCulturalProcessor struct {
    formalityDetector   *FormalityDetector
    addressStyleManager *AddressStyleManager
    governmentTerms     map[string]string
    regionalDialects    map[string][]string
}

type CulturalContext struct {
    FormalityLevel      string   `json:"formality_level"`      // "formal", "semi-formal", "casual"
    PreferredAddress    string   `json:"preferred_address"`    // "bapak_ibu", "kak", "kakak"
    GovernmentContext   bool     `json:"government_context"`   // true for administrative queries
    RegionalIndicators  []string `json:"regional_indicators"`  // Sundanese, Javanese terms
    ReligiousContext    bool     `json:"religious_context"`    // Islamic greetings detected
    TimeContext         string   `json:"time_context"`         // "morning", "afternoon", "evening"
}

func (icp *IndonesianCulturalProcessor) AnalyzeCulturalContext(
    ctx context.Context, 
    query string, 
    userContext *UserContext,
) (*CulturalContext, error) {
    culturalCtx := &CulturalContext{}
    
    // Detect formality level
    culturalCtx.FormalityLevel = icp.formalityDetector.DetectFormality(query)
    
    // Determine preferred address style
    culturalCtx.PreferredAddress = icp.addressStyleManager.DetermineAddressStyle(query, userContext)
    
    // Check for government context
    culturalCtx.GovernmentContext = icp.detectGovernmentContext(query)
    
    // Detect regional dialects
    culturalCtx.RegionalIndicators = icp.detectRegionalDialects(query)
    
    // Check for religious context
    culturalCtx.ReligiousContext = icp.detectReligiousContext(query)
    
    // Determine time context
    culturalCtx.TimeContext = icp.determineTimeContext()
    
    return culturalCtx, nil
}
```

### **Task 2.2: Greeting Management System**
```go
// backend/internal/services/persona/greeting_manager.go
type GreetingManager struct {
    timeBasedGreetings map[string][]string
    contextualGreetings map[string][]string
    culturalGreetings  map[string][]string
}

func (gm *GreetingManager) GenerateGreeting(
    culturalCtx *CulturalContext,
    userCtx *UserContext,
) string {
    var greeting string
    
    // Handle religious greetings
    if culturalCtx.ReligiousContext {
        greeting = "Waalaikumsalam warahmatullahi wabarakatuh. "
    }
    
    // Add time-based greeting
    timeGreeting := gm.getTimeBasedGreeting(culturalCtx.TimeContext, culturalCtx.FormalityLevel)
    greeting += timeGreeting
    
    // Add institutional identity
    if culturalCtx.GovernmentContext || culturalCtx.FormalityLevel == "formal" {
        greeting += " Saya SELLY dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut."
    } else {
        greeting += " Saya SELLY, asisten AI untuk layanan administrasi kependudukan."
    }
    
    // Add service offer
    greeting += " Bagaimana saya bisa membantu Anda hari ini?"
    
    return greeting
}

func (gm *GreetingManager) getTimeBasedGreeting(timeCtx, formality string) string {
    greetings := map[string]map[string]string{
        "morning": {
            "formal":      "Selamat pagi, Bapak/Ibu.",
            "semi-formal": "Selamat pagi!",
            "casual":      "Pagi, kak!",
        },
        "afternoon": {
            "formal":      "Selamat siang, Bapak/Ibu.",
            "semi-formal": "Selamat siang!",
            "casual":      "Siang, kak!",
        },
        "evening": {
            "formal":      "Selamat sore, Bapak/Ibu.",
            "semi-formal": "Selamat sore!",
            "casual":      "Sore, kak!",
        },
    }
    
    if timeGreetings, exists := greetings[timeCtx]; exists {
        if greeting, exists := timeGreetings[formality]; exists {
            return greeting
        }
    }
    
    return "Halo, Bapak/Ibu." // Default fallback
}
```

---

## 🔗 **DAY 3: INTEGRATION & VALIDATION**

### **Task 3.1: Groq Provider Integration**

#### **Enhanced Groq Provider with SELLY Persona**
```go
// backend/internal/services/chat/providers/groq_selly.go
type GroqSELLYProvider struct {
    *GroqProvider
    personaService    *persona.SELLYPersonaService
    trainingCollector *training.DataCollector
    performanceMonitor *monitoring.PerformanceMonitor
}

func (gsp *GroqSELLYProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    startTime := time.Now()
    
    // Step 1: Analyze cultural context
    culturalCtx, err := gsp.personaService.AnalyzeCulturalContext(ctx, req.Query, req.UserContext)
    if err != nil {
        logrus.WithError(err).Warn("Failed to analyze cultural context")
    }
    
    // Step 2: Check if this is a greeting
    if gsp.isGreeting(req.Query) {
        greeting := gsp.personaService.GenerateGreeting(culturalCtx, req.UserContext)
        return &AIResponse{
            Response:   greeting,
            Confidence: 1.0,
            Metadata: map[string]interface{}{
                "persona_applied": true,
                "greeting_type":   "selly_persona",
                "cultural_context": culturalCtx,
            },
        }, nil
    }
    
    // Step 3: Enhance system prompt with SELLY persona
    enhancedReq := gsp.enhanceRequestWithPersona(req, culturalCtx)
    
    // Step 4: Process with Groq
    response, err := gsp.GroqProvider.ProcessQuery(ctx, enhancedReq)
    if err != nil {
        return nil, err
    }
    
    // Step 5: Apply persona enhancement to response
    enhancedResponse := gsp.personaService.EnhanceResponse(response.Response, culturalCtx, req.UserContext)
    response.Response = enhancedResponse
    
    // Step 6: Collect training data asynchronously
    go gsp.collectTrainingData(req, response, culturalCtx)
    
    // Step 7: Record performance metrics
    gsp.performanceMonitor.RecordPersonaProcessing(time.Since(startTime))
    
    return response, nil
}
```

### **Task 3.2: Performance Validation**

#### **Performance Test Suite**
```go
// backend/internal/services/persona/performance_test.go
func TestSELLYPersonaPerformance(t *testing.T) {
    tests := []struct {
        name           string
        query          string
        expectedMaxTime time.Duration
        expectedMinConfidence float64
    }{
        {
            name:           "Simple Greeting",
            query:          "Halo SELLY",
            expectedMaxTime: 50 * time.Millisecond,
            expectedMinConfidence: 1.0,
        },
        {
            name:           "Government Service Query",
            query:          "Bagaimana cara membuat KTP baru?",
            expectedMaxTime: 100 * time.Millisecond,
            expectedMinConfidence: 0.9,
        },
        {
            name:           "Cultural Context Query",
            query:          "Assalamualaikum, saya mau tanya tentang akta kelahiran",
            expectedMaxTime: 120 * time.Millisecond,
            expectedMinConfidence: 0.95,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            startTime := time.Now()
            
            response, err := personaService.ProcessQuery(context.Background(), &AIRequest{
                Query: tt.query,
                UserContext: &UserContext{},
            })
            
            processingTime := time.Since(startTime)
            
            assert.NoError(t, err)
            assert.True(t, processingTime <= tt.expectedMaxTime, 
                "Processing time %v exceeded maximum %v", processingTime, tt.expectedMaxTime)
            assert.True(t, response.Confidence >= tt.expectedMinConfidence,
                "Confidence %v below minimum %v", response.Confidence, tt.expectedMinConfidence)
            assert.Contains(t, response.Response, "SELLY")
        })
    }
}
```

### **Task 3.3: Integration Testing**

#### **End-to-End Integration Test**
```bash
#!/bin/bash
# backend/scripts/test-phase1-integration.sh

echo "🧪 Phase 1 Integration Testing"
echo "================================"

# Test 1: Database Connection
echo "1. Testing database connection..."
curl -s http://localhost:8080/database/health | jq '.healthy'

# Test 2: SELLY Persona Response
echo "2. Testing SELLY persona response..."
curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Halo SELLY"}' | jq '.response'

# Test 3: Cultural Context Processing
echo "3. Testing cultural context..."
curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Assalamualaikum, bagaimana cara membuat KTP?"}' | jq '.response'

# Test 4: Performance Validation
echo "4. Testing performance..."
for i in {1..10}; do
  start_time=$(date +%s%3N)
  curl -s -X POST http://localhost:8080/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Selamat pagi SELLY"}' > /dev/null
  end_time=$(date +%s%3N)
  echo "Request $i: $((end_time - start_time))ms"
done

echo "✅ Phase 1 Integration Testing Complete"
```

---

## 📊 **SUCCESS METRICS & VALIDATION**

### **Performance Targets**
- **Response Time**: <100ms average (Target: 51ms maintained)
- **Database Operations**: <50ms per query
- **Persona Processing**: <20ms additional overhead
- **Memory Usage**: <5MB additional for persona service
- **Concurrent Users**: Support 1000+ simultaneous connections

### **Quality Metrics**
- **Persona Consistency**: 100% SELLY identity in responses
- **Cultural Appropriateness**: 95%+ Indonesian context accuracy
- **Greeting Recognition**: 100% greeting detection and response
- **Government Context**: 90%+ formal language usage for administrative queries

### **Validation Checklist**
- [ ] Database connection stable and performant
- [ ] All training tables created and accessible
- [ ] SELLY persona service responding correctly
- [ ] Cultural context analysis working
- [ ] Greeting management functional
- [ ] Groq integration enhanced with persona
- [ ] Performance targets met
- [ ] Integration tests passing

---

## 🚀 **NEXT STEPS**

Upon successful completion of Phase 1:
1. **Phase 2**: Advanced persona adaptation and mood detection
2. **Phase 3**: Specialized training modules for government services
3. **Phase 4**: Production optimization and monitoring

**Phase 1 establishes the critical foundation for SELLY's transformation from a generic AI to a specialized Indonesian government service assistant with cultural sensitivity and professional identity.**

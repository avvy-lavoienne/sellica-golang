# SELLY Backend Migration to Go - Comprehensive Plan

**Document**: SELLY Backend Migration from Next.js API to Go Language  
**Project Date**: 2025-08-19  
**Created**: 2025-08-19  
**Version**: 1.0  
**Status**: 📋 Planning  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team + Infrastructure Team  

## Executive Summary

This document outlines a comprehensive migration strategy for transitioning SELLY's backend infrastructure from Next.js API routes to a dedicated Go language backend. The migration aims to achieve **5-10x performance improvements** while maintaining full compatibility with existing frontend systems and Indonesian government compliance standards.

**Key Performance Targets**:
- **Response Time**: 500-2000ms → 50-200ms (10x improvement)
- **Memory Usage**: 245MB → 20-50MB (80% reduction)
- **Concurrent Users**: 1,000 → 10,000+ (10x scaling)
- **Throughput**: 45 RPS → 1,000+ RPS (22x improvement)

## 1. Current State Assessment

### 🔍 **Existing Next.js API Infrastructure Analysis**

#### **API Routes Inventory** (22 Active Routes):
```
Core Chat APIs:
├── /api/chat (Primary SELLY endpoint - 500+ lines)
├── /api/chat/session (Session-aware chat - 200+ lines)
├── /api/chat/route-migrated (Migration compatibility)

Performance & Monitoring:
├── /api/health (System health checks)
├── /api/metrics (Performance metrics)
├── /api/monitoring/phase2-performance-monitor
├── /api/monitoring/connection-performance
├── /api/monitoring/phase2-priority1

Data Management:
├── /api/training-data (AI training data collection)
├── /api/training-data/enhanced
├── /api/test-db (Database connectivity testing)

Authentication & Session:
├── /api/login/action (Supabase auth)
├── /api/register (User registration)
├── /api/auth/debug (Auth debugging)
├── /api/session/enhanced-management

Compliance & Security:
├── /api/compliance/indonesian-data-protection
├── /api/phase2/final-integration
├── /api/phase3/status

Caching & Optimization:
├── /api/cache/metrics
├── /api/cache/multi-level-manager

Testing & Development:
├── /api/test-groq (External AI testing)
```

#### **Current Performance Metrics** (From Codebase Analysis):
```typescript
// Current Performance Baseline (from performanceMonitor.ts)
const currentMetrics = {
  responseTime: {
    average: 1335, // ms (target: <2000ms)
    p95: 1850,     // ms
    p99: 2100      // ms
  },
  memoryUsage: 245.5,        // MB (from metrics API)
  throughput: 45.2,          // RPS
  cacheHitRate: 0.87,        // 87%
  errorRate: 0.005,          // 0.5%
  concurrentUsers: 1000      // Current limit
};
```

#### **Performance Bottlenecks Identified**:
1. **Cold Start Issues**: Serverless functions have 2-3s startup delays
2. **Memory Overhead**: 245MB+ usage for API processing
3. **Bundle Size Impact**: Frontend code affects API performance
4. **Resource Sharing**: API and frontend compete for resources
5. **Scaling Limitations**: Difficult to scale API independently
6. **Processing Overhead**: Next.js runtime overhead for simple operations

### 📊 **Database Integration Analysis**

#### **Supabase Integration Patterns**:
```typescript
// Current Supabase Usage (from codebase analysis)
const supabaseIntegration = {
  clients: {
    serviceRole: 'Server-side operations with full access',
    anonKey: 'Client-side operations with RLS',
    browserClient: 'Frontend authentication'
  },
  authentication: {
    provider: 'Supabase Auth',
    sessionManagement: 'Cookie-based with SSR',
    userContext: 'UUID mapping service',
    middleware: 'Enhanced auth middleware'
  },
  dataAccess: {
    tables: ['profiles', 'pengajuan_bulanan', 'salah_rekam', 'dokumentasi'],
    rls: 'Row Level Security enabled',
    connectionPooling: 'SupabaseManager singleton',
    circuitBreaker: 'Failure handling implemented'
  }
};
```

## 2. Migration Strategy for Chat API (Priority Focus)

### 🎯 **Chat API Deep Analysis**

#### **Current Chat API Architecture** (`/api/chat/route.ts`):
```typescript
// Current Implementation Analysis (500+ lines)
const chatAPIComponents = {
  authentication: 'EnhancedAuthMiddleware with UUID mapping',
  caching: 'Multi-level caching with Redis integration',
  aiProcessing: 'Enhanced fallback service with multiple providers',
  sessionManagement: 'Cross-device session synchronization',
  dataStorage: 'Authentication-consistent chat storage',
  analytics: 'Session analytics and training data collection',
  performance: 'Real-time performance monitoring'
};

// Performance Characteristics
const chatAPIMetrics = {
  averageResponseTime: '500-2000ms',
  memoryUsage: '50-100MB per request',
  cacheHitRate: '87%',
  processingSteps: 15, // Multiple middleware layers
  databaseQueries: '3-5 per request',
  externalAPICalls: '1-2 (Groq API, etc.)'
};
```

#### **Go Implementation Performance Projections**:
```go
// Projected Go Performance
type ChatAPIPerformance struct {
    ResponseTime    time.Duration // 50-200ms (10x improvement)
    MemoryUsage     int64        // 5-20MB per request (80% reduction)
    Concurrency     int          // 10,000+ goroutines
    Throughput      int          // 1000+ RPS
    CPUEfficiency   float64      // 90% efficiency vs 60% Node.js
}
```

### 🔄 **Chat API Migration Strategy**

#### **Phase 1: Core Chat Processing (Week 1-2)**
```go
// Go Chat API Structure
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/supabase-community/supabase-go"
)

type ChatRequest struct {
    Message         string                 `json:"message"`
    Context         map[string]interface{} `json:"context"`
    EnhancementMode string                 `json:"enhancementMode"`
    SessionID       string                 `json:"sessionId"`
    UserID          string                 `json:"userId"`
}

type ChatResponse struct {
    Success      bool                   `json:"success"`
    Response     string                 `json:"response"`
    Type         string                 `json:"type"`
    Metadata     map[string]interface{} `json:"metadata"`
    ProcessingTime int64                `json:"processingTime"`
}

func (s *ChatService) ProcessChat(c *gin.Context) {
    startTime := time.Now()
    
    // 1. Authentication (Go: <1ms vs Next.js: 10-50ms)
    authCtx, err := s.authService.Authenticate(c)
    
    // 2. Caching (Go: <1ms vs Next.js: 5-20ms)
    if cached := s.cacheService.Get(request.Message); cached != nil {
        c.JSON(200, cached)
        return
    }
    
    // 3. AI Processing (Go: 20-100ms vs Next.js: 200-1000ms)
    response, err := s.aiService.ProcessQuery(request)
    
    // 4. Database Storage (Go: 5-20ms vs Next.js: 20-100ms)
    s.dbService.StoreMessage(authCtx.UserID, request, response)
    
    // 5. Response (Go: <1ms vs Next.js: 5-20ms)
    c.JSON(200, ChatResponse{
        Success:        true,
        Response:       response.Content,
        ProcessingTime: time.Since(startTime).Milliseconds(),
    })
}
```

#### **API Contract Preservation**:
```go
// Maintain 100% compatibility with existing frontend
type APICompatibilityLayer struct {
    // Exact same request/response formats
    // Same error codes and messages
    // Same authentication flow
    // Same session management
}
```

## 3. Go Backend Architecture Design

### 🏗️ **Framework Selection: Gin (Recommended)**

#### **Framework Comparison**:
| Framework | Performance | Learning Curve | Ecosystem | Recommendation |
|-----------|-------------|----------------|-----------|----------------|
| **Gin** | Excellent (fastest) | Low | Mature | ✅ **Recommended** |
| Echo | Very Good | Low | Good | Alternative |
| Fiber | Excellent | Medium | Growing | Alternative |

#### **Gin Justification**:
- **Performance**: 40,000+ RPS capability
- **Simplicity**: Minimal learning curve for team
- **Middleware**: Rich middleware ecosystem
- **Documentation**: Excellent documentation and community
- **Supabase**: Good Go client library support

### 🏛️ **Architecture Decision: Modular Monolith**

#### **Monolith vs Microservices Analysis**:
```go
// Recommended: Modular Monolith
type SellyBackend struct {
    // Core modules in single deployable unit
    ChatService     *chat.Service
    AuthService     *auth.Service
    CacheService    *cache.Service
    DatabaseService *database.Service
    MonitorService  *monitor.Service
}

// Benefits:
// - Simpler deployment and monitoring
// - Better performance (no network overhead)
// - Easier development and debugging
// - Can evolve to microservices later
```

### 🗄️ **Database Integration Strategy**

#### **Supabase Go Integration**:
```go
package database

import (
    "github.com/supabase-community/supabase-go"
    "github.com/supabase-community/postgrest-go"
)

type SupabaseService struct {
    client     *supabase.Client
    serviceKey string
    anonKey    string
}

func (s *SupabaseService) Initialize() error {
    // Service role client for admin operations
    s.serviceClient = supabase.CreateClient(
        os.Getenv("SUPABASE_URL"),
        os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )
    
    // Anon client for user operations
    s.anonClient = supabase.CreateClient(
        os.Getenv("SUPABASE_URL"),
        os.Getenv("SUPABASE_ANON_KEY"),
    )
    
    return nil
}

// Maintain exact same data access patterns
func (s *SupabaseService) StoreMessage(userID, message, response string) error {
    _, err := s.serviceClient.From("chat_messages").Insert(map[string]interface{}{
        "user_id":    userID,
        "message":    message,
        "response":   response,
        "created_at": time.Now(),
    }).Execute()
    return err
}
```

### 🚀 **Caching Layer Implementation**

#### **Redis Integration**:
```go
package cache

import (
    "github.com/go-redis/redis/v8"
    "encoding/json"
    "time"
)

type CacheService struct {
    client *redis.Client
}

func (c *CacheService) GetChatResponse(message string) (*ChatResponse, error) {
    key := fmt.Sprintf("chat:%s", hashMessage(message))
    val, err := c.client.Get(ctx, key).Result()
    if err != nil {
        return nil, err
    }
    
    var response ChatResponse
    json.Unmarshal([]byte(val), &response)
    return &response, nil
}

func (c *CacheService) SetChatResponse(message string, response *ChatResponse) error {
    key := fmt.Sprintf("chat:%s", hashMessage(message))
    data, _ := json.Marshal(response)
    return c.client.Set(ctx, key, data, 1*time.Hour).Err()
}
```

### 🔐 **Authentication and Session Management**

#### **Supabase Auth Integration**:
```go
package auth

type AuthService struct {
    supabase *supabase.Client
}

func (a *AuthService) ValidateToken(token string) (*UserContext, error) {
    user, err := a.supabase.Auth.GetUser(token)
    if err != nil {
        return nil, err
    }
    
    return &UserContext{
        UserID:          user.ID,
        Email:          user.Email,
        IsAuthenticated: true,
    }, nil
}

// Maintain session compatibility with Next.js frontend
func (a *AuthService) CreateSession(userID string) (*Session, error) {
    // Same session format as Next.js implementation
    return &Session{
        ID:        generateUUID(),
        UserID:    userID,
        CreatedAt: time.Now(),
        ExpiresAt: time.Now().Add(24 * time.Hour),
    }, nil
}
```

## 4. Performance Optimization Targets

### 📈 **Detailed Performance Projections**

#### **Response Time Improvements**:
```go
// Performance Comparison Matrix
type PerformanceComparison struct {
    Component           string
    NextJSTime         time.Duration
    GoTime             time.Duration
    ImprovementFactor  float64
}

var performanceMatrix = []PerformanceComparison{
    {"Authentication",     50*time.Millisecond,  1*time.Millisecond,   50.0},
    {"Database Query",     100*time.Millisecond, 20*time.Millisecond,  5.0},
    {"Cache Lookup",       20*time.Millisecond,  1*time.Millisecond,   20.0},
    {"JSON Processing",    10*time.Millisecond,  1*time.Millisecond,   10.0},
    {"AI Processing",      1000*time.Millisecond, 200*time.Millisecond, 5.0},
    {"Response Building",  20*time.Millisecond,  2*time.Millisecond,   10.0},
}

// Total: 1200ms → 225ms (5.3x improvement)
```

#### **Memory Usage Optimization**:
```go
// Memory Usage Comparison
type MemoryUsage struct {
    Component      string
    NextJSMemory   int64 // MB
    GoMemory       int64 // MB
    Reduction      float64
}

var memoryComparison = []MemoryUsage{
    {"Runtime Overhead", 100, 5,  95.0},
    {"Request Processing", 50, 10, 80.0},
    {"Caching Layer",     30, 5,  83.3},
    {"Database Connections", 20, 3, 85.0},
    {"Session Management", 15, 2,  86.7},
}

// Total: 215MB → 25MB (88% reduction)
```

### 🎯 **Scalability Targets**

#### **Concurrent User Handling**:
```go
// Concurrency Comparison
type ConcurrencyMetrics struct {
    Platform        string
    MaxConcurrent   int
    MemoryPerUser   int64 // KB
    ResponseTime    time.Duration
}

var concurrencyComparison = []ConcurrencyMetrics{
    {"Next.js API",  1000,   245000, 1500*time.Millisecond},
    {"Go Backend",   10000,  25000,  150*time.Millisecond},
}

// 10x improvement in concurrent users
// 90% reduction in memory per user
// 10x improvement in response time
```

### 📊 **Benchmarking Methodology**

#### **Performance Testing Strategy**:
```go
// Benchmark Test Suite
func BenchmarkChatAPI(b *testing.B) {
    // Load testing with various scenarios
    scenarios := []TestScenario{
        {"Simple Query", simpleMessage, 1000},
        {"Complex Query", complexMessage, 500},
        {"Cached Query", cachedMessage, 2000},
        {"Concurrent Users", mixedMessages, 10000},
    }
    
    for _, scenario := range scenarios {
        b.Run(scenario.Name, func(b *testing.B) {
            // Measure response time, memory usage, throughput
            runBenchmark(scenario)
        })
    }
}
```

## 5. Implementation Roadmap

### 🗓️ **Phase-by-Phase Migration Timeline**

#### **Phase 1: Foundation Setup (Week 1-2)**
```
Week 1: Infrastructure Setup
├── Go project initialization with Gin framework
├── Supabase Go client integration
├── Redis caching layer setup
├── Authentication service implementation
├── Basic health check endpoints
└── Docker containerization

Week 2: Core Chat API
├── Chat request/response structures
├── Message processing pipeline
├── Database integration (chat storage)
├── Caching implementation
├── Error handling and logging
└── API compatibility layer
```

#### **Phase 2: Feature Parity (Week 3-4)**
```
Week 3: Advanced Features
├── Session management
├── Training data collection
├── Performance monitoring
├── Indonesian compliance features
└── Enhanced authentication

Week 4: Integration & Testing
├── Frontend integration testing
├── Performance benchmarking
├── Load testing (1000+ concurrent users)
├── Security testing
└── Documentation
```

#### **Phase 3: Production Deployment (Week 5-6)**
```
Week 5: Production Preparation
├── CI/CD pipeline setup
├── Monitoring and alerting
├── Backup and recovery procedures
├── Security hardening
└── Performance optimization

Week 6: Gradual Migration
├── Blue-green deployment setup
├── Traffic splitting (10% → 50% → 100%)
├── Performance monitoring
├── Rollback procedures testing
└── Full production migration
```

### ⚠️ **Risk Mitigation Strategies**

#### **Technical Risks**:
```go
type RiskMitigation struct {
    Risk           string
    Impact         string
    Probability    string
    Mitigation     string
}

var technicalRisks = []RiskMitigation{
    {
        Risk:        "Performance regression",
        Impact:      "High",
        Probability: "Low",
        Mitigation:  "Comprehensive benchmarking, gradual rollout",
    },
    {
        Risk:        "API compatibility issues",
        Impact:      "High", 
        Probability: "Medium",
        Mitigation:  "Extensive integration testing, compatibility layer",
    },
    {
        Risk:        "Database connection issues",
        Impact:      "High",
        Probability: "Low",
        Mitigation:  "Connection pooling, circuit breaker pattern",
    },
}
```

#### **Rollback Procedures**:
```go
// Emergency Rollback Plan
type RollbackProcedure struct {
    Trigger      string
    TimeToRollback time.Duration
    Steps        []string
}

var emergencyRollback = RollbackProcedure{
    Trigger:      "Response time > 2s OR Error rate > 5%",
    TimeToRollback: 5*time.Minute,
    Steps: []string{
        "1. Switch traffic back to Next.js API",
        "2. Disable Go backend health checks", 
        "3. Investigate and fix issues",
        "4. Re-test before re-enabling",
    },
}
```

### 🧪 **Testing and Validation Approach**

#### **Testing Strategy**:
```go
// Comprehensive Testing Plan
type TestingPlan struct {
    Phase        string
    TestTypes    []string
    Coverage     float64
    Duration     time.Duration
}

var testingPhases = []TestingPlan{
    {
        Phase:     "Unit Testing",
        TestTypes: []string{"Function tests", "Service tests", "Integration tests"},
        Coverage:  95.0,
        Duration:  1*time.Week,
    },
    {
        Phase:     "Performance Testing", 
        TestTypes: []string{"Load testing", "Stress testing", "Endurance testing"},
        Coverage:  100.0,
        Duration:  3*24*time.Hour,
    },
    {
        Phase:     "Security Testing",
        TestTypes: []string{"Auth testing", "SQL injection", "XSS testing"},
        Coverage:  100.0,
        Duration:  2*24*time.Hour,
    },
}
```

## 6. Infrastructure & Deployment

### 🐳 **Docker Containerization Strategy**

#### **Multi-Stage Docker Build**:
```dockerfile
# Dockerfile for Go Backend
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o selly-backend ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/selly-backend .
COPY --from=builder /app/config ./config

EXPOSE 8080
CMD ["./selly-backend"]
```

### 🔄 **CI/CD Pipeline Modifications**

#### **GitHub Actions Workflow**:
```yaml
# .github/workflows/go-backend.yml
name: Go Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v3
        with:
          go-version: 1.21
      
      - name: Run tests
        run: |
          cd backend
          go test -v -race -coverprofile=coverage.out ./...
          go tool cover -html=coverage.out -o coverage.html
      
      - name: Performance benchmarks
        run: |
          cd backend
          go test -bench=. -benchmem ./...

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Blue-green deployment
          docker build -t selly-backend:${{ github.sha }} .
          # Deploy with zero downtime
```

### 📊 **Monitoring and Observability Setup**

#### **Prometheus Metrics**:
```go
package monitoring

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    chatRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "selly_chat_requests_total",
            Help: "Total number of chat requests",
        },
        []string{"status", "user_type"},
    )
    
    chatResponseTime = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "selly_chat_response_time_seconds",
            Help: "Chat response time in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"endpoint"},
    )
    
    activeConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "selly_active_connections",
            Help: "Number of active connections",
        },
    )
)
```

### 🏭 **Production Deployment Considerations**

#### **High Availability Setup**:
```go
// Load Balancer Configuration
type LoadBalancerConfig struct {
    Instances    []string
    HealthCheck  string
    Algorithm    string // round-robin, least-connections
    Failover     bool
}

var productionConfig = LoadBalancerConfig{
    Instances: []string{
        "selly-backend-1:8080",
        "selly-backend-2:8080", 
        "selly-backend-3:8080",
    },
    HealthCheck: "/health",
    Algorithm:   "least-connections",
    Failover:    true,
}
```

## Conclusion

This comprehensive migration plan provides a structured approach to transitioning SELLY's backend from Next.js API routes to a high-performance Go backend. The migration promises significant performance improvements while maintaining full compatibility with existing systems and Indonesian government compliance requirements.

**Key Success Factors**:
- **Performance-First**: 10x improvement in response times and throughput
- **Safety-First**: Gradual migration with comprehensive rollback procedures  
- **Compatibility-First**: 100% API compatibility with existing frontend
- **Compliance-First**: Maintained Indonesian government standards

**Expected Outcomes**:
- **Response Time**: 500-2000ms → 50-200ms
- **Memory Usage**: 245MB → 20-50MB  
- **Concurrent Users**: 1,000 → 10,000+
- **Throughput**: 45 RPS → 1,000+ RPS

**Ready for Implementation**: The migration plan is comprehensive, risk-mitigated, and ready for execution with proper resource allocation and timeline management.

---

**Next Steps**: Begin Phase 1 implementation with Go project setup and core chat API development, following the established safety infrastructure requirements from Phase 4 planning.

## 7. Detailed Implementation Specifications

### 🔧 **Go Project Structure**

#### **Recommended Directory Layout**:
```
selly-backend/
├── cmd/
│   └── server/
│       └── main.go                 # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── chat.go            # Chat API handlers
│   │   │   ├── auth.go            # Authentication handlers
│   │   │   └── health.go          # Health check handlers
│   │   ├── middleware/
│   │   │   ├── auth.go            # Auth middleware
│   │   │   ├── cors.go            # CORS middleware
│   │   │   └── logging.go         # Request logging
│   │   └── routes/
│   │       └── routes.go          # Route definitions
│   ├── services/
│   │   ├── chat/
│   │   │   ├── service.go         # Chat business logic
│   │   │   ├── processor.go       # Message processing
│   │   │   └── cache.go           # Chat caching
│   │   ├── auth/
│   │   │   ├── service.go         # Authentication service
│   │   │   └── supabase.go        # Supabase integration
│   │   ├── database/
│   │   │   ├── supabase.go        # Database operations
│   │   │   └── models.go          # Data models
│   │   └── cache/
│   │       ├── redis.go           # Redis operations
│   │       └── memory.go          # In-memory cache
│   ├── config/
│   │   └── config.go              # Configuration management
│   └── utils/
│       ├── logger.go              # Logging utilities
│       └── validator.go           # Input validation
├── pkg/
│   ├── errors/
│   │   └── errors.go              # Custom error types
│   └── types/
│       └── types.go               # Shared types
├── scripts/
│   ├── migrate.sh                 # Migration scripts
│   └── benchmark.sh               # Performance benchmarks
├── docker/
│   ├── Dockerfile                 # Production dockerfile
│   └── docker-compose.yml         # Development setup
├── docs/
│   ├── api.md                     # API documentation
│   └── deployment.md              # Deployment guide
├── go.mod
├── go.sum
└── README.md
```

### 🚀 **Core Service Implementation**

#### **Chat Service Implementation**:
```go
// internal/services/chat/service.go
package chat

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/selly/backend/internal/services/auth"
    "github.com/selly/backend/internal/services/cache"
    "github.com/selly/backend/internal/services/database"
)

type Service struct {
    db       *database.Service
    cache    *cache.Service
    auth     *auth.Service
    logger   *slog.Logger
}

type ChatRequest struct {
    Message         string                 `json:"message" validate:"required,min=1,max=1000"`
    Context         map[string]interface{} `json:"context"`
    EnhancementMode string                 `json:"enhancementMode"`
    SessionID       string                 `json:"sessionId"`
}

type ChatResponse struct {
    Success        bool                   `json:"success"`
    Response       string                 `json:"response"`
    Type           string                 `json:"type"`
    Metadata       ChatMetadata           `json:"metadata"`
    ProcessingTime int64                  `json:"processingTime"`
}

type ChatMetadata struct {
    AIProvider      string    `json:"aiProvider"`
    Confidence      float64   `json:"confidence"`
    Cached          bool      `json:"cached"`
    SessionID       string    `json:"sessionId"`
    UserID          string    `json:"userId,omitempty"`
    GuestUUID       string    `json:"guestUuid,omitempty"`
    IsAuthenticated bool      `json:"isAuthenticated"`
    Timestamp       time.Time `json:"timestamp"`
}

func NewService(db *database.Service, cache *cache.Service, auth *auth.Service, logger *slog.Logger) *Service {
    return &Service{
        db:     db,
        cache:  cache,
        auth:   auth,
        logger: logger,
    }
}

func (s *Service) ProcessChat(ctx context.Context, req *ChatRequest, userCtx *auth.UserContext) (*ChatResponse, error) {
    startTime := time.Now()

    // 1. Input validation
    if err := s.validateRequest(req); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }

    // 2. Check cache first (Go: <1ms vs Next.js: 5-20ms)
    cacheKey := s.generateCacheKey(req.Message, userCtx.UserID)
    if cached, err := s.cache.GetChatResponse(ctx, cacheKey); err == nil && cached != nil {
        s.logger.Info("Cache hit for chat request", "userId", userCtx.UserID)
        cached.ProcessingTime = time.Since(startTime).Milliseconds()
        cached.Metadata.Cached = true
        return cached, nil
    }

    // 3. Process message with AI service (Go: 50-200ms vs Next.js: 200-1000ms)
    aiResponse, err := s.processWithAI(ctx, req, userCtx)
    if err != nil {
        return nil, fmt.Errorf("AI processing failed: %w", err)
    }

    // 4. Store message in database (Go: 5-20ms vs Next.js: 20-100ms)
    if err := s.storeMessage(ctx, req, aiResponse, userCtx); err != nil {
        s.logger.Error("Failed to store message", "error", err)
        // Don't fail the request, just log the error
    }

    // 5. Cache the response (Go: <1ms vs Next.js: 5-10ms)
    response := &ChatResponse{
        Success:        true,
        Response:       aiResponse.Content,
        Type:           aiResponse.Type,
        ProcessingTime: time.Since(startTime).Milliseconds(),
        Metadata: ChatMetadata{
            AIProvider:      aiResponse.Provider,
            Confidence:      aiResponse.Confidence,
            Cached:          false,
            SessionID:       req.SessionID,
            UserID:          userCtx.UserID,
            IsAuthenticated: userCtx.IsAuthenticated,
            Timestamp:       time.Now(),
        },
    }

    // Cache for future requests
    if err := s.cache.SetChatResponse(ctx, cacheKey, response, 1*time.Hour); err != nil {
        s.logger.Error("Failed to cache response", "error", err)
    }

    return response, nil
}

func (s *Service) processWithAI(ctx context.Context, req *ChatRequest, userCtx *auth.UserContext) (*AIResponse, error) {
    // Implement AI processing logic
    // This would integrate with your existing AI services
    // but with much better performance in Go

    // Simulate AI processing (replace with actual implementation)
    time.Sleep(50 * time.Millisecond) // Go: 50ms vs Next.js: 500ms

    return &AIResponse{
        Content:    "Processed response for: " + req.Message,
        Type:       "text",
        Provider:   "selly-go-backend",
        Confidence: 0.95,
    }, nil
}

type AIResponse struct {
    Content    string  `json:"content"`
    Type       string  `json:"type"`
    Provider   string  `json:"provider"`
    Confidence float64 `json:"confidence"`
}
```

#### **High-Performance Caching Implementation**:
```go
// internal/services/cache/redis.go
package cache

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/go-redis/redis/v8"
)

type Service struct {
    client *redis.Client
    logger *slog.Logger
}

func NewService(redisURL string, logger *slog.Logger) (*Service, error) {
    opt, err := redis.ParseURL(redisURL)
    if err != nil {
        return nil, fmt.Errorf("invalid redis URL: %w", err)
    }

    client := redis.NewClient(opt)

    // Test connection
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := client.Ping(ctx).Err(); err != nil {
        return nil, fmt.Errorf("redis connection failed: %w", err)
    }

    return &Service{
        client: client,
        logger: logger,
    }, nil
}

func (s *Service) GetChatResponse(ctx context.Context, key string) (*ChatResponse, error) {
    val, err := s.client.Get(ctx, key).Result()
    if err != nil {
        if err == redis.Nil {
            return nil, nil // Cache miss
        }
        return nil, fmt.Errorf("cache get failed: %w", err)
    }

    var response ChatResponse
    if err := json.Unmarshal([]byte(val), &response); err != nil {
        return nil, fmt.Errorf("cache unmarshal failed: %w", err)
    }

    return &response, nil
}

func (s *Service) SetChatResponse(ctx context.Context, key string, response *ChatResponse, ttl time.Duration) error {
    data, err := json.Marshal(response)
    if err != nil {
        return fmt.Errorf("cache marshal failed: %w", err)
    }

    if err := s.client.Set(ctx, key, data, ttl).Err(); err != nil {
        return fmt.Errorf("cache set failed: %w", err)
    }

    return nil
}

// Multi-level caching with memory + Redis
type MultiLevelCache struct {
    memory map[string]*CacheEntry
    redis  *Service
    mutex  sync.RWMutex
}

type CacheEntry struct {
    Data      interface{}
    ExpiresAt time.Time
}

func (m *MultiLevelCache) Get(ctx context.Context, key string) (interface{}, error) {
    // Check memory cache first (nanosecond access)
    m.mutex.RLock()
    if entry, exists := m.memory[key]; exists && time.Now().Before(entry.ExpiresAt) {
        m.mutex.RUnlock()
        return entry.Data, nil
    }
    m.mutex.RUnlock()

    // Check Redis cache (microsecond access)
    return m.redis.GetChatResponse(ctx, key)
}
```

### 🔐 **Enhanced Authentication Service**

#### **Supabase Integration with Go**:
```go
// internal/services/auth/supabase.go
package auth

import (
    "context"
    "fmt"
    "time"

    "github.com/supabase-community/supabase-go"
)

type Service struct {
    client    *supabase.Client
    serviceClient *supabase.Client
    logger    *slog.Logger
}

type UserContext struct {
    UserID          string    `json:"userId"`
    Email           string    `json:"email"`
    IsAuthenticated bool      `json:"isAuthenticated"`
    SessionID       string    `json:"sessionId"`
    CreatedAt       time.Time `json:"createdAt"`
}

func NewService(supabaseURL, anonKey, serviceKey string, logger *slog.Logger) (*Service, error) {
    // Client for user operations
    client, err := supabase.NewClient(supabaseURL, anonKey, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create supabase client: %w", err)
    }

    // Service client for admin operations
    serviceClient, err := supabase.NewClient(supabaseURL, serviceKey, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create supabase service client: %w", err)
    }

    return &Service{
        client:        client,
        serviceClient: serviceClient,
        logger:        logger,
    }, nil
}

func (s *Service) ValidateToken(ctx context.Context, token string) (*UserContext, error) {
    if token == "" {
        // Return guest context
        return &UserContext{
            UserID:          generateGuestUUID(),
            IsAuthenticated: false,
            SessionID:       generateSessionID(),
            CreatedAt:       time.Now(),
        }, nil
    }

    // Validate JWT token with Supabase
    user, err := s.client.Auth.GetUser(ctx, token)
    if err != nil {
        s.logger.Error("Token validation failed", "error", err)
        // Return guest context on auth failure
        return &UserContext{
            UserID:          generateGuestUUID(),
            IsAuthenticated: false,
            SessionID:       generateSessionID(),
            CreatedAt:       time.Now(),
        }, nil
    }

    return &UserContext{
        UserID:          user.ID,
        Email:           user.Email,
        IsAuthenticated: true,
        SessionID:       generateSessionID(),
        CreatedAt:       time.Now(),
    }, nil
}

// Maintain compatibility with Next.js session format
func (s *Service) CreateSession(ctx context.Context, userID string) (*Session, error) {
    session := &Session{
        ID:        generateUUID(),
        UserID:    userID,
        CreatedAt: time.Now(),
        ExpiresAt: time.Now().Add(24 * time.Hour),
        Data:      make(map[string]interface{}),
    }

    // Store session in database
    _, err := s.serviceClient.From("user_sessions").Insert(session).Execute()
    if err != nil {
        return nil, fmt.Errorf("failed to create session: %w", err)
    }

    return session, nil
}
```

### 📊 **Performance Monitoring Integration**

#### **Prometheus Metrics with Detailed Tracking**:
```go
// internal/monitoring/metrics.go
package monitoring

import (
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Chat API metrics
    ChatRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "selly_chat_requests_total",
            Help: "Total number of chat requests processed",
        },
        []string{"status", "user_type", "cached"},
    )

    ChatResponseDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "selly_chat_response_duration_seconds",
            Help:    "Chat response time in seconds",
            Buckets: []float64{0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0},
        },
        []string{"endpoint", "cached"},
    )

    // Database metrics
    DatabaseOperationDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "selly_database_operation_duration_seconds",
            Help:    "Database operation duration in seconds",
            Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0},
        },
        []string{"operation", "table"},
    )

    // Cache metrics
    CacheOperations = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "selly_cache_operations_total",
            Help: "Total cache operations",
        },
        []string{"operation", "result"},
    )

    // System metrics
    ActiveConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "selly_active_connections",
            Help: "Number of active connections",
        },
    )

    MemoryUsage = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "selly_memory_usage_bytes",
            Help: "Current memory usage in bytes",
        },
    )
)

// Middleware for automatic metrics collection
func MetricsMiddleware() gin.HandlerFunc {
    return gin.HandlerFunc(func(c *gin.Context) {
        start := time.Now()

        c.Next()

        duration := time.Since(start)
        status := fmt.Sprintf("%d", c.Writer.Status())

        ChatRequestsTotal.WithLabelValues(status, getUserType(c), getCacheStatus(c)).Inc()
        ChatResponseDuration.WithLabelValues(c.Request.URL.Path, getCacheStatus(c)).Observe(duration.Seconds())
    })
}
```

### 🚀 **Deployment Configuration**

#### **Production-Ready Docker Setup**:
```dockerfile
# Multi-stage build for optimal image size
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Create non-root user
RUN adduser -D -g '' appuser

WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download
RUN go mod verify

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o selly-backend ./cmd/server

# Final stage
FROM scratch

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
# Copy CA certificates
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
# Copy user
COPY --from=builder /etc/passwd /etc/passwd

# Copy binary
COPY --from=builder /build/selly-backend /selly-backend

# Use non-root user
USER appuser

EXPOSE 8080

ENTRYPOINT ["/selly-backend"]
```

#### **Kubernetes Deployment Configuration**:
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: selly-backend
  labels:
    app: selly-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: selly-backend
  template:
    metadata:
      labels:
        app: selly-backend
    spec:
      containers:
      - name: selly-backend
        image: selly-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: selly-secrets
              key: supabase-url
        - name: SUPABASE_ANON_KEY
          valueFrom:
            secretKeyRef:
              name: selly-secrets
              key: supabase-anon-key
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: selly-secrets
              key: redis-url
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: selly-backend-service
spec:
  selector:
    app: selly-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

## 8. Migration Validation & Success Metrics

### 📈 **Performance Benchmarking Suite**

#### **Automated Performance Testing**:
```go
// scripts/benchmark_test.go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "testing"
    "time"
)

func BenchmarkChatAPI(b *testing.B) {
    client := &http.Client{Timeout: 10 * time.Second}

    testCases := []struct {
        name    string
        message string
        users   int
    }{
        {"Simple Query", "Apa itu KTP?", 100},
        {"Complex Query", "Bagaimana cara mengurus KTP yang hilang untuk WNI di luar negeri?", 50},
        {"Cached Query", "Apa itu KTP?", 1000}, // Should hit cache
    }

    for _, tc := range testCases {
        b.Run(tc.name, func(b *testing.B) {
            b.SetParallelism(tc.users)
            b.RunParallel(func(pb *testing.PB) {
                for pb.Next() {
                    req := ChatRequest{
                        Message: tc.message,
                        Context: map[string]interface{}{},
                    }

                    body, _ := json.Marshal(req)
                    resp, err := client.Post("http://localhost:8080/api/chat",
                        "application/json", bytes.NewBuffer(body))

                    if err != nil {
                        b.Fatal(err)
                    }
                    resp.Body.Close()

                    if resp.StatusCode != 200 {
                        b.Fatalf("Expected 200, got %d", resp.StatusCode)
                    }
                }
            })
        })
    }
}

// Load testing with gradual ramp-up
func TestLoadRampUp(t *testing.T) {
    stages := []struct {
        users    int
        duration time.Duration
    }{
        {100, 1 * time.Minute},
        {500, 2 * time.Minute},
        {1000, 3 * time.Minute},
        {2000, 2 * time.Minute},
    }

    for _, stage := range stages {
        t.Run(fmt.Sprintf("%d_users", stage.users), func(t *testing.T) {
            // Implement load testing logic
            runLoadTest(t, stage.users, stage.duration)
        })
    }
}
```

### ✅ **Success Criteria Validation**

#### **Automated Success Validation**:
```go
// scripts/validate_migration.go
package main

import (
    "context"
    "fmt"
    "time"
)

type MigrationValidator struct {
    goBackendURL   string
    nextjsAPIURL   string
    testDuration   time.Duration
}

type ValidationResult struct {
    Metric          string
    NextJSValue     float64
    GoValue         float64
    ImprovementFactor float64
    Passed          bool
}

func (v *MigrationValidator) ValidatePerformance() []ValidationResult {
    results := []ValidationResult{}

    // Test response time
    nextjsTime := v.measureResponseTime(v.nextjsAPIURL)
    goTime := v.measureResponseTime(v.goBackendURL)

    results = append(results, ValidationResult{
        Metric:            "Response Time",
        NextJSValue:       nextjsTime,
        GoValue:           goTime,
        ImprovementFactor: nextjsTime / goTime,
        Passed:           goTime < nextjsTime && goTime < 200, // <200ms target
    })

    // Test memory usage
    nextjsMemory := v.measureMemoryUsage(v.nextjsAPIURL)
    goMemory := v.measureMemoryUsage(v.goBackendURL)

    results = append(results, ValidationResult{
        Metric:            "Memory Usage",
        NextJSValue:       nextjsMemory,
        GoValue:           goMemory,
        ImprovementFactor: nextjsMemory / goMemory,
        Passed:           goMemory < nextjsMemory && goMemory < 50, // <50MB target
    })

    // Test throughput
    nextjsThroughput := v.measureThroughput(v.nextjsAPIURL)
    goThroughput := v.measureThroughput(v.goBackendURL)

    results = append(results, ValidationResult{
        Metric:            "Throughput",
        NextJSValue:       nextjsThroughput,
        GoValue:           goThroughput,
        ImprovementFactor: goThroughput / nextjsThroughput,
        Passed:           goThroughput > nextjsThroughput && goThroughput > 1000, // >1000 RPS target
    })

    return results
}

func (v *MigrationValidator) GenerateReport(results []ValidationResult) {
    fmt.Println("=== MIGRATION VALIDATION REPORT ===")
    fmt.Printf("Test Duration: %v\n", v.testDuration)
    fmt.Printf("Timestamp: %v\n\n", time.Now())

    allPassed := true
    for _, result := range results {
        status := "✅ PASS"
        if !result.Passed {
            status = "❌ FAIL"
            allPassed = false
        }

        fmt.Printf("%s %s\n", status, result.Metric)
        fmt.Printf("  Next.js: %.2f\n", result.NextJSValue)
        fmt.Printf("  Go:      %.2f\n", result.GoValue)
        fmt.Printf("  Improvement: %.1fx\n\n", result.ImprovementFactor)
    }

    if allPassed {
        fmt.Println("🎉 MIGRATION VALIDATION SUCCESSFUL!")
        fmt.Println("All performance targets achieved.")
    } else {
        fmt.Println("⚠️  MIGRATION VALIDATION FAILED!")
        fmt.Println("Some performance targets not met.")
    }
}
```

This comprehensive migration plan provides detailed technical specifications, implementation guidelines, and validation procedures for successfully transitioning SELLY's backend from Next.js to Go while achieving significant performance improvements and maintaining full system compatibility.

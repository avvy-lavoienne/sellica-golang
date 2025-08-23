---
type: "manual"
---

# Next.js to Go Backend Migration Workflow Analysis Rules

**Rule Category**: Migration Workflow Analysis  
**Priority**: Critical  
**Scope**: All SELLY frontend to backend migrations  
**Enforcement**: Mandatory for all `/frontend/*` to `/backend/*` migrations  

## Rule 1: Mandatory Frontend Workflow Analysis

### **Pre-Migration Analysis Requirements**

Before implementing any migration from `/frontend/*` to `/backend/*`, you MUST:

#### **1.1 Complete Workflow Analysis**
```typescript
// REQUIRED: Analyze complete workflow structure
interface WorkflowAnalysis {
  // Directory structure analysis
  directoryStructure: {
    apiRoutes: string[];           // /frontend/src/app/api/*
    components: string[];          // React components involved
    services: string[];            // Service layer implementations
    middleware: string[];          // Next.js middleware
    serverActions: string[];       // Server actions and form handlers
  };
  
  // Data flow analysis
  dataFlow: {
    requestFlow: RequestFlowStep[];
    responseFlow: ResponseFlowStep[];
    stateManagement: StateManagementPattern[];
    integrationPoints: IntegrationPoint[];
  };
  
  // Performance characteristics
  performance: {
    currentResponseTimes: number[];
    memoryUsage: number;
    concurrentCapacity: number;
    bottlenecks: PerformanceBottleneck[];
  };
}
```

#### **1.2 Next.js Pattern Identification**
- **API Routes**: Document all `/frontend/src/app/api/*` endpoints
- **Middleware**: Identify authentication, CORS, logging middleware
- **Server Components**: Map server-side rendering logic
- **Client Components**: Identify client-side state and interactions
- **Server Actions**: Document form handling and mutations

#### **1.3 Integration Point Mapping**
- **Database Operations**: Supabase queries, transactions, real-time subscriptions
- **Authentication**: JWT handling, session management, user context
- **Caching**: Redis operations, memory caching, cache invalidation
- **External APIs**: Third-party integrations, AI providers, government systems

## Rule 2: Next.js to Go Migration Mapping

### **2.1 API Route Migration Pattern**
```typescript
// BEFORE: Next.js API Route
// /frontend/src/app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { message, context } = await request.json();
  const response = await aiService.processQuery(message, context);
  return NextResponse.json({ success: true, response });
}
```

```go
// AFTER: Go HTTP Handler
// /backend/internal/api/handlers/chat.go
func (h *ChatHandler) ProcessChat(c *gin.Context) {
    var req ChatRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request format"})
        return
    }
    
    response, err := h.aiService.ProcessQuery(c.Request.Context(), &AIRequest{
        Query:   req.Message,
        Context: req.Context,
    })
    if err != nil {
        c.JSON(500, gin.H{"error": "Processing failed"})
        return
    }
    
    c.JSON(200, gin.H{"success": true, "response": response})
}
```

### **2.2 Middleware Migration Pattern**
```typescript
// BEFORE: Next.js Middleware
// /frontend/src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  if (!token) {
    return NextResponse.redirect('/login');
  }
  return NextResponse.next();
}
```

```go
// AFTER: Go Middleware
// /backend/internal/api/middleware/auth.go
func AuthMiddleware(authService *auth.Service) gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.JSON(401, gin.H{"error": "Authorization required"})
            c.Abort()
            return
        }
        
        claims, err := authService.ValidateToken(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        c.Set("user_context", claims)
        c.Next()
    }
}
```

### **2.3 Database Operation Migration**
```typescript
// BEFORE: Next.js Supabase Operation
const { data, error } = await supabase
  .from('training_data')
  .insert({
    query: userQuery,
    response: aiResponse,
    user_id: userId,
    metadata: queryMetadata
  });
```

```go
// AFTER: Go Database Service
func (s *TrainingService) InsertTrainingData(ctx context.Context, data *TrainingData) error {
    query := `
        INSERT INTO training_data (query, response, user_id, metadata)
        VALUES ($1, $2, $3, $4)
    `
    _, err := s.db.ExecContext(ctx, query, 
        data.Query, data.Response, data.UserID, data.Metadata)
    return err
}
```

## Rule 3: Workflow Adaptation Process

### **3.1 Business Logic Preservation**
- **MUST**: Maintain identical business logic behavior
- **MUST**: Preserve user experience and workflow steps
- **MUST**: Maintain data consistency and validation rules
- **MUST**: Preserve error handling and user feedback

### **3.2 API Contract Compatibility**
```go
// REQUIRED: Maintain API contract compatibility
type APICompatibilityCheck struct {
    // Request/Response format must match exactly
    RequestFormat  interface{} `json:"request_format"`
    ResponseFormat interface{} `json:"response_format"`
    
    // HTTP status codes must match
    StatusCodes []int `json:"status_codes"`
    
    // Headers must be compatible
    RequiredHeaders []string `json:"required_headers"`
    
    // Authentication flow must be preserved
    AuthFlow AuthenticationFlow `json:"auth_flow"`
}
```

### **3.3 Session Continuity Requirements**
- **Session Management**: Preserve session state across migration
- **Authentication State**: Maintain user authentication without re-login
- **User Context**: Preserve user preferences and conversation history
- **Cache Consistency**: Ensure cache data remains valid during migration

## Rule 4: Implementation Guidelines

### **4.1 Mandatory Analysis Sequence**
1. **Frontend Analysis**: Use `codebase-retrieval` to examine current implementation
2. **Workflow Documentation**: Document complete user and system workflows
3. **Migration Planning**: Create detailed migration plan with Go implementation
4. **Performance Estimation**: Provide measurable performance improvement estimates
5. **Implementation**: Implement Go backend with functional parity

### **4.2 Documentation Requirements**
```markdown
## Migration Analysis Template

### Current Next.js Implementation
- **File Path**: `/frontend/src/app/api/example/route.ts`
- **Functionality**: [Detailed description]
- **Dependencies**: [List all dependencies]
- **Performance**: [Current metrics]

### Proposed Go Implementation
- **File Path**: `/backend/internal/api/handlers/example.go`
- **Architecture**: [Go service architecture]
- **Performance Improvement**: [Estimated improvement]
- **Implementation Complexity**: [Low/Medium/High]

### Migration Strategy
- **Phase**: [1/2/3]
- **Dependencies**: [Required services]
- **Testing Strategy**: [Validation approach]
- **Rollback Plan**: [Fallback strategy]
```

### **4.3 Side-by-Side Comparison Requirement**
Always provide:
- **Current Next.js Code**: Actual implementation
- **Proposed Go Code**: Complete Go implementation
- **Performance Comparison**: Measurable improvements
- **Complexity Analysis**: Implementation effort assessment

## Rule 5: Validation Requirements

### **5.1 Functional Parity Validation**
```go
// REQUIRED: Functional parity test structure
type FunctionalParityTest struct {
    TestName        string
    NextJSEndpoint  string
    GoEndpoint      string
    TestCases       []TestCase
    ExpectedResults []ExpectedResult
}

type TestCase struct {
    Input          interface{}
    ExpectedOutput interface{}
    PerformanceTarget time.Duration
}
```

### **5.2 Performance Validation**
- **Response Time**: Must show measurable improvement
- **Memory Usage**: Must demonstrate efficiency gains
- **Concurrent Capacity**: Must support higher load
- **Error Rates**: Must maintain or improve error rates

### **5.3 Integration Validation**
- **Database Operations**: Verify all CRUD operations work correctly
- **Cache Operations**: Ensure cache consistency and performance
- **External APIs**: Validate all third-party integrations
- **Authentication**: Verify JWT and session handling

## Rule 6: Enforcement and Compliance

### **6.1 Mandatory Checklist**
Before any migration implementation:
- [ ] Complete frontend workflow analysis performed
- [ ] Next.js patterns identified and documented
- [ ] Go migration mapping created
- [ ] Performance improvements estimated
- [ ] API contract compatibility verified
- [ ] Integration points validated
- [ ] Testing strategy defined
- [ ] Rollback plan prepared

### **6.2 Quality Gates**
- **Analysis Gate**: Frontend analysis must be complete and documented
- **Design Gate**: Go implementation must maintain functional parity
- **Performance Gate**: Measurable improvements must be demonstrated
- **Integration Gate**: All integration points must be validated
- **User Experience Gate**: User workflows must remain unchanged

### **6.3 Documentation Standards**
- Use consistent file naming: `YYYY-MM-DD-migration-analysis-{component}.md`
- Include performance benchmarks and improvement estimates
- Provide complete code examples for both Next.js and Go
- Document all assumptions and dependencies
- Include rollback procedures and risk mitigation

## Rule 7: Continuous Improvement

### **7.1 Migration Pattern Library**
Maintain a library of proven migration patterns:
- **API Route Patterns**: Common Next.js to Go API migrations
- **Middleware Patterns**: Authentication, logging, CORS migrations
- **Database Patterns**: Supabase to Go database service patterns
- **Caching Patterns**: Next.js to Go caching implementations

### **7.2 Performance Tracking**
Track migration success metrics:
- **Performance Improvements**: Actual vs estimated improvements
- **Implementation Time**: Actual vs estimated development time
- **Bug Rates**: Post-migration issue frequency
- **User Satisfaction**: User experience impact measurements

---

## Rule 8: Specific Migration Scenarios

### **8.1 AI Service Migration**
```typescript
// BEFORE: Next.js AI Service
// /frontend/src/services/chatbot/aiService.ts
class AIService {
  async processQuery(query: string, context?: any): Promise<AIResponse> {
    // Complex AI processing logic
    const providers = ['enhanced', 'tensorflow', 'huggingface'];
    const selectedProvider = this.selectProvider(query, context);
    return await this.providers[selectedProvider].process(query, context);
  }
}
```

```go
// AFTER: Go AI Service
// /backend/internal/services/ai/service.go
type AIService struct {
    providers map[string]AIProvider
    selector  *ProviderSelector
    monitor   *PerformanceMonitor
}

func (s *AIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    provider := s.selector.SelectOptimalProvider(req)
    response, err := s.providers[provider].ProcessQuery(ctx, req)
    if err != nil {
        return s.handleProviderFailure(ctx, req, provider)
    }
    s.monitor.RecordSuccess(provider, response.ProcessingTime)
    return response, nil
}
```

### **8.2 Session Management Migration**
```typescript
// BEFORE: Next.js Session Management
// /frontend/src/services/session/sessionManager.ts
export class SessionManager {
  async createSession(userId: string): Promise<Session> {
    const session = await supabase.from('sessions').insert({
      user_id: userId,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    return session.data;
  }
}
```

```go
// AFTER: Go Session Service
// /backend/internal/services/session/service.go
type SessionService struct {
    db    *database.Service
    cache *cache.Service
    redis *redis.Client
}

func (s *SessionService) CreateSession(ctx context.Context, userID string) (*Session, error) {
    session := &Session{
        ID:        uuid.New().String(),
        UserID:    userID,
        CreatedAt: time.Now(),
        ExpiresAt: time.Now().Add(24 * time.Hour),
    }

    // Store in database
    if err := s.db.InsertSession(ctx, session); err != nil {
        return nil, fmt.Errorf("failed to create session: %w", err)
    }

    // Cache for fast access
    s.cache.SetSession(session.ID, session, 24*time.Hour)

    return session, nil
}
```

### **8.3 Real-time Features Migration**
```typescript
// BEFORE: Next.js Real-time with Supabase
// /frontend/src/services/realtime/realtimeService.ts
const subscription = supabase
  .channel('training_data')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'training_data'
  }, (payload) => {
    handleNewTrainingData(payload.new);
  })
  .subscribe();
```

```go
// AFTER: Go Real-time with WebSockets
// /backend/internal/services/realtime/service.go
type RealtimeService struct {
    hub        *WebSocketHub
    db         *database.Service
    subscriber *DatabaseSubscriber
}

func (rs *RealtimeService) HandleTrainingDataUpdates() {
    rs.subscriber.Subscribe("training_data", func(event *DatabaseEvent) {
        message := &RealtimeMessage{
            Type: "training_data_update",
            Data: event.Data,
        }
        rs.hub.BroadcastToChannel("training_data", message)
    })
}
```

## Rule 9: Edge Cases and Error Handling

### **9.1 Error Handling Migration**
```typescript
// BEFORE: Next.js Error Handling
try {
  const result = await aiService.processQuery(query);
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('AI processing failed:', error);
  return NextResponse.json(
    { success: false, error: 'Processing failed' },
    { status: 500 }
  );
}
```

```go
// AFTER: Go Error Handling
func (h *AIHandler) ProcessQuery(c *gin.Context) {
    result, err := h.aiService.ProcessQuery(c.Request.Context(), req)
    if err != nil {
        // Structured error handling
        switch {
        case errors.Is(err, ErrInvalidInput):
            c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
        case errors.Is(err, ErrServiceUnavailable):
            c.JSON(503, gin.H{"success": false, "error": "Service temporarily unavailable"})
        default:
            logrus.WithError(err).Error("AI processing failed")
            c.JSON(500, gin.H{"success": false, "error": "Processing failed"})
        }
        return
    }

    c.JSON(200, gin.H{"success": true, "data": result})
}
```

### **9.2 Rate Limiting Migration**
```typescript
// BEFORE: Next.js Rate Limiting
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export async function POST(request: NextRequest) {
  const { success } = await ratelimit.limit(getClientIP(request));
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  // Process request
}
```

```go
// AFTER: Go Rate Limiting
// /backend/internal/middleware/ratelimit.go
type RateLimiter struct {
    redis  *redis.Client
    limits map[string]*RateLimit
}

func (rl *RateLimiter) RateLimitMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        clientIP := c.ClientIP()
        key := fmt.Sprintf("rate_limit:%s", clientIP)

        allowed, err := rl.checkRateLimit(key, 10, time.Minute)
        if err != nil {
            logrus.WithError(err).Error("Rate limit check failed")
            c.Next() // Allow on error
            return
        }

        if !allowed {
            c.JSON(429, gin.H{"error": "Rate limit exceeded"})
            c.Abort()
            return
        }

        c.Next()
    }
}
```

## Rule 10: Migration Testing Framework

### **10.1 Automated Migration Testing**
```go
// REQUIRED: Migration test structure
type MigrationTest struct {
    Name           string
    NextJSEndpoint string
    GoEndpoint     string
    TestCases      []MigrationTestCase
}

type MigrationTestCase struct {
    Description    string
    Input          interface{}
    ExpectedOutput interface{}
    PerformanceTarget time.Duration

    // Test both endpoints
    TestNextJS func(input interface{}) (interface{}, error)
    TestGo     func(input interface{}) (interface{}, error)
}

func (mt *MigrationTest) RunComparativeTest() *TestResult {
    results := &TestResult{
        TestName: mt.Name,
        Cases:    make([]CaseResult, len(mt.TestCases)),
    }

    for i, testCase := range mt.TestCases {
        // Test Next.js implementation
        nextjsResult, nextjsErr := testCase.TestNextJS(testCase.Input)
        nextjsTime := measureExecutionTime(func() {
            testCase.TestNextJS(testCase.Input)
        })

        // Test Go implementation
        goResult, goErr := testCase.TestGo(testCase.Input)
        goTime := measureExecutionTime(func() {
            testCase.TestGo(testCase.Input)
        })

        // Compare results
        results.Cases[i] = CaseResult{
            Description:      testCase.Description,
            FunctionalParity: compareResults(nextjsResult, goResult),
            PerformanceGain:  calculateImprovement(nextjsTime, goTime),
            ErrorParity:      compareErrors(nextjsErr, goErr),
        }
    }

    return results
}
```

### **10.2 Performance Benchmarking**
```go
// REQUIRED: Performance benchmark structure
type PerformanceBenchmark struct {
    EndpointName    string
    NextJSBaseline  BenchmarkMetrics
    GoTarget        BenchmarkMetrics
    ActualGo        BenchmarkMetrics
    ImprovementGoal float64 // e.g., 5.0 for 5x improvement
}

type BenchmarkMetrics struct {
    ResponseTime    time.Duration
    MemoryUsage     int64
    CPUUsage        float64
    ThroughputRPS   float64
    ErrorRate       float64
}

func (pb *PerformanceBenchmark) ValidateImprovement() bool {
    actualImprovement := float64(pb.NextJSBaseline.ResponseTime) /
                        float64(pb.ActualGo.ResponseTime)
    return actualImprovement >= pb.ImprovementGoal
}
```

**These comprehensive rules ensure systematic, thorough, and successful migration of Next.js frontend functionality to Go backend while maintaining quality, performance, and user experience standards.**

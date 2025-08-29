# SELLY AI Service Registry

**Document**: SELLY AI Service Registry and Boundaries
**Project Date**: 2025-08-29
**Created**: 2025-08-29
**Version**: 1.0
**Status**: ✅ Active
**Priority**: 🔧 High
**Language**: English
**Audience**: Technical Team, Architects, Developers

## Overview

This service registry provides comprehensive documentation of all SELLY AI backend services, their responsibilities, boundaries, and interdependencies. The registry ensures clear separation of concerns and maintains architectural integrity across the system.

## Service Categories

### Core Services (Foundation Layer)

| Service | Location | Responsibility | Primary Interface | Dependencies |
|---------|----------|----------------|-------------------|--------------|
| **Database** | `backend/internal/services/database/` | Data persistence, connection pooling, query optimization | `database.Service` | None |
| **Cache** | `backend/internal/services/cache/` | Multi-level caching (Memory → Redis), cache invalidation | `cache.Service` | Database |
| **Auth** | `backend/internal/services/auth/` | JWT validation, session management, RBAC | `auth.Service` | Database, Cache |
| **Monitoring** | `backend/internal/services/monitoring/` | Health checks, basic metrics collection | `monitoring.Service` | None |

### Business Logic Services (Application Layer)

| Service | Location | Responsibility | Primary Interface | Dependencies |
|---------|----------|----------------|-------------------|--------------|
| **Chat** | `backend/internal/services/chat/` | AI chat processing, conversation management, session handling | `chat.Service` | Database, Cache, Auth, RAG |
| **Training** | `backend/internal/services/training/` | ML data collection, validation, continuous learning | `training.Service` | Database, Cache |
| **Knowledge** | `backend/internal/services/knowledge/` | Document processing, indexing, file watching | `knowledge.DocumentLoaderService` | RAG, Cache |
| **RAG** | `backend/internal/services/rag/` | Vector search, retrieval augmentation, embedding generation | `rag.RedisRAGService` | Cache |
| **Concurrent** | `backend/internal/services/concurrent/` | Parallel processing, worker pools, rate limiting | `concurrent.Service` | Monitoring |

### Enhanced Services (Optimization Layer)

| Service | Location | Responsibility | Primary Interface | Dependencies |
|---------|----------|----------------|-------------------|--------------|
| **AI** | `backend/internal/services/ai/` | Separate AI orchestration, advanced model selection | `ai.Service` | Cache, Chat |
| **Compliance** | `backend/internal/services/compliance/` | Government regulation compliance, audit trails | `compliance.Service` | Database, Auth |
| **NLP** | `backend/internal/services/nlp/` | Indonesian language processing, text analysis | `nlp.Service` | Cache |
| **Optimization** | `backend/internal/services/optimization/` | Performance tuning, resource optimization | `optimization.Service` | Monitoring, Performance |
| **Performance** | `backend/internal/services/performance/` | Advanced performance monitoring, bottleneck detection | `performance.Service` | Monitoring |
| **Persona** | `backend/internal/services/persona/` | User persona management, personalization | `persona.Service` | Database, Cache |

## Service Boundaries and Responsibilities

### 1. Database Service Boundaries

**Responsibilities:**
- ✅ Connection pooling and management
- ✅ Query execution and optimization
- ✅ Transaction management
- ✅ Schema management and migrations

**Boundaries (What it doesn't do):**
- ❌ Business logic processing
- ❌ Data transformation or validation
- ❌ Caching (handled by Cache service)
- ❌ Authentication (handled by Auth service)

**Integration Points:**
- All services that require data persistence
- Supabase integration
- Connection health monitoring

### 2. Cache Service Boundaries

**Responsibilities:**
- ✅ Multi-level caching (L1 Memory, L2 Redis)
- ✅ Cache key management and invalidation
- ✅ Cache performance monitoring
- ✅ Distributed cache coordination

**Boundaries:**
- ❌ Data persistence (handled by Database)
- ❌ Business logic decisions
- ❌ User session management (handled by Auth)

**Integration Points:**
- All services requiring performance optimization
- Redis/Upstash integration
- Memory management

### 3. Auth Service Boundaries

**Responsibilities:**
- ✅ JWT token validation and generation
- ✅ User session management
- ✅ Role-based access control (RBAC)
- ✅ Security middleware integration

**Boundaries:**
- ❌ Data storage (handled by Database)
- ❌ Caching (handled by Cache)
- ❌ Business logic authorization

**Integration Points:**
- API middleware
- User management systems
- Security monitoring

### 4. Chat Service Boundaries

**Responsibilities:**
- ✅ AI conversation orchestration
- ✅ Message history management
- ✅ Session-aware processing
- ✅ Multi-provider AI integration

**Boundaries:**
- ❌ Raw AI processing (handled by AI service)
- ❌ Document retrieval (handled by RAG)
- ❌ User authentication (handled by Auth)

**Integration Points:**
- AI providers (Groq, HuggingFace)
- RAG service for context
- Training service for data collection

### 5. RAG Service Boundaries

**Responsibilities:**
- ✅ Vector database operations
- ✅ Document embedding generation
- ✅ Similarity search and retrieval
- ✅ Context augmentation for AI

**Boundaries:**
- ❌ Document storage (handled by Knowledge)
- ❌ Raw AI processing (handled by Chat/AI)
- ❌ User interface concerns

**Integration Points:**
- Redis vector database
- Embedding services
- Knowledge base documents

### 6. Training Service Boundaries

**Responsibilities:**
- ✅ ML training data collection
- ✅ Data validation and quality assessment
- ✅ Batch processing and optimization
- ✅ Continuous learning pipeline

**Boundaries:**
- ❌ Model training execution
- ❌ Raw AI inference (handled by Chat/AI)
- ❌ Data persistence (handled by Database)

**Integration Points:**
- Chat service for conversation data
- Database for training data storage
- Quality assessment pipelines

### 7. Enhanced Services Boundaries

#### AI Service
**Responsibilities:**
- ✅ Advanced AI provider orchestration
- ✅ Model performance optimization
- ✅ AI workload distribution
- ✅ Provider failover management

**Boundaries:**
- ❌ User conversation management (handled by Chat)
- ❌ Basic AI processing (handled by Chat)

#### Compliance Service
**Responsibilities:**
- ✅ Government regulation compliance
- ✅ Audit trail management
- ✅ Data sovereignty enforcement
- ✅ Regulatory reporting

**Boundaries:**
- ❌ Core business logic
- ❌ User authentication (handled by Auth)

#### NLP Service
**Responsibilities:**
- ✅ Indonesian language processing
- ✅ Text analysis and understanding
- ✅ Cultural context awareness
- ✅ Language model optimization

**Boundaries:**
- ❌ General AI processing (handled by Chat/AI)
- ❌ Document processing (handled by Knowledge)

#### Optimization Service
**Responsibilities:**
- ✅ System performance tuning
- ✅ Resource utilization optimization
- ✅ Load balancing algorithms
- ✅ Performance bottleneck resolution

**Boundaries:**
- ❌ Basic monitoring (handled by Monitoring)
- ❌ Core business logic

#### Performance Service
**Responsibilities:**
- ✅ Advanced performance analytics
- ✅ Real-time performance monitoring
- ✅ Performance trend analysis
- ✅ Performance alerting

**Boundaries:**
- ❌ Basic health checks (handled by Monitoring)
- ❌ System optimization (handled by Optimization)

#### Persona Service
**Responsibilities:**
- ✅ User profile management
- ✅ Personalization algorithms
- ✅ User behavior analysis
- ✅ Customized experiences

**Boundaries:**
- ❌ User authentication (handled by Auth)
- ❌ Core business logic

## Service Communication Patterns

### Synchronous Communication
```go
// Direct service method calls
chatService := services.Chat
result := chatService.ProcessMessage(ctx, message)

// Service-to-service dependencies
ragService := services.RAG
context := ragService.RetrieveContext(ctx, query, limit)
```

### Asynchronous Communication
```go
// Event-driven communication
concurrentService := services.Concurrent
concurrentService.SubmitTask(task)

// Message queue patterns
trainingService := services.Training
trainingService.QueueTrainingData(data)
```

### Integration Patterns
```go
// Service composition
type ChatService struct {
    aiService      *ai.Service
    ragService     *rag.Service
    trainingService *training.Service
    // ... other dependencies
}

// Health check integration
type HealthChecker struct {
    services *Services
}

func (hc *HealthChecker) CheckAllServices() HealthStatus {
    return HealthStatus{
        Database:    hc.services.Database.IsHealthy(),
        Cache:       hc.services.Cache.IsHealthy(),
        Chat:        hc.services.Chat.IsHealthy(),
        // ... check all services
    }
}
```

## Service Lifecycle Management

### Initialization Order
1. **Infrastructure Services**: Database, Cache, Monitoring
2. **Security Services**: Auth
3. **Core Business Services**: Chat, RAG, Training, Knowledge
4. **Enhanced Services**: AI, Compliance, NLP, Optimization, Performance, Persona
5. **Concurrent Processing**: Worker pools and task queues

### Shutdown Order (Reverse)
1. **Enhanced Services**: Stop accepting new requests
2. **Core Business Services**: Complete in-flight operations
3. **Security Services**: Close sessions gracefully
4. **Infrastructure Services**: Flush caches, close connections

### Health Check Hierarchy
```
System Health
├── Infrastructure Layer
│   ├── Database Health
│   ├── Cache Health
│   └── Monitoring Health
├── Application Layer
│   ├── Auth Health
│   ├── Chat Health
│   ├── RAG Health
│   └── Training Health
└── Optimization Layer
    ├── AI Health
    ├── Compliance Health
    ├── NLP Health
    ├── Optimization Health
    ├── Performance Health
    └── Persona Health
```

## Configuration Management

### Environment Variables by Service

#### Core Services
```bash
# Database
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...

# Cache
REDIS_URL=...
CACHE_TTL_SECONDS=...

# Auth
SUPABASE_JWT_SECRET=...
TOKEN_EXPIRY_HOURS=...

# Monitoring
ENABLE_METRICS=...
METRICS_PORT=...
```

#### Enhanced Services
```bash
# AI Service
ENABLE_HUGGINGFACE=...
HUGGINGFACE_API_KEY=...
GROQ_API_KEY=...

# Compliance
COMPLIANCE_LOG_LEVEL=...
AUDIT_RETENTION_DAYS=...

# NLP
NLP_MODEL_PATH=...
INDONESIAN_DICT_PATH=...

# Performance
PERFORMANCE_MONITORING_INTERVAL=...
ALERT_THRESHOLDS=...
```

## Error Handling and Resilience

### Circuit Breaker Pattern
```go
// Implemented in Concurrent service
circuitBreaker := concurrentService.GetCircuitBreaker()
if circuitBreaker.CanExecute() {
    result, err := riskyOperation()
    if err != nil {
        circuitBreaker.RecordFailure()
    } else {
        circuitBreaker.RecordSuccess()
    }
}
```

### Retry and Fallback Patterns
```go
// Implemented across services
result, err := service.ExecuteWithRetry(ctx, operation, maxRetries)
if err != nil {
    // Fallback to alternative service
    result = fallbackService.Execute(ctx, operation)
}
```

### Error Propagation
```go
// Standardized error handling
type ServiceError struct {
    Service string
    Operation string
    Code string
    Message string
    Timestamp time.Time
}
```

## Monitoring and Observability

### Metrics Collection
```go
// Service-specific metrics
type ServiceMetrics struct {
    RequestsTotal     int64
    RequestsSuccessful int64
    RequestsFailed     int64
    AverageResponseTime float64
    LastHealthCheck   time.Time
}
```

### Logging Standards
```go
// Structured logging across services
logrus.WithFields(logrus.Fields{
    "service":     "chat",
    "operation":   "process_message",
    "user_id":     userID,
    "session_id":  sessionID,
    "response_time_ms": responseTime,
}).Info("Message processed successfully")
```

## Future Considerations

### Service Evolution
- **Microservices Migration**: Plan for potential service extraction
- **API Versioning**: Maintain backward compatibility
- **Feature Flags**: Enable/disable services dynamically

### Scalability Planning
- **Horizontal Scaling**: Service instance multiplication
- **Load Balancing**: Request distribution strategies
- **Resource Optimization**: Memory and CPU utilization

### Security Enhancements
- **Service Mesh**: Istio or similar integration
- **Mutual TLS**: Service-to-service authentication
- **Secrets Management**: Centralized configuration

---

## Appendices

### Appendix A: Service Interface Definitions
### Appendix B: Integration Test Scenarios
### Appendix C: Performance Benchmarks
### Appendix D: Troubleshooting Guide

---

**Document Control**:
- **Author**: Kilo Code Assistant
- **Review Date**: 2025-09-05
- **Approval**: Pending
- **Distribution**: Technical Team, Architecture Review Board

**Related Documents**:
- [Architecture Overview](./architecture-overview.md)
- [Architecture Synchronization Plan](../../plan/2025-08-29-Architecture-Synchronization-Improvement-Plan.md)
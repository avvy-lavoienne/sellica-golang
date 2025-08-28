# SELLY AI Backend Architecture Overview

**Document**: SELLY AI Backend Architecture Reference
**Project Date**: 2025-08-28
**Created**: 2025-08-28
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team

## System Architecture

### High-Level Architecture

SELLY AI backend follows a **modular monolith architecture** designed for high performance, scalability, and maintainability. The system is built in Go and provides 5-10x performance improvements over the previous Next.js implementation.

```
┌─────────────────────────────────────────────────────────────┐
│                    SELLY AI Backend                        │
├─────────────────────────────────────────────────────────────┤
│  HTTP Layer (Gin Router)                                   │
│  ├── Middleware Stack                                       │
│  ├── Authentication & Security                             │
│  └── Request/Response Handling                             │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ├── AI Service (Multi-provider orchestration)             │
│  ├── Chat Service (Conversation management)                │
│  ├── Training Service (ML data collection)                 │
│  ├── Knowledge Service (Document processing)               │
│  ├── RAG Service (Vector search & retrieval)               │
│  └── Concurrent Service (Parallel processing)              │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  ├── Database Service (Supabase integration)               │
│  ├── Cache Service (Multi-level caching)                   │
│  ├── Auth Service (JWT & session management)               │
│  └── Monitoring Service (Performance & health)             │
├─────────────────────────────────────────────────────────────┤
│  External Integrations                                      │
│  ├── Upstash Redis (Caching & Vector DB)                   │
│  ├── Supabase (PostgreSQL database)                        │
│  ├── AI Providers (Groq, HuggingFace, TensorFlow.js)       │
│  └── Indonesian Government Systems                         │
└─────────────────────────────────────────────────────────────┘
```

### Core Services Structure

#### Service Initialization
**File**: `backend/cmd/server/main.go`

```go
type Services struct {
    Database   *database.Service
    Cache      *cache.Service
    Auth       *auth.Service
    Chat       *chat.Service
    Monitoring *monitoring.Service
    Training   *training.Service
    Concurrent *concurrent.Service
    RAG        *rag.RedisRAGService
    Knowledge  *knowledge.DocumentLoaderService
}
```

### Directory Structure

```
backend/
├── cmd/server/              # Application entry point
│   └── main.go             # Server initialization & service orchestration
├── internal/
│   ├── api/
│   │   ├── handlers/       # HTTP request handlers
│   │   ├── middleware/     # HTTP middleware (auth, logging, CORS)
│   │   └── routes/         # Route definitions & setup
│   ├── services/           # Business logic services
│   │   ├── auth/          # Authentication & JWT handling
│   │   ├── cache/         # Multi-level caching (Redis + memory)
│   │   ├── chat/          # AI chat processing & orchestration
│   │   ├── concurrent/    # Parallel processing & worker pools
│   │   ├── database/      # Supabase integration & connection pooling
│   │   ├── knowledge/     # Document loading & indexing
│   │   ├── monitoring/    # Performance monitoring & health checks
│   │   ├── rag/          # Vector search & retrieval augmented generation
│   │   └── training/     # ML training data collection & processing
│   ├── config/           # Configuration management
│   └── utils/            # Utility functions
└── pkg/                  # Public packages
```

## Service Layer Architecture

### 1. AI Service (`internal/services/chat/ai_service.go`)

**Purpose**: Multi-provider AI orchestration with intelligent routing and fallback mechanisms.

**Key Components**:
- **Provider Management**: Dynamic provider selection (Enhanced, Simple, Groq)
- **Fallback System**: Automatic failover between providers
- **Response Variation**: Intelligent response diversification
- **Session Awareness**: Context-aware conversation handling

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

### 2. Chat Service (`internal/services/chat/`)

**Purpose**: Conversation management with AI integration and session handling.

**Key Features**:
- Session-aware conversations
- Message history management
- Concurrent processing integration
- Performance monitoring

### 3. Training Service (`internal/services/training/service.go`)

**Purpose**: ML training data collection, validation, and continuous learning.

**Advanced Components**:
```go
type Service struct {
    collector       *DataCollector
    processor       *BatchProcessor
    validator       *TrainingDataValidator
    analyzer        *QueryAnalyzer
    cache          *TrainingCache
    metrics        *PerformanceMetrics
    supabase       *database.Service
    
    // Phase 2 Advanced Components
    advancedModules    *AdvancedTrainingModules
    indonesianNLP      *IndonesianNLPService
    abTesting          *ABTestingFramework
    modelIntegration   *ModelIntegrationService
}
```

### 4. Knowledge Service (`internal/services/knowledge/document_loader.go`)

**Purpose**: Document processing, indexing, and automatic re-indexing with file watching.

**Key Features**:
- Markdown document parsing
- Automatic chunking and embedding generation
- File system watching for auto re-indexing
- Vector database integration

### 5. RAG Service (`internal/services/rag/redis_rag_service.go`)

**Purpose**: Retrieval Augmented Generation with vector search and intelligent caching.

**Advanced Features**:
- HNSW vector operations for high-performance search
- Multi-level intelligent caching (L1/L2/L3)
- Concurrent vector search
- Query analysis and optimization

## Performance Characteristics

### Response Time Targets
- **Memory Cache**: <1ms
- **Redis Cache**: <30ms
- **Real-time Analysis**: <50ms
- **AI Processing**: <100ms
- **Document Retrieval**: <100ms

### Scalability Features
- **Connection Pooling**: Database connections (10-100 pool size)
- **Worker Pools**: Concurrent processing with configurable workers
- **Circuit Breakers**: Automatic failure handling and recovery
- **Rate Limiting**: Request throttling and load management

### Monitoring & Observability
- **Health Checks**: Comprehensive service health monitoring
- **Performance Metrics**: Real-time performance tracking
- **Error Tracking**: Structured error logging and alerting
- **Cache Analytics**: Multi-level cache performance monitoring

## Configuration Management

**File**: `backend/internal/config/config.go`

```go
type Config struct {
    Server     ServerConfig
    Database   DatabaseConfig
    Cache      CacheConfig
    Auth       AuthConfig
    Monitoring MonitoringConfig
    Logging    LoggingConfig
    Knowledge  KnowledgeConfig
}
```

### Environment Variables
- **SUPABASE_URL**: Database connection URL
- **SUPABASE_SERVICE_ROLE_KEY**: Database service key
- **REDIS_URL**: Upstash Redis connection (rediss:// protocol)
- **SUPABASE_JWT_SECRET**: JWT signing secret
- **PORT**: Server port (default: 8080)
- **GIN_MODE**: Server mode (debug/release)

## Security Architecture

### Authentication Flow
1. **JWT Token Validation**: Supabase JWT verification
2. **Session Management**: Redis-backed session storage
3. **Role-Based Access Control**: Hierarchical permission system
4. **Security Headers**: Comprehensive security middleware

### Indonesian Government Compliance
- **Data Sovereignty**: All data remains in Indonesian jurisdiction
- **Encryption Standards**: AES-256-GCM for data at rest, TLS 1.3 for transit
- **Audit Logging**: Comprehensive audit trails for government interactions
- **Cultural Protocols**: Indonesian language and government communication standards

## Next Steps

This architecture overview provides the foundation for understanding the SELLY AI backend system. For detailed implementation specifics, refer to the following reference documents:

- [AI Service Integration](./ai-service-integration.md)
- [Data Flow Diagrams](./data-flow-diagrams.md)
- [Caching Strategy](./caching-strategy.md)
- [Database Patterns](./database-patterns.md)
- [Authentication & Security](./authentication-security.md)
- [Error Handling Patterns](./error-handling-patterns.md)
- [Performance Optimization](./performance-optimization.md)
- [API Reference](./api-reference.md)

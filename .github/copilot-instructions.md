# SELLY AI Codebase Instructions

## Project Architecture Overview

**SELLY** is a high-performance civil records management system with AI chat capabilities, built as a **monorepo with frontend/backend separation**:

- **`backend/`**: Go-based API server (migrated from Next.js for 20x performance improvement)
- **`frontend/`**: Next.js 15 TypeScript React application with Tailwind CSS
- **`selly-legacy-nextjs-backend/`**: Legacy Next.js API routes (being migrated to Go)

### Key Performance Context
The Go backend achieved **20.25x throughput improvement** over Next.js (126-405 RPS vs 20-50 RPS) with **289x faster response times** (1.7-28ms vs 500-2000ms).

## Development Workflows

### Backend Development (Go)
```bash
cd backend
make all              # Full build pipeline (clean, deps, fmt, lint, test, build)
make run             # Development server on :8080
make docker-build    # Build Docker image
docker-compose up -d # Start with Redis
```

### Frontend Development (Next.js)
```bash
cd frontend
pnpm dev             # Development server on :3000
pnpm build:optimized # Production build
pnpm test:enhanced   # Comprehensive test suite
```

### Critical Commands
- **Go Backend**: Use `make` targets exclusively - they include performance validation
- **Database**: Supabase PostgreSQL with RLS policies
- **Cache**: Redis with intelligent multi-level caching (L1: <1ms, L2: <50ms, L3: <200ms)
- **AI Services**: Multi-provider architecture (HuggingFace, OpenAI, local models)

## Code Organization Patterns

### Go Backend Structure (`backend/`)
```
cmd/server/main.go           # Application entry point with service initialization
internal/
├── api/handlers/           # HTTP request handlers (Gin framework)
├── services/              # Business logic services
│   ├── chat/              # Multi-provider AI chat service
│   ├── rag/              # RAG (Retrieval-Augmented Generation)
│   ├── cache/            # Redis caching with smart TTL
│   ├── auth/             # JWT authentication
│   └── monitoring/       # Performance metrics
├── config/               # Environment-based configuration
└── testutils/           # Testing utilities
```

### Service Dependency Pattern
Services follow **dependency injection** with interface-based design:
```go
type Service struct {
    db       *database.Service
    cache    *cache.Service
    ai       *AIService
    rag      *rag.RedisRAGService
}
```

### Frontend Structure (`frontend/`)
```
src/
├── app/                  # Next.js App Router
├── components/           # Reusable UI components
├── services/            # API client services
├── lib/                 # Utilities and configurations
└── scripts/             # Build and deployment scripts
```

## Critical Integration Points

### AI Service Architecture
The chat service uses **multi-provider fallback chains**:
1. **Enhanced Provider** (for complex queries)
2. **Indonesian Provider** (HuggingFace for Bahasa Indonesia)
3. **Basic Provider** (fallback)

Example pattern in `backend/internal/services/chat/service.go`:
```go
func (s *Service) ProcessQuery(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {
    provider := s.selectBestProvider(req)
    response, err := s.processWithProvider(ctx, provider, req)
    if err != nil {
        return s.fallbackToNextProvider(ctx, req, provider)
    }
    return response, nil
}
```

### Cache Strategy
Three-tier caching with Redis:
- **L1**: In-memory (Go-cache) for <1ms responses
- **L2**: Redis for session data (<50ms)
- **L3**: Database with Redis caching (<200ms)

### Database Patterns
- **Supabase PostgreSQL** with Row Level Security (RLS)
- **Connection pooling** configured in `internal/config/config.go`
- **Migration scripts** in `migrations/` directory

## Indonesian Localization Requirements

**Critical**: All user-facing messages must be in **Bahasa Indonesia**:
- Error responses: Use Indonesian error messages
- Chat responses: Detect language and respond appropriately
- UI text: Follow existing Indonesian patterns in `frontend/src/`

## Testing & Validation

### Performance Testing
```bash
# Backend performance validation
cd backend && make test
./bin/test-rag                    # RAG performance test
./bin/comprehensive-phase3-validation # Full system validation

# Frontend performance
cd frontend && pnpm test:performance
```

### Load Testing Targets
- **Concurrent Users**: 500+ (validated)
- **Response Time**: <50ms for simple endpoints, <200ms for AI chat
- **Throughput**: 300+ RPS sustained
- **Error Rate**: 0% (government compliance requirement)

## Deployment Patterns

### Static Frontend Deployment
Use `deployment/prepare-static-deployment.ps1` for CDN deployment:
- Generates optimized static build in `deployment/static-build/`
- 35 static HTML pages, ~15.2MB total
- Works with any CDN (Netlify, Cloudflare, etc.)

### Backend Deployment
Docker-based with health checks:
```yaml
# docker-compose.yml pattern
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:8080/health/simple"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Migration Context

When working with legacy code in `selly-legacy-nextjs-backend/`:
- **DO NOT** extend legacy patterns - migrate to Go backend
- Reference `.augment/rules/selly-specific-migration-patterns.md` for migration patterns
- Maintain API compatibility during migration phases

## Environment Configuration

### Required Environment Variables
```bash
# Backend (.env in backend/)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
REDIS_URL=redis://localhost:6379
PORT=8080

# Frontend (.env.local in frontend/)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
```

### Performance Monitoring
Monitor these key metrics:
- **Response Time**: Backend <50ms, Frontend <300ms
- **Memory Usage**: Backend <100MB, Frontend <500MB
- **Cache Hit Rate**: >85% for optimal performance
- **Error Rate**: 0% (government requirement)

Always validate performance after changes using `make test` in backend and `pnpm validate:performance` in frontend.

# SELLICA Constitution

## Core Principles

### I. Service-Oriented Architecture
Every backend feature MUST be implemented as a standalone service in `backend/internal/services/`; Services must be self-contained with clear interfaces, independently testable, and fully documented; Service initialization follows dependency order in `cmd/server/main.go`; All services must implement health checks and expose metrics for observability.

### II. Performance-First Development
All changes must maintain or improve existing performance baselines: 20-289x faster than legacy Next.js API routes; Response times MUST be <50ms for simple operations, <100ms for complex operations; Memory usage MUST remain under 100MB per instance; Zero error rate under load (500+ concurrent users); All endpoints require load testing validation.

### III. Hybrid Monorepo Architecture
Frontend (Next.js 15) and Backend (Go 1.23) are separate but integrated; Frontend can integrate via direct Supabase calls OR Go backend API calls; Static-first SSR/SSG for frontend deployment to CDN; Backend outputs to `backend/exe/` directory (MANDATORY); Use pnpm (MANDATORY) for all frontend package management.

### IV. Indonesian Government Compliance
User-facing content MUST be in Indonesian (bahasa baku); Technical documentation in English; Data sovereignty: ONLY ap-southeast-1 or ap-southeast-3 regions allowed; All Supabase calls must validate region compliance; Cultural validation system (90%+ quality score) for all AI-generated content; Document compliance with government standards.

### V. Test-First Development (NON-NEGOTIABLE)
Backend tests in `backend/test/{unit,integration,performance,e2e}/`; Frontend tests in `frontend/src/__tests__/` or co-located; TDD cycle: Tests written → User approved → Tests fail → Then implement; Performance benchmarks MUST pass before merging; Zero breaking changes to existing functionality; Integration tests required for service communication.

## Technology Stack Requirements

### Backend Stack (MANDATORY)
- **Language**: Go 1.23.0+ (windows/amd64)
- **Framework**: Gin (web framework)
- **Database**: Supabase (PostgreSQL with RLS policies)
- **Cache**: Redis (Upstash for production) with automatic fallback to in-memory
- **Authentication**: JWT validation via Supabase secrets, RBAC enforcement
- **WebSocket**: Real-time updates with room-based broadcasting
- **Monitoring**: Prometheus metrics, structured logging (logrus)
- **Services**: 23+ modular services (auth, cache, database, eventbus, websocket, silpana, etc.)

### Frontend Stack (MANDATORY)
- **Framework**: Next.js 15.3.0 with App Router
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm 10.14.0 (NO npm or yarn)
- **UI Libraries**: Radix UI, Tailwind CSS, Flowbite Pro components
- **State Management**: TanStack React Query v5
- **Authentication**: Supabase SSR with session management
- **Build Target**: Static export for CDN deployment
- **Node Version**: 22.18.0 (v22.x)

### Development Environment (MANDATORY)
- **OS**: Windows 11
- **Shell**: PowerShell 5.1 (use `;` for command chaining)
- **IDE**: Visual Studio Code
- **Containerization**: Docker Compose (Redis, Prometheus, Grafana)

## Performance Standards

### Response Time Targets
- Simple health checks: <10ms (validated: 7.12ms avg)
- Metrics endpoints: <20ms (validated: 10.53ms avg)
- Chat API operations: <30ms (validated: 28.47ms avg)
- Database operations: <100ms (validated: 93.16ms avg)
- WebSocket latency: <50ms for real-time updates

### Throughput Requirements
- Minimum RPS: 126+ requests per second
- Target RPS: 300+ requests per second
- Concurrent users: 500+ without errors
- Cache hit ratio: 85%+ (current: 20%, needs optimization)

### Resource Constraints
- Memory usage: 50-100MB per instance
- CPU usage: Efficient under concurrent load
- Cold start: <100ms (20-50x faster than Next.js)
- Error rate: 0% under normal operations

## Security & Compliance

### Authentication & Authorization
- JWT-based authentication via Supabase
- Role-Based Access Control (RBAC) enforcement
- Session management with automatic cleanup
- Row-Level Security (RLS) policies in Supabase
- Anonymous user support for SILPANA submissions (with RLS checks)

### Data Protection
- All environment variables in `.env` files (NEVER commit)
- Sensitive keys: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, REDIS_URL
- TLS for all external connections (rediss:// for Redis)
- Content Security Policy headers configured
- CORS configuration for frontend-backend communication

### Regional Compliance
- Data residency: ap-southeast-1 or ap-southeast-3 ONLY
- Supabase region validation in all database calls
- Government standards documentation required
- Indonesian language for all user-facing errors

## Development Workflow

### File Organization (MANDATORY)
- Backend tests: `/backend/test/{unit,integration,performance,e2e}/`
- Backend docs: `/backend/docs/YYYY-MM-DD-{title}.md`
- Frontend tests: `/frontend/src/__tests__/` or co-located
- Frontend docs: `/frontend/docs/YYYY-MM-DD-{title}.md`
- Root docs: `/docs/CATEGORY-DESCRIPTIVE-TITLE.md` (ALL-CAPS)
- Executables: `/backend/exe/` (NOT in root, bin/, or build/)

### Git Commit Convention (MANDATORY)
Three-step process: `git add .` → `git commit -m "type(scope): message"` → `git push`
- **Types**: feat, fix, docs, style, refactor, test, chore
- **Example**: `feat(silpana): add real-time WebSocket updates`
- Documentation updates REQUIRED before committing implementation

### Code Quality Gates
- All tests must pass (unit, integration, performance)
- Zero markdown linting errors in documentation
- Performance benchmarks must meet or exceed targets
- No breaking changes to existing functionality
- Health checks and metrics endpoints required for new services
- Load testing validation for new endpoints

### PowerShell Development Rules
- Use `;` for command chaining (NOT `&&`)
- Environment variables: `$env:VARIABLE_NAME = "value"`
- Always use forward slashes `/` in code for cross-platform compatibility
- Use absolute paths with `d:\` for system commands
- Prefer PowerShell 5.1 syntax in documentation

## Service Implementation Pattern

### Required Service Components
1. **Interface Definition** (`interface.go`): Clear service contract
2. **Service Implementation** (`service.go`): Core business logic
3. **Adapter Pattern**: External dependency abstractions for testability
4. **Factory Pattern** (`factory.go`): Service initialization and validation
5. **Operations Export** (`operations.go`): Public API methods
6. **Health Checks**: Service health endpoint
7. **Metrics Collection**: Performance metrics integration

### Service Registration
- Update `initializeServices()` in `cmd/server/main.go`
- Update `routes.GetServices()` in `internal/api/routes/routes.go`
- Add health check endpoint: `GET /service-name/health`
- Add metrics endpoint if applicable
- Document in `backend/README.md`

## Error Handling Standards

### Error Message Format
- **User-facing**: Indonesian message (e.g., "gagal menyimpan tiket")
- **Technical logs**: English debug info for developers
- **Example**: `return nil, fmt.Errorf("gagal menyimpan tiket: %w", err)`
- **Logging**: `logrus.WithError(err).Error("Failed to save ticket: database timeout")`

### Error Response Structure
Frontend receives Indonesian message; Logs contain English technical detail; HTTP status codes follow REST conventions; Include request ID for tracing.

## Deployment Requirements

### Backend Deployment
- Build command: `go build -o exe/selly-backend.exe cmd/server/main.go`
- Health endpoint: `http://localhost:8080/health`
- Metrics endpoint: `http://localhost:8080/metrics`
- Docker Compose for local development (includes Redis, Prometheus, Grafana)
- Environment variables validated on startup

### Frontend Deployment
- Build command: `pnpm build` (outputs to `deployment/static-build/`)
- Static export: 1,247 files, ~15.2 MB optimized
- CDN deployment ready (Netlify, Cloudflare, Vercel)
- All pages load under 300ms
- SEO score: 100%

## Governance

### Constitution Authority
This constitution supersedes all other development practices; All code reviews MUST verify compliance with these principles; Amendments require documentation, team approval, and migration plan; Feature development must align with performance and compliance standards.

### Exception Process
Performance regressions require written justification and approval; Breaking changes require migration path documentation; Technology stack changes require architecture review; Regional compliance violations are NON-NEGOTIABLE.

### Runtime Guidance
Refer to `.github/copilot-instructions.md` for detailed development guidance (1700+ lines); Use `backend/README.md` for API endpoint documentation; Check `docs/` for project-wide architectural decisions; Follow phase completion reports for current project status.

**Version**: 1.0.0 | **Ratified**: 2025-10-28 | **Last Amended**: 2025-10-28

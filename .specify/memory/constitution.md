<!--
Sync Impact Report - Constitution Update v1.1.1
===============================================
Version Change: 1.1.0 → 1.1.1 (PATCH - Documentation Path Clarification)
Date: 2025-11-08

Modified Principles:
  - None (principles remain unchanged)

Modified Sections:
  - Development Workflow Standards > File Organization Standards
    - Clarified dated workflow documentation path structure
    - Changed from: `docs/bydate/YYYY-MM-DD-{TOPIC-NAME}/`
    - Changed to: `docs/bydate/YYYY-MM-DD/{topic-name}/`
    - Updated topic folder naming examples to reflect actual repository structure
    - Noted that topic name can optionally include date prefix

Added Sections:
  - None (clarification only)

Removed Sections:
  - None

Templates Requiring Updates:
  ✅ spec-template.md - No changes needed
  ✅ plan-template.md - No changes needed
  ✅ tasks-template.md - No changes needed
  ✅ checklist-template.md - No changes needed
  ✅ agent-file-template.md - No changes needed

Follow-up TODOs:
  - None - Path structure now accurately documented
  
Bump Rationale:
  PATCH version bump (1.1.0 → 1.1.1) because:
  - Clarification of existing documentation path structure (not new guidance)
  - Corrected path format to match actual repository structure
  - No semantic changes (same organizational principle, just clarified notation)
  - Typo/formatting correction level change
  - Examples updated to reflect real paths in repository
-->

# SELLICA Constitution

## Core Principles

### I. Service-Oriented Architecture

**Every backend feature MUST be implemented as a standalone service** in `backend/internal/services/[service-name]/`.

Services MUST:
- Be self-contained with clear single responsibility
- Implement adapter pattern for external dependencies (database, cache, monitoring)
- Include factory pattern for initialization (`NewService()`)
- Export operations through well-defined interfaces
- Be independently testable with mock adapters
- Initialize in dependency order in `cmd/server/main.go`

Services MUST be registered in BOTH:
- `initializeServices()` - for service initialization
- `routes.GetServices()` - for route handler access

**Rationale**: The 23+ service architecture (database, cache, auth, eventbus, websocket, silpana, etc.) enables independent development, testing, and performance optimization. This pattern has proven successful in achieving 20-289x performance improvements over monolithic Next.js API routes.

### II. Performance-First Design (NON-NEGOTIABLE)

**All implementations MUST maintain or exceed established performance baselines.**

Performance Requirements:
- Response time: <50ms for API endpoints (target achieved: 1.7-28ms)
- Throughput: 20x improvement over Next.js baseline (target achieved: 20.25x)
- Cache hit ratio: >85% target (current optimization focus: 20% → 85%)
- Zero error rate under load (500+ concurrent users)
- Memory usage: <100MB for Go backend services

Every new feature MUST:
- Include performance benchmarks using `go test -bench=.`
- Document baseline metrics in implementation report
- Run load testing with `backend/scripts/load-testing/benchmark_test.go`
- Monitor with `/metrics` and `/health` endpoints
- Use multi-level caching (L1 memory, L2 Redis, L3 long-term)

**Rationale**: SELLICA's value proposition is high-performance civil records management. Performance regressions directly impact user productivity and government service delivery. The 20-289x improvement validates this approach.

### III. Hybrid Monorepo Structure

**Frontend and backend are architecturally separate but operationally integrated.**

Frontend (`frontend/`):
- Next.js 15 with TypeScript
- Tailwind CSS + Flowbite components from `templates/flowbite-pro-nextjs-admin-dashboard-1.2.2/`
- **pnpm MANDATORY** (no npm or yarn)
- Static-first SSR/SSG for performance
- Two integration patterns:
  1. Direct Supabase calls for anonymous/public operations (e.g., SILPANA form submissions)
  2. Go backend API calls for authenticated operations (e.g., `/api/v1/chat`, `/api/v1/auth/*`)

Backend (`backend/`):
- Go 1.23+ for high-performance API layer
- Supabase Go client with connection pooling (10-100 connections)
- Multi-level caching with automatic Redis fallback to memory
- Service-oriented architecture (23+ services)
- Executables MUST be in `backend/exe/` directory

**Rationale**: Separation allows independent optimization while maintaining integration simplicity. Frontend serves UI fast, backend handles heavy computation and database operations efficiently.

### IV. Indonesian Government Compliance (NON-NEGOTIABLE)

**All user-facing content MUST be in Indonesian (bahasa baku).**

Language Requirements:
- UI text: Indonesian only (MANDATORY)
- Error messages: Indonesian for user display + English for debug logs
- Documentation: Technical docs in English, user guides in Indonesian
- Code comments: English (for international collaboration)

Data Sovereignty Requirements:
- Supabase region: ONLY `ap-southeast-1` or `ap-southeast-3` allowed
- All data must remain in Indonesian jurisdiction
- Compliance documentation required in `docs/` referencing government standards

Error Handling Pattern:
```go
// Indonesian user message + English technical detail
return nil, fmt.Errorf("gagal menyimpan tiket: %w", err)
logrus.WithError(err).Error("Failed to save ticket: database timeout")
```

**Rationale**: SELLICA is a government civil records system. Compliance with Indonesian language and data sovereignty requirements is legally mandatory and non-negotiable.

### V. Component Reusability & Minimalism

**Create as few components as possible; reuse existing components and styles maximally.**

Component Guidelines:
- Reuse Flowbite components from `templates/flowbite-pro-nextjs-admin-dashboard-1.2.2/`
- Extract common patterns into shared utilities only when used 3+ times
- No redundant components with similar functionality
- Backend services reuse adapters (database, cache, monitoring) instead of duplicating logic

Testing Policy:
- **No unit tests required** for simple CRUD operations
- Integration tests ONLY for critical paths (authentication, payment, data integrity)
- Performance benchmarks for all backend endpoints (MANDATORY)
- Load testing for production-critical features

**Rationale**: Reduces maintenance burden, ensures consistency, speeds up development. Testing effort focuses on performance and integration rather than exhaustive unit coverage, aligning with project pragmatism.

## Technology Stack Constraints

### Frontend Stack (NON-NEGOTIABLE)

**Required Technologies**:
- Next.js 15.x
- TypeScript (strict mode)
- pnpm 10.14.0+ (MANDATORY - never npm/yarn)
- Tailwind CSS
- Flowbite components from `templates/flowbite-pro-nextjs-admin-dashboard-1.2.2/`

**Supabase Integration**:
- Project URL: `https://supabase.com/dashboard/project/yrssspoimsxpibcbeaca`
- Direct Supabase calls for:
  - Anonymous form submissions (SILPANA)
  - Public data queries with RLS policies
- Go backend API calls for:
  - Authentication (`/api/v1/auth/*`)
  - Protected operations requiring RBAC
  - Real-time WebSocket updates

### Backend Stack (NON-NEGOTIABLE)

**Required Technologies**:
- Go 1.23+ (windows/amd64 for development, linux/amd64 for production)
- Supabase Go client with enhanced QueryOptions
- Redis for distributed caching (with memory fallback)
- Gin web framework for HTTP routing
- Logrus for structured logging

**Deployment Requirements**:
- Docker Compose for local development (includes Redis, Prometheus, Grafana)
- Executables in `backend/exe/` directory
- Health checks at `/health`, `/health/live`, `/health/ready`
- Metrics at `/metrics` (Prometheus format)
- Build command: `go build -o exe/selly-backend.exe cmd/server/main.go`

### Development Environment (NON-NEGOTIABLE)

**Windows 11 Specific**:
- PowerShell 5.1 (Windows PowerShell) for terminal
- VS Code with Go and TypeScript extensions
- Command chaining: Use `;` not `&&` (PowerShell syntax)
- Environment variables: `$env:VARIABLE_NAME = "value"`
- File paths: Forward slashes `/` in code for cross-platform compatibility

## Development Workflow Standards

### Git Workflow (MANDATORY)

**Three-step commit process**:
```powershell
# 1. Stage all changes
git add .

# 2. Commit with conventional format
git commit -m "feat(service-name): description"

# 3. Push to feature branch
git push origin feat/branch-name
```

**Commit Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code formatting (no logic change)
- `refactor` - Code restructuring (no behavior change)
- `test` - Adding/updating tests
- `chore` - Maintenance tasks

**Documentation Updates**:
- REQUIRED before committing when implementing from specs
- Update source documentation that guided implementation
- Follow naming convention: `YYYY-MM-DD-{descriptive-title}.md`

### Service Implementation Workflow

When adding new backend services:

1. **Create service directory**: `backend/internal/services/[service-name]/`
2. **Implement required files**:
   - `interface.go` - Service interface definition
   - `service.go` - Service struct implementation
   - `factory.go` - Factory pattern for initialization
   - `operations.go` - Public operations
   - `*_adapter.go` - Adapter pattern for external dependencies
3. **Update initialization**:
   - Add to `cmd/server/main.go::initializeServices()`
   - Add to `internal/api/routes/routes.go::GetServices()`
4. **Add health check**: Implement health check endpoint
5. **Add metrics**: Integrate with monitoring service
6. **Document**: Create README.md in service directory

**Example Reference**: See `backend/internal/services/silpana/` for complete adapter pattern implementation.

### Performance Testing Workflow (MANDATORY)

**Before merging any feature**:

1. **Run baseline benchmarks**:
   ```powershell
   cd backend
   go test -bench=. -benchmem -count=3 ./scripts/load-testing/
   ```

2. **Validate against targets**:
   - Compare with `backend/PHASE3-IMPLEMENTATION-REPORT.md`
   - Response time MUST be <50ms
   - Error rate MUST be 0%
   - Memory usage MUST be <100MB per service

3. **Check cache efficiency**:
   ```powershell
   curl http://localhost:8080/cache/stats
   ```
   - Cache hit ratio target: >85% (current focus: 20% → 85%)

4. **Review monitoring dashboard**:
   - Grafana: `http://localhost:3001` (admin/admin)
   - Validate metrics are being collected

### File Organization Standards (MANDATORY)

**Backend**:
- Tests: `/backend/test/{unit,integration,performance,e2e}/`
- Docs: `/backend/docs/YYYY-MM-DD-{title}.md` (simple dated docs)
- Executables: `/backend/exe/` (NOT in root, bin/, or build/)
- Services: `/backend/internal/services/{service-name}/`

**Frontend**:
- Tests: `/frontend/src/__tests__/` or co-located `__tests__/`
- Docs: `/frontend/docs/YYYY-MM-DD-{title}.md` (simple dated docs)
- Components: `/frontend/src/components/` (reuse Flowbite from templates/)

**Root-level docs** (`docs/`):

*For project-wide reference documentation*:
- Category docs: `docs/CATEGORY-DESCRIPTIVE-TITLE.md` (ALL-CAPS, hyphenated)
- Examples: `SILPANA-ARCHITECTURE-ANALYSIS.md`, `PHASE4-LAUNCH-SUMMARY.md`

*For dated workflow documentation* (MANDATORY structure):
- Location: `docs/bydate/YYYY-MM-DD/{topic-name}/`
- Organization: Date folders containing topic folders with Speckit-command subfolders
- Structure:
  ```
  docs/bydate/YYYY-MM-DD/{topic-name}/
  ├── README.md                    # Navigation guide
  ├── YYYY-MM-DD-{main-doc}.md    # Primary reference doc
  ├── speckit-plan/               # Planning & design docs
  │   ├── YYYY-MM-DD-research.md
  │   ├── YYYY-MM-DD-data-model.md
  │   ├── YYYY-MM-DD-quickstart.md
  │   └── contracts/
  ├── speckit-analyze/            # Analysis & investigation
  │   ├── YYYY-MM-DD-root-cause-analysis.md
  │   └── YYYY-MM-DD-architecture-analysis.md
  ├── speckit-implement/          # Implementation & verification
  │   ├── YYYY-MM-DD-phase-1-implementation.md
  │   └── YYYY-MM-DD-build-verification.md
  ├── speckit-specify/            # Feature specifications
  ├── speckit-clarify/            # Requirements clarification
  ├── speckit-constitution/       # Compliance checks
  ├── speckit-checklist/          # Quality checklists
  └── speckit-tasks/              # Task planning & tracking
  ```

**Topic Folder Naming**:
- Format: `docs/bydate/YYYY-MM-DD/{topic-name}/`
- Topic name can optionally include date prefix: `YYYY-MM-DD-{descriptive-topic}` or just `{descriptive-topic}`
- Use kebab-case for descriptive topic names
- Examples: 
  - `docs/bydate/2025-11-02/2025-11-02-topnav-auth-display-bug/`
  - `docs/bydate/2025-11-06/indexing-audit/`
  - `docs/bydate/2025-11-05/jwt-audit/`

**Document Naming Within Topics**:
- Format: `YYYY-MM-DD-{descriptive-title}.md`
- Use same date as topic folder for consistency
- Descriptive titles indicate content type (research, analysis, implementation, etc.)

**Speckit Command Outputs** (organized by subfolder):
- `/speckit.plan` → `speckit-plan/` (research.md, data-model.md, contracts/, quickstart.md)
- `/speckit.analyze` → `speckit-analyze/` (root-cause, architecture, impact docs)
- `/speckit.implement` → `speckit-implement/` (phase implementations, verification)
- `/speckit.specify` → `speckit-specify/` (feature specs, API definitions)
- `/speckit.clarify` → `speckit-clarify/` (requirements, scope clarifications)
- `/speckit.constitution` → `speckit-constitution/` (compliance checks)
- `/speckit.checklist` → `speckit-checklist/` (phase checklists)
- `/speckit.tasks` → `speckit-tasks/` (task planning, tracking)

**Rationale**: Topic-based folders with workflow subfolders enable:
- Clear organization by feature/bug topic
- Easy navigation by workflow stage
- Scalability (no file name collisions)
- Traceability of Speckit command outputs
- Enterprise-grade documentation management

**CI/CD validates file placement** - automated warnings for violations.

## Governance

### Amendment Process

1. **Proposal**: Document proposed change with rationale
2. **Impact Analysis**: Identify affected artifacts and code
3. **Version Bump Decision**:
   - MAJOR: Backward-incompatible governance/principle removals or redefinitions
   - MINOR: New principle/section added or materially expanded guidance
   - PATCH: Clarifications, wording, typo fixes, non-semantic refinements
4. **Sync Update**: Update constitution + all dependent templates
5. **Review**: Verify no remaining placeholder tokens
6. **Commit**: Use format `docs: amend constitution to vX.Y.Z (description)`

### Compliance Verification

**Every PR/review MUST verify**:
- Service-oriented architecture followed (services in correct directory)
- Performance benchmarks included and passing
- Indonesian language used for user-facing content
- pnpm used (not npm/yarn) for frontend dependencies
- Component reusability maximized (no redundant components)
- File organization follows standards

**Complexity Justification**:
- Any deviation from constitution MUST be explicitly justified
- Performance requirements take precedence over code simplicity
- Indonesian compliance is NON-NEGOTIABLE

### Runtime Development Guidance

For detailed runtime guidance, consult:
- `.github/copilot-instructions.md` - Comprehensive development guide (938 lines)
- `.github/instructions/instructions.md` - Full development rules (1700+ lines)
- `deployment/DEPLOYMENT-GUIDE.md` - Production deployment procedures

**Version**: 1.1.1 | **Ratified**: 2025-11-08 | **Last Amended**: 2025-11-08

# SELLICA Constitution v1.2.0

## Core Principles

### I. Service-Oriented Architecture
**Every backend feature MUST be implemented as a standalone service** in `backend/internal/services/[service-name]/`.

Services MUST:
- Be self-contained with clear single responsibility
- Implement adapter pattern for external dependencies
- Include factory pattern (`NewService()`)
- Export operations through interfaces
- Be independently testable
- Initialize in dependency order in `cmd/server/main.go`
- Be registered in `initializeServices()` and `routes.GetServices()`

**Rationale**: Enables independent development, testing, and optimization (20-289x perf improvement).

### II. Performance-First Design (NON-NEGOTIABLE)
**All implementations MUST maintain or exceed established performance baselines.**

Requirements:
- Response time: <50ms (API)
- Throughput: 20x > Next.js baseline
- Cache hit ratio: >85%
- Zero error rate under load
- Memory usage: <100MB/service

New features MUST:
- Include benchmarks (`go test -bench=.`)
- Document baseline metrics
- Run load testing
- Monitor with `/metrics` and `/health`
- Use multi-level caching (L1/L2/L3)

**Rationale**: High-performance civil records management is the core value proposition.

### III. Hybrid Monorepo Structure
**Frontend and backend are architecturally separate but operationally integrated.**

Frontend (`frontend/`):
- Next.js 15 + TS + Tailwind + Flowbite
- **pnpm MANDATORY**
- Static-first SSR/SSG
- Direct Supabase calls for public/anon ops
- Go backend API calls for auth/protected ops

Backend (`backend/`):
- Go 1.23+
- Supabase Go client (pooled)
- Multi-level caching (Redis + Mem)
- Service-oriented architecture
- Executables in `backend/exe/`

**Rationale**: Independent optimization with integration simplicity.

### IV. Indonesian Government Compliance (NON-NEGOTIABLE)
**All user-facing content MUST be in Indonesian (bahasa baku).**

Requirements:
- UI text: Indonesian only
- Error messages: Indonesian (user) + English (debug)
- Docs: Tech (English), User (Indonesian)
- Data Sovereignty: `ap-southeast-1` or `ap-southeast-3` ONLY
- Compliance docs in `docs/`

**Rationale**: Legal mandate for government civil records system.

### V. Component Reusability & Minimalism
**Create as few components as possible; reuse existing components and styles maximally.**

Guidelines:
- Reuse Flowbite components
- Extract utilities only if used 3+ times
- No redundant components
- Backend services reuse adapters

Testing:
- **No unit tests** for simple CRUD
- Integration tests for critical paths
- Performance benchmarks MANDATORY
- Load testing for critical features

**Rationale**: Focus on performance and integration; reduce maintenance.

### VI. Supabase Infrastructure Documentation (NON-NEGOTIABLE)
**All Supabase schema, policies, and configurations MUST be documented and kept in sync.**

Requirements (`docs/backend/docs/reference/supabase-reference/`):
- Tables (`table-reference.json`)
- Columns (`column-reference.json`)
- RLS Policies (`RLS-reference.json`)
- Storage Buckets (`bucket-reference.json`)
- Functions (`functions-reference.json`)
- Triggers (`trigger-reference.json`)

Protocol:
- Consult docs BEFORE implementation
- Update docs IMMEDIATELY when changing schema
- Document RLS policies (MANDATORY)
- Credentials in `.env` (never code)

**Rationale**: RLS is primary security; documentation prevents security holes and debugging nightmares.

## Technology Stack Constraints

### Frontend (NON-NEGOTIABLE)
- Next.js 15.x, TypeScript (strict), **pnpm 10.14.0+**, Tailwind CSS, Flowbite
- Supabase: Direct for public/anon; Go API for protected/auth

### Backend (NON-NEGOTIABLE)
- Go 1.23+, Supabase Go client, Redis, Gin, Logrus
- Docker Compose, Executables in `backend/exe/`
- Health checks (`/health`), Metrics (`/metrics`)

### Development Environment
- Windows 11, PowerShell 5.1
- VS Code (Go/TS extensions)
- Command chaining: `;`
- Env vars: `$env:VAR = "val"`
- Paths: Forward slashes `/`

## Development Workflow Standards

### Git Workflow (MANDATORY)
1. Stage: `git add .`
2. Commit: `git commit -m "type(scope): desc"`
   - Types: feat, fix, docs, style, refactor, test, chore
3. Push: `git push origin feat/branch`

**Docs Updates**: REQUIRED before commit. Format: `YYYY-MM-DD-{title}.md`

### Service Implementation
1. Create `backend/internal/services/[name]/`
2. Implement: `interface.go`, `service.go`, `factory.go`, `operations.go`, `*_adapter.go`
3. Register in `main.go` and `routes.go`
4. Add health check and metrics
5. Create README.md

### Performance Testing (MANDATORY)
Before merge:
1. Run benchmarks: `go test -bench=.`
2. Validate: <50ms resp, 0% errors, <100MB mem
3. Check cache: >85% hit ratio
4. Review Grafana metrics

### File Organization (MANDATORY)
- Backend: `test/`, `docs/`, `exe/`, `internal/services/`
- Frontend: `src/__tests__/`, `docs/`, `src/components/`
- Root Docs: `docs/CATEGORY-TITLE.md` or `docs/bydate/YYYY-MM-DD/{topic}/`

**Dated Docs Structure**:
`docs/bydate/YYYY-MM-DD/{topic}/` contains:
- `README.md`, `YYYY-MM-DD-{main}.md`
- Subfolders: `speckit-plan`, `speckit-analyze`, `speckit-implement`, `speckit-specify`, `speckit-constitution`, `speckit-tasks`

**Rationale**: Scalable, organized, traceable documentation.

## Governance

### Amendment Process
1. Proposal & Impact Analysis
2. Version Bump (MAJOR/MINOR/PATCH)
3. Sync Update & Review
4. Commit: `docs: amend constitution to vX.Y.Z`

### Compliance Verification
Verify: SOA, Perf benchmarks, Indonesian language, pnpm, Reusability, File org.
**Complexity Justification**: Deviations must be justified. Perf > Simplicity. Compliance is NON-NEGOTIABLE.

### Runtime Guidance
See `.github/copilot-instructions.md`, `.github/instructions/instructions.md`, `deployment/DEPLOYMENT-GUIDE.md`

# SELLY-AI Project Constitution
<!-- Civil Records Management System with AI Assistance Capabilities -->

## Core Principles

### I. Service-Oriented Architecture (NON-NEGOTIABLE)
**Every feature is a modular service with clear boundaries and responsibilities.**

- All backend services reside in `backend/internal/services/` with standardized structure
- Services implement adapter pattern for external dependencies (database, cache, monitoring)
- Each service must have: `interface.go`, `service.go`, `factory.go`, `operations.go`
- Services communicate via EventBus pub/sub pattern for loose coupling
- New services must be registered in BOTH `initializeServices()` AND `routes.GetServices()`
- Service initialization follows strict dependency order (config → infrastructure → business logic)

**Example Service Structure:**
```go
// Interface definition
type ServiceInterface interface {
    Initialize(ctx context.Context) error
    Operation() error
}

// Adapter pattern for testability
type DatabaseAdapter interface { /* ... */ }
type CacheAdapter interface { /* ... */ }

// Service with injected dependencies
type Service struct {
    db    DatabaseAdapter
    cache CacheAdapter
}
```

### II. Performance-First Design (NON-NEGOTIABLE)
**No performance regressions allowed. All changes must maintain or improve validated metrics.**

- **Validated Baseline**: 20-289x faster than Next.js (1.7-28ms response time)
- **Cache Target**: 85%+ hit ratio (currently optimizing from 20%)
- **Zero Error Rate**: Under 500+ concurrent users load testing
- **Response Time**: <1000ms for all endpoints (most achieve <50ms)
- **Memory Efficiency**: 4-5x less memory usage vs. Next.js baseline

**Mandatory Performance Validation:**
- Load testing before merging: `go test -bench=. -benchmem -count=3 ./scripts/load-testing/`
- Health checks + metrics on ALL endpoints (`/health`, `/metrics`)
- Use `internal/services/monitoring` for automatic metrics collection
- Grafana dashboard monitoring: `http://localhost:3001` (admin/admin)

### III. Test-First with Quality Gates (NON-NEGOTIABLE)
**95% coverage target with automated quality gates enforcing Phase 2 compliance.**

**Testing Requirements:**
- **Backend Tests**: Located in `backend/test/{unit,integration,performance,e2e}/`
- **Frontend Tests**: Located in `frontend/src/__tests__/` or co-located `__tests__/`
- **Coverage Gates**: 95% global, 98% critical components, 95% branch/function
- **Performance Gates**: Response time, cache hit rate, error rate validation
- **Security Gates**: Zero critical vulnerabilities, dependency scanning
- **Phase 2 Compliance Gates**: Monitoring integration, cache optimization

**Test Execution:**
```powershell
# Backend tests
go test ./internal/services/... -v
go test ./test/integration/... -v

# Frontend tests
pnpm test                 # All tests
pnpm test:unit            # Unit tests only
pnpm test:integration     # Integration tests
pnpm validate:performance # Performance validation
```

**Quality Gate Enforcement:**
- All PRs must pass automated quality gates before merge
- Quality gate results logged in monitoring system
- Trend analysis tracks regression prevention
- Real-time reporting with recommendations

### IV. Indonesian Government Compliance
**Data sovereignty and cultural sensitivity are mandatory for civil records management.**

**Language Requirements:**
- **User-Facing Content**: Indonesian (bahasa baku) - MANDATORY
- **Technical Docs/Code**: English
- **Error Messages**: Indonesian user message + English debug info for logs

**Data Sovereignty:**
- ONLY `ap-southeast-1` (Singapore) or `ap-southeast-3` (Jakarta) AWS regions allowed
- All Supabase calls must validate region compliance
- Document compliance in `docs/` with government standards references

**Cultural Standards:**
- 7-component cultural validation system (hierarchy, collectivism, face-saving, religious, regional, language, authenticity)
- Cultural quality score target: 80%+ (currently achieving 90%)
- Expert validation cache for cultural appropriateness
- See `backend/internal/services/persona/cultural_validator.go`

### V. Hybrid Monorepo Integration Patterns
**Frontend and backend operate independently with two integration pathways.**

**Two Integration Modes:**
1. **Direct Supabase Calls** (e.g., SILPANA form submissions bypass Go backend)
   - Anonymous submissions use RLS policies for security
   - Frontend validates, Supabase enforces via RLS WITH CHECK
   - Debug RLS policies BEFORE backend code for 401/403 errors

2. **Go Backend API Calls** (e.g., `/api/v1/chat`, `/api/v1/silpana/tickets`)
   - JWT authentication via `internal/services/auth`
   - Multi-level caching (Memory + Redis with automatic fallback)
   - WebSocket support for real-time updates (room-based broadcasting)

**Critical Architecture Understanding:**
```
sellica-golang/
├── backend/          # Go 1.23 - High-performance API layer
│   ├── cmd/server/   # Application entry point (main.go)
│   ├── internal/     # Private services (23+ service modules)
│   └── exe/          # Build outputs (MANDATORY location)
├── frontend/         # Next.js 15 - Static-first SSR/SSG
└── selly-legacy-nextjs-backend/  # Legacy code being migrated
```

### VI. Frontend Authentication Data Flow (NON-NEGOTIABLE)
**User authentication state must be consistently propagated across all components without fallback placeholders.**

**Critical Authentication Rules:**
- **Email Field**: ALWAYS populate user.email in authentication objects (layout.tsx responsibility)
- **No Placeholders**: Components must NEVER display placeholder values like "user@example.com" for authenticated users
- **Data Integrity**: User objects must maintain complete structure across prop/localStorage transitions
- **Error Visibility**: Missing critical fields must show error indicators, not fallback placeholders
- **Priority Chain**: (1) Props with complete data, (2) localStorage with validation, (3) Error state (NEVER placeholder)

**Authentication Data Structure (Mandatory Fields):**
```typescript
interface AuthenticatedUser {
  id: string;              // User ID from auth provider
  email: string;           // CRITICAL: Always required, NEVER omitted
  name?: string;           // User display name (optional but preferred)
  role?: string;           // User role/permission level
  full_name?: string;      // Complete user name
  avatar_url?: string;     // User profile avatar
}

// NO: {id: '123', name: 'John'} - Missing required email
// YES: {id: '123', email: 'john@example.com', name: 'John'}
```

**Layout Authentication Flow (frontend/src/app/(protected)/layout.tsx):**
- Extract email from GoAuthAPI response BEFORE switching to Supabase fallback
- Construct user object with email field populated FIRST
- Pass complete user object to TopNav (never incomplete)
- Log email extraction for debugging (console.debug minimum)

**Component Display Logic (frontend/src/components/TopNav.tsx):**
- Priority 1: Use prop if email field exists
- Priority 2: Retrieve from localStorage if email field exists
- Priority 3: Display error indicator (NEVER use placeholder)
- Code example: `{displayUser?.email || "[Email not available]"}`

**Common Bug Pattern (PREVENT):**
```typescript
// ❌ WRONG - Falls back to placeholder for missing email
{displayUser?.email || "user@example.com"}

// ✅ CORRECT - Shows error when email missing (signals bug)
{displayUser?.email || "[Email not available - authentication incomplete]"}
```

**Testing Requirements:**
- Unit tests verify email field propagation in authentication flow
- Integration tests confirm TopNav displays actual email (not placeholder)
- Test must fail if email is undefined/empty
- See `frontend/src/components/__tests__/TopNav.auth.test.tsx` for test patterns

**Related Files (Maintain Consistency):**
- `frontend/src/app/(protected)/layout.tsx` - Auth check and user object construction
- `frontend/src/components/TopNav.tsx` - User display with authentication state
- `frontend/src/lib/api/goAuth.ts` - GoAuthAPI user object structure
- `frontend/src/app/(protected)/dashboard/page.tsx` - localStorage synchronization

### VII. Windows Development Environment Standards
**Optimized for Windows 11, PowerShell, and pnpm package manager.**

**Mandatory Tools:**
- **OS**: Windows 11 with PowerShell 5.1
- **Package Manager**: pnpm 10.14.0 (NEVER use npm or yarn)
- **Node.js**: v22.18.0
- **Go**: 1.25.0 windows/amd64
- **IDE**: VS Code with recommended extensions (`.vscode/extensions.json`)

**PowerShell Command Patterns:**
```powershell
# Chaining commands
cd backend; go build              # ✅ Correct (semicolon)
cd backend && go build            # ❌ Wrong (bash syntax)

# Environment variables
$env:PORT = "8080"                # Set variable
$env:DEBUG = "true"; npm test     # Temporary for single command

# Path handling
# Always use forward slashes in code for cross-platform compatibility
const filePath = path.join(__dirname, 'src/components')
```

**File System Rules:**
- Case-insensitive filesystem (Windows NTFS)
- Use forward slashes `/` in code for cross-platform compatibility
- Absolute paths for system commands: `d:\Journey Code\Project\lab\sellica-golang\`

### VIII. Observability and Documentation
**Comprehensive logging, metrics, and documentation are non-negotiable.**

**Logging Standards:**
- Structured logging via logrus (backend) and console (frontend)
- Log levels: ERROR (user-facing Indonesian + technical English), INFO, DEBUG
- Logs directory: `backend/logs/backend/` and `frontend/logs/`
- Automatic log rotation and file management via `logwriter`

**Documentation Standards:**
- **Dated Technical Docs**: `docs/bydate/YYYY-MM-DD-{descriptive-title}.md` (MANDATORY: date-prefixed filename)
- **All Documentation**: Centralized in `docs/bydate/` directory (MANDATORY location)
- **Naming Convention**: `YYYY-MM-DD-{DESCRIPTIVE-TITLE-KEBAB-CASE}.md` (ALL-CAPS after date)
- **Mandatory Header**: Document metadata (date, version, status, priority, audience, type)
- **Markdown Linting**: Zero errors required (heading hierarchy, code blocks with language, consistent list markers)
- **Executive Summary**: 2-3 sentence overview of purpose and outcomes

**Metrics Collection:**
- Health endpoints: `/health`, `/health/simple`, `/health/live`, `/health/ready`
- Metrics endpoints: `/metrics`, `/metrics/health`, `/metrics/summary`
- Prometheus integration via `backend/docker-compose.yml`
- Grafana dashboards for real-time monitoring

### IX. Topic-Based Documentation Organization with Specify-Command Folders
**Structured topic organization with specify-command subfolders for specialized workflows.**

**Documentation Structure (MANDATORY):**
```
docs/bydate/
├── YYYY-MM-DD-{TOPIC-TITLE}/
│   ├── speckit-plan/
│   │   ├── YYYY-MM-DD-research.md
│   │   ├── YYYY-MM-DD-data-model.md
│   │   ├── YYYY-MM-DD-contracts/
│   │   │   ├── YYYY-MM-DD-entity-name-contract.md
│   │   │   └── YYYY-MM-DD-service-name-contract.md
│   │   ├── YYYY-MM-DD-quickstart.md
│   │   └── YYYY-MM-DD-implementation-status.md
│   │
│   ├── speckit-analyze/
│   │   ├── YYYY-MM-DD-root-cause-analysis.md
│   │   ├── YYYY-MM-DD-architecture-analysis.md
│   │   └── YYYY-MM-DD-impact-assessment.md
│   │
│   ├── speckit-implement/
│   │   ├── YYYY-MM-DD-phase-1-implementation.md
│   │   ├── YYYY-MM-DD-phase-2-implementation.md
│   │   └── YYYY-MM-DD-build-verification.md
│   │
│   ├── speckit-specify/
│   │   ├── YYYY-MM-DD-feature-specification.md
│   │   ├── YYYY-MM-DD-api-definition.md
│   │   └── YYYY-MM-DD-acceptance-criteria.md
│   │
│   ├── speckit-clarify/
│   │   ├── YYYY-MM-DD-requirements-clarification.md
│   │   ├── YYYY-MM-DD-scope-definition.md
│   │   └── YYYY-MM-DD-unknowns-resolution.md
│   │
│   ├── speckit-constitution/
│   │   ├── YYYY-MM-DD-compliance-check.md
│   │   └── YYYY-MM-DD-principle-validation.md
│   │
│   ├── speckit-checklist/
│   │   ├── YYYY-MM-DD-phase-0-checklist.md
│   │   ├── YYYY-MM-DD-phase-1-checklist.md
│   │   ├── YYYY-MM-DD-phase-2-checklist.md
│   │   └── YYYY-MM-DD-phase-3-checklist.md
│   │
│   └── speckit-tasks/
│       ├── YYYY-MM-DD-task-planning.md
│       ├── YYYY-MM-DD-task-tracking.md
│       └── YYYY-MM-DD-execution-status.md
│
├── YYYY-MM-DD-{ANOTHER-TOPIC}/
│   ├── speckit-plan/
│   │   └── [same structure as above]
│   ├── speckit-analyze/
│   │   └── [same structure as above]
│   └── [other specify commands...]
│
└── YYYY-MM-DD/  # Legacy flat structure (deprecated, transition to topic folders)
    └── [existing docs migrate here temporarily]
```

**Topic Folder Naming Rules (MANDATORY):**
- Format: `YYYY-MM-DD-{DESCRIPTIVE-TOPIC-KEBAB-CASE}/` (e.g., `2025-11-02-topnav-auth-display-bug/`)
- Topic name: Descriptive kebab-case (e.g., `topnav-auth-display-bug`, `chart-aggregation-filter`, `websocket-integration`)
- Prefix with date matching the work session date
- Creates new folder for each distinct project/feature topic
- Entire workflow for one topic contained within single date-prefixed folder

**Specify-Command Subfolder Rules (MANDATORY):**
- Each speckit prompt creates a dedicated subfolder: `speckit-{command}/`
- Commands: `plan`, `analyze`, `implement`, `specify`, `clarify`, `constitution`, `checklist`, `tasks`
- Files within each subfolder follow naming: `YYYY-MM-DD-{descriptive-title}.md`
- Subfolders logically organize workflow (e.g., all planning docs in `speckit-plan/`)
- Related docs live together (e.g., all contracts in `speckit-plan/contracts/`)

**File Organization Within Specify-Command Folders:**

**speckit-plan/** (Planning workflow):
- `YYYY-MM-DD-research.md` - Phase 0 research findings
- `YYYY-MM-DD-data-model.md` - Entity definitions and data flow
- `YYYY-MM-DD-contracts/` (subfolder with contracts)
  - `YYYY-MM-DD-{entity}-contract.md` - One contract per entity/service
- `YYYY-MM-DD-quickstart.md` - Testing procedures and workflows
- `YYYY-MM-DD-implementation-status.md` - Status tracking

**speckit-analyze/** (Analysis workflow):
- `YYYY-MM-DD-root-cause-analysis.md` - Problem analysis
- `YYYY-MM-DD-architecture-analysis.md` - System architecture review
- `YYYY-MM-DD-impact-assessment.md` - Impact and risk analysis

**speckit-implement/** (Implementation workflow):
- `YYYY-MM-DD-phase-1-implementation.md` - Phase 1 work and results
- `YYYY-MM-DD-phase-2-implementation.md` - Phase 2 work and results
- `YYYY-MM-DD-build-verification.md` - Build and verification results

**speckit-specify/** (Specification workflow):
- `YYYY-MM-DD-feature-specification.md` - Feature specification
- `YYYY-MM-DD-api-definition.md` - API/interface definitions
- `YYYY-MM-DD-acceptance-criteria.md` - Acceptance criteria and testing

**speckit-clarify/** (Clarification workflow):
- `YYYY-MM-DD-requirements-clarification.md` - Clarified requirements
- `YYYY-MM-DD-scope-definition.md` - Defined scope and boundaries
- `YYYY-MM-DD-unknowns-resolution.md` - Resolved unknowns

**speckit-constitution/** (Compliance workflow):
- `YYYY-MM-DD-compliance-check.md` - Constitution compliance verification
- `YYYY-MM-DD-principle-validation.md` - Principle-by-principle validation

**speckit-checklist/** (Checklist workflow):
- `YYYY-MM-DD-phase-0-checklist.md` - Phase 0 completion checklist
- `YYYY-MM-DD-phase-1-checklist.md` - Phase 1 completion checklist
- `YYYY-MM-DD-phase-2-checklist.md` - Phase 2 completion checklist
- `YYYY-MM-DD-phase-3-checklist.md` - Phase 3 completion checklist

**speckit-tasks/** (Task management workflow):
- `YYYY-MM-DD-task-planning.md` - Task breakdown and planning
- `YYYY-MM-DD-task-tracking.md` - Task status tracking
- `YYYY-MM-DD-execution-status.md` - Execution status and metrics

**Benefits of This Structure:**
- **Topical Organization**: All docs for one feature/bug grouped in single date-prefixed folder
- **Workflow Clarity**: Specify-command subfolders show which workflow stage created each doc
- **Chronological Sorting**: Date directories sort naturally, each topic has its own timeline
- **Scalability**: Hundreds of topics can coexist without confusion
- **Navigation**: Users can easily drill down: Topic → Workflow Stage → Specific Document
- **Clarity**: Folder structure reflects speckit workflow (plan → analyze → implement → specify → clarify → constitution → checklist → tasks)

**Migration Path (Legacy Documents):**
1. Existing docs in flat `docs/bydate/2025-11-02/` → move to `docs/bydate/2025-11-02-legacy-flat/speckit-legacy/`
2. New documents MUST use topic-based structure
3. Gradual migration of legacy docs into proper topic folders as they're revisited
4. Deprecation timeline: 90 days for full migration to topic-based organization

## Technology Stack Requirements

### Backend (Go 1.23)
**Mandatory Dependencies:**
- **Web Framework**: Gin (v1.10.0) - Fast HTTP router
- **Database**: Supabase Go client (v0.0.4) - Connection pooling (10-100 conns)
- **Caching**: Redis (v9.7.0) + in-memory fallback (patrickmn/go-cache)
- **Authentication**: golang-jwt/jwt (v5.2.1) - JWT validation with Supabase secrets
- **Logging**: logrus (v1.9.3) - Structured logging
- **Configuration**: godotenv (v1.5.1) - Environment variable management

**Build and Deployment:**
- Executables output to `backend/exe/` (NOT bin/, build/, or root)
- Build command: `go build -o exe/selly-backend.exe cmd/server/main.go`
- Docker support: `backend/docker-compose.yml` (includes Redis, Prometheus, Grafana)
- Health checks required for all deployments

### Frontend (Next.js 15)
**Mandatory Dependencies:**
- **Framework**: Next.js 15.3.0 - Static-first SSR/SSG
- **Package Manager**: pnpm 10.14.0 (MANDATORY - no npm/yarn)
- **UI Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Supabase client
- **Testing**: Jest + React Testing Library

**Build Configuration:**
- Static export optimized: `next.config.mjs`
- Image optimization disabled for static builds
- Output directory: `deployment/static-build/`
- Development server: Port 3000, Production: Port 4000

**pnpm Scripts (from package.json):**
```json
{
  "dev": "pnpm dev:frontend",
  "build": "next build",
  "test": "jest",
  "test:unit": "jest --selectProjects=\"Unit Tests\"",
  "test:integration": "jest --selectProjects=\"Integration Tests\"",
  "test:performance": "jest --selectProjects=\"Performance Tests\"",
  "validate:performance": "tsx src/scripts/simple-performance-validation.ts"
}
```

## Development Workflow

### Git Workflow (PowerShell Three-Step Process)
**Mandatory conventional commit format with documentation updates.**

```powershell
# Step 1: Stage all changes
git add .

# Step 2: Commit with conventional format
git commit -m "feat(silpana): add real-time WebSocket updates"
# Types: feat, fix, docs, style, refactor, test, chore

# Step 3: Push to current branch
git push origin <branch-name>
```

**Commit Message Convention:**
- `feat(scope):` - New feature
- `fix(scope):` - Bug fix
- `docs(scope):` - Documentation changes
- `test(scope):` - Test additions/changes
- `refactor(scope):` - Code refactoring
- `chore(scope):` - Maintenance tasks

**Documentation Updates:**
- REQUIRED before committing when implementing from existing specs
- Update the source doc that guided your work
- Create new docs for significant features or architecture changes

### File Organization (MANDATORY)
**Strict directory structure enforced by CI/CD with automated warnings.**

**Backend Files:**
- **Tests**: `/backend/test/{unit,integration,performance,e2e}/`
- **Executables**: `/backend/exe/` (ONLY location allowed)
- **Services**: `/backend/internal/services/{service-name}/`
- **Migrations**: `/backend/migrations/` (numeric prefixes: `001_`, `002_`)

**Frontend Files:**
- **Tests**: `/frontend/src/__tests__/` or co-located `__tests__/`
- **Components**: `/frontend/src/components/`
- **Pages**: `/frontend/src/app/` (Next.js 15 App Router)
- **Scripts**: `/frontend/src/scripts/`

**Documentation Organization (CENTRALIZED with NESTED DATES):**
- **Structure**: `docs/bydate/YYYY-MM-DD/YYYY-MM-DD-{descriptive-title}.md` (MANDATORY)
- **Date Directory**: Creates subdirectory for each unique date
- **Filename Rule**: Files MUST have date prefix in filename
- **Sorting**: Date directories sort chronologically, files within each date sort naturally

**Documentation File Naming Examples:**
```
docs/bydate/
├── 2025-11-02/
│   ├── 2025-11-02-TOPNAV-AUTH-DISPLAY-BUG-ANALYSIS.md
│   ├── 2025-11-02-TOPNAV-FIX-RESOLUTION-SUMMARY.md
│   └── 2025-11-02-FRONTEND-AUTH-DATA-FLOW-PRINCIPLE.md
├── 2025-10-29/
│   ├── 2025-10-29-MONTHLY-FILTER-STATUS.md
│   ├── 2025-10-29-PER-TABLE-CHART-AGGREGATION-COMPLETE.md
│   ├── 2025-10-29-YEAR-FILTER-IMPLEMENTATION-COMPLETE.md
│   ├── 2025-10-29-PER-TABLE-VERIFICATION-CHECKLIST.md
│   └── 2025-10-29-SESSION-SUMMARY-PER-TABLE-PRINCIPLE.md
└── 2025-10-25/
    └── 2025-10-25-ARCHITECTURE-ANALYSIS.md
```

**File Naming Requirements (MANDATORY):**
- Format: `YYYY-MM-DD-{DESCRIPTIVE-TITLE-KEBAB-CASE}.md`
- Date Directory: `YYYY-MM-DD/` (creates subdirectory for each date)
- Filename Date: Same as directory date (redundant but explicit)
- Title: ALL-CAPS with hyphens, no spaces
- Double date prefix ensures document age is visible both at directory and filename level
- Violations prevent merge approval

### Database Migrations
**Numeric prefixes with rollback sections required.**

```sql
-- Migration file: backend/migrations/001_create_table.sql

-- BEGIN MIGRATION
CREATE TABLE silpana (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
-- END MIGRATION

-- BEGIN ROLLBACK
DROP TABLE silpana;
-- END ROLLBACK
```

**Frontend Migrations (TypeScript):**
```powershell
# Run migration
pnpm migration:silpana-ticketing

# Rollback migration
pnpm migration:silpana-ticketing:rollback
```

### Running the Application

**Backend (from `backend/`):**
```powershell
# Install dependencies
go mod download

# Run development server (port 8080)
go run cmd/server/main.go

# Build executable
go build -o exe/selly-backend.exe cmd/server/main.go

# Docker compose (Redis, Prometheus, Grafana)
docker-compose up -d
```

**Frontend (from `frontend/`):**
```powershell
# Install dependencies (pnpm ONLY)
pnpm install

# Development server (port 3000)
pnpm dev

# Production build
pnpm build

# Production server (port 4000)
pnpm start
```

**Critical Endpoints:**
- Backend health: `http://localhost:8080/health`
- Backend metrics: `http://localhost:8080/metrics`
- Frontend: `http://localhost:3000`
- Grafana: `http://localhost:3001` (admin/admin)

### Error Handling Pattern
**Indonesian user messages with English technical details for debugging.**

```go
// Backend error handling
return nil, fmt.Errorf("gagal menyimpan tiket: %w", err)  // Indonesian for user
logrus.WithError(err).Error("Failed to save ticket: database timeout")  // English for logs

// Frontend receives Indonesian message
// Logs contain English technical detail for debugging
```

### WebSocket Integration (Phase 4)
**Room-based broadcasting for real-time updates.**

```go
// Subscribe client to ticket updates
hub.SubscribeToRoom(client, "ticket-"+ticketID)

// Broadcast to all clients in room
hub.BroadcastToRoom("ticket-"+ticketID, event)

// Cleanup on disconnect
hub.UnsubscribeFromAllRooms(client)
```

**Frontend WebSocket Client** (`frontend/src/lib/websocket/`):
- Auto-reconnect with exponential backoff
- Ping/pong keep-alive (54s interval)
- Event-based message handling
- React hooks: `useWebSocket()`, `useTicketUpdates()`

## Quality Assurance Standards

### Automated Quality Gates (Phase 2 Compliance)
**Comprehensive validation pipeline with automatic enforcement.**

**Gate Categories:**
1. **Performance Gates**: Response time, cache hit rate, error rate, throughput, memory usage
2. **Coverage Gates**: Global coverage (95%), critical components (98%), branch/function (95%)
3. **Security Gates**: Dependency vulnerabilities, code security analysis
4. **Phase 2 Compliance**: Monitoring integration, cache optimization, intelligent caching

**Quality Gate Configuration:**
```typescript
{
  thresholds: {
    performance: {
      maxResponseTime: 1000,      // <1s Phase 2 target
      minCacheHitRate: 85,         // 85%+ Phase 2 target
      maxErrorRate: 1,             // <1% Phase 2 target
      minThroughput: 1000,         // req/s
      maxMemoryUsage: 500          // MB
    },
    coverage: {
      minGlobalCoverage: 95,       // 95% Phase 2 target
      minCriticalComponentsCoverage: 98,
      minBranchCoverage: 95,
      minFunctionCoverage: 95
    },
    security: {
      maxVulnerabilities: 0,
      maxCriticalVulnerabilities: 0
    }
  }
}
```

**Execution:**
```powershell
# Run quality gates
pnpm test:enhanced

# Performance validation
pnpm validate:performance

# Backend load testing
cd backend; go test -bench=. ./scripts/load-testing/
```

### Testing Requirements by Type
**Comprehensive test coverage across all system layers.**

**Unit Tests:**
- Individual service logic validation
- Mock external dependencies (database, cache, monitoring)
- Target: 95%+ coverage
- Execution: `go test ./internal/services/... -v` or `pnpm test:unit`

**Integration Tests:**
- Service-to-service communication
- Database integration (Supabase)
- Cache integration (Redis + memory fallback)
- EventBus pub/sub patterns
- Target: 95%+ coverage
- Execution: `go test ./test/integration/... -v` or `pnpm test:integration`

**Performance Tests:**
- Load testing: 500+ concurrent users
- Response time validation (<1000ms, most <50ms)
- Cache hit ratio (85%+ target)
- Memory efficiency validation
- Execution: `go test -bench=. -benchmem -count=3 ./scripts/load-testing/` or `pnpm test:performance`

**E2E Tests:**
- Complete user workflows (SILPANA ticket submission, dashboard charts)
- Frontend + backend integration
- WebSocket real-time updates
- Execution: `pnpm test:e2e`

### Code Review Requirements
**Mandatory checks before merge approval.**

- [ ] All quality gates passed (performance, coverage, security, Phase 2 compliance)
- [ ] Documentation updated (source docs if implementing from specs)
- [ ] Conventional commit messages used
- [ ] No performance regressions (validated via benchmarks)
- [ ] Tests added for new features (TDD approach)
- [ ] Error messages use Indonesian (user) + English (technical)
- [ ] Service registration updated (if new service added)
- [ ] File organization follows mandatory structure
- [ ] PowerShell syntax used for Windows commands
- [ ] Markdown linting passed (zero errors)

## Compliance and Security

### Data Sovereignty
**Strict regional compliance for Indonesian government standards.**

- **Allowed Regions**: ONLY `ap-southeast-1` (Singapore) or `ap-southeast-3` (Jakarta)
- **Supabase Configuration**: Region validation in all database calls
- **Documentation**: Compliance proof in `docs/` with government standard references
- **Audit Trail**: All data access logged for government audits

### Security Standards
**Zero-tolerance for critical vulnerabilities.**

- **Dependency Scanning**: Automated checks for known vulnerabilities (max 0 critical)
- **Code Security**: Static analysis for security issues (max 0 critical)
- **Authentication**: JWT validation via Supabase secrets (RBAC enforced)
- **RLS Policies**: Supabase Row-Level Security for anonymous submissions
- **HTTPS Only**: Production deployments require TLS certificates
- **Secrets Management**: Environment variables via `.env` (NEVER commit secrets)

### Cultural Compliance (Indonesian Government)
**7-component validation for cultural appropriateness.**

1. **Hierarchy Validator**: Social hierarchy respect (Indonesian formal structure)
2. **Collectivism Validator**: Community-oriented communication
3. **Face-Saving Validator**: Face-saving compliance (avoiding public criticism)
4. **Religious Validator**: Religious sensitivity (multi-faith respect)
5. **Regional Validator**: Regional appropriateness (diverse Indonesian cultures)
6. **Language Validator**: Correct Indonesian language usage (bahasa baku)
7. **Authenticity Assessment**: Overall cultural authenticity score

**Target**: 80%+ cultural quality score (currently achieving 90%)

## Governance

### Constitutional Authority
**This constitution supersedes all other development practices and guidelines.**

- Constitution defines mandatory standards (NON-NEGOTIABLE principles)
- `.github/copilot-instructions.md` provides runtime development guidance
- Conflicts resolved in favor of constitutional principles
- Amendments require team approval and migration plan

### Amendment Process
**Changes to constitution require formal process.**

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: Team review and discussion (minimum 3 business days)
3. **Approval**: Unanimous technical lead approval required for core principles
4. **Migration Plan**: Document migration path for existing code
5. **Implementation**: Update constitution, notify team, update CI/CD validation
6. **Versioning**: Increment version number and document in changelog

### Enforcement Mechanisms
**Automated and manual validation of constitutional compliance.**

**Automated Enforcement (CI/CD):**
- Quality gates block merges if thresholds not met
- File organization validated (warn on violations)
- Test coverage checked (95% minimum)
- Performance benchmarks run (prevent regressions)
- Security scans executed (zero critical vulnerabilities)
- Markdown linting enforced (zero errors)

**Manual Review:**
- Code reviews verify service architecture patterns
- Documentation completeness checked (headers, executive summary)
- Cultural compliance validated (Indonesian language standards)
- Regional compliance confirmed (data sovereignty)

**Violation Consequences:**
- Automated: PR blocked until compliance achieved
- Manual: Review comments require resolution before approval
- Repeated violations: Additional training or pair programming required

### Exception Process
**Rare exceptions require explicit documentation and approval.**

**When Exceptions Are Allowed:**
- Technical impossibility (with proof and alternative approach documented)
- Emergency hotfixes (with retroactive compliance plan)
- Legacy code migration (with timeline for compliance)

**Exception Request Process:**
1. Document exception reason, impact, and temporary mitigation
2. Propose timeline for compliance or permanent alternative
3. Obtain technical lead approval
4. Track exception in `docs/EXCEPTIONS.md` with review dates
5. Regularly review exceptions for resolution or removal

### Version History
**Version**: 1.2.0  
**Ratified**: 2025-11-02  
**Last Amended**: 2025-11-02

**Changelog:**
- v1.2.0 (2025-11-02): Added topic-based documentation organization with specify-command folders
  - New Principle IX: Topic-Based Documentation Organization (NON-NEGOTIABLE)
  - Defined mandatory topic folder structure: `docs/bydate/YYYY-MM-DD-{TOPIC}/speckit-{command}/`
  - Established specify-command subfolders for workflow organization
  - Standardized file naming within each subfolder with date prefix
  - Created migration path for legacy flat documentation structure
  - Enables scalability for hundreds of concurrent features/bugs
  - Improved navigation through topical grouping and workflow clarity
  - Renumbered subsequent sections

- v1.1.0 (2025-11-02): Added Frontend Authentication Data Flow principle
  - New Principle VI: Frontend Authentication Data Flow (NON-NEGOTIABLE)
  - Defined mandatory authentication object structure (email field always required)
  - Established authentication data propagation patterns (prop → localStorage → error)
  - Added explicit rules against placeholder fallbacks for authenticated users
  - Specified testing requirements for authentication state verification
  - Related to TopNav authentication bug fix (email display)
  - Renumbered subsequent principles (VII → VIII)

- v1.0.0 (2025-11-02): Initial constitution ratified
  - Defined 7 core principles (service-oriented, performance-first, test-first, compliance, hybrid integration, Windows environment, observability)
  - Established technology stack requirements (Go 1.23, Next.js 15, pnpm)
  - Documented development workflow (Git, file organization, migrations, running application)
  - Specified quality assurance standards (automated quality gates, testing requirements, code review)
  - Defined compliance and security standards (data sovereignty, cultural validation)
  - Established governance process (constitutional authority, amendments, enforcement, exceptions)

---

**Current Phase**: Phase 4 - Real-time WebSocket Integration Complete  
**Current Branch**: `feat/fix-chart-aggregation`  
**Project Status**: Production-ready with 20-289x performance improvement validated  
**Next Focus**: Phase 5 - Advanced AI features and cultural optimization

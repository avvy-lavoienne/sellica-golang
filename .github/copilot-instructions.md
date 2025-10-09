# SELLY-AI Copilot Instructions

## Development Environment

**Operating System**: Windows 11
**IDE**: Visual Studio Code
**Shell**: PowerShell 5.1 (Windows PowerShell)
**Package Manager**: pnpm 10.14.0 (MANDATORY - no npm or yarn)
**Node.js**: v22.18.0
**Go**: 1.25.0 windows/amd64

### Critical Environment Notes

**pnpm is MANDATORY**:
- All `package.json` scripts use `pnpm`
- `.npmrc` explicitly sets `package-manager=pnpm`
- Never use `npm` or `yarn` commands
- Global install: Already configured at system level

**PowerShell-Specific Commands**:
- Use `;` to chain commands: `cd backend; go build`
- Environment variables: `$env:VARIABLE_NAME = "value"`
- Path separators: Use `\` or let Node.js handle with `path.join()`
- Always use PowerShell syntax in code blocks: ` ```powershell`

**VS Code Configuration**:
- Recommended extensions in `.vscode/extensions.json`
- Task runner configured in `.vscode/tasks.json`
- Workspace optimized for Go and TypeScript development

**File System**:
- Case-insensitive filesystem (Windows NTFS)
- Always use forward slashes `/` in code for cross-platform compatibility
- Use absolute paths starting with `d:\` for system commands

## Project Overview

**SELLY** is a civil records management system with AI assistance capabilities, built as a hybrid Go backend + Next.js frontend monorepo. The project is undergoing an active migration from Next.js API routes to Go for 20x+ performance improvements while maintaining the Next.js frontend.

**Current Phase**: Phase 4 - Real-time WebSocket integration for live ticket updates (branch: `feat/silpana-dev-phase4-realtime`)

## Critical Architecture Concepts

### 1. Hybrid Monorepo Structure
```
sellica-golang/
├── backend/          # Go 1.23 - High-performance API layer
│   ├── cmd/server/   # Application entry point (main.go)
│   ├── internal/     # Private services (23+ service modules)
│   └── exe/          # Build outputs (MANDATORY location for executables)
├── frontend/         # Next.js 15 - Static-first SSR/SSG
└── selly-legacy-nextjs-backend/  # Legacy code being migrated
```

**Why this matters**: Frontend can integrate with backend in two ways:
1. **Direct Supabase calls** (e.g., SILPANA form submissions bypass Go backend entirely)
2. **Go backend API calls** (e.g., `/api/v1/chat`, `/api/v1/silpana/tickets`)

Understanding which path is used is critical for debugging.

### 2. Service-Oriented Backend Architecture

The Go backend follows a modular service architecture with 23+ services:

**Core Services** (`backend/internal/services/`):
- `database/` - Supabase Go client, connection pooling (10-100 conns)
- `cache/` - Multi-level caching (Memory + Redis with automatic fallback)
- `auth/` - JWT validation using Supabase secrets, RBAC
- `eventbus/` - Thread-safe pub/sub for inter-service communication
- `websocket/` - Real-time updates with room-based broadcasting
- `silpana/` - Ticketing system with adapter pattern for database/cache/monitoring

**Initialization Pattern** (see `cmd/server/main.go`):
```go
// Services are initialized in dependency order
services := initializeServices(cfg)
routeServices := routes.GetServices(
    services.EventBus,
    services.Database,
    services.Cache,
    services.Auth,
    services.Chat,
    // ... 23 total services
)
routes.SetupRoutes(router, routeServices)
```

**Critical**: When adding new services, update BOTH `initializeServices()` AND `routes.GetServices()`.

### 3. Supabase RLS Policy Gotchas

**SILPANA anonymous submissions** work via direct Supabase calls, NOT via Go backend. RLS policies control access:

```sql
-- Anonymous users can INSERT but WITH CHECK must be permissive
CREATE POLICY "silpana_anon_insert" ON silpana
FOR INSERT TO anon
WITH CHECK (true);  -- Permissive to allow frontend validation

-- Function grants must include anon role
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO anon;
```

**Debug pattern**: When seeing 401/403 errors on forms, check RLS policies BEFORE backend code. See `docs/SILPANA-ARCHITECTURE-ANALYSIS.md` for troubleshooting flow.

### 4. Performance-First Design

**Validated metrics** (see `backend/README.md`):
- Go backend: 1.7-28ms response time (20-289x faster than Next.js)
- Target: >85% cache hit ratio (currently optimizing from 20%)
- Zero error rate under load testing (500+ concurrent users)

**Development rules**:
- Never introduce performance regressions
- All endpoints must have health checks + metrics
- Use `internal/services/monitoring` for metrics collection
- Load testing: `backend/scripts/load-testing/benchmark_test.go`

### 5. Indonesian Government Compliance

**Language priority**:
- User-facing content: Indonesian (bahasa baku) - MANDATORY
- Technical docs/code: English
- Error messages: Indonesian user message + English debug info

**Data sovereignty**:
- ONLY `ap-southeast-1` or `ap-southeast-3` regions allowed
- All Supabase calls must validate region compliance
- Document compliance in `docs/` with government standards

## Essential Development Workflows

### Running the Application

**Backend** (from `backend/`):
```powershell
# Install dependencies
go mod download

# Run development server
go run cmd/server/main.go

# Build executable (outputs to backend/exe/)
go build -o exe/selly-backend.exe cmd/server/main.go

# Docker compose (includes Redis, Prometheus, Grafana)
docker-compose up -d
```

**Frontend** (from `frontend/`):
```powershell
# Use pnpm exclusively (MANDATORY)
pnpm install

# Development server
pnpm dev  # Runs on port 3000

# Static build for deployment
pnpm build  # Outputs to deployment/static-build/
```

**Critical endpoints**:
- Backend health: `http://localhost:8080/health`
- Backend metrics: `http://localhost:8080/metrics`
- Frontend: `http://localhost:3000`
- Grafana dashboard: `http://localhost:3001` (admin/admin)

### Common pnpm Commands

**Installation & Management**:
```powershell
pnpm install              # Install all dependencies
pnpm add <package>        # Add production dependency
pnpm add -D <package>     # Add dev dependency
pnpm remove <package>     # Remove dependency
pnpm update               # Update dependencies
```

**Testing**:
```powershell
pnpm test                          # Run all tests
pnpm test:watch                    # Watch mode
pnpm test:coverage                 # With coverage
pnpm test:performance              # Performance tests
pnpm validate:performance          # Performance validation
pnpm test:enhanced                 # Enhanced test suite
pnpm test:unit                     # Unit tests only
pnpm test:integration              # Integration tests only
```

**Development & Build**:
```powershell
pnpm dev                           # Start dev server (port 3000)
pnpm build                         # Production build
pnpm start                         # Start production server (port 4000)
pnpm lint                          # ESLint
pnpm type-check                    # TypeScript check
```

**Database Migrations**:
```powershell
pnpm migration:silpana-ticketing           # Run SILPANA migration
pnpm migration:silpana-ticketing:rollback  # Rollback migration
```

**Safety & Validation**:
```powershell
pnpm safety:init                   # Initialize safety infrastructure
pnpm apply:rls-fixes               # Apply RLS policy fixes
pnpm test:rls-policies             # Test RLS policies
```

### Testing Strategy

**Backend tests** (MUST be in `backend/test/*`):
```powershell
# Unit tests
go test ./internal/services/... -v

# Integration tests
go test ./test/integration/... -v

# Load testing (benchmark)
go test -bench=. -benchmem -count=3 ./scripts/load-testing/
```

**Frontend tests** (in `frontend/src/__tests__/`):
```powershell
pnpm test                 # Jest unit tests
pnpm test:performance     # Performance validation
pnpm validate:performance # Full performance suite
```

### Database Migrations

**Location**: `backend/migrations/` with numeric prefixes (`001_`, `002_`, etc.)

**Pattern**:
```sql
-- Always include rollback sections
-- BEGIN MIGRATION
CREATE TABLE ...;
-- END MIGRATION

-- BEGIN ROLLBACK
DROP TABLE ...;
-- END ROLLBACK
```

**Frontend migrations** (TypeScript):
```powershell
# Run migration
pnpm migration:silpana-ticketing

# Rollback migration
pnpm migration:silpana-ticketing:rollback
```

### Git Workflow (PowerShell)

**Mandatory three-step process** (see `.github/instructions/instructions.md`):
```powershell
# Stage all changes
git add .

# Commit with conventional format
git commit -m "feat(silpana): add real-time WebSocket updates"
# Types: feat, fix, docs, style, refactor, test, chore

# Push to current branch
git push origin feat/silpana-dev-phase4-realtime
```

**Documentation updates**: REQUIRED before committing when implementing from existing specs. Update the source doc that guided your work.

## Project-Specific Conventions

### 1. File Organization (MANDATORY)

**Backend**:
- Tests: `/backend/test/{unit,integration,performance,e2e}/`
- Docs: `/backend/docs/YYYY-MM-DD-{title}.md` (use current date: 2025-10-04)
- Executables: `/backend/exe/` (NOT in root, bin/, or build/)

**Frontend**:
- Tests: `/frontend/src/__tests__/` or co-located `__tests__/`
- Docs: `/frontend/docs/YYYY-MM-DD-{title}.md`

**Root-level docs** (`docs/`):
- Project-wide docs: `docs/CATEGORY-DESCRIPTIVE-TITLE.md` (ALL-CAPS, hyphenated)
- Dated docs: `docs/backend/docs/YYYY-MM-DD-{descriptive-title}.md`
- Frontend docs: `docs/frontend/docs/YYYY-MM-DD-{descriptive-title}.md`

**Enforcement**: CI/CD validates file placement. Automated warnings for violations.

### 2. Documentation Standards (MANDATORY)

**File Naming Convention**:
```
# Dated technical docs (backend/frontend)
YYYY-MM-DD-{descriptive-title-kebab-case}.md
Examples:
- 2025-10-04-phase4-websocket-integration.md
- 2025-09-10-selly-server-test-results.md

# Root-level category docs (project-wide)
CATEGORY-DESCRIPTIVE-TITLE.md (ALL-CAPS with hyphens)
Examples:
- SILPANA-ARCHITECTURE-ANALYSIS.md
- PHASE4-LAUNCH-SUMMARY.md
- DEBUG-RLS-POLICY-FAILURE.md
```

**Document Header Template** (MANDATORY for all dated docs):
```markdown
# Document Title

**Document**: Full Document Title
**Project Date**: YYYY-MM-DD
**Created**: YYYY-MM-DD
**Version**: X.Y
**Status**: ✅ Complete | 🚧 In Progress | 🚀 Ready | ❌ Deprecated
**Priority**: 🧠 Critical | 📈 High | 📊 Medium | 📝 Low
**Language**: English | Indonesian | Bilingual
**Audience**: Technical Team | Development Team | All Teams
**Type**: Implementation | Test Documentation | Architecture | Guide

## Executive Summary

Brief 2-3 sentence overview of the document's purpose and key outcomes.

## [Main Content Sections...]
```

**Markdown Linting Rules** (Zero Errors Required):
1. **Headings**: 
   - Start with `#` (H1 title only once)
   - No skipping levels (no H1 → H3)
   - Add blank line before and after headings
   - Use ATX-style (`#`) not underline-style

2. **Lists**:
   - Use `-` for unordered lists (consistent, not `*` or `+`)
   - Add blank line before and after lists
   - Indent nested lists with 2 spaces
   - Use `1.` for ordered lists (auto-numbering)

3. **Code Blocks**:
   - Always specify language: ` ```go`, ` ```typescript`, ` ```bash`, ` ```json`
   - Add blank line before and after code blocks
   - Use ` ```powershell` for Windows commands

4. **Links and References**:
   - Use `[text](url)` format (not bare URLs)
   - Internal links: `[See Architecture](./ARCHITECTURE.md)`
   - No trailing punctuation inside links

5. **Emphasis**:
   - Use `**bold**` for emphasis (not `__bold__`)
   - Use `*italic*` for subtle emphasis (not `_italic_`)
   - Use `` `code` `` for inline code and file names

6. **Line Length**:
   - Wrap prose at 120 characters (not enforced for code blocks or tables)
   - Tables can exceed line length

7. **Whitespace**:
   - No trailing whitespace
   - Single blank line between sections
   - End file with single newline

8. **Special Characters**:
   - Escape `<`, `>` in text: `\<`, `\>`
   - Use HTML entities for special needs: `&nbsp;`, `&mdash;`

**Documentation Quality Checklist**:
- [ ] Filename follows `YYYY-MM-DD-{title}.md` or `CATEGORY-TITLE.md` format
- [ ] Header metadata complete (all fields present)
- [ ] Executive summary present (2-3 sentences)
- [ ] All code blocks have language specifiers
- [ ] Heading hierarchy is correct (no skipped levels)
- [ ] Lists use consistent markers (`-` for unordered)
- [ ] No trailing whitespace
- [ ] No markdown linting errors
- [ ] File ends with single newline

**Example: Perfect Documentation Structure**:
```markdown
# Phase 4 WebSocket Integration Complete

**Document**: Phase 4 WebSocket Integration Implementation Report
**Project Date**: 2025-10-04
**Created**: 2025-10-04
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation

## Executive Summary

Successfully implemented real-time WebSocket integration for SILPANA ticketing system with room-based broadcasting,
achieving <50ms latency for live updates and supporting 500+ concurrent connections with zero errors.

## Architecture Overview

### WebSocket Hub Design

The WebSocket hub implements a room-based architecture for efficient message broadcasting:

```go
// Subscribe client to specific ticket room
hub.SubscribeToRoom(client, "ticket-"+ticketID)

// Broadcast to all room subscribers
hub.BroadcastToRoom("ticket-"+ticketID, event)
```

### Key Features

- **Room-based broadcasting**: Clients only receive relevant updates
- **Auto-reconnect**: Exponential backoff with 54s ping interval
- **Connection pooling**: Support for 1000+ concurrent connections

## Implementation Details

### Backend Service

Created `internal/services/websocket/` with the following components:

- `hub.go` - Connection and room management (335 lines)
- `client.go` - Client lifecycle and message handling (250 lines)
- `types.go` - Message types and configuration (115 lines)

### Frontend Integration

Updated `frontend/src/lib/websocket/` with:

1. **WebSocket Client**:
   - Auto-reconnect with exponential backoff
   - Event-based message handling
   - Ping/pong keep-alive mechanism

2. **React Hooks**:
   - `useWebSocket()` - Connection management
   - `useTicketUpdates()` - Real-time ticket updates

## Testing Results

### Load Testing

Tested with 500 concurrent connections:

- Average latency: 28ms
- P95 latency: 45ms
- Error rate: 0%
- Memory usage: 120MB

### Integration Testing

- ✅ Connection establishment and authentication
- ✅ Room subscription and broadcasting
- ✅ Auto-reconnect on network failure
- ✅ Graceful connection cleanup

## Deployment Checklist

- [x] WebSocket service implemented
- [x] Frontend client integrated
- [x] Load testing completed
- [x] Documentation updated
- [ ] Production deployment scheduled

## References

- [WebSocket Architecture](./WEBSOCKET-ARCHITECTURE.md)
- [Load Test Results](./2025-10-04-websocket-load-test-results.md)
- [API Documentation](../backend/README.md#websocket-routes)

---

**Last Updated**: 2025-10-04
**Phase**: Phase 4 - Real-time Integration
```

### 3. Service Implementation Pattern

When creating new services in `backend/internal/services/`:

```go
// 1. Define interface (interface.go)
type ServiceInterface interface {
    Initialize(ctx context.Context) error
    Operation() error
}

// 2. Implement adapter pattern for external deps
type DatabaseAdapter interface { /* ... */ }
type database_adapter.go struct { /* ... */ }

// 3. Service struct (service.go)
type Service struct {
    db    DatabaseAdapter
    cache CacheAdapter
    // Always include adapters for testability
}

// 4. Factory pattern (factory.go)
func NewService(db, cache, monitoring) (*Service, error) {
    // Validation and initialization
}

// 5. Export operations (operations.go)
func (s *Service) PublicOperation() error { /* ... */ }
```

**Example**: See `backend/internal/services/silpana/` for complete adapter pattern implementation.

### 4. Error Handling Pattern

```go
// Indonesian user message + English technical detail
return nil, fmt.Errorf("gagal menyimpan tiket: %w", err)  // Log level: ERROR
logrus.WithError(err).Error("Failed to save ticket: database timeout")

// Frontend receives Indonesian message
// Logs contain English technical detail for debugging
```

### 5. WebSocket Integration

**Room-based broadcasting** (Phase 4 implementation):
```go
// Subscribe client to ticket updates
hub.SubscribeToRoom(client, "ticket-"+ticketID)

// Broadcast to all clients in room
hub.BroadcastToRoom("ticket-"+ticketID, event)

// Cleanup on disconnect
hub.UnsubscribeFromAllRooms(client)
```

**Frontend WebSocket client** (see `frontend/src/lib/websocket/`):
- Auto-reconnect with exponential backoff
- Ping/pong keep-alive (54s interval)
- Event-based message handling

### 6. Environment Variables

**Backend** (`.env` in `backend/`):
```env
# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Redis (optional, falls back to memory cache)
REDIS_URL=rediss://default:token@host:6379

# Server config
PORT=8080
GIN_MODE=debug  # or 'release' for production
LOG_LEVEL=info
```

**Frontend** (`.env.local`):
```env
# Supabase public keys (NEXT_PUBLIC_ prefix for client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Common Debugging Patterns

### "401 Unauthorized on SILPANA form submission"
1. Check RLS policies in Supabase (NOT backend code)
2. Verify `GRANT EXECUTE ON FUNCTION ... TO anon`
3. Frontend submits directly to Supabase - backend not involved
4. See `docs/DEBUG-RLS-POLICY-FAILURE.md`

### "Redis connection failed, but app still works"
- Cache service automatically falls back to in-memory cache
- Check `backend/internal/services/cache/service.go` for fallback logic
- App continues with degraded performance (no distributed caching)

### "Build output in wrong directory"
- Go executables MUST be in `backend/exe/`
- Update `.gitignore` to exclude `backend/exe/*` but track directory
- Use `go build -o exe/selly-backend.exe cmd/server/main.go`

### "Performance regression detected"
1. Run baseline benchmarks: `go test -bench=. ./scripts/load-testing/`
2. Compare with `backend/PHASE3-IMPLEMENTATION-REPORT.md` targets
3. Check cache hit ratio: `curl http://localhost:8080/cache/stats`
4. Review monitoring dashboard: `http://localhost:3001` (Grafana)

## VS Code & PowerShell Tips

### VS Code Workspace

**Recommended Extensions** (see `.vscode/extensions.json`):
- `upstash.context7-mcp` - Context7 MCP integration

**Available Tasks** (see `.vscode/tasks.json`):
- "Run Baseline Performance Benchmarks" - Automated Go benchmark testing

**Terminal Setup**:
- Default shell: PowerShell 5.1
- Multiple terminals supported
- Integrated terminal for both frontend and backend

### PowerShell-Specific Gotchas

**Command Chaining**:
```powershell
# Use semicolon (;) not double ampersand (&&)
cd backend; go build           # ✅ Correct
cd backend && go build         # ❌ Wrong (bash syntax)
```

**Environment Variables**:
```powershell
# Set variable
$env:PORT = "8080"

# Use variable
Write-Host $env:PORT

# Temporary for single command
$env:DEBUG = "true"; npm test
```

**Path Handling**:
```powershell
# PowerShell uses backslash, but Node.js prefers forward slash
# In code, always use forward slash for cross-platform compatibility
const filePath = path.join(__dirname, 'src/components')  # ✅ Correct

# Absolute paths in PowerShell commands
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
```

**String Escaping**:
```powershell
# Single quotes preserve literal strings
Write-Host 'Price: $100'      # Output: Price: $100

# Double quotes allow variable expansion
$price = 100
Write-Host "Price: $$price"   # Output: Price: $100
```

**Piping and Output**:
```powershell
# Save command output
go build 2>&1 | Tee-Object -FilePath build.log

# Suppress output
go test > $null 2>&1
```

**Case Sensitivity**:
```powershell
# PowerShell is case-insensitive for commands
CD backend               # ✅ Works
cd backend               # ✅ Works

# But file system is case-insensitive
# Always use consistent casing in code for portability
```

### Common Windows/PowerShell Commands

```powershell
# List files
ls                              # or Get-ChildItem
dir                             # alias for ls

# Copy files
Copy-Item src\* dest\          # or cp

# Remove files
Remove-Item -Recurse node_modules  # or rm -r

# Find text in files
Select-String -Pattern "TODO" -Path .\*.go

# Check if running as admin
([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Kill process by port
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process
```

## Key Files Reference

**Architecture docs**:
- `docs/SILPANA-ARCHITECTURE-ANALYSIS.md` - RLS policy debugging
- `docs/SILPANA-INTEGRATION-SUMMARY.md` - Frontend/backend integration
- `PHASE4-LAUNCH-SUMMARY.md` - Current phase status
- `backend/PHASE3-IMPLEMENTATION-REPORT.md` - Performance metrics

**Service READMEs** (implementation guides):
- `backend/internal/services/eventbus/README.md` - Event bus architecture
- `backend/internal/services/concurrent/README.md` - Concurrency patterns

**Configuration**:
- `backend/internal/api/routes/routes.go` - All API routes
- `backend/docker-compose.yml` - Local development stack
- `frontend/next.config.mjs` - Frontend build config

**Tests**:
- `backend/scripts/load-testing/benchmark_test.go` - Performance baselines
- `frontend/src/scripts/simple-performance-validation.ts` - Frontend perf

## Additional Resources

- Full development rules: `.github/instructions/instructions.md` (1700+ lines)
- Deployment guide: `deployment/DEPLOYMENT-GUIDE.md`
- Migration mapping: `selly-legacy-nextjs-backend/documentation/migration-mapping.md`

---

**Last Updated**: 2025-10-04
**Current Branch**: feat/silpana-dev-phase4-realtime
**Go Version**: 1.23.0
**Next.js Version**: 15.3.0

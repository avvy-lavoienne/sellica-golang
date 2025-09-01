---
applyTo: '**'
type: "always_apply"
description: "Comprehensive SELLY Development Rules - Kilo Code Framework"
version: "2.1"
last_updated: "2025-09-01"
---

# SELLY Development Rules - Kilo Code Framework

**Rule Category**: Kilo Code Framework
**Priority**: Critical
**Scope**: All SELLY development and migration activities
**Enforcement**: Mandatory for all development workflows

## Table of Contents

1. [Core Principles and Philosophy](#1-core-principles-and-philosophy)
2. [Language and Communication Standards](#2-language-and-communication-standards)
3. [Development Environment and Workflow](#3-development-environment-and-workflow)
4. [Technology Stack and Architecture](#4-technology-stack-and-architecture)
5. [Code Quality and Architecture Standards](#5-code-quality-and-architecture-standards)
6. [Performance Optimization Rules](#6-performance-optimization-rules)
7. [Security and Compliance Framework](#7-security-and-compliance-framework)
8. [Quality Assurance and Testing](#8-quality-assurance-and-testing)
9. [Documentation and Knowledge Management](#9-documentation-and-knowledge-management)
10. [Migration Framework and Patterns](#10-migration-framework-and-patterns)
11. [Government Integration Standards](#11-government-integration-standards)
12. [File Organization Standards](#12-file-organization-standards)
13. [Validation and Enforcement](#13-validation-and-enforcement)
14. [Response Standards and Tool Integration](#14-response-standards-and-tool-integration)

## 1. Core Principles and Philosophy

### 1.1 Context-First Development
**Kilo Rule #1**: Every development and migration activity MUST begin with comprehensive context analysis.

**Requirements**:
- Understand complete functional purpose and architecture
- Analyze user workflows and business requirements
- Identify integration points and dependencies
- Assess performance, security, and compliance implications
- Document cultural and regulatory context (Indonesian government integration)

### 1.2 Quality as Non-Negotiable
**Kilo Rule #2**: Code quality improvement is mandatory for every change.

**Standards**:
- No temporary patches or technical debt accumulation

- Every change must demonstrate measurable improvement
- Performance regression is unacceptable
- Security cannot be compromised for functionality

### 1.3 Indonesian Context Integration
**Kilo Rule #3**: All systems must be designed for Indonesian government and cultural context.

**Language Priority Matrix**:
| Context | Primary Language | Secondary Language | Rationale |
|---------|------------------|-------------------|-----------|
| **User Interface** | Indonesian | English | Cultural respect and accessibility |
| **Technical Documentation** | English | Indonesian summaries | International collaboration |
| **Code Comments** | English | Indonesian for business logic | Maintainability |
| **Government Communications** | Indonesian | English for technical specs | Cultural respect and compliance |
| **Error Messages** | Indonesian | English debug info | User understanding |

**Practical Implementation Examples**:

**✅ Correct - User-Facing Messages**:
```typescript
// Good: Indonesian for end users
const messages = {
  welcome: 'Selamat datang di Sistem SELLY',
  loginRequired: 'Silakan masuk untuk melanjutkan',
  success: 'Data berhasil disimpan'
};
```

**❌ Incorrect - English for Indonesian users**:
```typescript
// Bad: English-only messages
const messages = {
  welcome: 'Welcome to SELLY System',
  loginRequired: 'Please login to continue',
  success: 'Data saved successfully'
};
```

**Data Sovereignty Requirements**:
- **Allowed Regions**: ap-southeast-1, ap-southeast-3 only
- **Prohibited Regions**: us-east-1, eu-west-1, any non-Indonesian region
- **Implementation**: All data processing must validate region compliance

**Cultural Communication Standards**:
- Use formal Indonesian (bahasa baku) for all government interactions
- Include proper institutional headers and signatures
- Respect administrative hierarchy in communication protocols
- Provide required legal disclaimers for government communications

### 1.4 Three-Step Development Process
**Kilo Rule #4**: All development follows the mandatory three-phase process.

**Phase 1: Diagnosis**
```go
type DiagnosisPhase struct {
    ContextAnalysis    *ContextAnalysis
    RequirementMapping *RequirementMapping
    RiskAssessment     *RiskAssessment
    DependencyAnalysis *DependencyAnalysis
}
```

**Phase 2: Solution Design**
```go
type SolutionDesign struct {
    ArchitectureDesign *ArchitectureDesign
    MigrationStrategy  *MigrationStrategy
    PerformancePlan    *PerformanceOptimizationPlan
    SecurityDesign     *SecurityArchitecture
}
```

**Phase 3: Validation and Implementation**
```go
type ValidationPhase struct {
    FunctionalTesting  *FunctionalTestSuite
    PerformanceTesting *PerformanceTestSuite
    SecurityValidation *SecurityTestSuite
    ComplianceAudit    *ComplianceAudit
}
```

## 2. Language and Communication Standards

### 2.1 Indonesian Language Priority Matrix

| Context | Primary Language | Secondary Language | Rationale |
|---------|------------------|-------------------|-----------|
| **User-facing Content** | Indonesian | None | User experience and cultural respect |
| **Technical Documentation** | English | Indonesian summaries | International collaboration |
| **Code Comments** | English | Indonesian for business logic | Maintainability |
| **Government Communications** | Indonesian | English for technical specs | Cultural respect and compliance |
| **Error Messages** | Indonesian | English debug info | User understanding with debugging |

### 2.2 Content Quality Standards
- **Indonesian Content**: Use formal Indonesian (bahasa baku), government terminology, cultural sensitivity
- **English Content**: Technical precision, international standards, clear communication
- **Bilingual Requirements**: Provide both user-friendly Indonesian and technical English where needed

### 2.3 Error Message Standards
```typescript
export const ErrorMessages = {
  // User-facing (Indonesian)
  INVALID_LOGIN: 'Email atau kata sandi tidak valid',
  SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan masuk kembali',

  // Debug information (English)
  DEBUG_INFO: {
    INVALID_LOGIN: 'Authentication failed: invalid credentials provided',
    SESSION_EXPIRED: 'JWT token expired or invalid signature'
  }
};
```

## 3. Development Environment and Workflow

### 3.1 Package Management and Environment
**Kilo Rule #5**: Standardized development environment across all projects.

**Requirements**:
- **Package Manager**: pnpm exclusively for all dependency management
- **Version Control**: Git with conventional commit format
- **Environment Variables**: `.env.local` for sensitive keys, `NEXT_PUBLIC_` prefix for client keys
- **Build System**: Automated build recovery with 3-attempt fallback

**Required Commands**:
- Install: `pnpm install` or `pnpm i`
- Add: `pnpm add <package>` (production) or `pnpm add -D <package>` (development)
- Remove: `pnpm remove <package>`
- Update: `pnpm update`

### 3.2 PowerShell/Windows Compatibility
**Rule**: All commands and scripts must be PowerShell-compatible.
- Environment variables: `$env:VARIABLE_NAME = "value"`
- Use Node.js path utilities: `path.join()`, `path.resolve()`
- Treat file names as case-sensitive in code

### 3.3 Automated Git Workflow
**Kilo Rule #6**: Comprehensive Git workflow mandatory for all development activities.

#### Git Add Rules
**When to Stage Changes**:
- Stage changes immediately after completing a logical unit of work
- Include all related files: code, tests, documentation, and configuration
- Use `git add .` for complete staging of all changes
- Never stage partial or incomplete work

**Staging Requirements**:
- All code changes must be staged together with their corresponding tests
- Documentation updates must be staged with the code that requires them
- Configuration changes must be staged with the code that requires them
- No uncommitted changes should remain in the working directory

#### Git Commit Rules
**Commit Frequency**:
- Commit after completing each logical unit of work
- Never commit incomplete or broken code
- Commit frequency should align with feature completion, not arbitrary time intervals

**Commit Message Standards**:
- **Format**: `type(scope): description`
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Scope**: Optional, use component name (e.g., `feat(auth)`, `fix(api)`)
- **Description**: Clear, concise, imperative mood (e.g., "add user authentication", not "added user authentication")

**Examples**:
```bash
git commit -m "feat(auth): implement JWT token validation"
git commit -m "fix(api): resolve memory leak in chat handler"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(validation): add comprehensive input validation tests"
```

**Commit Content Requirements**:
- Each commit must represent a complete, working state
- Commits must pass all automated tests
- Documentation must be updated and committed with code changes
- No sensitive information (passwords, keys) in commits

#### Git Push Rules
**Push Timing**:
- Push after successful local validation and testing
- Push completed features or fixes, not work-in-progress
- Push frequency should match commit frequency for active development

**Branch Management**:
- **Main Branch**: Only push thoroughly tested, production-ready code
- **Feature Branches**: Push regularly to backup work and enable collaboration
- **Pull Requests**: Required for merging to main branch

**Push Validation Requirements**:
- All commits must pass local quality gates before pushing
- Automated CI/CD must validate pushed code
- Security scans must pass before push acceptance
- Documentation completeness must be verified

**Push Command Standards**:
```bash
# Standard push to current branch
git push origin <branch-name>

# Force push (only when absolutely necessary and approved)
git push --force-with-lease origin <branch-name>
```

### 3.4 Mandatory Documentation Updates
**Rule**: Documentation updates are REQUIRED before committing any successful implementation that was based on existing documentation.

**When Documentation Updates Are Required**:
- ✅ **API Changes**: When modifying existing API endpoints or contracts
- ✅ **Architecture Changes**: When altering system architecture or design patterns
- ✅ **Breaking Changes**: When introducing changes that affect other components
- ✅ **New Features**: When implementing features based on existing specifications
- ✅ **Bug Fixes**: When fixing issues documented in existing bug reports

**When Documentation Updates Are Optional**:
- 🔸 **Internal Refactoring**: Pure code reorganization without external impact
- 🔸 **Performance Optimization**: Internal performance improvements
- 🔸 **Code Comments**: Adding/updating inline code comments
- 🔸 **Test Coverage**: Adding tests without changing functionality

**Pre-Commit Documentation Requirements**:
1. **Source Documentation Update**: Update the original documentation that guided the implementation
2. **Implementation Notes**: Add lessons learned, corrections, or clarifications discovered during execution
3. **Deviation Documentation**: Record any deviations from the original plan with rationale
4. **Version Control**: Update version numbers and modification dates in affected documentation
5. **Accuracy Verification**: Ensure documentation reflects the current state after implementation

## 12. File Organization Standards

### 12.1 Backend File Organization Standards
**Kilo Rule #29**: Strict file organization mandatory for all project components.

#### Backend File Organization
**Test Files**:
- **Location**: All backend test files MUST be placed in `/backend/test/*`
- **Naming Convention**: `{component}_test.go` or `{component}_integration_test.go`
- **Structure**:
  ```
  backend/test/
  ├── unit/                    # Unit tests
  ├── integration/            # Integration tests
  ├── performance/            # Performance tests
  ├── e2e/                    # End-to-end tests
  └── fixtures/               # Test data and fixtures
  ```

**Documentation Files**:
- **Location**: All backend documentation files MUST be placed in `/backend/docs/*`
- **Naming Convention**: `YYYY-MM-DD-{title}.md`
- **Current Date**: 2025-08-31
- **Examples**:
  ```
  backend/docs/
  ├── 2025-08-31-phase3-implementation-report.md
  ├── 2025-08-31-performance-optimization-guide.md
  ├── 2025-08-31-security-audit-results.md
  └── 2025-08-31-migration-strategy-documentation.md
  ```

**Source Code Organization**:
```
backend/
├── cmd/                     # Application entry points
│   └── server/
├── internal/               # Private application code
│   ├── api/               # HTTP handlers and routes
│   ├── services/          # Business logic services
│   ├── config/            # Configuration management
│   ├── models/            # Data models and types
│   └── middleware/        # HTTP middleware
├── pkg/                   # Public packages
├── scripts/               # Build and deployment scripts
├── migrations/            # Database migrations
├── test/                  # Test files (as specified above)
└── docs/                  # Documentation (as specified above)
```

#### Frontend File Organization
**Test Files**:
- **Location**: `/frontend/src/__tests__/*` or `/frontend/src/components/**/__tests__/*`
- **Naming Convention**: `{component}.test.tsx` or `{component}.spec.tsx`

**Documentation Files**:
- **Location**: `/frontend/docs/*`
- **Naming Convention**: `YYYY-MM-DD-{title}.md`

#### General File Organization Rules
**Kilo Rule #30**: File placement enforcement.

- **MANDATORY**: All new files must follow the established directory structure
- **MANDATORY**: File names must follow the specified naming conventions
- **MANDATORY**: Date-based naming for documentation files using current system date

**Migration Guidance for Existing Projects**:
- **Phase 1**: Identify all files that don't follow the new structure
- **Phase 2**: Create migration plan with impact assessment
- **Phase 3**: Gradually move files during maintenance cycles
- **Phase 4**: Update all references and imports
- **Phase 5**: Validate that all systems work after migration

**Practical Exceptions**:
- **Legacy Projects**: May maintain existing structure during transition period
- **Third-party Code**: External libraries may keep their original structure
- **Build Artifacts**: Generated files (like `/backend/exe/*`) are automatically excluded
- **Temporary Files**: May be placed in project root during active development

**Enforcement**:
- Automated validation will warn about incorrectly placed files
- CI/CD pipeline will flag file organization issues
- Code reviews must verify file placement compliance
- Migration scripts available for bulk file reorganization

### 12.2 File Creation Guidelines
**Kilo Rule #31**: Mandatory file creation protocols for all new development.

#### Backend Test File Creation
**When to Create**: Every new backend component, service, or function must have corresponding tests
**Location**: `/backend/test/*` (unit, integration, performance, e2e subdirectories)
**Naming**: `{component}_test.go` for unit tests, `{component}_integration_test.go` for integration tests
**Content Requirements**:
- Test coverage must be >90%
- Include edge cases and error scenarios
- Document test scenarios and expected outcomes

#### Backend Documentation File Creation
**When to Create**: After completing any significant implementation or when documenting existing functionality
**Location**: `/backend/docs/*`
**Naming**: `YYYY-MM-DD-{descriptive-title}.md` (use current system date)
**Content Requirements**:
- Include implementation details and rationale
- Document any deviations from original plans
- Update version numbers and modification dates
- Include validation results and performance metrics

#### Backend Executable File Creation
**Kilo Rule #32**: Go build outputs must be placed in designated executable directory.

**When to Create**: After successful Go compilation and build process
**Location**: `/backend/exe/*` (MANDATORY for all Go executables)
**Naming Convention**:
- Production builds: `{service-name}` (e.g., `selly-backend`, `selly-backend.exe`)
- Test builds: `{service-name}-test` or `{service-name}-debug`
- Versioned builds: `{service-name}-v{version}` (e.g., `selly-backend-v1.2.0`)
**Build Commands**:
```bash
# Standard Production Build
cd backend
go build -o exe/selly-backend ./cmd/server

# Windows Build
cd backend
go build -o exe/selly-backend.exe ./cmd/server

# Versioned Build
cd backend
go build -ldflags "-X main.version=1.2.0" -o exe/selly-backend-v1.2.0 ./cmd/server
```

**Alternative Build Methods** (for different environments):
```bash
# Direct build from project root
go build -o backend/exe/selly-backend backend/cmd/server

# Build with custom flags
go build -ldflags "-s -w" -o exe/selly-backend ./cmd/server

# Cross-compilation for different platforms
GOOS=linux GOARCH=amd64 go build -o exe/selly-backend-linux ./cmd/server
GOOS=windows GOARCH=amd64 go build -o exe/selly-backend-windows.exe ./cmd/server
```

**Directory Structure**:
```
backend/exe/
├── selly-backend              # Production Linux/macOS executable
├── selly-backend.exe          # Production Windows executable
├── selly-backend-test         # Test/debug build
├── selly-backend-v1.2.0       # Versioned release
└── [other executables...]
```

**Flexible Build Options**:
- **Development**: Use any build method that produces working executables
- **CI/CD**: Must use standardized commands for consistency
- **Local Development**: May use alternative paths for convenience
- **Production**: Must follow exact commands for reproducibility

#### Frontend Build Commands
**Kilo Rule #33**: Standardized frontend build commands for development and production.

**Development Mode**:
```bash
cd frontend
pnpm dev
```

**Production Build**:
```bash
cd frontend
pnpm build
```

**Start Production Build**:
```bash
cd frontend
pnpm start
```

**Enforcement**:
- All frontend development must use `pnpm dev` for local development
- Production builds must use `pnpm build` followed by `pnpm start`
- CI/CD pipeline will validate build command usage
- Manual builds must follow this convention

## How to Apply These Rules

### Rule Application Guidelines

**1. New Projects**:
- ✅ Follow ALL rules from day one
- ✅ Use exact commands and directory structures specified
- ✅ Implement all required patterns and standards

**2. Existing Projects**:
- 🔄 **Phase 1**: Assess current compliance (1-2 weeks)
- 🔄 **Phase 2**: Create migration plan with priorities (1 week)
- 🔄 **Phase 3**: Implement high-priority rules first (security, file organization)
- 🔄 **Phase 4**: Gradually adopt remaining standards (2-4 weeks)
- 🔄 **Phase 5**: Full compliance validation (1 week)

**3. Rule Priority Levels**:
- **🔴 Critical**: Must be followed immediately (security, data sovereignty)
- **🟡 High**: Should be implemented soon (file organization, testing)
- **🟢 Medium**: Recommended for quality improvement (documentation, performance)
- **🔵 Low**: Optional enhancements (advanced patterns, optimizations)

**4. When to Seek Exceptions**:
- ✅ **Legacy Systems**: During migration periods
- ✅ **Third-party Integration**: When external systems require different approaches
- ✅ **Performance Requirements**: When standards conflict with critical performance needs
- ✅ **Technical Limitations**: When platform constraints prevent compliance

**5. Getting Help**:
- 📖 **Documentation**: Refer to this guide first
- 👥 **Team Discussion**: Discuss exceptions with team lead
- 🎯 **Architecture Review**: Involve architects for complex decisions
- 📝 **Document Decisions**: Record all exceptions with rationale

#### Automatic Documentation Updates
**Rule**: Documentation updates are REQUIRED before committing any successful implementation
- Update source documentation that guided the implementation
- Add lessons learned and implementation notes
- Document deviations with rationale
- Verify documentation accuracy before git operations

#### File Placement Validation
**Rule**: All file operations must pass automated validation
- CI/CD pipeline will reject incorrectly placed files
- Code reviews must verify file organization compliance
- Automated tools will enforce naming conventions
- Migration scripts available for bulk file reorganization

### 12.4 Manual Review Checklist
- [ ] Language usage follows context matrix
- [ ] File naming follows standards
- [ ] Security requirements implemented
- [ ] Accessibility compliance verified
- [ ] Government integration standards met
- [ ] Documentation created and complete
- [ ] Documentation updates completed for implementation-based work
- [ ] Source documentation reflects current implementation state
- [ ] Go executables placed in `/backend/exe/` directory
- [ ] Executable naming follows established conventions

## 4. Technology Stack and Architecture

### 4.1 Core Technology Standards
**Kilo Rule #10**: Standardized technology stack for optimal performance and maintainability.

**Frontend Stack**:
- **Framework**: Next.js with App Router
- **Language**: TypeScript (strict mode mandatory)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks and context
- **Testing**: Jest + React Testing Library

**Backend Stack**:
- **Language**: Go 1.21+
- **Framework**: Gin web framework
- **Database**: PostgreSQL with Supabase integration
- **Cache**: Redis with multi-level caching strategy
- **Message Queue**: Redis pub/sub for real-time features

### 4.2 Architecture Patterns
**Kilo Rule #11**: Standardized architectural patterns for scalability and maintainability.

**Service Architecture**:
```go
type ServiceArchitecture struct {
    APILayer       *APILayer
    ServiceLayer   *ServiceLayer
    RepositoryLayer *RepositoryLayer
    InfrastructureLayer *InfrastructureLayer
}

type APILayer struct {
    Handlers    map[string]Handler
    Middleware  []Middleware
    Validators  []Validator
}

type ServiceLayer struct {
    BusinessLogic   *BusinessLogic
    Orchestrators   []Orchestrator
    Transformers    []Transformer
}
```

### 4.3 AI/ML Integration Standards
**Kilo Rule #12**: Standardized AI/ML service integration patterns.

**Multi-Provider AI Architecture**:
```go
type UnifiedAIService struct {
    providers       map[string]AIProvider
    providerSelector *ProviderSelector
    fallbackChain   []string
    performanceMonitor *PerformanceMonitor
    cache           *IntelligentCache
}

func (uas *UnifiedAIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    providerName := uas.providerSelector.SelectOptimalProvider(req)

    provider := uas.providers[providerName]
    response, err := uas.processWithProvider(ctx, provider, req)
    if err == nil {
        return response, nil
    }

    // Intelligent fallback with performance tracking
    for _, fallbackProvider := range uas.fallbackChain {
        if fallbackProvider == providerName {
            continue
        }

        provider = uas.providers[fallbackProvider]
        if response, err = uas.processWithProvider(ctx, provider, req); err == nil {
            uas.performanceMonitor.RecordFallback(providerName, fallbackProvider)
            return response, nil
        }
    }

    return nil, fmt.Errorf("all providers failed: %w", err)
}
```

## 5. Code Quality and Architecture Standards

### 5.1 TypeScript Standards
**Mandatory Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 5.2 Component Architecture
**Rule**: Use functional components with hooks exclusively.
```typescript
interface ComponentProps {
  userId: string;
  onUpdate: (data: Data) => void;
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({
  userId,
  onUpdate,
  className
}) => {
  const [state, setState] = useState<State | null>(null);

  const memoizedValue = useMemo(() =>
    state ? processData(state) : null,
    [state]
  );

  const handleUpdate = useCallback((newData: Data) => {
    setState(newData);
    onUpdate(newData);
  }, [onUpdate]);

  return (
    <div className={cn('component', className)}>
      {/* Implementation */}
    </div>
  );
};
```

### 5.3 API Contract Protection
**Rule**: When improving frontend, treat backend/API as inviolable contract.
- Analyze all API calls before making changes
- Ensure frontend changes are compatible with existing data structures
- If API changes are needed, present as separate recommendation:
  "To achieve frontend improvement X, a change to API Y is required."

### 5.4 Go Code Standards and Conventions
**Kilo Rule #23**: Consistent code standards across all implementations.

**Go Code Standards**:
```go
// File: internal/services/ai/service.go
package ai

import (
    "context"
    "fmt"
    "time"

    "github.com/selly-go/backend/internal/models"
    "github.com/selly-go/backend/internal/repository"
)

// Service represents the AI service
type Service struct {
    repo     repository.AI
    cache    Cache
    monitor  Monitor
}

// ProcessQuery processes an AI query with comprehensive error handling
func (s *Service) ProcessQuery(ctx context.Context, req *models.AIRequest) (*models.AIResponse, error) {
    start := time.Now()
    defer func() {
        s.monitor.RecordLatency("ProcessQuery", time.Since(start))
    }()

    // Input validation
    if err := s.validateRequest(req); err != nil {
        s.monitor.RecordError("ProcessQuery", err)
        return nil, fmt.Errorf("invalid request: %w", err)
    }

    // Cache check
    if cached, found := s.cache.Get(req.CacheKey()); found {
        s.monitor.RecordCacheHit("ProcessQuery")
        return cached, nil
    }

    // Process query
    response, err := s.processQuery(ctx, req)
    if err != nil {
        s.monitor.RecordError("ProcessQuery", err)
        return nil, fmt.Errorf("processing failed: %w", err)
    }

    // Cache result
    s.cache.Set(req.CacheKey(), response, s.getCacheTTL(req))

    return response, nil
}
```

### 5.5 Error Handling Patterns
**Kilo Rule #24**: Standardized error handling across all services.

**Error Handling Framework**:
```go
type ErrorHandler struct {
    errorClassifier *ErrorClassifier
    retryPolicy     *RetryPolicy
    fallbackHandler *FallbackHandler
    alertManager    *AlertManager
}

func (eh *ErrorHandler) HandleError(err error, context *ErrorContext) error {
    errorType := eh.errorClassifier.ClassifyError(err)

    switch errorType {
    case ErrorTypeRetryable:
        if eh.retryPolicy.ShouldRetry(context) {
            return eh.retryPolicy.ExecuteWithRetry(context.Operation, context.MaxRetries)
        }
    case ErrorTypeFallback:
        return eh.fallbackHandler.ExecuteFallback(context)
    case ErrorTypeCritical:
        eh.alertManager.SendCriticalAlert(err, context)
        return err
    default:
        return eh.handleGenericError(err, context)
    }

    return err
}
```

### 5.6 Logging Standards
**Kilo Rule #25**: Structured logging mandatory for all operations.

**Logging Framework**:
```go
type Logger struct {
    structuredLogger *StructuredLogger
    contextEnricher  *ContextEnricher
    filterEngine     *FilterEngine
}

func (l *Logger) LogOperation(operation string, context *LogContext) {
    enrichedContext := l.contextEnricher.Enrich(context)

    if l.filterEngine.ShouldLog(enrichedContext) {
        l.structuredLogger.Log(&LogEntry{
            Timestamp:   time.Now(),
            Operation:   operation,
            Level:       enrichedContext.Level,
            Message:     enrichedContext.Message,
            Fields:      enrichedContext.Fields,
            TraceID:     enrichedContext.TraceID,
            UserID:      enrichedContext.UserID,
            SessionID:   enrichedContext.SessionID,
            RequestID:   enrichedContext.RequestID,
            IPAddress:   enrichedContext.IPAddress,
            UserAgent:   enrichedContext.UserAgent,
        })
    }
}
```

## 6. Performance Optimization Rules

### 6.1 Multi-Level Caching Strategy
**Kilo Rule #13**: Mandatory multi-level caching for all performance-critical operations.

**Intelligent Cache Architecture**:
```go
type IntelligentCache struct {
    l1Cache         *fastcache.Cache      // Ultra-fast memory cache
    l2Cache         *redis.Client         // Distributed cache
    l3Cache         *database.Service     // Persistent cache
    bloomFilter     *bloom.BloomFilter    // Fast negative lookups
    cacheAnalyzer   *CacheAnalyzer        // Usage pattern analysis
    prefetchEngine  *PrefetchEngine       // Predictive prefetching
}

func (ic *IntelligentCache) GetWithIntelligence(key string) (interface{}, error) {
    // L1 cache check (microsecond latency)
    if data, found := ic.l1Cache.Get([]byte(key)); found {
        return ic.deserialize(data), nil
    }

    // Bloom filter check (nanosecond latency)
    if !ic.bloomFilter.Test([]byte(key)) {
        return nil, ErrCacheMiss
    }

    // L2 cache check (millisecond latency)
    if data, err := ic.l2Cache.Get(ctx, key).Result(); err == nil {
        // Promote to L1 cache
        ic.l1Cache.Set([]byte(key), []byte(data))
        return ic.deserialize([]byte(data)), nil
    }

    // L3 cache check (database)
    if data, err := ic.l3Cache.Get(ctx, key); err == nil {
        // Promote to higher caches
        ic.promoteToHigherCaches(key, data)
        return data, nil
    }

    return nil, ErrCacheMiss
}
```

### 6.2 Parallel Processing Patterns
**Kilo Rule #14**: Parallel processing mandatory for independent operations.

**Concurrent Processing Framework**:
```go
type ParallelProcessor struct {
    workerPool    *ants.Pool
    resultChannel chan Result
    errorChannel  chan error
    semaphore     chan struct{}
}

func (pp *ParallelProcessor) ProcessConcurrently(tasks []Task) ([]Result, error) {
    results := make([]Result, 0, len(tasks))
    var wg sync.WaitGroup

    for _, task := range tasks {
        wg.Add(1)
        go func(t Task) {
            defer wg.Done()

            result, err := pp.workerPool.Submit(func() (interface{}, error) {
                return t.Execute()
            })

            if err != nil {
                pp.errorChannel <- err
                return
            }

            pp.resultChannel <- result.(Result)
        }(task)
    }

    wg.Wait()
    close(pp.resultChannel)
    close(pp.errorChannel)

    // Collect results
    for result := range pp.resultChannel {
        results = append(results, result)
    }

    // Check for errors
    select {
    case err := <-pp.errorChannel:
        return nil, err
    default:
        return results, nil
    }
}
```

### 6.3 Performance Monitoring and Alerting
**Kilo Rule #15**: Real-time performance monitoring mandatory for all services.

**Performance Monitoring Framework**:
```go
type PerformanceMonitor struct {
    metricsCollector *MetricsCollector
    alertManager     *AlertManager
    thresholdManager *ThresholdManager
    trendAnalyzer    *TrendAnalyzer
}

func (pm *PerformanceMonitor) MonitorEndpoint(endpoint string, duration time.Duration, success bool) {
    pm.metricsCollector.RecordLatency(endpoint, duration)
    pm.metricsCollector.RecordSuccess(endpoint, success)

    if duration > pm.thresholdManager.GetLatencyThreshold(endpoint) {
        pm.alertManager.SendLatencyAlert(endpoint, duration)
    }

    if !success {
        pm.metricsCollector.RecordError(endpoint)
        if pm.metricsCollector.GetErrorRate(endpoint) > pm.thresholdManager.GetErrorThreshold(endpoint) {
            pm.alertManager.SendErrorRateAlert(endpoint)
        }
    }
}
```

### 6.4 Frontend Performance Optimization
**Mandatory Practices**:
- Use React.memo for expensive components
- Implement virtualization for large datasets
- Debounce search inputs
- Memoize expensive calculations
- Use proper dependency arrays in hooks

## 7. Security and Compliance Framework

### 7.1 Encryption Standards
**Kilo Rule #16**: Enterprise-grade encryption mandatory for all data operations.

**Encryption Framework**:
```go
type EnterpriseEncryptionService struct {
    encryptionStandards map[string]EncryptionStandard
    keyManager         *KeyManager
    auditLogger        *AuditLogger
}

var encryptionStandards = map[string]EncryptionStandard{
    "data_at_rest": {
        Algorithm: "AES-256-GCM",
        KeyRotation: 90 * 24 * time.Hour,
        HSMRequired: true,
    },
    "data_in_transit": {
        Protocol: "TLS 1.3",
        CipherSuites: []string{"TLS_AES_256_GCM_SHA384"},
        CertificateValidation: true,
    },
    "key_exchange": {
        Algorithm: "RSA-4096",
        PerfectForwardSecrecy: true,
    },
}
```

### 7.2 Access Control and Authorization
**Kilo Rule #17**: Role-Based Access Control (RBAC) mandatory for all operations.

**RBAC Framework**:
```go
type AccessControlService struct {
    roleManager     *RoleManager
    permissionManager *PermissionManager
    sessionManager  *SessionManager
    auditLogger     *AuditLogger
}

func (acs *AccessControlService) ValidateAccess(ctx context.Context, userID, resource, action string) error {
    userRoles := acs.roleManager.GetUserRoles(userID)
    requiredPermissions := acs.permissionManager.GetRequiredPermissions(resource, action)

    for _, role := range userRoles {
        rolePermissions := acs.roleManager.GetRolePermissions(role)
        if acs.hasRequiredPermissions(rolePermissions, requiredPermissions) {
            acs.auditLogger.LogAccessAttempt(userID, resource, action, true)
            return nil
        }
    }

    acs.auditLogger.LogAccessAttempt(userID, resource, action, false)
    return ErrAccessDenied
}
```

### 7.3 Audit Trail Requirements
**Kilo Rule #18**: Comprehensive audit logging mandatory for all operations.

**Audit Framework**:
```go
type AuditService struct {
    eventLogger     *EventLogger
    complianceEngine *ComplianceEngine
    retentionManager *RetentionManager
    integrityChecker *IntegrityChecker
}

func (as *AuditService) LogSecurityEvent(event *SecurityEvent) error {
    auditEntry := &AuditEntry{
        Timestamp:     time.Now(),
        EventType:     event.Type,
        UserID:        event.UserID,
        Resource:      event.Resource,
        Action:        event.Action,
        IPAddress:     event.IPAddress,
        UserAgent:     event.UserAgent,
        Success:       event.Success,
        Details:       event.Details,
        DigitalSignature: as.generateDigitalSignature(event),
    }

    // Log to tamper-proof audit log
    if err := as.eventLogger.LogEntry(auditEntry); err != nil {
        return fmt.Errorf("failed to log audit entry: %w", err)
    }

    // Check compliance requirements
    if err := as.complianceEngine.ValidateCompliance(auditEntry); err != nil {
        as.alertManager.SendComplianceAlert(err)
    }

    return nil
}
```

### 7.4 Indonesian Data Protection Compliance
**Mandatory Compliance**: Adhere to UU No. 27 Tahun 2022 (PDP Law), PP No. 71 Tahun 2019, and related regulations.

**Implementation Requirements**:
- Explicit informed consent for data processing
- Data minimization principles
- Purpose limitation enforcement
- Appropriate retention policies
- Comprehensive security safeguards
- 72-hour breach notification

## 8. Quality Assurance and Testing

### 8.1 Testing Standards
**Kilo Rule #19**: Comprehensive testing mandatory with minimum coverage requirements.

**Testing Framework**:
```go
type QualityAssuranceSuite struct {
    unitTests       *UnitTestSuite
    integrationTests *IntegrationTestSuite
    performanceTests *PerformanceTestSuite
    securityTests    *SecurityTestSuite
    complianceTests  *ComplianceTestSuite
}

func (qas *QualityAssuranceSuite) RunFullTestSuite() *TestReport {
    report := &TestReport{
        Coverage:    qas.calculateCoverage(),
        Performance: qas.runPerformanceTests(),
        Security:    qas.runSecurityTests(),
        Compliance:  qas.runComplianceTests(),
    }

    if report.Coverage < 0.90 {
        report.Status = TestStatusFailed
        report.FailureReason = "Test coverage below 90%"
    }

    return report
}
```

### 8.2 Automated Quality Gates
**Kilo Rule #20**: Quality gates mandatory for all deployments.

**Quality Gate Framework**:
```go
type QualityGate struct {
    name        string
    checks      []QualityCheck
    thresholds  map[string]float64
    blocking    bool
}

var qualityGates = []QualityGate{
    {
        name: "Code Quality",
        checks: []QualityCheck{
            {name: "TypeScript Compilation", validator: validateTypeScript},
            {name: "ESLint Validation", validator: validateESLint},
            {name: "Test Coverage", validator: validateCoverage},
        },
        thresholds: map[string]float64{
            "coverage": 0.90,
            "eslint_errors": 0,
        },
        blocking: true,
    },
    {
        name: "Security",
        checks: []QualityCheck{
            {name: "Vulnerability Scan", validator: scanVulnerabilities},
            {name: "Secrets Detection", validator: detectSecrets},
            {name: "Compliance Check", validator: validateCompliance},
        },
        blocking: true,
    },
}
```

### 8.3 Testing Requirements
**Minimum Standards**:
- 90% test coverage
- Unit tests for all business logic
- Integration tests for component interactions
- Performance tests for critical paths
- Government system integration tests

## 9. Documentation and Knowledge Management

### 9.1 Documentation Standards
**Kilo Rule #21**: Work is not complete until comprehensively documented.

**Documentation Framework**:
```go
type DocumentationManager struct {
    contentGenerator *ContentGenerator
    versionControl   *VersionControl
    searchIndex      *SearchIndex
    accessControl    *AccessControl
}

func (dm *DocumentationManager) CreateComprehensiveDocumentation(project *Project) error {
    docs := []Documentation{
        dm.createTechnicalSpecification(project),
        dm.createAPIReference(project),
        dm.createUserGuide(project),
        dm.createDeploymentGuide(project),
        dm.createTroubleshootingGuide(project),
    }

    for _, doc := range docs {
        if err := dm.contentGenerator.Generate(doc); err != nil {
            return fmt.Errorf("failed to generate documentation: %w", err)
        }

        if err := dm.versionControl.Commit(doc); err != nil {
            return fmt.Errorf("failed to version control documentation: %w", err)
        }
    }

    return nil
}
```

### 9.2 Knowledge Base Integration
**Kilo Rule #22**: All documentation integrated into searchable knowledge base.

**Knowledge Base Framework**:
```go
type KnowledgeBase struct {
    documentStore   *DocumentStore
    searchEngine    *SearchEngine
    recommendationEngine *RecommendationEngine
    collaborationTools *CollaborationTools
}

func (kb *KnowledgeBase) SearchAndRecommend(query string, context *SearchContext) *SearchResults {
    // Perform semantic search
    semanticResults := kb.searchEngine.SemanticSearch(query)

    // Apply context filtering
    filteredResults := kb.filterByContext(semanticResults, context)

    // Generate recommendations
    recommendations := kb.recommendationEngine.GenerateRecommendations(query, context)

    return &SearchResults{
        DirectResults: filteredResults,
        Recommendations: recommendations,
        RelatedTopics: kb.findRelatedTopics(query),
    }
}
```

### 9.3 Directory Structure Standards
```markdown
docs/
├── plan/                          # Active planning (English primary)
├── archive/plan/YYYY-MM-DD-*/     # Completed phases
├── technical/                     # Technical docs (English primary)
├── user/                         # User documentation (Indonesian primary)
├── compliance/                   # Government compliance (Indonesian primary)
├── security/                     # Security protocols (English primary)
└── api/                         # API documentation (English primary)
```

### 9.4 File Naming Convention
**Format**: `YYYY-MM-DD-short-description.md` (hyphens throughout)

**Examples**:
- `2025-08-13-phase4-ai-intelligence-enhancement.md`
- `2025-08-13-government-integration-setup.md`
- `2025-08-13-panduan-pengguna-sistem-administrasi.md`

### 9.5 Document Metadata Standards
```markdown
**Document**: [Document Title]
**Project Date**: YYYY-MM-DD
**Created**: YYYY-MM-DD
**Version**: X.Y
**Status**: [🚀 Ready | ✅ Complete | 🔄 In Progress | ⚠️ Review]
**Priority**: [🧠 Critical | 📈 High | 📋 Medium | 📝 Low]
**Language**: [English/Indonesian/Bilingual]
**Audience**: [Technical Team/Government/End Users/Mixed]
```

## 10. Migration Framework and Patterns

### 10.1 Pre-Migration Analysis Requirements
**Kilo Rule #7**: Comprehensive analysis mandatory before any migration.

**Analysis Framework**:
```go
type MigrationAnalysis struct {
    SourceSystemAnalysis *SystemAnalysis
    TargetSystemDesign   *SystemDesign
    WorkflowMapping      *WorkflowMapping
    PerformanceBaseline  *PerformanceBaseline
    RiskAssessment       *MigrationRiskAssessment
    RollbackStrategy     *RollbackStrategy
}
```

### 10.2 Migration Pattern Categories
**Kilo Rule #8**: Standardized migration patterns for common scenarios.

#### API Route Migration Pattern
```typescript
// BEFORE: Next.js API Route
export async function POST(request: NextRequest) {
  const { message, context } = await request.json();
  const response = await aiService.processQuery(message, context);
  return NextResponse.json({ success: true, response });
}
```

```go
// AFTER: Go HTTP Handler
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

#### Database Operation Migration
```typescript
// BEFORE: Next.js Supabase
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
    query := `INSERT INTO training_data (query, response, user_id, metadata) VALUES ($1, $2, $3, $4)`
    _, err := s.db.ExecContext(ctx, query, data.Query, data.Response, data.UserID, data.Metadata)
    return err
}
```

### 10.3 Functional Parity Validation
**Kilo Rule #9**: Migration must maintain 100% functional parity.

**Validation Framework**:
```go
type FunctionalParityTest struct {
    TestName        string
    SourceEndpoint  string
    TargetEndpoint  string
    TestCases       []TestCase
    ExpectedResults []ExpectedResult
    PerformanceTarget time.Duration
}

func (fpt *FunctionalParityTest) ValidateParity() *ParityReport {
    // Comprehensive comparison of source vs target behavior
}
```

## 11. Government Integration Standards

### 11.1 Data Sovereignty Requirements
**Absolute Requirement**: All Indonesian government data must remain within Indonesian jurisdiction (ap-southeast-1, ap-southeast-3 regions only).

### 11.2 Government System Integration
**Supported Systems**:
- **Dukcapil**: Population & civil registration
- **Kemendagri**: Ministry of Home Affairs
- **BPN**: National Land Agency
- **Additional systems**: As required by project scope

**Integration Requirements**:
- Secure encrypted communication channels
- Comprehensive audit logging
- Cultural communication protocols
- Regulatory compliance validation

### 11.3 Cultural Communication Standards
**Government Protocol Requirements**:
- Use formal Indonesian for all communications
- Follow Indonesian government communication protocols
- Include proper institutional headers
- Respect administrative hierarchy
- Provide required legal disclaimers

### 11.4 User Interface and Experience Standards

#### Comprehensive Responsiveness
**Rule**: Ensure perfect adaptation across all device types and resolutions:
- Mobile devices
- Tablets
- Laptops
- HD (1920x1080)
- 2K (~2560x1440)
- 4K (~3840x2160)

**Implementation Strategy**:
- **Adaptive Layouts**: Reorganize components for available screen space
- **Fluid Typography**: Adjust font sizes and line heights proportionally
- **Asset Optimization**: Serve appropriately-sized media for each device
- **Touch Targets**: Minimum 44px for mobile accessibility

#### Accessibility Standards
**WCAG 2.1 AA Compliance**: Mandatory for all UI components
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements
- Focus management
- Alternative text for images

#### Enterprise-Grade Design Patterns
**Visual Standards**:
- Glass-morphism effects with backdrop-blur
- Subtle glowing borders and shadows
- Smooth micro-animations (duration-300)
- Comprehensive dark/light theme support
- Consistent color gradients and hover effects

## 13. Validation and Enforcement

### 12.1 Automated Validation Framework
**Kilo Rule #26**: Automated validation mandatory for all code changes.

**Validation Framework**:
```go
type ValidationEngine struct {
    staticAnalyzer   *StaticAnalyzer
    securityScanner  *SecurityScanner
    performanceValidator *PerformanceValidator
    complianceChecker *ComplianceChecker
}

func (ve *ValidationEngine) ValidateCodebase() *ValidationReport {
    report := &ValidationReport{
        StaticAnalysis:   ve.staticAnalyzer.Analyze(),
        SecurityScan:     ve.securityScanner.Scan(),
        PerformanceCheck: ve.performanceValidator.Validate(),
        ComplianceCheck:  ve.complianceChecker.Verify(),
    }

    report.OverallStatus = ve.calculateOverallStatus(report)
    return report
}

### 13.2 Continuous Integration Pipeline
**Kilo Rule #27**: Comprehensive CI/CD pipeline mandatory for all projects.

**CI/CD Pipeline**:
```yaml
# .github/workflows/kilo-code-pipeline.yml
name: Kilo Code CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run Kilo Code Validation
        run: |
          ./scripts/validate-kilo-code.sh

      - name: Generate Validation Report
        run: |
          ./scripts/generate-validation-report.sh
```

### 13.3 Enforcement Mechanisms
**Kilo Rule #28**: Automated enforcement of all Kilo Code rules.

**Enforcement Framework**:
```go
type EnforcementEngine struct {
    ruleEngine      *RuleEngine
    violationTracker *ViolationTracker
    remediationEngine *RemediationEngine
    notificationService *NotificationService
}

func (ee *EnforcementEngine) EnforceRules(codebase *Codebase) *EnforcementReport {
    violations := ee.ruleEngine.ScanForViolations(codebase)

    report := &EnforcementReport{
        Violations: violations,
        Severity:   ee.calculateSeverity(violations),
        Blocking:   ee.hasBlockingViolations(violations),
    }

    if len(violations) > 0 {
        ee.violationTracker.TrackViolations(violations)
        ee.notificationService.NotifyStakeholders(violations)

        if report.Blocking {
            ee.remediationEngine.ExecuteBlockingRemediation(violations)
        } else {
            ee.remediationEngine.SuggestRemediation(violations)
        }
    }

    return report
}
```

## 14. Response Standards and Tool Integration

### 14.1 PowerShell Command Integration
**Kilo Rule #34**: Every response must incorporate PowerShell commands and maximize utilization of /backend/docs and /backend/test folders.

**Requirements**:
- **PowerShell Integration**: All responses must include executable PowerShell commands with clear explanations
- **Folder Utilization**: Maximize use of `/backend/docs/*` for documentation and `/backend/test/*` for testing artifacts
- **Structured Examples**: Provide examples in the following format:
  1. PowerShell command with explanation
  2. Integration with specified folders
  3. Expected output or verification steps
- **Context Awareness**: Ensure all instructions are precise, context-aware, and free of ambiguities
- **Executable Commands**: Commands must be immediately runnable in Windows PowerShell environment

**Implementation Standards**:
- Use `$env:VARIABLE_NAME` for environment variables
- Leverage PowerShell path utilities for cross-platform compatibility
- Include error handling and verification steps
- Document folder-specific operations clearly

### 14.2 Folder-Specific Integration Patterns

#### Backend Documentation Folder (/backend/docs/*)
**Mandatory Utilization**:
- All documentation updates must be placed in `/backend/docs/*`
- Use date-based naming: `YYYY-MM-DD-descriptive-title.md`
- Include implementation details, rationale, and validation results
- Update existing documentation before committing changes

**PowerShell Integration Example**:
1. **PowerShell Command**: `New-Item -Path "backend/docs/$(Get-Date -Format 'yyyy-MM-dd')-powershell-integration-update.md" -ItemType File -Value "# PowerShell Integration Update`n`n## Overview`nThis document outlines PowerShell command integration standards."`
   - **Explanation**: Creates a new documentation file with current date prefix and initializes with markdown content for PowerShell integration standards.

2. **Integration with Specified Folders**: This command directly creates content in `/backend/docs/*` folder, ensuring all documentation follows the mandatory date-based naming convention and folder structure.

3. **Expected Output/Verification Steps**:
   - File created: `backend/docs/2025-09-01-powershell-integration-update.md`
   - Verify: `Test-Path "backend/docs/$(Get-Date -Format 'yyyy-MM-dd')-powershell-integration-update.md"`
   - Expected result: `True`
   - Content check: `Get-Content "backend/docs/$(Get-Date -Format 'yyyy-MM-dd')-powershell-integration-update.md"`

#### Backend Test Folder (/backend/test/*)
**Mandatory Utilization**:
- All test files must be placed in `/backend/test/*` subdirectories
- Naming convention: `{component}_test.go` for unit tests, `{component}_integration_test.go` for integration tests
- Include comprehensive test coverage (>90%)
- Document test scenarios and expected outcomes

**PowerShell Integration Example**:
1. **PowerShell Command**: `New-Item -Path "backend/test/unit/powershell_integration_test.go" -ItemType File -Value "package main`n`nimport (`n`t`"testing"`n`t`"github.com/stretchr/testify/assert"`n`)`n`nfunc TestPowerShellIntegration(t *testing.T) {`n`t// Test PowerShell command execution`n`tassert.True(t, true, `"PowerShell integration test placeholder`")`n}"`
   - **Explanation**: Creates a new unit test file in the `/backend/test/unit/*` subdirectory with basic Go test structure for PowerShell integration testing.

2. **Integration with Specified Folders**: This command places the test file in `/backend/test/*` ensuring compliance with mandatory test file organization and naming conventions.

3. **Expected Output/Verification Steps**:
   - File created: `backend/test/unit/powershell_integration_test.go`
   - Verify: `Test-Path "backend/test/unit/powershell_integration_test.go"`
   - Expected result: `True`
   - Run test: `cd backend && go test ./test/unit/powershell_integration_test.go -v`
   - Expected output: Test passes with success message

### 14.3 Automated Folder Management
**Kilo Rule #35**: Automated PowerShell scripts for folder maintenance mandatory.

**Requirements**:
- Create PowerShell scripts for folder structure validation
- Automate documentation and test file organization
- Include verification and cleanup operations
- Ensure Windows PowerShell compatibility

**PowerShell Script Example**:
1. **PowerShell Command**:
   ```powershell
   # Validate and create required folder structure
   $folders = @("backend/docs", "backend/test/unit", "backend/test/integration", "backend/test/performance")
   foreach ($folder in $folders) {
       if (!(Test-Path $folder)) {
           New-Item -Path $folder -ItemType Directory -Force
           Write-Host "Created folder: $folder"
       } else {
           Write-Host "Folder exists: $folder"
       }
   }
   ```
   - **Explanation**: Validates existence of required backend folders and creates them if missing, ensuring proper folder structure for documentation and testing.

2. **Integration with Specified Folders**: This script specifically manages `/backend/docs/*` and `/backend/test/*` subdirectories, enforcing the mandatory folder organization standards.

3. **Expected Output/Verification Steps**:
   - Run script in project root
   - Expected output: "Created folder: backend/docs" (if missing) or "Folder exists: backend/docs"
   - Verify structure: `Get-ChildItem -Path "backend" -Directory`
   - Expected folders: docs, test (with subfolders: unit, integration, performance)

### 14.4 Response Quality Standards
**Mandatory Elements in Every Response**:
- Include at least one executable PowerShell command
- Demonstrate folder utilization with concrete examples
- Provide verification steps for all operations
- Ensure commands are context-aware and unambiguous
- Document expected outputs and error handling

**Enforcement**:
- Automated validation will check for PowerShell command inclusion
- CI/CD pipeline will verify folder utilization compliance
- Code reviews must confirm response standards adherence
- Training materials must include PowerShell integration examples

### Government System Error Handling
```typescript
export class GovernmentErrorHandler {
  async handleGovernmentSystemError(error: GovernmentSystemError, context: OperationContext): Promise<ErrorHandlingResult> {
    await this.auditLogger.logSystemError({
      system: error.system,
      errorType: error.type,
      severity: this.classifyErrorSeverity(error),
      context: this.sanitizeContext(context),
      timestamp: new Date()
    });

    const userMessage = await this.generateUserFriendlyMessage(error);
    const recoveryAction = await this.determineRecoveryAction(error);

    return { userMessage, recoveryAction, shouldRetry: this.shouldRetryOperation(error), escalationRequired: this.requiresEscalation(error) };
  }
}
```

### Data Sovereignty Validation
```typescript
export class DataSovereigntyValidator {
  private readonly ALLOWED_REGIONS = ['ap-southeast-1', 'ap-southeast-3'];
  private readonly PROHIBITED_REGIONS = ['us-east-1', 'eu-west-1'];

  async validateDataLocation(request: GovernmentDataRequest): Promise<ValidationResult> {
    if (this.PROHIBITED_REGIONS.includes(request.region)) {
      throw new DataSovereigntyViolation('Government data cannot be processed outside Indonesian jurisdiction');
    }
    return { compliant: true, region: request.region };
  }
}
```

### Encryption Service Implementation
```typescript
export class EnterpriseEncryptionService {
  private readonly ENCRYPTION_STANDARDS = {
    dataAtRest: 'AES-256-GCM',
    dataInTransit: 'TLS-1.3',
    keyExchange: 'RSA-4096',
    hashing: 'SHA-256'
  };

  async encryptSensitiveData(data: SensitiveData, classification: DataClassification): Promise<EncryptedData> {
    const encryptionKey = await this.getOrCreateEncryptionKey(classification);
    const algorithm = this.getEncryptionAlgorithm(classification);
    const encrypted = await this.encrypt(data, encryptionKey, algorithm);

    return { encryptedData: encrypted, keyId: encryptionKey.id, algorithm, timestamp: new Date(), classification };
  }
}
```

## Migration and Implementation Strategy

### Existing Code Migration
1. **Preserve Functionality**: Do not break existing features during migration
2. **Gradual Enhancement**: Apply standards during regular maintenance cycles
3. **Priority Implementation**: Focus on security and government integration first
4. **Documentation Updates**: Update existing docs to follow new standards

### Quality Assurance Process
1. **Automated Validation**: Run quality gates on every commit
2. **Peer Review**: Require review for all government-related changes
3. **Security Audits**: Regular penetration testing and vulnerability assessments
4. **Compliance Verification**: Validate against Indonesian regulations

### Training and Adoption
1. **Team Education**: Ensure all developers understand standards
2. **Reference Materials**: Provide quick reference guides
3. **Code Examples**: Maintain library of compliant code examples
4. **Regular Updates**: Keep standards current with evolving requirements

## Quick Reference Guide

### Most Important Rules (Daily Use)

**🔴 Critical - Must Follow Always**:
- **Data Sovereignty**: Use only ap-southeast-1, ap-southeast-3 regions
- **Security**: AES-256 encryption, TLS 1.3, RBAC mandatory
- **Language**: Indonesian for user interfaces, English for technical docs
- **File Organization**: Tests in `/backend/test/*`, docs in `/backend/docs/*`

**🟡 High Priority - Follow for New Code**:
- **Build Commands**: `go build -o exe/selly-backend ./cmd/server`
- **Commit Messages**: `type(scope): description` format
- **Test Coverage**: >90% coverage required
- **Documentation**: Update docs when changing APIs or architecture

**🟢 Medium Priority - Quality Improvements**:
- **Performance**: Multi-level caching, parallel processing
- **Code Standards**: TypeScript strict mode, Go best practices
- **Error Handling**: Structured logging and error classification
- **Accessibility**: WCAG 2.1 AA compliance

### Common Build Commands
```bash
# Backend builds
cd backend && go build -o exe/selly-backend ./cmd/server
cd backend && go build -o exe/selly-backend.exe ./cmd/server

# Frontend development
cd frontend && pnpm dev
cd frontend && pnpm build && pnpm start

# Git workflow
git add .
git commit -m "feat(component): description"
git push origin branch-name
```

### File Organization Quick Reference
```
backend/
├── cmd/server/main.go          # Entry point
├── exe/                        # Build outputs (ignored)
├── test/                       # All test files
├── docs/                       # Documentation (YYYY-MM-DD-*.md)
└── internal/                   # Private code

frontend/
├── src/__tests__/             # React tests
├── docs/                      # Frontend docs
└── package.json               # Dependencies
```

### When to Ask for Help
- ❓ **Unclear Rules**: Check this guide first, then ask team lead
- 🔧 **Technical Issues**: Consult architecture team for complex decisions
- ⚖️ **Rule Exceptions**: Document rationale and get approval
- 📈 **Performance Conflicts**: May need rule exceptions for critical performance

## Conclusion

This comprehensive rule set represents the Kilo Code Framework integration with SELLY development standards, ensuring high-quality, scalable, and secure software development with specific focus on Indonesian government integration and AI-powered services. By following these rules, development teams can ensure consistent quality, optimal performance, and regulatory compliance across all projects.

**Remember**: Quality is not an accident; it is the result of intelligent effort and adherence to proven standards. Kilo Code provides the framework for achieving excellence in every aspect of software development and migration.
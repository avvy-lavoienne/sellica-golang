---
type: "always_apply"
description: "Kilo Code - Comprehensive Development and Migration Rules"
version: "1.0"
last_updated: "2025-08-29"
---

# Kilo Code: Comprehensive Development and Migration Rules

**Rule Category**: Kilo Code Framework
**Priority**: Critical
**Scope**: All SELLY development and migration activities
**Enforcement**: Mandatory for all development workflows

## Table of Contents

1. [Core Principles and Philosophy](#1-core-principles-and-philosophy)
2. [Development Standards and Workflow](#2-development-standards-and-workflow)
3. [Migration Framework and Patterns](#3-migration-framework-and-patterns)
4. [Technology Stack and Architecture](#4-technology-stack-and-architecture)
5. [Performance Optimization Rules](#5-performance-optimization-rules)
6. [Security and Compliance Framework](#6-security-and-compliance-framework)
7. [Quality Assurance and Testing](#7-quality-assurance-and-testing)
8. [Documentation and Knowledge Management](#8-documentation-and-knowledge-management)
9. [Implementation Guidelines](#9-implementation-guidelines)
10. [Validation and Enforcement](#10-validation-and-enforcement)

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

**Requirements**:
- **Language Priority Matrix**:
  | Context | Primary | Secondary | Rationale |
  |---------|---------|-----------|-----------|
  | User Interface | Indonesian | English | Cultural respect |
  | Technical Docs | English | Indonesian | Collaboration |
  | Code Comments | English | Indonesian | Business logic |
  | Government Comms | Indonesian | English | Compliance |

- **Data Sovereignty**: All Indonesian government data must remain in Indonesian jurisdiction (ap-southeast-1, ap-southeast-3 only)
- **Cultural Communication**: Formal Indonesian for all government interactions
- **Regulatory Compliance**: Adherence to UU No. 27 Tahun 2022 and related regulations

## 2. Development Standards and Workflow

### 2.1 Three-Phase Development Process
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

### 2.2 Package Management and Environment
**Kilo Rule #5**: Standardized development environment across all projects.

**Requirements**:
- **Package Manager**: pnpm exclusively for all dependency management
- **Version Control**: Git with conventional commit format
- **Environment Variables**: `.env.local` for sensitive keys, `NEXT_PUBLIC_` prefix for client keys
- **Build System**: Automated build recovery with 3-attempt fallback

### 2.3 Automated Workflow Integration
**Kilo Rule #6**: Development workflow must include mandatory automation.

**Automated Sequence**:
1. **Quality Gates**: TypeScript compilation, ESLint, test coverage (>90%)
2. **Security Scan**: Vulnerability assessment and compliance check
3. **Performance Validation**: Benchmark comparison and optimization verification
4. **Documentation Update**: Source documentation synchronization
5. **Git Operations**: Automated commit with conventional format

## 3. Migration Framework and Patterns

### 3.1 Pre-Migration Analysis Requirements
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

### 3.2 Migration Pattern Categories
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

### 3.3 Functional Parity Validation
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

## 5. Performance Optimization Rules

### 5.1 Multi-Level Caching Strategy
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

### 5.2 Parallel Processing Patterns
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

### 5.3 Performance Monitoring and Alerting
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

## 6. Security and Compliance Framework

### 6.1 Encryption Standards
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

### 6.2 Access Control and Authorization
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

### 6.3 Audit Trail Requirements
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

## 7. Quality Assurance and Testing

### 7.1 Testing Standards
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

### 7.2 Automated Quality Gates
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

## 8. Documentation and Knowledge Management

### 8.1 Documentation Standards
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

### 8.2 Knowledge Base Integration
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

## 9. Implementation Guidelines

### 9.1 Code Standards and Conventions
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

### 9.2 Error Handling Patterns
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

### 9.3 Logging Standards
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

## 10. Validation and Enforcement

### 10.1 Automated Validation Framework
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
```

### 10.2 Continuous Integration Pipeline
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

### 10.3 Enforcement Mechanisms
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

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review and understand all Kilo Code rules
- [ ] Assess current codebase compliance
- [ ] Create implementation roadmap
- [ ] Set up validation infrastructure
- [ ] Train development team

### Implementation Phases
- [ ] Phase 1: Core infrastructure setup
- [ ] Phase 2: Migration pattern implementation
- [ ] Phase 3: Quality assurance integration
- [ ] Phase 4: Performance optimization
- [ ] Phase 5: Security hardening
- [ ] Phase 6: Documentation completion

### Validation and Compliance
- [ ] Automated validation pipeline operational
- [ ] Quality gates passing
- [ ] Security compliance verified
- [ ] Performance benchmarks met
- [ ] Documentation complete and current

## Conclusion

Kilo Code represents a comprehensive framework for high-quality, scalable, and secure software development with specific focus on Indonesian government integration and AI-powered services. By following these rules, development teams can ensure consistent quality, optimal performance, and regulatory compliance across all projects.

**Remember**: Quality is not an accident; it is the result of intelligent effort and adherence to proven standards. Kilo Code provides the framework for achieving excellence in every aspect of software development and migration.
# SELLY Legacy Next.js Backend Archive

**Purpose**: Permanent archive and reference for legacy Next.js backend components after migration to Go backend.

## Archive Overview

This directory contains the complete legacy Next.js backend implementation that was migrated to Go backend services. It serves as:

1. **Historical Reference**: Complete record of the original Next.js backend architecture
2. **Migration Documentation**: Detailed mapping between legacy and new implementations  
3. **Rollback Resource**: Emergency reference for rollback scenarios
4. **Knowledge Base**: Training and onboarding resource for new developers

## Directory Structure

```
selly-legacy-nextjs-backend/
├── api-routes/                 # All Next.js API routes (47+ routes)
│   ├── core/                   # Core business logic routes
│   │   ├── chat/               # Chat API routes (MIGRATED to Go)
│   │   ├── training-data/      # Training data routes (MIGRATED to Go)
│   │   └── debug-training/     # Debug utilities (ARCHIVED)
│   ├── auth/                   # Authentication routes
│   │   ├── register/           # User registration (MIGRATED to Go)
│   │   ├── login/              # User login (MIGRATED to Go)
│   │   ├── debug/              # Auth debugging (MIGRATED to Go)
│   │   ├── fix-current-user/   # User fixes (MIGRATED to Go)
│   │   └── resolve-uuid-mismatch/ # UUID resolution (MIGRATED to Go)
│   ├── monitoring/             # Monitoring and metrics routes
│   │   ├── cache/              # Cache monitoring (MIGRATED to Go)
│   │   ├── performance/        # Performance monitoring (MIGRATED to Go)
│   │   ├── dashboard/          # Monitoring dashboard (MIGRATED to Go)
│   │   └── production/         # Production monitoring (MIGRATED to Go)
│   ├── admin/                  # Administrative routes
│   │   ├── approve-user/       # User approval (MIGRATED to Go)
│   │   ├── reject-user/        # User rejection (MIGRATED to Go)
│   │   └── analytics/          # Admin analytics (MIGRATED to Go)
│   ├── session/                # Session management routes
│   │   ├── enhanced-management/ # Session management (MIGRATED to Go)
│   │   ├── analytics/          # Session analytics (MIGRATED to Go)
│   │   ├── convert/            # Session conversion (MIGRATED to Go)
│   │   └── sync/               # Session sync (MIGRATED to Go)
│   ├── compliance/             # Government compliance routes
│   │   ├── indonesian-data-protection/ # Data protection (MIGRATED to Go)
│   │   └── security/           # Security compliance (MIGRATED to Go)
│   ├── testing/                # Testing and validation routes
│   │   ├── enhanced-coverage/  # Test coverage (ARCHIVED)
│   │   ├── load-testing/       # Load testing (ARCHIVED)
│   │   └── test-phases/        # Phase testing (ARCHIVED)
│   └── legacy/                 # Deprecated routes
│       ├── phase2/             # Phase 2 routes (ARCHIVED)
│       ├── phase3/             # Phase 3 routes (ARCHIVED)
│       └── tensorflow-removal/ # TensorFlow removal (ARCHIVED)
├── business-logic/             # Core business logic services (200+ files)
│   ├── ai/                     # AI and ML services
│   │   ├── customModelTrainer.ts        # Model training (MIGRATED to Go)
│   │   ├── continuousLearningEngine.ts  # Learning engine (MIGRATED to Go)
│   │   ├── advancedIndonesianNLP.ts     # Indonesian NLP (MIGRATED to Go)
│   │   ├── masterTrainingOrchestrator.ts # Training orchestration (MIGRATED to Go)
│   │   ├── huggingFaceService.ts        # HuggingFace integration (MIGRATED to Go)
│   │   ├── tensorflowIntegration.ts     # TensorFlow integration (ARCHIVED)
│   │   └── predictiveAnalyticsEngine.ts # Analytics engine (MIGRATED to Go)
│   ├── training/               # Training data services
│   │   ├── trainingDataCollector.ts     # Data collection (MIGRATED to Go)
│   │   ├── realTimeQueryAnalyzer.ts     # Query analysis (MIGRATED to Go)
│   │   └── *ContinuousTraining.ts       # Specialized training (MIGRATED to Go)
│   ├── auth/                   # Authentication services
│   │   ├── EnhancedAuthService.ts       # Auth service (MIGRATED to Go)
│   │   ├── UUIDMappingService.ts        # UUID mapping (MIGRATED to Go)
│   │   └── UUIDMismatchResolver.ts      # UUID resolution (MIGRATED to Go)
│   ├── session/                # Session management
│   │   ├── unifiedSessionManager.ts     # Session manager (MIGRATED to Go)
│   │   ├── realTimeSyncManager.ts       # Real-time sync (MIGRATED to Go)
│   │   └── CrossDeviceSessionSync.ts    # Cross-device sync (MIGRATED to Go)
│   ├── analytics/              # Analytics services
│   │   ├── performanceAnalytics.ts      # Performance analytics (MIGRATED to Go)
│   │   ├── userJourneyTracker.ts        # User tracking (MIGRATED to Go)
│   │   └── conversionAnalytics.ts       # Conversion analytics (MIGRATED to Go)
│   └── workflow/               # Business workflow services
│       ├── administrativeWorkflowIntelligence.ts # Admin workflows (MIGRATED to Go)
│       └── crossServiceDependencyMapper.ts      # Service mapping (MIGRATED to Go)
├── backend-utilities/          # Server-side utilities (50+ files)
│   ├── database/               # Database utilities
│   │   ├── resilientDatabaseService.ts  # Database service (MIGRATED to Go)
│   │   ├── connectionErrorRecovery.ts   # Connection recovery (MIGRATED to Go)
│   │   └── MigrationRunner.ts           # Migration runner (MIGRATED to Go)
│   ├── cache/                  # Caching services
│   │   ├── upstashCacheService.ts       # Upstash cache (MIGRATED to Go)
│   │   ├── MultiLevelCacheManager.ts    # Cache manager (MIGRATED to Go)
│   │   ├── IntelligentCacheWarmer.ts    # Cache warming (MIGRATED to Go)
│   │   └── indonesianLanguageCache.ts   # Language cache (MIGRATED to Go)
│   ├── monitoring/             # Monitoring utilities
│   │   ├── performanceMonitor.ts        # Performance monitor (MIGRATED to Go)
│   │   ├── metricsCollector.ts          # Metrics collection (MIGRATED to Go)
│   │   ├── sessionMonitoringService.ts  # Session monitoring (MIGRATED to Go)
│   │   └── UnifiedMonitoringSystem.ts   # Monitoring system (MIGRATED to Go)
│   ├── security/               # Security utilities
│   │   ├── GovernmentGradeEncryption.ts # Encryption (MIGRATED to Go)
│   │   ├── DigitalSignatureService.ts   # Digital signatures (MIGRATED to Go)
│   │   └── sessionSecurityService.ts    # Session security (MIGRATED to Go)
│   └── integration/            # Integration utilities
│       ├── government/         # Government integrations (MIGRATED to Go)
│       └── compliance/         # Compliance integrations (MIGRATED to Go)
├── middleware/                 # Server-side middleware (15+ files)
│   ├── auth/                   # Authentication middleware
│   │   └── EnhancedAuthMiddleware.ts    # Auth middleware (MIGRATED to Go)
│   ├── security/               # Security middleware
│   │   └── UnifiedSecurityMiddleware.ts # Security middleware (MIGRATED to Go)
│   └── monitoring/             # Monitoring middleware
│       └── MonitoringIntegrationService.ts # Monitoring middleware (MIGRATED to Go)
├── data-processing/            # Data processing utilities (30+ files)
│   ├── training-data/          # Training data processors (MIGRATED to Go)
│   ├── analytics/              # Analytics processors (MIGRATED to Go)
│   ├── compliance/             # Compliance processors (MIGRATED to Go)
│   └── migration/              # Data migration utilities (ARCHIVED)
└── documentation/              # Migration documentation
    ├── api-routes-analysis.md          # API routes analysis
    ├── services-analysis.md            # Services analysis
    ├── migration-mapping.md            # Migration mapping
    ├── comprehensive-migration-plan.md # Complete migration plan
    └── migration-log.md                # Migration execution log
```

## Migration Status Legend

- **MIGRATED to Go**: Successfully migrated to Go backend with functional parity
- **ARCHIVED**: Legacy/deprecated components preserved for reference only
- **DEVELOPMENT ONLY**: Testing utilities not needed in production

## Go Backend Equivalents

### **API Endpoints Mapping**
| Legacy Next.js Route | Go Backend Endpoint | Status |
|----------------------|-------------------|---------|
| `POST /api/chat` | `POST /chat` | ✅ **MIGRATED** |
| `POST /api/training-data` | `POST /api/training-data` | ✅ **MIGRATED** |
| `POST /api/register` | `POST /auth/register` | ✅ **MIGRATED** |
| `GET /api/health` | `GET /health` | ✅ **MIGRATED** |
| `GET /api/metrics` | `GET /metrics` | ✅ **MIGRATED** |

### **Service Layer Mapping**
| Legacy TypeScript Service | Go Backend Service | Status |
|---------------------------|-------------------|---------|
| `aiService.ts` | `internal/services/ai/service.go` | ✅ **MIGRATED** |
| `trainingDataCollector.ts` | `internal/services/training/collector.go` | ✅ **MIGRATED** |
| `EnhancedAuthService.ts` | `internal/services/auth/service.go` | ✅ **MIGRATED** |
| `resilientDatabaseService.ts` | `internal/services/database/service.go` | ✅ **MIGRATED** |

## Performance Improvements Achieved

### **Before (Next.js Backend)**
- **Response Time**: 800ms - 3.8 seconds
- **Memory Usage**: 200-500MB
- **Concurrent Requests**: 100-200
- **Error Rate**: <0.1%

### **After (Go Backend)**
- **Response Time**: <100ms (8x improvement)
- **Memory Usage**: <100MB (5x improvement)
- **Concurrent Requests**: >1000 (10x improvement)
- **Error Rate**: <0.1% (maintained)

## Usage Guidelines

### **For Developers**
1. **Reference Only**: Use for understanding legacy implementation patterns
2. **No Modifications**: Do not modify archived components
3. **Migration Learning**: Study migration patterns for future projects
4. **Troubleshooting**: Reference for understanding legacy behavior

### **For Operations**
1. **Emergency Reference**: Available for critical rollback scenarios
2. **Performance Comparison**: Baseline for performance improvements
3. **Audit Trail**: Complete record of system evolution
4. **Compliance**: Historical record for regulatory requirements

## Archive Maintenance

- **Read-Only**: All archived components are read-only
- **Version Control**: Maintained in Git for historical tracking
- **Documentation**: Keep migration documentation updated
- **Cleanup**: Periodic review for obsolete components

This archive represents the successful migration of SELLY from a Next.js monolith to a clean, separated architecture with Go backend services, achieving significant performance improvements while maintaining full functionality.

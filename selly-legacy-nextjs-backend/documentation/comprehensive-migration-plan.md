# SELLY Comprehensive Migration Plan

## 🎯 **Migration Overview**

**Objective**: Complete separation of frontend UI from backend business logic
**Current Status**: ~95% freed from Next.js API dependency
**Target**: 100% clean architecture separation
**Timeline**: 6 weeks (2 phases)

## 📋 **Detailed Implementation Plan**

### **Phase 1: Legacy Component Staging (Week 1-3)**

#### **Week 1: Critical Backend Components**

**🔴 PRIORITY 1: Training Data & AI Services**
```bash
# API Routes to Stage
mkdir -p frontend/src/selly-legacy-nextjs-backend/api-routes/core/
mv frontend/src/app/api/training-data/ frontend/src/selly-legacy-nextjs-backend/api-routes/core/
mv frontend/src/app/api/debug-training/ frontend/src/selly-legacy-nextjs-backend/api-routes/core/

# AI Services to Stage  
mkdir -p frontend/src/selly-legacy-nextjs-backend/business-logic/ai/
mv frontend/src/services/ai/customModelTrainer.ts frontend/src/selly-legacy-nextjs-backend/business-logic/ai/
mv frontend/src/services/ai/continuousLearningEngine.ts frontend/src/selly-legacy-nextjs-backend/business-logic/ai/
mv frontend/src/services/ai/advancedIndonesianNLP.ts frontend/src/selly-legacy-nextjs-backend/business-logic/ai/
mv frontend/src/services/ai/masterTrainingOrchestrator.ts frontend/src/selly-legacy-nextjs-backend/business-logic/ai/

# Training Services
mkdir -p frontend/src/selly-legacy-nextjs-backend/business-logic/training/
mv frontend/src/services/chatbot/trainingDataCollector.ts frontend/src/selly-legacy-nextjs-backend/business-logic/training/
mv frontend/src/services/chatbot/realTimeQueryAnalyzer.ts frontend/src/selly-legacy-nextjs-backend/business-logic/training/
```

**Go Backend Implementation:**
- Implement `backend/internal/services/training/collector.go`
- Implement `backend/internal/services/ai/trainer.go`
- Implement `backend/internal/api/handlers/training.go`

#### **Week 2: Authentication & Database Services**

**🟡 PRIORITY 2: Authentication Infrastructure**
```bash
# Authentication Routes
mkdir -p frontend/src/selly-legacy-nextjs-backend/api-routes/auth/
mv frontend/src/app/api/register/ frontend/src/selly-legacy-nextjs-backend/api-routes/auth/
mv frontend/src/app/api/login/ frontend/src/selly-legacy-nextjs-backend/api-routes/auth/
mv frontend/src/app/api/auth/ frontend/src/selly-legacy-nextjs-backend/api-routes/auth/

# Database Services
mkdir -p frontend/src/selly-legacy-nextjs-backend/backend-utilities/database/
mv frontend/src/services/database/ frontend/src/selly-legacy-nextjs-backend/backend-utilities/database/

# Authentication Services
mkdir -p frontend/src/selly-legacy-nextjs-backend/business-logic/auth/
mv frontend/src/services/auth/EnhancedAuthService.ts frontend/src/selly-legacy-nextjs-backend/business-logic/auth/
mv frontend/src/services/auth/UUIDMappingService.ts frontend/src/selly-legacy-nextjs-backend/business-logic/auth/
mv frontend/src/services/auth/UUIDMismatchResolver.ts frontend/src/selly-legacy-nextjs-backend/business-logic/auth/
```

**Go Backend Implementation:**
- Enhance `backend/internal/services/auth/service.go`
- Implement `backend/internal/api/handlers/auth.go`
- Add UUID resolution to `backend/internal/services/auth/uuid.go`

#### **Week 3: Monitoring & Session Management**

**🟢 PRIORITY 3: Infrastructure Services**
```bash
# Monitoring Routes
mkdir -p frontend/src/selly-legacy-nextjs-backend/api-routes/monitoring/
mv frontend/src/app/api/cache/ frontend/src/selly-legacy-nextjs-backend/api-routes/monitoring/
mv frontend/src/app/api/monitoring/ frontend/src/selly-legacy-nextjs-backend/api-routes/monitoring/

# Cache Services
mkdir -p frontend/src/selly-legacy-nextjs-backend/backend-utilities/cache/
mv frontend/src/services/cache/upstashCacheService.ts frontend/src/selly-legacy-nextjs-backend/backend-utilities/cache/
mv frontend/src/services/cache/MultiLevelCacheManager.ts frontend/src/selly-legacy-nextjs-backend/backend-utilities/cache/
mv frontend/src/services/cache/IntelligentCacheWarmer.ts frontend/src/selly-legacy-nextjs-backend/backend-utilities/cache/

# Session Services
mkdir -p frontend/src/selly-legacy-nextjs-backend/business-logic/session/
mv frontend/src/services/session/ frontend/src/selly-legacy-nextjs-backend/business-logic/session/

# Monitoring Services
mkdir -p frontend/src/selly-legacy-nextjs-backend/backend-utilities/monitoring/
mv frontend/src/services/monitoring/performanceMonitor.ts frontend/src/selly-legacy-nextjs-backend/backend-utilities/monitoring/
mv frontend/src/services/monitoring/metricsCollector.ts frontend/src/selly-legacy-nextjs-backend/backend-utilities/monitoring/
mv frontend/src/services/monitoring/sessionMonitoringService.ts frontend/src/selly-legacy-nextjs-backend/backend-utilities/monitoring/
```

### **Phase 2: Final Backend Migration (Week 4-6)**

#### **Week 4: Backend Archive Setup**

**Create Final Archive Structure:**
```bash
# Create backend archive directory
mkdir -p backend/data-init/selly-legacy-nextjs-backend/

# Move staging to final archive
mv frontend/src/selly-legacy-nextjs-backend/ backend/data-init/selly-legacy-nextjs-backend/
```

**Archive Structure:**
```
backend/data-init/selly-legacy-nextjs-backend/
├── api-routes/
│   ├── core/                   # Training data, chat routes
│   ├── auth/                   # Authentication routes
│   ├── monitoring/             # Monitoring routes
│   ├── admin/                  # Administrative routes
│   ├── session/                # Session management routes
│   ├── compliance/             # Government compliance routes
│   └── legacy/                 # Deprecated routes
├── business-logic/
│   ├── ai/                     # AI and ML services
│   ├── training/               # Training data services
│   ├── auth/                   # Authentication services
│   ├── session/                # Session management
│   ├── analytics/              # Analytics services
│   └── workflow/               # Business workflow services
├── backend-utilities/
│   ├── database/               # Database utilities
│   ├── cache/                  # Caching services
│   ├── monitoring/             # Monitoring utilities
│   ├── security/               # Security utilities
│   └── integration/            # Integration utilities
├── middleware/
│   ├── auth/                   # Authentication middleware
│   ├── security/               # Security middleware
│   └── monitoring/             # Monitoring middleware
└── documentation/
    ├── api-routes-analysis.md
    ├── services-analysis.md
    ├── migration-mapping.md
    └── migration-log.md
```

#### **Week 5: Remaining Components Migration**

**Administrative & Compliance Routes:**
```bash
# Move remaining API routes
- /api/admin/ → backend archive
- /api/analytics/ → backend archive  
- /api/compliance/ → backend archive
- /api/security/ → backend archive
- /api/session/ → backend archive
```

**Supporting Services:**
```bash
# Move remaining services
- /services/compliance/ → backend archive
- /services/analytics/ → backend archive
- /services/integration/ → backend archive
- /services/security/ → backend archive
```

#### **Week 6: Final Cleanup & Validation**

**Archive Legacy Components:**
```bash
# Archive development/testing routes
- /api/test-* → backend archive
- /api/phase* → backend archive
- /api/tensorflow-removal/ → backend archive
- /pages/api/ → backend archive

# Archive migration services
- /services/chatbot/migration/ → backend archive
- /services/chatbot/core/BackwardCompatibilityLayer.ts → backend archive
```

## 🎯 **Specific Recommendations**

### **1. Priority Sequencing**
**YES - Prioritize in this order:**
1. **Training data services** (critical for AI functionality)
2. **Authentication services** (security critical)
3. **Database services** (foundation dependency)
4. **Monitoring services** (operational visibility)
5. **Administrative services** (lower business impact)

### **2. Directory Structure**
**YES - Maintain this structure within legacy folders:**
```
selly-legacy-nextjs-backend/
├── api-routes/          # By business function
├── business-logic/      # By service type
├── backend-utilities/   # By utility type
├── middleware/          # By middleware type
└── documentation/       # Migration docs
```

### **3. Documentation Mapping**
**YES - Create comprehensive mapping documentation:**
- API contract mapping (Next.js → Go)
- Service dependency mapping
- Data flow documentation
- Performance comparison metrics
- Migration validation checklist

## ✅ **Validation Checklist**

### **Phase 1 Completion Criteria**
- [ ] All critical API routes staged
- [ ] All backend services categorized
- [ ] Import dependencies updated
- [ ] No broken frontend functionality
- [ ] Documentation complete

### **Phase 2 Completion Criteria**
- [ ] All components archived in backend
- [ ] Frontend contains only UI components
- [ ] Go backend has functional parity
- [ ] Performance targets met (3-10x improvement)
- [ ] All tests passing

### **Final Architecture Validation**
- [ ] `frontend/` contains only Next.js UI components
- [ ] `frontend/src/services/` contains only client-side services
- [ ] `backend/` contains all business logic
- [ ] `backend/data-init/selly-legacy-nextjs-backend/` contains complete archive
- [ ] API contracts maintained
- [ ] Performance improved

## 🚀 **Expected Outcomes**

### **Clean Architecture Achievement**
- **Frontend**: Pure UI layer (React components, client services, state management)
- **Backend**: Pure business logic (Go services, APIs, database, caching)
- **Archive**: Complete legacy reference for future maintenance

### **Performance Benefits**
- **Response Time**: 800ms → <100ms (8x improvement)
- **Memory Usage**: 200-500MB → <100MB (5x improvement)  
- **Concurrent Capacity**: 100-200 → >1000 requests (10x improvement)
- **Error Rate**: Maintain <0.1% while improving performance

### **Maintainability Benefits**
- Clear separation of concerns
- Independent deployment capabilities
- Technology-specific optimizations
- Simplified debugging and testing
- Future-proof architecture

This comprehensive plan ensures complete separation while maintaining functionality and achieving significant performance improvements.

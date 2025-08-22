# Business Logic Services Analysis

## 🔴 **CRITICAL - Backend Business Logic (MUST MIGRATE)**

### **AI and Machine Learning Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `aiService.ts` | `/services/ai/` | Core AI Processing | `backend/internal/services/ai/` |
| `customModelTrainer.ts` | `/services/ai/` | Model Training | `backend/internal/services/training/` |
| `continuousLearningEngine.ts` | `/services/ai/` | Learning Engine | `backend/internal/services/learning/` |
| `advancedIndonesianNLP.ts` | `/services/ai/` | NLP Processing | `backend/internal/services/nlp/` |
| `tensorflowIntegration.ts` | `/services/ai/` | ML Integration | `backend/internal/services/ml/` |
| `huggingFaceService.ts` | `/services/ai/` | External AI API | `backend/internal/services/external/` |
| `indoBertIntegration.ts` | `/services/ai/` | BERT Integration | `backend/internal/services/nlp/` |
| `predictiveAnalyticsEngine.ts` | `/services/ai/` | Analytics Engine | `backend/internal/services/analytics/` |

### **Training Data Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `trainingDataCollector.ts` | `/services/chatbot/` | Data Collection | `backend/internal/services/training/` |
| `realTimeQueryAnalyzer.ts` | `/services/chatbot/` | Query Analysis | `backend/internal/services/analytics/` |
| `masterTrainingOrchestrator.ts` | `/services/ai/` | Training Orchestration | `backend/internal/services/training/` |
| All `*ContinuousTraining.ts` files | `/services/ai/` | Specialized Training | `backend/internal/services/training/specialized/` |

### **Database and Storage Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `resilientDatabaseService.ts` | `/services/database/` | Database Layer | `backend/internal/services/database/` |
| `connectionErrorRecovery.ts` | `/services/database/` | Connection Management | `backend/internal/services/database/` |
| `MigrationRunner.ts` | `/services/database/` | Data Migration | `backend/internal/services/database/` |

### **Authentication and Security Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `EnhancedAuthService.ts` | `/services/auth/` | Authentication Logic | `backend/internal/services/auth/` |
| `UUIDMappingService.ts` | `/services/auth/` | User ID Management | `backend/internal/services/auth/` |
| `UUIDMismatchResolver.ts` | `/services/auth/` | ID Resolution | `backend/internal/services/auth/` |
| `GovernmentGradeEncryption.ts` | `/services/security/` | Encryption Services | `backend/internal/services/security/` |
| `DigitalSignatureService.ts` | `/services/security/` | Digital Signatures | `backend/internal/services/security/` |

## 🟡 **HIGH PRIORITY - Infrastructure Services (MIGRATE)**

### **Caching Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `upstashCacheService.ts` | `/services/cache/` | Cache Management | `backend/internal/services/cache/` |
| `MultiLevelCacheManager.ts` | `/services/cache/` | Cache Strategy | `backend/internal/services/cache/` |
| `IntelligentCacheWarmer.ts` | `/services/cache/` | Cache Optimization | `backend/internal/services/cache/` |
| `indonesianLanguageCache.ts` | `/services/cache/` | Language-specific Cache | `backend/internal/services/cache/` |

### **Monitoring and Analytics Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `performanceMonitor.ts` | `/services/monitoring/` | Performance Tracking | `backend/internal/services/monitoring/` |
| `metricsCollector.ts` | `/services/monitoring/` | Metrics Collection | `backend/internal/services/monitoring/` |
| `UnifiedMonitoringSystem.ts` | `/services/monitoring/` | Monitoring System | `backend/internal/services/monitoring/` |
| `sessionMonitoringService.ts` | `/services/monitoring/` | Session Monitoring | `backend/internal/services/monitoring/` |

### **Session Management Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `unifiedSessionManager.ts` | `/services/session/` | Session Logic | `backend/internal/services/session/` |
| `realTimeSyncManager.ts` | `/services/session/` | Real-time Sync | `backend/internal/services/session/` |
| `CrossDeviceSessionSync.ts` | `/services/session/` | Cross-device Sync | `backend/internal/services/session/` |
| `SessionAnalyticsService.ts` | `/services/session/` | Session Analytics | `backend/internal/services/analytics/` |

## 🟢 **MEDIUM PRIORITY - Business Logic (MIGRATE)**

### **Compliance and Government Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `IndonesianDataProtectionService.ts` | `/services/compliance/` | Data Protection | `backend/internal/services/compliance/` |
| `ComplianceValidationEngine.ts` | `/services/compliance/` | Compliance Validation | `backend/internal/services/compliance/` |
| `GovernmentAuditTrail.ts` | `/services/audit/` | Audit Logging | `backend/internal/services/audit/` |

### **Integration Services**
| Service | Location | Type | Migration Target |
|---------|----------|------|------------------|
| `week3Integration.ts` | `/services/integration/` | System Integration | `backend/internal/services/integration/` |
| `government/*` services | `/services/integration/` | Government APIs | `backend/internal/services/integration/` |

## 🔵 **FRONTEND ONLY - Keep in Frontend**

### **UI and Client-side Services**
| Service | Location | Type | Keep in Frontend |
|---------|----------|------|------------------|
| `mobilePWAOptimization.ts` | `/services/mobile/` | Mobile UI | ✅ **Frontend Only** |
| `ThemeProvider.tsx` | `/components/` | UI Theming | ✅ **Frontend Only** |
| Chat UI Components | `/components/chat/` | User Interface | ✅ **Frontend Only** |
| Dashboard Components | `/components/dashboard/` | UI Components | ✅ **Frontend Only** |

### **Client-side Utilities**
| Service | Location | Type | Keep in Frontend |
|---------|----------|------|------------------|
| `chatUtils.ts` | `/utils/` | UI Utilities | ✅ **Frontend Only** |
| `mobile.ts` | `/utils/` | Mobile UI Utils | ✅ **Frontend Only** |
| React Hooks | `/hooks/` | React-specific | ✅ **Frontend Only** |
| React Contexts | `/contexts/` | State Management | ✅ **Frontend Only** |

## 🗑️ **LEGACY/DEPRECATED - Archive Only**

### **Migration and Testing Services**
| Service | Location | Type | Action |
|---------|----------|------|--------|
| `MigrationService.ts` | `/services/chatbot/migration/` | Migration Logic | 🗑️ **Archive** |
| `BackwardCompatibilityLayer.ts` | `/services/chatbot/core/` | Compatibility | 🗑️ **Archive** |
| All test files in services | Various | Testing | 🗑️ **Archive** |
| Phase-specific services | Various | Legacy Phases | 🗑️ **Archive** |

## **Migration Priority Matrix**

| Priority | Service Count | Migration Timeline |
|----------|---------------|-------------------|
| 🔴 **Critical** | ~50 services | **Week 1-2** |
| 🟡 **High** | ~40 services | **Week 3-4** |
| 🟢 **Medium** | ~30 services | **Week 5-6** |
| 🔵 **Frontend** | ~80 services | **Keep in Frontend** |
| 🗑️ **Archive** | ~40 services | **Archive Only** |

## **Service Dependencies**

### **High Dependency Services (Migrate First)**
1. Database services
2. Authentication services  
3. Core AI services
4. Caching services

### **Medium Dependency Services**
1. Monitoring services
2. Session management
3. Analytics services
4. Integration services

### **Low Dependency Services (Migrate Last)**
1. Compliance services
2. Specialized training services
3. Administrative services
4. Testing utilities

## **Next Steps**

1. **Create service migration staging directories**
2. **Move critical backend services to staging**
3. **Update import dependencies**
4. **Create Go backend service equivalents**
5. **Archive legacy and deprecated services**

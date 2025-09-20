/**
 * Service Registration Logic
 * Phase 1 Week 1-2 Implementation: Service registration with proper dependency ordering
 * 
 * Based on: docs/plan/phase1/2025-08-18-phase1-architecture-consolidation-detailed-plan.md
 * Lines 374-408: Service Registration Pattern
 */

import { ServiceContainer } from './ServiceContainer';
import { SERVICE_TOKENS, SERVICE_DEPENDENCIES, SERVICE_PRIORITIES } from './ServiceTokens';

// Import actual service classes
import { KnowledgeService } from '../chatbot/knowledgeService';
import { PersonaService } from '../chatbot/personaService';
import { SimpleResponseService } from '../chatbot/simpleResponseService';
import { PerformanceMonitor } from '../chatbot/utils/PerformanceMonitor';
// import { UpstashCacheService } from '../cache/upstashCacheService';
// import { EnhancedChatStorageService } from '../chatbot/enhancedChatStorageService';

// Phase 1 Priority 2: Import IntelligenceLayer
import { IntelligenceLayer } from './IntelligenceLayer';

// Phase 3 Security: Import compliance services
// import { ConsentManagementSystem } from '../compliance/ConsentManagementSystem';

// Phase 3 Week 19-20: Import encryption services
// import { GovernmentGradeEncryption } from '../security/GovernmentGradeEncryption';

// Phase 3 Week 21-22: Import audit services
// import { GovernmentAuditTrail } from '../audit/GovernmentAuditTrail';
// import { DigitalSignatureService } from '../security/DigitalSignatureService';

// Import Indonesian Data Protection Service (lazy loading)
function getIndonesianDataProtectionService() {
  try {
    const { IndonesianDataProtectionService } = require('../compliance/IndonesianDataProtectionService');
    return IndonesianDataProtectionService.getInstance();
  } catch (error) {
    console.warn('⚠️ [SERVICE_REGISTRATION] IndonesianDataProtectionService not available, using mock');
    return {
      recordConsent: async () => 'mock-consent-id',
      validateConsent: async () => true,
      getComplianceStatus: () => ({ activeConsents: 0 }),
      scheduleDataDeletion: async () => {}
    };
  }
}

// Export types for external use
export type { SimpleResponseService, IntelligenceLayer };

/**
 * Register all services with the ServiceContainer in proper dependency order
 */
export function registerServices(container: ServiceContainer): void {
  console.log('📋 [SERVICE_REGISTRATION] Starting service registration...');

  // Phase 1: Register services with no dependencies (Critical Priority)
  registerCriticalServices(container);

  // Phase 2: Register services with dependencies (High Priority)
  registerHighPriorityServices(container);

  // Phase 3: Register complex services (Medium Priority)
  registerMediumPriorityServices(container);

  // Phase 4: Register monitoring and analytics services (Low Priority)
  registerLowPriorityServices(container);

  console.log('✅ [SERVICE_REGISTRATION] All services registered successfully');
}

/**
 * Register critical services with no dependencies
 */
function registerCriticalServices(container: ServiceContainer): void {
  console.log('🔧 [SERVICE_REGISTRATION] Registering critical services...');

  // Register KnowledgeService (no dependencies)
  container.register(
    SERVICE_TOKENS.KnowledgeService,
    () => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating KnowledgeService...');
      return KnowledgeService.getInstance();
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.KnowledgeService
    }
  );

  // Register PerformanceMonitor (no dependencies)
  container.register(
    SERVICE_TOKENS.PerformanceMonitor,
    () => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating PerformanceMonitor...');
      return PerformanceMonitor.getInstance();
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.PerformanceMonitor
    }
  );

  // Register UpstashCacheService (no dependencies) - Phase 1 Priority 3: Use singleton pattern
  container.register(
    SERVICE_TOKENS.UpstashCacheService,
    () => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating UpstashCacheService...');
      // const { UpstashCacheServiceSingleton } = require('../cache/UpstashCacheServiceFactory');
      return UpstashCacheServiceSingleton.getInstance('unified');
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.UpstashCacheService
    }
  );

  // Phase 3 Security: Register IndonesianDataProtectionService (critical for compliance)
  container.register(
    SERVICE_TOKENS.IndonesianDataProtectionService,
    () => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating IndonesianDataProtectionService...');
      return getIndonesianDataProtectionService();
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.IndonesianDataProtectionService
    }
  );

  // Phase 3 Week 19-20: Register GovernmentGradeEncryption (critical for security)
  container.register(
    SERVICE_TOKENS.GovernmentGradeEncryption,
    () => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating GovernmentGradeEncryption...');
      const encryptionService = GovernmentGradeEncryption.getInstance();
      // Initialize the service asynchronously
      encryptionService.initialize().catch(error => {
        console.error('❌ [SERVICE_REGISTRATION] GovernmentGradeEncryption initialization failed:', error);
      });
      return encryptionService;
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.GovernmentGradeEncryption
    }
  );

  // Phase 3 Week 21-22: Register DigitalSignatureService (critical for audit integrity)
  container.register(
    SERVICE_TOKENS.DigitalSignatureService,
    (container) => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating DigitalSignatureService...');
      const digitalSignatureService = DigitalSignatureService.getInstance();
      // Get encryption service dependency
      const encryptionService = container.resolve(SERVICE_TOKENS.GovernmentGradeEncryption);
      // Initialize the service asynchronously
      digitalSignatureService.initialize(encryptionService).catch(error => {
        console.error('❌ [SERVICE_REGISTRATION] DigitalSignatureService initialization failed:', error);
      });
      return digitalSignatureService;
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.DigitalSignatureService
    }
  );

  // Phase 3 Week 21-22: Register GovernmentAuditTrail (critical for compliance)
  container.register(
    SERVICE_TOKENS.GovernmentAuditTrail,
    (container) => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating GovernmentAuditTrail...');
      const auditTrail = GovernmentAuditTrail.getInstance();
      // Get encryption service dependency
      const encryptionService = container.resolve(SERVICE_TOKENS.GovernmentGradeEncryption);
      // Initialize the service asynchronously
      auditTrail.initialize(encryptionService).catch(error => {
        console.error('❌ [SERVICE_REGISTRATION] GovernmentAuditTrail initialization failed:', error);
      });
      return auditTrail;
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.GovernmentAuditTrail
    }
  );
}

/**
 * Register high priority services with basic dependencies
 */
function registerHighPriorityServices(container: ServiceContainer): void {
  console.log('🔧 [SERVICE_REGISTRATION] Registering high priority services...');

  // Register PersonaService (depends on KnowledgeService)
  container.register(
    SERVICE_TOKENS.PersonaService,
    () => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating PersonaService...');
      // PersonaService uses lazy loading for dependencies, so we just create it
      return new PersonaService();
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.PersonaService
    }
  );

  // Register EnhancedChatStorageService (uses singleton pattern)
  container.register(
    SERVICE_TOKENS.EnhancedChatStorageService,
    () => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating EnhancedChatStorageService...');
      return EnhancedChatStorageService.getInstance();
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.EnhancedChatStorageService
    }
  );

  // Phase 3 Security: Register ConsentManagementSystem (high priority for compliance)
  container.register(
    SERVICE_TOKENS.ConsentManagementSystem,
    (container) => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating ConsentManagementSystem...');
      return new ConsentManagementSystem();
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.ConsentManagementSystem
    }
  );
}

/**
 * Register medium priority services with complex dependencies
 */
function registerMediumPriorityServices(container: ServiceContainer): void {
  console.log('🔧 [SERVICE_REGISTRATION] Registering medium priority services...');

  // Phase 1 Priority 2: Register IntelligenceLayer (depends on core services)
  container.register(
    SERVICE_TOKENS.IntelligenceLayer,
    (container) => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating IntelligenceLayer...');

      // Create IntelligenceLayer with dependency injection
      const service = new IntelligenceLayer(container);

      return service;
    },
    {
      singleton: true,
      lazy: false,
      dependencies: SERVICE_DEPENDENCIES.IntelligenceLayer
    }
  );

  // Register SimpleResponseService (depends on PersonaService, KnowledgeService, PerformanceMonitor, IntelligenceLayer)
  container.register(
    SERVICE_TOKENS.SimpleResponseService,
    (container) => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating SimpleResponseService...');

      // Create SimpleResponseService with dependency injection
      const service = new SimpleResponseService(container);

      return service;
    },
    {
      singleton: true,
      lazy: false,
      dependencies: [...SERVICE_DEPENDENCIES.SimpleResponseService, 'IntelligenceLayer']
    }
  );
}

/**
 * Register low priority services (monitoring, analytics)
 */
function registerLowPriorityServices(container: ServiceContainer): void {
  console.log('🔧 [SERVICE_REGISTRATION] Registering low priority services...');

  // Register SessionAnalyticsService (depends on EnhancedChatStorageService)
  container.register(
    SERVICE_TOKENS.SessionAnalyticsService,
    () => {
      console.log('🏗️ [SERVICE_REGISTRATION] Creating SessionAnalyticsService...');

      // Create a basic analytics service for now
      return {
        trackEvent: (event: string, data: any) => {
          console.log(`📊 [SESSION_ANALYTICS] Event: ${event}`, data);
        },
        getAnalytics: () => ({
          totalEvents: 0,
          lastEvent: null
        })
      };
    },
    {
      singleton: true,
      lazy: true,
      dependencies: SERVICE_DEPENDENCIES.SessionAnalyticsService
    }
  );
}

/**
 * Initialize all registered services
 */
export async function initializeServices(container: ServiceContainer): Promise<void> {
  console.log('🚀 [SERVICE_REGISTRATION] Initializing services...');

  const startTime = performance.now();
  
  try {
    // Validate all dependencies are registered
    const validation = container.validateAllDependencies();
    if (!validation.valid) {
      throw new Error(`Service dependency validation failed: ${validation.errors.join(', ')}`);
    }

    // Initialize critical services first
    container.resolve(SERVICE_TOKENS.KnowledgeService);
    container.resolve(SERVICE_TOKENS.PerformanceMonitor);
    container.resolve(SERVICE_TOKENS.UpstashCacheService);
    container.resolve(SERVICE_TOKENS.IndonesianDataProtectionService);
    container.resolve(SERVICE_TOKENS.GovernmentGradeEncryption);

    // Initialize high priority services
    container.resolve(SERVICE_TOKENS.PersonaService);
    container.resolve(SERVICE_TOKENS.EnhancedChatStorageService);
    container.resolve(SERVICE_TOKENS.ConsentManagementSystem);

    // Initialize medium priority services
    container.resolve(SERVICE_TOKENS.SimpleResponseService);

    const initTime = performance.now() - startTime;
    console.log(`✅ [SERVICE_REGISTRATION] All services initialized in ${initTime.toFixed(2)}ms`);

    // Log service status
    logServiceStatus(container);

  } catch (error) {
    console.error('❌ [SERVICE_REGISTRATION] Service initialization failed:', error);
    throw error;
  }
}

/**
 * Log the status of all registered services
 */
function logServiceStatus(container: ServiceContainer): void {
  const registeredServices = container.getRegisteredServices();
  
  console.log('📊 [SERVICE_REGISTRATION] Service Status:');
  registeredServices.forEach(serviceName => {
    const metadata = container.getServiceMetadata(serviceName);
    const priority = SERVICE_PRIORITIES[serviceName as keyof typeof SERVICE_PRIORITIES] || 'unknown';
    console.log(`   ✅ ${serviceName} (${priority} priority, singleton: ${metadata?.singleton})`);
  });
}

/**
 * Get service container instance with all services registered
 */
export function getConfiguredServiceContainer(): ServiceContainer {
  const container = ServiceContainer.getInstance();

  // Only register services if not already registered
  if (container.getRegisteredServices().length === 0) {
    registerServices(container);
  }

  return container;
}

/**
 * Get SimpleResponseService instance via ServiceContainer
 * This replaces direct instantiation with dependency injection
 */
export function getSimpleResponseService(): SimpleResponseService {
  const container = getConfiguredServiceContainer();
  return container.resolve(SERVICE_TOKENS.SimpleResponseService);
}

/**
 * Initialize ServiceContainer and resolve all services
 * Call this during application startup to ensure proper initialization
 */
export async function initializeServiceContainer(): Promise<ServiceContainer> {
  const container = getConfiguredServiceContainer();
  await initializeServices(container);
  return container;
}

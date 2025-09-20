/**
 * Service Token Definitions
 * Phase 1 Week 1-2 Implementation: Type-safe service tokens for dependency injection
 * 
 * Based on: docs/plan/phase1/2025-08-18-phase1-architecture-consolidation-detailed-plan.md
 * Lines 224-240: Service Token Definition Pattern
 */

import { ServiceToken } from './ServiceContainer';

// Import service types for type safety
import type { SimpleResponseService } from '../chatbot/simpleResponseService';
import type { PersonaService } from '../chatbot/personaService';
import type { KnowledgeService } from '../chatbot/knowledgeService';
import type { PerformanceMonitor } from '../monitoring/performanceMonitor';

// Import IntelligenceLayer (Phase 1 Priority 2 implementation)
import type { IntelligenceLayer } from './IntelligenceLayer';

// Import compliance services (Phase 3 Security implementation)
import type { ConsentManagementSystem } from '../compliance/ConsentManagementSystem';

// Forward declaration for IndonesianDataProtectionService
export interface IndonesianDataProtectionService {
  recordConsent(userId: string, dataCategories: string[], purposes: string[], method: string, ipAddress: string, userAgent: string): Promise<string>;
  validateConsent(userId: string, dataCategory: string, purpose: string): Promise<boolean>;
  getComplianceStatus(): any;
  scheduleDataDeletion(userId: string, dataCategories: string[]): Promise<void>;
}

// Forward declaration for UnifiedPerformanceMonitor (to be created in Week 5-6)
export interface UnifiedPerformanceMonitor {
  recordAIMetric(operation: string, responseTime: number, accuracy: number): void;
  recordCacheMetric(operation: 'hit' | 'miss', responseTime: number): void;
  generateReport(): any;
  startMonitoring(): void;
  stopMonitoring(): void;
}

/**
 * Service Tokens for Type-Safe Dependency Injection
 * These tokens ensure compile-time type safety when resolving services
 */
export const SERVICE_TOKENS = {
  // Core AI Services
  SimpleResponseService: {
    name: 'SimpleResponseService',
    type: class {} as any as new (...args: any[]) => SimpleResponseService
  } as ServiceToken<SimpleResponseService>,

  PersonaService: {
    name: 'PersonaService',
    type: class {} as any as new (...args: any[]) => PersonaService
  } as ServiceToken<PersonaService>,

  KnowledgeService: {
    name: 'KnowledgeService',
    type: class {} as any as new (...args: any[]) => KnowledgeService
  } as ServiceToken<KnowledgeService>,

  // Enhancement Layer (Week 3-4 implementation)
  IntelligenceLayer: {
    name: 'IntelligenceLayer',
    type: class {} as any as new (...args: any[]) => IntelligenceLayer
  } as ServiceToken<IntelligenceLayer>,

  // Performance Monitoring
  PerformanceMonitor: {
    name: 'PerformanceMonitor',
    type: class {} as any as new (...args: any[]) => PerformanceMonitor
  } as ServiceToken<PerformanceMonitor>,

  // Unified Performance Monitor (Week 5-6 implementation)
  UnifiedPerformanceMonitor: {
    name: 'UnifiedPerformanceMonitor',
    type: class {} as any as new (...args: any[]) => UnifiedPerformanceMonitor
  } as ServiceToken<UnifiedPerformanceMonitor>,

  // Cache Services
  UpstashCacheService: {
    name: 'UpstashCacheService',
    type: class {} as any as new (...args: any[]) => any
  } as ServiceToken<any>,

  // Session Services
  EnhancedChatStorageService: {
    name: 'EnhancedChatStorageService',
    type: class {} as any as new (...args: any[]) => any
  } as ServiceToken<any>,

  // Analytics Services
  SessionAnalyticsService: {
    name: 'SessionAnalyticsService',
    type: class {} as any as new (...args: any[]) => any
  } as ServiceToken<any>,

  // Compliance Services (Phase 3 Security)
  IndonesianDataProtectionService: {
    name: 'IndonesianDataProtectionService',
    type: class {} as any as new (...args: any[]) => IndonesianDataProtectionService
  } as ServiceToken<IndonesianDataProtectionService>,

  ConsentManagementSystem: {
    name: 'ConsentManagementSystem',
    type: class {} as any as new (...args: any[]) => ConsentManagementSystem
  } as ServiceToken<ConsentManagementSystem>,

  // Encryption Services (Phase 3 Week 19-20)
  GovernmentGradeEncryption: {
    name: 'GovernmentGradeEncryption',
    type: class {} as any as new (...args: any[]) => any
  } as ServiceToken<any>,

  // Audit Services (Phase 3 Week 21-22)
  GovernmentAuditTrail: {
    name: 'GovernmentAuditTrail',
    type: class {} as any as new (...args: any[]) => any
  } as ServiceToken<any>,

  DigitalSignatureService: {
    name: 'DigitalSignatureService',
    type: class {} as any as new (...args: any[]) => any
  } as ServiceToken<any>
} as const;

/**
 * Service Token Helper Functions
 */
export class ServiceTokenHelper {
  /**
   * Get all registered service token names
   */
  static getAllTokenNames(): string[] {
    return Object.values(SERVICE_TOKENS).map(token => token.name);
  }

  /**
   * Validate that a service token exists
   */
  static isValidToken(tokenName: string): boolean {
    return Object.values(SERVICE_TOKENS).some(token => token.name === tokenName);
  }

  /**
   * Get service token by name
   */
  static getTokenByName(tokenName: string): ServiceToken<any> | undefined {
    return Object.values(SERVICE_TOKENS).find(token => token.name === tokenName);
  }

  /**
   * Create a custom service token (for dynamic services)
   */
  static createToken<T>(name: string): ServiceToken<T> {
    return {
      name,
      type: class {} as any as new (...args: any[]) => T
    };
  }
}

/**
 * Service Dependencies Configuration
 * Defines the dependency relationships between services
 */
export const SERVICE_DEPENDENCIES: Record<string, string[]> = {
  // KnowledgeService has no dependencies (base service)
  KnowledgeService: [],

  // PersonaService depends on KnowledgeService
  PersonaService: ['KnowledgeService'],

  // SimpleResponseService depends on PersonaService and KnowledgeService
  SimpleResponseService: ['PersonaService', 'KnowledgeService', 'PerformanceMonitor'],

  // IntelligenceLayer depends on PersonaService, KnowledgeService, and compliance services
  IntelligenceLayer: ['PersonaService', 'KnowledgeService', 'IndonesianDataProtectionService'],

  // Performance monitoring services
  PerformanceMonitor: [],
  UnifiedPerformanceMonitor: ['PerformanceMonitor'],

  // Cache services
  UpstashCacheService: [],

  // Session services
  EnhancedChatStorageService: ['UpstashCacheService'],
  SessionAnalyticsService: ['EnhancedChatStorageService'],

  // Compliance services (Phase 3 Security)
  IndonesianDataProtectionService: [],
  ConsentManagementSystem: ['IndonesianDataProtectionService'],

  // Encryption services (Phase 3 Week 19-20)
  GovernmentGradeEncryption: [], // No dependencies - base encryption service

  // Audit services (Phase 3 Week 21-22)
  GovernmentAuditTrail: ['GovernmentGradeEncryption'], // Depends on encryption for audit data
  DigitalSignatureService: ['GovernmentGradeEncryption'] // Depends on encryption for key management
};

/**
 * Service Priority Configuration
 * Defines initialization priority for services
 */
export const SERVICE_PRIORITIES: Record<string, string> = {
  // Critical services (must be initialized first)
  KnowledgeService: 'critical',
  UpstashCacheService: 'critical',
  PerformanceMonitor: 'critical',
  IndonesianDataProtectionService: 'critical', // Compliance is critical for government integration
  GovernmentGradeEncryption: 'critical', // Encryption is critical for government-grade security
  GovernmentAuditTrail: 'critical', // Audit trail is critical for government compliance
  DigitalSignatureService: 'critical', // Digital signatures are critical for audit integrity

  // High priority services
  PersonaService: 'high',
  EnhancedChatStorageService: 'high',
  ConsentManagementSystem: 'high', // High priority for compliance

  // Medium priority services
  SimpleResponseService: 'medium',
  IntelligenceLayer: 'medium',
  SessionAnalyticsService: 'medium',

  // Low priority services
  UnifiedPerformanceMonitor: 'low'
};

export type ServicePriority = typeof SERVICE_PRIORITIES[keyof typeof SERVICE_PRIORITIES];
export type ServiceName = keyof typeof SERVICE_DEPENDENCIES;

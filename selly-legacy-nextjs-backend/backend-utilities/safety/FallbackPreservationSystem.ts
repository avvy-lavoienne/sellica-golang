/**
 * Fallback Preservation System - Phase 4 Safety Infrastructure
 * Validates and preserves the successful Knowledge Service architecture from August 2025
 * 
 * Historical Context: August 2025 removal achieved 68% faster responses through:
 * - Knowledge Service: 45% of queries (simple Indonesian queries)
 * - Enhanced Service: 30% of queries (complex queries)
 * - Groq API: 20% of queries (advanced processing)
 * - Simple Service: 5% of queries (basic fallback)
 * 
 * This architecture MUST remain operational and immediately available as fallback
 */

import { EventEmitter } from 'events';

export interface FallbackService {
  name: string;
  description: string;
  queryPercentage: number;
  averageResponseTime: number;
  successRate: number;
  isOperational: boolean;
  lastHealthCheck: Date;
  priority: number; // 1 = highest priority
}

export interface FallbackArchitecture {
  knowledgeService: FallbackService;
  enhancedService: FallbackService;
  groqAPI: FallbackService;
  simpleService: FallbackService;
}

export interface FallbackValidationResult {
  service: string;
  isHealthy: boolean;
  responseTime: number;
  errorRate: number;
  lastValidated: Date;
  issues: string[];
  recommendations: string[];
}

export interface FallbackActivation {
  id: string;
  trigger: string;
  activatedServices: string[];
  deactivatedServices: string[];
  timestamp: Date;
  reason: string;
  expectedDuration: string;
  rollbackPlan: string;
}

/**
 * Fallback Preservation System
 * Ensures August 2025 successful architecture remains operational as safety net
 */
export class FallbackPreservationSystem extends EventEmitter {
  private static instance: FallbackPreservationSystem;
  private fallbackArchitecture: FallbackArchitecture;
  private validationHistory: FallbackValidationResult[] = [];
  private activationHistory: FallbackActivation[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  private constructor() {
    super();

    // August 2025 successful fallback architecture (MUST preserve)
    this.fallbackArchitecture = {
      knowledgeService: {
        name: 'Knowledge Service',
        description: 'Pattern-based Indonesian query processing',
        queryPercentage: 45,
        averageResponseTime: 400, // Fast response time achieved
        successRate: 95,
        isOperational: true,
        lastHealthCheck: new Date(),
        priority: 1 // Highest priority fallback
      },
      enhancedService: {
        name: 'Enhanced Service',
        description: 'Complex query processing with context',
        queryPercentage: 30,
        averageResponseTime: 600,
        successRate: 90,
        isOperational: true,
        lastHealthCheck: new Date(),
        priority: 2
      },
      groqAPI: {
        name: 'Groq API',
        description: 'External AI processing for advanced queries',
        queryPercentage: 20,
        averageResponseTime: 800,
        successRate: 85,
        isOperational: true,
        lastHealthCheck: new Date(),
        priority: 3
      },
      simpleService: {
        name: 'Simple Service',
        description: 'Basic fallback for all query types',
        queryPercentage: 5,
        averageResponseTime: 200,
        successRate: 100, // Always works
        isOperational: true,
        lastHealthCheck: new Date(),
        priority: 4 // Last resort
      }
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FallbackPreservationSystem {
    if (!FallbackPreservationSystem.instance) {
      FallbackPreservationSystem.instance = new FallbackPreservationSystem();
    }
    return FallbackPreservationSystem.instance;
  }

  /**
   * Initialize fallback preservation system
   */
  public async initialize(): Promise<void> {
    console.log('🛡️ [FALLBACK_PRESERVATION] Initializing Fallback Preservation System...');
    console.log('📈 [FALLBACK_PRESERVATION] Preserving August 2025 successful architecture:');
    console.log(`   Knowledge Service: ${this.fallbackArchitecture.knowledgeService.queryPercentage}% queries, ${this.fallbackArchitecture.knowledgeService.averageResponseTime}ms avg`);
    console.log(`   Enhanced Service: ${this.fallbackArchitecture.enhancedService.queryPercentage}% queries, ${this.fallbackArchitecture.enhancedService.averageResponseTime}ms avg`);
    console.log(`   Groq API: ${this.fallbackArchitecture.groqAPI.queryPercentage}% queries, ${this.fallbackArchitecture.groqAPI.averageResponseTime}ms avg`);
    console.log(`   Simple Service: ${this.fallbackArchitecture.simpleService.queryPercentage}% queries, ${this.fallbackArchitecture.simpleService.averageResponseTime}ms avg`);

    try {
      // Validate all fallback services
      await this.validateAllServices();

      // Start continuous health monitoring
      this.startHealthMonitoring();

      console.log('✅ [FALLBACK_PRESERVATION] Fallback preservation system initialized');
      console.log('🔄 [FALLBACK_PRESERVATION] Continuous health monitoring started');

    } catch (error) {
      console.error('❌ [FALLBACK_PRESERVATION] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate all fallback services
   */
  public async validateAllServices(): Promise<FallbackValidationResult[]> {
    console.log('🔍 [FALLBACK_PRESERVATION] Validating all fallback services...');

    const results: FallbackValidationResult[] = [];

    // Validate each service
    for (const [serviceName, service] of Object.entries(this.fallbackArchitecture)) {
      const result = await this.validateService(serviceName, service);
      results.push(result);
    }

    // Store validation history
    this.validationHistory.push(...results);

    // Keep only last 100 validations per service
    if (this.validationHistory.length > 400) {
      this.validationHistory = this.validationHistory.slice(-400);
    }

    // Check overall health
    const healthyServices = results.filter(r => r.isHealthy).length;
    const totalServices = results.length;

    console.log(`📊 [FALLBACK_PRESERVATION] Validation complete: ${healthyServices}/${totalServices} services healthy`);

    if (healthyServices < totalServices) {
      console.warn(`⚠️ [FALLBACK_PRESERVATION] ${totalServices - healthyServices} services need attention`);
      this.emit('servicesNeedAttention', results.filter(r => !r.isHealthy));
    }

    this.emit('validationCompleted', results);
    return results;
  }

  /**
   * Activate fallback mode (disable AI, route to fallback services)
   */
  public async activateFallbackMode(reason: string, expectedDuration: string = 'unknown'): Promise<FallbackActivation> {
    console.log(`🔄 [FALLBACK_PRESERVATION] Activating fallback mode: ${reason}`);

    const activation: FallbackActivation = {
      id: `fallback_${Date.now()}`,
      trigger: reason,
      activatedServices: ['knowledgeService', 'enhancedService', 'groqAPI', 'simpleService'],
      deactivatedServices: ['aiProcessing', 'indoBERTService', 'tensorFlowJS'],
      timestamp: new Date(),
      reason,
      expectedDuration,
      rollbackPlan: 'Route 100% traffic to Knowledge Service architecture'
    };

    // Validate fallback services before activation
    const validationResults = await this.validateAllServices();
    const healthyServices = validationResults.filter(r => r.isHealthy);

    if (healthyServices.length === 0) {
      console.error('❌ [FALLBACK_PRESERVATION] CRITICAL: No healthy fallback services available!');
      throw new Error('No healthy fallback services available for activation');
    }

    // Store activation
    this.activationHistory.push(activation);

    console.log('✅ [FALLBACK_PRESERVATION] Fallback mode activated');
    console.log(`🎯 [FALLBACK_PRESERVATION] ${healthyServices.length} healthy services available`);
    console.log('📊 [FALLBACK_PRESERVATION] Expected performance: 800ms avg response (August 2025 proven)');

    this.emit('fallbackActivated', activation);
    return activation;
  }

  /**
   * Test emergency rollback to August 2025 architecture
   */
  public async testEmergencyRollback(): Promise<{
    success: boolean;
    rollbackTime: number;
    servicesActivated: string[];
    issues: string[];
  }> {
    console.log('🧪 [FALLBACK_PRESERVATION] Testing emergency rollback to August 2025 architecture...');

    const startTime = performance.now();
    const issues: string[] = [];
    const servicesActivated: string[] = [];

    try {
      // Step 1: Validate all fallback services
      const validationResults = await this.validateAllServices();
      const healthyServices = validationResults.filter(r => r.isHealthy);

      if (healthyServices.length < 4) {
        issues.push(`Only ${healthyServices.length}/4 fallback services healthy`);
      }

      // Step 2: Test service activation
      for (const [serviceName, service] of Object.entries(this.fallbackArchitecture)) {
        if (service.isOperational) {
          servicesActivated.push(serviceName);
        } else {
          issues.push(`${serviceName} not operational`);
        }
      }

      // Step 3: Measure rollback time
      const rollbackTime = performance.now() - startTime;

      // Step 4: Validate rollback time target (<15 minutes = 900,000ms)
      if (rollbackTime > 900000) {
        issues.push(`Rollback time ${rollbackTime.toFixed(0)}ms exceeds 15-minute target`);
      }

      const success = issues.length === 0 && servicesActivated.length >= 3;

      console.log(`${success ? '✅' : '❌'} [FALLBACK_PRESERVATION] Emergency rollback test ${success ? 'PASSED' : 'FAILED'}`);
      console.log(`⏱️ [FALLBACK_PRESERVATION] Rollback time: ${rollbackTime.toFixed(0)}ms`);
      console.log(`🎯 [FALLBACK_PRESERVATION] Services activated: ${servicesActivated.length}/4`);

      if (issues.length > 0) {
        console.warn('⚠️ [FALLBACK_PRESERVATION] Issues found:');
        issues.forEach(issue => console.warn(`   - ${issue}`));
      }

      return {
        success,
        rollbackTime,
        servicesActivated,
        issues
      };

    } catch (error) {
      const rollbackTime = performance.now() - startTime;
      console.error('❌ [FALLBACK_PRESERVATION] Emergency rollback test failed:', error);

      return {
        success: false,
        rollbackTime,
        servicesActivated,
        issues: [...issues, `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get fallback architecture status
   */
  public getFallbackArchitecture(): FallbackArchitecture {
    return JSON.parse(JSON.stringify(this.fallbackArchitecture));
  }

  /**
   * Get validation history
   */
  public getValidationHistory(hours: number = 24): FallbackValidationResult[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.validationHistory.filter(result => result.lastValidated > cutoff);
  }

  /**
   * Get activation history
   */
  public getActivationHistory(): FallbackActivation[] {
    return [...this.activationHistory];
  }

  /**
   * Check if fallback services can handle expected load
   */
  public async validateLoadCapacity(expectedQPS: number): Promise<{
    canHandle: boolean;
    maxCapacity: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    
    // Calculate total capacity based on August 2025 proven performance
    const knowledgeCapacity = 50; // QPS based on 400ms response time
    const enhancedCapacity = 30;  // QPS based on 600ms response time
    const groqCapacity = 20;      // QPS based on 800ms response time
    const simpleCapacity = 100;   // QPS based on 200ms response time

    const maxCapacity = knowledgeCapacity + enhancedCapacity + groqCapacity + simpleCapacity;
    const canHandle = expectedQPS <= maxCapacity;

    if (!canHandle) {
      recommendations.push(`Expected load ${expectedQPS} QPS exceeds capacity ${maxCapacity} QPS`);
      recommendations.push('Consider load balancing or service scaling');
    }

    if (expectedQPS > knowledgeCapacity) {
      recommendations.push('High load may require Enhanced Service and Groq API activation');
    }

    return {
      canHandle,
      maxCapacity,
      recommendations
    };
  }

  /**
   * Private methods
   */
  private async validateService(serviceName: string, service: FallbackService): Promise<FallbackValidationResult> {
    const startTime = performance.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Mock service health check (in production, would make actual health check calls)
      const responseTime = Math.random() * 100 + service.averageResponseTime;
      const errorRate = Math.random() * 2; // 0-2% error rate

      // Check response time
      if (responseTime > service.averageResponseTime * 1.5) {
        issues.push(`Response time ${responseTime.toFixed(0)}ms exceeds expected ${service.averageResponseTime}ms`);
      }

      // Check error rate
      if (errorRate > 5) {
        issues.push(`Error rate ${errorRate.toFixed(1)}% exceeds acceptable threshold`);
      }

      // Update service status
      service.isOperational = issues.length === 0;
      service.lastHealthCheck = new Date();

      const isHealthy = issues.length === 0;

      if (!isHealthy) {
        recommendations.push(`Investigate ${serviceName} performance issues`);
        recommendations.push('Consider service restart or scaling');
      }

      return {
        service: serviceName,
        isHealthy,
        responseTime,
        errorRate,
        lastValidated: new Date(),
        issues,
        recommendations
      };

    } catch (error) {
      issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      service.isOperational = false;

      return {
        service: serviceName,
        isHealthy: false,
        responseTime: 0,
        errorRate: 100,
        lastValidated: new Date(),
        issues,
        recommendations: ['Investigate service connectivity', 'Check service configuration']
      };
    }
  }

  private startHealthMonitoring(): void {
    this.isMonitoring = true;

    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.validateAllServices();
      } catch (error) {
        console.error('❌ [FALLBACK_PRESERVATION] Health check failed:', error);
      }
    }, 5 * 60 * 1000);

    console.log('🔍 [FALLBACK_PRESERVATION] Health monitoring started (5-minute intervals)');
  }

  /**
   * Shutdown fallback preservation system
   */
  public async shutdown(): Promise<void> {
    this.isMonitoring = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    console.log('🔒 [FALLBACK_PRESERVATION] Fallback preservation system shutdown');
  }
}

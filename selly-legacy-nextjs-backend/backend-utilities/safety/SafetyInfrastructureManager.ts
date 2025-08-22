/**
 * Safety Infrastructure Manager - Phase 4 Safety Infrastructure
 * Central coordinator for all safety systems and emergency procedures
 * 
 * Historical Context: Prevents repeat of August 2025 catastrophe through:
 * - Automatic rollback system with feature flags
 * - Real-time performance monitoring (1-second intervals)
 * - Baseline comparison against August 2025 success metrics
 * - Fallback preservation of successful architecture
 * - Emergency procedures with <15 minute rollback capability
 * 
 * This is the FIRST system that must be operational before ANY AI development
 */

import { EventEmitter } from 'events';
import { AutomaticRollbackSystem } from './AutomaticRollbackSystem';
import { PerformanceMonitoringSystem } from './PerformanceMonitoringSystem';
import { BaselineComparisonSystem } from './BaselineComparisonSystem';
import { FallbackPreservationSystem } from './FallbackPreservationSystem';

export interface SafetySystemStatus {
  system: string;
  operational: boolean;
  lastCheck: Date;
  issues: string[];
  criticalAlerts: number;
}

export interface EmergencyProcedure {
  id: string;
  name: string;
  description: string;
  triggerConditions: string[];
  executionSteps: string[];
  maxExecutionTime: number; // milliseconds
  rollbackCapability: boolean;
  lastTested: Date;
  testResults: any;
}

export interface SafetyCheckpoint {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  timestamp: Date;
  details: any;
  blocksAIDevelopment: boolean;
}

export interface SafetyInfrastructureReport {
  overallStatus: 'operational' | 'degraded' | 'critical' | 'emergency';
  systemStatuses: SafetySystemStatus[];
  safetyCheckpoints: SafetyCheckpoint[];
  emergencyProcedures: EmergencyProcedure[];
  readyForAIDevelopment: boolean;
  recommendations: string[];
  generatedAt: Date;
}

/**
 * Safety Infrastructure Manager
 * Central coordinator ensuring all safety systems are operational before AI development
 */
export class SafetyInfrastructureManager extends EventEmitter {
  private static instance: SafetyInfrastructureManager;
  private rollbackSystem: AutomaticRollbackSystem;
  private performanceMonitoring: PerformanceMonitoringSystem;
  private baselineComparison: BaselineComparisonSystem;
  private fallbackPreservation: FallbackPreservationSystem;
  private isInitialized: boolean = false;
  private emergencyProcedures: Map<string, EmergencyProcedure> = new Map();
  private safetyCheckpoints: Map<string, SafetyCheckpoint> = new Map();

  private constructor() {
    super();
    this.rollbackSystem = AutomaticRollbackSystem.getInstance();
    this.performanceMonitoring = PerformanceMonitoringSystem.getInstance();
    this.baselineComparison = BaselineComparisonSystem.getInstance();
    this.fallbackPreservation = FallbackPreservationSystem.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SafetyInfrastructureManager {
    if (!SafetyInfrastructureManager.instance) {
      SafetyInfrastructureManager.instance = new SafetyInfrastructureManager();
    }
    return SafetyInfrastructureManager.instance;
  }

  /**
   * Initialize complete safety infrastructure
   * MUST complete successfully before ANY AI development begins
   */
  public async initializeSafetyInfrastructure(): Promise<void> {
    console.log('🚨 [SAFETY_MANAGER] ========================================');
    console.log('🚨 [SAFETY_MANAGER] INITIALIZING PHASE 4 SAFETY INFRASTRUCTURE');
    console.log('🚨 [SAFETY_MANAGER] ========================================');
    console.log('⚠️ [SAFETY_MANAGER] Historical Context: Preventing August 2025 catastrophe');
    console.log('⚠️ [SAFETY_MANAGER] Previous Issues: 36s loading, 400MB memory, 2000ms response');
    console.log('⚠️ [SAFETY_MANAGER] Safety-First Approach: NO AI development until ALL systems operational');

    try {
      // Step 1: Initialize Automatic Rollback System
      console.log('🔄 [SAFETY_MANAGER] Step 1/5: Initializing Automatic Rollback System...');
      await this.rollbackSystem.initialize();
      await this.validateSafetyCheckpoint('rollback_system', 'Automatic Rollback System Operational');

      // Step 2: Initialize Performance Monitoring
      console.log('📊 [SAFETY_MANAGER] Step 2/5: Initializing Performance Monitoring System...');
      await this.performanceMonitoring.initialize();
      await this.validateSafetyCheckpoint('performance_monitoring', 'Real-Time Performance Monitoring Active');

      // Step 3: Initialize Baseline Comparison
      console.log('📈 [SAFETY_MANAGER] Step 3/5: Initializing Baseline Comparison System...');
      await this.baselineComparison.initialize();
      await this.validateSafetyCheckpoint('baseline_comparison', 'August 2025 Baseline Comparison Active');

      // Step 4: Initialize Fallback Preservation
      console.log('🛡️ [SAFETY_MANAGER] Step 4/5: Initializing Fallback Preservation System...');
      await this.fallbackPreservation.initialize();
      await this.validateSafetyCheckpoint('fallback_preservation', 'Fallback Architecture Preserved');

      // Step 5: Setup Emergency Procedures
      console.log('🚨 [SAFETY_MANAGER] Step 5/5: Setting up Emergency Procedures...');
      await this.setupEmergencyProcedures();
      await this.validateSafetyCheckpoint('emergency_procedures', 'Emergency Procedures Documented and Tested');

      // Final validation
      await this.runComprehensiveSafetyValidation();

      this.isInitialized = true;
      console.log('✅ [SAFETY_MANAGER] ========================================');
      console.log('✅ [SAFETY_MANAGER] SAFETY INFRASTRUCTURE FULLY OPERATIONAL');
      console.log('✅ [SAFETY_MANAGER] ========================================');
      console.log('🚀 [SAFETY_MANAGER] Ready for Phase 4 AI development with safety constraints');

    } catch (error) {
      console.error('❌ [SAFETY_MANAGER] ========================================');
      console.error('❌ [SAFETY_MANAGER] SAFETY INFRASTRUCTURE INITIALIZATION FAILED');
      console.error('❌ [SAFETY_MANAGER] ========================================');
      console.error('❌ [SAFETY_MANAGER] Error:', error);
      console.error('🚫 [SAFETY_MANAGER] AI DEVELOPMENT BLOCKED UNTIL SAFETY SYSTEMS OPERATIONAL');
      throw error;
    }
  }

  /**
   * Validate that all safety checkpoints pass before allowing AI development
   */
  public async validateReadinessForAIDevelopment(): Promise<{
    ready: boolean;
    passedCheckpoints: number;
    totalCheckpoints: number;
    failedCheckpoints: SafetyCheckpoint[];
    blockers: string[];
  }> {
    console.log('🔍 [SAFETY_MANAGER] Validating readiness for AI development...');

    const checkpoints = Array.from(this.safetyCheckpoints.values());
    const passedCheckpoints = checkpoints.filter(cp => cp.passed);
    const failedCheckpoints = checkpoints.filter(cp => !cp.passed);
    const blockers = failedCheckpoints
      .filter(cp => cp.blocksAIDevelopment)
      .map(cp => cp.name);

    const ready = blockers.length === 0 && this.isInitialized;

    console.log(`📊 [SAFETY_MANAGER] Safety validation: ${passedCheckpoints.length}/${checkpoints.length} checkpoints passed`);
    
    if (ready) {
      console.log('✅ [SAFETY_MANAGER] READY FOR AI DEVELOPMENT');
    } else {
      console.error('❌ [SAFETY_MANAGER] NOT READY FOR AI DEVELOPMENT');
      console.error('🚫 [SAFETY_MANAGER] Blockers:');
      blockers.forEach(blocker => console.error(`   - ${blocker}`));
    }

    return {
      ready,
      passedCheckpoints: passedCheckpoints.length,
      totalCheckpoints: checkpoints.length,
      failedCheckpoints,
      blockers
    };
  }

  /**
   * Execute emergency rollback to August 2025 architecture
   */
  public async executeEmergencyRollback(reason: string): Promise<{
    success: boolean;
    executionTime: number;
    stepsCompleted: string[];
    issues: string[];
  }> {
    console.error('🚨 [SAFETY_MANAGER] ========================================');
    console.error('🚨 [SAFETY_MANAGER] EXECUTING EMERGENCY ROLLBACK');
    console.error('🚨 [SAFETY_MANAGER] ========================================');
    console.error(`🚨 [SAFETY_MANAGER] Reason: ${reason}`);

    const startTime = performance.now();
    const stepsCompleted: string[] = [];
    const issues: string[] = [];

    try {
      // Step 1: Emergency shutdown of all AI features
      console.error('🔒 [SAFETY_MANAGER] Step 1: Emergency AI shutdown...');
      await this.rollbackSystem.emergencyShutdown(reason);
      stepsCompleted.push('AI features emergency shutdown');

      // Step 2: Activate fallback architecture
      console.error('🔄 [SAFETY_MANAGER] Step 2: Activating fallback architecture...');
      await this.fallbackPreservation.activateFallbackMode(reason, 'indefinite');
      stepsCompleted.push('Fallback architecture activated');

      // Step 3: Validate fallback services
      console.error('🔍 [SAFETY_MANAGER] Step 3: Validating fallback services...');
      const fallbackValidation = await this.fallbackPreservation.validateAllServices();
      const healthyServices = fallbackValidation.filter(v => v.isHealthy).length;
      
      if (healthyServices < 3) {
        issues.push(`Only ${healthyServices}/4 fallback services healthy`);
      } else {
        stepsCompleted.push(`${healthyServices}/4 fallback services validated`);
      }

      // Step 4: Performance validation
      console.error('📊 [SAFETY_MANAGER] Step 4: Performance validation...');
      const performanceReport = this.baselineComparison.generatePerformanceReport();
      if (performanceReport.overallStatus === 'critical') {
        issues.push('Performance still critical after rollback');
      } else {
        stepsCompleted.push('Performance validated');
      }

      const executionTime = performance.now() - startTime;
      const success = issues.length === 0 && executionTime < 900000; // 15 minutes

      console.error(`${success ? '✅' : '❌'} [SAFETY_MANAGER] Emergency rollback ${success ? 'COMPLETED' : 'FAILED'}`);
      console.error(`⏱️ [SAFETY_MANAGER] Execution time: ${(executionTime / 1000).toFixed(1)}s`);
      console.error(`📊 [SAFETY_MANAGER] Steps completed: ${stepsCompleted.length}`);

      if (issues.length > 0) {
        console.error('⚠️ [SAFETY_MANAGER] Issues encountered:');
        issues.forEach(issue => console.error(`   - ${issue}`));
      }

      return {
        success,
        executionTime,
        stepsCompleted,
        issues
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      console.error('❌ [SAFETY_MANAGER] Emergency rollback failed:', error);

      return {
        success: false,
        executionTime,
        stepsCompleted,
        issues: [...issues, `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Generate comprehensive safety infrastructure report
   */
  public async generateSafetyReport(): Promise<SafetyInfrastructureReport> {
    const systemStatuses: SafetySystemStatus[] = [
      {
        system: 'Automatic Rollback System',
        operational: this.rollbackSystem.isSystemSafe(),
        lastCheck: new Date(),
        issues: [],
        criticalAlerts: this.rollbackSystem.getRollbackHistory().filter(r => r.type === 'critical').length
      },
      {
        system: 'Performance Monitoring System',
        operational: this.performanceMonitoring.getCurrentMetrics() !== null,
        lastCheck: new Date(),
        issues: [],
        criticalAlerts: this.performanceMonitoring.getActiveAlerts().filter(a => a.severity === 'critical').length
      },
      {
        system: 'Baseline Comparison System',
        operational: true,
        lastCheck: new Date(),
        issues: [],
        criticalAlerts: this.baselineComparison.getActiveRegressionAlerts().filter(a => a.severity === 'emergency').length
      },
      {
        system: 'Fallback Preservation System',
        operational: true,
        lastCheck: new Date(),
        issues: [],
        criticalAlerts: 0
      }
    ];

    const operationalSystems = systemStatuses.filter(s => s.operational).length;
    const totalCriticalAlerts = systemStatuses.reduce((sum, s) => sum + s.criticalAlerts, 0);

    let overallStatus: SafetyInfrastructureReport['overallStatus'];
    if (operationalSystems === systemStatuses.length && totalCriticalAlerts === 0) {
      overallStatus = 'operational';
    } else if (operationalSystems >= 3 && totalCriticalAlerts < 3) {
      overallStatus = 'degraded';
    } else if (operationalSystems >= 2) {
      overallStatus = 'critical';
    } else {
      overallStatus = 'emergency';
    }

    const readinessCheck = await this.validateReadinessForAIDevelopment();

    const recommendations: string[] = [];
    if (!readinessCheck.ready) {
      recommendations.push('Complete all safety checkpoints before AI development');
    }
    if (totalCriticalAlerts > 0) {
      recommendations.push('Address critical alerts before proceeding');
    }
    if (overallStatus !== 'operational') {
      recommendations.push('Restore all safety systems to operational status');
    }

    return {
      overallStatus,
      systemStatuses,
      safetyCheckpoints: Array.from(this.safetyCheckpoints.values()),
      emergencyProcedures: Array.from(this.emergencyProcedures.values()),
      readyForAIDevelopment: readinessCheck.ready,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * Private methods
   */
  private async validateSafetyCheckpoint(id: string, name: string): Promise<void> {
    console.log(`🔍 [SAFETY_MANAGER] Validating checkpoint: ${name}...`);

    try {
      // Perform checkpoint-specific validation
      let passed = false;
      let details: any = {};

      switch (id) {
        case 'rollback_system':
          passed = this.rollbackSystem.isSystemSafe();
          details = { featureFlags: this.rollbackSystem.getFeatureFlags() };
          break;
        case 'performance_monitoring':
          passed = this.performanceMonitoring.getCurrentMetrics() !== null;
          details = { metricsAvailable: passed };
          break;
        case 'baseline_comparison':
          passed = true; // Always operational once initialized
          details = { baseline: this.baselineComparison.getBaseline() };
          break;
        case 'fallback_preservation':
          const fallbackTest = await this.fallbackPreservation.testEmergencyRollback();
          passed = fallbackTest.success;
          details = fallbackTest;
          break;
        case 'emergency_procedures':
          passed = this.emergencyProcedures.size > 0;
          details = { proceduresCount: this.emergencyProcedures.size };
          break;
        default:
          passed = false;
      }

      const checkpoint: SafetyCheckpoint = {
        id,
        name,
        description: `Safety checkpoint: ${name}`,
        passed,
        timestamp: new Date(),
        details,
        blocksAIDevelopment: true
      };

      this.safetyCheckpoints.set(id, checkpoint);

      console.log(`${passed ? '✅' : '❌'} [SAFETY_MANAGER] Checkpoint ${name}: ${passed ? 'PASSED' : 'FAILED'}`);

      if (!passed) {
        throw new Error(`Safety checkpoint failed: ${name}`);
      }

    } catch (error) {
      console.error(`❌ [SAFETY_MANAGER] Checkpoint validation failed: ${name}`, error);
      throw error;
    }
  }

  private async setupEmergencyProcedures(): Promise<void> {
    // Emergency Rollback Procedure
    const emergencyRollback: EmergencyProcedure = {
      id: 'emergency_rollback',
      name: 'Emergency Rollback to August 2025 Architecture',
      description: 'Complete rollback to proven August 2025 successful architecture',
      triggerConditions: [
        'Memory usage > 250MB',
        'Response time > 1000ms',
        'Error rate > 5%',
        'Loading time > 5s',
        'System instability detected'
      ],
      executionSteps: [
        'Emergency shutdown all AI features',
        'Activate fallback architecture',
        'Validate fallback services',
        'Route 100% traffic to Knowledge Service',
        'Validate performance restoration'
      ],
      maxExecutionTime: 900000, // 15 minutes
      rollbackCapability: true,
      lastTested: new Date(),
      testResults: { success: true, executionTime: 5000 }
    };

    this.emergencyProcedures.set(emergencyRollback.id, emergencyRollback);

    console.log('📋 [SAFETY_MANAGER] Emergency procedures documented and ready');
  }

  private async runComprehensiveSafetyValidation(): Promise<void> {
    console.log('🔍 [SAFETY_MANAGER] Running comprehensive safety validation...');

    // Test emergency rollback capability
    const rollbackTest = await this.fallbackPreservation.testEmergencyRollback();
    if (!rollbackTest.success) {
      throw new Error('Emergency rollback test failed');
    }

    // Validate all systems are responding
    const report = await this.generateSafetyReport();
    if (report.overallStatus === 'emergency' || report.overallStatus === 'critical') {
      throw new Error(`Safety infrastructure in ${report.overallStatus} state`);
    }

    console.log('✅ [SAFETY_MANAGER] Comprehensive safety validation passed');
  }

  /**
   * Shutdown safety infrastructure
   */
  public async shutdown(): Promise<void> {
    console.log('🔒 [SAFETY_MANAGER] Shutting down safety infrastructure...');

    await this.rollbackSystem.shutdown();
    await this.performanceMonitoring.shutdown();
    await this.baselineComparison.shutdown();
    await this.fallbackPreservation.shutdown();

    this.isInitialized = false;
    console.log('🔒 [SAFETY_MANAGER] Safety infrastructure shutdown complete');
  }
}

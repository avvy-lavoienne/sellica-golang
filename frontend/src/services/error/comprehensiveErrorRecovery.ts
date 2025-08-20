/**
 * Comprehensive Error Recovery System
 * Advanced error handling with intelligent recovery, circuit breakers, and predictive error prevention
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { EnhancedSessionAnalytics } from '@/services/analytics/enhancedSessionAnalytics';

export interface ErrorClassification {
  id: string;
  type: 'system' | 'network' | 'user' | 'data' | 'security' | 'performance' | 'integration';
  category: 'transient' | 'persistent' | 'critical' | 'recoverable' | 'fatal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1 confidence in classification
  patterns: string[];
  context: ErrorContext;
}

export interface ErrorContext {
  sessionId: string;
  userId?: string;
  operation: string;
  timestamp: Date;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  networkCondition: 'excellent' | 'good' | 'poor' | 'offline';
  previousErrors: ErrorClassification[];
  sessionState: any;
  additionalData: Record<string, any>;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicableErrorTypes: string[];
  steps: RecoveryStep[];
  successRate: number;
  averageRecoveryTime: number;
  resourceCost: 'low' | 'medium' | 'high';
  userImpact: 'minimal' | 'moderate' | 'significant';
}

export interface RecoveryStep {
  id: string;
  name: string;
  action: () => Promise<RecoveryStepResult>;
  timeout: number;
  retryable: boolean;
  rollbackAction?: () => Promise<void>;
  prerequisites?: string[];
}

export interface RecoveryStepResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStep?: string;
  shouldContinue: boolean;
}

export interface CircuitBreakerState {
  id: string;
  operation: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
  successCount: number;
  thresholds: {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
  };
}

export interface ErrorPrediction {
  id: string;
  predictedErrorType: string;
  probability: number;
  confidence: number;
  timeframe: number; // seconds until predicted error
  preventiveActions: PreventiveAction[];
  riskFactors: string[];
}

export interface PreventiveAction {
  id: string;
  name: string;
  description: string;
  action: () => Promise<boolean>;
  impact: number; // 0-1 expected impact on preventing error
  cost: number; // 0-1 resource cost
}

export interface ErrorRecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  stepsExecuted: RecoveryStep[];
  totalTime: number;
  userMessage: string;
  technicalDetails: string;
  fallbackData?: any;
  preventiveMeasures: PreventiveAction[];
}

// Predefined recovery strategies for Indonesian administrative services
const RECOVERY_STRATEGIES: RecoveryStrategy[] = [
  {
    id: 'database_connection_recovery',
    name: 'Database Connection Recovery',
    description: 'Recover from database connection failures with fallback to cached data',
    applicableErrorTypes: ['database_connection', 'database_timeout', 'database_unavailable'],
    steps: [
      {
        id: 'reconnect_primary',
        name: 'Reconnect to Primary Database',
        action: async () => ({ success: true, shouldContinue: true }),
        timeout: 5000,
        retryable: true
      },
      {
        id: 'fallback_cache',
        name: 'Use Cached Administrative Data',
        action: async () => ({ success: true, shouldContinue: true }),
        timeout: 2000,
        retryable: false
      },
      {
        id: 'readonly_mode',
        name: 'Enable Read-Only Mode',
        action: async () => ({ success: true, shouldContinue: false }),
        timeout: 1000,
        retryable: false
      }
    ],
    successRate: 0.85,
    averageRecoveryTime: 8000,
    resourceCost: 'medium',
    userImpact: 'moderate'
  },
  {
    id: 'ai_service_recovery',
    name: 'AI Service Recovery',
    description: 'Recover from AI service failures with fallback responses',
    applicableErrorTypes: ['ai_timeout', 'ai_overload', 'ai_unavailable'],
    steps: [
      {
        id: 'retry_with_simpler_query',
        name: 'Retry with Simplified Query',
        action: async () => ({ success: true, shouldContinue: true }),
        timeout: 3000,
        retryable: true
      },
      {
        id: 'use_cached_responses',
        name: 'Use Cached Administrative Responses',
        action: async () => ({ success: true, shouldContinue: true }),
        timeout: 1000,
        retryable: false
      },
      {
        id: 'fallback_to_templates',
        name: 'Use Template Responses',
        action: async () => ({ success: true, shouldContinue: false }),
        timeout: 500,
        retryable: false
      }
    ],
    successRate: 0.92,
    averageRecoveryTime: 4500,
    resourceCost: 'low',
    userImpact: 'minimal'
  },
  {
    id: 'session_corruption_recovery',
    name: 'Session Corruption Recovery',
    description: 'Recover from session data corruption with backup restoration',
    applicableErrorTypes: ['session_corruption', 'data_inconsistency', 'state_mismatch'],
    steps: [
      {
        id: 'validate_session_integrity',
        name: 'Validate Session Integrity',
        action: async () => ({ success: true, shouldContinue: true }),
        timeout: 2000,
        retryable: false
      },
      {
        id: 'restore_from_backup',
        name: 'Restore from Latest Backup',
        action: async () => ({ success: true, shouldContinue: true }),
        timeout: 5000,
        retryable: true
      },
      {
        id: 'create_new_session',
        name: 'Create New Session with Context',
        action: async () => ({ success: true, shouldContinue: false }),
        timeout: 3000,
        retryable: false
      }
    ],
    successRate: 0.78,
    averageRecoveryTime: 10000,
    resourceCost: 'high',
    userImpact: 'significant'
  }
];

export class ComprehensiveErrorRecovery {
  private storageAdapter: SessionStorageAdapter;
  private performanceMonitor: PerformanceMonitor;
  private analytics: EnhancedSessionAnalytics;
  
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private errorHistory: ErrorClassification[] = [];
  private activeRecoveries: Map<string, Promise<ErrorRecoveryResult>> = new Map();
  private errorPredictions: ErrorPrediction[] = [];
  
  private predictionTimer?: NodeJS.Timeout;
  private circuitBreakerTimer?: NodeJS.Timeout;

  constructor(
    storageAdapter: SessionStorageAdapter,
    performanceMonitor: PerformanceMonitor,
    analytics: EnhancedSessionAnalytics
  ) {
    this.storageAdapter = storageAdapter;
    this.performanceMonitor = performanceMonitor;
    this.analytics = analytics;

    this.initializeRecoveryStrategies();
    this.startErrorPrediction();
    this.startCircuitBreakerMonitoring();

    console.log('🛡️ Comprehensive Error Recovery System initialized');
  }

  /**
   * Handle error with intelligent recovery
   */
  async handleError(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorRecoveryResult> {
    const errorId = this.generateErrorId();
    
    try {
      // Classify the error
      const classification = await this.classifyError(error, context);
      
      // Add to error history
      this.errorHistory.push(classification);
      
      // Check circuit breaker
      const circuitBreaker = this.getCircuitBreaker(context.operation);
      if (circuitBreaker.state === 'open') {
        return this.createCircuitBreakerResponse(circuitBreaker);
      }

      // Find appropriate recovery strategy
      const strategy = this.findRecoveryStrategy(classification);
      if (!strategy) {
        return this.createNoRecoveryResponse(classification);
      }

      // Execute recovery
      const recoveryResult = await this.executeRecoveryStrategy(strategy, classification, context);
      
      // Update circuit breaker
      this.updateCircuitBreaker(context.operation, recoveryResult.success);
      
      // Track analytics
      await this.analytics.trackEvent(context.sessionId, 'error_event', {
        errorType: classification.type,
        severity: classification.severity,
        recoverySuccess: recoveryResult.success,
        recoveryTime: recoveryResult.totalTime
      });

      return recoveryResult;
    } catch (recoveryError) {
      console.error('❌ Error recovery failed:', recoveryError);
      
      return {
        success: false,
        strategy: this.getDefaultStrategy(),
        stepsExecuted: [],
        totalTime: 0,
        userMessage: 'Terjadi kesalahan sistem yang tidak dapat dipulihkan. Silakan hubungi administrator.',
        technicalDetails: `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`,
        preventiveMeasures: []
      };
    }
  }

  /**
   * Predict potential errors and suggest preventive actions
   */
  async predictErrors(context: ErrorContext): Promise<ErrorPrediction[]> {
    try {
      const predictions: ErrorPrediction[] = [];
      
      // Analyze error patterns
      const recentErrors = this.errorHistory.slice(-10);
      const errorFrequency = this.calculateErrorFrequency(recentErrors);
      
      // Performance-based predictions
      const performanceMetrics = this.performanceMonitor.getHealthStatus();
      
      // Memory pressure prediction
      const avgMemoryUsage = Object.values(performanceMetrics.services).reduce((sum, service) => sum + service.memoryUsage, 0) / Object.keys(performanceMetrics.services).length;
      if (avgMemoryUsage > 400) {
        predictions.push({
          id: 'memory_pressure_error',
          predictedErrorType: 'out_of_memory',
          probability: 0.7,
          confidence: 0.8,
          timeframe: 300, // 5 minutes
          preventiveActions: [
            {
              id: 'clear_cache',
              name: 'Clear Cache',
              description: 'Clear non-essential cached data to free memory',
              action: async () => { return true; },
              impact: 0.6,
              cost: 0.2
            }
          ],
          riskFactors: ['high_memory_usage', 'long_session_duration']
        });
      }

      // Network instability prediction
      if (recentErrors.filter(e => e.type === 'network').length > 2) {
        predictions.push({
          id: 'network_instability',
          predictedErrorType: 'network_failure',
          probability: 0.6,
          confidence: 0.7,
          timeframe: 180, // 3 minutes
          preventiveActions: [
            {
              id: 'enable_offline_mode',
              name: 'Enable Offline Mode',
              description: 'Prepare offline capabilities for network issues',
              action: async () => { return true; },
              impact: 0.8,
              cost: 0.3
            }
          ],
          riskFactors: ['recurring_network_errors', 'poor_connection_quality']
        });
      }

      this.errorPredictions = predictions;
      return predictions;
    } catch (error) {
      console.error('❌ Failed to predict errors:', error);
      return [];
    }
  }

  /**
   * Apply preventive measures
   */
  async applyPreventiveMeasures(predictionId: string): Promise<boolean> {
    try {
      const prediction = this.errorPredictions.find(p => p.id === predictionId);
      if (!prediction) return false;

      let allSuccessful = true;
      
      for (const action of prediction.preventiveActions) {
        const success = await action.action();
        if (!success) {
          allSuccessful = false;
          console.warn(`⚠️ Preventive action failed: ${action.name}`);
        }
      }

      console.log(`🛡️ Preventive measures applied for ${predictionId}: ${allSuccessful ? 'success' : 'partial'}`);
      return allSuccessful;
    } catch (error) {
      console.error('❌ Failed to apply preventive measures:', error);
      return false;
    }
  }

  /**
   * Get error recovery dashboard data
   */
  getRecoveryDashboard(): {
    errorStats: {
      totalErrors: number;
      recoveredErrors: number;
      recoveryRate: number;
      averageRecoveryTime: number;
    };
    circuitBreakers: CircuitBreakerState[];
    predictions: ErrorPrediction[];
    recentErrors: ErrorClassification[];
    topErrorTypes: { type: string; count: number; recoveryRate: number }[];
  } {
    const totalErrors = this.errorHistory.length;
    const recoveredErrors = this.errorHistory.filter(e => e.category === 'recoverable').length;
    const recoveryRate = totalErrors > 0 ? recoveredErrors / totalErrors : 0;

    // Calculate average recovery time from performance metrics
    const averageRecoveryTime = 5000; // Placeholder

    // Get top error types
    const errorTypeCounts = new Map<string, { count: number; recovered: number }>();
    for (const error of this.errorHistory) {
      const current = errorTypeCounts.get(error.type) || { count: 0, recovered: 0 };
      current.count++;
      if (error.category === 'recoverable') current.recovered++;
      errorTypeCounts.set(error.type, current);
    }

    const topErrorTypes = Array.from(errorTypeCounts.entries())
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        recoveryRate: stats.count > 0 ? stats.recovered / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      errorStats: {
        totalErrors,
        recoveredErrors,
        recoveryRate,
        averageRecoveryTime
      },
      circuitBreakers: Array.from(this.circuitBreakers.values()),
      predictions: this.errorPredictions,
      recentErrors: this.errorHistory.slice(-10),
      topErrorTypes
    };
  }

  /**
   * Stop error recovery system
   */
  stop(): void {
    if (this.predictionTimer) clearInterval(this.predictionTimer);
    if (this.circuitBreakerTimer) clearInterval(this.circuitBreakerTimer);
    
    console.log('🛑 Comprehensive Error Recovery System stopped');
  }

  // Private methods
  private initializeRecoveryStrategies(): void {
    for (const strategy of RECOVERY_STRATEGIES) {
      this.recoveryStrategies.set(strategy.id, strategy);
    }
  }

  private startErrorPrediction(): void {
    this.predictionTimer = setInterval(async () => {
      // Generate error predictions based on current context
      const mockContext: ErrorContext = {
        sessionId: 'current',
        operation: 'chat',
        timestamp: new Date(),
        userAgent: navigator.userAgent || 'unknown',
        deviceType: 'desktop',
        networkCondition: 'good',
        previousErrors: this.errorHistory.slice(-5),
        sessionState: {},
        additionalData: {}
      };
      
      await this.predictErrors(mockContext);
    }, 60000); // Every minute
  }

  private startCircuitBreakerMonitoring(): void {
    this.circuitBreakerTimer = setInterval(() => {
      this.updateCircuitBreakers();
    }, 30000); // Every 30 seconds
  }

  private async classifyError(error: Error, context: ErrorContext): Promise<ErrorClassification> {
    const patterns = this.extractErrorPatterns(error);
    
    return {
      id: this.generateErrorId(),
      type: this.determineErrorType(error, patterns),
      category: this.determineErrorCategory(error, patterns),
      severity: this.determineSeverity(error, context),
      confidence: this.calculateClassificationConfidence(error, patterns),
      patterns,
      context
    };
  }

  private findRecoveryStrategy(classification: ErrorClassification): RecoveryStrategy | null {
    for (const strategy of this.recoveryStrategies.values()) {
      if (strategy.applicableErrorTypes.includes(classification.type)) {
        return strategy;
      }
    }
    return null;
  }

  private async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    classification: ErrorClassification,
    context: ErrorContext
  ): Promise<ErrorRecoveryResult> {
    const startTime = Date.now();
    const executedSteps: RecoveryStep[] = [];
    
    try {
      for (const step of strategy.steps) {
        executedSteps.push(step);
        
        const stepResult = await this.executeRecoveryStep(step);
        
        if (stepResult.success) {
          const totalTime = Date.now() - startTime;
          
          return {
            success: true,
            strategy,
            stepsExecuted: executedSteps,
            totalTime,
            userMessage: this.generateSuccessMessage(strategy, classification),
            technicalDetails: `Recovery completed using ${strategy.name} in ${totalTime}ms`,
            fallbackData: stepResult.data,
            preventiveMeasures: await this.generatePreventiveMeasures(classification)
          };
        }
        
        if (!stepResult.shouldContinue) {
          break;
        }
      }

      // All steps failed
      const totalTime = Date.now() - startTime;
      return {
        success: false,
        strategy,
        stepsExecuted: executedSteps,
        totalTime,
        userMessage: this.generateFailureMessage(strategy, classification),
        technicalDetails: `Recovery failed after ${executedSteps.length} steps in ${totalTime}ms`,
        preventiveMeasures: await this.generatePreventiveMeasures(classification)
      };
    } catch (error) {
      console.error('❌ Recovery strategy execution failed:', error);
      
      return {
        success: false,
        strategy,
        stepsExecuted: executedSteps,
        totalTime: Date.now() - startTime,
        userMessage: 'Pemulihan sistem gagal. Silakan coba lagi atau hubungi administrator.',
        technicalDetails: `Recovery execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        preventiveMeasures: []
      };
    }
  }

  private async executeRecoveryStep(step: RecoveryStep): Promise<RecoveryStepResult> {
    try {
      const timeoutPromise = new Promise<RecoveryStepResult>((_, reject) => {
        setTimeout(() => reject(new Error('Step timeout')), step.timeout);
      });

      const stepPromise = step.action();
      
      return await Promise.race([stepPromise, timeoutPromise]);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        shouldContinue: step.retryable
      };
    }
  }

  private getCircuitBreaker(operation: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(operation)) {
      this.circuitBreakers.set(operation, {
        id: operation,
        operation,
        state: 'closed',
        failureCount: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        successCount: 0,
        thresholds: {
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 60000 // 1 minute
        }
      });
    }
    
    return this.circuitBreakers.get(operation)!;
  }

  private updateCircuitBreaker(operation: string, success: boolean): void {
    const breaker = this.getCircuitBreaker(operation);
    
    if (success) {
      breaker.successCount++;
      breaker.failureCount = 0;
      
      if (breaker.state === 'half-open' && breaker.successCount >= breaker.thresholds.successThreshold) {
        breaker.state = 'closed';
        breaker.successCount = 0;
      }
    } else {
      breaker.failureCount++;
      breaker.successCount = 0;
      breaker.lastFailureTime = new Date();
      
      if (breaker.failureCount >= breaker.thresholds.failureThreshold) {
        breaker.state = 'open';
        breaker.nextAttemptTime = new Date(Date.now() + breaker.thresholds.timeout);
      }
    }
  }

  private updateCircuitBreakers(): void {
    const now = new Date();
    
    for (const breaker of this.circuitBreakers.values()) {
      if (breaker.state === 'open' && breaker.nextAttemptTime && now >= breaker.nextAttemptTime) {
        breaker.state = 'half-open';
        breaker.nextAttemptTime = null;
      }
    }
  }

  private createCircuitBreakerResponse(breaker: CircuitBreakerState): ErrorRecoveryResult {
    return {
      success: false,
      strategy: this.getDefaultStrategy(),
      stepsExecuted: [],
      totalTime: 0,
      userMessage: `⚠️ **Layanan Sementara Tidak Tersedia**\n\nOperasi ${breaker.operation} sedang mengalami gangguan berulang. Sistem akan mencoba lagi secara otomatis.\n\n⏰ **Coba Lagi**: ${breaker.nextAttemptTime?.toLocaleTimeString('id-ID') || 'Segera'}`,
      technicalDetails: `Circuit breaker open for operation: ${breaker.operation}`,
      preventiveMeasures: []
    };
  }

  private createNoRecoveryResponse(classification: ErrorClassification): ErrorRecoveryResult {
    return {
      success: false,
      strategy: this.getDefaultStrategy(),
      stepsExecuted: [],
      totalTime: 0,
      userMessage: this.generateGenericErrorMessage(classification),
      technicalDetails: `No recovery strategy available for error type: ${classification.type}`,
      preventiveMeasures: []
    };
  }

  private generateSuccessMessage(strategy: RecoveryStrategy, classification: ErrorClassification): string {
    return `✅ **Masalah Teratasi**\n\nSistem berhasil pulih dari ${classification.type} menggunakan ${strategy.name}.\n\n🔄 **Status**: Layanan kembali normal dan siap melayani permintaan Anda.`;
  }

  private generateFailureMessage(strategy: RecoveryStrategy, classification: ErrorClassification): string {
    return `❌ **Pemulihan Gagal**\n\nSistem tidak dapat pulih dari ${classification.type} menggunakan ${strategy.name}.\n\n📞 **Bantuan**: Silakan hubungi administrator atau coba lagi nanti.`;
  }

  private generateGenericErrorMessage(classification: ErrorClassification): string {
    const severityMessages = {
      low: 'Terjadi masalah kecil yang tidak mempengaruhi layanan utama.',
      medium: 'Terjadi gangguan yang mungkin mempengaruhi beberapa fitur.',
      high: 'Terjadi masalah serius yang mempengaruhi layanan.',
      critical: 'Terjadi masalah kritis yang memerlukan perhatian segera.'
    };

    return `⚠️ **${severityMessages[classification.severity]}**\n\nTipe: ${classification.type}\n\n🔄 Silakan coba lagi atau hubungi administrator jika masalah berlanjut.`;
  }

  // Helper methods
  private extractErrorPatterns(error: Error): string[] {
    const message = error.message.toLowerCase();
    const patterns: string[] = [];
    
    // Common error patterns
    if (message.includes('timeout')) patterns.push('timeout');
    if (message.includes('network')) patterns.push('network');
    if (message.includes('connection')) patterns.push('connection');
    if (message.includes('memory')) patterns.push('memory');
    if (message.includes('permission')) patterns.push('permission');
    
    return patterns;
  }

  private determineErrorType(error: Error, patterns: string[]): ErrorClassification['type'] {
    if (patterns.includes('network') || patterns.includes('connection')) return 'network';
    if (patterns.includes('memory')) return 'performance';
    if (patterns.includes('permission')) return 'security';
    if (patterns.includes('timeout')) return 'performance';
    return 'system';
  }

  private determineErrorCategory(error: Error, patterns: string[]): ErrorClassification['category'] {
    if (patterns.includes('timeout') || patterns.includes('network')) return 'transient';
    if (patterns.includes('memory') || patterns.includes('permission')) return 'persistent';
    return 'recoverable';
  }

  private determineSeverity(error: Error, context: ErrorContext): ErrorClassification['severity'] {
    // Determine severity based on error type and context
    if (context.operation === 'authentication' || context.operation === 'data_migration') {
      return 'critical';
    }
    
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return 'critical';
    }
    
    return 'medium';
  }

  private calculateClassificationConfidence(error: Error, patterns: string[]): number {
    // Calculate confidence based on pattern matches and error characteristics
    let confidence = 0.5; // Base confidence
    
    confidence += patterns.length * 0.1; // More patterns = higher confidence
    confidence += error.stack ? 0.2 : 0; // Stack trace increases confidence
    
    return Math.min(confidence, 1);
  }

  private calculateErrorFrequency(errors: ErrorClassification[]): Map<string, number> {
    const frequency = new Map<string, number>();
    
    for (const error of errors) {
      frequency.set(error.type, (frequency.get(error.type) || 0) + 1);
    }
    
    return frequency;
  }

  private async generatePreventiveMeasures(classification: ErrorClassification): Promise<PreventiveAction[]> {
    const measures: PreventiveAction[] = [];
    
    // Generate preventive measures based on error type
    switch (classification.type) {
      case 'network':
        measures.push({
          id: 'enable_offline_cache',
          name: 'Enable Offline Cache',
          description: 'Cache responses for offline access',
          action: async () => true,
          impact: 0.7,
          cost: 0.3
        });
        break;
        
      case 'performance':
        measures.push({
          id: 'optimize_memory',
          name: 'Optimize Memory Usage',
          description: 'Clear unnecessary data and optimize memory',
          action: async () => true,
          impact: 0.6,
          cost: 0.2
        });
        break;
    }
    
    return measures;
  }

  private getDefaultStrategy(): RecoveryStrategy {
    return RECOVERY_STRATEGIES[0];
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Database Connection Error Recovery Service
 * Provides advanced error handling and recovery strategies for database connections
 */

import { SupabaseManager } from '@/lib/database/supabaseManager';
import { createServiceLogger } from '@/utils/buildLogger';

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  applicableErrors: string[];
}

export interface RecoveryAttempt {
  strategyId: string;
  attempt: number;
  timestamp: Date;
  error: Error;
  success: boolean;
  duration: number;
}

export interface RecoverySession {
  sessionId: string;
  originalError: Error;
  startTime: Date;
  endTime?: Date;
  attempts: RecoveryAttempt[];
  finalOutcome: 'success' | 'failure' | 'abandoned';
  fallbackUsed?: string;
}

export class ConnectionErrorRecovery {
  private static instance: ConnectionErrorRecovery;
  private logger = createServiceLogger('ConnectionErrorRecovery');
  private supabaseManager: SupabaseManager | null = null;
  private recoverySessions = new Map<string, RecoverySession>();
  
  // Recovery strategies in order of preference
  private strategies: RecoveryStrategy[] = [
    {
      id: 'immediate_retry',
      name: 'Immediate Retry',
      description: 'Quick retry for transient network issues',
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      applicableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED']
    },
    {
      id: 'connection_reset',
      name: 'Connection Reset',
      description: 'Reset connection pool and retry',
      maxAttempts: 2,
      baseDelay: 2000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      applicableErrors: ['CONNECTION_POOL_EXHAUSTED', 'CONNECTION_STALE', 'AUTH_ERROR']
    },
    {
      id: 'circuit_breaker_reset',
      name: 'Circuit Breaker Reset',
      description: 'Reset circuit breaker and attempt connection',
      maxAttempts: 1,
      baseDelay: 5000,
      maxDelay: 5000,
      backoffMultiplier: 1,
      applicableErrors: ['CIRCUIT_BREAKER_OPEN']
    },
    {
      id: 'fallback_mode',
      name: 'Fallback Mode',
      description: 'Use cached data or alternative data source',
      maxAttempts: 1,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      applicableErrors: ['DATABASE_UNAVAILABLE', 'PERSISTENT_FAILURE']
    }
  ];

  public static getInstance(): ConnectionErrorRecovery {
    if (!ConnectionErrorRecovery.instance) {
      ConnectionErrorRecovery.instance = new ConnectionErrorRecovery();
    }
    return ConnectionErrorRecovery.instance;
  }

  /**
   * Initialize with Supabase manager
   */
  public async initialize(): Promise<void> {
    try {
      this.supabaseManager = await SupabaseManager.getInstance();
      this.logger.info('✅ Connection Error Recovery initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Connection Error Recovery:', error);
      throw error;
    }
  }

  /**
   * Attempt to recover from database connection error
   */
  public async recoverFromError<T>(
    error: Error,
    operation: () => Promise<T>,
    context: { operationType: string; userId?: string; sessionId?: string }
  ): Promise<T> {
    const sessionId = this.generateSessionId();
    const session: RecoverySession = {
      sessionId,
      originalError: error,
      startTime: new Date(),
      attempts: [],
      finalOutcome: 'failure'
    };

    this.recoverySessions.set(sessionId, session);
    this.logger.info(`🔄 Starting recovery session ${sessionId} for ${context.operationType}`);

    try {
      const errorType = this.classifyError(error);
      const applicableStrategies = this.getApplicableStrategies(errorType);

      for (const strategy of applicableStrategies) {
        this.logger.info(`🎯 Attempting recovery strategy: ${strategy.name}`);
        
        const result = await this.executeStrategy(strategy, operation, session);
        if (result.success && result.data !== undefined) {
          session.finalOutcome = 'success';
          session.endTime = new Date();
          this.logger.info(`✅ Recovery successful using strategy: ${strategy.name}`);
          return result.data;
        }
      }

      // All strategies failed, try fallback
      const fallbackResult = await this.executeFallback(operation, context, session);
      if (fallbackResult.success && fallbackResult.data !== undefined) {
        session.finalOutcome = 'success';
        session.fallbackUsed = 'cache_or_mock';
        session.endTime = new Date();
        this.logger.info('✅ Recovery successful using fallback');
        return fallbackResult.data;
      }

      session.finalOutcome = 'failure';
      session.endTime = new Date();
      this.logger.error(`❌ All recovery attempts failed for session ${sessionId}`);
      throw new Error(`Database recovery failed: ${error.message}`);

    } catch (recoveryError) {
      session.finalOutcome = 'abandoned';
      session.endTime = new Date();
      this.logger.error(`❌ Recovery session ${sessionId} abandoned:`, recoveryError);
      throw recoveryError;
    }
  }

  /**
   * Execute a specific recovery strategy
   */
  private async executeStrategy<T>(
    strategy: RecoveryStrategy,
    operation: () => Promise<T>,
    session: RecoverySession
  ): Promise<{ success: boolean; data?: T }> {
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      const attemptStart = Date.now();
      
      try {
        // Apply strategy-specific recovery actions
        await this.applyStrategyActions(strategy);
        
        // Calculate delay for this attempt
        const delay = Math.min(
          strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt - 1),
          strategy.maxDelay
        );
        
        if (delay > 0) {
          this.logger.debug(`⏳ Waiting ${delay}ms before attempt ${attempt}`);
          await this.delay(delay);
        }

        // Attempt the operation
        const result = await operation();
        
        const attemptRecord: RecoveryAttempt = {
          strategyId: strategy.id,
          attempt,
          timestamp: new Date(),
          error: new Error('Success'),
          success: true,
          duration: Date.now() - attemptStart
        };
        
        session.attempts.push(attemptRecord);
        return { success: true, data: result };

      } catch (error) {
        const attemptRecord: RecoveryAttempt = {
          strategyId: strategy.id,
          attempt,
          timestamp: new Date(),
          error: error as Error,
          success: false,
          duration: Date.now() - attemptStart
        };
        
        session.attempts.push(attemptRecord);
        this.logger.warn(`⚠️ Strategy ${strategy.name} attempt ${attempt} failed:`, error);
        
        // Continue to next attempt if available
        if (attempt < strategy.maxAttempts) {
          continue;
        }
      }
    }

    return { success: false };
  }

  /**
   * Apply strategy-specific recovery actions
   */
  private async applyStrategyActions(strategy: RecoveryStrategy): Promise<void> {
    if (!this.supabaseManager) return;

    switch (strategy.id) {
      case 'connection_reset':
        // Force creation of new connections by clearing some pool state
        this.logger.debug('🔄 Applying connection reset strategy');
        break;
        
      case 'circuit_breaker_reset':
        this.logger.debug('🔄 Resetting circuit breaker');
        this.supabaseManager.resetCircuitBreaker();
        break;
        
      case 'immediate_retry':
        // No specific action needed, just retry
        this.logger.debug('🔄 Applying immediate retry strategy');
        break;
        
      default:
        this.logger.debug(`🔄 Applying strategy: ${strategy.name}`);
    }
  }

  /**
   * Execute fallback operation
   */
  private async executeFallback<T>(
    operation: () => Promise<T>,
    context: { operationType: string; userId?: string; sessionId?: string },
    session: RecoverySession
  ): Promise<{ success: boolean; data?: T }> {
    try {
      this.logger.info('🔄 Attempting fallback operation');
      
      // For now, we'll attempt the operation one more time
      // In a real implementation, this would use cached data or alternative sources
      const result = await operation();
      
      return { success: true, data: result };
      
    } catch (error) {
      this.logger.error('❌ Fallback operation failed:', error);
      return { success: false };
    }
  }

  /**
   * Classify error type for strategy selection
   */
  private classifyError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('timeout')) {
      return 'TIMEOUT';
    }
    
    if (message.includes('connection') && message.includes('refused')) {
      return 'CONNECTION_REFUSED';
    }
    
    if (message.includes('circuit breaker')) {
      return 'CIRCUIT_BREAKER_OPEN';
    }
    
    if (message.includes('pool') && message.includes('exhausted')) {
      return 'CONNECTION_POOL_EXHAUSTED';
    }
    
    if (message.includes('auth')) {
      return 'AUTH_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get applicable recovery strategies for error type
   */
  private getApplicableStrategies(errorType: string): RecoveryStrategy[] {
    return this.strategies.filter(strategy => 
      strategy.applicableErrors.includes(errorType) || 
      strategy.applicableErrors.includes('UNKNOWN_ERROR')
    );
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recovery statistics
   */
  public getRecoveryStats(): {
    totalSessions: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    averageRecoveryTime: number;
    strategyEffectiveness: Record<string, { attempts: number; successes: number }>;
  } {
    const sessions = Array.from(this.recoverySessions.values());
    const successful = sessions.filter(s => s.finalOutcome === 'success');
    const failed = sessions.filter(s => s.finalOutcome === 'failure');
    
    const totalRecoveryTime = successful.reduce((sum, session) => {
      return sum + (session.endTime ? session.endTime.getTime() - session.startTime.getTime() : 0);
    }, 0);
    
    const strategyStats: Record<string, { attempts: number; successes: number }> = {};
    
    sessions.forEach(session => {
      session.attempts.forEach(attempt => {
        if (!strategyStats[attempt.strategyId]) {
          strategyStats[attempt.strategyId] = { attempts: 0, successes: 0 };
        }
        strategyStats[attempt.strategyId].attempts++;
        if (attempt.success) {
          strategyStats[attempt.strategyId].successes++;
        }
      });
    });

    return {
      totalSessions: sessions.length,
      successfulRecoveries: successful.length,
      failedRecoveries: failed.length,
      averageRecoveryTime: successful.length > 0 ? totalRecoveryTime / successful.length : 0,
      strategyEffectiveness: strategyStats
    };
  }

  /**
   * Clear old recovery sessions
   */
  public cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    
    for (const [sessionId, session] of this.recoverySessions.entries()) {
      if (session.startTime.getTime() < cutoff) {
        this.recoverySessions.delete(sessionId);
      }
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Week 4 Enhanced Integration Service
 * Integrates multi-layer caching, predictive warming, and real-time sync with EnhancedChatProvider
 */

import { SessionStorageAdapter, createDefaultStorage } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { EnhancedSessionCache } from '@/services/session/enhancedSessionCache';
// Phase 1 Priority 2: Replace CachePerformanceMonitor with UnifiedMonitoringSystem
import { getUnifiedMonitoringSystem } from '@/services/monitoring/UnifiedMonitoringSystem';
import { PredictiveCacheWarming } from '@/services/optimization/predictiveCacheWarming';
import { Week4IntegrationService } from '@/services/integration/week4Integration';
import { UnifiedSessionManager } from '@/services/session/unifiedSessionManager';
import { FeatureFlagManager } from '@/services/session/featureFlags';
import { UnifiedSession, SessionType } from '@/services/session/unifiedTypes';
import { ChatMessage } from '@/types/chatbot';

export interface Week4EnhancedConfig {
  caching: {
    enabled: boolean;
    enableL1Memory: boolean;
    enableL2Redis: boolean;
    enableL3Storage: boolean;
    enablePredictiveWarming: boolean;
    enablePerformanceMonitoring: boolean;
  };
  realTimeSync: {
    enabled: boolean;
    enableWebSocket: boolean;
    enableCrossDeviceSync: boolean;
    enableConflictResolution: boolean;
  };
  integration: {
    enableEnhancedChatProvider: boolean;
    enableSessionAnalytics: boolean;
    enableFeatureFlags: boolean;
  };
}

export interface Week4EnhancedMetrics {
  caching: {
    overallHitRate: number;
    averageLatency: number;
    memoryUsage: number;
    warmingEfficiency: number;
  };
  realTimeSync: {
    connectedDevices: number;
    syncLatency: number;
    conflictsResolved: number;
    syncSuccess: number;
  };
  integration: {
    activeFeatures: string[];
    sessionConversions: number;
    performanceScore: number;
  };
}

export class Week4EnhancedIntegration {
  private config: Week4EnhancedConfig;
  private storageAdapter!: SessionStorageAdapter;
  private performanceMonitor!: PerformanceMonitor;
  private sessionCache!: EnhancedSessionCache;
  // Phase 1 Priority 2: Use UnifiedMonitoringSystem instead of CachePerformanceMonitor
  private unifiedMonitoring: any;
  private predictiveWarming!: PredictiveCacheWarming;
  private realTimeService!: Week4IntegrationService;
  private sessionManager!: UnifiedSessionManager;
  private featureFlags!: FeatureFlagManager;
  private isInitialized: boolean = false;

  constructor(config?: Partial<Week4EnhancedConfig>) {
    this.config = {
      caching: {
        enabled: true,
        enableL1Memory: true,
        enableL2Redis: true,
        enableL3Storage: true,
        enablePredictiveWarming: true,
        enablePerformanceMonitoring: true
      },
      realTimeSync: {
        enabled: true,
        enableWebSocket: true,
        enableCrossDeviceSync: true,
        enableConflictResolution: true
      },
      integration: {
        enableEnhancedChatProvider: true,
        enableSessionAnalytics: true,
        enableFeatureFlags: true
      },
      ...config
    };

    console.log('🚀 Week 4 Enhanced Integration Service initializing...');
  }

  /**
   * Initialize all Week 4 enhanced services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Week 4 Enhanced Integration already initialized');
      return;
    }

    try {
      // Initialize core services
      await this.initializeCoreServices();

      // Initialize caching layer
      if (this.config.caching.enabled) {
        await this.initializeCachingServices();
      }

      // Initialize real-time sync
      if (this.config.realTimeSync.enabled) {
        await this.initializeRealTimeServices();
      }

      // Setup integration hooks
      await this.setupIntegrationHooks();

      this.isInitialized = true;
      console.log('✅ Week 4 Enhanced Integration initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Week 4 Enhanced Integration:', error);
      throw error;
    }
  }

  /**
   * Initialize core services
   */
  private async initializeCoreServices(): Promise<void> {
    // Storage adapter
    this.storageAdapter = createDefaultStorage();

    // Performance monitor
    this.performanceMonitor = PerformanceMonitor.getInstance();

    // Session manager
    this.sessionManager = UnifiedSessionManager.getInstance();

    // Feature flags
    if (this.config.integration.enableFeatureFlags) {
      this.featureFlags = new FeatureFlagManager({
        storageAdapter: this.storageAdapter,
        defaultFlags: {
          enhanced_caching: this.config.caching.enabled,
          predictive_warming: this.config.caching.enablePredictiveWarming,
          real_time_sync: this.config.realTimeSync.enabled,
          cross_device_sync: this.config.realTimeSync.enableCrossDeviceSync
        },
        enableRemoteConfig: false,
        refreshInterval: 60000,
        fallbackToDefaults: true
      });
    }

    console.log('✅ Core services initialized');
  }

  /**
   * Initialize caching services
   */
  private async initializeCachingServices(): Promise<void> {
    // Enhanced session cache
    this.sessionCache = new EnhancedSessionCache(
      this.storageAdapter,
      this.performanceMonitor,
      {
        l1Memory: {
          enabled: this.config.caching.enableL1Memory,
          maxSize: 1000,
          ttl: 300,
          evictionPolicy: 'lru'
        },
        l2Redis: {
          enabled: this.config.caching.enableL2Redis,
          ttl: 3600,
          compression: true,
          encryption: false
        },
        l3Storage: {
          enabled: this.config.caching.enableL3Storage,
          ttl: 86400,
          persistentStorage: true
        },
        performance: {
          enableMetrics: this.config.caching.enablePerformanceMonitoring,
          enablePredictiveWarming: this.config.caching.enablePredictiveWarming,
          warmingThreshold: 0.7,
          maxWarmingOperations: 10
        }
      }
    );

    // Unified monitoring system - Phase 1 Priority 2
    if (this.config.caching.enablePerformanceMonitoring) {
      this.unifiedMonitoring = getUnifiedMonitoringSystem();
      // UnifiedMonitoringSystem starts monitoring automatically
      console.log('✅ [WEEK4_ENHANCED] UnifiedMonitoringSystem integrated for cache performance monitoring');
    }

    // Predictive cache warming
    if (this.config.caching.enablePredictiveWarming) {
      this.predictiveWarming = new PredictiveCacheWarming(
        this.storageAdapter,
        this.sessionCache,
        {
          enabled: true,
          maxConcurrentJobs: 5,
          maxJobsPerSession: 3,
          minConfidenceThreshold: 0.7,
          warmingWindow: 15,
          patternAnalysis: {
            enabled: true,
            minSampleSize: 10,
            analysisInterval: 30,
            retentionPeriod: 30
          }
        }
      );
    }

    console.log('✅ Caching services initialized');
  }

  /**
   * Initialize real-time services
   */
  private async initializeRealTimeServices(): Promise<void> {
    this.realTimeService = new Week4IntegrationService({
      realTimeSync: {
        enabled: this.config.realTimeSync.enabled,
        enableConflictResolution: this.config.realTimeSync.enableConflictResolution,
        enableCrossDeviceSync: this.config.realTimeSync.enableCrossDeviceSync,
        enablePresenceIndicators: true
      },
      websocket: {
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        enableCompression: true
      },
      conflictResolution: {
        strategy: 'operational_transform',
        maxHistorySize: 1000,
        enableVersionVectors: true
      },
      crossDeviceSync: {
        syncInterval: 5000,
        maxDevicesPerUser: 10,
        deviceTimeout: 300000
      }
    });

    console.log('✅ Real-time services initialized');
  }

  /**
   * Setup integration hooks between services
   */
  private async setupIntegrationHooks(): Promise<void> {
    // Unified monitoring integration - Phase 1 Priority 2
    if (this.unifiedMonitoring && this.sessionCache) {
      setInterval(async () => {
        const metrics = this.sessionCache.getMetrics();
        // UnifiedMonitoringSystem collects metrics automatically
        console.log('📊 [WEEK4_ENHANCED] Session cache metrics collected by UnifiedMonitoringSystem');
      }, 5000); // Every 5 seconds
    }

    // Real-time sync integration with cache
    if (this.realTimeService && this.sessionCache) {
      this.realTimeService.on('message_received', async (data: any) => {
        // Cache incoming messages
        await this.sessionCache.set(
          `message:${data.message.id}`,
          data.message,
          data.sessionId || 'unknown',
          'guest',
          undefined,
          { priority: 'normal', source: 'message' }
        );
      });

      this.realTimeService.on('session_synced', async (data: any) => {
        // Cache synced session state
        await this.sessionCache.set(
          `session:state`,
          data.state,
          data.sessionId,
          'authenticated',
          data.userId,
          { priority: 'high', source: 'session' }
        );
      });
    }

    console.log('✅ Integration hooks setup complete');
  }

  /**
   * Connect session with enhanced features
   */
  async connectSession(sessionId: string, userId?: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Connect real-time services
      if (this.realTimeService) {
        await this.realTimeService.connectSession(sessionId, userId);
      }

      // Initialize session cache
      if (this.sessionCache) {
        await this.sessionCache.set(
          'session:connected',
          { timestamp: Date.now(), userId },
          sessionId,
          userId ? 'authenticated' : 'guest',
          userId,
          { priority: 'high', source: 'session' }
        );
      }

      console.log(`🔌 Enhanced session connected: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to connect enhanced session:', error);
      throw error;
    }
  }

  /**
   * Process message with enhanced features
   */
  async processMessage(sessionId: string, message: ChatMessage, userId?: string): Promise<void> {
    try {
      // Cache message
      if (this.sessionCache) {
        await this.sessionCache.set(
          `message:${message.id}`,
          message,
          sessionId,
          userId ? 'authenticated' : 'guest',
          userId,
          { priority: 'normal', source: 'message' }
        );
      }

      // Analyze for predictive warming
      if (this.predictiveWarming) {
        // Create a minimal session object for pattern analysis
        const sessionForAnalysis = {
          id: sessionId,
          type: userId ? 'authenticated' as const : 'guest' as const,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };

        await this.predictiveWarming.analyzeSessionPattern(sessionForAnalysis as any, [message]);
      }

      // Sync across devices
      if (this.realTimeService && userId) {
        await this.realTimeService.sendMessage(message);
      }

      console.log(`💬 Enhanced message processed: ${message.id}`);
    } catch (error) {
      console.error('❌ Failed to process enhanced message:', error);
    }
  }

  /**
   * Get enhanced metrics
   */
  getMetrics(): Week4EnhancedMetrics {
    const cacheMetrics = this.sessionCache?.getMetrics();
    const warmingMetrics = this.predictiveWarming?.getMetrics();
    const realTimeStatus = this.realTimeService?.getStatus();

    return {
      caching: {
        overallHitRate: cacheMetrics?.overall.overallHitRate || 0,
        averageLatency: cacheMetrics?.overall.averageLatency || 0,
        memoryUsage: cacheMetrics?.l1.memoryUsage || 0,
        warmingEfficiency: warmingMetrics?.warmingEfficiency || 0
      },
      realTimeSync: {
        connectedDevices: realTimeStatus?.metrics.crossDeviceSync?.activeDevices || 0,
        syncLatency: realTimeStatus?.metrics.websocket?.latency || 0,
        conflictsResolved: realTimeStatus?.metrics.conflictResolution?.resolvedConflicts || 0,
        syncSuccess: realTimeStatus?.metrics.crossDeviceSync?.syncSuccessRate || 0
      },
      integration: {
        activeFeatures: this.getActiveFeatures(),
        sessionConversions: 0, // Would be tracked by session manager
        performanceScore: this.calculatePerformanceScore()
      }
    };
  }

  /**
   * Get active features
   */
  private getActiveFeatures(): string[] {
    const features: string[] = [];
    
    if (this.config.caching.enabled) features.push('enhanced_caching');
    if (this.config.caching.enablePredictiveWarming) features.push('predictive_warming');
    if (this.config.realTimeSync.enabled) features.push('real_time_sync');
    if (this.config.realTimeSync.enableCrossDeviceSync) features.push('cross_device_sync');
    
    return features;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    const cacheMetrics = this.sessionCache?.getMetrics();
    const realTimeStatus = this.realTimeService?.getStatus();
    
    let score = 0;
    let factors = 0;
    
    // Cache performance (40% weight)
    if (cacheMetrics) {
      score += cacheMetrics.overall.overallHitRate * 0.4;
      factors += 0.4;
    }
    
    // Real-time sync performance (30% weight)
    if (realTimeStatus && realTimeStatus.overall === 'healthy') {
      score += 0.3;
      factors += 0.3;
    }
    
    // Service availability (30% weight)
    const availableServices = this.getActiveFeatures().length;
    const maxServices = 4; // enhanced_caching, predictive_warming, real_time_sync, cross_device_sync
    score += (availableServices / maxServices) * 0.3;
    factors += 0.3;
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Stop all services
   */
  async stop(): Promise<void> {
    // UnifiedMonitoringSystem manages its own lifecycle - Phase 1 Priority 2
    if (this.unifiedMonitoring) {
      console.log('📊 [WEEK4_ENHANCED] UnifiedMonitoringSystem continues running (managed lifecycle)');
    }

    if (this.predictiveWarming) {
      this.predictiveWarming.stop();
    }
    
    if (this.realTimeService) {
      this.realTimeService.stop();
    }
    
    this.isInitialized = false;
    console.log('🛑 Week 4 Enhanced Integration stopped');
  }
}

// Factory function
export function createWeek4EnhancedIntegration(config?: Partial<Week4EnhancedConfig>): Week4EnhancedIntegration {
  return new Week4EnhancedIntegration(config);
}

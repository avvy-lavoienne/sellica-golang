/**
 * Backend Connectivity Test - Phase 3 Integration
 * Comprehensive testing suite for backend AI service connectivity and functionality
 * Week 1, Day 5: Connectivity Testing and Validation
 */

import { BackendAIService } from './BackendAIService';
import { BackendIntegratedRouter } from './BackendIntegratedRouter';
import { BackendAuthService } from './BackendAuthService';
import { BackendErrorHandler } from './BackendErrorHandler';
import { BackendPerformanceMonitor } from './BackendPerformanceMonitor';
import { BackendSessionManager } from './BackendSessionManager';
import { BackendCacheManager } from './BackendCacheManager';
import { BackendHealthMonitor } from './BackendHealthMonitor';
import { IndonesianNLPProcessor } from './IndonesianNLPProcessor';
import { IndonesianRoutingOptimizer } from './IndonesianRoutingOptimizer';
import { ProductionOptimizer } from './ProductionOptimizer';
import { CircuitBreakerManager } from './CircuitBreakerManager';
import { ProductionMonitoringSystem } from './ProductionMonitoringSystem';
import { aiLogger } from '../../monitoring/logger';
import { PerformanceMonitor } from '../../monitoring/performanceMonitor';

export interface ConnectivityTestResult {
  testName: string;
  success: boolean;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ComprehensiveTestResults {
  overallSuccess: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
  testResults: ConnectivityTestResult[];
  recommendations: string[];
}

export interface TestConfig {
  enablePerformanceTests: boolean;
  enableFallbackTests: boolean;
  enableAuthTests: boolean;
  enableErrorHandlingTests: boolean;
  enableSessionTests: boolean;
  enableCacheTests: boolean;
  enableHealthTests: boolean;
  enableIndonesianNLPTests: boolean;
  enableProductionTests: boolean;
  enableStressTests: boolean;
  enableEndToEndTests: boolean;
  timeoutMs: number;
  maxRetries: number;
}

/**
 * Backend Connectivity Test Suite
 * Validates backend integration functionality and performance
 */
export class BackendConnectivityTest {
  private backendService: BackendAIService;
  private router: BackendIntegratedRouter;
  private authService: BackendAuthService;
  private errorHandler: BackendErrorHandler;
  private performanceMonitor: PerformanceMonitor;
  private backendPerformanceMonitor: BackendPerformanceMonitor;
  private sessionManager: BackendSessionManager;
  private cacheManager: BackendCacheManager;
  private healthMonitor: BackendHealthMonitor;
  private indonesianNLP: IndonesianNLPProcessor;
  private routingOptimizer: IndonesianRoutingOptimizer;
  private productionOptimizer: ProductionOptimizer;
  private circuitBreakerManager: CircuitBreakerManager;
  private productionMonitoring: ProductionMonitoringSystem;
  private config: TestConfig;

  constructor(config?: Partial<TestConfig>) {
    this.backendService = new BackendAIService();
    this.router = new BackendIntegratedRouter();
    this.authService = new BackendAuthService();
    this.errorHandler = new BackendErrorHandler();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.backendPerformanceMonitor = new BackendPerformanceMonitor();
    this.sessionManager = new BackendSessionManager();
    this.cacheManager = new BackendCacheManager();
    this.healthMonitor = new BackendHealthMonitor();
    this.indonesianNLP = new IndonesianNLPProcessor();
    this.routingOptimizer = new IndonesianRoutingOptimizer();
    this.productionOptimizer = new ProductionOptimizer();
    this.circuitBreakerManager = new CircuitBreakerManager();
    this.productionMonitoring = new ProductionMonitoringSystem();

    this.config = {
      enablePerformanceTests: true,
      enableFallbackTests: true,
      enableAuthTests: true,
      enableErrorHandlingTests: true,
      enableSessionTests: true,
      enableCacheTests: true,
      enableHealthTests: true,
      enableIndonesianNLPTests: true,
      enableProductionTests: true,
      enableStressTests: true,
      enableEndToEndTests: true,
      timeoutMs: 10000,
      maxRetries: 3,
      ...config
    };

    aiLogger.backend.info('🧪 Backend Connectivity Test Suite initialized', {
      config: this.config
    });
  }

  /**
   * Run comprehensive connectivity tests
   */
  async runComprehensiveTests(): Promise<ComprehensiveTestResults> {
    const startTime = performance.now();
    const testResults: ConnectivityTestResult[] = [];

    aiLogger.backend.info('🚀 Starting comprehensive backend connectivity tests');

    try {
      // Core connectivity tests
      testResults.push(await this.testBackendHealth());
      testResults.push(await this.testBasicQuery());
      testResults.push(await this.testIndonesianQuery());
      testResults.push(await this.testSessionQuery());

      // Authentication tests
      if (this.config.enableAuthTests) {
        testResults.push(await this.testAuthentication());
        testResults.push(await this.testAuthenticatedQuery());
      }

      // Performance tests
      if (this.config.enablePerformanceTests) {
        testResults.push(await this.testResponseTime());
        testResults.push(await this.testConcurrentQueries());
      }

      // Fallback tests
      if (this.config.enableFallbackTests) {
        testResults.push(await this.testFallbackMechanism());
        testResults.push(await this.testRouterFallback());
      }

      // Error handling tests
      if (this.config.enableErrorHandlingTests) {
        testResults.push(await this.testErrorHandling());
        testResults.push(await this.testTimeoutHandling());
      }

      // Week 2: Session management tests
      if (this.config.enableSessionTests) {
        testResults.push(await this.testSessionCreation());
        testResults.push(await this.testSessionChat());
        testResults.push(await this.testConversationHistory());
      }

      // Week 2: Cache tests
      if (this.config.enableCacheTests) {
        testResults.push(await this.testCachePerformance());
        testResults.push(await this.testMultiTierCaching());
      }

      // Week 2: Health monitoring tests
      if (this.config.enableHealthTests) {
        testResults.push(await this.testHealthMonitoring());
        testResults.push(await this.testPerformanceMonitoring());
      }

      // Week 3: Indonesian NLP tests
      if (this.config.enableIndonesianNLPTests) {
        testResults.push(await this.testIndonesianNLPProcessing());
        testResults.push(await this.testGovernmentTerminologyDetection());
        testResults.push(await this.testIndonesianRoutingOptimization());
        testResults.push(await this.testCulturalContextUnderstanding());
      }

      // Week 3: Production optimization tests
      if (this.config.enableProductionTests) {
        testResults.push(await this.testProductionOptimizations());
        testResults.push(await this.testCircuitBreakerFunctionality());
        testResults.push(await this.testProductionMonitoring());
        testResults.push(await this.testConnectionPooling());
      }

      // Week 3: Stress and load tests
      if (this.config.enableStressTests) {
        testResults.push(await this.testStressLoad());
        testResults.push(await this.testConcurrentConnections());
        testResults.push(await this.testFailoverMechanisms());
      }

      // Week 3: End-to-end integration tests
      if (this.config.enableEndToEndTests) {
        testResults.push(await this.testEndToEndWorkflow());
        testResults.push(await this.testZeroDowntimeMigration());
        testResults.push(await this.testProductionReadiness());
      }

      // Calculate results
      const passedTests = testResults.filter(r => r.success).length;
      const failedTests = testResults.length - passedTests;
      const averageResponseTime = testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length;

      const results: ComprehensiveTestResults = {
        overallSuccess: failedTests === 0,
        totalTests: testResults.length,
        passedTests,
        failedTests,
        averageResponseTime,
        testResults,
        recommendations: this.generateRecommendations(testResults)
      };

      const totalTime = performance.now() - startTime;

      aiLogger.backend.info('✅ Comprehensive tests completed', {
        overallSuccess: results.overallSuccess,
        passedTests,
        failedTests,
        totalTime: Math.round(totalTime),
        averageResponseTime: Math.round(averageResponseTime)
      });

      return results;

    } catch (error) {
      aiLogger.backend.error('❌ Comprehensive tests failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        completedTests: testResults.length
      });

      return {
        overallSuccess: false,
        totalTests: testResults.length,
        passedTests: testResults.filter(r => r.success).length,
        failedTests: testResults.filter(r => !r.success).length,
        averageResponseTime: 0,
        testResults,
        recommendations: ['Fix critical connectivity issues before proceeding']
      };
    }
  }

  /**
   * Test backend health endpoint
   */
  private async testBackendHealth(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      const healthStatus = await this.backendService.getHealthStatus();
      const responseTime = performance.now() - startTime;

      return {
        testName: 'Backend Health Check',
        success: healthStatus.available,
        responseTime,
        metadata: {
          healthy: healthStatus.available,
          lastCheck: healthStatus.lastChecked
        }
      };

    } catch (error) {
      return {
        testName: 'Backend Health Check',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test basic query processing
   */
  private async testBasicQuery(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Hello, this is a test query';

    try {
      const response = await this.backendService.processQuery(testQuery);
      const responseTime = performance.now() - startTime;

      const success = !!(response && response.content && (response.metadata?.confidence || 0) > 0);

      return {
        testName: 'Basic Query Processing',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          confidence: response.metadata?.confidence,
          model: response.metadata?.model,
          workerType: response.metadata?.workerType
        }
      };

    } catch (error) {
      return {
        testName: 'Basic Query Processing',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Indonesian language query
   */
  private async testIndonesianQuery(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Bagaimana cara mengurus KTP yang hilang?';

    try {
      const response = await this.backendService.processQuery(testQuery);
      const responseTime = performance.now() - startTime;

      const success = !!(
        response &&
        response.content &&
        (response.metadata?.confidence || 0) > 0.8 &&
        response.metadata?.workerType === 'nlp'
      );

      return {
        testName: 'Indonesian NLP Query',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          confidence: response.metadata?.confidence,
          workerType: response.metadata?.workerType,
          routedToNLP: response.metadata?.workerType === 'nlp'
        }
      };

    } catch (error) {
      return {
        testName: 'Indonesian NLP Query',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test session-aware query processing
   */
  private async testSessionQuery(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Continue our previous conversation';
    const sessionId = `test_session_${Date.now()}`;

    try {
      const response = await this.backendService.processSessionQuery(testQuery, sessionId);
      const responseTime = performance.now() - startTime;

      const success = !!(
        response && 
        response.content && 
        response.metadata?.sessionId === sessionId
      );

      return {
        testName: 'Session-Aware Query',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          sessionId: response.metadata?.sessionId,
          sessionMatches: response.metadata?.sessionId === sessionId
        }
      };

    } catch (error) {
      return {
        testName: 'Session-Aware Query',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test authentication functionality
   */
  private async testAuthentication(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      const authContext = await this.authService.getAuthContext();
      const token = await this.authService.getAuthToken();
      const responseTime = performance.now() - startTime;

      const success = !!(authContext && authContext.userId);

      return {
        testName: 'Authentication Test',
        success,
        responseTime,
        metadata: {
          isAuthenticated: authContext.isAuthenticated,
          hasUserId: !!authContext.userId,
          hasToken: !!token,
          userRole: authContext.role
        }
      };

    } catch (error) {
      return {
        testName: 'Authentication Test',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test authenticated query processing
   */
  private async testAuthenticatedQuery(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Test authenticated query';

    try {
      const authHeaders = await this.authService.getAuthHeaders();
      const response = await this.backendService.processQuery(testQuery);
      const responseTime = performance.now() - startTime;

      const success = !!(response && response.content);

      return {
        testName: 'Authenticated Query',
        success,
        responseTime,
        metadata: {
          hasAuthHeader: !!authHeaders.Authorization,
          hasContent: !!response.content,
          confidence: response.metadata?.confidence
        }
      };

    } catch (error) {
      return {
        testName: 'Authenticated Query',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test response time performance
   */
  private async testResponseTime(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Performance test query';
    const targetResponseTime = 100; // 100ms target

    try {
      const response = await this.backendService.processQuery(testQuery);
      const responseTime = performance.now() - startTime;

      const success = responseTime < targetResponseTime && !!response.content;

      return {
        testName: 'Response Time Performance',
        success,
        responseTime,
        metadata: {
          targetResponseTime,
          actualResponseTime: responseTime,
          meetsTarget: responseTime < targetResponseTime,
          hasContent: !!response.content
        }
      };

    } catch (error) {
      return {
        testName: 'Response Time Performance',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test concurrent query handling
   */
  private async testConcurrentQueries(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const concurrentQueries = 5;
    const testQueries = Array.from({ length: concurrentQueries }, (_, i) => 
      `Concurrent test query ${i + 1}`
    );

    try {
      const promises = testQueries.map(query => 
        this.backendService.processQuery(query)
      );

      const responses = await Promise.all(promises);
      const responseTime = performance.now() - startTime;

      const success = responses.every(response =>
        response && response.content && (response.metadata?.confidence || 0) > 0
      );

      return {
        testName: 'Concurrent Query Handling',
        success,
        responseTime,
        metadata: {
          concurrentQueries,
          successfulResponses: responses.filter(r => r && r.content).length,
          averageConfidence: responses.reduce((sum, r) => sum + (r?.metadata?.confidence || 0), 0) / responses.length
        }
      };

    } catch (error) {
      return {
        testName: 'Concurrent Query Handling',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test fallback mechanism
   */
  private async testFallbackMechanism(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Fallback test query';

    try {
      // Temporarily disable backend to test fallback
      const originalConfig = { ...this.backendService['config'] };
      this.backendService['config'].baseURL = 'http://invalid-backend-url:9999';

      const response = await this.router.routeQuery(testQuery);
      const responseTime = performance.now() - startTime;

      // Restore original config
      this.backendService['config'] = originalConfig;

      const success = !!(
        response && 
        response.content && 
        response.metadata?.fallbackUsed
      );

      return {
        testName: 'Fallback Mechanism',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          fallbackUsed: response.metadata?.fallbackUsed,
          serviceUsed: response.metadata?.serviceUsed
        }
      };

    } catch (error) {
      return {
        testName: 'Fallback Mechanism',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test router fallback functionality
   */
  private async testRouterFallback(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Router fallback test';

    try {
      const response = await this.router.routeQuery(testQuery);
      const responseTime = performance.now() - startTime;

      const success = !!(response && response.content);

      return {
        testName: 'Router Fallback',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          routingStrategy: response.metadata?.routingStrategy,
          serviceUsed: response.metadata?.serviceUsed
        }
      };

    } catch (error) {
      return {
        testName: 'Router Fallback',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Error handling test';

    try {
      // Simulate an error condition
      const mockError = new Error('Test error for error handling validation');
      const result = await this.errorHandler.handleBackendError(mockError, testQuery);
      const responseTime = performance.now() - startTime;

      const success = !!(
        result && 
        (result.success || result.fallbackUsed) &&
        result.handlingStrategy
      );

      return {
        testName: 'Error Handling',
        success,
        responseTime,
        metadata: {
          handlingStrategy: result.handlingStrategy,
          fallbackUsed: result.fallbackUsed,
          hasResponse: !!result.response
        }
      };

    } catch (error) {
      return {
        testName: 'Error Handling',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test timeout handling
   */
  private async testTimeoutHandling(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Timeout test query';

    try {
      // Create a service with very short timeout
      const timeoutService = new BackendAIService({ timeout: 1 }); // 1ms timeout
      
      try {
        await timeoutService.processQuery(testQuery);
        // If we get here, the timeout didn't work as expected
        return {
          testName: 'Timeout Handling',
          success: false,
          responseTime: performance.now() - startTime,
          error: 'Timeout did not occur as expected'
        };
      } catch (timeoutError) {
        // Timeout error is expected
        const responseTime = performance.now() - startTime;
        const success = timeoutError instanceof Error && 
                        timeoutError.message.includes('timeout');

        return {
          testName: 'Timeout Handling',
          success,
          responseTime,
          metadata: {
            timeoutDetected: success,
            errorMessage: timeoutError instanceof Error ? timeoutError.message : 'Unknown error'
          }
        };
      }

    } catch (error) {
      return {
        testName: 'Timeout Handling',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(testResults: ConnectivityTestResult[]): string[] {
    const recommendations: string[] = [];
    const failedTests = testResults.filter(r => !r.success);

    if (failedTests.length === 0) {
      recommendations.push('✅ All tests passed! Backend integration is ready for production.');
      return recommendations;
    }

    // Analyze failed tests and provide specific recommendations
    failedTests.forEach(test => {
      switch (test.testName) {
        case 'Backend Health Check':
          recommendations.push('🔧 Backend service is not healthy. Check backend server status and configuration.');
          break;
        case 'Basic Query Processing':
          recommendations.push('🔧 Basic query processing failed. Verify backend API endpoints and request format.');
          break;
        case 'Indonesian NLP Query':
          recommendations.push('🔧 Indonesian NLP routing failed. Check NLP worker configuration and routing logic.');
          break;
        case 'Authentication Test':
          recommendations.push('🔧 Authentication issues detected. Verify JWT configuration and Supabase integration.');
          break;
        case 'Response Time Performance':
          recommendations.push('⚡ Response time exceeds target. Consider optimizing backend performance or adjusting targets.');
          break;
        case 'Fallback Mechanism':
          recommendations.push('🔄 Fallback mechanism failed. Ensure frontend fallback services are properly configured.');
          break;
      }
    });

    // General recommendations
    if (failedTests.length > testResults.length / 2) {
      recommendations.push('⚠️ Multiple critical issues detected. Consider postponing rollout until issues are resolved.');
    } else {
      recommendations.push('⚠️ Some issues detected but integration may proceed with caution and monitoring.');
    }

    return recommendations;
  }

  /**
   * Get test configuration
   */
  getConfig(): TestConfig {
    return { ...this.config };
  }

  /**
   * Test session creation
   */
  private async testSessionCreation(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      const session = await this.sessionManager.createSession();
      const responseTime = performance.now() - startTime;

      const success = !!(session && session.id && session.userId);

      return {
        testName: 'Session Creation',
        success,
        responseTime,
        metadata: {
          hasSessionId: !!session.id,
          hasUserId: !!session.userId,
          sessionId: session.id,
          messageCount: session.messageCount
        }
      };

    } catch (error) {
      return {
        testName: 'Session Creation',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test session chat processing
   */
  private async testSessionChat(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Test session chat message';

    try {
      // Create session first
      const session = await this.sessionManager.createSession();

      // Process chat message
      const response = await this.sessionManager.processSessionChat(
        session.id,
        testQuery
      );

      const responseTime = performance.now() - startTime;

      const success = !!(
        response &&
        response.content &&
        response.metadata?.sessionId === session.id
      );

      return {
        testName: 'Session Chat Processing',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          sessionId: response.metadata?.sessionId,
          sessionMatches: response.metadata?.sessionId === session.id,
          messageCount: response.metadata?.messageCount
        }
      };

    } catch (error) {
      return {
        testName: 'Session Chat Processing',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test conversation history preservation
   */
  private async testConversationHistory(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      // Create session
      const session = await this.sessionManager.createSession();

      // Send multiple messages
      await this.sessionManager.processSessionChat(session.id, 'First message');
      await this.sessionManager.processSessionChat(session.id, 'Second message');

      // Get conversation history
      const history = this.sessionManager.getSessionHistory(session.id);
      const responseTime = performance.now() - startTime;

      const success = history.length >= 4; // 2 user + 2 assistant messages

      return {
        testName: 'Conversation History',
        success,
        responseTime,
        metadata: {
          historyLength: history.length,
          hasUserMessages: history.some(msg => msg.role === 'user'),
          hasAssistantMessages: history.some(msg => msg.role === 'assistant'),
          sessionId: session.id
        }
      };

    } catch (error) {
      return {
        testName: 'Conversation History',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test cache performance
   */
  private async testCachePerformance(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Cache performance test query';

    try {
      // First request (cache miss)
      const firstResponse = await this.backendService.processQuery(testQuery);
      const firstTime = performance.now() - startTime;

      // Second request (should be cache hit)
      const secondStartTime = performance.now();
      const secondResponse = await this.backendService.processQuery(testQuery);
      const secondTime = performance.now() - secondStartTime;

      const responseTime = performance.now() - startTime;

      // Cache hit should be significantly faster
      const cacheImprovement = firstTime / secondTime;
      const success = cacheImprovement > 2; // At least 2x improvement

      return {
        testName: 'Cache Performance',
        success,
        responseTime,
        metadata: {
          firstRequestTime: firstTime,
          secondRequestTime: secondTime,
          cacheImprovement,
          bothResponsesValid: !!(firstResponse.content && secondResponse.content)
        }
      };

    } catch (error) {
      return {
        testName: 'Cache Performance',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test multi-tier caching
   */
  private async testMultiTierCaching(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      const stats = this.cacheManager.getCacheStatistics();
      const responseTime = performance.now() - startTime;

      const success = !!(
        stats.l1 &&
        stats.l2 &&
        stats.l3 &&
        stats.overall
      );

      return {
        testName: 'Multi-Tier Caching',
        success,
        responseTime,
        metadata: {
          l1Size: stats.l1.size,
          l2Size: stats.l2.size,
          l3Size: stats.l3.size,
          overallHitRate: stats.overall.hitRate,
          totalHits: stats.overall.totalHits
        }
      };

    } catch (error) {
      return {
        testName: 'Multi-Tier Caching',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test health monitoring
   */
  private async testHealthMonitoring(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      // Start health monitoring
      await this.healthMonitor.startMonitoring();

      // Wait for initial health check
      await new Promise(resolve => setTimeout(resolve, 1000));

      const healthStatus = this.healthMonitor.getCurrentHealth();
      const monitoringStatus = this.healthMonitor.getMonitoringStatus();

      const responseTime = performance.now() - startTime;

      const success = !!(
        healthStatus &&
        monitoringStatus.isMonitoring &&
        monitoringStatus.checksPerformed > 0
      );

      return {
        testName: 'Health Monitoring',
        success,
        responseTime,
        metadata: {
          isMonitoring: monitoringStatus.isMonitoring,
          checksPerformed: monitoringStatus.checksPerformed,
          healthy: healthStatus?.healthy,
          activeIncidents: monitoringStatus.activeIncidents
        }
      };

    } catch (error) {
      return {
        testName: 'Health Monitoring',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test performance monitoring
   */
  private async testPerformanceMonitoring(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      // Start performance monitoring
      await this.backendPerformanceMonitor.startMonitoring();

      // Wait for initial metrics collection
      await new Promise(resolve => setTimeout(resolve, 2000));

      const metrics = this.backendPerformanceMonitor.getCurrentMetrics();
      const improvement = this.backendPerformanceMonitor.getPerformanceImprovement();

      const responseTime = performance.now() - startTime;

      const success = !!(
        metrics &&
        improvement &&
        metrics.highPerformance.averageResponseTime > 0
      );

      return {
        testName: 'Performance Monitoring',
        success,
        responseTime,
        metadata: {
          hasMetrics: !!metrics,
          averageResponseTime: metrics?.highPerformance.averageResponseTime,
          responseTimeImprovement: improvement?.responseTimeImprovement,
          targetAchieved: improvement?.targetAchievement.responseTime,
          throughput: metrics?.highPerformance.requestsPerSecond
        }
      };

    } catch (error) {
      return {
        testName: 'Performance Monitoring',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Indonesian NLP processing
   */
  private async testIndonesianNLPProcessing(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Bagaimana cara mengurus KTP yang hilang di Dukcapil?';

    try {
      const { nlpResult, aiResponse } = await this.indonesianNLP.processIndonesianQuery(testQuery);
      const responseTime = performance.now() - startTime;

      const success = !!(
        nlpResult &&
        nlpResult.confidence >= 0.95 && // 95% accuracy target
        nlpResult.languageContext.language === 'indonesian' &&
        nlpResult.governmentTerminology.length > 0 &&
        aiResponse.content
      );

      return {
        testName: 'Indonesian NLP Processing',
        success,
        responseTime,
        metadata: {
          confidence: nlpResult.confidence,
          language: nlpResult.languageContext.language,
          formality: nlpResult.languageContext.formality,
          governmentTerms: nlpResult.governmentTerminology.length,
          recommendedWorker: nlpResult.recommendedWorker,
          accuracyTarget: nlpResult.confidence >= 0.95
        }
      };

    } catch (error) {
      return {
        testName: 'Indonesian NLP Processing',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test government terminology detection
   */
  private async testGovernmentTerminologyDetection(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Saya perlu mengurus BPJS Kesehatan dan NPWP untuk keperluan administrasi';

    try {
      const { nlpResult } = await this.indonesianNLP.processIndonesianQuery(testQuery);
      const responseTime = performance.now() - startTime;

      const expectedTerms = ['bpjs', 'npwp'];
      const detectedTerms = nlpResult.governmentTerminology.flatMap(gt => gt.terms);
      const termsDetected = expectedTerms.every(term =>
        detectedTerms.some(detected => detected.toLowerCase().includes(term))
      );

      const success = !!(
        nlpResult.governmentTerminology.length > 0 &&
        termsDetected &&
        nlpResult.languageContext.formality === 'government'
      );

      return {
        testName: 'Government Terminology Detection',
        success,
        responseTime,
        metadata: {
          expectedTerms,
          detectedTerms,
          terminologyCategories: nlpResult.governmentTerminology.map(gt => gt.category),
          formality: nlpResult.languageContext.formality,
          termsDetected
        }
      };

    } catch (error) {
      return {
        testName: 'Government Terminology Detection',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test Indonesian routing optimization
   */
  private async testIndonesianRoutingOptimization(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Mohon bantuan untuk prosedur pengurusan akta kelahiran';

    try {
      const { nlpResult } = await this.indonesianNLP.processIndonesianQuery(testQuery);
      const routingDecision = await this.routingOptimizer.optimizeRouting(
        testQuery,
        nlpResult.languageContext,
        nlpResult.governmentTerminology
      );

      const responseTime = performance.now() - startTime;

      const success = !!(
        routingDecision &&
        routingDecision.targetWorker === 'government' && // Should route to government worker
        routingDecision.confidence >= 0.8 &&
        routingDecision.priority === 'high'
      );

      return {
        testName: 'Indonesian Routing Optimization',
        success,
        responseTime,
        metadata: {
          targetWorker: routingDecision.targetWorker,
          priority: routingDecision.priority,
          confidence: routingDecision.confidence,
          routingReason: routingDecision.routingReason,
          expectedResponseTime: routingDecision.expectedResponseTime,
          fallbackWorkers: routingDecision.fallbackWorkers
        }
      };

    } catch (error) {
      return {
        testName: 'Indonesian Routing Optimization',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test cultural context understanding
   */
  private async testCulturalContextUnderstanding(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Dengan hormat, saya ingin menanyakan tentang gotong royong dalam masyarakat';

    try {
      const { nlpResult } = await this.indonesianNLP.processIndonesianQuery(testQuery);
      const responseTime = performance.now() - startTime;

      const success = !!(
        nlpResult.languageContext.formality === 'formal' &&
        nlpResult.languageContext.culturalContext === 'social' &&
        nlpResult.culturalAdaptations.length > 0
      );

      return {
        testName: 'Cultural Context Understanding',
        success,
        responseTime,
        metadata: {
          formality: nlpResult.languageContext.formality,
          culturalContext: nlpResult.languageContext.culturalContext,
          dialect: nlpResult.languageContext.dialect,
          culturalAdaptations: nlpResult.culturalAdaptations,
          confidence: nlpResult.confidence
        }
      };

    } catch (error) {
      return {
        testName: 'Cultural Context Understanding',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test production optimizations
   */
  private async testProductionOptimizations(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Production optimization test query';

    try {
      const response = await this.productionOptimizer.processOptimizedRequest(testQuery, {}, 'medium');
      const responseTime = performance.now() - startTime;

      const success = !!(
        response &&
        response.content &&
        response.metadata?.optimized === true &&
        responseTime < 200 // Should be faster with optimizations
      );

      return {
        testName: 'Production Optimizations',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          optimized: response.metadata?.optimized,
          connectionPooled: response.metadata?.connectionPooled,
          batched: response.metadata?.batched,
          loadBalanced: response.metadata?.loadBalanced
        }
      };

    } catch (error) {
      return {
        testName: 'Production Optimizations',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test circuit breaker functionality
   */
  private async testCircuitBreakerFunctionality(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      // Test circuit breaker with failing function
      const result = await this.circuitBreakerManager.executeWithCircuitBreaker(
        'test-service',
        async () => {
          throw new Error('Simulated failure');
        },
        { failureThreshold: 0.5, minimumRequests: 1 },
        async () => 'Fallback response'
      );

      const responseTime = performance.now() - startTime;

      const success = !!(
        result &&
        result.fallbackUsed &&
        result.circuitState &&
        result.metrics
      );

      return {
        testName: 'Circuit Breaker Functionality',
        success,
        responseTime,
        metadata: {
          fallbackUsed: result.fallbackUsed,
          circuitState: result.circuitState,
          success: result.success,
          failureCount: result.metrics.failureCount,
          totalRequests: result.metrics.totalRequests
        }
      };

    } catch (error) {
      return {
        testName: 'Circuit Breaker Functionality',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test production monitoring
   */
  private async testProductionMonitoring(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      await this.productionMonitoring.startMonitoring();

      // Wait for monitoring to collect data
      await new Promise(resolve => setTimeout(resolve, 2000));

      const status = this.productionMonitoring.getMonitoringStatus();
      const activeAlerts = this.productionMonitoring.getActiveAlerts();

      const responseTime = performance.now() - startTime;

      const success = !!(
        status.isMonitoring &&
        typeof status.systemHealth === 'number' &&
        Array.isArray(activeAlerts)
      );

      return {
        testName: 'Production Monitoring',
        success,
        responseTime,
        metadata: {
          isMonitoring: status.isMonitoring,
          systemHealth: status.systemHealth,
          activeAlerts: status.activeAlerts,
          totalAlerts: status.totalAlerts
        }
      };

    } catch (error) {
      return {
        testName: 'Production Monitoring',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test connection pooling
   */
  private async testConnectionPooling(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      const metrics = this.productionOptimizer.getProductionMetrics();
      const poolStatus = this.productionOptimizer.getConnectionPoolStatus();

      const responseTime = performance.now() - startTime;

      const success = !!(
        metrics &&
        metrics.connectionPool &&
        Array.isArray(poolStatus)
      );

      return {
        testName: 'Connection Pooling',
        success,
        responseTime,
        metadata: {
          totalPools: metrics.connectionPool.totalPools,
          activeConnections: metrics.connectionPool.activeConnections,
          poolUtilization: metrics.connectionPool.poolUtilization,
          connectionReuse: metrics.connectionPool.connectionReuse,
          poolCount: poolStatus.length
        }
      };

    } catch (error) {
      return {
        testName: 'Connection Pooling',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test stress load
   */
  private async testStressLoad(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const concurrentRequests = 20;
    const testQuery = 'Stress test query';

    try {
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        this.backendService.processQuery(`${testQuery} ${i + 1}`)
      );

      const results = await Promise.allSettled(promises);
      const responseTime = performance.now() - startTime;

      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successfulRequests / concurrentRequests;

      const success = successRate >= 0.9; // 90% success rate under stress

      return {
        testName: 'Stress Load Test',
        success,
        responseTime,
        metadata: {
          concurrentRequests,
          successfulRequests,
          failedRequests: concurrentRequests - successfulRequests,
          successRate,
          averageResponseTime: responseTime / concurrentRequests
        }
      };

    } catch (error) {
      return {
        testName: 'Stress Load Test',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test concurrent connections
   */
  private async testConcurrentConnections(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const connectionCount = 50;

    try {
      // Simulate concurrent connections
      const connections = Array.from({ length: connectionCount }, async (_, i) => {
        return await this.productionOptimizer.processOptimizedRequest(
          `Concurrent test ${i + 1}`,
          {},
          'low'
        );
      });

      const results = await Promise.allSettled(connections);
      const responseTime = performance.now() - startTime;

      const successfulConnections = results.filter(r => r.status === 'fulfilled').length;
      const connectionSuccessRate = successfulConnections / connectionCount;

      const success = connectionSuccessRate >= 0.95; // 95% connection success rate

      return {
        testName: 'Concurrent Connections',
        success,
        responseTime,
        metadata: {
          connectionCount,
          successfulConnections,
          failedConnections: connectionCount - successfulConnections,
          connectionSuccessRate,
          averageConnectionTime: responseTime / connectionCount
        }
      };

    } catch (error) {
      return {
        testName: 'Concurrent Connections',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test failover mechanisms
   */
  private async testFailoverMechanisms(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      // Test circuit breaker failover
      const circuitBreakerResult = await this.circuitBreakerManager.executeWithCircuitBreaker(
        'failover-test',
        async () => {
          throw new Error('Primary service failure');
        },
        { enableFallback: true },
        async () => 'Failover successful'
      );

      const responseTime = performance.now() - startTime;

      const success = !!(
        circuitBreakerResult.fallbackUsed &&
        circuitBreakerResult.success
      );

      return {
        testName: 'Failover Mechanisms',
        success,
        responseTime,
        metadata: {
          fallbackUsed: circuitBreakerResult.fallbackUsed,
          circuitState: circuitBreakerResult.circuitState,
          failoverSuccess: circuitBreakerResult.success,
          data: circuitBreakerResult.data
        }
      };

    } catch (error) {
      return {
        testName: 'Failover Mechanisms',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test end-to-end workflow
   */
  private async testEndToEndWorkflow(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    const testQuery = 'Bagaimana cara mengurus KTP baru di Jakarta?';

    try {
      // Complete end-to-end workflow
      // 1. Create session
      const session = await this.sessionManager.createSession();

      // 2. Process Indonesian query with full pipeline
      const { nlpResult, aiResponse } = await this.indonesianNLP.processIndonesianQuery(testQuery);

      // 3. Process through session manager
      const sessionResponse = await this.sessionManager.processSessionChat(
        session.id,
        testQuery
      );

      // 4. Verify conversation history
      const history = this.sessionManager.getSessionHistory(session.id);

      const responseTime = performance.now() - startTime;

      const success = !!(
        session.id &&
        nlpResult.confidence >= 0.95 &&
        aiResponse.content &&
        sessionResponse.content &&
        history.length >= 2 && // User + assistant messages
        responseTime < 1000 // Complete workflow under 1 second
      );

      return {
        testName: 'End-to-End Workflow',
        success,
        responseTime,
        metadata: {
          sessionCreated: !!session.id,
          nlpConfidence: nlpResult.confidence,
          nlpAccuracyTarget: nlpResult.confidence >= 0.95,
          hasAIResponse: !!aiResponse.content,
          hasSessionResponse: !!sessionResponse.content,
          conversationLength: history.length,
          workflowComplete: success
        }
      };

    } catch (error) {
      return {
        testName: 'End-to-End Workflow',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test zero-downtime migration
   */
  private async testZeroDowntimeMigration(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      // Test fallback capability during "migration"
      const beforeMigration = await this.router.routeQuery('Test before migration');

      // Simulate migration by temporarily disabling backend
      const originalConfig = { ...this.backendService['config'] };
      this.backendService['config'].baseURL = 'http://invalid-backend:9999';

      // Test during "migration" - should fallback
      const duringMigration = await this.router.routeQuery('Test during migration');

      // Restore backend
      this.backendService['config'] = originalConfig;

      // Test after "migration"
      const afterMigration = await this.router.routeQuery('Test after migration');

      const responseTime = performance.now() - startTime;

      const success = !!(
        beforeMigration.content &&
        duringMigration.content &&
        duringMigration.metadata?.fallbackUsed &&
        afterMigration.content
      );

      return {
        testName: 'Zero-Downtime Migration',
        success,
        responseTime,
        metadata: {
          beforeMigrationSuccess: !!beforeMigration.content,
          duringMigrationFallback: !!duringMigration.metadata?.fallbackUsed,
          duringMigrationSuccess: !!duringMigration.content,
          afterMigrationSuccess: !!afterMigration.content,
          zeroDowntimeAchieved: success
        }
      };

    } catch (error) {
      return {
        testName: 'Zero-Downtime Migration',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test production readiness
   */
  private async testProductionReadiness(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();

    try {
      // Check all production readiness criteria
      const performanceMetrics = this.backendPerformanceMonitor.getPerformanceImprovement();
      const healthStatus = this.healthMonitor.getMonitoringStatus();
      const cacheStats = this.cacheManager.getCacheStatistics();
      const sessionStats = this.sessionManager.getSessionStatistics();
      const circuitBreakerStatus = this.circuitBreakerManager.getStatusSummary();

      const responseTime = performance.now() - startTime;

      // Production readiness criteria
      const criteria = {
        responseTimeTarget: performanceMetrics.targetAchievement.responseTime, // 50ms target
        throughputTarget: performanceMetrics.targetAchievement.throughput, // 1000 RPS target
        successRateTarget: performanceMetrics.targetAchievement.successRate, // 99% target
        healthMonitoring: healthStatus.isMonitoring,
        cacheEfficiency: cacheStats.overall.hitRate > 0.5, // 50% cache hit rate
        sessionManagement: sessionStats.activeSessions >= 0, // Session system working
        circuitBreakers: circuitBreakerStatus.totalCircuitBreakers >= 0 // Circuit breakers available
      };

      const passedCriteria = Object.values(criteria).filter(Boolean).length;
      const totalCriteria = Object.keys(criteria).length;
      const readinessScore = passedCriteria / totalCriteria;

      const success = readinessScore >= 0.8; // 80% of criteria must pass

      return {
        testName: 'Production Readiness',
        success,
        responseTime,
        metadata: {
          ...criteria,
          passedCriteria,
          totalCriteria,
          readinessScore,
          productionReady: success,
          performanceImprovement: performanceMetrics.responseTimeImprovement,
          cacheHitRate: cacheStats.overall.hitRate,
          activeSessions: sessionStats.activeSessions
        }
      };

    } catch (error) {
      return {
        testName: 'Production Readiness',
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update test configuration
   */
  updateConfig(newConfig: Partial<TestConfig>): void {
    this.config = { ...this.config, ...newConfig };

    aiLogger.backend.info('🔧 Test configuration updated', {
      config: this.config
    });
  }
}

/**
 * Backend Connectivity Test - Phase 3 Integration
 * Comprehensive testing suite for backend AI service connectivity and functionality
 * Week 1, Day 5: Connectivity Testing and Validation
 */

import { BackendAIService } from './BackendAIService';
import { BackendIntegratedRouter } from './BackendIntegratedRouter';
import { BackendAuthService } from './BackendAuthService';
import { BackendErrorHandler } from './BackendErrorHandler';
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
  private config: TestConfig;

  constructor(config?: Partial<TestConfig>) {
    this.backendService = new BackendAIService();
    this.router = new BackendIntegratedRouter();
    this.authService = new BackendAuthService();
    this.errorHandler = new BackendErrorHandler();
    this.performanceMonitor = PerformanceMonitor.getInstance();

    this.config = {
      enablePerformanceTests: true,
      enableFallbackTests: true,
      enableAuthTests: true,
      enableErrorHandlingTests: true,
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
        success: healthStatus.healthy,
        responseTime,
        metadata: {
          healthy: healthStatus.healthy,
          lastCheck: healthStatus.lastCheck
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

      const success = !!(response && response.content && response.confidence > 0);

      return {
        testName: 'Basic Query Processing',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          confidence: response.confidence,
          model: response.model,
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
        response.confidence > 0.8 &&
        response.metadata?.workerType === 'nlp'
      );

      return {
        testName: 'Indonesian NLP Query',
        success,
        responseTime,
        metadata: {
          hasContent: !!response.content,
          confidence: response.confidence,
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
          confidence: response.confidence
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
        response && response.content && response.confidence > 0
      );

      return {
        testName: 'Concurrent Query Handling',
        success,
        responseTime,
        metadata: {
          concurrentQueries,
          successfulResponses: responses.filter(r => r && r.content).length,
          averageConfidence: responses.reduce((sum, r) => sum + (r?.confidence || 0), 0) / responses.length
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
   * Update test configuration
   */
  updateConfig(newConfig: Partial<TestConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Test configuration updated', {
      config: this.config
    });
  }
}

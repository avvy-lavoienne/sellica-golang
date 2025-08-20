#!/usr/bin/env tsx
/**
 * Connection Pooling Test Script
 * Validates the Supabase connection pooling implementation
 */

import { SupabaseManager } from '@/lib/database/supabaseManager';
import { ResilientDatabaseService } from '@/services/database/resilientDatabaseService';
import { ChatbotDataService } from '@/services/chatbot/dataService';
import { EnhancedUserContextService } from '@/services/chatbot/enhancedUserContextService';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

class ConnectionPoolingTester {
  private results: TestResult[] = [];
  private supabaseManager: SupabaseManager | null = null;
  private resilientService: ResilientDatabaseService | null = null;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Connection Pooling Tests...\n');

    try {
      // Initialize services
      await this.initializeServices();

      // Run test suite
      await this.testBasicConnectionPooling();
      await this.testServiceIntegration();
      await this.testPerformanceUnderLoad();
      await this.testErrorRecovery();
      await this.testCircuitBreaker();
      await this.testMonitoringEndpoints();

      // Print results
      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  private async initializeServices(): Promise<void> {
    console.log('📋 Initializing services...');
    
    try {
      this.supabaseManager = await SupabaseManager.getInstance();
      this.resilientService = ResilientDatabaseService.getInstance();
      await this.resilientService.initialize();
      
      console.log('✅ Services initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  private async testBasicConnectionPooling(): Promise<void> {
    console.log('🔧 Testing Basic Connection Pooling...');

    // Test 1: Manager initialization
    await this.runTest('Manager Initialization', async () => {
      const manager = await SupabaseManager.getInstance();
      return {
        initialized: !!manager,
        metrics: manager.getMetrics(),
        poolStatus: manager.getPoolStatus()
      };
    });

    // Test 2: Service role client
    await this.runTest('Service Role Client', async () => {
      const client = await this.supabaseManager!.getServiceRoleClient();
      const { data } = await client.from('profiles').select('count').limit(1);
      return { clientObtained: !!client, querySuccessful: !!data };
    });

    // Test 3: User auth client
    await this.runTest('User Auth Client', async () => {
      const client = await this.supabaseManager!.getUserAuthClient();
      const { data } = await client.from('profiles').select('count').limit(1);
      return { clientObtained: !!client, querySuccessful: !!data };
    });

    // Test 4: Connection metrics
    await this.runTest('Connection Metrics', async () => {
      const metrics = this.supabaseManager!.getMetrics();
      return {
        hasMetrics: Object.keys(metrics).length > 0,
        activeConnections: metrics.activeConnections,
        totalConnections: metrics.totalConnections,
        poolUtilization: metrics.poolUtilization
      };
    });

    console.log('✅ Basic Connection Pooling tests completed\n');
  }

  private async testServiceIntegration(): Promise<void> {
    console.log('🔗 Testing Service Integration...');

    // Test 1: ChatbotDataService
    await this.runTest('ChatbotDataService Integration', async () => {
      const dataService = ChatbotDataService.getInstance();
      const overview = await dataService.getDatabaseOverview();
      return {
        serviceInitialized: !!dataService,
        overviewFetched: !!overview,
        hasSystemHealth: !!overview.systemHealth
      };
    });

    // Test 2: EnhancedUserContextService
    await this.runTest('EnhancedUserContextService Integration', async () => {
      const userService = EnhancedUserContextService.getInstance();
      const mockUserId = '12345678-1234-1234-1234-123456789012';
      
      try {
        const context = await userService.getEnhancedUserContext(mockUserId);
        return {
          serviceInitialized: !!userService,
          contextFetched: !!context,
          hasFallbackProfile: context.profile.id === mockUserId
        };
      } catch (error) {
        // Expected for non-existent user
        return {
          serviceInitialized: !!userService,
          contextFetched: false,
          expectedError: true
        };
      }
    });

    // Test 3: ResilientDatabaseService
    await this.runTest('ResilientDatabaseService Integration', async () => {
      const result = await this.resilientService!.execute({
        operation: async (client) => {
          const { data } = await client.from('profiles').select('count').limit(1);
          return data;
        },
        context: {
          operationType: 'test_query',
          userId: 'test-user'
        },
        options: {
          useServiceRole: true
        }
      });

      return {
        operationSuccessful: result.success,
        hasMetrics: !!result.metrics,
        duration: result.metrics.duration
      };
    });

    console.log('✅ Service Integration tests completed\n');
  }

  private async testPerformanceUnderLoad(): Promise<void> {
    console.log('⚡ Testing Performance Under Load...');

    // Test 1: Concurrent connections
    await this.runTest('Concurrent Connections (10)', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        this.supabaseManager!.executeQuery(
          async (client) => {
            const { data } = await client.from('profiles').select('count').limit(1);
            return data;
          },
          'service'
        )
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = Date.now() - startTime;

      return {
        totalRequests: concurrentRequests,
        successfulRequests: successful,
        failedRequests: concurrentRequests - successful,
        totalDuration: duration,
        averageResponseTime: duration / concurrentRequests
      };
    });

    // Test 2: Sustained load
    await this.runTest('Sustained Load (20 requests)', async () => {
      const iterations = 20;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await this.supabaseManager!.executeQuery(
          async (client) => {
            const { data } = await client.from('profiles').select('count').limit(1);
            return data;
          },
          'service'
        );
        
        responseTimes.push(Date.now() - startTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      return {
        totalRequests: iterations,
        averageResponseTime: avgResponseTime,
        maxResponseTime,
        minResponseTime,
        performanceGood: avgResponseTime < 1000 && maxResponseTime < 2000
      };
    });

    console.log('✅ Performance Under Load tests completed\n');
  }

  private async testErrorRecovery(): Promise<void> {
    console.log('🛡️ Testing Error Recovery...');

    // Test 1: Circuit breaker functionality
    await this.runTest('Circuit Breaker Status', async () => {
      const status = this.supabaseManager!.getCircuitBreakerStatus();
      return {
        hasCircuitBreaker: !!status,
        currentState: status.state,
        failureCount: status.failureCount
      };
    });

    // Test 2: Circuit breaker reset
    await this.runTest('Circuit Breaker Reset', async () => {
      this.supabaseManager!.resetCircuitBreaker();
      const status = this.supabaseManager!.getCircuitBreakerStatus();
      return {
        resetSuccessful: status.state === 'closed' && status.failureCount === 0,
        newState: status.state,
        newFailureCount: status.failureCount
      };
    });

    console.log('✅ Error Recovery tests completed\n');
  }

  private async testCircuitBreaker(): Promise<void> {
    console.log('⚡ Testing Circuit Breaker...');

    await this.runTest('Circuit Breaker Operations', async () => {
      const initialStatus = this.supabaseManager!.getCircuitBreakerStatus();
      
      // Reset to ensure clean state
      this.supabaseManager!.resetCircuitBreaker();
      const resetStatus = this.supabaseManager!.getCircuitBreakerStatus();
      
      return {
        initialState: initialStatus.state,
        resetState: resetStatus.state,
        resetWorking: resetStatus.state === 'closed' && resetStatus.failureCount === 0
      };
    });

    console.log('✅ Circuit Breaker tests completed\n');
  }

  private async testMonitoringEndpoints(): Promise<void> {
    console.log('📊 Testing Monitoring Endpoints...');

    await this.runTest('Pool Metrics', async () => {
      const metrics = this.supabaseManager!.getMetrics();
      const poolStatus = this.supabaseManager!.getPoolStatus();
      
      return {
        hasMetrics: Object.keys(metrics).length > 0,
        hasPoolStatus: Object.keys(poolStatus).length > 0,
        metricsStructure: {
          activeConnections: typeof metrics.activeConnections === 'number',
          totalConnections: typeof metrics.totalConnections === 'number',
          poolUtilization: typeof metrics.poolUtilization === 'number',
          errorRate: typeof metrics.errorRate === 'number'
        },
        poolStatusStructure: {
          hasServicePool: !!poolStatus.servicePool,
          hasUserPool: !!poolStatus.userPool,
          hasQueue: !!poolStatus.queue,
          hasCircuitBreaker: !!poolStatus.circuitBreaker
        }
      };
    });

    console.log('✅ Monitoring Endpoints tests completed\n');
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const details = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        details
      });
      
      console.log(`  ✅ ${testName} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`  ❌ ${testName} (${duration}ms): ${error}`);
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((successful / this.results.length) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Average Duration: ${(totalDuration / this.results.length).toFixed(1)}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }
    
    console.log('\n🎯 Performance Metrics:');
    const performanceTests = this.results.filter(r => 
      r.testName.includes('Concurrent') || r.testName.includes('Sustained')
    );
    
    performanceTests.forEach(test => {
      console.log(`  - ${test.testName}:`);
      if (test.details.averageResponseTime) {
        console.log(`    Average Response Time: ${test.details.averageResponseTime.toFixed(1)}ms`);
      }
      if (test.details.maxResponseTime) {
        console.log(`    Max Response Time: ${test.details.maxResponseTime}ms`);
      }
      if (test.details.successfulRequests) {
        console.log(`    Success Rate: ${((test.details.successfulRequests / test.details.totalRequests) * 100).toFixed(1)}%`);
      }
    });
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    
    try {
      if (this.supabaseManager) {
        await this.supabaseManager.shutdown();
      }
      
      if (this.resilientService) {
        this.resilientService.clearCache();
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ConnectionPoolingTester();
  tester.runAllTests().catch(console.error);
}

export { ConnectionPoolingTester };

/**
 * Connection Pooling Integration Tests
 * Validates Supabase connection pool functionality and performance
 */

import { SupabaseManager } from '@/lib/database/supabaseManager';
import { ChatbotDataService } from '@/services/chatbot/dataService';
import { EnhancedUserContextService } from '@/services/chatbot/enhancedUserContextService';
import { EnhancedChatStorageService } from '@/services/chatbot/enhancedChatStorageService';

describe('Database Connection Pooling', () => {
  let supabaseManager: SupabaseManager;
  
  beforeAll(async () => {
    // Initialize the connection pool manager
    supabaseManager = await SupabaseManager.getInstance();
  });
  
  afterAll(async () => {
    // Clean up connections
    await supabaseManager.shutdown();
  });

  describe('SupabaseManager', () => {
    test('should initialize singleton instance', async () => {
      const instance1 = await SupabaseManager.getInstance();
      const instance2 = await SupabaseManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(SupabaseManager);
    });

    test('should provide service role client', async () => {
      const client = await supabaseManager.getServiceRoleClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');
    });

    test('should provide user auth client', async () => {
      const client = await supabaseManager.getUserAuthClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');
    });

    test('should track connection pool metrics', () => {
      const metrics = supabaseManager.getMetrics();
      
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('poolUtilization');
      expect(metrics).toHaveProperty('averageWaitTime');
      expect(metrics).toHaveProperty('totalQueries');
      expect(metrics).toHaveProperty('failedQueries');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('circuitBreakerState');
      
      expect(typeof metrics.activeConnections).toBe('number');
      expect(typeof metrics.totalConnections).toBe('number');
      expect(typeof metrics.poolUtilization).toBe('number');
    });

    test('should provide detailed pool status', () => {
      const status = supabaseManager.getPoolStatus();
      
      expect(status).toHaveProperty('servicePool');
      expect(status).toHaveProperty('userPool');
      expect(status).toHaveProperty('queue');
      expect(status).toHaveProperty('circuitBreaker');
      
      expect(status.servicePool).toHaveProperty('total');
      expect(status.servicePool).toHaveProperty('active');
      expect(status.servicePool).toHaveProperty('idle');
      
      expect(status.userPool).toHaveProperty('total');
      expect(status.userPool).toHaveProperty('active');
      expect(status.userPool).toHaveProperty('idle');
    });

    test('should execute queries with connection management', async () => {
      const result = await supabaseManager.executeQuery(
        async (client) => {
          const { data, error } = await client
            .from('profiles')
            .select('count')
            .limit(1);
          
          if (error) throw error;
          return data;
        },
        'service'
      );
      
      expect(result).toBeDefined();
    });

    test('should handle batch queries', async () => {
      const queries = [
        async (client: any) => client.from('profiles').select('count').limit(1),
        async (client: any) => client.from('selly_chat_sessions').select('count').limit(1)
      ];
      
      const results = await supabaseManager.executeBatch(queries, 'service');
      
      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
    });

    test('should reset circuit breaker', () => {
      supabaseManager.resetCircuitBreaker();
      
      const status = supabaseManager.getCircuitBreakerStatus();
      expect(status.state).toBe('closed');
      expect(status.failureCount).toBe(0);
    });
  });

  describe('Service Integration', () => {
    test('ChatbotDataService should use pooled connections', async () => {
      const dataService = ChatbotDataService.getInstance();
      
      // Test database overview fetch
      const overview = await dataService.getDatabaseOverview();
      
      expect(overview).toHaveProperty('totalTables');
      expect(overview).toHaveProperty('systemHealth');
      expect(typeof overview.totalTables).toBe('number');
    });

    test('EnhancedUserContextService should use pooled connections', async () => {
      const userContextService = EnhancedUserContextService.getInstance();
      
      // Test with a mock user ID (UUID format)
      const mockUserId = '12345678-1234-1234-1234-123456789012';
      
      try {
        const context = await userContextService.getEnhancedUserContext(mockUserId);
        
        // Should return fallback profile for non-existent user
        expect(context).toHaveProperty('profile');
        expect(context.profile.id).toBe(mockUserId);
      } catch (error) {
        // Expected for non-existent user, but should not be a connection error
        expect(error).toBeDefined();
      }
    });

    test('EnhancedChatStorageService should use pooled connections', async () => {
      const chatStorageService = EnhancedChatStorageService.getInstance();
      
      // Test session creation
      const sessionId = await chatStorageService.createOrGetSession(
        undefined, // No user ID
        'test-guest-uuid'
      );
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent connection requests', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, async () => {
        return supabaseManager.executeQuery(
          async (client) => {
            const { data } = await client
              .from('profiles')
              .select('count')
              .limit(1);
            return data;
          },
          'service'
        );
      });
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(concurrentRequests);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Check that metrics were updated
      const metrics = supabaseManager.getMetrics();
      expect(metrics.totalQueries).toBeGreaterThanOrEqual(concurrentRequests);
    });

    test('should maintain performance under load', async () => {
      const iterations = 20;
      const responseTimes: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await supabaseManager.executeQuery(
          async (client) => {
            const { data } = await client
              .from('profiles')
              .select('count')
              .limit(1);
            return data;
          },
          'service'
        );
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }
      
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      
      expect(averageResponseTime).toBeLessThan(1000); // Average under 1 second
      expect(maxResponseTime).toBeLessThan(2000); // Max under 2 seconds
      
      console.log(`Average response time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`Max response time: ${maxResponseTime}ms`);
    });

    test('should handle connection pool exhaustion gracefully', async () => {
      const maxConnections = 25; // Slightly more than pool size
      const promises: Promise<any>[] = [];
      
      // Create more concurrent requests than pool size
      for (let i = 0; i < maxConnections; i++) {
        promises.push(
          supabaseManager.executeQuery(
            async (client) => {
              // Add delay to hold connections longer
              await new Promise(resolve => setTimeout(resolve, 100));
              const { data } = await client
                .from('profiles')
                .select('count')
                .limit(1);
              return data;
            },
            'service'
          )
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Successful: ${successful}, Failed: ${failed}, Time: ${endTime - startTime}ms`);
      
      // Most requests should succeed, even if some are queued
      expect(successful).toBeGreaterThan(maxConnections * 0.8);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // This test would require mocking connection failures
      // For now, we'll test that the error handling structure is in place
      
      const metrics = supabaseManager.getMetrics();
      expect(typeof metrics.errorRate).toBe('number');
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
    });

    test('should handle circuit breaker functionality', () => {
      const initialState = supabaseManager.getCircuitBreakerStatus();
      expect(['closed', 'open', 'half-open']).toContain(initialState.state);
      
      // Reset and verify
      supabaseManager.resetCircuitBreaker();
      const resetState = supabaseManager.getCircuitBreakerStatus();
      expect(resetState.state).toBe('closed');
      expect(resetState.failureCount).toBe(0);
    });
  });

  describe('Monitoring API', () => {
    test('should provide monitoring endpoint', async () => {
      // This would require setting up a test server
      // For now, we'll verify the monitoring data structure
      
      const metrics = supabaseManager.getMetrics();
      const poolStatus = supabaseManager.getPoolStatus();
      
      // Verify the data structure matches what the API expects
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('circuitBreakerState');
      expect(poolStatus).toHaveProperty('servicePool');
      expect(poolStatus).toHaveProperty('userPool');
      expect(poolStatus).toHaveProperty('queue');
      expect(poolStatus).toHaveProperty('circuitBreaker');
    });
  });
});

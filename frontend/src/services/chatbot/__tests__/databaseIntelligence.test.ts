/**
 * Comprehensive Test Suite for Database Intelligence
 * Tests schema understanding, query optimization, and data validation
 */

import { ChatbotDataService } from '../dataService';
import { schemaLoader } from '../schemaLoader';
import { cacheService } from '../cacheService';

// Mock external dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
}));

jest.mock('../cacheService');

const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('Database Intelligence', () => {
  let dataService: ChatbotDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    dataService = ChatbotDataService.getInstance();

    // Setup cache service mocks
    mockCacheService.getOrSet.mockImplementation(async (key, fetchFn) => {
      return await fetchFn();
    });
    mockCacheService.generateKey.mockImplementation((prefix, params) => {
      return `${prefix}_${JSON.stringify(params)}`;
    });
  });

  describe('Schema Understanding and Table Relationships', () => {
    test('should load table schema correctly', () => {
      const schema = schemaLoader.getTableSchema('pengajuan_bulanan');

      expect(schema).toBeTruthy();
      expect(schema?.tableName).toBe('pengajuan_bulanan');
      expect(schema?.columns).toBeTruthy();
      expect(schema?.columns.length).toBeGreaterThan(0);
    });

    test('should provide available table names', () => {
      const tableNames = schemaLoader.getTableNames();

      expect(tableNames).toBeTruthy();
      expect(Array.isArray(tableNames)).toBe(true);
      expect(tableNames.length).toBeGreaterThan(0);

      // Should include core tables
      expect(tableNames).toContain('pengajuan_bulanan');
      expect(tableNames).toContain('salah_rekam');
      expect(tableNames).toContain('adjudicate_record');
    });

    test('should get all schemas', () => {
      const allSchemas = schemaLoader.getAllSchemas();

      expect(allSchemas).toBeTruthy();
      expect(allSchemas instanceof Map).toBe(true);
      expect(allSchemas.size).toBeGreaterThan(0);
    });

    test('should provide schema statistics', () => {
      const stats = schemaLoader.getStats();

      expect(stats).toBeTruthy();
      expect(stats.tableCount).toBeGreaterThan(0);
      expect(stats.columnCount).toBeGreaterThan(0);
      expect(stats.relationshipCount).toBeGreaterThanOrEqual(0);
    });

    test('should check if schema is ready', () => {
      const isReady = schemaLoader.isReady();
      expect(typeof isReady).toBe('boolean');
    });

    test('should handle non-existent table gracefully', () => {
      const schema = schemaLoader.getTableSchema('non_existent_table');
      expect(schema).toBeNull();
    });
  });

  describe('Data Service Integration', () => {
    test('should get database overview', async () => {
      const overview = await dataService.getDatabaseOverview();

      expect(overview).toBeTruthy();
      expect(overview.totalTables).toBeGreaterThan(0);
      expect(overview.tables).toBeTruthy();
      expect(Array.isArray(overview.tables)).toBe(true);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    test('should get user statistics', async () => {
      const userStats = await dataService.getUserStatistics();

      expect(userStats).toBeTruthy();
      expect(typeof userStats.totalUsers).toBe('number');
      expect(typeof userStats.activeUsers).toBe('number');
      expect(typeof userStats.pendingUsers).toBe('number');
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    test('should search data with query string', async () => {
      const searchResults = await dataService.searchData('pengajuan', 10);

      expect(searchResults).toBeTruthy();
      expect(Array.isArray(searchResults)).toBe(true);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    test('should get recent activities count', async () => {
      const count = await dataService.getRecentActivitiesCount();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should test database connectivity', async () => {
      const connectivity = await dataService.testDatabaseConnectivity();

      expect(connectivity).toBeTruthy();
      expect(typeof connectivity.success).toBe('boolean');
      expect(connectivity.results).toBeTruthy();
      expect(connectivity.summary).toBeTruthy();
    });

    test('should handle temporal queries with actual method', async () => {
      const temporalQuery = {
        queryType: 'temporal_aggregation' as const,
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          type: 'absolute' as const
        },
        conditions: []
      };

      const result = await dataService.getTemporalData('pengajuan_bulanan', temporalQuery);

      expect(Array.isArray(result)).toBe(true);
    });

    test('should get individual records', async () => {
      const result = await dataService.getIndividualRecord('pengajuan_bulanan', 'nik', '1234567890');

      // Result can be null if no record found, which is valid
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('Cache Service Integration', () => {
    test('should use cache service for data operations', async () => {
      // Test that cache service is being called
      await dataService.getDatabaseOverview();
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    test('should generate cache keys correctly', () => {
      const key = mockCacheService.generateKey('test', { param: 'value' });
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    test('should handle cache operations', async () => {
      // Mock cache get/set operations
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(undefined);

      await dataService.getUserStatistics();

      // Verify cache operations were attempted
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('Data Service Performance', () => {
    test('should handle multiple concurrent requests', async () => {
      const promises = [
        dataService.getDatabaseOverview(),
        dataService.getUserStatistics(),
        dataService.getRecentActivitiesCount()
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toBeTruthy(); // Database overview
      expect(results[1]).toBeTruthy(); // User statistics
      expect(typeof results[2]).toBe('number'); // Activities count
    });

    test('should execute custom queries safely', async () => {
      const result = await dataService.executeCustomQuery('SELECT COUNT(*) FROM profiles');

      expect(result).toBeTruthy();
      expect(typeof result.success).toBe('boolean');
      expect(result.data).toBeTruthy();
    });

    test('should handle search operations efficiently', async () => {
      const startTime = performance.now();

      const results = await dataService.searchData('test', 5);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(Array.isArray(results)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with schema loader', () => {
      const tableNames = schemaLoader.getTableNames();
      expect(tableNames.length).toBeGreaterThan(0);

      // Test that data service can work with schema information
      const firstTable = tableNames[0];
      const schema = schemaLoader.getTableSchema(firstTable);
      expect(schema).toBeTruthy();
    });

    test('should handle error scenarios gracefully', async () => {
      // Test with non-existent table
      const result = await dataService.searchData('non_existent_query', 1);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should maintain performance under load', async () => {
      const startTime = performance.now();

      // Execute multiple operations concurrently
      const operations = [
        dataService.getDatabaseOverview(),
        dataService.getUserStatistics(),
        dataService.getRecentActivitiesCount(),
        dataService.searchData('test', 5),
        dataService.testDatabaseConnectivity()
      ];

      const results = await Promise.all(operations);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all operations completed successfully
      expect(results[0]).toBeTruthy(); // Database overview
      expect(results[1]).toBeTruthy(); // User statistics
      expect(typeof results[2]).toBe('number'); // Activities count
      expect(Array.isArray(results[3])).toBe(true); // Search results
      expect(results[4]).toBeTruthy(); // Connectivity test
      expect((results[4] as any).success).toBeDefined(); // Connectivity test success
    });

    test('should handle cache service integration properly', async () => {
      // Clear mock call history
      jest.clearAllMocks();

      // Perform operations that should use cache
      await dataService.getDatabaseOverview();
      await dataService.getUserStatistics();

      // Verify cache service was used
      expect(mockCacheService.getOrSet).toHaveBeenCalledTimes(2);
    });
  });
});

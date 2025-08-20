/**
 * Enhanced Query Intelligence Tests
 * Testing schema-aware query processing and insight generation
 */

// Mock Supabase to avoid ES module issues
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
}));

import { enhancedQueryIntelligence } from '../enhancedQueryIntelligence';
import { schemaIntelligence, insightEngine } from '../schemaIntelligence';

// Mock the data service
jest.mock('../dataService', () => ({
  chatbotDataService: {
    getTableSummary: jest.fn().mockResolvedValue({
      displayName: 'Aktivitas User',
      description: 'Data aktivitas pengguna sistem',
      totalCount: 150,
      completedCount: 120,
      pendingCount: 30,
      recentCount: 25,
      lastUpdated: new Date().toISOString()
    }),
    getDatabaseOverview: jest.fn().mockResolvedValue({
      totalTables: 9,
      totalRecords: 1250,
      totalUsers: 45,
      recentActivities: 25,
      systemHealth: 'excellent'
    }),
    searchData: jest.fn().mockResolvedValue([
      { id: 1, name: 'Test User', nik: '1234567890' },
      { id: 2, name: 'Another User', nik: '0987654321' }
    ])
  }
}));

describe('Enhanced Query Intelligence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Intelligence Integration', () => {
    test('should get table schema information', () => {
      const schema = schemaIntelligence.getTableSchema('aktivitas_user');
      
      expect(schema).toBeDefined();
      expect(schema?.tableName).toBe('aktivitas_user');
      expect(schema?.displayName).toBe('Aktivitas Pengguna');
      expect(schema?.columns).toBeDefined();
      expect(schema?.columns.length).toBeGreaterThan(0);
      expect(schema?.relationships).toBeDefined();
      expect(schema?.primaryAnalytics).toBeDefined();
    });

    test('should suggest relevant columns for analysis', () => {
      const columns = schemaIntelligence.suggestColumns('aktivitas_user', 'trend waktu');
      
      expect(columns).toBeDefined();
      expect(columns.length).toBeGreaterThan(0);
      
      // Should suggest temporal columns for trend analysis
      const temporalColumns = columns.filter(col => col.statisticalType === 'temporal');
      expect(temporalColumns.length).toBeGreaterThan(0);
    });

    test('should validate statistical functions for column types', () => {
      expect(schemaIntelligence.validateStatisticalFunction('count', 'string')).toBe(true);
      expect(schemaIntelligence.validateStatisticalFunction('average', 'number')).toBe(true);
      expect(schemaIntelligence.validateStatisticalFunction('average', 'string')).toBe(false);
      expect(schemaIntelligence.validateStatisticalFunction('time_series', 'date')).toBe(true);
    });

    test('should infer table joins for cross-table analysis', () => {
      const joins = schemaIntelligence.inferTableJoins(['profiles', 'aktivitas_user']);
      
      expect(joins).toBeDefined();
      expect(joins.length).toBeGreaterThan(0);
      
      const profileJoin = joins.find(join => 
        join.targetTable === 'profiles' || join.targetTable === 'aktivitas_user'
      );
      expect(profileJoin).toBeDefined();
    });
  });

  describe('Insight Generation Engine', () => {
    test('should generate proactive insight suggestions', () => {
      const suggestions = insightEngine.generateInsights(
        'berapa aktivitas user hari ini?',
        ['aktivitas_user']
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);

      // Should include different types of insights
      const insightTypes = suggestions.map((s: any) => s.type);
      expect(insightTypes).toContain('trend');
      expect(insightTypes).toContain('drill_down');
    });

    test('should analyze trends in data', () => {
      const mockData = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 12 },
        { date: '2024-01-03', value: 15 },
        { date: '2024-01-04', value: 18 },
        { date: '2024-01-05', value: 20 }
      ];

      const trendAnalysis = insightEngine.analyzeTrends(mockData, 'daily');
      
      expect(trendAnalysis).toBeDefined();
      expect(trendAnalysis.direction).toBe('increasing');
      expect(trendAnalysis.strength).toBeGreaterThan(0.8);
      expect(trendAnalysis.insights).toBeDefined();
      expect(trendAnalysis.insights.length).toBeGreaterThan(0);
    });

    test('should detect anomalies in data', () => {
      const mockData = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 12 },
        { date: '2024-01-03', value: 50 }, // Anomaly
        { date: '2024-01-04', value: 11 },
        { date: '2024-01-05', value: 13 },
        { date: '2024-01-06', value: 2 }  // Anomaly
      ];

      const anomalyReport = insightEngine.detectAnomalies(mockData);
      
      expect(anomalyReport).toBeDefined();
      expect(anomalyReport.anomalies).toBeDefined();
      expect(anomalyReport.anomalies.length).toBeGreaterThan(0);
      expect(anomalyReport.summary).toContain('anomali');
      expect(anomalyReport.recommendations).toBeDefined();
      expect(anomalyReport.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Query Processing', () => {
    test('should process simple statistical query', async () => {
      const result = await enhancedQueryIntelligence.processEnhancedQuery(
        'berapa total aktivitas user?'
      );
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.schemaInsights).toBeDefined();
      expect(result.proactiveInsights).toBeDefined();
      expect(result.followUpQuestions).toBeDefined();
    });

    test('should provide schema insights', async () => {
      const result = await enhancedQueryIntelligence.processEnhancedQuery(
        'statistik aktivitas user'
      );
      
      expect(result.schemaInsights).toBeDefined();
      expect(result.schemaInsights.suggestedColumns).toBeDefined();
      expect(result.schemaInsights.availableAnalytics).toBeDefined();
      expect(result.schemaInsights.tableRelationships).toBeDefined();
      expect(result.schemaInsights.dataQualityNotes).toBeDefined();
    });

    test('should generate proactive insights', async () => {
      const result = await enhancedQueryIntelligence.processEnhancedQuery(
        'aktivitas user hari ini'
      );
      
      expect(result.proactiveInsights).toBeDefined();
      expect(result.proactiveInsights.length).toBeGreaterThan(0);
      
      const insight = result.proactiveInsights[0];
      expect(insight.type).toBeDefined();
      expect(insight.title).toBeDefined();
      expect(insight.description).toBeDefined();
      expect(insight.query).toBeDefined();
      expect(insight.confidence).toBeGreaterThan(0);
    });

    test('should provide contextual follow-up questions', async () => {
      const result = await enhancedQueryIntelligence.processEnhancedQuery(
        'berapa pengajuan pending?'
      );
      
      expect(result.followUpQuestions).toBeDefined();
      expect(result.followUpQuestions.length).toBeGreaterThan(0);
      
      // Should include relevant follow-ups
      const followUps = result.followUpQuestions.join(' ').toLowerCase();
      expect(followUps).toMatch(/trend|detail|analisis|breakdown/);
    });

    test('should handle search queries with schema awareness', async () => {
      const result = await enhancedQueryIntelligence.processEnhancedQuery(
        'cari user dengan nama test'
      );
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.schemaInsights).toBeDefined();
      expect(result.proactiveInsights).toBeDefined();
    });

    test('should provide query optimization suggestions', async () => {
      const result = await enhancedQueryIntelligence.processEnhancedQuery(
        'berapa aktivitas hari ini?'
      );
      
      expect(result.queryOptimizations).toBeDefined();
      expect(result.queryOptimizations.length).toBeGreaterThan(0);
      
      // Should suggest improvements
      const optimizations = result.queryOptimizations.join(' ').toLowerCase();
      expect(optimizations).toMatch(/spesifik|rentang|agregasi|tabel/);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid table names gracefully', async () => {
      const result = await enhancedQueryIntelligence.processEnhancedQuery(
        'statistik tabel_tidak_ada'
      );
      
      expect(result).toBeDefined();
      expect(result.schemaInsights).toBeDefined();
      expect(result.proactiveInsights).toBeDefined();
      expect(result.followUpQuestions).toBeDefined();
    });

    test('should provide helpful error messages', async () => {
      // Mock an error in data service
      const mockError = new Error('Database connection failed');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // This should not throw but return an error result
      const result = await enhancedQueryIntelligence.processEnhancedQuery(
        'test error query'
      );
      
      expect(result).toBeDefined();
      expect(result.followUpQuestions).toContain('Coba dengan query yang lebih spesifik');
    });
  });

  describe('Performance', () => {
    test('should process queries within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await enhancedQueryIntelligence.processEnhancedQuery(
        'analisis lengkap aktivitas user dengan trend dan anomali'
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should complete within 2 seconds
      expect(processingTime).toBeLessThan(2000);
    });

    test('should handle multiple concurrent queries', async () => {
      const queries = [
        'berapa aktivitas user?',
        'statistik pengajuan',
        'trend dokumentasi',
        'anomali data sistem'
      ];
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        queries.map(query => enhancedQueryIntelligence.processEnhancedQuery(query))
      );
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.schemaInsights).toBeDefined();
      });
      
      // Should handle concurrent queries efficiently
      expect(totalTime).toBeLessThan(5000);
    });
  });
});

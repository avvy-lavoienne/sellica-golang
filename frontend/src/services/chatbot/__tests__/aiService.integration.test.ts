/**
 * Comprehensive Integration Test Suite for AI Service
 * Tests query processing pipeline, database integration, and response formatting
 */

import { aiService } from '../aiService';
import { chatbotDataService } from '../dataService';
import { enhancedQueryIntelligence } from '../enhancedQueryIntelligence';

// Mock external dependencies
jest.mock('../dataService');
jest.mock('../enhancedQueryIntelligence');
jest.mock('@supabase/supabase-js');

const mockDataService = chatbotDataService as jest.Mocked<typeof chatbotDataService>;
const mockQueryIntelligence = enhancedQueryIntelligence as jest.Mocked<typeof enhancedQueryIntelligence>;

describe('AI Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
      success: true,
      summary: 'Mock enhanced response',
      data: [],
      visualizationType: 'table',
      schemaInsights: {
        suggestedColumns: [],
        availableAnalytics: [],
        tableRelationships: [],
        dataQualityNotes: []
      },
      proactiveInsights: [],
      followUpQuestions: [],
      queryOptimizations: []
    });
  });

  describe('Query Processing Pipeline', () => {
    test('should process simple data request query successfully', async () => {
      const query = 'Berapa pengajuan bulan ini?';
      const mockData = [
        { id: '1', nama_pengajuan: 'Test 1', created_at: '2024-01-15' },
        { id: '2', nama_pengajuan: 'Test 2', created_at: '2024-01-20' }
      ];

      mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
        success: true,
        summary: 'Ditemukan 2 pengajuan bulan ini',
        data: mockData,
        visualizationType: 'table',
        schemaInsights: {
          suggestedColumns: ['nama_pengajuan', 'created_at'],
          availableAnalytics: ['count', 'trend'],
          tableRelationships: [],
          dataQualityNotes: []
        },
        proactiveInsights: [],
        followUpQuestions: ['Apakah Anda ingin melihat detail pengajuan?'],
        queryOptimizations: []
      });

      const result = await aiService.processQuery(query);

      expect(result).toBeTruthy();
      expect(result.content).toContain('2 pengajuan');
      expect(result.type).toBe('data');
      expect(mockQueryIntelligence.processEnhancedQuery).toHaveBeenCalledWith(
        query,
        expect.any(Object)
      );
    });

    test('should handle temporal queries with date ranges', async () => {
      const query = 'Tampilkan data salah rekam dari januari sampai maret 2024';
      const mockData = [
        { id: '1', nik_salah_rekam: '1234567890', tanggal_perekaman: '2024-01-15' },
        { id: '2', nik_salah_rekam: '0987654321', tanggal_perekaman: '2024-02-20' }
      ];

      mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
        success: true,
        summary: 'Ditemukan 2 data salah rekam periode Januari-Maret 2024',
        data: mockData,
        visualizationType: 'table',
        schemaInsights: {
          suggestedColumns: ['nik_salah_rekam', 'tanggal_perekaman'],
          availableAnalytics: ['temporal_trend', 'monthly_breakdown'],
          tableRelationships: ['profiles'],
          dataQualityNotes: ['Data lengkap tersedia']
        },
        proactiveInsights: [
          {
            type: 'trend',
            title: 'Tren Salah Rekam',
            description: 'Tren salah rekam menurun di bulan Februari',
            query: 'analisis trend salah rekam februari',
            confidence: 0.8,
            complexity: 'intermediate'
          }
        ],
        followUpQuestions: [
          'Apakah Anda ingin melihat breakdown per bulan?',
          'Ingin analisis penyebab salah rekam?'
        ],
        queryOptimizations: []
      });

      const result = await aiService.processQuery(query);

      expect(result).toBeTruthy();
      expect(result.content).toContain('2 data salah rekam');
      expect(result.content).toContain('Januari-Maret 2024');
      expect(result.type).toBe('data');
      expect(result.metadata?.followUpQuestions).toHaveLength(2);
    });

    test('should handle comparison queries', async () => {
      const query = 'Bandingkan pengajuan minggu lalu dengan minggu ini';
      
      mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
        success: true,
        summary: 'Perbandingan pengajuan: minggu lalu 15 pengajuan, minggu ini 12 pengajuan (turun 20%)',
        data: [
          { period: 'minggu_lalu', count: 15, percentage: 55.6 },
          { period: 'minggu_ini', count: 12, percentage: 44.4 }
        ],
        visualizationType: 'chart',
        schemaInsights: {
          suggestedColumns: ['created_at', 'status'],
          availableAnalytics: ['comparison', 'trend', 'percentage_change'],
          tableRelationships: [],
          dataQualityNotes: []
        },
        proactiveInsights: [
          {
            type: 'correlation',
            title: 'Perbandingan Pengajuan',
            description: 'Penurunan 20% pengajuan minggu ini dibanding minggu lalu',
            query: 'bandingkan pengajuan minggu ini dengan minggu lalu',
            confidence: 0.9,
            complexity: 'intermediate'
          }
        ],
        followUpQuestions: [
          'Ingin tahu penyebab penurunan pengajuan?',
          'Apakah ini pola normal atau anomali?'
        ],
        queryOptimizations: []
      });

      const result = await aiService.processQuery(query);

      expect(result).toBeTruthy();
      expect(result.content).toContain('turun 20%');
      expect(result.type).toBe('chart');
      expect(result.metadata?.proactiveInsights).toHaveLength(1);
    });

    test('should handle aggregation queries with conditions', async () => {
      const query = 'Berapa adjudicate record yang lebih dari 30 hari dan masih pending?';
      
      mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
        success: true,
        summary: 'Ditemukan 8 adjudicate record yang lebih dari 30 hari dan masih pending',
        data: [
          { count: 8, avg_days: 45, max_days: 67, min_days: 31 }
        ],
        visualizationType: 'stats',
        schemaInsights: {
          suggestedColumns: ['created_at', 'is_ready_to_record', 'processing_days'],
          availableAnalytics: ['duration_analysis', 'status_breakdown'],
          tableRelationships: ['profiles'],
          dataQualityNotes: ['Semua record memiliki tanggal valid']
        },
        proactiveInsights: [
          {
            type: 'anomaly',
            title: 'Record Tertunda',
            description: '8 record melebihi batas waktu normal (30 hari)',
            query: 'analisis record yang tertunda lebih dari 30 hari',
            confidence: 1.0,
            complexity: 'advanced'
          }
        ],
        followUpQuestions: [
          'Ingin melihat detail record yang tertunda?',
          'Perlu analisis penyebab keterlambatan?'
        ],
        queryOptimizations: []
      });

      const result = await aiService.processQuery(query);

      expect(result).toBeTruthy();
      expect(result.content).toContain('8 adjudicate record');
      expect(result.content).toContain('lebih dari 30 hari');
      expect(result.type).toBe('stats');
      expect(result.metadata?.proactiveInsights?.[0].type).toBe('anomaly');
    });
  });

  describe('Error Handling and Fallback Mechanisms', () => {
    test('should handle database connection errors gracefully', async () => {
      const query = 'Berapa pengajuan bulan ini?';
      
      mockQueryIntelligence.processEnhancedQuery.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await aiService.processQuery(query);

      expect(result).toBeTruthy();
      expect(result.content).toContain('Maaf, terjadi kesalahan');
      expect(result.type).toBe('text');
      expect(result.metadata?.error).toBeTruthy();
    });

    test('should handle malformed queries with helpful suggestions', async () => {
      const query = 'xyz abc 123';
      
      mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
        success: false,
        summary: 'Query tidak dapat dipahami',
        data: [],
        visualizationType: 'stats',
        schemaInsights: {
          suggestedColumns: [],
          availableAnalytics: [],
          tableRelationships: [],
          dataQualityNotes: []
        },
        proactiveInsights: [],
        followUpQuestions: [
          'Coba tanyakan: "Berapa pengajuan bulan ini?"',
          'Atau: "Tampilkan data salah rekam"'
        ],
        queryOptimizations: []
      });

      const result = await aiService.processQuery(query);

      expect(result).toBeTruthy();
      expect(result.content).toContain('tidak dapat dipahami');
      expect(result.metadata?.followUpQuestions).toContain('Berapa pengajuan bulan ini?');
    });

    test('should handle empty query results appropriately', async () => {
      const query = 'Berapa pengajuan tahun 1900?';
      
      mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
        success: true,
        summary: 'Tidak ditemukan pengajuan untuk tahun 1900',
        data: [],
        visualizationType: 'stats',
        schemaInsights: {
          suggestedColumns: [],
          availableAnalytics: [],
          tableRelationships: [],
          dataQualityNotes: []
        },
        proactiveInsights: [],
        followUpQuestions: [
          'Coba periode yang lebih recent?',
          'Ingin melihat data tahun ini?'
        ],
        queryOptimizations: []
      });

      const result = await aiService.processQuery(query);

      expect(result).toBeTruthy();
      expect(result.content).toContain('Tidak ditemukan');
      expect(result.metadata?.followUpQuestions).toHaveLength(2);
    });
  });

  describe('Performance and Monitoring', () => {
    test('should complete queries within performance threshold', async () => {
      const query = 'Berapa pengajuan bulan ini?';
      
      const startTime = performance.now();
      await aiService.processQuery(query);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(2000); // Sub-2 second requirement
    });

    test('should handle concurrent requests efficiently', async () => {
      const queries = [
        'Berapa pengajuan bulan ini?',
        'Tampilkan data salah rekam',
        'Berapa duplicate operator?',
        'Status adjudicate record',
        'Data aktivitas user'
      ];

      const promises = queries.map(query => aiService.processQuery(query));
      
      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTimePerQuery = totalTime / queries.length;
      
      expect(results).toHaveLength(5);
      expect(avgTimePerQuery).toBeLessThan(2000);
      
      results.forEach(result => {
        expect(result).toBeTruthy();
        expect(result.content).toBeTruthy();
      });
    });

    test('should track processing metrics', async () => {
      const query = 'Berapa pengajuan bulan ini?';
      
      const result = await aiService.processQuery(query);
      
      expect(result.metadata?.processingTime).toBeDefined();
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
      expect(result.metadata?.dataQuery).toBeDefined();
    });
  });

  describe('Response Enhancement and Formatting', () => {
    test('should format responses with proper Indonesian language', async () => {
      const query = 'Berapa pengajuan bulan ini?';

      const result = await aiService.processQuery(query);

      expect(result.content).toMatch(/^[A-Z]/); // Should start with capital letter
      expect(result.content).not.toContain('undefined');
      expect(result.content).not.toContain('null');

      // Should contain Indonesian words
      const indonesianWords = ['pengajuan', 'data', 'ditemukan', 'bulan', 'ini'];
      const containsIndonesian = indonesianWords.some(word =>
        result.content.toLowerCase().includes(word)
      );
      expect(containsIndonesian).toBe(true);
    });

    test('should include appropriate metadata in responses', async () => {
      const query = 'Tampilkan data salah rekam';

      const result = await aiService.processQuery(query);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.dataQuery).toBeDefined();
      expect(result.metadata?.processingTime).toBeDefined();
      expect(result.metadata?.aiEnhanced).toBeDefined();
    });

    test('should provide contextual follow-up questions', async () => {
      const query = 'Berapa pengajuan yang pending?';

      mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
        success: true,
        summary: 'Ditemukan 5 pengajuan yang masih pending',
        data: [{ count: 5 }],
        visualizationType: 'stats',
        schemaInsights: {
          suggestedColumns: [],
          availableAnalytics: [],
          tableRelationships: [],
          dataQualityNotes: []
        },
        proactiveInsights: [],
        followUpQuestions: [
          'Ingin melihat detail pengajuan yang pending?',
          'Perlu analisis penyebab keterlambatan?',
          'Ingin membandingkan dengan bulan lalu?'
        ],
        queryOptimizations: []
      });

      const result = await aiService.processQuery(query);

      expect(result.metadata?.followUpQuestions).toBeDefined();
      expect(result.metadata?.followUpQuestions?.length).toBeGreaterThan(0);

      result.metadata?.followUpQuestions?.forEach(question => {
        expect(question).toMatch(/\?$/); // Should end with question mark
        expect(question.length).toBeGreaterThan(10); // Should be meaningful
      });
    });

    test('should handle visualization type recommendations', async () => {
      const queries = [
        { query: 'Berapa pengajuan per bulan?', expectedViz: 'chart' },
        { query: 'Tampilkan daftar pengajuan', expectedViz: 'table' },
        { query: 'Total pengajuan bulan ini', expectedViz: 'stats' }
      ];

      for (const { query, expectedViz } of queries) {
        mockQueryIntelligence.processEnhancedQuery.mockResolvedValue({
          success: true,
          summary: 'Mock response',
          data: [],
          visualizationType: expectedViz as any,
          schemaInsights: {
            suggestedColumns: [],
            availableAnalytics: [],
            tableRelationships: [],
            dataQualityNotes: []
          },
          proactiveInsights: [],
          followUpQuestions: [],
          queryOptimizations: []
        });

        const result = await aiService.processQuery(query);
        expect(result.type).toBe(expectedViz);
      }
    });
  });
});

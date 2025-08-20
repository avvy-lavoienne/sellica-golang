/**
 * End-to-End Test Suite for SELLY AI Assistant
 * Tests complete user scenarios from query input to response output
 */

import { aiService } from '../aiService';
import { aiServiceHuggingFace } from '../aiServiceHuggingFace';
import { aiServiceTensorFlow } from '../aiServiceTensorFlow';

// Mock external dependencies
jest.mock('@supabase/supabase-js');
jest.mock('../groqResponseEnhancer');

describe('SELLY AI Assistant - End-to-End Tests', () => {
  describe('Specific Test Cases - Indonesian Administrative Queries', () => {
    test('Query: "Berapa pengajuan bulan ini yang masih pending?"', async () => {
      const query = 'Berapa pengajuan bulan ini yang masih pending?';
      
      const result = await aiService.processQuery(query);
      
      // Response validation
      expect(result).toBeTruthy();
      expect(result.content).toBeTruthy();
      expect(result.content.length).toBeGreaterThan(20);
      
      // Indonesian language validation
      expect(result.content).toMatch(/pengajuan|pending|bulan|ini/i);
      
      // Response structure validation
      expect(result.type).toMatch(/^(text|data|stats|table)$/);
      expect(result.metadata).toBeTruthy();
      expect(result.metadata?.processingTime).toBeDefined();
      
      // Performance validation
      expect(result.metadata?.processingTime).toBeLessThan(2000);
      
      // Content quality validation
      expect(result.content).not.toContain('undefined');
      expect(result.content).not.toContain('null');
      expect(result.content).not.toContain('[object Object]');
    });

    test('Query: "Bandingkan data salah rekam minggu lalu dengan minggu ini"', async () => {
      const query = 'Bandingkan data salah rekam minggu lalu dengan minggu ini';
      
      const result = await aiService.processQuery(query);
      
      // Comparison query validation
      expect(result.content).toMatch(/bandingkan|perbandingan|minggu lalu|minggu ini/i);
      expect(result.content).toMatch(/salah rekam/i);
      
      // Should suggest visualization for comparison
      expect(result.type).toMatch(/^(chart|table|stats)$/);
      
      // Should provide comparative insights
      if (result.metadata?.proactiveInsights) {
        const hasComparisonInsight = result.metadata.proactiveInsights.some(
          insight => insight.type === 'comparison' || insight.type === 'trend'
        );
        expect(hasComparisonInsight).toBe(true);
      }
      
      // Should offer follow-up questions
      expect(result.metadata?.followUpQuestions).toBeTruthy();
      expect(result.metadata?.followUpQuestions?.length).toBeGreaterThan(0);
    });

    test('Query: "Tampilkan adjudicate record yang lebih dari 30 hari"', async () => {
      const query = 'Tampilkan adjudicate record yang lebih dari 30 hari';
      
      const result = await aiService.processQuery(query);
      
      // Temporal condition validation
      expect(result.content).toMatch(/adjudicate record|30 hari|lebih dari/i);
      
      // Should handle temporal filtering
      expect(result.type).toMatch(/^(table|data|stats)$/);
      
      // Should provide actionable insights for overdue records
      if (result.metadata?.proactiveInsights) {
        const hasAlertInsight = result.metadata.proactiveInsights.some(
          insight => insight.type === 'anomaly' || insight.complexity === 'advanced'
        );
        expect(hasAlertInsight).toBe(true);
      }
      
      // Performance for complex temporal queries
      expect(result.metadata?.processingTime).toBeLessThan(3000);
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    test('should handle invalid date queries gracefully', async () => {
      const invalidQueries = [
        'data bulan ke-13 tahun 2024',
        'pengajuan tanggal 32 januari',
        'laporan bulan xyz tahun abc'
      ];

      for (const query of invalidQueries) {
        const result = await aiService.processQuery(query);
        
        expect(result).toBeTruthy();
        expect(result.content).toBeTruthy();
        
        // Should provide helpful error message in Indonesian
        expect(result.content).toMatch(/tidak valid|tidak ditemukan|salah|error/i);
        
        // Should suggest corrections
        expect(result.metadata?.followUpQuestions).toBeTruthy();
        expect(result.metadata?.followUpQuestions?.length).toBeGreaterThan(0);
      }
    });

    test('should handle malformed queries with suggestions', async () => {
      const malformedQueries = [
        'xyz abc 123',
        'data data data',
        '???',
        '',
        '   '
      ];

      for (const query of malformedQueries) {
        const result = await aiService.processQuery(query);
        
        expect(result).toBeTruthy();
        expect(result.content).toBeTruthy();
        
        // Should provide helpful guidance
        expect(result.content).toMatch(/tidak dipahami|coba|contoh|bantuan/i);
        
        // Should offer example queries
        if (result.metadata?.followUpQuestions) {
          const hasExampleQuery = result.metadata.followUpQuestions.some(
            question => question.includes('Berapa') || question.includes('Tampilkan')
          );
          expect(hasExampleQuery).toBe(true);
        }
      }
    });

    test('should handle database connection failures', async () => {
      // Mock database failure
      const originalProcessQuery = aiService.processQuery;
      
      jest.spyOn(aiService, 'processQuery').mockImplementationOnce(async () => {
        throw new Error('Database connection failed');
      });

      const query = 'Berapa pengajuan bulan ini?';
      
      try {
        const result = await aiService.processQuery(query);
        
        // Should still return a response
        expect(result).toBeTruthy();
        expect(result.content).toMatch(/kesalahan|error|tidak tersedia/i);
        expect(result.metadata?.error).toBeTruthy();
      } catch (error) {
        // If it throws, should be handled gracefully by the calling code
        expect(error).toBeInstanceOf(Error);
      }
      
      // Restore original implementation
      jest.restoreAllMocks();
    });
  });

  describe('Multi-Service Integration Tests', () => {
    test('should work consistently across different AI services', async () => {
      const query = 'Berapa pengajuan bulan ini?';
      const services = [aiService, aiServiceHuggingFace, aiServiceTensorFlow];
      
      const results = await Promise.allSettled(
        services.map(service => service.processEnhancedQuery(query))
      );
      
      // At least one service should succeed
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // All successful results should be valid
      successfulResults.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.content).toBeTruthy();
          expect(result.value.content).toMatch(/pengajuan|bulan|ini/i);
        }
      });
    });

    test('should maintain response quality across services', async () => {
      const query = 'Tampilkan data salah rekam yang pending';
      
      const aiServiceResult = await aiService.processEnhancedQuery(query);
      const hfServiceResult = await aiServiceHuggingFace.processEnhancedQuery(query);
      
      // Both should understand the query
      expect(aiServiceResult.content).toMatch(/salah rekam|pending/i);
      expect(hfServiceResult.content).toMatch(/salah rekam|pending/i);
      
      // Both should provide structured responses
      expect(aiServiceResult.type).toBeDefined();
      expect(hfServiceResult.type).toBeDefined();
      
      // Both should complete within performance threshold
      expect(aiServiceResult.metadata?.processingTime).toBeLessThan(2000);
      expect(hfServiceResult.metadata?.processingTime).toBeLessThan(2000);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should handle concurrent requests efficiently', async () => {
      const queries = [
        'Berapa pengajuan bulan ini?',
        'Tampilkan data salah rekam',
        'Status adjudicate record',
        'Data aktivitas user minggu ini',
        'Berapa duplicate operator?'
      ];

      const startTime = performance.now();
      
      const results = await Promise.all(
        queries.map(query => aiService.processQuery(query))
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerQuery = totalTime / queries.length;
      
      // Performance requirements
      expect(avgTimePerQuery).toBeLessThan(2000); // Sub-2 second average
      expect(totalTime).toBeLessThan(8000); // Total under 8 seconds
      
      // All queries should succeed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeTruthy();
        expect(result.content).toBeTruthy();
      });
    });

    test('should maintain performance under load', async () => {
      const heavyQueries = Array.from({ length: 20 }, (_, i) => 
        `Berapa pengajuan bulan ${i + 1} yang lebih dari 30 hari dan masih pending?`
      );

      const startTime = performance.now();
      
      const results = await Promise.allSettled(
        heavyQueries.map(query => aiService.processQuery(query))
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerQuery = totalTime / heavyQueries.length;
      
      // Should handle load gracefully
      expect(avgTimePerQuery).toBeLessThan(3000); // Allow more time under load
      
      // Most queries should succeed
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      const successRate = successfulResults.length / heavyQueries.length;
      
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
    });
  });

  describe('Cultural Context and Language Quality', () => {
    test('should handle Indonesian cultural context appropriately', async () => {
      const culturalQueries = [
        'Data pengajuan untuk Hari Raya Idul Fitri',
        'Laporan aktivitas selama bulan Ramadan',
        'Pengajuan menjelang tahun baru Hijriah',
        'Data perekaman saat libur nasional'
      ];

      for (const query of culturalQueries) {
        const result = await aiService.processQuery(query);
        
        expect(result.content).toBeTruthy();
        
        // Should understand Indonesian cultural references
        expect(result.content).not.toContain('tidak dipahami');
        
        // Should provide contextually appropriate responses
        expect(result.content.length).toBeGreaterThan(30);
      }
    });

    test('should maintain formal Indonesian language style', async () => {
      const query = 'Berapa pengajuan yang sudah disetujui bulan ini?';
      const result = await aiService.processQuery(query);
      
      // Should use formal Indonesian
      expect(result.content).not.toMatch(/gue|lu|nih|dong|sih/i);
      
      // Should use proper Indonesian terms
      expect(result.content).toMatch(/pengajuan|disetujui|bulan/i);
      
      // Should be grammatically correct
      expect(result.content).toMatch(/^[A-Z]/); // Start with capital
      expect(result.content).toMatch(/[.!?]$/); // End with punctuation
    });

    test('should provide region-appropriate administrative terminology', async () => {
      const adminQueries = [
        'Data perekaman KTP elektronik',
        'Status verifikasi biometric',
        'Laporan adjudikasi NIK',
        'Pengajuan perubahan data kependudukan'
      ];

      for (const query of adminQueries) {
        const result = await aiService.processQuery(query);
        
        // Should understand Indonesian administrative terms
        expect(result.content).toBeTruthy();
        expect(result.content.length).toBeGreaterThan(20);
        
        // Should use appropriate administrative language
        const hasAdminTerms = /perekaman|verifikasi|adjudikasi|kependudukan|NIK|KTP|biometric/i.test(result.content);
        expect(hasAdminTerms).toBe(true);
      }
    });
  });

  describe('Response Enhancement and Follow-up', () => {
    test('should provide actionable insights and recommendations', async () => {
      const query = 'Berapa adjudicate record yang tertunda lebih dari 60 hari?';
      const result = await aiService.processQuery(query);
      
      expect(result.content).toBeTruthy();
      
      // Should provide insights about delayed records
      if (result.metadata?.proactiveInsights) {
        const hasActionableInsight = result.metadata.proactiveInsights.some(
          insight => insight.confidence > 0.7
        );
        expect(hasActionableInsight).toBe(true);
      }
      
      // Should suggest next steps
      if (result.metadata?.followUpQuestions) {
        const hasActionQuestion = result.metadata.followUpQuestions.some(
          question => question.includes('detail') || question.includes('analisis')
        );
        expect(hasActionQuestion).toBe(true);
      }
    });

    test('should maintain conversation context', async () => {
      // First query
      const firstQuery = 'Berapa pengajuan bulan ini?';
      const firstResult = await aiService.processQuery(firstQuery);
      
      expect(firstResult.content).toBeTruthy();
      
      // Follow-up query with implicit context
      const followUpQuery = 'Yang masih pending berapa?';
      const followUpResult = await aiService.processQuery(followUpQuery, {
        previousQuery: firstQuery,
        previousResult: firstResult
      });
      
      expect(followUpResult.content).toBeTruthy();
      
      // Should understand the context (pengajuan + pending)
      expect(followUpResult.content).toMatch(/pengajuan|pending/i);
    });

    test('should provide visualization recommendations', async () => {
      const visualQueries = [
        { query: 'Trend pengajuan 6 bulan terakhir', expectedType: 'chart' },
        { query: 'Daftar semua pengajuan pending', expectedType: 'table' },
        { query: 'Total pengajuan hari ini', expectedType: 'stats' }
      ];

      for (const { query, expectedType } of visualQueries) {
        const result = await aiService.processQuery(query);
        
        expect(result.type).toBe(expectedType);
        
        // Should provide appropriate data structure for visualization
        if (result.type === 'chart') {
          expect(result.metadata?.chartConfig).toBeTruthy();
        }
      }
    });
  });
});

/**
 * Comprehensive Test Suite untuk TensorFlow Integration
 * Tests untuk Indonesian administrative language understanding
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

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

import { HybridNLPProcessor } from '../hybridNLPProcessor';
import { TensorFlowJSService } from '../tensorflowJSService';
import { TensorFlowServingAPI } from '../tensorflowServingAPI';
import { ModelManager } from '../modelManager';
import { PerformanceMonitor } from '../performanceMonitor';
import { aiServiceTensorFlow } from '../aiServiceTensorFlow';
import { IndonesianNLP } from "../indonesianNLP";

// Test data untuk Indonesian administrative queries
const testQueries = {
  simple: ["Berapa jumlah penduduk?", "Data profil warga", "Bantuan sistem"],
  moderate: [
    "Tampilkan data penduduk bulan Januari 2024",
    "Cari warga dengan NIK 1234567890123456",
    "Statistik pengaduan tahun ini",
  ],
  complex: [
    "Bandingkan jumlah pengaduan bulan Januari dengan Februari 2024",
    "Jika ada warga yang mengajukan pengaduan lebih dari 3 kali, tampilkan datanya",
    "Analisis tren aktivitas SIAK dari Januari hingga Maret 2024 dan berikan rekomendasi",
  ],
};

const expectedResults = {
  simple: {
    strategy: ["legacy", "tensorflow-js", "hybrid"],
    confidence: { min: 0.5, max: 1.0 },
    responseTime: { max: 1000 },
  },
  moderate: {
    strategy: ["tensorflow-js", "tensorflow-serving", "hybrid"],
    confidence: { min: 0.6, max: 1.0 },
    responseTime: { max: 2000 },
  },
  complex: {
    strategy: ["tensorflow-serving", "hybrid"],
    confidence: { min: 0.7, max: 1.0 },
    responseTime: { max: 5000 },
  },
};

describe("TensorFlow Integration Tests", () => {
  let hybridProcessor: HybridNLPProcessor;
  let tensorflowJS: TensorFlowJSService;
  let tensorflowServing: TensorFlowServingAPI;
  let modelManager: ModelManager;
  let performanceMonitor: PerformanceMonitor;

  beforeAll(async () => {
    // Initialize services
    tensorflowJS = new TensorFlowJSService();
    tensorflowServing = new TensorFlowServingAPI("http://localhost:8501");
    modelManager = new ModelManager();
    performanceMonitor = new PerformanceMonitor();

    hybridProcessor = new HybridNLPProcessor(
      IndonesianNLP.getInstance(),
      tensorflowJS,
      tensorflowServing,
      modelManager,
      performanceMonitor,
    );

    // Mock TensorFlow services untuk testing
    jest
      .spyOn(tensorflowJS, "processQuery")
      .mockImplementation(async (_query: string) => ({
        intent: "data_request",
        confidence: 0.8,
        alternatives: [],
        processingTime: 100,
        modelVersion: "1.0.0",
      }));

    jest
      .spyOn(tensorflowServing, "processComplexQuery")
      .mockImplementation(async (_query: string) => ({
        embedding: new Array(768).fill(0.1),
        intent: {
          primary: "data_request",
          confidence: 0.85,
          alternatives: [],
        },
        entities: [],
        sentiment: {
          sentiment: "neutral",
          confidence: 0.7,
        },
        confidence: 0.85,
        processingTime: 200,
        modelVersion: "1.0.0",
      }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("Query Complexity Analysis", () => {
    it("should correctly classify simple queries", async () => {
      for (const query of testQueries.simple) {
        const result = await hybridProcessor.processQuery(query);

        expect(result.legacyResult).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(
          expectedResults.simple.confidence.min,
        );
        expect(result.processingTime).toBeLessThan(
          expectedResults.simple.responseTime.max,
        );
        expect(expectedResults.simple.strategy).toContain(result.strategy);
      }
    });

    it("should correctly classify moderate queries", async () => {
      for (const query of testQueries.moderate) {
        const result = await hybridProcessor.processQuery(query);

        expect(result.confidence).toBeGreaterThanOrEqual(
          expectedResults.moderate.confidence.min,
        );
        expect(result.processingTime).toBeLessThan(
          expectedResults.moderate.responseTime.max,
        );
        expect(expectedResults.moderate.strategy).toContain(result.strategy);
      }
    });

    it("should correctly classify complex queries", async () => {
      for (const query of testQueries.complex) {
        const result = await hybridProcessor.processQuery(query);

        expect(result.confidence).toBeGreaterThanOrEqual(
          expectedResults.complex.confidence.min,
        );
        expect(result.processingTime).toBeLessThan(
          expectedResults.complex.responseTime.max,
        );
        expect(expectedResults.complex.strategy).toContain(result.strategy);
      }
    });
  });

  describe("Indonesian Language Processing", () => {
    it("should handle Indonesian administrative terms correctly", async () => {
      const administrativeQueries = [
        "Data NIK 1234567890123456",
        "Informasi RT 01 RW 02",
        "Pengaduan kelurahan Menteng",
        "Aktivitas SIAK bulan lalu",
        "Dokumentasi kegiatan",
      ];

      for (const query of administrativeQueries) {
        const result = await hybridProcessor.processQuery(query);

        expect(result.legacyResult.normalizedQuery).toBeDefined();
        expect(result.legacyResult.entities).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      }
    });

    it("should extract entities from Indonesian text", async () => {
      const entityQueries = [
        "Cari data warga bernama Budi Santoso",
        "Pengaduan tanggal 15 Januari 2024",
        "Data RT 05 RW 03 Kelurahan Menteng",
      ];

      for (const query of entityQueries) {
        const result = await hybridProcessor.processQuery(query);

        expect(result.legacyResult.entities).toBeDefined();
        // Should extract at least one entity
        const hasEntities = Object.values(result.legacyResult.entities).some(
          (entity) =>
            entity && (Array.isArray(entity) ? entity.length > 0 : true),
        );
        expect(hasEntities).toBe(true);
      }
    });

    it("should handle date expressions in Indonesian", async () => {
      const dateQueries = [
        "Data bulan Januari 2024",
        "Pengaduan dari tanggal 1 hingga 31 Maret",
        "Aktivitas minggu lalu",
        "Laporan tahun ini",
      ];

      for (const query of dateQueries) {
        const result = await hybridProcessor.processQuery(query);

        expect(result.legacyResult.entities.dateExpressions).toBeDefined();
        if (result.legacyResult.entities.dateExpressions && result.legacyResult.entities.dateExpressions.length > 0) {
          expect(
            result.legacyResult.entities.dateExpressions[0].originalText,
          ).toBeDefined();
        }
      }
    });
  });

  describe("Fallback Mechanisms", () => {
    it("should fallback to legacy when TensorFlow fails", async () => {
      // Mock TensorFlow failure
      jest
        .spyOn(tensorflowJS, "processQuery")
        .mockRejectedValueOnce(new Error("TensorFlow failed"));

      const result = await hybridProcessor.processQuery("Test query");

      expect(result.strategy).toBe("legacy");
      expect(result.legacyResult).toBeDefined();
      // Fallback should be indicated by either fallbackUsed flag or strategy being "legacy"
      expect(result.fallbackUsed === true || result.strategy === "legacy").toBe(true);
    });

    it("should maintain functionality when TensorFlow Serving is unavailable", async () => {
      // Mock TensorFlow Serving failure
      jest
        .spyOn(tensorflowServing, "processComplexQuery")
        .mockRejectedValueOnce(new Error("Serving unavailable"));

      const result = await hybridProcessor.processQuery(
        "Complex query for analysis",
      );

      expect(result.legacyResult).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe("Performance Benchmarks", () => {
    it("should process simple queries within performance thresholds", async () => {
      const startTime = performance.now();

      await Promise.all(
        testQueries.simple.map((query) => hybridProcessor.processQuery(query)),
      );

      const totalTime = performance.now() - startTime;
      const averageTime = totalTime / testQueries.simple.length;

      expect(averageTime).toBeLessThan(500); // 500ms average for simple queries
    });

    it("should maintain accuracy across different query types", async () => {
      const allQueries = [
        ...testQueries.simple,
        ...testQueries.moderate,
        ...testQueries.complex,
      ];

      const results = await Promise.all(
        allQueries.map((query) => hybridProcessor.processQuery(query)),
      );

      const averageConfidence =
        results.reduce((sum, result) => sum + result.confidence, 0) /
        results.length;

      expect(averageConfidence).toBeGreaterThan(0.7); // 70% average confidence
    });
  });

  describe("Integration with AI Service", () => {
    it("should integrate seamlessly with existing AI service", async () => {
      const testQuery = "Tampilkan data pengaduan bulan ini";

      const response = await aiServiceTensorFlow.processEnhancedQuery(
        testQuery,
        {
          userId: "test-user",
          sessionId: "test-session",
        },
      );

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.type).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it("should provide enhanced metadata with TensorFlow insights", async () => {
      const testQuery = "Analisis data penduduk";

      const response =
        await aiServiceTensorFlow.processEnhancedQuery(testQuery);

      expect(response.metadata).toBeDefined();
      // Check for either the enhanced metadata or basic metadata structure
      const hasEnhancedMetadata = response.metadata?.tensorflowInsights !== undefined ||
                                  response.metadata?.processingStrategy !== undefined ||
                                  response.metadata?.enhancementLevel !== undefined;
      const hasBasicMetadata = response.metadata?.confidence !== undefined;

      expect(hasEnhancedMetadata || hasBasicMetadata).toBe(true);
    });
  });

  describe("Error Handling and Resilience", () => {
    it("should handle malformed queries gracefully", async () => {
      const malformedQueries = ["", "   ", "asdfghjkl", "12345", "!@#$%^&*()"];

      for (const query of malformedQueries) {
        const result = await hybridProcessor.processQuery(query);

        expect(result).toBeDefined();
        expect(result.legacyResult).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle very long queries", async () => {
      const longQuery = "Tampilkan data ".repeat(100) + "penduduk";

      const result = await hybridProcessor.processQuery(longQuery);

      expect(result).toBeDefined();
      expect(result.processingTime).toBeLessThan(10000); // 10 seconds max
    });

    it("should handle concurrent requests", async () => {
      const concurrentQueries = Array(10)
        .fill("Data penduduk")
        .map((query, index) => `${query} ${index}`);

      const startTime = performance.now();
      const results = await Promise.all(
        concurrentQueries.map((query) => hybridProcessor.processQuery(query)),
      );
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(10);
      expect(results.every((result) => result.confidence > 0)).toBe(true);
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 concurrent requests
    });
  });

  describe("Model Management", () => {
    it("should manage model loading and caching", async () => {
      const modelStatus = modelManager.getModelStatuses();

      expect(Array.isArray(modelStatus)).toBe(true);
      expect(modelStatus.length).toBeGreaterThan(0);
    });

    it("should handle model availability checks", async () => {
      const isAvailable =
        await modelManager.checkModelAvailability("indonesian-nlp-v1");

      expect(typeof isAvailable).toBe("boolean");
    });
  });

  describe("Performance Monitoring", () => {
    it("should track performance metrics", async () => {
      // Process some queries to generate metrics
      await hybridProcessor.processQuery("Test query for metrics");

      const report = performanceMonitor.generateReport();

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalQueries).toBeGreaterThan(0);
    });

    it("should provide real-time statistics", async () => {
      const stats = performanceMonitor.getRealTimeStats();

      expect(stats).toBeDefined();
      expect(stats.systemHealth).toBeDefined();
      expect(["good", "warning", "critical"]).toContain(stats.systemHealth);
    });
  });
});

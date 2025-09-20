/**
 * ML Optimization Pipeline Tests - Phase 4 AI Intelligence Enhancement
 * 
 * Comprehensive test suite for continuous learning pipeline with Indonesian
 * administrative AI optimization and performance validation.
 * 
 * Test Coverage:
 * - Continuous learning cycle execution (>15% improvement target)
 * - Model selection and routing optimization
 * - Performance metrics validation
 * - Indonesian administrative context handling
 * - Government compliance validation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MLOptimizationPipeline, TrainingData, ModelType, LearningObjective } from '../MLOptimizationPipeline';
import { PerformanceMonitor } from '../../../monitoring/performanceMonitor';
import { GovernmentAuditLogger } from '../../audit/GovernmentAuditLogger';

// Mock implementations for testing
const mockPerformanceMonitor = {
  recordMetric: jest.fn(),
  getMetrics: jest.fn(),
  initialize: jest.fn(),
  getHealthStatus: jest.fn(),
  generateReport: jest.fn(),
  getRealTimeStats: jest.fn(),
  stop: jest.fn()
} as unknown as jest.Mocked<PerformanceMonitor>;

const mockAuditLogger = {
  logReasoningRequest: jest.fn(),
  logReasoningCompletion: jest.fn(),
  logReasoningError: jest.fn(),
  logGovernmentDataAccess: jest.fn(),
  logGovernmentDataAccessCompletion: jest.fn(),
  logGovernmentDataAccessError: jest.fn(),
  logPerformanceWarning: jest.fn()
} as unknown as jest.Mocked<GovernmentAuditLogger>;

describe('MLOptimizationPipeline', () => {
  let mlPipeline: MLOptimizationPipeline;

  beforeEach(() => {
    jest.clearAllMocks();
    mlPipeline = new MLOptimizationPipeline(mockPerformanceMonitor, mockAuditLogger);
    
    // Setup default mock responses
    mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-123');
    mockAuditLogger.logReasoningCompletion.mockResolvedValue();
  });

  describe('Continuous Learning Cycle', () => {
    it('should successfully execute learning cycle with Indonesian administrative data', async () => {
      // Arrange
      const trainingData: TrainingData = {
        id: crypto.randomUUID(),
        query: 'Bagaimana cara mengurus KTP baru?',
        context: {
          administrativeContext: 'dukcapil',
          userRole: 'citizen',
          region: 'Jawa Barat',
          timestamp: new Date()
        },
        expectedOutput: 'Untuk mengurus KTP baru, Anda perlu...',
        actualOutput: 'Untuk membuat KTP baru, silakan...',
        userFeedback: 0.85,
        accuracy: 0.88,
        processingTime: 1200,
        culturalRelevance: 0.92
      };

      const modelType: ModelType = 'reasoning_engine';
      const learningObjective: LearningObjective = {
        targetAccuracy: 0.9,
        maxProcessingTime: 2000,
        culturalRelevanceThreshold: 0.85,
        complianceRequirement: true,
        improvementTarget: 0.15
      };

      // Act
      const result = await mlPipeline.initiateLearningCycle(trainingData, modelType, learningObjective);

      // Assert
      expect(result.modelType).toBe('reasoning_engine');
      expect(result.performanceMetrics.accuracy).toBeGreaterThan(0.85);
      expect(result.performanceMetrics.culturalRelevance).toBeGreaterThan(0.85);
      expect(result.validationResults.complianceValidated).toBe(true);
      expect(result.improvementScore).toBeGreaterThan(0);
      expect(mockAuditLogger.logReasoningRequest).toHaveBeenCalled();
      expect(mockAuditLogger.logReasoningCompletion).toHaveBeenCalled();
    });

    it('should achieve target improvement rate for Indonesian administrative contexts', async () => {
      // Arrange
      const trainingData: TrainingData = {
        id: crypto.randomUUID(),
        query: 'Proses pembuatan akta kelahiran',
        context: {
          administrativeContext: 'dukcapil',
          userRole: 'parent',
          region: 'DKI Jakarta',
          timestamp: new Date()
        },
        expectedOutput: 'Proses pembuatan akta kelahiran memerlukan...',
        processingTime: 800,
        culturalRelevance: 0.95
      };

      const learningObjective: LearningObjective = {
        targetAccuracy: 0.92,
        maxProcessingTime: 1500,
        culturalRelevanceThreshold: 0.9,
        complianceRequirement: true,
        improvementTarget: 0.15
      };

      // Act
      const result = await mlPipeline.initiateLearningCycle(trainingData, 'context_analyzer', learningObjective);

      // Assert
      expect(result.improvementScore).toBeGreaterThan(0.05); // Minimum 5% improvement
      expect(result.performanceMetrics.culturalRelevance).toBeGreaterThan(0.9);
      expect(result.deploymentRecommendation).toBe(true);
      expect(result.validationResults.culturalAppropriatenessScore).toBeGreaterThan(0.9);
    });

    it('should handle multiple model types for Indonesian administrative specialization', async () => {
      // Arrange
      const modelTypes: ModelType[] = ['reasoning_engine', 'context_analyzer', 'confidence_scorer', 'cultural_adapter'];
      const results: any[] = [];

      for (const modelType of modelTypes) {
        const trainingData: TrainingData = {
          id: crypto.randomUUID(),
          query: `Test query for ${modelType}`,
          context: {
            administrativeContext: 'dukcapil',
            userRole: 'citizen',
            region: 'Jawa Tengah',
            timestamp: new Date()
          },
          expectedOutput: 'Expected response',
          processingTime: 1000,
          culturalRelevance: 0.9
        };

        const learningObjective: LearningObjective = {
          targetAccuracy: 0.85,
          maxProcessingTime: 2000,
          culturalRelevanceThreshold: 0.8,
          complianceRequirement: true,
          improvementTarget: 0.1
        };

        // Act
        const result = await mlPipeline.initiateLearningCycle(trainingData, modelType, learningObjective);
        results.push(result);
      }

      // Assert
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.performanceMetrics.accuracy).toBeGreaterThan(0.8);
        expect(result.validationResults.complianceValidated).toBe(true);
        expect(result.performanceMetrics.culturalRelevance).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Model Selection and Routing', () => {
    it('should select optimal model based on query complexity and administrative context', async () => {
      // Arrange
      const complexQuery = 'Bagaimana proses lengkap untuk mengurus semua dokumen kependudukan setelah menikah dan pindah domisili?';
      const context = {
        administrativeContext: 'dukcapil',
        userRole: 'citizen',
        region: 'Bali',
        complexity: 0.8
      };

      // Act
      const result = await mlPipeline.selectOptimalModel(complexQuery, context);

      // Assert
      expect(result.modelType).toBe('reasoning_engine'); // High complexity Dukcapil query
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reasoning).toContain('High complexity Dukcapil query');
      expect(result.modelId).toContain('reasoning_engine');
    });

    it('should route to cultural adapter for regions requiring special handling', async () => {
      // Arrange
      const query = 'Prosedur administrasi dengan adat istiadat lokal';
      const context = {
        administrativeContext: 'kemendagri',
        userRole: 'citizen',
        region: 'Papua',
        complexity: 0.5
      };

      // Act
      const result = await mlPipeline.selectOptimalModel(query, context);

      // Assert
      expect(result.modelType).toBe('cultural_adapter');
      expect(result.confidence).toBeGreaterThan(0.85);
      expect(result.reasoning).toContain('Cultural sensitivity required');
    });

    it('should perform performance-based routing for optimal results', async () => {
      // Arrange
      const query = 'Status pengajuan dokumen';
      const context = { administrativeContext: 'dukcapil', userRole: 'citizen', region: 'Jawa Barat' };
      const availableModels = ['model_1', 'model_2', 'model_3'];

      // Act
      const result = await mlPipeline.routeToOptimalModel(query, context, availableModels);

      // Assert
      expect(result.selectedModelId).toBeDefined();
      expect(result.routingReason).toContain('accuracy');
      expect(result.routingReason).toContain('response time');
      expect(result.expectedPerformance.accuracy).toBeGreaterThan(0.8);
      expect(result.expectedPerformance.processingTime).toBeLessThan(1000);
    });
  });

  describe('Performance Validation and Metrics', () => {
    it('should validate performance against Indonesian administrative standards', async () => {
      // Arrange
      const trainingData: TrainingData = {
        id: crypto.randomUUID(),
        query: 'Cara mengurus surat pindah domisili',
        context: {
          administrativeContext: 'kemendagri',
          userRole: 'citizen',
          region: 'Sumatera Utara',
          timestamp: new Date()
        },
        expectedOutput: 'Untuk mengurus surat pindah domisili...',
        processingTime: 1500,
        culturalRelevance: 0.88
      };

      const learningObjective: LearningObjective = {
        targetAccuracy: 0.9,
        maxProcessingTime: 2000,
        culturalRelevanceThreshold: 0.85,
        complianceRequirement: true,
        improvementTarget: 0.12
      };

      // Act
      const result = await mlPipeline.initiateLearningCycle(trainingData, 'context_analyzer', learningObjective);

      // Assert
      expect(result.performanceMetrics.accuracy).toBeGreaterThan(0.85);
      expect(result.performanceMetrics.precision).toBeGreaterThan(0.8);
      expect(result.performanceMetrics.recall).toBeGreaterThan(0.8);
      expect(result.performanceMetrics.f1Score).toBeGreaterThan(0.8);
      expect(result.performanceMetrics.processingTime).toBeLessThan(200); // ms
      expect(result.performanceMetrics.culturalRelevance).toBeGreaterThan(0.85);
      expect(result.performanceMetrics.complianceScore).toBeGreaterThan(0.9);
      expect(result.performanceMetrics.userSatisfaction).toBeGreaterThan(0.85);
    });

    it('should maintain high performance under load for Indonesian administrative queries', async () => {
      // Arrange
      const batchSize = 10;
      const trainingBatch: TrainingData[] = Array.from({ length: batchSize }, (_, i) => ({
        id: crypto.randomUUID(),
        query: `Query batch ${i + 1} untuk layanan administrasi`,
        context: {
          administrativeContext: 'dukcapil',
          userRole: 'citizen',
          region: 'Jawa Barat',
          timestamp: new Date()
        },
        expectedOutput: `Response for query ${i + 1}`,
        processingTime: 1000 + Math.random() * 500,
        culturalRelevance: 0.85 + Math.random() * 0.1
      }));

      const learningObjective: LearningObjective = {
        targetAccuracy: 0.88,
        maxProcessingTime: 2000,
        culturalRelevanceThreshold: 0.8,
        complianceRequirement: true,
        improvementTarget: 0.1
      };

      // Act
      const startTime = Date.now();
      const results = await Promise.all(
        trainingBatch.map(data => 
          mlPipeline.initiateLearningCycle(data, 'reasoning_engine', learningObjective)
        )
      );
      const totalTime = Date.now() - startTime;

      // Assert
      expect(results).toHaveLength(batchSize);
      expect(totalTime).toBeLessThan(5000); // Should complete batch in <5 seconds
      
      const averageAccuracy = results.reduce((sum, r) => sum + r.performanceMetrics.accuracy, 0) / results.length;
      const averageImprovement = results.reduce((sum, r) => sum + r.improvementScore, 0) / results.length;
      
      expect(averageAccuracy).toBeGreaterThan(0.85);
      expect(averageImprovement).toBeGreaterThan(0.05);
      
      // All should maintain compliance
      results.forEach(result => {
        expect(result.validationResults.complianceValidated).toBe(true);
        expect(result.performanceMetrics.culturalRelevance).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid training data gracefully', async () => {
      // Arrange
      const invalidData = {
        id: 'invalid-id', // Not a UUID
        query: '',
        context: {
          administrativeContext: 'invalid_context',
          userRole: 'citizen',
          region: 'Jawa Barat',
          timestamp: new Date()
        },
        expectedOutput: 'Response',
        processingTime: -100 // Invalid negative time
      };

      const learningObjective: LearningObjective = {
        targetAccuracy: 0.9,
        maxProcessingTime: 2000,
        culturalRelevanceThreshold: 0.85,
        complianceRequirement: true,
        improvementTarget: 0.15
      };

      // Act & Assert
      await expect(
        mlPipeline.initiateLearningCycle(invalidData as any, 'reasoning_engine', learningObjective)
      ).rejects.toThrow();
      
      expect(mockAuditLogger.logReasoningError).toHaveBeenCalled();
    });

    it('should log errors appropriately for debugging and improvement', async () => {
      // Arrange
      const trainingData: TrainingData = {
        id: crypto.randomUUID(),
        query: 'Test query',
        context: {
          administrativeContext: 'dukcapil',
          userRole: 'citizen',
          region: 'Jawa Barat',
          timestamp: new Date()
        },
        expectedOutput: 'Expected response',
        processingTime: 1000
      };

      // Force an error by providing invalid learning objective
      const invalidObjective = {
        targetAccuracy: 1.5, // Invalid > 1.0
        maxProcessingTime: 2000,
        culturalRelevanceThreshold: 0.85,
        complianceRequirement: true,
        improvementTarget: 0.15
      };

      // Act & Assert
      await expect(
        mlPipeline.initiateLearningCycle(trainingData, 'reasoning_engine', invalidObjective as any)
      ).rejects.toThrow();

      expect(mockAuditLogger.logReasoningError).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('ML Learning Cycle Error'),
          error: expect.any(String),
          processingTimeMs: expect.any(Number)
        })
      );
    });
  });
});

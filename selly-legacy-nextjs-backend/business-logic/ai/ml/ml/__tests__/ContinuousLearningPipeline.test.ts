/**
 * Continuous Learning Pipeline Tests - Phase 4 AI Intelligence Enhancement
 * 
 * Comprehensive test suite validating continuous learning pipeline with
 * 15%+ monthly improvement rate and Indonesian administrative context learning.
 * 
 * Target: 15%+ monthly model improvement rate with <2 second ML operation response time
 * Compliance: Code Quality Rule (90%+ test coverage), Government Integration Rule
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ContinuousLearningPipeline, LearningData, ModelImprovementResult } from '../ContinuousLearningPipeline';
import { GovernmentAuditLogger } from '../../audit/GovernmentAuditLogger';
import { AdvancedReasoningEngine } from '../../reasoning/AdvancedReasoningEngine';

// Mock implementations for testing
const mockAuditLogger = {
  logReasoningRequest: jest.fn(),
  logReasoningCompletion: jest.fn(),
  logReasoningError: jest.fn(),
  logGovernmentDataAccess: jest.fn(),
  logGovernmentDataAccessCompletion: jest.fn(),
  logGovernmentDataAccessError: jest.fn(),
  logPerformanceWarning: jest.fn()
} as unknown as jest.Mocked<GovernmentAuditLogger>;

const mockReasoningEngine = {
  performContextualReasoning: jest.fn(),
  contextAnalyzer: jest.fn(),
  inferenceEngine: jest.fn(),
  confidenceScorer: jest.fn(),
  auditLogger: jest.fn()
} as unknown as jest.Mocked<AdvancedReasoningEngine>;

describe('ContinuousLearningPipeline', () => {
  let learningPipeline: ContinuousLearningPipeline;

  beforeEach(() => {
    jest.clearAllMocks();
    learningPipeline = new ContinuousLearningPipeline(mockAuditLogger, mockReasoningEngine);
  });

  describe('Continuous Learning Cycle Execution', () => {
    it('should achieve 15%+ monthly improvement rate for Indonesian administrative contexts', async () => {
      // Arrange
      const learningData: LearningData[] = generateMockLearningData(1500); // Above minimum sample size
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-123');

      // Act
      const result = await learningPipeline.executeLearningCycle(learningData);

      // Assert
      expect(result.improvementMetrics.overallImprovement).toBeGreaterThan(0.15); // 15% improvement target
      expect(result.modelId).toBe('advanced-reasoning-engine');
      expect(result.deploymentStatus).toBe('deployed');
      expect(result.validationResults.governmentComplianceValidated).toBe(true);
      expect(result.validationResults.culturalSensitivityValidated).toBe(true);
    });

    it('should complete learning cycle within 2 seconds for ML operation response time target', async () => {
      // Arrange
      const learningData: LearningData[] = generateMockLearningData(1200);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-124');

      // Act
      const startTime = Date.now();
      const result = await learningPipeline.executeLearningCycle(learningData);
      const endTime = Date.now();

      // Assert
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000); // 2 second target
      expect(result.improvementMetrics.responseTimeImprovement).toBeGreaterThan(0); // Some improvement
    });

    it('should enhance training data with Indonesian cultural context', async () => {
      // Arrange
      const learningData: LearningData[] = [
        {
          interactionId: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          query: 'Bagaimana cara mengurus KTP di Jakarta?',
          context: {
            administrativeContext: 'dukcapil',
            userRole: 'warga_negara',
            culturalContext: {
              region: 'DKI Jakarta',
              language: 'id',
              administrativeLevel: 'provinsi'
            }
          },
          modelResponse: 'Untuk mengurus KTP di Jakarta, Anda perlu...',
          userFeedback: {
            satisfaction: 0.9,
            accuracy: 0.85,
            culturalAppropriateness: 0.88,
            helpfulness: 0.92,
            responseTime: 1500
          },
          timestamp: new Date()
        }
      ];

      // Repeat to reach minimum sample size
      const expandedData = Array(1100).fill(learningData[0]).map((item, index) => ({
        ...item,
        interactionId: `interaction-${index}`,
        userId: `user-${index}`
      }));

      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-125');

      // Act
      const result = await learningPipeline.executeLearningCycle(expandedData);

      // Assert
      expect(result.trainingData.culturalCoverage).toContain('DKI Jakarta');
      expect(result.trainingData.culturalCoverage).toContain('id');
      expect(result.trainingData.culturalCoverage).toContain('provinsi');
      expect(result.improvementMetrics.culturalAdaptationImprovement).toBeGreaterThan(0.05); // 5% minimum
    });

    it('should validate government compliance and cultural sensitivity', async () => {
      // Arrange
      const learningData: LearningData[] = generateMockLearningDataWithVariedContexts(1300);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-126');

      // Act
      const result = await learningPipeline.executeLearningCycle(learningData);

      // Assert
      expect(result.validationResults.governmentComplianceValidated).toBe(true);
      expect(result.validationResults.culturalSensitivityValidated).toBe(true);
      expect(result.validationResults.testAccuracy).toBeGreaterThan(0.92); // >92% accuracy target
      expect(result.validationResults.crossValidationScore).toBeGreaterThan(0.85);
    });

    it('should handle insufficient learning data gracefully', async () => {
      // Arrange
      const insufficientData: LearningData[] = generateMockLearningData(500); // Below minimum
      
      // Act & Assert
      await expect(learningPipeline.executeLearningCycle(insufficientData))
        .rejects.toThrow('Insufficient learning data: 500 < 1000');

      expect(mockAuditLogger.logReasoningError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient learning data: 500 < 1000'
        })
      );
    });

    it('should create comprehensive audit trail for all learning operations', async () => {
      // Arrange
      const learningData: LearningData[] = generateMockLearningData(1100);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-127');

      // Act
      const result = await learningPipeline.executeLearningCycle(learningData);

      // Assert
      expect(mockAuditLogger.logReasoningRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'system',
          query: expect.stringContaining('Continuous learning cycle with 1100 samples'),
          administrativeContext: 'dukcapil'
        })
      );

      expect(mockAuditLogger.logReasoningCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          auditTrailId: 'audit-127',
          success: true,
          complianceValidated: true
        })
      );

      expect(result.auditTrail).toBe('audit-127');
    });
  });

  describe('Indonesian Administrative Context Learning', () => {
    it('should improve accuracy for Dukcapil population verification scenarios', async () => {
      // Arrange
      const dukcapilData: LearningData[] = generateMockLearningDataForContext('dukcapil', 1200);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-dukcapil');

      // Act
      const result = await learningPipeline.executeLearningCycle(dukcapilData);

      // Assert
      expect(result.improvementMetrics.accuracyImprovement).toBeGreaterThan(0.10); // 10% improvement
      expect(result.trainingData.culturalCoverage).toContain('dukcapil');
      expect(result.validationResults.governmentComplianceValidated).toBe(true);
    });

    it('should improve cultural adaptation for different Indonesian regions', async () => {
      // Arrange
      const multiRegionalData: LearningData[] = generateMockLearningDataWithRegions([
        'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Sumatera Utara', 'Bali'
      ], 1400);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-regional');

      // Act
      const result = await learningPipeline.executeLearningCycle(multiRegionalData);

      // Assert
      expect(result.improvementMetrics.culturalAdaptationImprovement).toBeGreaterThan(0.08); // 8% improvement
      expect(result.trainingData.culturalCoverage).toContain('DKI Jakarta');
      expect(result.trainingData.culturalCoverage).toContain('Jawa Barat');
      expect(result.trainingData.culturalCoverage).toContain('Bali');
      expect(result.trainingData.diversityScore).toBeGreaterThan(0.7); // High diversity
    });

    it('should handle multiple administrative contexts effectively', async () => {
      // Arrange
      const multiContextData: LearningData[] = [
        ...generateMockLearningDataForContext('dukcapil', 300),
        ...generateMockLearningDataForContext('kemendagri', 300),
        ...generateMockLearningDataForContext('bpn', 300),
        ...generateMockLearningDataForContext('polri', 200),
        ...generateMockLearningDataForContext('kemenkumham', 200)
      ];
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-multicontext');

      // Act
      const result = await learningPipeline.executeLearningCycle(multiContextData);

      // Assert
      expect(result.trainingData.sampleCount).toBe(1300);
      expect(result.trainingData.diversityScore).toBeGreaterThan(0.8); // Very high diversity
      expect(result.improvementMetrics.overallImprovement).toBeGreaterThan(0.15); // 15% target
    });
  });

  describe('Performance and Quality Validation', () => {
    it('should maintain quality threshold for model deployment', async () => {
      // Arrange
      const highQualityData: LearningData[] = generateMockHighQualityLearningData(1100);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-quality');

      // Act
      const result = await learningPipeline.executeLearningCycle(highQualityData);

      // Assert
      expect(result.trainingData.qualityScore).toBeGreaterThan(0.85); // Quality threshold
      expect(result.deploymentStatus).toBe('deployed');
      expect(result.validationResults.testAccuracy).toBeGreaterThan(0.92);
    });

    it('should handle low quality data appropriately', async () => {
      // Arrange
      const lowQualityData: LearningData[] = generateMockLowQualityLearningData(1100);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-lowquality');

      // Act
      const result = await learningPipeline.executeLearningCycle(lowQualityData);

      // Assert
      expect(result.trainingData.qualityScore).toBeLessThan(0.85);
      expect(result.deploymentStatus).toBe('pending'); // Should not deploy low quality
    });

    it('should generate appropriate model versions', async () => {
      // Arrange
      const learningData: LearningData[] = generateMockLearningData(1100);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-version');

      // Act
      const result = await learningPipeline.executeLearningCycle(learningData);

      // Assert
      expect(result.previousVersion).toBe('v1.0.0');
      expect(result.newVersion).toBe('v1.0.1');
      expect(result.modelId).toBe('advanced-reasoning-engine');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle learning cycle failures gracefully', async () => {
      // Arrange
      const learningData: LearningData[] = generateMockLearningData(1100);
      mockAuditLogger.logReasoningRequest.mockRejectedValue(new Error('Audit logging failed'));

      // Act & Assert
      await expect(learningPipeline.executeLearningCycle(learningData))
        .rejects.toThrow('Continuous learning cycle failed: Audit logging failed');
    });

    it('should validate input data schemas strictly', async () => {
      // Arrange
      const invalidData = [
        {
          interactionId: 'invalid-uuid', // Invalid UUID format (intentionally invalid for test)
          userId: crypto.randomUUID(),
          query: 'Test query',
          context: {
            administrativeContext: 'invalid_context' as any, // Invalid enum
            userRole: 'warga_negara',
            culturalContext: {
              region: 'Test Region',
              language: 'id',
              administrativeLevel: 'provinsi'
            }
          },
          modelResponse: 'Test response',
          userFeedback: {
            satisfaction: 0.8,
            accuracy: 0.7,
            culturalAppropriateness: 0.9,
            helpfulness: 0.8,
            responseTime: 1500
          },
          timestamp: new Date()
        }
      ];

      // Act & Assert
      await expect(learningPipeline.executeLearningCycle(invalidData as any))
        .rejects.toThrow();
    });
  });
});

// Helper functions for generating mock data
function generateMockLearningData(count: number): LearningData[] {
  return Array(count).fill(null).map((_, index) => ({
    interactionId: crypto.randomUUID(),
    userId: crypto.randomUUID(), // Generate proper UUIDs
    query: `Query ${index} tentang administrasi pemerintahan`,
    context: {
      administrativeContext: ['dukcapil', 'kemendagri', 'bpn'][index % 3] as any,
      userRole: ['warga_negara', 'petugas_administrasi'][index % 2] as any,
      culturalContext: {
        region: ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah'][index % 3],
        language: 'id' as const,
        administrativeLevel: ['provinsi', 'kabupaten', 'kecamatan'][index % 3] as any
      }
    },
    modelResponse: `Response ${index} untuk pertanyaan administrasi`,
    userFeedback: {
      satisfaction: 0.7 + (index % 30) / 100, // 0.7 to 0.99
      accuracy: 0.75 + (index % 25) / 100, // 0.75 to 0.99
      culturalAppropriateness: 0.8 + (index % 20) / 100, // 0.8 to 0.99
      helpfulness: 0.72 + (index % 28) / 100, // 0.72 to 0.99
      responseTime: 1000 + (index % 1000) // 1000 to 2000ms
    },
    timestamp: new Date(Date.now() - index * 60000) // Spread over time
  }));
}

function generateMockLearningDataWithVariedContexts(count: number): LearningData[] {
  const contexts = ['dukcapil', 'kemendagri', 'bpn', 'polri', 'kemenkumham'];
  const regions = ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Sumatera Utara', 'Bali'];
  const languages = ['id', 'jv', 'su'];
  
  return Array(count).fill(null).map((_, index) => ({
    interactionId: `interaction-varied-${index}`,
    userId: `user-${index % 150}`,
    query: `Varied query ${index} dengan konteks yang berbeda`,
    context: {
      administrativeContext: contexts[index % contexts.length] as any,
      userRole: ['warga_negara', 'petugas_administrasi', 'kepala_dinas', 'auditor'][index % 4] as any,
      culturalContext: {
        region: regions[index % regions.length],
        language: languages[index % languages.length] as any,
        administrativeLevel: ['pusat', 'provinsi', 'kabupaten', 'kecamatan', 'kelurahan'][index % 5] as any
      }
    },
    modelResponse: `Varied response ${index} dengan adaptasi budaya`,
    userFeedback: {
      satisfaction: 0.75 + (index % 25) / 100,
      accuracy: 0.8 + (index % 20) / 100,
      culturalAppropriateness: 0.78 + (index % 22) / 100,
      helpfulness: 0.76 + (index % 24) / 100,
      responseTime: 800 + (index % 1200)
    },
    timestamp: new Date(Date.now() - index * 45000)
  }));
}

function generateMockLearningDataForContext(context: string, count: number): LearningData[] {
  return Array(count).fill(null).map((_, index) => ({
    interactionId: `${context}-interaction-${index}`,
    userId: `${context}-user-${index % 50}`,
    query: `${context} query ${index}`,
    context: {
      administrativeContext: context as any,
      userRole: 'warga_negara' as const,
      culturalContext: {
        region: 'DKI Jakarta',
        language: 'id' as const,
        administrativeLevel: 'provinsi' as const
      }
    },
    modelResponse: `${context} response ${index}`,
    userFeedback: {
      satisfaction: 0.8 + (index % 20) / 100,
      accuracy: 0.85 + (index % 15) / 100,
      culturalAppropriateness: 0.82 + (index % 18) / 100,
      helpfulness: 0.83 + (index % 17) / 100,
      responseTime: 1200 + (index % 800)
    },
    timestamp: new Date()
  }));
}

function generateMockLearningDataWithRegions(regions: string[], count: number): LearningData[] {
  return Array(count).fill(null).map((_, index) => ({
    interactionId: `regional-interaction-${index}`,
    userId: `regional-user-${index % 80}`,
    query: `Regional query ${index} dari ${regions[index % regions.length]}`,
    context: {
      administrativeContext: 'kemendagri' as const,
      userRole: 'warga_negara' as const,
      culturalContext: {
        region: regions[index % regions.length],
        language: 'id' as const,
        administrativeLevel: 'provinsi' as const
      }
    },
    modelResponse: `Regional response ${index} untuk ${regions[index % regions.length]}`,
    userFeedback: {
      satisfaction: 0.77 + (index % 23) / 100,
      accuracy: 0.82 + (index % 18) / 100,
      culturalAppropriateness: 0.85 + (index % 15) / 100,
      helpfulness: 0.79 + (index % 21) / 100,
      responseTime: 1100 + (index % 900)
    },
    timestamp: new Date()
  }));
}

function generateMockHighQualityLearningData(count: number): LearningData[] {
  return Array(count).fill(null).map((_, index) => ({
    interactionId: `high-quality-${index}`,
    userId: `quality-user-${index % 60}`,
    query: `High quality query ${index}`,
    context: {
      administrativeContext: 'dukcapil' as const,
      userRole: 'warga_negara' as const,
      culturalContext: {
        region: 'DKI Jakarta',
        language: 'id' as const,
        administrativeLevel: 'provinsi' as const
      }
    },
    modelResponse: `High quality response ${index}`,
    userFeedback: {
      satisfaction: 0.9 + (index % 10) / 100, // 0.9 to 0.99
      accuracy: 0.92 + (index % 8) / 100, // 0.92 to 0.99
      culturalAppropriateness: 0.91 + (index % 9) / 100, // 0.91 to 0.99
      helpfulness: 0.93 + (index % 7) / 100, // 0.93 to 0.99
      responseTime: 800 + (index % 400) // Fast responses
    },
    timestamp: new Date()
  }));
}

function generateMockLowQualityLearningData(count: number): LearningData[] {
  return Array(count).fill(null).map((_, index) => ({
    interactionId: `low-quality-${index}`,
    userId: `lowquality-user-${index % 40}`,
    query: `Low quality query ${index}`,
    context: {
      administrativeContext: 'bpn' as const,
      userRole: 'warga_negara' as const,
      culturalContext: {
        region: 'Test Region',
        language: 'id' as const,
        administrativeLevel: 'kabupaten' as const
      }
    },
    modelResponse: `Low quality response ${index}`,
    userFeedback: {
      satisfaction: 0.4 + (index % 30) / 100, // 0.4 to 0.69
      accuracy: 0.5 + (index % 25) / 100, // 0.5 to 0.74
      culturalAppropriateness: 0.45 + (index % 35) / 100, // 0.45 to 0.79
      helpfulness: 0.42 + (index % 33) / 100, // 0.42 to 0.74
      responseTime: 2500 + (index % 1500) // Slow responses
    },
    timestamp: new Date()
  }));
}

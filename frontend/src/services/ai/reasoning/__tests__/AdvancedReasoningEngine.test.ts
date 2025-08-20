/**
 * Advanced Reasoning Engine Tests - Phase 4 AI Intelligence Enhancement
 * 
 * Comprehensive test suite validating AI reasoning accuracy, Indonesian context
 * analysis, and government compliance for administrative scenarios.
 * 
 * Target: >92% reasoning accuracy with Indonesian administrative contexts
 * Compliance: Code Quality Rule (90%+ test coverage), Government Integration Rule
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AdvancedReasoningEngine } from '../AdvancedReasoningEngine';
import { IndonesianContextAnalyzer } from '../../context/IndonesianContextAnalyzer';
import { LogicalInferenceEngine } from '../LogicalInferenceEngine';
import { DecisionConfidenceScorer } from '../DecisionConfidenceScorer';
import { GovernmentAuditLogger } from '../../audit/GovernmentAuditLogger';
import { EnhancedContext } from '../AdvancedReasoningEngine';

// Helper function to create valid context objects
function createValidContext(overrides: Partial<EnhancedContext> = {}): EnhancedContext {
  return {
    userId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    administrativeContext: 'dukcapil' as const,
    userRole: 'warga_negara' as const,
    requestType: 'information_request' as const,
    priority: 'sedang' as const,
    culturalContext: {
      region: 'Jawa Barat',
      language: 'id' as const,
      administrativeLevel: 'kabupaten' as const
    },
    timestamp: new Date(),
    ...overrides
  };
}

// Mock implementations for testing
const mockContextAnalyzer = {
  analyzeIndonesianAdministrativeContext: jest.fn(),
  getRecommendedCommunicationStyle: jest.fn()
} as unknown as jest.Mocked<IndonesianContextAnalyzer>;

const mockInferenceEngine = {
  performInference: jest.fn()
} as unknown as jest.Mocked<LogicalInferenceEngine>;

const mockConfidenceScorer = {
  calculateConfidence: jest.fn()
} as unknown as jest.Mocked<DecisionConfidenceScorer>;

const mockAuditLogger = {
  logReasoningRequest: jest.fn(),
  logReasoningCompletion: jest.fn(),
  logReasoningError: jest.fn(),
  logGovernmentDataAccess: jest.fn(),
  logGovernmentDataAccessCompletion: jest.fn(),
  logGovernmentDataAccessError: jest.fn(),
  logPerformanceWarning: jest.fn()
} as unknown as jest.Mocked<GovernmentAuditLogger>;

describe('AdvancedReasoningEngine', () => {
  let reasoningEngine: AdvancedReasoningEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    reasoningEngine = new AdvancedReasoningEngine(
      mockContextAnalyzer,
      mockInferenceEngine,
      mockConfidenceScorer,
      mockAuditLogger
    );
  });

  describe('Indonesian Administrative Context Reasoning', () => {
    it('should achieve >92% accuracy for Dukcapil population verification scenarios', async () => {
      // Arrange
      const query = 'Saya perlu memverifikasi data kependudukan untuk keperluan administrasi';
      const context = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: 'session-123',
        administrativeContext: 'dukcapil' as const,
        userRole: 'warga_negara' as const,
        requestType: 'population_verification',
        priority: 'sedang' as const,
        culturalContext: {
          region: 'DKI Jakarta',
          language: 'id' as const,
          administrativeLevel: 'provinsi' as const
        },
        timestamp: new Date(),
        metadata: {}
      };
      const sessionHistory = {
        interactions: [],
        patterns: [],
        preferences: {}
      };

      // Mock responses
      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
        'Administrative System: Direktorat Jenderal Kependudukan dan Pencatatan Sipil',
        'Data Classification: rahasia',
        'Regional Context: DKI Jakarta',
        'User Role: Citizen (Warga Negara)'
      ]);

      mockInferenceEngine.performInference.mockResolvedValue([
        'Population verification requires NIK validation',
        'Data privacy protection mandatory',
        'Indonesian government protocols apply'
      ]);

      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.95);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-123');

      // Act
      const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);

      // Assert
      expect(result.metadata.accuracy_score).toBeGreaterThan(0.92);
      expect(result.decision.confidence).toBeGreaterThan(0.92);
      expect(result.reasoning.contextualFactors).toContain('Administrative System: Direktorat Jenderal Kependudukan dan Pencatatan Sipil');
      expect(result.reasoning.culturalConsiderations).toContain('Indonesian administrative protocol compliance required');
      expect(result.metadata.compliance_validated).toBe(true);
    });

    it('should handle Kemendagri administrative document scenarios with cultural sensitivity', async () => {
      // Arrange
      const query = 'Bagaimana cara mengurus surat keterangan domisili di tingkat kecamatan?';
      const context = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        sessionId: 'session-124',
        administrativeContext: 'kemendagri' as const,
        userRole: 'warga_negara' as const,
        requestType: 'document_processing',
        priority: 'sedang' as const,
        culturalContext: {
          region: 'Jawa Barat',
          language: 'su' as const, // Sundanese
          administrativeLevel: 'kecamatan' as const
        },
        timestamp: new Date(),
        metadata: {}
      };
      const sessionHistory = {
        interactions: [
          {
            timestamp: new Date(),
            query: 'Persyaratan KTP',
            response: 'Untuk membuat KTP...',
            satisfaction: 0.8,
            context
          }
        ],
        patterns: [
          {
            pattern: 'document_inquiry',
            frequency: 3,
            success_rate: 0.85
          }
        ],
        preferences: { language: 'sundanese_indonesian' }
      };

      // Mock responses
      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
        'Administrative System: Kementerian Dalam Negeri',
        'Administrative Level: kecamatan (Level 4)',
        'Regional Context: Jawa Barat',
        'Cultural Context: sunda'
      ]);

      mockInferenceEngine.performInference.mockResolvedValue([
        'Kecamatan-level document processing applies',
        'Regional cultural considerations required',
        'Sundanese language accommodation needed'
      ]);

      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.93);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-124');

      // Act
      const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);

      // Assert
      expect(result.metadata.accuracy_score).toBeGreaterThan(0.92);
      expect(result.reasoning.culturalConsiderations).toContain('Local language preference: su');
      expect(result.reasoning.historicalPatterns).toContain('Successful pattern: document_inquiry (85.0% success)');
      expect(result.decision.alternatives).toHaveLength(3);
    });

    it('should handle BPN land certificate scenarios with traditional land rights consideration', async () => {
      // Arrange
      const query = 'Proses sertifikat tanah adat di daerah dengan hak ulayat';
      const context = {
        userId: '123e4567-e89b-12d3-a456-426614174002',
        sessionId: 'session-125',
        administrativeContext: 'bpn' as const,
        userRole: 'petugas_administrasi' as const,
        requestType: 'land_certification',
        priority: 'tinggi' as const,
        culturalContext: {
          region: 'Sumatera Utara',
          language: 'id' as const,
          administrativeLevel: 'kabupaten' as const
        },
        timestamp: new Date(),
        metadata: {}
      };
      const sessionHistory = {
        interactions: [],
        patterns: [],
        preferences: {}
      };

      // Mock responses
      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
        'Administrative System: Badan Pertanahan Nasional',
        'Priority Level: High (Tinggi)',
        'Cultural Context: batak_melayu',
        'User Role: Administrative Officer (Petugas Administrasi)'
      ]);

      mockInferenceEngine.performInference.mockResolvedValue([
        'Traditional land rights (hak ulayat) recognition required',
        'Community consultation mandatory',
        'Batak traditional law integration needed'
      ]);

      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.94);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-125');

      // Act
      const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);

      // Assert
      expect(result.metadata.accuracy_score).toBeGreaterThan(0.92);
      expect(result.reasoning.logicalInferences).toContain('Traditional land rights (hak ulayat) recognition required');
      expect(result.reasoning.culturalConsiderations).toContain('Regional context: Sumatera Utara');
      expect(result.decision.confidence).toBeGreaterThan(0.92);
    });
  });

  describe('Performance and Response Time Validation', () => {
    it('should complete reasoning within 2 seconds for government API compliance', async () => {
      // Arrange
      const query = 'Quick administrative query';
      const context = {
        userId: '123e4567-e89b-12d3-a456-426614174003',
        sessionId: 'session-126',
        administrativeContext: 'dukcapil' as const,
        userRole: 'warga_negara' as const,
        requestType: 'quick_verification',
        priority: 'tinggi' as const,
        culturalContext: {
          region: 'DKI Jakarta',
          language: 'id' as const,
          administrativeLevel: 'pusat' as const
        },
        timestamp: new Date(),
        metadata: {}
      };
      const sessionHistory = { interactions: [], patterns: [], preferences: {} };

      // Mock fast responses
      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue(['Fast context']);
      mockInferenceEngine.performInference.mockResolvedValue(['Fast inference']);
      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.93);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-126');

      // Act
      const startTime = Date.now();
      const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);
      const endTime = Date.now();

      // Assert
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000); // 2 second target
      expect(result.metadata.processing_time_ms).toBeLessThan(2000);
      expect(result.metadata.accuracy_score).toBeGreaterThan(0.8);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle context analyzer failures gracefully', async () => {
      // Arrange
      const query = 'Test query';
      const context = {
        userId: '123e4567-e89b-12d3-a456-426614174004',
        sessionId: 'session-127',
        administrativeContext: 'dukcapil' as const,
        userRole: 'warga_negara' as const,
        requestType: 'test',
        priority: 'rendah' as const,
        culturalContext: {
          region: 'Test Region',
          language: 'id' as const,
          administrativeLevel: 'pusat' as const
        },
        timestamp: new Date(),
        metadata: {}
      };
      const sessionHistory = { interactions: [], patterns: [], preferences: {} };

      // Mock failure
      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockRejectedValue(
        new Error('Context analysis failed')
      );

      // Act & Assert
      await expect(
        reasoningEngine.performContextualReasoning(query, context, sessionHistory)
      ).rejects.toThrow('Reasoning engine failed: Context analysis failed');

      expect(mockAuditLogger.logReasoningError).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: context.userId,
          error: 'Context analysis failed'
        })
      );
    });

    it('should validate input schemas strictly', async () => {
      // Arrange
      const query = 'Test query';
      const invalidContext = {
        userId: 'invalid-uuid', // Invalid UUID format
        sessionId: 'session-128',
        administrativeContext: 'invalid_system' as any, // Invalid enum value
        userRole: 'warga_negara' as const,
        requestType: 'test',
        priority: 'sedang' as const,
        culturalContext: {
          region: 'Test Region',
          language: 'id' as const,
          administrativeLevel: 'pusat' as const
        },
        timestamp: new Date(),
        metadata: {}
      };
      const sessionHistory = { interactions: [], patterns: [], preferences: {} };

      // Act & Assert
      await expect(
        reasoningEngine.performContextualReasoning(query, invalidContext, sessionHistory)
      ).rejects.toThrow();
    });
  });

  describe('Audit Trail and Compliance', () => {
    it('should create comprehensive audit trails for all reasoning operations', async () => {
      // Arrange
      const query = 'Audit test query';
      const context = {
        userId: '123e4567-e89b-12d3-a456-426614174005',
        sessionId: 'session-129',
        administrativeContext: 'dukcapil' as const,
        userRole: 'auditor' as const,
        requestType: 'audit_verification',
        priority: 'kritis' as const,
        culturalContext: {
          region: 'DKI Jakarta',
          language: 'id' as const,
          administrativeLevel: 'pusat' as const
        },
        timestamp: new Date(),
        metadata: {}
      };
      const sessionHistory = { interactions: [], patterns: [], preferences: {} };

      // Mock responses
      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue(['Audit context']);
      mockInferenceEngine.performInference.mockResolvedValue(['Audit inference']);
      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.96);
      mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-129');

      // Act
      const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);

      // Assert
      expect(mockAuditLogger.logReasoningRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: context.userId,
          administrativeContext: 'dukcapil',
          timestamp: expect.any(Date)
        })
      );

      expect(mockAuditLogger.logReasoningCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          auditTrailId: 'audit-129',
          success: true,
          complianceValidated: true
        })
      );

      expect(result.metadata.audit_trail_id).toBe('audit-129');
      expect(result.metadata.compliance_validated).toBe(true);
    });
  });

  describe('Indonesian Cultural Adaptation', () => {
    it('should adapt reasoning for different Indonesian regions and cultures', async () => {
      // Test cases for different Indonesian regions
      const testCases = [
        {
          region: 'Bali',
          culture: 'hindu_bali',
          language: 'balinese_indonesian',
          expectedCultural: 'Regional cultural sensitivity: hindu_bali'
        },
        {
          region: 'Sulawesi Selatan',
          culture: 'bugis_makassar',
          language: 'bugis_indonesian',
          expectedCultural: 'Regional cultural sensitivity: bugis_makassar'
        },
        {
          region: 'Jawa Tengah',
          culture: 'jawa',
          language: 'javanese_indonesian',
          expectedCultural: 'Regional cultural sensitivity: jawa'
        }
      ];

      for (const testCase of testCases) {
        // Arrange
        const query = 'Regional administrative query';
        const context = {
          userId: '123e4567-e89b-12d3-a456-426614174006',
          sessionId: `session-${testCase.region}`,
          administrativeContext: 'kemendagri' as const,
          userRole: 'warga_negara' as const,
          requestType: 'regional_service',
          priority: 'sedang' as const,
          culturalContext: {
            region: testCase.region,
            language: 'id' as const,
            administrativeLevel: 'provinsi' as const
          },
          timestamp: new Date(),
          metadata: {}
        };
        const sessionHistory = { interactions: [], patterns: [], preferences: {} };

        // Mock responses
        mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
          `Regional Context: ${testCase.region}`,
          `Cultural Context: ${testCase.culture}`
        ]);
        mockInferenceEngine.performInference.mockResolvedValue(['Regional inference']);
        mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.93);
        mockAuditLogger.logReasoningRequest.mockResolvedValue(`audit-${testCase.region}`);

        // Act
        const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);

        // Assert
        expect(result.metadata.accuracy_score).toBeGreaterThan(0.85);
        expect(result.reasoning.contextualFactors).toContain(`Regional Context: ${testCase.region}`);
        expect(result.reasoning.culturalConsiderations).toContain('Indonesian administrative protocol compliance required');
      }
    });
  });

  // Enhanced Phase 4 Tests
  describe('Phase 4 Enhanced Multi-Step Reasoning', () => {
    it('should perform comprehensive multi-step reasoning for complex administrative scenarios', async () => {
      // Arrange
      const complexQuery = 'Bagaimana cara mengurus KTP baru setelah pindah domisili dari Jakarta ke Bandung dengan status pernikahan yang berubah?';
      const context = {
        userId: crypto.randomUUID(),
        sessionId: 'session-123',
        administrativeContext: 'dukcapil' as const,
        userRole: 'warga_negara' as const,
        requestType: 'document_creation',
        priority: 'sedang' as const,
        culturalContext: {
          region: 'Jawa Barat',
          language: 'id' as const,
          administrativeLevel: 'kabupaten' as const
        },
        timestamp: new Date()
      };
      const sessionHistory = {
        interactions: [
          {
            query: 'Info pindah domisili',
            timestamp: new Date(),
            response: 'Informasi pindah domisili',
            satisfaction: 0.8,
            context: {
              userId: crypto.randomUUID(),
              sessionId: crypto.randomUUID(),
              administrativeContext: 'dukcapil' as const,
              userRole: 'warga_negara' as const,
              requestType: 'information_request' as const,
              priority: 'sedang' as const,
              culturalContext: {
                region: 'Jawa Barat',
                language: 'id' as const,
                administrativeLevel: 'kabupaten' as const
              },
              timestamp: new Date()
            }
          }
        ],
        patterns: [],
        preferences: {}
      };

      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
        'Multi-step administrative process required',
        'Cross-regional coordination needed',
        'Document verification complexity high'
      ]);

      mockInferenceEngine.performInference.mockResolvedValue([
        'KTP update requires domicile change completion',
        'Marriage status change requires additional documentation',
        'Cross-regional verification protocols apply'
      ]);

      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.88);

      // Act
      const result = await reasoningEngine.performContextualReasoning(complexQuery, context, sessionHistory);

      // Assert
      expect(result.decision.reasoning_chain).toHaveLength(8); // Enhanced reasoning chain
      expect(result.decision.reasoning_chain).toContain('Analyzed Indonesian administrative hierarchy and protocols');
      expect(result.decision.reasoning_chain).toContain('Evaluated compliance with Indonesian data protection laws');
      expect(result.decision.confidence).toBeGreaterThan(0.85); // Phase 4 target
      expect(result.decision.alternatives).toHaveLength(3);
      expect(result.metadata.accuracy_score).toBeGreaterThan(0.85);
    });

    it('should generate contextual recommendations in Indonesian for administrative processes', async () => {
      // Arrange
      const query = 'Cara buat akta kelahiran anak';
      const context = {
        userId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        administrativeContext: 'dukcapil' as const,
        userRole: 'warga_negara' as const,
        requestType: 'document_creation' as const,
        priority: 'tinggi' as const,
        culturalContext: {
          region: 'DKI Jakarta',
          language: 'id' as const,
          administrativeLevel: 'provinsi' as const
        },
        timestamp: new Date()
      };
      const sessionHistory = { interactions: [], patterns: [], preferences: {} };

      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
        'Birth certificate creation process',
        'Parent verification required',
        'Hospital documentation needed'
      ]);

      mockInferenceEngine.performInference.mockResolvedValue([
        'Document completeness verification',
        'Identity validation protocols'
      ]);

      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.92);

      // Act
      const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);

      // Assert
      expect(result.decision.recommendation).toContain('Berdasarkan analisis konteks administrasi Indonesia');
      expect(result.decision.recommendation).toContain('untuk layanan kependudukan dan pencatatan sipil');
      expect(result.decision.recommendation).toContain('standar keamanan tinggi dan audit trail lengkap');
      expect(result.decision.confidence).toBeGreaterThan(0.9);
    });

    it('should assess operational risk appropriately for different administrative domains', async () => {
      // Arrange
      const testCases = [
        {
          query: 'Buat KTP baru',
          domain: 'dukcapil_civil_registration',
          expectedRisk: 'medium',
          expectedFactors: ['Identity verification required']
        },
        {
          query: 'Cek sertifikat tanah',
          domain: 'bpn_land_services',
          expectedRisk: 'high',
          expectedFactors: ['Property rights implications']
        },
        {
          query: 'Info layanan umum',
          domain: 'general_administrative',
          expectedRisk: 'low',
          expectedFactors: []
        }
      ];

      for (const testCase of testCases) {
        const context = createValidContext({
          administrativeContext: 'dukcapil' as const,
          userRole: 'warga_negara' as const,
          priority: 'sedang' as const
        });
        const sessionHistory = { interactions: [], patterns: [], preferences: {} };

        mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
          `Domain: ${testCase.domain}`,
          'Standard administrative context'
        ]);

        mockInferenceEngine.performInference.mockResolvedValue([
          'Standard inference result'
        ]);

        mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.85);

        // Act
        const result = await reasoningEngine.performContextualReasoning(testCase.query, context, sessionHistory);

        // Assert
        expect(result.decision.reasoning_chain).toContain('Assessed risk factors and alternative approaches');
        expect(result.metadata.accuracy_score).toBeGreaterThan(0.85);
      }
    });

    it('should maintain high performance for complex reasoning scenarios', async () => {
      // Arrange
      const complexQuery = 'Bagaimana proses lengkap untuk mengurus semua dokumen kependudukan setelah menikah, pindah domisili, dan ganti nama?';
      const context = createValidContext({
        administrativeContext: 'dukcapil' as const,
        userRole: 'warga_negara' as const,
        priority: 'sedang' as const,
        culturalContext: {
          region: 'Jawa Tengah',
          language: 'id' as const,
          administrativeLevel: 'kabupaten' as const
        }
      });
      const sessionHistory = { interactions: [], patterns: [], preferences: {} };

      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
        'Complex multi-document process',
        'Sequential dependency requirements',
        'Cross-system coordination needed',
        'High verification complexity'
      ]);

      mockInferenceEngine.performInference.mockResolvedValue([
        'Marriage certificate prerequisite',
        'Domicile change sequence',
        'Name change legal requirements',
        'Document interdependencies'
      ]);

      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.87);

      // Act
      const startTime = Date.now();
      const result = await reasoningEngine.performContextualReasoning(complexQuery, context, sessionHistory);
      const processingTime = Date.now() - startTime;

      // Assert
      expect(processingTime).toBeLessThan(2000); // <2s performance target
      expect(result.decision.confidence).toBeGreaterThan(0.85);
      expect(result.decision.alternatives).toHaveLength(3);
      expect(result.decision.reasoning_chain).toHaveLength(8);
      expect(result.metadata.accuracy_score).toBeGreaterThan(0.85);
      expect(result.metadata.processing_time_ms).toBeLessThan(2000);
    });
  });

  describe('Phase 4 Cultural Intelligence and Compliance', () => {
    it('should validate Indonesian cultural appropriateness in recommendations', async () => {
      // Arrange
      const query = 'Prosedur formal untuk mengajukan surat keterangan domisili';
      const context = createValidContext({
        administrativeContext: 'kemendagri' as const,
        userRole: 'warga_negara' as const,
        priority: 'sedang' as const,
        culturalContext: {
          region: 'Sumatera Utara',
          language: 'id' as const,
          administrativeLevel: 'kabupaten' as const
        }
      });
      const sessionHistory = { interactions: [], patterns: [], preferences: {} };

      mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
        'Formal administrative protocol required',
        'Regional cultural sensitivity needed',
        'Hierarchical approval process'
      ]);

      mockInferenceEngine.performInference.mockResolvedValue([
        'Formal language requirements',
        'Cultural protocol compliance'
      ]);

      mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.91);

      // Act
      const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);

      // Assert
      expect(result.reasoning.culturalConsiderations).toContain('Indonesian administrative protocol compliance required');
      expect(result.reasoning.culturalConsiderations).toContain('Formal Indonesian language (bahasa baku) preferred');
      expect(result.reasoning.culturalConsiderations).toContain('Regional context: Sumatera Utara');
      expect(result.decision.recommendation).toContain('protokol administratif Indonesia');
      expect(result.metadata.accuracy_score).toBeGreaterThan(0.9);
    });

    it('should ensure regulatory compliance across different Indonesian administrative domains', async () => {
      // Arrange
      const testCases = [
        {
          domain: 'dukcapil',
          expectedCompliance: ['UU No. 24 Tahun 2013 (Adminduk)', 'PP No. 40 Tahun 2019 (Pelaksanaan Adminduk)', 'UU No. 27 Tahun 2022 (PDP)']
        },
        {
          domain: 'kemendagri',
          expectedCompliance: ['UU No. 23 Tahun 2014 (Pemerintahan Daerah)', 'UU No. 27 Tahun 2022 (PDP)']
        },
        {
          domain: 'bpn',
          expectedCompliance: ['UU No. 5 Tahun 1960 (UUPA)', 'UU No. 27 Tahun 2022 (PDP)']
        }
      ];

      for (const testCase of testCases) {
        const query = `Layanan ${testCase.domain}`;
        const context = createValidContext({
          administrativeContext: testCase.domain === 'dukcapil' ? 'dukcapil' as const : 'kemendagri' as const,
          userRole: 'warga_negara' as const,
          priority: 'sedang' as const,
          culturalContext: {
            region: 'Jawa Barat',
            language: 'id' as const,
            administrativeLevel: 'kabupaten' as const
          }
        });
        const sessionHistory = { interactions: [], patterns: [], preferences: {} };

        mockContextAnalyzer.analyzeIndonesianAdministrativeContext.mockResolvedValue([
          `${testCase.domain} administrative context`,
          'Regulatory compliance required'
        ]);

        mockInferenceEngine.performInference.mockResolvedValue([
          'Compliance validation needed'
        ]);

        mockConfidenceScorer.calculateConfidence.mockResolvedValue(0.89);

        // Act
        const result = await reasoningEngine.performContextualReasoning(query, context, sessionHistory);

        // Assert
        expect(result.decision.reasoning_chain).toContain('Evaluated compliance with Indonesian data protection laws');
        expect(result.metadata.compliance_validated).toBe(true);
        expect(result.metadata.accuracy_score).toBeGreaterThan(0.85);
      }
    });
  });
});

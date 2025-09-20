/**
 * Intelligent Automation Framework Tests - Phase 4 AI Intelligence Enhancement
 * 
 * Comprehensive test suite for workflow automation engine with Indonesian
 * government process optimization and bottleneck identification.
 * 
 * Test Coverage:
 * - Workflow automation execution (>95% success rate target)
 * - Bottleneck identification and process optimization
 * - Task prediction and proactive assistance
 * - Resource optimization for maximum throughput
 * - Indonesian administrative context handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  IntelligentAutomationFramework, 
  UserRequest, 
  AdministrativeContext 
} from '../IntelligentAutomationFramework';
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

describe('IntelligentAutomationFramework', () => {
  let automationFramework: IntelligentAutomationFramework;

  beforeEach(() => {
    jest.clearAllMocks();
    automationFramework = new IntelligentAutomationFramework(mockPerformanceMonitor, mockAuditLogger);
    
    // Setup default mock responses
    mockAuditLogger.logReasoningRequest.mockResolvedValue('audit-123');
    mockAuditLogger.logReasoningCompletion.mockResolvedValue();
  });

  describe('Workflow Automation', () => {
    it('should successfully automate Indonesian administrative workflow', async () => {
      // Arrange
      const userRequest: UserRequest = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        query: 'Saya ingin mengurus KTP baru',
        requestType: 'document_creation',
        administrativeContext: 'dukcapil',
        priority: 'normal',
        timestamp: new Date(),
        metadata: {
          userRole: 'citizen',
          region: 'Jawa Barat',
          deviceType: 'mobile'
        }
      };

      const administrativeContext: AdministrativeContext = {
        system: 'dukcapil',
        department: 'Dinas Kependudukan dan Pencatatan Sipil',
        region: 'Jawa Barat',
        administrativeLevel: 'kabupaten',
        workingHours: {
          start: '08:00',
          end: '16:00',
          timezone: 'Asia/Jakarta'
        },
        capacity: {
          maxConcurrentRequests: 100,
          averageProcessingTime: 900000, // 15 minutes
          staffAvailability: 0.8
        }
      };

      // Act
      const result = await automationFramework.analyzeAndAutomateWorkflow(userRequest, administrativeContext);

      // Assert
      expect(result.status).toBe('completed');
      expect(result.successRate).toBeGreaterThan(0.95); // >95% success rate target
      expect(result.complianceValidated).toBe(true);
      expect(result.bottlenecksIdentified).toBeDefined();
      expect(result.optimizationRecommendations).toHaveLength(4);
      expect(result.userSatisfactionScore).toBeGreaterThan(0.85);
      expect(mockAuditLogger.logReasoningRequest).toHaveBeenCalled();
      expect(mockAuditLogger.logReasoningCompletion).toHaveBeenCalled();
    });

    it('should identify and optimize bottlenecks in government processes', async () => {
      // Arrange
      const userRequest: UserRequest = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        query: 'Proses pembuatan akta kelahiran',
        requestType: 'document_creation',
        administrativeContext: 'dukcapil',
        priority: 'high',
        timestamp: new Date(),
        metadata: {
          userRole: 'parent',
          region: 'DKI Jakarta',
          deviceType: 'desktop'
        }
      };

      const administrativeContext: AdministrativeContext = {
        system: 'dukcapil',
        department: 'Dinas Kependudukan dan Pencatatan Sipil',
        region: 'DKI Jakarta',
        administrativeLevel: 'provinsi',
        workingHours: {
          start: '07:30',
          end: '16:30',
          timezone: 'Asia/Jakarta'
        },
        capacity: {
          maxConcurrentRequests: 200,
          averageProcessingTime: 1200000, // 20 minutes
          staffAvailability: 0.9
        }
      };

      // Act
      const result = await automationFramework.analyzeAndAutomateWorkflow(userRequest, administrativeContext);

      // Assert
      expect(result.bottlenecksIdentified.length).toBeGreaterThan(0);
      
      const processingBottlenecks = result.bottlenecksIdentified.filter(b => b.bottleneckType === 'processing_time');
      const manualBottlenecks = result.bottlenecksIdentified.filter(b => b.bottleneckType === 'manual_intervention');
      
      expect(processingBottlenecks.length + manualBottlenecks.length).toBeGreaterThan(0);
      
      // Check optimization recommendations
      expect(result.optimizationRecommendations).toContain('Add predictive caching for frequently requested documents');
      expect(result.optimizationRecommendations).toContain('Implement smart queuing based on request priority and complexity');
      
      // Verify bottleneck recommendations
      result.bottlenecksIdentified.forEach(bottleneck => {
        expect(bottleneck.recommendation).toBeDefined();
        expect(bottleneck.impact).toMatch(/^(low|medium|high)$/);
      });
    });

    it('should handle different administrative contexts appropriately', async () => {
      // Arrange
      const testCases = [
        {
          context: 'dukcapil',
          query: 'Mengurus KTP',
          expectedCompliance: true,
          expectedSteps: 3
        },
        {
          context: 'kemendagri',
          query: 'Surat pindah domisili',
          expectedCompliance: true,
          expectedSteps: 3
        },
        {
          context: 'bpn',
          query: 'Sertifikat tanah',
          expectedCompliance: true,
          expectedSteps: 3
        }
      ];

      for (const testCase of testCases) {
        const userRequest: UserRequest = {
          id: crypto.randomUUID(),
          userId: crypto.randomUUID(),
          query: testCase.query,
          requestType: 'document_creation',
          administrativeContext: testCase.context as any,
          priority: 'normal',
          timestamp: new Date(),
          metadata: {
            userRole: 'citizen',
            region: 'Jawa Tengah',
            deviceType: 'mobile'
          }
        };

        const administrativeContext: AdministrativeContext = {
          system: testCase.context as any,
          department: 'Test Department',
          region: 'Jawa Tengah',
          administrativeLevel: 'kabupaten',
          workingHours: {
            start: '08:00',
            end: '16:00',
            timezone: 'Asia/Jakarta'
          },
          capacity: {
            maxConcurrentRequests: 50,
            averageProcessingTime: 600000,
            staffAvailability: 0.75
          }
        };

        // Act
        const result = await automationFramework.analyzeAndAutomateWorkflow(userRequest, administrativeContext);

        // Assert
        expect(result.complianceValidated).toBe(testCase.expectedCompliance);
        expect(result.completedSteps.length).toBeGreaterThanOrEqual(testCase.expectedSteps - 1);
        expect(result.successRate).toBeGreaterThan(0.8);
      }
    });
  });

  describe('Task Prediction and Proactive Assistance', () => {
    it('should predict next actions based on user behavior patterns', async () => {
      // Arrange
      const userId = crypto.randomUUID();
      const currentContext = {
        administrativeContext: 'dukcapil',
        completedSteps: ['identity_verification', 'document_generation'],
        userBehaviorPattern: ['status_check', 'document_download', 'additional_request']
      };

      // Act
      const result = await automationFramework.predictNextActions(userId, currentContext);

      // Assert
      expect(result.predictedActions).toHaveLength(2);
      expect(result.proactiveAssistance).toHaveLength(1);
      
      // Verify predicted actions structure
      result.predictedActions.forEach(action => {
        expect(action.action).toBeDefined();
        expect(action.probability).toBeGreaterThan(0);
        expect(action.probability).toBeLessThanOrEqual(1);
        expect(action.reasoning).toBeDefined();
        expect(action.estimatedTime).toBeGreaterThan(0);
      });

      // Verify proactive assistance
      result.proactiveAssistance.forEach(assistance => {
        expect(assistance.suggestion).toBeDefined();
        expect(assistance.benefit).toBeDefined();
        expect(assistance.urgency).toMatch(/^(low|medium|high)$/);
      });
    });

    it('should provide contextual proactive assistance for Indonesian administrative processes', async () => {
      // Arrange
      const userId = crypto.randomUUID();
      const currentContext = {
        administrativeContext: 'dukcapil',
        completedSteps: ['identity_verification'],
        userBehaviorPattern: ['document_creation', 'status_inquiry', 'document_modification']
      };

      // Act
      const result = await automationFramework.predictNextActions(userId, currentContext);

      // Assert
      const documentStatusAction = result.predictedActions.find(a => a.action.includes('status'));
      expect(documentStatusAction).toBeDefined();
      expect(documentStatusAction?.probability).toBeGreaterThan(0.7);

      const proactiveAssistance = result.proactiveAssistance[0];
      expect(proactiveAssistance.suggestion).toContain('documents');
      expect(proactiveAssistance.benefit).toContain('30%');
    });
  });

  describe('Resource Optimization', () => {
    it('should optimize resource allocation for maximum throughput', async () => {
      // Arrange
      const activeRequests: UserRequest[] = Array.from({ length: 5 }, (_, i) => ({
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        query: `Request ${i + 1}`,
        requestType: i % 2 === 0 ? 'document_creation' : 'status_inquiry',
        administrativeContext: 'dukcapil',
        priority: i === 0 ? 'urgent' : 'normal',
        timestamp: new Date(),
        metadata: {
          userRole: 'citizen',
          region: 'Jawa Barat',
          deviceType: 'mobile'
        }
      }));

      const availableResources = {
        humanResources: 10,
        systemCapacity: 100,
        processingQueues: ['high_priority', 'normal_priority', 'batch_processing']
      };

      // Act
      const result = await automationFramework.optimizeResourceAllocation(activeRequests, availableResources);

      // Assert
      expect(result.optimizedAllocation).toHaveLength(5);
      expect(result.throughputImprovement).toBe(0.25); // 25% improvement
      expect(result.bottleneckMitigation).toHaveLength(2);

      // Verify allocation structure
      result.optimizedAllocation.forEach(allocation => {
        expect(allocation.requestId).toBeDefined();
        expect(allocation.allocatedResources).toBeDefined();
        expect(allocation.estimatedCompletionTime).toBeGreaterThan(0);
        expect(allocation.priority).toBeGreaterThan(0);
      });

      // Verify urgent requests get higher priority
      const urgentAllocation = result.optimizedAllocation.find(a => 
        activeRequests.find(r => r.id === a.requestId)?.priority === 'urgent'
      );
      expect(urgentAllocation?.priority).toBe(1);
    });

    it('should identify bottleneck mitigation strategies', async () => {
      // Arrange
      const activeRequests: UserRequest[] = Array.from({ length: 10 }, (_, i) => ({
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        query: `High load request ${i + 1}`,
        requestType: 'document_creation',
        administrativeContext: 'dukcapil',
        priority: 'normal',
        timestamp: new Date(),
        metadata: {
          userRole: 'citizen',
          region: 'Jawa Barat',
          deviceType: 'mobile'
        }
      }));

      const limitedResources = {
        humanResources: 3, // Limited human resources
        systemCapacity: 20, // Limited system capacity
        processingQueues: ['single_queue'] // Single queue bottleneck
      };

      // Act
      const result = await automationFramework.optimizeResourceAllocation(activeRequests, limitedResources);

      // Assert
      expect(result.bottleneckMitigation).toContain('Add parallel processing queues');
      expect(result.bottleneckMitigation).toContain('Implement smart load balancing');
      expect(result.throughputImprovement).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring and Metrics', () => {
    it('should provide comprehensive framework performance metrics', async () => {
      // Arrange - Execute some automations first
      const userRequest: UserRequest = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        query: 'Test automation',
        requestType: 'document_creation',
        administrativeContext: 'dukcapil',
        priority: 'normal',
        timestamp: new Date(),
        metadata: {
          userRole: 'citizen',
          region: 'Jawa Barat',
          deviceType: 'mobile'
        }
      };

      const administrativeContext: AdministrativeContext = {
        system: 'dukcapil',
        department: 'Test Department',
        region: 'Jawa Barat',
        administrativeLevel: 'kabupaten',
        workingHours: {
          start: '08:00',
          end: '16:00',
          timezone: 'Asia/Jakarta'
        },
        capacity: {
          maxConcurrentRequests: 50,
          averageProcessingTime: 600000,
          staffAvailability: 0.8
        }
      };

      // Execute automation to populate metrics
      await automationFramework.analyzeAndAutomateWorkflow(userRequest, administrativeContext);

      // Act
      const metrics = await automationFramework.getFrameworkMetrics();

      // Assert
      expect(metrics.totalAutomations).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0.9);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.bottleneckReduction).toBe(0.35); // 35% bottleneck reduction
      expect(metrics.userSatisfactionScore).toBeGreaterThan(0.8);
    });

    it('should track automation status for monitoring', async () => {
      // Arrange
      const userRequest: UserRequest = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        query: 'Status tracking test',
        requestType: 'status_inquiry',
        administrativeContext: 'dukcapil',
        priority: 'normal',
        timestamp: new Date(),
        metadata: {
          userRole: 'citizen',
          region: 'Jawa Barat',
          deviceType: 'mobile'
        }
      };

      const administrativeContext: AdministrativeContext = {
        system: 'dukcapil',
        department: 'Test Department',
        region: 'Jawa Barat',
        administrativeLevel: 'kabupaten',
        workingHours: {
          start: '08:00',
          end: '16:00',
          timezone: 'Asia/Jakarta'
        },
        capacity: {
          maxConcurrentRequests: 50,
          averageProcessingTime: 300000,
          staffAvailability: 0.9
        }
      };

      // Act
      const automationResult = await automationFramework.analyzeAndAutomateWorkflow(userRequest, administrativeContext);
      const status = await automationFramework.getAutomationStatus(automationResult.executionId);

      // Assert
      expect(status).toBeDefined();
      expect(status?.executionId).toBe(automationResult.executionId);
      expect(status?.status).toBe(automationResult.status);
      expect(status?.progress).toBe(automationResult.progress);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid user requests gracefully', async () => {
      // Arrange
      const invalidRequest = {
        id: 'invalid-id', // Not a UUID
        userId: crypto.randomUUID(),
        query: '',
        requestType: 'invalid_type',
        administrativeContext: 'invalid_context',
        priority: 'invalid_priority',
        timestamp: new Date(),
        metadata: {
          userRole: 'citizen',
          region: 'Jawa Barat'
        }
      };

      const validContext: AdministrativeContext = {
        system: 'dukcapil',
        department: 'Test Department',
        region: 'Jawa Barat',
        administrativeLevel: 'kabupaten',
        workingHours: {
          start: '08:00',
          end: '16:00',
          timezone: 'Asia/Jakarta'
        },
        capacity: {
          maxConcurrentRequests: 50,
          averageProcessingTime: 600000,
          staffAvailability: 0.8
        }
      };

      // Act & Assert
      await expect(
        automationFramework.analyzeAndAutomateWorkflow(invalidRequest as any, validContext)
      ).rejects.toThrow();

      expect(mockAuditLogger.logReasoningError).toHaveBeenCalled();
    });
  });
});

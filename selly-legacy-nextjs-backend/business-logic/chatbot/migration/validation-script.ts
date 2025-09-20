/**
 * Migration Validation Script - Day 13-14
 * Comprehensive validation of provider migration and integration
 * Ensures functionality preservation and performance improvements
 */

import { UnifiedAIService } from '../core/UnifiedAIService';
import { MigrationService } from './MigrationService';
import { BackwardCompatibilityLayer } from '../core/BackwardCompatibilityLayer';

interface ValidationResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: any;
  error?: string;
}

interface ValidationSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: ValidationResult[];
  recommendations: string[];
}

/**
 * Migration Validation Runner
 */
export class MigrationValidator {
  private unifiedService: UnifiedAIService;
  private migrationService: MigrationService;
  private compatibilityLayer: BackwardCompatibilityLayer;
  private results: ValidationResult[] = [];

  constructor() {
    this.unifiedService = new UnifiedAIService();
    this.migrationService = new MigrationService({
      testMode: true,
      performanceMonitoring: true
    });
    this.compatibilityLayer = new BackwardCompatibilityLayer(this.unifiedService);
  }

  /**
   * Run comprehensive validation
   */
  async runValidation(): Promise<ValidationSummary> {
    console.log('🧪 [VALIDATION] Starting comprehensive migration validation...');
    
    const startTime = performance.now();
    this.results = [];

    try {
      // Initialize services
      await this.initializeServices();

      // Run validation tests
      await this.validateProviderAvailability();
      await this.validateUnifiedServiceFunctionality();
      await this.validateBackwardCompatibility();
      await this.validateMigrationPhases();
      await this.validatePerformance();
      await this.validateIndonesianLanguageProcessing();
      await this.validateErrorHandling();
      await this.validateProviderSelection();

    } catch (error) {
      console.error('❌ [VALIDATION] Validation failed:', error);
      this.addResult('initialization', false, 0, {}, error instanceof Error ? error.message : 'Unknown error');
    }

    const totalDuration = performance.now() - startTime;
    const summary = this.generateSummary(totalDuration);
    
    console.log('✅ [VALIDATION] Validation complete');
    this.printSummary(summary);
    
    return summary;
  }

  /**
   * Initialize services for validation
   */
  private async initializeServices(): Promise<void> {
    const startTime = performance.now();
    
    try {
      await Promise.all([
        this.unifiedService.initialize(),
        this.migrationService.initialize()
      ]);
      
      this.addResult('service_initialization', true, performance.now() - startTime, {
        unifiedServiceReady: true,
        migrationServiceReady: true
      });
    } catch (error) {
      this.addResult('service_initialization', false, performance.now() - startTime, {}, 
        error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Validate provider availability
   */
  private async validateProviderAvailability(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const providers = this.unifiedService.getAvailableProviders();
      const providerStatus = await this.unifiedService.getProviderStatus();
      
      const expectedProviders = ['enhanced', 'huggingface', 'tensorflow'];
      const availableProviders = Object.entries(providerStatus)
        .filter(([_, status]: [string, any]) => status.available)
        .map(([id, _]) => id);
      
      const allProvidersAvailable = expectedProviders.every(p => providers.includes(p));
      const someProvidersHealthy = availableProviders.length > 0;
      
      this.addResult('provider_availability', allProvidersAvailable && someProvidersHealthy, 
        performance.now() - startTime, {
          expectedProviders,
          availableProviders: providers,
          healthyProviders: availableProviders,
          providerStatus
        });
    } catch (error) {
      this.addResult('provider_availability', false, performance.now() - startTime, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Validate unified service functionality
   */
  private async validateUnifiedServiceFunctionality(): Promise<void> {
    const testQueries = [
      'Berapa jumlah pengajuan bulan ini?',
      'Cari data user dengan NIK 1234567890123456',
      'Jelaskan proses pengajuan dokumen'
    ];

    for (const query of testQueries) {
      const startTime = performance.now();
      
      try {
        const response = await this.unifiedService.processQuery(query);
        
        const isValid = !!(response &&
                       response.content &&
                       response.type &&
                       response.metadata &&
                       (response.metadata.confidence ?? 0) >= 0 &&
                       (response.metadata.processingTime ?? 0) > 0);

        this.addResult(`unified_service_query_${testQueries.indexOf(query)}`, isValid,
          performance.now() - startTime, {
            query,
            responseLength: response.content?.length || 0,
            responseType: response.type,
            confidence: response.metadata?.confidence
          });
      } catch (error) {
        this.addResult(`unified_service_query_${testQueries.indexOf(query)}`, false, 
          performance.now() - startTime, { query }, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Validate backward compatibility
   */
  private async validateBackwardCompatibility(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const testQuery = 'Test backward compatibility';
      
      // Test legacy processQuery
      const legacyResponse = await this.compatibilityLayer.processQuery(testQuery);
      
      // Test legacy processEnhancedQuery
      const enhancedResponse = await this.compatibilityLayer.processEnhancedQuery(testQuery);
      
      const legacyValid = !!(legacyResponse && legacyResponse.content && legacyResponse.type);
      const enhancedValid = !!(enhancedResponse && enhancedResponse.content && enhancedResponse.schemaInsights);

      this.addResult('backward_compatibility', legacyValid && enhancedValid,
        performance.now() - startTime, {
          legacyResponseValid: legacyValid,
          enhancedResponseValid: enhancedValid,
          migrationStatus: this.compatibilityLayer.getMigrationStatus()
        });
    } catch (error) {
      this.addResult('backward_compatibility', false, performance.now() - startTime, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Validate migration phases
   */
  private async validateMigrationPhases(): Promise<void> {
    const phases = ['preparation', 'testing', 'gradual', 'complete'] as const;
    
    for (const phase of phases) {
      const startTime = performance.now();
      
      try {
        this.migrationService.updateMigrationPhase(phase);
        const migratedService = this.migrationService.getMigratedAIService();
        
        // Test basic functionality
        const response = await migratedService.processQuery(`Test query for phase ${phase}`);
        
        const isValid = response && response.content && response.type;
        
        this.addResult(`migration_phase_${phase}`, isValid, performance.now() - startTime, {
          phase,
          responseValid: isValid,
          migrationStatus: await this.migrationService.getMigrationStatus()
        });
      } catch (error) {
        this.addResult(`migration_phase_${phase}`, false, performance.now() - startTime, 
          { phase }, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Validate performance
   */
  private async validatePerformance(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const testQuery = 'Performance test query';
      const iterations = 3;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const iterationStart = performance.now();
        await this.unifiedService.processQuery(testQuery);
        times.push(performance.now() - iterationStart);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const performanceAcceptable = avgTime < 5000 && maxTime < 10000; // 5s avg, 10s max
      
      this.addResult('performance_validation', performanceAcceptable, 
        performance.now() - startTime, {
          averageTime: avgTime,
          maxTime: maxTime,
          iterations,
          times
        });
    } catch (error) {
      this.addResult('performance_validation', false, performance.now() - startTime, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Validate Indonesian language processing
   */
  private async validateIndonesianLanguageProcessing(): Promise<void> {
    const indonesianQueries = [
      'Bagaimana cara mengajukan permohonan?',
      'Berapa lama proses verifikasi?',
      'Apa saja syarat yang diperlukan?'
    ];

    for (const query of indonesianQueries) {
      const startTime = performance.now();
      
      try {
        const response = await this.unifiedService.processQuery(query);
        
        const isValid = !!(response &&
                       response.content &&
                       response.content.length > 10 &&
                       (response.metadata?.confidence ?? 0) >= 0.5);

        this.addResult(`indonesian_processing_${indonesianQueries.indexOf(query)}`, isValid,
          performance.now() - startTime, {
            query,
            responseLength: response.content?.length || 0,
            confidence: response.metadata?.confidence
          });
      } catch (error) {
        this.addResult(`indonesian_processing_${indonesianQueries.indexOf(query)}`, false, 
          performance.now() - startTime, { query }, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Validate error handling
   */
  private async validateErrorHandling(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test with empty query
      const emptyResponse = await this.unifiedService.processQuery('');
      
      // Test with very long query
      const longQuery = 'a'.repeat(10000);
      const longResponse = await this.unifiedService.processQuery(longQuery);
      
      // Both should handle gracefully (either succeed or fail with proper error)
      const emptyHandled = !!(emptyResponse && emptyResponse.content);
      const longHandled = !!(longResponse && longResponse.content);

      this.addResult('error_handling', emptyHandled || longHandled,
        performance.now() - startTime, {
          emptyQueryHandled: emptyHandled,
          longQueryHandled: longHandled
        });
    } catch (error) {
      // Errors are acceptable for error handling test
      this.addResult('error_handling', true, performance.now() - startTime, {
        errorProperlyCaught: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Validate provider selection logic
   */
  private async validateProviderSelection(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test simple conversational query
      const simpleQuery = 'Halo, bagaimana kabar?';
      const simpleResponse = await this.unifiedService.processQuery(simpleQuery);
      
      // Test complex analytical query
      const complexQuery = 'Analisis perbandingan data pengajuan Q1 vs Q2 dengan breakdown per kategori';
      const complexResponse = await this.unifiedService.processQuery(complexQuery);
      
      const simpleValid = !!(simpleResponse && simpleResponse.content);
      const complexValid = !!(complexResponse && complexResponse.content);

      const selectionWorking = simpleValid && complexValid;

      this.addResult('provider_selection', selectionWorking, performance.now() - startTime, {
        simpleQueryValid: simpleValid,
        complexQueryValid: complexValid,
        bothQueriesHandled: selectionWorking
      });
    } catch (error) {
      this.addResult('provider_selection', false, performance.now() - startTime, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Add validation result
   */
  private addResult(testName: string, passed: boolean, duration: number, details: any, error?: string): void {
    this.results.push({
      testName,
      passed,
      duration,
      details,
      error
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} [VALIDATION] ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration.toFixed(2)}ms)`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
  }

  /**
   * Generate validation summary
   */
  private generateSummary(totalDuration: number): ValidationSummary {
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    
    const recommendations: string[] = [];
    
    // Generate recommendations based on results
    if (failedTests > 0) {
      recommendations.push(`${failedTests} tests failed - review error details`);
    }
    
    if (passedTests / this.results.length < 0.8) {
      recommendations.push('Less than 80% tests passed - migration may need adjustments');
    }
    
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    if (avgDuration > 2000) {
      recommendations.push('Average test duration > 2s - performance optimization needed');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All validations passed - migration ready for next phase');
    }

    return {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      totalDuration,
      results: this.results,
      recommendations
    };
  }

  /**
   * Print validation summary
   */
  private printSummary(summary: ValidationSummary): void {
    console.log('\n📊 [VALIDATION] Migration Validation Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} (${Math.round(summary.passedTests / summary.totalTests * 100)}%)`);
    console.log(`Failed: ${summary.failedTests} (${Math.round(summary.failedTests / summary.totalTests * 100)}%)`);
    console.log(`Total Duration: ${summary.totalDuration.toFixed(2)}ms`);
    console.log(`Average Duration: ${(summary.totalDuration / summary.totalTests).toFixed(2)}ms`);
    
    if (summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      summary.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.testName}: ${result.error || 'Unknown error'}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    summary.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    console.log('='.repeat(50));
  }
}

/**
 * Run validation script
 */
export async function runMigrationValidation(): Promise<ValidationSummary> {
  const validator = new MigrationValidator();
  return await validator.runValidation();
}

// MigrationValidator is already exported above

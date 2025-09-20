/**
 * Schema Intelligence Validator - Day 18-19: Schema Intelligence Unification
 * Comprehensive validation of schema intelligence consolidation
 * Ensures functionality preservation and performance improvements
 */

import { SchemaIntelligenceProcessor } from './processors/SchemaIntelligenceProcessor';
import { schemaIntelligenceMigration } from './SchemaIntelligenceMigration';

export interface SchemaValidationConfig {
  enableFunctionalityTests: boolean;
  enablePerformanceTests: boolean;
  enableCompatibilityTests: boolean;
  enableRegressionTests: boolean;
  testTimeout: number;
  performanceThreshold: number;
}

export interface SchemaValidationResult {
  testName: string;
  category: string;
  passed: boolean;
  duration: number;
  unifiedResult?: any;
  legacyResult?: any;
  differences?: string[];
  performance?: {
    unifiedTime: number;
    legacyTime: number;
    improvement: number;
  };
  details: any;
  error?: string;
}

export interface SchemaValidationSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  categories: Record<string, { passed: number; failed: number }>;
  overallDuration: number;
  performanceMetrics: {
    averageImprovement: number;
    maxImprovement: number;
    regressionCount: number;
  };
  functionalityPreservation: number;
  results: SchemaValidationResult[];
  recommendations: string[];
}

/**
 * Schema Intelligence Validator
 * Comprehensive validation of schema intelligence consolidation
 */
export class SchemaIntelligenceValidator {
  private config: SchemaValidationConfig;
  private unifiedProcessor: SchemaIntelligenceProcessor;
  private results: SchemaValidationResult[] = [];

  constructor(config: Partial<SchemaValidationConfig> = {}) {
    this.config = {
      enableFunctionalityTests: true,
      enablePerformanceTests: true,
      enableCompatibilityTests: true,
      enableRegressionTests: true,
      testTimeout: 30000, // 30 seconds
      performanceThreshold: 0.8, // 80% of legacy performance
      ...config
    };

    this.unifiedProcessor = new SchemaIntelligenceProcessor();
  }

  /**
   * Run comprehensive schema intelligence validation
   */
  async runValidation(): Promise<SchemaValidationSummary> {
    console.log('🧪 [SCHEMA_VALIDATOR] Starting comprehensive schema intelligence validation...');
    
    const startTime = performance.now();
    this.results = [];

    try {
      // Initialize services
      await this.initializeServices();

      // Run validation categories
      if (this.config.enableFunctionalityTests) {
        await this.runFunctionalityTests();
      }

      if (this.config.enablePerformanceTests) {
        await this.runPerformanceTests();
      }

      if (this.config.enableCompatibilityTests) {
        await this.runCompatibilityTests();
      }

      if (this.config.enableRegressionTests) {
        await this.runRegressionTests();
      }

    } catch (error) {
      console.error('❌ [SCHEMA_VALIDATOR] Validation failed:', error);
      this.addResult('initialization', 'setup', false, 0, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }

    const overallDuration = performance.now() - startTime;
    const summary = this.generateSummary(overallDuration);
    
    console.log('✅ [SCHEMA_VALIDATOR] Schema intelligence validation complete');
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
        this.unifiedProcessor.initialize(),
        schemaIntelligenceMigration.initialize()
      ]);
      
      this.addResult('service_initialization', 'setup', true, performance.now() - startTime, {
        unifiedProcessorReady: true,
        migrationServiceReady: true
      });
    } catch (error) {
      this.addResult('service_initialization', 'setup', false, performance.now() - startTime, {}, 
        error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Test functionality preservation
   */
  private async runFunctionalityTests(): Promise<void> {
    console.log('🔧 [SCHEMA_VALIDATOR] Running functionality tests...');

    const testCases = [
      {
        name: 'basic_schema_analysis',
        query: 'Analisis struktur tabel pengajuan_bulanan',
        expectedFeatures: ['suggestedColumns', 'tableRelationships', 'optimizationSuggestions']
      },
      {
        name: 'enhanced_column_intelligence',
        query: 'Berikan deep column intelligence untuk tabel aktivitas_user',
        expectedFeatures: ['businessContext', 'deepColumnIntelligence', 'workflowIntelligence']
      },
      {
        name: 'administrative_domain_analysis',
        query: 'Analisis domain administratif untuk pengajuan KTP',
        expectedFeatures: ['administrativeContext', 'businessRules', 'workflowStages']
      },
      {
        name: 'query_optimization',
        query: 'Optimasi query untuk join antara pengajuan_bulanan dan aktivitas_user',
        expectedFeatures: ['optimizedQuery', 'suggestions', 'performanceImprovements']
      },
      {
        name: 'business_context_analysis',
        query: 'Business context analysis untuk workflow pengajuan dokumen',
        expectedFeatures: ['businessQueryContext', 'workflowIntelligence', 'businessInsights']
      }
    ];

    for (const testCase of testCases) {
      await this.runFunctionalityTest(testCase);
    }
  }

  /**
   * Run individual functionality test
   */
  private async runFunctionalityTest(testCase: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test unified processor
      const unifiedResult = await this.unifiedProcessor.process(testCase.query, {
        businessContext: 'schema_intelligence'
      });

      // Validate expected features
      const featureValidation = this.validateExpectedFeatures(unifiedResult, testCase.expectedFeatures);
      
      const passed = unifiedResult.success && featureValidation.allPresent;
      
      this.addResult(testCase.name, 'functionality', passed, performance.now() - startTime, {
        unifiedResult,
        featureValidation,
        expectedFeatures: testCase.expectedFeatures
      });
    } catch (error) {
      this.addResult(testCase.name, 'functionality', false, performance.now() - startTime, 
        { testCase }, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test performance improvements
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('⚡ [SCHEMA_VALIDATOR] Running performance tests...');

    const performanceQueries = [
      'Analisis schema untuk tabel pengajuan_bulanan',
      'Deep column intelligence untuk semua tabel',
      'Optimasi query kompleks dengan multiple joins',
      'Business context analysis untuk workflow lengkap'
    ];

    for (const query of performanceQueries) {
      await this.runPerformanceTest(query);
    }
  }

  /**
   * Run individual performance test
   */
  private async runPerformanceTest(query: string): Promise<void> {
    const iterations = 3;
    const unifiedTimes: number[] = [];
    const legacyTimes: number[] = [];

    // Test unified processor
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      try {
        await this.unifiedProcessor.process(query, { businessContext: 'schema_intelligence' });
        unifiedTimes.push(performance.now() - startTime);
      } catch (error) {
        unifiedTimes.push(Infinity);
      }
    }

    // Test legacy service (mock)
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      try {
        await this.mockLegacySchemaService(query);
        legacyTimes.push(performance.now() - startTime);
      } catch (error) {
        legacyTimes.push(Infinity);
      }
    }

    const avgUnified = this.calculateAverage(unifiedTimes);
    const avgLegacy = this.calculateAverage(legacyTimes);
    const improvement = avgLegacy > 0 ? ((avgLegacy - avgUnified) / avgLegacy) * 100 : 0;
    
    const passed = avgUnified < avgLegacy * (1 / this.config.performanceThreshold);
    
    this.addResult(`performance_${query.substring(0, 20)}`, 'performance', passed, avgUnified, {
      unifiedTime: avgUnified,
      legacyTime: avgLegacy,
      improvement: improvement,
      iterations,
      threshold: this.config.performanceThreshold
    });
  }

  /**
   * Test backward compatibility
   */
  private async runCompatibilityTests(): Promise<void> {
    console.log('🔗 [SCHEMA_VALIDATOR] Running compatibility tests...');

    const compatibilityTests = [
      {
        name: 'legacy_api_analyzeQuery',
        method: 'analyzeQuery',
        input: 'Analisis tabel pengajuan_bulanan'
      },
      {
        name: 'legacy_api_getSchemaInsights',
        method: 'getSchemaInsights',
        input: 'aktivitas_user'
      },
      {
        name: 'legacy_api_optimizeQuery',
        method: 'optimizeQuery',
        input: 'SELECT * FROM pengajuan_bulanan WHERE status = "pending"'
      }
    ];

    for (const test of compatibilityTests) {
      await this.runCompatibilityTest(test);
    }
  }

  /**
   * Run individual compatibility test
   */
  private async runCompatibilityTest(test: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test through migration service
      const migrationService = schemaIntelligenceMigration.getMigratedSchemaService();
      const result = await migrationService[test.method](test.input);
      
      const passed = result && result.success !== false;
      
      this.addResult(test.name, 'compatibility', passed, performance.now() - startTime, {
        method: test.method,
        input: test.input,
        result,
        apiCompatible: passed
      });
    } catch (error) {
      this.addResult(test.name, 'compatibility', false, performance.now() - startTime, 
        { test }, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test for regressions
   */
  private async runRegressionTests(): Promise<void> {
    console.log('🔍 [SCHEMA_VALIDATOR] Running regression tests...');

    const regressionTests = [
      {
        name: 'schema_intelligence_features',
        features: ['table_analysis', 'column_mapping', 'relationship_detection']
      },
      {
        name: 'enhanced_schema_features',
        features: ['deep_column_intelligence', 'business_context', 'workflow_intelligence']
      },
      {
        name: 'administrative_domain_features',
        features: ['domain_classification', 'business_rules', 'workflow_stages']
      }
    ];

    for (const test of regressionTests) {
      await this.runRegressionTest(test);
    }
  }

  /**
   * Run individual regression test
   */
  private async runRegressionTest(test: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      const featureResults: Record<string, boolean> = {};
      
      for (const feature of test.features) {
        featureResults[feature] = await this.testFeaturePresence(feature);
      }
      
      const allFeaturesPresent = Object.values(featureResults).every(present => present);
      
      this.addResult(test.name, 'regression', allFeaturesPresent, performance.now() - startTime, {
        features: test.features,
        featureResults,
        allFeaturesPresent
      });
    } catch (error) {
      this.addResult(test.name, 'regression', false, performance.now() - startTime, 
        { test }, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Helper methods
   */
  private validateExpectedFeatures(result: any, expectedFeatures: string[]): any {
    const presentFeatures: string[] = [];
    const missingFeatures: string[] = [];
    
    expectedFeatures.forEach(feature => {
      if (this.hasFeature(result, feature)) {
        presentFeatures.push(feature);
      } else {
        missingFeatures.push(feature);
      }
    });
    
    return {
      presentFeatures,
      missingFeatures,
      allPresent: missingFeatures.length === 0
    };
  }

  private hasFeature(result: any, feature: string): boolean {
    switch (feature) {
      case 'suggestedColumns':
        return result.schemaInsights?.suggestedColumns?.length > 0;
      case 'tableRelationships':
        return result.schemaInsights?.tableRelationships?.length >= 0;
      case 'optimizationSuggestions':
        return result.queryOptimizations?.length >= 0;
      case 'businessContext':
        return !!result.metadata?.businessContext;
      case 'deepColumnIntelligence':
        return !!result.schemaInsights?.deepColumnIntelligence;
      case 'workflowIntelligence':
        return !!result.schemaInsights?.workflowIntelligence;
      case 'administrativeContext':
        return !!result.schemaInsights?.administrativeContext;
      default:
        return false;
    }
  }

  private async testFeaturePresence(feature: string): Promise<boolean> {
    try {
      const testQuery = this.getFeatureTestQuery(feature);
      const result = await this.unifiedProcessor.process(testQuery, {
        businessContext: 'schema_intelligence'
      });
      
      return this.hasFeature(result, feature);
    } catch (error) {
      return false;
    }
  }

  private getFeatureTestQuery(feature: string): string {
    const queries: Record<string, string> = {
      'table_analysis': 'Analisis struktur tabel pengajuan_bulanan',
      'column_mapping': 'Mapping kolom untuk tabel aktivitas_user',
      'relationship_detection': 'Deteksi relasi antar tabel',
      'deep_column_intelligence': 'Deep column intelligence untuk tabel dokumentasi',
      'business_context': 'Business context untuk workflow pengajuan',
      'workflow_intelligence': 'Workflow intelligence untuk proses administratif',
      'domain_classification': 'Klasifikasi domain administratif',
      'business_rules': 'Business rules untuk pengajuan dokumen',
      'workflow_stages': 'Tahapan workflow untuk pengaduan'
    };
    
    return queries[feature] || 'Test query';
  }

  private async mockLegacySchemaService(query: string): Promise<any> {
    // Mock legacy service with realistic delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    return {
      success: true,
      insights: {
        suggestedColumns: ['id', 'nama', 'status'],
        availableAnalytics: ['count', 'group_by'],
        tableRelationships: [],
        dataQualityNotes: ['Mock legacy data'],
        optimizationSuggestions: ['Use indexes']
      }
    };
  }

  private calculateAverage(times: number[]): number {
    const validTimes = times.filter(t => t !== Infinity);
    return validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : Infinity;
  }

  private addResult(testName: string, category: string, passed: boolean, duration: number, details: any, error?: string): void {
    this.results.push({
      testName,
      category,
      passed,
      duration,
      details,
      error
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} [SCHEMA_VALIDATOR] ${category}/${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration.toFixed(2)}ms)`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
  }

  /**
   * Generate validation summary
   */
  private generateSummary(overallDuration: number): SchemaValidationSummary {
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    
    // Calculate category statistics
    const categories: Record<string, { passed: number; failed: number }> = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { passed: 0, failed: 0 };
      }
      if (result.passed) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    });

    // Calculate performance metrics
    const performanceResults = this.results.filter(r => r.category === 'performance' && r.details.improvement !== undefined);
    const improvements = performanceResults.map(r => r.details.improvement).filter(i => i !== Infinity);
    const averageImprovement = improvements.length > 0 ? improvements.reduce((a, b) => a + b, 0) / improvements.length : 0;
    const maxImprovement = improvements.length > 0 ? Math.max(...improvements) : 0;
    const regressionCount = improvements.filter(i => i < 0).length;

    // Calculate functionality preservation
    const functionalityResults = this.results.filter(r => r.category === 'functionality');
    const functionalityPreservation = functionalityResults.length > 0 ? 
      (functionalityResults.filter(r => r.passed).length / functionalityResults.length) * 100 : 100;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (failedTests > 0) {
      recommendations.push(`${failedTests} tests failed - review implementation details`);
    }
    
    if (functionalityPreservation < 95) {
      recommendations.push(`Functionality preservation ${functionalityPreservation.toFixed(1)}% below 95% - review feature completeness`);
    }
    
    if (averageImprovement < 0) {
      recommendations.push(`Average performance regression ${Math.abs(averageImprovement).toFixed(1)}% - optimize unified processor`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All schema intelligence validation tests passed - consolidation successful');
    }

    return {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      categories,
      overallDuration,
      performanceMetrics: {
        averageImprovement,
        maxImprovement,
        regressionCount
      },
      functionalityPreservation,
      results: this.results,
      recommendations
    };
  }

  /**
   * Print validation summary
   */
  private printSummary(summary: SchemaValidationSummary): void {
    console.log('\n📊 [SCHEMA_VALIDATOR] Schema Intelligence Validation Summary');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} (${Math.round(summary.passedTests / summary.totalTests * 100)}%)`);
    console.log(`Failed: ${summary.failedTests} (${Math.round(summary.failedTests / summary.totalTests * 100)}%)`);
    console.log(`Overall Duration: ${summary.overallDuration.toFixed(2)}ms`);
    console.log(`Functionality Preservation: ${summary.functionalityPreservation.toFixed(1)}%`);
    
    console.log('\n📈 Performance Metrics:');
    console.log(`Average Improvement: ${summary.performanceMetrics.averageImprovement.toFixed(1)}%`);
    console.log(`Max Improvement: ${summary.performanceMetrics.maxImprovement.toFixed(1)}%`);
    console.log(`Performance Regressions: ${summary.performanceMetrics.regressionCount}`);
    
    console.log('\n📋 Category Breakdown:');
    Object.entries(summary.categories).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed;
      const passRate = (stats.passed / total * 100).toFixed(1);
      console.log(`  ${category}: ${stats.passed}/${total} passed (${passRate}%)`);
    });
    
    if (summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      summary.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.category}/${result.testName}: ${result.error || 'Test failed'}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    summary.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    console.log('='.repeat(70));
  }
}

// Export for use in tests or standalone execution
export const schemaIntelligenceValidator = new SchemaIntelligenceValidator();

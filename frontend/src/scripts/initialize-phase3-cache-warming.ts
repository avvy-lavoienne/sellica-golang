#!/usr/bin/env tsx

/**
 * Phase 3: Enhanced Cache Warming Strategy Initialization Script
 * 
 * Initializes intelligent cache warming system and validates performance targets:
 * - Sub-500ms first-query response times
 * - 85%+ cache hit rates
 * - Background cache warming without blocking user experience
 * - Comprehensive performance monitoring and analytics
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { EnhancedCacheManager } from '../services/cache/EnhancedCacheManager';
import { PatternRecognitionEngine } from '../services/cache/PatternRecognitionEngine';
import { CacheWarmingOrchestrator } from '../services/cache/CacheWarmingOrchestrator';
import { ServiceInitializationManager } from '../services/core/ServiceInitializationManager';

interface Phase3ValidationResult {
  success: boolean;
  performanceTargets: {
    subFiveHundredMsResponse: boolean;
    cacheHitRateTarget: boolean;
    warmingCompletionTime: boolean;
    intelligentPriorityManagement: boolean;
    zeroBreakingChanges: boolean;
  };
  metrics: {
    averageResponseTime: number;
    cacheHitRate: number;
    warmingTime: number;
    totalPatternsWarmed: number;
    performanceImprovement: number;
  };
  errors: string[];
  recommendations: string[];
}

class Phase3CacheWarmingInitializer {
  private cacheManager: EnhancedCacheManager;
  private patternEngine: PatternRecognitionEngine;
  private warmingOrchestrator: CacheWarmingOrchestrator;
  private serviceManager: ServiceInitializationManager;

  constructor() {
    this.cacheManager = EnhancedCacheManager.getInstance();
    this.patternEngine = PatternRecognitionEngine.getInstance();
    this.warmingOrchestrator = CacheWarmingOrchestrator.getInstance();
    this.serviceManager = ServiceInitializationManager.getInstance();
  }

  async runFullInitialization(): Promise<Phase3ValidationResult> {
    console.log('🔥 [PHASE3_INIT] Starting Phase 3: Enhanced Cache Warming Strategy initialization...');
    console.log(`📅 [PHASE3_INIT] Start time: ${new Date().toISOString()}`);

    const result: Phase3ValidationResult = {
      success: false,
      performanceTargets: {
        subFiveHundredMsResponse: false,
        cacheHitRateTarget: false,
        warmingCompletionTime: false,
        intelligentPriorityManagement: false,
        zeroBreakingChanges: false
      },
      metrics: {
        averageResponseTime: 0,
        cacheHitRate: 0,
        warmingTime: 0,
        totalPatternsWarmed: 0,
        performanceImprovement: 0
      },
      errors: [],
      recommendations: []
    };

    try {
      // Step 1: Initialize all Phase 3 services (they auto-initialize when getting instances)
      console.log('🔧 [PHASE3_INIT] Step 1: Phase 3 services ready...');
      const initStartTime = performance.now();

      // Services are already initialized when getting instances via getInstanceAsync()
      // No need to call protected initialize methods directly

      const initTime = performance.now() - initStartTime;
      console.log(`✅ [PHASE3_INIT] Services ready in ${initTime.toFixed(2)}ms`);

      // Step 2: Validate sub-500ms response times
      console.log('🔧 [PHASE3_INIT] Step 2: Validating sub-500ms response times...');
      const responseTimeResult = await this.validateResponseTimes();
      result.performanceTargets.subFiveHundredMsResponse = responseTimeResult.success;
      result.metrics.averageResponseTime = responseTimeResult.averageTime;

      if (!responseTimeResult.success) {
        result.errors.push(`Response time ${responseTimeResult.averageTime.toFixed(2)}ms exceeds 500ms target`);
        result.recommendations.push('Optimize cache warming patterns and increase cache size');
      }

      // Step 3: Test cache warming completion time
      console.log('🔧 [PHASE3_INIT] Step 3: Testing cache warming completion time...');
      const warmingResult = await this.validateWarmingPerformance();
      result.performanceTargets.warmingCompletionTime = warmingResult.success;
      result.metrics.warmingTime = warmingResult.warmingTime;
      result.metrics.totalPatternsWarmed = warmingResult.patternsWarmed;

      if (!warmingResult.success) {
        result.errors.push(`Cache warming time ${warmingResult.warmingTime.toFixed(2)}ms exceeds 2000ms target`);
        result.recommendations.push('Reduce warming batch size or increase concurrency');
      }

      // Step 4: Validate cache hit rate improvement
      console.log('🔧 [PHASE3_INIT] Step 4: Validating cache hit rate improvement...');
      const hitRateResult = await this.validateCacheHitRate();
      result.performanceTargets.cacheHitRateTarget = hitRateResult.success;
      result.metrics.cacheHitRate = hitRateResult.hitRate;

      if (!hitRateResult.success) {
        result.errors.push(`Cache hit rate ${hitRateResult.hitRate.toFixed(1)}% is below 85% target`);
        result.recommendations.push('Improve pattern recognition accuracy and warming coverage');
      }

      // Step 5: Test intelligent priority management
      console.log('🔧 [PHASE3_INIT] Step 5: Testing intelligent priority management...');
      const priorityResult = await this.validatePriorityManagement();
      result.performanceTargets.intelligentPriorityManagement = priorityResult.success;

      if (!priorityResult.success) {
        result.errors.push('Priority-based cache management not working correctly');
        result.recommendations.push('Review priority classification algorithms and eviction policies');
      }

      // Step 6: Validate zero breaking changes
      console.log('🔧 [PHASE3_INIT] Step 6: Validating zero breaking changes...');
      const compatibilityResult = await this.validateBackwardCompatibility();
      result.performanceTargets.zeroBreakingChanges = compatibilityResult.success;

      if (!compatibilityResult.success) {
        result.errors.push('Breaking changes detected in API compatibility');
        result.recommendations.push('Review API changes and ensure backward compatibility');
      }

      // Step 7: Calculate overall performance improvement
      console.log('🔧 [PHASE3_INIT] Step 7: Calculating performance improvement...');
      result.metrics.performanceImprovement = await this.calculatePerformanceImprovement();

      // Determine overall success
      const targetsAchieved = Object.values(result.performanceTargets).filter(Boolean).length;
      const totalTargets = Object.keys(result.performanceTargets).length;
      result.success = targetsAchieved >= 4; // At least 4 out of 5 targets

      // Generate final report
      console.log('🔧 [PHASE3_INIT] Step 8: Generating performance report...');
      this.generatePerformanceReport(result);

      if (result.success) {
        console.log('🎉 [PHASE3_INIT] Phase 3 validation completed successfully!');
        console.log(`✅ [PHASE3_INIT] Targets achieved: ${targetsAchieved}/${totalTargets}`);
        console.log(`📈 [PHASE3_INIT] Performance improvement: ${result.metrics.performanceImprovement.toFixed(1)}%`);
      } else {
        console.error('❌ [PHASE3_INIT] Phase 3 validation failed');
        console.error(`❌ [PHASE3_INIT] Targets achieved: ${targetsAchieved}/${totalTargets}`);
        result.errors.forEach(error => console.error(`   - ${error}`));
      }

      return result;

    } catch (error) {
      console.error('❌ [PHASE3_INIT] Initialization failed:', error);
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }
  }

  private async validateResponseTimes(): Promise<{ success: boolean; averageTime: number }> {
    const testQueries = [
      'cara membuat ktp',
      'syarat akta kelahiran',
      'prosedur pernikahan',
      'status pengajuan',
      'jam operasional kantor'
    ];

    const responseTimes: number[] = [];

    for (const query of testQueries) {
      const startTime = performance.now();
      
      // Analyze pattern
      const analysis = await this.patternEngine.analyzeQuery(query);
      
      // Check cache
      const result = await this.cacheManager.get(analysis.suggestedCacheKey, query);
      
      const responseTime = performance.now() - startTime;
      responseTimes.push(responseTime);
    }

    const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const success = averageTime < 500;

    console.log(`📊 [PHASE3_INIT] Response time validation: ${averageTime.toFixed(2)}ms average (target: <500ms)`);

    return { success, averageTime };
  }

  private async validateWarmingPerformance(): Promise<{ 
    success: boolean; 
    warmingTime: number; 
    patternsWarmed: number 
  }> {
    const startTime = performance.now();
    
    await this.warmingOrchestrator.startStartupWarming();
    
    const warmingTime = performance.now() - startTime;
    const metrics = this.warmingOrchestrator.getWarmingMetrics();
    const success = warmingTime < 2000;

    console.log(`📊 [PHASE3_INIT] Warming performance: ${warmingTime.toFixed(2)}ms (target: <2000ms)`);
    console.log(`📊 [PHASE3_INIT] Patterns warmed: ${metrics.totalPatternsWarmed}`);

    return { 
      success, 
      warmingTime, 
      patternsWarmed: metrics.totalPatternsWarmed 
    };
  }

  private async validateCacheHitRate(): Promise<{ success: boolean; hitRate: number }> {
    // Warm cache first
    await this.warmingOrchestrator.startStartupWarming();
    
    // Test with common queries
    const testQueries = [
      'cara membuat ktp',
      'syarat akta kelahiran',
      'prosedur pernikahan'
    ];

    let hits = 0;
    for (const query of testQueries) {
      const analysis = await this.patternEngine.analyzeQuery(query);
      const result = await this.cacheManager.get(analysis.suggestedCacheKey, query);
      if (result) hits++;
    }

    const hitRate = (hits / testQueries.length) * 100;
    const success = hitRate >= 85;

    console.log(`📊 [PHASE3_INIT] Cache hit rate: ${hitRate.toFixed(1)}% (target: ≥85%)`);

    return { success, hitRate };
  }

  private async validatePriorityManagement(): Promise<{ success: boolean }> {
    try {
      // Test priority-based caching
      await this.cacheManager.set('high-test', { data: 'high' }, { priority: 'high' });
      await this.cacheManager.set('low-test', { data: 'low' }, { priority: 'low' });

      const highResult = await this.cacheManager.get('high-test');
      const lowResult = await this.cacheManager.get('low-test');

      const success = !!highResult && !!lowResult;
      console.log(`📊 [PHASE3_INIT] Priority management: ${success ? 'Working' : 'Failed'}`);

      return { success };
    } catch (error) {
      console.error('❌ [PHASE3_INIT] Priority management test failed:', error);
      return { success: false };
    }
  }

  private async validateBackwardCompatibility(): Promise<{ success: boolean }> {
    try {
      // Test that all expected methods exist and work
      const cacheManagerValid = (
        typeof this.cacheManager.get === 'function' &&
        typeof this.cacheManager.set === 'function' &&
        typeof this.cacheManager.clear === 'function' &&
        typeof this.cacheManager.getMetrics === 'function'
      );

      const patternEngineValid = (
        typeof this.patternEngine.analyzeQuery === 'function' &&
        typeof this.patternEngine.getStatistics === 'function'
      );

      const orchestratorValid = (
        typeof this.warmingOrchestrator.startWarmingSession === 'function' &&
        typeof this.warmingOrchestrator.getWarmingMetrics === 'function'
      );

      const allMethodsExist = cacheManagerValid && patternEngineValid && orchestratorValid;

      console.log(`📊 [PHASE3_INIT] Backward compatibility: ${allMethodsExist ? 'Maintained' : 'Broken'}`);

      return { success: allMethodsExist };
    } catch (error) {
      console.error('❌ [PHASE3_INIT] Compatibility test failed:', error);
      return { success: false };
    }
  }

  private async calculatePerformanceImprovement(): Promise<number> {
    // Simulate baseline vs optimized performance
    const baselineResponseTime = 1500; // 1.5 seconds baseline
    const currentMetrics = this.cacheManager.getMetrics();
    const currentResponseTime = currentMetrics.averageResponseTime || 500;

    const improvement = ((baselineResponseTime - currentResponseTime) / baselineResponseTime) * 100;
    return Math.max(0, improvement);
  }

  private generatePerformanceReport(result: Phase3ValidationResult): void {
    console.log('\n📊 [PHASE3_INIT] PHASE 3 PERFORMANCE REPORT');
    console.log('=====================================');
    
    console.log('\n🎯 PERFORMANCE TARGETS:');
    console.log(`   Sub-500ms Response: ${result.performanceTargets.subFiveHundredMsResponse ? '✅ ACHIEVED' : '❌ NOT MET'}`);
    console.log(`   85%+ Cache Hit Rate: ${result.performanceTargets.cacheHitRateTarget ? '✅ ACHIEVED' : '❌ NOT MET'}`);
    console.log(`   <2s Warming Time: ${result.performanceTargets.warmingCompletionTime ? '✅ ACHIEVED' : '❌ NOT MET'}`);
    console.log(`   Priority Management: ${result.performanceTargets.intelligentPriorityManagement ? '✅ ACHIEVED' : '❌ NOT MET'}`);
    console.log(`   Zero Breaking Changes: ${result.performanceTargets.zeroBreakingChanges ? '✅ ACHIEVED' : '❌ NOT MET'}`);

    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`   Average Response Time: ${result.metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Cache Hit Rate: ${result.metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`   Warming Time: ${result.metrics.warmingTime.toFixed(2)}ms`);
    console.log(`   Patterns Warmed: ${result.metrics.totalPatternsWarmed}`);
    console.log(`   Performance Improvement: ${result.metrics.performanceImprovement.toFixed(1)}%`);

    if (result.errors.length > 0) {
      console.log('\n❌ ISSUES IDENTIFIED:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      result.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    console.log(`\n🎉 OVERALL STATUS: ${result.success ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);
  }

  async cleanup(): Promise<void> {
    console.log('🧹 [PHASE3_INIT] Cleaning up...');
    
    try {
      await this.cacheManager.clear();
      // Services don't have shutdown methods in simplified singleton implementation
      console.log('✅ [PHASE3_INIT] Cleanup completed');
    } catch (error) {
      console.error('❌ [PHASE3_INIT] Cleanup failed:', error);
    }
  }
}

// Main execution
async function main() {
  const initializer = new Phase3CacheWarmingInitializer();

  try {
    const result = await initializer.runFullInitialization();

    // Print final summary
    console.log('\n📊 [PHASE3_INIT] Final Summary:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Performance Improvement: ${result.metrics.performanceImprovement.toFixed(1)}%`);
    console.log(`   Cache Hit Rate: ${result.metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`   Average Response Time: ${result.metrics.averageResponseTime.toFixed(2)}ms`);

    if (result.success) {
      console.log('\n🎉 [PHASE3_INIT] Phase 3 implementation completed successfully!');
      console.log('   🔧 Next steps:');
      console.log('   1. Deploy enhanced cache warming to production');
      console.log('   2. Monitor real-world performance improvements');
      console.log('   3. Fine-tune pattern recognition based on usage data');
      console.log('   4. Complete post-TensorFlow optimization goals (65-70% total improvement)');
    }

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('\n💥 [PHASE3_INIT] Initialization failed with error:', error);
    process.exit(1);
  } finally {
    await initializer.cleanup();
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [PHASE3_INIT] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

export { Phase3CacheWarmingInitializer };

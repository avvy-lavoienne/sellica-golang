/**
 * Unit Tests for PredictiveCacheAnalyzer
 * Validates pattern analysis, cache miss predictions, and warming recommendations
 */

import { PredictiveCacheAnalyzer } from '../PredictiveCacheAnalyzer';

describe('PredictiveCacheAnalyzer', () => {
  let analyzer: PredictiveCacheAnalyzer;

  beforeEach(() => {
    // Reset singleton instance
    (PredictiveCacheAnalyzer as any).instance = null;
    
    // Enable feature flag for testing
    process.env.ENABLE_PREDICTIVE_CACHE_ANALYZER = 'true';
    
    // Create new instance
    analyzer = PredictiveCacheAnalyzer.getInstance();
    analyzer.reset();
  });

  afterEach(() => {
    if (analyzer) {
      analyzer.destroy();
    }
    delete process.env.ENABLE_PREDICTIVE_CACHE_ANALYZER;
  });

  describe('Singleton Behavior', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = PredictiveCacheAnalyzer.getInstance();
      const instance2 = PredictiveCacheAnalyzer.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1 === instance2).toBe(true);
    });
  });

  describe('Feature Flag Support', () => {
    test('respects feature flag setting', () => {
      process.env.ENABLE_PREDICTIVE_CACHE_ANALYZER = 'true';
      expect(PredictiveCacheAnalyzer.isEnabled()).toBe(true);

      process.env.ENABLE_PREDICTIVE_CACHE_ANALYZER = 'false';
      expect(PredictiveCacheAnalyzer.isEnabled()).toBe(false);

      delete process.env.ENABLE_PREDICTIVE_CACHE_ANALYZER;
      expect(PredictiveCacheAnalyzer.isEnabled()).toBe(false);
    });
  });

  describe('Query Pattern Management', () => {
    test('initializes with Indonesian patterns', () => {
      const patterns = analyzer.getQueryPatterns();
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.pattern.includes('ktp'))).toBe(true);
      expect(patterns.some(p => p.pattern.includes('adjudicate'))).toBe(true);
      expect(patterns.some(p => p.pattern.includes('pengajuan'))).toBe(true);
      expect(patterns.some(p => p.pattern.includes('salah rekam'))).toBe(true);
    });

    test('adds new query patterns correctly', () => {
      const initialCount = analyzer.getQueryPatterns().length;
      
      analyzer.addQueryPattern({
        id: 'test-pattern',
        pattern: 'test query pattern',
        frequency: 0.5,
        lastSeen: new Date(),
        avgResponseTime: 200,
        cacheHitRate: 0.6,
        userSegment: 'citizen',
        complexity: 'simple',
        dataSource: 'static',
        seasonality: {
          hourly: new Array(24).fill(0.5),
          daily: new Array(7).fill(0.5),
          monthly: new Array(12).fill(0.5)
        }
      });

      const patterns = analyzer.getQueryPatterns();
      expect(patterns.length).toBe(initialCount + 1);
      
      const testPattern = patterns.find(p => p.id === 'test-pattern');
      expect(testPattern).toBeDefined();
      expect(testPattern!.pattern).toBe('test query pattern');
    });

    test('updates existing query patterns', () => {
      const patterns = analyzer.getQueryPatterns();
      const firstPattern = patterns[0];
      
      const updated = analyzer.updateQueryPattern(firstPattern.id, {
        frequency: 0.9,
        avgResponseTime: 150
      });

      expect(updated).toBe(true);
      
      const updatedPatterns = analyzer.getQueryPatterns();
      const updatedPattern = updatedPatterns.find(p => p.id === firstPattern.id);
      expect(updatedPattern!.frequency).toBe(0.9);
      expect(updatedPattern!.avgResponseTime).toBe(150);
    });

    test('removes query patterns correctly', () => {
      const patterns = analyzer.getQueryPatterns();
      const initialCount = patterns.length;
      const firstPattern = patterns[0];
      
      const removed = analyzer.removeQueryPattern(firstPattern.id);
      expect(removed).toBe(true);
      
      const remainingPatterns = analyzer.getQueryPatterns();
      expect(remainingPatterns.length).toBe(initialCount - 1);
      expect(remainingPatterns.find(p => p.id === firstPattern.id)).toBeUndefined();
    });

    test('handles non-existent pattern updates and removals', () => {
      const updated = analyzer.updateQueryPattern('non-existent', { frequency: 0.5 });
      expect(updated).toBe(false);
      
      const removed = analyzer.removeQueryPattern('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('Pattern Analysis', () => {
    test('analyzes patterns and generates predictions', async () => {
      const predictions = await analyzer.analyzePatterns();
      
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThanOrEqual(0);
      
      // Check prediction structure
      predictions.forEach(prediction => {
        expect(prediction.pattern).toBeDefined();
        expect(typeof prediction.probability).toBe('number');
        expect(prediction.probability).toBeGreaterThanOrEqual(0);
        expect(prediction.probability).toBeLessThanOrEqual(1);
        expect(prediction.expectedTime).toBeInstanceOf(Date);
        expect(typeof prediction.confidence).toBe('number');
        expect(['low', 'medium', 'high', 'critical']).toContain(prediction.impact);
        expect(['warm', 'preload', 'optimize', 'ignore']).toContain(prediction.recommendedAction);
        expect(prediction.estimatedBenefit).toBeDefined();
      });
    });

    test('calculates prediction probabilities correctly', async () => {
      const predictions = await analyzer.analyzePatterns();
      
      // Predictions should be sorted by probability and impact
      for (let i = 1; i < predictions.length; i++) {
        const getImpactWeight = (impact: 'low' | 'medium' | 'high' | 'critical'): number => {
          const weights = { low: 1, medium: 2, high: 3, critical: 4 };
          return weights[impact];
        };

        const prevScore = predictions[i-1].probability * getImpactWeight(predictions[i-1].impact);
        const currScore = predictions[i].probability * getImpactWeight(predictions[i].impact);
        expect(prevScore).toBeGreaterThanOrEqual(currScore);
      }
    });

    test('updates metrics after analysis', async () => {
      const initialMetrics = analyzer.getMetrics();
      expect(initialMetrics.totalPatternsAnalyzed).toBe(0);
      
      await analyzer.analyzePatterns();
      
      const finalMetrics = analyzer.getMetrics();
      expect(finalMetrics.totalPatternsAnalyzed).toBeGreaterThan(0);
      expect(finalMetrics.predictionsGenerated).toBeGreaterThanOrEqual(0);
      expect(finalMetrics.lastAnalysis).toBeInstanceOf(Date);
      expect(typeof finalMetrics.avgAnalysisTime).toBe('number');
      expect(typeof finalMetrics.patternRecognitionRate).toBe('number');
    });
  });

  describe('Recommendation Generation', () => {
    test('generates warming recommendations', async () => {
      const recommendations = await analyzer.generateRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      
      // Check recommendation structure
      recommendations.forEach(recommendation => {
        expect(recommendation.id).toBeDefined();
        expect(['critical', 'high', 'medium', 'low']).toContain(recommendation.priority);
        expect(Array.isArray(recommendation.patterns)).toBe(true);
        expect(['immediate', 'scheduled', 'conditional', 'background']).toContain(recommendation.strategy);
        expect(recommendation.timing).toBeDefined();
        expect(recommendation.timing.optimal).toBeInstanceOf(Date);
        expect(recommendation.timing.window.start).toBeInstanceOf(Date);
        expect(recommendation.timing.window.end).toBeInstanceOf(Date);
        expect(recommendation.resources).toBeDefined();
        expect(recommendation.expectedOutcome).toBeDefined();
      });
    });

    test('prioritizes recommendations correctly', async () => {
      const recommendations = await analyzer.generateRecommendations();
      
      if (recommendations.length > 1) {
        // Critical recommendations should come first
        const criticalRecs = recommendations.filter(r => r.priority === 'critical');
        const highRecs = recommendations.filter(r => r.priority === 'high');
        const mediumRecs = recommendations.filter(r => r.priority === 'medium');
        
        if (criticalRecs.length > 0 && highRecs.length > 0) {
          const criticalIndex = recommendations.indexOf(criticalRecs[0]);
          const highIndex = recommendations.indexOf(highRecs[0]);
          expect(criticalIndex).toBeLessThan(highIndex);
        }
      }
    });

    test('updates metrics after recommendation generation', async () => {
      const initialMetrics = analyzer.getMetrics();
      expect(initialMetrics.recommendationsCreated).toBe(0);
      
      await analyzer.generateRecommendations();
      
      const finalMetrics = analyzer.getMetrics();
      expect(finalMetrics.recommendationsCreated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Database Analysis', () => {
    test('analyzes database patterns', async () => {
      const insights = await analyzer.analyzeDatabasePatterns();
      
      expect(insights).toBeDefined();
      expect(Array.isArray(insights.mostFrequentQueries)).toBe(true);
      expect(Array.isArray(insights.emergingPatterns)).toBe(true);
      expect(Array.isArray(insights.seasonalTrends)).toBe(true);
      expect(insights.userBehaviorInsights).toBeDefined();
      
      // Check structure
      expect(Array.isArray(insights.userBehaviorInsights.peakHours)).toBe(true);
      expect(Array.isArray(insights.userBehaviorInsights.preferredServices)).toBe(true);
      expect(typeof insights.userBehaviorInsights.queryComplexityDistribution).toBe('object');
    });

    test('identifies most frequent queries', async () => {
      const insights = await analyzer.analyzeDatabasePatterns();
      
      expect(insights.mostFrequentQueries.length).toBeGreaterThan(0);
      expect(insights.mostFrequentQueries.length).toBeLessThanOrEqual(5);
      
      // Should be sorted by frequency
      for (let i = 1; i < insights.mostFrequentQueries.length; i++) {
        expect(insights.mostFrequentQueries[i-1].frequency)
          .toBeGreaterThanOrEqual(insights.mostFrequentQueries[i].frequency);
      }
    });

    test('identifies seasonal trends', async () => {
      const insights = await analyzer.analyzeDatabasePatterns();
      
      insights.seasonalTrends.forEach(trend => {
        expect(typeof trend.pattern).toBe('string');
        expect(['increasing', 'decreasing', 'stable', 'seasonal']).toContain(trend.trend);
        expect(typeof trend.confidence).toBe('number');
        expect(trend.confidence).toBeGreaterThanOrEqual(0);
        expect(trend.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Comprehensive Analysis Report', () => {
    test('generates comprehensive analysis report', async () => {
      const report = await analyzer.generateAnalysisReport();
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.predictions).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.databaseInsights).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.performanceImpact).toBeDefined();
      
      // Check summary structure
      expect(typeof report.summary.totalPatterns).toBe('number');
      expect(typeof report.summary.activePredictions).toBe('number');
      expect(typeof report.summary.activeRecommendations).toBe('number');
      expect(typeof report.summary.overallAccuracy).toBe('number');
      
      // Check performance impact
      expect(typeof report.performanceImpact.estimatedCacheHitRateImprovement).toBe('number');
      expect(typeof report.performanceImpact.estimatedResponseTimeReduction).toBe('number');
      expect(typeof report.performanceImpact.estimatedUserSatisfactionIncrease).toBe('number');
    });

    test('calculates performance impact correctly', async () => {
      const report = await analyzer.generateAnalysisReport();
      
      // Performance impact should be reasonable values
      expect(report.performanceImpact.estimatedCacheHitRateImprovement).toBeGreaterThanOrEqual(0);
      expect(report.performanceImpact.estimatedCacheHitRateImprovement).toBeLessThanOrEqual(100);
      
      expect(report.performanceImpact.estimatedResponseTimeReduction).toBeGreaterThanOrEqual(0);
      
      expect(report.performanceImpact.estimatedUserSatisfactionIncrease).toBeGreaterThanOrEqual(1);
      expect(report.performanceImpact.estimatedUserSatisfactionIncrease).toBeLessThanOrEqual(10);
    });
  });

  describe('Metrics Tracking', () => {
    test('tracks analyzer metrics correctly', () => {
      const metrics = analyzer.getMetrics();
      
      expect(typeof metrics.totalPatternsAnalyzed).toBe('number');
      expect(typeof metrics.predictionsGenerated).toBe('number');
      expect(typeof metrics.recommendationsCreated).toBe('number');
      expect(typeof metrics.accuracyRate).toBe('number');
      expect(typeof metrics.avgAnalysisTime).toBe('number');
      expect(typeof metrics.databaseQueriesAnalyzed).toBe('number');
      expect(typeof metrics.patternRecognitionRate).toBe('number');
    });

    test('updates metrics during operations', async () => {
      const initialMetrics = analyzer.getMetrics();
      
      await analyzer.analyzePatterns();
      await analyzer.generateRecommendations();
      await analyzer.analyzeDatabasePatterns();
      
      const finalMetrics = analyzer.getMetrics();
      
      expect(finalMetrics.totalPatternsAnalyzed).toBeGreaterThan(initialMetrics.totalPatternsAnalyzed);
      expect(finalMetrics.predictionsGenerated).toBeGreaterThan(initialMetrics.predictionsGenerated);
      expect(finalMetrics.recommendationsCreated).toBeGreaterThan(initialMetrics.recommendationsCreated);
      expect(finalMetrics.databaseQueriesAnalyzed).toBeGreaterThan(initialMetrics.databaseQueriesAnalyzed);
    });
  });

  describe('State Management', () => {
    test('reset functionality works correctly', async () => {
      // Generate some data first
      await analyzer.analyzePatterns();
      await analyzer.generateRecommendations();
      
      const beforeReset = analyzer.getMetrics();
      expect(beforeReset.totalPatternsAnalyzed).toBeGreaterThan(0);
      
      analyzer.reset();
      const afterReset = analyzer.getMetrics();
      
      expect(afterReset.totalPatternsAnalyzed).toBe(0);
      expect(afterReset.predictionsGenerated).toBe(0);
      expect(afterReset.recommendationsCreated).toBe(0);
      expect(afterReset.lastAnalysis).toBeNull();
      
      // Patterns should still exist (they're not reset)
      const patterns = analyzer.getQueryPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });

    test('destroy functionality works correctly', () => {
      analyzer.destroy();
      
      // Should be able to create new instance after destroy
      const newInstance = PredictiveCacheAnalyzer.getInstance();
      expect(newInstance).toBeDefined();
      expect(newInstance).not.toBe(analyzer);
    });
  });

  describe('Phase 3 Integration', () => {
    test('supports Indonesian administrative patterns', () => {
      const patterns = analyzer.getQueryPatterns();
      
      // Should have patterns for different Indonesian services
      const ktpPatterns = patterns.filter(p => p.pattern.includes('ktp'));
      const adminPatterns = patterns.filter(p => p.userSegment === 'admin');
      const citizenPatterns = patterns.filter(p => p.userSegment === 'citizen');
      const operatorPatterns = patterns.filter(p => p.userSegment === 'operator');
      
      expect(ktpPatterns.length).toBeGreaterThan(0);
      expect(adminPatterns.length).toBeGreaterThan(0);
      expect(citizenPatterns.length).toBeGreaterThan(0);
      expect(operatorPatterns.length).toBeGreaterThan(0);
    });

    test('analyzes database-driven patterns', () => {
      const patterns = analyzer.getQueryPatterns();
      
      const dbPatterns = patterns.filter(p => p.dataSource !== 'static');
      expect(dbPatterns.length).toBeGreaterThan(0);
      
      // Should have patterns for each database table
      const adjudicatePatterns = patterns.filter(p => p.dataSource === 'adjudicate_record');
      const pengajuanPatterns = patterns.filter(p => p.dataSource === 'pengajuan_bulanan');
      const salahRekamPatterns = patterns.filter(p => p.dataSource === 'salah_rekam');
      const duplicatePatterns = patterns.filter(p => p.dataSource === 'duplicate_operator');
      
      expect(adjudicatePatterns.length).toBeGreaterThan(0);
      expect(pengajuanPatterns.length).toBeGreaterThan(0);
      expect(salahRekamPatterns.length).toBeGreaterThan(0);
      expect(duplicatePatterns.length).toBeGreaterThan(0);
    });

    test('provides predictive warming recommendations', async () => {
      const recommendations = await analyzer.generateRecommendations();
      
      // Should provide different strategies
      const strategies = new Set(recommendations.map(r => r.strategy));
      expect(strategies.size).toBeGreaterThan(0);
      
      // Should have timing information
      recommendations.forEach(rec => {
        expect(rec.timing.optimal).toBeInstanceOf(Date);
        expect(rec.timing.window.start).toBeInstanceOf(Date);
        expect(rec.timing.window.end).toBeInstanceOf(Date);
        expect(rec.timing.optimal.getTime()).toBeGreaterThan(Date.now() - 86400000); // Within last 24 hours or future
      });
    });
  });
});

/**
 * Predictive Analytics Engine Tests - Day 23-24: Phase 3 Advanced Features
 * Comprehensive testing for Predictive Analytics capabilities
 * Validates trend forecasting, user behavior prediction, anomaly detection, and proactive insights
 */

import { predictiveAnalyticsEngine, PredictiveAnalyticsResult } from '../PredictiveAnalyticsEngine';
import { ProactiveInsightsGenerator } from '../ProactiveInsightsGenerator';
import { TrendAnalysisEngine } from '../TrendAnalysisEngine';

describe('Predictive Analytics Engine', () => {
  beforeAll(async () => {
    await predictiveAnalyticsEngine.initialize();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const stats = predictiveAnalyticsEngine.getAnalyticsStatistics();
      
      expect(stats.isInitialized).toBe(true);
      expect(stats.modelsLoaded.trendForecasting).toBe(true);
      expect(stats.modelsLoaded.userBehavior).toBe(true);
      expect(stats.modelsLoaded.anomalyDetection).toBe(true);
    });

    test('should load historical data', async () => {
      const stats = predictiveAnalyticsEngine.getAnalyticsStatistics();
      
      expect(stats.historicalDataPoints).toBeGreaterThan(0);
      expect(typeof stats.historicalDataPoints).toBe('number');
    });
  });

  describe('Trend Forecasting', () => {
    test('should generate trend forecasts for administrative queries', async () => {
      const query = 'Bagaimana tren pengajuan KTP dalam 30 hari ke depan?';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.trendForecasts).toBeDefined();
      expect(result.trendForecasts.length).toBeGreaterThan(0);
      
      const ktpTrend = result.trendForecasts.find(t => t.metric.includes('ktp'));
      if (ktpTrend) {
        expect(ktpTrend.currentValue).toBeGreaterThan(0);
        expect(ktpTrend.predictedValue).toBeGreaterThan(0);
        expect(['increasing', 'decreasing', 'stable']).toContain(ktpTrend.trend);
        expect(ktpTrend.confidence).toBeGreaterThan(0.5);
        expect(ktpTrend.factors).toBeDefined();
        expect(ktpTrend.recommendations).toBeDefined();
      }
    });

    test('should forecast seasonal patterns', async () => {
      const query = 'Prediksi tren musiman untuk aplikasi dokumen';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.trendForecasts).toBeDefined();
      
      const seasonalTrend = result.trendForecasts.find(t => 
        t.factors.some(f => f.factor.includes('seasonal'))
      );
      
      if (seasonalTrend) {
        expect(seasonalTrend.factors.length).toBeGreaterThan(0);
        expect(seasonalTrend.timeframe).toBeDefined();
        expect(seasonalTrend.confidence).toBeGreaterThan(0.6);
      }
    });

    test('should provide actionable recommendations', async () => {
      const query = 'Analisis tren dan berikan rekomendasi';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      result.trendForecasts.forEach(forecast => {
        expect(forecast.recommendations).toBeDefined();
        expect(forecast.recommendations.length).toBeGreaterThan(0);
        expect(typeof forecast.recommendations[0]).toBe('string');
      });
    });
  });

  describe('User Behavior Prediction', () => {
    test('should predict user behavior patterns', async () => {
      const query = 'Prediksi perilaku pengguna untuk layanan KTP';
      const context = { userId: 'user123' };
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query, context);
      
      expect(result.userBehaviorPredictions).toBeDefined();
      expect(result.userBehaviorPredictions.length).toBeGreaterThan(0);
      
      const userPrediction = result.userBehaviorPredictions[0];
      expect(userPrediction.predictedActions).toBeDefined();
      expect(userPrediction.nextLikelyQuery).toBeDefined();
      expect(userPrediction.estimatedCompletionTime).toBeGreaterThan(0);
      expect(userPrediction.confidence).toBeGreaterThan(0.5);
    });

    test('should identify risk factors', async () => {
      const query = 'Analisis risiko dalam proses pengajuan dokumen';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      const predictions = result.userBehaviorPredictions;
      if (predictions.length > 0) {
        const prediction = predictions[0];
        expect(prediction.riskFactors).toBeDefined();
        
        if (prediction.riskFactors.length > 0) {
          const riskFactor = prediction.riskFactors[0];
          expect(['low', 'medium', 'high', 'critical']).toContain(riskFactor.severity);
          expect(riskFactor.probability).toBeGreaterThan(0);
          expect(riskFactor.probability).toBeLessThanOrEqual(1);
          expect(riskFactor.description).toBeDefined();
          expect(riskFactor.mitigation).toBeDefined();
        }
      }
    });

    test('should predict cohort behavior', async () => {
      const query = 'Prediksi perilaku kelompok pengguna baru';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.userBehaviorPredictions).toBeDefined();
      
      const cohortPredictions = result.userBehaviorPredictions.filter(p => !p.userId);
      expect(cohortPredictions.length).toBeGreaterThan(0);
      
      cohortPredictions.forEach(prediction => {
        expect(prediction.predictedActions.length).toBeGreaterThan(0);
        expect(prediction.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Anomaly Detection', () => {
    test('should detect system anomalies', async () => {
      const query = 'Deteksi anomali dalam sistem';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.anomalyDetection).toBeDefined();
      expect(result.anomalyDetection.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.anomalyDetection.overallScore).toBeLessThanOrEqual(1);
      expect(['normal', 'warning', 'critical']).toContain(result.anomalyDetection.alertLevel);
      expect(result.anomalyDetection.recommendations).toBeDefined();
    });

    test('should classify anomaly severity', async () => {
      const query = 'Cek anomali performa sistem';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      const anomalies = result.anomalyDetection.anomalies;
      if (anomalies.length > 0) {
        anomalies.forEach(anomaly => {
          expect(['low', 'medium', 'high', 'critical']).toContain(anomaly.severity);
          expect(anomaly.confidence).toBeGreaterThan(0);
          expect(anomaly.confidence).toBeLessThanOrEqual(1);
          expect(anomaly.description).toBeDefined();
          expect(anomaly.suggestedActions).toBeDefined();
          expect(anomaly.affectedMetrics).toBeDefined();
        });
      }
    });

    test('should provide anomaly recommendations', async () => {
      const query = 'Analisis anomali dan berikan solusi';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.anomalyDetection.recommendations).toBeDefined();
      expect(result.anomalyDetection.recommendations.length).toBeGreaterThan(0);
      
      result.anomalyDetection.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Proactive Insights', () => {
    test('should generate performance insights', async () => {
      const query = 'Berikan wawasan untuk optimasi performa';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.proactiveInsights).toBeDefined();
      expect(result.proactiveInsights.length).toBeGreaterThan(0);
      
      const performanceInsights = result.proactiveInsights.filter(i => 
        i.type.includes('performance') || i.title.toLowerCase().includes('performa')
      );
      
      if (performanceInsights.length > 0) {
        const insight = performanceInsights[0];
        expect(['low', 'medium', 'high', 'critical']).toContain(insight.priority);
        expect(insight.confidence).toBeGreaterThan(0.5);
        expect(insight.actionable).toBe(true);
        expect(insight.recommendations.length).toBeGreaterThan(0);
      }
    });

    test('should generate UX insights', async () => {
      const query = 'Wawasan untuk meningkatkan pengalaman pengguna';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      const uxInsights = result.proactiveInsights.filter(i => 
        i.type.includes('user_experience') || i.title.toLowerCase().includes('pengalaman')
      );
      
      if (uxInsights.length > 0) {
        const insight = uxInsights[0];
        expect(insight.impact).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.validUntil).toBeInstanceOf(Date);
        expect(insight.validUntil.getTime()).toBeGreaterThan(Date.now());
      }
    });

    test('should prioritize insights correctly', async () => {
      const query = 'Berikan semua wawasan dengan prioritas';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      if (result.proactiveInsights.length > 1) {
        const priorities = result.proactiveInsights.map(i => i.priority);
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        
        for (let i = 0; i < priorities.length - 1; i++) {
          const currentPriority = priorityOrder[priorities[i]];
          const nextPriority = priorityOrder[priorities[i + 1]];
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
        }
      }
    });
  });

  describe('Performance and Integration', () => {
    test('should process analytics within acceptable time', async () => {
      const query = 'Analisis prediktif lengkap untuk sistem';
      const startTime = performance.now();
      
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // Should be under 5 seconds
      expect(result.processingTime).toBeLessThan(3000); // Internal processing under 3 seconds
    });

    test('should maintain high overall confidence', async () => {
      const query = 'Prediksi komprehensif untuk optimasi sistem';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.overallConfidence).toBeGreaterThan(0.6);
      expect(result.overallConfidence).toBeLessThanOrEqual(1.0);
    });

    test('should provide comprehensive metadata', async () => {
      const query = 'Analisis dengan metadata lengkap';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.modelsUsed).toBeDefined();
      expect(result.metadata.modelsUsed.length).toBeGreaterThan(0);
      expect(result.metadata.dataPoints).toBeGreaterThan(0);
      expect(result.metadata.predictionHorizon).toBeDefined();
      expect(result.metadata.lastModelUpdate).toBeInstanceOf(Date);
    });
  });

  describe('Complex Analytics Scenarios', () => {
    test('should handle multi-metric trend analysis', async () => {
      const query = 'Analisis tren untuk KTP, SIM, dan Paspor secara bersamaan';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result.trendForecasts.length).toBeGreaterThan(1);
      
      const metrics = result.trendForecasts.map(t => t.metric);
      const uniqueMetrics = new Set(metrics);
      expect(uniqueMetrics.size).toBeGreaterThan(1); // Multiple different metrics
    });

    test('should correlate user behavior with trends', async () => {
      const query = 'Korelasi antara perilaku pengguna dan tren aplikasi dokumen';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      const hasTrends = result.trendForecasts.length > 0;
      const hasBehaviorPredictions = result.userBehaviorPredictions.length > 0;
      
      if (hasTrends && hasBehaviorPredictions) {
        // Should have insights that connect trends and behavior
        const correlationInsights = result.proactiveInsights.filter(i => 
          i.description.toLowerCase().includes('perilaku') || 
          i.description.toLowerCase().includes('tren')
        );
        
        expect(correlationInsights.length).toBeGreaterThan(0);
      }
    });

    test('should handle seasonal administrative patterns', async () => {
      const query = 'Analisis pola musiman untuk layanan administrasi Indonesia';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      const seasonalForecasts = result.trendForecasts.filter(t => 
        t.factors.some(f => f.factor.includes('seasonal') || f.factor.includes('ramadan') || f.factor.includes('school'))
      );
      
      expect(seasonalForecasts.length).toBeGreaterThan(0);
      
      seasonalForecasts.forEach(forecast => {
        const seasonalFactors = forecast.factors.filter(f => 
          f.factor.includes('seasonal') || f.factor.includes('ramadan') || f.factor.includes('school')
        );
        expect(seasonalFactors.length).toBeGreaterThan(0);
        expect(seasonalFactors[0].confidence).toBeGreaterThan(0.7);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty query gracefully', async () => {
      const query = '';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result).toBeDefined();
      expect(result.overallConfidence).toBeLessThan(0.8);
    });

    test('should handle non-analytical queries', async () => {
      const query = 'Hello, how are you today?';
      const result = await predictiveAnalyticsEngine.generatePredictiveAnalytics(query);
      
      expect(result).toBeDefined();
      // Should still provide some basic analytics even for non-analytical queries
      expect(result.trendForecasts.length + result.userBehaviorPredictions.length + result.proactiveInsights.length).toBeGreaterThan(0);
    });

    test('should maintain performance under load', async () => {
      const queries = [
        'Prediksi tren KTP',
        'Analisis perilaku pengguna',
        'Deteksi anomali sistem',
        'Wawasan optimasi performa',
        'Forecasting aplikasi dokumen'
      ];
      
      const startTime = performance.now();
      
      const results = await Promise.all(
        queries.map(query => predictiveAnalyticsEngine.generatePredictiveAnalytics(query))
      );
      
      const totalTime = performance.now() - startTime;
      const averageTime = totalTime / queries.length;
      
      expect(averageTime).toBeLessThan(2000); // Average under 2 seconds per query
      expect(results.length).toBe(queries.length);
      
      results.forEach(result => {
        expect(result.overallConfidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide comprehensive statistics', () => {
      const stats = predictiveAnalyticsEngine.getAnalyticsStatistics();
      
      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('modelsLoaded');
      expect(stats).toHaveProperty('historicalDataPoints');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('config');
      
      expect(stats.isInitialized).toBe(true);
      expect(typeof stats.historicalDataPoints).toBe('number');
      expect(typeof stats.cacheSize).toBe('number');
    });
  });
});

describe('Proactive Insights Generator', () => {
  let insightsGenerator: ProactiveInsightsGenerator;

  beforeAll(async () => {
    insightsGenerator = new ProactiveInsightsGenerator();
    await insightsGenerator.initialize();
  });

  test('should generate performance insights', async () => {
    const query = 'Sistem berjalan lambat hari ini';
    const insights = await insightsGenerator.generatePerformanceInsights(query);
    
    expect(insights).toBeDefined();
    if (insights.length > 0) {
      const insight = insights[0];
      expect(insight.type).toContain('performance');
      expect(insight.actionable).toBe(true);
      expect(insight.recommendations.length).toBeGreaterThan(0);
    }
  });

  test('should generate cultural insights', async () => {
    const query = 'Gue mau bikin KTP dong';
    const context = { 
      culturalContext: { 
        region: { name: 'jakarta', confidence: 0.9 },
        formality: { level: 'very_informal', confidence: 0.8 }
      }
    };
    
    const insights = await insightsGenerator.generateCulturalInsights(query, context);
    
    expect(insights).toBeDefined();
    if (insights.length > 0) {
      const insight = insights[0];
      expect(insight.type).toContain('cultural');
      expect(insight.confidence).toBeGreaterThan(0.7);
    }
  });
});

describe('Trend Analysis Engine', () => {
  let trendEngine: TrendAnalysisEngine;

  beforeAll(async () => {
    trendEngine = new TrendAnalysisEngine();
    await trendEngine.initialize();
  });

  test('should analyze trend components', async () => {
    const result = await trendEngine.analyzeTrend('daily_queries');
    
    expect(result).toBeDefined();
    expect(result.components.length).toBeGreaterThan(0);
    expect(['increasing', 'decreasing', 'stable']).toContain(result.trendDirection);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should detect seasonal patterns', async () => {
    const result = await trendEngine.analyzeTrend('document_applications');
    
    expect(result.seasonalPatterns).toBeDefined();
    if (result.seasonalPatterns.length > 0) {
      const pattern = result.seasonalPatterns[0];
      expect(pattern.period).toBeGreaterThan(0);
      expect(pattern.confidence).toBeGreaterThan(0.5);
    }
  });
});

package training

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"selly-backend/internal/services/cache"
)

// CacheAnalytics provides detailed cache performance analytics
type CacheAnalytics struct {
	hitRatios        map[string]float64
	accessPatterns   map[string]*AccessPattern
	performanceData  []PerformanceDataPoint
	mu              sync.RWMutex
	
	// Analytics configuration
	trackingWindow   time.Duration
	maxDataPoints    int
}

// CacheOptimizer optimizes cache performance based on analytics
type CacheOptimizer struct {
	analytics       *CacheAnalytics
	cache          *cache.Service
	trainingCache  *TrainingCache
	
	// Optimization settings
	targetHitRatio  float64
	optimizationInterval time.Duration
	
	// Optimization strategies
	strategies      []OptimizationStrategy
	mu             sync.RWMutex
}

// AccessPattern tracks access patterns for cache keys
type AccessPattern struct {
	Key            string                 `json:"key"`
	AccessCount    int64                  `json:"access_count"`
	LastAccess     time.Time              `json:"last_access"`
	FirstAccess    time.Time              `json:"first_access"`
	AccessTimes    []time.Time            `json:"access_times"`
	AverageInterval time.Duration         `json:"average_interval"`
	Metadata       map[string]interface{} `json:"metadata"`
}

// PerformanceDataPoint represents a single performance measurement
type PerformanceDataPoint struct {
	Timestamp      time.Time     `json:"timestamp"`
	HitRatio       float64       `json:"hit_ratio"`
	ResponseTime   time.Duration `json:"response_time"`
	MemoryUsage    int64         `json:"memory_usage"`
	RedisLatency   time.Duration `json:"redis_latency"`
	TotalRequests  int64         `json:"total_requests"`
}

// OptimizationStrategy represents a cache optimization strategy
type OptimizationStrategy struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Priority    int                    `json:"priority"`
	Condition   func(*CacheAnalytics) bool
	Action      func(context.Context, *CacheOptimizer) error
}

// CacheOptimizationReport represents the result of cache optimization
type CacheOptimizationReport struct {
	Timestamp          time.Time                    `json:"timestamp"`
	CurrentHitRatio    float64                      `json:"current_hit_ratio"`
	TargetHitRatio     float64                      `json:"target_hit_ratio"`
	OptimizationsApplied []string                   `json:"optimizations_applied"`
	PerformanceGain    float64                      `json:"performance_gain"`
	Recommendations    []string                     `json:"recommendations"`
	Analytics          map[string]interface{}       `json:"analytics"`
}

// NewCacheAnalytics creates a new cache analytics instance
func NewCacheAnalytics() *CacheAnalytics {
	return &CacheAnalytics{
		hitRatios:       make(map[string]float64),
		accessPatterns:  make(map[string]*AccessPattern),
		performanceData: make([]PerformanceDataPoint, 0),
		trackingWindow:  24 * time.Hour,
		maxDataPoints:   1000,
	}
}

// NewCacheOptimizer creates a new cache optimizer
func NewCacheOptimizer(analytics *CacheAnalytics, cache *cache.Service, trainingCache *TrainingCache) *CacheOptimizer {
	optimizer := &CacheOptimizer{
		analytics:            analytics,
		cache:               cache,
		trainingCache:       trainingCache,
		targetHitRatio:      0.85, // 85% target hit ratio
		optimizationInterval: 10 * time.Minute,
		strategies:          []OptimizationStrategy{},
	}

	// Initialize optimization strategies
	optimizer.initializeStrategies()

	return optimizer
}

// RecordAccess records a cache access for analytics
func (ca *CacheAnalytics) RecordAccess(key string, hit bool, responseTime time.Duration) {
	ca.mu.Lock()
	defer ca.mu.Unlock()

	now := time.Now()

	// Update access pattern
	pattern, exists := ca.accessPatterns[key]
	if !exists {
		pattern = &AccessPattern{
			Key:         key,
			AccessCount: 0,
			FirstAccess: now,
			AccessTimes: make([]time.Time, 0),
			Metadata:    make(map[string]interface{}),
		}
		ca.accessPatterns[key] = pattern
	}

	pattern.AccessCount++
	pattern.LastAccess = now
	pattern.AccessTimes = append(pattern.AccessTimes, now)

	// Calculate average interval
	if len(pattern.AccessTimes) > 1 {
		totalInterval := time.Duration(0)
		for i := 1; i < len(pattern.AccessTimes); i++ {
			totalInterval += pattern.AccessTimes[i].Sub(pattern.AccessTimes[i-1])
		}
		pattern.AverageInterval = totalInterval / time.Duration(len(pattern.AccessTimes)-1)
	}

	// Limit access times history
	if len(pattern.AccessTimes) > 100 {
		pattern.AccessTimes = pattern.AccessTimes[len(pattern.AccessTimes)-100:]
	}

	// Record performance data point
	dataPoint := PerformanceDataPoint{
		Timestamp:     now,
		ResponseTime:  responseTime,
		TotalRequests: ca.getTotalRequests(),
	}

	ca.performanceData = append(ca.performanceData, dataPoint)

	// Limit performance data points
	if len(ca.performanceData) > ca.maxDataPoints {
		ca.performanceData = ca.performanceData[len(ca.performanceData)-ca.maxDataPoints:]
	}
}

// CalculateHitRatio calculates current hit ratio
func (ca *CacheAnalytics) CalculateHitRatio() float64 {
	ca.mu.RLock()
	defer ca.mu.RUnlock()

	if len(ca.performanceData) == 0 {
		return 0.0
	}

	// Calculate hit ratio from recent data points
	recentWindow := 100
	if len(ca.performanceData) < recentWindow {
		recentWindow = len(ca.performanceData)
	}

	recentData := ca.performanceData[len(ca.performanceData)-recentWindow:]
	totalHits := 0.0
	totalRequests := 0.0

	for _, point := range recentData {
		totalRequests += float64(point.TotalRequests)
		totalHits += point.HitRatio * float64(point.TotalRequests)
	}

	if totalRequests == 0 {
		return 0.0
	}

	return totalHits / totalRequests
}

// GetTopAccessedKeys returns the most frequently accessed keys
func (ca *CacheAnalytics) GetTopAccessedKeys(limit int) []*AccessPattern {
	ca.mu.RLock()
	defer ca.mu.RUnlock()

	patterns := make([]*AccessPattern, 0, len(ca.accessPatterns))
	for _, pattern := range ca.accessPatterns {
		patterns = append(patterns, pattern)
	}

	// Sort by access count
	sort.Slice(patterns, func(i, j int) bool {
		return patterns[i].AccessCount > patterns[j].AccessCount
	})

	if limit > len(patterns) {
		limit = len(patterns)
	}

	return patterns[:limit]
}

// getTotalRequests calculates total requests from access patterns
func (ca *CacheAnalytics) getTotalRequests() int64 {
	total := int64(0)
	for _, pattern := range ca.accessPatterns {
		total += pattern.AccessCount
	}
	return total
}

// initializeStrategies initializes optimization strategies
func (co *CacheOptimizer) initializeStrategies() {
	co.strategies = []OptimizationStrategy{
		{
			Name:        "PreloadPopularKeys",
			Description: "Preload frequently accessed keys into memory cache",
			Priority:    1,
			Condition: func(analytics *CacheAnalytics) bool {
				return analytics.CalculateHitRatio() < co.targetHitRatio
			},
			Action: co.preloadPopularKeys,
		},
		{
			Name:        "OptimizeTTL",
			Description: "Optimize TTL values based on access patterns",
			Priority:    2,
			Condition: func(analytics *CacheAnalytics) bool {
				return len(analytics.accessPatterns) > 10
			},
			Action: co.optimizeTTL,
		},
		{
			Name:        "EvictStaleKeys",
			Description: "Remove stale keys to free up memory",
			Priority:    3,
			Condition: func(analytics *CacheAnalytics) bool {
				return len(analytics.accessPatterns) > 500
			},
			Action: co.evictStaleKeys,
		},
	}

	// Sort strategies by priority
	sort.Slice(co.strategies, func(i, j int) bool {
		return co.strategies[i].Priority < co.strategies[j].Priority
	})
}

// OptimizeCache performs cache optimization based on analytics
func (co *CacheOptimizer) OptimizeCache(ctx context.Context) (*CacheOptimizationReport, error) {
	co.mu.Lock()
	defer co.mu.Unlock()

	startTime := time.Now()
	currentHitRatio := co.analytics.CalculateHitRatio()
	appliedOptimizations := []string{}
	recommendations := []string{}

	logrus.Info("🚀 Starting cache optimization...")

	// Apply optimization strategies
	for _, strategy := range co.strategies {
		if strategy.Condition(co.analytics) {
			logrus.Debugf("Applying optimization strategy: %s", strategy.Name)
			
			if err := strategy.Action(ctx, co); err != nil {
				logrus.Errorf("Failed to apply strategy %s: %v", strategy.Name, err)
				recommendations = append(recommendations, fmt.Sprintf("Manual review needed for %s", strategy.Name))
			} else {
				appliedOptimizations = append(appliedOptimizations, strategy.Name)
				logrus.Debugf("✅ Applied optimization: %s", strategy.Name)
			}
		}
	}

	// Calculate performance gain
	newHitRatio := co.analytics.CalculateHitRatio()
	performanceGain := newHitRatio - currentHitRatio

	// Generate recommendations
	if newHitRatio < co.targetHitRatio {
		recommendations = append(recommendations, "Consider increasing memory cache size")
		recommendations = append(recommendations, "Review cache key patterns for optimization")
	}

	report := &CacheOptimizationReport{
		Timestamp:            startTime,
		CurrentHitRatio:      newHitRatio,
		TargetHitRatio:       co.targetHitRatio,
		OptimizationsApplied: appliedOptimizations,
		PerformanceGain:      performanceGain,
		Recommendations:      recommendations,
		Analytics: map[string]interface{}{
			"total_keys":        len(co.analytics.accessPatterns),
			"optimization_time": time.Since(startTime),
		},
	}

	logrus.Infof("✅ Cache optimization completed: %.2f%% hit ratio (gain: %.2f%%)", 
		newHitRatio*100, performanceGain*100)

	return report, nil
}

// preloadPopularKeys preloads popular keys into memory cache
func (co *CacheOptimizer) preloadPopularKeys(ctx context.Context, optimizer *CacheOptimizer) error {
	topKeys := co.analytics.GetTopAccessedKeys(50)
	
	for _, pattern := range topKeys {
		// Check if key exists in Redis and preload to memory
		if value, err := co.cache.Get(pattern.Key); err == nil {
			// Store in memory cache with optimized TTL
			ttl := co.calculateOptimalTTL(pattern)
			co.trainingCache.setInMemory(pattern.Key, value, ttl)
		}
	}
	
	return nil
}

// optimizeTTL optimizes TTL values based on access patterns
func (co *CacheOptimizer) optimizeTTL(ctx context.Context, optimizer *CacheOptimizer) error {
	for _, pattern := range co.analytics.accessPatterns {
		if pattern.AverageInterval > 0 {
			// Set TTL based on access interval
			optimalTTL := pattern.AverageInterval * 2
			if optimalTTL > 24*time.Hour {
				optimalTTL = 24 * time.Hour
			}
			if optimalTTL < 5*time.Minute {
				optimalTTL = 5 * time.Minute
			}
			
			// Update TTL in metadata for future reference
			pattern.Metadata["optimal_ttl"] = optimalTTL
		}
	}
	
	return nil
}

// evictStaleKeys removes stale keys to free up memory
func (co *CacheOptimizer) evictStaleKeys(ctx context.Context, optimizer *CacheOptimizer) error {
	staleThreshold := time.Now().Add(-1 * time.Hour)
	staleKeys := []string{}
	
	for key, pattern := range co.analytics.accessPatterns {
		if pattern.LastAccess.Before(staleThreshold) && pattern.AccessCount < 5 {
			staleKeys = append(staleKeys, key)
		}
	}
	
	// Remove stale keys from analytics
	for _, key := range staleKeys {
		delete(co.analytics.accessPatterns, key)
	}
	
	logrus.Debugf("Evicted %d stale keys from analytics", len(staleKeys))
	return nil
}

// calculateOptimalTTL calculates optimal TTL for a key based on access pattern
func (co *CacheOptimizer) calculateOptimalTTL(pattern *AccessPattern) time.Duration {
	if pattern.AverageInterval > 0 {
		// Base TTL on access interval
		ttl := pattern.AverageInterval * 3
		
		// Adjust based on access frequency
		if pattern.AccessCount > 100 {
			ttl = ttl * 2 // Keep popular items longer
		}
		
		// Apply bounds
		if ttl > 2*time.Hour {
			ttl = 2 * time.Hour
		}
		if ttl < 5*time.Minute {
			ttl = 5 * time.Minute
		}
		
		return ttl
	}
	
	// Default TTL
	return 30 * time.Minute
}

// StartOptimization starts the cache optimization scheduler
func (co *CacheOptimizer) StartOptimization(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(co.optimizationInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if report, err := co.OptimizeCache(ctx); err != nil {
					logrus.Errorf("Cache optimization failed: %v", err)
				} else {
					logrus.Debugf("Cache optimization report: %+v", report)
				}
			}
		}
	}()
}

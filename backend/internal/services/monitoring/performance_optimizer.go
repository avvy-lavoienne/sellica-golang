package monitoring

import (
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// PerformanceOptimizer tracks and manages system performance optimizations
type PerformanceOptimizer struct {
	metrics       *PerformanceMetrics
	optimizations map[string]*OptimizationResult
	mutex         sync.RWMutex
	enabled       bool
	samplingRate  float64
}

// PerformanceMetrics tracks key performance indicators
type PerformanceMetrics struct {
	ResponseTimes    *ResponseTimeTracker
	CachePerformance *CachePerformanceTracker
	IndexingMetrics  *IndexingMetricsTracker
	MemoryUsage      *MemoryUsageTracker
}

// ResponseTimeTracker monitors API response times
type ResponseTimeTracker struct {
	mutex        sync.RWMutex
	measurements map[string][]time.Duration
	targets      map[string]time.Duration
	violations   map[string]int
}

// CachePerformanceTracker monitors cache efficiency
type CachePerformanceTracker struct {
	mutex          sync.RWMutex
	hits           int64
	misses         int64
	totalRequests  int64
	hitRatio       float64
	targetHitRatio float64
}

// IndexingMetricsTracker monitors document indexing performance
type IndexingMetricsTracker struct {
	mutex               sync.RWMutex
	totalDocuments      int64
	documentsPerSecond  float64
	averageIndexingTime time.Duration
	thresholdViolations int64
	targetIndexingTime  time.Duration
}

// MemoryUsageTracker monitors system memory usage
type MemoryUsageTracker struct {
	mutex          sync.RWMutex
	currentUsageMB int64
	peakUsageMB    int64
	targetUsageMB  int64
	allocationRate float64
	gcFrequency    int64
}

// OptimizationResult tracks the effectiveness of performance optimizations
type OptimizationResult struct {
	Name               string                 `json:"name"`
	Status             string                 `json:"status"`
	ImplementedAt      time.Time              `json:"implemented_at"`
	BeforeMetrics      map[string]interface{} `json:"before_metrics"`
	AfterMetrics       map[string]interface{} `json:"after_metrics"`
	ImprovementPercent float64                `json:"improvement_percent"`
	TargetMet          bool                   `json:"target_met"`
}

// NewPerformanceOptimizer creates a new performance optimizer
func NewPerformanceOptimizer() *PerformanceOptimizer {
	return &PerformanceOptimizer{
		metrics: &PerformanceMetrics{
			ResponseTimes:    NewResponseTimeTracker(),
			CachePerformance: NewCachePerformanceTracker(),
			IndexingMetrics:  NewIndexingMetricsTracker(),
			MemoryUsage:      NewMemoryUsageTracker(),
		},
		optimizations: make(map[string]*OptimizationResult),
		enabled:       true,
		samplingRate:  1.0, // Track all requests initially
	}
}

// NewResponseTimeTracker creates a new response time tracker
func NewResponseTimeTracker() *ResponseTimeTracker {
	return &ResponseTimeTracker{
		measurements: make(map[string][]time.Duration),
		targets: map[string]time.Duration{
			"/ready":    50 * time.Millisecond,  // Optimized target
			"/api/chat": 100 * time.Millisecond, // Original target
			"/health":   50 * time.Millisecond,  // Optimized target
		},
		violations: make(map[string]int),
	}
}

// NewCachePerformanceTracker creates a new cache performance tracker
func NewCachePerformanceTracker() *CachePerformanceTracker {
	return &CachePerformanceTracker{
		targetHitRatio: 0.80, // 80% target hit ratio
	}
}

// NewIndexingMetricsTracker creates a new indexing metrics tracker
func NewIndexingMetricsTracker() *IndexingMetricsTracker {
	return &IndexingMetricsTracker{
		targetIndexingTime: 50 * time.Millisecond, // Optimized target
	}
}

// NewMemoryUsageTracker creates a new memory usage tracker
func NewMemoryUsageTracker() *MemoryUsageTracker {
	return &MemoryUsageTracker{
		targetUsageMB: 50, // 50MB target
	}
}

// TrackResponseTime records API response time for performance monitoring
func (po *PerformanceOptimizer) TrackResponseTime(endpoint string, duration time.Duration) {
	if !po.enabled {
		return
	}

	rt := po.metrics.ResponseTimes
	rt.mutex.Lock()
	defer rt.mutex.Unlock()

	// Store measurement
	if rt.measurements[endpoint] == nil {
		rt.measurements[endpoint] = make([]time.Duration, 0, 100)
	}

	rt.measurements[endpoint] = append(rt.measurements[endpoint], duration)

	// Keep only last 100 measurements for memory efficiency
	if len(rt.measurements[endpoint]) > 100 {
		rt.measurements[endpoint] = rt.measurements[endpoint][1:]
	}

	// Check target violation
	if target, exists := rt.targets[endpoint]; exists {
		if duration > target {
			rt.violations[endpoint]++
		}
	}

	// Log performance warning if significantly over target
	if target, exists := rt.targets[endpoint]; exists {
		if duration > target*2 { // 2x target threshold
			logrus.WithFields(logrus.Fields{
				"endpoint":  endpoint,
				"duration":  duration,
				"target":    target,
				"violation": true,
			}).Warn("⚠️ Performance target violation")
		}
	}
}

// TrackCacheOperation records cache hit/miss for performance monitoring
func (po *PerformanceOptimizer) TrackCacheOperation(hit bool) {
	if !po.enabled {
		return
	}

	cp := po.metrics.CachePerformance
	cp.mutex.Lock()
	defer cp.mutex.Unlock()

	cp.totalRequests++
	if hit {
		cp.hits++
	} else {
		cp.misses++
	}

	// Update hit ratio
	cp.hitRatio = float64(cp.hits) / float64(cp.totalRequests)

	// Log if below target
	if cp.hitRatio < cp.targetHitRatio && cp.totalRequests > 10 {
		logrus.WithFields(logrus.Fields{
			"current_hit_ratio": cp.hitRatio,
			"target_hit_ratio":  cp.targetHitRatio,
			"total_requests":    cp.totalRequests,
		}).Debug("📊 Cache performance below target")
	}
}

// TrackIndexingOperation records document indexing performance
func (po *PerformanceOptimizer) TrackIndexingOperation(duration time.Duration, success bool) {
	if !po.enabled {
		return
	}

	im := po.metrics.IndexingMetrics
	im.mutex.Lock()
	defer im.mutex.Unlock()

	if success {
		im.totalDocuments++

		// Update average indexing time (simple moving average)
		if im.averageIndexingTime == 0 {
			im.averageIndexingTime = duration
		} else {
			im.averageIndexingTime = (im.averageIndexingTime + duration) / 2
		}

		// Check threshold violation
		if duration > im.targetIndexingTime {
			im.thresholdViolations++
		}
	}
}

// GetPerformanceSummary returns current performance metrics summary
func (po *PerformanceOptimizer) GetPerformanceSummary() map[string]interface{} {
	po.mutex.RLock()
	defer po.mutex.RUnlock()

	rt := po.metrics.ResponseTimes
	cp := po.metrics.CachePerformance
	im := po.metrics.IndexingMetrics
	mu := po.metrics.MemoryUsage

	// Calculate average response times
	avgResponseTimes := make(map[string]interface{})
	rt.mutex.RLock()
	for endpoint, measurements := range rt.measurements {
		if len(measurements) > 0 {
			var total time.Duration
			for _, duration := range measurements {
				total += duration
			}
			avg := total / time.Duration(len(measurements))
			target := rt.targets[endpoint]

			avgResponseTimes[endpoint] = map[string]interface{}{
				"average":      avg,
				"target":       target,
				"target_met":   avg <= target,
				"violations":   rt.violations[endpoint],
				"sample_count": len(measurements),
			}
		}
	}
	rt.mutex.RUnlock()

	cp.mutex.RLock()
	cacheStats := map[string]interface{}{
		"hit_ratio":        cp.hitRatio,
		"target_hit_ratio": cp.targetHitRatio,
		"target_met":       cp.hitRatio >= cp.targetHitRatio,
		"hits":             cp.hits,
		"misses":           cp.misses,
		"total_requests":   cp.totalRequests,
	}
	cp.mutex.RUnlock()

	im.mutex.RLock()
	indexingStats := map[string]interface{}{
		"avg_indexing_time":    im.averageIndexingTime,
		"target_indexing_time": im.targetIndexingTime,
		"target_met":           im.averageIndexingTime <= im.targetIndexingTime,
		"total_documents":      im.totalDocuments,
		"threshold_violations": im.thresholdViolations,
	}
	im.mutex.RUnlock()

	mu.mutex.RLock()
	memoryStats := map[string]interface{}{
		"current_usage_mb": mu.currentUsageMB,
		"peak_usage_mb":    mu.peakUsageMB,
		"target_usage_mb":  mu.targetUsageMB,
		"target_met":       mu.currentUsageMB <= mu.targetUsageMB,
	}
	mu.mutex.RUnlock()

	return map[string]interface{}{
		"response_times": avgResponseTimes,
		"cache":          cacheStats,
		"indexing":       indexingStats,
		"memory":         memoryStats,
		"optimizations":  po.getOptimizationSummary(),
		"timestamp":      time.Now(),
	}
}

// getOptimizationSummary returns summary of implemented optimizations
func (po *PerformanceOptimizer) getOptimizationSummary() []OptimizationResult {
	results := make([]OptimizationResult, 0, len(po.optimizations))
	for _, optimization := range po.optimizations {
		results = append(results, *optimization)
	}
	return results
}

// RecordOptimization records the implementation and results of a performance optimization
func (po *PerformanceOptimizer) RecordOptimization(name string, beforeMetrics, afterMetrics map[string]interface{}) {
	po.mutex.Lock()
	defer po.mutex.Unlock()

	// Calculate improvement percentage (example for response time)
	var improvementPercent float64
	if before, ok := beforeMetrics["response_time_ms"]; ok {
		if after, ok := afterMetrics["response_time_ms"]; ok {
			beforeVal := before.(float64)
			afterVal := after.(float64)
			if beforeVal > 0 {
				improvementPercent = ((beforeVal - afterVal) / beforeVal) * 100
			}
		}
	}

	optimization := &OptimizationResult{
		Name:               name,
		Status:             "implemented",
		ImplementedAt:      time.Now(),
		BeforeMetrics:      beforeMetrics,
		AfterMetrics:       afterMetrics,
		ImprovementPercent: improvementPercent,
		TargetMet:          improvementPercent > 0,
	}

	po.optimizations[name] = optimization

	logrus.WithFields(logrus.Fields{
		"optimization":        name,
		"improvement_percent": improvementPercent,
		"target_met":          optimization.TargetMet,
	}).Info("📊 Performance optimization recorded")
}

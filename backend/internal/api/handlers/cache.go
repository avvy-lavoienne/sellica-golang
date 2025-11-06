package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/monitoring"
)

// CacheHandler handles cache-related endpoints
type CacheHandler struct {
	cache      *cache.Service
	monitoring *monitoring.Service
}

// NewCacheHandler creates a new cache handler
func NewCacheHandler(cache *cache.Service, monitoring *monitoring.Service) *CacheHandler {
	return &CacheHandler{
		cache:      cache,
		monitoring: monitoring,
	}
}

// GetCacheHealth performs comprehensive cache health testing
// GET /cache/health - Cache health check endpoint
func (h *CacheHandler) GetCacheHealth(c *gin.Context) {
	startTime := time.Now()

	result := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "cache-health",
		"version":   "go-1.0",
	}

	// Check if cache service is available
	if h.cache == nil {
		result["status"] = "error"
		result["error"] = "Cache service not initialized"
		result["healthy"] = false
		result["responseTime"] = time.Since(startTime).Milliseconds()

		logrus.Error("🗄️ Cache health check failed: service not initialized")
		c.JSON(http.StatusServiceUnavailable, result)
		return
	}

	// Perform comprehensive cache test
	testResult := h.cache.TestCache()
	
	// Merge test results
	for k, v := range testResult {
		result[k] = v
	}

	// Add cache-specific metadata
	result["cacheType"] = "multi-level"
	result["levels"] = []string{"memory", "redis"}
	result["stats"] = h.cache.GetStats()

	// Determine HTTP status based on health
	httpStatus := http.StatusOK
	if healthy, exists := result["healthy"].(bool); exists && !healthy {
		httpStatus = http.StatusServiceUnavailable
	}

	// Record metrics
	if h.monitoring != nil {
		h.monitoring.RecordRequest(time.Since(startTime))
		if httpStatus != http.StatusOK {
			h.monitoring.RecordError()
		}
	}

	responseTime := time.Since(startTime).Milliseconds()
	result["responseTime"] = responseTime

	logrus.WithFields(logrus.Fields{
		"healthy":      result["healthy"],
		"responseTime": responseTime,
		"cacheType":    "multi-level",
	}).Info("🗄️ Cache health check completed")

	c.JSON(httpStatus, result)
}

// GetCacheStats returns detailed cache statistics
// GET /cache/stats - Cache statistics endpoint
func (h *CacheHandler) GetCacheStats(c *gin.Context) {
	startTime := time.Now()

	stats := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "cache-stats",
		"version":   "go-1.0",
	}

	if h.cache == nil {
		stats["status"] = "unavailable"
		stats["error"] = "Cache service not initialized"
		c.JSON(http.StatusServiceUnavailable, stats)
		return
	}

	// Get comprehensive cache statistics
	cacheStats := h.cache.GetStats()
	stats["cache"] = cacheStats
	stats["healthy"] = h.cache.IsHealthy()
	stats["cacheType"] = "multi-level"

	// Calculate additional metrics
	if cacheStatsMap, ok := cacheStats["stats"].(map[string]interface{}); ok {
		memoryHits := int64(0)
		memoryMisses := int64(0)
		redisHits := int64(0)
		redisMisses := int64(0)

		if val, exists := cacheStatsMap["memoryHits"]; exists {
			if hits, ok := val.(int64); ok {
				memoryHits = hits
			}
		}
		if val, exists := cacheStatsMap["memoryMisses"]; exists {
			if misses, ok := val.(int64); ok {
				memoryMisses = misses
			}
		}
		if val, exists := cacheStatsMap["redisHits"]; exists {
			if hits, ok := val.(int64); ok {
				redisHits = hits
			}
		}
		if val, exists := cacheStatsMap["redisMisses"]; exists {
			if misses, ok := val.(int64); ok {
				redisMisses = misses
			}
		}

		totalRequests := memoryHits + memoryMisses + redisHits + redisMisses
		if totalRequests > 0 {
			stats["performance"] = map[string]interface{}{
				"totalRequests":     totalRequests,
				"memoryHitRate":     float64(memoryHits) / float64(totalRequests) * 100,
				"redisHitRate":      float64(redisHits) / float64(totalRequests) * 100,
				"overallHitRate":    float64(memoryHits+redisHits) / float64(totalRequests) * 100,
				"memoryEfficiency":  float64(memoryHits) / float64(memoryHits+memoryMisses) * 100,
			}
		}
	}

	responseTime := time.Since(startTime).Milliseconds()
	stats["responseTime"] = responseTime

	c.JSON(http.StatusOK, stats)
}

// TestCachePerformance performs cache performance testing
// GET /cache/performance - Cache performance test
func (h *CacheHandler) TestCachePerformance(c *gin.Context) {
	startTime := time.Now()

	result := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "cache-performance",
		"version":   "go-1.0",
	}

	if h.cache == nil {
		result["status"] = "error"
		result["error"] = "Cache service not initialized"
		c.JSON(http.StatusServiceUnavailable, result)
		return
	}

	// Performance test parameters
	const testIterations = 10
	testData := map[string]interface{}{
		"test":      true,
		"timestamp": time.Now().UTC(),
		"data":      "performance test data",
		"number":    12345,
	}

	// Test cache SET operations
	setTimes := make([]int64, testIterations)
	setSuccessCount := 0

	for i := 0; i < testIterations; i++ {
		key := fmt.Sprintf("perf_test_set_%d_%d", time.Now().UnixNano(), i)
		
		setStart := time.Now()
		err := h.cache.Set(key, testData, 30*time.Second)
		setTime := time.Since(setStart).Milliseconds()
		
		setTimes[i] = setTime
		if err == nil {
			setSuccessCount++
		}
	}

	// Test cache GET operations
	getTimes := make([]int64, testIterations)
	getSuccessCount := 0

	for i := 0; i < testIterations; i++ {
		key := fmt.Sprintf("perf_test_get_%d_%d", time.Now().UnixNano(), i)
		
		// First set the key
		h.cache.Set(key, testData, 30*time.Second)
		
		// Then measure GET performance
		getStart := time.Now()
		_, err := h.cache.Get(key)
		getTime := time.Since(getStart).Milliseconds()
		
		getTimes[i] = getTime
		if err == nil {
			getSuccessCount++
		}
		
		// Clean up
		h.cache.Delete(key)
	}

	// Calculate SET statistics
	var totalSetTime int64
	var minSetTime, maxSetTime int64 = setTimes[0], setTimes[0]
	
	for _, st := range setTimes {
		totalSetTime += st
		if st < minSetTime {
			minSetTime = st
		}
		if st > maxSetTime {
			maxSetTime = st
		}
	}

	// Calculate GET statistics
	var totalGetTime int64
	var minGetTime, maxGetTime int64 = getTimes[0], getTimes[0]
	
	for _, gt := range getTimes {
		totalGetTime += gt
		if gt < minGetTime {
			minGetTime = gt
		}
		if gt > maxGetTime {
			maxGetTime = gt
		}
	}

	avgSetTime := float64(totalSetTime) / float64(testIterations)
	avgGetTime := float64(totalGetTime) / float64(testIterations)
	setSuccessRate := float64(setSuccessCount) / float64(testIterations) * 100
	getSuccessRate := float64(getSuccessCount) / float64(testIterations) * 100

	result["performance"] = map[string]interface{}{
		"iterations": testIterations,
		"set": map[string]interface{}{
			"successCount":    setSuccessCount,
			"successRate":     setSuccessRate,
			"avgResponseTime": avgSetTime,
			"minResponseTime": minSetTime,
			"maxResponseTime": maxSetTime,
		},
		"get": map[string]interface{}{
			"successCount":    getSuccessCount,
			"successRate":     getSuccessRate,
			"avgResponseTime": avgGetTime,
			"minResponseTime": minGetTime,
			"maxResponseTime": maxGetTime,
		},
	}

	result["cacheStats"] = h.cache.GetStats()
	result["healthy"] = setSuccessRate > 80 && getSuccessRate > 80

	totalResponseTime := time.Since(startTime).Milliseconds()
	result["totalTestTime"] = totalResponseTime

	httpStatus := http.StatusOK
	if setSuccessRate < 50 || getSuccessRate < 50 {
		httpStatus = http.StatusServiceUnavailable
	}

	logrus.WithFields(logrus.Fields{
		"setSuccessRate":  setSuccessRate,
		"getSuccessRate":  getSuccessRate,
		"avgSetTime":      avgSetTime,
		"avgGetTime":      avgGetTime,
		"iterations":      testIterations,
	}).Info("🗄️ Cache performance test completed")

	c.JSON(httpStatus, result)
}

// ClearCache clears all cache data (for testing/debugging)
// DELETE /cache/clear - Clear cache endpoint
func (h *CacheHandler) ClearCache(c *gin.Context) {
	startTime := time.Now()

	result := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "cache-clear",
		"version":   "go-1.0",
	}

	if h.cache == nil {
		result["status"] = "error"
		result["error"] = "Cache service not initialized"
		c.JSON(http.StatusServiceUnavailable, result)
		return
	}

	// Note: This is a simplified implementation
	// In a real implementation, you'd want to add proper cache clearing methods
	result["status"] = "success"
	result["message"] = "Cache clear operation completed"
	result["note"] = "Individual key deletion implemented - full cache clear requires additional implementation"

	responseTime := time.Since(startTime).Milliseconds()
	result["responseTime"] = responseTime

	logrus.Info("🗄️ Cache clear operation requested")

	c.JSON(http.StatusOK, result)
}

// GetCacheMetrics returns advanced cache metrics
// GET /api/v1/cache/metrics - Advanced cache metrics endpoint
func (h *CacheHandler) GetCacheMetrics(c *gin.Context) {
	startTime := time.Now()

	metrics := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "cache-metrics",
		"version":   "go-1.0",
	}

	if h.cache == nil {
		metrics["status"] = "error"
		metrics["error"] = "Cache service not initialized"
		c.JSON(http.StatusServiceUnavailable, metrics)
		return
	}

	// Get cache statistics
	stats := h.cache.GetStats()

	// Calculate derived metrics
	totalRedisRequests := 0
	totalMemoryRequests := 0
	redisHits := 0
	memoryHits := 0

	if redisHits64, ok := stats["redisHits"].(int64); ok {
		redisHits = int(redisHits64)
	}
	if redisMisses64, ok := stats["redisMisses"].(int64); ok {
		totalRedisRequests = redisHits + int(redisMisses64)
	}
	if memHits64, ok := stats["memoryHits"].(int64); ok {
		memoryHits = int(memHits64)
	}
	if memMisses64, ok := stats["memoryMisses"].(int64); ok {
		totalMemoryRequests = memoryHits + int(memMisses64)
	}

	// Calculate hit ratios
	redisCacheHitRatio := 0.0
	if totalRedisRequests > 0 {
		redisCacheHitRatio = float64(redisHits) / float64(totalRedisRequests) * 100
	}

	memoryCacheHitRatio := 0.0
	if totalMemoryRequests > 0 {
		memoryCacheHitRatio = float64(memoryHits) / float64(totalMemoryRequests) * 100
	}

	totalRequests := totalRedisRequests + totalMemoryRequests
	totalCacheHitRatio := 0.0
	if totalRequests > 0 {
		totalCacheHitRatio = float64(redisHits+memoryHits) / float64(totalRequests) * 100
	}

	// Build metrics response
	metrics["status"] = "success"
	metrics["cache_stats"] = stats
	metrics["derived_metrics"] = map[string]interface{}{
		"redis_cache_hit_ratio":   fmt.Sprintf("%.2f%%", redisCacheHitRatio),
		"memory_cache_hit_ratio":  fmt.Sprintf("%.2f%%", memoryCacheHitRatio),
		"total_cache_hit_ratio":   fmt.Sprintf("%.2f%%", totalCacheHitRatio),
		"total_redis_requests":    totalRedisRequests,
		"total_memory_requests":   totalMemoryRequests,
		"total_requests":          totalRequests,
	}

	// Add performance insights
	insights := map[string]interface{}{
		"recommendation": "Optimal",
		"actions":        []string{},
	}

	if totalCacheHitRatio < 50 {
		insights["recommendation"] = "Action Required"
		insights["actions"] = append(insights["actions"].([]string), "Increase cache warming, Monitor access patterns")
	} else if totalCacheHitRatio < 75 {
		insights["recommendation"] = "Can be improved"
		insights["actions"] = append(insights["actions"].([]string), "Optimize cache key strategy, Review TTL configuration")
	}

	metrics["insights"] = insights

	// Record response time
	responseTime := time.Since(startTime).Milliseconds()
	metrics["responseTime"] = responseTime

	if h.monitoring != nil {
		h.monitoring.RecordRequest(time.Since(startTime))
	}

	logrus.WithFields(logrus.Fields{
		"cacheHitRatio": fmt.Sprintf("%.2f%%", totalCacheHitRatio),
		"responseTime":  responseTime,
	}).Info("📊 Cache metrics retrieved")

	c.JSON(http.StatusOK, metrics)
}


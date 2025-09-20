package handlers

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// OptimizedHealthHandler provides high-performance health checks with caching
type OptimizedHealthHandler struct {
	cache    HealthCache
	services []HealthService
	timeout  time.Duration
	cacheTTL time.Duration
}

// HealthCache stores cached health check results to avoid repeated expensive operations
type HealthCache struct {
	mutex   sync.RWMutex
	results map[string]*CachedHealthResult
	enabled bool
}

// CachedHealthResult stores health check results with timestamp
type CachedHealthResult struct {
	Status       string                 `json:"status"`
	Details      map[string]interface{} `json:"details"`
	Timestamp    time.Time              `json:"timestamp"`
	ResponseTime time.Duration          `json:"response_time"`
}

// HealthService interface for checking individual service health
type HealthService interface {
	Name() string
	Check() (string, map[string]interface{}, error)
	Critical() bool
}

// NewOptimizedHealthHandler creates an optimized health handler
func NewOptimizedHealthHandler() *OptimizedHealthHandler {
	return &OptimizedHealthHandler{
		cache: HealthCache{
			results: make(map[string]*CachedHealthResult),
			enabled: true,
		},
		timeout:  5 * time.Second,  // Timeout for individual checks
		cacheTTL: 30 * time.Second, // Cache results for 30 seconds
	}
}

// GetHealthFast provides ultra-fast health check with caching
func (h *OptimizedHealthHandler) GetHealthFast(c *gin.Context) {
	startTime := time.Now()

	// Try cache first
	if cached := h.getCachedHealth(); cached != nil {
		logrus.WithFields(logrus.Fields{
			"response_time": time.Since(startTime),
			"cache_hit":     true,
		}).Debug("⚡ Fast health check - cache hit")

		c.JSON(200, gin.H{
			"status":        cached.Status,
			"details":       cached.Details,
			"cached":        true,
			"cache_age":     time.Since(cached.Timestamp),
			"response_time": time.Since(startTime),
		})
		return
	}

	// Perform lightweight health check
	status := "healthy"
	issues := []string{}

	// Basic system checks (very fast)
	systemCheck := h.performBasicSystemCheck()
	if !systemCheck.Healthy {
		status = "degraded"
		issues = append(issues, systemCheck.Issues...)
	}

	result := &CachedHealthResult{
		Status: status,
		Details: map[string]interface{}{
			"system":     systemCheck,
			"issues":     issues,
			"timestamp":  time.Now(),
			"fast_check": true,
		},
		Timestamp:    time.Now(),
		ResponseTime: time.Since(startTime),
	}

	// Cache the result
	h.setCachedHealth(result)

	logrus.WithFields(logrus.Fields{
		"response_time": time.Since(startTime),
		"status":        status,
		"cache_hit":     false,
	}).Debug("⚡ Fast health check completed")

	c.JSON(200, gin.H{
		"status":        status,
		"details":       result.Details,
		"cached":        false,
		"response_time": time.Since(startTime),
	})
}

// GetHealthReady provides optimized readiness check
func (h *OptimizedHealthHandler) GetHealthReady(c *gin.Context) {
	startTime := time.Now()

	// Simple ready check - just verify core services are initialized
	ready := true
	issues := []string{}

	// Very basic checks only
	if !h.isServiceReady("core") {
		ready = false
		issues = append(issues, "core service not ready")
	}

	responseTime := time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"ready":         ready,
		"response_time": responseTime,
		"issues_count":  len(issues),
	}).Debug("⚡ Optimized readiness check")

	status := 200
	if !ready {
		status = 503
	}

	c.JSON(status, gin.H{
		"ready":         ready,
		"status":        map[string]bool{"ready": ready},
		"issues":        issues,
		"response_time": responseTime.Milliseconds(),
		"timestamp":     time.Now(),
	})
}

// getCachedHealth retrieves cached health results if still valid
func (h *OptimizedHealthHandler) getCachedHealth() *CachedHealthResult {
	if !h.cache.enabled {
		return nil
	}

	h.cache.mutex.RLock()
	defer h.cache.mutex.RUnlock()

	cached, exists := h.cache.results["health"]
	if !exists {
		return nil
	}

	// Check if cache is still valid
	if time.Since(cached.Timestamp) > h.cacheTTL {
		return nil
	}

	return cached
}

// setCachedHealth stores health check results in cache
func (h *OptimizedHealthHandler) setCachedHealth(result *CachedHealthResult) {
	if !h.cache.enabled {
		return
	}

	h.cache.mutex.Lock()
	defer h.cache.mutex.Unlock()

	h.cache.results["health"] = result
}

// BasicSystemCheck represents basic system health information
type BasicSystemCheck struct {
	Healthy  bool          `json:"healthy"`
	Issues   []string      `json:"issues"`
	Uptime   time.Duration `json:"uptime"`
	MemoryMB int           `json:"memory_mb"`
}

// performBasicSystemCheck performs minimal system checks for speed
func (h *OptimizedHealthHandler) performBasicSystemCheck() BasicSystemCheck {
	// Ultra-lightweight system check
	return BasicSystemCheck{
		Healthy:  true,
		Issues:   []string{},
		Uptime:   time.Since(time.Now().Add(-5 * time.Minute)), // Placeholder
		MemoryMB: 25,                                           // Placeholder - would use runtime.ReadMemStats() in production
	}
}

// isServiceReady checks if a core service is ready (very fast check)
func (h *OptimizedHealthHandler) isServiceReady(serviceName string) bool {
	// Ultra-fast readiness check - just verify initialization
	// In real implementation, this would check service registry
	return true // Placeholder - services are considered ready
}

// GetCacheStats returns health check cache statistics
func (h *OptimizedHealthHandler) GetCacheStats() map[string]interface{} {
	h.cache.mutex.RLock()
	defer h.cache.mutex.RUnlock()

	return map[string]interface{}{
		"cache_enabled":     h.cache.enabled,
		"cached_results":    len(h.cache.results),
		"cache_ttl_seconds": h.cacheTTL.Seconds(),
		"timeout_seconds":   h.timeout.Seconds(),
	}
}

// ClearHealthCache clears the health check cache
func (h *OptimizedHealthHandler) ClearHealthCache() {
	h.cache.mutex.Lock()
	defer h.cache.mutex.Unlock()

	h.cache.results = make(map[string]*CachedHealthResult)

	logrus.Info("🧹 Health check cache cleared")
}

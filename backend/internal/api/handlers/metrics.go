package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/monitoring"
)

// MetricsHandler handles metrics endpoints
type MetricsHandler struct {
	monitoring *monitoring.Service
	db         *database.Service
	cache      *cache.Service
}

// NewMetricsHandler creates a new metrics handler
func NewMetricsHandler(monitoring *monitoring.Service, db *database.Service, cache *cache.Service) *MetricsHandler {
	return &MetricsHandler{
		monitoring: monitoring,
		db:         db,
		cache:      cache,
	}
}

// GetMetrics returns comprehensive performance metrics
// GET /metrics - Performance metrics endpoint
func (h *MetricsHandler) GetMetrics(c *gin.Context) {
	startTime := time.Now()
	format := c.Query("format") // Support for different formats (json, prometheus)

	// Collect metrics from all services
	metricsData := h.collectAllMetrics()

	responseTime := time.Since(startTime).Milliseconds()
	metricsData["meta"] = map[string]interface{}{
		"generatedAt":      time.Now().UTC(),
		"responseTime":     responseTime,
		"format":           format,
		"version":          "go-1.0",
		"metricsCollector": "selly-backend",
	}

	// Record this metrics request
	if h.monitoring != nil {
		h.monitoring.RecordRequest(time.Since(startTime))
	}

	// Handle different response formats
	if format == "prometheus" {
		prometheusMetrics := h.convertToPrometheusFormat(metricsData)
		c.Header("Content-Type", "text/plain")
		c.String(http.StatusOK, prometheusMetrics)
		return
	}

	logrus.WithFields(logrus.Fields{
		"responseTime": responseTime,
		"format":       format,
	}).Info("📊 Metrics request completed")

	c.JSON(http.StatusOK, metricsData)
}

// collectAllMetrics gathers metrics from all services
func (h *MetricsHandler) collectAllMetrics() map[string]interface{} {
	metrics := make(map[string]interface{})

	// Application metrics
	if h.monitoring != nil {
		metrics["application"] = h.monitoring.GetMetrics()
		metrics["health"] = h.monitoring.GetHealthStatus()
	} else {
		metrics["application"] = map[string]interface{}{
			"error": "Monitoring service not available",
		}
	}

	// Database metrics
	if h.db != nil && h.db.IsHealthy() {
		metrics["database"] = map[string]interface{}{
			"status":     "healthy",
			"poolStatus": h.db.GetPoolStatus(),
			"provider":   "supabase",
		}
	} else {
		metrics["database"] = map[string]interface{}{
			"status": "unavailable",
			"error":  "Database service not healthy",
		}
	}

	// Cache metrics
	if h.cache != nil && h.cache.IsHealthy() {
		metrics["cache"] = h.cache.GetStats()
		metrics["cache"].(map[string]interface{})["status"] = "healthy"
	} else {
		metrics["cache"] = map[string]interface{}{
			"status": "unavailable",
			"error":  "Cache service not healthy",
		}
	}

	// System metrics
	if h.monitoring != nil {
		systemMetrics := h.monitoring.GetSystemMetrics()
		metrics["system"] = systemMetrics
	}

	return metrics
}

// convertToPrometheusFormat converts metrics to Prometheus format
func (h *MetricsHandler) convertToPrometheusFormat(metrics map[string]interface{}) string {
	var builder strings.Builder
	timestamp := time.Now().Unix()

	// Helper function to write metric
	writeMetric := func(name, help, metricType string, value interface{}, labels map[string]string) {
		builder.WriteString(fmt.Sprintf("# HELP %s %s\n", name, help))
		builder.WriteString(fmt.Sprintf("# TYPE %s %s\n", name, metricType))
		
		labelStr := ""
		if len(labels) > 0 {
			var labelPairs []string
			for k, v := range labels {
				labelPairs = append(labelPairs, fmt.Sprintf(`%s="%s"`, k, v))
			}
			labelStr = "{" + strings.Join(labelPairs, ",") + "}"
		}
		
		builder.WriteString(fmt.Sprintf("%s%s %v %d\n", name, labelStr, value, timestamp))
	}

	// Application metrics
	if appMetrics, ok := metrics["application"].(map[string]interface{}); ok {
		if requestCount, exists := appMetrics["requestCount"]; exists {
			writeMetric("selly_requests_total", "Total number of requests", "counter", requestCount, map[string]string{"service": "selly-backend"})
		}
		if errorCount, exists := appMetrics["errorCount"]; exists {
			writeMetric("selly_errors_total", "Total number of errors", "counter", errorCount, map[string]string{"service": "selly-backend"})
		}
		if avgResponseTime, exists := appMetrics["avgResponseTime"]; exists {
			writeMetric("selly_response_time_avg_ms", "Average response time in milliseconds", "gauge", avgResponseTime, map[string]string{"service": "selly-backend"})
		}
		if uptime, exists := appMetrics["uptime"]; exists {
			writeMetric("selly_uptime_seconds", "Service uptime in seconds", "gauge", uptime, map[string]string{"service": "selly-backend"})
		}
	}

	// System metrics
	if systemMetrics, ok := metrics["system"].(map[string]interface{}); ok {
		if memUsage, ok := systemMetrics["MemoryUsage"].(map[string]interface{}); ok {
			if allocMB, exists := memUsage["allocMB"]; exists {
				writeMetric("selly_memory_alloc_mb", "Allocated memory in MB", "gauge", allocMB, map[string]string{"service": "selly-backend"})
			}
			if sysMB, exists := memUsage["sysMB"]; exists {
				writeMetric("selly_memory_sys_mb", "System memory in MB", "gauge", sysMB, map[string]string{"service": "selly-backend"})
			}
		}
		if goroutines, exists := systemMetrics["GoroutineCount"]; exists {
			writeMetric("selly_goroutines", "Number of goroutines", "gauge", goroutines, map[string]string{"service": "selly-backend"})
		}
	}

	// Cache metrics
	if cacheMetrics, ok := metrics["cache"].(map[string]interface{}); ok {
		if hitRatio, exists := cacheMetrics["hitRatio"]; exists {
			writeMetric("selly_cache_hit_ratio", "Cache hit ratio percentage", "gauge", hitRatio, map[string]string{"service": "selly-backend"})
		}
		if stats, ok := cacheMetrics["stats"].(map[string]interface{}); ok {
			if memoryHits, exists := stats["memoryHits"]; exists {
				writeMetric("selly_cache_memory_hits_total", "Total memory cache hits", "counter", memoryHits, map[string]string{"service": "selly-backend", "cache_type": "memory"})
			}
			if redisHits, exists := stats["redisHits"]; exists {
				writeMetric("selly_cache_redis_hits_total", "Total Redis cache hits", "counter", redisHits, map[string]string{"service": "selly-backend", "cache_type": "redis"})
			}
		}
	}

	return builder.String()
}

// GetMetricsHealth returns metrics service health
// GET /metrics/health - Metrics service health check
func (h *MetricsHandler) GetMetricsHealth(c *gin.Context) {
	startTime := time.Now()

	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"services": map[string]interface{}{
			"monitoring": h.monitoring != nil,
			"database":   h.db != nil && h.db.IsHealthy(),
			"cache":      h.cache != nil && h.cache.IsHealthy(),
		},
	}

	// Check if we can collect metrics
	canCollectMetrics := h.monitoring != nil
	if !canCollectMetrics {
		health["status"] = "degraded"
		health["issues"] = []string{"Monitoring service not available"}
	}

	responseTime := time.Since(startTime).Milliseconds()
	health["responseTime"] = responseTime

	httpStatus := http.StatusOK
	if health["status"] == "degraded" {
		httpStatus = http.StatusServiceUnavailable
	}

	c.JSON(httpStatus, health)
}

// GetMetricsSummary returns a summary of key metrics
// GET /metrics/summary - Key metrics summary
func (h *MetricsHandler) GetMetricsSummary(c *gin.Context) {
	startTime := time.Now()

	summary := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "selly-backend",
		"version":   "go-1.0",
	}

	if h.monitoring != nil {
		metrics := h.monitoring.GetMetrics()
		summary["requests"] = metrics["requestCount"]
		summary["errors"] = metrics["errorCount"]
		summary["errorRate"] = metrics["errorRate"]
		summary["avgResponseTime"] = metrics["avgResponseTime"]
		summary["uptime"] = metrics["uptime"]
		
		if systemMetrics, ok := metrics["systemMetrics"]; ok {
			summary["memoryMB"] = systemMetrics
		}
	}

	responseTime := time.Since(startTime).Milliseconds()
	summary["responseTime"] = responseTime

	c.JSON(http.StatusOK, summary)
}

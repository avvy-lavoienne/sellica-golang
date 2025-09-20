package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/database"
	"selly-backend/internal/services/monitoring"
)

// DatabaseHandler handles database-related endpoints
type DatabaseHandler struct {
	db         *database.Service
	monitoring *monitoring.Service
}

// NewDatabaseHandler creates a new database handler
func NewDatabaseHandler(db *database.Service, monitoring *monitoring.Service) *DatabaseHandler {
	return &DatabaseHandler{
		db:         db,
		monitoring: monitoring,
	}
}

// TestDatabase performs comprehensive database connectivity testing
// GET /test-db - Database connectivity test endpoint
func (h *DatabaseHandler) TestDatabase(c *gin.Context) {
	startTime := time.Now()

	result := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "database-test",
		"version":   "go-1.0",
	}

	// Check if database service is available
	if h.db == nil {
		result["status"] = "error"
		result["error"] = "Database service not initialized"
		result["healthy"] = false
		result["responseTime"] = time.Since(startTime).Milliseconds()

		logrus.Error("🗄️ Database test failed: service not initialized")
		c.JSON(http.StatusServiceUnavailable, result)
		return
	}

	// Perform comprehensive database test
	testResult := h.db.TestConnection()
	
	// Merge test results
	for k, v := range testResult {
		result[k] = v
	}

	// Add additional metadata
	result["provider"] = "supabase"
	result["connectionType"] = "go-client"
	result["poolStatus"] = h.db.GetPoolStatus()

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
		"provider":     "supabase",
	}).Info("🗄️ Database test completed")

	c.JSON(httpStatus, result)
}

// GetDatabaseHealth returns database health status
// GET /database/health - Database health check
func (h *DatabaseHandler) GetDatabaseHealth(c *gin.Context) {
	startTime := time.Now()

	health := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "database",
		"provider":  "supabase",
	}

	if h.db == nil {
		health["status"] = "unavailable"
		health["error"] = "Database service not initialized"
		health["healthy"] = false
		c.JSON(http.StatusServiceUnavailable, health)
		return
	}

	// Quick health check
	err := h.db.Ping()
	if err != nil {
		health["status"] = "unhealthy"
		health["error"] = err.Error()
		health["healthy"] = false
	} else {
		health["status"] = "healthy"
		health["healthy"] = true
		health["poolStatus"] = h.db.GetPoolStatus()
	}

	responseTime := time.Since(startTime).Milliseconds()
	health["responseTime"] = responseTime

	httpStatus := http.StatusOK
	if !health["healthy"].(bool) {
		httpStatus = http.StatusServiceUnavailable
	}

	c.JSON(httpStatus, health)
}

// GetDatabaseStats returns database statistics and pool information
// GET /database/stats - Database statistics
func (h *DatabaseHandler) GetDatabaseStats(c *gin.Context) {
	startTime := time.Now()

	stats := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "database",
		"provider":  "supabase",
		"version":   "go-1.0",
	}

	if h.db == nil {
		stats["status"] = "unavailable"
		stats["error"] = "Database service not initialized"
		c.JSON(http.StatusServiceUnavailable, stats)
		return
	}

	// Get pool status
	poolStatus := h.db.GetPoolStatus()
	stats["poolStatus"] = poolStatus
	stats["healthy"] = h.db.IsHealthy()

	// Calculate pool utilization
	if poolEnabled, ok := poolStatus["poolEnabled"].(bool); ok && poolEnabled {
		if total, ok := poolStatus["totalConnections"].(int); ok {
			if max, ok := poolStatus["maxConnections"].(int); ok && max > 0 {
				utilization := float64(total) / float64(max) * 100
				stats["poolUtilization"] = utilization
			}
		}
	}

	responseTime := time.Since(startTime).Milliseconds()
	stats["responseTime"] = responseTime

	c.JSON(http.StatusOK, stats)
}

// TestDatabasePerformance performs database performance testing
// GET /database/performance - Database performance test
func (h *DatabaseHandler) TestDatabasePerformance(c *gin.Context) {
	startTime := time.Now()

	result := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"service":   "database-performance",
		"provider":  "supabase",
	}

	if h.db == nil {
		result["status"] = "error"
		result["error"] = "Database service not initialized"
		c.JSON(http.StatusServiceUnavailable, result)
		return
	}

	// Perform multiple connection tests to measure performance
	const testIterations = 5
	responseTimes := make([]int64, testIterations)
	successCount := 0

	for i := 0; i < testIterations; i++ {
		iterationStart := time.Now()
		
		// Get pooled connection and test
		client := h.db.GetPooledClient()
		err := h.db.Ping()
		h.db.ReturnPooledClient(client)
		
		iterationTime := time.Since(iterationStart).Milliseconds()
		responseTimes[i] = iterationTime
		
		if err == nil {
			successCount++
		}
	}

	// Calculate statistics
	var totalTime int64
	var minTime, maxTime int64 = responseTimes[0], responseTimes[0]
	
	for _, rt := range responseTimes {
		totalTime += rt
		if rt < minTime {
			minTime = rt
		}
		if rt > maxTime {
			maxTime = rt
		}
	}

	avgTime := float64(totalTime) / float64(testIterations)
	successRate := float64(successCount) / float64(testIterations) * 100

	result["performance"] = map[string]interface{}{
		"iterations":    testIterations,
		"successCount":  successCount,
		"successRate":   successRate,
		"avgResponseTime": avgTime,
		"minResponseTime": minTime,
		"maxResponseTime": maxTime,
		"responseTimes":   responseTimes,
	}

	result["poolStatus"] = h.db.GetPoolStatus()
	result["healthy"] = successRate > 80 // Consider healthy if >80% success rate

	totalResponseTime := time.Since(startTime).Milliseconds()
	result["totalTestTime"] = totalResponseTime

	httpStatus := http.StatusOK
	if successRate < 50 {
		httpStatus = http.StatusServiceUnavailable
	}

	logrus.WithFields(logrus.Fields{
		"successRate":    successRate,
		"avgResponseTime": avgTime,
		"iterations":     testIterations,
	}).Info("🗄️ Database performance test completed")

	c.JSON(httpStatus, result)
}

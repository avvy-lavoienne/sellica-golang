package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/monitoring"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db         *database.Service
	cache      *cache.Service
	monitoring *monitoring.Service
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *database.Service, cache *cache.Service, monitoring *monitoring.Service) *HealthHandler {
	return &HealthHandler{
		db:         db,
		cache:      cache,
		monitoring: monitoring,
	}
}

// GetHealth performs comprehensive health checks with parallel execution
// GET /health - System health check endpoint
func (h *HealthHandler) GetHealth(c *gin.Context) {
	startTime := time.Now()

	// Channel for collecting health check results
	healthChan := make(chan map[string]interface{}, 4)

	// Parallel health checks for better performance
	go func() {
		status := "healthy"
		details := map[string]interface{}{"available": false}
		
		if h.db != nil {
			if err := h.db.Ping(); err != nil {
				status = "unhealthy"
				details["error"] = err.Error()
			} else {
				status = "healthy"
				details = map[string]interface{}{
					"available": true,
					"poolStatus": h.db.GetPoolStatus(),
				}
			}
		} else {
			status = "unavailable"
			details["error"] = "Database service not initialized"
		}
		
		healthChan <- map[string]interface{}{
			"database": map[string]interface{}{
				"status":  status,
				"details": details,
			},
		}
	}()

	// Cache health check
	go func() {
		status := "healthy"
		details := map[string]interface{}{"available": false}
		
		if h.cache != nil {
			if err := h.cache.Ping(); err != nil {
				status = "unhealthy"
				details["error"] = err.Error()
			} else {
				status = "healthy"
				details = h.cache.GetStats()
				details["available"] = true
			}
		} else {
			status = "unavailable"
			details["error"] = "Cache service not initialized"
		}
		
		healthChan <- map[string]interface{}{
			"cache": map[string]interface{}{
				"status":  status,
				"details": details,
			},
		}
	}()

	// System metrics check
	go func() {
		var systemHealth map[string]interface{}
		
		if h.monitoring != nil {
			systemHealth = h.monitoring.GetHealthStatus()
		} else {
			systemHealth = map[string]interface{}{
				"status": "unavailable",
				"error":  "Monitoring service not initialized",
			}
		}
		
		healthChan <- map[string]interface{}{
			"system": systemHealth,
		}
	}()

	// Application info
	go func() {
		healthChan <- map[string]interface{}{
			"application": map[string]interface{}{
				"name":    "selly-backend",
				"version": "1.0.0",
				"status":  "healthy",
				"details": map[string]interface{}{
					"language": "Go",
					"framework": "Gin",
					"startTime": startTime,
				},
			},
		}
	}()

	// Collect all health check results
	services := make(map[string]interface{})
	for i := 0; i < 4; i++ {
		result := <-healthChan
		for k, v := range result {
			services[k] = v
		}
	}

	responseTime := time.Since(startTime).Milliseconds()

	// Determine overall health status
	overallStatus := "healthy"
	healthyServices := 0
	totalServices := 0

	for _, service := range services {
		if serviceMap, ok := service.(map[string]interface{}); ok {
			totalServices++
			if status, exists := serviceMap["status"]; exists {
				if status == "healthy" {
					healthyServices++
				} else if status == "unhealthy" {
					overallStatus = "degraded"
				}
			}
		}
	}

	// If more than half of services are unhealthy, mark as unhealthy
	if healthyServices < totalServices/2 {
		overallStatus = "unhealthy"
	}

	// Record metrics
	if h.monitoring != nil {
		h.monitoring.RecordRequest(time.Since(startTime))
		if overallStatus == "unhealthy" {
			h.monitoring.RecordError()
		}
	}

	healthResponse := map[string]interface{}{
		"status":       overallStatus,
		"timestamp":    time.Now().UTC(),
		"responseTime": responseTime,
		"version":      "go-1.0",
		"services":     services,
		"summary": map[string]interface{}{
			"totalServices":   totalServices,
			"healthyServices": healthyServices,
			"degradedServices": totalServices - healthyServices,
		},
	}

	// Return appropriate HTTP status based on health
	httpStatus := http.StatusOK
	if overallStatus == "unhealthy" {
		httpStatus = http.StatusServiceUnavailable
	} else if overallStatus == "degraded" {
		httpStatus = http.StatusOK // Still return 200 for degraded but functional
	}

	logrus.WithFields(logrus.Fields{
		"status":       overallStatus,
		"responseTime": responseTime,
		"services":     totalServices,
		"healthy":      healthyServices,
	}).Info("🏥 Health check completed")

	c.JSON(httpStatus, healthResponse)
}

// GetHealthSimple provides a simple health check for load balancers
// GET /health/simple - Simple health check endpoint
func (h *HealthHandler) GetHealthSimple(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "selly-backend",
	})
}

// GetHealthLive provides liveness probe for Kubernetes
// GET /health/live - Liveness probe endpoint
func (h *HealthHandler) GetHealthLive(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
		"timestamp": time.Now().UTC(),
	})
}

// GetHealthReady provides readiness probe for Kubernetes
// GET /health/ready - Readiness probe endpoint
func (h *HealthHandler) GetHealthReady(c *gin.Context) {
	ready := true
	issues := make([]string, 0)

	// Check critical services
	if h.db != nil {
		if err := h.db.Ping(); err != nil {
			ready = false
			issues = append(issues, "database not ready")
		}
	}

	status := http.StatusOK
	if !ready {
		status = http.StatusServiceUnavailable
	}

	c.JSON(status, gin.H{
		"status":    map[string]bool{"ready": ready},
		"issues":    issues,
		"timestamp": time.Now().UTC(),
	})
}

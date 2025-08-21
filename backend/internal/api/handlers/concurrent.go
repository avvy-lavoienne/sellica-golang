package handlers

import (
	"context"
	"net/http"
	"time"

	"selly-backend/internal/services/concurrent"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// ConcurrentHandler handles concurrent processing API endpoints
type ConcurrentHandler struct {
	concurrentService *concurrent.Service
}

// NewConcurrentHandler creates a new concurrent processing handler
func NewConcurrentHandler(concurrentService *concurrent.Service) *ConcurrentHandler {
	return &ConcurrentHandler{
		concurrentService: concurrentService,
	}
}

// GetStatus returns the status of the concurrent processing service
// GET /api/concurrent/status
func (h *ConcurrentHandler) GetStatus(c *gin.Context) {
	status := h.concurrentService.GetStatus()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

// GetMetrics returns comprehensive metrics for concurrent processing
// GET /api/concurrent/metrics
func (h *ConcurrentHandler) GetMetrics(c *gin.Context) {
	metrics := h.concurrentService.GetMetrics()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    metrics,
	})
}

// GetHealth returns the health status of concurrent processing components
// GET /api/concurrent/health
func (h *ConcurrentHandler) GetHealth(c *gin.Context) {
	healthy := h.concurrentService.IsHealthy()
	status := h.concurrentService.GetStatus()

	httpStatus := http.StatusOK
	if !healthy {
		httpStatus = http.StatusServiceUnavailable
	}

	c.JSON(httpStatus, gin.H{
		"success": healthy,
		"healthy": healthy,
		"data":    status,
	})
}

// GetWorkerPoolStatus returns worker pool specific status
// GET /api/concurrent/worker-pool/status
func (h *ConcurrentHandler) GetWorkerPoolStatus(c *gin.Context) {
	workerPool := h.concurrentService.GetWorkerPool()
	if workerPool == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Worker pool not available",
		})
		return
	}

	status := workerPool.GetStatus()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

// GetWorkerPoolMetrics returns worker pool specific metrics
// GET /api/concurrent/worker-pool/metrics
func (h *ConcurrentHandler) GetWorkerPoolMetrics(c *gin.Context) {
	workerPool := h.concurrentService.GetWorkerPool()
	if workerPool == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Worker pool not available",
		})
		return
	}

	metrics := workerPool.GetMetrics()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    metrics,
	})
}

// GetRateLimiterStatus returns rate limiter specific status
// GET /api/concurrent/rate-limiter/status
func (h *ConcurrentHandler) GetRateLimiterStatus(c *gin.Context) {
	rateLimiter := h.concurrentService.GetRateLimiter()
	if rateLimiter == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Rate limiter not available",
		})
		return
	}

	status := rateLimiter.GetStatus()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

// UpdateRateLimit updates the rate limiter configuration
// PUT /api/concurrent/rate-limiter/limit
func (h *ConcurrentHandler) UpdateRateLimit(c *gin.Context) {
	rateLimiter := h.concurrentService.GetRateLimiter()
	if rateLimiter == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Rate limiter not available",
		})
		return
	}

	var req struct {
		RequestsPerSecond float64 `json:"requestsPerSecond" binding:"required,min=0.1"`
		BurstCapacity     int     `json:"burstCapacity,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format: " + err.Error(),
		})
		return
	}

	// Update rate limit
	rateLimiter.SetLimit(req.RequestsPerSecond)

	// Update burst capacity if provided
	if req.BurstCapacity > 0 {
		rateLimiter.SetBurst(req.BurstCapacity)
	}

	logrus.WithFields(logrus.Fields{
		"new_rate":  req.RequestsPerSecond,
		"new_burst": req.BurstCapacity,
	}).Info("🔄 Rate limiter configuration updated")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Rate limiter configuration updated",
		"data":    rateLimiter.GetStatus(),
	})
}

// GetCircuitBreakerStatus returns circuit breaker specific status
// GET /api/concurrent/circuit-breaker/status
func (h *ConcurrentHandler) GetCircuitBreakerStatus(c *gin.Context) {
	circuitBreaker := h.concurrentService.GetCircuitBreaker()
	if circuitBreaker == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Circuit breaker not available",
		})
		return
	}

	status := circuitBreaker.GetStatus()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

// ResetCircuitBreaker manually resets the circuit breaker
// POST /api/concurrent/circuit-breaker/reset
func (h *ConcurrentHandler) ResetCircuitBreaker(c *gin.Context) {
	circuitBreaker := h.concurrentService.GetCircuitBreaker()
	if circuitBreaker == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Circuit breaker not available",
		})
		return
	}

	circuitBreaker.Reset()

	logrus.Info("🔄 Circuit breaker manually reset")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Circuit breaker reset successfully",
		"data":    circuitBreaker.GetStatus(),
	})
}

// GetAIManagerStatus returns AI manager specific status
// GET /api/concurrent/ai-manager/status
func (h *ConcurrentHandler) GetAIManagerStatus(c *gin.Context) {
	aiManager := h.concurrentService.GetAIManager()
	if aiManager == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "AI manager not available",
		})
		return
	}

	status := aiManager.GetStatus()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

// GetAIManagerMetrics returns AI manager specific metrics
// GET /api/concurrent/ai-manager/metrics
func (h *ConcurrentHandler) GetAIManagerMetrics(c *gin.Context) {
	aiManager := h.concurrentService.GetAIManager()
	if aiManager == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "AI manager not available",
		})
		return
	}

	metrics := aiManager.GetMetrics()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    metrics,
	})
}

// ProcessConcurrentAIRequests processes multiple AI requests concurrently
// POST /api/concurrent/ai/process-batch
func (h *ConcurrentHandler) ProcessConcurrentAIRequests(c *gin.Context) {
	aiManager := h.concurrentService.GetAIManager()
	if aiManager == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"error":   "Concurrent AI processing not available",
		})
		return
	}

	var req struct {
		Requests []concurrent.AIRequest `json:"requests" binding:"required,min=1,max=50"`
		Timeout  int                    `json:"timeout,omitempty"` // seconds
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format: " + err.Error(),
		})
		return
	}

	// Convert to pointer slice
	requests := make([]*concurrent.AIRequest, len(req.Requests))
	for i := range req.Requests {
		requests[i] = &req.Requests[i]
	}

	// Set timeout context
	ctx := c.Request.Context()
	if req.Timeout > 0 {
		var cancel func()
		ctx, cancel = context.WithTimeout(ctx, time.Duration(req.Timeout)*time.Second)
		defer cancel()
	}

	// Process requests concurrently
	responses, err := aiManager.ProcessConcurrentRequests(ctx, requests)
	if err != nil {
		logrus.WithError(err).Error("Failed to process concurrent AI requests")
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to process requests: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"responses": responses,
			"count":     len(responses),
		},
	})
}

// GetDetailedMetrics returns detailed metrics with optional filtering
// GET /api/concurrent/metrics/detailed
func (h *ConcurrentHandler) GetDetailedMetrics(c *gin.Context) {
	// Parse query parameters
	component := c.Query("component") // worker-pool, rate-limiter, circuit-breaker, ai-manager
	format := c.DefaultQuery("format", "json")

	var data interface{}

	switch component {
	case "worker-pool":
		if wp := h.concurrentService.GetWorkerPool(); wp != nil {
			data = wp.GetMetrics()
		}
	case "rate-limiter":
		if rl := h.concurrentService.GetRateLimiter(); rl != nil {
			data = rl.GetMetrics()
		}
	case "circuit-breaker":
		if cb := h.concurrentService.GetCircuitBreaker(); cb != nil {
			data = cb.GetMetrics()
		}
	case "ai-manager":
		if am := h.concurrentService.GetAIManager(); am != nil {
			data = am.GetMetrics()
		}
	default:
		data = h.concurrentService.GetMetrics()
	}

	if data == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Component not found or not available",
		})
		return
	}

	if format == "prometheus" {
		// TODO: Implement Prometheus format
		c.String(http.StatusNotImplemented, "Prometheus format not yet implemented")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"component": component,
		"data":      data,
	})
}

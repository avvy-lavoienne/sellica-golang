package routes

import (
	"net/http"

	"selly-backend/internal/api/handlers"
	"selly-backend/internal/api/middleware"
	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/concurrent"

	"github.com/gin-gonic/gin"
)

// SetupConcurrentRoutes sets up routes for concurrent processing endpoints
func SetupConcurrentRoutes(router *gin.Engine, concurrentService *concurrent.Service, authService *auth.Service) {
	if concurrentService == nil || !concurrentService.IsEnabled() {
		// Skip route setup if concurrent processing is disabled
		return
	}

	handler := handlers.NewConcurrentHandler(concurrentService)

	// Documented concurrent status endpoint (primary path)
	router.GET("/concurrent/status", handler.GetStatus) // GET /concurrent/status - Documented concurrent status endpoint

	// Create concurrent processing API group - backward compatibility
	concurrentGroup := router.Group("/api/concurrent")
	{
		// Service-level endpoints
		concurrentGroup.GET("/status", handler.GetStatus)
		concurrentGroup.GET("/metrics", handler.GetMetrics)
		concurrentGroup.GET("/health", handler.GetHealth)
		concurrentGroup.GET("/metrics/detailed", handler.GetDetailedMetrics)

		// Worker pool endpoints
		workerPoolGroup := concurrentGroup.Group("/worker-pool")
		{
			workerPoolGroup.GET("/status", handler.GetWorkerPoolStatus)
			workerPoolGroup.GET("/metrics", handler.GetWorkerPoolMetrics)
		}

		// Rate limiter endpoints (admin-only for mutations)
		rateLimiterGroup := concurrentGroup.Group("/rate-limiter")
		{
			rateLimiterGroup.GET("/status", handler.GetRateLimiterStatus)
			rateLimiterGroup.PUT("/limit", middleware.AuthMiddleware(authService), handler.UpdateRateLimit)
		}

		// Circuit breaker endpoints (admin-only for mutations)
		circuitBreakerGroup := concurrentGroup.Group("/circuit-breaker")
		{
			circuitBreakerGroup.GET("/status", handler.GetCircuitBreakerStatus)
			circuitBreakerGroup.POST("/reset", middleware.AuthMiddleware(authService), handler.ResetCircuitBreaker)
		}

		// Deprecated: AI manager endpoints
		aiManagerGroup := concurrentGroup.Group("/ai-manager")
		{
			aiManagerGroup.GET("/status", func(c *gin.Context) {
				c.JSON(http.StatusGone, gin.H{"error": "Endpoint deprecated", "message": "AI manager endpoints are not in scope"})
			})
			aiManagerGroup.GET("/metrics", func(c *gin.Context) {
				c.JSON(http.StatusGone, gin.H{"error": "Endpoint deprecated", "message": "AI manager endpoints are not in scope"})
			})
		}

		// Deprecated: AI processing endpoints
		aiGroup := concurrentGroup.Group("/ai")
		{
			aiGroup.POST("/process-batch", func(c *gin.Context) {
				c.JSON(http.StatusGone, gin.H{"error": "Endpoint deprecated", "message": "AI processing endpoints are not in scope"})
			})
			aiGroup.POST("/process", func(c *gin.Context) {
				c.JSON(http.StatusGone, gin.H{"error": "Endpoint deprecated", "message": "AI processing endpoints are not in scope"})
			})
		}
	}
}

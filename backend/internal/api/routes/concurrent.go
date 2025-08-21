package routes

import (
	"github.com/gin-gonic/gin"
	"selly-backend/internal/api/handlers"
	"selly-backend/internal/services/concurrent"
)

// SetupConcurrentRoutes sets up routes for concurrent processing endpoints
func SetupConcurrentRoutes(router *gin.Engine, concurrentService *concurrent.Service) {
	if concurrentService == nil || !concurrentService.IsEnabled() {
		// Skip route setup if concurrent processing is disabled
		return
	}

	handler := handlers.NewConcurrentHandler(concurrentService)
	
	// Create concurrent processing API group
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
		
		// Rate limiter endpoints
		rateLimiterGroup := concurrentGroup.Group("/rate-limiter")
		{
			rateLimiterGroup.GET("/status", handler.GetRateLimiterStatus)
			rateLimiterGroup.PUT("/limit", handler.UpdateRateLimit)
		}
		
		// Circuit breaker endpoints
		circuitBreakerGroup := concurrentGroup.Group("/circuit-breaker")
		{
			circuitBreakerGroup.GET("/status", handler.GetCircuitBreakerStatus)
			circuitBreakerGroup.POST("/reset", handler.ResetCircuitBreaker)
		}
		
		// AI manager endpoints
		aiManagerGroup := concurrentGroup.Group("/ai-manager")
		{
			aiManagerGroup.GET("/status", handler.GetAIManagerStatus)
			aiManagerGroup.GET("/metrics", handler.GetAIManagerMetrics)
		}
		
		// AI processing endpoints
		aiGroup := concurrentGroup.Group("/ai")
		{
			aiGroup.POST("/process-batch", handler.ProcessConcurrentAIRequests)
		}
	}
}

package routes

import (
	"github.com/gin-gonic/gin"

	"selly-backend/internal/api/handlers"
	"selly-backend/internal/api/middleware"
	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/monitoring"
)

// Services holds all application services for dependency injection
type Services struct {
	Database   *database.Service
	Cache      *cache.Service
	Auth       *auth.Service
	Monitoring *monitoring.Service
}

// SetupRoutes configures all API routes and middleware
func SetupRoutes(router *gin.Engine, services *Services) {
	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(services.Database, services.Cache, services.Monitoring)
	metricsHandler := handlers.NewMetricsHandler(services.Monitoring, services.Database, services.Cache)
	databaseHandler := handlers.NewDatabaseHandler(services.Database, services.Monitoring)
	cacheHandler := handlers.NewCacheHandler(services.Cache, services.Monitoring)

	// Global middleware
	router.Use(middleware.RequestIDMiddleware())
	router.Use(middleware.ResponseTimeMiddleware())
	router.Use(middleware.SecurityHeadersMiddleware())
	router.Use(middleware.LoggingMiddleware(services.Monitoring))

	// CORS middleware (use development CORS for now)
	router.Use(middleware.DevelopmentCORSMiddleware())

	// Optional authentication middleware for all routes
	router.Use(middleware.OptionalAuthMiddleware(services.Auth))

	// Health check routes (public)
	setupHealthRoutes(router, healthHandler)

	// Metrics routes (public)
	setupMetricsRoutes(router, metricsHandler)

	// Database test routes (public)
	setupDatabaseRoutes(router, databaseHandler)

	// Cache routes (public)
	setupCacheRoutes(router, cacheHandler)

	// Authentication routes (public)
	setupAuthRoutes(router, services.Auth)

	// Protected routes (require authentication)
	protected := router.Group("/")
	protected.Use(middleware.AuthMiddleware(services.Auth))
	{
		// Future protected endpoints will go here
		// Example: protected.POST("/chat", chatHandler.ProcessChat)
	}

	// Admin routes (require admin role)
	admin := router.Group("/admin")
	admin.Use(middleware.AuthMiddleware(services.Auth))
	admin.Use(middleware.RequireRole("admin"))
	{
		// Future admin endpoints will go here
		// Example: admin.DELETE("/cache/clear", cacheHandler.ClearCache)
	}
}

// setupHealthRoutes configures health check endpoints
func setupHealthRoutes(router *gin.Engine, handler *handlers.HealthHandler) {
	// Root health endpoint for load balancers
	router.GET("/health", handler.GetHealth)

	health := router.Group("/health")
	{
		health.GET("/simple", handler.GetHealthSimple) // GET /health/simple - Simple health check
		health.GET("/live", handler.GetHealthLive)     // GET /health/live - Liveness probe
		health.GET("/ready", handler.GetHealthReady)   // GET /health/ready - Readiness probe
	}
}

// setupMetricsRoutes configures metrics endpoints
func setupMetricsRoutes(router *gin.Engine, handler *handlers.MetricsHandler) {
	// Root metrics endpoint for monitoring systems
	router.GET("/metrics", handler.GetMetrics)

	metrics := router.Group("/metrics")
	{
		metrics.GET("/health", handler.GetMetricsHealth)   // GET /metrics/health - Metrics service health
		metrics.GET("/summary", handler.GetMetricsSummary) // GET /metrics/summary - Key metrics summary
	}
}

// setupDatabaseRoutes configures database test endpoints
func setupDatabaseRoutes(router *gin.Engine, handler *handlers.DatabaseHandler) {
	database := router.Group("/database")
	{
		database.GET("/health", handler.GetDatabaseHealth)            // GET /database/health
		database.GET("/stats", handler.GetDatabaseStats)              // GET /database/stats
		database.GET("/performance", handler.TestDatabasePerformance) // GET /database/performance
	}

	// Root database test endpoint (matches Next.js /api/test-db)
	router.GET("/test-db", handler.TestDatabase)
}

// setupCacheRoutes configures cache endpoints
func setupCacheRoutes(router *gin.Engine, handler *handlers.CacheHandler) {
	cache := router.Group("/cache")
	{
		cache.GET("/health", handler.GetCacheHealth)            // GET /cache/health
		cache.GET("/stats", handler.GetCacheStats)              // GET /cache/stats
		cache.GET("/performance", handler.TestCachePerformance) // GET /cache/performance
		cache.DELETE("/clear", handler.ClearCache)              // DELETE /cache/clear
	}
}

// setupAuthRoutes configures authentication endpoints
func setupAuthRoutes(router *gin.Engine, authService *auth.Service) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", func(c *gin.Context) {
			// Registration handler
			var request struct {
				Email    string `json:"email" binding:"required,email"`
				Password string `json:"password" binding:"required,min=8"`
			}

			if err := c.ShouldBindJSON(&request); err != nil {
				c.JSON(400, gin.H{
					"success": false,
					"error":   "Invalid request format",
					"details": err.Error(),
				})
				return
			}

			result, err := authService.RegisterUser(request.Email, request.Password)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"error":   "Registration failed",
					"details": err.Error(),
				})
				return
			}

			c.JSON(200, gin.H{
				"success": true,
				"data":    result,
			})
		})

		auth.GET("/debug", func(c *gin.Context) {
			// Debug authentication
			token := c.GetHeader("Authorization")
			if token != "" {
				token = token[7:] // Remove "Bearer " prefix
			}

			debugInfo := authService.DebugAuth(token)
			c.JSON(200, debugInfo)
		})
	}
}

// GetServices creates and returns the services struct for dependency injection
func GetServices(db *database.Service, cache *cache.Service, auth *auth.Service, monitoring *monitoring.Service) *Services {
	return &Services{
		Database:   db,
		Cache:      cache,
		Auth:       auth,
		Monitoring: monitoring,
	}
}

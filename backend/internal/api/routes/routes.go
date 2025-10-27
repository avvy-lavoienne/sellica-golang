package routes

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/api/handlers"
	"selly-backend/internal/api/middleware"
	"selly-backend/internal/services/aktivitas_siak"
	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/chat"
	"selly-backend/internal/services/concurrent"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/eventbus"
	"selly-backend/internal/services/monitoring"
	"selly-backend/internal/services/silpana"
	"selly-backend/internal/services/supabase_analyzer"
	"selly-backend/internal/services/training"
	ws "selly-backend/internal/services/websocket"
)

// Services struct holds references to all application services
type Services struct {
	EventBus            eventbus.EventBusInterface
	Database            *database.Service
	Cache               *cache.Service
	Auth                *auth.Service
	Chat                *chat.Service
	Monitoring          *monitoring.Service
	Training            *training.Service
	Concurrent          *concurrent.Service
	Silpana             silpana.ServiceInterface
	SilpanaBroadcaster  *silpana.WebSocketBroadcaster
	SupabaseAnalyzer    *supabase_analyzer.Service
	AktivitasSiak       aktivitas_siak.Service
	SessionManager      *auth.SessionManager // Session manager for SILPANA operations
}

// SetupRoutes configures all API routes and middleware
func SetupRoutes(router *gin.Engine, services *Services) {
	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(services.Database, services.Cache, services.Monitoring)
	metricsHandler := handlers.NewMetricsHandler(services.Monitoring, services.Database, services.Cache)
	databaseHandler := handlers.NewDatabaseHandler(services.Database, services.Monitoring)
	cacheHandler := handlers.NewCacheHandler(services.Cache, services.Monitoring)
	chatHandler := handlers.NewChatHandler(services.Chat, services.Monitoring)
	trainingHandler := handlers.NewTrainingHandler(services.Training)
	performanceHandler := handlers.NewPerformanceHandler(services.Chat, services.Monitoring)
	supabaseAnalyzerHandler := handlers.NewSupabaseAnalyzerHandler(services.SupabaseAnalyzer, services.Monitoring)

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

	// Chat routes (public and protected)
	setupChatRoutes(router, chatHandler, services.Auth)

	// Training data routes (protected)
	setupTrainingRoutes(router, trainingHandler, services.Auth)

	// Performance monitoring routes (public)
	setupPerformanceRoutes(router, performanceHandler)

	// Concurrent processing routes (public)
	SetupConcurrentRoutes(router, services.Concurrent)

	// Authentication routes (public)
	setupAuthRoutes(router, services.Auth, services.Database)

	// Admin routes (protected - require admin role)
	setupAdminRoutes(router, services.Auth, services.Database)

	// SILPANA ticketing routes (public with session management)
	if services.SessionManager != nil {
		SetupSilpanaRoutesWithSession(router, services.Silpana, services.SilpanaBroadcaster, services.SessionManager, services.Auth)
	} else {
		// Fallback to legacy routes if SessionManager not available
		setupSilpanaRoutes(router, services.Silpana, services.SilpanaBroadcaster)
	}

	// Aktivitas SIAK routes (protected)
	if services.AktivitasSiak != nil {
		setupAktivitasSiakRoutes(router, services.AktivitasSiak, services.Auth)
	}

	// Supabase analyzer routes (public)
	if services.SupabaseAnalyzer != nil {
		setupSupabaseAnalyzerRoutes(router, supabaseAnalyzerHandler)
	}

	// WebSocket routes (public)
	if services.SilpanaBroadcaster != nil {
		setupWebSocketRoutes(router, services.SilpanaBroadcaster)
	}

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

	// Root readiness endpoint for compatibility
	router.GET("/ready", handler.GetHealthReady) // GET /ready - Readiness probe (compatibility)

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
func setupAuthRoutes(router *gin.Engine, authService *auth.Service, dbService *database.Service) {
	// Create auth handler with both services
	authHandler := handlers.NewAuthHandler(authService, dbService)

	// Public auth endpoints
	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)

		// Debug endpoint (keep existing functionality)
		auth.GET("/debug", func(c *gin.Context) {
			token := c.GetHeader("Authorization")
			if token != "" {
				token = token[7:] // Remove "Bearer " prefix
			}
			debugInfo := authService.DebugAuth(token)
			c.JSON(200, debugInfo)
		})
	}

	// Protected auth endpoints (require authentication)
	authProtected := router.Group("/auth")
	authProtected.Use(middleware.AuthMiddleware(authService))
	{
		authProtected.POST("/refresh", authHandler.RefreshToken)
		authProtected.GET("/profile", authHandler.GetProfile)
	}
}

// setupChatRoutes configures chat endpoints
func setupChatRoutes(router *gin.Engine, handler *handlers.ChatHandler, _ *auth.Service) {
	// Public chat endpoints (with optional auth)
	router.POST("/chat", handler.ProcessChat)
	router.POST("/chat/session", handler.ProcessSessionChat)

	// API chat endpoints (for compatibility with Next.js frontend)
	api := router.Group("/api")
	{
		api.POST("/chat", handler.ProcessChat) // POST /api/chat - API chat endpoint
	}

	// Chat management endpoints
	chat := router.Group("/chat")
	{
		chat.GET("/history", handler.GetChatHistory)   // GET /chat/history - Chat history retrieval
		chat.GET("/sessions", handler.GetChatSessions) // GET /chat/sessions - User session management
	}
}

// setupTrainingRoutes configures training data endpoints
func setupTrainingRoutes(router *gin.Engine, handler *handlers.TrainingHandler, authService *auth.Service) {
	// Training data endpoints (require authentication)
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware(authService))
	{
		handler.RegisterRoutes(api)
	}
}

// setupPerformanceRoutes configures performance monitoring endpoints
func setupPerformanceRoutes(router *gin.Engine, handler *handlers.PerformanceHandler) {
	// Documented performance endpoint (primary path)
	router.GET("/performance", handler.GetPerformanceMetrics) // GET /performance - Documented performance endpoint

	// Performance monitoring endpoints (public) - backward compatibility
	api := router.Group("/api/performance")
	{
		api.GET("/metrics", handler.GetHighPerformanceMetrics) // GET /api/performance/metrics - High-performance AI metrics
		api.GET("/health", handler.GetPerformanceHealth)       // GET /api/performance/health - Performance health check
		api.GET("/stats", handler.GetPerformanceStats)         // GET /api/performance/stats - Performance statistics
		api.POST("/test", handler.PostPerformanceTest)         // POST /api/performance/test - Performance test endpoint
	}
}

// setupAktivitasSiakRoutes configures Aktivitas SIAK civil registry activity management endpoints
func setupAktivitasSiakRoutes(router *gin.Engine, aktivitasSiakService aktivitas_siak.Service, authService *auth.Service) {
	// Create logger for handlers
	logger := logrus.New()
	logger.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	// Create Aktivitas SIAK HTTP handlers
	handlers, err := aktivitas_siak.NewHTTPHandlers(aktivitasSiakService, logger)
	if err != nil {
		log.Printf("❌ Failed to create Aktivitas SIAK handlers: %v", err)
		return
	}

	// API group for Aktivitas SIAK endpoints (protected with authentication)
	api := router.Group("/api/v1/aktivitas-siak")
	api.Use(middleware.AuthMiddleware(authService)) // All routes require authentication
	{
		// Health check (public within protected group)
		api.GET("/health", handlers.Health)

		// CRUD operations
		api.POST("", handlers.CreateRecord)           // POST /api/v1/aktivitas-siak - Create new record
		api.GET("", handlers.ListRecords)             // GET /api/v1/aktivitas-siak - List records with pagination
		api.GET("/:id", handlers.GetRecord)           // GET /api/v1/aktivitas-siak/:id - Get record by ID
		api.PUT("/:id", handlers.UpdateRecord)        // PUT /api/v1/aktivitas-siak/:id - Update record
		api.DELETE("/:id", handlers.DeleteRecord)     // DELETE /api/v1/aktivitas-siak/:id - Delete record

		// Utility endpoints
		api.POST("/check-duplicate", handlers.CheckDuplicate) // POST /api/v1/aktivitas-siak/check-duplicate - Check for duplicate
		api.GET("/statistics", handlers.GetStatistics)        // GET /api/v1/aktivitas-siak/statistics - Get statistics
	}

	log.Println("📊 Aktivitas SIAK routes configured successfully")
}

// GetServices creates and returns the services struct for dependency injection
func GetServices(eventBus eventbus.EventBusInterface, db *database.Service, cache *cache.Service, auth *auth.Service, chat *chat.Service, monitoring *monitoring.Service, training *training.Service, concurrent *concurrent.Service, silpanaService silpana.ServiceInterface, silpanaBroadcaster *silpana.WebSocketBroadcaster, supabaseAnalyzer *supabase_analyzer.Service, aktivitasSiakService aktivitas_siak.Service, sessionManager *auth.SessionManager) *Services {
	return &Services{
		EventBus:            eventBus,
		Database:            db,
		Cache:               cache,
		Auth:                auth,
		Chat:                chat,
		Monitoring:          monitoring,
		Training:            training,
		Concurrent:          concurrent,
		Silpana:             silpanaService,
		SilpanaBroadcaster:  silpanaBroadcaster,
		SupabaseAnalyzer:    supabaseAnalyzer,
		AktivitasSiak:       aktivitasSiakService,
		SessionManager:      sessionManager,
	}
}

// setupSilpanaRoutes configures SILPANA ticketing endpoints
func setupSilpanaRoutes(router *gin.Engine, silpanaService silpana.ServiceInterface, broadcaster *silpana.WebSocketBroadcaster) {
	// Create SILPANA handler with broadcaster
	silpanaHandler := silpana.NewHandler(silpanaService, broadcaster)

	// API group for SILPANA endpoints
	api := router.Group("/api/v1/silpana")
	{
		// Ticket management endpoints
		api.POST("/tickets", silpanaHandler.CreateTicket)         // POST /api/v1/silpana/tickets - Create new ticket
		api.GET("/tickets", silpanaHandler.GetAllTickets)         // GET /api/v1/silpana/tickets - Get all tickets with pagination
		api.POST("/tickets/lookup", silpanaHandler.LookupTicket)  // POST /api/v1/silpana/tickets/lookup - Lookup ticket by code
		
		// Bulk operation endpoints (NEW - Phase 4 Week 3)
		api.POST("/tickets/bulk-approve", silpanaHandler.BulkApproveTickets)   // POST /api/v1/silpana/tickets/bulk-approve - Approve multiple tickets
		api.POST("/tickets/bulk-reject", silpanaHandler.BulkRejectTickets)     // POST /api/v1/silpana/tickets/bulk-reject - Reject multiple tickets
		api.DELETE("/tickets/bulk-delete", silpanaHandler.BulkDeleteTickets)   // DELETE /api/v1/silpana/tickets/bulk-delete - Delete multiple tickets
		
		// Progress tracking endpoints (Phase 4) - Must come before wildcard routes
		api.GET("/progress/:code", silpanaHandler.GetTicketProgress) // GET /api/v1/silpana/progress/:code - Get ticket progress by code
		
		// Wildcard routes must come last
		api.GET("/tickets/:id", silpanaHandler.GetTicket)         // GET /api/v1/silpana/tickets/:id - Get ticket by ID
		api.GET("/tickets/:id/history", silpanaHandler.GetTicketHistory) // GET /api/v1/silpana/tickets/:id/history - Get ticket history
		
		// Communication endpoints (NEW - Phase 4: Admin-User Communication)
		api.POST("/tickets/:id/communications", silpanaHandler.AddCommunication)    // POST /api/v1/silpana/tickets/:id/communications - Add message
		api.GET("/tickets/:id/communications", silpanaHandler.GetCommunications)    // GET /api/v1/silpana/tickets/:id/communications - Get messages
		
		// Statistics and monitoring
		api.GET("/stats", silpanaHandler.GetTicketStats)          // GET /api/v1/silpana/stats - Get ticket statistics
		api.GET("/health", silpanaHandler.HealthCheck)            // GET /api/v1/silpana/health - SILPANA health check
		
		// Ticket filtering endpoints
		api.GET("/tickets/status/:status", silpanaHandler.GetTicketsByStatus) // GET /api/v1/silpana/tickets/status/:status - Get tickets by status
	}
}

// setupWebSocketRoutes configures WebSocket endpoints for real-time updates
func setupWebSocketRoutes(router *gin.Engine, broadcaster *silpana.WebSocketBroadcaster) {
	log.Println("🔌 Setting up WebSocket routes...")
	
	// Get the hub from broadcaster
	hub := broadcaster.GetHub()
	if hub == nil {
		log.Println("❌ WebSocket hub is nil, skipping WebSocket route setup")
		return
	}
	log.Println("✅ WebSocket hub found, creating handler...")

	// Create WebSocket handler
	wsHandler := &WebSocketTicketHandler{
		hub: hub,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				// Allow all origins for now - should be restricted in production
				return true
			},
		},
	}

	// WebSocket endpoint for ticket updates
	router.GET("/ws/tickets", wsHandler.Handle)
	
	log.Println("✅ WebSocket route registered at /ws/tickets")
}

// WebSocketTicketHandler handles WebSocket connections for ticket updates
type WebSocketTicketHandler struct {
	hub      *ws.Hub
	upgrader websocket.Upgrader
}

// Handle handles WebSocket upgrade and registration
func (h *WebSocketTicketHandler) Handle(c *gin.Context) {
	// Extract user information from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		// Allow anonymous connections for now
		userID = "anonymous"
	}

	isAdmin := false
	if role, exists := c.Get("role"); exists {
		isAdmin = role == "admin"
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	// Create new client
	client := ws.NewClient(h.hub, conn, userID.(string), isAdmin)

	// The client will register itself and start pumps
	go client.WritePump()
	go client.ReadPump()

	log.Printf("New WebSocket connection established for user: %s (admin: %v)", userID, isAdmin)
}

// setupAdminRoutes configures admin-only endpoints
// All routes require authentication and admin role verification
func setupAdminRoutes(router *gin.Engine, authService *auth.Service, dbService *database.Service) {
	// Create admin handler
	adminHandler := handlers.NewAdminHandler(dbService)

	// Protected admin endpoints (require authentication and admin role)
	adminGroup := router.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(authService))
	{
		// Get all pending users (for admin review)
		adminGroup.GET("/pending-users", adminHandler.GetPendingUsers)
	}
}




package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/api/routes"
	"selly-backend/internal/config"
	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/chat"
	"selly-backend/internal/services/concurrent"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/knowledge"
	"selly-backend/internal/services/monitoring"
	"selly-backend/internal/services/rag"
	"selly-backend/internal/services/training"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		logrus.Warn("No .env file found, using system environment variables")
	}

	// Initialize configuration
	cfg := config.Load()

	// Set up logging
	setupLogging(cfg)

	// Initialize services
	services, err := initializeServices(cfg)
	if err != nil {
		logrus.Fatalf("Failed to initialize services: %v", err)
	}

	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	// Create Gin router
	router := gin.New()

	// Setup routes with services
	routeServices := routes.GetServices(
		services.Database,
		services.Cache,
		services.Auth,
		services.Chat,
		services.Monitoring,
		services.Training,
		services.Concurrent,
	)
	routes.SetupRoutes(router, routeServices)

	// Create HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logrus.Infof("🚀 SELLY Go Backend starting on port %d", cfg.Server.Port)
		logrus.Infof("📊 Environment: %s", cfg.Server.Environment)
		logrus.Infof("🔗 Health check: http://localhost:%d/health", cfg.Server.Port)

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("🛑 Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logrus.Fatalf("Server forced to shutdown: %v", err)
	}

	// Cleanup services
	services.Cleanup()

	logrus.Info("✅ Server shutdown complete")
}

// Services holds all application services
type Services struct {
	Database   *database.Service
	Cache      *cache.Service
	Auth       *auth.Service
	Chat       *chat.Service
	Monitoring *monitoring.Service
	Training   *training.Service
	Concurrent *concurrent.Service
	RAG        *rag.RedisRAGService
	Knowledge  *knowledge.DocumentLoaderService
}

// Cleanup performs cleanup operations for all services
func (s *Services) Cleanup() {
	if s.Knowledge != nil {
		s.Knowledge.Close()
	}
	if s.Cache != nil {
		s.Cache.Close()
	}
	if s.Database != nil {
		s.Database.Close()
	}
	logrus.Info("🧹 Services cleanup completed")
}

// initializeServices initializes all application services
func initializeServices(cfg *config.Config) (*Services, error) {
	logrus.Info("🔧 Initializing services...")

	// Initialize database service
	dbService, err := database.NewService(cfg.Database.URL, cfg.Database.ServiceRoleKey)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database service: %w", err)
	}

	// Initialize cache service
	cacheService, err := cache.NewService(cfg.Cache.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cache service: %w", err)
	}

	// Initialize auth service
	authService := auth.NewService(cfg.Auth.JWTSecret, dbService)

	// Initialize monitoring service
	monitoringService := monitoring.NewService()

	// Initialize training service
	trainingService, err := training.NewService(dbService, cacheService)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize training service: %w", err)
	}

	// Initialize concurrent processing service
	concurrentService, err := concurrent.NewService(nil, monitoringService)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize concurrent service: %w", err)
	}

	// Start concurrent service
	if err := concurrentService.Start(); err != nil {
		logrus.WithError(err).Warn("Failed to start concurrent service")
	}

	// Initialize RAG service
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	// Initialize RAG service
	if err := ragService.Initialize(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to initialize RAG service: %w", err)
	}

	// Initialize Knowledge service (Document Loader)
	knowledgeService, err := knowledge.NewDocumentLoaderService(
		ragService,
		cacheService,
		cfg.Knowledge.DocumentsPath,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize knowledge service: %w", err)
	}

	// Load all training documents on startup
	logrus.Info("📚 Loading training documents...")
	if err := knowledgeService.LoadAllDocuments(); err != nil {
		logrus.WithError(err).Warn("Failed to load some training documents")
	}

	// Initialize chat service with RAG integration (after RAG service is ready)
	chatService := chat.NewService(dbService, cacheService, authService, ragService)

	logrus.Info("✅ All services initialized successfully")

	return &Services{
		Database:   dbService,
		Cache:      cacheService,
		Auth:       authService,
		Chat:       chatService,
		Monitoring: monitoringService,
		Training:   trainingService,
		Concurrent: concurrentService,
		RAG:        ragService,
		Knowledge:  knowledgeService,
	}, nil
}

// setupLogging configures the logging system
func setupLogging(cfg *config.Config) {
	// Set log level
	level, err := logrus.ParseLevel(cfg.Logging.Level)
	if err != nil {
		level = logrus.InfoLevel
	}
	logrus.SetLevel(level)

	// Set log format
	if cfg.Server.Environment == "production" {
		logrus.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
		})
	} else {
		logrus.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: "2006-01-02 15:04:05",
			ForceColors:     true,
		})
	}

	logrus.Info("📝 Logging system initialized")
}

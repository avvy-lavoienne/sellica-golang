package concurrent

import (
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"selly-backend/internal/services/monitoring"
)

// Service provides concurrent processing capabilities for the application
type Service struct {
	aiManager     *ConcurrentAIManager
	workerPool    *WorkerPool
	rateLimiter   *RateLimiter
	circuitBreaker *CircuitBreaker
	monitoring    *monitoring.Service
	
	config        *ServiceConfig
	isRunning     bool
	mu            sync.RWMutex
}

// ServiceConfig holds configuration for the concurrent processing service
type ServiceConfig struct {
	Enabled               bool                     `json:"enabled"`
	ConcurrentAIConfig    *ConcurrentAIConfig     `json:"concurrentAI"`
	WorkerPoolConfig      WorkerPoolConfig        `json:"workerPool"`
	RateLimiterConfig     RateLimiterConfig       `json:"rateLimiter"`
	CircuitBreakerConfig  CircuitBreakerConfig    `json:"circuitBreaker"`
	EnableMetrics         bool                     `json:"enableMetrics"`
	EnableHealthChecks    bool                     `json:"enableHealthChecks"`
	HealthCheckInterval   time.Duration            `json:"healthCheckInterval"`
}

// DefaultServiceConfig returns a default configuration for the concurrent service
func DefaultServiceConfig() *ServiceConfig {
	return &ServiceConfig{
		Enabled: true,
		ConcurrentAIConfig: &ConcurrentAIConfig{
			MaxConcurrentRequests: 50,
			RequestTimeout:        30 * time.Second,
			QueueSize:             100,
			EnablePrioritization:  true,
			EnableMetrics:         true,
		},
		WorkerPoolConfig: WorkerPoolConfig{
			Workers:     10,
			QueueSize:   50,
			TaskTimeout: 30 * time.Second,
		},
		RateLimiterConfig: RateLimiterConfig{
			Name:              "concurrent-service",
			RequestsPerSecond: 100,
			BurstCapacity:     200,
		},
		CircuitBreakerConfig: CircuitBreakerConfig{
			Name:             "concurrent-service",
			MaxFailures:      5,
			ResetTimeout:     60 * time.Second,
			HalfOpenMaxCalls: 3,
		},
		EnableMetrics:       true,
		EnableHealthChecks:  true,
		HealthCheckInterval: 30 * time.Second,
	}
}

// NewService creates a new concurrent processing service
func NewService(config *ServiceConfig, monitoring *monitoring.Service) (*Service, error) {
	if config == nil {
		config = DefaultServiceConfig()
	}

	if monitoring == nil {
		return nil, fmt.Errorf("monitoring service is required")
	}

	service := &Service{
		config:     config,
		monitoring: monitoring,
	}

	if config.Enabled {
		// Create individual components
		if err := service.initializeComponents(); err != nil {
			return nil, fmt.Errorf("failed to initialize components: %w", err)
		}
	}

	logrus.WithFields(logrus.Fields{
		"enabled":              config.Enabled,
		"max_concurrent":       config.ConcurrentAIConfig.MaxConcurrentRequests,
		"workers":              config.WorkerPoolConfig.Workers,
		"rate_limit":           config.RateLimiterConfig.RequestsPerSecond,
		"circuit_breaker":      config.CircuitBreakerConfig.Name,
	}).Info("🚀 Concurrent processing service created")

	return service, nil
}

// initializeComponents initializes all concurrent processing components
func (s *Service) initializeComponents() error {
	// Create worker pool
	s.workerPool = NewWorkerPool(s.config.WorkerPoolConfig)
	
	// Create rate limiter
	s.rateLimiter = NewRateLimiter(s.config.RateLimiterConfig)
	
	// Create circuit breaker
	s.circuitBreaker = NewCircuitBreaker(s.config.CircuitBreakerConfig)

	logrus.Info("✅ Concurrent processing components initialized")
	return nil
}

// Start starts the concurrent processing service
func (s *Service) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.config.Enabled {
		logrus.Info("⏸️ Concurrent processing service is disabled")
		return nil
	}

	if s.isRunning {
		return fmt.Errorf("concurrent processing service is already running")
	}

	// Start worker pool
	if s.workerPool != nil {
		if err := s.workerPool.Start(); err != nil {
			return fmt.Errorf("failed to start worker pool: %w", err)
		}
	}

	s.isRunning = true

	// Start health checks if enabled
	if s.config.EnableHealthChecks {
		go s.startHealthChecks()
	}

	logrus.Info("🚀 Concurrent processing service started")
	return nil
}

// Stop stops the concurrent processing service
func (s *Service) Stop() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.isRunning {
		return fmt.Errorf("concurrent processing service is not running")
	}

	logrus.Info("🛑 Stopping concurrent processing service...")

	// Stop AI manager if it exists
	if s.aiManager != nil {
		if err := s.aiManager.Stop(); err != nil {
			logrus.WithError(err).Warn("Error stopping AI manager")
		}
	}

	// Stop worker pool
	if s.workerPool != nil {
		if err := s.workerPool.Stop(); err != nil {
			logrus.WithError(err).Warn("Error stopping worker pool")
		}
	}

	s.isRunning = false

	logrus.Info("✅ Concurrent processing service stopped")
	return nil
}

// CreateAIManager creates and starts a concurrent AI manager with the given AI service
func (s *Service) CreateAIManager(aiService AIServiceInterface) (*ConcurrentAIManager, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.config.Enabled {
		return nil, fmt.Errorf("concurrent processing service is disabled")
	}

	if s.aiManager != nil {
		return s.aiManager, nil // Return existing manager
	}

	// Create AI manager
	var err error
	s.aiManager, err = NewConcurrentAIManager(s.config.ConcurrentAIConfig, aiService, s.monitoring)
	if err != nil {
		return nil, fmt.Errorf("failed to create AI manager: %w", err)
	}

	// Start AI manager if service is running
	if s.isRunning {
		if err := s.aiManager.Start(); err != nil {
			return nil, fmt.Errorf("failed to start AI manager: %w", err)
		}
	}

	logrus.Info("🤖 Concurrent AI manager created and started")
	return s.aiManager, nil
}

// GetAIManager returns the current AI manager (if any)
func (s *Service) GetAIManager() *ConcurrentAIManager {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.aiManager
}

// GetWorkerPool returns the worker pool
func (s *Service) GetWorkerPool() *WorkerPool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.workerPool
}

// GetRateLimiter returns the rate limiter
func (s *Service) GetRateLimiter() *RateLimiter {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.rateLimiter
}

// GetCircuitBreaker returns the circuit breaker
func (s *Service) GetCircuitBreaker() *CircuitBreaker {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.circuitBreaker
}

// IsRunning returns whether the service is currently running
func (s *Service) IsRunning() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isRunning
}

// IsEnabled returns whether the service is enabled
func (s *Service) IsEnabled() bool {
	return s.config.Enabled
}

// GetStatus returns the current status of the concurrent processing service
func (s *Service) GetStatus() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	status := map[string]interface{}{
		"enabled":  s.config.Enabled,
		"running":  s.isRunning,
		"healthy":  s.IsHealthy(),
	}

	if s.config.Enabled {
		if s.workerPool != nil {
			status["worker_pool"] = s.workerPool.GetStatus()
		}
		
		if s.rateLimiter != nil {
			status["rate_limiter"] = s.rateLimiter.GetStatus()
		}
		
		if s.circuitBreaker != nil {
			status["circuit_breaker"] = s.circuitBreaker.GetStatus()
		}
		
		if s.aiManager != nil {
			status["ai_manager"] = s.aiManager.GetStatus()
		}
	}

	return status
}

// IsHealthy returns whether the service and all its components are healthy
func (s *Service) IsHealthy() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if !s.config.Enabled {
		return true // Disabled service is considered healthy
	}

	if !s.isRunning {
		return false
	}

	// Check worker pool health
	if s.workerPool != nil && !s.workerPool.IsRunning() {
		return false
	}

	// Check rate limiter health
	if s.rateLimiter != nil && !s.rateLimiter.IsHealthy() {
		return false
	}

	// Check circuit breaker health
	if s.circuitBreaker != nil && !s.circuitBreaker.IsHealthy() {
		return false
	}

	// Check AI manager health
	if s.aiManager != nil && !s.aiManager.IsHealthy() {
		return false
	}

	return true
}

// GetMetrics returns comprehensive metrics for the concurrent processing service
func (s *Service) GetMetrics() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	metrics := map[string]interface{}{
		"service_enabled": s.config.Enabled,
		"service_running": s.isRunning,
		"service_healthy": s.IsHealthy(),
	}

	if s.config.Enabled {
		if s.workerPool != nil {
			metrics["worker_pool"] = s.workerPool.GetMetrics()
		}
		
		if s.rateLimiter != nil {
			metrics["rate_limiter"] = s.rateLimiter.GetMetrics()
		}
		
		if s.circuitBreaker != nil {
			metrics["circuit_breaker"] = s.circuitBreaker.GetMetrics()
		}
		
		if s.aiManager != nil {
			metrics["ai_manager"] = s.aiManager.GetMetrics()
		}
	}

	return metrics
}

// startHealthChecks starts periodic health checks
func (s *Service) startHealthChecks() {
	ticker := time.NewTicker(s.config.HealthCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if !s.IsRunning() {
				return // Service stopped
			}

			healthy := s.IsHealthy()
			status := s.GetStatus()

			logrus.WithFields(logrus.Fields{
				"healthy":      healthy,
				"worker_pool":  status["worker_pool"] != nil,
				"rate_limiter": status["rate_limiter"] != nil,
				"ai_manager":   status["ai_manager"] != nil,
			}).Debug("🔍 Concurrent processing service health check")

			if !healthy {
				logrus.Warn("⚠️ Concurrent processing service is unhealthy")
			}
		}
	}
}

package concurrent

import (
	"context"
	"fmt"
	"sync"
	"time"

	"selly-backend/internal/services/monitoring"

	"github.com/sirupsen/logrus"
)

// AIRequest represents a request to AI service
type AIRequest struct {
	Query           string                 `json:"query"`
	UserID          string                 `json:"userId"`
	SessionID       string                 `json:"sessionId"`
	Context         map[string]interface{} `json:"context"`
	EnhancementMode string                 `json:"enhancementMode"`
}

// AIResponse represents AI service response
type AIResponse struct {
	Content         string   `json:"content"`
	Type            string   `json:"type"`
	Confidence      float64  `json:"confidence"`
	Model           string   `json:"model"`
	ProcessingTime  float64  `json:"processingTime"`
	CacheHit        bool     `json:"cacheHit"`
	CacheLayer      string   `json:"cacheLayer"`
	Recommendations []string `json:"recommendations,omitempty"`
}

// SessionAIRequest represents a session-aware AI request
type SessionAIRequest struct {
	Query   string                 `json:"query"`
	UserID  string                 `json:"userId"`
	Context map[string]interface{} `json:"context"`
}

// ConcurrentAIManager orchestrates concurrent AI request processing
type ConcurrentAIManager struct {
	workerPool     *WorkerPool
	rateLimiter    *RateLimiter
	circuitBreaker *CircuitBreaker
	aiService      AIServiceInterface
	monitoring     *monitoring.Service

	requestQueue chan *AIRequestWrapper
	responseMap  sync.Map
	metrics      *ConcurrentMetrics
	config       *ConcurrentAIConfig

	isRunning bool
	mu        sync.RWMutex
}

// AIServiceInterface defines the interface for AI service operations
type AIServiceInterface interface {
	ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error)
	ProcessSessionQuery(ctx context.Context, req *SessionAIRequest) (*AIResponse, error)
}

// AIRequestWrapper wraps an AI request with additional metadata
type AIRequestWrapper struct {
	Request     *AIRequest
	ResponseCh  chan *AIResponseWrapper
	Context     context.Context
	RequestID   string
	SubmittedAt time.Time
	Priority    RequestPriority
}

// AIResponseWrapper wraps an AI response with processing metadata
type AIResponseWrapper struct {
	Response       *AIResponse
	Error          error
	ProcessingTime time.Duration
	WorkerID       int
	CacheHit       bool
}

// RequestPriority defines the priority levels for AI requests
type RequestPriority int

const (
	PriorityLow RequestPriority = iota
	PriorityNormal
	PriorityHigh
	PriorityCritical
)

// ConcurrentMetrics tracks concurrent processing performance
type ConcurrentMetrics struct {
	TotalRequests       int64     `json:"totalRequests"`
	ConcurrentRequests  int64     `json:"concurrentRequests"`
	CompletedRequests   int64     `json:"completedRequests"`
	FailedRequests      int64     `json:"failedRequests"`
	AverageResponseTime float64   `json:"averageResponseTime"`
	PeakConcurrency     int64     `json:"peakConcurrency"`
	ThroughputPerSecond float64   `json:"throughputPerSecond"`
	LastUpdated         time.Time `json:"lastUpdated"`
	mu                  sync.RWMutex
}

// ConcurrentAIConfig holds configuration for concurrent AI manager
type ConcurrentAIConfig struct {
	MaxConcurrentRequests int                  `json:"maxConcurrentRequests"`
	RequestTimeout        time.Duration        `json:"requestTimeout"`
	QueueSize             int                  `json:"queueSize"`
	EnablePrioritization  bool                 `json:"enablePrioritization"`
	EnableMetrics         bool                 `json:"enableMetrics"`
	WorkerPoolConfig      WorkerPoolConfig     `json:"workerPool"`
	RateLimiterConfig     RateLimiterConfig    `json:"rateLimiter"`
	CircuitBreakerConfig  CircuitBreakerConfig `json:"circuitBreaker"`
}

// NewConcurrentAIManager creates a new concurrent AI manager
func NewConcurrentAIManager(config *ConcurrentAIConfig, aiService AIServiceInterface, monitoring *monitoring.Service) (*ConcurrentAIManager, error) {
	if config == nil {
		config = &ConcurrentAIConfig{
			MaxConcurrentRequests: 100,
			RequestTimeout:        30 * time.Second,
			QueueSize:             200,
			EnablePrioritization:  true,
			EnableMetrics:         true,
			WorkerPoolConfig: WorkerPoolConfig{
				Workers:   20,
				QueueSize: 100,
			},
			RateLimiterConfig: RateLimiterConfig{
				Name:              "ai-requests",
				RequestsPerSecond: 50,
				BurstCapacity:     100,
			},
			CircuitBreakerConfig: CircuitBreakerConfig{
				Name:         "ai-service",
				MaxFailures:  5,
				ResetTimeout: 60 * time.Second,
			},
		}
	}

	// Create worker pool
	workerPool := NewWorkerPool(config.WorkerPoolConfig)

	// Create rate limiter
	rateLimiter := NewRateLimiter(config.RateLimiterConfig)

	// Create circuit breaker
	circuitBreaker := NewCircuitBreaker(config.CircuitBreakerConfig)

	cam := &ConcurrentAIManager{
		workerPool:     workerPool,
		rateLimiter:    rateLimiter,
		circuitBreaker: circuitBreaker,
		aiService:      aiService,
		monitoring:     monitoring,
		requestQueue:   make(chan *AIRequestWrapper, config.QueueSize),
		config:         config,
		metrics: &ConcurrentMetrics{
			LastUpdated: time.Now(),
		},
	}

	logrus.WithFields(logrus.Fields{
		"max_concurrent": config.MaxConcurrentRequests,
		"queue_size":     config.QueueSize,
		"workers":        config.WorkerPoolConfig.Workers,
	}).Info("🤖 Concurrent AI manager created")

	return cam, nil
}

// Start initializes and starts the concurrent AI manager
func (cam *ConcurrentAIManager) Start() error {
	cam.mu.Lock()
	defer cam.mu.Unlock()

	if cam.isRunning {
		return fmt.Errorf("concurrent AI manager is already running")
	}

	// Start worker pool
	if err := cam.workerPool.Start(); err != nil {
		return fmt.Errorf("failed to start worker pool: %w", err)
	}

	cam.isRunning = true

	logrus.Info("🚀 Concurrent AI manager started")
	return nil
}

// Stop gracefully shuts down the concurrent AI manager
func (cam *ConcurrentAIManager) Stop() error {
	cam.mu.Lock()
	defer cam.mu.Unlock()

	if !cam.isRunning {
		return fmt.Errorf("concurrent AI manager is not running")
	}

	logrus.Info("🛑 Stopping concurrent AI manager...")

	// Stop worker pool
	if err := cam.workerPool.Stop(); err != nil {
		logrus.WithError(err).Warn("Error stopping worker pool")
	}

	// Close request queue
	close(cam.requestQueue)

	cam.isRunning = false

	logrus.Info("✅ Concurrent AI manager stopped")
	return nil
}

// ProcessRequest processes a single AI request concurrently
func (cam *ConcurrentAIManager) ProcessRequest(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	if !cam.isRunning {
		return nil, fmt.Errorf("concurrent AI manager is not running")
	}

	// Check rate limiting
	if !cam.rateLimiter.Allow() {
		cam.updateMetrics(func(m *ConcurrentMetrics) {
			m.FailedRequests++
		})
		return nil, fmt.Errorf("rate limit exceeded")
	}

	// Check circuit breaker
	if !cam.circuitBreaker.Allow() {
		cam.updateMetrics(func(m *ConcurrentMetrics) {
			m.FailedRequests++
		})
		return nil, fmt.Errorf("circuit breaker is open")
	}

	// Create request wrapper
	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())
	responseCh := make(chan *AIResponseWrapper, 1)

	wrapper := &AIRequestWrapper{
		Request:     req,
		ResponseCh:  responseCh,
		Context:     ctx,
		RequestID:   requestID,
		SubmittedAt: time.Now(),
		Priority:    PriorityNormal,
	}

	// Submit to worker pool
	err := cam.workerPool.Submit(func() {
		cam.processRequestAsync(wrapper)
	})

	if err != nil {
		cam.circuitBreaker.RecordFailure()
		cam.updateMetrics(func(m *ConcurrentMetrics) {
			m.FailedRequests++
		})
		return nil, fmt.Errorf("failed to submit request: %w", err)
	}

	// Wait for response with timeout
	select {
	case response := <-responseCh:
		if response.Error != nil {
			cam.circuitBreaker.RecordFailure()
			cam.updateMetrics(func(m *ConcurrentMetrics) {
				m.FailedRequests++
			})
			return nil, response.Error
		}

		cam.circuitBreaker.RecordSuccess()
		cam.updateMetrics(func(m *ConcurrentMetrics) {
			m.CompletedRequests++
			cam.updateAverageResponseTime(response.ProcessingTime)
		})

		// Record metrics in monitoring service
		if cam.monitoring != nil {
			cam.monitoring.RecordRequest(response.ProcessingTime)
		}

		return response.Response, nil

	case <-ctx.Done():
		cam.updateMetrics(func(m *ConcurrentMetrics) {
			m.FailedRequests++
		})
		return nil, fmt.Errorf("request cancelled: %w", ctx.Err())

	case <-time.After(cam.config.RequestTimeout):
		cam.circuitBreaker.RecordFailure()
		cam.updateMetrics(func(m *ConcurrentMetrics) {
			m.FailedRequests++
		})
		return nil, fmt.Errorf("request timeout after %v", cam.config.RequestTimeout)
	}
}

// ProcessConcurrentRequests processes multiple AI requests concurrently
func (cam *ConcurrentAIManager) ProcessConcurrentRequests(ctx context.Context, requests []*AIRequest) ([]*AIResponse, error) {
	if !cam.isRunning {
		return nil, fmt.Errorf("concurrent AI manager is not running")
	}

	if len(requests) == 0 {
		return []*AIResponse{}, nil
	}

	// Create response channels
	responseChans := make([]chan *AIResponseWrapper, len(requests))
	for i := range responseChans {
		responseChans[i] = make(chan *AIResponseWrapper, 1)
	}

	// Submit all requests
	for i, req := range requests {
		requestID := fmt.Sprintf("batch_%d_%d", time.Now().UnixNano(), i)

		wrapper := &AIRequestWrapper{
			Request:     req,
			ResponseCh:  responseChans[i],
			Context:     ctx,
			RequestID:   requestID,
			SubmittedAt: time.Now(),
			Priority:    PriorityNormal,
		}

		// Check rate limiting for each request
		if !cam.rateLimiter.Allow() {
			responseChans[i] <- &AIResponseWrapper{
				Error: fmt.Errorf("rate limit exceeded for request %d", i),
			}
			continue
		}

		// Check circuit breaker
		if !cam.circuitBreaker.Allow() {
			responseChans[i] <- &AIResponseWrapper{
				Error: fmt.Errorf("circuit breaker is open for request %d", i),
			}
			continue
		}

		// Submit to worker pool
		err := cam.workerPool.Submit(func() {
			cam.processRequestAsync(wrapper)
		})

		if err != nil {
			responseChans[i] <- &AIResponseWrapper{
				Error: fmt.Errorf("failed to submit request %d: %w", i, err),
			}
		}
	}

	// Collect responses
	responses := make([]*AIResponse, len(requests))
	var errors []error

	for i, respCh := range responseChans {
		select {
		case response := <-respCh:
			if response.Error != nil {
				errors = append(errors, fmt.Errorf("request %d failed: %w", i, response.Error))
				cam.updateMetrics(func(m *ConcurrentMetrics) {
					m.FailedRequests++
				})
			} else {
				responses[i] = response.Response
				cam.updateMetrics(func(m *ConcurrentMetrics) {
					m.CompletedRequests++
					cam.updateAverageResponseTime(response.ProcessingTime)
				})
			}

		case <-ctx.Done():
			errors = append(errors, fmt.Errorf("request %d cancelled: %w", i, ctx.Err()))
			cam.updateMetrics(func(m *ConcurrentMetrics) {
				m.FailedRequests++
			})

		case <-time.After(cam.config.RequestTimeout):
			errors = append(errors, fmt.Errorf("request %d timeout", i))
			cam.updateMetrics(func(m *ConcurrentMetrics) {
				m.FailedRequests++
			})
		}
	}

	if len(errors) > 0 {
		return responses, fmt.Errorf("some requests failed: %v", errors)
	}

	return responses, nil
}

// processRequestAsync processes a request asynchronously
func (cam *ConcurrentAIManager) processRequestAsync(wrapper *AIRequestWrapper) {
	startTime := time.Now()

	cam.updateMetrics(func(m *ConcurrentMetrics) {
		m.TotalRequests++
		m.ConcurrentRequests++
		if m.ConcurrentRequests > m.PeakConcurrency {
			m.PeakConcurrency = m.ConcurrentRequests
		}
	})

	defer func() {
		cam.updateMetrics(func(m *ConcurrentMetrics) {
			m.ConcurrentRequests--
		})
	}()

	// Process the AI request
	response, err := cam.aiService.ProcessQuery(wrapper.Context, wrapper.Request)
	processingTime := time.Since(startTime)

	// Send response
	wrapper.ResponseCh <- &AIResponseWrapper{
		Response:       response,
		Error:          err,
		ProcessingTime: processingTime,
		CacheHit:       response != nil && response.CacheHit,
	}

	logrus.WithFields(logrus.Fields{
		"request_id":      wrapper.RequestID,
		"processing_time": processingTime.Milliseconds(),
		"success":         err == nil,
	}).Debug("🤖 AI request processed")
}

// GetMetrics returns current concurrent processing metrics
func (cam *ConcurrentAIManager) GetMetrics() *ConcurrentMetrics {
	cam.metrics.mu.RLock()
	defer cam.metrics.mu.RUnlock()

	// Create a copy to avoid race conditions (without copying the mutex)
	metrics := ConcurrentMetrics{
		TotalRequests:       cam.metrics.TotalRequests,
		ConcurrentRequests:  cam.metrics.ConcurrentRequests,
		CompletedRequests:   cam.metrics.CompletedRequests,
		FailedRequests:      cam.metrics.FailedRequests,
		AverageResponseTime: cam.metrics.AverageResponseTime,
		PeakConcurrency:     cam.metrics.PeakConcurrency,
		ThroughputPerSecond: cam.metrics.ThroughputPerSecond,
		LastUpdated:         cam.metrics.LastUpdated,
	}
	return &metrics
}

// GetStatus returns the current status of the concurrent AI manager
func (cam *ConcurrentAIManager) GetStatus() map[string]interface{} {
	metrics := cam.GetMetrics()

	return map[string]interface{}{
		"running":               cam.isRunning,
		"total_requests":        metrics.TotalRequests,
		"concurrent_requests":   metrics.ConcurrentRequests,
		"completed_requests":    metrics.CompletedRequests,
		"failed_requests":       metrics.FailedRequests,
		"average_response_time": metrics.AverageResponseTime,
		"peak_concurrency":      metrics.PeakConcurrency,
		"throughput_per_second": metrics.ThroughputPerSecond,
		"worker_pool":           cam.workerPool.GetStatus(),
		"rate_limiter":          cam.rateLimiter.GetStatus(),
		"circuit_breaker":       cam.circuitBreaker.GetStatus(),
		"last_updated":          metrics.LastUpdated,
	}
}

// IsHealthy returns whether the concurrent AI manager is healthy
func (cam *ConcurrentAIManager) IsHealthy() bool {
	return cam.isRunning &&
		cam.workerPool.IsRunning() &&
		cam.rateLimiter.IsHealthy() &&
		cam.circuitBreaker.IsHealthy()
}

// updateMetrics safely updates metrics using a function
func (cam *ConcurrentAIManager) updateMetrics(updateFunc func(*ConcurrentMetrics)) {
	cam.metrics.mu.Lock()
	defer cam.metrics.mu.Unlock()
	updateFunc(cam.metrics)
	cam.metrics.LastUpdated = time.Now()
}

// updateAverageResponseTime updates the average response time
func (cam *ConcurrentAIManager) updateAverageResponseTime(duration time.Duration) {
	// Simple moving average calculation
	if cam.metrics.AverageResponseTime == 0 {
		cam.metrics.AverageResponseTime = float64(duration.Milliseconds())
	} else {
		// Weighted average with 90% weight on previous average
		cam.metrics.AverageResponseTime = cam.metrics.AverageResponseTime*0.9 + float64(duration.Milliseconds())*0.1
	}
}

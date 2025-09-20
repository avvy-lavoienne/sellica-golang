package performance

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// HighPerformanceAIEngine provides ultra-optimized AI processing
type HighPerformanceAIEngine struct {
	processingPools      map[string]*ProcessingPool
	loadBalancer        *IntelligentLoadBalancer
	requestRouter       *RequestRouter
	performanceOptimizer PerformanceOptimizer
	resourceManager     ResourceManager
	metricsCollector    MetricsCollector

	isRunning bool
	mu        sync.RWMutex
}

// ProcessingPool manages specialized AI workers
type ProcessingPool struct {
	poolType        string
	workers         []*AIWorker
	requestQueue    chan *AIRequest
	responseQueue   chan *AIResponse
	loadMetrics     *LoadMetrics
	healthChecker   *HealthChecker
	
	isActive bool
	mu       sync.RWMutex
}

// AIWorker represents a specialized AI processing worker
type AIWorker struct {
	id              string
	workerType      WorkerType
	aiProvider      AIProvider
	nlpProcessor    NLPProcessor
	cacheManager    CacheManager
	performanceProfile *PerformanceProfile
	resourceLimits  *ResourceLimits
	
	isHealthy bool
	mu        sync.RWMutex
}



// AIRequest represents an AI processing request
type AIRequest struct {
	ID          string                 `json:"id"`
	Query       string                 `json:"query"`
	UserID      string                 `json:"user_id"`
	SessionID   string                 `json:"session_id"`
	Context     map[string]interface{} `json:"context"`
	Priority    Priority               `json:"priority"`
	Timeout     time.Duration          `json:"timeout"`
	RequestedAt time.Time              `json:"requested_at"`
}

// AIResponse represents an AI processing response
type AIResponse struct {
	ID             string                 `json:"id"`
	Response       string                 `json:"response"`
	Confidence     float64                `json:"confidence"`
	ProcessingTime time.Duration          `json:"processing_time"`
	WorkerType     WorkerType             `json:"worker_type"`
	CacheHit       bool                   `json:"cache_hit"`
	Metadata       map[string]interface{} `json:"metadata"`
	GeneratedAt    time.Time              `json:"generated_at"`
}

// Priority defines request priority levels
type Priority int

const (
	PriorityLow Priority = iota
	PriorityNormal
	PriorityHigh
	PriorityCritical
)

// NewHighPerformanceAIEngine creates a new high-performance AI engine
func NewHighPerformanceAIEngine(config *EngineConfig) (*HighPerformanceAIEngine, error) {
	if config == nil {
		config = getDefaultEngineConfig()
	}

	engine := &HighPerformanceAIEngine{
		processingPools:    make(map[string]*ProcessingPool),
		metricsCollector:  NewMetricsCollector(),
		resourceManager:   NewResourceManager(config.ResourceLimits),
		performanceOptimizer: NewPerformanceOptimizer(),
	}

	// Initialize processing pools
	if err := engine.initializeProcessingPools(config); err != nil {
		return nil, fmt.Errorf("failed to initialize processing pools: %w", err)
	}

	// Initialize load balancer
	engine.loadBalancer = NewIntelligentLoadBalancer(engine.processingPools)

	// Initialize request router
	engine.requestRouter = NewRequestRouter(config.RoutingRules)

	logrus.Info("🚀 High-Performance AI Engine initialized")
	return engine, nil
}

// ProcessWithOptimalPerformance processes an AI request with optimal performance
func (hpai *HighPerformanceAIEngine) ProcessWithOptimalPerformance(
	ctx context.Context,
	req *AIRequest,
) (*AIResponse, error) {
	startTime := time.Now()
	
	if !hpai.isRunning {
		return nil, fmt.Errorf("high-performance AI engine is not running")
	}

	// Intelligent request routing based on characteristics
	poolType := hpai.requestRouter.DetermineOptimalPool(req)
	pool, exists := hpai.processingPools[poolType]
	if !exists {
		return nil, fmt.Errorf("processing pool not found: %s", poolType)
	}

	// Load balancing within pool
	worker := hpai.loadBalancer.SelectOptimalWorker(pool, req)
	if worker == nil {
		return nil, fmt.Errorf("no healthy workers available in pool: %s", poolType)
	}

	// Process with performance monitoring
	response, err := worker.ProcessWithMonitoring(ctx, req)
	if err != nil {
		hpai.metricsCollector.RecordError(poolType, err)
		return nil, fmt.Errorf("high-performance processing failed: %w", err)
	}

	// Record performance metrics
	processingTime := time.Since(startTime)
	hpai.metricsCollector.RecordProcessing(poolType, processingTime, response)

	// Adaptive optimization based on performance
	hpai.performanceOptimizer.OptimizeBasedOnMetrics(poolType, processingTime, req)

	response.ProcessingTime = processingTime
	return response, nil
}

// ProcessWithMonitoring processes a request with comprehensive monitoring
func (w *AIWorker) ProcessWithMonitoring(
	ctx context.Context,
	req *AIRequest,
) (*AIResponse, error) {
	w.mu.RLock()
	if !w.isHealthy {
		w.mu.RUnlock()
		return nil, fmt.Errorf("worker %s is not healthy", w.id)
	}
	w.mu.RUnlock()

	// Pre-processing optimization
	optimizedReq := w.optimizeRequest(req)

	// Check cache with worker-specific strategy
	if cached, found := w.cacheManager.GetWithWorkerStrategy(optimizedReq, w.workerType); found {
		cached.CacheHit = true
		return cached, nil
	}

	// Resource allocation check
	if !w.resourceLimits.CanProcess(optimizedReq) {
		return nil, fmt.Errorf("resource limits exceeded for worker %s", w.id)
	}

	// Process based on worker specialization
	var response *AIResponse
	var err error

	switch w.workerType {
	case WorkerTypeSimple:
		response, err = w.processSimpleQuery(ctx, optimizedReq)
	case WorkerTypeComplex:
		response, err = w.processComplexQuery(ctx, optimizedReq)
	case WorkerTypeNLP:
		response, err = w.processNLPQuery(ctx, optimizedReq)
	case WorkerTypeLearning:
		response, err = w.processLearningQuery(ctx, optimizedReq)
	default:
		response, err = w.aiProvider.ProcessQuery(ctx, optimizedReq)
	}

	if err != nil {
		return nil, err
	}

	// Post-processing optimization
	optimizedResponse := w.optimizeResponse(response, optimizedReq)

	// Cache with worker-specific strategy
	w.cacheManager.SetWithWorkerStrategy(optimizedReq, optimizedResponse, w.workerType)

	optimizedResponse.WorkerType = w.workerType
	optimizedResponse.CacheHit = false
	return optimizedResponse, nil
}

// Start starts the high-performance AI engine
func (hpai *HighPerformanceAIEngine) Start() error {
	hpai.mu.Lock()
	defer hpai.mu.Unlock()

	if hpai.isRunning {
		return fmt.Errorf("high-performance AI engine is already running")
	}

	// Start all processing pools
	for poolType, pool := range hpai.processingPools {
		if err := pool.Start(); err != nil {
			return fmt.Errorf("failed to start processing pool %s: %w", poolType, err)
		}
	}

	// Start metrics collection
	hpai.metricsCollector.Start()

	// Start performance optimization
	hpai.performanceOptimizer.Start()

	hpai.isRunning = true
	logrus.Info("🚀 High-Performance AI Engine started successfully")
	return nil
}

// Stop stops the high-performance AI engine
func (hpai *HighPerformanceAIEngine) Stop() error {
	hpai.mu.Lock()
	defer hpai.mu.Unlock()

	if !hpai.isRunning {
		return nil
	}

	// Stop performance optimization
	hpai.performanceOptimizer.Stop()

	// Stop metrics collection
	hpai.metricsCollector.Stop()

	// Stop all processing pools
	for poolType, pool := range hpai.processingPools {
		if err := pool.Stop(); err != nil {
			logrus.WithError(err).Warnf("Failed to stop processing pool %s", poolType)
		}
	}

	hpai.isRunning = false
	logrus.Info("🛑 High-Performance AI Engine stopped")
	return nil
}

// GetMetrics returns current performance metrics
func (hpai *HighPerformanceAIEngine) GetMetrics() map[string]interface{} {
	hpai.mu.RLock()
	defer hpai.mu.RUnlock()

	metrics := make(map[string]interface{})
	
	// Engine-level metrics
	metrics["engine"] = map[string]interface{}{
		"running":        hpai.isRunning,
		"pools_count":    len(hpai.processingPools),
		"total_workers":  hpai.getTotalWorkerCount(),
	}

	// Pool-level metrics
	poolMetrics := make(map[string]interface{})
	for poolType, pool := range hpai.processingPools {
		poolMetrics[poolType] = pool.GetMetrics()
	}
	metrics["pools"] = poolMetrics

	// Performance metrics
	metrics["performance"] = hpai.metricsCollector.GetMetrics()

	// Resource metrics
	metrics["resources"] = hpai.resourceManager.GetMetrics()

	return metrics
}

// initializeProcessingPools initializes all processing pools
func (hpai *HighPerformanceAIEngine) initializeProcessingPools(config *EngineConfig) error {
	for poolType, poolConfig := range config.ProcessingPools {
		pool, err := NewProcessingPool(poolConfig)
		if err != nil {
			return fmt.Errorf("failed to create processing pool %s: %w", poolType, err)
		}
		hpai.processingPools[poolType] = pool
	}
	return nil
}

// getTotalWorkerCount returns total number of workers
func (hpai *HighPerformanceAIEngine) getTotalWorkerCount() int {
	total := 0
	for _, pool := range hpai.processingPools {
		total += len(pool.workers)
	}
	return total
}

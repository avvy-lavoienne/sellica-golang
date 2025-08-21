package performance

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// NewProcessingPool creates a new processing pool
func NewProcessingPool(config *PoolConfig) (*ProcessingPool, error) {
	pool := &ProcessingPool{
		poolType:      config.PoolType,
		workers:       make([]*AIWorker, 0, config.WorkerCount),
		requestQueue:  make(chan *AIRequest, config.QueueSize),
		responseQueue: make(chan *AIResponse, config.QueueSize),
		loadMetrics:   &LoadMetrics{},
		healthChecker: &HealthChecker{},
	}

	// Create workers
	for i := 0; i < config.WorkerCount; i++ {
		worker, err := NewAIWorker(fmt.Sprintf("%s-worker-%d", config.PoolType, i), config.WorkerType)
		if err != nil {
			return nil, fmt.Errorf("failed to create worker %d: %w", i, err)
		}
		pool.workers = append(pool.workers, worker)
	}

	return pool, nil
}

// NewAIWorker creates a new AI worker
func NewAIWorker(id string, workerType WorkerType) (*AIWorker, error) {
	worker := &AIWorker{
		id:         id,
		workerType: workerType,
		isHealthy:  true,
		performanceProfile: &PerformanceProfile{
			OptimalQueryLength:  getOptimalQueryLength(workerType),
			MaxQueryLength:      getMaxQueryLength(workerType),
			AverageResponseTime: getExpectedResponseTime(workerType),
			MaxResponseTime:     getMaxResponseTime(workerType),
		},
		resourceLimits: &ResourceLimits{
			MaxMemoryMB:       getMaxMemoryMB(workerType),
			MaxCPUPercent:     80.0,
			MaxConcurrentReqs: getMaxConcurrentReqs(workerType),
			RequestTimeout:    getRequestTimeout(workerType),
		},
	}

	// Initialize worker-specific components based on type
	if err := worker.initializeComponents(); err != nil {
		return nil, fmt.Errorf("failed to initialize worker components: %w", err)
	}

	return worker, nil
}

// Start starts the processing pool
func (pp *ProcessingPool) Start() error {
	pp.mu.Lock()
	defer pp.mu.Unlock()

	if pp.isActive {
		return fmt.Errorf("processing pool %s is already active", pp.poolType)
	}

	// Start all workers
	for _, worker := range pp.workers {
		if err := worker.Start(); err != nil {
			return fmt.Errorf("failed to start worker %s: %w", worker.id, err)
		}
	}

	pp.isActive = true
	logrus.Infof("🚀 Processing pool %s started with %d workers", pp.poolType, len(pp.workers))
	return nil
}

// Stop stops the processing pool
func (pp *ProcessingPool) Stop() error {
	pp.mu.Lock()
	defer pp.mu.Unlock()

	if !pp.isActive {
		return nil
	}

	// Stop all workers
	for _, worker := range pp.workers {
		if err := worker.Stop(); err != nil {
			logrus.WithError(err).Warnf("Failed to stop worker %s", worker.id)
		}
	}

	pp.isActive = false
	logrus.Infof("🛑 Processing pool %s stopped", pp.poolType)
	return nil
}

// GetMetrics returns pool metrics
func (pp *ProcessingPool) GetMetrics() map[string]interface{} {
	pp.mu.RLock()
	defer pp.mu.RUnlock()

	metrics := make(map[string]interface{})
	metrics["pool_type"] = pp.poolType
	metrics["active"] = pp.isActive
	metrics["worker_count"] = len(pp.workers)
	metrics["queue_depth"] = len(pp.requestQueue)
	metrics["load_metrics"] = pp.loadMetrics

	// Worker metrics
	workerMetrics := make([]map[string]interface{}, 0, len(pp.workers))
	for _, worker := range pp.workers {
		workerMetrics = append(workerMetrics, worker.GetMetrics())
	}
	metrics["workers"] = workerMetrics

	return metrics
}

// Worker-specific helper functions

// getOptimalQueryLength returns optimal query length for worker type
func getOptimalQueryLength(workerType WorkerType) int {
	switch workerType {
	case WorkerTypeSimple:
		return 100
	case WorkerTypeComplex:
		return 500
	case WorkerTypeNLP:
		return 300
	case WorkerTypeLearning:
		return 1000
	default:
		return 200
	}
}

// getMaxQueryLength returns maximum query length for worker type
func getMaxQueryLength(workerType WorkerType) int {
	switch workerType {
	case WorkerTypeSimple:
		return 200
	case WorkerTypeComplex:
		return 2000
	case WorkerTypeNLP:
		return 1000
	case WorkerTypeLearning:
		return 5000
	default:
		return 500
	}
}

// getExpectedResponseTime returns expected response time for worker type
func getExpectedResponseTime(workerType WorkerType) time.Duration {
	switch workerType {
	case WorkerTypeSimple:
		return 50 * time.Millisecond
	case WorkerTypeComplex:
		return 200 * time.Millisecond
	case WorkerTypeNLP:
		return 100 * time.Millisecond
	case WorkerTypeLearning:
		return 2 * time.Second
	default:
		return 100 * time.Millisecond
	}
}

// getMaxResponseTime returns maximum response time for worker type
func getMaxResponseTime(workerType WorkerType) time.Duration {
	switch workerType {
	case WorkerTypeSimple:
		return 100 * time.Millisecond
	case WorkerTypeComplex:
		return 500 * time.Millisecond
	case WorkerTypeNLP:
		return 300 * time.Millisecond
	case WorkerTypeLearning:
		return 5 * time.Second
	default:
		return 200 * time.Millisecond
	}
}

// getMaxMemoryMB returns maximum memory usage for worker type
func getMaxMemoryMB(workerType WorkerType) int {
	switch workerType {
	case WorkerTypeSimple:
		return 64
	case WorkerTypeComplex:
		return 256
	case WorkerTypeNLP:
		return 128
	case WorkerTypeLearning:
		return 512
	default:
		return 128
	}
}

// getMaxConcurrentReqs returns maximum concurrent requests for worker type
func getMaxConcurrentReqs(workerType WorkerType) int {
	switch workerType {
	case WorkerTypeSimple:
		return 10
	case WorkerTypeComplex:
		return 3
	case WorkerTypeNLP:
		return 5
	case WorkerTypeLearning:
		return 2
	default:
		return 5
	}
}

// getRequestTimeout returns request timeout for worker type
func getRequestTimeout(workerType WorkerType) time.Duration {
	switch workerType {
	case WorkerTypeSimple:
		return 5 * time.Second
	case WorkerTypeComplex:
		return 30 * time.Second
	case WorkerTypeNLP:
		return 15 * time.Second
	case WorkerTypeLearning:
		return 60 * time.Second
	default:
		return 10 * time.Second
	}
}

// initializeComponents initializes worker-specific components
func (w *AIWorker) initializeComponents() error {
	// Initialize AI provider based on worker type
	switch w.workerType {
	case WorkerTypeSimple:
		w.aiProvider = NewSimpleAIProvider()
	case WorkerTypeComplex:
		w.aiProvider = NewComplexAIProvider()
	case WorkerTypeNLP:
		w.aiProvider = NewNLPAIProvider()
		w.nlpProcessor = NewIndonesianNLPProcessor()
	case WorkerTypeLearning:
		w.aiProvider = NewLearningAIProvider()
	default:
		w.aiProvider = NewSimpleAIProvider()
	}

	// Initialize cache manager with worker-specific strategy
	w.cacheManager = NewWorkerCacheManager(w.workerType)

	return nil
}

// Start starts the AI worker
func (w *AIWorker) Start() error {
	w.mu.Lock()
	defer w.mu.Unlock()

	if !w.isHealthy {
		return fmt.Errorf("worker %s is not healthy", w.id)
	}

	// Worker is ready to process requests
	logrus.Debugf("🚀 AI Worker %s started", w.id)
	return nil
}

// Stop stops the AI worker
func (w *AIWorker) Stop() error {
	w.mu.Lock()
	defer w.mu.Unlock()

	// Cleanup worker resources
	logrus.Debugf("🛑 AI Worker %s stopped", w.id)
	return nil
}

// GetMetrics returns worker metrics
func (w *AIWorker) GetMetrics() map[string]interface{} {
	w.mu.RLock()
	defer w.mu.RUnlock()

	return map[string]interface{}{
		"id":          w.id,
		"type":        string(w.workerType),
		"healthy":     w.isHealthy,
		"performance": w.performanceProfile,
		"resources":   w.resourceLimits,
	}
}

// Specialized processing methods

// processSimpleQuery processes simple queries with minimal overhead
func (w *AIWorker) processSimpleQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	startTime := time.Now()

	// Fast path for simple queries
	response, err := w.aiProvider.ProcessQuery(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("simple query processing failed: %w", err)
	}

	response.ProcessingTime = time.Since(startTime)
	response.Confidence = 0.85 // Simple queries have good confidence

	return response, nil
}

// processComplexQuery processes complex queries with advanced analysis
func (w *AIWorker) processComplexQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	startTime := time.Now()

	// Enhanced processing for complex queries
	response, err := w.aiProvider.ProcessQuery(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("complex query processing failed: %w", err)
	}

	// Additional analysis for complex queries
	if len(req.Query) > 500 {
		response.Confidence *= 0.95 // Slightly lower confidence for very long queries
	}

	response.ProcessingTime = time.Since(startTime)

	return response, nil
}

// processNLPQuery processes NLP queries with Indonesian language support
func (w *AIWorker) processNLPQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	startTime := time.Now()

	// Indonesian NLP preprocessing
	if w.nlpProcessor != nil {
		nlpResult, err := w.nlpProcessor.ProcessIndonesianText(ctx, req.Query, req.Context)
		if err != nil {
			logrus.WithError(err).Warn("Indonesian NLP preprocessing failed, continuing with standard processing")
		} else {
			// Enhance request with NLP insights
			if req.Context == nil {
				req.Context = make(map[string]interface{})
			}
			req.Context["nlp_analysis"] = nlpResult
		}
	}

	// Process with AI provider
	response, err := w.aiProvider.ProcessQuery(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("NLP query processing failed: %w", err)
	}

	// Enhanced confidence for Indonesian queries
	if w.isIndonesianQuery(req.Query) {
		response.Confidence *= 1.1 // Boost confidence for Indonesian queries
		if response.Confidence > 1.0 {
			response.Confidence = 1.0
		}
	}

	response.ProcessingTime = time.Since(startTime)

	return response, nil
}

// processLearningQuery processes learning/training queries
func (w *AIWorker) processLearningQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	startTime := time.Now()

	// Learning-specific processing
	response, err := w.aiProvider.ProcessQuery(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("learning query processing failed: %w", err)
	}

	// Add learning metadata
	if response.Metadata == nil {
		response.Metadata = make(map[string]interface{})
	}
	response.Metadata["learning_session"] = true
	response.Metadata["training_eligible"] = true

	response.ProcessingTime = time.Since(startTime)

	return response, nil
}

// optimizeRequest optimizes request for worker-specific processing
func (w *AIWorker) optimizeRequest(req *AIRequest) *AIRequest {
	optimized := *req // Copy request

	// Worker-specific optimizations
	switch w.workerType {
	case WorkerTypeSimple:
		// Truncate very long queries for simple workers
		if len(optimized.Query) > w.performanceProfile.OptimalQueryLength {
			optimized.Query = optimized.Query[:w.performanceProfile.OptimalQueryLength] + "..."
		}
	case WorkerTypeNLP:
		// Ensure Indonesian context is available
		if optimized.Context == nil {
			optimized.Context = make(map[string]interface{})
		}
		optimized.Context["language"] = "indonesian"
		optimized.Context["nlp_enabled"] = true
	}

	return &optimized
}

// optimizeResponse optimizes response based on worker type
func (w *AIWorker) optimizeResponse(response *AIResponse, req *AIRequest) *AIResponse {
	optimized := *response // Copy response

	// Use req parameter to avoid unused parameter warning
	_ = req

	// Worker-specific response optimizations
	switch w.workerType {
	case WorkerTypeSimple:
		// Ensure response is concise for simple workers
		if len(optimized.Response) > 500 {
			optimized.Response = optimized.Response[:497] + "..."
		}
	case WorkerTypeNLP:
		// Add Indonesian language metadata
		if optimized.Metadata == nil {
			optimized.Metadata = make(map[string]interface{})
		}
		optimized.Metadata["language_processed"] = "indonesian"
		optimized.Metadata["nlp_enhanced"] = true
	}

	return &optimized
}

// isIndonesianQuery checks if query is in Indonesian
func (w *AIWorker) isIndonesianQuery(query string) bool {
	indonesianKeywords := []string{
		"bagaimana", "dimana", "kapan", "mengapa", "siapa", "apa", "yang",
		"ktp", "kk", "akta", "dukcapil", "pemerintah", "layanan",
		"dengan", "untuk", "dari", "dalam", "pada", "akan", "adalah",
	}

	queryLower := toLower(query)
	matchCount := 0

	for _, keyword := range indonesianKeywords {
		if contains(queryLower, keyword) {
			matchCount++
		}
	}

	// Consider Indonesian if at least 2 keywords match
	return matchCount >= 2
}

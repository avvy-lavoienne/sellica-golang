package performance

import (
	"math"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// IntelligentLoadBalancer provides optimal worker selection
type IntelligentLoadBalancer struct {
	workerMetrics    map[string]*WorkerMetrics
	loadPredictor    *LoadPredictor
	healthMonitor    *HealthMonitor
	adaptiveWeights  *AdaptiveWeights
	
	mu sync.RWMutex
}

// WorkerMetrics holds performance metrics for a worker
type WorkerMetrics struct {
	WorkerID           string        `json:"worker_id"`
	TotalRequests      int64         `json:"total_requests"`
	SuccessfulRequests int64         `json:"successful_requests"`
	FailedRequests     int64         `json:"failed_requests"`
	AverageResponseTime time.Duration `json:"average_response_time"`
	CurrentLoad        float64       `json:"current_load"`
	HealthScore        float64       `json:"health_score"`
	LastUpdated        time.Time     `json:"last_updated"`
	
	// Performance history
	ResponseTimeHistory []time.Duration `json:"response_time_history"`
	LoadHistory         []float64       `json:"load_history"`
	
	mu sync.RWMutex
}

// LoadPredictor predicts worker performance
type LoadPredictor struct {
	predictionModels map[string]*PredictionModel
	historicalData   map[string][]PerformanceDataPoint
	
	mu sync.RWMutex
}

// HealthMonitor monitors worker health
type HealthMonitor struct {
	healthChecks    map[string]*HealthCheck
	healthThresholds *HealthThresholds
	
	mu sync.RWMutex
}

// AdaptiveWeights manages dynamic weight calculation
type AdaptiveWeights struct {
	performanceWeight    float64
	loadWeight          float64
	specializationWeight float64
	predictedWeight     float64
	
	// Adaptive parameters
	learningRate float64
	decayFactor  float64
	
	mu sync.RWMutex
}

// NewLoadPredictor creates a new load predictor
func NewLoadPredictor() *LoadPredictor {
	return &LoadPredictor{
		predictionModels: make(map[string]*PredictionModel),
		historicalData:   make(map[string][]PerformanceDataPoint),
	}
}

// NewHealthMonitor creates a new health monitor
func NewHealthMonitor() *HealthMonitor {
	return &HealthMonitor{
		healthChecks: make(map[string]*HealthCheck),
		healthThresholds: &HealthThresholds{
			MaxResponseTime:     500 * time.Millisecond,
			MaxConsecutiveFails: 3,
			MaxMemoryUsageMB:    400,
			MaxErrorRate:        0.05, // 5%
		},
	}
}

// NewAdaptiveWeights creates new adaptive weights
func NewAdaptiveWeights() *AdaptiveWeights {
	return &AdaptiveWeights{
		performanceWeight:    0.3,
		loadWeight:          0.3,
		specializationWeight: 0.2,
		predictedWeight:     0.2,
		learningRate:        0.01,
		decayFactor:         0.95,
	}
}

// NewIntelligentLoadBalancer creates a new intelligent load balancer
func NewIntelligentLoadBalancer(pools map[string]*ProcessingPool) *IntelligentLoadBalancer {
	ilb := &IntelligentLoadBalancer{
		workerMetrics:   make(map[string]*WorkerMetrics),
		loadPredictor:   NewLoadPredictor(),
		healthMonitor:   NewHealthMonitor(),
		adaptiveWeights: NewAdaptiveWeights(),
	}

	// Initialize worker metrics for all workers
	for _, pool := range pools {
		for _, worker := range pool.workers {
			ilb.workerMetrics[worker.id] = &WorkerMetrics{
				WorkerID:            worker.id,
				ResponseTimeHistory: make([]time.Duration, 0, 100),
				LoadHistory:         make([]float64, 0, 100),
				LastUpdated:         time.Now(),
			}
		}
	}

	logrus.Info("🎯 Intelligent Load Balancer initialized")
	return ilb
}

// SelectOptimalWorker selects the best worker for a request
func (ilb *IntelligentLoadBalancer) SelectOptimalWorker(
	pool *ProcessingPool,
	req *AIRequest,
) *AIWorker {
	ilb.mu.RLock()
	defer ilb.mu.RUnlock()

	if len(pool.workers) == 0 {
		return nil
	}

	// Calculate worker scores based on multiple factors
	scores := make(map[string]float64)
	
	for _, worker := range pool.workers {
		if !ilb.healthMonitor.IsHealthy(worker.id) {
			continue
		}

		metrics := ilb.workerMetrics[worker.id]
		if metrics == nil {
			continue
		}

		// Performance score (response time, success rate)
		performanceScore := ilb.calculatePerformanceScore(metrics)

		// Load score (current queue, resource usage)
		loadScore := ilb.calculateLoadScore(worker, req)

		// Specialization score (worker type match)
		specializationScore := ilb.calculateSpecializationScore(worker, req)

		// Predicted performance score
		predictedScore := ilb.loadPredictor.PredictPerformance(worker, req)

		// Weighted combination
		totalScore := ilb.adaptiveWeights.CalculateWeightedScore(
			performanceScore,
			loadScore,
			specializationScore,
			predictedScore,
		)

		scores[worker.id] = totalScore
	}

	// Select worker with highest score
	bestWorkerID := ilb.selectBestWorker(scores)
	if bestWorkerID == "" {
		return nil
	}

	return ilb.findWorkerByID(pool, bestWorkerID)
}

// calculatePerformanceScore calculates performance-based score
func (ilb *IntelligentLoadBalancer) calculatePerformanceScore(metrics *WorkerMetrics) float64 {
	metrics.mu.RLock()
	defer metrics.mu.RUnlock()

	if metrics.TotalRequests == 0 {
		return 0.5 // Neutral score for new workers
	}

	// Success rate component (0-1)
	successRate := float64(metrics.SuccessfulRequests) / float64(metrics.TotalRequests)

	// Response time component (inverse relationship)
	avgResponseTimeMs := float64(metrics.AverageResponseTime.Milliseconds())
	responseTimeScore := 1.0 / (1.0 + avgResponseTimeMs/100.0) // Normalize around 100ms

	// Combine scores
	performanceScore := (successRate * 0.7) + (responseTimeScore * 0.3)

	return math.Max(0.0, math.Min(1.0, performanceScore))
}

// calculateLoadScore calculates load-based score
func (ilb *IntelligentLoadBalancer) calculateLoadScore(worker *AIWorker, _ *AIRequest) float64 {
	worker.mu.RLock()
	defer worker.mu.RUnlock()

	// Current load factor (inverse relationship - lower load = higher score)
	metrics := ilb.workerMetrics[worker.id]
	if metrics == nil {
		return 0.5
	}

	currentLoad := metrics.CurrentLoad
	loadScore := 1.0 - currentLoad

	// Resource availability factor
	resourceScore := 1.0
	if worker.resourceLimits != nil {
		resourceScore = worker.resourceLimits.GetAvailabilityScore()
	}

	// Queue length factor (if applicable)
	queueScore := 1.0 // Simplified for now

	// Combine load factors
	totalLoadScore := (loadScore * 0.5) + (resourceScore * 0.3) + (queueScore * 0.2)

	return math.Max(0.0, math.Min(1.0, totalLoadScore))
}

// calculateSpecializationScore calculates specialization match score
func (ilb *IntelligentLoadBalancer) calculateSpecializationScore(worker *AIWorker, req *AIRequest) float64 {
	// Determine request complexity and type
	requestComplexity := ilb.analyzeRequestComplexity(req)
	requestType := ilb.analyzeRequestType(req)

	// Match worker specialization to request characteristics
	specializationScore := 0.5 // Default neutral score

	switch wt := worker.workerType; wt {
	case WorkerTypeSimple:
		if requestComplexity < 0.3 {
			specializationScore = 1.0
		} else if requestComplexity < 0.6 {
			specializationScore = 0.7
		}

	case WorkerTypeComplex:
		if requestComplexity > 0.7 {
			specializationScore = 1.0
		} else if requestComplexity > 0.4 {
			specializationScore = 0.8
		}

	case WorkerTypeNLP:
		if requestType == "nlp" || requestType == "indonesian" {
			specializationScore = 1.0
		} else if requestType == "text" {
			specializationScore = 0.8
		}

	case WorkerTypeLearning:
		if requestType == "training" || requestType == "learning" {
			specializationScore = 1.0
		}
	}

	return specializationScore
}

// analyzeRequestComplexity analyzes request complexity (0-1 scale)
func (ilb *IntelligentLoadBalancer) analyzeRequestComplexity(req *AIRequest) float64 {
	complexity := 0.0

	// Query length factor
	queryLength := len(req.Query)
	if queryLength > 500 {
		complexity += 0.3
	} else if queryLength > 200 {
		complexity += 0.2
	} else if queryLength > 100 {
		complexity += 0.1
	}

	// Context complexity factor
	if req.Context != nil {
		contextSize := len(req.Context)
		if contextSize > 10 {
			complexity += 0.2
		} else if contextSize > 5 {
			complexity += 0.1
		}
	}

	// Priority factor
	switch req.Priority {
	case PriorityCritical:
		complexity += 0.3
	case PriorityHigh:
		complexity += 0.2
	case PriorityNormal:
		complexity += 0.1
	}

	return math.Min(1.0, complexity)
}

// analyzeRequestType analyzes request type
func (ilb *IntelligentLoadBalancer) analyzeRequestType(req *AIRequest) string {
	query := req.Query

	// Indonesian language detection
	indonesianKeywords := []string{"bagaimana", "dimana", "kapan", "mengapa", "siapa", "ktp", "kk", "akta"}
	for _, keyword := range indonesianKeywords {
		if contains(query, keyword) {
			return "indonesian"
		}
	}

	// NLP-related keywords
	nlpKeywords := []string{"analyze", "sentiment", "entity", "classification", "language"}
	for _, keyword := range nlpKeywords {
		if contains(query, keyword) {
			return "nlp"
		}
	}

	// Training-related keywords
	trainingKeywords := []string{"train", "learn", "model", "accuracy", "validation"}
	for _, keyword := range trainingKeywords {
		if contains(query, keyword) {
			return "training"
		}
	}

	return "general"
}

// selectBestWorker selects the worker with the highest score
func (ilb *IntelligentLoadBalancer) selectBestWorker(scores map[string]float64) string {
	if len(scores) == 0 {
		return ""
	}

	bestWorkerID := ""
	bestScore := -1.0

	for workerID, score := range scores {
		if score > bestScore {
			bestScore = score
			bestWorkerID = workerID
		}
	}

	return bestWorkerID
}

// findWorkerByID finds a worker by ID in the pool
func (ilb *IntelligentLoadBalancer) findWorkerByID(pool *ProcessingPool, workerID string) *AIWorker {
	for _, worker := range pool.workers {
		if worker.id == workerID {
			return worker
		}
	}
	return nil
}

// UpdateWorkerMetrics updates metrics for a worker
func (ilb *IntelligentLoadBalancer) UpdateWorkerMetrics(workerID string, responseTime time.Duration, success bool) {
	ilb.mu.Lock()
	defer ilb.mu.Unlock()

	metrics, exists := ilb.workerMetrics[workerID]
	if !exists {
		return
	}

	metrics.mu.Lock()
	defer metrics.mu.Unlock()

	// Update counters
	metrics.TotalRequests++
	if success {
		metrics.SuccessfulRequests++
	} else {
		metrics.FailedRequests++
	}

	// Update response time history
	if len(metrics.ResponseTimeHistory) >= 100 {
		metrics.ResponseTimeHistory = metrics.ResponseTimeHistory[1:]
	}
	metrics.ResponseTimeHistory = append(metrics.ResponseTimeHistory, responseTime)

	// Calculate new average response time
	if len(metrics.ResponseTimeHistory) > 0 {
		var total time.Duration
		for _, rt := range metrics.ResponseTimeHistory {
			total += rt
		}
		metrics.AverageResponseTime = total / time.Duration(len(metrics.ResponseTimeHistory))
	}

	metrics.LastUpdated = time.Now()
}



// PredictPerformance predicts worker performance for a request
func (lp *LoadPredictor) PredictPerformance(worker *AIWorker, req *AIRequest) float64 {
	lp.mu.RLock()
	defer lp.mu.RUnlock()

	// Simple prediction based on historical data
	data, exists := lp.historicalData[worker.id]
	if !exists || len(data) < 5 {
		return 0.5 // Neutral prediction for insufficient data
	}

	// Calculate prediction based on similar requests
	similarRequests := lp.findSimilarRequests(data, req)
	if len(similarRequests) == 0 {
		return 0.5
	}

	// Calculate average performance for similar requests
	var totalScore float64
	for _, dataPoint := range similarRequests {
		score := lp.calculatePerformanceScore(dataPoint)
		totalScore += score
	}

	return totalScore / float64(len(similarRequests))
}

// findSimilarRequests finds similar historical requests
func (lp *LoadPredictor) findSimilarRequests(data []PerformanceDataPoint, req *AIRequest) []PerformanceDataPoint {
	var similar []PerformanceDataPoint

	requestSize := len(req.Query)

	for _, dataPoint := range data {
		// Consider requests with similar size as similar
		sizeDiff := math.Abs(float64(dataPoint.RequestSize - requestSize))
		if sizeDiff <= float64(requestSize)*0.3 { // Within 30% size difference
			similar = append(similar, dataPoint)
		}
	}

	return similar
}

// calculatePerformanceScore calculates performance score from data point
func (lp *LoadPredictor) calculatePerformanceScore(dataPoint PerformanceDataPoint) float64 {
	if !dataPoint.Success {
		return 0.0
	}

	// Score based on response time (lower is better)
	responseTimeMs := float64(dataPoint.ResponseTime.Milliseconds())
	timeScore := 1.0 / (1.0 + responseTimeMs/100.0) // Normalize around 100ms

	// Score based on load (lower is better)
	loadScore := 1.0 - dataPoint.Load

	// Combined score
	return (timeScore * 0.7) + (loadScore * 0.3)
}

// IsHealthy checks if a worker is healthy
func (hm *HealthMonitor) IsHealthy(workerID string) bool {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	healthCheck, exists := hm.healthChecks[workerID]
	if !exists {
		// Assume healthy if no health check data
		return true
	}

	return healthCheck.IsHealthy
}

// UpdateHealthCheck updates health check for a worker
func (hm *HealthMonitor) UpdateHealthCheck(workerID string, responseTime time.Duration, success bool, errorMsg string) {
	hm.mu.Lock()
	defer hm.mu.Unlock()

	healthCheck, exists := hm.healthChecks[workerID]
	if !exists {
		healthCheck = &HealthCheck{
			WorkerID: workerID,
		}
		hm.healthChecks[workerID] = healthCheck
	}

	healthCheck.LastCheckTime = time.Now()
	healthCheck.ResponseTime = responseTime

	if success {
		healthCheck.ConsecutiveFails = 0
		healthCheck.ErrorMessage = ""
	} else {
		healthCheck.ConsecutiveFails++
		healthCheck.ErrorMessage = errorMsg
	}

	// Determine health status
	healthCheck.IsHealthy = hm.evaluateHealth(healthCheck)
}

// evaluateHealth evaluates worker health based on thresholds
func (hm *HealthMonitor) evaluateHealth(healthCheck *HealthCheck) bool {
	// Check consecutive failures
	if healthCheck.ConsecutiveFails >= hm.healthThresholds.MaxConsecutiveFails {
		return false
	}

	// Check response time
	if healthCheck.ResponseTime > hm.healthThresholds.MaxResponseTime {
		return false
	}

	return true
}

// CalculateWeightedScore calculates weighted score
func (aw *AdaptiveWeights) CalculateWeightedScore(
	performanceScore, loadScore, specializationScore, predictedScore float64,
) float64 {
	aw.mu.RLock()
	defer aw.mu.RUnlock()

	weightedScore := (performanceScore * aw.performanceWeight) +
		(loadScore * aw.loadWeight) +
		(specializationScore * aw.specializationWeight) +
		(predictedScore * aw.predictedWeight)

	return math.Max(0.0, math.Min(1.0, weightedScore))
}

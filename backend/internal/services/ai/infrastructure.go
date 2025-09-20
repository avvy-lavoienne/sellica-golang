package ai

import (
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// InferenceMetrics tracks inference performance metrics
type InferenceMetrics struct {
	totalInferences    int64
	successfulInferences int64
	failedInferences   int64
	totalInferenceTime int64 // nanoseconds
	
	// Per-model metrics
	modelMetrics map[string]*ModelMetrics
	mutex        sync.RWMutex
}

// ModelMetrics tracks metrics for a specific model
type ModelMetrics struct {
	TotalInferences      int64
	SuccessfulInferences int64
	FailedInferences     int64
	TotalInferenceTime   int64 // nanoseconds
	LastInferenceTime    time.Time
}

// NewInferenceMetrics creates a new inference metrics tracker
func NewInferenceMetrics() *InferenceMetrics {
	return &InferenceMetrics{
		modelMetrics: make(map[string]*ModelMetrics),
	}
}

// RecordInference records an inference operation
func (im *InferenceMetrics) RecordInference(modelID string, duration time.Duration, success bool) {
	atomic.AddInt64(&im.totalInferences, 1)
	atomic.AddInt64(&im.totalInferenceTime, duration.Nanoseconds())
	
	if success {
		atomic.AddInt64(&im.successfulInferences, 1)
	} else {
		atomic.AddInt64(&im.failedInferences, 1)
	}
	
	// Update per-model metrics
	im.mutex.Lock()
	defer im.mutex.Unlock()
	
	if _, exists := im.modelMetrics[modelID]; !exists {
		im.modelMetrics[modelID] = &ModelMetrics{}
	}
	
	metrics := im.modelMetrics[modelID]
	metrics.TotalInferences++
	metrics.TotalInferenceTime += duration.Nanoseconds()
	metrics.LastInferenceTime = time.Now()
	
	if success {
		metrics.SuccessfulInferences++
	} else {
		metrics.FailedInferences++
	}
}

// GetMetrics returns current metrics
func (im *InferenceMetrics) GetMetrics() map[string]interface{} {
	totalInferences := atomic.LoadInt64(&im.totalInferences)
	successfulInferences := atomic.LoadInt64(&im.successfulInferences)
	failedInferences := atomic.LoadInt64(&im.failedInferences)
	totalTime := atomic.LoadInt64(&im.totalInferenceTime)
	
	var avgInferenceTime time.Duration
	if totalInferences > 0 {
		avgInferenceTime = time.Duration(totalTime / totalInferences)
	}
	
	successRate := float64(0)
	if totalInferences > 0 {
		successRate = float64(successfulInferences) / float64(totalInferences)
	}
	
	im.mutex.RLock()
	modelMetrics := make(map[string]interface{})
	for modelID, metrics := range im.modelMetrics {
		var avgTime time.Duration
		if metrics.TotalInferences > 0 {
			avgTime = time.Duration(metrics.TotalInferenceTime / metrics.TotalInferences)
		}
		
		modelSuccessRate := float64(0)
		if metrics.TotalInferences > 0 {
			modelSuccessRate = float64(metrics.SuccessfulInferences) / float64(metrics.TotalInferences)
		}
		
		modelMetrics[modelID] = map[string]interface{}{
			"total_inferences":      metrics.TotalInferences,
			"successful_inferences": metrics.SuccessfulInferences,
			"failed_inferences":     metrics.FailedInferences,
			"average_inference_time": avgTime,
			"success_rate":          modelSuccessRate,
			"last_inference_time":   metrics.LastInferenceTime,
		}
	}
	im.mutex.RUnlock()
	
	return map[string]interface{}{
		"total_inferences":       totalInferences,
		"successful_inferences":  successfulInferences,
		"failed_inferences":      failedInferences,
		"average_inference_time": avgInferenceTime,
		"success_rate":           successRate,
		"model_metrics":          modelMetrics,
	}
}

// ModelHealthChecker monitors model health
type ModelHealthChecker struct {
	service *TensorFlowService
}

// NewModelHealthChecker creates a new model health checker
func NewModelHealthChecker(service *TensorFlowService) *ModelHealthChecker {
	return &ModelHealthChecker{
		service: service,
	}
}

// CircuitBreaker implements circuit breaker pattern for fault tolerance
type CircuitBreaker struct {
	config       *CircuitBreakerConfig
	state        CircuitBreakerState
	failures     int64
	lastFailTime time.Time
	mutex        sync.RWMutex
}

// CircuitBreakerConfig holds circuit breaker configuration
type CircuitBreakerConfig struct {
	MaxFailures    int
	ResetTimeout   time.Duration
	FailureTimeout time.Duration
}

// CircuitBreakerState represents the state of the circuit breaker
type CircuitBreakerState string

const (
	CircuitBreakerClosed   CircuitBreakerState = "closed"
	CircuitBreakerOpen     CircuitBreakerState = "open"
	CircuitBreakerHalfOpen CircuitBreakerState = "half_open"
)

// NewCircuitBreaker creates a new circuit breaker
func NewCircuitBreaker(config *CircuitBreakerConfig) *CircuitBreaker {
	return &CircuitBreaker{
		config: config,
		state:  CircuitBreakerClosed,
	}
}

// CanExecute checks if the circuit breaker allows execution
func (cb *CircuitBreaker) CanExecute() bool {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()
	
	switch cb.state {
	case CircuitBreakerClosed:
		return true
	case CircuitBreakerOpen:
		// Check if we should transition to half-open
		if time.Since(cb.lastFailTime) > cb.config.ResetTimeout {
			cb.mutex.RUnlock()
			cb.mutex.Lock()
			cb.state = CircuitBreakerHalfOpen
			cb.mutex.Unlock()
			cb.mutex.RLock()
			return true
		}
		return false
	case CircuitBreakerHalfOpen:
		return true
	default:
		return false
	}
}

// RecordSuccess records a successful operation
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	
	cb.failures = 0
	if cb.state == CircuitBreakerHalfOpen {
		cb.state = CircuitBreakerClosed
		logrus.Info("Circuit breaker transitioned to closed state")
	}
}

// RecordFailure records a failed operation
func (cb *CircuitBreaker) RecordFailure() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	
	cb.failures++
	cb.lastFailTime = time.Now()
	
	if cb.failures >= int64(cb.config.MaxFailures) {
		if cb.state != CircuitBreakerOpen {
			cb.state = CircuitBreakerOpen
			logrus.WithField("failures", cb.failures).Warn("Circuit breaker opened due to failures")
		}
	}
}

// GetStatus returns the current status of the circuit breaker
func (cb *CircuitBreaker) GetStatus() map[string]interface{} {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()
	
	return map[string]interface{}{
		"state":          string(cb.state),
		"failures":       cb.failures,
		"last_fail_time": cb.lastFailTime,
		"max_failures":   cb.config.MaxFailures,
		"reset_timeout":  cb.config.ResetTimeout,
	}
}

// ModelABTesting handles A/B testing for models
type ModelABTesting struct {
	experiments map[string]*ABExperiment
	mutex       sync.RWMutex
}

// ABExperiment represents an A/B testing experiment
type ABExperiment struct {
	ID              string
	ControlModel    string
	TreatmentModel  string
	TrafficSplit    float64 // 0.0 to 1.0, percentage for treatment
	StartTime       time.Time
	EndTime         time.Time
	IsActive        bool
	Metrics         *ExperimentMetrics
}

// ExperimentMetrics tracks A/B test metrics
type ExperimentMetrics struct {
	ControlInferences   int64
	TreatmentInferences int64
	ControlSuccessRate  float64
	TreatmentSuccessRate float64
	ControlAvgTime      time.Duration
	TreatmentAvgTime    time.Duration
}

// NewModelABTesting creates a new A/B testing manager
func NewModelABTesting() *ModelABTesting {
	return &ModelABTesting{
		experiments: make(map[string]*ABExperiment),
	}
}

// SelectModel selects a model based on A/B testing configuration
func (ab *ModelABTesting) SelectModel(requestedModelID, testGroup string) string {
	ab.mutex.RLock()
	defer ab.mutex.RUnlock()
	
	// For now, return the requested model (A/B testing logic can be enhanced)
	// In a full implementation, this would:
	// 1. Check if there's an active experiment for the requested model
	// 2. Use traffic splitting to decide between control and treatment
	// 3. Track the selection for metrics
	
	return requestedModelID
}

// CreateExperiment creates a new A/B testing experiment
func (ab *ModelABTesting) CreateExperiment(id, controlModel, treatmentModel string, trafficSplit float64, duration time.Duration) error {
	ab.mutex.Lock()
	defer ab.mutex.Unlock()
	
	experiment := &ABExperiment{
		ID:             id,
		ControlModel:   controlModel,
		TreatmentModel: treatmentModel,
		TrafficSplit:   trafficSplit,
		StartTime:      time.Now(),
		EndTime:        time.Now().Add(duration),
		IsActive:       true,
		Metrics:        &ExperimentMetrics{},
	}
	
	ab.experiments[id] = experiment
	
	logrus.WithFields(logrus.Fields{
		"experiment_id":    id,
		"control_model":    controlModel,
		"treatment_model":  treatmentModel,
		"traffic_split":    trafficSplit,
		"duration":         duration,
	}).Info("A/B testing experiment created")
	
	return nil
}

// GetExperimentStatus returns the status of all experiments
func (ab *ModelABTesting) GetExperimentStatus() map[string]*ABExperiment {
	ab.mutex.RLock()
	defer ab.mutex.RUnlock()
	
	status := make(map[string]*ABExperiment)
	for id, experiment := range ab.experiments {
		// Create a copy to avoid race conditions
		experimentCopy := *experiment
		status[id] = &experimentCopy
	}
	
	return status
}

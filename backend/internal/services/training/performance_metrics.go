package training

import (
	"sync"
	"time"
)

// PerformanceMetrics tracks training service performance metrics
// Implements Phase 1 performance monitoring requirements
type PerformanceMetrics struct {
	// Processing metrics
	totalRequests        int64
	successfulRequests   int64
	failedRequests       int64
	
	// Timing metrics
	totalProcessingTime  time.Duration
	minProcessingTime    time.Duration
	maxProcessingTime    time.Duration
	avgProcessingTime    time.Duration
	
	// Supabase-specific metrics
	supabaseResponseTimes []time.Duration
	avgSupabaseResponse   time.Duration
	supabaseErrors        int64
	
	// Batch processing metrics
	batchesProcessed     int64
	recordsProcessed     int64
	avgBatchSize         float64
	
	// Memory metrics
	currentMemoryUsage   int64
	peakMemoryUsage      int64
	
	// Concurrent operations
	currentConcurrent    int64
	peakConcurrent       int64
	
	// Training accuracy metrics
	accuracyMeasurements []float64
	currentAccuracy      float64
	targetAccuracy       float64
	
	mu sync.RWMutex
	startTime time.Time
}

// NewPerformanceMetrics creates a new performance metrics tracker
func NewPerformanceMetrics() *PerformanceMetrics {
	return &PerformanceMetrics{
		startTime:           time.Now(),
		minProcessingTime:   time.Duration(0),
		maxProcessingTime:   time.Duration(0),
		targetAccuracy:      0.95, // 95% target accuracy from Phase 1
		supabaseResponseTimes: make([]time.Duration, 0, 1000), // Keep last 1000 measurements
		accuracyMeasurements:  make([]float64, 0, 100),        // Keep last 100 measurements
	}
}

// RecordRequest records a training request with its processing time and success status
func (pm *PerformanceMetrics) RecordRequest(processingTime time.Duration, success bool) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.totalRequests++
	pm.totalProcessingTime += processingTime

	if success {
		pm.successfulRequests++
	} else {
		pm.failedRequests++
	}

	// Update min/max processing times
	if pm.minProcessingTime == 0 || processingTime < pm.minProcessingTime {
		pm.minProcessingTime = processingTime
	}
	if processingTime > pm.maxProcessingTime {
		pm.maxProcessingTime = processingTime
	}

	// Update average processing time
	if pm.totalRequests > 0 {
		pm.avgProcessingTime = pm.totalProcessingTime / time.Duration(pm.totalRequests)
	}
}

// RecordSupabaseResponse records a Supabase API response time
func (pm *PerformanceMetrics) RecordSupabaseResponse(responseTime time.Duration, success bool) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	// Keep only last 1000 measurements for rolling average
	if len(pm.supabaseResponseTimes) >= 1000 {
		pm.supabaseResponseTimes = pm.supabaseResponseTimes[1:]
	}
	pm.supabaseResponseTimes = append(pm.supabaseResponseTimes, responseTime)

	if !success {
		pm.supabaseErrors++
	}

	// Calculate average Supabase response time
	var total time.Duration
	for _, rt := range pm.supabaseResponseTimes {
		total += rt
	}
	if len(pm.supabaseResponseTimes) > 0 {
		pm.avgSupabaseResponse = total / time.Duration(len(pm.supabaseResponseTimes))
	}
}

// RecordBatchProcessing records batch processing metrics
func (pm *PerformanceMetrics) RecordBatchProcessing(batchSize int, recordsProcessed int) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.batchesProcessed++
	pm.recordsProcessed += int64(recordsProcessed)

	// Update average batch size
	pm.avgBatchSize = float64(pm.recordsProcessed) / float64(pm.batchesProcessed)
}

// RecordMemoryUsage records current memory usage
func (pm *PerformanceMetrics) RecordMemoryUsage(currentUsage int64) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.currentMemoryUsage = currentUsage
	if currentUsage > pm.peakMemoryUsage {
		pm.peakMemoryUsage = currentUsage
	}
}

// RecordConcurrentOperations records current concurrent operations
func (pm *PerformanceMetrics) RecordConcurrentOperations(current int64) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.currentConcurrent = current
	if current > pm.peakConcurrent {
		pm.peakConcurrent = current
	}
}

// RecordAccuracy records training accuracy measurement
func (pm *PerformanceMetrics) RecordAccuracy(accuracy float64) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	// Keep only last 100 measurements for rolling average
	if len(pm.accuracyMeasurements) >= 100 {
		pm.accuracyMeasurements = pm.accuracyMeasurements[1:]
	}
	pm.accuracyMeasurements = append(pm.accuracyMeasurements, accuracy)

	// Calculate current accuracy (average of recent measurements)
	var total float64
	for _, acc := range pm.accuracyMeasurements {
		total += acc
	}
	if len(pm.accuracyMeasurements) > 0 {
		pm.currentAccuracy = total / float64(len(pm.accuracyMeasurements))
	}
}

// GetMetrics returns current performance metrics
func (pm *PerformanceMetrics) GetMetrics() TrainingPerformanceMetrics {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	uptime := time.Since(pm.startTime)
	
	// Calculate success rate
	successRate := float64(0)
	if pm.totalRequests > 0 {
		successRate = float64(pm.successfulRequests) / float64(pm.totalRequests) * 100.0
	}

	// Calculate error rate
	errorRate := float64(0)
	if pm.totalRequests > 0 {
		errorRate = float64(pm.failedRequests) / float64(pm.totalRequests) * 100.0
	}

	// Calculate Supabase error rate
	supabaseErrorRate := float64(0)
	totalSupabaseRequests := int64(len(pm.supabaseResponseTimes))
	if totalSupabaseRequests > 0 {
		supabaseErrorRate = float64(pm.supabaseErrors) / float64(totalSupabaseRequests) * 100.0
	}

	// Calculate requests per second
	requestsPerSecond := float64(0)
	if uptime.Seconds() > 0 {
		requestsPerSecond = float64(pm.totalRequests) / uptime.Seconds()
	}

	return TrainingPerformanceMetrics{
		// Request metrics
		TotalRequests:      pm.totalRequests,
		SuccessfulRequests: pm.successfulRequests,
		FailedRequests:     pm.failedRequests,
		SuccessRate:        successRate,
		ErrorRate:          errorRate,
		RequestsPerSecond:  requestsPerSecond,

		// Timing metrics
		AvgProcessingTime:  pm.avgProcessingTime,
		MinProcessingTime:  pm.minProcessingTime,
		MaxProcessingTime:  pm.maxProcessingTime,

		// Supabase metrics
		AvgSupabaseResponse: pm.avgSupabaseResponse,
		SupabaseErrors:      pm.supabaseErrors,
		SupabaseErrorRate:   supabaseErrorRate,

		// Batch metrics
		BatchesProcessed:   pm.batchesProcessed,
		RecordsProcessed:   pm.recordsProcessed,
		AvgBatchSize:       pm.avgBatchSize,

		// Memory metrics
		CurrentMemoryUsage: pm.currentMemoryUsage,
		PeakMemoryUsage:    pm.peakMemoryUsage,

		// Concurrency metrics
		CurrentConcurrent: pm.currentConcurrent,
		PeakConcurrent:    pm.peakConcurrent,

		// Accuracy metrics
		CurrentAccuracy: pm.currentAccuracy,
		TargetAccuracy:  pm.targetAccuracy,
		AccuracyTarget:  pm.currentAccuracy >= pm.targetAccuracy,

		// System metrics
		Uptime: uptime,
	}
}

// IsPerformingWell checks if the service is meeting performance targets
func (pm *PerformanceMetrics) IsPerformingWell() bool {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	// Check Phase 1 performance targets
	// Training Data Processing: 50-200ms per batch
	if pm.totalRequests > 0 && pm.avgProcessingTime > 200*time.Millisecond {
		return false
	}

	// Supabase Response Time: 10-30ms per query
	if len(pm.supabaseResponseTimes) > 0 && pm.avgSupabaseResponse > 30*time.Millisecond {
		return false
	}

	// Training Accuracy: 95%+ (only check if we have accuracy measurements)
	if len(pm.accuracyMeasurements) > 0 && pm.currentAccuracy < pm.targetAccuracy {
		return false
	}

	// Error Rate: <0.05%
	errorRate := float64(0)
	if pm.totalRequests > 0 {
		errorRate = float64(pm.failedRequests) / float64(pm.totalRequests) * 100.0
		if errorRate > 0.05 {
			return false
		}
	}

	return true
}

// Reset resets all metrics (useful for testing)
func (pm *PerformanceMetrics) Reset() {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.totalRequests = 0
	pm.successfulRequests = 0
	pm.failedRequests = 0
	pm.totalProcessingTime = 0
	pm.minProcessingTime = 0
	pm.maxProcessingTime = 0
	pm.avgProcessingTime = 0
	pm.supabaseResponseTimes = pm.supabaseResponseTimes[:0]
	pm.avgSupabaseResponse = 0
	pm.supabaseErrors = 0
	pm.batchesProcessed = 0
	pm.recordsProcessed = 0
	pm.avgBatchSize = 0
	pm.currentMemoryUsage = 0
	pm.peakMemoryUsage = 0
	pm.currentConcurrent = 0
	pm.peakConcurrent = 0
	pm.accuracyMeasurements = pm.accuracyMeasurements[:0]
	pm.currentAccuracy = 0
	pm.startTime = time.Now()
}

// TrainingPerformanceMetrics holds comprehensive performance metrics
type TrainingPerformanceMetrics struct {
	// Request metrics
	TotalRequests      int64   `json:"total_requests"`
	SuccessfulRequests int64   `json:"successful_requests"`
	FailedRequests     int64   `json:"failed_requests"`
	SuccessRate        float64 `json:"success_rate"`
	ErrorRate          float64 `json:"error_rate"`
	RequestsPerSecond  float64 `json:"requests_per_second"`

	// Timing metrics
	AvgProcessingTime  time.Duration `json:"avg_processing_time"`
	MinProcessingTime  time.Duration `json:"min_processing_time"`
	MaxProcessingTime  time.Duration `json:"max_processing_time"`

	// Supabase metrics
	AvgSupabaseResponse time.Duration `json:"avg_supabase_response"`
	SupabaseErrors      int64         `json:"supabase_errors"`
	SupabaseErrorRate   float64       `json:"supabase_error_rate"`

	// Batch metrics
	BatchesProcessed   int64   `json:"batches_processed"`
	RecordsProcessed   int64   `json:"records_processed"`
	AvgBatchSize       float64 `json:"avg_batch_size"`

	// Memory metrics
	CurrentMemoryUsage int64 `json:"current_memory_usage"`
	PeakMemoryUsage    int64 `json:"peak_memory_usage"`

	// Concurrency metrics
	CurrentConcurrent int64 `json:"current_concurrent"`
	PeakConcurrent    int64 `json:"peak_concurrent"`

	// Accuracy metrics
	CurrentAccuracy float64 `json:"current_accuracy"`
	TargetAccuracy  float64 `json:"target_accuracy"`
	AccuracyTarget  bool    `json:"accuracy_target_met"`

	// System metrics
	Uptime time.Duration `json:"uptime"`
}

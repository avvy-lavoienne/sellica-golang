package performance

import (
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// DefaultMetricsCollector implements MetricsCollector interface
type DefaultMetricsCollector struct {
	metrics map[string]*PoolMetrics
	mu      sync.RWMutex
	running bool
}

// PoolMetrics holds metrics for a processing pool
type PoolMetrics struct {
	PoolType           string        `json:"pool_type"`
	TotalRequests      int64         `json:"total_requests"`
	SuccessfulRequests int64         `json:"successful_requests"`
	FailedRequests     int64         `json:"failed_requests"`
	AverageResponseTime time.Duration `json:"average_response_time"`
	MinResponseTime    time.Duration `json:"min_response_time"`
	MaxResponseTime    time.Duration `json:"max_response_time"`
	ThroughputQPS      float64       `json:"throughput_qps"`
	ErrorRate          float64       `json:"error_rate"`
	LastUpdated        time.Time     `json:"last_updated"`
	
	// Response time history for trend analysis
	ResponseTimeHistory []time.Duration `json:"response_time_history"`
}

// NewMetricsCollector creates a new metrics collector
func NewMetricsCollector() MetricsCollector {
	return &DefaultMetricsCollector{
		metrics: make(map[string]*PoolMetrics),
	}
}

// RecordProcessing records processing metrics
func (dmc *DefaultMetricsCollector) RecordProcessing(poolType string, processingTime time.Duration, response *AIResponse) {
	dmc.mu.Lock()
	defer dmc.mu.Unlock()

	metrics, exists := dmc.metrics[poolType]
	if !exists {
		metrics = &PoolMetrics{
			PoolType:            poolType,
			MinResponseTime:     processingTime,
			MaxResponseTime:     processingTime,
			ResponseTimeHistory: make([]time.Duration, 0, 100),
		}
		dmc.metrics[poolType] = metrics
	}

	// Update counters
	metrics.TotalRequests++
	metrics.SuccessfulRequests++

	// Update response time metrics
	if processingTime < metrics.MinResponseTime {
		metrics.MinResponseTime = processingTime
	}
	if processingTime > metrics.MaxResponseTime {
		metrics.MaxResponseTime = processingTime
	}

	// Update response time history
	if len(metrics.ResponseTimeHistory) >= 100 {
		metrics.ResponseTimeHistory = metrics.ResponseTimeHistory[1:]
	}
	metrics.ResponseTimeHistory = append(metrics.ResponseTimeHistory, processingTime)

	// Calculate average response time
	if len(metrics.ResponseTimeHistory) > 0 {
		var total time.Duration
		for _, rt := range metrics.ResponseTimeHistory {
			total += rt
		}
		metrics.AverageResponseTime = total / time.Duration(len(metrics.ResponseTimeHistory))
	}

	// Calculate error rate
	if metrics.TotalRequests > 0 {
		metrics.ErrorRate = float64(metrics.FailedRequests) / float64(metrics.TotalRequests)
	}

	metrics.LastUpdated = time.Now()
}

// RecordError records error metrics
func (dmc *DefaultMetricsCollector) RecordError(poolType string, err error) {
	dmc.mu.Lock()
	defer dmc.mu.Unlock()

	metrics, exists := dmc.metrics[poolType]
	if !exists {
		metrics = &PoolMetrics{
			PoolType: poolType,
		}
		dmc.metrics[poolType] = metrics
	}

	metrics.TotalRequests++
	metrics.FailedRequests++

	// Calculate error rate
	if metrics.TotalRequests > 0 {
		metrics.ErrorRate = float64(metrics.FailedRequests) / float64(metrics.TotalRequests)
	}

	metrics.LastUpdated = time.Now()

	logrus.WithError(err).Warnf("Error recorded for pool %s", poolType)
}

// GetMetrics returns current metrics
func (dmc *DefaultMetricsCollector) GetMetrics() map[string]interface{} {
	dmc.mu.RLock()
	defer dmc.mu.RUnlock()

	result := make(map[string]interface{})
	for poolType, metrics := range dmc.metrics {
		result[poolType] = map[string]interface{}{
			"total_requests":       metrics.TotalRequests,
			"successful_requests":  metrics.SuccessfulRequests,
			"failed_requests":      metrics.FailedRequests,
			"average_response_time": metrics.AverageResponseTime.Milliseconds(),
			"min_response_time":    metrics.MinResponseTime.Milliseconds(),
			"max_response_time":    metrics.MaxResponseTime.Milliseconds(),
			"error_rate":           metrics.ErrorRate,
			"last_updated":         metrics.LastUpdated,
		}
	}

	return result
}

// Start starts metrics collection
func (dmc *DefaultMetricsCollector) Start() {
	dmc.mu.Lock()
	defer dmc.mu.Unlock()
	
	dmc.running = true
	logrus.Info("📊 Metrics collector started")
}

// Stop stops metrics collection
func (dmc *DefaultMetricsCollector) Stop() {
	dmc.mu.Lock()
	defer dmc.mu.Unlock()
	
	dmc.running = false
	logrus.Info("📊 Metrics collector stopped")
}

// DefaultPerformanceOptimizer implements PerformanceOptimizer interface
type DefaultPerformanceOptimizer struct {
	optimizations []string
	mu            sync.RWMutex
	running       bool
}

// NewPerformanceOptimizer creates a new performance optimizer
func NewPerformanceOptimizer() PerformanceOptimizer {
	return &DefaultPerformanceOptimizer{
		optimizations: make([]string, 0),
	}
}

// OptimizeBasedOnMetrics optimizes based on performance metrics
func (dpo *DefaultPerformanceOptimizer) OptimizeBasedOnMetrics(poolType string, processingTime time.Duration, req *AIRequest) {
	dpo.mu.Lock()
	defer dpo.mu.Unlock()

	// Analyze performance and suggest optimizations
	if processingTime > 500*time.Millisecond {
		optimization := fmt.Sprintf("Pool %s: Consider increasing worker count or optimizing query processing (current: %v)", 
			poolType, processingTime)
		dpo.optimizations = append(dpo.optimizations, optimization)
	}

	if len(req.Query) > 1000 {
		optimization := fmt.Sprintf("Pool %s: Large query detected (%d chars), consider query optimization", 
			poolType, len(req.Query))
		dpo.optimizations = append(dpo.optimizations, optimization)
	}

	// Keep only recent optimizations
	if len(dpo.optimizations) > 50 {
		dpo.optimizations = dpo.optimizations[len(dpo.optimizations)-25:]
	}
}

// GetOptimizationRecommendations returns optimization recommendations
func (dpo *DefaultPerformanceOptimizer) GetOptimizationRecommendations() []string {
	dpo.mu.RLock()
	defer dpo.mu.RUnlock()

	// Return copy of optimizations
	result := make([]string, len(dpo.optimizations))
	copy(result, dpo.optimizations)
	return result
}

// Start starts performance optimization
func (dpo *DefaultPerformanceOptimizer) Start() {
	dpo.mu.Lock()
	defer dpo.mu.Unlock()
	
	dpo.running = true
	logrus.Info("⚡ Performance optimizer started")
}

// Stop stops performance optimization
func (dpo *DefaultPerformanceOptimizer) Stop() {
	dpo.mu.Lock()
	defer dpo.mu.Unlock()
	
	dpo.running = false
	logrus.Info("⚡ Performance optimizer stopped")
}

// DefaultResourceManager implements ResourceManager interface
type DefaultResourceManager struct {
	resourceLimits *ResourceLimitsConfig
	allocations    map[string]*ResourceAllocation
	mu             sync.RWMutex
}

// ResourceAllocation tracks resource allocation for a worker
type ResourceAllocation struct {
	WorkerID      string    `json:"worker_id"`
	MemoryMB      int       `json:"memory_mb"`
	CPUPercent    float64   `json:"cpu_percent"`
	ActiveReqs    int       `json:"active_reqs"`
	LastAllocated time.Time `json:"last_allocated"`
}

// NewResourceManager creates a new resource manager
func NewResourceManager(limits *ResourceLimitsConfig) ResourceManager {
	return &DefaultResourceManager{
		resourceLimits: limits,
		allocations:    make(map[string]*ResourceAllocation),
	}
}

// AllocateResources allocates resources for a worker
func (drm *DefaultResourceManager) AllocateResources(workerID string, req *AIRequest) error {
	drm.mu.Lock()
	defer drm.mu.Unlock()

	allocation, exists := drm.allocations[workerID]
	if !exists {
		allocation = &ResourceAllocation{
			WorkerID: workerID,
		}
		drm.allocations[workerID] = allocation
	}

	// Estimate resource requirements based on request
	estimatedMemory := drm.estimateMemoryRequirement(req)
	estimatedCPU := drm.estimateCPURequirement(req)

	// Check if allocation would exceed limits
	if allocation.MemoryMB+estimatedMemory > drm.resourceLimits.MaxMemoryMB {
		return fmt.Errorf("memory limit would be exceeded for worker %s", workerID)
	}

	if allocation.CPUPercent+estimatedCPU > drm.resourceLimits.MaxCPUPercent {
		return fmt.Errorf("CPU limit would be exceeded for worker %s", workerID)
	}

	// Allocate resources
	allocation.MemoryMB += estimatedMemory
	allocation.CPUPercent += estimatedCPU
	allocation.ActiveReqs++
	allocation.LastAllocated = time.Now()

	return nil
}

// ReleaseResources releases resources for a worker
func (drm *DefaultResourceManager) ReleaseResources(workerID string, req *AIRequest) error {
	drm.mu.Lock()
	defer drm.mu.Unlock()

	allocation, exists := drm.allocations[workerID]
	if !exists {
		return fmt.Errorf("no allocation found for worker %s", workerID)
	}

	// Estimate resources to release
	estimatedMemory := drm.estimateMemoryRequirement(req)
	estimatedCPU := drm.estimateCPURequirement(req)

	// Release resources
	allocation.MemoryMB -= estimatedMemory
	if allocation.MemoryMB < 0 {
		allocation.MemoryMB = 0
	}

	allocation.CPUPercent -= estimatedCPU
	if allocation.CPUPercent < 0 {
		allocation.CPUPercent = 0
	}

	allocation.ActiveReqs--
	if allocation.ActiveReqs < 0 {
		allocation.ActiveReqs = 0
	}

	return nil
}

// GetResourceUsage returns current resource usage
func (drm *DefaultResourceManager) GetResourceUsage() map[string]interface{} {
	drm.mu.RLock()
	defer drm.mu.RUnlock()

	totalMemory := 0
	totalCPU := 0.0
	totalReqs := 0

	for _, allocation := range drm.allocations {
		totalMemory += allocation.MemoryMB
		totalCPU += allocation.CPUPercent
		totalReqs += allocation.ActiveReqs
	}

	return map[string]interface{}{
		"total_memory_mb":    totalMemory,
		"total_cpu_percent":  totalCPU,
		"total_active_reqs":  totalReqs,
		"worker_count":       len(drm.allocations),
		"memory_utilization": float64(totalMemory) / float64(drm.resourceLimits.MaxMemoryMB),
		"cpu_utilization":    totalCPU / drm.resourceLimits.MaxCPUPercent,
	}
}

// GetMetrics returns resource metrics
func (drm *DefaultResourceManager) GetMetrics() map[string]interface{} {
	return drm.GetResourceUsage()
}

// estimateMemoryRequirement estimates memory requirement for a request
func (drm *DefaultResourceManager) estimateMemoryRequirement(req *AIRequest) int {
	// Simple estimation based on query length
	baseMemory := 10 // 10MB base
	queryMemory := len(req.Query) / 100 // 1MB per 100 characters
	
	contextMemory := 0
	if req.Context != nil {
		contextMemory = len(req.Context) * 2 // 2MB per context item
	}

	return baseMemory + queryMemory + contextMemory
}

// estimateCPURequirement estimates CPU requirement for a request
func (drm *DefaultResourceManager) estimateCPURequirement(req *AIRequest) float64 {
	// Simple estimation based on request complexity
	baseCPU := 5.0 // 5% base CPU
	
	if len(req.Query) > 500 {
		baseCPU += 10.0 // Additional 10% for long queries
	}
	
	if len(req.Context) > 5 {
		baseCPU += 5.0 // Additional 5% for complex context
	}

	switch req.Priority {
	case PriorityCritical:
		baseCPU += 15.0
	case PriorityHigh:
		baseCPU += 10.0
	case PriorityNormal:
		baseCPU += 5.0
	}

	return baseCPU
}

package rag

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// DynamicWorkerPool manages auto-scaling worker pools for vector search operations
type DynamicWorkerPool struct {
	// Worker management
	workers    []*VectorWorker
	taskQueue  chan *VectorSearchTask
	resultPool sync.Pool
	hnswIndex  *HNSWIndex // HNSW index for vector operations

	// Scaling configuration
	config *DynamicPoolConfig

	// Current state
	currentWorkers int32 // Atomic counter for thread-safe access
	isRunning      bool
	stopChan       chan struct{}
	wg             sync.WaitGroup
	mutex          sync.RWMutex

	// Auto-scaling components
	autoScaler *AutoScaler
	metrics    *PoolMetrics

	// Performance tracking
	totalTasks     int64
	completedTasks int64
	failedTasks    int64

	// Memory monitoring
	memoryMonitor *MemoryMonitor
}

// DynamicPoolConfig holds configuration for dynamic worker pool
type DynamicPoolConfig struct {
	// Worker limits
	MinWorkers     int `json:"min_workers"`     // Minimum number of workers (default: 4)
	MaxWorkers     int `json:"max_workers"`     // Maximum number of workers (default: 64)
	InitialWorkers int `json:"initial_workers"` // Initial number of workers (default: 8)

	// Scaling thresholds
	ScaleUpQueueThreshold   float64       `json:"scale_up_queue_threshold"`   // Queue utilization % to scale up (default: 0.7)
	ScaleDownQueueThreshold float64       `json:"scale_down_queue_threshold"` // Queue utilization % to scale down (default: 0.3)
	ScaleUpResponseTime     time.Duration `json:"scale_up_response_time"`     // Response time threshold to scale up (default: 100ms)
	ScaleDownResponseTime   time.Duration `json:"scale_down_response_time"`   // Response time threshold to scale down (default: 50ms)

	// Scaling behavior
	ScaleUpFactor   float64       `json:"scale_up_factor"`   // Factor to multiply workers when scaling up (default: 1.5)
	ScaleDownFactor float64       `json:"scale_down_factor"` // Factor to multiply workers when scaling down (default: 0.7)
	CooldownPeriod  time.Duration `json:"cooldown_period"`   // Minimum time between scaling operations (default: 30s)

	// Queue configuration
	QueueSize   int           `json:"queue_size"`   // Task queue buffer size (default: 1000)
	TaskTimeout time.Duration `json:"task_timeout"` // Individual task timeout (default: 5s)

	// Monitoring
	MetricsInterval time.Duration `json:"metrics_interval"` // Metrics collection interval (default: 10s)
}

// AutoScaler handles automatic scaling decisions
type AutoScaler struct {
	pool   *DynamicWorkerPool
	config *DynamicPoolConfig

	// Scaling state
	lastScaleTime time.Time
	scalingActive bool
	scalingMutex  sync.RWMutex

	// Decision tracking
	scaleUpCount   int64
	scaleDownCount int64

	// Monitoring
	ticker   *time.Ticker
	stopChan chan struct{}
}

// PoolMetrics tracks performance metrics for scaling decisions
type PoolMetrics struct {
	// Response time tracking
	responseTimes  []time.Duration
	responseTimeMu sync.RWMutex

	// Queue metrics
	queueUtilization   float64
	queueUtilizationMu sync.RWMutex

	// Throughput metrics
	tasksPerSecond float64
	throughputMu   sync.RWMutex

	// Worker efficiency
	workerEfficiency float64
	efficiencyMu     sync.RWMutex

	// Historical data
	metricsHistory []MetricsSnapshot
	historyMu      sync.RWMutex

	// Scaling events
	scalingEvents   []ScalingEvent
	scalingEventsMu sync.RWMutex

	// Collection control
	collecting       bool
	collectionTicker *time.Ticker
	collectionMutex  sync.RWMutex
	stopCollection   chan struct{}

	// Performance counters
	totalResponsesRecorded int64
}

// MetricsSnapshot represents a point-in-time metrics snapshot
type MetricsSnapshot struct {
	Timestamp        time.Time     `json:"timestamp"`
	WorkerCount      int           `json:"worker_count"`
	QueueUtilization float64       `json:"queue_utilization"`
	AvgResponseTime  time.Duration `json:"avg_response_time"`
	TasksPerSecond   float64       `json:"tasks_per_second"`
	WorkerEfficiency float64       `json:"worker_efficiency"`
}

// ScalingEvent represents a scaling operation
type ScalingEvent struct {
	Timestamp    time.Time     `json:"timestamp"`
	EventType    string        `json:"event_type"` // "scale_up" or "scale_down"
	OldWorkers   int           `json:"old_workers"`
	NewWorkers   int           `json:"new_workers"`
	Trigger      string        `json:"trigger"` // "queue_utilization", "response_time", "manual"
	TriggerValue float64       `json:"trigger_value"`
	Success      bool          `json:"success"`
	Duration     time.Duration `json:"duration"`
}

// NewDynamicWorkerPool creates a new dynamic worker pool
func NewDynamicWorkerPool(hnswIndex *HNSWIndex, config *DynamicPoolConfig) *DynamicWorkerPool {
	if config == nil {
		config = &DynamicPoolConfig{
			MinWorkers:              4,
			MaxWorkers:              64,
			InitialWorkers:          8,
			ScaleUpQueueThreshold:   0.7,
			ScaleDownQueueThreshold: 0.3,
			ScaleUpResponseTime:     100 * time.Millisecond,
			ScaleDownResponseTime:   50 * time.Millisecond,
			ScaleUpFactor:           1.5,
			ScaleDownFactor:         0.7,
			CooldownPeriod:          30 * time.Second,
			QueueSize:               1000,
			TaskTimeout:             5 * time.Second,
			MetricsInterval:         10 * time.Second,
		}
	}

	pool := &DynamicWorkerPool{
		workers:        make([]*VectorWorker, 0, config.MaxWorkers),
		taskQueue:      make(chan *VectorSearchTask, config.QueueSize),
		hnswIndex:      hnswIndex,
		config:         config,
		currentWorkers: int32(config.InitialWorkers),
		stopChan:       make(chan struct{}),
		metrics:        NewPoolMetrics(),
	}

	// Initialize result pool
	pool.resultPool.New = func() interface{} {
		return &VectorSearchTaskResult{}
	}

	// Initialize auto-scaler
	pool.autoScaler = NewAutoScaler(pool, config)

	// Initialize memory monitoring
	pool.memoryMonitor = NewMemoryMonitor()
	pool.memoryMonitor.StartMonitoring(60 * time.Second)

	// Start with initial workers (but don't start them yet - they'll be started when Start() is called)
	// Just set the target count for now
	atomic.StoreInt32(&pool.currentWorkers, 0) // Reset to 0, will be set properly in Start()

	logrus.WithFields(logrus.Fields{
		"min_workers":     config.MinWorkers,
		"max_workers":     config.MaxWorkers,
		"initial_workers": config.InitialWorkers,
		"queue_size":      config.QueueSize,
	}).Info("🚀 Dynamic worker pool initialized")

	return pool
}

// Start starts the dynamic worker pool and auto-scaling
func (dwp *DynamicWorkerPool) Start() error {
	dwp.mutex.Lock()
	defer dwp.mutex.Unlock()

	if dwp.isRunning {
		return fmt.Errorf("dynamic worker pool is already running")
	}

	dwp.isRunning = true

	// Initialize workers to the configured initial count
	if err := dwp.scaleToWorkerCount(dwp.config.InitialWorkers, "initialization"); err != nil {
		dwp.isRunning = false
		return fmt.Errorf("failed to initialize workers: %w", err)
	}

	// Start auto-scaler
	if err := dwp.autoScaler.Start(); err != nil {
		dwp.isRunning = false
		return fmt.Errorf("failed to start auto-scaler: %w", err)
	}

	// Start metrics collection
	dwp.metrics.StartCollection(dwp.config.MetricsInterval)

	logrus.WithField("workers", atomic.LoadInt32(&dwp.currentWorkers)).Info("🔧 Dynamic worker pool started")
	return nil
}

// Stop stops the dynamic worker pool and all workers
func (dwp *DynamicWorkerPool) Stop() error {
	dwp.mutex.Lock()
	defer dwp.mutex.Unlock()

	if !dwp.isRunning {
		return nil
	}

	logrus.Info("🔒 Stopping dynamic worker pool...")

	// Stop auto-scaler
	dwp.autoScaler.Stop()

	// Stop metrics collection
	dwp.metrics.StopCollection()

	// Stop memory monitoring
	if dwp.memoryMonitor != nil {
		dwp.memoryMonitor.StopMonitoring()
	}

	// Signal all workers to stop
	close(dwp.stopChan)

	// Wait for all workers to finish
	dwp.wg.Wait()

	// Close task queue
	close(dwp.taskQueue)

	// Clear workers
	dwp.workers = dwp.workers[:0]
	atomic.StoreInt32(&dwp.currentWorkers, 0)

	dwp.isRunning = false

	logrus.Info("🔒 Dynamic worker pool stopped")
	return nil
}

// SubmitTask submits a task to the worker pool
func (dwp *DynamicWorkerPool) SubmitTask(task *VectorSearchTask) error {
	if !dwp.isRunning {
		return fmt.Errorf("worker pool is not running")
	}

	// Record task submission
	atomic.AddInt64(&dwp.totalTasks, 1)

	// Update queue utilization metrics
	queueUtilization := float64(len(dwp.taskQueue)) / float64(cap(dwp.taskQueue))
	dwp.metrics.UpdateQueueUtilization(queueUtilization)

	// Submit task with timeout
	select {
	case dwp.taskQueue <- task:
		return nil
	case <-time.After(dwp.config.TaskTimeout):
		atomic.AddInt64(&dwp.failedTasks, 1)
		return fmt.Errorf("task submission timeout after %v", dwp.config.TaskTimeout)
	}
}

// scaleToWorkerCount scales the worker pool to the specified number of workers
func (dwp *DynamicWorkerPool) scaleToWorkerCount(targetWorkers int, trigger string) error {
	currentWorkers := int(atomic.LoadInt32(&dwp.currentWorkers))

	if targetWorkers == currentWorkers {
		return nil // No scaling needed
	}

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"current_workers": currentWorkers,
		"target_workers":  targetWorkers,
		"trigger":         trigger,
	}).Info("🔄 Scaling worker pool")

	var err error
	if targetWorkers > currentWorkers {
		err = dwp.scaleUp(targetWorkers - currentWorkers)
	} else {
		err = dwp.scaleDown(currentWorkers - targetWorkers)
	}

	duration := time.Since(startTime)

	// Record scaling event
	event := ScalingEvent{
		Timestamp:  time.Now(),
		EventType:  map[bool]string{true: "scale_up", false: "scale_down"}[targetWorkers > currentWorkers],
		OldWorkers: currentWorkers,
		NewWorkers: int(atomic.LoadInt32(&dwp.currentWorkers)),
		Trigger:    trigger,
		Success:    err == nil,
		Duration:   duration,
	}

	dwp.metrics.RecordScalingEvent(event)

	if err != nil {
		logrus.WithError(err).Error("❌ Worker pool scaling failed")
		return err
	}

	logrus.WithFields(logrus.Fields{
		"old_workers": currentWorkers,
		"new_workers": atomic.LoadInt32(&dwp.currentWorkers),
		"duration":    duration,
	}).Info("✅ Worker pool scaling completed")

	return nil
}

// scaleUp adds new workers to the pool
func (dwp *DynamicWorkerPool) scaleUp(additionalWorkers int) error {
	for i := 0; i < additionalWorkers; i++ {
		workerID := len(dwp.workers)
		worker := &VectorWorker{
			id:        workerID,
			hnswIndex: dwp.hnswIndex, // Add HNSW index reference
			taskQueue: dwp.taskQueue,
			stopChan:  dwp.stopChan,
		}

		dwp.workers = append(dwp.workers, worker)

		dwp.wg.Add(1)
		go worker.run(&dwp.wg, dwp.metrics)

		atomic.AddInt32(&dwp.currentWorkers, 1)

		logrus.WithField("worker_id", workerID).Debug("➕ Worker added to pool")
	}

	return nil
}

// scaleDown removes workers from the pool
func (dwp *DynamicWorkerPool) scaleDown(workersToRemove int) error {
	currentCount := int(atomic.LoadInt32(&dwp.currentWorkers))
	targetCount := currentCount - workersToRemove

	if targetCount < dwp.config.MinWorkers {
		targetCount = dwp.config.MinWorkers
		workersToRemove = currentCount - targetCount
	}

	// Workers will naturally stop when they finish their current tasks
	// and see the stop signal or reduced worker count
	for i := 0; i < workersToRemove; i++ {
		if len(dwp.workers) > 0 {
			// Remove worker from slice (worker will stop naturally)
			dwp.workers = dwp.workers[:len(dwp.workers)-1]
			atomic.AddInt32(&dwp.currentWorkers, -1)

			logrus.Debug("➖ Worker removed from pool")
		}
	}

	return nil
}

// GetStats returns current pool statistics
func (dwp *DynamicWorkerPool) GetStats() map[string]interface{} {
	currentWorkers := atomic.LoadInt32(&dwp.currentWorkers)
	totalTasks := atomic.LoadInt64(&dwp.totalTasks)
	completedTasks := atomic.LoadInt64(&dwp.completedTasks)
	failedTasks := atomic.LoadInt64(&dwp.failedTasks)

	queueUtilization := float64(len(dwp.taskQueue)) / float64(cap(dwp.taskQueue))

	stats := map[string]interface{}{
		"current_workers":   currentWorkers,
		"min_workers":       dwp.config.MinWorkers,
		"max_workers":       dwp.config.MaxWorkers,
		"queue_size":        len(dwp.taskQueue),
		"queue_capacity":    cap(dwp.taskQueue),
		"queue_utilization": queueUtilization,
		"total_tasks":       totalTasks,
		"completed_tasks":   completedTasks,
		"failed_tasks":      failedTasks,
		"is_running":        dwp.isRunning,
	}

	// Add metrics stats
	if dwp.metrics != nil {
		metricsStats := dwp.metrics.GetStats()
		for k, v := range metricsStats {
			stats["metrics_"+k] = v
		}
	}

	// Add auto-scaler stats
	if dwp.autoScaler != nil {
		scalerStats := dwp.autoScaler.GetStats()
		for k, v := range scalerStats {
			stats["scaler_"+k] = v
		}
	}

	return stats
}

// GetCurrentWorkerCount returns the current number of workers
func (dwp *DynamicWorkerPool) GetCurrentWorkerCount() int {
	return int(atomic.LoadInt32(&dwp.currentWorkers))
}

// GetQueueUtilization returns the current queue utilization percentage
func (dwp *DynamicWorkerPool) GetQueueUtilization() float64 {
	return float64(len(dwp.taskQueue)) / float64(cap(dwp.taskQueue))
}

// IsRunning returns whether the pool is currently running
func (dwp *DynamicWorkerPool) IsRunning() bool {
	dwp.mutex.RLock()
	defer dwp.mutex.RUnlock()
	return dwp.isRunning
}

// NewAutoScaler creates a new auto-scaler
func NewAutoScaler(pool *DynamicWorkerPool, config *DynamicPoolConfig) *AutoScaler {
	return &AutoScaler{
		pool:          pool,
		config:        config,
		lastScaleTime: time.Now(),
		stopChan:      make(chan struct{}),
	}
}

// Start starts the auto-scaling monitoring
func (as *AutoScaler) Start() error {
	as.scalingMutex.Lock()
	defer as.scalingMutex.Unlock()

	if as.scalingActive {
		return fmt.Errorf("auto-scaler is already running")
	}

	as.scalingActive = true
	as.ticker = time.NewTicker(as.config.MetricsInterval)

	go as.scalingLoop()

	logrus.WithField("interval", as.config.MetricsInterval).Info("🤖 Auto-scaler started")
	return nil
}

// Stop stops the auto-scaling monitoring
func (as *AutoScaler) Stop() {
	as.scalingMutex.Lock()
	defer as.scalingMutex.Unlock()

	if !as.scalingActive {
		return
	}

	as.scalingActive = false
	close(as.stopChan)

	if as.ticker != nil {
		as.ticker.Stop()
	}

	logrus.Info("🔒 Auto-scaler stopped")
}

// scalingLoop runs the main auto-scaling logic
func (as *AutoScaler) scalingLoop() {
	for {
		select {
		case <-as.ticker.C:
			as.evaluateScaling()
		case <-as.stopChan:
			return
		}
	}
}

// evaluateScaling evaluates whether scaling is needed
func (as *AutoScaler) evaluateScaling() {
	// Check cooldown period
	if time.Since(as.lastScaleTime) < as.config.CooldownPeriod {
		return
	}

	// Get current metrics
	queueUtilization := as.pool.GetQueueUtilization()
	avgResponseTime := as.pool.metrics.GetAverageResponseTime()
	currentWorkers := as.pool.GetCurrentWorkerCount()

	// Determine scaling action
	scaleUp := as.shouldScaleUp(queueUtilization, avgResponseTime, currentWorkers)
	scaleDown := as.shouldScaleDown(queueUtilization, avgResponseTime, currentWorkers)

	if scaleUp {
		targetWorkers := as.calculateScaleUpTarget(currentWorkers)
		if targetWorkers > currentWorkers && targetWorkers <= as.config.MaxWorkers {
			as.executeScaling(targetWorkers, "queue_utilization_high")
			atomic.AddInt64(&as.scaleUpCount, 1)
		}
	} else if scaleDown {
		targetWorkers := as.calculateScaleDownTarget(currentWorkers)
		if targetWorkers < currentWorkers && targetWorkers >= as.config.MinWorkers {
			as.executeScaling(targetWorkers, "queue_utilization_low")
			atomic.AddInt64(&as.scaleDownCount, 1)
		}
	}
}

// shouldScaleUp determines if scaling up is needed
func (as *AutoScaler) shouldScaleUp(queueUtilization float64, avgResponseTime time.Duration, currentWorkers int) bool {
	// Scale up if queue utilization is high
	if queueUtilization > as.config.ScaleUpQueueThreshold {
		logrus.WithFields(logrus.Fields{
			"queue_utilization": queueUtilization,
			"threshold":         as.config.ScaleUpQueueThreshold,
		}).Debug("Scale up triggered by queue utilization")
		return true
	}

	// Scale up if response time is high
	if avgResponseTime > as.config.ScaleUpResponseTime {
		logrus.WithFields(logrus.Fields{
			"avg_response_time": avgResponseTime,
			"threshold":         as.config.ScaleUpResponseTime,
		}).Debug("Scale up triggered by response time")
		return true
	}

	// Scale up if we're at minimum workers and have any queue pressure
	if currentWorkers == as.config.MinWorkers && queueUtilization > 0.1 {
		logrus.Debug("Scale up triggered by minimum workers with queue pressure")
		return true
	}

	return false
}

// shouldScaleDown determines if scaling down is needed
func (as *AutoScaler) shouldScaleDown(queueUtilization float64, avgResponseTime time.Duration, currentWorkers int) bool {
	// Don't scale down if we're at minimum
	if currentWorkers <= as.config.MinWorkers {
		return false
	}

	// Scale down if queue utilization is low AND response time is good
	if queueUtilization < as.config.ScaleDownQueueThreshold &&
		avgResponseTime < as.config.ScaleDownResponseTime {
		logrus.WithFields(logrus.Fields{
			"queue_utilization": queueUtilization,
			"avg_response_time": avgResponseTime,
			"queue_threshold":   as.config.ScaleDownQueueThreshold,
			"time_threshold":    as.config.ScaleDownResponseTime,
		}).Debug("Scale down triggered by low utilization and good response time")
		return true
	}

	return false
}

// calculateScaleUpTarget calculates the target worker count for scaling up
func (as *AutoScaler) calculateScaleUpTarget(currentWorkers int) int {
	target := int(float64(currentWorkers) * as.config.ScaleUpFactor)
	if target <= currentWorkers {
		target = currentWorkers + 1 // Ensure at least 1 worker is added
	}
	if target > as.config.MaxWorkers {
		target = as.config.MaxWorkers
	}
	return target
}

// calculateScaleDownTarget calculates the target worker count for scaling down
func (as *AutoScaler) calculateScaleDownTarget(currentWorkers int) int {
	target := int(float64(currentWorkers) * as.config.ScaleDownFactor)
	if target >= currentWorkers {
		target = currentWorkers - 1 // Ensure at least 1 worker is removed
	}
	if target < as.config.MinWorkers {
		target = as.config.MinWorkers
	}
	return target
}

// executeScaling executes the scaling operation
func (as *AutoScaler) executeScaling(targetWorkers int, trigger string) {
	as.lastScaleTime = time.Now()

	if err := as.pool.scaleToWorkerCount(targetWorkers, trigger); err != nil {
		logrus.WithError(err).Error("Failed to execute scaling")
	}
}

// GetStats returns auto-scaler statistics
func (as *AutoScaler) GetStats() map[string]interface{} {
	return map[string]interface{}{
		"scaling_active":   as.scalingActive,
		"last_scale_time":  as.lastScaleTime,
		"scale_up_count":   atomic.LoadInt64(&as.scaleUpCount),
		"scale_down_count": atomic.LoadInt64(&as.scaleDownCount),
		"cooldown_period":  as.config.CooldownPeriod,
	}
}

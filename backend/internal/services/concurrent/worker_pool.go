package concurrent

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// WorkerPool manages a pool of workers for concurrent task processing
type WorkerPool struct {
	workers     int
	taskQueue   chan func()
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
	metrics     *WorkerMetrics
	isRunning   int32
	mu          sync.RWMutex
}

// WorkerMetrics tracks worker pool performance
type WorkerMetrics struct {
	ActiveWorkers     int64     `json:"activeWorkers"`
	QueuedTasks       int64     `json:"queuedTasks"`
	CompletedTasks    int64     `json:"completedTasks"`
	FailedTasks       int64     `json:"failedTasks"`
	AverageTaskTime   float64   `json:"averageTaskTime"`
	TotalTaskTime     int64     `json:"totalTaskTime"`
	PeakQueueSize     int64     `json:"peakQueueSize"`
	WorkerUtilization float64   `json:"workerUtilization"`
	LastUpdated       time.Time `json:"lastUpdated"`
	mu                sync.RWMutex
}

// WorkerPoolConfig holds configuration for worker pool
type WorkerPoolConfig struct {
	Workers       int           `json:"workers"`
	QueueSize     int           `json:"queueSize"`
	TaskTimeout   time.Duration `json:"taskTimeout"`
	EnableMetrics bool          `json:"enableMetrics"`
}

// NewWorkerPool creates a new worker pool with specified configuration
func NewWorkerPool(config WorkerPoolConfig) *WorkerPool {
	if config.Workers <= 0 {
		config.Workers = 10 // Default worker count
	}
	if config.QueueSize <= 0 {
		config.QueueSize = config.Workers * 2 // Default queue size
	}
	if config.TaskTimeout <= 0 {
		config.TaskTimeout = 30 * time.Second // Default timeout
	}

	ctx, cancel := context.WithCancel(context.Background())
	
	wp := &WorkerPool{
		workers:   config.Workers,
		taskQueue: make(chan func(), config.QueueSize),
		ctx:       ctx,
		cancel:    cancel,
		metrics: &WorkerMetrics{
			LastUpdated: time.Now(),
		},
	}

	logrus.WithFields(logrus.Fields{
		"workers":    config.Workers,
		"queue_size": config.QueueSize,
		"timeout":    config.TaskTimeout,
	}).Info("🏭 Worker pool created")

	return wp
}

// Start initializes and starts all workers
func (wp *WorkerPool) Start() error {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	if atomic.LoadInt32(&wp.isRunning) == 1 {
		return fmt.Errorf("worker pool is already running")
	}

	// Start workers
	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}

	atomic.StoreInt32(&wp.isRunning, 1)
	
	logrus.WithField("workers", wp.workers).Info("🚀 Worker pool started")
	return nil
}

// Stop gracefully shuts down the worker pool
func (wp *WorkerPool) Stop() error {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	if atomic.LoadInt32(&wp.isRunning) == 0 {
		return fmt.Errorf("worker pool is not running")
	}

	logrus.Info("🛑 Stopping worker pool...")
	
	// Cancel context to signal workers to stop
	wp.cancel()
	
	// Close task queue to prevent new tasks
	close(wp.taskQueue)
	
	// Wait for all workers to finish
	wp.wg.Wait()
	
	atomic.StoreInt32(&wp.isRunning, 0)
	
	logrus.Info("✅ Worker pool stopped")
	return nil
}

// Submit submits a task to the worker pool
func (wp *WorkerPool) Submit(task func()) error {
	if atomic.LoadInt32(&wp.isRunning) == 0 {
		return fmt.Errorf("worker pool is not running")
	}

	select {
	case wp.taskQueue <- task:
		// Update metrics
		wp.updateQueueMetrics(1)
		return nil
	case <-wp.ctx.Done():
		return fmt.Errorf("worker pool is shutting down")
	default:
		// Queue is full, reject task
		wp.incrementFailedTasks()
		return fmt.Errorf("task queue is full")
	}
}

// SubmitWithTimeout submits a task with a timeout
func (wp *WorkerPool) SubmitWithTimeout(task func(), timeout time.Duration) error {
	if atomic.LoadInt32(&wp.isRunning) == 0 {
		return fmt.Errorf("worker pool is not running")
	}

	ctx, cancel := context.WithTimeout(wp.ctx, timeout)
	defer cancel()

	select {
	case wp.taskQueue <- task:
		wp.updateQueueMetrics(1)
		return nil
	case <-ctx.Done():
		wp.incrementFailedTasks()
		return fmt.Errorf("task submission timeout")
	}
}

// worker is the main worker goroutine
func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()
	
	logrus.WithField("worker_id", id).Debug("🔧 Worker started")
	
	for {
		select {
		case task, ok := <-wp.taskQueue:
			if !ok {
				// Channel closed, worker should exit
				logrus.WithField("worker_id", id).Debug("🔧 Worker stopped")
				return
			}
			
			// Execute task with metrics
			wp.executeTask(task, id)
			
		case <-wp.ctx.Done():
			// Context cancelled, worker should exit
			logrus.WithField("worker_id", id).Debug("🔧 Worker cancelled")
			return
		}
	}
}

// executeTask executes a task with timing and error handling
func (wp *WorkerPool) executeTask(task func(), workerID int) {
	startTime := time.Now()
	
	// Update active workers count
	atomic.AddInt64(&wp.metrics.ActiveWorkers, 1)
	defer atomic.AddInt64(&wp.metrics.ActiveWorkers, -1)
	
	// Update queue metrics
	wp.updateQueueMetrics(-1)
	
	// Execute task with panic recovery
	func() {
		defer func() {
			if r := recover(); r != nil {
				logrus.WithFields(logrus.Fields{
					"worker_id": workerID,
					"panic":     r,
				}).Error("🚨 Task panicked")
				wp.incrementFailedTasks()
			}
		}()
		
		task()
	}()
	
	// Update metrics
	duration := time.Since(startTime)
	wp.updateTaskMetrics(duration, true)
	
	logrus.WithFields(logrus.Fields{
		"worker_id": workerID,
		"duration":  duration.Milliseconds(),
	}).Debug("✅ Task completed")
}

// GetMetrics returns current worker pool metrics
func (wp *WorkerPool) GetMetrics() *WorkerMetrics {
	wp.metrics.mu.RLock()
	defer wp.metrics.mu.RUnlock()
	
	// Create a copy to avoid race conditions (without copying the mutex)
	metrics := WorkerMetrics{
		ActiveWorkers:     wp.metrics.ActiveWorkers,
		QueuedTasks:       int64(len(wp.taskQueue)),
		CompletedTasks:    wp.metrics.CompletedTasks,
		FailedTasks:       wp.metrics.FailedTasks,
		AverageTaskTime:   wp.metrics.AverageTaskTime,
		TotalTaskTime:     wp.metrics.TotalTaskTime,
		PeakQueueSize:     wp.metrics.PeakQueueSize,
		WorkerUtilization: float64(wp.metrics.ActiveWorkers) / float64(wp.workers) * 100,
		LastUpdated:       time.Now(),
	}
	
	return &metrics
}

// IsRunning returns whether the worker pool is currently running
func (wp *WorkerPool) IsRunning() bool {
	return atomic.LoadInt32(&wp.isRunning) == 1
}

// GetStatus returns the current status of the worker pool
func (wp *WorkerPool) GetStatus() map[string]interface{} {
	metrics := wp.GetMetrics()
	
	return map[string]interface{}{
		"running":            wp.IsRunning(),
		"workers":            wp.workers,
		"active_workers":     metrics.ActiveWorkers,
		"queued_tasks":       metrics.QueuedTasks,
		"completed_tasks":    metrics.CompletedTasks,
		"failed_tasks":       metrics.FailedTasks,
		"average_task_time":  metrics.AverageTaskTime,
		"worker_utilization": metrics.WorkerUtilization,
		"peak_queue_size":    metrics.PeakQueueSize,
		"last_updated":       metrics.LastUpdated,
	}
}

// updateQueueMetrics updates queue-related metrics
func (wp *WorkerPool) updateQueueMetrics(delta int64) {
	wp.metrics.mu.Lock()
	defer wp.metrics.mu.Unlock()
	
	wp.metrics.QueuedTasks += delta
	if wp.metrics.QueuedTasks > wp.metrics.PeakQueueSize {
		wp.metrics.PeakQueueSize = wp.metrics.QueuedTasks
	}
}

// updateTaskMetrics updates task completion metrics
func (wp *WorkerPool) updateTaskMetrics(duration time.Duration, success bool) {
	wp.metrics.mu.Lock()
	defer wp.metrics.mu.Unlock()
	
	if success {
		wp.metrics.CompletedTasks++
	} else {
		wp.metrics.FailedTasks++
	}
	
	// Update average task time
	wp.metrics.TotalTaskTime += duration.Nanoseconds()
	totalTasks := wp.metrics.CompletedTasks + wp.metrics.FailedTasks
	if totalTasks > 0 {
		wp.metrics.AverageTaskTime = float64(wp.metrics.TotalTaskTime) / float64(totalTasks) / 1e6 // Convert to milliseconds
	}
	
	wp.metrics.LastUpdated = time.Now()
}

// incrementFailedTasks increments the failed tasks counter
func (wp *WorkerPool) incrementFailedTasks() {
	wp.metrics.mu.Lock()
	defer wp.metrics.mu.Unlock()
	
	wp.metrics.FailedTasks++
	wp.metrics.LastUpdated = time.Now()
}

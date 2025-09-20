package concurrent

import (
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestWorkerPool_NewWorkerPool tests worker pool creation
func TestWorkerPool_NewWorkerPool(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   5,
		QueueSize: 10,
	}

	wp := NewWorkerPool(config)
	assert.NotNil(t, wp)
	assert.Equal(t, 5, wp.workers)
	assert.Equal(t, 10, cap(wp.taskQueue))
	assert.False(t, wp.IsRunning())
}

// TestWorkerPool_StartStop tests worker pool lifecycle
func TestWorkerPool_StartStop(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   3,
		QueueSize: 5,
	}

	wp := NewWorkerPool(config)

	// Test start
	err := wp.Start()
	assert.NoError(t, err)
	assert.True(t, wp.IsRunning())

	// Test double start (should fail)
	err = wp.Start()
	assert.Error(t, err)

	// Test stop
	err = wp.Stop()
	assert.NoError(t, err)
	assert.False(t, wp.IsRunning())

	// Test double stop (should fail)
	err = wp.Stop()
	assert.Error(t, err)
}

// TestWorkerPool_TaskExecution tests task execution
func TestWorkerPool_TaskExecution(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   2,
		QueueSize: 5,
	}

	wp := NewWorkerPool(config)
	err := wp.Start()
	require.NoError(t, err)
	defer wp.Stop()

	// Test task execution
	var counter int64
	var wg sync.WaitGroup

	for i := 0; i < 10; i++ {
		wg.Add(1)
		err := wp.Submit(func() {
			atomic.AddInt64(&counter, 1)
			wg.Done()
		})
		assert.NoError(t, err)
	}

	// Wait for all tasks to complete
	wg.Wait()

	assert.Equal(t, int64(10), atomic.LoadInt64(&counter))
}

// TestWorkerPool_TaskTimeout tests task submission with timeout
func TestWorkerPool_TaskTimeout(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   1,
		QueueSize: 1,
	}

	wp := NewWorkerPool(config)
	err := wp.Start()
	require.NoError(t, err)
	defer wp.Stop()

	// Fill the queue
	err = wp.Submit(func() {
		time.Sleep(100 * time.Millisecond)
	})
	assert.NoError(t, err)

	// This should succeed with timeout
	err = wp.SubmitWithTimeout(func() {
		// Task
	}, 200*time.Millisecond)
	assert.NoError(t, err)

	// This should timeout
	err = wp.SubmitWithTimeout(func() {
		// Task
	}, 10*time.Millisecond)
	assert.Error(t, err)
}

// TestWorkerPool_QueueFull tests queue overflow handling
func TestWorkerPool_QueueFull(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   1,
		QueueSize: 2,
	}

	wp := NewWorkerPool(config)
	err := wp.Start()
	require.NoError(t, err)
	defer wp.Stop()

	// Block the worker
	blockCh := make(chan struct{})
	err = wp.Submit(func() {
		<-blockCh
	})
	assert.NoError(t, err)

	// Fill the queue
	err = wp.Submit(func() {})
	assert.NoError(t, err)

	err = wp.Submit(func() {})
	assert.NoError(t, err)

	// This should fail (queue full)
	err = wp.Submit(func() {})
	assert.Error(t, err)

	// Unblock
	close(blockCh)
}

// TestWorkerPool_PanicRecovery tests panic recovery in tasks
func TestWorkerPool_PanicRecovery(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   2,
		QueueSize: 5,
	}

	wp := NewWorkerPool(config)
	err := wp.Start()
	require.NoError(t, err)
	defer wp.Stop()

	var wg sync.WaitGroup
	var normalTaskExecuted int64

	// Submit a task that panics
	wg.Add(1)
	err = wp.Submit(func() {
		defer wg.Done()
		panic("test panic")
	})
	assert.NoError(t, err)

	// Submit a normal task
	wg.Add(1)
	err = wp.Submit(func() {
		defer wg.Done()
		atomic.AddInt64(&normalTaskExecuted, 1)
	})
	assert.NoError(t, err)

	wg.Wait()

	// Normal task should still execute despite panic
	assert.Equal(t, int64(1), atomic.LoadInt64(&normalTaskExecuted))

	// Check metrics for failed tasks
	metrics := wp.GetMetrics()
	assert.Greater(t, metrics.FailedTasks, int64(0))
}

// TestWorkerPool_Metrics tests metrics collection
func TestWorkerPool_Metrics(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   2,
		QueueSize: 5,
	}

	wp := NewWorkerPool(config)
	err := wp.Start()
	require.NoError(t, err)
	defer wp.Stop()

	var wg sync.WaitGroup

	// Submit some tasks
	for i := 0; i < 5; i++ {
		wg.Add(1)
		err := wp.Submit(func() {
			time.Sleep(10 * time.Millisecond)
			wg.Done()
		})
		assert.NoError(t, err)
	}

	wg.Wait()

	// Check metrics
	metrics := wp.GetMetrics()
	assert.Equal(t, int64(5), metrics.CompletedTasks)
	assert.Greater(t, metrics.AverageTaskTime, 0.0)
	assert.GreaterOrEqual(t, metrics.PeakQueueSize, int64(1))
}

// TestWorkerPool_Status tests status reporting
func TestWorkerPool_Status(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   3,
		QueueSize: 10,
	}

	wp := NewWorkerPool(config)

	// Test status before start
	status := wp.GetStatus()
	assert.False(t, status["running"].(bool))
	assert.Equal(t, 3, status["workers"].(int))

	// Start and test status
	err := wp.Start()
	require.NoError(t, err)
	defer wp.Stop()

	status = wp.GetStatus()
	assert.True(t, status["running"].(bool))
	assert.Contains(t, status, "completed_tasks")
	assert.Contains(t, status, "worker_utilization")
}

// TestWorkerPool_ConcurrentAccess tests concurrent access to worker pool
func TestWorkerPool_ConcurrentAccess(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   5,
		QueueSize: 20,
	}

	wp := NewWorkerPool(config)
	err := wp.Start()
	require.NoError(t, err)
	defer wp.Stop()

	var wg sync.WaitGroup
	var counter int64

	// Submit tasks from multiple goroutines
	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 10; j++ {
				wg.Add(1)
				err := wp.Submit(func() {
					atomic.AddInt64(&counter, 1)
					wg.Done()
				})
				if err != nil {
					wg.Done()
				}
			}
		}()
	}

	wg.Wait()

	// Should have executed most tasks (some might fail due to queue full)
	finalCounter := atomic.LoadInt64(&counter)
	assert.Greater(t, finalCounter, int64(50)) // At least 50% success rate
}

// TestWorkerPool_GracefulShutdown tests graceful shutdown
func TestWorkerPool_GracefulShutdown(t *testing.T) {
	config := WorkerPoolConfig{
		Workers:   2,
		QueueSize: 5,
	}

	wp := NewWorkerPool(config)
	err := wp.Start()
	require.NoError(t, err)

	var completedTasks int64

	// Submit long-running tasks
	for i := 0; i < 3; i++ {
		err := wp.Submit(func() {
			time.Sleep(50 * time.Millisecond)
			atomic.AddInt64(&completedTasks, 1)
		})
		assert.NoError(t, err)
	}

	// Stop should wait for tasks to complete
	err = wp.Stop()
	assert.NoError(t, err)

	// All tasks should have completed
	assert.Equal(t, int64(3), atomic.LoadInt64(&completedTasks))
}

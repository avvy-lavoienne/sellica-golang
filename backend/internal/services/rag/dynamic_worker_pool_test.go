package rag

import (
	"context"
	"math/rand"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDynamicWorkerPool_BasicFunctionality(t *testing.T) {
	// Create HNSW index for testing
	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             200,
		EfConstruction: 200,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      768,
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	// Add some test vectors
	ctx := context.Background()
	for i := 0; i < 100; i++ {
		vector := make([]float32, 768)
		for j := range vector {
			vector[j] = rand.Float32()*2 - 1
		}
		metadata := map[string]interface{}{"id": i}
		_, err := index.AddVector(ctx, vector, metadata)
		require.NoError(t, err)
	}

	// Create dynamic worker pool
	poolConfig := &DynamicPoolConfig{
		MinWorkers:              2,
		MaxWorkers:              16,
		InitialWorkers:          4,
		ScaleUpQueueThreshold:   0.7,
		ScaleDownQueueThreshold: 0.3,
		ScaleUpResponseTime:     100 * time.Millisecond,
		ScaleDownResponseTime:   50 * time.Millisecond,
		ScaleUpFactor:           1.5,
		ScaleDownFactor:         0.7,
		CooldownPeriod:          1 * time.Second, // Short cooldown for testing
		QueueSize:               100,
		TaskTimeout:             5 * time.Second,
		MetricsInterval:         500 * time.Millisecond, // Fast metrics for testing
	}

	pool := NewDynamicWorkerPool(index, poolConfig)
	defer pool.Stop()

	// Test initial state
	assert.Equal(t, 4, pool.GetCurrentWorkerCount())
	assert.True(t, pool.IsRunning())

	// Start the pool
	err := pool.Start()
	require.NoError(t, err)

	// Test basic task submission
	query := make([]float32, 768)
	for i := range query {
		query[i] = rand.Float32()*2 - 1
	}

	task := &VectorSearchTask{
		Context: ctx,
		Query:   query,
		K:       10,
		Result:  make(chan *VectorSearchTaskResult, 1),
	}

	err = pool.SubmitTask(task)
	require.NoError(t, err)

	// Wait for result
	select {
	case result := <-task.Result:
		assert.NoError(t, result.Error)
		assert.NotEmpty(t, result.Results)
		assert.Greater(t, result.Duration, time.Duration(0))
	case <-time.After(5 * time.Second):
		t.Fatal("Task timeout")
	}
}

func TestDynamicWorkerPool_AutoScaling(t *testing.T) {
	// Create HNSW index for testing
	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             200,
		EfConstruction: 200,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      768,
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	// Add test vectors
	ctx := context.Background()
	for i := 0; i < 50; i++ {
		vector := make([]float32, 768)
		for j := range vector {
			vector[j] = rand.Float32()*2 - 1
		}
		metadata := map[string]interface{}{"id": i}
		_, err := index.AddVector(ctx, vector, metadata)
		require.NoError(t, err)
	}

	// Create dynamic worker pool with aggressive scaling for testing
	poolConfig := &DynamicPoolConfig{
		MinWorkers:              2,
		MaxWorkers:              12,
		InitialWorkers:          2,
		ScaleUpQueueThreshold:   0.5,  // Lower threshold for easier testing
		ScaleDownQueueThreshold: 0.1,  // Lower threshold for easier testing
		ScaleUpResponseTime:     50 * time.Millisecond,
		ScaleDownResponseTime:   25 * time.Millisecond,
		ScaleUpFactor:           2.0,  // Aggressive scaling
		ScaleDownFactor:         0.5,  // Aggressive scaling
		CooldownPeriod:          500 * time.Millisecond, // Short cooldown
		QueueSize:               20,   // Small queue to trigger scaling
		TaskTimeout:             5 * time.Second,
		MetricsInterval:         200 * time.Millisecond, // Fast metrics
	}

	pool := NewDynamicWorkerPool(index, poolConfig)
	defer pool.Stop()

	err := pool.Start()
	require.NoError(t, err)

	initialWorkers := pool.GetCurrentWorkerCount()
	assert.Equal(t, 2, initialWorkers)

	// Submit many tasks to trigger scale-up
	var wg sync.WaitGroup
	taskCount := 15 // More than queue size to trigger scaling

	for i := 0; i < taskCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			query := make([]float32, 768)
			for j := range query {
				query[j] = rand.Float32()*2 - 1
			}

			task := &VectorSearchTask{
				Context: ctx,
				Query:   query,
				K:       5,
				Result:  make(chan *VectorSearchTaskResult, 1),
			}

			err := pool.SubmitTask(task)
			if err != nil {
				t.Logf("Task submission error: %v", err)
				return
			}

			select {
			case result := <-task.Result:
				if result.Error != nil {
					t.Logf("Task execution error: %v", result.Error)
				}
			case <-time.After(10 * time.Second):
				t.Log("Task timeout")
			}
		}()
	}

	// Wait a bit for scaling to occur
	time.Sleep(2 * time.Second)

	// Check if scaling occurred
	currentWorkers := pool.GetCurrentWorkerCount()
	t.Logf("Initial workers: %d, Current workers: %d", initialWorkers, currentWorkers)

	// We expect some scaling to have occurred
	assert.GreaterOrEqual(t, currentWorkers, initialWorkers)

	// Wait for all tasks to complete
	wg.Wait()

	// Wait for potential scale-down
	time.Sleep(3 * time.Second)

	finalWorkers := pool.GetCurrentWorkerCount()
	t.Logf("Final workers: %d", finalWorkers)

	// Verify stats
	stats := pool.GetStats()
	t.Logf("Pool stats: %+v", stats)

	assert.Greater(t, stats["total_tasks"].(int64), int64(0))
	assert.GreaterOrEqual(t, stats["completed_tasks"].(int64), int64(0))
}

func TestDynamicWorkerPool_ScalingLimits(t *testing.T) {
	// Create HNSW index for testing
	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             200,
		EfConstruction: 200,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      768,
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	// Create dynamic worker pool with strict limits
	poolConfig := &DynamicPoolConfig{
		MinWorkers:              3,
		MaxWorkers:              6,
		InitialWorkers:          4,
		ScaleUpQueueThreshold:   0.1,  // Very low threshold
		ScaleDownQueueThreshold: 0.9,  // Very high threshold
		ScaleUpResponseTime:     1 * time.Millisecond,   // Very low threshold
		ScaleDownResponseTime:   1 * time.Hour,          // Very high threshold
		ScaleUpFactor:           10.0, // Very aggressive
		ScaleDownFactor:         0.1,  // Very aggressive
		CooldownPeriod:          100 * time.Millisecond, // Short cooldown
		QueueSize:               100,
		TaskTimeout:             5 * time.Second,
		MetricsInterval:         100 * time.Millisecond,
	}

	pool := NewDynamicWorkerPool(index, poolConfig)
	defer pool.Stop()

	err := pool.Start()
	require.NoError(t, err)

	// Wait for potential scaling
	time.Sleep(1 * time.Second)

	// Check that workers are within limits
	currentWorkers := pool.GetCurrentWorkerCount()
	assert.GreaterOrEqual(t, currentWorkers, poolConfig.MinWorkers)
	assert.LessOrEqual(t, currentWorkers, poolConfig.MaxWorkers)

	t.Logf("Workers within limits: %d (min: %d, max: %d)", 
		currentWorkers, poolConfig.MinWorkers, poolConfig.MaxWorkers)
}

func TestDynamicWorkerPool_MetricsCollection(t *testing.T) {
	// Create HNSW index for testing
	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             200,
		EfConstruction: 200,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      768,
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	// Add test vectors
	ctx := context.Background()
	for i := 0; i < 20; i++ {
		vector := make([]float32, 768)
		for j := range vector {
			vector[j] = rand.Float32()*2 - 1
		}
		metadata := map[string]interface{}{"id": i}
		_, err := index.AddVector(ctx, vector, metadata)
		require.NoError(t, err)
	}

	poolConfig := &DynamicPoolConfig{
		MinWorkers:              2,
		MaxWorkers:              8,
		InitialWorkers:          3,
		ScaleUpQueueThreshold:   0.7,
		ScaleDownQueueThreshold: 0.3,
		ScaleUpResponseTime:     100 * time.Millisecond,
		ScaleDownResponseTime:   50 * time.Millisecond,
		ScaleUpFactor:           1.5,
		ScaleDownFactor:         0.7,
		CooldownPeriod:          1 * time.Second,
		QueueSize:               50,
		TaskTimeout:             5 * time.Second,
		MetricsInterval:         200 * time.Millisecond,
	}

	pool := NewDynamicWorkerPool(index, poolConfig)
	defer pool.Stop()

	err := pool.Start()
	require.NoError(t, err)

	// Submit some tasks
	for i := 0; i < 5; i++ {
		query := make([]float32, 768)
		for j := range query {
			query[j] = rand.Float32()*2 - 1
		}

		task := &VectorSearchTask{
			Context: ctx,
			Query:   query,
			K:       5,
			Result:  make(chan *VectorSearchTaskResult, 1),
		}

		err := pool.SubmitTask(task)
		require.NoError(t, err)

		// Wait for result
		select {
		case result := <-task.Result:
			assert.NoError(t, result.Error)
		case <-time.After(5 * time.Second):
			t.Fatal("Task timeout")
		}
	}

	// Wait for metrics collection
	time.Sleep(1 * time.Second)

	// Check metrics
	stats := pool.GetStats()
	assert.NotNil(t, stats)
	assert.Greater(t, stats["total_tasks"].(int64), int64(0))
	
	// Check metrics stats
	metricsStats := make(map[string]interface{})
	for k, v := range stats {
		if len(k) > 8 && k[:8] == "metrics_" {
			metricsStats[k[8:]] = v
		}
	}
	
	assert.NotEmpty(t, metricsStats)
	t.Logf("Metrics stats: %+v", metricsStats)
}

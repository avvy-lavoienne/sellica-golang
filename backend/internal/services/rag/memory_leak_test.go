package rag

import (
	"context"
	"runtime"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestMemoryLeakDetection tests for memory leaks in RAG service operations
func TestMemoryLeakDetection(t *testing.T) {
	// Skip if running in short mode
	if testing.Short() {
		t.Skip("Skipping memory leak test in short mode")
	}

	// Create Redis client for testing
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   1, // Use test database
	})
	defer redisClient.Close()

	// Test Redis connection
	ctx := context.Background()
	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		t.Skip("Redis not available for testing")
	}

	// Create RAG service
	ragService := NewRedisRAGService(redisClient)
	defer ragService.Close()

	// Initialize the service
	err = ragService.Initialize(ctx)
	require.NoError(t, err)

	// Force garbage collection before starting
	runtime.GC()
	runtime.GC() // Run twice to ensure cleanup
	time.Sleep(100 * time.Millisecond)

	// Get initial memory stats
	var initialStats runtime.MemStats
	runtime.ReadMemStats(&initialStats)
	initialAlloc := initialStats.Alloc

	t.Logf("Initial memory allocation: %d bytes (%.2f MB)", initialAlloc, float64(initialAlloc)/1024/1024)

	// Run multiple operations to test for memory leaks
	const numOperations = 1000
	const batchSize = 100

	for batch := 0; batch < numOperations/batchSize; batch++ {
		t.Logf("Running batch %d/%d", batch+1, numOperations/batchSize)

		for i := 0; i < batchSize; i++ {
			// Test RetrieveContext operation
			query := "test query for memory leak detection"
			_, err := ragService.RetrieveContext(ctx, query, 5)
			if err != nil {
				t.Logf("Warning: RetrieveContext failed: %v", err)
			}

			// Test RetrieveContextWithTimeout operation
			_, err = ragService.RetrieveContextWithTimeout(ctx, query, 5, 5*time.Second)
			if err != nil {
				t.Logf("Warning: RetrieveContextWithTimeout failed: %v", err)
			}

			// Test SearchSimilar operation
			_, err = ragService.SearchSimilar(ctx, query, 5)
			if err != nil {
				t.Logf("Warning: SearchSimilar failed: %v", err)
			}
		}

		// Force garbage collection after each batch
		runtime.GC()
		runtime.GC()
		time.Sleep(50 * time.Millisecond)

		// Check memory usage after each batch
		var currentStats runtime.MemStats
		runtime.ReadMemStats(&currentStats)
		currentAlloc := currentStats.Alloc
		memoryIncrease := int64(currentAlloc) - int64(initialAlloc)

		t.Logf("Batch %d - Current memory: %d bytes (%.2f MB), Increase: %d bytes (%.2f MB)",
			batch+1,
			currentAlloc, float64(currentAlloc)/1024/1024,
			memoryIncrease, float64(memoryIncrease)/1024/1024)

		// Check if memory increase is excessive (more than 100MB)
		if memoryIncrease > 100*1024*1024 {
			t.Errorf("Potential memory leak detected: memory increased by %.2f MB after %d operations",
				float64(memoryIncrease)/1024/1024, (batch+1)*batchSize)
		}
	}

	// Final memory check
	runtime.GC()
	runtime.GC()
	time.Sleep(200 * time.Millisecond)

	var finalStats runtime.MemStats
	runtime.ReadMemStats(&finalStats)
	finalAlloc := finalStats.Alloc
	totalIncrease := int64(finalAlloc) - int64(initialAlloc)

	t.Logf("Final memory allocation: %d bytes (%.2f MB)", finalAlloc, float64(finalAlloc)/1024/1024)
	t.Logf("Total memory increase: %d bytes (%.2f MB)", totalIncrease, float64(totalIncrease)/1024/1024)

	// Assert that memory increase is reasonable (less than 50MB for 1000 operations)
	maxAllowedIncrease := int64(50 * 1024 * 1024) // 50MB
	assert.LessOrEqual(t, totalIncrease, maxAllowedIncrease,
		"Memory leak detected: total increase %.2f MB exceeds limit %.2f MB",
		float64(totalIncrease)/1024/1024, float64(maxAllowedIncrease)/1024/1024)

	// Test memory monitor functionality
	if ragService.memoryMonitor != nil {
		currentStats := ragService.memoryMonitor.GetCurrentStats()
		assert.Greater(t, currentStats.AllocMB, 0.0, "Memory monitor should report positive memory usage")
		
		history := ragService.memoryMonitor.GetMemoryHistory()
		assert.Greater(t, len(history), 0, "Memory monitor should have history data")
		
		t.Logf("Memory monitor stats - Current: %.2f MB, History entries: %d",
			currentStats.AllocMB, len(history))
	}
}

// TestMemoryMonitorFunctionality tests the memory monitor component
func TestMemoryMonitorFunctionality(t *testing.T) {
	monitor := NewMemoryMonitor()
	defer monitor.StopMonitoring()

	// Start monitoring with short interval for testing
	monitor.StartMonitoring(100 * time.Millisecond)

	// Wait for some monitoring data to be collected
	time.Sleep(500 * time.Millisecond)

	// Test current stats
	stats := monitor.GetCurrentStats()
	assert.Greater(t, stats.AllocMB, 0.0, "Should report positive memory usage")
	assert.Greater(t, stats.Goroutines, 0, "Should report positive goroutine count")

	// Test history
	history := monitor.GetMemoryHistory()
	assert.Greater(t, len(history), 0, "Should have collected some history data")

	// Test forced garbage collection
	beforeStats := monitor.GetCurrentStats()
	monitor.ForceGarbageCollection()
	afterStats := monitor.GetCurrentStats()

	// GC count should have increased
	assert.GreaterOrEqual(t, afterStats.NumGC, beforeStats.NumGC,
		"GC count should increase after forced collection")

	t.Logf("Memory monitor test - Before GC: %.2f MB, After GC: %.2f MB",
		beforeStats.AllocMB, afterStats.AllocMB)
}

// TestContextCancellation tests context cancellation in RAG operations
func TestContextCancellation(t *testing.T) {
	// Create Redis client for testing
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   1, // Use test database
	})
	defer redisClient.Close()

	// Test Redis connection
	ctx := context.Background()
	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		t.Skip("Redis not available for testing")
	}

	// Create RAG service
	ragService := NewRedisRAGService(redisClient)
	defer ragService.Close()

	// Initialize the service
	err = ragService.Initialize(ctx)
	require.NoError(t, err)

	// Test context cancellation
	cancelCtx, cancel := context.WithCancel(ctx)
	cancel() // Cancel immediately

	// This should return context cancelled error
	_, err = ragService.RetrieveContext(cancelCtx, "test query", 5)
	assert.Error(t, err, "Should return error for cancelled context")
	assert.Contains(t, err.Error(), "context cancelled", "Error should mention context cancellation")

	// Test timeout context
	timeoutCtx, timeoutCancel := context.WithTimeout(ctx, 1*time.Nanosecond)
	defer timeoutCancel()

	// Wait for timeout
	time.Sleep(10 * time.Millisecond)

	_, err = ragService.RetrieveContext(timeoutCtx, "test query", 5)
	assert.Error(t, err, "Should return error for timed out context")

	// Test RetrieveContextWithTimeout
	_, err = ragService.RetrieveContextWithTimeout(ctx, "test query", 5, 1*time.Nanosecond)
	assert.Error(t, err, "Should return error for very short timeout")
}

// TestResourceCleanup tests proper resource cleanup
func TestResourceCleanup(t *testing.T) {
	// Create Redis client for testing
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   1, // Use test database
	})
	defer redisClient.Close()

	// Test Redis connection
	ctx := context.Background()
	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		t.Skip("Redis not available for testing")
	}

	// Create and initialize RAG service
	ragService := NewRedisRAGService(redisClient)
	err = ragService.Initialize(ctx)
	require.NoError(t, err)

	// Verify components are initialized
	assert.NotNil(t, ragService.memoryMonitor, "Memory monitor should be initialized")
	assert.NotNil(t, ragService.embeddingService, "Embedding service should be initialized")
	assert.NotNil(t, ragService.cacheOptimizer, "Cache optimizer should be initialized")

	// Test proper cleanup
	err = ragService.Close()
	assert.NoError(t, err, "Close should not return error")

	// Verify service is marked as not initialized
	assert.False(t, ragService.isInitialized, "Service should be marked as not initialized after close")
}

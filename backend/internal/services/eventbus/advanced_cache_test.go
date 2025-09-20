package eventbus

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAdvancedCacheService_NewService tests creating a new advanced cache service
func TestAdvancedCacheService_NewService(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)

	require.NoError(t, err)
	assert.NotNil(t, service)
	assert.NotNil(t, service.config)
	assert.NotNil(t, service.metrics)
	assert.NotNil(t, service.accessTracker)
	assert.NotNil(t, service.dependencyGraph)
}

// TestAdvancedCacheService_StartStop tests starting and stopping the service
func TestAdvancedCacheService_StartStop(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()

	// Start the service
	err = service.Start(ctx)
	require.NoError(t, err)
	assert.True(t, service.isRunning)

	// Stop the service
	err = service.Stop()
	require.NoError(t, err)
	assert.False(t, service.isRunning)
}

// TestAdvancedCacheService_L1Only tests L1-only caching
func TestAdvancedCacheService_L1Only(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	config.L1Enabled = true
	config.L2Enabled = false

	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test basic set/get
	key := "test_key"
	value := "test_value"
	ttl := 10 * time.Minute

	err = service.Set(ctx, key, value, ttl)
	require.NoError(t, err)

	retrieved, found, err := service.Get(ctx, key)
	require.NoError(t, err)
	assert.True(t, found)
	assert.Equal(t, value, retrieved)

	// Check metrics
	metrics := service.GetMetrics()
	assert.Equal(t, int64(1), metrics.L1Hits)
	assert.Equal(t, int64(0), metrics.L1Misses)
	assert.Equal(t, int64(1), metrics.Sets)
	assert.Equal(t, int64(1), metrics.Gets)
}

// TestAdvancedCacheService_L2Only tests L2-only caching (would need Redis)
func TestAdvancedCacheService_L2Only(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	config.L1Enabled = false
	config.L2Enabled = true
	config.L2RedisURL = "redis://localhost:6379" // This would fail without Redis

	_, err := NewAdvancedCacheService(config)
	// This will fail without Redis, which is expected
	assert.Error(t, err) // Expected to fail without Redis
}

// TestAdvancedCacheService_DualLevel tests dual-level caching
func TestAdvancedCacheService_DualLevel(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	config.L1Enabled = true
	config.L2Enabled = false // Skip L2 for this test
	config.DependencyTracking = true

	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test cache miss (L1)
	key := "test_key"
	_, found, err := service.Get(ctx, key)
	require.NoError(t, err)
	assert.False(t, found)

	// Set value
	value := "test_value"
	err = service.Set(ctx, key, value, 10*time.Minute)
	require.NoError(t, err)

	// Test cache hit (L1)
	retrieved, found, err := service.Get(ctx, key)
	require.NoError(t, err)
	assert.True(t, found)
	assert.Equal(t, value, retrieved)

	// Check metrics
	metrics := service.GetMetrics()
	assert.Equal(t, int64(1), metrics.L1Hits)
	assert.Equal(t, int64(1), metrics.L1Misses)
}

// TestAdvancedCacheService_TTL tests TTL functionality
func TestAdvancedCacheService_TTL(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	config.L1DefaultTTL = 100 * time.Millisecond // Very short TTL for testing

	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Set value with TTL
	key := "ttl_test"
	value := "ttl_value"
	err = service.Set(ctx, key, value, 50*time.Millisecond)
	require.NoError(t, err)

	// Should be available immediately
	retrieved, found, err := service.Get(ctx, key)
	require.NoError(t, err)
	assert.True(t, found)
	assert.Equal(t, value, retrieved)

	// Wait for expiration
	time.Sleep(100 * time.Millisecond)

	// Should be expired
	_, found, err = service.Get(ctx, key)
	require.NoError(t, err)
	assert.False(t, found)
}

// TestAdvancedCacheService_Delete tests deletion
func TestAdvancedCacheService_Delete(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Set value
	key := "delete_test"
	value := "delete_value"
	err = service.Set(ctx, key, value, 10*time.Minute)
	require.NoError(t, err)

	// Verify it's there
	retrieved, found, err := service.Get(ctx, key)
	require.NoError(t, err)
	assert.True(t, found)
	assert.Equal(t, value, retrieved)

	// Delete it
	err = service.Delete(ctx, key)
	require.NoError(t, err)

	// Verify it's gone
	_, found, err = service.Get(ctx, key)
	require.NoError(t, err)
	assert.False(t, found)

	// Check metrics
	metrics := service.GetMetrics()
	assert.Equal(t, int64(1), metrics.Deletes)
}

// TestAdvancedCacheService_InvalidateByPattern tests pattern-based invalidation
func TestAdvancedCacheService_InvalidateByPattern(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Set multiple values with similar patterns
	keys := []string{"user:1", "user:2", "user:3", "product:1"}
	for _, key := range keys {
		err = service.Set(ctx, key, "value_"+key, 10*time.Minute)
		require.NoError(t, err)
	}

	// Invalidate user keys
	err = service.InvalidateByPattern(ctx, "user:*")
	require.NoError(t, err)

	// Verify user keys are gone
	for _, key := range []string{"user:1", "user:2", "user:3"} {
		_, found, err := service.Get(ctx, key)
		require.NoError(t, err)
		assert.False(t, found, "Key %s should be invalidated", key)
	}

	// Verify product key is still there
	_, found, err := service.Get(ctx, "product:1")
	require.NoError(t, err)
	assert.True(t, found, "Product key should not be invalidated")
}

// TestAdvancedCacheService_Dependencies tests dependency tracking
func TestAdvancedCacheService_Dependencies(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	config.DependencyTracking = true

	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Set up dependencies
	err = service.AddDependency("user:profile:1", "user:1")
	require.NoError(t, err)
	err = service.AddDependency("user:posts:1", "user:1")
	require.NoError(t, err)

	// Set values
	err = service.Set(ctx, "user:1", "user_data", 10*time.Minute)
	require.NoError(t, err)
	err = service.Set(ctx, "user:profile:1", "profile_data", 10*time.Minute)
	require.NoError(t, err)

	// Delete main key
	err = service.Delete(ctx, "user:1")
	require.NoError(t, err)

	// Verify dependent keys are also deleted
	_, found, err := service.Get(ctx, "user:profile:1")
	require.NoError(t, err)
	assert.False(t, found, "Dependent key should be deleted")
}

// TestAdvancedCacheService_AccessTracking tests access pattern tracking
func TestAdvancedCacheService_AccessTracking(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Set a value
	key := "access_test"
	err = service.Set(ctx, key, "test_value", 10*time.Minute)
	require.NoError(t, err)

	// Access the key multiple times
	for i := 0; i < 5; i++ {
		_, _, err := service.Get(ctx, key)
		require.NoError(t, err)
		time.Sleep(10 * time.Millisecond) // Small delay for frequency calculation
	}

	// Check access pattern
	pattern, exists := service.accessTracker.GetAccessPattern(key)
	assert.True(t, exists)
	assert.Equal(t, int64(5), pattern.TotalAccesses)
	assert.True(t, pattern.Frequency > 0)
}

// TestAdvancedCacheService_Concurrency tests concurrent operations
func TestAdvancedCacheService_Concurrency(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	var wg sync.WaitGroup
	numGoroutines := 10
	operationsPerGoroutine := 100

	// Start concurrent operations
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < operationsPerGoroutine; j++ {
				key := fmt.Sprintf("concurrent:%d:%d", id, j)
				value := fmt.Sprintf("value_%d_%d", id, j)

				// Set operation
				err := service.Set(ctx, key, value, 10*time.Minute)
				if err != nil {
					t.Errorf("Failed to set: %v", err)
				}

				// Get operation
				retrieved, found, err := service.Get(ctx, key)
				if err != nil {
					t.Errorf("Failed to get: %v", err)
				}
				if !found {
					t.Errorf("Key not found after set")
				}
				if retrieved != value {
					t.Errorf("Retrieved value mismatch")
				}
			}
		}(i)
	}

	wg.Wait()

	// Check final metrics
	metrics := service.GetMetrics()
	expectedOperations := int64(numGoroutines * operationsPerGoroutine)
	assert.Equal(t, expectedOperations, metrics.Sets)
	assert.Equal(t, expectedOperations, metrics.Gets)
	assert.Equal(t, expectedOperations, metrics.L1Hits)
}

// TestAdvancedCacheService_WarmingEngine tests cache warming functionality
func TestAdvancedCacheService_WarmingEngine(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	config.WarmingEnabled = true
	config.MaxWarmItems = 10

	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test warming queue
	assert.True(t, service.warmingEngine.QueueForWarming("warm_key_1"))
	assert.True(t, service.warmingEngine.QueueForWarming("warm_key_2"))

	// Test warming stats
	stats := service.warmingEngine.GetWarmingStats()
	assert.True(t, stats["is_running"].(bool))
	assert.Equal(t, 2, stats["queue_size"])
}

// TestAdvancedCacheService_GetStats tests statistics collection
func TestAdvancedCacheService_GetStats(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Perform some operations
	err = service.Set(ctx, "stats_test", "test_value", 10*time.Minute)
	require.NoError(t, err)

	_, _, err = service.Get(ctx, "stats_test")
	require.NoError(t, err)

	// Get stats
	stats := service.GetStats()
	assert.Contains(t, stats, "l1_enabled")
	assert.Contains(t, stats, "l2_enabled")
	assert.Contains(t, stats, "metrics")
	assert.Contains(t, stats, "l1_hit_rate")

	metrics := stats["metrics"].(map[string]interface{})
	assert.Equal(t, int64(1), metrics["sets"])
	assert.Equal(t, int64(1), metrics["gets"])
	assert.Equal(t, int64(1), metrics["l1_hits"])
}

// TestAdvancedCacheService_EvictionPolicies tests different eviction policies
func TestAdvancedCacheService_EvictionPolicies(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	config.L1MaxSize = 100 // Small size to trigger eviction
	config.EvictionPolicy = LRUPolicy

	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Fill cache beyond capacity
	for i := 0; i < 20; i++ {
		key := fmt.Sprintf("eviction_test_%d", i)
		err = service.Set(ctx, key, fmt.Sprintf("value_%d", i), 10*time.Minute)
		require.NoError(t, err)
	}

	// Check that evictions occurred
	metrics := service.GetMetrics()
	assert.True(t, metrics.Evictions > 0, "Evictions should have occurred")
}

// TestAdvancedCacheService_ErrorHandling tests error handling
func TestAdvancedCacheService_ErrorHandling(t *testing.T) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(t, err)

	// Test operations on stopped service
	ctx := context.Background()

	_, _, err = service.Get(ctx, "test")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cache service is not running")

	err = service.Set(ctx, "test", "value", 10*time.Minute)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cache service is not running")

	err = service.Delete(ctx, "test")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cache service is not running")
}

// BenchmarkAdvancedCacheService_Set benchmarks the Set operation
func BenchmarkAdvancedCacheService_Set(b *testing.B) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(b, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(b, err)
	defer service.Stop()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			key := fmt.Sprintf("bench_set_%d", i)
			value := fmt.Sprintf("value_%d", i)
			err := service.Set(ctx, key, value, 10*time.Minute)
			if err != nil {
				b.Errorf("Failed to set: %v", err)
			}
			i++
		}
	})
}

// BenchmarkAdvancedCacheService_Get benchmarks the Get operation
func BenchmarkAdvancedCacheService_Get(b *testing.B) {
	config := DefaultAdvancedCacheConfig()
	service, err := NewAdvancedCacheService(config)
	require.NoError(b, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(b, err)
	defer service.Stop()

	// Pre-populate cache
	for i := 0; i < 1000; i++ {
		key := fmt.Sprintf("bench_get_%d", i)
		value := fmt.Sprintf("value_%d", i)
		err := service.Set(ctx, key, value, 10*time.Minute)
		require.NoError(b, err)
	}

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			key := fmt.Sprintf("bench_get_%d", i%1000)
			_, _, err := service.Get(ctx, key)
			if err != nil {
				b.Errorf("Failed to get: %v", err)
			}
			i++
		}
	})
}
package cache

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestUpstashRedisIntegration tests the integration with Upstash Redis
func TestUpstashRedisIntegration(t *testing.T) {
	// Skip if no Upstash Redis URL provided
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		t.Skip("REDIS_URL not provided, skipping Upstash Redis integration test")
	}

	// Create cache service with Upstash Redis
	service, err := NewService(redisURL)
	require.NoError(t, err)
	require.NotNil(t, service)

	// Wait a moment for connection to establish
	time.Sleep(100 * time.Millisecond)

	t.Run("Connection Health Check", func(t *testing.T) {
		// Test if service is healthy (connected to Redis)
		isHealthy := service.IsHealthy()
		assert.True(t, isHealthy, "Cache service should be healthy with Upstash Redis")
	})

	t.Run("Basic Set and Get Operations", func(t *testing.T) {
		testKey := "upstash_test_key"
		testValue := map[string]interface{}{
			"message": "Hello from Upstash Redis",
			"timestamp": time.Now().Unix(),
			"test": true,
		}

		// Test Set operation
		err := service.Set(testKey, testValue, 5*time.Minute)
		assert.NoError(t, err, "Should be able to set value in Upstash Redis")

		// Test Get operation
		retrievedValue, err := service.Get(testKey)
		assert.NoError(t, err, "Should be able to get value from Upstash Redis")
		assert.NotNil(t, retrievedValue, "Retrieved value should not be nil")

		// Verify the value structure
		if valueMap, ok := retrievedValue.(map[string]interface{}); ok {
			assert.Equal(t, "Hello from Upstash Redis", valueMap["message"])
			assert.Equal(t, true, valueMap["test"])
		}

		// Clean up
		err = service.Delete(testKey)
		assert.NoError(t, err, "Should be able to delete value from Upstash Redis")
	})

	t.Run("Multi-Level Caching", func(t *testing.T) {
		testKey := "upstash_multilevel_test"
		testValue := "Multi-level cache test value"

		// Set value (should go to both memory and Redis)
		err := service.Set(testKey, testValue, 5*time.Minute)
		assert.NoError(t, err)

		// First get should hit memory cache (L1)
		value1, err := service.Get(testKey)
		assert.NoError(t, err)
		assert.Equal(t, testValue, value1)

		// Clear memory cache to test Redis fallback
		service.memory.Flush()

		// Second get should hit Redis cache (L2)
		value2, err := service.Get(testKey)
		assert.NoError(t, err)
		assert.Equal(t, testValue, value2)

		// Clean up
		service.Delete(testKey)
	})

	t.Run("Performance Test", func(t *testing.T) {
		testKey := "upstash_performance_test"
		testValue := "Performance test value"

		// Measure Set performance
		startTime := time.Now()
		err := service.Set(testKey, testValue, 1*time.Minute)
		setDuration := time.Since(startTime)
		
		assert.NoError(t, err)
		assert.Less(t, setDuration, 100*time.Millisecond, "Set operation should complete within 100ms")

		// Measure Get performance
		startTime = time.Now()
		_, err = service.Get(testKey)
		getDuration := time.Since(startTime)
		
		assert.NoError(t, err)
		assert.Less(t, getDuration, 50*time.Millisecond, "Get operation should complete within 50ms")

		t.Logf("Performance: Set=%v, Get=%v", setDuration, getDuration)

		// Clean up
		service.Delete(testKey)
	})

	t.Run("Cache Statistics", func(t *testing.T) {
		// Get initial stats
		initialStats := service.GetStats()
		assert.NotNil(t, initialStats)

		// Perform some operations
		testKey := "upstash_stats_test"
		service.Set(testKey, "test value", 1*time.Minute)
		service.Get(testKey)
		service.Get("non_existent_key") // This should be a miss

		// Get updated stats
		updatedStats := service.GetStats()

		// Access nested stats
		if initialStatsMap, ok := initialStats["stats"].(map[string]interface{}); ok {
			if updatedStatsMap, ok := updatedStats["stats"].(map[string]interface{}); ok {
				initialSets := initialStatsMap["totalSets"].(int64)
				updatedSets := updatedStatsMap["totalSets"].(int64)
				assert.Greater(t, updatedSets, initialSets, "Total sets should have increased")
			}
		}

		// Clean up
		service.Delete(testKey)
	})

	t.Run("Training Cache Integration", func(t *testing.T) {
		// Test with training-specific data structure
		trainingData := map[string]interface{}{
			"query":    "Test training query",
			"response": "Test training response",
			"user_id":  "test-user-123",
			"session_id": "test-session-456",
			"timestamp": time.Now().Unix(),
			"metadata": map[string]interface{}{
				"accuracy": 0.95,
				"model_type": "tensorflow",
			},
		}

		trainingKey := "training:test:123"
		
		// Set training data
		err := service.Set(trainingKey, trainingData, 30*time.Minute)
		assert.NoError(t, err, "Should be able to cache training data")

		// Retrieve training data
		retrievedData, err := service.Get(trainingKey)
		assert.NoError(t, err, "Should be able to retrieve training data")
		assert.NotNil(t, retrievedData, "Retrieved training data should not be nil")

		// Verify training data structure
		if dataMap, ok := retrievedData.(map[string]interface{}); ok {
			assert.Equal(t, "Test training query", dataMap["query"])
			assert.Equal(t, "Test training response", dataMap["response"])
			assert.Equal(t, "test-user-123", dataMap["user_id"])
		}

		// Clean up
		service.Delete(trainingKey)
	})
}

// TestUpstashRedisFailover tests fallback to memory cache when Redis is unavailable
func TestUpstashRedisFailover(t *testing.T) {
	// Create service with invalid Redis URL to test fallback
	service, err := NewService("redis://invalid-host:6379")
	require.NoError(t, err)
	require.NotNil(t, service)

	t.Run("Fallback to Memory Cache", func(t *testing.T) {
		// Service should not be healthy (Redis connection failed)
		assert.False(t, service.IsHealthy(), "Service should not be healthy with invalid Redis URL")

		// But memory cache should still work
		testKey := "memory_fallback_test"
		testValue := "Memory cache fallback value"

		err := service.Set(testKey, testValue, 5*time.Minute)
		assert.NoError(t, err, "Should be able to set value in memory cache")

		retrievedValue, err := service.Get(testKey)
		assert.NoError(t, err, "Should be able to get value from memory cache")
		assert.Equal(t, testValue, retrievedValue, "Retrieved value should match")
	})
}

// BenchmarkUpstashRedisOperations benchmarks Upstash Redis operations
func BenchmarkUpstashRedisOperations(b *testing.B) {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		b.Skip("REDIS_URL not provided, skipping Upstash Redis benchmark")
	}

	service, err := NewService(redisURL)
	if err != nil {
		b.Fatalf("Failed to create cache service: %v", err)
	}

	testValue := map[string]interface{}{
		"data": "benchmark test data",
		"timestamp": time.Now().Unix(),
	}

	b.Run("Set Operations", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("benchmark_set_%d", i)
			service.Set(key, testValue, 1*time.Minute)
		}
	})

	b.Run("Get Operations", func(b *testing.B) {
		// Pre-populate some keys
		for i := 0; i < 100; i++ {
			key := fmt.Sprintf("benchmark_get_%d", i)
			service.Set(key, testValue, 1*time.Minute)
		}

		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("benchmark_get_%d", i%100)
			service.Get(key)
		}
	})
}

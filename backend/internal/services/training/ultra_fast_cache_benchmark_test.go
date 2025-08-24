package training

import (
	"context"
	"fmt"
	"testing"
	"time"

	"selly-backend/internal/services/cache"
)

// Phase 3 Week 1: Ultra-fast cache performance benchmarks
func BenchmarkUltraFastCache(b *testing.B) {
	// Initialize cache service
	cacheService, err := cache.NewService("redis://localhost:6379")
	if err != nil {
		b.Logf("Redis not available, using memory cache only: %v", err)
	}

	// Create training cache with ultra-fast optimization
	trainingCache := NewTrainingCache(cacheService, &TrainingCacheConfig{
		MemoryTTL:     5 * time.Minute,
		RedisTTL:      30 * time.Minute,
		MaxMemorySize: 10000,
	})

	// Wait for initialization
	time.Sleep(10 * time.Millisecond)

	b.Run("UltraFastCacheSet", func(b *testing.B) {
		ctx := context.Background()
		testData := map[string]interface{}{
			"test": "data",
			"performance": "ultra-fast",
		}

		b.ResetTimer()
		start := time.Now()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("ultra_fast_set_%d", i)
			err := trainingCache.Set(ctx, key, testData, 5*time.Minute)
			if err != nil {
				b.Errorf("Set failed: %v", err)
			}
		}
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Ultra-fast cache SET: %v per operation (target: <1ms)", avgDuration)
		
		// Validate performance target
		if avgDuration > time.Millisecond {
			b.Logf("⚠️ Performance target not met: %v > 1ms", avgDuration)
		} else {
			b.Logf("✅ Performance target achieved: %v < 1ms", avgDuration)
		}
	})

	b.Run("UltraFastCacheGet", func(b *testing.B) {
		ctx := context.Background()
		testData := map[string]interface{}{
			"test": "data",
			"performance": "ultra-fast",
		}

		// Pre-populate cache
		for i := 0; i < 1000; i++ {
			key := fmt.Sprintf("ultra_fast_get_%d", i)
			trainingCache.Set(ctx, key, testData, 5*time.Minute)
		}

		b.ResetTimer()
		start := time.Now()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("ultra_fast_get_%d", i%1000)
			_, found := trainingCache.Get(ctx, key)
			if !found {
				b.Errorf("Get failed for key: %s", key)
			}
		}
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Ultra-fast cache GET: %v per operation (target: <1ms)", avgDuration)
		
		// Validate performance target
		if avgDuration > time.Millisecond {
			b.Logf("⚠️ Performance target not met: %v > 1ms", avgDuration)
		} else {
			b.Logf("✅ Performance target achieved: %v < 1ms", avgDuration)
		}
	})

	b.Run("UltraFastCacheConcurrent", func(b *testing.B) {
		ctx := context.Background()
		testData := map[string]interface{}{
			"concurrent": "test",
			"performance": "ultra-fast",
		}

		b.ResetTimer()
		start := time.Now()
		b.RunParallel(func(pb *testing.PB) {
			i := 0
			for pb.Next() {
				key := fmt.Sprintf("concurrent_%d", i)
				
				// Mix of set and get operations
				if i%2 == 0 {
					trainingCache.Set(ctx, key, testData, 5*time.Minute)
				} else {
					trainingCache.Get(ctx, key)
				}
				i++
			}
		})
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Ultra-fast cache CONCURRENT: %v per operation", avgDuration)
	})
}

// Benchmark direct ultra-fast cache operations (bypassing other layers)
func BenchmarkDirectUltraFastCache(b *testing.B) {
	ufc := NewUltraFastCache(10000)
	testData := map[string]interface{}{
		"direct": "test",
		"performance": "maximum",
	}

	b.Run("DirectUltraFastSet", func(b *testing.B) {
		b.ResetTimer()
		start := time.Now()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("direct_set_%d", i)
			ufc.Set(key, testData, 5*time.Minute)
		}
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Direct ultra-fast SET: %v per operation", avgDuration)
		
		// This should be extremely fast (sub-microsecond)
		if avgDuration > 100*time.Microsecond {
			b.Logf("⚠️ Direct cache slower than expected: %v", avgDuration)
		} else {
			b.Logf("✅ Direct cache performance excellent: %v", avgDuration)
		}
	})

	b.Run("DirectUltraFastGet", func(b *testing.B) {
		// Pre-populate
		for i := 0; i < 1000; i++ {
			key := fmt.Sprintf("direct_get_%d", i)
			ufc.Set(key, testData, 5*time.Minute)
		}

		b.ResetTimer()
		start := time.Now()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("direct_get_%d", i%1000)
			_, found := ufc.Get(key)
			if !found {
				b.Errorf("Direct get failed for key: %s", key)
			}
		}
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Direct ultra-fast GET: %v per operation", avgDuration)
		
		// This should be extremely fast (sub-microsecond)
		if avgDuration > 100*time.Microsecond {
			b.Logf("⚠️ Direct cache slower than expected: %v", avgDuration)
		} else {
			b.Logf("✅ Direct cache performance excellent: %v", avgDuration)
		}
	})
}

// Test cache performance comparison
func TestCachePerformanceComparison(t *testing.T) {
	cacheService, err := cache.NewService("redis://localhost:6379")
	if err != nil {
		t.Logf("Redis not available, using memory cache only: %v", err)
	}

	trainingCache := NewTrainingCache(cacheService, &TrainingCacheConfig{
		MemoryTTL:     5 * time.Minute,
		RedisTTL:      30 * time.Minute,
		MaxMemorySize: 1000,
	})

	ctx := context.Background()
	testData := map[string]interface{}{
		"test": "performance comparison",
		"size": 1024,
	}

	// Test ultra-fast cache performance
	t.Run("UltraFastCachePerformance", func(t *testing.T) {
		iterations := 1000
		
		// Test SET performance
		start := time.Now()
		for i := 0; i < iterations; i++ {
			key := fmt.Sprintf("perf_test_%d", i)
			err := trainingCache.Set(ctx, key, testData, 5*time.Minute)
			if err != nil {
				t.Errorf("Set failed: %v", err)
			}
		}
		setDuration := time.Since(start)
		avgSetTime := setDuration / time.Duration(iterations)
		
		// Test GET performance
		start = time.Now()
		for i := 0; i < iterations; i++ {
			key := fmt.Sprintf("perf_test_%d", i)
			_, found := trainingCache.Get(ctx, key)
			if !found {
				t.Errorf("Get failed for key: %s", key)
			}
		}
		getDuration := time.Since(start)
		avgGetTime := getDuration / time.Duration(iterations)
		
		t.Logf("Cache Performance Results:")
		t.Logf("  SET: %v per operation (target: <1ms)", avgSetTime)
		t.Logf("  GET: %v per operation (target: <1ms)", avgGetTime)
		
		// Validate performance targets
		if avgSetTime > time.Millisecond {
			t.Logf("⚠️ SET performance target not met: %v > 1ms", avgSetTime)
		} else {
			t.Logf("✅ SET performance target achieved: %v < 1ms", avgSetTime)
		}
		
		if avgGetTime > time.Millisecond {
			t.Logf("⚠️ GET performance target not met: %v > 1ms", avgGetTime)
		} else {
			t.Logf("✅ GET performance target achieved: %v < 1ms", avgGetTime)
		}
	})
}

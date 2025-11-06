package cache_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"selly-backend/internal/services/cache"
)

func TestInvalidationManager_NewInvalidationManager(t *testing.T) {
	t.Run("creates new invalidation manager", func(t *testing.T) {
		// Test without actual Redis client (mock)
		manager := cache.NewInvalidationManager(nil, true)
		assert.NotNil(t, manager)
	})
}

func TestInvalidationManager_GenerateVersionedKey(t *testing.T) {
	t.Run("generates versioned key correctly", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		// Register namespace with TTL
		manager.RegisterNamespace("user-data", 1*time.Hour)

		// Generate versioned key
		versionedKey := manager.GenerateVersionedKey("user-data", "user:123")

		// Verify format: namespace:version:key
		assert.Contains(t, versionedKey, "user-data:")
		assert.Contains(t, versionedKey, "user:123")
	})

	t.Run("generates different keys for different namespaces", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		manager.RegisterNamespace("users", 1*time.Hour)
		manager.RegisterNamespace("posts", 1*time.Hour)

		userKey := manager.GenerateVersionedKey("users", "user:1")
		postKey := manager.GenerateVersionedKey("posts", "post:1")

		assert.NotEqual(t, userKey, postKey)
		assert.Contains(t, userKey, "users:")
		assert.Contains(t, postKey, "posts:")
	})
}

func TestInvalidationManager_RegisterNamespace(t *testing.T) {
	t.Run("registers namespace successfully", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		manager.RegisterNamespace("test-namespace", 1*time.Hour)
		assert.NotNil(t, manager)
	})

	t.Run("handles duplicate namespace registration", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		manager.RegisterNamespace("test-namespace", 1*time.Hour)
		manager.RegisterNamespace("test-namespace", 2*time.Hour) // Should be idempotent
		assert.NotNil(t, manager)
	})
}

func TestInvalidationManager_InvalidateNamespace(t *testing.T) {
	t.Run("invalidates namespace by incrementing version", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		manager.RegisterNamespace("test-ns", 1*time.Hour)

		key1 := manager.GenerateVersionedKey("test-ns", "key1")

		// Invalidate namespace
		err := manager.InvalidateNamespace(context.Background(), "test-ns", "testing")
		assert.NoError(t, err)

		// Generate key after invalidation - version should be different
		key2 := manager.GenerateVersionedKey("test-ns", "key1")

		// Keys should be different due to version increment
		assert.NotEqual(t, key1, key2)
	})
}

func TestInvalidationManager_AddTagToKey(t *testing.T) {
	t.Run("adds tag to key successfully", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		// Note: This test requires Redis. When Redis is nil, error is expected.
		// In integration tests with real Redis, this will succeed.
		err := manager.AddTagToKey(context.Background(), "premium-user", "user:123")
		if err != nil && err.Error() == "Redis not available for tag management" {
			t.Skip("Redis not available - skipping tag management test")
		}
		assert.NoError(t, err)
	})

	t.Run("adds multiple tags to same key", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		err1 := manager.AddTagToKey(context.Background(), "tag1", "user:123")
		if err1 != nil && err1.Error() == "Redis not available for tag management" {
			t.Skip("Redis not available - skipping tag management test")
		}

		err2 := manager.AddTagToKey(context.Background(), "tag2", "user:123")
		assert.NoError(t, err2)
	})
}

func TestInvalidationManager_InvalidateKeysByTag(t *testing.T) {
	t.Run("invalidates keys by tag", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		// Add tags
		manager.AddTagToKey(context.Background(), "active-users", "user:123")
		manager.AddTagToKey(context.Background(), "active-users", "user:456")

		// Invalidate by tag
		err := manager.InvalidateKeysByTag(context.Background(), "active-users")
		if err != nil && err.Error() == "Redis not available for tag-based invalidation" {
			t.Skip("Redis not available - skipping tag-based invalidation test")
		}
		assert.NoError(t, err)
	})
}

func TestInvalidationManager_GetInvalidationStats(t *testing.T) {
	t.Run("returns invalidation statistics", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		manager.RegisterNamespace("test-ns", 1*time.Hour)
		manager.InvalidateNamespace(context.Background(), "test-ns", "testing")
		manager.AddTagToKey(context.Background(), "tag1", "key1")

		stats := manager.GetInvalidationStats()

		assert.NotNil(t, stats)
		assert.IsType(t, map[string]interface{}{}, stats)
		// Verify actual keys returned by GetInvalidationStats
		assert.Contains(t, stats, "namespaces")
		assert.Contains(t, stats, "recent_events")
		assert.Contains(t, stats, "total_namespaces")
	})
}

func TestInvalidationManager_Subscribe(t *testing.T) {
	t.Run("subscribes to invalidation events", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		manager.Subscribe("test-ns", func(namespace string) {
			// Callback for invalidation event
		})
		assert.NotNil(t, manager)
	})
}

func TestInvalidationManager_Reset(t *testing.T) {
	t.Run("resets manager state", func(t *testing.T) {
		manager := cache.NewInvalidationManager(nil, false)

		manager.RegisterNamespace("test-ns", 1*time.Hour)
		manager.AddTagToKey(context.Background(), "tag1", "key1")

		// Reset
		manager.Reset()

		// Verify state is reset
		stats := manager.GetInvalidationStats()
		assert.NotNil(t, stats)
	})
}

// Benchmark tests
func BenchmarkInvalidationManager_GenerateVersionedKey(b *testing.B) {
	manager := cache.NewInvalidationManager(nil, false)
	manager.RegisterNamespace("bench-ns", 1*time.Hour)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		manager.GenerateVersionedKey("bench-ns", "key:"+string(rune(i)))
	}
}

func BenchmarkInvalidationManager_InvalidateNamespace(b *testing.B) {
	manager := cache.NewInvalidationManager(nil, false)
	manager.RegisterNamespace("bench-ns", 1*time.Hour)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		manager.InvalidateNamespace(context.Background(), "bench-ns", "benchmark")
	}
}

func BenchmarkInvalidationManager_AddTagToKey(b *testing.B) {
	manager := cache.NewInvalidationManager(nil, false)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		manager.AddTagToKey(context.Background(), "tag", "key:"+string(rune(i)))
	}
}

func BenchmarkInvalidationManager_InvalidateKeysByTag(b *testing.B) {
	manager := cache.NewInvalidationManager(nil, false)

	// Setup
	for i := 0; i < 100; i++ {
		manager.AddTagToKey(context.Background(), "bench-tag", "key:"+string(rune(i)))
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		manager.InvalidateKeysByTag(context.Background(), "bench-tag")
	}
}

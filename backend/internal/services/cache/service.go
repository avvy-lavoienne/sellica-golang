package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/patrickmn/go-cache"
	"github.com/sirupsen/logrus"
)

// Service provides multi-level caching with Redis and in-memory cache
type Service struct {
	redis      *redis.Client
	memory     *cache.Cache
	redisURL   string
	isHealthy  bool
	mu         sync.RWMutex
	stats      *CacheStats
}

// CacheStats tracks cache performance metrics
type CacheStats struct {
	RedisHits    int64 `json:"redisHits"`
	RedisMisses  int64 `json:"redisMisses"`
	MemoryHits   int64 `json:"memoryHits"`
	MemoryMisses int64 `json:"memoryMisses"`
	TotalSets    int64 `json:"totalSets"`
	mu           sync.RWMutex
}

// NewService creates a new cache service with Redis and in-memory caching
func NewService(redisURL string) (*Service, error) {
	service := &Service{
		redisURL:  redisURL,
		isHealthy: false,
		stats:     &CacheStats{},
	}

	// Initialize in-memory cache (1000 items, 5 minute default expiration, 10 minute cleanup)
	service.memory = cache.New(5*time.Minute, 10*time.Minute)

	// Initialize Redis client if URL provided
	if redisURL != "" {
		opt, err := redis.ParseURL(redisURL)
		if err != nil {
			logrus.Errorf("Failed to parse Redis URL: %v", err)
			return service, nil // Continue without Redis
		}

		service.redis = redis.NewClient(opt)

		// Test Redis connection
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := service.redis.Ping(ctx).Err(); err != nil {
			logrus.Errorf("Redis connection failed: %v", err)
			service.redis = nil
		} else {
			service.isHealthy = true
			logrus.Info("✅ Cache service initialized with Redis")
		}
	} else {
		logrus.Warn("Redis URL not provided - using memory cache only")
	}

	if service.redis == nil {
		logrus.Info("✅ Cache service initialized with memory cache only")
	}

	return service, nil
}

// Get retrieves a value from cache (L1: memory, L2: Redis)
func (s *Service) Get(key string) (interface{}, error) {
	// L1: Check memory cache first (fastest)
	if value, found := s.memory.Get(key); found {
		s.stats.mu.Lock()
		s.stats.MemoryHits++
		s.stats.mu.Unlock()
		return value, nil
	}

	s.stats.mu.Lock()
	s.stats.MemoryMisses++
	s.stats.mu.Unlock()

	// L2: Check Redis cache
	if s.redis != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		val, err := s.redis.Get(ctx, key).Result()
		if err == nil {
			// Deserialize and store in memory cache
			var result interface{}
			if err := json.Unmarshal([]byte(val), &result); err == nil {
				s.memory.Set(key, result, 5*time.Minute)
				s.stats.mu.Lock()
				s.stats.RedisHits++
				s.stats.mu.Unlock()
				return result, nil
			}
		}

		s.stats.mu.Lock()
		s.stats.RedisMisses++
		s.stats.mu.Unlock()
	}

	return nil, fmt.Errorf("key not found: %s", key)
}

// Set stores a value in both cache levels
func (s *Service) Set(key string, value interface{}, ttl time.Duration) error {
	// Store in memory cache
	s.memory.Set(key, value, ttl)

	// Store in Redis if available
	if s.redis != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		data, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal value: %w", err)
		}

		if err := s.redis.Set(ctx, key, data, ttl).Err(); err != nil {
			logrus.Errorf("Failed to set Redis key %s: %v", key, err)
			// Continue without Redis - memory cache still works
		}
	}

	s.stats.mu.Lock()
	s.stats.TotalSets++
	s.stats.mu.Unlock()

	return nil
}

// Delete removes a key from both cache levels
func (s *Service) Delete(key string) error {
	// Delete from memory cache
	s.memory.Delete(key)

	// Delete from Redis if available
	if s.redis != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		if err := s.redis.Del(ctx, key).Err(); err != nil {
			logrus.Errorf("Failed to delete Redis key %s: %v", key, err)
		}
	}

	return nil
}

// Ping tests the cache service health
func (s *Service) Ping() error {
	// Test memory cache
	testKey := "health_check_" + fmt.Sprintf("%d", time.Now().UnixNano())
	s.memory.Set(testKey, "test", 1*time.Second)
	
	if _, found := s.memory.Get(testKey); !found {
		return fmt.Errorf("memory cache test failed")
	}
	s.memory.Delete(testKey)

	// Test Redis if available
	if s.redis != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		if err := s.redis.Ping(ctx).Err(); err != nil {
			s.mu.Lock()
			s.isHealthy = false
			s.mu.Unlock()
			return fmt.Errorf("redis ping failed: %w", err)
		}
	}

	s.mu.Lock()
	s.isHealthy = true
	s.mu.Unlock()
	return nil
}

// IsHealthy returns the current health status
func (s *Service) IsHealthy() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isHealthy
}

// GetStats returns cache performance statistics
func (s *Service) GetStats() map[string]interface{} {
	s.stats.mu.RLock()
	defer s.stats.mu.RUnlock()

	memoryStats := map[string]interface{}{
		"itemCount": s.memory.ItemCount(),
	}

	redisStats := map[string]interface{}{
		"connected": s.redis != nil,
	}

	if s.redis != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		if info, err := s.redis.Info(ctx, "memory").Result(); err == nil {
			redisStats["info"] = info
		}
	}

	totalRequests := s.stats.MemoryHits + s.stats.MemoryMisses + s.stats.RedisHits + s.stats.RedisMisses
	var hitRatio float64
	if totalRequests > 0 {
		totalHits := s.stats.MemoryHits + s.stats.RedisHits
		hitRatio = float64(totalHits) / float64(totalRequests) * 100
	}

	return map[string]interface{}{
		"memory":    memoryStats,
		"redis":     redisStats,
		"hitRatio":  hitRatio,
		"stats": map[string]interface{}{
			"memoryHits":   s.stats.MemoryHits,
			"memoryMisses": s.stats.MemoryMisses,
			"redisHits":    s.stats.RedisHits,
			"redisMisses":  s.stats.RedisMisses,
			"totalSets":    s.stats.TotalSets,
		},
	}
}

// TestCache performs comprehensive cache testing
func (s *Service) TestCache() map[string]interface{} {
	result := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"healthy":   false,
	}

	startTime := time.Now()

	// Test cache operations
	testKey := "cache_test_" + fmt.Sprintf("%d", time.Now().UnixNano())
	testValue := map[string]interface{}{
		"test":      true,
		"timestamp": time.Now().UTC(),
	}

	// Test Set operation
	if err := s.Set(testKey, testValue, 30*time.Second); err != nil {
		result["error"] = fmt.Sprintf("Cache set failed: %v", err)
		result["responseTime"] = time.Since(startTime).Milliseconds()
		return result
	}

	// Test Get operation
	retrievedValue, err := s.Get(testKey)
	if err != nil {
		result["error"] = fmt.Sprintf("Cache get failed: %v", err)
		result["responseTime"] = time.Since(startTime).Milliseconds()
		return result
	}

	// Verify value
	if retrievedValue == nil {
		result["error"] = "Retrieved value is nil"
		result["responseTime"] = time.Since(startTime).Milliseconds()
		return result
	}

	// Clean up test key
	s.Delete(testKey)

	responseTime := time.Since(startTime).Milliseconds()
	result["responseTime"] = responseTime
	result["healthy"] = true
	result["stats"] = s.GetStats()

	return result
}

// Close closes the cache service
func (s *Service) Close() {
	if s.redis != nil {
		s.redis.Close()
	}
	
	s.memory.Flush()
	
	s.mu.Lock()
	s.isHealthy = false
	s.mu.Unlock()
	
	logrus.Info("🗄️ Cache service closed")
}

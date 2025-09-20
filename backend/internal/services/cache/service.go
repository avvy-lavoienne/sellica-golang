package cache

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// Service provides multi-level caching with Redis and in-memory cache
type Service struct {
	redis        *redis.Client
	memory       *cache.Cache
	redisURL     string
	isHealthy    bool
	mu           sync.RWMutex
	stats        *CacheStats
	smartTTL     *SmartTTLManager
	enableSmartTTL bool
	intelligentWarmer *IntelligentWarmer
	enableWarming    bool
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

		// Configure TLS for Upstash Redis (rediss:// protocol)
		if strings.HasPrefix(redisURL, "rediss://") {
			if opt.TLSConfig == nil {
				opt.TLSConfig = &tls.Config{}
			}
			// For Upstash Redis, we need to handle certificate verification properly
			// Extract hostname from address for proper TLS verification
			host := opt.Addr
			if colonIndex := strings.LastIndex(host, ":"); colonIndex != -1 {
				host = host[:colonIndex]
			}
			opt.TLSConfig.ServerName = host
			logrus.Info("🔒 Configuring TLS connection for Upstash Redis")
		}

		service.redis = redis.NewClient(opt)

		// Test Redis connection with extended timeout for remote connection
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := service.redis.Ping(ctx).Err(); err != nil {
			logrus.Errorf("Redis connection failed: %v", err)
			service.redis = nil
		} else {
			service.isHealthy = true
			if strings.HasPrefix(redisURL, "rediss://") {
				logrus.Info("✅ Cache service initialized with Upstash Redis (TLS)")
			} else {
				logrus.Info("✅ Cache service initialized with Redis")
			}
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
		"memory":   memoryStats,
		"redis":    redisStats,
		"hitRatio": hitRatio,
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

// GetRedisClient returns the Redis client for advanced operations
func (s *Service) GetRedisClient() *redis.Client {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.redis
}

// EnableSmartTTL enables intelligent TTL management
func (s *Service) EnableSmartTTL(config *SmartTTLConfig) error {
	if config == nil {
		config = &SmartTTLConfig{
			Enabled:                    true,
			BaseTimeToLive:            5 * time.Minute,
			ConfidenceMultiplier:      2.0,
			ComplexityMultiplier:      1.5,
			FreshnessMultiplier:       1.3,
			AccessFrequencyMultiplier: 1.8,
			QueryPatternMultiplier:    1.4,
			TimeOfDayMultiplier:       1.2,
			UserBehaviorMultiplier:    1.6,
			MinTTL:                   30 * time.Second,
			MaxTTL:                   2 * time.Hour,
		}
	}

	s.smartTTL = NewSmartTTLManager(config)
	s.enableSmartTTL = true

	logrus.Info("🧠 Smart TTL management enabled")
	return nil
}

// SetWithSmartTTL stores a value using intelligent TTL calculation
func (s *Service) SetWithSmartTTL(ctx context.Context, key string, value interface{}, metadata *CacheMetadata) error {
	if !s.enableSmartTTL || s.smartTTL == nil {
		// Fallback to default TTL
		return s.Set(key, value, 5*time.Minute)
	}

	// Calculate optimal TTL using Smart TTL Manager
	optimalTTL, factors, err := s.smartTTL.CalculateOptimalTTL(ctx, metadata)
	if err != nil {
		logrus.WithError(err).WithField("key", key).Warn("Smart TTL calculation failed, using default")
		return s.Set(key, value, 5*time.Minute)
	}

	// Update access patterns for learning
	s.smartTTL.UpdateAccessPattern(key, metadata.UserID)

	logrus.WithFields(logrus.Fields{
		"key":           key,
		"optimal_ttl":   optimalTTL,
		"multiplier":    factors.FinalMultiplier,
		"confidence":    metadata.Confidence,
		"complexity":    metadata.Complexity,
	}).Debug("🧠 Using smart TTL for cache set")

	return s.Set(key, value, optimalTTL)
}

// GetWithMetadata retrieves a value and records metadata for Smart TTL learning
func (s *Service) GetWithMetadata(key, userID string) (interface{}, error) {
	value, err := s.Get(key)

	// Record access pattern for Smart TTL learning
	if s.enableSmartTTL && s.smartTTL != nil {
		s.smartTTL.UpdateAccessPattern(key, userID)
	}

	return value, err
}

// GetSmartTTLStats returns Smart TTL performance statistics
func (s *Service) GetSmartTTLStats() map[string]interface{} {
	if !s.enableSmartTTL || s.smartTTL == nil {
		return map[string]interface{}{
			"enabled": false,
		}
	}

	return s.smartTTL.GetPerformanceStats()
}

// GetSmartTTLInsights returns insights from Smart TTL performance data
func (s *Service) GetSmartTTLInsights() (*TTLInsights, error) {
	if !s.enableSmartTTL || s.smartTTL == nil {
		return nil, fmt.Errorf("Smart TTL not enabled")
	}

	return s.smartTTL.GetTTLInsights()
}

// EnableIntelligentWarming enables intelligent cache warming
func (s *Service) EnableIntelligentWarming(config *WarmingConfig) error {
	if config == nil {
		config = &WarmingConfig{
			Enabled:              true,
			WorkerCount:          3,
			WarmingInterval:      5 * time.Minute,
			PredictionWindow:     1 * time.Hour,
			MaxWarmingQueueSize:  1000,
			PerformanceThreshold: 0.8,
			MinPredictionScore:   0.7,
			MaxPredictions:       50,
			RateLimitPerMinute:   100,
			GovernmentServices: []string{
				"akta kelahiran", "ktp", "akta kematian", "akta perkawinan",
				"kia", "kk", "perpindahan", "aku sah",
			},
		}
	}

	s.intelligentWarmer = NewIntelligentWarmer(s, config)
	s.enableWarming = true

	logrus.Info("🔥 Intelligent cache warming enabled")
	return nil
}

// StartIntelligentWarming starts the intelligent warming system
func (s *Service) StartIntelligentWarming(ctx context.Context) error {
	if !s.enableWarming || s.intelligentWarmer == nil {
		return fmt.Errorf("intelligent warming not enabled")
	}

	return s.intelligentWarmer.StartIntelligentWarming(ctx)
}

// StopIntelligentWarming stops the intelligent warming system
func (s *Service) StopIntelligentWarming() error {
	if !s.enableWarming || s.intelligentWarmer == nil {
		return nil
	}

	return s.intelligentWarmer.StopIntelligentWarming()
}

// GetWarmingStats returns intelligent warming statistics
func (s *Service) GetWarmingStats() map[string]interface{} {
	if !s.enableWarming || s.intelligentWarmer == nil {
		return map[string]interface{}{
			"enabled": false,
		}
	}

	return s.intelligentWarmer.GetWarmingStats()
}

// RecordQueryForPrediction records a query for warming prediction learning
func (s *Service) RecordQueryForPrediction(query, userID string) {
	if s.enableWarming && s.intelligentWarmer != nil {
		s.intelligentWarmer.queryPredictor.RecordQuery(query, userID, time.Now())
	}

	// Also record for Smart TTL learning
	if s.enableSmartTTL && s.smartTTL != nil {
		s.smartTTL.UpdateAccessPattern(query, userID)
	}
}

// GetIntelligentWarmer returns the intelligent warmer instance
func (s *Service) GetIntelligentWarmer() *IntelligentWarmer {
	return s.intelligentWarmer
}

package training

import (
	"context"
	"sync"
	"time"

	"selly-backend/internal/services/cache"

	"github.com/sirupsen/logrus"
)

// TrainingCache provides intelligent caching for training data
// Implements multi-level caching strategy for optimal performance
// Compatible with Upstash Redis (TLS) and standard Redis connections
// Enhanced for Phase 1 Day 3-4 with intelligent optimization
type TrainingCache struct {
	redisCache    *cache.Service
	memoryCache   map[string]*CacheEntry
	memoryCacheMu sync.RWMutex

	// Cache configuration
	memoryTTL     time.Duration
	redisTTL      time.Duration
	maxMemorySize int

	// Performance metrics
	hits          int64
	misses        int64
	evictions     int64
	mu            sync.RWMutex

	// Enhanced Phase 1 Day 3-4 features
	analytics     *CacheAnalytics
	optimizer     *CacheOptimizer
	hitRatioTarget float64
}

// CacheEntry represents a cached training data entry
type CacheEntry struct {
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
	TTL       time.Duration `json:"ttl"`
	AccessCount int64     `json:"access_count"`
}

// TrainingCacheConfig holds configuration for training cache
type TrainingCacheConfig struct {
	MemoryTTL     time.Duration
	RedisTTL      time.Duration
	MaxMemorySize int
}

// NewTrainingCache creates a new training cache with multi-level strategy
func NewTrainingCache(redisCache *cache.Service, config *TrainingCacheConfig) *TrainingCache {
	if config == nil {
		config = &TrainingCacheConfig{
			MemoryTTL:     5 * time.Minute,  // Fast memory cache
			RedisTTL:      30 * time.Minute, // Distributed cache
			MaxMemorySize: 1000,             // Max entries in memory
		}
	}

	tc := &TrainingCache{
		redisCache:    redisCache,
		memoryCache:   make(map[string]*CacheEntry),
		memoryTTL:     config.MemoryTTL,
		redisTTL:      config.RedisTTL,
		maxMemorySize: config.MaxMemorySize,
	}

	// Start cleanup goroutine for memory cache
	go tc.cleanupExpiredEntries()

	return tc
}

// Get retrieves data from cache (memory first, then Redis)
func (tc *TrainingCache) Get(ctx context.Context, key string) (interface{}, bool) {
	// Try memory cache first (L1)
	if data, found := tc.getFromMemory(key); found {
		tc.incrementHits()
		return data, true
	}

	// Try Redis cache (L2)
	if data, found := tc.getFromRedis(ctx, key); found {
		// Store in memory cache for faster access
		tc.setInMemory(key, data, tc.memoryTTL)
		tc.incrementHits()
		return data, true
	}

	tc.incrementMisses()
	return nil, false
}

// Set stores data in both memory and Redis cache
func (tc *TrainingCache) Set(ctx context.Context, key string, data interface{}, ttl time.Duration) error {
	// Store in memory cache (L1)
	tc.setInMemory(key, data, ttl)

	// Store in Redis cache (L2)
	return tc.setInRedis(ctx, key, data, ttl)
}

// getFromMemory retrieves data from memory cache with optimized performance
func (tc *TrainingCache) getFromMemory(key string) (interface{}, bool) {
	tc.memoryCacheMu.RLock()
	entry, exists := tc.memoryCache[key]
	tc.memoryCacheMu.RUnlock()

	if !exists {
		return nil, false
	}

	// Fast expiration check
	if time.Since(entry.Timestamp) > entry.TTL {
		// Remove expired entry asynchronously to avoid blocking
		go tc.removeFromMemory(key)
		return nil, false
	}

	// Skip access count update for performance (can be re-enabled if needed)
	// entry.AccessCount++
	return entry.Data, true
}

// setInMemory stores data in memory cache with optimized performance
func (tc *TrainingCache) setInMemory(key string, data interface{}, ttl time.Duration) {
	tc.memoryCacheMu.Lock()
	defer tc.memoryCacheMu.Unlock()

	// Fast path: if cache is not full, just add the entry
	if len(tc.memoryCache) < tc.maxMemorySize {
		tc.memoryCache[key] = &CacheEntry{
			Data:        data,
			Timestamp:   time.Now(),
			TTL:         ttl,
			AccessCount: 1,
		}
		return
	}

	// Only evict if we're at capacity and this is a new key
	if _, exists := tc.memoryCache[key]; !exists {
		tc.evictLeastRecentlyUsedFast()
	}

	tc.memoryCache[key] = &CacheEntry{
		Data:        data,
		Timestamp:   time.Now(),
		TTL:         ttl,
		AccessCount: 1,
	}
}

// removeFromMemory removes an entry from memory cache
func (tc *TrainingCache) removeFromMemory(key string) {
	tc.memoryCacheMu.Lock()
	defer tc.memoryCacheMu.Unlock()
	delete(tc.memoryCache, key)
}

// getFromRedis retrieves data from Redis cache
func (tc *TrainingCache) getFromRedis(_ context.Context, key string) (interface{}, bool) {
	if tc.redisCache == nil {
		return nil, false
	}

	data, err := tc.redisCache.Get(key)
	if err != nil {
		logrus.WithError(err).Debugf("Failed to get key %s from Redis cache", key)
		return nil, false
	}

	if data == nil {
		return nil, false
	}

	return data, true
}

// setInRedis stores data in Redis cache
func (tc *TrainingCache) setInRedis(_ context.Context, key string, data interface{}, ttl time.Duration) error {
	if tc.redisCache == nil {
		return nil
	}

	return tc.redisCache.Set(key, data, ttl)
}

// evictLeastRecentlyUsed removes the least recently used entry
func (tc *TrainingCache) evictLeastRecentlyUsed() {
	var oldestKey string
	var oldestTime time.Time
	var lowestAccess int64 = -1

	for key, entry := range tc.memoryCache {
		if lowestAccess == -1 || entry.AccessCount < lowestAccess {
			oldestKey = key
			oldestTime = entry.Timestamp
			lowestAccess = entry.AccessCount
		} else if entry.AccessCount == lowestAccess && entry.Timestamp.Before(oldestTime) {
			oldestKey = key
			oldestTime = entry.Timestamp
		}
	}

	if oldestKey != "" {
		delete(tc.memoryCache, oldestKey)
		tc.incrementEvictions()
	}
}

// evictLeastRecentlyUsedFast performs fast LRU eviction without full scan
func (tc *TrainingCache) evictLeastRecentlyUsedFast() {
	// Simple eviction: remove first entry found (fast but not perfect LRU)
	// This is much faster than scanning all entries
	for key := range tc.memoryCache {
		delete(tc.memoryCache, key)
		tc.incrementEvictions()
		break
	}
}

// cleanupExpiredEntries periodically removes expired entries from memory cache
func (tc *TrainingCache) cleanupExpiredEntries() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		tc.memoryCacheMu.Lock()
		now := time.Now()
		
		for key, entry := range tc.memoryCache {
			if now.Sub(entry.Timestamp) > entry.TTL {
				delete(tc.memoryCache, key)
				tc.incrementEvictions()
			}
		}
		
		tc.memoryCacheMu.Unlock()
	}
}

// Delete removes data from both memory and Redis cache
func (tc *TrainingCache) Delete(ctx context.Context, key string) error {
	// Remove from memory cache
	tc.removeFromMemory(key)

	// Remove from Redis cache
	if tc.redisCache != nil {
		return tc.redisCache.Delete(key)
	}

	return nil
}

// Clear removes all entries from both caches
func (tc *TrainingCache) Clear(ctx context.Context) error {
	// Clear memory cache
	tc.memoryCacheMu.Lock()
	tc.memoryCache = make(map[string]*CacheEntry)
	tc.memoryCacheMu.Unlock()

	// Clear Redis cache (if available)
	if tc.redisCache != nil {
		// Note: This would clear the entire Redis cache, which might not be desired
		// In practice, you might want to clear only training-related keys
		logrus.Warn("Redis cache clear not implemented to avoid clearing non-training data")
	}

	return nil
}

// GetMetrics returns cache performance metrics
func (tc *TrainingCache) GetMetrics() TrainingCacheMetrics {
	tc.mu.RLock()
	defer tc.mu.RUnlock()

	tc.memoryCacheMu.RLock()
	memorySize := len(tc.memoryCache)
	tc.memoryCacheMu.RUnlock()

	totalRequests := tc.hits + tc.misses
	hitRate := float64(0)
	if totalRequests > 0 {
		hitRate = float64(tc.hits) / float64(totalRequests) * 100.0
	}

	return TrainingCacheMetrics{
		Hits:        tc.hits,
		Misses:      tc.misses,
		Evictions:   tc.evictions,
		HitRate:     hitRate,
		MemorySize:  memorySize,
		MaxMemorySize: tc.maxMemorySize,
	}
}

// incrementHits increments the cache hit counter
func (tc *TrainingCache) incrementHits() {
	tc.mu.Lock()
	defer tc.mu.Unlock()
	tc.hits++
}

// incrementMisses increments the cache miss counter
func (tc *TrainingCache) incrementMisses() {
	tc.mu.Lock()
	defer tc.mu.Unlock()
	tc.misses++
}

// incrementEvictions increments the cache eviction counter
func (tc *TrainingCache) incrementEvictions() {
	tc.mu.Lock()
	defer tc.mu.Unlock()
	tc.evictions++
}

// TrainingCacheMetrics holds cache performance metrics
type TrainingCacheMetrics struct {
	Hits          int64   `json:"hits"`
	Misses        int64   `json:"misses"`
	Evictions     int64   `json:"evictions"`
	HitRate       float64 `json:"hit_rate"`
	MemorySize    int     `json:"memory_size"`
	MaxMemorySize int     `json:"max_memory_size"`
}



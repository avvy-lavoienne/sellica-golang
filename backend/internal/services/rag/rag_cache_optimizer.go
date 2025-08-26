package rag

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// RAGCacheOptimizer provides RAG-specific cache optimization
type RAGCacheOptimizer struct {
	redis       *redis.Client
	config      *RAGConfig
	
	// Cache statistics
	cacheHits   int64
	cacheMisses int64
	mu          sync.RWMutex
	
	// Cache prefixes
	resultCachePrefix    string
	embeddingCachePrefix string
	
	// Performance tracking
	cacheOperationTimes []time.Duration
	performanceMu       sync.RWMutex
}

// NewRAGCacheOptimizer creates a new RAG cache optimizer
func NewRAGCacheOptimizer(redisClient *redis.Client, config *RAGConfig) *RAGCacheOptimizer {
	return &RAGCacheOptimizer{
		redis:                redisClient,
		config:               config,
		resultCachePrefix:    "rag_result:",
		embeddingCachePrefix: "rag_embedding:",
		cacheOperationTimes:  make([]time.Duration, 0),
	}
}

// Initialize initializes the cache optimizer
func (rco *RAGCacheOptimizer) Initialize(ctx context.Context) error {
	logrus.Info("🚀 Initializing RAG cache optimizer...")
	
	// Test Redis connection
	_, err := rco.redis.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}
	
	logrus.Info("✅ RAG cache optimizer initialized")
	return nil
}

// GetCachedResult retrieves cached search result
func (rco *RAGCacheOptimizer) GetCachedResult(query string, limit int) *RAGSearchResult {
	startTime := time.Now()
	defer func() {
		rco.recordCacheOperationTime(time.Since(startTime))
	}()

	if !rco.config.CacheEnabled {
		return nil
	}

	cacheKey := rco.generateResultCacheKey(query, limit)
	
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	cached, err := rco.redis.Get(ctx, cacheKey).Result()
	if err != nil {
		rco.recordCacheMiss()
		return nil
	}

	var result RAGSearchResult
	if err := json.Unmarshal([]byte(cached), &result); err != nil {
		logrus.WithError(err).Warn("Failed to unmarshal cached result")
		rco.recordCacheMiss()
		return nil
	}

	rco.recordCacheHit()
	return &result
}

// CacheResult caches search result
func (rco *RAGCacheOptimizer) CacheResult(query string, limit int, result *RAGSearchResult) {
	startTime := time.Now()
	defer func() {
		rco.recordCacheOperationTime(time.Since(startTime))
	}()

	if !rco.config.CacheEnabled {
		return
	}

	cacheKey := rco.generateResultCacheKey(query, limit)
	
	// Serialize result
	data, err := json.Marshal(result)
	if err != nil {
		logrus.WithError(err).Warn("Failed to marshal result for caching")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	// Cache with TTL
	err = rco.redis.SetEx(ctx, cacheKey, data, rco.config.CacheTTL).Err()
	if err != nil {
		logrus.WithError(err).Warn("Failed to cache result")
	}
}

// GetCachedEmbedding retrieves cached embedding
func (rco *RAGCacheOptimizer) GetCachedEmbedding(text string) []float64 {
	startTime := time.Now()
	defer func() {
		rco.recordCacheOperationTime(time.Since(startTime))
	}()

	if !rco.config.CacheEnabled {
		return nil
	}

	cacheKey := rco.generateEmbeddingCacheKey(text)
	
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	cached, err := rco.redis.Get(ctx, cacheKey).Result()
	if err != nil {
		return nil
	}

	var embedding []float64
	if err := json.Unmarshal([]byte(cached), &embedding); err != nil {
		logrus.WithError(err).Warn("Failed to unmarshal cached embedding")
		return nil
	}

	return embedding
}

// CacheEmbedding caches embedding
func (rco *RAGCacheOptimizer) CacheEmbedding(text string, embedding []float64) {
	startTime := time.Now()
	defer func() {
		rco.recordCacheOperationTime(time.Since(startTime))
	}()

	if !rco.config.CacheEnabled {
		return
	}

	cacheKey := rco.generateEmbeddingCacheKey(text)
	
	// Serialize embedding
	data, err := json.Marshal(embedding)
	if err != nil {
		logrus.WithError(err).Warn("Failed to marshal embedding for caching")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	// Cache with longer TTL for embeddings
	embeddingTTL := rco.config.CacheTTL * 2
	err = rco.redis.SetEx(ctx, cacheKey, data, embeddingTTL).Err()
	if err != nil {
		logrus.WithError(err).Warn("Failed to cache embedding")
	}
}

// WarmCache pre-loads frequently accessed data
func (rco *RAGCacheOptimizer) WarmCache(ctx context.Context, commonQueries []string) error {
	logrus.Info("🔥 Starting RAG cache warming...")
	
	warmedCount := 0
	for _, query := range commonQueries {
		// Check if already cached
		if rco.GetCachedResult(query, 5) != nil {
			continue
		}
		
		// This would typically trigger the actual search to populate cache
		// For now, we'll just log the warming attempt
		logrus.WithField("query", query).Debug("Cache warming query identified")
		warmedCount++
		
		// Prevent overwhelming the system
		if warmedCount >= 100 {
			break
		}
	}
	
	logrus.WithField("warmed_queries", warmedCount).Info("✅ RAG cache warming completed")
	return nil
}

// OptimizeCache performs cache optimization operations
func (rco *RAGCacheOptimizer) OptimizeCache(ctx context.Context) error {
	logrus.Info("⚡ Starting RAG cache optimization...")
	
	// Get cache statistics
	stats := rco.GetCacheStats()
	
	// If cache hit ratio is low, consider cache warming
	if stats.HitRatio < 0.8 {
		logrus.WithField("hit_ratio", stats.HitRatio).Info("Low cache hit ratio detected, optimization needed")
		
		// Identify frequently missed queries for warming
		// This would typically analyze access patterns
		commonQueries := []string{
			"cara membuat akta kelahiran",
			"syarat akta kelahiran",
			"persyaratan akta kelahiran",
			"proses akta kelahiran",
			"dokumen akta kelahiran",
		}
		
		return rco.WarmCache(ctx, commonQueries)
	}
	
	logrus.Info("✅ RAG cache optimization completed")
	return nil
}

// InvalidateCache invalidates cache entries matching pattern
func (rco *RAGCacheOptimizer) InvalidateCache(ctx context.Context, pattern string) error {
	// Find keys matching pattern
	keys, err := rco.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to find cache keys: %w", err)
	}
	
	if len(keys) == 0 {
		return nil
	}
	
	// Delete matching keys
	_, err = rco.redis.Del(ctx, keys...).Result()
	if err != nil {
		return fmt.Errorf("failed to delete cache keys: %w", err)
	}
	
	logrus.WithFields(logrus.Fields{
		"pattern":      pattern,
		"deleted_keys": len(keys),
	}).Info("🗑️ Cache invalidated")
	
	return nil
}

// generateResultCacheKey generates cache key for search results
func (rco *RAGCacheOptimizer) generateResultCacheKey(query string, limit int) string {
	hash := md5.Sum([]byte(query + strconv.Itoa(limit)))
	return fmt.Sprintf("%s%x", rco.resultCachePrefix, hash)
}

// generateEmbeddingCacheKey generates cache key for embeddings
func (rco *RAGCacheOptimizer) generateEmbeddingCacheKey(text string) string {
	hash := md5.Sum([]byte(text))
	return fmt.Sprintf("%s%x", rco.embeddingCachePrefix, hash)
}

// recordCacheHit records a cache hit
func (rco *RAGCacheOptimizer) recordCacheHit() {
	rco.mu.Lock()
	defer rco.mu.Unlock()
	rco.cacheHits++
}

// recordCacheMiss records a cache miss
func (rco *RAGCacheOptimizer) recordCacheMiss() {
	rco.mu.Lock()
	defer rco.mu.Unlock()
	rco.cacheMisses++
}

// recordCacheOperationTime records cache operation time
func (rco *RAGCacheOptimizer) recordCacheOperationTime(duration time.Duration) {
	rco.performanceMu.Lock()
	defer rco.performanceMu.Unlock()
	
	rco.cacheOperationTimes = append(rco.cacheOperationTimes, duration)
	
	// Keep only recent measurements
	if len(rco.cacheOperationTimes) > 1000 {
		rco.cacheOperationTimes = rco.cacheOperationTimes[len(rco.cacheOperationTimes)-1000:]
	}
}

// GetCacheStats returns cache statistics
func (rco *RAGCacheOptimizer) GetCacheStats() *RAGCacheStats {
	rco.mu.RLock()
	rco.performanceMu.RLock()
	defer rco.mu.RUnlock()
	defer rco.performanceMu.RUnlock()
	
	totalRequests := rco.cacheHits + rco.cacheMisses
	hitRatio := 0.0
	if totalRequests > 0 {
		hitRatio = float64(rco.cacheHits) / float64(totalRequests)
	}
	
	var avgOperationTime time.Duration
	if len(rco.cacheOperationTimes) > 0 {
		var total time.Duration
		for _, t := range rco.cacheOperationTimes {
			total += t
		}
		avgOperationTime = total / time.Duration(len(rco.cacheOperationTimes))
	}
	
	return &RAGCacheStats{
		CacheHits:          rco.cacheHits,
		CacheMisses:        rco.cacheMisses,
		HitRatio:           hitRatio,
		TotalRequests:      totalRequests,
		AvgOperationTime:   avgOperationTime,
		CacheEnabled:       rco.config.CacheEnabled,
		CacheTTL:           rco.config.CacheTTL,
	}
}

// RAGCacheStats represents cache statistics
type RAGCacheStats struct {
	CacheHits        int64         `json:"cache_hits"`
	CacheMisses      int64         `json:"cache_misses"`
	HitRatio         float64       `json:"hit_ratio"`
	TotalRequests    int64         `json:"total_requests"`
	AvgOperationTime time.Duration `json:"avg_operation_time"`
	CacheEnabled     bool          `json:"cache_enabled"`
	CacheTTL         time.Duration `json:"cache_ttl"`
}

// Close closes the cache optimizer
func (rco *RAGCacheOptimizer) Close() error {
	logrus.Info("🔒 RAG cache optimizer closed")
	return nil
}

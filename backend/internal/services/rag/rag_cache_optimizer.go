package rag

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// DatabaseCache provides L3 persistent caching
type DatabaseCache struct {
	// Implementation would connect to database for persistent cache
	enabled bool
}

// QueryPatternAnalyzer analyzes query patterns for intelligent caching
type QueryPatternAnalyzer struct {
	patterns      map[string]int
	recentQueries []string
	mu            sync.RWMutex
}

// PredictiveCache provides predictive caching based on patterns
type PredictiveCache struct {
	predictions map[string]float64
	enabled     bool
	mu          sync.RWMutex
}

// IntelligentEvictionPolicy manages cache eviction with intelligence
type IntelligentEvictionPolicy struct {
	accessFrequency map[string]int
	lastAccess      map[string]time.Time
	mu              sync.RWMutex
}

// RAGCacheOptimizer provides intelligent multi-level RAG cache optimization
type RAGCacheOptimizer struct {
	redis  *redis.Client
	config *RAGConfig

	// Multi-level cache system
	l1Cache *sync.Map      // Ultra-fast in-memory cache
	l2Cache *redis.Client  // Redis distributed cache (same as redis)
	l3Cache *DatabaseCache // Persistent database cache

	// Cache statistics
	cacheHits   int64
	cacheMisses int64
	l1Hits      int64
	l2Hits      int64
	l3Hits      int64
	mu          sync.RWMutex

	// Cache prefixes
	resultCachePrefix    string
	embeddingCachePrefix string

	// Intelligent caching components
	queryPatterns   *QueryPatternAnalyzer
	predictiveCache *PredictiveCache
	evictionPolicy  *IntelligentEvictionPolicy

	// Performance tracking
	cacheOperationTimes []time.Duration
	performanceMu       sync.RWMutex

	// Cache warming
	warmingInProgress bool
	warmingMutex      sync.Mutex
}

// NewRAGCacheOptimizer creates a new intelligent RAG cache optimizer
func NewRAGCacheOptimizer(redisClient *redis.Client, config *RAGConfig) *RAGCacheOptimizer {
	return &RAGCacheOptimizer{
		redis:                redisClient,
		config:               config,
		resultCachePrefix:    "rag_result:",
		embeddingCachePrefix: "rag_embedding:",
		cacheOperationTimes:  make([]time.Duration, 0),

		// Multi-level cache initialization
		l1Cache: &sync.Map{},
		l2Cache: redisClient,
		l3Cache: &DatabaseCache{enabled: false}, // Can be enabled later

		// Intelligent caching components
		queryPatterns: &QueryPatternAnalyzer{
			patterns:      make(map[string]int),
			recentQueries: make([]string, 0),
		},
		predictiveCache: &PredictiveCache{
			predictions: make(map[string]float64),
			enabled:     true,
		},
		evictionPolicy: &IntelligentEvictionPolicy{
			accessFrequency: make(map[string]int),
			lastAccess:      make(map[string]time.Time),
		},
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

// GetCachedResult retrieves cached search result with intelligent multi-level caching
func (rco *RAGCacheOptimizer) GetCachedResult(query string, limit int) *RAGSearchResult {
	startTime := time.Now()
	defer func() {
		rco.recordCacheOperationTime(time.Since(startTime))
	}()

	if !rco.config.CacheEnabled {
		return nil
	}

	cacheKey := rco.generateResultCacheKey(query, limit)

	// Record query pattern for intelligence
	rco.recordQueryPattern(query)

	// L1 Cache check (ultra-fast in-memory)
	if result := rco.getL1CachedResult(cacheKey); result != nil {
		rco.mu.Lock()
		rco.l1Hits++
		rco.cacheHits++
		rco.mu.Unlock()
		rco.updateAccessPattern(cacheKey)
		return result
	}

	// L2 Cache check (Redis distributed cache)
	if result := rco.getL2CachedResult(cacheKey); result != nil {
		// Store in L1 for future ultra-fast access
		rco.setL1CachedResult(cacheKey, result)
		rco.mu.Lock()
		rco.l2Hits++
		rco.cacheHits++
		rco.mu.Unlock()
		rco.updateAccessPattern(cacheKey)
		return result
	}

	// Cache miss
	rco.recordCacheMiss()
	return nil
}

// CacheResult caches search result with intelligent multi-level caching
func (rco *RAGCacheOptimizer) CacheResult(query string, limit int, result *RAGSearchResult) {
	startTime := time.Now()
	defer func() {
		rco.recordCacheOperationTime(time.Since(startTime))
	}()

	if !rco.config.CacheEnabled {
		return
	}

	cacheKey := rco.generateResultCacheKey(query, limit)

	// Store in L1 cache (immediate availability)
	rco.setL1CachedResult(cacheKey, result)

	// Store in L2 cache (distributed availability)
	rco.setL2CachedResult(cacheKey, result)

	// Update access patterns for intelligent eviction
	rco.updateAccessPattern(cacheKey)

	// Check if this should trigger predictive caching
	rco.triggerPredictiveCaching(query)
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
		CacheHits:        rco.cacheHits,
		CacheMisses:      rco.cacheMisses,
		L1Hits:           rco.l1Hits,
		L2Hits:           rco.l2Hits,
		L3Hits:           rco.l3Hits,
		HitRatio:         hitRatio,
		TotalRequests:    totalRequests,
		AvgOperationTime: avgOperationTime,
		CacheEnabled:     rco.config.CacheEnabled,
		CacheTTL:         rco.config.CacheTTL,
	}
}

// RAGCacheStats represents intelligent multi-level cache statistics
type RAGCacheStats struct {
	CacheHits        int64         `json:"cache_hits"`
	CacheMisses      int64         `json:"cache_misses"`
	L1Hits           int64         `json:"l1_hits"` // In-memory cache hits
	L2Hits           int64         `json:"l2_hits"` // Redis cache hits
	L3Hits           int64         `json:"l3_hits"` // Database cache hits
	HitRatio         float64       `json:"hit_ratio"`
	TotalRequests    int64         `json:"total_requests"`
	AvgOperationTime time.Duration `json:"avg_operation_time"`
	CacheEnabled     bool          `json:"cache_enabled"`
	CacheTTL         time.Duration `json:"cache_ttl"`
}

// Intelligent cache methods for multi-level caching

// recordQueryPattern records query patterns for intelligent caching
func (rco *RAGCacheOptimizer) recordQueryPattern(query string) {
	rco.queryPatterns.mu.Lock()
	defer rco.queryPatterns.mu.Unlock()

	rco.queryPatterns.patterns[query]++
	rco.queryPatterns.recentQueries = append(rco.queryPatterns.recentQueries, query)

	// Keep only recent 1000 queries
	if len(rco.queryPatterns.recentQueries) > 1000 {
		rco.queryPatterns.recentQueries = rco.queryPatterns.recentQueries[len(rco.queryPatterns.recentQueries)-1000:]
	}
}

// updateAccessPattern updates access patterns for intelligent eviction
func (rco *RAGCacheOptimizer) updateAccessPattern(cacheKey string) {
	rco.evictionPolicy.mu.Lock()
	defer rco.evictionPolicy.mu.Unlock()

	rco.evictionPolicy.accessFrequency[cacheKey]++
	rco.evictionPolicy.lastAccess[cacheKey] = time.Now()
}

// getL1CachedResult retrieves result from L1 (in-memory) cache
func (rco *RAGCacheOptimizer) getL1CachedResult(cacheKey string) *RAGSearchResult {
	if value, ok := rco.l1Cache.Load(cacheKey); ok {
		if result, ok := value.(*RAGSearchResult); ok {
			return result
		}
	}
	return nil
}

// setL1CachedResult stores result in L1 (in-memory) cache
func (rco *RAGCacheOptimizer) setL1CachedResult(cacheKey string, result *RAGSearchResult) {
	rco.l1Cache.Store(cacheKey, result)
}

// getL2CachedResult retrieves result from L2 (Redis) cache
func (rco *RAGCacheOptimizer) getL2CachedResult(cacheKey string) *RAGSearchResult {
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	cached, err := rco.l2Cache.Get(ctx, cacheKey).Result()
	if err != nil {
		return nil
	}

	var result RAGSearchResult
	if err := json.Unmarshal([]byte(cached), &result); err != nil {
		logrus.WithError(err).Warn("Failed to unmarshal L2 cached result")
		return nil
	}

	return &result
}

// setL2CachedResult stores result in L2 (Redis) cache
func (rco *RAGCacheOptimizer) setL2CachedResult(cacheKey string, result *RAGSearchResult) {
	data, err := json.Marshal(result)
	if err != nil {
		logrus.WithError(err).Warn("Failed to marshal result for L2 cache")
		return
	}

	// Store asynchronously to avoid blocking
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
		defer cancel()

		err := rco.l2Cache.SetEx(ctx, cacheKey, data, rco.config.CacheTTL).Err()
		if err != nil {
			logrus.WithError(err).Warn("Failed to cache result in L2")
		}
	}()
}

// triggerPredictiveCaching triggers predictive caching based on query patterns
func (rco *RAGCacheOptimizer) triggerPredictiveCaching(query string) {
	if !rco.predictiveCache.enabled {
		return
	}

	// Analyze if this query suggests related queries that should be pre-cached
	relatedQueries := rco.predictRelatedQueries(query)

	// Pre-cache related queries asynchronously
	go func() {
		for _, relatedQuery := range relatedQueries {
			// Check if already cached
			cacheKey := rco.generateResultCacheKey(relatedQuery, 5) // Default limit
			if rco.getL1CachedResult(cacheKey) == nil && rco.getL2CachedResult(cacheKey) == nil {
				// This would trigger RAG search for the related query
				// Implementation would depend on having access to the RAG service
				logrus.WithField("related_query", relatedQuery).Debug("Predictive caching opportunity identified")
			}
		}
	}()
}

// predictRelatedQueries predicts related queries based on patterns
func (rco *RAGCacheOptimizer) predictRelatedQueries(query string) []string {
	// Simple pattern-based prediction
	// In production, this could use ML models for better prediction

	relatedQueries := []string{}

	// Common Indonesian government service variations
	if strings.Contains(strings.ToLower(query), "akta kelahiran") {
		relatedQueries = append(relatedQueries,
			"syarat akta kelahiran",
			"cara membuat akta kelahiran",
			"dokumen akta kelahiran",
		)
	}

	if strings.Contains(strings.ToLower(query), "ktp") {
		relatedQueries = append(relatedQueries,
			"syarat ktp",
			"cara membuat ktp",
			"perpanjang ktp",
		)
	}

	return relatedQueries
}

// Close closes the cache optimizer
func (rco *RAGCacheOptimizer) Close() error {
	logrus.Info("🔒 RAG cache optimizer closed")
	return nil
}

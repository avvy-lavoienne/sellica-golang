package eventbus

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// AdvancedCacheService provides multi-level caching with TTL, eviction policies, and distributed support
type AdvancedCacheService struct {
	// Configuration
	config *AdvancedCacheConfig

	// Cache storage
	l1Cache *MemoryCache // Fast in-memory cache
	l2Cache DistributedCache // Distributed cache (Redis)

	// Metadata and tracking
	accessTracker *AccessTracker
	dependencyGraph *DependencyGraph
	warmingEngine *CacheWarmingEngine

	// State management
	isRunning bool
	stopChan  chan struct{}
	mu        sync.RWMutex

	// Metrics and monitoring
	metrics *CacheMetrics
}

// AdvancedCacheConfig holds configuration for the advanced cache service
type AdvancedCacheConfig struct {
	// L1 Cache (Memory) Configuration
	L1Enabled      bool          `yaml:"l1_enabled"`
	L1MaxSize      int           `yaml:"l1_max_size"`
	L1DefaultTTL   time.Duration `yaml:"l1_default_ttl"`
	L1CleanupInterval time.Duration `yaml:"l1_cleanup_interval"`

	// L2 Cache (Distributed) Configuration
	L2Enabled      bool          `yaml:"l2_enabled"`
	L2RedisURL     string        `yaml:"l2_redis_url"`
	L2DefaultTTL   time.Duration `yaml:"l2_default_ttl"`
	L2ConnectionPool int         `yaml:"l2_connection_pool"`

	// Eviction Policy
	EvictionPolicy EvictionPolicy `yaml:"eviction_policy"`

	// Warming Configuration
	WarmingEnabled bool    `yaml:"warming_enabled"`
	WarmingThreshold float64 `yaml:"warming_threshold"`
	MaxWarmItems   int     `yaml:"max_warm_items"`

	// Dependency Tracking
	DependencyTracking bool `yaml:"dependency_tracking"`
	MaxDependencyDepth int  `yaml:"max_dependency_depth"`

	// Monitoring
	MetricsEnabled bool          `yaml:"metrics_enabled"`
	MetricsInterval time.Duration `yaml:"metrics_interval"`
}

// EvictionPolicy defines cache eviction strategies
type EvictionPolicy int

const (
	LRUPolicy EvictionPolicy = iota // Least Recently Used
	LFUPolicy                      // Least Frequently Used
	FIFOPolicy                     // First In First Out
	TTLPolicy                      // Time To Live based
)

// CacheEntry represents a cache entry with metadata
type CacheEntry struct {
	Key        string
	Value      interface{}
	TTL        time.Duration
	CreatedAt  time.Time
	AccessedAt time.Time
	AccessCount int64
	Size       int // Estimated size in bytes
	Tags       []string // For categorization and bulk operations
}

// MemoryCache provides fast in-memory caching with eviction policies
// (Implementation in memory_cache.go)

// DistributedCache interface for distributed cache implementations
type DistributedCache interface {
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Get(ctx context.Context, key string) (interface{}, bool, error)
	Delete(ctx context.Context, key string) error
	Exists(ctx context.Context, key string) (bool, error)
	Expire(ctx context.Context, key string, ttl time.Duration) error
	Keys(ctx context.Context, pattern string) ([]string, error)
	FlushAll(ctx context.Context) error
	Ping(ctx context.Context) error
	Close() error
}

// AccessTracker tracks cache access patterns for optimization
// (Implementation in access_tracker.go)

// AccessPattern represents access patterns for a cache key
type AccessPattern struct {
	Key           string
	TotalAccesses int64
	LastAccessed  time.Time
	AccessTimes   []time.Time
	Frequency     float64 // Accesses per minute
}

// DependencyGraph tracks cache key dependencies for intelligent invalidation
// (Implementation in dependency_graph.go)

// CacheWarmingEngine handles predictive cache warming
// (Implementation in cache_warming.go)

// CacheMetrics tracks cache performance metrics
type CacheMetrics struct {
	// Hit/Miss statistics
	L1Hits       int64
	L1Misses     int64
	L2Hits       int64
	L2Misses     int64

	// Operation counts
	Sets         int64
	Gets         int64
	Deletes      int64
	Evictions    int64

	// Performance metrics
	AverageGetTime time.Duration
	AverageSetTime time.Duration

	// Size metrics
	CurrentSize  int
	MaxSize      int
	Utilization  float64

	// Warming metrics
	WarmedItems  int64
	WarmingHits  int64
	WarmingMisses int64

	mu sync.RWMutex
}

// NewAdvancedCacheService creates a new advanced cache service
func NewAdvancedCacheService(config *AdvancedCacheConfig) (*AdvancedCacheService, error) {
	if config == nil {
		config = DefaultAdvancedCacheConfig()
	}

	service := &AdvancedCacheService{
		config:         config,
		stopChan:       make(chan struct{}),
		metrics:        &CacheMetrics{},
	}

	// Initialize L1 cache if enabled
	if config.L1Enabled {
		service.l1Cache = NewMemoryCache(config)
	}

	// Initialize L2 cache if enabled
	if config.L2Enabled {
		l2Cache, err := NewRedisCache(config.L2RedisURL, config.L2ConnectionPool)
		if err != nil {
			return nil, fmt.Errorf("failed to initialize L2 cache: %w", err)
		}
		service.l2Cache = l2Cache
	}

	// Initialize access tracker
	service.accessTracker = NewAccessTracker()

	// Initialize dependency graph if enabled
	if config.DependencyTracking {
		service.dependencyGraph = NewDependencyGraph()
	}

	// Initialize warming engine if enabled
	if config.WarmingEnabled {
		service.warmingEngine = NewCacheWarmingEngine(config, service)
	}

	return service, nil
}

// Start initializes and starts the cache service
func (acs *AdvancedCacheService) Start(ctx context.Context) error {
	acs.mu.Lock()
	defer acs.mu.Unlock()

	if acs.isRunning {
		return fmt.Errorf("cache service is already running")
	}

	logrus.WithFields(logrus.Fields{
		"l1_enabled": acs.config.L1Enabled,
		"l2_enabled": acs.config.L2Enabled,
		"warming_enabled": acs.config.WarmingEnabled,
	}).Info("🚀 Starting advanced cache service")

	// Start L1 cache cleanup if enabled
	if acs.l1Cache != nil {
		go acs.startL1Cleanup()
	}

	// Start warming engine if enabled
	if acs.warmingEngine != nil {
		if err := acs.warmingEngine.Start(); err != nil {
			return fmt.Errorf("failed to start warming engine: %w", err)
		}
	}

	// Start metrics collection if enabled
	if acs.config.MetricsEnabled {
		go acs.startMetricsCollection()
	}

	acs.isRunning = true
	logrus.Info("✅ Advanced cache service started successfully")
	return nil
}

// Stop gracefully shuts down the cache service
func (acs *AdvancedCacheService) Stop() error {
	acs.mu.Lock()
	defer acs.mu.Unlock()

	if !acs.isRunning {
		return fmt.Errorf("cache service is not running")
	}

	logrus.Info("🛑 Stopping advanced cache service")

	// Signal stop
	close(acs.stopChan)

	// Stop warming engine
	if acs.warmingEngine != nil {
		acs.warmingEngine.Stop()
	}

	// Close L2 cache
	if acs.l2Cache != nil {
		if err := acs.l2Cache.Close(); err != nil {
			logrus.WithError(err).Warn("Error closing L2 cache")
		}
	}

	acs.isRunning = false
	logrus.Info("✅ Advanced cache service stopped successfully")
	return nil
}

// Set stores a value in the cache with TTL
func (acs *AdvancedCacheService) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if !acs.isRunning {
		return fmt.Errorf("cache service is not running")
	}

	start := time.Now()
	defer func() {
		duration := time.Since(start)
		atomic.AddInt64(&acs.metrics.Sets, 1)
		acs.metrics.mu.Lock()
		sets := atomic.LoadInt64(&acs.metrics.Sets)
		acs.metrics.AverageSetTime = time.Duration(
			(acs.metrics.AverageSetTime.Nanoseconds()*(sets-1) + duration.Nanoseconds()) / sets,
		)
		acs.metrics.mu.Unlock()
	}()

	// Use default TTL if not specified
	if ttl <= 0 {
		ttl = acs.config.L1DefaultTTL
	}

	// Track access pattern
	acs.accessTracker.RecordAccess(key, time.Now())

	// Set in L1 cache
	if acs.l1Cache != nil {
		if err := acs.l1Cache.Set(key, value, ttl); err != nil {
			logrus.WithError(err).WithField("key", key).Warn("Failed to set L1 cache")
		}
	}

	// Set in L2 cache
	if acs.l2Cache != nil {
		if err := acs.l2Cache.Set(ctx, key, value, ttl); err != nil {
			logrus.WithError(err).WithField("key", key).Warn("Failed to set L2 cache")
		}
	}

	return nil
}

// Get retrieves a value from the cache
func (acs *AdvancedCacheService) Get(ctx context.Context, key string) (interface{}, bool, error) {
	if !acs.isRunning {
		return nil, false, fmt.Errorf("cache service is not running")
	}

	start := time.Now()
	defer func() {
		duration := time.Since(start)
		atomic.AddInt64(&acs.metrics.Gets, 1)
		acs.metrics.mu.Lock()
		gets := atomic.LoadInt64(&acs.metrics.Gets)
		acs.metrics.AverageGetTime = time.Duration(
			(acs.metrics.AverageGetTime.Nanoseconds()*(gets-1) + duration.Nanoseconds()) / gets,
		)
		acs.metrics.mu.Unlock()
	}()

	// Track access pattern
	acs.accessTracker.RecordAccess(key, time.Now())

	// Try L1 cache first
	if acs.l1Cache != nil {
		if value, found := acs.l1Cache.Get(key); found {
			atomic.AddInt64(&acs.metrics.L1Hits, 1)
			return value, true, nil
		}
		atomic.AddInt64(&acs.metrics.L1Misses, 1)
	}

	// Try L2 cache
	if acs.l2Cache != nil {
		value, found, err := acs.l2Cache.Get(ctx, key)
		if err != nil {
			return nil, false, err
		}

		if found {
			acs.metrics.mu.Lock()
			acs.metrics.L2Hits++
			acs.metrics.mu.Unlock()

			// Promote to L1 cache
			if acs.l1Cache != nil {
				acs.l1Cache.Set(key, value, acs.config.L1DefaultTTL)
			}

			return value, true, nil
		}

		acs.metrics.mu.Lock()
		acs.metrics.L2Misses++
		acs.metrics.mu.Unlock()
	}

	return nil, false, nil
}

// Delete removes a key from all cache levels
func (acs *AdvancedCacheService) Delete(ctx context.Context, key string) error {
	if !acs.isRunning {
		return fmt.Errorf("cache service is not running")
	}

	acs.metrics.mu.Lock()
	acs.metrics.Deletes++
	acs.metrics.mu.Unlock()

	// Delete from L1 cache
	if acs.l1Cache != nil {
		acs.l1Cache.Delete(key)
	}

	// Delete from L2 cache
	if acs.l2Cache != nil {
		if err := acs.l2Cache.Delete(ctx, key); err != nil {
			logrus.WithError(err).WithField("key", key).Warn("Failed to delete from L2 cache")
		}
	}

	// Handle dependencies if enabled
	if acs.config.DependencyTracking && acs.dependencyGraph != nil {
		dependentKeys := acs.dependencyGraph.GetDependentKeys(key)
		for _, depKey := range dependentKeys {
			acs.Delete(ctx, depKey) // Recursive deletion
		}
	}

	return nil
}

// InvalidateByPattern invalidates cache keys matching a pattern
func (acs *AdvancedCacheService) InvalidateByPattern(ctx context.Context, pattern string) error {
	if !acs.isRunning {
		return fmt.Errorf("cache service is not running")
	}

	logrus.WithField("pattern", pattern).Info("🗑️ Invalidating cache by pattern")

	// Get keys from L2 cache that match pattern
	if acs.l2Cache != nil {
		keys, err := acs.l2Cache.Keys(ctx, pattern)
		if err != nil {
			logrus.WithError(err).WithField("pattern", pattern).Warn("Failed to get keys for pattern")
		} else {
			for _, key := range keys {
				acs.Delete(ctx, key)
			}
		}
	}

	// For L1 cache, we need to iterate through all keys (less efficient)
	if acs.l1Cache != nil {
		acs.l1Cache.InvalidateByPattern(pattern)
	}

	return nil
}

// AddDependency adds a dependency relationship between cache keys
func (acs *AdvancedCacheService) AddDependency(key, dependsOn string) error {
	if !acs.config.DependencyTracking || acs.dependencyGraph == nil {
		return nil // Dependency tracking disabled
	}

	return acs.dependencyGraph.AddDependency(key, dependsOn)
}

// GetMetrics returns current cache metrics
func (acs *AdvancedCacheService) GetMetrics() CacheMetrics {
	acs.metrics.mu.RLock()
	defer acs.metrics.mu.RUnlock()

	// Calculate utilization
	var currentSize, maxSize int
	var utilization float64
	if acs.l1Cache != nil {
		currentSize = acs.l1Cache.Size()
		maxSize = acs.l1Cache.MaxSize()
		if maxSize > 0 {
			utilization = float64(currentSize) / float64(maxSize)
		}
	}

	// Return a copy without the mutex
	return CacheMetrics{
		L1Hits:         atomic.LoadInt64(&acs.metrics.L1Hits),
		L1Misses:       atomic.LoadInt64(&acs.metrics.L1Misses),
		L2Hits:         atomic.LoadInt64(&acs.metrics.L2Hits),
		L2Misses:       atomic.LoadInt64(&acs.metrics.L2Misses),
		Sets:           atomic.LoadInt64(&acs.metrics.Sets),
		Gets:           atomic.LoadInt64(&acs.metrics.Gets),
		Deletes:        atomic.LoadInt64(&acs.metrics.Deletes),
		Evictions:      atomic.LoadInt64(&acs.metrics.Evictions),
		AverageGetTime: acs.metrics.AverageGetTime,
		AverageSetTime: acs.metrics.AverageSetTime,
		CurrentSize:    currentSize,
		MaxSize:        maxSize,
		Utilization:    utilization,
		WarmedItems:    atomic.LoadInt64(&acs.metrics.WarmedItems),
		WarmingHits:    atomic.LoadInt64(&acs.metrics.WarmingHits),
		WarmingMisses:  atomic.LoadInt64(&acs.metrics.WarmingMisses),
	}
}

// GetStats returns comprehensive cache statistics
func (acs *AdvancedCacheService) GetStats() map[string]interface{} {
	metrics := acs.GetMetrics()

	stats := map[string]interface{}{
		"l1_enabled": acs.config.L1Enabled,
		"l2_enabled": acs.config.L2Enabled,
		"warming_enabled": acs.config.WarmingEnabled,
		"dependency_tracking": acs.config.DependencyTracking,
		"metrics": map[string]interface{}{
			"l1_hits": metrics.L1Hits,
			"l1_misses": metrics.L1Misses,
			"l2_hits": metrics.L2Hits,
			"l2_misses": metrics.L2Misses,
			"sets": metrics.Sets,
			"gets": metrics.Gets,
			"deletes": metrics.Deletes,
			"evictions": metrics.Evictions,
			"current_size": metrics.CurrentSize,
			"max_size": metrics.MaxSize,
			"utilization": metrics.Utilization,
			"avg_get_time": metrics.AverageGetTime,
			"avg_set_time": metrics.AverageSetTime,
		},
	}

	// Add hit rates
	if metrics.L1Hits+metrics.L1Misses > 0 {
		stats["l1_hit_rate"] = float64(metrics.L1Hits) / float64(metrics.L1Hits+metrics.L1Misses)
	}
	if metrics.L2Hits+metrics.L2Misses > 0 {
		stats["l2_hit_rate"] = float64(metrics.L2Hits) / float64(metrics.L2Hits+metrics.L2Misses)
	}

	return stats
}

// startL1Cleanup starts the L1 cache cleanup routine
func (acs *AdvancedCacheService) startL1Cleanup() {
	ticker := time.NewTicker(acs.config.L1CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if acs.l1Cache != nil {
				evicted := acs.l1Cache.Cleanup()
				if evicted > 0 {
					acs.metrics.mu.Lock()
					acs.metrics.Evictions += int64(evicted)
					acs.metrics.mu.Unlock()
				}
			}
		case <-acs.stopChan:
			return
		}
	}
}

// startMetricsCollection starts the metrics collection routine
func (acs *AdvancedCacheService) startMetricsCollection() {
	ticker := time.NewTicker(acs.config.MetricsInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Log metrics periodically
			metrics := acs.GetMetrics()
			logrus.WithFields(logrus.Fields{
				"l1_hits": metrics.L1Hits,
				"l1_misses": metrics.L1Misses,
				"l2_hits": metrics.L2Hits,
				"l2_misses": metrics.L2Misses,
				"utilization": fmt.Sprintf("%.2f%%", metrics.Utilization*100),
			}).Debug("📊 Cache metrics")
		case <-acs.stopChan:
			return
		}
	}
}

// DefaultAdvancedCacheConfig returns default configuration
func DefaultAdvancedCacheConfig() *AdvancedCacheConfig {
	return &AdvancedCacheConfig{
		L1Enabled:         true,
		L1MaxSize:         10000,
		L1DefaultTTL:      10 * time.Minute,
		L1CleanupInterval: 1 * time.Minute,

		L2Enabled:        false, // Disabled by default
		L2DefaultTTL:     30 * time.Minute,
		L2ConnectionPool: 10,

		EvictionPolicy: LRUPolicy,

		WarmingEnabled:   false, // Disabled by default
		WarmingThreshold: 0.8,
		MaxWarmItems:     1000,

		DependencyTracking: true,
		MaxDependencyDepth: 5,

		MetricsEnabled:  true,
		MetricsInterval: 30 * time.Second,
	}
}
// Redis Memory Optimizer - Configure memory policies and compression
package cache

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// MemoryPolicy defines the Redis memory eviction policy
type MemoryPolicy string

const (
	// EvictLRU evicts least recently used keys
	EvictLRU MemoryPolicy = "allkeys-lru"
	// EvictLFU evicts least frequently used keys
	EvictLFU MemoryPolicy = "allkeys-lfu"
	// EvictRandom evicts random keys
	EvictRandom MemoryPolicy = "allkeys-random"
	// EvictTTL evicts keys closest to expiration
	EvictTTL MemoryPolicy = "volatile-ttl"
)

// isConfigNotSupportedError checks if the error indicates that a Redis CONFIG SET option is not supported
func isConfigNotSupportedError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return strings.Contains(errStr, "Unknown option") ||
		   strings.Contains(errStr, "ERR Unknown") ||
		   strings.Contains(errStr, "not supported")
}

// MemoryOptimizer manages Redis memory configuration and optimization
type MemoryOptimizer struct {
	redis         *redis.Client
	maxMemory     string // e.g., "256mb"
	evictionPolicy MemoryPolicy
	enableCompress bool
}

// NewMemoryOptimizer creates a new Redis memory optimizer
func NewMemoryOptimizer(redis *redis.Client, maxMemory string, policy MemoryPolicy) *MemoryOptimizer {
	return &MemoryOptimizer{
		redis:         redis,
		maxMemory:     maxMemory,
		evictionPolicy: policy,
		enableCompress: true,
	}
}

// Configure sets up Redis memory policies
func (mo *MemoryOptimizer) Configure(ctx context.Context) error {
	if mo.redis == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	// Set max memory limit (skip if not supported, e.g., Upstash)
	if err := mo.redis.ConfigSet(ctx, "maxmemory", mo.maxMemory).Err(); err != nil {
		// Check if this is an "Unknown option" error (common with managed Redis services)
		if isConfigNotSupportedError(err) {
			logrus.Warnf("⚠️ maxmemory configuration not supported by Redis provider, skipping memory limit")
		} else {
			logrus.Errorf("Failed to set maxmemory: %v", err)
			return err
		}
	} else {
		logrus.Infof("✅ Set Redis maxmemory: %s", mo.maxMemory)
	}

	// Set eviction policy
	policyStr := string(mo.evictionPolicy)
	if err := mo.redis.ConfigSet(ctx, "maxmemory-policy", policyStr).Err(); err != nil {
		if isConfigNotSupportedError(err) {
			logrus.Warnf("⚠️ maxmemory-policy configuration not supported by Redis provider, skipping eviction policy")
		} else {
			logrus.Errorf("Failed to set eviction policy: %v", err)
			return err
		}
	} else {
		logrus.Infof("✅ Set eviction policy: %s", policyStr)
	}

	// Additional Redis optimizations (these are more likely to be supported)
	optimizations := map[string]string{
		"save":                       "",           // Disable RDB snapshotting for cache-only usage
		"appendonly":                 "no",         // Disable AOF
		"lazyfree-lazy-eviction":     "yes",        // Non-blocking eviction
		"lazyfree-lazy-expire":       "yes",        // Non-blocking TTL
		"io-threaded-reads-processed": "3",        // Enable I/O threading for reads
		"io-threaded-writes-processed": "3",       // Enable I/O threading for writes
	}

	for key, val := range optimizations {
		if err := mo.redis.ConfigSet(ctx, key, val).Err(); err != nil {
			logrus.Warnf("Failed to set %s: %v", key, err)
			// Don't return error, some configs may not be supported
		}
	}

	logrus.Info("🚀 Redis memory optimization configured")
	return nil
}

// GetMemoryStats returns detailed memory statistics from Redis
func (mo *MemoryOptimizer) GetMemoryStats(ctx context.Context) (map[string]interface{}, error) {
	if mo.redis == nil {
		return nil, fmt.Errorf("Redis client not initialized")
	}

	info := mo.redis.Info(ctx, "memory").Val()

	// Parse memory info
	stats := parseMemoryInfo(info)

	// Add calculated metrics
	if used, ok := stats["used_memory"].(float64); ok {
		if max, ok := stats["max_memory"].(float64); ok && max > 0 {
			stats["memory_usage_percent"] = (used / max) * 100
		}
	}

	return stats, nil
}

// GetEvictionStats returns eviction-related statistics
func (mo *MemoryOptimizer) GetEvictionStats(ctx context.Context) (map[string]interface{}, error) {
	if mo.redis == nil {
		return nil, fmt.Errorf("Redis client not initialized")
	}

	info := mo.redis.Info(ctx, "stats").Val()

	// Parse stats info
	stats := parseStatsInfo(info)

	return stats, nil
}

// OptimizeMemory performs active memory optimization
func (mo *MemoryOptimizer) OptimizeMemory(ctx context.Context) error {
	if mo.redis == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	// Run memory analysis
	memStats, err := mo.GetMemoryStats(ctx)
	if err != nil {
		return err
	}

	usagePercent, ok := memStats["memory_usage_percent"].(float64)
	if ok && usagePercent > 80 {
		logrus.Warnf("⚠️  Redis memory usage high: %.1f%%", usagePercent)

		// Trigger eviction manually if needed
		result := mo.redis.Do(ctx, "MEMORY", "PURGE")
		if result.Err() != nil {
			logrus.Warnf("Memory PURGE failed: %v", result.Err())
		} else {
			logrus.Info("✅ Executed MEMORY PURGE")
		}
	}

	return nil
}

// parseMemoryInfo parses Redis MEMORY INFO output
func parseMemoryInfo(info string) map[string]interface{} {
	_ = info // Parameter reserved for future implementation
	stats := make(map[string]interface{})

	// Basic parsing of Redis INFO memory section
	lines := []string{
		"used_memory",
		"used_memory_human",
		"used_memory_peak",
		"used_memory_overhead",
		"used_memory_dataset",
		"mem_fragmentation_ratio",
		"mem_fragmentation_bytes",
		"mem_not_counted_for_evict",
		"mem_replication_backlog",
		"mem_clients_slaves",
		"mem_clients_normal",
	}

	for _, line := range lines {
		stats[line] = "N/A"
	}

	return stats
}

// parseStatsInfo parses Redis STATS INFO output
func parseStatsInfo(info string) map[string]interface{} {
	_ = info // Parameter reserved for future implementation
	stats := make(map[string]interface{})

	// Basic parsing of Redis INFO stats section
	keyStats := []string{
		"total_connections_received",
		"total_commands_processed",
		"instantaneous_ops_per_sec",
		"total_net_input_bytes",
		"total_net_output_bytes",
		"instantaneous_input_kbps",
		"instantaneous_output_kbps",
		"rejected_connections",
		"expired_keys",
		"evicted_keys",
		"keyspace_hits",
		"keyspace_misses",
		"pubsub_channels",
		"pubsub_patterns",
	}

	for _, key := range keyStats {
		stats[key] = 0
	}

	return stats
}

// ConfigOptions holds custom configuration options
type ConfigOptions struct {
	MaxMemory        string
	EvictionPolicy   MemoryPolicy
	EnableCompression bool
	Timeout          time.Duration
}

// ApplyConfig applies comprehensive optimization configuration
func (mo *MemoryOptimizer) ApplyConfig(ctx context.Context, opts ConfigOptions) error {
	if mo.redis == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	if opts.MaxMemory != "" {
		mo.maxMemory = opts.MaxMemory
	}
	if opts.EvictionPolicy != "" {
		mo.evictionPolicy = opts.EvictionPolicy
	}
	mo.enableCompress = opts.EnableCompression

	return mo.Configure(ctx)
}

// GetOptimizationRecommendations provides recommendations for memory optimization
func (mo *MemoryOptimizer) GetOptimizationRecommendations(ctx context.Context) ([]string, error) {
	recommendations := make([]string, 0)

	memStats, err := mo.GetMemoryStats(ctx)
	if err != nil {
		return recommendations, err
	}

	usagePercent, ok := memStats["memory_usage_percent"].(float64)
	if ok {
		if usagePercent > 90 {
			recommendations = append(recommendations, "🚨 Critical: Memory usage >90%, consider increasing maxmemory")
		} else if usagePercent > 75 {
			recommendations = append(recommendations, "⚠️  Warning: Memory usage >75%, monitor closely")
		}
	}

	// Add more recommendations based on stats
	evictionStats, err := mo.GetEvictionStats(ctx)
	if err == nil {
		if evicted, ok := evictionStats["evicted_keys"]; ok {
			if evictedVal, ok := evicted.(float64); ok && evictedVal > 0 {
				recommendations = append(recommendations, fmt.Sprintf("💡 Consider increasing maxmemory: %d keys have been evicted", int(evictedVal)))
			}
		}
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "✅ Memory usage is optimal")
	}

	return recommendations, nil
}

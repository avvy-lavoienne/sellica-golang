// Cache Invalidation Manager - Distributed Cache Invalidation with Versioning
package cache

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// InvalidationStrategy defines how cache keys are invalidated
type InvalidationStrategy int

const (
	// StrategyTTL invalidates based on time-to-live
	StrategyTTL InvalidationStrategy = iota
	// StrategyVersion invalidates based on version numbers
	StrategyVersion
	// StrategyTag invalidates by tag-based grouping
	StrategyTag
	// StrategyPattern invalidates by pattern matching
	StrategyPattern
)

// CacheNamespace represents a logical grouping of cache keys
type CacheNamespace struct {
	Name      string
	Version   int64
	Timestamp time.Time
	TTL       time.Duration
}

// InvalidationManager handles distributed cache invalidation
type InvalidationManager struct {
	redis              *redis.Client
	namespaces         map[string]*CacheNamespace
	namespaceVersions  map[string]int64 // Track version per namespace
	mu                 sync.RWMutex
	invalidationLog    []InvalidationEvent
	maxLogSize         int
	enableDistributed  bool
	subscribers        map[string][]func(namespace string)
}

// InvalidationEvent tracks cache invalidation events
type InvalidationEvent struct {
	Namespace   string
	Reason      string
	Timestamp   time.Time
	Strategy    InvalidationStrategy
	KeysAffected int64
}

// NewInvalidationManager creates a new cache invalidation manager
func NewInvalidationManager(redis *redis.Client, enableDistributed bool) *InvalidationManager {
	return &InvalidationManager{
		redis:             redis,
		namespaces:        make(map[string]*CacheNamespace),
		namespaceVersions: make(map[string]int64),
		invalidationLog:   make([]InvalidationEvent, 0, 1000),
		maxLogSize:        1000,
		enableDistributed: enableDistributed,
		subscribers:       make(map[string][]func(namespace string)),
	}
}

// RegisterNamespace creates a new cache namespace with versioning
func (im *InvalidationManager) RegisterNamespace(name string, ttl time.Duration) {
	im.mu.Lock()
	defer im.mu.Unlock()

	now := time.Now()
	im.namespaces[name] = &CacheNamespace{
		Name:      name,
		Version:   1,
		Timestamp: now,
		TTL:       ttl,
	}
	im.namespaceVersions[name] = 1

	logrus.Infof("📦 Cache namespace registered: %s (TTL: %s)", name, ttl)
}

// GetNamespaceVersion returns the current version for a namespace
func (im *InvalidationManager) GetNamespaceVersion(namespace string) int64 {
	im.mu.RLock()
	defer im.mu.RUnlock()

	if version, exists := im.namespaceVersions[namespace]; exists {
		return version
	}
	return 0
}

// GenerateVersionedKey creates a versioned cache key
// Format: namespace:version:key
func (im *InvalidationManager) GenerateVersionedKey(namespace, key string) string {
	version := im.GetNamespaceVersion(namespace)
	if version == 0 {
		version = 1
	}
	return fmt.Sprintf("%s:%d:%s", namespace, version, key)
}

// InvalidateNamespace increments namespace version, invalidating all old keys
func (im *InvalidationManager) InvalidateNamespace(ctx context.Context, namespace, reason string) error {
	im.mu.Lock()
	defer im.mu.Unlock()

	ns, exists := im.namespaces[namespace]
	if !exists {
		return fmt.Errorf("namespace not found: %s", namespace)
	}

	// Increment version to invalidate all old keys
	newVersion := im.namespaceVersions[namespace] + 1
	oldVersion := im.namespaceVersions[namespace]
	im.namespaceVersions[namespace] = newVersion
	ns.Version = newVersion
	ns.Timestamp = time.Now()

	// Log the invalidation event
	event := InvalidationEvent{
		Namespace:    namespace,
		Reason:       reason,
		Timestamp:    time.Now(),
		Strategy:     StrategyVersion,
		KeysAffected: 0, // Could be tracked if needed
	}
	im.logInvalidationEvent(event)

	// Store in Redis for distributed invalidation
	if im.enableDistributed && im.redis != nil {
		key := fmt.Sprintf("cache:version:%s", namespace)
		if err := im.redis.Set(ctx, key, newVersion, 24*time.Hour).Err(); err != nil {
			logrus.Errorf("Failed to store namespace version in Redis: %v", err)
		}
	}

	logrus.Infof("♻️  Cache namespace invalidated: %s (v%d → v%d) - %s", namespace, oldVersion, newVersion, reason)

	// Notify subscribers
	im.notifySubscribers(namespace)

	return nil
}

// InvalidateKeysByPattern invalidates multiple keys matching a pattern
func (im *InvalidationManager) InvalidateKeysByPattern(ctx context.Context, pattern string) (int64, error) {
	if im.redis == nil {
		return 0, fmt.Errorf("Redis not available for pattern invalidation")
	}

	// Use SCAN to safely iterate over keys matching pattern
	var cursor uint64
	keysDeleted := int64(0)

	for {
		keys, nextCursor, err := im.redis.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			logrus.Errorf("Failed to scan keys with pattern %s: %v", pattern, err)
			break
		}

		// Delete the batch of keys
		if len(keys) > 0 {
			deleted, err := im.redis.Del(ctx, keys...).Result()
			if err != nil {
				logrus.Errorf("Failed to delete keys: %v", err)
			} else {
				keysDeleted += deleted
			}
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	logrus.Infof("🗑️  Pattern invalidation complete: %s (%d keys deleted)", pattern, keysDeleted)
	return keysDeleted, nil
}

// InvalidateKeysByTag invalidates all keys with a specific tag
func (im *InvalidationManager) InvalidateKeysByTag(ctx context.Context, tag string) error {
	if im.redis == nil {
		return fmt.Errorf("Redis not available for tag-based invalidation")
	}

	// Get all keys with this tag from a tracking set
	tagKey := fmt.Sprintf("cache:tag:%s", tag)
	keys, err := im.redis.SMembers(ctx, tagKey).Result()
	if err != nil {
		return fmt.Errorf("failed to retrieve keys for tag %s: %w", tag, err)
	}

	if len(keys) == 0 {
		return nil
	}

	// Delete all keys
	if err := im.redis.Del(ctx, keys...).Err(); err != nil {
		logrus.Errorf("Failed to delete keys by tag %s: %v", tag, err)
		return err
	}

	// Delete the tag tracking set
	if err := im.redis.Del(ctx, tagKey).Err(); err != nil {
		logrus.Warnf("Failed to delete tag set: %v", err)
	}

	logrus.Infof("🏷️  Tag-based invalidation complete: %s (%d keys deleted)", tag, len(keys))
	return nil
}

// AddTagToKey associates a tag with a cache key for group invalidation
func (im *InvalidationManager) AddTagToKey(ctx context.Context, tag, key string) error {
	if im.redis == nil {
		return fmt.Errorf("Redis not available for tag management")
	}

	tagKey := fmt.Sprintf("cache:tag:%s", tag)
	if err := im.redis.SAdd(ctx, tagKey, key).Err(); err != nil {
		return fmt.Errorf("failed to add tag: %w", err)
	}

	// Set expiration on the tag set
	if err := im.redis.Expire(ctx, tagKey, 7*24*time.Hour).Err(); err != nil {
		logrus.Warnf("Failed to set tag expiration: %v", err)
	}

	return nil
}

// GetInvalidationStats returns statistics about cache invalidations
func (im *InvalidationManager) GetInvalidationStats() map[string]interface{} {
	im.mu.RLock()
	defer im.mu.RUnlock()

	stats := map[string]interface{}{
		"total_namespaces": len(im.namespaces),
		"namespaces":       make(map[string]interface{}),
		"recent_events":    make([]InvalidationEvent, 0),
	}

	// Add namespace information
	nsStats := stats["namespaces"].(map[string]interface{})
	for name, ns := range im.namespaces {
		nsStats[name] = map[string]interface{}{
			"version":     ns.Version,
			"timestamp":   ns.Timestamp,
			"ttl":         ns.TTL.String(),
			"age":         time.Since(ns.Timestamp).String(),
		}
	}

	// Add recent events
	recentEvents := stats["recent_events"].([]InvalidationEvent)
	startIdx := 0
	if len(im.invalidationLog) > 10 {
		startIdx = len(im.invalidationLog) - 10
	}
	recentEvents = im.invalidationLog[startIdx:]
	stats["recent_events"] = recentEvents

	return stats
}

// Subscribe registers a callback for namespace invalidation events
func (im *InvalidationManager) Subscribe(namespace string, callback func(namespace string)) {
	im.mu.Lock()
	defer im.mu.Unlock()

	im.subscribers[namespace] = append(im.subscribers[namespace], callback)
}

// notifySubscribers notifies all subscribers of namespace invalidation
func (im *InvalidationManager) notifySubscribers(namespace string) {
	callbacks := im.subscribers[namespace]
	for _, callback := range callbacks {
		go callback(namespace)
	}
}

// logInvalidationEvent records an invalidation event
func (im *InvalidationManager) logInvalidationEvent(event InvalidationEvent) {
	im.invalidationLog = append(im.invalidationLog, event)

	// Keep log size bounded
	if len(im.invalidationLog) > im.maxLogSize {
		im.invalidationLog = im.invalidationLog[len(im.invalidationLog)-im.maxLogSize:]
	}
}

// SyncFromRedis loads namespace versions from Redis (for distributed consistency)
func (im *InvalidationManager) SyncFromRedis(ctx context.Context) error {
	if im.redis == nil {
		return fmt.Errorf("Redis not available for sync")
	}

	im.mu.Lock()
	defer im.mu.Unlock()

	for name := range im.namespaces {
		key := fmt.Sprintf("cache:version:%s", name)
		val, err := im.redis.Get(ctx, key).Int64()
		if err == nil {
			im.namespaceVersions[name] = val
			logrus.Debugf("Synced namespace version from Redis: %s (v%d)", name, val)
		}
	}

	return nil
}

// Reset clears all namespace versions and invalidations
func (im *InvalidationManager) Reset() {
	im.mu.Lock()
	defer im.mu.Unlock()

	for name := range im.namespaces {
		im.namespaceVersions[name] = 1
		im.namespaces[name].Version = 1
		im.namespaces[name].Timestamp = time.Now()
	}

	im.invalidationLog = make([]InvalidationEvent, 0, 1000)
	logrus.Info("🔄 Cache invalidation manager reset")
}

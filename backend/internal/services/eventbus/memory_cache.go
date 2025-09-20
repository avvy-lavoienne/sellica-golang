package eventbus

import (
	"container/list"
	"strings"
	"sync"
	"time"
)

// MemoryCache provides fast in-memory caching with eviction policies
type MemoryCache struct {
	config *AdvancedCacheConfig
	cache  map[string]*list.Element
	lru    *list.List // For LRU eviction
	lfu    map[string]int64 // For LFU tracking
	size   int
	maxSize int
	mu     sync.RWMutex
}

// NewMemoryCache creates a new memory cache instance
func NewMemoryCache(config *AdvancedCacheConfig) *MemoryCache {
	return &MemoryCache{
		config:  config,
		cache:   make(map[string]*list.Element),
		lru:     list.New(),
		lfu:     make(map[string]int64),
		maxSize: config.L1MaxSize,
	}
}

// Set stores a value in the cache with TTL
func (mc *MemoryCache) Set(key string, value interface{}, ttl time.Duration) error {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	// Estimate entry size (rough approximation)
	entrySize := len(key) + 100 // Key size + estimated value size

	// Check if we need to evict entries
	for mc.size+entrySize > mc.maxSize && mc.size > 0 {
		mc.evictEntry()
	}

	// Remove existing entry if it exists
	if elem, exists := mc.cache[key]; exists {
		mc.lru.Remove(elem)
		delete(mc.cache, key)
		mc.size -= entrySize
	}

	// Create new cache entry
	entry := &CacheEntry{
		Key:       key,
		Value:     value,
		TTL:       ttl,
		CreatedAt: time.Now(),
		Size:      entrySize,
	}

	// Add to LRU list (most recently used at front)
	elem := mc.lru.PushFront(entry)
	mc.cache[key] = elem
	mc.size += entrySize

	return nil
}

// Get retrieves a value from the cache
func (mc *MemoryCache) Get(key string) (interface{}, bool) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	elem, exists := mc.cache[key]
	if !exists {
		return nil, false
	}

	entry := elem.Value.(*CacheEntry)

	// Check if entry has expired
	if time.Since(entry.CreatedAt) > entry.TTL {
		mc.lru.Remove(elem)
		delete(mc.cache, key)
		mc.size -= entry.Size
		delete(mc.lfu, key)
		return nil, false
	}

	// Update access tracking
	entry.AccessedAt = time.Now()
	entry.AccessCount++
	mc.lfu[key] = entry.AccessCount

	// Move to front of LRU list (most recently used)
	mc.lru.MoveToFront(elem)

	return entry.Value, true
}

// Delete removes a key from the cache
func (mc *MemoryCache) Delete(key string) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	if elem, exists := mc.cache[key]; exists {
		entry := elem.Value.(*CacheEntry)
		mc.lru.Remove(elem)
		delete(mc.cache, key)
		mc.size -= entry.Size
		delete(mc.lfu, key)
	}
}

// InvalidateByPattern removes all keys matching a pattern
func (mc *MemoryCache) InvalidateByPattern(pattern string) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	keysToDelete := make([]string, 0)

	// Find keys matching pattern
	for key := range mc.cache {
		if mc.matchesPattern(key, pattern) {
			keysToDelete = append(keysToDelete, key)
		}
	}

	// Delete matching keys
	for _, key := range keysToDelete {
		if elem, exists := mc.cache[key]; exists {
			entry := elem.Value.(*CacheEntry)
			mc.lru.Remove(elem)
			delete(mc.cache, key)
			mc.size -= entry.Size
			delete(mc.lfu, key)
		}
	}
}

// Cleanup removes expired entries and enforces eviction policy
func (mc *MemoryCache) Cleanup() int {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	expiredCount := 0
	now := time.Now()

	// Remove expired entries
	for key, elem := range mc.cache {
		entry := elem.Value.(*CacheEntry)
		if now.Sub(entry.CreatedAt) > entry.TTL {
			mc.lru.Remove(elem)
			delete(mc.cache, key)
			mc.size -= entry.Size
			delete(mc.lfu, key)
			expiredCount++
		}
	}

	// Apply eviction policy if still over capacity
	evictedCount := 0
	for mc.size > mc.maxSize && len(mc.cache) > 0 {
		mc.evictEntry()
		evictedCount++
	}

	return expiredCount + evictedCount
}

// Size returns the current number of entries in the cache
func (mc *MemoryCache) Size() int {
	mc.mu.RLock()
	defer mc.mu.RUnlock()
	return len(mc.cache)
}

// MaxSize returns the maximum cache size
func (mc *MemoryCache) MaxSize() int {
	return mc.maxSize
}

// GetStats returns cache statistics
func (mc *MemoryCache) GetStats() map[string]interface{} {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	totalAccesses := int64(0)
	for _, count := range mc.lfu {
		totalAccesses += count
	}

	return map[string]interface{}{
		"entries":        len(mc.cache),
		"size":           mc.size,
		"max_size":       mc.maxSize,
		"utilization":    float64(mc.size) / float64(mc.maxSize),
		"total_accesses": totalAccesses,
	}
}

// evictEntry removes an entry based on the configured eviction policy
func (mc *MemoryCache) evictEntry() {
	if len(mc.cache) == 0 {
		return
	}

	var keyToEvict string

	switch mc.config.EvictionPolicy {
	case LRUPolicy:
		// Remove least recently used (back of list)
		elem := mc.lru.Back()
		if elem != nil {
			entry := elem.Value.(*CacheEntry)
			keyToEvict = entry.Key
		}

	case LFUPolicy:
		// Remove least frequently used
		minAccesses := int64(-1)
		for key, accesses := range mc.lfu {
			if minAccesses == -1 || accesses < minAccesses {
				minAccesses = accesses
				keyToEvict = key
			}
		}

	case FIFOPolicy:
		// Remove first in (back of list, oldest)
		elem := mc.lru.Back()
		if elem != nil {
			entry := elem.Value.(*CacheEntry)
			keyToEvict = entry.Key
		}

	case TTLPolicy:
		// Remove entry closest to expiration
		var earliestExpiry time.Time
		for key, elem := range mc.cache {
			entry := elem.Value.(*CacheEntry)
			expiry := entry.CreatedAt.Add(entry.TTL)
			if keyToEvict == "" || expiry.Before(earliestExpiry) {
				earliestExpiry = expiry
				keyToEvict = key
			}
		}

	default:
		// Default to LRU
		elem := mc.lru.Back()
		if elem != nil {
			entry := elem.Value.(*CacheEntry)
			keyToEvict = entry.Key
		}
	}

	// Remove the selected entry
	if keyToEvict != "" {
		if elem, exists := mc.cache[keyToEvict]; exists {
			entry := elem.Value.(*CacheEntry)
			mc.lru.Remove(elem)
			delete(mc.cache, keyToEvict)
			mc.size -= entry.Size
			delete(mc.lfu, keyToEvict)
		}
	}
}

// matchesPattern checks if a key matches a pattern (simple wildcard support)
func (mc *MemoryCache) matchesPattern(key, pattern string) bool {
	// Simple wildcard matching (*)
	if strings.Contains(pattern, "*") {
		// Convert pattern to regex-like matching
		prefix := strings.Split(pattern, "*")[0]
		return strings.HasPrefix(key, prefix)
	}

	// Exact match
	return key == pattern
}
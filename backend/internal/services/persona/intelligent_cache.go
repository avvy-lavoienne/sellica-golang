package persona

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// IntelligentCache provides multi-level caching with intelligent strategies
type IntelligentCache struct {
	l1Cache        *MemoryCache      // Ultra-fast memory cache
	l2Cache        *DistributedCache // Distributed cache (Redis-like)
	bloomFilter    *BloomFilter      // Fast negative lookups
	cacheAnalyzer  *CacheAnalyzer    // Usage pattern analysis
	prefetchEngine *PrefetchEngine   // Predictive prefetching
	enabled        bool
	mu             sync.RWMutex
}

// MemoryCache represents L1 memory cache
type MemoryCache struct {
	data        map[string]*CacheEntry
	maxSize     int
	currentSize int
	mu          sync.RWMutex
}

// DistributedCache represents L2 distributed cache
type DistributedCache struct {
	enabled bool
	// In a real implementation, this would connect to Redis
	data map[string]*CacheEntry
	mu   sync.RWMutex
}

// BloomFilter provides fast negative lookups
type BloomFilter struct {
	bitArray  []bool
	size      int
	hashFuncs int
	mu        sync.RWMutex
}

// CacheAnalyzer analyzes cache usage patterns
type CacheAnalyzer struct {
	accessPatterns map[string]*AccessPattern
	enabled        bool
	mu             sync.RWMutex
}

// PrefetchEngine handles predictive prefetching
type PrefetchEngine struct {
	enabled bool
	rules   []PrefetchRule
}

// CacheEntry represents a cached item
type CacheEntry struct {
	Key          string                 `json:"key"`
	Value        interface{}            `json:"value"`
	CreatedAt    time.Time              `json:"created_at"`
	LastAccessed time.Time              `json:"last_accessed"`
	AccessCount  int                    `json:"access_count"`
	TTL          time.Duration          `json:"ttl"`
	Quality      float64                `json:"quality"`    // Cache quality score 0-1
	Confidence   float64                `json:"confidence"` // Content confidence 0-1
	Size         int                    `json:"size"`       // Entry size in bytes
	Tags         []string               `json:"tags"`       // Cache tags for invalidation
	Metadata     map[string]interface{} `json:"metadata"`
}

// AccessPattern represents cache access patterns
type AccessPattern struct {
	Key           string      `json:"key"`
	AccessTimes   []time.Time `json:"access_times"`
	Frequency     float64     `json:"frequency"`      // Accesses per hour
	Recency       float64     `json:"recency"`        // Time since last access
	Seasonality   float64     `json:"seasonality"`    // Seasonal access pattern
	PredictedNext time.Time   `json:"predicted_next"` // Predicted next access
}

// PrefetchRule defines prefetching rules
type PrefetchRule struct {
	Pattern     string        `json:"pattern"`     // Pattern to match
	Probability float64       `json:"probability"` // Prefetch probability
	Delay       time.Duration `json:"delay"`       // Prefetch delay
	Enabled     bool          `json:"enabled"`
}

// CacheStrategy defines caching strategy
type CacheStrategy struct {
	L1Enabled        bool          `json:"l1_enabled"`
	L2Enabled        bool          `json:"l2_enabled"`
	BloomEnabled     bool          `json:"bloom_enabled"`
	PrefetchEnabled  bool          `json:"prefetch_enabled"`
	DefaultTTL       time.Duration `json:"default_ttl"`
	MaxL1Size        int           `json:"max_l1_size"`
	QualityThreshold float64       `json:"quality_threshold"`
}

// NewIntelligentCache creates a new intelligent cache
func NewIntelligentCache(strategy *CacheStrategy) *IntelligentCache {
	if strategy == nil {
		strategy = &CacheStrategy{
			L1Enabled:        true,
			L2Enabled:        true,
			BloomEnabled:     true,
			PrefetchEnabled:  true,
			DefaultTTL:       1 * time.Hour,
			MaxL1Size:        1000,
			QualityThreshold: 0.7,
		}
	}

	return &IntelligentCache{
		l1Cache: &MemoryCache{
			data:    make(map[string]*CacheEntry),
			maxSize: strategy.MaxL1Size,
		},
		l2Cache: &DistributedCache{
			enabled: strategy.L2Enabled,
			data:    make(map[string]*CacheEntry),
		},
		bloomFilter: &BloomFilter{
			bitArray:  make([]bool, 10000),
			size:      10000,
			hashFuncs: 3,
		},
		cacheAnalyzer: &CacheAnalyzer{
			accessPatterns: make(map[string]*AccessPattern),
			enabled:        true,
		},
		prefetchEngine: &PrefetchEngine{
			enabled: strategy.PrefetchEnabled,
			rules:   createDefaultPrefetchRules(),
		},
		enabled: true,
	}
}

// Get retrieves a value from the cache
func (ic *IntelligentCache) Get(ctx context.Context, key string) (interface{}, bool) {
	if !ic.enabled {
		return nil, false
	}

	ic.mu.RLock()
	defer ic.mu.RUnlock()

	// Check bloom filter first for fast negative lookups
	if !ic.bloomFilter.Contains(key) {
		return nil, false
	}

	// Try L1 cache first
	if entry, found := ic.l1Cache.Get(key); found {
		if !ic.isExpired(entry) {
			ic.updateAccessPattern(key)
			logrus.WithFields(logrus.Fields{
				"key":   key,
				"level": "L1",
				"hit":   true,
			}).Debug("Cache hit")
			return entry.Value, true
		} else {
			ic.l1Cache.Delete(key)
		}
	}

	// Try L2 cache
	if ic.l2Cache.enabled {
		if entry, found := ic.l2Cache.Get(key); found {
			if !ic.isExpired(entry) {
				// Promote to L1 cache
				ic.l1Cache.Set(key, entry)
				ic.updateAccessPattern(key)
				logrus.WithFields(logrus.Fields{
					"key":   key,
					"level": "L2",
					"hit":   true,
				}).Debug("Cache hit")
				return entry.Value, true
			} else {
				ic.l2Cache.Delete(key)
			}
		}
	}

	logrus.WithFields(logrus.Fields{
		"key":  key,
		"miss": true,
	}).Debug("Cache miss")

	return nil, false
}

// Set stores a value in the cache
func (ic *IntelligentCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration, quality float64) error {
	if !ic.enabled {
		return nil
	}

	ic.mu.Lock()
	defer ic.mu.Unlock()

	entry := &CacheEntry{
		Key:          key,
		Value:        value,
		CreatedAt:    time.Now(),
		LastAccessed: time.Now(),
		AccessCount:  1,
		TTL:          ttl,
		Quality:      quality,
		Confidence:   ic.calculateConfidence(value),
		Size:         ic.calculateSize(value),
		Tags:         ic.generateTags(key, value),
		Metadata:     make(map[string]interface{}),
	}

	// Add to bloom filter
	ic.bloomFilter.Add(key)

	// Store in L1 cache
	ic.l1Cache.Set(key, entry)

	// Store in L2 cache if quality is high enough
	if ic.l2Cache.enabled && quality >= 0.8 {
		ic.l2Cache.Set(key, entry)
	}

	// Update access patterns
	ic.updateAccessPattern(key)

	// Trigger prefetching if applicable
	if ic.prefetchEngine.enabled {
		go ic.triggerPrefetch(key, value)
	}

	logrus.WithFields(logrus.Fields{
		"key":     key,
		"quality": quality,
		"ttl":     ttl,
		"size":    entry.Size,
	}).Debug("Cache set")

	return nil
}

// Delete removes a value from the cache
func (ic *IntelligentCache) Delete(key string) {
	ic.mu.Lock()
	defer ic.mu.Unlock()

	ic.l1Cache.Delete(key)
	if ic.l2Cache.enabled {
		ic.l2Cache.Delete(key)
	}

	logrus.WithField("key", key).Debug("Cache delete")
}

// InvalidateByTags invalidates cache entries by tags
func (ic *IntelligentCache) InvalidateByTags(tags []string) {
	ic.mu.Lock()
	defer ic.mu.Unlock()

	ic.l1Cache.InvalidateByTags(tags)
	if ic.l2Cache.enabled {
		ic.l2Cache.InvalidateByTags(tags)
	}

	logrus.WithField("tags", tags).Debug("Cache invalidation by tags")
}

// GetStats returns cache statistics
func (ic *IntelligentCache) GetStats() map[string]interface{} {
	ic.mu.RLock()
	defer ic.mu.RUnlock()

	l1Stats := ic.l1Cache.GetStats()
	l2Stats := map[string]interface{}{}
	if ic.l2Cache.enabled {
		l2Stats = ic.l2Cache.GetStats()
	}

	return map[string]interface{}{
		"enabled":  ic.enabled,
		"l1_cache": l1Stats,
		"l2_cache": l2Stats,
		"bloom_filter": map[string]interface{}{
			"size":       ic.bloomFilter.size,
			"hash_funcs": ic.bloomFilter.hashFuncs,
		},
		"analyzer": map[string]interface{}{
			"patterns_tracked": len(ic.cacheAnalyzer.accessPatterns),
		},
		"prefetch": map[string]interface{}{
			"enabled": ic.prefetchEngine.enabled,
			"rules":   len(ic.prefetchEngine.rules),
		},
	}
}

// Helper methods

func (ic *IntelligentCache) isExpired(entry *CacheEntry) bool {
	return time.Since(entry.CreatedAt) > entry.TTL
}

func (ic *IntelligentCache) calculateConfidence(value interface{}) float64 {
	// Simple confidence calculation based on value type and content
	if value == nil {
		return 0.0
	}

	switch v := value.(type) {
	case string:
		if len(v) > 10 {
			return 0.8
		}
		return 0.6
	case map[string]interface{}:
		if len(v) > 3 {
			return 0.9
		}
		return 0.7
	default:
		return 0.7
	}
}

func (ic *IntelligentCache) calculateSize(value interface{}) int {
	// Simple size calculation
	data, _ := json.Marshal(value)
	return len(data)
}

func (ic *IntelligentCache) generateTags(key string, _ interface{}) []string {
	tags := []string{}

	// Generate tags based on key patterns
	if strings.Contains(key, "persona") {
		tags = append(tags, "persona")
	}
	if strings.Contains(key, "ktp") {
		tags = append(tags, "ktp", "government")
	}
	if strings.Contains(key, "akta") {
		tags = append(tags, "akta", "government")
	}
	if strings.Contains(key, "perpindahan") {
		tags = append(tags, "perpindahan", "government")
	}

	return tags
}

func (ic *IntelligentCache) updateAccessPattern(key string) {
	if !ic.cacheAnalyzer.enabled {
		return
	}

	ic.cacheAnalyzer.mu.Lock()
	defer ic.cacheAnalyzer.mu.Unlock()

	pattern, exists := ic.cacheAnalyzer.accessPatterns[key]
	if !exists {
		pattern = &AccessPattern{
			Key:         key,
			AccessTimes: []time.Time{},
		}
		ic.cacheAnalyzer.accessPatterns[key] = pattern
	}

	pattern.AccessTimes = append(pattern.AccessTimes, time.Now())
	pattern.Frequency = ic.calculateFrequency(pattern.AccessTimes)
	pattern.Recency = time.Since(pattern.AccessTimes[len(pattern.AccessTimes)-1]).Hours()
}

func (ic *IntelligentCache) calculateFrequency(accessTimes []time.Time) float64 {
	if len(accessTimes) < 2 {
		return 0.0
	}

	duration := accessTimes[len(accessTimes)-1].Sub(accessTimes[0])
	return float64(len(accessTimes)) / duration.Hours()
}

func (ic *IntelligentCache) triggerPrefetch(key string, _ interface{}) {
	// Simple prefetch logic - in a real implementation, this would be more sophisticated
	for _, rule := range ic.prefetchEngine.rules {
		if rule.Enabled && strings.Contains(key, rule.Pattern) {
			time.Sleep(rule.Delay)
			// Prefetch related content
			logrus.WithFields(logrus.Fields{
				"key":     key,
				"pattern": rule.Pattern,
			}).Debug("Prefetch triggered")
		}
	}
}

func createDefaultPrefetchRules() []PrefetchRule {
	return []PrefetchRule{
		{
			Pattern:     "persona",
			Probability: 0.8,
			Delay:       100 * time.Millisecond,
			Enabled:     true,
		},
		{
			Pattern:     "ktp",
			Probability: 0.7,
			Delay:       200 * time.Millisecond,
			Enabled:     true,
		},
	}
}

// GenerateCacheKey generates a consistent cache key
func GenerateCacheKey(prefix string, params ...interface{}) string {
	data, _ := json.Marshal(params)
	hash := md5.Sum(data)
	return fmt.Sprintf("%s:%x", prefix, hash)
}

// MemoryCache methods

func (mc *MemoryCache) Get(key string) (*CacheEntry, bool) {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	entry, exists := mc.data[key]
	if exists {
		entry.LastAccessed = time.Now()
		entry.AccessCount++
	}
	return entry, exists
}

func (mc *MemoryCache) Set(key string, entry *CacheEntry) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	// Evict if at capacity
	if mc.currentSize >= mc.maxSize {
		mc.evictLRU()
	}

	mc.data[key] = entry
	mc.currentSize++
}

func (mc *MemoryCache) Delete(key string) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	if _, exists := mc.data[key]; exists {
		delete(mc.data, key)
		mc.currentSize--
	}
}

func (mc *MemoryCache) evictLRU() {
	var oldestKey string
	var oldestTime time.Time = time.Now()

	for key, entry := range mc.data {
		if entry.LastAccessed.Before(oldestTime) {
			oldestTime = entry.LastAccessed
			oldestKey = key
		}
	}

	if oldestKey != "" {
		delete(mc.data, oldestKey)
		mc.currentSize--
	}
}

func (mc *MemoryCache) InvalidateByTags(tags []string) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	for key, entry := range mc.data {
		for _, tag := range tags {
			for _, entryTag := range entry.Tags {
				if tag == entryTag {
					delete(mc.data, key)
					mc.currentSize--
					break
				}
			}
		}
	}
}

func (mc *MemoryCache) GetStats() map[string]interface{} {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	return map[string]interface{}{
		"size":     mc.currentSize,
		"max_size": mc.maxSize,
		"entries":  len(mc.data),
	}
}

// DistributedCache methods

func (dc *DistributedCache) Get(key string) (*CacheEntry, bool) {
	if !dc.enabled {
		return nil, false
	}

	dc.mu.RLock()
	defer dc.mu.RUnlock()

	entry, exists := dc.data[key]
	if exists {
		entry.LastAccessed = time.Now()
		entry.AccessCount++
	}
	return entry, exists
}

func (dc *DistributedCache) Set(key string, entry *CacheEntry) {
	if !dc.enabled {
		return
	}

	dc.mu.Lock()
	defer dc.mu.Unlock()

	dc.data[key] = entry
}

func (dc *DistributedCache) Delete(key string) {
	if !dc.enabled {
		return
	}

	dc.mu.Lock()
	defer dc.mu.Unlock()

	delete(dc.data, key)
}

func (dc *DistributedCache) InvalidateByTags(tags []string) {
	if !dc.enabled {
		return
	}

	dc.mu.Lock()
	defer dc.mu.Unlock()

	for key, entry := range dc.data {
		for _, tag := range tags {
			for _, entryTag := range entry.Tags {
				if tag == entryTag {
					delete(dc.data, key)
					break
				}
			}
		}
	}
}

func (dc *DistributedCache) GetStats() map[string]interface{} {
	if !dc.enabled {
		return map[string]interface{}{"enabled": false}
	}

	dc.mu.RLock()
	defer dc.mu.RUnlock()

	return map[string]interface{}{
		"enabled": true,
		"entries": len(dc.data),
	}
}

// BloomFilter methods

func (bf *BloomFilter) Add(key string) {
	bf.mu.Lock()
	defer bf.mu.Unlock()

	hashes := bf.hash(key)
	for _, hash := range hashes {
		bf.bitArray[hash%bf.size] = true
	}
}

func (bf *BloomFilter) Contains(key string) bool {
	bf.mu.RLock()
	defer bf.mu.RUnlock()

	hashes := bf.hash(key)
	for _, hash := range hashes {
		if !bf.bitArray[hash%bf.size] {
			return false
		}
	}
	return true
}

func (bf *BloomFilter) hash(key string) []int {
	hashes := make([]int, bf.hashFuncs)
	h := 0
	for i, char := range key {
		h = h*31 + int(char)
		if i < bf.hashFuncs {
			hashes[i] = h
		}
	}

	// Generate additional hashes if needed
	for i := len(key); i < bf.hashFuncs; i++ {
		h = h*31 + i
		hashes[i] = h
	}

	return hashes
}

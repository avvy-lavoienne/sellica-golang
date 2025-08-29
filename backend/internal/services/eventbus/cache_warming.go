package eventbus

import (
	"context"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// CacheWarmingEngine handles predictive cache warming
type CacheWarmingEngine struct {
	config       *AdvancedCacheConfig
	cache        *AdvancedCacheService
	warmingQueue chan string
	isRunning    bool
	stopChan     chan struct{}
	mu          sync.RWMutex
}

// NewCacheWarmingEngine creates a new cache warming engine
func NewCacheWarmingEngine(config *AdvancedCacheConfig, cache *AdvancedCacheService) *CacheWarmingEngine {
	return &CacheWarmingEngine{
		config:       config,
		cache:        cache,
		warmingQueue: make(chan string, config.MaxWarmItems),
		stopChan:     make(chan struct{}),
	}
}

// Start starts the cache warming engine
func (cwe *CacheWarmingEngine) Start() error {
	cwe.mu.Lock()
	defer cwe.mu.Unlock()

	if cwe.isRunning {
		return nil // Already running
	}

	cwe.isRunning = true

	// Start warming worker
	go cwe.warmingWorker()

	logrus.Info("🔥 Cache warming engine started")
	return nil
}

// Stop stops the cache warming engine
func (cwe *CacheWarmingEngine) Stop() error {
	cwe.mu.Lock()
	defer cwe.mu.Unlock()

	if !cwe.isRunning {
		return nil // Already stopped
	}

	cwe.isRunning = false
	close(cwe.stopChan)

	logrus.Info("🛑 Cache warming engine stopped")
	return nil
}

// QueueForWarming adds a key to the warming queue
func (cwe *CacheWarmingEngine) QueueForWarming(key string) bool {
	cwe.mu.RLock()
	defer cwe.mu.RUnlock()

	if !cwe.isRunning {
		return false
	}

	select {
	case cwe.warmingQueue <- key:
		return true
	default:
		// Queue is full, skip warming
		return false
	}
}

// QueueMultipleForWarming adds multiple keys to the warming queue
func (cwe *CacheWarmingEngine) QueueMultipleForWarming(keys []string) int {
	queued := 0
	for _, key := range keys {
		if cwe.QueueForWarming(key) {
			queued++
		}
	}
	return queued
}

// PredictAndWarm performs predictive warming based on access patterns
func (cwe *CacheWarmingEngine) PredictAndWarm(ctx context.Context) error {
	if !cwe.isRunning {
		return nil
	}

	// Get hot keys from access tracker
	hotKeys := cwe.cache.accessTracker.GetHotKeys(cwe.config.WarmingThreshold, cwe.config.MaxWarmItems)

	if len(hotKeys) == 0 {
		return nil
	}

	logrus.WithField("hot_keys_count", len(hotKeys)).Debug("🔥 Predictive warming triggered")

	// Queue hot keys for warming
	queued := cwe.QueueMultipleForWarming(hotKeys)

	logrus.WithFields(logrus.Fields{
		"hot_keys":     len(hotKeys),
		"queued":       queued,
		"threshold":    cwe.config.WarmingThreshold,
	}).Info("🔥 Predictive cache warming completed")

	return nil
}

// WarmRelatedKeys warms keys related to a given key based on dependencies
func (cwe *CacheWarmingEngine) WarmRelatedKeys(ctx context.Context, key string) error {
	if !cwe.isRunning || !cwe.config.DependencyTracking {
		return nil
	}

	// Get dependent keys
	dependentKeys := cwe.cache.dependencyGraph.GetDependentKeys(key)

	if len(dependentKeys) == 0 {
		return nil
	}

	// Queue dependent keys for warming
	queued := cwe.QueueMultipleForWarming(dependentKeys)

	logrus.WithFields(logrus.Fields{
		"key":            key,
		"dependent_keys": len(dependentKeys),
		"queued":         queued,
	}).Debug("🔗 Warming related keys")

	return nil
}

// GetWarmingStats returns warming statistics
func (cwe *CacheWarmingEngine) GetWarmingStats() map[string]interface{} {
	cwe.mu.RLock()
	defer cwe.mu.RUnlock()

	queueSize := len(cwe.warmingQueue)

	return map[string]interface{}{
		"is_running":  cwe.isRunning,
		"queue_size":  queueSize,
		"queue_capacity": cwe.config.MaxWarmItems,
		"utilization": float64(queueSize) / float64(cwe.config.MaxWarmItems),
	}
}

// warmingWorker processes the warming queue
func (cwe *CacheWarmingEngine) warmingWorker() {
	logrus.Debug("👷 Cache warming worker started")

	for {
		select {
		case key := <-cwe.warmingQueue:
			cwe.processWarmingRequest(key)

		case <-cwe.stopChan:
			logrus.Debug("👷 Cache warming worker stopping")
			return
		}
	}
}

// processWarmingRequest processes a single warming request
func (cwe *CacheWarmingEngine) processWarmingRequest(key string) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Check if key is already in cache
	_, exists, err := cwe.cache.Get(ctx, key)
	if err != nil {
		logrus.WithError(err).WithField("key", key).Warn("Failed to check cache for warming")
		return
	}

	if exists {
		// Key is already cached, no need to warm
		return
	}

	// Key is not in cache, we could implement predictive loading here
	// For now, we just log that the key would benefit from warming
	logrus.WithField("key", key).Debug("🔥 Key identified for potential warming")

	// In a real implementation, you might:
	// 1. Load the data from the database
	// 2. Store it in cache with appropriate TTL
	// 3. Update warming metrics

	// For this implementation, we'll just simulate the warming
	cwe.simulateWarming(key)
}

// simulateWarming simulates the warming process (for demonstration)
func (cwe *CacheWarmingEngine) simulateWarming(key string) {
	// Simulate some processing time
	time.Sleep(10 * time.Millisecond)

	logrus.WithField("key", key).Trace("🔥 Simulated cache warming completed")
}

// StartPredictiveWarming starts periodic predictive warming
func (cwe *CacheWarmingEngine) StartPredictiveWarming(ctx context.Context) error {
	if !cwe.isRunning {
		return nil
	}

	go func() {
		ticker := time.NewTicker(5 * time.Minute) // Check every 5 minutes
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := cwe.PredictAndWarm(ctx); err != nil {
					logrus.WithError(err).Warn("Predictive warming failed")
				}

			case <-cwe.stopChan:
				return

			case <-ctx.Done():
				return
			}
		}
	}()

	logrus.Info("🔮 Predictive warming started")
	return nil
}

// WarmOnAccess warms cache when a key is accessed (reactive warming)
func (cwe *CacheWarmingEngine) WarmOnAccess(ctx context.Context, key string) {
	if !cwe.isRunning {
		return
	}

	// Warm related keys based on dependencies
	if err := cwe.WarmRelatedKeys(ctx, key); err != nil {
		logrus.WithError(err).WithField("key", key).Debug("Failed to warm related keys")
	}
}

// IsRunning returns whether the warming engine is running
func (cwe *CacheWarmingEngine) IsRunning() bool {
	cwe.mu.RLock()
	defer cwe.mu.RUnlock()
	return cwe.isRunning
}

// GetQueueSize returns the current warming queue size
func (cwe *CacheWarmingEngine) GetQueueSize() int {
	cwe.mu.RLock()
	defer cwe.mu.RUnlock()
	return len(cwe.warmingQueue)
}

// ClearQueue clears the warming queue
func (cwe *CacheWarmingEngine) ClearQueue() {
	cwe.mu.Lock()
	defer cwe.mu.Unlock()

	// Drain the queue
	for len(cwe.warmingQueue) > 0 {
		select {
		case <-cwe.warmingQueue:
		default:
			// Queue is empty, exit the loop
			return
		}
	}

	logrus.Info("🧹 Warming queue cleared")
}
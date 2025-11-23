// Cache Warmer - Pre-load frequently accessed data during initialization
package cache

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// CacheWarmer pre-loads data into cache for faster startup
type CacheWarmer struct {
	service            *Service
	config             *WarmingConfig
	dataProviders      map[string]WarmingDataProvider
	mu                 sync.RWMutex
	warmedCount        int64
	failedCount        int64
	totalWarmingTime   time.Duration
	isWarming          atomic.Bool
	lastWarmingTime    time.Time
	stopChan           chan struct{}
}

// WarmingDataProvider provides data to be warmed into cache
type WarmingDataProvider interface {
	// GetDataToWarm returns items to warm with key, value, and TTL
	GetDataToWarm(ctx context.Context) (map[string]*WarmingItem, error)
	// GetNamespace returns the namespace this provider serves
	GetNamespace() string
	// GetPriority returns the priority of warming (0-1, higher = more priority)
	GetPriority() float64
}

// WarmingItem represents a single item to warm
type WarmingItem struct {
	Key   string
	Value interface{}
	TTL   time.Duration
}

// NewCacheWarmer creates a new cache warmer
func NewCacheWarmer(service *Service, config *WarmingConfig) *CacheWarmer {
	if config == nil {
		config = &WarmingConfig{
			Enabled:             true,
			WorkerCount:         10,
			WarmingInterval:     5 * time.Second,
			PredictionWindow:    24 * time.Hour,
			MaxWarmingQueueSize: 1000,
		}
	}

	return &CacheWarmer{
		service:       service,
		config:        config,
		dataProviders: make(map[string]WarmingDataProvider),
		stopChan:      make(chan struct{}, 1),
	}
}

// RegisterProvider registers a data provider for warming
func (w *CacheWarmer) RegisterProvider(namespace string, provider WarmingDataProvider) {
	w.mu.Lock()
	defer w.mu.Unlock()

	w.dataProviders[namespace] = provider
	logrus.Debugf("📦 Cache warmer provider registered: %s", namespace)
}

// Start begins the cache warming process
func (w *CacheWarmer) Start(ctx context.Context) error {
	if !w.isWarming.CompareAndSwap(false, true) {
		return fmt.Errorf("cache warmer already running")
	}
	defer w.isWarming.Store(false)

	startTime := time.Now()
	logrus.Info("🔥 Starting cache warming...")

	w.mu.RLock()
	providers := make(map[string]WarmingDataProvider)
	for ns, provider := range w.dataProviders {
		providers[ns] = provider
	}
	w.mu.RUnlock()

	// Collect warming items
	type prioritizedItem struct {
		namespace string
		item      *WarmingItem
		priority  float64
	}

	allItems := make([]*prioritizedItem, 0, 1000)

	for namespace, provider := range providers {
		// Get data from provider
		data, err := provider.GetDataToWarm(ctx)
		if err != nil {
			logrus.Warnf("Failed to get warming data from provider %s: %v", namespace, err)
			continue
		}

		// Calculate priority
		basePriority := provider.GetPriority()

		// Add items with priority
		for _, item := range data {
			allItems = append(allItems, &prioritizedItem{
				namespace: namespace,
				item:      item,
				priority:  basePriority,
			})
		}
	}

	// Limit items to warm
	maxItems := 1000
	if len(allItems) > maxItems {
		allItems = allItems[:maxItems]
	}

	// Warm items with concurrency control
	concurrency := w.config.WorkerCount
	if concurrency == 0 {
		concurrency = 10
	}
	semaphore := make(chan struct{}, concurrency)
	wg := sync.WaitGroup{}

	for _, item := range allItems {
		wg.Add(1)
		go func(pi *prioritizedItem) {
			defer wg.Done()
			semaphore <- struct{}{}        // Acquire
			defer func() { <-semaphore }() // Release

			err := w.service.Set(pi.item.Key, pi.item.Value, pi.item.TTL)
			if err != nil {
				atomic.AddInt64(&w.failedCount, 1)
				logrus.Debugf("Failed to warm cache key: %s (error: %v)", pi.item.Key, err)
			} else {
				atomic.AddInt64(&w.warmedCount, 1)
			}
		}(item)
	}

	wg.Wait()

	elapsed := time.Since(startTime)
	w.totalWarmingTime = elapsed
	w.lastWarmingTime = startTime

	warmedCount := atomic.LoadInt64(&w.warmedCount)
	failedCount := atomic.LoadInt64(&w.failedCount)

	logrus.Infof("✅ Cache warming complete: %d items warmed (%d failed) in %v", warmedCount, failedCount, elapsed)

	targetWarming := w.config.WarmingInterval
	if targetWarming == 0 {
		targetWarming = 5 * time.Second
	}
	if elapsed > targetWarming {
		logrus.Warnf("⚠️  Cache warming took longer than target: %v > %v", elapsed, targetWarming)
	}

	return nil
}

// GetWarmingStats returns statistics about cache warming
func (w *CacheWarmer) GetWarmingStats() map[string]interface{} {
	return map[string]interface{}{
		"is_warming":         w.isWarming.Load(),
		"warmed_count":       atomic.LoadInt64(&w.warmedCount),
		"failed_count":       atomic.LoadInt64(&w.failedCount),
		"total_warming_time": w.totalWarmingTime.String(),
		"last_warming_time":  w.lastWarmingTime,
		"config": map[string]interface{}{
			"enabled":              w.config.Enabled,
			"worker_count":         w.config.WorkerCount,
			"warming_interval":     w.config.WarmingInterval.String(),
			"prediction_window":    w.config.PredictionWindow.String(),
			"max_warming_queue":    w.config.MaxWarmingQueueSize,
		},
	}
}

// Reset resets the warming counters
func (w *CacheWarmer) Reset() {
	atomic.StoreInt64(&w.warmedCount, 0)
	atomic.StoreInt64(&w.failedCount, 0)
	w.totalWarmingTime = 0
}

// Stop stops the cache warming process
func (w *CacheWarmer) Stop() {
	if w.isWarming.Load() {
		w.stopChan <- struct{}{}
		w.isWarming.Store(false)
		logrus.Info("Stopped cache warming")
	}
}

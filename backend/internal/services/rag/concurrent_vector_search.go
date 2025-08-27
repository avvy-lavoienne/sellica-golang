package rag

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// ConcurrentVectorSearch provides concurrent vector search capabilities using HNSW
type ConcurrentVectorSearch struct {
	hnswIndex         *HNSWIndex
	workerPool        *VectorWorkerPool  // Legacy worker pool (deprecated)
	dynamicWorkerPool *DynamicWorkerPool // New dynamic worker pool
	cache             *VectorSearchCache

	// Performance tracking
	searchCount   int64
	cacheHits     int64
	cacheMisses   int64
	performanceMu sync.RWMutex

	// Configuration
	config *ConcurrentSearchConfig

	// Memory monitoring
	memoryMonitor *MemoryMonitor

	// Dynamic scaling
	useDynamicPool bool
}

// ConcurrentSearchConfig holds configuration for concurrent vector search
type ConcurrentSearchConfig struct {
	WorkerPoolSize    int           `json:"worker_pool_size"`   // Number of concurrent workers
	CacheSize         int           `json:"cache_size"`         // Cache size for search results
	CacheTTL          time.Duration `json:"cache_ttl"`          // Cache time-to-live
	BatchSize         int           `json:"batch_size"`         // Batch size for concurrent processing
	SearchTimeout     time.Duration `json:"search_timeout"`     // Timeout for individual searches
	EnablePrefetching bool          `json:"enable_prefetching"` // Enable result prefetching
}

// VectorWorkerPool manages concurrent vector search workers
type VectorWorkerPool struct {
	workers    []*VectorWorker
	taskQueue  chan *VectorSearchTask
	resultPool sync.Pool

	// Worker management
	workerCount int
	isRunning   bool
	stopChan    chan struct{}
	wg          sync.WaitGroup
	mutex       sync.RWMutex
}

// VectorWorker represents a single vector search worker
type VectorWorker struct {
	id        int
	hnswIndex *HNSWIndex
	taskQueue chan *VectorSearchTask
	stopChan  chan struct{}
}

// VectorSearchTask represents a vector search task
type VectorSearchTask struct {
	ID       string
	Query    []float32
	K        int
	Context  context.Context
	Result   chan *VectorSearchTaskResult
	Metadata map[string]interface{}
}

// VectorSearchTaskResult represents the result of a vector search task
type VectorSearchTaskResult struct {
	Results  []HNSWSearchResult
	Error    error
	CacheHit bool
	Duration time.Duration
}

// VectorSearchCache provides caching for vector search results
type VectorSearchCache struct {
	cache  sync.Map
	ttl    time.Duration
	hits   int64
	misses int64
	mutex  sync.RWMutex
}

// CacheEntry represents a cached search result
type CacheEntry struct {
	Results   []HNSWSearchResult
	Timestamp time.Time
	TTL       time.Duration
}

// NewConcurrentVectorSearch creates a new concurrent vector search service
func NewConcurrentVectorSearch(hnswIndex *HNSWIndex, config *ConcurrentSearchConfig) *ConcurrentVectorSearch {
	if config == nil {
		config = &ConcurrentSearchConfig{
			WorkerPoolSize:    8,
			CacheSize:         1000,
			CacheTTL:          5 * time.Minute,
			BatchSize:         10,
			SearchTimeout:     5 * time.Second,
			EnablePrefetching: true,
		}
	}

	cvs := &ConcurrentVectorSearch{
		hnswIndex:      hnswIndex,
		config:         config,
		cache:          NewVectorSearchCache(config.CacheSize, config.CacheTTL),
		useDynamicPool: false, // Use legacy pool by default for backward compatibility
	}

	// Initialize worker pool
	cvs.workerPool = NewVectorWorkerPool(hnswIndex, config.WorkerPoolSize)

	// Initialize memory monitoring
	cvs.memoryMonitor = NewMemoryMonitor()
	cvs.memoryMonitor.StartMonitoring(30 * time.Second)

	logrus.WithFields(logrus.Fields{
		"worker_pool_size": config.WorkerPoolSize,
		"cache_size":       config.CacheSize,
		"cache_ttl":        config.CacheTTL,
		"batch_size":       config.BatchSize,
	}).Info("🚀 Concurrent vector search initialized")

	return cvs
}

// NewConcurrentVectorSearchWithDynamicPool creates a new concurrent vector search service with dynamic worker pool
func NewConcurrentVectorSearchWithDynamicPool(hnswIndex *HNSWIndex, config *ConcurrentSearchConfig, dynamicConfig *DynamicPoolConfig) *ConcurrentVectorSearch {
	if config == nil {
		config = &ConcurrentSearchConfig{
			WorkerPoolSize:    8,
			CacheSize:         1000,
			CacheTTL:          5 * time.Minute,
			BatchSize:         10,
			SearchTimeout:     5 * time.Second,
			EnablePrefetching: true,
		}
	}

	cvs := &ConcurrentVectorSearch{
		hnswIndex:      hnswIndex,
		config:         config,
		cache:          NewVectorSearchCache(config.CacheSize, config.CacheTTL),
		useDynamicPool: true, // Use dynamic pool
	}

	// Initialize dynamic worker pool
	cvs.dynamicWorkerPool = NewDynamicWorkerPool(hnswIndex, dynamicConfig)

	// Initialize memory monitoring
	cvs.memoryMonitor = NewMemoryMonitor()
	cvs.memoryMonitor.StartMonitoring(30 * time.Second)

	logrus.WithFields(logrus.Fields{
		"dynamic_pool":    true,
		"min_workers":     dynamicConfig.MinWorkers,
		"max_workers":     dynamicConfig.MaxWorkers,
		"initial_workers": dynamicConfig.InitialWorkers,
		"cache_size":      config.CacheSize,
		"cache_ttl":       config.CacheTTL,
	}).Info("🚀 Concurrent vector search with dynamic pool initialized")

	return cvs
}

// SearchSimilarConcurrent performs concurrent vector similarity search
func (cvs *ConcurrentVectorSearch) SearchSimilarConcurrent(
	ctx context.Context,
	query []float32,
	k int,
) ([]HNSWSearchResult, error) {
	startTime := time.Now()

	// Check context cancellation
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("context cancelled before search: %w", ctx.Err())
	default:
	}

	// Generate cache key
	cacheKey := cvs.generateCacheKey(query, k)

	// Check cache first
	if cached := cvs.cache.Get(cacheKey); cached != nil {
		cvs.recordCacheHit()
		logrus.WithFields(logrus.Fields{
			"cache_key": cacheKey,
			"k":         k,
			"duration":  time.Since(startTime),
		}).Debug("Vector search cache hit")
		return cached, nil
	}

	cvs.recordCacheMiss()

	// Create search task
	task := &VectorSearchTask{
		ID:      cacheKey,
		Query:   query,
		K:       k,
		Context: ctx,
		Result:  make(chan *VectorSearchTaskResult, 1),
	}

	// Submit task to appropriate worker pool
	var submitErr error
	if cvs.useDynamicPool && cvs.dynamicWorkerPool != nil {
		// Use dynamic worker pool
		submitErr = cvs.dynamicWorkerPool.SubmitTask(task)
		if submitErr != nil {
			return nil, fmt.Errorf("failed to submit task to dynamic worker pool: %w", submitErr)
		}
	} else {
		// Use legacy worker pool
		select {
		case cvs.workerPool.taskQueue <- task:
			// Task submitted successfully
		case <-ctx.Done():
			return nil, fmt.Errorf("context cancelled during task submission: %w", ctx.Err())
		case <-time.After(cvs.config.SearchTimeout):
			return nil, fmt.Errorf("search timeout: failed to submit task within %v", cvs.config.SearchTimeout)
		}
	}

	// Wait for result
	select {
	case result := <-task.Result:
		if result.Error != nil {
			return nil, fmt.Errorf("search failed: %w", result.Error)
		}

		// Cache the result
		cvs.cache.Set(cacheKey, result.Results)
		cvs.recordSearch()

		logrus.WithFields(logrus.Fields{
			"k":         k,
			"results":   len(result.Results),
			"duration":  time.Since(startTime),
			"cache_hit": result.CacheHit,
		}).Debug("Concurrent vector search completed")

		return result.Results, nil

	case <-ctx.Done():
		return nil, fmt.Errorf("context cancelled during search: %w", ctx.Err())
	case <-time.After(cvs.config.SearchTimeout):
		return nil, fmt.Errorf("search timeout: no result within %v", cvs.config.SearchTimeout)
	}
}

// BatchSearchConcurrent performs batch concurrent vector searches
func (cvs *ConcurrentVectorSearch) BatchSearchConcurrent(
	ctx context.Context,
	queries [][]float32,
	k int,
) ([][]HNSWSearchResult, error) {
	if len(queries) == 0 {
		return [][]HNSWSearchResult{}, nil
	}

	results := make([][]HNSWSearchResult, len(queries))
	errors := make([]error, len(queries))

	// Process in batches
	batchSize := cvs.config.BatchSize
	var wg sync.WaitGroup

	for i := 0; i < len(queries); i += batchSize {
		end := i + batchSize
		if end > len(queries) {
			end = len(queries)
		}

		wg.Add(1)
		go func(start, end int) {
			defer wg.Done()

			for j := start; j < end; j++ {
				// Check context cancellation
				select {
				case <-ctx.Done():
					errors[j] = ctx.Err()
					return
				default:
				}

				result, err := cvs.SearchSimilarConcurrent(ctx, queries[j], k)
				results[j] = result
				errors[j] = err
			}
		}(i, end)
	}

	wg.Wait()

	// Check for errors
	for i, err := range errors {
		if err != nil {
			return nil, fmt.Errorf("batch search failed at index %d: %w", i, err)
		}
	}

	return results, nil
}

// generateCacheKey generates a cache key for the query
func (cvs *ConcurrentVectorSearch) generateCacheKey(query []float32, k int) string {
	// Simple hash-based cache key generation
	// In production, you might want a more sophisticated approach
	hash := uint32(2166136261)
	for _, v := range query {
		hash ^= uint32(v * 1000) // Scale and convert to int
		hash *= 16777619
	}
	return fmt.Sprintf("vector_%d_%d", hash, k)
}

// Performance tracking methods
func (cvs *ConcurrentVectorSearch) recordSearch() {
	cvs.performanceMu.Lock()
	defer cvs.performanceMu.Unlock()
	cvs.searchCount++
}

func (cvs *ConcurrentVectorSearch) recordCacheHit() {
	cvs.performanceMu.Lock()
	defer cvs.performanceMu.Unlock()
	cvs.cacheHits++
}

func (cvs *ConcurrentVectorSearch) recordCacheMiss() {
	cvs.performanceMu.Lock()
	defer cvs.performanceMu.Unlock()
	cvs.cacheMisses++
}

// GetStats returns performance statistics
func (cvs *ConcurrentVectorSearch) GetStats() map[string]interface{} {
	cvs.performanceMu.RLock()
	defer cvs.performanceMu.RUnlock()

	cacheHitRatio := float64(0)
	if cvs.cacheHits+cvs.cacheMisses > 0 {
		cacheHitRatio = float64(cvs.cacheHits) / float64(cvs.cacheHits+cvs.cacheMisses) * 100
	}

	stats := map[string]interface{}{
		"total_searches":   cvs.searchCount,
		"cache_hits":       cvs.cacheHits,
		"cache_misses":     cvs.cacheMisses,
		"cache_hit_ratio":  cacheHitRatio,
		"worker_pool_size": cvs.config.WorkerPoolSize,
		"cache_size":       cvs.config.CacheSize,
	}

	// Add HNSW index stats
	if cvs.hnswIndex != nil {
		hnswStats := cvs.hnswIndex.GetStats()
		for k, v := range hnswStats {
			stats["hnsw_"+k] = v
		}
	}

	// Add worker pool stats
	if cvs.workerPool != nil {
		stats["worker_pool_active"] = cvs.workerPool.isRunning
		stats["worker_count"] = cvs.workerPool.workerCount
		stats["task_queue_size"] = len(cvs.workerPool.taskQueue)
	}

	return stats
}

// Close cleans up resources
func (cvs *ConcurrentVectorSearch) Close() error {
	logrus.Info("🔒 Closing concurrent vector search...")

	// Stop memory monitoring
	if cvs.memoryMonitor != nil {
		cvs.memoryMonitor.StopMonitoring()
	}

	// Stop appropriate worker pool
	if cvs.useDynamicPool && cvs.dynamicWorkerPool != nil {
		if err := cvs.dynamicWorkerPool.Stop(); err != nil {
			logrus.WithError(err).Warn("Error stopping dynamic worker pool")
		}
	} else if cvs.workerPool != nil {
		cvs.workerPool.Stop()
	}

	// Clear cache
	if cvs.cache != nil {
		cvs.cache.Clear()
	}

	logrus.Info("🔒 Concurrent vector search closed")
	return nil
}

// NewVectorWorkerPool creates a new vector worker pool
func NewVectorWorkerPool(hnswIndex *HNSWIndex, workerCount int) *VectorWorkerPool {
	pool := &VectorWorkerPool{
		workers:     make([]*VectorWorker, workerCount),
		taskQueue:   make(chan *VectorSearchTask, workerCount*10), // Buffer for tasks
		workerCount: workerCount,
		stopChan:    make(chan struct{}),
	}

	// Initialize result pool
	pool.resultPool.New = func() interface{} {
		return &VectorSearchTaskResult{}
	}

	// Start workers
	for i := 0; i < workerCount; i++ {
		worker := &VectorWorker{
			id:        i,
			hnswIndex: hnswIndex,
			taskQueue: pool.taskQueue,
			stopChan:  pool.stopChan,
		}
		pool.workers[i] = worker

		pool.wg.Add(1)
		go worker.run(&pool.wg)
	}

	pool.isRunning = true

	logrus.WithField("worker_count", workerCount).Info("🔧 Vector worker pool started")
	return pool
}

// Stop stops the worker pool
func (vwp *VectorWorkerPool) Stop() {
	vwp.mutex.Lock()
	defer vwp.mutex.Unlock()

	if !vwp.isRunning {
		return
	}

	close(vwp.stopChan)
	vwp.wg.Wait()
	close(vwp.taskQueue)
	vwp.isRunning = false

	logrus.Info("🔒 Vector worker pool stopped")
}

// run executes the worker loop
func (vw *VectorWorker) run(wg *sync.WaitGroup, metrics ...*PoolMetrics) {
	defer wg.Done()

	var poolMetrics *PoolMetrics
	if len(metrics) > 0 {
		poolMetrics = metrics[0]
	}

	logrus.WithField("worker_id", vw.id).Debug("Vector worker started")

	for {
		select {
		case task := <-vw.taskQueue:
			if task == nil {
				return // Channel closed
			}
			vw.processTaskWithMetrics(task, poolMetrics)

		case <-vw.stopChan:
			logrus.WithField("worker_id", vw.id).Debug("Vector worker stopped")
			return
		}
	}
}

// GetDynamicWorkerPool returns the dynamic worker pool if available
func (cvs *ConcurrentVectorSearch) GetDynamicWorkerPool() *DynamicWorkerPool {
	if cvs.useDynamicPool {
		return cvs.dynamicWorkerPool
	}
	return nil
}

// processTask processes a vector search task
func (vw *VectorWorker) processTask(task *VectorSearchTask) {
	vw.processTaskWithMetrics(task, nil)
}

// processTaskWithMetrics processes a vector search task with optional metrics recording
func (vw *VectorWorker) processTaskWithMetrics(task *VectorSearchTask, metrics *PoolMetrics) {
	startTime := time.Now()

	result := &VectorSearchTaskResult{
		Duration: 0,
		CacheHit: false,
	}

	// Perform HNSW search
	searchResults, err := vw.hnswIndex.SearchKNN(task.Context, task.Query, task.K)
	if err != nil {
		result.Error = err
	} else {
		result.Results = searchResults
	}

	result.Duration = time.Since(startTime)

	// Record metrics if available
	if metrics != nil {
		metrics.RecordResponseTime(result.Duration)

		// Update tasks per second calculation
		if result.Error == nil {
			// This is a simplified TPS calculation - in production you might want more sophisticated tracking
			currentTPS := 1.0 / result.Duration.Seconds()
			metrics.UpdateTasksPerSecond(currentTPS)
		}
	}

	// Send result back
	select {
	case task.Result <- result:
		// Result sent successfully
	case <-task.Context.Done():
		// Context cancelled, don't send result
	default:
		// Channel might be closed, log warning
		logrus.WithField("worker_id", vw.id).Warn("Failed to send search result")
	}
}

// NewVectorSearchCache creates a new vector search cache
func NewVectorSearchCache(size int, ttl time.Duration) *VectorSearchCache {
	return &VectorSearchCache{
		ttl: ttl,
	}
}

// Get retrieves a cached result
func (vsc *VectorSearchCache) Get(key string) []HNSWSearchResult {
	if value, ok := vsc.cache.Load(key); ok {
		entry := value.(*CacheEntry)

		// Check if entry is still valid
		if time.Since(entry.Timestamp) < entry.TTL {
			vsc.mutex.Lock()
			vsc.hits++
			vsc.mutex.Unlock()
			return entry.Results
		}

		// Entry expired, remove it
		vsc.cache.Delete(key)
	}

	vsc.mutex.Lock()
	vsc.misses++
	vsc.mutex.Unlock()
	return nil
}

// Set stores a result in the cache
func (vsc *VectorSearchCache) Set(key string, results []HNSWSearchResult) {
	entry := &CacheEntry{
		Results:   results,
		Timestamp: time.Now(),
		TTL:       vsc.ttl,
	}
	vsc.cache.Store(key, entry)
}

// Clear clears the cache
func (vsc *VectorSearchCache) Clear() {
	vsc.cache.Range(func(key, value interface{}) bool {
		vsc.cache.Delete(key)
		return true
	})
}

// GetStats returns cache statistics
func (vsc *VectorSearchCache) GetStats() map[string]interface{} {
	vsc.mutex.RLock()
	defer vsc.mutex.RUnlock()

	hitRatio := float64(0)
	if vsc.hits+vsc.misses > 0 {
		hitRatio = float64(vsc.hits) / float64(vsc.hits+vsc.misses) * 100
	}

	return map[string]interface{}{
		"hits":      vsc.hits,
		"misses":    vsc.misses,
		"hit_ratio": hitRatio,
		"ttl_ms":    vsc.ttl.Milliseconds(),
	}
}

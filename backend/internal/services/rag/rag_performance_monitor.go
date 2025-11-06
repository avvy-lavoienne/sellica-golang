package rag

import (
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// RAGPerformanceMonitor monitors RAG service performance
type RAGPerformanceMonitor struct {
	// Timing metrics
	embeddingTimes    []time.Duration
	searchTimes       []time.Duration
	indexingTimes     []time.Duration
	
	// Counter metrics
	totalSearches     int64
	totalIndexings    int64
	totalEmbeddings   int64
	cacheHits         int64
	cacheMisses       int64
	errorCounts       map[string]int64
	
	// Performance thresholds
	maxEmbeddingTime  time.Duration
	maxSearchTime     time.Duration
	maxIndexingTime   time.Duration
	
	// State
	isRunning         bool
	startTime         time.Time
	mu                sync.RWMutex
}

// RAGPerformanceStats represents performance statistics
type RAGPerformanceStats struct {
	// Timing statistics
	AvgEmbeddingTime    time.Duration `json:"avg_embedding_time"`
	AvgSearchTime       time.Duration `json:"avg_search_time"`
	AvgIndexingTime     time.Duration `json:"avg_indexing_time"`
	P95EmbeddingTime    time.Duration `json:"p95_embedding_time"`
	P95SearchTime       time.Duration `json:"p95_search_time"`
	P95IndexingTime     time.Duration `json:"p95_indexing_time"`
	
	// Counter statistics
	TotalSearches       int64         `json:"total_searches"`
	TotalIndexings      int64         `json:"total_indexings"`
	TotalEmbeddings     int64         `json:"total_embeddings"`
	CacheHits           int64         `json:"cache_hits"`
	CacheMisses         int64         `json:"cache_misses"`
	CacheHitRatio       float64       `json:"cache_hit_ratio"`
	
	// Error statistics
	ErrorCounts         map[string]int64 `json:"error_counts"`
	TotalErrors         int64         `json:"total_errors"`
	ErrorRate           float64       `json:"error_rate"`
	
	// Performance indicators
	IsHealthy           bool          `json:"is_healthy"`
	PerformanceScore    float64       `json:"performance_score"`
	Uptime              time.Duration `json:"uptime"`
}

// NewRAGPerformanceMonitor creates a new performance monitor
func NewRAGPerformanceMonitor() *RAGPerformanceMonitor {
	return &RAGPerformanceMonitor{
		embeddingTimes:   make([]time.Duration, 0),
		searchTimes:      make([]time.Duration, 0),
		indexingTimes:    make([]time.Duration, 0),
		errorCounts:      make(map[string]int64),
		maxEmbeddingTime: 10 * time.Millisecond,
		maxSearchTime:    20 * time.Millisecond,
		maxIndexingTime:  100 * time.Millisecond,
	}
}

// Start starts the performance monitor
func (rpm *RAGPerformanceMonitor) Start() {
	rpm.mu.Lock()
	defer rpm.mu.Unlock()
	
	if rpm.isRunning {
		return
	}
	
	rpm.isRunning = true
	rpm.startTime = time.Now()
	
	logrus.Info("📊 RAG performance monitor started")
}

// Stop stops the performance monitor
func (rpm *RAGPerformanceMonitor) Stop() {
	rpm.mu.Lock()
	defer rpm.mu.Unlock()
	
	rpm.isRunning = false
	
	logrus.Info("📊 RAG performance monitor stopped")
}

// RecordEmbeddingTime records embedding generation time
func (rpm *RAGPerformanceMonitor) RecordEmbeddingTime(duration time.Duration) {
	rpm.mu.Lock()
	defer rpm.mu.Unlock()
	
	rpm.embeddingTimes = append(rpm.embeddingTimes, duration)
	rpm.totalEmbeddings++
	
	// Keep only recent measurements
	if len(rpm.embeddingTimes) > 1000 {
		rpm.embeddingTimes = rpm.embeddingTimes[len(rpm.embeddingTimes)-1000:]
	}
	
	// Check performance threshold
	if duration > rpm.maxEmbeddingTime {
		logrus.WithFields(logrus.Fields{
			"duration":  duration,
			"threshold": rpm.maxEmbeddingTime,
		}).Warn("⚠️ Embedding generation time exceeded threshold")
	}
}

// RecordSearchTime records search time
func (rpm *RAGPerformanceMonitor) RecordSearchTime(duration time.Duration) {
	rpm.mu.Lock()
	defer rpm.mu.Unlock()
	
	rpm.searchTimes = append(rpm.searchTimes, duration)
	rpm.totalSearches++
	
	// Keep only recent measurements
	if len(rpm.searchTimes) > 1000 {
		rpm.searchTimes = rpm.searchTimes[len(rpm.searchTimes)-1000:]
	}
	
	// Check performance threshold
	if duration > rpm.maxSearchTime {
		logrus.WithFields(logrus.Fields{
			"duration":  duration,
			"threshold": rpm.maxSearchTime,
		}).Warn("⚠️ Search time exceeded threshold")
	}
}

// RecordIndexingTime records indexing time with optional document context
func (rpm *RAGPerformanceMonitor) RecordIndexingTime(duration time.Duration, documentID ...string) {
	rpm.mu.Lock()
	defer rpm.mu.Unlock()
	
	rpm.indexingTimes = append(rpm.indexingTimes, duration)
	rpm.totalIndexings++
	
	// Keep only recent measurements
	if len(rpm.indexingTimes) > 1000 {
		rpm.indexingTimes = rpm.indexingTimes[len(rpm.indexingTimes)-1000:]
	}
	
	// Check performance threshold - log as INFO instead of WARN for less prominence
	if duration > rpm.maxIndexingTime {
		fields := logrus.Fields{
			"duration":  duration,
			"threshold": rpm.maxIndexingTime,
		}
		
		// Include document ID if provided
		if len(documentID) > 0 && documentID[0] != "" {
			fields["document_id"] = documentID[0]
		}
		
		logrus.WithFields(fields).Info("📊 Indexing time exceeded threshold")
	}
}

// RecordCacheHit records a cache hit
func (rpm *RAGPerformanceMonitor) RecordCacheHit() {
	rpm.mu.Lock()
	defer rpm.mu.Unlock()
	
	rpm.cacheHits++
}

// RecordCacheMiss records a cache miss
func (rpm *RAGPerformanceMonitor) RecordCacheMiss() {
	rpm.mu.Lock()
	defer rpm.mu.Unlock()
	
	rpm.cacheMisses++
}

// RecordError records an error
func (rpm *RAGPerformanceMonitor) RecordError(errorType string) {
	rpm.mu.Lock()
	defer rpm.mu.Unlock()
	
	rpm.errorCounts[errorType]++
	
	logrus.WithField("error_type", errorType).Warn("⚠️ RAG error recorded")
}

// GetStats returns current performance statistics
func (rpm *RAGPerformanceMonitor) GetStats() *RAGPerformanceStats {
	rpm.mu.RLock()
	defer rpm.mu.RUnlock()
	
	stats := &RAGPerformanceStats{
		TotalSearches:   rpm.totalSearches,
		TotalIndexings:  rpm.totalIndexings,
		TotalEmbeddings: rpm.totalEmbeddings,
		CacheHits:       rpm.cacheHits,
		CacheMisses:     rpm.cacheMisses,
		ErrorCounts:     make(map[string]int64),
	}
	
	// Copy error counts
	for errorType, count := range rpm.errorCounts {
		stats.ErrorCounts[errorType] = count
		stats.TotalErrors += count
	}
	
	// Calculate cache hit ratio
	totalCacheRequests := rpm.cacheHits + rpm.cacheMisses
	if totalCacheRequests > 0 {
		stats.CacheHitRatio = float64(rpm.cacheHits) / float64(totalCacheRequests)
	}
	
	// Calculate error rate
	totalOperations := rpm.totalSearches + rpm.totalIndexings + rpm.totalEmbeddings
	if totalOperations > 0 {
		stats.ErrorRate = float64(stats.TotalErrors) / float64(totalOperations)
	}
	
	// Calculate timing statistics
	stats.AvgEmbeddingTime = rpm.calculateAverage(rpm.embeddingTimes)
	stats.AvgSearchTime = rpm.calculateAverage(rpm.searchTimes)
	stats.AvgIndexingTime = rpm.calculateAverage(rpm.indexingTimes)
	
	stats.P95EmbeddingTime = rpm.calculatePercentile(rpm.embeddingTimes, 0.95)
	stats.P95SearchTime = rpm.calculatePercentile(rpm.searchTimes, 0.95)
	stats.P95IndexingTime = rpm.calculatePercentile(rpm.indexingTimes, 0.95)
	
	// Calculate uptime
	if rpm.isRunning {
		stats.Uptime = time.Since(rpm.startTime)
	}
	
	// Calculate health and performance score
	stats.IsHealthy = rpm.calculateHealth(stats)
	stats.PerformanceScore = rpm.calculatePerformanceScore(stats)
	
	return stats
}

// calculateAverage calculates average duration
func (rpm *RAGPerformanceMonitor) calculateAverage(durations []time.Duration) time.Duration {
	if len(durations) == 0 {
		return 0
	}
	
	var total time.Duration
	for _, d := range durations {
		total += d
	}
	
	return total / time.Duration(len(durations))
}

// calculatePercentile calculates percentile duration
func (rpm *RAGPerformanceMonitor) calculatePercentile(durations []time.Duration, percentile float64) time.Duration {
	if len(durations) == 0 {
		return 0
	}
	
	// Simple percentile calculation (not perfectly accurate but sufficient)
	sorted := make([]time.Duration, len(durations))
	copy(sorted, durations)
	
	// Simple bubble sort
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i] > sorted[j] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	
	index := int(float64(len(sorted)) * percentile)
	if index >= len(sorted) {
		index = len(sorted) - 1
	}
	
	return sorted[index]
}

// calculateHealth determines if the system is healthy
func (rpm *RAGPerformanceMonitor) calculateHealth(stats *RAGPerformanceStats) bool {
	// Check error rate
	if stats.ErrorRate > 0.05 { // 5% error rate threshold
		return false
	}
	
	// Check performance thresholds
	if stats.P95EmbeddingTime > rpm.maxEmbeddingTime*2 {
		return false
	}
	
	if stats.P95SearchTime > rpm.maxSearchTime*2 {
		return false
	}
	
	if stats.P95IndexingTime > rpm.maxIndexingTime*2 {
		return false
	}
	
	// Check cache performance
	if stats.CacheHitRatio < 0.7 && stats.TotalSearches > 100 {
		return false
	}
	
	return true
}

// calculatePerformanceScore calculates overall performance score (0-1)
func (rpm *RAGPerformanceMonitor) calculatePerformanceScore(stats *RAGPerformanceStats) float64 {
	score := 1.0
	
	// Penalize high error rates
	score -= stats.ErrorRate * 2 // Each 1% error rate reduces score by 2%
	
	// Penalize slow performance
	if stats.P95EmbeddingTime > rpm.maxEmbeddingTime {
		penalty := float64(stats.P95EmbeddingTime-rpm.maxEmbeddingTime) / float64(rpm.maxEmbeddingTime)
		score -= penalty * 0.2
	}
	
	if stats.P95SearchTime > rpm.maxSearchTime {
		penalty := float64(stats.P95SearchTime-rpm.maxSearchTime) / float64(rpm.maxSearchTime)
		score -= penalty * 0.3
	}
	
	// Reward good cache performance
	if stats.CacheHitRatio > 0.9 {
		score += 0.1
	}
	
	// Ensure score is between 0 and 1
	if score < 0 {
		score = 0
	}
	if score > 1 {
		score = 1
	}
	
	return score
}

// LogPerformanceSummary logs a performance summary
func (rpm *RAGPerformanceMonitor) LogPerformanceSummary() {
	stats := rpm.GetStats()
	
	logrus.WithFields(logrus.Fields{
		"avg_embedding_time": stats.AvgEmbeddingTime,
		"avg_search_time":    stats.AvgSearchTime,
		"avg_indexing_time":  stats.AvgIndexingTime,
		"cache_hit_ratio":    stats.CacheHitRatio,
		"error_rate":         stats.ErrorRate,
		"performance_score":  stats.PerformanceScore,
		"is_healthy":         stats.IsHealthy,
		"uptime":            stats.Uptime,
	}).Info("📊 RAG Performance Summary")
}

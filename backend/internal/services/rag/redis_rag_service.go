package rag

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// VectorOperationsInterface defines the interface for vector operations
type VectorOperationsInterface interface {
	SearchSimilar(ctx context.Context, queryEmbedding []float64, limit int) (*VectorSearchResult, error)
	SearchByKeywords(ctx context.Context, keywords []string, limit int) (*VectorSearchResult, error)
	GetDocumentCount(ctx context.Context) (int64, error)
	DeleteDocument(ctx context.Context, docID string) error
}

// RedisRAGService provides Redis-based RAG capabilities for SELLY AI
type RedisRAGService struct {
	redis              *redis.Client
	embeddingService   *EmbeddingService
	vectorOperations   VectorOperationsInterface
	cacheOptimizer     *RAGCacheOptimizer
	performanceMonitor *RAGPerformanceMonitor
	memoryMonitor      *MemoryMonitor

	// Configuration
	config *RAGConfig

	// State management
	mu               sync.RWMutex
	isInitialized    bool
	indexName        string
	vectorDimensions int
	maxVectors       int

	// Context for graceful shutdown
	ctx    context.Context
	cancel context.CancelFunc
}

// RAGConfig holds configuration for Redis RAG service
type RAGConfig struct {
	IndexName           string        `json:"index_name"`
	VectorDimensions    int           `json:"vector_dimensions"`
	MaxVectors          int           `json:"max_vectors"`
	SimilarityThreshold float64       `json:"similarity_threshold"`
	MaxResults          int           `json:"max_results"`
	CacheEnabled        bool          `json:"cache_enabled"`
	CacheTTL            time.Duration `json:"cache_ttl"`
	CompressionEnabled  bool          `json:"compression_enabled"`
}

// RAGDocument represents a document in the RAG system
type RAGDocument struct {
	ID          string            `json:"id"`
	Content     string            `json:"content"`
	Title       string            `json:"title"`
	ServiceType string            `json:"service_type"`
	Keywords    []string          `json:"keywords"`
	Metadata    map[string]string `json:"metadata"`
	Embedding   []float64         `json:"embedding"`
	IndexedAt   time.Time         `json:"indexed_at"`
}

// RAGSearchResult represents search results from RAG
type RAGSearchResult struct {
	Documents    []*RAGDocument `json:"documents"`
	Scores       []float64      `json:"scores"`
	QueryTime    time.Duration  `json:"query_time"`
	TotalResults int            `json:"total_results"`
	CacheHit     bool           `json:"cache_hit"`
}

// RAGContext represents context for AI processing
type RAGContext struct {
	Documents       []*RAGDocument `json:"documents"`
	RelevanceScores []float64      `json:"relevance_scores"`
	QueryEmbedding  []float64      `json:"query_embedding"`
	ProcessingTime  time.Duration  `json:"processing_time"`
	Source          string         `json:"source"`
}

// NewRedisRAGService creates a new Redis RAG service
func NewRedisRAGService(redisClient *redis.Client) *RedisRAGService {
	config := &RAGConfig{
		IndexName:           "selly_rag_index",
		VectorDimensions:    768, // Indonesian BERT embeddings
		MaxVectors:          100000,
		SimilarityThreshold: 0.7,
		MaxResults:          10,
		CacheEnabled:        true,
		CacheTTL:            1 * time.Hour,
		CompressionEnabled:  true,
	}

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())

	service := &RedisRAGService{
		redis:            redisClient,
		config:           config,
		indexName:        config.IndexName,
		vectorDimensions: config.VectorDimensions,
		maxVectors:       config.MaxVectors,
		ctx:              ctx,
		cancel:           cancel,
	}

	// Initialize components with optimizations
	service.embeddingService = NewEmbeddingServiceWithRedis(redisClient)
	service.vectorOperations = NewVectorOperations(redisClient, config) // Use optimized vector operations
	service.cacheOptimizer = NewRAGCacheOptimizer(redisClient, config)
	service.performanceMonitor = NewRAGPerformanceMonitor()

	// Initialize memory monitor with 30-second monitoring interval
	service.memoryMonitor = NewMemoryMonitor()
	service.memoryMonitor.StartMonitoring(30 * time.Second)

	return service
}

// Initialize initializes the Redis RAG service
func (rrs *RedisRAGService) Initialize(ctx context.Context) error {
	rrs.mu.Lock()
	defer rrs.mu.Unlock()

	if rrs.isInitialized {
		return nil
	}

	logrus.Info("🚀 Initializing Redis RAG service...")

	// Step 1: Test Redis connection (no vector index needed for Upstash)
	_, err := rrs.redis.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	// Step 2: Initialize embedding service
	if err := rrs.embeddingService.Initialize(ctx); err != nil {
		return fmt.Errorf("failed to initialize embedding service: %w", err)
	}

	// Step 3: Initialize cache optimizer
	if err := rrs.cacheOptimizer.Initialize(ctx); err != nil {
		return fmt.Errorf("failed to initialize cache optimizer: %w", err)
	}

	// Step 4: Start performance monitoring
	rrs.performanceMonitor.Start()

	rrs.isInitialized = true
	logrus.Info("✅ Redis RAG service initialized successfully")

	return nil
}

// IndexDocument indexes a document in the RAG system
func (rrs *RedisRAGService) IndexDocument(ctx context.Context, doc *RAGDocument) error {
	startTime := time.Now()
	defer func() {
		rrs.performanceMonitor.RecordIndexingTime(time.Since(startTime))
	}()

	if !rrs.isInitialized {
		return fmt.Errorf("RAG service not initialized")
	}

	// Generate embedding for document content
	embedding, err := rrs.embeddingService.GenerateEmbedding(ctx, doc.Content)
	if err != nil {
		rrs.performanceMonitor.RecordError("embedding_generation")
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	doc.Embedding = embedding
	doc.IndexedAt = time.Now()

	// Store document using Upstash vector operations
	if upstashOps, ok := rrs.vectorOperations.(*UpstashVectorOperations); ok {
		if err := upstashOps.StoreDocument(ctx, doc); err != nil {
			rrs.performanceMonitor.RecordError("document_storage")
			return fmt.Errorf("failed to store document: %w", err)
		}
	} else {
		rrs.performanceMonitor.RecordError("document_storage")
		return fmt.Errorf("unsupported vector operations type")
	}

	logrus.WithFields(logrus.Fields{
		"document_id":    doc.ID,
		"service_type":   doc.ServiceType,
		"content_length": len(doc.Content),
		"keywords":       len(doc.Keywords),
	}).Info("📄 Document indexed successfully")

	return nil
}

// SearchSimilar searches for similar documents
func (rrs *RedisRAGService) SearchSimilar(ctx context.Context, query string, limit int) (*RAGSearchResult, error) {
	startTime := time.Now()
	defer func() {
		rrs.performanceMonitor.RecordSearchTime(time.Since(startTime))
	}()

	if !rrs.isInitialized {
		return nil, fmt.Errorf("RAG service not initialized")
	}

	// Check intelligent multi-level cache first (L1 -> L2 -> L3)
	if rrs.config.CacheEnabled {
		if cached := rrs.cacheOptimizer.GetCachedResult(query, limit); cached != nil {
			cached.CacheHit = true
			rrs.performanceMonitor.RecordCacheHit()

			// Log cache performance for monitoring
			logrus.WithFields(logrus.Fields{
				"query":         query[:min(50, len(query))],
				"cache_hit":     true,
				"response_time": time.Since(startTime),
			}).Debug("🎯 RAG cache hit - optimized response")

			return cached, nil
		}
	}

	// Generate query embedding
	queryEmbedding, err := rrs.embeddingService.GenerateEmbedding(ctx, query)
	if err != nil {
		rrs.performanceMonitor.RecordError("query_embedding")
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}

	// Perform vector search
	results, err := rrs.vectorOperations.SearchSimilar(ctx, queryEmbedding, limit)
	if err != nil {
		rrs.performanceMonitor.RecordError("vector_search")
		return nil, fmt.Errorf("vector search failed: %w", err)
	}

	searchResult := &RAGSearchResult{
		Documents:    results.Documents,
		Scores:       results.Scores,
		QueryTime:    time.Since(startTime),
		TotalResults: len(results.Documents),
		CacheHit:     false,
	}

	// Cache result with intelligent multi-level caching and predictive warming
	if rrs.config.CacheEnabled {
		rrs.cacheOptimizer.CacheResult(query, limit, searchResult)
	}

	rrs.performanceMonitor.RecordCacheMiss()

	// Log performance metrics for optimization tracking
	logrus.WithFields(logrus.Fields{
		"query":         query[:min(50, len(query))],
		"cache_hit":     false,
		"response_time": time.Since(startTime),
		"results_count": len(searchResult.Documents),
	}).Debug("🔍 RAG search completed - optimized processing")

	return searchResult, nil
}

// min helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Getter methods for accessing internal components

// GetEmbeddingService returns the embedding service
func (rrs *RedisRAGService) GetEmbeddingService() *EmbeddingService {
	return rrs.embeddingService
}

// GetCacheOptimizer returns the cache optimizer
func (rrs *RedisRAGService) GetCacheOptimizer() *RAGCacheOptimizer {
	return rrs.cacheOptimizer
}

// GetVectorOperations returns the vector operations interface
func (rrs *RedisRAGService) GetVectorOperations() *VectorOperations {
	if vo, ok := rrs.vectorOperations.(*VectorOperations); ok {
		return vo
	}
	return nil
}

// GetPerformanceMonitor returns the performance monitor
func (rrs *RedisRAGService) GetPerformanceMonitor() *RAGPerformanceMonitor {
	return rrs.performanceMonitor
}

// RetrieveContext retrieves RAG context for AI processing with context cancellation support
func (rrs *RedisRAGService) RetrieveContext(ctx context.Context, query string, maxDocuments int) (*RAGContext, error) {
	startTime := time.Now()

	// Check if context is already cancelled
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("context cancelled before processing: %w", ctx.Err())
	default:
	}

	// Record memory usage before processing
	if rrs.memoryMonitor != nil {
		beforeStats := rrs.memoryMonitor.GetCurrentStats()
		defer func() {
			afterStats := rrs.memoryMonitor.GetCurrentStats()
			memoryDelta := afterStats.AllocMB - beforeStats.AllocMB
			if memoryDelta > 10 { // Log if memory usage increased by more than 10MB
				logrus.WithFields(logrus.Fields{
					"memory_delta_mb": memoryDelta,
					"query":           query,
				}).Debug("High memory usage detected during RAG context retrieval")
			}
		}()
	}

	// Search for similar documents with context cancellation check
	searchResult, err := rrs.SearchSimilar(ctx, query, maxDocuments)
	if err != nil {
		return nil, fmt.Errorf("failed to search similar documents: %w", err)
	}

	// Check context cancellation after search
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("context cancelled during search: %w", ctx.Err())
	default:
	}

	// Filter documents by relevance threshold
	var relevantDocs []*RAGDocument
	var relevanceScores []float64

	for i, doc := range searchResult.Documents {
		// Check context cancellation during filtering
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("context cancelled during filtering: %w", ctx.Err())
		default:
		}

		if i < len(searchResult.Scores) && searchResult.Scores[i] >= rrs.config.SimilarityThreshold {
			relevantDocs = append(relevantDocs, doc)
			relevanceScores = append(relevanceScores, searchResult.Scores[i])
		}
	}

	// Generate query embedding for context with cancellation check
	queryEmbedding, err := rrs.embeddingService.GenerateEmbedding(ctx, query)
	if err != nil {
		logrus.WithError(err).Warn("Failed to generate query embedding for context")
		queryEmbedding = nil
	}

	context := &RAGContext{
		Documents:       relevantDocs,
		RelevanceScores: relevanceScores,
		QueryEmbedding:  queryEmbedding,
		ProcessingTime:  time.Since(startTime),
		Source:          "redis_rag",
	}

	logrus.WithFields(logrus.Fields{
		"query":           query,
		"documents_found": len(relevantDocs),
		"processing_time": context.ProcessingTime,
		"cache_hit":       searchResult.CacheHit,
	}).Info("🔍 RAG context retrieved")

	return context, nil
}

// RetrieveContextWithTimeout retrieves RAG context with explicit timeout control
func (rrs *RedisRAGService) RetrieveContextWithTimeout(ctx context.Context, query string, maxDocuments int, timeout time.Duration) (*RAGContext, error) {
	// Create context with timeout
	timeoutCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	// Use the regular RetrieveContext method with timeout context
	return rrs.RetrieveContext(timeoutCtx, query, maxDocuments)
}

// Note: Vector index creation not needed for Upstash Redis
// Using standard Redis operations instead of RediSearch module

// Note: Document storage handled by UpstashVectorOperations
// Legacy storeDocument method removed in favor of Upstash-compatible operations

// GetStats returns RAG service statistics
func (rrs *RedisRAGService) GetStats() *RAGStats {
	return &RAGStats{
		IsInitialized:    rrs.isInitialized,
		IndexName:        rrs.indexName,
		VectorDimensions: rrs.vectorDimensions,
		MaxVectors:       rrs.maxVectors,
		Performance:      rrs.performanceMonitor.GetStats(),
	}
}

// RAGStats represents RAG service statistics
type RAGStats struct {
	IsInitialized    bool                 `json:"is_initialized"`
	IndexName        string               `json:"index_name"`
	VectorDimensions int                  `json:"vector_dimensions"`
	MaxVectors       int                  `json:"max_vectors"`
	Performance      *RAGPerformanceStats `json:"performance"`
}

// Close closes the RAG service and cleans up all resources
func (rrs *RedisRAGService) Close() error {
	rrs.mu.Lock()
	defer rrs.mu.Unlock()

	logrus.Info("🔒 Shutting down Redis RAG service...")

	// Stop memory monitoring
	if rrs.memoryMonitor != nil {
		rrs.memoryMonitor.StopMonitoring()
		logrus.Info("✅ Memory monitor stopped")
	}

	// Stop performance monitoring
	if rrs.performanceMonitor != nil {
		rrs.performanceMonitor.Stop()
		logrus.Info("✅ Performance monitor stopped")
	}

	// Cleanup embedding service resources
	if rrs.embeddingService != nil {
		if err := rrs.embeddingService.Close(); err != nil {
			logrus.WithError(err).Warn("⚠️ Error closing embedding service")
		} else {
			logrus.Info("✅ Embedding service closed")
		}
	}

	// Cleanup cache optimizer resources
	if rrs.cacheOptimizer != nil {
		if err := rrs.cacheOptimizer.Close(); err != nil {
			logrus.WithError(err).Warn("⚠️ Error closing cache optimizer")
		} else {
			logrus.Info("✅ Cache optimizer closed")
		}
	}

	// Cancel context to stop all background operations
	if rrs.cancel != nil {
		rrs.cancel()
		logrus.Info("✅ Background operations cancelled")
	}

	// Force garbage collection to clean up resources
	if rrs.memoryMonitor != nil {
		rrs.memoryMonitor.ForceGarbageCollection()
	}

	rrs.isInitialized = false
	logrus.Info("🔒 Redis RAG service closed successfully")

	return nil
}

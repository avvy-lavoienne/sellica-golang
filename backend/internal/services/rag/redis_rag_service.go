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
	redis               *redis.Client
	embeddingService    *EmbeddingService
	vectorOperations    VectorOperationsInterface
	cacheOptimizer      *RAGCacheOptimizer
	performanceMonitor  *RAGPerformanceMonitor
	
	// Configuration
	config              *RAGConfig
	
	// State management
	mu                  sync.RWMutex
	isInitialized       bool
	indexName           string
	vectorDimensions    int
	maxVectors          int
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

	service := &RedisRAGService{
		redis:            redisClient,
		config:           config,
		indexName:        config.IndexName,
		vectorDimensions: config.VectorDimensions,
		maxVectors:       config.MaxVectors,
	}

	// Initialize components
	service.embeddingService = NewEmbeddingService()
	service.vectorOperations = NewUpstashVectorOperations(redisClient, config)
	service.cacheOptimizer = NewRAGCacheOptimizer(redisClient, config)
	service.performanceMonitor = NewRAGPerformanceMonitor()

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

	// Check cache first
	if rrs.config.CacheEnabled {
		if cached := rrs.cacheOptimizer.GetCachedResult(query, limit); cached != nil {
			cached.CacheHit = true
			rrs.performanceMonitor.RecordCacheHit()
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

	// Cache result
	if rrs.config.CacheEnabled {
		rrs.cacheOptimizer.CacheResult(query, limit, searchResult)
	}

	rrs.performanceMonitor.RecordCacheMiss()
	return searchResult, nil
}

// RetrieveContext retrieves RAG context for AI processing
func (rrs *RedisRAGService) RetrieveContext(ctx context.Context, query string, maxDocuments int) (*RAGContext, error) {
	startTime := time.Now()

	// Search for similar documents
	searchResult, err := rrs.SearchSimilar(ctx, query, maxDocuments)
	if err != nil {
		return nil, fmt.Errorf("failed to search similar documents: %w", err)
	}

	// Filter documents by relevance threshold
	var relevantDocs []*RAGDocument
	var relevanceScores []float64

	for i, doc := range searchResult.Documents {
		if i < len(searchResult.Scores) && searchResult.Scores[i] >= rrs.config.SimilarityThreshold {
			relevantDocs = append(relevantDocs, doc)
			relevanceScores = append(relevanceScores, searchResult.Scores[i])
		}
	}

	// Generate query embedding for context
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
		"query":            query,
		"documents_found":  len(relevantDocs),
		"processing_time":  context.ProcessingTime,
		"cache_hit":        searchResult.CacheHit,
	}).Info("🔍 RAG context retrieved")

	return context, nil
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
	IsInitialized    bool                      `json:"is_initialized"`
	IndexName        string                    `json:"index_name"`
	VectorDimensions int                       `json:"vector_dimensions"`
	MaxVectors       int                       `json:"max_vectors"`
	Performance      *RAGPerformanceStats      `json:"performance"`
}

// Close closes the RAG service
func (rrs *RedisRAGService) Close() error {
	rrs.mu.Lock()
	defer rrs.mu.Unlock()

	if rrs.performanceMonitor != nil {
		rrs.performanceMonitor.Stop()
	}

	rrs.isInitialized = false
	logrus.Info("🔒 Redis RAG service closed")

	return nil
}

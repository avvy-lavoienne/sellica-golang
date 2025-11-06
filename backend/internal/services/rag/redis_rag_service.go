package rag

import (
	"context"
	"fmt"
	"math"
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

	// Use HNSW vector operations for improved performance
	service.vectorOperations = NewHNSWVectorOperations(redisClient, config)

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

	// Enhanced logging for document indexing pipeline
	indexingInfo := map[string]interface{}{
		"document_id": doc.ID,
		"service_type": doc.ServiceType,
		"content_length": len(doc.Content),
		"title": doc.Title,
		"keywords_count": len(doc.Keywords),
		"has_metadata": doc.Metadata != nil,
		"step": "indexing_start",
	}
	
	if doc.Metadata != nil {
		indexingInfo["metadata_count"] = len(doc.Metadata)
	}
	
	// TEMPORARILY DISABLED: Document indexing logs for focus on auth workflow
	// logrus.WithFields(logrus.Fields{
	// 	"indexing_info": indexingInfo,
	// }).Info("📝 [INDEXING] Starting document indexing with enhanced debugging")

	// Generate embedding for document content with detailed logging
	embeddingStartTime := time.Now()
	// logrus.WithFields(logrus.Fields{
	// 	"document_id": doc.ID,
	// 	"content_preview": truncateString(doc.Content, 100),
	// 	"embedding_service_initialized": rrs.embeddingService != nil,
	// 	"step": "embedding_generation_start",
	// }).Debug("🔤 [INDEXING] Generating embedding for document content")

	embedding, err := rrs.embeddingService.GenerateEmbedding(ctx, doc.Content)
	embeddingDuration := time.Since(embeddingStartTime)
	
	if err != nil {
		rrs.performanceMonitor.RecordError("embedding_generation")
		logrus.WithError(err).WithFields(logrus.Fields{
			"document_id": doc.ID,
			"content_length": len(doc.Content),
			"embedding_duration": embeddingDuration,
			"step": "embedding_generation_failed",
		}).Error("❌ [INDEXING] Failed to generate embedding for document")
		return fmt.Errorf("failed to generate embedding: %w", err)
	}
	
	// Validate generated embedding
	embeddingValidation := map[string]interface{}{
		"embedding_length": len(embedding),
		"embedding_generation_time": embeddingDuration,
		"embedding_non_empty": len(embedding) > 0,
		"embedding_non_zero": false,
	}
	
	for _, val := range embedding {
		if val != 0.0 {
			embeddingValidation["embedding_non_zero"] = true
			break
		}
	}
	
	// TEMPORARILY DISABLED: Embedding validation logs
	// logrus.WithFields(logrus.Fields{
	// 	"document_id": doc.ID,
	// 	"embedding_validation": embeddingValidation,
	// 	"step": "embedding_generation_success",
	// }).Info("✅ [INDEXING] Document embedding generated and validated")

	doc.Embedding = embedding
	doc.IndexedAt = time.Now()

	// Store document using HNSW vector operations with validation
	storageStartTime := time.Now()
	storageInfo := map[string]interface{}{
		"vector_operations_type": fmt.Sprintf("%T", rrs.vectorOperations),
		"is_hnsw_ops": false,
		"storage_method": "unknown",
	}
	
	if hnswOps, ok := rrs.vectorOperations.(*HNSWVectorOperations); ok {
		storageInfo["is_hnsw_ops"] = true
		storageInfo["storage_method"] = "hnsw"
		
	// TEMPORARILY DISABLED: HNSW storage logs
	// logrus.WithFields(logrus.Fields{
	// 	"document_id": doc.ID,
	// 	"storage_info": storageInfo,
	// 	"step": "hnsw_storage_start",
	// }).Debug("🏗️ [INDEXING] Storing document using HNSW vector operations")
		
		if err := hnswOps.StoreDocument(ctx, doc); err != nil {
			storageInfo["storage_error"] = err.Error()
			rrs.performanceMonitor.RecordError("document_storage")
			
			logrus.WithError(err).WithFields(logrus.Fields{
				"document_id": doc.ID,
				"storage_info": storageInfo,
				"step": "hnsw_storage_failed",
			}).Error("❌ [INDEXING] Failed to store document in HNSW")
			return fmt.Errorf("failed to store document: %w", err)
		}
		
		storageInfo["storage_success"] = true
		
	} else if upstashOps, ok := rrs.vectorOperations.(*UpstashVectorOperations); ok {
		storageInfo["is_upstash_ops"] = true
		storageInfo["storage_method"] = "upstash"
		
	// TEMPORARILY DISABLED: Upstash storage logs
	// logrus.WithFields(logrus.Fields{
	// 	"document_id": doc.ID,
	// 	"storage_info": storageInfo,
	// 	"step": "upstash_storage_start",
	// }).Debug("🏗️ [INDEXING] Storing document using Upstash vector operations")
		
		if err := upstashOps.StoreDocument(ctx, doc); err != nil {
			storageInfo["storage_error"] = err.Error()
			rrs.performanceMonitor.RecordError("document_storage")
			
			logrus.WithError(err).WithFields(logrus.Fields{
				"document_id": doc.ID,
				"storage_info": storageInfo,
				"step": "upstash_storage_failed",
			}).Error("❌ [INDEXING] Failed to store document in Upstash")
			return fmt.Errorf("failed to store document: %w", err)
		}
		
		storageInfo["storage_success"] = true
		
	} else {
		storageInfo["unknown_ops"] = true
		rrs.performanceMonitor.RecordError("document_storage")
		
		logrus.WithFields(logrus.Fields{
			"document_id": doc.ID,
			"storage_info": storageInfo,
			"step": "storage_type_unknown",
		}).Error("❌ [INDEXING] Unknown vector operations type - cannot store document")
		return fmt.Errorf("HNSW or Upstash vector operations required for document storage")
	}
	
	storageDuration := time.Since(storageStartTime)
	storageInfo["storage_duration"] = storageDuration

	// Final indexing summary
	// TEMPORARILY DISABLED: indexing logs - comment out the whole indexingSummary map since it's only used in disabled logs
	// indexingSummary := map[string]interface{}{
	// 	"document_id": doc.ID,
	// 	"service_type": doc.ServiceType,
	// 	"content_length": len(doc.Content),
	// 	"total_indexing_time": time.Since(startTime),
	// 	"embedding_time": embeddingDuration,
	// 	"storage_time": storageDuration,
	// 	"embedding_dimensions": len(embedding),
	// 	"indexed_at": doc.IndexedAt,
	// 	"success": true,
	// }

	// TEMPORARILY DISABLED: Final indexing summary logs
	// logrus.WithFields(logrus.Fields{
	// 	"indexing_summary": indexingSummary,
	// 	"step": "indexing_complete",
	// }).Info("🎯 [INDEXING] Document indexing completed successfully")

	// TEMPORARILY DISABLED: Document indexed successfully log
	// logrus.WithFields(logrus.Fields{
	// 	"document_id":    doc.ID,
	// 	"service_type":   doc.ServiceType,
	// 	"content_length": len(doc.Content),
	// 	"keywords":       len(doc.Keywords),
	// }).Info("📄 Document indexed successfully")

	return nil
}

// SearchSimilar searches for similar documents
func (rrs *RedisRAGService) SearchSimilar(ctx context.Context, query string, limit int) (*RAGSearchResult, error) {
	startTime := time.Now()
	defer func() {
		rrs.performanceMonitor.RecordSearchTime(time.Since(startTime))
	}()

	if !rrs.isInitialized {
		logrus.WithField("query", query).Error("❌ RAG service not initialized")
		return nil, fmt.Errorf("RAG service not initialized")
	}

	logrus.WithFields(logrus.Fields{
		"query": query,
		"limit": limit,
		"service_initialized": rrs.isInitialized,
	}).Debug("🔍 Starting RAG search with detailed debugging")

	// Check intelligent multi-level cache first (L1 -> L2 -> L3)
	if rrs.config.CacheEnabled {
		if cached := rrs.cacheOptimizer.GetCachedResult(query, limit); cached != nil {
			cached.CacheHit = true
			rrs.performanceMonitor.RecordCacheHit()

			logrus.WithFields(logrus.Fields{
				"query":         query[:min(50, len(query))],
				"cache_hit":     true,
				"cached_results": len(cached.Documents),
				"response_time": time.Since(startTime),
			}).Info("🎯 RAG cache hit - returning cached results")

			return cached, nil
		}
		logrus.WithField("query", query).Debug("💾 Cache miss - proceeding with vector search")
	}

	// Generate query embedding with comprehensive debugging
	embeddingStartTime := time.Now()
	logrus.WithFields(logrus.Fields{
		"query": query,
		"query_length": len(query),
		"service_initialized": rrs.embeddingService != nil,
		"step": "embedding_generation_start",
	}).Debug("🔤 [PIPELINE] Starting query embedding generation...")

	queryEmbedding, err := rrs.embeddingService.GenerateEmbedding(ctx, query)
	embeddingDuration := time.Since(embeddingStartTime)
	
	if err != nil {
		rrs.performanceMonitor.RecordError("query_embedding")
		logrus.WithError(err).WithFields(logrus.Fields{
			"query": query,
			"embedding_duration": embeddingDuration,
			"step": "embedding_generation_failed",
		}).Error("❌ [PIPELINE] Failed to generate query embedding")
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}

	// Validate embedding dimensions and content
	embeddingValid := len(queryEmbedding) > 0
	embeddingNonZero := false
	embeddingSum := 0.0
	embeddingMin, embeddingMax := math.Inf(1), math.Inf(-1)
	
	for _, val := range queryEmbedding {
		embeddingSum += val
		if val != 0.0 {
			embeddingNonZero = true
		}
		if val < embeddingMin {
			embeddingMin = val
		}
		if val > embeddingMax {
			embeddingMax = val
		}
	}
	
	embeddingMean := embeddingSum / float64(len(queryEmbedding))

	logrus.WithFields(logrus.Fields{
		"query": query,
		"embedding_dim": len(queryEmbedding),
		"embedding_sample": queryEmbedding[:min(5, len(queryEmbedding))],
		"embedding_generation_time": embeddingDuration,
		"embedding_valid": embeddingValid,
		"embedding_non_zero": embeddingNonZero,
		"embedding_mean": embeddingMean,
		"embedding_min": embeddingMin,
		"embedding_max": embeddingMax,
		"step": "embedding_generation_complete",
	}).Info("🔤 [PIPELINE] Query embedding generated with validation")

	// ===== COMPREHENSIVE DEBUG LOGGING BETWEEN EMBEDDING AND SEARCH =====
	// Pipeline state validation and quality metrics
	pipelineState := map[string]interface{}{
		"query_length": len(query),
		"embedding_dimensions": len(queryEmbedding),
		"expected_dimensions": rrs.vectorDimensions,
		"dimensions_match": len(queryEmbedding) == rrs.vectorDimensions,
		"embedding_quality_score": rrs.calculateEmbeddingQuality(queryEmbedding),
		"pipeline_stage": "post_embedding_pre_search",
		"context_cancelled": ctx.Err() != nil,
		"service_initialized": rrs.isInitialized,
		"cache_enabled": rrs.config.CacheEnabled,
		"similarity_threshold": rrs.config.SimilarityThreshold,
		"max_results": rrs.config.MaxResults,
		"step": "pipeline_state_validation",
	}

	// Memory usage analysis at pipeline transition point
	if rrs.memoryMonitor != nil {
		currentStats := rrs.memoryMonitor.GetCurrentStats()
		pipelineState["memory_alloc_mb"] = currentStats.AllocMB
		pipelineState["memory_sys_mb"] = currentStats.SysMB
		pipelineState["memory_gc_cycles"] = currentStats.NumGC
		pipelineState["memory_heap_objects"] = currentStats.HeapObjects
	}

	// Embedding statistical analysis for debugging
	embeddingStats := rrs.analyzeEmbeddingStatistics(queryEmbedding)
	pipelineState["embedding_stats"] = embeddingStats

	// Performance metrics from embedding generation
	embeddingPerf := map[string]interface{}{
		"generation_duration_ms": embeddingDuration.Milliseconds(),
		"cache_hit": false, // This is post-cache miss
		"parallel_workers_used": 4, // From embedding service
		"morphology_processed": true,
		"cultural_processed": true,
		"government_processed": true,
	}
	pipelineState["embedding_performance"] = embeddingPerf

	logrus.WithFields(logrus.Fields{
		"pipeline_state": pipelineState,
		"step": "comprehensive_pipeline_debug",
	}).Info("🔍 [DEBUG] Comprehensive pipeline analysis between embedding generation and vector search")

	// Validate pipeline readiness for search operation
	searchReadiness := map[string]interface{}{
		"embedding_ready": len(queryEmbedding) > 0 && len(queryEmbedding) == rrs.vectorDimensions,
		"vector_ops_ready": rrs.vectorOperations != nil,
		"context_ready": ctx.Err() == nil,
		"service_ready": rrs.isInitialized,
		"limit_valid": limit > 0 && limit <= rrs.config.MaxResults,
		"step": "search_readiness_validation",
	}

	if !searchReadiness["embedding_ready"].(bool) {
		logrus.WithFields(logrus.Fields{
			"search_readiness": searchReadiness,
			"step": "search_readiness_failed",
		}).Error("❌ [PIPELINE] Pipeline not ready for vector search - embedding issues detected")
		return nil, fmt.Errorf("pipeline not ready for search: invalid embedding")
	}

	if !searchReadiness["vector_ops_ready"].(bool) {
		logrus.WithFields(logrus.Fields{
			"search_readiness": searchReadiness,
			"step": "search_readiness_failed",
		}).Error("❌ [PIPELINE] Pipeline not ready for vector search - vector operations unavailable")
		return nil, fmt.Errorf("pipeline not ready for search: vector operations unavailable")
	}

	logrus.WithFields(logrus.Fields{
		"search_readiness": searchReadiness,
		"step": "search_readiness_complete",
	}).Info("✅ [PIPELINE] Pipeline readiness validation complete - proceeding to vector search")

	// Debug: Check total documents in the system with detailed validation
	vectorOpsValidation := map[string]interface{}{
		"has_vector_operations": rrs.vectorOperations != nil,
		"vector_ops_type": fmt.Sprintf("%T", rrs.vectorOperations),
	}
	
	if hnswOps, ok := rrs.vectorOperations.(*HNSWVectorOperations); ok {
		docCount, docCountErr := hnswOps.GetDocumentCount(ctx)
		vectorOpsValidation["is_hnsw_ops"] = true
		vectorOpsValidation["doc_count"] = docCount
		vectorOpsValidation["doc_count_error"] = docCountErr != nil
		
		if docCountErr != nil {
			vectorOpsValidation["doc_count_error_msg"] = docCountErr.Error()
		}
		
		logrus.WithFields(logrus.Fields{
			"query": query,
			"total_documents_in_index": docCount,
			"step": "vector_operations_validation",
			"vector_ops_details": vectorOpsValidation,
		}).Info("🔍 [PIPELINE] Vector operations validation complete")
	} else if upstashOps, ok := rrs.vectorOperations.(*UpstashVectorOperations); ok {
		docCount, docCountErr := upstashOps.GetDocumentCount(ctx)
		vectorOpsValidation["is_upstash_ops"] = true
		vectorOpsValidation["doc_count"] = docCount
		vectorOpsValidation["doc_count_error"] = docCountErr != nil
		
		if docCountErr != nil {
			vectorOpsValidation["doc_count_error_msg"] = docCountErr.Error()
		}
		
		logrus.WithFields(logrus.Fields{
			"query": query,
			"total_documents_in_index": docCount,
			"step": "vector_operations_validation",
			"vector_ops_details": vectorOpsValidation,
		}).Info("🔍 [PIPELINE] Vector operations validation complete")
	} else {
		vectorOpsValidation["is_hnsw_ops"] = false
		vectorOpsValidation["is_upstash_ops"] = false
		vectorOpsValidation["unknown_type"] = true
		
		logrus.WithFields(logrus.Fields{
			"query": query,
			"step": "vector_operations_validation",
			"vector_ops_details": vectorOpsValidation,
		}).Warn("⚠️ [PIPELINE] Unknown vector operations type - potential pipeline issue")
	}

	// Perform vector search with comprehensive pipeline debugging
	searchStart := time.Now()
	searchParams := map[string]interface{}{
		"query_length": len(query),
		"limit": limit,
		"embedding_dim": len(queryEmbedding),
		"embedding_non_empty": len(queryEmbedding) > 0,
		"context_cancelled": ctx.Err() != nil,
	}
	
	logrus.WithFields(logrus.Fields{
		"query": query,
		"search_params": searchParams,
		"step": "vector_search_start",
	}).Info("🔍 [PIPELINE] Starting vector similarity search with detailed params...")

	// Pre-search validation
	if len(queryEmbedding) == 0 {
		logrus.WithFields(logrus.Fields{
			"query": query,
			"step": "vector_search_validation_failed",
			"error": "empty_embedding",
		}).Error("❌ [PIPELINE] Cannot perform search with empty embedding")
		return nil, fmt.Errorf("cannot search with empty embedding")
	}

	results, err := rrs.vectorOperations.SearchSimilar(ctx, queryEmbedding, limit)
	searchDuration := time.Since(searchStart)
	
	// Detailed search result analysis
	searchResultAnalysis := map[string]interface{}{
		"search_duration": searchDuration,
		"search_error": err != nil,
		"results_nil": results == nil,
	}
	
	if err != nil {
		searchResultAnalysis["error_message"] = err.Error()
		searchResultAnalysis["error_type"] = fmt.Sprintf("%T", err)
		
		rrs.performanceMonitor.RecordError("vector_search")
		logrus.WithError(err).WithFields(logrus.Fields{
			"query": query,
			"search_params": searchParams,
			"search_analysis": searchResultAnalysis,
			"step": "vector_search_failed",
		}).Error("❌ [PIPELINE] Vector search failed with detailed analysis")
		return nil, fmt.Errorf("vector search failed: %w", err)
	}
	
	if results != nil {
		searchResultAnalysis["documents_count"] = len(results.Documents)
		searchResultAnalysis["scores_count"] = len(results.Scores)
		searchResultAnalysis["query_time"] = results.QueryTime
		searchResultAnalysis["documents_nil"] = results.Documents == nil
		searchResultAnalysis["scores_nil"] = results.Scores == nil
		
		// Analyze individual results
		if len(results.Documents) > 0 {
			firstDoc := results.Documents[0]
			searchResultAnalysis["first_doc_id"] = firstDoc.ID
			searchResultAnalysis["first_doc_service_type"] = firstDoc.ServiceType
			searchResultAnalysis["first_doc_content_length"] = len(firstDoc.Content)
			searchResultAnalysis["first_doc_title"] = firstDoc.Title
		}
		
		if len(results.Scores) > 0 {
			searchResultAnalysis["first_score"] = results.Scores[0]
			
			// Calculate score statistics
			minScore, maxScore := results.Scores[0], results.Scores[0]
			for _, score := range results.Scores {
				if score < minScore {
					minScore = score
				}
				if score > maxScore {
					maxScore = score
				}
			}
			
			searchResultAnalysis["score_range"] = map[string]float64{
				"min": minScore,
				"max": maxScore,
			}
		}
	}

	logrus.WithFields(logrus.Fields{
		"query": query,
		"search_analysis": searchResultAnalysis,
		"step": "vector_search_complete",
	}).Info("🔍 [PIPELINE] Vector search completed with comprehensive analysis")

	// Enhanced document analysis with detailed pipeline debugging
	documentAnalysis := map[string]interface{}{
		"documents_found": len(results.Documents),
		"scores_available": len(results.Scores),
		"documents_not_nil": results.Documents != nil,
		"scores_not_nil": results.Scores != nil,
		"query_time": results.QueryTime,
	}

	if len(results.Documents) > 0 {
		logrus.WithFields(logrus.Fields{
			"query": query,
			"document_analysis": documentAnalysis,
			"step": "document_analysis_success",
		}).Info("📄 [PIPELINE] Documents found in search results - analyzing content")

		// Detailed analysis of each document
		for i, doc := range results.Documents {
			score := 0.0
			if i < len(results.Scores) {
				score = results.Scores[i]
			}
			
			docAnalysis := map[string]interface{}{
				"doc_index": i,
				"doc_id": doc.ID,
				"doc_title": doc.Title,
				"doc_service_type": doc.ServiceType,
				"similarity_score": score,
				"content_length": len(doc.Content),
				"keywords_count": len(doc.Keywords),
				"has_metadata": doc.Metadata != nil,
				"indexed_at": doc.IndexedAt,
				"content_preview": truncateString(doc.Content, 100),
			}
			
			if doc.Metadata != nil {
				docAnalysis["metadata_count"] = len(doc.Metadata)
				docAnalysis["metadata_keys"] = getMapKeys(doc.Metadata)
			}
			
			logLevel := "Debug"
			if i == 0 { // Log first document as Info for visibility
				logLevel = "Info"
			}
			
			logEntry := logrus.WithFields(logrus.Fields{
				"query": query,
				"document_details": docAnalysis,
				"step": "document_detail_analysis",
			})
			
			if logLevel == "Info" {
				logEntry.Info("📄 [PIPELINE] Top document details (most relevant)")
			} else {
				logEntry.Debug("📄 [PIPELINE] Document details in search results")
			}
		}
		
		// Summary statistics
		if len(results.Scores) > 0 {
			scoreStats := calculateScoreStatistics(results.Scores)
			logrus.WithFields(logrus.Fields{
				"query": query,
				"score_statistics": scoreStats,
				"step": "score_analysis",
			}).Info("📊 [PIPELINE] Search result score analysis")
		}
		
	} else {
		// Critical debugging for empty results
		emptyResultAnalysis := map[string]interface{}{
			"documents_nil": results.Documents == nil,
			"documents_empty": len(results.Documents) == 0,
			"scores_nil": results.Scores == nil,
			"scores_empty": len(results.Scores) == 0,
			"query_time": results.QueryTime,
			"vector_operations_type": fmt.Sprintf("%T", rrs.vectorOperations),
			"embedding_service_initialized": rrs.embeddingService != nil,
			"rag_service_initialized": rrs.isInitialized,
		}
		
		logrus.WithFields(logrus.Fields{
			"query": query,
			"empty_result_analysis": emptyResultAnalysis,
			"step": "empty_results_analysis",
		}).Warn("⚠️ [PIPELINE] No documents found in vector search - CORE ISSUE DETECTED!")
		
		// Additional diagnostics for empty results
		logrus.WithFields(logrus.Fields{
			"query": query,
			"embedding_validation": map[string]interface{}{
				"embedding_length": len(queryEmbedding),
				"embedding_non_zero": embeddingNonZero,
				"embedding_mean": embeddingMean,
			},
			"step": "empty_results_embedding_check",
		}).Warn("🔍 [PIPELINE] Embedding validation for empty results investigation")
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
		logrus.WithFields(logrus.Fields{
			"query": query,
			"results_cached": len(searchResult.Documents),
		}).Debug("💾 Search results cached")
	}

	rrs.performanceMonitor.RecordCacheMiss()

	// Log comprehensive performance metrics
	logrus.WithFields(logrus.Fields{
		"query":           query[:min(50, len(query))],
		"cache_hit":       false,
		"response_time":   time.Since(startTime),
		"search_time":     searchDuration,
		"results_count":   len(searchResult.Documents),
		"embedding_dim":   len(queryEmbedding),
		"total_results":   searchResult.TotalResults,
		"service_type": "general",
	}).Info("🔍 RAG search completed - comprehensive analysis")

	return searchResult, nil
}

// TestDirectVectorSearch bypasses the full pipeline and tests similarity search directly
func (rrs *RedisRAGService) TestDirectVectorSearch(ctx context.Context, query string, limit int) (*RAGSearchResult, error) {
	if !rrs.isInitialized {
		return nil, fmt.Errorf("RAG service not initialized")
	}

	logrus.WithFields(logrus.Fields{
		"query": query,
		"limit": limit,
	}).Info("🧪 Testing direct vector search bypass")

	// Generate query embedding
	queryEmbedding, err := rrs.embeddingService.GenerateEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"query": query,
		"embedding_dim": len(queryEmbedding),
	}).Debug("🔤 Query embedding generated for direct test")

	// Perform direct vector search
	results, err := rrs.vectorOperations.SearchSimilar(ctx, queryEmbedding, limit)
	if err != nil {
		return nil, fmt.Errorf("direct vector search failed: %w", err)
	}

	searchResult := &RAGSearchResult{
		Documents:    results.Documents,
		Scores:       results.Scores,
		QueryTime:    0, // Not measuring time for test
		TotalResults: len(results.Documents),
		CacheHit:     false,
	}

	logrus.WithFields(logrus.Fields{
		"query": query,
		"direct_results_count": len(searchResult.Documents),
		"limit": limit,
	}).Info("🧪 Direct vector search test completed")

	return searchResult, nil
}

// Helper functions for enhanced logging

// truncateString truncates a string to the specified length
func truncateString(s string, maxLength int) string {
	if len(s) <= maxLength {
		return s
	}
	return s[:maxLength] + "..."
}

// getMapKeys returns the keys of a string map
func getMapKeys(m map[string]string) []string {
	if m == nil {
		return nil
	}
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// calculateScoreStatistics calculates statistics for similarity scores
func calculateScoreStatistics(scores []float64) map[string]interface{} {
	if len(scores) == 0 {
		return map[string]interface{}{
			"count": 0,
			"min":   nil,
			"max":   nil,
			"mean":  nil,
		}
	}
	
	min, max := scores[0], scores[0]
	sum := 0.0
	
	for _, score := range scores {
		if score < min {
			min = score
		}
		if score > max {
			max = score
		}
		sum += score
	}
	
	mean := sum / float64(len(scores))
	
	return map[string]interface{}{
		"count": len(scores),
		"min":   min,
		"max":   max,
		"mean":  mean,
	}
}

// min helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// calculateEmbeddingQuality calculates a quality score for the embedding vector
func (rrs *RedisRAGService) calculateEmbeddingQuality(embedding []float64) float64 {
	if len(embedding) == 0 {
		return 0.0
	}

	var nonZeroCount int
	var sum float64
	var sumSquares float64
	minVal, maxVal := embedding[0], embedding[0]

	for _, val := range embedding {
		sum += val
		sumSquares += val * val

		if val != 0.0 {
			nonZeroCount++
		}

		if val < minVal {
			minVal = val
		}
		if val > maxVal {
			maxVal = val
		}
	}

	mean := sum / float64(len(embedding))
	variance := (sumSquares / float64(len(embedding))) - (mean * mean)
	stdDev := math.Sqrt(math.Max(0, variance))

	// Quality score based on multiple factors
	nonZeroRatio := float64(nonZeroCount) / float64(len(embedding))
	distributionScore := 1.0 / (1.0 + stdDev) // Lower std dev is better
	rangeScore := 1.0 / (1.0 + math.Abs(maxVal-minVal)) // Reasonable range is better

	qualityScore := (nonZeroRatio * 0.4) + (distributionScore * 0.4) + (rangeScore * 0.2)
	return math.Max(0.0, math.Min(1.0, qualityScore))
}

// analyzeEmbeddingStatistics provides detailed statistical analysis of embedding
func (rrs *RedisRAGService) analyzeEmbeddingStatistics(embedding []float64) map[string]interface{} {
	if len(embedding) == 0 {
		return map[string]interface{}{
			"length": 0,
			"error": "empty embedding",
		}
	}

	stats := map[string]interface{}{
		"length": len(embedding),
		"expected_length": rrs.vectorDimensions,
		"length_match": len(embedding) == rrs.vectorDimensions,
	}

	var sum, sumSquares float64
	minVal, maxVal := embedding[0], embedding[0]
	nonZeroCount := 0
	zeroCount := 0

	for _, val := range embedding {
		sum += val
		sumSquares += val * val

		if val < minVal {
			minVal = val
		}
		if val > maxVal {
			maxVal = val
		}

		if val == 0.0 {
			zeroCount++
		} else {
			nonZeroCount++
		}
	}

	mean := sum / float64(len(embedding))
	variance := (sumSquares / float64(len(embedding))) - (mean * mean)
	stdDev := math.Sqrt(math.Max(0, variance))

	stats["mean"] = mean
	stats["std_dev"] = stdDev
	stats["variance"] = variance
	stats["min"] = minVal
	stats["max"] = maxVal
	stats["range"] = maxVal - minVal
	stats["non_zero_count"] = nonZeroCount
	stats["zero_count"] = zeroCount
	stats["non_zero_ratio"] = float64(nonZeroCount) / float64(len(embedding))
	stats["sparsity"] = float64(zeroCount) / float64(len(embedding))

	// Distribution analysis
	stats["is_normal_distribution"] = stdDev > 0.1 && stdDev < 1.0
	stats["has_outliers"] = math.Abs(maxVal-mean) > 3*stdDev || math.Abs(minVal-mean) > 3*stdDev

	// Quality indicators
	stats["quality_indicators"] = map[string]bool{
		"reasonable_range": minVal >= -10.0 && maxVal <= 10.0,
		"good_sparsity": stats["sparsity"].(float64) < 0.9, // Less than 90% zeros
		"normal_distribution": stats["is_normal_distribution"].(bool),
		"no_extreme_outliers": !stats["has_outliers"].(bool),
	}

	return stats
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
func (rrs *RedisRAGService) GetVectorOperations() VectorOperationsInterface {
	return rrs.vectorOperations
}

// GetRedisClient returns the Redis client
func (rrs *RedisRAGService) GetRedisClient() *redis.Client {
	return rrs.redis
}

// GetHNSWVectorOperations returns the HNSW vector operations if available
func (rrs *RedisRAGService) GetHNSWVectorOperations() *HNSWVectorOperations {
	if hvo, ok := rrs.vectorOperations.(*HNSWVectorOperations); ok {
		return hvo
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

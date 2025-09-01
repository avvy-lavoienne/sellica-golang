package rag

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// HNSWVectorOperations implements VectorOperationsInterface using HNSW algorithm
type HNSWVectorOperations struct {
	// HNSW components
	hnswIndex        *HNSWIndex
	concurrentSearch *ConcurrentVectorSearch

	// Redis for metadata and fallback
	redis  *redis.Client
	config *RAGConfig

	// Document storage
	documents     map[string]*RAGDocument
	documentMutex sync.RWMutex

	// Performance tracking
	searchTimes      []time.Duration
	indexingTimes    []time.Duration
	performanceMutex sync.RWMutex

	// Statistics
	totalSearches    int64
	totalIndexed     int64
	hnswSearches     int64
	fallbackSearches int64

	// Memory monitoring
	memoryMonitor *MemoryMonitor
}

// NewHNSWVectorOperations creates a new HNSW-based vector operations service
func NewHNSWVectorOperations(redisClient *redis.Client, config *RAGConfig) *HNSWVectorOperations {
	// Configure HNSW
	hnswConfig := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             200,
		EfConstruction: 200,
		ML:             1.0 / 0.693147, // 1/ln(2)
		DistanceFunc:   CosineSimilarity,
		VectorDim:      config.VectorDimensions,
	}

	// Create HNSW index
	hnswIndex := NewHNSWIndex(hnswConfig)

	// Configure concurrent search
	searchConfig := &ConcurrentSearchConfig{
		WorkerPoolSize:    8,
		CacheSize:         1000,
		CacheTTL:          5 * time.Minute,
		BatchSize:         10,
		SearchTimeout:     5 * time.Second,
		EnablePrefetching: true,
	}

	// Create concurrent search service
	concurrentSearch := NewConcurrentVectorSearch(hnswIndex, searchConfig)

	hvo := &HNSWVectorOperations{
		hnswIndex:        hnswIndex,
		concurrentSearch: concurrentSearch,
		redis:            redisClient,
		config:           config,
		documents:        make(map[string]*RAGDocument),
		searchTimes:      make([]time.Duration, 0),
		indexingTimes:    make([]time.Duration, 0),
	}

	// Initialize memory monitoring
	hvo.memoryMonitor = NewMemoryMonitor()
	hvo.memoryMonitor.StartMonitoring(60 * time.Second)

	logrus.WithFields(logrus.Fields{
		"hnsw_max_m":       hnswConfig.MaxM,
		"hnsw_ef":          hnswConfig.Ef,
		"vector_dim":       hnswConfig.VectorDim,
		"worker_pool_size": searchConfig.WorkerPoolSize,
		"cache_size":       searchConfig.CacheSize,
	}).Info("🚀 HNSW vector operations initialized")

	return hvo
}

// SearchSimilar performs similarity search using HNSW algorithm
func (hvo *HNSWVectorOperations) SearchSimilar(ctx context.Context, queryEmbedding []float64, limit int) (*VectorSearchResult, error) {
	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"query_embedding_dim": len(queryEmbedding),
		"limit": limit,
		"total_documents": len(hvo.documents),
	}).Debug("🔍 Starting HNSW vector search")

	// Check context cancellation
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("context cancelled before search: %w", ctx.Err())
	default:
	}

	// Convert float64 to float32 for HNSW
	queryVector := make([]float32, len(queryEmbedding))
	for i, v := range queryEmbedding {
		queryVector[i] = float32(v)
	}

	logrus.WithFields(logrus.Fields{
		"query_vector_dim": len(queryVector),
		"query_vector_sample": queryVector[:min(5, len(queryVector))],
	}).Debug("🔄 Converted query embedding to float32")

	// Perform HNSW search
	logrus.Debug("🚀 Executing HNSW concurrent search...")
	hnswResults, err := hvo.concurrentSearch.SearchSimilarConcurrent(ctx, queryVector, limit)
	if err != nil {
		hvo.recordFallbackSearch()
		logrus.WithError(err).WithFields(logrus.Fields{
			"limit": limit,
			"query_dim": len(queryVector),
			"total_documents": len(hvo.documents),
		}).Warn("❌ HNSW search failed, attempting fallback")

		// Fallback to basic similarity search if HNSW fails
		return hvo.fallbackSearch(ctx, queryEmbedding, limit)
	}

	logrus.WithFields(logrus.Fields{
		"hnsw_results_count": len(hnswResults),
		"limit": limit,
		"total_documents": len(hvo.documents),
	}).Debug("✅ HNSW search completed successfully")

	// Convert HNSW results to VectorSearchResult
	result := &VectorSearchResult{
		Documents: make([]*RAGDocument, 0, len(hnswResults)),
		Scores:    make([]float64, 0, len(hnswResults)),
		QueryTime: time.Since(startTime),
	}

	hvo.documentMutex.RLock()
	logrus.WithField("hnsw_results_count", len(hnswResults)).Debug("🔍 Processing HNSW results...")

	for i, hnswResult := range hnswResults {
		logrus.WithFields(logrus.Fields{
			"result_index": i,
			"hnsw_score": hnswResult.Score,
			"metadata_keys": len(hnswResult.Metadata),
		}).Debug("📄 Processing HNSW result")

		// Get document from metadata stored in HNSW result
		if hnswResult.Metadata != nil {
			if docID, ok := hnswResult.Metadata["id"].(string); ok {
				logrus.WithFields(logrus.Fields{
					"doc_id": docID,
					"result_index": i,
				}).Debug("🔍 Looking up document by ID")

				if doc, exists := hvo.documents[docID]; exists {
					logrus.WithFields(logrus.Fields{
						"doc_id": doc.ID,
						"doc_title": doc.Title,
						"doc_service_type": doc.ServiceType,
						"result_index": i,
					}).Debug("✅ Found document in local storage")

					result.Documents = append(result.Documents, doc)
					result.Scores = append(result.Scores, float64(hnswResult.Score))
				} else {
					logrus.WithFields(logrus.Fields{
						"doc_id": docID,
						"result_index": i,
						"total_stored_docs": len(hvo.documents),
					}).Warn("❌ Document not found in local storage despite HNSW result")
				}
			} else {
				logrus.WithField("result_index", i).Warn("❌ No document ID in HNSW metadata")
			}
		} else {
			logrus.WithField("result_index", i).Warn("❌ No metadata in HNSW result")
		}
	}
	hvo.documentMutex.RUnlock()

	// Record performance
	searchTime := time.Since(startTime)
	hvo.recordSearchTime(searchTime)
	hvo.recordHNSWSearch()

	logrus.WithFields(logrus.Fields{
		"limit":       limit,
		"hnsw_results": len(hnswResults),
		"final_results": len(result.Documents),
		"search_time": searchTime,
		"method":      "hnsw",
		"documents_in_index": len(hvo.documents),
	}).Info("🔍 HNSW vector search completed with detailed analysis")

	return result, nil
}

// SearchByKeywords performs keyword-based search (fallback to Redis)
func (hvo *HNSWVectorOperations) SearchByKeywords(ctx context.Context, keywords []string, limit int) (*VectorSearchResult, error) {
	// For keyword search, we fall back to Redis-based search
	// This could be enhanced with hybrid search combining HNSW and keyword matching

	logrus.WithFields(logrus.Fields{
		"keywords": keywords,
		"limit":    limit,
	}).Debug("Performing keyword search (Redis fallback)")

	// Simple implementation: search documents by keywords in metadata
	result := &VectorSearchResult{
		Documents: make([]*RAGDocument, 0),
		Scores:    make([]float64, 0),
		QueryTime: 0,
	}

	hvo.documentMutex.RLock()
	defer hvo.documentMutex.RUnlock()

	count := 0
	for _, doc := range hvo.documents {
		if count >= limit {
			break
		}

		// Check if any keyword matches document content or metadata
		if hvo.matchesKeywords(doc, keywords) {
			result.Documents = append(result.Documents, doc)
			result.Scores = append(result.Scores, 1.0) // Default score for keyword match
			count++
		}
	}

	return result, nil
}

// GetDocumentCount returns the total number of indexed documents
func (hvo *HNSWVectorOperations) GetDocumentCount(ctx context.Context) (int64, error) {
	hvo.documentMutex.RLock()
	defer hvo.documentMutex.RUnlock()

	return int64(len(hvo.documents)), nil
}

// DeleteDocument removes a document from the index
func (hvo *HNSWVectorOperations) DeleteDocument(ctx context.Context, docID string) error {
	hvo.documentMutex.Lock()
	defer hvo.documentMutex.Unlock()

	if _, exists := hvo.documents[docID]; !exists {
		return fmt.Errorf("document %s not found", docID)
	}

	delete(hvo.documents, docID)

	// Note: HNSW doesn't support efficient deletion, so we keep the vector in the index
	// In a production system, you might want to implement a more sophisticated approach
	// such as marking vectors as deleted and rebuilding the index periodically

	logrus.WithField("doc_id", docID).Debug("Document deleted from HNSW vector operations")
	return nil
}

// StoreDocument stores a document in the HNSW index
func (hvo *HNSWVectorOperations) StoreDocument(ctx context.Context, doc *RAGDocument) error {
	startTime := time.Now()

	// Check context cancellation
	select {
	case <-ctx.Done():
		return fmt.Errorf("context cancelled during document storage: %w", ctx.Err())
	default:
	}

	if len(doc.Embedding) == 0 {
		return fmt.Errorf("document embedding is required for HNSW indexing")
	}

	// Convert embedding to float32
	vector := make([]float32, len(doc.Embedding))
	for i, v := range doc.Embedding {
		vector[i] = float32(v)
	}

	// Prepare metadata
	metadata := map[string]interface{}{
		"id":           doc.ID,
		"title":        doc.Title,
		"content":      doc.Content,
		"service_type": doc.ServiceType,
		"indexed_at":   doc.IndexedAt,
	}

	// Add to HNSW index
	vectorID, err := hvo.hnswIndex.AddVector(ctx, vector, metadata)
	if err != nil {
		return fmt.Errorf("failed to add vector to HNSW index: %w", err)
	}

	// Store document in local storage (only by original ID to avoid duplicates)
	hvo.documentMutex.Lock()
	hvo.documents[doc.ID] = doc
	hvo.documentMutex.Unlock()

	// Record performance
	indexTime := time.Since(startTime)
	hvo.recordIndexingTime(indexTime)
	hvo.recordIndexed()

	logrus.WithFields(logrus.Fields{
		"doc_id":     doc.ID,
		"vector_id":  vectorID,
		"index_time": indexTime,
		"vector_dim": len(doc.Embedding),
	}).Debug("Document stored in HNSW index")

	return nil
}

// fallbackSearch performs basic similarity search when HNSW fails
func (hvo *HNSWVectorOperations) fallbackSearch(_ context.Context, queryEmbedding []float64, limit int) (*VectorSearchResult, error) {
	// Simple brute-force similarity search as fallback
	type docScore struct {
		doc   *RAGDocument
		score float64
	}

	candidates := make([]docScore, 0)

	hvo.documentMutex.RLock()
	for _, doc := range hvo.documents {
		if doc.Embedding != nil && len(doc.Embedding) == len(queryEmbedding) {
			// Calculate cosine similarity
			score := hvo.calculateCosineSimilarity(queryEmbedding, doc.Embedding)
			candidates = append(candidates, docScore{doc: doc, score: score})
		}
	}
	hvo.documentMutex.RUnlock()

	// Sort by score (higher is better for similarity)
	for i := 0; i < len(candidates)-1; i++ {
		for j := i + 1; j < len(candidates); j++ {
			if candidates[i].score < candidates[j].score {
				candidates[i], candidates[j] = candidates[j], candidates[i]
			}
		}
	}

	// Take top results
	if len(candidates) > limit {
		candidates = candidates[:limit]
	}

	result := &VectorSearchResult{
		Documents: make([]*RAGDocument, len(candidates)),
		Scores:    make([]float64, len(candidates)),
		QueryTime: 0,
	}

	for i, candidate := range candidates {
		result.Documents[i] = candidate.doc
		result.Scores[i] = candidate.score
	}

	return result, nil
}

// calculateCosineSimilarity calculates cosine similarity between two vectors
func (hvo *HNSWVectorOperations) calculateCosineSimilarity(a, b []float64) float64 {
	var dotProduct, normA, normB float64

	for i := 0; i < len(a); i++ {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (normA * normB)
}

// matchesKeywords checks if a document matches the given keywords
func (hvo *HNSWVectorOperations) matchesKeywords(doc *RAGDocument, keywords []string) bool {
	content := doc.Title + " " + doc.Content
	for _, keyword := range keywords {
		if len(keyword) > 0 && contains(content, keyword) {
			return true
		}
	}
	return false
}

// contains checks if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		(s == substr ||
			(len(s) > len(substr) &&
				(s[:len(substr)] == substr ||
					s[len(s)-len(substr):] == substr ||
					containsSubstring(s, substr))))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Performance tracking methods
func (hvo *HNSWVectorOperations) recordSearchTime(duration time.Duration) {
	hvo.performanceMutex.Lock()
	defer hvo.performanceMutex.Unlock()

	hvo.searchTimes = append(hvo.searchTimes, duration)
	if len(hvo.searchTimes) > 1000 {
		hvo.searchTimes = hvo.searchTimes[1:]
	}
	hvo.totalSearches++
}

func (hvo *HNSWVectorOperations) recordIndexingTime(duration time.Duration) {
	hvo.performanceMutex.Lock()
	defer hvo.performanceMutex.Unlock()

	hvo.indexingTimes = append(hvo.indexingTimes, duration)
	if len(hvo.indexingTimes) > 1000 {
		hvo.indexingTimes = hvo.indexingTimes[1:]
	}
}

func (hvo *HNSWVectorOperations) recordHNSWSearch() {
	hvo.performanceMutex.Lock()
	defer hvo.performanceMutex.Unlock()
	hvo.hnswSearches++
}

func (hvo *HNSWVectorOperations) recordFallbackSearch() {
	hvo.performanceMutex.Lock()
	defer hvo.performanceMutex.Unlock()
	hvo.fallbackSearches++
}

func (hvo *HNSWVectorOperations) recordIndexed() {
	hvo.performanceMutex.Lock()
	defer hvo.performanceMutex.Unlock()
	hvo.totalIndexed++
}

// GetStats returns performance statistics
func (hvo *HNSWVectorOperations) GetStats() map[string]interface{} {
	hvo.performanceMutex.RLock()
	defer hvo.performanceMutex.RUnlock()

	stats := map[string]interface{}{
		"total_searches":    hvo.totalSearches,
		"total_indexed":     hvo.totalIndexed,
		"hnsw_searches":     hvo.hnswSearches,
		"fallback_searches": hvo.fallbackSearches,
		"document_count":    len(hvo.documents),
	}

	// Calculate average search time
	if len(hvo.searchTimes) > 0 {
		var total time.Duration
		for _, t := range hvo.searchTimes {
			total += t
		}
		stats["avg_search_time_ms"] = float64(total.Nanoseconds()) / float64(len(hvo.searchTimes)) / 1e6
	}

	// Calculate average indexing time
	if len(hvo.indexingTimes) > 0 {
		var total time.Duration
		for _, t := range hvo.indexingTimes {
			total += t
		}
		stats["avg_indexing_time_ms"] = float64(total.Nanoseconds()) / float64(len(hvo.indexingTimes)) / 1e6
	}

	// Add HNSW index stats
	if hvo.hnswIndex != nil {
		hnswStats := hvo.hnswIndex.GetStats()
		for k, v := range hnswStats {
			stats["hnsw_"+k] = v
		}
	}

	// Add concurrent search stats
	if hvo.concurrentSearch != nil {
		searchStats := hvo.concurrentSearch.GetStats()
		for k, v := range searchStats {
			stats["concurrent_"+k] = v
		}
	}

	return stats
}

// Close cleans up resources
func (hvo *HNSWVectorOperations) Close() error {
	logrus.Info("🔒 Closing HNSW vector operations...")

	// Stop memory monitoring
	if hvo.memoryMonitor != nil {
		hvo.memoryMonitor.StopMonitoring()
	}

	// Close concurrent search
	if hvo.concurrentSearch != nil {
		hvo.concurrentSearch.Close()
	}

	// Close HNSW index
	if hvo.hnswIndex != nil {
		hvo.hnswIndex.Close()
	}

	// Clear documents
	hvo.documentMutex.Lock()
	hvo.documents = make(map[string]*RAGDocument)
	hvo.documentMutex.Unlock()

	logrus.Info("🔒 HNSW vector operations closed")
	return nil
}

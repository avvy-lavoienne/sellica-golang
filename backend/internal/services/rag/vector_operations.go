package rag

import (
	"context"
	"encoding/binary"
	"fmt"
	"math"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// VectorOperations provides optimized Redis vector search operations with concurrent processing
type VectorOperations struct {
	redis     *redis.Client
	config    *RAGConfig
	indexName string

	// Concurrent processing optimization
	maxConcurrency int
	workerPool     chan struct{}

	// Batch processing optimization
	batchProcessor *VectorBatchProcessor

	// Performance tracking
	searchTimes   []time.Duration
	indexingTimes []time.Duration
	mu            sync.RWMutex
}

// VectorBatchProcessor handles batch processing of vector operations
type VectorBatchProcessor struct {
	pendingBatch    []*VectorOperation
	resultChannels  map[string]chan *VectorOperationResult
}

// VectorOperation represents a vector operation request
type VectorOperation struct {
	ID         string
	Type       string // "search", "index", "delete"
	Embedding  []float64
	Document   *RAGDocument
	Limit      int
	ResultChan chan *VectorOperationResult
}

// VectorOperationResult represents the result of a vector operation
type VectorOperationResult struct {
	ID       string
	Results  *VectorSearchResult
	Error    error
	Duration time.Duration
}

// VectorSearchResult represents vector search results
type VectorSearchResult struct {
	Documents []*RAGDocument `json:"documents"`
	Scores    []float64      `json:"scores"`
	QueryTime time.Duration  `json:"query_time"`
}

// NewVectorOperations creates a new optimized vector operations service
func NewVectorOperations(redisClient *redis.Client, config *RAGConfig) *VectorOperations {
	maxConcurrency := 8 // Optimal for most Redis setups

	return &VectorOperations{
		redis:          redisClient,
		config:         config,
		indexName:      config.IndexName,
		maxConcurrency: maxConcurrency,
		workerPool:     make(chan struct{}, maxConcurrency),
		batchProcessor: &VectorBatchProcessor{
			pendingBatch:   make([]*VectorOperation, 0),
			resultChannels: make(map[string]chan *VectorOperationResult),
		},
		searchTimes:   make([]time.Duration, 0),
		indexingTimes: make([]time.Duration, 0),
	}
}

// SearchSimilar performs optimized vector similarity search with concurrent processing
func (vo *VectorOperations) SearchSimilar(ctx context.Context, queryEmbedding []float64, limit int) (*VectorSearchResult, error) {
	startTime := time.Now()
	defer func() {
		vo.recordSearchTime(time.Since(startTime))
	}()

	// Enhanced logging for vector search pipeline debugging
	logrus.WithFields(logrus.Fields{
		"embedding_dim": len(queryEmbedding),
		"limit": limit,
		"index_name": vo.indexName,
		"max_concurrency": vo.maxConcurrency,
		"step": "vector_search_entry",
	}).Info("🔍 [VECTOR_OPS] Starting vector similarity search with enhanced debugging")

	// Use worker pool for concurrency control
	select {
	case vo.workerPool <- struct{}{}:
		defer func() { <-vo.workerPool }()
		logrus.Debug("🏗️ [VECTOR_OPS] Acquired worker from pool")
	case <-ctx.Done():
		logrus.WithError(ctx.Err()).Warn("❌ [VECTOR_OPS] Context cancelled before acquiring worker")
		return nil, ctx.Err()
	}

	// Enhanced embedding validation and marshaling
	if len(queryEmbedding) == 0 {
		logrus.Error("❌ [VECTOR_OPS] Cannot perform search with empty embedding")
		return nil, fmt.Errorf("query embedding is empty")
	}
	
	// Validate embedding content
	embeddingStats := map[string]interface{}{
		"length": len(queryEmbedding),
		"non_zero_count": 0,
		"sum": 0.0,
	}
	
	for _, val := range queryEmbedding {
		embeddingStats["sum"] = embeddingStats["sum"].(float64) + val
		if val != 0.0 {
			embeddingStats["non_zero_count"] = embeddingStats["non_zero_count"].(int) + 1
		}
	}
	
	embeddingStats["mean"] = embeddingStats["sum"].(float64) / float64(len(queryEmbedding))
	embeddingStats["non_zero_ratio"] = float64(embeddingStats["non_zero_count"].(int)) / float64(len(queryEmbedding))
	
	logrus.WithFields(logrus.Fields{
		"embedding_stats": embeddingStats,
		"step": "embedding_validation",
	}).Debug("📊 [VECTOR_OPS] Embedding validation complete")

	// Convert embedding to bytes for Redis with optimization
	embeddingMarshalStart := time.Now()
	embeddingBytes, err := vo.optimizedEmbeddingMarshal(queryEmbedding)
	embeddingMarshalDuration := time.Since(embeddingMarshalStart)
	
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"embedding_length": len(queryEmbedding),
			"marshal_duration": embeddingMarshalDuration,
			"step": "embedding_marshal_failed",
		}).Error("❌ [VECTOR_OPS] Failed to marshal query embedding")
		return nil, fmt.Errorf("failed to marshal query embedding: %w", err)
	}
	
	logrus.WithFields(logrus.Fields{
		"embedding_bytes_length": len(embeddingBytes),
		"marshal_duration": embeddingMarshalDuration,
		"step": "embedding_marshal_success",
	}).Debug("📦 [VECTOR_OPS] Embedding marshaled successfully")

	// Build and log Redis search command
	searchQuery := fmt.Sprintf("*=>[KNN %d @embedding $query_vector AS score]", limit)
	searchCmd := []interface{}{
		"FT.SEARCH", vo.indexName,
		searchQuery,
		"PARAMS", "2", "query_vector", string(embeddingBytes),
		"SORTBY", "score",
		"LIMIT", "0", strconv.Itoa(limit),
		"RETURN", "10",
		"content", "title", "service_type", "keywords", "indexed_at", "score",
	}
	
	redisCommandInfo := map[string]interface{}{
		"command": "FT.SEARCH",
		"index_name": vo.indexName,
		"search_query": searchQuery,
		"limit": limit,
		"params_count": 2,
		"return_fields": []string{"content", "title", "service_type", "keywords", "indexed_at", "score"},
	}
	
	logrus.WithFields(logrus.Fields{
		"redis_command_info": redisCommandInfo,
		"step": "redis_command_build",
	}).Info("🔧 [VECTOR_OPS] Redis search command built")

	// Perform optimized vector search using FT.SEARCH with KNN
	redisSearchStart := time.Now()
	result, err := vo.redis.Do(ctx, searchCmd...).Result()
	redisSearchDuration := time.Since(redisSearchStart)
	
	redisSearchResults := map[string]interface{}{
		"search_duration": redisSearchDuration,
		"error": err != nil,
		"result_nil": result == nil,
	}
	
	if err != nil {
		redisSearchResults["error_message"] = err.Error()
		redisSearchResults["error_type"] = fmt.Sprintf("%T", err)
		
		logrus.WithError(err).WithFields(logrus.Fields{
			"redis_search_results": redisSearchResults,
			"redis_command_info": redisCommandInfo,
			"step": "redis_search_failed",
		}).Error("❌ [VECTOR_OPS] Redis vector search failed")
		return nil, fmt.Errorf("vector search failed: %w", err)
	}
	
	// Analyze Redis result structure
	if result != nil {
		redisSearchResults["result_type"] = fmt.Sprintf("%T", result)
		if resultSlice, ok := result.([]interface{}); ok {
			redisSearchResults["result_slice_length"] = len(resultSlice)
			if len(resultSlice) > 0 {
				redisSearchResults["first_element_type"] = fmt.Sprintf("%T", resultSlice[0])
				if totalResults, ok := resultSlice[0].(int64); ok {
					redisSearchResults["total_results"] = totalResults
				}
			}
		}
	}
	
	logrus.WithFields(logrus.Fields{
		"redis_search_results": redisSearchResults,
		"step": "redis_search_success",
	}).Info("✅ [VECTOR_OPS] Redis search completed successfully")

	// Parse search results with detailed logging
	parseStart := time.Now()
	documents, scores, err := vo.parseSearchResults(result)
	parseDuration := time.Since(parseStart)
	
	parseResults := map[string]interface{}{
		"parse_duration": parseDuration,
		"parse_error": err != nil,
		"documents_count": len(documents),
		"scores_count": len(scores),
		"documents_nil": documents == nil,
		"scores_nil": scores == nil,
	}
	
	if err != nil {
		parseResults["error_message"] = err.Error()
		
		logrus.WithError(err).WithFields(logrus.Fields{
			"parse_results": parseResults,
			"step": "result_parsing_failed",
		}).Error("❌ [VECTOR_OPS] Failed to parse search results")
		return nil, fmt.Errorf("failed to parse search results: %w", err)
	}
	
	// Detailed analysis of parsed results
	if len(documents) > 0 {
		firstDoc := documents[0]
		parseResults["first_doc_id"] = firstDoc.ID
		parseResults["first_doc_service_type"] = firstDoc.ServiceType
		parseResults["first_doc_content_length"] = len(firstDoc.Content)
		parseResults["first_doc_title"] = firstDoc.Title
	}
	
	if len(scores) > 0 {
		parseResults["first_score"] = scores[0]
		parseResults["scores_min"] = findMinFloat64(scores)
		parseResults["scores_max"] = findMaxFloat64(scores)
	}

	queryTime := time.Since(startTime)
	
	// Final comprehensive logging
	finalResults := map[string]interface{}{
		"total_query_time": queryTime,
		"redis_search_time": redisSearchDuration,
		"parse_time": parseDuration,
		"embedding_marshal_time": embeddingMarshalDuration,
		"results_count": len(documents),
		"scores_count": len(scores),
		"limit_requested": limit,
		"success": true,
	}

	logrus.WithFields(logrus.Fields{
		"final_results": finalResults,
		"parse_results": parseResults,
		"step": "vector_search_complete",
	}).Info("🎯 [VECTOR_OPS] Vector search pipeline completed successfully")

	return &VectorSearchResult{
		Documents: documents,
		Scores:    scores,
		QueryTime: queryTime,
	}, nil
}

// Helper functions for vector operations logging
func findMinFloat64(slice []float64) float64 {
	if len(slice) == 0 {
		return 0
	}
	min := slice[0]
	for _, v := range slice[1:] {
		if v < min {
			min = v
		}
	}
	return min
}

func findMaxFloat64(slice []float64) float64 {
	if len(slice) == 0 {
		return 0
	}
	max := slice[0]
	for _, v := range slice[1:] {
		if v > max {
			max = v
		}
	}
	return max
}

// parseSearchResults parses Redis search results
func (vo *VectorOperations) parseSearchResults(result interface{}) ([]*RAGDocument, []float64, error) {
	// Redis FT.SEARCH returns: [total_results, doc1_key, doc1_fields, doc2_key, doc2_fields, ...]
	resultSlice, ok := result.([]interface{})
	if !ok || len(resultSlice) < 1 {
		return nil, nil, fmt.Errorf("invalid search result format")
	}

	// First element is total results count
	totalResults, ok := resultSlice[0].(int64)
	if !ok {
		return nil, nil, fmt.Errorf("invalid total results format")
	}

	if totalResults == 0 {
		return []*RAGDocument{}, []float64{}, nil
	}

	var documents []*RAGDocument
	var scores []float64

	// Parse document results (skip first element which is total count)
	for i := 1; i < len(resultSlice); i += 2 {
		if i+1 >= len(resultSlice) {
			break
		}

		// Document key
		docKey, ok := resultSlice[i].(string)
		if !ok {
			continue
		}

		// Document fields
		fieldsInterface, ok := resultSlice[i+1].([]interface{})
		if !ok {
			continue
		}

		// Parse document fields
		doc, score, err := vo.parseDocumentFields(docKey, fieldsInterface)
		if err != nil {
			logrus.WithError(err).Warn("Failed to parse document fields")
			continue
		}

		documents = append(documents, doc)
		scores = append(scores, score)
	}

	return documents, scores, nil
}

// IndexDocumentsBatch performs optimized batch document indexing
func (vo *VectorOperations) IndexDocumentsBatch(ctx context.Context, documents []*RAGDocument) error {
	if len(documents) == 0 {
		return nil
	}

	startTime := time.Now()
	defer func() {
		vo.recordIndexingTime(time.Since(startTime))
		logrus.WithFields(logrus.Fields{
			"batch_size":      len(documents),
			"processing_time": time.Since(startTime),
		}).Info("📦 Batch document indexing completed")
	}()

	// Process documents in parallel batches for better performance
	var wg sync.WaitGroup
	var mu sync.Mutex
	var errors []error

	batchSize := vo.maxConcurrency
	for i := 0; i < len(documents); i += batchSize {
		end := i + batchSize
		if end > len(documents) {
			end = len(documents)
		}

		wg.Add(1)
		go func(start, end int) {
			defer wg.Done()

			for j := start; j < end; j++ {
				doc := documents[j]
				if err := vo.indexSingleDocument(ctx, doc); err != nil {
					mu.Lock()
					errors = append(errors, fmt.Errorf("failed to index document %s: %w", doc.ID, err))
					mu.Unlock()
					logrus.WithError(err).WithField("document_id", doc.ID).Warn("Failed to index document in batch")
				}
			}
		}(i, end)
	}

	wg.Wait()

	if len(errors) > 0 {
		return fmt.Errorf("batch indexing completed with %d errors: %v", len(errors), errors[0])
	}

	return nil
}

// indexSingleDocument indexes a single document (internal method)
func (vo *VectorOperations) indexSingleDocument(ctx context.Context, doc *RAGDocument) error {
	// Use worker pool for concurrency control
	select {
	case vo.workerPool <- struct{}{}:
		defer func() { <-vo.workerPool }()
	case <-ctx.Done():
		return ctx.Err()
	}

	// Create document key
	docKey := fmt.Sprintf("doc:%s", doc.ID)

	// Prepare document fields for Redis
	fields := map[string]interface{}{
		"content":      doc.Content,
		"title":        doc.Title,
		"service_type": doc.ServiceType,
		"keywords":     strings.Join(doc.Keywords, ","),
		"indexed_at":   doc.IndexedAt.Format(time.RFC3339),
	}

	// Add embedding if available
	if len(doc.Embedding) > 0 {
		embeddingBytes, err := vo.optimizedEmbeddingMarshal(doc.Embedding)
		if err != nil {
			return fmt.Errorf("failed to marshal embedding: %w", err)
		}
		fields["embedding"] = string(embeddingBytes)
	}

	// Store document in Redis with optimized pipeline
	pipe := vo.redis.Pipeline()
	for field, value := range fields {
		pipe.HSet(ctx, docKey, field, value)
	}

	_, err := pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to store document: %w", err)
	}

	return nil
}

// GetPerformanceStats returns performance statistics for vector operations
func (vo *VectorOperations) GetPerformanceStats() *VectorPerformanceStats {
	vo.mu.RLock()
	defer vo.mu.RUnlock()

	var avgSearchTime, avgIndexingTime time.Duration

	if len(vo.searchTimes) > 0 {
		var total time.Duration
		for _, t := range vo.searchTimes {
			total += t
		}
		avgSearchTime = total / time.Duration(len(vo.searchTimes))
	}

	if len(vo.indexingTimes) > 0 {
		var total time.Duration
		for _, t := range vo.indexingTimes {
			total += t
		}
		avgIndexingTime = total / time.Duration(len(vo.indexingTimes))
	}

	return &VectorPerformanceStats{
		AvgSearchTime:   avgSearchTime,
		AvgIndexingTime: avgIndexingTime,
		TotalSearches:   int64(len(vo.searchTimes)),
		TotalIndexings:  int64(len(vo.indexingTimes)),
		MaxConcurrency:  vo.maxConcurrency,
	}
}

// VectorPerformanceStats represents performance statistics for vector operations
type VectorPerformanceStats struct {
	AvgSearchTime   time.Duration `json:"avg_search_time"`
	AvgIndexingTime time.Duration `json:"avg_indexing_time"`
	TotalSearches   int64         `json:"total_searches"`
	TotalIndexings  int64         `json:"total_indexings"`
	MaxConcurrency  int           `json:"max_concurrency"`
}

// Performance tracking and optimization methods

// recordSearchTime records search operation time
func (vo *VectorOperations) recordSearchTime(duration time.Duration) {
	vo.mu.Lock()
	defer vo.mu.Unlock()

	vo.searchTimes = append(vo.searchTimes, duration)

	// Keep only recent 1000 measurements
	if len(vo.searchTimes) > 1000 {
		vo.searchTimes = vo.searchTimes[len(vo.searchTimes)-1000:]
	}
}

// recordIndexingTime records indexing operation time
func (vo *VectorOperations) recordIndexingTime(duration time.Duration) {
	vo.mu.Lock()
	defer vo.mu.Unlock()

	vo.indexingTimes = append(vo.indexingTimes, duration)

	// Keep only recent 1000 measurements
	if len(vo.indexingTimes) > 1000 {
		vo.indexingTimes = vo.indexingTimes[len(vo.indexingTimes)-1000:]
	}
}

// optimizedEmbeddingMarshal optimizes embedding marshaling for Redis using binary encoding
func (vo *VectorOperations) optimizedEmbeddingMarshal(embedding []float64) ([]byte, error) {
	// Use binary encoding for better performance than JSON
	// Each float64 is 8 bytes, so allocate exact size needed
	buf := make([]byte, len(embedding)*8)

	// Write embedding length as first 4 bytes (int32)
	binary.LittleEndian.PutUint32(buf[0:4], uint32(len(embedding)))

	// Write each float64 value
	for i, val := range embedding {
		offset := 4 + i*8
		binary.LittleEndian.PutUint64(buf[offset:offset+8], math.Float64bits(val))
	}

	return buf, nil
}

// optimizedEmbeddingUnmarshal unmarshals binary encoded embeddings
func (vo *VectorOperations) optimizedEmbeddingUnmarshal(data []byte) ([]float64, error) {
	if len(data) < 4 {
		return nil, fmt.Errorf("data too short for embedding")
	}

	// Read embedding length
	length := binary.LittleEndian.Uint32(data[0:4])
	expectedSize := int(length)*8 + 4

	if len(data) != expectedSize {
		return nil, fmt.Errorf("data size mismatch: expected %d, got %d", expectedSize, len(data))
	}

	// Read float64 values
	embedding := make([]float64, length)
	for i := uint32(0); i < length; i++ {
		offset := 4 + int(i)*8
		bits := binary.LittleEndian.Uint64(data[offset : offset+8])
		embedding[i] = math.Float64frombits(bits)
	}

	return embedding, nil
}

// SearchSimilarBatch performs batch vector similarity search with concurrent processing
func (vo *VectorOperations) SearchSimilarBatch(ctx context.Context, queryEmbeddings [][]float64, limit int) ([]*VectorSearchResult, error) {
	if len(queryEmbeddings) == 0 {
		return []*VectorSearchResult{}, nil
	}

	startTime := time.Now()
	defer func() {
		logrus.WithFields(logrus.Fields{
			"batch_size":      len(queryEmbeddings),
			"processing_time": time.Since(startTime),
		}).Info("📦 Batch vector search completed")
	}()

	results := make([]*VectorSearchResult, len(queryEmbeddings))
	var wg sync.WaitGroup
	var mu sync.Mutex

	// Process embeddings in parallel batches
	batchSize := vo.maxConcurrency
	for i := 0; i < len(queryEmbeddings); i += batchSize {
		end := i + batchSize
		if end > len(queryEmbeddings) {
			end = len(queryEmbeddings)
		}

		wg.Add(1)
		go func(start, end int) {
			defer wg.Done()

			for j := start; j < end; j++ {
				result, err := vo.SearchSimilar(ctx, queryEmbeddings[j], limit)
				if err != nil {
					logrus.WithError(err).WithField("embedding_index", j).Warn("Failed to search embedding in batch")
					continue
				}

				mu.Lock()
				results[j] = result
				mu.Unlock()
			}
		}(i, end)
	}

	wg.Wait()
	return results, nil
}

// parseDocumentFields parses document fields from Redis result
func (vo *VectorOperations) parseDocumentFields(docKey string, fields []interface{}) (*RAGDocument, float64, error) {
	// Extract document ID from key (format: "doc:id")
	docID := strings.TrimPrefix(docKey, "doc:")

	doc := &RAGDocument{
		ID:       docID,
		Metadata: make(map[string]string),
	}

	var score float64 = 0.0

	// Parse field-value pairs
	for i := 0; i < len(fields); i += 2 {
		if i+1 >= len(fields) {
			break
		}

		fieldName, ok := fields[i].(string)
		if !ok {
			continue
		}

		fieldValue := fields[i+1]

		switch fieldName {
		case "content":
			if content, ok := fieldValue.(string); ok {
				doc.Content = content
			}
		case "title":
			if title, ok := fieldValue.(string); ok {
				doc.Title = title
			}
		case "service_type":
			if serviceType, ok := fieldValue.(string); ok {
				doc.ServiceType = serviceType
			}
		case "keywords":
			if keywordsStr, ok := fieldValue.(string); ok {
				if keywordsStr != "" {
					doc.Keywords = strings.Split(keywordsStr, ",")
				}
			}
		case "indexed_at":
			if indexedAtStr, ok := fieldValue.(string); ok {
				if timestamp, err := strconv.ParseInt(indexedAtStr, 10, 64); err == nil {
					doc.IndexedAt = time.Unix(timestamp, 0)
				}
			}
		case "score":
			if scoreStr, ok := fieldValue.(string); ok {
				if parsedScore, err := strconv.ParseFloat(scoreStr, 64); err == nil {
					score = parsedScore
				}
			}
		case "embedding":
			if embeddingStr, ok := fieldValue.(string); ok {
				if embedding, err := vo.optimizedEmbeddingUnmarshal([]byte(embeddingStr)); err == nil {
					doc.Embedding = embedding
				} else {
					logrus.WithError(err).Warn("Failed to unmarshal embedding from Redis")
				}
			}
		default:
			// Handle metadata fields (prefixed with "meta_")
			if strings.HasPrefix(fieldName, "meta_") {
				metaKey := strings.TrimPrefix(fieldName, "meta_")
				if metaValue, ok := fieldValue.(string); ok {
					doc.Metadata[metaKey] = metaValue
				}
			}
		}
	}

	return doc, score, nil
}

// IndexExists checks if the vector index exists
func (vo *VectorOperations) IndexExists(ctx context.Context) (bool, error) {
	_, err := vo.redis.Do(ctx, "FT.INFO", vo.indexName).Result()
	if err != nil {
		if strings.Contains(err.Error(), "Unknown Index name") {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// GetIndexInfo returns information about the vector index
func (vo *VectorOperations) GetIndexInfo(ctx context.Context) (map[string]interface{}, error) {
	result, err := vo.redis.Do(ctx, "FT.INFO", vo.indexName).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get index info: %w", err)
	}

	// Parse index info
	info := make(map[string]interface{})
	if resultSlice, ok := result.([]interface{}); ok {
		for i := 0; i < len(resultSlice); i += 2 {
			if i+1 < len(resultSlice) {
				if key, ok := resultSlice[i].(string); ok {
					info[key] = resultSlice[i+1]
				}
			}
		}
	}

	return info, nil
}

// DeleteDocument deletes a document from the index
func (vo *VectorOperations) DeleteDocument(ctx context.Context, docID string) error {
	key := fmt.Sprintf("doc:%s", docID)

	// Delete from Redis hash
	_, err := vo.redis.Del(ctx, key).Result()
	if err != nil {
		return fmt.Errorf("failed to delete document: %w", err)
	}

	logrus.WithField("document_id", docID).Info("📄 Document deleted from index")
	return nil
}

// GetDocumentCount returns the number of documents in the index
func (vo *VectorOperations) GetDocumentCount(ctx context.Context) (int64, error) {
	info, err := vo.GetIndexInfo(ctx)
	if err != nil {
		return 0, err
	}

	if numDocs, exists := info["num_docs"]; exists {
		if count, ok := numDocs.(int64); ok {
			return count, nil
		}
		if countStr, ok := numDocs.(string); ok {
			if count, err := strconv.ParseInt(countStr, 10, 64); err == nil {
				return count, nil
			}
		}
	}

	return 0, nil
}

// SearchByKeywords performs keyword-based search
func (vo *VectorOperations) SearchByKeywords(ctx context.Context, keywords []string, limit int) (*VectorSearchResult, error) {
	startTime := time.Now()

	if len(keywords) == 0 {
		return &VectorSearchResult{
			Documents: []*RAGDocument{},
			Scores:    []float64{},
			QueryTime: time.Since(startTime),
		}, nil
	}

	// Build keyword query
	keywordQuery := strings.Join(keywords, " | ")

	searchCmd := []interface{}{
		"FT.SEARCH", vo.indexName,
		keywordQuery,
		"LIMIT", "0", strconv.Itoa(limit),
		"RETURN", "9",
		"content", "title", "service_type", "keywords", "indexed_at",
	}

	result, err := vo.redis.Do(ctx, searchCmd...).Result()
	if err != nil {
		return nil, fmt.Errorf("keyword search failed: %w", err)
	}

	// Parse search results (without scores for keyword search)
	documents, _, err := vo.parseSearchResults(result)
	if err != nil {
		return nil, fmt.Errorf("failed to parse keyword search results: %w", err)
	}

	// Generate default scores for keyword search
	scores := make([]float64, len(documents))
	for i := range scores {
		scores[i] = 1.0 // Default score for keyword matches
	}

	queryTime := time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"query_time":    queryTime,
		"results_count": len(documents),
		"keywords":      keywords,
	}).Debug("🔍 Keyword search completed")

	return &VectorSearchResult{
		Documents: documents,
		Scores:    scores,
		QueryTime: queryTime,
	}, nil
}

// HybridSearch performs both vector and keyword search, then combines results
func (vo *VectorOperations) HybridSearch(ctx context.Context, queryEmbedding []float64, keywords []string, limit int) (*VectorSearchResult, error) {
	startTime := time.Now()

	// Perform vector search
	vectorResults, err := vo.SearchSimilar(ctx, queryEmbedding, limit)
	if err != nil {
		return nil, fmt.Errorf("vector search failed: %w", err)
	}

	// Perform keyword search if keywords provided
	var keywordResults *VectorSearchResult
	if len(keywords) > 0 {
		keywordResults, err = vo.SearchByKeywords(ctx, keywords, limit)
		if err != nil {
			logrus.WithError(err).Warn("Keyword search failed, using vector results only")
			keywordResults = &VectorSearchResult{Documents: []*RAGDocument{}, Scores: []float64{}}
		}
	} else {
		keywordResults = &VectorSearchResult{Documents: []*RAGDocument{}, Scores: []float64{}}
	}

	// Combine and deduplicate results
	combinedDocs, combinedScores := vo.combineSearchResults(vectorResults, keywordResults)

	// Limit results
	if len(combinedDocs) > limit {
		combinedDocs = combinedDocs[:limit]
		combinedScores = combinedScores[:limit]
	}

	queryTime := time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"query_time":       queryTime,
		"vector_results":   len(vectorResults.Documents),
		"keyword_results":  len(keywordResults.Documents),
		"combined_results": len(combinedDocs),
	}).Debug("🔍 Hybrid search completed")

	return &VectorSearchResult{
		Documents: combinedDocs,
		Scores:    combinedScores,
		QueryTime: queryTime,
	}, nil
}

// combineSearchResults combines vector and keyword search results
func (vo *VectorOperations) combineSearchResults(vectorResults, keywordResults *VectorSearchResult) ([]*RAGDocument, []float64) {
	docMap := make(map[string]*RAGDocument)
	scoreMap := make(map[string]float64)

	// Add vector results with higher weight
	for i, doc := range vectorResults.Documents {
		docMap[doc.ID] = doc
		if i < len(vectorResults.Scores) {
			scoreMap[doc.ID] = vectorResults.Scores[i] * 0.7 // 70% weight for vector similarity
		}
	}

	// Add keyword results with lower weight, combining scores if document already exists
	for i, doc := range keywordResults.Documents {
		if _, exists := docMap[doc.ID]; exists {
			// Document already exists from vector search, combine scores
			if i < len(keywordResults.Scores) {
				scoreMap[doc.ID] += keywordResults.Scores[i] * 0.3 // 30% weight for keyword match
			}
		} else {
			// New document from keyword search
			docMap[doc.ID] = doc
			if i < len(keywordResults.Scores) {
				scoreMap[doc.ID] = keywordResults.Scores[i] * 0.3
			}
		}
	}

	// Convert back to slices and sort by score
	var documents []*RAGDocument
	var scores []float64

	for docID, doc := range docMap {
		documents = append(documents, doc)
		scores = append(scores, scoreMap[docID])
	}

	// Simple bubble sort by score (descending)
	for i := 0; i < len(scores); i++ {
		for j := i + 1; j < len(scores); j++ {
			if scores[i] < scores[j] {
				scores[i], scores[j] = scores[j], scores[i]
				documents[i], documents[j] = documents[j], documents[i]
			}
		}
	}

	return documents, scores
}

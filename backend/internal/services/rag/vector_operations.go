package rag

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// VectorOperations provides Redis vector search operations
type VectorOperations struct {
	redis       *redis.Client
	config      *RAGConfig
	indexName   string
}

// VectorSearchResult represents vector search results
type VectorSearchResult struct {
	Documents []*RAGDocument `json:"documents"`
	Scores    []float64      `json:"scores"`
	QueryTime time.Duration  `json:"query_time"`
}

// NewVectorOperations creates a new vector operations service
func NewVectorOperations(redisClient *redis.Client, config *RAGConfig) *VectorOperations {
	return &VectorOperations{
		redis:     redisClient,
		config:    config,
		indexName: config.IndexName,
	}
}

// SearchSimilar performs vector similarity search
func (vo *VectorOperations) SearchSimilar(ctx context.Context, queryEmbedding []float64, limit int) (*VectorSearchResult, error) {
	startTime := time.Now()

	// Convert embedding to bytes for Redis
	embeddingBytes, err := json.Marshal(queryEmbedding)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query embedding: %w", err)
	}

	// Perform vector search using FT.SEARCH with KNN
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

	result, err := vo.redis.Do(ctx, searchCmd...).Result()
	if err != nil {
		return nil, fmt.Errorf("vector search failed: %w", err)
	}

	// Parse search results
	documents, scores, err := vo.parseSearchResults(result)
	if err != nil {
		return nil, fmt.Errorf("failed to parse search results: %w", err)
	}

	queryTime := time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"query_time":    queryTime,
		"results_count": len(documents),
		"limit":         limit,
	}).Debug("🔍 Vector search completed")

	return &VectorSearchResult{
		Documents: documents,
		Scores:    scores,
		QueryTime: queryTime,
	}, nil
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
		"query_time":      queryTime,
		"vector_results":  len(vectorResults.Documents),
		"keyword_results": len(keywordResults.Documents),
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

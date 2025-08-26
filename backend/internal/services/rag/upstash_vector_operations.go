package rag

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// UpstashVectorOperations provides vector operations compatible with Upstash Redis
// Uses standard Redis operations instead of RediSearch module
type UpstashVectorOperations struct {
	redis       *redis.Client
	config      *RAGConfig
	indexPrefix string
}

// UpstashDocument represents a document stored in Upstash Redis
type UpstashDocument struct {
	ID          string            `json:"id"`
	Content     string            `json:"content"`
	Title       string            `json:"title"`
	ServiceType string            `json:"service_type"`
	Keywords    []string          `json:"keywords"`
	Metadata    map[string]string `json:"metadata"`
	Embedding   []float64         `json:"embedding"`
	IndexedAt   time.Time         `json:"indexed_at"`
}

// docSimilarity represents a document with its similarity score
type docSimilarity struct {
	doc        *RAGDocument
	similarity float64
}

// NewUpstashVectorOperations creates a new Upstash-compatible vector operations service
func NewUpstashVectorOperations(redisClient *redis.Client, config *RAGConfig) *UpstashVectorOperations {
	return &UpstashVectorOperations{
		redis:       redisClient,
		config:      config,
		indexPrefix: "rag_doc:",
	}
}

// StoreDocument stores a document with its embedding in Upstash Redis
func (uvo *UpstashVectorOperations) StoreDocument(ctx context.Context, doc *RAGDocument) error {
	key := fmt.Sprintf("%s%s", uvo.indexPrefix, doc.ID)
	
	// Create Upstash document
	upstashDoc := &UpstashDocument{
		ID:          doc.ID,
		Content:     doc.Content,
		Title:       doc.Title,
		ServiceType: doc.ServiceType,
		Keywords:    doc.Keywords,
		Metadata:    doc.Metadata,
		Embedding:   doc.Embedding,
		IndexedAt:   doc.IndexedAt,
	}
	
	// Serialize document
	data, err := json.Marshal(upstashDoc)
	if err != nil {
		return fmt.Errorf("failed to marshal document: %w", err)
	}
	
	// Store document in Redis with TTL
	err = uvo.redis.SetEx(ctx, key, data, 24*time.Hour).Err()
	if err != nil {
		return fmt.Errorf("failed to store document in Redis: %w", err)
	}
	
	// Add document ID to index set for efficient retrieval
	indexSetKey := fmt.Sprintf("%sindex", uvo.indexPrefix)
	err = uvo.redis.SAdd(ctx, indexSetKey, doc.ID).Err()
	if err != nil {
		logrus.WithError(err).Warn("Failed to add document to index set")
	}
	
	// Add to service type index for filtering
	if doc.ServiceType != "" {
		serviceTypeKey := fmt.Sprintf("%sservice:%s", uvo.indexPrefix, doc.ServiceType)
		err = uvo.redis.SAdd(ctx, serviceTypeKey, doc.ID).Err()
		if err != nil {
			logrus.WithError(err).Warn("Failed to add document to service type index")
		}
	}
	
	logrus.WithFields(logrus.Fields{
		"document_id":    doc.ID,
		"service_type":   doc.ServiceType,
		"content_length": len(doc.Content),
		"embedding_dim":  len(doc.Embedding),
	}).Debug("Document stored in Upstash Redis")
	
	return nil
}

// SearchSimilar performs vector similarity search using cosine similarity
func (uvo *UpstashVectorOperations) SearchSimilar(ctx context.Context, queryEmbedding []float64, limit int) (*VectorSearchResult, error) {
	startTime := time.Now()
	
	// Get all document IDs from index
	indexSetKey := fmt.Sprintf("%sindex", uvo.indexPrefix)
	docIDs, err := uvo.redis.SMembers(ctx, indexSetKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get document IDs: %w", err)
	}
	
	if len(docIDs) == 0 {
		return &VectorSearchResult{
			Documents: []*RAGDocument{},
			Scores:    []float64{},
			QueryTime: time.Since(startTime),
		}, nil
	}
	
	// Retrieve documents and calculate similarities
	var similarities []docSimilarity
	
	// Process documents in batches to avoid overwhelming Redis
	batchSize := 50
	for i := 0; i < len(docIDs); i += batchSize {
		end := i + batchSize
		if end > len(docIDs) {
			end = len(docIDs)
		}
		
		batch := docIDs[i:end]
		batchSimilarities, err := uvo.processBatch(ctx, batch, queryEmbedding)
		if err != nil {
			logrus.WithError(err).Warn("Failed to process batch")
			continue
		}
		
		similarities = append(similarities, batchSimilarities...)
	}
	
	// Sort by similarity (descending)
	sort.Slice(similarities, func(i, j int) bool {
		return similarities[i].similarity > similarities[j].similarity
	})
	
	// Apply similarity threshold and limit
	var documents []*RAGDocument
	var scores []float64
	
	for _, sim := range similarities {
		if sim.similarity >= uvo.config.SimilarityThreshold && len(documents) < limit {
			documents = append(documents, sim.doc)
			scores = append(scores, sim.similarity)
		}
	}
	
	queryTime := time.Since(startTime)
	
	logrus.WithFields(logrus.Fields{
		"query_time":     queryTime,
		"total_docs":     len(docIDs),
		"results_count":  len(documents),
		"similarity_threshold": uvo.config.SimilarityThreshold,
	}).Debug("Upstash vector search completed")
	
	return &VectorSearchResult{
		Documents: documents,
		Scores:    scores,
		QueryTime: queryTime,
	}, nil
}

// processBatch processes a batch of document IDs and calculates similarities
func (uvo *UpstashVectorOperations) processBatch(ctx context.Context, docIDs []string, queryEmbedding []float64) ([]docSimilarity, error) {
	// Build keys for batch retrieval
	keys := make([]string, len(docIDs))
	for i, docID := range docIDs {
		keys[i] = fmt.Sprintf("%s%s", uvo.indexPrefix, docID)
	}
	
	// Batch retrieve documents
	results, err := uvo.redis.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to batch retrieve documents: %w", err)
	}
	
	var similarities []docSimilarity
	
	for i, result := range results {
		if result == nil {
			continue
		}
		
		docData, ok := result.(string)
		if !ok {
			continue
		}
		
		var upstashDoc UpstashDocument
		if err := json.Unmarshal([]byte(docData), &upstashDoc); err != nil {
			logrus.WithError(err).WithField("doc_id", docIDs[i]).Warn("Failed to unmarshal document")
			continue
		}
		
		// Calculate cosine similarity
		similarity := uvo.calculateCosineSimilarity(queryEmbedding, upstashDoc.Embedding)
		
		// Convert to RAGDocument
		ragDoc := &RAGDocument{
			ID:          upstashDoc.ID,
			Content:     upstashDoc.Content,
			Title:       upstashDoc.Title,
			ServiceType: upstashDoc.ServiceType,
			Keywords:    upstashDoc.Keywords,
			Metadata:    upstashDoc.Metadata,
			Embedding:   upstashDoc.Embedding,
			IndexedAt:   upstashDoc.IndexedAt,
		}
		
		similarities = append(similarities, docSimilarity{
			doc:        ragDoc,
			similarity: similarity,
		})
	}
	
	return similarities, nil
}

// calculateCosineSimilarity calculates cosine similarity between two vectors
func (uvo *UpstashVectorOperations) calculateCosineSimilarity(vec1, vec2 []float64) float64 {
	if len(vec1) != len(vec2) {
		return 0.0
	}
	
	var dotProduct, norm1, norm2 float64
	
	for i := 0; i < len(vec1); i++ {
		dotProduct += vec1[i] * vec2[i]
		norm1 += vec1[i] * vec1[i]
		norm2 += vec2[i] * vec2[i]
	}
	
	if norm1 == 0.0 || norm2 == 0.0 {
		return 0.0
	}
	
	return dotProduct / (math.Sqrt(norm1) * math.Sqrt(norm2))
}

// SearchByKeywords performs keyword-based search using Redis SCAN
func (uvo *UpstashVectorOperations) SearchByKeywords(ctx context.Context, keywords []string, limit int) (*VectorSearchResult, error) {
	startTime := time.Now()
	
	if len(keywords) == 0 {
		return &VectorSearchResult{
			Documents: []*RAGDocument{},
			Scores:    []float64{},
			QueryTime: time.Since(startTime),
		}, nil
	}
	
	// Get all document IDs
	indexSetKey := fmt.Sprintf("%sindex", uvo.indexPrefix)
	docIDs, err := uvo.redis.SMembers(ctx, indexSetKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get document IDs: %w", err)
	}
	
	var matchingDocs []*RAGDocument
	var scores []float64
	
	// Process documents and check for keyword matches
	for _, docID := range docIDs {
		key := fmt.Sprintf("%s%s", uvo.indexPrefix, docID)
		docData, err := uvo.redis.Get(ctx, key).Result()
		if err != nil {
			continue
		}
		
		var upstashDoc UpstashDocument
		if err := json.Unmarshal([]byte(docData), &upstashDoc); err != nil {
			continue
		}
		
		// Calculate keyword match score
		score := uvo.calculateKeywordScore(keywords, &upstashDoc)
		if score > 0 {
			ragDoc := &RAGDocument{
				ID:          upstashDoc.ID,
				Content:     upstashDoc.Content,
				Title:       upstashDoc.Title,
				ServiceType: upstashDoc.ServiceType,
				Keywords:    upstashDoc.Keywords,
				Metadata:    upstashDoc.Metadata,
				Embedding:   upstashDoc.Embedding,
				IndexedAt:   upstashDoc.IndexedAt,
			}
			
			matchingDocs = append(matchingDocs, ragDoc)
			scores = append(scores, score)
		}
		
		if len(matchingDocs) >= limit {
			break
		}
	}
	
	queryTime := time.Since(startTime)
	
	return &VectorSearchResult{
		Documents: matchingDocs,
		Scores:    scores,
		QueryTime: queryTime,
	}, nil
}

// calculateKeywordScore calculates keyword match score
func (uvo *UpstashVectorOperations) calculateKeywordScore(keywords []string, doc *UpstashDocument) float64 {
	score := 0.0
	totalKeywords := float64(len(keywords))
	
	if totalKeywords == 0 {
		return 0.0
	}
	
	content := strings.ToLower(doc.Content)
	title := strings.ToLower(doc.Title)
	
	for _, keyword := range keywords {
		keywordLower := strings.ToLower(keyword)
		
		// Title matches get higher score
		if strings.Contains(title, keywordLower) {
			score += 2.0
		}
		
		// Content matches get standard score
		if strings.Contains(content, keywordLower) {
			score += 1.0
		}
		
		// Keyword list matches
		for _, docKeyword := range doc.Keywords {
			if strings.Contains(strings.ToLower(docKeyword), keywordLower) {
				score += 1.5
				break
			}
		}
	}
	
	// Normalize score
	return score / totalKeywords
}

// GetDocumentCount returns the number of documents in the index
func (uvo *UpstashVectorOperations) GetDocumentCount(ctx context.Context) (int64, error) {
	indexSetKey := fmt.Sprintf("%sindex", uvo.indexPrefix)
	count, err := uvo.redis.SCard(ctx, indexSetKey).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get document count: %w", err)
	}
	return count, nil
}

// DeleteDocument deletes a document from the index
func (uvo *UpstashVectorOperations) DeleteDocument(ctx context.Context, docID string) error {
	key := fmt.Sprintf("%s%s", uvo.indexPrefix, docID)
	
	// Delete document
	_, err := uvo.redis.Del(ctx, key).Result()
	if err != nil {
		return fmt.Errorf("failed to delete document: %w", err)
	}
	
	// Remove from index set
	indexSetKey := fmt.Sprintf("%sindex", uvo.indexPrefix)
	uvo.redis.SRem(ctx, indexSetKey, docID)
	
	logrus.WithField("document_id", docID).Info("Document deleted from Upstash Redis")
	return nil
}

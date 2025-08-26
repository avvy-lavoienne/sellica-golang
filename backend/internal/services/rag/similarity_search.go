package rag

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// SimilaritySearch provides advanced similarity search capabilities
type SimilaritySearch struct {
	ragService          *RedisRAGService
	embeddingService    *EmbeddingService
	performanceMonitor  *RAGPerformanceMonitor
	
	// Search configuration
	defaultThreshold    float64
	maxResults          int
	hybridSearchEnabled bool
}

// SearchOptions represents search configuration options
type SearchOptions struct {
	MaxResults          int     `json:"max_results"`
	SimilarityThreshold float64 `json:"similarity_threshold"`
	UseHybridSearch     bool    `json:"use_hybrid_search"`
	BoostKeywords       bool    `json:"boost_keywords"`
	ServiceTypeFilter   string  `json:"service_type_filter"`
	IncludeMetadata     bool    `json:"include_metadata"`
}

// SimilaritySearchResult represents enhanced search results
type SimilaritySearchResult struct {
	Documents       []*RAGDocument    `json:"documents"`
	Scores          []float64         `json:"scores"`
	QueryEmbedding  []float64         `json:"query_embedding"`
	SearchMethod    string            `json:"search_method"`
	ProcessingTime  time.Duration     `json:"processing_time"`
	TotalResults    int               `json:"total_results"`
	FilteredResults int               `json:"filtered_results"`
	CacheHit        bool              `json:"cache_hit"`
	SearchStats     *SearchStats      `json:"search_stats"`
}

// SearchStats provides detailed search statistics
type SearchStats struct {
	EmbeddingTime       time.Duration `json:"embedding_time"`
	VectorSearchTime    time.Duration `json:"vector_search_time"`
	KeywordSearchTime   time.Duration `json:"keyword_search_time"`
	FilteringTime       time.Duration `json:"filtering_time"`
	RankingTime         time.Duration `json:"ranking_time"`
	CacheOperationTime  time.Duration `json:"cache_operation_time"`
}

// NewSimilaritySearch creates a new similarity search service
func NewSimilaritySearch(ragService *RedisRAGService, embeddingService *EmbeddingService, performanceMonitor *RAGPerformanceMonitor) *SimilaritySearch {
	return &SimilaritySearch{
		ragService:          ragService,
		embeddingService:    embeddingService,
		performanceMonitor:  performanceMonitor,
		defaultThreshold:    0.7,
		maxResults:          10,
		hybridSearchEnabled: true,
	}
}

// Search performs advanced similarity search
func (ss *SimilaritySearch) Search(ctx context.Context, query string, options *SearchOptions) (*SimilaritySearchResult, error) {
	startTime := time.Now()
	
	// Use default options if not provided
	if options == nil {
		options = &SearchOptions{
			MaxResults:          ss.maxResults,
			SimilarityThreshold: ss.defaultThreshold,
			UseHybridSearch:     ss.hybridSearchEnabled,
			BoostKeywords:       true,
			IncludeMetadata:     true,
		}
	}

	stats := &SearchStats{}
	
	// Generate query embedding
	embeddingStart := time.Now()
	queryEmbedding, err := ss.embeddingService.GenerateEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}
	stats.EmbeddingTime = time.Since(embeddingStart)

	var searchResult *SimilaritySearchResult
	
	if options.UseHybridSearch {
		searchResult, err = ss.performHybridSearch(ctx, query, queryEmbedding, options, stats)
	} else {
		searchResult, err = ss.performVectorSearch(ctx, queryEmbedding, options, stats)
	}
	
	if err != nil {
		return nil, fmt.Errorf("search failed: %w", err)
	}

	// Apply post-processing
	ss.postProcessResults(searchResult, query, options, stats)
	
	searchResult.QueryEmbedding = queryEmbedding
	searchResult.ProcessingTime = time.Since(startTime)
	searchResult.SearchStats = stats

	// Record performance metrics
	ss.performanceMonitor.RecordSearchTime(searchResult.ProcessingTime)

	logrus.WithFields(logrus.Fields{
		"query":            query,
		"results_count":    len(searchResult.Documents),
		"processing_time":  searchResult.ProcessingTime,
		"search_method":    searchResult.SearchMethod,
		"cache_hit":        searchResult.CacheHit,
	}).Debug("🔍 Advanced similarity search completed")

	return searchResult, nil
}

// performVectorSearch performs pure vector similarity search
func (ss *SimilaritySearch) performVectorSearch(ctx context.Context, queryEmbedding []float64, options *SearchOptions, stats *SearchStats) (*SimilaritySearchResult, error) {
	vectorStart := time.Now()
	
	// Perform vector search
	vectorResults, err := ss.ragService.vectorOperations.SearchSimilar(ctx, queryEmbedding, options.MaxResults*2) // Get more results for filtering
	if err != nil {
		return nil, fmt.Errorf("vector search failed: %w", err)
	}
	
	stats.VectorSearchTime = time.Since(vectorStart)

	return &SimilaritySearchResult{
		Documents:       vectorResults.Documents,
		Scores:          vectorResults.Scores,
		SearchMethod:    "vector_only",
		TotalResults:    len(vectorResults.Documents),
		FilteredResults: len(vectorResults.Documents),
		CacheHit:        false, // Vector operations handle their own caching
	}, nil
}

// performHybridSearch performs hybrid vector + keyword search
func (ss *SimilaritySearch) performHybridSearch(ctx context.Context, query string, queryEmbedding []float64, options *SearchOptions, stats *SearchStats) (*SimilaritySearchResult, error) {
	// Extract keywords from query
	keywords := ss.extractQueryKeywords(query)
	
	// Perform vector search
	vectorStart := time.Now()
	vectorResults, err := ss.ragService.vectorOperations.SearchSimilar(ctx, queryEmbedding, options.MaxResults)
	if err != nil {
		return nil, fmt.Errorf("vector search failed: %w", err)
	}
	stats.VectorSearchTime = time.Since(vectorStart)

	// Perform keyword search if keywords available
	var keywordResults *VectorSearchResult
	if len(keywords) > 0 {
		keywordStart := time.Now()
		keywordResults, err = ss.ragService.vectorOperations.SearchByKeywords(ctx, keywords, options.MaxResults)
		if err != nil {
			logrus.WithError(err).Warn("Keyword search failed, using vector results only")
			keywordResults = &VectorSearchResult{Documents: []*RAGDocument{}, Scores: []float64{}}
		}
		stats.KeywordSearchTime = time.Since(keywordStart)
	} else {
		keywordResults = &VectorSearchResult{Documents: []*RAGDocument{}, Scores: []float64{}}
	}

	// Combine results
	rankingStart := time.Now()
	combinedDocs, combinedScores := ss.combineAndRankResults(vectorResults, keywordResults, query, options)
	stats.RankingTime = time.Since(rankingStart)

	return &SimilaritySearchResult{
		Documents:       combinedDocs,
		Scores:          combinedScores,
		SearchMethod:    "hybrid",
		TotalResults:    len(vectorResults.Documents) + len(keywordResults.Documents),
		FilteredResults: len(combinedDocs),
		CacheHit:        false,
	}, nil
}

// extractQueryKeywords extracts keywords from search query
func (ss *SimilaritySearch) extractQueryKeywords(query string) []string {
	// Process query through Indonesian NLP to extract meaningful keywords
	processed, err := ss.embeddingService.processIndonesianText(query)
	if err != nil {
		logrus.WithError(err).Warn("Failed to process query for keyword extraction")
		return []string{}
	}

	var keywords []string
	
	// Add root words from morphological analysis
	if processed.Morphology != nil {
		keywords = append(keywords, processed.Morphology.RootWords...)
	}
	
	// Add government terms
	if processed.Government != nil {
		keywords = append(keywords, processed.Government.DocumentTypes...)
		keywords = append(keywords, processed.Government.Procedures...)
	}
	
	// Add extracted keywords
	keywords = append(keywords, processed.Keywords...)
	
	// Remove duplicates and filter
	return ss.filterKeywords(keywords)
}

// filterKeywords filters and deduplicates keywords
func (ss *SimilaritySearch) filterKeywords(keywords []string) []string {
	keywordMap := make(map[string]bool)
	var filtered []string
	
	for _, keyword := range keywords {
		if len(keyword) >= 3 && !keywordMap[keyword] {
			keywordMap[keyword] = true
			filtered = append(filtered, keyword)
		}
	}
	
	return filtered
}

// combineAndRankResults combines vector and keyword search results with intelligent ranking
func (ss *SimilaritySearch) combineAndRankResults(vectorResults, keywordResults *VectorSearchResult, query string, options *SearchOptions) ([]*RAGDocument, []float64) {
	docScoreMap := make(map[string]float64)
	docMap := make(map[string]*RAGDocument)
	
	// Add vector results with higher weight
	for i, doc := range vectorResults.Documents {
		score := 0.0
		if i < len(vectorResults.Scores) {
			score = vectorResults.Scores[i] * 0.7 // 70% weight for vector similarity
		}
		docScoreMap[doc.ID] = score
		docMap[doc.ID] = doc
	}
	
	// Add keyword results with lower weight, combining scores if document already exists
	for i, doc := range keywordResults.Documents {
		keywordScore := 1.0 // Default keyword match score
		if i < len(keywordResults.Scores) {
			keywordScore = keywordResults.Scores[i]
		}
		
		if existingScore, exists := docScoreMap[doc.ID]; exists {
			// Document already exists from vector search, combine scores
			docScoreMap[doc.ID] = existingScore + (keywordScore * 0.3) // 30% weight for keyword match
		} else {
			// New document from keyword search
			docScoreMap[doc.ID] = keywordScore * 0.3
			docMap[doc.ID] = doc
		}
	}
	
	// Apply service type filtering
	if options.ServiceTypeFilter != "" {
		ss.applyServiceTypeFilter(docMap, docScoreMap, options.ServiceTypeFilter)
	}
	
	// Apply similarity threshold filtering
	ss.applySimilarityThreshold(docMap, docScoreMap, options.SimilarityThreshold)
	
	// Convert to sorted slices
	type docScore struct {
		doc   *RAGDocument
		score float64
	}
	
	var docScores []docScore
	for docID, score := range docScoreMap {
		if doc, exists := docMap[docID]; exists {
			docScores = append(docScores, docScore{doc: doc, score: score})
		}
	}
	
	// Sort by score (descending)
	sort.Slice(docScores, func(i, j int) bool {
		return docScores[i].score > docScores[j].score
	})
	
	// Limit results
	if len(docScores) > options.MaxResults {
		docScores = docScores[:options.MaxResults]
	}
	
	// Extract documents and scores
	var documents []*RAGDocument
	var scores []float64
	
	for _, ds := range docScores {
		documents = append(documents, ds.doc)
		scores = append(scores, ds.score)
	}
	
	return documents, scores
}

// applyServiceTypeFilter filters results by service type
func (ss *SimilaritySearch) applyServiceTypeFilter(docMap map[string]*RAGDocument, docScoreMap map[string]float64, serviceType string) {
	for docID, doc := range docMap {
		if doc.ServiceType != serviceType {
			delete(docMap, docID)
			delete(docScoreMap, docID)
		}
	}
}

// applySimilarityThreshold filters results by similarity threshold
func (ss *SimilaritySearch) applySimilarityThreshold(docMap map[string]*RAGDocument, docScoreMap map[string]float64, threshold float64) {
	for docID, score := range docScoreMap {
		if score < threshold {
			delete(docMap, docID)
			delete(docScoreMap, docID)
		}
	}
}

// postProcessResults applies post-processing to search results
func (ss *SimilaritySearch) postProcessResults(result *SimilaritySearchResult, query string, options *SearchOptions, stats *SearchStats) {
	filterStart := time.Now()
	
	// Apply keyword boosting if enabled
	if options.BoostKeywords {
		ss.applyKeywordBoosting(result, query)
	}
	
	// Apply diversity filtering to avoid too similar results
	ss.applyDiversityFiltering(result)
	
	stats.FilteringTime = time.Since(filterStart)
}

// applyKeywordBoosting boosts scores for documents containing query keywords
func (ss *SimilaritySearch) applyKeywordBoosting(result *SimilaritySearchResult, query string) {
	queryLower := strings.ToLower(query)
	queryWords := strings.Fields(queryLower)
	
	for i, doc := range result.Documents {
		contentLower := strings.ToLower(doc.Content)
		titleLower := strings.ToLower(doc.Title)
		
		boost := 0.0
		for _, word := range queryWords {
			if len(word) >= 3 {
				// Boost for title matches
				if strings.Contains(titleLower, word) {
					boost += 0.2
				}
				// Boost for content matches
				if strings.Contains(contentLower, word) {
					boost += 0.1
				}
			}
		}
		
		if i < len(result.Scores) {
			result.Scores[i] += boost
		}
	}
}

// applyDiversityFiltering removes very similar documents to increase result diversity
func (ss *SimilaritySearch) applyDiversityFiltering(result *SimilaritySearchResult) {
	if len(result.Documents) <= 1 {
		return
	}
	
	var filteredDocs []*RAGDocument
	var filteredScores []float64
	
	for i, doc := range result.Documents {
		isDuplicate := false
		
		// Check against already selected documents
		for _, selectedDoc := range filteredDocs {
			similarity := ss.calculateContentSimilarity(doc.Content, selectedDoc.Content)
			if similarity > 0.9 { // Very high similarity threshold
				isDuplicate = true
				break
			}
		}
		
		if !isDuplicate {
			filteredDocs = append(filteredDocs, doc)
			if i < len(result.Scores) {
				filteredScores = append(filteredScores, result.Scores[i])
			}
		}
	}
	
	result.Documents = filteredDocs
	result.Scores = filteredScores
	result.FilteredResults = len(filteredDocs)
}

// calculateContentSimilarity calculates simple content similarity
func (ss *SimilaritySearch) calculateContentSimilarity(content1, content2 string) float64 {
	// Simple Jaccard similarity based on words
	words1 := strings.Fields(strings.ToLower(content1))
	words2 := strings.Fields(strings.ToLower(content2))
	
	if len(words1) == 0 && len(words2) == 0 {
		return 1.0
	}
	
	if len(words1) == 0 || len(words2) == 0 {
		return 0.0
	}
	
	// Create word sets
	set1 := make(map[string]bool)
	set2 := make(map[string]bool)
	
	for _, word := range words1 {
		set1[word] = true
	}
	
	for _, word := range words2 {
		set2[word] = true
	}
	
	// Calculate intersection and union
	intersection := 0
	union := len(set1)
	
	for word := range set2 {
		if set1[word] {
			intersection++
		} else {
			union++
		}
	}
	
	if union == 0 {
		return 0.0
	}
	
	return float64(intersection) / float64(union)
}

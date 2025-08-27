package rag

import (
	"context"
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestHNSWIndexBasicFunctionality tests basic HNSW index operations
func TestHNSWIndexBasicFunctionality(t *testing.T) {
	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             50,
		EfConstruction: 50,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      128,
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	ctx := context.Background()

	// Test adding vectors
	vectors := generateTestVectors(100, 128)
	vectorIDs := make([]int, len(vectors))

	for i, vector := range vectors {
		metadata := map[string]interface{}{
			"id":    i,
			"label": "test_vector",
		}

		id, err := index.AddVector(ctx, vector, metadata)
		require.NoError(t, err)
		assert.Equal(t, i, id)
		vectorIDs[i] = id
	}

	// Test search
	queryVector := vectors[0] // Use first vector as query
	results, err := index.SearchKNN(ctx, queryVector, 5)
	require.NoError(t, err)
	assert.Greater(t, len(results), 0)
	assert.LessOrEqual(t, len(results), 5)

	// First result should be the query vector itself (distance 0)
	assert.Equal(t, 0, results[0].ID)
	assert.InDelta(t, 0.0, results[0].Score, 0.001)

	// Test stats
	stats := index.GetStats()
	assert.Equal(t, 100, stats["total_vectors"])
	assert.GreaterOrEqual(t, stats["max_level"], 0)
}

// TestHNSWIndexPerformance tests HNSW index performance
func TestHNSWIndexPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance test in short mode")
	}

	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             100,
		EfConstruction: 100,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      768, // Indonesian BERT dimensions
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	ctx := context.Background()

	// Add 1000 vectors
	vectors := generateTestVectors(1000, 768)

	startTime := time.Now()
	for i, vector := range vectors {
		metadata := map[string]interface{}{
			"id": i,
		}
		_, err := index.AddVector(ctx, vector, metadata)
		require.NoError(t, err)
	}
	indexingTime := time.Since(startTime)

	t.Logf("Indexing 1000 vectors took: %v (%.2f ms per vector)",
		indexingTime, float64(indexingTime.Nanoseconds())/1e6/1000)

	// Perform searches
	numSearches := 100
	queryVectors := generateTestVectors(numSearches, 768)

	startTime = time.Now()
	for _, queryVector := range queryVectors {
		results, err := index.SearchKNN(ctx, queryVector, 10)
		require.NoError(t, err)
		assert.LessOrEqual(t, len(results), 10)
	}
	searchTime := time.Since(startTime)

	avgSearchTime := float64(searchTime.Nanoseconds()) / 1e6 / float64(numSearches)
	t.Logf("Searching %d queries took: %v (%.2f ms per search)",
		numSearches, searchTime, avgSearchTime)

	// Performance assertions
	assert.Less(t, avgSearchTime, 100.0, "Average search time should be less than 100ms")

	// Test stats
	stats := index.GetStats()
	assert.Equal(t, 1000, stats["total_vectors"])
	if avgSearchTimeStats, ok := stats["avg_search_time_ms"]; ok {
		assert.Less(t, avgSearchTimeStats.(float64), 100.0)
	}
}

// TestConcurrentVectorSearch tests concurrent vector search functionality
func TestConcurrentVectorSearch(t *testing.T) {
	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             50,
		EfConstruction: 50,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      128,
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	searchConfig := &ConcurrentSearchConfig{
		WorkerPoolSize:    4,
		CacheSize:         100,
		CacheTTL:          1 * time.Minute,
		BatchSize:         5,
		SearchTimeout:     5 * time.Second,
		EnablePrefetching: true,
	}

	concurrentSearch := NewConcurrentVectorSearch(index, searchConfig)
	defer concurrentSearch.Close()

	ctx := context.Background()

	// Add test vectors
	vectors := generateTestVectors(50, 128)
	for i, vector := range vectors {
		metadata := map[string]interface{}{
			"id": i,
		}
		_, err := index.AddVector(ctx, vector, metadata)
		require.NoError(t, err)
	}

	// Test concurrent search
	queryVector := vectors[0]
	results, err := concurrentSearch.SearchSimilarConcurrent(ctx, queryVector, 5)
	require.NoError(t, err)
	assert.Greater(t, len(results), 0)
	assert.LessOrEqual(t, len(results), 5)

	// Test cache functionality - search same query again
	results2, err := concurrentSearch.SearchSimilarConcurrent(ctx, queryVector, 5)
	require.NoError(t, err)
	assert.Equal(t, len(results), len(results2))

	// Test batch search
	queryVectors := vectors[:5]
	batchResults, err := concurrentSearch.BatchSearchConcurrent(ctx, queryVectors, 3)
	require.NoError(t, err)
	assert.Equal(t, 5, len(batchResults))

	for i, results := range batchResults {
		assert.LessOrEqual(t, len(results), 3, "Batch result %d should have at most 3 results", i)
	}

	// Test stats
	stats := concurrentSearch.GetStats()
	assert.Greater(t, stats["total_searches"], int64(0))
	assert.GreaterOrEqual(t, stats["cache_hit_ratio"], 0.0)
}

// TestHNSWVectorOperations tests the HNSW vector operations implementation
func TestHNSWVectorOperations(t *testing.T) {
	// Skip if Redis not available
	if testing.Short() {
		t.Skip("Skipping HNSW vector operations test in short mode")
	}

	config := &RAGConfig{
		IndexName:           "test_hnsw_index",
		VectorDimensions:    128,
		MaxVectors:          1000,
		SimilarityThreshold: 0.7,
		MaxResults:          10,
		CacheEnabled:        true,
		CacheTTL:            1 * time.Hour,
		CompressionEnabled:  false,
	}

	// Create HNSW vector operations (without Redis for testing)
	hvo := NewHNSWVectorOperations(nil, config)
	defer hvo.Close()

	ctx := context.Background()

	// Test document storage
	docs := generateTestDocuments(10, 128)
	for _, doc := range docs {
		err := hvo.StoreDocument(ctx, doc)
		require.NoError(t, err)
	}

	// Test document count
	count, err := hvo.GetDocumentCount(ctx)
	require.NoError(t, err)
	assert.Equal(t, int64(10), count)

	// Test similarity search
	queryEmbedding := make([]float64, 128)
	for i := range queryEmbedding {
		queryEmbedding[i] = rand.Float64()
	}

	results, err := hvo.SearchSimilar(ctx, queryEmbedding, 5)
	require.NoError(t, err)
	assert.LessOrEqual(t, len(results.Documents), 5)
	assert.Equal(t, len(results.Documents), len(results.Scores))

	// Test keyword search
	keywords := []string{"test", "document"}
	keywordResults, err := hvo.SearchByKeywords(ctx, keywords, 3)
	require.NoError(t, err)
	assert.LessOrEqual(t, len(keywordResults.Documents), 3)

	// Test document deletion
	if len(docs) > 0 {
		err := hvo.DeleteDocument(ctx, docs[0].ID)
		require.NoError(t, err)

		// Verify count decreased
		newCount, err := hvo.GetDocumentCount(ctx)
		require.NoError(t, err)
		assert.Equal(t, int64(9), newCount)
	}

	// Test stats
	stats := hvo.GetStats()
	assert.Greater(t, stats["total_indexed"], int64(0))
	assert.GreaterOrEqual(t, stats["total_searches"], int64(0))
}

// TestHNSWContextCancellation tests context cancellation in HNSW operations
func TestHNSWContextCancellation(t *testing.T) {
	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             50,
		EfConstruction: 50,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      128,
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	// Test cancelled context during vector addition
	cancelledCtx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	vector := generateTestVectors(1, 128)[0]
	metadata := map[string]interface{}{"id": 0}

	_, err := index.AddVector(cancelledCtx, vector, metadata)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "context cancelled")

	// Test cancelled context during search
	ctx := context.Background()
	_, err = index.AddVector(ctx, vector, metadata) // Add one vector first
	require.NoError(t, err)

	_, err = index.SearchKNN(cancelledCtx, vector, 1)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "context cancelled")
}

// TestDistanceFunctions tests different distance functions
func TestDistanceFunctions(t *testing.T) {
	vector1 := []float32{1.0, 0.0, 0.0}
	vector2 := []float32{0.0, 1.0, 0.0}
	vector3 := []float32{1.0, 0.0, 0.0} // Same as vector1

	// Test cosine similarity
	dist12 := CosineSimilarity(vector1, vector2)
	dist13 := CosineSimilarity(vector1, vector3)

	assert.Greater(t, dist12, dist13, "Distance between different vectors should be greater")
	assert.InDelta(t, 0.0, dist13, 0.001, "Distance between identical vectors should be 0")

	// Test Euclidean distance
	eucDist12 := EuclideanDistance(vector1, vector2)
	eucDist13 := EuclideanDistance(vector1, vector3)

	assert.Greater(t, eucDist12, eucDist13, "Euclidean distance between different vectors should be greater")
	assert.InDelta(t, 0.0, eucDist13, 0.001, "Euclidean distance between identical vectors should be 0")
}

// Helper functions

// generateTestVectors generates random test vectors
func generateTestVectors(count, dim int) [][]float32 {
	vectors := make([][]float32, count)
	for i := 0; i < count; i++ {
		vector := make([]float32, dim)
		for j := 0; j < dim; j++ {
			vector[j] = rand.Float32()*2 - 1 // Random values between -1 and 1
		}
		vectors[i] = vector
	}
	return vectors
}

// generateTestDocuments generates test RAG documents
func generateTestDocuments(count, embeddingDim int) []*RAGDocument {
	docs := make([]*RAGDocument, count)
	for i := 0; i < count; i++ {
		embedding := make([]float64, embeddingDim)
		for j := 0; j < embeddingDim; j++ {
			embedding[j] = rand.Float64()*2 - 1
		}

		docs[i] = &RAGDocument{
			ID:          fmt.Sprintf("test_doc_%d", i),
			Title:       fmt.Sprintf("Test Document %d", i),
			Content:     fmt.Sprintf("This is test document content %d", i),
			ServiceType: "test",
			Embedding:   embedding,
			IndexedAt:   time.Now(),
		}
	}
	return docs
}

// BenchmarkHNSWSearch benchmarks HNSW search performance
func BenchmarkHNSWSearch(b *testing.B) {
	config := &HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             100,
		EfConstruction: 100,
		ML:             1.0 / 0.693147,
		DistanceFunc:   CosineSimilarity,
		VectorDim:      768,
	}

	index := NewHNSWIndex(config)
	defer index.Close()

	ctx := context.Background()

	// Add vectors for benchmarking
	vectors := generateTestVectors(1000, 768)
	for i, vector := range vectors {
		metadata := map[string]interface{}{"id": i}
		_, err := index.AddVector(ctx, vector, metadata)
		if err != nil {
			b.Fatal(err)
		}
	}

	// Benchmark search
	queryVector := vectors[0]

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := index.SearchKNN(ctx, queryVector, 10)
		if err != nil {
			b.Fatal(err)
		}
	}
}

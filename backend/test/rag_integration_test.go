package test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/rag"
	"selly-backend/pkg/types"
)

// TestRAGFullPipelineIntegration tests the complete RAG pipeline from indexing to retrieval
func TestRAGFullPipelineIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup Redis client for testing
	redisClient := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379", // Use test Redis instance
		Password: "",
		DB:       1, // Use separate DB for testing
	})

	// Clean up before test
	defer redisClient.FlushDB(context.Background())

	// Create RAG service
	ragService := rag.NewRedisRAGService(redisClient)

	// Initialize service
	ctx := context.Background()
	err := ragService.Initialize(ctx)
	require.NoError(t, err, "Failed to initialize RAG service")
	defer ragService.Close()

	t.Run("IndexAndRetrieveDocument", func(t *testing.T) {
		// Create test document
		testDoc := &rag.RAGDocument{
			ID:          "test_doc_1",
			Content:     "cara membuat akta kelahiran untuk bayi baru lahir di Indonesia",
			Title:       "Panduan Pembuatan Akta Kelahiran",
			ServiceType: string(types.ServiceTypeAktaKelahiran),
			Keywords:    []string{"akta", "kelahiran", "bayi", "pembuatan"},
			Metadata: map[string]string{
				"category":    "public_service",
				"difficulty":  "medium",
				"last_update": "2025-01-01",
			},
		}

		// Index document
		startTime := time.Now()
		err := ragService.IndexDocument(ctx, testDoc)
		indexingDuration := time.Since(startTime)
		require.NoError(t, err, "Failed to index document")

		t.Logf("Document indexed in %v", indexingDuration)

		// Wait for indexing to complete (Redis operations are async)
		time.Sleep(100 * time.Millisecond)

		// Test retrieval with exact query
		searchQuery := "cara membuat akta kelahiran"
		results, err := ragService.SearchSimilar(ctx, searchQuery, 5)
		require.NoError(t, err, "Failed to search documents")

		// Validate results
		assert.Greater(t, len(results.Documents), 0, "Should find at least one document")
		assert.Greater(t, len(results.Scores), 0, "Should have similarity scores")

		if len(results.Documents) > 0 {
			topDoc := results.Documents[0]
			assert.Equal(t, testDoc.ID, topDoc.ID, "Top result should be the indexed document")
			assert.Equal(t, testDoc.ServiceType, topDoc.ServiceType, "Service type should match")

			if len(results.Scores) > 0 {
				assert.Greater(t, results.Scores[0], 0.0, "Similarity score should be positive")
				t.Logf("Top document score: %.4f", results.Scores[0])
			}
		}

		t.Logf("Search completed in %v, found %d documents",
			results.QueryTime, len(results.Documents))
	})

	t.Run("BatchDocumentProcessing", func(t *testing.T) {
		// Create multiple test documents
		documents := []*rag.RAGDocument{
			{
				ID:          "batch_doc_1",
				Content:     "persyaratan pembuatan kartu tanda penduduk KTP elektronik",
				Title:       "Persyaratan KTP Elektronik",
				ServiceType: string(types.ServiceTypeUnknown),
				Keywords:    []string{"ktp", "elektronik", "persyaratan"},
			},
			{
				ID:          "batch_doc_2",
				Content:     "prosedur perpanjangan Surat Izin Mengemudi SIM",
				Title:       "Perpanjangan SIM",
				ServiceType: string(types.ServiceTypeUnknown),
				Keywords:    []string{"sim", "perpanjangan", "prosedur"},
			},
			{
				ID:          "batch_doc_3",
				Content:     "cara mengurus akta kematian secara online",
				Title:       "Akta Kematian Online",
				ServiceType: string(types.ServiceTypeAktaKematian),
				Keywords:    []string{"akta", "kematian", "online"},
			},
		}

		// Index all documents
		for _, doc := range documents {
			err := ragService.IndexDocument(ctx, doc)
			require.NoError(t, err, "Failed to index document %s", doc.ID)
		}

		// Wait for indexing
		time.Sleep(200 * time.Millisecond)

		// Test batch search
		batchQueries := []string{
			"persyaratan ktp",
			"perpanjang sim",
			"akta kematian online",
		}

		for i, query := range batchQueries {
			results, err := ragService.SearchSimilar(ctx, query, 3)
			require.NoError(t, err, "Failed to search for query: %s", query)

			assert.Greater(t, len(results.Documents), 0,
				"Should find documents for query: %s", query)

			if len(results.Documents) > 0 {
				expectedDocID := documents[i].ID
				found := false
				for _, doc := range results.Documents {
					if doc.ID == expectedDocID {
						found = true
						break
					}
				}
				assert.True(t, found,
					"Expected document %s should be in results for query: %s",
					expectedDocID, query)
			}

			t.Logf("Query '%s' found %d documents in %v",
				query, len(results.Documents), results.QueryTime)
		}
	})

	t.Run("CacheIntegration", func(t *testing.T) {
		// Test caching functionality
		cacheQuery := "test cache query unique"

		// First search (should miss cache)
		startTime := time.Now()
		results1, err := ragService.SearchSimilar(ctx, cacheQuery, 5)
		firstSearchTime := time.Since(startTime)
		require.NoError(t, err)

		// Second search (should hit cache)
		startTime = time.Now()
		results2, err := ragService.SearchSimilar(ctx, cacheQuery, 5)
		secondSearchTime := time.Since(startTime)
		require.NoError(t, err)

		// Cache hit should be faster
		assert.True(t, secondSearchTime < firstSearchTime,
			"Cached search should be faster than first search")

		// Results should be identical
		assert.Equal(t, len(results1.Documents), len(results2.Documents),
			"Results count should be identical")
		assert.True(t, results2.CacheHit, "Second search should be a cache hit")

		t.Logf("Cache test: first=%v, second=%v, speedup=%.2fx",
			firstSearchTime, secondSearchTime,
			float64(firstSearchTime)/float64(secondSearchTime))
	})

	t.Run("ErrorHandling", func(t *testing.T) {
		// Test error scenarios
		t.Run("EmptyQuery", func(t *testing.T) {
			results, err := ragService.SearchSimilar(ctx, "", 5)
			// Should handle empty query gracefully
			assert.NoError(t, err, "Empty query should not cause error")
			assert.NotNil(t, results, "Should return valid results structure")
		})

		t.Run("LargeLimit", func(t *testing.T) {
			results, err := ragService.SearchSimilar(ctx, "test query", 1000)
			assert.NoError(t, err, "Large limit should not cause error")
			assert.NotNil(t, results, "Should return valid results structure")
		})

		t.Run("ContextCancellation", func(t *testing.T) {
			cancelCtx, cancel := context.WithCancel(ctx)
			cancel() // Cancel immediately

			results, err := ragService.SearchSimilar(cancelCtx, "test query", 5)
			// Should handle cancellation gracefully
			assert.Error(t, err, "Cancelled context should cause error")
			assert.Nil(t, results, "Should not return results for cancelled context")
		})
	})
}

// TestRAGPerformanceBenchmarks provides performance benchmarks for RAG operations
func TestRAGPerformanceBenchmarks(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance benchmarks in short mode")
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       2, // Separate DB for benchmarks
	})
	defer redisClient.FlushDB(context.Background())

	ragService := rag.NewRedisRAGService(redisClient)
	ctx := context.Background()

	err := ragService.Initialize(ctx)
	require.NoError(t, err)
	defer ragService.Close()

	// Setup test data
	testDocuments := createBenchmarkDocuments(50)
	for _, doc := range testDocuments {
		err := ragService.IndexDocument(ctx, doc)
		require.NoError(t, err)
	}

	time.Sleep(500 * time.Millisecond) // Wait for indexing

	t.Run("SearchLatencyBenchmark", func(t *testing.T) {
		queries := []string{
			"cara membuat akta kelahiran",
			"persyaratan ktp elektronik",
			"prosedur akta kematian",
			"cara perpanjang sim",
		}

		totalTime := time.Duration(0)
		totalQueries := 0

		for i := 0; i < 10; i++ { // 10 iterations
			for _, query := range queries {
				startTime := time.Now()
				results, err := ragService.SearchSimilar(ctx, query, 5)
				duration := time.Since(startTime)

				require.NoError(t, err)
				assert.Greater(t, len(results.Documents), 0, "Should find documents")

				totalTime += duration
				totalQueries++

				// Each query should complete within 100ms
				assert.Less(t, duration, 100*time.Millisecond,
					"Query should complete within 100ms, took %v", duration)
			}
		}

		avgTime := totalTime / time.Duration(totalQueries)
		t.Logf("Average search latency: %v over %d queries", avgTime, totalQueries)
		assert.Less(t, avgTime, 50*time.Millisecond, "Average latency should be under 50ms")
	})

	t.Run("ConcurrentSearchBenchmark", func(t *testing.T) {
		numGoroutines := 10
		queriesPerGoroutine := 5
		results := make(chan time.Duration, numGoroutines*queriesPerGoroutine)

		// Launch concurrent searches
		for i := 0; i < numGoroutines; i++ {
			go func(goroutineID int) {
				for j := 0; j < queriesPerGoroutine; j++ {
					query := fmt.Sprintf("concurrent test query %d-%d", goroutineID, j)
					startTime := time.Now()

					searchResults, err := ragService.SearchSimilar(ctx, query, 3)
					duration := time.Since(startTime)

					if err == nil && len(searchResults.Documents) > 0 {
						results <- duration
					} else {
						results <- time.Duration(0) // Failed query
					}
				}
			}(i)
		}

		// Collect results
		totalDuration := time.Duration(0)
		validResults := 0

		for i := 0; i < numGoroutines*queriesPerGoroutine; i++ {
			duration := <-results
			if duration > 0 {
				totalDuration += duration
				validResults++
			}
		}

		close(results)

		if validResults > 0 {
			avgDuration := totalDuration / time.Duration(validResults)
			t.Logf("Concurrent search: %d valid results, average latency: %v",
				validResults, avgDuration)

			// Under concurrent load, average should still be reasonable
			assert.Less(t, avgDuration, 200*time.Millisecond,
				"Concurrent search should be under 200ms average")
		}
	})

	t.Run("MemoryUsageBenchmark", func(t *testing.T) {
		// This would integrate with memory monitoring
		// For now, just test that service doesn't crash under load
		for i := 0; i < 100; i++ {
			query := fmt.Sprintf("memory test query %d", i)
			results, err := ragService.SearchSimilar(ctx, query, 5)
			require.NoError(t, err)
			assert.NotNil(t, results)
		}

		t.Log("Memory stress test completed without errors")
	})
}

// createBenchmarkDocuments creates test documents for benchmarking
func createBenchmarkDocuments(count int) []*rag.RAGDocument {
	documents := make([]*rag.RAGDocument, count)

	serviceTypes := []string{"akta_kelahiran", "ktp", "sim", "akta_kematian", "kk"}
	templates := []string{
		"cara membuat %s untuk warga Indonesia",
		"persyaratan pembuatan %s",
		"prosedur %s secara online",
		"dokumen yang diperlukan untuk %s",
		"biaya pembuatan %s",
	}

	for i := 0; i < count; i++ {
		serviceType := serviceTypes[i%len(serviceTypes)]
		template := templates[i%len(templates)]

		content := fmt.Sprintf(template, serviceType)
		documents[i] = &rag.RAGDocument{
			ID:          fmt.Sprintf("bench_doc_%d", i),
			Content:     content,
			Title:       fmt.Sprintf("Benchmark Document %d", i),
			ServiceType: serviceType,
			Keywords:    []string{serviceType, "benchmark"},
			Metadata: map[string]string{
				"benchmark": "true",
				"index":     fmt.Sprintf("%d", i),
			},
		}
	}

	return documents
}

// TestRAGServiceHealthCheck tests service health and connectivity
func TestRAGServiceHealthCheck(t *testing.T) {
	redisClient := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       3, // Separate DB for health checks
	})
	defer redisClient.FlushDB(context.Background())

	ragService := rag.NewRedisRAGService(redisClient)
	ctx := context.Background()

	t.Run("ServiceInitialization", func(t *testing.T) {
		err := ragService.Initialize(ctx)
		assert.NoError(t, err, "Service should initialize successfully")

		if err == nil {
			defer ragService.Close()

			stats := ragService.GetStats()
			assert.True(t, stats.IsInitialized, "Service should report as initialized")
			assert.NotEmpty(t, stats.IndexName, "Index name should be set")
		}
	})

	t.Run("RedisConnectivity", func(t *testing.T) {
		err := ragService.Initialize(ctx)
		require.NoError(t, err)
		defer ragService.Close()

		// Test basic Redis connectivity through service
		testDoc := &rag.RAGDocument{
			ID:          "health_check_doc",
			Content:     "health check test document",
			ServiceType: string(types.ServiceTypeUnknown),
		}

		err = ragService.IndexDocument(ctx, testDoc)
		assert.NoError(t, err, "Should be able to index document (tests Redis connectivity)")
	})

	t.Run("ComponentAvailability", func(t *testing.T) {
		err := ragService.Initialize(ctx)
		require.NoError(t, err)
		defer ragService.Close()

		// Test component access
		embeddingSvc := ragService.GetEmbeddingService()
		assert.NotNil(t, embeddingSvc, "Embedding service should be available")

		cacheOptimizer := ragService.GetCacheOptimizer()
		assert.NotNil(t, cacheOptimizer, "Cache optimizer should be available")

		vectorOps := ragService.GetVectorOperations()
		assert.NotNil(t, vectorOps, "Vector operations should be available")
	})
}
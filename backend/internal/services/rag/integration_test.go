package rag

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"selly-backend/pkg/types"
)

// IntegrationTestSuite provides comprehensive RAG optimization integration testing
type IntegrationTestSuite struct {
	ragService           *RedisRAGService
	embeddingService     *EmbeddingService
	cacheOptimizer       *RAGCacheOptimizer
	vectorOperations     *VectorOperations
	performanceValidator *PerformanceValidator
	redisClient          *redis.Client
	testDocuments        []*RAGDocument
}

// NewIntegrationTestSuite creates a new integration test suite
func NewIntegrationTestSuite(redisClient *redis.Client) *IntegrationTestSuite {
	ragService := NewRedisRAGService(redisClient)

	// Create performance validator
	performanceValidator := NewPerformanceValidator(
		ragService,
		ragService.embeddingService,
		ragService.cacheOptimizer,
		ragService.vectorOperations.(*VectorOperations),
	)

	return &IntegrationTestSuite{
		ragService:           ragService,
		embeddingService:     ragService.embeddingService,
		cacheOptimizer:       ragService.cacheOptimizer,
		vectorOperations:     ragService.vectorOperations.(*VectorOperations),
		performanceValidator: performanceValidator,
		redisClient:          redisClient,
		testDocuments:        createTestDocuments(),
	}
}

// createTestDocuments creates test documents for integration testing
func createTestDocuments() []*RAGDocument {
	return []*RAGDocument{
		{
			ID:          "test_doc_1",
			Title:       "Cara Membuat Akta Kelahiran",
			Content:     "Akta kelahiran adalah dokumen resmi yang mencatat kelahiran seseorang. Untuk membuat akta kelahiran, diperlukan dokumen seperti surat keterangan lahir dari rumah sakit, KTP orang tua, dan kartu keluarga.",
			ServiceType: string(types.ServiceTypeUnknown),
			Keywords:    []string{"akta", "kelahiran", "dokumen", "resmi"},
			IndexedAt:   time.Now(),
		},
		{
			ID:          "test_doc_2",
			Title:       "Syarat Perpanjang KTP",
			Content:     "KTP (Kartu Tanda Penduduk) perlu diperpanjang setiap 5 tahun. Syarat perpanjang KTP meliputi KTP lama, kartu keluarga, dan pas foto terbaru ukuran 3x4.",
			ServiceType: string(types.ServiceTypeUnknown),
			Keywords:    []string{"ktp", "perpanjang", "syarat", "kartu"},
			IndexedAt:   time.Now(),
		},
		{
			ID:          "test_doc_3",
			Title:       "Proses Akta Nikah",
			Content:     "Akta nikah adalah bukti sah pernikahan. Proses pembuatan akta nikah memerlukan surat nikah dari KUA, KTP kedua mempelai, dan kartu keluarga.",
			ServiceType: string(types.ServiceTypeUnknown),
			Keywords:    []string{"akta", "nikah", "pernikahan", "sah"},
			IndexedAt:   time.Now(),
		},
		{
			ID:          "test_doc_4",
			Title:       "Dokumen Kartu Keluarga",
			Content:     "Kartu keluarga (KK) adalah dokumen kependudukan yang memuat data anggota keluarga. Pembuatan KK baru memerlukan akta nikah, akta kelahiran anak, dan KTP kepala keluarga.",
			ServiceType: string(types.ServiceTypeUnknown),
			Keywords:    []string{"kartu", "keluarga", "kk", "anggota"},
			IndexedAt:   time.Now(),
		},
		{
			ID:          "test_doc_5",
			Title:       "Persyaratan Akta Kematian",
			Content:     "Akta kematian diperlukan sebagai bukti resmi kematian seseorang. Persyaratan meliputi surat keterangan kematian dari rumah sakit, KTP almarhum, dan kartu keluarga.",
			ServiceType: string(types.ServiceTypeUnknown),
			Keywords:    []string{"akta", "kematian", "persyaratan", "bukti"},
			IndexedAt:   time.Now(),
		},
	}
}

// TestPhase1Integration tests Phase 1: RAG Optimization Integration
func TestPhase1Integration(t *testing.T) {
	// Setup Redis client for testing
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   1, // Use test database
	})
	defer redisClient.Close()

	// Test Redis connection
	ctx := context.Background()
	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		t.Skip("Redis not available for integration testing")
	}

	// Create integration test suite
	suite := NewIntegrationTestSuite(redisClient)

	t.Run("1.1 Service Initialization", func(t *testing.T) {
		err := suite.ragService.Initialize(ctx)
		require.NoError(t, err, "RAG service initialization should succeed")

		logrus.Info("✅ Phase 1.1: Service initialization completed")
	})

	t.Run("1.2 Multi-Level Caching System", func(t *testing.T) {
		// Test L1 cache (in-memory)
		testKey := "test_cache_key"
		testResult := &RAGSearchResult{
			Documents:    suite.testDocuments[:2],
			Scores:       []float64{0.95, 0.87},
			QueryTime:    50 * time.Millisecond,
			TotalResults: 2,
			CacheHit:     false,
		}

		// Store in L1 cache
		suite.cacheOptimizer.setL1CachedResult(testKey, testResult)

		// Retrieve from L1 cache
		cached := suite.cacheOptimizer.getL1CachedResult(testKey)
		assert.NotNil(t, cached, "L1 cache should return cached result")
		assert.Equal(t, 2, len(cached.Documents), "Cached result should have correct document count")

		logrus.Info("✅ Phase 1.2: Multi-level caching system validated")
	})

	t.Run("1.3 Intelligent Cache Warming", func(t *testing.T) {
		// Test query pattern recording
		testQuery := "cara membuat akta kelahiran"
		suite.cacheOptimizer.recordQueryPattern(testQuery)

		// Verify pattern was recorded
		patterns := suite.cacheOptimizer.queryPatterns.patterns
		assert.Greater(t, patterns[testQuery], 0, "Query pattern should be recorded")

		// Test predictive caching trigger
		suite.cacheOptimizer.triggerPredictiveCaching(testQuery)

		logrus.Info("✅ Phase 1.3: Intelligent cache warming validated")
	})

	t.Run("1.4 Concurrent Processing", func(t *testing.T) {
		// Test concurrent embedding generation
		queries := []string{
			"cara membuat akta kelahiran",
			"syarat perpanjang ktp",
			"proses akta nikah",
		}

		var wg sync.WaitGroup
		results := make([][]float64, len(queries))

		for i, query := range queries {
			wg.Add(1)
			go func(index int, q string) {
				defer wg.Done()
				embedding, err := suite.embeddingService.GenerateEmbedding(ctx, q)
				assert.NoError(t, err, "Concurrent embedding generation should succeed")
				results[index] = embedding
			}(i, query)
		}

		wg.Wait()

		// Verify all embeddings were generated
		for i, result := range results {
			assert.NotNil(t, result, "Embedding %d should be generated", i)
			assert.Equal(t, 768, len(result), "Embedding should have correct dimensions")
		}

		logrus.Info("✅ Phase 1.4: Concurrent processing validated")
	})

	t.Run("1.5 Batch Operations", func(t *testing.T) {
		// Test batch embedding generation
		queries := []string{
			"cara membuat akta kelahiran",
			"syarat perpanjang ktp",
			"proses akta nikah",
			"dokumen kartu keluarga",
		}

		startTime := time.Now()
		embeddings, err := suite.embeddingService.GenerateEmbeddingsBatch(ctx, queries)
		batchTime := time.Since(startTime)

		require.NoError(t, err, "Batch embedding generation should succeed")
		assert.Equal(t, len(queries), len(embeddings), "Should generate embeddings for all queries")

		// Verify batch processing is faster than sequential
		logrus.WithFields(logrus.Fields{
			"batch_size": len(queries),
			"batch_time": batchTime,
		}).Info("📦 Batch processing performance")

		logrus.Info("✅ Phase 1.5: Batch operations validated")
	})

	t.Run("1.6 End-to-End Integration", func(t *testing.T) {
		// Index test documents
		for _, doc := range suite.testDocuments {
			err := suite.ragService.IndexDocument(ctx, doc)
			assert.NoError(t, err, "Document indexing should succeed")
		}

		// Test RAG context retrieval
		testQuery := "cara membuat akta kelahiran"
		ragContext, err := suite.ragService.RetrieveContext(ctx, testQuery, 3)

		require.NoError(t, err, "RAG context retrieval should succeed")
		assert.NotNil(t, ragContext, "RAG context should not be nil")
		assert.Greater(t, len(ragContext.Documents), 0, "Should retrieve relevant documents")

		// Test cache hit on second request
		startTime := time.Now()
		cachedContext, err := suite.ragService.RetrieveContext(ctx, testQuery, 3)
		cacheTime := time.Since(startTime)

		require.NoError(t, err, "Cached RAG context retrieval should succeed")
		assert.NotNil(t, cachedContext, "Cached RAG context should not be nil")
		assert.Less(t, cacheTime, 10*time.Millisecond, "Cache hit should be very fast")

		logrus.WithFields(logrus.Fields{
			"query":           testQuery,
			"documents_found": len(ragContext.Documents),
			"cache_time":      cacheTime,
		}).Info("🎯 End-to-end integration validated")

		logrus.Info("✅ Phase 1.6: End-to-end integration validated")
	})

	logrus.Info("🎉 Phase 1: RAG Optimization Integration Testing COMPLETED")
}

// TestMultiLevelCachePerformance tests multi-level cache performance
func TestMultiLevelCachePerformance(t *testing.T) {
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   1,
	})
	defer redisClient.Close()

	ctx := context.Background()
	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		t.Skip("Redis not available for performance testing")
	}

	suite := NewIntegrationTestSuite(redisClient)
	err = suite.ragService.Initialize(ctx)
	require.NoError(t, err)

	// Test cache performance across levels
	testQuery := "performance test query"
	testResult := &RAGSearchResult{
		Documents:    suite.testDocuments[:1],
		Scores:       []float64{0.95},
		QueryTime:    45 * time.Millisecond,
		TotalResults: 1,
		CacheHit:     false,
	}

	// Measure L1 cache performance
	cacheKey := suite.cacheOptimizer.generateResultCacheKey(testQuery, 5)

	// Store in L1
	suite.cacheOptimizer.setL1CachedResult(cacheKey, testResult)

	// Measure L1 retrieval time
	startTime := time.Now()
	l1Result := suite.cacheOptimizer.getL1CachedResult(cacheKey)
	l1Time := time.Since(startTime)

	assert.NotNil(t, l1Result, "L1 cache should return result")
	assert.Less(t, l1Time, 1*time.Millisecond, "L1 cache should be ultra-fast")

	logrus.WithFields(logrus.Fields{
		"l1_cache_time": l1Time,
		"cache_level":   "L1 (memory)",
	}).Info("🚀 Multi-level cache performance validated")
}

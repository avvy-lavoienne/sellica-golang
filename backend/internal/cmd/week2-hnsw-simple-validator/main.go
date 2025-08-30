package main

import (
	"context"
	"flag"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/rag"
)

// Week2SimpleValidator validates HNSW performance without Redis dependency
type Week2SimpleValidator struct {
	vectorCount int
	searchCount int
}

// ValidationResult represents validation results
type ValidationResult struct {
	TestName              string        `json:"test_name"`
	VectorCount           int           `json:"vector_count"`
	SearchCount           int           `json:"search_count"`
	IndexingTime          time.Duration `json:"indexing_time"`
	TotalSearchTime       time.Duration `json:"total_search_time"`
	AverageSearchTimeMs   float64       `json:"average_search_time_ms"`
	SearchThroughputRPS   float64       `json:"search_throughput_rps"`
	PerformanceTarget     bool          `json:"performance_target_met"`
	ErrorCount            int           `json:"error_count"`
}

func main() {
	// Command line flags
	var (
		vectorCount = flag.Int("vectors", 1000, "Number of vectors to index")
		searchCount = flag.Int("searches", 500, "Number of searches to perform")
		verbose     = flag.Bool("verbose", false, "Verbose logging")
	)
	flag.Parse()

	// Configure logging
	if *verbose {
		logrus.SetLevel(logrus.DebugLevel)
	} else {
		logrus.SetLevel(logrus.InfoLevel)
	}

	fmt.Println(strings.Repeat("=", 80))
	fmt.Println("WEEK 2: HNSW VECTOR SEARCH PERFORMANCE VALIDATION")
	fmt.Println(strings.Repeat("=", 80))

	logrus.WithFields(logrus.Fields{
		"vector_count": *vectorCount,
		"search_count": *searchCount,
	}).Info("Starting Week 2 HNSW validation")

	// Create validator
	validator := &Week2SimpleValidator{
		vectorCount: *vectorCount,
		searchCount: *searchCount,
	}

	// Run validation tests
	results := []ValidationResult{
		validator.runHNSWIndexTest(),
		validator.runHNSWSearchTest(),
		validator.runConcurrentSearchTest(),
	}

	// Print results
	validator.printResults(results)

	// Determine overall success
	success := validator.evaluateResults(results)
	if success {
		fmt.Println("✅ Week 2: HNSW Vector Search Optimization PASSED")
	} else {
		fmt.Println("❌ Week 2: HNSW Vector Search Optimization FAILED")
	}
}

// runHNSWIndexTest tests HNSW indexing performance
func (v *Week2SimpleValidator) runHNSWIndexTest() ValidationResult {
	logrus.Info("🧪 Running HNSW index performance test...")

	// Create HNSW index
	config := &rag.HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             200,
		EfConstruction: 200,
		ML:             1.0 / 0.693147,
		DistanceFunc:   rag.CosineSimilarity,
		VectorDim:      768,
	}

	index := rag.NewHNSWIndex(config)
	defer index.Close()

	ctx := context.Background()
	result := ValidationResult{
		TestName:    "HNSW Index Performance",
		VectorCount: v.vectorCount,
	}

	// Generate test vectors
	vectors := v.generateTestVectors(v.vectorCount, 768)

	// Index vectors
	indexingStart := time.Now()
	successCount := 0

	for i, vector := range vectors {
		metadata := map[string]interface{}{
			"id":    i,
			"label": "test_vector",
		}

		_, err := index.AddVector(ctx, vector, metadata)
		if err != nil {
			result.ErrorCount++
			logrus.WithError(err).Debug("Failed to add vector")
		} else {
			successCount++
		}
	}

	result.IndexingTime = time.Since(indexingStart)
	avgIndexingTime := float64(result.IndexingTime.Nanoseconds()) / float64(successCount) / 1e6

	logrus.WithFields(logrus.Fields{
		"indexed_vectors":    successCount,
		"total_time":         result.IndexingTime,
		"avg_indexing_ms":    avgIndexingTime,
		"errors":             result.ErrorCount,
	}).Info("HNSW indexing test completed")

	// Performance target: <20ms per vector indexing
	result.PerformanceTarget = avgIndexingTime < 20.0

	return result
}

// runHNSWSearchTest tests HNSW search performance
func (v *Week2SimpleValidator) runHNSWSearchTest() ValidationResult {
	logrus.Info("🧪 Running HNSW search performance test...")

	// Create and populate HNSW index
	config := &rag.HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             200,
		EfConstruction: 200,
		ML:             1.0 / 0.693147,
		DistanceFunc:   rag.CosineSimilarity,
		VectorDim:      768,
	}

	index := rag.NewHNSWIndex(config)
	defer index.Close()

	ctx := context.Background()
	result := ValidationResult{
		TestName:    "HNSW Search Performance",
		SearchCount: v.searchCount,
	}

	// Add vectors to index first
	vectors := v.generateTestVectors(1000, 768) // Use 1000 vectors for search base
	for i, vector := range vectors {
		metadata := map[string]interface{}{
			"id": i,
		}
		index.AddVector(ctx, vector, metadata)
	}

	// Generate query vectors
	queryVectors := v.generateTestVectors(v.searchCount, 768)

	// Perform searches
	searchStart := time.Now()
	successCount := 0

	for _, queryVector := range queryVectors {
		_, err := index.SearchKNN(ctx, queryVector, 10)
		if err != nil {
			result.ErrorCount++
			logrus.WithError(err).Debug("Search failed")
		} else {
			successCount++
		}
	}

	result.TotalSearchTime = time.Since(searchStart)
	result.AverageSearchTimeMs = float64(result.TotalSearchTime.Nanoseconds()) / float64(successCount) / 1e6
	result.SearchThroughputRPS = float64(successCount) / result.TotalSearchTime.Seconds()

	logrus.WithFields(logrus.Fields{
		"successful_searches": successCount,
		"total_time":          result.TotalSearchTime,
		"avg_search_ms":       result.AverageSearchTimeMs,
		"throughput_rps":      result.SearchThroughputRPS,
		"errors":              result.ErrorCount,
	}).Info("HNSW search performance test completed")

	// Performance target: <50ms per search
	result.PerformanceTarget = result.AverageSearchTimeMs < 50.0

	return result
}

// runConcurrentSearchTest tests concurrent search performance
func (v *Week2SimpleValidator) runConcurrentSearchTest() ValidationResult {
	logrus.Info("🧪 Running concurrent search performance test...")

	// Create HNSW index with concurrent search
	config := &rag.HNSWConfig{
		MaxM:           16,
		MaxM0:          32,
		Ef:             200,
		EfConstruction: 200,
		ML:             1.0 / 0.693147,
		DistanceFunc:   rag.CosineSimilarity,
		VectorDim:      768,
	}

	index := rag.NewHNSWIndex(config)
	defer index.Close()

	searchConfig := &rag.ConcurrentSearchConfig{
		WorkerPoolSize:    8,
		CacheSize:         1000,
		CacheTTL:          5 * time.Minute,
		BatchSize:         10,
		SearchTimeout:     5 * time.Second,
		EnablePrefetching: true,
	}

	concurrentSearch := rag.NewConcurrentVectorSearch(index, searchConfig)
	defer concurrentSearch.Close()

	ctx := context.Background()
	result := ValidationResult{
		TestName:    "Concurrent Search Performance",
		SearchCount: v.searchCount,
	}

	// Add vectors to index
	vectors := v.generateTestVectors(1000, 768)
	for i, vector := range vectors {
		metadata := map[string]interface{}{
			"id": i,
		}
		index.AddVector(ctx, vector, metadata)
	}

	// Generate query vectors
	queryVectors := v.generateTestVectors(v.searchCount, 768)

	// Perform concurrent searches
	searchStart := time.Now()
	successCount := 0

	for _, queryVector := range queryVectors {
		_, err := concurrentSearch.SearchSimilarConcurrent(ctx, queryVector, 10)
		if err != nil {
			result.ErrorCount++
			logrus.WithError(err).Debug("Concurrent search failed")
		} else {
			successCount++
		}
	}

	result.TotalSearchTime = time.Since(searchStart)
	result.AverageSearchTimeMs = float64(result.TotalSearchTime.Nanoseconds()) / float64(successCount) / 1e6
	result.SearchThroughputRPS = float64(successCount) / result.TotalSearchTime.Seconds()

	logrus.WithFields(logrus.Fields{
		"successful_searches": successCount,
		"total_time":          result.TotalSearchTime,
		"avg_search_ms":       result.AverageSearchTimeMs,
		"throughput_rps":      result.SearchThroughputRPS,
		"errors":              result.ErrorCount,
	}).Info("Concurrent search performance test completed")

	// Performance target: <30ms per search (better than single-threaded)
	result.PerformanceTarget = result.AverageSearchTimeMs < 30.0

	return result
}

// generateTestVectors generates random test vectors
func (v *Week2SimpleValidator) generateTestVectors(count, dim int) [][]float32 {
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

// printResults prints validation results
func (v *Week2SimpleValidator) printResults(results []ValidationResult) {
	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Println("WEEK 2: HNSW VECTOR SEARCH OPTIMIZATION RESULTS")
	fmt.Println(strings.Repeat("=", 80))

	for _, result := range results {
		fmt.Printf("\n📊 %s\n", result.TestName)

		if result.VectorCount > 0 {
			fmt.Printf("   Vectors Indexed: %d\n", result.VectorCount)
			fmt.Printf("   Indexing Time: %v\n", result.IndexingTime)
			if result.IndexingTime > 0 {
				avgIndexing := float64(result.IndexingTime.Nanoseconds()) / float64(result.VectorCount) / 1e6
				fmt.Printf("   Average Indexing Time: %.2f ms per vector\n", avgIndexing)
			}
		}

		if result.SearchCount > 0 {
			fmt.Printf("   Searches Performed: %d\n", result.SearchCount)
			fmt.Printf("   Total Search Time: %v\n", result.TotalSearchTime)
			fmt.Printf("   Average Search Time: %.2f ms\n", result.AverageSearchTimeMs)
			fmt.Printf("   Search Throughput: %.2f RPS\n", result.SearchThroughputRPS)
		}

		fmt.Printf("   Errors: %d\n", result.ErrorCount)
		fmt.Printf("   Performance Target: %v\n", result.PerformanceTarget)

		if result.PerformanceTarget {
			fmt.Printf("   Status: ✅ PASSED\n")
		} else {
			fmt.Printf("   Status: ❌ FAILED\n")
		}
	}

	fmt.Println("\n" + strings.Repeat("=", 80))
}

// evaluateResults evaluates overall success
func (v *Week2SimpleValidator) evaluateResults(results []ValidationResult) bool {
	allPassed := true

	for _, result := range results {
		if !result.PerformanceTarget {
			logrus.WithField("test", result.TestName).Error("Performance target not met")
			allPassed = false
		}
		if result.ErrorCount > result.SearchCount/10 { // Allow up to 10% errors
			logrus.WithFields(logrus.Fields{
				"test":        result.TestName,
				"error_count": result.ErrorCount,
			}).Error("Too many errors")
			allPassed = false
		}
	}

	return allPassed
}

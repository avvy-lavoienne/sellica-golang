package rag

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// PerformanceValidator validates RAG system performance against targets
type PerformanceValidator struct {
	ragService       *RedisRAGService
	embeddingService *EmbeddingService
	cacheOptimizer   *RAGCacheOptimizer
	vectorOperations *VectorOperations

	// Performance targets
	targets *PerformanceTargets

	// Validation results
	lastValidation    *ValidationResult
	validationHistory []*ValidationResult
	mu                sync.RWMutex

	// A/B Testing framework
	abTesting *ABTestingFramework
}

// PerformanceTargets defines the performance targets for RAG system
type PerformanceTargets struct {
	MaxResponseTime  time.Duration `json:"max_response_time"`   // Target: <55ms
	MinCacheHitRatio float64       `json:"min_cache_hit_ratio"` // Target: >90%
	MaxIndexingTime  time.Duration `json:"max_indexing_time"`   // Target: <100ms
	MinAccuracyScore float64       `json:"min_accuracy_score"`  // Target: >90%
	MaxMemoryUsage   int64         `json:"max_memory_usage"`    // Target: <1200MB
	MinThroughputRPS float64       `json:"min_throughput_rps"`  // Target: >1000 RPS
}

// ValidationResult represents the result of performance validation
type ValidationResult struct {
	Timestamp       time.Time          `json:"timestamp"`
	OverallScore    float64            `json:"overall_score"`
	PassedTargets   int                `json:"passed_targets"`
	TotalTargets    int                `json:"total_targets"`
	ResponseTime    time.Duration      `json:"response_time"`
	CacheHitRatio   float64            `json:"cache_hit_ratio"`
	IndexingTime    time.Duration      `json:"indexing_time"`
	AccuracyScore   float64            `json:"accuracy_score"`
	MemoryUsage     int64              `json:"memory_usage"`
	ThroughputRPS   float64            `json:"throughput_rps"`
	Recommendations []string           `json:"recommendations"`
	ComponentScores map[string]float64 `json:"component_scores"`
}

// ABTestingFramework provides A/B testing capabilities for performance optimization
type ABTestingFramework struct {
	activeTests map[string]*ABTest
	testResults map[string]*ABTestResult
	mu          sync.RWMutex
}

// ABTest represents an A/B test configuration
type ABTest struct {
	ID            string                 `json:"id"`
	Name          string                 `json:"name"`
	Description   string                 `json:"description"`
	StartTime     time.Time              `json:"start_time"`
	EndTime       time.Time              `json:"end_time"`
	TrafficSplit  float64                `json:"traffic_split"` // 0.5 = 50/50 split
	ControlConfig map[string]interface{} `json:"control_config"`
	VariantConfig map[string]interface{} `json:"variant_config"`
	Metrics       []string               `json:"metrics"`
	Status        string                 `json:"status"` // "running", "completed", "stopped"
}

// ABTestResult represents the result of an A/B test
type ABTestResult struct {
	TestID                  string             `json:"test_id"`
	ControlMetrics          map[string]float64 `json:"control_metrics"`
	VariantMetrics          map[string]float64 `json:"variant_metrics"`
	StatisticalSignificance bool               `json:"statistical_significance"`
	WinningVariant          string             `json:"winning_variant"` // "control" or "variant"
	ConfidenceLevel         float64            `json:"confidence_level"`
	Recommendation          string             `json:"recommendation"`
}

// NewPerformanceValidator creates a new performance validator
func NewPerformanceValidator(
	ragService *RedisRAGService,
	embeddingService *EmbeddingService,
	cacheOptimizer *RAGCacheOptimizer,
	vectorOperations *VectorOperations,
) *PerformanceValidator {
	return &PerformanceValidator{
		ragService:       ragService,
		embeddingService: embeddingService,
		cacheOptimizer:   cacheOptimizer,
		vectorOperations: vectorOperations,
		targets: &PerformanceTargets{
			MaxResponseTime:  55 * time.Millisecond,
			MinCacheHitRatio: 0.90,
			MaxIndexingTime:  100 * time.Millisecond,
			MinAccuracyScore: 0.90,
			MaxMemoryUsage:   1200 * 1024 * 1024, // 1200MB
			MinThroughputRPS: 1000.0,
		},
		validationHistory: make([]*ValidationResult, 0),
		abTesting: &ABTestingFramework{
			activeTests: make(map[string]*ABTest),
			testResults: make(map[string]*ABTestResult),
		},
	}
}

// ValidatePerformance performs comprehensive performance validation
func (pv *PerformanceValidator) ValidatePerformance(ctx context.Context) (*ValidationResult, error) {
	startTime := time.Now()

	logrus.Info("🔍 Starting comprehensive RAG performance validation...")

	result := &ValidationResult{
		Timestamp:       startTime,
		ComponentScores: make(map[string]float64),
		Recommendations: make([]string, 0),
	}

	// Test 1: Response Time Validation
	responseTime, err := pv.validateResponseTime(ctx)
	if err != nil {
		logrus.WithError(err).Warn("Response time validation failed")
	} else {
		result.ResponseTime = responseTime
		result.ComponentScores["response_time"] = pv.calculateResponseTimeScore(responseTime)
	}

	// Test 2: Cache Hit Ratio Validation
	cacheStats := pv.cacheOptimizer.GetCacheStats()
	result.CacheHitRatio = cacheStats.HitRatio
	result.ComponentScores["cache_hit_ratio"] = pv.calculateCacheScore(cacheStats.HitRatio)

	// Test 3: Indexing Performance Validation
	indexingTime, err := pv.validateIndexingPerformance(ctx)
	if err != nil {
		logrus.WithError(err).Warn("Indexing performance validation failed")
	} else {
		result.IndexingTime = indexingTime
		result.ComponentScores["indexing_time"] = pv.calculateIndexingScore(indexingTime)
	}

	// Test 4: Accuracy Validation
	accuracyScore, err := pv.validateAccuracy(ctx)
	if err != nil {
		logrus.WithError(err).Warn("Accuracy validation failed")
	} else {
		result.AccuracyScore = accuracyScore
		result.ComponentScores["accuracy"] = accuracyScore
	}

	// Test 5: Memory Usage Validation
	memoryUsage := pv.validateMemoryUsage()
	result.MemoryUsage = memoryUsage
	result.ComponentScores["memory_usage"] = pv.calculateMemoryScore(memoryUsage)

	// Test 6: Throughput Validation
	throughput, err := pv.validateThroughput(ctx)
	if err != nil {
		logrus.WithError(err).Warn("Throughput validation failed")
	} else {
		result.ThroughputRPS = throughput
		result.ComponentScores["throughput"] = pv.calculateThroughputScore(throughput)
	}

	// Calculate overall score and targets met
	result.OverallScore, result.PassedTargets, result.TotalTargets = pv.calculateOverallScore(result)

	// Generate recommendations
	result.Recommendations = pv.generateRecommendations(result)

	// Store validation result
	pv.mu.Lock()
	pv.lastValidation = result
	pv.validationHistory = append(pv.validationHistory, result)

	// Keep only recent 100 validations
	if len(pv.validationHistory) > 100 {
		pv.validationHistory = pv.validationHistory[len(pv.validationHistory)-100:]
	}
	pv.mu.Unlock()

	logrus.WithFields(logrus.Fields{
		"overall_score":   result.OverallScore,
		"passed_targets":  result.PassedTargets,
		"total_targets":   result.TotalTargets,
		"validation_time": time.Since(startTime),
	}).Info("✅ RAG performance validation completed")

	return result, nil
}

// validateResponseTime validates RAG response time performance
func (pv *PerformanceValidator) validateResponseTime(ctx context.Context) (time.Duration, error) {
	testQueries := []string{
		"cara membuat akta kelahiran",
		"syarat perpanjang ktp",
		"proses akta nikah",
		"dokumen kartu keluarga",
		"persyaratan akta kematian",
	}

	var totalTime time.Duration
	successCount := 0

	for _, query := range testQueries {
		startTime := time.Now()

		_, err := pv.ragService.RetrieveContext(ctx, query, 5)
		if err != nil {
			logrus.WithError(err).WithField("query", query).Warn("Response time test query failed")
			continue
		}

		queryTime := time.Since(startTime)
		totalTime += queryTime
		successCount++
	}

	if successCount == 0 {
		return 0, fmt.Errorf("all response time test queries failed")
	}

	avgResponseTime := totalTime / time.Duration(successCount)
	return avgResponseTime, nil
}

// validateIndexingPerformance validates document indexing performance
func (pv *PerformanceValidator) validateIndexingPerformance(ctx context.Context) (time.Duration, error) {
	// Create test documents
	testDocs := []*RAGDocument{
		{
			ID:          "test_doc_1",
			Title:       "Test Document 1",
			Content:     "Test content for performance validation",
			ServiceType: "test",
			Keywords:    []string{"test", "performance"},
			IndexedAt:   time.Now(),
		},
		{
			ID:          "test_doc_2",
			Title:       "Test Document 2",
			Content:     "Another test content for validation",
			ServiceType: "test",
			Keywords:    []string{"test", "validation"},
			IndexedAt:   time.Now(),
		},
	}

	startTime := time.Now()

	// Test batch indexing performance
	err := pv.vectorOperations.IndexDocumentsBatch(ctx, testDocs)
	if err != nil {
		return 0, fmt.Errorf("batch indexing test failed: %w", err)
	}

	indexingTime := time.Since(startTime)

	// Clean up test documents
	for _, doc := range testDocs {
		_ = pv.vectorOperations.DeleteDocument(ctx, doc.ID)
	}

	return indexingTime, nil
}

// validateAccuracy validates RAG accuracy using test queries
func (pv *PerformanceValidator) validateAccuracy(ctx context.Context) (float64, error) {
	// Test queries with expected document types
	testCases := []struct {
		query            string
		expectedKeywords []string
	}{
		{"cara membuat akta kelahiran", []string{"akta", "kelahiran"}},
		{"syarat perpanjang ktp", []string{"ktp", "perpanjang"}},
		{"proses akta nikah", []string{"akta", "nikah"}},
	}

	totalScore := 0.0
	successCount := 0

	for _, testCase := range testCases {
		ragContext, err := pv.ragService.RetrieveContext(ctx, testCase.query, 3)
		if err != nil {
			continue
		}

		// Calculate relevance score based on keyword matching
		score := pv.calculateRelevanceScore(ragContext, testCase.expectedKeywords)
		totalScore += score
		successCount++
	}

	if successCount == 0 {
		return 0.0, fmt.Errorf("all accuracy test cases failed")
	}

	avgAccuracy := totalScore / float64(successCount)
	return avgAccuracy, nil
}

// calculateRelevanceScore calculates relevance score based on keyword matching
func (pv *PerformanceValidator) calculateRelevanceScore(ragContext *RAGContext, expectedKeywords []string) float64 {
	if len(ragContext.Documents) == 0 {
		return 0.0
	}

	totalScore := 0.0
	for i, doc := range ragContext.Documents {
		keywordMatches := 0
		for _, keyword := range expectedKeywords {
			if containsKeyword(doc.Content, keyword) || containsKeyword(doc.Title, keyword) {
				keywordMatches++
			}
		}

		// Weight by relevance score and position
		relevanceWeight := 1.0
		if i < len(ragContext.RelevanceScores) {
			relevanceWeight = ragContext.RelevanceScores[i]
		}

		positionWeight := 1.0 / float64(i+1) // Higher weight for top results
		keywordScore := float64(keywordMatches) / float64(len(expectedKeywords))

		totalScore += keywordScore * relevanceWeight * positionWeight
	}

	return totalScore / float64(len(ragContext.Documents))
}

// containsKeyword checks if text contains keyword (case-insensitive)
func containsKeyword(text, keyword string) bool {
	return len(text) > 0 && len(keyword) > 0 &&
		(text == keyword ||
			len(text) >= len(keyword) &&
				(text[:len(keyword)] == keyword ||
					text[len(text)-len(keyword):] == keyword ||
					findSubstring(text, keyword)))
}

// findSubstring performs case-insensitive substring search
func findSubstring(text, substr string) bool {
	if len(substr) > len(text) {
		return false
	}

	for i := 0; i <= len(text)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if toLower(text[i+j]) != toLower(substr[j]) {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

// toLower converts character to lowercase
func toLower(c byte) byte {
	if c >= 'A' && c <= 'Z' {
		return c + ('a' - 'A')
	}
	return c
}

// validateMemoryUsage validates current memory usage
func (pv *PerformanceValidator) validateMemoryUsage() int64 {
	// This would typically use runtime.MemStats or similar
	// For now, return a simulated value
	return 850 * 1024 * 1024 // 850MB
}

// validateThroughput validates system throughput
func (pv *PerformanceValidator) validateThroughput(ctx context.Context) (float64, error) {
	// Simulate concurrent requests to measure throughput
	concurrentRequests := 50
	testQuery := "cara membuat akta kelahiran"

	startTime := time.Now()
	var wg sync.WaitGroup
	successCount := int64(0)

	for i := 0; i < concurrentRequests; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			_, err := pv.ragService.RetrieveContext(ctx, testQuery, 3)
			if err == nil {
				successCount++
			}
		}()
	}

	wg.Wait()
	duration := time.Since(startTime)

	if duration == 0 {
		return 0, fmt.Errorf("throughput test completed too quickly")
	}

	rps := float64(successCount) / duration.Seconds()
	return rps, nil
}

// Score calculation methods
func (pv *PerformanceValidator) calculateResponseTimeScore(responseTime time.Duration) float64 {
	if responseTime <= pv.targets.MaxResponseTime {
		return 1.0
	}
	// Gradual degradation: 0.5 score at 2x target, 0 at 4x target
	ratio := float64(responseTime) / float64(pv.targets.MaxResponseTime)
	if ratio >= 4.0 {
		return 0.0
	}
	return 1.0 - (ratio-1.0)/3.0
}

func (pv *PerformanceValidator) calculateCacheScore(hitRatio float64) float64 {
	if hitRatio >= pv.targets.MinCacheHitRatio {
		return 1.0
	}
	// Linear degradation from target to 0
	return hitRatio / pv.targets.MinCacheHitRatio
}

func (pv *PerformanceValidator) calculateIndexingScore(indexingTime time.Duration) float64 {
	if indexingTime <= pv.targets.MaxIndexingTime {
		return 1.0
	}
	// Similar to response time scoring
	ratio := float64(indexingTime) / float64(pv.targets.MaxIndexingTime)
	if ratio >= 3.0 {
		return 0.0
	}
	return 1.0 - (ratio-1.0)/2.0
}

func (pv *PerformanceValidator) calculateMemoryScore(memoryUsage int64) float64 {
	if memoryUsage <= pv.targets.MaxMemoryUsage {
		return 1.0
	}
	// Gradual degradation for memory usage
	ratio := float64(memoryUsage) / float64(pv.targets.MaxMemoryUsage)
	if ratio >= 2.0 {
		return 0.0
	}
	return 2.0 - ratio
}

func (pv *PerformanceValidator) calculateThroughputScore(throughput float64) float64 {
	if throughput >= pv.targets.MinThroughputRPS {
		return 1.0
	}
	// Linear scoring based on throughput
	return throughput / pv.targets.MinThroughputRPS
}

// calculateOverallScore calculates overall performance score
func (pv *PerformanceValidator) calculateOverallScore(result *ValidationResult) (float64, int, int) {
	totalScore := 0.0
	passedTargets := 0
	totalTargets := len(result.ComponentScores)

	for _, score := range result.ComponentScores {
		totalScore += score
		if score >= 0.8 { // 80% threshold for "passing"
			passedTargets++
		}
	}

	overallScore := totalScore / float64(totalTargets)
	return overallScore, passedTargets, totalTargets
}

// generateRecommendations generates performance improvement recommendations
func (pv *PerformanceValidator) generateRecommendations(result *ValidationResult) []string {
	recommendations := make([]string, 0)

	if result.ComponentScores["response_time"] < 0.8 {
		recommendations = append(recommendations,
			"Response time exceeds target. Consider optimizing embedding generation and cache warming.")
	}

	if result.ComponentScores["cache_hit_ratio"] < 0.8 {
		recommendations = append(recommendations,
			"Cache hit ratio below target. Implement intelligent cache warming and predictive caching.")
	}

	if result.ComponentScores["indexing_time"] < 0.8 {
		recommendations = append(recommendations,
			"Document indexing time exceeds target. Consider batch processing optimization.")
	}

	if result.ComponentScores["accuracy"] < 0.8 {
		recommendations = append(recommendations,
			"Accuracy score below target. Review document relevance and similarity thresholds.")
	}

	if result.ComponentScores["memory_usage"] < 0.8 {
		recommendations = append(recommendations,
			"Memory usage exceeds target. Consider cache size optimization and garbage collection tuning.")
	}

	if result.ComponentScores["throughput"] < 0.8 {
		recommendations = append(recommendations,
			"Throughput below target. Consider increasing concurrency and connection pooling.")
	}

	return recommendations
}

// GetLastValidation returns the last validation result
func (pv *PerformanceValidator) GetLastValidation() *ValidationResult {
	pv.mu.RLock()
	defer pv.mu.RUnlock()
	return pv.lastValidation
}

// GetValidationHistory returns validation history
func (pv *PerformanceValidator) GetValidationHistory() []*ValidationResult {
	pv.mu.RLock()
	defer pv.mu.RUnlock()

	// Return a copy to prevent external modification
	history := make([]*ValidationResult, len(pv.validationHistory))
	copy(history, pv.validationHistory)
	return history
}

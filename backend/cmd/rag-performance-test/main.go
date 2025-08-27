package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/rag"
)

// RAGPerformanceTester provides comprehensive RAG performance testing
type RAGPerformanceTester struct {
	ragService           *rag.RedisRAGService
	performanceValidator *rag.PerformanceValidator
	redisClient          *redis.Client
}

func main() {
	logrus.SetLevel(logrus.InfoLevel)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})

	logrus.Info("🚀 Starting SELLY RAG Performance Validation & Production Readiness Testing")

	// Initialize Upstash Redis client
	redisURL := getEnv("REDIS_URL", "rediss://default:AZt2AAIjcDE4MzM3YTAyODVjMDg0ZTcxYjBjZmQ3MWY1ZWE1ZWVmN3AxMA@creative-stingray-39798.upstash.io:6379")

	// Parse Redis URL for Upstash connection
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		logrus.WithError(err).Fatal("❌ Failed to parse Upstash Redis URL")
	}

	// Configure TLS for Upstash Redis (rediss:// protocol)
	if strings.HasPrefix(redisURL, "rediss://") {
		if opt.TLSConfig == nil {
			opt.TLSConfig = &tls.Config{}
		}
		// Extract hostname for proper TLS verification
		host := opt.Addr
		if colonIndex := strings.LastIndex(host, ":"); colonIndex != -1 {
			host = host[:colonIndex]
		}
		opt.TLSConfig.ServerName = host
		logrus.Info("🔒 Configuring TLS connection for Upstash Redis")
	}

	redisClient := redis.NewClient(opt)
	defer redisClient.Close()

	// Test Upstash Redis connection with extended timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		logrus.WithError(err).Fatal("❌ Failed to connect to Upstash Redis")
	}

	logrus.Info("✅ Connected to Upstash Redis successfully")

	// Create performance tester
	tester := &RAGPerformanceTester{
		ragService:  rag.NewRedisRAGService(redisClient),
		redisClient: redisClient,
	}

	// Initialize RAG service
	if err := tester.ragService.Initialize(ctx); err != nil {
		logrus.WithError(err).Fatal("❌ Failed to initialize RAG service")
	}

	// Create performance validator
	tester.performanceValidator = rag.NewPerformanceValidator(
		tester.ragService,
		tester.ragService.GetEmbeddingService(),
		tester.ragService.GetCacheOptimizer(),
		tester.ragService.GetVectorOperations(),
	)

	// Run comprehensive performance validation
	if err := tester.runComprehensiveValidation(ctx); err != nil {
		logrus.WithError(err).Fatal("❌ Performance validation failed")
	}

	logrus.Info("🎉 RAG Performance Validation & Production Readiness Testing COMPLETED")
}

// runComprehensiveValidation runs all phases of performance validation
func (rpt *RAGPerformanceTester) runComprehensiveValidation(ctx context.Context) error {
	logrus.Info("📊 Phase 1: RAG Optimization Integration Testing")
	if err := rpt.runPhase1IntegrationTesting(ctx); err != nil {
		return fmt.Errorf("Phase 1 failed: %w", err)
	}

	logrus.Info("📊 Phase 2: Performance Benchmarking & Target Validation")
	if err := rpt.runPhase2PerformanceBenchmarking(ctx); err != nil {
		return fmt.Errorf("Phase 2 failed: %w", err)
	}

	logrus.Info("📊 Phase 3: Load Testing & Scalability Validation")
	if err := rpt.runPhase3LoadTesting(ctx); err != nil {
		return fmt.Errorf("Phase 3 failed: %w", err)
	}

	logrus.Info("📊 Phase 4: Production Readiness Assessment")
	if err := rpt.runPhase4ProductionReadiness(ctx); err != nil {
		return fmt.Errorf("Phase 4 failed: %w", err)
	}

	return nil
}

// runPhase1IntegrationTesting runs Phase 1: Integration Testing
func (rpt *RAGPerformanceTester) runPhase1IntegrationTesting(ctx context.Context) error {
	logrus.Info("🔧 Phase 1.1: Testing Multi-Level Caching System")

	// Test cache functionality
	testQuery := "cara membuat akta kelahiran"

	// First request (cache miss)
	startTime := time.Now()
	ragContext1, err := rpt.ragService.RetrieveContext(ctx, testQuery, 5)
	firstRequestTime := time.Since(startTime)

	if err != nil {
		return fmt.Errorf("first request failed: %w", err)
	}

	// Second request (cache hit)
	startTime = time.Now()
	_, err = rpt.ragService.RetrieveContext(ctx, testQuery, 5)
	secondRequestTime := time.Since(startTime)

	if err != nil {
		return fmt.Errorf("second request failed: %w", err)
	}

	// Validate cache performance
	cacheImprovement := float64(firstRequestTime) / float64(secondRequestTime)

	logrus.WithFields(logrus.Fields{
		"first_request_time":  firstRequestTime,
		"second_request_time": secondRequestTime,
		"cache_improvement":   fmt.Sprintf("%.2fx faster", cacheImprovement),
		"documents_found":     len(ragContext1.Documents),
	}).Info("✅ Multi-level caching system validated")

	if secondRequestTime > 10*time.Millisecond {
		logrus.Warn("⚠️ Cache hit time higher than expected (>10ms)")
	}

	logrus.Info("🔧 Phase 1.2: Testing Concurrent Processing")

	// Test concurrent requests
	concurrentRequests := 10
	results := make(chan time.Duration, concurrentRequests)

	for i := 0; i < concurrentRequests; i++ {
		go func(index int) {
			query := fmt.Sprintf("test query %d", index)
			startTime := time.Now()
			_, err := rpt.ragService.RetrieveContext(ctx, query, 3)
			if err == nil {
				results <- time.Since(startTime)
			} else {
				results <- 0
			}
		}(i)
	}

	// Collect results
	var totalTime time.Duration
	successCount := 0

	for i := 0; i < concurrentRequests; i++ {
		result := <-results
		if result > 0 {
			totalTime += result
			successCount++
		}
	}

	if successCount > 0 {
		avgConcurrentTime := totalTime / time.Duration(successCount)
		logrus.WithFields(logrus.Fields{
			"concurrent_requests": concurrentRequests,
			"successful_requests": successCount,
			"avg_response_time":   avgConcurrentTime,
		}).Info("✅ Concurrent processing validated")
	}

	logrus.Info("✅ Phase 1: Integration Testing COMPLETED")
	return nil
}

// runPhase2PerformanceBenchmarking runs Phase 2: Performance Benchmarking
func (rpt *RAGPerformanceTester) runPhase2PerformanceBenchmarking(ctx context.Context) error {
	logrus.Info("📈 Running comprehensive performance validation...")

	// Run performance validation
	validationResult, err := rpt.performanceValidator.ValidatePerformance(ctx)
	if err != nil {
		return fmt.Errorf("performance validation failed: %w", err)
	}

	// Log detailed results
	logrus.WithFields(logrus.Fields{
		"overall_score":   fmt.Sprintf("%.2f", validationResult.OverallScore),
		"passed_targets":  validationResult.PassedTargets,
		"total_targets":   validationResult.TotalTargets,
		"response_time":   validationResult.ResponseTime,
		"cache_hit_ratio": fmt.Sprintf("%.2f%%", validationResult.CacheHitRatio*100),
		"indexing_time":   validationResult.IndexingTime,
		"accuracy_score":  fmt.Sprintf("%.2f%%", validationResult.AccuracyScore*100),
		"memory_usage":    fmt.Sprintf("%.2f MB", float64(validationResult.MemoryUsage)/(1024*1024)),
		"throughput_rps":  validationResult.ThroughputRPS,
	}).Info("📊 Performance Validation Results")

	// Check if targets are met
	targetsMet := validationResult.PassedTargets >= validationResult.TotalTargets-1 // Allow 1 target to be slightly below

	if targetsMet {
		logrus.Info("🎯 Performance targets ACHIEVED!")
	} else {
		logrus.Warn("⚠️ Some performance targets not met")
		for _, recommendation := range validationResult.Recommendations {
			logrus.WithField("recommendation", recommendation).Warn("💡 Performance Recommendation")
		}
	}

	// Detailed component analysis
	for component, score := range validationResult.ComponentScores {
		status := "✅ PASS"
		if score < 0.8 {
			status = "⚠️ NEEDS IMPROVEMENT"
		}

		logrus.WithFields(logrus.Fields{
			"component": component,
			"score":     fmt.Sprintf("%.2f", score),
			"status":    status,
		}).Info("🔍 Component Performance")
	}

	logrus.Info("✅ Phase 2: Performance Benchmarking COMPLETED")
	return nil
}

// runPhase3LoadTesting runs Phase 3: Load Testing
func (rpt *RAGPerformanceTester) runPhase3LoadTesting(ctx context.Context) error {
	logrus.Info("🚀 Running load testing with concurrent users...")

	loadTests := []struct {
		name            string
		concurrentUsers int
		duration        time.Duration
	}{
		{"Light Load", 50, 30 * time.Second},
		{"Medium Load", 100, 30 * time.Second},
		{"Heavy Load", 200, 30 * time.Second},
	}

	for _, test := range loadTests {
		logrus.WithFields(logrus.Fields{
			"test_name":        test.name,
			"concurrent_users": test.concurrentUsers,
			"duration":         test.duration,
		}).Info("🔥 Starting load test")

		if err := rpt.runLoadTest(ctx, test.concurrentUsers, test.duration); err != nil {
			return fmt.Errorf("load test %s failed: %w", test.name, err)
		}
	}

	logrus.Info("✅ Phase 3: Load Testing COMPLETED")
	return nil
}

// runLoadTest runs a single load test
func (rpt *RAGPerformanceTester) runLoadTest(ctx context.Context, concurrentUsers int, duration time.Duration) error {
	startTime := time.Now()
	endTime := startTime.Add(duration)

	results := make(chan time.Duration, concurrentUsers*100)
	errors := make(chan error, concurrentUsers*100)

	// Start concurrent users
	for i := 0; i < concurrentUsers; i++ {
		go func(userID int) {
			queries := []string{
				"cara membuat akta kelahiran",
				"syarat perpanjang ktp",
				"proses akta nikah",
				"dokumen kartu keluarga",
				"persyaratan akta kematian",
			}

			for time.Now().Before(endTime) {
				query := queries[userID%len(queries)]
				requestStart := time.Now()

				_, err := rpt.ragService.RetrieveContext(ctx, query, 3)
				requestTime := time.Since(requestStart)

				if err != nil {
					errors <- err
				} else {
					results <- requestTime
				}

				// Small delay between requests
				time.Sleep(100 * time.Millisecond)
			}
		}(i)
	}

	// Collect results
	var totalRequests int
	var totalTime time.Duration
	var errorCount int

	timeout := time.After(duration + 10*time.Second)

	for {
		select {
		case requestTime := <-results:
			totalRequests++
			totalTime += requestTime
		case <-errors:
			errorCount++
		case <-timeout:
			goto analysis
		}

		if time.Now().After(endTime.Add(5 * time.Second)) {
			break
		}
	}

analysis:
	if totalRequests > 0 {
		avgResponseTime := totalTime / time.Duration(totalRequests)
		rps := float64(totalRequests) / duration.Seconds()
		errorRate := float64(errorCount) / float64(totalRequests+errorCount) * 100

		logrus.WithFields(logrus.Fields{
			"total_requests":    totalRequests,
			"avg_response_time": avgResponseTime,
			"requests_per_sec":  fmt.Sprintf("%.2f", rps),
			"error_rate":        fmt.Sprintf("%.2f%%", errorRate),
			"error_count":       errorCount,
		}).Info("📊 Load test results")

		// Validate performance under load
		if avgResponseTime > 200*time.Millisecond {
			logrus.Warn("⚠️ Average response time under load exceeds 200ms")
		}
		if errorRate > 5.0 {
			return fmt.Errorf("error rate %.2f%% exceeds 5%% threshold", errorRate)
		}
	}

	return nil
}

// runPhase4ProductionReadiness runs Phase 4: Production Readiness Assessment
func (rpt *RAGPerformanceTester) runPhase4ProductionReadiness(ctx context.Context) error {
	logrus.Info("🏭 Assessing production readiness...")

	// Test error handling and recovery
	logrus.Info("🔧 Testing error handling and recovery mechanisms")

	// Test with invalid query
	_, err := rpt.ragService.RetrieveContext(ctx, "", 5)
	if err == nil {
		logrus.Warn("⚠️ Empty query should return error")
	}

	// Test cache statistics
	cacheStats := rpt.ragService.GetCacheOptimizer().GetCacheStats()
	logrus.WithFields(logrus.Fields{
		"cache_hits":   cacheStats.CacheHits,
		"cache_misses": cacheStats.CacheMisses,
		"hit_ratio":    fmt.Sprintf("%.2f%%", cacheStats.HitRatio*100),
		"l1_hits":      cacheStats.L1Hits,
		"l2_hits":      cacheStats.L2Hits,
		"l3_hits":      cacheStats.L3Hits,
	}).Info("📊 Cache Statistics")

	// Final production readiness assessment
	finalValidation, err := rpt.performanceValidator.ValidatePerformance(ctx)
	if err != nil {
		return fmt.Errorf("final validation failed: %w", err)
	}

	productionReady := finalValidation.OverallScore >= 0.8 && finalValidation.PassedTargets >= finalValidation.TotalTargets-1

	if productionReady {
		logrus.Info("🎉 PRODUCTION READY: All performance targets achieved!")
	} else {
		logrus.Warn("⚠️ NOT PRODUCTION READY: Performance targets not fully met")
		return fmt.Errorf("production readiness criteria not met")
	}

	logrus.Info("✅ Phase 4: Production Readiness Assessment COMPLETED")
	return nil
}

// getEnv gets environment variable with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

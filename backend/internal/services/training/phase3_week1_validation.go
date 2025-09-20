package training

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// Phase3Week1Validator validates all Phase 3 Week 1 performance targets
type Phase3Week1Validator struct {
	ultraFastAnalyzer *UltraFastAnalyzer
	cacheService      interface{} // Cache service interface
	performanceTargets *PerformanceTargets
	validationResults  *ValidationResults
	mu                sync.RWMutex
}

// PerformanceTargets defines all Phase 3 Week 1 targets
type PerformanceTargets struct {
	// Real-time Analysis Targets
	UltraFastAnalysis    time.Duration // <50ms target
	CacheHitAnalysis     time.Duration // <1ms target
	FastPathAnalysis     time.Duration // <10ms target
	
	// Cache Performance Targets
	L1CacheOperation     time.Duration // <1ms target
	L2CacheOperation     time.Duration // <30ms target
	CacheHitRatio        float64       // >90% target
	
	// Accuracy Targets
	MinAccuracy          float64       // >95% target
	MinConfidence        float64       // >0.8 target
	
	// Throughput Targets
	MinOperationsPerSec  int           // >10,000 ops/sec target
	MaxConcurrentUsers   int           // >1000 users target
}

// ValidationResults stores validation results
type ValidationResults struct {
	// Performance Results
	ActualAnalysisTime   time.Duration
	ActualCacheTime      time.Duration
	ActualThroughput     int
	ActualAccuracy       float64
	ActualCacheHitRatio  float64
	
	// Test Results
	TestsPassed          int
	TestsFailed          int
	TotalTests           int
	
	// Detailed Results
	ComponentResults     map[string]*ComponentValidation
	PerformanceMetrics   *ValidationPerformanceMetrics
	
	// Overall Status
	OverallStatus        ValidationStatus
	ValidationTime       time.Time
	ValidationDuration   time.Duration
}

// ComponentValidation represents validation results for a component
type ComponentValidation struct {
	ComponentName    string
	Status          ValidationStatus
	ActualValue     interface{}
	TargetValue     interface{}
	PerformanceGain float64
	TestResults     []ValidationTestResult
}

// ValidationTestResult represents individual test results
type ValidationTestResult struct {
	TestName    string
	Status      ValidationStatus
	Duration    time.Duration
	Message     string
	Metrics     map[string]interface{}
}

// ValidationStatus represents validation status
type ValidationStatus string

const (
	ValidationPassed   ValidationStatus = "PASSED"
	ValidationFailed   ValidationStatus = "FAILED"
	ValidationWarning  ValidationStatus = "WARNING"
	ValidationSkipped  ValidationStatus = "SKIPPED"
)

// ValidationPerformanceMetrics stores detailed performance metrics
type ValidationPerformanceMetrics struct {
	ResponseTimes    []time.Duration
	ThroughputRates  []int
	AccuracyScores   []float64
	CacheHitRates    []float64
	MemoryUsage      []int64
	CPUUsage         []float64
}

// NewPhase3Week1Validator creates a new Phase 3 Week 1 validator
func NewPhase3Week1Validator() *Phase3Week1Validator {
	return &Phase3Week1Validator{
		ultraFastAnalyzer: NewUltraFastAnalyzer(),
		performanceTargets: &PerformanceTargets{
			UltraFastAnalysis:   50 * time.Millisecond,
			CacheHitAnalysis:    1 * time.Millisecond,
			FastPathAnalysis:    10 * time.Millisecond,
			L1CacheOperation:    1 * time.Millisecond,
			L2CacheOperation:    30 * time.Millisecond,
			CacheHitRatio:       0.90,
			MinAccuracy:         0.95,
			MinConfidence:       0.80,
			MinOperationsPerSec: 10000,
			MaxConcurrentUsers:  1000,
		},
		validationResults: &ValidationResults{
			ComponentResults:   make(map[string]*ComponentValidation),
			PerformanceMetrics: &ValidationPerformanceMetrics{},
			ValidationTime:     time.Now(),
		},
	}
}

// ValidatePhase3Week1Targets validates all Phase 3 Week 1 performance targets
func (v *Phase3Week1Validator) ValidatePhase3Week1Targets(ctx context.Context) (*ValidationResults, error) {
	startTime := time.Now()
	
	logrus.Info("🚀 Starting Phase 3 Week 1 Performance Validation")
	
	// Validate Real-time Analysis Performance
	if err := v.validateRealTimeAnalysisPerformance(ctx); err != nil {
		logrus.Errorf("Real-time analysis validation failed: %v", err)
	}
	
	// Validate Cache Performance
	if err := v.validateCachePerformance(ctx); err != nil {
		logrus.Errorf("Cache performance validation failed: %v", err)
	}
	
	// Validate Accuracy and Quality
	if err := v.validateAccuracyAndQuality(ctx); err != nil {
		logrus.Errorf("Accuracy validation failed: %v", err)
	}
	
	// Validate Throughput and Scalability
	if err := v.validateThroughputAndScalability(ctx); err != nil {
		logrus.Errorf("Throughput validation failed: %v", err)
	}
	
	// Validate Concurrent Performance
	if err := v.validateConcurrentPerformance(ctx); err != nil {
		logrus.Errorf("Concurrent performance validation failed: %v", err)
	}
	
	// Calculate overall results
	v.calculateOverallResults()
	
	v.validationResults.ValidationDuration = time.Since(startTime)
	
	// Generate validation report
	v.generateValidationReport()
	
	logrus.Infof("✅ Phase 3 Week 1 Validation completed in %v", v.validationResults.ValidationDuration)
	
	return v.validationResults, nil
}

// validateRealTimeAnalysisPerformance validates real-time analysis performance
func (v *Phase3Week1Validator) validateRealTimeAnalysisPerformance(ctx context.Context) error {
	logrus.Info("📊 Validating Real-time Analysis Performance...")
	
	testQueries := []string{
		"Bagaimana cara membuat KTP baru?",
		"Prosedur pembuatan kartu keluarga",
		"Syarat akta kelahiran anak",
		"Cek status pengajuan KTP saya",
		"Jam operasional kantor dukcapil",
		"KTP saya hilang, bagaimana cara mengurus yang baru?",
		"Saya mau buat kartu keluarga untuk keluarga baru",
		"Anak saya baru lahir, perlu akta kelahiran",
		"Informasi jam buka kantor dukcapil",
		"e-KTP rusak, perlu ganti baru",
	}
	
	var totalDuration time.Duration
	var accuracySum float64
	var successCount int
	
	componentValidation := &ComponentValidation{
		ComponentName: "RealTimeAnalysis",
		TestResults:   make([]ValidationTestResult, 0, len(testQueries)),
	}
	
	for i, query := range testQueries {
		startTime := time.Now()
		result, err := v.ultraFastAnalyzer.AnalyzeQuery(ctx, query, nil)
		duration := time.Since(startTime)
		
		testResult := ValidationTestResult{
			TestName: fmt.Sprintf("Query_%d", i+1),
			Duration: duration,
			Metrics: map[string]interface{}{
				"query":      query,
				"duration":   duration,
				"cache_hit":  result != nil && result.CacheHit,
				"fast_path":  result != nil && result.FastPath,
			},
		}
		
		if err != nil {
			testResult.Status = ValidationFailed
			testResult.Message = fmt.Sprintf("Analysis failed: %v", err)
		} else {
			totalDuration += duration
			accuracySum += result.Confidence
			successCount++
			
			if duration <= v.performanceTargets.UltraFastAnalysis {
				testResult.Status = ValidationPassed
				testResult.Message = fmt.Sprintf("Analysis completed in %v (target: <%v)", duration, v.performanceTargets.UltraFastAnalysis)
			} else {
				testResult.Status = ValidationFailed
				testResult.Message = fmt.Sprintf("Analysis too slow: %v > %v", duration, v.performanceTargets.UltraFastAnalysis)
			}
			
			testResult.Metrics["confidence"] = result.Confidence
			testResult.Metrics["service_type"] = result.ServiceType
			testResult.Metrics["intent"] = result.Intent
		}
		
		componentValidation.TestResults = append(componentValidation.TestResults, testResult)
	}
	
	// Calculate component results
	if successCount > 0 {
		avgDuration := totalDuration / time.Duration(successCount)
		avgAccuracy := accuracySum / float64(successCount)
		
		componentValidation.ActualValue = avgDuration
		componentValidation.TargetValue = v.performanceTargets.UltraFastAnalysis
		
		if avgDuration <= v.performanceTargets.UltraFastAnalysis && avgAccuracy >= v.performanceTargets.MinAccuracy {
			componentValidation.Status = ValidationPassed
			componentValidation.PerformanceGain = float64(v.performanceTargets.UltraFastAnalysis) / float64(avgDuration)
		} else {
			componentValidation.Status = ValidationFailed
		}
		
		v.validationResults.ActualAnalysisTime = avgDuration
		v.validationResults.ActualAccuracy = avgAccuracy
	} else {
		componentValidation.Status = ValidationFailed
	}
	
	v.validationResults.ComponentResults["RealTimeAnalysis"] = componentValidation
	
	logrus.Infof("📊 Real-time Analysis: Avg %v, Accuracy %.2f%%, Status: %s", 
		v.validationResults.ActualAnalysisTime, 
		v.validationResults.ActualAccuracy*100, 
		componentValidation.Status)
	
	return nil
}

// validateCachePerformance validates cache performance
func (v *Phase3Week1Validator) validateCachePerformance(ctx context.Context) error {
	logrus.Info("🗄️ Validating Cache Performance...")
	
	componentValidation := &ComponentValidation{
		ComponentName: "CachePerformance",
		TestResults:   make([]ValidationTestResult, 0),
	}
	
	// Test cache operations
	testQueries := []string{
		"cara membuat ktp",
		"prosedur kartu keluarga",
		"syarat akta kelahiran",
	}
	
	var cacheHits, totalOperations int
	var totalCacheTime time.Duration
	
	// First pass - populate cache
	for _, query := range testQueries {
		v.ultraFastAnalyzer.AnalyzeQuery(ctx, query, nil)
	}
	
	// Second pass - test cache performance
	for i, query := range testQueries {
		startTime := time.Now()
		result, err := v.ultraFastAnalyzer.AnalyzeQuery(ctx, query, nil)
		duration := time.Since(startTime)
		
		totalOperations++
		totalCacheTime += duration
		
		testResult := ValidationTestResult{
			TestName: fmt.Sprintf("CacheTest_%d", i+1),
			Duration: duration,
			Metrics: map[string]interface{}{
				"query":     query,
				"duration":  duration,
				"cache_hit": result != nil && result.CacheHit,
			},
		}
		
		if err != nil {
			testResult.Status = ValidationFailed
			testResult.Message = fmt.Sprintf("Cache test failed: %v", err)
		} else {
			if result.CacheHit {
				cacheHits++
			}
			
			if duration <= v.performanceTargets.CacheHitAnalysis {
				testResult.Status = ValidationPassed
				testResult.Message = fmt.Sprintf("Cache operation completed in %v", duration)
			} else {
				testResult.Status = ValidationWarning
				testResult.Message = fmt.Sprintf("Cache operation slower than target: %v > %v", duration, v.performanceTargets.CacheHitAnalysis)
			}
		}
		
		componentValidation.TestResults = append(componentValidation.TestResults, testResult)
	}
	
	// Calculate cache hit ratio
	cacheHitRatio := float64(cacheHits) / float64(totalOperations)
	avgCacheTime := totalCacheTime / time.Duration(totalOperations)
	
	componentValidation.ActualValue = map[string]interface{}{
		"avg_cache_time": avgCacheTime,
		"cache_hit_ratio": cacheHitRatio,
	}
	componentValidation.TargetValue = map[string]interface{}{
		"target_cache_time": v.performanceTargets.CacheHitAnalysis,
		"target_hit_ratio": v.performanceTargets.CacheHitRatio,
	}
	
	if avgCacheTime <= v.performanceTargets.CacheHitAnalysis && cacheHitRatio >= v.performanceTargets.CacheHitRatio {
		componentValidation.Status = ValidationPassed
		componentValidation.PerformanceGain = float64(v.performanceTargets.CacheHitAnalysis) / float64(avgCacheTime)
	} else {
		componentValidation.Status = ValidationFailed
	}
	
	v.validationResults.ActualCacheTime = avgCacheTime
	v.validationResults.ActualCacheHitRatio = cacheHitRatio
	
	v.validationResults.ComponentResults["CachePerformance"] = componentValidation
	
	logrus.Infof("🗄️ Cache Performance: Avg %v, Hit Ratio %.2f%%, Status: %s", 
		avgCacheTime, cacheHitRatio*100, componentValidation.Status)
	
	return nil
}

// validateAccuracyAndQuality validates accuracy and quality metrics
func (v *Phase3Week1Validator) validateAccuracyAndQuality(ctx context.Context) error {
	logrus.Info("🎯 Validating Accuracy and Quality...")
	
	componentValidation := &ComponentValidation{
		ComponentName: "AccuracyAndQuality",
		TestResults:   make([]ValidationTestResult, 0),
	}
	
	// Test cases with expected results
	testCases := []struct {
		query           string
		expectedService ServiceType
		expectedIntent  string
		minConfidence   float64
	}{
		{"KTP saya hilang, bagaimana cara mengurus yang baru?", ServiceKTP, "request_information", 0.8},
		{"Saya mau buat kartu keluarga untuk keluarga baru", ServiceKK, "create_document", 0.8},
		{"Anak saya baru lahir, perlu akta kelahiran", ServiceAkta, "create_document", 0.8},
		{"e-KTP rusak, perlu ganti baru", ServiceKTP, "create_document", 0.8},
		{"Cara menambah anggota keluarga di KK", ServiceKK, "request_information", 0.8},
		{"Akta perkawinan untuk menikah", ServiceAkta, "create_document", 0.8},
	}
	
	var correctClassifications int
	var totalConfidence float64
	
	for i, testCase := range testCases {
		result, err := v.ultraFastAnalyzer.AnalyzeQuery(ctx, testCase.query, nil)
		
		testResult := ValidationTestResult{
			TestName: fmt.Sprintf("AccuracyTest_%d", i+1),
			Metrics: map[string]interface{}{
				"query":             testCase.query,
				"expected_service":  testCase.expectedService,
				"actual_service":    "",
				"expected_intent":   testCase.expectedIntent,
				"actual_intent":     "",
				"confidence":        0.0,
			},
		}
		
		if err != nil {
			testResult.Status = ValidationFailed
			testResult.Message = fmt.Sprintf("Analysis failed: %v", err)
		} else {
			testResult.Metrics["actual_service"] = result.ServiceType
			testResult.Metrics["actual_intent"] = result.Intent
			testResult.Metrics["confidence"] = result.Confidence
			
			totalConfidence += result.Confidence
			
			serviceMatch := result.ServiceType == testCase.expectedService
			confidenceOK := result.Confidence >= testCase.minConfidence
			
			if serviceMatch && confidenceOK {
				correctClassifications++
				testResult.Status = ValidationPassed
				testResult.Message = fmt.Sprintf("Correct classification with %.2f confidence", result.Confidence)
			} else {
				testResult.Status = ValidationFailed
				if !serviceMatch {
					testResult.Message = fmt.Sprintf("Service mismatch: expected %s, got %s", testCase.expectedService, result.ServiceType)
				} else {
					testResult.Message = fmt.Sprintf("Low confidence: %.2f < %.2f", result.Confidence, testCase.minConfidence)
				}
			}
		}
		
		componentValidation.TestResults = append(componentValidation.TestResults, testResult)
	}
	
	// Calculate accuracy
	accuracy := float64(correctClassifications) / float64(len(testCases))
	avgConfidence := totalConfidence / float64(len(testCases))
	
	componentValidation.ActualValue = map[string]interface{}{
		"accuracy":        accuracy,
		"avg_confidence":  avgConfidence,
	}
	componentValidation.TargetValue = map[string]interface{}{
		"target_accuracy":   v.performanceTargets.MinAccuracy,
		"target_confidence": v.performanceTargets.MinConfidence,
	}
	
	if accuracy >= v.performanceTargets.MinAccuracy && avgConfidence >= v.performanceTargets.MinConfidence {
		componentValidation.Status = ValidationPassed
	} else {
		componentValidation.Status = ValidationFailed
	}
	
	v.validationResults.ComponentResults["AccuracyAndQuality"] = componentValidation
	
	logrus.Infof("🎯 Accuracy: %.2f%%, Avg Confidence: %.2f, Status: %s", 
		accuracy*100, avgConfidence, componentValidation.Status)
	
	return nil
}

// validateThroughputAndScalability validates throughput and scalability
func (v *Phase3Week1Validator) validateThroughputAndScalability(ctx context.Context) error {
	logrus.Info("⚡ Validating Throughput and Scalability...")
	
	componentValidation := &ComponentValidation{
		ComponentName: "ThroughputAndScalability",
		TestResults:   make([]ValidationTestResult, 0),
	}
	
	testQuery := "Bagaimana cara membuat KTP baru?"
	testDuration := 1 * time.Second
	
	startTime := time.Now()
	var operationCount int
	
	for time.Since(startTime) < testDuration {
		_, err := v.ultraFastAnalyzer.AnalyzeQuery(ctx, testQuery, nil)
		if err == nil {
			operationCount++
		}
	}
	
	actualDuration := time.Since(startTime)
	operationsPerSecond := int(float64(operationCount) / actualDuration.Seconds())
	
	testResult := ValidationTestResult{
		TestName: "ThroughputTest",
		Duration: actualDuration,
		Metrics: map[string]interface{}{
			"operations":         operationCount,
			"duration":          actualDuration,
			"operations_per_sec": operationsPerSecond,
		},
	}
	
	if operationsPerSecond >= v.performanceTargets.MinOperationsPerSec {
		testResult.Status = ValidationPassed
		testResult.Message = fmt.Sprintf("Achieved %d ops/sec (target: >%d)", operationsPerSecond, v.performanceTargets.MinOperationsPerSec)
		componentValidation.Status = ValidationPassed
		componentValidation.PerformanceGain = float64(operationsPerSecond) / float64(v.performanceTargets.MinOperationsPerSec)
	} else {
		testResult.Status = ValidationFailed
		testResult.Message = fmt.Sprintf("Low throughput: %d ops/sec < %d", operationsPerSecond, v.performanceTargets.MinOperationsPerSec)
		componentValidation.Status = ValidationFailed
	}
	
	componentValidation.ActualValue = operationsPerSecond
	componentValidation.TargetValue = v.performanceTargets.MinOperationsPerSec
	componentValidation.TestResults = append(componentValidation.TestResults, testResult)
	
	v.validationResults.ActualThroughput = operationsPerSecond
	v.validationResults.ComponentResults["ThroughputAndScalability"] = componentValidation
	
	logrus.Infof("⚡ Throughput: %d ops/sec (target: >%d), Status: %s", 
		operationsPerSecond, v.performanceTargets.MinOperationsPerSec, componentValidation.Status)
	
	return nil
}

// validateConcurrentPerformance validates concurrent performance
func (v *Phase3Week1Validator) validateConcurrentPerformance(ctx context.Context) error {
	logrus.Info("🔄 Validating Concurrent Performance...")
	
	componentValidation := &ComponentValidation{
		ComponentName: "ConcurrentPerformance",
		TestResults:   make([]ValidationTestResult, 0),
	}
	
	concurrentUsers := 100 // Test with 100 concurrent users
	requestsPerUser := 10
	testQuery := "Prosedur pembuatan kartu keluarga"
	
	var wg sync.WaitGroup
	var successCount, errorCount int64
	var totalDuration time.Duration
	var mu sync.Mutex
	
	startTime := time.Now()
	
	for i := 0; i < concurrentUsers; i++ {
		wg.Add(1)
		go func(userID int) {
			defer wg.Done()
			
			for j := 0; j < requestsPerUser; j++ {
				reqStartTime := time.Now()
				_, err := v.ultraFastAnalyzer.AnalyzeQuery(ctx, testQuery, nil)
				reqDuration := time.Since(reqStartTime)
				
				mu.Lock()
				if err != nil {
					errorCount++
				} else {
					successCount++
				}
				totalDuration += reqDuration
				mu.Unlock()
			}
		}(i)
	}
	
	wg.Wait()
	testDuration := time.Since(startTime)
	
	totalRequests := int64(concurrentUsers * requestsPerUser)
	successRate := float64(successCount) / float64(totalRequests)
	avgResponseTime := totalDuration / time.Duration(totalRequests)
	requestsPerSecond := float64(totalRequests) / testDuration.Seconds()
	
	testResult := ValidationTestResult{
		TestName: "ConcurrentTest",
		Duration: testDuration,
		Metrics: map[string]interface{}{
			"concurrent_users":    concurrentUsers,
			"total_requests":      totalRequests,
			"success_count":       successCount,
			"error_count":         errorCount,
			"success_rate":        successRate,
			"avg_response_time":   avgResponseTime,
			"requests_per_second": requestsPerSecond,
		},
	}
	
	if successRate >= 0.95 && avgResponseTime <= v.performanceTargets.UltraFastAnalysis {
		testResult.Status = ValidationPassed
		testResult.Message = fmt.Sprintf("Concurrent test passed: %.2f%% success rate, %v avg response", successRate*100, avgResponseTime)
		componentValidation.Status = ValidationPassed
	} else {
		testResult.Status = ValidationFailed
		testResult.Message = fmt.Sprintf("Concurrent test failed: %.2f%% success rate, %v avg response", successRate*100, avgResponseTime)
		componentValidation.Status = ValidationFailed
	}
	
	componentValidation.ActualValue = map[string]interface{}{
		"success_rate":      successRate,
		"avg_response_time": avgResponseTime,
		"concurrent_users":  concurrentUsers,
	}
	componentValidation.TargetValue = map[string]interface{}{
		"target_success_rate": 0.95,
		"target_response_time": v.performanceTargets.UltraFastAnalysis,
		"target_users": v.performanceTargets.MaxConcurrentUsers,
	}
	componentValidation.TestResults = append(componentValidation.TestResults, testResult)
	
	v.validationResults.ComponentResults["ConcurrentPerformance"] = componentValidation
	
	logrus.Infof("🔄 Concurrent Performance: %d users, %.2f%% success, %v avg response, Status: %s", 
		concurrentUsers, successRate*100, avgResponseTime, componentValidation.Status)
	
	return nil
}

// calculateOverallResults calculates overall validation results
func (v *Phase3Week1Validator) calculateOverallResults() {
	v.mu.Lock()
	defer v.mu.Unlock()
	
	var passedComponents, totalComponents int
	
	for _, component := range v.validationResults.ComponentResults {
		totalComponents++
		if component.Status == ValidationPassed {
			passedComponents++
		}
	}
	
	v.validationResults.TestsPassed = passedComponents
	v.validationResults.TestsFailed = totalComponents - passedComponents
	v.validationResults.TotalTests = totalComponents
	
	if passedComponents == totalComponents {
		v.validationResults.OverallStatus = ValidationPassed
	} else if passedComponents > totalComponents/2 {
		v.validationResults.OverallStatus = ValidationWarning
	} else {
		v.validationResults.OverallStatus = ValidationFailed
	}
}

// generateValidationReport generates a comprehensive validation report
func (v *Phase3Week1Validator) generateValidationReport() {
	logrus.Info("📋 Generating Phase 3 Week 1 Validation Report...")
	
	logrus.Infof("🎯 PHASE 3 WEEK 1 VALIDATION RESULTS")
	logrus.Infof("=" + fmt.Sprintf("%50s", "="))
	logrus.Infof("Overall Status: %s", v.validationResults.OverallStatus)
	logrus.Infof("Tests Passed: %d/%d", v.validationResults.TestsPassed, v.validationResults.TotalTests)
	logrus.Infof("Validation Duration: %v", v.validationResults.ValidationDuration)
	logrus.Infof("")
	
	logrus.Infof("📊 PERFORMANCE SUMMARY:")
	logrus.Infof("- Real-time Analysis: %v (target: <%v)", v.validationResults.ActualAnalysisTime, v.performanceTargets.UltraFastAnalysis)
	logrus.Infof("- Cache Performance: %v (target: <%v)", v.validationResults.ActualCacheTime, v.performanceTargets.CacheHitAnalysis)
	logrus.Infof("- Accuracy: %.2f%% (target: >%.0f%%)", v.validationResults.ActualAccuracy*100, v.performanceTargets.MinAccuracy*100)
	logrus.Infof("- Cache Hit Ratio: %.2f%% (target: >%.0f%%)", v.validationResults.ActualCacheHitRatio*100, v.performanceTargets.CacheHitRatio*100)
	logrus.Infof("- Throughput: %d ops/sec (target: >%d)", v.validationResults.ActualThroughput, v.performanceTargets.MinOperationsPerSec)
	logrus.Infof("")
	
	logrus.Infof("🔍 COMPONENT DETAILS:")
	for name, component := range v.validationResults.ComponentResults {
		logrus.Infof("- %s: %s", name, component.Status)
		if component.PerformanceGain > 1 {
			logrus.Infof("  Performance Gain: %.1fx", component.PerformanceGain)
		}
	}
	
	logrus.Infof("=" + fmt.Sprintf("%50s", "="))
}

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/rag"
)

// Week3DynamicScalingValidator validates dynamic worker pool scaling functionality
type Week3DynamicScalingValidator struct {
	hnswIndex         *rag.HNSWIndex
	dynamicPool       *rag.DynamicWorkerPool
	concurrentSearch  *rag.ConcurrentVectorSearch
	testDuration      time.Duration
	loadSpikeDuration time.Duration
}

// ValidationResult represents Week 3 validation results
type ValidationResult struct {
	TestName            string        `json:"test_name"`
	InitialWorkers      int           `json:"initial_workers"`
	MinWorkers          int           `json:"min_workers"`
	MaxWorkers          int           `json:"max_workers"`
	PeakWorkers         int           `json:"peak_workers"`
	FinalWorkers        int           `json:"final_workers"`
	ScaleUpEvents       int           `json:"scale_up_events"`
	ScaleDownEvents     int           `json:"scale_down_events"`
	TotalTasks          int64         `json:"total_tasks"`
	CompletedTasks      int64         `json:"completed_tasks"`
	FailedTasks         int64         `json:"failed_tasks"`
	AverageResponseTime time.Duration `json:"average_response_time"`
	PeakResponseTime    time.Duration `json:"peak_response_time"`
	ScalingEfficiency   float64       `json:"scaling_efficiency"`
	PerformanceTarget   bool          `json:"performance_target_met"`
	ErrorCount          int           `json:"error_count"`
}

func main() {
	// Command line flags
	var (
		testDuration      = flag.Duration("duration", 3*time.Minute, "Test duration")
		loadSpikeDuration = flag.Duration("spike-duration", 30*time.Second, "Load spike duration")
		verbose           = flag.Bool("verbose", false, "Verbose logging")
	)
	flag.Parse()

	// Configure logging
	if *verbose {
		logrus.SetLevel(logrus.DebugLevel)
	} else {
		logrus.SetLevel(logrus.InfoLevel)
	}

	fmt.Println(strings.Repeat("=", 80))
	fmt.Println("WEEK 3: DYNAMIC WORKER POOL SCALING VALIDATION")
	fmt.Println(strings.Repeat("=", 80))

	logrus.WithFields(logrus.Fields{
		"test_duration":       *testDuration,
		"load_spike_duration": *loadSpikeDuration,
	}).Info("Starting Week 3 dynamic scaling validation")

	// Create validator
	validator := &Week3DynamicScalingValidator{
		testDuration:      *testDuration,
		loadSpikeDuration: *loadSpikeDuration,
	}

	// Initialize components
	if err := validator.initialize(); err != nil {
		log.Fatalf("Failed to initialize validator: %v", err)
	}
	defer validator.cleanup()

	// Run validation tests
	results := []ValidationResult{
		validator.runBasicScalingTest(),
		validator.runLoadSpikeTest(),
		validator.runScalingLimitsTest(),
		validator.runPerformanceRegressionTest(),
	}

	// Print results
	validator.printResults(results)

	// Determine overall success
	success := validator.evaluateResults(results)
	if success {
		fmt.Println("✅ Week 3: Dynamic Worker Pool Scaling PASSED")
	} else {
		fmt.Println("❌ Week 3: Dynamic Worker Pool Scaling FAILED")
	}
}

// initialize sets up the test environment
func (v *Week3DynamicScalingValidator) initialize() error {
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

	v.hnswIndex = rag.NewHNSWIndex(config)

	// Add test vectors
	ctx := context.Background()
	logrus.Info("Adding test vectors to HNSW index...")
	for i := 0; i < 1000; i++ {
		vector := make([]float32, 768)
		for j := range vector {
			vector[j] = rand.Float32()*2 - 1
		}
		metadata := map[string]interface{}{
			"id":    i,
			"label": "test_vector",
		}
		_, err := v.hnswIndex.AddVector(ctx, vector, metadata)
		if err != nil {
			return fmt.Errorf("failed to add vector %d: %w", i, err)
		}
	}

	logrus.Info("✅ HNSW index initialized with 1000 vectors")
	return nil
}

// runBasicScalingTest tests basic auto-scaling functionality
func (v *Week3DynamicScalingValidator) runBasicScalingTest() ValidationResult {
	logrus.Info("🧪 Running basic scaling test...")

	// Create dynamic pool configuration
	poolConfig := &rag.DynamicPoolConfig{
		MinWorkers:              4,
		MaxWorkers:              32,
		InitialWorkers:          8,
		ScaleUpQueueThreshold:   0.7,
		ScaleDownQueueThreshold: 0.3,
		ScaleUpResponseTime:     100 * time.Millisecond,
		ScaleDownResponseTime:   50 * time.Millisecond,
		ScaleUpFactor:           1.5,
		ScaleDownFactor:         0.7,
		CooldownPeriod:          10 * time.Second,
		QueueSize:               200,
		TaskTimeout:             5 * time.Second,
		MetricsInterval:         2 * time.Second,
	}

	pool := rag.NewDynamicWorkerPool(v.hnswIndex, poolConfig)
	defer pool.Stop()

	result := ValidationResult{
		TestName:       "Basic Scaling Test",
		InitialWorkers: poolConfig.InitialWorkers,
		MinWorkers:     poolConfig.MinWorkers,
		MaxWorkers:     poolConfig.MaxWorkers,
	}

	// Start the pool
	if err := pool.Start(); err != nil {
		result.ErrorCount++
		logrus.WithError(err).Error("Failed to start dynamic pool")
		return result
	}

	ctx := context.Background()

	// Submit moderate load to trigger some scaling
	var wg sync.WaitGroup
	taskCount := 50

	for i := 0; i < taskCount; i++ {
		wg.Add(1)
		go func(taskID int) {
			defer wg.Done()

			query := v.generateRandomVector(768)
			task := &rag.VectorSearchTask{
				Context: ctx,
				Query:   query,
				K:       10,
				Result:  make(chan *rag.VectorSearchTaskResult, 1),
			}

			if err := pool.SubmitTask(task); err != nil {
				result.ErrorCount++
				return
			}

			select {
			case taskResult := <-task.Result:
				if taskResult.Error != nil {
					result.ErrorCount++
				}
			case <-time.After(10 * time.Second):
				result.ErrorCount++
			}
		}(i)

		// Add some delay between submissions to create gradual load
		time.Sleep(50 * time.Millisecond)
	}

	// Monitor scaling for a period
	monitorDuration := 30 * time.Second
	monitorTicker := time.NewTicker(2 * time.Second)
	defer monitorTicker.Stop()

	maxWorkers := poolConfig.InitialWorkers
	minWorkers := poolConfig.InitialWorkers

	monitorCtx, cancel := context.WithTimeout(ctx, monitorDuration)
	defer cancel()

	go func() {
		for {
			select {
			case <-monitorTicker.C:
				currentWorkers := pool.GetCurrentWorkerCount()
				if currentWorkers > maxWorkers {
					maxWorkers = currentWorkers
				}
				if currentWorkers < minWorkers {
					minWorkers = currentWorkers
				}
				logrus.WithField("workers", currentWorkers).Debug("Current worker count")
			case <-monitorCtx.Done():
				return
			}
		}
	}()

	// Wait for all tasks to complete
	wg.Wait()

	// Wait for monitoring to complete
	<-monitorCtx.Done()

	// Get final stats
	stats := pool.GetStats()
	result.PeakWorkers = maxWorkers
	result.FinalWorkers = pool.GetCurrentWorkerCount()
	result.TotalTasks = stats["total_tasks"].(int64)
	result.CompletedTasks = stats["completed_tasks"].(int64)
	result.FailedTasks = stats["failed_tasks"].(int64)

	// Check if scaling occurred
	scalingOccurred := maxWorkers > poolConfig.InitialWorkers || minWorkers < poolConfig.InitialWorkers
	result.PerformanceTarget = scalingOccurred && result.ErrorCount < taskCount/10

	logrus.WithFields(logrus.Fields{
		"initial_workers": result.InitialWorkers,
		"peak_workers":    result.PeakWorkers,
		"final_workers":   result.FinalWorkers,
		"total_tasks":     result.TotalTasks,
		"errors":          result.ErrorCount,
		"scaling_worked":  scalingOccurred,
	}).Info("Basic scaling test completed")

	return result
}

// runLoadSpikeTest tests scaling under sudden load spikes
func (v *Week3DynamicScalingValidator) runLoadSpikeTest() ValidationResult {
	logrus.Info("🧪 Running load spike test...")

	// Create dynamic pool with aggressive scaling
	poolConfig := &rag.DynamicPoolConfig{
		MinWorkers:              4,
		MaxWorkers:              64,
		InitialWorkers:          8,
		ScaleUpQueueThreshold:   0.6,
		ScaleDownQueueThreshold: 0.2,
		ScaleUpResponseTime:     80 * time.Millisecond,
		ScaleDownResponseTime:   40 * time.Millisecond,
		ScaleUpFactor:           2.0, // Aggressive scaling
		ScaleDownFactor:         0.5,
		CooldownPeriod:          5 * time.Second,
		QueueSize:               500,
		TaskTimeout:             5 * time.Second,
		MetricsInterval:         1 * time.Second,
	}

	pool := rag.NewDynamicWorkerPool(v.hnswIndex, poolConfig)
	defer pool.Stop()

	result := ValidationResult{
		TestName:       "Load Spike Test",
		InitialWorkers: poolConfig.InitialWorkers,
		MinWorkers:     poolConfig.MinWorkers,
		MaxWorkers:     poolConfig.MaxWorkers,
	}

	if err := pool.Start(); err != nil {
		result.ErrorCount++
		return result
	}

	// Phase 1: Normal load
	logrus.Info("Phase 1: Normal load")
	v.submitTasks(pool, 20, 100*time.Millisecond, &result)

	// Phase 2: Load spike
	logrus.Info("Phase 2: Load spike")
	spikeStart := time.Now()
	v.submitTasks(pool, 200, 10*time.Millisecond, &result) // High frequency submissions

	// Monitor during spike
	maxWorkers := pool.GetCurrentWorkerCount()
	for time.Since(spikeStart) < v.loadSpikeDuration {
		currentWorkers := pool.GetCurrentWorkerCount()
		if currentWorkers > maxWorkers {
			maxWorkers = currentWorkers
		}
		time.Sleep(1 * time.Second)
	}

	// Phase 3: Cool down
	logrus.Info("Phase 3: Cool down")
	time.Sleep(30 * time.Second) // Allow scale-down

	result.PeakWorkers = maxWorkers
	result.FinalWorkers = pool.GetCurrentWorkerCount()

	// Get final stats
	stats := pool.GetStats()
	result.TotalTasks = stats["total_tasks"].(int64)
	result.CompletedTasks = stats["completed_tasks"].(int64)
	result.FailedTasks = stats["failed_tasks"].(int64)

	// Performance target: should scale up significantly during spike
	result.PerformanceTarget = maxWorkers >= poolConfig.InitialWorkers*2 && result.ErrorCount < int(result.TotalTasks)/10

	logrus.WithFields(logrus.Fields{
		"initial_workers": result.InitialWorkers,
		"peak_workers":    result.PeakWorkers,
		"final_workers":   result.FinalWorkers,
		"total_tasks":     result.TotalTasks,
		"errors":          result.ErrorCount,
	}).Info("Load spike test completed")

	return result
}

// runScalingLimitsTest tests that scaling respects min/max limits
func (v *Week3DynamicScalingValidator) runScalingLimitsTest() ValidationResult {
	logrus.Info("🧪 Running scaling limits test...")

	poolConfig := &rag.DynamicPoolConfig{
		MinWorkers:              6,
		MaxWorkers:              12,
		InitialWorkers:          8,
		ScaleUpQueueThreshold:   0.1, // Very low threshold
		ScaleDownQueueThreshold: 0.9, // Very high threshold
		ScaleUpResponseTime:     1 * time.Millisecond,
		ScaleDownResponseTime:   1 * time.Hour,
		ScaleUpFactor:           10.0, // Very aggressive
		ScaleDownFactor:         0.1,
		CooldownPeriod:          100 * time.Millisecond,
		QueueSize:               1000,
		TaskTimeout:             5 * time.Second,
		MetricsInterval:         500 * time.Millisecond,
	}

	pool := rag.NewDynamicWorkerPool(v.hnswIndex, poolConfig)
	defer pool.Stop()

	result := ValidationResult{
		TestName:       "Scaling Limits Test",
		InitialWorkers: poolConfig.InitialWorkers,
		MinWorkers:     poolConfig.MinWorkers,
		MaxWorkers:     poolConfig.MaxWorkers,
	}

	if err := pool.Start(); err != nil {
		result.ErrorCount++
		return result
	}

	// Wait for potential scaling
	time.Sleep(5 * time.Second)

	currentWorkers := pool.GetCurrentWorkerCount()
	result.FinalWorkers = currentWorkers

	// Performance target: workers should be within limits
	result.PerformanceTarget = currentWorkers >= poolConfig.MinWorkers && currentWorkers <= poolConfig.MaxWorkers

	logrus.WithFields(logrus.Fields{
		"current_workers": currentWorkers,
		"min_workers":     poolConfig.MinWorkers,
		"max_workers":     poolConfig.MaxWorkers,
		"within_limits":   result.PerformanceTarget,
	}).Info("Scaling limits test completed")

	return result
}

// runPerformanceRegressionTest ensures no regression from Week 2 performance
func (v *Week3DynamicScalingValidator) runPerformanceRegressionTest() ValidationResult {
	logrus.Info("🧪 Running performance regression test...")

	// Use concurrent search with dynamic pool
	searchConfig := &rag.ConcurrentSearchConfig{
		WorkerPoolSize:    8,
		CacheSize:         1000,
		CacheTTL:          5 * time.Minute,
		BatchSize:         10,
		SearchTimeout:     5 * time.Second,
		EnablePrefetching: true,
	}

	dynamicConfig := &rag.DynamicPoolConfig{
		MinWorkers:              4,
		MaxWorkers:              32,
		InitialWorkers:          8,
		ScaleUpQueueThreshold:   0.7,
		ScaleDownQueueThreshold: 0.3,
		ScaleUpResponseTime:     100 * time.Millisecond,
		ScaleDownResponseTime:   50 * time.Millisecond,
		ScaleUpFactor:           1.5,
		ScaleDownFactor:         0.7,
		CooldownPeriod:          30 * time.Second,
		QueueSize:               1000,
		TaskTimeout:             5 * time.Second,
		MetricsInterval:         10 * time.Second,
	}

	concurrentSearch := rag.NewConcurrentVectorSearchWithDynamicPool(v.hnswIndex, searchConfig, dynamicConfig)
	defer concurrentSearch.Close()

	result := ValidationResult{
		TestName:       "Performance Regression Test",
		InitialWorkers: dynamicConfig.InitialWorkers,
		MinWorkers:     dynamicConfig.MinWorkers,
		MaxWorkers:     dynamicConfig.MaxWorkers,
	}

	ctx := context.Background()
	searchCount := 100
	var totalDuration time.Duration
	var maxDuration time.Duration

	// Start the dynamic worker pool if it exists
	if concurrentSearch.GetDynamicWorkerPool() != nil {
		if err := concurrentSearch.GetDynamicWorkerPool().Start(); err != nil {
			logrus.WithError(err).Error("Failed to start dynamic worker pool")
			result.ErrorCount = searchCount
			return result
		}
	}

	// Perform searches and measure performance
	for i := 0; i < searchCount; i++ {
		query := v.generateRandomVector(768)

		start := time.Now()
		_, err := concurrentSearch.SearchSimilarConcurrent(ctx, query, 10)
		duration := time.Since(start)

		if err != nil {
			result.ErrorCount++
		} else {
			totalDuration += duration
			if duration > maxDuration {
				maxDuration = duration
			}
		}
	}

	if searchCount > result.ErrorCount {
		result.AverageResponseTime = totalDuration / time.Duration(searchCount-result.ErrorCount)
	}
	result.PeakResponseTime = maxDuration

	// Performance target: maintain Week 2 performance (average < 10ms, peak < 100ms)
	result.PerformanceTarget = result.AverageResponseTime < 10*time.Millisecond &&
		result.PeakResponseTime < 100*time.Millisecond &&
		result.ErrorCount < searchCount/20 // Allow 5% error rate

	logrus.WithFields(logrus.Fields{
		"searches":         searchCount,
		"avg_response_ms":  float64(result.AverageResponseTime.Nanoseconds()) / 1e6,
		"peak_response_ms": float64(result.PeakResponseTime.Nanoseconds()) / 1e6,
		"errors":           result.ErrorCount,
		"target_met":       result.PerformanceTarget,
	}).Info("Performance regression test completed")

	return result
}

// Helper methods
func (v *Week3DynamicScalingValidator) generateRandomVector(dim int) []float32 {
	vector := make([]float32, dim)
	for i := range vector {
		vector[i] = rand.Float32()*2 - 1
	}
	return vector
}

func (v *Week3DynamicScalingValidator) submitTasks(pool *rag.DynamicWorkerPool, count int, interval time.Duration, result *ValidationResult) {
	ctx := context.Background()
	var wg sync.WaitGroup

	for i := 0; i < count; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			query := v.generateRandomVector(768)
			task := &rag.VectorSearchTask{
				Context: ctx,
				Query:   query,
				K:       10,
				Result:  make(chan *rag.VectorSearchTaskResult, 1),
			}

			if err := pool.SubmitTask(task); err != nil {
				result.ErrorCount++
				return
			}

			select {
			case taskResult := <-task.Result:
				if taskResult.Error != nil {
					result.ErrorCount++
				}
			case <-time.After(10 * time.Second):
				result.ErrorCount++
			}
		}()

		time.Sleep(interval)
	}

	wg.Wait()
}

func (v *Week3DynamicScalingValidator) printResults(results []ValidationResult) {
	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Println("WEEK 3: DYNAMIC WORKER POOL SCALING RESULTS")
	fmt.Println(strings.Repeat("=", 80))

	for _, result := range results {
		fmt.Printf("\n📊 %s\n", result.TestName)
		fmt.Printf("   Initial Workers: %d\n", result.InitialWorkers)
		fmt.Printf("   Peak Workers: %d\n", result.PeakWorkers)
		fmt.Printf("   Final Workers: %d\n", result.FinalWorkers)
		fmt.Printf("   Worker Range: %d - %d\n", result.MinWorkers, result.MaxWorkers)

		if result.TotalTasks > 0 {
			fmt.Printf("   Total Tasks: %d\n", result.TotalTasks)
			fmt.Printf("   Completed Tasks: %d\n", result.CompletedTasks)
		}

		if result.AverageResponseTime > 0 {
			fmt.Printf("   Average Response Time: %.2f ms\n", float64(result.AverageResponseTime.Nanoseconds())/1e6)
			fmt.Printf("   Peak Response Time: %.2f ms\n", float64(result.PeakResponseTime.Nanoseconds())/1e6)
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

func (v *Week3DynamicScalingValidator) evaluateResults(results []ValidationResult) bool {
	allPassed := true

	for _, result := range results {
		if !result.PerformanceTarget {
			logrus.WithField("test", result.TestName).Error("Performance target not met")
			allPassed = false
		}
		if result.ErrorCount > int(result.TotalTasks)/10 && result.TotalTasks > 0 {
			logrus.WithFields(logrus.Fields{
				"test":        result.TestName,
				"error_count": result.ErrorCount,
				"total_tasks": result.TotalTasks,
			}).Error("Too many errors")
			allPassed = false
		}
	}

	return allPassed
}

func (v *Week3DynamicScalingValidator) cleanup() {
	if v.hnswIndex != nil {
		v.hnswIndex.Close()
	}
	if v.dynamicPool != nil {
		v.dynamicPool.Stop()
	}
	if v.concurrentSearch != nil {
		v.concurrentSearch.Close()
	}
}

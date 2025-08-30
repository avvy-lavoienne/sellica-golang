package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/rag"
)

// MemoryOptimizationValidator validates memory optimization improvements
type MemoryOptimizationValidator struct {
	ragService    *rag.RedisRAGService
	redisClient   *redis.Client
	testDuration  time.Duration
	operationRate int // operations per second
}

// ValidationResult represents the results of memory optimization validation
type ValidationResult struct {
	TestName              string        `json:"test_name"`
	Duration              time.Duration `json:"duration"`
	TotalOperations       int           `json:"total_operations"`
	InitialMemoryMB       float64       `json:"initial_memory_mb"`
	FinalMemoryMB         float64       `json:"final_memory_mb"`
	PeakMemoryMB          float64       `json:"peak_memory_mb"`
	MemoryLeakDetected    bool          `json:"memory_leak_detected"`
	AverageResponseTimeMs float64       `json:"average_response_time_ms"`
	SuccessRate           float64       `json:"success_rate"`
	ErrorCount            int           `json:"error_count"`
	GCCount               uint32        `json:"gc_count"`
	MaxGoroutines         int           `json:"max_goroutines"`
}

func main() {
	// Command line flags
	var (
		redisAddr     = flag.String("redis-addr", "localhost:6379", "Redis address")
		testDuration  = flag.Duration("duration", 5*time.Minute, "Test duration")
		operationRate = flag.Int("rate", 10, "Operations per second")
		verbose       = flag.Bool("verbose", false, "Verbose logging")
	)
	flag.Parse()

	// Configure logging
	if *verbose {
		logrus.SetLevel(logrus.DebugLevel)
	} else {
		logrus.SetLevel(logrus.InfoLevel)
	}

	logrus.Info("🚀 Starting Memory Optimization Validation")
	logrus.WithFields(logrus.Fields{
		"redis_addr":     *redisAddr,
		"test_duration":  *testDuration,
		"operation_rate": *operationRate,
	}).Info("Configuration")

	// Create validator
	validator := &MemoryOptimizationValidator{
		testDuration:  *testDuration,
		operationRate: *operationRate,
	}

	// Initialize Redis connection
	if err := validator.initializeRedis(*redisAddr); err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer validator.cleanup()

	// Initialize RAG service
	if err := validator.initializeRAGService(); err != nil {
		log.Fatalf("Failed to initialize RAG service: %v", err)
	}

	// Run validation tests
	results := []ValidationResult{
		validator.runMemoryLeakTest(),
		validator.runSustainedLoadTest(),
		validator.runContextCancellationTest(),
		validator.runResourceCleanupTest(),
	}

	// Print results
	validator.printResults(results)

	// Determine overall success
	success := validator.evaluateResults(results)
	if success {
		logrus.Info("✅ Memory optimization validation PASSED")
		os.Exit(0)
	} else {
		logrus.Error("❌ Memory optimization validation FAILED")
		os.Exit(1)
	}
}

// initializeRedis initializes Redis connection
func (v *MemoryOptimizationValidator) initializeRedis(addr string) error {
	v.redisClient = redis.NewClient(&redis.Options{
		Addr:         addr,
		DB:           1, // Use test database
		DialTimeout:  10 * time.Second,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := v.redisClient.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logrus.Info("✅ Redis connection established")
	return nil
}

// initializeRAGService initializes the RAG service
func (v *MemoryOptimizationValidator) initializeRAGService() error {
	v.ragService = rag.NewRedisRAGService(v.redisClient)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := v.ragService.Initialize(ctx); err != nil {
		return fmt.Errorf("failed to initialize RAG service: %w", err)
	}

	logrus.Info("✅ RAG service initialized")
	return nil
}

// runMemoryLeakTest tests for memory leaks during sustained operations
func (v *MemoryOptimizationValidator) runMemoryLeakTest() ValidationResult {
	logrus.Info("🧪 Running memory leak test...")

	ctx := context.Background()
	startTime := time.Now()

	// Force garbage collection before starting
	runtime.GC()
	runtime.GC()
	time.Sleep(100 * time.Millisecond)

	var initialStats runtime.MemStats
	runtime.ReadMemStats(&initialStats)

	result := ValidationResult{
		TestName:        "Memory Leak Test",
		InitialMemoryMB: float64(initialStats.Alloc) / 1024 / 1024,
	}

	// Run operations for test duration
	ticker := time.NewTicker(time.Second / time.Duration(v.operationRate))
	defer ticker.Stop()

	endTime := startTime.Add(v.testDuration)
	var totalOperations int
	var successfulOperations int
	var totalResponseTime time.Duration
	var peakMemory float64

	for time.Now().Before(endTime) {
		select {
		case <-ticker.C:
			opStart := time.Now()

			// Perform RAG operation
			query := fmt.Sprintf("test query %d for memory leak detection", totalOperations)
			_, err := v.ragService.RetrieveContext(ctx, query, 5)

			opDuration := time.Since(opStart)
			totalResponseTime += opDuration
			totalOperations++

			if err == nil {
				successfulOperations++
			} else {
				result.ErrorCount++
			}

			// Check memory usage every 100 operations
			if totalOperations%100 == 0 {
				var currentStats runtime.MemStats
				runtime.ReadMemStats(&currentStats)
				currentMemory := float64(currentStats.Alloc) / 1024 / 1024

				if currentMemory > peakMemory {
					peakMemory = currentMemory
				}

				// Force GC periodically to test cleanup
				if totalOperations%500 == 0 {
					runtime.GC()
				}
			}
		}
	}

	// Final memory check
	runtime.GC()
	runtime.GC()
	time.Sleep(200 * time.Millisecond)

	var finalStats runtime.MemStats
	runtime.ReadMemStats(&finalStats)

	result.Duration = time.Since(startTime)
	result.TotalOperations = totalOperations
	result.FinalMemoryMB = float64(finalStats.Alloc) / 1024 / 1024
	result.PeakMemoryMB = peakMemory
	result.SuccessRate = float64(successfulOperations) / float64(totalOperations) * 100
	result.GCCount = finalStats.NumGC - initialStats.NumGC
	result.MaxGoroutines = runtime.NumGoroutine()

	if totalOperations > 0 {
		result.AverageResponseTimeMs = float64(totalResponseTime.Nanoseconds()) / float64(totalOperations) / 1e6
	}

	// Detect memory leak (more than 50MB increase)
	memoryIncrease := result.FinalMemoryMB - result.InitialMemoryMB
	result.MemoryLeakDetected = memoryIncrease > 50.0

	logrus.WithFields(logrus.Fields{
		"total_operations":   result.TotalOperations,
		"memory_increase_mb": memoryIncrease,
		"peak_memory_mb":     result.PeakMemoryMB,
		"success_rate":       result.SuccessRate,
		"avg_response_ms":    result.AverageResponseTimeMs,
		"memory_leak":        result.MemoryLeakDetected,
	}).Info("Memory leak test completed")

	return result
}

// runSustainedLoadTest tests performance under sustained load
func (v *MemoryOptimizationValidator) runSustainedLoadTest() ValidationResult {
	logrus.Info("🧪 Running sustained load test...")

	// Similar implementation to memory leak test but with higher operation rate
	// This is a simplified version - full implementation would be similar to above
	result := ValidationResult{
		TestName: "Sustained Load Test",
		Duration: time.Minute, // Shorter duration for sustained load
	}

	// Implementation details...
	logrus.Info("Sustained load test completed")
	return result
}

// runContextCancellationTest tests context cancellation handling
func (v *MemoryOptimizationValidator) runContextCancellationTest() ValidationResult {
	logrus.Info("🧪 Running context cancellation test...")

	result := ValidationResult{
		TestName: "Context Cancellation Test",
	}

	// Test immediate cancellation
	cancelCtx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := v.ragService.RetrieveContext(cancelCtx, "test query", 5)
	if err == nil {
		result.ErrorCount++
		logrus.Warn("Expected error for cancelled context, but got none")
	}

	// Test timeout
	timeoutCtx, timeoutCancel := context.WithTimeout(context.Background(), 1*time.Nanosecond)
	defer timeoutCancel()
	time.Sleep(10 * time.Millisecond)

	_, err = v.ragService.RetrieveContext(timeoutCtx, "test query", 5)
	if err == nil {
		result.ErrorCount++
		logrus.Warn("Expected error for timed out context, but got none")
	}

	result.SuccessRate = 100.0 // Success means proper error handling
	if result.ErrorCount > 0 {
		result.SuccessRate = 0.0
	}

	logrus.Info("Context cancellation test completed")
	return result
}

// runResourceCleanupTest tests proper resource cleanup
func (v *MemoryOptimizationValidator) runResourceCleanupTest() ValidationResult {
	logrus.Info("🧪 Running resource cleanup test...")

	result := ValidationResult{
		TestName: "Resource Cleanup Test",
	}

	// Test service close and cleanup
	err := v.ragService.Close()
	if err != nil {
		result.ErrorCount++
		logrus.WithError(err).Error("Failed to close RAG service")
	}

	// Reinitialize for other tests
	v.initializeRAGService()

	result.SuccessRate = 100.0
	if result.ErrorCount > 0 {
		result.SuccessRate = 0.0
	}

	logrus.Info("Resource cleanup test completed")
	return result
}

// printResults prints validation results
func (v *MemoryOptimizationValidator) printResults(results []ValidationResult) {
	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Println("MEMORY OPTIMIZATION VALIDATION RESULTS")
	fmt.Println(strings.Repeat("=", 80))

	for _, result := range results {
		fmt.Printf("\n📊 %s\n", result.TestName)
		fmt.Printf("   Duration: %v\n", result.Duration)
		fmt.Printf("   Operations: %d\n", result.TotalOperations)
		fmt.Printf("   Success Rate: %.2f%%\n", result.SuccessRate)
		fmt.Printf("   Errors: %d\n", result.ErrorCount)

		if result.TotalOperations > 0 {
			fmt.Printf("   Avg Response Time: %.2f ms\n", result.AverageResponseTimeMs)
			fmt.Printf("   Initial Memory: %.2f MB\n", result.InitialMemoryMB)
			fmt.Printf("   Final Memory: %.2f MB\n", result.FinalMemoryMB)
			fmt.Printf("   Peak Memory: %.2f MB\n", result.PeakMemoryMB)
			fmt.Printf("   Memory Leak: %v\n", result.MemoryLeakDetected)
			fmt.Printf("   GC Count: %d\n", result.GCCount)
			fmt.Printf("   Max Goroutines: %d\n", result.MaxGoroutines)
		}
	}

	fmt.Println("\n" + strings.Repeat("=", 80))
}

// evaluateResults evaluates overall success
func (v *MemoryOptimizationValidator) evaluateResults(results []ValidationResult) bool {
	for _, result := range results {
		if result.MemoryLeakDetected {
			logrus.WithField("test", result.TestName).Error("Memory leak detected")
			return false
		}
		if result.SuccessRate < 95.0 {
			logrus.WithFields(logrus.Fields{
				"test":         result.TestName,
				"success_rate": result.SuccessRate,
			}).Error("Success rate too low")
			return false
		}
	}
	return true
}

// cleanup cleans up resources
func (v *MemoryOptimizationValidator) cleanup() {
	if v.ragService != nil {
		v.ragService.Close()
	}
	if v.redisClient != nil {
		v.redisClient.Close()
	}
}

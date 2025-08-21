package concurrent

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"selly-backend/internal/services/monitoring"
)

// IntegrationTestAIService implements a realistic AI service for integration testing
type IntegrationTestAIService struct {
	processingTime time.Duration
	failureRate    float64
	requestCount   int64
	mu             sync.Mutex
}

func NewIntegrationTestAIService(processingTime time.Duration, failureRate float64) *IntegrationTestAIService {
	return &IntegrationTestAIService{
		processingTime: processingTime,
		failureRate:    failureRate,
	}
}

func (s *IntegrationTestAIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	s.mu.Lock()
	s.requestCount++
	currentCount := s.requestCount
	s.mu.Unlock()

	// Simulate processing time
	time.Sleep(s.processingTime)

	// Simulate failures based on failure rate
	if s.failureRate > 0 && float64(currentCount%10) < s.failureRate*10 {
		return nil, fmt.Errorf("simulated AI service failure")
	}

	return &AIResponse{
		Content:        fmt.Sprintf("Response to: %s", req.Query),
		Type:           "text",
		Confidence:     0.85,
		Model:          "integration-test-model",
		ProcessingTime: float64(s.processingTime.Milliseconds()),
		CacheHit:       false,
		CacheLayer:     "none",
	}, nil
}

func (s *IntegrationTestAIService) ProcessSessionQuery(ctx context.Context, req *SessionAIRequest) (*AIResponse, error) {
	// Convert to regular request for simplicity
	aiReq := &AIRequest{
		Query:   req.Query,
		UserID:  req.UserID,
		Context: req.Context,
	}
	return s.ProcessQuery(ctx, aiReq)
}

// TestIntegration_FullWorkflow tests the complete concurrent processing workflow
func TestIntegration_FullWorkflow(t *testing.T) {
	// Create a realistic AI service
	aiService := NewIntegrationTestAIService(50*time.Millisecond, 0.1) // 10% failure rate
	monitoring := monitoring.NewService()

	config := &ConcurrentAIConfig{
		MaxConcurrentRequests: 20,
		RequestTimeout:        5 * time.Second,
		QueueSize:             50,
		WorkerPoolConfig: WorkerPoolConfig{
			Workers:   5,
			QueueSize: 25,
		},
		RateLimiterConfig: RateLimiterConfig{
			Name:              "integration-test",
			RequestsPerSecond: 50,
			BurstCapacity:     20,
		},
		CircuitBreakerConfig: CircuitBreakerConfig{
			Name:         "integration-test",
			MaxFailures:  5,
			ResetTimeout: 2 * time.Second,
		},
	}

	cam, err := NewConcurrentAIManager(config, aiService, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	// Test single request processing
	t.Run("SingleRequest", func(t *testing.T) {
		req := &AIRequest{
			Query:   "What is the weather today?",
			UserID:  "user123",
			Context: map[string]interface{}{"location": "Jakarta"},
		}

		ctx := context.Background()
		response, err := cam.ProcessRequest(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Contains(t, response.Content, "What is the weather today?")
		assert.Equal(t, "text", response.Type)
		assert.Greater(t, response.Confidence, 0.0)
	})

	// Test concurrent request processing
	t.Run("ConcurrentRequests", func(t *testing.T) {
		requests := make([]*AIRequest, 10)
		for i := 0; i < 10; i++ {
			requests[i] = &AIRequest{
				Query:   fmt.Sprintf("Query %d", i),
				UserID:  fmt.Sprintf("user%d", i),
				Context: map[string]interface{}{"index": i},
			}
		}

		ctx := context.Background()
		start := time.Now()
		responses, err := cam.ProcessConcurrentRequests(ctx, requests)
		duration := time.Since(start)

		assert.NoError(t, err)
		assert.Len(t, responses, 10)

		// Should be faster than sequential processing
		expectedSequentialTime := time.Duration(len(requests)) * 50 * time.Millisecond
		assert.Less(t, duration, expectedSequentialTime)

		// Verify all responses
		for i, response := range responses {
			if response != nil {
				assert.Contains(t, response.Content, fmt.Sprintf("Query %d", i))
			}
		}
	})

	// Test high load scenario
	t.Run("HighLoad", func(t *testing.T) {
		var wg sync.WaitGroup
		var successCount int64
		var errorCount int64
		var mu sync.Mutex

		// Submit many concurrent requests
		for i := 0; i < 100; i++ {
			wg.Add(1)
			go func(index int) {
				defer wg.Done()

				req := &AIRequest{
					Query:  fmt.Sprintf("High load query %d", index),
					UserID: fmt.Sprintf("user%d", index),
				}

				ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
				defer cancel()

				_, err := cam.ProcessRequest(ctx, req)

				mu.Lock()
				if err != nil {
					errorCount++
				} else {
					successCount++
				}
				mu.Unlock()
			}(i)
		}

		wg.Wait()

		// Should handle most requests successfully
		totalRequests := successCount + errorCount
		successRate := float64(successCount) / float64(totalRequests)
		
		assert.Equal(t, int64(100), totalRequests)
		assert.Greater(t, successRate, 0.5) // At least 50% success rate
		
		t.Logf("High load test: %d success, %d errors, %.2f%% success rate", 
			successCount, errorCount, successRate*100)
	})

	// Test metrics and monitoring
	t.Run("MetricsAndMonitoring", func(t *testing.T) {
		// Process some requests to generate metrics
		for i := 0; i < 5; i++ {
			req := &AIRequest{
				Query:  fmt.Sprintf("Metrics test query %d", i),
				UserID: "metrics-user",
			}
			cam.ProcessRequest(context.Background(), req)
		}

		// Check concurrent AI manager metrics
		metrics := cam.GetMetrics()
		assert.Greater(t, metrics.TotalRequests, int64(0))
		assert.GreaterOrEqual(t, metrics.CompletedRequests, int64(0))
		assert.Greater(t, metrics.AverageResponseTime, 0.0)

		// Check worker pool metrics
		status := cam.GetStatus()
		workerPoolStatus := status["worker_pool"].(map[string]interface{})
		assert.Greater(t, workerPoolStatus["completed_tasks"].(int64), int64(0))

		// Check rate limiter metrics
		rateLimiterStatus := status["rate_limiter"].(map[string]interface{})
		assert.Greater(t, rateLimiterStatus["total_requests"].(int64), int64(0))

		// Check circuit breaker metrics
		circuitBreakerStatus := status["circuit_breaker"].(map[string]interface{})
		assert.Equal(t, "closed", circuitBreakerStatus["state"].(string))
	})

	// Test health checking
	t.Run("HealthCheck", func(t *testing.T) {
		assert.True(t, cam.IsHealthy())

		// All components should be healthy
		status := cam.GetStatus()
		assert.True(t, status["running"].(bool))
		
		workerPoolStatus := status["worker_pool"].(map[string]interface{})
		assert.True(t, workerPoolStatus["running"].(bool))
	})
}

// TestIntegration_ErrorRecovery tests error recovery scenarios
func TestIntegration_ErrorRecovery(t *testing.T) {
	// Create AI service with high failure rate
	aiService := NewIntegrationTestAIService(10*time.Millisecond, 0.8) // 80% failure rate
	monitoring := monitoring.NewService()

	config := &ConcurrentAIConfig{
		CircuitBreakerConfig: CircuitBreakerConfig{
			Name:         "error-recovery-test",
			MaxFailures:  3,
			ResetTimeout: 500 * time.Millisecond,
		},
		RateLimiterConfig: RateLimiterConfig{
			RequestsPerSecond: 100,
			BurstCapacity:     50,
		},
		WorkerPoolConfig: WorkerPoolConfig{
			Workers:   3,
			QueueSize: 10,
		},
	}

	cam, err := NewConcurrentAIManager(config, aiService, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	// Generate failures to open circuit breaker
	req := &AIRequest{
		Query:  "Test query",
		UserID: "test-user",
	}

	ctx := context.Background()
	
	// Should eventually trigger circuit breaker
	var circuitBreakerTriggered bool
	for i := 0; i < 10; i++ {
		_, err := cam.ProcessRequest(ctx, req)
		if err != nil && fmt.Sprintf("%v", err) == "circuit breaker is open" {
			circuitBreakerTriggered = true
			break
		}
		time.Sleep(10 * time.Millisecond)
	}

	assert.True(t, circuitBreakerTriggered, "Circuit breaker should have been triggered")

	// Wait for circuit breaker to reset
	time.Sleep(600 * time.Millisecond)

	// Should allow requests again (though they may still fail)
	_, err = cam.ProcessRequest(ctx, req)
	// Error is acceptable, but should not be circuit breaker error
	if err != nil {
		assert.NotContains(t, err.Error(), "circuit breaker is open")
	}
}

// TestIntegration_PerformanceComparison compares concurrent vs sequential processing
func TestIntegration_PerformanceComparison(t *testing.T) {
	aiService := NewIntegrationTestAIService(20*time.Millisecond, 0.0) // No failures
	monitoring := monitoring.NewService()

	cam, err := NewConcurrentAIManager(nil, aiService, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	requests := make([]*AIRequest, 20)
	for i := 0; i < 20; i++ {
		requests[i] = &AIRequest{
			Query:  fmt.Sprintf("Performance test query %d", i),
			UserID: fmt.Sprintf("perf-user-%d", i),
		}
	}

	ctx := context.Background()

	// Test concurrent processing
	start := time.Now()
	responses, err := cam.ProcessConcurrentRequests(ctx, requests)
	concurrentDuration := time.Since(start)

	assert.NoError(t, err)
	assert.Len(t, responses, 20)

	// Test sequential processing (simulate)
	start = time.Now()
	for _, req := range requests {
		_, err := aiService.ProcessQuery(ctx, req)
		assert.NoError(t, err)
	}
	sequentialDuration := time.Since(start)

	// Concurrent should be significantly faster
	speedup := float64(sequentialDuration) / float64(concurrentDuration)
	
	t.Logf("Sequential: %v, Concurrent: %v, Speedup: %.2fx", 
		sequentialDuration, concurrentDuration, speedup)
	
	assert.Greater(t, speedup, 2.0, "Concurrent processing should be at least 2x faster")
}

// BenchmarkConcurrentAIManager_ProcessRequest benchmarks single request processing
func BenchmarkConcurrentAIManager_ProcessRequest(b *testing.B) {
	aiService := NewIntegrationTestAIService(1*time.Millisecond, 0.0)
	monitoring := monitoring.NewService()

	cam, err := NewConcurrentAIManager(nil, aiService, monitoring)
	require.NoError(b, err)

	err = cam.Start()
	require.NoError(b, err)
	defer cam.Stop()

	req := &AIRequest{
		Query:  "Benchmark query",
		UserID: "benchmark-user",
	}

	ctx := context.Background()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, err := cam.ProcessRequest(ctx, req)
			if err != nil {
				b.Errorf("Request failed: %v", err)
			}
		}
	})
}

// BenchmarkConcurrentAIManager_ProcessConcurrentRequests benchmarks batch processing
func BenchmarkConcurrentAIManager_ProcessConcurrentRequests(b *testing.B) {
	aiService := NewIntegrationTestAIService(1*time.Millisecond, 0.0)
	monitoring := monitoring.NewService()

	cam, err := NewConcurrentAIManager(nil, aiService, monitoring)
	require.NoError(b, err)

	err = cam.Start()
	require.NoError(b, err)
	defer cam.Stop()

	requests := make([]*AIRequest, 10)
	for i := 0; i < 10; i++ {
		requests[i] = &AIRequest{
			Query:  fmt.Sprintf("Benchmark batch query %d", i),
			UserID: fmt.Sprintf("benchmark-user-%d", i),
		}
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := cam.ProcessConcurrentRequests(ctx, requests)
		if err != nil {
			b.Errorf("Batch request failed: %v", err)
		}
	}
}

package performance

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestHighPerformanceAIEngine tests the high-performance AI engine
func TestHighPerformanceAIEngine(t *testing.T) {
	// Create engine with test configuration
	config := getDefaultEngineConfig()
	engine, err := NewHighPerformanceAIEngine(config)
	require.NoError(t, err)
	require.NotNil(t, engine)

	// Start the engine
	err = engine.Start()
	require.NoError(t, err)

	defer func() {
		err := engine.Stop()
		assert.NoError(t, err)
	}()

	// Test simple query processing
	t.Run("SimpleQueryProcessing", func(t *testing.T) {
		req := &AIRequest{
			ID:          "test-simple-1",
			Query:       "Hello, how are you?",
			UserID:      "test-user",
			SessionID:   "test-session",
			Priority:    PriorityNormal,
			Timeout:     5 * time.Second,
			RequestedAt: time.Now(),
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		response, err := engine.ProcessWithOptimalPerformance(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, response)

		assert.Equal(t, req.ID, response.ID)
		assert.NotEmpty(t, response.Response)
		assert.Greater(t, response.Confidence, 0.0)
		assert.Less(t, response.ProcessingTime, 200*time.Millisecond) // Should be fast
	})

	// Test Indonesian NLP query processing
	t.Run("IndonesianNLPProcessing", func(t *testing.T) {
		req := &AIRequest{
			ID:          "test-nlp-1",
			Query:       "Bagaimana cara mengurus KTP yang hilang?",
			UserID:      "test-user",
			SessionID:   "test-session",
			Priority:    PriorityHigh,
			Timeout:     5 * time.Second,
			RequestedAt: time.Now(),
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		response, err := engine.ProcessWithOptimalPerformance(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, response)

		assert.Equal(t, req.ID, response.ID)
		assert.NotEmpty(t, response.Response)
		assert.Greater(t, response.Confidence, 0.8) // Should have high confidence for Indonesian
		assert.Equal(t, WorkerTypeNLP, response.WorkerType)
	})

	// Test complex query processing
	t.Run("ComplexQueryProcessing", func(t *testing.T) {
		req := &AIRequest{
			ID:      "test-complex-1",
			Query:   "Please provide a comprehensive analysis of modern enterprise software architecture patterns, including microservices design principles, distributed system challenges, scalability considerations, and performance optimization strategies. Compare different architectural approaches and explain their trade-offs in detail.",
			UserID:  "test-user",
			SessionID: "test-session",
			Priority: PriorityHigh,
			Context: map[string]interface{}{
				"analysis_depth": "comprehensive",
				"include_examples": true,
			},
			Timeout:     10 * time.Second,
			RequestedAt: time.Now(),
		}

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()

		response, err := engine.ProcessWithOptimalPerformance(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, response)

		assert.Equal(t, req.ID, response.ID)
		assert.NotEmpty(t, response.Response)
		assert.Greater(t, response.Confidence, 0.85)
		assert.Equal(t, WorkerTypeComplex, response.WorkerType)
		assert.Less(t, response.ProcessingTime, 500*time.Millisecond) // Should still be reasonably fast
	})

	// Test concurrent processing
	t.Run("ConcurrentProcessing", func(t *testing.T) {
		const numRequests = 10
		requests := make([]*AIRequest, numRequests)
		responses := make([]*AIResponse, numRequests)
		errors := make([]error, numRequests)

		// Create test requests
		for i := 0; i < numRequests; i++ {
			requests[i] = &AIRequest{
				ID:          fmt.Sprintf("test-concurrent-%d", i),
				Query:       fmt.Sprintf("Test query number %d", i),
				UserID:      "test-user",
				SessionID:   fmt.Sprintf("test-session-%d", i),
				Priority:    PriorityNormal,
				Timeout:     5 * time.Second,
				RequestedAt: time.Now(),
			}
		}

		// Process requests concurrently
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		done := make(chan bool, numRequests)
		
		for i := 0; i < numRequests; i++ {
			go func(index int) {
				defer func() { done <- true }()
				responses[index], errors[index] = engine.ProcessWithOptimalPerformance(ctx, requests[index])
			}(i)
		}

		// Wait for all requests to complete
		for i := 0; i < numRequests; i++ {
			<-done
		}

		// Verify all requests succeeded
		for i := 0; i < numRequests; i++ {
			assert.NoError(t, errors[i], "Request %d should not have error", i)
			assert.NotNil(t, responses[i], "Response %d should not be nil", i)
			if responses[i] != nil {
				assert.Equal(t, requests[i].ID, responses[i].ID)
				assert.NotEmpty(t, responses[i].Response)
			}
		}
	})

	// Test performance metrics
	t.Run("PerformanceMetrics", func(t *testing.T) {
		metrics := engine.GetMetrics()
		require.NotNil(t, metrics)

		// Check engine metrics
		engineMetrics, exists := metrics["engine"]
		assert.True(t, exists)
		assert.NotNil(t, engineMetrics)

		if engineMap, ok := engineMetrics.(map[string]interface{}); ok {
			assert.True(t, engineMap["running"].(bool))
			assert.Greater(t, engineMap["total_workers"].(int), 0)
			assert.Greater(t, engineMap["pools_count"].(int), 0)
		}

		// Check pool metrics
		poolMetrics, exists := metrics["pools"]
		assert.True(t, exists)
		assert.NotNil(t, poolMetrics)
	})
}

// TestIntelligentLoadBalancer tests the load balancer
func TestIntelligentLoadBalancer(t *testing.T) {
	// Create test processing pools
	pools := make(map[string]*ProcessingPool)
	
	simpleConfig := &PoolConfig{
		PoolType:    "simple",
		WorkerCount: 2,
		QueueSize:   10,
		WorkerType:  WorkerTypeSimple,
		Timeout:     50 * time.Millisecond,
	}
	
	simplePool, err := NewProcessingPool(simpleConfig)
	require.NoError(t, err)
	pools["simple"] = simplePool

	// Create load balancer
	loadBalancer := NewIntelligentLoadBalancer(pools)
	require.NotNil(t, loadBalancer)

	// Test worker selection
	t.Run("WorkerSelection", func(t *testing.T) {
		req := &AIRequest{
			ID:       "test-lb-1",
			Query:    "Simple test query",
			Priority: PriorityNormal,
		}

		worker := loadBalancer.SelectOptimalWorker(simplePool, req)
		assert.NotNil(t, worker)
		assert.Equal(t, WorkerTypeSimple, worker.workerType)
	})

	// Test metrics update
	t.Run("MetricsUpdate", func(t *testing.T) {
		workerID := simplePool.workers[0].id
		responseTime := 100 * time.Millisecond
		success := true

		loadBalancer.UpdateWorkerMetrics(workerID, responseTime, success)

		// Verify metrics were updated
		metrics := loadBalancer.workerMetrics[workerID]
		assert.NotNil(t, metrics)
		assert.Equal(t, int64(1), metrics.TotalRequests)
		assert.Equal(t, int64(1), metrics.SuccessfulRequests)
	})
}

// TestHighPerformanceIntegration tests the integration layer
func TestHighPerformanceIntegration(t *testing.T) {
	config := &IntegrationConfig{
		EnableHighPerformance: true,
		FallbackToStandard:   true,
		PerformanceThreshold: 200 * time.Millisecond,
		MaxRetries:           3,
	}

	integration, err := NewHighPerformanceIntegration(config)
	require.NoError(t, err)
	require.NotNil(t, integration)

	// Start integration
	err = integration.Start()
	require.NoError(t, err)

	defer func() {
		err := integration.Stop()
		assert.NoError(t, err)
	}()

	// Test chat request processing
	t.Run("ChatRequestProcessing", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		response, err := integration.ProcessChatRequest(
			ctx,
			"test-user",
			"test-session",
			"Hello, how can you help me?",
			map[string]interface{}{
				"language": "english",
			},
		)

		require.NoError(t, err)
		require.NotNil(t, response)

		assert.NotEmpty(t, response.Response)
		assert.Greater(t, response.Confidence, 0.0)
		assert.True(t, response.Success)
		assert.Less(t, response.ProcessingTime, 500*time.Millisecond)

		// Check high-performance metadata
		if response.Metadata != nil {
			highPerf, exists := response.Metadata["high_performance"]
			assert.True(t, exists)
			assert.True(t, highPerf.(bool))
		}
	})

	// Test Indonesian government query
	t.Run("IndonesianGovernmentQuery", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		response, err := integration.ProcessChatRequest(
			ctx,
			"test-user",
			"test-session",
			"Bagaimana cara mengurus KTP baru di Dukcapil?",
			map[string]interface{}{
				"language": "indonesian",
				"service_type": "government",
			},
		)

		require.NoError(t, err)
		require.NotNil(t, response)

		assert.NotEmpty(t, response.Response)
		assert.Greater(t, response.Confidence, 0.8) // Should have high confidence
		assert.True(t, response.Success)

		// Should use NLP worker for Indonesian queries
		if response.Metadata != nil {
			workerType, exists := response.Metadata["worker_type"]
			if exists {
				assert.Equal(t, string(WorkerTypeNLP), workerType)
			}
		}
	})

	// Test performance metrics
	t.Run("PerformanceMetrics", func(t *testing.T) {
		metrics := integration.GetPerformanceMetrics()
		require.NotNil(t, metrics)

		assert.True(t, metrics["high_performance_enabled"].(bool))
		assert.True(t, metrics["fallback_enabled"].(bool))
		assert.Equal(t, int64(200), metrics["performance_threshold_ms"].(int64))
	})

	// Test health status
	t.Run("HealthStatus", func(t *testing.T) {
		health := integration.GetHealthStatus()
		require.NotNil(t, health)

		assert.True(t, health["integration_healthy"].(bool))
		assert.True(t, health["high_performance_enabled"].(bool))
	})
}

// BenchmarkHighPerformanceEngine benchmarks the engine performance
func BenchmarkHighPerformanceEngine(b *testing.B) {
	config := getDefaultEngineConfig()
	engine, err := NewHighPerformanceAIEngine(config)
	require.NoError(b, err)

	err = engine.Start()
	require.NoError(b, err)
	defer engine.Stop()

	req := &AIRequest{
		ID:          "benchmark-test",
		Query:       "Test query for benchmarking",
		UserID:      "benchmark-user",
		SessionID:   "benchmark-session",
		Priority:    PriorityNormal,
		Timeout:     5 * time.Second,
		RequestedAt: time.Now(),
	}

	ctx := context.Background()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, err := engine.ProcessWithOptimalPerformance(ctx, req)
			if err != nil {
				b.Errorf("Processing failed: %v", err)
			}
		}
	})
}

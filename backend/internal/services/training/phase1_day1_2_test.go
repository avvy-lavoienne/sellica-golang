package training

import (
	"context"
	"testing"
	"time"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestPhase1Day1_2Implementation tests the Day 1-2 training service architecture
func TestPhase1Day1_2Implementation(t *testing.T) {
	// Create mock services
	mockDB := createMockDatabase()
	mockCache := createMockCache()

	// Create enhanced training service
	service, err := NewService(mockDB, mockCache)
	require.NoError(t, err)
	require.NotNil(t, service)

	t.Run("Enhanced Architecture Components", func(t *testing.T) {
		// Test that all Phase 1 components are initialized
		assert.NotNil(t, service.collector, "DataCollector should be initialized")
		assert.NotNil(t, service.processor, "BatchProcessor should be initialized")
		assert.NotNil(t, service.validator, "DataValidator should be initialized")
		assert.NotNil(t, service.analyzer, "QueryAnalyzer should be initialized")
		assert.NotNil(t, service.cache, "TrainingCache should be initialized")
		assert.NotNil(t, service.metrics, "PerformanceMetrics should be initialized")
		assert.NotNil(t, service.supabase, "Supabase client should be initialized")
	})

	t.Run("BatchProcessor Functionality", func(t *testing.T) {
		// Test batch processor configuration
		assert.Equal(t, 1000, service.processor.batchSize, "Batch size should be optimized for Supabase (1000)")
		assert.Equal(t, 10, service.processor.maxConcurrentBatches, "Should support 10 concurrent batches")
		assert.Equal(t, 3, service.processor.retryAttempts, "Should have 3 retry attempts")

		// Test adding data to batch
		testData := TrainingData{
			ID:       "test-1",
			Query:    "Test query for batch processing",
			Response: "Test response for batch processing",
			UserID:   "user-123",
		}

		err := service.processor.AddToBatch(testData)
		assert.NoError(t, err, "Should be able to add data to batch")

		// Test batch metrics
		metrics := service.processor.GetMetrics()
		assert.GreaterOrEqual(t, metrics.CurrentBatchSize, 0, "Current batch size should be non-negative")
	})

	t.Run("TrainingCache Functionality", func(t *testing.T) {
		ctx := context.Background()
		testKey := "test-cache-key"
		testData := map[string]interface{}{
			"query":    "Test query",
			"response": "Test response",
		}

		// Test cache set
		err := service.cache.Set(ctx, testKey, testData, 5*time.Minute)
		assert.NoError(t, err, "Should be able to set cache data")

		// Test cache get
		cached, found := service.cache.Get(ctx, testKey)
		assert.True(t, found, "Should find cached data")
		assert.Equal(t, testData, cached, "Cached data should match original")

		// Test cache metrics
		metrics := service.cache.GetMetrics()
		assert.GreaterOrEqual(t, metrics.Hits, int64(1), "Should have at least 1 cache hit")
		assert.GreaterOrEqual(t, metrics.HitRate, float64(0), "Hit rate should be non-negative")
	})

	t.Run("PerformanceMetrics Functionality", func(t *testing.T) {
		// Test recording request metrics
		service.metrics.RecordRequest(100*time.Millisecond, true)
		service.metrics.RecordRequest(150*time.Millisecond, true)
		service.metrics.RecordRequest(200*time.Millisecond, false)

		// Test recording Supabase metrics
		service.metrics.RecordSupabaseResponse(25*time.Millisecond, true)
		service.metrics.RecordSupabaseResponse(30*time.Millisecond, true)

		// Test recording batch metrics
		service.metrics.RecordBatchProcessing(1000, 1000)

		// Test recording accuracy
		service.metrics.RecordAccuracy(0.96)

		// Get metrics and validate
		metrics := service.metrics.GetMetrics()
		assert.Equal(t, int64(3), metrics.TotalRequests, "Should have 3 total requests")
		assert.Equal(t, int64(2), metrics.SuccessfulRequests, "Should have 2 successful requests")
		assert.Equal(t, int64(1), metrics.FailedRequests, "Should have 1 failed request")
		assert.True(t, metrics.AvgProcessingTime > 0, "Average processing time should be positive")
		assert.True(t, metrics.AvgSupabaseResponse > 0, "Average Supabase response time should be positive")
		assert.Equal(t, float64(0.96), metrics.CurrentAccuracy, "Current accuracy should be 0.96")
	})

	t.Run("Performance Targets Validation", func(t *testing.T) {
		// Reset metrics for clean test
		service.metrics.Reset()

		// Test Phase 1 performance targets
		// Training Data Processing: 50-200ms per batch
		service.metrics.RecordRequest(100*time.Millisecond, true)

		// Supabase Response Time: 10-30ms per query
		service.metrics.RecordSupabaseResponse(20*time.Millisecond, true)

		// Training Accuracy: 95%+
		service.metrics.RecordAccuracy(0.96)

		// Get metrics to debug
		metrics := service.metrics.GetMetrics()
		t.Logf("Metrics: Requests=%d, AvgProcessing=%v, AvgSupabase=%v, Accuracy=%f, ErrorRate=%f",
			metrics.TotalRequests, metrics.AvgProcessingTime, metrics.AvgSupabaseResponse,
			metrics.CurrentAccuracy, metrics.ErrorRate)

		// Check if performance targets are met
		isPerforming := service.metrics.IsPerformingWell()
		assert.True(t, isPerforming, "Service should be performing well within Phase 1 targets")
	})

	t.Run("Supabase Integration", func(t *testing.T) {
		ctx := context.Background()
		
		// Test training data submission with Supabase integration
		testData := &TrainingData{
			ID:       "test-supabase-1",
			Query:    "Test query for Supabase integration",
			Response: "Test response for Supabase integration",
			UserID:   "user-123",
			Status:   TrainingStatusPending,
		}

		err := service.SubmitTrainingData(ctx, testData)
		assert.NoError(t, err, "Should be able to submit training data to Supabase")

		// Verify metrics were updated
		metrics := service.metrics.GetMetrics()
		assert.Greater(t, metrics.TotalRequests, int64(0), "Should have processed requests")
	})
}

// TestContinuousLearningEngine tests the continuous learning engine
func TestContinuousLearningEngine(t *testing.T) {
	// Create mock training service
	mockDB := createMockDatabase()
	mockCache := createMockCache()
	trainingService, err := NewService(mockDB, mockCache)
	require.NoError(t, err)

	// Create continuous learning engine
	engine := NewContinuousLearningEngine(trainingService, nil)
	require.NotNil(t, engine)

	t.Run("Learning Session Creation", func(t *testing.T) {
		ctx := context.Background()
		
		session, err := engine.StartLearningSession(ctx, "tensorflow", 0.95)
		assert.NoError(t, err, "Should be able to start learning session")
		assert.NotNil(t, session, "Learning session should not be nil")
		assert.Equal(t, "tensorflow", session.ModelType, "Model type should match")
		assert.Equal(t, 0.95, session.TargetAccuracy, "Target accuracy should match")
		assert.Equal(t, LearningStatusInitializing, session.Status, "Initial status should be initializing")
	})

	t.Run("Active Sessions Management", func(t *testing.T) {
		ctx := context.Background()
		
		// Start multiple sessions
		session1, err := engine.StartLearningSession(ctx, "tensorflow", 0.95)
		assert.NoError(t, err)
		
		_, err = engine.StartLearningSession(ctx, "indobert", 0.96)
		assert.NoError(t, err)

		// Get active sessions
		activeSessions := engine.GetActiveSessions()
		assert.GreaterOrEqual(t, len(activeSessions), 2, "Should have at least 2 active sessions")

		// Get specific session
		retrievedSession, err := engine.GetSession(session1.ID)
		assert.NoError(t, err, "Should find the session")
		assert.Equal(t, session1.ID, retrievedSession.ID, "Session IDs should match")
	})

	t.Run("Session Cancellation", func(t *testing.T) {
		ctx := context.Background()
		
		session, err := engine.StartLearningSession(ctx, "predictive", 0.94)
		assert.NoError(t, err)

		// Cancel the session
		err = engine.CancelSession(session.ID)
		assert.NoError(t, err, "Should be able to cancel session")

		// Wait a bit for cancellation to process
		time.Sleep(100 * time.Millisecond)

		// Check session status
		retrievedSession, err := engine.GetSession(session.ID)
		if err == nil {
			assert.Equal(t, LearningStatusCancelled, retrievedSession.Status, "Session should be cancelled")
		}
	})
}

// Helper functions for testing
func createMockDatabase() *database.Service {
	// Create a mock database service for testing
	// In a real implementation, this would be a proper mock
	service, _ := database.NewService("", "") // Empty credentials for mock
	return service
}

func createMockCache() *cache.Service {
	// Create a mock cache service for testing
	// In a real implementation, this would be a proper mock
	service, _ := cache.NewService("redis://localhost:6379")
	return service
}

// Benchmark tests for performance validation
func BenchmarkBatchProcessing(b *testing.B) {
	mockDB := createMockDatabase()
	mockCache := createMockCache()
	service, _ := NewService(mockDB, mockCache)

	testData := TrainingData{
		ID:       "bench-test",
		Query:    "Benchmark test query",
		Response: "Benchmark test response",
		UserID:   "user-bench",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		service.processor.AddToBatch(testData)
	}
}

func BenchmarkCacheOperations(b *testing.B) {
	mockDB := createMockDatabase()
	mockCache := createMockCache()
	service, _ := NewService(mockDB, mockCache)

	ctx := context.Background()
	testData := map[string]interface{}{
		"query":    "Benchmark query",
		"response": "Benchmark response",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		key := "bench-key"
		service.cache.Set(ctx, key, testData, 5*time.Minute)
		service.cache.Get(ctx, key)
	}
}

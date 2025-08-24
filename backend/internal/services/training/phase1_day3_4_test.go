package training

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestPhase1Day3_4Implementation tests the enhanced Phase 1 Day 3-4 implementation
func TestPhase1Day3_4Implementation(t *testing.T) {
	// Skip if no Upstash Redis URL provided
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		t.Skip("REDIS_URL not provided, skipping Phase 1 Day 3-4 integration test")
	}

	// Initialize services
	cacheService, err := cache.NewService(redisURL)
	require.NoError(t, err)
	require.NotNil(t, cacheService)

	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	trainingService, err := NewService(dbService, cacheService)
	require.NoError(t, err)
	require.NotNil(t, trainingService)

	// Wait for initialization
	time.Sleep(100 * time.Millisecond)

	t.Run("Enhanced_Data_Collection_Components", func(t *testing.T) {
		// Verify enhanced components are initialized
		assert.NotNil(t, trainingService.collector.realTimeAnalyzer, "Real-time analyzer should be initialized")
		assert.NotNil(t, trainingService.collector.conversationTracker, "Conversation tracker should be initialized")
		assert.NotNil(t, trainingService.collector.performanceMonitor, "Performance monitor should be initialized")
		assert.NotNil(t, trainingService.collector.cacheWarmer, "Cache warmer should be initialized")
	})

	t.Run("Cache_Optimization_Components", func(t *testing.T) {
		// Verify cache optimization components
		assert.NotNil(t, trainingService.cache.analytics, "Cache analytics should be initialized")
		assert.NotNil(t, trainingService.cache.optimizer, "Cache optimizer should be initialized")
		assert.Equal(t, 0.85, trainingService.cache.hitRatioTarget, "Hit ratio target should be 85%")
	})

	t.Run("Real_Time_Analysis_Performance", func(t *testing.T) {
		ctx := context.Background()
		analyzer := trainingService.collector.realTimeAnalyzer

		testQueries := []string{
			"cara membuat ktp baru",
			"syarat kartu keluarga",
			"prosedur akta kelahiran",
			"status pengajuan dokumen",
		}

		for _, query := range testQueries {
			startTime := time.Now()
			
			result, err := analyzer.AnalyzeQuery(ctx, query, map[string]interface{}{
				"user_id":    "test-user",
				"session_id": "test-session",
			})
			
			analysisTime := time.Since(startTime)
			
			assert.NoError(t, err, "Analysis should not fail")
			assert.NotNil(t, result, "Analysis result should not be nil")
			assert.Less(t, analysisTime, 50*time.Millisecond, "Analysis should complete within 50ms")
			assert.Greater(t, result.Confidence, 0.0, "Confidence should be greater than 0")
			assert.NotEmpty(t, result.Classification.ServiceType, "Service type should be classified")
			
			t.Logf("Query: %s | Service: %s | Confidence: %.2f | Time: %v", 
				query, result.Classification.ServiceType, result.Confidence, analysisTime)
		}
	})

	t.Run("Cache_Performance_Validation", func(t *testing.T) {
		ctx := context.Background()
		
		// Test cache performance with training data
		testData := map[string]interface{}{
			"query":    "test training query",
			"response": "test training response",
			"user_id":  "test-user-123",
			"metadata": map[string]interface{}{
				"accuracy": 0.95,
				"model":    "enhanced",
			},
		}

		// Test L1 (Memory) Cache Performance
		memoryStartTime := time.Now()
		err := trainingService.cache.Set(ctx, "test:memory:performance", testData, 5*time.Minute)
		memorySetTime := time.Since(memoryStartTime)
		
		assert.NoError(t, err, "Memory cache set should not fail")
		assert.Less(t, memorySetTime, 1*time.Millisecond, "Memory cache set should be <1ms")

		memoryGetStartTime := time.Now()
		retrievedData, found := trainingService.cache.Get(ctx, "test:memory:performance")
		memoryGetTime := time.Since(memoryGetStartTime)
		
		assert.True(t, found, "Data should be found in memory cache")
		assert.NotNil(t, retrievedData, "Retrieved data should not be nil")
		assert.Less(t, memoryGetTime, 1*time.Millisecond, "Memory cache get should be <1ms")

		t.Logf("Memory Cache Performance: Set=%v, Get=%v", memorySetTime, memoryGetTime)

		// Test L2 (Upstash Redis) Cache Performance
		// Clear memory cache to test Redis fallback
		trainingService.cache.removeFromMemory("test:redis:performance")

		redisStartTime := time.Now()
		err = trainingService.cache.Set(ctx, "test:redis:performance", testData, 30*time.Minute)
		redisSetTime := time.Since(redisStartTime)
		
		assert.NoError(t, err, "Redis cache set should not fail")
		assert.Less(t, redisSetTime, 100*time.Millisecond, "Redis cache set should be <100ms")

		// Clear memory to force Redis lookup
		trainingService.cache.removeFromMemory("test:redis:performance")
		
		redisGetStartTime := time.Now()
		retrievedRedisData, found := trainingService.cache.Get(ctx, "test:redis:performance")
		redisGetTime := time.Since(redisGetStartTime)
		
		assert.True(t, found, "Data should be found in Redis cache")
		assert.NotNil(t, retrievedRedisData, "Retrieved Redis data should not be nil")
		assert.Less(t, redisGetTime, 50*time.Millisecond, "Redis cache get should be <50ms")

		t.Logf("Redis Cache Performance: Set=%v, Get=%v", redisSetTime, redisGetTime)
	})

	t.Run("Training_Data_Processing_Performance", func(t *testing.T) {
		ctx := context.Background()
		
		// Test batch processing performance
		batchSize := 100
		trainingDataBatch := make([]*TrainingData, batchSize)
		
		for i := 0; i < batchSize; i++ {
			trainingDataBatch[i] = &TrainingData{
				ID:       fmt.Sprintf("test-batch-%d", i),
				Query:    fmt.Sprintf("Test query %d for batch processing", i),
				Response: fmt.Sprintf("Test response %d", i),
				UserID:   "test-user",
				SessionID: "test-session",
				Status:   TrainingStatusPending,
				Classification: QueryClassification{
					ServiceType: "ktp",
					Intent:      "test",
					Confidence:  0.9,
					Complexity:  "medium",
					Priority:    5,
				},
				Metadata: TrainingMetadata{
					ProcessingTime:  100.0,
					EnhancementMode: true,
					ProviderUsed:    "test",
					ContextLayers:   []string{"test"},
				},
			}
		}

		// Measure batch processing time
		batchStartTime := time.Now()
		
		for _, data := range trainingDataBatch {
			err := trainingService.SubmitTrainingData(ctx, data)
			assert.NoError(t, err, "Training data submission should not fail")
		}
		
		batchProcessingTime := time.Since(batchStartTime)
		averageProcessingTime := batchProcessingTime / time.Duration(batchSize)
		
		assert.Less(t, averageProcessingTime, 200*time.Millisecond, "Average processing time should be <200ms")
		assert.Less(t, batchProcessingTime, 10*time.Second, "Total batch processing should be <10s")
		
		t.Logf("Batch Processing Performance: Total=%v, Average=%v per item", 
			batchProcessingTime, averageProcessingTime)
	})

	t.Run("Cache_Hit_Ratio_Validation", func(t *testing.T) {
		ctx := context.Background()
		
		// Generate cache access patterns
		testKeys := []string{
			"popular:query:1",
			"popular:query:2", 
			"popular:query:3",
		}
		
		testData := map[string]interface{}{
			"cached": true,
			"timestamp": time.Now(),
		}

		// Populate cache
		for _, key := range testKeys {
			err := trainingService.cache.Set(ctx, key, testData, 10*time.Minute)
			assert.NoError(t, err)
		}

		// Simulate access patterns (multiple hits on same keys)
		totalAccesses := 100
		cacheHits := 0
		
		for i := 0; i < totalAccesses; i++ {
			key := testKeys[i%len(testKeys)] // Cycle through keys
			
			if _, found := trainingService.cache.Get(ctx, key); found {
				cacheHits++
			}
		}
		
		hitRatio := float64(cacheHits) / float64(totalAccesses)
		
		assert.Greater(t, hitRatio, 0.8, "Cache hit ratio should be >80%")
		assert.LessOrEqual(t, hitRatio, 1.0, "Cache hit ratio should be ≤100%")
		
		t.Logf("Cache Hit Ratio: %.2f%% (%d/%d)", hitRatio*100, cacheHits, totalAccesses)
	})

	t.Run("Conversation_Tracking_Performance", func(t *testing.T) {
		ctx := context.Background()
		tracker := trainingService.collector.conversationTracker
		
		sessionID := "test-session-tracking"
		userID := "test-user-tracking"
		
		// Simulate conversation steps
		steps := []ConversationStep{
			{
				StepID:         "step-1",
				Timestamp:      time.Now(),
				UserInput:      "Bagaimana cara membuat KTP?",
				SystemResponse: "Untuk membuat KTP, Anda perlu...",
				ResponseType:   "knowledge_base",
				ProcessingTime: 150 * time.Millisecond,
				Confidence:     0.9,
			},
			{
				StepID:         "step-2", 
				Timestamp:      time.Now(),
				UserInput:      "Berapa lama prosesnya?",
				SystemResponse: "Proses pembuatan KTP memakan waktu...",
				ResponseType:   "enhanced_ai",
				ProcessingTime: 200 * time.Millisecond,
				Confidence:     0.85,
			},
		}

		// Track conversation steps
		for _, step := range steps {
			startTime := time.Now()
			err := tracker.TrackConversation(ctx, sessionID, userID, step)
			trackingTime := time.Since(startTime)
			
			assert.NoError(t, err, "Conversation tracking should not fail")
			assert.Less(t, trackingTime, 10*time.Millisecond, "Conversation tracking should be <10ms")
		}

		// Retrieve conversation context
		contextStartTime := time.Now()
		session, found := tracker.GetConversationContext(sessionID)
		contextRetrievalTime := time.Since(contextStartTime)
		
		assert.True(t, found, "Conversation session should be found")
		assert.NotNil(t, session, "Session should not be nil")
		assert.Equal(t, len(steps), len(session.Steps), "All steps should be tracked")
		assert.Less(t, contextRetrievalTime, 5*time.Millisecond, "Context retrieval should be <5ms")
		
		t.Logf("Conversation Tracking Performance: Context retrieval=%v", contextRetrievalTime)
	})

	t.Run("Performance_Metrics_Collection", func(t *testing.T) {
		monitor := trainingService.collector.performanceMonitor
		
		// Record various metrics
		monitor.RecordMetric("query_processed", nil, 150*time.Millisecond)
		monitor.RecordMetric("query_cached", nil, 0)
		monitor.RecordMetric("processing_time", 200*time.Millisecond, 200*time.Millisecond)
		
		// Get metrics
		metrics := monitor.GetMetrics()
		
		assert.NotNil(t, metrics, "Metrics should not be nil")
		assert.Contains(t, metrics, "total_queries", "Should contain total queries")
		assert.Contains(t, metrics, "processed_queries", "Should contain processed queries")
		assert.Contains(t, metrics, "cache_hit_ratio", "Should contain cache hit ratio")
		
		t.Logf("Performance Metrics: %+v", metrics)
	})

	t.Run("Integration_Test_Summary", func(t *testing.T) {
		// Verify overall system health
		assert.True(t, cacheService.IsHealthy(), "Cache service should be healthy")
		
		// Test end-to-end workflow
		ctx := context.Background()
		
		testData := &TrainingData{
			ID:       "integration-test",
			Query:    "Test integration query",
			Response: "Test integration response",
			UserID:   "integration-user",
			SessionID: "integration-session",
			Status:   TrainingStatusPending,
			Classification: QueryClassification{
				ServiceType: "ktp",
				Intent:      "integration_test",
				Confidence:  0.95,
				Complexity:  "medium",
				Priority:    5,
			},
			Metadata: TrainingMetadata{
				ProcessingTime:  100.0,
				EnhancementMode: true,
				ProviderUsed:    "test",
				ContextLayers:   []string{"integration"},
			},
		}

		// Submit training data
		startTime := time.Now()
		err := trainingService.SubmitTrainingData(ctx, testData)
		totalTime := time.Since(startTime)
		
		assert.NoError(t, err, "Integration test should not fail")
		assert.Less(t, totalTime, 500*time.Millisecond, "End-to-end processing should be <500ms")
		
		t.Logf("✅ Phase 1 Day 3-4 Integration Test Completed Successfully")
		t.Logf("📊 Total Processing Time: %v", totalTime)
	})
}

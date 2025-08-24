package training

import (
	"context"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
)

// BenchmarkPhase1Day3_4Performance benchmarks the enhanced Phase 1 Day 3-4 performance
func BenchmarkPhase1Day3_4Performance(b *testing.B) {
	// Skip if no Upstash Redis URL provided
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		b.Skip("REDIS_URL not provided, skipping performance benchmark")
	}

	// Initialize services
	cacheService, err := cache.NewService(redisURL)
	if err != nil {
		b.Fatalf("Failed to create cache service: %v", err)
	}

	dbService, err := database.NewService("", "")
	if err != nil {
		b.Fatalf("Failed to create database service: %v", err)
	}

	trainingService, err := NewService(dbService, cacheService)
	if err != nil {
		b.Fatalf("Failed to create training service: %v", err)
	}

	// Wait for initialization
	time.Sleep(100 * time.Millisecond)

	b.Run("RealTimeAnalysis", func(b *testing.B) {
		ctx := context.Background()
		analyzer := trainingService.collector.realTimeAnalyzer
		
		testQueries := []string{
			"cara membuat ktp baru",
			"syarat kartu keluarga", 
			"prosedur akta kelahiran",
			"status pengajuan dokumen",
			"bantuan layanan administrasi",
		}

		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			query := testQueries[i%len(testQueries)]
			_, err := analyzer.AnalyzeQuery(ctx, query, map[string]interface{}{
				"user_id":    fmt.Sprintf("user-%d", i),
				"session_id": fmt.Sprintf("session-%d", i),
			})
			if err != nil {
				b.Errorf("Analysis failed: %v", err)
			}
		}
	})

	b.Run("MemoryCacheOperations", func(b *testing.B) {
		ctx := context.Background()
		
		testData := map[string]interface{}{
			"benchmark": true,
			"timestamp": time.Now(),
			"data":      "benchmark test data",
		}

		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("benchmark:memory:%d", i)
			
			// Set operation
			err := trainingService.cache.Set(ctx, key, testData, 5*time.Minute)
			if err != nil {
				b.Errorf("Memory cache set failed: %v", err)
			}
			
			// Get operation
			_, found := trainingService.cache.Get(ctx, key)
			if !found {
				b.Errorf("Memory cache get failed for key: %s", key)
			}
		}
	})

	b.Run("RedisCacheOperations", func(b *testing.B) {
		ctx := context.Background()
		
		testData := map[string]interface{}{
			"benchmark": true,
			"timestamp": time.Now(),
			"data":      "redis benchmark test data",
		}

		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("benchmark:redis:%d", i)
			
			// Clear memory cache to force Redis operation
			trainingService.cache.removeFromMemory(key)
			
			// Set operation (goes to both memory and Redis)
			err := trainingService.cache.Set(ctx, key, testData, 30*time.Minute)
			if err != nil {
				b.Errorf("Redis cache set failed: %v", err)
			}
			
			// Clear memory to test Redis get
			trainingService.cache.removeFromMemory(key)
			
			// Get operation (from Redis)
			_, found := trainingService.cache.Get(ctx, key)
			if !found {
				b.Errorf("Redis cache get failed for key: %s", key)
			}
		}
	})

	b.Run("TrainingDataSubmission", func(b *testing.B) {
		ctx := context.Background()

		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			trainingData := &TrainingData{
				ID:       fmt.Sprintf("benchmark-%d", i),
				Query:    fmt.Sprintf("Benchmark query %d", i),
				Response: fmt.Sprintf("Benchmark response %d", i),
				UserID:   fmt.Sprintf("user-%d", i%100), // Cycle through 100 users
				SessionID: fmt.Sprintf("session-%d", i%50), // Cycle through 50 sessions
				Status:   TrainingStatusPending,
				Classification: QueryClassification{
					ServiceType: []string{"ktp", "kk", "akta"}[i%3], // Cycle through service types
					Intent:      "benchmark",
					Confidence:  0.9,
					Complexity:  "medium",
					Priority:    5,
				},
				Metadata: TrainingMetadata{
					ProcessingTime:  100.0,
					EnhancementMode: true,
					ProviderUsed:    "benchmark",
					ContextLayers:   []string{"benchmark"},
				},
			}

			err := trainingService.SubmitTrainingData(ctx, trainingData)
			if err != nil {
				b.Errorf("Training data submission failed: %v", err)
			}
		}
	})

	b.Run("ConversationTracking", func(b *testing.B) {
		ctx := context.Background()
		tracker := trainingService.collector.conversationTracker

		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			sessionID := fmt.Sprintf("benchmark-session-%d", i%100)
			userID := fmt.Sprintf("benchmark-user-%d", i%50)
			
			step := ConversationStep{
				StepID:         fmt.Sprintf("step-%d", i),
				Timestamp:      time.Now(),
				UserInput:      fmt.Sprintf("Benchmark input %d", i),
				SystemResponse: fmt.Sprintf("Benchmark response %d", i),
				ResponseType:   "benchmark",
				ProcessingTime: time.Duration(i%200) * time.Millisecond,
				Confidence:     0.8 + float64(i%20)/100.0,
			}

			err := tracker.TrackConversation(ctx, sessionID, userID, step)
			if err != nil {
				b.Errorf("Conversation tracking failed: %v", err)
			}
		}
	})

	b.Run("ConcurrentOperations", func(b *testing.B) {
		ctx := context.Background()
		
		b.ResetTimer()
		b.RunParallel(func(pb *testing.PB) {
			i := 0
			for pb.Next() {
				// Mix of operations
				switch i % 4 {
				case 0:
					// Cache operation
					key := fmt.Sprintf("concurrent:cache:%d", i)
					testData := map[string]interface{}{"concurrent": true, "index": i}
					trainingService.cache.Set(ctx, key, testData, 5*time.Minute)
					trainingService.cache.Get(ctx, key)
					
				case 1:
					// Real-time analysis
					query := fmt.Sprintf("concurrent query %d", i)
					trainingService.collector.realTimeAnalyzer.AnalyzeQuery(ctx, query, nil)
					
				case 2:
					// Training data submission
					trainingData := &TrainingData{
						ID:       fmt.Sprintf("concurrent-%d", i),
						Query:    fmt.Sprintf("Concurrent query %d", i),
						Response: fmt.Sprintf("Concurrent response %d", i),
						UserID:   fmt.Sprintf("concurrent-user-%d", i%10),
						SessionID: fmt.Sprintf("concurrent-session-%d", i%5),
						Status:   TrainingStatusPending,
						Classification: QueryClassification{
							ServiceType: "ktp",
							Intent:      "concurrent",
							Confidence:  0.9,
							Complexity:  "medium",
							Priority:    5,
						},
						Metadata: TrainingMetadata{
							ProcessingTime:  100.0,
							EnhancementMode: true,
							ProviderUsed:    "concurrent",
							ContextLayers:   []string{"concurrent"},
						},
					}
					trainingService.SubmitTrainingData(ctx, trainingData)
					
				case 3:
					// Conversation tracking
					sessionID := fmt.Sprintf("concurrent-session-%d", i%10)
					userID := fmt.Sprintf("concurrent-user-%d", i%5)
					step := ConversationStep{
						StepID:         fmt.Sprintf("concurrent-step-%d", i),
						Timestamp:      time.Now(),
						UserInput:      fmt.Sprintf("Concurrent input %d", i),
						SystemResponse: fmt.Sprintf("Concurrent response %d", i),
						ResponseType:   "concurrent",
						ProcessingTime: 100 * time.Millisecond,
						Confidence:     0.9,
					}
					trainingService.collector.conversationTracker.TrackConversation(ctx, sessionID, userID, step)
				}
				i++
			}
		})
	})

	b.Run("CacheHitRatioOptimization", func(b *testing.B) {
		ctx := context.Background()
		
		// Pre-populate cache with popular keys
		popularKeys := make([]string, 100)
		for i := 0; i < 100; i++ {
			key := fmt.Sprintf("popular:key:%d", i)
			popularKeys[i] = key
			testData := map[string]interface{}{
				"popular": true,
				"index":   i,
				"data":    fmt.Sprintf("Popular data %d", i),
			}
			trainingService.cache.Set(ctx, key, testData, 30*time.Minute)
		}

		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			// 80% access to popular keys (should hit L1 cache)
			// 20% access to new keys (will miss cache)
			var key string
			if i%5 == 0 {
				// New key (cache miss)
				key = fmt.Sprintf("new:key:%d", i)
				testData := map[string]interface{}{"new": true, "index": i}
				trainingService.cache.Set(ctx, key, testData, 5*time.Minute)
			} else {
				// Popular key (cache hit)
				key = popularKeys[i%len(popularKeys)]
			}
			
			_, found := trainingService.cache.Get(ctx, key)
			if !found && i%5 != 0 {
				b.Errorf("Popular key should be found in cache: %s", key)
			}
		}
	})
}

// BenchmarkCachePerformanceComparison compares cache performance scenarios
func BenchmarkCachePerformanceComparison(b *testing.B) {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		b.Skip("REDIS_URL not provided, skipping cache performance comparison")
	}

	cacheService, err := cache.NewService(redisURL)
	if err != nil {
		b.Fatalf("Failed to create cache service: %v", err)
	}

	dbService, err := database.NewService("", "")
	if err != nil {
		b.Fatalf("Failed to create database service: %v", err)
	}

	trainingService, err := NewService(dbService, cacheService)
	if err != nil {
		b.Fatalf("Failed to create training service: %v", err)
	}

	ctx := context.Background()
	testData := map[string]interface{}{
		"comparison": true,
		"timestamp":  time.Now(),
		"data":       "performance comparison test data",
	}

	b.Run("L1_Memory_Cache_Only", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("l1:only:%d", i)
			
			// Set in memory cache
			trainingService.cache.setInMemory(key, testData, 5*time.Minute)
			
			// Get from memory cache
			_, found := trainingService.cache.getFromMemory(key)
			if !found {
				b.Errorf("L1 cache should contain key: %s", key)
			}
		}
	})

	b.Run("L2_Redis_Cache_Only", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("l2:only:%d", i)
			
			// Set in Redis cache (bypass memory)
			err := trainingService.cache.setInRedis(ctx, key, testData, 30*time.Minute)
			if err != nil {
				b.Errorf("Redis set failed: %v", err)
			}
			
			// Get from Redis cache (bypass memory)
			_, found := trainingService.cache.getFromRedis(ctx, key)
			if !found {
				b.Errorf("L2 cache should contain key: %s", key)
			}
		}
	})

	b.Run("Multi_Level_Cache_Strategy", func(b *testing.B) {
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			key := fmt.Sprintf("multi:level:%d", i)
			
			// Use multi-level cache strategy
			err := trainingService.cache.Set(ctx, key, testData, 30*time.Minute)
			if err != nil {
				b.Errorf("Multi-level set failed: %v", err)
			}
			
			_, found := trainingService.cache.Get(ctx, key)
			if !found {
				b.Errorf("Multi-level cache should contain key: %s", key)
			}
		}
	})
}

// BenchmarkLoadTesting performs load testing for concurrent operations
func BenchmarkLoadTesting(b *testing.B) {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		b.Skip("REDIS_URL not provided, skipping load testing")
	}

	cacheService, err := cache.NewService(redisURL)
	if err != nil {
		b.Fatalf("Failed to create cache service: %v", err)
	}

	dbService, err := database.NewService("", "")
	if err != nil {
		b.Fatalf("Failed to create database service: %v", err)
	}

	trainingService, err := NewService(dbService, cacheService)
	if err != nil {
		b.Fatalf("Failed to create training service: %v", err)
	}

	b.Run("High_Concurrency_Load", func(b *testing.B) {
		ctx := context.Background()
		
		// Test with high concurrency (500+ concurrent operations)
		concurrency := 500
		var wg sync.WaitGroup
		
		b.ResetTimer()
		for i := 0; i < b.N; i++ {
			wg.Add(concurrency)
			
			for j := 0; j < concurrency; j++ {
				go func(index int) {
					defer wg.Done()
					
					// Simulate training data processing
					trainingData := &TrainingData{
						ID:       fmt.Sprintf("load-test-%d-%d", i, index),
						Query:    fmt.Sprintf("Load test query %d-%d", i, index),
						Response: fmt.Sprintf("Load test response %d-%d", i, index),
						UserID:   fmt.Sprintf("load-user-%d", index%100),
						SessionID: fmt.Sprintf("load-session-%d", index%50),
						Status:   TrainingStatusPending,
						Classification: QueryClassification{
							ServiceType: "ktp",
							Intent:      "load_test",
							Confidence:  0.9,
							Complexity:  "medium",
							Priority:    5,
						},
						Metadata: TrainingMetadata{
							ProcessingTime:  100.0,
							EnhancementMode: true,
							ProviderUsed:    "load_test",
							ContextLayers:   []string{"load_test"},
						},
					}
					
					err := trainingService.SubmitTrainingData(ctx, trainingData)
					if err != nil {
						b.Errorf("Load test failed: %v", err)
					}
				}(j)
			}
			
			wg.Wait()
		}
	})
}

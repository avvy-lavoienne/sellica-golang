package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/chat"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/training"
)

func main() {
	fmt.Println("🚀 SELLY Phase 1 Day 3-4 Integration Test")
	fmt.Println("Testing real database and AI provider integration...")

	// Test environment variables
	fmt.Println("\n📋 Environment Variables Check:")
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_KEY")
	groqKey := os.Getenv("GROQ_API_KEY")
	hfKey := os.Getenv("HUGGINGFACE_API_KEY")
	redisURL := os.Getenv("REDIS_URL")

	fmt.Printf("✅ SUPABASE_URL: %s\n", maskString(supabaseURL))
	fmt.Printf("✅ SUPABASE_SERVICE_KEY: %s\n", maskString(supabaseKey))
	fmt.Printf("✅ GROQ_API_KEY: %s\n", maskString(groqKey))
	fmt.Printf("✅ HUGGINGFACE_API_KEY: %s\n", maskString(hfKey))
	fmt.Printf("✅ REDIS_URL: %s\n", maskString(redisURL))

	// Initialize services
	fmt.Println("\n🔧 Initializing Services:")

	// Database service
	dbService, err := database.NewService(supabaseURL, supabaseKey)
	if err != nil {
		log.Printf("❌ Database service initialization failed: %v", err)
	} else {
		fmt.Printf("✅ Database service initialized (healthy: %v)\n", dbService.IsHealthy())
	}

	// Cache service
	cacheService, err := cache.NewService(redisURL)
	if err != nil {
		log.Printf("❌ Cache service initialization failed: %v", err)
	} else {
		fmt.Printf("✅ Cache service initialized (healthy: %v)\n", cacheService.IsHealthy())
	}

	// AI service
	aiService := chat.NewAIService()
	fmt.Printf("✅ AI service initialized\n")

	// Training service
	trainingService, err := training.NewService(dbService, cacheService)
	if err != nil {
		log.Printf("❌ Training service initialization failed: %v", err)
		return
	}
	fmt.Printf("✅ Training service initialized\n")

	// Test AI provider integration
	fmt.Println("\n🤖 Testing AI Provider Integration:")
	testAIProviders(aiService)

	// Test training data submission
	fmt.Println("\n📊 Testing Training Data Integration:")
	testTrainingDataSubmission(trainingService)

	// Test training data retrieval
	fmt.Println("\n📋 Testing Training Data Retrieval:")
	testTrainingDataRetrieval(trainingService)

	// Test training statistics
	fmt.Println("\n📈 Testing Training Statistics:")
	testTrainingStatistics(trainingService)

	fmt.Println("\n✅ Integration test completed!")
}

func testAIProviders(aiService *chat.AIService) {
	ctx := context.Background()
	testQuery := "Bagaimana cara mengurus KTP yang hilang?"

	// Test simple provider
	fmt.Println("  Testing simple AI provider...")
	req := &chat.AIRequest{
		Query:           testQuery,
		UserID:          "test-user-123",
		SessionID:       "test-session-456",
		Context:         map[string]interface{}{},
		EnhancementMode: "simple",
	}

	response, err := aiService.ProcessQuery(ctx, req)
	if err != nil {
		fmt.Printf("  ❌ Simple provider failed: %v\n", err)
	} else {
		fmt.Printf("  ✅ Simple provider response: %s (confidence: %.2f)\n", 
			truncateString(response.Content, 100), response.Confidence)
	}

	// Test enhanced provider
	fmt.Println("  Testing enhanced AI provider...")
	req.EnhancementMode = "enhanced"
	response, err = aiService.ProcessQuery(ctx, req)
	if err != nil {
		fmt.Printf("  ❌ Enhanced provider failed: %v\n", err)
	} else {
		fmt.Printf("  ✅ Enhanced provider response: %s (confidence: %.2f)\n", 
			truncateString(response.Content, 100), response.Confidence)
	}
}

func testTrainingDataSubmission(trainingService *training.Service) {
	ctx := context.Background()

	testData := &training.TrainingData{
		Query:     "Bagaimana cara mengurus KTP yang hilang?",
		Response:  "Untuk mengurus KTP yang hilang, Anda perlu datang ke Dukcapil dengan membawa dokumen pendukung.",
		UserID:    "test-user-123",
		SessionID: "test-session-456",
	}

	err := trainingService.SubmitTrainingData(ctx, testData)
	if err != nil {
		fmt.Printf("  ❌ Training data submission failed: %v\n", err)
	} else {
		fmt.Printf("  ✅ Training data submitted successfully (ID: %s)\n", testData.ID)
	}
}

func testTrainingDataRetrieval(trainingService *training.Service) {
	ctx := context.Background()

	req := &training.TrainingDataRequest{
		UserID: "test-user-123",
		Limit:  5,
		Offset: 0,
	}

	response, err := trainingService.GetTrainingData(ctx, req)
	if err != nil {
		fmt.Printf("  ❌ Training data retrieval failed: %v\n", err)
	} else {
		fmt.Printf("  ✅ Retrieved %d training data entries (total: %d)\n", 
			len(response.Data), response.Total)
	}
}

func testTrainingStatistics(trainingService *training.Service) {
	ctx := context.Background()

	stats, err := trainingService.GetTrainingStats(ctx)
	if err != nil {
		fmt.Printf("  ❌ Training statistics failed: %v\n", err)
	} else {
		fmt.Printf("  ✅ Training statistics retrieved (total entries: %d)\n", stats.TotalEntries)
	}

	// Test service performance stats
	serviceStats := trainingService.GetServiceStats()
	fmt.Printf("  ✅ Service stats - Submissions: %d, Cache hits: %d\n", 
		serviceStats.TotalSubmissions, serviceStats.CacheHits)
}

// Helper functions
func maskString(s string) string {
	if s == "" {
		return "❌ Not set"
	}
	if len(s) <= 8 {
		return "✅ Set (***)"
	}
	return fmt.Sprintf("✅ Set (%s...%s)", s[:4], s[len(s)-4:])
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

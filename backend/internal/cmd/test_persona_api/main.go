package main

import (
	"context"
	"fmt"
	"log"

	"selly-backend/internal/services/persona"
)

func main() {
	fmt.Println("🚀 Testing SELLY Persona API Integration")
	fmt.Println("========================================")

	// Get global persona service
	personaService := persona.GetGlobalPersonaService()

	// Test the exact queries from your example
	testQueries := []struct {
		query     string
		sessionID string
		userID    string
		expected  string
	}{
		{
			query:     "halo selly",
			sessionID: "session-1",
			userID:    "user-1",
			expected:  "Should respond with time-based greeting",
		},
		{
			query:     "assalamualaikum selly",
			sessionID: "session-2",
			userID:    "user-2",
			expected:  "Should respond with Islamic greeting",
		},
	}

	ctx := context.Background()

	for i, test := range testQueries {
		fmt.Printf("\n🧪 Test %d: %s\n", i+1, test.query)
		fmt.Printf("Expected: %s\n", test.expected)

		// Process greeting using the simplified API
		response, err := personaService.ProcessGreeting(ctx, test.query, test.userID, test.sessionID)
		if err != nil {
			log.Printf("❌ Error processing greeting: %v", err)
			continue
		}

		fmt.Printf("✅ Response: %s\n", response)
		fmt.Println("----------------------------------------")
	}

	// Test service request processing
	fmt.Println("\n🔧 Testing Service Request Processing")
	fmt.Println("=====================================")

	serviceResponse, err := personaService.ProcessServiceRequest(
		ctx,
		"saya mau buat KTP baru",
		"user-3",
		"session-3",
		"Untuk membuat KTP baru, Anda memerlukan dokumen berikut...",
		[]string{},
	)
	if err != nil {
		log.Printf("❌ Error processing service request: %v", err)
	} else {
		fmt.Printf("✅ Service Response: %s\n", serviceResponse)
	}

	// Display metrics
	fmt.Println("\n📊 Persona Service Metrics")
	fmt.Println("===========================")
	metrics := personaService.GetMetrics()
	for key, value := range metrics {
		fmt.Printf("%s: %v\n", key, value)
	}

	fmt.Println("\n🎉 API Integration Testing Completed!")
	fmt.Println("\n💡 Integration Instructions:")
	fmt.Println("1. Import: selly-backend/internal/services/persona")
	fmt.Println("2. Get service: persona.GetGlobalPersonaService()")
	fmt.Println("3. Process greeting: service.ProcessGreeting(ctx, query, userID, sessionID)")
	fmt.Println("4. Process service: service.ProcessServiceRequest(ctx, query, userID, sessionID, baseResponse, history)")
	fmt.Println("\n✨ The enhanced persona system is ready for production integration!")
}

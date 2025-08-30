package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"selly-backend/internal/services/persona"
)

func main() {
	fmt.Println("🎭 Testing Enhanced SELLY Persona System")
	fmt.Println("========================================")

	// Initialize enhanced persona integration
	integration := persona.NewEnhancedPersonaIntegration()

	// Test cases
	testCases := []struct {
		name            string
		query           string
		isFirstContact  bool
		expectedGreeting string
		description     string
	}{
		{
			name:            "Islamic Greeting",
			query:           "assalamualaikum selly",
			isFirstContact:  true,
			expectedGreeting: "Waalaikumsalam warahmatullahi wabarakatuh",
			description:     "Should respond with proper Islamic greeting",
		},
		{
			name:            "Casual Greeting",
			query:           "halo selly",
			isFirstContact:  true,
			expectedGreeting: "Selamat",
			description:     "Should respond with time-based greeting",
		},
		{
			name:            "Service Request with Greeting",
			query:           "halo, saya mau buat KTP",
			isFirstContact:  true,
			expectedGreeting: "Selamat",
			description:     "Should combine greeting with service recognition",
		},
		{
			name:            "Frustrated User",
			query:           "aduh susah banget nih ngurus KTP",
			isFirstContact:  false,
			expectedGreeting: "",
			description:     "Should detect frustrated mood and adapt response",
		},
		{
			name:            "Confused User",
			query:           "saya bingung gimana cara bikin KTP",
			isFirstContact:  false,
			expectedGreeting: "",
			description:     "Should detect confused mood and provide clear guidance",
		},
	}

	ctx := context.Background()

	for i, testCase := range testCases {
		fmt.Printf("\n🧪 Test %d: %s\n", i+1, testCase.name)
		fmt.Printf("Query: %s\n", testCase.query)
		fmt.Printf("Description: %s\n", testCase.description)

		// Create test request
		req := &persona.EnhancedPersonaRequest{
			Query:          testCase.query,
			UserID:         "test-user-123",
			SessionID:      fmt.Sprintf("test-session-%d", i),
			BaseResponse:   "Saya siap membantu Anda dengan layanan administrasi kependudukan.",
			IsFirstContact: testCase.isFirstContact,
			ConversationHistory: []string{},
			Context: map[string]interface{}{
				"test_case": testCase.name,
			},
		}

		// Process with enhanced persona
		response, err := integration.ProcessWithEnhancedPersona(ctx, req)
		if err != nil {
			log.Printf("❌ Error processing test case %s: %v", testCase.name, err)
			continue
		}

		// Display results
		fmt.Printf("✅ Processing completed in %.2fms\n", response.ProcessingTime)
		
		if response.MoodDetection != nil {
			fmt.Printf("🧠 Mood detected: %s (confidence: %.2f, intensity: %s)\n", 
				response.MoodDetection.PrimaryMood, 
				response.MoodDetection.Confidence,
				response.MoodDetection.EmotionalIntensity)
		}

		if response.ServiceRecognition != nil {
			fmt.Printf("🔍 Service recognized: %s (confidence: %.2f)\n", 
				response.ServiceRecognition.ServiceType, 
				response.ServiceRecognition.Confidence)
		}

		if response.CulturalContext != nil {
			fmt.Printf("🌏 Cultural context: Region=%s, Formality=%s, Religious=%s\n", 
				response.CulturalContext.Region,
				response.CulturalContext.FormalityLevel,
				response.CulturalContext.ReligiousContext)
		}

		if response.Greeting != nil {
			fmt.Printf("👋 Greeting type: %s\n", response.Greeting.GreetingType)
			if response.Greeting.Greeting != "" {
				fmt.Printf("👋 Greeting: %s\n", response.Greeting.Greeting)
			}
		}

		fmt.Printf("💬 Final response: %s\n", response.ProcessedResponse)

		// Validate expected greeting
		if testCase.expectedGreeting != "" {
			if response.Greeting != nil && response.Greeting.Greeting != "" {
				if containsExpectedGreeting(response.Greeting.Greeting, testCase.expectedGreeting) {
					fmt.Printf("✅ Expected greeting found: %s\n", testCase.expectedGreeting)
				} else {
					fmt.Printf("❌ Expected greeting not found. Expected: %s, Got: %s\n", 
						testCase.expectedGreeting, response.Greeting.Greeting)
				}
			} else {
				fmt.Printf("❌ No greeting generated, but expected: %s\n", testCase.expectedGreeting)
			}
		}

		fmt.Println("----------------------------------------")
	}

	// Test session continuity
	fmt.Println("\n🔄 Testing Session Continuity")
	fmt.Println("==============================")

	sessionID := "continuity-test-session"
	
	// First interaction
	req1 := &persona.EnhancedPersonaRequest{
		Query:          "assalamualaikum selly",
		UserID:         "continuity-user",
		SessionID:      sessionID,
		BaseResponse:   "Saya siap membantu.",
		IsFirstContact: true,
		ConversationHistory: []string{},
	}

	response1, err := integration.ProcessWithEnhancedPersona(ctx, req1)
	if err != nil {
		log.Printf("❌ Error in continuity test 1: %v", err)
	} else {
		fmt.Printf("First interaction greeting: %s\n", response1.Greeting.Greeting)
	}

	// Second interaction (should not repeat greeting)
	req2 := &persona.EnhancedPersonaRequest{
		Query:          "saya mau tanya tentang KTP",
		UserID:         "continuity-user",
		SessionID:      sessionID,
		BaseResponse:   "Silakan tanyakan tentang KTP.",
		IsFirstContact: false,
		ConversationHistory: []string{"assalamualaikum selly"},
	}

	response2, err := integration.ProcessWithEnhancedPersona(ctx, req2)
	if err != nil {
		log.Printf("❌ Error in continuity test 2: %v", err)
	} else {
		fmt.Printf("Second interaction greeting: %s\n", response2.Greeting.Greeting)
		fmt.Printf("Session continuity: %t\n", response2.Greeting.SessionContinuity)
		if response2.Greeting.ShouldPreventRepetition {
			fmt.Println("✅ Greeting repetition correctly prevented")
		}
	}

	// Display integration metrics
	fmt.Println("\n📊 Integration Metrics")
	fmt.Println("======================")
	metrics := integration.GetMetrics()
	metricsJSON, _ := json.MarshalIndent(metrics, "", "  ")
	fmt.Println(string(metricsJSON))

	fmt.Println("\n🎉 Enhanced SELLY Persona Testing Completed!")
}

// containsExpectedGreeting checks if the greeting contains the expected text
func containsExpectedGreeting(greeting, expected string) bool {
	return len(greeting) > 0 && len(expected) > 0 && 
		   (greeting == expected || 
		    fmt.Sprintf("%s", greeting)[:len(expected)] == expected ||
		    fmt.Sprintf("%s", greeting)[len(greeting)-len(expected):] == expected)
}

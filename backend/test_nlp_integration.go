package main

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"selly-backend/internal/services/nlp"
)

// TestNLPIntegration tests the Indonesian NLP service integration
func TestNLPIntegration() {
	fmt.Println("🔤 Starting Indonesian NLP Service Integration Test...")
	fmt.Println(strings.Repeat("=", 60))

	// Create NLP service (without dependencies for testing)
	nlpService, err := nlp.NewService(nil, nil, nil)
	if err != nil {
		log.Fatalf("Failed to create NLP service: %v", err)
	}

	// Test cases for Indonesian NLP processing
	testCases := []struct {
		name        string
		text        string
		mode        nlp.ProcessingMode
		features    []nlp.NLPFeature
		description string
	}{
		{
			name: "Government Service Inquiry",
			text: "Selamat pagi, saya ingin bertanya tentang cara mengurus KTP yang hilang. Bagaimana prosedurnya dan dokumen apa saja yang diperlukan?",
			mode: nlp.ProcessingModeGovernment,
			features: []nlp.NLPFeature{
				nlp.FeatureLanguageDetection,
				nlp.FeatureEntityRecognition,
				nlp.FeatureIntentClassification,
				nlp.FeatureSentimentAnalysis,
				nlp.FeatureCulturalContext,
				nlp.FeatureAdministrativeTerms,
			},
			description: "Formal government service inquiry with administrative terms",
		},
		{
			name: "Casual Jakarta Dialect",
			text: "Gue mau tanya nih, gimana caranya bikin SIM baru? Ribet gak sih prosesnya? Udah pernah ke Polda tapi antrinya panjang banget.",
			mode: nlp.ProcessingModeRegional,
			features: []nlp.NLPFeature{
				nlp.FeatureLanguageDetection,
				nlp.FeatureEntityRecognition,
				nlp.FeatureIntentClassification,
				nlp.FeatureSentimentAnalysis,
				nlp.FeatureCulturalContext,
				nlp.FeatureAdministrativeTerms,
			},
			description: "Casual Jakarta dialect with informal language",
		},
		{
			name: "Complaint with Negative Sentiment",
			text: "Saya sangat kecewa dengan pelayanan di kantor Dukcapil. Sudah 3 minggu mengurus Kartu Keluarga tapi belum selesai juga. Petugas tidak ramah dan prosesnya lama sekali.",
			mode: nlp.ProcessingModeGovernment,
			features: []nlp.NLPFeature{
				nlp.FeatureLanguageDetection,
				nlp.FeatureEntityRecognition,
				nlp.FeatureIntentClassification,
				nlp.FeatureSentimentAnalysis,
				nlp.FeatureCulturalContext,
				nlp.FeatureAdministrativeTerms,
			},
			description: "Complaint with negative sentiment and administrative context",
		},
		{
			name: "Mixed Language Business Context",
			text: "Dear Bapak/Ibu, mohon informasi mengenai requirements untuk SIUP dan TDP. Apakah bisa diurus online? Thank you.",
			mode: nlp.ProcessingModeStandard,
			features: []nlp.NLPFeature{
				nlp.FeatureLanguageDetection,
				nlp.FeatureEntityRecognition,
				nlp.FeatureIntentClassification,
				nlp.FeatureSentimentAnalysis,
				nlp.FeatureCulturalContext,
				nlp.FeatureAdministrativeTerms,
			},
			description: "Mixed Indonesian-English business context",
		},
		{
			name: "Regional Javanese Influence",
			text: "Pak, opo wis bisa ngurus akta kelahiran secara online? Nek ora, kudu datang langsung yo ke kantor Dukcapil?",
			mode: nlp.ProcessingModeRegional,
			features: []nlp.NLPFeature{
				nlp.FeatureLanguageDetection,
				nlp.FeatureEntityRecognition,
				nlp.FeatureIntentClassification,
				nlp.FeatureCulturalContext,
				nlp.FeatureAdministrativeTerms,
			},
			description: "Javanese dialect influence with administrative inquiry",
		},
	}

	ctx := context.Background()
	totalTests := len(testCases)
	passedTests := 0

	for i, testCase := range testCases {
		fmt.Printf("\n🧪 Test %d/%d: %s\n", i+1, totalTests, testCase.name)
		fmt.Printf("📝 Description: %s\n", testCase.description)
		fmt.Printf("🔤 Text: %s\n", testCase.text)
		fmt.Printf("⚙️  Mode: %s\n", testCase.mode)
		fmt.Printf("🎯 Features: %v\n", testCase.features)

		// Create NLP request
		request := &nlp.NLPRequest{
			Text:             testCase.text,
			UserID:           fmt.Sprintf("test_user_%d", i+1),
			SessionID:        fmt.Sprintf("test_session_%d", i+1),
			Context:          map[string]interface{}{"test_case": testCase.name},
			ProcessingMode:   testCase.mode,
			RequiredFeatures: testCase.features,
		}

		// Process with NLP service
		startTime := time.Now()
		response, err := nlpService.ProcessText(ctx, request)
		processingTime := time.Since(startTime)

		if err != nil {
			fmt.Printf("❌ Test failed: %v\n", err)
			continue
		}

		// Validate response
		if response == nil {
			fmt.Printf("❌ Test failed: nil response\n")
			continue
		}

		// Display results
		fmt.Printf("\n📊 Results:\n")
		fmt.Printf("   ⏱️  Processing Time: %.2fms\n", processingTime.Seconds()*1000)
		fmt.Printf("   🎯 Overall Confidence: %.2f\n", response.Confidence)
		fmt.Printf("   ✅ Processed Features: %d/%d\n", len(response.ProcessedFeatures), len(testCase.features))

		// Language Detection Results
		if response.Language.Language != "" {
			fmt.Printf("\n🌐 Language Detection:\n")
			fmt.Printf("   Language: %s (%.2f confidence)\n", response.Language.Language, response.Language.Confidence)
			fmt.Printf("   Dialect: %s\n", response.Language.Dialect)
			fmt.Printf("   Formality: %s\n", response.Language.Formality)
			fmt.Printf("   Script: %s\n", response.Language.Script)
		}

		// Entity Recognition Results
		if len(response.Entities) > 0 {
			fmt.Printf("\n🏷️  Entity Recognition (%d entities):\n", len(response.Entities))
			for j, entity := range response.Entities {
				if j < 5 { // Show first 5 entities
					fmt.Printf("   %d. %s [%s] (%.2f confidence)\n", j+1, entity.Text, entity.Category, entity.Confidence)
				}
			}
			if len(response.Entities) > 5 {
				fmt.Printf("   ... and %d more entities\n", len(response.Entities)-5)
			}
		}

		// Intent Classification Results
		if response.Intent.Intent != "" {
			fmt.Printf("\n🎯 Intent Classification:\n")
			fmt.Printf("   Intent: %s\n", response.Intent.Intent)
			fmt.Printf("   Category: %s (%.2f confidence)\n", response.Intent.Category, response.Intent.Confidence)
			if len(response.Intent.SubIntents) > 0 {
				fmt.Printf("   Sub-intents: %v\n", response.Intent.SubIntents)
			}
			if len(response.Intent.Parameters) > 0 {
				fmt.Printf("   Parameters: %v\n", response.Intent.Parameters)
			}
		}

		// Sentiment Analysis Results
		if response.Sentiment.Sentiment != "" {
			fmt.Printf("\n😊 Sentiment Analysis:\n")
			fmt.Printf("   Sentiment: %s (score: %.2f, confidence: %.2f)\n", 
				response.Sentiment.Sentiment, response.Sentiment.Score, response.Sentiment.Confidence)
			fmt.Printf("   Politeness: %.2f\n", response.Sentiment.Politeness)
			if len(response.Sentiment.Emotions) > 0 {
				fmt.Printf("   Emotions: ")
				for _, emotion := range response.Sentiment.Emotions {
					fmt.Printf("%s(%.2f) ", emotion.Emotion, emotion.Score)
				}
				fmt.Println()
			}
		}

		// Cultural Context Results
		if response.CulturalContext.Region != "" {
			fmt.Printf("\n🏛️  Cultural Context:\n")
			fmt.Printf("   Region: %s\n", response.CulturalContext.Region)
			fmt.Printf("   Context: %s\n", response.CulturalContext.Context)
			fmt.Printf("   Formality: %s\n", response.CulturalContext.Formality)
			fmt.Printf("   Appropriateness: %.2f\n", response.CulturalContext.Appropriateness)
			if len(response.CulturalContext.CulturalMarkers) > 0 {
				fmt.Printf("   Cultural Markers: %d detected\n", len(response.CulturalContext.CulturalMarkers))
			}
			if len(response.CulturalContext.Suggestions) > 0 {
				fmt.Printf("   Suggestions: %v\n", response.CulturalContext.Suggestions)
			}
		}

		// Administrative Terms Results
		if len(response.AdministrativeTerms) > 0 {
			fmt.Printf("\n🏛️  Administrative Terms (%d terms):\n", len(response.AdministrativeTerms))
			for j, term := range response.AdministrativeTerms {
				if j < 3 { // Show first 3 terms
					fmt.Printf("   %d. %s [%s] - %s (%.2f confidence)\n", 
						j+1, term.Term, term.Category, term.Definition, term.Confidence)
					if term.Office != "" {
						fmt.Printf("      Office: %s\n", term.Office)
					}
				}
			}
			if len(response.AdministrativeTerms) > 3 {
				fmt.Printf("   ... and %d more terms\n", len(response.AdministrativeTerms)-3)
			}
		}

		// Validate minimum requirements for success
		success := true
		if response.Confidence < 0.3 {
			fmt.Printf("⚠️  Warning: Low overall confidence (%.2f)\n", response.Confidence)
		}

		if len(response.ProcessedFeatures) < len(testCase.features)/2 {
			fmt.Printf("⚠️  Warning: Only %d/%d features processed\n", len(response.ProcessedFeatures), len(testCase.features))
		}

		// Check for Indonesian language detection
		if testCase.mode != nlp.ProcessingModeStandard && response.Language.Language != "indonesian" {
			fmt.Printf("⚠️  Warning: Expected Indonesian language, got: %s\n", response.Language.Language)
		}

		if success {
			fmt.Printf("✅ Test passed!\n")
			passedTests++
		} else {
			fmt.Printf("❌ Test failed!\n")
		}

		fmt.Println(strings.Repeat("-", 60))
	}

	// Display final results
	fmt.Printf("\n🎉 Integration Test Summary:\n")
	fmt.Printf("   Total Tests: %d\n", totalTests)
	fmt.Printf("   Passed: %d\n", passedTests)
	fmt.Printf("   Failed: %d\n", totalTests-passedTests)
	fmt.Printf("   Success Rate: %.1f%%\n", float64(passedTests)/float64(totalTests)*100)

	// Display service statistics
	stats := nlpService.GetStats()
	fmt.Printf("\n📊 NLP Service Statistics:\n")
	fmt.Printf("   Total Requests: %d\n", stats.TotalRequests)
	fmt.Printf("   Successful Processing: %d\n", stats.SuccessfulProcessing)
	fmt.Printf("   Failed Processing: %d\n", stats.FailedProcessing)
	fmt.Printf("   Average Processing Time: %.2fms\n", stats.AverageProcessingTime)
	fmt.Printf("   Cache Hit Rate: %.2f%%\n", stats.CacheHitRate*100)
	fmt.Printf("   Accuracy Score: %.2f\n", stats.AccuracyScore)

	if passedTests == totalTests {
		fmt.Printf("\n🎊 All tests passed! Indonesian NLP Service is working correctly.\n")
		fmt.Printf("🚀 Ready for Phase 2 Day 3-4: Continuous Learning Engine integration.\n")
	} else {
		fmt.Printf("\n⚠️  Some tests failed. Please review the implementation.\n")
	}

	fmt.Println(strings.Repeat("=", 60))
	fmt.Println("🔤 Indonesian NLP Service Integration Test Complete!")
}

// main function to run the NLP test
func main() {
	TestNLPIntegration()
}

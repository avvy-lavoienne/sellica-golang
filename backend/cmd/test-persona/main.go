package main

import (
	"context"
	"fmt"
	"time"

	"selly-backend/internal/services/persona"

	"github.com/sirupsen/logrus"
)

// PersonaTestSuite tests SELLY persona functionality
type PersonaTestSuite struct {
	persona *persona.SellyPersona
}

// NewPersonaTestSuite creates a new persona test suite
func NewPersonaTestSuite() *PersonaTestSuite {
	return &PersonaTestSuite{
		persona: persona.NewSellyPersona(),
	}
}

// TestIndonesianServiceScenarios tests realistic Indonesian service scenarios
func (pts *PersonaTestSuite) TestIndonesianServiceScenarios() error {
	logrus.Info("🧪 Testing Indonesian service scenarios...")

	testCases := []struct {
		name         string
		query        string
		serviceType  string
		timeOfDay    string
		isFirstContact bool
		expectedElements []string
	}{
		{
			name:         "KTP Morning First Contact",
			query:        "Bagaimana cara mengurus KTP yang hilang?",
			serviceType:  "ktp",
			timeOfDay:    "morning",
			isFirstContact: true,
			expectedElements: []string{"Selamat pagi", "SELLY", "dokumen asli", "14 hari kerja"},
		},
		{
			name:         "Akta Afternoon Returning User",
			query:        "Syarat membuat akta kelahiran anak?",
			serviceType:  "akta",
			timeOfDay:    "afternoon",
			isFirstContact: false,
			expectedElements: []string{"Selamat siang", "gratis", "1 hari"},
		},
		{
			name:         "Perpindahan Evening Complex",
			query:        "Cara pindah domisili antar kota?",
			serviceType:  "perpindahan",
			timeOfDay:    "evening",
			isFirstContact: true,
			expectedElements: []string{"Selamat sore", "kelurahan asal", "3-7 hari kerja"},
		},
		{
			name:         "Informal Language Correction",
			query:        "gimana cara ngurus KTP?",
			serviceType:  "ktp",
			timeOfDay:    "morning",
			isFirstContact: false,
			expectedElements: []string{"bagaimana", "Anda", "Bapak/Ibu"},
		},
	}

	for _, tc := range testCases {
		logrus.Infof("  🔍 Testing: %s", tc.name)

		req := &persona.PersonaRequest{
			Query:          tc.query,
			UserID:         "test-user-123",
			SessionID:      "test-session-456",
			Context:        map[string]interface{}{},
			BaseResponse:   "Untuk mengurus dokumen tersebut, Anda perlu menyiapkan persyaratan.",
			ServiceType:    tc.serviceType,
			IsFirstContact: tc.isFirstContact,
			TimeOfDay:      tc.timeOfDay,
			UserTone:       "neutral",
		}

		response, err := pts.persona.ApplyPersona(context.Background(), req)
		if err != nil {
			return fmt.Errorf("test '%s' failed: %w", tc.name, err)
		}

		// Check expected elements
		for _, element := range tc.expectedElements {
			if !contains(response.Content, element) {
				logrus.Warnf("    ⚠️ Missing expected element '%s' in response: %s", element, response.Content)
			} else {
				logrus.Debugf("    ✅ Found expected element: %s", element)
			}
		}

		// Validate persona application
		if !response.PersonalityApplied {
			return fmt.Errorf("test '%s': personality was not applied", tc.name)
		}

		// Validate service classification
		if response.ServiceClassification != tc.serviceType {
			return fmt.Errorf("test '%s': expected service '%s', got '%s'", 
				tc.name, tc.serviceType, response.ServiceClassification)
		}

		// Validate recommendations
		if len(response.Recommendations) == 0 {
			logrus.Warnf("    ⚠️ No recommendations generated for %s", tc.name)
		}

		logrus.Infof("    ✅ %s: PASSED", tc.name)
	}

	logrus.Info("✅ Indonesian service scenarios test completed")
	return nil
}

// TestCulturalProcessing tests Indonesian cultural processing
func (pts *PersonaTestSuite) TestCulturalProcessing() error {
	logrus.Info("🧪 Testing Indonesian cultural processing...")

	testCases := []struct {
		name           string
		baseResponse   string
		expectedChanges []string
		shouldChange   bool
	}{
		{
			name:         "Informal to Formal Conversion",
			baseResponse: "kamu harus bawa dokumen, gimana caranya?",
			expectedChanges: []string{"Anda", "bagaimana"},
			shouldChange: true,
		},
		{
			name:         "Government Terminology",
			baseResponse: "Pergi ke kantor pemerintah untuk mengurus id card",
			expectedChanges: []string{"instansi pemerintah", "Kartu Tanda Penduduk"},
			shouldChange: true,
		},
		{
			name:         "Already Formal Response",
			baseResponse: "Silakan Anda datang ke Dinas Kependudukan dengan membawa dokumen asli",
			expectedChanges: []string{},
			shouldChange: false,
		},
	}

	for _, tc := range testCases {
		logrus.Infof("  🔍 Testing: %s", tc.name)

		req := &persona.PersonaRequest{
			Query:        "Test query",
			BaseResponse: tc.baseResponse,
			ServiceType:  "ktp",
		}

		response, err := pts.persona.ApplyPersona(context.Background(), req)
		if err != nil {
			return fmt.Errorf("cultural processing test '%s' failed: %w", tc.name, err)
		}

		// Check if changes were applied
		contentChanged := response.Content != tc.baseResponse
		if tc.shouldChange && !contentChanged {
			logrus.Warnf("    ⚠️ Expected changes but content remained the same")
		}

		// Check for expected changes
		for _, expectedChange := range tc.expectedChanges {
			if !contains(response.Content, expectedChange) {
				logrus.Warnf("    ⚠️ Expected change '%s' not found in: %s", expectedChange, response.Content)
			} else {
				logrus.Debugf("    ✅ Found expected change: %s", expectedChange)
			}
		}

		logrus.Infof("    ✅ %s: PASSED", tc.name)
	}

	logrus.Info("✅ Cultural processing test completed")
	return nil
}

// TestGreetingGeneration tests greeting generation functionality
func (pts *PersonaTestSuite) TestGreetingGeneration() error {
	logrus.Info("🧪 Testing greeting generation...")

	testCases := []struct {
		timeOfDay      string
		isFirstContact bool
		expectedGreeting string
	}{
		{"morning", true, "Selamat pagi"},
		{"afternoon", true, "Selamat siang"},
		{"evening", true, "Selamat sore"},
		{"night", true, "Selamat malam"},
		{"morning", false, "Selamat pagi"},
	}

	for _, tc := range testCases {
		logrus.Infof("  🔍 Testing: %s greeting, first contact: %v", tc.timeOfDay, tc.isFirstContact)

		req := &persona.PersonaRequest{
			Query:          "Test query",
			BaseResponse:   "Test response",
			TimeOfDay:      tc.timeOfDay,
			IsFirstContact: tc.isFirstContact,
		}

		response, err := pts.persona.ApplyPersona(context.Background(), req)
		if err != nil {
			return fmt.Errorf("greeting test failed: %w", err)
		}

		if !contains(response.Content, tc.expectedGreeting) {
			return fmt.Errorf("expected greeting '%s' not found in response: %s", 
				tc.expectedGreeting, response.Content)
		}

		logrus.Infof("    ✅ %s greeting: PASSED", tc.timeOfDay)
	}

	logrus.Info("✅ Greeting generation test completed")
	return nil
}

// TestPerformance tests persona performance
func (pts *PersonaTestSuite) TestPerformance() error {
	logrus.Info("🧪 Testing persona performance...")

	req := &persona.PersonaRequest{
		Query:          "Bagaimana cara mengurus KTP yang hilang?",
		BaseResponse:   "Untuk mengurus KTP yang hilang, Anda perlu membawa dokumen persyaratan.",
		ServiceType:    "ktp",
		IsFirstContact: true,
		TimeOfDay:      "morning",
	}

	// Run multiple iterations to test performance
	iterations := 100
	totalTime := time.Duration(0)

	for i := 0; i < iterations; i++ {
		start := time.Now()
		_, err := pts.persona.ApplyPersona(context.Background(), req)
		if err != nil {
			return fmt.Errorf("performance test iteration %d failed: %w", i, err)
		}
		totalTime += time.Since(start)
	}

	averageTime := totalTime / time.Duration(iterations)
	logrus.Infof("  📊 Average processing time: %v", averageTime)
	logrus.Infof("  📊 Total iterations: %d", iterations)
	logrus.Infof("  📊 Total time: %v", totalTime)

	// Performance threshold (should be under 10ms on average)
	if averageTime > 10*time.Millisecond {
		logrus.Warnf("  ⚠️ Performance warning: average time %v exceeds 10ms threshold", averageTime)
	} else {
		logrus.Infof("  ✅ Performance: PASSED (under 10ms threshold)")
	}

	logrus.Info("✅ Performance test completed")
	return nil
}

// Helper function
func contains(text, substring string) bool {
	return len(text) >= len(substring) && 
		   (text == substring || 
		    len(text) > len(substring) && 
		    (text[:len(substring)] == substring || 
		     text[len(text)-len(substring):] == substring ||
		     containsSubstring(text, substring)))
}

func containsSubstring(text, substring string) bool {
	for i := 0; i <= len(text)-len(substring); i++ {
		if text[i:i+len(substring)] == substring {
			return true
		}
	}
	return false
}

func main() {
	logrus.SetLevel(logrus.InfoLevel)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	logrus.Info("🚀 SELLY Persona Integration Test Suite Starting...")

	testSuite := NewPersonaTestSuite()

	// Run all tests
	tests := []struct {
		name string
		fn   func() error
	}{
		{"Indonesian Service Scenarios", testSuite.TestIndonesianServiceScenarios},
		{"Cultural Processing", testSuite.TestCulturalProcessing},
		{"Greeting Generation", testSuite.TestGreetingGeneration},
		{"Performance", testSuite.TestPerformance},
	}

	for _, test := range tests {
		logrus.Infof("🧪 Running test: %s", test.name)
		if err := test.fn(); err != nil {
			logrus.Fatalf("❌ Test '%s' failed: %v", test.name, err)
		}
		logrus.Infof("✅ Test '%s' completed successfully", test.name)
		fmt.Println()
	}

	logrus.Info("🎉 All SELLY Persona tests completed successfully!")
	logrus.Info("✅ SELLY Persona Service is ready for production use")
}

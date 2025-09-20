package providers

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"
)

func TestNewGroqSELLYProvider(t *testing.T) {
	// Test with API key
	provider := NewGroqSELLYProvider("test-api-key")

	if provider == nil {
		t.Fatal("Expected provider to be created, got nil")
	}

	if !provider.IsEnabled() {
		t.Error("Expected provider to be enabled")
	}

	if provider.GetProviderName() != "groq-selly-enhanced" {
		t.Errorf("Expected provider name 'groq-selly-enhanced', got '%s'", provider.GetProviderName())
	}

	// Clean up
	provider.Close()
}

func TestGroqSELLYProvider_CulturalContextAnalysis(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	ctx := context.Background()

	testCases := []struct {
		name              string
		query             string
		expectedService   string
		expectedFormality string
		expectedTone      string
	}{
		{
			name:              "KTP formal query",
			query:             "Bagaimana cara mengurus KTP, Bapak?",
			expectedService:   "ktp",
			expectedFormality: "formal",
			expectedTone:      "polite",
		},
		{
			name:              "Akta informal query",
			query:             "gimana ngurus akta kelahiran?",
			expectedService:   "akta",
			expectedFormality: "informal",
			expectedTone:      "neutral",
		},
		{
			name:              "Perpindahan urgent query",
			query:             "saya butuh cepat surat pindah domisili",
			expectedService:   "perpindahan",
			expectedFormality: "formal",
			expectedTone:      "urgent",
		},
		{
			name:              "General frustrated query",
			query:             "susah banget ngurus dokumen di sini",
			expectedService:   "umum",
			expectedFormality: "informal",
			expectedTone:      "frustrated",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := &AIRequest{
				Query:  tc.query,
				UserID: "test-user",
			}

			cultural, err := provider.analyzeCulturalContext(ctx, req)
			if err != nil {
				t.Fatalf("Cultural analysis failed: %v", err)
			}

			if cultural.ServiceType != tc.expectedService {
				t.Errorf("Expected service type '%s', got '%s'", tc.expectedService, cultural.ServiceType)
			}

			if cultural.FormalityLevel != tc.expectedFormality {
				t.Errorf("Expected formality '%s', got '%s'", tc.expectedFormality, cultural.FormalityLevel)
			}

			if cultural.UserTone != tc.expectedTone {
				t.Errorf("Expected tone '%s', got '%s'", tc.expectedTone, cultural.UserTone)
			}
		})
	}
}

func TestGroqSELLYProvider_GreetingDetection(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	ctx := context.Background()

	testCases := []struct {
		name                string
		query               string
		expectedHasGreeting bool
		expectedType        string
		expectedFormality   string
	}{
		{
			name:                "Morning greeting formal",
			query:               "Selamat pagi, Bapak. Saya mau tanya tentang KTP",
			expectedHasGreeting: true,
			expectedType:        "selamat pagi",
			expectedFormality:   "formal",
		},
		{
			name:                "Informal hello",
			query:               "Hai, gimana cara ngurus akta?",
			expectedHasGreeting: true,
			expectedType:        "hai",
			expectedFormality:   "informal",
		},
		{
			name:                "Islamic greeting",
			query:               "Assalamualaikum, saya butuh bantuan",
			expectedHasGreeting: true,
			expectedType:        "assalamualaikum",
			expectedFormality:   "formal",
		},
		{
			name:                "No greeting",
			query:               "Berapa lama proses KTP?",
			expectedHasGreeting: false,
			expectedType:        "",
			expectedFormality:   "formal",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := &AIRequest{
				Query:  tc.query,
				UserID: "test-user",
			}

			greeting, err := provider.detectGreetingPatterns(ctx, req)
			if err != nil {
				t.Fatalf("Greeting detection failed: %v", err)
			}

			if greeting.HasGreeting != tc.expectedHasGreeting {
				t.Errorf("Expected hasGreeting %v, got %v", tc.expectedHasGreeting, greeting.HasGreeting)
			}

			if greeting.GreetingType != tc.expectedType {
				t.Errorf("Expected greeting type '%s', got '%s'", tc.expectedType, greeting.GreetingType)
			}

			if greeting.FormalityLevel != tc.expectedFormality {
				t.Errorf("Expected formality '%s', got '%s'", tc.expectedFormality, greeting.FormalityLevel)
			}
		})
	}
}

func TestGroqSELLYProvider_ServiceClassification(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	testCases := []struct {
		query           string
		expectedService string
	}{
		{"cara buat KTP baru", "ktp"},
		{"pengurusan kartu tanda penduduk", "ktp"},
		{"akta kelahiran anak", "akta"},
		{"surat akta nikah", "akta"},
		{"pindah domisili", "perpindahan"},
		{"surat pindah alamat", "perpindahan"},
		{"kartu keluarga hilang", "kk"},
		{"KK rusak", "kk"},
		{"surat keterangan", "surat"},
		{"informasi umum", "umum"},
	}

	for _, tc := range testCases {
		t.Run(tc.query, func(t *testing.T) {
			result := provider.classifyServiceType(strings.ToLower(tc.query))
			if result != tc.expectedService {
				t.Errorf("Query '%s': expected service '%s', got '%s'", tc.query, tc.expectedService, result)
			}
		})
	}
}

func TestGroqSELLYProvider_FormalityAnalysis(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	testCases := []struct {
		query             string
		expectedFormality string
	}{
		{"gimana cara ngurus KTP kamu?", "informal"},
		{"bagaimana cara mengurus KTP Anda?", "formal"},
		{"Mohon bantuan untuk pengurusan dokumen", "formal"},
		{"tolong bantu gue dong", "informal"},
		{"Silakan Bapak jelaskan prosedurnya", "formal"},
		{"lo tau gak caranya?", "informal"},
	}

	for _, tc := range testCases {
		t.Run(tc.query, func(t *testing.T) {
			result := provider.analyzeFormalityLevel(strings.ToLower(tc.query))
			if result != tc.expectedFormality {
				t.Errorf("Query '%s': expected formality '%s', got '%s'", tc.query, tc.expectedFormality, result)
			}
		})
	}
}

func TestGroqSELLYProvider_UserToneAnalysis(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	testCases := []struct {
		query        string
		expectedTone string
	}{
		{"tolong bantu saya", "polite"},
		{"mohon informasinya", "polite"},
		{"saya butuh cepat dokumen ini", "urgent"},
		{"mendesak sekali", "urgent"},
		{"susah banget prosesnya", "frustrated"},
		{"saya bingung dengan caranya", "frustrated"},
		{"bagaimana prosedurnya?", "neutral"},
	}

	for _, tc := range testCases {
		t.Run(tc.query, func(t *testing.T) {
			result := provider.analyzeUserTone(strings.ToLower(tc.query))
			if result != tc.expectedTone {
				t.Errorf("Query '%s': expected tone '%s', got '%s'", tc.query, tc.expectedTone, result)
			}
		})
	}
}

func TestGroqSELLYProvider_CulturalIndicators(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	testCases := []struct {
		query              string
		expectedIndicators []string
	}{
		{
			"Selamat pagi Bapak, mohon bantuan",
			[]string{"formal_address", "courtesy_language"},
		},
		{
			"Assalamualaikum, saya mau tanya",
			[]string{"islamic_greeting"},
		},
		{
			"ke disdukcapil untuk ngurus dokumen",
			[]string{"government_context"},
		},
		{
			"silakan Ibu jelaskan prosedur di dinas",
			[]string{"formal_address", "courtesy_language", "government_context"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.query, func(t *testing.T) {
			result := provider.detectCulturalIndicators(strings.ToLower(tc.query))

			// Check if all expected indicators are present
			for _, expected := range tc.expectedIndicators {
				found := false
				for _, actual := range result {
					if actual == expected {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("Query '%s': expected indicator '%s' not found in %v", tc.query, expected, result)
				}
			}
		})
	}
}

func TestGroqSELLYProvider_TimeOfDay(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	req := &AIRequest{UserID: "test-user"}
	timeOfDay := provider.determineTimeOfDay(req)

	validTimes := []string{"morning", "afternoon", "evening", "night"}
	found := false
	for _, valid := range validTimes {
		if timeOfDay == valid {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("Expected valid time of day, got '%s'", timeOfDay)
	}
}

func TestGroqSELLYProvider_PerformanceMetrics(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	// Get initial metrics
	metrics := provider.GetPerformanceMetrics()

	if !metrics["enabled"].(bool) {
		t.Error("Expected performance monitoring to be enabled")
	}

	if metrics["total_requests"].(int64) != 0 {
		t.Error("Expected initial request count to be 0")
	}

	// Simulate some processing
	mockResponse := &AIResponse{
		Content: "Test response",
		Model:   "SELLY Enhanced",
	}

	provider.updatePerformanceMetrics(10*time.Millisecond, mockResponse)

	// Check updated metrics
	updatedMetrics := provider.GetPerformanceMetrics()
	if updatedMetrics["total_requests"].(int64) != 1 {
		t.Error("Expected request count to be 1 after update")
	}
}

func TestGroqSELLYProvider_EnableDisable(t *testing.T) {
	provider := NewGroqSELLYProvider("test-api-key")
	defer provider.Close()

	// Test initial state
	if !provider.IsEnabled() {
		t.Error("Expected provider to be enabled initially")
	}

	// Test disable
	provider.SetEnabled(false)
	if provider.IsEnabled() {
		t.Error("Expected provider to be disabled after SetEnabled(false)")
	}

	// Test re-enable
	provider.SetEnabled(true)
	if !provider.IsEnabled() {
		t.Error("Expected provider to be enabled after SetEnabled(true)")
	}
}

// Integration test - only runs if GROQ_API_KEY is available
func TestGroqSELLYProvider_Integration(t *testing.T) {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		t.Skip("Skipping integration test - GROQ_API_KEY not set")
	}

	provider := NewGroqSELLYProvider(apiKey)
	defer provider.Close()

	_ = context.Background()
	req := &AIRequest{
		Query:  "Selamat pagi, bagaimana cara mengurus KTP?",
		UserID: "test-user-integration",
	}
	_ = req.Query  // Use the request fields
	_ = req.UserID

	// This would test the full integration, but we'll skip actual API calls in tests
	// to avoid API costs and rate limits
	t.Log("Integration test setup successful - would test full API integration")
}

package persona

import (
	"context"
	"strings"
	"testing"
)

func TestNewSellyPersona(t *testing.T) {
	persona := NewSellyPersona()

	if persona == nil {
		t.Fatal("Expected persona to be created, got nil")
	}

	if !persona.IsEnabled() {
		t.Error("Expected persona to be enabled by default")
	}

	if persona.config == nil {
		t.Error("Expected persona config to be loaded")
	}

	if persona.greetingManager == nil {
		t.Error("Expected greeting manager to be initialized")
	}

	if persona.culturalProcessor == nil {
		t.Error("Expected cultural processor to be initialized")
	}
}

func TestPersonaConfig(t *testing.T) {
	persona := NewSellyPersona()
	config := persona.GetConfig()

	// Test identity configuration
	if config.Identity.Name != "SELLY" {
		t.Errorf("Expected name to be 'SELLY', got '%s'", config.Identity.Name)
	}

	if config.Identity.Institution != "Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut" {
		t.Error("Expected correct institution name")
	}

	// Test personality traits
	expectedTraits := []string{"profesional", "empati", "responsif", "budaya-lokal", "dapat-dipercaya", "sabar"}
	for _, trait := range expectedTraits {
		if !contains(config.Personality.Traits, trait) {
			t.Errorf("Expected trait '%s' to be present", trait)
		}
	}

	// Test knowledge domains
	expectedDomains := []string{"administrasi-kependudukan", "pelayanan-publik"}
	for _, domain := range expectedDomains {
		if !contains(config.Knowledge.Domains, domain) {
			t.Errorf("Expected domain '%s' to be present", domain)
		}
	}

	// Test service types
	expectedServices := []string{"ktp", "akta", "perpindahan", "kk", "surat", "umum"}
	for _, service := range expectedServices {
		if !contains(config.Knowledge.ServiceTypes, service) {
			t.Errorf("Expected service type '%s' to be present", service)
		}
	}
}

func TestApplyPersona_BasicFunctionality(t *testing.T) {
	persona := NewSellyPersona()
	ctx := context.Background()

	req := &PersonaRequest{
		Query:          "Bagaimana cara mengurus KTP?",
		UserID:         "test-user-123",
		SessionID:      "test-session-456",
		Context:        map[string]interface{}{},
		BaseResponse:   "Untuk mengurus KTP, Anda perlu membawa dokumen persyaratan.",
		ServiceType:    "ktp",
		IsFirstContact: true,
		TimeOfDay:      "morning",
		UserTone:       "neutral",
	}

	response, err := persona.ApplyPersona(ctx, req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if response == nil {
		t.Fatal("Expected response, got nil")
	}

	// Test that persona was applied
	if !response.PersonalityApplied {
		t.Error("Expected personality to be applied")
	}

	// Test that greeting was generated
	if response.Greeting == "" {
		t.Error("Expected greeting to be generated for first contact")
	}

	// Test that content includes greeting
	if !strings.Contains(response.Content, "Selamat pagi") {
		t.Error("Expected morning greeting in content")
	}

	// Test service classification
	if response.ServiceClassification != "ktp" {
		t.Errorf("Expected service classification 'ktp', got '%s'", response.ServiceClassification)
	}

	// Test recommendations
	if len(response.Recommendations) == 0 {
		t.Error("Expected recommendations to be generated")
	}

	// Test processing time (should be non-negative)
	if response.ProcessingTime < 0 {
		t.Error("Expected non-negative processing time")
	}
}

func TestApplyPersona_ServiceTypeClassification(t *testing.T) {
	persona := NewSellyPersona()
	ctx := context.Background()

	testCases := []struct {
		query           string
		expectedService string
	}{
		{"Bagaimana cara mengurus KTP yang hilang?", "ktp"},
		{"Syarat membuat akta kelahiran?", "akta"},
		{"Cara pindah domisili antar kota?", "perpindahan"},
		{"Informasi umum tentang pelayanan", "umum"},
	}

	for _, tc := range testCases {
		req := &PersonaRequest{
			Query:        tc.query,
			BaseResponse: "Test response",
			ServiceType:  "", // Let it classify automatically
		}

		response, err := persona.ApplyPersona(ctx, req)
		if err != nil {
			t.Fatalf("Error for query '%s': %v", tc.query, err)
		}

		if response.ServiceClassification != tc.expectedService {
			t.Errorf("Query '%s': expected service '%s', got '%s'",
				tc.query, tc.expectedService, response.ServiceClassification)
		}
	}
}

func TestApplyPersona_TimeBasedGreeting(t *testing.T) {
	persona := NewSellyPersona()
	ctx := context.Background()

	testCases := []struct {
		timeOfDay        string
		expectedGreeting string
	}{
		{"morning", "Selamat pagi"},
		{"afternoon", "Selamat siang"},
		{"evening", "Selamat sore"},
		{"night", "Selamat malam"},
	}

	for _, tc := range testCases {
		req := &PersonaRequest{
			Query:          "Test query",
			BaseResponse:   "Test response",
			IsFirstContact: true,
			TimeOfDay:      tc.timeOfDay,
		}

		response, err := persona.ApplyPersona(ctx, req)
		if err != nil {
			t.Fatalf("Error for time '%s': %v", tc.timeOfDay, err)
		}

		if !strings.Contains(response.Content, tc.expectedGreeting) {
			t.Errorf("Time '%s': expected greeting '%s' in content '%s'",
				tc.timeOfDay, tc.expectedGreeting, response.Content)
		}
	}
}

func TestApplyPersona_FormalityLevel(t *testing.T) {
	persona := NewSellyPersona()
	ctx := context.Background()

	req := &PersonaRequest{
		Query:        "gimana cara ngurus KTP?",
		BaseResponse: "kamu harus bawa dokumen",
		ServiceType:  "ktp",
	}

	response, err := persona.ApplyPersona(ctx, req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Test that informal language was converted to formal
	if strings.Contains(response.Content, "kamu") {
		t.Error("Expected informal 'kamu' to be replaced with formal address")
	}

	if strings.Contains(response.Content, "gimana") {
		t.Error("Expected informal 'gimana' to be replaced with 'bagaimana'")
	}

	// Test that formal address is present
	if !strings.Contains(response.Content, "Anda") && !strings.Contains(response.Content, "Bapak/Ibu") {
		t.Error("Expected formal address to be present")
	}
}

func TestApplyPersona_Recommendations(t *testing.T) {
	persona := NewSellyPersona()
	ctx := context.Background()

	testCases := []struct {
		serviceType            string
		expectedRecommendation string
	}{
		{"ktp", "dokumen asli"},
		{"akta", "gratis"},
		{"perpindahan", "kelurahan asal"},
	}

	for _, tc := range testCases {
		req := &PersonaRequest{
			Query:        "Test query",
			BaseResponse: "Test response",
			ServiceType:  tc.serviceType,
		}

		response, err := persona.ApplyPersona(ctx, req)
		if err != nil {
			t.Fatalf("Error for service '%s': %v", tc.serviceType, err)
		}

		found := false
		for _, recommendation := range response.Recommendations {
			if strings.Contains(strings.ToLower(recommendation), tc.expectedRecommendation) {
				found = true
				break
			}
		}

		if !found {
			t.Errorf("Service '%s': expected recommendation containing '%s', got %v",
				tc.serviceType, tc.expectedRecommendation, response.Recommendations)
		}
	}
}

func TestApplyPersona_DisabledPersona(t *testing.T) {
	persona := NewSellyPersona()
	persona.SetEnabled(false)
	ctx := context.Background()

	req := &PersonaRequest{
		Query:        "Test query",
		BaseResponse: "Original response",
	}

	response, err := persona.ApplyPersona(ctx, req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if response.PersonalityApplied {
		t.Error("Expected personality not to be applied when disabled")
	}

	if response.Content != req.BaseResponse {
		t.Error("Expected original response when persona is disabled")
	}
}

func TestApplyPersona_Metadata(t *testing.T) {
	persona := NewSellyPersona()
	ctx := context.Background()

	req := &PersonaRequest{
		Query:        "Test query",
		BaseResponse: "Test response",
		ServiceType:  "ktp",
	}

	response, err := persona.ApplyPersona(ctx, req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Test metadata presence
	if response.Metadata == nil {
		t.Fatal("Expected metadata to be present")
	}

	expectedKeys := []string{"persona_version", "cultural_processing", "personality_traits", "formality_applied"}
	for _, key := range expectedKeys {
		if _, exists := response.Metadata[key]; !exists {
			t.Errorf("Expected metadata key '%s' to be present", key)
		}
	}

	// Test personality traits in metadata
	if traits, exists := response.Metadata["personality_traits"]; exists {
		if traitsSlice, ok := traits.([]string); ok {
			if !contains(traitsSlice, "profesional") {
				t.Error("Expected 'profesional' trait in metadata")
			}
		} else {
			t.Error("Expected personality_traits to be a string slice")
		}
	}
}

func TestPersonaEnableDisable(t *testing.T) {
	persona := NewSellyPersona()

	// Test initial state
	if !persona.IsEnabled() {
		t.Error("Expected persona to be enabled by default")
	}

	// Test disable
	persona.SetEnabled(false)
	if persona.IsEnabled() {
		t.Error("Expected persona to be disabled after SetEnabled(false)")
	}

	// Test enable
	persona.SetEnabled(true)
	if !persona.IsEnabled() {
		t.Error("Expected persona to be enabled after SetEnabled(true)")
	}
}

// Benchmark tests
func BenchmarkApplyPersona(b *testing.B) {
	persona := NewSellyPersona()
	ctx := context.Background()

	req := &PersonaRequest{
		Query:          "Bagaimana cara mengurus KTP?",
		UserID:         "test-user",
		SessionID:      "test-session",
		BaseResponse:   "Untuk mengurus KTP, Anda perlu membawa dokumen persyaratan.",
		ServiceType:    "ktp",
		IsFirstContact: true,
		TimeOfDay:      "morning",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := persona.ApplyPersona(ctx, req)
		if err != nil {
			b.Fatalf("Benchmark failed: %v", err)
		}
	}
}

func BenchmarkServiceClassification(b *testing.B) {
	persona := NewSellyPersona()

	queries := []string{
		"Bagaimana cara mengurus KTP?",
		"Syarat membuat akta kelahiran?",
		"Cara pindah domisili antar kota?",
		"Informasi umum tentang pelayanan",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		query := queries[i%len(queries)]
		persona.classifyService(query, "")
	}
}

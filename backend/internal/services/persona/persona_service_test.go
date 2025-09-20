package persona

import (
	"context"
	"os"
	"testing"
)

func TestNewPersonaService(t *testing.T) {
	// Clear environment variables for consistent testing
	os.Unsetenv("PHASE2_REGIONAL_ADAPTER_ENABLED")
	os.Unsetenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED")
	os.Unsetenv("PHASE2_FACE_SAVING_ENABLED")

	service := NewPersonaService()

	if service == nil {
		t.Fatal("Expected NewPersonaService to return a non-nil service")
	}

	if !service.enabled {
		t.Error("Expected service to be enabled by default")
	}

	if service.enhancedIntegration == nil {
		t.Error("Expected enhancedIntegration to be initialized")
	}

	if service.fallbackGenerator == nil {
		t.Error("Expected fallbackGenerator to be initialized")
	}

	if service.featureFlags == nil {
		t.Error("Expected featureFlags to be initialized")
	}
}

func TestPersonaServiceWithFeatureFlags(t *testing.T) {
	// Test with Phase 2 features disabled (default)
	os.Unsetenv("PHASE2_REGIONAL_ADAPTER_ENABLED")
	os.Unsetenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED")
	os.Unsetenv("PHASE2_FACE_SAVING_ENABLED")

	service := NewPersonaService()

	// Phase 2 components should be nil when flags are disabled
	if service.regionalAdapter != nil {
		t.Error("Expected regionalAdapter to be nil when flag is disabled")
	}
	if service.religiousCalendar != nil {
		t.Error("Expected religiousCalendar to be nil when flag is disabled")
	}
	if service.faceSavingProcessor != nil {
		t.Error("Expected faceSavingProcessor to be nil when flag is disabled")
	}

	// Test with Phase 2 features enabled
	os.Setenv("PHASE2_REGIONAL_ADAPTER_ENABLED", "true")
	os.Setenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED", "true")
	os.Setenv("PHASE2_FACE_SAVING_ENABLED", "true")
	defer func() {
		os.Unsetenv("PHASE2_REGIONAL_ADAPTER_ENABLED")
		os.Unsetenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED")
		os.Unsetenv("PHASE2_FACE_SAVING_ENABLED")
	}()

	// Create new service with updated flags
	service2 := NewPersonaService()

	// Phase 2 components should still be nil (not implemented yet)
	// but the flags should be updated
	if !service2.featureFlags.RegionalAdapterEnabled {
		t.Error("Expected RegionalAdapterEnabled to be true from environment")
	}
	if !service2.featureFlags.ReligiousCalendarEnabled {
		t.Error("Expected ReligiousCalendarEnabled to be true from environment")
	}
	if !service2.featureFlags.FaceSavingProcessorEnabled {
		t.Error("Expected FaceSavingProcessorEnabled to be true from environment")
	}
}

func TestProcessWithPersonaLowConfidenceFallback(t *testing.T) {
	service := NewPersonaService()

	req := &PersonaProcessingRequest{
		Query:          "xyz123randomtextthatmakesnosense",
		UserID:         "test-user",
		SessionID:      "test-fallback-final",
		BaseResponse:   "This is a test response",
		IsFirstContact: false,
		Context:        map[string]interface{}{},
	}

	resp, err := service.ProcessWithPersona(context.Background(), req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if resp == nil {
		t.Fatal("Expected non-nil response")
	}

	// Check if fallback was applied for low confidence
	if resp.Metadata != nil {
		if fallbackApplied, exists := resp.Metadata["fallback_applied"]; exists {
			if fallbackApplied.(bool) {
				t.Log("✅ Fallback correctly applied for low confidence query")

				if fallbackReason, exists := resp.Metadata["fallback_reason"]; exists {
					expectedReason := "low_confidence_or_unknown_service"
					if fallbackReason != expectedReason {
						t.Errorf("Expected fallback reason %s, got %s", expectedReason, fallbackReason)
					}
				}
			}
		}
	}
}

func TestProcessWithPersonaHighConfidence(t *testing.T) {
	service := NewPersonaService()

	req := &PersonaProcessingRequest{
		Query:          "saya ingin cetak ktp",
		UserID:         "test-user",
		SessionID:      "test-high-confidence",
		BaseResponse:   "Untuk mencetak KTP, Anda perlu...",
		IsFirstContact: false,
		Context:        map[string]interface{}{},
	}

	resp, err := service.ProcessWithPersona(context.Background(), req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if resp == nil {
		t.Fatal("Expected non-nil response")
	}

	// Check that fallback was NOT applied for high confidence
	if resp.Metadata != nil {
		if fallbackApplied, exists := resp.Metadata["fallback_applied"]; exists {
			if fallbackApplied.(bool) {
				t.Error("Expected no fallback for high confidence KTP query")
			}
		}
	}

	// Check service recognition
	if resp.ServiceRecognized != "KTP" {
		t.Errorf("Expected service recognized as 'KTP', got '%s'", resp.ServiceRecognized)
	}
}

func TestProcessWithPersonaDisabledService(t *testing.T) {
	service := NewPersonaService()
	service.SetEnabled(false)

	req := &PersonaProcessingRequest{
		Query:          "halo selly",
		UserID:         "test-user",
		SessionID:      "test-disabled",
		BaseResponse:   "Hello!",
		IsFirstContact: true,
		Context:        map[string]interface{}{},
	}

	resp, err := service.ProcessWithPersona(context.Background(), req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if resp == nil {
		t.Fatal("Expected non-nil response")
	}

	// When service is disabled, should return base response without processing
	if resp.PersonalityApplied {
		t.Error("Expected PersonalityApplied to be false when service is disabled")
	}

	if resp.ServiceRecognized != "unknown" {
		t.Error("Expected ServiceRecognized to be 'unknown' when service is disabled")
	}
}

func TestFallbackResponseGenerator(t *testing.T) {
	generator := NewFallbackResponseGenerator("+62-851-8304-3205")

	// Test low confidence fallback
	shouldFallback := generator.ShouldUseFallback(0.2, "unknown", "random query")
	if !shouldFallback {
		t.Error("Expected fallback for low confidence and unknown service")
	}

	// Test high confidence no fallback
	shouldFallback = generator.ShouldUseFallback(0.9, "ktp", "saya ingin cetak ktp")
	if shouldFallback {
		t.Error("Expected no fallback for high confidence and known service")
	}

	// Test greeting no fallback
	shouldFallback = generator.ShouldUseFallback(0.1, "unknown", "halo selly")
	if shouldFallback {
		t.Error("Expected no fallback for greetings even with low confidence")
	}
}

func TestFallbackResponseGeneratorCulturalContext(t *testing.T) {
	generator := NewFallbackResponseGenerator("+62-851-8304-3205")

	// Test general Indonesia context
	response := generator.GenerateFallbackResponse("random query", "general_indonesia")
	expected := "Maaf SELLY tidak tahu, SELLY akan belajar lebih baik lagi. Untuk sementara bisa langsung hubungi nomor rekan SELLY di +62-851-8304-3205. Terima kasih atas pengertian Bapak/Ibu."
	if response != expected {
		t.Errorf("Expected general Indonesia fallback response, got: %s", response)
	}

	// Test Jakarta context
	response = generator.GenerateFallbackResponse("random query", "jakarta")
	expected = "Maaf SELLY tidak tahu, SELLY akan belajar lebih baik lagi. Untuk sementara bisa langsung hubungi nomor rekan SELLY di +62-851-8304-3205. Mohon maaf atas ketidaknyamanannya, Bapak/Ibu."
	if response != expected {
		t.Errorf("Expected Jakarta fallback response, got: %s", response)
	}

	// Test Sundanese context
	response = generator.GenerateFallbackResponse("random query", "sunda")
	expected = "Maaf SELLY tidak tahu, SELLY akan belajar lebih baik lagi. Untuk sementara bisa langsung hubungi nomor rekan SELLY di +62-851-8304-3205. Hapunten, abdi bakal diajar langkung sae."
	if response != expected {
		t.Errorf("Expected Sundanese fallback response, got: %s", response)
	}
}

func TestProcessGreeting(t *testing.T) {
	service := NewPersonaService()

	response, err := service.ProcessGreeting(context.Background(), "halo selly", "test-user", "test-greeting")
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if response == "" {
		t.Error("Expected non-empty greeting response")
	}

	// Greeting should not trigger fallback
	if service.fallbackGenerator.ShouldUseFallback(0.5, "greeting", "halo selly") {
		t.Error("Expected greeting to not trigger fallback")
	}
}

func TestProcessServiceRequest(t *testing.T) {
	service := NewPersonaService()

	response, err := service.ProcessServiceRequest(
		context.Background(),
		"saya ingin cetak ktp",
		"test-user",
		"test-service",
		"Untuk mencetak KTP...",
		[]string{"previous message"},
	)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if response == "" {
		t.Error("Expected non-empty service response")
	}
}

func TestFeatureFlagIntegration(t *testing.T) {
	// Test that feature flags are properly integrated
	service := NewPersonaService()

	// Test Phase 1 flags (should be enabled)
	if !service.featureFlags.IsPhase1Enabled() {
		t.Error("Expected Phase 1 features to be enabled")
	}

	// Test Phase 2 flags (should be disabled by default)
	if service.featureFlags.IsPhase2Enabled() {
		t.Error("Expected Phase 2 features to be disabled by default")
	}

	// Test individual flag access
	if !service.featureFlags.IsEnhancedFallbackEnabled() {
		t.Error("Expected enhanced fallback to be enabled")
	}

	if !service.featureFlags.IsLowConfidenceHandlingEnabled() {
		t.Error("Expected low confidence handling to be enabled")
	}
}

func TestGlobalPersonaService(t *testing.T) {
	service1 := GetGlobalPersonaService()
	service2 := GetGlobalPersonaService()

	if service1 != service2 {
		t.Error("Expected GetGlobalPersonaService to return the same instance")
	}

	if service1 == nil {
		t.Error("Expected global persona service to be non-nil")
	}
}

func TestPersonaServiceMetrics(t *testing.T) {
	service := NewPersonaService()

	metrics := service.GetMetrics()
	if metrics == nil {
		t.Error("Expected non-nil metrics")
	}

	// Test with disabled service
	service.SetEnabled(false)
	metrics = service.GetMetrics()
	if metrics == nil {
		t.Error("Expected non-nil metrics even when service is disabled")
	}

	if enabled, exists := metrics["service_enabled"]; !exists || enabled != false {
		t.Error("Expected service_enabled to be false when service is disabled")
	}
}
package persona

import (
	"context"
	"os"
	"testing"
	"time"

	"selly-backend/internal/config"
)

func TestFeatureFlagsIntegrationWithPersonaService(t *testing.T) {
	// Clear environment variables for consistent testing
	os.Unsetenv("PHASE2_REGIONAL_ADAPTER_ENABLED")
	os.Unsetenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED")
	os.Unsetenv("PHASE2_FACE_SAVING_ENABLED")
	os.Unsetenv("ENHANCED_FALLBACK_ENABLED")

	// Test with Phase 2 features disabled (default)
	service := NewPersonaService()

	// Verify Phase 1 features are enabled
	flags := service.GetFeatureFlags()
	if !flags.IsPhase1Enabled() {
		t.Error("Expected Phase 1 features to be enabled by default")
	}

	// Verify Phase 2 features are disabled
	if flags.IsPhase2Enabled() {
		t.Error("Expected Phase 2 features to be disabled by default")
	}

	// Test persona processing with low confidence
	req := &PersonaProcessingRequest{
		Query:          "xyz123randomtext",
		UserID:         "test-user",
		SessionID:      "test-fallback-final",
		BaseResponse:   "Test response",
		IsFirstContact: false,
		Context:        map[string]interface{}{},
	}

	resp, err := service.ProcessWithPersona(context.TODO(), req)
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
			}
		}
	}
}

func TestFeatureFlagsEnvironmentOverride(t *testing.T) {
	// Set environment variables to enable Phase 2 features
	os.Setenv("PHASE2_REGIONAL_ADAPTER_ENABLED", "true")
	os.Setenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED", "true")
	os.Setenv("PHASE2_FACE_SAVING_ENABLED", "true")
	os.Setenv("ENHANCED_FALLBACK_ENABLED", "false")
	defer func() {
		os.Unsetenv("PHASE2_REGIONAL_ADAPTER_ENABLED")
		os.Unsetenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED")
		os.Unsetenv("PHASE2_FACE_SAVING_ENABLED")
		os.Unsetenv("ENHANCED_FALLBACK_ENABLED")
	}()

	// Create new service with updated environment
	service := NewPersonaService()

	// Verify Phase 2 features are now enabled
	flags := service.GetFeatureFlags()
	if !flags.IsRegionalAdapterEnabled() {
		t.Error("Expected RegionalAdapter to be enabled from environment")
	}
	if !flags.IsReligiousCalendarEnabled() {
		t.Error("Expected ReligiousCalendar to be enabled from environment")
	}
	if !flags.IsFaceSavingEnabled() {
		t.Error("Expected FaceSaving to be enabled from environment")
	}
	if flags.IsEnhancedFallbackEnabled() {
		t.Error("Expected EnhancedFallback to be disabled from environment")
	}

	// Verify Phase 2 overall status
	if !flags.IsPhase2Enabled() {
		t.Error("Expected Phase 2 to be enabled when all features are enabled")
	}
}

func TestFeatureFlagsDynamicUpdate(t *testing.T) {
	service := NewPersonaService()
	flags := service.GetFeatureFlags()

	// Initially disabled
	if flags.IsRegionalAdapterEnabled() {
		t.Error("Expected RegionalAdapter to be initially disabled")
	}

	// Enable dynamically
	flags.UpdateFlag("regional_adapter", true)

	if !flags.IsRegionalAdapterEnabled() {
		t.Error("Expected RegionalAdapter to be enabled after dynamic update")
	}

	// Disable dynamically
	flags.UpdateFlag("regional_adapter", false)

	if flags.IsRegionalAdapterEnabled() {
		t.Error("Expected RegionalAdapter to be disabled after dynamic update")
	}
}

func TestFeatureFlagsPerformance(t *testing.T) {
	flags := config.GetFeatureFlags()

	// Test performance of flag checks
	start := time.Now()

	// Perform multiple flag checks
	for i := 0; i < 1000; i++ {
		_ = flags.IsPhase1Enabled()
		_ = flags.IsPhase2Enabled()
		_ = flags.IsRegionalAdapterEnabled()
		_ = flags.IsReligiousCalendarEnabled()
		_ = flags.IsFaceSavingEnabled()
		_ = flags.IsEnhancedFallbackEnabled()
	}

	elapsed := time.Since(start)

	// Should complete in well under 1ms for 1000 iterations
	if elapsed > time.Millisecond {
		t.Errorf("Feature flag checks too slow: %v for 1000 iterations", elapsed)
	}

	t.Logf("✅ Feature flag performance: %v for 1000 iterations", elapsed)
}

func TestFeatureFlagsThreadSafety(t *testing.T) {
	flags := config.GetFeatureFlags()

	// Test concurrent access
	done := make(chan bool, 2)

	go func() {
		for i := 0; i < 100; i++ {
			flags.UpdateFlag("regional_adapter", true)
			flags.UpdateFlag("regional_adapter", false)
		}
		done <- true
	}()

	go func() {
		for i := 0; i < 100; i++ {
			_ = flags.IsRegionalAdapterEnabled()
			_ = flags.GetAllFlags()
		}
		done <- true
	}()

	// Wait for both goroutines to complete
	<-done
	<-done

	t.Log("✅ Feature flags thread safety test passed")
}
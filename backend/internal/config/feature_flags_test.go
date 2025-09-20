package config

import (
	"os"
	"testing"
)

func TestNewFeatureFlags(t *testing.T) {
	// Clear any existing environment variables
	os.Unsetenv("CULTURAL_ANALYZER_ENABLED")
	os.Unsetenv("PHASE2_REGIONAL_ADAPTER_ENABLED")
	os.Unsetenv("ENHANCED_FALLBACK_ENABLED")

	flags := NewFeatureFlags()

	// Test Phase 1 defaults (should be enabled)
	if !flags.CulturalAnalyzerEnabled {
		t.Error("Expected CulturalAnalyzerEnabled to be true by default")
	}
	if !flags.HofstedeProcessorEnabled {
		t.Error("Expected HofstedeProcessorEnabled to be true by default")
	}

	// Test Phase 2 defaults (should be disabled)
	if flags.RegionalAdapterEnabled {
		t.Error("Expected RegionalAdapterEnabled to be false by default")
	}
	if flags.ReligiousCalendarEnabled {
		t.Error("Expected ReligiousCalendarEnabled to be false by default")
	}
	if flags.FaceSavingProcessorEnabled {
		t.Error("Expected FaceSavingProcessorEnabled to be false by default")
	}

	// Test safety features (should be enabled)
	if !flags.EnhancedFallbackEnabled {
		t.Error("Expected EnhancedFallbackEnabled to be true by default")
	}
	if !flags.LowConfidenceHandlingEnabled {
		t.Error("Expected LowConfidenceHandlingEnabled to be true by default")
	}
}

func TestFeatureFlagsFromEnvironment(t *testing.T) {
	// Set environment variables
	os.Setenv("PHASE2_REGIONAL_ADAPTER_ENABLED", "true")
	os.Setenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED", "false")
	os.Setenv("ENHANCED_FALLBACK_ENABLED", "false")
	defer func() {
		os.Unsetenv("PHASE2_REGIONAL_ADAPTER_ENABLED")
		os.Unsetenv("PHASE2_RELIGIOUS_CALENDAR_ENABLED")
		os.Unsetenv("ENHANCED_FALLBACK_ENABLED")
	}()

	flags := NewFeatureFlags()

	// Test environment variable overrides
	if !flags.RegionalAdapterEnabled {
		t.Error("Expected RegionalAdapterEnabled to be true from environment")
	}
	if flags.ReligiousCalendarEnabled {
		t.Error("Expected ReligiousCalendarEnabled to be false from environment")
	}
	if flags.EnhancedFallbackEnabled {
		t.Error("Expected EnhancedFallbackEnabled to be false from environment")
	}
}

func TestIsPhase1Enabled(t *testing.T) {
	flags := &FeatureFlags{
		CulturalAnalyzerEnabled:      true,
		HofstedeProcessorEnabled:     true,
		GotongRoyongEngineEnabled:    true,
		CulturalMetricsEnabled:       true,
	}

	if !flags.IsPhase1Enabled() {
		t.Error("Expected IsPhase1Enabled to return true when all Phase 1 features are enabled")
	}

	// Disable one Phase 1 feature
	flags.CulturalAnalyzerEnabled = false
	if flags.IsPhase1Enabled() {
		t.Error("Expected IsPhase1Enabled to return false when any Phase 1 feature is disabled")
	}
}

func TestIsPhase2Enabled(t *testing.T) {
	flags := &FeatureFlags{
		RegionalAdapterEnabled:       true,
		ReligiousCalendarEnabled:     true,
		FaceSavingProcessorEnabled:   true,
		Phase2MetricsEnabled:         true,
	}

	if !flags.IsPhase2Enabled() {
		t.Error("Expected IsPhase2Enabled to return true when all Phase 2 features are enabled")
	}

	// Disable one Phase 2 feature
	flags.RegionalAdapterEnabled = false
	if flags.IsPhase2Enabled() {
		t.Error("Expected IsPhase2Enabled to return false when any Phase 2 feature is disabled")
	}
}

func TestUpdateFlag(t *testing.T) {
	flags := NewFeatureFlags()

	// Test enabling a Phase 2 feature
	flags.UpdateFlag("regional_adapter", true)
	if !flags.RegionalAdapterEnabled {
		t.Error("Expected RegionalAdapterEnabled to be true after UpdateFlag")
	}

	// Test disabling a safety feature
	flags.UpdateFlag("enhanced_fallback", false)
	if flags.EnhancedFallbackEnabled {
		t.Error("Expected EnhancedFallbackEnabled to be false after UpdateFlag")
	}

	// Test invalid flag name (should not panic)
	flags.UpdateFlag("invalid_flag", true)
}

func TestGetAllFlags(t *testing.T) {
	flags := NewFeatureFlags()
	allFlags := flags.GetAllFlags()

	expectedFlags := map[string]bool{
		"cultural_analyzer":        true,
		"hofstede_processor":       true,
		"gotong_royong_engine":     true,
		"cultural_metrics":         true,
		"regional_adapter":         false,
		"religious_calendar":       false,
		"face_saving_processor":    false,
		"phase2_metrics":           false,
		"enhanced_fallback":        true,
		"low_confidence_handling":  true,
		"performance_monitoring":   true,
		"error_tracking":           true,
	}

	for flagName, expectedValue := range expectedFlags {
		if actualValue, exists := allFlags[flagName]; !exists {
			t.Errorf("Expected flag %s to exist in GetAllFlags result", flagName)
		} else if actualValue != expectedValue {
			t.Errorf("Expected flag %s to be %v, got %v", flagName, expectedValue, actualValue)
		}
	}
}

func TestGetFeatureFlags(t *testing.T) {
	// Test singleton pattern
	flags1 := GetFeatureFlags()
	flags2 := GetFeatureFlags()

	if flags1 != flags2 {
		t.Error("Expected GetFeatureFlags to return the same instance (singleton pattern)")
	}
}

func TestGetEnvBool(t *testing.T) {
	// Test with valid boolean string
	os.Setenv("TEST_BOOL_TRUE", "true")
	defer os.Unsetenv("TEST_BOOL_TRUE")

	if !getEnvBool("TEST_BOOL_TRUE", false) {
		t.Error("Expected getEnvBool to return true for 'true' string")
	}

	// Test with invalid boolean string (should return default)
	os.Setenv("TEST_BOOL_INVALID", "not_a_bool")
	defer os.Unsetenv("TEST_BOOL_INVALID")

	if !getEnvBool("TEST_BOOL_INVALID", true) {
		t.Error("Expected getEnvBool to return default value (true) for invalid boolean string")
	}

	// Test with unset environment variable (should return default)
	if !getEnvBool("NON_EXISTENT_VAR", true) {
		t.Error("Expected getEnvBool to return default value for unset variable")
	}
}
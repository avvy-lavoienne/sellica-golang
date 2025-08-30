package config

import (
	"os"
	"strconv"
	"sync"
)

// FeatureFlags manages Phase 2 advanced cultural features
type FeatureFlags struct {
	mutex sync.RWMutex

	// Phase 1 Cultural Foundation (always enabled after Phase 1)
	CulturalAnalyzerEnabled      bool `json:"cultural_analyzer_enabled"`
	HofstedeProcessorEnabled     bool `json:"hofstede_processor_enabled"`
	GotongRoyongEngineEnabled    bool `json:"gotong_royong_engine_enabled"`
	CulturalMetricsEnabled       bool `json:"cultural_metrics_enabled"`

	// Phase 2 Advanced Features (feature flagged)
	RegionalAdapterEnabled       bool `json:"regional_adapter_enabled"`
	ReligiousCalendarEnabled     bool `json:"religious_calendar_enabled"`
	FaceSavingProcessorEnabled   bool `json:"face_saving_processor_enabled"`
	Phase2MetricsEnabled         bool `json:"phase2_metrics_enabled"`

	// Fallback and Safety Features
	EnhancedFallbackEnabled      bool `json:"enhanced_fallback_enabled"`
	LowConfidenceHandlingEnabled bool `json:"low_confidence_handling_enabled"`

	// Performance and Monitoring
	PerformanceMonitoringEnabled bool `json:"performance_monitoring_enabled"`
	ErrorTrackingEnabled         bool `json:"error_tracking_enabled"`
}

// Global feature flags instance
var globalFeatureFlags *FeatureFlags
var featureFlagsOnce sync.Once

// GetFeatureFlags returns the global feature flags instance
func GetFeatureFlags() *FeatureFlags {
	featureFlagsOnce.Do(func() {
		globalFeatureFlags = NewFeatureFlags()
	})
	return globalFeatureFlags
}

// NewFeatureFlags creates a new feature flags instance with environment-based configuration
func NewFeatureFlags() *FeatureFlags {
	flags := &FeatureFlags{
		// Phase 1 features - enabled by default (completed)
		CulturalAnalyzerEnabled:      getEnvBool("CULTURAL_ANALYZER_ENABLED", true),
		HofstedeProcessorEnabled:     getEnvBool("HOFSTEDE_PROCESSOR_ENABLED", true),
		GotongRoyongEngineEnabled:    getEnvBool("GOTONG_ROYONG_ENGINE_ENABLED", true),
		CulturalMetricsEnabled:       getEnvBool("CULTURAL_METRICS_ENABLED", true),

		// Phase 2 features - disabled by default for safety
		RegionalAdapterEnabled:       getEnvBool("PHASE2_REGIONAL_ADAPTER_ENABLED", false),
		ReligiousCalendarEnabled:     getEnvBool("PHASE2_RELIGIOUS_CALENDAR_ENABLED", false),
		FaceSavingProcessorEnabled:   getEnvBool("PHASE2_FACE_SAVING_ENABLED", false),
		Phase2MetricsEnabled:         getEnvBool("PHASE2_METRICS_ENABLED", false),

		// Safety features - enabled by default
		EnhancedFallbackEnabled:      getEnvBool("ENHANCED_FALLBACK_ENABLED", true),
		LowConfidenceHandlingEnabled: getEnvBool("LOW_CONFIDENCE_HANDLING_ENABLED", true),

		// Monitoring - enabled by default
		PerformanceMonitoringEnabled: getEnvBool("PERFORMANCE_MONITORING_ENABLED", true),
		ErrorTrackingEnabled:         getEnvBool("ERROR_TRACKING_ENABLED", true),
	}

	return flags
}

// IsPhase1Enabled checks if Phase 1 cultural features are enabled
func (ff *FeatureFlags) IsPhase1Enabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.CulturalAnalyzerEnabled && ff.HofstedeProcessorEnabled &&
		   ff.GotongRoyongEngineEnabled && ff.CulturalMetricsEnabled
}

// IsPhase2Enabled checks if Phase 2 advanced features are enabled
func (ff *FeatureFlags) IsPhase2Enabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.RegionalAdapterEnabled && ff.ReligiousCalendarEnabled &&
		   ff.FaceSavingProcessorEnabled && ff.Phase2MetricsEnabled
}

// IsRegionalAdapterEnabled checks if regional adaptation is enabled
func (ff *FeatureFlags) IsRegionalAdapterEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.RegionalAdapterEnabled
}

// IsReligiousCalendarEnabled checks if religious calendar is enabled
func (ff *FeatureFlags) IsReligiousCalendarEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.ReligiousCalendarEnabled
}

// IsFaceSavingEnabled checks if face-saving processor is enabled
func (ff *FeatureFlags) IsFaceSavingEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.FaceSavingProcessorEnabled
}

// IsEnhancedFallbackEnabled checks if enhanced fallback is enabled
func (ff *FeatureFlags) IsEnhancedFallbackEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.EnhancedFallbackEnabled
}

// IsLowConfidenceHandlingEnabled checks if low confidence handling is enabled
func (ff *FeatureFlags) IsLowConfidenceHandlingEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.LowConfidenceHandlingEnabled
}

// UpdateFlag updates a specific feature flag
func (ff *FeatureFlags) UpdateFlag(flagName string, enabled bool) {
	ff.mutex.Lock()
	defer ff.mutex.Unlock()

	switch flagName {
	case "cultural_analyzer":
		ff.CulturalAnalyzerEnabled = enabled
	case "hofstede_processor":
		ff.HofstedeProcessorEnabled = enabled
	case "gotong_royong_engine":
		ff.GotongRoyongEngineEnabled = enabled
	case "cultural_metrics":
		ff.CulturalMetricsEnabled = enabled
	case "regional_adapter":
		ff.RegionalAdapterEnabled = enabled
	case "religious_calendar":
		ff.ReligiousCalendarEnabled = enabled
	case "face_saving_processor":
		ff.FaceSavingProcessorEnabled = enabled
	case "phase2_metrics":
		ff.Phase2MetricsEnabled = enabled
	case "enhanced_fallback":
		ff.EnhancedFallbackEnabled = enabled
	case "low_confidence_handling":
		ff.LowConfidenceHandlingEnabled = enabled
	case "performance_monitoring":
		ff.PerformanceMonitoringEnabled = enabled
	case "error_tracking":
		ff.ErrorTrackingEnabled = enabled
	}
}

// GetAllFlags returns all feature flags as a map
func (ff *FeatureFlags) GetAllFlags() map[string]bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()

	return map[string]bool{
		"cultural_analyzer":        ff.CulturalAnalyzerEnabled,
		"hofstede_processor":       ff.HofstedeProcessorEnabled,
		"gotong_royong_engine":     ff.GotongRoyongEngineEnabled,
		"cultural_metrics":         ff.CulturalMetricsEnabled,
		"regional_adapter":         ff.RegionalAdapterEnabled,
		"religious_calendar":       ff.ReligiousCalendarEnabled,
		"face_saving_processor":    ff.FaceSavingProcessorEnabled,
		"phase2_metrics":           ff.Phase2MetricsEnabled,
		"enhanced_fallback":        ff.EnhancedFallbackEnabled,
		"low_confidence_handling":  ff.LowConfidenceHandlingEnabled,
		"performance_monitoring":   ff.PerformanceMonitoringEnabled,
		"error_tracking":           ff.ErrorTrackingEnabled,
	}
}

// getEnvBool gets a boolean value from environment variable with default
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

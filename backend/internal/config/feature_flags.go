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

	// Regional Rollout Control (Phase 2B)
	JakartaRegionalEnabled       bool `json:"jakarta_regional_enabled"`
	JawaBaratRegionalEnabled     bool `json:"jawa_barat_regional_enabled"`
	SundaRegionalEnabled         bool `json:"sunda_regional_enabled"`
	BaliRegionalEnabled          bool `json:"bali_regional_enabled"`
	SumatraRegionalEnabled       bool `json:"sumatra_regional_enabled"`
	KalimantanRegionalEnabled    bool `json:"kalimantan_regional_enabled"`
	SulawesiRegionalEnabled      bool `json:"sulawesi_regional_enabled"`
	PapuaRegionalEnabled         bool `json:"papua_regional_enabled"`

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

		// Regional rollout - Jakarta enabled first, others disabled
		JakartaRegionalEnabled:       getEnvBool("JAKARTA_REGIONAL_ENABLED", true),
		JawaBaratRegionalEnabled:     getEnvBool("JAWA_BARAT_REGIONAL_ENABLED", false),
		SundaRegionalEnabled:         getEnvBool("SUNDA_REGIONAL_ENABLED", false),
		BaliRegionalEnabled:          getEnvBool("BALI_REGIONAL_ENABLED", false),
		SumatraRegionalEnabled:       getEnvBool("SUMATRA_REGIONAL_ENABLED", false),
		KalimantanRegionalEnabled:    getEnvBool("KALIMANTAN_REGIONAL_ENABLED", false),
		SulawesiRegionalEnabled:      getEnvBool("SULAWESI_REGIONAL_ENABLED", false),
		PapuaRegionalEnabled:         getEnvBool("PAPUA_REGIONAL_ENABLED", false),

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

// Regional rollout getters (Phase 2B)
func (ff *FeatureFlags) IsJakartaRegionalEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.JakartaRegionalEnabled
}

func (ff *FeatureFlags) IsJawaBaratRegionalEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.JawaBaratRegionalEnabled
}

func (ff *FeatureFlags) IsSundaRegionalEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.SundaRegionalEnabled
}

func (ff *FeatureFlags) IsBaliRegionalEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.BaliRegionalEnabled
}

func (ff *FeatureFlags) IsSumatraRegionalEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.SumatraRegionalEnabled
}

func (ff *FeatureFlags) IsKalimantanRegionalEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.KalimantanRegionalEnabled
}

func (ff *FeatureFlags) IsSulawesiRegionalEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.SulawesiRegionalEnabled
}

func (ff *FeatureFlags) IsPapuaRegionalEnabled() bool {
	ff.mutex.RLock()
	defer ff.mutex.RUnlock()
	return ff.PapuaRegionalEnabled
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
	// Regional rollout flags (Phase 2B)
	case "jakarta_regional":
		ff.JakartaRegionalEnabled = enabled
	case "jawa_barat_regional":
		ff.JawaBaratRegionalEnabled = enabled
	case "sunda_regional":
		ff.SundaRegionalEnabled = enabled
	case "bali_regional":
		ff.BaliRegionalEnabled = enabled
	case "sumatra_regional":
		ff.SumatraRegionalEnabled = enabled
	case "kalimantan_regional":
		ff.KalimantanRegionalEnabled = enabled
	case "sulawesi_regional":
		ff.SulawesiRegionalEnabled = enabled
	case "papua_regional":
		ff.PapuaRegionalEnabled = enabled
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
		// Regional rollout flags (Phase 2B)
		"jakarta_regional":         ff.JakartaRegionalEnabled,
		"jawa_barat_regional":      ff.JawaBaratRegionalEnabled,
		"sunda_regional":           ff.SundaRegionalEnabled,
		"bali_regional":            ff.BaliRegionalEnabled,
		"sumatra_regional":         ff.SumatraRegionalEnabled,
		"kalimantan_regional":      ff.KalimantanRegionalEnabled,
		"sulawesi_regional":        ff.SulawesiRegionalEnabled,
		"papua_regional":           ff.PapuaRegionalEnabled,
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

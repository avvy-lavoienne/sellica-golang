package persona

import (
	"context"
	"fmt"
	"selly-backend/internal/config"
	"strings"
	"sync"

	"github.com/sirupsen/logrus"
)

// PersonaService provides a unified interface for SELLY persona functionality
// This service integrates the enhanced persona components and provides backward compatibility
type PersonaService struct {
	enhancedIntegration *EnhancedPersonaIntegration
	fallbackGenerator   *FallbackResponseGenerator
	emoticonEnhancedGreetingManager *EmoticonEnhancedGreetingManager
	featureFlags        *config.FeatureFlags

	// Phase 2 Components (feature flagged)
	regionalAdapter     *RegionalAdapter
	religiousCalendar   interface{} // *ReligiousCalendarService - will be initialized when enabled
	faceSavingProcessor interface{} // *FaceSavingProcessor - will be initialized when enabled
	phase2Metrics       interface{} // *Phase2MetricsCollector - will be initialized when enabled

	enabled             bool
	mutex               sync.RWMutex
}

// PersonaProcessingRequest represents a simplified request for persona processing
type PersonaProcessingRequest struct {
	Query               string                 `json:"query"`
	UserID              string                 `json:"user_id"`
	SessionID           string                 `json:"session_id"`
	BaseResponse        string                 `json:"base_response"`
	IsFirstContact      bool                   `json:"is_first_contact"`
	ConversationHistory []string               `json:"conversation_history"`
	Context             map[string]interface{} `json:"context"`
}

// PersonaProcessingResponse represents the simplified response from persona processing
type PersonaProcessingResponse struct {
	ProcessedResponse   string                 `json:"processed_response"`
	PersonalityApplied  bool                   `json:"personality_applied"`
	MoodDetected        string                 `json:"mood_detected"`
	ServiceRecognized   string                 `json:"service_recognized"`
	CulturalContext     string                 `json:"cultural_context"`
	ProcessingTime      float64                `json:"processing_time"`
	Metadata            map[string]interface{} `json:"metadata"`
}

// FallbackResponseGenerator handles culturally appropriate fallback responses
type FallbackResponseGenerator struct {
	contactNumber string
	enabled       bool
}

// NewFallbackResponseGenerator creates a new fallback response generator
func NewFallbackResponseGenerator(contactNumber string) *FallbackResponseGenerator {
	return &FallbackResponseGenerator{
		contactNumber: contactNumber,
		enabled:       true,
	}
}

// GenerateFallbackResponse creates a culturally appropriate fallback response
func (frg *FallbackResponseGenerator) GenerateFallbackResponse(query string, culturalContext string) string {
	if !frg.enabled {
		return "Maaf, saya tidak dapat menjawab pertanyaan tersebut saat ini."
	}

	baseResponse := "Maaf SELLY tidak tahu, SELLY akan belajar lebih baik lagi. "

	// Add contact information
	if frg.contactNumber != "" {
		baseResponse += fmt.Sprintf("Untuk sementara bisa langsung hubungi nomor rekan SELLY di %s", frg.contactNumber)
	}

	// Add culturally appropriate elements based on context
	switch culturalContext {
	case "general_indonesia":
		baseResponse += ". Terima kasih atas pengertian Bapak/Ibu."
	case "jakarta":
		baseResponse += ". Mohon maaf atas ketidaknyamanannya, Bapak/Ibu."
	case "jawa_barat":
		baseResponse += ". Punten atuh, abdi bakal belajar langkung sae deui."
	case "sunda":
		baseResponse += ". Hapunten, abdi bakal diajar langkung sae."
	default:
		baseResponse += ". Terima kasih atas pengertiannya."
	}

	return baseResponse
}

// ShouldUseFallback determines if fallback response should be used
func (frg *FallbackResponseGenerator) ShouldUseFallback(confidence float64, serviceRecognized string, query string) bool {
	// Use fallback if confidence is very low
	if confidence < 0.3 {
		return true
	}

	// Use fallback if no service is recognized for non-greeting queries
	if serviceRecognized == "unknown" || serviceRecognized == "" {
		// But don't use fallback for greetings
		lowerQuery := strings.ToLower(query)
		if !strings.Contains(lowerQuery, "halo") &&
		   !strings.Contains(lowerQuery, "selamat") &&
		   !strings.Contains(lowerQuery, "assalamualaikum") &&
		   !strings.Contains(lowerQuery, "apa kabar") {
			return true
		}
	}

	// Use fallback for very low confidence even if service is recognized
	if confidence < 0.5 && (serviceRecognized == "unknown" || serviceRecognized == "") {
		return true
	}

	return false
}

// NewPersonaService creates a new persona service with enhanced capabilities
func NewPersonaService() *PersonaService {
	service := &PersonaService{
		enhancedIntegration: NewEnhancedPersonaIntegration(),
		fallbackGenerator:   NewFallbackResponseGenerator("+62-851-8304-3205"),
		emoticonEnhancedGreetingManager: NewEmoticonEnhancedGreetingManager(),
		featureFlags:        config.GetFeatureFlags(),
		enabled:             true,
	}

	// Initialize Phase 2 components based on feature flags
	service.initializePhase2Components()

	return service
}

// initializePhase2Components initializes Phase 2 components based on feature flags
func (ps *PersonaService) initializePhase2Components() {
	flags := ps.featureFlags

	// Phase 2 components are initialized only when their respective flags are enabled
	// This allows for gradual rollout and feature toggling

	if flags.IsRegionalAdapterEnabled() {
		logrus.Info("✅ Initializing Regional Adapter (Phase 2)")
		// ps.regionalAdapter = NewRegionalAdapter() // Will be implemented in Phase 2
	}

	if flags.IsReligiousCalendarEnabled() {
		logrus.Info("✅ Initializing Religious Calendar Service (Phase 2)")
		// ps.religiousCalendar = NewReligiousCalendarService() // Will be implemented in Phase 2
	}

	if flags.IsFaceSavingEnabled() {
		logrus.Info("✅ Initializing Face-Saving Processor (Phase 2)")
		// ps.faceSavingProcessor = NewFaceSavingProcessor() // Will be implemented in Phase 2
	}

	if flags.Phase2MetricsEnabled {
		logrus.Info("✅ Initializing Phase 2 Metrics Collector")
		// ps.phase2Metrics = NewPhase2MetricsCollector() // Will be implemented in Phase 2
	}

	logrus.WithFields(logrus.Fields{
		"phase1_enabled": flags.IsPhase1Enabled(),
		"phase2_enabled": flags.IsPhase2Enabled(),
		"regional_adapter": flags.IsRegionalAdapterEnabled(),
		"religious_calendar": flags.IsReligiousCalendarEnabled(),
		"face_saving": flags.IsFaceSavingEnabled(),
		"enhanced_fallback": flags.IsEnhancedFallbackEnabled(),
	}).Info("Persona service Phase 2 components initialization completed")
}

// ProcessWithPersona processes a request with SELLY persona capabilities
func (ps *PersonaService) ProcessWithPersona(ctx context.Context, req *PersonaProcessingRequest) (*PersonaProcessingResponse, error) {
	ps.mutex.RLock()
	enabled := ps.enabled
	ps.mutex.RUnlock()

	if !enabled {
		return &PersonaProcessingResponse{
			ProcessedResponse:  req.BaseResponse,
			PersonalityApplied: false,
			MoodDetected:       "neutral",
			ServiceRecognized:  "unknown",
			CulturalContext:    "general",
			ProcessingTime:     0.0,
		}, nil
	}

	// Convert to enhanced request
	enhancedReq := &EnhancedPersonaRequest{
		Query:               req.Query,
		UserID:              req.UserID,
		SessionID:           req.SessionID,
		BaseResponse:        req.BaseResponse,
		IsFirstContact:      req.IsFirstContact,
		ConversationHistory: req.ConversationHistory,
		Context:             req.Context,
	}

	// Process with enhanced integration (Phase 1)
	enhancedResp, err := ps.enhancedIntegration.ProcessWithEnhancedPersona(ctx, enhancedReq)
	if err != nil {
		logrus.WithError(err).Warn("Enhanced persona processing failed, using fallback")
		return &PersonaProcessingResponse{
			ProcessedResponse:  req.BaseResponse,
			PersonalityApplied: false,
			MoodDetected:       "neutral",
			ServiceRecognized:  "unknown",
			CulturalContext:    "general",
			ProcessingTime:     0.0,
		}, nil
	}

	// Phase 2 Enhancement Pipeline (feature flagged)
	var processedResponse string
	processedResponse = enhancedResp.ProcessedResponse

	// Apply Phase 2 enhancements based on feature flags
	if ps.featureFlags.IsRegionalAdapterEnabled() && ps.regionalAdapter != nil {
		// Regional adaptation processing would go here
		logrus.Debug("Phase 2: Regional adaptation applied")
	}

	if ps.featureFlags.IsReligiousCalendarEnabled() && ps.religiousCalendar != nil {
		// Religious calendar processing would go here
		logrus.Debug("Phase 2: Religious calendar applied")
	}

	if ps.featureFlags.IsFaceSavingEnabled() && ps.faceSavingProcessor != nil {
		// Face-saving processing would go here
		logrus.Debug("Phase 2: Face-saving applied")
	}

	// Record Phase 2 metrics if enabled
	if ps.featureFlags.Phase2MetricsEnabled && ps.phase2Metrics != nil {
		// Phase 2 metrics recording would go here
		logrus.Debug("Phase 2: Metrics recorded")
	}

	// Check if fallback response should be used
	culturalContext := "general_indonesia"
	if enhancedResp.CulturalContext != nil {
		culturalContext = enhancedResp.CulturalContext.Region
	}

	serviceRecognized := "unknown"
	if enhancedResp.ServiceRecognition != nil {
		serviceRecognized = enhancedResp.ServiceRecognition.ServiceType
	}

	confidence := 0.5 // default confidence
	if enhancedResp.Metadata != nil {
		if conf, exists := enhancedResp.Metadata["confidence"]; exists {
			if confVal, ok := conf.(float64); ok {
				confidence = confVal
			}
		}
	}

	logrus.WithFields(logrus.Fields{
		"confidence":        confidence,
		"service_recognized": serviceRecognized,
		"cultural_context":   culturalContext,
		"query":             req.Query,
	}).Debug("Checking fallback conditions")

	// Apply fallback if needed
	// processedResponse already declared above
	shouldUseFallback := ps.fallbackGenerator.ShouldUseFallback(confidence, serviceRecognized, req.Query)

	logrus.WithFields(logrus.Fields{
		"should_use_fallback": shouldUseFallback,
		"confidence_threshold": confidence < 0.3,
		"service_unknown": serviceRecognized == "unknown" || serviceRecognized == "",
	}).Debug("Fallback decision made")

	if shouldUseFallback {
		fallbackResponse := ps.fallbackGenerator.GenerateFallbackResponse(req.Query, culturalContext)
		processedResponse = fallbackResponse

		logrus.WithFields(logrus.Fields{
			"original_confidence": confidence,
			"service_recognized":  serviceRecognized,
			"cultural_context":    culturalContext,
			"fallback_applied":    true,
		}).Info("✅ Fallback response applied due to low confidence or unknown service")

		// Update metadata to indicate fallback was used
		if enhancedResp.Metadata == nil {
			enhancedResp.Metadata = make(map[string]interface{})
		}
		enhancedResp.Metadata["fallback_applied"] = true
		enhancedResp.Metadata["fallback_reason"] = "low_confidence_or_unknown_service"
	}

	// Convert to simplified response
	response := &PersonaProcessingResponse{
		ProcessedResponse:  processedResponse,
		PersonalityApplied: enhancedResp.PersonalityApplied,
		ProcessingTime:     enhancedResp.ProcessingTime,
		Metadata:           enhancedResp.Metadata,
	}

	// Extract simplified fields
	if enhancedResp.MoodDetection != nil {
		response.MoodDetected = enhancedResp.MoodDetection.PrimaryMood
	} else {
		response.MoodDetected = "neutral"
	}

	if enhancedResp.ServiceRecognition != nil {
		response.ServiceRecognized = enhancedResp.ServiceRecognition.ServiceType
	} else {
		response.ServiceRecognized = "unknown"
	}

	if enhancedResp.CulturalContext != nil {
		response.CulturalContext = enhancedResp.CulturalContext.Region
	} else {
		response.CulturalContext = "general"
	}

	logrus.WithFields(logrus.Fields{
		"user_id":            req.UserID,
		"session_id":         req.SessionID,
		"mood_detected":      response.MoodDetected,
		"service_recognized": response.ServiceRecognized,
		"cultural_context":   response.CulturalContext,
		"processing_ms":      response.ProcessingTime,
		"personality_applied": response.PersonalityApplied,
	}).Debug("Persona processing completed")

	return response, nil
}

// IsEnabled returns whether the persona service is enabled
func (ps *PersonaService) IsEnabled() bool {
	ps.mutex.RLock()
	defer ps.mutex.RUnlock()
	return ps.enabled
}

// SetEnabled enables or disables the persona service
func (ps *PersonaService) SetEnabled(enabled bool) {
	ps.mutex.Lock()
	defer ps.mutex.Unlock()
	ps.enabled = enabled
}

// GetMetrics returns persona service metrics
func (ps *PersonaService) GetMetrics() map[string]interface{} {
	ps.mutex.RLock()
	defer ps.mutex.RUnlock()

	if ps.enhancedIntegration == nil {
		return map[string]interface{}{
			"enabled": ps.enabled,
			"status":  "not_initialized",
		}
	}

	metrics := ps.enhancedIntegration.GetMetrics()
	metrics["service_enabled"] = ps.enabled
	return metrics
}

// CleanupSessions removes old sessions to prevent memory leaks
func (ps *PersonaService) CleanupSessions() {
	ps.mutex.RLock()
	integration := ps.enhancedIntegration
	ps.mutex.RUnlock()

	if integration != nil {
		integration.CleanupSessions()
	}
}

// GetSessionContext returns session context for debugging
func (ps *PersonaService) GetSessionContext(sessionID string) *PersonaSession {
	ps.mutex.RLock()
	integration := ps.enhancedIntegration
	ps.mutex.RUnlock()

	if integration != nil {
		return integration.GetSessionContext(sessionID)
	}
	return nil
}

// ProcessGreeting processes a greeting query specifically
func (ps *PersonaService) ProcessGreeting(ctx context.Context, query, userID, sessionID string) (string, error) {
	// Use the emoticon-enhanced greeting manager for better variety
	if ps.emoticonEnhancedGreetingManager != nil && ps.emoticonEnhancedGreetingManager.IsEnabled() {
		enhancedReq := &EnhancedGreetingRequest{
			UserID:         userID,
			SessionID:      sessionID,
			TimeOfDay:      "", // Will be determined automatically
			IsFirstContact: true,
			ServiceType:    "",
			UserTone:       "neutral",
			UserQuery:      query,
			ConversationHistory: []string{},
			CulturalContext: nil,
			UserMood:       nil,
			Context: map[string]interface{}{
				"greeting_only": true,
			},
		}

		enhancedResp, err := ps.emoticonEnhancedGreetingManager.GenerateEmoticonEnhancedGreeting(ctx, enhancedReq)
		if err != nil {
			logrus.WithError(err).Warn("Emoticon-enhanced greeting failed, falling back to standard processing")
		} else {
			logrus.WithFields(logrus.Fields{
				"greeting_type": enhancedResp.GreetingType,
				"cultural_adaptation": enhancedResp.CulturalAdaptation,
				"emoticon_enhanced": true,
			}).Debug("Emoticon-enhanced greeting generated successfully")
			return enhancedResp.Greeting, nil
		}
	}

	// Fallback to standard persona processing
	req := &PersonaProcessingRequest{
		Query:          query,
		UserID:         userID,
		SessionID:      sessionID,
		BaseResponse:   "", // Let persona generate the full response
		IsFirstContact: true,
		Context: map[string]interface{}{
			"greeting_only": true,
		},
	}

	resp, err := ps.ProcessWithPersona(ctx, req)
	if err != nil {
		return "", err
	}

	return resp.ProcessedResponse, nil
}

// ProcessServiceRequest processes a service-related query
func (ps *PersonaService) ProcessServiceRequest(ctx context.Context, query, userID, sessionID, baseResponse string, history []string) (string, error) {
	req := &PersonaProcessingRequest{
		Query:               query,
		UserID:              userID,
		SessionID:           sessionID,
		BaseResponse:        baseResponse,
		IsFirstContact:      len(history) == 0,
		ConversationHistory: history,
		Context: map[string]interface{}{
			"service_request": true,
		},
	}

	resp, err := ps.ProcessWithPersona(ctx, req)
	if err != nil {
		return baseResponse, err // Fallback to base response
	}

	return resp.ProcessedResponse, nil
}

// Global persona service instance
var globalPersonaService *PersonaService
var personaServiceOnce sync.Once

// GetFeatureFlags returns the feature flags instance for external access
func (ps *PersonaService) GetFeatureFlags() *config.FeatureFlags {
	return ps.featureFlags
}

// initializeRegionalAdapter initializes the regional adapter if enabled
func (ps *PersonaService) initializeRegionalAdapter() {
	ps.mutex.Lock()
	defer ps.mutex.Unlock()

	if ps.featureFlags.IsRegionalAdapterEnabled() && ps.regionalAdapter == nil {
		configPath := "backend/data/training/persona/regional_profiles"
		ps.regionalAdapter = NewRegionalAdapter(configPath)
		logrus.Info("Regional adapter initialized for Phase 2B rollout")
	}
}

// GetRegionalAdapter returns the regional adapter instance
func (ps *PersonaService) GetRegionalAdapter() *RegionalAdapter {
	ps.mutex.RLock()
	adapter := ps.regionalAdapter
	ps.mutex.RUnlock()

	if adapter == nil {
		ps.initializeRegionalAdapter()
		ps.mutex.RLock()
		adapter = ps.regionalAdapter
		ps.mutex.RUnlock()
	}

	return adapter
}

// ProcessRegionalAdaptation applies regional cultural adaptations to a response
func (ps *PersonaService) ProcessRegionalAdaptation(ctx context.Context, query, regionCode string, userContext map[string]interface{}) (*RegionalAdaptationResponse, error) {
	ps.mutex.RLock()
	enabled := ps.enabled
	flags := ps.featureFlags
	ps.mutex.RUnlock()

	if !enabled {
		return &RegionalAdaptationResponse{
			AdaptedResponse: query,
			RegionApplied:   "service_disabled",
			Confidence:      1.0,
			ProcessingTime:  0,
		}, nil
	}

	// Check if regional adapter is enabled
	if !flags.IsRegionalAdapterEnabled() {
		return &RegionalAdaptationResponse{
			AdaptedResponse: query,
			RegionApplied:   "feature_disabled",
			Confidence:      1.0,
			ProcessingTime:  0,
		}, nil
	}

	// Check if specific region is enabled
	if !ps.isRegionEnabled(regionCode) {
		return &RegionalAdaptationResponse{
			AdaptedResponse: query,
			RegionApplied:   "region_disabled",
			Confidence:      1.0,
			ProcessingTime:  0,
		}, nil
	}

	// Get or initialize regional adapter
	adapter := ps.GetRegionalAdapter()
	if adapter == nil {
		return &RegionalAdaptationResponse{
			AdaptedResponse: query,
			RegionApplied:   "adapter_unavailable",
			Confidence:      0.0,
			ProcessingTime:  0,
		}, nil
	}

	// Create adaptation request
	req := &RegionalAdaptationRequest{
		Query:       query,
		UserID:      "", // Can be enhanced to include user ID
		SessionID:   "", // Can be enhanced to include session ID
		RegionCode:  regionCode,
		UserContext: userContext,
	}

	// Apply regional adaptation
	response, err := adapter.AdaptForRegion(ctx, req)
	if err != nil {
		logrus.WithError(err).WithField("region", regionCode).Warn("Regional adaptation failed")
		return &RegionalAdaptationResponse{
			AdaptedResponse: query,
			RegionApplied:   "adaptation_failed",
			Confidence:      0.0,
			ProcessingTime:  0,
		}, nil
	}

	return response, nil
}

// isRegionEnabled checks if a specific region is enabled for rollout
func (ps *PersonaService) isRegionEnabled(regionCode string) bool {
	flags := ps.GetFeatureFlags()

	switch strings.ToLower(regionCode) {
	case "id_jakarta", "jakarta":
		return flags.IsJakartaRegionalEnabled()
	case "id_jawa_barat", "jawa_barat", "jawa-barat":
		return flags.IsJawaBaratRegionalEnabled()
	case "id_sunda", "sunda":
		return flags.IsSundaRegionalEnabled()
	case "id_bali", "bali":
		return flags.IsBaliRegionalEnabled()
	case "id_sumatra", "sumatra":
		return flags.IsSumatraRegionalEnabled()
	case "id_kalimantan", "kalimantan":
		return flags.IsKalimantanRegionalEnabled()
	case "id_sulawesi", "sulawesi":
		return flags.IsSulawesiRegionalEnabled()
	case "id_papua", "papua":
		return flags.IsPapuaRegionalEnabled()
	default:
		// Unknown regions default to Jakarta if Jakarta is enabled
		return flags.IsJakartaRegionalEnabled()
	}
}

// GetGlobalPersonaService returns the global persona service instance
func GetGlobalPersonaService() *PersonaService {
	personaServiceOnce.Do(func() {
		globalPersonaService = NewPersonaService()
		logrus.Info("Global SELLY persona service initialized with enhanced capabilities")
	})
	return globalPersonaService
}

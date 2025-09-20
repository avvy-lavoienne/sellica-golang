package persona

import (
	"context"
	"fmt"
	"selly-backend/internal/config"
	"selly-backend/pkg/types"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// UnifiedPersonaService consolidates three overlapping persona services into one
// This implements Phase 2 Week 3 of the system optimization plan
type UnifiedPersonaService struct {
	// Core components
	sellyPersona        *SellyPersona
	integrationService  *PersonaIntegrationService
	legacyPersonaService *PersonaService

	// Configuration and feature flags
	config              *UnifiedPersonaConfig
	featureFlags        *config.FeatureFlags
	
	// State management
	enabled             bool
	migrationMode       bool // For gradual migration from legacy services
	mutex               sync.RWMutex
	
	// Performance tracking
	metrics             *UnifiedPersonaMetrics
	
	// Context correlation IDs for end-to-end tracing
	correlationIDGen    func() string
}

// UnifiedPersonaConfig defines configuration for the unified service
type UnifiedPersonaConfig struct {
	// Feature flags for gradual migration
	EnableLegacyFallback    bool                   `json:"enable_legacy_fallback"`
	EnableTrainingDataIntegration bool             `json:"enable_training_data_integration"`
	EnableUpstashRedisCache bool                   `json:"enable_upstash_redis_cache"`
	EnableSmartTTL          bool                   `json:"enable_smart_ttl"`
	
	// Performance settings
	CacheTimeout            time.Duration          `json:"cache_timeout"`
	RequestTimeout          time.Duration          `json:"request_timeout"`
	MaxConcurrentRequests   int                    `json:"max_concurrent_requests"`
	
	// Training data paths
	TrainingDataPath        string                 `json:"training_data_path"`
	PersonaTrainingPath     string                 `json:"persona_training_path"`
	
	// Cultural adaptation settings
	DefaultRegion           string                 `json:"default_region"`
	SupportedDialects       []string               `json:"supported_dialects"`
	CulturalSensitivityLevel string                `json:"cultural_sensitivity_level"`
}

// UnifiedPersonaMetrics tracks performance metrics for the unified service
type UnifiedPersonaMetrics struct {
	// Request metrics
	TotalRequests           int64                  `json:"total_requests"`
	SuccessfulRequests      int64                  `json:"successful_requests"`
	FailedRequests          int64                  `json:"failed_requests"`
	LegacyFallbackUsage     int64                  `json:"legacy_fallback_usage"`
	
	// Performance metrics
	AverageProcessingTime   time.Duration          `json:"average_processing_time"`
	CacheHitRate           float64                `json:"cache_hit_rate"`
	CacheMissRate          float64                `json:"cache_miss_rate"`
	
	// Quality metrics
	PersonaApplicationRate  float64                `json:"persona_application_rate"`
	CulturalAdaptationRate  float64                `json:"cultural_adaptation_rate"`
	UserSatisfactionScore   float64                `json:"user_satisfaction_score"`
	
	// Last updated
	LastUpdated            time.Time              `json:"last_updated"`
}

// UnifiedPersonaRequest represents a request to the unified persona service
type UnifiedPersonaRequest struct {
	// Request identification
	RequestID           string                 `json:"request_id"`
	CorrelationID       string                 `json:"correlation_id"`
	
	// User context
	UserID              string                 `json:"user_id"`
	SessionID           string                 `json:"session_id"`
	
	// Query information
	Query               string                 `json:"query"`
	BaseResponse        string                 `json:"base_response"`
	ServiceType         types.ServiceType      `json:"service_type"`
	
	// Context information
	IsFirstContact      bool                   `json:"is_first_contact"`
	ConversationHistory []string               `json:"conversation_history"`
	UserPreferences     map[string]interface{} `json:"user_preferences"`
	
	// Processing options
	EnableCaching       bool                   `json:"enable_caching"`
	EnableFallback      bool                   `json:"enable_fallback"`
	Timeout             time.Duration          `json:"timeout"`
	
	// Context correlation
	TraceID             string                 `json:"trace_id"`
	SpanID              string                 `json:"span_id"`
}

// UnifiedPersonaResponse represents a response from the unified persona service
type UnifiedPersonaResponse struct {
	// Response identification
	RequestID           string                 `json:"request_id"`
	CorrelationID       string                 `json:"correlation_id"`
	
	// Response content
	ProcessedResponse   string                 `json:"processed_response"`
	PersonalityApplied  bool                   `json:"personality_applied"`
	
	// Processing details
	MoodDetected        string                 `json:"mood_detected"`
	ServiceRecognized   string                 `json:"service_recognized"`
	CulturalContext     string                 `json:"cultural_context"`
	RegionalAdaptation  string                 `json:"regional_adaptation"`
	
	// Performance information
	ProcessingTime      time.Duration          `json:"processing_time"`
	CacheHit            bool                   `json:"cache_hit"`
	FallbackUsed        bool                   `json:"fallback_used"`
	ServiceUsed         string                 `json:"service_used"` // "unified", "legacy", "fallback"
	
	// Quality metrics
	ConfidenceScore     float64                `json:"confidence_score"`
	QualityScore        float64                `json:"quality_score"`
	
	// Metadata
	Metadata            map[string]interface{} `json:"metadata"`
	Timestamp           time.Time              `json:"timestamp"`
}

// NewUnifiedPersonaService creates a new unified persona service
func NewUnifiedPersonaService(config *UnifiedPersonaConfig, featureFlags *config.FeatureFlags) (*UnifiedPersonaService, error) {
	logrus.Info("🤖 Creating unified persona service - Phase 2 Week 3 implementation")
	
	// Initialize core components
	sellyPersona := NewSellyPersona()
	if sellyPersona == nil {
		return nil, fmt.Errorf("failed to create SELLY persona")
	}
	
	integrationService := NewPersonaIntegrationService()
	if integrationService == nil {
		return nil, fmt.Errorf("failed to create persona integration service")
	}
	
	// Initialize legacy service for backward compatibility
	var legacyPersonaService *PersonaService
	if config.EnableLegacyFallback {
		legacyPersonaService = NewPersonaService()
		if legacyPersonaService == nil {
			logrus.Warn("Failed to create legacy persona service, continuing without fallback")
		}
	}
	
	// Generate correlation ID function
	correlationIDGen := func() string {
		return fmt.Sprintf("persona-%d", time.Now().UnixNano())
	}
	
	service := &UnifiedPersonaService{
		sellyPersona:         sellyPersona,
		integrationService:   integrationService,
		legacyPersonaService: legacyPersonaService,
		config:               config,
		featureFlags:         featureFlags,
		enabled:              true,
		migrationMode:        config.EnableLegacyFallback,
		metrics:              &UnifiedPersonaMetrics{LastUpdated: time.Now()},
		correlationIDGen:     correlationIDGen,
	}
	
	logrus.WithFields(logrus.Fields{
		"legacy_fallback":     config.EnableLegacyFallback,
		"training_data_path":  config.TrainingDataPath,
		"upstash_redis":       config.EnableUpstashRedisCache,
		"smart_ttl":           config.EnableSmartTTL,
	}).Info("✅ Unified persona service created successfully")
	
	return service, nil
}

// ProcessPersonaRequest processes a persona request using the unified service
func (ups *UnifiedPersonaService) ProcessPersonaRequest(ctx context.Context, request *UnifiedPersonaRequest) (*UnifiedPersonaResponse, error) {
	startTime := time.Now()
	
	// Generate correlation ID if not provided
	if request.CorrelationID == "" {
		request.CorrelationID = ups.correlationIDGen()
	}
	
	logrus.WithFields(logrus.Fields{
		"request_id":     request.RequestID,
		"correlation_id": request.CorrelationID,
		"user_id":        request.UserID,
		"service_type":   request.ServiceType,
	}).Info("🤖 Processing unified persona request")
	
	ups.mutex.RLock()
	enabled := ups.enabled
	ups.mutex.RUnlock()
	
	if !enabled {
		return ups.createErrorResponse(request, "unified persona service is disabled", startTime)
	}
	
	// Update metrics
	ups.updateMetrics("request_received")
	
	// Try unified processing first
	response, err := ups.processWithUnifiedService(ctx, request)
	if err == nil {
		response.ServiceUsed = "unified"
		ups.updateMetrics("unified_success")
		return response, nil
	}
	
	logrus.WithError(err).Warn("Unified processing failed, attempting fallback")
	
	// Try legacy fallback if enabled
	if ups.migrationMode && ups.legacyPersonaService != nil {
		response, fallbackErr := ups.processWithLegacyService(ctx, request)
		if fallbackErr == nil {
			response.ServiceUsed = "legacy"
			response.FallbackUsed = true
			ups.updateMetrics("legacy_fallback_success")
			return response, nil
		}
		
		logrus.WithError(fallbackErr).Warn("Legacy fallback also failed")
	}
	
	// Return error response
	ups.updateMetrics("request_failed")
	return ups.createErrorResponse(request, fmt.Sprintf("all processing methods failed: %v", err), startTime)
}

// processWithUnifiedService processes the request using the unified service components
func (ups *UnifiedPersonaService) processWithUnifiedService(ctx context.Context, request *UnifiedPersonaRequest) (*UnifiedPersonaResponse, error) {
	// Apply timeout if specified
	if request.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, request.Timeout)
		defer cancel()
	}
	
	// Convert request to SELLY persona format
	sellyRequest := &PersonaRequest{
		Query:          request.Query,
		UserID:         request.UserID,
		SessionID:      request.SessionID,
		BaseResponse:   request.BaseResponse,
		ServiceType:    request.ServiceType.String(),
		IsFirstContact: request.IsFirstContact,
		Context: map[string]interface{}{
			"user_preferences": request.UserPreferences,
			"correlation_id":   request.CorrelationID,
			"trace_id":         request.TraceID,
			"span_id":          request.SpanID,
		},
		TimeOfDay: "default", // TODO: Extract from context
		UserTone:  "neutral", // TODO: Detect from query
	}
	
	// Process with SELLY persona
	sellyResponse, err := ups.sellyPersona.ApplyPersona(ctx, sellyRequest)
	if err != nil {
		return nil, fmt.Errorf("SELLY persona processing failed: %w", err)
	}
	
	// Convert response to unified format
	response := &UnifiedPersonaResponse{
		RequestID:          request.RequestID,
		CorrelationID:      request.CorrelationID,
		ProcessedResponse:  sellyResponse.Content,
		PersonalityApplied: sellyResponse.PersonalityApplied,
		MoodDetected:       "neutral", // TODO: Extract mood detection
		ServiceRecognized:  sellyResponse.ServiceClassification,
		CulturalContext:    sellyResponse.CulturalEnhancement,
		RegionalAdaptation: "default", // TODO: Extract regional adaptation
		ProcessingTime:     time.Duration(sellyResponse.ProcessingTime * float64(time.Millisecond)),
		CacheHit:           false, // TODO: Implement cache checking
		FallbackUsed:       false,
		ConfidenceScore:    0.95, // TODO: Calculate confidence based on processing success
		QualityScore:       0.90, // TODO: Implement quality scoring
		Metadata:           sellyResponse.Metadata,
		Timestamp:          time.Now(),
	}
	
	return response, nil
}

// processWithLegacyService processes the request using the legacy persona service
func (ups *UnifiedPersonaService) processWithLegacyService(ctx context.Context, request *UnifiedPersonaRequest) (*UnifiedPersonaResponse, error) {
	if ups.legacyPersonaService == nil {
		return nil, fmt.Errorf("legacy persona service not available")
	}
	
	// Convert request to legacy format
	legacyRequest := &PersonaProcessingRequest{
		Query:               request.Query,
		UserID:              request.UserID,
		SessionID:           request.SessionID,
		BaseResponse:        request.BaseResponse,
		IsFirstContact:      request.IsFirstContact,
		ConversationHistory: request.ConversationHistory,
		Context: map[string]interface{}{
			"service_type":     request.ServiceType.String(),
			"user_preferences": request.UserPreferences,
		},
	}
	
	// Process with legacy service
	legacyResponse, err := ups.legacyPersonaService.ProcessWithPersona(ctx, legacyRequest)
	if err != nil {
		return nil, fmt.Errorf("legacy persona processing failed: %w", err)
	}
	
	// Convert response to unified format
	response := &UnifiedPersonaResponse{
		RequestID:          request.RequestID,
		CorrelationID:      request.CorrelationID,
		ProcessedResponse:  legacyResponse.ProcessedResponse,
		PersonalityApplied: legacyResponse.PersonalityApplied,
		MoodDetected:       legacyResponse.MoodDetected,
		ServiceRecognized:  legacyResponse.ServiceRecognized,
		CulturalContext:    legacyResponse.CulturalContext,
		ProcessingTime:     time.Duration(legacyResponse.ProcessingTime * float64(time.Millisecond)),
		CacheHit:           false,
		FallbackUsed:       true,
		ConfidenceScore:    0.80, // Lower confidence for legacy fallback
		QualityScore:       0.75,
		Metadata:           legacyResponse.Metadata,
		Timestamp:          time.Now(),
	}
	
	return response, nil
}

// createErrorResponse creates an error response
func (ups *UnifiedPersonaService) createErrorResponse(request *UnifiedPersonaRequest, errorMsg string, startTime time.Time) (*UnifiedPersonaResponse, error) {
	return &UnifiedPersonaResponse{
		RequestID:          request.RequestID,
		CorrelationID:      request.CorrelationID,
		ProcessedResponse:  request.BaseResponse, // Return original response on error
		PersonalityApplied: false,
		MoodDetected:       "unknown",
		ServiceRecognized:  "unknown",
		CulturalContext:    "error",
		ProcessingTime:     time.Since(startTime),
		CacheHit:           false,
		FallbackUsed:       false,
		ServiceUsed:        "error",
		ConfidenceScore:    0.0,
		QualityScore:       0.0,
		Metadata: map[string]interface{}{
			"error": errorMsg,
		},
		Timestamp: time.Now(),
	}, fmt.Errorf("%s", errorMsg)
}

// updateMetrics updates the service metrics
func (ups *UnifiedPersonaService) updateMetrics(eventType string) {
	ups.mutex.Lock()
	defer ups.mutex.Unlock()
	
	switch eventType {
	case "request_received":
		ups.metrics.TotalRequests++
	case "unified_success":
		ups.metrics.SuccessfulRequests++
	case "legacy_fallback_success":
		ups.metrics.SuccessfulRequests++
		ups.metrics.LegacyFallbackUsage++
	case "request_failed":
		ups.metrics.FailedRequests++
	}
	
	ups.metrics.LastUpdated = time.Now()
}

// GetMetrics returns current service metrics
func (ups *UnifiedPersonaService) GetMetrics() *UnifiedPersonaMetrics {
	ups.mutex.RLock()
	defer ups.mutex.RUnlock()
	
	// Calculate derived metrics
	if ups.metrics.TotalRequests > 0 {
		ups.metrics.PersonaApplicationRate = float64(ups.metrics.SuccessfulRequests) / float64(ups.metrics.TotalRequests) * 100
	}
	
	return ups.metrics
}

// SetEnabled enables or disables the service
func (ups *UnifiedPersonaService) SetEnabled(enabled bool) {
	ups.mutex.Lock()
	defer ups.mutex.Unlock()
	
	ups.enabled = enabled
	logrus.WithField("enabled", enabled).Info("🤖 Unified persona service status updated")
}

// IsEnabled returns whether the service is enabled
func (ups *UnifiedPersonaService) IsEnabled() bool {
	ups.mutex.RLock()
	defer ups.mutex.RUnlock()
	
	return ups.enabled
}

// GetConfig returns the current service configuration
func (ups *UnifiedPersonaService) GetConfig() *UnifiedPersonaConfig {
	return ups.config
}

// UpdateConfig updates the service configuration
func (ups *UnifiedPersonaService) UpdateConfig(config *UnifiedPersonaConfig) error {
	ups.mutex.Lock()
	defer ups.mutex.Unlock()
	
	ups.config = config
	logrus.Info("🤖 Unified persona service configuration updated")
	
	return nil
}

// Health check for the unified service
func (ups *UnifiedPersonaService) HealthCheck(ctx context.Context) error {
	if !ups.IsEnabled() {
		return fmt.Errorf("unified persona service is disabled")
	}
	
	// Check core components
	if ups.sellyPersona == nil {
		return fmt.Errorf("SELLY persona is not initialized")
	}
	
	if ups.integrationService == nil {
		return fmt.Errorf("persona integration service is not initialized")
	}
	
	// Test with a simple request
	testRequest := &UnifiedPersonaRequest{
		RequestID:    "health-check",
		Query:        "test query",
		BaseResponse: "test response",
		ServiceType:  types.ServiceTypeKartuKeluarga,
		Timeout:      5 * time.Second,
	}
	
	_, err := ups.ProcessPersonaRequest(ctx, testRequest)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	
	return nil
}

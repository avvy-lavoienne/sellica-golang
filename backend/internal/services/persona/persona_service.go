package persona

import (
	"context"
	"sync"

	"github.com/sirupsen/logrus"
)

// PersonaService provides a unified interface for SELLY persona functionality
// This service integrates the enhanced persona components and provides backward compatibility
type PersonaService struct {
	enhancedIntegration *EnhancedPersonaIntegration
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

// NewPersonaService creates a new persona service with enhanced capabilities
func NewPersonaService() *PersonaService {
	return &PersonaService{
		enhancedIntegration: NewEnhancedPersonaIntegration(),
		enabled:             true,
	}
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

	// Process with enhanced integration
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

	// Convert to simplified response
	response := &PersonaProcessingResponse{
		ProcessedResponse:  enhancedResp.ProcessedResponse,
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

// GetGlobalPersonaService returns the global persona service instance
func GetGlobalPersonaService() *PersonaService {
	personaServiceOnce.Do(func() {
		globalPersonaService = NewPersonaService()
		logrus.Info("Global SELLY persona service initialized with enhanced capabilities")
	})
	return globalPersonaService
}

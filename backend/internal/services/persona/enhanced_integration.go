package persona

import (
	"context"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// EnhancedPersonaIntegration provides comprehensive SELLY persona integration
// Uses the migrated enhanced components from Next.js
type EnhancedPersonaIntegration struct {
	moodDetector        *EnhancedMoodDetector
	culturalProcessor   *EnhancedCulturalProcessor
	serviceRecognizer   *EnhancedServiceRecognizer
	greetingManager     *EnhancedGreetingManager
	sessionMemory       map[string]*PersonaSession
	enabled             bool
}

// PersonaSession tracks session-specific persona context
type PersonaSession struct {
	SessionID           string                   `json:"session_id"`
	UserID              string                   `json:"user_id"`
	ConversationHistory []string                 `json:"conversation_history"`
	LastMood            *MoodDetectionResult     `json:"last_mood"`
	CulturalContext     *CulturalContext         `json:"cultural_context"`
	ServiceContext      *ServiceRecognitionResult `json:"service_context"`
	CreatedAt           time.Time                `json:"created_at"`
	UpdatedAt           time.Time                `json:"updated_at"`
}

// EnhancedPersonaRequest represents a comprehensive persona processing request
type EnhancedPersonaRequest struct {
	Query               string                 `json:"query"`
	UserID              string                 `json:"user_id"`
	SessionID           string                 `json:"session_id"`
	BaseResponse        string                 `json:"base_response"`
	Context             map[string]interface{} `json:"context"`
	IsFirstContact      bool                   `json:"is_first_contact"`
	ConversationHistory []string               `json:"conversation_history"`
}

// EnhancedPersonaResponse represents the comprehensive persona processing result
type EnhancedPersonaResponse struct {
	ProcessedResponse   string                    `json:"processed_response"`
	Greeting            *EnhancedGreetingResponse `json:"greeting"`
	MoodDetection       *MoodDetectionResult      `json:"mood_detection"`
	CulturalContext     *CulturalContext          `json:"cultural_context"`
	ServiceRecognition  *ServiceRecognitionResult `json:"service_recognition"`
	ProcessingTime      float64                   `json:"processing_time"`
	PersonalityApplied  bool                      `json:"personality_applied"`
	Metadata            map[string]interface{}    `json:"metadata"`
}

// NewEnhancedPersonaIntegration creates a new enhanced persona integration service
func NewEnhancedPersonaIntegration() *EnhancedPersonaIntegration {
	// Initialize enhanced components
	moodDetector := NewEnhancedMoodDetector()
	culturalProcessor := NewEnhancedCulturalProcessor([]CulturalRule{}) // Will be populated
	serviceRecognizer := NewEnhancedServiceRecognizer()
	greetingManager := NewEnhancedGreetingManager([]GreetingProtocol{}) // Will be populated

	return &EnhancedPersonaIntegration{
		moodDetector:      moodDetector,
		culturalProcessor: culturalProcessor,
		serviceRecognizer: serviceRecognizer,
		greetingManager:   greetingManager,
		sessionMemory:     make(map[string]*PersonaSession),
		enabled:           true,
	}
}

// ProcessWithEnhancedPersona processes a request with full enhanced persona capabilities
func (epi *EnhancedPersonaIntegration) ProcessWithEnhancedPersona(ctx context.Context, req *EnhancedPersonaRequest) (*EnhancedPersonaResponse, error) {
	if !epi.enabled {
		return &EnhancedPersonaResponse{
			ProcessedResponse:  req.BaseResponse,
			PersonalityApplied: false,
		}, nil
	}

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"user_id":         req.UserID,
		"session_id":      req.SessionID,
		"query_length":    len(req.Query),
		"is_first_contact": req.IsFirstContact,
		"history_length":  len(req.ConversationHistory),
	}).Debug("Processing with enhanced SELLY persona")

	// Get or create session
	session := epi.getOrCreateSession(req)

	// Step 1: Detect user mood
	moodResult, err := epi.moodDetector.DetectMood(ctx, req.Query, req.ConversationHistory)
	if err != nil {
		logrus.WithError(err).Warn("Mood detection failed, using neutral mood")
		moodResult = &MoodDetectionResult{
			PrimaryMood: "neutral",
			Confidence:  0.5,
		}
	}

	// Step 2: Recognize service intent
	serviceResult, err := epi.serviceRecognizer.RecognizeService(ctx, req.Query, req.ConversationHistory)
	if err != nil {
		logrus.WithError(err).Warn("Service recognition failed")
		serviceResult = &ServiceRecognitionResult{
			IsServiceRequest: false,
			ServiceType:      "unknown",
			Confidence:       0.0,
		}
	}

	// Step 3: Generate intelligent greeting
	greetingRequest := &EnhancedGreetingRequest{
		UserID:              req.UserID,
		SessionID:           req.SessionID,
		IsFirstContact:      req.IsFirstContact,
		ServiceType:         serviceResult.ServiceType,
		UserQuery:           req.Query,
		ConversationHistory: req.ConversationHistory,
		CulturalContext:     session.CulturalContext,
		UserMood:            moodResult,
		Context:             req.Context,
	}

	greetingResult, err := epi.greetingManager.GenerateEnhancedGreeting(ctx, greetingRequest)
	if err != nil {
		logrus.WithError(err).Warn("Enhanced greeting generation failed")
		greetingResult = &EnhancedGreetingResponse{
			Greeting:     "",
			GreetingType: "none",
		}
	}

	// Step 4: Apply cultural processing
	culturalRequest := &EnhancedCulturalRequest{
		BaseResponse:        req.BaseResponse,
		Query:               req.Query,
		ServiceType:         serviceResult.ServiceType,
		UserContext:         req.Context,
		ConversationHistory: req.ConversationHistory,
		UserMood:            moodResult,
	}

	culturalResult, err := epi.culturalProcessor.ProcessResponseWithEnhancedContext(ctx, culturalRequest)
	if err != nil {
		logrus.WithError(err).Warn("Cultural processing failed, using base response")
		culturalResult = &EnhancedCulturalResult{
			ProcessedResponse: req.BaseResponse,
			CulturalContext: &CulturalContext{
				Region:         "general_indonesia",
				FormalityLevel: "formal",
				Confidence:     0.5,
			},
		}
	}

	// Step 5: Combine greeting with processed response
	finalResponse := epi.combineGreetingAndResponse(greetingResult.Greeting, culturalResult.ProcessedResponse)

	// Step 6: Update session context
	epi.updateSession(session, req, moodResult, culturalResult.CulturalContext, serviceResult)

	processingTime := float64(time.Since(startTime).Nanoseconds()) / 1e6

	response := &EnhancedPersonaResponse{
		ProcessedResponse:  finalResponse,
		Greeting:           greetingResult,
		MoodDetection:      moodResult,
		CulturalContext:    culturalResult.CulturalContext,
		ServiceRecognition: serviceResult,
		ProcessingTime:     processingTime,
		PersonalityApplied: true,
		Metadata: map[string]interface{}{
			"enhanced_persona_version": "2.0_migrated_from_nextjs",
			"mood_detected":           moodResult.PrimaryMood,
			"service_recognized":      serviceResult.ServiceType,
			"cultural_adaptation":     culturalResult.AdaptationApplied,
			"greeting_generated":      greetingResult.GreetingType != "none",
			"session_continuity":      greetingResult.SessionContinuity,
		},
	}

	logrus.WithFields(logrus.Fields{
		"processing_ms":       processingTime,
		"mood_detected":       moodResult.PrimaryMood,
		"mood_confidence":     moodResult.Confidence,
		"service_recognized":  serviceResult.ServiceType,
		"service_confidence":  serviceResult.Confidence,
		"greeting_type":       greetingResult.GreetingType,
		"cultural_region":     culturalResult.CulturalContext.Region,
		"cultural_formality":  culturalResult.CulturalContext.FormalityLevel,
		"personality_applied": true,
	}).Debug("Enhanced SELLY persona processing completed")

	return response, nil
}

// getOrCreateSession gets or creates a persona session
func (epi *EnhancedPersonaIntegration) getOrCreateSession(req *EnhancedPersonaRequest) *PersonaSession {
	if session, exists := epi.sessionMemory[req.SessionID]; exists {
		// Update conversation history
		session.ConversationHistory = append(session.ConversationHistory, req.Query)
		
		// Keep only last 10 messages for performance
		if len(session.ConversationHistory) > 10 {
			session.ConversationHistory = session.ConversationHistory[len(session.ConversationHistory)-10:]
		}
		
		session.UpdatedAt = time.Now()
		return session
	}

	// Create new session
	session := &PersonaSession{
		SessionID:           req.SessionID,
		UserID:              req.UserID,
		ConversationHistory: []string{req.Query},
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	epi.sessionMemory[req.SessionID] = session
	return session
}

// updateSession updates session context with processing results
func (epi *EnhancedPersonaIntegration) updateSession(session *PersonaSession, _ *EnhancedPersonaRequest, mood *MoodDetectionResult, cultural *CulturalContext, service *ServiceRecognitionResult) {
	session.LastMood = mood
	session.CulturalContext = cultural
	session.ServiceContext = service
	session.UpdatedAt = time.Now()
}

// combineGreetingAndResponse combines greeting with processed response intelligently
func (epi *EnhancedPersonaIntegration) combineGreetingAndResponse(greeting, response string) string {
	if greeting == "" {
		return response
	}

	// If response already starts with a greeting, don't duplicate
	lowerResponse := strings.ToLower(response)
	if strings.HasPrefix(lowerResponse, "selamat") ||
	   strings.HasPrefix(lowerResponse, "halo") ||
	   strings.HasPrefix(lowerResponse, "waalaikumsalam") {
		return response
	}

	// If response contains similar content to greeting, avoid duplication
	if strings.Contains(lowerResponse, "selly ai assistant") &&
	   strings.Contains(strings.ToLower(greeting), "selly ai assistant") {
		return greeting // Use greeting as it's more complete
	}

	// If response is generic, replace with greeting
	if strings.Contains(lowerResponse, "saya siap membantu") && len(greeting) > 50 {
		return greeting
	}

	// Combine greeting with response only if they're truly different
	if response == "" {
		return greeting
	}

	// Check for content overlap to avoid redundancy
	if len(greeting) > 100 && len(response) < 100 {
		return greeting // Greeting is more comprehensive
	}

	return greeting + " " + response
}

// IsEnabled returns whether the enhanced persona integration is enabled
func (epi *EnhancedPersonaIntegration) IsEnabled() bool {
	return epi.enabled
}

// SetEnabled enables or disables the enhanced persona integration
func (epi *EnhancedPersonaIntegration) SetEnabled(enabled bool) {
	epi.enabled = enabled
}

// GetSessionContext returns session context for debugging
func (epi *EnhancedPersonaIntegration) GetSessionContext(sessionID string) *PersonaSession {
	return epi.sessionMemory[sessionID]
}

// CleanupSessions removes old sessions to prevent memory leaks
func (epi *EnhancedPersonaIntegration) CleanupSessions() {
	cutoff := time.Now().Add(-2 * time.Hour) // Remove sessions older than 2 hours
	
	for sessionID, session := range epi.sessionMemory {
		if session.UpdatedAt.Before(cutoff) {
			delete(epi.sessionMemory, sessionID)
		}
	}
}

// GetMetrics returns persona integration metrics
func (epi *EnhancedPersonaIntegration) GetMetrics() map[string]interface{} {
	activeSessions := 0
	totalConversations := 0
	
	for _, session := range epi.sessionMemory {
		activeSessions++
		totalConversations += len(session.ConversationHistory)
	}
	
	return map[string]interface{}{
		"enabled":             epi.enabled,
		"active_sessions":     activeSessions,
		"total_conversations": totalConversations,
		"components": map[string]bool{
			"mood_detector":        epi.moodDetector != nil,
			"cultural_processor":   epi.culturalProcessor != nil,
			"service_recognizer":   epi.serviceRecognizer != nil,
			"greeting_manager":     epi.greetingManager != nil,
		},
	}
}

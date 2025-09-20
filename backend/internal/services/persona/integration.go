package persona

import (
	"context"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// PersonaIntegrationService integrates SELLY persona with AI services
type PersonaIntegrationService struct {
	sellyPersona *SellyPersona
	enabled      bool
}

// AIRequest represents an AI request (matching the chat service interface)
type AIRequest struct {
	Query           string                 `json:"query"`
	UserID          string                 `json:"user_id"`
	SessionID       string                 `json:"session_id"`
	Context         map[string]interface{} `json:"context"`
	EnhancementMode string                 `json:"enhancement_mode"`
}

// AIResponse represents an AI response (matching the chat service interface)
type AIResponse struct {
	Content         string                 `json:"content"`
	Type            string                 `json:"type"`
	Confidence      float64                `json:"confidence"`
	Model           string                 `json:"model"`
	ProcessingTime  float64                `json:"processing_time"`
	CacheHit        bool                   `json:"cache_hit"`
	CacheLayer      string                 `json:"cache_layer"`
	Recommendations []string               `json:"recommendations"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// SessionAIRequest represents a session-aware AI request
type SessionAIRequest struct {
	Query   string                 `json:"query"`
	UserID  string                 `json:"user_id"`
	Context map[string]interface{} `json:"context"`
	Session *Session               `json:"session"`
}

// Session represents a user session
type Session struct {
	ID                     string                 `json:"id"`
	UserID                 string                 `json:"user_id"`
	ConversationHistory    []ConversationTurn     `json:"conversation_history"`
	UserExpertiseLevel     string                 `json:"user_expertise_level"`
	PreferredResponseStyle string                 `json:"preferred_response_style"`
	ServiceContext         map[string]interface{} `json:"service_context"`
	CreatedAt              time.Time              `json:"created_at"`
	UpdatedAt              time.Time              `json:"updated_at"`
}

// ConversationTurn represents a single conversation turn
type ConversationTurn struct {
	UserMessage string    `json:"user_message"`
	AIResponse  string    `json:"ai_response"`
	Timestamp   time.Time `json:"timestamp"`
	ServiceType string    `json:"service_type"`
	Confidence  float64   `json:"confidence"`
}

// NewPersonaIntegrationService creates a new persona integration service
func NewPersonaIntegrationService() *PersonaIntegrationService {
	return &PersonaIntegrationService{
		sellyPersona: NewSellyPersona(),
		enabled:      true,
	}
}

// EnhanceAIResponse enhances an AI response with SELLY persona
func (pis *PersonaIntegrationService) EnhanceAIResponse(ctx context.Context, aiRequest *AIRequest, aiResponse *AIResponse) (*AIResponse, error) {
	if !pis.enabled || pis.sellyPersona == nil {
		return aiResponse, nil
	}

	startTime := time.Now()

	// Determine if this is a first contact
	isFirstContact := pis.isFirstContact(aiRequest)

	// Determine time of day
	timeOfDay := pis.getCurrentTimeOfDay()

	// Classify service type from query
	serviceType := pis.classifyServiceType(aiRequest.Query)

	// Determine user tone
	userTone := pis.analyzeUserTone(aiRequest.Query)

	// Create persona request
	personaRequest := &PersonaRequest{
		Query:          aiRequest.Query,
		UserID:         aiRequest.UserID,
		SessionID:      aiRequest.SessionID,
		Context:        aiRequest.Context,
		BaseResponse:   aiResponse.Content,
		ServiceType:    serviceType,
		IsFirstContact: isFirstContact,
		TimeOfDay:      timeOfDay,
		UserTone:       userTone,
	}

	// Apply SELLY persona
	personaResponse, err := pis.sellyPersona.ApplyPersona(ctx, personaRequest)
	if err != nil {
		logrus.WithError(err).Warn("Failed to apply SELLY persona, using original response")
		return aiResponse, nil
	}

	// Enhance the AI response with persona data
	enhancedResponse := &AIResponse{
		Content:         personaResponse.Content,
		Type:            aiResponse.Type,
		Confidence:      aiResponse.Confidence,
		Model:           aiResponse.Model + " + SELLY Persona",
		ProcessingTime:  aiResponse.ProcessingTime + personaResponse.ProcessingTime,
		CacheHit:        aiResponse.CacheHit,
		CacheLayer:      aiResponse.CacheLayer,
		Recommendations: personaResponse.Recommendations,
		Metadata: map[string]interface{}{
			"original_metadata":       aiResponse.Metadata,
			"persona_metadata":        personaResponse.Metadata,
			"persona_applied":         personaResponse.PersonalityApplied,
			"greeting_applied":        personaResponse.Greeting != "",
			"cultural_enhancement":    personaResponse.CulturalEnhancement != personaRequest.BaseResponse,
			"formality_level":         personaResponse.FormalityLevel,
			"service_classification":  personaResponse.ServiceClassification,
			"persona_processing_time": personaResponse.ProcessingTime,
		},
	}

	processingTime := time.Since(startTime).Seconds() * 1000

	logrus.WithFields(logrus.Fields{
		"user_id":                 aiRequest.UserID,
		"session_id":              aiRequest.SessionID,
		"service_type":            serviceType,
		"persona_applied":         personaResponse.PersonalityApplied,
		"greeting_applied":        personaResponse.Greeting != "",
		"cultural_enhanced":       personaResponse.CulturalEnhancement != personaRequest.BaseResponse,
		"total_processing_time":   processingTime,
		"persona_processing_time": personaResponse.ProcessingTime,
	}).Info("SELLY persona enhancement completed")

	return enhancedResponse, nil
}

// EnhanceSessionAIResponse enhances a session-aware AI response with SELLY persona
func (pis *PersonaIntegrationService) EnhanceSessionAIResponse(ctx context.Context, sessionRequest *SessionAIRequest, aiResponse *AIResponse) (*AIResponse, error) {
	if !pis.enabled || pis.sellyPersona == nil {
		return aiResponse, nil
	}

	// Extract session information for persona processing

	// Use session history for enhanced context
	conversationHistory := pis.extractConversationHistory(sessionRequest.Session)

	// Determine if this is a first contact based on session
	isFirstContact := len(sessionRequest.Session.ConversationHistory) == 0

	// Create enhanced persona request with session context
	personaRequest := &PersonaRequest{
		Query:          sessionRequest.Query,
		UserID:         sessionRequest.UserID,
		SessionID:      sessionRequest.Session.ID,
		Context:        sessionRequest.Context,
		BaseResponse:   aiResponse.Content,
		ServiceType:    pis.determineSessionServiceType(sessionRequest.Session),
		IsFirstContact: isFirstContact,
		TimeOfDay:      pis.getCurrentTimeOfDay(),
		UserTone:       pis.analyzeUserTone(sessionRequest.Query),
	}

	// Apply persona with session context
	personaResponse, err := pis.sellyPersona.ApplyPersona(ctx, personaRequest)
	if err != nil {
		logrus.WithError(err).Warn("Failed to apply SELLY persona to session response")
		return aiResponse, nil
	}

	// Generate contextual greeting based on conversation history
	if pis.sellyPersona.greetingManager != nil {
		contextualGreeting := pis.sellyPersona.greetingManager.GenerateContextualGreeting(ctx, &GreetingRequest{
			UserID:         sessionRequest.UserID,
			SessionID:      sessionRequest.Session.ID,
			TimeOfDay:      pis.getCurrentTimeOfDay(),
			IsFirstContact: isFirstContact,
			ServiceType:    personaRequest.ServiceType,
			UserTone:       personaRequest.UserTone,
		}, conversationHistory)

		if contextualGreeting != "" && contextualGreeting != personaResponse.Greeting {
			personaResponse.Content = contextualGreeting + " " + personaResponse.Content
		}
	}

	// Create enhanced response
	enhancedResponse := &AIResponse{
		Content:         personaResponse.Content,
		Type:            aiResponse.Type,
		Confidence:      aiResponse.Confidence,
		Model:           aiResponse.Model + " + SELLY Session Persona",
		ProcessingTime:  aiResponse.ProcessingTime + personaResponse.ProcessingTime,
		CacheHit:        aiResponse.CacheHit,
		CacheLayer:      "session-persona-enhanced",
		Recommendations: personaResponse.Recommendations,
		Metadata: map[string]interface{}{
			"original_metadata":        aiResponse.Metadata,
			"persona_metadata":         personaResponse.Metadata,
			"session_enhanced":         true,
			"conversation_turns":       len(sessionRequest.Session.ConversationHistory),
			"user_expertise_level":     sessionRequest.Session.UserExpertiseLevel,
			"preferred_response_style": sessionRequest.Session.PreferredResponseStyle,
		},
	}

	return enhancedResponse, nil
}

// Helper methods

func (pis *PersonaIntegrationService) isFirstContact(req *AIRequest) bool {
	// Simple heuristic: if no session ID or context suggests first contact
	if req.SessionID == "" {
		return true
	}

	if req.Context != nil {
		if firstContact, exists := req.Context["is_first_contact"]; exists {
			if fc, ok := firstContact.(bool); ok {
				return fc
			}
		}
	}

	return false
}

func (pis *PersonaIntegrationService) getCurrentTimeOfDay() string {
	hour := time.Now().Hour()
	switch {
	case hour >= 5 && hour < 12:
		return "morning"
	case hour >= 12 && hour < 17:
		return "afternoon"
	case hour >= 17 && hour < 21:
		return "evening"
	default:
		return "night"
	}
}

func (pis *PersonaIntegrationService) classifyServiceType(query string) string {
	query = strings.ToLower(query)

	if strings.Contains(query, "ktp") || strings.Contains(query, "kartu tanda penduduk") {
		return "ktp"
	}
	if strings.Contains(query, "akta") || strings.Contains(query, "kelahiran") {
		return "akta"
	}
	if strings.Contains(query, "pindah") || strings.Contains(query, "domisili") {
		return "perpindahan"
	}
	if strings.Contains(query, "kartu keluarga") || strings.Contains(query, "kk") {
		return "kk"
	}
	if strings.Contains(query, "surat") {
		return "surat"
	}

	return "umum"
}

func (pis *PersonaIntegrationService) analyzeUserTone(query string) string {
	query = strings.ToLower(query)

	urgentWords := []string{"urgent", "mendesak", "cepat", "segera", "penting"}
	frustratedWords := []string{"susah", "ribet", "bingung", "tidak bisa", "gagal"}
	politeWords := []string{"tolong", "mohon", "silakan", "terima kasih"}

	for _, word := range urgentWords {
		if strings.Contains(query, word) {
			return "urgent"
		}
	}

	for _, word := range frustratedWords {
		if strings.Contains(query, word) {
			return "frustrated"
		}
	}

	for _, word := range politeWords {
		if strings.Contains(query, word) {
			return "polite"
		}
	}

	return "neutral"
}

func (pis *PersonaIntegrationService) extractConversationHistory(session *Session) []string {
	history := make([]string, len(session.ConversationHistory))
	for i, turn := range session.ConversationHistory {
		history[i] = turn.UserMessage
	}
	return history
}

func (pis *PersonaIntegrationService) determineSessionServiceType(session *Session) string {
	// Analyze conversation history to determine primary service type
	serviceCounts := make(map[string]int)

	for _, turn := range session.ConversationHistory {
		serviceType := pis.classifyServiceType(turn.UserMessage)
		serviceCounts[serviceType]++
	}

	// Find the most common service type
	maxCount := 0
	primaryService := "umum"
	for service, count := range serviceCounts {
		if count > maxCount {
			maxCount = count
			primaryService = service
		}
	}

	return primaryService
}

// IsEnabled returns whether persona integration is enabled
func (pis *PersonaIntegrationService) IsEnabled() bool {
	return pis.enabled
}

// SetEnabled enables or disables persona integration
func (pis *PersonaIntegrationService) SetEnabled(enabled bool) {
	pis.enabled = enabled
}

// GetPersona returns the SELLY persona instance
func (pis *PersonaIntegrationService) GetPersona() *SellyPersona {
	return pis.sellyPersona
}

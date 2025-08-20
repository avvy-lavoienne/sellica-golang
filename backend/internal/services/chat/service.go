package chat

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/pkg/types"
)

// Service provides chat processing functionality
type Service struct {
	db        *database.Service
	cache     *cache.Service
	auth      *auth.Service
	aiService *AIService
	sessions  *SessionManager
	mu        sync.RWMutex
	isHealthy bool
}

// ChatRequest represents an incoming chat message request
type ChatRequest struct {
	Message         string                 `json:"message" binding:"required"`
	SessionID       string                 `json:"sessionId,omitempty"`
	UserID          string                 `json:"userId,omitempty"`
	Context         map[string]interface{} `json:"context,omitempty"`
	EnhancementMode string                 `json:"enhancementMode,omitempty"`
}

// ChatResponse represents a chat response
type ChatResponse struct {
	Success  bool                   `json:"success"`
	Response string                 `json:"response"`
	Type     string                 `json:"type"`
	Metadata ChatResponseMetadata   `json:"metadata"`
	Data     map[string]interface{} `json:"data,omitempty"`
}

// ChatResponseMetadata contains response metadata
type ChatResponseMetadata struct {
	AIProvider               string                 `json:"aiProvider"`
	ProcessingTime           float64                `json:"processingTime"`
	PerformanceOptimized     bool                   `json:"performanceOptimized"`
	SessionID                string                 `json:"sessionId"`
	OriginalSessionID        string                 `json:"originalSessionId,omitempty"`
	AuthenticationConsistent bool                   `json:"authenticationConsistent"`
	UserID                   string                 `json:"userId,omitempty"`
	GuestUUID                string                 `json:"guestUuid,omitempty"`
	IsAuthenticated          bool                   `json:"isAuthenticated"`
	Confidence               float64                `json:"confidence"`
	Model                    string                 `json:"model"`
	RequestID                string                 `json:"requestId"`
	Timestamp                time.Time              `json:"timestamp"`
	APIVersion               string                 `json:"apiVersion"`
	Features                 map[string]bool        `json:"features"`
	Performance              map[string]interface{} `json:"performance,omitempty"`
}

// SessionChatRequest represents a session-aware chat request
type SessionChatRequest struct {
	Message   string                 `json:"message" binding:"required"`
	SessionID string                 `json:"sessionId,omitempty"`
	UserID    string                 `json:"userId,omitempty"`
	Context   map[string]interface{} `json:"context,omitempty"`
}

// SessionChatResponse represents a session-aware chat response
type SessionChatResponse struct {
	Success  bool                    `json:"success"`
	Data     SessionChatResponseData `json:"data"`
	Metadata types.Metadata          `json:"metadata"`
}

// SessionChatResponseData contains session-aware response data
type SessionChatResponseData struct {
	Message         string                 `json:"message"`
	Type            string                 `json:"type"`
	Confidence      float64                `json:"confidence"`
	ProcessingTime  float64                `json:"processingTime"`
	Model           string                 `json:"model"`
	SessionMetadata SessionMetadata        `json:"sessionMetadata"`
	Recommendations []string               `json:"recommendations,omitempty"`
	Performance     map[string]interface{} `json:"performance"`
}

// SessionMetadata contains session-specific metadata
type SessionMetadata struct {
	SessionID          string `json:"sessionId"`
	SessionType        string `json:"sessionType"`
	ConversationTurn   int    `json:"conversationTurn"`
	UserExpertiseLevel string `json:"userExpertiseLevel"`
	ConversationStage  string `json:"conversationStage"`
	CacheLayerUsed     string `json:"cacheLayerUsed"`
	SessionContinuity  bool   `json:"sessionContinuity"`
	DeviceType         string `json:"deviceType"`
	CulturalContext    string `json:"culturalContext"`
}

// NewService creates a new chat service
func NewService(db *database.Service, cache *cache.Service, auth *auth.Service) *Service {
	service := &Service{
		db:        db,
		cache:     cache,
		auth:      auth,
		aiService: NewAIService(),
		sessions:  NewSessionManager(cache, db),
		isHealthy: true,
	}

	logrus.Info("✅ Chat service initialized")
	return service
}

// ProcessChat processes a chat message with full compatibility
func (s *Service) ProcessChat(ctx context.Context, req *ChatRequest, authContext *auth.AuthContext) (*ChatResponse, error) {
	startTime := time.Now()
	requestID := fmt.Sprintf("req_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"message":    req.Message[:min(50, len(req.Message))] + "...",
		"user_id":    authContext.UserID,
		"session_id": req.SessionID,
	}).Info("💬 Processing chat message")

	// Validate message
	if req.Message == "" {
		return nil, fmt.Errorf("message cannot be empty")
	}

	// Generate or use existing session ID
	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = s.generateSessionID(authContext.UserID)
	}

	// Process with AI service
	aiResponse, err := s.aiService.ProcessQuery(ctx, &AIRequest{
		Query:           req.Message,
		UserID:          authContext.UserID,
		SessionID:       sessionID,
		Context:         req.Context,
		EnhancementMode: req.EnhancementMode,
	})
	if err != nil {
		return nil, fmt.Errorf("AI processing failed: %w", err)
	}

	// Store message in database (if available)
	if s.db != nil && s.db.IsHealthy() {
		go s.storeMessage(ctx, sessionID, authContext.UserID, req.Message, aiResponse.Content)
	}

	// Cache response for performance
	if s.cache != nil && s.cache.IsHealthy() {
		go s.cacheResponse(req.Message, aiResponse, req.Context)
	}

	processingTime := time.Since(startTime).Seconds() * 1000 // Convert to milliseconds

	response := &ChatResponse{
		Success:  true,
		Response: aiResponse.Content,
		Type:     aiResponse.Type,
		Metadata: ChatResponseMetadata{
			AIProvider:               "selly-go-backend",
			ProcessingTime:           processingTime,
			PerformanceOptimized:     true,
			SessionID:                sessionID,
			OriginalSessionID:        req.SessionID,
			AuthenticationConsistent: true,
			UserID:                   authContext.UserID,
			IsAuthenticated:          authContext.UserID != "",
			Confidence:               aiResponse.Confidence,
			Model:                    aiResponse.Model,
			RequestID:                requestID,
			Timestamp:                time.Now(),
			APIVersion:               "go-2.0",
			Features: map[string]bool{
				"sessionManagement":       true,
				"documentPatternCaching":  true,
				"contextualPersona":       true,
				"indonesianOptimization":  true,
				"multiLevelCaching":       true,
				"performanceOptimization": true,
			},
			Performance: map[string]interface{}{
				"cacheHit":          aiResponse.CacheHit,
				"responseOptimized": aiResponse.Confidence > 0.8,
				"processingTimeMs":  processingTime,
			},
		},
	}

	logrus.WithFields(logrus.Fields{
		"request_id":      requestID,
		"processing_time": processingTime,
		"confidence":      aiResponse.Confidence,
		"cache_hit":       aiResponse.CacheHit,
	}).Info("✅ Chat message processed successfully")

	return response, nil
}

// ProcessSessionChat processes a session-aware chat message
func (s *Service) ProcessSessionChat(ctx context.Context, req *SessionChatRequest, authContext *auth.AuthContext) (*SessionChatResponse, error) {
	startTime := time.Now()
	requestID := fmt.Sprintf("req_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"message":    req.Message[:min(50, len(req.Message))] + "...",
		"user_id":    authContext.UserID,
		"session_id": req.SessionID,
	}).Info("💬 Processing session-aware chat message")

	// Get or create session
	session, err := s.sessions.GetOrCreateSession(ctx, req.SessionID, authContext.UserID, req.Context)
	if err != nil {
		return nil, fmt.Errorf("session management failed: %w", err)
	}

	// Process with session context
	aiResponse, err := s.aiService.ProcessSessionQuery(ctx, &SessionAIRequest{
		Query:   req.Message,
		Session: session,
		Context: req.Context,
		UserID:  authContext.UserID,
	})
	if err != nil {
		return nil, fmt.Errorf("session AI processing failed: %w", err)
	}

	// Update session with new conversation turn
	err = s.sessions.AddConversationTurn(ctx, session.ID, req.Message, aiResponse.Content)
	if err != nil {
		logrus.WithError(err).Warn("Failed to update session conversation history")
	}

	processingTime := time.Since(startTime).Seconds() * 1000

	response := &SessionChatResponse{
		Success: true,
		Data: SessionChatResponseData{
			Message:        aiResponse.Content,
			Type:           aiResponse.Type,
			Confidence:     aiResponse.Confidence,
			ProcessingTime: processingTime,
			Model:          aiResponse.Model,
			SessionMetadata: SessionMetadata{
				SessionID:          session.ID,
				SessionType:        session.Type,
				ConversationTurn:   len(session.ConversationHistory) + 1,
				UserExpertiseLevel: session.UserExpertiseLevel,
				ConversationStage:  session.ConversationStage,
				CacheLayerUsed:     aiResponse.CacheLayer,
				SessionContinuity:  len(session.ConversationHistory) > 0,
				DeviceType:         session.DeviceType,
				CulturalContext:    session.CulturalContext,
			},
			Recommendations: aiResponse.Recommendations,
			Performance: map[string]interface{}{
				"cacheHit":          aiResponse.CacheHit,
				"cacheLayer":        aiResponse.CacheLayer,
				"responseOptimized": aiResponse.Confidence > 0.8,
				"sessionOptimized":  len(session.ConversationHistory) > 0,
			},
		},
		Metadata: types.Metadata{
			ProcessingTime: int64(processingTime),
			Timestamp:      time.Now(),
			Version:        "go-2.0",
			Provider:       "selly-go-backend",
			RequestID:      requestID,
		},
	}

	logrus.WithFields(logrus.Fields{
		"request_id":        requestID,
		"processing_time":   processingTime,
		"session_id":        session.ID,
		"conversation_turn": len(session.ConversationHistory),
	}).Info("✅ Session-aware chat message processed successfully")

	return response, nil
}

// Helper functions

func (s *Service) generateSessionID(userID string) string {
	if userID != "" {
		return fmt.Sprintf("session_%s_%d", userID[:8], time.Now().UnixNano())
	}
	return fmt.Sprintf("guest_session_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])
}

func (s *Service) storeMessage(ctx context.Context, sessionID, userID, message, response string) {
	// Implementation for storing messages in database
	// This would integrate with Supabase to store conversation history
	logrus.WithFields(logrus.Fields{
		"session_id": sessionID,
		"user_id":    userID,
	}).Debug("Storing message in database")
}

func (s *Service) cacheResponse(message string, response *AIResponse, context map[string]interface{}) {
	// Implementation for caching responses
	cacheKey := fmt.Sprintf("chat_response_%x", message)
	cacheData := map[string]interface{}{
		"response":   response.Content,
		"confidence": response.Confidence,
		"model":      response.Model,
		"timestamp":  time.Now(),
	}

	s.cache.Set(cacheKey, cacheData, 5*time.Minute)
	logrus.Debug("Response cached for future requests")
}

// GetSession retrieves a session by ID
func (s *Service) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	return s.sessions.GetSession(ctx, sessionID)
}

// IsHealthy returns the service health status
func (s *Service) IsHealthy() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isHealthy
}

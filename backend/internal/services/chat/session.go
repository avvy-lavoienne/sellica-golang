package chat

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
)

// SessionManager manages chat sessions
type SessionManager struct {
	cache     *cache.Service
	db        *database.Service
	sessions  map[string]*Session
	mu        sync.RWMutex
}

// Session represents a chat session
type Session struct {
	ID                  string                 `json:"id"`
	Type                string                 `json:"type"`
	UserID              string                 `json:"userId"`
	CreatedAt           time.Time              `json:"createdAt"`
	LastAccessedAt      time.Time              `json:"lastAccessedAt"`
	ConversationHistory []ConversationTurn     `json:"conversationHistory"`
	UserPreferences     map[string]interface{} `json:"userPreferences"`
	UserExpertiseLevel  string                 `json:"userExpertiseLevel"`
	ConversationStage   string                 `json:"conversationStage"`
	DeviceType          string                 `json:"deviceType"`
	CulturalContext     string                 `json:"culturalContext"`
	Analytics           SessionAnalytics       `json:"analytics"`
}

// ConversationTurn represents a single conversation exchange
type ConversationTurn struct {
	ID        string                 `json:"id"`
	Query     string                 `json:"query"`
	Response  string                 `json:"response"`
	Timestamp time.Time              `json:"timestamp"`
	Metadata  map[string]interface{} `json:"metadata"`
}

// SessionAnalytics contains session analytics data
type SessionAnalytics struct {
	TotalQueries        int     `json:"totalQueries"`
	AverageResponseTime float64 `json:"averageResponseTime"`
	CacheHitRate        float64 `json:"cacheHitRate"`
	MostUsedServices    []string `json:"mostUsedServices"`
}

// NewSessionManager creates a new session manager
func NewSessionManager(cache *cache.Service, db *database.Service) *SessionManager {
	return &SessionManager{
		cache:    cache,
		db:       db,
		sessions: make(map[string]*Session),
	}
}

// GetOrCreateSession gets an existing session or creates a new one
func (sm *SessionManager) GetOrCreateSession(ctx context.Context, sessionID, userID string, context map[string]interface{}) (*Session, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	// If sessionID is provided, try to get existing session
	if sessionID != "" {
		if session, exists := sm.sessions[sessionID]; exists {
			session.LastAccessedAt = time.Now()
			return session, nil
		}

		// Try to load from cache
		if sm.cache != nil {
			if cachedSession, err := sm.loadSessionFromCache(sessionID); err == nil {
				sm.sessions[sessionID] = cachedSession
				return cachedSession, nil
			}
		}
	}

	// Create new session
	newSessionID := sessionID
	if newSessionID == "" {
		newSessionID = sm.generateSessionID(userID)
	}

	session := &Session{
		ID:                  newSessionID,
		Type:                sm.determineSessionType(userID, context),
		UserID:              userID,
		CreatedAt:           time.Now(),
		LastAccessedAt:      time.Now(),
		ConversationHistory: []ConversationTurn{},
		UserPreferences:     make(map[string]interface{}),
		UserExpertiseLevel:  "intermediate",
		ConversationStage:   "initial",
		DeviceType:          sm.extractDeviceType(context),
		CulturalContext:     "regional_indonesia",
		Analytics: SessionAnalytics{
			TotalQueries:        0,
			AverageResponseTime: 0,
			CacheHitRate:        0,
			MostUsedServices:    []string{},
		},
	}

	// Store in memory and cache
	sm.sessions[newSessionID] = session
	if sm.cache != nil {
		go sm.saveSessionToCache(session)
	}

	logrus.WithFields(logrus.Fields{
		"session_id":   newSessionID,
		"user_id":      userID,
		"session_type": session.Type,
	}).Info("📝 New chat session created")

	return session, nil
}

// AddConversationTurn adds a new conversation turn to the session
func (sm *SessionManager) AddConversationTurn(ctx context.Context, sessionID, query, response string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	session, exists := sm.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session not found: %s", sessionID)
	}

	turn := ConversationTurn{
		ID:        uuid.New().String(),
		Query:     query,
		Response:  response,
		Timestamp: time.Now(),
		Metadata: map[string]interface{}{
			"confidence": 0.9,
			"model":      "selly-go-backend",
		},
	}

	session.ConversationHistory = append(session.ConversationHistory, turn)
	session.LastAccessedAt = time.Now()
	session.Analytics.TotalQueries++

	// Update conversation stage based on history length
	if len(session.ConversationHistory) > 5 {
		session.ConversationStage = "advanced"
	} else if len(session.ConversationHistory) > 2 {
		session.ConversationStage = "intermediate"
	}

	// Save to cache
	if sm.cache != nil {
		go sm.saveSessionToCache(session)
	}

	return nil
}

// GetSession retrieves a session by ID
func (sm *SessionManager) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if session, exists := sm.sessions[sessionID]; exists {
		return session, nil
	}

	// Try to load from cache
	if sm.cache != nil {
		if cachedSession, err := sm.loadSessionFromCache(sessionID); err == nil {
			sm.sessions[sessionID] = cachedSession
			return cachedSession, nil
		}
	}

	return nil, fmt.Errorf("session not found: %s", sessionID)
}

// Helper methods

func (sm *SessionManager) generateSessionID(userID string) string {
	if userID != "" {
		return fmt.Sprintf("session_%s_%d", userID[:min(8, len(userID))], time.Now().UnixNano())
	}
	return fmt.Sprintf("guest_session_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])
}

func (sm *SessionManager) determineSessionType(userID string, context map[string]interface{}) string {
	if userID == "" {
		return "guest"
	}

	if adminContext, ok := context["administrativeContext"]; ok && adminContext != nil {
		return "government"
	}

	return "authenticated"
}

func (sm *SessionManager) extractDeviceType(context map[string]interface{}) string {
	if deviceType, ok := context["deviceType"].(string); ok {
		return deviceType
	}
	return "desktop"
}

func (sm *SessionManager) saveSessionToCache(session *Session) {
	if sm.cache == nil {
		return
	}

	cacheKey := fmt.Sprintf("session_%s", session.ID)
	err := sm.cache.Set(cacheKey, session, 24*time.Hour)
	if err != nil {
		logrus.WithError(err).WithField("session_id", session.ID).Warn("Failed to save session to cache")
	}
}

func (sm *SessionManager) loadSessionFromCache(sessionID string) (*Session, error) {
	if sm.cache == nil {
		return nil, fmt.Errorf("cache not available")
	}

	cacheKey := fmt.Sprintf("session_%s", sessionID)
	data, err := sm.cache.Get(cacheKey)
	if err != nil {
		return nil, err
	}

	session, ok := data.(*Session)
	if !ok {
		return nil, fmt.Errorf("invalid session data in cache")
	}

	return session, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

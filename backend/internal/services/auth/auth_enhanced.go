package auth

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// SessionConfig holds configuration for session management
type SessionConfig struct {
	// TokenLifetime is the lifetime of access tokens (default: 1 hour)
	TokenLifetime time.Duration
	// RefreshTokenLifetime is the lifetime of refresh tokens (default: 7 days)
	RefreshTokenLifetime time.Duration
	// RefreshThreshold is when to auto-refresh (at 75% of token lifetime)
	RefreshThreshold float64
	// SessionIdleTimeout is maximum idle time before session expires (default: 4 hours)
	SessionIdleTimeout time.Duration
	// MaxConcurrentSessions is max active sessions per user (default: 5)
	MaxConcurrentSessions int
}

// RefreshToken represents a token used to obtain new access tokens
type RefreshToken struct {
	ID        string
	UserID    string
	Token     string
	ExpiresAt time.Time
	CreatedAt time.Time
	LastUsedAt time.Time
	IssuedIP   string
	UserAgent  string
	Active    bool
}

// Session represents an authenticated user session
type Session struct {
	ID            string
	UserID        string
	AccessToken   string
	RefreshToken  *RefreshToken
	CreatedAt     time.Time
	LastActivityAt time.Time
	ExpiresAt     time.Time
	IPAddress     string
	UserAgent     string
	Metadata      map[string]interface{}
}

// SessionManager handles session lifecycle and auto-refresh
type SessionManager struct {
	service *Service
	config  SessionConfig
	
	// sessions stores active sessions: sessionID -> Session
	sessions map[string]*Session
	// userSessions tracks sessions per user: userID -> []sessionID
	userSessions map[string][]string
	// refreshTokens stores refresh tokens for validation: tokenString -> RefreshToken
	refreshTokens map[string]*RefreshToken
	
	mu sync.RWMutex
	
	// autoRefreshTicker for periodic token refresh (background goroutine)
	autoRefreshTicker *time.Ticker
	stopAutoRefresh   chan bool
}

// NewSessionConfig creates a default session configuration
func NewSessionConfig() SessionConfig {
	return SessionConfig{
		TokenLifetime:         1 * time.Hour,
		RefreshTokenLifetime:  7 * 24 * time.Hour, // 7 days
		RefreshThreshold:      0.75, // Refresh at 75% of lifetime
		SessionIdleTimeout:    4 * time.Hour,
		MaxConcurrentSessions: 5,
	}
}

// NewSessionManager creates a new session manager
func NewSessionManager(service *Service, config SessionConfig) *SessionManager {
	if config.TokenLifetime == 0 {
		config = NewSessionConfig()
	}

	sm := &SessionManager{
		service:       service,
		config:        config,
		sessions:      make(map[string]*Session),
		userSessions:  make(map[string][]string),
		refreshTokens: make(map[string]*RefreshToken),
		stopAutoRefresh: make(chan bool),
	}

	// Start auto-refresh background goroutine (checks every 5 minutes)
	sm.autoRefreshTicker = time.NewTicker(5 * time.Minute)
	go sm.runAutoRefresh()

	logrus.WithFields(logrus.Fields{
		"token_lifetime":   config.TokenLifetime,
		"refresh_lifetime": config.RefreshTokenLifetime,
		"refresh_threshold": config.RefreshThreshold,
		"max_sessions":     config.MaxConcurrentSessions,
	}).Info("✅ Session manager initialized with auto-refresh support")

	return sm
}

// CreateSession creates a new authenticated session
func (sm *SessionManager) CreateSession(ctx context.Context, userID, email, role string, ipAddress, userAgent string) (*Session, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	// Check max concurrent sessions
	userSessionIDs := sm.userSessions[userID]
	if len(userSessionIDs) >= sm.config.MaxConcurrentSessions {
		// Remove oldest session to make room
		if len(userSessionIDs) > 0 {
			oldestSessionID := userSessionIDs[0]
			delete(sm.sessions, oldestSessionID)
			userSessionIDs = userSessionIDs[1:]
			logrus.WithFields(logrus.Fields{
				"user_id": userID,
				"session_id": oldestSessionID,
			}).Warn("⚠️  Removed oldest session to stay within max concurrent limit")
		}
	}

	// Generate access token with extended TTL for auto-refresh
	accessToken, err := sm.service.GenerateTokenWithMetadata(
		userID, email, role,
		nil,
		map[string]interface{}{
			"session_type": "access",
			"session_id":   uuid.New().String(),
			"ip_address":   ipAddress,
		},
	)
	if err != nil {
		logrus.WithError(err).Error("Failed to generate access token")
		return nil, fmt.Errorf("failed to create access token: %w", err)
	}

	// Generate refresh token (longer lifetime)
	refreshTokenString := uuid.New().String()
	refreshToken := &RefreshToken{
		ID:         uuid.New().String(),
		UserID:     userID,
		Token:      refreshTokenString,
		ExpiresAt:  time.Now().Add(sm.config.RefreshTokenLifetime),
		CreatedAt:  time.Now(),
		LastUsedAt: time.Now(),
		IssuedIP:   ipAddress,
		UserAgent:  userAgent,
		Active:     true,
	}

	// Create session
	sessionID := uuid.New().String()
	session := &Session{
		ID:            sessionID,
		UserID:        userID,
		AccessToken:   accessToken,
		RefreshToken:  refreshToken,
		CreatedAt:     time.Now(),
		LastActivityAt: time.Now(),
		ExpiresAt:     time.Now().Add(sm.config.TokenLifetime),
		IPAddress:     ipAddress,
		UserAgent:     userAgent,
		Metadata: map[string]interface{}{
			"created_via": "auth_service",
			"login_method": "password",
		},
	}

	// Store session
	sm.sessions[sessionID] = session
	sm.refreshTokens[refreshTokenString] = refreshToken
	sm.userSessions[userID] = append(sm.userSessions[userID], sessionID)

	logrus.WithFields(logrus.Fields{
		"user_id":     userID,
		"session_id":  sessionID,
		"ip_address":  ipAddress,
		"expires_at":  session.ExpiresAt,
	}).Info("✅ New session created with auto-refresh enabled")

	return session, nil
}

// GetSession retrieves an active session
func (sm *SessionManager) GetSession(sessionID string) (*Session, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	session, exists := sm.sessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("session not found")
	}

	// Check if session is still valid
	if time.Now().After(session.ExpiresAt) {
		return nil, fmt.Errorf("session has expired")
	}

	// Check for idle timeout
	idleTime := time.Since(session.LastActivityAt)
	if idleTime > sm.config.SessionIdleTimeout {
		return nil, fmt.Errorf("session has been idle for %v", idleTime)
	}

	return session, nil
}

// UpdateSessionActivity updates the last activity timestamp
func (sm *SessionManager) UpdateSessionActivity(sessionID string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	session, exists := sm.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session not found")
	}

	session.LastActivityAt = time.Now()
	return nil
}

// RefreshAccessToken generates a new access token using a refresh token
func (sm *SessionManager) RefreshAccessToken(ctx context.Context, sessionID string, refreshTokenString string) (string, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	session, exists := sm.sessions[sessionID]
	if !exists {
		return "", fmt.Errorf("session not found")
	}

	// Verify refresh token
	refreshToken, exists := sm.refreshTokens[refreshTokenString]
	if !exists {
		logrus.WithField("session_id", sessionID).Warn("⚠️  Invalid refresh token used")
		return "", fmt.Errorf("invalid refresh token")
	}

	// Check if refresh token is still valid
	if time.Now().After(refreshToken.ExpiresAt) {
		logrus.WithField("session_id", sessionID).Warn("⚠️  Refresh token has expired")
		return "", fmt.Errorf("refresh token has expired")
	}

	// Check if refresh token is active
	if !refreshToken.Active {
		logrus.WithField("session_id", sessionID).Warn("⚠️  Refresh token is inactive")
		return "", fmt.Errorf("refresh token is inactive")
	}

	// Validate refresh token belongs to session's user
	if refreshToken.UserID != session.UserID {
		logrus.WithFields(logrus.Fields{
			"session_id": sessionID,
			"token_user": refreshToken.UserID,
			"session_user": session.UserID,
		}).Error("❌ Refresh token user mismatch - potential security issue")
		return "", fmt.Errorf("refresh token does not match session user")
	}

	// Parse existing token to get user info
	claims, err := sm.service.ValidateToken(session.AccessToken)
	if err != nil && err.Error() != "token has expired" {
		// If token is invalid for reasons other than expiration, fail
		return "", fmt.Errorf("failed to extract user info from current token: %w", err)
	}

	// Generate new access token
	newAccessToken, err := sm.service.GenerateTokenWithMetadata(
		session.UserID,
		claims.Email,
		claims.Role,
		claims.Permissions,
		map[string]interface{}{
			"session_type": "access",
			"session_id":   sessionID,
			"ip_address":   session.IPAddress,
			"refreshed_at": time.Now(),
		},
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate new access token: %w", err)
	}

	// Update session
	session.AccessToken = newAccessToken
	session.LastActivityAt = time.Now()
	session.ExpiresAt = time.Now().Add(sm.config.TokenLifetime)

	// Update refresh token's last used time
	refreshToken.LastUsedAt = time.Now()

	logrus.WithFields(logrus.Fields{
		"user_id":    session.UserID,
		"session_id": sessionID,
		"new_expiry": session.ExpiresAt,
	}).Info("✅ Access token refreshed successfully")

	return newAccessToken, nil
}

// RevokeRefreshToken revokes a refresh token (used for logout)
func (sm *SessionManager) RevokeRefreshToken(refreshTokenString string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	refreshToken, exists := sm.refreshTokens[refreshTokenString]
	if !exists {
		return fmt.Errorf("refresh token not found")
	}

	refreshToken.Active = false
	logrus.WithField("token_id", refreshToken.ID).Info("🔒 Refresh token revoked")

	return nil
}

// DestroySession terminates a session and revokes its tokens
func (sm *SessionManager) DestroySession(sessionID string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	session, exists := sm.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session not found")
	}

	// Revoke refresh token
	if session.RefreshToken != nil {
		session.RefreshToken.Active = false
	}

	// Remove session
	delete(sm.sessions, sessionID)

	// Remove from user sessions
	userSessionIDs := sm.userSessions[session.UserID]
	for i, id := range userSessionIDs {
		if id == sessionID {
			sm.userSessions[session.UserID] = append(userSessionIDs[:i], userSessionIDs[i+1:]...)
			break
		}
	}

	logrus.WithFields(logrus.Fields{
		"user_id":    session.UserID,
		"session_id": sessionID,
	}).Info("✅ Session destroyed and tokens revoked")

	return nil
}

// DestroyAllUserSessions terminates all sessions for a user (useful for password reset)
func (sm *SessionManager) DestroyAllUserSessions(userID string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	userSessionIDs, exists := sm.userSessions[userID]
	if !exists || len(userSessionIDs) == 0 {
		return fmt.Errorf("no sessions found for user")
	}

	// Revoke all refresh tokens and remove sessions
	for _, sessionID := range userSessionIDs {
		if session, exists := sm.sessions[sessionID]; exists {
			if session.RefreshToken != nil {
				session.RefreshToken.Active = false
			}
			delete(sm.sessions, sessionID)
		}
	}

	// Clear user sessions
	delete(sm.userSessions, userID)

	logrus.WithFields(logrus.Fields{
		"user_id": userID,
		"count":   len(userSessionIDs),
	}).Info("✅ All user sessions destroyed")

	return nil
}

// ShouldAutoRefresh checks if a token should be auto-refreshed
func (sm *SessionManager) ShouldAutoRefresh(session *Session) bool {
	if session.ExpiresAt.IsZero() {
		return false
	}

	// Calculate refresh point (at RefreshThreshold of token lifetime)
	tokenLifetime := session.ExpiresAt.Sub(session.CreatedAt)
	refreshTime := session.CreatedAt.Add(time.Duration(float64(tokenLifetime) * sm.config.RefreshThreshold))

	// Should refresh if we've reached refresh point and haven't expired
	return time.Now().After(refreshTime) && time.Now().Before(session.ExpiresAt)
}

// runAutoRefresh background goroutine that periodically refreshes tokens
func (sm *SessionManager) runAutoRefresh() {
	defer sm.autoRefreshTicker.Stop()

	for {
		select {
		case <-sm.autoRefreshTicker.C:
			sm.performAutoRefresh()

		case <-sm.stopAutoRefresh:
			logrus.Info("🛑 Auto-refresh background goroutine stopped")
			return
		}
	}
}

// performAutoRefresh checks all sessions and refreshes tokens as needed
func (sm *SessionManager) performAutoRefresh() {
	sm.mu.RLock()
	sessionsToRefresh := make([]*Session, 0)

	// Find sessions that need refresh
	for _, session := range sm.sessions {
		if sm.ShouldAutoRefresh(session) {
			sessionsToRefresh = append(sessionsToRefresh, session)
		}
	}
	sm.mu.RUnlock()

	// Perform refresh outside of lock to avoid deadlocks
	refreshedCount := 0
	for _, session := range sessionsToRefresh {
		if session.RefreshToken != nil {
			_, err := sm.RefreshAccessToken(context.Background(), session.ID, session.RefreshToken.Token)
			if err == nil {
				refreshedCount++
				logrus.WithField("session_id", session.ID).Debug("🔄 Token auto-refreshed in background")
			} else {
				logrus.WithFields(logrus.Fields{
					"session_id": session.ID,
					"error":      err.Error(),
				}).Warn("⚠️  Failed to auto-refresh token")
			}
		}
	}

	if refreshedCount > 0 {
		logrus.WithField("count", refreshedCount).Debug("✅ Auto-refresh cycle complete")
	}
}

// GetSessionStats returns statistics about active sessions
func (sm *SessionManager) GetSessionStats() map[string]interface{} {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	totalSessions := len(sm.sessions)
	totalUsers := len(sm.userSessions)
	activeRefreshTokens := 0

	for _, rt := range sm.refreshTokens {
		if rt.Active && time.Now().Before(rt.ExpiresAt) {
			activeRefreshTokens++
		}
	}

	return map[string]interface{}{
		"total_sessions":         totalSessions,
		"total_users":            totalUsers,
		"active_refresh_tokens":  activeRefreshTokens,
		"token_lifetime":         sm.config.TokenLifetime.String(),
		"refresh_lifetime":       sm.config.RefreshTokenLifetime.String(),
		"session_idle_timeout":   sm.config.SessionIdleTimeout.String(),
		"max_concurrent":         sm.config.MaxConcurrentSessions,
		"timestamp":              time.Now().UTC(),
	}
}

// ListUserSessions returns all active sessions for a user
func (sm *SessionManager) ListUserSessions(userID string) ([]*Session, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	sessionIDs, exists := sm.userSessions[userID]
	if !exists || len(sessionIDs) == 0 {
		return []*Session{}, nil
	}

	sessions := make([]*Session, 0)
	for _, sessionID := range sessionIDs {
		if session, exists := sm.sessions[sessionID]; exists {
			// Only include valid sessions
			if time.Now().Before(session.ExpiresAt) {
				sessions = append(sessions, session)
			}
		}
	}

	return sessions, nil
}

// StopAutoRefresh stops the auto-refresh background goroutine
func (sm *SessionManager) StopAutoRefresh() {
	select {
	case sm.stopAutoRefresh <- true:
		logrus.Info("🛑 Auto-refresh stopped")
	default:
		// Channel already closed or full, safe to ignore
	}
}

// CleanupExpiredSessions removes expired sessions and tokens (cleanup routine)
func (sm *SessionManager) CleanupExpiredSessions() int {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	now := time.Now()
	removedCount := 0

	// Remove expired sessions
	for sessionID, session := range sm.sessions {
		if now.After(session.ExpiresAt) {
			delete(sm.sessions, sessionID)
			removedCount++
		}
	}

	// Remove expired refresh tokens
	for tokenStr, rt := range sm.refreshTokens {
		if now.After(rt.ExpiresAt) {
			delete(sm.refreshTokens, tokenStr)
		}
	}

	if removedCount > 0 {
		logrus.WithField("count", removedCount).Info("🧹 Cleaned up expired sessions")
	}

	return removedCount
}

// EnableAutoRefresh enables the auto-refresh feature (starts background goroutine if stopped)
func (sm *SessionManager) EnableAutoRefresh() {
	if sm.autoRefreshTicker == nil {
		sm.autoRefreshTicker = time.NewTicker(5 * time.Minute)
		go sm.runAutoRefresh()
		logrus.Info("✅ Auto-refresh feature enabled")
	}
}

// IsHealthy checks the health of the session manager
func (sm *SessionManager) IsHealthy() bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	return sm.service != nil && sm.autoRefreshTicker != nil
}

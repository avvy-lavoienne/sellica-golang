package unit

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/auth"
)

// TestSessionConfigDefaults verifies default session configuration
func TestSessionConfigDefaults(t *testing.T) {
	config := auth.NewSessionConfig()

	assert.Equal(t, 1*time.Hour, config.TokenLifetime)
	assert.Equal(t, 7*24*time.Hour, config.RefreshTokenLifetime)
	assert.Equal(t, 0.75, config.RefreshThreshold)
	assert.Equal(t, 4*time.Hour, config.SessionIdleTimeout)
	assert.Equal(t, 5, config.MaxConcurrentSessions)
}

// TestSessionManager_CreateSession verifies session creation
func TestSessionManager_CreateSession(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)

	require.NoError(t, err)
	assert.NotNil(t, session)
	assert.Equal(t, "user-123", session.UserID)
	assert.Equal(t, "user-123", session.RefreshToken.UserID)
	assert.NotEmpty(t, session.AccessToken)
	assert.NotEmpty(t, session.ID)
	assert.NotNil(t, session.RefreshToken)
	assert.True(t, session.RefreshToken.Active)
}

// TestSessionManager_GetSession verifies session retrieval
func TestSessionManager_GetSession(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	// Create session
	created, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	// Retrieve session
	retrieved, err := sm.GetSession(created.ID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, retrieved.ID)
	assert.Equal(t, created.UserID, retrieved.UserID)
}

// TestSessionManager_GetSession_NotFound verifies session not found error
func TestSessionManager_GetSession_NotFound(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	_, err := sm.GetSession("nonexistent-session")
	assert.Error(t, err)
	assert.Equal(t, "session not found", err.Error())
}

// TestSessionManager_UpdateSessionActivity updates last activity
func TestSessionManager_UpdateSessionActivity(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	oldActivityTime := session.LastActivityAt
	time.Sleep(10 * time.Millisecond) // Small delay

	err = sm.UpdateSessionActivity(session.ID)
	require.NoError(t, err)

	updated, err := sm.GetSession(session.ID)
	require.NoError(t, err)
	assert.True(t, updated.LastActivityAt.After(oldActivityTime))
}

// TestSessionManager_RefreshAccessToken refreshes token successfully
func TestSessionManager_RefreshAccessToken(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	oldToken := session.AccessToken
	oldExpiry := session.ExpiresAt

	// Refresh token
	newToken, err := sm.RefreshAccessToken(
		context.Background(),
		session.ID,
		session.RefreshToken.Token,
	)

	require.NoError(t, err)
	assert.NotEmpty(t, newToken)
	assert.NotEqual(t, oldToken, newToken) // New token generated

	// Verify session was updated
	updated, err := sm.GetSession(session.ID)
	require.NoError(t, err)
	// Expiry should be extended (new expiry >= old expiry)
	assert.True(t, updated.ExpiresAt.After(oldExpiry) || updated.ExpiresAt.Equal(oldExpiry))
}

// TestSessionManager_RefreshAccessToken_InvalidToken rejects invalid refresh token
func TestSessionManager_RefreshAccessToken_InvalidToken(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	_, err = sm.RefreshAccessToken(
		context.Background(),
		session.ID,
		"invalid-refresh-token",
	)

	assert.Error(t, err)
	assert.Equal(t, "invalid refresh token", err.Error())
}

// TestSessionManager_RevokeRefreshToken revokes a token
func TestSessionManager_RevokeRefreshToken(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	// Revoke token
	err = sm.RevokeRefreshToken(session.RefreshToken.Token)
	require.NoError(t, err)

	// Try to refresh with revoked token
	_, err = sm.RefreshAccessToken(
		context.Background(),
		session.ID,
		session.RefreshToken.Token,
	)

	assert.Error(t, err)
	assert.Equal(t, "refresh token is inactive", err.Error())
}

// TestSessionManager_DestroySession destroys a session
func TestSessionManager_DestroySession(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	// Destroy session
	err = sm.DestroySession(session.ID)
	require.NoError(t, err)

	// Try to get destroyed session
	_, err = sm.GetSession(session.ID)
	assert.Error(t, err)
}

// TestSessionManager_DestroyAllUserSessions destroys all user sessions
func TestSessionManager_DestroyAllUserSessions(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	// Create multiple sessions for same user
	session1, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	session2, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.2",
		"Chrome/5.0",
	)
	require.NoError(t, err)

	// Destroy all sessions
	err = sm.DestroyAllUserSessions("user-123")
	require.NoError(t, err)

	// Both sessions should be gone
	_, err = sm.GetSession(session1.ID)
	assert.Error(t, err)

	_, err = sm.GetSession(session2.ID)
	assert.Error(t, err)
}

// TestSessionManager_ShouldAutoRefresh determines refresh timing
func TestSessionManager_ShouldAutoRefresh(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	config.TokenLifetime = 100 * time.Millisecond // Short lifetime for testing
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	// Immediately after creation, should not need refresh
	assert.False(t, sm.ShouldAutoRefresh(session))

	// Wait for refresh threshold (75ms into 100ms lifetime)
	time.Sleep(75 * time.Millisecond)
	assert.True(t, sm.ShouldAutoRefresh(session))
}

// TestSessionManager_MaxConcurrentSessions enforces limit
func TestSessionManager_MaxConcurrentSessions(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	config.MaxConcurrentSessions = 3
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	// Create sessions up to limit
	sessionIDs := make([]string, 0)
	for i := 0; i < 3; i++ {
		session, err := sm.CreateSession(
			context.Background(),
			"user-123",
			"user@example.com",
			"user",
			"192.168.1.1",
			"Mozilla/5.0",
		)
		require.NoError(t, err)
		sessionIDs = append(sessionIDs, session.ID)
	}

	// Fourth session should replace first (oldest)
	session4, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	// First session should be gone
	_, err = sm.GetSession(sessionIDs[0])
	assert.Error(t, err)

	// Others should still exist
	_, err = sm.GetSession(sessionIDs[1])
	assert.NoError(t, err)

	_, err = sm.GetSession(sessionIDs[2])
	assert.NoError(t, err)

	_, err = sm.GetSession(session4.ID)
	assert.NoError(t, err)
}

// TestSessionManager_ListUserSessions lists all user sessions
func TestSessionManager_ListUserSessions(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	// Create multiple sessions
	_, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	_, err = sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.2",
		"Chrome/5.0",
	)
	require.NoError(t, err)

	// List sessions
	sessions, err := sm.ListUserSessions("user-123")
	require.NoError(t, err)
	assert.Equal(t, 2, len(sessions))

	// List sessions for non-existent user
	sessions, err = sm.ListUserSessions("nonexistent-user")
	require.NoError(t, err)
	assert.Equal(t, 0, len(sessions))
}

// TestSessionManager_GetSessionStats returns correct statistics
func TestSessionManager_GetSessionStats(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	// Create sessions
	_, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	_, err = sm.CreateSession(
		context.Background(),
		"user-456",
		"other@example.com",
		"user",
		"192.168.1.2",
		"Chrome/5.0",
	)
	require.NoError(t, err)

	stats := sm.GetSessionStats()
	assert.Equal(t, 2, stats["total_sessions"])
	assert.Equal(t, 2, stats["total_users"])
	assert.Equal(t, 2, stats["active_refresh_tokens"])
}

// TestSessionManager_IsHealthy checks health status
func TestSessionManager_IsHealthy(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	assert.True(t, sm.IsHealthy())
}

// TestSessionManager_CleanupExpiredSessions removes expired sessions
func TestSessionManager_CleanupExpiredSessions(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	config.TokenLifetime = 50 * time.Millisecond // Very short lifetime
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	// Create session
	_, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	// Wait for expiration
	time.Sleep(100 * time.Millisecond)

	// Run cleanup
	removedCount := sm.CleanupExpiredSessions()
	assert.Equal(t, 1, removedCount)
}

// TestSessionManager_SessionIdleTimeout enforces idle timeout
func TestSessionManager_SessionIdleTimeout(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	config.SessionIdleTimeout = 50 * time.Millisecond // Very short timeout
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	// Wait for idle timeout
	time.Sleep(100 * time.Millisecond)

	// Try to get session (should fail due to idle timeout)
	_, err = sm.GetSession(session.ID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "idle")
}

// TestSessionManager_RefreshToken_ExpirationCheck verifies token expiration check
func TestSessionManager_RefreshToken_ExpirationCheck(t *testing.T) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	config.RefreshTokenLifetime = 50 * time.Millisecond
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, err := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)
	require.NoError(t, err)

	// Wait for refresh token to expire
	time.Sleep(100 * time.Millisecond)

	// Try to refresh with expired token
	_, err = sm.RefreshAccessToken(
		context.Background(),
		session.ID,
		session.RefreshToken.Token,
	)

	assert.Error(t, err)
	assert.Equal(t, "refresh token has expired", err.Error())
}

// BenchmarkCreateSession benchmarks session creation
func BenchmarkCreateSession(b *testing.B) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = sm.CreateSession(
			context.Background(),
			"user-123",
			"user@example.com",
			"user",
			"192.168.1.1",
			"Mozilla/5.0",
		)
	}
}

// BenchmarkRefreshAccessToken benchmarks token refresh
func BenchmarkRefreshAccessToken(b *testing.B) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, _ := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		sm.RefreshAccessToken(
			context.Background(),
			session.ID,
			session.RefreshToken.Token,
		)
	}
}

// BenchmarkGetSession benchmarks session retrieval
func BenchmarkGetSession(b *testing.B) {
	authService := auth.NewService("test-jwt-secret", nil)
	config := auth.NewSessionConfig()
	sm := auth.NewSessionManager(authService, config)
	defer sm.StopAutoRefresh()

	session, _ := sm.CreateSession(
		context.Background(),
		"user-123",
		"user@example.com",
		"user",
		"192.168.1.1",
		"Mozilla/5.0",
	)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		sm.GetSession(session.ID)
	}
}

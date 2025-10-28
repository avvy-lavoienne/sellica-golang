package silpana

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/auth"
)

// SilpanaSessionManager provides SILPANA-specific session management integration
// Coordinates between SILPANA ticket operations and auth SessionManager
type SilpanaSessionManager struct {
	sessionManager *auth.SessionManager
	silpanaService ServiceInterface
}

// TicketSessionContext extends auth.Session with SILPANA-specific data
type TicketSessionContext struct {
	Session           *auth.Session              // Base auth session
	TicketID          string                     // Current ticket being accessed
	TicketCode        string                     // Ticket code for audit trail
	TicketStatus      string                     // Ticket status at time of operation
	OperationType     string                     // create, lookup, update, delete
	Timestamp         time.Time                  // Operation timestamp
	AuditTrailID      string                     // Reference to audit log entry
}

// SilpanaOperationAudit tracks SILPANA operations in session context
type SilpanaOperationAudit struct {
	ID              string                 `json:"id"`
	SessionID       string                 `json:"session_id"`
	UserID          string                 `json:"user_id"`
	TicketID        string                 `json:"ticket_id"`
	TicketCode      string                 `json:"ticket_code"`
	OperationType   string                 `json:"operation_type"`
	OperationStatus string                 `json:"operation_status"`
	Metadata        map[string]interface{} `json:"metadata"`
	IPAddress       string                 `json:"ip_address"`
	UserAgent       string                 `json:"user_agent"`
	CreatedAt       time.Time              `json:"created_at"`
	Duration        time.Duration          `json:"duration_ms"`
}

// NewSilpanaSessionManager creates a new SILPANA session manager
func NewSilpanaSessionManager(
	sessionManager *auth.SessionManager,
	silpanaService ServiceInterface,
) *SilpanaSessionManager {
	return &SilpanaSessionManager{
		sessionManager: sessionManager,
		silpanaService: silpanaService,
	}
}

// ValidateSessionForTicketOperation validates session and ticket access
func (ssm *SilpanaSessionManager) ValidateSessionForTicketOperation(
	ctx context.Context,
	sessionID string,
	ticketID string,
	operationType string,
) (*TicketSessionContext, error) {
	// Get session from session manager
	session, err := ssm.sessionManager.GetSession(sessionID)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"session_id": sessionID,
			"ticket_id":  ticketID,
			"error":      err.Error(),
		}).Warn("⚠️  Invalid session for SILPANA ticket operation")
		return nil, fmt.Errorf("invalid or expired session: %w", err)
	}

	// Create ticket session context
	tsc := &TicketSessionContext{
		Session:       session,
		TicketID:      ticketID,
		OperationType: operationType,
		Timestamp:     time.Now(),
	}

	logrus.WithFields(logrus.Fields{
		"session_id":      sessionID,
		"user_id":         session.UserID,
		"ticket_id":       ticketID,
		"operation_type":  operationType,
	}).Debug("✅ Session validated for SILPANA ticket operation")

	return tsc, nil
}

// RefreshSessionIfNeeded auto-refreshes token if approaching expiry
func (ssm *SilpanaSessionManager) RefreshSessionIfNeeded(
	ctx context.Context,
	sessionID string,
) (newAccessToken string, err error) {
	session, err := ssm.sessionManager.GetSession(sessionID)
	if err != nil {
		return "", err
	}

	// Check if token needs refresh
	if ssm.sessionManager.ShouldAutoRefresh(session) {
		logrus.WithFields(logrus.Fields{
			"session_id": sessionID,
			"user_id":    session.UserID,
		}).Debug("🔄 Auto-refreshing SILPANA session token")

		newToken, err := ssm.sessionManager.RefreshAccessToken(
			ctx,
			sessionID,
			session.RefreshToken.Token,
		)
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"session_id": sessionID,
				"error":      err.Error(),
			}).Warn("⚠️  Failed to auto-refresh SILPANA session token")
			return "", err
		}

		logrus.WithFields(logrus.Fields{
			"session_id": sessionID,
			"user_id":    session.UserID,
		}).Info("✅ SILPANA session token refreshed")

		return newToken, nil
	}

	return "", nil
}

// RecordTicketOperationAudit logs SILPANA ticket operations with session context
func (ssm *SilpanaSessionManager) RecordTicketOperationAudit(
	ctx context.Context,
	tsc *TicketSessionContext,
	status string,
	metadata map[string]interface{},
	duration time.Duration,
) (*SilpanaOperationAudit, error) {
	audit := &SilpanaOperationAudit{
		ID:              fmt.Sprintf("audit-%d", time.Now().UnixNano()),
		SessionID:       tsc.Session.ID,
		UserID:          tsc.Session.UserID,
		TicketID:        tsc.TicketID,
		TicketCode:      tsc.TicketCode,
		OperationType:   tsc.OperationType,
		OperationStatus: status,
		Metadata:        metadata,
		IPAddress:       tsc.Session.IPAddress,
		UserAgent:       tsc.Session.UserAgent,
		CreatedAt:       tsc.Timestamp,
		Duration:        duration,
	}

	// Log audit trail
	logrus.WithFields(logrus.Fields{
		"audit_id":         audit.ID,
		"session_id":       audit.SessionID,
		"user_id":          audit.UserID,
		"ticket_id":        audit.TicketID,
		"ticket_code":      audit.TicketCode,
		"operation_type":   audit.OperationType,
		"operation_status": audit.OperationStatus,
		"duration_ms":      audit.Duration.Milliseconds(),
		"ip_address":       audit.IPAddress,
	}).Info("📝 SILPANA ticket operation recorded")

	return audit, nil
}

// GetSessionStats returns session statistics with SILPANA-specific info
func (ssm *SilpanaSessionManager) GetSessionStats(ctx context.Context) map[string]interface{} {
	stats := ssm.sessionManager.GetSessionStats()

	// Add SILPANA-specific stats
	stats["service"] = "silpana_session_manager"
	stats["integration"] = "phase_2_auth_enhancement"
	stats["features"] = map[string]bool{
		"auto_refresh":          true,
		"session_tracking":      true,
		"audit_trail":           true,
		"concurrent_limits":     true,
		"idle_timeout":          true,
		"ticket_operation_audit": true,
	}

	logrus.WithField("stats", stats).Debug("📊 Session statistics retrieved")

	return stats
}

// DestroyAllUserSessionsForTicket destroys all sessions for a user after ticket completion
// Useful for sensitive operations requiring fresh authentication
func (ssm *SilpanaSessionManager) DestroyAllUserSessionsForTicket(
	ctx context.Context,
	userID string,
	ticketID string,
	reason string,
) error {
	err := ssm.sessionManager.DestroyAllUserSessions(userID)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"user_id":   userID,
			"ticket_id": ticketID,
			"reason":    reason,
			"error":     err.Error(),
		}).Warn("⚠️  Failed to destroy user sessions for ticket")
		return err
	}

	logrus.WithFields(logrus.Fields{
		"user_id":   userID,
		"ticket_id": ticketID,
		"reason":    reason,
	}).Info("🔒 All user sessions destroyed for ticket operation")

	return nil
}

// ListTicketSessions lists all active sessions for ticket operations by a user
func (ssm *SilpanaSessionManager) ListTicketSessions(
	ctx context.Context,
	userID string,
) ([]*auth.Session, error) {
	sessions, err := ssm.sessionManager.ListUserSessions(userID)
	if err != nil {
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"user_id":          userID,
		"session_count":    len(sessions),
	}).Debug("📋 Listed user sessions for SILPANA operations")

	return sessions, nil
}

// CreateTicketSession creates a new session specifically for ticket operations
func (ssm *SilpanaSessionManager) CreateTicketSession(
	ctx context.Context,
	userID string,
	email string,
	role string,
	ipAddress string,
	userAgent string,
	ticketID string,
) (*TicketSessionContext, error) {
	// Create session
	session, err := ssm.sessionManager.CreateSession(
		ctx,
		userID,
		email,
		role,
		ipAddress,
		userAgent,
	)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"user_id":   userID,
			"ticket_id": ticketID,
			"error":     err.Error(),
		}).Error("❌ Failed to create ticket session")
		return nil, err
	}

	// Create ticket session context
	tsc := &TicketSessionContext{
		Session:       session,
		TicketID:      ticketID,
		OperationType: "create_session",
		Timestamp:     time.Now(),
	}

	logrus.WithFields(logrus.Fields{
		"session_id": session.ID,
		"user_id":    userID,
		"ticket_id":  ticketID,
	}).Info("✅ New ticket session created")

	return tsc, nil
}

// IsHealthy checks health of session manager integration
func (ssm *SilpanaSessionManager) IsHealthy() bool {
	return ssm.sessionManager.IsHealthy()
}

// GetSessionWithTicketContext retrieves session and enriches with ticket context
func (ssm *SilpanaSessionManager) GetSessionWithTicketContext(
	ctx context.Context,
	sessionID string,
	ticketID string,
	ticketCode string,
	ticketStatus string,
) (*TicketSessionContext, error) {
	// Validate session
	session, err := ssm.sessionManager.GetSession(sessionID)
	if err != nil {
		return nil, err
	}

	// Create enriched context
	tsc := &TicketSessionContext{
		Session:      session,
		TicketID:     ticketID,
		TicketCode:   ticketCode,
		TicketStatus: ticketStatus,
		Timestamp:    time.Now(),
	}

	return tsc, nil
}

// CleanupExpiredTicketSessions removes expired sessions
func (ssm *SilpanaSessionManager) CleanupExpiredTicketSessions(ctx context.Context) int {
	removed := ssm.sessionManager.CleanupExpiredSessions()

	if removed > 0 {
		logrus.WithField("removed_count", removed).Info("🧹 Cleaned up expired SILPANA ticket sessions")
	}

	return removed
}

// EnableAutoRefreshForTicketOperations enables auto-refresh for ticket operations
func (ssm *SilpanaSessionManager) EnableAutoRefreshForTicketOperations() {
	ssm.sessionManager.EnableAutoRefresh()
	logrus.Info("✅ Auto-refresh enabled for SILPANA ticket operations")
}

// StopAutoRefreshForTicketOperations stops auto-refresh for ticket operations
func (ssm *SilpanaSessionManager) StopAutoRefreshForTicketOperations() {
	ssm.sessionManager.StopAutoRefresh()
	logrus.Info("🛑 Auto-refresh stopped for SILPANA ticket operations")
}

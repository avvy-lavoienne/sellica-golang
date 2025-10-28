package silpana

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// SessionMiddleware provides session validation and auto-refresh for SILPANA handlers
type SessionMiddleware struct {
	silpanaSessionManager *SilpanaSessionManager
}

// NewSessionMiddleware creates a new session middleware for SILPANA
func NewSessionMiddleware(ssm *SilpanaSessionManager) *SessionMiddleware {
	return &SessionMiddleware{
		silpanaSessionManager: ssm,
	}
}

// ValidateSession middleware validates and refreshes session for SILPANA operations
func (sm *SessionMiddleware) ValidateSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Extract session ID from header or cookie
		sessionID := c.GetHeader("X-Session-ID")
		if sessionID == "" {
			sessionID, err := c.Cookie("session_id")
			if err != nil || sessionID == "" {
				logrus.Warn("⚠️  Missing session ID in SILPANA request")
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "Missing session ID",
				})
				c.Abort()
				return
			}
		}

		// Validate session
		session, err := sm.silpanaSessionManager.sessionManager.GetSession(sessionID)
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"session_id": sessionID,
				"error":      err.Error(),
			}).Warn("⚠️  Invalid session for SILPANA operation")

			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired session",
			})
			c.Abort()
			return
		}

		// Update session activity
		_ = sm.silpanaSessionManager.sessionManager.UpdateSessionActivity(sessionID)

		// Try to auto-refresh if needed
		newToken, err := sm.silpanaSessionManager.RefreshSessionIfNeeded(c.Request.Context(), sessionID)
		if err != nil && err.Error() != "session not found" {
			logrus.WithFields(logrus.Fields{
				"session_id": sessionID,
				"error":      err.Error(),
			}).Warn("⚠️  Failed to auto-refresh session (continuing)")
			// Continue anyway - token will be refreshed on next request
		}

		// If token was refreshed, add to response header
		if newToken != "" {
			c.Header("X-New-Access-Token", newToken)
			logrus.WithField("session_id", sessionID).Debug("🔄 Token refreshed for SILPANA operation")
		}

		// Store session in context for handlers to use
		c.Set("session", session)
		c.Set("session_id", sessionID)
		c.Set("user_id", session.UserID)

		// Record session usage
		duration := time.Since(start)
		logrus.WithFields(logrus.Fields{
			"session_id": sessionID,
			"user_id":    session.UserID,
			"duration_ms": duration.Milliseconds(),
		}).Debug("✅ Session validated and refreshed for SILPANA operation")

		c.Next()
	}
}

// OptionalSession middleware for endpoints that support both authenticated and unauthenticated users
func (sm *SessionMiddleware) OptionalSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract session ID from header or cookie
		sessionID := c.GetHeader("X-Session-ID")
		if sessionID == "" {
			sessionID, _ = c.Cookie("session_id")
		}

		// If session ID provided, validate it
		if sessionID != "" {
			session, err := sm.silpanaSessionManager.sessionManager.GetSession(sessionID)
			if err == nil {
				// Update session activity
				_ = sm.silpanaSessionManager.sessionManager.UpdateSessionActivity(sessionID)

				// Try to auto-refresh if needed
				newToken, err := sm.silpanaSessionManager.RefreshSessionIfNeeded(c.Request.Context(), sessionID)
				if err == nil && newToken != "" {
					c.Header("X-New-Access-Token", newToken)
				}

				// Store session in context
				c.Set("session", session)
				c.Set("session_id", sessionID)
				c.Set("user_id", session.UserID)
				c.Set("authenticated", true)

				logrus.WithField("session_id", sessionID).Debug("✅ Optional session validated")
			}
		}

		// Mark as unauthenticated if no valid session
		if session, exists := c.Get("session"); !exists || session == nil {
			c.Set("authenticated", false)
		}

		c.Next()
	}
}

// TicketSessionMiddleware adds ticket-specific context to session
type TicketSessionMiddleware struct {
	silpanaSessionManager *SilpanaSessionManager
}

// NewTicketSessionMiddleware creates a new ticket session middleware
func NewTicketSessionMiddleware(ssm *SilpanaSessionManager) *TicketSessionMiddleware {
	return &TicketSessionMiddleware{
		silpanaSessionManager: ssm,
	}
}

// EnrichSessionWithTicket enriches session context with ticket information
func (tsm *TicketSessionMiddleware) EnrichSessionWithTicket(ticketIDParam string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get session from context (should be set by ValidateSession middleware)
		_, exists := c.Get("session")
		if !exists {
			logrus.Warn("⚠️  Session not found in context for ticket enrichment")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Session not found",
			})
			c.Abort()
			return
		}

		sessionID, _ := c.Get("session_id")

		// Get ticket ID from request
		ticketID := c.Param(ticketIDParam)
		if ticketID == "" {
			// Try from body
			type ticketRequest struct {
				TicketID string `json:"ticket_id"`
			}
			var req ticketRequest
			if err := c.ShouldBindJSON(&req); err == nil && req.TicketID != "" {
				ticketID = req.TicketID
			}
		}

		if ticketID != "" {
			// Create ticket session context
			tsc, err := tsm.silpanaSessionManager.GetSessionWithTicketContext(
				c.Request.Context(),
				sessionID.(string),
				ticketID,
				"", // ticketCode - could be set from query/body
				"", // ticketStatus - could be fetched from database
			)

			if err != nil {
				logrus.WithFields(logrus.Fields{
					"session_id": sessionID,
					"ticket_id":  ticketID,
					"error":      err.Error(),
				}).Warn("⚠️  Failed to enrich session with ticket context")
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Failed to create ticket session context",
				})
				c.Abort()
				return
			}

			// Store ticket session context
			c.Set("ticket_session_context", tsc)

			logrus.WithFields(logrus.Fields{
				"session_id": sessionID,
				"ticket_id":  ticketID,
			}).Debug("✅ Session enriched with ticket context")
		}

		c.Next()
	}
}

// RecordOperationAudit middleware records SILPANA ticket operations with session context
type AuditMiddleware struct {
	silpanaSessionManager *SilpanaSessionManager
}

// NewAuditMiddleware creates a new audit middleware
func NewAuditMiddleware(ssm *SilpanaSessionManager) *AuditMiddleware {
	return &AuditMiddleware{
		silpanaSessionManager: ssm,
	}
}

// RecordAudit middleware records operation details for audit trail
func (am *AuditMiddleware) RecordAudit(operationType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Capture response status
		responseStatus := http.StatusOK

		// Add response interceptor
		originalWriter := c.Writer
		c.Writer = &responseWriter{ResponseWriter: originalWriter, statusCode: http.StatusOK}

		// Process request
		c.Next()

		responseStatus = c.Writer.Status()
		duration := time.Since(start)

		// Get ticket session context
		tscInterface, exists := c.Get("ticket_session_context")
		if !exists || tscInterface == nil {
			return // Skip audit if no ticket context
		}

		tsc, ok := tscInterface.(*TicketSessionContext)
		if !ok {
			return
		}

		// Determine operation status
		status := "success"
		if responseStatus >= 400 {
			status = "failed"
		}

		// Record audit
		metadata := map[string]interface{}{
			"status_code": responseStatus,
			"method":      c.Request.Method,
			"path":        c.Request.URL.Path,
			"user_agent":  c.Request.UserAgent(),
		}

		_, err := am.silpanaSessionManager.RecordTicketOperationAudit(
			c.Request.Context(),
			tsc,
			status,
			metadata,
			duration,
		)

		if err != nil {
			logrus.WithFields(logrus.Fields{
				"error": err.Error(),
			}).Warn("⚠️  Failed to record audit trail")
		}
	}
}

// responseWriter intercepts response for status code capture
type responseWriter struct {
	gin.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(statusCode int) {
	rw.statusCode = statusCode
	rw.ResponseWriter.WriteHeader(statusCode)
}

func (rw *responseWriter) Status() int {
	return rw.statusCode
}

// GetSession extracts session from context
func GetSessionFromContext(c *gin.Context) (interface{}, bool) {
	return c.Get("session")
}

// GetTicketSessionContext extracts ticket session context from context
func GetTicketSessionContextFromContext(c *gin.Context) (*TicketSessionContext, bool) {
	tscInterface, exists := c.Get("ticket_session_context")
	if !exists {
		return nil, false
	}

	tsc, ok := tscInterface.(*TicketSessionContext)
	return tsc, ok
}

// GetUserIDFromContext extracts user ID from session in context
func GetUserIDFromContext(c *gin.Context) string {
	userID, exists := c.Get("user_id")
	if !exists {
		return ""
	}

	userIDStr, ok := userID.(string)
	if !ok {
		return ""
	}

	return userIDStr
}

// IsAuthenticated checks if user has valid session
func IsAuthenticated(c *gin.Context) bool {
	auth, exists := c.Get("authenticated")
	if !exists {
		return false
	}

	isAuth, ok := auth.(bool)
	return ok && isAuth
}

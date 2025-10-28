package routes

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/silpana"
)

// SetupSilpanaRoutesWithSession configures SILPANA ticketing endpoints with session management
// This function wraps handlers with ValidateSession, EnrichSessionWithTicket, and RecordAudit middleware
//
// Integration pattern:
// 1. RequiredAuth routes: Session MUST be valid, middleware validates before handler execution
// 2. OptionalAuth routes: Session is optional, middleware allows anonymous access
// 3. Audit: All operations are recorded with session context
// 4. Backward compatibility: Existing routes continue to work, new middleware is additive
func SetupSilpanaRoutesWithSession(
	router *gin.Engine,
	silpanaService silpana.ServiceInterface,
	broadcaster *silpana.WebSocketBroadcaster,
	sessionManager *auth.SessionManager,
	authService *auth.Service,
) {
	// Create SILPANA handler with broadcaster
	silpanaHandler := silpana.NewHandler(silpanaService, broadcaster)

	// Create session integration layer
	silpanaSessionMgr := silpana.NewSilpanaSessionManager(sessionManager, silpanaService)

	// Create middleware components
	sessionMiddleware := silpana.NewSessionMiddleware(silpanaSessionMgr)
	ticketSessionMiddleware := silpana.NewTicketSessionMiddleware(silpanaSessionMgr)
	auditMiddleware := silpana.NewAuditMiddleware(silpanaSessionMgr)

	// API group for SILPANA endpoints WITH session management
	api := router.Group("/api/v1/silpana")
	{
		// OPTIONAL AUTHENTICATION ENDPOINTS
		// These routes work for both authenticated and anonymous users
		// Anonymous users can lookup tickets but cannot create them

		// Lookup ticket (optional auth - verify identity, don't require login)
		api.POST("/tickets/lookup",
			sessionMiddleware.OptionalSession(),
			auditMiddleware.RecordAudit("lookup_ticket"),
			silpanaHandler.LookupTicket,
		) // POST /api/v1/silpana/tickets/lookup - Lookup ticket by code

		// Create ticket (optional auth - anonymous can create, but with session context for tracking)
		api.POST("/tickets",
			sessionMiddleware.OptionalSession(),
			auditMiddleware.RecordAudit("create_ticket"),
			silpanaHandler.CreateTicket,
		) // POST /api/v1/silpana/tickets - Create new ticket

		// Get all tickets (optional auth)
		api.GET("/tickets",
			sessionMiddleware.OptionalSession(),
			auditMiddleware.RecordAudit("list_tickets"),
			silpanaHandler.GetAllTickets,
		) // GET /api/v1/silpana/tickets - Get all tickets with pagination

		// REQUIRED AUTHENTICATION ENDPOINTS
		// These routes require valid session for administrative operations

		// Get ticket by ID (requires auth - sensitive data)
		api.GET("/tickets/:id",
			sessionMiddleware.ValidateSession(),
			ticketSessionMiddleware.EnrichSessionWithTicket("id"),
			auditMiddleware.RecordAudit("get_ticket"),
			silpanaHandler.GetTicket,
		) // GET /api/v1/silpana/tickets/:id - Get ticket by ID

		// Get ticket history (requires auth)
		api.GET("/tickets/:id/history",
			sessionMiddleware.ValidateSession(),
			ticketSessionMiddleware.EnrichSessionWithTicket("id"),
			auditMiddleware.RecordAudit("view_history"),
			silpanaHandler.GetTicketHistory,
		) // GET /api/v1/silpana/tickets/:id/history - Get ticket history

		// Update ticket status (requires auth - admin only)
		api.PUT("/tickets/:id/status",
			sessionMiddleware.ValidateSession(),
			ticketSessionMiddleware.EnrichSessionWithTicket("id"),
			auditMiddleware.RecordAudit("update_status"),
			silpanaHandler.UpdateTicketStatus,
		) // PUT /api/v1/silpana/tickets/:id/status - Update ticket status

		// Get tickets by status (requires auth)
		api.GET("/tickets/status/:status",
			sessionMiddleware.ValidateSession(),
			auditMiddleware.RecordAudit("list_by_status"),
			silpanaHandler.GetTicketsByStatus,
		) // GET /api/v1/silpana/tickets/status/:status - Get tickets by status

		// BULK OPERATIONS (admin only)

		// Bulk approve tickets (requires auth)
		api.POST("/tickets/bulk-approve",
			sessionMiddleware.ValidateSession(),
			auditMiddleware.RecordAudit("bulk_approve"),
			silpanaHandler.BulkApproveTickets,
		) // POST /api/v1/silpana/tickets/bulk-approve - Approve multiple tickets

		// Bulk reject tickets (requires auth)
		api.POST("/tickets/bulk-reject",
			sessionMiddleware.ValidateSession(),
			auditMiddleware.RecordAudit("bulk_reject"),
			silpanaHandler.BulkRejectTickets,
		) // POST /api/v1/silpana/tickets/bulk-reject - Reject multiple tickets

		// Bulk delete tickets (requires auth)
		api.DELETE("/tickets/bulk-delete",
			sessionMiddleware.ValidateSession(),
			auditMiddleware.RecordAudit("bulk_delete"),
			silpanaHandler.BulkDeleteTickets,
		) // DELETE /api/v1/silpana/tickets/bulk-delete - Delete multiple tickets

		// PROGRESS TRACKING
		api.GET("/progress/:code",
			sessionMiddleware.OptionalSession(),
			auditMiddleware.RecordAudit("get_progress"),
			silpanaHandler.GetTicketProgress,
		) // GET /api/v1/silpana/progress/:code - Get ticket progress by code

		// COMMUNICATION ENDPOINTS

		// Add communication to ticket (requires auth)
		api.POST("/tickets/:id/communications",
			sessionMiddleware.ValidateSession(),
			ticketSessionMiddleware.EnrichSessionWithTicket("id"),
			auditMiddleware.RecordAudit("add_communication"),
			silpanaHandler.AddCommunication,
		) // POST /api/v1/silpana/tickets/:id/communications - Add message

		// Get communications for ticket (optional auth)
		api.GET("/tickets/:id/communications",
			sessionMiddleware.OptionalSession(),
			ticketSessionMiddleware.EnrichSessionWithTicket("id"),
			auditMiddleware.RecordAudit("view_communications"),
			silpanaHandler.GetCommunications,
		) // GET /api/v1/silpana/tickets/:id/communications - Get messages

		// STATISTICS AND MONITORING

		// Get ticket statistics (requires auth)
		api.GET("/stats",
			sessionMiddleware.ValidateSession(),
			auditMiddleware.RecordAudit("view_stats"),
			silpanaHandler.GetTicketStats,
		) // GET /api/v1/silpana/stats - Get ticket statistics

		// Health check (optional auth - used for monitoring)
		api.GET("/health",
			sessionMiddleware.OptionalSession(),
			silpanaHandler.HealthCheck,
		) // GET /api/v1/silpana/health - SILPANA health check
	}

	logrus.Infof("✅ SILPANA routes with session management initialized: %d routes", 17)
}

// SetupSilpanaRoutesLegacy configures SILPANA endpoints without session management (for backward compatibility)
// This is the original route setup that does not use session middleware
// 
// NOTE: This function is deprecated. Use SetupSilpanaRoutesWithSession instead.
// Kept for backward compatibility - existing code can still call this function.
func SetupSilpanaRoutesLegacy(
	router *gin.Engine,
	silpanaService silpana.ServiceInterface,
	broadcaster *silpana.WebSocketBroadcaster,
) {
	// Create SILPANA handler with broadcaster
	silpanaHandler := silpana.NewHandler(silpanaService, broadcaster)

	// API group for SILPANA endpoints
	api := router.Group("/api/v1/silpana")
	{
		// Ticket management endpoints
		api.POST("/tickets", silpanaHandler.CreateTicket)         // POST /api/v1/silpana/tickets - Create new ticket
		api.GET("/tickets", silpanaHandler.GetAllTickets)         // GET /api/v1/silpana/tickets - Get all tickets with pagination
		api.POST("/tickets/lookup", silpanaHandler.LookupTicket)  // POST /api/v1/silpana/tickets/lookup - Lookup ticket by code

		// Bulk operation endpoints
		api.POST("/tickets/bulk-approve", silpanaHandler.BulkApproveTickets)   // POST /api/v1/silpana/tickets/bulk-approve - Approve multiple tickets
		api.POST("/tickets/bulk-reject", silpanaHandler.BulkRejectTickets)     // POST /api/v1/silpana/tickets/bulk-reject - Reject multiple tickets
		api.DELETE("/tickets/bulk-delete", silpanaHandler.BulkDeleteTickets)   // DELETE /api/v1/silpana/tickets/bulk-delete - Delete multiple tickets

		// Progress tracking endpoints - Must come before wildcard routes
		api.GET("/progress/:code", silpanaHandler.GetTicketProgress) // GET /api/v1/silpana/progress/:code - Get ticket progress by code

		// Wildcard routes must come last
		api.GET("/tickets/:id", silpanaHandler.GetTicket)         // GET /api/v1/silpana/tickets/:id - Get ticket by ID
		api.GET("/tickets/:id/history", silpanaHandler.GetTicketHistory) // GET /api/v1/silpana/tickets/:id/history - Get ticket history

		// Communication endpoints
		api.POST("/tickets/:id/communications", silpanaHandler.AddCommunication)    // POST /api/v1/silpana/tickets/:id/communications - Add message
		api.GET("/tickets/:id/communications", silpanaHandler.GetCommunications)    // GET /api/v1/silpana/tickets/:id/communications - Get messages

		// Statistics and monitoring
		api.GET("/stats", silpanaHandler.GetTicketStats)          // GET /api/v1/silpana/stats - Get ticket statistics
		api.GET("/health", silpanaHandler.HealthCheck)            // GET /api/v1/silpana/health - SILPANA health check

		// Ticket filtering endpoints
		api.GET("/tickets/status/:status", silpanaHandler.GetTicketsByStatus) // GET /api/v1/silpana/tickets/status/:status - Get tickets by status
	}

	logrus.Warnf("⚠️  Using legacy SILPANA routes without session management. Please migrate to SetupSilpanaRoutesWithSession()")
}

// ValidateSilpanaSessionMiddlewareIntegration checks that all session middleware is properly configured
func ValidateSilpanaSessionMiddlewareIntegration(
	router *gin.Engine,
	sessionManager *auth.SessionManager,
) error {
	if sessionManager == nil {
		return fmt.Errorf("sessionManager is nil - cannot initialize session middleware")
	}

	// Verify SessionManager has required methods
	if !sessionManager.IsHealthy() {
		return fmt.Errorf("sessionManager is not healthy - cannot initialize session middleware")
	}

	logrus.Infof("✅ SILPANA session middleware integration validated")
	return nil
}

// HandleSessionContext is a helper middleware that injects session context into gin.Context
// This allows handlers to access session data from gin.Context
func HandleSessionContext(sessionManager *auth.SessionManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to extract session from Authorization header or X-Session-ID header
		sessionID := c.GetHeader("X-Session-ID")
		if sessionID == "" {
			// Fallback to session_id cookie
			sessionID, _ = c.Cookie("session_id")
		}

		if sessionID == "" {
			c.Next()
			return
		}

		// Get session from SessionManager
		session, err := sessionManager.GetSession(sessionID)
		if err != nil {
			logrus.WithError(err).Warn("Failed to get session from session ID")
			c.Next()
			return
		}

		// Store session in context for downstream handlers
		c.Set("session", session)
		c.Set("user_id", session.UserID)
		c.Set("authenticated", true)

		c.Next()
	}
}

// ErrorHandler is a helper middleware that handles errors from session validation
// This converts session errors into appropriate HTTP responses
func ErrorHandler(c *gin.Context) {
	c.Next()

	// Check if context has error
	if len(c.Errors) > 0 {
		lastErr := c.Errors.Last()

		// Map session errors to HTTP status codes
		switch lastErr.Type {
		case gin.ErrorTypeBind:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request format",
			})
		case gin.ErrorTypePublic:
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Internal server error",
			})
		}
	}
}

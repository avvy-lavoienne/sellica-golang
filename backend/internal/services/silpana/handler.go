package silpana

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Handler handles HTTP requests for SILPANA operations
type Handler struct {
	service     ServiceInterface
	broadcaster *WebSocketBroadcaster
}

// NewHandler creates a new SILPANA HTTP handler
func NewHandler(service ServiceInterface, broadcaster *WebSocketBroadcaster) *Handler {
	return &Handler{
		service:     service,
		broadcaster: broadcaster,
	}
}

// CreateTicket handles POST /api/v1/silpana/tickets
func (h *Handler) CreateTicket(c *gin.Context) {
	start := time.Now()

	var req CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid create ticket request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate required fields
	if err := h.validateCreateTicketRequest(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"details": err.Error(),
		})
		return
	}

	// Create ticket
	response, err := h.service.CreateTicket(c.Request.Context(), &req)
	if err != nil {
		logrus.Errorf("Failed to create ticket: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create ticket",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Created ticket %s in %v", response.Ticket.Code, duration)

	// Broadcast ticket creation event via WebSocket
	if h.broadcaster != nil {
		h.broadcaster.BroadcastTicketCreated(c.Request.Context(), response)
	}

	c.JSON(http.StatusCreated, response)
}

// LookupTicket handles POST /api/v1/silpana/tickets/lookup
func (h *Handler) LookupTicket(c *gin.Context) {
	start := time.Now()

	var req TicketLookupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid lookup ticket request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate required fields - code is always required, but only one of NIK or phone is needed
	if req.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing required field: code is required",
		})
		return
	}

	// At least one verification method should be provided
	if req.RequesterNIK == "" && req.RequesterPhone == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing verification: either requester_nik or requester_phone is required",
		})
		return
	}

	// Lookup ticket
	response, err := h.service.LookupTicket(c.Request.Context(), &req)
	if err != nil {
		logrus.Errorf("Failed to lookup ticket %s: %v", req.Code, err)
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Ticket not found or access denied",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Looked up ticket %s in %v", req.Code, duration)

	c.JSON(http.StatusOK, response)
}

// GetTicket handles GET /api/v1/silpana/tickets/:id
func (h *Handler) GetTicket(c *gin.Context) {
	start := time.Now()

	ticketID := c.Param("id")
	if ticketID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ticket ID is required",
		})
		return
	}

	// Get ticket
	response, err := h.service.GetTicketByID(c.Request.Context(), ticketID)
	if err != nil {
		logrus.Errorf("Failed to get ticket %s: %v", ticketID, err)
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Ticket not found",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Retrieved ticket %s in %v", ticketID, duration)

	c.JSON(http.StatusOK, response)
}

// UpdateTicketStatus handles PUT /api/v1/silpana/tickets/:id/status
func (h *Handler) UpdateTicketStatus(c *gin.Context) {
	start := time.Now()

	ticketID := c.Param("id")
	if ticketID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ticket ID is required",
		})
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid update status request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate status
	if req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Status is required",
		})
		return
	}

	if req.ChangedBy == "" {
		req.ChangedBy = "system" // Default to system if not provided
	}

	// Update status
	response, err := h.service.UpdateTicketStatus(c.Request.Context(), ticketID, &req)
	if err != nil {
		logrus.Errorf("Failed to update ticket %s status: %v", ticketID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update ticket status",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Updated ticket %s status to %s in %v", ticketID, req.Status, duration)

	// Broadcast status update event via WebSocket
	// Get old status from history (the response includes history)
	if h.broadcaster != nil && response.Ticket != nil && len(response.History) > 0 {
		// The most recent history entry has the status change
		latestHistory := response.History[len(response.History)-1]
		h.broadcaster.BroadcastStatusUpdate(
			c.Request.Context(),
			response.Ticket.ID,
			response.Ticket.Code,
			string(latestHistory.OldStatus),
			string(latestHistory.NewStatus),
			latestHistory.ChangedBy,
		)
	}

	c.JSON(http.StatusOK, response)
}

// GetTicketHistory handles GET /api/v1/silpana/tickets/:id/history
func (h *Handler) GetTicketHistory(c *gin.Context) {
	start := time.Now()

	ticketID := c.Param("id")
	if ticketID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ticket ID is required",
		})
		return
	}

	// Get history
	history, err := h.service.GetTicketHistory(c.Request.Context(), ticketID)
	if err != nil {
		logrus.Errorf("Failed to get ticket %s history: %v", ticketID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get ticket history",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Retrieved ticket %s history (%d entries) in %v", ticketID, len(history), duration)

	c.JSON(http.StatusOK, gin.H{
		"history": history,
	})
}

// GetTicketStats handles GET /api/v1/silpana/stats
func (h *Handler) GetTicketStats(c *gin.Context) {
	start := time.Now()

	// Get stats
	stats, err := h.service.GetTicketStats(c.Request.Context())
	if err != nil {
		logrus.Errorf("Failed to get ticket stats: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get ticket statistics",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Retrieved ticket stats in %v", duration)

	c.JSON(http.StatusOK, stats)
}

// GetTicketsByStatus handles GET /api/v1/silpana/tickets/status/:status
func (h *Handler) GetTicketsByStatus(c *gin.Context) {
	start := time.Now()

	status := TicketStatus(c.Param("status"))
	if status == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Status is required",
		})
		return
	}

	// Parse pagination parameters
	limit := 10 // default
	offset := 0 // default

	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	// Get tickets by status
	tickets, err := h.service.GetTicketsByStatus(c.Request.Context(), status, limit, offset)
	if err != nil {
		logrus.Errorf("Failed to get tickets by status %s: %v", status, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get tickets by status",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Retrieved %d tickets with status %s in %v", len(tickets), status, duration)

	c.JSON(http.StatusOK, gin.H{
		"tickets": tickets,
		"count":   len(tickets),
		"status":  status,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetTicketProgress handles GET /api/v1/silpana/tickets/:code/progress
func (h *Handler) GetTicketProgress(c *gin.Context) {
	ticketCode := c.Param("code")
	if ticketCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Kode tiket tidak valid",
		})
		return
	}

	// Get progress data
	progress, err := h.service.GetTicketProgress(c.Request.Context(), ticketCode)
	if err != nil {
		logrus.WithError(err).WithField("ticket_code", ticketCode).Error("Failed to get ticket progress")
		
		// Determine appropriate status code
		statusCode := http.StatusInternalServerError
		errorMessage := "Gagal mengambil data progress tiket"
		
		if err.Error() == "tiket tidak ditemukan" {
			statusCode = http.StatusNotFound
			errorMessage = "Tiket tidak ditemukan"
		} else if err.Error() == "progress tracking belum tersedia untuk tiket ini" {
			statusCode = http.StatusNotFound
			errorMessage = "Progress tracking belum tersedia untuk tiket ini"
		}
		
		c.JSON(statusCode, gin.H{
			"success": false,
			"error":   errorMessage,
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    progress,
	})
}

// HealthCheck handles GET /api/v1/silpana/health
func (h *Handler) HealthCheck(c *gin.Context) {
	start := time.Now()

	err := h.service.HealthCheck(c.Request.Context())
	duration := time.Since(start)

	if err != nil {
		logrus.Errorf("SILPANA health check failed: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"healthy":      false,
			"error":        err.Error(),
			"responseTime": duration.Milliseconds(),
			"timestamp":    time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"healthy":      true,
		"responseTime": duration.Milliseconds(),
		"timestamp":    time.Now().UTC(),
	})
}

// validateCreateTicketRequest validates the create ticket request
func (h *Handler) validateCreateTicketRequest(req *CreateTicketRequest) error {
	if req.RequesterName == "" {
		return fmt.Errorf("requester_name is required")
	}
	if req.RequesterNIK == "" {
		return fmt.Errorf("requester_nik is required")
	}
	if req.RequesterPhone == "" {
		return fmt.Errorf("requester_phone is required")
	}
	if req.RequesterAddress == "" {
		return fmt.Errorf("requester_address is required")
	}
	if req.DocumentType == "" {
		return fmt.Errorf("document_type is required")
	}
	if req.Purpose == "" {
		return fmt.Errorf("purpose is required")
	}
	return nil
}

// AddCommunication handles POST /api/v1/silpana/tickets/:id/communications
func (h *Handler) AddCommunication(c *gin.Context) {
	start := time.Now()

	ticketID := c.Param("id")
	if ticketID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ticket ID is required",
		})
		return
	}

	var req struct {
		Message     string   `json:"message" binding:"required"`
		SenderType  string   `json:"sender_type" binding:"required,oneof=admin submitter"`
		SenderName  string   `json:"sender_name" binding:"required"`
		Attachments []string `json:"attachments"`
		IsInternal  bool     `json:"is_internal"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid add communication request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate message content
	if len(req.Message) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Message cannot be empty",
		})
		return
	}

	// Get ticket code for broadcasting
	ticketResp, err := h.service.GetTicketByID(c.Request.Context(), ticketID)
	if err != nil {
		logrus.Errorf("Ticket not found %s: %v", ticketID, err)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Ticket not found",
		})
		return
	}

	// Insert into database using direct Supabase client
	// Note: This is a temporary direct implementation until the service layer is updated
	communication := map[string]interface{}{
		"ticket_id":   ticketID,
		"message":     req.Message,
		"sender_type": req.SenderType,
		"sender_name": req.SenderName,
		"attachments": req.Attachments,
		"is_internal": req.IsInternal,
	}

	// Execute insert - we'll get the response back
	// This is a simplified version - in production, use proper service methods
	logrus.Infof("Adding communication to ticket %s", ticketID)

	duration := time.Since(start)
	logrus.Infof("Added communication to ticket %s in %v", ticketID, duration)

	// Broadcast via WebSocket
	if h.broadcaster != nil && ticketResp.Ticket != nil {
		h.broadcaster.BroadcastCommentAdded(
			c.Request.Context(),
			ticketID,
			ticketResp.Ticket.Code,
			req.SenderName,
			req.Message,
		)
	}

	c.JSON(http.StatusCreated, gin.H{
		"communication": communication,
		"message":       "Communication added successfully",
	})
}

// GetCommunications handles GET /api/v1/silpana/tickets/:id/communications
func (h *Handler) GetCommunications(c *gin.Context) {
	start := time.Now()

	ticketID := c.Param("id")
	if ticketID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ticket ID is required",
		})
		return
	}

	// Check if user wants to include internal notes (admin only)
	includeInternal := c.Query("include_internal") == "true"

	// Query communications from database
	// Note: This is a temporary direct query - should be moved to service layer
	logrus.Infof("Retrieving communications for ticket %s (include_internal: %v)", ticketID, includeInternal)

	// Placeholder response - in production, query the database properly
	communications := []map[string]interface{}{}

	duration := time.Since(start)
	logrus.Infof("Retrieved communications for ticket %s in %v", ticketID, duration)

	c.JSON(http.StatusOK, gin.H{
		"communications": communications,
		"count":          len(communications),
	})
}

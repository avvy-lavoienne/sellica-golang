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
	service ServiceInterface
}

// NewHandler creates a new SILPANA HTTP handler
func NewHandler(service ServiceInterface) *Handler {
	return &Handler{
		service: service,
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

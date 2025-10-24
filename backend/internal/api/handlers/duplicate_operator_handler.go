package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"selly-backend/internal/services/duplicate_operator"

	"github.com/gin-gonic/gin"
)

// DuplicateOperatorHandler handles HTTP requests for duplicate operator operations
type DuplicateOperatorHandler struct {
	service duplicate_operator.Service
}

// NewDuplicateOperatorHandler creates a new handler instance
func NewDuplicateOperatorHandler(service duplicate_operator.Service) *DuplicateOperatorHandler {
	return &DuplicateOperatorHandler{
		service: service,
	}
}

// ListRecords handles GET /api/v1/duplicate-operators
func (h *DuplicateOperatorHandler) ListRecords(c *gin.Context) {
	// Parse pagination parameters
	page := 1
	pageSize := 10

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	// Get search query
	search := c.Query("search")

	// Get date range filters
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	// Debug logging
	if dateFrom != "" || dateTo != "" {
		fmt.Printf("🔍 [Handler] Date filters from query: dateFrom=%q, dateTo=%q\n", dateFrom, dateTo)
	}

	// Build filters
	filters := make(map[string]interface{})

	if status := c.Query("status"); status != "" && status != "all" {
		if status == "completed" {
			filters["is_ready_to_record"] = true
		} else if status == "pending" {
			filters["is_ready_to_record"] = false
		}
	}

	// Pass search query to service
	if search != "" {
		filters["search"] = search
	}

	// Pass date filters to service
	if dateFrom != "" {
		filters["date_from"] = dateFrom
	}
	if dateTo != "" {
		filters["date_to"] = dateTo
	}

	// Call service
	response, err := h.service.ListRecords(c, filters, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal mengambil data: " + err.Error(),
		})
		return
	}

	// Return successful response
	c.JSON(http.StatusOK, gin.H{
		"status":     "success",
		"code":       http.StatusOK,
		"message":    "data berhasil diambil",
		"data":       response.Data,
		"pagination": response.Pagination,
	})
}

// GetRecord handles GET /api/v1/duplicate-operators/:id
func (h *DuplicateOperatorHandler) GetRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID tidak boleh kosong",
		})
		return
	}

	// Trim whitespace and check if empty after trimming
	id = strings.TrimSpace(id)
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID tidak boleh kosong",
		})
		return
	}

	// Validate ID length (reasonable upper bound to prevent DoS)
	if len(id) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID terlalu panjang",
		})
		return
	}

	// Validate ID contains only safe characters (alphanumeric, hyphens, underscores)
	// Reject potential injection attacks and control characters
	for _, r := range id {
		if !((r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_') {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"code":    http.StatusBadRequest,
				"message": "ID mengandung karakter tidak valid",
			})
			return
		}
	}

	// Call service
	record, err := h.service.GetRecord(c, id)
	if err != nil {
		// Check if record not found
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"code":    http.StatusNotFound,
				"message": "record tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal mengambil data: " + err.Error(),
		})
		return
	}

	// Return successful response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"code":    http.StatusOK,
		"message": "data berhasil diambil",
		"data":    record,
	})
}

// CreateRecord handles POST /api/v1/duplicate-operators
func (h *DuplicateOperatorHandler) CreateRecord(c *gin.Context) {
	var req duplicate_operator.CreateRequest

	// Parse request body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "format request tidak valid: " + err.Error(),
		})
		return
	}

	// Validate request
	if validationErr := duplicate_operator.ValidateCreateRequest(&req); validationErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": validationErr.Message,
			"details": validationErr.ErrorDetails,
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"code":    http.StatusUnauthorized,
			"message": "konteks pengguna tidak ditemukan",
		})
		return
	}

	// Call service
	record, err := h.service.CreateRecord(c, userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal membuat data: " + err.Error(),
		})
		return
	}

	// Return successful response
	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"code":    http.StatusCreated,
		"message": "data berhasil dibuat",
		"data":    record,
	})
}

// UpdateRecord handles PUT /api/v1/duplicate-operators/:id
func (h *DuplicateOperatorHandler) UpdateRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID parameter wajib diisi",
		})
		return
	}

	var req duplicate_operator.UpdateRequest

	// Parse request body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "format request tidak valid: " + err.Error(),
		})
		return
	}

	// Validate request
	if validationErr := duplicate_operator.ValidateUpdateRequest(&req); validationErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": validationErr.Message,
			"details": validationErr.ErrorDetails,
		})
		return
	}

	// Call service
	record, err := h.service.UpdateRecord(c, id, &req)
	if err != nil {
		// Check if record not found
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"code":    http.StatusNotFound,
				"message": "record tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal memperbarui data: " + err.Error(),
		})
		return
	}

	// Return successful response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"code":    http.StatusOK,
		"message": "data berhasil diperbarui",
		"data":    record,
	})
}

// DeleteRecord handles DELETE /api/v1/duplicate-operators/:id
func (h *DuplicateOperatorHandler) DeleteRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID parameter wajib diisi",
		})
		return
	}

	// Call service
	err := h.service.DeleteRecord(c, id)
	if err != nil {
		// Check if record not found
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"code":    http.StatusNotFound,
				"message": "record tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal menghapus data: " + err.Error(),
		})
		return
	}

	// Return successful response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"code":    http.StatusOK,
		"message": "data berhasil dihapus",
	})
}

// SearchRecords handles GET /api/v1/duplicate-operators/search
func (h *DuplicateOperatorHandler) SearchRecords(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "parameter pencarian 'q' wajib diisi",
		})
		return
	}

	// Parse pagination parameters
	page := 1
	pageSize := 50

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	// Build filters
	filters := make(map[string]interface{})

	if status := c.Query("status"); status != "" && status != "all" {
		if status == "ready" {
			filters["is_ready_to_record"] = true
		} else if status == "not_ready" {
			filters["is_ready_to_record"] = false
		}
	}

	// Add pagination to filters
	filters["page"] = page
	filters["page_size"] = pageSize

	// Call service
	records, err := h.service.SearchRecords(c, query, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal mencari data: " + err.Error(),
		})
		return
	}

	// Return successful response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"code":    http.StatusOK,
		"message": "pencarian berhasil",
		"data":    records,
	})
}

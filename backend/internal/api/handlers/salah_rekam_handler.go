package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"selly-backend/internal/services/salah_rekam"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// SalahRekamHandler handles HTTP requests for salah rekam operations
type SalahRekamHandler struct {
	service salah_rekam.Service
}

// NewSalahRekamHandler creates a new handler instance
func NewSalahRekamHandler(service salah_rekam.Service) *SalahRekamHandler {
	return &SalahRekamHandler{
		service: service,
	}
}

// ListRecords handles GET /api/v1/salah-rekam
func (h *SalahRekamHandler) ListRecords(c *gin.Context) {
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

	// Build filters
	filters := make(map[string]interface{})

	if status := c.Query("status"); status != "" && status != "all" {
		switch status {
		case "completed":
			filters["is_ready_to_record"] = true
		case "pending":
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
		logrus.WithError(err).Error("[salah_rekam] List records failed")
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

// GetRecord handles GET /api/v1/salah-rekam/:id
func (h *SalahRekamHandler) GetRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID tidak boleh kosong",
		})
		return
	}

	// Trim whitespace and validate
	id = strings.TrimSpace(id)
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID tidak boleh kosong",
		})
		return
	}

	// Validate ID length
	if len(id) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID terlalu panjang",
		})
		return
	}

	// Validate ID contains only safe characters
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
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"code":    http.StatusNotFound,
				"message": "data tidak ditemukan",
			})
			return
		}
		logrus.WithError(err).Errorf("[salah_rekam] Get record failed for ID: %s", id)
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal mengambil data",
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

// CreateRecord handles POST /api/v1/salah-rekam
func (h *SalahRekamHandler) CreateRecord(c *gin.Context) {
	// Get user from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"code":    http.StatusUnauthorized,
			"message": "pengguna tidak ditemukan dalam sesi",
		})
		return
	}

	userIDStr := fmt.Sprintf("%v", userID)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"code":    http.StatusUnauthorized,
			"message": "sesi tidak valid",
		})
		return
	}

	// Parse request body
	var req salah_rekam.CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "format permintaan tidak valid: " + err.Error(),
		})
		return
	}

	// Validate request
	if err := salah_rekam.ValidateCreateRequest(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": err.Error(),
		})
		return
	}

	// Call service
	record, err := h.service.CreateRecord(c, userIDStr, &req)
	if err != nil {
		logrus.WithError(err).Error("[salah_rekam] Create record failed")
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

// UpdateRecord handles PUT /api/v1/salah-rekam/:id
func (h *SalahRekamHandler) UpdateRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID tidak boleh kosong",
		})
		return
	}

	// Validate ID
	if err := salah_rekam.ValidateID(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": err.Error(),
		})
		return
	}

	// Parse request body
	var req salah_rekam.UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "format permintaan tidak valid: " + err.Error(),
		})
		return
	}

	// Validate request
	if err := salah_rekam.ValidateUpdateRequest(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": err.Error(),
		})
		return
	}

	// Call service
	record, err := h.service.UpdateRecord(c, id, &req)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"code":    http.StatusNotFound,
				"message": "data tidak ditemukan",
			})
			return
		}
		logrus.WithError(err).Errorf("[salah_rekam] Update record failed for ID: %s", id)
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal mengubah data: " + err.Error(),
		})
		return
	}

	// Return successful response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"code":    http.StatusOK,
		"message": "data berhasil diubah",
		"data":    record,
	})
}

// DeleteRecord handles DELETE /api/v1/salah-rekam/:id
func (h *SalahRekamHandler) DeleteRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID tidak boleh kosong",
		})
		return
	}

	// Validate ID
	if err := salah_rekam.ValidateID(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": err.Error(),
		})
		return
	}

	// Call service
	if err := h.service.DeleteRecord(c, id); err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"code":    http.StatusNotFound,
				"message": "data tidak ditemukan",
			})
			return
		}
		logrus.WithError(err).Errorf("[salah_rekam] Delete record failed for ID: %s", id)
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

// SearchRecords handles GET /api/v1/salah-rekam/search
func (h *SalahRekamHandler) SearchRecords(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "parameter pencarian tidak boleh kosong",
		})
		return
	}

	// Build filters
	filters := make(map[string]interface{})

	// Call service
	records, err := h.service.SearchRecords(c, query, filters)
	if err != nil {
		logrus.WithError(err).Errorf("[salah_rekam] Search failed for query: %s", query)
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "pencarian gagal: " + err.Error(),
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

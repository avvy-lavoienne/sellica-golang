package aktivitas_siak

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// HTTPHandlers handles HTTP requests for aktivitas_siak operations
type HTTPHandlers struct {
	service Service
	logger  *logrus.Logger
}

// NewHTTPHandlers creates a new HTTP handlers instance
func NewHTTPHandlers(service Service, logger *logrus.Logger) (*HTTPHandlers, error) {
	if service == nil {
		return nil, errors.New("service is required")
	}
	if logger == nil {
		return nil, errors.New("logger is required")
	}

	return &HTTPHandlers{
		service: service,
		logger:  logger,
	}, nil
}

// CreateRecord handles POST /api/v1/aktivitas-siak
func (h *HTTPHandlers) CreateRecord(c *gin.Context) {
	var req AktivitasSiakCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Data tidak valid",
			"detail": err.Error(),
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Anda harus login terlebih dahulu",
		})
		return
	}

	// Create record
	record, err := h.service.Create(c.Request.Context(), userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    record,
		"message": "Data aktivitas berhasil disimpan",
	})
}

// GetRecord handles GET /api/v1/aktivitas-siak/:id
func (h *HTTPHandlers) GetRecord(c *gin.Context) {
	// Get UUID string directly from path parameter
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID tidak valid",
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Anda harus login terlebih dahulu",
		})
		return
	}

	isAdmin, _ := c.Get("is_admin")
	isAdminBool := isAdmin != nil && isAdmin.(bool)

	record, err := h.service.GetByID(c.Request.Context(), userID.(string), id, isAdminBool)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": record,
	})
}

// ListRecords handles GET /api/v1/aktivitas-siak with pagination
func (h *HTTPHandlers) ListRecords(c *gin.Context) {
	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	pageSize := 20
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Anda harus login terlebih dahulu",
		})
		return
	}

	isAdmin, _ := c.Get("is_admin")
	isAdminBool := isAdmin != nil && isAdmin.(bool)

	response, err := h.service.List(c.Request.Context(), userID.(string), isAdminBool, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateRecord handles PUT /api/v1/aktivitas-siak/:id
func (h *HTTPHandlers) UpdateRecord(c *gin.Context) {
	// Get UUID string directly from path parameter
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID tidak valid",
		})
		return
	}

	var req AktivitasSiakUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Data tidak valid",
			"detail": err.Error(),
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Anda harus login terlebih dahulu",
		})
		return
	}

	isAdmin, _ := c.Get("is_admin")
	isAdminBool := isAdmin != nil && isAdmin.(bool)

	record, err := h.service.Update(c.Request.Context(), userID.(string), id, &req, isAdminBool)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    record,
		"message": "Data aktivitas berhasil diperbarui",
	})
}

// DeleteRecord handles DELETE /api/v1/aktivitas-siak/:id
func (h *HTTPHandlers) DeleteRecord(c *gin.Context) {
	// Get UUID string directly from path parameter
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID tidak valid",
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Anda harus login terlebih dahulu",
		})
		return
	}

	isAdmin, _ := c.Get("is_admin")
	isAdminBool := isAdmin != nil && isAdmin.(bool)

	err := h.service.Delete(c.Request.Context(), userID.(string), id, isAdminBool)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data aktivitas berhasil dihapus",
	})
}

// CheckDuplicate handles POST /api/v1/aktivitas-siak/check-duplicate
func (h *HTTPHandlers) CheckDuplicate(c *gin.Context) {
	var req DuplicateCheckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Data tidak valid",
			"detail": err.Error(),
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Anda harus login terlebih dahulu",
		})
		return
	}

	// Call service with single bulan_rekapitulasi parameter (string like "Oktober 2025")
	response, err := h.service.CheckDuplicate(c.Request.Context(), userID.(string), req.BulanRekapitulasi)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetStatistics handles GET /api/v1/aktivitas-siak/statistics
func (h *HTTPHandlers) GetStatistics(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Anda harus login terlebih dahulu",
		})
		return
	}

	isAdmin, _ := c.Get("is_admin")
	isAdminBool := isAdmin != nil && isAdmin.(bool)

	stats, err := h.service.GetStatistics(c.Request.Context(), userID.(string), isAdminBool)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
	})
}

// Health handles GET /api/v1/aktivitas-siak/health
func (h *HTTPHandlers) Health(c *gin.Context) {
	health := h.service.Health(c.Request.Context())
	c.JSON(http.StatusOK, health)
}

// RegisterRoutes registers all aktivitas_siak routes with the provided router
func (h *HTTPHandlers) RegisterRoutes(router *gin.Engine) {
	// Public health check
	router.GET("/api/v1/aktivitas-siak/health", h.Health)

	// Protected routes (require authentication)
	protected := router.Group("/api/v1/aktivitas-siak")

	// Create
	protected.POST("", h.CreateRecord)

	// Read
	protected.GET("", h.ListRecords)
	protected.GET("/:id", h.GetRecord)
	protected.POST("/check-duplicate", h.CheckDuplicate)
	protected.GET("/statistics", h.GetStatistics)

	// Update
	protected.PUT("/:id", h.UpdateRecord)

	// Delete
	protected.DELETE("/:id", h.DeleteRecord)
}

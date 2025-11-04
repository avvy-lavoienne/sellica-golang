package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/database"
)

// DataRekamHandler handles data-rekam related HTTP requests
type DataRekamHandler struct {
	dbService *database.Service
}

// NewDataRekamHandler creates a new DataRekamHandler
func NewDataRekamHandler(dbService *database.Service) *DataRekamHandler {
	return &DataRekamHandler{
		dbService: dbService,
	}
}

// DataRekamResponse represents a standard data-rekam API response
type DataRekamResponse struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data,omitempty"`
	TotalCount int         `json:"total_count,omitempty"`
	Page       int         `json:"page,omitempty"`
	PageSize   int         `json:"page_size,omitempty"`
	Error      string      `json:"error,omitempty"`
	Message    string      `json:"message,omitempty"`
}

// GetAdjudicateRecords handles GET /data-rekam/adjudicate
// Retrieves adjudicate record list with authorization
func (h *DataRekamHandler) GetAdjudicateRecords(c *gin.Context) {
	// Extract user info from auth context
	userID, exists := c.Get("user_id")
	if !exists {
		logrus.Warn("User ID not found in context for adjudicate records request")
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	// Extract user NIK for ownership filtering
	userNIK, _ := c.Get("user_nik")
	userNIKStr := ""
	if userNIK != nil {
		userNIKStr = userNIK.(string)
	}

	// Check if user is admin
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	// Parse query parameters
	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	pageSize := 10
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	statusFilter := c.Query("status") // "all", "completed", "pending"
	if statusFilter == "" {
		statusFilter = "all"
	}

	searchQuery := c.Query("search")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// Create filter
	filter := database.DataRekamFilter{
		Page:         page,
		PageSize:     pageSize,
		StatusFilter: statusFilter,
		SearchQuery:  searchQuery,
		UserNik:      userNIKStr,
		IsAdmin:      isAdmin,
	}

	if startDate != "" {
		filter.StartDate = &startDate
	}
	if endDate != "" {
		filter.EndDate = &endDate
	}

	// Get records from database
	result, err := h.dbService.GetAdjudicateRecordList(c.Request.Context(), filter)
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"user_id": userID,
			"page":    page,
		}).Error("Failed to retrieve adjudicate records")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal mengambil data",
		})
		return
	}

	// Log successful retrieval
	logrus.WithFields(logrus.Fields{
		"user_id":     userID,
		"total_count": result.TotalCount,
		"page":        page,
		"is_admin":    isAdmin,
	}).Debug("Retrieved adjudicate records")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success:    true,
		Data:       result.Data,
		TotalCount: result.TotalCount,
		Page:       page,
		PageSize:   pageSize,
	})
}

// GetDuplicateOperatorRecords handles GET /data-rekam/duplicate-operator
// Retrieves duplicate operator list with authorization
func (h *DataRekamHandler) GetDuplicateOperatorRecords(c *gin.Context) {
	// Extract user info from auth context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	// Extract user NIK
	userNIK, _ := c.Get("user_nik")
	userNIKStr := ""
	if userNIK != nil {
		userNIKStr = userNIK.(string)
	}

	// Check if user is admin
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	// Parse query parameters
	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	pageSize := 10
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	statusFilter := c.Query("status")
	if statusFilter == "" {
		statusFilter = "all"
	}

	searchQuery := c.Query("search")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	filter := database.DataRekamFilter{
		Page:         page,
		PageSize:     pageSize,
		StatusFilter: statusFilter,
		SearchQuery:  searchQuery,
		UserNik:      userNIKStr,
		IsAdmin:      isAdmin,
	}

	if startDate != "" {
		filter.StartDate = &startDate
	}
	if endDate != "" {
		filter.EndDate = &endDate
	}

	result, err := h.dbService.GetDuplicateOperatorList(c.Request.Context(), filter)
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"user_id": userID,
			"page":    page,
		}).Error("Failed to retrieve duplicate operator records")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal mengambil data",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id":     userID,
		"total_count": result.TotalCount,
		"page":        page,
		"is_admin":    isAdmin,
	}).Debug("Retrieved duplicate operator records")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success:    true,
		Data:       result.Data,
		TotalCount: result.TotalCount,
		Page:       page,
		PageSize:   pageSize,
	})
}

// GetPengajuanBulananRecords handles GET /data-rekam/pengajuan-bulanan
// Retrieves pengajuan bulanan list with authorization
func (h *DataRekamHandler) GetPengajuanBulananRecords(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	userNIK, _ := c.Get("user_nik")
	userNIKStr := ""
	if userNIK != nil {
		userNIKStr = userNIK.(string)
	}

	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	pageSize := 10
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	statusFilter := c.Query("status")
	if statusFilter == "" {
		statusFilter = "all"
	}

	searchQuery := c.Query("search")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	filter := database.DataRekamFilter{
		Page:         page,
		PageSize:     pageSize,
		StatusFilter: statusFilter,
		SearchQuery:  searchQuery,
		UserNik:      userNIKStr,
		IsAdmin:      isAdmin,
	}

	if startDate != "" {
		filter.StartDate = &startDate
	}
	if endDate != "" {
		filter.EndDate = &endDate
	}

	result, err := h.dbService.GetPengajuanBulananList(c.Request.Context(), filter)
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"user_id": userID,
			"page":    page,
		}).Error("Failed to retrieve pengajuan bulanan records")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal mengambil data",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id":     userID,
		"total_count": result.TotalCount,
		"page":        page,
		"is_admin":    isAdmin,
	}).Debug("Retrieved pengajuan bulanan records")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success:    true,
		Data:       result.Data,
		TotalCount: result.TotalCount,
		Page:       page,
		PageSize:   pageSize,
	})
}

// GetSalahRekamRecords handles GET /data-rekam/salah-rekam
// Retrieves salah rekam list with authorization
func (h *DataRekamHandler) GetSalahRekamRecords(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	userNIK, _ := c.Get("user_nik")
	userNIKStr := ""
	if userNIK != nil {
		userNIKStr = userNIK.(string)
	}

	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	pageSize := 10
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	statusFilter := c.Query("status")
	if statusFilter == "" {
		statusFilter = "all"
	}

	searchQuery := c.Query("search")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	filter := database.DataRekamFilter{
		Page:         page,
		PageSize:     pageSize,
		StatusFilter: statusFilter,
		SearchQuery:  searchQuery,
		UserNik:      userNIKStr,
		IsAdmin:      isAdmin,
	}

	if startDate != "" {
		filter.StartDate = &startDate
	}
	if endDate != "" {
		filter.EndDate = &endDate
	}

	result, err := h.dbService.GetSalahRekamList(c.Request.Context(), filter)
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"user_id": userID,
			"page":    page,
		}).Error("Failed to retrieve salah rekam records")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal mengambil data",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id":     userID,
		"total_count": result.TotalCount,
		"page":        page,
		"is_admin":    isAdmin,
	}).Debug("Retrieved salah rekam records")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success:    true,
		Data:       result.Data,
		TotalCount: result.TotalCount,
		Page:       page,
		PageSize:   pageSize,
	})
}

// GetDashboardStats handles GET /data-rekam/dashboard-stats
// Retrieves aggregated statistics for all data-rekam tables
func (h *DataRekamHandler) GetDashboardStats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	// Parse optional date filters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var startDatePtr, endDatePtr *string
	if startDate != "" {
		startDatePtr = &startDate
	}
	if endDate != "" {
		endDatePtr = &endDate
	}

	stats, err := h.dbService.GetDashboardStats(c.Request.Context(), startDatePtr, endDatePtr)
	if err != nil {
		logrus.WithError(err).WithField("user_id", userID).Error("Failed to retrieve dashboard statistics")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal mengambil statistik",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id": userID,
	}).Debug("Retrieved dashboard statistics")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Data:    stats,
	})
}

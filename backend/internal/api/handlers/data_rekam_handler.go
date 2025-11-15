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

// UpdateRequest represents the payload for toggle-status and update-date endpoints
type UpdateRequest struct {
	ID                            string `json:"id" binding:"required"`
	IsReadyToRecord               *bool  `json:"is_ready_to_record"`
	EstimasiTanggalPerekaman      *string `json:"estimasi_tanggal_perekaman"`
}

// ToggleAdjudicateRecordStatus handles PATCH /api/v1/data-rekam/adjudicate/:id/toggle-status
func (h *DataRekamHandler) ToggleAdjudicateRecordStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check admin role
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	if !isAdmin {
		logrus.WithField("user_id", userID).Warn("Non-admin attempted to toggle adjudicate record status")
		c.JSON(http.StatusForbidden, DataRekamResponse{
			Success: false,
			Error:   "Only admins can update status",
		})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: id and is_ready_to_record are required",
		})
		return
	}

	// Validate that IsReadyToRecord is provided and not nil
	if req.IsReadyToRecord == nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: is_ready_to_record is required",
		})
		return
	}

	// Update database using Supabase
	client := h.dbService.GetClient()
	if client == nil {
		logrus.Error("Supabase client not initialized")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan",
		})
		return
	}

	_, _, err := client.From("adjudicate_record").
		Update(map[string]interface{}{
			"is_ready_to_record": *req.IsReadyToRecord,
		}, "", "").
		Eq("id", req.ID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"record_id": req.ID,
			"user_id":   userID,
		}).Error("Failed to update adjudicate record status")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan status",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id": req.ID,
		"status":    req.IsReadyToRecord,
		"user_id":   userID,
	}).Info("Adjudicate record status updated")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Message: "Status berhasil diperbarui",
	})
}

// UpdateAdjudicateRecordDate handles PATCH /api/v1/data-rekam/adjudicate/:id/update-date
func (h *DataRekamHandler) UpdateAdjudicateRecordDate(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check admin role
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	if !isAdmin {
		logrus.WithField("user_id", userID).Warn("Non-admin attempted to update adjudicate record date")
		c.JSON(http.StatusForbidden, DataRekamResponse{
			Success: false,
			Error:   "Only admins can update dates",
		})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: id and estimasi_tanggal_perekaman are required",
		})
		return
	}

	// Validate that EstimasiTanggalPerekaman is provided and not nil
	if req.EstimasiTanggalPerekaman == nil || *req.EstimasiTanggalPerekaman == "" {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: estimasi_tanggal_perekaman is required",
		})
		return
	}

	// Validate date format (YYYY-MM-DD)
	dateStr := *req.EstimasiTanggalPerekaman
	if len(dateStr) != 10 || dateStr[4] != '-' || dateStr[7] != '-' {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid date format: use YYYY-MM-DD",
		})
		return
	}

	client := h.dbService.GetClient()
	if client == nil {
		logrus.Error("Supabase client not initialized")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan",
		})
		return
	}

	_, _, err := client.From("adjudicate_record").
		Update(map[string]interface{}{
			"estimasi_tanggal_perekaman": dateStr,
		}, "", "").
		Eq("id", req.ID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"record_id": req.ID,
			"date":      dateStr,
			"user_id":   userID,
		}).Error("Failed to update adjudicate record date")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan tanggal",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id": req.ID,
		"date":      dateStr,
		"user_id":   userID,
	}).Info("Adjudicate record date updated")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Message: "Tanggal berhasil diperbarui",
	})
}

// TogglePengajuanBulananStatus handles PATCH /api/v1/data-rekam/pengajuan-bulanan/:id/toggle-status
func (h *DataRekamHandler) TogglePengajuanBulananStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check admin role
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	if !isAdmin {
		logrus.WithField("user_id", userID).Warn("Non-admin attempted to toggle pengajuan bulanan status")
		c.JSON(http.StatusForbidden, DataRekamResponse{
			Success: false,
			Error:   "Only admins can update status",
		})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: id and is_ready_to_record are required",
		})
		return
	}

	// Validate that IsReadyToRecord is provided and not nil
	if req.IsReadyToRecord == nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: is_ready_to_record is required",
		})
		return
	}

	client := h.dbService.GetClient()
	if client == nil {
		logrus.Error("Supabase client not initialized")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan",
		})
		return
	}

	_, _, err := client.From("pengajuan_bulanan").
		Update(map[string]interface{}{
			"is_ready_to_record": *req.IsReadyToRecord,
		}, "", "").
		Eq("id", req.ID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"record_id": req.ID,
			"user_id":   userID,
		}).Error("Failed to update pengajuan bulanan status")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan status",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id": req.ID,
		"status":    req.IsReadyToRecord,
		"user_id":   userID,
	}).Info("Pengajuan bulanan status updated")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Message: "Status berhasil diperbarui",
	})
}

// UpdatePengajuanBulananDate handles PATCH /api/v1/data-rekam/pengajuan-bulanan/:id/update-date
func (h *DataRekamHandler) UpdatePengajuanBulananDate(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check admin role
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	if !isAdmin {
		logrus.WithField("user_id", userID).Warn("Non-admin attempted to update pengajuan bulanan date")
		c.JSON(http.StatusForbidden, DataRekamResponse{
			Success: false,
			Error:   "Only admins can update dates",
		})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: id and estimasi_tanggal_perekaman are required",
		})
		return
	}

	// Validate that EstimasiTanggalPerekaman is provided and not nil
	if req.EstimasiTanggalPerekaman == nil || *req.EstimasiTanggalPerekaman == "" {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: estimasi_tanggal_perekaman is required",
		})
		return
	}

	// Validate date format (YYYY-MM-DD)
	dateStr := *req.EstimasiTanggalPerekaman
	if len(dateStr) != 10 || dateStr[4] != '-' || dateStr[7] != '-' {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid date format: use YYYY-MM-DD",
		})
		return
	}

	client := h.dbService.GetClient()
	if client == nil {
		logrus.Error("Supabase client not initialized")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan",
		})
		return
	}

	_, _, err := client.From("pengajuan_bulanan").
		Update(map[string]interface{}{
			"estimasi_tanggal_perekaman": dateStr,
		}, "", "").
		Eq("id", req.ID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"record_id": req.ID,
			"date":      dateStr,
			"user_id":   userID,
		}).Error("Failed to update pengajuan bulanan date")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan tanggal",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id": req.ID,
		"date":      dateStr,
		"user_id":   userID,
	}).Info("Pengajuan bulanan date updated")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Message: "Tanggal berhasil diperbarui",
	})
}

// ToggleDuplicateOperatorStatus handles PATCH /api/v1/data-rekam/duplicate-operator/:id/toggle-status
func (h *DataRekamHandler) ToggleDuplicateOperatorStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check admin role
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	if !isAdmin {
		logrus.WithField("user_id", userID).Warn("Non-admin attempted to toggle duplicate operator status")
		c.JSON(http.StatusForbidden, DataRekamResponse{
			Success: false,
			Error:   "Only admins can update status",
		})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: id and is_ready_to_record are required",
		})
		return
	}

	// Validate that IsReadyToRecord is provided and not nil
	if req.IsReadyToRecord == nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: is_ready_to_record is required",
		})
		return
	}

	client := h.dbService.GetClient()
	if client == nil {
		logrus.Error("Supabase client not initialized")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan",
		})
		return
	}

	_, _, err := client.From("duplicate_operator").
		Update(map[string]interface{}{
			"is_ready_to_record": *req.IsReadyToRecord,
		}, "", "").
		Eq("id", req.ID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"record_id": req.ID,
			"user_id":   userID,
		}).Error("Failed to update duplicate operator status")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan status",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id": req.ID,
		"status":    req.IsReadyToRecord,
		"user_id":   userID,
	}).Info("Duplicate operator status updated")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Message: "Status berhasil diperbarui",
	})
}

// UpdateDuplicateOperatorDate handles PATCH /api/v1/data-rekam/duplicate-operator/:id/update-date
func (h *DataRekamHandler) UpdateDuplicateOperatorDate(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check admin role
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	if !isAdmin {
		logrus.WithField("user_id", userID).Warn("Non-admin attempted to update duplicate operator date")
		c.JSON(http.StatusForbidden, DataRekamResponse{
			Success: false,
			Error:   "Only admins can update dates",
		})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: id and estimasi_tanggal_perekaman are required",
		})
		return
	}

	// Validate that EstimasiTanggalPerekaman is provided and not nil
	if req.EstimasiTanggalPerekaman == nil || *req.EstimasiTanggalPerekaman == "" {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: estimasi_tanggal_perekaman is required",
		})
		return
	}

	// Validate date format (YYYY-MM-DD)
	dateStr := *req.EstimasiTanggalPerekaman
	if len(dateStr) != 10 || dateStr[4] != '-' || dateStr[7] != '-' {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid date format: use YYYY-MM-DD",
		})
		return
	}

	client := h.dbService.GetClient()
	if client == nil {
		logrus.Error("Supabase client not initialized")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan",
		})
		return
	}

	_, _, err := client.From("duplicate_operator").
		Update(map[string]interface{}{
			"estimasi_tanggal_perekaman": dateStr,
		}, "", "").
		Eq("id", req.ID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"record_id": req.ID,
			"date":      dateStr,
			"user_id":   userID,
		}).Error("Failed to update duplicate operator date")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan tanggal",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id": req.ID,
		"date":      dateStr,
		"user_id":   userID,
	}).Info("Duplicate operator date updated")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Message: "Tanggal berhasil diperbarui",
	})
}

// ToggleSalahRekamStatus handles PATCH /api/v1/data-rekam/salah-rekam/:id/toggle-status
func (h *DataRekamHandler) ToggleSalahRekamStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check admin role
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	if !isAdmin {
		logrus.WithField("user_id", userID).Warn("Non-admin attempted to toggle salah rekam status")
		c.JSON(http.StatusForbidden, DataRekamResponse{
			Success: false,
			Error:   "Only admins can update status",
		})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: id and is_ready_to_record are required",
		})
		return
	}

	// Validate that IsReadyToRecord is provided and not nil
	if req.IsReadyToRecord == nil {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: is_ready_to_record is required",
		})
		return
	}

	client := h.dbService.GetClient()
	if client == nil {
		logrus.Error("Supabase client not initialized")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan",
		})
		return
	}

	_, _, err := client.From("salah_rekam").
		Update(map[string]interface{}{
			"is_ready_to_record": *req.IsReadyToRecord,
		}, "", "").
		Eq("id", req.ID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"record_id": req.ID,
			"user_id":   userID,
		}).Error("Failed to update salah rekam status")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan status",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id": req.ID,
		"status":    req.IsReadyToRecord,
		"user_id":   userID,
	}).Info("Salah rekam status updated")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Message: "Status berhasil diperbarui",
	})
}

// UpdateSalahRekamDate handles PATCH /api/v1/data-rekam/salah-rekam/:id/update-date
func (h *DataRekamHandler) UpdateSalahRekamDate(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, DataRekamResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check admin role
	isAdmin := false
	if role, exists := c.Get("user_role"); exists {
		roleStr := role.(string)
		isAdmin = roleStr == "admin" || roleStr == "superuser"
	}

	if !isAdmin {
		logrus.WithField("user_id", userID).Warn("Non-admin attempted to update salah rekam date")
		c.JSON(http.StatusForbidden, DataRekamResponse{
			Success: false,
			Error:   "Only admins can update dates",
		})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Error("[UpdateSalahRekamDate] Failed to bind JSON request")
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: id and estimasi_tanggal_perekaman are required",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id":      req.ID,
		"date_field":     req.EstimasiTanggalPerekaman,
		"date_is_nil":    req.EstimasiTanggalPerekaman == nil,
	}).Debug("[UpdateSalahRekamDate] Received update-date request")

	// Validate that EstimasiTanggalPerekaman is provided and not nil
	if req.EstimasiTanggalPerekaman == nil || *req.EstimasiTanggalPerekaman == "" {
		logrus.WithField("record_id", req.ID).Warn("[UpdateSalahRekamDate] Missing estimasi_tanggal_perekaman field")
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid request: estimasi_tanggal_perekaman is required",
		})
		return
	}

	// Validate date format (YYYY-MM-DD)
	dateStr := *req.EstimasiTanggalPerekaman
	if len(dateStr) != 10 || dateStr[4] != '-' || dateStr[7] != '-' {
		c.JSON(http.StatusBadRequest, DataRekamResponse{
			Success: false,
			Error:   "Invalid date format: use YYYY-MM-DD",
		})
		return
	}

	client := h.dbService.GetClient()
	if client == nil {
		logrus.Error("Supabase client not initialized")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan perubahan",
		})
		return
	}

	_, _, err := client.From("salah_rekam").
		Update(map[string]interface{}{
			"estimasi_tanggal_perekaman": dateStr,
		}, "", "").
		Eq("id", req.ID).
		Execute()

	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"record_id": req.ID,
			"date":      dateStr,
			"user_id":   userID,
		}).Error("Failed to update salah rekam date")
		c.JSON(http.StatusInternalServerError, DataRekamResponse{
			Success: false,
			Error:   "Gagal menyimpan tanggal",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"record_id": req.ID,
		"date":      dateStr,
		"user_id":   userID,
	}).Info("Salah rekam date updated")

	c.JSON(http.StatusOK, DataRekamResponse{
		Success: true,
		Message: "Tanggal berhasil diperbarui",
	})
}

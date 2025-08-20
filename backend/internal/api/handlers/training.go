package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/training"
)

// TrainingHandler handles training data API endpoints
type TrainingHandler struct {
	trainingService *training.Service
}

// NewTrainingHandler creates a new training handler
func NewTrainingHandler(trainingService *training.Service) *TrainingHandler {
	return &TrainingHandler{
		trainingService: trainingService,
	}
}

// RegisterRoutes registers training data routes
func (h *TrainingHandler) RegisterRoutes(r *gin.RouterGroup) {
	trainingGroup := r.Group("/training-data")
	{
		trainingGroup.POST("", h.SubmitTrainingData)           // Submit training data
		trainingGroup.GET("", h.GetTrainingData)               // Retrieve training data
		trainingGroup.POST("/enhanced", h.SubmitEnhancedData)  // Submit enhanced training data
		trainingGroup.GET("/enhanced", h.GetEnhancedData)      // Retrieve enhanced training data
		trainingGroup.GET("/stats", h.GetTrainingStats)        // Training statistics
		trainingGroup.GET("/suggestions", h.GetTrainingSuggestions) // Training suggestions
	}
}

// SubmitTrainingData handles POST /training-data
func (h *TrainingHandler) SubmitTrainingData(c *gin.Context) {
	var req training.TrainingData
	
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Error("Failed to bind training data request")
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Extract user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if exists {
		if uid, ok := userID.(string); ok {
			req.UserID = uid
		}
	}

	// Submit training data
	if err := h.trainingService.SubmitTrainingData(c.Request.Context(), &req); err != nil {
		logrus.WithError(err).Error("Failed to submit training data")
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to submit training data",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Training data submitted successfully",
		"data": gin.H{
			"id":         req.ID,
			"status":     req.Status,
			"timestamp":  req.Timestamp,
		},
	})
}

// GetTrainingData handles GET /training-data
func (h *TrainingHandler) GetTrainingData(c *gin.Context) {
	// Parse query parameters
	req := &training.TrainingDataRequest{}

	// Extract user ID from context
	userID, exists := c.Get("user_id")
	if exists {
		if uid, ok := userID.(string); ok {
			req.UserID = uid
		}
	}

	// Parse optional parameters
	if sessionID := c.Query("session_id"); sessionID != "" {
		req.SessionID = sessionID
	}
	if serviceType := c.Query("service_type"); serviceType != "" {
		req.ServiceType = serviceType
	}
	if status := c.Query("status"); status != "" {
		req.Status = training.TrainingStatus(status)
	}

	// Parse date parameters
	if startDate := c.Query("start_date"); startDate != "" {
		if parsed, err := time.Parse("2006-01-02", startDate); err == nil {
			req.StartDate = &parsed
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if parsed, err := time.Parse("2006-01-02", endDate); err == nil {
			req.EndDate = &parsed
		}
	}

	// Parse pagination parameters
	if limit := c.Query("limit"); limit != "" {
		if parsed, err := strconv.Atoi(limit); err == nil && parsed > 0 {
			req.Limit = parsed
		}
	}
	if req.Limit == 0 {
		req.Limit = 50 // default limit
	}

	if offset := c.Query("offset"); offset != "" {
		if parsed, err := strconv.Atoi(offset); err == nil && parsed >= 0 {
			req.Offset = parsed
		}
	}

	// Parse quality filter
	if minQuality := c.Query("min_quality"); minQuality != "" {
		if parsed, err := strconv.ParseFloat(minQuality, 64); err == nil {
			req.MinQuality = parsed
		}
	}

	// Get training data
	response, err := h.trainingService.GetTrainingData(c.Request.Context(), req)
	if err != nil {
		logrus.WithError(err).Error("Failed to get training data")
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to retrieve training data",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response.Data,
		"pagination": gin.H{
			"total":     response.Total,
			"page":      response.Page,
			"page_size": response.PageSize,
			"has_more":  response.HasMore,
		},
	})
}

// SubmitEnhancedData handles POST /training-data/enhanced
func (h *TrainingHandler) SubmitEnhancedData(c *gin.Context) {
	var req training.TrainingData
	
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Error("Failed to bind enhanced training data request")
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Extract user ID from context
	userID, exists := c.Get("user_id")
	if exists {
		if uid, ok := userID.(string); ok {
			req.UserID = uid
		}
	}

	// Mark as enhanced mode in metadata
	if req.Metadata.EnhancementMode == false {
		req.Metadata.EnhancementMode = true
	}

	// Submit enhanced training data
	if err := h.trainingService.SubmitTrainingData(c.Request.Context(), &req); err != nil {
		logrus.WithError(err).Error("Failed to submit enhanced training data")
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to submit enhanced training data",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Enhanced training data submitted successfully",
		"data": gin.H{
			"id":              req.ID,
			"status":          req.Status,
			"timestamp":       req.Timestamp,
			"enhancement_mode": true,
		},
	})
}

// GetEnhancedData handles GET /training-data/enhanced
func (h *TrainingHandler) GetEnhancedData(c *gin.Context) {
	// Parse query parameters similar to GetTrainingData
	req := &training.TrainingDataRequest{}

	// Extract user ID from context
	userID, exists := c.Get("user_id")
	if exists {
		if uid, ok := userID.(string); ok {
			req.UserID = uid
		}
	}

	// Parse parameters (similar to GetTrainingData)
	if sessionID := c.Query("session_id"); sessionID != "" {
		req.SessionID = sessionID
	}
	if serviceType := c.Query("service_type"); serviceType != "" {
		req.ServiceType = serviceType
	}

	// Parse pagination
	if limit := c.Query("limit"); limit != "" {
		if parsed, err := strconv.Atoi(limit); err == nil && parsed > 0 {
			req.Limit = parsed
		}
	}
	if req.Limit == 0 {
		req.Limit = 50
	}

	if offset := c.Query("offset"); offset != "" {
		if parsed, err := strconv.Atoi(offset); err == nil && parsed >= 0 {
			req.Offset = parsed
		}
	}

	// Get enhanced training data
	response, err := h.trainingService.GetTrainingData(c.Request.Context(), req)
	if err != nil {
		logrus.WithError(err).Error("Failed to get enhanced training data")
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to retrieve enhanced training data",
			"details": err.Error(),
		})
		return
	}

	// Filter for enhanced data only
	enhancedData := make([]training.TrainingData, 0)
	for _, item := range response.Data {
		if item.Metadata.EnhancementMode {
			enhancedData = append(enhancedData, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    enhancedData,
		"pagination": gin.H{
			"total":     len(enhancedData),
			"page":      response.Page,
			"page_size": response.PageSize,
			"has_more":  len(enhancedData) == response.PageSize,
		},
	})
}

// GetTrainingStats handles GET /training-data/stats
func (h *TrainingHandler) GetTrainingStats(c *gin.Context) {
	stats, err := h.trainingService.GetTrainingStats(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to get training stats")
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to retrieve training statistics",
			"details": err.Error(),
		})
		return
	}

	// Add service performance stats
	serviceStats := h.trainingService.GetServiceStats()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
		"service_performance": gin.H{
			"total_submissions":      serviceStats.TotalSubmissions,
			"successful_inserts":     serviceStats.SuccessfulInserts,
			"failed_inserts":         serviceStats.FailedInserts,
			"cache_hits":             serviceStats.CacheHits,
			"cache_misses":           serviceStats.CacheMisses,
			"average_processing_time": serviceStats.AverageProcessingTime,
			"last_updated":           serviceStats.LastUpdated,
		},
	})
}

// GetTrainingSuggestions handles GET /training-data/suggestions
func (h *TrainingHandler) GetTrainingSuggestions(c *gin.Context) {
	suggestions, err := h.trainingService.GetTrainingSuggestions(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to get training suggestions")
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to retrieve training suggestions",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    suggestions.Suggestions,
		"meta": gin.H{
			"total":     suggestions.Total,
			"generated": suggestions.Generated,
		},
	})
}

package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/api/middleware"
	"selly-backend/internal/config"
	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/chat"
	"selly-backend/internal/services/monitoring"
	"selly-backend/internal/services/persona"
	"selly-backend/pkg/errors"
)

// ChatHandler handles chat-related endpoints
type ChatHandler struct {
	chatService  *chat.Service
	monitoring   *monitoring.Service
	featureFlags *config.FeatureFlags
	personaService *persona.PersonaService
}

// NewChatHandler creates a new chat handler
func NewChatHandler(chatService *chat.Service, monitoring *monitoring.Service) *ChatHandler {
	return &ChatHandler{
		chatService:   chatService,
		monitoring:    monitoring,
		featureFlags:  config.GetFeatureFlags(),
		personaService: persona.GetGlobalPersonaService(),
	}
}

// ProcessChat handles POST /chat - Core chat processing endpoint
func (h *ChatHandler) ProcessChat(c *gin.Context) {
	startTime := time.Now()

	// Get authentication context
	authContext, exists := middleware.GetAuthContext(c)
	if !exists {
		// For compatibility, create a guest context if no auth
		authContext = &auth.AuthContext{
			UserID: "guest_" + strconv.FormatInt(time.Now().UnixNano(), 10),
			Email:  "",
			Role:   "guest",
		}
	}

	// Parse request
	var req chat.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("🚫 Invalid chat request format")
		
		appErr := errors.NewValidationError("Invalid request format", err.Error())
		c.JSON(appErr.StatusCode, errors.GetErrorResponse(appErr))
		return
	}

	// Validate message
	if req.Message == "" {
		logrus.Warn("🚫 Empty message in chat request")
		
		appErr := errors.NewValidationError("Message is required and cannot be empty", "INVALID_MESSAGE")
		c.JSON(appErr.StatusCode, errors.GetErrorResponse(appErr))
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id":    authContext.UserID,
		"session_id": req.SessionID,
		"message":    req.Message[:min(50, len(req.Message))] + "...",
		"phase1_enabled": h.featureFlags.IsPhase1Enabled(),
		"phase2_enabled": h.featureFlags.IsPhase2Enabled(),
	}).Info("💬 Processing chat request")

	// Process chat message
	response, err := h.chatService.ProcessChat(c.Request.Context(), &req, authContext)
	if err != nil {
		logrus.WithError(err).Error("❌ Chat processing failed")
		
		// Record error metrics
		if h.monitoring != nil {
			h.monitoring.RecordError()
		}

		// Return Indonesian error message for compatibility
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Terjadi kesalahan saat memproses permintaan Anda",
			"details": err.Error(),
			"code":    "CHAT_PROCESSING_FAILED",
			"fallback": gin.H{
				"message":    "Maaf, terjadi kesalahan dalam memproses pesan Anda. Silakan coba lagi dalam beberapa saat.",
				"type":       "text",
				"confidence": 0.1,
			},
		})
		return
	}

	// Record metrics
	if h.monitoring != nil {
		h.monitoring.RecordRequest(time.Since(startTime))
	}

	// Detect user region from context (IP geolocation, user preferences, etc.)
	userRegion := h.detectUserRegion(req)

	// Add regional metadata to response data
	regionalMetadata := map[string]interface{}{
		"region_detected": userRegion,
		"regional_enabled": h.featureFlags.IsRegionalAdapterEnabled(),
	}

	// Apply regional adaptations if enabled (metadata only for now)
	if h.featureFlags.IsRegionalAdapterEnabled() && userRegion != "" {
		regionalResponse, err := h.personaService.ProcessRegionalAdaptation(
			c.Request.Context(),
			"", // Empty query for metadata-only processing
			userRegion,
			map[string]interface{}{
				"user_id":    authContext.UserID,
				"session_id": req.SessionID,
				"timestamp":  time.Now(),
			},
		)

		if err == nil && regionalResponse != nil {
			regionalMetadata["region_applied"] = regionalResponse.RegionApplied
			regionalMetadata["cultural_elements"] = regionalResponse.CulturalElements
			regionalMetadata["regional_confidence"] = regionalResponse.Confidence
			regionalMetadata["regional_processing_time_ms"] = regionalResponse.ProcessingTime.Milliseconds()
		}
	}

	// Add Phase 2 feature flag metadata to response
	featureFlags := map[string]interface{}{
		"phase1_enabled": h.featureFlags.IsPhase1Enabled(),
		"phase2_enabled": h.featureFlags.IsPhase2Enabled(),
		"regional_adapter": h.featureFlags.IsRegionalAdapterEnabled(),
		"religious_calendar": h.featureFlags.IsReligiousCalendarEnabled(),
		"face_saving": h.featureFlags.IsFaceSavingEnabled(),
		"enhanced_fallback": h.featureFlags.IsEnhancedFallbackEnabled(),
		"low_confidence_handling": h.featureFlags.IsLowConfidenceHandlingEnabled(),
		// Regional rollout status
		"jakarta_regional": h.featureFlags.IsJakartaRegionalEnabled(),
		"jawa_barat_regional": h.featureFlags.IsJawaBaratRegionalEnabled(),
		"sunda_regional": h.featureFlags.IsSundaRegionalEnabled(),
		"bali_regional": h.featureFlags.IsBaliRegionalEnabled(),
		"sumatra_regional": h.featureFlags.IsSumatraRegionalEnabled(),
		"kalimantan_regional": h.featureFlags.IsKalimantanRegionalEnabled(),
		"sulawesi_regional": h.featureFlags.IsSulawesiRegionalEnabled(),
		"papua_regional": h.featureFlags.IsPapuaRegionalEnabled(),
	}

	// Add feature flags and regional metadata to response Data field
	if response.Data == nil {
		response.Data = make(map[string]interface{})
	}
	response.Data["feature_flags"] = featureFlags
	response.Data["regional_metadata"] = regionalMetadata

	logrus.WithFields(logrus.Fields{
		"user_id":         authContext.UserID,
		"session_id":      response.Metadata.SessionID,
		"processing_time": response.Metadata.ProcessingTime,
		"confidence":      response.Metadata.Confidence,
		"phase1_enabled":  h.featureFlags.IsPhase1Enabled(),
		"phase2_enabled":  h.featureFlags.IsPhase2Enabled(),
	}).Info("✅ Chat request processed successfully")

	c.JSON(http.StatusOK, response)
}

// ProcessSessionChat handles POST /chat/session - Session-aware chat processing
func (h *ChatHandler) ProcessSessionChat(c *gin.Context) {
	startTime := time.Now()

	// Get authentication context
	authContext, exists := middleware.GetAuthContext(c)
	if !exists {
		authContext = &auth.AuthContext{
			UserID: "guest_" + strconv.FormatInt(time.Now().UnixNano(), 10),
			Email:  "",
			Role:   "guest",
		}
	}

	// Parse request
	var req chat.SessionChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("🚫 Invalid session chat request format")
		
		appErr := errors.NewValidationError("Invalid request format", err.Error())
		c.JSON(appErr.StatusCode, errors.GetErrorResponse(appErr))
		return
	}

	// Validate message
	if req.Message == "" {
		logrus.Warn("🚫 Empty message in session chat request")
		
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Message is required and cannot be empty",
			"code":  "INVALID_MESSAGE",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id":    authContext.UserID,
		"session_id": req.SessionID,
		"message":    req.Message[:min(50, len(req.Message))] + "...",
	}).Info("💬 Processing session-aware chat request")

	// Process session chat message
	response, err := h.chatService.ProcessSessionChat(c.Request.Context(), &req, authContext)
	if err != nil {
		logrus.WithError(err).Error("❌ Session chat processing failed")
		
		// Record error metrics
		if h.monitoring != nil {
			h.monitoring.RecordError()
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to process chat message",
			"code":    "CHAT_PROCESSING_FAILED",
			"message": err.Error(),
			"fallback": gin.H{
				"message":    "Maaf, terjadi kesalahan dalam memproses pesan Anda. Silakan coba lagi dalam beberapa saat.",
				"type":       "text",
				"confidence": 0.1,
			},
		})
		return
	}

	// Record metrics
	if h.monitoring != nil {
		h.monitoring.RecordRequest(time.Since(startTime))
	}

	logrus.WithFields(logrus.Fields{
		"user_id":           authContext.UserID,
		"session_id":        response.Data.SessionMetadata.SessionID,
		"processing_time":   response.Data.ProcessingTime,
		"conversation_turn": response.Data.SessionMetadata.ConversationTurn,
	}).Info("✅ Session chat request processed successfully")

	c.JSON(http.StatusOK, response)
}

// GetChatHistory handles GET /chat/history - Chat history retrieval
func (h *ChatHandler) GetChatHistory(c *gin.Context) {
	startTime := time.Now()

	sessionID := c.Query("sessionId")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Session ID is required",
			"code":  "MISSING_SESSION_ID",
		})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logrus.WithFields(logrus.Fields{
		"session_id": sessionID,
		"limit":      limit,
		"offset":     offset,
	}).Info("📜 Getting chat history")

	// Get session data
	session, err := h.chatService.GetSession(c.Request.Context(), sessionID)
	if err != nil {
		logrus.WithError(err).Warn("Session not found")
		
		c.JSON(http.StatusNotFound, gin.H{
			"error":     "Session not found",
			"code":      "SESSION_NOT_FOUND",
			"sessionId": sessionID,
		})
		return
	}

	// Paginate conversation history
	totalMessages := len(session.ConversationHistory)
	end := offset + limit
	if end > totalMessages {
		end = totalMessages
	}

	var paginatedHistory []map[string]interface{}
	if offset < totalMessages {
		for _, turn := range session.ConversationHistory[offset:end] {
			paginatedHistory = append(paginatedHistory, map[string]interface{}{
				"id":        turn.ID,
				"query":     turn.Query,
				"response":  turn.Response,
				"timestamp": turn.Timestamp,
				"metadata":  turn.Metadata,
			})
		}
	}

	processingTime := time.Since(startTime).Milliseconds()

	logrus.WithFields(logrus.Fields{
		"session_id":      sessionID,
		"total_messages":  totalMessages,
		"returned_count":  len(paginatedHistory),
		"processing_time": processingTime,
	}).Info("✅ Chat history retrieved successfully")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"sessionId": sessionID,
			"sessionInfo": gin.H{
				"type":                session.Type,
				"userId":              session.UserID,
				"createdAt":           session.CreatedAt,
				"lastAccessedAt":      session.LastAccessedAt,
				"userPreferences":     session.UserPreferences,
				"userExpertiseLevel":  session.UserExpertiseLevel,
				"conversationStage":   session.ConversationStage,
			},
			"conversationHistory": paginatedHistory,
			"pagination": gin.H{
				"total":   totalMessages,
				"limit":   limit,
				"offset":  offset,
				"hasMore": offset+limit < totalMessages,
			},
			"analytics": gin.H{
				"totalQueries":        session.Analytics.TotalQueries,
				"averageResponseTime": session.Analytics.AverageResponseTime,
				"cacheHitRate":        session.Analytics.CacheHitRate,
				"mostUsedServices":    session.Analytics.MostUsedServices,
				"sessionDuration":     time.Since(session.CreatedAt).Milliseconds(),
			},
		},
		"metadata": gin.H{
			"processingTime": processingTime,
			"timestamp":      time.Now(),
		},
	})
}

// GetChatSessions handles GET /chat/sessions - User session management
func (h *ChatHandler) GetChatSessions(c *gin.Context) {
	startTime := time.Now()

	// Get authentication context
	authContext, exists := middleware.GetAuthContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
		return
	}

	logrus.WithField("user_id", authContext.UserID).Info("📋 Getting user chat sessions")

	// For now, return a placeholder response
	// In a full implementation, this would query the database for user sessions
	processingTime := time.Since(startTime).Milliseconds()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"sessions": []gin.H{}, // Placeholder - would contain actual sessions
			"total":    0,
		},
		"metadata": gin.H{
			"processingTime": processingTime,
			"timestamp":      time.Now(),
			"userId":         authContext.UserID,
		},
	})
}

// detectUserRegion detects the user's region from request context
func (h *ChatHandler) detectUserRegion(req chat.ChatRequest) string {
	// Default to Jakarta for Phase 2B rollout
	// In production, this would use IP geolocation, user preferences, etc.
	return "id_jakarta"
}

// Helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

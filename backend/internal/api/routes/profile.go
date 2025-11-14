package routes

import (
	"net/http"
	"selly-backend/internal/services/profile"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// ProfileRoutes handles all profile-related HTTP endpoints
type ProfileRoutes struct {
	service ProfileServiceInterface
	logger  logrus.FieldLogger
}

// ProfileServiceInterface is an interface wrapper for the profile service
type ProfileServiceInterface interface {
	GetProfile(ctx interface{}, userID string) (*profile.ProfileData, error)
	UpdateProfile(ctx interface{}, userID string, req *profile.UpdateProfileRequest) (*profile.ProfileData, error)
	UploadAvatar(ctx interface{}, req *profile.AvatarUploadRequest) (*profile.AvatarUploadResponse, error)
	DeleteAvatar(ctx interface{}, req *profile.AvatarDeleteRequest) error
	GetAvatarURL(ctx interface{}, userID string) (string, error)
	HealthCheck(ctx interface{}) error
}

// NewProfileRoutes creates a new profile routes handler
func NewProfileRoutes(service interface{}, logger logrus.FieldLogger) *ProfileRoutes {
	// Type assertion to ensure service implements required interface
	svc := service.(ProfileServiceInterface)
	return &ProfileRoutes{
		service: svc,
		logger:  logger,
	}
}

// RegisterRoutes registers all profile routes
func (pr *ProfileRoutes) RegisterRoutes(router *gin.Engine) {
	profile := router.Group("/api/v1/profile")
	{
		// Require authentication for all profile routes
		profile.GET("", pr.getProfile)
		profile.PATCH("", pr.updateProfile)
		profile.POST("/avatar", pr.uploadAvatar)
		profile.DELETE("/avatar", pr.deleteAvatar)
		profile.GET("/avatar", pr.getAvatarURL)
	}
}

// getProfile handles GET /api/v1/profile
// @Summary Get user profile
// @Description Retrieve the authenticated user's profile information
// @Tags profile
// @Produces json
// @Security Bearer
// @Success 200 {object} profile.ProfileData
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 404 {object} ErrorResponse "Profile not found"
// @Router /api/v1/profile [get]
func (pr *ProfileRoutes) getProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		pr.logger.Warn("user_id not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
			"message": "Anda harus login terlebih dahulu",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		pr.logger.Error("user_id type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_error",
			"message": "Terjadi kesalahan. Silakan hubungi administrator",
		})
		return
	}

	profileData, err := pr.service.GetProfile(c.Request.Context(), userIDStr)
	if err != nil {
		pr.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, profileData)
}

// updateProfile handles PATCH /api/v1/profile
// @Summary Update user profile
// @Description Update the authenticated user's profile information
// @Tags profile
// @Produces json
// @Param request body profile.UpdateProfileRequest true "Update profile request"
// @Security Bearer
// @Success 200 {object} profile.ProfileData
// @Failure 400 {object} ErrorResponse "Validation error"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Internal error"
// @Router /api/v1/profile [patch]
func (pr *ProfileRoutes) updateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		pr.logger.Warn("user_id not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
			"message": "Anda harus login terlebih dahulu",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		pr.logger.Error("user_id type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_error",
			"message": "Terjadi kesalahan. Silakan hubungi administrator",
		})
		return
	}

	var req profile.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "validation_error",
			"message": "Data tidak valid",
		})
		return
	}

	updated, err := pr.service.UpdateProfile(c.Request.Context(), userIDStr, &req)
	if err != nil {
		pr.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, updated)
}

// uploadAvatar handles POST /api/v1/profile/avatar
// @Summary Upload avatar
// @Description Upload a new avatar image for the user
// @Tags profile
// @Produces json
// @Param avatar formData file true "Avatar image (max 2MB, JPG/PNG)"
// @Security Bearer
// @Success 200 {object} profile.AvatarUploadResponse
// @Failure 400 {object} ErrorResponse "Invalid file"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Upload failed"
// @Router /api/v1/profile/avatar [post]
func (pr *ProfileRoutes) uploadAvatar(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		pr.logger.Warn("user_id not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
			"message": "Anda harus login terlebih dahulu",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		pr.logger.Error("user_id type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_error",
			"message": "Terjadi kesalahan. Silakan hubungi administrator",
		})
		return
	}

	// Get file from multipart form
	header, err := c.FormFile("avatar")
	if err != nil {
		pr.logger.Warn("failed to get avatar file from form", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "validation_error",
			"message": "File avatar harus disertakan",
		})
		return
	}

	file, err := header.Open()
	if err != nil {
		pr.logger.Error("failed to open file", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_error",
			"message": "Gagal membuka file. Silakan coba lagi",
		})
		return
	}
	defer file.Close()

	// Read file data
	buffer := make([]byte, header.Size)
	if _, err := file.Read(buffer); err != nil {
		pr.logger.Error("failed to read file data", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_error",
			"message": "Gagal membaca file. Silakan coba lagi",
		})
		return
	}

	uploadReq := &profile.AvatarUploadRequest{
		UserID:   userIDStr,
		FileName: header.Filename,
		FileSize: header.Size,
		MimeType: header.Header.Get("Content-Type"),
		Data:     buffer,
	}

	response, err := pr.service.UploadAvatar(c.Request.Context(), uploadReq)
	if err != nil {
		pr.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response)
}

// deleteAvatar handles DELETE /api/v1/profile/avatar
// @Summary Delete avatar
// @Description Delete the user's current avatar
// @Tags profile
// @Produces json
// @Security Bearer
// @Success 204
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Delete failed"
// @Router /api/v1/profile/avatar [delete]
func (pr *ProfileRoutes) deleteAvatar(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		pr.logger.Warn("user_id not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
			"message": "Anda harus login terlebih dahulu",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		pr.logger.Error("user_id type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_error",
			"message": "Terjadi kesalahan. Silakan hubungi administrator",
		})
		return
	}

	// Get avatar URL from query or body
	var req struct {
		AvatarURL string `json:"avatar_url" form:"avatar_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		// Try form data if JSON parsing fails
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "validation_error",
				"message": "URL avatar harus disertakan",
			})
			return
		}
	}

	deleteReq := &profile.AvatarDeleteRequest{
		UserID:    userIDStr,
		AvatarURL: req.AvatarURL,
	}

	if err := pr.service.DeleteAvatar(c.Request.Context(), deleteReq); err != nil {
		pr.handleError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// getAvatarURL handles GET /api/v1/profile/avatar
// @Summary Get avatar URL
// @Description Get the public URL of the user's avatar
// @Tags profile
// @Produces json
// @Security Bearer
// @Success 200 {object} map[string]string "Avatar URL"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /api/v1/profile/avatar [get]
func (pr *ProfileRoutes) getAvatarURL(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		pr.logger.Warn("user_id not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
			"message": "Anda harus login terlebih dahulu",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		pr.logger.Error("user_id type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_error",
			"message": "Terjadi kesalahan. Silakan hubungi administrator",
		})
		return
	}

	url, err := pr.service.GetAvatarURL(c.Request.Context(), userIDStr)
	if err != nil {
		pr.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"avatar_url": url,
	})
}

// handleError handles profile service errors
func (pr *ProfileRoutes) handleError(c *gin.Context, err error) {
	if opErr, ok := err.(*profile.OperationError); ok {
		c.JSON(opErr.GetStatusCode(), gin.H{
			"error":   opErr.GetCode(),
			"message": opErr.UserMessage(),
		})
		pr.logger.WithError(opErr.Err).Error(opErr.Error())
		return
	}

	pr.logger.Error("unexpected error", "error", err)
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": "internal_error",
		"message": "Terjadi kesalahan. Silakan hubungi administrator",
	})
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

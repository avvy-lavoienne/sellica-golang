package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/database"
	"selly-backend/internal/services/eventbus"
)

// UserHandler handles user-related endpoints with event-driven architecture
type UserHandler struct {
	database *database.Service
	eventBus eventbus.EventBusInterface
}

// NewUserHandler creates a new user handler with event bus integration
func NewUserHandler(database *database.Service, eventBus eventbus.EventBusInterface) *UserHandler {
	return &UserHandler{
		database: database,
		eventBus: eventBus,
	}
}

// CreateUser handles POST /users - Create a new user with event publishing
func (h *UserHandler) CreateUser(c *gin.Context) {
	startTime := time.Now()

	// Parse request
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("🚫 Invalid user creation request format")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate required fields
	if req.Email == "" || req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email and name are required",
		})
		return
	}

	// Create user in database
	user := &database.User{
		ID:        generateUserID(),
		Email:     req.Email,
		Name:      req.Name,
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Store in database (this would be real Supabase integration)
	err := h.database.CreateUser(user)
	if err != nil {
		logrus.WithError(err).Error("❌ Failed to create user in database")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Publish user creation event
	event := eventbus.NewEvent(eventbus.EventTypeDataCreated, map[string]interface{}{
		"entity_type": "user",
		"entity_id":   user.ID,
		"data":        user,
		"operation":   "create",
		"timestamp":   time.Now(),
	})

	if err := h.eventBus.Publish(c.Request.Context(), event); err != nil {
		logrus.WithError(err).Warn("⚠️ Failed to publish user creation event")
		// Don't fail the request, just log the warning
	}

	// Log performance metrics
	duration := time.Since(startTime)
	logrus.WithFields(logrus.Fields{
		"user_id":   user.ID,
		"email":     user.Email,
		"duration":  duration,
		"operation": "create_user",
	}).Info("✅ User created successfully")

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
	})
}

// UpdateUser handles PUT /users/:id - Update user with event publishing
func (h *UserHandler) UpdateUser(c *gin.Context) {
	startTime := time.Now()
	userID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User ID is required",
		})
		return
	}

	// Parse request
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("🚫 Invalid user update request format")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get existing user
	existingUser, err := h.database.GetUser(userID)
	if err != nil {
		logrus.WithError(err).Error("❌ Failed to get user from database")
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	// Store original for change tracking
	originalUser := *existingUser

	// Update user fields
	changes := make(map[string]interface{})
	if req.Name != "" && req.Name != existingUser.Name {
		changes["name"] = map[string]interface{}{
			"old": existingUser.Name,
			"new": req.Name,
		}
		existingUser.Name = req.Name
	}
	
	if req.Email != "" && req.Email != existingUser.Email {
		changes["email"] = map[string]interface{}{
			"old": existingUser.Email,
			"new": req.Email,
		}
		existingUser.Email = req.Email
	}

	existingUser.UpdatedAt = time.Now()

	// Update in database
	err = h.database.UpdateUser(existingUser)
	if err != nil {
		logrus.WithError(err).Error("❌ Failed to update user in database")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user",
		})
		return
	}

	// Publish user update event
	event := eventbus.NewEvent(eventbus.EventTypeDataUpdated, map[string]interface{}{
		"entity_type": "user",
		"entity_id":   userID,
		"changes":     changes,
		"data":        existingUser,
		"original":    originalUser,
		"operation":   "update",
		"timestamp":   time.Now(),
	})

	if err := h.eventBus.Publish(c.Request.Context(), event); err != nil {
		logrus.WithError(err).Warn("⚠️ Failed to publish user update event")
	}

	// Log performance metrics
	duration := time.Since(startTime)
	logrus.WithFields(logrus.Fields{
		"user_id":     userID,
		"changes":     len(changes),
		"duration":    duration,
		"operation":   "update_user",
	}).Info("✅ User updated successfully")

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user": gin.H{
			"id":    existingUser.ID,
			"email": existingUser.Email,
			"name":  existingUser.Name,
			"role":  existingUser.Role,
		},
		"changes": changes,
	})
}

// GetUser handles GET /users/:id - Get user by ID
func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User ID is required",
		})
		return
	}

	user, err := h.database.GetUser(userID)
	if err != nil {
		logrus.WithError(err).Error("❌ Failed to get user from database")
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"name":       user.Name,
			"role":       user.Role,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		},
	})
}

// Request/Response types
type CreateUserRequest struct {
	Email string `json:"email" binding:"required"`
	Name  string `json:"name" binding:"required"`
}

type UpdateUserRequest struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

// generateUserID generates a unique user ID
func generateUserID() string {
	return "user_" + time.Now().Format("20060102150405") + "_" + generateShortID()
}

// generateShortID generates a short random ID
func generateShortID() string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

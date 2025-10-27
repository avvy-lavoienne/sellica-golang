package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/database"
)

// AdminHandler handles admin-related HTTP requests
type AdminHandler struct {
	dbService *database.Service
}

// NewAdminHandler creates a new AdminHandler
func NewAdminHandler(dbService *database.Service) *AdminHandler {
	return &AdminHandler{
		dbService: dbService,
	}
}

// PendingUserResponse represents a pending user in admin responses
// Note: Password field is intentionally omitted for security
type PendingUserResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Position  string `json:"position"`
	NIP       string `json:"nip"`
	NIK       string `json:"nik"`
	Status    string `json:"status"`
	CreatedAt string `json:"requested_at"`
}

// AdminResponse represents a standard admin response
type AdminResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// GetPendingUsers handles GET /admin/pending-users request
// Retrieves all pending users for admin review and approval
// Only accessible to admin users
func (h *AdminHandler) GetPendingUsers(c *gin.Context) {
	// Verify admin role from context (set by auth middleware)
	role, exists := c.Get("user_role")
	if !exists {
		logrus.Warn("User role not found in context")
		c.JSON(http.StatusUnauthorized, AdminResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	// Check if user has admin or superuser role
	userRole := role.(string)
	if userRole != "admin" && userRole != "superuser" {
		userID, _ := c.Get("user_id")
		logrus.WithFields(logrus.Fields{
			"user_id": userID,
			"role":    userRole,
		}).Warn("Non-admin user attempted to access pending users")
		
		c.JSON(http.StatusForbidden, AdminResponse{
			Success: false,
			Error:   "Only admin users can access pending users",
		})
		return
	}

	// Get pending users from database
	pendingUsers, err := h.dbService.GetPendingUsers(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to retrieve pending users")
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Failed to retrieve pending users",
		})
		return
	}

	// Convert to response format (without password)
	responses := make([]PendingUserResponse, len(pendingUsers))
	for i, user := range pendingUsers {
		responses[i] = PendingUserResponse{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Position:  user.Position,
			NIP:       user.NIP,
			NIK:       user.NIK,
			Status:    user.Status,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	userID, _ := c.Get("user_id")
	logrus.WithFields(logrus.Fields{
		"user_id":      userID,
		"user_count":   len(responses),
		"admin_action": "view_pending_users",
	}).Info("Admin retrieved pending users list")

	c.JSON(http.StatusOK, AdminResponse{
		Success: true,
		Data:    responses,
		Message: "Pending users retrieved successfully",
	})
}

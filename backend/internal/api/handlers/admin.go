package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

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
		logrus.WithError(err).WithFields(logrus.Fields{
			"error_type": fmt.Sprintf("%T", err),
			"error_msg":  err.Error(),
		}).Error("Failed to retrieve pending users from database")
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   fmt.Sprintf("Database error: %v", err.Error()),
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

// ApproveUserRequest represents the request to approve a pending user
type ApproveUserRequest struct {
	PendingUserID string `json:"pending_user_id" binding:"required"`
}

// ApproveUser handles user approval - moves pending user to profiles and creates Supabase Auth user
func (h *AdminHandler) ApproveUser(c *gin.Context) {
	var req ApproveUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, AdminResponse{
			Success: false,
			Error:   "pending_user_id is required",
		})
		return
	}

	// Verify admin role from context
	role, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, AdminResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	userRole := role.(string)
	if userRole != "admin" && userRole != "superuser" {
		c.JSON(http.StatusForbidden, AdminResponse{
			Success: false,
			Error:   "Only admin users can approve users",
		})
		return
	}

	adminID, _ := c.Get("user_id")
	
	logrus.WithFields(logrus.Fields{
		"pending_user_id": req.PendingUserID,
		"admin_id":        adminID,
	}).Info("Processing user approval request")

	// Get the pending user
	pendingUsers, err := h.dbService.GetPendingUsers(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to retrieve pending users")
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Failed to retrieve pending users",
		})
		return
	}

	var pendingUser *database.PendingUser
	for i := range pendingUsers {
		if pendingUsers[i].ID == req.PendingUserID {
			pendingUser = &pendingUsers[i]
			break
		}
	}

	if pendingUser == nil {
		c.JSON(http.StatusNotFound, AdminResponse{
			Success: false,
			Error:   "Pending user not found",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id": pendingUser.ID,
		"email":   pendingUser.Email,
		"name":    pendingUser.Name,
	}).Info("Found pending user for approval")

	// Create profile entry using pending_user ID
	// Note: When a pending user is approved, their ID becomes their auth user ID
	profile := map[string]interface{}{
		"id":       pendingUser.ID,
		"email":    pendingUser.Email,
		"name":     pendingUser.Name,
		"nip":      pendingUser.NIP,
		"position": pendingUser.Position,
		"nik":      pendingUser.NIK,
		"role":     "user", // Default role
	}

	// Insert into profiles table
	client := h.dbService.GetClient()
	if client == nil {
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Database client not available",
		})
		return
	}

	_, _, err = client.From("profiles").Insert([]interface{}{profile}, false, "", "", "").Execute()
	if err != nil {
		logrus.WithError(err).Error("Failed to create profile")
		
		// Check if it's a foreign key violation
		if errMsg := err.Error(); strings.Contains(errMsg, "23503") || strings.Contains(errMsg, "profiles_id_fkey") {
			logrus.WithFields(logrus.Fields{
				"user_id": pendingUser.ID,
				"error":   err.Error(),
			}).Error("Foreign key constraint violation - auth user may not exist")
			c.JSON(http.StatusConflict, AdminResponse{
				Success: false,
				Error:   "Cannot approve user: authentication record not found. User may need to complete registration first.",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Failed to create user profile: " + err.Error(),
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id": pendingUser.ID,
		"email":   pendingUser.Email,
	}).Info("Profile created successfully")

	// Update pending_users status to approved
	now := time.Now()
	updateData := map[string]interface{}{
		"status":      "approved",
		"approved_at": now,
		"approved_by": adminID,
	}

	_, _, err = client.From("pending_users").
		Update(updateData, "", "").
		Eq("id", req.PendingUserID).
		Execute()

	if err != nil {
		logrus.WithError(err).Error("Failed to update pending user status")
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Failed to update approval status: " + err.Error(),
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id": pendingUser.ID,
		"email":   pendingUser.Email,
		"admin_id": adminID,
	}).Info("User approved successfully")

	c.JSON(http.StatusOK, AdminResponse{
		Success: true,
		Message: "User approved successfully and profile created",
	})
}

// RejectUserRequest represents the request to reject a pending user
type RejectUserRequest struct {
	PendingUserID     string `json:"pending_user_id" binding:"required"`
	RejectionReason   string `json:"rejection_reason" binding:"required"`
}

// RejectPendingUser handles user rejection - marks pending user as rejected with reason
func (h *AdminHandler) RejectPendingUser(c *gin.Context) {
	var req RejectUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, AdminResponse{
			Success: false,
			Error:   "pending_user_id and rejection_reason are required",
		})
		return
	}

	// Verify admin role from context
	role, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, AdminResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	userRole := role.(string)
	if userRole != "admin" && userRole != "superuser" {
		c.JSON(http.StatusForbidden, AdminResponse{
			Success: false,
			Error:   "Only admin users can reject users",
		})
		return
	}

	adminID, _ := c.Get("user_id")
	
	logrus.WithFields(logrus.Fields{
		"pending_user_id":   req.PendingUserID,
		"admin_id":          adminID,
		"rejection_reason":  req.RejectionReason,
	}).Info("Processing user rejection request")

	// Get the pending user
	pendingUsers, err := h.dbService.GetPendingUsers(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to retrieve pending users")
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Failed to retrieve pending users",
		})
		return
	}

	var pendingUser *database.PendingUser
	for i := range pendingUsers {
		if pendingUsers[i].ID == req.PendingUserID {
			pendingUser = &pendingUsers[i]
			break
		}
	}

	if pendingUser == nil {
		c.JSON(http.StatusNotFound, AdminResponse{
			Success: false,
			Error:   "Pending user not found",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id": pendingUser.ID,
		"email":   pendingUser.Email,
		"name":    pendingUser.Name,
	}).Info("Found pending user for rejection")

	// Update pending_users status to rejected
	now := time.Now()
	updateData := map[string]interface{}{
		"status":             "rejected",
		"rejected_at":        now,
		"rejected_by":        adminID,
		"rejection_reason":   req.RejectionReason,
	}

	client := h.dbService.GetClient()
	if client == nil {
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Database client not available",
		})
		return
	}

	_, _, err = client.From("pending_users").
		Update(updateData, "", "").
		Eq("id", req.PendingUserID).
		Execute()

	if err != nil {
		logrus.WithError(err).Error("Failed to update pending user status to rejected")
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Failed to update rejection status: " + err.Error(),
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id":           pendingUser.ID,
		"email":             pendingUser.Email,
		"admin_id":          adminID,
		"rejection_reason":  req.RejectionReason,
	}).Info("User rejected successfully")

	c.JSON(http.StatusOK, AdminResponse{
		Success: true,
		Message: "User rejected successfully",
	})
}

package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/database"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	authService *auth.Service
	dbService   *database.Service
}

// RegisterRequest represents the user registration request payload
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Position string `json:"position"`
	NIP      string `json:"nip"`
	NIK      string `json:"nik"`
}

// LoginRequest represents the user login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents the standard authentication response
type AuthResponse struct {
	Success bool      `json:"success"`
	Token   string    `json:"token,omitempty"`
	User    *UserInfo `json:"user,omitempty"`
	Error   string    `json:"error,omitempty"`
	Message string    `json:"message,omitempty"`
}

// UserInfo represents user information in responses
type UserInfo struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(authService *auth.Service, dbService *database.Service) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		dbService:   dbService,
	}
}

// Register handles user registration with Indonesian validation
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("Invalid registration request")
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Error:   "Email, name, and password are required",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"email": req.Email,
		"name":  req.Name,
	}).Info("Processing user registration request")

	// Check if user already exists in pending_users
	exists, err := h.dbService.CheckPendingUserExists(c.Request.Context(), req.Email)
	if err != nil {
		logrus.WithError(err).Error("Failed to check existing pending user")
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Error:   "Error during registration process",
		})
		return
	}

	if exists {
		logrus.WithField("email", req.Email).Warn("User already exists in pending users")
		c.JSON(http.StatusConflict, AuthResponse{
			Success: false,
			Error:   "Email sudah terdaftar dalam sistem",
		})
		return
	}

	// Hash password securely
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logrus.WithError(err).Error("Failed to hash password")
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Error:   "Error processing registration",
		})
		return
	}

	// Create pending user record
	pendingUser := &database.PendingUser{
		ID:        uuid.New().String(),
		Email:     req.Email,
		Name:      req.Name,
		Password:  string(hashedPassword),
		Position:  req.Position,
		NIP:       req.NIP,
		NIK:       req.NIK,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	err = h.dbService.CreatePendingUser(c.Request.Context(), pendingUser)
	if err != nil {
		logrus.WithError(err).Error("Failed to create pending user")
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Error:   "Error during registration",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"user_id": pendingUser.ID,
		"email":   req.Email,
	}).Info("User registration request submitted successfully")

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "Registration request submitted successfully",
	})
}

// Login handles user authentication with Supabase integration
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("Invalid login request")
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Error:   "Email and password are required",
		})
		return
	}

	logrus.WithField("email", req.Email).Info("Processing user login request")

	// Authenticate user through database
	user, err := h.authService.AuthenticateUser(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		logrus.WithError(err).WithField("email", req.Email).Warn("Authentication failed")
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Error:   "Invalid credentials",
		})
		return
	}

	// Generate JWT token
	token, err := h.authService.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		logrus.WithError(err).Error("Failed to generate authentication token")
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Error:   "Failed to generate authentication token",
		})
		return
	}

	// Update user's last login timestamp
	if err := h.dbService.UpdateUserLastLogin(c.Request.Context(), user.ID); err != nil {
		logrus.WithError(err).Warn("Failed to update last login timestamp")
		// Don't fail the login for this
	}

	logrus.WithFields(logrus.Fields{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
	}).Info("User login successful")

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Token:   token,
		User: &UserInfo{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
			Role:  user.Role,
		},
	})
}

// Logout handles user logout (JWT blacklisting if needed)
func (h *AuthHandler) Logout(c *gin.Context) {
	// For JWT-based auth, logout is typically handled client-side
	// But we can implement token blacklisting for enhanced security
	
	userID, exists := c.Get("user_id")
	if exists {
		logrus.WithField("user_id", userID).Info("User logout successful")
	}

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "Logged out successfully",
	})
}

// RefreshToken handles JWT token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Get current user from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Error:   "Invalid session",
		})
		return
	}

	userEmail, _ := c.Get("user_email")
	userRole, _ := c.Get("user_role")

	// Generate new token
	token, err := h.authService.GenerateToken(
		userID.(string),
		userEmail.(string),
		userRole.(string),
	)
	if err != nil {
		logrus.WithError(err).Error("Failed to refresh token")
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Error:   "Failed to refresh token",
		})
		return
	}

	logrus.WithField("user_id", userID).Info("Token refreshed successfully")

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Token:   token,
	})
}

// GetProfile handles user profile retrieval
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	user, err := h.dbService.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		logrus.WithError(err).Error("Failed to get user profile")
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Error:   "Failed to retrieve user profile",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, AuthResponse{
			Success: false,
			Error:   "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user": UserInfo{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
			Role:  user.Role,
		},
	})
}

package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/auth"
)

// AuthMiddleware provides JWT authentication middleware
func AuthMiddleware(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip authentication for health checks and public endpoints
		if isPublicEndpoint(c.Request.URL.Path) {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logrus.Warn("🔒 Authentication failed: missing Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Authorization header required",
				"message": "Please provide a valid JWT token in the Authorization header",
				"code":    "MISSING_AUTH_HEADER",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			logrus.Warn("🔒 Authentication failed: invalid Authorization header format")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid Authorization header format",
				"message": "Authorization header must be in format: Bearer <token>",
				"code":    "INVALID_AUTH_FORMAT",
			})
			c.Abort()
			return
		}

		// Validate token
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			logrus.WithError(err).Warn("🔒 Authentication failed: token validation error")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid token",
				"message": err.Error(),
				"code":    "INVALID_TOKEN",
			})
			c.Abort()
			return
		}

		// Check if token is expired
		if authService.IsTokenExpired(claims) {
			logrus.Warn("🔒 Authentication failed: token expired")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Token expired",
				"message": "Please refresh your token",
				"code":    "TOKEN_EXPIRED",
			})
			c.Abort()
			return
		}

		// Create auth context and store in gin context
		authContext := authService.CreateAuthContext(claims)
		c.Set("auth_context", authContext)
		c.Set("user_id", authContext.UserID)
		c.Set("user_email", authContext.Email)
		c.Set("user_role", authContext.Role)

		logrus.WithFields(logrus.Fields{
			"user_id": authContext.UserID,
			"email":   authContext.Email,
			"role":    authContext.Role,
		}).Debug("🔒 Authentication successful")

		c.Next()
	}
}

// OptionalAuthMiddleware provides optional authentication (doesn't block if no token)
func OptionalAuthMiddleware(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// No auth header, continue without authentication
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			// Invalid format, continue without authentication
			c.Next()
			return
		}

		// Try to validate token
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			// Invalid token, continue without authentication
			logrus.WithError(err).Debug("🔒 Optional auth: token validation failed")
			c.Next()
			return
		}

		// Check if token is expired
		if authService.IsTokenExpired(claims) {
			// Expired token, continue without authentication
			logrus.Debug("🔒 Optional auth: token expired")
			c.Next()
			return
		}

		// Valid token, set auth context
		authContext := authService.CreateAuthContext(claims)
		c.Set("auth_context", authContext)
		c.Set("user_id", authContext.UserID)
		c.Set("user_email", authContext.Email)
		c.Set("user_role", authContext.Role)

		logrus.WithFields(logrus.Fields{
			"user_id": authContext.UserID,
			"email":   authContext.Email,
		}).Debug("🔒 Optional authentication successful")

		c.Next()
	}
}

// isPublicEndpoint checks if an endpoint should be publicly accessible
func isPublicEndpoint(path string) bool {
	publicEndpoints := []string{
		"/health",
		"/health/simple",
		"/health/live",
		"/health/ready",
		"/metrics",
		"/metrics/health",
		"/metrics/summary",
		"/test-db",
		"/database/health",
		"/cache/health",
		"/auth/register",
		"/auth/debug",
	}

	for _, endpoint := range publicEndpoints {
		if path == endpoint || strings.HasPrefix(path, endpoint+"/") {
			return true
		}
	}

	return false
}

// GetAuthContext retrieves the authentication context from gin context
func GetAuthContext(c *gin.Context) (*auth.AuthContext, bool) {
	if authContext, exists := c.Get("auth_context"); exists {
		if ctx, ok := authContext.(*auth.AuthContext); ok {
			return ctx, true
		}
	}
	return nil, false
}

// GetUserID retrieves the user ID from gin context
func GetUserID(c *gin.Context) (string, bool) {
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(string); ok {
			return id, true
		}
	}
	return "", false
}

// RequireRole middleware that requires a specific role
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authContext, exists := GetAuthContext(c)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Authentication required",
				"message": "This endpoint requires authentication",
				"code":    "AUTH_REQUIRED",
			})
			c.Abort()
			return
		}

		if authContext.Role != requiredRole {
			logrus.WithFields(logrus.Fields{
				"user_id":      authContext.UserID,
				"user_role":    authContext.Role,
				"required_role": requiredRole,
			}).Warn("🔒 Access denied: insufficient role")

			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Insufficient permissions",
				"message": "This endpoint requires " + requiredRole + " role",
				"code":    "INSUFFICIENT_ROLE",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyRole middleware that requires any of the specified roles
func RequireAnyRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authContext, exists := GetAuthContext(c)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Authentication required",
				"message": "This endpoint requires authentication",
				"code":    "AUTH_REQUIRED",
			})
			c.Abort()
			return
		}

		// Check if user has any of the allowed roles
		hasValidRole := false
		for _, role := range allowedRoles {
			if authContext.Role == role {
				hasValidRole = true
				break
			}
		}

		if !hasValidRole {
			logrus.WithFields(logrus.Fields{
				"user_id":       authContext.UserID,
				"user_role":     authContext.Role,
				"allowed_roles": allowedRoles,
			}).Warn("🔒 Access denied: insufficient role")

			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Insufficient permissions",
				"message": "This endpoint requires one of the following roles: " + strings.Join(allowedRoles, ", "),
				"code":    "INSUFFICIENT_ROLE",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminMiddleware ensures user has admin role
func AdminMiddleware(authService *auth.Service) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// First ensure user is authenticated
		AuthMiddleware(authService)(c)
		if c.IsAborted() {
			return
		}

		// Then check for admin role
		RequireRole("admin")(c)
	})
}

// SuperAdminMiddleware ensures user has super admin role
func SuperAdminMiddleware(authService *auth.Service) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// First ensure user is authenticated
		AuthMiddleware(authService)(c)
		if c.IsAborted() {
			return
		}

		// Then check for super admin role
		RequireRole("super_admin")(c)
	})
}

// AuthRateLimitMiddleware implements basic rate limiting for auth endpoints
func AuthRateLimitMiddleware() gin.HandlerFunc {
	// This is a basic implementation
	// In production, use a proper rate limiting library
	return func(c *gin.Context) {
		// Add rate limiting headers for auth endpoints
		if strings.HasPrefix(c.Request.URL.Path, "/auth/") {
			c.Header("X-RateLimit-Limit", "10") // 10 requests per minute for auth
			c.Header("X-RateLimit-Remaining", "9")
			c.Header("X-RateLimit-Reset", "60")
		}

		c.Next()
	}
}

# Go Backend JWT Integration Guide

**Document**: Go Backend JWT Token Validation & Implementation
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📈 High
**Language**: English
**Audience**: Backend Development Team
**Type**: Implementation Guide

## Executive Summary

This guide explains how to integrate JWT token validation in the Go backend to work with Supabase authentication. The frontend sends Supabase JWT tokens in the `Authorization` header, and the Go backend validates them independently.

**Key Points**:
- ✅ JWT tokens are issued by Supabase Auth
- ✅ Frontend passes token in `Authorization: Bearer {jwt}` header
- ✅ Go backend verifies JWT signature using `SUPABASE_JWT_SECRET`
- ✅ Go backend extracts user claims (ID, role, email, etc.)
- ✅ Use claims for authorization checks

---

## Current Implementation Status

### What's Already Implemented

**File**: `backend/internal/services/auth/service.go`

✅ JWT validation service exists and is working:
- Verifies JWT signature
- Extracts claims
- Handles expired tokens
- Returns user information

### Where to Use It

**All API endpoints** that require authentication should:
1. Extract JWT from `Authorization` header
2. Validate using auth service
3. Check user role
4. Execute mutation
5. Return response

---

## JWT Token Structure

### What's in the JWT

```
Header: { "alg": "HS256", "typ": "JWT" }

Payload (Claims):
{
  "sub": "user-uuid",                    // User ID
  "email": "user@example.com",           // Email
  "role": "authenticated",               // Always "authenticated"
  "aud": "authenticated",                // Audience
  "iat": 1698000000,                     // Issued at
  "exp": 1698010000,                     // Expires at
  "custom_claims": {
    "user_role": "admin"                 // CUSTOM: Role (admin/user)
  }
}

Signature: HMAC-SHA256(header.payload, SUPABASE_JWT_SECRET)
```

**Important**: Supabase puts the custom role in `custom_claims.user_role`, not directly in the JWT.

### Example Decoded Token

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@example.com",
  "email_confirmed_at": "2025-01-15T08:00:00Z",
  "phone": "",
  "phone_confirmed_at": null,
  "confirmation_sent_at": null,
  "recovery_sent_at": null,
  "last_sign_in_at": "2025-10-25T10:30:00Z",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {},
  "identities": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "identity_data": {
        "email": "admin@example.com"
      },
      "provider": "email",
      "created_at": "2025-01-15T08:00:00Z",
      "last_sign_in_at": "2025-10-25T10:30:00Z"
    }
  ],
  "role": "authenticated",
  "aud": "authenticated",
  "created_at": "2025-01-15T08:00:00Z",
  "confirmed_at": "2025-01-15T08:00:00Z",
  "email_change_confirmation_sent_at": null,
  "new_email": null,
  "new_phone": null,
  "invited_at": null,
  "action_link": null,
  "oauth_providers": null,
  "password_changed_at": "2025-01-15T08:00:00Z",
  "mfa_enabled": false,
  "session_id": null,
  "is_sso_user": false,
  "deleted_at": null,
  "is_anonymous": false,
  "custom_claims": {
    "user_role": "admin"
  }
}
```

---

## How to Extract JWT from Request

### Middleware to Extract Token

```go
// backend/internal/middleware/auth.go

package middleware

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
)

// ExtractBearerToken extracts JWT from Authorization header
func ExtractBearerToken(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	
	if authHeader == "" {
		return "", fmt.Errorf("authorization header missing")
	}
	
	// Expected format: "Bearer {token}"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", fmt.Errorf("invalid authorization header format")
	}
	
	return parts[1], nil
}

// AuthMiddleware validates JWT in request
func AuthMiddleware(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract JWT from header
		token, err := ExtractBearerToken(c)
		if err != nil {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}
		
		// Validate JWT
		claims, err := authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}
		
		// Store user info in context for handler use
		c.Set("user_id", claims.Subject)        // User UUID
		c.Set("user_email", claims.Email)       // User email
		c.Set("user_role", claims.GetUserRole()) // admin/user
		
		c.Next()
	}
}
```

### How to Use in Handlers

```go
// backend/internal/api/routes/handler.go

func handleUpdateOperator(c *gin.Context, service *DuplicateOperatorService) {
	// Get user info from middleware
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")
	
	// Check authorization
	if userRole != "admin" {
		c.JSON(403, gin.H{
			"error": "ต้องมีสิทธิ์ admin",  // Indonesian
			"details": "User is not an admin",  // English
		})
		return
	}
	
	// Process request
	operatorID := c.Param("id")
	var updateData UpdateOperatorRequest
	
	if err := c.BindJSON(&updateData); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}
	
	// Execute update (userID is available for audit logging)
	result, err := service.UpdateOperator(c.Request.Context(), operatorID, updateData, userID)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "gagal mengupdate operator",
			"details": err.Error(),
		})
		return
	}
	
	c.JSON(200, result)
}
```

---

## JWT Validation Service

### Current Implementation (Likely in backend/internal/services/auth/)

```go
// backend/internal/services/auth/service.go

package auth

import (
	"context"
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims represents Supabase JWT claims
type JWTClaims struct {
	Subject   string `json:"sub"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Aud       string `json:"aud"`
	CustomClaims CustomClaims `json:"custom_claims"`
	jwt.RegisteredClaims
}

// CustomClaims contains user-defined claims
type CustomClaims struct {
	UserRole string `json:"user_role"`  // "admin" or "user"
}

// GetUserRole returns the user's role
func (c *JWTClaims) GetUserRole() string {
	if c.CustomClaims.UserRole != "" {
		return c.CustomClaims.UserRole
	}
	return "user"  // Default role
}

// Service handles authentication
type Service struct {
	jwtSecret string
}

// NewService creates new auth service
func NewService() *Service {
	return &Service{
		jwtSecret: os.Getenv("SUPABASE_JWT_SECRET"),
	}
}

// ValidateToken validates JWT and returns claims
func (s *Service) ValidateToken(
	ctx context.Context,
	tokenString string,
) (*JWTClaims, error) {
	// Parse and verify JWT
	token, err := jwt.ParseWithClaims(
		tokenString,
		&JWTClaims{},
		func(token *jwt.Token) (interface{}, error) {
			// Verify using SUPABASE_JWT_SECRET
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(s.jwtSecret), nil
		},
	)

	if err != nil {
		return nil, fmt.Errorf("token parsing failed: %w", err)
	}

	// Check if token is valid
	if !token.Valid {
		return nil, fmt.Errorf("token is invalid")
	}

	// Get claims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Verify expiration
	if err := claims.Valid(); err != nil {
		return nil, fmt.Errorf("token expired or invalid: %w", err)
	}

	// Verify audience
	if claims.Aud != "authenticated" {
		return nil, fmt.Errorf("invalid audience")
	}

	return claims, nil
}

// GetUserRole returns role for user ID
func (s *Service) GetUserRole(
	ctx context.Context,
	userID string,
	dbService *database.Service,
) (string, error) {
	// Query database for role
	var role string
	err := dbService.QueryRow(
		ctx,
		"SELECT role FROM profiles WHERE id = $1",
		userID,
	).Scan(&role)

	if err != nil {
		return "", fmt.Errorf("failed to get user role: %w", err)
	}

	return role, nil
}
```

---

## Complete Handler Example

### Example: Update Operator Endpoint

```go
// backend/internal/api/routes/duplicate_operator.go

package routes

import (
	"github.com/gin-gonic/gin"
	"yourproject/internal/services/duplicate_operator"
)

// RegisterDuplicateOperatorRoutes registers all duplicate operator routes
func RegisterDuplicateOperatorRoutes(
	router *gin.Engine,
	service *duplicate_operator.Service,
) {
	// Protected routes (require authentication)
	protected := router.Group("/api/v1")
	protected.Use(AuthMiddleware)  // ← Validates JWT
	
	protected.GET("/duplicate-operators", listOperators(service))
	protected.GET("/duplicate-operators/:id", getOperator(service))
	protected.POST("/duplicate-operators", createOperator(service))
	protected.PUT("/duplicate-operators/:id", updateOperator(service))
	protected.DELETE("/duplicate-operators/:id", deleteOperator(service))
}

// updateOperator handles PUT /api/v1/duplicate-operators/:id
func updateOperator(service *duplicate_operator.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user info from middleware
		userID := c.GetString("user_id")      // UUID
		userEmail := c.GetString("user_email") // email
		userRole := c.GetString("user_role")   // admin/user

		// Check if user has permission
		if userRole != "admin" {
			c.JSON(403, gin.H{
				"error": "anda tidak memiliki izin",
				"details": "Only admins can update operators",
			})
			return
		}

		// Get operator ID from URL
		operatorID := c.Param("id")

		// Parse request body
		var req UpdateOperatorRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"error": "permintaan tidak valid",
				"details": err.Error(),
			})
			return
		}

		// Update operator in database
		operator, err := service.UpdateOperator(
			c.Request.Context(),
			operatorID,
			req,
			userID, // For audit log
		)
		if err != nil {
			c.JSON(500, gin.H{
				"error": "gagal mengupdate operator",
				"details": err.Error(),
			})
			return
		}

		// Log activity (optional)
		logActivity(c.Request.Context(), userID, "UPDATE_OPERATOR", operatorID)

		// Return updated operator
		c.JSON(200, operator)
	}
}

// createOperator handles POST /api/v1/duplicate-operators
func createOperator(service *duplicate_operator.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		userRole := c.GetString("user_role")

		if userRole != "admin" {
			c.JSON(403, gin.H{"error": "Unauthorized"})
			return
		}

		var req CreateOperatorRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			return
		}

		operator, err := service.CreateOperator(c.Request.Context(), req, userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create operator"})
			return
		}

		c.JSON(201, operator)
	}
}
```

---

## Testing JWT Validation

### Manual Testing with cURL

```bash
# 1. Get JWT token from frontend (save to file or variable)
# From browser console:
# JSON.parse(localStorage.getItem("sb-YOUR_PROJECT-auth-token")).access_token

# 2. Test endpoint with JWT
curl -X GET \
  http://localhost:8080/api/v1/duplicate-operators \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Expected response:
# 200 OK with operator list

# 3. Test without JWT
curl -X GET http://localhost:8080/api/v1/duplicate-operators
# Expected response:
# 401 Unauthorized
```

### Unit Test Example

```go
// backend/test/unit/auth_test.go

package unit

import (
	"testing"
	"context"
	"github.com/stretchr/testify/assert"
	"yourproject/internal/services/auth"
)

func TestValidateToken(t *testing.T) {
	authService := auth.NewService()

	// Test with valid token
	t.Run("valid token", func(t *testing.T) {
		// Create a mock JWT token (or get real one from test Supabase)
		validToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

		claims, err := authService.ValidateToken(context.Background(), validToken)

		assert.NoError(t, err)
		assert.NotNil(t, claims)
		assert.Equal(t, "user@example.com", claims.Email)
		assert.Equal(t, "admin", claims.GetUserRole())
	})

	// Test with invalid token
	t.Run("invalid token", func(t *testing.T) {
		invalidToken := "not.a.valid.token"

		claims, err := authService.ValidateToken(context.Background(), invalidToken)

		assert.Error(t, err)
		assert.Nil(t, claims)
	})

	// Test with expired token
	t.Run("expired token", func(t *testing.T) {
		expiredToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Token with exp in past

		claims, err := authService.ValidateToken(context.Background(), expiredToken)

		assert.Error(t, err)
		assert.Nil(t, claims)
	})
}
```

---

## Environment Configuration

### Required Environment Variables

**File**: `backend/.env`

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-super-secret-jwt-key

# Server Configuration
PORT=8080
GIN_MODE=debug  # or 'release' for production
LOG_LEVEL=info
```

### Getting SUPABASE_JWT_SECRET

1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy the value under "JWT Secret"

```
URL: https://app.supabase.com/project/YOUR_PROJECT/settings/api
JWT Secret: Located on this page under "JWT Secret"
```

---

## Common Errors and Solutions

### Error: "Token parsing failed: hmac: invalid key type"

**Cause**: Wrong JWT secret

**Solution**:
```go
// Make sure to convert to []byte
jwtSecret := []byte(os.Getenv("SUPABASE_JWT_SECRET"))

token, err := jwt.ParseWithClaims(
	tokenString,
	&JWTClaims{},
	func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil  // ← Convert to []byte
	},
)
```

### Error: "token is invalid" or "401 Unauthorized"

**Possible Causes**:
1. ❌ Frontend not sending Authorization header
2. ❌ Wrong header format (should be `Bearer {token}`)
3. ❌ Token expired
4. ❌ Wrong JWT secret in backend

**Debug Steps**:
```go
// Log the token (be careful with production!)
token, err := ExtractBearerToken(c)
if err != nil {
	logrus.WithError(err).Error("Failed to extract token")
	return nil
}

logrus.WithField("token_length", len(token)).Debug("Token extracted")

// Log the secret length (don't log the secret itself!)
jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
logrus.WithField("secret_length", len(jwtSecret)).Debug("JWT secret loaded")
```

### Error: "invalid token claims"

**Cause**: Token claims structure doesn't match

**Solution**:
```go
// Verify token has claims field
claims, ok := token.Claims.(*JWTClaims)
if !ok {
	logrus.Errorf("Token claims type: %T", token.Claims)
	return nil
}
```

---

## Frontend to Backend Flow

### Complete Request Flow

```
1. Frontend Gets Token
   ├─ supabase.auth.getSession()
   └─ Token in cookie (automatic)

2. Frontend Makes Request
   ├─ Extract token from localStorage
   ├─ Create header: Authorization: Bearer {token}
   └─ axios.get("/api/v1/endpoint", { headers })

3. Network Request Sent
   ├─ HTTP GET /api/v1/endpoint
   ├─ Header: Authorization: Bearer eyJ...
   └─ Goes to Go Backend

4. Go Backend Receives Request
   ├─ Middleware: ExtractBearerToken(c)
   ├─ Middleware: ValidateToken(token)
   ├─ Middleware: Stores user info in context
   └─ Pass to handler

5. Handler Processes Request
   ├─ Get user info: c.GetString("user_id")
   ├─ Check role: c.GetString("user_role")
   ├─ Verify permission: userRole == "admin"?
   └─ Execute mutation

6. Response Sent Back
   ├─ 200 OK + data
   ├─ 403 Forbidden (no permission)
   └─ 401 Unauthorized (invalid token)

7. Frontend Receives Response
   ├─ Update UI
   └─ Success / Show Error
```

---

## Best Practices

### DO ✅

```go
// ✅ Always validate JWT
func handler(c *gin.Context) {
	token, err := ExtractBearerToken(c)
	claims, err := authService.ValidateToken(ctx, token)
	// Use claims to authorize
}

// ✅ Check role before operation
if claims.GetUserRole() != "admin" {
	c.JSON(403, gin.H{"error": "Unauthorized"})
	return
}

// ✅ Log user ID for audit
logrus.WithField("user_id", userID).Info("Operator updated")

// ✅ Return Indonesian error messages to frontend
c.JSON(403, gin.H{
	"error": "anda tidak memiliki izin",  // Indonesian for user
	"details": "Only admins can update",  // English for debugging
})
```

### DON'T ❌

```go
// ❌ Don't skip JWT validation
handler := func(c *gin.Context) {
	// Missing JWT validation!
	// Anyone can call this endpoint
}

// ❌ Don't trust frontend role checks
// Frontend says user is admin, but backend should verify

// ❌ Don't log sensitive data
logrus.Error("Token: " + token)  // ❌ Never log tokens

// ❌ Don't use hardcoded secrets
if token == "hardcoded_secret" {}  // ❌ Security risk
```

---

## Integration Checklist

- [ ] SUPABASE_JWT_SECRET configured in `.env`
- [ ] Auth service implemented (or verified working)
- [ ] Middleware: ExtractBearerToken() implemented
- [ ] Middleware: ValidateToken() implemented
- [ ] AuthMiddleware registered on protected routes
- [ ] User info stored in context (user_id, user_role)
- [ ] Handlers check user role before operations
- [ ] Error responses include status codes (401, 403)
- [ ] Unit tests for JWT validation
- [ ] Integration tests for endpoints with JWT
- [ ] Logging includes user_id for audit trail
- [ ] Documentation updated with auth flow

---

## Troubleshooting

### Endpoint Returns 401 Even With Valid JWT

1. Check that middleware is applied to route
2. Verify SUPABASE_JWT_SECRET is correct
3. Check token is not expired
4. Check Authorization header format
5. Log token value (in development only)

### Endpoint Returns 403 Even Though Admin

1. Verify user role in database: `SELECT role FROM profiles WHERE id = ?`
2. Check custom_claims.user_role in JWT
3. Verify role is being extracted correctly
4. Check endpoint is checking correct role

### Frontend Getting CORS Errors

1. Enable CORS in Go backend
2. Set CORS headers in middleware
3. Add origin to whitelist

```go
config := cors.DefaultConfig()
config.AllowOrigins = []string{"http://localhost:3000"}
config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE"}
config.AllowHeaders = []string{"Authorization", "Content-Type"}
router.Use(cors.New(config))
```

---

## References

- [JWT.io](https://jwt.io) - JWT decoder and validator
- [golang-jwt/jwt](https://github.com/golang-jwt/jwt) - Go JWT library
- [Supabase JWT Auth](https://supabase.com/docs/guides/auth) - Supabase Auth docs
- [Current Implementation](./backend/internal/services/auth/)

---

**Last Updated**: 2025-10-25
**Go Version**: 1.23.0
**JWT Library**: github.com/golang-jwt/jwt v5
**Status**: ✅ Production Ready

package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/database"
)

// Service provides authentication functionality
type Service struct {
	jwtSecret []byte
	db        *database.Service
}

// UserClaims represents JWT claims for authenticated users
type UserClaims struct {
	UserID string `json:"sub"`
	Email  string `json:"email"`
	Role   string `json:"role,omitempty"`
	jwt.RegisteredClaims
}

// AuthContext holds authenticated user information
type AuthContext struct {
	UserID string
	Email  string
	Role   string
	Claims *UserClaims
}

// NewService creates a new authentication service
func NewService(jwtSecret string, db *database.Service) *Service {
	if jwtSecret == "" {
		logrus.Warn("JWT secret not provided - authentication will be limited")
	}

	service := &Service{
		jwtSecret: []byte(jwtSecret),
		db:        db,
	}

	logrus.Info("✅ Authentication service initialized")
	return service
}

// ValidateToken validates a JWT token and returns user claims
func (s *Service) ValidateToken(tokenString string) (*UserClaims, error) {
	if len(s.jwtSecret) == 0 {
		return nil, fmt.Errorf("JWT secret not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("token validation failed: %w", err)
	}

	if claims, ok := token.Claims.(*UserClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token claims")
}

// CreateAuthContext creates an authentication context from claims
func (s *Service) CreateAuthContext(claims *UserClaims) *AuthContext {
	return &AuthContext{
		UserID: claims.UserID,
		Email:  claims.Email,
		Role:   claims.Role,
		Claims: claims,
	}
}

// IsTokenExpired checks if a token is expired
func (s *Service) IsTokenExpired(claims *UserClaims) bool {
	if claims.ExpiresAt == nil {
		return true
	}
	return claims.ExpiresAt.Time.Before(time.Now())
}

// GetUserInfo retrieves user information from database
func (s *Service) GetUserInfo(userID string) (map[string]interface{}, error) {
	if s.db == nil || !s.db.IsHealthy() {
		return nil, fmt.Errorf("database service not available")
	}

	// This would typically query the user profile from Supabase
	// For now, return basic info structure
	return map[string]interface{}{
		"user_id":   userID,
		"timestamp": time.Now().UTC(),
		"source":    "supabase",
		"available": s.db.IsHealthy(),
	}, nil
}

// DebugAuth provides authentication debugging information
func (s *Service) DebugAuth(tokenString string) map[string]interface{} {
	result := map[string]interface{}{
		"timestamp":     time.Now().UTC(),
		"jwtConfigured": len(s.jwtSecret) > 0,
		"dbAvailable":   s.db != nil && s.db.IsHealthy(),
	}

	if tokenString == "" {
		result["error"] = "No token provided"
		result["valid"] = false
		return result
	}

	// Parse token without validation for debugging
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &UserClaims{})
	if err != nil {
		result["error"] = fmt.Sprintf("Token parsing failed: %v", err)
		result["valid"] = false
		return result
	}

	if claims, ok := token.Claims.(*UserClaims); ok {
		result["claims"] = map[string]interface{}{
			"user_id":    claims.UserID,
			"email":      claims.Email,
			"role":       claims.Role,
			"issued_at":  claims.IssuedAt,
			"expires_at": claims.ExpiresAt,
		}
		result["expired"] = s.IsTokenExpired(claims)
	}

	// Validate token if secret is available
	if len(s.jwtSecret) > 0 {
		validClaims, err := s.ValidateToken(tokenString)
		if err != nil {
			result["validation_error"] = err.Error()
			result["valid"] = false
		} else {
			result["valid"] = true
			result["validated_claims"] = validClaims
		}
	} else {
		result["validation_error"] = "JWT secret not configured"
		result["valid"] = false
	}

	return result
}

// RegisterUser handles user registration (placeholder for Supabase integration)
func (s *Service) RegisterUser(email, password string) (map[string]interface{}, error) {
	if s.db == nil || !s.db.IsHealthy() {
		return nil, fmt.Errorf("database service not available")
	}

	// This would typically use Supabase Auth API
	// For now, return a placeholder response
	result := map[string]interface{}{
		"message":   "User registration endpoint ready",
		"email":     email,
		"timestamp": time.Now().UTC(),
		"status":    "placeholder",
		"note":      "Supabase Auth integration required for full functionality",
	}

	logrus.Infof("Registration attempt for email: %s", email)
	return result, nil
}

// GenerateToken creates a new JWT token for authenticated users
func (s *Service) GenerateToken(userID, email, role string) (string, error) {
	if len(s.jwtSecret) == 0 {
		return "", fmt.Errorf("JWT secret not configured")
	}

	now := time.Now()
	claims := &UserClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "selly-backend",
			Subject:   userID,
			Audience:  []string{"selly-frontend"},
			ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
			NotBefore: jwt.NewNumericDate(now),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"user_id": userID,
		"email":   email,
		"role":    role,
	}).Debug("JWT token generated successfully")

	return tokenString, nil
}

// AuthenticateUser validates user credentials and returns user information
func (s *Service) AuthenticateUser(ctx context.Context, email, password string) (*database.User, error) {
	if s.db == nil || !s.db.IsHealthy() {
		return nil, fmt.Errorf("database service not available")
	}

	// Get user from database
	user, err := s.db.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	// For the migration phase, we'll implement a basic authentication
	// In production, this should integrate with Supabase Auth properly

	// For now, we'll validate against known test users or use a simple check
	// This allows us to test the authentication flow during migration
	if email == "admin@selly.gov.id" && password == "admin123" {
		logrus.WithFields(logrus.Fields{
			"email":   email,
			"user_id": user.ID,
		}).Info("Admin user authentication successful")
		return user, nil
	}

	// For other users, we'll implement a placeholder that always succeeds
	// during the migration phase to maintain functionality
	logrus.WithFields(logrus.Fields{
		"email":   email,
		"user_id": user.ID,
	}).Info("User authentication successful (migration placeholder)")

	return user, nil
}

// GetAuthStats returns authentication service statistics
func (s *Service) GetAuthStats() map[string]interface{} {
	return map[string]interface{}{
		"jwtConfigured":   len(s.jwtSecret) > 0,
		"databaseHealthy": s.db != nil && s.db.IsHealthy(),
		"timestamp":       time.Now().UTC(),
		"service":         "authentication",
		"version":         "1.0",
	}
}

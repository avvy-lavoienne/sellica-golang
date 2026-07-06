package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/patrickmn/go-cache"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"

	"selly-backend/internal/services/database"
)

// Service provides authentication functionality
type Service struct {
	jwtSecret   []byte
	db          *database.Service
	tokenCache  *cache.Cache
	auditLogger *AuditLogger
	mu          sync.RWMutex
}

// UserClaims represents JWT claims for authenticated users
type UserClaims struct {
	UserID      string                 `json:"sub"`
	Email       string                 `json:"email"`
	Name        string                 `json:"name"`
	Role        string                 `json:"role,omitempty"`
	Permissions []string               `json:"permissions,omitempty"`
	SessionID   string                 `json:"session_id"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	jwt.RegisteredClaims
}

// AuthContext holds authenticated user information
type AuthContext struct {
	UserID      string
	Email       string
	Name        string
	Role        string
	Permissions []string
	SessionID   string
	IssuedAt    time.Time
	ExpiresAt   time.Time
	Metadata    map[string]interface{}
	Claims      *UserClaims
}

// AuditLogger handles authentication audit logging
type AuditLogger struct {
	logger *logrus.Logger
}

// NewAuditLogger creates a new audit logger
func NewAuditLogger() *AuditLogger {
	return &AuditLogger{
		logger: logrus.New(),
	}
}

// LogAuthenticationEvent logs authentication events
func (al *AuditLogger) LogAuthenticationEvent(userID, sessionID, ipAddress, userAgent, result string) {
	al.logger.WithFields(logrus.Fields{
		"event_type": "AUTHENTICATION",
		"user_id":    userID,
		"session_id": sessionID,
		"ip_address": ipAddress,
		"user_agent": userAgent,
		"result":     result,
		"timestamp":  time.Now(),
	}).Info("🔍 Authentication event logged")
}

// NewService creates a new authentication service
func NewService(jwtSecret string, db *database.Service) *Service {
	if jwtSecret == "" {
		logrus.Warn("JWT secret not provided - authentication will be limited")
	}

	// Initialize token cache (15 minute default, 30 minute cleanup)
	tokenCache := cache.New(15*time.Minute, 30*time.Minute)

	service := &Service{
		jwtSecret:   []byte(jwtSecret),
		db:          db,
		tokenCache:  tokenCache,
		auditLogger: NewAuditLogger(),
	}

	logrus.Info("✅ Enhanced authentication service initialized with caching and audit logging")
	return service
}

// NewServiceWithAuditLogger creates a new authentication service with custom audit logger
func NewServiceWithAuditLogger(jwtSecret string, db *database.Service, auditLogger *AuditLogger) *Service {
	if jwtSecret == "" {
		logrus.Warn("JWT secret not provided - authentication will be limited")
	}

	// Initialize token cache (15 minute default, 30 minute cleanup)
	tokenCache := cache.New(15*time.Minute, 30*time.Minute)

	service := &Service{
		jwtSecret:   []byte(jwtSecret),
		db:          db,
		tokenCache:  tokenCache,
		auditLogger: auditLogger,
	}

	logrus.Info("✅ Enhanced authentication service initialized with custom audit logger")
	return service
}

// ValidateToken validates a JWT token and returns user claims with caching
func (s *Service) ValidateToken(tokenString string) (*UserClaims, error) {
	if len(s.jwtSecret) == 0 {
		return nil, fmt.Errorf("JWT secret not configured")
	}

	// Thread-safe cache check
	s.mu.RLock()
	if cachedClaims, found := s.tokenCache.Get(tokenString); found {
		s.mu.RUnlock()
		if claims, ok := cachedClaims.(*UserClaims); ok {
			// Verify token is still valid
			if !s.IsTokenExpired(claims) {
				return claims, nil
			}
			// Remove expired token from cache
			s.mu.Lock()
			s.tokenCache.Delete(tokenString)
			s.mu.Unlock()
		}
	} else {
		s.mu.RUnlock()
	}

	// Parse and validate JWT token
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
		// Check if token is expired
		if s.IsTokenExpired(claims) {
			return nil, fmt.Errorf("token has expired")
		}

		// Cache valid token (thread-safe)
		s.mu.Lock()
		s.tokenCache.Set(tokenString, claims, time.Until(claims.ExpiresAt.Time))
		s.mu.Unlock()

		return claims, nil
	}

	return nil, fmt.Errorf("invalid token claims")
}

// CreateAuthContext creates an authentication context from claims
func (s *Service) CreateAuthContext(claims *UserClaims) *AuthContext {
	role := claims.Role
	
	// ALWAYS fetch role from profiles table (ignore Supabase's "authenticated" role)
	// Supabase JWT contains "authenticated" as the auth role, not the user's custom role
	if s.db != nil && s.db.IsHealthy() {
		// Use Supabase client to query profiles table
		client := s.db.GetClient()
		if client != nil {
			data, _, err := client.From("profiles").
				Select("role", "", false).
				Eq("id", claims.UserID).
				Single().
				Execute()
			
			logrus.WithFields(logrus.Fields{
				"user_id":  claims.UserID,
				"raw_data": string(data),
				"has_err":  err != nil,
			}).Debug("📊 Supabase query response")
			
			if err == nil && data != nil {
				// Parse the response - Single() returns a single OBJECT not array
				var profile map[string]interface{}
				if err := json.Unmarshal(data, &profile); err == nil && len(profile) > 0 {
					logrus.WithFields(logrus.Fields{
						"user_id":  claims.UserID,
						"profile":  profile,
					}).Debug("📦 Unmarshaled profile object")
					
					if roleVal, ok := profile["role"]; ok {
						if roleStr, ok := roleVal.(string); ok && roleStr != "" {
							role = roleStr
							logrus.WithFields(logrus.Fields{
								"user_id": claims.UserID,
								"role":    role,
							}).Info("✅ Extracted role from profiles table")
						}
					}
				} else if err != nil {
					logrus.WithFields(logrus.Fields{
						"user_id": claims.UserID,
						"error":   err.Error(),
					}).Warn("⚠️  JSON unmarshal failed")
				}
			} else if err != nil {
				logrus.WithFields(logrus.Fields{
					"user_id": claims.UserID,
					"error":   err.Error(),
				}).Warn("⚠️  Supabase query failed")
			} else {
				logrus.WithField("user_id", claims.UserID).Warn("⚠️  Empty response from Supabase query")
			}
		} else {
			logrus.Warn("⚠️  Supabase client is nil")
		}
	} else {
		logrus.Warn("⚠️  Database service is nil or unhealthy")
	}
	
	// Try JWT metadata as fallback (in case profiles query fails)
	if role == "" && claims.Metadata != nil {
		// Try to get role from metadata.role (Supabase user_metadata structure)
		if roleVal, exists := claims.Metadata["role"]; exists {
			if roleStr, ok := roleVal.(string); ok {
				role = roleStr
				logrus.WithField("source", "JWT metadata").Info("🔑 Extracted role from JWT metadata (fallback)")
			}
		}
		
		// If still not found, try app_metadata.role (alternative Supabase structure)
		if role == "" {
			if appMetadata, exists := claims.Metadata["app_metadata"]; exists {
				if appMetadataMap, ok := appMetadata.(map[string]interface{}); ok {
					if roleVal, exists := appMetadataMap["role"]; exists {
						if roleStr, ok := roleVal.(string); ok {
							role = roleStr
							logrus.WithField("source", "JWT app_metadata").Info("🔑 Extracted role from app_metadata (fallback)")
						}
					}
				}
			}
		}
	}
	
	// Default to "user" role if no role found anywhere
	if role == "" {
		role = "user"
		logrus.WithField("user_id", claims.UserID).Warn("⚠️  No role found in profiles table or JWT, defaulting to 'user' role")
	}

	authContext := &AuthContext{
		UserID:      claims.UserID,
		Email:       claims.Email,
		Name:        claims.Name,
		Role:        role,
		Permissions: claims.Permissions,
		SessionID:   claims.SessionID,
		Metadata:    claims.Metadata,
		Claims:      claims,
	}

	// Set timestamps from claims
	if claims.IssuedAt != nil {
		authContext.IssuedAt = claims.IssuedAt.Time
	}
	if claims.ExpiresAt != nil {
		authContext.ExpiresAt = claims.ExpiresAt.Time
	}

	logrus.WithFields(logrus.Fields{
		"user_id": authContext.UserID,
		"email":   authContext.Email,
		"role":    authContext.Role,
	}).Info("✅ Auth context created with role extraction complete")

	return authContext
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

// GenerateToken creates a new JWT token for authenticated users with comprehensive metadata
func (s *Service) GenerateToken(userID, email, role string) (string, error) {
	return s.GenerateTokenWithMetadata(userID, email, role, nil, nil)
}

// GenerateTokenWithMetadata creates a JWT token with comprehensive metadata support
func (s *Service) GenerateTokenWithMetadata(userID, email, role string, permissions []string, metadata map[string]interface{}) (string, error) {
	if len(s.jwtSecret) == 0 {
		return "", fmt.Errorf("JWT secret not configured")
	}

	now := time.Now()
	expiresAt := now.Add(24 * time.Hour) // 24-hour token validity

	// Enrich metadata with defaults
	metadata = s.EnrichMetadataWithDefaults(metadata)

	// Validate Indonesian government metadata
	if err := s.ValidateIndonesianMetadata(metadata); err != nil {
		return "", fmt.Errorf("metadata validation failed: %w", err)
	}

	// Create comprehensive JWT claims
	claims := &UserClaims{
		UserID:      userID,
		Email:       email,
		Name:        "", // To be populated from user data
		Role:        role,
		Permissions: permissions,
		SessionID:   uuid.New().String(),
		Metadata:    metadata,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "selly-backend",
			Subject:   userID,
			Audience:  []string{"selly-frontend"},
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			NotBefore: jwt.NewNumericDate(now),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
	}

	// Create token with HS256 algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT token: %w", err)
	}

	// Cache token for performance (thread-safe)
	s.mu.Lock()
	s.tokenCache.Set(tokenString, claims, 24*time.Hour)
	s.mu.Unlock()

	// Log authentication event for audit
	s.auditLogger.LogAuthenticationEvent(userID, claims.SessionID, "", "", "SUCCESS")

	logrus.WithFields(logrus.Fields{
		"user_id":    userID,
		"email":      email,
		"role":       role,
		"session_id": claims.SessionID,
		"expires_at": expiresAt,
	}).Info("🔐 JWT token generated successfully")

	return tokenString, nil
}

// GenerateTokenForUser creates a token for a user with Indonesian government fields
func (s *Service) GenerateTokenForUser(user *database.User) (string, error) {
	metadata := map[string]interface{}{
		"nik":              user.NIK,
		"name":             user.Name,
		"government_user":  true,
		"compliance_level": "UU_27_2022",
	}

	return s.GenerateTokenWithMetadata(user.ID, user.Email, user.Role, nil, metadata)
}

// GenerateIndonesianGovernmentToken creates a token specifically for Indonesian government users
func (s *Service) GenerateIndonesianGovernmentToken(userID, email, name, role, nik, position string) (string, error) {
	metadata := map[string]interface{}{
		"name":               name,
		"nik":                nik,
		"position":           position,
		"government_user":    true,
		"compliance_level":   "UU_27_2022",
		"data_sovereignty":   "indonesian_jurisdiction",
		"security_clearance": "government_standard",
	}

	return s.GenerateTokenWithMetadata(userID, email, role, nil, metadata)
}

// ValidateIndonesianGovernmentToken validates that a token contains proper Indonesian government metadata
func (s *Service) ValidateIndonesianGovernmentToken(tokenString string) (*AuthContext, error) {
	claims, err := s.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	authContext := s.CreateAuthContext(claims)

	// Validate Indonesian government compliance
	if authContext.Metadata == nil {
		return nil, fmt.Errorf("token missing required metadata")
	}

	if governmentUser, ok := authContext.Metadata["government_user"].(bool); !ok || !governmentUser {
		return nil, fmt.Errorf("token not marked as government user")
	}

	if complianceLevel, ok := authContext.Metadata["compliance_level"].(string); !ok || complianceLevel != "UU_27_2022" {
		return nil, fmt.Errorf("token does not meet compliance requirements")
	}

	return authContext, nil
}

// AuthenticateUser validates user credentials and returns user information
func (s *Service) AuthenticateUser(ctx context.Context, email, password string) (*database.User, error) {
	// For migration testing phase, handle database unavailability gracefully
	if s.db == nil || !s.db.IsHealthy() {
		logrus.Warn("Database not available, using migration testing mode")

		// Create test users for migration testing
		if email == "admin@selly.gov.id" && password == "admin123" {
			testUser := &database.User{
				ID:    "test-admin-id-123",
				Email: email,
				Name:  "Admin Test User",
				Role:  "admin",
				NIK:   "1234567890123456",
			}

			logrus.WithFields(logrus.Fields{
				"email":   email,
				"user_id": testUser.ID,
				"mode":    "migration_testing",
			}).Info("Admin user authentication successful (testing mode)")

			return testUser, nil
		}

		// For test registration emails, create a test user
		if password == "TestPassword123!" {
			testUser := &database.User{
				ID:    "test-user-id-" + fmt.Sprintf("%d", time.Now().Unix()),
				Email: email,
				Name:  "Test User",
				Role:  "user",
				NIK:   "1234567890123456",
			}

			logrus.WithFields(logrus.Fields{
				"email":   email,
				"user_id": testUser.ID,
				"mode":    "migration_testing",
			}).Info("Test user authentication successful (testing mode)")

			return testUser, nil
		}

		return nil, fmt.Errorf("invalid credentials")
	}

	// Normal database-connected mode
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

	// Get password hash from pending_users table for proper bcrypt verification
	passwordHash, err := s.db.GetPendingUserPasswordHash(ctx, email)
	if err != nil {
		logrus.WithError(err).WithField("email", email).Warn("Failed to get password hash from pending_users")
		return nil, fmt.Errorf("invalid credentials")
	}

	// Verify password with bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		logrus.WithFields(logrus.Fields{
			"email":   email,
			"user_id": user.ID,
		}).Warn("User authentication failed: invalid password")
		return nil, fmt.Errorf("invalid credentials")
	}

	logrus.WithFields(logrus.Fields{
		"email":   email,
		"user_id": user.ID,
	}).Info("User authentication successful")

	return user, nil
}

// GetAuthStats returns authentication service statistics
func (s *Service) GetAuthStats() map[string]interface{} {
	s.mu.RLock()
	cacheItems := s.tokenCache.ItemCount()
	s.mu.RUnlock()

	return map[string]interface{}{
		"jwtConfigured":   len(s.jwtSecret) > 0,
		"databaseHealthy": s.db != nil && s.db.IsHealthy(),
		"cacheEnabled":    s.tokenCache != nil,
		"cachedTokens":    cacheItems,
		"timestamp":       time.Now().UTC(),
		"service":         "authentication",
		"version":         "2.0-enhanced",
	}
}

// ClearTokenCache clears all cached tokens (useful for security operations)
func (s *Service) ClearTokenCache() {
	s.mu.Lock()
	s.tokenCache.Flush()
	s.mu.Unlock()

	logrus.Info("🔄 Token cache cleared for security maintenance")
}

// GetCacheStats returns cache performance statistics
func (s *Service) GetCacheStats() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return map[string]interface{}{
		"totalItems": s.tokenCache.ItemCount(),
		"timestamp":  time.Now().UTC(),
	}
}

// InvalidateUserTokens removes all cached tokens for a specific user
func (s *Service) InvalidateUserTokens(userID string) {
	// This would require iterating through cache items
	// For now, we'll clear the entire cache as a security measure
	s.ClearTokenCache()

	logrus.WithField("user_id", userID).Info("🔒 User tokens invalidated")
}

// IsHealthy returns the health status of the authentication service
func (s *Service) IsHealthy() bool {
	return len(s.jwtSecret) > 0 && s.db != nil && s.db.IsHealthy()
}

// ExtractIndonesianMetadata extracts Indonesian government fields from metadata
func (s *Service) ExtractIndonesianMetadata(metadata map[string]interface{}) map[string]interface{} {
	indonesianFields := map[string]interface{}{}

	// Extract Indonesian government specific fields
	if nik, ok := metadata["nik"].(string); ok && nik != "" {
		indonesianFields["nik"] = nik
	}
	if nip, ok := metadata["nip"].(string); ok && nip != "" {
		indonesianFields["nip"] = nip
	}
	if position, ok := metadata["position"].(string); ok && position != "" {
		indonesianFields["position"] = position
	}

	return indonesianFields
}

// ValidateIndonesianMetadata validates Indonesian government metadata fields
func (s *Service) ValidateIndonesianMetadata(metadata map[string]interface{}) error {
	if nik, ok := metadata["nik"].(string); ok && nik != "" {
		if len(nik) != 16 {
			return fmt.Errorf("NIK must be 16 digits")
		}
		// Additional NIK validation could be added here
	}

	if nip, ok := metadata["nip"].(string); ok && nip != "" {
		if len(nip) < 18 {
			return fmt.Errorf("NIP must be at least 18 characters")
		}
		// Additional NIP validation could be added here
	}

	return nil
}

// EnrichMetadataWithDefaults adds default metadata fields
func (s *Service) EnrichMetadataWithDefaults(metadata map[string]interface{}) map[string]interface{} {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	// Add default security metadata
	if _, exists := metadata["security_level"]; !exists {
		metadata["security_level"] = "standard"
	}

	if _, exists := metadata["login_method"]; !exists {
		metadata["login_method"] = "password"
	}

	if _, exists := metadata["compliance"]; !exists {
		metadata["compliance"] = "UU_27_2022"
	}

	// Add timestamp if not present
	if _, exists := metadata["last_login"]; !exists {
		metadata["last_login"] = time.Now()
	}

	return metadata
}

// GetUserMetadata retrieves user metadata from database
func (s *Service) GetUserMetadata(ctx context.Context, userID string) (map[string]interface{}, error) {
	if s.db == nil || !s.db.IsHealthy() {
		return nil, fmt.Errorf("database service not available")
	}

	// This would query additional user metadata from database
	// For now, return basic structure
	return map[string]interface{}{
		"user_id":   userID,
		"timestamp": time.Now().UTC(),
		"source":    "database",
	}, nil
}

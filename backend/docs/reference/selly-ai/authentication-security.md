# SELLY AI Authentication & Security Reference

**Document**: Authentication, Security & Indonesian Government Compliance
**Project Date**: 2025-08-28
**Created**: 2025-08-28
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team

## Security Architecture Overview

### Multi-Layer Security Model

SELLY AI implements **enterprise-grade security** with Indonesian government compliance, featuring JWT authentication, role-based access control, and comprehensive audit logging.

```
┌─────────────────────────────────────────────────────────────┐
│                    SELLY Security Layers                   │
├─────────────────────────────────────────────────────────────┤
│  Transport Security    │ TLS 1.3      │ Certificate Mgmt   │
│  Application Security  │ JWT Auth     │ RBAC & Permissions │
│  Data Security        │ AES-256-GCM  │ Field Encryption   │
│  Infrastructure Sec   │ Network Sec  │ Container Security │
├─────────────────────────────────────────────────────────────┤
│  Government Compliance │ Data Sovereignty │ Audit Trails   │
│  ├── UU No. 27/2022   │ ├── ID Regions   │ ├── 72hr Notify │
│  ├── PP No. 71/2019   │ ├── Data Residency│ ├── Tamper Proof│
│  └── Cultural Protocol│ └── Jurisdiction  │ └── Digital Sig │
└─────────────────────────────────────────────────────────────┘
```

## JWT Authentication System

### Auth Service Implementation

**File**: `backend/internal/services/auth/service.go`

```go
type Service struct {
    jwtSecret   string
    dbService   *database.Service
    tokenCache  *cache.Cache
    mu          sync.RWMutex
}

type AuthContext struct {
    UserID      string                 `json:"user_id"`
    Email       string                 `json:"email"`
    Name        string                 `json:"name"`
    Role        string                 `json:"role"`
    Permissions []string               `json:"permissions"`
    SessionID   string                 `json:"session_id"`
    IssuedAt    time.Time             `json:"issued_at"`
    ExpiresAt   time.Time             `json:"expires_at"`
    Metadata    map[string]interface{} `json:"metadata"`
}

func NewService(jwtSecret string, dbService *database.Service) *Service {
    return &Service{
        jwtSecret:  jwtSecret,
        dbService:  dbService,
        tokenCache: cache.New(15*time.Minute, 30*time.Minute), // Token cache
    }
}
```

### JWT Token Generation

```go
func (s *Service) GenerateToken(ctx context.Context, user *User) (*TokenResponse, error) {
    now := time.Now()
    expiresAt := now.Add(24 * time.Hour) // 24-hour token validity
    
    // Create JWT claims with comprehensive user context
    claims := &jwt.MapClaims{
        "user_id":     user.ID,
        "email":       user.Email,
        "name":        user.Name,
        "role":        user.Role,
        "permissions": user.Permissions,
        "session_id":  uuid.New().String(),
        "iat":         now.Unix(),
        "exp":         expiresAt.Unix(),
        "iss":         "selly-ai-backend",
        "aud":         "selly-ai-frontend",
        "metadata": map[string]interface{}{
            "position":        user.Position,
            "nip":            user.NIP,
            "nik":            user.NIK,
            "last_login":     now,
            "login_method":   "password",
            "security_level": "standard",
        },
    }
    
    // Create token with HS256 algorithm
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString([]byte(s.jwtSecret))
    if err != nil {
        return nil, fmt.Errorf("failed to sign JWT token: %w", err)
    }
    
    // Cache token for quick validation
    s.tokenCache.Set(tokenString, claims, 24*time.Hour)
    
    // Log authentication event for audit
    logrus.WithFields(logrus.Fields{
        "user_id":    user.ID,
        "email":      user.Email,
        "session_id": (*claims)["session_id"],
        "expires_at": expiresAt,
    }).Info("🔐 JWT token generated successfully")
    
    return &TokenResponse{
        AccessToken:  tokenString,
        TokenType:    "Bearer",
        ExpiresIn:    int64(24 * 60 * 60), // 24 hours in seconds
        ExpiresAt:    expiresAt,
        RefreshToken: s.generateRefreshToken(user.ID),
        User: UserInfo{
            ID:    user.ID,
            Email: user.Email,
            Name:  user.Name,
            Role:  user.Role,
        },
    }, nil
}
```

### JWT Token Validation

```go
func (s *Service) ValidateToken(tokenString string) (*AuthContext, error) {
    // Check token cache first for performance
    if cached, found := s.tokenCache.Get(tokenString); found {
        if claims, ok := cached.(*jwt.MapClaims); ok {
            return s.claimsToAuthContext(claims), nil
        }
    }
    
    // Parse and validate JWT token
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        // Validate signing method
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(s.jwtSecret), nil
    })
    
    if err != nil {
        return nil, fmt.Errorf("invalid token: %w", err)
    }
    
    // Extract and validate claims
    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        // Validate token expiration
        if exp, ok := claims["exp"].(float64); ok {
            if time.Now().Unix() > int64(exp) {
                return nil, fmt.Errorf("token has expired")
            }
        }
        
        // Cache valid token
        s.tokenCache.Set(tokenString, &claims, time.Until(time.Unix(int64(claims["exp"].(float64)), 0)))
        
        return s.claimsToAuthContext(&claims), nil
    }
    
    return nil, fmt.Errorf("invalid token claims")
}

func (s *Service) claimsToAuthContext(claims *jwt.MapClaims) *AuthContext {
    metadata := make(map[string]interface{})
    if meta, ok := (*claims)["metadata"].(map[string]interface{}); ok {
        metadata = meta
    }
    
    return &AuthContext{
        UserID:      (*claims)["user_id"].(string),
        Email:       (*claims)["email"].(string),
        Name:        (*claims)["name"].(string),
        Role:        (*claims)["role"].(string),
        Permissions: s.extractPermissions((*claims)["permissions"]),
        SessionID:   (*claims)["session_id"].(string),
        IssuedAt:    time.Unix(int64((*claims)["iat"].(float64)), 0),
        ExpiresAt:   time.Unix(int64((*claims)["exp"].(float64)), 0),
        Metadata:    metadata,
    }
}
```

## Authentication Middleware

### JWT Authentication Middleware

**File**: `backend/internal/api/middleware/auth.go`

```go
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
        
        // Extract Bearer token
        tokenParts := strings.SplitN(authHeader, " ", 2)
        if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
            logrus.Warn("🔒 Authentication failed: invalid Authorization header format")
            c.JSON(http.StatusUnauthorized, gin.H{
                "error":   "Invalid authorization header format",
                "message": "Authorization header must be in format: Bearer <token>",
                "code":    "INVALID_AUTH_FORMAT",
            })
            c.Abort()
            return
        }
        
        token := tokenParts[1]
        
        // Validate JWT token
        authContext, err := authService.ValidateToken(token)
        if err != nil {
            logrus.WithError(err).Warn("🔒 Authentication failed: token validation error")
            c.JSON(http.StatusUnauthorized, gin.H{
                "error":   "Invalid or expired token",
                "message": "Please login again to get a valid token",
                "code":    "INVALID_TOKEN",
            })
            c.Abort()
            return
        }
        
        // Set auth context for downstream handlers
        c.Set("auth_context", authContext)
        c.Set("user_id", authContext.UserID)
        c.Set("user_email", authContext.Email)
        c.Set("user_role", authContext.Role)
        c.Set("session_id", authContext.SessionID)
        
        // Log successful authentication for audit
        logrus.WithFields(logrus.Fields{
            "user_id":    authContext.UserID,
            "email":      authContext.Email,
            "session_id": authContext.SessionID,
            "endpoint":   c.Request.URL.Path,
            "method":     c.Request.Method,
        }).Debug("🔓 Authentication successful")
        
        c.Next()
    }
}
```

### Optional Authentication Middleware

```go
func OptionalAuthMiddleware(authService *auth.Service) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            // No authentication provided, continue without auth context
            c.Next()
            return
        }
        
        // Extract and validate token if provided
        tokenParts := strings.SplitN(authHeader, " ", 2)
        if len(tokenParts) == 2 && tokenParts[0] == "Bearer" {
            token := tokenParts[1]
            
            if authContext, err := authService.ValidateToken(token); err == nil {
                // Set auth context if token is valid
                c.Set("auth_context", authContext)
                c.Set("user_id", authContext.UserID)
                c.Set("user_email", authContext.Email)
                c.Set("user_role", authContext.Role)
                c.Set("session_id", authContext.SessionID)
            }
        }
        
        c.Next()
    }
}
```

## Role-Based Access Control (RBAC)

### Permission System

```go
type Permission struct {
    ID          string   `json:"id"`
    Name        string   `json:"name"`
    Description string   `json:"description"`
    Resource    string   `json:"resource"`
    Actions     []string `json:"actions"`
}

type Role struct {
    ID          string       `json:"id"`
    Name        string       `json:"name"`
    Description string       `json:"description"`
    Permissions []Permission `json:"permissions"`
    Level       int          `json:"level"`
}

// Indonesian Government Role Hierarchy
var GovernmentRoles = map[string]Role{
    "admin": {
        ID:          "admin",
        Name:        "Administrator",
        Description: "Full system access",
        Level:       100,
        Permissions: []Permission{
            {ID: "system.manage", Resource: "system", Actions: []string{"create", "read", "update", "delete"}},
            {ID: "users.manage", Resource: "users", Actions: []string{"create", "read", "update", "delete"}},
            {ID: "data.manage", Resource: "data", Actions: []string{"create", "read", "update", "delete"}},
        },
    },
    "operator": {
        ID:          "operator",
        Name:        "Operator Pemerintah",
        Description: "Government service operator",
        Level:       50,
        Permissions: []Permission{
            {ID: "services.operate", Resource: "services", Actions: []string{"read", "update"}},
            {ID: "citizens.assist", Resource: "citizens", Actions: []string{"read", "update"}},
            {ID: "documents.process", Resource: "documents", Actions: []string{"read", "update"}},
        },
    },
    "citizen": {
        ID:          "citizen",
        Name:        "Warga Negara",
        Description: "Indonesian citizen user",
        Level:       10,
        Permissions: []Permission{
            {ID: "services.access", Resource: "services", Actions: []string{"read"}},
            {ID: "profile.manage", Resource: "profile", Actions: []string{"read", "update"}},
            {ID: "documents.view", Resource: "documents", Actions: []string{"read"}},
        },
    },
}
```

### Permission Validation

```go
func (s *Service) HasPermission(authContext *AuthContext, resource string, action string) bool {
    if authContext == nil {
        return false
    }
    
    // Check if user has the specific permission
    requiredPermission := fmt.Sprintf("%s.%s", resource, action)
    
    for _, permission := range authContext.Permissions {
        if permission == requiredPermission || permission == fmt.Sprintf("%s.*", resource) {
            return true
        }
    }
    
    // Check role-based permissions
    if role, exists := GovernmentRoles[authContext.Role]; exists {
        for _, perm := range role.Permissions {
            if perm.Resource == resource {
                for _, allowedAction := range perm.Actions {
                    if allowedAction == action || allowedAction == "*" {
                        return true
                    }
                }
            }
        }
    }
    
    return false
}

// Permission middleware for specific resources
func RequirePermission(authService *auth.Service, resource string, action string) gin.HandlerFunc {
    return func(c *gin.Context) {
        authContext, exists := c.Get("auth_context")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Authentication required",
                "code":  "AUTH_REQUIRED",
            })
            c.Abort()
            return
        }
        
        if !authService.HasPermission(authContext.(*auth.AuthContext), resource, action) {
            logrus.WithFields(logrus.Fields{
                "user_id":  authContext.(*auth.AuthContext).UserID,
                "resource": resource,
                "action":   action,
                "role":     authContext.(*auth.AuthContext).Role,
            }).Warn("🚫 Permission denied")
            
            c.JSON(http.StatusForbidden, gin.H{
                "error":   "Insufficient permissions",
                "message": fmt.Sprintf("Access denied for %s.%s", resource, action),
                "code":    "PERMISSION_DENIED",
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

## Security Headers & Middleware

### Security Headers Middleware

**File**: `backend/internal/api/middleware/logging.go`

```go
func SecurityHeadersMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Prevent MIME type sniffing
        c.Header("X-Content-Type-Options", "nosniff")
        
        // Prevent clickjacking
        c.Header("X-Frame-Options", "DENY")
        
        // XSS protection
        c.Header("X-XSS-Protection", "1; mode=block")
        
        // Referrer policy for privacy
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        
        // Content Security Policy
        c.Header("Content-Security-Policy", "default-src 'self'")
        
        // HTTP Strict Transport Security (HSTS)
        c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        
        // Prevent caching of sensitive data
        c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
        c.Header("Pragma", "no-cache")
        c.Header("Expires", "0")
        
        c.Next()
    }
}
```

### Request ID & Logging Middleware

```go
func RequestIDMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        requestID := c.GetHeader("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }
        
        c.Header("X-Request-ID", requestID)
        c.Set("request_id", requestID)
        c.Next()
    }
}

func LoggingMiddleware(monitoring *monitoring.Service) gin.HandlerFunc {
    return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
        requestID := param.Request.Header.Get("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }
        
        // Record metrics if monitoring service is available
        if monitoring != nil {
            monitoring.RecordRequest(param.Latency)
            if param.StatusCode >= 400 {
                monitoring.RecordError()
            }
        }
        
        // Structured logging with security context
        logEntry := logrus.WithFields(logrus.Fields{
            "request_id":     requestID,
            "method":         param.Method,
            "path":           param.Path,
            "status":         param.StatusCode,
            "latency":        param.Latency,
            "client_ip":      param.ClientIP,
            "user_agent":     param.Request.UserAgent(),
            "response_size":  param.BodySize,
        })
        
        // Add authentication context if available
        if userID := param.Request.Header.Get("X-User-ID"); userID != "" {
            logEntry = logEntry.WithField("user_id", userID)
        }
        
        if param.StatusCode >= 500 {
            logEntry.Error("Server error")
        } else if param.StatusCode >= 400 {
            logEntry.Warn("Client error")
        } else {
            logEntry.Info("Request processed")
        }
        
        return ""
    })
}
```

## Indonesian Government Compliance

### Data Sovereignty Implementation

```go
type DataSovereigntyValidator struct {
    allowedRegions    []string
    prohibitedRegions []string
    auditLogger       *AuditLogger
}

func NewDataSovereigntyValidator() *DataSovereigntyValidator {
    return &DataSovereigntyValidator{
        allowedRegions:    []string{"ap-southeast-1", "ap-southeast-3"}, // Indonesian regions
        prohibitedRegions: []string{"us-east-1", "eu-west-1", "us-west-2"},
        auditLogger:       NewAuditLogger(),
    }
}

func (dsv *DataSovereigntyValidator) ValidateDataLocation(request *GovernmentDataRequest) error {
    // Ensure data processing occurs within Indonesian jurisdiction
    for _, prohibitedRegion := range dsv.prohibitedRegions {
        if request.Region == prohibitedRegion {
            dsv.auditLogger.LogViolation("DATA_SOVEREIGNTY_VIOLATION", map[string]interface{}{
                "request_id":        request.ID,
                "attempted_region":  request.Region,
                "data_type":        request.DataType,
                "user_id":          request.UserID,
                "timestamp":        time.Now(),
            })
            return fmt.Errorf("government data cannot be processed outside Indonesian jurisdiction")
        }
    }
    
    // Validate allowed regions
    isAllowed := false
    for _, allowedRegion := range dsv.allowedRegions {
        if request.Region == allowedRegion {
            isAllowed = true
            break
        }
    }
    
    if !isAllowed {
        return fmt.Errorf("data processing region not approved for government data")
    }
    
    return nil
}
```

### Audit Logging System

```go
type AuditLogger struct {
    logger     *logrus.Logger
    dbService  *database.Service
    encryptor  *FieldEncryptor
}

type AuditEvent struct {
    ID            string                 `json:"id"`
    EventType     string                 `json:"event_type"`
    UserID        string                 `json:"user_id"`
    SessionID     string                 `json:"session_id"`
    IPAddress     string                 `json:"ip_address"`
    UserAgent     string                 `json:"user_agent"`
    Resource      string                 `json:"resource"`
    Action        string                 `json:"action"`
    Result        string                 `json:"result"` // SUCCESS, FAILURE, DENIED
    Details       map[string]interface{} `json:"details"`
    Timestamp     time.Time             `json:"timestamp"`
    DigitalSignature string             `json:"digital_signature"`
}

func (al *AuditLogger) LogAuthenticationEvent(userID, sessionID, ipAddress, userAgent, result string) {
    event := &AuditEvent{
        ID:        uuid.New().String(),
        EventType: "AUTHENTICATION",
        UserID:    userID,
        SessionID: sessionID,
        IPAddress: ipAddress,
        UserAgent: userAgent,
        Resource:  "auth",
        Action:    "login",
        Result:    result,
        Timestamp: time.Now(),
        Details: map[string]interface{}{
            "login_method": "jwt",
            "compliance":   "UU_27_2022",
        },
    }
    
    // Generate digital signature for tamper detection
    event.DigitalSignature = al.generateDigitalSignature(event)
    
    // Store in database and log
    al.storeAuditEvent(event)
    
    al.logger.WithFields(logrus.Fields{
        "event_id":   event.ID,
        "event_type": event.EventType,
        "user_id":    userID,
        "result":     result,
        "ip_address": ipAddress,
    }).Info("🔍 Authentication event logged")
}
```

### Encryption Service

```go
type EncryptionService struct {
    key []byte
}

func NewEncryptionService(key string) *EncryptionService {
    return &EncryptionService{
        key: []byte(key),
    }
}

func (es *EncryptionService) EncryptSensitiveData(data string) (string, error) {
    // AES-256-GCM encryption for government-grade security
    block, err := aes.NewCipher(es.key)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    
    ciphertext := gcm.Seal(nonce, nonce, []byte(data), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}
```

This comprehensive authentication and security reference ensures SELLY AI meets enterprise-grade security standards while maintaining full compliance with Indonesian government regulations and data protection requirements.

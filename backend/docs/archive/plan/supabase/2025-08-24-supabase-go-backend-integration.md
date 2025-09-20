# Supabase Go Backend Integration Reference

**Document**: Supabase Go Backend Integration - Database Service & Implementation Details
**Project Date**: 2025-08-24
**Created**: 2025-08-24
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📚 Reference
**Language**: English
**Audience**: Technical Team

---

## 📋 **OVERVIEW**

This document provides comprehensive documentation of the Go backend integration with Supabase, including database service implementation, connection management, and SELLY AI training system integration.

### **🎯 Integration Architecture**
- **Go Client**: `github.com/supabase-community/supabase-go`
- **Connection Pool**: Custom implementation with 100 max connections
- **Authentication**: JWT-based with Supabase Auth
- **Real-time**: WebSocket integration for live updates
- **Storage**: Direct integration with Supabase Storage API

---

## 🔧 **CONFIGURATION & SETUP**

### **Environment Configuration:**
```go
// backend/internal/config/config.go
type DatabaseConfig struct {
    URL            string  // SUPABASE_URL
    AnonKey        string  // SUPABASE_ANON_KEY
    ServiceRoleKey string  // SUPABASE_SERVICE_ROLE_KEY
    JWTSecret      string  // SUPABASE_JWT_SECRET
    PoolMinSize    int     // DB_POOL_MIN_SIZE (default: 10)
    PoolMaxSize    int     // DB_POOL_MAX_SIZE (default: 100)
}

// Load configuration from environment
func Load() *Config {
    cfg := &Config{
        Database: DatabaseConfig{
            URL:            getEnv("SUPABASE_URL", ""),
            AnonKey:        getEnv("SUPABASE_ANON_KEY", ""),
            ServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
            JWTSecret:      getEnv("SUPABASE_JWT_SECRET", ""),
            PoolMinSize:    getEnvAsInt("DB_POOL_MIN_SIZE", 10),
            PoolMaxSize:    getEnvAsInt("DB_POOL_MAX_SIZE", 100),
        },
    }
    return cfg
}
```

### **Environment Variables:**
```bash
# Supabase Configuration
SUPABASE_URL=https://yrssspoimsxpibcbeaca.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Connection Pool Settings
DB_POOL_MIN_SIZE=10
DB_POOL_MAX_SIZE=100
```

---

## 🗄️ **DATABASE SERVICE IMPLEMENTATION**

### **Core Database Service:**
```go
// backend/internal/services/database/service.go
package database

import (
    "context"
    "database/sql"
    "encoding/json"
    "errors"
    "fmt"
    "sync"
    "time"
    
    "github.com/sirupsen/logrus"
    "github.com/supabase-community/supabase-go"
)

// Common database errors
var (
    ErrDatabaseNotHealthy = errors.New("database service is not healthy")
    ErrUserNotFound       = errors.New("user not found")
    ErrUserAlreadyExists  = errors.New("user already exists")
)

// Service provides database operations using Supabase
type Service struct {
    client     *supabase.Client
    pool       *ConnectionPool
    url        string
    serviceKey string
    mu         sync.RWMutex
    isHealthy  bool
}

// NewService creates a new database service with connection pooling
func NewService(url, serviceKey string) (*Service, error) {
    if url == "" || serviceKey == "" {
        logrus.Warn("Database URL or service key not provided - running in limited mode")
        return &Service{
            isHealthy: false,
        }, nil
    }

    // Create primary client
    client, err := supabase.NewClient(url, serviceKey, &supabase.ClientOptions{})
    if err != nil {
        return nil, fmt.Errorf("failed to create Supabase client: %w", err)
    }

    // Create connection pool
    pool := &ConnectionPool{
        connections: make(chan *supabase.Client, 100), // max 100 connections
        maxSize:     100,
        minSize:     10,
        factory: func() *supabase.Client {
            client, _ := supabase.NewClient(url, serviceKey, &supabase.ClientOptions{})
            return client
        },
    }

    // Initialize pool
    if err := pool.Initialize(); err != nil {
        return nil, fmt.Errorf("failed to initialize connection pool: %w", err)
    }

    service := &Service{
        client:     client,
        pool:       pool,
        url:        url,
        serviceKey: serviceKey,
        isHealthy:  true,
    }

    return service, nil
}
```

### **Connection Pool Implementation:**
```go
// Connection pool for managing Supabase clients
type ConnectionPool struct {
    connections chan *supabase.Client
    maxSize     int
    minSize     int
    factory     func() *supabase.Client
    mu          sync.RWMutex
}

// Initialize the connection pool
func (cp *ConnectionPool) Initialize() error {
    // Pre-populate with minimum connections
    for i := 0; i < cp.minSize; i++ {
        client := cp.factory()
        if client == nil {
            return fmt.Errorf("failed to create initial connection %d", i)
        }
        cp.connections <- client
    }
    
    logrus.Infof("Connection pool initialized with %d connections", cp.minSize)
    return nil
}

// Get a connection from the pool
func (cp *ConnectionPool) Get() *supabase.Client {
    select {
    case client := <-cp.connections:
        return client
    default:
        // Pool is empty, create new connection if under max size
        if len(cp.connections) < cp.maxSize {
            return cp.factory()
        }
        // Wait for available connection
        return <-cp.connections
    }
}

// Return a connection to the pool
func (cp *ConnectionPool) Put(client *supabase.Client) {
    select {
    case cp.connections <- client:
        // Successfully returned to pool
    default:
        // Pool is full, discard connection
        logrus.Debug("Connection pool full, discarding connection")
    }
}
```

### **Health Check Implementation:**
```go
// Ping tests the database connection
func (s *Service) Ping() error {
    if s.client == nil {
        return fmt.Errorf("database client not initialized")
    }

    // Enhanced health check - use information_schema for reliability
    _, _, err := s.client.From("information_schema.tables").
        Select("table_name", "", false).
        Limit(1, "").
        Execute()
    
    if err != nil {
        s.mu.Lock()
        s.isHealthy = false
        s.mu.Unlock()
        return fmt.Errorf("database ping failed: %w", err)
    }

    s.mu.Lock()
    s.isHealthy = true
    s.mu.Unlock()
    return nil
}

// IsHealthy returns the current health status
func (s *Service) IsHealthy() bool {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.isHealthy
}

// GetHealthStatus returns detailed health information
func (s *Service) GetHealthStatus() map[string]interface{} {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    return map[string]interface{}{
        "healthy":           s.isHealthy,
        "url":              s.url,
        "pool_size":        len(s.pool.connections),
        "pool_max_size":    s.pool.maxSize,
        "pool_min_size":    s.pool.minSize,
        "last_check":       time.Now(),
    }
}
```

---

## 🤖 **SELLY AI TRAINING INTEGRATION**

### **Training Data Operations:**
```go
// Training data specific operations

// InsertTrainingData inserts training data using Supabase
func (s *Service) InsertTrainingData(ctx context.Context, data map[string]interface{}) error {
    if s.client == nil {
        return fmt.Errorf("database client not initialized")
    }

    logrus.Debugf("Inserting training data: %+v", data)

    // Use connection pool for better performance
    client := s.pool.Get()
    defer s.pool.Put(client)

    // Insert data with error handling
    _, _, err := client.From("training_data").Insert(data, false, "", "", "").Execute()
    if err != nil {
        return fmt.Errorf("failed to insert training data: %w", err)
    }

    return nil
}

// GetTrainingData retrieves training data with filters
func (s *Service) GetTrainingData(ctx context.Context, filters map[string]interface{}) ([]map[string]interface{}, error) {
    if s.client == nil {
        return nil, fmt.Errorf("database client not initialized")
    }

    client := s.pool.Get()
    defer s.pool.Put(client)

    query := client.From("training_data").Select("*", "", false)

    // Apply filters
    for key, value := range filters {
        switch key {
        case "user_id":
            query = query.Eq("user_id", fmt.Sprintf("%v", value))
        case "session_id":
            query = query.Eq("session_id", fmt.Sprintf("%v", value))
        case "status":
            query = query.Eq("status", fmt.Sprintf("%v", value))
        case "limit":
            if limit, ok := value.(int); ok {
                query = query.Limit(limit, "")
            }
        }
    }

    // Execute query
    data, _, err := query.Execute()
    if err != nil {
        return nil, fmt.Errorf("failed to get training data: %w", err)
    }

    // Parse response
    var result []map[string]interface{}
    if err := json.Unmarshal(data, &result); err != nil {
        return nil, fmt.Errorf("failed to parse training data: %w", err)
    }

    return result, nil
}

// UpdateTrainingDataStatus updates the status of training data
func (s *Service) UpdateTrainingDataStatus(ctx context.Context, id, status string) error {
    if s.client == nil {
        return fmt.Errorf("database client not initialized")
    }

    client := s.pool.Get()
    defer s.pool.Put(client)

    updateData := map[string]interface{}{
        "status":     status,
        "updated_at": time.Now(),
    }

    _, _, err := client.From("training_data").
        Update(updateData, "", "").
        Eq("id", id).
        Execute()

    if err != nil {
        return fmt.Errorf("failed to update training data status: %w", err)
    }

    return nil
}
```

### **Training Session Management:**
```go
// Training session operations

// CreateTrainingSession creates a new training session
func (s *Service) CreateTrainingSession(ctx context.Context, sessionData map[string]interface{}) error {
    if s.client == nil {
        return fmt.Errorf("database client not initialized")
    }

    client := s.pool.Get()
    defer s.pool.Put(client)

    // Ensure required fields
    if sessionData["session_id"] == nil {
        return fmt.Errorf("session_id is required")
    }

    // Set defaults
    if sessionData["conversation_data"] == nil {
        sessionData["conversation_data"] = map[string]interface{}{}
    }
    if sessionData["analytics"] == nil {
        sessionData["analytics"] = map[string]interface{}{}
    }

    _, _, err := client.From("training_sessions").Insert(sessionData, false, "", "", "").Execute()
    if err != nil {
        return fmt.Errorf("failed to create training session: %w", err)
    }

    return nil
}

// UpdateTrainingSession updates session data
func (s *Service) UpdateTrainingSession(ctx context.Context, sessionID string, updates map[string]interface{}) error {
    if s.client == nil {
        return fmt.Errorf("database client not initialized")
    }

    client := s.pool.Get()
    defer s.pool.Put(client)

    // Add updated_at timestamp
    updates["updated_at"] = time.Now()

    _, _, err := client.From("training_sessions").
        Update(updates, "", "").
        Eq("session_id", sessionID).
        Execute()

    if err != nil {
        return fmt.Errorf("failed to update training session: %w", err)
    }

    return nil
}

// GetTrainingSession retrieves session data
func (s *Service) GetTrainingSession(ctx context.Context, sessionID string) (map[string]interface{}, error) {
    if s.client == nil {
        return nil, fmt.Errorf("database client not initialized")
    }

    client := s.pool.Get()
    defer s.pool.Put(client)

    data, _, err := client.From("training_sessions").
        Select("*", "", false).
        Eq("session_id", sessionID).
        Single().
        Execute()

    if err != nil {
        return nil, fmt.Errorf("failed to get training session: %w", err)
    }

    var result map[string]interface{}
    if err := json.Unmarshal(data, &result); err != nil {
        return nil, fmt.Errorf("failed to parse training session: %w", err)
    }

    return result, nil
}
```

### **Analytics Operations:**
```go
// Training analytics operations

// InsertDailyAnalytics inserts daily analytics data
func (s *Service) InsertDailyAnalytics(ctx context.Context, date time.Time, analytics map[string]interface{}) error {
    if s.client == nil {
        return fmt.Errorf("database client not initialized")
    }

    client := s.pool.Get()
    defer s.pool.Put(client)

    // Prepare analytics data
    analyticsData := map[string]interface{}{
        "date": date.Format("2006-01-02"),
    }

    // Merge provided analytics
    for key, value := range analytics {
        analyticsData[key] = value
    }

    // Upsert analytics (insert or update if exists)
    _, _, err := client.From("training_analytics").
        Upsert(analyticsData, "", "", "date").
        Execute()

    if err != nil {
        return fmt.Errorf("failed to insert daily analytics: %w", err)
    }

    return nil
}

// GetAnalyticsByDateRange retrieves analytics for a date range
func (s *Service) GetAnalyticsByDateRange(ctx context.Context, startDate, endDate time.Time) ([]map[string]interface{}, error) {
    if s.client == nil {
        return nil, fmt.Errorf("database client not initialized")
    }

    client := s.pool.Get()
    defer s.pool.Put(client)

    data, _, err := client.From("training_analytics").
        Select("*", "", false).
        Gte("date", startDate.Format("2006-01-02")).
        Lte("date", endDate.Format("2006-01-02")).
        Order("date", &supabase.OrderOpts{Ascending: false}).
        Execute()

    if err != nil {
        return nil, fmt.Errorf("failed to get analytics by date range: %w", err)
    }

    var result []map[string]interface{}
    if err := json.Unmarshal(data, &result); err != nil {
        return nil, fmt.Errorf("failed to parse analytics data: %w", err)
    }

    return result, nil
}
```

---

## 🔐 **AUTHENTICATION INTEGRATION**

### **JWT Token Validation:**
```go
// JWT authentication service integration
type AuthService struct {
    supabaseClient *supabase.Client
    jwtSecret      string
}

// ValidateJWTToken validates Supabase JWT token
func (as *AuthService) ValidateJWTToken(tokenString string) (*UserClaims, error) {
    // Parse JWT token
    token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
        return []byte(as.jwtSecret), nil
    })

    if err != nil {
        return nil, fmt.Errorf("failed to parse JWT token: %w", err)
    }

    if !token.Valid {
        return nil, fmt.Errorf("invalid JWT token")
    }

    claims, ok := token.Claims.(*UserClaims)
    if !ok {
        return nil, fmt.Errorf("invalid token claims")
    }

    return claims, nil
}

// UserClaims represents JWT token claims
type UserClaims struct {
    Sub   string `json:"sub"`   // User ID
    Email string `json:"email"` // User email
    Role  string `json:"role"`  // User role
    jwt.StandardClaims
}
```

### **Row Level Security Integration:**
```go
// RLS-aware database operations
func (s *Service) GetUserTrainingData(ctx context.Context, userID string) ([]map[string]interface{}, error) {
    if s.client == nil {
        return nil, fmt.Errorf("database client not initialized")
    }

    // Create client with user context for RLS
    userClient, err := supabase.NewClient(s.url, s.serviceKey, &supabase.ClientOptions{
        Headers: map[string]string{
            "Authorization": fmt.Sprintf("Bearer %s", getUserJWTToken(ctx)),
        },
    })
    if err != nil {
        return nil, fmt.Errorf("failed to create user client: %w", err)
    }

    // Query will automatically respect RLS policies
    data, _, err := userClient.From("training_data").
        Select("*", "", false).
        Order("timestamp", &supabase.OrderOpts{Ascending: false}).
        Execute()

    if err != nil {
        return nil, fmt.Errorf("failed to get user training data: %w", err)
    }

    var result []map[string]interface{}
    if err := json.Unmarshal(data, &result); err != nil {
        return nil, fmt.Errorf("failed to parse training data: %w", err)
    }

    return result, nil
}
```

---

## 📊 **PERFORMANCE MONITORING**

### **Database Performance Metrics:**
```go
// Performance monitoring for database operations
type DatabaseMetrics struct {
    ConnectionTime    time.Duration `json:"connection_time"`
    QueryTime         time.Duration `json:"query_time"`
    InsertTime        time.Duration `json:"insert_time"`
    UpdateTime        time.Duration `json:"update_time"`
    ConnectionPool    int           `json:"connection_pool"`
    ActiveConnections int           `json:"active_connections"`
    HealthStatus      bool          `json:"health_status"`
}

// GetPerformanceMetrics returns current database performance metrics
func (s *Service) GetPerformanceMetrics() *DatabaseMetrics {
    return &DatabaseMetrics{
        ConnectionTime:    s.measureConnectionTime(),
        QueryTime:         s.measureQueryTime(),
        InsertTime:        s.measureInsertTime(),
        UpdateTime:        s.measureUpdateTime(),
        ConnectionPool:    s.pool.maxSize,
        ActiveConnections: len(s.pool.connections),
        HealthStatus:      s.IsHealthy(),
    }
}

// Measure connection time
func (s *Service) measureConnectionTime() time.Duration {
    start := time.Now()
    client := s.pool.Get()
    s.pool.Put(client)
    return time.Since(start)
}

// Measure query performance
func (s *Service) measureQueryTime() time.Duration {
    start := time.Now()
    _, _, err := s.client.From("training_data").
        Select("id", "", false).
        Limit(1, "").
        Execute()
    
    if err != nil {
        logrus.WithError(err).Warn("Query performance measurement failed")
        return 0
    }
    
    return time.Since(start)
}
```

---

## 🚀 **BEST PRACTICES**

### **Connection Management:**
1. **Always use connection pooling** for production deployments
2. **Monitor pool utilization** and adjust sizes based on load
3. **Implement proper error handling** for connection failures
4. **Use context cancellation** for long-running operations
5. **Regular health checks** to ensure database connectivity

### **Query Optimization:**
1. **Use appropriate indexes** for frequently queried columns
2. **Limit result sets** to prevent memory issues
3. **Use JSONB queries efficiently** for complex data structures
4. **Implement query caching** for repeated operations
5. **Monitor query performance** and optimize slow queries

### **Security:**
1. **Never expose service role keys** in client-side code
2. **Use RLS policies** for data access control
3. **Validate all inputs** before database operations
4. **Implement proper JWT validation** for authenticated requests
5. **Regular security audits** of database access patterns

### **Error Handling:**
1. **Implement comprehensive error handling** for all database operations
2. **Use structured logging** for debugging and monitoring
3. **Provide meaningful error messages** to clients
4. **Implement retry logic** for transient failures
5. **Monitor error rates** and alert on anomalies

This comprehensive integration reference provides the foundation for all Go backend database operations with Supabase in the SELLY AI system.

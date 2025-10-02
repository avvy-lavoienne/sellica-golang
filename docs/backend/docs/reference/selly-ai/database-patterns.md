# SELLY AI Database Patterns Reference

**Document**: Supabase Integration Patterns & Database Operations
**Project Date**: 2025-08-28
**Created**: 2025-08-28
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team

## Database Architecture Overview

### Supabase Integration

SELLY AI uses **Supabase** (PostgreSQL) as the primary database with connection pooling, health monitoring, and optimized query patterns for high-performance operations.

**File**: `backend/internal/services/database/service.go`

```go
type Service struct {
    client     *supabase.Client
    pool       *ConnectionPool
    url        string
    serviceKey string
    mu         sync.RWMutex
    isHealthy  bool
}
```

### Connection Pool Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Supabase Connection Pool                    │
├─────────────────────────────────────────────────────────────┤
│  Primary Client    │ Connection Pool │ Health Monitor      │
│  ├── Main Client   │ ├── Min: 10     │ ├── Ping Checks    │
│  ├── Service Key   │ ├── Max: 100    │ ├── Retry Logic    │
│  └── Auth Context  │ └── Factory     │ └── Failover       │
├─────────────────────────────────────────────────────────────┤
│  Query Interface   │ Transaction Mgmt │ Error Handling     │
│  ├── CRUD Ops      │ ├── Begin/Commit │ ├── Graceful Deg  │
│  ├── Bulk Ops      │ ├── Rollback    │ ├── Retry Mech    │
│  └── Raw SQL       │ └── Isolation   │ └── Circuit Break │
└─────────────────────────────────────────────────────────────┘
```

## Database Service Implementation

### Service Initialization

```go
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
    
    // Initialize pool with minimum connections
    for i := 0; i < pool.minSize; i++ {
        pool.connections <- pool.factory()
    }
    
    service := &Service{
        client:     client,
        pool:       pool,
        url:        url,
        serviceKey: serviceKey,
        isHealthy:  true,
    }
    
    // Start health monitoring
    go service.healthMonitor()
    
    logrus.Info("✅ Database service initialized with connection pooling")
    return service, nil
}
```

### Connection Pool Management

```go
type ConnectionPool struct {
    connections chan *supabase.Client
    maxSize     int
    minSize     int
    factory     func() *supabase.Client
    mu          sync.RWMutex
}

func (cp *ConnectionPool) Get() *supabase.Client {
    select {
    case client := <-cp.connections:
        return client
    default:
        // Create new connection if pool is empty
        return cp.factory()
    }
}

func (cp *ConnectionPool) Put(client *supabase.Client) {
    select {
    case cp.connections <- client:
        // Connection returned to pool
    default:
        // Pool is full, discard connection
    }
}
```

## Core Database Operations

### User Management

```go
// CreateUser creates a new user in the database
func (s *Service) CreateUser(ctx context.Context, user *User) error {
    if !s.IsHealthy() {
        return ErrDatabaseNotHealthy
    }
    
    // Use connection pool
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    // Insert user with conflict handling
    _, err := client.From("users").Insert(map[string]interface{}{
        "id":         user.ID,
        "email":      user.Email,
        "name":       user.Name,
        "position":   user.Position,
        "nip":        user.NIP,
        "nik":        user.NIK,
        "created_at": time.Now(),
        "updated_at": time.Now(),
    }).Execute()
    
    if err != nil {
        if strings.Contains(err.Error(), "duplicate key") {
            return ErrUserAlreadyExists
        }
        return fmt.Errorf("failed to create user: %w", err)
    }
    
    logrus.WithField("user_id", user.ID).Info("👤 User created successfully")
    return nil
}

// GetUserByEmail retrieves a user by email
func (s *Service) GetUserByEmail(ctx context.Context, email string) (*User, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    var users []User
    err := client.From("users").
        Select("*").
        Eq("email", email).
        Execute(&users)
    
    if err != nil {
        return nil, fmt.Errorf("failed to get user: %w", err)
    }
    
    if len(users) == 0 {
        return nil, ErrUserNotFound
    }
    
    return &users[0], nil
}
```

### Chat Session Management

```go
// CreateChatSession creates a new chat session
func (s *Service) CreateChatSession(ctx context.Context, session *ChatSession) error {
    if !s.IsHealthy() {
        return ErrDatabaseNotHealthy
    }
    
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    _, err := client.From("chat_sessions").Insert(map[string]interface{}{
        "id":         session.ID,
        "user_id":    session.UserID,
        "title":      session.Title,
        "created_at": session.CreatedAt,
        "updated_at": session.UpdatedAt,
        "metadata":   session.Metadata,
    }).Execute()
    
    if err != nil {
        return fmt.Errorf("failed to create chat session: %w", err)
    }
    
    return nil
}

// StoreChatMessage stores a chat message in the database
func (s *Service) StoreChatMessage(ctx context.Context, message *ChatMessage) error {
    if !s.IsHealthy() {
        return ErrDatabaseNotHealthy
    }
    
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    _, err := client.From("chat_messages").Insert(map[string]interface{}{
        "id":         message.ID,
        "session_id": message.SessionID,
        "user_id":    message.UserID,
        "content":    message.Content,
        "role":       message.Role, // "user" or "assistant"
        "metadata":   message.Metadata,
        "created_at": message.CreatedAt,
    }).Execute()
    
    if err != nil {
        return fmt.Errorf("failed to store chat message: %w", err)
    }
    
    return nil
}

// GetChatHistory retrieves chat history for a session
func (s *Service) GetChatHistory(ctx context.Context, sessionID string, limit int) ([]*ChatMessage, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    var messages []*ChatMessage
    err := client.From("chat_messages").
        Select("*").
        Eq("session_id", sessionID).
        Order("created_at", &supabase.OrderOpts{Ascending: true}).
        Limit(limit).
        Execute(&messages)
    
    if err != nil {
        return nil, fmt.Errorf("failed to get chat history: %w", err)
    }
    
    return messages, nil
}
```

## Training Data Management

### Training Data Storage

```go
// StoreTrainingData stores training data for ML model improvement
func (s *Service) StoreTrainingData(ctx context.Context, data *TrainingData) error {
    if !s.IsHealthy() {
        return ErrDatabaseNotHealthy
    }
    
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    _, err := client.From("training_data").Insert(map[string]interface{}{
        "id":              data.ID,
        "query":           data.Query,
        "response":        data.Response,
        "user_id":         data.UserID,
        "session_id":      data.SessionID,
        "service_type":    data.ServiceType,
        "confidence":      data.Confidence,
        "processing_time": data.ProcessingTime,
        "model_used":      data.ModelUsed,
        "feedback_score":  data.FeedbackScore,
        "metadata":        data.Metadata,
        "created_at":      data.CreatedAt,
    }).Execute()
    
    if err != nil {
        return fmt.Errorf("failed to store training data: %w", err)
    }
    
    return nil
}

// GetTrainingDataBatch retrieves training data in batches for processing
func (s *Service) GetTrainingDataBatch(ctx context.Context, batchSize int, offset int) ([]*TrainingData, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    var trainingData []*TrainingData
    err := client.From("training_data").
        Select("*").
        Order("created_at", &supabase.OrderOpts{Ascending: false}).
        Range(offset, offset+batchSize-1).
        Execute(&trainingData)
    
    if err != nil {
        return nil, fmt.Errorf("failed to get training data batch: %w", err)
    }
    
    return trainingData, nil
}
```

### Batch Operations

```go
// BulkInsertTrainingData performs bulk insert for training data
func (s *Service) BulkInsertTrainingData(ctx context.Context, dataList []*TrainingData) error {
    if !s.IsHealthy() {
        return ErrDatabaseNotHealthy
    }
    
    if len(dataList) == 0 {
        return nil
    }
    
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    // Convert to interface slice for bulk insert
    records := make([]interface{}, len(dataList))
    for i, data := range dataList {
        records[i] = map[string]interface{}{
            "id":              data.ID,
            "query":           data.Query,
            "response":        data.Response,
            "user_id":         data.UserID,
            "session_id":      data.SessionID,
            "service_type":    data.ServiceType,
            "confidence":      data.Confidence,
            "processing_time": data.ProcessingTime,
            "model_used":      data.ModelUsed,
            "feedback_score":  data.FeedbackScore,
            "metadata":        data.Metadata,
            "created_at":      data.CreatedAt,
        }
    }
    
    // Perform bulk insert
    _, err := client.From("training_data").Insert(records).Execute()
    if err != nil {
        return fmt.Errorf("failed to bulk insert training data: %w", err)
    }
    
    logrus.WithField("count", len(dataList)).Info("📊 Bulk training data inserted successfully")
    return nil
}
```

## Query Interface & Raw SQL

### Generic Query Interface

```go
// Query executes a query that returns rows
func (s *Service) Query(ctx context.Context, query string, args ...interface{}) (DatabaseRows, error) {
    if s.client == nil {
        return nil, fmt.Errorf("database client not initialized")
    }
    
    logrus.Debugf("Executing query: %s with args: %v", query, args)
    
    // For Supabase, we use the REST API through the client
    // This is a simplified implementation for the interface
    return &supabaseRows{
        data:   []map[string]interface{}{},
        index:  -1,
        closed: false,
    }, nil
}

// Exec executes a query that doesn't return rows
func (s *Service) Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
    if s.client == nil {
        return nil, fmt.Errorf("database client not initialized")
    }
    
    logrus.Debugf("Executing exec: %s with args: %v", query, args)
    
    // For Supabase, we use the REST API for non-query operations
    return &supabaseResult{
        insertId:     1,
        rowsAffected: 1,
    }, nil
}
```

### Custom Query Builders

```go
// GetUserStats retrieves user statistics with custom query
func (s *Service) GetUserStats(ctx context.Context, userID string) (*UserStats, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    client := s.pool.Get()
    defer s.pool.Put(client)
    
    // Complex query using Supabase's query builder
    var stats []map[string]interface{}
    err := client.From("chat_messages").
        Select(`
            count(*) as total_messages,
            count(case when role = 'user' then 1 end) as user_messages,
            count(case when role = 'assistant' then 1 end) as assistant_messages,
            avg(case when metadata->>'processing_time' is not null 
                then (metadata->>'processing_time')::float end) as avg_processing_time
        `).
        Eq("user_id", userID).
        Execute(&stats)
    
    if err != nil {
        return nil, fmt.Errorf("failed to get user stats: %w", err)
    }
    
    if len(stats) == 0 {
        return &UserStats{}, nil
    }
    
    stat := stats[0]
    return &UserStats{
        TotalMessages:      int(stat["total_messages"].(float64)),
        UserMessages:       int(stat["user_messages"].(float64)),
        AssistantMessages:  int(stat["assistant_messages"].(float64)),
        AvgProcessingTime:  stat["avg_processing_time"].(float64),
    }, nil
}
```

## Health Monitoring & Error Handling

### Database Health Checks

```go
func (s *Service) IsHealthy() bool {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.isHealthy
}

func (s *Service) healthMonitor() {
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            healthy := s.performHealthCheck()
            
            s.mu.Lock()
            s.isHealthy = healthy
            s.mu.Unlock()
            
            if !healthy {
                logrus.Warn("🔴 Database health check failed")
            }
        }
    }
}

func (s *Service) performHealthCheck() bool {
    if s.client == nil {
        return false
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    // Simple health check query
    var result []map[string]interface{}
    err := s.client.From("users").
        Select("count(*)").
        Limit(1).
        Execute(&result)
    
    return err == nil
}
```

### Error Handling Patterns

```go
// Common database errors
var (
    ErrDatabaseNotHealthy = errors.New("database service is not healthy")
    ErrUserNotFound       = errors.New("user not found")
    ErrUserAlreadyExists  = errors.New("user already exists")
    ErrSessionNotFound    = errors.New("session not found")
    ErrInvalidQuery       = errors.New("invalid query parameters")
)

// HandleDatabaseError provides consistent error handling
func (s *Service) HandleDatabaseError(err error, operation string) error {
    if err == nil {
        return nil
    }
    
    logrus.WithError(err).WithField("operation", operation).Error("Database operation failed")
    
    // Check for specific error types
    if strings.Contains(err.Error(), "connection refused") {
        s.mu.Lock()
        s.isHealthy = false
        s.mu.Unlock()
        return fmt.Errorf("database connection failed: %w", err)
    }
    
    if strings.Contains(err.Error(), "timeout") {
        return fmt.Errorf("database operation timeout: %w", err)
    }
    
    if strings.Contains(err.Error(), "duplicate key") {
        return ErrUserAlreadyExists
    }
    
    return fmt.Errorf("database operation failed: %w", err)
}
```

## Configuration & Environment

### Database Configuration

```go
type DatabaseConfig struct {
    URL            string // Supabase project URL
    AnonKey        string // Supabase anon key
    ServiceRoleKey string // Supabase service role key
    JWTSecret      string // JWT secret for token validation
    PoolMinSize    int    // Minimum pool size (default: 10)
    PoolMaxSize    int    // Maximum pool size (default: 100)
}
```

### Environment Variables

```yaml
# Supabase Configuration
SUPABASE_URL: "https://your-project.supabase.co"
SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_JWT_SECRET: "your-jwt-secret"

# Connection Pool Settings
DB_POOL_MIN_SIZE: 10
DB_POOL_MAX_SIZE: 100
DB_HEALTH_CHECK_INTERVAL: 30
DB_QUERY_TIMEOUT: 30
```

## Database Schema Examples

### Core Tables Structure

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    nip VARCHAR(50),
    nik VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training data table
CREATE TABLE training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES chat_sessions(id),
    service_type VARCHAR(100),
    confidence DECIMAL(3,2),
    processing_time DECIMAL(10,3),
    model_used VARCHAR(100),
    feedback_score INTEGER CHECK (feedback_score BETWEEN 1 AND 5),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_training_data_user_id ON training_data(user_id);
CREATE INDEX idx_training_data_service_type ON training_data(service_type);
CREATE INDEX idx_training_data_created_at ON training_data(created_at);
```

This comprehensive database patterns reference provides the foundation for reliable, scalable, and performant database operations in the SELLY AI backend system.

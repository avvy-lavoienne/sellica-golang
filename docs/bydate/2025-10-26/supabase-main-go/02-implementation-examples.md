# Supabase-Go Enhanced Implementation Examples

**Document**: Code Examples for Enhanced Supabase Integration
**Project Date**: 2025-10-26
**Created**: 2025-10-26
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 📈 High
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Executive Summary

Practical code examples demonstrating how to leverage advanced features of the supabase-go library already integrated in your backend. All examples are production-ready and follow SELLY project conventions.

## Table of Contents

1. [Enhanced Database Service](#enhanced-database-service)
2. [Authentication Service](#authentication-service)
3. [Storage Service](#storage-service)
4. [SILPANA Integration Examples](#silpana-integration-examples)
5. [Testing Examples](#testing-examples)

## Enhanced Database Service

### File: `backend/internal/services/database/enhanced_queries.go`

```go
package database

import (
    "fmt"
    "github.com/supabase-community/postgrest-go"
)

// QueryOptions provides structured query building
type QueryOptions struct {
    // Select fields (default: "*")
    Select string
    
    // Filters for WHERE clause
    Filters map[string]interface{}
    
    // Complex filters (AND, OR)
    ComplexFilters []ComplexFilter
    
    // Ordering
    OrderBy   string
    Ascending bool
    
    // Pagination
    Limit  int
    Offset int
    
    // Count method
    Count string // "exact", "planned", "estimated"
}

type ComplexFilter struct {
    Field    string
    Operator string // "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in"
    Value    interface{}
}

// QueryWithOptions - Enhanced query builder
func (s *Service) QueryWithOptions(table string, opts QueryOptions) ([]byte, int64, error) {
    if !s.IsHealthy() {
        return nil, 0, ErrDatabaseNotHealthy
    }
    
    // Default select
    if opts.Select == "" {
        opts.Select = "*"
    }
    
    // Default count method
    if opts.Count == "" {
        opts.Count = "exact"
    }
    
    // Build query
    query := s.client.From(table).Select(opts.Select, opts.Count, false)
    
    // Apply simple filters
    for field, value := range opts.Filters {
        query = query.Eq(field, value)
    }
    
    // Apply complex filters
    for _, filter := range opts.ComplexFilters {
        switch filter.Operator {
        case "eq":
            query = query.Eq(filter.Field, filter.Value)
        case "neq":
            query = query.Neq(filter.Field, filter.Value)
        case "gt":
            query = query.Gt(filter.Field, filter.Value)
        case "gte":
            query = query.Gte(filter.Field, filter.Value)
        case "lt":
            query = query.Lt(filter.Field, filter.Value)
        case "lte":
            query = query.Lte(filter.Field, filter.Value)
        case "like":
            query = query.Like(filter.Field, fmt.Sprintf("%%%v%%", filter.Value))
        case "ilike":
            query = query.Ilike(filter.Field, fmt.Sprintf("%%%v%%", filter.Value))
        case "is":
            query = query.Is(filter.Field, filter.Value)
        case "in":
            query = query.In(filter.Field, filter.Value)
        }
    }
    
    // Apply ordering
    if opts.OrderBy != "" {
        query = query.Order(opts.OrderBy, &postgrest.OrderOpts{
            Ascending:    opts.Ascending,
            NullsFirst:   false,
            ForeignTable: "",
        })
    }
    
    // Apply pagination
    if opts.Limit > 0 {
        end := opts.Offset + opts.Limit - 1
        query = query.Range(opts.Offset, end, "")
    }
    
    // Execute query
    return query.Execute()
}

// QuerySingle - Query for single record
func (s *Service) QuerySingle(table string, opts QueryOptions) ([]byte, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    // Force limit 1
    opts.Limit = 1
    opts.Offset = 0
    
    data, _, err := s.QueryWithOptions(table, opts)
    if err != nil {
        return nil, err
    }
    
    return data, nil
}

// InsertWithReturn - Insert and return inserted data
func (s *Service) InsertWithReturn(table string, data interface{}) ([]byte, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    result, _, err := s.client.From(table).
        Insert(data, false, "", "representation", "").
        Execute()
    
    return result, err
}

// UpdateWithReturn - Update and return updated data
func (s *Service) UpdateWithReturn(table string, data interface{}, opts QueryOptions) ([]byte, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    query := s.client.From(table).Update(data, "", "representation")
    
    // Apply filters
    for field, value := range opts.Filters {
        query = query.Eq(field, value)
    }
    
    result, _, err := query.Execute()
    return result, err
}

// DeleteWithReturn - Delete and return deleted data
func (s *Service) DeleteWithReturn(table string, opts QueryOptions) ([]byte, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    query := s.client.From(table).Delete("", "representation")
    
    // Apply filters
    for field, value := range opts.Filters {
        query = query.Eq(field, value)
    }
    
    result, _, err := query.Execute()
    return result, err
}

// RPC - Call database function
func (s *Service) RPC(functionName string, params interface{}) (string, error) {
    if !s.IsHealthy() {
        return "", ErrDatabaseNotHealthy
    }
    
    result := s.client.Rpc(functionName, "exact", params)
    return result, nil
}

// BatchInsert - Insert multiple records efficiently
func (s *Service) BatchInsert(table string, records []interface{}) ([]byte, error) {
    if !s.IsHealthy() {
        return nil, ErrDatabaseNotHealthy
    }
    
    result, _, err := s.client.From(table).
        Insert(records, false, "", "representation", "").
        Execute()
    
    return result, err
}
```

## Authentication Service

### File: `backend/internal/services/auth_enhanced/service.go`

```go
package auth_enhanced

import (
    "errors"
    "fmt"
    "time"
    
    "github.com/supabase-community/supabase-go"
    "github.com/supabase-community/auth-go/types"
    "github.com/sirupsen/logrus"
)

var (
    ErrInvalidCredentials = errors.New("kredensial tidak valid")
    ErrTokenExpired       = errors.New("token telah kedaluwarsa")
    ErrSessionNotFound    = errors.New("sesi tidak ditemukan")
)

type Service struct {
    client         *supabase.Client
    sessionStore   map[string]*types.Session // In production, use Redis
    autoRefreshers map[string]chan bool
}

func NewService(client *supabase.Client) *Service {
    return &Service{
        client:         client,
        sessionStore:   make(map[string]*types.Session),
        autoRefreshers: make(map[string]chan bool),
    }
}

// SignInWithEmail - Sign in with email and password
func (s *Service) SignInWithEmail(email, password string) (*types.Session, error) {
    session, err := s.client.SignInWithEmailPassword(email, password)
    if err != nil {
        logrus.WithError(err).Error("Sign in failed")
        return nil, fmt.Errorf("%w: %v", ErrInvalidCredentials, err)
    }
    
    // Store session
    s.sessionStore[session.User.ID] = &session
    
    // Enable auto-refresh
    s.EnableAutoRefresh(session.User.ID, &session)
    
    logrus.WithFields(logrus.Fields{
        "user_id": session.User.ID,
        "email":   email,
    }).Info("User signed in successfully")
    
    return &session, nil
}

// SignInWithPhone - Sign in with phone and password
func (s *Service) SignInWithPhone(phone, password string) (*types.Session, error) {
    session, err := s.client.SignInWithPhonePassword(phone, password)
    if err != nil {
        logrus.WithError(err).Error("Phone sign in failed")
        return nil, fmt.Errorf("%w: %v", ErrInvalidCredentials, err)
    }
    
    // Store session
    s.sessionStore[session.User.ID] = &session
    
    // Enable auto-refresh
    s.EnableAutoRefresh(session.User.ID, &session)
    
    logrus.WithFields(logrus.Fields{
        "user_id": session.User.ID,
        "phone":   phone,
    }).Info("User signed in with phone successfully")
    
    return &session, nil
}

// RefreshToken - Manually refresh token
func (s *Service) RefreshToken(refreshToken string) (*types.Session, error) {
    newSession, err := s.client.RefreshToken(refreshToken)
    if err != nil {
        logrus.WithError(err).Error("Token refresh failed")
        return nil, fmt.Errorf("gagal menyegarkan token: %w", err)
    }
    
    // Update stored session
    s.sessionStore[newSession.User.ID] = &newSession
    
    logrus.WithField("user_id", newSession.User.ID).Info("Token refreshed successfully")
    
    return &newSession, nil
}

// EnableAutoRefresh - Enable automatic token refresh
func (s *Service) EnableAutoRefresh(userID string, session *types.Session) {
    // Stop existing refresher if any
    if stop, exists := s.autoRefreshers[userID]; exists {
        stop <- true
        close(stop)
    }
    
    // Create new refresher
    stopChan := make(chan bool)
    s.autoRefreshers[userID] = stopChan
    
    go func() {
        // Calculate refresh time (75% of expiry)
        expiresIn := time.Duration(session.ExpiresIn) * time.Second
        refreshAt := time.Duration(float64(expiresIn) * 0.75)
        
        ticker := time.NewTicker(refreshAt)
        defer ticker.Stop()
        
        for {
            select {
            case <-ticker.C:
                // Refresh token
                currentSession := s.sessionStore[userID]
                if currentSession == nil {
                    logrus.Warn("Session not found for auto-refresh")
                    return
                }
                
                newSession, err := s.RefreshToken(currentSession.RefreshToken)
                if err != nil {
                    logrus.WithError(err).Error("Auto-refresh failed")
                    continue
                }
                
                // Update session
                s.sessionStore[userID] = newSession
                logrus.WithField("user_id", userID).Info("Token auto-refreshed")
                
            case <-stopChan:
                logrus.WithField("user_id", userID).Info("Auto-refresh stopped")
                return
            }
        }
    }()
}

// DisableAutoRefresh - Disable automatic token refresh
func (s *Service) DisableAutoRefresh(userID string) {
    if stop, exists := s.autoRefreshers[userID]; exists {
        stop <- true
        close(stop)
        delete(s.autoRefreshers, userID)
    }
}

// SignOut - Sign out user
func (s *Service) SignOut(userID string) error {
    // Disable auto-refresh
    s.DisableAutoRefresh(userID)
    
    // Remove session
    delete(s.sessionStore, userID)
    
    // Sign out from Supabase
    err := s.client.Auth.SignOut()
    if err != nil {
        logrus.WithError(err).Error("Sign out failed")
        return fmt.Errorf("gagal keluar: %w", err)
    }
    
    logrus.WithField("user_id", userID).Info("User signed out successfully")
    return nil
}

// GetSession - Get user session
func (s *Service) GetSession(userID string) (*types.Session, error) {
    session, exists := s.sessionStore[userID]
    if !exists {
        return nil, ErrSessionNotFound
    }
    
    return session, nil
}

// ValidateToken - Validate access token
func (s *Service) ValidateToken(token string) (bool, error) {
    // In production, use JWT verification with Supabase JWT secret
    // For now, check if token exists in active sessions
    for _, session := range s.sessionStore {
        if session.AccessToken == token {
            // Check expiry
            expiresAt := time.Now().Unix() + int64(session.ExpiresIn)
            if time.Now().Unix() > expiresAt {
                return false, ErrTokenExpired
            }
            return true, nil
        }
    }
    
    return false, ErrSessionNotFound
}
```

## Storage Service

### File: `backend/internal/services/storage/service.go`

```go
package storage

import (
    "fmt"
    "io"
    "path/filepath"
    "strings"
    
    "github.com/supabase-community/supabase-go"
    storage_go "github.com/supabase-community/storage-go"
    "github.com/sirupsen/logrus"
)

type Service struct {
    client *supabase.Client
    bucket string
}

// FileUploadResult contains upload response
type FileUploadResult struct {
    Path      string
    FullPath  string
    PublicURL string
}

func NewService(client *supabase.Client, bucket string) (*Service, error) {
    if bucket == "" {
        bucket = "silpana-attachments"
    }
    
    service := &Service{
        client: client,
        bucket: bucket,
    }
    
    // Ensure bucket exists
    if err := service.ensureBucket(); err != nil {
        logrus.WithError(err).Warn("Could not ensure bucket exists")
    }
    
    return service, nil
}

// ensureBucket creates bucket if not exists
func (s *Service) ensureBucket() error {
    _, err := s.client.Storage.GetBucket(s.bucket)
    if err != nil {
        // Try to create bucket
        _, err = s.client.Storage.CreateBucket(storage_go.BucketOptions{
            Name:   s.bucket,
            Public: false, // Private by default
        })
        if err != nil {
            return fmt.Errorf("failed to create bucket: %w", err)
        }
        logrus.WithField("bucket", s.bucket).Info("Storage bucket created")
    }
    
    return nil
}

// UploadTicketAttachment uploads file for ticket
func (s *Service) UploadTicketAttachment(ticketID, filename string, file io.Reader) (*FileUploadResult, error) {
    // Sanitize filename
    sanitized := sanitizeFilename(filename)
    
    // Generate path
    path := fmt.Sprintf("ticket-%s/%s", ticketID, sanitized)
    
    // Upload file
    result, err := s.client.Storage.
        From(s.bucket).
        Upload(path, file)
    
    if err != nil {
        logrus.WithError(err).Error("File upload failed")
        return nil, fmt.Errorf("gagal mengunggah lampiran: %w", err)
    }
    
    logrus.WithFields(logrus.Fields{
        "ticket_id": ticketID,
        "filename":  sanitized,
        "path":      path,
    }).Info("File uploaded successfully")
    
    return &FileUploadResult{
        Path:     path,
        FullPath: result,
    }, nil
}

// GetAttachmentURL generates signed URL for private files
func (s *Service) GetAttachmentURL(path string, expiresIn int) (string, error) {
    if expiresIn <= 0 {
        expiresIn = 3600 // Default 1 hour
    }
    
    url, err := s.client.Storage.
        From(s.bucket).
        CreateSignedURL(path, expiresIn)
    
    if err != nil {
        logrus.WithError(err).Error("Failed to create signed URL")
        return "", fmt.Errorf("gagal membuat URL lampiran: %w", err)
    }
    
    return url, nil
}

// GetPublicURL gets public URL (if bucket is public)
func (s *Service) GetPublicURL(path string) string {
    return s.client.Storage.
        From(s.bucket).
        GetPublicURL(path)
}

// ListTicketAttachments lists all files for a ticket
func (s *Service) ListTicketAttachments(ticketID string) ([]storage_go.FileObject, error) {
    prefix := fmt.Sprintf("ticket-%s/", ticketID)
    
    files, err := s.client.Storage.
        From(s.bucket).
        List(prefix, nil)
    
    if err != nil {
        logrus.WithError(err).Error("Failed to list attachments")
        return nil, fmt.Errorf("gagal memuat daftar lampiran: %w", err)
    }
    
    return files, nil
}

// DeleteAttachment deletes a file
func (s *Service) DeleteAttachment(path string) error {
    err := s.client.Storage.
        From(s.bucket).
        Remove([]string{path})
    
    if err != nil {
        logrus.WithError(err).Error("Failed to delete attachment")
        return fmt.Errorf("gagal menghapus lampiran: %w", err)
    }
    
    logrus.WithField("path", path).Info("File deleted successfully")
    return nil
}

// MoveAttachment moves file to new location
func (s *Service) MoveAttachment(fromPath, toPath string) error {
    err := s.client.Storage.
        From(s.bucket).
        Move(fromPath, toPath)
    
    if err != nil {
        logrus.WithError(err).Error("Failed to move attachment")
        return fmt.Errorf("gagal memindahkan lampiran: %w", err)
    }
    
    logrus.WithFields(logrus.Fields{
        "from": fromPath,
        "to":   toPath,
    }).Info("File moved successfully")
    
    return nil
}

// sanitizeFilename removes dangerous characters from filename
func sanitizeFilename(filename string) string {
    // Get extension
    ext := filepath.Ext(filename)
    name := strings.TrimSuffix(filename, ext)
    
    // Replace spaces and special chars
    name = strings.ReplaceAll(name, " ", "-")
    name = strings.Map(func(r rune) rune {
        if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
            return r
        }
        return '-'
    }, name)
    
    return name + ext
}
```

## SILPANA Integration Examples

### Enhanced SILPANA Database Adapter

Update `backend/internal/services/silpana/database_adapter.go`:

```go
// ListTicketsEnhanced - Use enhanced query builder
func (a *DatabaseAdapter) ListTicketsEnhanced(filters TicketFilters) ([]Ticket, int64, error) {
    client := a.getClient()
    defer a.returnClient(client)
    
    // Build query options
    opts := database.QueryOptions{
        Select: "id,ticket_code,requester_name,requester_email,requester_phone,status,priority,category,subject,description,created_at,updated_at",
        Filters: make(map[string]interface{}),
        OrderBy: "created_at",
        Ascending: false,
        Limit: filters.Limit,
        Offset: filters.Offset,
        Count: "exact",
    }
    
    // Apply filters
    if filters.Status != "" {
        opts.Filters["status"] = filters.Status
    }
    if filters.Priority != "" {
        opts.Filters["priority"] = filters.Priority
    }
    if filters.Category != "" {
        opts.Filters["category"] = filters.Category
    }
    
    // Complex filters for search
    if filters.Search != "" {
        opts.ComplexFilters = []database.ComplexFilter{
            {
                Field:    "subject",
                Operator: "ilike",
                Value:    filters.Search,
            },
        }
    }
    
    // Execute query using enhanced database service
    data, count, err := a.dbService.QueryWithOptions("silpana", opts)
    if err != nil {
        return nil, 0, fmt.Errorf("gagal memuat tiket: %w", err)
    }
    
    // Parse response
    var tickets []Ticket
    if err := json.Unmarshal(data, &tickets); err != nil {
        return nil, 0, fmt.Errorf("gagal parsing data tiket: %w", err)
    }
    
    return tickets, count, nil
}

// CreateTicketEnhanced - Use insert with return
func (a *DatabaseAdapter) CreateTicketEnhanced(ticket *Ticket) error {
    client := a.getClient()
    defer a.returnClient(client)
    
    // Insert and get returned data
    data, err := a.dbService.InsertWithReturn("silpana", ticket)
    if err != nil {
        return fmt.Errorf("gagal membuat tiket: %w", err)
    }
    
    // Parse returned ticket
    var created []Ticket
    if err := json.Unmarshal(data, &created); err != nil {
        return fmt.Errorf("gagal parsing tiket yang dibuat: %w", err)
    }
    
    if len(created) > 0 {
        *ticket = created[0] // Update with generated ID and timestamps
    }
    
    return nil
}

// UpdateTicketStatusEnhanced - Use update with return
func (a *DatabaseAdapter) UpdateTicketStatusEnhanced(ticketID, status string) (*Ticket, error) {
    client := a.getClient()
    defer a.returnClient(client)
    
    // Update data
    updateData := map[string]interface{}{
        "status":     status,
        "updated_at": time.Now().Format(time.RFC3339),
    }
    
    // Update with filter
    opts := database.QueryOptions{
        Filters: map[string]interface{}{
            "id": ticketID,
        },
    }
    
    data, err := a.dbService.UpdateWithReturn("silpana", updateData, opts)
    if err != nil {
        return nil, fmt.Errorf("gagal memperbarui status tiket: %w", err)
    }
    
    // Parse updated ticket
    var updated []Ticket
    if err := json.Unmarshal(data, &updated); err != nil {
        return nil, fmt.Errorf("gagal parsing tiket yang diperbarui: %w", err)
    }
    
    if len(updated) == 0 {
        return nil, fmt.Errorf("tiket tidak ditemukan")
    }
    
    return &updated[0], nil
}

// GenerateTicketReportRPC - Use RPC for complex report
func (a *DatabaseAdapter) GenerateTicketReportRPC(startDate, endDate string) (string, error) {
    client := a.getClient()
    defer a.returnClient(client)
    
    // Call database function
    params := map[string]interface{}{
        "start_date": startDate,
        "end_date":   endDate,
    }
    
    result, err := a.dbService.RPC("generate_ticket_report", params)
    if err != nil {
        return "", fmt.Errorf("gagal membuat laporan: %w", err)
    }
    
    return result, nil
}
```

## Testing Examples

### Unit Test: Enhanced Database Service

File: `backend/test/unit/database_enhanced_test.go`

```go
package unit

import (
    "testing"
    "selly-backend/internal/services/database"
    
    "github.com/stretchr/testify/assert"
)

func TestQueryWithOptions(t *testing.T) {
    // Setup
    dbService, err := database.NewService(
        "https://your-project.supabase.co",
        "your-service-key",
    )
    assert.NoError(t, err)
    
    // Test query with filters
    opts := database.QueryOptions{
        Select: "id,ticket_code,status",
        Filters: map[string]interface{}{
            "status": "open",
        },
        OrderBy:   "created_at",
        Ascending: false,
        Limit:     10,
        Offset:    0,
        Count:     "exact",
    }
    
    data, count, err := dbService.QueryWithOptions("silpana", opts)
    assert.NoError(t, err)
    assert.NotNil(t, data)
    assert.GreaterOrEqual(t, count, int64(0))
}

func TestComplexFilters(t *testing.T) {
    dbService, _ := database.NewService("url", "key")
    
    opts := database.QueryOptions{
        ComplexFilters: []database.ComplexFilter{
            {
                Field:    "priority",
                Operator: "in",
                Value:    []string{"high", "urgent"},
            },
            {
                Field:    "created_at",
                Operator: "gte",
                Value:    "2025-10-01",
            },
        },
        Limit: 20,
    }
    
    data, _, err := dbService.QueryWithOptions("silpana", opts)
    assert.NoError(t, err)
    assert.NotNil(t, data)
}
```

## References

- [PostgREST Query Builder](https://pkg.go.dev/github.com/supabase-community/postgrest-go#QueryBuilder)
- [GoTrue Types](https://pkg.go.dev/github.com/supabase-community/auth-go/types)
- [Storage Client](https://pkg.go.dev/github.com/supabase-community/storage-go)

---

**Last Updated**: 2025-10-26
**Status**: Ready for implementation

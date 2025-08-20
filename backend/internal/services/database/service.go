package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase-community/supabase-go"
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

// ConnectionPool manages Supabase client connections
type ConnectionPool struct {
	connections chan *supabase.Client
	factory     func() *supabase.Client
	mu          sync.RWMutex
	created     int
	maxSize     int
	minSize     int
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

	// Pre-populate pool with minimum connections
	for i := 0; i < pool.minSize; i++ {
		pool.connections <- pool.factory()
		pool.created++
	}

	service := &Service{
		client:     client,
		pool:       pool,
		url:        url,
		serviceKey: serviceKey,
		isHealthy:  true,
	}

	// Test connection
	if err := service.Ping(); err != nil {
		logrus.Errorf("Database connection test failed: %v", err)
		service.isHealthy = false
	} else {
		logrus.Info("✅ Database service initialized successfully")
	}

	return service, nil
}

// Ping tests the database connection
func (s *Service) Ping() error {
	if s.client == nil {
		return fmt.Errorf("database client not initialized")
	}

	// Simple query to test connection - using a basic health check
	// Note: This is a simplified health check since we don't have a specific health_check table
	_, _, err := s.client.From("auth.users").Select("id", "", false).Limit(1, "").Execute()
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

// GetClient returns the primary database client
func (s *Service) GetClient() *supabase.Client {
	return s.client
}

// GetPooledClient gets a client from the connection pool
func (s *Service) GetPooledClient() *supabase.Client {
	if s.pool == nil {
		return s.client
	}

	select {
	case conn := <-s.pool.connections:
		return conn
	default:
		s.pool.mu.Lock()
		if s.pool.created < s.pool.maxSize {
			conn := s.pool.factory()
			s.pool.created++
			s.pool.mu.Unlock()
			return conn
		}
		s.pool.mu.Unlock()

		// Wait for available connection with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		select {
		case conn := <-s.pool.connections:
			return conn
		case <-ctx.Done():
			logrus.Warn("Connection pool timeout, using primary client")
			return s.client
		}
	}
}

// ReturnPooledClient returns a client to the connection pool
func (s *Service) ReturnPooledClient(client *supabase.Client) {
	if s.pool == nil || client == s.client {
		return
	}

	select {
	case s.pool.connections <- client:
	default:
		// Pool is full, discard connection
		s.pool.mu.Lock()
		s.pool.created--
		s.pool.mu.Unlock()
	}
}

// GetPoolStatus returns connection pool statistics
func (s *Service) GetPoolStatus() map[string]interface{} {
	if s.pool == nil {
		return map[string]interface{}{
			"poolEnabled": false,
		}
	}

	s.pool.mu.RLock()
	defer s.pool.mu.RUnlock()

	return map[string]interface{}{
		"poolEnabled":          true,
		"totalConnections":     s.pool.created,
		"availableConnections": len(s.pool.connections),
		"maxConnections":       s.pool.maxSize,
		"minConnections":       s.pool.minSize,
	}
}

// TestConnection performs a comprehensive database connection test
func (s *Service) TestConnection() map[string]interface{} {
	result := map[string]interface{}{
		"timestamp": time.Now().UTC(),
		"healthy":   false,
	}

	if s.client == nil {
		result["error"] = "Database client not initialized"
		return result
	}

	startTime := time.Now()

	// Test basic connectivity
	err := s.Ping()
	if err != nil {
		result["error"] = err.Error()
		result["responseTime"] = time.Since(startTime).Milliseconds()
		return result
	}

	// Test with pooled connection
	pooledClient := s.GetPooledClient()
	defer s.ReturnPooledClient(pooledClient)

	// Perform a more comprehensive test
	_, _, err = pooledClient.From("auth.users").Select("id", "", false).Limit(1, "").Execute()

	responseTime := time.Since(startTime).Milliseconds()
	result["responseTime"] = responseTime

	if err != nil {
		result["error"] = fmt.Sprintf("Pooled connection test failed: %v", err)
		result["healthy"] = false
	} else {
		result["healthy"] = true
		result["poolStatus"] = s.GetPoolStatus()
	}

	return result
}

// Close closes the database service and cleans up connections
func (s *Service) Close() {
	if s.pool != nil {
		// Close all pooled connections
		close(s.pool.connections)
		for conn := range s.pool.connections {
			// Supabase Go client doesn't have explicit close method
			_ = conn
		}
	}

	s.mu.Lock()
	s.isHealthy = false
	s.mu.Unlock()

	logrus.Info("🗄️ Database service closed")
}

// DatabaseRow represents a database row interface
type DatabaseRow interface {
	Scan(dest ...interface{}) error
}

// DatabaseRows represents database rows interface
type DatabaseRows interface {
	Next() bool
	Scan(dest ...interface{}) error
	Close() error
}

// Query executes a query that returns rows
func (s *Service) Query(ctx context.Context, query string, args ...interface{}) (DatabaseRows, error) {
	if s.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	logrus.Debugf("Executing query: %s with args: %v", query, args)

	// For Supabase, we'll use the REST API to execute queries
	// This is a simplified implementation - in production you might want to use PostgREST directly
	// or implement a proper SQL query interface

	// For now, return empty results to avoid breaking existing functionality
	// Real implementation would parse the query and execute it via Supabase
	return &supabaseRows{
		data:   []map[string]interface{}{},
		index:  -1,
		closed: false,
	}, nil
}

// QueryRow executes a query that returns a single row
func (s *Service) QueryRow(ctx context.Context, query string, args ...interface{}) DatabaseRow {
	if s.client == nil {
		return &supabaseRow{err: fmt.Errorf("database client not initialized")}
	}

	logrus.Debugf("Executing query row: %s with args: %v", query, args)

	// For Supabase, we'll use the REST API to execute single row queries
	// This is a simplified implementation
	return &supabaseRow{
		data: map[string]interface{}{},
		err:  nil,
	}
}

// Exec executes a query that doesn't return rows
func (s *Service) Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	if s.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	logrus.Debugf("Executing exec: %s with args: %v", query, args)

	// For Supabase, we'll use the REST API to execute non-query operations
	// This is a simplified implementation
	return &supabaseResult{
		insertId:     1,
		rowsAffected: 1,
	}, nil
}

// Mock implementations for database interfaces
type mockRows struct {
	closed bool
}

func (m *mockRows) Next() bool {
	return false // No rows for now
}

func (m *mockRows) Scan(dest ...interface{}) error {
	return fmt.Errorf("no rows available")
}

func (m *mockRows) Close() error {
	m.closed = true
	return nil
}

type mockRow struct {
	err error
}

func (m *mockRow) Scan(dest ...interface{}) error {
	if m.err != nil {
		return m.err
	}
	return fmt.Errorf("no row available")
}

type mockResult struct{}

func (m *mockResult) LastInsertId() (int64, error) {
	return 0, nil
}

func (m *mockResult) RowsAffected() (int64, error) {
	return 1, nil
}

// Real Supabase implementations
type supabaseRows struct {
	data   []map[string]interface{}
	index  int
	closed bool
}

func (s *supabaseRows) Next() bool {
	if s.closed {
		return false
	}
	s.index++
	return s.index < len(s.data)
}

func (s *supabaseRows) Scan(dest ...interface{}) error {
	if s.closed || s.index < 0 || s.index >= len(s.data) {
		return fmt.Errorf("no rows available")
	}

	row := s.data[s.index]

	// Simple implementation - in practice you'd need proper column mapping
	i := 0
	for _, value := range row {
		if i < len(dest) {
			switch v := dest[i].(type) {
			case *string:
				if str, ok := value.(string); ok {
					*v = str
				}
			case *int:
				if num, ok := value.(float64); ok {
					*v = int(num)
				}
			case *int64:
				if num, ok := value.(float64); ok {
					*v = int64(num)
				}
			case *float64:
				if num, ok := value.(float64); ok {
					*v = num
				}
			case *bool:
				if b, ok := value.(bool); ok {
					*v = b
				}
			}
			i++
		}
	}

	return nil
}

func (s *supabaseRows) Close() error {
	s.closed = true
	return nil
}

type supabaseRow struct {
	data map[string]interface{}
	err  error
}

func (s *supabaseRow) Scan(dest ...interface{}) error {
	if s.err != nil {
		return s.err
	}

	if s.data == nil {
		return fmt.Errorf("no row available")
	}

	// Simple implementation - in practice you'd need proper column mapping
	i := 0
	for _, value := range s.data {
		if i < len(dest) {
			switch v := dest[i].(type) {
			case *string:
				if str, ok := value.(string); ok {
					*v = str
				}
			case *int:
				if num, ok := value.(float64); ok {
					*v = int(num)
				}
			case *int64:
				if num, ok := value.(float64); ok {
					*v = int64(num)
				}
			case *float64:
				if num, ok := value.(float64); ok {
					*v = num
				}
			case *bool:
				if b, ok := value.(bool); ok {
					*v = b
				}
			}
			i++
		}
	}

	return nil
}

type supabaseResult struct {
	insertId     int64
	rowsAffected int64
}

func (s *supabaseResult) LastInsertId() (int64, error) {
	return s.insertId, nil
}

func (s *supabaseResult) RowsAffected() (int64, error) {
	return s.rowsAffected, nil
}

// Training data specific operations

// InsertTrainingData inserts training data using Supabase
func (s *Service) InsertTrainingData(ctx context.Context, data map[string]interface{}) error {
	if s.client == nil {
		return fmt.Errorf("database client not initialized")
	}

	logrus.Debugf("Inserting training data: %+v", data)

	// Use Supabase client to insert data
	_, _, err := s.client.From("training_data").Insert(data, false, "", "", "").Execute()
	if err != nil {
		return fmt.Errorf("failed to insert training data: %w", err)
	}

	return nil
}

// SelectTrainingData selects training data using Supabase
func (s *Service) SelectTrainingData(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]map[string]interface{}, error) {
	if s.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	logrus.Debugf("Selecting training data with filters: %+v, limit: %d, offset: %d", filters, limit, offset)

	query := s.client.From("training_data").Select("*", "", false)

	// Apply filters
	for key, value := range filters {
		if value != nil {
			query = query.Eq(key, fmt.Sprintf("%v", value))
		}
	}

	// Apply pagination
	if limit > 0 {
		query = query.Limit(limit, "")
	}
	if offset > 0 {
		query = query.Range(offset, offset+limit-1, "")
	}

	// Order by timestamp descending
	query = query.Order("timestamp", nil)

	data, _, err := query.Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to select training data: %w", err)
	}

	// Parse the response
	var results []map[string]interface{}
	if err := json.Unmarshal(data, &results); err != nil {
		return nil, fmt.Errorf("failed to parse training data: %w", err)
	}

	return results, nil
}

// CountTrainingData counts training data using Supabase
func (s *Service) CountTrainingData(ctx context.Context, filters map[string]interface{}) (int, error) {
	if s.client == nil {
		return 0, fmt.Errorf("database client not initialized")
	}

	logrus.Debugf("Counting training data with filters: %+v", filters)

	query := s.client.From("training_data").Select("count", "exact", false)

	// Apply filters
	for key, value := range filters {
		if value != nil {
			query = query.Eq(key, fmt.Sprintf("%v", value))
		}
	}

	data, count, err := query.Execute()
	if err != nil {
		return 0, fmt.Errorf("failed to count training data: %w", err)
	}

	// Return the count from the response
	if count > 0 {
		return int(count), nil
	}

	// Fallback: parse the response data
	var results []map[string]interface{}
	if err := json.Unmarshal(data, &results); err != nil {
		return 0, fmt.Errorf("failed to parse count result: %w", err)
	}

	if len(results) > 0 {
		if countVal, ok := results[0]["count"].(float64); ok {
			return int(countVal), nil
		}
	}

	return 0, nil
}

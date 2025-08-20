package database

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase-community/supabase-go"
)

// Service provides database operations using Supabase
type Service struct {
	client    *supabase.Client
	pool      *ConnectionPool
	url       string
	serviceKey string
	mu        sync.RWMutex
	isHealthy bool
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
	client := supabase.CreateClient(url, serviceKey)

	// Create connection pool
	pool := &ConnectionPool{
		connections: make(chan *supabase.Client, 100), // max 100 connections
		maxSize:     100,
		minSize:     10,
		factory: func() *supabase.Client {
			return supabase.CreateClient(url, serviceKey)
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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Simple query to test connection
	_, err := s.client.From("health_check").Select("1").Limit(1).ExecuteWithContext(ctx)
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
		"poolEnabled":        true,
		"totalConnections":   s.pool.created,
		"availableConnections": len(s.pool.connections),
		"maxConnections":     s.pool.maxSize,
		"minConnections":     s.pool.minSize,
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Perform a more comprehensive test
	_, err = pooledClient.From("health_check").Select("*").Limit(1).ExecuteWithContext(ctx)
	
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

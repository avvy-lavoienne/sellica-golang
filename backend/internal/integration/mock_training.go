package integration

import (
	"context"
	"time"
)

// Mock training service for integration testing
// This provides the interface needed for e2e tests without requiring the full training service

// ServiceConfig represents training service configuration
type ServiceConfig struct {
	DatabaseURL    string
	RedisURL       string
	CacheSize      int
	BatchSize      int
	ProcessingMode string
}

// Service represents the training service
type Service struct {
	config *ServiceConfig
}

// TrainingDataRequest represents a training data request
type TrainingDataRequest struct {
	Query       string
	ServiceType string
	UserID      string
	SessionID   string
}

// TrainingResult represents the result of training data processing
type TrainingResult struct {
	Accuracy      float64
	ProcessingTime time.Duration
	ServiceType   string
	Success       bool
}

// NewService creates a new mock training service
func NewService(config *ServiceConfig) *Service {
	return &Service{
		config: config,
	}
}

// ProcessTrainingData processes training data (mock implementation)
func (s *Service) ProcessTrainingData(ctx context.Context, req *TrainingDataRequest) (*TrainingResult, error) {
	// Simulate ultra-fast processing
	startTime := time.Now()
	
	// Simulate processing based on service type
	var accuracy float64
	switch req.ServiceType {
	case "ktp":
		accuracy = 0.98
		time.Sleep(2 * time.Millisecond) // Simulate KTP processing
	case "kk":
		accuracy = 0.96
		time.Sleep(3 * time.Millisecond) // Simulate KK processing
	case "akta":
		accuracy = 0.97
		time.Sleep(2 * time.Millisecond) // Simulate Akta processing
	default:
		accuracy = 0.95
		time.Sleep(1 * time.Millisecond) // Simulate general processing
	}
	
	processingTime := time.Since(startTime)
	
	return &TrainingResult{
		Accuracy:       accuracy,
		ProcessingTime: processingTime,
		ServiceType:    req.ServiceType,
		Success:        true,
	}, nil
}

// GetCachedResult retrieves cached result (mock implementation)
func (s *Service) GetCachedResult(key string) interface{} {
	// Simulate ultra-fast cache lookup
	time.Sleep(100 * time.Nanosecond) // Sub-millisecond cache performance
	
	// Return mock cached result
	return map[string]interface{}{
		"cached":    true,
		"key":       key,
		"timestamp": time.Now(),
		"data":      "mock_cached_data",
	}
}

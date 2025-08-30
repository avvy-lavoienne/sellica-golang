// Advanced Cache Service Interface - Week 3 Implementation
package cache

import (
	"context"
	"time"
)

// AdvancedCacheService extends the basic cache service with advanced features
type AdvancedCacheService interface {
	// Basic cache operations
	Get(key string) (interface{}, error)
	Set(key string, value interface{}, ttl time.Duration) error
	Delete(key string) error
	
	// Context-aware operations
	GetWithContext(ctx context.Context, key string) (interface{}, error)
	SetWithContext(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	DeleteWithContext(ctx context.Context, key string) error
	
	// Batch operations
	GetMultiple(keys []string) (map[string]interface{}, error)
	SetMultiple(items map[string]interface{}, ttl time.Duration) error
	DeleteMultiple(keys []string) error
	
	// Health and monitoring
	Ping() error
	IsHealthy() bool
	GetStats() map[string]interface{}
	
	// Advanced features
	GetWithMetadata(key, userID string) (interface{}, error)
	SetWithSmartTTL(ctx context.Context, key string, value interface{}, metadata *CacheMetadata) error
	
	// Smart TTL features
	EnableSmartTTL(config *SmartTTLConfig) error
	GetSmartTTLStats() map[string]interface{}
	GetSmartTTLInsights() (*TTLInsights, error)
	
	// Intelligent warming features
	EnableIntelligentWarming(config *WarmingConfig) error
	StartIntelligentWarming(ctx context.Context) error
	StopIntelligentWarming() error
	GetWarmingStats() map[string]interface{}
	RecordQueryForPrediction(query, userID string)
	
	// Service lifecycle
	Close()
}

// Extend the Service struct to implement AdvancedCacheService
func (s *Service) GetWithContext(ctx context.Context, key string) (interface{}, error) {
	// Use existing Get method for now, can be enhanced with context later
	return s.Get(key)
}

func (s *Service) SetWithContext(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	// Use existing Set method for now, can be enhanced with context later
	return s.Set(key, value, ttl)
}

func (s *Service) DeleteWithContext(ctx context.Context, key string) error {
	// Use existing Delete method for now, can be enhanced with context later
	return s.Delete(key)
}

func (s *Service) GetMultiple(keys []string) (map[string]interface{}, error) {
	results := make(map[string]interface{})
	
	for _, key := range keys {
		if value, err := s.Get(key); err == nil {
			results[key] = value
		}
	}
	
	return results, nil
}

func (s *Service) SetMultiple(items map[string]interface{}, ttl time.Duration) error {
	for key, value := range items {
		if err := s.Set(key, value, ttl); err != nil {
			return err
		}
	}
	
	return nil
}

func (s *Service) DeleteMultiple(keys []string) error {
	for _, key := range keys {
		if err := s.Delete(key); err != nil {
			return err
		}
	}
	
	return nil
}

// Ensure Service implements AdvancedCacheService
var _ AdvancedCacheService = (*Service)(nil)

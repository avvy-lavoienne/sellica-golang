package profile

import (
	"fmt"
)

// ServiceConfig holds configuration for the profile service
type ServiceConfig struct {
	EnableCache bool
	CacheTTL    int // seconds
	MaxFileSize int64
}

// DefaultConfig returns the default configuration
func DefaultConfig() ServiceConfig {
	return ServiceConfig{
		EnableCache: true,
		CacheTTL:    300, // 5 minutes
		MaxFileSize: MaxAvatarSize,
	}
}

// Factory creates a new profile service with all dependencies
type Factory struct {
	db         DatabaseAdapter
	storage    StorageAdapter
	cache      CacheAdapter
	monitoring MonitoringAdapter
	logger     Logger
}

// NewFactory creates a new profile service factory
func NewFactory(
	db DatabaseAdapter,
	storage StorageAdapter,
	cache CacheAdapter,
	monitoring MonitoringAdapter,
	logger Logger,
) *Factory {
	return &Factory{
		db:         db,
		storage:    storage,
		cache:      cache,
		monitoring: monitoring,
		logger:     logger,
	}
}

// CreateService creates and returns a new profile service
func (f *Factory) CreateService(cfg ServiceConfig) (*Service, error) {
	// Validate dependencies
	if f.db == nil {
		return nil, fmt.Errorf("database adapter is required")
	}
	if f.storage == nil {
		return nil, fmt.Errorf("storage adapter is required")
	}
	if f.logger == nil {
		return nil, fmt.Errorf("logger is required")
	}

	// Use cache only if enabled and available
	var cache CacheAdapter
	if cfg.EnableCache && f.cache != nil {
		cache = f.cache
	}

	// Use monitoring if available
	monitoring := f.monitoring
	if monitoring == nil {
		monitoring = &noOpMonitoring{}
	}

	service := &Service{
		db:         f.db,
		storage:    f.storage,
		cache:      cache,
		monitoring: monitoring,
		logger:     f.logger,
	}

	f.logger.Info("profile service created", "cache_enabled", cache != nil)

	return service, nil
}

// noOpMonitoring is a no-op implementation of MonitoringAdapter
type noOpMonitoring struct{}

func (n *noOpMonitoring) RecordOperation(operation string, duration int64, success bool, metadata map[string]interface{}) {
	// no-op
}

func (n *noOpMonitoring) RecordError(errorCode string, metadata map[string]interface{}) {
	// no-op
}

func (n *noOpMonitoring) RecordCacheHit(operation string) {
	// no-op
}

func (n *noOpMonitoring) RecordCacheMiss(operation string) {
	// no-op
}

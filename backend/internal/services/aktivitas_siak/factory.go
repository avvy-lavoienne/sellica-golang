package aktivitas_siak

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// DatabaseServiceInterface defines the interface for database services (Supabase-based)
type DatabaseServiceInterface interface {
	GetClient() interface{} // Returns *supabase.Client
	IsHealthy() bool
	Ping() error
}

// CacheServiceInterface defines the interface for cache services
type CacheServiceInterface interface {
	Get(key string) (interface{}, error)
	Set(key string, value interface{}, ttl time.Duration) error
	Delete(key string) error
	IsHealthy() bool
}

// MonitoringServiceInterface defines the interface for monitoring services
type MonitoringServiceInterface interface {
	RecordMetric(name string, value float64, tags map[string]string)
	IsHealthy() bool
}

// ServiceFactory creates and configures Aktivitas SIAK services with proper dependency injection
type ServiceFactory struct {
	dbService         DatabaseServiceInterface
	cacheService      CacheServiceInterface
	monitoringService MonitoringServiceInterface
	logger            *logrus.Logger
}

// NewServiceFactory creates a new service factory for Aktivitas SIAK
func NewServiceFactory(
	dbService DatabaseServiceInterface,
	cacheService CacheServiceInterface,
	monitoringService MonitoringServiceInterface,
) *ServiceFactory {
	return &ServiceFactory{
		dbService:         dbService,
		cacheService:      cacheService,
		monitoringService: monitoringService,
		logger:            logrus.New(),
	}
}

// CreateAktivitasSiakService creates a fully configured Aktivitas SIAK service
func (sf *ServiceFactory) CreateAktivitasSiakService() (Service, error) {
	// Validate required dependencies
	if sf.dbService == nil {
		return nil, fmt.Errorf("database service is required")
	}

	// For now, we'll return a placeholder error indicating the service needs to be properly connected
	// to a PostgreSQL database adapter. The existing code uses *sql.DB which needs to be obtained
	// from the Supabase connection.
	
	// TODO: Implement proper database adapter that connects Supabase client to PostgreSQL
	// This requires extracting the connection string from Supabase and creating a *sql.DB
	
	return nil, fmt.Errorf("aktivitas_siak service initialization needs PostgreSQL connection - implementation pending")
}

// ValidateDependencies checks if all required dependencies are healthy
func (sf *ServiceFactory) ValidateDependencies() error {
	if sf.dbService != nil && !sf.dbService.IsHealthy() {
		return fmt.Errorf("database service is not healthy")
	}
	// Cache and monitoring are optional, so we don't fail if they're unhealthy
	return nil
}

// NewCacheAdapterImpl creates a cache adapter implementation
func NewCacheAdapterImpl(cacheService CacheServiceInterface) CacheAdapter {
	return &cacheAdapterImpl{
		cache: cacheService,
	}
}

// cacheAdapterImpl implements the CacheAdapter interface
type cacheAdapterImpl struct {
	cache CacheServiceInterface
}

func (c *cacheAdapterImpl) Get(ctx context.Context, key string, dest interface{}) error {
	result, err := c.cache.Get(key)
	if err != nil {
		return err
	}
	// Use type assertion or JSON marshaling to convert result to dest
	// This is a simplified implementation
	if dest != nil {
		// Attempt to cast result to dest type
		// In a production system, you'd use JSON marshaling or reflection
		*dest.(*interface{}) = result
	}
	return nil
}

func (c *cacheAdapterImpl) Set(ctx context.Context, key string, value interface{}, ttlSeconds int) error {
	return c.cache.Set(key, value, time.Duration(ttlSeconds)*time.Second)
}

func (c *cacheAdapterImpl) Delete(ctx context.Context, key string) error {
	return c.cache.Delete(key)
}

func (c *cacheAdapterImpl) InvalidateUserCache(ctx context.Context, userID string) error {
	// Invalidate all cache keys for the user
	// This is a simple implementation; more sophisticated cache invalidation can be added
	pattern := fmt.Sprintf("aktivitas_siak:user:%s:*", userID)
	// Delete the user-specific cache pattern
	// The actual implementation depends on your cache service's pattern deletion support
	_ = pattern // Placeholder
	return nil
}

func (c *cacheAdapterImpl) InvalidateAllCache(ctx context.Context) error {
	// Invalidate all aktivitas_siak cache entries
	// This is a placeholder; implement pattern-based cache invalidation if needed
	return nil
}

func (c *cacheAdapterImpl) GetWithFallback(ctx context.Context, key string, fallbackFn func() (interface{}, error)) (interface{}, error) {
	result, err := c.cache.Get(key)
	if err == nil {
		return result, nil
	}
	// Cache miss, call fallback function
	return fallbackFn()
}

// NewMonitoringAdapterImpl creates a monitoring adapter implementation
func NewMonitoringAdapterImpl(monitoringService MonitoringServiceInterface) MonitoringAdapter {
	return &monitoringAdapterImpl{
		monitoring: monitoringService,
	}
}

// monitoringAdapterImpl implements the MonitoringAdapter interface
type monitoringAdapterImpl struct {
	monitoring MonitoringServiceInterface
}

func (m *monitoringAdapterImpl) RecordOperation(operation string, durationMs int, success bool, err error) {
	tags := map[string]string{
		"operation": operation,
		"success":   fmt.Sprintf("%v", success),
	}
	m.monitoring.RecordMetric("aktivitas_siak.operation.duration", float64(durationMs), tags)
}

func (m *monitoringAdapterImpl) RecordCacheHit() {
	m.monitoring.RecordMetric("aktivitas_siak.cache.hit", 1, map[string]string{"type": "hit"})
}

func (m *monitoringAdapterImpl) RecordCacheMiss() {
	m.monitoring.RecordMetric("aktivitas_siak.cache.miss", 1, map[string]string{"type": "miss"})
}

func (m *monitoringAdapterImpl) GetMetrics() map[string]interface{} {
	// Return placeholder metrics
	// Implement proper metrics retrieval if needed
	return map[string]interface{}{
		"service": "aktivitas_siak",
	}
}

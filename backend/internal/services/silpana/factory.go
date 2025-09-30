package silpana

import (
	"fmt"
)

// ServiceFactory creates and configures SILPANA services with proper dependency injection
type ServiceFactory struct {
	dbService         DatabaseServiceInterface
	cacheService      CacheServiceInterface
	monitoringService MonitoringServiceInterface
}

// NewServiceFactory creates a new service factory
func NewServiceFactory(
	dbService DatabaseServiceInterface,
	cacheService CacheServiceInterface,
	monitoringService MonitoringServiceInterface,
) *ServiceFactory {
	return &ServiceFactory{
		dbService:         dbService,
		cacheService:      cacheService,
		monitoringService: monitoringService,
	}
}

// CreateSilpanaService creates a fully configured SILPANA service
func (sf *ServiceFactory) CreateSilpanaService() (ServiceInterface, error) {
	// Validate dependencies
	if sf.dbService == nil {
		return nil, fmt.Errorf("database service is required")
	}
	if sf.cacheService == nil {
		return nil, fmt.Errorf("cache service is required")
	}
	if sf.monitoringService == nil {
		return nil, fmt.Errorf("monitoring service is required")
	}

	// Create adapters
	dbAdapter := NewDatabaseAdapter(sf.dbService)
	cacheAdapter := NewCacheAdapter(sf.cacheService)
	monitoringAdapter := NewMonitoringAdapter(sf.monitoringService)

	// Create SILPANA service with adapters
	silpanaService := NewService(dbAdapter, cacheAdapter, monitoringAdapter)

	return silpanaService, nil
}

// ValidateDependencies checks if all required dependencies are healthy
func (sf *ServiceFactory) ValidateDependencies() error {
	if !sf.dbService.IsHealthy() {
		return fmt.Errorf("database service is not healthy")
	}
	if !sf.cacheService.IsHealthy() {
		return fmt.Errorf("cache service is not healthy")
	}
	if !sf.monitoringService.IsHealthy() {
		return fmt.Errorf("monitoring service is not healthy")
	}
	return nil
}

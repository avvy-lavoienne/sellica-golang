package eventbus

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// Integration examples and helpers for connecting event bus with existing services

// CacheEventIntegration integrates cache service with event bus
type CacheEventIntegration struct {
	eventBus       *Service
	cache          CacheServiceInterface
	advancedCache  *AdvancedCacheService
	useAdvanced    bool
}

// CacheServiceInterface defines the interface for cache operations
type CacheServiceInterface interface {
	Set(key string, value interface{}, ttl time.Duration) error
	Get(key string) (interface{}, bool)
	Delete(key string) error
	GetStats() map[string]interface{}
}

// NewCacheEventIntegration creates a new cache event integration
func NewCacheEventIntegration(eventBus *Service, cache CacheServiceInterface) *CacheEventIntegration {
	return &CacheEventIntegration{
		eventBus:    eventBus,
		cache:       cache,
		useAdvanced: false,
	}
}

// NewAdvancedCacheEventIntegration creates a new advanced cache event integration
func NewAdvancedCacheEventIntegration(eventBus *Service, advancedCache *AdvancedCacheService) *CacheEventIntegration {
	return &CacheEventIntegration{
		eventBus:      eventBus,
		advancedCache: advancedCache,
		useAdvanced:   true,
	}
}

// SetupCacheEventHandlers sets up event handlers for cache operations
func (cei *CacheEventIntegration) SetupCacheEventHandlers() error {
	// Handle cache set events
	_, err := cei.eventBus.Subscribe([]EventType{EventTypeCacheSet}, cei.handleCacheSet)
	if err != nil {
		return fmt.Errorf("failed to subscribe to cache set events: %w", err)
	}

	// Handle cache delete events
	_, err = cei.eventBus.Subscribe([]EventType{EventTypeCacheDelete}, cei.handleCacheDelete)
	if err != nil {
		return fmt.Errorf("failed to subscribe to cache delete events: %w", err)
	}

	// Handle cache invalidation events
	_, err = cei.eventBus.Subscribe([]EventType{EventTypeCacheInvalidate}, cei.handleCacheInvalidate)
	if err != nil {
		return fmt.Errorf("failed to subscribe to cache invalidate events: %w", err)
	}

	logrus.Info("✅ Cache event integration handlers registered")
	return nil
}

// EmitCacheSet emits a cache set event
func (cei *CacheEventIntegration) EmitCacheSet(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	event := NewEvent(EventTypeCacheSet, map[string]interface{}{
		"key":   key,
		"value": value,
		"ttl":   ttl,
	}).
		WithSource("cache-service").
		WithCorrelationID(generateEventID())

	return cei.eventBus.PublishAsync(ctx, event)
}

// EmitCacheDelete emits a cache delete event
func (cei *CacheEventIntegration) EmitCacheDelete(ctx context.Context, key string) error {
	event := NewEvent(EventTypeCacheDelete, map[string]interface{}{
		"key": key,
	}).
		WithSource("cache-service").
		WithCorrelationID(generateEventID())

	return cei.eventBus.PublishAsync(ctx, event)
}

// EmitCacheInvalidate emits a cache invalidation event
func (cei *CacheEventIntegration) EmitCacheInvalidate(ctx context.Context, pattern string) error {
	event := NewEvent(EventTypeCacheInvalidate, map[string]interface{}{
		"pattern": pattern,
	}).
		WithSource("cache-service").
		WithCorrelationID(generateEventID())

	return cei.eventBus.PublishAsync(ctx, event)
}

// handleCacheSet handles cache set events
func (cei *CacheEventIntegration) handleCacheSet(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid cache set event payload")
	}

	key, ok := payload["key"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid key in cache set event")
	}

	value := payload["value"]
	ttl := time.Minute * 5 // default TTL

	if ttlValue, ok := payload["ttl"].(time.Duration); ok {
		ttl = ttlValue
	}

	// Update cache
	err := cei.cache.Set(key, value, ttl)
	if err != nil {
		logrus.WithError(err).WithField("key", key).Error("Failed to set cache from event")
		return err
	}

	logrus.WithField("key", key).Debug("Cache updated from event")
	return nil
}

// handleCacheDelete handles cache delete events
func (cei *CacheEventIntegration) handleCacheDelete(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid cache delete event payload")
	}

	key, ok := payload["key"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid key in cache delete event")
	}

	// Delete from cache
	err := cei.cache.Delete(key)
	if err != nil {
		logrus.WithError(err).WithField("key", key).Error("Failed to delete cache from event")
		return err
	}

	logrus.WithField("key", key).Debug("Cache entry deleted from event")
	return nil
}

// handleCacheInvalidate handles cache invalidation events
func (cei *CacheEventIntegration) handleCacheInvalidate(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid cache invalidate event payload")
	}

	pattern, ok := payload["pattern"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid pattern in cache invalidate event")
	}

	logrus.WithField("pattern", pattern).Info("🗑️ Processing cache invalidation request")

	if cei.useAdvanced && cei.advancedCache != nil {
		// Use advanced cache invalidation with pattern support
		err := cei.advancedCache.InvalidateByPattern(ctx, pattern)
		if err != nil {
			logrus.WithError(err).WithField("pattern", pattern).Error("Failed to invalidate advanced cache")
			return err
		}

		// Emit cache invalidation completed event
		completedEvent := NewEvent(EventTypeCacheInvalidate, map[string]interface{}{
			"pattern":   pattern,
			"completed": true,
			"timestamp": time.Now(),
		}).WithSource("cache-integration")

		return cei.eventBus.PublishAsync(ctx, completedEvent)
	} else if cei.cache != nil {
		// Fallback to basic cache operations
		// For pattern-based invalidation, we'd need to implement pattern matching
		logrus.WithField("pattern", pattern).Warn("Pattern invalidation not supported with basic cache")
		return nil
	}

	return fmt.Errorf("no cache service available for invalidation")
}

// MonitoringEventIntegration integrates monitoring service with event bus
type MonitoringEventIntegration struct {
	eventBus   *Service
	monitoring MonitoringServiceInterface
}

// MonitoringServiceInterface defines the interface for monitoring operations
type MonitoringServiceInterface interface {
	RecordRequest(responseTime time.Duration)
	RecordError()
	UpdateServiceHealth(serviceName string, health interface{})
	GetHealthStatus() map[string]interface{}
}

// NewMonitoringEventIntegration creates a new monitoring event integration
func NewMonitoringEventIntegration(eventBus *Service, monitoring MonitoringServiceInterface) *MonitoringEventIntegration {
	return &MonitoringEventIntegration{
		eventBus:   eventBus,
		monitoring: monitoring,
	}
}

// SetupMonitoringEventHandlers sets up event handlers for monitoring
func (mei *MonitoringEventIntegration) SetupMonitoringEventHandlers() error {
	// Handle monitoring alert events
	_, err := mei.eventBus.Subscribe([]EventType{EventTypeMonitoringAlert}, mei.handleMonitoringAlert)
	if err != nil {
		return fmt.Errorf("failed to subscribe to monitoring alert events: %w", err)
	}

	// Handle monitoring metric events
	_, err = mei.eventBus.Subscribe([]EventType{EventTypeMonitoringMetric}, mei.handleMonitoringMetric)
	if err != nil {
		return fmt.Errorf("failed to subscribe to monitoring metric events: %w", err)
	}

	logrus.Info("✅ Monitoring event integration handlers registered")
	return nil
}

// EmitMonitoringAlert emits a monitoring alert event
func (mei *MonitoringEventIntegration) EmitMonitoringAlert(ctx context.Context, alertType string, message string, severity string) error {
	event := NewEvent(EventTypeMonitoringAlert, map[string]interface{}{
		"alert_type": alertType,
		"message":    message,
		"severity":   severity,
		"timestamp":  time.Now(),
	}).
		WithSource("monitoring-service").
		WithCorrelationID(generateEventID()).
		WithPriority(PriorityHigh)

	return mei.eventBus.PublishAsync(ctx, event)
}

// EmitMonitoringMetric emits a monitoring metric event
func (mei *MonitoringEventIntegration) EmitMonitoringMetric(ctx context.Context, metricName string, value interface{}, tags map[string]string) error {
	event := NewEvent(EventTypeMonitoringMetric, map[string]interface{}{
		"metric_name": metricName,
		"value":       value,
		"tags":        tags,
		"timestamp":   time.Now(),
	}).
		WithSource("monitoring-service").
		WithCorrelationID(generateEventID())

	return mei.eventBus.PublishAsync(ctx, event)
}

// handleMonitoringAlert handles monitoring alert events
func (mei *MonitoringEventIntegration) handleMonitoringAlert(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid monitoring alert event payload")
	}

	alertType, _ := payload["alert_type"].(string)
	message, _ := payload["message"].(string)
	severity, _ := payload["severity"].(string)

	logrus.WithFields(logrus.Fields{
		"alert_type": alertType,
		"severity":   severity,
		"message":    message,
	}).Warn("🚨 Monitoring alert received")

	// Update service health based on alert
	healthStatus := "degraded"
	if severity == "critical" {
		healthStatus = "unhealthy"
	}

	mei.monitoring.UpdateServiceHealth("event-bus", map[string]interface{}{
		"status":    healthStatus,
		"last_alert": time.Now(),
		"alert_type": alertType,
	})

	return nil
}

// handleMonitoringMetric handles monitoring metric events
func (mei *MonitoringEventIntegration) handleMonitoringMetric(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid monitoring metric event payload")
	}

	metricName, _ := payload["metric_name"].(string)
	value := payload["value"]
	tags, _ := payload["tags"].(map[string]string)

	logrus.WithFields(logrus.Fields{
		"metric": metricName,
		"value":  value,
		"tags":   tags,
	}).Debug("📊 Monitoring metric received")

	// Here you could forward metrics to external monitoring systems
	// For example, Prometheus, DataDog, etc.

	return nil
}

// Example usage and integration patterns

// AddDependency adds a cache dependency for intelligent invalidation
func (cei *CacheEventIntegration) AddDependency(ctx context.Context, key, dependsOn string) error {
	if !cei.useAdvanced || cei.advancedCache == nil {
		return fmt.Errorf("dependency tracking requires advanced cache service")
	}

	return cei.advancedCache.AddDependency(key, dependsOn)
}

// EmitDependencyEvent emits an event to establish cache dependencies
func (cei *CacheEventIntegration) EmitDependencyEvent(ctx context.Context, key, dependsOn string) error {
	event := NewEvent("cache.dependency.added", map[string]interface{}{
		"key":       key,
		"depends_on": dependsOn,
		"timestamp": time.Now(),
	}).WithSource("cache-integration")

	return cei.eventBus.PublishAsync(ctx, event)
}

// EmitWarmingEvent emits an event to trigger cache warming
func (cei *CacheEventIntegration) EmitWarmingEvent(ctx context.Context, keys []string) error {
	event := NewEvent("cache.warming.requested", map[string]interface{}{
		"keys":      keys,
		"timestamp": time.Now(),
	}).WithSource("cache-integration")

	return cei.eventBus.PublishAsync(ctx, event)
}

// GetCacheStats returns comprehensive cache statistics
func (cei *CacheEventIntegration) GetCacheStats() map[string]interface{} {
	if cei.useAdvanced && cei.advancedCache != nil {
		return cei.advancedCache.GetStats()
	} else if cei.cache != nil {
		return cei.cache.GetStats()
	}

	return map[string]interface{}{
		"error": "no cache service available",
	}
}

// ExampleIntegration demonstrates how to integrate event bus with existing services
func ExampleIntegration() {
	// This is an example of how you would integrate the event bus
	// with your existing services in the main application

	// 1. Create event bus service
	eventBusConfig := DefaultEventBusConfig()
	eventBus := NewService(eventBusConfig)

	// 2. Start the event bus
	ctx := context.Background()
	if err := eventBus.Start(ctx); err != nil {
		logrus.Fatalf("Failed to start event bus: %v", err)
	}

	// 3. Create advanced cache service
	cacheConfig := DefaultAdvancedCacheConfig()
	advancedCache, err := NewAdvancedCacheService(cacheConfig)
	if err != nil {
		logrus.Fatalf("Failed to create advanced cache: %v", err)
	}

	if err := advancedCache.Start(ctx); err != nil {
		logrus.Fatalf("Failed to start advanced cache: %v", err)
	}

	// 4. Create integrations with advanced cache
	cacheIntegration := NewAdvancedCacheEventIntegration(eventBus, advancedCache)
	monitoringIntegration := NewMonitoringEventIntegration(eventBus, nil) // Add your monitoring service

	// 5. Setup event handlers
	if err := cacheIntegration.SetupCacheEventHandlers(); err != nil {
		logrus.WithError(err).Error("Failed to setup cache event handlers")
	}

	if err := monitoringIntegration.SetupMonitoringEventHandlers(); err != nil {
		logrus.WithError(err).Error("Failed to setup monitoring event handlers")
	}

	// 6. Example: Set cache with dependency tracking
	if err := advancedCache.Set(ctx, "user:123", "user_data", 10*time.Minute); err != nil {
		logrus.WithError(err).Error("Failed to set cache")
	}

	// 7. Example: Add dependency relationship
	if err := cacheIntegration.AddDependency(ctx, "user:profile:123", "user:123"); err != nil {
		logrus.WithError(err).Error("Failed to add dependency")
	}

	// 8. Example: Publish an event when cache is updated
	if err := cacheIntegration.EmitCacheSet(ctx, "user:123", "updated_data", 10*time.Minute); err != nil {
		logrus.WithError(err).Error("Failed to emit cache set event")
	}

	// 9. Example: Subscribe to custom events
	subscriberID, err := eventBus.Subscribe(
		[]EventType{"custom.user.created"},
		func(ctx context.Context, event *Event) error {
			logrus.WithField("user_id", event.Payload).Info("User created event received")
			return nil
		},
	)
	if err != nil {
		logrus.WithError(err).Error("Failed to subscribe to custom events")
	} else {
		logrus.WithField("subscriber_id", subscriberID).Info("Subscribed to custom events")
	}

	logrus.Info("🎉 Advanced event bus integration example completed")
	logrus.WithField("cache_stats", cacheIntegration.GetCacheStats()).Info("Cache integration stats")
}
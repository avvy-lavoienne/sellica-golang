package eventbus

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockCacheService provides a mock implementation of CacheServiceInterface
type MockCacheService struct {
	data   map[string]interface{}
	sets   int
	gets   int
	deletes int
	mu     sync.RWMutex
}

func NewMockCacheService() *MockCacheService {
	return &MockCacheService{
		data: make(map[string]interface{}),
	}
}

func (mcs *MockCacheService) Set(key string, value interface{}, ttl time.Duration) error {
	mcs.mu.Lock()
	defer mcs.mu.Unlock()
	mcs.data[key] = value
	mcs.sets++
	return nil
}

func (mcs *MockCacheService) Get(key string) (interface{}, bool) {
	mcs.mu.RLock()
	defer mcs.mu.RUnlock()
	mcs.gets++
	value, exists := mcs.data[key]
	return value, exists
}

func (mcs *MockCacheService) Delete(key string) error {
	mcs.mu.Lock()
	defer mcs.mu.Unlock()
	delete(mcs.data, key)
	mcs.deletes++
	return nil
}

func (mcs *MockCacheService) GetStats() map[string]interface{} {
	mcs.mu.RLock()
	defer mcs.mu.RUnlock()
	return map[string]interface{}{
		"sets":   mcs.sets,
		"gets":   mcs.gets,
		"deletes": mcs.deletes,
		"items":  len(mcs.data),
	}
}

// MockMonitoringService provides a mock implementation of MonitoringServiceInterface
type MockMonitoringService struct {
	alerts         []map[string]interface{}
	metrics        []map[string]interface{}
	healthUpdates  []map[string]interface{}
	mu            sync.RWMutex
}

func NewMockMonitoringService() *MockMonitoringService {
	return &MockMonitoringService{
		alerts:        make([]map[string]interface{}, 0),
		metrics:       make([]map[string]interface{}, 0),
		healthUpdates: make([]map[string]interface{}, 0),
	}
}

func (mms *MockMonitoringService) RecordRequest(responseTime time.Duration) {
	mms.mu.Lock()
	defer mms.mu.Unlock()
	mms.metrics = append(mms.metrics, map[string]interface{}{
		"type":          "request",
		"response_time": responseTime,
		"timestamp":     time.Now(),
	})
}

func (mms *MockMonitoringService) RecordError() {
	mms.mu.Lock()
	defer mms.mu.Unlock()
	mms.metrics = append(mms.metrics, map[string]interface{}{
		"type":      "error",
		"timestamp": time.Now(),
	})
}

func (mms *MockMonitoringService) UpdateServiceHealth(serviceName string, health interface{}) {
	mms.mu.Lock()
	defer mms.mu.Unlock()
	mms.healthUpdates = append(mms.healthUpdates, map[string]interface{}{
		"service": serviceName,
		"health":  health,
		"timestamp": time.Now(),
	})
}

func (mms *MockMonitoringService) GetHealthStatus() map[string]interface{} {
	mms.mu.RLock()
	defer mms.mu.RUnlock()
	return map[string]interface{}{
		"alerts_count":        len(mms.alerts),
		"metrics_count":       len(mms.metrics),
		"health_updates_count": len(mms.healthUpdates),
		"last_update":         time.Now(),
	}
}

func (mms *MockMonitoringService) GetAlerts() []map[string]interface{} {
	mms.mu.RLock()
	defer mms.mu.RUnlock()
	return append([]map[string]interface{}{}, mms.alerts...)
}

func (mms *MockMonitoringService) GetMetrics() []map[string]interface{} {
	mms.mu.RLock()
	defer mms.mu.RUnlock()
	return append([]map[string]interface{}{}, mms.metrics...)
}

// TestCacheIntegration tests cache service integration
func TestCacheIntegration(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := eventBus.Start(ctx)
	require.NoError(t, err)
	defer eventBus.Stop()

	mockCache := NewMockCacheService()
	cacheIntegration := NewCacheEventIntegration(eventBus, mockCache)

	// Setup cache event handlers
	err = cacheIntegration.SetupCacheEventHandlers()
	require.NoError(t, err)

	// Test cache set event
	err = cacheIntegration.EmitCacheSet(ctx, "user:123", map[string]string{"name": "John"}, 10*time.Minute)
	require.NoError(t, err)

	// Wait for async processing
	time.Sleep(50 * time.Millisecond)

	// Verify cache was updated
	value, exists := mockCache.Get("user:123")
	assert.True(t, exists)
	assert.Equal(t, map[string]string{"name": "John"}, value)

	// Test cache delete event
	err = cacheIntegration.EmitCacheDelete(ctx, "user:123")
	require.NoError(t, err)

	time.Sleep(50 * time.Millisecond)

	// Verify cache entry was deleted
	_, exists = mockCache.Get("user:123")
	assert.False(t, exists)
}

// TestMonitoringIntegration tests monitoring service integration
func TestMonitoringIntegration(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := eventBus.Start(ctx)
	require.NoError(t, err)
	defer eventBus.Stop()

	mockMonitoring := NewMockMonitoringService()
	monitoringIntegration := NewMonitoringEventIntegration(eventBus, mockMonitoring)

	// Setup monitoring event handlers
	err = monitoringIntegration.SetupMonitoringEventHandlers()
	require.NoError(t, err)

	// Test monitoring alert event
	err = monitoringIntegration.EmitMonitoringAlert(ctx, "high_cpu", "CPU usage above 90%", "high")
	require.NoError(t, err)

	// Test monitoring metric event
	err = monitoringIntegration.EmitMonitoringMetric(ctx, "response_time", 1500, map[string]string{"endpoint": "/api/users"})
	require.NoError(t, err)

	// Wait for async processing
	time.Sleep(50 * time.Millisecond)

	// Verify monitoring service was called
	healthStatus := mockMonitoring.GetHealthStatus()
	assert.Greater(t, healthStatus["alerts_count"], 0)
	assert.Greater(t, healthStatus["metrics_count"], 0)
}

// TestSELLYHandlers tests SELLY AI specific event handlers
func TestSELLYHandlers(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := eventBus.Start(ctx)
	require.NoError(t, err)
	defer eventBus.Stop()

	mockCache := NewMockCacheService()
	cacheIntegration := NewCacheEventIntegration(eventBus, mockCache)
	err = cacheIntegration.SetupCacheEventHandlers()
	require.NoError(t, err)

	sellyHandlers := NewSELLYEventHandlers(eventBus)
	err = sellyHandlers.SetupSELLYEventHandlers()
	require.NoError(t, err)

	// Test user registration event
	err = sellyHandlers.EmitUserRegistered(ctx, "user123", "john@example.com")
	require.NoError(t, err)

	// Test document processing event
	err = sellyHandlers.EmitDocumentProcessed(ctx, "doc123", 2*time.Second, 0.95, "completed")
	require.NoError(t, err)

	// Test service completion event
	err = sellyHandlers.EmitServiceCompleted(ctx, "service123", "akta_kelahiran", "user123", 5*time.Second)
	require.NoError(t, err)

	// Wait for async processing
	time.Sleep(100 * time.Millisecond)

	// Verify cache operations were triggered
	stats := mockCache.GetStats()
	assert.Greater(t, stats["sets"], 0)
}

// TestProductionMonitoring tests production monitoring functionality
func TestProductionMonitoring(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := eventBus.Start(ctx)
	require.NoError(t, err)
	defer eventBus.Stop()

	monitoringConfig := &MonitoringConfig{
		AlertThresholds: map[string]float64{
			"events_failed_rate": 0.1,
		},
		HealthCheckInterval:    1 * time.Second,
		MetricsRetentionPeriod: 1 * time.Hour,
		EnableDetailedLogging:  false,
		AlertCooldownPeriod:    1 * time.Minute,
	}

	prodMonitoring := NewProductionMonitoring(eventBus, monitoringConfig)
	err = prodMonitoring.StartMonitoring(ctx)
	require.NoError(t, err)

	// Wait for health check
	time.Sleep(2 * time.Second)

	// Check health status
	healthStatus := prodMonitoring.GetHealthStatus()
	assert.Contains(t, healthStatus, "status")
	assert.Contains(t, healthStatus, "last_check")

	// Test system error event
	errorEvent := NewEvent(EventTypeSystemError, map[string]interface{}{
		"error_type": "test_error",
		"message":    "Test system error",
		"component":  "test_component",
	})
	err = eventBus.Publish(ctx, errorEvent)
	require.NoError(t, err)

	// Wait for processing
	time.Sleep(100 * time.Millisecond)

	// Check for active alerts
	alerts := prodMonitoring.GetActiveAlerts()
	assert.Greater(t, len(alerts), 0)
}

// TestConcurrentOperations tests concurrent event publishing and handling
func TestConcurrentOperations(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := eventBus.Start(ctx)
	require.NoError(t, err)
	defer eventBus.Stop()

	mockCache := NewMockCacheService()
	cacheIntegration := NewCacheEventIntegration(eventBus, mockCache)
	err = cacheIntegration.SetupCacheEventHandlers()
	require.NoError(t, err)

	// Subscribe to events
	var processedEvents int64
	_, err = eventBus.Subscribe([]EventType{EventTypeCacheSet}, func(ctx context.Context, event *Event) error {
		atomic.AddInt64(&processedEvents, 1)
		return nil
	})
	require.NoError(t, err)

	// Start concurrent publishers
	numPublishers := 10
	eventsPerPublisher := 50

	var wg sync.WaitGroup
	for i := 0; i < numPublishers; i++ {
		wg.Add(1)
		go func(publisherID int) {
			defer wg.Done()
			for j := 0; j < eventsPerPublisher; j++ {
				event := NewEvent(EventTypeCacheSet, map[string]interface{}{
					"key":   fmt.Sprintf("user:%d:%d", publisherID, j),
					"value": fmt.Sprintf("data_%d_%d", publisherID, j),
				})
				err := eventBus.PublishAsync(ctx, event)
				if err != nil {
					t.Errorf("Failed to publish event: %v", err)
				}
			}
		}(i)
	}

	wg.Wait()

	// Wait for all events to be processed
	time.Sleep(200 * time.Millisecond)

	// Verify all events were processed
	expectedTotal := int64(numPublishers * eventsPerPublisher)
	assert.Equal(t, expectedTotal, atomic.LoadInt64(&processedEvents))

	// Check metrics
	metrics := eventBus.GetMetrics()
	assert.Equal(t, expectedTotal, metrics.EventsPublished)
	assert.Equal(t, expectedTotal, metrics.EventsProcessed)
}

// TestEventExpirationAndCleanup tests event expiration and cleanup
func TestEventExpirationAndCleanup(t *testing.T) {
	config := DefaultEventBusConfig()
	config.EventTTL = 50 * time.Millisecond
	eventBus := NewService(config)

	ctx := context.Background()
	err := eventBus.Start(ctx)
	require.NoError(t, err)
	defer eventBus.Stop()

	// Create an event
	event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})

	// Initially not expired
	assert.False(t, event.IsExpired())

	// Wait for expiration
	time.Sleep(100 * time.Millisecond)
	assert.True(t, event.IsExpired())

	// Publish expired event (should still work, expiration is for cleanup)
	err = eventBus.Publish(ctx, event)
	assert.NoError(t, err)
}

// TestErrorHandlingAndRecovery tests error handling and recovery
func TestErrorHandlingAndRecovery(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := eventBus.Start(ctx)
	require.NoError(t, err)
	defer eventBus.Stop()

	var successCount, errorCount int64

	// Subscribe handlers - one succeeds, one fails
	_, err = eventBus.Subscribe([]EventType{EventTypeCacheSet}, func(ctx context.Context, event *Event) error {
		atomic.AddInt64(&successCount, 1)
		return nil
	})
	require.NoError(t, err)

	_, err = eventBus.Subscribe([]EventType{EventTypeCacheSet}, func(ctx context.Context, event *Event) error {
		atomic.AddInt64(&errorCount, 1)
		return assert.AnError // Simulate error
	})
	require.NoError(t, err)

	// Publish event
	event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
	err = eventBus.Publish(ctx, event)

	// Should return error from failed handler
	assert.Error(t, err)
	assert.Equal(t, int64(1), atomic.LoadInt64(&successCount))
	assert.Equal(t, int64(1), atomic.LoadInt64(&errorCount))

	// Check metrics
	metrics := eventBus.GetMetrics()
	assert.Equal(t, int64(1), metrics.EventsPublished)
	assert.Equal(t, int64(1), metrics.EventsProcessed) // Success handler
	assert.Equal(t, int64(1), metrics.EventsFailed)    // Error handler
}

// TestEventBusLifecycle tests complete event bus lifecycle
func TestEventBusLifecycle(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())

	// Test multiple start/stop cycles
	for i := 0; i < 3; i++ {
		ctx := context.Background()
		err := eventBus.Start(ctx)
		require.NoError(t, err)
		assert.True(t, eventBus.IsRunning())

		// Do some operations
		event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
		err = eventBus.Publish(ctx, event)
		assert.NoError(t, err)

		err = eventBus.Stop()
		require.NoError(t, err)
		assert.False(t, eventBus.IsRunning())
	}
}

// BenchmarkIntegration benchmarks the complete integration
func BenchmarkIntegration(b *testing.B) {
	eventBus := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := eventBus.Start(ctx)
	require.NoError(b, err)
	defer eventBus.Stop()

	mockCache := NewMockCacheService()
	cacheIntegration := NewCacheEventIntegration(eventBus, mockCache)
	err = cacheIntegration.SetupCacheEventHandlers()
	require.NoError(b, err)

	// Subscribe to events
	_, err = eventBus.Subscribe([]EventType{EventTypeCacheSet}, func(ctx context.Context, event *Event) error {
		return nil
	})
	require.NoError(b, err)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			event := NewEvent(EventTypeCacheSet, map[string]interface{}{
				"key":   "benchmark_key",
				"value": "benchmark_value",
			})
			err := eventBus.Publish(ctx, event)
			if err != nil {
				b.Errorf("Failed to publish event: %v", err)
			}
		}
	})
}
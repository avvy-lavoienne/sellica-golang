package eventbus

import (
	"context"
	"fmt"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestSynchronizationService_Integration tests end-to-end synchronization flow
func TestSynchronizationService_Integration(t *testing.T) {
	// Setup test environment
	eventBus := NewService(DefaultEventBusConfig())

	// Start the event bus
	ctx := context.Background()
	err := eventBus.Start(ctx)
	require.NoError(t, err)
	defer eventBus.Stop()

	config := DefaultSyncConfig()
	config.WorkerCount = 2
	config.MaxConcurrentSyncs = 5

	service, err := NewSynchronizationService(eventBus, config)
	require.NoError(t, err)

	// Start the service
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test data change event handling
	testEvent := NewEvent(EventTypeDataUpdated, map[string]interface{}{
		"entity_type": "user",
		"entity_id":   "user123",
		"changes": map[string]interface{}{
			"name": "John Doe",
			"email": "john@example.com",
		},
		"timestamp": time.Now(),
	})

	// Publish test event
	err = eventBus.Publish(ctx, testEvent)
	require.NoError(t, err)

	// Wait for processing and completion (increased due to additional ConflictCheckStep)
	time.Sleep(800 * time.Millisecond)

	// Verify service is still running
	assert.True(t, atomic.LoadInt32(&service.isRunning) == 1)

	// Check metrics
	metrics := service.GetSyncMetrics()
	assert.GreaterOrEqual(t, metrics.CompletedProcesses, int64(1))
	assert.Equal(t, int64(0), metrics.FailedProcesses)
}

// TestSynchronizationService_ConflictResolution tests conflict detection and resolution
func TestSynchronizationService_ConflictResolution(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())

	// Start the event bus
	ctx2 := context.Background()
	err := eventBus.Start(ctx2)
	require.NoError(t, err)
	defer eventBus.Stop()

	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Create conflicting data events
	event1 := NewEvent(EventTypeDataUpdated, map[string]interface{}{
		"entity_type": "product",
		"entity_id":   "prod456",
		"changes": map[string]interface{}{
			"price": 100.0,
		},
		"source": "web_app",
		"timestamp": time.Now(),
	})

	event2 := NewEvent(EventTypeDataUpdated, map[string]interface{}{
		"entity_type": "product",
		"entity_id":   "prod456",
		"changes": map[string]interface{}{
			"price": 120.0,
		},
		"source": "mobile_app",
		"timestamp": time.Now().Add(1 * time.Second),
	})

	// Publish conflicting events
	err = eventBus.Publish(ctx, event1)
	require.NoError(t, err)

	err = eventBus.Publish(ctx, event2)
	require.NoError(t, err)

	// Wait for processing and completion
	time.Sleep(1200 * time.Millisecond)

	// Verify conflict was detected and handled
	metrics := service.GetSyncMetrics()
	assert.GreaterOrEqual(t, metrics.TotalConflicts, int64(1))
	assert.GreaterOrEqual(t, metrics.ResolvedConflicts, int64(1))
}

// TestSynchronizationService_LoadTest tests performance under load
func TestSynchronizationService_LoadTest(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	defer eventBus.Stop()

	config := DefaultSyncConfig()
	config.WorkerCount = 4
	config.MaxConcurrentSyncs = 10

	service, err := NewSynchronizationService(eventBus, config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Generate load - publish multiple events concurrently
	const numEvents = 100
	const numGoroutines = 5

	start := time.Now()
	eventCount := int64(0)

	// Start goroutines to publish events
	for i := 0; i < numGoroutines; i++ {
		go func(goroutineID int) {
			for j := 0; j < numEvents/numGoroutines; j++ {
				event := NewEvent(EventTypeDataUpdated, map[string]interface{}{
					"entity_type": "user",
					"entity_id":   fmt.Sprintf("user%d_%d", goroutineID, j),
					"changes": map[string]interface{}{
						"status": "active",
					},
					"timestamp": time.Now(),
				})

				err := eventBus.Publish(ctx, event)
				if err == nil {
					atomic.AddInt64(&eventCount, 1)
				}
			}
		}(i)
	}

	// Wait for all events to be processed
	time.Sleep(2 * time.Second)

	// Verify performance
	elapsed := time.Since(start)
	eventsPerSecond := float64(atomic.LoadInt64(&eventCount)) / elapsed.Seconds()

	t.Logf("Processed %d events in %.2fs (%.2f events/sec)",
		atomic.LoadInt64(&eventCount), elapsed.Seconds(), eventsPerSecond)

	// Verify all events were processed
	metrics := service.GetSyncMetrics()
	assert.GreaterOrEqual(t, metrics.TotalProcesses, int64(80)) // At least 80% success rate
	assert.Less(t, elapsed, 5*time.Second) // Should complete within 5 seconds
}

// TestSynchronizationService_ErrorRecovery tests error handling and recovery
func TestSynchronizationService_ErrorRecovery(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	defer eventBus.Stop()

	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test with invalid event payload
	invalidEvent := NewEvent(EventTypeDataUpdated, "invalid_payload")

	err = eventBus.Publish(ctx, invalidEvent)
	require.NoError(t, err) // Publish should succeed

	// Wait for processing
	time.Sleep(100 * time.Millisecond)

	// Service should still be running despite error
	assert.True(t, atomic.LoadInt32(&service.isRunning) == 1)

	// Check that error was recorded
	metrics := service.GetSyncMetrics()
	assert.GreaterOrEqual(t, metrics.TotalProcesses, int64(1))
}

// TestSynchronizationService_ConsistencyChecks tests data consistency validation
func TestSynchronizationService_ConsistencyChecks(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	defer eventBus.Stop()

	config := DefaultSyncConfig()
	config.EnableConsistencyChecks = true
	config.ConsistencyCheckInterval = 100 * time.Millisecond

	service, err := NewSynchronizationService(eventBus, config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Publish some data events
	for i := 0; i < 5; i++ {
		event := NewEvent(EventTypeDataUpdated, map[string]interface{}{
			"entity_type": "user",
			"entity_id":   fmt.Sprintf("user%d", i),
			"changes": map[string]interface{}{
				"status": "active",
			},
			"timestamp": time.Now(),
		})

		err := eventBus.Publish(ctx, event)
		require.NoError(t, err)
	}

	// Wait for consistency checks to run
	time.Sleep(500 * time.Millisecond)

	// Verify consistency checks ran
	metrics := service.GetSyncMetrics()
	assert.GreaterOrEqual(t, metrics.TotalProcesses, int64(1))
	assert.GreaterOrEqual(t, metrics.CompletedProcesses, int64(5))
}

// TestMLConflictResolver_ResolveConflict tests ML-based conflict resolution
func TestMLConflictResolver_ResolveConflict(t *testing.T) {
	// Create ML conflict resolver
	resolver := NewMLConflictResolver(nil, &MLResolverConfig{
		MLConfidenceThreshold: 0.7,
		AutoApplyThreshold:    0.85,
	})

	// Create test conflict
	conflict := &DataConflict{
		ID: "test-conflict-1",
		Type: WriteWriteConflict,
		Severity: SeverityMedium,
		ConflictingValues: []ConflictingValue{
			{Value: "value1", Timestamp: time.Now().Add(-2 * time.Minute), Source: "source1"},
			{Value: "value2", Timestamp: time.Now().Add(-1 * time.Minute), Source: "source2"},
		},
		DetectedAt: time.Now(),
		Metadata: map[string]interface{}{
			"conflict_type": "write_write",
		},
	}

	ctx := context.Background()
	resolution, err := resolver.ResolveConflict(ctx, conflict)

	// Verify resolution
	assert.NoError(t, err)
	assert.NotNil(t, resolution)
	assert.Equal(t, conflict.ID, resolution.ConflictID)
	assert.Greater(t, resolution.Confidence, 0.0)
	assert.NotEmpty(t, resolution.Strategy)
	assert.False(t, resolution.AutoApplied) // Should not auto-apply due to low confidence

	// Check metrics
	metrics := resolver.GetMetrics()
	assert.Equal(t, int64(1), metrics.TotalPredictions)
	assert.Equal(t, int64(1), metrics.SuccessfulPredictions)
}

// TestMLConflictResolver_FallbackResolution tests fallback resolution
func TestMLConflictResolver_FallbackResolution(t *testing.T) {
	resolver := NewMLConflictResolver(nil, &MLResolverConfig{
		FallbackStrategy: "last_write_wins",
	})

	conflict := &DataConflict{
		ID: "test-conflict-2",
		Type: WriteWriteConflict,
		Severity: SeverityHigh,
		ConflictingValues: []ConflictingValue{
			{Value: "old_value", Timestamp: time.Now().Add(-5 * time.Minute), Source: "source1"},
			{Value: "new_value", Timestamp: time.Now().Add(-1 * time.Minute), Source: "source2"},
		},
		DetectedAt: time.Now(),
	}

	ctx := context.Background()
	resolution, err := resolver.ResolveConflict(ctx, conflict)

	assert.NoError(t, err)
	assert.NotNil(t, resolution)
	assert.Equal(t, "last_write_wins", resolution.Strategy)
	assert.Equal(t, "new_value", resolution.ResolvedValue)
	assert.Equal(t, 0.5, resolution.Confidence)
	assert.False(t, resolution.AutoApplied)
}

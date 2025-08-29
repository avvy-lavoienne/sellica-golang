package eventbus

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestSynchronizationService_NewSynchronizationService tests the creation of a new sync service
func TestSynchronizationService_NewSynchronizationService(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	config := DefaultSyncConfig()

	service, err := NewSynchronizationService(eventBus, config)

	assert.NoError(t, err)
	assert.NotNil(t, service)
	assert.NotNil(t, service.config)
	assert.NotNil(t, service.eventBus)
	assert.NotNil(t, service.syncRuleEngine)
	assert.NotNil(t, service.consistencyChecker)
	assert.NotNil(t, service.activeSyncs)
	assert.NotNil(t, service.syncWorkers)
	assert.Len(t, service.syncWorkers, config.WorkerCount)
}

// TestSynchronizationService_StartStop tests starting and stopping the service
func TestSynchronizationService_StartStop(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	// Initially not running
	assert.False(t, atomic.LoadInt32(&service.isRunning) == 1)

	// Start the service
	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	assert.True(t, atomic.LoadInt32(&service.isRunning) == 1)

	// Stop the service
	err = service.Stop()
	require.NoError(t, err)
	assert.False(t, atomic.LoadInt32(&service.isRunning) == 1)
}

// TestSynchronizationService_HandleSyncEvent tests event handling
func TestSynchronizationService_HandleSyncEvent(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Create a test event
	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id": "test_user",
	})

	// Handle the event
	err = service.handleSyncEvent(ctx, event)
	assert.NoError(t, err)

	// Verify sync process was created
	activeSyncs := service.GetActiveSyncs()
	assert.NotEmpty(t, activeSyncs)
}

// TestSynchronizationService_SyncProcessLifecycle tests sync process lifecycle
func TestSynchronizationService_SyncProcessLifecycle(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Create a sync process
	strategy := &SyncStrategy{
		ID:          "test_strategy",
		Name:        "Test Strategy",
		Type:        ImmediateSync,
		Description: "Test sync strategy",
		Priority:    PriorityNormal,
		Timeout:     30 * time.Second,
		Steps: []StrategyStep{
			{ID: "step1", Name: "Step 1", Type: int(ValidateStep), Priority: 1},
		},
	}

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id": "test_user",
	})

	process := service.createSyncProcess(event, strategy)
	assert.NotNil(t, process)
	assert.Equal(t, SyncPending, process.Status)
	assert.Equal(t, UserDataSync, process.Type)

	// Register the process
	service.registerSyncProcess(process)
	activeSyncs := service.GetActiveSyncs()
	assert.Contains(t, activeSyncs, process.ID)

	// Unregister the process
	service.unregisterSyncProcess(process.ID)
	activeSyncs = service.GetActiveSyncs()
	assert.NotContains(t, activeSyncs, process.ID)
}

// TestSynchronizationService_WorkerPool tests the worker pool functionality
func TestSynchronizationService_WorkerPool(t *testing.T) {
	config := DefaultSyncConfig()
	config.WorkerCount = 2
	config.MaxConcurrentSyncs = 5

	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, config)
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Verify workers are created
	assert.Len(t, service.syncWorkers, 2)

	// Test queueing processes
	strategy := &SyncStrategy{
		ID:          "test_strategy",
		Name:        "Test Strategy",
		Type:        ImmediateSync,
		Description: "Test sync strategy",
		Priority:    PriorityNormal,
		Timeout:     30 * time.Second,
		Steps:       []StrategyStep{},
	}

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id": "test_user",
	})

	process := service.createSyncProcess(event, strategy)

	// Queue the process
	err = service.queueSyncProcess(process)
	assert.NoError(t, err)
}

// TestSynchronizationService_Metrics tests metrics collection
func TestSynchronizationService_Metrics(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Get initial metrics
	metrics := service.GetSyncMetrics()
	assert.NotNil(t, metrics)

	// Create and register a sync process
	strategy := &SyncStrategy{
		ID:          "test_strategy",
		Name:        "Test Strategy",
		Type:        ImmediateSync,
		Description: "Test sync strategy",
		Priority:    PriorityNormal,
		Timeout:     30 * time.Second,
		Steps:       []StrategyStep{},
	}

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id": "test_user",
	})

	process := service.createSyncProcess(event, strategy)
	service.registerSyncProcess(process)

	// Get updated metrics
	updatedMetrics := service.GetSyncMetrics()
	assert.Equal(t, int64(1), updatedMetrics.ActiveProcesses)
}

// TestSynchronizationService_Concurrency tests concurrent operations
func TestSynchronizationService_Concurrency(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test concurrent event handling
	var wg sync.WaitGroup
	numGoroutines := 10
	eventsHandled := int64(0)

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
				"user_id": "test_user",
			})

			err := service.handleSyncEvent(ctx, event)
			if err == nil {
				atomic.AddInt64(&eventsHandled, 1)
			}
		}()
	}

	wg.Wait()

	// Verify events were handled
	assert.True(t, atomic.LoadInt64(&eventsHandled) > 0)

	// Verify sync processes were created
	activeSyncs := service.GetActiveSyncs()
	assert.True(t, len(activeSyncs) > 0)
}

// TestSynchronizationService_ErrorHandling tests error handling
func TestSynchronizationService_ErrorHandling(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test with nil event
	err = service.handleSyncEvent(ctx, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to determine sync strategy")

	// Test with invalid event
	invalidEvent := &Event{} // Empty event
	err = service.handleSyncEvent(ctx, invalidEvent)
	assert.Error(t, err)
}

// TestSynchronizationService_Cleanup tests cleanup functionality
func TestSynchronizationService_Cleanup(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Create and register multiple sync processes
	strategy := &SyncStrategy{
		ID:          "test_strategy",
		Name:        "Test Strategy",
		Type:        ImmediateSync,
		Description: "Test sync strategy",
		Priority:    PriorityNormal,
		Timeout:     30 * time.Second,
		Steps:       []StrategyStep{},
	}

	for i := 0; i < 5; i++ {
		event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
			"user_id": "test_user",
		})

		process := service.createSyncProcess(event, strategy)
		service.registerSyncProcess(process)
	}

	// Verify processes are registered
	activeSyncs := service.GetActiveSyncs()
	assert.Len(t, activeSyncs, 5)

	// Manually trigger cleanup (simulate the cleanup routine)
	service.cleanupCompletedSyncs()

	// Processes should still be there since they're not completed
	activeSyncs = service.GetActiveSyncs()
	assert.Len(t, activeSyncs, 5)
}

// TestSyncWorker_StartStop tests sync worker lifecycle
func TestSyncWorker_StartStop(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Get a worker
	worker := service.syncWorkers[0]
	assert.NotNil(t, worker)

	// Worker should be running
	assert.True(t, worker.isRunning)

	// Stop the service (which stops workers)
	err = service.Stop()
	require.NoError(t, err)

	// Worker should no longer be running
	assert.False(t, worker.isRunning)
}

// TestSyncWorker_ProcessExecution tests sync process execution
func TestSyncWorker_ProcessExecution(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Create a simple sync process
	strategy := &SyncStrategy{
		ID:          "test_strategy",
		Name:        "Test Strategy",
		Type:        ImmediateSync,
		Description: "Test sync strategy",
		Priority:    PriorityNormal,
		Timeout:     30 * time.Second,
		Steps: []StrategyStep{
			{ID: "validate", Name: "Validate", Type: int(ValidateStep), Priority: 1},
			{ID: "apply", Name: "Apply", Type: int(ApplyStep), Priority: 2},
		},
	}

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id": "test_user",
	})

	process := service.createSyncProcess(event, strategy)

	// Get a worker and manually process the sync
	worker := service.syncWorkers[0]
	worker.processSyncProcess(process)

	// Verify process was processed
	assert.True(t, process.Status == SyncCompleted || process.Status == SyncFailed)
	assert.True(t, process.CompletedSteps >= 0)
}

// BenchmarkSynchronizationService_HandleSyncEvent benchmarks event handling
func BenchmarkSynchronizationService_HandleSyncEvent(b *testing.B) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(b, err)

	ctx := context.Background()
	err = service.Start(ctx)
	require.NoError(b, err)
	defer service.Stop()

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id": "test_user",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			err := service.handleSyncEvent(ctx, event)
			if err != nil {
				b.Errorf("Failed to handle sync event: %v", err)
			}
		}
	})
}

// BenchmarkSynchronizationService_ProcessCreation benchmarks sync process creation
func BenchmarkSynchronizationService_ProcessCreation(b *testing.B) {
	eventBus := NewService(DefaultEventBusConfig())
	service, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	require.NoError(b, err)

	strategy := &SyncStrategy{
		ID:          "test_strategy",
		Name:        "Test Strategy",
		Type:        ImmediateSync,
		Description: "Test sync strategy",
		Priority:    PriorityNormal,
		Timeout:     30 * time.Second,
		Steps: []StrategyStep{
			{ID: "step1", Name: "Step 1", Type: int(ValidateStep), Priority: 1},
		},
	}

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id": "test_user",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		process := service.createSyncProcess(event, strategy)
		if process == nil {
			b.Errorf("Failed to create sync process")
		}
	}
}
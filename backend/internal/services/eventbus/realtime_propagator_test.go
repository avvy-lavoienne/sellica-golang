package eventbus

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewRealTimePropagator(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())

	require.NoError(t, err)
	assert.NotNil(t, propagator)
	assert.NotNil(t, propagator.eventBus)
	assert.NotNil(t, propagator.propagationRules)
	assert.NotNil(t, propagator.priorityQueues)
	assert.Equal(t, 3, len(propagator.priorityQueues)) // High, Normal, Low
}

func TestRealTimePropagator_StartStop(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())
	require.NoError(t, err)

	// Start propagator
	ctx := context.Background()
	err = propagator.Start(ctx)
	assert.NoError(t, err)
	assert.True(t, propagator.IsRunning())

	// Stop propagator
	err = propagator.Stop()
	assert.NoError(t, err)
	assert.False(t, propagator.IsRunning())
}

func TestRealTimePropagator_PropagateEvent(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = propagator.Start(ctx)
	require.NoError(t, err)
	defer propagator.Stop()

	// Create test event
	event := NewEvent(EventTypeDataUpdated, map[string]interface{}{
		"data_type": "user_profile",
		"user_id":   "test_user",
	})

	// Propagate event
	err = propagator.PropagateEvent(ctx, event)
	assert.NoError(t, err)

	// Wait for processing
	time.Sleep(100 * time.Millisecond)

	// Check metrics
	metrics := propagator.GetMetrics()
	assert.GreaterOrEqual(t, metrics.TasksQueued, int64(1))
}

func TestPropagationRulesEngine_DetermineTargets(t *testing.T) {
	rulesEngine := &PropagationRulesEngine{
		rules:   make(map[EventType][]PropagationRule),
		targets: make(map[string]*ServiceTarget),
	}

	// Add test rule
	rule := PropagationRule{
		ID:        "test_rule",
		EventType: EventTypeDataUpdated,
		Conditions: []PropagationCondition{
			{Field: "data_type", Operator: "equals", Value: "user_profile", Weight: 1.0},
		},
		Targets:  []string{"cache_service", "analytics_service"},
		Priority: PriorityHigh,
		Enabled:  true,
	}
	rulesEngine.AddRule(rule)

	// Add test targets
	rulesEngine.AddTarget(&ServiceTarget{
		Name:      "cache_service",
		Enabled:   true,
		IsHealthy: true,
	})
	rulesEngine.AddTarget(&ServiceTarget{
		Name:      "analytics_service",
		Enabled:   true,
		IsHealthy: true,
	})

	// Test event
	event := NewEvent(EventTypeDataUpdated, map[string]interface{}{
		"data_type": "user_profile",
	})

	// Determine targets
	targets, priority, err := rulesEngine.DetermineTargets(event)
	assert.NoError(t, err)
	assert.Equal(t, PriorityHigh, priority)
	assert.Contains(t, targets, "cache_service")
	assert.Contains(t, targets, "analytics_service")
}

func TestPriorityQueue_EnqueueDequeue(t *testing.T) {
	queue := NewPriorityQueue(10, PriorityNormal)
	defer queue.Close()

	task := &PropagationTask{
		ID:       "test_task",
		Priority: PriorityNormal,
		Status:   TaskPending,
	}

	// Enqueue task
	err := queue.Enqueue(task)
	assert.NoError(t, err)

	// Check queue length
	assert.Equal(t, 1, queue.Len())
}

func TestCircuitBreaker_States(t *testing.T) {
	config := &CircuitBreakerConfig{
		FailureThreshold: 3,
		RecoveryTimeout:  1 * time.Second,
		SuccessThreshold: 2,
	}

	cb := NewCircuitBreaker("test_circuit", config)

	// Initially closed
	assert.Equal(t, CircuitClosed, cb.GetState())

	// Record failures
	for i := 0; i < 3; i++ {
		cb.RecordFailure()
	}

	// Should be open
	assert.Equal(t, CircuitOpen, cb.GetState())

	// Wait for recovery timeout
	time.Sleep(1100 * time.Millisecond)

	// Record successes
	for i := 0; i < 2; i++ {
		cb.RecordSuccess()
	}

	// Should be closed
	assert.Equal(t, CircuitClosed, cb.GetState())
}

func TestPropagationWorker_ProcessTask(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())
	require.NoError(t, err)

	queue := NewPriorityQueue(10, PriorityNormal)
	worker := &PropagationWorker{
		ID:         0,
		propagator: propagator,
		queue:      queue,
		stopChan:   make(chan struct{}),
	}

	task := &PropagationTask{
		ID:       "test_task",
		Event:    NewEvent(EventTypeDataUpdated, nil),
		Targets:  []string{"test_target"},
		Priority: PriorityNormal,
		Status:   TaskPending,
	}

	// Add test target
	propagator.propagationRules.AddTarget(&ServiceTarget{
		Name:      "test_target",
		Enabled:   true,
		IsHealthy: true,
		Timeout:   1 * time.Second,
	})

	// Process task
	worker.processTask(task)

	// Check task status
	assert.Equal(t, TaskCompleted, task.Status)
}

func TestRealTimePropagator_Metrics(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())
	require.NoError(t, err)

	// Get initial metrics
	metrics := propagator.GetMetrics()

	// Check initial state (avoid copying mutex by checking individual fields)
	assert.Equal(t, int64(0), metrics.TasksQueued)
	assert.Equal(t, int64(0), metrics.TasksProcessed)
	assert.Equal(t, int64(0), metrics.TasksFailed)
	assert.Equal(t, int32(0), metrics.ActiveWorkers)
	assert.Equal(t, int64(0), metrics.QueueDepth)
}

func TestRealTimePropagator_AddPropagationRule(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())
	require.NoError(t, err)

	rule := PropagationRule{
		ID:        "test_rule",
		EventType: EventTypeDataUpdated,
		Conditions: []PropagationCondition{
			{Field: "data_type", Operator: "equals", Value: "user_profile", Weight: 1.0},
		},
		Targets:  []string{"test_service"},
		Priority: PriorityHigh,
		Enabled:  true,
	}

	err = propagator.AddPropagationRule(rule)
	assert.NoError(t, err)
}

func TestRealTimePropagator_AddServiceTarget(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())
	require.NoError(t, err)

	target := &ServiceTarget{
		Name:      "test_service",
		Endpoint:  "http://localhost:8080",
		Enabled:   true,
		IsHealthy: true,
		Timeout:   5 * time.Second,
	}

	err = propagator.AddServiceTarget(target)
	assert.NoError(t, err)
}

func TestRealTimePropagator_ConcurrentOperations(t *testing.T) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())
	require.NoError(t, err)

	ctx := context.Background()
	err = propagator.Start(ctx)
	require.NoError(t, err)
	defer propagator.Stop()

	// Test concurrent event propagation
	var wg sync.WaitGroup
	numGoroutines := 10
	eventsPerGoroutine := 5

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < eventsPerGoroutine; j++ {
				event := NewEvent(EventTypeDataUpdated, map[string]interface{}{
					"data_type": "user_profile",
					"user_id":   "user_" + string(rune(id*eventsPerGoroutine+j)),
				})
				err := propagator.PropagateEvent(ctx, event)
				assert.NoError(t, err)
			}
		}(i)
	}

	wg.Wait()

	// Wait for processing
	time.Sleep(500 * time.Millisecond)

	// Check metrics
	metrics := propagator.GetMetrics()
	expectedTasks := int64(numGoroutines * eventsPerGoroutine)
	assert.GreaterOrEqual(t, metrics.TasksQueued, expectedTasks)
}

func TestDefaultPropagatorConfig(t *testing.T) {
	config := DefaultPropagatorConfig()

	assert.NotNil(t, config)
	assert.Equal(t, 10, config.WorkerCount)
	assert.Equal(t, 1000, config.MaxQueueSize)
	assert.True(t, config.CircuitBreakerEnabled)
	assert.Equal(t, 3, config.FailureThreshold)
	assert.Equal(t, 60*time.Second, config.RecoveryTimeout)
	assert.Equal(t, 2, config.SuccessThreshold)
	assert.Equal(t, 200, config.HighPriorityQueueSize)
	assert.Equal(t, 500, config.NormalPriorityQueueSize)
	assert.Equal(t, 300, config.LowPriorityQueueSize)
	assert.Equal(t, 30*time.Second, config.ProcessingTimeout)
	assert.Equal(t, 3, config.RetryAttempts)
	assert.Equal(t, 2.0, config.BackoffMultiplier)
	assert.True(t, config.EnableMetrics)
	assert.Equal(t, 30*time.Second, config.MetricsInterval)
}

func BenchmarkRealTimePropagator_PropagateEvent(b *testing.B) {
	eventBus := NewService(DefaultEventBusConfig())
	propagator, err := NewRealTimePropagator(eventBus, DefaultPropagatorConfig())
	require.NoError(b, err)

	ctx := context.Background()
	err = propagator.Start(ctx)
	require.NoError(b, err)
	defer propagator.Stop()

	event := NewEvent(EventTypeDataUpdated, map[string]interface{}{
		"data_type": "user_profile",
		"user_id":   "benchmark_user",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		err := propagator.PropagateEvent(ctx, event)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkPriorityQueue_Enqueue(b *testing.B) {
	queue := NewPriorityQueue(1000, PriorityNormal)
	defer queue.Close()

	task := &PropagationTask{
		ID:       "benchmark_task",
		Priority: PriorityNormal,
		Status:   TaskPending,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		err := queue.Enqueue(task)
		if err != nil {
			b.Fatal(err)
		}
	}
}
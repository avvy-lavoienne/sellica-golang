package eventbus

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"
	"unsafe"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestService_NewService tests the creation of a new event bus service
func TestService_NewService(t *testing.T) {
	config := DefaultEventBusConfig()
	service := NewService(config)

	assert.NotNil(t, service)
	assert.NotNil(t, service.config)
	assert.NotNil(t, service.subscribers)
	assert.NotNil(t, service.subscriberMap)
	assert.NotNil(t, service.eventChan)
	assert.NotNil(t, service.stopChan)
	assert.NotNil(t, service.metrics)
	assert.NotNil(t, service.publisher)
	assert.NotNil(t, service.processor)
}

// TestService_StartStop tests starting and stopping the service
func TestService_StartStop(t *testing.T) {
	service := NewService(DefaultEventBusConfig())

	// Initially not running
	assert.False(t, service.IsRunning())

	// Start the service
	ctx := context.Background()
	err := service.Start(ctx)
	require.NoError(t, err)
	assert.True(t, service.IsRunning())

	// Stop the service
	err = service.Stop()
	require.NoError(t, err)
	assert.False(t, service.IsRunning())
}

// TestService_PublishSync tests synchronous event publishing
func TestService_PublishSync(t *testing.T) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test publishing nil event
	err = service.Publish(ctx, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "event cannot be nil")

	// Test publishing valid event with no subscribers
	event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
	err = service.Publish(ctx, event)
	assert.NoError(t, err) // Should succeed even with no subscribers
}

// TestService_Subscribe tests event subscription
func TestService_Subscribe(t *testing.T) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Test subscribing with nil handler
	_, err = service.Subscribe([]EventType{EventTypeCacheSet}, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "handler cannot be nil")

	// Test subscribing with empty topics
	_, err = service.Subscribe([]EventType{}, func(ctx context.Context, event *Event) error { return nil })
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "at least one topic must be specified")

	// Test successful subscription
	var receivedEvent *Event
	var eventReceived int64

	subscriberID, err := service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error {
			atomic.StorePointer((*unsafe.Pointer)(unsafe.Pointer(&receivedEvent)), unsafe.Pointer(event))
			atomic.AddInt64(&eventReceived, 1)
			return nil
		},
	)
	require.NoError(t, err)
	assert.NotEmpty(t, subscriberID)

	// Publish event
	event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
	err = service.Publish(ctx, event)
	require.NoError(t, err)

	// Wait for event processing
	time.Sleep(10 * time.Millisecond)

	// Verify event was received
	assert.Equal(t, int64(1), atomic.LoadInt64(&eventReceived))
	assert.NotNil(t, receivedEvent)
	assert.Equal(t, event.ID, receivedEvent.ID)
}

// TestService_PublishAsync tests asynchronous event publishing
func TestService_PublishAsync(t *testing.T) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Subscribe to events
	var receivedEvent *Event
	var eventReceived int64

	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error {
			atomic.StorePointer((*unsafe.Pointer)(unsafe.Pointer(&receivedEvent)), unsafe.Pointer(event))
			atomic.AddInt64(&eventReceived, 1)
			return nil
		},
	)
	require.NoError(t, err)

	// Publish event asynchronously
	event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
	err = service.PublishAsync(ctx, event)
	require.NoError(t, err)

	// Wait for async processing
	time.Sleep(50 * time.Millisecond)

	// Verify event was received
	assert.Equal(t, int64(1), atomic.LoadInt64(&eventReceived))
	assert.NotNil(t, receivedEvent)
}

// TestService_Unsubscribe tests event unsubscription
func TestService_Unsubscribe(t *testing.T) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Subscribe
	subscriberID, err := service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error { return nil },
	)
	require.NoError(t, err)

	// Verify subscriber exists
	subscribers := service.GetSubscribers(EventTypeCacheSet)
	assert.Len(t, subscribers, 1)

	// Unsubscribe
	err = service.Unsubscribe(subscriberID)
	require.NoError(t, err)

	// Verify subscriber is removed
	subscribers = service.GetSubscribers(EventTypeCacheSet)
	assert.Len(t, subscribers, 0)

	// Test unsubscribing non-existent subscriber
	err = service.Unsubscribe("non-existent")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "subscriber not found")
}

// TestService_MultipleSubscribers tests multiple subscribers for the same event
func TestService_MultipleSubscribers(t *testing.T) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	var counter1, counter2 int64

	// Subscribe first handler
	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error {
			atomic.AddInt64(&counter1, 1)
			return nil
		},
	)
	require.NoError(t, err)

	// Subscribe second handler
	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error {
			atomic.AddInt64(&counter2, 1)
			return nil
		},
	)
	require.NoError(t, err)

	// Publish event
	event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
	err = service.Publish(ctx, event)
	require.NoError(t, err)

	// Wait for processing
	time.Sleep(10 * time.Millisecond)

	// Verify both handlers were called
	assert.Equal(t, int64(1), atomic.LoadInt64(&counter1))
	assert.Equal(t, int64(1), atomic.LoadInt64(&counter2))
}

// TestService_ErrorHandling tests error handling in event processing
func TestService_ErrorHandling(t *testing.T) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	var successCount, errorCount int64

	// Subscribe handler that succeeds
	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error {
			atomic.AddInt64(&successCount, 1)
			return nil
		},
	)
	require.NoError(t, err)

	// Subscribe handler that fails
	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error {
			atomic.AddInt64(&errorCount, 1)
			return assert.AnError // Simulate error
		},
	)
	require.NoError(t, err)

	// Publish event
	event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
	err = service.Publish(ctx, event)

	// Should return error from failed handler
	assert.Error(t, err)
	assert.Equal(t, int64(1), atomic.LoadInt64(&successCount))
	assert.Equal(t, int64(1), atomic.LoadInt64(&errorCount))
}

// TestService_Metrics tests metrics collection
func TestService_Metrics(t *testing.T) {
	config := DefaultEventBusConfig()
	config.EnableMetrics = true
	config.MetricsInterval = 10 * time.Millisecond

	service := NewService(config)
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	// Subscribe to events
	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error { return nil },
	)
	require.NoError(t, err)

	// Publish some events
	for i := 0; i < 3; i++ {
		event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
		err = service.Publish(ctx, event)
		require.NoError(t, err)
	}

	// Wait for metrics collection
	time.Sleep(50 * time.Millisecond)

	// Check metrics
	metrics := service.GetMetrics()
	assert.Equal(t, int64(3), metrics.EventsPublished)
	assert.Equal(t, int64(3), metrics.EventsProcessed)
	assert.Equal(t, int64(0), metrics.EventsFailed)
	assert.Equal(t, int64(1), metrics.ActiveSubscribers)
	assert.True(t, metrics.AverageProcessingTime > 0)
}

// TestService_Concurrency tests concurrent operations
func TestService_Concurrency(t *testing.T) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	var counter int64
	var wg sync.WaitGroup

	// Subscribe to events
	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error {
			atomic.AddInt64(&counter, 1)
			return nil
		},
	)
	require.NoError(t, err)

	// Start multiple goroutines publishing events
	numGoroutines := 10
	eventsPerGoroutine := 100

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < eventsPerGoroutine; j++ {
				event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
				err := service.Publish(ctx, event)
				if err != nil {
					t.Errorf("Failed to publish event: %v", err)
				}
			}
		}()
	}

	wg.Wait()

	// Verify all events were processed
	expectedTotal := int64(numGoroutines * eventsPerGoroutine)
	assert.Equal(t, expectedTotal, atomic.LoadInt64(&counter))

	metrics := service.GetMetrics()
	assert.Equal(t, expectedTotal, metrics.EventsPublished)
	assert.Equal(t, expectedTotal, metrics.EventsProcessed)
}

// TestService_EventExpiration tests event expiration
func TestService_EventExpiration(t *testing.T) {
	config := DefaultEventBusConfig()
	config.EventTTL = 10 * time.Millisecond
	NewService(config) // Create service to test config usage

	event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})

	// Initially not expired
	assert.False(t, event.IsExpired())

	// Wait for expiration
	time.Sleep(20 * time.Millisecond)
	assert.True(t, event.IsExpired())
}

// TestService_PriorityHandling tests event priority handling
func TestService_PriorityHandling(t *testing.T) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(t, err)
	defer service.Stop()

	var processedEvents []*Event
	var mu sync.Mutex

	// Subscribe with different priorities
	_, err = service.SubscribeWithPriority(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error {
			mu.Lock()
			processedEvents = append(processedEvents, event)
			mu.Unlock()
			return nil
		},
		PriorityNormal,
	)
	require.NoError(t, err)

	// Publish events with different priorities
	event1 := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test1"}).
		WithPriority(PriorityHigh)
	event2 := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test2"}).
		WithPriority(PriorityLow)

	err = service.Publish(ctx, event1)
	require.NoError(t, err)
	err = service.Publish(ctx, event2)
	require.NoError(t, err)

	// Wait for processing
	time.Sleep(10 * time.Millisecond)

	// Verify events were processed
	mu.Lock()
	assert.Len(t, processedEvents, 2)
	mu.Unlock()
}

// BenchmarkService_Publish benchmarks event publishing performance
func BenchmarkService_Publish(b *testing.B) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(b, err)
	defer service.Stop()

	// Subscribe to events
	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error { return nil },
	)
	require.NoError(b, err)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
			err := service.Publish(ctx, event)
			if err != nil {
				b.Errorf("Failed to publish event: %v", err)
			}
		}
	})
}

// BenchmarkService_PublishAsync benchmarks async event publishing performance
func BenchmarkService_PublishAsync(b *testing.B) {
	service := NewService(DefaultEventBusConfig())
	ctx := context.Background()

	err := service.Start(ctx)
	require.NoError(b, err)
	defer service.Stop()

	// Subscribe to events
	_, err = service.Subscribe(
		[]EventType{EventTypeCacheSet},
		func(ctx context.Context, event *Event) error { return nil },
	)
	require.NoError(b, err)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			event := NewEvent(EventTypeCacheSet, map[string]interface{}{"key": "test"})
			err := service.PublishAsync(ctx, event)
			if err != nil {
				b.Errorf("Failed to publish async event: %v", err)
			}
		}
	})
}
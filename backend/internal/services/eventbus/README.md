# Event Bus Service

A thread-safe, asynchronous event bus service for SELLY AI that enables decoupled communication between services through publish-subscribe patterns.

## Features

- **Thread-Safe Operations**: Uses `sync.RWMutex` and atomic operations for concurrent access
- **Asynchronous Processing**: Non-blocking event publishing with configurable worker pools
- **Priority-Based Handling**: Support for event priorities (Low, Normal, High, Critical)
- **Event Filtering**: Built-in support for event filtering and middleware
- **Metrics & Monitoring**: Comprehensive metrics collection and health monitoring
- **Extensible Design**: Easy to add new event types and handlers

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Publisher     │───▶│   Event Bus      │───▶│   Subscribers   │
│                 │    │                  │    │                 │
│ • Publish()     │    │ • Event Queue    │    │ • Handlers      │
│ • PublishAsync()│    │ • Worker Pool    │    │ • Filters       │
└─────────────────┘    │ • Metrics        │    └─────────────────┘
                       └──────────────────┘
```

## Core Components

### Event Types
Predefined event types for common system operations:

- **Cache Events**: `EventTypeCacheHit`, `EventTypeCacheMiss`, `EventTypeCacheSet`, `EventTypeCacheDelete`
- **Monitoring Events**: `EventTypeMonitoringAlert`, `EventTypeMonitoringMetric`, `EventTypeMonitoringHealth`
- **Authentication Events**: `EventTypeAuthLogin`, `EventTypeAuthLogout`, `EventTypeAuthFailed`
- **Chat/AI Events**: `EventTypeChatMessage`, `EventTypeChatResponse`, `EventTypeAIRequest`
- **Data Events**: `EventTypeDataCreated`, `EventTypeDataUpdated`, `EventTypeDataDeleted`

### Event Structure
```go
type Event struct {
    ID        string
    Type      EventType
    Priority  Priority
    Timestamp time.Time
    Payload   interface{}
    Metadata  map[string]interface{}
    Source    string
    CorrelationID string
    TTL       time.Duration
}
```

## Usage Examples

### Basic Setup

```go
// 1. Create event bus service
config := DefaultEventBusConfig()
eventBus := NewService(config)

// 2. Start the service
ctx := context.Background()
if err := eventBus.Start(ctx); err != nil {
    log.Fatal(err)
}
defer eventBus.Stop()
```

### Publishing Events

```go
// Synchronous publishing
event := NewEvent(EventTypeCacheSet, map[string]interface{}{
    "key":   "user:123",
    "value": userData,
})
err := eventBus.Publish(ctx, event)

// Asynchronous publishing
err := eventBus.PublishAsync(ctx, event)
```

### Subscribing to Events

```go
// Subscribe to cache events
subscriberID, err := eventBus.Subscribe(
    []EventType{EventTypeCacheSet, EventTypeCacheDelete},
    func(ctx context.Context, event *Event) error {
        logrus.WithField("event_type", event.Type).Info("Cache event received")
        return nil
    },
)

// Subscribe with priority
subscriberID, err := eventBus.SubscribeWithPriority(
    []EventType{EventTypeMonitoringAlert},
    alertHandler,
    PriorityHigh,
)
```

### Integration with Existing Services

#### Cache Service Integration

```go
// Create cache integration
cacheIntegration := NewCacheEventIntegration(eventBus, cacheService)

// Setup handlers
err := cacheIntegration.SetupCacheEventHandlers()

// Emit cache events
err = cacheIntegration.EmitCacheSet(ctx, "user:123", userData, 10*time.Minute)
```

#### Monitoring Service Integration

```go
// Create monitoring integration
monitoringIntegration := NewMonitoringEventIntegration(eventBus, monitoringService)

// Setup handlers
err := monitoringIntegration.SetupMonitoringEventHandlers()

// Emit monitoring events
err = monitoringIntegration.EmitMonitoringAlert(ctx, "high_memory", "Memory usage above 80%", "warning")
```

## Configuration

```go
config := &EventBusConfig{
    Enabled:               true,
    BufferSize:            1000,          // Event queue size
    WorkerCount:           10,            // Number of processing workers
    ProcessingTimeout:     30 * time.Second,
    MaxConcurrentEvents:   100,
    EventTTL:              5 * time.Minute,
    RetryAttempts:         3,
    EnableMetrics:         true,
    MetricsInterval:       30 * time.Second,
    EnableAsyncProcessing: true,
}
```

## Integration with Main Application

### Updating main.go

```go
// In your main.go, add event bus initialization
func initializeServices(cfg *config.Config) (*Services, error) {
    // ... existing service initialization ...

    // Initialize event bus
    eventBusConfig := DefaultEventBusConfig()
    eventBus := eventbus.NewService(eventBusConfig)

    // Start event bus
    if err := eventBus.Start(ctx); err != nil {
        return nil, fmt.Errorf("failed to start event bus: %w", err)
    }

    // Create integrations
    cacheIntegration := eventbus.NewCacheEventIntegration(eventBus, cacheService)
    monitoringIntegration := eventbus.NewMonitoringEventIntegration(eventBus, monitoringService)

    // Setup event handlers
    if err := cacheIntegration.SetupCacheEventHandlers(); err != nil {
        logrus.WithError(err).Warn("Failed to setup cache event handlers")
    }

    if err := monitoringIntegration.SetupMonitoringEventHandlers(); err != nil {
        logrus.WithError(err).Warn("Failed to setup monitoring event handlers")
    }

    // Add to services struct
    services.EventBus = eventBus
    services.CacheIntegration = cacheIntegration
    services.MonitoringIntegration = monitoringIntegration

    return services, nil
}
```

### Updating Services Struct

```go
type Services struct {
    // ... existing services ...

    // Event Bus Services
    EventBus               *eventbus.Service
    CacheIntegration       *eventbus.CacheEventIntegration
    MonitoringIntegration  *eventbus.MonitoringEventIntegration
}
```

## Best Practices

### 1. Event Design
- Use descriptive event types with consistent naming
- Include relevant metadata for debugging and monitoring
- Set appropriate TTL values to prevent event accumulation
- Use correlation IDs for request tracing

### 2. Handler Implementation
- Keep handlers lightweight and fast
- Use context for timeout and cancellation
- Handle errors gracefully without panicking
- Log important events for debugging

### 3. Performance Considerations
- Use asynchronous publishing for high-throughput scenarios
- Configure appropriate buffer sizes based on load
- Monitor event processing metrics regularly
- Implement circuit breakers for external service calls

### 4. Error Handling
- Implement retry logic for transient failures
- Use dead letter queues for persistent failures
- Log errors with sufficient context
- Monitor error rates and alert on thresholds

## Monitoring & Metrics

The event bus provides comprehensive metrics:

```go
metrics := eventBus.GetMetrics()
fmt.Printf("Events Published: %d\n", metrics.EventsPublished)
fmt.Printf("Events Processed: %d\n", metrics.EventsProcessed)
fmt.Printf("Events Failed: %d\n", metrics.EventsFailed)
fmt.Printf("Active Subscribers: %d\n", metrics.ActiveSubscribers)
fmt.Printf("Avg Processing Time: %v\n", metrics.AverageProcessingTime)
```

## Dependencies

- Standard Go libraries only (no external dependencies)
- Compatible with existing SELLY AI service architecture
- Thread-safe for concurrent operations

## Future Extensions

- **Event Persistence**: Add database storage for event replay
- **Event Filtering**: Advanced filtering with rules engine
- **Event Routing**: Intelligent routing based on event content
- **Metrics Export**: Integration with Prometheus/DataDog
- **Distributed Events**: Multi-instance event coordination

## Troubleshooting

### Common Issues

1. **Event Channel Full**: Increase `BufferSize` in configuration
2. **Slow Event Processing**: Add more workers or optimize handlers
3. **Memory Leaks**: Check for event accumulation, adjust TTL
4. **Handler Timeouts**: Increase `ProcessingTimeout` or optimize handlers

### Debug Mode

Enable detailed logging:
```go
config.EnableLogging = true
```

This provides comprehensive logging for all event operations, useful for debugging and monitoring.
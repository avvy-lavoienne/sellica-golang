package eventbus

import (
	"context"
	"fmt"
	"os"
)

// EventBusMode represents different event bus implementations
type EventBusMode string

const (
	EventBusModeMemory EventBusMode = "memory"
	EventBusModeNATS   EventBusMode = "nats"
)

// UnifiedEventBus provides a unified interface for different event bus implementations
type UnifiedEventBus struct {
	mode EventBusMode
	impl EventBusInterface
}

// EventBusInterface defines the common interface for all event bus implementations
type EventBusInterface interface {
	Start(ctx context.Context) error
	Stop() error
	Publish(ctx context.Context, event *Event) error
	Subscribe(eventType EventType, handler EventHandler, priority Priority) (string, error)
	Unsubscribe(subscriberID string) error
	IsRunning() bool
	GetMetrics() EventMetrics
}

// NewUnifiedEventBus creates a new unified event bus based on configuration
func NewUnifiedEventBus(mode EventBusMode, config interface{}) (*UnifiedEventBus, error) {
	var impl EventBusInterface
	var err error

	switch mode {
	case EventBusModeMemory:
		if config == nil {
			config = DefaultEventBusConfig()
		}
		service := NewService(config.(*EventBusConfig))
		impl = NewServiceAdapter(service)
	case EventBusModeNATS:
		if config == nil {
			config = DefaultNATSEventBusConfig()
		}
		impl, err = NewNATSEventBus(config.(*NATSEventBusConfig))
		if err != nil {
			return nil, fmt.Errorf("failed to create NATS event bus: %w", err)
		}
	default:
		return nil, fmt.Errorf("unsupported event bus mode: %s", mode)
	}

	return &UnifiedEventBus{
		mode: mode,
		impl: impl,
	}, nil
}

// NewAutoEventBus creates an event bus automatically based on environment
func NewAutoEventBus() (*UnifiedEventBus, error) {
	// Check if NATS_URL is set in environment
	natsURL := os.Getenv("NATS_URL")
	if natsURL != "" {
		config := DefaultNATSEventBusConfig()
		config.URL = natsURL
		return NewUnifiedEventBus(EventBusModeNATS, config)
	}

	// Fall back to in-memory implementation
	return NewUnifiedEventBus(EventBusModeMemory, nil)
}

// Start starts the underlying event bus implementation
func (ueb *UnifiedEventBus) Start(ctx context.Context) error {
	return ueb.impl.Start(ctx)
}

// Stop stops the underlying event bus implementation
func (ueb *UnifiedEventBus) Stop() error {
	return ueb.impl.Stop()
}

// Publish publishes an event through the underlying implementation
func (ueb *UnifiedEventBus) Publish(ctx context.Context, event *Event) error {
	return ueb.impl.Publish(ctx, event)
}

// Subscribe subscribes to events through the underlying implementation
func (ueb *UnifiedEventBus) Subscribe(eventType EventType, handler EventHandler, priority Priority) (string, error) {
	return ueb.impl.Subscribe(eventType, handler, priority)
}

// Unsubscribe unsubscribes from events through the underlying implementation
func (ueb *UnifiedEventBus) Unsubscribe(subscriberID string) error {
	return ueb.impl.Unsubscribe(subscriberID)
}

// IsRunning returns whether the underlying event bus is running
func (ueb *UnifiedEventBus) IsRunning() bool {
	return ueb.impl.IsRunning()
}

// GetMetrics returns metrics from the underlying implementation
func (ueb *UnifiedEventBus) GetMetrics() EventMetrics {
	return ueb.impl.GetMetrics()
}

// GetMode returns the current event bus mode
func (ueb *UnifiedEventBus) GetMode() EventBusMode {
	return ueb.mode
}

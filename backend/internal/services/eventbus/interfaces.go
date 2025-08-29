package eventbus

import (
	"context"
	"encoding/json"
	"time"
)

// EventPublisher defines the interface for publishing events
type EventPublisher interface {
	// Publish sends an event to all subscribers synchronously
	Publish(ctx context.Context, event *Event) error

	// PublishAsync sends an event to all subscribers asynchronously
	PublishAsync(ctx context.Context, event *Event) error

	// PublishToTopic sends an event to subscribers of a specific topic
	PublishToTopic(ctx context.Context, topic EventType, event *Event) error
}

// EventSubscriber defines the interface for subscribing to events
type EventSubscriber interface {
	// Subscribe registers a handler for one or more event types
	Subscribe(topics []EventType, handler EventHandler) (subscriberID string, err error)

	// SubscribeWithOptions registers a handler with additional options
	SubscribeWithOptions(topics []EventType, handler EventHandler, options SubscribeOptions) (subscriberID string, err error)

	// Unsubscribe removes a subscription
	Unsubscribe(subscriberID string) error

	// GetSubscribers returns all subscribers for a topic
	GetSubscribers(topic EventType) []Subscriber
}

// SubscribeOptions defines options for event subscriptions
type SubscribeOptions struct {
	Priority    Priority     `json:"priority"`
	BufferSize  int         `json:"buffer_size"`
	Timeout     Duration    `json:"timeout"`
	Filters     []EventFilter `json:"filters"`
	Middleware  []Middleware `json:"middleware"`
}

// Duration is a wrapper for time.Duration to support JSON marshaling
type Duration struct {
	time.Duration
}

// MarshalJSON implements json.Marshaler
func (d Duration) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.String())
}

// UnmarshalJSON implements json.Unmarshaler
func (d *Duration) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	duration, err := time.ParseDuration(s)
	if err != nil {
		return err
	}
	d.Duration = duration
	return nil
}

// EventProcessor defines the interface for processing events
type EventProcessor interface {
	// ProcessEvent processes a single event
	ProcessEvent(ctx context.Context, event *Event, subscriber Subscriber) error

	// ProcessEvents processes multiple events concurrently
	ProcessEvents(ctx context.Context, events []*Event, subscriber Subscriber) []ProcessingResult

	// GetMetrics returns processing metrics
	GetMetrics() EventMetrics
}

// EventStorage defines the interface for event persistence (future extension)
type EventStorage interface {
	// Store persists an event for later processing or replay
	Store(ctx context.Context, event *Event) error

	// Retrieve retrieves events based on criteria
	Retrieve(ctx context.Context, filter EventFilter, limit int) ([]*Event, error)

	// Delete removes events older than the specified duration
	Delete(ctx context.Context, olderThan time.Duration) error
}

// EventBusConfig defines configuration for the event bus
type EventBusConfig struct {
	// Core settings
	Enabled               bool          `json:"enabled"`
	BufferSize            int           `json:"buffer_size"`
	WorkerCount           int           `json:"worker_count"`
	ProcessingTimeout     time.Duration `json:"processing_timeout"`

	// Performance settings
	MaxConcurrentEvents   int           `json:"max_concurrent_events"`
	EventTTL              time.Duration `json:"event_ttl"`
	RetryAttempts         int           `json:"retry_attempts"`
	RetryDelay            time.Duration `json:"retry_delay"`

	// Monitoring settings
	EnableMetrics         bool          `json:"enable_metrics"`
	MetricsInterval       time.Duration `json:"metrics_interval"`
	EnableLogging         bool          `json:"enable_logging"`

	// Advanced settings
	EnableAsyncProcessing bool          `json:"enable_async_processing"`
	EnableEventReplay     bool          `json:"enable_event_replay"`
	EnableDeadLetterQueue bool          `json:"enable_dead_letter_queue"`
}

// DefaultEventBusConfig returns a default configuration
func DefaultEventBusConfig() *EventBusConfig {
	return &EventBusConfig{
		Enabled:               true,
		BufferSize:            1000,
		WorkerCount:           10,
		ProcessingTimeout:     30 * time.Second,
		MaxConcurrentEvents:   100,
		EventTTL:              5 * time.Minute,
		RetryAttempts:         3,
		RetryDelay:            1 * time.Second,
		EnableMetrics:         true,
		MetricsInterval:       30 * time.Second,
		EnableLogging:         true,
		EnableAsyncProcessing: true,
		EnableEventReplay:     false,
		EnableDeadLetterQueue: false,
	}
}

// EventBusLifecycle defines lifecycle management for the event bus
type EventBusLifecycle interface {
	// Start initializes and starts the event bus
	Start(ctx context.Context) error

	// Stop gracefully shuts down the event bus
	Stop() error

	// IsRunning returns whether the event bus is running
	IsRunning() bool

	// Health returns the health status of the event bus
	Health() HealthStatus
}

// HealthStatus represents the health of the event bus
type HealthStatus struct {
	Status      string            `json:"status"`
	Message     string            `json:"message,omitempty"`
	Timestamp   time.Time         `json:"timestamp"`
	Metrics     EventMetrics      `json:"metrics"`
	Details     map[string]interface{} `json:"details,omitempty"`
}

// EventBusFactory creates event bus instances
type EventBusFactory interface {
	// CreateEventBus creates a new event bus with the given configuration
	CreateEventBus(config *EventBusConfig) (interface{}, error)

	// CreateSimpleEventBus creates a basic in-memory event bus
	CreateSimpleEventBus() (interface{}, error)
}
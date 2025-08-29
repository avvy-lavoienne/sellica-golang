package eventbus

import (
	"context"
	"time"
)

// EventType represents different types of events in the system
type EventType string

// Predefined event types for common system events
const (
	// Cache events
	EventTypeCacheHit      EventType = "cache.hit"
	EventTypeCacheMiss     EventType = "cache.miss"
	EventTypeCacheSet      EventType = "cache.set"
	EventTypeCacheDelete   EventType = "cache.delete"
	EventTypeCacheInvalidate EventType = "cache.invalidate"

	// Monitoring events
	EventTypeMonitoringAlert    EventType = "monitoring.alert"
	EventTypeMonitoringMetric   EventType = "monitoring.metric"
	EventTypeMonitoringHealth   EventType = "monitoring.health"

	// Authentication events
	EventTypeAuthLogin     EventType = "auth.login"
	EventTypeAuthLogout    EventType = "auth.logout"
	EventTypeAuthFailed    EventType = "auth.failed"

	// Chat/AI events
	EventTypeChatMessage   EventType = "chat.message"
	EventTypeChatResponse  EventType = "chat.response"
	EventTypeAIRequest     EventType = "ai.request"
	EventTypeAIResponse    EventType = "ai.response"

	// Data events
	EventTypeDataCreated   EventType = "data.created"
	EventTypeDataUpdated   EventType = "data.updated"
	EventTypeDataDeleted   EventType = "data.deleted"

	// System events
	EventTypeSystemError   EventType = "system.error"
	EventTypeSystemWarning EventType = "system.warning"
	EventTypeSystemInfo    EventType = "system.info"
)

// Priority represents the priority level of an event
type Priority int

const (
	PriorityLow Priority = iota
	PriorityNormal
	PriorityHigh
	PriorityCritical
)

// Event represents a system event that can be published to the event bus
type Event struct {
	// Core event information
	ID        string                 `json:"id"`
	Type      EventType             `json:"type"`
	Priority  Priority              `json:"priority"`
	Timestamp time.Time             `json:"timestamp"`

	// Event payload and metadata
	Payload   interface{}           `json:"payload,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`

	// Source and correlation information
	Source          string `json:"source,omitempty"`
	CorrelationID   string `json:"correlation_id,omitempty"`
	CausationID     string `json:"causation_id,omitempty"`

	// Processing control
	TTL       time.Duration `json:"ttl,omitempty"`
	Async     bool         `json:"async,omitempty"`
}

// EventHandler is a function that processes events
type EventHandler func(ctx context.Context, event *Event) error

// Subscriber represents an event subscriber
type Subscriber struct {
	ID       string
	Topics   []EventType
	Handler  EventHandler
	Priority Priority
	Active   bool
}

// Publisher interface for publishing events (implemented by Publisher struct)

// SubscriberManager interface for managing event subscriptions
type SubscriberManager interface {
	Subscribe(topics []EventType, handler EventHandler) (subscriberID string, err error)
	SubscribeWithPriority(topics []EventType, handler EventHandler, priority Priority) (subscriberID string, err error)
	Unsubscribe(subscriberID string) error
	GetSubscribers(topic EventType) []Subscriber
}

// EventBus combines publishing and subscription management
type EventBus interface {
	Publisher
	SubscriberManager
	Start(ctx context.Context) error
	Stop() error
	IsRunning() bool
}

// EventFilter allows filtering events before processing
type EventFilter func(event *Event) bool

// Middleware allows intercepting and modifying event processing
type Middleware func(next EventHandler) EventHandler

// ProcessingResult represents the result of event processing
type ProcessingResult struct {
	EventID     string        `json:"event_id"`
	SubscriberID string       `json:"subscriber_id"`
	Success     bool          `json:"success"`
	Error       string        `json:"error,omitempty"`
	Duration    time.Duration `json:"duration"`
	Timestamp   time.Time     `json:"timestamp"`
}

// EventMetrics tracks event bus performance
type EventMetrics struct {
	EventsPublished      int64         `json:"events_published"`
	EventsProcessed      int64         `json:"events_processed"`
	EventsFailed         int64         `json:"events_failed"`
	AverageProcessingTime time.Duration `json:"avg_processing_time"`
	ActiveSubscribers    int64         `json:"active_subscribers"`
}

// NewEvent creates a new event with default values
func NewEvent(eventType EventType, payload interface{}) *Event {
	return &Event{
		ID:        generateEventID(),
		Type:      eventType,
		Priority:  PriorityNormal,
		Timestamp: time.Now(),
		Payload:   payload,
		Metadata:  make(map[string]interface{}),
		Async:     true,
		TTL:       30 * time.Second,
	}
}

// WithMetadata adds metadata to an event
func (e *Event) WithMetadata(key string, value interface{}) *Event {
	if e.Metadata == nil {
		e.Metadata = make(map[string]interface{})
	}
	e.Metadata[key] = value
	return e
}

// WithSource sets the source of the event
func (e *Event) WithSource(source string) *Event {
	e.Source = source
	return e
}

// WithCorrelationID sets the correlation ID for tracing
func (e *Event) WithCorrelationID(id string) *Event {
	e.CorrelationID = id
	return e
}

// WithPriority sets the event priority
func (e *Event) WithPriority(priority Priority) *Event {
	e.Priority = priority
	return e
}

// WithTTL sets the time-to-live for the event
func (e *Event) WithTTL(ttl time.Duration) *Event {
	e.TTL = ttl
	return e
}

// IsExpired checks if the event has expired
func (e *Event) IsExpired() bool {
	if e.TTL <= 0 {
		return false
	}
	return time.Since(e.Timestamp) > e.TTL
}

// generateEventID generates a unique event ID
func generateEventID() string {
	return "evt_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(result)
}
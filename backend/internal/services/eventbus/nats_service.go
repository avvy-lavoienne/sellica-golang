package eventbus

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/sirupsen/logrus"
)

// NATSEventBus implements the EventBus interface using NATS/JetStream
type NATSEventBus struct {
	// Configuration
	config *NATSEventBusConfig

	// NATS components
	conn        *nats.Conn
	js          nats.JetStreamContext
	subscribers map[string]*nats.Subscription

	// State management
	isRunning int32 // atomic boolean
	stopChan  chan struct{}

	// Thread safety
	mu sync.RWMutex

	// Metrics and monitoring
	metrics *EventMetrics
}

// NATSEventBusConfig holds configuration for the NATS event bus
type NATSEventBusConfig struct {
	// Connection settings
	URL                string        `yaml:"url"`
	ClusterID          string        `yaml:"cluster_id"`
	ClientID           string        `yaml:"client_id"`
	MaxReconnects      int           `yaml:"max_reconnects"`
	ReconnectWait      time.Duration `yaml:"reconnect_wait"`
	ConnectionTimeout  time.Duration `yaml:"connection_timeout"`

	// JetStream configuration
	StreamName         string        `yaml:"stream_name"`
	StreamSubjects     []string      `yaml:"stream_subjects"`
	StreamRetention    string        `yaml:"stream_retention"`
	StreamMaxAge       time.Duration `yaml:"stream_max_age"`
	StreamMaxBytes     int64         `yaml:"stream_max_bytes"`

	// Processing settings
	EnableAsyncProcessing bool `yaml:"enable_async_processing"`
	EnableMetrics        bool `yaml:"enable_metrics"`
	WorkerCount          int  `yaml:"worker_count"`
}

// DefaultNATSEventBusConfig returns default NATS configuration
func DefaultNATSEventBusConfig() *NATSEventBusConfig {
	return &NATSEventBusConfig{
		URL:                   "nats://localhost:4222",
		ClusterID:             "selly-cluster",
		ClientID:              "selly-eventbus",
		MaxReconnects:         10,
		ReconnectWait:         2 * time.Second,
		ConnectionTimeout:     10 * time.Second,
		StreamName:            "SELLY_EVENTS",
		StreamSubjects:        []string{"selly.>"},
		StreamRetention:       "limits",
		StreamMaxAge:          24 * time.Hour,
		StreamMaxBytes:        1024 * 1024 * 1024, // 1GB
		EnableAsyncProcessing: true,
		EnableMetrics:         true,
		WorkerCount:           10,
	}
}

// NewNATSEventBus creates a new NATS-based event bus
func NewNATSEventBus(config *NATSEventBusConfig) (*NATSEventBus, error) {
	if config == nil {
		config = DefaultNATSEventBusConfig()
	}

	return &NATSEventBus{
		config:      config,
		subscribers: make(map[string]*nats.Subscription),
		stopChan:    make(chan struct{}),
		metrics:     &EventMetrics{},
	}, nil
}

// Start initializes and starts the NATS event bus
func (neb *NATSEventBus) Start(ctx context.Context) error {
	if atomic.LoadInt32(&neb.isRunning) == 1 {
		return fmt.Errorf("NATS event bus is already running")
	}

	logrus.WithFields(logrus.Fields{
		"url":         neb.config.URL,
		"stream_name": neb.config.StreamName,
		"client_id":   neb.config.ClientID,
	}).Info("🚀 Starting NATS event bus service")

	// Connect to NATS server
	nc, err := nats.Connect(
		neb.config.URL,
		nats.Name(neb.config.ClientID),
		nats.MaxReconnects(neb.config.MaxReconnects),
		nats.ReconnectWait(neb.config.ReconnectWait),
		nats.Timeout(neb.config.ConnectionTimeout),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			logrus.WithField("url", nc.ConnectedUrl()).Info("📡 Reconnected to NATS")
		}),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			logrus.WithError(err).Error("🚨 Disconnected from NATS")
		}),
	)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %w", err)
	}

	neb.conn = nc

	// Initialize JetStream
	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return fmt.Errorf("failed to initialize JetStream: %w", err)
	}

	neb.js = js

	// Create or update stream
	err = neb.createOrUpdateStream()
	if err != nil {
		nc.Close()
		return fmt.Errorf("failed to create stream: %w", err)
	}

	// Mark as running
	atomic.StoreInt32(&neb.isRunning, 1)

	// Start metrics collection if enabled
	if neb.config.EnableMetrics {
		go neb.collectMetrics()
	}

	logrus.Info("✅ NATS event bus service started successfully")
	return nil
}

// Stop gracefully shuts down the NATS event bus
func (neb *NATSEventBus) Stop() error {
	if atomic.LoadInt32(&neb.isRunning) == 0 {
		return fmt.Errorf("NATS event bus is not running")
	}

	logrus.Info("🛑 Stopping NATS event bus service...")

	// Mark as not running
	atomic.StoreInt32(&neb.isRunning, 0)

	// Signal workers to stop
	close(neb.stopChan)

	// Unsubscribe all subscriptions
	neb.mu.Lock()
	for _, sub := range neb.subscribers {
		sub.Unsubscribe()
	}
	neb.subscribers = make(map[string]*nats.Subscription)
	neb.mu.Unlock()

	// Close NATS connection
	if neb.conn != nil {
		neb.conn.Close()
	}

	// Recreate stop channel for potential restart
	neb.stopChan = make(chan struct{})

	logrus.Info("✅ NATS event bus service stopped successfully")
	return nil
}

// Publish publishes an event to NATS
func (neb *NATSEventBus) Publish(ctx context.Context, event *Event) error {
	if atomic.LoadInt32(&neb.isRunning) == 0 {
		return fmt.Errorf("NATS event bus is not running")
	}

	start := time.Now()
	defer func() {
		atomic.AddInt64(&neb.metrics.EventsPublished, 1)
		atomic.AddInt64(&neb.metrics.TotalLatency, time.Since(start).Nanoseconds())
	}()

	// Serialize event
	data, err := json.Marshal(event)
	if err != nil {
		atomic.AddInt64(&neb.metrics.EventsPublishFailed, 1)
		return fmt.Errorf("failed to serialize event: %w", err)
	}

	// Determine subject based on event type
	subject := neb.buildSubject(event)

	// Create message with headers
	msg := &nats.Msg{
		Subject: subject,
		Data:    data,
		Header: nats.Header{
			"Event-ID":         []string{event.ID},
			"Event-Type":       []string{string(event.Type)},
			"Source":           []string{event.Source},
			"Priority":         []string{fmt.Sprintf("%d", event.Priority)},
			"Correlation-ID":   []string{event.CorrelationID},
			"Timestamp":        []string{event.Timestamp.Format(time.RFC3339Nano)},
		},
	}

	// Publish with acknowledgment
	ack, err := neb.js.PublishMsg(msg)
	if err != nil {
		atomic.AddInt64(&neb.metrics.EventsPublishFailed, 1)
		return fmt.Errorf("failed to publish event: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"event_id":   event.ID,
		"event_type": event.Type,
		"subject":    subject,
		"sequence":   ack.Sequence,
		"stream":     ack.Stream,
	}).Debug("📤 Event published to NATS")

	return nil
}

// Subscribe subscribes to events of a specific type
func (neb *NATSEventBus) Subscribe(eventType EventType, handler EventHandler, priority Priority) (string, error) {
	if atomic.LoadInt32(&neb.isRunning) == 0 {
		return "", fmt.Errorf("NATS event bus is not running")
	}

	subscriberID := generateSubscriberID()
	subject := fmt.Sprintf("selly.%s", eventType)

	// Wrap handler to decode NATS message
	natsHandler := func(msg *nats.Msg) {
		var event Event
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			logrus.WithError(err).Error("Failed to decode event from NATS message")
			return
		}

		ctx := context.Background()
		if err := handler(ctx, &event); err != nil {
			logrus.WithFields(logrus.Fields{
				"subscriber_id": subscriberID,
				"event_id":      event.ID,
				"event_type":    event.Type,
				"error":         err,
			}).Error("Event processing failed")
			atomic.AddInt64(&neb.metrics.EventsProcessFailed, 1)
		} else {
			atomic.AddInt64(&neb.metrics.EventsProcessed, 1)
		}

		// Acknowledge message
		msg.Ack()
	}

	// Subscribe to JetStream
	sub, err := neb.js.Subscribe(subject, natsHandler, nats.Durable(subscriberID))
	if err != nil {
		return "", fmt.Errorf("failed to subscribe to subject %s: %w", subject, err)
	}

	neb.mu.Lock()
	neb.subscribers[subscriberID] = sub
	neb.mu.Unlock()

	logrus.WithFields(logrus.Fields{
		"subscriber_id": subscriberID,
		"subject":       subject,
		"priority":      priority,
	}).Info("📥 Event subscriber registered")

	return subscriberID, nil
}

// Unsubscribe removes a subscriber
func (neb *NATSEventBus) Unsubscribe(subscriberID string) error {
	neb.mu.Lock()
	defer neb.mu.Unlock()

	sub, exists := neb.subscribers[subscriberID]
	if !exists {
		return fmt.Errorf("subscriber %s not found", subscriberID)
	}

	if err := sub.Unsubscribe(); err != nil {
		return fmt.Errorf("failed to unsubscribe %s: %w", subscriberID, err)
	}

	delete(neb.subscribers, subscriberID)

	logrus.WithField("subscriber_id", subscriberID).Info("📤 Event subscriber removed")
	return nil
}

// IsRunning returns whether the event bus is running
func (neb *NATSEventBus) IsRunning() bool {
	return atomic.LoadInt32(&neb.isRunning) == 1
}

// GetMetrics returns current metrics
func (neb *NATSEventBus) GetMetrics() EventMetrics {
	return EventMetrics{
		EventsPublished:     atomic.LoadInt64(&neb.metrics.EventsPublished),
		EventsProcessed:     atomic.LoadInt64(&neb.metrics.EventsProcessed),
		EventsPublishFailed: atomic.LoadInt64(&neb.metrics.EventsPublishFailed),
		EventsProcessFailed: atomic.LoadInt64(&neb.metrics.EventsProcessFailed),
		TotalLatency:        atomic.LoadInt64(&neb.metrics.TotalLatency),
	}
}

// createOrUpdateStream creates or updates the JetStream stream
func (neb *NATSEventBus) createOrUpdateStream() error {
	streamConfig := &nats.StreamConfig{
		Name:      neb.config.StreamName,
		Subjects:  neb.config.StreamSubjects,
		Retention: nats.LimitsPolicy,
		MaxAge:    neb.config.StreamMaxAge,
		MaxBytes:  neb.config.StreamMaxBytes,
		Storage:   nats.FileStorage,
		Replicas:  1,
	}

	// Try to get existing stream
	_, err := neb.js.StreamInfo(neb.config.StreamName)
	if err != nil {
		// Stream doesn't exist, create it
		_, err = neb.js.AddStream(streamConfig)
		if err != nil {
			return fmt.Errorf("failed to create stream: %w", err)
		}
		logrus.WithField("stream", neb.config.StreamName).Info("📡 JetStream stream created")
	} else {
		// Stream exists, update it
		_, err = neb.js.UpdateStream(streamConfig)
		if err != nil {
			return fmt.Errorf("failed to update stream: %w", err)
		}
		logrus.WithField("stream", neb.config.StreamName).Info("📡 JetStream stream updated")
	}

	return nil
}

// buildSubject builds NATS subject from event
func (neb *NATSEventBus) buildSubject(event *Event) string {
	return fmt.Sprintf("selly.%s", event.Type)
}

// collectMetrics collects and logs metrics periodically
func (neb *NATSEventBus) collectMetrics() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			metrics := neb.GetMetrics()
			logrus.WithFields(logrus.Fields{
				"events_published":      metrics.EventsPublished,
				"events_processed":      metrics.EventsProcessed,
				"events_publish_failed": metrics.EventsPublishFailed,
				"events_process_failed": metrics.EventsProcessFailed,
				"avg_latency_ms":        float64(metrics.TotalLatency) / float64(metrics.EventsPublished) / 1000000,
			}).Info("📊 NATS Event Bus Metrics")
		case <-neb.stopChan:
			return
		}
	}
}

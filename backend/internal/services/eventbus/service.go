package eventbus

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// Service implements the EventBus interface with thread-safe operations
type Service struct {
	// Configuration
	config *EventBusConfig

	// Core components
	subscribers   map[EventType][]Subscriber
	subscriberMap map[string]Subscriber

	// Event processing
	eventChan     chan *Event
	workerWg      sync.WaitGroup
	processingWg  sync.WaitGroup

	// State management
	isRunning     int32 // atomic boolean
	stopChan      chan struct{}

	// Thread safety
	mu            sync.RWMutex

	// Metrics and monitoring
	metrics       *EventMetrics
	lastMetricsUpdate time.Time

	// Components
	publisher     *Publisher
	processor     *Processor
}

// Publisher handles event publishing
type Publisher struct {
	service *Service
}

// Processor handles event processing
type Processor struct {
	service     *Service
	workerCount int
}

// NewService creates a new event bus service
func NewService(config *EventBusConfig) *Service {
	if config == nil {
		config = DefaultEventBusConfig()
	}

	service := &Service{
		config:        config,
		subscribers:   make(map[EventType][]Subscriber),
		subscriberMap: make(map[string]Subscriber),
		eventChan:     make(chan *Event, config.BufferSize),
		stopChan:      make(chan struct{}),
		metrics:       &EventMetrics{},
	}

	service.publisher = &Publisher{service: service}
	service.processor = &Processor{
		service:     service,
		workerCount: config.WorkerCount,
	}

	return service
}

// Start initializes and starts the event bus
func (s *Service) Start(ctx context.Context) error {
	if atomic.LoadInt32(&s.isRunning) == 1 {
		return fmt.Errorf("event bus is already running")
	}

	logrus.WithFields(logrus.Fields{
		"buffer_size":    s.config.BufferSize,
		"worker_count":   s.config.WorkerCount,
		"async_enabled":  s.config.EnableAsyncProcessing,
	}).Info("🚀 Starting event bus service")

	// Mark as running
	atomic.StoreInt32(&s.isRunning, 1)

	// Start event processors
	for i := 0; i < s.processor.workerCount; i++ {
		s.workerWg.Add(1)
		go s.processor.processEvents(i)
	}

	// Start metrics collection if enabled
	if s.config.EnableMetrics {
		go s.collectMetrics()
	}

	logrus.Info("✅ Event bus service started successfully")
	return nil
}

// Stop gracefully shuts down the event bus
func (s *Service) Stop() error {
	if atomic.LoadInt32(&s.isRunning) == 0 {
		return fmt.Errorf("event bus is not running")
	}

	logrus.Info("🛑 Stopping event bus service...")

	// Mark as not running
	atomic.StoreInt32(&s.isRunning, 0)

	// Signal workers to stop
	close(s.stopChan)

	// Wait for workers to finish
	s.workerWg.Wait()

	// Close event channel
	close(s.eventChan)

	// Clear subscribers
	s.mu.Lock()
	s.subscribers = make(map[EventType][]Subscriber)
	s.subscriberMap = make(map[string]Subscriber)
	s.mu.Unlock()

	logrus.Info("✅ Event bus service stopped successfully")
	return nil
}

// IsRunning returns whether the event bus is running
func (s *Service) IsRunning() bool {
	return atomic.LoadInt32(&s.isRunning) == 1
}

// Publish sends an event to all subscribers synchronously
func (s *Service) Publish(ctx context.Context, event *Event) error {
	if !s.IsRunning() {
		return fmt.Errorf("event bus is not running")
	}

	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}

	// Set default values if not provided
	if event.ID == "" {
		event.ID = generateEventID()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	logrus.WithFields(logrus.Fields{
		"event_id":   event.ID,
		"event_type": event.Type,
		"priority":   event.Priority,
		"source":     event.Source,
	}).Debug("📤 Publishing event")

	// Get subscribers for this event type
	subscribers := s.getSubscribers(event.Type)

	if len(subscribers) == 0 {
		logrus.WithField("event_type", event.Type).Debug("No subscribers for event type")
		return nil
	}

	// Process event synchronously
	return s.processEventSync(ctx, event, subscribers)
}

// PublishAsync sends an event to all subscribers asynchronously
func (s *Service) PublishAsync(ctx context.Context, event *Event) error {
	if !s.IsRunning() {
		return fmt.Errorf("event bus is not running")
	}

	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}

	// Set default values if not provided
	if event.ID == "" {
		event.ID = generateEventID()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	logrus.WithFields(logrus.Fields{
		"event_id":   event.ID,
		"event_type": event.Type,
		"async":      true,
	}).Debug("📤 Publishing event asynchronously")

	// Send to processing channel
	select {
	case s.eventChan <- event:
		atomic.AddInt64(&s.metrics.EventsPublished, 1)
		return nil
	case <-ctx.Done():
		return ctx.Err()
	case <-s.stopChan:
		return fmt.Errorf("event bus is stopping")
	default:
		return fmt.Errorf("event channel is full")
	}
}

// Subscribe registers a handler for one or more event types
func (s *Service) Subscribe(topics []EventType, handler EventHandler) (subscriberID string, err error) {
	return s.SubscribeWithPriority(topics, handler, PriorityNormal)
}

// SubscribeWithPriority registers a handler with specified priority
func (s *Service) SubscribeWithPriority(topics []EventType, handler EventHandler, priority Priority) (subscriberID string, err error) {
	if handler == nil {
		return "", fmt.Errorf("handler cannot be nil")
	}

	if len(topics) == 0 {
		return "", fmt.Errorf("at least one topic must be specified")
	}

	subscriberID = generateSubscriberID()
	subscriber := Subscriber{
		ID:       subscriberID,
		Topics:   topics,
		Handler:  handler,
		Priority: priority,
		Active:   true,
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Store subscriber
	s.subscriberMap[subscriberID] = subscriber

	// Add to topic subscriptions
	for _, topic := range topics {
		s.subscribers[topic] = append(s.subscribers[topic], subscriber)
	}

	logrus.WithFields(logrus.Fields{
		"subscriber_id": subscriberID,
		"topics":        topics,
		"priority":      priority,
	}).Info("📥 Event subscriber registered")

	return subscriberID, nil
}

// Unsubscribe removes a subscription
func (s *Service) Unsubscribe(subscriberID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	subscriber, exists := s.subscriberMap[subscriberID]
	if !exists {
		return fmt.Errorf("subscriber not found: %s", subscriberID)
	}

	// Remove from all topics
	for _, topic := range subscriber.Topics {
		subscribers := s.subscribers[topic]
		for i, sub := range subscribers {
			if sub.ID == subscriberID {
				// Remove subscriber from slice
				s.subscribers[topic] = append(subscribers[:i], subscribers[i+1:]...)
				break
			}
		}
	}

	// Remove from subscriber map
	delete(s.subscriberMap, subscriberID)

	logrus.WithField("subscriber_id", subscriberID).Info("📤 Event subscriber unregistered")
	return nil
}

// GetSubscribers returns all subscribers for a topic
func (s *Service) GetSubscribers(topic EventType) []Subscriber {
	s.mu.RLock()
	defer s.mu.RUnlock()

	subscribers, exists := s.subscribers[topic]
	if !exists {
		return []Subscriber{}
	}

	// Return a copy to prevent external modification
	result := make([]Subscriber, len(subscribers))
	copy(result, subscribers)
	return result
}

// getSubscribers returns subscribers for an event type (internal method)
func (s *Service) getSubscribers(eventType EventType) []Subscriber {
	s.mu.RLock()
	defer s.mu.RUnlock()

	subscribers, exists := s.subscribers[eventType]
	if !exists {
		return []Subscriber{}
	}

	// Return a copy to prevent external modification
	result := make([]Subscriber, len(subscribers))
	copy(result, subscribers)
	return result
}

// processEventSync processes an event synchronously
func (s *Service) processEventSync(ctx context.Context, event *Event, subscribers []Subscriber) error {
	var lastError error

	// Process for each subscriber
	for _, subscriber := range subscribers {
		if !subscriber.Active {
			continue
		}

		// Create timeout context for this subscriber
		subCtx, cancel := context.WithTimeout(ctx, s.config.ProcessingTimeout)

		// Process event
		err := s.processSingleEvent(subCtx, event, subscriber)
		cancel()

		if err != nil {
			logrus.WithError(err).WithFields(logrus.Fields{
				"event_id":      event.ID,
				"subscriber_id": subscriber.ID,
			}).Error("Event processing failed")

			lastError = err
			atomic.AddInt64(&s.metrics.EventsFailed, 1)
		} else {
			atomic.AddInt64(&s.metrics.EventsProcessed, 1)
		}
	}

	return lastError
}

// processSingleEvent processes an event for a single subscriber
func (s *Service) processSingleEvent(ctx context.Context, event *Event, subscriber Subscriber) error {
	start := time.Now()

	defer func() {
		duration := time.Since(start)
		// Update average processing time (simple moving average)
		s.updateAverageProcessingTime(duration)
	}()

	// Call the handler
	return subscriber.Handler(ctx, event)
}

// processEvents is the main event processing loop for workers
func (p *Processor) processEvents(workerID int) {
	defer p.service.workerWg.Done()

	logrus.WithField("worker_id", workerID).Debug("👷 Event processor worker started")

	for {
		select {
		case event, ok := <-p.service.eventChan:
			if !ok {
				logrus.WithField("worker_id", workerID).Debug("👷 Event processor worker stopping")
				return
			}

			p.processAsyncEvent(event)

		case <-p.service.stopChan:
			logrus.WithField("worker_id", workerID).Debug("👷 Event processor worker stopping")
			return
		}
	}
}

// processAsyncEvent processes an event asynchronously
func (p *Processor) processAsyncEvent(event *Event) {
	// Get subscribers for this event type
	subscribers := p.service.getSubscribers(event.Type)

	if len(subscribers) == 0 {
		logrus.WithField("event_type", event.Type).Debug("No subscribers for async event")
		return
	}

	// Process event asynchronously for each subscriber
	for _, subscriber := range subscribers {
		if !subscriber.Active {
			continue
		}

		// Process in goroutine
		p.service.processingWg.Add(1)
		go func(sub Subscriber, evt *Event) {
			defer p.service.processingWg.Done()

			ctx, cancel := context.WithTimeout(context.Background(), p.service.config.ProcessingTimeout)
			defer cancel()

			err := p.service.processSingleEvent(ctx, evt, sub)
			if err != nil {
				logrus.WithError(err).WithFields(logrus.Fields{
					"event_id":      evt.ID,
					"subscriber_id": sub.ID,
				}).Error("Async event processing failed")

				atomic.AddInt64(&p.service.metrics.EventsFailed, 1)
			} else {
				atomic.AddInt64(&p.service.metrics.EventsProcessed, 1)
			}
		}(subscriber, event)
	}
}

// updateAverageProcessingTime updates the average processing time
func (s *Service) updateAverageProcessingTime(duration time.Duration) {
	// Simple exponential moving average
	if s.metrics.AverageProcessingTime == 0 {
		s.metrics.AverageProcessingTime = duration
	} else {
		// 0.1 weight for new value, 0.9 for old average
		s.metrics.AverageProcessingTime = time.Duration(
			0.9*float64(s.metrics.AverageProcessingTime) + 0.1*float64(duration),
		)
	}
}

// collectMetrics periodically collects and logs metrics
func (s *Service) collectMetrics() {
	ticker := time.NewTicker(s.config.MetricsInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.mu.RLock()
			activeSubscribers := len(s.subscriberMap)
			s.mu.RUnlock()

			atomic.StoreInt64(&s.metrics.ActiveSubscribers, int64(activeSubscribers))

			if s.config.EnableLogging {
				logrus.WithFields(logrus.Fields{
					"events_published":     atomic.LoadInt64(&s.metrics.EventsPublished),
					"events_processed":     atomic.LoadInt64(&s.metrics.EventsProcessed),
					"events_failed":        atomic.LoadInt64(&s.metrics.EventsFailed),
					"active_subscribers":   activeSubscribers,
					"avg_processing_time":  s.metrics.AverageProcessingTime,
				}).Info("📊 Event bus metrics")
			}

		case <-s.stopChan:
			return
		}
	}
}

// GetMetrics returns current event bus metrics
func (s *Service) GetMetrics() EventMetrics {
	return EventMetrics{
		EventsPublished:     atomic.LoadInt64(&s.metrics.EventsPublished),
		EventsProcessed:     atomic.LoadInt64(&s.metrics.EventsProcessed),
		EventsFailed:        atomic.LoadInt64(&s.metrics.EventsFailed),
		AverageProcessingTime: s.metrics.AverageProcessingTime,
		ActiveSubscribers:   atomic.LoadInt64(&s.metrics.ActiveSubscribers),
	}
}

// generateSubscriberID generates a unique subscriber ID
func generateSubscriberID() string {
	return "sub_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}
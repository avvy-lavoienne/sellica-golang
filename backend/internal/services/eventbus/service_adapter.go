package eventbus

import (
	"context"
)

// ServiceAdapter adapts the legacy Service to implement EventBusInterface
type ServiceAdapter struct {
	service *Service
}

// NewServiceAdapter creates a new adapter for the legacy Service
func NewServiceAdapter(service *Service) *ServiceAdapter {
	return &ServiceAdapter{service: service}
}

// Start starts the service
func (sa *ServiceAdapter) Start(ctx context.Context) error {
	return sa.service.Start(ctx)
}

// Stop stops the service
func (sa *ServiceAdapter) Stop() error {
	return sa.service.Stop()
}

// Publish publishes an event
func (sa *ServiceAdapter) Publish(ctx context.Context, event *Event) error {
	return sa.service.Publish(ctx, event)
}

// Subscribe subscribes to a single event type (EventBusInterface compliance)
func (sa *ServiceAdapter) Subscribe(eventType EventType, handler EventHandler, priority Priority) (string, error) {
	return sa.service.SubscribeWithPriority([]EventType{eventType}, handler, priority)
}

// Unsubscribe unsubscribes from events
func (sa *ServiceAdapter) Unsubscribe(subscriberID string) error {
	return sa.service.Unsubscribe(subscriberID)
}

// IsRunning returns whether the service is running
func (sa *ServiceAdapter) IsRunning() bool {
	return sa.service.IsRunning()
}

// GetMetrics returns current metrics
func (sa *ServiceAdapter) GetMetrics() EventMetrics {
	return sa.service.GetMetrics()
}

package eventbus

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// SELLY AI specific event types
const (
	// User Management Events
	EventTypeUserRegistered     EventType = "user.registered"
	EventTypeUserProfileUpdated EventType = "user.profile.updated"
	EventTypeUserLogin          EventType = "user.login"
	EventTypeUserLogout         EventType = "user.logout"
	EventTypeUserDeleted        EventType = "user.deleted"

	// Document Processing Events
	EventTypeDocumentUploaded   EventType = "document.uploaded"
	EventTypeDocumentProcessed  EventType = "document.processed"
	EventTypeDocumentVerified   EventType = "document.verified"
	EventTypeDocumentRejected   EventType = "document.rejected"

	// AI Chat Events
	EventTypeChatSessionStarted EventType = "chat.session.started"
	EventTypeChatSessionEnded   EventType = "chat.session.ended"
	EventTypeChatMessageSent    EventType = "chat.message.sent"
	EventTypeChatResponseGenerated EventType = "chat.response.generated"

	// Training Data Events
	EventTypeTrainingDataAdded  EventType = "training.data.added"
	EventTypeTrainingDataProcessed EventType = "training.data.processed"
	EventTypeModelRetrained     EventType = "model.retrained"

	// Government Services Events
	EventTypeServiceRequested   EventType = "service.requested"
	EventTypeServiceCompleted   EventType = "service.completed"
	EventTypeServiceFailed      EventType = "service.failed"
	EventTypeDocumentAdjudicated EventType = "document.adjudicated"

	// Compliance Events
	EventTypeComplianceCheck    EventType = "compliance.check"
	EventTypeComplianceViolation EventType = "compliance.violation"
	EventTypeAuditLogGenerated  EventType = "audit.log.generated"
)

// SELLYEventHandlers provides SELLY AI specific event handlers
type SELLYEventHandlers struct {
	eventBus *Service
	logger   *logrus.Logger
}

// NewSELLYEventHandlers creates a new SELLY event handlers instance
func NewSELLYEventHandlers(eventBus *Service) *SELLYEventHandlers {
	return &SELLYEventHandlers{
		eventBus: eventBus,
		logger:   logrus.New(),
	}
}

// SetupSELLYEventHandlers sets up all SELLY AI specific event handlers
func (seh *SELLYEventHandlers) SetupSELLYEventHandlers() error {
	handlers := []struct {
		eventType EventType
		handler   EventHandler
	}{
		{EventTypeUserRegistered, seh.handleUserRegistered},
		{EventTypeUserProfileUpdated, seh.handleUserProfileUpdated},
		{EventTypeDocumentUploaded, seh.handleDocumentUploaded},
		{EventTypeDocumentProcessed, seh.handleDocumentProcessed},
		{EventTypeChatSessionStarted, seh.handleChatSessionStarted},
		{EventTypeChatMessageSent, seh.handleChatMessageSent},
		{EventTypeTrainingDataAdded, seh.handleTrainingDataAdded},
		{EventTypeServiceRequested, seh.handleServiceRequested},
		{EventTypeComplianceViolation, seh.handleComplianceViolation},
	}

	for _, h := range handlers {
		_, err := seh.eventBus.Subscribe([]EventType{h.eventType}, h.handler)
		if err != nil {
			return fmt.Errorf("failed to subscribe to %s: %w", h.eventType, err)
		}
	}

	seh.logger.Info("✅ SELLY AI event handlers registered successfully")
	return nil
}

// handleUserRegistered handles user registration events
func (seh *SELLYEventHandlers) handleUserRegistered(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid user registration event payload")
	}

	userID, _ := payload["user_id"].(string)
	email, _ := payload["email"].(string)

	seh.logger.WithFields(logrus.Fields{
		"user_id": userID,
		"email":   email,
		"source":  event.Source,
	}).Info("👤 New user registered")

	// Emit cache invalidation for user-related data
	cacheEvent := NewEvent(EventTypeCacheInvalidate, map[string]interface{}{
		"pattern": "user:*",
		"reason":  "new_user_registration",
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, cacheEvent)
}

// handleUserProfileUpdated handles user profile update events
func (seh *SELLYEventHandlers) handleUserProfileUpdated(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid user profile update event payload")
	}

	userID, _ := payload["user_id"].(string)
	updatedFields, _ := payload["updated_fields"].([]string)

	seh.logger.WithFields(logrus.Fields{
		"user_id":        userID,
		"updated_fields": updatedFields,
		"source":         event.Source,
	}).Info("📝 User profile updated")

	// Emit cache invalidation for specific user data
	cacheEvent := NewEvent(EventTypeCacheInvalidate, map[string]interface{}{
		"pattern": fmt.Sprintf("user:%s:*", userID),
		"reason":  "profile_update",
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, cacheEvent)
}

// handleDocumentUploaded handles document upload events
func (seh *SELLYEventHandlers) handleDocumentUploaded(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid document upload event payload")
	}

	documentID, _ := payload["document_id"].(string)
	documentType, _ := payload["document_type"].(string)
	userID, _ := payload["user_id"].(string)
	fileSize, _ := payload["file_size"].(int64)

	seh.logger.WithFields(logrus.Fields{
		"document_id":   documentID,
		"document_type": documentType,
		"user_id":       userID,
		"file_size":     fileSize,
		"source":        event.Source,
	}).Info("📄 Document uploaded")

	// Emit monitoring metric
	metricEvent := NewEvent(EventTypeMonitoringMetric, map[string]interface{}{
		"metric_name": "document_uploads",
		"value":       1,
		"tags": map[string]string{
			"document_type": documentType,
			"user_id":       userID,
		},
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, metricEvent)
}

// handleDocumentProcessed handles document processing completion events
func (seh *SELLYEventHandlers) handleDocumentProcessed(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid document processed event payload")
	}

	documentID, _ := payload["document_id"].(string)
	processingTime, _ := payload["processing_time"].(time.Duration)
	confidence, _ := payload["confidence"].(float64)
	status, _ := payload["status"].(string)

	seh.logger.WithFields(logrus.Fields{
		"document_id":     documentID,
		"processing_time": processingTime,
		"confidence":      confidence,
		"status":          status,
		"source":          event.Source,
	}).Info("⚙️ Document processing completed")

	// Emit performance metric
	metricEvent := NewEvent(EventTypeMonitoringMetric, map[string]interface{}{
		"metric_name": "document_processing_time",
		"value":       processingTime.Milliseconds(),
		"tags": map[string]string{
			"document_id": documentID,
			"status":      status,
		},
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, metricEvent)
}

// handleChatSessionStarted handles chat session start events
func (seh *SELLYEventHandlers) handleChatSessionStarted(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid chat session started event payload")
	}

	sessionID, _ := payload["session_id"].(string)
	userID, _ := payload["user_id"].(string)

	seh.logger.WithFields(logrus.Fields{
		"session_id": sessionID,
		"user_id":    userID,
		"source":     event.Source,
	}).Info("💬 Chat session started")

	// Emit cache warming for user chat history
	cacheEvent := NewEvent(EventTypeCacheSet, map[string]interface{}{
		"key":   fmt.Sprintf("chat:session:%s:active", sessionID),
		"value": true,
		"ttl":   24 * time.Hour,
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, cacheEvent)
}

// handleChatMessageSent handles chat message events
func (seh *SELLYEventHandlers) handleChatMessageSent(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid chat message event payload")
	}

	sessionID, _ := payload["session_id"].(string)
	userID, _ := payload["user_id"].(string)
	messageLength, _ := payload["message_length"].(int)

	seh.logger.WithFields(logrus.Fields{
		"session_id":     sessionID,
		"user_id":        userID,
		"message_length": messageLength,
		"source":         event.Source,
	}).Debug("💬 Chat message sent")

	// Emit training data collection event
	trainingEvent := NewEvent(EventTypeTrainingDataAdded, map[string]interface{}{
		"session_id": sessionID,
		"user_id":    userID,
		"data_type":  "chat_message",
		"timestamp":  time.Now(),
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, trainingEvent)
}

// handleTrainingDataAdded handles training data addition events
func (seh *SELLYEventHandlers) handleTrainingDataAdded(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid training data event payload")
	}

	dataType, _ := payload["data_type"].(string)
	userID, _ := payload["user_id"].(string)

	seh.logger.WithFields(logrus.Fields{
		"data_type": dataType,
		"user_id":   userID,
		"source":    event.Source,
	}).Info("📚 Training data added")

	// Emit cache invalidation for training data statistics
	cacheEvent := NewEvent(EventTypeCacheInvalidate, map[string]interface{}{
		"pattern": "training:stats:*",
		"reason":  "new_training_data",
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, cacheEvent)
}

// handleServiceRequested handles government service request events
func (seh *SELLYEventHandlers) handleServiceRequested(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid service request event payload")
	}

	serviceID, _ := payload["service_id"].(string)
	serviceType, _ := payload["service_type"].(string)
	userID, _ := payload["user_id"].(string)
	priority, _ := payload["priority"].(string)

	seh.logger.WithFields(logrus.Fields{
		"service_id":   serviceID,
		"service_type": serviceType,
		"user_id":      userID,
		"priority":     priority,
		"source":       event.Source,
	}).Info("🏛️ Government service requested")

	// Emit compliance check event
	complianceEvent := NewEvent(EventTypeComplianceCheck, map[string]interface{}{
		"service_id":   serviceID,
		"service_type": serviceType,
		"user_id":      userID,
		"check_type":   "service_request_validation",
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, complianceEvent)
}

// handleComplianceViolation handles compliance violation events
func (seh *SELLYEventHandlers) handleComplianceViolation(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid compliance violation event payload")
	}

	violationID, _ := payload["violation_id"].(string)
	violationType, _ := payload["violation_type"].(string)
	userID, _ := payload["user_id"].(string)
	severity, _ := payload["severity"].(string)

	seh.logger.WithFields(logrus.Fields{
		"violation_id":   violationID,
		"violation_type": violationType,
		"user_id":        userID,
		"severity":       severity,
		"source":         event.Source,
	}).Warn("⚠️ Compliance violation detected")

	// Emit critical alert for high-severity violations
	if severity == "critical" || severity == "high" {
		alertEvent := NewEvent(EventTypeMonitoringAlert, map[string]interface{}{
			"alert_type": "compliance_violation",
			"message":    fmt.Sprintf("Compliance violation: %s for user %s", violationType, userID),
			"severity":   severity,
			"violation_id": violationID,
		}).
			WithSource("selly-handlers").
			WithPriority(PriorityCritical)

		return seh.eventBus.PublishAsync(ctx, alertEvent)
	}

	return nil
}

// EmitUserRegistered emits a user registration event
func (seh *SELLYEventHandlers) EmitUserRegistered(ctx context.Context, userID, email string) error {
	event := NewEvent(EventTypeUserRegistered, map[string]interface{}{
		"user_id": userID,
		"email":   email,
		"timestamp": time.Now(),
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, event)
}

// EmitDocumentProcessed emits a document processing completion event
func (seh *SELLYEventHandlers) EmitDocumentProcessed(ctx context.Context, documentID string, processingTime time.Duration, confidence float64, status string) error {
	event := NewEvent(EventTypeDocumentProcessed, map[string]interface{}{
		"document_id":     documentID,
		"processing_time": processingTime,
		"confidence":      confidence,
		"status":          status,
		"timestamp":       time.Now(),
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, event)
}

// EmitServiceCompleted emits a service completion event
func (seh *SELLYEventHandlers) EmitServiceCompleted(ctx context.Context, serviceID, serviceType, userID string, duration time.Duration) error {
	event := NewEvent(EventTypeServiceCompleted, map[string]interface{}{
		"service_id":   serviceID,
		"service_type": serviceType,
		"user_id":      userID,
		"duration":     duration,
		"timestamp":    time.Now(),
	}).WithSource("selly-handlers")

	return seh.eventBus.PublishAsync(ctx, event)
}

// EmitComplianceViolation emits a compliance violation event
func (seh *SELLYEventHandlers) EmitComplianceViolation(ctx context.Context, violationID, violationType, userID, severity string) error {
	event := NewEvent(EventTypeComplianceViolation, map[string]interface{}{
		"violation_id":   violationID,
		"violation_type": violationType,
		"user_id":        userID,
		"severity":       severity,
		"timestamp":      time.Now(),
	}).
		WithSource("selly-handlers").
		WithPriority(seh.mapSeverityToPriority(severity))

	return seh.eventBus.PublishAsync(ctx, event)
}

// mapSeverityToPriority maps compliance violation severity to event priority
func (seh *SELLYEventHandlers) mapSeverityToPriority(severity string) Priority {
	switch severity {
	case "critical":
		return PriorityCritical
	case "high":
		return PriorityHigh
	case "medium":
		return PriorityNormal
	case "low":
		return PriorityLow
	default:
		return PriorityNormal
	}
}
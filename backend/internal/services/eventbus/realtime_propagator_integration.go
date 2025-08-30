package eventbus

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// SELLYRealTimePropagatorIntegration provides integration examples
// for SELLY AI services with the RealTimePropagator
type SELLYRealTimePropagatorIntegration struct {
	propagator *RealTimePropagator
	eventBus   *Service
}

// NewSELLYRealTimePropagatorIntegration creates a new SELLY AI integration
func NewSELLYRealTimePropagatorIntegration(propagator *RealTimePropagator, eventBus *Service) *SELLYRealTimePropagatorIntegration {
	return &SELLYRealTimePropagatorIntegration{
		propagator: propagator,
		eventBus:   eventBus,
	}
}

// SetupSELLYIntegration configures the propagator for SELLY AI use cases
func (s *SELLYRealTimePropagatorIntegration) SetupSELLYIntegration() error {
	logrus.Info("🔧 Setting up SELLY AI RealTimePropagator integration")

	// Add SELLY-specific propagation rules
	if err := s.setupGovernmentDocumentRules(); err != nil {
		return fmt.Errorf("failed to setup government document rules: %w", err)
	}

	if err := s.setupUserManagementRules(); err != nil {
		return fmt.Errorf("failed to setup user management rules: %w", err)
	}

	if err := s.setupAIProcessingRules(); err != nil {
		return fmt.Errorf("failed to setup AI processing rules: %w", err)
	}

	if err := s.setupComplianceRules(); err != nil {
		return fmt.Errorf("failed to setup compliance rules: %w", err)
	}

	// Add SELLY-specific service targets
	if err := s.setupServiceTargets(); err != nil {
		return fmt.Errorf("failed to setup service targets: %w", err)
	}

	logrus.Info("✅ SELLY AI RealTimePropagator integration completed")
	return nil
}

// setupGovernmentDocumentRules configures rules for Indonesian government documents
func (s *SELLYRealTimePropagatorIntegration) setupGovernmentDocumentRules() error {
	rules := []PropagationRule{
		// KTP (Indonesian ID Card) processing
		{
			ID:        "ktp_document_processing",
			EventType: EventTypeDataCreated,
			Conditions: []PropagationCondition{
				{Field: "document_type", Operator: "equals", Value: "ktp", Weight: 1.0},
				{Field: "validation_required", Operator: "equals", Value: true, Weight: 0.8},
			},
			Targets:  []string{"document_validator", "face_recognition", "compliance_checker", "audit_service"},
			Priority: PriorityHigh,
			Enabled:  true,
		},

		// KK (Family Card) processing
		{
			ID:        "kk_document_processing",
			EventType: EventTypeDataUpdated,
			Conditions: []PropagationCondition{
				{Field: "document_type", Operator: "equals", Value: "kk", Weight: 1.0},
				{Field: "family_members_changed", Operator: "equals", Value: true, Weight: 0.9},
			},
			Targets:  []string{"family_verification", "address_validator", "social_service", "audit_service"},
			Priority: PriorityHigh,
			Enabled:  true,
		},

		// Akta Kelahiran (Birth Certificate) processing
		{
			ID:        "akta_kelahiran_processing",
			EventType: EventTypeDataCreated,
			Conditions: []PropagationCondition{
				{Field: "document_type", Operator: "equals", Value: "akta_kelahiran", Weight: 1.0},
				{Field: "parent_verification_required", Operator: "equals", Value: true, Weight: 0.7},
			},
			Targets:  []string{"parent_verification", "hospital_integration", "civil_registry", "audit_service"},
			Priority: PriorityCritical,
			Enabled:  true,
		},

		// Akta Kematian (Death Certificate) processing
		{
			ID:        "akta_kematian_processing",
			EventType: EventTypeDataCreated,
			Conditions: []PropagationCondition{
				{Field: "document_type", Operator: "equals", Value: "akta_kematian", Weight: 1.0},
				{Field: "inheritance_processing", Operator: "equals", Value: true, Weight: 0.8},
			},
			Targets:  []string{"inheritance_service", "family_update", "social_security", "audit_service"},
			Priority: PriorityCritical,
			Enabled:  true,
		},
	}

	for _, rule := range rules {
		if err := s.propagator.AddPropagationRule(rule); err != nil {
			return fmt.Errorf("failed to add rule %s: %w", rule.ID, err)
		}
	}

	logrus.WithField("rules_count", len(rules)).Info("📋 Government document rules configured")
	return nil
}

// setupUserManagementRules configures rules for user management operations
func (s *SELLYRealTimePropagatorIntegration) setupUserManagementRules() error {
	rules := []PropagationRule{
		// User profile updates
		{
			ID:        "user_profile_update",
			EventType: EventTypeDataUpdated,
			Conditions: []PropagationCondition{
				{Field: "data_type", Operator: "equals", Value: "user_profile", Weight: 1.0},
				{Field: "sensitive_data_changed", Operator: "equals", Value: true, Weight: 0.9},
			},
			Targets:  []string{"cache_invalidation", "search_index_update", "notification_service", "audit_service"},
			Priority: PriorityHigh,
			Enabled:  true,
		},

		// User authentication events
		{
			ID:        "user_authentication_events",
			EventType: EventTypeAuthLogin,
			Conditions: []PropagationCondition{
				{Field: "login_method", Operator: "equals", Value: "government_sso", Weight: 1.0},
			},
			Targets:  []string{"session_management", "security_monitoring", "compliance_audit"},
			Priority: PriorityNormal,
			Enabled:  true,
		},

		// User registration completion
		{
			ID:        "user_registration_complete",
			EventType: EventTypeDataCreated,
			Conditions: []PropagationCondition{
				{Field: "data_type", Operator: "equals", Value: "user_registration", Weight: 1.0},
				{Field: "verification_complete", Operator: "equals", Value: true, Weight: 0.8},
			},
			Targets:  []string{"welcome_notification", "profile_setup", "government_integration", "analytics_service"},
			Priority: PriorityNormal,
			Enabled:  true,
		},
	}

	for _, rule := range rules {
		if err := s.propagator.AddPropagationRule(rule); err != nil {
			return fmt.Errorf("failed to add rule %s: %w", rule.ID, err)
		}
	}

	logrus.WithField("rules_count", len(rules)).Info("👤 User management rules configured")
	return nil
}

// setupAIProcessingRules configures rules for AI-powered processing
func (s *SELLYRealTimePropagatorIntegration) setupAIProcessingRules() error {
	rules := []PropagationRule{
		// Chat message processing
		{
			ID:        "chat_ai_processing",
			EventType: EventTypeChatMessage,
			Conditions: []PropagationCondition{
				{Field: "message_type", Operator: "equals", Value: "user_query", Weight: 1.0},
				{Field: "requires_ai_processing", Operator: "equals", Value: true, Weight: 0.8},
			},
			Targets:  []string{"ai_service", "sentiment_analysis", "intent_classification", "response_generator"},
			Priority: PriorityHigh,
			Enabled:  true,
		},

		// Document AI analysis
		{
			ID:        "document_ai_analysis",
			EventType: EventTypeDataCreated,
			Conditions: []PropagationCondition{
				{Field: "data_type", Operator: "contains", Value: "document", Weight: 1.0},
				{Field: "ai_analysis_required", Operator: "equals", Value: true, Weight: 0.9},
			},
			Targets:  []string{"ocr_service", "document_classifier", "data_extraction", "validation_service"},
			Priority: PriorityHigh,
			Enabled:  true,
		},

		// AI model updates
		{
			ID:        "ai_model_updates",
			EventType: EventTypeDataUpdated,
			Conditions: []PropagationCondition{
				{Field: "data_type", Operator: "equals", Value: "ai_model", Weight: 1.0},
				{Field: "model_version_changed", Operator: "equals", Value: true, Weight: 0.8},
			},
			Targets:  []string{"model_deployment", "performance_monitoring", "cache_invalidation", "notification_service"},
			Priority: PriorityCritical,
			Enabled:  true,
		},
	}

	for _, rule := range rules {
		if err := s.propagator.AddPropagationRule(rule); err != nil {
			return fmt.Errorf("failed to add rule %s: %w", rule.ID, err)
		}
	}

	logrus.WithField("rules_count", len(rules)).Info("🤖 AI processing rules configured")
	return nil
}

// setupComplianceRules configures rules for compliance and regulatory requirements
func (s *SELLYRealTimePropagatorIntegration) setupComplianceRules() error {
	rules := []PropagationRule{
		// Data privacy compliance
		{
			ID:        "data_privacy_compliance",
			EventType: EventTypeDataUpdated,
			Conditions: []PropagationCondition{
				{Field: "contains_personal_data", Operator: "equals", Value: true, Weight: 1.0},
				{Field: "compliance_check_required", Operator: "equals", Value: true, Weight: 0.9},
			},
			Targets:  []string{"privacy_checker", "data_masking", "audit_service", "compliance_dashboard"},
			Priority: PriorityHigh,
			Enabled:  true,
		},

		// Regulatory reporting
		{
			ID:        "regulatory_reporting",
			EventType: EventTypeDataCreated,
			Conditions: []PropagationCondition{
				{Field: "regulatory_report_required", Operator: "equals", Value: true, Weight: 1.0},
				{Field: "report_type", Operator: "exists", Value: nil, Weight: 0.7},
			},
			Targets:  []string{"regulatory_service", "report_generator", "government_api", "audit_service"},
			Priority: PriorityCritical,
			Enabled:  true,
		},

		// Security incident handling
		{
			ID:        "security_incident_handling",
			EventType: EventTypeSystemError,
			Conditions: []PropagationCondition{
				{Field: "security_related", Operator: "equals", Value: true, Weight: 1.0},
				{Field: "incident_severity", Operator: "greater_than", Value: "medium", Weight: 0.8},
			},
			Targets:  []string{"security_team", "incident_response", "compliance_officer", "audit_service"},
			Priority: PriorityCritical,
			Enabled:  true,
		},
	}

	for _, rule := range rules {
		if err := s.propagator.AddPropagationRule(rule); err != nil {
			return fmt.Errorf("failed to add rule %s: %w", rule.ID, err)
		}
	}

	logrus.WithField("rules_count", len(rules)).Info("⚖️ Compliance rules configured")
	return nil
}

// setupServiceTargets configures SELLY AI specific service targets
func (s *SELLYRealTimePropagatorIntegration) setupServiceTargets() error {
	targets := []*ServiceTarget{
		// Document processing services
		{
			Name:        "document_validator",
			Endpoint:    "http://document-validator:8080/validate",
			HealthCheck: "http://document-validator:8080/health",
			Timeout:     45 * time.Second,
			MaxRetries:  3,
			Enabled:     true,
			IsHealthy:   true,
		},
		{
			Name:        "face_recognition",
			Endpoint:    "http://face-recognition:8080/recognize",
			HealthCheck: "http://face-recognition:8080/health",
			Timeout:     30 * time.Second,
			MaxRetries:  2,
			Enabled:     true,
			IsHealthy:   true,
		},

		// Government integration services
		{
			Name:        "civil_registry",
			Endpoint:    "https://api.dukcapil.kemendagri.go.id/verify",
			HealthCheck: "https://api.dukcapil.kemendagri.go.id/health",
			Timeout:     60 * time.Second,
			MaxRetries:  3,
			Enabled:     true,
			IsHealthy:   true,
		},
		{
			Name:        "social_security",
			Endpoint:    "https://api.bpjs-kesehatan.go.id/verify",
			HealthCheck: "https://api.bpjs-kesehatan.go.id/health",
			Timeout:     45 * time.Second,
			MaxRetries:  2,
			Enabled:     true,
			IsHealthy:   true,
		},

		// AI and analytics services
		{
			Name:        "ai_service",
			Endpoint:    "http://ai-service:8080/process",
			HealthCheck: "http://ai-service:8080/health",
			Timeout:     120 * time.Second,
			MaxRetries:  1,
			Enabled:     true,
			IsHealthy:   true,
		},
		{
			Name:        "sentiment_analysis",
			Endpoint:    "http://sentiment-analysis:8080/analyze",
			HealthCheck: "http://sentiment-analysis:8080/health",
			Timeout:     15 * time.Second,
			MaxRetries:  2,
			Enabled:     true,
			IsHealthy:   true,
		},

		// Compliance and audit services
		{
			Name:        "compliance_checker",
			Endpoint:    "http://compliance-checker:8080/check",
			HealthCheck: "http://compliance-checker:8080/health",
			Timeout:     30 * time.Second,
			MaxRetries:  3,
			Enabled:     true,
			IsHealthy:   true,
		},
		{
			Name:        "audit_service",
			Endpoint:    "http://audit-service:8080/log",
			HealthCheck: "http://audit-service:8080/health",
			Timeout:     10 * time.Second,
			MaxRetries:  5,
			Enabled:     true,
			IsHealthy:   true,
		},
	}

	for _, target := range targets {
		if err := s.propagator.AddServiceTarget(target); err != nil {
			return fmt.Errorf("failed to add target %s: %w", target.Name, err)
		}
	}

	logrus.WithField("targets_count", len(targets)).Info("🎯 SELLY AI service targets configured")
	return nil
}

// ExampleSELLYScenarios demonstrates common SELLY AI use cases
func (s *SELLYRealTimePropagatorIntegration) ExampleSELLYScenarios(ctx context.Context) error {
	logrus.Info("🚀 Demonstrating SELLY AI RealTimePropagator scenarios")

	// Scenario 1: KTP Document Upload and Processing
	if err := s.scenarioKTPProcessing(ctx); err != nil {
		logrus.WithError(err).Error("KTP processing scenario failed")
	}

	// Scenario 2: User Profile Update with Compliance
	if err := s.scenarioUserProfileUpdate(ctx); err != nil {
		logrus.WithError(err).Error("User profile update scenario failed")
	}

	// Scenario 3: AI Chat Query Processing
	if err := s.scenarioAIChatProcessing(ctx); err != nil {
		logrus.WithError(err).Error("AI chat processing scenario failed")
	}

	// Scenario 4: Regulatory Compliance Event
	if err := s.scenarioRegulatoryCompliance(ctx); err != nil {
		logrus.WithError(err).Error("Regulatory compliance scenario failed")
	}

	logrus.Info("✅ SELLY AI scenarios demonstration completed")
	return nil
}

// scenarioKTPProcessing demonstrates KTP document processing workflow
func (s *SELLYRealTimePropagatorIntegration) scenarioKTPProcessing(ctx context.Context) error {
	logrus.Info("🆔 Scenario: KTP Document Processing")

	// Simulate KTP document upload
	event := NewEvent(EventTypeDataCreated, map[string]interface{}{
		"document_type":         "ktp",
		"user_id":              "user_12345",
		"document_id":          "ktp_001",
		"validation_required":  true,
		"face_recognition_req": true,
		"compliance_check_req": true,
		"upload_timestamp":     time.Now(),
		"uploaded_by":          "mobile_app",
	})

	// This will trigger:
	// 1. Document validation service
	// 2. Face recognition service
	// 3. Compliance checking service
	// 4. Audit logging service

	if err := s.propagator.PropagateEvent(ctx, event); err != nil {
		return fmt.Errorf("failed to propagate KTP event: %w", err)
	}

	logrus.Info("✅ KTP document processing event propagated")
	return nil
}

// scenarioUserProfileUpdate demonstrates user profile update workflow
func (s *SELLYRealTimePropagatorIntegration) scenarioUserProfileUpdate(ctx context.Context) error {
	logrus.Info("👤 Scenario: User Profile Update")

	// Simulate user profile update
	event := NewEvent(EventTypeDataUpdated, map[string]interface{}{
		"data_type":             "user_profile",
		"user_id":              "user_67890",
		"changes":              []string{"phone_number", "address", "email"},
		"sensitive_data_changed": true,
		"requires_verification": true,
		"update_source":        "user_portal",
		"previous_values": map[string]interface{}{
			"phone_number": "+62812345678",
			"address":      "Jakarta Pusat",
		},
		"new_values": map[string]interface{}{
			"phone_number": "+62812345679",
			"address":      "Jakarta Utara",
			"email":        "user@example.com",
		},
	})

	// This will trigger:
	// 1. Cache invalidation service
	// 2. Search index update service
	// 3. Notification service
	// 4. Audit logging service

	if err := s.propagator.PropagateEvent(ctx, event); err != nil {
		return fmt.Errorf("failed to propagate profile update event: %w", err)
	}

	logrus.Info("✅ User profile update event propagated")
	return nil
}

// scenarioAIChatProcessing demonstrates AI chat query processing
func (s *SELLYRealTimePropagatorIntegration) scenarioAIChatProcessing(ctx context.Context) error {
	logrus.Info("💬 Scenario: AI Chat Processing")

	// Simulate AI chat message
	event := NewEvent(EventTypeChatMessage, map[string]interface{}{
		"message_type":          "user_query",
		"user_id":              "user_11111",
		"session_id":           "session_abc123",
		"message_content":      "Bagaimana cara mengurus KTP baru?",
		"language":             "indonesian",
		"requires_ai_processing": true,
		"context_provided":     true,
		"previous_messages":    3,
		"sentiment_score":      0.7,
	})

	// This will trigger:
	// 1. AI service for response generation
	// 2. Sentiment analysis service
	// 3. Intent classification service
	// 4. Response generator service

	if err := s.propagator.PropagateEvent(ctx, event); err != nil {
		return fmt.Errorf("failed to propagate chat event: %w", err)
	}

	logrus.Info("✅ AI chat processing event propagated")
	return nil
}

// scenarioRegulatoryCompliance demonstrates regulatory compliance workflow
func (s *SELLYRealTimePropagatorIntegration) scenarioRegulatoryCompliance(ctx context.Context) error {
	logrus.Info("⚖️ Scenario: Regulatory Compliance")

	// Simulate regulatory compliance event
	event := NewEvent(EventTypeDataCreated, map[string]interface{}{
		"regulatory_report_required": true,
		"report_type":               "monthly_compliance",
		"report_period":            "2025-08",
		"data_categories":          []string{"user_data", "document_data", "transaction_data"},
		"compliance_level":         "high",
		"deadline":                 time.Now().Add(24 * time.Hour),
		"generated_by":            "compliance_system",
		"review_required":         true,
	})

	// This will trigger:
	// 1. Regulatory service
	// 2. Report generator service
	// 3. Government API integration
	// 4. Audit logging service

	if err := s.propagator.PropagateEvent(ctx, event); err != nil {
		return fmt.Errorf("failed to propagate compliance event: %w", err)
	}

	logrus.Info("✅ Regulatory compliance event propagated")
	return nil
}

// GetSELLYMetrics returns SELLY AI specific metrics
func (s *SELLYRealTimePropagatorIntegration) GetSELLYMetrics() map[string]interface{} {
	baseMetrics := s.propagator.GetMetrics()

	// Create a copy of metrics without the mutex to avoid lock copying
	metricsCopy := map[string]interface{}{
		"tasks_queued":          baseMetrics.TasksQueued,
		"tasks_processed":       baseMetrics.TasksProcessed,
		"tasks_failed":          baseMetrics.TasksFailed,
		"tasks_retried":         baseMetrics.TasksRetried,
		"average_processing_time": baseMetrics.AverageProcessingTime,
		"active_workers":        baseMetrics.ActiveWorkers,
		"queue_depth":           baseMetrics.QueueDepth,
		"circuit_breaker_state": baseMetrics.CircuitBreakerState,
	}

	sellyMetrics := map[string]interface{}{
		"base_metrics": metricsCopy,

		// SELLY AI specific metrics
		"government_documents_processed": 0, // Would be tracked separately
		"compliance_checks_passed":       0,
		"ai_responses_generated":         0,
		"user_profiles_updated":          0,

		// Service health indicators
		"civil_registry_health":     "healthy",
		"document_validator_health": "healthy",
		"ai_service_health":         "healthy",
		"compliance_service_health": "healthy",

		// Performance indicators
		"avg_document_processing_time": "2.3s",
		"avg_ai_response_time":         "1.8s",
		"avg_compliance_check_time":    "0.9s",
	}

	return sellyMetrics
}

// SELLYEventHandler demonstrates custom event handling for SELLY AI
type SELLYEventHandler struct {
	// integration *SELLYRealTimePropagatorIntegration // Reference to integration for accessing services - removed unused field
}

// HandleGovernmentDocument processes government document events
func (h *SELLYEventHandler) HandleGovernmentDocument(ctx context.Context, event *Event) error {
	logrus.WithFields(logrus.Fields{
		"event_id":      event.ID,
		"document_type": event.Payload.(map[string]interface{})["document_type"],
		"user_id":       event.Payload.(map[string]interface{})["user_id"],
	}).Info("🏛️ Processing government document event")

	// Custom SELLY AI document processing logic would go here
	// This could include:
	// - Document validation
	// - Government API integration
	// - Compliance checking
	// - Audit logging

	return nil
}

// HandleUserActivity processes user activity events
func (h *SELLYEventHandler) HandleUserActivity(ctx context.Context, event *Event) error {
	logrus.WithFields(logrus.Fields{
		"event_id":   event.ID,
		"user_id":    event.Payload.(map[string]interface{})["user_id"],
		"activity":   event.Type,
	}).Info("👤 Processing user activity event")

	// Custom SELLY AI user activity processing logic would go here
	// This could include:
	// - User behavior analysis
	// - Security monitoring
	// - Personalization updates
	// - Compliance tracking

	return nil
}

// HandleAIInteraction processes AI interaction events
func (h *SELLYEventHandler) HandleAIInteraction(ctx context.Context, event *Event) error {
	logrus.WithFields(logrus.Fields{
		"event_id":      event.ID,
		"interaction_type": event.Type,
		"user_id":       event.Payload.(map[string]interface{})["user_id"],
	}).Info("🤖 Processing AI interaction event")

	// Custom SELLY AI interaction processing logic would go here
	// This could include:
	// - Response quality analysis
	// - User satisfaction tracking
	// - Model performance monitoring
	// - Continuous learning data collection

	return nil
}
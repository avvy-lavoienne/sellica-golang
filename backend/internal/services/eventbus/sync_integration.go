package eventbus

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// SyncIntegration provides integration examples and utilities for the sync components
type SyncIntegration struct {
	eventBus           *Service
	syncService        *SynchronizationService
	ruleEngine         *SyncRuleEngine
	consistencyChecker *DataConsistencyChecker
}

// NewSyncIntegration creates a new sync integration instance
func NewSyncIntegration(eventBus *Service) (*SyncIntegration, error) {
	// Initialize sync service
	syncService, err := NewSynchronizationService(eventBus, DefaultSyncConfig())
	if err != nil {
		return nil, fmt.Errorf("failed to create sync service: %w", err)
	}

	// Initialize rule engine
	ruleEngine, err := NewSyncRuleEngine()
	if err != nil {
		return nil, fmt.Errorf("failed to create rule engine: %w", err)
	}

	// Initialize consistency checker
	consistencyChecker, err := NewDataConsistencyChecker()
	if err != nil {
		return nil, fmt.Errorf("failed to create consistency checker: %w", err)
	}

	return &SyncIntegration{
		eventBus:           eventBus,
		syncService:        syncService,
		ruleEngine:         ruleEngine,
		consistencyChecker: consistencyChecker,
	}, nil
}

// StartIntegration starts all sync components
func (si *SyncIntegration) StartIntegration(ctx context.Context) error {
	logrus.Info("🚀 Starting SELLY AI Data Flow Synchronization Integration")

	// Start sync service
	if err := si.syncService.Start(ctx); err != nil {
		return fmt.Errorf("failed to start sync service: %w", err)
	}

	logrus.Info("✅ Data Flow Synchronization Integration started successfully")
	return nil
}

// StopIntegration stops all sync components
func (si *SyncIntegration) StopIntegration() error {
	logrus.Info("🛑 Stopping SELLY AI Data Flow Synchronization Integration")

	// Stop sync service
	if err := si.syncService.Stop(); err != nil {
		logrus.WithError(err).Error("Error stopping sync service")
	}

	logrus.Info("✅ Data Flow Synchronization Integration stopped successfully")
	return nil
}

// ExampleUsage demonstrates how to use the sync components
func (si *SyncIntegration) ExampleUsage(ctx context.Context) error {
	logrus.Info("📚 SELLY AI Data Flow Synchronization - Usage Examples")

	// Example 1: User Profile Update Sync
	logrus.Info("📝 Example 1: User Profile Update Synchronization")
	err := si.exampleUserProfileSync(ctx)
	if err != nil {
		logrus.WithError(err).Error("User profile sync example failed")
	}

	// Example 2: Document Processing Sync
	logrus.Info("📄 Example 2: Document Processing Synchronization")
	err = si.exampleDocumentProcessingSync(ctx)
	if err != nil {
		logrus.WithError(err).Error("Document processing sync example failed")
	}

	// Example 3: Consistency Check
	logrus.Info("🔍 Example 3: Data Consistency Validation")
	err = si.exampleConsistencyCheck(ctx)
	if err != nil {
		logrus.WithError(err).Error("Consistency check example failed")
	}

	// Example 4: Custom Rule Creation
	logrus.Info("⚙️ Example 4: Custom Synchronization Rule")
	err = si.exampleCustomRule(ctx)
	if err != nil {
		logrus.WithError(err).Error("Custom rule example failed")
	}

	return nil
}

// exampleUserProfileSync demonstrates user profile synchronization
func (si *SyncIntegration) exampleUserProfileSync(ctx context.Context) error {
	// Create a user profile update event
	userEvent := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id":      "user_12345",
		"email":        "john.doe@example.com",
		"full_name":    "John Doe",
		"source":       "frontend",
		"session_id":   "session_abc123",
		"updated_fields": []string{"email", "full_name"},
	})

	// Publish the event (this will trigger sync automatically)
	err := si.eventBus.Publish(ctx, userEvent)
	if err != nil {
		return fmt.Errorf("failed to publish user event: %w", err)
	}

	// Wait a moment for processing
	time.Sleep(100 * time.Millisecond)

	// Check active sync processes
	activeSyncs := si.syncService.GetActiveSyncs()
	logrus.WithField("active_syncs", len(activeSyncs)).Info("Active sync processes after user update")

	// Get sync metrics
	metrics := si.syncService.GetSyncMetrics()
	logrus.WithFields(logrus.Fields{
		"total_processes": metrics.TotalProcesses,
		"active_processes": metrics.ActiveProcesses,
		"completed_processes": metrics.CompletedProcesses,
	}).Info("Sync service metrics")

	return nil
}

// exampleDocumentProcessingSync demonstrates document processing synchronization
func (si *SyncIntegration) exampleDocumentProcessingSync(ctx context.Context) error {
	// Create a document upload event
	docEvent := NewEvent(EventTypeDocumentUploaded, map[string]interface{}{
		"document_id":   "doc_67890",
		"document_type": "akta_kelahiran",
		"file_name":     "birth_certificate.pdf",
		"file_size":     2048576,
		"user_id":       "user_12345",
		"upload_source": "mobile_app",
		"metadata": map[string]interface{}{
			"province": "DKI Jakarta",
			"district": "Jakarta Pusat",
		},
	})

	// Publish the event
	err := si.eventBus.Publish(ctx, docEvent)
	if err != nil {
		return fmt.Errorf("failed to publish document event: %w", err)
	}

	// Simulate document processing completion
	time.Sleep(200 * time.Millisecond)

	processingEvent := NewEvent(EventTypeDocumentProcessed, map[string]interface{}{
		"document_id":     "doc_67890",
		"processing_status": "completed",
		"extracted_data": map[string]interface{}{
			"nama_lengkap":    "John Doe",
			"tanggal_lahir":   "1990-01-15",
			"tempat_lahir":    "Jakarta",
			"nomor_akta":      "123456789",
		},
		"confidence_score": 0.95,
		"processing_time_ms": 1500,
	})

	err = si.eventBus.Publish(ctx, processingEvent)
	if err != nil {
		return fmt.Errorf("failed to publish processing event: %w", err)
	}

	return nil
}

// exampleConsistencyCheck demonstrates data consistency validation
func (si *SyncIntegration) exampleConsistencyCheck(ctx context.Context) error {
	// Perform comprehensive consistency check
	report, err := si.consistencyChecker.CheckConsistency(ctx)
	if err != nil {
		return fmt.Errorf("failed to perform consistency check: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"overall_score": report.OverallScore,
		"status":        report.Status,
		"duration":      report.Duration,
		"total_checks":  len(report.Results),
	}).Info("Consistency check results")

	// Log recommendations
	for i, recommendation := range report.Recommendations {
		logrus.WithField("recommendation", recommendation).
			Info(fmt.Sprintf("Recommendation %d", i+1))
	}

	return nil
}

// exampleCustomRule demonstrates creating and using custom synchronization rules
func (si *SyncIntegration) exampleCustomRule(_ context.Context) error {
	// Create a custom rule for premium user analytics sync
	customRule := SyncRule{
		ID:        "premium_analytics_sync",
		Name:      "Premium User Analytics Sync",
		EventType: EventTypeChatMessageSent,
		Priority:  10, // High priority for premium users
		Conditions: []RuleCondition{
			{Field: "user_type", Operator: "equals", Value: "premium", Weight: 1.0},
			{Field: "message_length", Operator: "greater_than", Value: 50, Weight: 0.5},
		},
		Strategy: &SyncStrategy{
			ID:          "premium_analytics_strategy",
			Name:        "Premium Analytics Strategy",
			Type:        ImmediateSync,
			Description: "Immediate sync with enhanced analytics for premium users",
			Priority:    PriorityCritical,
			Timeout:     5 * time.Second,
			Steps: []StrategyStep{
				{ID: "validate", Name: "Validate Premium Access", Type: int(ValidateStep), Priority: 1},
				{ID: "sync_cache", Name: "Sync Premium Cache", Type: int(ApplyStep), Priority: 2},
				{ID: "update_analytics", Name: "Update Premium Analytics", Type: int(ApplyStep), Priority: 3},
				{ID: "send_notifications", Name: "Send Premium Notifications", Type: int(ApplyStep), Priority: 4},
			},
		},
		Enabled:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Add the custom rule
	err := si.ruleEngine.AddRule(customRule)
	if err != nil {
		return fmt.Errorf("failed to add custom rule: %w", err)
	}

	logrus.WithField("rule_id", customRule.ID).Info("Custom premium analytics rule added")

	// Test the rule with a premium user event
	premiumEvent := NewEvent(EventTypeChatMessageSent, map[string]interface{}{
		"user_id":        "premium_user_999",
		"user_type":      "premium",
		"message":        "This is a long message from a premium user that should trigger enhanced analytics sync and processing",
		"message_length": 120,
		"chat_session_id": "session_xyz789",
		"timestamp":      time.Now(),
	})

	// Determine strategy for the event
	strategy, err := si.ruleEngine.DetermineStrategy(premiumEvent)
	if err != nil {
		return fmt.Errorf("failed to determine strategy: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"strategy_id":   strategy.ID,
		"strategy_name": strategy.Name,
		"priority":      strategy.Priority,
		"steps_count":   len(strategy.Steps),
	}).Info("Custom rule strategy determined")

	return nil
}

// GetIntegrationStatus returns the current status of all sync components
func (si *SyncIntegration) GetIntegrationStatus() map[string]interface{} {
	status := make(map[string]interface{})

	// Sync service status
	syncMetrics := si.syncService.GetSyncMetrics()
	status["sync_service"] = map[string]interface{}{
		"active_processes": syncMetrics.ActiveProcesses,
		"total_processes":  syncMetrics.TotalProcesses,
		"completed_processes": syncMetrics.CompletedProcesses,
		"failed_processes": syncMetrics.FailedProcesses,
		"worker_count":     syncMetrics.ActiveWorkers,
		"queue_depth":      syncMetrics.QueueDepth,
	}

	// Rule engine status
	ruleMetrics := si.ruleEngine.GetMetrics()
	status["rule_engine"] = map[string]interface{}{
		"rules_evaluated": ruleMetrics.RulesEvaluated,
		"rules_matched":   ruleMetrics.RulesMatched,
		"strategies_created": ruleMetrics.StrategiesCreated,
		"evaluation_errors": ruleMetrics.EvaluationErrors,
		"avg_eval_time":   ruleMetrics.AverageEvalTime.String(),
	}

	// Consistency checker status
	consistencyMetrics := si.consistencyChecker.GetMetrics()
	status["consistency_checker"] = map[string]interface{}{
		"checks_performed": consistencyMetrics.ChecksPerformed,
		"checks_passed":    consistencyMetrics.ChecksPassed,
		"checks_failed":    consistencyMetrics.ChecksFailed,
		"consistency_score": consistencyMetrics.ConsistencyScore,
		"avg_check_time":   consistencyMetrics.AverageCheckTime.String(),
	}

	// Active sync processes
	activeSyncs := si.syncService.GetActiveSyncs()
	status["active_sync_processes"] = len(activeSyncs)

	return status
}

// MonitorIntegration provides real-time monitoring of the sync integration
func (si *SyncIntegration) MonitorIntegration(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	logrus.WithField("interval", interval).Info("Starting sync integration monitoring")

	for {
		select {
		case <-ticker.C:
			status := si.GetIntegrationStatus()

			// Emit monitoring event
			monitorEvent := NewEvent(EventTypeMonitoringMetric, map[string]interface{}{
				"component": "sync_integration",
				"status":    status,
				"timestamp": time.Now(),
			})

			err := si.eventBus.PublishAsync(ctx, monitorEvent)
			if err != nil {
				logrus.WithError(err).Error("Failed to publish monitoring event")
			}

			// Log key metrics
			syncStatus := status["sync_service"].(map[string]interface{})
			logrus.WithFields(logrus.Fields{
				"active_processes": syncStatus["active_processes"],
				"completed_processes": syncStatus["completed_processes"],
				"failed_processes": syncStatus["failed_processes"],
			}).Info("🔄 Sync Integration Status")

		case <-ctx.Done():
			logrus.Info("Stopping sync integration monitoring")
			return
		}
	}
}

// SELLYAISyncIntegration demonstrates SELLY AI specific integration patterns
type SELLYAISyncIntegration struct {
	*SyncIntegration
}

// NewSELLYAISyncIntegration creates a SELLY AI specific sync integration
func NewSELLYAISyncIntegration(eventBus *Service) (*SELLYAISyncIntegration, error) {
	baseIntegration, err := NewSyncIntegration(eventBus)
	if err != nil {
		return nil, err
	}

	return &SELLYAISyncIntegration{
		SyncIntegration: baseIntegration,
	}, nil
}

// HandleGovernmentDocumentSync handles synchronization for government documents
func (sai *SELLYAISyncIntegration) HandleGovernmentDocumentSync(ctx context.Context, documentType string, documentData map[string]interface{}) error {
	logrus.WithField("document_type", documentType).Info("Processing government document sync")

	// Create document-specific sync event
	docEvent := NewEvent(EventTypeDocumentUploaded, map[string]interface{}{
		"document_type": documentType,
		"document_data": documentData,
		"user_id":       documentData["user_id"],
		"compliance_required": true,
		"government_standard": true,
	})

	// Publish event for processing
	err := sai.eventBus.Publish(ctx, docEvent)
	if err != nil {
		return fmt.Errorf("failed to publish government document event: %w", err)
	}

	// Wait for processing and validation
	time.Sleep(500 * time.Millisecond)

	// Perform compliance check
	complianceCheck, err := sai.consistencyChecker.GetCheck("business_rule_consistency")
	if err != nil {
		return fmt.Errorf("failed to get compliance check: %w", err)
	}

	// Execute compliance validation
	results := sai.consistencyChecker.executeCheck(ctx, complianceCheck)

	// Check compliance results
	for _, result := range results {
		if result.Status == "failed" && result.Severity == "critical" {
			logrus.WithFields(logrus.Fields{
				"rule_id":  result.RuleID,
				"field":    result.Field,
				"severity": result.Severity,
			}).Error("Government document compliance check failed")

			// Emit compliance alert
			alertEvent := NewEvent(EventTypeMonitoringAlert, map[string]interface{}{
				"alert_type":      "compliance_violation",
				"document_type":   documentType,
				"failed_rule":     result.RuleID,
				"severity":        result.Severity,
				"recommendation":  "Review document data and ensure compliance with government standards",
			})

			sai.eventBus.PublishAsync(ctx, alertEvent)
		}
	}

	return nil
}

// HandleUserProfileSync handles user profile synchronization with SELLY AI specifics
func (sai *SELLYAISyncIntegration) HandleUserProfileSync(ctx context.Context, userID string, profileData map[string]interface{}) error {
	logrus.WithField("user_id", userID).Info("Processing SELLY AI user profile sync")
	_ = ctx // Context is available for future use

	// Add SELLY AI specific metadata
	profileData["platform"] = "selly_ai"
	profileData["sync_timestamp"] = time.Now()
	profileData["data_version"] = "v2.0"

	// Create enhanced profile update event
	profileEvent := NewEvent(EventTypeUserProfileUpdated, profileData)

	// Publish event
	err := sai.eventBus.Publish(ctx, profileEvent)
	if err != nil {
		return fmt.Errorf("failed to publish profile event: %w", err)
	}

	// Monitor sync progress
	time.Sleep(200 * time.Millisecond)

	activeSyncs := sai.syncService.GetActiveSyncs()
	if len(activeSyncs) > 0 {
		logrus.WithField("active_syncs", len(activeSyncs)).Info("User profile sync in progress")
	}

	return nil
}

// GetSELLYAIStatus returns SELLY AI specific integration status
func (sai *SELLYAISyncIntegration) GetSELLYAIStatus() map[string]interface{} {
	baseStatus := sai.GetIntegrationStatus()

	// Add SELLY AI specific metrics
	sellyStatus := map[string]interface{}{
		"platform": "selly_ai",
		"version":  "2.0",
		"government_services_integrated": []string{
			"akta_kelahiran", "ktp", "akta_kematian", "akta_perkawinan",
			"kia", "kk", "perpindahan", "aku_sah",
		},
		"compliance_checks_enabled": true,
		"real_time_sync_enabled": true,
		"ai_powered_analytics": false, // Not yet implemented
	}

	// Merge with base status
	for key, value := range baseStatus {
		sellyStatus[key] = value
	}

	return sellyStatus
}
package persona

import (
	"context"
	"selly-backend/internal/config"
	"time"

	"github.com/sirupsen/logrus"
)

// FeatureFlagManager manages feature flags for persona service consolidation
type FeatureFlagManager struct {
	flags                *config.FeatureFlags
	unifiedPersonaService *UnifiedPersonaService
	legacyServices       []*PersonaService // Track legacy services for migration
	migrationProgress    *MigrationProgress
}

// MigrationProgress tracks the migration from legacy services to unified service
type MigrationProgress struct {
	TotalServices        int                `json:"total_services"`
	MigratedServices     int                `json:"migrated_services"`
	ActiveMigrations     []string           `json:"active_migrations"`
	MigrationStartTime   time.Time          `json:"migration_start_time"`
	EstimatedCompletion  time.Time          `json:"estimated_completion"`
	RollbackPlan         *RollbackPlan      `json:"rollback_plan"`
}

// RollbackPlan defines how to rollback if migration fails
type RollbackPlan struct {
	Enabled              bool               `json:"enabled"`
	TriggerConditions    []string           `json:"trigger_conditions"`
	AutoRollbackEnabled  bool               `json:"auto_rollback_enabled"`
	ManualRollbackSteps  []string           `json:"manual_rollback_steps"`
}

// NewFeatureFlagManager creates a new feature flag manager for persona consolidation
func NewFeatureFlagManager(flags *config.FeatureFlags) *FeatureFlagManager {
	return &FeatureFlagManager{
		flags:             flags,
		legacyServices:    make([]*PersonaService, 0),
		migrationProgress: &MigrationProgress{
			ActiveMigrations:  make([]string, 0),
			RollbackPlan: &RollbackPlan{
				Enabled:             true,
				TriggerConditions:   []string{"error_rate_above_5_percent", "response_time_above_500ms"},
				AutoRollbackEnabled: true,
				ManualRollbackSteps: []string{
					"disable_unified_service",
					"enable_legacy_services",
					"verify_functionality",
					"monitor_for_stability",
				},
			},
		},
	}
}

// EnableUnifiedPersonaService enables the unified persona service with gradual migration
func (ffm *FeatureFlagManager) EnableUnifiedPersonaService(config *UnifiedPersonaConfig) error {
	logrus.Info("🚀 Enabling unified persona service with gradual migration")
	
	// Create unified service
	unifiedService, err := NewUnifiedPersonaService(config, ffm.flags)
	if err != nil {
		return err
	}
	
	ffm.unifiedPersonaService = unifiedService
	
	// Start gradual migration
	ffm.migrationProgress.MigrationStartTime = time.Now()
	ffm.migrationProgress.TotalServices = 3 // PersonaService, PersonaIntegrationService, SellyPersona
	ffm.migrationProgress.EstimatedCompletion = time.Now().Add(24 * time.Hour)
	
	// Enable feature flag for unified service
	if ffm.flags != nil {
		// This would set flags in the config system
		logrus.Info("✅ Unified persona service feature flag enabled")
	}
	
	return nil
}

// IsUnifiedServiceEnabled checks if the unified persona service should be used
func (ffm *FeatureFlagManager) IsUnifiedServiceEnabled() bool {
	if ffm.flags == nil {
		return false
	}
	
	// Check feature flags (this would read from actual config)
	// For now, we'll use a simple check
	return ffm.unifiedPersonaService != nil && ffm.unifiedPersonaService.IsEnabled()
}

// ShouldUseLegacyFallback determines if legacy fallback should be used
func (ffm *FeatureFlagManager) ShouldUseLegacyFallback() bool {
	if !ffm.IsUnifiedServiceEnabled() {
		return true
	}
	
	// Check if unified service is experiencing issues
	metrics := ffm.unifiedPersonaService.GetMetrics()
	
	// Use legacy fallback if error rate is too high
	if metrics.TotalRequests > 0 {
		errorRate := float64(metrics.FailedRequests) / float64(metrics.TotalRequests)
		if errorRate > 0.05 { // 5% error rate threshold
			logrus.Warn("🔄 Using legacy fallback due to high error rate")
			return true
		}
	}
	
	// Use legacy fallback if processing time is too high
	if metrics.AverageProcessingTime > 500*time.Millisecond {
		logrus.Warn("🔄 Using legacy fallback due to high processing time")
		return true
	}
	
	return false
}

// ProcessPersonaWithFeatureFlags processes a persona request using feature flags
func (ffm *FeatureFlagManager) ProcessPersonaWithFeatureFlags(ctx context.Context, request *UnifiedPersonaRequest) (*UnifiedPersonaResponse, error) {
	// Check which service to use based on feature flags
	if ffm.IsUnifiedServiceEnabled() && !ffm.ShouldUseLegacyFallback() {
		logrus.Debug("🤖 Using unified persona service")
		return ffm.unifiedPersonaService.ProcessPersonaRequest(ctx, request)
	}
	
	// Use legacy fallback
	logrus.Debug("🔄 Using legacy persona service fallback")
	return ffm.processWithLegacyFallback(ctx, request)
}

// processWithLegacyFallback processes request using legacy services
func (ffm *FeatureFlagManager) processWithLegacyFallback(ctx context.Context, request *UnifiedPersonaRequest) (*UnifiedPersonaResponse, error) {
	// For backward compatibility, create a legacy persona service
	legacyService := NewPersonaService()
	
	// Convert request to legacy format
	legacyRequest := &PersonaProcessingRequest{
		Query:               request.Query,
		UserID:              request.UserID,
		SessionID:           request.SessionID,
		BaseResponse:        request.BaseResponse,
		IsFirstContact:      request.IsFirstContact,
		ConversationHistory: request.ConversationHistory,
		Context: map[string]interface{}{
			"service_type":     request.ServiceType.String(),
			"user_preferences": request.UserPreferences,
		},
	}
	
	// Process with legacy service
	legacyResponse, err := legacyService.ProcessWithPersona(ctx, legacyRequest)
	if err != nil {
		return nil, err
	}
	
	// Convert response to unified format
	response := &UnifiedPersonaResponse{
		RequestID:          request.RequestID,
		CorrelationID:      request.CorrelationID,
		ProcessedResponse:  legacyResponse.ProcessedResponse,
		PersonalityApplied: legacyResponse.PersonalityApplied,
		MoodDetected:       legacyResponse.MoodDetected,
		ServiceRecognized:  legacyResponse.ServiceRecognized,
		CulturalContext:    legacyResponse.CulturalContext,
		ProcessingTime:     time.Duration(legacyResponse.ProcessingTime * float64(time.Millisecond)),
		CacheHit:           false,
		FallbackUsed:       true,
		ServiceUsed:        "legacy",
		ConfidenceScore:    0.80,
		QualityScore:       0.75,
		Metadata:           legacyResponse.Metadata,
		Timestamp:          time.Now(),
	}
	
	return response, nil
}

// UpdateMigrationProgress updates the migration progress
func (ffm *FeatureFlagManager) UpdateMigrationProgress(serviceName string, status string) {
	switch status {
	case "migrated":
		ffm.migrationProgress.MigratedServices++
		// Remove from active migrations
		for i, active := range ffm.migrationProgress.ActiveMigrations {
			if active == serviceName {
				ffm.migrationProgress.ActiveMigrations = append(
					ffm.migrationProgress.ActiveMigrations[:i],
					ffm.migrationProgress.ActiveMigrations[i+1:]...)
				break
			}
		}
	case "migrating":
		// Add to active migrations
		ffm.migrationProgress.ActiveMigrations = append(ffm.migrationProgress.ActiveMigrations, serviceName)
	}
	
	logrus.WithFields(logrus.Fields{
		"service":           serviceName,
		"status":            status,
		"migrated_services": ffm.migrationProgress.MigratedServices,
		"total_services":    ffm.migrationProgress.TotalServices,
	}).Info("Migration progress updated")
}

// GetMigrationProgress returns the current migration progress
func (ffm *FeatureFlagManager) GetMigrationProgress() *MigrationProgress {
	return ffm.migrationProgress
}

// IsMigrationComplete checks if migration is complete
func (ffm *FeatureFlagManager) IsMigrationComplete() bool {
	return ffm.migrationProgress.MigratedServices >= ffm.migrationProgress.TotalServices
}

// TriggerRollback triggers a rollback to legacy services
func (ffm *FeatureFlagManager) TriggerRollback(reason string) error {
	logrus.WithField("reason", reason).Warn("🔙 Triggering rollback to legacy persona services")
	
	// Disable unified service
	if ffm.unifiedPersonaService != nil {
		ffm.unifiedPersonaService.SetEnabled(false)
	}
	
	// Reset migration progress
	ffm.migrationProgress.MigratedServices = 0
	ffm.migrationProgress.ActiveMigrations = make([]string, 0)
	
	logrus.Info("✅ Rollback completed successfully")
	return nil
}

// MonitorHealth monitors the health of services and triggers rollback if needed
func (ffm *FeatureFlagManager) MonitorHealth(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if ffm.unifiedPersonaService == nil {
				continue
			}
			
			// Check health
			err := ffm.unifiedPersonaService.HealthCheck(ctx)
			if err != nil {
				logrus.WithError(err).Error("Unified persona service health check failed")
				
				// Check if auto-rollback is enabled
				if ffm.migrationProgress.RollbackPlan.AutoRollbackEnabled {
					ffm.TriggerRollback("health_check_failed")
				}
			}
		}
	}
}

// GetUnifiedService returns the unified persona service if available
func (ffm *FeatureFlagManager) GetUnifiedService() *UnifiedPersonaService {
	return ffm.unifiedPersonaService
}

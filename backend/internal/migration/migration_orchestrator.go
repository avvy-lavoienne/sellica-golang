package migration

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// MigrationOrchestrator manages zero-downtime migration with automated rollback
// Phase 3 Week 5 Days 31-32: Zero-downtime Migration Strategy Implementation
type MigrationOrchestrator struct {
	config              *MigrationConfig
	trafficController   *TrafficController
	healthMonitor       *MigrationHealthMonitor
	rollbackManager     *RollbackManager
	migrationValidator  *MigrationValidator
	
	// Migration state
	currentPhase        MigrationPhase
	migrationStatus     MigrationStatus
	startTime          time.Time
	phaseHistory       []PhaseExecution
	
	// Safety mechanisms
	rollbackTriggers   []RollbackTrigger
	safetyChecks       []SafetyCheck
	emergencyStop      chan struct{}
	
	// Synchronization
	mu                 sync.RWMutex
	phaseTransition    sync.Mutex
}

// MigrationConfig defines migration configuration
type MigrationConfig struct {
	// Traffic migration phases
	TrafficPhases      []TrafficPhase
	
	// Timing configuration
	PhaseInterval      time.Duration
	HealthCheckInterval time.Duration
	RollbackTimeout    time.Duration
	
	// Safety thresholds
	MaxErrorRate       float64
	MinSuccessRate     float64
	MaxResponseTime    time.Duration
	
	// Rollback configuration
	AutoRollbackEnabled bool
	RollbackThresholds  *RollbackThresholds
	
	// Validation configuration
	ValidationEnabled   bool
	ValidationTimeout   time.Duration
}

// TrafficPhase defines a traffic migration phase
type TrafficPhase struct {
	Name               string
	TrafficPercentage  float64
	Duration           time.Duration
	HealthCheckInterval time.Duration
	ValidationChecks   []string
	RollbackConditions []RollbackCondition
}

// RollbackThresholds defines rollback trigger thresholds
type RollbackThresholds struct {
	ErrorRateThreshold    float64
	ResponseTimeThreshold time.Duration
	HealthScoreThreshold  float64
	ConsecutiveFailures   int
}

// MigrationPhase represents current migration phase
type MigrationPhase string

const (
	MigrationPhaseIdle        MigrationPhase = "idle"
	MigrationPhaseInitializing MigrationPhase = "initializing"
	MigrationPhase10Percent   MigrationPhase = "10_percent"
	MigrationPhase50Percent   MigrationPhase = "50_percent"
	MigrationPhase100Percent  MigrationPhase = "100_percent"
	MigrationPhaseCompleted   MigrationPhase = "completed"
	MigrationPhaseRollingBack MigrationPhase = "rolling_back"
	MigrationPhaseRolledBack  MigrationPhase = "rolled_back"
	MigrationPhaseFailed      MigrationPhase = "failed"
)

// MigrationStatus represents migration status
type MigrationStatus string

const (
	MigrationStatusReady      MigrationStatus = "ready"
	MigrationStatusInProgress MigrationStatus = "in_progress"
	MigrationStatusCompleted  MigrationStatus = "completed"
	MigrationStatusFailed     MigrationStatus = "failed"
	MigrationStatusRolledBack MigrationStatus = "rolled_back"
)

// PhaseExecution tracks phase execution details
type PhaseExecution struct {
	Phase          MigrationPhase
	StartTime      time.Time
	EndTime        *time.Time
	Duration       time.Duration
	Status         string
	Metrics        *PhaseMetrics
	HealthChecks   []HealthCheckResult
	Issues         []MigrationIssue
}

// PhaseMetrics tracks metrics during a migration phase
type PhaseMetrics struct {
	TrafficPercentage   float64
	RequestCount        int64
	ErrorCount          int64
	ErrorRate           float64
	AverageResponseTime time.Duration
	HealthScore         float64
	ThroughputRPS       float64
}

// MigrationIssue represents an issue during migration
type MigrationIssue struct {
	Timestamp   time.Time
	Severity    string
	Component   string
	Description string
	Impact      string
	Resolution  string
}

// NewMigrationOrchestrator creates a new migration orchestrator
func NewMigrationOrchestrator(config *MigrationConfig) *MigrationOrchestrator {
	return &MigrationOrchestrator{
		config: config,
		trafficController: NewTrafficController(&TrafficControllerConfig{
			InitialPercentage: 0.0,
			MaxPercentage:     100.0,
			StepSize:          10.0,
		}),
		healthMonitor: NewMigrationHealthMonitor(&HealthMonitorConfig{
			CheckInterval:     config.HealthCheckInterval,
			FailureThreshold:  3,
			RecoveryThreshold: 2,
		}),
		rollbackManager: NewRollbackManager(&RollbackConfig{
			Enabled:         config.AutoRollbackEnabled,
			Timeout:         config.RollbackTimeout,
			MaxAttempts:     3,
			BackupStrategy:  "snapshot",
		}),
		migrationValidator: NewMigrationValidator(&ValidationConfig{
			Enabled:           config.ValidationEnabled,
			Timeout:           config.ValidationTimeout,
			CriticalChecks:    []string{"database", "cache", "api"},
			PerformanceChecks: []string{"response_time", "throughput", "error_rate"},
		}),
		currentPhase:    MigrationPhaseIdle,
		migrationStatus: MigrationStatusReady,
		phaseHistory:    make([]PhaseExecution, 0),
		rollbackTriggers: make([]RollbackTrigger, 0),
		safetyChecks:    make([]SafetyCheck, 0),
		emergencyStop:   make(chan struct{}),
	}
}

// StartMigration starts the zero-downtime migration process
func (mo *MigrationOrchestrator) StartMigration(ctx context.Context) error {
	mo.mu.Lock()
	defer mo.mu.Unlock()
	
	if mo.migrationStatus != MigrationStatusReady {
		return fmt.Errorf("migration is not ready to start, current status: %s", mo.migrationStatus)
	}
	
	logrus.Info("🚀 Starting zero-downtime migration process...")
	
	// Initialize migration
	mo.migrationStatus = MigrationStatusInProgress
	mo.currentPhase = MigrationPhaseInitializing
	mo.startTime = time.Now()
	
	// Start health monitoring
	go mo.startHealthMonitoring(ctx)
	
	// Start safety monitoring
	go mo.startSafetyMonitoring(ctx)
	
	// Execute migration phases
	go mo.executeMigrationPhases(ctx)
	
	logrus.Info("✅ Zero-downtime migration started successfully")
	return nil
}

// executeMigrationPhases executes the migration phases sequentially
func (mo *MigrationOrchestrator) executeMigrationPhases(ctx context.Context) {
	defer func() {
		if r := recover(); r != nil {
			logrus.Errorf("Migration panic recovered: %v", r)
			mo.handleMigrationFailure(ctx, fmt.Errorf("migration panic: %v", r))
		}
	}()
	
	phases := []struct {
		phase      MigrationPhase
		percentage float64
		duration   time.Duration
	}{
		{MigrationPhase10Percent, 10.0, 10 * time.Minute},
		{MigrationPhase50Percent, 50.0, 15 * time.Minute},
		{MigrationPhase100Percent, 100.0, 20 * time.Minute},
	}
	
	for _, phaseConfig := range phases {
		select {
		case <-ctx.Done():
			logrus.Info("Migration cancelled by context")
			return
		case <-mo.emergencyStop:
			logrus.Info("Migration stopped by emergency signal")
			return
		default:
			if err := mo.executePhase(ctx, phaseConfig.phase, phaseConfig.percentage, phaseConfig.duration); err != nil {
				logrus.Errorf("Phase %s failed: %v", phaseConfig.phase, err)
				mo.handleMigrationFailure(ctx, err)
				return
			}
		}
	}
	
	// Complete migration
	mo.completeMigration(ctx)
}

// executePhase executes a single migration phase
func (mo *MigrationOrchestrator) executePhase(ctx context.Context, phase MigrationPhase, percentage float64, duration time.Duration) error {
	mo.phaseTransition.Lock()
	defer mo.phaseTransition.Unlock()
	
	logrus.Infof("🔄 Starting migration phase: %s (%.1f%% traffic)", phase, percentage)
	
	// Record phase start
	phaseExecution := PhaseExecution{
		Phase:     phase,
		StartTime: time.Now(),
		Status:    "starting",
		Metrics:   &PhaseMetrics{TrafficPercentage: percentage},
		HealthChecks: make([]HealthCheckResult, 0),
		Issues:    make([]MigrationIssue, 0),
	}
	
	// Update current phase
	mo.mu.Lock()
	mo.currentPhase = phase
	mo.mu.Unlock()
	
	// Pre-phase validation
	if mo.config.ValidationEnabled {
		if err := mo.migrationValidator.ValidatePrePhase(ctx, phase); err != nil {
			return fmt.Errorf("pre-phase validation failed: %w", err)
		}
	}
	
	// Gradually shift traffic
	if err := mo.trafficController.SetTrafficPercentage(ctx, percentage); err != nil {
		return fmt.Errorf("failed to set traffic percentage: %w", err)
	}
	
	// Monitor phase execution
	phaseCtx, cancel := context.WithTimeout(ctx, duration)
	defer cancel()
	
	phaseExecution.Status = "monitoring"
	
	// Monitor phase health
	if err := mo.monitorPhaseHealth(phaseCtx, &phaseExecution); err != nil {
		return fmt.Errorf("phase health monitoring failed: %w", err)
	}
	
	// Post-phase validation
	if mo.config.ValidationEnabled {
		if err := mo.migrationValidator.ValidatePostPhase(ctx, phase); err != nil {
			return fmt.Errorf("post-phase validation failed: %w", err)
		}
	}
	
	// Complete phase
	now := time.Now()
	phaseExecution.EndTime = &now
	phaseExecution.Duration = time.Since(phaseExecution.StartTime)
	phaseExecution.Status = "completed"
	
	// Record phase execution
	mo.mu.Lock()
	mo.phaseHistory = append(mo.phaseHistory, phaseExecution)
	mo.mu.Unlock()
	
	logrus.Infof("✅ Migration phase %s completed successfully in %v", phase, phaseExecution.Duration)
	return nil
}

// monitorPhaseHealth monitors health during a migration phase
func (mo *MigrationOrchestrator) monitorPhaseHealth(ctx context.Context, phaseExecution *PhaseExecution) error {
	ticker := time.NewTicker(mo.config.HealthCheckInterval)
	defer ticker.Stop()
	
	consecutiveFailures := 0
	
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			// Perform health check
			healthResult := mo.healthMonitor.CheckHealth(ctx)
			phaseExecution.HealthChecks = append(phaseExecution.HealthChecks, healthResult)
			
			// Update metrics
			mo.updatePhaseMetrics(phaseExecution)
			
			// Check rollback conditions
			if mo.shouldTriggerRollback(phaseExecution) {
				return fmt.Errorf("rollback conditions met during phase monitoring")
			}
			
			// Check health status
			if healthResult.Status != "healthy" {
				consecutiveFailures++
				logrus.Warnf("⚠️ Health check failed (%d consecutive failures): %s", consecutiveFailures, healthResult.Message)
				
				if consecutiveFailures >= mo.config.RollbackThresholds.ConsecutiveFailures {
					return fmt.Errorf("too many consecutive health check failures: %d", consecutiveFailures)
				}
			} else {
				consecutiveFailures = 0
			}
		}
	}
}

// updatePhaseMetrics updates metrics for the current phase
func (mo *MigrationOrchestrator) updatePhaseMetrics(phaseExecution *PhaseExecution) {
	// Get current metrics from traffic controller
	metrics := mo.trafficController.GetMetrics()
	
	phaseExecution.Metrics.RequestCount = metrics.TotalRequests
	phaseExecution.Metrics.ErrorCount = metrics.ErrorCount
	
	if metrics.TotalRequests > 0 {
		phaseExecution.Metrics.ErrorRate = float64(metrics.ErrorCount) / float64(metrics.TotalRequests)
	}
	
	phaseExecution.Metrics.AverageResponseTime = metrics.AverageResponseTime
	phaseExecution.Metrics.ThroughputRPS = metrics.RequestsPerSecond
	phaseExecution.Metrics.HealthScore = mo.calculateHealthScore(phaseExecution)
}

// calculateHealthScore calculates overall health score for a phase
func (mo *MigrationOrchestrator) calculateHealthScore(phaseExecution *PhaseExecution) float64 {
	score := 1.0
	
	// Penalize high error rates
	if phaseExecution.Metrics.ErrorRate > mo.config.MaxErrorRate {
		score -= 0.3
	}
	
	// Penalize slow response times
	if phaseExecution.Metrics.AverageResponseTime > mo.config.MaxResponseTime {
		score -= 0.2
	}
	
	// Consider recent health checks
	if len(phaseExecution.HealthChecks) > 0 {
		recentChecks := phaseExecution.HealthChecks
		if len(recentChecks) > 5 {
			recentChecks = recentChecks[len(recentChecks)-5:] // Last 5 checks
		}
		
		healthyCount := 0
		for _, check := range recentChecks {
			if check.Status == "healthy" {
				healthyCount++
			}
		}
		
		healthRatio := float64(healthyCount) / float64(len(recentChecks))
		score *= healthRatio
	}
	
	// Ensure score is between 0 and 1
	if score < 0 {
		score = 0
	} else if score > 1 {
		score = 1
	}
	
	return score
}

// shouldTriggerRollback checks if rollback conditions are met
func (mo *MigrationOrchestrator) shouldTriggerRollback(phaseExecution *PhaseExecution) bool {
	if !mo.config.AutoRollbackEnabled {
		return false
	}
	
	thresholds := mo.config.RollbackThresholds
	
	// Check error rate threshold
	if phaseExecution.Metrics.ErrorRate > thresholds.ErrorRateThreshold {
		logrus.Warnf("⚠️ Error rate threshold exceeded: %.2f%% > %.2f%%", 
			phaseExecution.Metrics.ErrorRate*100, thresholds.ErrorRateThreshold*100)
		return true
	}
	
	// Check response time threshold
	if phaseExecution.Metrics.AverageResponseTime > thresholds.ResponseTimeThreshold {
		logrus.Warnf("⚠️ Response time threshold exceeded: %v > %v", 
			phaseExecution.Metrics.AverageResponseTime, thresholds.ResponseTimeThreshold)
		return true
	}
	
	// Check health score threshold
	if phaseExecution.Metrics.HealthScore < thresholds.HealthScoreThreshold {
		logrus.Warnf("⚠️ Health score threshold exceeded: %.2f < %.2f", 
			phaseExecution.Metrics.HealthScore, thresholds.HealthScoreThreshold)
		return true
	}
	
	return false
}

// handleMigrationFailure handles migration failure and triggers rollback
func (mo *MigrationOrchestrator) handleMigrationFailure(ctx context.Context, err error) {
	mo.mu.Lock()
	defer mo.mu.Unlock()
	
	logrus.Errorf("🚨 Migration failure detected: %v", err)
	
	mo.currentPhase = MigrationPhaseRollingBack
	mo.migrationStatus = MigrationStatusFailed
	
	// Trigger rollback
	if mo.config.AutoRollbackEnabled {
		go mo.executeRollback(ctx, err)
	}
}

// executeRollback executes the rollback process
func (mo *MigrationOrchestrator) executeRollback(ctx context.Context, originalError error) {
	logrus.Info("🔄 Starting automatic rollback process...")
	
	rollbackCtx, cancel := context.WithTimeout(ctx, mo.config.RollbackTimeout)
	defer cancel()
	
	if err := mo.rollbackManager.ExecuteRollback(rollbackCtx); err != nil {
		logrus.Errorf("❌ Rollback failed: %v", err)
		mo.mu.Lock()
		mo.migrationStatus = MigrationStatusFailed
		mo.currentPhase = MigrationPhaseFailed
		mo.mu.Unlock()
		return
	}
	
	// Reset traffic to 0%
	if err := mo.trafficController.SetTrafficPercentage(rollbackCtx, 0.0); err != nil {
		logrus.Errorf("Failed to reset traffic during rollback: %v", err)
	}
	
	mo.mu.Lock()
	mo.migrationStatus = MigrationStatusRolledBack
	mo.currentPhase = MigrationPhaseRolledBack
	mo.mu.Unlock()
	
	logrus.Info("✅ Rollback completed successfully")
}

// completeMigration completes the migration process
func (mo *MigrationOrchestrator) completeMigration(ctx context.Context) {
	mo.mu.Lock()
	defer mo.mu.Unlock()
	
	mo.currentPhase = MigrationPhaseCompleted
	mo.migrationStatus = MigrationStatusCompleted
	
	duration := time.Since(mo.startTime)
	
	logrus.Infof("🎉 Zero-downtime migration completed successfully in %v", duration)
	
	// Final validation
	if mo.config.ValidationEnabled {
		go func() {
			if err := mo.migrationValidator.ValidateFinalState(ctx); err != nil {
				logrus.Errorf("Final validation failed: %v", err)
			} else {
				logrus.Info("✅ Final migration validation passed")
			}
		}()
	}
}

// startHealthMonitoring starts continuous health monitoring
func (mo *MigrationOrchestrator) startHealthMonitoring(ctx context.Context) {
	ticker := time.NewTicker(mo.config.HealthCheckInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Continuous health monitoring during migration
			healthResult := mo.healthMonitor.CheckHealth(ctx)
			if healthResult.Status != "healthy" {
				logrus.Warnf("⚠️ Health monitoring alert: %s", healthResult.Message)
			}
		}
	}
}

// startSafetyMonitoring starts safety monitoring
func (mo *MigrationOrchestrator) startSafetyMonitoring(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Check safety conditions
			for _, safetyCheck := range mo.safetyChecks {
				if !safetyCheck.Check() {
					logrus.Warnf("⚠️ Safety check failed: %s", safetyCheck.Name)
				}
			}
		}
	}
}

// GetMigrationStatus returns current migration status
func (mo *MigrationOrchestrator) GetMigrationStatus() *MigrationStatusReport {
	mo.mu.RLock()
	defer mo.mu.RUnlock()
	
	return &MigrationStatusReport{
		Status:           mo.migrationStatus,
		CurrentPhase:     mo.currentPhase,
		StartTime:        mo.startTime,
		Duration:         time.Since(mo.startTime),
		PhaseHistory:     mo.phaseHistory,
		TrafficPercentage: mo.trafficController.GetCurrentPercentage(),
		HealthScore:      mo.healthMonitor.GetOverallHealthScore(),
	}
}

// EmergencyStop triggers an emergency stop of the migration
func (mo *MigrationOrchestrator) EmergencyStop(ctx context.Context, reason string) error {
	logrus.Warnf("🚨 Emergency stop triggered: %s", reason)
	
	select {
	case mo.emergencyStop <- struct{}{}:
		// Emergency stop signal sent
	default:
		// Channel already has a signal or is closed
	}
	
	// Immediate rollback
	if mo.config.AutoRollbackEnabled {
		go mo.executeRollback(ctx, fmt.Errorf("emergency stop: %s", reason))
	}
	
	return nil
}

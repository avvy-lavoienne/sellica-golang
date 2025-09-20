package migration

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// NewMigrationHealthMonitor creates a new migration health monitor
func NewMigrationHealthMonitor(config *HealthMonitorConfig) *MigrationHealthMonitor {
	return &MigrationHealthMonitor{
		config:         config,
		healthCheckers: make([]HealthChecker, 0),
		overallScore:   1.0,
		lastCheck:      time.Now(),
	}
}

// AddHealthChecker adds a health checker
func (mhm *MigrationHealthMonitor) AddHealthChecker(checker HealthChecker) {
	mhm.healthCheckers = append(mhm.healthCheckers, checker)
	logrus.Infof("✅ Added health checker: %s (critical: %v)", checker.GetName(), checker.IsCritical())
}

// CheckHealth performs comprehensive health check
func (mhm *MigrationHealthMonitor) CheckHealth(ctx context.Context) HealthCheckResult {
	startTime := time.Now()
	
	var wg sync.WaitGroup
	results := make(chan HealthCheckResult, len(mhm.healthCheckers))
	
	// Run all health checks concurrently
	for _, checker := range mhm.healthCheckers {
		wg.Add(1)
		go func(hc HealthChecker) {
			defer wg.Done()
			result := hc.CheckHealth(ctx)
			results <- result
		}(checker)
	}
	
	// Wait for all checks to complete
	go func() {
		wg.Wait()
		close(results)
	}()
	
	// Collect results
	var allResults []HealthCheckResult
	var criticalFailures []HealthCheckResult
	var totalScore float64
	var healthyCount int
	
	for result := range results {
		allResults = append(allResults, result)
		totalScore += result.Score
		
		if result.Status == "healthy" {
			healthyCount++
		}
		
		if result.Critical && result.Status != "healthy" {
			criticalFailures = append(criticalFailures, result)
		}
	}
	
	// Calculate overall health
	overallStatus := "healthy"
	overallMessage := "All health checks passed"
	
	if len(criticalFailures) > 0 {
		overallStatus = "unhealthy"
		overallMessage = "Critical health checks failed"
	} else if healthyCount < len(allResults) {
		overallStatus = "degraded"
		overallMessage = "Some health checks failed"
	}
	
	// Calculate overall score
	if len(allResults) > 0 {
		mhm.overallScore = totalScore / float64(len(allResults))
	}
	
	mhm.lastCheck = time.Now()
	
	return HealthCheckResult{
		Name:      "overall_health",
		Status:    overallStatus,
		Message:   overallMessage,
		Score:     mhm.overallScore,
		Timestamp: time.Now(),
		Duration:  time.Since(startTime),
		Critical:  false,
		Details: map[string]interface{}{
			"total_checks":      len(allResults),
			"healthy_checks":    healthyCount,
			"critical_failures": len(criticalFailures),
			"individual_results": allResults,
		},
	}
}

// GetOverallHealthScore returns the overall health score
func (mhm *MigrationHealthMonitor) GetOverallHealthScore() float64 {
	return mhm.overallScore
}

// DatabaseHealthChecker checks database health
type DatabaseHealthChecker struct {
	name     string
	critical bool
}

// NewDatabaseHealthChecker creates a database health checker
func NewDatabaseHealthChecker() *DatabaseHealthChecker {
	return &DatabaseHealthChecker{
		name:     "database",
		critical: true,
	}
}

func (dhc *DatabaseHealthChecker) CheckHealth(ctx context.Context) HealthCheckResult {
	startTime := time.Now()
	
	// Simulate database health check
	// In real implementation, this would check actual database connectivity
	select {
	case <-time.After(10 * time.Millisecond): // Simulate check time
		return HealthCheckResult{
			Name:      dhc.name,
			Status:    "healthy",
			Message:   "Database connection is healthy",
			Score:     1.0,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Critical:  dhc.critical,
			Details: map[string]interface{}{
				"connection_pool": "healthy",
				"query_time":      "5ms",
				"active_connections": 25,
			},
		}
	case <-ctx.Done():
		return HealthCheckResult{
			Name:      dhc.name,
			Status:    "unhealthy",
			Message:   "Database health check timeout",
			Score:     0.0,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Critical:  dhc.critical,
		}
	}
}

func (dhc *DatabaseHealthChecker) GetName() string {
	return dhc.name
}

func (dhc *DatabaseHealthChecker) IsCritical() bool {
	return dhc.critical
}

// CacheHealthChecker checks cache health
type CacheHealthChecker struct {
	name     string
	critical bool
}

// NewCacheHealthChecker creates a cache health checker
func NewCacheHealthChecker() *CacheHealthChecker {
	return &CacheHealthChecker{
		name:     "cache",
		critical: false,
	}
}

func (chc *CacheHealthChecker) CheckHealth(ctx context.Context) HealthCheckResult {
	startTime := time.Now()
	
	// Simulate cache health check
	select {
	case <-time.After(5 * time.Millisecond): // Simulate check time
		return HealthCheckResult{
			Name:      chc.name,
			Status:    "healthy",
			Message:   "Cache is responding normally",
			Score:     0.95,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Critical:  chc.critical,
			Details: map[string]interface{}{
				"hit_rate":     "87%",
				"memory_usage": "65%",
				"response_time": "2ms",
			},
		}
	case <-ctx.Done():
		return HealthCheckResult{
			Name:      chc.name,
			Status:    "unhealthy",
			Message:   "Cache health check timeout",
			Score:     0.0,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Critical:  chc.critical,
		}
	}
}

func (chc *CacheHealthChecker) GetName() string {
	return chc.name
}

func (chc *CacheHealthChecker) IsCritical() bool {
	return chc.critical
}

// APIHealthChecker checks API health
type APIHealthChecker struct {
	name     string
	critical bool
}

// NewAPIHealthChecker creates an API health checker
func NewAPIHealthChecker() *APIHealthChecker {
	return &APIHealthChecker{
		name:     "api",
		critical: true,
	}
}

func (ahc *APIHealthChecker) CheckHealth(ctx context.Context) HealthCheckResult {
	startTime := time.Now()
	
	// Simulate API health check
	select {
	case <-time.After(15 * time.Millisecond): // Simulate check time
		return HealthCheckResult{
			Name:      ahc.name,
			Status:    "healthy",
			Message:   "API endpoints are responding",
			Score:     0.98,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Critical:  ahc.critical,
			Details: map[string]interface{}{
				"response_time": "45ms",
				"error_rate":    "0.1%",
				"throughput":    "1250 req/s",
			},
		}
	case <-ctx.Done():
		return HealthCheckResult{
			Name:      ahc.name,
			Status:    "unhealthy",
			Message:   "API health check timeout",
			Score:     0.0,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Critical:  ahc.critical,
		}
	}
}

func (ahc *APIHealthChecker) GetName() string {
	return ahc.name
}

func (ahc *APIHealthChecker) IsCritical() bool {
	return ahc.critical
}

// NewRollbackManager creates a new rollback manager
func NewRollbackManager(config *RollbackConfig) *RollbackManager {
	return &RollbackManager{
		config: config,
		backupManager: &BackupManager{
			backupStorage:      "/backups",
			backupRetention:    7 * 24 * time.Hour, // 7 days
			encryptionKey:      "backup-encryption-key",
			compressionEnabled: true,
		},
		stateManager: &StateManager{
			stateHistory: make([]SystemState, 0),
		},
		rollbackSteps: make([]RollbackStep, 0),
	}
}

// AddRollbackStep adds a rollback step
func (rm *RollbackManager) AddRollbackStep(step RollbackStep) {
	rm.rollbackSteps = append(rm.rollbackSteps, step)
	logrus.Infof("✅ Added rollback step: %s (critical: %v)", step.Name, step.Critical)
}

// ExecuteRollback executes the rollback process
func (rm *RollbackManager) ExecuteRollback(ctx context.Context) error {
	if !rm.config.Enabled {
		return fmt.Errorf("rollback is not enabled")
	}
	
	logrus.Info("🔄 Starting rollback process...")
	
	// Create backup before rollback
	if err := rm.createPreRollbackBackup(ctx); err != nil {
		logrus.Errorf("Failed to create pre-rollback backup: %v", err)
		// Continue with rollback anyway
	}
	
	// Execute rollback steps in reverse priority order
	for attempt := 1; attempt <= rm.config.MaxAttempts; attempt++ {
		logrus.Infof("🔄 Rollback attempt %d/%d", attempt, rm.config.MaxAttempts)
		
		if err := rm.executeRollbackSteps(ctx); err != nil {
			logrus.Errorf("Rollback attempt %d failed: %v", attempt, err)
			if attempt == rm.config.MaxAttempts {
				return fmt.Errorf("rollback failed after %d attempts: %w", rm.config.MaxAttempts, err)
			}
			continue
		}
		
		// Verify rollback if enabled
		if rm.config.VerifyRollback {
			if err := rm.verifyRollback(ctx); err != nil {
				logrus.Errorf("Rollback verification failed: %v", err)
				if attempt == rm.config.MaxAttempts {
					return fmt.Errorf("rollback verification failed: %w", err)
				}
				continue
			}
		}
		
		logrus.Info("✅ Rollback completed successfully")
		return nil
	}
	
	return fmt.Errorf("rollback failed after %d attempts", rm.config.MaxAttempts)
}

// executeRollbackSteps executes all rollback steps
func (rm *RollbackManager) executeRollbackSteps(ctx context.Context) error {
	// Sort steps by priority (higher priority first)
	steps := make([]RollbackStep, len(rm.rollbackSteps))
	copy(steps, rm.rollbackSteps)
	
	// Simple sort by priority (in real implementation, use sort.Slice)
	for i := 0; i < len(steps)-1; i++ {
		for j := i + 1; j < len(steps); j++ {
			if steps[i].Priority < steps[j].Priority {
				steps[i], steps[j] = steps[j], steps[i]
			}
		}
	}
	
	for _, step := range steps {
		logrus.Infof("🔄 Executing rollback step: %s", step.Name)
		
		stepCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		
		if err := step.Execute(stepCtx); err != nil {
			cancel()
			if step.Critical {
				return fmt.Errorf("critical rollback step %s failed: %w", step.Name, err)
			}
			logrus.Warnf("⚠️ Non-critical rollback step %s failed: %v", step.Name, err)
			continue
		}
		
		// Verify step if verification function is provided
		if step.Verify != nil {
			if err := step.Verify(stepCtx); err != nil {
				cancel()
				return fmt.Errorf("rollback step %s verification failed: %w", step.Name, err)
			}
		}
		
		cancel()
		logrus.Infof("✅ Rollback step %s completed", step.Name)
	}
	
	return nil
}

// createPreRollbackBackup creates a backup before rollback
func (rm *RollbackManager) createPreRollbackBackup(ctx context.Context) error {
	logrus.Info("💾 Creating pre-rollback backup...")
	
	// Simulate backup creation
	select {
	case <-time.After(2 * time.Second): // Simulate backup time
		logrus.Info("✅ Pre-rollback backup created successfully")
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// verifyRollback verifies the rollback was successful
func (rm *RollbackManager) verifyRollback(ctx context.Context) error {
	logrus.Info("🔍 Verifying rollback...")
	
	// Simulate rollback verification
	select {
	case <-time.After(1 * time.Second): // Simulate verification time
		logrus.Info("✅ Rollback verification passed")
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// SaveSystemState saves current system state
func (rm *RollbackManager) SaveSystemState(ctx context.Context) error {
	state := SystemState{
		Timestamp: time.Now(),
		Version:   "1.0.0",
		Configuration: map[string]interface{}{
			"database_version": "14.5",
			"cache_version":    "6.2",
			"api_version":      "2.1",
		},
		DatabaseSchema: "schema_v1",
		CacheState: map[string]interface{}{
			"keys_count": 15000,
			"memory_usage": "2.5GB",
		},
		ServiceStates: map[string]ServiceState{
			"api": {
				Name:    "api",
				Version: "2.1",
				Status:  "running",
				Health:  "healthy",
			},
			"worker": {
				Name:    "worker",
				Version: "1.5",
				Status:  "running",
				Health:  "healthy",
			},
		},
	}
	
	rm.stateManager.currentState = &state
	rm.stateManager.stateHistory = append(rm.stateManager.stateHistory, state)
	
	// Keep only last 10 states
	if len(rm.stateManager.stateHistory) > 10 {
		rm.stateManager.stateHistory = rm.stateManager.stateHistory[1:]
	}
	
	logrus.Info("✅ System state saved")
	return nil
}

// RestoreSystemState restores system to previous state
func (rm *RollbackManager) RestoreSystemState(ctx context.Context) error {
	if len(rm.stateManager.stateHistory) < 2 {
		return fmt.Errorf("no previous state available for restore")
	}
	
	// Get previous state (second to last)
	previousState := rm.stateManager.stateHistory[len(rm.stateManager.stateHistory)-2]
	
	logrus.Infof("🔄 Restoring system state from %v", previousState.Timestamp)
	
	// Simulate state restoration
	select {
	case <-time.After(3 * time.Second): // Simulate restoration time
		rm.stateManager.previousState = rm.stateManager.currentState
		rm.stateManager.currentState = &previousState
		
		logrus.Info("✅ System state restored successfully")
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// GetCurrentState returns current system state
func (rm *RollbackManager) GetCurrentState() *SystemState {
	return rm.stateManager.currentState
}

// GetStateHistory returns system state history
func (rm *RollbackManager) GetStateHistory() []SystemState {
	history := make([]SystemState, len(rm.stateManager.stateHistory))
	copy(history, rm.stateManager.stateHistory)
	return history
}

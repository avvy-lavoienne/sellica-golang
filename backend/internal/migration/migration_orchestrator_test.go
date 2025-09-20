package migration

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestMigrationOrchestratorInitialization tests migration orchestrator initialization
func TestMigrationOrchestratorInitialization(t *testing.T) {
	config := &MigrationConfig{
		TrafficPhases: []TrafficPhase{
			{Name: "canary", TrafficPercentage: 10.0, Duration: 5 * time.Minute},
			{Name: "half", TrafficPercentage: 50.0, Duration: 10 * time.Minute},
			{Name: "full", TrafficPercentage: 100.0, Duration: 5 * time.Minute},
		},
		PhaseInterval:       30 * time.Second,
		HealthCheckInterval: 10 * time.Second,
		RollbackTimeout:     5 * time.Minute,
		MaxErrorRate:        0.05,
		MinSuccessRate:      0.95,
		MaxResponseTime:     100 * time.Millisecond,
		AutoRollbackEnabled: true,
		RollbackThresholds: &RollbackThresholds{
			ErrorRateThreshold:    0.10,
			ResponseTimeThreshold: 200 * time.Millisecond,
			HealthScoreThreshold:  0.70,
			ConsecutiveFailures:   3,
		},
		ValidationEnabled: true,
		ValidationTimeout: 30 * time.Second,
	}
	
	t.Run("CreateMigrationOrchestrator", func(t *testing.T) {
		orchestrator := NewMigrationOrchestrator(config)
		require.NotNil(t, orchestrator)
		
		assert.Equal(t, MigrationPhaseIdle, orchestrator.currentPhase)
		assert.Equal(t, MigrationStatusReady, orchestrator.migrationStatus)
		assert.NotNil(t, orchestrator.trafficController)
		assert.NotNil(t, orchestrator.healthMonitor)
		assert.NotNil(t, orchestrator.rollbackManager)
		assert.NotNil(t, orchestrator.migrationValidator)
		
		t.Logf("✅ Migration orchestrator created successfully")
	})
	
	t.Run("GetInitialStatus", func(t *testing.T) {
		orchestrator := NewMigrationOrchestrator(config)
		
		status := orchestrator.GetMigrationStatus()
		require.NotNil(t, status)
		
		assert.Equal(t, MigrationStatusReady, status.Status)
		assert.Equal(t, MigrationPhaseIdle, status.CurrentPhase)
		assert.Equal(t, 0.0, status.TrafficPercentage)
		assert.Equal(t, 1.0, status.HealthScore)
		
		t.Logf("✅ Initial migration status: %+v", status)
	})
}

// TestTrafficController tests traffic controller functionality
func TestTrafficController(t *testing.T) {
	config := &TrafficControllerConfig{
		InitialPercentage: 0.0,
		MaxPercentage:     100.0,
		StepSize:          10.0,
		GradualShift:      true,
		ShiftDuration:     1 * time.Second,
	}
	
	controller := NewTrafficController(config)
	require.NotNil(t, controller)
	
	ctx := context.Background()
	
	t.Run("SetTrafficPercentage", func(t *testing.T) {
		err := controller.SetTrafficPercentage(ctx, 25.0)
		require.NoError(t, err)
		
		assert.Equal(t, 25.0, controller.GetCurrentPercentage())
		
		t.Logf("✅ Traffic percentage set to %.1f%%", controller.GetCurrentPercentage())
	})
	
	t.Run("RouteRequests", func(t *testing.T) {
		// Set traffic to 50%
		err := controller.SetTrafficPercentage(ctx, 50.0)
		require.NoError(t, err)
		
		// Route multiple requests
		newSystemCount := 0
		oldSystemCount := 0
		totalRequests := 100
		
		for i := 0; i < totalRequests; i++ {
			request := &Request{
				ID:        fmt.Sprintf("req_%d", i),
				Timestamp: time.Now(),
				Method:    "GET",
				Path:      "/api/test",
			}
			
			decision, err := controller.RouteRequest(ctx, request)
			require.NoError(t, err)
			require.NotNil(t, decision)
			
			if decision.Destination == "new_system" {
				newSystemCount++
			} else {
				oldSystemCount++
			}
			
			// Record result
			result := &RequestResult{
				RequestID:    request.ID,
				Destination:  decision.Destination,
				Success:      true,
				ResponseTime: 50 * time.Millisecond,
				StatusCode:   200,
				Timestamp:    time.Now(),
			}
			controller.RecordRequestResult(ctx, result)
		}
		
		// Check distribution (should be roughly 50/50 with some variance)
		newSystemPercentage := float64(newSystemCount) / float64(totalRequests) * 100
		
		t.Logf("✅ Traffic distribution - New: %d (%.1f%%), Old: %d (%.1f%%)", 
			newSystemCount, newSystemPercentage, oldSystemCount, 100-newSystemPercentage)
		
		// Allow for some variance in random distribution (30% tolerance for small sample size)
		assert.InDelta(t, 50.0, newSystemPercentage, 30.0, "Traffic distribution should be roughly 50/50")
	})
	
	t.Run("GetMetrics", func(t *testing.T) {
		metrics := controller.GetMetrics()
		require.NotNil(t, metrics)
		
		assert.Greater(t, metrics.TotalRequests, int64(0))
		assert.GreaterOrEqual(t, metrics.NewSystemRequests, int64(0))
		assert.GreaterOrEqual(t, metrics.OldSystemRequests, int64(0))
		
		t.Logf("✅ Traffic metrics - Total: %d, New: %d, Old: %d", 
			metrics.TotalRequests, metrics.NewSystemRequests, metrics.OldSystemRequests)
	})
}

// TestHealthMonitor tests health monitoring functionality
func TestHealthMonitor(t *testing.T) {
	config := &HealthMonitorConfig{
		CheckInterval:     5 * time.Second,
		FailureThreshold:  3,
		RecoveryThreshold: 2,
		CriticalChecks:    []string{"database", "api"},
	}
	
	monitor := NewMigrationHealthMonitor(config)
	require.NotNil(t, monitor)
	
	ctx := context.Background()
	
	t.Run("AddHealthCheckers", func(t *testing.T) {
		monitor.AddHealthChecker(NewDatabaseHealthChecker())
		monitor.AddHealthChecker(NewCacheHealthChecker())
		monitor.AddHealthChecker(NewAPIHealthChecker())
		
		t.Logf("✅ Added health checkers successfully")
	})
	
	t.Run("CheckHealth", func(t *testing.T) {
		result := monitor.CheckHealth(ctx)
		require.NotNil(t, result)
		
		assert.Equal(t, "overall_health", result.Name)
		assert.NotEmpty(t, result.Status)
		assert.GreaterOrEqual(t, result.Score, 0.0)
		assert.LessOrEqual(t, result.Score, 1.0)
		
		t.Logf("✅ Health check result: %s (score: %.2f) - %s", 
			result.Status, result.Score, result.Message)
		
		// Check details
		details, ok := result.Details["individual_results"].([]HealthCheckResult)
		assert.True(t, ok)
		assert.Greater(t, len(details), 0)
		
		for _, detail := range details {
			t.Logf("  - %s: %s (%.2f)", detail.Name, detail.Status, detail.Score)
		}
	})
	
	t.Run("GetOverallHealthScore", func(t *testing.T) {
		score := monitor.GetOverallHealthScore()
		assert.GreaterOrEqual(t, score, 0.0)
		assert.LessOrEqual(t, score, 1.0)
		
		t.Logf("✅ Overall health score: %.2f", score)
	})
}

// TestRollbackManager tests rollback functionality
func TestRollbackManager(t *testing.T) {
	config := &RollbackConfig{
		Enabled:        true,
		Timeout:        30 * time.Second,
		MaxAttempts:    3,
		BackupStrategy: "snapshot",
		VerifyRollback: true,
	}
	
	manager := NewRollbackManager(config)
	require.NotNil(t, manager)
	
	ctx := context.Background()
	
	t.Run("AddRollbackSteps", func(t *testing.T) {
		// Add rollback steps
		manager.AddRollbackStep(RollbackStep{
			Name:        "stop_new_services",
			Description: "Stop new system services",
			Execute: func(ctx context.Context) error {
				time.Sleep(100 * time.Millisecond) // Simulate work
				return nil
			},
			Verify: func(ctx context.Context) error {
				return nil
			},
			Priority: 10,
			Critical: true,
		})
		
		manager.AddRollbackStep(RollbackStep{
			Name:        "restore_database",
			Description: "Restore database to previous state",
			Execute: func(ctx context.Context) error {
				time.Sleep(200 * time.Millisecond) // Simulate work
				return nil
			},
			Verify: func(ctx context.Context) error {
				return nil
			},
			Priority: 5,
			Critical: true,
		})
		
		t.Logf("✅ Added rollback steps successfully")
	})
	
	t.Run("SaveSystemState", func(t *testing.T) {
		err := manager.SaveSystemState(ctx)
		require.NoError(t, err)
		
		state := manager.GetCurrentState()
		require.NotNil(t, state)
		assert.NotEmpty(t, state.Version)
		
		t.Logf("✅ System state saved: version %s", state.Version)
	})
	
	t.Run("ExecuteRollback", func(t *testing.T) {
		err := manager.ExecuteRollback(ctx)
		require.NoError(t, err)
		
		t.Logf("✅ Rollback executed successfully")
	})
	
	t.Run("GetStateHistory", func(t *testing.T) {
		history := manager.GetStateHistory()
		assert.Greater(t, len(history), 0)
		
		t.Logf("✅ State history contains %d entries", len(history))
	})
}

// TestMigrationValidator tests migration validation
func TestMigrationValidator(t *testing.T) {
	config := &ValidationConfig{
		Enabled:           true,
		Timeout:           10 * time.Second,
		CriticalChecks:    []string{"database", "api", "data_consistency"},
		PerformanceChecks: []string{"performance"},
		DataChecks:        []string{"data_consistency"},
	}
	
	validator := NewMigrationValidator(config)
	require.NotNil(t, validator)
	
	ctx := context.Background()
	
	t.Run("ValidatePrePhase", func(t *testing.T) {
		err := validator.ValidatePrePhase(ctx, MigrationPhase10Percent)
		require.NoError(t, err)
		
		t.Logf("✅ Pre-phase validation passed for 10%% phase")
	})
	
	t.Run("ValidatePostPhase", func(t *testing.T) {
		err := validator.ValidatePostPhase(ctx, MigrationPhase10Percent)
		require.NoError(t, err)
		
		t.Logf("✅ Post-phase validation passed for 10%% phase")
	})
	
	t.Run("ValidateFinalState", func(t *testing.T) {
		err := validator.ValidateFinalState(ctx)
		require.NoError(t, err)
		
		t.Logf("✅ Final state validation passed")
	})
	
	t.Run("GetValidationResults", func(t *testing.T) {
		results := validator.GetValidationResults(ctx, MigrationPhase50Percent)
		require.Greater(t, len(results), 0)
		
		for _, result := range results {
			t.Logf("  - %s: %s (passed: %v, critical: %v)", 
				result.Name, result.Status, result.Passed, result.Critical)
		}
		
		t.Logf("✅ Retrieved %d validation results", len(results))
	})
}

// TestCircuitBreakerTrafficController tests circuit breaker functionality
func TestCircuitBreakerTrafficController(t *testing.T) {
	config := &TrafficControllerConfig{
		InitialPercentage: 0.0,
		MaxPercentage:     100.0,
		StepSize:          10.0,
	}
	
	controller := NewCircuitBreakerTrafficController(config)
	require.NotNil(t, controller)
	
	ctx := context.Background()
	
	t.Run("AddCircuitBreaker", func(t *testing.T) {
		controller.AddCircuitBreaker("new_system", 5, 30*time.Second)
		controller.AddCircuitBreaker("old_system", 5, 30*time.Second)
		
		t.Logf("✅ Added circuit breakers for both systems")
	})
	
	t.Run("RouteWithCircuitBreaker", func(t *testing.T) {
		// Set traffic to 50%
		err := controller.SetTrafficPercentage(ctx, 50.0)
		require.NoError(t, err)
		
		request := &Request{
			ID:        "test_request",
			Timestamp: time.Now(),
			Method:    "GET",
			Path:      "/api/test",
		}
		
		decision, err := controller.RouteRequestWithCircuitBreaker(ctx, request)
		require.NoError(t, err)
		require.NotNil(t, decision)
		
		t.Logf("✅ Request routed to: %s", decision.Destination)
	})
	
	t.Run("RecordCircuitBreakerResults", func(t *testing.T) {
		// Record some successful requests
		for i := 0; i < 10; i++ {
			controller.RecordCircuitBreakerResult("new_system", true)
		}
		
		// Record some failures
		for i := 0; i < 3; i++ {
			controller.RecordCircuitBreakerResult("new_system", false)
		}
		
		status := controller.GetCircuitBreakerStatus()
		require.Contains(t, status, "new_system")
		
		newSystemCB := status["new_system"]
		assert.Equal(t, int64(10), newSystemCB.SuccessCount)
		assert.Equal(t, int64(3), newSystemCB.FailureCount)
		assert.Equal(t, CircuitBreakerClosed, newSystemCB.State)
		
		t.Logf("✅ Circuit breaker status - Success: %d, Failures: %d, State: %s", 
			newSystemCB.SuccessCount, newSystemCB.FailureCount, newSystemCB.State)
	})
}

// TestMigrationTemplates tests migration templates
func TestMigrationTemplates(t *testing.T) {
	t.Run("ConservativeTemplate", func(t *testing.T) {
		template := ConservativeMigrationTemplate
		require.NotNil(t, template)
		
		assert.Equal(t, "conservative", template.Name)
		assert.Greater(t, len(template.Phases), 0)
		
		totalDuration := time.Duration(0)
		for _, phase := range template.Phases {
			totalDuration += phase.Duration
			assert.Greater(t, phase.TrafficPercentage, 0.0)
			assert.LessOrEqual(t, phase.TrafficPercentage, 100.0)
		}
		
		t.Logf("✅ Conservative template: %d phases, total duration: %v", 
			len(template.Phases), totalDuration)
	})
	
	t.Run("AggressiveTemplate", func(t *testing.T) {
		template := AggressiveMigrationTemplate
		require.NotNil(t, template)
		
		assert.Equal(t, "aggressive", template.Name)
		assert.Greater(t, len(template.Phases), 0)
		
		// Aggressive template should have shorter total duration
		totalDuration := time.Duration(0)
		for _, phase := range template.Phases {
			totalDuration += phase.Duration
		}
		
		conservativeDuration := time.Duration(0)
		for _, phase := range ConservativeMigrationTemplate.Phases {
			conservativeDuration += phase.Duration
		}
		
		assert.Less(t, totalDuration, conservativeDuration)
		
		t.Logf("✅ Aggressive template: %d phases, total duration: %v", 
			len(template.Phases), totalDuration)
	})
	
	t.Run("StandardTemplate", func(t *testing.T) {
		template := StandardMigrationTemplate
		require.NotNil(t, template)
		
		assert.Equal(t, "standard", template.Name)
		assert.Greater(t, len(template.Phases), 0)
		
		t.Logf("✅ Standard template: %d phases", len(template.Phases))
	})
}

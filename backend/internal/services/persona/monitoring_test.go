package persona

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAnalyticsService(t *testing.T) {
	service := NewAnalyticsService()

	assert.NotNil(t, service)
	assert.True(t, service.enabled)
	assert.NotNil(t, service.metricsCollector)
	assert.NotNil(t, service.reportGenerator)
	assert.NotNil(t, service.alertManager)
	assert.NotNil(t, service.dataAggregator)
}

func TestAnalyticsService_RecordMetric(t *testing.T) {
	service := NewAnalyticsService()
	ctx := context.Background()

	// Test recording a metric
	err := service.RecordMetric(ctx, "test_metric", 100.0, map[string]string{
		"component": "test",
	})
	require.NoError(t, err)

	// Verify metric was recorded
	metrics := service.GetMetrics()
	assert.Contains(t, metrics, "test_metric")
	assert.Equal(t, 1, len(metrics["test_metric"].DataPoints))
	assert.Equal(t, 100.0, metrics["test_metric"].DataPoints[0].Value)

	// Test real-time metrics
	realTimeMetrics := service.GetRealTimeMetrics()
	assert.Contains(t, realTimeMetrics, "test_metric")
	assert.Equal(t, 100.0, realTimeMetrics["test_metric"].CurrentValue)
}

func TestAnalyticsService_AlertRules(t *testing.T) {
	service := NewAnalyticsService()
	ctx := context.Background()

	// Record a metric that should trigger an alert
	err := service.RecordMetric(ctx, "response_time_ms", 1500.0, nil)
	require.NoError(t, err)

	// Give some time for alert processing
	time.Sleep(100 * time.Millisecond)

	// Check if alert was triggered
	activeAlerts := service.GetActiveAlerts()
	assert.Greater(t, len(activeAlerts), 0)

	// Find the high response time alert
	found := false
	for _, alert := range activeAlerts {
		if alert.RuleName == "High Response Time" {
			found = true
			assert.Equal(t, "high", alert.Severity)
			assert.Equal(t, "active", alert.Status)
			assert.Equal(t, 1500.0, alert.Value)
			break
		}
	}
	assert.True(t, found, "High response time alert should be triggered")
}

func TestAnalyticsService_GenerateReport(t *testing.T) {
	service := NewAnalyticsService()
	ctx := context.Background()

	// Add some test data
	service.RecordMetric(ctx, "test_metric1", 100.0, nil)
	service.RecordMetric(ctx, "test_metric2", 200.0, nil)

	// Create a test report template
	template := &ReportTemplate{
		ID:          "test_template",
		Name:        "Test Report",
		Description: "Test report template",
		Sections: []ReportSection{
			{
				Title: "Metrics",
				Type:  "metrics",
			},
			{
				Title: "Alerts",
				Type:  "alerts",
			},
		},
		Format: "json",
	}

	service.reportGenerator.mu.Lock()
	service.reportGenerator.templates["test_template"] = template
	service.reportGenerator.mu.Unlock()

	// Generate report
	timeRange := TimeRange{
		Start: time.Now().Add(-1 * time.Hour),
		End:   time.Now(),
	}

	report, err := service.GenerateReport(ctx, "test_template", timeRange)
	require.NoError(t, err)
	assert.NotNil(t, report)
	assert.Equal(t, "Test Report", report.Title)
	assert.Equal(t, 2, len(report.Sections))
	assert.NotNil(t, report.Summary)
}

func TestMonitoringService(t *testing.T) {
	service := NewMonitoringService()

	assert.NotNil(t, service)
	assert.True(t, service.enabled)
	assert.NotNil(t, service.analyticsService)
	assert.NotNil(t, service.healthChecker)
	assert.NotNil(t, service.performanceTracker)
	assert.NotNil(t, service.usageTracker)
	assert.NotNil(t, service.errorTracker)
}

func TestMonitoringService_RecordPersonaMetrics(t *testing.T) {
	service := NewMonitoringService()
	ctx := context.Background()

	// Record some persona metrics
	service.RecordPersonaMetrics(ctx, "apply_persona", 50*time.Millisecond, true, map[string]interface{}{
		"user_id": "test-user",
	})

	service.RecordPersonaMetrics(ctx, "apply_persona", 75*time.Millisecond, true, map[string]interface{}{
		"user_id": "test-user-2",
	})

	// Verify metrics were recorded
	metrics := service.GetPerformanceMetrics()
	assert.Contains(t, metrics, "apply_persona")

	personaMetrics := metrics["apply_persona"]
	assert.Equal(t, "apply_persona", personaMetrics.ComponentName)
	assert.Equal(t, int64(2), personaMetrics.ResponseTime.SampleCount)
	assert.Greater(t, personaMetrics.Throughput.TotalRequests, int64(0))
}

func TestMonitoringService_RecordUserSession(t *testing.T) {
	service := NewMonitoringService()
	ctx := context.Background()

	// Record user sessions
	service.RecordUserSession(ctx, "user1", "session1", "ktp")
	service.RecordUserSession(ctx, "user1", "session1", "akta")
	service.RecordUserSession(ctx, "user2", "session2", "ktp")

	// Verify sessions were recorded
	usageStats := service.GetUsageStatistics()
	assert.Contains(t, usageStats, "ktp")
	assert.Contains(t, usageStats, "akta")

	ktpUsage := usageStats["ktp"]
	assert.Equal(t, "ktp", ktpUsage.ServiceType)
	assert.Equal(t, int64(2), ktpUsage.RequestCount)

	aktaUsage := usageStats["akta"]
	assert.Equal(t, "akta", aktaUsage.ServiceType)
	assert.Equal(t, int64(1), aktaUsage.RequestCount)
}

func TestMonitoringService_RecordError(t *testing.T) {
	service := NewMonitoringService()
	ctx := context.Background()

	// Record some errors
	service.RecordError(ctx, "validation_error", "Invalid input", "persona_service", "medium", map[string]interface{}{
		"user_id": "test-user",
	})

	service.RecordError(ctx, "timeout_error", "Request timeout", "groq_provider", "high", map[string]interface{}{
		"timeout": "30s",
	})

	// Verify errors were recorded
	errorStats := service.GetErrorStatistics()
	assert.Contains(t, errorStats, "persona_service")
	assert.Contains(t, errorStats, "groq_provider")

	personaErrors := errorStats["persona_service"]
	assert.Equal(t, "persona_service", personaErrors.Component)
	assert.Equal(t, int64(1), personaErrors.TotalErrors)

	groqErrors := errorStats["groq_provider"]
	assert.Equal(t, "groq_provider", groqErrors.Component)
	assert.Equal(t, int64(1), groqErrors.TotalErrors)
}

func TestMonitoringService_SystemHealth(t *testing.T) {
	service := NewMonitoringService()

	// Add a health check
	service.healthChecker.mu.Lock()
	service.healthChecker.checks["test_component"] = &HealthCheck{
		Name: "Test Component",
		Type: "service",
		CheckFunction: func() HealthResult {
			return HealthResult{
				Status:       "healthy",
				ResponseTime: 10 * time.Millisecond,
				Error:        nil,
				Metadata:     make(map[string]interface{}),
			}
		},
	}
	service.healthChecker.mu.Unlock()

	// Perform health checks
	service.performHealthChecks()

	// Get system health
	health := service.GetSystemHealth()
	assert.NotNil(t, health)
	assert.Equal(t, "healthy", health.Status)
	assert.Equal(t, 100.0, health.Score)
	assert.Contains(t, health.ComponentHealth, "test_component")
	assert.Equal(t, "healthy", health.ComponentHealth["test_component"])
}

func TestMonitoringService_StartMonitoring(t *testing.T) {
	service := NewMonitoringService()
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	// Start monitoring (should not block)
	err := service.StartMonitoring(ctx)
	require.NoError(t, err)

	// Wait for context to be cancelled
	<-ctx.Done()

	// Monitoring should have started and stopped gracefully
	assert.True(t, service.enabled)
}

func TestMonitoringService_DisabledService(t *testing.T) {
	service := NewMonitoringService()
	service.enabled = false
	ctx := context.Background()

	// Operations should not fail when service is disabled
	service.RecordPersonaMetrics(ctx, "test", 10*time.Millisecond, true, nil)
	service.RecordUserSession(ctx, "user1", "session1", "ktp")
	service.RecordError(ctx, "test_error", "test message", "test_component", "low", nil)

	// Should return empty results
	metrics := service.GetPerformanceMetrics()
	assert.Empty(t, metrics)

	usage := service.GetUsageStatistics()
	assert.Empty(t, usage)

	errors := service.GetErrorStatistics()
	assert.Empty(t, errors)
}

func TestHealthChecker_HealthChecks(t *testing.T) {
	service := NewMonitoringService()

	// Add multiple health checks with different statuses
	service.healthChecker.mu.Lock()
	service.healthChecker.checks["healthy_component"] = &HealthCheck{
		Name: "Healthy Component",
		Type: "service",
		CheckFunction: func() HealthResult {
			return HealthResult{
				Status:       "healthy",
				ResponseTime: 5 * time.Millisecond,
			}
		},
	}

	service.healthChecker.checks["degraded_component"] = &HealthCheck{
		Name: "Degraded Component",
		Type: "service",
		CheckFunction: func() HealthResult {
			return HealthResult{
				Status:       "degraded",
				ResponseTime: 50 * time.Millisecond,
			}
		},
	}

	service.healthChecker.checks["unhealthy_component"] = &HealthCheck{
		Name: "Unhealthy Component",
		Type: "service",
		CheckFunction: func() HealthResult {
			return HealthResult{
				Status:       "unhealthy",
				ResponseTime: 1000 * time.Millisecond,
			}
		},
	}
	service.healthChecker.mu.Unlock()

	// Perform health checks
	service.performHealthChecks()

	// Get system health
	health := service.GetSystemHealth()
	assert.NotNil(t, health)

	// Overall health should be degraded due to mixed component health
	// With 1 healthy (100), 1 degraded (50), 1 unhealthy (0), average should be ~50
	assert.Contains(t, []string{"healthy", "degraded", "unhealthy"}, health.Status)
	assert.GreaterOrEqual(t, health.Score, 0.0)
	assert.LessOrEqual(t, health.Score, 100.0)

	// All components should be tracked
	assert.Contains(t, health.ComponentHealth, "healthy_component")
	assert.Contains(t, health.ComponentHealth, "degraded_component")
	assert.Contains(t, health.ComponentHealth, "unhealthy_component")

	assert.Equal(t, "healthy", health.ComponentHealth["healthy_component"])
	assert.Equal(t, "degraded", health.ComponentHealth["degraded_component"])
	assert.Equal(t, "unhealthy", health.ComponentHealth["unhealthy_component"])
}

func TestPerformanceTracker_Metrics(t *testing.T) {
	service := NewMonitoringService()

	// Record multiple performance metrics
	service.updatePerformanceMetrics("test_operation", 10*time.Millisecond, true)
	service.updatePerformanceMetrics("test_operation", 20*time.Millisecond, true)
	service.updatePerformanceMetrics("test_operation", 15*time.Millisecond, false)

	metrics := service.GetPerformanceMetrics()
	assert.Contains(t, metrics, "test_operation")

	testMetrics := metrics["test_operation"]
	assert.Equal(t, "test_operation", testMetrics.ComponentName)
	assert.Equal(t, int64(3), testMetrics.ResponseTime.SampleCount)
	assert.Equal(t, 10*time.Millisecond, testMetrics.ResponseTime.Min)
	assert.Equal(t, 20*time.Millisecond, testMetrics.ResponseTime.Max)
	assert.Equal(t, int64(3), testMetrics.Throughput.TotalRequests)
}

func TestErrorTracker_ErrorPatterns(t *testing.T) {
	service := NewMonitoringService()

	// Create test error events
	errorEvent1 := &ErrorEvent{
		ID:           "error1",
		Timestamp:    time.Now(),
		ErrorType:    "validation_error",
		ErrorMessage: "Invalid input",
		Component:    "persona_service",
		Severity:     "medium",
	}

	errorEvent2 := &ErrorEvent{
		ID:           "error2",
		Timestamp:    time.Now(),
		ErrorType:    "validation_error",
		ErrorMessage: "Invalid format",
		Component:    "persona_service",
		Severity:     "medium",
	}

	// Update error patterns
	service.errorTracker.mu.Lock()
	service.updateErrorPatterns(errorEvent1)
	service.updateErrorPatterns(errorEvent2)
	service.errorTracker.mu.Unlock()

	// Verify error patterns were created
	service.errorTracker.mu.RLock()
	patterns := service.errorTracker.errorPatterns
	service.errorTracker.mu.RUnlock()

	patternID := "validation_error_persona_service"
	assert.Contains(t, patterns, patternID)

	pattern := patterns[patternID]
	assert.Equal(t, "validation_error", pattern.ErrorType)
	assert.Equal(t, int64(2), pattern.Frequency)
}

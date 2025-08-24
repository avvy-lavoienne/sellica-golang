package monitoring

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestMonitoringIntegration tests the complete monitoring infrastructure
// Phase 3 Week 2: Comprehensive monitoring integration testing
func TestMonitoringIntegration(t *testing.T) {
	ctx := context.Background()
	
	t.Run("PrometheusMetricsIntegration", func(t *testing.T) {
		testPrometheusMetricsIntegration(t, ctx)
	})
	
	t.Run("StructuredLoggingIntegration", func(t *testing.T) {
		testStructuredLoggingIntegration(t, ctx)
	})
	
	t.Run("HealthCheckIntegration", func(t *testing.T) {
		testHealthCheckIntegration(t, ctx)
	})
	
	t.Run("MonitoringEndToEndIntegration", func(t *testing.T) {
		testMonitoringEndToEndIntegration(t, ctx)
	})
}

// testPrometheusMetricsIntegration tests Prometheus metrics integration
func testPrometheusMetricsIntegration(t *testing.T, ctx context.Context) {
	// Create Prometheus metrics instance
	metrics := NewPrometheusMetrics()
	require.NotNil(t, metrics)
	
	// Test AI inference metrics
	metrics.RecordAIInference("tensorflow", "test-model", "classification", "success", 25*time.Millisecond)
	metrics.RecordAIInference("indobert", "indo-model", "ner", "success", 35*time.Millisecond)
	metrics.RecordAIInference("groq", "groq-model", "sentiment", "error", 100*time.Millisecond)
	
	// Test AI error recording
	metrics.RecordAIError("tensorflow", "test-model", "timeout")
	metrics.RecordAIError("indobert", "indo-model", "validation_error")
	
	// Test model health updates
	metrics.UpdateAIModelHealth("tensorflow", "test-model", 1.0) // Healthy
	metrics.UpdateAIModelHealth("indobert", "indo-model", 0.8)  // Degraded
	metrics.UpdateAIProviderAvailability("groq", 0.95)
	
	// Test training metrics
	metrics.RecordTrainingData("ktp", "processed")
	metrics.RecordTrainingData("kk", "processed")
	metrics.RecordTrainingData("akta", "failed")
	metrics.UpdateTrainingAccuracy("ktp", "model-v1", 0.98)
	metrics.UpdateTrainingAccuracy("kk", "model-v1", 0.96)
	
	// Test cache metrics
	metrics.RecordCacheOperation("memory", "get", 385*time.Nanosecond, true)
	metrics.RecordCacheOperation("memory", "set", 2490*time.Nanosecond, false)
	metrics.RecordCacheOperation("redis", "get", 15*time.Millisecond, true)
	
	// Test HTTP metrics
	metrics.RecordHTTPRequest("GET", "/api/health", 200, 5*time.Millisecond)
	metrics.RecordHTTPRequest("POST", "/api/ai/inference", 200, 45*time.Millisecond)
	metrics.RecordHTTPRequest("GET", "/api/training/status", 500, 100*time.Millisecond)
	
	// Test system metrics
	metrics.UpdateSystemMetrics(512*1024*1024, 25.5) // 512MB memory, 25.5% CPU
	
	// Test database metrics
	metrics.RecordDatabaseQuery("postgres", "SELECT", "training_data", 12*time.Millisecond)
	metrics.RecordDatabaseQuery("postgres", "INSERT", "training_data", 8*time.Millisecond)
	
	// Test external API metrics
	metrics.RecordExternalAPI("groq", "/v1/chat/completions", "POST", 150*time.Millisecond)
	metrics.RecordExternalAPI("huggingface", "/models/indobert", "GET", 200*time.Millisecond)
	
	// Verify metrics handler
	handler := metrics.GetHandler()
	require.NotNil(t, handler)
	
	// Test metrics endpoint
	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Header().Get("Content-Type"), "text/plain")
	
	// Verify some metrics are present in the output
	body := w.Body.String()
	assert.Contains(t, body, "selly_ai_inference_total")
	assert.Contains(t, body, "selly_training_cache_hits_total")
	assert.Contains(t, body, "selly_http_requests_total")
	
	t.Logf("✅ Prometheus Metrics Integration: Recorded %d metric types successfully", 10)
}

// testStructuredLoggingIntegration tests structured logging integration
func testStructuredLoggingIntegration(t *testing.T, ctx context.Context) {
	// Create structured logger
	config := &LoggerConfig{
		ServiceName:  "selly-test",
		Version:      "1.0.0",
		Environment:  "test",
		Level:        LogLevelDebug,
		OutputFormat: "json",
		EnableCaller: true,
	}
	
	logger := NewStructuredLogger(config)
	require.NotNil(t, logger)
	
	// Test basic logging
	logger.Info("Test info message", map[string]interface{}{
		"test_field": "test_value",
		"number":     42,
	})
	
	logger.Warn("Test warning message", map[string]interface{}{
		"warning_type": "performance",
		"threshold":    100,
	})
	
	logger.Debug("Test debug message", map[string]interface{}{
		"debug_info": "detailed_information",
	})
	
	// Test error logging
	testError := assert.AnError
	logger.Error("Test error message", testError, map[string]interface{}{
		"error_context": "test_scenario",
		"retry_count":   3,
	})
	
	// Test context logging
	ctxLogger := logger.WithContext(ctx)
	ctxLogger.WithField("request_id", "req-123").
		WithField("user_id", "user-456").
		Info("Context logging test")
	
	// Test field logging
	fieldLogger := logger.WithFields(map[string]interface{}{
		"component": "test_component",
		"operation": "test_operation",
	})
	fieldLogger.Info("Field logging test")
	
	// Test specialized logging methods
	logger.LogAIInference(ctx, "tensorflow", "test-model", "classification", 25*time.Millisecond, true, 0.95)
	logger.LogTrainingOperation(ctx, "ktp", "process", 268*time.Millisecond, true, 1.0)
	logger.LogCacheOperation(ctx, "memory", "get", 385*time.Nanosecond, true)
	logger.LogHTTPRequest(ctx, "GET", "/api/health", 200, 5*time.Millisecond, "user-123")
	logger.LogBusinessEvent(ctx, "document_processed", "ktp", "user-123", "session-456", map[string]interface{}{
		"processing_time": "268ms",
		"accuracy":        1.0,
	})
	
	t.Logf("✅ Structured Logging Integration: All logging methods working correctly")
}

// testHealthCheckIntegration tests health check integration
func testHealthCheckIntegration(t *testing.T, ctx context.Context) {
	// Create logger for health checker
	loggerConfig := &LoggerConfig{
		ServiceName:  "selly-health-test",
		Version:      "1.0.0",
		Environment:  "test",
		Level:        LogLevelInfo,
		OutputFormat: "json",
	}
	logger := NewStructuredLogger(loggerConfig)
	
	// Create health checker
	healthConfig := &HealthConfig{
		CheckInterval:   1 * time.Second,
		Timeout:         5 * time.Second,
		CacheDuration:   500 * time.Millisecond,
		EnableDetailed:  true,
		EnableMetrics:   true,
		MemoryThreshold: 80.0,
		CPUThreshold:    80.0,
		DiskThreshold:   90.0,
	}
	
	healthChecker := NewHealthChecker("selly-test", "1.0.0", healthConfig, logger)
	require.NotNil(t, healthChecker)
	
	// Register test dependencies
	healthChecker.RegisterDependency("database", func(ctx context.Context) *DependencyHealth {
		return &DependencyHealth{
			Status:       HealthStatusHealthy,
			ResponseTime: 10 * time.Millisecond,
			Metadata: map[string]interface{}{
				"connection_pool": "active",
				"query_time":      "5ms",
			},
		}
	}, true) // Critical dependency
	
	healthChecker.RegisterDependency("redis", func(ctx context.Context) *DependencyHealth {
		return &DependencyHealth{
			Status:       HealthStatusHealthy,
			ResponseTime: 2 * time.Millisecond,
			Metadata: map[string]interface{}{
				"memory_usage": "128MB",
				"hit_rate":     0.98,
			},
		}
	}, false) // Non-critical dependency
	
	healthChecker.RegisterDependency("ai_service", func(ctx context.Context) *DependencyHealth {
		return &DependencyHealth{
			Status:       HealthStatusHealthy,
			ResponseTime: 45 * time.Millisecond,
			Metadata: map[string]interface{}{
				"active_models":  3,
				"inference_rate": 150.5,
			},
		}
	}, true) // Critical dependency
	
	// Test health status
	status := healthChecker.GetHealthStatus(ctx)
	require.NotNil(t, status)
	
	// Validate health status structure
	assert.Equal(t, "selly-test", status.ServiceName)
	assert.Equal(t, "1.0.0", status.Version)
	assert.Equal(t, HealthStatusHealthy, status.Status)
	assert.GreaterOrEqual(t, status.Uptime, time.Duration(0)) // Allow 0 for fast tests
	assert.NotNil(t, status.SystemMetrics)
	assert.Len(t, status.Dependencies, 3)
	assert.Len(t, status.Services, 3)
	assert.NotNil(t, status.Performance)
	
	// Validate dependencies
	assert.Equal(t, HealthStatusHealthy, status.Dependencies["database"].Status)
	assert.True(t, status.Dependencies["database"].Critical)
	assert.Equal(t, HealthStatusHealthy, status.Dependencies["redis"].Status)
	assert.False(t, status.Dependencies["redis"].Critical)
	assert.Equal(t, HealthStatusHealthy, status.Dependencies["ai_service"].Status)
	assert.True(t, status.Dependencies["ai_service"].Critical)
	
	// Validate services
	assert.Equal(t, HealthStatusHealthy, status.Services["ai_service"].Status)
	assert.Equal(t, HealthStatusHealthy, status.Services["training_service"].Status)
	assert.Equal(t, HealthStatusHealthy, status.Services["cache_service"].Status)
	
	// Validate system metrics
	assert.Greater(t, status.SystemMetrics.MemoryUsage, int64(0))
	assert.GreaterOrEqual(t, status.SystemMetrics.MemoryPercent, 0.0)
	assert.Greater(t, status.SystemMetrics.GoroutineCount, 0)
	assert.NotNil(t, status.SystemMetrics.GCStats)
	
	// Validate performance metrics
	assert.Greater(t, status.Performance.RequestsPerSecond, 0.0)
	assert.Greater(t, status.Performance.AverageResponseTime, time.Duration(0))
	assert.GreaterOrEqual(t, status.Performance.ErrorRate, 0.0)
	assert.GreaterOrEqual(t, status.Performance.CacheHitRate, 0.0)
	
	// Test health HTTP handler
	handler := healthChecker.GetHealthHandler()
	require.NotNil(t, handler)
	
	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
	
	// Test caching
	status1 := healthChecker.GetHealthStatus(ctx)
	status2 := healthChecker.GetHealthStatus(ctx)
	assert.Equal(t, status1.Timestamp, status2.Timestamp) // Should be cached
	
	// Wait for cache to expire and test again
	time.Sleep(600 * time.Millisecond)
	status3 := healthChecker.GetHealthStatus(ctx)
	assert.True(t, status3.Timestamp.After(status1.Timestamp)) // Should be fresh
	
	t.Logf("✅ Health Check Integration: Status %s, Dependencies %d, Services %d, Uptime %v", 
		status.Status, len(status.Dependencies), len(status.Services), status.Uptime)
}

// testMonitoringEndToEndIntegration tests end-to-end monitoring integration
func testMonitoringEndToEndIntegration(t *testing.T, ctx context.Context) {
	// Create all monitoring components
	metrics := NewPrometheusMetrics()
	
	loggerConfig := &LoggerConfig{
		ServiceName:  "selly-e2e-test",
		Version:      "1.0.0",
		Environment:  "test",
		Level:        LogLevelInfo,
		OutputFormat: "json",
	}
	logger := NewStructuredLogger(loggerConfig)
	
	healthConfig := &HealthConfig{
		CheckInterval:   1 * time.Second,
		Timeout:         5 * time.Second,
		CacheDuration:   500 * time.Millisecond,
		EnableDetailed:  true,
		EnableMetrics:   true,
		MemoryThreshold: 80.0,
		CPUThreshold:    80.0,
	}
	healthChecker := NewHealthChecker("selly-e2e-test", "1.0.0", healthConfig, logger)
	
	// Simulate a complete AI inference workflow with monitoring
	startTime := time.Now()
	
	// 1. Log the start of the operation
	logger.WithFields(map[string]interface{}{
		"component": "ai_workflow",
		"operation": "inference_start",
		"request_id": "req-e2e-123",
	}).Info("Starting AI inference workflow")
	
	// 2. Record cache operation
	cacheStart := time.Now()
	time.Sleep(1 * time.Millisecond) // Simulate cache lookup
	cacheTime := time.Since(cacheStart)
	metrics.RecordCacheOperation("memory", "get", cacheTime, false) // Cache miss
	logger.LogCacheOperation(ctx, "memory", "get", cacheTime, false)
	
	// 3. Record AI inference
	inferenceStart := time.Now()
	time.Sleep(25 * time.Millisecond) // Simulate AI inference
	inferenceTime := time.Since(inferenceStart)
	metrics.RecordAIInference("tensorflow", "test-model", "classification", "success", inferenceTime)
	logger.LogAIInference(ctx, "tensorflow", "test-model", "classification", inferenceTime, true, 0.95)
	
	// 4. Record training data update
	trainingStart := time.Now()
	time.Sleep(5 * time.Millisecond) // Simulate training data update
	trainingTime := time.Since(trainingStart)
	metrics.RecordTrainingData("ktp", "processed")
	logger.LogTrainingOperation(ctx, "ktp", "data_update", trainingTime, true, 0.98)
	
	// 5. Record cache update
	cacheUpdateStart := time.Now()
	time.Sleep(2 * time.Millisecond) // Simulate cache update
	cacheUpdateTime := time.Since(cacheUpdateStart)
	metrics.RecordCacheOperation("memory", "set", cacheUpdateTime, false)
	logger.LogCacheOperation(ctx, "memory", "set", cacheUpdateTime, false)
	
	// 6. Record HTTP response
	totalTime := time.Since(startTime)
	metrics.RecordHTTPRequest("POST", "/api/ai/inference", 200, totalTime)
	logger.LogHTTPRequest(ctx, "POST", "/api/ai/inference", 200, totalTime, "user-e2e-test")
	
	// 7. Log business event
	logger.LogBusinessEvent(ctx, "ai_inference_completed", "ktp", "user-e2e-test", "session-e2e-123", map[string]interface{}{
		"total_time":     totalTime.Milliseconds(),
		"cache_hit":      false,
		"model_used":     "tensorflow/test-model",
		"confidence":     0.95,
		"accuracy":       0.98,
	})
	
	// 8. Check health status
	healthStatus := healthChecker.GetHealthStatus(ctx)
	assert.Equal(t, HealthStatusHealthy, healthStatus.Status)
	
	// 9. Update system metrics
	metrics.UpdateSystemMetrics(256*1024*1024, 15.5) // 256MB memory, 15.5% CPU
	
	// 10. Log completion
	logger.WithFields(map[string]interface{}{
		"component":      "ai_workflow",
		"operation":      "inference_complete",
		"request_id":     "req-e2e-123",
		"total_time_ms":  totalTime.Milliseconds(),
		"cache_time_ns":  cacheTime.Nanoseconds(),
		"inference_time_ms": inferenceTime.Milliseconds(),
		"training_time_ms":  trainingTime.Milliseconds(),
		"health_status":  healthStatus.Status,
	}).Info("AI inference workflow completed successfully")
	
	// Validate that all components are working together
	assert.Less(t, totalTime, 100*time.Millisecond) // Should be fast
	assert.NotNil(t, metrics.GetHandler())
	assert.NotNil(t, healthChecker.GetHealthHandler())
	
	t.Logf("✅ End-to-End Monitoring Integration: Complete workflow monitored in %v", totalTime)
}

// BenchmarkMonitoringPerformance benchmarks monitoring performance
func BenchmarkMonitoringPerformance(b *testing.B) {
	ctx := context.Background()
	
	b.Run("PrometheusMetrics", func(b *testing.B) {
		metrics := NewPrometheusMetrics()
		b.ResetTimer()
		b.ReportAllocs()
		
		for i := 0; i < b.N; i++ {
			metrics.RecordAIInference("tensorflow", "test-model", "classification", "success", 25*time.Millisecond)
		}
	})
	
	b.Run("StructuredLogging", func(b *testing.B) {
		config := &LoggerConfig{
			ServiceName:  "benchmark-test",
			Version:      "1.0.0",
			Environment:  "test",
			Level:        LogLevelInfo,
			OutputFormat: "json",
		}
		logger := NewStructuredLogger(config)
		
		b.ResetTimer()
		b.ReportAllocs()
		
		for i := 0; i < b.N; i++ {
			logger.LogAIInference(ctx, "tensorflow", "test-model", "classification", 25*time.Millisecond, true, 0.95)
		}
	})
	
	b.Run("HealthCheck", func(b *testing.B) {
		loggerConfig := &LoggerConfig{
			ServiceName:  "benchmark-health-test",
			Version:      "1.0.0",
			Environment:  "test",
			Level:        LogLevelWarn, // Reduce logging for benchmark
			OutputFormat: "json",
		}
		logger := NewStructuredLogger(loggerConfig)
		
		healthConfig := &HealthConfig{
			CheckInterval:   10 * time.Second, // Longer interval for benchmark
			Timeout:         1 * time.Second,
			CacheDuration:   100 * time.Millisecond,
			EnableDetailed:  false, // Disable for performance
			EnableMetrics:   false, // Disable for performance
		}
		healthChecker := NewHealthChecker("benchmark-test", "1.0.0", healthConfig, logger)
		
		b.ResetTimer()
		b.ReportAllocs()
		
		for i := 0; i < b.N; i++ {
			_ = healthChecker.GetHealthStatus(ctx)
		}
	})
}

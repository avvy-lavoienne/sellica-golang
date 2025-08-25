package persona

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// MonitoringService provides comprehensive monitoring for SELLY persona services
type MonitoringService struct {
	analyticsService    *AnalyticsService
	healthChecker       *HealthChecker
	performanceTracker  *PerformanceTracker
	usageTracker        *UsageTracker
	errorTracker        *ErrorTracker
	enabled             bool
	monitoringInterval  time.Duration
	mu                  sync.RWMutex
}

// HealthChecker monitors system health
type HealthChecker struct {
	checks          map[string]*HealthCheck
	overallHealth   *HealthStatus
	enabled         bool
	checkInterval   time.Duration
	mu              sync.RWMutex
}

// PerformanceTracker tracks performance metrics
type PerformanceTracker struct {
	metrics         map[string]*PerformanceMetrics
	benchmarks      map[string]*PerformanceBenchmark
	enabled         bool
	trackingInterval time.Duration
	mu              sync.RWMutex
}

// UsageTracker tracks usage patterns
type UsageTracker struct {
	userSessions    map[string]*UserSession
	serviceUsage    map[string]*ServiceUsage
	patterns        map[string]*UsagePattern
	enabled         bool
	trackingInterval time.Duration
	mu              sync.RWMutex
}

// ErrorTracker tracks and analyzes errors
type ErrorTracker struct {
	errors          []*ErrorEvent
	errorPatterns   map[string]*ErrorPattern
	errorRates      map[string]*ErrorRate
	enabled         bool
	retentionPeriod time.Duration
	mu              sync.RWMutex
}

// HealthCheck represents a health check
type HealthCheck struct {
	Name            string                 `json:"name"`
	Type            string                 `json:"type"` // service, database, cache, external
	Status          string                 `json:"status"` // healthy, degraded, unhealthy
	LastCheck       time.Time              `json:"last_check"`
	ResponseTime    time.Duration          `json:"response_time"`
	ErrorMessage    string                 `json:"error_message,omitempty"`
	CheckFunction   func() HealthResult    `json:"-"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// HealthResult represents the result of a health check
type HealthResult struct {
	Status       string        `json:"status"`
	ResponseTime time.Duration `json:"response_time"`
	Error        error         `json:"error,omitempty"`
	Metadata     map[string]interface{} `json:"metadata"`
}

// HealthStatus represents overall system health
type HealthStatus struct {
	Status          string                 `json:"status"`
	Score           float64                `json:"score"` // 0-100
	LastUpdated     time.Time              `json:"last_updated"`
	ComponentHealth map[string]string      `json:"component_health"`
	Issues          []string               `json:"issues"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// PerformanceMetrics represents performance metrics for a component
type PerformanceMetrics struct {
	ComponentName   string                 `json:"component_name"`
	ResponseTime    *TimeMetrics           `json:"response_time"`
	Throughput      *ThroughputMetrics     `json:"throughput"`
	ResourceUsage   *ResourceMetrics       `json:"resource_usage"`
	LastUpdated     time.Time              `json:"last_updated"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// TimeMetrics represents time-based metrics
type TimeMetrics struct {
	Average     time.Duration `json:"average"`
	Min         time.Duration `json:"min"`
	Max         time.Duration `json:"max"`
	P50         time.Duration `json:"p50"`
	P95         time.Duration `json:"p95"`
	P99         time.Duration `json:"p99"`
	SampleCount int64         `json:"sample_count"`
}

// ThroughputMetrics represents throughput metrics
type ThroughputMetrics struct {
	RequestsPerSecond float64   `json:"requests_per_second"`
	RequestsPerMinute float64   `json:"requests_per_minute"`
	RequestsPerHour   float64   `json:"requests_per_hour"`
	TotalRequests     int64     `json:"total_requests"`
	LastUpdated       time.Time `json:"last_updated"`
}

// ResourceMetrics represents resource usage metrics
type ResourceMetrics struct {
	CPUUsage    float64   `json:"cpu_usage"`
	MemoryUsage int64     `json:"memory_usage"`
	GoroutineCount int    `json:"goroutine_count"`
	LastUpdated time.Time `json:"last_updated"`
}

// PerformanceBenchmark represents performance benchmarks
type PerformanceBenchmark struct {
	Name            string        `json:"name"`
	TargetValue     float64       `json:"target_value"`
	CurrentValue    float64       `json:"current_value"`
	Unit            string        `json:"unit"`
	Status          string        `json:"status"` // meeting, exceeding, failing
	LastUpdated     time.Time     `json:"last_updated"`
}

// UserSession represents a user session
type UserSession struct {
	UserID          string                 `json:"user_id"`
	SessionID       string                 `json:"session_id"`
	StartTime       time.Time              `json:"start_time"`
	LastActivity    time.Time              `json:"last_activity"`
	RequestCount    int                    `json:"request_count"`
	ServiceTypes    []string               `json:"service_types"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// ServiceUsage represents service usage statistics
type ServiceUsage struct {
	ServiceType     string                 `json:"service_type"`
	RequestCount    int64                  `json:"request_count"`
	UniqueUsers     int64                  `json:"unique_users"`
	AverageResponseTime time.Duration      `json:"average_response_time"`
	SuccessRate     float64                `json:"success_rate"`
	LastUpdated     time.Time              `json:"last_updated"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// UsagePattern represents usage patterns
type UsagePattern struct {
	PatternType     string                 `json:"pattern_type"` // hourly, daily, weekly
	Data            map[string]float64     `json:"data"`
	PeakHours       []int                  `json:"peak_hours"`
	LowHours        []int                  `json:"low_hours"`
	Trend           string                 `json:"trend"` // increasing, decreasing, stable
	LastUpdated     time.Time              `json:"last_updated"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// ErrorEvent represents an error event
type ErrorEvent struct {
	ID              string                 `json:"id"`
	Timestamp       time.Time              `json:"timestamp"`
	ErrorType       string                 `json:"error_type"`
	ErrorMessage    string                 `json:"error_message"`
	Component       string                 `json:"component"`
	UserID          string                 `json:"user_id,omitempty"`
	SessionID       string                 `json:"session_id,omitempty"`
	StackTrace      string                 `json:"stack_trace,omitempty"`
	Severity        string                 `json:"severity"` // low, medium, high, critical
	Resolved        bool                   `json:"resolved"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// ErrorPattern represents error patterns
type ErrorPattern struct {
	PatternID       string                 `json:"pattern_id"`
	ErrorType       string                 `json:"error_type"`
	Frequency       int64                  `json:"frequency"`
	FirstOccurrence time.Time              `json:"first_occurrence"`
	LastOccurrence  time.Time              `json:"last_occurrence"`
	AffectedUsers   []string               `json:"affected_users"`
	Resolution      string                 `json:"resolution,omitempty"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// ErrorRate represents error rates
type ErrorRate struct {
	Component       string    `json:"component"`
	ErrorsPerMinute float64   `json:"errors_per_minute"`
	ErrorsPerHour   float64   `json:"errors_per_hour"`
	TotalErrors     int64     `json:"total_errors"`
	LastUpdated     time.Time `json:"last_updated"`
}

// NewMonitoringService creates a new monitoring service
func NewMonitoringService() *MonitoringService {
	return &MonitoringService{
		analyticsService: NewAnalyticsService(),
		healthChecker: &HealthChecker{
			checks:        make(map[string]*HealthCheck),
			overallHealth: &HealthStatus{
				Status:          "healthy",
				Score:           100.0,
				ComponentHealth: make(map[string]string),
				Issues:          []string{},
				Metadata:        make(map[string]interface{}),
			},
			enabled:       true,
			checkInterval: 30 * time.Second,
		},
		performanceTracker: &PerformanceTracker{
			metrics:          make(map[string]*PerformanceMetrics),
			benchmarks:       createDefaultBenchmarks(),
			enabled:          true,
			trackingInterval: 1 * time.Minute,
		},
		usageTracker: &UsageTracker{
			userSessions:     make(map[string]*UserSession),
			serviceUsage:     make(map[string]*ServiceUsage),
			patterns:         make(map[string]*UsagePattern),
			enabled:          true,
			trackingInterval: 5 * time.Minute,
		},
		errorTracker: &ErrorTracker{
			errors:          []*ErrorEvent{},
			errorPatterns:   make(map[string]*ErrorPattern),
			errorRates:      make(map[string]*ErrorRate),
			enabled:         true,
			retentionPeriod: 24 * time.Hour,
		},
		enabled:            true,
		monitoringInterval: 1 * time.Minute,
	}
}

// StartMonitoring starts the monitoring service
func (ms *MonitoringService) StartMonitoring(ctx context.Context) error {
	if !ms.enabled {
		return fmt.Errorf("monitoring service is disabled")
	}

	// Start health checking
	go ms.startHealthChecking(ctx)

	// Start performance tracking
	go ms.startPerformanceTracking(ctx)

	// Start usage tracking
	go ms.startUsageTracking(ctx)

	// Start error tracking cleanup
	go ms.startErrorTracking(ctx)

	logrus.Info("Monitoring service started")
	return nil
}

// RecordPersonaMetrics records metrics for persona operations
func (ms *MonitoringService) RecordPersonaMetrics(ctx context.Context, operation string, duration time.Duration, success bool, metadata map[string]interface{}) {
	if !ms.enabled {
		return
	}

	// Record in analytics service
	ms.analyticsService.RecordMetric(ctx, fmt.Sprintf("persona_%s_duration_ms", operation), float64(duration.Milliseconds()), map[string]string{
		"operation": operation,
		"success":   fmt.Sprintf("%t", success),
	})

	// Record success rate
	successValue := 0.0
	if success {
		successValue = 1.0
	}
	ms.analyticsService.RecordMetric(ctx, fmt.Sprintf("persona_%s_success", operation), successValue, map[string]string{
		"operation": operation,
	})

	// Update performance metrics
	ms.updatePerformanceMetrics(operation, duration, success)

	logrus.WithFields(logrus.Fields{
		"operation": operation,
		"duration":  duration,
		"success":   success,
	}).Debug("Persona metrics recorded")
}

// RecordUserSession records user session information
func (ms *MonitoringService) RecordUserSession(ctx context.Context, userID, sessionID string, serviceType string) {
	if !ms.enabled || !ms.usageTracker.enabled {
		return
	}

	ms.usageTracker.mu.Lock()
	defer ms.usageTracker.mu.Unlock()

	session, exists := ms.usageTracker.userSessions[sessionID]
	if !exists {
		session = &UserSession{
			UserID:       userID,
			SessionID:    sessionID,
			StartTime:    time.Now(),
			LastActivity: time.Now(),
			RequestCount: 0,
			ServiceTypes: []string{},
			Metadata:     make(map[string]interface{}),
		}
		ms.usageTracker.userSessions[sessionID] = session
	}

	session.LastActivity = time.Now()
	session.RequestCount++

	// Add service type if not already present
	found := false
	for _, st := range session.ServiceTypes {
		if st == serviceType {
			found = true
			break
		}
	}
	if !found {
		session.ServiceTypes = append(session.ServiceTypes, serviceType)
	}

	// Update service usage
	ms.updateServiceUsage(serviceType)
}

// RecordError records an error event
func (ms *MonitoringService) RecordError(ctx context.Context, errorType, errorMessage, component string, severity string, metadata map[string]interface{}) {
	if !ms.enabled || !ms.errorTracker.enabled {
		return
	}

	ms.errorTracker.mu.Lock()
	defer ms.errorTracker.mu.Unlock()

	errorEvent := &ErrorEvent{
		ID:           fmt.Sprintf("error_%d", time.Now().UnixNano()),
		Timestamp:    time.Now(),
		ErrorType:    errorType,
		ErrorMessage: errorMessage,
		Component:    component,
		Severity:     severity,
		Resolved:     false,
		Metadata:     metadata,
	}

	ms.errorTracker.errors = append(ms.errorTracker.errors, errorEvent)

	// Update error patterns
	ms.updateErrorPatterns(errorEvent)

	// Update error rates
	ms.updateErrorRates(component)

	// Record in analytics
	ms.analyticsService.RecordMetric(ctx, "error_count", 1, map[string]string{
		"error_type": errorType,
		"component":  component,
		"severity":   severity,
	})

	logrus.WithFields(logrus.Fields{
		"error_id":      errorEvent.ID,
		"error_type":    errorType,
		"component":     component,
		"severity":      severity,
	}).Error("Error recorded")
}

// GetSystemHealth returns current system health status
func (ms *MonitoringService) GetSystemHealth() *HealthStatus {
	ms.healthChecker.mu.RLock()
	defer ms.healthChecker.mu.RUnlock()

	// Create a copy to prevent concurrent access issues
	health := &HealthStatus{
		Status:          ms.healthChecker.overallHealth.Status,
		Score:           ms.healthChecker.overallHealth.Score,
		LastUpdated:     ms.healthChecker.overallHealth.LastUpdated,
		ComponentHealth: make(map[string]string),
		Issues:          make([]string, len(ms.healthChecker.overallHealth.Issues)),
		Metadata:        make(map[string]interface{}),
	}

	for k, v := range ms.healthChecker.overallHealth.ComponentHealth {
		health.ComponentHealth[k] = v
	}
	copy(health.Issues, ms.healthChecker.overallHealth.Issues)
	for k, v := range ms.healthChecker.overallHealth.Metadata {
		health.Metadata[k] = v
	}

	return health
}

// GetPerformanceMetrics returns current performance metrics
func (ms *MonitoringService) GetPerformanceMetrics() map[string]*PerformanceMetrics {
	ms.performanceTracker.mu.RLock()
	defer ms.performanceTracker.mu.RUnlock()

	// Return a copy to prevent concurrent access issues
	metrics := make(map[string]*PerformanceMetrics)
	for name, metric := range ms.performanceTracker.metrics {
		metrics[name] = metric
	}

	return metrics
}

// GetUsageStatistics returns current usage statistics
func (ms *MonitoringService) GetUsageStatistics() map[string]*ServiceUsage {
	ms.usageTracker.mu.RLock()
	defer ms.usageTracker.mu.RUnlock()

	// Return a copy to prevent concurrent access issues
	usage := make(map[string]*ServiceUsage)
	for service, stats := range ms.usageTracker.serviceUsage {
		usage[service] = stats
	}

	return usage
}

// GetErrorStatistics returns current error statistics
func (ms *MonitoringService) GetErrorStatistics() map[string]*ErrorRate {
	ms.errorTracker.mu.RLock()
	defer ms.errorTracker.mu.RUnlock()

	// Return a copy to prevent concurrent access issues
	errorRates := make(map[string]*ErrorRate)
	for component, rate := range ms.errorTracker.errorRates {
		errorRates[component] = rate
	}

	return errorRates
}

// Helper methods

func (ms *MonitoringService) startHealthChecking(ctx context.Context) {
	ticker := time.NewTicker(ms.healthChecker.checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			ms.performHealthChecks()
		}
	}
}

func (ms *MonitoringService) performHealthChecks() {
	if !ms.healthChecker.enabled {
		return
	}

	ms.healthChecker.mu.Lock()
	defer ms.healthChecker.mu.Unlock()

	totalScore := 0.0
	healthyCount := 0
	totalCount := 0

	for name, check := range ms.healthChecker.checks {
		if check.CheckFunction != nil {
			result := check.CheckFunction()
			check.Status = result.Status
			check.ResponseTime = result.ResponseTime
			check.LastCheck = time.Now()
			
			if result.Error != nil {
				check.ErrorMessage = result.Error.Error()
			} else {
				check.ErrorMessage = ""
			}

			ms.healthChecker.overallHealth.ComponentHealth[name] = result.Status
			
			if result.Status == "healthy" {
				healthyCount++
				totalScore += 100
			} else if result.Status == "degraded" {
				totalScore += 50
			}
			totalCount++
		}
	}

	// Calculate overall health
	if totalCount > 0 {
		ms.healthChecker.overallHealth.Score = totalScore / float64(totalCount)
		
		if ms.healthChecker.overallHealth.Score >= 90 {
			ms.healthChecker.overallHealth.Status = "healthy"
		} else if ms.healthChecker.overallHealth.Score >= 70 {
			ms.healthChecker.overallHealth.Status = "degraded"
		} else {
			ms.healthChecker.overallHealth.Status = "unhealthy"
		}
	}

	ms.healthChecker.overallHealth.LastUpdated = time.Now()
}

func (ms *MonitoringService) startPerformanceTracking(ctx context.Context) {
	ticker := time.NewTicker(ms.performanceTracker.trackingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			ms.updatePerformanceBenchmarks()
		}
	}
}

func (ms *MonitoringService) startUsageTracking(ctx context.Context) {
	ticker := time.NewTicker(ms.usageTracker.trackingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			ms.analyzeUsagePatterns()
		}
	}
}

func (ms *MonitoringService) startErrorTracking(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			ms.cleanupOldErrors()
		}
	}
}

func (ms *MonitoringService) updatePerformanceMetrics(operation string, duration time.Duration, success bool) {
	ms.performanceTracker.mu.Lock()
	defer ms.performanceTracker.mu.Unlock()

	metrics, exists := ms.performanceTracker.metrics[operation]
	if !exists {
		metrics = &PerformanceMetrics{
			ComponentName: operation,
			ResponseTime: &TimeMetrics{
				Min: duration,
				Max: duration,
				SampleCount: 0,
			},
			Throughput: &ThroughputMetrics{
				TotalRequests: 0,
			},
			ResourceUsage: &ResourceMetrics{},
			Metadata:      make(map[string]interface{}),
		}
		ms.performanceTracker.metrics[operation] = metrics
	}

	// Update response time metrics
	metrics.ResponseTime.SampleCount++
	if duration < metrics.ResponseTime.Min {
		metrics.ResponseTime.Min = duration
	}
	if duration > metrics.ResponseTime.Max {
		metrics.ResponseTime.Max = duration
	}

	// Simple average calculation (in production, use more sophisticated methods)
	if metrics.ResponseTime.Average == 0 {
		metrics.ResponseTime.Average = duration
	} else {
		metrics.ResponseTime.Average = (metrics.ResponseTime.Average + duration) / 2
	}

	// Update throughput
	metrics.Throughput.TotalRequests++
	metrics.LastUpdated = time.Now()
}

func (ms *MonitoringService) updateServiceUsage(serviceType string) {
	usage, exists := ms.usageTracker.serviceUsage[serviceType]
	if !exists {
		usage = &ServiceUsage{
			ServiceType:  serviceType,
			RequestCount: 0,
			UniqueUsers:  0,
			SuccessRate:  1.0,
			Metadata:     make(map[string]interface{}),
		}
		ms.usageTracker.serviceUsage[serviceType] = usage
	}

	usage.RequestCount++
	usage.LastUpdated = time.Now()
}

func (ms *MonitoringService) updateErrorPatterns(errorEvent *ErrorEvent) {
	patternID := fmt.Sprintf("%s_%s", errorEvent.ErrorType, errorEvent.Component)
	
	pattern, exists := ms.errorTracker.errorPatterns[patternID]
	if !exists {
		pattern = &ErrorPattern{
			PatternID:       patternID,
			ErrorType:       errorEvent.ErrorType,
			Frequency:       0,
			FirstOccurrence: errorEvent.Timestamp,
			AffectedUsers:   []string{},
			Metadata:        make(map[string]interface{}),
		}
		ms.errorTracker.errorPatterns[patternID] = pattern
	}

	pattern.Frequency++
	pattern.LastOccurrence = errorEvent.Timestamp
}

func (ms *MonitoringService) updateErrorRates(component string) {
	rate, exists := ms.errorTracker.errorRates[component]
	if !exists {
		rate = &ErrorRate{
			Component:   component,
			TotalErrors: 0,
		}
		ms.errorTracker.errorRates[component] = rate
	}

	rate.TotalErrors++
	rate.LastUpdated = time.Now()

	// Calculate rates (simplified)
	now := time.Now()
	if rate.LastUpdated.Before(now.Add(-1 * time.Minute)) {
		rate.ErrorsPerMinute = 1.0
	} else {
		rate.ErrorsPerMinute++
	}
}

func (ms *MonitoringService) updatePerformanceBenchmarks() {
	// Update benchmarks based on current metrics
	// This is a simplified implementation
}

func (ms *MonitoringService) analyzeUsagePatterns() {
	// Analyze usage patterns
	// This is a simplified implementation
}

func (ms *MonitoringService) cleanupOldErrors() {
	ms.errorTracker.mu.Lock()
	defer ms.errorTracker.mu.Unlock()

	cutoff := time.Now().Add(-ms.errorTracker.retentionPeriod)
	filteredErrors := []*ErrorEvent{}

	for _, errorEvent := range ms.errorTracker.errors {
		if errorEvent.Timestamp.After(cutoff) {
			filteredErrors = append(filteredErrors, errorEvent)
		}
	}

	ms.errorTracker.errors = filteredErrors
}

func createDefaultBenchmarks() map[string]*PerformanceBenchmark {
	return map[string]*PerformanceBenchmark{
		"persona_processing": {
			Name:         "Persona Processing Time",
			TargetValue:  10.0,
			Unit:         "ms",
			Status:       "meeting",
			LastUpdated:  time.Now(),
		},
		"response_time": {
			Name:         "Overall Response Time",
			TargetValue:  100.0,
			Unit:         "ms",
			Status:       "meeting",
			LastUpdated:  time.Now(),
		},
	}
}

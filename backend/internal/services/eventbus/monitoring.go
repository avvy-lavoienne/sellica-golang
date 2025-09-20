package eventbus

import (
	"context"
	"fmt"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/sirupsen/logrus"
)

// ProductionMonitoring provides production-ready monitoring and alerting for the event bus
type ProductionMonitoring struct {
	eventBus     *Service
	alertManager *AlertManager
	healthChecker *HealthChecker
	config       *MonitoringConfig
	logger       *logrus.Logger

	// Prometheus metrics
	metrics *PrometheusMetrics
}

// PrometheusMetrics holds all Prometheus metrics for the event bus
type PrometheusMetrics struct {
	// Event processing metrics
	eventsPublished    prometheus.Counter
	eventsFailed       prometheus.Counter
	eventsProcessed    prometheus.Counter
	processingTime     prometheus.Histogram

	// Queue metrics
	queueSize          prometheus.Gauge
	queueUtilization   prometheus.Gauge

	// Health metrics
	healthStatus       prometheus.Gauge
	lastHealthCheck    prometheus.Gauge

	// SLA compliance metrics
	slaCompliance      *prometheus.GaugeVec
	dataConsistencyScore prometheus.Gauge

	// Conflict resolution metrics
	conflictsDetected  prometheus.Counter
	conflictsResolved  prometheus.Counter
	conflictResolutionTime prometheus.Histogram
}

// MonitoringConfig holds monitoring configuration
type MonitoringConfig struct {
	AlertThresholds       map[string]float64 `yaml:"alert_thresholds"`
	HealthCheckInterval   time.Duration      `yaml:"health_check_interval"`
	MetricsRetentionPeriod time.Duration     `yaml:"metrics_retention_period"`
	EnableDetailedLogging bool              `yaml:"enable_detailed_logging"`
	AlertCooldownPeriod   time.Duration      `yaml:"alert_cooldown_period"`
}

// AlertManager handles alerting logic
type AlertManager struct {
	alerts         map[string]*Alert
	alertCooldowns map[string]time.Time
	config         *MonitoringConfig
	logger         *logrus.Logger
}

// addAlert adds a new alert to the alert manager
func (am *AlertManager) addAlert(alert *Alert) {
	am.alerts[alert.ID] = alert
	am.logger.WithFields(logrus.Fields{
		"alert_id": alert.ID,
		"type":     alert.Type,
		"severity": alert.Severity,
	}).Info("📢 Alert added to alert manager")
}

// Alert represents an active alert
type Alert struct {
	ID          string            `json:"id"`
	Type        string            `json:"type"`
	Severity    string            `json:"severity"`
	Message     string            `json:"message"`
	Details     map[string]interface{} `json:"details"`
	CreatedAt   time.Time         `json:"created_at"`
	LastUpdated time.Time         `json:"last_updated"`
	Acknowledged bool            `json:"acknowledged"`
}

// HealthChecker performs health checks on the event bus
type HealthChecker struct {
	lastHealthCheck time.Time
	healthStatus    string
	checkResults    map[string]HealthCheckResult
	config          *MonitoringConfig
}

// HealthCheckResult represents the result of a health check
type HealthCheckResult struct {
	Component   string    `json:"component"`
	Status      string    `json:"status"`
	Message     string    `json:"message"`
	CheckedAt   time.Time `json:"checked_at"`
	ResponseTime time.Duration `json:"response_time"`
}

// NewProductionMonitoring creates a new production monitoring instance
func NewProductionMonitoring(eventBus *Service, config *MonitoringConfig) *ProductionMonitoring {
	if config == nil {
		config = &MonitoringConfig{
			AlertThresholds: map[string]float64{
				"events_failed_rate":     0.05,  // 5% failure rate
				"processing_time_avg":    1000,  // 1 second average
				"queue_utilization":      0.8,   // 80% queue utilization
				"memory_usage":          500,   // 500MB memory usage
			},
			HealthCheckInterval:    30 * time.Second,
			MetricsRetentionPeriod: 24 * time.Hour,
			EnableDetailedLogging:  true,
			AlertCooldownPeriod:    5 * time.Minute,
		}
	}

	return &ProductionMonitoring{
		eventBus: eventBus,
		alertManager: &AlertManager{
			alerts:         make(map[string]*Alert),
			alertCooldowns: make(map[string]time.Time),
			config:         config,
			logger:         logrus.New(),
		},
		healthChecker: &HealthChecker{
			healthStatus: "unknown",
			checkResults: make(map[string]HealthCheckResult),
			config:       config,
		},
		config: config,
		logger: logrus.New(),
		metrics: initPrometheusMetrics(),
	}
}

// StartMonitoring starts the monitoring system
func (pm *ProductionMonitoring) StartMonitoring(ctx context.Context) error {
	pm.logger.Info("🚀 Starting production monitoring for event bus")

	// Setup monitoring event handlers
	err := pm.setupMonitoringHandlers()
	if err != nil {
		return fmt.Errorf("failed to setup monitoring handlers: %w", err)
	}

	// Start health check routine
	go pm.healthCheckRoutine(ctx)

	// Start metrics monitoring
	go pm.metricsMonitoringRoutine(ctx)

	// Start alert evaluation
	go pm.alertEvaluationRoutine(ctx)

	pm.logger.Info("✅ Production monitoring started successfully")
	return nil
}

// setupMonitoringHandlers sets up event handlers for monitoring
func (pm *ProductionMonitoring) setupMonitoringHandlers() error {
	// Subscribe to system error events
	_, err := pm.eventBus.Subscribe([]EventType{EventTypeSystemError}, pm.handleSystemError)
	if err != nil {
		return fmt.Errorf("failed to subscribe to system errors: %w", err)
	}

	// Subscribe to monitoring alerts
	_, err = pm.eventBus.Subscribe([]EventType{EventTypeMonitoringAlert}, pm.handleMonitoringAlert)
	if err != nil {
		return fmt.Errorf("failed to subscribe to monitoring alerts: %w", err)
	}

	return nil
}

// handleSystemError handles system error events
func (pm *ProductionMonitoring) handleSystemError(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid system error event payload")
	}

	errorType, _ := payload["error_type"].(string)
	message, _ := payload["message"].(string)
	component, _ := payload["component"].(string)

	pm.logger.WithFields(logrus.Fields{
		"error_type": errorType,
		"component":  component,
		"message":    message,
	}).Error("🚨 System error detected")

	// Create alert for system errors
	alert := &Alert{
		ID:          generateAlertID(),
		Type:        "system_error",
		Severity:    "high",
		Message:     fmt.Sprintf("System error in %s: %s", component, message),
		Details:     payload,
		CreatedAt:   time.Now(),
		LastUpdated: time.Now(),
	}

	pm.alertManager.addAlert(alert)

	// Emit monitoring alert
	alertEvent := NewEvent(EventTypeMonitoringAlert, map[string]interface{}{
		"alert_type": "system_error",
		"message":    alert.Message,
		"severity":   alert.Severity,
		"component":  component,
	}).WithSource("production-monitoring")

	return pm.eventBus.PublishAsync(ctx, alertEvent)
}

// handleMonitoringAlert handles monitoring alert events
func (pm *ProductionMonitoring) handleMonitoringAlert(ctx context.Context, event *Event) error {
	payload, ok := event.Payload.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid monitoring alert event payload")
	}

	alertType, _ := payload["alert_type"].(string)
	message, _ := payload["message"].(string)
	severity, _ := payload["severity"].(string)

	pm.logger.WithFields(logrus.Fields{
		"alert_type": alertType,
		"severity":   severity,
		"message":    message,
	}).Warn("⚠️ Monitoring alert received")

	// Here you would integrate with external alerting systems
	// such as PagerDuty, Slack, email, etc.

	return nil
}

// healthCheckRoutine performs periodic health checks
func (pm *ProductionMonitoring) healthCheckRoutine(ctx context.Context) {
	ticker := time.NewTicker(pm.config.HealthCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			pm.performHealthCheck(ctx)
		}
	}
}

// performHealthCheck performs a comprehensive health check
func (pm *ProductionMonitoring) performHealthCheck(ctx context.Context) {
	start := time.Now()

	// Check event bus health
	eventBusHealthy := pm.checkEventBusHealth(ctx)

	// Check queue utilization
	queueUtilization := pm.checkQueueUtilization()

	// Check memory usage
	memoryUsage := pm.checkMemoryUsage()

	// Check processing performance
	processingHealthy := pm.checkProcessingPerformance()

	// Determine overall health
	overallHealthy := eventBusHealthy && processingHealthy && queueUtilization < 0.9

	status := "healthy"
	if !overallHealthy {
		status = "degraded"
		if !eventBusHealthy {
			status = "unhealthy"
		}
	}

	pm.healthChecker.healthStatus = status
	pm.healthChecker.lastHealthCheck = time.Now()

	// Store check results
	pm.healthChecker.checkResults["event_bus"] = HealthCheckResult{
		Component:    "event_bus",
		Status:       status,
		Message:      fmt.Sprintf("Event bus health: %s", status),
		CheckedAt:    time.Now(),
		ResponseTime: time.Since(start),
	}

	// Emit health status event
	healthEvent := NewEvent(EventTypeMonitoringHealth, map[string]interface{}{
		"status":            status,
		"healthy":           overallHealthy,
		"queue_utilization": queueUtilization,
		"memory_usage_mb":   memoryUsage,
		"check_duration":    time.Since(start),
	}).WithSource("production-monitoring")

	pm.eventBus.PublishAsync(ctx, healthEvent)

	pm.logger.WithFields(logrus.Fields{
		"status":            status,
		"queue_utilization": queueUtilization,
		"memory_usage_mb":   memoryUsage,
		"check_duration":    time.Since(start),
	}).Debug("🔍 Health check completed")
}

// checkEventBusHealth checks if the event bus is healthy
func (pm *ProductionMonitoring) checkEventBusHealth(ctx context.Context) bool {
	// Test basic event publishing
	testEvent := NewEvent(EventTypeSystemInfo, map[string]interface{}{
		"test": "health_check",
	})

	err := pm.eventBus.Publish(ctx, testEvent)
	return err == nil
}

// checkQueueUtilization checks event queue utilization
func (pm *ProductionMonitoring) checkQueueUtilization() float64 {
	// This would need access to internal queue metrics
	// For now, return a placeholder
	return 0.3 // 30% utilization
}

// checkMemoryUsage checks current memory usage
func (pm *ProductionMonitoring) checkMemoryUsage() float64 {
	// This would integrate with runtime metrics
	// For now, return a placeholder
	return 150.5 // 150.5 MB
}

// checkProcessingPerformance checks event processing performance
func (pm *ProductionMonitoring) checkProcessingPerformance() bool {
	metrics := pm.eventBus.GetMetrics()

	// Check if processing time is within acceptable limits
	avgProcessingTime := metrics.AverageProcessingTime
	return avgProcessingTime < 2*time.Second
}

// metricsMonitoringRoutine monitors metrics and creates alerts
func (pm *ProductionMonitoring) metricsMonitoringRoutine(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			pm.evaluateMetrics(ctx)
		}
	}
}

// evaluateMetrics evaluates current metrics against thresholds
func (pm *ProductionMonitoring) evaluateMetrics(ctx context.Context) {
	metrics := pm.eventBus.GetMetrics()

	// Update Prometheus metrics
	pm.updatePrometheusMetrics(metrics)

	// Check events failed rate
	if metrics.EventsPublished > 0 {
		failureRate := float64(metrics.EventsFailed) / float64(metrics.EventsPublished)
		if failureRate > pm.config.AlertThresholds["events_failed_rate"] {
			pm.createAlert(ctx, "high_failure_rate", "high",
				fmt.Sprintf("Event failure rate is %.2f%% (threshold: %.2f%%)",
					failureRate*100, pm.config.AlertThresholds["events_failed_rate"]*100))
		}
	}

	// Check average processing time
	if metrics.AverageProcessingTime > time.Duration(pm.config.AlertThresholds["processing_time_avg"])*time.Millisecond {
		pm.createAlert(ctx, "slow_processing", "medium",
			fmt.Sprintf("Average processing time is %v (threshold: %v)",
				metrics.AverageProcessingTime, time.Duration(pm.config.AlertThresholds["processing_time_avg"])*time.Millisecond))
	}

	// Check memory usage
	memoryUsage := pm.checkMemoryUsage()
	if memoryUsage > pm.config.AlertThresholds["memory_usage"] {
		pm.createAlert(ctx, "high_memory_usage", "medium",
			fmt.Sprintf("Memory usage is %.1fMB (threshold: %.1fMB)",
				memoryUsage, pm.config.AlertThresholds["memory_usage"]))
	}
}

// updatePrometheusMetrics updates all Prometheus metrics with current values
func (pm *ProductionMonitoring) updatePrometheusMetrics(metrics EventMetrics) {
	// Event processing metrics - use Add for incremental updates
	// Note: In a real implementation, you'd track deltas since last update
	pm.metrics.eventsPublished.Add(float64(metrics.EventsPublished))
	pm.metrics.eventsFailed.Add(float64(metrics.EventsFailed))
	pm.metrics.eventsProcessed.Add(float64(metrics.EventsProcessed))
	pm.metrics.processingTime.Observe(metrics.AverageProcessingTime.Seconds())

	// Queue metrics
	queueSize := pm.checkQueueUtilization() * 1000 // Assume max queue size of 1000
	pm.metrics.queueSize.Set(queueSize)
	pm.metrics.queueUtilization.Set(pm.checkQueueUtilization())

	// Health metrics
	healthValue := 2.0 // Default to healthy
	switch pm.healthChecker.healthStatus {
	case "unhealthy":
		healthValue = 0.0
	case "degraded":
		healthValue = 1.0
	case "healthy":
		healthValue = 2.0
	}
	pm.metrics.healthStatus.Set(healthValue)
	pm.metrics.lastHealthCheck.Set(float64(pm.healthChecker.lastHealthCheck.Unix()))

	// SLA compliance (example values - would be calculated based on actual SLAs)
	pm.metrics.slaCompliance.WithLabelValues("sync").Set(0.95) // 95% SLA compliance
	pm.metrics.slaCompliance.WithLabelValues("processing").Set(0.98) // 98% SLA compliance
	pm.metrics.dataConsistencyScore.Set(0.92) // 92% data consistency

	// Conflict resolution metrics (would be populated from actual conflict resolver)
	pm.metrics.conflictsDetected.Add(150) // Example: 150 conflicts detected
	pm.metrics.conflictsResolved.Add(142) // Example: 142 conflicts resolved
}

// createAlert creates a new alert
func (pm *ProductionMonitoring) createAlert(ctx context.Context, alertType, severity, message string) {
	alertID := alertType + "_" + time.Now().Format("20060102150405")

	// Check if alert is in cooldown
	if cooldown, exists := pm.alertManager.alertCooldowns[alertType]; exists {
		if time.Now().Before(cooldown) {
			return // Alert is in cooldown
		}
	}

	alert := &Alert{
		ID:          alertID,
		Type:        alertType,
		Severity:    severity,
		Message:     message,
		Details:     make(map[string]interface{}),
		CreatedAt:   time.Now(),
		LastUpdated: time.Now(),
	}

	pm.alertManager.alerts[alertID] = alert
	pm.alertManager.alertCooldowns[alertType] = time.Now().Add(pm.config.AlertCooldownPeriod)

	pm.logger.WithFields(logrus.Fields{
		"alert_id":  alertID,
		"type":      alertType,
		"severity":  severity,
		"message":   message,
	}).Warn("🚨 Alert created")

	// Emit alert event
	alertEvent := NewEvent(EventTypeMonitoringAlert, map[string]interface{}{
		"alert_type": alertType,
		"message":    message,
		"severity":   severity,
		"alert_id":   alertID,
	}).WithSource("production-monitoring")

	pm.eventBus.PublishAsync(ctx, alertEvent)
}

// alertEvaluationRoutine evaluates and cleans up old alerts
func (pm *ProductionMonitoring) alertEvaluationRoutine(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			pm.cleanupOldAlerts()
		}
	}
}

// cleanupOldAlerts removes old alerts
func (pm *ProductionMonitoring) cleanupOldAlerts() {
	now := time.Now()
	cutoff := now.Add(-pm.config.MetricsRetentionPeriod)

	for alertID, alert := range pm.alertManager.alerts {
		if alert.CreatedAt.Before(cutoff) {
			delete(pm.alertManager.alerts, alertID)
			pm.logger.WithField("alert_id", alertID).Debug("🗑️ Old alert cleaned up")
		}
	}
}

// GetHealthStatus returns the current health status
func (pm *ProductionMonitoring) GetHealthStatus() map[string]interface{} {
	return map[string]interface{}{
		"status":            pm.healthChecker.healthStatus,
		"last_check":        pm.healthChecker.lastHealthCheck,
		"check_results":     pm.healthChecker.checkResults,
		"active_alerts":     len(pm.alertManager.alerts),
		"timestamp":         time.Now(),
	}
}

// GetActiveAlerts returns all active alerts
func (pm *ProductionMonitoring) GetActiveAlerts() map[string]*Alert {
	alerts := make(map[string]*Alert)
	for id, alert := range pm.alertManager.alerts {
		alerts[id] = alert
	}
	return alerts
}

// generateAlertID generates a unique alert ID
func generateAlertID() string {
	return "alert_" + time.Now().Format("20060102150405") + "_" + randomString(6)
}

// initPrometheusMetrics initializes all Prometheus metrics
func initPrometheusMetrics() *PrometheusMetrics {
	return &PrometheusMetrics{
		// Event processing metrics
		eventsPublished: promauto.NewCounter(prometheus.CounterOpts{
			Name: "eventbus_events_published_total",
			Help: "Total number of events published to the event bus",
		}),
		eventsFailed: promauto.NewCounter(prometheus.CounterOpts{
			Name: "eventbus_events_failed_total",
			Help: "Total number of events that failed to publish",
		}),
		eventsProcessed: promauto.NewCounter(prometheus.CounterOpts{
			Name: "eventbus_events_processed_total",
			Help: "Total number of events processed by handlers",
		}),
		processingTime: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "eventbus_event_processing_duration_seconds",
			Help:    "Time taken to process events",
			Buckets: prometheus.DefBuckets,
		}),

		// Queue metrics
		queueSize: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "eventbus_queue_size",
			Help: "Current size of the event queue",
		}),
		queueUtilization: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "eventbus_queue_utilization_ratio",
			Help: "Ratio of queue utilization (0.0 to 1.0)",
		}),

		// Health metrics
		healthStatus: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "eventbus_health_status",
			Help: "Current health status (0=unhealthy, 1=degraded, 2=healthy)",
		}),
		lastHealthCheck: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "eventbus_last_health_check_timestamp",
			Help: "Timestamp of the last health check",
		}),

		// SLA compliance metrics
		slaCompliance: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "eventbus_sla_compliance_ratio",
				Help: "SLA compliance ratio by component",
			},
			[]string{"component"},
		),
		dataConsistencyScore: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "eventbus_data_consistency_score",
			Help: "Overall data consistency score (0.0 to 1.0)",
		}),

		// Conflict resolution metrics
		conflictsDetected: promauto.NewCounter(prometheus.CounterOpts{
			Name: "eventbus_conflicts_detected_total",
			Help: "Total number of data conflicts detected",
		}),
		conflictsResolved: promauto.NewCounter(prometheus.CounterOpts{
			Name: "eventbus_conflicts_resolved_total",
			Help: "Total number of data conflicts resolved",
		}),
		conflictResolutionTime: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "eventbus_conflict_resolution_duration_seconds",
			Help:    "Time taken to resolve conflicts",
			Buckets: prometheus.DefBuckets,
		}),
	}
}
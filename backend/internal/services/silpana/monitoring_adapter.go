package silpana

import (
	"context"
	"time"

	"github.com/sirupsen/logrus"
)

// MonitoringAdapter wraps the existing monitoring service for SILPANA operations
type MonitoringAdapter struct {
	service MonitoringServiceInterface
}

// MonitoringServiceInterface defines the interface for the existing monitoring service
type MonitoringServiceInterface interface {
	IncrementCounter(name string, labels map[string]string)
	RecordMetric(name string, value float64, labels map[string]string)
	RecordDuration(name string, duration time.Duration, labels map[string]string)
	IsHealthy() bool
}

// NewMonitoringAdapter creates a new monitoring adapter for SILPANA
func NewMonitoringAdapter(service MonitoringServiceInterface) MonitoringService {
	return &MonitoringAdapter{
		service: service,
	}
}

// RecordMetric records a metric value with labels
func (ma *MonitoringAdapter) RecordMetric(name string, value float64, labels map[string]string) {
	if !ma.service.IsHealthy() {
		logrus.Warn("Monitoring service not healthy, skipping metric recording")
		return
	}

	// Add SILPANA prefix to metric names
	metricName := "silpana_" + name
	ma.service.RecordMetric(metricName, value, labels)

	logrus.Debugf("SILPANA: Recorded metric %s = %f with labels %v", metricName, value, labels)
}

// RecordDuration records a duration metric with labels
func (ma *MonitoringAdapter) RecordDuration(name string, duration time.Duration, labels map[string]string) {
	if !ma.service.IsHealthy() {
		logrus.Warn("Monitoring service not healthy, skipping duration recording")
		return
	}

	// Add SILPANA prefix to metric names
	metricName := "silpana_" + name
	ma.service.RecordDuration(metricName, duration, labels)

	logrus.Debugf("SILPANA: Recorded duration %s = %v with labels %v", metricName, duration, labels)
}

// IncrementCounter increments a counter metric with labels
func (ma *MonitoringAdapter) IncrementCounter(name string, labels map[string]string) {
	if !ma.service.IsHealthy() {
		logrus.Warn("Monitoring service not healthy, skipping counter increment")
		return
	}

	// Add SILPANA prefix to metric names
	metricName := "silpana_" + name
	ma.service.IncrementCounter(metricName, labels)

	logrus.Debugf("SILPANA: Incremented counter %s with labels %v", metricName, labels)
}

// HealthCheck performs a health check for the monitoring service
func (ma *MonitoringAdapter) HealthCheck(ctx context.Context) error {
	if !ma.service.IsHealthy() {
		return context.DeadlineExceeded // Return a context error for monitoring issues
	}
	return nil
}

// SILPANA-specific monitoring helper methods

// TrackTicketOperation tracks ticket operation performance
func (ma *MonitoringAdapter) TrackTicketOperation(operation string, duration time.Duration, success bool, ticketCode string) {
	labels := map[string]string{
		"operation": operation,
		"success":   "true",
	}

	if !success {
		labels["success"] = "false"
	}

	// Record operation duration
	ma.RecordDuration("ticket_operation_duration", duration, labels)

	// Increment operation counter
	ma.IncrementCounter("ticket_operations_total", labels)

	logrus.Infof("SILPANA: Tracked %s operation for ticket %s (duration: %v, success: %v)",
		operation, ticketCode, duration, success)
}

// TrackTicketStatus tracks ticket status changes
func (ma *MonitoringAdapter) TrackTicketStatus(oldStatus, newStatus TicketStatus, ticketCode string) {
	labels := map[string]string{
		"old_status": string(oldStatus),
		"new_status": string(newStatus),
	}

	ma.IncrementCounter("ticket_status_changes_total", labels)

	// Track current status distribution
	statusLabels := map[string]string{
		"status": string(newStatus),
	}
	ma.IncrementCounter("ticket_status_current", statusLabels)

	logrus.Infof("SILPANA: Tracked status change for ticket %s: %s -> %s",
		ticketCode, oldStatus, newStatus)
}

// TrackTicketCreation tracks new ticket creation
func (ma *MonitoringAdapter) TrackTicketCreation(priority TicketPriority, documentType string, ticketCode string) {
	labels := map[string]string{
		"priority":      string(priority),
		"document_type": documentType,
	}

	ma.IncrementCounter("tickets_created_total", labels)

	logrus.Infof("SILPANA: Tracked creation of ticket %s (priority: %s, type: %s)",
		ticketCode, priority, documentType)
}

// TrackLookupPerformance tracks ticket lookup performance
func (ma *MonitoringAdapter) TrackLookupPerformance(duration time.Duration, cacheHit bool, ticketCode string) {
	labels := map[string]string{
		"cache_hit": "false",
	}

	if cacheHit {
		labels["cache_hit"] = "true"
	}

	ma.RecordDuration("ticket_lookup_duration", duration, labels)
	ma.IncrementCounter("ticket_lookups_total", labels)

	logrus.Debugf("SILPANA: Tracked lookup for ticket %s (duration: %v, cache_hit: %v)",
		ticketCode, duration, cacheHit)
}

// TrackCacheOperations tracks cache operation metrics
func (ma *MonitoringAdapter) TrackCacheOperations(operation string, success bool, duration time.Duration) {
	labels := map[string]string{
		"operation": operation,
		"success":   "true",
	}

	if !success {
		labels["success"] = "false"
	}

	ma.RecordDuration("cache_operation_duration", duration, labels)
	ma.IncrementCounter("cache_operations_total", labels)
}

// TrackDatabaseOperations tracks database operation metrics
func (ma *MonitoringAdapter) TrackDatabaseOperations(operation string, success bool, duration time.Duration) {
	labels := map[string]string{
		"operation": operation,
		"success":   "true",
	}

	if !success {
		labels["success"] = "false"
	}

	ma.RecordDuration("database_operation_duration", duration, labels)
	ma.IncrementCounter("database_operations_total", labels)
}

// TrackErrorRates tracks error rates by type
func (ma *MonitoringAdapter) TrackErrorRates(errorType string, operation string) {
	labels := map[string]string{
		"error_type": errorType,
		"operation":  operation,
	}

	ma.IncrementCounter("errors_total", labels)

	logrus.Warnf("SILPANA: Tracked error %s in operation %s", errorType, operation)
}

// TrackUserExperience tracks user experience metrics
func (ma *MonitoringAdapter) TrackUserExperience(operation string, responseTime time.Duration, userSatisfied bool) {
	labels := map[string]string{
		"operation":      operation,
		"user_satisfied": "true",
	}

	if !userSatisfied {
		labels["user_satisfied"] = "false"
	}

	ma.RecordDuration("user_experience_response_time", responseTime, labels)
	ma.IncrementCounter("user_interactions_total", labels)
}

// TrackSystemHealth tracks overall system health metrics
func (ma *MonitoringAdapter) TrackSystemHealth(component string, healthy bool, responseTime time.Duration) {
	labels := map[string]string{
		"component": component,
		"healthy":   "true",
	}

	if !healthy {
		labels["healthy"] = "false"
	}

	ma.RecordDuration("health_check_duration", responseTime, labels)
	ma.IncrementCounter("health_checks_total", labels)

	// Record health status as a gauge-like metric
	healthValue := 1.0
	if !healthy {
		healthValue = 0.0
	}
	ma.RecordMetric("component_health_status", healthValue, map[string]string{"component": component})
}

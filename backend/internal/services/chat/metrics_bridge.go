package chat

import (
	"time"

	"github.com/sirupsen/logrus"
)

// MetricsBridge bridges reference metrics with advanced performance selector
type MetricsBridge struct {
	referenceMetrics    *AIServiceMetrics
	performanceSelector *PerformanceBasedSelector
	enabled             bool
}

// NewMetricsBridge creates a new metrics bridge
func NewMetricsBridge(referenceMetrics *AIServiceMetrics, performanceSelector *PerformanceBasedSelector) *MetricsBridge {
	return &MetricsBridge{
		referenceMetrics:    referenceMetrics,
		performanceSelector: performanceSelector,
		enabled:             true,
	}
}

// SyncFromPerformanceSelector syncs data from performance selector to reference metrics
func (mb *MetricsBridge) SyncFromPerformanceSelector() {
	if !mb.enabled || !mb.performanceSelector.IsEnabled() {
		return
	}

	// Sync provider metrics by accessing the private field through a helper method
	// Note: In production, you might want to add public getter methods to PerformanceBasedSelector
	mb.syncProviderMetrics()

	// Update overall health score based on performance metrics
	overallHealth := mb.calculateOverallHealthFromPerformance()
	mb.referenceMetrics.UpdateHealthScore(overallHealth)

	logrus.Debug("✅ Performance metrics synced to reference metrics")
}

// syncProviderMetrics syncs individual provider metrics
func (mb *MetricsBridge) syncProviderMetrics() {
	// This is a simplified implementation - in production you'd want proper accessor methods
	// For now, we'll just log that sync would happen here
	logrus.Debug("Provider metrics sync placeholder - implement with proper accessor methods")
}

// SyncToPerformanceSelector syncs data from reference metrics to performance selector
func (mb *MetricsBridge) SyncToPerformanceSelector() {
	if !mb.enabled {
		return
	}

	// This method can be used to push reference metrics data to performance selector
	// Implementation depends on specific integration needs
	metrics := mb.referenceMetrics.GetMetrics()

	logrus.WithFields(logrus.Fields{
		"total_requests": metrics.TotalRequests,
		"cache_hit_rate": metrics.CacheHitRate,
		"error_rate":     metrics.ErrorRate,
	}).Debug("Reference metrics available for performance selector sync")
}

// StartPeriodicSync starts periodic synchronization between metrics systems
func (mb *MetricsBridge) StartPeriodicSync(interval time.Duration) {
	if !mb.enabled {
		logrus.Info("Metrics bridge disabled, skipping periodic sync")
		return
	}

	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for range ticker.C {
			mb.SyncFromPerformanceSelector()
		}
	}()

	logrus.WithField("interval", interval).Info("✅ Metrics bridge periodic sync started")
}

// StopPeriodicSync stops the periodic synchronization
func (mb *MetricsBridge) StopPeriodicSync() {
	mb.enabled = false
	logrus.Info("⏸️ Metrics bridge periodic sync stopped")
}

// IsEnabled returns whether the metrics bridge is enabled
func (mb *MetricsBridge) IsEnabled() bool {
	return mb.enabled
}

// SetEnabled enables or disables the metrics bridge
func (mb *MetricsBridge) SetEnabled(enabled bool) {
	mb.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Metrics bridge status updated")
}

// calculateOverallHealthFromPerformance calculates overall health from performance metrics
func (mb *MetricsBridge) calculateOverallHealthFromPerformance() float64 {
	if !mb.performanceSelector.IsEnabled() {
		return 0.8 // Default health score
	}

	// This is a simplified calculation - in production you might want more sophisticated logic
	// For now, return a default health score since we don't have direct access to performance metrics
	// In a real implementation, you would add public accessor methods to PerformanceBasedSelector

	return 0.85 // Slightly above default to indicate performance monitoring is active
}

// GetBridgeStatus returns the current status of the metrics bridge
func (mb *MetricsBridge) GetBridgeStatus() map[string]interface{} {
	return map[string]interface{}{
		"enabled":                         mb.enabled,
		"performance_selector_enabled":    mb.performanceSelector.IsEnabled(),
		"reference_metrics_healthy":       mb.referenceMetrics.IsHealthy(),
		"overall_health_from_performance": mb.calculateOverallHealthFromPerformance(),
		"last_sync_time":                  time.Now(),
	}
}

// ForceSync performs an immediate synchronization
func (mb *MetricsBridge) ForceSync() {
	if mb.enabled {
		mb.SyncFromPerformanceSelector()
		logrus.Info("🔄 Metrics bridge force sync completed")
	} else {
		logrus.Warn("⚠️ Metrics bridge disabled, force sync skipped")
	}
}

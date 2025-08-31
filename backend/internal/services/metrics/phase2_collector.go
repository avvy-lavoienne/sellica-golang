package metrics

import (
	"context"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// Phase2MetricsCollector collects comprehensive Phase 2 metrics
type Phase2MetricsCollector struct {
	enabled                    bool
	regionalProcessingTime     time.Duration
	religiousProcessingTime    time.Duration
	faceSavingProcessingTime   time.Duration
	totalRequests              int64
	regionalAdaptations        int64
	religiousAwarenessApplied  int64
	faceSavingApplied          int64
	qualityValidationPassed    int64
	performanceOptimizations   int64
	errorRate                  float64
	lastUpdated                time.Time
	mu                         sync.RWMutex
}

// NewPhase2MetricsCollector creates a new Phase 2 metrics collector
func NewPhase2MetricsCollector() *Phase2MetricsCollector {
	return &Phase2MetricsCollector{
		enabled:     true,
		lastUpdated: time.Now(),
	}
}

// RecordRegionalProcessing records regional processing metrics
func (p2mc *Phase2MetricsCollector) RecordRegionalProcessing(duration time.Duration, applied bool) {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()

	p2mc.regionalProcessingTime += duration
	if applied {
		p2mc.regionalAdaptations++
	}
	p2mc.lastUpdated = time.Now()
}

// RecordReligiousProcessing records religious processing metrics
func (p2mc *Phase2MetricsCollector) RecordReligiousProcessing(duration time.Duration, applied bool) {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()

	p2mc.religiousProcessingTime += duration
	if applied {
		p2mc.religiousAwarenessApplied++
	}
	p2mc.lastUpdated = time.Now()
}

// RecordFaceSavingProcessing records face-saving processing metrics
func (p2mc *Phase2MetricsCollector) RecordFaceSavingProcessing(duration time.Duration, applied bool) {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()

	p2mc.faceSavingProcessingTime += duration
	if applied {
		p2mc.faceSavingApplied++
	}
	p2mc.lastUpdated = time.Now()
}

// RecordQualityValidation records quality validation metrics
func (p2mc *Phase2MetricsCollector) RecordQualityValidation(passed bool) {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()

	if passed {
		p2mc.qualityValidationPassed++
	}
	p2mc.lastUpdated = time.Now()
}

// RecordPerformanceOptimization records performance optimization metrics
func (p2mc *Phase2MetricsCollector) RecordPerformanceOptimization(applied bool) {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()

	if applied {
		p2mc.performanceOptimizations++
	}
	p2mc.lastUpdated = time.Now()
}

// RecordRequest records a new request
func (p2mc *Phase2MetricsCollector) RecordRequest() {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()

	p2mc.totalRequests++
	p2mc.lastUpdated = time.Now()
}

// RecordError records processing errors
func (p2mc *Phase2MetricsCollector) RecordError(component string, err error) {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()

	p2mc.errorRate += 0.01 // Increment error rate
	p2mc.lastUpdated = time.Now()

	logrus.WithFields(logrus.Fields{
		"component": component,
		"error":     err.Error(),
	}).Warn("Phase 2 processing error recorded")
}

// GetMetrics returns current Phase 2 processing metrics
func (p2mc *Phase2MetricsCollector) GetMetrics() map[string]interface{} {
	p2mc.mu.RLock()
	defer p2mc.mu.RUnlock()

	// Calculate averages
	regionalAvgTime := time.Duration(0)
	religiousAvgTime := time.Duration(0)
	faceSavingAvgTime := time.Duration(0)

	if p2mc.totalRequests > 0 {
		regionalAvgTime = p2mc.regionalProcessingTime / time.Duration(p2mc.totalRequests)
		religiousAvgTime = p2mc.religiousProcessingTime / time.Duration(p2mc.totalRequests)
		faceSavingAvgTime = p2mc.faceSavingProcessingTime / time.Duration(p2mc.totalRequests)
	}

	return map[string]interface{}{
		"enabled":                     p2mc.enabled,
		"total_requests":              p2mc.totalRequests,
		"regional_adaptations":        p2mc.regionalAdaptations,
		"religious_awareness_applied": p2mc.religiousAwarenessApplied,
		"face_saving_applied":         p2mc.faceSavingApplied,
		"quality_validation_passed":   p2mc.qualityValidationPassed,
		"performance_optimizations":   p2mc.performanceOptimizations,
		"error_rate":                  p2mc.errorRate,
		"processing_times": map[string]float64{
			"regional_avg_ms":  float64(regionalAvgTime.Milliseconds()),
			"religious_avg_ms": float64(religiousAvgTime.Milliseconds()),
			"face_saving_avg_ms": float64(faceSavingAvgTime.Milliseconds()),
			"regional_total_ms":  float64(p2mc.regionalProcessingTime.Milliseconds()),
			"religious_total_ms": float64(p2mc.religiousProcessingTime.Milliseconds()),
			"face_saving_total_ms": float64(p2mc.faceSavingProcessingTime.Milliseconds()),
		},
		"application_rates": map[string]float64{
			"regional_rate":      p2mc.calculateRate(p2mc.regionalAdaptations),
			"religious_rate":     p2mc.calculateRate(p2mc.religiousAwarenessApplied),
			"face_saving_rate":   p2mc.calculateRate(p2mc.faceSavingApplied),
			"quality_pass_rate":  p2mc.calculateRate(p2mc.qualityValidationPassed),
			"optimization_rate":  p2mc.calculateRate(p2mc.performanceOptimizations),
		},
		"last_updated": p2mc.lastUpdated,
	}
}

// calculateRate calculates application rate as percentage
func (p2mc *Phase2MetricsCollector) calculateRate(count int64) float64 {
	if p2mc.totalRequests == 0 {
		return 0.0
	}
	return float64(count) / float64(p2mc.totalRequests) * 100.0
}

// GetSummary returns a summary of Phase 2 metrics
func (p2mc *Phase2MetricsCollector) GetSummary() map[string]interface{} {
	metrics := p2mc.GetMetrics()

	return map[string]interface{}{
		"total_requests": metrics["total_requests"],
		"enhancement_summary": map[string]interface{}{
			"regional_adaptations":        metrics["regional_adaptations"],
			"religious_awareness_applied": metrics["religious_awareness_applied"],
			"face_saving_applied":         metrics["face_saving_applied"],
			"quality_validation_passed":   metrics["quality_validation_passed"],
			"performance_optimizations":   metrics["performance_optimizations"],
		},
		"performance_summary": map[string]interface{}{
			"error_rate":      metrics["error_rate"],
			"processing_times": metrics["processing_times"],
			"application_rates": metrics["application_rates"],
		},
		"last_updated": metrics["last_updated"],
	}
}

// Reset resets all metrics
func (p2mc *Phase2MetricsCollector) Reset() {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()

	p2mc.regionalProcessingTime = 0
	p2mc.religiousProcessingTime = 0
	p2mc.faceSavingProcessingTime = 0
	p2mc.totalRequests = 0
	p2mc.regionalAdaptations = 0
	p2mc.religiousAwarenessApplied = 0
	p2mc.faceSavingApplied = 0
	p2mc.qualityValidationPassed = 0
	p2mc.performanceOptimizations = 0
	p2mc.errorRate = 0.0
	p2mc.lastUpdated = time.Now()

	logrus.Info("Phase 2 metrics collector reset")
}

// IsEnabled returns whether metrics collection is enabled
func (p2mc *Phase2MetricsCollector) IsEnabled() bool {
	p2mc.mu.RLock()
	defer p2mc.mu.RUnlock()
	return p2mc.enabled
}

// SetEnabled enables or disables metrics collection
func (p2mc *Phase2MetricsCollector) SetEnabled(enabled bool) {
	p2mc.mu.Lock()
	defer p2mc.mu.Unlock()
	p2mc.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Phase 2 metrics collector status updated")
}

// ExportMetrics exports metrics for external monitoring systems
func (p2mc *Phase2MetricsCollector) ExportMetrics(ctx context.Context) error {
	if !p2mc.enabled {
		return nil
	}

	metrics := p2mc.GetMetrics()

	// In a real implementation, this would export to monitoring systems
	// like Prometheus, DataDog, or custom dashboards
	logrus.WithFields(logrus.Fields{
		"total_requests":              metrics["total_requests"],
		"regional_adaptations":        metrics["regional_adaptations"],
		"religious_awareness_applied": metrics["religious_awareness_applied"],
		"face_saving_applied":         metrics["face_saving_applied"],
		"error_rate":                  metrics["error_rate"],
	}).Info("Phase 2 metrics exported")

	return nil
}

// GetHealthStatus returns the health status of the metrics collector
func (p2mc *Phase2MetricsCollector) GetHealthStatus() map[string]interface{} {
	p2mc.mu.RLock()
	defer p2mc.mu.RUnlock()

	status := "healthy"
	if p2mc.errorRate > 0.1 { // More than 10% error rate
		status = "warning"
	}
	if p2mc.errorRate > 0.5 { // More than 50% error rate
		status = "critical"
	}

	return map[string]interface{}{
		"status":      status,
		"enabled":     p2mc.enabled,
		"error_rate":  p2mc.errorRate,
		"last_updated": p2mc.lastUpdated,
		"uptime":      time.Since(p2mc.lastUpdated),
	}
}
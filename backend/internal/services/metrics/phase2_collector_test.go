package metrics

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewPhase2MetricsCollector(t *testing.T) {
	collector := NewPhase2MetricsCollector()
	assert.NotNil(t, collector)
	assert.True(t, collector.enabled)
	assert.Equal(t, int64(0), collector.totalRequests)
}

func TestPhase2MetricsCollector_RecordRegionalProcessing(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	// Test recording applied adaptation
	duration := 100 * time.Millisecond
	collector.RecordRegionalProcessing(duration, true)

	assert.Equal(t, int64(1), collector.regionalAdaptations)
	assert.Equal(t, duration, collector.regionalProcessingTime)

	// Test recording non-applied adaptation
	collector.RecordRegionalProcessing(duration, false)

	assert.Equal(t, int64(1), collector.regionalAdaptations) // Should not increase
	assert.Equal(t, 2*duration, collector.regionalProcessingTime)
}

func TestPhase2MetricsCollector_RecordReligiousProcessing(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	duration := 50 * time.Millisecond
	collector.RecordReligiousProcessing(duration, true)

	assert.Equal(t, int64(1), collector.religiousAwarenessApplied)
	assert.Equal(t, duration, collector.religiousProcessingTime)
}

func TestPhase2MetricsCollector_RecordFaceSavingProcessing(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	duration := 75 * time.Millisecond
	collector.RecordFaceSavingProcessing(duration, true)

	assert.Equal(t, int64(1), collector.faceSavingApplied)
	assert.Equal(t, duration, collector.faceSavingProcessingTime)
}

func TestPhase2MetricsCollector_RecordQualityValidation(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	// Test passed validation
	collector.RecordQualityValidation(true)
	assert.Equal(t, int64(1), collector.qualityValidationPassed)

	// Test failed validation
	collector.RecordQualityValidation(false)
	assert.Equal(t, int64(1), collector.qualityValidationPassed) // Should not increase
}

func TestPhase2MetricsCollector_RecordPerformanceOptimization(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	collector.RecordPerformanceOptimization(true)
	assert.Equal(t, int64(1), collector.performanceOptimizations)

	collector.RecordPerformanceOptimization(false)
	assert.Equal(t, int64(1), collector.performanceOptimizations) // Should not increase
}

func TestPhase2MetricsCollector_RecordRequest(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	collector.RecordRequest()
	assert.Equal(t, int64(1), collector.totalRequests)

	collector.RecordRequest()
	assert.Equal(t, int64(2), collector.totalRequests)
}

func TestPhase2MetricsCollector_RecordError(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	collector.RecordError("test_component", assert.AnError)
	assert.Equal(t, 0.01, collector.errorRate)
}

func TestPhase2MetricsCollector_GetMetrics(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	// Add some test data
	collector.RecordRequest()
	collector.RecordRegionalProcessing(100*time.Millisecond, true)
	collector.RecordReligiousProcessing(50*time.Millisecond, true)
	collector.RecordFaceSavingProcessing(75*time.Millisecond, true)
	collector.RecordQualityValidation(true)
	collector.RecordPerformanceOptimization(true)

	metrics := collector.GetMetrics()

	assert.Equal(t, int64(1), metrics["total_requests"])
	assert.Equal(t, int64(1), metrics["regional_adaptations"])
	assert.Equal(t, int64(1), metrics["religious_awareness_applied"])
	assert.Equal(t, int64(1), metrics["face_saving_applied"])
	assert.Equal(t, int64(1), metrics["quality_validation_passed"])
	assert.Equal(t, int64(1), metrics["performance_optimizations"])

	// Check processing times
	processingTimes := metrics["processing_times"].(map[string]float64)
	assert.Equal(t, 100.0, processingTimes["regional_total_ms"])
	assert.Equal(t, 50.0, processingTimes["religious_total_ms"])
	assert.Equal(t, 75.0, processingTimes["face_saving_total_ms"])
}

func TestPhase2MetricsCollector_GetSummary(t *testing.T) {
	collector := NewPhase2MetricsCollector()
	collector.RecordRequest()

	summary := collector.GetSummary()

	assert.Contains(t, summary, "total_requests")
	assert.Contains(t, summary, "enhancement_summary")
	assert.Contains(t, summary, "performance_summary")
	assert.Contains(t, summary, "last_updated")
}

func TestPhase2MetricsCollector_IsEnabled(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	assert.True(t, collector.IsEnabled())

	collector.SetEnabled(false)
	assert.False(t, collector.IsEnabled())
}

func TestPhase2MetricsCollector_Reset(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	// Add some data
	collector.RecordRequest()
	collector.RecordRegionalProcessing(100*time.Millisecond, true)

	// Reset
	collector.Reset()

	assert.Equal(t, int64(0), collector.totalRequests)
	assert.Equal(t, time.Duration(0), collector.regionalProcessingTime)
	assert.Equal(t, int64(0), collector.regionalAdaptations)
}

func TestPhase2MetricsCollector_calculateRate(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	// Test with zero requests
	rate := collector.calculateRate(5)
	assert.Equal(t, 0.0, rate)

	// Test with requests
	collector.totalRequests = 10
	rate = collector.calculateRate(5)
	assert.Equal(t, 50.0, rate)
}

func TestPhase2MetricsCollector_GetHealthStatus(t *testing.T) {
	collector := NewPhase2MetricsCollector()

	// Test healthy status
	status := collector.GetHealthStatus()
	assert.Equal(t, "healthy", status["status"])
	assert.True(t, status["enabled"].(bool))

	// Test warning status
	collector.errorRate = 0.15
	status = collector.GetHealthStatus()
	assert.Equal(t, "warning", status["status"])

	// Test critical status
	collector.errorRate = 0.8
	status = collector.GetHealthStatus()
	assert.Equal(t, "critical", status["status"])
}
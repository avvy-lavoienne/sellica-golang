package monitoring

import (
	"runtime"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestService_NewService tests monitoring service initialization
func TestService_NewService(t *testing.T) {
	service := NewService()

	assert.NotNil(t, service)

	// Wait a moment for background metrics collection to start
	time.Sleep(50 * time.Millisecond)

	// Test metrics through public interface
	metrics := service.GetMetrics()
	assert.NotNil(t, metrics)
	assert.Contains(t, metrics, "requestCount")
	assert.Contains(t, metrics, "errorCount")
	assert.Contains(t, metrics, "avgResponseTime")
	assert.Contains(t, metrics, "systemMetrics")
	assert.Contains(t, metrics, "timestamp")

	// Initial values should be zero
	assert.Equal(t, int64(0), metrics["requestCount"])
	assert.Equal(t, int64(0), metrics["errorCount"])
}

// TestService_RecordRequest tests request recording
func TestService_RecordRequest(t *testing.T) {
	service := NewService()

	// Record some requests
	service.RecordRequest(100 * time.Millisecond)
	service.RecordRequest(200 * time.Millisecond)
	service.RecordRequest(150 * time.Millisecond)

	// Wait a moment for metrics to be updated
	time.Sleep(10 * time.Millisecond)

	metrics := service.GetMetrics()
	assert.Equal(t, int64(3), metrics["requestCount"])

	// Check that average response time is calculated
	avgResponseTime, ok := metrics["avgResponseTime"].(float64)
	assert.True(t, ok)
	assert.Greater(t, avgResponseTime, 0.0)

	// Average of 100, 200, 150 should be 150
	assert.InDelta(t, 150.0, avgResponseTime, 1.0)
}

// TestService_RecordError tests error recording
func TestService_RecordError(t *testing.T) {
	service := NewService()

	// Record some errors
	service.RecordError()
	service.RecordError()

	// Wait a moment for metrics to be updated
	time.Sleep(10 * time.Millisecond)

	metrics := service.GetMetrics()
	assert.Equal(t, int64(2), metrics["errorCount"])
}

// TestService_GetSystemMetrics tests system metrics collection
func TestService_GetSystemMetrics(t *testing.T) {
	service := NewService()

	systemMetrics := service.GetSystemMetrics()

	assert.NotNil(t, systemMetrics)
	assert.NotNil(t, systemMetrics.MemoryUsage)
	assert.Greater(t, systemMetrics.GoroutineCount, 0)
	assert.Greater(t, systemMetrics.CPUCount, 0)
	assert.GreaterOrEqual(t, systemMetrics.Uptime, 0.0)

	// Validate memory stats
	assert.Greater(t, systemMetrics.MemoryUsage.Alloc, uint64(0))
	assert.Greater(t, systemMetrics.MemoryUsage.Sys, uint64(0))
	assert.GreaterOrEqual(t, systemMetrics.MemoryUsage.NumGC, uint32(0))
	assert.Greater(t, systemMetrics.MemoryUsage.AllocMB, 0.0)
	assert.Greater(t, systemMetrics.MemoryUsage.SysMB, 0.0)
}

// TestService_GetMetrics tests metrics retrieval
func TestService_GetMetrics(t *testing.T) {
	service := NewService()

	// Record some activity
	service.RecordRequest(100 * time.Millisecond)
	service.RecordError()

	// Wait for background metrics collection
	time.Sleep(100 * time.Millisecond)

	metrics := service.GetMetrics()

	assert.NotNil(t, metrics)
	assert.Equal(t, int64(1), metrics["requestCount"])
	assert.Equal(t, int64(1), metrics["errorCount"])

	// Check calculated metrics
	assert.Contains(t, metrics, "avgResponseTime")
	assert.Contains(t, metrics, "errorRate")

	assert.Contains(t, metrics, "systemMetrics")
	assert.Contains(t, metrics, "timestamp")
}

// TestService_UpdateServiceHealth tests service health updates
func TestService_UpdateServiceHealth(t *testing.T) {
	service := NewService()

	// Update service health
	service.UpdateServiceHealth("database", map[string]interface{}{
		"status":      "healthy",
		"connections": 10,
		"latency":     "5ms",
	})

	service.UpdateServiceHealth("cache", map[string]interface{}{
		"status": "healthy",
		"hits":   100,
		"misses": 10,
	})

	// Wait for update
	time.Sleep(10 * time.Millisecond)

	// Use GetHealthStatus to access service health
	healthStatus := service.GetHealthStatus()

	if serviceHealth, ok := healthStatus["serviceHealth"].(map[string]interface{}); ok {
		assert.Contains(t, serviceHealth, "database")
		assert.Contains(t, serviceHealth, "cache")

		if dbHealth, ok := serviceHealth["database"].(map[string]interface{}); ok {
			assert.Equal(t, "healthy", dbHealth["status"])
			assert.Equal(t, 10, dbHealth["connections"])
		}

		if cacheHealth, ok := serviceHealth["cache"].(map[string]interface{}); ok {
			assert.Equal(t, "healthy", cacheHealth["status"])
			assert.Equal(t, 100, cacheHealth["hits"])
		}
	}
}

// TestService_ResponseTimeLimit tests response time array limit
func TestService_ResponseTimeLimit(t *testing.T) {
	service := NewService()

	// Record more than 1000 requests to test the limit
	for i := 0; i < 1200; i++ {
		service.RecordRequest(time.Duration(i) * time.Millisecond)
	}

	// Wait for processing
	time.Sleep(50 * time.Millisecond)

	metrics := service.GetMetrics()

	// Should have recorded all 1200 requests
	assert.Equal(t, int64(1200), metrics["requestCount"])

	// Average response time should be calculated (internal array is limited to 1000)
	avgResponseTime, ok := metrics["avgResponseTime"].(float64)
	assert.True(t, ok)
	assert.Greater(t, avgResponseTime, 0.0)
}

// TestService_ConcurrentAccess tests concurrent access to metrics
func TestService_ConcurrentAccess(t *testing.T) {
	service := NewService()

	// Start multiple goroutines to record metrics concurrently
	done := make(chan bool, 10)

	for i := 0; i < 10; i++ {
		go func(id int) {
			for j := 0; j < 100; j++ {
				service.RecordRequest(time.Duration(j) * time.Millisecond)
				if j%10 == 0 {
					service.RecordError()
				}
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines to complete
	for i := 0; i < 10; i++ {
		<-done
	}

	// Wait for processing
	time.Sleep(100 * time.Millisecond)

	metrics := service.GetMetrics()

	// Should have recorded all requests and errors
	assert.Equal(t, int64(1000), metrics["requestCount"])
	assert.Equal(t, int64(100), metrics["errorCount"])
}

// TestMemoryStats_Calculations tests memory statistics calculations
func TestMemoryStats_Calculations(t *testing.T) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	memStats := &MemoryStats{
		Alloc:       m.Alloc,
		TotalAlloc:  m.TotalAlloc,
		Sys:         m.Sys,
		NumGC:       m.NumGC,
		AllocMB:     float64(m.Alloc) / 1024 / 1024,
		SysMB:       float64(m.Sys) / 1024 / 1024,
		HeapInUseMB: float64(m.HeapInuse) / 1024 / 1024,
	}

	// Validate calculations
	expectedAllocMB := float64(m.Alloc) / 1024 / 1024
	expectedSysMB := float64(m.Sys) / 1024 / 1024
	expectedHeapMB := float64(m.HeapInuse) / 1024 / 1024

	// Validate all fields are properly set
	assert.Equal(t, m.Alloc, memStats.Alloc)
	assert.Equal(t, m.TotalAlloc, memStats.TotalAlloc)
	assert.Equal(t, m.Sys, memStats.Sys)
	assert.Equal(t, m.NumGC, memStats.NumGC)

	// Validate calculations
	assert.InDelta(t, expectedAllocMB, memStats.AllocMB, 0.01)
	assert.InDelta(t, expectedSysMB, memStats.SysMB, 0.01)
	assert.InDelta(t, expectedHeapMB, memStats.HeapInUseMB, 0.01)
}

// TestService_GetUptime tests uptime calculation
func TestService_GetUptime(t *testing.T) {
	service := NewService()

	// Wait a bit to ensure uptime > 0
	time.Sleep(10 * time.Millisecond)

	systemMetrics := service.GetSystemMetrics()

	assert.Greater(t, systemMetrics.Uptime, 0.0)
	assert.Less(t, systemMetrics.Uptime, 60.0) // Should be less than 60 seconds for a test
}

// TestService_MetricsConsistency tests metrics consistency over time
func TestService_MetricsConsistency(t *testing.T) {
	service := NewService()

	// Record initial metrics
	service.RecordRequest(100 * time.Millisecond)
	service.RecordError()

	metrics1 := service.GetMetrics()

	// Wait and record more metrics
	time.Sleep(50 * time.Millisecond)
	service.RecordRequest(200 * time.Millisecond)

	metrics2 := service.GetMetrics()

	// Verify consistency
	assert.Equal(t, int64(1), metrics1["requestCount"])
	assert.Equal(t, int64(2), metrics2["requestCount"])
	assert.Equal(t, int64(1), metrics1["errorCount"])
	assert.Equal(t, int64(1), metrics2["errorCount"])

	// Timestamp should be different
	if timestamp1, ok := metrics1["timestamp"].(time.Time); ok {
		if timestamp2, ok := metrics2["timestamp"].(time.Time); ok {
			assert.True(t, timestamp2.After(timestamp1))
		}
	}
}

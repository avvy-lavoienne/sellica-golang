package monitoring

import (
	"runtime"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// Service provides monitoring and metrics functionality
type Service struct {
	startTime time.Time
	metrics   *Metrics
	mu        sync.RWMutex
}

// Metrics holds performance and system metrics
type Metrics struct {
	RequestCount    int64                  `json:"requestCount"`
	ResponseTimes   []int64                `json:"responseTimes"`
	ErrorCount      int64                  `json:"errorCount"`
	SystemMetrics   *SystemMetrics         `json:"systemMetrics"`
	ServiceHealth   map[string]interface{} `json:"serviceHealth"`
	LastUpdated     time.Time              `json:"lastUpdated"`
	mu              sync.RWMutex
}

// SystemMetrics holds system-level performance data
type SystemMetrics struct {
	MemoryUsage    *MemoryStats `json:"memoryUsage"`
	GoroutineCount int          `json:"goroutineCount"`
	CPUCount       int          `json:"cpuCount"`
	Uptime         float64      `json:"uptimeSeconds"`
}

// MemoryStats holds memory usage statistics
type MemoryStats struct {
	Alloc        uint64  `json:"allocBytes"`
	TotalAlloc   uint64  `json:"totalAllocBytes"`
	Sys          uint64  `json:"sysBytes"`
	NumGC        uint32  `json:"numGC"`
	AllocMB      float64 `json:"allocMB"`
	SysMB        float64 `json:"sysMB"`
	HeapInUseMB  float64 `json:"heapInUseMB"`
}

// NewService creates a new monitoring service
func NewService() *Service {
	service := &Service{
		startTime: time.Now(),
		metrics: &Metrics{
			ResponseTimes: make([]int64, 0, 1000), // Keep last 1000 response times
			ServiceHealth: make(map[string]interface{}),
			LastUpdated:   time.Now(),
		},
	}

	// Start background metrics collection
	go service.startMetricsCollection()

	logrus.Info("✅ Monitoring service initialized")
	return service
}

// RecordRequest records a request with its response time
func (s *Service) RecordRequest(responseTime time.Duration) {
	s.metrics.mu.Lock()
	defer s.metrics.mu.Unlock()

	s.metrics.RequestCount++
	
	// Keep only last 1000 response times for memory efficiency
	if len(s.metrics.ResponseTimes) >= 1000 {
		s.metrics.ResponseTimes = s.metrics.ResponseTimes[1:]
	}
	s.metrics.ResponseTimes = append(s.metrics.ResponseTimes, responseTime.Milliseconds())
	s.metrics.LastUpdated = time.Now()
}

// RecordError records an error occurrence
func (s *Service) RecordError() {
	s.metrics.mu.Lock()
	defer s.metrics.mu.Unlock()

	s.metrics.ErrorCount++
	s.metrics.LastUpdated = time.Now()
}

// GetSystemMetrics returns current system metrics
func (s *Service) GetSystemMetrics() *SystemMetrics {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	return &SystemMetrics{
		MemoryUsage: &MemoryStats{
			Alloc:       m.Alloc,
			TotalAlloc:  m.TotalAlloc,
			Sys:         m.Sys,
			NumGC:       m.NumGC,
			AllocMB:     float64(m.Alloc) / 1024 / 1024,
			SysMB:       float64(m.Sys) / 1024 / 1024,
			HeapInUseMB: float64(m.HeapInuse) / 1024 / 1024,
		},
		GoroutineCount: runtime.NumGoroutine(),
		CPUCount:       runtime.NumCPU(),
		Uptime:         time.Since(s.startTime).Seconds(),
	}
}

// GetMetrics returns current performance metrics
func (s *Service) GetMetrics() map[string]interface{} {
	s.metrics.mu.RLock()
	defer s.metrics.mu.RUnlock()

	// Calculate average response time
	var avgResponseTime float64
	if len(s.metrics.ResponseTimes) > 0 {
		var total int64
		for _, rt := range s.metrics.ResponseTimes {
			total += rt
		}
		avgResponseTime = float64(total) / float64(len(s.metrics.ResponseTimes))
	}

	// Calculate error rate
	var errorRate float64
	if s.metrics.RequestCount > 0 {
		errorRate = float64(s.metrics.ErrorCount) / float64(s.metrics.RequestCount) * 100
	}

	return map[string]interface{}{
		"requestCount":       s.metrics.RequestCount,
		"errorCount":         s.metrics.ErrorCount,
		"errorRate":          errorRate,
		"avgResponseTime":    avgResponseTime,
		"recentResponseTime": s.getRecentResponseTime(),
		"systemMetrics":      s.GetSystemMetrics(),
		"uptime":             time.Since(s.startTime).Seconds(),
		"timestamp":          time.Now().UTC(),
		"version":            "go-1.0",
	}
}

// getRecentResponseTime calculates average response time for last 100 requests
func (s *Service) getRecentResponseTime() float64 {
	if len(s.metrics.ResponseTimes) == 0 {
		return 0
	}

	// Get last 100 response times or all if less than 100
	start := len(s.metrics.ResponseTimes) - 100
	if start < 0 {
		start = 0
	}

	recentTimes := s.metrics.ResponseTimes[start:]
	var total int64
	for _, rt := range recentTimes {
		total += rt
	}

	return float64(total) / float64(len(recentTimes))
}

// UpdateServiceHealth updates health status for a service
func (s *Service) UpdateServiceHealth(serviceName string, health interface{}) {
	s.metrics.mu.Lock()
	defer s.metrics.mu.Unlock()

	s.metrics.ServiceHealth[serviceName] = health
	s.metrics.LastUpdated = time.Now()
}

// GetHealthStatus returns overall system health status
func (s *Service) GetHealthStatus() map[string]interface{} {
	s.metrics.mu.RLock()
	defer s.metrics.mu.RUnlock()

	systemMetrics := s.GetSystemMetrics()
	
	// Determine overall health based on system metrics
	isHealthy := true
	healthIssues := make([]string, 0)

	// Check memory usage (alert if > 500MB)
	if systemMetrics.MemoryUsage.AllocMB > 500 {
		isHealthy = false
		healthIssues = append(healthIssues, "High memory usage")
	}

	// Check goroutine count (alert if > 1000)
	if systemMetrics.GoroutineCount > 1000 {
		isHealthy = false
		healthIssues = append(healthIssues, "High goroutine count")
	}

	// Check error rate (alert if > 5%)
	var errorRate float64
	if s.metrics.RequestCount > 0 {
		errorRate = float64(s.metrics.ErrorCount) / float64(s.metrics.RequestCount) * 100
	}
	if errorRate > 5.0 {
		isHealthy = false
		healthIssues = append(healthIssues, "High error rate")
	}

	status := "healthy"
	if !isHealthy {
		status = "degraded"
	}

	return map[string]interface{}{
		"status":         status,
		"healthy":        isHealthy,
		"issues":         healthIssues,
		"systemMetrics":  systemMetrics,
		"serviceHealth":  s.metrics.ServiceHealth,
		"errorRate":      errorRate,
		"uptime":         time.Since(s.startTime).Seconds(),
		"timestamp":      time.Now().UTC(),
	}
}

// startMetricsCollection starts background metrics collection
func (s *Service) startMetricsCollection() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// Update system metrics periodically
		s.metrics.mu.Lock()
		s.metrics.SystemMetrics = s.GetSystemMetrics()
		s.metrics.LastUpdated = time.Now()
		s.metrics.mu.Unlock()

		// Log system health periodically (every 5 minutes)
		if int(time.Since(s.startTime).Minutes())%5 == 0 {
			health := s.GetHealthStatus()
			logrus.WithFields(logrus.Fields{
				"status":      health["status"],
				"uptime":      health["uptime"],
				"requests":    s.metrics.RequestCount,
				"errors":      s.metrics.ErrorCount,
				"memory_mb":   s.metrics.SystemMetrics.MemoryUsage.AllocMB,
				"goroutines":  s.metrics.SystemMetrics.GoroutineCount,
			}).Info("📊 System health check")
		}
	}
}

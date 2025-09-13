package monitoring

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// ComponentHealth represents the health of a single component
type ComponentHealth struct {
	Name        string                 `json:"name"`
	Status      string                 `json:"status"`
	LastChecked time.Time              `json:"lastChecked"`
	ResponseTime time.Duration         `json:"responseTime"`
	Details     map[string]interface{} `json:"details,omitempty"`
	Error       string                 `json:"error,omitempty"`
}

// SystemHealthExtended represents the overall system health with additional monitoring features
type SystemHealthExtended struct {
	Status           string                         `json:"status"`
	Timestamp        time.Time                      `json:"timestamp"`
	Uptime           time.Duration                  `json:"uptime"`
	Version          string                         `json:"version"`
	Components       map[string]*ComponentHealth    `json:"components"`
	SystemMetrics    *SystemMetrics                 `json:"systemMetrics"`
	PerformanceStats *PerformanceStats              `json:"performanceStats"`
	Alerts           []Alert                        `json:"alerts,omitempty"`
}

// MemoryMetrics represents memory usage metrics
type MemoryMetrics struct {
	AllocBytes      uint64  `json:"allocBytes"`
	TotalAllocBytes uint64  `json:"totalAllocBytes"`
	SysBytes        uint64  `json:"sysBytes"`
	NumGC           uint32  `json:"numGC"`
	AllocMB         float64 `json:"allocMB"`
	SysMB           float64 `json:"sysMB"`
	HeapInUseMB     float64 `json:"heapInUseMB"`
}

// GCMetrics represents garbage collection metrics
type GCMetrics struct {
	NumGC        uint32        `json:"numGC"`
	PauseTotal   time.Duration `json:"pauseTotal"`
	LastPause    time.Duration `json:"lastPause"`
	NextGC       uint64        `json:"nextGC"`
	EnabledGC    bool          `json:"enabledGC"`
}

// PerformanceStats represents performance statistics
type PerformanceStats struct {
	RequestsPerSecond    float64       `json:"requestsPerSecond"`
	AverageResponseTime  time.Duration `json:"averageResponseTime"`
	P95ResponseTime      time.Duration `json:"p95ResponseTime"`
	P99ResponseTime      time.Duration `json:"p99ResponseTime"`
	ErrorRate            float64       `json:"errorRate"`
	ActiveConnections    int           `json:"activeConnections"`
	CacheHitRatio        float64       `json:"cacheHitRatio"`
	DatabaseConnections  int           `json:"databaseConnections"`
}

// Alert represents a system alert
type Alert struct {
	ID          string    `json:"id"`
	Level       string    `json:"level"` // info, warning, critical
	Component   string    `json:"component"`
	Message     string    `json:"message"`
	Timestamp   time.Time `json:"timestamp"`
	Resolved    bool      `json:"resolved"`
	ResolvedAt  *time.Time `json:"resolvedAt,omitempty"`
}

// ComponentHealthChecker interface for health check implementations
type ComponentHealthChecker interface {
	Name() string
	Check(ctx context.Context) *ComponentHealth
}

// HealthMonitor manages health checks and system monitoring
type HealthMonitor struct {
	checkers         map[string]ComponentHealthChecker
	systemHealth     *SystemHealthExtended
	startTime        time.Time
	version          string
	alertThresholds  *AlertThresholds
	alerts           []Alert
	performanceStats *PerformanceStats
	mutex            sync.RWMutex

	// Metrics collection
	requestCount     int64
	errorCount       int64
	responseTimes    []time.Duration
	lastMetricsReset time.Time
}

// AlertThresholds defines thresholds for generating alerts
type AlertThresholds struct {
	ResponseTimeWarning  time.Duration `json:"responseTimeWarning"`
	ResponseTimeCritical time.Duration `json:"responseTimeCritical"`
	ErrorRateWarning     float64       `json:"errorRateWarning"`
	ErrorRateCritical    float64       `json:"errorRateCritical"`
	MemoryWarning        float64       `json:"memoryWarning"`
	MemoryCritical       float64       `json:"memoryCritical"`
	CPUWarning           float64       `json:"cpuWarning"`
	CPUCritical          float64       `json:"cpuCritical"`
}

// NewHealthMonitor creates a new health monitor
func NewHealthMonitor(version string) *HealthMonitor {
	return &HealthMonitor{
		checkers:    make(map[string]ComponentHealthChecker),
		startTime:   time.Now(),
		version:     version,
		systemHealth: &SystemHealthExtended{
			Status:     HealthStatusHealthy,
			Version:    version,
			Components: make(map[string]*ComponentHealth),
		},
		alertThresholds: &AlertThresholds{
			ResponseTimeWarning:  100 * time.Millisecond,
			ResponseTimeCritical: 500 * time.Millisecond,
			ErrorRateWarning:     5.0,  // 5%
			ErrorRateCritical:    10.0, // 10%
			MemoryWarning:        80.0, // 80%
			MemoryCritical:       90.0, // 90%
			CPUWarning:           70.0, // 70%
			CPUCritical:          85.0, // 85%
		},
		performanceStats: &PerformanceStats{},
		lastMetricsReset: time.Now(),
	}
}

// RegisterChecker registers a health checker
func (hm *HealthMonitor) RegisterChecker(checker ComponentHealthChecker) {
	hm.mutex.Lock()
	defer hm.mutex.Unlock()

	hm.checkers[checker.Name()] = checker
	logrus.WithField("checker", checker.Name()).Info("Health checker registered")
}

// CheckHealth performs health checks on all registered components
func (hm *HealthMonitor) CheckHealth(ctx context.Context) *SystemHealthExtended {
	hm.mutex.Lock()
	defer hm.mutex.Unlock()

	// Update system metrics
	hm.updateSystemMetrics()

	// Check all components
	overallStatus := HealthStatusHealthy
	for name, checker := range hm.checkers {
		componentHealth := checker.Check(ctx)
		hm.systemHealth.Components[name] = componentHealth

		// Determine overall status
		if componentHealth.Status == HealthStatusUnhealthy {
			overallStatus = HealthStatusUnhealthy
		} else if componentHealth.Status == HealthStatusDegraded && overallStatus == HealthStatusHealthy {
			overallStatus = HealthStatusDegraded
		}
	}
	
	// Update overall health
	hm.systemHealth.Status = overallStatus
	hm.systemHealth.Timestamp = time.Now()
	hm.systemHealth.Uptime = time.Since(hm.startTime)
	hm.systemHealth.PerformanceStats = hm.performanceStats
	
	// Check for alerts
	hm.checkAlerts()
	hm.systemHealth.Alerts = hm.getActiveAlerts()
	
	return hm.systemHealth
}

// updateSystemMetrics updates system-level metrics
func (hm *HealthMonitor) updateSystemMetrics() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	hm.systemHealth.SystemMetrics = &SystemMetrics{
		MemoryUsage:    int64(m.Alloc),
		MemoryTotal:    int64(m.Sys),
		MemoryPercent:  float64(m.Alloc) / float64(m.Sys) * 100,
		CPUUsage:       0.0, // CPU usage would need additional monitoring
		GoroutineCount: runtime.NumGoroutine(),
		GCStats: &GCStats{
			NumGC:      m.NumGC,
			PauseTotal: time.Duration(m.PauseTotalNs),
			LastGC:     time.Unix(0, int64(m.LastGC)),
			NextGC:     m.NextGC,
		},
	}
}

// RecordRequest records a request for performance metrics
func (hm *HealthMonitor) RecordRequest(duration time.Duration, isError bool) {
	hm.mutex.Lock()
	defer hm.mutex.Unlock()
	
	hm.requestCount++
	if isError {
		hm.errorCount++
	}
	
	hm.responseTimes = append(hm.responseTimes, duration)
	
	// Keep only last 1000 response times for performance
	if len(hm.responseTimes) > 1000 {
		hm.responseTimes = hm.responseTimes[len(hm.responseTimes)-1000:]
	}
	
	// Update performance stats every minute
	if time.Since(hm.lastMetricsReset) > time.Minute {
		hm.updatePerformanceStats()
	}
}

// updatePerformanceStats calculates current performance statistics
func (hm *HealthMonitor) updatePerformanceStats() {
	if len(hm.responseTimes) == 0 {
		return
	}
	
	// Calculate RPS
	duration := time.Since(hm.lastMetricsReset)
	rps := float64(hm.requestCount) / duration.Seconds()
	
	// Calculate average response time
	var totalTime time.Duration
	for _, rt := range hm.responseTimes {
		totalTime += rt
	}
	avgResponseTime := totalTime / time.Duration(len(hm.responseTimes))
	
	// Calculate percentiles (simplified)
	sortedTimes := make([]time.Duration, len(hm.responseTimes))
	copy(sortedTimes, hm.responseTimes)
	
	// Simple sort for percentiles
	for i := 0; i < len(sortedTimes); i++ {
		for j := i + 1; j < len(sortedTimes); j++ {
			if sortedTimes[i] > sortedTimes[j] {
				sortedTimes[i], sortedTimes[j] = sortedTimes[j], sortedTimes[i]
			}
		}
	}
	
	p95Index := int(float64(len(sortedTimes)) * 0.95)
	p99Index := int(float64(len(sortedTimes)) * 0.99)
	
	// Calculate error rate
	errorRate := float64(hm.errorCount) / float64(hm.requestCount) * 100
	
	hm.performanceStats = &PerformanceStats{
		RequestsPerSecond:   rps,
		AverageResponseTime: avgResponseTime,
		P95ResponseTime:     sortedTimes[p95Index],
		P99ResponseTime:     sortedTimes[p99Index],
		ErrorRate:           errorRate,
	}
	
	// Reset counters
	hm.requestCount = 0
	hm.errorCount = 0
	hm.responseTimes = hm.responseTimes[:0]
	hm.lastMetricsReset = time.Now()
}

// checkAlerts checks for alert conditions
func (hm *HealthMonitor) checkAlerts() {
	now := time.Now()
	
	// Check response time alerts
	if hm.performanceStats.AverageResponseTime > hm.alertThresholds.ResponseTimeCritical {
		hm.addAlert("response-time-critical", "critical", "performance", 
			fmt.Sprintf("Average response time is %v (threshold: %v)", 
				hm.performanceStats.AverageResponseTime, hm.alertThresholds.ResponseTimeCritical), now)
	} else if hm.performanceStats.AverageResponseTime > hm.alertThresholds.ResponseTimeWarning {
		hm.addAlert("response-time-warning", "warning", "performance", 
			fmt.Sprintf("Average response time is %v (threshold: %v)", 
				hm.performanceStats.AverageResponseTime, hm.alertThresholds.ResponseTimeWarning), now)
	}
	
	// Check error rate alerts
	if hm.performanceStats.ErrorRate > hm.alertThresholds.ErrorRateCritical {
		hm.addAlert("error-rate-critical", "critical", "performance", 
			fmt.Sprintf("Error rate is %.2f%% (threshold: %.2f%%)", 
				hm.performanceStats.ErrorRate, hm.alertThresholds.ErrorRateCritical), now)
	} else if hm.performanceStats.ErrorRate > hm.alertThresholds.ErrorRateWarning {
		hm.addAlert("error-rate-warning", "warning", "performance", 
			fmt.Sprintf("Error rate is %.2f%% (threshold: %.2f%%)", 
				hm.performanceStats.ErrorRate, hm.alertThresholds.ErrorRateWarning), now)
	}
	
	// Check memory alerts
	if hm.systemHealth.SystemMetrics != nil {
		memoryUsagePercent := hm.systemHealth.SystemMetrics.MemoryPercent

		if memoryUsagePercent > hm.alertThresholds.MemoryCritical {
			hm.addAlert("memory-critical", "critical", "system",
				fmt.Sprintf("Memory usage is %.2f%% (threshold: %.2f%%)",
					memoryUsagePercent, hm.alertThresholds.MemoryCritical), now)
		} else if memoryUsagePercent > hm.alertThresholds.MemoryWarning {
			hm.addAlert("memory-warning", "warning", "system",
				fmt.Sprintf("Memory usage is %.2f%% (threshold: %.2f%%)",
					memoryUsagePercent, hm.alertThresholds.MemoryWarning), now)
		}
	}
}

// addAlert adds a new alert or updates existing one
func (hm *HealthMonitor) addAlert(id, level, component, message string, timestamp time.Time) {
	// Check if alert already exists
	for i, alert := range hm.alerts {
		if alert.ID == id && !alert.Resolved {
			// Update existing alert
			hm.alerts[i].Message = message
			hm.alerts[i].Timestamp = timestamp
			return
		}
	}
	
	// Add new alert
	hm.alerts = append(hm.alerts, Alert{
		ID:        id,
		Level:     level,
		Component: component,
		Message:   message,
		Timestamp: timestamp,
		Resolved:  false,
	})
}

// getActiveAlerts returns all active (unresolved) alerts
func (hm *HealthMonitor) getActiveAlerts() []Alert {
	var activeAlerts []Alert
	for _, alert := range hm.alerts {
		if !alert.Resolved {
			activeAlerts = append(activeAlerts, alert)
		}
	}
	return activeAlerts
}

// GetHealthHandler returns a Gin handler for health checks
func (hm *HealthMonitor) GetHealthHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()
		
		health := hm.CheckHealth(ctx)
		
		// Set appropriate HTTP status code
		statusCode := http.StatusOK
		switch health.Status {
		case HealthStatusDegraded:
			statusCode = http.StatusPartialContent
		case HealthStatusUnhealthy:
			statusCode = http.StatusServiceUnavailable
		}
		
		c.JSON(statusCode, health)
	}
}

// GetLivenessHandler returns a simple liveness probe handler
func (hm *HealthMonitor) GetLivenessHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "alive",
			"timestamp": time.Now(),
			"uptime": time.Since(hm.startTime).Seconds(),
		})
	}
}

// GetReadinessHandler returns a readiness probe handler
func (hm *HealthMonitor) GetReadinessHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()
		
		health := hm.CheckHealth(ctx)
		
		if health.Status == HealthStatusUnhealthy {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "not ready",
				"reason": "system unhealthy",
			})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"status": "ready",
			"timestamp": time.Now(),
		})
	}
}

// DatabaseHealthChecker implements health checking for database connections
type DatabaseHealthChecker struct {
	db   *sql.DB
	name string
}

// NewDatabaseHealthChecker creates a new database health checker
func NewDatabaseHealthChecker(db *sql.DB, name string) *DatabaseHealthChecker {
	return &DatabaseHealthChecker{
		db:   db,
		name: name,
	}
}

// Name returns the checker name
func (dhc *DatabaseHealthChecker) Name() string {
	return dhc.name
}

// Check performs the database health check
func (dhc *DatabaseHealthChecker) Check(ctx context.Context) *ComponentHealth {
	start := time.Now()
	
	health := &ComponentHealth{
		Name:        dhc.name,
		Status:      HealthStatusHealthy,
		LastChecked: start,
		Details:     make(map[string]interface{}),
	}

	// Test database connection
	if err := dhc.db.PingContext(ctx); err != nil {
		health.Status = HealthStatusUnhealthy
		health.Error = err.Error()
		health.ResponseTime = time.Since(start)
		return health
	}

	// Get database stats
	stats := dhc.db.Stats()
	health.Details["openConnections"] = stats.OpenConnections
	health.Details["inUse"] = stats.InUse
	health.Details["idle"] = stats.Idle
	health.Details["maxOpenConnections"] = stats.MaxOpenConnections

	// Check if we're running low on connections
	if stats.OpenConnections > int(float64(stats.MaxOpenConnections)*0.8) {
		health.Status = HealthStatusDegraded
		health.Details["warning"] = "High connection usage"
	}
	
	health.ResponseTime = time.Since(start)
	return health
}

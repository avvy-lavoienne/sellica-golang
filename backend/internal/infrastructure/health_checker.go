package infrastructure

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// NewHealthChecker creates a new health checker
func NewHealthChecker(config *HealthCheckerConfig) *HealthChecker {
	return &HealthChecker{
		config:        config,
		healthChecks:  make(map[string]*HealthCheck),
		healthResults: make(map[string]*HealthCheckResult),
		isRunning:     false,
	}
}

// HealthChecker performs comprehensive health checking
type HealthChecker struct {
	config        *HealthCheckerConfig
	healthChecks  map[string]*HealthCheck
	healthResults map[string]*HealthCheckResult
	isRunning     bool
	mu            sync.RWMutex
}

// HealthCheck defines a health check
type HealthCheck struct {
	Name        string
	Description string
	CheckFunc   HealthCheckFunc
	Interval    time.Duration
	Timeout     time.Duration
	Enabled     bool
	Critical    bool
	Tags        []string
	LastRun     time.Time
	NextRun     time.Time
}

// HealthCheckFunc is a function that performs a health check
type HealthCheckFunc func(ctx context.Context) *HealthCheckResult

// HealthCheckResult represents the result of a health check
type HealthCheckResult struct {
	Name        string
	Status      HealthStatus
	Message     string
	Details     map[string]interface{}
	Duration    time.Duration
	Timestamp   time.Time
	Error       error
	Critical    bool
}

// SystemHealthStatus represents overall system health
type SystemHealthStatus struct {
	OverallStatus    HealthStatus
	HealthyChecks    int
	UnhealthyChecks  int
	TotalChecks      int
	LastUpdate       time.Time
	CheckResults     map[string]*HealthCheckResult
	SystemUptime     time.Duration
	SystemStartTime  time.Time
}

// Start starts the health checker
func (hc *HealthChecker) Start(ctx context.Context) error {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	
	if hc.isRunning {
		return fmt.Errorf("health checker is already running")
	}
	
	logrus.Info("🏥 Starting health checker...")
	
	// Register default health checks
	hc.registerDefaultHealthChecks()
	
	// Start health checking routine
	go hc.startHealthCheckingRoutine(ctx)
	
	hc.isRunning = true
	
	logrus.Infof("✅ Health checker started with %d health checks", len(hc.healthChecks))
	return nil
}

// registerDefaultHealthChecks registers default health checks
func (hc *HealthChecker) registerDefaultHealthChecks() {
	// System health check
	hc.RegisterHealthCheck(&HealthCheck{
		Name:        "system",
		Description: "System health and resource availability",
		CheckFunc:   hc.checkSystemHealth,
		Interval:    30 * time.Second,
		Timeout:     5 * time.Second,
		Enabled:     true,
		Critical:    true,
		Tags:        []string{"system", "critical"},
	})
	
	// Memory health check
	hc.RegisterHealthCheck(&HealthCheck{
		Name:        "memory",
		Description: "Memory usage and availability",
		CheckFunc:   hc.checkMemoryHealth,
		Interval:    15 * time.Second,
		Timeout:     2 * time.Second,
		Enabled:     true,
		Critical:    false,
		Tags:        []string{"system", "memory"},
	})
	
	// Disk health check
	hc.RegisterHealthCheck(&HealthCheck{
		Name:        "disk",
		Description: "Disk space and I/O health",
		CheckFunc:   hc.checkDiskHealth,
		Interval:    60 * time.Second,
		Timeout:     5 * time.Second,
		Enabled:     true,
		Critical:    false,
		Tags:        []string{"system", "storage"},
	})
	
	// Network health check
	hc.RegisterHealthCheck(&HealthCheck{
		Name:        "network",
		Description: "Network connectivity and latency",
		CheckFunc:   hc.checkNetworkHealth,
		Interval:    20 * time.Second,
		Timeout:     10 * time.Second,
		Enabled:     true,
		Critical:    false,
		Tags:        []string{"network", "connectivity"},
	})
}

// RegisterHealthCheck registers a new health check
func (hc *HealthChecker) RegisterHealthCheck(check *HealthCheck) error {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	
	if check.Name == "" {
		return fmt.Errorf("health check name is required")
	}
	
	if check.CheckFunc == nil {
		return fmt.Errorf("health check function is required")
	}
	
	// Set default values
	if check.Interval == 0 {
		check.Interval = hc.config.CheckInterval
	}
	if check.Timeout == 0 {
		check.Timeout = hc.config.Timeout
	}
	
	check.NextRun = time.Now().Add(check.Interval)
	
	hc.healthChecks[check.Name] = check
	
	logrus.Infof("📋 Registered health check: %s", check.Name)
	return nil
}

// UnregisterHealthCheck unregisters a health check
func (hc *HealthChecker) UnregisterHealthCheck(name string) error {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	
	if _, exists := hc.healthChecks[name]; !exists {
		return fmt.Errorf("health check %s not found", name)
	}
	
	delete(hc.healthChecks, name)
	delete(hc.healthResults, name)
	
	logrus.Infof("📋 Unregistered health check: %s", name)
	return nil
}

// startHealthCheckingRoutine starts the health checking routine
func (hc *HealthChecker) startHealthCheckingRoutine(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Second) // Check every second for due health checks
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			hc.runDueHealthChecks(ctx)
		case <-ctx.Done():
			logrus.Info("🏥 Health checker routine stopped")
			return
		}
	}
}

// runDueHealthChecks runs health checks that are due
func (hc *HealthChecker) runDueHealthChecks(ctx context.Context) {
	hc.mu.RLock()
	var dueChecks []*HealthCheck
	now := time.Now()
	
	for _, check := range hc.healthChecks {
		if check.Enabled && now.After(check.NextRun) {
			dueChecks = append(dueChecks, check)
		}
	}
	hc.mu.RUnlock()
	
	// Run due checks concurrently
	var wg sync.WaitGroup
	for _, check := range dueChecks {
		wg.Add(1)
		go func(c *HealthCheck) {
			defer wg.Done()
			hc.runHealthCheck(ctx, c)
		}(check)
	}
	wg.Wait()
}

// runHealthCheck runs a single health check
func (hc *HealthChecker) runHealthCheck(ctx context.Context, check *HealthCheck) {
	startTime := time.Now()
	
	// Create timeout context
	checkCtx, cancel := context.WithTimeout(ctx, check.Timeout)
	defer cancel()
	
	// Run the health check
	result := check.CheckFunc(checkCtx)
	result.Duration = time.Since(startTime)
	result.Timestamp = time.Now()
	result.Name = check.Name
	result.Critical = check.Critical
	
	// Update check timing
	hc.mu.Lock()
	check.LastRun = time.Now()
	check.NextRun = time.Now().Add(check.Interval)
	hc.healthResults[check.Name] = result
	hc.mu.Unlock()
	
	// Log result
	if result.Status == HealthStatusHealthy {
		logrus.Debugf("✅ Health check %s: %s (took %v)", check.Name, result.Message, result.Duration)
	} else {
		logrus.Warnf("⚠️ Health check %s: %s (took %v)", check.Name, result.Message, result.Duration)
	}
}

// Default health check implementations

// checkSystemHealth checks overall system health
func (hc *HealthChecker) checkSystemHealth(ctx context.Context) *HealthCheckResult {
	result := &HealthCheckResult{
		Status:  HealthStatusHealthy,
		Message: "System is healthy",
		Details: make(map[string]interface{}),
	}
	
	// Simulate system health check
	select {
	case <-time.After(10 * time.Millisecond): // Simulate check time
		// Check system load, processes, etc.
		result.Details["uptime"] = time.Since(time.Now().Add(-24 * time.Hour)).String()
		result.Details["load_average"] = 0.5
		result.Details["processes"] = 150
		
		return result
	case <-ctx.Done():
		result.Status = HealthStatusUnhealthy
		result.Message = "System health check timeout"
		result.Error = ctx.Err()
		return result
	}
}

// checkMemoryHealth checks memory health
func (hc *HealthChecker) checkMemoryHealth(ctx context.Context) *HealthCheckResult {
	result := &HealthCheckResult{
		Status:  HealthStatusHealthy,
		Message: "Memory usage is normal",
		Details: make(map[string]interface{}),
	}
	
	// Simulate memory health check
	select {
	case <-time.After(5 * time.Millisecond): // Simulate check time
		memoryUsagePercent := 65.0 // Simulate 65% memory usage
		
		result.Details["memory_usage_percent"] = memoryUsagePercent
		result.Details["total_memory"] = "8GB"
		result.Details["available_memory"] = "2.8GB"
		
		if memoryUsagePercent > 90 {
			result.Status = HealthStatusUnhealthy
			result.Message = fmt.Sprintf("High memory usage: %.1f%%", memoryUsagePercent)
		} else if memoryUsagePercent > 80 {
			result.Status = HealthStatusHealthy
			result.Message = fmt.Sprintf("Memory usage is elevated: %.1f%%", memoryUsagePercent)
		}
		
		return result
	case <-ctx.Done():
		result.Status = HealthStatusUnhealthy
		result.Message = "Memory health check timeout"
		result.Error = ctx.Err()
		return result
	}
}

// checkDiskHealth checks disk health
func (hc *HealthChecker) checkDiskHealth(ctx context.Context) *HealthCheckResult {
	result := &HealthCheckResult{
		Status:  HealthStatusHealthy,
		Message: "Disk usage is normal",
		Details: make(map[string]interface{}),
	}
	
	// Simulate disk health check
	select {
	case <-time.After(15 * time.Millisecond): // Simulate check time
		diskUsagePercent := 45.0 // Simulate 45% disk usage
		
		result.Details["disk_usage_percent"] = diskUsagePercent
		result.Details["total_space"] = "100GB"
		result.Details["available_space"] = "55GB"
		result.Details["inode_usage"] = "25%"
		
		if diskUsagePercent > 95 {
			result.Status = HealthStatusUnhealthy
			result.Message = fmt.Sprintf("Critical disk usage: %.1f%%", diskUsagePercent)
		} else if diskUsagePercent > 85 {
			result.Status = HealthStatusHealthy
			result.Message = fmt.Sprintf("High disk usage: %.1f%%", diskUsagePercent)
		}
		
		return result
	case <-ctx.Done():
		result.Status = HealthStatusUnhealthy
		result.Message = "Disk health check timeout"
		result.Error = ctx.Err()
		return result
	}
}

// checkNetworkHealth checks network health
func (hc *HealthChecker) checkNetworkHealth(ctx context.Context) *HealthCheckResult {
	result := &HealthCheckResult{
		Status:  HealthStatusHealthy,
		Message: "Network connectivity is good",
		Details: make(map[string]interface{}),
	}
	
	// Simulate network health check
	select {
	case <-time.After(20 * time.Millisecond): // Simulate network check time
		latency := 15 * time.Millisecond // Simulate 15ms latency
		
		result.Details["latency"] = latency.String()
		result.Details["packet_loss"] = "0%"
		result.Details["bandwidth"] = "1Gbps"
		result.Details["connections"] = 25
		
		if latency > 100*time.Millisecond {
			result.Status = HealthStatusUnhealthy
			result.Message = fmt.Sprintf("High network latency: %v", latency)
		} else if latency > 50*time.Millisecond {
			result.Status = HealthStatusHealthy
			result.Message = fmt.Sprintf("Elevated network latency: %v", latency)
		}
		
		return result
	case <-ctx.Done():
		result.Status = HealthStatusUnhealthy
		result.Message = "Network health check timeout"
		result.Error = ctx.Err()
		return result
	}
}

// GetSystemHealth returns the overall system health status
func (hc *HealthChecker) GetSystemHealth() *SystemHealthStatus {
	hc.mu.RLock()
	defer hc.mu.RUnlock()
	
	systemHealth := &SystemHealthStatus{
		CheckResults:    make(map[string]*HealthCheckResult),
		LastUpdate:      time.Now(),
		SystemStartTime: time.Now().Add(-24 * time.Hour), // Simulate 24h uptime
		TotalChecks:     len(hc.healthResults),
	}
	
	systemHealth.SystemUptime = time.Since(systemHealth.SystemStartTime)
	
	healthyCount := 0
	unhealthyCount := 0
	criticalUnhealthy := false
	
	// Copy results and count statuses
	for name, result := range hc.healthResults {
		systemHealth.CheckResults[name] = result
		
		if result.Status == HealthStatusHealthy {
			healthyCount++
		} else {
			unhealthyCount++
			if result.Critical {
				criticalUnhealthy = true
			}
		}
	}
	
	systemHealth.HealthyChecks = healthyCount
	systemHealth.UnhealthyChecks = unhealthyCount
	
	// Determine overall status
	if criticalUnhealthy {
		systemHealth.OverallStatus = HealthStatusUnhealthy
	} else if unhealthyCount == 0 {
		systemHealth.OverallStatus = HealthStatusHealthy
	} else if float64(healthyCount)/float64(systemHealth.TotalChecks) >= 0.8 {
		systemHealth.OverallStatus = HealthStatusHealthy // 80% healthy is considered healthy
	} else {
		systemHealth.OverallStatus = HealthStatusUnhealthy
	}
	
	return systemHealth
}

// GetHealthCheckResult returns the result of a specific health check
func (hc *HealthChecker) GetHealthCheckResult(name string) (*HealthCheckResult, error) {
	hc.mu.RLock()
	defer hc.mu.RUnlock()
	
	result, exists := hc.healthResults[name]
	if !exists {
		return nil, fmt.Errorf("health check result for %s not found", name)
	}
	
	return result, nil
}

// GetAllHealthCheckResults returns all health check results
func (hc *HealthChecker) GetAllHealthCheckResults() map[string]*HealthCheckResult {
	hc.mu.RLock()
	defer hc.mu.RUnlock()
	
	// Return a copy of all results
	results := make(map[string]*HealthCheckResult)
	for name, result := range hc.healthResults {
		results[name] = result
	}
	
	return results
}

// IsHealthy returns true if the system is healthy
func (hc *HealthChecker) IsHealthy() bool {
	systemHealth := hc.GetSystemHealth()
	return systemHealth.OverallStatus == HealthStatusHealthy
}

// GetHealthSummary returns a summary of health status
func (hc *HealthChecker) GetHealthSummary() map[string]interface{} {
	systemHealth := hc.GetSystemHealth()
	
	return map[string]interface{}{
		"overall_status":    systemHealth.OverallStatus,
		"healthy_checks":    systemHealth.HealthyChecks,
		"unhealthy_checks":  systemHealth.UnhealthyChecks,
		"total_checks":      systemHealth.TotalChecks,
		"uptime":           systemHealth.SystemUptime.String(),
		"last_update":      systemHealth.LastUpdate,
		"health_percentage": float64(systemHealth.HealthyChecks) / float64(systemHealth.TotalChecks) * 100,
	}
}

// Shutdown gracefully shuts down the health checker
func (hc *HealthChecker) Shutdown(ctx context.Context) error {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	
	if !hc.isRunning {
		return nil
	}
	
	logrus.Info("🛑 Shutting down health checker...")
	
	hc.isRunning = false
	
	logrus.Info("✅ Health checker shut down successfully")
	return nil
}

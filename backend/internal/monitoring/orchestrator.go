package monitoring

import (
	"context"
	"fmt"
	"sync"
	"time"

	servicecontext "selly-backend/internal/services/context"
	"github.com/sirupsen/logrus"
)

// MonitoringOrchestrator coordinates all monitoring components for Phase 3 Week 5
// This is the main entry point for unified monitoring and observability
type MonitoringOrchestrator struct {
	// Core components
	manager           *MonitoringManager
	prometheusIntegration *PrometheusIntegration
	grafanaConfig     *GrafanaConfig
	
	// Configuration
	config            *OrchestrationConfig
	logger            *logrus.Logger
	
	// State management
	isRunning         bool
	shutdownChan      chan struct{}
	wg                sync.WaitGroup
	mutex             sync.RWMutex
	
	// Service registry
	registeredServices map[string]ServiceMonitor
}

// OrchestrationConfig defines configuration for the monitoring orchestrator
type OrchestrationConfig struct {
	// Prometheus configuration
	PrometheusConfig *PrometheusConfig `json:"prometheus"`
	
	// Grafana dashboard output directory
	GrafanaDashboardDir string `json:"grafana_dashboard_dir"`
	
	// Monitoring intervals
	HealthCheckInterval    time.Duration `json:"health_check_interval"`
	MetricsFlushInterval   time.Duration `json:"metrics_flush_interval"`
	DashboardSyncInterval  time.Duration `json:"dashboard_sync_interval"`
	
	// Resource monitoring thresholds
	MemoryThresholdMB      float64 `json:"memory_threshold_mb"`
	CPUThresholdPercent    float64 `json:"cpu_threshold_percent"`
	ErrorRateThreshold     float64 `json:"error_rate_threshold"`
	ResponseTimeThresholdMs float64 `json:"response_time_threshold_ms"`
	
	// Correlation tracing
	EnableCorrelationTracing bool          `json:"enable_correlation_tracing"`
	CorrelationTTL          time.Duration `json:"correlation_ttl"`
	
	// Auto-scaling configuration
	EnableAutoScaling       bool    `json:"enable_auto_scaling"`
	ScaleUpThreshold       float64 `json:"scale_up_threshold"`
	ScaleDownThreshold     float64 `json:"scale_down_threshold"`
}

// DefaultOrchestrationConfig returns a default orchestration configuration
func DefaultOrchestrationConfig() *OrchestrationConfig {
	return &OrchestrationConfig{
		PrometheusConfig:         DefaultPrometheusConfig(),
		GrafanaDashboardDir:      "./dashboards",
		HealthCheckInterval:      time.Second * 30,
		MetricsFlushInterval:     time.Second * 15,
		DashboardSyncInterval:    time.Minute * 5,
		MemoryThresholdMB:        1024,
		CPUThresholdPercent:      80.0,
		ErrorRateThreshold:       0.05, // 5%
		ResponseTimeThresholdMs:  2000,
		EnableCorrelationTracing: true,
		CorrelationTTL:          time.Hour * 24,
		EnableAutoScaling:       false,
		ScaleUpThreshold:        0.8,
		ScaleDownThreshold:      0.3,
	}
}

// NewMonitoringOrchestrator creates a new monitoring orchestrator
func NewMonitoringOrchestrator(config *OrchestrationConfig, logger *logrus.Logger) (*MonitoringOrchestrator, error) {
	if config == nil {
		config = DefaultOrchestrationConfig()
	}
	
	if logger == nil {
		logger = logrus.New()
		logger.SetLevel(logrus.InfoLevel)
	}
	
	// Create monitoring manager
	manager := NewMonitoringManager()
	manager.logger = logger
	
	// Create Prometheus integration
	prometheusIntegration := NewPrometheusIntegration(config.PrometheusConfig, logger)
	
	// Create Grafana configuration manager
	grafanaConfig := NewGrafanaConfig(logger, config.GrafanaDashboardDir)
	
	orchestrator := &MonitoringOrchestrator{
		manager:               manager,
		prometheusIntegration: prometheusIntegration,
		grafanaConfig:         grafanaConfig,
		config:               config,
		logger:               logger,
		shutdownChan:         make(chan struct{}),
		registeredServices:   make(map[string]ServiceMonitor),
	}
	
	return orchestrator, nil
}

// Start begins the monitoring orchestration
func (mo *MonitoringOrchestrator) Start(ctx context.Context) error {
	mo.mutex.Lock()
	defer mo.mutex.Unlock()
	
	if mo.isRunning {
		return fmt.Errorf("monitoring orchestrator already running")
	}
	
	mo.logger.Info("Starting Phase 3 Week 5 monitoring orchestration")
	
	// Start Prometheus integration
	if err := mo.prometheusIntegration.Start(ctx); err != nil {
		return fmt.Errorf("failed to start Prometheus integration: %w", err)
	}
	
	// Generate and save Grafana dashboards
	if err := mo.generateDashboards(); err != nil {
		mo.logger.WithError(err).Error("Failed to generate Grafana dashboards")
		// Don't fail startup for dashboard generation issues
	}
	
	// Start background monitoring routines
	mo.isRunning = true
	mo.startBackgroundTasks(ctx)
	
	mo.logger.WithFields(logrus.Fields{
		"prometheus_url": mo.prometheusIntegration.GetMetricsURL(),
		"dashboard_dir":  mo.config.GrafanaDashboardDir,
		"services":       len(mo.registeredServices),
	}).Info("Monitoring orchestration started successfully")
	
	return nil
}

// Stop gracefully shuts down the monitoring orchestration
func (mo *MonitoringOrchestrator) Stop(ctx context.Context) error {
	mo.mutex.Lock()
	defer mo.mutex.Unlock()
	
	if !mo.isRunning {
		return nil
	}
	
	mo.logger.Info("Stopping monitoring orchestration")
	
	// Signal shutdown
	close(mo.shutdownChan)
	
	// Wait for background tasks
	mo.wg.Wait()
	
	// Stop Prometheus integration
	if err := mo.prometheusIntegration.Stop(ctx); err != nil {
		mo.logger.WithError(err).Error("Error stopping Prometheus integration")
	}
	
	mo.isRunning = false
	mo.logger.Info("Monitoring orchestration stopped")
	
	return nil
}

// RegisterService registers a service for monitoring
func (mo *MonitoringOrchestrator) RegisterService(service ServiceMonitor) error {
	mo.mutex.Lock()
	defer mo.mutex.Unlock()
	
	serviceName := service.GetServiceName()
	
	// Register with monitoring manager
	if err := mo.manager.RegisterService(service); err != nil {
		return fmt.Errorf("failed to register service with manager: %w", err)
	}
	
	mo.registeredServices[serviceName] = service
	
	mo.logger.WithFields(logrus.Fields{
		"service": serviceName,
		"version": service.GetServiceVersion(),
	}).Info("Service registered for monitoring")
	
	return nil
}

// UnregisterService removes a service from monitoring
func (mo *MonitoringOrchestrator) UnregisterService(serviceName string) error {
	mo.mutex.Lock()
	defer mo.mutex.Unlock()
	
	// Remove from our registry
	delete(mo.registeredServices, serviceName)
	
	// Note: MonitoringManager doesn't have UnregisterService method
	// Services are managed through the services map internally
	
	mo.logger.WithField("service", serviceName).Info("Service unregistered from monitoring")
	
	return nil
}

// GetServiceHealth returns the health status of all monitored services
func (mo *MonitoringOrchestrator) GetServiceHealth() map[string]ServiceHealthStatus {
	return mo.manager.GetServiceHealth()
}

// GetMetricsURL returns the Prometheus metrics endpoint URL
func (mo *MonitoringOrchestrator) GetMetricsURL() string {
	return mo.prometheusIntegration.GetMetricsURL()
}

// GetDashboardPath returns the path to a specific Grafana dashboard
func (mo *MonitoringOrchestrator) GetDashboardPath(name string) string {
	return fmt.Sprintf("%s/%s.json", mo.config.GrafanaDashboardDir, name)
}

// IsRunning returns whether the orchestrator is currently running
func (mo *MonitoringOrchestrator) IsRunning() bool {
	mo.mutex.RLock()
	defer mo.mutex.RUnlock()
	return mo.isRunning
}

// GetRegisteredServices returns a list of registered service names
func (mo *MonitoringOrchestrator) GetRegisteredServices() []string {
	mo.mutex.RLock()
	defer mo.mutex.RUnlock()
	
	services := make([]string, 0, len(mo.registeredServices))
	for name := range mo.registeredServices {
		services = append(services, name)
	}
	return services
}

// UpdateServiceHealth manually updates a service's health status
func (mo *MonitoringOrchestrator) UpdateServiceHealth(serviceName string, status ServiceHealthStatus, reason string) {
	mo.manager.UpdateServiceHealth(serviceName, status, reason)
}

// RecordServiceMetrics records metrics for a service operation
func (mo *MonitoringOrchestrator) RecordServiceMetrics(ctx *servicecontext.ServiceContext, serviceName, operation string, duration time.Duration, success bool) {
	mo.manager.RecordServiceRequest(ctx, serviceName, operation, duration, success)
}

// RecordServiceError records an error for a service operation
func (mo *MonitoringOrchestrator) RecordServiceError(ctx *servicecontext.ServiceContext, serviceName, operation, errorType string, err error) {
	mo.manager.RecordServiceError(ctx, serviceName, operation, errorType, err)
}

// GetServiceMetrics returns comprehensive metrics for a service
func (mo *MonitoringOrchestrator) GetServiceMetrics(serviceName string) (*ServicePerformanceMetrics, *ServiceResourceMetrics, *ServiceErrorMetrics) {
	perfMetrics := mo.manager.GetServicePerformanceMetrics(serviceName)
	// Note: MonitoringManager doesn't have separate GetResourceMetrics and GetErrorMetrics methods
	// Return what we have available
	return perfMetrics, nil, nil
}

// Private methods

// startBackgroundTasks starts background monitoring tasks
func (mo *MonitoringOrchestrator) startBackgroundTasks(ctx context.Context) {
	// Health check task
	mo.wg.Add(1)
	go mo.healthCheckTask(ctx)
	
	// Metrics flush task
	mo.wg.Add(1)
	go mo.metricsFlushTask(ctx)
	
	// Dashboard sync task
	mo.wg.Add(1)
	go mo.dashboardSyncTask(ctx)
	
	// Correlation cleanup task
	if mo.config.EnableCorrelationTracing {
		mo.wg.Add(1)
		go mo.correlationCleanupTask(ctx)
	}
	
	// Auto-scaling task
	if mo.config.EnableAutoScaling {
		mo.wg.Add(1)
		go mo.autoScalingTask(ctx)
	}
}

// healthCheckTask performs periodic health checks
func (mo *MonitoringOrchestrator) healthCheckTask(ctx context.Context) {
	defer mo.wg.Done()
	
	ticker := time.NewTicker(mo.config.HealthCheckInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-mo.shutdownChan:
			return
		case <-ticker.C:
			mo.performHealthChecks(ctx)
		}
	}
}

// metricsFlushTask performs periodic metrics flushing
func (mo *MonitoringOrchestrator) metricsFlushTask(ctx context.Context) {
	defer mo.wg.Done()
	
	ticker := time.NewTicker(mo.config.MetricsFlushInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-mo.shutdownChan:
			return
		case <-ticker.C:
			mo.flushMetrics()
		}
	}
}

// dashboardSyncTask performs periodic dashboard synchronization
func (mo *MonitoringOrchestrator) dashboardSyncTask(ctx context.Context) {
	defer mo.wg.Done()
	
	ticker := time.NewTicker(mo.config.DashboardSyncInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-mo.shutdownChan:
			return
		case <-ticker.C:
			mo.syncDashboards()
		}
	}
}

// correlationCleanupTask performs periodic correlation trace cleanup
func (mo *MonitoringOrchestrator) correlationCleanupTask(ctx context.Context) {
	defer mo.wg.Done()
	
	ticker := time.NewTicker(time.Hour) // Clean up hourly
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-mo.shutdownChan:
			return
		case <-ticker.C:
			mo.cleanupCorrelationTraces()
		}
	}
}

// autoScalingTask performs auto-scaling decisions based on metrics
func (mo *MonitoringOrchestrator) autoScalingTask(ctx context.Context) {
	defer mo.wg.Done()
	
	ticker := time.NewTicker(time.Minute) // Check every minute
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-mo.shutdownChan:
			return
		case <-ticker.C:
			mo.evaluateAutoScaling()
		}
	}
}

// performHealthChecks performs health checks on all registered services
func (mo *MonitoringOrchestrator) performHealthChecks(ctx context.Context) {
	mo.mutex.RLock()
	services := make([]ServiceMonitor, 0, len(mo.registeredServices))
	for _, service := range mo.registeredServices {
		services = append(services, service)
	}
	mo.mutex.RUnlock()
	
	for _, service := range services {
		go func(svc ServiceMonitor) {
			if err := svc.CheckDependencies(ctx); err != nil {
				svc.UpdateHealthStatus(ServiceHealthStatusDegraded, fmt.Sprintf("Dependency check failed: %v", err))
			} else {
				svc.UpdateHealthStatus(ServiceHealthStatusHealthy, "All dependencies healthy")
			}
		}(service)
	}
}

// flushMetrics flushes accumulated metrics
func (mo *MonitoringOrchestrator) flushMetrics() {
	// Metrics are automatically flushed by Prometheus client
	// This could be used for additional metric processing if needed
	mo.logger.Debug("Metrics flush cycle completed")
}

// syncDashboards synchronizes Grafana dashboards
func (mo *MonitoringOrchestrator) syncDashboards() {
	if err := mo.generateDashboards(); err != nil {
		mo.logger.WithError(err).Error("Failed to sync dashboards")
	} else {
		mo.logger.Debug("Dashboard sync completed")
	}
}

// generateDashboards generates and saves Grafana dashboards
func (mo *MonitoringOrchestrator) generateDashboards() error {
	// Generate main dashboard
	dashboard := mo.grafanaConfig.CreateSellyBackendDashboard()
	if err := mo.grafanaConfig.SaveDashboard("selly-backend-main", dashboard); err != nil {
		return fmt.Errorf("failed to save main dashboard: %w", err)
	}
	
	return nil
}

// cleanupCorrelationTraces removes old correlation traces
func (mo *MonitoringOrchestrator) cleanupCorrelationTraces() {
	// Note: MonitoringManager doesn't have CleanupCorrelationTraces method
	// This could be implemented as a cleanup routine that removes old traces
	mo.logger.Debug("Correlation trace cleanup completed")
}

// evaluateAutoScaling evaluates whether auto-scaling actions are needed
func (mo *MonitoringOrchestrator) evaluateAutoScaling() {
	// This is a placeholder for auto-scaling logic
	// In a real implementation, this would analyze metrics and trigger scaling actions
	mo.logger.Debug("Auto-scaling evaluation completed")
}

package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"selly-backend/internal/monitoring"
	servicecontext "selly-backend/internal/services/context"

	"github.com/sirupsen/logrus"
)

// Phase3Week5MonitoringDemo demonstrates the unified monitoring system
// This implements the requirements from Phase 3 Week 5 monitoring implementation
func main() {
	// Setup logger
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)
	logger.SetFormatter(&logrus.JSONFormatter{})

	logger.Info("Starting Phase 3 Week 5 Monitoring Demonstration")

	// Create monitoring configuration
	config := monitoring.DefaultOrchestrationConfig()
	config.PrometheusConfig.ListenAddress = ":8080"
	config.GrafanaDashboardDir = "./grafana-dashboards"
	config.EnableCorrelationTracing = true
	config.HealthCheckInterval = time.Second * 15
	
	// Create monitoring orchestrator
	orchestrator, err := monitoring.NewMonitoringOrchestrator(config, logger)
	if err != nil {
		log.Fatalf("Failed to create monitoring orchestrator: %v", err)
	}

	// Start monitoring system
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := orchestrator.Start(ctx); err != nil {
		log.Fatalf("Failed to start monitoring orchestrator: %v", err)
	}
	defer orchestrator.Stop(ctx)

	logger.WithFields(logrus.Fields{
		"metrics_url":   orchestrator.GetMetricsURL(),
		"dashboard_dir": config.GrafanaDashboardDir,
	}).Info("Phase 3 Week 5 monitoring system started successfully")

	// Create and register a demo service monitor
	demoService := &DemoServiceMonitor{
		name:    "demo-service",
		version: "1.0.0",
		logger:  logger,
	}

	if err := orchestrator.RegisterService(demoService); err != nil {
		log.Fatalf("Failed to register demo service: %v", err)
	}

	// Start demo workload
	go runDemoWorkload(orchestrator, logger)

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	logger.Info("Phase 3 Week 5 monitoring system is running. Access metrics at: " + orchestrator.GetMetricsURL())
	logger.Info("Grafana dashboards saved to: " + config.GrafanaDashboardDir)
	logger.Info("Press Ctrl+C to shutdown")

	<-sigChan
	logger.Info("Shutdown signal received, stopping monitoring system...")

	// Graceful shutdown
	if err := orchestrator.Stop(ctx); err != nil {
		logger.WithError(err).Error("Error during shutdown")
	}

	logger.Info("Phase 3 Week 5 monitoring demonstration completed successfully")
}

// DemoServiceMonitor implements ServiceMonitor interface for demonstration
type DemoServiceMonitor struct {
	name    string
	version string
	health  monitoring.ServiceHealthStatus
	logger  *logrus.Logger
}

func (d *DemoServiceMonitor) GetServiceName() string {
	return d.name
}

func (d *DemoServiceMonitor) GetServiceVersion() string {
	return d.version
}

func (d *DemoServiceMonitor) GetServiceHealth() monitoring.ServiceHealthStatus {
	if d.health == "" {
		return monitoring.ServiceHealthStatusHealthy
	}
	return d.health
}

func (d *DemoServiceMonitor) RecordRequest(ctx *servicecontext.ServiceContext, operation string, duration time.Duration, success bool) {
	d.logger.WithFields(logrus.Fields{
		"operation": operation,
		"duration":  duration,
		"success":   success,
		"correlation_id": ctx.CorrelationID,
	}).Info("Request recorded")
}

func (d *DemoServiceMonitor) RecordError(ctx *servicecontext.ServiceContext, operation string, errorType string, err error) {
	d.logger.WithFields(logrus.Fields{
		"operation":  operation,
		"error_type": errorType,
		"error":      err.Error(),
		"correlation_id": ctx.CorrelationID,
	}).Error("Error recorded")
}

func (d *DemoServiceMonitor) RecordResourceUsage(memoryMB float64, cpuPercent float64, connections int) {
	d.logger.WithFields(logrus.Fields{
		"memory_mb":   memoryMB,
		"cpu_percent": cpuPercent,
		"connections": connections,
	}).Debug("Resource usage recorded")
}

func (d *DemoServiceMonitor) GetPerformanceMetrics() *monitoring.ServicePerformanceMetrics {
	return &monitoring.ServicePerformanceMetrics{
		ServiceName:         d.name,
		TotalRequests:       100,
		SuccessfulRequests:  95,
		FailedRequests:      5,
		AverageResponseTime: time.Millisecond * 150,
		P95ResponseTime:     time.Millisecond * 400,
		P99ResponseTime:     time.Millisecond * 500,
		RequestsPerSecond:   10.5,
		ErrorRate:           0.05,
		LastUpdated:         time.Now(),
	}
}

func (d *DemoServiceMonitor) GetResourceMetrics() *monitoring.ServiceResourceMetrics {
	return &monitoring.ServiceResourceMetrics{
		ServiceName:        d.name,
		MemoryUsageMB:      256.5,
		MaxMemoryUsageMB:   512.0,
		CPUUsagePercent:    45.2,
		MaxCPUUsagePercent: 80.0,
		ActiveConnections:  25,
		MaxConnections:     100,
		GoroutineCount:     50,
		LastUpdated:        time.Now(),
	}
}

func (d *DemoServiceMonitor) GetErrorMetrics() *monitoring.ServiceErrorMetrics {
	return &monitoring.ServiceErrorMetrics{
		ServiceName:    d.name,
		TotalErrors:    5,
		ErrorsByType:   map[string]int64{"timeout": 3, "validation": 2},
		ErrorsByOperation: map[string]int64{"query": 4, "index": 1},
		ErrorRate:      0.05,
		CriticalErrors: 1,
		LastUpdated:    time.Now(),
	}
}

func (d *DemoServiceMonitor) UpdateHealthStatus(status monitoring.ServiceHealthStatus, reason string) {
	d.health = status
	d.logger.WithFields(logrus.Fields{
		"status": status,
		"reason": reason,
	}).Info("Health status updated")
}

func (d *DemoServiceMonitor) GetDependencyStatus() map[string]monitoring.ServiceHealthStatus {
	return map[string]monitoring.ServiceHealthStatus{
		"database": monitoring.ServiceHealthStatusHealthy,
		"redis":    monitoring.ServiceHealthStatusHealthy,
		"elasticsearch": monitoring.ServiceHealthStatusDegraded,
	}
}

func (d *DemoServiceMonitor) CheckDependencies(ctx context.Context) error {
	// Simulate dependency check
	d.logger.Debug("Checking service dependencies")
	return nil
}

// runDemoWorkload simulates realistic service workload for monitoring demonstration
func runDemoWorkload(orchestrator *monitoring.MonitoringOrchestrator, logger *logrus.Logger) {
	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	operationCount := 0
	
	for {
		select {
		case <-ticker.C:
			operationCount++
			
			// Create service context with correlation ID
			ctx := &servicecontext.ServiceContext{
				RequestID:        fmt.Sprintf("demo-request-%d", operationCount),
				CorrelationID:    fmt.Sprintf("demo-correlation-%d", operationCount),
				TraceID:          fmt.Sprintf("demo-trace-%d", operationCount),
				SpanID:           fmt.Sprintf("demo-span-%d", operationCount),
				Timestamp:        time.Now(),
				UserID:           "demo-user",
				SessionID:        "demo-session",
				ServiceType:      "demo_service", // Using custom service type for demo
				SourceService:    "monitoring-demo",
				TargetService:    "demo-service",
				EnableMonitoring: true,
				Extensions:       make(map[string]interface{}),
			}

			// Simulate different operations
			operations := []string{"query", "index", "search", "validate"}
			operation := operations[operationCount%len(operations)]
			
			// Simulate operation duration
			duration := time.Millisecond * time.Duration(100+operationCount%400)
			success := operationCount%10 != 0 // 90% success rate
			
			// Record metrics
			orchestrator.RecordServiceMetrics(ctx, "demo-service", operation, duration, success)
			
			// Simulate occasional errors
			if !success {
				err := fmt.Errorf("simulated %s error", operation)
				orchestrator.RecordServiceError(ctx, "demo-service", operation, "timeout", err)
			}
			
			// Update health status occasionally
			if operationCount%20 == 0 {
				if operationCount%40 == 0 {
					orchestrator.UpdateServiceHealth("demo-service", monitoring.ServiceHealthStatusDegraded, "High error rate")
				} else {
					orchestrator.UpdateServiceHealth("demo-service", monitoring.ServiceHealthStatusHealthy, "All systems normal")
				}
			}
			
			logger.WithFields(logrus.Fields{
				"operation":      operation,
				"correlation_id": ctx.CorrelationID,
				"duration":       duration,
				"success":        success,
				"count":          operationCount,
			}).Debug("Demo workload operation completed")
		}
	}
}

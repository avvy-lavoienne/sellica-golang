package monitoring

import (
	"context"
	"fmt"
	servicecontext "selly-backend/internal/services/context"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/sirupsen/logrus"
)

// ServiceMonitor interface defines unified monitoring capabilities for all services
// This implements Phase 3 Week 5 monitoring and observability unification
type ServiceMonitor interface {
	// Service identification and registration
	GetServiceName() string
	GetServiceVersion() string
	GetServiceHealth() ServiceHealthStatus
	
	// Metrics collection
	RecordRequest(ctx *servicecontext.ServiceContext, operation string, duration time.Duration, success bool)
	RecordError(ctx *servicecontext.ServiceContext, operation string, errorType string, err error)
	RecordResourceUsage(memoryMB float64, cpuPercent float64, connections int)
	
	// Performance tracking
	GetPerformanceMetrics() *ServicePerformanceMetrics
	GetResourceMetrics() *ServiceResourceMetrics
	GetErrorMetrics() *ServiceErrorMetrics
	
	// Health and status
	UpdateHealthStatus(status ServiceHealthStatus, reason string)
	GetDependencyStatus() map[string]ServiceHealthStatus
	CheckDependencies(ctx context.Context) error
}

// ServiceHealthStatus represents service health states
type ServiceHealthStatus string

const (
	ServiceHealthStatusHealthy   ServiceHealthStatus = "healthy"
	ServiceHealthStatusDegraded  ServiceHealthStatus = "degraded"
	ServiceHealthStatusUnhealthy ServiceHealthStatus = "unhealthy"
	ServiceHealthStatusUnknown   ServiceHealthStatus = "unknown"
)

// ServicePerformanceMetrics tracks service performance indicators
type ServicePerformanceMetrics struct {
	ServiceName           string                    `json:"service_name"`
	TotalRequests         int64                     `json:"total_requests"`
	SuccessfulRequests    int64                     `json:"successful_requests"`
	FailedRequests        int64                     `json:"failed_requests"`
	AverageResponseTime   time.Duration             `json:"average_response_time"`
	P95ResponseTime       time.Duration             `json:"p95_response_time"`
	P99ResponseTime       time.Duration             `json:"p99_response_time"`
	RequestsPerSecond     float64                   `json:"requests_per_second"`
	ErrorRate             float64                   `json:"error_rate"`
	OperationMetrics      map[string]*OperationMetric `json:"operation_metrics"`
	LastUpdated           time.Time                 `json:"last_updated"`
}

// ServiceResourceMetrics tracks resource utilization
type ServiceResourceMetrics struct {
	ServiceName           string    `json:"service_name"`
	MemoryUsageMB         float64   `json:"memory_usage_mb"`
	MaxMemoryUsageMB      float64   `json:"max_memory_usage_mb"`
	CPUUsagePercent       float64   `json:"cpu_usage_percent"`
	MaxCPUUsagePercent    float64   `json:"max_cpu_usage_percent"`
	ActiveConnections     int       `json:"active_connections"`
	MaxConnections        int       `json:"max_connections"`
	GoroutineCount        int       `json:"goroutine_count"`
	LastUpdated           time.Time `json:"last_updated"`
}

// ServiceErrorMetrics tracks error patterns and rates
type ServiceErrorMetrics struct {
	ServiceName           string                    `json:"service_name"`
	TotalErrors           int64                     `json:"total_errors"`
	ErrorsByType          map[string]int64          `json:"errors_by_type"`
	ErrorsByOperation     map[string]int64          `json:"errors_by_operation"`
	RecentErrors          []ErrorEvent              `json:"recent_errors"`
	ErrorRate             float64                   `json:"error_rate"`
	CriticalErrors        int64                     `json:"critical_errors"`
	LastUpdated           time.Time                 `json:"last_updated"`
}

// OperationMetric tracks metrics for specific operations
type OperationMetric struct {
	OperationName       string        `json:"operation_name"`
	Count               int64         `json:"count"`
	SuccessCount        int64         `json:"success_count"`
	FailureCount        int64         `json:"failure_count"`
	AverageResponseTime time.Duration `json:"average_response_time"`
	LastExecution       time.Time     `json:"last_execution"`
}

// ErrorEvent represents a specific error occurrence
type ErrorEvent struct {
	Timestamp     time.Time `json:"timestamp"`
	Operation     string    `json:"operation"`
	ErrorType     string    `json:"error_type"`
	ErrorMessage  string    `json:"error_message"`
	CorrelationID string    `json:"correlation_id"`
	RequestID     string    `json:"request_id"`
	Severity      string    `json:"severity"`
}

// MonitoringManager manages service monitoring registration and coordination
type MonitoringManager struct {
	services          map[string]ServiceMonitor
	performanceData   map[string]*ServicePerformanceMetrics
	resourceData      map[string]*ServiceResourceMetrics
	errorData         map[string]*ServiceErrorMetrics
	healthData        map[string]ServiceHealthStatus
	correlationData   map[string]*CorrelationTrace
	mutex             sync.RWMutex
	logger            *logrus.Logger
	
	// Prometheus metrics
	requestDuration   *prometheus.HistogramVec
	requestTotal      *prometheus.CounterVec
	errorTotal        *prometheus.CounterVec
	resourceUsage     *prometheus.GaugeVec
	healthStatus      *prometheus.GaugeVec
}

// CorrelationTrace tracks request flow across services
type CorrelationTrace struct {
	CorrelationID     string                    `json:"correlation_id"`
	RequestID         string                    `json:"request_id"`
	TraceID           string                    `json:"trace_id"`
	StartTime         time.Time                 `json:"start_time"`
	EndTime           time.Time                 `json:"end_time"`
	TotalDuration     time.Duration             `json:"total_duration"`
	ServiceHops       []ServiceHop              `json:"service_hops"`
	Success           bool                      `json:"success"`
	ErrorMessage      string                    `json:"error_message,omitempty"`
	UserID            string                    `json:"user_id,omitempty"`
	SessionID         string                    `json:"session_id,omitempty"`
}

// ServiceHop represents one step in a correlation trace
type ServiceHop struct {
	ServiceName       string        `json:"service_name"`
	Operation         string        `json:"operation"`
	StartTime         time.Time     `json:"start_time"`
	EndTime           time.Time     `json:"end_time"`
	Duration          time.Duration `json:"duration"`
	Success           bool          `json:"success"`
	ErrorMessage      string        `json:"error_message,omitempty"`
	RequestSize       int64         `json:"request_size,omitempty"`
	ResponseSize      int64         `json:"response_size,omitempty"`
}

// NewMonitoringManager creates a new monitoring manager
func NewMonitoringManager() *MonitoringManager {
	return &MonitoringManager{
		services:        make(map[string]ServiceMonitor),
		performanceData: make(map[string]*ServicePerformanceMetrics),
		resourceData:    make(map[string]*ServiceResourceMetrics),
		errorData:       make(map[string]*ServiceErrorMetrics),
		healthData:      make(map[string]ServiceHealthStatus),
		correlationData: make(map[string]*CorrelationTrace),
		logger:          logrus.New(),
		
		// Initialize Prometheus metrics
		requestDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "selly_service_request_duration_seconds",
				Help:    "Time spent processing requests by service and operation",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"service", "operation", "status"},
		),
		
		requestTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "selly_service_requests_total",
				Help: "Total number of requests processed by service and operation",
			},
			[]string{"service", "operation", "status"},
		),
		
		errorTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "selly_service_errors_total",
				Help: "Total number of errors by service, operation, and error type",
			},
			[]string{"service", "operation", "error_type"},
		),
		
		resourceUsage: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "selly_service_resource_usage",
				Help: "Resource usage by service and resource type",
			},
			[]string{"service", "resource_type"},
		),
		
		healthStatus: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "selly_service_health_status",
				Help: "Health status of services (1=healthy, 0.5=degraded, 0=unhealthy)",
			},
			[]string{"service"},
		),
	}
}

// RegisterService registers a service for monitoring
func (mm *MonitoringManager) RegisterService(service ServiceMonitor) error {
	mm.mutex.Lock()
	defer mm.mutex.Unlock()
	
	serviceName := service.GetServiceName()
	if serviceName == "" {
		return fmt.Errorf("service name cannot be empty")
	}
	
	mm.services[serviceName] = service
	mm.performanceData[serviceName] = &ServicePerformanceMetrics{
		ServiceName:      serviceName,
		OperationMetrics: make(map[string]*OperationMetric),
		LastUpdated:      time.Now(),
	}
	mm.resourceData[serviceName] = &ServiceResourceMetrics{
		ServiceName: serviceName,
		LastUpdated: time.Now(),
	}
	mm.errorData[serviceName] = &ServiceErrorMetrics{
		ServiceName:       serviceName,
		ErrorsByType:      make(map[string]int64),
		ErrorsByOperation: make(map[string]int64),
		RecentErrors:      make([]ErrorEvent, 0),
		LastUpdated:       time.Now(),
	}
	mm.healthData[serviceName] = service.GetServiceHealth()
	
	mm.logger.WithFields(logrus.Fields{
		"service_name":    serviceName,
		"service_version": service.GetServiceVersion(),
		"health_status":   service.GetServiceHealth(),
	}).Info("Service registered with monitoring manager")
	
	return nil
}

// RecordServiceRequest records a service request for monitoring
func (mm *MonitoringManager) RecordServiceRequest(ctx *servicecontext.ServiceContext, serviceName, operation string, duration time.Duration, success bool) {
	mm.mutex.Lock()
	defer mm.mutex.Unlock()
	
	// Update Prometheus metrics
	status := "success"
	if !success {
		status = "failure"
	}
	
	mm.requestDuration.WithLabelValues(serviceName, operation, status).Observe(duration.Seconds())
	mm.requestTotal.WithLabelValues(serviceName, operation, status).Inc()
	
	// Update internal metrics
	if perf, exists := mm.performanceData[serviceName]; exists {
		perf.TotalRequests++
		if success {
			perf.SuccessfulRequests++
		} else {
			perf.FailedRequests++
		}
		
		// Update operation metrics
		if perf.OperationMetrics[operation] == nil {
			perf.OperationMetrics[operation] = &OperationMetric{
				OperationName: operation,
			}
		}
		
		opMetric := perf.OperationMetrics[operation]
		opMetric.Count++
		if success {
			opMetric.SuccessCount++
		} else {
			opMetric.FailureCount++
		}
		opMetric.LastExecution = time.Now()
		
		// Update response time averages
		totalRequests := float64(perf.TotalRequests)
		currentAvg := perf.AverageResponseTime.Seconds()
		newAvg := (currentAvg*(totalRequests-1) + duration.Seconds()) / totalRequests
		perf.AverageResponseTime = time.Duration(newAvg * float64(time.Second))
		
		perf.ErrorRate = float64(perf.FailedRequests) / float64(perf.TotalRequests) * 100
		perf.LastUpdated = time.Now()
	}
	
	// Update correlation trace if present
	if ctx.CorrelationID != "" {
		mm.updateCorrelationTrace(ctx, serviceName, operation, duration, success, "")
	}
	
	mm.logger.WithFields(logrus.Fields{
		"service":        serviceName,
		"operation":      operation,
		"duration_ms":    duration.Milliseconds(),
		"success":        success,
		"correlation_id": ctx.CorrelationID,
		"request_id":     ctx.RequestID,
	}).Debug("Service request recorded")
}

// RecordServiceError records a service error for monitoring
func (mm *MonitoringManager) RecordServiceError(ctx *servicecontext.ServiceContext, serviceName, operation, errorType string, err error) {
	mm.mutex.Lock()
	defer mm.mutex.Unlock()
	
	// Update Prometheus metrics
	mm.errorTotal.WithLabelValues(serviceName, operation, errorType).Inc()
	
	// Update internal metrics
	if errorData, exists := mm.errorData[serviceName]; exists {
		errorData.TotalErrors++
		errorData.ErrorsByType[errorType]++
		errorData.ErrorsByOperation[operation]++
		
		// Add to recent errors (keep last 100)
		errorEvent := ErrorEvent{
			Timestamp:     time.Now(),
			Operation:     operation,
			ErrorType:     errorType,
			ErrorMessage:  err.Error(),
			CorrelationID: ctx.CorrelationID,
			RequestID:     ctx.RequestID,
			Severity:      determineSeverity(errorType),
		}
		
		errorData.RecentErrors = append(errorData.RecentErrors, errorEvent)
		if len(errorData.RecentErrors) > 100 {
			errorData.RecentErrors = errorData.RecentErrors[1:]
		}
		
		// Update error rate
		if perf, exists := mm.performanceData[serviceName]; exists {
			errorData.ErrorRate = float64(errorData.TotalErrors) / float64(perf.TotalRequests) * 100
		}
		
		errorData.LastUpdated = time.Now()
	}
	
	// Update correlation trace
	if ctx.CorrelationID != "" {
		mm.updateCorrelationTrace(ctx, serviceName, operation, 0, false, err.Error())
	}
	
	mm.logger.WithFields(logrus.Fields{
		"service":        serviceName,
		"operation":      operation,
		"error_type":     errorType,
		"error":          err.Error(),
		"correlation_id": ctx.CorrelationID,
		"request_id":     ctx.RequestID,
	}).Error("Service error recorded")
}

// RecordResourceUsage records resource usage for a service
func (mm *MonitoringManager) RecordResourceUsage(serviceName string, memoryMB, cpuPercent float64, connections int) {
	mm.mutex.Lock()
	defer mm.mutex.Unlock()
	
	// Update Prometheus metrics
	mm.resourceUsage.WithLabelValues(serviceName, "memory_mb").Set(memoryMB)
	mm.resourceUsage.WithLabelValues(serviceName, "cpu_percent").Set(cpuPercent)
	mm.resourceUsage.WithLabelValues(serviceName, "connections").Set(float64(connections))
	
	// Update internal metrics
	if resource, exists := mm.resourceData[serviceName]; exists {
		resource.MemoryUsageMB = memoryMB
		resource.CPUUsagePercent = cpuPercent
		resource.ActiveConnections = connections
		
		// Track maximums
		if memoryMB > resource.MaxMemoryUsageMB {
			resource.MaxMemoryUsageMB = memoryMB
		}
		if cpuPercent > resource.MaxCPUUsagePercent {
			resource.MaxCPUUsagePercent = cpuPercent
		}
		if connections > resource.MaxConnections {
			resource.MaxConnections = connections
		}
		
		resource.LastUpdated = time.Now()
	}
}

// UpdateServiceHealth updates the health status of a service
func (mm *MonitoringManager) UpdateServiceHealth(serviceName string, status ServiceHealthStatus, reason string) {
	mm.mutex.Lock()
	defer mm.mutex.Unlock()
	
	mm.healthData[serviceName] = status
	
	// Update Prometheus metrics
	var healthValue float64
	switch status {
	case ServiceHealthStatusHealthy:
		healthValue = 1.0
	case ServiceHealthStatusDegraded:
		healthValue = 0.5
	case ServiceHealthStatusUnhealthy:
		healthValue = 0.0
	default:
		healthValue = -1.0
	}
	mm.healthStatus.WithLabelValues(serviceName).Set(healthValue)
	
	mm.logger.WithFields(logrus.Fields{
		"service":      serviceName,
		"health_status": status,
		"reason":       reason,
	}).Info("Service health status updated")
}

// GetServicePerformanceMetrics returns performance metrics for a service
func (mm *MonitoringManager) GetServicePerformanceMetrics(serviceName string) *ServicePerformanceMetrics {
	mm.mutex.RLock()
	defer mm.mutex.RUnlock()
	
	if metrics, exists := mm.performanceData[serviceName]; exists {
		// Return a copy to avoid race conditions
		copy := *metrics
		copy.OperationMetrics = make(map[string]*OperationMetric)
		for k, v := range metrics.OperationMetrics {
			opCopy := *v
			copy.OperationMetrics[k] = &opCopy
		}
		return &copy
	}
	return nil
}

// GetAllServiceMetrics returns metrics for all registered services
func (mm *MonitoringManager) GetAllServiceMetrics() map[string]*ServicePerformanceMetrics {
	mm.mutex.RLock()
	defer mm.mutex.RUnlock()
	
	result := make(map[string]*ServicePerformanceMetrics)
	for serviceName := range mm.services {
		if metrics := mm.GetServicePerformanceMetrics(serviceName); metrics != nil {
			result[serviceName] = metrics
		}
	}
	return result
}

// GetCorrelationTrace returns trace information for a correlation ID
func (mm *MonitoringManager) GetCorrelationTrace(correlationID string) *CorrelationTrace {
	mm.mutex.RLock()
	defer mm.mutex.RUnlock()
	
	if trace, exists := mm.correlationData[correlationID]; exists {
		// Return a copy
		copy := *trace
		copy.ServiceHops = make([]ServiceHop, len(trace.ServiceHops))
		for i, hop := range trace.ServiceHops {
			copy.ServiceHops[i] = hop
		}
		return &copy
	}
	return nil
}

// GetServiceHealth returns current health status of all services
func (mm *MonitoringManager) GetServiceHealth() map[string]ServiceHealthStatus {
	mm.mutex.RLock()
	defer mm.mutex.RUnlock()
	
	result := make(map[string]ServiceHealthStatus)
	for name, status := range mm.healthData {
		result[name] = status
	}
	return result
}

// Private helper methods

func (mm *MonitoringManager) updateCorrelationTrace(ctx *servicecontext.ServiceContext, serviceName, operation string, duration time.Duration, success bool, errorMsg string) {
	if ctx.CorrelationID == "" {
		return
	}
	
	if trace, exists := mm.correlationData[ctx.CorrelationID]; exists {
		// Add service hop to existing trace
		hop := ServiceHop{
			ServiceName:  serviceName,
			Operation:    operation,
			StartTime:    time.Now().Add(-duration),
			EndTime:      time.Now(),
			Duration:     duration,
			Success:      success,
			ErrorMessage: errorMsg,
		}
		trace.ServiceHops = append(trace.ServiceHops, hop)
		trace.EndTime = time.Now()
		trace.TotalDuration = trace.EndTime.Sub(trace.StartTime)
		if !success {
			trace.Success = false
			trace.ErrorMessage = errorMsg
		}
	} else {
		// Create new trace
		trace := &CorrelationTrace{
			CorrelationID: ctx.CorrelationID,
			RequestID:     ctx.RequestID,
			TraceID:       ctx.TraceID,
			StartTime:     time.Now().Add(-duration),
			EndTime:       time.Now(),
			TotalDuration: duration,
			Success:       success,
			ErrorMessage:  errorMsg,
			UserID:        ctx.UserID,
			SessionID:     ctx.SessionID,
			ServiceHops: []ServiceHop{{
				ServiceName:  serviceName,
				Operation:    operation,
				StartTime:    time.Now().Add(-duration),
				EndTime:      time.Now(),
				Duration:     duration,
				Success:      success,
				ErrorMessage: errorMsg,
			}},
		}
		mm.correlationData[ctx.CorrelationID] = trace
	}
}

func determineSeverity(errorType string) string {
	switch errorType {
	case "panic", "fatal", "critical":
		return "critical"
	case "timeout", "connection_failed", "service_unavailable":
		return "high"
	case "validation_error", "bad_request":
		return "medium"
	default:
		return "low"
	}
}

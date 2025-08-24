package monitoring

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

// PrometheusMetrics provides Prometheus metrics collection for SELLY AI
// Phase 3 Week 2: Production-grade metrics and observability
type PrometheusMetrics struct {
	// AI Service Metrics
	aiInferenceTotal       *prometheus.CounterVec
	aiInferenceDuration    *prometheus.HistogramVec
	aiInferenceErrors      *prometheus.CounterVec
	aiModelHealth          *prometheus.GaugeVec
	aiProviderAvailability *prometheus.GaugeVec
	
	// Training Service Metrics
	trainingDataTotal      *prometheus.CounterVec
	trainingAccuracy       *prometheus.GaugeVec
	trainingCacheHits      *prometheus.CounterVec
	trainingCacheMisses    *prometheus.CounterVec
	trainingProcessingTime *prometheus.HistogramVec
	
	// System Metrics
	httpRequestsTotal      *prometheus.CounterVec
	httpRequestDuration    *prometheus.HistogramVec
	systemMemoryUsage      *prometheus.GaugeVec
	systemCPUUsage         *prometheus.GaugeVec
	databaseConnections    *prometheus.GaugeVec
	
	// Business Metrics
	userSessions           *prometheus.GaugeVec
	documentProcessing     *prometheus.CounterVec
	serviceRequests        *prometheus.CounterVec
	errorRates             *prometheus.GaugeVec
	
	// Performance Metrics
	cachePerformance       *prometheus.HistogramVec
	databaseQueryTime      *prometheus.HistogramVec
	externalAPILatency     *prometheus.HistogramVec
	
	registry *prometheus.Registry
}

// NewPrometheusMetrics creates a new Prometheus metrics collector
func NewPrometheusMetrics() *PrometheusMetrics {
	pm := &PrometheusMetrics{
		registry: prometheus.NewRegistry(),
	}
	
	pm.initializeMetrics()
	pm.registerMetrics()
	
	return pm
}

// initializeMetrics initializes all Prometheus metrics
func (pm *PrometheusMetrics) initializeMetrics() {
	// AI Service Metrics
	pm.aiInferenceTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "selly_ai_inference_total",
			Help: "Total number of AI inference requests",
		},
		[]string{"provider", "model", "task", "status"},
	)
	
	pm.aiInferenceDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "selly_ai_inference_duration_seconds",
			Help:    "Duration of AI inference requests in seconds",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0},
		},
		[]string{"provider", "model", "task"},
	)
	
	pm.aiInferenceErrors = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "selly_ai_inference_errors_total",
			Help: "Total number of AI inference errors",
		},
		[]string{"provider", "model", "error_type"},
	)
	
	pm.aiModelHealth = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "selly_ai_model_health",
			Help: "Health status of AI models (1=healthy, 0.5=degraded, 0=unhealthy)",
		},
		[]string{"provider", "model"},
	)
	
	pm.aiProviderAvailability = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "selly_ai_provider_availability",
			Help: "Availability of AI providers (0-1)",
		},
		[]string{"provider"},
	)
	
	// Training Service Metrics
	pm.trainingDataTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "selly_training_data_total",
			Help: "Total number of training data entries",
		},
		[]string{"service_type", "status"},
	)
	
	pm.trainingAccuracy = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "selly_training_accuracy",
			Help: "Training accuracy for different services (0-1)",
		},
		[]string{"service_type", "model"},
	)
	
	pm.trainingCacheHits = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "selly_training_cache_hits_total",
			Help: "Total number of training cache hits",
		},
		[]string{"cache_type"},
	)
	
	pm.trainingCacheMisses = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "selly_training_cache_misses_total",
			Help: "Total number of training cache misses",
		},
		[]string{"cache_type"},
	)
	
	pm.trainingProcessingTime = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "selly_training_processing_duration_seconds",
			Help:    "Duration of training processing in seconds",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0},
		},
		[]string{"service_type", "operation"},
	)
	
	// System Metrics
	pm.httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "selly_http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status_code"},
	)
	
	pm.httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "selly_http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0},
		},
		[]string{"method", "endpoint"},
	)
	
	pm.systemMemoryUsage = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "selly_system_memory_usage_bytes",
			Help: "System memory usage in bytes",
		},
		[]string{"type"},
	)
	
	pm.systemCPUUsage = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "selly_system_cpu_usage_percent",
			Help: "System CPU usage percentage",
		},
		[]string{"core"},
	)
	
	pm.databaseConnections = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "selly_database_connections",
			Help: "Number of database connections",
		},
		[]string{"database", "status"},
	)
	
	// Business Metrics
	pm.userSessions = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "selly_user_sessions_active",
			Help: "Number of active user sessions",
		},
		[]string{"session_type"},
	)
	
	pm.documentProcessing = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "selly_document_processing_total",
			Help: "Total number of document processing requests",
		},
		[]string{"document_type", "status"},
	)
	
	pm.serviceRequests = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "selly_service_requests_total",
			Help: "Total number of service requests",
		},
		[]string{"service_type", "status"},
	)
	
	pm.errorRates = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "selly_error_rate",
			Help: "Error rate for different services (0-1)",
		},
		[]string{"service", "error_type"},
	)
	
	// Performance Metrics
	pm.cachePerformance = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "selly_cache_operation_duration_seconds",
			Help:    "Duration of cache operations in seconds",
			Buckets: []float64{0.00001, 0.00005, 0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05},
		},
		[]string{"cache_type", "operation"},
	)
	
	pm.databaseQueryTime = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "selly_database_query_duration_seconds",
			Help:    "Duration of database queries in seconds",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0},
		},
		[]string{"database", "operation", "table"},
	)
	
	pm.externalAPILatency = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "selly_external_api_latency_seconds",
			Help:    "Latency of external API calls in seconds",
			Buckets: []float64{0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0},
		},
		[]string{"api", "endpoint", "method"},
	)
}

// registerMetrics registers all metrics with the Prometheus registry
func (pm *PrometheusMetrics) registerMetrics() {
	// AI Service Metrics
	pm.registry.MustRegister(pm.aiInferenceTotal)
	pm.registry.MustRegister(pm.aiInferenceDuration)
	pm.registry.MustRegister(pm.aiInferenceErrors)
	pm.registry.MustRegister(pm.aiModelHealth)
	pm.registry.MustRegister(pm.aiProviderAvailability)
	
	// Training Service Metrics
	pm.registry.MustRegister(pm.trainingDataTotal)
	pm.registry.MustRegister(pm.trainingAccuracy)
	pm.registry.MustRegister(pm.trainingCacheHits)
	pm.registry.MustRegister(pm.trainingCacheMisses)
	pm.registry.MustRegister(pm.trainingProcessingTime)
	
	// System Metrics
	pm.registry.MustRegister(pm.httpRequestsTotal)
	pm.registry.MustRegister(pm.httpRequestDuration)
	pm.registry.MustRegister(pm.systemMemoryUsage)
	pm.registry.MustRegister(pm.systemCPUUsage)
	pm.registry.MustRegister(pm.databaseConnections)
	
	// Business Metrics
	pm.registry.MustRegister(pm.userSessions)
	pm.registry.MustRegister(pm.documentProcessing)
	pm.registry.MustRegister(pm.serviceRequests)
	pm.registry.MustRegister(pm.errorRates)
	
	// Performance Metrics
	pm.registry.MustRegister(pm.cachePerformance)
	pm.registry.MustRegister(pm.databaseQueryTime)
	pm.registry.MustRegister(pm.externalAPILatency)
	
	logrus.Info("✅ Prometheus metrics registered successfully")
}

// RecordAIInference records an AI inference operation
func (pm *PrometheusMetrics) RecordAIInference(provider, model, task, status string, duration time.Duration) {
	pm.aiInferenceTotal.WithLabelValues(provider, model, task, status).Inc()
	pm.aiInferenceDuration.WithLabelValues(provider, model, task).Observe(duration.Seconds())
}

// RecordAIError records an AI inference error
func (pm *PrometheusMetrics) RecordAIError(provider, model, errorType string) {
	pm.aiInferenceErrors.WithLabelValues(provider, model, errorType).Inc()
}

// UpdateAIModelHealth updates the health status of an AI model
func (pm *PrometheusMetrics) UpdateAIModelHealth(provider, model string, health float64) {
	pm.aiModelHealth.WithLabelValues(provider, model).Set(health)
}

// UpdateAIProviderAvailability updates the availability of an AI provider
func (pm *PrometheusMetrics) UpdateAIProviderAvailability(provider string, availability float64) {
	pm.aiProviderAvailability.WithLabelValues(provider).Set(availability)
}

// RecordTrainingData records training data operations
func (pm *PrometheusMetrics) RecordTrainingData(serviceType, status string) {
	pm.trainingDataTotal.WithLabelValues(serviceType, status).Inc()
}

// UpdateTrainingAccuracy updates training accuracy metrics
func (pm *PrometheusMetrics) UpdateTrainingAccuracy(serviceType, model string, accuracy float64) {
	pm.trainingAccuracy.WithLabelValues(serviceType, model).Set(accuracy)
}

// RecordCacheOperation records cache operations
func (pm *PrometheusMetrics) RecordCacheOperation(cacheType, operation string, duration time.Duration, hit bool) {
	pm.cachePerformance.WithLabelValues(cacheType, operation).Observe(duration.Seconds())
	
	if hit {
		pm.trainingCacheHits.WithLabelValues(cacheType).Inc()
	} else {
		pm.trainingCacheMisses.WithLabelValues(cacheType).Inc()
	}
}

// RecordHTTPRequest records HTTP request metrics
func (pm *PrometheusMetrics) RecordHTTPRequest(method, endpoint string, statusCode int, duration time.Duration) {
	status := strconv.Itoa(statusCode)
	pm.httpRequestsTotal.WithLabelValues(method, endpoint, status).Inc()
	pm.httpRequestDuration.WithLabelValues(method, endpoint).Observe(duration.Seconds())
}

// UpdateSystemMetrics updates system resource metrics
func (pm *PrometheusMetrics) UpdateSystemMetrics(memoryUsage, cpuUsage float64) {
	pm.systemMemoryUsage.WithLabelValues("used").Set(memoryUsage)
	pm.systemCPUUsage.WithLabelValues("total").Set(cpuUsage)
}

// RecordDatabaseQuery records database query metrics
func (pm *PrometheusMetrics) RecordDatabaseQuery(database, operation, table string, duration time.Duration) {
	pm.databaseQueryTime.WithLabelValues(database, operation, table).Observe(duration.Seconds())
}

// RecordExternalAPI records external API call metrics
func (pm *PrometheusMetrics) RecordExternalAPI(api, endpoint, method string, duration time.Duration) {
	pm.externalAPILatency.WithLabelValues(api, endpoint, method).Observe(duration.Seconds())
}

// GetHandler returns the Prometheus HTTP handler
func (pm *PrometheusMetrics) GetHandler() http.Handler {
	return promhttp.HandlerFor(pm.registry, promhttp.HandlerOpts{
		EnableOpenMetrics: true,
	})
}

// GetRegistry returns the Prometheus registry
func (pm *PrometheusMetrics) GetRegistry() *prometheus.Registry {
	return pm.registry
}

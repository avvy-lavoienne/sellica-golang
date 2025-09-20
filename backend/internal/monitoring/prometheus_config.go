package monitoring

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

// PrometheusConfig defines configuration for Prometheus integration
type PrometheusConfig struct {
	MetricsPath     string        `json:"metrics_path"`
	ListenAddress   string        `json:"listen_address"`
	ScrapeInterval  time.Duration `json:"scrape_interval"`
	GatherTimeout   time.Duration `json:"gather_timeout"`
	EnableGoMetrics bool          `json:"enable_go_metrics"`
	EnableProfiling bool          `json:"enable_profiling"`
	
	// Custom labels for all metrics
	ServiceLabels map[string]string `json:"service_labels"`
	
	// Registry configuration
	Registry *prometheus.Registry `json:"-"`
}

// DefaultPrometheusConfig returns a default Prometheus configuration
func DefaultPrometheusConfig() *PrometheusConfig {
	return &PrometheusConfig{
		MetricsPath:     "/metrics",
		ListenAddress:   ":8080",
		ScrapeInterval:  time.Second * 15,
		GatherTimeout:   time.Second * 10,
		EnableGoMetrics: true,
		EnableProfiling: false,
		ServiceLabels: map[string]string{
			"service": "selly-backend",
			"version": "1.0.0",
			"phase":   "3",
		},
		Registry: prometheus.NewRegistry(),
	}
}

// PrometheusIntegration manages Prometheus metrics server and configuration
type PrometheusIntegration struct {
	config       *PrometheusConfig
	server       *http.Server
	registry     *prometheus.Registry
	gatherer     prometheus.Gatherer
	logger       *logrus.Logger
	isRunning    bool
	shutdownChan chan struct{}
}

// NewPrometheusIntegration creates a new Prometheus integration instance
func NewPrometheusIntegration(config *PrometheusConfig, logger *logrus.Logger) *PrometheusIntegration {
	if config == nil {
		config = DefaultPrometheusConfig()
	}
	
	if config.Registry == nil {
		config.Registry = prometheus.NewRegistry()
	}
	
	pi := &PrometheusIntegration{
		config:       config,
		registry:     config.Registry,
		gatherer:     config.Registry,
		logger:       logger,
		shutdownChan: make(chan struct{}),
	}
	
	// Register Go runtime metrics if enabled
	if config.EnableGoMetrics {
		pi.registry.MustRegister(prometheus.NewGoCollector())
		pi.registry.MustRegister(prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}))
	}
	
	return pi
}

// Start begins the Prometheus metrics server
func (pi *PrometheusIntegration) Start(ctx context.Context) error {
	if pi.isRunning {
		return fmt.Errorf("prometheus integration already running")
	}
	
	// Create HTTP server
	mux := http.NewServeMux()
	
	// Metrics endpoint
	mux.Handle(pi.config.MetricsPath, promhttp.HandlerFor(pi.gatherer, promhttp.HandlerOpts{
		Registry:          pi.registry,
		EnableOpenMetrics: true,
		Timeout:           pi.config.GatherTimeout,
		ErrorLog:          pi.logger,
	}))
	
	// Health endpoint
	mux.HandleFunc("/health", pi.healthHandler)
	
	// Ready endpoint
	mux.HandleFunc("/ready", pi.readyHandler)
	
	// Profiling endpoints if enabled
	if pi.config.EnableProfiling {
		mux.HandleFunc("/debug/pprof/", http.DefaultServeMux.ServeHTTP)
	}
	
	pi.server = &http.Server{
		Addr:         pi.config.ListenAddress,
		Handler:      mux,
		ReadTimeout:  time.Second * 30,
		WriteTimeout: time.Second * 30,
		IdleTimeout:  time.Second * 120,
	}
	
	pi.isRunning = true
	
	pi.logger.WithFields(logrus.Fields{
		"address":      pi.config.ListenAddress,
		"metrics_path": pi.config.MetricsPath,
		"go_metrics":   pi.config.EnableGoMetrics,
		"profiling":    pi.config.EnableProfiling,
	}).Info("Starting Prometheus metrics server")
	
	// Start server in goroutine
	go func() {
		if err := pi.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			pi.logger.WithError(err).Error("Prometheus server failed")
		}
	}()
	
	return nil
}

// Stop gracefully shuts down the Prometheus metrics server
func (pi *PrometheusIntegration) Stop(ctx context.Context) error {
	if !pi.isRunning {
		return nil
	}
	
	pi.logger.Info("Stopping Prometheus metrics server")
	
	// Create shutdown context with timeout
	shutdownCtx, cancel := context.WithTimeout(ctx, time.Second*30)
	defer cancel()
	
	// Shutdown server
	err := pi.server.Shutdown(shutdownCtx)
	if err != nil {
		pi.logger.WithError(err).Error("Error during Prometheus server shutdown")
	}
	
	pi.isRunning = false
	close(pi.shutdownChan)
	
	return err
}

// RegisterCollector registers a custom Prometheus collector
func (pi *PrometheusIntegration) RegisterCollector(collector prometheus.Collector) error {
	return pi.registry.Register(collector)
}

// UnregisterCollector unregisters a Prometheus collector
func (pi *PrometheusIntegration) UnregisterCollector(collector prometheus.Collector) bool {
	return pi.registry.Unregister(collector)
}

// GetRegistry returns the Prometheus registry
func (pi *PrometheusIntegration) GetRegistry() *prometheus.Registry {
	return pi.registry
}

// IsRunning returns whether the Prometheus integration is running
func (pi *PrometheusIntegration) IsRunning() bool {
	return pi.isRunning
}

// GetMetricsURL returns the full URL for the metrics endpoint
func (pi *PrometheusIntegration) GetMetricsURL() string {
	return fmt.Sprintf("http://localhost%s%s", pi.config.ListenAddress, pi.config.MetricsPath)
}

// WaitForShutdown blocks until the server is shut down
func (pi *PrometheusIntegration) WaitForShutdown() {
	<-pi.shutdownChan
}

// Health handler for Prometheus server health checks
func (pi *PrometheusIntegration) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy","service":"prometheus-integration","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`))
}

// Ready handler for Prometheus server readiness checks
func (pi *PrometheusIntegration) readyHandler(w http.ResponseWriter, r *http.Request) {
	if pi.isRunning {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ready","service":"prometheus-integration","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`))
	} else {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte(`{"status":"not_ready","service":"prometheus-integration","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`))
	}
}

// GetPrometheusConfig returns configuration for Prometheus scraping
func (pi *PrometheusIntegration) GetPrometheusConfig() map[string]interface{} {
	return map[string]interface{}{
		"global": map[string]interface{}{
			"scrape_interval":     pi.config.ScrapeInterval.String(),
			"evaluation_interval": "15s",
		},
		"scrape_configs": []map[string]interface{}{
			{
				"job_name":        "selly-backend",
				"static_configs": []map[string]interface{}{
					{
						"targets": []string{pi.config.ListenAddress},
						"labels":  pi.config.ServiceLabels,
					},
				},
				"metrics_path":    pi.config.MetricsPath,
				"scrape_interval": pi.config.ScrapeInterval.String(),
				"scrape_timeout":  pi.config.GatherTimeout.String(),
			},
		},
		"rule_files": []string{
			"/etc/prometheus/rules/*.yml",
		},
		"alerting": map[string]interface{}{
			"alertmanagers": []map[string]interface{}{
				{
					"static_configs": []map[string]interface{}{
						{
							"targets": []string{"alertmanager:9093"},
						},
					},
				},
			},
		},
	}
}

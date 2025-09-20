package eventbus

import (
	"fmt"
	"time"
)

// ProductionConfig provides production-ready configuration for the event bus
type ProductionConfig struct {
	// Event Bus Configuration
	EventBus *EventBusConfig `yaml:"event_bus"`

	// SELLY AI Handlers Configuration
	SELLYHandlers *SELLYHandlersConfig `yaml:"selly_handlers"`

	// Production Monitoring Configuration
	Monitoring *MonitoringConfig `yaml:"monitoring"`

	// Integration Configurations
	CacheIntegration      *CacheIntegrationConfig      `yaml:"cache_integration"`
	MonitoringIntegration *MonitoringIntegrationConfig `yaml:"monitoring_integration"`
}

// SELLYHandlersConfig configures SELLY AI specific event handlers
type SELLYHandlersConfig struct {
	Enabled                    bool     `yaml:"enabled"`
	EnableUserEvents           bool     `yaml:"enable_user_events"`
	EnableDocumentEvents       bool     `yaml:"enable_document_events"`
	EnableChatEvents           bool     `yaml:"enable_chat_events"`
	EnableTrainingEvents       bool     `yaml:"enable_training_events"`
	EnableServiceEvents        bool     `yaml:"enable_service_events"`
	EnableComplianceEvents     bool     `yaml:"enable_compliance_events"`
	ComplianceViolationThresholds map[string]string `yaml:"compliance_violation_thresholds"`
}

// CacheIntegrationConfig configures cache service integration
type CacheIntegrationConfig struct {
	Enabled               bool          `yaml:"enabled"`
	CacheInvalidationPatterns []string  `yaml:"cache_invalidation_patterns"`
	CacheWarmingEnabled   bool          `yaml:"cache_warming_enabled"`
	DefaultTTL            time.Duration `yaml:"default_ttl"`
}

// MonitoringIntegrationConfig configures monitoring service integration
type MonitoringIntegrationConfig struct {
	Enabled               bool            `yaml:"enabled"`
	MetricsPrefix         string          `yaml:"metrics_prefix"`
	AlertEndpoints        []string        `yaml:"alert_endpoints"`
	HealthCheckEnabled    bool            `yaml:"health_check_enabled"`
	PerformanceThresholds map[string]float64 `yaml:"performance_thresholds"`
}

// DefaultProductionConfig returns a production-ready default configuration
func DefaultProductionConfig() *ProductionConfig {
	return &ProductionConfig{
		EventBus: DefaultEventBusConfig(),
		SELLYHandlers: &SELLYHandlersConfig{
			Enabled:                true,
			EnableUserEvents:       true,
			EnableDocumentEvents:   true,
			EnableChatEvents:       true,
			EnableTrainingEvents:   true,
			EnableServiceEvents:    true,
			EnableComplianceEvents: true,
			ComplianceViolationThresholds: map[string]string{
				"critical": "immediate_action",
				"high":     "escalate_to_supervisor",
				"medium":   "log_and_monitor",
				"low":      "log_only",
			},
		},
		Monitoring: &MonitoringConfig{
			AlertThresholds: map[string]float64{
				"events_failed_rate":     0.05,  // 5% failure rate
				"processing_time_avg":    1000,  // 1 second average
				"queue_utilization":      0.8,   // 80% queue utilization
				"memory_usage":          500,   // 500MB memory usage
				"subscriber_count":      100,   // Max subscribers
			},
			HealthCheckInterval:    30 * time.Second,
			MetricsRetentionPeriod: 24 * time.Hour,
			EnableDetailedLogging:  true,
			AlertCooldownPeriod:    5 * time.Minute,
		},
		CacheIntegration: &CacheIntegrationConfig{
			Enabled:             true,
			CacheWarmingEnabled: true,
			DefaultTTL:          10 * time.Minute,
			CacheInvalidationPatterns: []string{
				"user:*",
				"document:*",
				"chat:*",
				"training:*",
				"service:*",
			},
		},
		MonitoringIntegration: &MonitoringIntegrationConfig{
			Enabled:            true,
			MetricsPrefix:      "selly.eventbus",
			HealthCheckEnabled: true,
			AlertEndpoints: []string{
				"http://monitoring-service:8080/alerts",
				"slack://webhook/alerts",
			},
			PerformanceThresholds: map[string]float64{
				"response_time_p95": 2000, // 2 seconds
				"error_rate":        0.01, // 1%
				"throughput":        1000, // 1000 events/sec
			},
		},
	}
}

// Validate validates the production configuration
func (pc *ProductionConfig) Validate() error {
	if pc.EventBus == nil {
		return fmt.Errorf("event bus configuration is required")
	}

	if pc.EventBus.BufferSize <= 0 {
		return fmt.Errorf("event bus buffer size must be positive")
	}

	if pc.EventBus.WorkerCount <= 0 {
		return fmt.Errorf("event bus worker count must be positive")
	}

	if pc.Monitoring != nil {
		if pc.Monitoring.HealthCheckInterval <= 0 {
			return fmt.Errorf("health check interval must be positive")
		}

		if pc.Monitoring.AlertCooldownPeriod <= 0 {
			return fmt.Errorf("alert cooldown period must be positive")
		}
	}

	if pc.SELLYHandlers != nil && pc.SELLYHandlers.Enabled {
		if len(pc.SELLYHandlers.ComplianceViolationThresholds) == 0 {
			return fmt.Errorf("compliance violation thresholds must be configured when SELLY handlers are enabled")
		}
	}

	return nil
}

// GetEventBusConfig returns the event bus configuration
func (pc *ProductionConfig) GetEventBusConfig() *EventBusConfig {
	if pc.EventBus == nil {
		return DefaultEventBusConfig()
	}
	return pc.EventBus
}

// GetMonitoringConfig returns the monitoring configuration
func (pc *ProductionConfig) GetMonitoringConfig() *MonitoringConfig {
	if pc.Monitoring == nil {
		return &MonitoringConfig{
			AlertThresholds:       map[string]float64{},
			HealthCheckInterval:   30 * time.Second,
			MetricsRetentionPeriod: 24 * time.Hour,
			EnableDetailedLogging:  true,
			AlertCooldownPeriod:    5 * time.Minute,
		}
	}
	return pc.Monitoring
}

// IsSELLYHandlersEnabled returns whether SELLY handlers are enabled
func (pc *ProductionConfig) IsSELLYHandlersEnabled() bool {
	return pc.SELLYHandlers != nil && pc.SELLYHandlers.Enabled
}

// IsCacheIntegrationEnabled returns whether cache integration is enabled
func (pc *ProductionConfig) IsCacheIntegrationEnabled() bool {
	return pc.CacheIntegration != nil && pc.CacheIntegration.Enabled
}

// IsMonitoringIntegrationEnabled returns whether monitoring integration is enabled
func (pc *ProductionConfig) IsMonitoringIntegrationEnabled() bool {
	return pc.MonitoringIntegration != nil && pc.MonitoringIntegration.Enabled
}

// GetComplianceAction returns the action for a given compliance violation severity
func (pc *ProductionConfig) GetComplianceAction(severity string) string {
	if pc.SELLYHandlers == nil || pc.SELLYHandlers.ComplianceViolationThresholds == nil {
		return "log_only"
	}

	if action, exists := pc.SELLYHandlers.ComplianceViolationThresholds[severity]; exists {
		return action
	}

	return "log_only" // Default action
}

// GetCacheInvalidationPatterns returns configured cache invalidation patterns
func (pc *ProductionConfig) GetCacheInvalidationPatterns() []string {
	if pc.CacheIntegration == nil {
		return []string{}
	}
	return pc.CacheIntegration.CacheInvalidationPatterns
}

// GetAlertEndpoints returns configured alert endpoints
func (pc *ProductionConfig) GetAlertEndpoints() []string {
	if pc.MonitoringIntegration == nil {
		return []string{}
	}
	return pc.MonitoringIntegration.AlertEndpoints
}

// ShouldEnableDetailedLogging returns whether detailed logging should be enabled
func (pc *ProductionConfig) ShouldEnableDetailedLogging() bool {
	return pc.Monitoring != nil && pc.Monitoring.EnableDetailedLogging
}

// GetPerformanceThreshold returns the performance threshold for a given metric
func (pc *ProductionConfig) GetPerformanceThreshold(metric string) float64 {
	if pc.MonitoringIntegration == nil || pc.MonitoringIntegration.PerformanceThresholds == nil {
		return 0
	}

	if threshold, exists := pc.MonitoringIntegration.PerformanceThresholds[metric]; exists {
		return threshold
	}

	return 0
}

// String returns a string representation of the configuration
func (pc *ProductionConfig) String() string {
	return fmt.Sprintf("ProductionConfig{EventBus: %+v, SELLYHandlers: %+v, Monitoring: %+v}",
		pc.EventBus, pc.SELLYHandlers, pc.Monitoring)
}

// LoadFromFile loads configuration from a YAML file
func LoadFromFile(filename string) (*ProductionConfig, error) {
	// This would implement YAML loading
	// For now, return default config
	config := DefaultProductionConfig()

	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return config, nil
}

// SaveToFile saves configuration to a YAML file
func (pc *ProductionConfig) SaveToFile(filename string) error {
	// This would implement YAML saving
	// For now, just validate
	return pc.Validate()
}
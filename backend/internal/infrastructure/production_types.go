package infrastructure

import (
	"time"
)

// Configuration types for production infrastructure

// ResourceLimits defines resource limits for production deployment
type ResourceLimits struct {
	CPULimit      string // e.g., "2000m" for 2 CPU cores
	MemoryLimit   string // e.g., "4Gi" for 4GB RAM
	StorageLimit  string // e.g., "100Gi" for 100GB storage
	NetworkLimit  string // e.g., "1Gbps" for network bandwidth
}

// SecurityConfig defines security configuration
type SecurityConfig struct {
	TLSEnabled           bool
	TLSCertPath          string
	TLSKeyPath           string
	AuthenticationMethod string
	EncryptionAlgorithm  string
	ComplianceLevel      string // "government", "enterprise", "standard"
	AuditLoggingEnabled  bool
	ThreatDetectionEnabled bool
}

// MonitoringConfig defines monitoring configuration
type MonitoringConfig struct {
	MetricsInterval     time.Duration
	RetentionPeriod     time.Duration
	AlertingEnabled     bool
	DashboardEnabled    bool
	LogLevel            string
	MetricsEndpoint     string
	AlertingEndpoint    string
}

// SupabaseProductionConfig defines Supabase production configuration
type SupabaseProductionConfig struct {
	URL                 string
	AnonKey             string
	ServiceRoleKey      string
	DatabaseURL         string
	MaxConnections      int
	ConnectionTimeout   time.Duration
	QueryTimeout        time.Duration
	BackupEnabled       bool
	BackupInterval      time.Duration
	PointInTimeRecovery bool
	RLSEnabled          bool
	AuditLoggingEnabled bool
}

// UpstashProductionConfig defines Upstash Redis production configuration
type UpstashProductionConfig struct {
	URL                 string
	Token               string
	TLSEnabled          bool
	MaxConnections      int
	ConnectionTimeout   time.Duration
	ReadTimeout         time.Duration
	WriteTimeout        time.Duration
	PoolSize            int
	MinIdleConnections  int
	MaxRetries          int
	RetryDelay          time.Duration
}

// ComplianceConfig defines compliance configuration
type ComplianceConfig struct {
	DataProtectionLaw   string // "UU_27_2022" for Indonesian law
	DataRetentionPeriod time.Duration
	DataEncryptionRequired bool
	AuditTrailRequired  bool
	DataSovereignty     string // "indonesia" for Indonesian data sovereignty
	ComplianceStandards []string // ["ISO_27001", "BSSN", etc.]
}

// LoadBalancerConfig defines load balancer configuration
type LoadBalancerConfig struct {
	Strategy            LoadBalancingStrategy
	HealthCheckInterval time.Duration
	MaxRetries          int
	TimeoutDuration     time.Duration
	StickySession       bool
	SessionTimeout      time.Duration
}

// HealthCheckerConfig defines health checker configuration
type HealthCheckerConfig struct {
	CheckInterval    time.Duration
	Timeout          time.Duration
	FailureThreshold int
	SuccessThreshold int
	EnabledChecks    []string
}

// AlertingConfig defines alerting configuration
type AlertingConfig struct {
	EnableSlack         bool
	EnableEmail         bool
	EnableWebhook       bool
	SlackWebhookURL     string
	EmailRecipients     []string
	WebhookURL          string
	CriticalThreshold   float64
	WarningThreshold    float64
	AlertCooldown       time.Duration
}

// Metrics and monitoring types

// ResourceMetrics tracks resource usage metrics
type ResourceMetrics struct {
	CPUUsage        float64
	MemoryUsage     int64
	StorageUsage    int64
	NetworkUsage    int64
	HealthRatio     float64
	StartTime       time.Time
	LastHealthCheck time.Time
}

// InfrastructureMetrics provides comprehensive infrastructure metrics
type InfrastructureMetrics struct {
	Status           InfrastructureStatus
	Uptime          time.Duration
	HealthRatio     float64
	LoadBalancer    *LoadBalancerMetrics
	Supabase        *SupabaseMetrics
	Upstash         *UpstashMetrics
	Security        *SecurityMetrics
	LastHealthCheck time.Time
}

// LoadBalancerMetrics tracks load balancer performance
type LoadBalancerMetrics struct {
	ActiveBackends    int
	TotalRequests     int64
	FailedRequests    int64
	AverageResponseTime time.Duration
	RequestsPerSecond float64
	ErrorRate         float64
}

// BackendMetrics tracks individual backend performance
type BackendMetrics struct {
	RequestCount      int64
	ErrorCount        int64
	AverageResponseTime time.Duration
	LastResponseTime  time.Duration
	HealthScore       float64
	Uptime           time.Duration
}

// SupabaseMetrics tracks Supabase performance
type SupabaseMetrics struct {
	ActiveConnections int32
	QueryCount        int64
	AverageQueryTime  time.Duration
	ErrorRate         float64
	BackupStatus      string
	StorageUsage      int64
	ConnectionPoolUtilization float64
}

// UpstashMetrics tracks Upstash Redis performance
type UpstashMetrics struct {
	ActiveConnections int32
	CacheHitRate      float64
	CacheMissRate     float64
	AverageResponseTime time.Duration
	MemoryUsage       int64
	KeyCount          int64
	OperationsPerSecond float64
}

// SecurityMetrics tracks security-related metrics
type SecurityMetrics struct {
	ThreatDetectionCount int64
	AuthenticationFailures int64
	ComplianceScore      float64
	AuditLogCount        int64
	SecurityIncidents    int64
	LastSecurityScan     time.Time
}

// Connection and pool management types

// ConnectionPool manages database connections
type ConnectionPool struct {
	MaxConnections    int
	ActiveConnections int32
	IdleConnections   int32
	ConnectionTimeout time.Duration
	MaxLifetime       time.Duration
}

// ConnectionMetrics tracks connection performance
type ConnectionMetrics struct {
	TotalConnections    int64
	ActiveConnections   int32
	FailedConnections   int64
	AverageConnectTime  time.Duration
	ConnectionPoolUtilization float64
}

// RedisConnectionPool manages Redis connections
type RedisConnectionPool struct {
	MaxConnections    int
	ActiveConnections int32
	IdleConnections   int32
	PoolSize          int
	MinIdleConnections int
}

// CacheMetrics tracks cache performance
type CacheMetrics struct {
	HitCount            int64
	MissCount           int64
	HitRate             float64
	AverageResponseTime time.Duration
	MemoryUsage         int64
	KeyCount            int64
	EvictionCount       int64
	OperationsPerSecond float64
}

// TLSConfig defines TLS configuration
type TLSConfig struct {
	Enabled           bool
	CertFile          string
	KeyFile           string
	CAFile            string
	InsecureSkipVerify bool
	MinVersion        string
	MaxVersion        string
	CipherSuites      []string
}

// Real-time monitoring types

// RealTimeMetrics provides real-time system metrics
type RealTimeMetrics struct {
	Timestamp         time.Time
	CPUUsage          float64
	MemoryUsage       int64
	NetworkIO         NetworkIOMetrics
	DiskIO            DiskIOMetrics
	RequestRate       float64
	ErrorRate         float64
	ResponseTime      time.Duration
}

// HistoricalMetrics stores historical performance data
type HistoricalMetrics struct {
	TimeRange         TimeRange
	DataPoints        []MetricDataPoint
	AggregatedMetrics AggregatedMetrics
}

// NetworkIOMetrics tracks network I/O
type NetworkIOMetrics struct {
	BytesIn       int64
	BytesOut      int64
	PacketsIn     int64
	PacketsOut    int64
	ErrorsIn      int64
	ErrorsOut     int64
}

// DiskIOMetrics tracks disk I/O
type DiskIOMetrics struct {
	ReadBytes     int64
	WriteBytes    int64
	ReadOps       int64
	WriteOps      int64
	ReadLatency   time.Duration
	WriteLatency  time.Duration
}

// TimeRange defines a time range for metrics
type TimeRange struct {
	Start time.Time
	End   time.Time
}

// MetricDataPoint represents a single metric data point
type MetricDataPoint struct {
	Timestamp time.Time
	Value     float64
	Labels    map[string]string
}

// AggregatedMetrics provides aggregated metric values
type AggregatedMetrics struct {
	Average   float64
	Min       float64
	Max       float64
	P50       float64
	P95       float64
	P99       float64
	Count     int64
}

// Health checking types

// BackendHealthChecker checks backend health
type BackendHealthChecker struct {
	CheckInterval time.Duration
	Timeout       time.Duration
	HTTPPath      string
	ExpectedCode  int
	MaxFailures   int
}

// RedisHealthChecker checks Redis health
type RedisHealthChecker struct {
	CheckInterval time.Duration
	Timeout       time.Duration
	PingCommand   string
	MaxFailures   int
}

// Backup and recovery types

// BackupManager manages database backups
type BackupManager struct {
	BackupInterval    time.Duration
	RetentionPeriod   time.Duration
	BackupLocation    string
	EncryptionEnabled bool
	CompressionEnabled bool
}

// Performance monitoring types

// PerformanceTracker tracks system performance
type PerformanceTracker struct {
	MetricsBuffer     []PerformanceMetric
	BufferSize        int
	FlushInterval     time.Duration
	AlertThresholds   map[string]float64
}

// PerformanceMetric represents a performance metric
type PerformanceMetric struct {
	Name      string
	Value     float64
	Timestamp time.Time
	Labels    map[string]string
	Unit      string
}

// ProductionMetricsCollector collects production metrics
type ProductionMetricsCollector struct {
	CollectionInterval time.Duration
	MetricSources      []MetricSource
	MetricProcessors   []MetricProcessor
	MetricExporters    []MetricExporter
}

// MetricSource defines a source of metrics
type MetricSource interface {
	CollectMetrics() ([]PerformanceMetric, error)
	GetSourceName() string
}

// MetricProcessor processes metrics
type MetricProcessor interface {
	ProcessMetrics(metrics []PerformanceMetric) ([]PerformanceMetric, error)
	GetProcessorName() string
}

// MetricExporter exports metrics to external systems
type MetricExporter interface {
	ExportMetrics(metrics []PerformanceMetric) error
	GetExporterName() string
}

// Alerting types

// ProductionAlertManager manages production alerts
type ProductionAlertManager struct {
	AlertRules        []AlertRule
	NotificationChannels []NotificationChannel
	AlertHistory      []Alert
	SilencedAlerts    map[string]time.Time
}

// AlertRule defines an alerting rule
type AlertRule struct {
	Name        string
	Condition   string
	Threshold   float64
	Duration    time.Duration
	Severity    AlertSeverity
	Labels      map[string]string
	Annotations map[string]string
}

// Alert represents an alert
type Alert struct {
	ID          string
	RuleName    string
	Severity    AlertSeverity
	Message     string
	Timestamp   time.Time
	Labels      map[string]string
	Resolved    bool
	ResolvedAt  *time.Time
}

// NotificationChannel defines a notification channel
type NotificationChannel struct {
	Name    string
	Type    string
	Config  map[string]interface{}
	Enabled bool
}

// AlertSeverity defines alert severity levels
type AlertSeverity string

const (
	AlertSeverityCritical AlertSeverity = "critical"
	AlertSeverityWarning  AlertSeverity = "warning"
	AlertSeverityInfo     AlertSeverity = "info"
)

// Dashboard types

// DashboardManager manages monitoring dashboards
type DashboardManager struct {
	Dashboards      []Dashboard
	UpdateInterval  time.Duration
	DataSources     []DataSource
	Widgets         []Widget
}

// Dashboard represents a monitoring dashboard
type Dashboard struct {
	ID          string
	Name        string
	Description string
	Widgets     []Widget
	Layout      DashboardLayout
	Permissions DashboardPermissions
}

// Widget represents a dashboard widget
type Widget struct {
	ID       string
	Type     string
	Title    string
	Query    string
	Config   map[string]interface{}
	Position WidgetPosition
}

// DataSource defines a data source for dashboards
type DataSource struct {
	Name   string
	Type   string
	URL    string
	Config map[string]interface{}
}

// DashboardLayout defines dashboard layout
type DashboardLayout struct {
	Columns int
	Rows    int
	Grid    bool
}

// DashboardPermissions defines dashboard permissions
type DashboardPermissions struct {
	ViewUsers  []string
	EditUsers  []string
	AdminUsers []string
}

// WidgetPosition defines widget position on dashboard
type WidgetPosition struct {
	X      int
	Y      int
	Width  int
	Height int
}

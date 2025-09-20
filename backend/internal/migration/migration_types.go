package migration

import (
	"context"
	"time"
)

// Supporting types for migration system

// MigrationStatusReport provides comprehensive migration status
type MigrationStatusReport struct {
	Status            MigrationStatus
	CurrentPhase      MigrationPhase
	StartTime         time.Time
	Duration          time.Duration
	PhaseHistory      []PhaseExecution
	TrafficPercentage float64
	HealthScore       float64
	Issues            []MigrationIssue
	Metrics           *OverallMigrationMetrics
}

// OverallMigrationMetrics provides overall migration metrics
type OverallMigrationMetrics struct {
	TotalRequests       int64
	TotalErrors         int64
	OverallErrorRate    float64
	AverageResponseTime time.Duration
	PeakThroughput      float64
	UptimePercentage    float64
	DataConsistency     float64
}

// TrafficController manages traffic routing during migration
type TrafficController struct {
	config              *TrafficControllerConfig
	currentPercentage   float64
	metrics             *TrafficMetrics
	routingRules        []RoutingRule
}

// TrafficControllerConfig configures traffic controller
type TrafficControllerConfig struct {
	InitialPercentage float64
	MaxPercentage     float64
	StepSize          float64
	GradualShift      bool
	ShiftDuration     time.Duration
}

// TrafficMetrics tracks traffic routing metrics
type TrafficMetrics struct {
	TotalRequests      int64
	NewSystemRequests  int64
	OldSystemRequests  int64
	ErrorCount         int64
	AverageResponseTime time.Duration
	RequestsPerSecond  float64
	LastUpdated        time.Time
}

// RoutingRule defines traffic routing rules
type RoutingRule struct {
	Name        string
	Condition   string
	Percentage  float64
	Destination string
	Priority    int
	Enabled     bool
}

// MigrationHealthMonitor monitors system health during migration
type MigrationHealthMonitor struct {
	config           *HealthMonitorConfig
	healthCheckers   []HealthChecker
	overallScore     float64
	lastCheck        time.Time
}

// HealthMonitorConfig configures health monitoring
type HealthMonitorConfig struct {
	CheckInterval     time.Duration
	FailureThreshold  int
	RecoveryThreshold int
	CriticalChecks    []string
}

// HealthChecker defines health check interface
type HealthChecker interface {
	CheckHealth(ctx context.Context) HealthCheckResult
	GetName() string
	IsCritical() bool
}

// HealthCheckResult represents health check result
type HealthCheckResult struct {
	Name      string
	Status    string
	Message   string
	Score     float64
	Timestamp time.Time
	Duration  time.Duration
	Critical  bool
	Details   map[string]interface{}
}

// RollbackManager manages rollback operations
type RollbackManager struct {
	config         *RollbackConfig
	backupManager  *BackupManager
	stateManager   *StateManager
	rollbackSteps  []RollbackStep
}

// RollbackConfig configures rollback operations
type RollbackConfig struct {
	Enabled        bool
	Timeout        time.Duration
	MaxAttempts    int
	BackupStrategy string
	VerifyRollback bool
}

// RollbackStep defines a rollback step
type RollbackStep struct {
	Name        string
	Description string
	Execute     func(ctx context.Context) error
	Verify      func(ctx context.Context) error
	Priority    int
	Critical    bool
}

// BackupManager manages system backups
type BackupManager struct {
	backupStorage  string
	backupRetention time.Duration
	encryptionKey  string
	compressionEnabled bool
}

// StateManager manages system state
type StateManager struct {
	currentState   *SystemState
	previousState  *SystemState
	stateHistory   []SystemState
}

// SystemState represents system state
type SystemState struct {
	Timestamp       time.Time
	Version         string
	Configuration   map[string]interface{}
	DatabaseSchema  string
	CacheState      map[string]interface{}
	ServiceStates   map[string]ServiceState
}

// ServiceState represents individual service state
type ServiceState struct {
	Name       string
	Version    string
	Status     string
	Config     map[string]interface{}
	Metrics    map[string]float64
	Health     string
}

// MigrationValidator validates migration steps
type MigrationValidator struct {
	config          *ValidationConfig
	validators      []Validator
	criticalChecks  []string
}

// ValidationConfig configures migration validation
type ValidationConfig struct {
	Enabled           bool
	Timeout           time.Duration
	CriticalChecks    []string
	PerformanceChecks []string
	DataChecks        []string
}

// Validator defines validation interface
type Validator interface {
	Validate(ctx context.Context, phase MigrationPhase) ValidationResult
	GetName() string
	IsCritical() bool
}

// ValidationResult represents validation result
type ValidationResult struct {
	Name      string
	Status    string
	Message   string
	Passed    bool
	Critical  bool
	Timestamp time.Time
	Duration  time.Duration
	Details   map[string]interface{}
}

// RollbackTrigger defines rollback trigger conditions
type RollbackTrigger struct {
	Name        string
	Condition   func() bool
	Severity    string
	Description string
	Enabled     bool
}

// RollbackCondition defines conditions for rollback
type RollbackCondition struct {
	Name      string
	Metric    string
	Operator  string
	Threshold float64
	Duration  time.Duration
}

// SafetyCheck defines safety check interface
type SafetyCheck struct {
	Name        string
	Check       func() bool
	Description string
	Critical    bool
}

// Migration event types
type MigrationEvent struct {
	Timestamp   time.Time
	Type        string
	Phase       MigrationPhase
	Message     string
	Severity    string
	Component   string
	Details     map[string]interface{}
}

// Migration metrics aggregation
type MigrationMetricsAggregator struct {
	startTime       time.Time
	phaseMetrics    map[MigrationPhase]*PhaseMetrics
	overallMetrics  *OverallMigrationMetrics
	eventHistory    []MigrationEvent
}

// Database migration types
type DatabaseMigrationStep struct {
	Name        string
	Version     string
	UpScript    string
	DownScript  string
	Checksum    string
	Applied     bool
	AppliedAt   *time.Time
}

// Cache migration types
type CacheMigrationStep struct {
	Name         string
	KeyPattern   string
	MigrateFunc  func(ctx context.Context, key string, value interface{}) error
	VerifyFunc   func(ctx context.Context, key string) error
	BatchSize    int
	Parallel     bool
}

// Service migration types
type ServiceMigrationStep struct {
	ServiceName    string
	OldVersion     string
	NewVersion     string
	ConfigChanges  map[string]interface{}
	HealthCheck    func(ctx context.Context) error
	RollbackFunc   func(ctx context.Context) error
}

// Load balancer integration types
type LoadBalancerConfig struct {
	Name           string
	Algorithm      string
	HealthCheck    string
	Backends       []Backend
	TrafficSplit   map[string]float64
}

// Backend represents a service backend
type Backend struct {
	Name       string
	Address    string
	Port       int
	Weight     int
	Health     string
	Version    string
	Metadata   map[string]string
}

// Monitoring integration types
type MigrationMonitoringConfig struct {
	MetricsEndpoint   string
	AlertingEndpoint  string
	DashboardURL      string
	RetentionPeriod   time.Duration
	SamplingRate      float64
}

// Alert configuration for migration
type MigrationAlert struct {
	Name        string
	Condition   string
	Threshold   float64
	Duration    time.Duration
	Severity    string
	Recipients  []string
	Enabled     bool
}

// Canary deployment types
type CanaryDeployment struct {
	Name            string
	TrafficPercent  float64
	Duration        time.Duration
	SuccessCriteria []SuccessCriterion
	FailureCriteria []FailureCriterion
}

// SuccessCriterion defines success criteria for canary
type SuccessCriterion struct {
	Metric    string
	Operator  string
	Value     float64
	Duration  time.Duration
}

// FailureCriterion defines failure criteria for canary
type FailureCriterion struct {
	Metric    string
	Operator  string
	Value     float64
	Duration  time.Duration
	Action    string
}

// Blue-Green deployment types
type BlueGreenDeployment struct {
	BlueEnvironment  Environment
	GreenEnvironment Environment
	ActiveEnvironment string
	SwitchStrategy   string
	RollbackTimeout  time.Duration
}

// Environment represents deployment environment
type Environment struct {
	Name        string
	Version     string
	Endpoints   []string
	Health      string
	Capacity    int
	LoadFactor  float64
}

// Feature flag integration
type FeatureFlag struct {
	Name        string
	Enabled     bool
	Percentage  float64
	Conditions  []FlagCondition
	Metadata    map[string]interface{}
}

// FlagCondition defines feature flag conditions
type FlagCondition struct {
	Type     string
	Operator string
	Value    interface{}
}

// Migration testing types
type MigrationTest struct {
	Name        string
	Type        string
	Phase       MigrationPhase
	TestFunc    func(ctx context.Context) error
	Timeout     time.Duration
	Critical    bool
	Retry       int
}

// Performance testing during migration
type PerformanceTest struct {
	Name            string
	Duration        time.Duration
	ConcurrentUsers int
	RequestsPerSec  float64
	Endpoints       []string
	Assertions      []PerformanceAssertion
}

// PerformanceAssertion defines performance assertions
type PerformanceAssertion struct {
	Metric    string
	Operator  string
	Value     float64
	Tolerance float64
}

// Data consistency checking
type DataConsistencyCheck struct {
	Name         string
	SourceQuery  string
	TargetQuery  string
	CompareFunc  func(source, target interface{}) bool
	Tolerance    float64
	Critical     bool
}

// Migration reporting
type MigrationReport struct {
	MigrationID     string
	StartTime       time.Time
	EndTime         *time.Time
	Duration        time.Duration
	Status          MigrationStatus
	Phases          []PhaseReport
	Metrics         *OverallMigrationMetrics
	Issues          []MigrationIssue
	Recommendations []string
}

// PhaseReport provides detailed phase reporting
type PhaseReport struct {
	Phase       MigrationPhase
	StartTime   time.Time
	EndTime     *time.Time
	Duration    time.Duration
	Status      string
	Metrics     *PhaseMetrics
	HealthChecks []HealthCheckResult
	Validations []ValidationResult
	Issues      []MigrationIssue
}

// Migration configuration templates
type MigrationTemplate struct {
	Name        string
	Description string
	Phases      []TrafficPhase
	Thresholds  *RollbackThresholds
	Validators  []string
	Monitors    []string
}

// Common migration templates
var (
	ConservativeMigrationTemplate = &MigrationTemplate{
		Name:        "conservative",
		Description: "Conservative migration with extensive validation",
		Phases: []TrafficPhase{
			{Name: "canary", TrafficPercentage: 5.0, Duration: 30 * time.Minute},
			{Name: "small", TrafficPercentage: 25.0, Duration: 45 * time.Minute},
			{Name: "half", TrafficPercentage: 50.0, Duration: 60 * time.Minute},
			{Name: "full", TrafficPercentage: 100.0, Duration: 30 * time.Minute},
		},
	}
	
	AggressiveMigrationTemplate = &MigrationTemplate{
		Name:        "aggressive",
		Description: "Fast migration with minimal validation",
		Phases: []TrafficPhase{
			{Name: "small", TrafficPercentage: 10.0, Duration: 10 * time.Minute},
			{Name: "half", TrafficPercentage: 50.0, Duration: 15 * time.Minute},
			{Name: "full", TrafficPercentage: 100.0, Duration: 10 * time.Minute},
		},
	}
	
	StandardMigrationTemplate = &MigrationTemplate{
		Name:        "standard",
		Description: "Balanced migration approach",
		Phases: []TrafficPhase{
			{Name: "canary", TrafficPercentage: 10.0, Duration: 15 * time.Minute},
			{Name: "half", TrafficPercentage: 50.0, Duration: 20 * time.Minute},
			{Name: "full", TrafficPercentage: 100.0, Duration: 15 * time.Minute},
		},
	}
)

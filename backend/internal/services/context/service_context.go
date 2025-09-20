package context

import (
	"context"
	"encoding/json"
	"fmt"
	"selly-backend/pkg/types"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// ServiceContext represents typed context structures replacing map-based context passing
// This implements Phase 2 Week 4 of the system optimization plan
type ServiceContext struct {
	// Core identification
	RequestID     string    `json:"request_id"`
	CorrelationID string    `json:"correlation_id"`
	TraceID       string    `json:"trace_id"`
	SpanID        string    `json:"span_id"`
	Timestamp     time.Time `json:"timestamp"`

	// User and session context
	UserID    string `json:"user_id"`
	SessionID string `json:"session_id"`

	// Service routing
	ServiceType   types.ServiceType `json:"service_type"`
	SourceService string            `json:"source_service"`
	TargetService string            `json:"target_service"`

	// Processing context
	ProcessingPriority string                 `json:"processing_priority"`
	Timeout            time.Duration          `json:"timeout"`
	EnableCaching      bool                   `json:"enable_caching"`
	EnableFallback     bool                   `json:"enable_fallback"`
	EnableMonitoring   bool                   `json:"enable_monitoring"`

	// Business context
	BusinessContext *BusinessContext `json:"business_context,omitempty"`
	UserContext     *UserContext     `json:"user_context,omitempty"`
	RequestContext  *RequestContext  `json:"request_context,omitempty"`

	// Technical context
	TechnicalContext *TechnicalContext `json:"technical_context,omitempty"`

	// Extension point for custom data
	Extensions map[string]interface{} `json:"extensions,omitempty"`
}

// BusinessContext contains business-specific context information
type BusinessContext struct {
	Department         string                 `json:"department"`
	ServiceCategory    string                 `json:"service_category"`
	ProcessingStage    string                 `json:"processing_stage"`
	RequiredDocuments  []string               `json:"required_documents"`
	EstimatedDuration  time.Duration          `json:"estimated_duration"`
	BusinessRules      map[string]interface{} `json:"business_rules,omitempty"`
}

// UserContext contains user-specific context information
type UserContext struct {
	UserType           string                 `json:"user_type"`
	PreferredLanguage  string                 `json:"preferred_language"`
	AccessLevel        string                 `json:"access_level"`
	Region             string                 `json:"region"`
	CulturalContext    string                 `json:"cultural_context"`
	PersonalizationData map[string]interface{} `json:"personalization_data,omitempty"`
}

// RequestContext contains request-specific context information
type RequestContext struct {
	Channel           string                 `json:"channel"`
	ClientIP          string                 `json:"client_ip"`
	UserAgent         string                 `json:"user_agent"`
	RequestMethod     string                 `json:"request_method"`
	RequestPath       string                 `json:"request_path"`
	ContentType       string                 `json:"content_type"`
	AcceptLanguage    string                 `json:"accept_language"`
	Headers           map[string]string      `json:"headers,omitempty"`
	QueryParameters   map[string]string      `json:"query_parameters,omitempty"`
}

// TechnicalContext contains technical processing context
type TechnicalContext struct {
	CacheStrategy      string                 `json:"cache_strategy"`
	RetryPolicy        *RetryPolicy           `json:"retry_policy,omitempty"`
	CircuitBreaker     *CircuitBreakerConfig  `json:"circuit_breaker,omitempty"`
	PerformanceTargets *PerformanceTargets    `json:"performance_targets,omitempty"`
	ResourceLimits     *ResourceLimits        `json:"resource_limits,omitempty"`
	FeatureFlags       map[string]bool        `json:"feature_flags,omitempty"`
}

// RetryPolicy defines retry behavior for service calls
type RetryPolicy struct {
	MaxRetries    int           `json:"max_retries"`
	BackoffDelay  time.Duration `json:"backoff_delay"`
	MaxBackoff    time.Duration `json:"max_backoff"`
	RetryableErrors []string     `json:"retryable_errors"`
}

// CircuitBreakerConfig defines circuit breaker behavior
type CircuitBreakerConfig struct {
	Enabled           bool          `json:"enabled"`
	FailureThreshold  int           `json:"failure_threshold"`
	RecoveryTimeout   time.Duration `json:"recovery_timeout"`
	HalfOpenRequests  int           `json:"half_open_requests"`
}

// PerformanceTargets defines performance expectations
type PerformanceTargets struct {
	MaxResponseTime   time.Duration `json:"max_response_time"`
	TargetThroughput  int           `json:"target_throughput"`
	MaxMemoryUsage    int64         `json:"max_memory_usage"`
	MaxCPUUsage       float64       `json:"max_cpu_usage"`
}

// ResourceLimits defines resource constraints
type ResourceLimits struct {
	MaxConcurrentRequests int           `json:"max_concurrent_requests"`
	MaxRequestSize        int64         `json:"max_request_size"`
	MaxResponseSize       int64         `json:"max_response_size"`
	MaxProcessingTime     time.Duration `json:"max_processing_time"`
}

// ContextValidator provides validation for service contexts
type ContextValidator struct {
	validationRules map[string]ValidationRule
	logger          *logrus.Logger
}

// ValidationRule defines a validation rule for context fields
type ValidationRule struct {
	Required     bool                     `json:"required"`
	Validator    func(interface{}) error  `json:"-"`
	ErrorMessage string                   `json:"error_message"`
}

// ContextLogger provides structured logging for service contexts
type ContextLogger struct {
	logger *logrus.Logger
}

// NewServiceContext creates a new typed service context
func NewServiceContext() *ServiceContext {
	return &ServiceContext{
		RequestID:     generateRequestID(),
		CorrelationID: generateCorrelationID(),
		TraceID:       generateTraceID(),
		SpanID:        generateSpanID(),
		Timestamp:     time.Now(),
		EnableCaching: true,
		EnableFallback: true,
		EnableMonitoring: true,
		Extensions:    make(map[string]interface{}),
	}
}

// NewServiceContextWithDefaults creates a service context with common defaults
func NewServiceContextWithDefaults(userID, sessionID string, serviceType types.ServiceType) *ServiceContext {
	ctx := NewServiceContext()
	ctx.UserID = userID
	ctx.SessionID = sessionID
	ctx.ServiceType = serviceType
	ctx.ProcessingPriority = "normal"
	ctx.Timeout = 30 * time.Second
	
	// Set default business context
	ctx.BusinessContext = &BusinessContext{
		ServiceCategory: serviceType.String(),
		ProcessingStage: "initial",
	}
	
	// Set default user context
	ctx.UserContext = &UserContext{
		UserType:          "citizen",
		PreferredLanguage: "id",
		AccessLevel:       "standard",
		Region:            "default",
	}
	
	// Set default technical context
	ctx.TechnicalContext = &TechnicalContext{
		CacheStrategy: "aggressive",
		RetryPolicy: &RetryPolicy{
			MaxRetries:   3,
			BackoffDelay: 1 * time.Second,
			MaxBackoff:   10 * time.Second,
		},
		CircuitBreaker: &CircuitBreakerConfig{
			Enabled:          true,
			FailureThreshold: 5,
			RecoveryTimeout:  30 * time.Second,
			HalfOpenRequests: 3,
		},
		PerformanceTargets: &PerformanceTargets{
			MaxResponseTime:  500 * time.Millisecond,
			TargetThroughput: 100,
			MaxMemoryUsage:   100 * 1024 * 1024, // 100MB
			MaxCPUUsage:      0.8,                // 80%
		},
	}
	
	return ctx
}

// FromStandardContext creates a ServiceContext from Go's standard context
func FromStandardContext(ctx context.Context) *ServiceContext {
	serviceCtx := NewServiceContext()
	
	// Extract common values from context if they exist
	if requestID := ctx.Value("request_id"); requestID != nil {
		if id, ok := requestID.(string); ok {
			serviceCtx.RequestID = id
		}
	}
	
	if correlationID := ctx.Value("correlation_id"); correlationID != nil {
		if id, ok := correlationID.(string); ok {
			serviceCtx.CorrelationID = id
		}
	}
	
	if userID := ctx.Value("user_id"); userID != nil {
		if id, ok := userID.(string); ok {
			serviceCtx.UserID = id
		}
	}
	
	if sessionID := ctx.Value("session_id"); sessionID != nil {
		if id, ok := sessionID.(string); ok {
			serviceCtx.SessionID = id
		}
	}
	
	return serviceCtx
}

// ToStandardContext converts ServiceContext to Go's standard context
func (sc *ServiceContext) ToStandardContext(parent context.Context) context.Context {
	if parent == nil {
		parent = context.Background()
	}
	
	ctx := parent
	ctx = context.WithValue(ctx, "request_id", sc.RequestID)
	ctx = context.WithValue(ctx, "correlation_id", sc.CorrelationID)
	ctx = context.WithValue(ctx, "trace_id", sc.TraceID)
	ctx = context.WithValue(ctx, "span_id", sc.SpanID)
	ctx = context.WithValue(ctx, "user_id", sc.UserID)
	ctx = context.WithValue(ctx, "session_id", sc.SessionID)
	ctx = context.WithValue(ctx, "service_type", sc.ServiceType)
	ctx = context.WithValue(ctx, "service_context", sc)
	
	return ctx
}

// Validate validates the service context using configured rules
func (sc *ServiceContext) Validate() error {
	validator := NewContextValidator()
	return validator.Validate(sc)
}

// Clone creates a deep copy of the service context
func (sc *ServiceContext) Clone() *ServiceContext {
	// Serialize and deserialize for deep copy
	data, err := json.Marshal(sc)
	if err != nil {
		// Fallback to shallow copy
		clone := *sc
		return &clone
	}
	
	var clone ServiceContext
	if err := json.Unmarshal(data, &clone); err != nil {
		// Fallback to shallow copy
		clone := *sc
		return &clone
	}
	
	return &clone
}

// WithTimeout creates a new context with the specified timeout
func (sc *ServiceContext) WithTimeout(timeout time.Duration) *ServiceContext {
	clone := sc.Clone()
	clone.Timeout = timeout
	return clone
}

// WithServiceRoute sets the source and target services
func (sc *ServiceContext) WithServiceRoute(source, target string) *ServiceContext {
	clone := sc.Clone()
	clone.SourceService = source
	clone.TargetService = target
	return clone
}

// WithUserContext sets the user context
func (sc *ServiceContext) WithUserContext(userCtx *UserContext) *ServiceContext {
	clone := sc.Clone()
	clone.UserContext = userCtx
	return clone
}

// WithBusinessContext sets the business context
func (sc *ServiceContext) WithBusinessContext(bizCtx *BusinessContext) *ServiceContext {
	clone := sc.Clone()
	clone.BusinessContext = bizCtx
	return clone
}

// GetExtension retrieves an extension value
func (sc *ServiceContext) GetExtension(key string) (interface{}, bool) {
	if sc.Extensions == nil {
		return nil, false
	}
	value, exists := sc.Extensions[key]
	return value, exists
}

// SetExtension sets an extension value
func (sc *ServiceContext) SetExtension(key string, value interface{}) {
	if sc.Extensions == nil {
		sc.Extensions = make(map[string]interface{})
	}
	sc.Extensions[key] = value
}

// NewContextValidator creates a new context validator
func NewContextValidator() *ContextValidator {
	return &ContextValidator{
		validationRules: getDefaultValidationRules(),
		logger:          logrus.New(),
	}
}

// Validate validates a service context
func (cv *ContextValidator) Validate(ctx *ServiceContext) error {
	if ctx == nil {
		return fmt.Errorf("service context cannot be nil")
	}
	
	// Validate required fields
	if ctx.RequestID == "" {
		return fmt.Errorf("request_id is required")
	}
	
	if ctx.CorrelationID == "" {
		return fmt.Errorf("correlation_id is required")
	}
	
	if ctx.Timestamp.IsZero() {
		return fmt.Errorf("timestamp is required")
	}
	
	// Validate timeout
	if ctx.Timeout < 0 {
		return fmt.Errorf("timeout cannot be negative")
	}
	
	// Validate service type if provided
	if ctx.ServiceType != "" {
		if !isValidServiceType(ctx.ServiceType) {
			return fmt.Errorf("invalid service type: %s", ctx.ServiceType)
		}
	}
	
	return nil
}

// NewContextLogger creates a new context logger
func NewContextLogger() *ContextLogger {
	return &ContextLogger{
		logger: logrus.New(),
	}
}

// LogEntry logs a service context entry
func (cl *ContextLogger) LogEntry(ctx *ServiceContext, message string, level logrus.Level) {
	entry := cl.logger.WithFields(logrus.Fields{
		"request_id":     ctx.RequestID,
		"correlation_id": ctx.CorrelationID,
		"trace_id":       ctx.TraceID,
		"span_id":        ctx.SpanID,
		"user_id":        ctx.UserID,
		"session_id":     ctx.SessionID,
		"service_type":   ctx.ServiceType,
		"source_service": ctx.SourceService,
		"target_service": ctx.TargetService,
		"timestamp":      ctx.Timestamp,
	})
	
	switch level {
	case logrus.DebugLevel:
		entry.Debug(message)
	case logrus.InfoLevel:
		entry.Info(message)
	case logrus.WarnLevel:
		entry.Warn(message)
	case logrus.ErrorLevel:
		entry.Error(message)
	default:
		entry.Info(message)
	}
}

// LogServiceBoundary logs when context crosses service boundaries
func (cl *ContextLogger) LogServiceBoundary(ctx *ServiceContext, boundary string) {
	cl.LogEntry(ctx, fmt.Sprintf("Context crossing service boundary: %s", boundary), logrus.InfoLevel)
}

// LogPerformanceMetrics logs performance metrics for the context
func (cl *ContextLogger) LogPerformanceMetrics(ctx *ServiceContext, duration time.Duration, success bool) {
	entry := cl.logger.WithFields(logrus.Fields{
		"request_id":     ctx.RequestID,
		"correlation_id": ctx.CorrelationID,
		"duration_ms":    duration.Milliseconds(),
		"success":        success,
		"service_type":   ctx.ServiceType,
		"target_service": ctx.TargetService,
	})
	
	if success {
		entry.Info("Service request completed")
	} else {
		entry.Error("Service request failed")
	}
}

// Helper functions for ID generation
func generateRequestID() string {
	return fmt.Sprintf("req_%s", uuid.New().String()[:8])
}

func generateCorrelationID() string {
	return fmt.Sprintf("corr_%s", uuid.New().String()[:8])
}

func generateTraceID() string {
	return fmt.Sprintf("trace_%s", uuid.New().String()[:16])
}

func generateSpanID() string {
	return fmt.Sprintf("span_%s", uuid.New().String()[:8])
}

// getDefaultValidationRules returns default validation rules
func getDefaultValidationRules() map[string]ValidationRule {
	return map[string]ValidationRule{
		"request_id": {
			Required:     true,
			ErrorMessage: "request_id is required",
		},
		"correlation_id": {
			Required:     true,
			ErrorMessage: "correlation_id is required",
		},
		"timestamp": {
			Required:     true,
			ErrorMessage: "timestamp is required",
		},
	}
}

// isValidServiceType validates service type
func isValidServiceType(serviceType types.ServiceType) bool {
	// This would validate against the enum values
	// For now, just check it's not empty
	return serviceType != ""
}

package context

import (
	"fmt"
	"selly-backend/pkg/types"
	"time"
)

// ContextAware interface defines services that can work with typed contexts
type ContextAware interface {
	ProcessWithContext(ctx *ServiceContext, request interface{}) (interface{}, error)
	ValidateContext(ctx *ServiceContext) error
	GetContextRequirements() ContextRequirements
}

// ContextRequirements defines what context fields a service requires
type ContextRequirements struct {
	RequiredFields    []string                   `json:"required_fields"`
	OptionalFields    []string                   `json:"optional_fields"`
	BusinessContext   *BusinessContextRequirement `json:"business_context,omitempty"`
	UserContext       *UserContextRequirement     `json:"user_context,omitempty"`
	TechnicalContext  *TechnicalContextRequirement `json:"technical_context,omitempty"`
	CustomValidations []CustomValidation          `json:"custom_validations,omitempty"`
}

// BusinessContextRequirement defines business context requirements
type BusinessContextRequirement struct {
	RequiredDepartment    string   `json:"required_department,omitempty"`
	RequiredCategory      string   `json:"required_category,omitempty"`
	RequiredDocuments     []string `json:"required_documents,omitempty"`
	MinEstimatedDuration  time.Duration `json:"min_estimated_duration,omitempty"`
	MaxEstimatedDuration  time.Duration `json:"max_estimated_duration,omitempty"`
}

// UserContextRequirement defines user context requirements
type UserContextRequirement struct {
	AllowedUserTypes     []string `json:"allowed_user_types,omitempty"`
	RequiredAccessLevel  string   `json:"required_access_level,omitempty"`
	AllowedRegions       []string `json:"allowed_regions,omitempty"`
	RequiredLanguages    []string `json:"required_languages,omitempty"`
}

// TechnicalContextRequirement defines technical context requirements
type TechnicalContextRequirement struct {
	RequiredCacheStrategy    string        `json:"required_cache_strategy,omitempty"`
	MaxResponseTime          time.Duration `json:"max_response_time,omitempty"`
	RequireCircuitBreaker    bool          `json:"require_circuit_breaker,omitempty"`
	RequireRetryPolicy       bool          `json:"require_retry_policy,omitempty"`
	RequiredFeatureFlags     []string      `json:"required_feature_flags,omitempty"`
	MinMemoryLimit           int64         `json:"min_memory_limit,omitempty"`
	MaxConcurrentRequests    int           `json:"max_concurrent_requests,omitempty"`
}

// CustomValidation defines custom validation logic
type CustomValidation struct {
	Name        string                               `json:"name"`
	Description string                               `json:"description"`
	Validator   func(*ServiceContext) error         `json:"-"`
}

// ContextManager manages context lifecycle across service boundaries
type ContextManager struct {
	validator *ContextValidator
	logger    *ContextLogger
	services  map[string]ContextAware
}

// ServiceBoundaryTracker tracks context as it crosses service boundaries
type ServiceBoundaryTracker struct {
	boundaries []ServiceBoundary
	logger     *ContextLogger
}

// ServiceBoundary represents a context crossing between services
type ServiceBoundary struct {
	FromService   string                 `json:"from_service"`
	ToService     string                 `json:"to_service"`
	Timestamp     time.Time              `json:"timestamp"`
	Context       *ServiceContext        `json:"context"`
	Duration      time.Duration          `json:"duration,omitempty"`
	Success       bool                   `json:"success"`
	ErrorMessage  string                 `json:"error_message,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// ContextMetrics tracks context usage and performance
type ContextMetrics struct {
	TotalRequests        int64                    `json:"total_requests"`
	SuccessfulRequests   int64                    `json:"successful_requests"`
	FailedRequests       int64                    `json:"failed_requests"`
	AverageResponseTime  time.Duration            `json:"average_response_time"`
	ServiceMetrics       map[string]*ServiceMetric `json:"service_metrics"`
	BoundaryMetrics      map[string]*BoundaryMetric `json:"boundary_metrics"`
}

// ServiceMetric tracks metrics for individual services
type ServiceMetric struct {
	ServiceName         string        `json:"service_name"`
	RequestCount        int64         `json:"request_count"`
	SuccessCount        int64         `json:"success_count"`
	FailureCount        int64         `json:"failure_count"`
	AverageResponseTime time.Duration `json:"average_response_time"`
	MaxResponseTime     time.Duration `json:"max_response_time"`
	MinResponseTime     time.Duration `json:"min_response_time"`
}

// BoundaryMetric tracks metrics for service boundary crossings
type BoundaryMetric struct {
	FromService         string        `json:"from_service"`
	ToService           string        `json:"to_service"`
	CrossingCount       int64         `json:"crossing_count"`
	SuccessfulCrossings int64         `json:"successful_crossings"`
	FailedCrossings     int64         `json:"failed_crossings"`
	AverageLatency      time.Duration `json:"average_latency"`
}

// NewContextManager creates a new context manager
func NewContextManager() *ContextManager {
	return &ContextManager{
		validator: NewContextValidator(),
		logger:    NewContextLogger(),
		services:  make(map[string]ContextAware),
	}
}

// RegisterService registers a context-aware service
func (cm *ContextManager) RegisterService(name string, service ContextAware) error {
	if service == nil {
		return fmt.Errorf("service cannot be nil")
	}
	
	// Validate service requirements
	requirements := service.GetContextRequirements()
	if err := cm.validateRequirements(requirements); err != nil {
		return fmt.Errorf("invalid service requirements: %w", err)
	}
	
	cm.services[name] = service
	cm.logger.logger.WithField("service_name", name).Info("Service registered with context manager")
	
	return nil
}

// ProcessRequest processes a request through a registered service with context validation
func (cm *ContextManager) ProcessRequest(serviceName string, ctx *ServiceContext, request interface{}) (interface{}, error) {
	startTime := time.Now()
	
	// Log service boundary entry
	cm.logger.LogServiceBoundary(ctx, fmt.Sprintf("entering_%s", serviceName))
	
	// Get service
	service, exists := cm.services[serviceName]
	if !exists {
		err := fmt.Errorf("service not found: %s", serviceName)
		cm.logger.LogPerformanceMetrics(ctx, time.Since(startTime), false)
		return nil, err
	}
	
	// Validate context against service requirements
	if err := service.ValidateContext(ctx); err != nil {
		cm.logger.LogPerformanceMetrics(ctx, time.Since(startTime), false)
		return nil, fmt.Errorf("context validation failed for service %s: %w", serviceName, err)
	}
	
	// Update context with target service
	ctx = ctx.WithServiceRoute(ctx.SourceService, serviceName)
	
	// Process request
	response, err := service.ProcessWithContext(ctx, request)
	
	duration := time.Since(startTime)
	success := err == nil
	
	// Log service boundary exit
	cm.logger.LogServiceBoundary(ctx, fmt.Sprintf("exiting_%s", serviceName))
	cm.logger.LogPerformanceMetrics(ctx, duration, success)
	
	return response, err
}

// ValidateContextForService validates context against specific service requirements
func (cm *ContextManager) ValidateContextForService(serviceName string, ctx *ServiceContext) error {
	service, exists := cm.services[serviceName]
	if !exists {
		return fmt.Errorf("service not found: %s", serviceName)
	}
	
	return service.ValidateContext(ctx)
}

// GetServiceRequirements returns context requirements for a service
func (cm *ContextManager) GetServiceRequirements(serviceName string) (ContextRequirements, error) {
	service, exists := cm.services[serviceName]
	if !exists {
		return ContextRequirements{}, fmt.Errorf("service not found: %s", serviceName)
	}
	
	return service.GetContextRequirements(), nil
}

// NewServiceBoundaryTracker creates a new boundary tracker
func NewServiceBoundaryTracker() *ServiceBoundaryTracker {
	return &ServiceBoundaryTracker{
		boundaries: make([]ServiceBoundary, 0),
		logger:     NewContextLogger(),
	}
}

// TrackBoundary tracks a service boundary crossing
func (sbt *ServiceBoundaryTracker) TrackBoundary(ctx *ServiceContext, fromService, toService string) *ServiceBoundary {
	boundary := ServiceBoundary{
		FromService: fromService,
		ToService:   toService,
		Timestamp:   time.Now(),
		Context:     ctx.Clone(),
		Metadata:    make(map[string]interface{}),
	}
	
	sbt.boundaries = append(sbt.boundaries, boundary)
	sbt.logger.LogServiceBoundary(ctx, fmt.Sprintf("%s -> %s", fromService, toService))
	
	return &boundary
}

// CompleteBoundary marks a boundary crossing as complete
func (sbt *ServiceBoundaryTracker) CompleteBoundary(boundary *ServiceBoundary, success bool, errorMessage string) {
	boundary.Duration = time.Since(boundary.Timestamp)
	boundary.Success = success
	boundary.ErrorMessage = errorMessage
	
	sbt.logger.LogPerformanceMetrics(boundary.Context, boundary.Duration, success)
}

// GetBoundaryHistory returns the boundary crossing history
func (sbt *ServiceBoundaryTracker) GetBoundaryHistory() []ServiceBoundary {
	return sbt.boundaries
}

// GetCorrelationTrace returns all boundaries for a specific correlation ID
func (sbt *ServiceBoundaryTracker) GetCorrelationTrace(correlationID string) []ServiceBoundary {
	var trace []ServiceBoundary
	for _, boundary := range sbt.boundaries {
		if boundary.Context.CorrelationID == correlationID {
			trace = append(trace, boundary)
		}
	}
	return trace
}

// Helper functions for context requirements validation

func (cm *ContextManager) validateRequirements(req ContextRequirements) error {
	// Validate required fields
	for _, field := range req.RequiredFields {
		if field == "" {
			return fmt.Errorf("required field cannot be empty")
		}
	}
	
	// Validate business context requirements
	if req.BusinessContext != nil {
		if req.BusinessContext.MinEstimatedDuration > req.BusinessContext.MaxEstimatedDuration {
			return fmt.Errorf("min estimated duration cannot be greater than max")
		}
	}
	
	// Validate technical context requirements
	if req.TechnicalContext != nil {
		if req.TechnicalContext.MaxResponseTime < 0 {
			return fmt.Errorf("max response time cannot be negative")
		}
		if req.TechnicalContext.MinMemoryLimit < 0 {
			return fmt.Errorf("min memory limit cannot be negative")
		}
		if req.TechnicalContext.MaxConcurrentRequests < 0 {
			return fmt.Errorf("max concurrent requests cannot be negative")
		}
	}
	
	return nil
}

// CreatePersonaServiceContext creates a specialized context for persona services
func CreatePersonaServiceContext(userID, sessionID string) *ServiceContext {
	ctx := NewServiceContextWithDefaults(userID, sessionID, types.ServiceTypeGeneral)
	
	// Set persona-specific business context
	ctx.BusinessContext.Department = "digital_services"
	ctx.BusinessContext.ServiceCategory = "persona_processing"
	ctx.BusinessContext.ProcessingStage = "analysis"
	ctx.BusinessContext.EstimatedDuration = 5 * time.Second
	
	// Set persona-specific technical context
	ctx.TechnicalContext.CacheStrategy = "persona_cache"
	ctx.TechnicalContext.PerformanceTargets.MaxResponseTime = 2 * time.Second
	ctx.TechnicalContext.PerformanceTargets.TargetThroughput = 50
	
	return ctx
}

// CreateRAGServiceContext creates a specialized context for RAG services
func CreateRAGServiceContext(userID, sessionID string) *ServiceContext {
	ctx := NewServiceContextWithDefaults(userID, sessionID, types.ServiceTypeDocumentInquiry)
	
	// Set RAG-specific business context
	ctx.BusinessContext.Department = "information_services"
	ctx.BusinessContext.ServiceCategory = "document_retrieval"
	ctx.BusinessContext.ProcessingStage = "retrieval"
	ctx.BusinessContext.EstimatedDuration = 3 * time.Second
	
	// Set RAG-specific technical context
	ctx.TechnicalContext.CacheStrategy = "vector_cache"
	ctx.TechnicalContext.PerformanceTargets.MaxResponseTime = 1 * time.Second
	ctx.TechnicalContext.PerformanceTargets.TargetThroughput = 100
	
	return ctx
}

// CreateChatServiceContext creates a specialized context for chat services
func CreateChatServiceContext(userID, sessionID string) *ServiceContext {
	ctx := NewServiceContextWithDefaults(userID, sessionID, types.ServiceTypeGeneral)
	
	// Set chat-specific business context
	ctx.BusinessContext.Department = "customer_service"
	ctx.BusinessContext.ServiceCategory = "conversational_ai"
	ctx.BusinessContext.ProcessingStage = "conversation"
	ctx.BusinessContext.EstimatedDuration = 2 * time.Second
	
	// Set chat-specific technical context
	ctx.TechnicalContext.CacheStrategy = "conversation_cache"
	ctx.TechnicalContext.PerformanceTargets.MaxResponseTime = 500 * time.Millisecond
	ctx.TechnicalContext.PerformanceTargets.TargetThroughput = 200
	
	return ctx
}

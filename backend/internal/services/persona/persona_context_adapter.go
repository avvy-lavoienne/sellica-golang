package persona

import (
	"context"
	"fmt"
	servicecontext "selly-backend/internal/services/context"
	"time"
)

// PersonaContextAdapter adapts the unified persona service to use typed contexts
type PersonaContextAdapter struct {
	unifiedService *UnifiedPersonaService
}

// NewPersonaContextAdapter creates a new context adapter for persona service
func NewPersonaContextAdapter(unifiedService *UnifiedPersonaService) *PersonaContextAdapter {
	return &PersonaContextAdapter{
		unifiedService: unifiedService,
	}
}

// ProcessWithContext implements ContextAware interface for persona processing
func (pca *PersonaContextAdapter) ProcessWithContext(ctx *servicecontext.ServiceContext, request interface{}) (interface{}, error) {
	// Convert generic request to UnifiedPersonaRequest
	var personaRequest *UnifiedPersonaRequest
	
	switch req := request.(type) {
	case *UnifiedPersonaRequest:
		personaRequest = req
	case map[string]interface{}:
		// Convert map to persona request
		personaRequest = &UnifiedPersonaRequest{
			RequestID:     ctx.RequestID,
			CorrelationID: ctx.CorrelationID,
			UserID:        ctx.UserID,
			SessionID:     ctx.SessionID,
			TraceID:       ctx.TraceID,
			SpanID:        ctx.SpanID,
			ServiceType:   ctx.ServiceType,
			EnableCaching: ctx.EnableCaching,
			EnableFallback: ctx.EnableFallback,
			Timeout:       ctx.Timeout,
		}
		
		// Extract query from map
		if query, ok := req["query"].(string); ok {
			personaRequest.Query = query
		}
		
		if baseResponse, ok := req["base_response"].(string); ok {
			personaRequest.BaseResponse = baseResponse
		}
		
	default:
		// Create minimal request from context
		personaRequest = &UnifiedPersonaRequest{
			RequestID:     ctx.RequestID,
			CorrelationID: ctx.CorrelationID,
			UserID:        ctx.UserID,
			SessionID:     ctx.SessionID,
			TraceID:       ctx.TraceID,
			SpanID:        ctx.SpanID,
			ServiceType:   ctx.ServiceType,
			EnableCaching: ctx.EnableCaching,
			EnableFallback: ctx.EnableFallback,
			Timeout:       ctx.Timeout,
		}
	}
	
	// Process using the unified service
	return pca.unifiedService.ProcessPersonaRequest(context.Background(), personaRequest)
}

// ValidateContext validates context requirements for persona processing
func (pca *PersonaContextAdapter) ValidateContext(ctx *servicecontext.ServiceContext) error {
	// Basic validation
	if err := ctx.Validate(); err != nil {
		return err
	}
	
	// Persona-specific validation
	if ctx.UserID == "" {
		return fmt.Errorf("user_id is required for persona processing")
	}
	
	if ctx.SessionID == "" {
		return fmt.Errorf("session_id is required for persona processing")
	}
	
	// Validate user context if present
	if ctx.UserContext != nil {
		if ctx.UserContext.PreferredLanguage == "" {
			ctx.UserContext.PreferredLanguage = "id" // Default to Indonesian
		}
		
		if ctx.UserContext.UserType == "" {
			ctx.UserContext.UserType = "citizen" // Default to citizen
		}
	}
	
	// Validate business context if present
	if ctx.BusinessContext != nil {
		if ctx.BusinessContext.ServiceCategory == "" {
			ctx.BusinessContext.ServiceCategory = "persona_processing"
		}
	}
	
	return nil
}

// GetContextRequirements returns context requirements for persona services
func (pca *PersonaContextAdapter) GetContextRequirements() servicecontext.ContextRequirements {
	return servicecontext.ContextRequirements{
		RequiredFields: []string{
			"request_id",
			"correlation_id",
			"user_id",
			"session_id",
		},
		OptionalFields: []string{
			"service_type",
			"trace_id",
			"span_id",
			"timeout",
		},
		UserContext: &servicecontext.UserContextRequirement{
			AllowedUserTypes: []string{"citizen", "resident", "visitor", "admin"},
			RequiredLanguages: []string{"id", "en"},
			AllowedRegions: []string{"default", "jakarta", "surabaya", "bandung", "medan"},
		},
		BusinessContext: &servicecontext.BusinessContextRequirement{
			RequiredCategory: "persona_processing",
			RequiredDepartment: "digital_services",
		},
		TechnicalContext: &servicecontext.TechnicalContextRequirement{
			RequiredCacheStrategy: "persona_cache",
			MaxResponseTime: 5 * time.Second,
			RequireCircuitBreaker: true,
			RequireRetryPolicy: true,
		},
	}
}

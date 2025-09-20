package context

import (
	"selly-backend/pkg/types"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockContextAwareService implements ContextAware for testing
type MockContextAwareService struct {
	name         string
	requirements ContextRequirements
	processFunc  func(*ServiceContext, interface{}) (interface{}, error)
}

func (m *MockContextAwareService) ProcessWithContext(ctx *ServiceContext, request interface{}) (interface{}, error) {
	if m.processFunc != nil {
		return m.processFunc(ctx, request)
	}
	return "mock_response", nil
}

func (m *MockContextAwareService) ValidateContext(ctx *ServiceContext) error {
	validator := NewContextValidator()
	return validator.Validate(ctx)
}

func (m *MockContextAwareService) GetContextRequirements() ContextRequirements {
	return m.requirements
}

func TestServiceContext_Creation(t *testing.T) {
	ctx := NewServiceContext()
	
	assert.NotEmpty(t, ctx.RequestID)
	assert.NotEmpty(t, ctx.CorrelationID)
	assert.NotEmpty(t, ctx.TraceID)
	assert.NotEmpty(t, ctx.SpanID)
	assert.False(t, ctx.Timestamp.IsZero())
	assert.True(t, ctx.EnableCaching)
	assert.True(t, ctx.EnableFallback)
	assert.True(t, ctx.EnableMonitoring)
	assert.NotNil(t, ctx.Extensions)
}

func TestServiceContext_WithDefaults(t *testing.T) {
	userID := "test_user_123"
	sessionID := "session_456"
	serviceType := types.ServiceTypeAktaKelahiran
	
	ctx := NewServiceContextWithDefaults(userID, sessionID, serviceType)
	
	assert.Equal(t, userID, ctx.UserID)
	assert.Equal(t, sessionID, ctx.SessionID)
	assert.Equal(t, serviceType, ctx.ServiceType)
	assert.Equal(t, "normal", ctx.ProcessingPriority)
	assert.Equal(t, 30*time.Second, ctx.Timeout)
	
	// Validate business context
	require.NotNil(t, ctx.BusinessContext)
	assert.Equal(t, serviceType.String(), ctx.BusinessContext.ServiceCategory)
	assert.Equal(t, "initial", ctx.BusinessContext.ProcessingStage)
	
	// Validate user context
	require.NotNil(t, ctx.UserContext)
	assert.Equal(t, "citizen", ctx.UserContext.UserType)
	assert.Equal(t, "id", ctx.UserContext.PreferredLanguage)
	assert.Equal(t, "standard", ctx.UserContext.AccessLevel)
	
	// Validate technical context
	require.NotNil(t, ctx.TechnicalContext)
	assert.Equal(t, "aggressive", ctx.TechnicalContext.CacheStrategy)
	require.NotNil(t, ctx.TechnicalContext.RetryPolicy)
	assert.Equal(t, 3, ctx.TechnicalContext.RetryPolicy.MaxRetries)
}

func TestServiceContext_Validation(t *testing.T) {
	tests := []struct {
		name    string
		ctx     *ServiceContext
		wantErr bool
	}{
		{
			name:    "nil context",
			ctx:     nil,
			wantErr: true,
		},
		{
			name: "missing request ID",
			ctx: &ServiceContext{
				CorrelationID: "test_corr",
				Timestamp:     time.Now(),
			},
			wantErr: true,
		},
		{
			name: "missing correlation ID",
			ctx: &ServiceContext{
				RequestID: "test_req",
				Timestamp: time.Now(),
			},
			wantErr: true,
		},
		{
			name: "missing timestamp",
			ctx: &ServiceContext{
				RequestID:     "test_req",
				CorrelationID: "test_corr",
			},
			wantErr: true,
		},
		{
			name: "negative timeout",
			ctx: &ServiceContext{
				RequestID:     "test_req",
				CorrelationID: "test_corr",
				Timestamp:     time.Now(),
				Timeout:       -1 * time.Second,
			},
			wantErr: true,
		},
		{
			name: "valid context",
			ctx: &ServiceContext{
				RequestID:     "test_req",
				CorrelationID: "test_corr",
				Timestamp:     time.Now(),
				Timeout:       30 * time.Second,
				ServiceType:   types.ServiceTypeGeneral,
			},
			wantErr: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.ctx.Validate()
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestServiceContext_Clone(t *testing.T) {
	original := NewServiceContextWithDefaults("user123", "session456", types.ServiceTypeKTPElektronik)
	original.SetExtension("test_key", "test_value")
	
	clone := original.Clone()
	
	// Verify clone has same values
	assert.Equal(t, original.RequestID, clone.RequestID)
	assert.Equal(t, original.UserID, clone.UserID)
	assert.Equal(t, original.ServiceType, clone.ServiceType)
	
	// Verify it's a different object
	assert.NotSame(t, original, clone)
	
	// Verify extensions are copied
	value, exists := clone.GetExtension("test_key")
	assert.True(t, exists)
	assert.Equal(t, "test_value", value)
	
	// Verify modifying clone doesn't affect original
	clone.UserID = "different_user"
	assert.NotEqual(t, original.UserID, clone.UserID)
}

func TestServiceContext_WithMethods(t *testing.T) {
	original := NewServiceContext()
	
	// Test WithTimeout
	newTimeout := 60 * time.Second
	withTimeout := original.WithTimeout(newTimeout)
	assert.Equal(t, newTimeout, withTimeout.Timeout)
	assert.NotEqual(t, original.Timeout, withTimeout.Timeout) // Original unchanged
	
	// Test WithServiceRoute
	withRoute := original.WithServiceRoute("service1", "service2")
	assert.Equal(t, "service1", withRoute.SourceService)
	assert.Equal(t, "service2", withRoute.TargetService)
	assert.Empty(t, original.SourceService) // Original unchanged
	
	// Test WithUserContext
	userCtx := &UserContext{
		UserType:          "admin",
		PreferredLanguage: "en",
	}
	withUserCtx := original.WithUserContext(userCtx)
	require.NotNil(t, withUserCtx.UserContext)
	assert.Equal(t, "admin", withUserCtx.UserContext.UserType)
	assert.Nil(t, original.UserContext) // Original unchanged
}

func TestServiceContext_Extensions(t *testing.T) {
	ctx := NewServiceContext()
	
	// Test setting and getting extensions
	ctx.SetExtension("key1", "value1")
	ctx.SetExtension("key2", 42)
	ctx.SetExtension("key3", map[string]string{"nested": "value"})
	
	value1, exists1 := ctx.GetExtension("key1")
	assert.True(t, exists1)
	assert.Equal(t, "value1", value1)
	
	value2, exists2 := ctx.GetExtension("key2")
	assert.True(t, exists2)
	assert.Equal(t, 42, value2)
	
	value3, exists3 := ctx.GetExtension("key3")
	assert.True(t, exists3)
	assert.IsType(t, map[string]string{}, value3)
	
	// Test non-existent key
	_, exists4 := ctx.GetExtension("nonexistent")
	assert.False(t, exists4)
}

func TestContextManager_ServiceRegistration(t *testing.T) {
	cm := NewContextManager()
	
	mockService := &MockContextAwareService{
		name: "test_service",
		requirements: ContextRequirements{
			RequiredFields: []string{"request_id", "correlation_id"},
		},
	}
	
	// Test successful registration
	err := cm.RegisterService("test_service", mockService)
	assert.NoError(t, err)
	
	// Test nil service registration
	err = cm.RegisterService("nil_service", nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "service cannot be nil")
}

func TestContextManager_ProcessRequest(t *testing.T) {
	cm := NewContextManager()
	
	mockService := &MockContextAwareService{
		name: "test_service",
		requirements: ContextRequirements{
			RequiredFields: []string{"request_id", "correlation_id"},
		},
		processFunc: func(ctx *ServiceContext, request interface{}) (interface{}, error) {
			return map[string]interface{}{
				"processed": true,
				"request":   request,
				"user_id":   ctx.UserID,
			}, nil
		},
	}
	
	err := cm.RegisterService("test_service", mockService)
	require.NoError(t, err)
	
	ctx := NewServiceContextWithDefaults("user123", "session456", types.ServiceTypeGeneral)
	request := map[string]interface{}{"test": "data"}
	
	response, err := cm.ProcessRequest("test_service", ctx, request)
	assert.NoError(t, err)
	assert.NotNil(t, response)
	
	responseMap, ok := response.(map[string]interface{})
	require.True(t, ok)
	assert.True(t, responseMap["processed"].(bool))
	assert.Equal(t, "user123", responseMap["user_id"].(string))
}

func TestContextManager_ProcessRequest_ServiceNotFound(t *testing.T) {
	cm := NewContextManager()
	ctx := NewServiceContext()
	
	_, err := cm.ProcessRequest("nonexistent_service", ctx, "test")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "service not found")
}

func TestSpecializedContextCreation(t *testing.T) {
	userID := "test_user"
	sessionID := "test_session"
	
	// Test persona service context
	personaCtx := CreatePersonaServiceContext(userID, sessionID)
	assert.Equal(t, userID, personaCtx.UserID)
	assert.Equal(t, sessionID, personaCtx.SessionID)
	assert.Equal(t, types.ServiceTypeGeneral, personaCtx.ServiceType)
	assert.Equal(t, "digital_services", personaCtx.BusinessContext.Department)
	assert.Equal(t, "persona_processing", personaCtx.BusinessContext.ServiceCategory)
	assert.Equal(t, "persona_cache", personaCtx.TechnicalContext.CacheStrategy)
	
	// Test RAG service context
	ragCtx := CreateRAGServiceContext(userID, sessionID)
	assert.Equal(t, types.ServiceTypeDocumentInquiry, ragCtx.ServiceType)
	assert.Equal(t, "information_services", ragCtx.BusinessContext.Department)
	assert.Equal(t, "document_retrieval", ragCtx.BusinessContext.ServiceCategory)
	assert.Equal(t, "vector_cache", ragCtx.TechnicalContext.CacheStrategy)
	
	// Test chat service context
	chatCtx := CreateChatServiceContext(userID, sessionID)
	assert.Equal(t, types.ServiceTypeGeneral, chatCtx.ServiceType)
	assert.Equal(t, "customer_service", chatCtx.BusinessContext.Department)
	assert.Equal(t, "conversational_ai", chatCtx.BusinessContext.ServiceCategory)
	assert.Equal(t, "conversation_cache", chatCtx.TechnicalContext.CacheStrategy)
}

func TestServiceBoundaryTracker(t *testing.T) {
	tracker := NewServiceBoundaryTracker()
	ctx := NewServiceContext()
	
	// Track a boundary
	boundary := tracker.TrackBoundary(ctx, "service1", "service2")
	assert.Equal(t, "service1", boundary.FromService)
	assert.Equal(t, "service2", boundary.ToService)
	assert.False(t, boundary.Timestamp.IsZero())
	assert.Equal(t, ctx.CorrelationID, boundary.Context.CorrelationID)
	
	// Add a small delay to ensure duration is measurable
	time.Sleep(1 * time.Millisecond)
	
	// Complete the boundary
	tracker.CompleteBoundary(boundary, true, "")
	assert.True(t, boundary.Success)
	assert.True(t, boundary.Duration > 0)
	
	// Check history
	history := tracker.GetBoundaryHistory()
	assert.Len(t, history, 1)
	assert.Equal(t, "service1", history[0].FromService)
	
	// Check correlation trace
	trace := tracker.GetCorrelationTrace(ctx.CorrelationID)
	assert.Len(t, trace, 1)
	assert.Equal(t, ctx.CorrelationID, trace[0].Context.CorrelationID)
}

func BenchmarkServiceContext_Creation(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = NewServiceContext()
	}
}

func BenchmarkServiceContext_WithDefaults(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = NewServiceContextWithDefaults("user123", "session456", types.ServiceTypeGeneral)
	}
}

func BenchmarkServiceContext_Clone(b *testing.B) {
	ctx := NewServiceContextWithDefaults("user123", "session456", types.ServiceTypeGeneral)
	b.ResetTimer()
	
	for i := 0; i < b.N; i++ {
		_ = ctx.Clone()
	}
}

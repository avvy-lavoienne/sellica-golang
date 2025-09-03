package persona

import (
	"context"
	"selly-backend/internal/config"
	"selly-backend/pkg/types"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUnifiedPersonaService_Creation(t *testing.T) {
	unifiedConfig := &UnifiedPersonaConfig{
		EnableLegacyFallback:          true,
		EnableTrainingDataIntegration: true,
		EnableUpstashRedisCache:       true,
		EnableSmartTTL:                true,
		CacheTimeout:                  5 * time.Minute,
		RequestTimeout:                10 * time.Second,
		MaxConcurrentRequests:         100,
		TrainingDataPath:              "/backend/data/training",
		PersonaTrainingPath:           "/backend/data/training/persona",
		DefaultRegion:                 "west-java",
		SupportedDialects:             []string{"sundanese", "javanese"},
		CulturalSensitivityLevel:      "high",
	}

	featureFlags := config.GetFeatureFlags()

	service, err := NewUnifiedPersonaService(unifiedConfig, featureFlags)
	require.NoError(t, err)
	require.NotNil(t, service)

	assert.True(t, service.IsEnabled())
	assert.Equal(t, unifiedConfig, service.GetConfig())
}

func TestUnifiedPersonaService_ProcessRequest(t *testing.T) {
	unifiedConfig := &UnifiedPersonaConfig{
		EnableLegacyFallback:          false, // Test unified service only
		EnableTrainingDataIntegration: true,
		CacheTimeout:                  5 * time.Minute,
		RequestTimeout:                10 * time.Second,
	}

	featureFlags := config.GetFeatureFlags()

	service, err := NewUnifiedPersonaService(unifiedConfig, featureFlags)
	require.NoError(t, err)

	ctx := context.Background()
	request := &UnifiedPersonaRequest{
		RequestID:       "test-request-1",
		CorrelationID:   "test-correlation-1",
		UserID:          "test-user-1",
		SessionID:       "test-session-1",
		Query:           "Bagaimana cara membuat akta kelahiran?",
		BaseResponse:    "Untuk membuat akta kelahiran, Anda perlu membawa dokumen-dokumen berikut...",
		ServiceType:     types.ServiceTypeAktaKelahiran,
		IsFirstContact:  true,
		EnableCaching:   true,
		EnableFallback:  false,
		Timeout:         5 * time.Second,
	}

	response, err := service.ProcessPersonaRequest(ctx, request)
	require.NoError(t, err)
	require.NotNil(t, response)

	// Verify response structure
	assert.Equal(t, request.RequestID, response.RequestID)
	assert.Equal(t, request.CorrelationID, response.CorrelationID)
	assert.NotEmpty(t, response.ProcessedResponse)
	assert.True(t, response.PersonalityApplied)
	assert.Equal(t, "unified", response.ServiceUsed)
	assert.False(t, response.FallbackUsed)
	assert.Greater(t, response.ConfidenceScore, 0.0)
	assert.Greater(t, response.QualityScore, 0.0)
}

func TestUnifiedPersonaService_Metrics(t *testing.T) {
	unifiedConfig := &UnifiedPersonaConfig{
		EnableLegacyFallback: false,
		CacheTimeout:         5 * time.Minute,
		RequestTimeout:       10 * time.Second,
	}

	featureFlags := config.GetFeatureFlags()

	service, err := NewUnifiedPersonaService(unifiedConfig, featureFlags)
	require.NoError(t, err)

	// Get initial metrics
	initialMetrics := service.GetMetrics()
	assert.Equal(t, int64(0), initialMetrics.TotalRequests)

	// Process a request
	ctx := context.Background()
	request := &UnifiedPersonaRequest{
		RequestID:    "test-metrics-1",
		UserID:       "test-user-1",
		SessionID:    "test-session-1",
		Query:        "Test query",
		BaseResponse: "Test response",
		ServiceType:  types.ServiceTypeKTPElektronik,
	}

	_, err = service.ProcessPersonaRequest(ctx, request)
	require.NoError(t, err)

	// Check updated metrics
	updatedMetrics := service.GetMetrics()
	assert.Equal(t, int64(1), updatedMetrics.TotalRequests)
	assert.Equal(t, int64(1), updatedMetrics.SuccessfulRequests)
	assert.Equal(t, int64(0), updatedMetrics.FailedRequests)
	assert.Greater(t, updatedMetrics.PersonaApplicationRate, 0.0)
}

func TestFeatureFlagManager_UnifiedService(t *testing.T) {
	featureFlags := config.GetFeatureFlags()

	manager := NewFeatureFlagManager(featureFlags)
	require.NotNil(t, manager)

	// Initially no unified service
	assert.False(t, manager.IsUnifiedServiceEnabled())

	// Enable unified service
	unifiedConfig := &UnifiedPersonaConfig{
		EnableLegacyFallback: true,
		CacheTimeout:         5 * time.Minute,
		RequestTimeout:       10 * time.Second,
	}

	err := manager.EnableUnifiedPersonaService(unifiedConfig)
	require.NoError(t, err)

	// Should now be enabled
	assert.True(t, manager.IsUnifiedServiceEnabled())
	assert.NotNil(t, manager.GetUnifiedService())
}

// Benchmark tests
func BenchmarkUnifiedPersonaService_ProcessRequest(b *testing.B) {
	unifiedConfig := &UnifiedPersonaConfig{
		EnableLegacyFallback: false,
		CacheTimeout:         5 * time.Minute,
		RequestTimeout:       10 * time.Second,
	}

	featureFlags := config.GetFeatureFlags()

	service, err := NewUnifiedPersonaService(unifiedConfig, featureFlags)
	require.NoError(b, err)

	ctx := context.Background()
	request := &UnifiedPersonaRequest{
		RequestID:    "benchmark-1",
		UserID:       "benchmark-user",
		SessionID:    "benchmark-session",
		Query:        "Bagaimana cara membuat akta kelahiran?",
		BaseResponse: "Untuk membuat akta kelahiran, Anda perlu...",
		ServiceType:  types.ServiceTypeAktaKelahiran,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := service.ProcessPersonaRequest(ctx, request)
		if err != nil {
			b.Fatal(err)
		}
	}
}

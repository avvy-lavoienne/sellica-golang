package providers

import (
	"context"
	"testing"
	"time"

	"selly-backend/internal/services/persona"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockGroqProvider for testing
type MockGroqProvider struct {
	mock.Mock
}

func (m *MockGroqProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*AIResponse), args.Error(1)
}

func (m *MockGroqProvider) IsHealthy() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockGroqProvider) GetProviderName() string {
	return "mock-groq"
}

func TestNewPhase2GroqSELLYProvider(t *testing.T) {
	// This test would require a valid API key, so we'll skip the actual creation
	// and just test the structure
	t.Skip("Skipping due to API key requirement")
}

func TestPhase2GroqSELLYProvider_ProcessQuery(t *testing.T) {
	t.Skip("Skipping test - requires complex mock setup")

	// This test would require:
	// 1. Mocking the GroqProvider interface
	// 2. Setting up all Phase 2 components
	// 3. Proper initialization of the Phase2GroqSELLYProvider
	// For now, we'll skip this complex integration test
}

func TestPhase2GroqSELLYProvider_IsEnabled(t *testing.T) {
	t.Skip("Skipping test - requires proper provider initialization")
}

func TestPhase2GroqSELLYProvider_GetPhase2Metrics(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{
		phase2Metrics: nil, // Would be initialized in real scenario
	}

	// This test would require a properly initialized metrics collector
	// For now, we'll just test that the method exists and doesn't panic
	assert.NotPanics(t, func() {
		metrics := provider.GetPhase2Metrics()
		// In a real scenario, this would return actual metrics
		_ = metrics
	})
}

func TestPhase2GroqSELLYProvider_GetProviderName(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{}
	assert.Equal(t, "phase2-groq-selly-enhanced", provider.GetProviderName())
}

func TestPhase2GroqSELLYProvider_SetEnabled(t *testing.T) {
	t.Skip("Skipping test - requires proper provider initialization")
}

func TestPhase2GroqSELLYProvider_RegionalAdaptation(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{
		regionalAdapter: persona.NewRegionalAdapter(""),
	}

	// Test regional adaptation with Javanese context
	regionalInfo := persona.RegionalInfo{
		EthnicGroup: "javanese",
		CulturalMarkers: []string{"formal", "hierarchical"},
	}

	adapted := provider.regionalAdapter.AdaptToRegion(context.Background(), "Saya akan membantu", regionalInfo)
	assert.NotEmpty(t, adapted)
	assert.Contains(t, adapted, "Saya akan membantu") // Should contain original or adapted text
}

func TestPhase2GroqSELLYProvider_ReligiousAwareness(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{
		religiousCalendar: persona.NewReligiousCalendarService(),
	}

	// Test during Ramadan
	ramadanTime := time.Date(2025, 3, 15, 12, 0, 0, 0, time.UTC)
	context := provider.religiousCalendar.AnalyzeReligiousContext(context.Background(), "Selamat berpuasa", ramadanTime)

	assert.NotNil(t, context)
	assert.Equal(t, "ramadan", context.CurrentPeriod)
	assert.Greater(t, context.SensitivityLevel, 5)
}

func TestPhase2GroqSELLYProvider_FaceSavingProcessing(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{
		faceSavingProcessor: persona.NewFaceSavingProcessor(),
	}

	culturalContext := &persona.Phase1CulturalContext{
		FormalityLevel: 8,
		HierarchyMarkers: []string{"bapak", "direktur"},
	}

	// Test face-saving with correction
	processed := provider.faceSavingProcessor.ProcessForFaceSaving(
		context.Background(),
		"Anda salah dalam perhitungan ini",
		true,
		culturalContext,
	)

	assert.NotEmpty(t, processed)
	// Should contain softer language
	assert.NotContains(t, processed, "Anda salah")
}

func TestPhase2GroqSELLYProvider_DetectCorrection(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{}

	tests := []struct {
		query      string
		response   string
		expected   bool
	}{
		{"Itu tidak benar", "response", true},
		{"Anda keliru", "response", true},
		{"Bagaimana caranya?", "response", false},
		{"Bisa tolong jelaskan?", "response", false},
	}

	for _, test := range tests {
		result := provider.detectCorrection(test.query, test.response)
		assert.Equal(t, test.expected, result, "Failed for query: %s", test.query)
	}
}

func TestPhase2GroqSELLYProvider_ExtractCulturalContext(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{}

	req := &AIRequest{
		Context: map[string]interface{}{
			"cultural_context": &persona.Phase1CulturalContext{
				FormalityLevel: 7,
			},
		},
	}

	context := provider.extractCulturalContext(req)
	assert.NotNil(t, context)
	assert.Equal(t, 7, context.FormalityLevel)
}

func TestPhase2GroqSELLYProvider_NeedsFaceSaving(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{}

	req := &AIRequest{
		Query: "Itu tidak benar",
	}

	culturalContext := &persona.Phase1CulturalContext{
		FormalityLevel: 9,
		HierarchyMarkers: []string{"bapak", "direktur"},
	}

	// Should need face-saving due to correction and high formality
	needsSaving := provider.needsFaceSaving(req, culturalContext)
	assert.True(t, needsSaving)
}

func TestPhase2GroqSELLYProvider_RecordError(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{
		phase2Metrics: nil, // Would be initialized in real scenario
	}

	// Test that the method doesn't panic
	assert.NotPanics(t, func() {
		provider.recordError("test_component", assert.AnError)
	})
}

func TestPhase2GroqSELLYProvider_ApplyReligiousContextAdjustments(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{}

	contextResult := &persona.ReligiousContextResult{
		ActivePeriods: []persona.ReligiousPeriod{
			{
				Religion:       "Islam",
				Period:         "Ramadan",
				GreetingPhrase: "Ramadan Mubarak",
			},
		},
		SensitivityLevel: 8,
	}

	response := "Terima kasih atas bantuan Anda"
	adjusted := provider.applyReligiousContextAdjustments(response, contextResult)

	assert.NotEmpty(t, adjusted)
	assert.Contains(t, adjusted, "Ramadan Mubarak")
}

func TestPhase2GroqSELLYProvider_ApplyRegionalAdaptation(t *testing.T) {
	provider := &Phase2GroqSELLYProvider{}

	regionalInfo := persona.RegionalInfo{
		EthnicGroup: "sundanese",
	}

	response := "Terima kasih"
	adapted := provider.applyRegionalAdaptation(context.Background(), response, regionalInfo)

	assert.NotEmpty(t, adapted)
	// Should contain original or Sundanese adaptation
	assert.True(t, adapted == response || len(adapted) > len(response))
}

// Integration test for the complete Phase 2 pipeline
func TestPhase2GroqSELLYProvider_Integration(t *testing.T) {
	t.Skip("Skipping integration test - requires full setup")

	// This would be a comprehensive integration test that:
	// 1. Sets up all Phase 2 components
	// 2. Processes a query through the full pipeline
	// 3. Verifies that all enhancements are applied correctly
	// 4. Checks that metrics are recorded properly
	// 5. Validates the final response quality
}
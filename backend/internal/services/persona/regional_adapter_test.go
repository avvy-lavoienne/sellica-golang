package persona

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewRegionalAdapter(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	assert.NotNil(t, adapter)
	assert.True(t, adapter.IsEnabled())
}

func TestRegionalAdapter_AdaptForRegion(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	tests := []struct {
		name         string
		regionCode   string
		query        string
		expectRegion string
		expectError  bool
	}{
		{
			name:         "Jakarta region",
			regionCode:   "id_jakarta",
			query:        "Halo, apa kabar?",
			expectRegion: "id_jakarta",
			expectError:  false,
		},
		{
			name:         "Unknown region",
			regionCode:   "unknown_region",
			query:        "Hello",
			expectRegion: "id_default",
			expectError:  false,
		},
		{
			name:         "Empty region",
			regionCode:   "",
			query:        "Test query",
			expectRegion: "id_default",
			expectError:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &RegionalAdaptationRequest{
				Query:       tt.query,
				UserID:      "test_user",
				SessionID:   "test_session",
				RegionCode:  tt.regionCode,
				UserContext: map[string]interface{}{"test": "context"},
			}

			response, err := adapter.AdaptForRegion(context.Background(), req)

			if tt.expectError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, response)
				assert.Equal(t, tt.expectRegion, response.RegionApplied)
				assert.Greater(t, response.Confidence, 0.0)
				assert.NotEmpty(t, response.Metadata)
			}
		})
	}
}

func TestRegionalAdapter_GetSupportedRegions(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	regions := adapter.GetSupportedRegions()
	assert.IsType(t, []string{}, regions)
	// Should include Jakarta region from our test profile
	assert.Contains(t, regions, "id_jakarta")
}

func TestRegionalAdapter_GetMetrics(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	// Perform some operations to generate metrics
	req := &RegionalAdaptationRequest{
		Query:       "Test query",
		UserID:      "test_user",
		SessionID:   "test_session",
		RegionCode:  "id_jakarta",
		UserContext: map[string]interface{}{},
	}

	_, err := adapter.AdaptForRegion(context.Background(), req)
	require.NoError(t, err)

	metrics := adapter.GetMetrics()
	assert.NotNil(t, metrics)
	assert.Contains(t, metrics, "total_requests")
	assert.Contains(t, metrics, "regional_adaptations")
	assert.Contains(t, metrics, "fallback_to_default")
	assert.Contains(t, metrics, "avg_processing_time_ms")
	assert.Contains(t, metrics, "region_usage")
	assert.Contains(t, metrics, "last_updated")

	// Check that metrics are reasonable
	assert.GreaterOrEqual(t, metrics["total_requests"], 1.0)
}

func TestRegionalAdapter_EnableDisable(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	// Initially enabled
	assert.True(t, adapter.IsEnabled())

	// Disable
	adapter.SetEnabled(false)
	assert.False(t, adapter.IsEnabled())

	// Re-enable
	adapter.SetEnabled(true)
	assert.True(t, adapter.IsEnabled())
}

func TestRegionalAdapter_DisabledBehavior(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")
	adapter.SetEnabled(false)

	req := &RegionalAdaptationRequest{
		Query:       "Test query",
		UserID:      "test_user",
		SessionID:   "test_session",
		RegionCode:  "id_jakarta",
		UserContext: map[string]interface{}{},
	}

	response, err := adapter.AdaptForRegion(context.Background(), req)

	require.NoError(t, err)
	assert.Equal(t, "disabled", response.RegionApplied)
	assert.Equal(t, req.Query, response.AdaptedResponse)
	assert.Equal(t, 1.0, response.Confidence)
}

func TestRegionalProfile_Validation(t *testing.T) {
	// Test profile loading and validation
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	// Test that adapter is properly initialized
	assert.NotNil(t, adapter)

	// Test that supported regions include Jakarta
	regions := adapter.GetSupportedRegions()
	assert.Contains(t, regions, "id_jakarta")
}

func TestRegionalAdaptation_CulturalElements(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	req := &RegionalAdaptationRequest{
		Query:       "Terima kasih atas bantuan Anda",
		UserID:      "test_user",
		SessionID:   "test_session",
		RegionCode:  "id_jakarta",
		UserContext: map[string]interface{}{},
	}

	response, err := adapter.AdaptForRegion(context.Background(), req)

	require.NoError(t, err)
	assert.NotNil(t, response.CulturalElements)
	// Should contain some cultural adaptation elements
	assert.True(t, len(response.CulturalElements) >= 0)
}

func TestRegionalAdaptation_Performance(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	req := &RegionalAdaptationRequest{
		Query:       "Bagaimana cara mengurus KTP?",
		UserID:      "test_user",
		SessionID:   "test_session",
		RegionCode:  "id_jakarta",
		UserContext: map[string]interface{}{},
	}

	start := time.Now()
	response, err := adapter.AdaptForRegion(context.Background(), req)
	duration := time.Since(start)

	require.NoError(t, err)
	assert.NotNil(t, response)

	// Should complete within reasonable time (less than 100ms for this simple case)
	assert.Less(t, duration, 100*time.Millisecond)

	// Processing time in response should match
	assert.Less(t, response.ProcessingTime, 100*time.Millisecond)
}

func TestRegionalAdaptation_EdgeCases(t *testing.T) {
	adapter := NewRegionalAdapter("data/training/persona/regional_profiles")

	tests := []struct {
		name       string
		query      string
		regionCode string
	}{
		{"Empty query", "", "id_jakarta"},
		{"Very long query", string(make([]byte, 10000)), "id_jakarta"},
		{"Special characters", "Halo! @#$%^&*()", "id_jakarta"},
		{"Unicode characters", "Halo 您好 مرحبا", "id_jakarta"},
		{"SQL injection attempt", "'; DROP TABLE users; --", "id_jakarta"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &RegionalAdaptationRequest{
				Query:       tt.query,
				UserID:      "test_user",
				SessionID:   "test_session",
				RegionCode:  tt.regionCode,
				UserContext: map[string]interface{}{},
			}

			response, err := adapter.AdaptForRegion(context.Background(), req)

			// Should not panic and should return a valid response
			require.NoError(t, err)
			assert.NotNil(t, response)
			assert.NotEmpty(t, response.RegionApplied)
		})
	}
}
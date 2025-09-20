package emoticons

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"selly-backend/pkg/types"
)

func TestNewEmoticonEnhancer(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	assert.NotNil(t, enhancer)
	assert.True(t, enhancer.IsEnabled())
	assert.NotEmpty(t, enhancer.categories)
}

func TestEmoticonEnhancer_EnhanceResponse_Positive(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	req := &EmoticonRequest{
		Response:     "Terima kasih atas pertanyaan Anda. Untuk informasi KTP, Anda dapat mengunjungi Dinas Kependudukan terdekat.",
		ResponseType: "informational",
		Context: map[string]interface{}{
			"service_type": "general",
		},
		UserID:          "test-user",
		ServiceType: string(types.ServiceTypeGeneral),
		CulturalContext: "general_indonesia",
	}

	resp := enhancer.EnhanceResponse(context.Background(), req)

	assert.NotNil(t, resp)
	// Check that the original response is contained in the enhanced response
	assert.Contains(t, resp.EnhancedResponse, req.Response)
	// Check that emoticons were added (response should be longer)
	assert.Greater(t, len(resp.EnhancedResponse), len(req.Response))
	assert.True(t, len(resp.EmoticonsUsed) > 0)
	assert.Equal(t, "positive_helpful", resp.CategoryApplied)
	assert.Greater(t, resp.Confidence, 0.0)
	assert.Less(t, resp.ProcessingTime, time.Second)
}

func TestEmoticonEnhancer_EnhanceResponse_Apologetic(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	req := &EmoticonRequest{
		Response:     "Maaf, saya tidak dapat menjawab pertanyaan tersebut saat ini.",
		ResponseType: "limitation",
		Context: map[string]interface{}{
			"service_type": "general",
		},
		UserID:          "test-user",
		ServiceType: string(types.ServiceTypeGeneral),
		CulturalContext: "general_indonesia",
	}

	resp := enhancer.EnhanceResponse(context.Background(), req)

	assert.NotNil(t, resp)
	// Check that the original response is contained in the enhanced response
	assert.Contains(t, resp.EnhancedResponse, req.Response)
	// Check that emoticons were added (response should be longer)
	assert.Greater(t, len(resp.EnhancedResponse), len(req.Response))
	assert.True(t, len(resp.EmoticonsUsed) > 0)
	assert.Equal(t, "apologetic_supportive", resp.CategoryApplied)
}

func TestEmoticonEnhancer_EnhanceResponse_GovernmentService(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	req := &EmoticonRequest{
		Response:     "Untuk pembuatan akta kelahiran, silakan datang ke kantor Disdukcapil dengan membawa dokumen yang diperlukan.",
		ResponseType: "informational",
		Context: map[string]interface{}{
			"service_type": "government",
		},
		UserID:          "test-user",
		ServiceType: string(types.ServiceTypeGovernment),
		CulturalContext: "general_indonesia",
	}

	resp := enhancer.EnhanceResponse(context.Background(), req)

	assert.NotNil(t, resp)
	// Check that the original response is contained in the enhanced response
	assert.Contains(t, resp.EnhancedResponse, req.Response)
	// Check that emoticons were added (response should be longer)
	assert.Greater(t, len(resp.EnhancedResponse), len(req.Response))
	// For government services, should be more conservative
	assert.True(t, len(resp.EmoticonsUsed) <= 2)
}

func TestEmoticonEnhancer_EnhanceResponse_Disabled(t *testing.T) {
	enhancer := NewEmoticonEnhancer()
	enhancer.SetEnabled(false)

	req := &EmoticonRequest{
		Response:     "Test response",
		ResponseType: "informational",
		Context:      map[string]interface{}{},
		UserID:       "test-user",
		ServiceType: string(types.ServiceTypeGeneral),
		CulturalContext: "general_indonesia",
	}

	resp := enhancer.EnhanceResponse(context.Background(), req)

	assert.NotNil(t, resp)
	assert.Equal(t, req.Response, resp.EnhancedResponse)
	assert.Empty(t, resp.EmoticonsUsed)
	assert.Equal(t, "disabled", resp.CategoryApplied)
}

func TestEmoticonEnhancer_CulturalAppropriateness(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	// Test with government service - should be conservative
	req := &EmoticonRequest{
		Response:     "Selamat! Permohonan Anda telah disetujui.",
		ResponseType: "celebratory",
		Context: map[string]interface{}{
			"service_type": "government",
		},
		UserID:          "test-user",
		ServiceType: string(types.ServiceTypeGovernment),
		CulturalContext: "general_indonesia",
	}

	resp := enhancer.EnhanceResponse(context.Background(), req)

	// The response contains "Selamat!" which should trigger celebratory category
	// but for government services, it should be handled conservatively
	assert.NotNil(t, resp)
	// Check that the original response is contained in the enhanced response
	assert.Contains(t, resp.EnhancedResponse, req.Response)

	// For government services with celebratory content, emoticons should still be added
	// but in a conservative manner (fewer emoticons)
	if len(resp.EmoticonsUsed) > 0 {
		assert.True(t, len(resp.EmoticonsUsed) <= 2, "Government services should use fewer emoticons")
	}
}

func TestEmoticonEnhancer_ResponseTooShort(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	req := &EmoticonRequest{
		Response:     "OK",
		ResponseType: "informational",
		Context:      map[string]interface{}{},
		UserID:       "test-user",
		ServiceType: string(types.ServiceTypeGeneral),
		CulturalContext: "general_indonesia",
	}

	resp := enhancer.EnhanceResponse(context.Background(), req)

	assert.NotNil(t, resp)
	// Very short responses should still get enhancement but maybe fewer emoticons
	assert.Contains(t, resp.EnhancedResponse, req.Response)
}

func TestEmoticonEnhancer_GetMetrics(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	metrics := enhancer.GetMetrics()

	assert.NotNil(t, metrics)
	assert.Contains(t, metrics, "enabled")
	assert.Contains(t, metrics, "max_emoticons_per_response")
	assert.Contains(t, metrics, "categories_count")
	assert.Greater(t, metrics["categories_count"], 0)
}

func TestEmoticonEnhancer_SelectEmoticons(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	category := &EmoticonCategory{
		Name:     "test",
		Emoticons: []string{"😊", "👍", "💡", "🤔"},
		Weight:   0.8,
	}

	req := &EmoticonRequest{
		Response:     "Test response",
		ResponseType: "informational",
	}

	emoticons := enhancer.selectEmoticons(category, req)

	assert.NotNil(t, emoticons)
	assert.True(t, len(emoticons) <= 2) // Max per response
	for _, emoticon := range emoticons {
		assert.Contains(t, category.Emoticons, emoticon)
	}
}

func TestEmoticonEnhancer_ApplyEmoticons(t *testing.T) {
	enhancer := NewEmoticonEnhancer()

	response := "Terima kasih atas bantuan Anda"
	emoticons := []string{"😊", "👍"}

	enhanced := enhancer.applyEmoticons(response, emoticons)

	assert.Contains(t, enhanced, response)
	assert.Contains(t, enhanced, "😊")
	assert.Contains(t, enhanced, "👍")
	assert.True(t, len(enhanced) > len(response))
}

func TestDefaultEmoticonConfig(t *testing.T) {
	config := GetDefaultEmoticonConfig()

	assert.NotNil(t, config)
	assert.True(t, config.Enabled)
	assert.Equal(t, 2, config.MaxEmoticonsPerResponse)
	assert.True(t, config.CulturalSensitivity)
	assert.True(t, config.ServiceAwareRules)
}
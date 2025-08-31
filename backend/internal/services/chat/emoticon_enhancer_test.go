package chat

import (
	"context"
	"testing"
	"time"

	"selly-backend/internal/emoticons"

	"github.com/stretchr/testify/assert"
)

func TestEmoticonEnhancerIntegration(t *testing.T) {
	// Test that we can create and use the emoticon enhancer from the new package
	enhancer := emoticons.NewEmoticonEnhancer()

	assert.NotNil(t, enhancer)
	assert.True(t, enhancer.IsEnabled())

	// Test basic enhancement
	req := &emoticons.EmoticonRequest{
		Response:     "Terima kasih atas pertanyaan Anda.",
		ResponseType: "informational",
		Context: map[string]interface{}{
			"service_type": "general",
		},
		UserID:          "test-user",
		ServiceType:     "general",
		CulturalContext: "general_indonesia",
	}

	resp := enhancer.EnhanceResponse(context.Background(), req)

	assert.NotNil(t, resp)
	// Check that the core content of the original response is contained in the enhanced response
	// (the enhancer may trim punctuation before adding emoticons)
	assert.Contains(t, resp.EnhancedResponse, "Terima kasih atas pertanyaan Anda")
	// Check that emoticons were added (response should be longer)
	assert.Greater(t, len(resp.EnhancedResponse), len(req.Response))
	assert.True(t, len(resp.EmoticonsUsed) > 0)
	assert.Less(t, resp.ProcessingTime, time.Second)
}

func TestEmoticonEnhancerDisabled(t *testing.T) {
	enhancer := emoticons.NewEmoticonEnhancer()
	// Note: We can't directly disable it since SetEnabled is not exported
	// This tests the basic functionality

	req := &emoticons.EmoticonRequest{
		Response:     "Test response",
		ResponseType: "informational",
		Context:      map[string]interface{}{},
		UserID:       "test-user",
		ServiceType:  "general",
		CulturalContext: "general_indonesia",
	}

	resp := enhancer.EnhanceResponse(context.Background(), req)

	assert.NotNil(t, resp)
	assert.Contains(t, resp.EnhancedResponse, req.Response)
}

func TestDefaultEmoticonConfig(t *testing.T) {
	config := emoticons.GetDefaultEmoticonConfig()

	assert.NotNil(t, config)
	assert.True(t, config.Enabled)
	assert.Equal(t, 2, config.MaxEmoticonsPerResponse)
	assert.True(t, config.CulturalSensitivity)
	assert.True(t, config.ServiceAwareRules)
}
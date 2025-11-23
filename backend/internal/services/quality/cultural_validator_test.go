package quality

import (
	"context"
	"testing"
	"time"

	"selly-backend/internal/services/persona"

	"github.com/stretchr/testify/assert"
)

func TestNewCulturalQualityValidator(t *testing.T) {
	validator := NewCulturalQualityValidator()
	assert.NotNil(t, validator)
	assert.True(t, validator.enabled)
	assert.NotEmpty(t, validator.regionalData)
	assert.NotEmpty(t, validator.religiousData)
}

func TestCulturalQualityValidator_ValidateCulturalQuality(t *testing.T) {
	validator := NewCulturalQualityValidator()
	culturalContext := &persona.Phase1CulturalContext{
		RegionalContext: persona.RegionalInfo{
			EthnicGroup: "javanese",
		},
		ReligiousContext: persona.ReligiousInfo{
			CurrentPeriod: "ramadan",
		},
	}

	result := validator.ValidateCulturalQuality("test response", culturalContext)

	assert.NotNil(t, result)
	assert.GreaterOrEqual(t, result.Score, 0.0)
	assert.LessOrEqual(t, result.Score, 1.0)
	assert.NotNil(t, result.ValidatedAt)
}

func TestCulturalQualityValidator_ValidateRegionalAccuracy(t *testing.T) {
	validator := NewCulturalQualityValidator()

	t.Run("Javanese context", func(t *testing.T) {
		culturalContext := &persona.Phase1CulturalContext{
			RegionalContext: persona.RegionalInfo{
				EthnicGroup: "javanese",
			},
		}

		// Test with Javanese cultural elements
		// The validator checks 4 categories and averages; with one match, score ≈ 0.27-0.3
		score := validator.validateRegionalAccuracy("Saya akan membantu dengan sepenuh hati", culturalContext)
		assert.Greater(t, score, 0.2, "Score should show some cultural elements")

		// Test without cultural elements
		score = validator.validateRegionalAccuracy("I will help you", culturalContext)
		assert.Less(t, score, 0.8, "Score should be less than regional validation score")
	})

	t.Run("No regional context", func(t *testing.T) {
		culturalContext := &persona.Phase1CulturalContext{}
		score := validator.validateRegionalAccuracy("test response", culturalContext)
		assert.Equal(t, 1.0, score)
	})
}

func TestCulturalQualityValidator_ValidateReligiousSensitivity(t *testing.T) {
	validator := NewCulturalQualityValidator()

	t.Run("Islamic context", func(t *testing.T) {
		culturalContext := &persona.Phase1CulturalContext{
			ReligiousContext: persona.ReligiousInfo{
				CurrentPeriod: "ramadan",
			},
		}

		// Test with religious sensitivity
		// Contains "Ramadan Mubarak" and "puasa" - should score >= 0.8
		score := validator.validateReligiousSensitivity("Ramadan Mubarak, selamat berpuasa", culturalContext)
		assert.GreaterOrEqual(t, score, 0.8, "Should recognize Ramadan greeting")

		// Test without religious elements
		score = validator.validateReligiousSensitivity("Have a nice day", culturalContext)
		assert.Less(t, score, 0.9, "Should be less than validation score without religious context")
	})

	t.Run("No religious context", func(t *testing.T) {
		culturalContext := &persona.Phase1CulturalContext{}
		score := validator.validateReligiousSensitivity("test response", culturalContext)
		assert.Equal(t, 1.0, score)
	})
}

func TestCulturalQualityValidator_ValidateCulturalRelevance(t *testing.T) {
	validator := NewCulturalQualityValidator()
	culturalContext := &persona.Phase1CulturalContext{}

	t.Run("High cultural relevance", func(t *testing.T) {
		response := "Mari kita gotong royong untuk membantu masyarakat dengan penuh harmoni dan keluarga"
		score := validator.validateCulturalRelevance(response, culturalContext)
		assert.Greater(t, score, 0.7)
	})

	t.Run("Low cultural relevance", func(t *testing.T) {
		response := "This is a standard response without cultural elements"
		score := validator.validateCulturalRelevance(response, culturalContext)
		assert.Less(t, score, 0.7)
	})
}

func TestCulturalQualityValidator_IsEnabled(t *testing.T) {
	validator := NewCulturalQualityValidator()

	assert.True(t, validator.IsEnabled())

	validator.SetEnabled(false)
	assert.False(t, validator.IsEnabled())
}

func TestCulturalQualityValidator_AddRegionalValidationData(t *testing.T) {
	validator := NewCulturalQualityValidator()

	customData := &RegionalValidationData{
		EthnicMarkers:     []string{"custom_marker"},
		CulturalPhrases:   []string{"custom_phrase"},
		FormalityPatterns: []string{"custom_formality"},
		WisdomElements:    []string{"custom_wisdom"},
		ValidationScore:   0.95,
	}

	validator.AddRegionalValidationData("custom_region", customData)

	assert.Contains(t, validator.regionalData, "custom_region")
	assert.Equal(t, customData, validator.regionalData["custom_region"])
}

func TestCulturalQualityValidator_AddReligiousValidationData(t *testing.T) {
	validator := NewCulturalQualityValidator()

	customData := &ReligiousValidationData{
		HolidayMarkers:     []string{"custom_holiday"},
		GreetingPhrases:    []string{"custom_greeting"},
		SensitivityMarkers: []string{"custom_sensitivity"},
		CulturalGuidelines: []string{"custom_guideline"},
		ValidationScore:    0.90,
	}

	validator.AddReligiousValidationData("custom_religion", customData)

	assert.Contains(t, validator.religiousData, "custom_religion")
	assert.Equal(t, customData, validator.religiousData["custom_religion"])
}

func TestCulturalQualityValidator_UpdateQualityThresholds(t *testing.T) {
	validator := NewCulturalQualityValidator()

	newThresholds := QualityThresholds{
		RegionalAccuracy:    0.90,
		ReligiousSensitivity: 0.95,
		CulturalRelevance:   0.85,
		OverallQuality:      0.90,
	}

	validator.UpdateQualityThresholds(newThresholds)

	assert.Equal(t, 0.90, validator.qualityThresholds.RegionalAccuracy)
	assert.Equal(t, 0.95, validator.qualityThresholds.ReligiousSensitivity)
	assert.Equal(t, 0.85, validator.qualityThresholds.CulturalRelevance)
	assert.Equal(t, 0.90, validator.qualityThresholds.OverallQuality)
}

func TestCulturalQualityValidator_GetValidationStats(t *testing.T) {
	validator := NewCulturalQualityValidator()

	stats := validator.GetValidationStats()

	assert.Contains(t, stats, "enabled")
	assert.Contains(t, stats, "regional_data_count")
	assert.Contains(t, stats, "religious_data_count")
	assert.Contains(t, stats, "quality_thresholds")
	assert.Contains(t, stats, "last_validation_time")

	assert.True(t, stats["enabled"].(bool))
	assert.Greater(t, stats["regional_data_count"].(int), 0)
	assert.Greater(t, stats["religious_data_count"].(int), 0)
}

func TestCulturalQualityValidator_ValidateWithContext(t *testing.T) {
	validator := NewCulturalQualityValidator()
	culturalContext := &persona.Phase1CulturalContext{}
	additionalContext := map[string]interface{}{
		"user_preferences": map[string]interface{}{
			"formality_level": "high",
		},
	}

	result := validator.ValidateWithContext(context.TODO(), "test response", culturalContext, additionalContext)

	assert.NotNil(t, result)
	assert.GreaterOrEqual(t, result.Score, 0.0)
	assert.LessOrEqual(t, result.Score, 1.0)
}

func TestQualityValidationResult_Structure(t *testing.T) {
	result := &QualityValidationResult{
		Score:       0.85,
		Issues:      []string{"Test issue"},
		Suggestions: []string{"Test suggestion"},
		ValidatedAt: time.Now(),
	}

	assert.Equal(t, 0.85, result.Score)
	assert.Contains(t, result.Issues, "Test issue")
	assert.Contains(t, result.Suggestions, "Test suggestion")
	assert.NotNil(t, result.ValidatedAt)
}
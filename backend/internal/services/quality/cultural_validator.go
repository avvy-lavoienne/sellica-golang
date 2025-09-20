package quality

import (
	"context"
	"strings"
	"time"

	"selly-backend/internal/services/persona"

	"github.com/sirupsen/logrus"
)

// CulturalQualityValidator validates cultural accuracy of responses
type CulturalQualityValidator struct {
	enabled            bool
	regionalData       map[string]*RegionalValidationData
	religiousData      map[string]*ReligiousValidationData
	qualityThresholds  QualityThresholds
	lastValidationTime time.Time
}

// RegionalValidationData contains validation data for regional adaptations
type RegionalValidationData struct {
	EthnicMarkers      []string `json:"ethnic_markers"`
	CulturalPhrases    []string `json:"cultural_phrases"`
	FormalityPatterns  []string `json:"formality_patterns"`
	WisdomElements     []string `json:"wisdom_elements"`
	ValidationScore    float64  `json:"validation_score"`
}

// ReligiousValidationData contains validation data for religious contexts
type ReligiousValidationData struct {
	HolidayMarkers      []string `json:"holiday_markers"`
	GreetingPhrases     []string `json:"greeting_phrases"`
	SensitivityMarkers  []string `json:"sensitivity_markers"`
	CulturalGuidelines  []string `json:"cultural_guidelines"`
	ValidationScore     float64  `json:"validation_score"`
}

// QualityThresholds defines quality validation thresholds
type QualityThresholds struct {
	RegionalAccuracy    float64 `json:"regional_accuracy"`
	ReligiousSensitivity float64 `json:"religious_sensitivity"`
	CulturalRelevance   float64 `json:"cultural_relevance"`
	OverallQuality      float64 `json:"overall_quality"`
}

// QualityValidationResult contains quality validation results
type QualityValidationResult struct {
	Score       float64  `json:"score"`
	Issues      []string `json:"issues"`
	Suggestions []string `json:"suggestions"`
	ValidatedAt time.Time `json:"validated_at"`
}

// NewCulturalQualityValidator creates a new cultural quality validator
func NewCulturalQualityValidator() *CulturalQualityValidator {
	validator := &CulturalQualityValidator{
		enabled: true,
		regionalData: make(map[string]*RegionalValidationData),
		religiousData: make(map[string]*ReligiousValidationData),
		qualityThresholds: QualityThresholds{
			RegionalAccuracy:    0.85,
			ReligiousSensitivity: 0.90,
			CulturalRelevance:   0.80,
			OverallQuality:      0.85,
		},
		lastValidationTime: time.Now(),
	}

	// Initialize default validation data
	validator.initializeDefaultValidationData()

	return validator
}

// initializeDefaultValidationData sets up default validation data
func (cqv *CulturalQualityValidator) initializeDefaultValidationData() {
	// Regional validation data
	cqv.regionalData["javanese"] = &RegionalValidationData{
		EthnicMarkers:     []string{"jawa", "krama", "ngoko", "javanese"},
		CulturalPhrases:   []string{"alon-alon", "ojo dumeh", "tepa slira", "rukun agawe santosa"},
		FormalityPatterns: []string{"kita semua", "bersama-sama", "melayani dengan sepenuh hati"},
		WisdomElements:    []string{"pepatah jawa", "ajaran jawa", "budaya jawa"},
		ValidationScore:   0.9,
	}

	cqv.regionalData["sundanese"] = &RegionalValidationData{
		EthnicMarkers:     []string{"sunda", "sundanese", "pasundan"},
		CulturalPhrases:   []string{"wilujeng sumping", "hatur nuhun", "mugi-mugi"},
		FormalityPatterns: []string{"sebaiknya", "alangkah baiknya"},
		WisdomElements:    []string{"pepatah sunda", "ajaran sunda"},
		ValidationScore:   0.9,
	}

	cqv.regionalData["batak"] = &RegionalValidationData{
		EthnicMarkers:     []string{"batak", "marga", "tarpuli"},
		CulturalPhrases:   []string{"pasti", "tentu saja", "sudah pasti"},
		FormalityPatterns: []string{"kuat", "teguh", "mantap"},
		WisdomElements:    []string{"adat batak", "tradisi batak"},
		ValidationScore:   0.85,
	}

	// Religious validation data
	cqv.religiousData["islam"] = &ReligiousValidationData{
		HolidayMarkers:     []string{"ramadan", "eid", "lebaran", "idul fitri", "idul adha"},
		GreetingPhrases:    []string{"ramadan mubarak", "eid mubarak", "assalamualaikum"},
		SensitivityMarkers: []string{"puasa", "shalat", "doa", "berdoa"},
		CulturalGuidelines: []string{"hormati waktu ibadah", "hindari referensi makanan saat puasa"},
		ValidationScore:    0.95,
	}

	cqv.religiousData["christianity"] = &ReligiousValidationData{
		HolidayMarkers:     []string{"natal", "christmas", "paskah", "easter"},
		GreetingPhrases:    []string{"selamat natal", "selamat paskah", "merry christmas"},
		SensitivityMarkers: []string{"doa", "ibadah", "gereja", "kebaktian"},
		CulturalGuidelines: []string{"hormati hari raya natal", "akui nilai keluarga"},
		ValidationScore:    0.90,
	}

	cqv.religiousData["hinduism"] = &ReligiousValidationData{
		HolidayMarkers:     []string{"nyepi", "galungan", "kuningan"},
		GreetingPhrases:    []string{"om swastyastu", "rahajeng galungan"},
		SensitivityMarkers: []string{"pura", "upacara", "sembahyang"},
		CulturalGuidelines: []string{"hormati keheningan nyepi", "akui nilai harmoni"},
		ValidationScore:    0.90,
	}
}

// ValidateCulturalQuality validates cultural quality of response
func (cqv *CulturalQualityValidator) ValidateCulturalQuality(response string, culturalContext *persona.Phase1CulturalContext) *QualityValidationResult {
	if !cqv.enabled {
		return &QualityValidationResult{
			Score:       1.0,
			Issues:      []string{},
			Suggestions: []string{},
			ValidatedAt: time.Now(),
		}
	}

	result := &QualityValidationResult{
		Score:       0.0,
		Issues:      []string{},
		Suggestions: []string{},
		ValidatedAt: time.Now(),
	}

	// Validate regional accuracy
	regionalScore := cqv.validateRegionalAccuracy(response, culturalContext)
	result.Score += regionalScore * 0.4

	// Validate religious sensitivity
	religiousScore := cqv.validateReligiousSensitivity(response, culturalContext)
	result.Score += religiousScore * 0.3

	// Validate cultural relevance
	relevanceScore := cqv.validateCulturalRelevance(response, culturalContext)
	result.Score += relevanceScore * 0.3

	// Generate issues and suggestions based on scores
	cqv.generateIssuesAndSuggestions(result, regionalScore, religiousScore, relevanceScore, culturalContext)

	cqv.lastValidationTime = time.Now()

	logrus.WithFields(logrus.Fields{
		"overall_score":    result.Score,
		"regional_score":   regionalScore,
		"religious_score":  religiousScore,
		"relevance_score":  relevanceScore,
		"issues_count":     len(result.Issues),
		"suggestions_count": len(result.Suggestions),
	}).Debug("Cultural quality validation completed")

	return result
}

// validateRegionalAccuracy validates regional cultural accuracy
func (cqv *CulturalQualityValidator) validateRegionalAccuracy(response string, culturalContext *persona.Phase1CulturalContext) float64 {
	if culturalContext.RegionalContext.EthnicGroup == "" {
		return 1.0 // No specific regional context to validate
	}

	// Check for appropriate regional markers
	responseLower := strings.ToLower(response)
	ethnicGroup := strings.ToLower(culturalContext.RegionalContext.EthnicGroup)

	regionalData, exists := cqv.regionalData[ethnicGroup]
	if !exists {
		return 0.7 // Default score for unknown ethnic group
	}

	score := 0.0
	totalChecks := 0.0

	// Check ethnic markers
	for _, marker := range regionalData.EthnicMarkers {
		totalChecks++
		if strings.Contains(responseLower, marker) {
			score += 0.3
		}
	}

	// Check cultural phrases
	for _, phrase := range regionalData.CulturalPhrases {
		totalChecks++
		if strings.Contains(responseLower, phrase) {
			score += 0.4
		}
	}

	// Check formality patterns
	for _, pattern := range regionalData.FormalityPatterns {
		totalChecks++
		if strings.Contains(responseLower, pattern) {
			score += 0.2
		}
	}

	// Check wisdom elements
	for _, wisdom := range regionalData.WisdomElements {
		totalChecks++
		if strings.Contains(responseLower, wisdom) {
			score += 0.1
		}
	}

	if totalChecks == 0 {
		return regionalData.ValidationScore
	}

	calculatedScore := score / totalChecks
	// Blend with base validation score
	return (calculatedScore*0.7 + regionalData.ValidationScore*0.3)
}

// validateReligiousSensitivity validates religious sensitivity
func (cqv *CulturalQualityValidator) validateReligiousSensitivity(response string, culturalContext *persona.Phase1CulturalContext) float64 {
	if culturalContext.ReligiousContext.CurrentPeriod == "" {
		return 1.0 // No specific religious context
	}

	responseLower := strings.ToLower(response)
	religiousPeriod := strings.ToLower(culturalContext.ReligiousContext.CurrentPeriod)

	// Find matching religious data
	var religiousData *ReligiousValidationData
	for religion, data := range cqv.religiousData {
		if strings.Contains(religiousPeriod, religion) ||
		   strings.Contains(culturalContext.ReligiousContext.CurrentPeriod, religion) {
			religiousData = data
			break
		}
	}

	if religiousData == nil {
		return 0.8 // Default score for unknown religious context
	}

	score := 0.0
	totalChecks := 0.0

	// Check holiday markers
	for _, marker := range religiousData.HolidayMarkers {
		totalChecks++
		if strings.Contains(responseLower, marker) {
			score += 0.4
		}
	}

	// Check greeting phrases
	for _, greeting := range religiousData.GreetingPhrases {
		totalChecks++
		if strings.Contains(responseLower, greeting) {
			score += 0.3
		}
	}

	// Check sensitivity markers
	for _, marker := range religiousData.SensitivityMarkers {
		totalChecks++
		if strings.Contains(responseLower, marker) {
			score += 0.2
		}
	}

	// Check cultural guidelines
	for _, guideline := range religiousData.CulturalGuidelines {
		totalChecks++
		if strings.Contains(responseLower, strings.ToLower(guideline)) {
			score += 0.1
		}
	}

	if totalChecks == 0 {
		return religiousData.ValidationScore
	}

	calculatedScore := score / totalChecks
	// Blend with base validation score
	return (calculatedScore*0.8 + religiousData.ValidationScore*0.2)
}

// validateCulturalRelevance validates cultural relevance
func (cqv *CulturalQualityValidator) validateCulturalRelevance(response string, _ *persona.Phase1CulturalContext) float64 {
	// Check for general Indonesian cultural markers
	responseLower := strings.ToLower(response)
	culturalMarkers := []string{
		"gotong royong", "rukun", "harmoni", "keluarga", "masyarakat",
		"tradisi", "budaya", "adat", "santun", "hormat",
		"bersama", "komunitas", "kearifan lokal", "nilai-nilai",
	}

	markerCount := 0
	for _, marker := range culturalMarkers {
		if strings.Contains(responseLower, marker) {
			markerCount++
		}
	}

	if markerCount == 0 {
		return 0.6 // Basic cultural relevance
	}

	// Calculate score based on marker density
	score := 0.6 + float64(markerCount)*0.04
	if score > 1.0 {
		score = 1.0
	}

	return score
}

// generateIssuesAndSuggestions generates issues and suggestions based on validation scores
func (cqv *CulturalQualityValidator) generateIssuesAndSuggestions(result *QualityValidationResult, regionalScore, religiousScore, relevanceScore float64, culturalContext *persona.Phase1CulturalContext) {
	// Check regional accuracy
	if regionalScore < cqv.qualityThresholds.RegionalAccuracy && culturalContext.RegionalContext.EthnicGroup != "" {
		result.Issues = append(result.Issues, "Regional cultural adaptation may be insufficient")
		result.Suggestions = append(result.Suggestions, "Consider adding more region-specific cultural elements")
	}

	// Check religious sensitivity
	if religiousScore < cqv.qualityThresholds.ReligiousSensitivity && culturalContext.ReligiousContext.CurrentPeriod != "" {
		result.Issues = append(result.Issues, "Religious sensitivity may need improvement")
		result.Suggestions = append(result.Suggestions, "Add appropriate religious greetings or considerations")
	}

	// Check cultural relevance
	if relevanceScore < cqv.qualityThresholds.CulturalRelevance {
		result.Issues = append(result.Issues, "General cultural relevance could be enhanced")
		result.Suggestions = append(result.Suggestions, "Include more Indonesian cultural values like gotong royong or harmoni")
	}

	// Overall quality check
	if result.Score < cqv.qualityThresholds.OverallQuality {
		result.Issues = append(result.Issues, "Overall cultural quality below threshold")
		result.Suggestions = append(result.Suggestions, "Review and enhance cultural adaptation strategies")
	}
}

// IsEnabled returns whether quality validation is enabled
func (cqv *CulturalQualityValidator) IsEnabled() bool {
	return cqv.enabled
}

// SetEnabled enables or disables quality validation
func (cqv *CulturalQualityValidator) SetEnabled(enabled bool) {
	cqv.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Cultural quality validator status updated")
}

// GetValidationStats returns validation statistics
func (cqv *CulturalQualityValidator) GetValidationStats() map[string]interface{} {
	return map[string]interface{}{
		"enabled":               cqv.enabled,
		"regional_data_count":   len(cqv.regionalData),
		"religious_data_count":  len(cqv.religiousData),
		"quality_thresholds":    cqv.qualityThresholds,
		"last_validation_time":  cqv.lastValidationTime,
	}
}

// AddRegionalValidationData adds custom regional validation data
func (cqv *CulturalQualityValidator) AddRegionalValidationData(region string, data *RegionalValidationData) {
	cqv.regionalData[region] = data
	logrus.WithField("region", region).Info("Added regional validation data")
}

// AddReligiousValidationData adds custom religious validation data
func (cqv *CulturalQualityValidator) AddReligiousValidationData(religion string, data *ReligiousValidationData) {
	cqv.religiousData[religion] = data
	logrus.WithField("religion", religion).Info("Added religious validation data")
}

// UpdateQualityThresholds updates quality validation thresholds
func (cqv *CulturalQualityValidator) UpdateQualityThresholds(thresholds QualityThresholds) {
	cqv.qualityThresholds = thresholds
	logrus.WithFields(logrus.Fields{
		"regional_accuracy":     thresholds.RegionalAccuracy,
		"religious_sensitivity": thresholds.ReligiousSensitivity,
		"cultural_relevance":    thresholds.CulturalRelevance,
		"overall_quality":       thresholds.OverallQuality,
	}).Info("Updated quality validation thresholds")
}

// ValidateWithContext performs validation with additional context
func (cqv *CulturalQualityValidator) ValidateWithContext(ctx context.Context, response string, culturalContext *persona.Phase1CulturalContext, additionalContext map[string]interface{}) *QualityValidationResult {
	result := cqv.ValidateCulturalQuality(response, culturalContext)

	// Add additional context-based validation if needed
	if additionalContext != nil {
		if userPreferences, exists := additionalContext["user_preferences"].(map[string]interface{}); exists {
			cqv.validateUserPreferences(result, userPreferences)
		}
	}

	return result
}

// validateUserPreferences validates based on user preferences
func (cqv *CulturalQualityValidator) validateUserPreferences(result *QualityValidationResult, userPreferences map[string]interface{}) {
	// This could be extended to validate based on specific user preferences
	// For now, it's a placeholder for future enhancement
	if formalityPreference, exists := userPreferences["formality_level"].(string); exists {
		if formalityPreference == "high" && result.Score < 0.8 {
			result.Suggestions = append(result.Suggestions, "Consider increasing formality level based on user preference")
		}
	}
}
package nlp

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// CulturalEnhancementService integrates all cultural enhancement components
type CulturalEnhancementService struct {
	regionalDialectHandler     *RegionalDialectHandler
	culturalContextEnhancer    *CulturalContextEnhancer
	enhancedIntentClassifier   *EnhancedIntentClassifier
	isInitialized              bool
}

// CulturalEnhancementResult provides comprehensive cultural processing results
type CulturalEnhancementResult struct {
	// Regional dialect processing
	DetectedDialect         string                          `json:"detectedDialect"`
	DialectConfidence       float64                         `json:"dialectConfidence"`
	NormalizedText          string                          `json:"normalizedText"`
	// Cultural context
	CulturalContext         map[string]interface{}          `json:"culturalContext"`
	TimeBasedContext        map[string]interface{}          `json:"timeBasedContext"`
	CulturalSensitivity     string                          `json:"culturalSensitivity"`
	// Enhanced intent classification
	IntentClassification    *EnhancedClassificationResult   `json:"intentClassification"`
	// Processing metadata
	ProcessingSteps         []string                        `json:"processingSteps"`
	TotalProcessingTime     time.Duration                   `json:"totalProcessingTime"`
	QualityScore           float64                         `json:"qualityScore"`
	RecommendedActions      []string                        `json:"recommendedActions"`
}

// ProcessingOptions configures the cultural enhancement processing
type ProcessingOptions struct {
	EnableDialectDetection     bool `json:"enableDialectDetection"`
	EnableCulturalContext      bool `json:"enableCulturalContext"`
	EnableIntentClassification bool `json:"enableIntentClassification"`
	IncludeTimeContext         bool `json:"includeTimeContext"`
	DetailedAnalysis           bool `json:"detailedAnalysis"`
}

// DefaultProcessingOptions returns default processing options
func DefaultProcessingOptions() *ProcessingOptions {
	return &ProcessingOptions{
		EnableDialectDetection:     true,
		EnableCulturalContext:      true,
		EnableIntentClassification: true,
		IncludeTimeContext:         true,
		DetailedAnalysis:           false,
	}
}

// NewCulturalEnhancementService creates a new cultural enhancement service
func NewCulturalEnhancementService() (*CulturalEnhancementService, error) {
	// Initialize regional dialect handler
	dialectHandler := NewRegionalDialectHandler()

	// Initialize cultural context enhancer
	contextEnhancer := NewCulturalContextEnhancer()

	// Initialize enhanced intent classifier
	intentClassifier, err := NewEnhancedIntentClassifier()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize intent classifier: %w", err)
	}

	service := &CulturalEnhancementService{
		regionalDialectHandler:   dialectHandler,
		culturalContextEnhancer:  contextEnhancer,
		enhancedIntentClassifier: intentClassifier,
		isInitialized:            true,
	}

	logrus.Info("🌏 Cultural Enhancement Service initialized")
	return service, nil
}

// ProcessText performs comprehensive cultural enhancement processing
func (ces *CulturalEnhancementService) ProcessText(
	text string,
	userContext map[string]interface{},
	options *ProcessingOptions,
) (*CulturalEnhancementResult, error) {
	startTime := time.Now()

	if !ces.isInitialized {
		return nil, fmt.Errorf("cultural enhancement service not initialized")
	}

	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	if options == nil {
		options = DefaultProcessingOptions()
	}

	result := &CulturalEnhancementResult{
		ProcessingSteps:     []string{},
		CulturalContext:     make(map[string]interface{}),
		TimeBasedContext:    make(map[string]interface{}),
		RecommendedActions:  []string{},
	}

	// Step 1: Regional dialect detection and normalization
	if options.EnableDialectDetection {
		err := ces.processDialect(text, result)
		if err != nil {
			logrus.WithError(err).Warn("Dialect processing failed, continuing with original text")
			result.NormalizedText = text
			result.DetectedDialect = "unknown"
			result.DialectConfidence = 0.0
		}
		result.ProcessingSteps = append(result.ProcessingSteps, "dialect_processing")
	} else {
		result.NormalizedText = text
		result.DetectedDialect = "standard"
		result.DialectConfidence = 1.0
	}

	// Step 2: Cultural context enhancement
	if options.EnableCulturalContext {
		err := ces.processCulturalContext(result.NormalizedText, userContext, options, result)
		if err != nil {
			logrus.WithError(err).Warn("Cultural context processing failed")
		}
		result.ProcessingSteps = append(result.ProcessingSteps, "cultural_context_enhancement")
	}

	// Step 3: Enhanced intent classification
	if options.EnableIntentClassification {
		err := ces.processIntentClassification(result.NormalizedText, userContext, result)
		if err != nil {
			logrus.WithError(err).Warn("Intent classification failed")
		}
		result.ProcessingSteps = append(result.ProcessingSteps, "enhanced_intent_classification")
	}

	// Step 4: Generate quality score and recommendations
	ces.generateQualityScore(result)
	ces.generateRecommendations(result)

	// Final processing time
	result.TotalProcessingTime = time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"detectedDialect":      result.DetectedDialect,
		"dialectConfidence":    result.DialectConfidence,
		"culturalSensitivity":  result.CulturalSensitivity,
		"qualityScore":         result.QualityScore,
		"processingTime":       result.TotalProcessingTime.Milliseconds(),
		"processingSteps":      len(result.ProcessingSteps),
	}).Info("🌏 Cultural enhancement processing completed")

	return result, nil
}

// processDialect handles regional dialect detection and normalization
func (ces *CulturalEnhancementService) processDialect(
	text string,
	result *CulturalEnhancementResult,
) error {
	// Analyze regional dialects using the correct method
	dialectResult, err := ces.regionalDialectHandler.AnalyzeRegionalDialects(context.Background(), text)
	if err != nil {
		return fmt.Errorf("dialect analysis failed: %w", err)
	}

	// Extract the primary detected region and calculate confidence
	primaryRegion := "standard"
	confidence := 0.0
	if len(dialectResult.DialectMarkers) > 0 {
		primaryRegion = dialectResult.DetectedRegion
		// Calculate average confidence from dialect markers
		totalConfidence := 0.0
		for _, marker := range dialectResult.DialectMarkers {
			totalConfidence += marker.Confidence
		}
		confidence = totalConfidence / float64(len(dialectResult.DialectMarkers))
	}

	result.DetectedDialect = primaryRegion
	result.DialectConfidence = confidence
	// For now, use the original text as "normalized" text
	// In a more sophisticated implementation, we would transform dialect terms to standard form
	result.NormalizedText = text

	logrus.WithFields(logrus.Fields{
		"original_length":  len(text),
		"detected_dialect": dialectResult.DetectedRegion,
		"confidence":       confidence,
		"dialect_markers":  len(dialectResult.DialectMarkers),
	}).Debug("🗣️ Dialect processing completed")

	return nil
}

// processCulturalContext handles cultural context enhancement
func (ces *CulturalEnhancementService) processCulturalContext(
	text string,
	userContext map[string]interface{},
	options *ProcessingOptions,
	result *CulturalEnhancementResult,
) error {
	// Extract user region from userContext or use detected dialect region
	userRegion := result.DetectedDialect
	if region, exists := userContext["user_region"]; exists {
		if regionStr, ok := region.(string); ok {
			userRegion = regionStr
		}
	}

	// Process cultural context using the correct method
	contextResult, err := ces.culturalContextEnhancer.AnalyzeCulturalContext(context.Background(), text, userRegion)
	if err != nil {
		return fmt.Errorf("cultural context analysis failed: %w", err)
	}

	// Extract cultural context information from CulturalAnalysis
	result.CulturalContext = map[string]interface{}{
		"current_events":       contextResult.CurrentEvents,
		"ceremonial_elements":  contextResult.CeremonialElements,
		"recommended_tone":     contextResult.RecommendedTone,
		"cultural_adaptations": contextResult.CulturalAdaptations,
		"regional_context":     contextResult.RegionalContext,
	}

	// Determine sensitivity level from alerts
	sensitivityLevel := "low"
	if len(contextResult.SensitivityAlerts) > 0 {
		sensitivityLevel = "high"
		for _, alert := range contextResult.SensitivityAlerts {
			if strings.Contains(alert.Context, "religious") {
				sensitivityLevel = "religious"
				break
			}
			if strings.Contains(alert.Context, "ceremonial") {
				sensitivityLevel = "ceremonial"
				break
			}
		}
	}
	result.CulturalSensitivity = sensitivityLevel

	// Process time-based context if enabled
	if options.IncludeTimeContext {
		result.TimeBasedContext = map[string]interface{}{
			"time_context": contextResult.TimeContext,
			"current_events": contextResult.CurrentEvents,
		}
		if contextResult.TimeContext != nil {
			result.TimeBasedContext["time_of_day"] = contextResult.TimeContext.TimeRange
			result.TimeBasedContext["recommended_greetings"] = contextResult.TimeContext.Greetings
			result.TimeBasedContext["formality"] = contextResult.TimeContext.Formality
		}
	}

	logrus.WithFields(logrus.Fields{
		"cultural_context_keys": len(result.CulturalContext),
		"sensitivity_level":     result.CulturalSensitivity,
		"time_context_keys":     len(result.TimeBasedContext),
		"current_events":        len(contextResult.CurrentEvents),
	}).Debug("🏛️ Cultural context processing completed")

	return nil
}

// processIntentClassification handles enhanced intent classification
func (ces *CulturalEnhancementService) processIntentClassification(
	text string,
	userContext map[string]interface{},
	result *CulturalEnhancementResult,
) error {
	// Merge cultural context into classification context
	classificationContext := make(map[string]interface{})
	
	// Copy original userContext
	for k, v := range userContext {
		classificationContext[k] = v
	}

	// Add cultural context
	classificationContext["cultural_context"] = result.CulturalContext
	classificationContext["detected_dialect"] = result.DetectedDialect
	classificationContext["dialect_confidence"] = result.DialectConfidence
	classificationContext["cultural_sensitivity"] = result.CulturalSensitivity

	// Perform enhanced intent classification
	intentResult, err := ces.enhancedIntentClassifier.ClassifyIntent(text, classificationContext)
	if err != nil {
		return fmt.Errorf("intent classification failed: %w", err)
	}

	result.IntentClassification = intentResult

	logrus.WithFields(logrus.Fields{
		"intent":              intentResult.BaseClassification.Intent,
		"confidence":          intentResult.OverallConfidence,
		"is_specialized":      intentResult.IsSpecialized,
		"specialization_type": intentResult.SpecializationType,
		"complexity":          intentResult.ProcessingComplexity,
	}).Debug("🎯 Intent classification completed")

	return nil
}

// generateQualityScore generates an overall quality score for the processing
func (ces *CulturalEnhancementService) generateQualityScore(result *CulturalEnhancementResult) {
	var scores []float64

	// Dialect detection score
	if result.DialectConfidence > 0 {
		scores = append(scores, result.DialectConfidence)
	}

	// Cultural context score (based on richness)
	culturalScore := float64(len(result.CulturalContext)) / 10.0 // Normalize by expected max keys
	if culturalScore > 1.0 {
		culturalScore = 1.0
	}
	scores = append(scores, culturalScore)

	// Intent classification score
	if result.IntentClassification != nil {
		scores = append(scores, result.IntentClassification.OverallConfidence)
	}

	// Time context score
	timeScore := float64(len(result.TimeBasedContext)) / 5.0 // Normalize by expected max keys
	if timeScore > 1.0 {
		timeScore = 1.0
	}
	scores = append(scores, timeScore)

	// Calculate weighted average
	if len(scores) > 0 {
		total := 0.0
		for _, score := range scores {
			total += score
		}
		result.QualityScore = total / float64(len(scores))
	} else {
		result.QualityScore = 0.5 // Default score
	}
}

// generateRecommendations generates actionable recommendations based on processing results
func (ces *CulturalEnhancementService) generateRecommendations(result *CulturalEnhancementResult) {
	recommendations := []string{}

	// Dialect-based recommendations
	if result.DialectConfidence < 0.7 {
		recommendations = append(recommendations, "Consider asking user to clarify dialect or use standard Indonesian")
	}

	// Cultural sensitivity recommendations
	switch result.CulturalSensitivity {
	case "high":
		recommendations = append(recommendations, "Use formal language and show extra respect in response")
	case "religious":
		recommendations = append(recommendations, "Be mindful of religious context and use appropriate greetings")
	case "ceremonial":
		recommendations = append(recommendations, "Acknowledge ceremonial context and use formal language")
	}

	// Intent classification recommendations
	if result.IntentClassification != nil {
		if result.IntentClassification.ProcessingComplexity > 3 {
			recommendations = append(recommendations, "Complex case detected - consider routing to specialist")
		}
		
		if result.IntentClassification.OverallConfidence < 0.6 {
			recommendations = append(recommendations, "Low confidence classification - may need human review")
		}

		// Add specific recommendations from intent classification
		recommendations = append(recommendations, result.IntentClassification.NextSteps...)
	}

	// Quality-based recommendations
	if result.QualityScore < 0.5 {
		recommendations = append(recommendations, "Low processing quality - consider asking for clarification")
	}

	result.RecommendedActions = recommendations
}

// GetProcessingSummary provides a summary of the processing results
func (ces *CulturalEnhancementService) GetProcessingSummary(result *CulturalEnhancementResult) map[string]interface{} {
	summary := map[string]interface{}{
		"detectedDialect":       result.DetectedDialect,
		"dialectConfidence":     result.DialectConfidence,
		"culturalSensitivity":   result.CulturalSensitivity,
		"qualityScore":          result.QualityScore,
		"processingTime":        result.TotalProcessingTime.Milliseconds(),
		"processingSteps":       result.ProcessingSteps,
		"recommendationsCount":  len(result.RecommendedActions),
		"culturalContextKeys":   len(result.CulturalContext),
		"timeContextKeys":       len(result.TimeBasedContext),
	}

	if result.IntentClassification != nil {
		summary["intent"] = result.IntentClassification.BaseClassification.Intent
		summary["intentConfidence"] = result.IntentClassification.OverallConfidence
		summary["isSpecialized"] = result.IntentClassification.IsSpecialized
		summary["processingComplexity"] = result.IntentClassification.ProcessingComplexity
	}

	return summary
}

// ValidateProcessing validates the processing results for consistency and quality
func (ces *CulturalEnhancementService) ValidateProcessing(result *CulturalEnhancementResult) []string {
	var issues []string

	// Validate dialect processing
	if result.DetectedDialect == "unknown" && result.DialectConfidence == 0.0 {
		issues = append(issues, "Dialect detection failed - may affect response quality")
	}

	// Validate cultural context
	if len(result.CulturalContext) == 0 {
		issues = append(issues, "No cultural context detected - may miss cultural nuances")
	}

	// Validate intent classification
	if result.IntentClassification == nil {
		issues = append(issues, "Intent classification failed - cannot determine user intent")
	} else if result.IntentClassification.OverallConfidence < 0.3 {
		issues = append(issues, "Very low intent classification confidence")
	}

	// Validate quality score
	if result.QualityScore < 0.4 {
		issues = append(issues, "Low overall processing quality")
	}

	// Validate processing time
	if result.TotalProcessingTime > 5*time.Second {
		issues = append(issues, "Processing took longer than expected")
	}

	return issues
}

// GetCulturalRecommendations provides cultural-specific recommendations
func (ces *CulturalEnhancementService) GetCulturalRecommendations(result *CulturalEnhancementResult) map[string]interface{} {
	recommendations := map[string]interface{}{
		"languageStyle":    ces.getLanguageStyleRecommendation(result),
		"responseFormat":   ces.getResponseFormatRecommendation(result),
		"culturalTone":     ces.getCulturalToneRecommendation(result),
		"timeAwareness":    ces.getTimeAwarenessRecommendation(result),
	}

	return recommendations
}

// Helper methods for cultural recommendations

func (ces *CulturalEnhancementService) getLanguageStyleRecommendation(result *CulturalEnhancementResult) string {
	switch result.DetectedDialect {
	case "batak":
		return "Use slightly more direct but respectful language"
	case "minang":
		return "Use diplomatic and indirect language style"
	case "betawi":
		return "Use friendly and casual tone while maintaining respect"
	case "javanese":
		return "Use very formal and hierarchical language"
	default:
		return "Use standard formal Indonesian"
	}
}

func (ces *CulturalEnhancementService) getResponseFormatRecommendation(result *CulturalEnhancementResult) string {
	switch result.CulturalSensitivity {
	case "high":
		return "Structured formal response with clear steps"
	case "religious":
		return "Include appropriate religious greetings and closings"
	case "ceremonial":
		return "Use ceremonial language and acknowledge the occasion"
	default:
		return "Standard professional format"
	}
}

func (ces *CulturalEnhancementService) getCulturalToneRecommendation(result *CulturalEnhancementResult) string {
	if cultural, exists := result.CulturalContext["cultural_event"]; exists {
		if culturalStr, ok := cultural.(string); ok {
			switch culturalStr {
			case "religious_holiday":
				return "Respectful and blessed tone"
			case "national_holiday":
				return "Patriotic and proud tone"
			case "traditional_ceremony":
				return "Respectful and traditional tone"
			}
		}
	}
	return "Professional and helpful tone"
}

func (ces *CulturalEnhancementService) getTimeAwarenessRecommendation(result *CulturalEnhancementResult) string {
	if timeCtx, exists := result.TimeBasedContext["time_of_day"]; exists {
		if timeStr, ok := timeCtx.(string); ok {
			switch timeStr {
			case "early_morning":
				return "Acknowledge early timing and show appreciation"
			case "late_evening":
				return "Be mindful of late timing and keep response concise"
			case "prayer_time":
				return "Be respectful of prayer time"
			}
		}
	}
	return "Standard time-neutral response"
}

// ProcessBatch processes multiple texts in batch with cultural enhancement
func (ces *CulturalEnhancementService) ProcessBatch(
	texts []string,
	userContexts []map[string]interface{},
	options *ProcessingOptions,
) ([]*CulturalEnhancementResult, error) {
	if len(texts) != len(userContexts) {
		return nil, fmt.Errorf("texts and userContexts length mismatch")
	}

	results := make([]*CulturalEnhancementResult, len(texts))
	
	for i, text := range texts {
		result, err := ces.ProcessText(text, userContexts[i], options)
		if err != nil {
			logrus.WithError(err).WithField("index", i).Warn("Batch processing failed for text")
			// Continue with other texts, set nil result
			results[i] = nil
		} else {
			results[i] = result
		}
	}

	logrus.WithField("batch_size", len(texts)).Info("🌏 Batch cultural enhancement completed")
	return results, nil
}

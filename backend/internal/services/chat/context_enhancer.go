package chat

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// ContextEnhancer enhances AI responses with context-aware term injection
type ContextEnhancer struct {
	termExtractor     *ContextTermExtractor
	promptBuilder     *EnhancedPromptBuilder
	responseValidator *ResponseValidator
}

// ContextTermExtractor extracts key terms from RAG context
type ContextTermExtractor struct {
	// Technical terms that should be preserved in responses
	technicalTerms map[string][]string
	// Patterns for extracting terms from different contexts
	termPatterns map[string]*regexp.Regexp
}

// EnhancedPromptBuilder builds prompts with context injection
type EnhancedPromptBuilder struct {
	basePrompts map[string]string
}

// ResponseValidator validates that responses contain expected terms
type ResponseValidator struct {
	minTermMatches int
}

// NewContextEnhancer creates a new context enhancer
func NewContextEnhancer() *ContextEnhancer {
	return &ContextEnhancer{
		termExtractor:     NewContextTermExtractor(),
		promptBuilder:     NewEnhancedPromptBuilder(),
		responseValidator: NewResponseValidator(),
	}
}

// NewContextTermExtractor creates a new term extractor
func NewContextTermExtractor() *ContextTermExtractor {
	extractor := &ContextTermExtractor{
		technicalTerms: map[string][]string{
			"akta_kelahiran": {
				"akta kelahiran", "kelahiran", "bayi baru lahir", "60 hari",
				"terlambat", "koreksi", "penggantian", "duplikat", "syarat",
				"dokumen", "prosedur", "biaya", "gratis", "waktu", "hari kerja",
			},
			"ktp": {
				"ktp", "elektronik", "pindah", "penggantian", "hilang",
				"rusak", "duplikat", "syarat", "dokumen", "prosedur", "biaya",
			},
			"kk": {
				"kartu keluarga", "kk", "perubahan", "penambahan", "pengurangan",
				"syarat", "dokumen", "prosedur", "biaya",
			},
		},
	}

	// Initialize regex patterns for term extraction
	extractor.initializePatterns()

	return extractor
}

// NewEnhancedPromptBuilder creates a new prompt builder
func NewEnhancedPromptBuilder() *EnhancedPromptBuilder {
	return &EnhancedPromptBuilder{
		basePrompts: map[string]string{
			"akta_kelahiran": `Anda adalah asisten pemerintah yang membantu masyarakat dengan informasi akta kelahiran.
			Gunakan istilah teknis berikut dalam penjelasan Anda: %s
			Jawab dengan bahasa Indonesia yang formal dan jelas.
			Sertakan informasi tentang dokumen yang diperlukan, prosedur, dan biaya jika relevan.`,

			"ktp": `Anda adalah asisten pemerintah yang membantu masyarakat dengan informasi KTP.
			Gunakan istilah teknis berikut dalam penjelasan Anda: %s
			Jawab dengan bahasa Indonesia yang formal dan jelas.
			Sertakan informasi tentang persyaratan, prosedur, dan biaya jika relevan.`,

			"kk": `Anda adalah asisten pemerintah yang membantu masyarakat dengan informasi Kartu Keluarga.
			Gunakan istilah teknis berikut dalam penjelasan Anda: %s
			Jawab dengan bahasa Indonesia yang formal dan jelas.
			Sertakan informasi tentang persyaratan dan prosedur jika relevan.`,
		},
	}
}

// NewResponseValidator creates a new response validator
func NewResponseValidator() *ResponseValidator {
	return &ResponseValidator{
		minTermMatches: 1, // At least one expected term should be present
	}
}

// initializePatterns initializes regex patterns for term extraction
func (cte *ContextTermExtractor) initializePatterns() {
	cte.termPatterns = map[string]*regexp.Regexp{
		"akta_kelahiran": regexp.MustCompile(`(?i)(akta kelahiran|kelahiran|bayi baru lahir|60 hari|terlambat|koreksi|penggantian|duplikat|syarat|dokumen|prosedur|biaya|gratis|waktu|hari kerja)`),
		"ktp":            regexp.MustCompile(`(?i)(ktp|elektronik|pindah|penggantian|hilang|rusak|duplikat|syarat|dokumen|prosedur|biaya)`),
		"kk":             regexp.MustCompile(`(?i)(kartu keluarga|kk|perubahan|penambahan|pengurangan|syarat|dokumen|prosedur|biaya)`),
	}
}

// ExtractKeyTerms extracts key terms from RAG context
func (cte *ContextTermExtractor) ExtractKeyTerms(ragContext string, serviceType string) []string {
	if ragContext == "" {
		return []string{}
	}

	var keyTerms []string
	lowerContext := strings.ToLower(ragContext)

	// Get service-specific technical terms
	if terms, exists := cte.technicalTerms[serviceType]; exists {
		for _, term := range terms {
			if strings.Contains(lowerContext, strings.ToLower(term)) {
				keyTerms = append(keyTerms, term)
			}
		}
	}

	// Extract terms using regex patterns
	if pattern, exists := cte.termPatterns[serviceType]; exists {
		matches := pattern.FindAllString(ragContext, -1)
		for _, match := range matches {
			// Clean and deduplicate
			cleanMatch := strings.TrimSpace(strings.ToLower(match))
			if !contains(keyTerms, cleanMatch) {
				keyTerms = append(keyTerms, cleanMatch)
			}
		}
	}

	// Remove duplicates and limit to top 5 most relevant terms
	keyTerms = removeDuplicates(keyTerms)
	if len(keyTerms) > 5 {
		keyTerms = keyTerms[:5]
	}

	logrus.WithFields(logrus.Fields{
		"service_type":    serviceType,
		"extracted_terms": keyTerms,
		"context_length":  len(ragContext),
	}).Debug("Extracted key terms from RAG context")

	return keyTerms
}

// BuildEnhancedPrompt builds a prompt with context term injection
func (epb *EnhancedPromptBuilder) BuildEnhancedPrompt(query string, serviceType string, keyTerms []string, ragContext string) string {
	// Get base prompt for service type
	basePrompt, exists := epb.basePrompts[serviceType]
	if !exists {
		basePrompt = epb.basePrompts["general"]
		if basePrompt == "" {
			basePrompt = "Jawab pertanyaan berikut dengan informasi yang akurat dan berguna."
		}
	}

	// Format terms for injection
	termsString := strings.Join(keyTerms, ", ")
	if termsString == "" {
		termsString = "informasi yang relevan"
	}

	// Build enhanced prompt
	enhancedPrompt := fmt.Sprintf(basePrompt, termsString)

	// Add context if available
	if ragContext != "" {
		enhancedPrompt += fmt.Sprintf("\n\nKONTEXT DARI BASIS PENGETAHUAN:\n%s", ragContext)
	}

	// Add the actual query
	enhancedPrompt += fmt.Sprintf("\n\nPERTANYAAN: %s", query)

	// Add instruction to use technical terms
	enhancedPrompt += "\n\nINSTRUKSI: Gunakan istilah teknis yang sesuai dalam jawaban Anda untuk memberikan informasi yang akurat."

	logrus.WithFields(logrus.Fields{
		"service_type":           serviceType,
		"key_terms_count":        len(keyTerms),
		"rag_context_length":     len(ragContext),
		"enhanced_prompt_length": len(enhancedPrompt),
	}).Debug("Built enhanced prompt with context injection")

	return enhancedPrompt
}

// ValidateResponse checks if response contains expected terms
func (rv *ResponseValidator) ValidateResponse(response string, expectedTerms []string) *ValidationResult {
	if len(expectedTerms) == 0 {
		return &ValidationResult{
			IsValid:      true,
			MatchedTerms: []string{},
			MissingTerms: []string{},
			Score:        1.0,
		}
	}

	var matchedTerms []string
	var missingTerms []string
	lowerResponse := strings.ToLower(response)

	for _, term := range expectedTerms {
		if strings.Contains(lowerResponse, strings.ToLower(term)) {
			matchedTerms = append(matchedTerms, term)
		} else {
			missingTerms = append(missingTerms, term)
		}
	}

	score := float64(len(matchedTerms)) / float64(len(expectedTerms))
	isValid := len(matchedTerms) >= rv.minTermMatches

	return &ValidationResult{
		IsValid:      isValid,
		MatchedTerms: matchedTerms,
		MissingTerms: missingTerms,
		Score:        score,
	}
}

// ValidationResult contains validation results
type ValidationResult struct {
	IsValid      bool
	MatchedTerms []string
	MissingTerms []string
	Score        float64
}

// EnhanceResponse enhances an AI response with context injection
func (ce *ContextEnhancer) EnhanceResponse(ctx context.Context, query string, serviceType string, ragContext string, originalResponse string) (*EnhancedResponse, error) {
	// Extract key terms from RAG context
	keyTerms := ce.termExtractor.ExtractKeyTerms(ragContext, serviceType)

	// Build enhanced prompt (for future AI service integration)
	_ = ce.promptBuilder.BuildEnhancedPrompt(query, serviceType, keyTerms, ragContext)

	// For now, return the original response with enhancement metadata
	// In a full implementation, this would call an AI service with the enhanced prompt
	enhancedResponse := &EnhancedResponse{
		OriginalResponse:   originalResponse,
		EnhancedResponse:   originalResponse, // Would be replaced with AI response to enhanced prompt
		KeyTerms:           keyTerms,
		ServiceType:        serviceType,
		EnhancementApplied: len(keyTerms) > 0,
		ValidationResult:   ce.responseValidator.ValidateResponse(originalResponse, keyTerms),
	}

	logrus.WithFields(logrus.Fields{
		"service_type":        serviceType,
		"key_terms_extracted": len(keyTerms),
		"enhancement_applied": enhancedResponse.EnhancementApplied,
		"validation_score":    enhancedResponse.ValidationResult.Score,
	}).Info("Context enhancement completed")

	return enhancedResponse, nil
}

// EnhancedResponse contains the enhanced response data
type EnhancedResponse struct {
	OriginalResponse   string
	EnhancedResponse   string
	KeyTerms           []string
	ServiceType        string
	EnhancementApplied bool
	ValidationResult   *ValidationResult
}

// Helper functions

// contains checks if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// removeDuplicates removes duplicate strings from slice
func removeDuplicates(slice []string) []string {
	keys := make(map[string]bool)
	var result []string

	for _, item := range slice {
		if !keys[item] {
			keys[item] = true
			result = append(result, item)
		}
	}

	return result
}

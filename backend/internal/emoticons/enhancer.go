package emoticons

import (
	"context"
	"math/rand"
	"strings"
	"time"
)

// EmoticonEnhancer provides intelligent emoticon enhancement for SELLY responses
type EmoticonEnhancer struct {
	config     *EmoticonConfig
	enabled    bool
	categories map[string]*EmoticonCategory
}

// EmoticonConfig holds configuration for emoticon enhancement
type EmoticonConfig struct {
	Enabled               bool                    `yaml:"enabled"`
	MaxEmoticonsPerResponse int                   `yaml:"max_emoticons_per_response"`
	CulturalSensitivity   bool                   `yaml:"cultural_sensitivity"`
	ServiceAwareRules     bool                   `yaml:"service_aware_rules"`
	Categories            map[string]*EmoticonCategory `yaml:"categories"`
}

// EmoticonCategory defines a category of emoticons with selection rules
type EmoticonCategory struct {
	Name        string   `yaml:"name"`
	Description string   `yaml:"description"`
	Emoticons   []string `yaml:"emoticons"`
	Contexts    []string `yaml:"contexts"`    // When to use this category
	Keywords    []string `yaml:"keywords"`    // Keywords that trigger this category
	Weight      float64  `yaml:"weight"`      // Selection weight (0.0-1.0)
}

// EmoticonRequest represents a request to enhance a response with emoticons
type EmoticonRequest struct {
	Response        string                 `json:"response"`
	ResponseType    string                 `json:"response_type"`
	Context         map[string]interface{} `json:"context"`
	UserID          string                 `json:"user_id"`
	ServiceType     string                 `json:"service_type"`
	CulturalContext string                 `json:"cultural_context"`
}

// EmoticonResponse contains the enhanced response with emoticon metadata
type EmoticonResponse struct {
	EnhancedResponse string                 `json:"enhanced_response"`
	EmoticonsUsed    []string               `json:"emoticons_used"`
	CategoryApplied  string                 `json:"category_applied"`
	Confidence       float64                `json:"confidence"`
	ProcessingTime   time.Duration          `json:"processing_time"`
	Metadata         map[string]interface{} `json:"metadata"`
}

// NewEmoticonEnhancer creates a new emoticon enhancer with default configuration
func NewEmoticonEnhancer() *EmoticonEnhancer {
	enhancer := &EmoticonEnhancer{
		config: &EmoticonConfig{
			Enabled:                 true,
			MaxEmoticonsPerResponse: 2,
			CulturalSensitivity:     true,
			ServiceAwareRules:       true,
		},
		enabled: true,
	}

	enhancer.initializeDefaultCategories()
	return enhancer
}

// NewEmoticonEnhancerWithConfig creates an enhancer with custom configuration
func NewEmoticonEnhancerWithConfig(config *EmoticonConfig) *EmoticonEnhancer {
	if config == nil {
		return NewEmoticonEnhancer()
	}

	enhancer := &EmoticonEnhancer{
		config:  config,
		enabled: config.Enabled,
	}

	if config.Categories != nil {
		enhancer.categories = config.Categories
	} else {
		enhancer.initializeDefaultCategories()
	}

	return enhancer
}

// initializeDefaultCategories sets up the default emoticon categories
func (e *EmoticonEnhancer) initializeDefaultCategories() {
	e.categories = map[string]*EmoticonCategory{
		"positive_helpful": {
			Name:        "positive_helpful",
			Description: "Express assistance and positivity",
			Emoticons:   []string{"😊", "👍", "💡", "🙂", "🤗"},
			Contexts:    []string{"informational", "helpful", "successful"},
			Keywords:    []string{"dapat", "bisa", "silakan", "informasi", "bantuan"},
			Weight:      0.8,
		},
		"thoughtful_considerate": {
			Name:        "thoughtful_considerate",
			Description: "Show careful consideration",
			Emoticons:   []string{"🤔", "💭", "📝", "🔍", "💡"},
			Contexts:    []string{"complex", "detailed", "analysis"},
			Keywords:    []string{"pertimbangkan", "analisis", "periksa", "cari tahu"},
			Weight:      0.6,
		},
		"apologetic_supportive": {
			Name:        "apologetic_supportive",
			Description: "Express regret or support",
			Emoticons:   []string{"🙏", "😔", "🤝", "💙", "🌟"},
			Contexts:    []string{"limitation", "fallback", "error", "unavailable"},
			Keywords:    []string{"maaf", "tidak", "belum", "kesulitan", "masalah"},
			Weight:      0.5,
		},
		"celebratory_achievement": {
			Name:        "celebratory_achievement",
			Description: "Acknowledge accomplishments",
			Emoticons:   []string{"🎉", "⭐", "🏆", "🌟", "💫"},
			Contexts:    []string{"success", "completion", "achievement"},
			Keywords:    []string{"selamat", "berhasil", "selesai", "lulus"},
			Weight:      0.7,
		},
		"encouraging_motivational": {
			Name:        "encouraging_motivational",
			Description: "Provide encouragement",
			Emoticons:   []string{"💪", "🌟", "🚀", "🔥", "✨"},
			Contexts:    []string{"guidance", "next_steps", "motivation"},
			Keywords:    []string{"mari", "ayo", "lanjut", "coba", "usaha"},
			Weight:      0.6,
		},
	}
}

// EnhanceResponse enhances a response with appropriate emoticons
func (e *EmoticonEnhancer) EnhanceResponse(ctx context.Context, req *EmoticonRequest) *EmoticonResponse {
	startTime := time.Now()

	if !e.enabled || !e.config.Enabled {
		return &EmoticonResponse{
			EnhancedResponse: req.Response,
			EmoticonsUsed:    []string{},
			CategoryApplied:  "disabled",
			Confidence:       1.0,
			ProcessingTime:   time.Since(startTime),
			Metadata: map[string]interface{}{
				"enhancement_skipped": true,
				"reason":             "enhancer_disabled",
			},
		}
	}

	// Analyze response to determine appropriate category
	category, confidence := e.analyzeResponse(req)

	if category == nil || confidence < 0.3 {
		// Return original response if no suitable category found
		return &EmoticonResponse{
			EnhancedResponse: req.Response,
			EmoticonsUsed:    []string{},
			CategoryApplied:  "none",
			Confidence:       confidence,
			ProcessingTime:   time.Since(startTime),
			Metadata: map[string]interface{}{
				"enhancement_skipped": true,
				"reason":             "no_suitable_category",
			},
		}
	}

	// Check cultural appropriateness
	if e.config.CulturalSensitivity && !e.isCulturallyAppropriate(req, category) {
		return &EmoticonResponse{
			EnhancedResponse: req.Response,
			EmoticonsUsed:    []string{},
			CategoryApplied:  "culturally_inappropriate",
			Confidence:       confidence,
			ProcessingTime:   time.Since(startTime),
			Metadata: map[string]interface{}{
				"enhancement_skipped": true,
				"reason":             "cultural_inappropriateness",
			},
		}
	}

	// Select and apply emoticons
	emoticonsUsed := e.selectEmoticons(category, req)
	enhancedResponse := e.applyEmoticons(req.Response, emoticonsUsed)

	return &EmoticonResponse{
		EnhancedResponse: enhancedResponse,
		EmoticonsUsed:    emoticonsUsed,
		CategoryApplied:  category.Name,
		Confidence:       confidence,
		ProcessingTime:   time.Since(startTime),
		Metadata: map[string]interface{}{
			"enhancement_applied": true,
			"category_weight":     category.Weight,
			"response_length":     len(req.Response),
		},
	}
}

// analyzeResponse analyzes the response to determine the most appropriate emoticon category
func (e *EmoticonEnhancer) analyzeResponse(req *EmoticonRequest) (*EmoticonCategory, float64) {
	responseLower := strings.ToLower(req.Response)
	var bestCategory *EmoticonCategory
	var bestScore float64

	for _, category := range e.categories {
		score := e.calculateCategoryScore(req, category, responseLower)

		if score > bestScore {
			bestScore = score
			bestCategory = category
		}
	}

	return bestCategory, bestScore
}

// calculateCategoryScore calculates how well a category fits the response
func (e *EmoticonEnhancer) calculateCategoryScore(req *EmoticonRequest, category *EmoticonCategory, responseLower string) float64 {
	score := category.Weight

	// Check context match
	for _, context := range category.Contexts {
		if req.ResponseType == context {
			score += 0.3
		}
		if serviceType, exists := req.Context["service_type"]; exists {
			if serviceType == context {
				score += 0.2
			}
		}
	}

	// Check keyword matches
	keywordMatches := 0
	for _, keyword := range category.Keywords {
		if strings.Contains(responseLower, keyword) {
			keywordMatches++
		}
	}

	if keywordMatches > 0 {
		score += float64(keywordMatches) * 0.1
	}

	// Service-aware adjustments
	if e.config.ServiceAwareRules && req.ServiceType == "government" {
		// More conservative for government services
		score *= 0.8
	}

	// Length-based adjustments (shorter responses might need more emotive elements)
	if len(req.Response) < 100 {
		score += 0.1
	}

	return score
}

// isCulturallyAppropriate checks if the emoticon category is culturally appropriate
func (e *EmoticonEnhancer) isCulturallyAppropriate(req *EmoticonRequest, category *EmoticonCategory) bool {
	// For Indonesian context, be more conservative with celebratory emoticons in formal contexts
	if req.CulturalContext == "indonesia" || req.CulturalContext == "general_indonesia" {
		if req.ServiceType == "government" && category.Name == "celebratory_achievement" {
			return false // Too celebratory for government services
		}
	}

	// Check for formal language patterns that suggest conservative approach
	responseLower := strings.ToLower(req.Response)
	formalIndicators := []string{"dengan hormat", "sehubungan", "berdasarkan", "menurut peraturan"}
	for _, indicator := range formalIndicators {
		if strings.Contains(responseLower, indicator) {
			// Reduce celebratory and encouraging categories for very formal responses
			if category.Name == "celebratory_achievement" || category.Name == "encouraging_motivational" {
				return false
			}
		}
	}

	return true
}

// selectEmoticons selects appropriate emoticons from the category
func (e *EmoticonEnhancer) selectEmoticons(category *EmoticonCategory, req *EmoticonRequest) []string {
	if len(category.Emoticons) == 0 {
		return []string{}
	}

	maxEmoticons := e.config.MaxEmoticonsPerResponse
	if maxEmoticons <= 0 {
		maxEmoticons = 1
	}

	// For short responses, prefer single emoticon
	if len(req.Response) < 50 {
		maxEmoticons = 1
	}

	// Randomly select emoticons from the category
	selected := make([]string, 0, maxEmoticons)
	emoticons := make([]string, len(category.Emoticons))
	copy(emoticons, category.Emoticons)

	// Shuffle for variety
	rand.Shuffle(len(emoticons), func(i, j int) {
		emoticons[i], emoticons[j] = emoticons[j], emoticons[i]
	})

	for i := 0; i < maxEmoticons && i < len(emoticons); i++ {
		selected = append(selected, emoticons[i])
	}

	return selected
}

// applyEmoticons applies the selected emoticons to the response
func (e *EmoticonEnhancer) applyEmoticons(response string, emoticons []string) string {
	if len(emoticons) == 0 {
		return response
	}

	// Clean the response of any existing trailing punctuation
	response = strings.TrimRight(response, " .,!?")

	// Add space and emoticons
	enhanced := response + " " + strings.Join(emoticons, " ")

	return enhanced
}

// IsEnabled returns whether the enhancer is enabled
func (e *EmoticonEnhancer) IsEnabled() bool {
	return e.enabled && e.config.Enabled
}

// SetEnabled enables or disables the enhancer
func (e *EmoticonEnhancer) SetEnabled(enabled bool) {
	e.enabled = enabled
}

// GetMetrics returns enhancement metrics
func (e *EmoticonEnhancer) GetMetrics() map[string]interface{} {
	return map[string]interface{}{
		"enabled":                    e.enabled,
		"config_enabled":            e.config.Enabled,
		"max_emoticons_per_response": e.config.MaxEmoticonsPerResponse,
		"cultural_sensitivity":      e.config.CulturalSensitivity,
		"service_aware_rules":       e.config.ServiceAwareRules,
		"categories_count":          len(e.categories),
	}
}

// GetDefaultConfig returns the default configuration
func GetDefaultEmoticonConfig() *EmoticonConfig {
	return &EmoticonConfig{
		Enabled:                 true,
		MaxEmoticonsPerResponse: 2,
		CulturalSensitivity:     true,
		ServiceAwareRules:       true,
		Categories:              nil, // Will use defaults
	}
}
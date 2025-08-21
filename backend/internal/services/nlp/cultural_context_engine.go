package nlp

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// CulturalContextEngine provides advanced Indonesian cultural context analysis
type CulturalContextEngine struct {
	culturalPatterns    map[string]*Phase3CulturalPattern
	politenessRules     map[string]*Phase3PolitenessRule
	formalityIndicators map[string]*FormalityIndicator
	regionalMarkers     map[string]*Phase3RegionalMarker
	socialContextRules  map[string]*SocialContextRule
	isInitialized       bool
	mu                  sync.RWMutex
	stats               *CulturalStats
}

// Phase3CulturalPattern represents a cultural linguistic pattern for Phase 3
type Phase3CulturalPattern struct {
	Pattern      string                 `json:"pattern"`
	Type         string                 `json:"type"`
	Significance float64                `json:"significance"`
	Description  string                 `json:"description"`
	Context      map[string]interface{} `json:"context"`
	Examples     []string               `json:"examples"`
}

// Phase3PolitenessRule represents Indonesian politeness conventions for Phase 3
type Phase3PolitenessRule struct {
	Indicator   string  `json:"indicator"`
	Level       string  `json:"level"` // "very_polite", "polite", "neutral", "informal", "rude"
	Score       float64 `json:"score"` // -1.0 to 1.0
	Context     string  `json:"context"`
	Explanation string  `json:"explanation"`
}

// FormalityIndicator represents formality level indicators
type FormalityIndicator struct {
	Indicator   string   `json:"indicator"`
	Level       string   `json:"level"` // "very_formal", "formal", "neutral", "informal", "very_informal"
	Score       float64  `json:"score"` // -1.0 to 1.0
	Usage       string   `json:"usage"`
	Appropriate []string `json:"appropriate"`
}

// Phase3RegionalMarker represents regional cultural markers for Phase 3
type Phase3RegionalMarker struct {
	Marker       string   `json:"marker"`
	Region       string   `json:"region"`
	Confidence   float64  `json:"confidence"`
	Meaning      string   `json:"meaning"`
	Alternatives []string `json:"alternatives"`
}

// SocialContextRule represents social context rules
type SocialContextRule struct {
	Rule         string                 `json:"rule"`
	Context      string                 `json:"context"`
	Indicators   []string               `json:"indicators"`
	Implications map[string]interface{} `json:"implications"`
}

// CulturalStats tracks cultural analysis statistics
type CulturalStats struct {
	TotalAnalyses      int64     `json:"totalAnalyses"`
	CulturalMarkers    int64     `json:"culturalMarkers"`
	PolitenessDetected int64     `json:"politenessDetected"`
	FormalityDetected  int64     `json:"formalityDetected"`
	RegionalMarkers    int64     `json:"regionalMarkers"`
	AverageConfidence  float64   `json:"averageConfidence"`
	LastUpdated        time.Time `json:"lastUpdated"`
	mu                 sync.RWMutex
}

// NewCulturalContextEngine creates a new cultural context engine
func NewCulturalContextEngine() *CulturalContextEngine {
	engine := &CulturalContextEngine{
		culturalPatterns:    make(map[string]*Phase3CulturalPattern),
		politenessRules:     make(map[string]*Phase3PolitenessRule),
		formalityIndicators: make(map[string]*FormalityIndicator),
		regionalMarkers:     make(map[string]*Phase3RegionalMarker),
		socialContextRules:  make(map[string]*SocialContextRule),
		stats: &CulturalStats{
			LastUpdated: time.Now(),
		},
	}

	// Initialize cultural knowledge base
	if err := engine.initializeCulturalKnowledge(); err != nil {
		logrus.WithError(err).Warn("Failed to initialize cultural knowledge base")
	}

	logrus.Info("🏛️ Cultural context engine created")
	return engine
}

// initializeCulturalKnowledge initializes the Indonesian cultural knowledge base
func (c *CulturalContextEngine) initializeCulturalKnowledge() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Initialize politeness rules
	c.initializePolitenessRules()

	// Initialize formality indicators
	c.initializeFormalityIndicators()

	// Initialize cultural patterns
	c.initializeCulturalPatterns()

	// Initialize regional markers
	c.initializeRegionalMarkers()

	// Initialize social context rules
	c.initializeSocialContextRules()

	c.isInitialized = true

	logrus.Info("✅ Indonesian cultural knowledge base initialized")
	return nil
}

// initializePolitenessRules initializes Indonesian politeness rules
func (c *CulturalContextEngine) initializePolitenessRules() {
	politenessRules := map[string]*Phase3PolitenessRule{
		// Very polite expressions
		"mohon": &Phase3PolitenessRule{
			Indicator:   "mohon",
			Level:       "very_polite",
			Score:       1.0,
			Context:     "formal_request",
			Explanation: "Very polite way to make a request",
		},
		"dengan hormat": &Phase3PolitenessRule{
			Indicator:   "dengan hormat",
			Level:       "very_polite",
			Score:       1.0,
			Context:     "formal_letter",
			Explanation: "Formal letter opening",
		},
		"sekiranya": {
			Indicator:   "sekiranya",
			Level:       "very_polite",
			Score:       0.9,
			Context:     "polite_request",
			Explanation: "Polite conditional expression",
		},

		// Polite expressions
		"tolong": {
			Indicator:   "tolong",
			Level:       "polite",
			Score:       0.7,
			Context:     "request",
			Explanation: "Polite way to ask for help",
		},
		"silakan": {
			Indicator:   "silakan",
			Level:       "polite",
			Score:       0.8,
			Context:     "invitation",
			Explanation: "Polite invitation or permission",
		},
		"maaf": {
			Indicator:   "maaf",
			Level:       "polite",
			Score:       0.7,
			Context:     "apology",
			Explanation: "Polite apology",
		},
		"permisi": {
			Indicator:   "permisi",
			Level:       "polite",
			Score:       0.7,
			Context:     "excuse_me",
			Explanation: "Polite way to get attention or excuse oneself",
		},

		// Neutral expressions
		"bisa": {
			Indicator:   "bisa",
			Level:       "neutral",
			Score:       0.0,
			Context:     "ability",
			Explanation: "Neutral expression of ability",
		},

		// Informal expressions
		"dong": {
			Indicator:   "dong",
			Level:       "informal",
			Score:       -0.5,
			Context:     "casual_request",
			Explanation: "Informal particle for emphasis",
		},
		"deh": {
			Indicator:   "deh",
			Level:       "informal",
			Score:       -0.4,
			Context:     "casual",
			Explanation: "Informal particle",
		},

		// Rude expressions
		"harus": {
			Indicator:   "harus",
			Level:       "demanding",
			Score:       -0.3,
			Context:     "command",
			Explanation: "Can be perceived as demanding without politeness markers",
		},
	}

	for key, rule := range politenessRules {
		c.politenessRules[key] = rule
	}
}

// initializeFormalityIndicators initializes formality level indicators
func (c *CulturalContextEngine) initializeFormalityIndicators() {
	formalityIndicators := map[string]*FormalityIndicator{
		// Very formal
		"yang terhormat": {
			Indicator:   "yang terhormat",
			Level:       "very_formal",
			Score:       1.0,
			Usage:       "official_address",
			Appropriate: []string{"government", "business", "academic"},
		},
		"dengan ini": {
			Indicator:   "dengan ini",
			Level:       "very_formal",
			Score:       1.0,
			Usage:       "official_statement",
			Appropriate: []string{"legal", "government", "business"},
		},

		// Formal
		"bapak": {
			Indicator:   "bapak",
			Level:       "formal",
			Score:       0.8,
			Usage:       "respectful_address",
			Appropriate: []string{"business", "government", "social"},
		},
		"ibu": {
			Indicator:   "ibu",
			Level:       "formal",
			Score:       0.8,
			Usage:       "respectful_address",
			Appropriate: []string{"business", "government", "social"},
		},
		"saudara": {
			Indicator:   "saudara",
			Level:       "formal",
			Score:       0.7,
			Usage:       "formal_address",
			Appropriate: []string{"government", "legal"},
		},

		// Neutral
		"anda": {
			Indicator:   "anda",
			Level:       "neutral",
			Score:       0.0,
			Usage:       "general_address",
			Appropriate: []string{"general", "business"},
		},

		// Informal
		"kamu": {
			Indicator:   "kamu",
			Level:       "informal",
			Score:       -0.6,
			Usage:       "casual_address",
			Appropriate: []string{"friends", "family", "peers"},
		},
		"lu": {
			Indicator:   "lu",
			Level:       "very_informal",
			Score:       -0.9,
			Usage:       "very_casual",
			Appropriate: []string{"close_friends", "jakarta_slang"},
		},
		"gue": {
			Indicator:   "gue",
			Level:       "very_informal",
			Score:       -0.9,
			Usage:       "very_casual",
			Appropriate: []string{"close_friends", "jakarta_slang"},
		},
	}

	for key, indicator := range formalityIndicators {
		c.formalityIndicators[key] = indicator
	}
}

// initializeCulturalPatterns initializes Indonesian cultural patterns
func (c *CulturalContextEngine) initializeCulturalPatterns() {
	culturalPatterns := map[string]*Phase3CulturalPattern{
		"gotong_royong": &Phase3CulturalPattern{
			Pattern:      "gotong royong",
			Type:         "social_value",
			Significance: 0.9,
			Description:  "Community cooperation and mutual assistance",
			Context:      map[string]interface{}{"category": "social_values", "importance": "high"},
			Examples:     []string{"kerja bakti", "bantu-membantu", "kerjasama"},
		},
		"basa_basi": &Phase3CulturalPattern{
			Pattern:      "basa-basi",
			Type:         "communication_style",
			Significance: 0.8,
			Description:  "Small talk and indirect communication",
			Context:      map[string]interface{}{"category": "communication", "purpose": "relationship_building"},
			Examples:     []string{"apa kabar", "sudah makan", "bagaimana keluarga"},
		},
		"tidak_apa_apa": &Phase3CulturalPattern{
			Pattern:      "tidak apa-apa",
			Type:         "conflict_avoidance",
			Significance: 0.7,
			Description:  "Harmony preservation and conflict avoidance",
			Context:      map[string]interface{}{"category": "social_harmony", "meaning": "acceptance"},
			Examples:     []string{"gak papa", "santai", "biasa saja"},
		},
		"hormat": &Phase3CulturalPattern{
			Pattern:      "hormat",
			Type:         "respect",
			Significance: 0.9,
			Description:  "Respect and deference to authority/elders",
			Context:      map[string]interface{}{"category": "social_hierarchy", "importance": "critical"},
			Examples:     []string{"menghormati", "sopan", "taat"},
		},
	}

	for key, pattern := range culturalPatterns {
		c.culturalPatterns[key] = pattern
	}
}

// initializeRegionalMarkers initializes regional cultural markers
func (c *CulturalContextEngine) initializeRegionalMarkers() {
	regionalMarkers := map[string]*Phase3RegionalMarker{
		// Jakarta/Betawi
		"gue": &Phase3RegionalMarker{
			Marker:       "gue",
			Region:       "Jakarta",
			Confidence:   0.9,
			Meaning:      "I/me (informal)",
			Alternatives: []string{"saya", "aku"},
		},
		"lu": &Phase3RegionalMarker{
			Marker:       "lu",
			Region:       "Jakarta",
			Confidence:   0.9,
			Meaning:      "you (informal)",
			Alternatives: []string{"kamu", "anda"},
		},

		// Javanese influence
		"monggo": &Phase3RegionalMarker{
			Marker:       "monggo",
			Region:       "Java",
			Confidence:   0.8,
			Meaning:      "please (polite invitation)",
			Alternatives: []string{"silakan", "mari"},
		},
		"nggih": &Phase3RegionalMarker{
			Marker:       "nggih",
			Region:       "Java",
			Confidence:   0.8,
			Meaning:      "yes (very polite)",
			Alternatives: []string{"ya", "iya"},
		},

		// Sundanese influence
		"atuh": &Phase3RegionalMarker{
			Marker:       "atuh",
			Region:       "West Java",
			Confidence:   0.7,
			Meaning:      "particle for emphasis",
			Alternatives: []string{"dong", "lah"},
		},

		// Batak influence
		"horas": &Phase3RegionalMarker{
			Marker:       "horas",
			Region:       "North Sumatra",
			Confidence:   0.9,
			Meaning:      "greeting (Batak)",
			Alternatives: []string{"halo", "hai"},
		},
	}

	for key, marker := range regionalMarkers {
		c.regionalMarkers[key] = marker
	}
}

// initializeSocialContextRules initializes social context rules
func (c *CulturalContextEngine) initializeSocialContextRules() {
	socialContextRules := map[string]*SocialContextRule{
		"age_hierarchy": {
			Rule:       "Respect age hierarchy",
			Context:    "intergenerational_communication",
			Indicators: []string{"kakak", "adik", "om", "tante", "bapak", "ibu"},
			Implications: map[string]interface{}{
				"communication_style": "more_formal_to_elders",
				"decision_making":     "defer_to_elders",
			},
		},
		"indirect_refusal": {
			Rule:       "Avoid direct refusal",
			Context:    "declining_requests",
			Indicators: []string{"mungkin", "nanti", "insya allah", "coba lihat"},
			Implications: map[string]interface{}{
				"meaning":          "polite_refusal",
				"cultural_purpose": "maintain_harmony",
			},
		},
		"face_saving": {
			Rule:       "Preserve face and dignity",
			Context:    "criticism_or_correction",
			Indicators: []string{"mungkin", "sepertinya", "barangkali"},
			Implications: map[string]interface{}{
				"approach":       "indirect_suggestion",
				"cultural_value": "dignity_preservation",
			},
		},
	}

	for key, rule := range socialContextRules {
		c.socialContextRules[key] = rule
	}
}

// AnalyzeCulturalContext analyzes the cultural context of Indonesian text
func (c *CulturalContextEngine) AnalyzeCulturalContext(ctx context.Context, text string) (*Phase3CulturalContext, error) {
	if !c.isInitialized {
		if err := c.initializeCulturalKnowledge(); err != nil {
			return nil, fmt.Errorf("failed to initialize cultural knowledge: %w", err)
		}
	}

	startTime := time.Now()
	lowerText := strings.ToLower(text)

	logrus.WithField("text_length", len(text)).Debug("🏛️ Analyzing cultural context")

	// Initialize result
	result := &Phase3CulturalContext{
		CulturalMarkers:    []Phase3CulturalMarker{},
		CulturalReferences: []Phase3CulturalReference{},
		SocialContext:      make(map[string]interface{}),
	}

	// Analyze cultural markers
	c.analyzeCulturalMarkers(lowerText, result)

	// Analyze politeness level
	c.analyzePolitenessLevel(lowerText, result)

	// Analyze formality level
	c.analyzeFormalityLevel(lowerText, result)

	// Analyze social context
	c.analyzeSocialContext(lowerText, result)

	// Update statistics
	c.updateStats(len(result.CulturalMarkers))

	processingTime := time.Since(startTime)
	logrus.WithFields(logrus.Fields{
		"cultural_markers": len(result.CulturalMarkers),
		"politeness":       result.PolitenessLevel,
		"formality":        result.FormalityLevel,
		"processing_time":  processingTime.Milliseconds(),
	}).Debug("✅ Cultural context analysis completed")

	return result, nil
}

// analyzeCulturalMarkers identifies cultural markers in the text
func (c *CulturalContextEngine) analyzeCulturalMarkers(text string, result *Phase3CulturalContext) {
	for _, pattern := range c.culturalPatterns {
		if strings.Contains(text, pattern.Pattern) {
			marker := Phase3CulturalMarker{
				Marker:       pattern.Pattern,
				Type:         pattern.Type,
				Significance: pattern.Significance,
				Description:  pattern.Description,
			}
			result.CulturalMarkers = append(result.CulturalMarkers, marker)

			// Add cultural reference
			reference := Phase3CulturalReference{
				Reference:   pattern.Pattern,
				Category:    pattern.Type,
				Explanation: pattern.Description,
			}
			result.CulturalReferences = append(result.CulturalReferences, reference)
		}
	}

	// Analyze regional markers
	for _, marker := range c.regionalMarkers {
		if strings.Contains(text, marker.Marker) {
			culturalMarker := Phase3CulturalMarker{
				Marker:       marker.Marker,
				Type:         "regional_dialect",
				Significance: marker.Confidence,
				Description:  fmt.Sprintf("Regional marker from %s: %s", marker.Region, marker.Meaning),
			}
			result.CulturalMarkers = append(result.CulturalMarkers, culturalMarker)
		}
	}
}

// analyzePolitenessLevel analyzes the politeness level of the text
func (c *CulturalContextEngine) analyzePolitenessLevel(text string, result *Phase3CulturalContext) {
	totalScore := 0.0
	ruleCount := 0

	for _, rule := range c.politenessRules {
		if strings.Contains(text, rule.Indicator) {
			totalScore += rule.Score
			ruleCount++
		}
	}

	// Determine politeness level
	if ruleCount == 0 {
		result.PolitenessLevel = "neutral"
	} else {
		avgScore := totalScore / float64(ruleCount)
		switch {
		case avgScore >= 0.8:
			result.PolitenessLevel = "very_polite"
		case avgScore >= 0.5:
			result.PolitenessLevel = "polite"
		case avgScore >= -0.2:
			result.PolitenessLevel = "neutral"
		case avgScore >= -0.5:
			result.PolitenessLevel = "informal"
		default:
			result.PolitenessLevel = "rude"
		}
	}
}

// analyzeFormalityLevel analyzes the formality level of the text
func (c *CulturalContextEngine) analyzeFormalityLevel(text string, result *Phase3CulturalContext) {
	totalScore := 0.0
	indicatorCount := 0

	for _, indicator := range c.formalityIndicators {
		if strings.Contains(text, indicator.Indicator) {
			totalScore += indicator.Score
			indicatorCount++
		}
	}

	// Determine formality level
	if indicatorCount == 0 {
		result.FormalityLevel = "neutral"
	} else {
		avgScore := totalScore / float64(indicatorCount)
		switch {
		case avgScore >= 0.8:
			result.FormalityLevel = "very_formal"
		case avgScore >= 0.4:
			result.FormalityLevel = "formal"
		case avgScore >= -0.3:
			result.FormalityLevel = "neutral"
		case avgScore >= -0.7:
			result.FormalityLevel = "informal"
		default:
			result.FormalityLevel = "very_informal"
		}
	}
}

// analyzeSocialContext analyzes social context implications
func (c *CulturalContextEngine) analyzeSocialContext(text string, result *Phase3CulturalContext) {
	result.SocialContext = make(map[string]interface{})

	for _, rule := range c.socialContextRules {
		for _, indicator := range rule.Indicators {
			if strings.Contains(text, indicator) {
				result.SocialContext[rule.Context] = rule.Implications
				break
			}
		}
	}

	// Add general social context information
	result.SocialContext["analysis_timestamp"] = time.Now()
	result.SocialContext["cultural_framework"] = "indonesian"
	result.SocialContext["politeness_detected"] = result.PolitenessLevel != "neutral"
	result.SocialContext["formality_detected"] = result.FormalityLevel != "neutral"
}

// updateStats updates cultural analysis statistics
func (c *CulturalContextEngine) updateStats(markerCount int) {
	c.stats.mu.Lock()
	defer c.stats.mu.Unlock()

	c.stats.TotalAnalyses++
	c.stats.CulturalMarkers += int64(markerCount)
	c.stats.LastUpdated = time.Now()

	// Update average confidence (simplified)
	if c.stats.TotalAnalyses > 0 {
		c.stats.AverageConfidence = float64(c.stats.CulturalMarkers) / float64(c.stats.TotalAnalyses)
	}
}

// GetStats returns current cultural analysis statistics
func (c *CulturalContextEngine) GetStats() *CulturalStats {
	c.stats.mu.RLock()
	defer c.stats.mu.RUnlock()

	// Create a copy to avoid race conditions
	return &CulturalStats{
		TotalAnalyses:      c.stats.TotalAnalyses,
		CulturalMarkers:    c.stats.CulturalMarkers,
		PolitenessDetected: c.stats.PolitenessDetected,
		FormalityDetected:  c.stats.FormalityDetected,
		RegionalMarkers:    c.stats.RegionalMarkers,
		AverageConfidence:  c.stats.AverageConfidence,
		LastUpdated:        c.stats.LastUpdated,
	}
}

// IsHealthy returns whether the cultural context engine is healthy
func (c *CulturalContextEngine) IsHealthy() bool {
	return c.isInitialized && len(c.culturalPatterns) > 0
}

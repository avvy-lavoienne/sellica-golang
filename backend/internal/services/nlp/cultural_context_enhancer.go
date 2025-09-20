package nlp

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// CulturalContextEnhancer provides enhanced Indonesian cultural context processing
type CulturalContextEnhancer struct {
	culturalEvents     map[string]*CulturalEvent
	timeBasedContexts  map[string]*TimeBasedContext
	ceremonialLanguage map[string]*CeremonialPattern
	regionalSensitivity map[string]*SensitivityRule
	isInitialized      bool
	mu                 sync.RWMutex
}

// CulturalEvent represents Indonesian cultural events and holidays
type CulturalEvent struct {
	Name        string    `json:"name"`
	Type        string    `json:"type"` // national, religious, regional
	Date        string    `json:"date"` // MM-DD or specific date format
	Region      string    `json:"region"`
	Greetings   []string  `json:"greetings"`
	Context     string    `json:"context"`
	Sensitivity string    `json:"sensitivity"` // high, medium, low
	Duration    int       `json:"duration"` // days
}

// TimeBasedContext represents time-of-day appropriate responses
type TimeBasedContext struct {
	TimeRange   string   `json:"timeRange"` // morning, afternoon, evening, night
	StartHour   int      `json:"startHour"`
	EndHour     int      `json:"endHour"`
	Greetings   []string `json:"greetings"`
	Tone        string   `json:"tone"`
	Formality   string   `json:"formality"`
	Context     string   `json:"context"`
}

// CeremonialPattern represents formal/ceremonial language patterns
type CeremonialPattern struct {
	Pattern     string   `json:"pattern"`
	Context     string   `json:"context"`
	FormalForm  string   `json:"formalForm"`
	Region      string   `json:"region"`
	Usage       string   `json:"usage"`
	Examples    []string `json:"examples"`
	Confidence  float64  `json:"confidence"`
}

// SensitivityRule represents cultural sensitivity rules
type SensitivityRule struct {
	Trigger     string   `json:"trigger"`
	Region      string   `json:"region"`
	Sensitivity string   `json:"sensitivity"`
	Guidelines  []string `json:"guidelines"`
	Alternatives []string `json:"alternatives"`
	Context     string   `json:"context"`
}

// CulturalAnalysis represents the result of cultural context analysis
type CulturalAnalysis struct {
	CurrentEvents      []CulturalEvent      `json:"currentEvents"`
	TimeContext        *TimeBasedContext    `json:"timeContext"`
	CeremonialElements []CeremonialPattern  `json:"ceremonialElements"`
	SensitivityAlerts  []SensitivityRule    `json:"sensitivityAlerts"`
	RecommendedTone    string               `json:"recommendedTone"`
	CulturalAdaptations []string            `json:"culturalAdaptations"`
	RegionalContext    string               `json:"regionalContext"`
	Confidence         float64              `json:"confidence"`
	ProcessingTime     time.Duration        `json:"processingTime"`
}

// NewCulturalContextEnhancer creates a new cultural context enhancer
func NewCulturalContextEnhancer() *CulturalContextEnhancer {
	enhancer := &CulturalContextEnhancer{
		culturalEvents:      make(map[string]*CulturalEvent),
		timeBasedContexts:   make(map[string]*TimeBasedContext),
		ceremonialLanguage:  make(map[string]*CeremonialPattern),
		regionalSensitivity: make(map[string]*SensitivityRule),
	}

	// Initialize cultural knowledge
	if err := enhancer.initializeCulturalKnowledge(); err != nil {
		logrus.WithError(err).Warn("Failed to initialize cultural knowledge")
	}

	logrus.Info("🎭 Cultural context enhancer created")
	return enhancer
}

// AnalyzeCulturalContext analyzes text for cultural context and provides recommendations
func (c *CulturalContextEnhancer) AnalyzeCulturalContext(ctx context.Context, text string, userRegion string) (*CulturalAnalysis, error) {
	if !c.isInitialized {
		if err := c.initializeCulturalKnowledge(); err != nil {
			return nil, fmt.Errorf("failed to initialize cultural knowledge: %w", err)
		}
	}

	startTime := time.Now()
	
	analysis := &CulturalAnalysis{
		CurrentEvents:       []CulturalEvent{},
		CeremonialElements:  []CeremonialPattern{},
		SensitivityAlerts:   []SensitivityRule{},
		CulturalAdaptations: []string{},
		RegionalContext:     userRegion,
	}

	// Check for current cultural events
	c.analyzeCurrentEvents(analysis)

	// Analyze time-based context
	c.analyzeTimeContext(analysis)

	// Detect ceremonial language needs
	c.analyzeCeremonialElements(text, analysis)

	// Check cultural sensitivity
	c.analyzeCulturalSensitivity(text, userRegion, analysis)

	// Generate cultural adaptations
	c.generateCulturalAdaptations(text, analysis)

	// Calculate overall confidence
	analysis.Confidence = c.calculateCulturalConfidence(analysis)
	analysis.ProcessingTime = time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"currentEvents":     len(analysis.CurrentEvents),
		"ceremonialElements": len(analysis.CeremonialElements),
		"sensitivityAlerts": len(analysis.SensitivityAlerts),
		"recommendedTone":   analysis.RecommendedTone,
		"processingTime":    analysis.ProcessingTime.Milliseconds(),
		"confidence":        analysis.Confidence,
	}).Debug("🎭 Cultural context analysis completed")

	return analysis, nil
}

// initializeCulturalKnowledge initializes the cultural knowledge base
func (c *CulturalContextEnhancer) initializeCulturalKnowledge() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Initialize cultural events
	c.initializeCulturalEvents()

	// Initialize time-based contexts
	c.initializeTimeBasedContexts()

	// Initialize ceremonial language patterns
	c.initializeCeremonialLanguage()

	// Initialize regional sensitivity rules
	c.initializeRegionalSensitivity()

	c.isInitialized = true
	logrus.Info("✅ Cultural knowledge base initialized")
	return nil
}

// initializeCulturalEvents initializes Indonesian cultural events and holidays
func (c *CulturalContextEnhancer) initializeCulturalEvents() {
	events := map[string]*CulturalEvent{
		"independence_day": {
			Name:        "Hari Kemerdekaan",
			Type:        "national",
			Date:        "08-17",
			Region:      "Indonesia",
			Greetings:   []string{"Selamat Hari Kemerdekaan", "Dirgahayu Indonesia", "Merdeka!"},
			Context:     "patriotic",
			Sensitivity: "high",
			Duration:    1,
		},
		"kartini_day": {
			Name:        "Hari Kartini",
			Type:        "national",
			Date:        "04-21",
			Region:      "Indonesia",
			Greetings:   []string{"Selamat Hari Kartini", "Semangat Kartini"},
			Context:     "women_empowerment",
			Sensitivity: "medium",
			Duration:    1,
		},
		"ramadan": {
			Name:        "Bulan Ramadan",
			Type:        "religious",
			Date:        "variable", // Lunar calendar
			Region:      "Indonesia",
			Greetings:   []string{"Ramadan Mubarak", "Selamat menjalankan ibadah puasa"},
			Context:     "religious_fasting",
			Sensitivity: "high",
			Duration:    30,
		},
		"eid_fitr": {
			Name:        "Hari Raya Idul Fitri",
			Type:        "religious",
			Date:        "variable",
			Region:      "Indonesia",
			Greetings:   []string{"Selamat Hari Raya Idul Fitri", "Mohon maaf lahir dan batin"},
			Context:     "religious_celebration",
			Sensitivity: "high",
			Duration:    2,
		},
		"galungan": {
			Name:        "Hari Raya Galungan",
			Type:        "religious",
			Date:        "variable",
			Region:      "Bali",
			Greetings:   []string{"Selamat Hari Raya Galungan", "Rahayu"},
			Context:     "balinese_hindu",
			Sensitivity: "high",
			Duration:    1,
		},
		"christmas": {
			Name:        "Hari Natal",
			Type:        "religious",
			Date:        "12-25",
			Region:      "Indonesia",
			Greetings:   []string{"Selamat Hari Natal", "Natal yang Diberkati"},
			Context:     "christian_celebration",
			Sensitivity: "high",
			Duration:    1,
		},
	}

	for key, event := range events {
		c.culturalEvents[key] = event
	}
}

// initializeTimeBasedContexts initializes time-of-day contexts
func (c *CulturalContextEnhancer) initializeTimeBasedContexts() {
	contexts := map[string]*TimeBasedContext{
		"dawn": {
			TimeRange: "dawn",
			StartHour: 4,
			EndHour:   6,
			Greetings: []string{"Selamat pagi awal", "Subuh yang baik"},
			Tone:      "gentle",
			Formality: "medium",
			Context:   "early_morning",
		},
		"morning": {
			TimeRange: "morning",
			StartHour: 6,
			EndHour:   11,
			Greetings: []string{"Selamat pagi", "Pagi yang cerah"},
			Tone:      "energetic",
			Formality: "medium",
			Context:   "productive_hours",
		},
		"midday": {
			TimeRange: "midday",
			StartHour: 11,
			EndHour:   14,
			Greetings: []string{"Selamat siang", "Siang yang baik"},
			Tone:      "professional",
			Formality: "high",
			Context:   "business_hours",
		},
		"afternoon": {
			TimeRange: "afternoon",
			StartHour: 14,
			EndHour:   18,
			Greetings: []string{"Selamat sore", "Sore yang indah"},
			Tone:      "relaxed",
			Formality: "medium",
			Context:   "leisure_time",
		},
		"evening": {
			TimeRange: "evening",
			StartHour: 18,
			EndHour:   21,
			Greetings: []string{"Selamat malam", "Malam yang tenang"},
			Tone:      "warm",
			Formality: "medium",
			Context:   "family_time",
		},
		"night": {
			TimeRange: "night",
			StartHour: 21,
			EndHour:   4,
			Greetings: []string{"Selamat malam", "Malam yang nyaman"},
			Tone:      "gentle",
			Formality: "low",
			Context:   "rest_time",
		},
	}

	for key, context := range contexts {
		c.timeBasedContexts[key] = context
	}
}

// initializeCeremonialLanguage initializes ceremonial and formal language patterns
func (c *CulturalContextEnhancer) initializeCeremonialLanguage() {
	patterns := map[string]*CeremonialPattern{
		"government_formal": {
			Pattern:    "dokumen|surat|permohonan|pengajuan",
			Context:    "government_services",
			FormalForm: "yang terhormat|dengan hormat|mohon dengan hormat",
			Region:     "Indonesia",
			Usage:      "formal_address",
			Examples:   []string{"Yang terhormat Bapak/Ibu", "Dengan hormat kami sampaikan"},
			Confidence: 0.9,
		},
		"traditional_respect": {
			Pattern:    "bapak|ibu|pak|bu",
			Context:    "respectful_address",
			FormalForm: "Bapak/Ibu yang terhormat",
			Region:     "Indonesia",
			Usage:      "respectful_greeting",
			Examples:   []string{"Bapak yang terhormat", "Ibu yang terhormat"},
			Confidence: 0.85,
		},
		"javanese_formal": {
			Pattern:    "kulo|dalem|njenengan",
			Context:    "javanese_formal",
			FormalForm: "kulo nuwun|matur nuwun",
			Region:     "Java",
			Usage:      "high_javanese",
			Examples:   []string{"kulo nuwun", "matur nuwun sanget"},
			Confidence: 0.9,
		},
		"religious_context": {
			Pattern:    "insyaallah|alhamdulillah|masya allah",
			Context:    "religious_expression",
			FormalForm: "dengan izin Allah|atas karunia Allah",
			Region:     "Indonesia",
			Usage:      "religious_courtesy",
			Examples:   []string{"Insya Allah akan diproses", "Alhamdulillah sudah selesai"},
			Confidence: 0.8,
		},
	}

	for key, pattern := range patterns {
		c.ceremonialLanguage[key] = pattern
	}
}

// initializeRegionalSensitivity initializes cultural sensitivity rules
func (c *CulturalContextEnhancer) initializeRegionalSensitivity() {
	rules := map[string]*SensitivityRule{
		"religious_sensitivity": {
			Trigger:     "agama|kepercayaan|ibadah",
			Region:      "Indonesia",
			Sensitivity: "high",
			Guidelines:  []string{"Use inclusive language", "Respect all faiths equally", "Avoid religious assumptions"},
			Alternatives: []string{"keyakinan", "spiritual", "tradisi"},
			Context:     "religious_topics",
		},
		"ethnic_sensitivity": {
			Trigger:     "suku|etnis|ras",
			Region:      "Indonesia",
			Sensitivity: "high",
			Guidelines:  []string{"Promote unity in diversity", "Avoid stereotypes", "Use respectful terminology"},
			Alternatives: []string{"keberagaman", "masyarakat Indonesia", "budaya nusantara"},
			Context:     "ethnic_topics",
		},
		"regional_pride": {
			Trigger:     "daerah|provinsi|kampung",
			Region:      "Indonesia",
			Sensitivity: "medium",
			Guidelines:  []string{"Respect regional identity", "Acknowledge local wisdom", "Avoid regional bias"},
			Alternatives: []string{"tanah air", "nusantara", "Indonesia"},
			Context:     "regional_identity",
		},
		"social_hierarchy": {
			Trigger:     "bos|atasan|bawahan",
			Region:      "Indonesia",
			Sensitivity: "medium",
			Guidelines:  []string{"Maintain respectful hierarchy", "Use appropriate titles", "Consider context"},
			Alternatives: []string{"pimpinan", "rekan kerja", "kolega"},
			Context:     "workplace_hierarchy",
		},
	}

	for key, rule := range rules {
		c.regionalSensitivity[key] = rule
	}
}

// analyzeCurrentEvents checks for relevant cultural events
func (c *CulturalContextEnhancer) analyzeCurrentEvents(analysis *CulturalAnalysis) {
	now := time.Now()
	currentDate := now.Format("01-02")
	
	for _, event := range c.culturalEvents {
		if event.Date == currentDate || event.Date == "variable" {
			// For variable dates (like religious holidays), we would need external calendar data
			// For now, we'll include major events that might be relevant
			if c.isEventRelevant(event, now) {
				analysis.CurrentEvents = append(analysis.CurrentEvents, *event)
			}
		}
	}
}

// analyzeTimeContext determines appropriate time-based context
func (c *CulturalContextEnhancer) analyzeTimeContext(analysis *CulturalAnalysis) {
	now := time.Now()
	currentHour := now.Hour()
	
	for _, timeContext := range c.timeBasedContexts {
		if c.isHourInRange(currentHour, timeContext.StartHour, timeContext.EndHour) {
			analysis.TimeContext = timeContext
			analysis.RecommendedTone = timeContext.Tone
			break
		}
	}
}

// analyzeCeremonialElements detects need for ceremonial/formal language
func (c *CulturalContextEnhancer) analyzeCeremonialElements(text string, analysis *CulturalAnalysis) {
	lowerText := strings.ToLower(text)
	
	for _, pattern := range c.ceremonialLanguage {
		if strings.Contains(lowerText, pattern.Pattern) {
			analysis.CeremonialElements = append(analysis.CeremonialElements, *pattern)
		}
	}
}

// analyzeCulturalSensitivity checks for cultural sensitivity requirements
func (c *CulturalContextEnhancer) analyzeCulturalSensitivity(text string, region string, analysis *CulturalAnalysis) {
	lowerText := strings.ToLower(text)
	
	for _, rule := range c.regionalSensitivity {
		if strings.Contains(lowerText, rule.Trigger) && (rule.Region == "Indonesia" || rule.Region == region) {
			analysis.SensitivityAlerts = append(analysis.SensitivityAlerts, *rule)
		}
	}
}

// generateCulturalAdaptations generates cultural adaptation recommendations
func (c *CulturalContextEnhancer) generateCulturalAdaptations(_ string, analysis *CulturalAnalysis) {
	adaptations := []string{}
	
	// Time-based adaptations
	if analysis.TimeContext != nil {
		adaptations = append(adaptations, 
			fmt.Sprintf("Use %s tone appropriate for %s", analysis.TimeContext.Tone, analysis.TimeContext.TimeRange))
	}
	
	// Event-based adaptations
	if len(analysis.CurrentEvents) > 0 {
		for _, event := range analysis.CurrentEvents {
			adaptations = append(adaptations, 
				fmt.Sprintf("Consider %s context with %s sensitivity", event.Context, event.Sensitivity))
		}
	}
	
	// Ceremonial adaptations
	if len(analysis.CeremonialElements) > 0 {
		adaptations = append(adaptations, "Use formal/ceremonial language elements")
	}
	
	// Sensitivity adaptations
	if len(analysis.SensitivityAlerts) > 0 {
		adaptations = append(adaptations, "Apply cultural sensitivity guidelines")
	}
	
	analysis.CulturalAdaptations = adaptations
}

// Helper methods

func (c *CulturalContextEnhancer) isEventRelevant(event *CulturalEvent, _ time.Time) bool {
	// Simple relevance check - in a real implementation, this would check
	// actual calendar dates for variable events like religious holidays
	return event.Type == "national" || event.Sensitivity == "high"
}

func (c *CulturalContextEnhancer) isHourInRange(hour, start, end int) bool {
	if start <= end {
		return hour >= start && hour < end
	}
	// Handle overnight ranges (e.g., 21-4)
	return hour >= start || hour < end
}

func (c *CulturalContextEnhancer) calculateCulturalConfidence(analysis *CulturalAnalysis) float64 {
	confidence := 0.6 // Base confidence
	
	// Boost confidence based on available context
	if analysis.TimeContext != nil {
		confidence += 0.1
	}
	
	if len(analysis.CurrentEvents) > 0 {
		confidence += 0.1
	}
	
	if len(analysis.CeremonialElements) > 0 {
		confidence += 0.1
	}
	
	if len(analysis.SensitivityAlerts) > 0 {
		confidence += 0.1
	}
	
	// Cap at 1.0
	if confidence > 1.0 {
		confidence = 1.0
	}
	
	return confidence
}

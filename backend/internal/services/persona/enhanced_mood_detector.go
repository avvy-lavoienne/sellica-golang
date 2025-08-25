package persona

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// EnhancedMoodDetector provides advanced mood detection capabilities migrated from Next.js
type EnhancedMoodDetector struct {
	moodPatterns     map[string][]*regexp.Regexp
	intensityMarkers map[string][]*regexp.Regexp
	confidenceRules  map[string]float64
	enabled          bool
}

// MoodDetectionResult represents comprehensive mood analysis results
type MoodDetectionResult struct {
	PrimaryMood        string                 `json:"primary_mood"`        // happy, neutral, confused, frustrated, anxious, excited, tired
	SecondaryMood      string                 `json:"secondary_mood"`      // secondary mood if detected
	Confidence         float64                `json:"confidence"`          // 0.0-1.0
	Indicators         []string               `json:"indicators"`          // specific indicators found
	EmotionalIntensity string                 `json:"emotional_intensity"` // low, medium, high
	SuggestedResponse  string                 `json:"suggested_response"`  // response style recommendation
	ProcessingTime     float64                `json:"processing_time"`     // processing time in milliseconds
	Metadata           map[string]interface{} `json:"metadata"`
}

// MoodAdaptationStrategy defines how to adapt responses based on detected mood
type MoodAdaptationStrategy struct {
	Mood                string   `json:"mood"`
	ResponseStyle       string   `json:"response_style"`       // empathetic, encouraging, clarifying, calming
	ToneAdjustment      string   `json:"tone_adjustment"`      // warmer, more_formal, reassuring, patient
	ContentModification []string `json:"content_modification"` // add_encouragement, simplify_language, provide_examples
	EscalationTrigger   bool     `json:"escalation_trigger"`   // whether to trigger escalation
}

// NewEnhancedMoodDetector creates a new enhanced mood detector with Next.js patterns
func NewEnhancedMoodDetector() *EnhancedMoodDetector {
	detector := &EnhancedMoodDetector{
		moodPatterns:     make(map[string][]*regexp.Regexp),
		intensityMarkers: make(map[string][]*regexp.Regexp),
		confidenceRules:  make(map[string]float64),
		enabled:          true,
	}

	detector.initializeMoodPatterns()
	detector.initializeIntensityMarkers()
	detector.initializeConfidenceRules()

	return detector
}

// DetectMood analyzes user query and context to detect mood with high accuracy
func (emd *EnhancedMoodDetector) DetectMood(ctx context.Context, query string, conversationHistory []string) (*MoodDetectionResult, error) {
	if !emd.enabled {
		return &MoodDetectionResult{
			PrimaryMood: "neutral",
			Confidence:  0.5,
		}, nil
	}

	startTime := time.Now()
	lowerQuery := strings.ToLower(query)
	
	// Initialize mood scores
	moodScores := map[string]float64{
		"happy":      0.0,
		"neutral":    0.5, // baseline
		"confused":   0.0,
		"frustrated": 0.0,
		"anxious":    0.0,
		"excited":    0.0,
		"tired":      0.0,
	}

	indicators := []string{}

	// Analyze each mood pattern
	for mood, patterns := range emd.moodPatterns {
		score := emd.calculateMoodScore(lowerQuery, patterns)
		if score > 0 {
			moodScores[mood] += score
			indicators = append(indicators, mood+"_patterns")
		}
	}

	// Consider conversation history for context
	if len(conversationHistory) > 0 {
		historyScore := emd.analyzeConversationHistory(conversationHistory)
		for mood, score := range historyScore {
			moodScores[mood] += score * 0.3 // Weight history lower than current query
		}
	}

	// Determine primary and secondary moods
	primaryMood, primaryScore := emd.findHighestScore(moodScores)
	secondaryMood := emd.findSecondaryMood(moodScores, primaryMood)

	// Calculate confidence based on score difference and pattern strength
	confidence := emd.calculateConfidence(primaryScore, moodScores)

	// Determine emotional intensity
	intensity := emd.determineEmotionalIntensity(lowerQuery, primaryMood)

	// Generate response strategy
	responseStrategy := emd.generateResponseStrategy(primaryMood, intensity, confidence)

	processingTime := float64(time.Since(startTime).Nanoseconds()) / 1e6

	result := &MoodDetectionResult{
		PrimaryMood:        primaryMood,
		SecondaryMood:      secondaryMood,
		Confidence:         confidence,
		Indicators:         indicators,
		EmotionalIntensity: intensity,
		SuggestedResponse:  responseStrategy,
		ProcessingTime:     processingTime,
		Metadata: map[string]interface{}{
			"mood_scores":        moodScores,
			"pattern_matches":    len(indicators),
			"history_considered": len(conversationHistory) > 0,
			"detector_version":   "2.0_migrated_from_nextjs",
		},
	}

	logrus.WithFields(logrus.Fields{
		"primary_mood":   primaryMood,
		"confidence":     confidence,
		"intensity":      intensity,
		"processing_ms":  processingTime,
		"indicators":     len(indicators),
	}).Debug("Enhanced mood detection completed")

	return result, nil
}

// initializeMoodPatterns sets up comprehensive mood detection patterns from Next.js
func (emd *EnhancedMoodDetector) initializeMoodPatterns() {
	// Happy mood patterns
	emd.moodPatterns["happy"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(senang|gembira|bahagia|suka|terima kasih|makasih|bagus|mantap|keren|oke|siap)\b`),
		regexp.MustCompile(`\b(alhamdulillah|syukur|luar biasa|hebat|perfect|sempurna)\b`),
		regexp.MustCompile(`😊|😄|😃|🙂|👍|✨|🎉`),
		regexp.MustCompile(`\b(berhasil|sukses|lancar|mudah|cepat)\b`),
	}

	// Confused mood patterns
	emd.moodPatterns["confused"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(bingung|tidak mengerti|tidak paham|gimana|bagaimana|apa itu|maksudnya)\b`),
		regexp.MustCompile(`\b(tidak tahu|ga tau|gak tau|kurang jelas|tidak jelas)\b`),
		regexp.MustCompile(`\b(hah|eh|apa|ya|emang|memang|kok|kenapa)\b`),
		regexp.MustCompile(`\?\?\?|😕|😵|🤔|❓`),
		regexp.MustCompile(`\b(cara|caranya|prosedur|langkah|step|tahap)\b.*\?`),
	}

	// Frustrated mood patterns
	emd.moodPatterns["frustrated"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(kesal|jengkel|marah|sebel|dongkol|geram)\b`),
		regexp.MustCompile(`\b(susah|sulit|ribet|rumit|lama|lambat|lelet)\b`),
		regexp.MustCompile(`\b(tidak bisa|ga bisa|gak bisa|gagal|error|salah)\b`),
		regexp.MustCompile(`😠|😡|🤬|💢|😤`),
		regexp.MustCompile(`\b(kenapa sih|kok gini|masa|aduh|astaga|ya ampun)\b`),
		regexp.MustCompile(`\b(udah|sudah).*\b(coba|nyoba|test|tes)\b.*\b(berkali|berulang|terus)\b`),
	}

	// Anxious mood patterns
	emd.moodPatterns["anxious"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(khawatir|cemas|takut|was-was|deg-degan)\b`),
		regexp.MustCompile(`\b(urgent|mendesak|penting|segera|cepat|buru-buru)\b`),
		regexp.MustCompile(`\b(deadline|batas waktu|terbatas|habis|expired)\b`),
		regexp.MustCompile(`😰|😨|😟|😧|🥺`),
		regexp.MustCompile(`\b(gimana nih|bagaimana ini|tolong|help|bantuan)\b`),
		regexp.MustCompile(`\b(harus|wajib|kudu|mesti).*\b(hari ini|sekarang|segera)\b`),
	}

	// Excited mood patterns
	emd.moodPatterns["excited"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(wah|wow|keren|mantap|asik|seru|hebat)\b`),
		regexp.MustCompile(`\b(pengen|ingin|mau|butuh).*\b(banget|sekali|sangat)\b`),
		regexp.MustCompile(`🤩|😍|🔥|⚡|🚀|💪`),
		regexp.MustCompile(`!!!|!{2,}`),
		regexp.MustCompile(`\b(akhirnya|finally|yeay|yes|siap|go|gas)\b`),
	}

	// Tired mood patterns
	emd.moodPatterns["tired"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(capek|lelah|pusing|mumet|bete|males)\b`),
		regexp.MustCompile(`\b(udah|sudah).*\b(lama|banyak|sering)\b.*\b(coba|nyoba|urus)\b`),
		regexp.MustCompile(`😴|😪|🥱|😑|😐`),
		regexp.MustCompile(`\b(kok|kenapa).*\b(susah|sulit|ribet|lama)\b.*\b(banget|sekali)\b`),
		regexp.MustCompile(`\b(pengen|ingin|mau).*\b(selesai|beres|kelar|finish)\b`),
	}
}

// initializeIntensityMarkers sets up emotional intensity detection patterns
func (emd *EnhancedMoodDetector) initializeIntensityMarkers() {
	// High intensity markers
	emd.intensityMarkers["high"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(banget|sekali|sangat|amat|bener-bener|beneran)\b`),
		regexp.MustCompile(`!!!|!{3,}|\?\?\?|\?{3,}`),
		regexp.MustCompile(`\b(parah|gila|gak nahan|ga tahan|extreme)\b`),
		regexp.MustCompile(`[A-Z]{3,}|[a-z]+[A-Z]{2,}`), // CAPS or mixed case emphasis
	}

	// Medium intensity markers
	emd.intensityMarkers["medium"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(agak|cukup|lumayan|rada|sedikit)\b`),
		regexp.MustCompile(`!!|\?\?`),
		regexp.MustCompile(`\b(nih|sih|deh|dong|lah)\b`),
	}

	// Low intensity markers (default if no high/medium found)
	emd.intensityMarkers["low"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(mungkin|kayaknya|sepertinya|kira-kira)\b`),
		regexp.MustCompile(`\b(biasa|normal|standar|ok|oke)\b`),
	}
}

// initializeConfidenceRules sets up confidence calculation rules
func (emd *EnhancedMoodDetector) initializeConfidenceRules() {
	emd.confidenceRules = map[string]float64{
		"single_strong_pattern": 0.8,
		"multiple_patterns":     0.9,
		"with_emoji":           0.85,
		"with_intensity":       0.9,
		"with_history":         0.95,
		"baseline":             0.6,
	}
}

// calculateMoodScore calculates mood score for given patterns
func (emd *EnhancedMoodDetector) calculateMoodScore(query string, patterns []*regexp.Regexp) float64 {
	score := 0.0
	matches := 0

	for _, pattern := range patterns {
		if pattern.MatchString(query) {
			matches++
			score += 0.3 // Each pattern match adds to score
		}
	}

	// Bonus for multiple pattern matches
	if matches > 1 {
		score += float64(matches-1) * 0.2
	}

	// Cap at 1.0
	if score > 1.0 {
		score = 1.0
	}

	return score
}

// analyzeConversationHistory analyzes conversation history for mood context
func (emd *EnhancedMoodDetector) analyzeConversationHistory(history []string) map[string]float64 {
	historyScores := map[string]float64{
		"happy": 0.0, "neutral": 0.0, "confused": 0.0,
		"frustrated": 0.0, "anxious": 0.0, "excited": 0.0, "tired": 0.0,
	}

	// Analyze last 3 messages for mood progression
	start := len(history) - 3
	if start < 0 {
		start = 0
	}

	for i := start; i < len(history); i++ {
		lowerMsg := strings.ToLower(history[i])
		for mood, patterns := range emd.moodPatterns {
			score := emd.calculateMoodScore(lowerMsg, patterns)
			historyScores[mood] += score * 0.5 // Reduce weight for history
		}
	}

	return historyScores
}

// findHighestScore finds the mood with highest score
func (emd *EnhancedMoodDetector) findHighestScore(scores map[string]float64) (string, float64) {
	maxMood := "neutral"
	maxScore := scores["neutral"]

	for mood, score := range scores {
		if score > maxScore {
			maxMood = mood
			maxScore = score
		}
	}

	return maxMood, maxScore
}

// findSecondaryMood finds secondary mood if significantly present
func (emd *EnhancedMoodDetector) findSecondaryMood(scores map[string]float64, primaryMood string) string {
	secondaryMood := ""
	secondaryScore := 0.0

	for mood, score := range scores {
		if mood != primaryMood && score > secondaryScore && score > 0.3 {
			secondaryMood = mood
			secondaryScore = score
		}
	}

	return secondaryMood
}

// calculateConfidence calculates confidence based on score patterns
func (emd *EnhancedMoodDetector) calculateConfidence(primaryScore float64, allScores map[string]float64) float64 {
	// Base confidence from primary score
	confidence := emd.confidenceRules["baseline"] + (primaryScore * 0.3)

	// Bonus for clear winner (significant gap between primary and others)
	secondHighest := 0.0
	for _, score := range allScores {
		if score > secondHighest && score < primaryScore {
			secondHighest = score
		}
	}

	gap := primaryScore - secondHighest
	if gap > 0.4 {
		confidence += 0.2
	}

	// Cap at 1.0
	if confidence > 1.0 {
		confidence = 1.0
	}

	return confidence
}

// determineEmotionalIntensity determines emotional intensity level
func (emd *EnhancedMoodDetector) determineEmotionalIntensity(query string, mood string) string {
	// Check for high intensity markers
	for _, pattern := range emd.intensityMarkers["high"] {
		if pattern.MatchString(query) {
			return "high"
		}
	}

	// Check for medium intensity markers
	for _, pattern := range emd.intensityMarkers["medium"] {
		if pattern.MatchString(query) {
			return "medium"
		}
	}

	// Default to low intensity
	return "low"
}

// generateResponseStrategy generates appropriate response strategy based on mood
func (emd *EnhancedMoodDetector) generateResponseStrategy(mood, intensity string, confidence float64) string {
	strategies := map[string]map[string]string{
		"happy": {
			"low":    "maintain_positive_tone",
			"medium": "enthusiastic_response",
			"high":   "celebrate_with_user",
		},
		"confused": {
			"low":    "gentle_clarification",
			"medium": "step_by_step_explanation",
			"high":   "detailed_guidance_with_examples",
		},
		"frustrated": {
			"low":    "patient_assistance",
			"medium": "empathetic_problem_solving",
			"high":   "immediate_escalation_consideration",
		},
		"anxious": {
			"low":    "reassuring_response",
			"medium": "calming_with_clear_steps",
			"high":   "urgent_priority_handling",
		},
		"excited": {
			"low":    "match_enthusiasm",
			"medium": "energetic_assistance",
			"high":   "channel_excitement_productively",
		},
		"tired": {
			"low":    "efficient_response",
			"medium": "simplified_explanation",
			"high":   "quick_resolution_focus",
		},
	}

	if moodStrategies, exists := strategies[mood]; exists {
		if strategy, exists := moodStrategies[intensity]; exists {
			return strategy
		}
	}

	return "standard_helpful_response"
}

// GetMoodAdaptationStrategy returns adaptation strategy for detected mood
func (emd *EnhancedMoodDetector) GetMoodAdaptationStrategy(mood *MoodDetectionResult) *MoodAdaptationStrategy {
	adaptations := map[string]*MoodAdaptationStrategy{
		"happy": {
			Mood:                "happy",
			ResponseStyle:       "enthusiastic",
			ToneAdjustment:      "warmer",
			ContentModification: []string{"maintain_positivity", "build_on_enthusiasm"},
			EscalationTrigger:   false,
		},
		"confused": {
			Mood:                "confused",
			ResponseStyle:       "clarifying",
			ToneAdjustment:      "patient",
			ContentModification: []string{"simplify_language", "provide_examples", "step_by_step"},
			EscalationTrigger:   false,
		},
		"frustrated": {
			Mood:                "frustrated",
			ResponseStyle:       "empathetic",
			ToneAdjustment:      "calming",
			ContentModification: []string{"acknowledge_frustration", "provide_solutions", "offer_alternatives"},
			EscalationTrigger:   mood.EmotionalIntensity == "high",
		},
		"anxious": {
			Mood:                "anxious",
			ResponseStyle:       "reassuring",
			ToneAdjustment:      "calming",
			ContentModification: []string{"provide_reassurance", "clear_timeline", "priority_handling"},
			EscalationTrigger:   mood.EmotionalIntensity == "high",
		},
		"excited": {
			Mood:                "excited",
			ResponseStyle:       "energetic",
			ToneAdjustment:      "matching_enthusiasm",
			ContentModification: []string{"match_energy", "channel_excitement", "provide_clear_next_steps"},
			EscalationTrigger:   false,
		},
		"tired": {
			Mood:                "tired",
			ResponseStyle:       "efficient",
			ToneAdjustment:      "concise",
			ContentModification: []string{"streamline_response", "focus_on_essentials", "quick_resolution"},
			EscalationTrigger:   false,
		},
	}

	if strategy, exists := adaptations[mood.PrimaryMood]; exists {
		return strategy
	}

	// Default strategy
	return &MoodAdaptationStrategy{
		Mood:                "neutral",
		ResponseStyle:       "helpful",
		ToneAdjustment:      "professional",
		ContentModification: []string{"standard_response"},
		EscalationTrigger:   false,
	}
}

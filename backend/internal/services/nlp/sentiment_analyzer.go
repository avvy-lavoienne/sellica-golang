package nlp

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// SentimentAnalyzer handles Indonesian sentiment analysis
type SentimentAnalyzer struct {
	positiveWords   map[string]float64
	negativeWords   map[string]float64
	emotionPatterns map[string]*regexp.Regexp
	politenessRules []PolitenessRule
	intensifiers    map[string]float64
	negationWords   []string
}

// PolitenessRule represents rules for detecting politeness in Indonesian
type PolitenessRule struct {
	Pattern     *regexp.Regexp
	Score       float64
	Description string
}

// NewSentimentAnalyzer creates a new Indonesian sentiment analyzer
func NewSentimentAnalyzer() (*SentimentAnalyzer, error) {
	analyzer := &SentimentAnalyzer{
		positiveWords:   make(map[string]float64),
		negativeWords:   make(map[string]float64),
		emotionPatterns: make(map[string]*regexp.Regexp),
		intensifiers:    make(map[string]float64),
	}

	if err := analyzer.initializeLexicons(); err != nil {
		return nil, fmt.Errorf("failed to initialize sentiment lexicons: %w", err)
	}

	logrus.Debug("Sentiment analyzer initialized with Indonesian lexicons")
	return analyzer, nil
}

// Analyze analyzes sentiment of Indonesian text
func (sa *SentimentAnalyzer) Analyze(text string, context map[string]interface{}) (*SentimentAnalysis, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	// Normalize text
	normalizedText := strings.ToLower(strings.TrimSpace(text))
	words := strings.Fields(normalizedText)

	// Calculate base sentiment score
	sentimentScore := sa.calculateSentimentScore(words)

	// Detect emotions
	emotions := sa.detectEmotions(normalizedText)

	// Calculate politeness score
	politenessScore := sa.calculatePoliteness(normalizedText)

	// Determine overall sentiment
	sentiment := sa.determineSentiment(sentimentScore)

	// Calculate confidence
	confidence := sa.calculateConfidence(sentimentScore, len(words), emotions)

	result := &SentimentAnalysis{
		Sentiment:  sentiment,
		Score:      sentimentScore,
		Confidence: confidence,
		Emotions:   emotions,
		Politeness: politenessScore,
	}

	logrus.WithFields(logrus.Fields{
		"text_length": len(text),
		"sentiment":   result.Sentiment,
		"score":       result.Score,
		"confidence":  result.Confidence,
		"politeness":  result.Politeness,
		"emotions":    len(result.Emotions),
	}).Debug("Sentiment analysis completed")

	return result, nil
}

// initializeLexicons initializes Indonesian sentiment lexicons
func (sa *SentimentAnalyzer) initializeLexicons() error {
	// Positive words with scores
	positiveWords := map[string]float64{
		// Basic positive words
		"baik":             0.7,
		"bagus":            0.8,
		"hebat":            0.9,
		"luar biasa":       1.0,
		"mantap":           0.8,
		"keren":            0.7,
		"oke":              0.5,
		"setuju":           0.6,
		"suka":             0.7,
		"senang":           0.8,
		"gembira":          0.9,
		"bahagia":          0.9,
		"puas":             0.7,
		"terima kasih":     0.8,
		"makasih":          0.7,
		"thanks":           0.7,
		"sukses":           0.8,
		"berhasil":         0.8,
		"lancar":           0.7,
		"mudah":            0.6,
		"cepat":            0.6,
		"efisien":          0.7,
		"profesional":      0.8,
		"ramah":            0.7,
		"sopan":            0.7,
		"membantu":         0.8,
		"memuaskan":        0.8,
		"recommended":      0.7,
		"direkomendasikan": 0.7,
	}

	// Negative words with scores
	negativeWords := map[string]float64{
		// Basic negative words
		"buruk":      -0.8,
		"jelek":      -0.7,
		"tidak":      -0.5,
		"bukan":      -0.4,
		"gagal":      -0.8,
		"salah":      -0.6,
		"error":      -0.7,
		"rusak":      -0.8,
		"bermasalah": -0.7,
		"sulit":      -0.6,
		"susah":      -0.6,
		"ribet":      -0.7,
		"lama":       -0.5,
		"lambat":     -0.6,
		"mahal":      -0.5,
		"kecewa":     -0.8,
		"kesal":      -0.7,
		"marah":      -0.8,
		"benci":      -0.9,
		"sedih":      -0.7,
		"frustasi":   -0.8,
		"stress":     -0.7,
		"bingung":    -0.5,
		"tidak puas": -0.8,
		"komplain":   -0.7,
		"keluhan":    -0.6,
		"protes":     -0.7,
		"tidak suka": -0.7,
		"menolak":    -0.6,
		"tolak":      -0.6,
	}

	sa.positiveWords = positiveWords
	sa.negativeWords = negativeWords

	// Initialize intensifiers
	sa.intensifiers = map[string]float64{
		"sangat":  1.5,
		"amat":    1.4,
		"sekali":  1.3,
		"banget":  1.3,
		"bener":   1.2,
		"benar":   1.2,
		"agak":    0.7,
		"sedikit": 0.6,
		"kurang":  0.5,
		"lumayan": 0.8,
		"cukup":   0.7,
	}

	// Initialize negation words
	sa.negationWords = []string{
		"tidak", "bukan", "belum", "jangan", "tanpa", "minus", "kurang", "gagal",
	}

	// Initialize emotion patterns
	emotionPatterns := map[string]string{
		"joy":      `\b(senang|gembira|bahagia|suka|ceria|riang|girang)\b`,
		"anger":    `\b(marah|kesal|jengkel|dongkol|sebel|benci)\b`,
		"sadness":  `\b(sedih|kecewa|galau|murung|duka|nestapa)\b`,
		"fear":     `\b(takut|khawatir|cemas|was-was|panik|ngeri)\b`,
		"surprise": `\b(kaget|heran|terkejut|tercengang|bingung)\b`,
		"disgust":  `\b(jijik|muak|mual|eneg|geli)\b`,
	}

	for emotion, pattern := range emotionPatterns {
		compiled, err := regexp.Compile(`(?i)` + pattern)
		if err != nil {
			return fmt.Errorf("failed to compile emotion pattern for %s: %w", emotion, err)
		}
		sa.emotionPatterns[emotion] = compiled
	}

	// Initialize politeness rules
	if err := sa.initializePolitenessRules(); err != nil {
		return fmt.Errorf("failed to initialize politeness rules: %w", err)
	}

	return nil
}

// calculateSentimentScore calculates sentiment score from words
func (sa *SentimentAnalyzer) calculateSentimentScore(words []string) float64 {
	var totalScore float64
	var wordCount int
	negationActive := false
	intensifierMultiplier := 1.0

	for i, word := range words {
		// Check for negation
		if sa.isNegationWord(word) {
			negationActive = true
			continue
		}

		// Check for intensifiers
		if multiplier, isIntensifier := sa.intensifiers[word]; isIntensifier {
			intensifierMultiplier = multiplier
			continue
		}

		// Calculate word sentiment
		var wordScore float64
		if score, isPositive := sa.positiveWords[word]; isPositive {
			wordScore = score
		} else if score, isNegative := sa.negativeWords[word]; isNegative {
			wordScore = score
		}

		// Apply modifiers
		if wordScore != 0 {
			// Apply intensifier
			wordScore *= intensifierMultiplier

			// Apply negation
			if negationActive {
				wordScore *= -1
				negationActive = false // Reset negation
			}

			totalScore += wordScore
			wordCount++
		}

		// Reset intensifier after use
		intensifierMultiplier = 1.0

		// Reset negation after 2 words
		if negationActive && i > 0 {
			negationActive = false
		}
	}

	if wordCount == 0 {
		return 0.0
	}

	// Normalize score to [-1, 1] range
	averageScore := totalScore / float64(wordCount)
	if averageScore > 1.0 {
		averageScore = 1.0
	} else if averageScore < -1.0 {
		averageScore = -1.0
	}

	return averageScore
}

// detectEmotions detects emotions in text
func (sa *SentimentAnalyzer) detectEmotions(text string) []EmotionScore {
	var emotions []EmotionScore

	for emotion, pattern := range sa.emotionPatterns {
		matches := pattern.FindAllString(text, -1)
		if len(matches) > 0 {
			// Calculate emotion score based on frequency and context
			score := float64(len(matches)) * 0.3
			if score > 1.0 {
				score = 1.0
			}

			emotions = append(emotions, EmotionScore{
				Emotion: emotion,
				Score:   score,
			})
		}
	}

	return emotions
}

// calculatePoliteness calculates politeness score
func (sa *SentimentAnalyzer) calculatePoliteness(text string) float64 {
	var totalScore float64
	var ruleCount int

	for _, rule := range sa.politenessRules {
		if rule.Pattern.MatchString(text) {
			totalScore += rule.Score
			ruleCount++
		}
	}

	if ruleCount == 0 {
		return 0.5 // Neutral politeness
	}

	// Normalize to [0, 1] range
	averageScore := totalScore / float64(ruleCount)
	if averageScore > 1.0 {
		averageScore = 1.0
	} else if averageScore < 0.0 {
		averageScore = 0.0
	}

	return averageScore
}

// determineSentiment determines overall sentiment category
func (sa *SentimentAnalyzer) determineSentiment(score float64) string {
	if score > 0.1 {
		return "positive"
	} else if score < -0.1 {
		return "negative"
	} else {
		return "neutral"
	}
}

// calculateConfidence calculates confidence score
func (sa *SentimentAnalyzer) calculateConfidence(score float64, wordCount int, emotions []EmotionScore) float64 {
	confidence := 0.5 // Base confidence

	// Score magnitude contributes to confidence
	confidence += absSentiment(score) * 0.3

	// Word count contributes to confidence
	if wordCount > 5 {
		confidence += 0.1
	}
	if wordCount > 10 {
		confidence += 0.1
	}

	// Emotion detection contributes to confidence
	if len(emotions) > 0 {
		confidence += 0.1
	}

	// Cap confidence at 0.95
	if confidence > 0.95 {
		confidence = 0.95
	}

	return confidence
}

// initializePolitenessRules initializes politeness detection rules
func (sa *SentimentAnalyzer) initializePolitenessRules() error {
	rules := []struct {
		pattern string
		score   float64
		desc    string
	}{
		{`\b(?:mohon|tolong|silakan|please)\b`, 0.8, "polite request"},
		{`\b(?:terima kasih|makasih|thanks)\b`, 0.9, "gratitude expression"},
		{`\b(?:maaf|sorry|permisi|excuse me)\b`, 0.7, "apology/excuse"},
		{`\b(?:selamat|congratulations)\b`, 0.8, "congratulations"},
		{`\b(?:dengan hormat|hormat saya)\b`, 1.0, "formal respect"},
		{`\b(?:bapak|ibu|saudara|anda)\b`, 0.6, "respectful address"},
		{`\b(?:semoga|mudah-mudahan|insya allah)\b`, 0.5, "hopeful expression"},
		{`\b(?:gue|lu|lo)\b`, 0.2, "informal pronouns"},
		{`\b(?:anjir|bangsat|brengsek)\b`, 0.0, "rude language"},
	}

	for _, rule := range rules {
		compiled, err := regexp.Compile(`(?i)` + rule.pattern)
		if err != nil {
			return fmt.Errorf("failed to compile politeness rule: %w", err)
		}

		sa.politenessRules = append(sa.politenessRules, PolitenessRule{
			Pattern:     compiled,
			Score:       rule.score,
			Description: rule.desc,
		})
	}

	return nil
}

// isNegationWord checks if a word is a negation word
func (sa *SentimentAnalyzer) isNegationWord(word string) bool {
	for _, negWord := range sa.negationWords {
		if word == negWord {
			return true
		}
	}
	return false
}

// absSentiment returns absolute value of float64 for sentiment analysis
func absSentiment(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

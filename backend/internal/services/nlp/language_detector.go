package nlp

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// LanguageDetector handles Indonesian language and dialect detection
type LanguageDetector struct {
	indonesianPatterns map[string]*regexp.Regexp
	dialectPatterns    map[string][]string
	formalityMarkers   map[FormalityLevel][]string
	scriptDetectors    map[string]*regexp.Regexp
}

// NewLanguageDetector creates a new Indonesian language detector
func NewLanguageDetector() (*LanguageDetector, error) {
	detector := &LanguageDetector{
		indonesianPatterns: make(map[string]*regexp.Regexp),
		dialectPatterns:    make(map[string][]string),
		formalityMarkers:   make(map[FormalityLevel][]string),
		scriptDetectors:    make(map[string]*regexp.Regexp),
	}

	if err := detector.initializePatterns(); err != nil {
		return nil, fmt.Errorf("failed to initialize language patterns: %w", err)
	}

	logrus.Debug("Language detector initialized with Indonesian patterns")
	return detector, nil
}

// Detect detects language, dialect, and formality of Indonesian text
func (ld *LanguageDetector) Detect(text string, context map[string]interface{}) (*LanguageDetection, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	// Clean and normalize text
	normalizedText := ld.normalizeText(text)

	// Detect language
	language := ld.detectLanguage(normalizedText)
	
	// Detect dialect
	dialect := ld.detectDialect(normalizedText)
	
	// Detect formality level
	formality := ld.detectFormality(normalizedText)
	
	// Detect script
	script := ld.detectScript(text)
	
	// Calculate confidence based on various factors
	confidence := ld.calculateConfidence(normalizedText, language, dialect, formality)

	result := &LanguageDetection{
		Language:   language,
		Dialect:    dialect,
		Formality:  string(formality),
		Confidence: confidence,
		Script:     script,
	}

	logrus.WithFields(logrus.Fields{
		"language":   result.Language,
		"dialect":    result.Dialect,
		"formality":  result.Formality,
		"confidence": result.Confidence,
		"script":     result.Script,
	}).Debug("Language detection completed")

	return result, nil
}

// initializePatterns initializes language detection patterns
func (ld *LanguageDetector) initializePatterns() error {
	// Indonesian language patterns
	patterns := map[string]string{
		"indonesian_basic":      `\b(yang|dan|atau|dengan|untuk|dari|ke|di|pada|dalam|oleh|akan|telah|sudah|belum|tidak|bukan)\b`,
		"indonesian_pronouns":   `\b(saya|aku|kamu|anda|dia|mereka|kita|kami|ia|beliau)\b`,
		"indonesian_particles":  `\b(lah|kah|pun|tah)\b`,
		"indonesian_prefixes":   `\b(ber|me|di|ter|pe|se|ke)\w+`,
		"indonesian_suffixes":   `\w+(kan|an|nya|i|in)\b`,
	}

	for name, pattern := range patterns {
		compiled, err := regexp.Compile(`(?i)` + pattern)
		if err != nil {
			return fmt.Errorf("failed to compile pattern %s: %w", name, err)
		}
		ld.indonesianPatterns[name] = compiled
	}

	// Dialect patterns
	ld.dialectPatterns = map[string][]string{
		"jakarta": {"gue", "lu", "nih", "sih", "dong", "deh", "banget", "abis", "udah", "udeh"},
		"javanese": {"opo", "piye", "wis", "ora", "nek", "yo", "lho", "kok", "tenan", "ngono"},
		"sundanese": {"naon", "kumaha", "teu", "aya", "mah", "teh", "ge", "sia", "urang", "abdi"},
		"batak": {"aha", "songon", "dohot", "tu", "di", "na", "holan", "nunga", "alai", "boi"},
		"minang": {"apo", "baa", "indak", "ado", "ka", "di", "nan", "tu", "lai", "bana"},
		"betawi": {"ape", "gimane", "kagak", "ade", "ke", "di", "yang", "tuh", "dah", "bener"},
	}

	// Formality markers
	ld.formalityMarkers = map[FormalityLevel][]string{
		FormalityVeryFormal: {
			"dengan hormat", "yang terhormat", "bersama ini", "demikian", "atas perhatian",
			"sebelumnya", "sesudahnya", "berkenaan", "sehubungan", "menindaklanjuti",
		},
		FormalityFormal: {
			"mohon", "silakan", "terima kasih", "selamat", "maaf", "permisi",
			"dengan", "kepada", "dari", "untuk", "mengenai",
		},
		FormalityNeutral: {
			"tolong", "minta", "kasih", "bilang", "tanya", "coba", "lihat", "dengar",
		},
		FormalityInformal: {
			"gimana", "kayak", "banget", "abis", "udah", "emang", "sih", "dong",
		},
		FormalityVeryInformal: {
			"gue", "lu", "lo", "gw", "anjir", "wkwk", "woy", "bro", "sis",
		},
	}

	// Script detectors
	scriptPatterns := map[string]string{
		"latin":  `[a-zA-Z]`,
		"arabic": `[؀-ۿ]`, // Arabic Unicode range
		"number": `[0-9]`,
	}

	for name, pattern := range scriptPatterns {
		compiled, err := regexp.Compile(pattern)
		if err != nil {
			return fmt.Errorf("failed to compile script pattern %s: %w", name, err)
		}
		ld.scriptDetectors[name] = compiled
	}

	return nil
}

// normalizeText normalizes Indonesian text for processing
func (ld *LanguageDetector) normalizeText(text string) string {
	// Convert to lowercase
	normalized := strings.ToLower(text)
	
	// Remove extra whitespace
	normalized = regexp.MustCompile(`\s+`).ReplaceAllString(normalized, " ")
	
	// Trim whitespace
	normalized = strings.TrimSpace(normalized)
	
	return normalized
}

// detectLanguage detects if text is Indonesian
func (ld *LanguageDetector) detectLanguage(text string) string {
	indonesianScore := 0
	totalPatterns := len(ld.indonesianPatterns)

	for _, pattern := range ld.indonesianPatterns {
		if pattern.MatchString(text) {
			indonesianScore++
		}
	}

	// If more than 60% of patterns match, consider it Indonesian
	if float64(indonesianScore)/float64(totalPatterns) > 0.6 {
		return "indonesian"
	}

	// Check for basic Indonesian words
	basicWords := []string{"dan", "atau", "dengan", "untuk", "dari", "yang", "tidak", "adalah"}
	wordCount := 0
	words := strings.Fields(text)
	
	for _, word := range words {
		for _, basicWord := range basicWords {
			if word == basicWord {
				wordCount++
				break
			}
		}
	}

	if len(words) > 0 && float64(wordCount)/float64(len(words)) > 0.1 {
		return "indonesian"
	}

	return "unknown"
}

// detectDialect detects Indonesian dialect
func (ld *LanguageDetector) detectDialect(text string) string {
	dialectScores := make(map[string]int)
	
	for dialect, markers := range ld.dialectPatterns {
		score := 0
		for _, marker := range markers {
			if strings.Contains(text, marker) {
				score++
			}
		}
		dialectScores[dialect] = score
	}

	// Find dialect with highest score
	maxScore := 0
	detectedDialect := "standard"
	
	for dialect, score := range dialectScores {
		if score > maxScore {
			maxScore = score
			detectedDialect = dialect
		}
	}

	// Only return dialect if score is significant
	if maxScore >= 2 {
		return detectedDialect
	}

	return "standard"
}

// detectFormality detects formality level
func (ld *LanguageDetector) detectFormality(text string) FormalityLevel {
	formalityScores := make(map[FormalityLevel]int)
	
	for level, markers := range ld.formalityMarkers {
		score := 0
		for _, marker := range markers {
			if strings.Contains(text, marker) {
				score++
			}
		}
		formalityScores[level] = score
	}

	// Find formality level with highest score
	maxScore := 0
	detectedFormality := FormalityNeutral
	
	for level, score := range formalityScores {
		if score > maxScore {
			maxScore = score
			detectedFormality = level
		}
	}

	return detectedFormality
}

// detectScript detects script type
func (ld *LanguageDetector) detectScript(text string) string {
	scriptCounts := make(map[string]int)
	
	for script, detector := range ld.scriptDetectors {
		matches := detector.FindAllString(text, -1)
		scriptCounts[script] = len(matches)
	}

	// Determine primary script
	totalChars := 0
	for _, count := range scriptCounts {
		totalChars += count
	}

	if totalChars == 0 {
		return "unknown"
	}

	// Check for mixed scripts
	latinRatio := float64(scriptCounts["latin"]) / float64(totalChars)
	arabicRatio := float64(scriptCounts["arabic"]) / float64(totalChars)

	if latinRatio > 0.8 {
		return "latin"
	} else if arabicRatio > 0.8 {
		return "arabic"
	} else if latinRatio > 0.3 && arabicRatio > 0.3 {
		return "mixed"
	}

	return "latin" // default
}

// calculateConfidence calculates detection confidence
func (ld *LanguageDetector) calculateConfidence(text, language, dialect string, formality FormalityLevel) float64 {
	confidence := 0.5 // base confidence

	// Language confidence
	if language == "indonesian" {
		confidence += 0.3
		
		// Check for Indonesian-specific patterns
		indonesianWords := 0
		words := strings.Fields(text)
		
		for _, word := range words {
			if ld.isIndonesianWord(word) {
				indonesianWords++
			}
		}
		
		if len(words) > 0 {
			wordRatio := float64(indonesianWords) / float64(len(words))
			confidence += wordRatio * 0.2
		}
	}

	// Dialect confidence
	if dialect != "standard" {
		confidence += 0.1
	}

	// Formality confidence
	if formality != FormalityNeutral {
		confidence += 0.1
	}

	// Text length factor
	if len(text) > 100 {
		confidence += 0.05
	}

	// Cap confidence at 0.95
	if confidence > 0.95 {
		confidence = 0.95
	}

	return confidence
}

// isIndonesianWord checks if a word is Indonesian
func (ld *LanguageDetector) isIndonesianWord(word string) bool {
	// Check against common Indonesian words
	commonWords := []string{
		"yang", "dan", "atau", "dengan", "untuk", "dari", "ke", "di", "pada", "dalam",
		"oleh", "akan", "telah", "sudah", "belum", "tidak", "bukan", "adalah", "ada",
		"saya", "aku", "kamu", "anda", "dia", "mereka", "kita", "kami", "ini", "itu",
	}

	for _, commonWord := range commonWords {
		if word == commonWord {
			return true
		}
	}

	// Check for Indonesian morphological patterns
	for _, pattern := range ld.indonesianPatterns {
		if pattern.MatchString(word) {
			return true
		}
	}

	return false
}

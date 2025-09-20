package nlp

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// CulturalAnalyzer handles Indonesian cultural context analysis
type CulturalAnalyzer struct {
	regionalMarkers    map[string][]RegionalMarker
	culturalPatterns   map[CulturalContext][]CulturalPattern
	formalityIndicators map[FormalityLevel][]string
}

// RegionalMarker represents regional cultural markers
type RegionalMarker struct {
	Text        string
	Region      string
	Type        string
	Confidence  float64
	Description string
}

// CulturalPattern represents cultural patterns in Indonesian text
type CulturalPattern struct {
	Pattern     *regexp.Regexp
	Context     CulturalContext
	Confidence  float64
	Description string
}

// NewCulturalAnalyzer creates a new Indonesian cultural analyzer
func NewCulturalAnalyzer() (*CulturalAnalyzer, error) {
	analyzer := &CulturalAnalyzer{
		regionalMarkers:     make(map[string][]RegionalMarker),
		culturalPatterns:    make(map[CulturalContext][]CulturalPattern),
		formalityIndicators: make(map[FormalityLevel][]string),
	}

	if err := analyzer.initializeCulturalData(); err != nil {
		return nil, fmt.Errorf("failed to initialize cultural data: %w", err)
	}

	logrus.Debug("Cultural analyzer initialized with Indonesian cultural patterns")
	return analyzer, nil
}

// Analyze analyzes Indonesian cultural context
func (ca *CulturalAnalyzer) Analyze(text string, context map[string]interface{}) (*CulturalContextAnalysis, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	// Normalize text
	normalizedText := strings.ToLower(strings.TrimSpace(text))

	// Detect regional markers
	regionalMarkers := ca.detectRegionalMarkers(normalizedText)

	// Determine primary region
	region := ca.determinePrimaryRegion(regionalMarkers)

	// Detect cultural context
	culturalContext := ca.detectCulturalContext(normalizedText, context)

	// Analyze formality level
	formality := ca.analyzeFormalityLevel(normalizedText)

	// Calculate cultural appropriateness
	appropriateness := ca.calculateAppropriateness(normalizedText, culturalContext, formality)

	// Generate cultural suggestions
	suggestions := ca.generateSuggestions(normalizedText, culturalContext, formality, appropriateness)

	result := &CulturalContextAnalysis{
		Region:          region,
		CulturalMarkers: ca.convertToMarkers(regionalMarkers),
		Formality:       formality,
		Context:         culturalContext,
		Appropriateness: appropriateness,
		Suggestions:     suggestions,
	}

	logrus.WithFields(logrus.Fields{
		"text_length":     len(text),
		"region":          result.Region,
		"cultural_context": result.Context,
		"formality":       result.Formality,
		"appropriateness": result.Appropriateness,
		"markers":         len(result.CulturalMarkers),
		"suggestions":     len(result.Suggestions),
	}).Debug("Cultural analysis completed")

	return result, nil
}

// initializeCulturalData initializes Indonesian cultural data
func (ca *CulturalAnalyzer) initializeCulturalData() error {
	// Initialize regional markers
	ca.initializeRegionalMarkers()

	// Initialize cultural patterns
	if err := ca.initializeCulturalPatterns(); err != nil {
		return fmt.Errorf("failed to initialize cultural patterns: %w", err)
	}

	// Initialize formality indicators
	ca.initializeFormalityIndicators()

	return nil
}

// initializeRegionalMarkers initializes regional cultural markers
func (ca *CulturalAnalyzer) initializeRegionalMarkers() {
	regions := map[string][]RegionalMarker{
		"jakarta": {
			{Text: "gue", Region: "jakarta", Type: "pronoun", Confidence: 0.9, Description: "Jakarta informal pronoun"},
			{Text: "lu", Region: "jakarta", Type: "pronoun", Confidence: 0.9, Description: "Jakarta informal pronoun"},
			{Text: "nih", Region: "jakarta", Type: "particle", Confidence: 0.8, Description: "Jakarta particle"},
			{Text: "sih", Region: "jakarta", Type: "particle", Confidence: 0.7, Description: "Jakarta particle"},
			{Text: "dong", Region: "jakarta", Type: "particle", Confidence: 0.8, Description: "Jakarta particle"},
			{Text: "deh", Region: "jakarta", Type: "particle", Confidence: 0.7, Description: "Jakarta particle"},
			{Text: "banget", Region: "jakarta", Type: "intensifier", Confidence: 0.8, Description: "Jakarta intensifier"},
		},
		"java": {
			{Text: "opo", Region: "java", Type: "question", Confidence: 0.9, Description: "Javanese question word"},
			{Text: "piye", Region: "java", Type: "question", Confidence: 0.9, Description: "Javanese question word"},
			{Text: "wis", Region: "java", Type: "particle", Confidence: 0.8, Description: "Javanese particle"},
			{Text: "ora", Region: "java", Type: "negation", Confidence: 0.9, Description: "Javanese negation"},
			{Text: "nek", Region: "java", Type: "conditional", Confidence: 0.8, Description: "Javanese conditional"},
			{Text: "yo", Region: "java", Type: "particle", Confidence: 0.7, Description: "Javanese particle"},
		},
		"sunda": {
			{Text: "naon", Region: "sunda", Type: "question", Confidence: 0.9, Description: "Sundanese question word"},
			{Text: "kumaha", Region: "sunda", Type: "question", Confidence: 0.9, Description: "Sundanese question word"},
			{Text: "teu", Region: "sunda", Type: "negation", Confidence: 0.9, Description: "Sundanese negation"},
			{Text: "mah", Region: "sunda", Type: "particle", Confidence: 0.8, Description: "Sundanese particle"},
			{Text: "teh", Region: "sunda", Type: "particle", Confidence: 0.8, Description: "Sundanese particle"},
			{Text: "urang", Region: "sunda", Type: "pronoun", Confidence: 0.8, Description: "Sundanese pronoun"},
		},
		"batak": {
			{Text: "aha", Region: "batak", Type: "question", Confidence: 0.9, Description: "Batak question word"},
			{Text: "songon", Region: "batak", Type: "comparison", Confidence: 0.8, Description: "Batak comparison word"},
			{Text: "dohot", Region: "batak", Type: "conjunction", Confidence: 0.9, Description: "Batak conjunction"},
			{Text: "holan", Region: "batak", Type: "particle", Confidence: 0.8, Description: "Batak particle"},
		},
		"minang": {
			{Text: "apo", Region: "minang", Type: "question", Confidence: 0.9, Description: "Minang question word"},
			{Text: "baa", Region: "minang", Type: "question", Confidence: 0.9, Description: "Minang question word"},
			{Text: "indak", Region: "minang", Type: "negation", Confidence: 0.9, Description: "Minang negation"},
			{Text: "nan", Region: "minang", Type: "determiner", Confidence: 0.8, Description: "Minang determiner"},
		},
	}

	ca.regionalMarkers = regions
}

// initializeCulturalPatterns initializes cultural context patterns
func (ca *CulturalAnalyzer) initializeCulturalPatterns() error {
	patterns := map[CulturalContext][]string{
		ContextGovernment: {
			`\b(?:dengan hormat|yang terhormat|bersama ini)\b`,
			`\b(?:surat|dokumen|berkas|administrasi)\b`,
			`\b(?:permohonan|pengajuan|pendaftaran)\b`,
			`\b(?:instansi|dinas|kantor|pemerintah)\b`,
			`\b(?:ktp|kk|akta|surat keterangan)\b`,
		},
		ContextEducation: {
			`\b(?:sekolah|universitas|kampus|pendidikan)\b`,
			`\b(?:guru|dosen|siswa|mahasiswa|murid)\b`,
			`\b(?:ujian|tes|nilai|rapor|ijazah)\b`,
			`\b(?:kelas|mata pelajaran|kuliah|semester)\b`,
		},
		ContextBusiness: {
			`\b(?:perusahaan|bisnis|usaha|dagang)\b`,
			`\b(?:meeting|rapat|presentasi|proposal)\b`,
			`\b(?:klien|customer|pelanggan|partner)\b`,
			`\b(?:kontrak|perjanjian|deal|transaksi)\b`,
		},
		ContextCasual: {
			`\b(?:teman|sahabat|keluarga|saudara)\b`,
			`\b(?:main|jalan|nongkrong|hangout)\b`,
			`\b(?:cerita|curhat|sharing|chat)\b`,
			`\b(?:weekend|liburan|santai|relax)\b`,
		},
		ContextReligious: {
			`\b(?:allah|tuhan|doa|sholat|ibadah)\b`,
			`\b(?:masjid|gereja|vihara|pura|tempat ibadah)\b`,
			`\b(?:ramadan|puasa|lebaran|natal|nyepi)\b`,
			`\b(?:ustadz|pastor|biksu|pendeta)\b`,
		},
		ContextTraditional: {
			`\b(?:adat|tradisi|budaya|warisan)\b`,
			`\b(?:upacara|ritual|perayaan|festival)\b`,
			`\b(?:batik|wayang|gamelan|tarian)\b`,
			`\b(?:nenek moyang|leluhur|turun temurun)\b`,
		},
	}

	for context, patternStrings := range patterns {
		for _, patternStr := range patternStrings {
			compiled, err := regexp.Compile(`(?i)` + patternStr)
			if err != nil {
				return fmt.Errorf("failed to compile cultural pattern for %s: %w", context, err)
			}

			pattern := CulturalPattern{
				Pattern:     compiled,
				Context:     context,
				Confidence:  0.8,
				Description: fmt.Sprintf("%s context pattern", context),
			}

			ca.culturalPatterns[context] = append(ca.culturalPatterns[context], pattern)
		}
	}

	return nil
}

// initializeFormalityIndicators initializes formality level indicators
func (ca *CulturalAnalyzer) initializeFormalityIndicators() {
	indicators := map[FormalityLevel][]string{
		FormalityVeryFormal: {
			"dengan hormat", "yang terhormat", "bersama ini", "demikian", "atas perhatian",
			"sebelumnya", "sesudahnya", "berkenaan", "sehubungan", "menindaklanjuti",
			"disampaikan", "diberitahukan", "diinformasikan", "dimohon", "diharapkan",
		},
		FormalityFormal: {
			"mohon", "silakan", "terima kasih", "selamat", "maaf", "permisi",
			"dengan", "kepada", "dari", "untuk", "mengenai", "tentang",
			"bapak", "ibu", "saudara", "anda", "beliau",
		},
		FormalityNeutral: {
			"tolong", "minta", "kasih", "bilang", "tanya", "coba", "lihat", "dengar",
			"kamu", "dia", "mereka", "kita", "kami", "saya",
		},
		FormalityInformal: {
			"gimana", "kayak", "banget", "abis", "udah", "emang", "sih", "dong",
			"nih", "deh", "kan", "tuh", "gitu", "gini",
		},
		FormalityVeryInformal: {
			"gue", "lu", "lo", "gw", "anjir", "wkwk", "woy", "bro", "sis",
			"mantap", "keren", "asik", "seru", "ngaco", "baper",
		},
	}

	ca.formalityIndicators = indicators
}

// detectRegionalMarkers detects regional markers in text
func (ca *CulturalAnalyzer) detectRegionalMarkers(text string) []RegionalMarker {
	var detectedMarkers []RegionalMarker

	for _, regionMarkers := range ca.regionalMarkers {
		for _, marker := range regionMarkers {
			if strings.Contains(text, marker.Text) {
				detectedMarkers = append(detectedMarkers, marker)
			}
		}
	}

	return detectedMarkers
}

// determinePrimaryRegion determines the primary region based on markers
func (ca *CulturalAnalyzer) determinePrimaryRegion(markers []RegionalMarker) string {
	if len(markers) == 0 {
		return "standard"
	}

	regionScores := make(map[string]float64)
	for _, marker := range markers {
		regionScores[marker.Region] += marker.Confidence
	}

	// Find region with highest score
	maxScore := 0.0
	primaryRegion := "standard"
	for region, score := range regionScores {
		if score > maxScore {
			maxScore = score
			primaryRegion = region
		}
	}

	return primaryRegion
}

// detectCulturalContext detects cultural context
func (ca *CulturalAnalyzer) detectCulturalContext(text string, context map[string]interface{}) CulturalContext {
	// Check context for hints
	if contextType, exists := context["context_type"]; exists {
		if ctxStr, ok := contextType.(string); ok {
			switch ctxStr {
			case "government":
				return ContextGovernment
			case "business":
				return ContextBusiness
			case "education":
				return ContextEducation
			}
		}
	}
	contextScores := make(map[CulturalContext]float64)

	for culturalContext, patterns := range ca.culturalPatterns {
		score := 0.0
		for _, pattern := range patterns {
			if pattern.Pattern.MatchString(text) {
				score += pattern.Confidence
			}
		}
		contextScores[culturalContext] = score
	}

	// Find context with highest score
	maxScore := 0.0
	detectedContext := ContextCasual // Default
	for ctx, score := range contextScores {
		if score > maxScore {
			maxScore = score
			detectedContext = ctx
		}
	}

	return detectedContext
}

// analyzeFormalityLevel analyzes formality level
func (ca *CulturalAnalyzer) analyzeFormalityLevel(text string) FormalityLevel {
	formalityScores := make(map[FormalityLevel]float64)

	for level, indicators := range ca.formalityIndicators {
		score := 0.0
		for _, indicator := range indicators {
			if strings.Contains(text, indicator) {
				score += 1.0
			}
		}
		formalityScores[level] = score
	}

	// Find formality level with highest score
	maxScore := 0.0
	detectedFormality := FormalityNeutral // Default
	for level, score := range formalityScores {
		if score > maxScore {
			maxScore = score
			detectedFormality = level
		}
	}

	return detectedFormality
}

// calculateAppropriateness calculates cultural appropriateness
func (ca *CulturalAnalyzer) calculateAppropriateness(text string, context CulturalContext, formality FormalityLevel) float64 {
	appropriateness := 0.7 // Base appropriateness

	// Context-formality matching
	switch context {
	case ContextGovernment:
		switch formality {
		case FormalityVeryFormal, FormalityFormal:
			appropriateness += 0.2
		case FormalityVeryInformal:
			appropriateness -= 0.3
		}
	case ContextBusiness:
		switch formality {
		case FormalityFormal, FormalityNeutral:
			appropriateness += 0.1
		case FormalityVeryInformal:
			appropriateness -= 0.2
		}
	case ContextCasual:
		switch formality {
		case FormalityInformal, FormalityNeutral:
			appropriateness += 0.1
		case FormalityVeryFormal:
			appropriateness -= 0.1
		}
	}

	// Check for inappropriate language
	inappropriateWords := []string{"anjir", "bangsat", "brengsek", "tolol", "bodoh"}
	for _, word := range inappropriateWords {
		if strings.Contains(text, word) {
			appropriateness -= 0.2
		}
	}

	// Ensure appropriateness is within [0, 1] range
	if appropriateness > 1.0 {
		appropriateness = 1.0
	} else if appropriateness < 0.0 {
		appropriateness = 0.0
	}

	return appropriateness
}

// generateSuggestions generates cultural suggestions
func (ca *CulturalAnalyzer) generateSuggestions(text string, context CulturalContext, formality FormalityLevel, appropriateness float64) []string {
	var suggestions []string

	// Formality suggestions
	if context == ContextGovernment && formality != FormalityVeryFormal && formality != FormalityFormal {
		suggestions = append(suggestions, "Gunakan bahasa yang lebih formal untuk konteks pemerintahan")
		suggestions = append(suggestions, "Tambahkan kata 'mohon' atau 'dengan hormat' untuk kesopanan")
	}

	if context == ContextBusiness && formality == FormalityVeryInformal {
		suggestions = append(suggestions, "Gunakan bahasa yang lebih profesional untuk konteks bisnis")
	}

	// Appropriateness suggestions
	if appropriateness < 0.5 {
		suggestions = append(suggestions, "Hindari penggunaan bahasa yang tidak pantas")
		suggestions = append(suggestions, "Gunakan bahasa yang lebih sopan dan santun")
	}

	// Regional suggestions
	if strings.Contains(text, "gue") || strings.Contains(text, "lu") {
		if context == ContextGovernment || context == ContextBusiness {
			suggestions = append(suggestions, "Ganti 'gue/lu' dengan 'saya/Anda' untuk konteks formal")
		}
	}

	return suggestions
}

// convertToMarkers converts regional markers to cultural markers
func (ca *CulturalAnalyzer) convertToMarkers(regionalMarkers []RegionalMarker) []CulturalMarker {
	var markers []CulturalMarker

	for _, rm := range regionalMarkers {
		marker := CulturalMarker{
			Type:        rm.Type,
			Text:        rm.Text,
			Region:      rm.Region,
			Confidence:  rm.Confidence,
			Description: rm.Description,
		}
		markers = append(markers, marker)
	}

	return markers
}

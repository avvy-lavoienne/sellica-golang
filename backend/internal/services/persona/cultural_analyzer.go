package persona

import (
	"context"
	"strings"
	"time"
)

// IndonesianCulturalAnalyzer implements comprehensive cultural analysis
type IndonesianCulturalAnalyzer struct {
	hofstedeProcessor    *HofstedeDimensionsProcessor
	regionalDetector     *RegionalContextDetector
	religiousCalendar    *ReligiousCalendarService
	hierarchyAnalyzer    *HierarchyAnalyzer
	collectivismEngine   *CollectivismEngine
}

// Phase1CulturalContext represents Phase 1 comprehensive Indonesian cultural analysis
type Phase1CulturalContext struct {
	FormalityLevel     int                    `json:"formality_level"`     // 1-10 scale
	PowerDistance      float64                `json:"power_distance"`      // Hofstede dimension
	CollectivismScore  float64                `json:"collectivism_score"`  // Individual vs collective
	HierarchyMarkers   []string               `json:"hierarchy_markers"`   // Detected titles/respect markers
	RegionalContext    RegionalInfo           `json:"regional_context"`    // Geographic/ethnic detection
	ReligiousContext   ReligiousInfo          `json:"religious_context"`   // Religious calendar awareness
	CommunicationStyle CommunicationStyle     `json:"communication_style"` // High/low context
	Confidence         float64                `json:"confidence"`          // Analysis confidence
}

type RegionalInfo struct {
	DetectedRegion     string   `json:"detected_region"`     // Java, Sumatra, etc.
	EthnicGroup        string   `json:"ethnic_group"`        // Javanese, Sundanese, etc.
	DialectMarkers     []string `json:"dialect_markers"`     // Language patterns
	CulturalMarkers    []string `json:"cultural_markers"`    // Cultural references
}

type ReligiousInfo struct {
	CurrentPeriod      string    `json:"current_period"`      // Ramadan, Galungan, etc.
	IsHolidayPeriod    bool      `json:"is_holiday_period"`   // Special consideration needed
	ReligiousMarkers   []string  `json:"religious_markers"`   // Detected religious references
	SensitivityLevel   int       `json:"sensitivity_level"`   // 1-10 religious sensitivity
}

type CommunicationStyle struct {
	ContextLevel       string    `json:"context_level"`       // high, medium, low
	IndirectnessScore  float64   `json:"indirectness_score"`  // Communication indirectness
	FaceSavingRequired bool      `json:"face_saving_required"` // Face-saving needed
}

// NewIndonesianCulturalAnalyzer creates a new cultural analyzer
func NewIndonesianCulturalAnalyzer() *IndonesianCulturalAnalyzer {
	return &IndonesianCulturalAnalyzer{
		hofstedeProcessor:  NewHofstedeDimensionsProcessor(),
		regionalDetector:   NewRegionalContextDetector(),
		religiousCalendar:  NewReligiousCalendarService(),
		hierarchyAnalyzer:  NewHierarchyAnalyzer(),
		collectivismEngine: NewCollectivismEngine(),
	}
}

// AnalyzeCulturalContext performs comprehensive cultural analysis
func (ica *IndonesianCulturalAnalyzer) AnalyzeCulturalContext(ctx context.Context, query string, userContext map[string]interface{}) (*Phase1CulturalContext, error) {
	culturalCtx := &Phase1CulturalContext{
		Confidence: 0.0,
	}

	// Step 1: Analyze formality level
	culturalCtx.FormalityLevel = ica.analyzeFormalityLevel(query)

	// Step 2: Process Hofstede dimensions
	culturalCtx.PowerDistance = ica.hofstedeProcessor.AnalyzePowerDistance(query)
	culturalCtx.CollectivismScore = ica.hofstedeProcessor.AnalyzeCollectivism(query)

	// Step 3: Detect hierarchy markers
	culturalCtx.HierarchyMarkers = ica.hierarchyAnalyzer.DetectHierarchyMarkers(query)

	// Step 4: Regional context detection
	culturalCtx.RegionalContext = ica.regionalDetector.DetectRegionalContext(query, userContext)

	// Step 5: Religious context analysis
	culturalCtx.ReligiousContext = ica.religiousCalendar.AnalyzeReligiousContext(query, time.Now())

	// Step 6: Communication style analysis
	culturalCtx.CommunicationStyle = ica.analyzeCommunicationStyle(query, culturalCtx)

	// Calculate overall confidence
	culturalCtx.Confidence = ica.calculateConfidence(culturalCtx)

	return culturalCtx, nil
}

// analyzeFormalityLevel detects formality level from user query
func (ica *IndonesianCulturalAnalyzer) analyzeFormalityLevel(query string) int {
	formalMarkers := []string{"Bapak", "Ibu", "Yang Terhormat", "Saudara", "beliau"}
	informalMarkers := []string{"kamu", "lu", "gue", "bro", "sis"}

	formalCount := 0
	informalCount := 0

	queryLower := strings.ToLower(query)

	for _, marker := range formalMarkers {
		if strings.Contains(queryLower, strings.ToLower(marker)) {
			formalCount++
		}
	}

	for _, marker := range informalMarkers {
		if strings.Contains(queryLower, marker) {
			informalCount++
		}
	}

	if formalCount > informalCount {
		return 8 + formalCount // High formality
	} else if informalCount > formalCount {
		return 3 - informalCount // Low formality
	}

	return 5 // Neutral
}

// analyzeCommunicationStyle determines communication style requirements
func (ica *IndonesianCulturalAnalyzer) analyzeCommunicationStyle(query string, culturalCtx *Phase1CulturalContext) CommunicationStyle {
	style := CommunicationStyle{
		ContextLevel:       "medium",
		IndirectnessScore:  0.5,
		FaceSavingRequired: false,
	}

	// High-context indicators
	highContextMarkers := []string{"mungkin", "sepertinya", "barangkali", "kiranya"}
	highContextCount := 0

	queryLower := strings.ToLower(query)
	for _, marker := range highContextMarkers {
		if strings.Contains(queryLower, marker) {
			highContextCount++
		}
	}

	if highContextCount > 0 {
		style.ContextLevel = "high"
		style.IndirectnessScore = 0.8
	}

	// Face-saving requirements
	if culturalCtx.FormalityLevel > 6 || len(culturalCtx.HierarchyMarkers) > 0 {
		style.FaceSavingRequired = true
	}

	return style
}

// calculateConfidence calculates overall analysis confidence
func (ica *IndonesianCulturalAnalyzer) calculateConfidence(culturalCtx *Phase1CulturalContext) float64 {
	confidence := 0.0
	factors := 0

	// Formality confidence
	if culturalCtx.FormalityLevel != 5 { // Not neutral
		confidence += 0.8
	} else {
		confidence += 0.3
	}
	factors++

	// Hierarchy markers confidence
	if len(culturalCtx.HierarchyMarkers) > 0 {
		confidence += 0.9
		factors++
	}

	// Regional context confidence
	if culturalCtx.RegionalContext.EthnicGroup != "" {
		confidence += 0.7
		factors++
	}

	// Religious context confidence
	if culturalCtx.ReligiousContext.IsHolidayPeriod {
		confidence += 0.9
		factors++
	}

	if factors == 0 {
		return 0.1 // Minimal confidence
	}

	return confidence / float64(factors)
}

// RegionalContextDetector handles regional and ethnic context detection
type RegionalContextDetector struct{}

// NewRegionalContextDetector creates a new regional detector
func NewRegionalContextDetector() *RegionalContextDetector {
	return &RegionalContextDetector{}
}

// DetectRegionalContext analyzes query for regional and ethnic markers
func (rcd *RegionalContextDetector) DetectRegionalContext(query string, userContext map[string]interface{}) RegionalInfo {
	info := RegionalInfo{
		DetectedRegion:  "general_indonesia",
		EthnicGroup:     "",
		DialectMarkers:  []string{},
		CulturalMarkers: []string{},
	}

	queryLower := strings.ToLower(query)

	// Java region detection
	if strings.Contains(queryLower, "jawa") || strings.Contains(queryLower, "jakarta") ||
	   strings.Contains(queryLower, "surabaya") || strings.Contains(queryLower, "semarang") {
		info.DetectedRegion = "java"
		info.CulturalMarkers = append(info.CulturalMarkers, "jawa")
	}

	// Sundanese detection
	if strings.Contains(queryLower, "sunda") || strings.Contains(queryLower, "bandung") ||
	   strings.Contains(queryLower, "atuh") || strings.Contains(queryLower, "mah") {
		info.EthnicGroup = "sundanese"
		info.DialectMarkers = append(info.DialectMarkers, "sundanese_particles")
		info.CulturalMarkers = append(info.CulturalMarkers, "sunda")
	}

	// Javanese detection
	if strings.Contains(queryLower, "jawa") && !strings.Contains(queryLower, "barat") {
		info.EthnicGroup = "javanese"
		info.DialectMarkers = append(info.DialectMarkers, "javanese_courtesy")
		info.CulturalMarkers = append(info.CulturalMarkers, "jawa")
	}

	return info
}

// ReligiousCalendarService handles religious calendar awareness
type ReligiousCalendarService struct{}

// NewReligiousCalendarService creates a new religious calendar service
func NewReligiousCalendarService() *ReligiousCalendarService {
	return &ReligiousCalendarService{}
}

// AnalyzeReligiousContext checks for religious context and holiday periods
func (rcs *ReligiousCalendarService) AnalyzeReligiousContext(query string, currentTime time.Time) ReligiousInfo {
	info := ReligiousInfo{
		CurrentPeriod:    "",
		IsHolidayPeriod:  false,
		ReligiousMarkers: []string{},
		SensitivityLevel: 1,
	}

	queryLower := strings.ToLower(query)

	// Ramadan detection
	if strings.Contains(queryLower, "ramadan") || strings.Contains(queryLower, "puasa") ||
	   strings.Contains(queryLower, "lebaran") || strings.Contains(queryLower, "idul fitri") {
		info.CurrentPeriod = "ramadan"
		info.IsHolidayPeriod = true
		info.ReligiousMarkers = append(info.ReligiousMarkers, "ramadan")
		info.SensitivityLevel = 8
	}

	// Christmas/Natal detection
	if strings.Contains(queryLower, "natal") || strings.Contains(queryLower, "christmas") ||
	   strings.Contains(queryLower, "tuhan yesus") {
		info.CurrentPeriod = "christmas"
		info.IsHolidayPeriod = true
		info.ReligiousMarkers = append(info.ReligiousMarkers, "christian_holiday")
		info.SensitivityLevel = 7
	}

	// General Islamic markers
	if strings.Contains(queryLower, "assalamualaikum") || strings.Contains(queryLower, "alhamdulillah") ||
	   strings.Contains(queryLower, "insyaallah") {
		info.ReligiousMarkers = append(info.ReligiousMarkers, "islamic_greetings")
		info.SensitivityLevel = 6
	}

	return info
}

// HierarchyAnalyzer detects hierarchical markers in communication
type HierarchyAnalyzer struct{}

// NewHierarchyAnalyzer creates a new hierarchy analyzer
func NewHierarchyAnalyzer() *HierarchyAnalyzer {
	return &HierarchyAnalyzer{}
}

// DetectHierarchyMarkers identifies respect and hierarchical markers
func (ha *HierarchyAnalyzer) DetectHierarchyMarkers(query string) []string {
	markers := []string{}
	queryLower := strings.ToLower(query)

	hierarchyPatterns := []string{
		"bapak", "ibu", "pak", "bu", "yang terhormat", "direktur",
		"manager", "boss", "atasan", "pimpinan", "beliau",
		"saya mohon", "dengan hormat", "perkenankan",
	}

	for _, pattern := range hierarchyPatterns {
		if strings.Contains(queryLower, pattern) {
			markers = append(markers, pattern)
		}
	}

	return markers
}

// CollectivismEngine analyzes collective vs individual communication patterns
type CollectivismEngine struct{}

// NewCollectivismEngine creates a new collectivism engine
func NewCollectivismEngine() *CollectivismEngine {
	return &CollectivismEngine{}
}

// AnalyzeCollectivismScore provides additional collectivism analysis
func (ce *CollectivismEngine) AnalyzeCollectivismScore(query string) float64 {
	// This will be enhanced when we implement the Hofstede processor
	// For now, return a basic score
	queryLower := strings.ToLower(query)

	collectiveWords := []string{"kita", "kami", "bersama", "keluarga", "masyarakat", "komunitas"}
	individualWords := []string{"saya", "aku", "sendiri", "individual", "pribadi"}

	collectiveCount := 0
	individualCount := 0

	for _, word := range collectiveWords {
		if strings.Contains(queryLower, word) {
			collectiveCount++
		}
	}

	for _, word := range individualWords {
		if strings.Contains(queryLower, word) {
			individualCount++
		}
	}

	if collectiveCount > individualCount {
		return 0.8
	} else if individualCount > collectiveCount {
		return 0.3
	}

	return 0.5 // Neutral
}
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
	culturalCtx.ReligiousContext = ica.religiousCalendar.AnalyzeReligiousContext(ctx, query, time.Now())

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

// ReligiousCalendarService provides comprehensive multi-faith religious awareness
type ReligiousCalendarService struct {
	islamicCalendar    *IslamicCalendar
	christianCalendar  *ChristianCalendar
	hinduCalendar      *HinduCalendar
	buddhistCalendar   *BuddhistCalendar
	chineseCalendar    *ChineseCalendar
	confucianCalendar  *ConfucianCalendar
	enabled            bool
}

// ReligiousContextResult contains comprehensive religious context analysis
type ReligiousContextResult struct {
	ActivePeriods      []ReligiousPeriod `json:"active_periods"`
	SensitivityLevel   int               `json:"sensitivity_level"`
	GreetingAdjustment string            `json:"greeting_adjustment"`
	ResponseGuidelines []string          `json:"response_guidelines"`
	CulturalEvents     []CulturalEvent   `json:"cultural_events"`
	UpcomingEvents     []CulturalEvent   `json:"upcoming_events"`
	Recommendations    []string          `json:"recommendations"`
}

type ReligiousPeriod struct {
	Religion         string    `json:"religion"`
	Period           string    `json:"period"`
	StartDate        time.Time `json:"start_date"`
	EndDate          time.Time `json:"end_date"`
	Significance     string    `json:"significance"`
	Guidelines       []string  `json:"guidelines"`
	SensitivityLevel int       `json:"sensitivity_level"`
	GreetingPhrase   string    `json:"greeting_phrase"`
}

type CulturalEvent struct {
	Name           string    `json:"name"`
	Date           time.Time `json:"date"`
	Religion       string    `json:"religion"`
	Greeting       string    `json:"greeting"`
	Considerations []string  `json:"considerations"`
	IsNational     bool      `json:"is_national"`
	RegionalScope  []string  `json:"regional_scope"`
}

// NewReligiousCalendarService creates comprehensive religious calendar service
func NewReligiousCalendarService() *ReligiousCalendarService {
	return &ReligiousCalendarService{
		islamicCalendar:    NewIslamicCalendar(),
		christianCalendar:  NewChristianCalendar(),
		hinduCalendar:      NewHinduCalendar(),
		buddhistCalendar:   NewBuddhistCalendar(),
		chineseCalendar:    NewChineseCalendar(),
		confucianCalendar:  NewConfucianCalendar(),
		enabled:            true,
	}
}

// AnalyzeReligiousContext determines comprehensive religious context
func (rcs *ReligiousCalendarService) AnalyzeReligiousContext(ctx context.Context, query string, currentTime time.Time) ReligiousInfo {
	// For backward compatibility, return basic ReligiousInfo
	// Enhanced analysis available through AnalyzeReligiousContextAdvanced
	result := ReligiousInfo{
		CurrentPeriod:    "",
		IsHolidayPeriod:  false,
		ReligiousMarkers: []string{},
		SensitivityLevel: 1,
	}

	queryLower := strings.ToLower(query)

	// Ramadan detection
	if strings.Contains(queryLower, "ramadan") || strings.Contains(queryLower, "puasa") ||
	   strings.Contains(queryLower, "lebaran") || strings.Contains(queryLower, "idul fitri") {
		result.CurrentPeriod = "ramadan"
		result.IsHolidayPeriod = true
		result.ReligiousMarkers = append(result.ReligiousMarkers, "ramadan")
		result.SensitivityLevel = 8
	}

	// Christmas/Natal detection
	if strings.Contains(queryLower, "natal") || strings.Contains(queryLower, "christmas") ||
	   strings.Contains(queryLower, "tuhan yesus") {
		result.CurrentPeriod = "christmas"
		result.IsHolidayPeriod = true
		result.ReligiousMarkers = append(result.ReligiousMarkers, "christian_holiday")
		result.SensitivityLevel = 7
	}

	// General Islamic markers
	if strings.Contains(queryLower, "assalamualaikum") || strings.Contains(queryLower, "alhamdulillah") ||
	   strings.Contains(queryLower, "insyaallah") {
		result.ReligiousMarkers = append(result.ReligiousMarkers, "islamic_greetings")
		result.SensitivityLevel = 6
	}

	return result
}

// AnalyzeReligiousContextAdvanced provides comprehensive religious context analysis
func (rcs *ReligiousCalendarService) AnalyzeReligiousContextAdvanced(ctx context.Context, query string, currentTime time.Time) *ReligiousContextResult {
	result := &ReligiousContextResult{
		ActivePeriods:      []ReligiousPeriod{},
		SensitivityLevel:   1,
		ResponseGuidelines: []string{},
		CulturalEvents:     []CulturalEvent{},
		UpcomingEvents:     []CulturalEvent{},
		Recommendations:    []string{},
	}

	if !rcs.enabled {
		return result
	}

	// Check all religious calendars
	rcs.checkIslamicContext(result, currentTime)
	rcs.checkChristianContext(result, currentTime)
	rcs.checkHinduContext(result, currentTime)
	rcs.checkBuddhistContext(result, currentTime)
	rcs.checkChineseContext(result, currentTime)

	// Generate appropriate greeting
	result.GreetingAdjustment = rcs.generateReligiousGreeting(result.ActivePeriods, currentTime)

	// Generate comprehensive response guidelines
	result.ResponseGuidelines = rcs.generateResponseGuidelines(result.ActivePeriods)

	// Generate recommendations
	result.Recommendations = rcs.generateRecommendations(result, currentTime)

	return result
}

// Helper methods for religious context checking
func (rcs *ReligiousCalendarService) checkIslamicContext(result *ReligiousContextResult, currentTime time.Time) {
	if islamicContext := rcs.islamicCalendar.GetCurrentContext(currentTime); islamicContext != nil {
		result.ActivePeriods = append(result.ActivePeriods, *islamicContext)
		result.SensitivityLevel = max(result.SensitivityLevel, islamicContext.SensitivityLevel)
	}
}

func (rcs *ReligiousCalendarService) checkChristianContext(result *ReligiousContextResult, currentTime time.Time) {
	if christianContext := rcs.christianCalendar.GetCurrentContext(currentTime); christianContext != nil {
		result.ActivePeriods = append(result.ActivePeriods, *christianContext)
		result.SensitivityLevel = max(result.SensitivityLevel, christianContext.SensitivityLevel)
	}
}

func (rcs *ReligiousCalendarService) checkHinduContext(result *ReligiousContextResult, currentTime time.Time) {
	if hinduContext := rcs.hinduCalendar.GetCurrentContext(currentTime); hinduContext != nil {
		result.ActivePeriods = append(result.ActivePeriods, *hinduContext)
		result.SensitivityLevel = max(result.SensitivityLevel, hinduContext.SensitivityLevel)
	}
}

func (rcs *ReligiousCalendarService) checkBuddhistContext(result *ReligiousContextResult, currentTime time.Time) {
	if buddhistContext := rcs.buddhistCalendar.GetCurrentContext(currentTime); buddhistContext != nil {
		result.ActivePeriods = append(result.ActivePeriods, *buddhistContext)
		result.SensitivityLevel = max(result.SensitivityLevel, buddhistContext.SensitivityLevel)
	}
}

func (rcs *ReligiousCalendarService) checkChineseContext(result *ReligiousContextResult, currentTime time.Time) {
	if chineseContext := rcs.chineseCalendar.GetCurrentContext(currentTime); chineseContext != nil {
		result.ActivePeriods = append(result.ActivePeriods, *chineseContext)
		result.SensitivityLevel = max(result.SensitivityLevel, chineseContext.SensitivityLevel)
	}
}

func (rcs *ReligiousCalendarService) generateReligiousGreeting(periods []ReligiousPeriod, _ time.Time) string {
	if len(periods) == 0 {
		return ""
	}

	// Priority: highest sensitivity level
	var priorityPeriod *ReligiousPeriod
	maxSensitivity := 0

	for _, period := range periods {
		if period.SensitivityLevel > maxSensitivity {
			maxSensitivity = period.SensitivityLevel
			priorityPeriod = &period
		}
	}

	if priorityPeriod != nil {
		return priorityPeriod.GreetingPhrase
	}

	return ""
}

func (rcs *ReligiousCalendarService) generateResponseGuidelines(periods []ReligiousPeriod) []string {
	var guidelines []string

	for _, period := range periods {
		guidelines = append(guidelines, period.Guidelines...)
	}

	// Add general multi-faith guidelines
	if len(periods) > 1 {
		guidelines = append(guidelines, []string{
			"Gunakan bahasa inklusif untuk semua agama",
			"Hindari asumsi agama tertentu",
			"Hormati keberagaman kepercayaan",
			"Fokus pada nilai-nilai universal",
		}...)
	}

	return guidelines
}

func (rcs *ReligiousCalendarService) generateRecommendations(result *ReligiousContextResult, _ time.Time) []string {
	recommendations := []string{}

	if result.SensitivityLevel >= 8 {
		recommendations = append(recommendations,
			"Gunakan bahasa yang sangat hormat dan sensitif",
			"Pertimbangkan konteks spiritual dalam respons",
		)
	}

	if len(result.ActivePeriods) > 1 {
		recommendations = append(recommendations,
			"Akui keberagaman agama Indonesia",
			"Gunakan sapaan yang inklusif",
		)
	}

	return recommendations
}

// IslamicCalendar handles Islamic religious calendar
type IslamicCalendar struct {
	hijriCalculator *HijriCalculator
	ramadanDates    map[int]time.Time
	eidDates        map[int][]time.Time
}

func NewIslamicCalendar() *IslamicCalendar {
	return &IslamicCalendar{
		hijriCalculator: NewHijriCalculator(),
		ramadanDates: map[int]time.Time{
			2025: time.Date(2025, 2, 28, 0, 0, 0, 0, time.UTC),
			2026: time.Date(2026, 2, 17, 0, 0, 0, 0, time.UTC),
			2027: time.Date(2027, 2, 6, 0, 0, 0, 0, time.UTC),
		},
		eidDates: map[int][]time.Time{
			2025: {
				time.Date(2025, 3, 30, 0, 0, 0, 0, time.UTC), // Eid al-Fitr
				time.Date(2025, 6, 6, 0, 0, 0, 0, time.UTC),  // Eid al-Adha
			},
			2026: {
				time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), // Eid al-Fitr
				time.Date(2026, 5, 27, 0, 0, 0, 0, time.UTC), // Eid al-Adha
			},
		},
	}
}

func (ic *IslamicCalendar) GetCurrentContext(currentTime time.Time) *ReligiousPeriod {
	year := currentTime.Year()

	// Check if current time is during Ramadan
	if ramadanStart, exists := ic.ramadanDates[year]; exists {
		ramadanEnd := ramadanStart.AddDate(0, 0, 30)
		if currentTime.After(ramadanStart) && currentTime.Before(ramadanEnd) {
			return &ReligiousPeriod{
				Religion:         "Islam",
				Period:           "Ramadan",
				StartDate:        ramadanStart,
				EndDate:          ramadanEnd,
				Significance:     "Bulan suci puasa dan refleksi spiritual",
				SensitivityLevel: 9,
				GreetingPhrase:   "Ramadan Mubarak",
				Guidelines: []string{
					"Hindari referensi makanan/minuman selama siang hari",
					"Sertakan berkah spiritual dalam respons",
					"Tekankan kesabaran dan refleksi",
					"Gunakan sapaan 'Ramadan Mubarak' atau 'Ramadan Kareem'",
					"Hormati jadwal ibadah (sahur, berbuka)",
				},
			}
		}
	}

	// Check for Eid periods
	if eidDates, exists := ic.eidDates[year]; exists {
		for i, eidDate := range eidDates {
			eidEnd := eidDate.AddDate(0, 0, 3) // 3 days celebration
			if currentTime.After(eidDate) && currentTime.Before(eidEnd) {
				eidName := "Eid al-Fitr"
				significance := "Perayaan akhir Ramadan"
				if i == 1 {
					eidName = "Eid al-Adha"
					significance = "Perayaan kurban dan haji"
				}

				return &ReligiousPeriod{
					Religion:         "Islam",
					Period:           eidName,
					StartDate:        eidDate,
					EndDate:          eidEnd,
					Significance:     significance,
					SensitivityLevel: 8,
					GreetingPhrase:   "Eid Mubarak",
					Guidelines: []string{
						"Gunakan sapaan 'Eid Mubarak'",
						"Tekankan kebersamaan keluarga",
						"Sertakan tema pengampunan dan berbagi",
						"Sebutkan perayaan komunitas",
						"Hormati tradisi mudik dan silaturahmi",
					},
				}
			}
		}
	}

	return nil
}

// ChristianCalendar handles Christian religious calendar
type ChristianCalendar struct {
	easterCalculator *EasterCalculator
	christmasDate    time.Time
}

func NewChristianCalendar() *ChristianCalendar {
	return &ChristianCalendar{
		easterCalculator: NewEasterCalculator(),
		christmasDate:    time.Date(0, 12, 25, 0, 0, 0, 0, time.UTC),
	}
}

func (cc *ChristianCalendar) GetCurrentContext(currentTime time.Time) *ReligiousPeriod {
	year := currentTime.Year()

	// Check Christmas season
	christmasStart := time.Date(year, 12, 20, 0, 0, 0, 0, time.UTC)
	christmasEnd := time.Date(year, 12, 31, 0, 0, 0, 0, time.UTC)

	if currentTime.After(christmasStart) && currentTime.Before(christmasEnd) {
		return &ReligiousPeriod{
			Religion:         "Christianity",
			Period:           "Christmas Season",
			StartDate:        christmasStart,
			EndDate:          christmasEnd,
			Significance:     "Perayaan kelahiran Yesus Kristus",
			SensitivityLevel: 7,
			GreetingPhrase:   "Selamat Natal",
			Guidelines: []string{
				"Gunakan sapaan 'Selamat Natal dan Tahun Baru'",
				"Tekankan kasih dan kedamaian",
				"Sertakan tema keluarga dan berbagi",
				"Hormati tradisi perayaan Natal Indonesia",
			},
		}
	}

	// Check Easter period
	easterDate := cc.easterCalculator.CalculateEaster(year)
	easterStart := easterDate.AddDate(0, 0, -7) // Holy Week
	easterEnd := easterDate.AddDate(0, 0, 7)    // Easter Week

	if currentTime.After(easterStart) && currentTime.Before(easterEnd) {
		return &ReligiousPeriod{
			Religion:         "Christianity",
			Period:           "Easter Season",
			StartDate:        easterStart,
			EndDate:          easterEnd,
			Significance:     "Perayaan kebangkitan Yesus Kristus",
			SensitivityLevel: 8,
			GreetingPhrase:   "Selamat Paskah",
			Guidelines: []string{
				"Gunakan sapaan 'Selamat Paskah'",
				"Tekankan harapan dan pembaruan",
				"Sertakan tema kebangkitan dan kehidupan baru",
				"Hormati tradisi Paskah Indonesia",
			},
		}
	}

	return nil
}

// HinduCalendar handles Hindu religious calendar (Balinese focus)
type HinduCalendar struct {
	nyepiCalculator *NyepiCalculator
	galunganDates   map[int]time.Time
}

func NewHinduCalendar() *HinduCalendar {
	return &HinduCalendar{
		nyepiCalculator: NewNyepiCalculator(),
		galunganDates: map[int]time.Time{
			2025: time.Date(2025, 4, 16, 0, 0, 0, 0, time.UTC),
			2026: time.Date(2026, 4, 5, 0, 0, 0, 0, time.UTC),
		},
	}
}

func (hc *HinduCalendar) GetCurrentContext(currentTime time.Time) *ReligiousPeriod {
	year := currentTime.Year()

	// Check Nyepi (Balinese New Year)
	nyepiDate := hc.nyepiCalculator.CalculateNyepi(year)
	nyepiStart := nyepiDate.AddDate(0, 0, -1)
	nyepiEnd := nyepiDate.AddDate(0, 0, 1)

	if currentTime.After(nyepiStart) && currentTime.Before(nyepiEnd) {
		return &ReligiousPeriod{
			Religion:         "Hinduism",
			Period:           "Nyepi",
			StartDate:        nyepiStart,
			EndDate:          nyepiEnd,
			Significance:     "Tahun Baru Saka dan hari keheningan",
			SensitivityLevel: 9,
			GreetingPhrase:   "Om Swastyastu, Rahajeng Rahina Nyepi",
			Guidelines: []string{
				"Hormati keheningan dan refleksi",
				"Tekankan introspeksi dan pemurnian diri",
				"Gunakan sapaan Hindu yang tepat",
				"Sertakan tema keseimbangan dan harmoni",
				"Hormati tradisi catur brata penyepian",
			},
		}
	}

	// Check Galungan period
	if galunganDate, exists := hc.galunganDates[year]; exists {
		galunganEnd := galunganDate.AddDate(0, 0, 10) // 10 days until Kuningan
		if currentTime.After(galunganDate) && currentTime.Before(galunganEnd) {
			return &ReligiousPeriod{
				Religion:         "Hinduism",
				Period:           "Galungan-Kuningan",
				StartDate:        galunganDate,
				EndDate:          galunganEnd,
				Significance:     "Perayaan kemenangan dharma atas adharma",
				SensitivityLevel: 7,
				GreetingPhrase:   "Rahajeng Galungan lan Kuningan",
				Guidelines: []string{
					"Tekankan kemenangan kebaikan",
					"Sertakan tema keluarga dan leluhur",
					"Hormati tradisi penjor dan persembahan",
					"Gunakan sapaan Hindu Bali yang tepat",
				},
			}
		}
	}

	return nil
}

// BuddhistCalendar handles Buddhist religious calendar
type BuddhistCalendar struct {
	vesakDates map[int]time.Time
}

func NewBuddhistCalendar() *BuddhistCalendar {
	return &BuddhistCalendar{
		vesakDates: map[int]time.Time{
			2025: time.Date(2025, 5, 12, 0, 0, 0, 0, time.UTC),
			2026: time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC),
		},
	}
}

func (bc *BuddhistCalendar) GetCurrentContext(currentTime time.Time) *ReligiousPeriod {
	year := currentTime.Year()

	if vesakDate, exists := bc.vesakDates[year]; exists {
		vesakEnd := vesakDate.AddDate(0, 0, 3)
		if currentTime.After(vesakDate) && currentTime.Before(vesakEnd) {
			return &ReligiousPeriod{
				Religion:         "Buddhism",
				Period:           "Vesak",
				StartDate:        vesakDate,
				EndDate:          vesakEnd,
				Significance:     "Perayaan kelahiran, pencerahan, dan wafatnya Buddha",
				SensitivityLevel: 7,
				GreetingPhrase:   "Selamat Hari Raya Vesak",
				Guidelines: []string{
					"Tekankan kedamaian dan pencerahan",
					"Sertakan tema meditasi dan refleksi",
					"Hormati tradisi perayaan Vesak",
				},
			}
		}
	}

	return nil
}

// ChineseCalendar handles Chinese religious calendar
type ChineseCalendar struct {
	chineseNewYearDates map[int]time.Time
}

func NewChineseCalendar() *ChineseCalendar {
	return &ChineseCalendar{
		chineseNewYearDates: map[int]time.Time{
			2025: time.Date(2025, 1, 29, 0, 0, 0, 0, time.UTC),
			2026: time.Date(2026, 2, 17, 0, 0, 0, 0, time.UTC),
		},
	}
}

func (cc *ChineseCalendar) GetCurrentContext(currentTime time.Time) *ReligiousPeriod {
	year := currentTime.Year()

	if cnyDate, exists := cc.chineseNewYearDates[year]; exists {
		cnyEnd := cnyDate.AddDate(0, 0, 15) // 15 days celebration
		if currentTime.After(cnyDate) && currentTime.Before(cnyEnd) {
			return &ReligiousPeriod{
				Religion:         "Chinese Traditional",
				Period:           "Chinese New Year",
				StartDate:        cnyDate,
				EndDate:          cnyEnd,
				Significance:     "Perayaan tahun baru Imlek",
				SensitivityLevel: 6,
				GreetingPhrase:   "Selamat Tahun Baru Imlek",
				Guidelines: []string{
					"Gunakan sapaan 'Gong Xi Fa Cai'",
					"Tekankan keberuntungan dan kemakmuran",
					"Hormati tradisi angpao dan dekorasi",
				},
			}
		}
	}

	return nil
}

// ConfucianCalendar handles Confucian religious calendar
type ConfucianCalendar struct {
	ancestorWorshipDates map[int][]time.Time
}

func NewConfucianCalendar() *ConfucianCalendar {
	return &ConfucianCalendar{
		ancestorWorshipDates: map[int][]time.Time{
			2025: {
				time.Date(2025, 4, 5, 0, 0, 0, 0, time.UTC), // Qingming Festival
			},
		},
	}
}

func (cc *ConfucianCalendar) GetCurrentContext(currentTime time.Time) *ReligiousPeriod {
	year := currentTime.Year()

	if dates, exists := cc.ancestorWorshipDates[year]; exists {
		for _, date := range dates {
			dateEnd := date.AddDate(0, 0, 1)
			if currentTime.After(date) && currentTime.Before(dateEnd) {
				return &ReligiousPeriod{
					Religion:         "Confucianism",
					Period:           "Qingming Festival",
					StartDate:        date,
					EndDate:          dateEnd,
					Significance:     "Perayaan menghormati leluhur",
					SensitivityLevel: 6,
					GreetingPhrase:   "Selamat Hari Qingming",
					Guidelines: []string{
						"Tekankan penghormatan kepada leluhur",
						"Sertakan tema keluarga dan tradisi",
						"Hormati tradisi membersihkan makam",
					},
				}
			}
		}
	}

	return nil
}

// Placeholder implementations for calendar calculators
type HijriCalculator struct{}

func NewHijriCalculator() *HijriCalculator {
	return &HijriCalculator{}
}

type EasterCalculator struct{}

func NewEasterCalculator() *EasterCalculator {
	return &EasterCalculator{}
}

func (ec *EasterCalculator) CalculateEaster(year int) time.Time {
	// Simplified Easter calculation (actual implementation would be more complex)
	return time.Date(year, 4, 4, 0, 0, 0, 0, time.UTC)
}

type NyepiCalculator struct{}

func NewNyepiCalculator() *NyepiCalculator {
	return &NyepiCalculator{}
}

func (nc *NyepiCalculator) CalculateNyepi(year int) time.Time {
	// Simplified Nyepi calculation (actual implementation would be more complex)
	return time.Date(year, 3, 14, 0, 0, 0, 0, time.UTC)
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
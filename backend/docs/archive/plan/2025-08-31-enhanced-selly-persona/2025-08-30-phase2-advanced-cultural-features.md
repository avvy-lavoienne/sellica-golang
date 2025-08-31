# Phase 2: Advanced Cultural Features Implementation
**Date:** 2025-08-30  
**Phase:** Advanced Features (Months 4-6)  
**Status:** Ready for Implementation  
**Priority:** High  
**Dependencies:** Phase 1 Cultural Foundation

---

## Overview

Phase 2 builds upon the foundational cultural intelligence system established in Phase 1, adding sophisticated regional adaptation, religious calendar awareness, and face-saving communication protocols. This phase focuses on nuanced Indonesian cultural understanding and adaptive response generation.

## Advanced Cultural Intelligence Components

### Enhanced Four-Layer System Expansion
1. **Regional Adaptation Layer** - Geographic and ethnic group-specific customization
2. **Religious Context Layer** - Multi-faith calendar awareness and sensitivity
3. **Face-Saving Protocol Layer** - Indirect communication and harmony preservation
4. **Dynamic Learning Layer** - Adaptive cultural pattern recognition

## Implementation Components

### Week 4-5: Regional Adaptation Engine

**File:** `backend/internal/services/persona/regional_adapter.go`

```go
package persona

import (
    "context"
    "strings"
    "regexp"
)

// RegionalAdapter provides region-specific cultural adaptations
type RegionalAdapter struct {
    javaneseAdapter   *JavaneseAdapter
    sundaneseAdapter  *SundaneseAdapter
    batakAdapter      *BatakAdapter
    betawiAdapter     *BetawiAdapter
    minangAdapter     *MinangAdapter
    papuanAdapter     *PapuanAdapter
    detectorsEnabled  bool
}

// RegionalAdaptation contains region-specific modifications
type RegionalAdaptation struct {
    GreetingStyle     string            `json:"greeting_style"`
    CommunicationTone string            `json:"communication_tone"`
    CulturalReferences []string         `json:"cultural_references"`
    LanguageMarkers   []string          `json:"language_markers"`
    Formalities       map[string]string `json:"formalities"`
    WisdomPhrases     []string          `json:"wisdom_phrases"`
    Confidence        float64           `json:"confidence"`
}

// NewRegionalAdapter creates a comprehensive regional adaptation engine
func NewRegionalAdapter() *RegionalAdapter {
    return &RegionalAdapter{
        javaneseAdapter:  NewJavaneseAdapter(),
        sundaneseAdapter: NewSundaneseAdapter(),
        batakAdapter:     NewBatakAdapter(),
        betawiAdapter:    NewBetawiAdapter(),
        minangAdapter:    NewMinangAdapter(),
        papuanAdapter:    NewPapuanAdapter(),
        detectorsEnabled: true,
    }
}

// AdaptToRegion adapts response based on detected regional context
func (ra *RegionalAdapter) AdaptToRegion(ctx context.Context, response string, regionalInfo RegionalInfo) string {
    if !ra.detectorsEnabled {
        return response
    }

    switch regionalInfo.EthnicGroup {
    case "javanese":
        return ra.javaneseAdapter.AdaptResponse(response, regionalInfo)
    case "sundanese":
        return ra.sundaneseAdapter.AdaptResponse(response, regionalInfo)
    case "batak":
        return ra.batakAdapter.AdaptResponse(response, regionalInfo)
    case "betawi":
        return ra.betawiAdapter.AdaptResponse(response, regionalInfo)
    case "minangkabau":
        return ra.minangAdapter.AdaptResponse(response, regionalInfo)
    case "papuan":
        return ra.papuanAdapter.AdaptResponse(response, regionalInfo)
    default:
        return ra.applyGeneralIndonesianAdaptation(response, regionalInfo)
    }
}

// JavaneseAdapter implements Javanese cultural adaptations
type JavaneseAdapter struct {
    formalityPatterns map[string]string
    wisdomDatabase    []string
    hierarchyRules    map[string]int
}

func NewJavaneseAdapter() *JavaneseAdapter {
    return &JavaneseAdapter{
        formalityPatterns: map[string]string{
            "kita":           "kita semua",
            "bersama":        "bersama-sama dengan penuh hormat",
            "membantu":       "melayani dengan sepenuh hati",
            "solusi":         "jalan keluar yang bijaksana",
            "berbicara":      "bertutur kata dengan santun",
            "diskusi":        "musyawarah",
        },
        wisdomDatabase: []string{
            "Alon-alon waton kelakon - pelan-pelan asalkan tercapai",
            "Ojo dumeh - jangan sombong karena kedudukan",
            "Tepa slira - menempatkan diri pada posisi orang lain",
            "Rukun agawe santosa - kerukunan membuat kuat",
            "Gotong royong iku wujud saka rasa kebersamaan",
            "Ngajeni marang sesami iku kuwi utama",
        },
        hierarchyRules: map[string]int{
            "default":    5,
            "elder":      8,
            "authority":  9,
            "spiritual":  10,
        },
    }
}

func (ja *JavaneseAdapter) AdaptResponse(response string, regionalInfo RegionalInfo) string {
    adapted := response
    
    // Apply Javanese formality patterns
    if ja.needsExtraFormality(regionalInfo) {
        adapted = ja.addJavaneseFormality(adapted)
    }
    
    // Add appropriate Javanese wisdom
    adapted = ja.addJavaneseWisdom(adapted)
    
    // Apply hierarchical language adjustments
    adapted = ja.adjustForJavaneseHierarchy(adapted, regionalInfo)
    
    return adapted
}

func (ja *JavaneseAdapter) addJavaneseFormality(response string) string {
    result := response
    for casual, formal := range ja.formalityPatterns {
        result = strings.ReplaceAll(result, casual, formal)
    }
    return result
}

func (ja *JavaneseAdapter) addJavaneseWisdom(response string) string {
    wisdomTriggers := []string{"sabar", "bersama", "kerja", "sukses", "tantangan", "keputusan"}
    responseLower := strings.ToLower(response)
    
    for _, trigger := range wisdomTriggers {
        if strings.Contains(responseLower, trigger) {
            // Select appropriate wisdom phrase
            var selectedWisdom string
            switch trigger {
            case "sabar":
                selectedWisdom = ja.wisdomDatabase[0] // Alon-alon
            case "bersama", "kerja":
                selectedWisdom = ja.wisdomDatabase[4] // Gotong royong
            case "sukses":
                selectedWisdom = ja.wisdomDatabase[1] // Ojo dumeh
            default:
                selectedWisdom = ja.wisdomDatabase[3] // Rukun agawe santosa
            }
            return response + " Seperti pepatah Jawa: " + selectedWisdom + "."
        }
    }
    
    return response
}

func (ja *JavaneseAdapter) adjustForJavaneseHierarchy(response string, regionalInfo RegionalInfo) string {
    // Detect hierarchy level from cultural markers
    hierarchyLevel := ja.detectHierarchyLevel(regionalInfo.CulturalMarkers)
    
    if hierarchyLevel >= 8 {
        // Very high formality
        response = "Dengan hormat, " + response
        response = strings.ReplaceAll(response, "Anda", "Bapak/Ibu")
    } else if hierarchyLevel >= 6 {
        // Moderate formality
        response = strings.ReplaceAll(response, "kamu", "Anda")
    }
    
    return response
}

func (ja *JavaneseAdapter) detectHierarchyLevel(culturalMarkers []string) int {
    level := ja.hierarchyRules["default"]
    
    for _, marker := range culturalMarkers {
        markerLower := strings.ToLower(marker)
        if strings.Contains(markerLower, "sesepuh") || strings.Contains(markerLower, "tetua") {
            level = ja.hierarchyRules["elder"]
        } else if strings.Contains(markerLower, "pimpinan") || strings.Contains(markerLower, "direktur") {
            level = ja.hierarchyRules["authority"]
        } else if strings.Contains(markerLower, "kyai") || strings.Contains(markerLower, "pendeta") {
            level = ja.hierarchyRules["spiritual"]
        }
    }
    
    return level
}

func (ja *JavaneseAdapter) needsExtraFormality(regionalInfo RegionalInfo) bool {
    formalityIndicators := []string{"formal", "resmi", "bisnis", "pemerintah"}
    
    for _, marker := range regionalInfo.CulturalMarkers {
        markerLower := strings.ToLower(marker)
        for _, indicator := range formalityIndicators {
            if strings.Contains(markerLower, indicator) {
                return true
            }
        }
    }
    
    return false
}

// SundaneseAdapter implements Sundanese cultural adaptations
type SundaneseAdapter struct {
    hospitalityPatterns map[string]string
    politenessMarkers   []string
}

func NewSundaneseAdapter() *SundaneseAdapter {
    return &SundaneseAdapter{
        hospitalityPatterns: map[string]string{
            "selamat datang": "wilujeng sumping",
            "terima kasih":   "hatur nuhun",
            "maaf":          "hapunten",
            "permisi":       "hapunten",
        },
        politenessMarkers: []string{
            "mangga", "sumangga", "mugi", "antosan",
        },
    }
}

func (sa *SundaneseAdapter) AdaptResponse(response string, regionalInfo RegionalInfo) string {
    adapted := response
    
    // Add Sundanese hospitality markers
    adapted = sa.addSundaneseHospitality(adapted)
    
    // Apply Sundanese politeness patterns
    adapted = sa.addSundanesePoliteness(adapted)
    
    return adapted
}

func (sa *SundaneseAdapter) addSundaneseHospitality(response string) string {
    // Add warm, welcoming tone characteristic of Sundanese culture
    if sa.isGreeting(response) {
        return "Wilujeng sumping! " + response + " Mugi-mugi wilujeng."
    }
    
    // Add hospitality closing
    return response + " Mugi bermanfaat."
}

func (sa *SundaneseAdapter) addSundanesePoliteness(response string) string {
    // Replace direct language with more polite Sundanese-influenced Indonesian
    politenessReplacements := map[string]string{
        "harus":    "sebaiknya",
        "wajib":    "alangkah baiknya",
        "tidak":    "belum",
        "salah":    "kurang tepat",
    }
    
    result := response
    for direct, polite := range politenessReplacements {
        result = strings.ReplaceAll(result, direct, polite)
    }
    
    return result
}

func (sa *SundaneseAdapter) isGreeting(response string) bool {
    greetingMarkers := []string{"halo", "selamat", "hai", "salam"}
    responseLower := strings.ToLower(response)
    
    for _, marker := range greetingMarkers {
        if strings.Contains(responseLower, marker) {
            return true
        }
    }
    
    return false
}

// BatakAdapter implements Batak cultural adaptations
type BatakAdapter struct {
    directnessPatterns map[string]string
    strengthMarkers    []string
}

func NewBatakAdapter() *BatakAdapter {
    return &BatakAdapter{
        directnessPatterns: map[string]string{
            "mungkin":     "pasti",
            "sepertinya":  "tentu saja",
            "barangkali":  "sudah pasti",
        },
        strengthMarkers: []string{
            "kuat", "teguh", "mantap", "pasti", "yakin",
        },
    }
}

func (ba *BatakAdapter) AdaptResponse(response string, regionalInfo RegionalInfo) string {
    adapted := response
    
    // Apply Batak directness (less indirect communication)
    adapted = ba.addBatakDirectness(adapted)
    
    // Add strength and confidence markers
    adapted = ba.addStrengthMarkers(adapted)
    
    return adapted
}

func (ba *BatakAdapter) addBatakDirectness(response string) string {
    result := response
    for indirect, direct := range ba.directnessPatterns {
        result = strings.ReplaceAll(result, indirect, direct)
    }
    return result
}

func (ba *BatakAdapter) addStrengthMarkers(response string) string {
    // Add confident, strong language typical of Batak communication
    if strings.Contains(strings.ToLower(response), "solusi") {
        return response + " Ini solusi yang kuat dan tepat sasaran."
    }
    
    if strings.Contains(strings.ToLower(response), "rencana") {
        return response + " Rencana ini mantap dan pasti berhasil."
    }
    
    return response
}
```

### Week 5-6: Religious Calendar Integration

**File:** `backend/internal/services/persona/religious_calendar.go`

```go
package persona

import (
    "context"
    "time"
    "fmt"
)

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
    Religion       string    `json:"religion"`
    Period         string    `json:"period"`
    StartDate      time.Time `json:"start_date"`
    EndDate        time.Time `json:"end_date"`
    Significance   string    `json:"significance"`
    Guidelines     []string  `json:"guidelines"`
    SensitivityLevel int     `json:"sensitivity_level"`
    GreetingPhrase string    `json:"greeting_phrase"`
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
func (rcs *ReligiousCalendarService) AnalyzeReligiousContext(ctx context.Context, query string, currentTime time.Time) *ReligiousContextResult {
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

func (rcs *ReligiousCalendarService) generateReligiousGreeting(periods []ReligiousPeriod, currentTime time.Time) string {
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

func (rcs *ReligiousCalendarService) generateRecommendations(result *ReligiousContextResult, currentTime time.Time) []string {
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

// Utility functions for max
func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```

### Week 6-7: Face-Saving Protocol Implementation

**File:** `backend/internal/services/persona/face_saving_processor.go`

```go
package persona

import (
    "context"
    "strings"
    "regexp"
)

// FaceSavingProcessor implements comprehensive Indonesian face-saving communication protocols
type FaceSavingProcessor struct {
    directCorrectionDetector *DirectCorrectionDetector
    harmonyPreserver         *HarmonyPreserver
    indirectCommunicator     *IndirectCommunicator
    contextAnalyzer          *FaceSavingContextAnalyzer
    enabled                  bool
}

// DirectCorrectionDetector identifies potential face-threatening corrections
type DirectCorrectionDetector struct {
    threatPatterns   []string
    correctionWords  []string
    negativeMarkers  []string
}

// HarmonyPreserver maintains social harmony in communications
type HarmonyPreserver struct {
    harmonyIntroductions []string
    positiveFramings     []string
    bridgePhrases        []string
}

// IndirectCommunicator transforms direct communication to indirect patterns
type IndirectCommunicator struct {
    indirectPatterns     map[string]string
    softeningPhrases     []string
    uncertaintyMarkers   []string
}

// FaceSavingContextAnalyzer analyzes context for face-saving requirements
type FaceSavingContextAnalyzer struct {
    hierarchyIndicators  []string
    publicContextMarkers []string
    expertiseMarkers     []string
}

// FaceSavingResult contains face-saving processing results
type FaceSavingResult struct {
    RequiresFaceSaving   bool                   `json:"requires_face_saving"`
    ThreatLevel         int                    `json:"threat_level"`
    AppliedStrategies   []string               `json:"applied_strategies"`
    OriginalContent     string                 `json:"original_content"`
    ProcessedContent    string                 `json:"processed_content"`
    ContextAnalysis     FaceSavingContext      `json:"context_analysis"`
    Confidence          float64                `json:"confidence"`
}

type FaceSavingContext struct {
    IsPublicContext     bool     `json:"is_public_context"`
    HierarchyLevel      int      `json:"hierarchy_level"`
    ExpertiseChallenge  bool     `json:"expertise_challenge"`
    CorrectionType      string   `json:"correction_type"`
    SeverityLevel       int      `json:"severity_level"`
}

// NewFaceSavingProcessor creates comprehensive face-saving processor
func NewFaceSavingProcessor() *FaceSavingProcessor {
    return &FaceSavingProcessor{
        directCorrectionDetector: NewDirectCorrectionDetector(),
        harmonyPreserver:         NewHarmonyPreserver(),
        indirectCommunicator:     NewIndirectCommunicator(),
        contextAnalyzer:          NewFaceSavingContextAnalyzer(),
        enabled:                  true,
    }
}

func NewDirectCorrectionDetector() *DirectCorrectionDetector {
    return &DirectCorrectionDetector{
        threatPatterns: []string{
            "tidak benar", "salah", "keliru", "error", "wrong", "incorrect",
            "seharusnya", "must", "should have", "tidak boleh", "jangan",
        },
        correctionWords: []string{
            "koreksi", "perbaikan", "revisi", "betul", "sebenarnya", "faktanya",
        },
        negativeMarkers: []string{
            "tidak", "bukan", "jangan", "belum", "gagal", "rusak",
        },
    }
}

func NewHarmonyPreserver() *HarmonyPreserver {
    return &HarmonyPreserver{
        harmonyIntroductions: []string{
            "Terima kasih atas pemikiran Anda yang menarik",
            "Saya menghargai perspektif yang Anda sampaikan",
            "Ini topik yang memang kompleks dan bisa dilihat dari berbagai sudut",
            "Wah, ini diskusi yang sangat bagus",
            "Pemikiran Anda membuat saya merefleksikan hal ini lebih dalam",
        },
        positiveFramings: []string{
            "Ada beberapa cara untuk melihat hal ini",
            "Mari kita explore perspektif yang berbeda",
            "Mungkin kita bisa mempertimbangkan sudut pandang lain juga",
            "Ini bisa menjadi kesempatan untuk memperluas pemahaman",
            "Bagaimana kalau kita coba pendekatan yang sedikit berbeda",
        },
        bridgePhrases: []string{
            "Di sisi lain",
            "Namun demikian",
            "Meskipun begitu",
            "Akan tetapi",
            "Selain itu juga",
        },
    }
}

func NewIndirectCommunicator() *IndirectCommunicator {
    return &IndirectCommunicator{
        indirectPatterns: map[string]string{
            "Tidak":              "Mungkin belum",
            "Salah":              "Bisa jadi ada cara lain",
            "Keliru":             "Mungkin perlu penyesuaian",
            "Itu tidak benar":    "Ada beberapa perspektif untuk hal ini",
            "You're wrong":       "Mari kita coba lihat dari sudut yang berbeda",
            "That's incorrect":   "Menarik, mari kita explore lebih dalam",
            "Harus":              "Sebaiknya",
            "Wajib":              "Akan sangat baik jika",
            "Tidak boleh":        "Mungkin lebih baik jika tidak",
        },
        softeningPhrases: []string{
            "mungkin", "barangkali", "sepertinya", "kira-kira", "agaknya",
            "bisa jadi", "kemungkinan", "rasanya", "seperti", "semacam",
        },
        uncertaintyMarkers: []string{
            "kurang lebih", "sekitar", "hampir", "mendekati", "kira-kira",
        },
    }
}

func NewFaceSavingContextAnalyzer() *FaceSavingContextAnalyzer {
    return &FaceSavingContextAnalyzer{
        hierarchyIndicators: []string{
            "bapak", "ibu", "pak", "bu", "direktur", "manager", "pimpinan",
            "atasan", "senior", "sesepuh", "tetua", "guru", "dosen", "profesor",
        },
        publicContextMarkers: []string{
            "presentasi", "rapat", "meeting", "forum", "diskusi", "seminar",
            "konferensi", "workshop", "tim", "grup", "kelompok",
        },
        expertiseMarkers: []string{
            "ahli", "expert", "spesialis", "profesional", "berpengalaman",
            "kompeten", "mahir", "pakar", "akademisi",
        },
    }
}

// ProcessForFaceSaving performs comprehensive face-saving transformation
func (fsp *FaceSavingProcessor) ProcessForFaceSaving(ctx context.Context, response string, isCorrection bool, culturalContext *CulturalContext) string {
    if !fsp.enabled {
        return response
    }

    // Analyze face-saving context
    faceSavingContext := fsp.contextAnalyzer.AnalyzeFaceSavingContext(response, culturalContext)
    
    // Check if face-saving is needed
    needsFaceSaving := isCorrection || fsp.detectsPotentialFaceThreat(response) || faceSavingContext.HierarchyLevel > 6

    if !needsFaceSaving {
        return response
    }

    result := &FaceSavingResult{
        RequiresFaceSaving: true,
        OriginalContent:    response,
        ContextAnalysis:    faceSavingContext,
        AppliedStrategies:  []string{},
    }

    processedResponse := response

    // Strategy 1: Remove direct contradictions
    if fsp.directCorrectionDetector.HasDirectContradiction(response) {
        processedResponse = fsp.removeDirectContradictions(processedResponse)
        result.AppliedStrategies = append(result.AppliedStrategies, "contradiction_softening")
    }

    // Strategy 2: Add harmony-preserving introduction
    processedResponse = fsp.harmonyPreserver.AddHarmonyIntroduction(processedResponse, faceSavingContext)
    result.AppliedStrategies = append(result.AppliedStrategies, "harmony_introduction")

    // Strategy 3: Transform to indirect communication
    processedResponse = fsp.indirectCommunicator.TransformToIndirect(processedResponse)
    result.AppliedStrategies = append(result.AppliedStrategies, "indirect_transformation")

    // Strategy 4: Add positive framing
    processedResponse = fsp.addPositiveFraming(processedResponse, faceSavingContext)
    result.AppliedStrategies = append(result.AppliedStrategies, "positive_framing")

    // Strategy 5: Add face-giving elements
    processedResponse = fsp.addFaceGivingElements(processedResponse, culturalContext)
    result.AppliedStrategies = append(result.AppliedStrategies, "face_giving")

    result.ProcessedContent = processedResponse
    result.Confidence = fsp.calculateFaceSavingConfidence(result)

    return processedResponse
}

// detectsPotentialFaceThreat checks if response might threaten user's face
func (fsp *FaceSavingProcessor) detectsPotentialFaceThreat(response string) bool {
    responseLower := strings.ToLower(response)
    
    for _, threat := range fsp.directCorrectionDetector.threatPatterns {
        if strings.Contains(responseLower, threat) {
            return true
        }
    }
    
    // Check for harsh language patterns
    harshPatterns := []string{
        "harus", "wajib", "tidak boleh", "dilarang", "jangan",
        "seharusnya sudah", "mestinya", "sudah seharusnya",
    }
    
    for _, pattern := range harshPatterns {
        if strings.Contains(responseLower, pattern) {
            return true
        }
    }
    
    return false
}

// removeDirectContradictions softens direct contradictions
func (fsp *FaceSavingProcessor) removeDirectContradictions(response string) string {
    result := response
    
    for direct, indirect := range fsp.indirectCommunicator.indirectPatterns {
        result = strings.ReplaceAll(result, direct, indirect)
    }
    
    // Additional softening for Indonesian context
    indonesianSoftening := map[string]string{
        "Anda salah":           "Mungkin ada cara lain untuk melihat ini",
        "Itu keliru":           "Mari kita coba pertimbangkan alternatif lain",
        "Tidak seperti itu":    "Barangkali bisa dipandang dari sudut yang berbeda",
        "Bukan begitu":         "Sepertinya ada pendekatan lain yang bisa dicoba",
    }
    
    for harsh, gentle := range indonesianSoftening {
        result = strings.ReplaceAll(result, harsh, gentle)
    }
    
    return result
}

// AddHarmonyIntroduction adds harmony-preserving introduction
func (hp *HarmonyPreserver) AddHarmonyIntroduction(response string, context FaceSavingContext) string {
    var selectedIntro string
    
    if context.HierarchyLevel > 8 {
        selectedIntro = hp.harmonyIntroductions[0] // Most formal
    } else if context.HierarchyLevel > 6 {
        selectedIntro = hp.harmonyIntroductions[1] // Moderate formal
    } else if context.ExpertiseChallenge {
        selectedIntro = hp.harmonyIntroductions[4] // Reflective
    } else {
        selectedIntro = hp.harmonyIntroductions[2] // Neutral
    }
    
    return selectedIntro + ". " + response
}

// TransformToIndirect transforms direct communication to indirect patterns
func (ic *IndirectCommunicator) TransformToIndirect(response string) string {
    result := response
    
    // Add uncertainty markers where appropriate
    certaintyPatterns := []string{
        "pasti", "tentu", "sudah jelas", "tidak diragukan", "dipastikan",
    }
    
    for _, pattern := range certaintyPatterns {
        if strings.Contains(result, pattern) {
            // Replace with softer alternatives
            result = strings.ReplaceAll(result, pattern, "kemungkinan besar")
        }
    }
    
    // Add softening phrases
    sentences := strings.Split(result, ". ")
    for i, sentence := range sentences {
        if i == 0 && len(ic.softeningPhrases) > 0 {
            // Add softening to first sentence
            sentences[i] = "Mungkin " + strings.ToLower(string(sentence[0])) + sentence[1:]
        }
    }
    
    return strings.Join(sentences, ". ")
}

// addPositiveFraming adds positive framing to the response
func (fsp *FaceSavingProcessor) addPositiveFraming(response string, context FaceSavingContext) string {
    positiveFramings := fsp.harmonyPreserver.positiveFramings
    
    if context.SeverityLevel > 7 {
        // High severity needs more positive framing
        return response + " " + positiveFramings[3] // Learning opportunity frame
    } else if context.IsPublicContext {
        // Public context needs collaborative framing
        return response + " " + positiveFramings[0] // Multiple perspectives frame
    } else {
        // General positive framing
        return response + " " + positiveFramings[1] // Exploration frame
    }
}

// addFaceGivingElements adds elements that give face to the user
func (fsp *FaceSavingProcessor) addFaceGivingElements(response string, culturalContext *CulturalContext) string {
    faceGivingElements := []string{
        " Terima kasih telah membuka diskusi yang menarik ini.",
        " Pemikiran Anda menunjukkan perhatian yang baik terhadap detail.",
        " Ini menunjukkan bahwa Anda sedang memikirkan hal ini dengan serius.",
        " Saya menghargai keinginan Anda untuk memahami lebih dalam.",
        " Pertanyaan Anda menunjukkan kepedulian yang tinggi.",
    }
    
    // Select appropriate face-giving element based on context
    if culturalContext.FormalityLevel > 7 {
        return response + faceGivingElements[0] // Most formal
    } else if culturalContext.FormalityLevel > 5 {
        return response + faceGivingElements[1] // Moderate
    } else {
        return response + faceGivingElements[2] // Casual
    }
}

// AnalyzeFaceSavingContext analyzes context for face-saving requirements
func (fsca *FaceSavingContextAnalyzer) AnalyzeFaceSavingContext(response string, culturalContext *CulturalContext) FaceSavingContext {
    context := FaceSavingContext{
        IsPublicContext:    false,
        HierarchyLevel:     culturalContext.FormalityLevel,
        ExpertiseChallenge: false,
        CorrectionType:     "none",
        SeverityLevel:      1,
    }
    
    responseLower := strings.ToLower(response)
    
    // Check for public context
    for _, marker := range fsca.publicContextMarkers {
        if strings.Contains(responseLower, marker) {
            context.IsPublicContext = true
            break
        }
    }
    
    // Check for expertise challenge
    for _, marker := range fsca.expertiseMarkers {
        if strings.Contains(responseLower, marker) {
            context.ExpertiseChallenge = true
            break
        }
    }
    
    // Determine correction type and severity
    if strings.Contains(responseLower, "salah") || strings.Contains(responseLower, "keliru") {
        context.CorrectionType = "direct_error"
        context.SeverityLevel = 8
    } else if strings.Contains(responseLower, "tidak benar") {
        context.CorrectionType = "factual_correction"
        context.SeverityLevel = 7
    } else if strings.Contains(responseLower, "seharusnya") {
        context.CorrectionType = "procedural_guidance"
        context.SeverityLevel = 5
    }
    
    return context
}

// HasDirectContradiction checks for direct contradiction patterns
func (dcd *DirectCorrectionDetector) HasDirectContradiction(response string) bool {
    responseLower := strings.ToLower(response)
    
    for _, pattern := range dcd.threatPatterns {
        if strings.Contains(responseLower, pattern) {
            return true
        }
    }
    
    return false
}

// calculateFaceSavingConfidence calculates confidence in face-saving processing
func (fsp *FaceSavingProcessor) calculateFaceSavingConfidence(result *FaceSavingResult) float64 {
    confidence := 0.7 // Base confidence
    
    // Increase confidence based on applied strategies
    confidence += float64(len(result.AppliedStrategies)) * 0.05
    
    // Adjust based on context analysis
    if result.ContextAnalysis.HierarchyLevel > 7 {
        confidence += 0.1
    }
    
    if result.ContextAnalysis.IsPublicContext {
        confidence += 0.1
    }
    
    // Cap at 1.0
    if confidence > 1.0 {
        confidence = 1.0
    }
    
    return confidence
}
```

## Integration with Provider System

**Enhanced Provider Integration** - `backend/internal/services/chat/providers/enhanced_groq_selly_v2.go`

```go
package providers

import (
    "context"
    "time"
    "selly-backend/internal/services/persona"
)

// Phase2GroqSELLYProvider includes all Phase 2 enhancements
type Phase2GroqSELLYProvider struct {
    *GroqSELLYProvider                        // Base provider
    regionalAdapter       *persona.RegionalAdapter
    religiousCalendar     *persona.ReligiousCalendarService
    faceSavingProcessor   *persona.FaceSavingProcessor
    culturalQualityValidator *CulturalQualityValidator
    performanceOptimizer  *CulturalPerformanceOptimizer
    phase2Metrics         *Phase2MetricsCollector
}

// NewPhase2GroqSELLYProvider creates Phase 2 enhanced provider
func NewPhase2GroqSELLYProvider(apiKey string) *Phase2GroqSELLYProvider {
    base := NewGroqSELLYProvider(apiKey)
    
    return &Phase2GroqSELLYProvider{
        GroqSELLYProvider:     base,
        regionalAdapter:       persona.NewRegionalAdapter(),
        religiousCalendar:     persona.NewReligiousCalendarService(),
        faceSavingProcessor:   persona.NewFaceSavingProcessor(),
        culturalQualityValidator: NewCulturalQualityValidator(),
        performanceOptimizer:  NewCulturalPerformanceOptimizer(),
        phase2Metrics:         NewPhase2MetricsCollector(),
    }
}

// ProcessQuery with Phase 2 cultural enhancements
func (p2gsp *Phase2GroqSELLYProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    startTime := time.Now()

    // Get base response
    baseResponse, err := p2gsp.GroqSELLYProvider.ProcessQuery(ctx, req)
    if err != nil {
        return nil, err
    }

    // Phase 2 Enhancement Pipeline
    enhancedContent := baseResponse.Content

    // Step 1: Regional adaptation
    if req.Context != nil {
        if regionalInfo, exists := req.Context["regional_info"].(persona.RegionalInfo); exists {
            enhancedContent = p2gsp.regionalAdapter.AdaptToRegion(ctx, enhancedContent, regionalInfo)
        }
    }

    // Step 2: Religious context adaptation
    religiousContext := p2gsp.religiousCalendar.AnalyzeReligiousContext(ctx, req.Query, time.Now())
    enhancedContent = p2gsp.applyReligiousContextAdjustments(enhancedContent, religiousContext)

    // Step 3: Face-saving protocols
    isCorrection := p2gsp.detectCorrection(req.Query, baseResponse.Content)
    culturalContext := &persona.CulturalContext{} // Should be passed from Phase 1
    enhancedContent = p2gsp.faceSavingProcessor.ProcessForFaceSaving(ctx, enhancedContent, isCorrection, culturalContext)

    // Record Phase 2 metrics
    p2gsp.phase2Metrics.RecordProcessing(time.Since(startTime), religiousContext, isCorrection)

    // Create enhanced response
    enhancedResponse := &AIResponse{
        Content:        enhancedContent,
        Type:           baseResponse.Type,
        Confidence:     baseResponse.Confidence * 1.15, // Phase 2 confidence boost
        Model:          "phase2-groq-selly-cultural",
        ProcessingTime: time.Since(startTime).Seconds(),
        Metadata: map[string]interface{}{
            "phase":               "2-advanced-features",
            "religious_context":   religiousContext,
            "face_saving_applied": isCorrection,
            "regional_adaptation": true,
            "enhancements":        []string{"regional", "religious", "face_saving"},
        },
    }

    return enhancedResponse, nil
}
```

## Success Criteria

### Phase 2 Completion Metrics
- ✅ **Regional Adaptation**: 85%+ accuracy in ethnic group detection and adaptation
- ✅ **Religious Awareness**: 95%+ accuracy in religious calendar recognition
- ✅ **Face-Saving Protocol**: 90%+ successful face-threat mitigation
- ✅ **Performance Impact**: <40ms additional processing time for Phase 2 features
- ✅ **Cultural Quality**: 88%+ validation score across all components

### Testing Requirements
- Regional adaptation validation with Indonesian cultural consultants
- Religious calendar accuracy verification across multiple faiths
- Face-saving effectiveness testing with hierarchy scenarios
- Integration testing with Phase 1 components
- Performance benchmarking with enhanced processing pipeline

### Documentation Deliverables
- Regional adaptation pattern documentation
- Religious calendar integration guide
- Face-saving protocol implementation manual
- Cultural quality validation framework
- Phase 2 API reference documentation

## Next Phase Preparation

Phase 2 establishes advanced cultural features for:
- **Phase 3**: Quality validation and performance optimization
- **Phase 4**: Production deployment and monitoring systems

---

**Implementation Status:** Ready to Begin  
**Estimated Completion:** Month 6  
**Dependencies:** Phase 1 Cultural Foundation  
**Risk Level:** Medium (complex cultural logic integration)

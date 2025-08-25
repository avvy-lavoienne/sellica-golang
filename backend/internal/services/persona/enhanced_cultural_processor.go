package persona

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// EnhancedCulturalProcessor handles comprehensive Indonesian cultural context processing
// Migrated and enhanced from Next.js AdvancedPersonaSystem
type EnhancedCulturalProcessor struct {
	culturalRules      []CulturalRule
	regionalPatterns   map[string][]*regexp.Regexp
	religiousPatterns  map[string][]*regexp.Regexp
	ageGroupPatterns   map[string][]*regexp.Regexp
	socialContextRules map[string]CulturalAdaptation
	enabled            bool
}

// CulturalContext represents comprehensive cultural context analysis
type CulturalContext struct {
	Region           string                 `json:"region"`           // jakarta, jawa_barat, sunda, general_indonesia
	FormalityLevel   string                 `json:"formality_level"`  // very_formal, formal, semi_formal, casual
	ReligiousContext string                 `json:"religious_context"` // islamic, christian, general, secular
	AgeGroup         string                 `json:"age_group"`        // young, adult, senior
	SocialContext    string                 `json:"social_context"`   // government_service, casual_inquiry, urgent_need, learning
	Confidence       float64                `json:"confidence"`       // 0.0-1.0
	Indicators       []string               `json:"indicators"`       // detected indicators
	Metadata         map[string]interface{} `json:"metadata"`
}

// CulturalAdaptation defines how to adapt responses based on cultural context
type CulturalAdaptation struct {
	GreetingStyle      string   `json:"greeting_style"`
	AddressForm        string   `json:"address_form"`         // Bapak/Ibu, Kakak, Anda
	LanguageLevel      string   `json:"language_level"`       // formal, standard, casual
	CulturalReferences []string `json:"cultural_references"`  // appropriate cultural elements
	ReligiousElements  []string `json:"religious_elements"`   // religious considerations
	RegionalElements   []string `json:"regional_elements"`    // regional language elements
	ResponseModifiers  []string `json:"response_modifiers"`   // how to modify response
}

// EnhancedCulturalRequest represents a request for enhanced cultural processing
type EnhancedCulturalRequest struct {
	BaseResponse        string                 `json:"base_response"`
	Query               string                 `json:"query"`
	ServiceType         string                 `json:"service_type"`
	UserContext         map[string]interface{} `json:"user_context"`
	FormalityLevel      string                 `json:"formality_level"`
	ConversationHistory []string               `json:"conversation_history"`
	UserMood            *MoodDetectionResult   `json:"user_mood"`
}

// EnhancedCulturalResult represents the result of enhanced cultural processing
type EnhancedCulturalResult struct {
	ProcessedResponse string                 `json:"processed_response"`
	CulturalContext   *CulturalContext       `json:"cultural_context"`
	AdaptationApplied *CulturalAdaptation    `json:"adaptation_applied"`
	ProcessingTime    float64                `json:"processing_time"`
	Metadata          map[string]interface{} `json:"metadata"`
}

// NewEnhancedCulturalProcessor creates a new enhanced cultural processor
func NewEnhancedCulturalProcessor(rules []CulturalRule) *EnhancedCulturalProcessor {
	processor := &EnhancedCulturalProcessor{
		culturalRules:      rules,
		regionalPatterns:   make(map[string][]*regexp.Regexp),
		religiousPatterns:  make(map[string][]*regexp.Regexp),
		ageGroupPatterns:   make(map[string][]*regexp.Regexp),
		socialContextRules: make(map[string]CulturalAdaptation),
		enabled:            true,
	}

	processor.initializeRegionalPatterns()
	processor.initializeReligiousPatterns()
	processor.initializeAgeGroupPatterns()
	processor.initializeSocialContextRules()

	return processor
}

// ProcessResponseWithEnhancedContext applies comprehensive Indonesian cultural context
func (ecp *EnhancedCulturalProcessor) ProcessResponseWithEnhancedContext(ctx context.Context, req *EnhancedCulturalRequest) (*EnhancedCulturalResult, error) {
	if !ecp.enabled {
		return &EnhancedCulturalResult{
			ProcessedResponse: req.BaseResponse,
			CulturalContext: &CulturalContext{
				Region:         "general_indonesia",
				FormalityLevel: "formal",
				Confidence:     0.5,
			},
		}, nil
	}

	startTime := time.Now()

	// Analyze cultural context
	culturalContext := ecp.analyzeCulturalContext(req.Query, req.ConversationHistory)

	// Get appropriate cultural adaptation
	adaptation := ecp.getCulturalAdaptation(culturalContext, req.ServiceType, req.UserMood)

	// Apply cultural processing
	processedResponse := ecp.applyCulturalAdaptation(req.BaseResponse, culturalContext, adaptation, req)

	processingTime := float64(time.Since(startTime).Nanoseconds()) / 1e6

	result := &EnhancedCulturalResult{
		ProcessedResponse: processedResponse,
		CulturalContext:   culturalContext,
		AdaptationApplied: adaptation,
		ProcessingTime:    processingTime,
		Metadata: map[string]interface{}{
			"cultural_processing": true,
			"processor_version":   "2.0_enhanced_from_nextjs",
			"adaptations_applied": len(adaptation.ResponseModifiers),
			"mood_considered":     req.UserMood != nil,
		},
	}

	logrus.WithFields(logrus.Fields{
		"region":            culturalContext.Region,
		"formality":         culturalContext.FormalityLevel,
		"religious_context": culturalContext.ReligiousContext,
		"age_group":         culturalContext.AgeGroup,
		"social_context":    culturalContext.SocialContext,
		"confidence":        culturalContext.Confidence,
		"processing_ms":     processingTime,
	}).Debug("Enhanced cultural processing completed")

	return result, nil
}

// analyzeCulturalContext analyzes query and history for cultural context
func (ecp *EnhancedCulturalProcessor) analyzeCulturalContext(query string, history []string) *CulturalContext {
	lowerQuery := strings.ToLower(query)
	indicators := []string{}

	// Analyze regional context
	region := ecp.detectRegion(lowerQuery, &indicators)

	// Analyze religious context
	religiousContext := ecp.detectReligiousContext(lowerQuery, &indicators)

	// Analyze age group
	ageGroup := ecp.detectAgeGroup(lowerQuery, &indicators)

	// Analyze social context
	socialContext := ecp.detectSocialContext(lowerQuery, &indicators)

	// Determine formality level
	formalityLevel := ecp.determineFormalityLevel(lowerQuery, &indicators)

	// Calculate confidence based on indicators found
	confidence := ecp.calculateCulturalConfidence(indicators, len(history))

	return &CulturalContext{
		Region:           region,
		FormalityLevel:   formalityLevel,
		ReligiousContext: religiousContext,
		AgeGroup:         ageGroup,
		SocialContext:    socialContext,
		Confidence:       confidence,
		Indicators:       indicators,
		Metadata: map[string]interface{}{
			"total_indicators": len(indicators),
			"history_length":   len(history),
		},
	}
}

// initializeRegionalPatterns sets up regional detection patterns
func (ecp *EnhancedCulturalProcessor) initializeRegionalPatterns() {
	// Jakarta patterns
	ecp.regionalPatterns["jakarta"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(jakarta|dki|betawi|jaksel|jakut|jakbar|jaktim|jakpus)\b`),
		regexp.MustCompile(`\b(gue|lu|ente|nyokap|bokap)\b`), // Jakarta slang
		regexp.MustCompile(`\b(macet|busway|transjakarta|monas)\b`),
	}

	// Jawa Barat patterns
	ecp.regionalPatterns["jawa_barat"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(jabar|jawa barat|bandung|bogor|depok|bekasi|garut)\b`),
		regexp.MustCompile(`\b(atuh|mah|teh|da|ge)\b`), // Sundanese particles
		regexp.MustCompile(`\b(kumaha|naon|dimana|iraha)\b`), // Sundanese question words
	}

	// Sunda patterns
	ecp.regionalPatterns["sunda"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(sunda|sundanese|priangan|pasundan)\b`),
		regexp.MustCompile(`\b(kumaha|naon|dimana|iraha|saha)\b`), // Sundanese
		regexp.MustCompile(`\b(atuh|mah|teh|da|ge|nya)\b`), // Sundanese particles
		regexp.MustCompile(`\b(wilujeng|nuhun|hapunten)\b`), // Sundanese politeness
	}
}

// initializeReligiousPatterns sets up religious context detection patterns
func (ecp *EnhancedCulturalProcessor) initializeReligiousPatterns() {
	// Islamic patterns
	ecp.religiousPatterns["islamic"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(assalamualaikum|waalaikumsalam|bismillah|alhamdulillah|insyaallah|masya allah)\b`),
		regexp.MustCompile(`\b(subhanallah|astaghfirullah|barakallahu|jazakallahu)\b`),
		regexp.MustCompile(`\b(sholat|salat|puasa|ramadan|idul fitri|idul adha|haji|umrah)\b`),
		regexp.MustCompile(`\b(masjid|musholla|imam|ustadz|kyai|santri)\b`),
	}

	// Christian patterns
	ecp.religiousPatterns["christian"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(tuhan yesus|yesus kristus|tuhan memberkati|puji tuhan|haleluya)\b`),
		regexp.MustCompile(`\b(gereja|pastor|pendeta|natal|paskah|minggu)\b`),
		regexp.MustCompile(`\b(doa|berdoa|kebaktian|persekutuan|jemaat)\b`),
	}

	// General religious patterns
	ecp.religiousPatterns["general"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(tuhan|allah|doa|berdoa|syukur|berkat|rahmat)\b`),
		regexp.MustCompile(`\b(ibadah|agama|iman|takwa|spiritual)\b`),
	}
}

// initializeAgeGroupPatterns sets up age group detection patterns
func (ecp *EnhancedCulturalProcessor) initializeAgeGroupPatterns() {
	// Young patterns (Gen Z, Millennial)
	ecp.ageGroupPatterns["young"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(bro|sis|bestie|guys|squad|vibes|mood|slay|periodt)\b`),
		regexp.MustCompile(`\b(literally|basically|like|totally|super|mega|ultra)\b`),
		regexp.MustCompile(`\b(gercep|kepo|baper|gabut|salty|toxic|cringe)\b`), // Indonesian Gen Z slang
		regexp.MustCompile(`\b(kak|kakak|bang|mas|mbak)\b`), // Casual address forms
	}

	// Adult patterns (Gen X, older Millennial)
	ecp.ageGroupPatterns["adult"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(pak|bu|bapak|ibu|mas|mbak)\b`), // Standard address forms
		regexp.MustCompile(`\b(mohon|tolong|silakan|terima kasih|maaf)\b`), // Polite language
		regexp.MustCompile(`\b(pekerjaan|karir|keluarga|anak|rumah|kredit)\b`), // Adult concerns
	}

	// Senior patterns
	ecp.ageGroupPatterns["senior"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(bapak|ibu|pak|bu|om|tante)\b`), // Formal address
		regexp.MustCompile(`\b(cucu|anak|menantu|pensiun|lansia)\b`), // Senior context
		regexp.MustCompile(`\b(dulu|jaman|masa|waktu|tempo)\b`), // Time references
	}
}

// initializeSocialContextRules sets up social context adaptation rules
func (ecp *EnhancedCulturalProcessor) initializeSocialContextRules() {
	ecp.socialContextRules["government_service"] = CulturalAdaptation{
		GreetingStyle:      "formal_institutional",
		AddressForm:        "Bapak/Ibu",
		LanguageLevel:      "formal",
		CulturalReferences: []string{"institutional_respect", "government_protocol"},
		ResponseModifiers:  []string{"add_institutional_context", "formal_language", "respectful_tone"},
	}

	ecp.socialContextRules["casual_inquiry"] = CulturalAdaptation{
		GreetingStyle:      "friendly_helpful",
		AddressForm:        "Anda",
		LanguageLevel:      "standard",
		CulturalReferences: []string{"helpful_neighbor", "community_support"},
		ResponseModifiers:  []string{"conversational_tone", "approachable_language"},
	}

	ecp.socialContextRules["urgent_need"] = CulturalAdaptation{
		GreetingStyle:      "immediate_assistance",
		AddressForm:        "Bapak/Ibu",
		LanguageLevel:      "formal",
		CulturalReferences: []string{"emergency_support", "priority_service"},
		ResponseModifiers:  []string{"prioritize_solution", "clear_steps", "reassuring_tone"},
	}

	ecp.socialContextRules["learning"] = CulturalAdaptation{
		GreetingStyle:      "educational_supportive",
		AddressForm:        "Anda",
		LanguageLevel:      "standard",
		CulturalReferences: []string{"teacher_student", "knowledge_sharing"},
		ResponseModifiers:  []string{"educational_tone", "detailed_explanation", "encouraging"},
	}
}

// detectRegion detects regional context from query
func (ecp *EnhancedCulturalProcessor) detectRegion(query string, indicators *[]string) string {
	for region, patterns := range ecp.regionalPatterns {
		for _, pattern := range patterns {
			if pattern.MatchString(query) {
				*indicators = append(*indicators, "region_"+region)
				return region
			}
		}
	}
	return "general_indonesia"
}

// detectReligiousContext detects religious context from query
func (ecp *EnhancedCulturalProcessor) detectReligiousContext(query string, indicators *[]string) string {
	for context, patterns := range ecp.religiousPatterns {
		for _, pattern := range patterns {
			if pattern.MatchString(query) {
				*indicators = append(*indicators, "religious_"+context)
				return context
			}
		}
	}
	return "secular"
}

// detectAgeGroup detects age group from query patterns
func (ecp *EnhancedCulturalProcessor) detectAgeGroup(query string, indicators *[]string) string {
	for ageGroup, patterns := range ecp.ageGroupPatterns {
		for _, pattern := range patterns {
			if pattern.MatchString(query) {
				*indicators = append(*indicators, "age_"+ageGroup)
				return ageGroup
			}
		}
	}
	return "adult" // default
}

// detectSocialContext detects social context from query
func (ecp *EnhancedCulturalProcessor) detectSocialContext(query string, indicators *[]string) string {
	// Government service patterns
	govPatterns := []*regexp.Regexp{
		regexp.MustCompile(`\b(ktp|kk|akta|surat|dokumen|berkas|persyaratan|syarat)\b`),
		regexp.MustCompile(`\b(dinas|kantor|pelayanan|administrasi|pemerintah)\b`),
		regexp.MustCompile(`\b(mengurus|mengajukan|mendaftar|memperpanjang)\b`),
	}

	for _, pattern := range govPatterns {
		if pattern.MatchString(query) {
			*indicators = append(*indicators, "social_government_service")
			return "government_service"
		}
	}

	// Urgent need patterns
	urgentPatterns := []*regexp.Regexp{
		regexp.MustCompile(`\b(urgent|mendesak|segera|cepat|buru-buru|deadline)\b`),
		regexp.MustCompile(`\b(tolong|help|bantuan|darurat|penting)\b`),
	}

	for _, pattern := range urgentPatterns {
		if pattern.MatchString(query) {
			*indicators = append(*indicators, "social_urgent_need")
			return "urgent_need"
		}
	}

	// Learning patterns
	learningPatterns := []*regexp.Regexp{
		regexp.MustCompile(`\b(belajar|tahu|mengerti|paham|cara|bagaimana|prosedur)\b`),
		regexp.MustCompile(`\b(informasi|penjelasan|detail|langkah|tahap)\b`),
	}

	for _, pattern := range learningPatterns {
		if pattern.MatchString(query) {
			*indicators = append(*indicators, "social_learning")
			return "learning"
		}
	}

	return "casual_inquiry"
}

// determineFormalityLevel determines appropriate formality level
func (ecp *EnhancedCulturalProcessor) determineFormalityLevel(query string, indicators *[]string) string {
	// Very formal patterns
	veryFormalPatterns := []*regexp.Regexp{
		regexp.MustCompile(`\b(mohon|perkenankan|berkenan|dengan hormat|yang terhormat)\b`),
		regexp.MustCompile(`\b(saya bermaksud|saya ingin|saya hendak|saya berkeinginan)\b`),
	}

	for _, pattern := range veryFormalPatterns {
		if pattern.MatchString(query) {
			*indicators = append(*indicators, "formality_very_formal")
			return "very_formal"
		}
	}

	// Casual patterns
	casualPatterns := []*regexp.Regexp{
		regexp.MustCompile(`\b(gimana|gimane|kayak|kayaknya|gitu|gini)\b`),
		regexp.MustCompile(`\b(nih|sih|deh|dong|lah|kan)\b`),
		regexp.MustCompile(`\b(kak|bang|mas|mbak)\b`),
	}

	for _, pattern := range casualPatterns {
		if pattern.MatchString(query) {
			*indicators = append(*indicators, "formality_casual")
			return "casual"
		}
	}

	// Semi-formal patterns
	semiFormalPatterns := []*regexp.Regexp{
		regexp.MustCompile(`\b(tolong|silakan|terima kasih|maaf|permisi)\b`),
		regexp.MustCompile(`\b(bisa|dapat|mungkin|barangkali)\b`),
	}

	for _, pattern := range semiFormalPatterns {
		if pattern.MatchString(query) {
			*indicators = append(*indicators, "formality_semi_formal")
			return "semi_formal"
		}
	}

	return "formal" // default for government services
}

// calculateCulturalConfidence calculates confidence based on indicators
func (ecp *EnhancedCulturalProcessor) calculateCulturalConfidence(indicators []string, historyLength int) float64 {
	baseConfidence := 0.6
	
	// Bonus for multiple indicators
	indicatorBonus := float64(len(indicators)) * 0.1
	
	// Bonus for conversation history
	historyBonus := float64(historyLength) * 0.05
	
	confidence := baseConfidence + indicatorBonus + historyBonus
	
	// Cap at 1.0
	if confidence > 1.0 {
		confidence = 1.0
	}
	
	return confidence
}

// getCulturalAdaptation gets appropriate cultural adaptation
func (ecp *EnhancedCulturalProcessor) getCulturalAdaptation(context *CulturalContext, serviceType string, mood *MoodDetectionResult) *CulturalAdaptation {
	// Get base adaptation from social context
	baseAdaptation := ecp.socialContextRules[context.SocialContext]
	
	// Modify based on mood if available
	if mood != nil {
		baseAdaptation = ecp.adaptForMood(baseAdaptation, mood)
	}
	
	// Modify based on regional context
	baseAdaptation = ecp.adaptForRegion(baseAdaptation, context.Region)
	
	// Modify based on religious context
	baseAdaptation = ecp.adaptForReligiousContext(baseAdaptation, context.ReligiousContext)
	
	return &baseAdaptation
}

// adaptForMood adapts cultural response based on detected mood
func (ecp *EnhancedCulturalProcessor) adaptForMood(adaptation CulturalAdaptation, mood *MoodDetectionResult) CulturalAdaptation {
	switch mood.PrimaryMood {
	case "frustrated":
		adaptation.ResponseModifiers = append(adaptation.ResponseModifiers, "empathetic_tone", "solution_focused")
	case "confused":
		adaptation.ResponseModifiers = append(adaptation.ResponseModifiers, "patient_explanation", "step_by_step")
	case "anxious":
		adaptation.ResponseModifiers = append(adaptation.ResponseModifiers, "reassuring_tone", "clear_timeline")
	case "happy":
		adaptation.ResponseModifiers = append(adaptation.ResponseModifiers, "maintain_positivity")
	case "excited":
		adaptation.ResponseModifiers = append(adaptation.ResponseModifiers, "match_enthusiasm")
	case "tired":
		adaptation.ResponseModifiers = append(adaptation.ResponseModifiers, "concise_response", "efficient")
	}
	
	return adaptation
}

// adaptForRegion adapts cultural response based on regional context
func (ecp *EnhancedCulturalProcessor) adaptForRegion(adaptation CulturalAdaptation, region string) CulturalAdaptation {
	switch region {
	case "sunda", "jawa_barat":
		adaptation.RegionalElements = append(adaptation.RegionalElements, "sundanese_politeness")
		adaptation.ResponseModifiers = append(adaptation.ResponseModifiers, "regional_courtesy")
	case "jakarta":
		adaptation.RegionalElements = append(adaptation.RegionalElements, "jakarta_efficiency")
	}
	
	return adaptation
}

// adaptForReligiousContext adapts cultural response based on religious context
func (ecp *EnhancedCulturalProcessor) adaptForReligiousContext(adaptation CulturalAdaptation, religiousContext string) CulturalAdaptation {
	switch religiousContext {
	case "islamic":
		adaptation.ReligiousElements = append(adaptation.ReligiousElements, "islamic_courtesy")
		adaptation.ResponseModifiers = append(adaptation.ResponseModifiers, "islamic_greeting_response")
	case "christian":
		adaptation.ReligiousElements = append(adaptation.ReligiousElements, "christian_courtesy")
	}
	
	return adaptation
}

// applyCulturalAdaptation applies cultural adaptation to response
func (ecp *EnhancedCulturalProcessor) applyCulturalAdaptation(response string, context *CulturalContext, adaptation *CulturalAdaptation, req *EnhancedCulturalRequest) string {
	processedResponse := response
	
	// Apply address form
	processedResponse = ecp.applyAddressForm(processedResponse, adaptation.AddressForm)
	
	// Apply language level
	processedResponse = ecp.applyLanguageLevel(processedResponse, adaptation.LanguageLevel)
	
	// Apply response modifiers
	for _, modifier := range adaptation.ResponseModifiers {
		processedResponse = ecp.applyResponseModifier(processedResponse, modifier, context, req)
	}
	
	return processedResponse
}

// applyAddressForm applies appropriate address form
func (ecp *EnhancedCulturalProcessor) applyAddressForm(response, addressForm string) string {
	switch addressForm {
	case "Bapak/Ibu":
		response = strings.ReplaceAll(response, "Anda", "Bapak/Ibu")
		response = strings.ReplaceAll(response, "kamu", "Bapak/Ibu")
	case "Kakak":
		response = strings.ReplaceAll(response, "Anda", "Kakak")
		response = strings.ReplaceAll(response, "Bapak/Ibu", "Kakak")
	}
	return response
}

// applyLanguageLevel applies appropriate language level
func (ecp *EnhancedCulturalProcessor) applyLanguageLevel(response, level string) string {
	switch level {
	case "formal":
		// Make more formal
		response = strings.ReplaceAll(response, "gimana", "bagaimana")
		response = strings.ReplaceAll(response, "kayak", "seperti")
		response = strings.ReplaceAll(response, "gitu", "demikian")
	case "casual":
		// Make more casual (while maintaining respect)
		response = strings.ReplaceAll(response, "demikian", "begitu")
		response = strings.ReplaceAll(response, "dengan demikian", "jadi")
	}
	return response
}

// applyResponseModifier applies specific response modifier
func (ecp *EnhancedCulturalProcessor) applyResponseModifier(response, modifier string, context *CulturalContext, req *EnhancedCulturalRequest) string {
	switch modifier {
	case "add_institutional_context":
		if !strings.Contains(response, "Dinas Kependudukan") {
			response = "Sebagai AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut, " + response
		}
	case "empathetic_tone":
		response = "Saya memahami situasi Bapak/Ibu. " + response
	case "reassuring_tone":
		response = "Tenang saja, Bapak/Ibu. " + response
	case "patient_explanation":
		response = "Baik, saya akan menjelaskan dengan detail. " + response
	case "islamic_greeting_response":
		if strings.Contains(strings.ToLower(req.Query), "assalamualaikum") {
			response = "Waalaikumsalam warahmatullahi wabarakatuh. " + response
		}
	}
	return response
}

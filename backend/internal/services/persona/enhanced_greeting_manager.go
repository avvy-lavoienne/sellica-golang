package persona

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// EnhancedGreetingManager handles intelligent greeting generation with session continuity
// Enhanced from Next.js SmartGreetingManager
type EnhancedGreetingManager struct {
	greetingProtocols    []GreetingProtocol
	sessionMemory        map[string]*SessionGreetingContext
	culturalVariations   map[string][]string
	greetingHistory      map[string][]GreetingRecord
	greetingPatterns     []*regexp.Regexp
	enabled              bool
}

// SessionGreetingContext tracks greeting context for sessions
type SessionGreetingContext struct {
	SessionID           string    `json:"session_id"`
	UserID              string    `json:"user_id"`
	LastGreetingTime    time.Time `json:"last_greeting_time"`
	GreetingCount       int       `json:"greeting_count"`
	ConversationStage   string    `json:"conversation_stage"`   // new, ongoing, returning
	PreferredStyle      string    `json:"preferred_style"`      // formal, casual, friendly
	CulturalContext     string    `json:"cultural_context"`     // islamic, general, regional
	SessionContinuity   bool      `json:"session_continuity"`   // whether session is continuous
}

// GreetingRecord tracks greeting history
type GreetingRecord struct {
	Timestamp     time.Time `json:"timestamp"`
	GreetingType  string    `json:"greeting_type"`
	UserQuery     string    `json:"user_query"`
	ResponseGiven string    `json:"response_given"`
	Effectiveness float64   `json:"effectiveness"` // 0.0-1.0
}

// EnhancedGreetingRequest represents a request for enhanced greeting generation
type EnhancedGreetingRequest struct {
	UserID              string                 `json:"user_id"`
	SessionID           string                 `json:"session_id"`
	TimeOfDay           string                 `json:"time_of_day"`
	IsFirstContact      bool                   `json:"is_first_contact"`
	ServiceType         string                 `json:"service_type"`
	UserTone            string                 `json:"user_tone"`
	UserQuery           string                 `json:"user_query"`
	ConversationHistory []string               `json:"conversation_history"`
	CulturalContext     *CulturalContext       `json:"cultural_context"`
	UserMood            *MoodDetectionResult   `json:"user_mood"`
	Context             map[string]interface{} `json:"context"`
}

// EnhancedGreetingResponse represents the result of enhanced greeting generation
type EnhancedGreetingResponse struct {
	Greeting              string                 `json:"greeting"`
	GreetingType          string                 `json:"greeting_type"`          // full_greeting, acknowledgment, continuation, none
	ShouldPreventRepetition bool                   `json:"should_prevent_repetition"`
	CulturalAdaptation    string                 `json:"cultural_adaptation"`
	PersonalizationLevel  string                 `json:"personalization_level"`  // low, medium, high
	SessionContinuity     bool                   `json:"session_continuity"`
	ProcessingTime        float64                `json:"processing_time"`
	Metadata              map[string]interface{} `json:"metadata"`
}

// GreetingDecision represents the decision about whether to greet
type GreetingDecision struct {
	ShouldGreet       bool   `json:"should_greet"`
	Reason            string `json:"reason"`
	PreventRepetition bool   `json:"prevent_repetition"`
}

// NewEnhancedGreetingManager creates a new enhanced greeting manager
func NewEnhancedGreetingManager(protocols []GreetingProtocol) *EnhancedGreetingManager {
	manager := &EnhancedGreetingManager{
		greetingProtocols:  protocols,
		sessionMemory:      make(map[string]*SessionGreetingContext),
		culturalVariations: make(map[string][]string),
		greetingHistory:    make(map[string][]GreetingRecord),
		greetingPatterns:   make([]*regexp.Regexp, 0),
		enabled:            true,
	}

	manager.initializeCulturalVariations()
	manager.initializeGreetingPatterns()
	return manager
}

// GenerateEnhancedGreeting generates intelligent greeting with session continuity
func (egm *EnhancedGreetingManager) GenerateEnhancedGreeting(ctx context.Context, req *EnhancedGreetingRequest) (*EnhancedGreetingResponse, error) {
	if !egm.enabled {
		return &EnhancedGreetingResponse{
			Greeting:     "",
			GreetingType: "none",
		}, nil
	}

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"user_id":         req.UserID,
		"session_id":      req.SessionID,
		"time_of_day":     req.TimeOfDay,
		"is_first_contact": req.IsFirstContact,
		"service_type":    req.ServiceType,
		"user_query":      req.UserQuery,
	}).Debug("Generating enhanced greeting")

	// Get or create session context
	sessionContext := egm.getOrCreateSessionContext(req)

	// Determine if greeting should be generated
	greetingDecision := egm.analyzeGreetingNeed(req, sessionContext)

	var greeting string
	var greetingType string
	var culturalAdaptation string
	var personalizationLevel string

	if greetingDecision.ShouldGreet {
		// Generate appropriate greeting
		greeting, greetingType, culturalAdaptation, personalizationLevel = egm.generateContextualGreeting(req, sessionContext)

		// Update session context
		egm.updateSessionContext(sessionContext, req, greeting)

		// Record greeting history
		egm.recordGreetingHistory(req.UserID, req.UserQuery, greeting, greetingType)
	} else {
		greetingType = greetingDecision.Reason
	}

	processingTime := float64(time.Since(startTime).Nanoseconds()) / 1e6

	response := &EnhancedGreetingResponse{
		Greeting:              greeting,
		GreetingType:          greetingType,
		ShouldPreventRepetition: greetingDecision.PreventRepetition,
		CulturalAdaptation:    culturalAdaptation,
		PersonalizationLevel:  personalizationLevel,
		SessionContinuity:     sessionContext.SessionContinuity,
		ProcessingTime:        processingTime,
		Metadata: map[string]interface{}{
			"greeting_manager_version": "2.0_enhanced_from_nextjs",
			"session_stage":           sessionContext.ConversationStage,
			"greeting_count":          sessionContext.GreetingCount,
			"cultural_context":        sessionContext.CulturalContext,
		},
	}

	logrus.WithFields(logrus.Fields{
		"greeting_type":         greetingType,
		"cultural_adaptation":   culturalAdaptation,
		"personalization_level": personalizationLevel,
		"session_continuity":    sessionContext.SessionContinuity,
		"processing_ms":         processingTime,
	}).Debug("Enhanced greeting generated successfully")

	return response, nil
}

// initializeCulturalVariations sets up cultural greeting variations
func (egm *EnhancedGreetingManager) initializeCulturalVariations() {
	// Islamic greeting variations
	egm.culturalVariations["islamic"] = []string{
		"Waalaikumsalam warahmatullahi wabarakatuh, Bapak/Ibu. Selamat {time}. Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.",
		"Waalaikumsalam warahmatullahi wabarakatuh. Barakallahu fiikum, Bapak/Ibu. Saya SELLY siap membantu dengan layanan administrasi kependudukan.",
	}

	// General casual variations
	egm.culturalVariations["casual"] = []string{
		"Halo juga, Bapak/Ibu! Selamat {time}. Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.",
		"Hai! Senang bisa membantu Bapak/Ibu hari ini. Saya SELLY dari Dinas Kependudukan Kabupaten Garut.",
	}

	// Formal variations
	egm.culturalVariations["formal"] = []string{
		"Selamat {time}, Bapak/Ibu. Dengan hormat, saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.",
		"Selamat {time}. Saya SELLY AI Assistant yang bertugas membantu Bapak/Ibu dengan layanan administrasi kependudukan di Kabupaten Garut.",
	}

	// Regional (Sundanese) variations
	egm.culturalVariations["sundanese"] = []string{
		"Wilujeng {time}, Bapak/Ibu. Abdi SELLY AI Assistant ti Dinas Kependudukan sareng Pencatatan Sipil Kabupaten Garut.",
		"Sugeng {time}. Kula SELLY, siap ngabantosan Bapak/Ibu kalayan layanan administrasi kependudukan.",
	}
}

// initializeGreetingPatterns sets up greeting detection patterns
func (egm *EnhancedGreetingManager) initializeGreetingPatterns() {
	egm.greetingPatterns = []*regexp.Regexp{
		regexp.MustCompile(`^(halo|hai|hello)(\s+selly)?$`),
		regexp.MustCompile(`^selamat (pagi|siang|sore|malam)(\s+selly)?$`),
		regexp.MustCompile(`^assalamualaikum(\s+selly)?$`),
		regexp.MustCompile(`^(halo|hai|hello)\s+(kak|kakak|selly)$`),
		regexp.MustCompile(`^selly$`),
		regexp.MustCompile(`^(wilujeng|sugeng)\s+(enjing|siang|sonten|wengi)$`), // Sundanese
	}
}

// analyzeGreetingNeed analyzes whether a greeting should be generated
func (egm *EnhancedGreetingManager) analyzeGreetingNeed(req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) *GreetingDecision {
	// Check if this is a pure greeting query
	if egm.isPureGreeting(req.UserQuery) {
		return &GreetingDecision{
			ShouldGreet:       true,
			Reason:            "pure_greeting",
			PreventRepetition: false,
		}
	}

	// Check session continuity
	if sessionContext.SessionContinuity {
		timeSinceLastGreeting := time.Since(sessionContext.LastGreetingTime)
		
		// Don't greet again if recent greeting (within 5 minutes)
		if timeSinceLastGreeting < 5*time.Minute {
			return &GreetingDecision{
				ShouldGreet:       false,
				Reason:            "recent_greeting",
				PreventRepetition: true,
			}
		}
		
		// For returning users, use acknowledgment instead of full greeting
		if sessionContext.GreetingCount > 0 {
			return &GreetingDecision{
				ShouldGreet:       true,
				Reason:            "acknowledgment",
				PreventRepetition: false,
			}
		}
	}

	// First contact or new session
	if req.IsFirstContact || sessionContext.ConversationStage == "new" {
		return &GreetingDecision{
			ShouldGreet:       true,
			Reason:            "first_contact",
			PreventRepetition: false,
		}
	}

	// Service request with greeting elements
	if egm.hasGreetingElements(req.UserQuery) && egm.hasServiceRequest(req.UserQuery) {
		return &GreetingDecision{
			ShouldGreet:       true,
			Reason:            "greeting_with_service",
			PreventRepetition: false,
		}
	}

	// Default: no greeting needed
	return &GreetingDecision{
		ShouldGreet:       false,
		Reason:            "no_greeting_needed",
		PreventRepetition: false,
	}
}

// isPureGreeting checks if query is a pure greeting
func (egm *EnhancedGreetingManager) isPureGreeting(query string) bool {
	trimmedQuery := strings.TrimSpace(strings.ToLower(query))
	
	for _, pattern := range egm.greetingPatterns {
		if pattern.MatchString(trimmedQuery) {
			return true
		}
	}
	
	return false
}

// hasGreetingElements checks if query contains greeting elements
func (egm *EnhancedGreetingManager) hasGreetingElements(query string) bool {
	lowerQuery := strings.ToLower(query)
	greetingElements := []string{
		"halo", "hai", "hello", "selamat", "assalamualaikum", 
		"wilujeng", "sugeng", "selly",
	}
	
	for _, element := range greetingElements {
		if strings.Contains(lowerQuery, element) {
			return true
		}
	}
	
	return false
}

// hasServiceRequest checks if query contains service request elements
func (egm *EnhancedGreetingManager) hasServiceRequest(query string) bool {
	lowerQuery := strings.ToLower(query)
	serviceElements := []string{
		"ktp", "kk", "akta", "surat", "dokumen", "syarat", "persyaratan",
		"buat", "bikin", "mengurus", "ajukan", "daftar", "cetak",
	}
	
	for _, element := range serviceElements {
		if strings.Contains(lowerQuery, element) {
			return true
		}
	}
	
	return false
}

// getOrCreateSessionContext gets or creates session context
func (egm *EnhancedGreetingManager) getOrCreateSessionContext(req *EnhancedGreetingRequest) *SessionGreetingContext {
	if context, exists := egm.sessionMemory[req.SessionID]; exists {
		// Update session continuity
		context.SessionContinuity = time.Since(context.LastGreetingTime) < 30*time.Minute
		return context
	}

	// Create new session context
	context := &SessionGreetingContext{
		SessionID:         req.SessionID,
		UserID:            req.UserID,
		LastGreetingTime:  time.Time{}, // Zero time for new session
		GreetingCount:     0,
		ConversationStage: "new",
		PreferredStyle:    egm.detectPreferredStyle(req),
		CulturalContext:   egm.detectCulturalContext(req),
		SessionContinuity: false,
	}

	egm.sessionMemory[req.SessionID] = context
	return context
}

// detectPreferredStyle detects user's preferred communication style
func (egm *EnhancedGreetingManager) detectPreferredStyle(req *EnhancedGreetingRequest) string {
	lowerQuery := strings.ToLower(req.UserQuery)
	
	// Formal indicators
	formalPatterns := []string{"mohon", "dengan hormat", "saya bermaksud", "perkenankan"}
	for _, pattern := range formalPatterns {
		if strings.Contains(lowerQuery, pattern) {
			return "formal"
		}
	}
	
	// Casual indicators
	casualPatterns := []string{"gimana", "kayak", "nih", "sih", "deh", "kak", "bang"}
	for _, pattern := range casualPatterns {
		if strings.Contains(lowerQuery, pattern) {
			return "casual"
		}
	}
	
	return "friendly" // default
}

// detectCulturalContext detects cultural context from query
func (egm *EnhancedGreetingManager) detectCulturalContext(req *EnhancedGreetingRequest) string {
	lowerQuery := strings.ToLower(req.UserQuery)
	
	// Islamic context
	if strings.Contains(lowerQuery, "assalamualaikum") {
		return "islamic"
	}
	
	// Sundanese context
	sundanesePatterns := []string{"wilujeng", "sugeng", "kumaha", "naon", "atuh", "mah", "teh"}
	for _, pattern := range sundanesePatterns {
		if strings.Contains(lowerQuery, pattern) {
			return "sundanese"
		}
	}
	
	// Use cultural context from request if available
	if req.CulturalContext != nil {
		if req.CulturalContext.ReligiousContext == "islamic" {
			return "islamic"
		}
		if req.CulturalContext.Region == "sunda" || req.CulturalContext.Region == "jawa_barat" {
			return "sundanese"
		}
	}
	
	return "general"
}

// generateContextualGreeting generates appropriate greeting based on context
func (egm *EnhancedGreetingManager) generateContextualGreeting(req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) (string, string, string, string) {
	var greeting string
	var greetingType string
	var culturalAdaptation string
	var personalizationLevel string

	// Determine greeting type based on context
	if sessionContext.GreetingCount == 0 {
		greetingType = "full_greeting"
		personalizationLevel = "high"
	} else if sessionContext.SessionContinuity {
		greetingType = "acknowledgment"
		personalizationLevel = "medium"
	} else {
		greetingType = "continuation"
		personalizationLevel = "low"
	}

	// Generate base greeting
	switch greetingType {
	case "full_greeting":
		greeting = egm.generateFullGreeting(req, sessionContext)
	case "acknowledgment":
		greeting = egm.generateAcknowledgment(req, sessionContext)
	case "continuation":
		greeting = egm.generateContinuation(req, sessionContext)
	}

	// Apply cultural adaptation
	greeting, culturalAdaptation = egm.applyCulturalAdaptation(greeting, req, sessionContext)

	// Apply mood-based adaptation if available
	if req.UserMood != nil {
		greeting = egm.applyMoodAdaptation(greeting, req.UserMood)
	}

	return greeting, greetingType, culturalAdaptation, personalizationLevel
}

// generateFullGreeting generates a full greeting for new interactions
func (egm *EnhancedGreetingManager) generateFullGreeting(req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) string {
	timeOfDay := egm.getCurrentTimeOfDay()
	
	baseGreeting := fmt.Sprintf("Selamat %s, Bapak/Ibu! Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Bagaimana saya bisa membantu Anda dengan layanan administrasi kependudukan?", timeOfDay)
	
	return baseGreeting
}

// generateAcknowledgment generates an acknowledgment for returning users
func (egm *EnhancedGreetingManager) generateAcknowledgment(req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) string {
	return "Baik, saya siap membantu Bapak/Ibu lebih lanjut. Ada yang bisa saya bantu lagi?"
}

// generateContinuation generates a continuation greeting
func (egm *EnhancedGreetingManager) generateContinuation(req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) string {
	return "Saya SELLY siap membantu Bapak/Ibu. Silakan sampaikan kebutuhan Anda."
}

// applyCulturalAdaptation applies cultural adaptation to greeting
func (egm *EnhancedGreetingManager) applyCulturalAdaptation(greeting string, req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) (string, string) {
	culturalContext := sessionContext.CulturalContext
	
	// Apply Islamic greeting response
	if culturalContext == "islamic" && strings.Contains(strings.ToLower(req.UserQuery), "assalamualaikum") {
		timeOfDay := egm.getCurrentTimeOfDay()
		adaptedGreeting := fmt.Sprintf("Waalaikumsalam warahmatullahi wabarakatuh, Bapak/Ibu. Selamat %s. Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Bagaimana saya bisa membantu Anda?", timeOfDay)
		return adaptedGreeting, "islamic_response"
	}
	
	// Apply Sundanese adaptation
	if culturalContext == "sundanese" {
		// Add subtle Sundanese politeness markers
		greeting = strings.ReplaceAll(greeting, "Bagaimana saya bisa membantu", "Kumaha abdi tiasa ngabantosan")
		return greeting, "sundanese_adaptation"
	}
	
	return greeting, "standard"
}

// applyMoodAdaptation applies mood-based adaptation to greeting
func (egm *EnhancedGreetingManager) applyMoodAdaptation(greeting string, mood *MoodDetectionResult) string {
	switch mood.PrimaryMood {
	case "frustrated":
		greeting = "Saya memahami Bapak/Ibu mungkin mengalami kesulitan. " + greeting
	case "anxious":
		greeting = "Tenang saja, Bapak/Ibu. " + greeting
	case "confused":
		greeting = "Baik, saya akan membantu menjelaskan dengan detail. " + greeting
	case "happy":
		greeting = strings.ReplaceAll(greeting, "membantu", "dengan senang hati membantu")
	case "excited":
		greeting = strings.ReplaceAll(greeting, "membantu", "dengan antusias membantu")
	}
	
	return greeting
}

// getCurrentTimeOfDay gets current time of day in Indonesian
func (egm *EnhancedGreetingManager) getCurrentTimeOfDay() string {
	hour := time.Now().Hour()
	
	switch {
	case hour >= 5 && hour < 12:
		return "pagi"
	case hour >= 12 && hour < 15:
		return "siang"
	case hour >= 15 && hour < 19:
		return "sore"
	default:
		return "malam"
	}
}

// updateSessionContext updates session context after greeting
func (egm *EnhancedGreetingManager) updateSessionContext(sessionContext *SessionGreetingContext, req *EnhancedGreetingRequest, greeting string) {
	sessionContext.LastGreetingTime = time.Now()
	sessionContext.GreetingCount++
	
	if sessionContext.ConversationStage == "new" {
		sessionContext.ConversationStage = "ongoing"
	}
}

// recordGreetingHistory records greeting in history for analysis
func (egm *EnhancedGreetingManager) recordGreetingHistory(userID, userQuery, greeting, greetingType string) {
	record := GreetingRecord{
		Timestamp:     time.Now(),
		GreetingType:  greetingType,
		UserQuery:     userQuery,
		ResponseGiven: greeting,
		Effectiveness: 0.8, // Default effectiveness, could be improved with feedback
	}
	
	if egm.greetingHistory[userID] == nil {
		egm.greetingHistory[userID] = make([]GreetingRecord, 0)
	}
	
	egm.greetingHistory[userID] = append(egm.greetingHistory[userID], record)
	
	// Keep only last 10 records per user
	if len(egm.greetingHistory[userID]) > 10 {
		egm.greetingHistory[userID] = egm.greetingHistory[userID][1:]
	}
}

package persona

import (
	"context"
	"math/rand"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// SimpleEmoticonEnhancer provides basic emoticon enhancement for greetings
type SimpleEmoticonEnhancer struct {
	enabled bool
}

// NewSimpleEmoticonEnhancer creates a new simple emoticon enhancer
func NewSimpleEmoticonEnhancer() *SimpleEmoticonEnhancer {
	return &SimpleEmoticonEnhancer{enabled: true}
}

// IsEnabled returns whether the enhancer is enabled
func (see *SimpleEmoticonEnhancer) IsEnabled() bool {
	return see.enabled
}

// EnhanceGreeting applies basic emoticon enhancement to greetings
func (see *SimpleEmoticonEnhancer) EnhanceGreeting(greeting string) string {
	if !see.enabled {
		return greeting
	}

	// Simple enhancement - add a smiley if greeting doesn't already have emoticons
	if !containsEmoticon(greeting) {
		return greeting + " 😊"
	}

	return greeting
}

// containsEmoticon checks if a string contains emoticons
func containsEmoticon(text string) bool {
	// Simple check for common emoticon ranges
	for _, r := range text {
		// Check for emoji ranges (simplified)
		if r > 0x1F600 && r < 0x1F64F { // Emoticons
			return true
		}
		if r > 0x1F300 && r < 0x1F5FF { // Misc Symbols and Pictographs
			return true
		}
		if r > 0x1F680 && r < 0x1F6FF { // Transport and Map
			return true
		}
		if r > 0x1F1E0 && r < 0x1F1FF { // Regional indicator symbols
			return true
		}
		if r > 0x2600 && r < 0x26FF { // Misc symbols
			return true
		}
	}
	return false
}

// EmoticonEnhancedGreetingManager provides intelligent greeting generation with emoticon integration
type EmoticonEnhancedGreetingManager struct {
	*EnhancedGreetingManager
	emoticonEnhancer *SimpleEmoticonEnhancer
	greetingVariations map[string][]GreetingVariation
	enabled           bool
}

// GreetingVariation represents a greeting variation with emoticon
type GreetingVariation struct {
	Text     string   `json:"text"`
	Emoticons []string `json:"emoticons"`
	Context  string   `json:"context"`
	Weight   float64  `json:"weight"`
}

// NewEmoticonEnhancedGreetingManager creates a new emoticon-enhanced greeting manager
func NewEmoticonEnhancedGreetingManager() *EmoticonEnhancedGreetingManager {
	// Initialize base enhanced greeting manager
	baseManager := NewEnhancedGreetingManager([]GreetingProtocol{})

	manager := &EmoticonEnhancedGreetingManager{
		EnhancedGreetingManager: baseManager,
		emoticonEnhancer:        NewSimpleEmoticonEnhancer(),
		greetingVariations:      make(map[string][]GreetingVariation),
		enabled:                 true,
	}

	manager.initializeGreetingVariations()
	return manager
}

// initializeGreetingVariations sets up diverse greeting variations with emoticons
func (eegm *EmoticonEnhancedGreetingManager) initializeGreetingVariations() {
	// Morning greetings with variety
	eegm.greetingVariations["morning"] = []GreetingVariation{
		{
			Text:     "Selamat pagi, Bapak/Ibu! 🌅 Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Senang bisa membantu Anda pagi ini!",
			Emoticons: []string{"🌅", "😊"},
			Context:  "morning_first_contact",
			Weight:   0.9,
		},
		{
			Text:     "Pagi yang cerah, Bapak/Ibu! ☀️ Saya SELLY siap membantu Anda dengan layanan administrasi kependudukan hari ini.",
			Emoticons: []string{"☀️", "🙂"},
			Context:  "morning_casual",
			Weight:   0.7,
		},
		{
			Text:     "Selamat pagi! 🌞 Saya SELLY dari Disdukcapil Garut. Ada yang bisa saya bantu pagi ini?",
			Emoticons: []string{"🌞", "🤗"},
			Context:  "morning_friendly",
			Weight:   0.8,
		},
		{
			Text:     "Pagi Bapak/Ibu! 🌅 SELLY di sini siap membantu dengan semua kebutuhan administrasi kependudukan Anda.",
			Emoticons: []string{"🌅", "💪"},
			Context:  "morning_helpful",
			Weight:   0.6,
		},
	}

	// Afternoon greetings
	eegm.greetingVariations["afternoon"] = []GreetingVariation{
		{
			Text:     "Selamat siang, Bapak/Ibu! ☀️ Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Bagaimana saya bisa membantu Anda?",
			Emoticons: []string{"☀️", "😊"},
			Context:  "afternoon_formal",
			Weight:   0.8,
		},
		{
			Text:     "Siang yang baik, Bapak/Ibu! 🌤️ SELLY siap membantu Anda dengan layanan administrasi kependudukan.",
			Emoticons: []string{"🌤️", "🙂"},
			Context:  "afternoon_casual",
			Weight:   0.7,
		},
		{
			Text:     "Selamat siang! 🌞 Saya SELLY dari Disdukcapil Garut. Ada yang bisa saya bantu hari ini?",
			Emoticons: []string{"🌞", "🤗"},
			Context:  "afternoon_friendly",
			Weight:   0.9,
		},
	}

	// Evening greetings
	eegm.greetingVariations["evening"] = []GreetingVariation{
		{
			Text:     "Selamat sore, Bapak/Ibu! 🌆 Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Senang bisa membantu Anda sore ini!",
			Emoticons: []string{"🌆", "😊"},
			Context:  "evening_formal",
			Weight:   0.8,
		},
		{
			Text:     "Sore yang menyenangkan, Bapak/Ibu! 🌅 SELLY siap membantu Anda dengan layanan administrasi kependudukan.",
			Emoticons: []string{"🌅", "🙂"},
			Context:  "evening_casual",
			Weight:   0.7,
		},
		{
			Text:     "Selamat sore! 🌇 Saya SELLY dari Disdukcapil Garut. Ada yang bisa saya bantu?",
			Emoticons: []string{"🌇", "🤗"},
			Context:  "evening_friendly",
			Weight:   0.9,
		},
	}

	// Night greetings
	eegm.greetingVariations["night"] = []GreetingVariation{
		{
			Text:     "Selamat malam, Bapak/Ibu! 🌙 Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Bagaimana saya bisa membantu Anda?",
			Emoticons: []string{"🌙", "😊"},
			Context:  "night_formal",
			Weight:   0.8,
		},
		{
			Text:     "Malam yang tenang, Bapak/Ibu! 🌙 SELLY siap membantu Anda dengan layanan administrasi kependudukan.",
			Emoticons: []string{"🌙", "🙂"},
			Context:  "night_casual",
			Weight:   0.7,
		},
		{
			Text:     "Selamat malam! 🌟 Saya SELLY dari Disdukcapil Garut. Ada yang bisa saya bantu malam ini?",
			Emoticons: []string{"🌟", "🤗"},
			Context:  "night_friendly",
			Weight:   0.9,
		},
	}

	// Islamic greetings
	eegm.greetingVariations["islamic"] = []GreetingVariation{
		{
			Text:     "Waalaikumsalam warahmatullahi wabarakatuh, Bapak/Ibu! 🌙 Barakallahu fiikum. Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.",
			Emoticons: []string{"🌙", "🤲"},
			Context:  "islamic_response",
			Weight:   0.95,
		},
		{
			Text:     "Waalaikumsalam warahmatullahi wabarakatuh! 🤲 Saya SELLY siap membantu Anda dengan layanan administrasi kependudukan.",
			Emoticons: []string{"🤲", "😊"},
			Context:  "islamic_casual",
			Weight:   0.9,
		},
	}

	// Service-specific greetings
	eegm.greetingVariations["ktp_service"] = []GreetingVariation{
		{
			Text:     "Selamat {time}, Bapak/Ibu! 🆔 Saya SELLY siap membantu Anda dengan pengurusan Kartu Tanda Penduduk (KTP).",
			Emoticons: []string{"🆔", "💪"},
			Context:  "ktp_helpful",
			Weight:   0.8,
		},
		{
			Text:     "Halo! 🆔 SELLY di sini untuk membantu Anda dengan semua kebutuhan KTP Anda.",
			Emoticons: []string{"🆔", "😊"},
			Context:  "ktp_friendly",
			Weight:   0.7,
		},
	}

	eegm.greetingVariations["akta_service"] = []GreetingVariation{
		{
			Text:     "Selamat {time}, Bapak/Ibu! 📄 Saya SELLY siap membantu Anda dengan pengurusan akta kelahiran.",
			Emoticons: []string{"📄", "👶"},
			Context:  "akta_helpful",
			Weight:   0.8,
		},
		{
			Text:     "Halo! 📄 SELLY di sini untuk membantu Anda dengan proses akta kelahiran.",
			Emoticons: []string{"📄", "😊"},
			Context:  "akta_friendly",
			Weight:   0.7,
		},
	}

	// Acknowledgment greetings for returning users
	eegm.greetingVariations["acknowledgment"] = []GreetingVariation{
		{
			Text:     "Baik, saya siap membantu Bapak/Ibu lebih lanjut! 😊 Ada yang bisa saya bantu lagi?",
			Emoticons: []string{"😊", "🤝"},
			Context:  "acknowledgment_helpful",
			Weight:   0.8,
		},
		{
			Text:     "Saya SELLY siap melanjutkan membantu Anda! 💪 Apa yang bisa saya bantu selanjutnya?",
			Emoticons: []string{"💪", "🙂"},
			Context:  "acknowledgment_motivational",
			Weight:   0.7,
		},
		{
			Text:     "Mari kita lanjutkan! 🚀 Saya siap membantu Anda dengan kebutuhan administrasi Anda.",
			Emoticons: []string{"🚀", "😊"},
			Context:  "acknowledgment_encouraging",
			Weight:   0.9,
		},
	}

	// Continuation greetings
	eegm.greetingVariations["continuation"] = []GreetingVariation{
		{
			Text:     "Saya SELLY siap membantu Bapak/Ibu! 🤗 Silakan sampaikan kebutuhan Anda.",
			Emoticons: []string{"🤗", "💡"},
			Context:  "continuation_friendly",
			Weight:   0.8,
		},
		{
			Text:     "Mari kita selesaikan kebutuhan Anda! 💪 Saya SELLY siap membantu.",
			Emoticons: []string{"💪", "😊"},
			Context:  "continuation_motivational",
			Weight:   0.7,
		},
	}
}

// GenerateEmoticonEnhancedGreeting generates a greeting with emoticon enhancement
func (eegm *EmoticonEnhancedGreetingManager) GenerateEmoticonEnhancedGreeting(ctx context.Context, req *EnhancedGreetingRequest) (*EnhancedGreetingResponse, error) {
	if !eegm.enabled {
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
	}).Debug("Generating emoticon-enhanced greeting")

	// Get session context
	sessionContext := eegm.getOrCreateSessionContext(req)

	// Analyze greeting need
	greetingDecision := eegm.analyzeGreetingNeed(req, sessionContext)

	if !greetingDecision.ShouldGreet {
		return &EnhancedGreetingResponse{
			Greeting:     "",
			GreetingType: greetingDecision.Reason,
		}, nil
	}

	// Generate enhanced greeting with variety
	greeting, greetingType, culturalAdaptation, personalizationLevel := eegm.generateVariedGreeting(req, sessionContext)

	// Apply emoticon enhancement
	emoticonEnhancedGreeting := eegm.applyEmoticonEnhancement(greeting, req, sessionContext)

	// Update session context
	eegm.updateSessionContext(sessionContext, req, emoticonEnhancedGreeting)

	// Record greeting history
	eegm.recordGreetingHistory(req.UserID, req.UserQuery, emoticonEnhancedGreeting, greetingType)

	processingTime := float64(time.Since(startTime).Nanoseconds()) / 1e6

	response := &EnhancedGreetingResponse{
		Greeting:              emoticonEnhancedGreeting,
		GreetingType:          greetingType,
		ShouldPreventRepetition: greetingDecision.PreventRepetition,
		CulturalAdaptation:    culturalAdaptation,
		PersonalizationLevel:  personalizationLevel,
		SessionContinuity:     sessionContext.SessionContinuity,
		ProcessingTime:        processingTime,
		Metadata: map[string]interface{}{
			"greeting_manager_version": "emoticon_enhanced_v1.0",
			"session_stage":           sessionContext.ConversationStage,
			"greeting_count":          sessionContext.GreetingCount,
			"cultural_context":        sessionContext.CulturalContext,
			"emoticon_enhanced":       true,
		},
	}

	logrus.WithFields(logrus.Fields{
		"greeting_type":         greetingType,
		"cultural_adaptation":   culturalAdaptation,
		"personalization_level": personalizationLevel,
		"processing_ms":         processingTime,
		"emoticon_enhanced":     true,
	}).Debug("Emoticon-enhanced greeting generated successfully")

	return response, nil
}

// generateVariedGreeting generates a varied greeting based on context
func (eegm *EmoticonEnhancedGreetingManager) generateVariedGreeting(req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) (string, string, string, string) {
	var greeting string
	var greetingType string
	var culturalAdaptation string
	var personalizationLevel string

	// Determine greeting category
	category := eegm.determineGreetingCategory(req, sessionContext)

	// Get greeting variations for this category
	variations, exists := eegm.greetingVariations[category]
	if !exists || len(variations) == 0 {
		// Fallback to base enhanced greeting
		return eegm.generateContextualGreeting(req, sessionContext)
	}

	// Select variation based on weight and randomness
	selectedVariation := eegm.selectGreetingVariation(variations, req, sessionContext)

	// Personalize the greeting
	greeting = eegm.personalizeGreetingVariation(selectedVariation, req)

	// Determine greeting type
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

	// Apply cultural adaptation
	greeting, culturalAdaptation = eegm.applyCulturalAdaptation(greeting, req, sessionContext)

	return greeting, greetingType, culturalAdaptation, personalizationLevel
}

// determineGreetingCategory determines the appropriate greeting category
func (eegm *EmoticonEnhancedGreetingManager) determineGreetingCategory(req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) string {
	// Check for Islamic greeting
	if strings.Contains(strings.ToLower(req.UserQuery), "assalamualaikum") {
		return "islamic"
	}

	// Check for service-specific greeting
	if req.ServiceType != "" && req.ServiceType != "umum" {
		switch req.ServiceType {
		case "ktp", "ktp_elektronik":
			return "ktp_service"
		case "akta", "akta_kelahiran":
			return "akta_service"
		}
	}

	// Check for acknowledgment/continuation
	if sessionContext.GreetingCount > 0 {
		if sessionContext.SessionContinuity {
			return "acknowledgment"
		}
		return "continuation"
	}

	// Default to time-based greeting
	timeOfDay := req.TimeOfDay
	if timeOfDay == "" {
		timeOfDay = eegm.getCurrentTimeOfDay()
	}

	switch timeOfDay {
	case "morning", "pagi":
		return "morning"
	case "afternoon", "siang":
		return "afternoon"
	case "evening", "sore":
		return "evening"
	case "night", "malam":
		return "night"
	default:
		return "morning" // fallback
	}
}

// selectGreetingVariation selects a greeting variation based on context and weights
func (eegm *EmoticonEnhancedGreetingManager) selectGreetingVariation(variations []GreetingVariation, req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) *GreetingVariation {
	if len(variations) == 0 {
		return nil
	}

	// Calculate weights based on context
	totalWeight := 0.0
	adjustedVariations := make([]GreetingVariation, len(variations))

	for i, variation := range variations {
		weight := variation.Weight

		// Adjust weight based on user preferences
		if sessionContext.PreferredStyle == "formal" && strings.Contains(variation.Context, "casual") {
			weight *= 0.5
		}
		if sessionContext.PreferredStyle == "casual" && strings.Contains(variation.Context, "formal") {
			weight *= 0.7
		}

		// Boost weight for first-time users with friendly variations
		if sessionContext.GreetingCount == 0 && strings.Contains(variation.Context, "friendly") {
			weight *= 1.2
		}

		adjustedVariations[i] = variation
		adjustedVariations[i].Weight = weight
		totalWeight += weight
	}

	// Select variation using weighted random selection
	randomValue := rand.Float64() * totalWeight
	cumulativeWeight := 0.0

	for _, variation := range adjustedVariations {
		cumulativeWeight += variation.Weight
		if randomValue <= cumulativeWeight {
			return &variation
		}
	}

	// Fallback to first variation
	return &variations[0]
}

// personalizeGreetingVariation personalizes the selected greeting variation
func (eegm *EmoticonEnhancedGreetingManager) personalizeGreetingVariation(variation *GreetingVariation, req *EnhancedGreetingRequest) string {
	greeting := variation.Text

	// Replace time placeholder
	timeOfDay := req.TimeOfDay
	if timeOfDay == "" {
		timeOfDay = eegm.getCurrentTimeOfDay()
	}

	// Convert to Indonesian time words
	switch timeOfDay {
	case "morning", "pagi":
		timeOfDay = "pagi"
	case "afternoon", "siang":
		timeOfDay = "siang"
	case "evening", "sore":
		timeOfDay = "sore"
	case "night", "malam":
		timeOfDay = "malam"
	}

	greeting = strings.ReplaceAll(greeting, "{time}", timeOfDay)

	// Note: UserName field not available in EnhancedGreetingRequest
	// Personalization can be enhanced in future versions

	return greeting
}

// applyEmoticonEnhancement applies emoticon enhancement to the greeting
func (eegm *EmoticonEnhancedGreetingManager) applyEmoticonEnhancement(greeting string, req *EnhancedGreetingRequest, sessionContext *SessionGreetingContext) string {
	if !eegm.emoticonEnhancer.IsEnabled() {
		return greeting
	}

	// Use simple emoticon enhancement
	return eegm.emoticonEnhancer.EnhanceGreeting(greeting)
}

// IsEnabled returns whether the emoticon-enhanced greeting manager is enabled
func (eegm *EmoticonEnhancedGreetingManager) IsEnabled() bool {
	return eegm.enabled
}

// SetEnabled enables or disables the emoticon-enhanced greeting manager
func (eegm *EmoticonEnhancedGreetingManager) SetEnabled(enabled bool) {
	eegm.enabled = enabled
}

// GetGreetingVariations returns available greeting variations for a category
func (eegm *EmoticonEnhancedGreetingManager) GetGreetingVariations(category string) []GreetingVariation {
	return eegm.greetingVariations[category]
}

// AddGreetingVariation adds a new greeting variation to a category
func (eegm *EmoticonEnhancedGreetingManager) AddGreetingVariation(category string, variation GreetingVariation) {
	if eegm.greetingVariations[category] == nil {
		eegm.greetingVariations[category] = make([]GreetingVariation, 0)
	}
	eegm.greetingVariations[category] = append(eegm.greetingVariations[category], variation)
}

// GetStats returns greeting generation statistics
func (eegm *EmoticonEnhancedGreetingManager) GetStats() map[string]interface{} {
	totalVariations := 0
	for _, variations := range eegm.greetingVariations {
		totalVariations += len(variations)
	}

	return map[string]interface{}{
		"enabled":           eegm.enabled,
		"categories_count":  len(eegm.greetingVariations),
		"total_variations":  totalVariations,
		"session_memory_size": len(eegm.sessionMemory),
		"emoticon_enhanced": true,
	}
}
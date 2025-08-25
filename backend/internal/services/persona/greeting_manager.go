package persona

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// GreetingManager handles time-based and contextual greeting generation
type GreetingManager struct {
	protocols []GreetingProtocol
	enabled   bool
}

// GreetingRequest represents a request for greeting generation
type GreetingRequest struct {
	UserID         string `json:"user_id"`
	SessionID      string `json:"session_id"`
	TimeOfDay      string `json:"time_of_day"`
	IsFirstContact bool   `json:"is_first_contact"`
	ServiceType    string `json:"service_type"`
	UserTone       string `json:"user_tone"`
	UserName       string `json:"user_name"`
	FormalityLevel string `json:"formality_level"`
}

// GreetingResponse represents the generated greeting
type GreetingResponse struct {
	Greeting       string                 `json:"greeting"`
	TimeOfDay      string                 `json:"time_of_day"`
	FormalityLevel string                 `json:"formality_level"`
	Context        string                 `json:"context"`
	Metadata       map[string]interface{} `json:"metadata"`
}

// NewGreetingManager creates a new greeting manager
func NewGreetingManager(protocols []GreetingProtocol) *GreetingManager {
	return &GreetingManager{
		protocols: protocols,
		enabled:   true,
	}
}

// GenerateGreeting generates an appropriate greeting based on context
func (gm *GreetingManager) GenerateGreeting(ctx context.Context, req *GreetingRequest) string {
	if !gm.enabled {
		return ""
	}

	// Determine time of day if not provided
	timeOfDay := req.TimeOfDay
	if timeOfDay == "" {
		timeOfDay = gm.getCurrentTimeOfDay()
	}

	// Determine context
	greetingContext := gm.determineGreetingContext(req)

	// Find matching protocol
	protocol := gm.findMatchingProtocol(timeOfDay, greetingContext)
	if protocol == nil {
		return gm.generateDefaultGreeting(timeOfDay, req.IsFirstContact)
	}

	// Generate personalized greeting
	greeting := gm.personalizeGreeting(protocol.Template, req)

	logrus.WithFields(logrus.Fields{
		"time_of_day":      timeOfDay,
		"context":          greetingContext,
		"is_first_contact": req.IsFirstContact,
		"service_type":     req.ServiceType,
	}).Debug("Generated greeting")

	return greeting
}

// getCurrentTimeOfDay determines the current time of day
func (gm *GreetingManager) getCurrentTimeOfDay() string {
	hour := time.Now().Hour()

	switch {
	case hour >= 5 && hour < 12:
		return "morning"
	case hour >= 12 && hour < 17:
		return "afternoon"
	case hour >= 17 && hour < 21:
		return "evening"
	default:
		return "night"
	}
}

// determineGreetingContext determines the appropriate greeting context
func (gm *GreetingManager) determineGreetingContext(req *GreetingRequest) string {
	if req.IsFirstContact {
		return "first-contact"
	}

	if req.ServiceType != "" && req.ServiceType != "umum" {
		return "service-specific"
	}

	if req.UserTone == "urgent" || req.UserTone == "frustrated" {
		return "urgent"
	}

	return "returning-user"
}

// findMatchingProtocol finds the best matching greeting protocol
func (gm *GreetingManager) findMatchingProtocol(timeOfDay, context string) *GreetingProtocol {
	// First, try to find exact match
	for _, protocol := range gm.protocols {
		if protocol.TimeRange == timeOfDay && protocol.Context == context {
			return &protocol
		}
	}

	// Then, try to find time match with general context
	for _, protocol := range gm.protocols {
		if protocol.TimeRange == timeOfDay && protocol.Context == "general" {
			return &protocol
		}
	}

	// Finally, try to find any time match
	for _, protocol := range gm.protocols {
		if protocol.TimeRange == timeOfDay {
			return &protocol
		}
	}

	return nil
}

// personalizeGreeting personalizes the greeting template
func (gm *GreetingManager) personalizeGreeting(template string, req *GreetingRequest) string {
	greeting := template

	// Replace placeholders
	if req.UserName != "" {
		greeting = strings.Replace(greeting, "{name}", req.UserName, -1)
	} else {
		greeting = strings.Replace(greeting, "{name}", "Bapak/Ibu", -1)
	}

	// Add service-specific context
	if req.ServiceType != "" && req.ServiceType != "umum" {
		greeting = gm.addServiceContext(greeting, req.ServiceType)
	}

	// Adjust for user tone
	if req.UserTone == "urgent" || req.UserTone == "frustrated" {
		greeting = gm.addUrgencyContext(greeting)
	}

	return greeting
}

// generateDefaultGreeting generates a default greeting when no protocol matches
func (gm *GreetingManager) generateDefaultGreeting(timeOfDay string, isFirstContact bool) string {
	var timeGreeting string
	switch timeOfDay {
	case "morning":
		timeGreeting = "Selamat pagi"
	case "afternoon":
		timeGreeting = "Selamat siang"
	case "evening":
		timeGreeting = "Selamat sore"
	case "night":
		timeGreeting = "Selamat malam"
	default:
		timeGreeting = "Selamat"
	}

	if isFirstContact {
		return fmt.Sprintf("%s, Bapak/Ibu. Saya SELLY, siap membantu Anda dengan layanan administrasi kependudukan.", timeGreeting)
	}

	return fmt.Sprintf("%s, Bapak/Ibu. Ada yang bisa saya bantu?", timeGreeting)
}

// addServiceContext adds service-specific context to greeting
func (gm *GreetingManager) addServiceContext(greeting, serviceType string) string {
	serviceContexts := map[string]string{
		"ktp":         "terkait pengurusan KTP",
		"akta":        "terkait akta kelahiran",
		"perpindahan": "terkait perpindahan domisili",
		"kk":          "terkait Kartu Keluarga",
		"surat":       "terkait surat keterangan",
	}

	if context, exists := serviceContexts[serviceType]; exists {
		return greeting + " " + context
	}

	return greeting
}

// addUrgencyContext adds urgency context to greeting
func (gm *GreetingManager) addUrgencyContext(greeting string) string {
	return "Saya memahami kebutuhan Anda yang mendesak. " + greeting
}

// GenerateContextualGreeting generates greeting based on conversation history
func (gm *GreetingManager) GenerateContextualGreeting(ctx context.Context, req *GreetingRequest, conversationHistory []string) string {
	// Analyze conversation history for context
	if len(conversationHistory) == 0 {
		return gm.GenerateGreeting(ctx, req)
	}

	// If user has been asking about the same service, acknowledge continuity
	if gm.detectServiceContinuity(conversationHistory, req.ServiceType) {
		return gm.generateContinuityGreeting(req.ServiceType)
	}

	// If user seems confused, offer clarification
	if gm.detectConfusion(conversationHistory) {
		return "Mari saya bantu memperjelas informasi yang Anda butuhkan."
	}

	// Default to regular greeting
	return gm.GenerateGreeting(ctx, req)
}

// detectServiceContinuity detects if user is continuing with the same service
func (gm *GreetingManager) detectServiceContinuity(history []string, currentService string) bool {
	if len(history) < 2 || currentService == "" {
		return false
	}

	// Simple keyword matching for service continuity
	serviceKeywords := map[string][]string{
		"ktp":         {"ktp", "kartu tanda penduduk", "identitas"},
		"akta":        {"akta", "kelahiran", "lahir"},
		"perpindahan": {"pindah", "domisili", "alamat"},
	}

	keywords, exists := serviceKeywords[currentService]
	if !exists {
		return false
	}

	// Check if recent messages contain service keywords
	recentMessages := history[max(0, len(history)-3):]
	for _, message := range recentMessages {
		messageLower := strings.ToLower(message)
		for _, keyword := range keywords {
			if strings.Contains(messageLower, keyword) {
				return true
			}
		}
	}

	return false
}

// detectConfusion detects if user seems confused based on conversation history
func (gm *GreetingManager) detectConfusion(history []string) bool {
	if len(history) < 2 {
		return false
	}

	confusionIndicators := []string{
		"tidak mengerti", "bingung", "tidak paham", "maksudnya",
		"gimana", "bagaimana", "apa itu", "jelaskan",
	}

	recentMessage := strings.ToLower(history[len(history)-1])
	for _, indicator := range confusionIndicators {
		if strings.Contains(recentMessage, indicator) {
			return true
		}
	}

	return false
}

// generateContinuityGreeting generates greeting for service continuity
func (gm *GreetingManager) generateContinuityGreeting(serviceType string) string {
	continuityGreetings := map[string]string{
		"ktp":         "Baik, mari kita lanjutkan pembahasan tentang pengurusan KTP Anda.",
		"akta":        "Saya akan lanjutkan membantu dengan proses akta kelahiran.",
		"perpindahan": "Mari kita selesaikan proses perpindahan domisili Anda.",
	}

	if greeting, exists := continuityGreetings[serviceType]; exists {
		return greeting
	}

	return "Mari kita lanjutkan pembahasan sebelumnya."
}

// IsEnabled returns whether greeting generation is enabled
func (gm *GreetingManager) IsEnabled() bool {
	return gm.enabled
}

// SetEnabled enables or disables greeting generation
func (gm *GreetingManager) SetEnabled(enabled bool) {
	gm.enabled = enabled
}

// GenerateContextualGreetingWithHistory generates greeting with full conversation context
func (gm *GreetingManager) GenerateContextualGreetingWithHistory(ctx context.Context, req *GreetingRequest, conversationHistory []string, userInteractionHistory map[string]interface{}) string {
	if !gm.enabled {
		return ""
	}

	// Analyze user interaction patterns
	interactionPattern := gm.analyzeInteractionPattern(userInteractionHistory)

	// Determine appropriate formality level based on history
	formalityLevel := gm.determineFormalityFromHistory(conversationHistory, userInteractionHistory)

	// Generate base greeting
	baseGreeting := gm.GenerateGreeting(ctx, req)

	// Enhance with interaction history context
	if interactionPattern == "frequent_user" {
		return gm.generateFrequentUserGreeting(req.ServiceType, req.TimeOfDay)
	}

	if interactionPattern == "returning_user" {
		return gm.generateReturningUserGreeting(req.ServiceType, req.TimeOfDay, formalityLevel)
	}

	return baseGreeting
}

// analyzeInteractionPattern analyzes user interaction patterns
func (gm *GreetingManager) analyzeInteractionPattern(history map[string]interface{}) string {
	if history == nil {
		return "new_user"
	}

	if visitCount, exists := history["visit_count"]; exists {
		if count, ok := visitCount.(int); ok {
			if count > 10 {
				return "frequent_user"
			} else if count > 1 {
				return "returning_user"
			}
		}
	}

	return "new_user"
}

// determineFormalityFromHistory determines formality level from conversation history
func (gm *GreetingManager) determineFormalityFromHistory(conversationHistory []string, userHistory map[string]interface{}) string {
	// Default to formal for government services
	defaultFormality := "formal"

	if len(conversationHistory) == 0 {
		return defaultFormality
	}

	// Analyze recent messages for formality indicators
	recentMessages := conversationHistory[max(0, len(conversationHistory)-3):]

	informalIndicators := []string{"gimana", "ngga", "gak", "kamu", "lo", "lu"}
	formalIndicators := []string{"bagaimana", "tidak", "Anda", "Bapak", "Ibu", "mohon", "silakan"}

	informalCount := 0
	formalCount := 0

	for _, message := range recentMessages {
		messageLower := strings.ToLower(message)

		for _, indicator := range informalIndicators {
			if strings.Contains(messageLower, indicator) {
				informalCount++
			}
		}

		for _, indicator := range formalIndicators {
			if strings.Contains(messageLower, indicator) {
				formalCount++
			}
		}
	}

	// If user consistently uses informal language, adapt slightly (but maintain professionalism)
	if informalCount > formalCount && informalCount > 2 {
		return "semi-formal"
	}

	return defaultFormality
}

// generateFrequentUserGreeting generates greeting for frequent users
func (gm *GreetingManager) generateFrequentUserGreeting(serviceType, timeOfDay string) string {
	timeGreetings := map[string]string{
		"morning":   "Selamat pagi",
		"afternoon": "Selamat siang",
		"evening":   "Selamat sore",
		"night":     "Selamat malam",
	}

	timeGreeting := timeGreetings[timeOfDay]
	if timeGreeting == "" {
		timeGreeting = "Selamat"
	}

	serviceContexts := map[string]string{
		"ktp":         "untuk pengurusan KTP",
		"akta":        "untuk layanan akta",
		"perpindahan": "untuk perpindahan domisili",
	}

	serviceContext := serviceContexts[serviceType]
	if serviceContext == "" {
		serviceContext = "untuk layanan administrasi"
	}

	return fmt.Sprintf("%s kembali, Bapak/Ibu. Saya siap membantu %s.", timeGreeting, serviceContext)
}

// generateReturningUserGreeting generates greeting for returning users
func (gm *GreetingManager) generateReturningUserGreeting(serviceType, timeOfDay, formalityLevel string) string {
	timeGreetings := map[string]string{
		"morning":   "Selamat pagi",
		"afternoon": "Selamat siang",
		"evening":   "Selamat sore",
		"night":     "Selamat malam",
	}

	timeGreeting := timeGreetings[timeOfDay]
	if timeGreeting == "" {
		timeGreeting = "Selamat"
	}

	if formalityLevel == "semi-formal" {
		return fmt.Sprintf("%s lagi, ada yang bisa saya bantu hari ini?", timeGreeting)
	}

	return fmt.Sprintf("%s, Bapak/Ibu. Ada yang dapat saya bantu lagi hari ini?", timeGreeting)
}

// GenerateServiceSpecificGreeting generates greeting specific to service type
func (gm *GreetingManager) GenerateServiceSpecificGreeting(serviceType, timeOfDay string, isUrgent bool) string {
	if !gm.enabled {
		return ""
	}

	timeGreetings := map[string]string{
		"morning":   "Selamat pagi",
		"afternoon": "Selamat siang",
		"evening":   "Selamat sore",
		"night":     "Selamat malam",
	}

	timeGreeting := timeGreetings[timeOfDay]
	if timeGreeting == "" {
		timeGreeting = "Selamat"
	}

	serviceGreetings := map[string]string{
		"ktp":         "Saya siap membantu dengan pengurusan Kartu Tanda Penduduk (KTP) Anda.",
		"akta":        "Saya siap membantu dengan pengurusan akta kelahiran.",
		"perpindahan": "Saya siap membantu dengan proses perpindahan domisili Anda.",
		"kk":          "Saya siap membantu dengan pengurusan Kartu Keluarga (KK).",
		"surat":       "Saya siap membantu dengan pengurusan surat keterangan.",
	}

	serviceGreeting := serviceGreetings[serviceType]
	if serviceGreeting == "" {
		serviceGreeting = "Saya siap membantu dengan layanan administrasi Anda."
	}

	if isUrgent {
		return fmt.Sprintf("%s, Bapak/Ibu. Saya memahami kebutuhan Anda yang mendesak. %s", timeGreeting, serviceGreeting)
	}

	return fmt.Sprintf("%s, Bapak/Ibu. %s", timeGreeting, serviceGreeting)
}

// Helper function
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

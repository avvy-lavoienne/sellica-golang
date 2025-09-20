package chat

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// ResponseVariationEngine generates multiple response variations for enhanced user experience
type ResponseVariationEngine struct {
	temperatureRanges map[string][]float64
	styleVariations   []ResponseStyle
	contextAdapters   map[string]*ContextAdapter
	userPreferences   map[string]*UserResponsePreference
	sessionHistory    map[string]*SessionResponseHistory
	enabled           bool
	mutex             sync.RWMutex
}

// ResponseStyle defines different response presentation styles
type ResponseStyle struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Temperature float64 `json:"temperature"`
	Formality   string  `json:"formality"` // "formal", "casual", "friendly"
	Length      string  `json:"length"`    // "concise", "detailed", "comprehensive"
	Tone        string  `json:"tone"`      // "professional", "warm", "helpful"
}

// ResponseVariation represents a single response variation
type ResponseVariation struct {
	Content     string                 `json:"content"`
	Style       ResponseStyle          `json:"style"`
	Confidence  float64                `json:"confidence"`
	Temperature float64                `json:"temperature"`
	Reasoning   string                 `json:"reasoning"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// VariationRequest contains parameters for generating response variations
type VariationRequest struct {
	BaseQuery           string                 `json:"base_query"`
	BaseResponse        string                 `json:"base_response"`
	UserID              string                 `json:"user_id"`
	SessionID           string                 `json:"session_id"`
	QueryType           string                 `json:"query_type"`
	UserContext         map[string]interface{} `json:"user_context"`
	ConversationHistory []string               `json:"conversation_history"`
	MaxVariations       int                    `json:"max_variations"`
	PreferredStyles     []string               `json:"preferred_styles"`
}

// VariationResponse contains the generated variations
type VariationResponse struct {
	Variations        []ResponseVariation    `json:"variations"`
	SelectedVariation *ResponseVariation     `json:"selected_variation"`
	ProcessingTime    float64                `json:"processing_time"`
	Strategy          string                 `json:"strategy"`
	Metadata          map[string]interface{} `json:"metadata"`
}

// UserResponsePreference tracks user's response preferences
type UserResponsePreference struct {
	UserID             string    `json:"user_id"`
	PreferredStyle     string    `json:"preferred_style"`
	PreferredLength    string    `json:"preferred_length"`
	PreferredFormality string    `json:"preferred_formality"`
	ResponseHistory    []string  `json:"response_history"`
	LastUpdated        time.Time `json:"last_updated"`
	InteractionCount   int       `json:"interaction_count"`
}

// SessionResponseHistory tracks response patterns within a session
type SessionResponseHistory struct {
	SessionID            string    `json:"session_id"`
	ResponseStyles       []string  `json:"response_styles"`
	LastResponseStyle    string    `json:"last_response_style"`
	ConsecutiveSameStyle int       `json:"consecutive_same_style"`
	CreatedAt            time.Time `json:"created_at"`
	LastUpdated          time.Time `json:"last_updated"`
}

// ContextAdapter adapts responses based on specific contexts
type ContextAdapter struct {
	Name        string                 `json:"name"`
	Conditions  map[string]interface{} `json:"conditions"`
	Adaptations map[string]interface{} `json:"adaptations"`
}

// NewResponseVariationEngine creates a new response variation engine
func NewResponseVariationEngine() *ResponseVariationEngine {
	return &ResponseVariationEngine{
		temperatureRanges: map[string][]float64{
			"greeting":       {0.8, 0.9, 1.0}, // High creativity for greetings
			"factual":        {0.3, 0.5, 0.7}, // Low creativity for facts
			"conversational": {0.6, 0.7, 0.8}, // Moderate creativity
			"service":        {0.4, 0.6, 0.7}, // Controlled creativity for services
			"default":        {0.5, 0.7, 0.9}, // Balanced range
		},
		styleVariations: []ResponseStyle{
			{
				Name:        "formal",
				Description: "Professional and respectful tone",
				Temperature: 0.6,
				Formality:   "formal",
				Length:      "detailed",
				Tone:        "professional",
			},
			{
				Name:        "friendly",
				Description: "Warm and approachable tone",
				Temperature: 0.8,
				Formality:   "casual",
				Length:      "conversational",
				Tone:        "warm",
			},
			{
				Name:        "detailed",
				Description: "Comprehensive and informative",
				Temperature: 0.5,
				Formality:   "formal",
				Length:      "comprehensive",
				Tone:        "helpful",
			},
			{
				Name:        "conversational",
				Description: "Natural and engaging dialogue",
				Temperature: 0.7,
				Formality:   "casual",
				Length:      "concise",
				Tone:        "helpful",
			},
			{
				Name:        "concise",
				Description: "Brief and to the point",
				Temperature: 0.4,
				Formality:   "formal",
				Length:      "concise",
				Tone:        "professional",
			},
		},
		contextAdapters: make(map[string]*ContextAdapter),
		userPreferences: make(map[string]*UserResponsePreference),
		sessionHistory:  make(map[string]*SessionResponseHistory),
		enabled:         true,
	}
}

// GenerateVariations generates multiple response variations
func (rve *ResponseVariationEngine) GenerateVariations(ctx context.Context, req *VariationRequest) (*VariationResponse, error) {
	if !rve.enabled {
		return &VariationResponse{
			Variations: []ResponseVariation{
				{
					Content:     req.BaseResponse,
					Style:       rve.styleVariations[0], // Default style
					Confidence:  1.0,
					Temperature: 0.7,
					Reasoning:   "Variation engine disabled",
				},
			},
			SelectedVariation: &ResponseVariation{
				Content:     req.BaseResponse,
				Style:       rve.styleVariations[0],
				Confidence:  1.0,
				Temperature: 0.7,
			},
			ProcessingTime: 0.0,
			Strategy:       "disabled",
		}, nil
	}

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"user_id":           req.UserID,
		"session_id":        req.SessionID,
		"query_type":        req.QueryType,
		"max_variations":    req.MaxVariations,
		"base_query_len":    len(req.BaseQuery),
		"base_response_len": len(req.BaseResponse),
	}).Debug("Generating response variations")

	// Determine optimal number of variations
	maxVariations := req.MaxVariations
	if maxVariations <= 0 {
		maxVariations = 3 // Default
	}
	if maxVariations > 5 {
		maxVariations = 5 // Limit for performance
	}

	// Get user preferences and session history
	userPref := rve.getUserPreferences(req.UserID)
	sessionHist := rve.getSessionHistory(req.SessionID)

	// Select appropriate styles for variation
	selectedStyles := rve.selectOptimalStyles(req, userPref, sessionHist, maxVariations)

	// Generate variations
	variations := make([]ResponseVariation, 0, len(selectedStyles))
	for i, style := range selectedStyles {
		variation, err := rve.generateSingleVariation(req, style, i)
		if err != nil {
			logrus.WithError(err).Warn("Failed to generate variation")
			continue
		}
		variations = append(variations, *variation)
	}

	// Select the best variation
	selectedVariation := rve.selectBestVariation(variations, userPref, sessionHist)

	// Update user preferences and session history
	rve.updateUserPreferences(req.UserID, selectedVariation)
	rve.updateSessionHistory(req.SessionID, selectedVariation)

	processingTime := time.Since(startTime).Seconds() * 1000

	logrus.WithFields(logrus.Fields{
		"user_id":            req.UserID,
		"session_id":         req.SessionID,
		"variations_count":   len(variations),
		"selected_style":     selectedVariation.Style.Name,
		"processing_time_ms": processingTime,
	}).Info("Response variations generated successfully")

	return &VariationResponse{
		Variations:        variations,
		SelectedVariation: selectedVariation,
		ProcessingTime:    processingTime,
		Strategy:          "style_based_selection",
		Metadata: map[string]interface{}{
			"user_preference_applied": userPref != nil,
			"session_history_applied": sessionHist != nil,
			"styles_considered":       len(selectedStyles),
		},
	}, nil
}

// CalculateOptimalTemperature calculates the optimal temperature for a query
func (rve *ResponseVariationEngine) CalculateOptimalTemperature(queryType string, userContext map[string]interface{}) float64 {
	rve.mutex.RLock()
	defer rve.mutex.RUnlock()

	// Get base temperature range for query type
	tempRange, exists := rve.temperatureRanges[queryType]
	if !exists {
		tempRange = rve.temperatureRanges["default"]
	}

	// Select temperature based on context
	baseTemp := tempRange[1] // Use middle value as base

	// Adjust based on user context
	if userContext != nil {
		if variety, ok := userContext["prefers_variety"].(bool); ok && variety {
			// Increase temperature for users who prefer variety
			baseTemp = tempRange[len(tempRange)-1] // Use highest
		}

		if consistency, ok := userContext["prefers_consistency"].(bool); ok && consistency {
			// Decrease temperature for users who prefer consistency
			baseTemp = tempRange[0] // Use lowest
		}
	}

	return baseTemp
}

// IsEnabled returns whether the variation engine is enabled
func (rve *ResponseVariationEngine) IsEnabled() bool {
	rve.mutex.RLock()
	defer rve.mutex.RUnlock()
	return rve.enabled
}

// SetEnabled enables or disables the variation engine
func (rve *ResponseVariationEngine) SetEnabled(enabled bool) {
	rve.mutex.Lock()
	defer rve.mutex.Unlock()
	rve.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Response variation engine status updated")
}

// getUserPreferences gets user preferences with fallback to defaults
func (rve *ResponseVariationEngine) getUserPreferences(userID string) *UserResponsePreference {
	rve.mutex.RLock()
	defer rve.mutex.RUnlock()

	if pref, exists := rve.userPreferences[userID]; exists {
		return pref
	}

	// Create default preferences for new user
	defaultPref := &UserResponsePreference{
		UserID:             userID,
		PreferredStyle:     "friendly",
		PreferredLength:    "conversational",
		PreferredFormality: "casual",
		ResponseHistory:    []string{},
		LastUpdated:        time.Now(),
		InteractionCount:   0,
	}

	rve.userPreferences[userID] = defaultPref
	return defaultPref
}

// getSessionHistory gets session history with fallback to new session
func (rve *ResponseVariationEngine) getSessionHistory(sessionID string) *SessionResponseHistory {
	rve.mutex.RLock()
	defer rve.mutex.RUnlock()

	if hist, exists := rve.sessionHistory[sessionID]; exists {
		return hist
	}

	// Create new session history
	newHist := &SessionResponseHistory{
		SessionID:            sessionID,
		ResponseStyles:       []string{},
		LastResponseStyle:    "",
		ConsecutiveSameStyle: 0,
		CreatedAt:            time.Now(),
		LastUpdated:          time.Now(),
	}

	rve.sessionHistory[sessionID] = newHist
	return newHist
}

// selectOptimalStyles selects the best styles for variation generation
func (rve *ResponseVariationEngine) selectOptimalStyles(req *VariationRequest, userPref *UserResponsePreference, sessionHist *SessionResponseHistory, maxVariations int) []ResponseStyle {
	availableStyles := make([]ResponseStyle, len(rve.styleVariations))
	copy(availableStyles, rve.styleVariations)

	// Prioritize user's preferred style
	selectedStyles := []ResponseStyle{}

	// Add user's preferred style first (if available)
	if userPref != nil {
		for _, style := range availableStyles {
			if style.Name == userPref.PreferredStyle {
				selectedStyles = append(selectedStyles, style)
				break
			}
		}
	}

	// Avoid consecutive same styles in session
	if sessionHist != nil && sessionHist.ConsecutiveSameStyle >= 2 {
		// Filter out the last used style to add variety
		filteredStyles := []ResponseStyle{}
		for _, style := range availableStyles {
			if style.Name != sessionHist.LastResponseStyle {
				filteredStyles = append(filteredStyles, style)
			}
		}
		availableStyles = filteredStyles
	}

	// Add complementary styles
	for len(selectedStyles) < maxVariations && len(availableStyles) > 0 {
		// Select next best style based on context
		nextStyle := rve.selectNextBestStyle(req, selectedStyles, availableStyles)
		selectedStyles = append(selectedStyles, nextStyle)

		// Remove selected style from available
		newAvailable := []ResponseStyle{}
		for _, style := range availableStyles {
			if style.Name != nextStyle.Name {
				newAvailable = append(newAvailable, style)
			}
		}
		availableStyles = newAvailable
	}

	return selectedStyles
}

// selectNextBestStyle selects the next best style based on context
func (rve *ResponseVariationEngine) selectNextBestStyle(req *VariationRequest, selectedStyles []ResponseStyle, availableStyles []ResponseStyle) ResponseStyle {
	if len(availableStyles) == 0 {
		return rve.styleVariations[0] // Fallback
	}

	// Score each available style
	bestStyle := availableStyles[0]
	bestScore := 0.0

	for _, style := range availableStyles {
		score := rve.calculateStyleScore(style, req, selectedStyles)
		if score > bestScore {
			bestScore = score
			bestStyle = style
		}
	}

	return bestStyle
}

// calculateStyleScore calculates a score for a style based on context
func (rve *ResponseVariationEngine) calculateStyleScore(style ResponseStyle, req *VariationRequest, selectedStyles []ResponseStyle) float64 {
	_ = req      // Mark as intentionally unused for future extensibility
	score := 0.5 // Base score

	// Boost score based on query type
	switch req.QueryType {
	case "greeting":
		if style.Name == "friendly" || style.Name == "conversational" {
			score += 0.3
		}
	case "service":
		if style.Name == "formal" || style.Name == "detailed" {
			score += 0.3
		}
	case "factual":
		if style.Name == "detailed" || style.Name == "concise" {
			score += 0.3
		}
	}

	// Boost score for diversity (avoid similar styles)
	diversityBonus := 0.2
	for _, selected := range selectedStyles {
		if selected.Formality == style.Formality && selected.Length == style.Length {
			diversityBonus -= 0.1
		}
	}
	score += diversityBonus

	// Random factor for natural variation
	score += (rand.Float64() - 0.5) * 0.1

	return score
}

// generateSingleVariation generates a single response variation
func (rve *ResponseVariationEngine) generateSingleVariation(req *VariationRequest, style ResponseStyle, index int) (*ResponseVariation, error) {
	// Apply style-based transformations to the base response
	content := rve.applyStyleTransformation(req.BaseResponse, style, req)

	// Calculate confidence based on style appropriateness
	confidence := rve.calculateVariationConfidence(style, req)

	// Generate reasoning for this variation
	reasoning := fmt.Sprintf("Applied %s style with %s formality and %s length",
		style.Name, style.Formality, style.Length)

	return &ResponseVariation{
		Content:     content,
		Style:       style,
		Confidence:  confidence,
		Temperature: style.Temperature,
		Reasoning:   reasoning,
		Metadata: map[string]interface{}{
			"generation_index": index,
			"style_applied":    style.Name,
			"transformation":   "style_based",
		},
	}, nil
}

// applyStyleTransformation applies style-specific transformations to content
func (rve *ResponseVariationEngine) applyStyleTransformation(baseContent string, style ResponseStyle, req *VariationRequest) string {
	content := baseContent

	// Apply formality adjustments
	switch style.Formality {
	case "formal":
		content = rve.makeFormal(content)
	case "casual":
		content = rve.makeCasual(content)
	}

	// Apply length adjustments
	switch style.Length {
	case "concise":
		content = rve.makeConcise(content)
	case "detailed":
		content = rve.makeDetailed(content, req)
	case "comprehensive":
		content = rve.makeComprehensive(content, req)
	}

	// Apply tone adjustments
	switch style.Tone {
	case "warm":
		content = rve.makeWarm(content)
	case "professional":
		content = rve.makeProfessional(content)
	}

	return content
}

// makeFormal makes content more formal
func (rve *ResponseVariationEngine) makeFormal(content string) string {
	// Replace casual expressions with formal ones
	replacements := map[string]string{
		"halo":   "Selamat",
		"hai":    "Selamat",
		"gimana": "bagaimana",
		"udah":   "sudah",
		"gak":    "tidak",
		"aja":    "saja",
		"dong":   "",
		"nih":    "",
		"banget": "sekali",
	}

	for casual, formal := range replacements {
		content = strings.ReplaceAll(content, casual, formal)
	}

	return content
}

// makeCasual makes content more casual and friendly
func (rve *ResponseVariationEngine) makeCasual(content string) string {
	// Add friendly expressions
	if strings.Contains(content, "Selamat") && !strings.Contains(content, "halo") {
		content = strings.Replace(content, "Selamat", "Halo", 1)
	}

	// Add casual expressions where appropriate
	if strings.Contains(content, "bagaimana") {
		content = strings.ReplaceAll(content, "bagaimana", "gimana")
	}

	return content
}

// makeConcise makes content more concise
func (rve *ResponseVariationEngine) makeConcise(content string) string {
	// Remove redundant phrases
	redundantPhrases := []string{
		"Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. ",
		"Bagaimana saya bisa membantu Anda dengan layanan administrasi kependudukan?",
		"Silakan tanyakan jika ada yang ingin Anda ketahui lebih lanjut.",
	}

	for _, phrase := range redundantPhrases {
		if len(content) > 100 { // Only remove if content is long enough
			content = strings.ReplaceAll(content, phrase, "")
		}
	}

	return strings.TrimSpace(content)
}

// makeDetailed adds more detail to content
func (rve *ResponseVariationEngine) makeDetailed(content string, req *VariationRequest) string {
	// Add contextual details based on query type
	if req.QueryType == "service" {
		if !strings.Contains(content, "dokumen") {
			content += " Pastikan Anda membawa dokumen yang diperlukan."
		}
	}

	if req.QueryType == "greeting" {
		if !strings.Contains(content, "layanan") {
			content += " Saya dapat membantu Anda dengan berbagai layanan administrasi kependudukan."
		}
	}

	return content
}

// makeComprehensive makes content comprehensive with additional information
func (rve *ResponseVariationEngine) makeComprehensive(content string, req *VariationRequest) string {
	content = rve.makeDetailed(content, req)

	// Add comprehensive information
	if req.QueryType == "service" {
		content += " Untuk informasi lebih lengkap, Anda juga dapat mengunjungi kantor Dinas Kependudukan terdekat atau mengakses layanan online kami."
	}

	return content
}

// makeWarm adds warmth to the content
func (rve *ResponseVariationEngine) makeWarm(content string) string {
	// Add warm expressions
	warmExpressions := []string{
		"Senang bisa membantu Anda!",
		"Saya siap membantu dengan senang hati.",
		"Terima kasih telah menghubungi kami.",
	}

	// Add a warm expression if content doesn't already have one
	hasWarmth := false
	for _, expr := range warmExpressions {
		if strings.Contains(content, expr) {
			hasWarmth = true
			break
		}
	}

	if !hasWarmth && len(content) < 200 {
		content = warmExpressions[rand.Intn(len(warmExpressions))] + " " + content
	}

	return content
}

// makeProfessional makes content more professional
func (rve *ResponseVariationEngine) makeProfessional(content string) string {
	// Check if content already has extensive SELLY introduction
	lowerContent := strings.ToLower(content)
	hasSellyIntro := strings.Contains(lowerContent, "selly") && 
		(strings.Contains(lowerContent, "dinas kependudukan") || strings.Contains(lowerContent, "disdukcapil")) &&
		(strings.Contains(lowerContent, "selamat") || strings.Contains(lowerContent, "asisten"))

	// Ensure professional language only if not already extensively introduced
	if !strings.Contains(content, "SELLY AI Assistant") && !hasSellyIntro {
		content = "Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. " + content
	}

	return content
}

// calculateVariationConfidence calculates confidence for a variation
func (rve *ResponseVariationEngine) calculateVariationConfidence(style ResponseStyle, req *VariationRequest) float64 {
	baseConfidence := 0.8 // Base confidence

	// Adjust based on style appropriateness for query type
	switch req.QueryType {
	case "greeting":
		if style.Name == "friendly" || style.Name == "conversational" {
			baseConfidence += 0.15
		}
	case "service":
		if style.Name == "formal" || style.Name == "detailed" {
			baseConfidence += 0.15
		}
	case "factual":
		if style.Name == "detailed" || style.Name == "concise" {
			baseConfidence += 0.15
		}
	}

	// Ensure confidence is within bounds
	if baseConfidence > 1.0 {
		baseConfidence = 1.0
	}
	if baseConfidence < 0.1 {
		baseConfidence = 0.1
	}

	return baseConfidence
}

// selectBestVariation selects the best variation from available options
func (rve *ResponseVariationEngine) selectBestVariation(variations []ResponseVariation, userPref *UserResponsePreference, sessionHist *SessionResponseHistory) *ResponseVariation {
	if len(variations) == 0 {
		return nil
	}

	if len(variations) == 1 {
		return &variations[0]
	}

	// Score each variation
	bestVariation := &variations[0]
	bestScore := 0.0

	for i := range variations {
		score := rve.scoreVariation(&variations[i], userPref, sessionHist)
		if score > bestScore {
			bestScore = score
			bestVariation = &variations[i]
		}
	}

	return bestVariation
}

// scoreVariation scores a variation based on user preferences and session history
func (rve *ResponseVariationEngine) scoreVariation(variation *ResponseVariation, userPref *UserResponsePreference, sessionHist *SessionResponseHistory) float64 {
	score := variation.Confidence // Start with base confidence

	// Boost score for user's preferred style
	if userPref != nil {
		if variation.Style.Name == userPref.PreferredStyle {
			score += 0.2
		}
		if variation.Style.Formality == userPref.PreferredFormality {
			score += 0.1
		}
		if variation.Style.Length == userPref.PreferredLength {
			score += 0.1
		}
	}

	// Boost score for variety in session
	if sessionHist != nil {
		if variation.Style.Name != sessionHist.LastResponseStyle {
			score += 0.15 // Reward variety
		}
		if sessionHist.ConsecutiveSameStyle >= 2 && variation.Style.Name != sessionHist.LastResponseStyle {
			score += 0.25 // Extra reward for breaking repetition
		}
	}

	return score
}

// updateUserPreferences updates user preferences based on selected variation
func (rve *ResponseVariationEngine) updateUserPreferences(userID string, selectedVariation *ResponseVariation) {
	rve.mutex.Lock()
	defer rve.mutex.Unlock()

	pref, exists := rve.userPreferences[userID]
	if !exists {
		pref = &UserResponsePreference{
			UserID:           userID,
			ResponseHistory:  []string{},
			InteractionCount: 0,
		}
		rve.userPreferences[userID] = pref
	}

	// Update preferences based on selection
	pref.PreferredStyle = selectedVariation.Style.Name
	pref.PreferredFormality = selectedVariation.Style.Formality
	pref.PreferredLength = selectedVariation.Style.Length
	pref.InteractionCount++
	pref.LastUpdated = time.Now()

	// Add to response history (keep last 10)
	pref.ResponseHistory = append(pref.ResponseHistory, selectedVariation.Style.Name)
	if len(pref.ResponseHistory) > 10 {
		pref.ResponseHistory = pref.ResponseHistory[1:]
	}
}

// updateSessionHistory updates session history based on selected variation
func (rve *ResponseVariationEngine) updateSessionHistory(sessionID string, selectedVariation *ResponseVariation) {
	rve.mutex.Lock()
	defer rve.mutex.Unlock()

	hist, exists := rve.sessionHistory[sessionID]
	if !exists {
		hist = &SessionResponseHistory{
			SessionID:      sessionID,
			ResponseStyles: []string{},
			CreatedAt:      time.Now(),
		}
		rve.sessionHistory[sessionID] = hist
	}

	// Update session history
	if hist.LastResponseStyle == selectedVariation.Style.Name {
		hist.ConsecutiveSameStyle++
	} else {
		hist.ConsecutiveSameStyle = 1
	}

	hist.LastResponseStyle = selectedVariation.Style.Name
	hist.LastUpdated = time.Now()

	// Add to response styles history (keep last 20)
	hist.ResponseStyles = append(hist.ResponseStyles, selectedVariation.Style.Name)
	if len(hist.ResponseStyles) > 20 {
		hist.ResponseStyles = hist.ResponseStyles[1:]
	}
}

// GetMetrics returns variation engine metrics
func (rve *ResponseVariationEngine) GetMetrics() map[string]interface{} {
	rve.mutex.RLock()
	defer rve.mutex.RUnlock()

	return map[string]interface{}{
		"enabled":            rve.enabled,
		"total_users":        len(rve.userPreferences),
		"active_sessions":    len(rve.sessionHistory),
		"available_styles":   len(rve.styleVariations),
		"temperature_ranges": len(rve.temperatureRanges),
		"context_adapters":   len(rve.contextAdapters),
	}
}

// CleanupOldSessions removes old session data to prevent memory leaks
func (rve *ResponseVariationEngine) CleanupOldSessions() {
	rve.mutex.Lock()
	defer rve.mutex.Unlock()

	cutoff := time.Now().Add(-24 * time.Hour) // Remove sessions older than 24 hours

	for sessionID, hist := range rve.sessionHistory {
		if hist.LastUpdated.Before(cutoff) {
			delete(rve.sessionHistory, sessionID)
		}
	}

	logrus.WithField("remaining_sessions", len(rve.sessionHistory)).Debug("Cleaned up old session data")
}

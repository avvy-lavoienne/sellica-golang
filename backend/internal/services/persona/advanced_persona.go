package persona

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// AdvancedPersonaService provides enhanced persona capabilities with mood detection and context awareness
type AdvancedPersonaService struct {
	basePersona         *SellyPersona
	moodDetector        *MoodDetector
	contextAnalyzer     *ConversationContextAnalyzer
	adaptiveGenerator   *AdaptiveResponseGenerator
	userPatternAnalyzer *UserPatternAnalyzer
	enabled             bool
}

// MoodDetector analyzes user mood from conversation patterns
type MoodDetector struct {
	enabled bool
}

// ConversationContextAnalyzer analyzes conversation context and history
type ConversationContextAnalyzer struct {
	enabled bool
}

// AdaptiveResponseGenerator generates adaptive responses based on user patterns
type AdaptiveResponseGenerator struct {
	enabled bool
}

// UserPatternAnalyzer analyzes user interaction patterns for personalization
type UserPatternAnalyzer struct {
	enabled bool
}

// UserMood represents detected user mood
type UserMood struct {
	Primary    string                 `json:"primary"`    // happy, frustrated, confused, urgent, neutral
	Secondary  string                 `json:"secondary"`  // secondary mood if detected
	Confidence float64                `json:"confidence"` // confidence level 0-1
	Indicators []string               `json:"indicators"` // mood indicators found
	Intensity  string                 `json:"intensity"`  // low, medium, high
	Metadata   map[string]interface{} `json:"metadata"`
}

// ConversationContext represents enhanced conversation context
type ConversationContext struct {
	SessionID          string                 `json:"session_id"`
	ConversationStage  string                 `json:"conversation_stage"`   // greeting, inquiry, clarification, resolution
	UserExpertiseLevel string                 `json:"user_expertise_level"` // beginner, intermediate, expert
	InteractionCount   int                    `json:"interaction_count"`
	ServiceProgression []string               `json:"service_progression"` // services discussed in order
	TopicTransitions   []string               `json:"topic_transitions"`   // topic changes
	UserPreferences    map[string]interface{} `json:"user_preferences"`
	ContextualCues     []string               `json:"contextual_cues"`
	Metadata           map[string]interface{} `json:"metadata"`
}

// UserInteractionPattern represents user behavior patterns
type UserInteractionPattern struct {
	UserID             string                 `json:"user_id"`
	PreferredFormality string                 `json:"preferred_formality"` // formal, informal, mixed
	ResponseStyle      string                 `json:"response_style"`      // detailed, concise, step-by-step
	ServiceFamiliarity map[string]string      `json:"service_familiarity"` // service -> familiarity level
	CommunicationStyle string                 `json:"communication_style"` // direct, polite, urgent
	TypicalMoods       []string               `json:"typical_moods"`
	InteractionTiming  map[string]interface{} `json:"interaction_timing"`
	Metadata           map[string]interface{} `json:"metadata"`
}

// AdvancedPersonaRequest extends PersonaRequest with advanced features
type AdvancedPersonaRequest struct {
	*PersonaRequest
	ConversationHistory []ConversationEntry     `json:"conversation_history"`
	UserPattern         *UserInteractionPattern `json:"user_pattern"`
	SessionContext      *ConversationContext    `json:"session_context"`
	PreviousResponses   []string                `json:"previous_responses"`
	RequestMetadata     map[string]interface{}  `json:"request_metadata"`
}

// AdvancedPersonaResponse extends PersonaResponse with advanced features
type AdvancedPersonaResponse struct {
	*PersonaResponse
	DetectedMood         *UserMood              `json:"detected_mood"`
	ConversationContext  *ConversationContext   `json:"conversation_context"`
	AdaptationApplied    []string               `json:"adaptation_applied"`
	PersonalizationLevel string                 `json:"personalization_level"` // low, medium, high
	ContextualRelevance  float64                `json:"contextual_relevance"`
	ResponseStrategy     string                 `json:"response_strategy"`
	AdvancedMetadata     map[string]interface{} `json:"advanced_metadata"`
}

// ConversationEntry represents a single conversation entry
type ConversationEntry struct {
	Timestamp time.Time              `json:"timestamp"`
	Role      string                 `json:"role"` // user, assistant
	Content   string                 `json:"content"`
	Metadata  map[string]interface{} `json:"metadata"`
}

// NewAdvancedPersonaService creates a new advanced persona service
func NewAdvancedPersonaService(basePersona *SellyPersona) *AdvancedPersonaService {
	return &AdvancedPersonaService{
		basePersona: basePersona,
		moodDetector: &MoodDetector{
			enabled: true,
		},
		contextAnalyzer: &ConversationContextAnalyzer{
			enabled: true,
		},
		adaptiveGenerator: &AdaptiveResponseGenerator{
			enabled: true,
		},
		userPatternAnalyzer: &UserPatternAnalyzer{
			enabled: true,
		},
		enabled: true,
	}
}

// ApplyAdvancedPersona applies advanced persona with mood detection and context awareness
func (aps *AdvancedPersonaService) ApplyAdvancedPersona(ctx context.Context, req *AdvancedPersonaRequest) (*AdvancedPersonaResponse, error) {
	if !aps.enabled {
		// Fallback to base persona
		baseResponse, err := aps.basePersona.ApplyPersona(ctx, req.PersonaRequest)
		if err != nil {
			return nil, err
		}
		return &AdvancedPersonaResponse{
			PersonaResponse: baseResponse,
		}, nil
	}

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"user_id":              req.UserID,
		"session_id":           req.SessionID,
		"conversation_entries": len(req.ConversationHistory),
		"has_user_pattern":     req.UserPattern != nil,
	}).Debug("Applying advanced SELLY persona")

	// Step 1: Detect user mood
	detectedMood, err := aps.detectUserMood(ctx, req)
	if err != nil {
		logrus.WithError(err).Warn("Mood detection failed, proceeding without")
		detectedMood = &UserMood{
			Primary:    "neutral",
			Confidence: 0.5,
			Intensity:  "medium",
		}
	}

	// Step 2: Analyze conversation context
	conversationContext, err := aps.analyzeConversationContext(ctx, req)
	if err != nil {
		logrus.WithError(err).Warn("Conversation context analysis failed")
		conversationContext = &ConversationContext{
			SessionID:          req.SessionID,
			ConversationStage:  "inquiry",
			UserExpertiseLevel: "intermediate",
			InteractionCount:   len(req.ConversationHistory),
		}
	}

	// Step 3: Analyze user patterns
	userPattern := req.UserPattern
	if userPattern == nil {
		userPattern, err = aps.analyzeUserPattern(ctx, req)
		if err != nil {
			logrus.WithError(err).Warn("User pattern analysis failed")
			userPattern = &UserInteractionPattern{
				UserID:             req.UserID,
				PreferredFormality: "formal",
				ResponseStyle:      "detailed",
				CommunicationStyle: "polite",
			}
		}
	}

	// Step 4: Enhance base persona request with advanced context
	enhancedPersonaReq := aps.enhancePersonaRequest(req, detectedMood, conversationContext, userPattern)

	// Step 5: Apply base persona
	baseResponse, err := aps.basePersona.ApplyPersona(ctx, enhancedPersonaReq)
	if err != nil {
		return nil, fmt.Errorf("base persona application failed: %w", err)
	}

	// Step 6: Apply adaptive response generation
	adaptiveContent, adaptationApplied, err := aps.generateAdaptiveResponse(ctx, baseResponse.Content, detectedMood, conversationContext, userPattern)
	if err != nil {
		logrus.WithError(err).Warn("Adaptive response generation failed, using base response")
		adaptiveContent = baseResponse.Content
		adaptationApplied = []string{}
	}

	// Step 7: Calculate personalization metrics
	personalizationLevel := aps.calculatePersonalizationLevel(detectedMood, conversationContext, userPattern)
	contextualRelevance := aps.calculateContextualRelevance(req, conversationContext)
	responseStrategy := aps.determineResponseStrategy(detectedMood, conversationContext, userPattern)

	processingTime := time.Since(startTime).Seconds() * 1000

	// Create advanced response
	response := &AdvancedPersonaResponse{
		PersonaResponse: &PersonaResponse{
			Content:               adaptiveContent,
			Greeting:              baseResponse.Greeting,
			PersonalityApplied:    baseResponse.PersonalityApplied,
			CulturalEnhancement:   baseResponse.CulturalEnhancement,
			FormalityLevel:        baseResponse.FormalityLevel,
			ServiceClassification: baseResponse.ServiceClassification,
			Recommendations:       baseResponse.Recommendations,
			ProcessingTime:        processingTime,
			Metadata:              baseResponse.Metadata,
		},
		DetectedMood:         detectedMood,
		ConversationContext:  conversationContext,
		AdaptationApplied:    adaptationApplied,
		PersonalizationLevel: personalizationLevel,
		ContextualRelevance:  contextualRelevance,
		ResponseStrategy:     responseStrategy,
		AdvancedMetadata: map[string]interface{}{
			"advanced_persona_version":      "2.0",
			"mood_detection_enabled":        aps.moodDetector.enabled,
			"context_analysis_enabled":      aps.contextAnalyzer.enabled,
			"adaptive_generation_enabled":   aps.adaptiveGenerator.enabled,
			"user_pattern_analysis_enabled": aps.userPatternAnalyzer.enabled,
			"processing_time_ms":            processingTime,
		},
	}

	logrus.WithFields(logrus.Fields{
		"processing_time":       processingTime,
		"detected_mood":         detectedMood.Primary,
		"mood_confidence":       detectedMood.Confidence,
		"conversation_stage":    conversationContext.ConversationStage,
		"personalization_level": personalizationLevel,
		"contextual_relevance":  contextualRelevance,
		"adaptations_applied":   len(adaptationApplied),
	}).Debug("Advanced persona processing completed")

	return response, nil
}

// IsEnabled returns whether the advanced persona service is enabled
func (aps *AdvancedPersonaService) IsEnabled() bool {
	return aps.enabled
}

// SetEnabled enables or disables the advanced persona service
func (aps *AdvancedPersonaService) SetEnabled(enabled bool) {
	aps.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Advanced persona service status updated")
}

// GetCapabilities returns the capabilities of the advanced persona service
func (aps *AdvancedPersonaService) GetCapabilities() map[string]bool {
	return map[string]bool{
		"mood_detection":        aps.moodDetector.enabled,
		"context_analysis":      aps.contextAnalyzer.enabled,
		"adaptive_generation":   aps.adaptiveGenerator.enabled,
		"user_pattern_analysis": aps.userPatternAnalyzer.enabled,
		"advanced_persona":      aps.enabled,
	}
}

// detectUserMood analyzes user mood from conversation patterns and current query
func (aps *AdvancedPersonaService) detectUserMood(_ context.Context, req *AdvancedPersonaRequest) (*UserMood, error) {
	if !aps.moodDetector.enabled {
		return &UserMood{
			Primary:    "neutral",
			Confidence: 0.5,
			Intensity:  "medium",
		}, nil
	}

	query := strings.ToLower(req.Query)
	indicators := []string{}
	moodScores := make(map[string]float64)

	// Analyze current query for mood indicators
	// Frustrated mood indicators
	frustratedKeywords := []string{"susah", "sulit", "ribet", "lama", "lambat", "bingung", "tidak bisa", "gagal", "error"}
	for _, keyword := range frustratedKeywords {
		if strings.Contains(query, keyword) {
			moodScores["frustrated"] += 0.3
			indicators = append(indicators, fmt.Sprintf("frustrated_keyword:%s", keyword))
		}
	}

	// Urgent mood indicators
	urgentKeywords := []string{"cepat", "segera", "mendesak", "urgent", "penting", "butuh sekarang", "hari ini"}
	for _, keyword := range urgentKeywords {
		if strings.Contains(query, keyword) {
			moodScores["urgent"] += 0.4
			indicators = append(indicators, fmt.Sprintf("urgent_keyword:%s", keyword))
		}
	}

	// Happy/positive mood indicators
	positiveKeywords := []string{"terima kasih", "bagus", "baik", "senang", "puas", "mantap", "oke"}
	for _, keyword := range positiveKeywords {
		if strings.Contains(query, keyword) {
			moodScores["happy"] += 0.3
			indicators = append(indicators, fmt.Sprintf("positive_keyword:%s", keyword))
		}
	}

	// Confused mood indicators
	confusedKeywords := []string{"bagaimana", "gimana", "tidak tahu", "tidak paham", "bingung", "cara"}
	for _, keyword := range confusedKeywords {
		if strings.Contains(query, keyword) {
			moodScores["confused"] += 0.2
			indicators = append(indicators, fmt.Sprintf("confused_keyword:%s", keyword))
		}
	}

	// Analyze conversation history for mood patterns
	if len(req.ConversationHistory) > 0 {
		recentEntries := req.ConversationHistory
		if len(recentEntries) > 5 {
			recentEntries = recentEntries[len(recentEntries)-5:] // Last 5 entries
		}

		for _, entry := range recentEntries {
			if entry.Role == "user" {
				entryText := strings.ToLower(entry.Content)

				// Check for escalating frustration
				if strings.Contains(entryText, "masih") || strings.Contains(entryText, "tetap") {
					moodScores["frustrated"] += 0.2
					indicators = append(indicators, "escalating_frustration")
				}

				// Check for repeated questions (confusion)
				for _, prevEntry := range req.ConversationHistory {
					if prevEntry.Role == "user" && prevEntry.Timestamp.Before(entry.Timestamp) {
						similarity := aps.calculateTextSimilarity(entryText, strings.ToLower(prevEntry.Content))
						if similarity > 0.7 {
							moodScores["confused"] += 0.3
							indicators = append(indicators, "repeated_question")
							break
						}
					}
				}
			}
		}
	}

	// Determine primary mood
	primaryMood := "neutral"
	maxScore := 0.0
	for mood, score := range moodScores {
		if score > maxScore {
			maxScore = score
			primaryMood = mood
		}
	}

	// Calculate confidence based on indicators and scores
	confidence := maxScore
	if confidence > 1.0 {
		confidence = 1.0
	}
	if confidence < 0.1 {
		confidence = 0.5 // Default neutral confidence
		primaryMood = "neutral"
	}

	// Determine intensity
	intensity := "low"
	if confidence > 0.7 {
		intensity = "high"
	} else if confidence > 0.4 {
		intensity = "medium"
	}

	return &UserMood{
		Primary:    primaryMood,
		Confidence: confidence,
		Indicators: indicators,
		Intensity:  intensity,
		Metadata: map[string]interface{}{
			"mood_scores":     moodScores,
			"analysis_method": "keyword_and_pattern",
			"history_entries": len(req.ConversationHistory),
		},
	}, nil
}

// analyzeConversationContext analyzes the conversation context and stage
func (aps *AdvancedPersonaService) analyzeConversationContext(_ context.Context, req *AdvancedPersonaRequest) (*ConversationContext, error) {
	if !aps.contextAnalyzer.enabled {
		return &ConversationContext{
			SessionID:          req.SessionID,
			ConversationStage:  "inquiry",
			UserExpertiseLevel: "intermediate",
			InteractionCount:   len(req.ConversationHistory),
		}, nil
	}

	context := &ConversationContext{
		SessionID:        req.SessionID,
		InteractionCount: len(req.ConversationHistory),
		UserPreferences:  make(map[string]interface{}),
		Metadata:         make(map[string]interface{}),
	}

	// Determine conversation stage
	context.ConversationStage = aps.determineConversationStage(req)

	// Analyze user expertise level
	context.UserExpertiseLevel = aps.analyzeUserExpertiseLevel(req)

	// Track service progression
	context.ServiceProgression = aps.extractServiceProgression(req)

	// Identify topic transitions
	context.TopicTransitions = aps.identifyTopicTransitions(req)

	// Extract contextual cues
	context.ContextualCues = aps.extractContextualCues(req)

	// Analyze user preferences from conversation
	context.UserPreferences = aps.extractUserPreferences(req)

	context.Metadata = map[string]interface{}{
		"analysis_timestamp": time.Now(),
		"context_version":    "2.0",
		"analysis_depth":     "comprehensive",
	}

	return context, nil
}

// Helper methods for advanced persona processing

// calculateTextSimilarity calculates similarity between two text strings
func (aps *AdvancedPersonaService) calculateTextSimilarity(text1, text2 string) float64 {
	if text1 == text2 {
		return 1.0
	}

	words1 := strings.Fields(text1)
	words2 := strings.Fields(text2)

	if len(words1) == 0 || len(words2) == 0 {
		return 0.0
	}

	// Simple word overlap similarity
	commonWords := 0
	for _, word1 := range words1 {
		for _, word2 := range words2 {
			if word1 == word2 {
				commonWords++
				break
			}
		}
	}

	totalWords := len(words1) + len(words2)
	return float64(commonWords*2) / float64(totalWords)
}

// determineConversationStage determines the current stage of conversation
func (aps *AdvancedPersonaService) determineConversationStage(req *AdvancedPersonaRequest) string {
	historyCount := len(req.ConversationHistory)
	query := strings.ToLower(req.Query)

	// Greeting stage
	if historyCount == 0 || historyCount == 1 {
		greetingWords := []string{"halo", "hai", "selamat", "assalamualaikum", "permisi"}
		for _, word := range greetingWords {
			if strings.Contains(query, word) {
				return "greeting"
			}
		}
	}

	// Resolution stage
	if strings.Contains(query, "terima kasih") || strings.Contains(query, "sudah jelas") ||
		strings.Contains(query, "cukup") || strings.Contains(query, "selesai") {
		return "resolution"
	}

	// Clarification stage
	if strings.Contains(query, "maksudnya") || strings.Contains(query, "bisa dijelaskan") ||
		strings.Contains(query, "tidak paham") || strings.Contains(query, "kurang jelas") {
		return "clarification"
	}

	// Default to inquiry stage
	return "inquiry"
}

// analyzeUserExpertiseLevel analyzes user expertise based on language and questions
func (aps *AdvancedPersonaService) analyzeUserExpertiseLevel(req *AdvancedPersonaRequest) string {
	query := strings.ToLower(req.Query)

	// Beginner indicators
	beginnerWords := []string{"bagaimana cara", "gimana", "tidak tahu", "bingung", "pertama kali"}
	for _, word := range beginnerWords {
		if strings.Contains(query, word) {
			return "beginner"
		}
	}

	// Expert indicators
	expertWords := []string{"persyaratan", "prosedur", "regulasi", "ketentuan", "pasal"}
	for _, word := range expertWords {
		if strings.Contains(query, word) {
			return "expert"
		}
	}

	// Check conversation history for expertise indicators
	if len(req.ConversationHistory) > 3 {
		technicalTerms := 0
		for _, entry := range req.ConversationHistory {
			if entry.Role == "user" {
				entryText := strings.ToLower(entry.Content)
				if strings.Contains(entryText, "dokumen") || strings.Contains(entryText, "berkas") ||
					strings.Contains(entryText, "syarat") || strings.Contains(entryText, "formulir") {
					technicalTerms++
				}
			}
		}

		if technicalTerms >= 2 {
			return "expert"
		}
	}

	return "intermediate"
}

// extractServiceProgression extracts the progression of services discussed
func (aps *AdvancedPersonaService) extractServiceProgression(req *AdvancedPersonaRequest) []string {
	services := []string{}
	serviceKeywords := map[string][]string{
		"ktp":         {"ktp", "kartu tanda penduduk", "identitas"},
		"akta":        {"akta", "kelahiran", "kematian", "nikah"},
		"perpindahan": {"pindah", "domisili", "mutasi"},
		"kk":          {"kartu keluarga", "kk"},
		"surat":       {"surat", "keterangan"},
	}

	// Check current query
	currentQuery := strings.ToLower(req.Query)
	for service, keywords := range serviceKeywords {
		for _, keyword := range keywords {
			if strings.Contains(currentQuery, keyword) {
				services = append(services, service)
				break
			}
		}
	}

	// Check conversation history
	for _, entry := range req.ConversationHistory {
		if entry.Role == "user" {
			entryText := strings.ToLower(entry.Content)
			for service, keywords := range serviceKeywords {
				for _, keyword := range keywords {
					if strings.Contains(entryText, keyword) {
						// Add if not already present
						found := false
						for _, existingService := range services {
							if existingService == service {
								found = true
								break
							}
						}
						if !found {
							services = append(services, service)
						}
						break
					}
				}
			}
		}
	}

	return services
}

// identifyTopicTransitions identifies topic changes in conversation
func (aps *AdvancedPersonaService) identifyTopicTransitions(req *AdvancedPersonaRequest) []string {
	transitions := []string{}

	if len(req.ConversationHistory) < 2 {
		return transitions
	}

	// Simple topic transition detection based on service changes
	serviceProgression := aps.extractServiceProgression(req)
	if len(serviceProgression) > 1 {
		for i := 1; i < len(serviceProgression); i++ {
			transition := fmt.Sprintf("%s_to_%s", serviceProgression[i-1], serviceProgression[i])
			transitions = append(transitions, transition)
		}
	}

	return transitions
}

// extractContextualCues extracts contextual cues from conversation
func (aps *AdvancedPersonaService) extractContextualCues(req *AdvancedPersonaRequest) []string {
	cues := []string{}
	query := strings.ToLower(req.Query)

	// Time-sensitive cues
	if strings.Contains(query, "hari ini") || strings.Contains(query, "sekarang") {
		cues = append(cues, "time_sensitive")
	}

	// Location cues
	if strings.Contains(query, "garut") || strings.Contains(query, "disdukcapil") {
		cues = append(cues, "location_specific")
	}

	// Urgency cues
	if strings.Contains(query, "cepat") || strings.Contains(query, "mendesak") {
		cues = append(cues, "urgent_request")
	}

	// Document-related cues
	if strings.Contains(query, "dokumen") || strings.Contains(query, "berkas") {
		cues = append(cues, "document_focused")
	}

	return cues
}

// extractUserPreferences extracts user preferences from conversation patterns
func (aps *AdvancedPersonaService) extractUserPreferences(req *AdvancedPersonaRequest) map[string]interface{} {
	preferences := make(map[string]interface{})

	// Analyze formality preference
	formalCount := 0
	informalCount := 0

	for _, entry := range req.ConversationHistory {
		if entry.Role == "user" {
			entryText := strings.ToLower(entry.Content)
			if strings.Contains(entryText, "bapak") || strings.Contains(entryText, "ibu") ||
				strings.Contains(entryText, "mohon") || strings.Contains(entryText, "silakan") {
				formalCount++
			}
			if strings.Contains(entryText, "kamu") || strings.Contains(entryText, "gimana") ||
				strings.Contains(entryText, "dong") || strings.Contains(entryText, "nih") {
				informalCount++
			}
		}
	}

	if formalCount > informalCount {
		preferences["formality"] = "formal"
	} else if informalCount > formalCount {
		preferences["formality"] = "informal"
	} else {
		preferences["formality"] = "mixed"
	}

	// Analyze response length preference
	if len(req.ConversationHistory) > 2 {
		shortResponses := 0
		for _, entry := range req.ConversationHistory {
			if entry.Role == "user" && len(entry.Content) < 50 {
				shortResponses++
			}
		}

		if shortResponses > len(req.ConversationHistory)/2 {
			preferences["response_length"] = "concise"
		} else {
			preferences["response_length"] = "detailed"
		}
	}

	return preferences
}

// analyzeUserPattern analyzes user interaction patterns
func (aps *AdvancedPersonaService) analyzeUserPattern(_ context.Context, req *AdvancedPersonaRequest) (*UserInteractionPattern, error) {
	if !aps.userPatternAnalyzer.enabled {
		return &UserInteractionPattern{
			UserID:             req.UserID,
			PreferredFormality: "formal",
			ResponseStyle:      "detailed",
			CommunicationStyle: "polite",
		}, nil
	}

	pattern := &UserInteractionPattern{
		UserID:             req.UserID,
		ServiceFamiliarity: make(map[string]string),
		InteractionTiming:  make(map[string]interface{}),
		Metadata:           make(map[string]interface{}),
	}

	// Extract preferences from conversation
	preferences := aps.extractUserPreferences(req)
	if formality, ok := preferences["formality"].(string); ok {
		pattern.PreferredFormality = formality
	}
	if responseLength, ok := preferences["response_length"].(string); ok {
		pattern.ResponseStyle = responseLength
	}

	// Analyze communication style
	query := strings.ToLower(req.Query)
	if strings.Contains(query, "tolong") || strings.Contains(query, "mohon") {
		pattern.CommunicationStyle = "polite"
	} else if strings.Contains(query, "cepat") || strings.Contains(query, "sekarang") {
		pattern.CommunicationStyle = "urgent"
	} else {
		pattern.CommunicationStyle = "direct"
	}

	// Analyze service familiarity
	services := aps.extractServiceProgression(req)
	for _, service := range services {
		// Simple heuristic: if user asks basic questions, they're a beginner
		if strings.Contains(query, "bagaimana") || strings.Contains(query, "cara") {
			pattern.ServiceFamiliarity[service] = "beginner"
		} else if strings.Contains(query, "persyaratan") || strings.Contains(query, "dokumen") {
			pattern.ServiceFamiliarity[service] = "intermediate"
		} else {
			pattern.ServiceFamiliarity[service] = "beginner"
		}
	}

	return pattern, nil
}

// enhancePersonaRequest enhances the base persona request with advanced context
func (aps *AdvancedPersonaService) enhancePersonaRequest(req *AdvancedPersonaRequest, mood *UserMood, context *ConversationContext, pattern *UserInteractionPattern) *PersonaRequest {
	enhanced := &PersonaRequest{
		Query:          req.Query,
		UserID:         req.UserID,
		SessionID:      req.SessionID,
		Context:        req.Context,
		BaseResponse:   req.BaseResponse,
		ServiceType:    req.ServiceType,
		IsFirstContact: req.IsFirstContact,
		TimeOfDay:      req.TimeOfDay,
		UserTone:       req.UserTone,
	}

	// Enhance with mood information
	if mood != nil {
		enhanced.UserTone = mood.Primary
		if enhanced.Context == nil {
			enhanced.Context = make(map[string]interface{})
		}
		enhanced.Context["detected_mood"] = mood
		enhanced.Context["mood_confidence"] = mood.Confidence
		enhanced.Context["mood_intensity"] = mood.Intensity
	}

	// Enhance with conversation context
	if context != nil {
		if enhanced.Context == nil {
			enhanced.Context = make(map[string]interface{})
		}
		enhanced.Context["conversation_stage"] = context.ConversationStage
		enhanced.Context["user_expertise"] = context.UserExpertiseLevel
		enhanced.Context["interaction_count"] = context.InteractionCount
		enhanced.Context["service_progression"] = context.ServiceProgression
	}

	// Enhance with user pattern
	if pattern != nil {
		if enhanced.Context == nil {
			enhanced.Context = make(map[string]interface{})
		}
		enhanced.Context["preferred_formality"] = pattern.PreferredFormality
		enhanced.Context["response_style"] = pattern.ResponseStyle
		enhanced.Context["communication_style"] = pattern.CommunicationStyle
		enhanced.Context["service_familiarity"] = pattern.ServiceFamiliarity
	}

	return enhanced
}

// generateAdaptiveResponse generates adaptive response based on mood, context, and patterns
func (aps *AdvancedPersonaService) generateAdaptiveResponse(_ context.Context, baseContent string, mood *UserMood, context *ConversationContext, pattern *UserInteractionPattern) (string, []string, error) {
	if !aps.adaptiveGenerator.enabled {
		return baseContent, []string{}, nil
	}

	adaptedContent := baseContent
	adaptationsApplied := []string{}

	// Mood-based adaptations
	if mood != nil {
		switch mood.Primary {
		case "frustrated":
			if mood.Intensity == "high" {
				adaptedContent = "Saya memahami frustrasi Anda. Mari saya bantu dengan lebih jelas. " + adaptedContent
				adaptationsApplied = append(adaptationsApplied, "frustration_acknowledgment")
			}
		case "urgent":
			adaptedContent = "Saya akan memberikan informasi yang Anda butuhkan dengan segera. " + adaptedContent
			adaptationsApplied = append(adaptationsApplied, "urgency_acknowledgment")
		case "confused":
			adaptedContent = "Mari saya jelaskan dengan lebih detail dan mudah dipahami. " + adaptedContent
			adaptationsApplied = append(adaptationsApplied, "confusion_clarification")
		case "happy":
			adaptedContent = "Senang bisa membantu Anda! " + adaptedContent
			adaptationsApplied = append(adaptationsApplied, "positive_reinforcement")
		}
	}

	// Context-based adaptations
	if context != nil {
		switch context.ConversationStage {
		case "greeting":
			// Add more welcoming tone
			if !strings.Contains(adaptedContent, "Selamat") {
				timeGreeting := aps.getTimeBasedGreeting()
				adaptedContent = timeGreeting + " " + adaptedContent
				adaptationsApplied = append(adaptationsApplied, "greeting_enhancement")
			}
		case "clarification":
			// Add clarification language
			adaptedContent = "Untuk memperjelas, " + adaptedContent
			adaptationsApplied = append(adaptationsApplied, "clarification_language")
		case "resolution":
			// Add closure language
			adaptedContent = adaptedContent + " Apakah ada hal lain yang bisa saya bantu?"
			adaptationsApplied = append(adaptationsApplied, "closure_language")
		}

		// Expertise-based adaptations
		switch context.UserExpertiseLevel {
		case "beginner":
			// Simplify language and add more explanation
			adaptedContent = aps.simplifyLanguage(adaptedContent)
			adaptationsApplied = append(adaptationsApplied, "beginner_simplification")
		case "expert":
			// Use more technical language
			adaptedContent = aps.enhanceWithTechnicalTerms(adaptedContent)
			adaptationsApplied = append(adaptationsApplied, "expert_enhancement")
		}
	}

	// Pattern-based adaptations
	if pattern != nil {
		// Formality adaptations
		switch pattern.PreferredFormality {
		case "formal":
			adaptedContent = aps.enhanceFormality(adaptedContent)
			adaptationsApplied = append(adaptationsApplied, "formality_enhancement")
		case "informal":
			adaptedContent = aps.relaxFormality(adaptedContent)
			adaptationsApplied = append(adaptationsApplied, "formality_relaxation")
		}

		// Response style adaptations
		switch pattern.ResponseStyle {
		case "concise":
			adaptedContent = aps.makeResponseConcise(adaptedContent)
			adaptationsApplied = append(adaptationsApplied, "concise_adaptation")
		case "detailed":
			adaptedContent = aps.addMoreDetail(adaptedContent)
			adaptationsApplied = append(adaptationsApplied, "detail_enhancement")
		}
	}

	return adaptedContent, adaptationsApplied, nil
}

// calculatePersonalizationLevel calculates the level of personalization applied
func (aps *AdvancedPersonaService) calculatePersonalizationLevel(mood *UserMood, context *ConversationContext, pattern *UserInteractionPattern) string {
	score := 0

	// Mood detection adds to personalization
	if mood != nil && mood.Confidence > 0.6 {
		score += 2
	}

	// Context analysis adds to personalization
	if context != nil {
		if context.InteractionCount > 3 {
			score += 2
		}
		if len(context.ServiceProgression) > 1 {
			score += 1
		}
	}

	// User pattern analysis adds to personalization
	if pattern != nil {
		if len(pattern.ServiceFamiliarity) > 0 {
			score += 2
		}
		if pattern.PreferredFormality != "" {
			score += 1
		}
	}

	if score >= 6 {
		return "high"
	} else if score >= 3 {
		return "medium"
	}
	return "low"
}

// calculateContextualRelevance calculates how relevant the response is to context
func (aps *AdvancedPersonaService) calculateContextualRelevance(req *AdvancedPersonaRequest, context *ConversationContext) float64 {
	relevance := 0.5 // Base relevance

	// Service progression relevance
	if context != nil && len(context.ServiceProgression) > 0 {
		query := strings.ToLower(req.Query)
		for _, service := range context.ServiceProgression {
			if strings.Contains(query, service) {
				relevance += 0.2
			}
		}
	}

	// Conversation stage relevance
	if context != nil {
		switch context.ConversationStage {
		case "greeting":
			if aps.isGreetingQuery(req.Query) {
				relevance += 0.3
			}
		case "inquiry":
			if aps.isInquiryQuery(req.Query) {
				relevance += 0.3
			}
		case "clarification":
			if aps.isClarificationQuery(req.Query) {
				relevance += 0.3
			}
		}
	}

	if relevance > 1.0 {
		relevance = 1.0
	}

	return relevance
}

// determineResponseStrategy determines the best response strategy
func (aps *AdvancedPersonaService) determineResponseStrategy(mood *UserMood, context *ConversationContext, pattern *UserInteractionPattern) string {
	// Priority: mood-based strategy
	if mood != nil && mood.Confidence > 0.7 {
		switch mood.Primary {
		case "frustrated":
			return "empathetic_problem_solving"
		case "urgent":
			return "direct_efficient"
		case "confused":
			return "step_by_step_explanation"
		case "happy":
			return "positive_reinforcement"
		}
	}

	// Context-based strategy
	if context != nil {
		switch context.ConversationStage {
		case "greeting":
			return "welcoming_introduction"
		case "clarification":
			return "detailed_clarification"
		case "resolution":
			return "comprehensive_closure"
		}

		switch context.UserExpertiseLevel {
		case "beginner":
			return "educational_guidance"
		case "expert":
			return "technical_efficiency"
		}
	}

	// Pattern-based strategy
	if pattern != nil {
		if pattern.CommunicationStyle == "urgent" {
			return "direct_efficient"
		}
		if pattern.ResponseStyle == "concise" {
			return "brief_informative"
		}
	}

	return "balanced_professional"
}

// Helper methods for adaptive response generation

// getTimeBasedGreeting returns appropriate greeting based on time
func (aps *AdvancedPersonaService) getTimeBasedGreeting() string {
	hour := time.Now().Hour()
	if hour < 12 {
		return "Selamat pagi"
	} else if hour < 15 {
		return "Selamat siang"
	} else if hour < 18 {
		return "Selamat sore"
	}
	return "Selamat malam"
}

// simplifyLanguage simplifies language for beginner users
func (aps *AdvancedPersonaService) simplifyLanguage(content string) string {
	// Replace complex terms with simpler ones
	replacements := map[string]string{
		"persyaratan":  "syarat-syarat",
		"prosedur":     "cara",
		"dokumen":      "berkas",
		"administrasi": "urusan",
		"verifikasi":   "pengecekan",
		"validasi":     "pengecekan",
		"registrasi":   "pendaftaran",
		"formulir":     "form",
	}

	simplified := content
	for complex, simple := range replacements {
		simplified = strings.ReplaceAll(simplified, complex, simple)
	}

	return simplified
}

// enhanceWithTechnicalTerms adds technical terms for expert users
func (aps *AdvancedPersonaService) enhanceWithTechnicalTerms(content string) string {
	// Replace simple terms with more technical ones
	replacements := map[string]string{
		"syarat-syarat": "persyaratan administratif",
		"cara":          "prosedur",
		"berkas":        "dokumen",
		"urusan":        "administrasi",
		"pengecekan":    "verifikasi",
		"pendaftaran":   "registrasi",
		"form":          "formulir",
	}

	enhanced := content
	for simple, technical := range replacements {
		enhanced = strings.ReplaceAll(enhanced, simple, technical)
	}

	return enhanced
}

// enhanceFormality increases formality of response
func (aps *AdvancedPersonaService) enhanceFormality(content string) string {
	// Replace informal terms with formal ones
	replacements := map[string]string{
		"kamu":   "Anda",
		"gimana": "bagaimana",
		"dong":   "",
		"nih":    "",
		"banget": "sekali",
		"udah":   "sudah",
		"gak":    "tidak",
		"nggak":  "tidak",
	}

	formal := content
	for informal, formalTerm := range replacements {
		formal = strings.ReplaceAll(formal, informal, formalTerm)
	}

	// Add formal address if not present
	if !strings.Contains(formal, "Bapak/Ibu") && !strings.Contains(formal, "Anda") {
		formal = "Bapak/Ibu, " + formal
	}

	return formal
}

// relaxFormality decreases formality for more casual interaction
func (aps *AdvancedPersonaService) relaxFormality(content string) string {
	// Replace overly formal terms with more casual ones
	replacements := map[string]string{
		"Bapak/Ibu":        "",
		"dengan hormat":    "",
		"mohon maaf":       "maaf",
		"silakan":          "bisa",
		"demikian":         "begitu",
		"sebagaimana":      "seperti",
		"berkenaan dengan": "tentang",
	}

	casual := content
	for formal, casualTerm := range replacements {
		casual = strings.ReplaceAll(casual, formal, casualTerm)
	}

	return strings.TrimSpace(casual)
}

// makeResponseConcise makes response more concise
func (aps *AdvancedPersonaService) makeResponseConcise(content string) string {
	// Remove redundant phrases
	redundantPhrases := []string{
		"Perlu diketahui bahwa",
		"Sebagai informasi",
		"Untuk diketahui",
		"Dalam hal ini",
		"Adapun",
		"Selanjutnya",
	}

	concise := content
	for _, phrase := range redundantPhrases {
		concise = strings.ReplaceAll(concise, phrase, "")
	}

	// Split into sentences and keep only essential ones
	sentences := strings.Split(concise, ". ")
	if len(sentences) > 3 {
		// Keep first 3 sentences for conciseness
		concise = strings.Join(sentences[:3], ". ")
		if !strings.HasSuffix(concise, ".") {
			concise += "."
		}
	}

	return strings.TrimSpace(concise)
}

// addMoreDetail adds more detail to response
func (aps *AdvancedPersonaService) addMoreDetail(content string) string {
	detailed := content

	// Add explanatory phrases
	if strings.Contains(detailed, "KTP") {
		detailed = strings.ReplaceAll(detailed, "KTP", "KTP (Kartu Tanda Penduduk)")
	}
	if strings.Contains(detailed, "akta") {
		detailed = strings.ReplaceAll(detailed, "akta", "akta (dokumen resmi)")
	}

	// Add helpful context
	if !strings.Contains(detailed, "Disdukcapil") {
		detailed += " Untuk informasi lebih lanjut, Anda dapat menghubungi Disdukcapil Kabupaten Garut."
	}

	return detailed
}

// Query type detection helpers
func (aps *AdvancedPersonaService) isGreetingQuery(query string) bool {
	greetingWords := []string{"halo", "hai", "selamat", "assalamualaikum", "permisi"}
	queryLower := strings.ToLower(query)
	for _, word := range greetingWords {
		if strings.Contains(queryLower, word) {
			return true
		}
	}
	return false
}

func (aps *AdvancedPersonaService) isInquiryQuery(query string) bool {
	inquiryWords := []string{"bagaimana", "cara", "gimana", "apa", "dimana", "kapan"}
	queryLower := strings.ToLower(query)
	for _, word := range inquiryWords {
		if strings.Contains(queryLower, word) {
			return true
		}
	}
	return false
}

func (aps *AdvancedPersonaService) isClarificationQuery(query string) bool {
	clarificationWords := []string{"maksudnya", "bisa dijelaskan", "tidak paham", "kurang jelas", "bingung"}
	queryLower := strings.ToLower(query)
	for _, word := range clarificationWords {
		if strings.Contains(queryLower, word) {
			return true
		}
	}
	return false
}

package chat

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// EnhancedProviderSelector provides intelligent AI provider selection with comprehensive tracking
type EnhancedProviderSelector struct {
	userHistory          map[string]*UserProviderHistory
	providerMetrics      map[string]*ProviderMetrics
	complexityAnalyzer   *QueryComplexityAnalyzer

	// Priority 2 enhancements
	userHistoryTracker   *UserHistoryTracker
	rotationEngine       *ProviderRotationEngine
	performanceSelector  *PerformanceBasedSelector

	enabled              bool
	mutex                sync.RWMutex
}

// UserProviderHistory tracks user's interaction history with providers
type UserProviderHistory struct {
	UserID                  string                 `json:"user_id"`
	ProviderUsageCount      map[string]int         `json:"provider_usage_count"`
	LastUsedProvider        string                 `json:"last_used_provider"`
	ConsecutiveSameProvider int                    `json:"consecutive_same_provider"`
	PreferredProvider       string                 `json:"preferred_provider"`
	InteractionCount        int                    `json:"interaction_count"`
	AverageResponseTime     map[string]float64     `json:"average_response_time"`
	SatisfactionScores      map[string]float64     `json:"satisfaction_scores"`
	LastUpdated             time.Time              `json:"last_updated"`
	CreatedAt               time.Time              `json:"created_at"`
}

// ProviderMetrics tracks provider performance metrics
type ProviderMetrics struct {
	ProviderName        string    `json:"provider_name"`
	TotalRequests       int64     `json:"total_requests"`
	SuccessfulRequests  int64     `json:"successful_requests"`
	AverageResponseTime float64   `json:"average_response_time"`
	ErrorRate           float64   `json:"error_rate"`
	HealthScore         float64   `json:"health_score"`
	LastHealthCheck     time.Time `json:"last_health_check"`
	Capabilities        []string  `json:"capabilities"`
}

// QueryComplexityAnalyzer analyzes query complexity for provider selection
type QueryComplexityAnalyzer struct {
	complexityPatterns map[string]float64
	servicePatterns    map[string]string
	enabled            bool
}

// QueryComplexity represents the complexity analysis of a query
type QueryComplexity struct {
	Level               string  `json:"level"`               // "simple", "moderate", "complex"
	Score               float64 `json:"score"`               // 0.0 - 1.0
	RequiresEnhancement bool    `json:"requires_enhancement"`
	ServiceType         string  `json:"service_type"`
	Factors             ComplexityFactors `json:"factors"`
}

// ComplexityFactors represents factors that contribute to query complexity
type ComplexityFactors struct {
	Length              int     `json:"length"`
	MultipleQuestions   bool    `json:"multiple_questions"`
	TechnicalTerms      bool    `json:"technical_terms"`
	RequiresDatabase    bool    `json:"requires_database"`
	ConversationalMode  bool    `json:"conversational_mode"`
	EmotionalContent    bool    `json:"emotional_content"`
	ComplexityScore     float64 `json:"complexity_score"`
}

// ProviderSelectionRequest contains parameters for provider selection
type ProviderSelectionRequest struct {
	Query               string                 `json:"query"`
	UserID              string                 `json:"user_id"`
	SessionID           string                 `json:"session_id"`
	Context             map[string]interface{} `json:"context"`
	ConversationHistory []string               `json:"conversation_history"`
	PreferredProvider   string                 `json:"preferred_provider"`
	AvailableProviders  []string               `json:"available_providers"`
}

// ProviderSelectionResponse contains the selected provider and reasoning
type ProviderSelectionResponse struct {
	SelectedProvider    string                 `json:"selected_provider"`
	Confidence          float64                `json:"confidence"`
	Reasoning           string                 `json:"reasoning"`
	AlternativeProviders []string              `json:"alternative_providers"`
	QueryComplexity     QueryComplexity        `json:"query_complexity"`
	UserHistoryApplied  bool                   `json:"user_history_applied"`
	ProcessingTime      float64                `json:"processing_time"`
	Metadata            map[string]interface{} `json:"metadata"`
}

// NewEnhancedProviderSelector creates a new enhanced provider selector
func NewEnhancedProviderSelector() *EnhancedProviderSelector {
	return &EnhancedProviderSelector{
		userHistory:     make(map[string]*UserProviderHistory),
		providerMetrics: make(map[string]*ProviderMetrics),
		complexityAnalyzer: &QueryComplexityAnalyzer{
			complexityPatterns: map[string]float64{
				"greeting":     0.2, // Simple greetings
				"service":      0.6, // Service requests
				"technical":    0.8, // Technical queries
				"multi_part":   0.9, // Multiple questions
				"emotional":    0.7, // Emotional content
			},
			servicePatterns: map[string]string{
				"ktp":         "service",
				"kartu keluarga": "service",
				"akta":        "service",
				"domisili":    "service",
				"pindah":      "service",
				"halo":        "greeting",
				"selamat":     "greeting",
				"assalamualaikum": "greeting",
			},
			enabled: true,
		},

		// Priority 2 enhancements
		userHistoryTracker:  NewUserHistoryTracker(),
		rotationEngine:      NewProviderRotationEngine(),
		performanceSelector: NewPerformanceBasedSelector(),

		enabled: true,
	}
}

// SelectProvider selects the best provider based on comprehensive analysis
func (eps *EnhancedProviderSelector) SelectProvider(ctx context.Context, req *ProviderSelectionRequest) (*ProviderSelectionResponse, error) {
	if !eps.enabled {
		// Fallback to simple selection
		return &ProviderSelectionResponse{
			SelectedProvider: "simple",
			Confidence:       0.5,
			Reasoning:        "Enhanced provider selection disabled",
			ProcessingTime:   0.0,
		}, nil
	}

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"user_id":            req.UserID,
		"session_id":         req.SessionID,
		"query_length":       len(req.Query),
		"available_providers": len(req.AvailableProviders),
	}).Debug("Selecting optimal AI provider with Priority 2 enhancements")

	// Phase 1: Analyze query complexity
	complexity := eps.complexityAnalyzer.AnalyzeComplexity(req.Query, req.Context)

	// Phase 2: Get comprehensive user profile
	userProfile := eps.userHistoryTracker.GetUserProfile(req.UserID)

	// Phase 3: Get performance-based recommendations
	perfReq := &PerformanceSelectionRequest{
		AvailableProviders:   req.AvailableProviders,
		QueryType:            complexity.ServiceType,
		UserID:               req.UserID,
		SessionID:            req.SessionID,
		RequiredQuality:      0.7, // Default quality requirement
		MaxAcceptableLatency: 5000, // 5 seconds max
		Context:              req.Context,
	}

	performanceResp, err := eps.performanceSelector.SelectBestPerformingProvider(ctx, perfReq)
	if err != nil {
		logrus.WithError(err).Warn("Performance-based selection failed")
	}

	// Phase 4: Check provider rotation needs
	rotationReq := &ProviderRotationRequest{
		UserID:             req.UserID,
		SessionID:          req.SessionID,
		QueryType:          complexity.ServiceType,
		AvailableProviders: req.AvailableProviders,
		CurrentProvider:    performanceResp.SelectedProvider,
		UserHistory:        userProfile,
		SessionContext:     req.Context,
		ForceRotation:      false,
	}

	rotationResp, err := eps.rotationEngine.ShouldRotateProvider(ctx, rotationReq)
	if err != nil {
		logrus.WithError(err).Warn("Provider rotation evaluation failed")
	}

	// Phase 5: Make final provider selection
	selectedProvider := eps.makeFinalProviderSelection(req, complexity, userProfile, performanceResp, rotationResp)

	// Phase 6: Calculate confidence and reasoning
	confidence, reasoning := eps.calculateFinalConfidenceAndReasoning(complexity, performanceResp, rotationResp)

	// Phase 7: Generate alternative providers
	alternatives := eps.generateEnhancedAlternatives(req.AvailableProviders, selectedProvider, complexity, performanceResp)

	// Phase 8: Update user history with comprehensive tracking
	eps.updateComprehensiveUserHistory(req, selectedProvider, complexity, confidence)

	processingTime := time.Since(startTime).Seconds() * 1000

	logrus.WithFields(logrus.Fields{
		"user_id":              req.UserID,
		"selected_provider":    selectedProvider,
		"confidence":           confidence,
		"complexity_level":     complexity.Level,
		"performance_applied":  performanceResp != nil,
		"rotation_applied":     rotationResp != nil && rotationResp.ShouldRotate,
		"processing_time_ms":   processingTime,
	}).Info("Enhanced provider selection completed with Priority 2 features")

	return &ProviderSelectionResponse{
		SelectedProvider:     selectedProvider,
		Confidence:           confidence,
		Reasoning:            reasoning,
		AlternativeProviders: alternatives,
		QueryComplexity:      *complexity,
		UserHistoryApplied:   userProfile != nil,
		ProcessingTime:       processingTime,
		Metadata: map[string]interface{}{
			"complexity_score":        complexity.Score,
			"performance_score":       performanceResp.PerformanceScore,
			"rotation_applied":        rotationResp != nil && rotationResp.ShouldRotate,
			"rotation_reason":         rotationResp.RotationReason,
			"expected_response_time":  performanceResp.ExpectedResponseTime,
			"expected_quality":        performanceResp.ExpectedQuality,
			"priority2_features":      "active",
		},
	}, nil
}

// AnalyzeComplexity analyzes the complexity of a query
func (qca *QueryComplexityAnalyzer) AnalyzeComplexity(query string, context map[string]interface{}) *QueryComplexity {
	if !qca.enabled {
		return &QueryComplexity{
			Level: "moderate",
			Score: 0.5,
		}
	}

	query = strings.ToLower(strings.TrimSpace(query))
	
	factors := ComplexityFactors{
		Length: len(query),
	}

	// Analyze various complexity factors
	score := 0.0

	// Length factor
	if len(query) > 200 {
		score += 0.3
		factors.ComplexityScore += 0.3
	} else if len(query) > 100 {
		score += 0.2
		factors.ComplexityScore += 0.2
	} else if len(query) < 20 {
		score += 0.1 // Very short queries might be simple
		factors.ComplexityScore += 0.1
	}

	// Multiple questions
	questionMarkers := []string{"?", "apa", "bagaimana", "dimana", "kapan", "siapa", "mengapa"}
	questionCount := 0
	for _, marker := range questionMarkers {
		if strings.Contains(query, marker) {
			questionCount++
		}
	}
	if questionCount > 1 {
		factors.MultipleQuestions = true
		score += 0.3
		factors.ComplexityScore += 0.3
	}

	// Technical terms
	technicalTerms := []string{"database", "sistem", "integrasi", "api", "teknologi"}
	for _, term := range technicalTerms {
		if strings.Contains(query, term) {
			factors.TechnicalTerms = true
			score += 0.2
			factors.ComplexityScore += 0.2
			break
		}
	}

	// Service-related complexity
	serviceType := "general"
	for pattern, sType := range qca.servicePatterns {
		if strings.Contains(query, pattern) {
			serviceType = sType
			if sType == "service" {
				factors.RequiresDatabase = true
				score += 0.2
				factors.ComplexityScore += 0.2
			}
			break
		}
	}

	// Emotional content
	emotionalWords := []string{"susah", "bingung", "frustasi", "senang", "terima kasih"}
	for _, word := range emotionalWords {
		if strings.Contains(query, word) {
			factors.EmotionalContent = true
			score += 0.1
			factors.ComplexityScore += 0.1
			break
		}
	}

	// Conversational indicators
	conversationalWords := []string{"dong", "nih", "ya", "kan", "gimana"}
	for _, word := range conversationalWords {
		if strings.Contains(query, word) {
			factors.ConversationalMode = true
			score += 0.1
			factors.ComplexityScore += 0.1
			break
		}
	}

	// Determine complexity level
	level := "simple"
	requiresEnhancement := false
	
	if score >= 0.7 {
		level = "complex"
		requiresEnhancement = true
	} else if score >= 0.4 {
		level = "moderate"
		requiresEnhancement = score >= 0.5
	}

	return &QueryComplexity{
		Level:               level,
		Score:               score,
		RequiresEnhancement: requiresEnhancement,
		ServiceType:         serviceType,
		Factors:             factors,
	}
}

// IsEnabled returns whether the enhanced provider selector is enabled
func (eps *EnhancedProviderSelector) IsEnabled() bool {
	eps.mutex.RLock()
	defer eps.mutex.RUnlock()
	return eps.enabled
}

// SetEnabled enables or disables the enhanced provider selector
func (eps *EnhancedProviderSelector) SetEnabled(enabled bool) {
	eps.mutex.Lock()
	defer eps.mutex.Unlock()
	eps.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Enhanced provider selector status updated")
}

// getUserHistory gets user history with fallback to new user
func (eps *EnhancedProviderSelector) getUserHistory(userID string) *UserProviderHistory {
	eps.mutex.RLock()
	defer eps.mutex.RUnlock()

	if hist, exists := eps.userHistory[userID]; exists {
		return hist
	}

	// Create new user history
	newHist := &UserProviderHistory{
		UserID:                  userID,
		ProviderUsageCount:      make(map[string]int),
		LastUsedProvider:        "",
		ConsecutiveSameProvider: 0,
		PreferredProvider:       "",
		InteractionCount:        0,
		AverageResponseTime:     make(map[string]float64),
		SatisfactionScores:      make(map[string]float64),
		LastUpdated:             time.Now(),
		CreatedAt:               time.Now(),
	}

	eps.userHistory[userID] = newHist
	return newHist
}

// selectOptimalProvider selects the optimal provider based on multiple factors
func (eps *EnhancedProviderSelector) selectOptimalProvider(req *ProviderSelectionRequest, complexity *QueryComplexity, userHist *UserProviderHistory) (string, float64, string) {
	// Default providers based on complexity
	var primaryProvider string
	confidence := 0.7
	reasoning := ""

	// Provider selection based on complexity
	switch complexity.Level {
	case "simple":
		primaryProvider = "simple"
		reasoning = "Simple query suitable for basic provider"
	case "moderate":
		primaryProvider = "enhanced"
		reasoning = "Moderate complexity requires enhanced provider"
		confidence = 0.8
	case "complex":
		primaryProvider = "enhanced"
		reasoning = "Complex query requires enhanced provider"
		confidence = 0.9
	}

	// Override with preferred provider if specified
	if req.PreferredProvider != "" && eps.isProviderAvailable(req.PreferredProvider, req.AvailableProviders) {
		primaryProvider = req.PreferredProvider
		reasoning = fmt.Sprintf("Using preferred provider: %s", req.PreferredProvider)
		confidence = 0.95
	}

	// Apply user history considerations
	if userHist != nil && userHist.InteractionCount > 0 {
		// Avoid consecutive same provider if used too many times
		if userHist.ConsecutiveSameProvider >= 3 && userHist.LastUsedProvider != "" {
			alternativeProvider := eps.selectAlternativeProvider(userHist.LastUsedProvider, req.AvailableProviders, complexity)
			if alternativeProvider != "" {
				primaryProvider = alternativeProvider
				reasoning = fmt.Sprintf("Rotating from %s to %s for variety", userHist.LastUsedProvider, alternativeProvider)
				confidence = 0.75
			}
		}

		// Use preferred provider if user has strong preference
		if userHist.PreferredProvider != "" && eps.isProviderAvailable(userHist.PreferredProvider, req.AvailableProviders) {
			// Check if preferred provider is suitable for complexity
			if eps.isProviderSuitableForComplexity(userHist.PreferredProvider, complexity) {
				primaryProvider = userHist.PreferredProvider
				reasoning = fmt.Sprintf("Using user's preferred provider: %s", userHist.PreferredProvider)
				confidence = 0.85
			}
		}
	}

	// Ensure selected provider is available
	if !eps.isProviderAvailable(primaryProvider, req.AvailableProviders) {
		primaryProvider = eps.selectFallbackProvider(req.AvailableProviders, complexity)
		reasoning = fmt.Sprintf("Fallback to available provider: %s", primaryProvider)
		confidence = 0.6
	}

	return primaryProvider, confidence, reasoning
}

// selectAlternativeProvider selects an alternative to avoid repetition
func (eps *EnhancedProviderSelector) selectAlternativeProvider(lastProvider string, availableProviders []string, complexity *QueryComplexity) string {
	// Filter out the last used provider
	alternatives := []string{}
	for _, provider := range availableProviders {
		if provider != lastProvider {
			alternatives = append(alternatives, provider)
		}
	}

	if len(alternatives) == 0 {
		return "" // No alternatives available
	}

	// Select best alternative based on complexity
	for _, provider := range alternatives {
		if eps.isProviderSuitableForComplexity(provider, complexity) {
			return provider
		}
	}

	// Return first available alternative
	return alternatives[0]
}

// isProviderAvailable checks if a provider is in the available list
func (eps *EnhancedProviderSelector) isProviderAvailable(provider string, availableProviders []string) bool {
	for _, available := range availableProviders {
		if available == provider {
			return true
		}
	}
	return false
}

// isProviderSuitableForComplexity checks if a provider is suitable for the query complexity
func (eps *EnhancedProviderSelector) isProviderSuitableForComplexity(provider string, complexity *QueryComplexity) bool {
	switch provider {
	case "simple":
		return complexity.Level == "simple"
	case "enhanced":
		return complexity.Level == "moderate" || complexity.Level == "complex"
	case "groq":
		return true // Groq can handle any complexity
	case "groq-selly":
		return true // GroqSELLY can handle any complexity
	default:
		return true // Unknown providers assumed to be capable
	}
}

// selectFallbackProvider selects a fallback provider when preferred is not available
func (eps *EnhancedProviderSelector) selectFallbackProvider(availableProviders []string, complexity *QueryComplexity) string {
	if len(availableProviders) == 0 {
		return "simple" // Ultimate fallback
	}

	// Prefer enhanced providers for complex queries
	if complexity.Level == "complex" || complexity.Level == "moderate" {
		preferredOrder := []string{"enhanced", "groq-selly", "groq", "simple"}
		for _, preferred := range preferredOrder {
			if eps.isProviderAvailable(preferred, availableProviders) {
				return preferred
			}
		}
	}

	// For simple queries, any provider works
	return availableProviders[0]
}

// generateAlternatives generates alternative provider suggestions
func (eps *EnhancedProviderSelector) generateAlternatives(selectedProvider string, availableProviders []string, complexity *QueryComplexity) []string {
	alternatives := []string{}

	for _, provider := range availableProviders {
		if provider != selectedProvider && eps.isProviderSuitableForComplexity(provider, complexity) {
			alternatives = append(alternatives, provider)
		}
	}

	// Limit to top 3 alternatives
	if len(alternatives) > 3 {
		alternatives = alternatives[:3]
	}

	return alternatives
}

// updateUserHistory updates user history after provider selection
func (eps *EnhancedProviderSelector) updateUserHistory(userID, selectedProvider string) {
	eps.mutex.Lock()
	defer eps.mutex.Unlock()

	hist, exists := eps.userHistory[userID]
	if !exists {
		hist = &UserProviderHistory{
			UserID:             userID,
			ProviderUsageCount: make(map[string]int),
			AverageResponseTime: make(map[string]float64),
			SatisfactionScores: make(map[string]float64),
			CreatedAt:          time.Now(),
		}
		eps.userHistory[userID] = hist
	}

	// Update usage count
	hist.ProviderUsageCount[selectedProvider]++
	hist.InteractionCount++

	// Update consecutive usage
	if hist.LastUsedProvider == selectedProvider {
		hist.ConsecutiveSameProvider++
	} else {
		hist.ConsecutiveSameProvider = 1
	}

	hist.LastUsedProvider = selectedProvider
	hist.LastUpdated = time.Now()

	// Update preferred provider based on usage patterns
	maxUsage := 0
	for provider, count := range hist.ProviderUsageCount {
		if count > maxUsage {
			maxUsage = count
			hist.PreferredProvider = provider
		}
	}
}

// GetMetrics returns provider selector metrics
func (eps *EnhancedProviderSelector) GetMetrics() map[string]interface{} {
	eps.mutex.RLock()
	defer eps.mutex.RUnlock()

	return map[string]interface{}{
		"enabled":           eps.enabled,
		"total_users":       len(eps.userHistory),
		"provider_metrics":  len(eps.providerMetrics),
		"complexity_analyzer_enabled": eps.complexityAnalyzer.enabled,
	}
}

// CleanupOldHistory removes old user history to prevent memory leaks
func (eps *EnhancedProviderSelector) CleanupOldHistory() {
	eps.mutex.Lock()
	defer eps.mutex.Unlock()

	cutoff := time.Now().Add(-7 * 24 * time.Hour) // Remove history older than 7 days

	for userID, hist := range eps.userHistory {
		if hist.LastUpdated.Before(cutoff) {
			delete(eps.userHistory, userID)
		}
	}

	logrus.WithField("remaining_users", len(eps.userHistory)).Debug("Cleaned up old user history")
}

// makeFinalProviderSelection makes the final provider selection based on all factors
func (eps *EnhancedProviderSelector) makeFinalProviderSelection(req *ProviderSelectionRequest, complexity *QueryComplexity, userProfile *UserProfile, performanceResp *PerformanceSelectionResponse, rotationResp *ProviderRotationResponse) string {
	// Priority 1: Use rotation recommendation if rotation is needed
	if rotationResp != nil && rotationResp.ShouldRotate {
		return rotationResp.RecommendedProvider
	}

	// Priority 2: Use performance-based selection if available
	if performanceResp != nil && performanceResp.SelectedProvider != "" {
		return performanceResp.SelectedProvider
	}

	// Priority 3: Use user history recommendations
	if userProfile != nil {
		recommendations := eps.userHistoryTracker.GetProviderRecommendations(req.UserID, complexity.ServiceType, req.AvailableProviders)
		if len(recommendations) > 0 {
			return recommendations[0]
		}
	}

	// Priority 4: Use complexity-based selection
	if complexity.RequiresEnhancement {
		for _, provider := range []string{"groq-selly", "enhanced", "groq"} {
			if eps.isProviderAvailable(provider, req.AvailableProviders) {
				return provider
			}
		}
	}

	// Fallback: Return first available provider
	if len(req.AvailableProviders) > 0 {
		return req.AvailableProviders[0]
	}

	return "simple" // Ultimate fallback
}

// calculateFinalConfidenceAndReasoning calculates final confidence and reasoning
func (eps *EnhancedProviderSelector) calculateFinalConfidenceAndReasoning(complexity *QueryComplexity, performanceResp *PerformanceSelectionResponse, rotationResp *ProviderRotationResponse) (float64, string) {
	baseConfidence := 0.7
	reasoning := "Multi-factor provider selection"

	// Factor in rotation confidence
	if rotationResp != nil && rotationResp.ShouldRotate {
		baseConfidence = (baseConfidence + rotationResp.Confidence) / 2
		reasoning = "Provider rotation: " + rotationResp.RotationReason
	}

	// Factor in performance confidence
	if performanceResp != nil {
		baseConfidence = (baseConfidence + performanceResp.Confidence) / 2
		if reasoning == "Multi-factor provider selection" {
			reasoning = "Performance-based: " + performanceResp.SelectionReason
		}
	}

	// Factor in complexity analysis
	if complexity.RequiresEnhancement {
		baseConfidence += 0.1
		if reasoning == "Multi-factor provider selection" {
			reasoning = "Complexity-based selection for " + complexity.Level + " query"
		}
	}

	// Ensure confidence is within bounds
	if baseConfidence > 1.0 {
		baseConfidence = 1.0
	}
	if baseConfidence < 0.1 {
		baseConfidence = 0.1
	}

	return baseConfidence, reasoning
}

// generateEnhancedAlternatives generates enhanced alternative provider suggestions
func (eps *EnhancedProviderSelector) generateEnhancedAlternatives(availableProviders []string, selectedProvider string, complexity *QueryComplexity, performanceResp *PerformanceSelectionResponse) []string {
	alternatives := make([]string, 0, len(availableProviders)-1)

	// Add performance-based alternatives first
	if performanceResp != nil && len(performanceResp.AlternativeProviders) > 0 {
		for _, altRanking := range performanceResp.AlternativeProviders {
			if altRanking.ProviderName != selectedProvider {
				alternatives = append(alternatives, altRanking.ProviderName)
			}
		}
	}

	// Add remaining available providers
	for _, provider := range availableProviders {
		if provider != selectedProvider {
			// Check if already added
			found := false
			for _, existing := range alternatives {
				if existing == provider {
					found = true
					break
				}
			}
			if !found {
				alternatives = append(alternatives, provider)
			}
		}
	}

	// Limit to top 3 alternatives
	if len(alternatives) > 3 {
		alternatives = alternatives[:3]
	}

	return alternatives
}

// updateComprehensiveUserHistory updates user history with comprehensive tracking
func (eps *EnhancedProviderSelector) updateComprehensiveUserHistory(req *ProviderSelectionRequest, selectedProvider string, complexity *QueryComplexity, confidence float64) {
	// Update user history tracker
	historyUpdate := &UserHistoryUpdate{
		UserID:           req.UserID,
		SessionID:        req.SessionID,
		ProviderUsed:     selectedProvider,
		QueryType:        complexity.ServiceType,
		ResponseTime:     0.0, // Will be updated after response
		ResponseQuality:  0.8, // Default, will be updated
		UserSatisfaction: 0.8, // Default, will be updated
		CulturalContext:  "indonesian",
		Timestamp:        time.Now(),
		AdditionalMetadata: map[string]interface{}{
			"complexity_level":  complexity.Level,
			"complexity_score":  complexity.Score,
			"selection_confidence": confidence,
			"requires_enhancement": complexity.RequiresEnhancement,
		},
	}

	if err := eps.userHistoryTracker.TrackUserInteraction(context.Background(), historyUpdate); err != nil {
		logrus.WithError(err).Warn("Failed to update user history")
	}

	// Update legacy user history (for backward compatibility)
	eps.updateUserHistory(req.UserID, selectedProvider)
}

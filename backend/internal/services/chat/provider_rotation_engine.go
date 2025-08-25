package chat

import (
	"context"
	"math/rand"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// ProviderRotationEngine manages intelligent provider rotation to prevent repetitive responses
type ProviderRotationEngine struct {
	rotationStrategies map[string]*RotationStrategy
	userRotationState  map[string]*UserRotationState
	globalRotationMetrics *GlobalRotationMetrics
	enabled            bool
	mutex              sync.RWMutex
}

// RotationStrategy defines how providers should be rotated for different scenarios
type RotationStrategy struct {
	Name                    string    `json:"name"`
	Description             string    `json:"description"`
	MaxConsecutiveUsage     int       `json:"max_consecutive_usage"`
	RotationThreshold       float64   `json:"rotation_threshold"`
	PreferredRotationOrder  []string  `json:"preferred_rotation_order"`
	AvoidanceWindow         time.Duration `json:"avoidance_window"`
	QualityThreshold        float64   `json:"quality_threshold"`
	Enabled                 bool      `json:"enabled"`
}

// UserRotationState tracks rotation state for individual users
type UserRotationState struct {
	UserID                  string                 `json:"user_id"`
	LastUsedProvider        string                 `json:"last_used_provider"`
	ConsecutiveUsageCount   int                    `json:"consecutive_usage_count"`
	ProviderUsageHistory    []ProviderUsageRecord  `json:"provider_usage_history"`
	RotationPreferences     *RotationPreferences   `json:"rotation_preferences"`
	LastRotationTime        time.Time              `json:"last_rotation_time"`
	RotationScore           float64                `json:"rotation_score"`
	AvoidedProviders        map[string]time.Time   `json:"avoided_providers"`
}

// ProviderUsageRecord records when and how a provider was used
type ProviderUsageRecord struct {
	ProviderName    string    `json:"provider_name"`
	UsedAt          time.Time `json:"used_at"`
	QueryType       string    `json:"query_type"`
	ResponseQuality float64   `json:"response_quality"`
	UserSatisfaction float64  `json:"user_satisfaction"`
	SessionID       string    `json:"session_id"`
}

// RotationPreferences defines user preferences for provider rotation
type RotationPreferences struct {
	PreferVariety           bool      `json:"prefer_variety"`
	PreferConsistency       bool      `json:"prefer_consistency"`
	MaxConsecutivePreference int      `json:"max_consecutive_preference"`
	PreferredProviders      []string  `json:"preferred_providers"`
	DislikedProviders       []string  `json:"disliked_providers"`
	RotationSensitivity     float64   `json:"rotation_sensitivity"` // 0.0-1.0
}

// GlobalRotationMetrics tracks system-wide rotation performance
type GlobalRotationMetrics struct {
	TotalRotations          int64                  `json:"total_rotations"`
	SuccessfulRotations     int64                  `json:"successful_rotations"`
	RotationEffectiveness   float64                `json:"rotation_effectiveness"`
	ProviderDistribution    map[string]int64       `json:"provider_distribution"`
	AverageRotationInterval float64                `json:"average_rotation_interval"`
	LastUpdated             time.Time              `json:"last_updated"`
}

// ProviderRotationRequest contains parameters for provider rotation decision
type ProviderRotationRequest struct {
	UserID              string                 `json:"user_id"`
	SessionID           string                 `json:"session_id"`
	QueryType           string                 `json:"query_type"`
	AvailableProviders  []string               `json:"available_providers"`
	CurrentProvider     string                 `json:"current_provider"`
	UserHistory         *UserProfile           `json:"user_history"`
	SessionContext      map[string]interface{} `json:"session_context"`
	ForceRotation       bool                   `json:"force_rotation"`
}

// ProviderRotationResponse contains the rotation decision and reasoning
type ProviderRotationResponse struct {
	ShouldRotate        bool                   `json:"should_rotate"`
	RecommendedProvider string                 `json:"recommended_provider"`
	RotationReason      string                 `json:"rotation_reason"`
	RotationStrategy    string                 `json:"rotation_strategy"`
	Confidence          float64                `json:"confidence"`
	AlternativeProviders []string              `json:"alternative_providers"`
	ProcessingTime      float64                `json:"processing_time"`
	Metadata            map[string]interface{} `json:"metadata"`
}

// NewProviderRotationEngine creates a new provider rotation engine
func NewProviderRotationEngine() *ProviderRotationEngine {
	engine := &ProviderRotationEngine{
		rotationStrategies:    make(map[string]*RotationStrategy),
		userRotationState:     make(map[string]*UserRotationState),
		globalRotationMetrics: &GlobalRotationMetrics{
			ProviderDistribution: make(map[string]int64),
			LastUpdated:          time.Now(),
		},
		enabled: true,
	}

	// Initialize default rotation strategies
	engine.initializeDefaultStrategies()

	return engine
}

// initializeDefaultStrategies sets up default rotation strategies
func (pre *ProviderRotationEngine) initializeDefaultStrategies() {
	// Strategy 1: Variety-focused rotation
	pre.rotationStrategies["variety"] = &RotationStrategy{
		Name:                   "variety",
		Description:            "Maximizes response variety by rotating providers frequently",
		MaxConsecutiveUsage:    2,
		RotationThreshold:      0.3,
		PreferredRotationOrder: []string{"enhanced", "simple", "groq", "groq-selly"},
		AvoidanceWindow:        5 * time.Minute,
		QualityThreshold:       0.6,
		Enabled:                true,
	}

	// Strategy 2: Quality-focused rotation
	pre.rotationStrategies["quality"] = &RotationStrategy{
		Name:                   "quality",
		Description:            "Prioritizes response quality over variety",
		MaxConsecutiveUsage:    5,
		RotationThreshold:      0.7,
		PreferredRotationOrder: []string{"groq-selly", "enhanced", "groq", "simple"},
		AvoidanceWindow:        10 * time.Minute,
		QualityThreshold:       0.8,
		Enabled:                true,
	}

	// Strategy 3: Balanced rotation
	pre.rotationStrategies["balanced"] = &RotationStrategy{
		Name:                   "balanced",
		Description:            "Balances variety and quality considerations",
		MaxConsecutiveUsage:    3,
		RotationThreshold:      0.5,
		PreferredRotationOrder: []string{"groq-selly", "enhanced", "simple", "groq"},
		AvoidanceWindow:        7 * time.Minute,
		QualityThreshold:       0.7,
		Enabled:                true,
	}

	// Strategy 4: Performance-focused rotation
	pre.rotationStrategies["performance"] = &RotationStrategy{
		Name:                   "performance",
		Description:            "Optimizes for response time and system performance",
		MaxConsecutiveUsage:    4,
		RotationThreshold:      0.4,
		PreferredRotationOrder: []string{"simple", "enhanced", "groq", "groq-selly"},
		AvoidanceWindow:        3 * time.Minute,
		QualityThreshold:       0.6,
		Enabled:                true,
	}

	logrus.Info("✅ Provider rotation strategies initialized")
}

// ShouldRotateProvider determines if provider rotation is needed
func (pre *ProviderRotationEngine) ShouldRotateProvider(ctx context.Context, req *ProviderRotationRequest) (*ProviderRotationResponse, error) {
	if !pre.enabled {
		return &ProviderRotationResponse{
			ShouldRotate:        false,
			RecommendedProvider: req.CurrentProvider,
			RotationReason:      "Provider rotation disabled",
			Confidence:          1.0,
		}, nil
	}

	startTime := time.Now()

	pre.mutex.Lock()
	defer pre.mutex.Unlock()

	logrus.WithFields(logrus.Fields{
		"user_id":             req.UserID,
		"session_id":          req.SessionID,
		"current_provider":    req.CurrentProvider,
		"available_providers": len(req.AvailableProviders),
		"query_type":          req.QueryType,
	}).Debug("Evaluating provider rotation")

	// Get user rotation state
	userState := pre.getUserRotationState(req.UserID)

	// Determine rotation strategy
	strategy := pre.selectRotationStrategy(req, userState)

	// Evaluate rotation need
	shouldRotate, reason := pre.evaluateRotationNeed(req, userState, strategy)

	// Select recommended provider
	recommendedProvider := req.CurrentProvider
	if shouldRotate {
		recommendedProvider = pre.selectRotatedProvider(req, userState, strategy)
	}

	// Update rotation state
	pre.updateRotationState(userState, req, recommendedProvider, shouldRotate)

	// Generate alternatives
	alternatives := pre.generateAlternativeProviders(req.AvailableProviders, recommendedProvider)

	processingTime := time.Since(startTime).Seconds() * 1000

	response := &ProviderRotationResponse{
		ShouldRotate:         shouldRotate,
		RecommendedProvider:  recommendedProvider,
		RotationReason:       reason,
		RotationStrategy:     strategy.Name,
		Confidence:           pre.calculateRotationConfidence(userState, strategy),
		AlternativeProviders: alternatives,
		ProcessingTime:       processingTime,
		Metadata: map[string]interface{}{
			"consecutive_usage":    userState.ConsecutiveUsageCount,
			"last_rotation_time":   userState.LastRotationTime,
			"rotation_score":       userState.RotationScore,
			"strategy_applied":     strategy.Name,
		},
	}

	logrus.WithFields(logrus.Fields{
		"user_id":              req.UserID,
		"should_rotate":        shouldRotate,
		"recommended_provider": recommendedProvider,
		"rotation_reason":      reason,
		"strategy":             strategy.Name,
		"confidence":           response.Confidence,
		"processing_time_ms":   processingTime,
	}).Info("Provider rotation evaluation completed")

	return response, nil
}

// IsEnabled returns whether provider rotation is enabled
func (pre *ProviderRotationEngine) IsEnabled() bool {
	pre.mutex.RLock()
	defer pre.mutex.RUnlock()
	return pre.enabled
}

// SetEnabled enables or disables provider rotation
func (pre *ProviderRotationEngine) SetEnabled(enabled bool) {
	pre.mutex.Lock()
	defer pre.mutex.Unlock()
	pre.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Provider rotation engine status updated")
}

// GetRotationMetrics returns rotation performance metrics
func (pre *ProviderRotationEngine) GetRotationMetrics() *GlobalRotationMetrics {
	pre.mutex.RLock()
	defer pre.mutex.RUnlock()
	return pre.globalRotationMetrics
}

// UpdateUserRotationPreferences updates user's rotation preferences
func (pre *ProviderRotationEngine) UpdateUserRotationPreferences(userID string, preferences *RotationPreferences) {
	pre.mutex.Lock()
	defer pre.mutex.Unlock()

	userState := pre.getUserRotationState(userID)
	userState.RotationPreferences = preferences

	logrus.WithFields(logrus.Fields{
		"user_id":              userID,
		"prefer_variety":       preferences.PreferVariety,
		"prefer_consistency":   preferences.PreferConsistency,
		"rotation_sensitivity": preferences.RotationSensitivity,
	}).Debug("User rotation preferences updated")
}

// getUserRotationState gets or creates user rotation state
func (pre *ProviderRotationEngine) getUserRotationState(userID string) *UserRotationState {
	if state, exists := pre.userRotationState[userID]; exists {
		return state
	}

	// Create new user rotation state
	state := &UserRotationState{
		UserID:                userID,
		LastUsedProvider:      "",
		ConsecutiveUsageCount: 0,
		ProviderUsageHistory:  []ProviderUsageRecord{},
		RotationPreferences: &RotationPreferences{
			PreferVariety:            true,
			PreferConsistency:        false,
			MaxConsecutivePreference: 3,
			PreferredProviders:       []string{},
			DislikedProviders:        []string{},
			RotationSensitivity:      0.5,
		},
		LastRotationTime: time.Now(),
		RotationScore:    0.5,
		AvoidedProviders: make(map[string]time.Time),
	}

	pre.userRotationState[userID] = state
	return state
}

// selectRotationStrategy selects the best rotation strategy for the request
func (pre *ProviderRotationEngine) selectRotationStrategy(req *ProviderRotationRequest, userState *UserRotationState) *RotationStrategy {
	// Default to balanced strategy
	defaultStrategy := pre.rotationStrategies["balanced"]

	// Select based on user preferences
	if userState.RotationPreferences != nil {
		if userState.RotationPreferences.PreferVariety {
			if strategy, exists := pre.rotationStrategies["variety"]; exists && strategy.Enabled {
				return strategy
			}
		}
		if userState.RotationPreferences.PreferConsistency {
			if strategy, exists := pre.rotationStrategies["quality"]; exists && strategy.Enabled {
				return strategy
			}
		}
	}

	// Select based on query type
	switch req.QueryType {
	case "greeting":
		if strategy, exists := pre.rotationStrategies["variety"]; exists && strategy.Enabled {
			return strategy
		}
	case "service":
		if strategy, exists := pre.rotationStrategies["quality"]; exists && strategy.Enabled {
			return strategy
		}
	case "factual":
		if strategy, exists := pre.rotationStrategies["quality"]; exists && strategy.Enabled {
			return strategy
		}
	default:
		if strategy, exists := pre.rotationStrategies["balanced"]; exists && strategy.Enabled {
			return strategy
		}
	}

	return defaultStrategy
}

// evaluateRotationNeed determines if rotation is needed
func (pre *ProviderRotationEngine) evaluateRotationNeed(req *ProviderRotationRequest, userState *UserRotationState, strategy *RotationStrategy) (bool, string) {
	// Force rotation if requested
	if req.ForceRotation {
		return true, "Forced rotation requested"
	}

	// Check consecutive usage limit
	if userState.LastUsedProvider == req.CurrentProvider {
		if userState.ConsecutiveUsageCount >= strategy.MaxConsecutiveUsage {
			return true, "Maximum consecutive usage reached"
		}
	}

	// Check rotation threshold based on user satisfaction
	if userState.RotationScore < strategy.RotationThreshold {
		return true, "User satisfaction below rotation threshold"
	}

	// Check avoidance window
	if avoidedTime, exists := userState.AvoidedProviders[req.CurrentProvider]; exists {
		if time.Since(avoidedTime) < strategy.AvoidanceWindow {
			return true, "Provider in avoidance window"
		}
	}

	// Check user preferences for variety
	if userState.RotationPreferences != nil && userState.RotationPreferences.PreferVariety {
		if userState.ConsecutiveUsageCount >= 2 {
			return true, "User prefers variety"
		}
	}

	// Random rotation for variety (small probability)
	if rand.Float64() < 0.1 { // 10% chance of random rotation
		return true, "Random rotation for variety"
	}

	return false, "No rotation needed"
}

// selectRotatedProvider selects the best provider for rotation
func (pre *ProviderRotationEngine) selectRotatedProvider(req *ProviderRotationRequest, userState *UserRotationState, strategy *RotationStrategy) string {
	availableProviders := make([]string, 0, len(req.AvailableProviders))

	// Filter out current provider and avoided providers
	for _, provider := range req.AvailableProviders {
		if provider == req.CurrentProvider {
			continue
		}

		// Check if provider is in avoidance window
		if avoidedTime, exists := userState.AvoidedProviders[provider]; exists {
			if time.Since(avoidedTime) < strategy.AvoidanceWindow {
				continue
			}
		}

		availableProviders = append(availableProviders, provider)
	}

	if len(availableProviders) == 0 {
		// No alternatives available, return current provider
		return req.CurrentProvider
	}

	// Select based on rotation order preference
	for _, preferredProvider := range strategy.PreferredRotationOrder {
		for _, available := range availableProviders {
			if available == preferredProvider {
				return available
			}
		}
	}

	// Select based on user preferences
	if userState.RotationPreferences != nil {
		for _, preferred := range userState.RotationPreferences.PreferredProviders {
			for _, available := range availableProviders {
				if available == preferred {
					return available
				}
			}
		}
	}

	// Select least recently used provider
	leastRecentProvider := pre.selectLeastRecentlyUsed(availableProviders, userState)
	if leastRecentProvider != "" {
		return leastRecentProvider
	}

	// Fallback to first available provider
	return availableProviders[0]
}

// selectLeastRecentlyUsed selects the provider that was used least recently
func (pre *ProviderRotationEngine) selectLeastRecentlyUsed(providers []string, userState *UserRotationState) string {
	if len(userState.ProviderUsageHistory) == 0 {
		return providers[0] // Return first if no history
	}

	// Create usage map
	lastUsed := make(map[string]time.Time)
	for _, record := range userState.ProviderUsageHistory {
		if lastUsed[record.ProviderName].Before(record.UsedAt) {
			lastUsed[record.ProviderName] = record.UsedAt
		}
	}

	// Find least recently used among available providers
	var leastRecentProvider string
	var oldestTime time.Time = time.Now()

	for _, provider := range providers {
		if usedTime, exists := lastUsed[provider]; exists {
			if usedTime.Before(oldestTime) {
				oldestTime = usedTime
				leastRecentProvider = provider
			}
		} else {
			// Never used provider gets highest priority
			return provider
		}
	}

	return leastRecentProvider
}

// updateRotationState updates user rotation state after provider selection
func (pre *ProviderRotationEngine) updateRotationState(userState *UserRotationState, req *ProviderRotationRequest, selectedProvider string, rotated bool) {
	// Update consecutive usage count
	if userState.LastUsedProvider == selectedProvider {
		userState.ConsecutiveUsageCount++
	} else {
		userState.ConsecutiveUsageCount = 1
	}

	// Update last used provider
	userState.LastUsedProvider = selectedProvider

	// Add to usage history
	record := ProviderUsageRecord{
		ProviderName:     selectedProvider,
		UsedAt:           time.Now(),
		QueryType:        req.QueryType,
		ResponseQuality:  0.8, // Default, will be updated later
		UserSatisfaction: 0.8, // Default, will be updated later
		SessionID:        req.SessionID,
	}
	userState.ProviderUsageHistory = append(userState.ProviderUsageHistory, record)

	// Keep only last 50 records
	if len(userState.ProviderUsageHistory) > 50 {
		userState.ProviderUsageHistory = userState.ProviderUsageHistory[1:]
	}

	// Update rotation time if rotated
	if rotated {
		userState.LastRotationTime = time.Now()
		pre.globalRotationMetrics.TotalRotations++
		if rotated {
			pre.globalRotationMetrics.SuccessfulRotations++
		}
	}

	// Update global metrics
	pre.globalRotationMetrics.ProviderDistribution[selectedProvider]++
	pre.globalRotationMetrics.LastUpdated = time.Now()
}

// calculateRotationConfidence calculates confidence in the rotation decision
func (pre *ProviderRotationEngine) calculateRotationConfidence(userState *UserRotationState, strategy *RotationStrategy) float64 {
	baseConfidence := 0.7

	// Increase confidence based on consecutive usage
	if userState.ConsecutiveUsageCount >= strategy.MaxConsecutiveUsage {
		baseConfidence += 0.2
	}

	// Increase confidence based on user preferences
	if userState.RotationPreferences != nil {
		if userState.RotationPreferences.PreferVariety && userState.ConsecutiveUsageCount >= 2 {
			baseConfidence += 0.1
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

// generateAlternativeProviders generates alternative provider suggestions
func (pre *ProviderRotationEngine) generateAlternativeProviders(availableProviders []string, selectedProvider string) []string {
	alternatives := make([]string, 0, len(availableProviders)-1)

	for _, provider := range availableProviders {
		if provider != selectedProvider {
			alternatives = append(alternatives, provider)
		}
	}

	// Limit to top 3 alternatives
	if len(alternatives) > 3 {
		alternatives = alternatives[:3]
	}

	return alternatives
}

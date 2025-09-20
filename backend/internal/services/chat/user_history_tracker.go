package chat

import (
	"context"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// UserHistoryTracker tracks comprehensive user interaction history for intelligent provider selection
type UserHistoryTracker struct {
	userProfiles    map[string]*UserProfile
	sessionProfiles map[string]*SessionProfile
	globalMetrics   *GlobalUserMetrics
	enabled         bool
	mutex           sync.RWMutex
}

// UserProfile represents comprehensive user interaction history
type UserProfile struct {
	UserID                string                    `json:"user_id"`
	CreatedAt             time.Time                 `json:"created_at"`
	LastUpdated           time.Time                 `json:"last_updated"`
	TotalInteractions     int64                     `json:"total_interactions"`
	
	// Provider preferences and history
	ProviderUsageHistory  map[string]*ProviderUsage `json:"provider_usage_history"`
	PreferredProviders    []string                  `json:"preferred_providers"`
	AvoidedProviders      []string                  `json:"avoided_providers"`
	
	// Response quality tracking
	ResponseSatisfaction  map[string]*SatisfactionMetrics `json:"response_satisfaction"`
	AverageResponseTime   map[string]float64        `json:"average_response_time"`
	
	// Query patterns and preferences
	QueryPatterns         *QueryPatternAnalysis     `json:"query_patterns"`
	CulturalPreferences   *CulturalPreferences      `json:"cultural_preferences"`
	
	// Behavioral insights
	SessionBehavior       *SessionBehaviorMetrics   `json:"session_behavior"`
	TimeBasedPatterns     *TimeBasedPatterns        `json:"time_based_patterns"`
	
	// Quality metrics
	UserSatisfactionScore float64                   `json:"user_satisfaction_score"`
	EngagementLevel       string                    `json:"engagement_level"` // "low", "medium", "high"
}

// ProviderUsage tracks usage statistics for a specific provider
type ProviderUsage struct {
	ProviderName        string    `json:"provider_name"`
	UsageCount          int64     `json:"usage_count"`
	LastUsed            time.Time `json:"last_used"`
	ConsecutiveUsage    int       `json:"consecutive_usage"`
	AverageResponseTime float64   `json:"average_response_time"`
	SuccessRate         float64   `json:"success_rate"`
	UserRating          float64   `json:"user_rating"`
}

// SatisfactionMetrics tracks user satisfaction with provider responses
type SatisfactionMetrics struct {
	ProviderName          string    `json:"provider_name"`
	TotalRatings          int64     `json:"total_ratings"`
	AverageRating         float64   `json:"average_rating"`
	PositiveResponses     int64     `json:"positive_responses"`
	NegativeResponses     int64     `json:"negative_responses"`
	LastRatingTime        time.Time `json:"last_rating_time"`
	ResponseQualityScore  float64   `json:"response_quality_score"`
}

// QueryPatternAnalysis analyzes user's query patterns
type QueryPatternAnalysis struct {
	CommonQueryTypes      map[string]int64  `json:"common_query_types"`
	PreferredLanguage     string            `json:"preferred_language"`
	ComplexityPreference  string            `json:"complexity_preference"` // "simple", "detailed", "comprehensive"
	TopicInterests        []string          `json:"topic_interests"`
	QueryLengthAverage    float64           `json:"query_length_average"`
	QuestionFrequency     float64           `json:"question_frequency"`
}

// CulturalPreferences tracks cultural and linguistic preferences
type CulturalPreferences struct {
	PreferredGreeting     string   `json:"preferred_greeting"`     // "islamic", "casual", "formal"
	LanguageStyle         string   `json:"language_style"`         // "formal", "casual", "mixed"
	CulturalContext       string   `json:"cultural_context"`       // "indonesian", "islamic", "general"
	ReligiousPreferences  []string `json:"religious_preferences"`
	RegionalPreferences   []string `json:"regional_preferences"`
}

// SessionBehaviorMetrics tracks behavior within sessions
type SessionBehaviorMetrics struct {
	AverageSessionLength  float64   `json:"average_session_length"`
	QueriesPerSession     float64   `json:"queries_per_session"`
	SessionFrequency      float64   `json:"session_frequency"`
	PreferredSessionTime  string    `json:"preferred_session_time"`
	SessionEndPatterns    []string  `json:"session_end_patterns"`
}

// TimeBasedPatterns tracks time-based usage patterns
type TimeBasedPatterns struct {
	PeakUsageHours        []int     `json:"peak_usage_hours"`
	WeekdayPreferences    []string  `json:"weekday_preferences"`
	SeasonalPatterns      []string  `json:"seasonal_patterns"`
	ResponseTimeExpectation float64 `json:"response_time_expectation"`
}

// SessionProfile represents current session-specific data
type SessionProfile struct {
	SessionID             string                 `json:"session_id"`
	UserID                string                 `json:"user_id"`
	StartTime             time.Time              `json:"start_time"`
	LastActivity          time.Time              `json:"last_activity"`
	QueryCount            int                    `json:"query_count"`
	ProvidersUsed         map[string]int         `json:"providers_used"`
	CurrentMood           string                 `json:"current_mood"`
	ConversationContext   []string               `json:"conversation_context"`
	SessionQuality        float64                `json:"session_quality"`
	UserEngagement        string                 `json:"user_engagement"`
}

// GlobalUserMetrics tracks system-wide user behavior metrics
type GlobalUserMetrics struct {
	TotalUsers            int64                  `json:"total_users"`
	ActiveUsers           int64                  `json:"active_users"`
	ProviderPopularity    map[string]int64       `json:"provider_popularity"`
	AverageSessionLength  float64                `json:"average_session_length"`
	GlobalSatisfaction    float64                `json:"global_satisfaction"`
	LastUpdated           time.Time              `json:"last_updated"`
}

// UserHistoryUpdate represents an update to user history
type UserHistoryUpdate struct {
	UserID              string                 `json:"user_id"`
	SessionID           string                 `json:"session_id"`
	ProviderUsed        string                 `json:"provider_used"`
	QueryType           string                 `json:"query_type"`
	ResponseTime        float64                `json:"response_time"`
	ResponseQuality     float64                `json:"response_quality"`
	UserSatisfaction    float64                `json:"user_satisfaction"`
	CulturalContext     string                 `json:"cultural_context"`
	Timestamp           time.Time              `json:"timestamp"`
	AdditionalMetadata  map[string]interface{} `json:"additional_metadata"`
}

// NewUserHistoryTracker creates a new user history tracker
func NewUserHistoryTracker() *UserHistoryTracker {
	return &UserHistoryTracker{
		userProfiles:    make(map[string]*UserProfile),
		sessionProfiles: make(map[string]*SessionProfile),
		globalMetrics: &GlobalUserMetrics{
			ProviderPopularity: make(map[string]int64),
			LastUpdated:        time.Now(),
		},
		enabled: true,
	}
}

// TrackUserInteraction tracks a user interaction and updates history
func (uht *UserHistoryTracker) TrackUserInteraction(ctx context.Context, update *UserHistoryUpdate) error {
	if !uht.enabled {
		return nil
	}

	uht.mutex.Lock()
	defer uht.mutex.Unlock()

	// Get or create user profile
	profile := uht.getUserProfile(update.UserID)
	
	// Update user profile
	uht.updateUserProfile(profile, update)
	
	// Update session profile
	uht.updateSessionProfile(update)
	
	// Update global metrics
	uht.updateGlobalMetrics(update)

	logrus.WithFields(logrus.Fields{
		"user_id":           update.UserID,
		"session_id":        update.SessionID,
		"provider_used":     update.ProviderUsed,
		"query_type":        update.QueryType,
		"response_time":     update.ResponseTime,
		"user_satisfaction": update.UserSatisfaction,
	}).Debug("User interaction tracked successfully")

	return nil
}

// GetUserProfile retrieves user profile for provider selection
func (uht *UserHistoryTracker) GetUserProfile(userID string) *UserProfile {
	uht.mutex.RLock()
	defer uht.mutex.RUnlock()
	
	return uht.getUserProfile(userID)
}

// GetSessionProfile retrieves session profile
func (uht *UserHistoryTracker) GetSessionProfile(sessionID string) *SessionProfile {
	uht.mutex.RLock()
	defer uht.mutex.RUnlock()
	
	if profile, exists := uht.sessionProfiles[sessionID]; exists {
		return profile
	}
	return nil
}

// GetProviderRecommendations returns recommended providers for a user
func (uht *UserHistoryTracker) GetProviderRecommendations(userID string, queryType string, availableProviders []string) []string {
	uht.mutex.RLock()
	defer uht.mutex.RUnlock()

	profile := uht.getUserProfile(userID)
	if profile == nil {
		return availableProviders // Return all if no history
	}

	// Score providers based on user history
	providerScores := make(map[string]float64)
	
	for _, provider := range availableProviders {
		score := uht.calculateProviderScore(profile, provider, queryType)
		providerScores[provider] = score
	}

	// Sort providers by score
	recommendations := uht.sortProvidersByScore(providerScores)
	
	logrus.WithFields(logrus.Fields{
		"user_id":              userID,
		"query_type":           queryType,
		"available_providers":  len(availableProviders),
		"recommendations":      len(recommendations),
		"top_recommendation":   recommendations[0],
	}).Debug("Provider recommendations generated")

	return recommendations
}

// IsEnabled returns whether user history tracking is enabled
func (uht *UserHistoryTracker) IsEnabled() bool {
	uht.mutex.RLock()
	defer uht.mutex.RUnlock()
	return uht.enabled
}

// SetEnabled enables or disables user history tracking
func (uht *UserHistoryTracker) SetEnabled(enabled bool) {
	uht.mutex.Lock()
	defer uht.mutex.Unlock()
	uht.enabled = enabled
	logrus.WithField("enabled", enabled).Info("User history tracking status updated")
}

// getUserProfile gets or creates a user profile
func (uht *UserHistoryTracker) getUserProfile(userID string) *UserProfile {
	if profile, exists := uht.userProfiles[userID]; exists {
		return profile
	}

	// Create new user profile
	profile := &UserProfile{
		UserID:               userID,
		CreatedAt:            time.Now(),
		LastUpdated:          time.Now(),
		TotalInteractions:    0,
		ProviderUsageHistory: make(map[string]*ProviderUsage),
		PreferredProviders:   []string{},
		AvoidedProviders:     []string{},
		ResponseSatisfaction: make(map[string]*SatisfactionMetrics),
		AverageResponseTime:  make(map[string]float64),
		QueryPatterns: &QueryPatternAnalysis{
			CommonQueryTypes: make(map[string]int64),
			TopicInterests:   []string{},
		},
		CulturalPreferences: &CulturalPreferences{
			PreferredGreeting:    "casual",
			LanguageStyle:        "casual",
			CulturalContext:      "indonesian",
			ReligiousPreferences: []string{},
			RegionalPreferences:  []string{},
		},
		SessionBehavior: &SessionBehaviorMetrics{},
		TimeBasedPatterns: &TimeBasedPatterns{
			PeakUsageHours:     []int{},
			WeekdayPreferences: []string{},
			SeasonalPatterns:   []string{},
		},
		UserSatisfactionScore: 0.8, // Default satisfaction
		EngagementLevel:       "medium",
	}

	uht.userProfiles[userID] = profile
	return profile
}

// updateUserProfile updates user profile with new interaction data
func (uht *UserHistoryTracker) updateUserProfile(profile *UserProfile, update *UserHistoryUpdate) {
	profile.LastUpdated = time.Now()
	profile.TotalInteractions++

	// Update provider usage
	if usage, exists := profile.ProviderUsageHistory[update.ProviderUsed]; exists {
		usage.UsageCount++
		usage.LastUsed = update.Timestamp
		usage.AverageResponseTime = (usage.AverageResponseTime + update.ResponseTime) / 2

		// Update success rate based on response quality
		if update.ResponseQuality >= 0.7 {
			usage.SuccessRate = (usage.SuccessRate + 1.0) / 2
		} else {
			usage.SuccessRate = (usage.SuccessRate + 0.0) / 2
		}
	} else {
		profile.ProviderUsageHistory[update.ProviderUsed] = &ProviderUsage{
			ProviderName:        update.ProviderUsed,
			UsageCount:          1,
			LastUsed:            update.Timestamp,
			ConsecutiveUsage:    1,
			AverageResponseTime: update.ResponseTime,
			SuccessRate:         1.0,
			UserRating:          update.UserSatisfaction,
		}
	}

	// Update satisfaction metrics
	if satisfaction, exists := profile.ResponseSatisfaction[update.ProviderUsed]; exists {
		satisfaction.TotalRatings++
		satisfaction.AverageRating = (satisfaction.AverageRating + update.UserSatisfaction) / 2
		satisfaction.LastRatingTime = update.Timestamp
		satisfaction.ResponseQualityScore = (satisfaction.ResponseQualityScore + update.ResponseQuality) / 2

		if update.UserSatisfaction >= 0.7 {
			satisfaction.PositiveResponses++
		} else {
			satisfaction.NegativeResponses++
		}
	} else {
		profile.ResponseSatisfaction[update.ProviderUsed] = &SatisfactionMetrics{
			ProviderName:         update.ProviderUsed,
			TotalRatings:         1,
			AverageRating:        update.UserSatisfaction,
			PositiveResponses:    1,
			NegativeResponses:    0,
			LastRatingTime:       update.Timestamp,
			ResponseQualityScore: update.ResponseQuality,
		}
	}

	// Update query patterns
	profile.QueryPatterns.CommonQueryTypes[update.QueryType]++

	// Update cultural preferences based on context
	if update.CulturalContext != "" {
		profile.CulturalPreferences.CulturalContext = update.CulturalContext
	}

	// Update overall satisfaction score
	profile.UserSatisfactionScore = (profile.UserSatisfactionScore + update.UserSatisfaction) / 2
}

// updateSessionProfile updates session profile
func (uht *UserHistoryTracker) updateSessionProfile(update *UserHistoryUpdate) {
	if session, exists := uht.sessionProfiles[update.SessionID]; exists {
		session.LastActivity = update.Timestamp
		session.QueryCount++
		session.ProvidersUsed[update.ProviderUsed]++
		session.SessionQuality = (session.SessionQuality + update.ResponseQuality) / 2
	} else {
		uht.sessionProfiles[update.SessionID] = &SessionProfile{
			SessionID:           update.SessionID,
			UserID:              update.UserID,
			StartTime:           update.Timestamp,
			LastActivity:        update.Timestamp,
			QueryCount:          1,
			ProvidersUsed:       map[string]int{update.ProviderUsed: 1},
			CurrentMood:         "neutral",
			ConversationContext: []string{},
			SessionQuality:      update.ResponseQuality,
			UserEngagement:      "active",
		}
	}
}

// updateGlobalMetrics updates global system metrics
func (uht *UserHistoryTracker) updateGlobalMetrics(update *UserHistoryUpdate) {
	uht.globalMetrics.ProviderPopularity[update.ProviderUsed]++
	uht.globalMetrics.GlobalSatisfaction = (uht.globalMetrics.GlobalSatisfaction + update.UserSatisfaction) / 2
	uht.globalMetrics.LastUpdated = time.Now()

	// Update active users count
	uht.globalMetrics.TotalUsers = int64(len(uht.userProfiles))

	// Count active users (interacted in last 24 hours)
	activeCount := int64(0)
	cutoff := time.Now().Add(-24 * time.Hour)
	for _, profile := range uht.userProfiles {
		if profile.LastUpdated.After(cutoff) {
			activeCount++
		}
	}
	uht.globalMetrics.ActiveUsers = activeCount
}

// calculateProviderScore calculates a score for a provider based on user history
func (uht *UserHistoryTracker) calculateProviderScore(profile *UserProfile, provider string, queryType string) float64 {
	baseScore := 0.5 // Base score for unknown providers

	// Factor 1: Usage history (30% weight)
	if usage, exists := profile.ProviderUsageHistory[provider]; exists {
		usageScore := float64(usage.UsageCount) / float64(profile.TotalInteractions)
		if usageScore > 1.0 {
			usageScore = 1.0
		}
		baseScore += usageScore * 0.3
	}

	// Factor 2: Satisfaction score (40% weight)
	if satisfaction, exists := profile.ResponseSatisfaction[provider]; exists {
		baseScore += satisfaction.AverageRating * 0.4
	}

	// Factor 3: Response time performance (20% weight)
	if responseTime, exists := profile.AverageResponseTime[provider]; exists {
		// Lower response time = higher score
		timeScore := 1.0 - (responseTime / 1000.0) // Normalize to seconds
		if timeScore < 0 {
			timeScore = 0
		}
		baseScore += timeScore * 0.2
	}

	// Factor 4: Query type compatibility (10% weight)
	if queryTypeCount, exists := profile.QueryPatterns.CommonQueryTypes[queryType]; exists {
		typeScore := float64(queryTypeCount) / float64(profile.TotalInteractions)
		if typeScore > 1.0 {
			typeScore = 1.0
		}
		baseScore += typeScore * 0.1
	}

	// Ensure score is within bounds
	if baseScore > 1.0 {
		baseScore = 1.0
	}
	if baseScore < 0.0 {
		baseScore = 0.0
	}

	return baseScore
}

// sortProvidersByScore sorts providers by their calculated scores
func (uht *UserHistoryTracker) sortProvidersByScore(providerScores map[string]float64) []string {
	type providerScore struct {
		provider string
		score    float64
	}

	scores := make([]providerScore, 0, len(providerScores))
	for provider, score := range providerScores {
		scores = append(scores, providerScore{provider: provider, score: score})
	}

	// Sort by score (descending)
	for i := 0; i < len(scores)-1; i++ {
		for j := i + 1; j < len(scores); j++ {
			if scores[i].score < scores[j].score {
				scores[i], scores[j] = scores[j], scores[i]
			}
		}
	}

	result := make([]string, len(scores))
	for i, ps := range scores {
		result[i] = ps.provider
	}

	return result
}

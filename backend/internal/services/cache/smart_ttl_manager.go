package cache

import (
	"context"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// SmartTTLConfig holds configuration for intelligent TTL management
type SmartTTLConfig struct {
	// Base TTL settings
	BaseTimeToLive int `json:"base_time_to_live"` // Base TTL in seconds
	MinTTL         int `json:"min_ttl"`           // Minimum TTL in seconds
	MaxTTL         int `json:"max_ttl"`           // Maximum TTL in seconds

	// Multiplier factors
	ConfidenceMultiplier      float64 `json:"confidence_multiplier"` // Higher confidence = longer TTL
	ComplexityMultiplier      float64 `json:"complexity_multiplier"` // Complex queries = longer TTL
	DataFreshnessMultiplier   float64 `json:"freshness_multiplier"`  // Fresh data = shorter TTL
	QueryPatternMultiplier    float64 `json:"pattern_multiplier"`    // Common patterns = longer TTL
	AccessFrequencyMultiplier float64 `json:"access_multiplier"`     // Frequent access = longer TTL
	TimeOfDayMultiplier       float64 `json:"time_multiplier"`       // Peak hours = longer TTL
	UserBehaviorMultiplier    float64 `json:"user_multiplier"`       // User-specific optimization

	// Advanced settings
	LearningRate           float64 `json:"learning_rate"`            // How fast to adapt to patterns
	HistoryWindow          int     `json:"history_window"`           // Hours to keep access history
	MinSamplesForLearning  int     `json:"min_samples"`              // Minimum samples before learning
	EnableUserBehavior     bool    `json:"enable_user_behavior"`     // Enable user behavior analysis
	EnableTimeOptimization bool    `json:"enable_time_optimization"` // Enable time-of-day optimization
}

// DefaultSmartTTLConfig returns sensible defaults for SmartTTL configuration
func DefaultSmartTTLConfig() *SmartTTLConfig {
	return &SmartTTLConfig{
		BaseTimeToLive:            300,  // 5 minutes
		MinTTL:                    60,   // 1 minute
		MaxTTL:                    3600, // 1 hour
		ConfidenceMultiplier:      0.5,  // ±50% based on confidence
		ComplexityMultiplier:      0.3,  // ±30% based on complexity
		DataFreshnessMultiplier:   0.2,  // ±20% based on freshness
		QueryPatternMultiplier:    0.4,  // ±40% based on pattern frequency
		AccessFrequencyMultiplier: 0.6,  // ±60% based on access frequency
		TimeOfDayMultiplier:       0.3,  // ±30% based on time of day
		UserBehaviorMultiplier:    0.2,  // ±20% based on user behavior
		LearningRate:              0.1,  // Conservative learning
		HistoryWindow:             24,   // 24 hours
		MinSamplesForLearning:     10,   // Need at least 10 samples
		EnableUserBehavior:        true,
		EnableTimeOptimization:    true,
	}
}

// CacheMetadata holds metadata about cached items for intelligent TTL calculation
type CacheMetadata struct {
	Key         string        `json:"key"`
	Query       string        `json:"query"`
	UserID      string        `json:"user_id,omitempty"`
	Confidence  float64       `json:"confidence"` // 0.0 to 1.0
	Complexity  string        `json:"complexity"` // "low", "medium", "high"
	DataAge     time.Duration `json:"data_age"`   // How old is the underlying data
	AccessCount int64         `json:"access_count"`
	LastAccess  time.Time     `json:"last_access"`
	CreatedAt   time.Time     `json:"created_at"`
	Tags        []string      `json:"tags,omitempty"`
}

// AccessPattern represents access pattern data for learning
type AccessPattern struct {
	Key             string          `json:"key"`
	Query           string          `json:"query"`
	UserID          string          `json:"user_id,omitempty"`
	AccessCount     int64           `json:"access_count"`
	FirstAccess     time.Time       `json:"first_access"`
	LastAccess      time.Time       `json:"last_access"`
	AverageInterval time.Duration   `json:"avg_interval"`
	PeakHour        int             `json:"peak_hour"`       // 0-23 hour of day
	WeekdayPattern  []float64       `json:"weekday_pattern"` // Access pattern by day
	TTLPerformance  []time.Duration `json:"ttl_performance"` // Historical TTL effectiveness
}

// QueryComplexity represents the complexity analysis of a query
type QueryComplexity struct {
	Level           string  `json:"level"`            // "low", "medium", "high"
	Score           float64 `json:"score"`            // 0.0 to 1.0
	Keywords        int     `json:"keywords"`         // Number of significant keywords
	Length          int     `json:"length"`           // Query length
	HasJoins        bool    `json:"has_joins"`        // Complex operations
	HasFilters      bool    `json:"has_filters"`      // Filtering complexity
	HasAggregations bool    `json:"has_aggregations"` // Aggregation complexity
}

// UserBehaviorProfile represents user-specific caching behavior
type UserBehaviorProfile struct {
	UserID                 string        `json:"user_id"`
	SessionCount           int64         `json:"session_count"`
	AverageSessionDuration time.Duration `json:"avg_session_duration"`
	PreferredTimeSlots     []int         `json:"preferred_time_slots"` // Hours when user is most active
	CacheHitRate           float64       `json:"cache_hit_rate"`
	CommonQueries          []string      `json:"common_queries"`
	LastUpdated            time.Time     `json:"last_updated"`
}

// SmartTTLManager provides intelligent TTL management for cache entries
type SmartTTLManager struct {
	config            *SmartTTLConfig
	accessPatterns    map[string]*AccessPattern
	userProfiles      map[string]*UserBehaviorProfile
	queryComplexities map[string]*QueryComplexity
	mu                sync.RWMutex
	patternMu         sync.RWMutex
	userMu            sync.RWMutex
	complexityMu      sync.RWMutex
}

// NewSmartTTLManager creates a new intelligent TTL manager
func NewSmartTTLManager(config *SmartTTLConfig) *SmartTTLManager {
	if config == nil {
		config = DefaultSmartTTLConfig()
	}

	return &SmartTTLManager{
		config:            config,
		accessPatterns:    make(map[string]*AccessPattern),
		userProfiles:      make(map[string]*UserBehaviorProfile),
		queryComplexities: make(map[string]*QueryComplexity),
	}
}

// CalculateOptimalTTL calculates the optimal TTL for a cache entry using multiple factors
func (stm *SmartTTLManager) CalculateOptimalTTL(
	ctx context.Context,
	key string,
	metadata *CacheMetadata,
) time.Duration {
	startTime := time.Now()
	defer func() {
		duration := time.Since(startTime)
		logrus.WithFields(logrus.Fields{
			"key":          key,
			"duration":     duration,
			"optimization": "smart_ttl",
		}).Debug("Smart TTL calculation completed")
	}()

	// Start with base TTL
	baseTTL := time.Duration(stm.config.BaseTimeToLive) * time.Second
	finalMultiplier := 1.0

	// Factor 1: Confidence-based adjustment
	if metadata.Confidence > 0 {
		confidenceFactor := stm.calculateConfidenceFactor(metadata.Confidence)
		finalMultiplier *= confidenceFactor
		logrus.WithField("confidence_factor", confidenceFactor).Debug("Applied confidence factor")
	}

	// Factor 2: Query complexity adjustment
	if metadata.Complexity != "" {
		complexityFactor := stm.calculateComplexityFactor(metadata.Complexity)
		finalMultiplier *= complexityFactor
		logrus.WithField("complexity_factor", complexityFactor).Debug("Applied complexity factor")
	}

	// Factor 3: Data freshness factor
	if metadata.DataAge > 0 {
		freshnessFactor := stm.calculateDataFreshnessFactor(metadata.DataAge)
		finalMultiplier *= freshnessFactor
		logrus.WithField("freshness_factor", freshnessFactor).Debug("Applied freshness factor")
	}

	// Factor 4: Query pattern frequency
	if metadata.Query != "" {
		patternFactor := stm.calculateQueryPatternFactor(metadata.Query)
		finalMultiplier *= patternFactor
		logrus.WithField("pattern_factor", patternFactor).Debug("Applied pattern factor")
	}

	// Factor 5: Access frequency factor
	accessFactor := stm.calculateAccessFrequencyFactor(key)
	finalMultiplier *= accessFactor
	logrus.WithField("access_factor", accessFactor).Debug("Applied access factor")

	// Factor 6: Time of day optimization
	if stm.config.EnableTimeOptimization {
		timeFactor := stm.calculateTimeOfDayFactor()
		finalMultiplier *= timeFactor
		logrus.WithField("time_factor", timeFactor).Debug("Applied time factor")
	}

	// Factor 7: User behavior optimization
	if stm.config.EnableUserBehavior && metadata.UserID != "" {
		userFactor := stm.calculateUserBehaviorFactor(metadata.UserID)
		finalMultiplier *= userFactor
		logrus.WithField("user_factor", userFactor).Debug("Applied user factor")
	}

	// Calculate final TTL
	finalTTL := time.Duration(float64(baseTTL) * finalMultiplier)

	// Apply bounds
	if finalTTL < time.Duration(stm.config.MinTTL)*time.Second {
		finalTTL = time.Duration(stm.config.MinTTL) * time.Second
	}
	if finalTTL > time.Duration(stm.config.MaxTTL)*time.Second {
		finalTTL = time.Duration(stm.config.MaxTTL) * time.Second
	}

	// Record access pattern for learning
	stm.recordAccessPattern(key, metadata)

	logrus.WithFields(logrus.Fields{
		"key":        key,
		"base_ttl":   baseTTL,
		"final_ttl":  finalTTL,
		"multiplier": finalMultiplier,
	}).Info("Calculated optimal TTL")

	return finalTTL
}

// calculateConfidenceFactor calculates TTL multiplier based on confidence score
func (stm *SmartTTLManager) calculateConfidenceFactor(confidence float64) float64 {
	// Linear interpolation: 0.5 confidence = 1.0 multiplier, 1.0 = 1.5, 0.0 = 0.5
	baseMultiplier := 1.0
	adjustment := (confidence - 0.5) * stm.config.ConfidenceMultiplier
	return baseMultiplier + adjustment
}

// calculateComplexityFactor calculates TTL multiplier based on query complexity
func (stm *SmartTTLManager) calculateComplexityFactor(complexity string) float64 {
	stm.complexityMu.RLock()
	defer stm.complexityMu.RUnlock()

	baseMultiplier := 1.0

	switch complexity {
	case "low":
		return baseMultiplier - (stm.config.ComplexityMultiplier * 0.5) // Shorter TTL for simple queries
	case "high":
		return baseMultiplier + (stm.config.ComplexityMultiplier * 0.5) // Longer TTL for complex queries
	case "medium":
		return baseMultiplier // No change for medium complexity
	default:
		return baseMultiplier
	}
}

// calculateDataFreshnessFactor calculates TTL multiplier based on data age
func (stm *SmartTTLManager) calculateDataFreshnessFactor(dataAge time.Duration) float64 {
	// Fresher data gets longer TTL, older data gets shorter TTL
	hoursOld := dataAge.Hours()

	if hoursOld < 1 {
		return 1.0 + (stm.config.DataFreshnessMultiplier * 0.5) // Very fresh, longer TTL
	} else if hoursOld < 24 {
		return 1.0 // Moderately fresh, normal TTL
	} else {
		return 1.0 - (stm.config.DataFreshnessMultiplier * 0.5) // Old data, shorter TTL
	}
}

// calculateQueryPatternFactor calculates TTL multiplier based on query pattern frequency
func (stm *SmartTTLManager) calculateQueryPatternFactor(query string) float64 {
	stm.patternMu.RLock()
	defer stm.patternMu.RUnlock()

	// Look for similar patterns in access history
	patternKey := stm.generatePatternKey(query)
	if pattern, exists := stm.accessPatterns[patternKey]; exists && pattern.AccessCount > int64(stm.config.MinSamplesForLearning) {
		// Frequent patterns get longer TTL
		frequencyScore := math.Min(float64(pattern.AccessCount)/100.0, 1.0)
		return 1.0 + (frequencyScore * stm.config.QueryPatternMultiplier)
	}

	return 1.0 // No pattern found, use base multiplier
}

// calculateAccessFrequencyFactor calculates TTL multiplier based on access frequency
func (stm *SmartTTLManager) calculateAccessFrequencyFactor(key string) float64 {
	stm.patternMu.RLock()
	defer stm.patternMu.RUnlock()

	if pattern, exists := stm.accessPatterns[key]; exists && pattern.AccessCount > int64(stm.config.MinSamplesForLearning) {
		// Calculate access frequency (accesses per hour)
		hoursSinceFirstAccess := time.Since(pattern.FirstAccess).Hours()
		if hoursSinceFirstAccess > 0 {
			frequency := float64(pattern.AccessCount) / hoursSinceFirstAccess

			// High frequency = longer TTL, low frequency = shorter TTL
			if frequency > 10 { // More than 10 accesses per hour
				return 1.0 + (stm.config.AccessFrequencyMultiplier * 0.5)
			} else if frequency < 1 { // Less than 1 access per hour
				return 1.0 - (stm.config.AccessFrequencyMultiplier * 0.5)
			}
		}
	}

	return 1.0
}

// calculateTimeOfDayFactor calculates TTL multiplier based on time of day
func (stm *SmartTTLManager) calculateTimeOfDayFactor() float64 {
	now := time.Now()
	hour := now.Hour()

	// Business hours (9 AM - 6 PM) get longer TTL
	if hour >= 9 && hour <= 18 {
		return 1.0 + (stm.config.TimeOfDayMultiplier * 0.3)
	}

	// Early morning/late night get shorter TTL
	if hour >= 22 || hour <= 6 {
		return 1.0 - (stm.config.TimeOfDayMultiplier * 0.3)
	}

	return 1.0 // Normal hours
}

// calculateUserBehaviorFactor calculates TTL multiplier based on user behavior
func (stm *SmartTTLManager) calculateUserBehaviorFactor(userID string) float64 {
	stm.userMu.RLock()
	defer stm.userMu.RUnlock()

	if profile, exists := stm.userProfiles[userID]; exists {
		now := time.Now()
		currentHour := now.Hour()

		// Check if current time is in user's preferred time slots
		for _, preferredHour := range profile.PreferredTimeSlots {
			if preferredHour == currentHour {
				return 1.0 + (stm.config.UserBehaviorMultiplier * 0.5)
			}
		}

		// High cache hit rate users get longer TTL
		if profile.CacheHitRate > 0.8 {
			return 1.0 + (stm.config.UserBehaviorMultiplier * 0.3)
		}
	}

	return 1.0
}

// recordAccessPattern records access patterns for learning
func (stm *SmartTTLManager) recordAccessPattern(key string, metadata *CacheMetadata) {
	stm.patternMu.Lock()
	defer stm.patternMu.Unlock()

	now := time.Now()
	pattern, exists := stm.accessPatterns[key]

	if !exists {
		stm.accessPatterns[key] = &AccessPattern{
			Key:            key,
			Query:          metadata.Query,
			UserID:         metadata.UserID,
			AccessCount:    1,
			FirstAccess:    now,
			LastAccess:     now,
			PeakHour:       now.Hour(),
			WeekdayPattern: make([]float64, 7),
			TTLPerformance: make([]time.Duration, 0),
		}
	} else {
		// Update existing pattern
		pattern.AccessCount++
		pattern.LastAccess = now

		// Update average interval
		if pattern.AccessCount > 1 {
			totalDuration := pattern.LastAccess.Sub(pattern.FirstAccess)
			pattern.AverageInterval = totalDuration / time.Duration(pattern.AccessCount-1)
		}

		// Update weekday pattern
		weekday := int(now.Weekday())
		if weekday < len(pattern.WeekdayPattern) {
			pattern.WeekdayPattern[weekday] += 1.0
		}
	}

	// Update user profile if user ID is provided
	if metadata.UserID != "" {
		stm.updateUserProfile(metadata.UserID, key, metadata.Query, now)
	}
}

// updateUserProfile updates user behavior profile
func (stm *SmartTTLManager) updateUserProfile(userID, key, query string, accessTime time.Time) {
	stm.userMu.Lock()
	defer stm.userMu.Unlock()

	profile, exists := stm.userProfiles[userID]
	if !exists {
		stm.userProfiles[userID] = &UserBehaviorProfile{
			UserID:             userID,
			SessionCount:       1,
			PreferredTimeSlots: []int{accessTime.Hour()},
			CacheHitRate:       0.0, // Will be updated separately
			CommonQueries:      []string{query},
			LastUpdated:        accessTime,
		}
	} else {
		// Update existing profile
		profile.LastUpdated = accessTime

		// Add preferred time slot if not already present
		hour := accessTime.Hour()
		found := false
		for _, slot := range profile.PreferredTimeSlots {
			if slot == hour {
				found = true
				break
			}
		}
		if !found && len(profile.PreferredTimeSlots) < 5 { // Limit to 5 preferred slots
			profile.PreferredTimeSlots = append(profile.PreferredTimeSlots, hour)
		}

		// Add to common queries if not already present
		found = false
		for _, commonQuery := range profile.CommonQueries {
			if commonQuery == query {
				found = true
				break
			}
		}
		if !found && len(profile.CommonQueries) < 10 { // Limit to 10 common queries
			profile.CommonQueries = append(profile.CommonQueries, query)
		}
	}
}

// AnalyzeQueryComplexity analyzes the complexity of a query
func (stm *SmartTTLManager) AnalyzeQueryComplexity(query string) *QueryComplexity {
	stm.complexityMu.Lock()
	defer stm.complexityMu.Unlock()

	// Generate complexity key
	complexityKey := stm.generateComplexityKey(query)

	// Check if already analyzed
	if complexity, exists := stm.queryComplexities[complexityKey]; exists {
		return complexity
	}

	// Analyze query
	complexity := &QueryComplexity{
		Keywords:        stm.countKeywords(query),
		Length:          len(query),
		HasJoins:        stm.detectJoins(query),
		HasFilters:      stm.detectFilters(query),
		HasAggregations: stm.detectAggregations(query),
	}

	// Calculate complexity score and level
	score := stm.calculateComplexityScore(complexity)
	complexity.Score = score

	if score < 0.3 {
		complexity.Level = "low"
	} else if score < 0.7 {
		complexity.Level = "medium"
	} else {
		complexity.Level = "high"
	}

	// Cache the analysis
	stm.queryComplexities[complexityKey] = complexity

	return complexity
}

// Helper methods for complexity analysis
func (stm *SmartTTLManager) countKeywords(query string) int {
	words := strings.Fields(strings.ToLower(query))
	keywords := 0

	// Common keywords that indicate complexity
	keywordList := []string{
		"select", "from", "where", "join", "group", "order", "having",
		"union", "intersect", "except", "limit", "offset",
	}

	for _, word := range words {
		for _, keyword := range keywordList {
			if strings.Contains(word, keyword) {
				keywords++
				break
			}
		}
	}

	return keywords
}

func (stm *SmartTTLManager) detectJoins(query string) bool {
	joinKeywords := []string{"join", "inner", "left", "right", "outer", "cross"}
	queryLower := strings.ToLower(query)

	for _, keyword := range joinKeywords {
		if strings.Contains(queryLower, keyword) {
			return true
		}
	}
	return false
}

func (stm *SmartTTLManager) detectFilters(query string) bool {
	filterKeywords := []string{"where", "having", "like", "in", "between", "exists"}
	queryLower := strings.ToLower(query)

	for _, keyword := range filterKeywords {
		if strings.Contains(queryLower, keyword) {
			return true
		}
	}
	return false
}

func (stm *SmartTTLManager) detectAggregations(query string) bool {
	aggKeywords := []string{"count", "sum", "avg", "min", "max", "group by"}
	queryLower := strings.ToLower(query)

	for _, keyword := range aggKeywords {
		if strings.Contains(queryLower, keyword) {
			return true
		}
	}
	return false
}

func (stm *SmartTTLManager) calculateComplexityScore(complexity *QueryComplexity) float64 {
	score := 0.0

	// Length factor (0-0.2)
	if complexity.Length > 100 {
		score += 0.2
	} else if complexity.Length > 50 {
		score += 0.1
	}

	// Keywords factor (0-0.3)
	if complexity.Keywords > 5 {
		score += 0.3
	} else if complexity.Keywords > 2 {
		score += 0.15
	}

	// Joins factor (0-0.2)
	if complexity.HasJoins {
		score += 0.2
	}

	// Filters factor (0-0.15)
	if complexity.HasFilters {
		score += 0.15
	}

	// Aggregations factor (0-0.15)
	if complexity.HasAggregations {
		score += 0.15
	}

	return math.Min(score, 1.0) // Cap at 1.0
}

// Utility methods
func (stm *SmartTTLManager) generatePatternKey(query string) string {
	// Normalize query for pattern matching
	normalized := strings.ToLower(strings.TrimSpace(query))
	// Remove common stop words for better pattern matching
	stopWords := []string{"yang", "dan", "atau", "untuk", "dari", "ke", "di", "pada", "dengan", "oleh"}
	words := strings.Fields(normalized)
	var filtered []string

	for _, word := range words {
		isStopWord := false
		for _, stopWord := range stopWords {
			if word == stopWord {
				isStopWord = true
				break
			}
		}
		if !isStopWord {
			filtered = append(filtered, word)
		}
	}

	return strings.Join(filtered, " ")
}

func (stm *SmartTTLManager) generateComplexityKey(query string) string {
	// Use first 100 characters as key for complexity analysis
	if len(query) > 100 {
		return query[:100]
	}
	return query
}

// GetStats returns statistics about the SmartTTL manager
func (stm *SmartTTLManager) GetStats() map[string]interface{} {
	stm.mu.RLock()
	defer stm.mu.RUnlock()

	return map[string]interface{}{
		"config":                    stm.config,
		"access_patterns":           len(stm.accessPatterns),
		"user_profiles":             len(stm.userProfiles),
		"query_complexities":        len(stm.queryComplexities),
		"learning_enabled":          stm.config.MinSamplesForLearning > 0,
		"user_behavior_enabled":     stm.config.EnableUserBehavior,
		"time_optimization_enabled": stm.config.EnableTimeOptimization,
	}
}

// Close cleans up resources
func (stm *SmartTTLManager) Close() error {
	stm.mu.Lock()
	defer stm.mu.Unlock()

	// Clear all maps to free memory
	stm.accessPatterns = make(map[string]*AccessPattern)
	stm.userProfiles = make(map[string]*UserBehaviorProfile)
	stm.queryComplexities = make(map[string]*QueryComplexity)

	logrus.Info("SmartTTL manager closed and resources cleaned up")
	return nil
}

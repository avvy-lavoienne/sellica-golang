package cache

import (
	"context"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// SmartTTLManager implements intelligent TTL calculation based on 7 factors
type SmartTTLManager struct {
	config           *SmartTTLConfig
	accessTracker    *AccessPatternTracker
	queryAnalyzer    *QueryComplexityAnalyzer
	timeOptimizer    *TimeBasedOptimizer
	userProfiler     *UserBehaviorProfiler
	performanceDB    *TTLPerformanceDatabase
	ttlHistory       map[string][]TTLDecision
	mu               sync.RWMutex
}

// SmartTTLConfig holds configuration for smart TTL calculations
type SmartTTLConfig struct {
	Enabled                    bool
	BaseTimeToLive            time.Duration
	ConfidenceMultiplier      float64
	ComplexityMultiplier      float64
	FreshnessMultiplier       float64
	AccessFrequencyMultiplier float64
	QueryPatternMultiplier    float64
	TimeOfDayMultiplier       float64
	UserBehaviorMultiplier    float64
	MinTTL                    time.Duration
	MaxTTL                    time.Duration
	DataFreshnessWeight       float64
	QueryPatternWeight        float64
	AccessFrequencyWeight     float64
	TimeOfDayWeight          float64
	UserBehaviorWeight       float64
}

// CacheMetadata holds metadata for intelligent TTL calculation
type CacheMetadata struct {
	Query          string
	Confidence     float64
	Complexity     QueryComplexity
	DataType       string
	AccessCount    int64
	LastAccess     time.Time
	UserID         string
	Context        map[string]interface{}
}

// QueryComplexity represents the computational complexity of a query
type QueryComplexity int

const (
	Simple QueryComplexity = iota
	Medium
	Complex
	VeryComplex
)

// TTLDecision records the reasoning behind a TTL calculation
type TTLDecision struct {
	Key            string
	CalculatedTTL  time.Duration
	ActualTTL      time.Duration
	Factors        TTLFactors
	Timestamp      time.Time
	WasHit         bool
}

// TTLFactors holds the individual factors used in TTL calculation
type TTLFactors struct {
	BaseScore           float64
	ConfidenceScore     float64
	ComplexityScore     float64
	FreshnessScore      float64
	PatternScore        float64
	FrequencyScore      float64
	TimeOfDayScore      float64
	UserBehaviorScore   float64
	FinalMultiplier     float64
}

// NewSmartTTLManager creates a new Smart TTL Manager
func NewSmartTTLManager(config *SmartTTLConfig) *SmartTTLManager {
	if config == nil {
		config = &SmartTTLConfig{
			Enabled:                    true,
			BaseTimeToLive:            5 * time.Minute,
			ConfidenceMultiplier:      2.0,
			ComplexityMultiplier:      1.5,
			FreshnessMultiplier:       1.3,
			AccessFrequencyMultiplier: 1.8,
			QueryPatternMultiplier:    1.4,
			TimeOfDayMultiplier:       1.2,
			UserBehaviorMultiplier:    1.6,
			MinTTL:                   30 * time.Second,
			MaxTTL:                   2 * time.Hour,
			DataFreshnessWeight:       0.3,
			QueryPatternWeight:        0.2,
			AccessFrequencyWeight:     0.2,
			TimeOfDayWeight:          0.15,
			UserBehaviorWeight:       0.15,
		}
	}

	return &SmartTTLManager{
		config:        config,
		accessTracker: NewAccessPatternTracker(),
		queryAnalyzer: NewQueryComplexityAnalyzer(),
		timeOptimizer: NewTimeBasedOptimizer(),
		userProfiler:  NewUserBehaviorProfiler(),
		performanceDB: NewTTLPerformanceDatabase(),
		ttlHistory:    make(map[string][]TTLDecision),
	}
}

// CalculateOptimalTTL calculates the optimal TTL based on 7 intelligent factors
func (stm *SmartTTLManager) CalculateOptimalTTL(ctx context.Context, metadata *CacheMetadata) (time.Duration, *TTLFactors, error) {
	if !stm.config.Enabled {
		return stm.config.BaseTimeToLive, &TTLFactors{BaseScore: 1.0, FinalMultiplier: 1.0}, nil
	}

	stm.mu.RLock()
	defer stm.mu.RUnlock()

	factors := &TTLFactors{
		BaseScore: 1.0,
	}

	// Factor 1: Confidence-based adjustment (higher confidence = longer TTL)
	factors.ConfidenceScore = stm.calculateConfidenceFactor(metadata.Confidence)

	// Factor 2: Query complexity adjustment (complex queries = longer TTL due to computation cost)
	factors.ComplexityScore = stm.calculateComplexityFactor(metadata.Complexity)

	// Factor 3: Data freshness factor (fresher data = shorter TTL)
	factors.FreshnessScore = stm.calculateDataFreshnessFactor(metadata.DataType)

	// Factor 4: Query pattern frequency (common patterns = longer TTL)
	factors.PatternScore = stm.calculateQueryPatternFactor(metadata.Query)

	// Factor 5: Access frequency factor (frequent access = longer TTL)
	factors.FrequencyScore = stm.calculateAccessFrequencyFactor(metadata.AccessCount)

	// Factor 6: Time of day optimization (peak hours = different strategy)
	factors.TimeOfDayScore = stm.calculateTimeOfDayFactor(time.Now())

	// Factor 7: User behavior optimization (user patterns = personalized TTL)
	factors.UserBehaviorScore = stm.calculateUserBehaviorFactor(metadata.UserID)

	// Calculate final multiplier with weighted factors
	factors.FinalMultiplier = stm.calculateWeightedMultiplier(factors)

	// Calculate final TTL
	finalTTL := time.Duration(float64(stm.config.BaseTimeToLive) * factors.FinalMultiplier)

	// Apply bounds
	if finalTTL < stm.config.MinTTL {
		finalTTL = stm.config.MinTTL
	}
	if finalTTL > stm.config.MaxTTL {
		finalTTL = stm.config.MaxTTL
	}

	// Record decision for learning and analytics
	decision := TTLDecision{
		Key:           metadata.Query,
		CalculatedTTL: finalTTL,
		ActualTTL:     finalTTL,
		Factors:       *factors,
		Timestamp:     time.Now(),
	}
	stm.recordTTLDecision(metadata.Query, decision)

	logrus.WithFields(logrus.Fields{
		"query":          metadata.Query,
		"user_id":        metadata.UserID,
		"calculated_ttl": finalTTL,
		"multiplier":     factors.FinalMultiplier,
		"confidence":     metadata.Confidence,
		"complexity":     metadata.Complexity,
	}).Debug("🧠 Smart TTL calculated")

	return finalTTL, factors, nil
}

// calculateConfidenceFactor calculates TTL multiplier based on query confidence
func (stm *SmartTTLManager) calculateConfidenceFactor(confidence float64) float64 {
	if confidence < 0 || confidence > 1 {
		logrus.WithField("confidence", confidence).Warn("Invalid confidence value, using default")
		confidence = 0.5
	}

	// Logarithmic scaling gives diminishing returns for very high confidence
	factor := 1.0 + (math.Log10(1+confidence*9) * stm.config.ConfidenceMultiplier)

	// Ensure reasonable bounds
	if factor < 0.1 {
		factor = 0.1
	}
	if factor > 10.0 {
		factor = 10.0
	}

	return factor
}

// calculateComplexityFactor calculates TTL multiplier based on query complexity
func (stm *SmartTTLManager) calculateComplexityFactor(complexity QueryComplexity) float64 {
	baseFactors := map[QueryComplexity]float64{
		Simple:      0.8,  // Quick to recompute, shorter TTL
		Medium:      1.0,  // Standard complexity
		Complex:     1.5,  // Expensive to recompute, longer TTL
		VeryComplex: 2.0,  // Very expensive, much longer TTL
	}

	factor, exists := baseFactors[complexity]
	if !exists {
		factor = 1.0
	}

	return factor * stm.config.ComplexityMultiplier
}

// calculateDataFreshnessFactor calculates TTL multiplier based on data freshness requirements
func (stm *SmartTTLManager) calculateDataFreshnessFactor(dataType string) float64 {
	// Different data types have different freshness requirements
	freshnessFactors := map[string]float64{
		"realtime":     0.5,  // Very fresh data needed, shorter TTL
		"analytics":    1.5,  // Analytics can be slightly stale, longer TTL
		"static":       2.0,  // Static data rarely changes, much longer TTL
		"product":      1.2,  // Product data moderately fresh
		"user":         1.0,  // User data standard freshness
		"cache":        1.3,  // Cached data can be moderately stale
	}

	factor, exists := freshnessFactors[strings.ToLower(dataType)]
	if !exists {
		factor = 1.0 // Default
	}

	return factor * stm.config.FreshnessMultiplier
}

// calculateQueryPatternFactor calculates TTL multiplier based on query pattern frequency
func (stm *SmartTTLManager) calculateQueryPatternFactor(query string) float64 {
	// Analyze query patterns for common Indonesian government services
	patterns := []string{
		"akta kelahiran", "ktp", "akta kematian", "akta perkawinan",
		"kia", "kk", "perpindahan", "aku sah",
	}

	queryLower := strings.ToLower(query)
	for _, pattern := range patterns {
		if strings.Contains(queryLower, pattern) {
			// Common government queries get longer TTL
			return 1.8 * stm.config.QueryPatternMultiplier
		}
	}

	// Check for repeated query patterns
	patternFrequency := stm.queryAnalyzer.GetPatternFrequency(query)
	if patternFrequency > 10 {
		return 1.5 * stm.config.QueryPatternMultiplier // High frequency
	} else if patternFrequency > 5 {
		return 1.2 * stm.config.QueryPatternMultiplier // Medium frequency
	}

	return 1.0 // No special pattern
}

// calculateAccessFrequencyFactor calculates TTL multiplier based on access frequency
func (stm *SmartTTLManager) calculateAccessFrequencyFactor(accessCount int64) float64 {
	if accessCount <= 0 {
		return 1.0
	}

	// Calculate access frequency score (higher = more frequent access)
	frequencyScore := math.Log10(float64(accessCount) + 1)

	// Normalize and apply multiplier
	factor := 1.0 + (frequencyScore * stm.config.AccessFrequencyMultiplier)

	// Cap at reasonable maximum
	if factor > 3.0 {
		factor = 3.0
	}

	return factor
}

// calculateTimeOfDayFactor calculates TTL multiplier based on time of day
func (stm *SmartTTLManager) calculateTimeOfDayFactor(currentTime time.Time) float64 {
	hour := currentTime.Hour()

	// Business hours (9 AM - 6 PM) get longer TTL due to higher load
	if hour >= 9 && hour <= 18 {
		return 1.3 * stm.config.TimeOfDayMultiplier
	}

	// Early morning (6 AM - 9 AM) moderate TTL
	if hour >= 6 && hour < 9 {
		return 1.1 * stm.config.TimeOfDayMultiplier
	}

	// Late night/early morning (11 PM - 6 AM) shorter TTL
	if hour >= 23 || hour < 6 {
		return 0.8 * stm.config.TimeOfDayMultiplier
	}

	// Off-peak hours (6 PM - 11 PM) standard TTL
	return 1.0
}

// calculateUserBehaviorFactor calculates TTL multiplier based on user behavior patterns
func (stm *SmartTTLManager) calculateUserBehaviorFactor(userID string) float64 {
	if userID == "" {
		return 1.0 // Anonymous users get standard TTL
	}

	profile := stm.userProfiler.GetUserProfile(userID)
	if profile == nil {
		return 1.0 // No profile available
	}

	// Users with predictable behavior get longer TTL
	// Users with erratic behavior get shorter TTL
	return 0.5 + (profile.BehaviorScore * 1.5) // Range: 0.5 - 2.0
}

// calculateWeightedMultiplier calculates the final multiplier using weighted factors
func (stm *SmartTTLManager) calculateWeightedMultiplier(factors *TTLFactors) float64 {
	weightedSum :=
		factors.ConfidenceScore*0.25 +
		factors.ComplexityScore*0.20 +
		factors.FreshnessScore*stm.config.DataFreshnessWeight +
		factors.PatternScore*stm.config.QueryPatternWeight +
		factors.FrequencyScore*stm.config.AccessFrequencyWeight +
		factors.TimeOfDayScore*stm.config.TimeOfDayWeight +
		factors.UserBehaviorScore*stm.config.UserBehaviorWeight

	// Ensure minimum multiplier
	if weightedSum < 0.1 {
		weightedSum = 0.1
	}

	return weightedSum
}

// recordTTLDecision records a TTL decision for analytics and learning
func (stm *SmartTTLManager) recordTTLDecision(key string, decision TTLDecision) {
	stm.mu.Lock()
	defer stm.mu.Unlock()

	if stm.ttlHistory[key] == nil {
		stm.ttlHistory[key] = make([]TTLDecision, 0)
	}

	stm.ttlHistory[key] = append(stm.ttlHistory[key], decision)

	// Keep only recent decisions (last 100 per key)
	if len(stm.ttlHistory[key]) > 100 {
		stm.ttlHistory[key] = stm.ttlHistory[key][len(stm.ttlHistory[key])-100:]
	}
}

// GetTTLHistory returns the TTL decision history for a key
func (stm *SmartTTLManager) GetTTLHistory(key string) []TTLDecision {
	stm.mu.RLock()
	defer stm.mu.RUnlock()

	history, exists := stm.ttlHistory[key]
	if !exists {
		return nil
	}

	// Return copy to prevent external modification
	result := make([]TTLDecision, len(history))
	copy(result, history)
	return result
}

// GetPerformanceStats returns performance statistics for TTL calculations
func (stm *SmartTTLManager) GetPerformanceStats() map[string]interface{} {
	stm.mu.RLock()
	defer stm.mu.RUnlock()

	totalDecisions := 0
	totalKeys := len(stm.ttlHistory)

	for _, decisions := range stm.ttlHistory {
		totalDecisions += len(decisions)
	}

	return map[string]interface{}{
		"total_keys":       totalKeys,
		"total_decisions":  totalDecisions,
		"avg_decisions_per_key": float64(totalDecisions) / float64(totalKeys),
		"config":           stm.config,
	}
}

// GetTTLInsights returns insights about TTL performance and optimization
func (stm *SmartTTLManager) GetTTLInsights() (*TTLInsights, error) {
	return stm.performanceDB.GetTTLInsights()
}

// UpdateAccessPattern updates access patterns for intelligent TTL calculation
func (stm *SmartTTLManager) UpdateAccessPattern(key, userID string) {
	stm.accessTracker.RecordAccess(key, userID)
	stm.userProfiler.RecordUserAccess(userID, key)
}

// Close gracefully shuts down the Smart TTL Manager
func (stm *SmartTTLManager) Close() error {
	logrus.Info("🔒 Closing Smart TTL Manager...")

	// Save any pending analytics data
	if err := stm.performanceDB.SaveTTLHistory(stm.ttlHistory); err != nil {
		logrus.WithError(err).Warn("Failed to save TTL history")
	}

	logrus.Info("✅ Smart TTL Manager closed")
	return nil
}

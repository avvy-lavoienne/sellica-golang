package cache

import (
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// UserBehaviorProfiler analyzes user behavior patterns for personalized caching
type UserBehaviorProfiler struct {
	profiles    map[string]*UserProfile
	analyzer    *BehaviorAnalyzer
	mu          sync.RWMutex
}

// UserProfile represents a user's caching behavior profile
type UserProfile struct {
	UserID              string        `json:"user_id"`
	QueryPatterns       []string      `json:"query_patterns"`
	SessionDuration     time.Duration `json:"avg_session_duration"`
	ReturnFrequency     time.Duration `json:"return_frequency"`
	PreferredCacheTime  time.Duration `json:"preferred_cache_time"`
	BehaviorScore       float64       `json:"behavior_score"`
	LastActive          time.Time     `json:"last_active"`
	TotalQueries        int64         `json:"total_queries"`
	CacheHitRate        float64       `json:"cache_hit_rate"`
	PreferredComplexity QueryComplexity `json:"preferred_complexity"`
}

// BehaviorAnalyzer analyzes user behavior patterns
type BehaviorAnalyzer struct {
	sessionTimeout time.Duration
	minQueriesForAnalysis int
}

// NewUserBehaviorProfiler creates a new user behavior profiler
func NewUserBehaviorProfiler() *UserBehaviorProfiler {
	return &UserBehaviorProfiler{
		profiles: make(map[string]*UserProfile),
		analyzer: &BehaviorAnalyzer{
			sessionTimeout:       30 * time.Minute,
			minQueriesForAnalysis: 5,
		},
	}
}

// RecordUserAccess records a user's access for behavior analysis
func (ubp *UserBehaviorProfiler) RecordUserAccess(userID, query string) {
	ubp.mu.Lock()
	defer ubp.mu.Unlock()

	profile := ubp.getOrCreateProfile(userID)

	// Update profile with new query
	profile.QueryPatterns = append(profile.QueryPatterns, query)
	profile.TotalQueries++
	profile.LastActive = time.Now()

	// Keep only recent patterns (last 100 queries per user)
	if len(profile.QueryPatterns) > 100 {
		profile.QueryPatterns = profile.QueryPatterns[len(profile.QueryPatterns)-100:]
	}

	// Analyze behavior if we have enough data
	if profile.TotalQueries >= int64(ubp.analyzer.minQueriesForAnalysis) {
		ubp.analyzeUserBehavior(profile)
	}
}

// GetUserProfile returns the profile for a specific user
func (ubp *UserBehaviorProfiler) GetUserProfile(userID string) *UserProfile {
	ubp.mu.RLock()
	defer ubp.mu.RUnlock()

	profile, exists := ubp.profiles[userID]
	if !exists {
		return nil
	}

	// Return copy to prevent external modification
	return &UserProfile{
		UserID:              profile.UserID,
		QueryPatterns:       append([]string(nil), profile.QueryPatterns...),
		SessionDuration:     profile.SessionDuration,
		ReturnFrequency:     profile.ReturnFrequency,
		PreferredCacheTime:  profile.PreferredCacheTime,
		BehaviorScore:       profile.BehaviorScore,
		LastActive:          profile.LastActive,
		TotalQueries:        profile.TotalQueries,
		CacheHitRate:        profile.CacheHitRate,
		PreferredComplexity: profile.PreferredComplexity,
	}
}

// UpdateCacheHitRate updates the cache hit rate for a user
func (ubp *UserBehaviorProfiler) UpdateCacheHitRate(userID string, hitRate float64) {
	ubp.mu.Lock()
	defer ubp.mu.Unlock()

	profile := ubp.getOrCreateProfile(userID)
	profile.CacheHitRate = hitRate

	// Re-analyze behavior with updated hit rate
	if profile.TotalQueries >= int64(ubp.analyzer.minQueriesForAnalysis) {
		ubp.analyzeUserBehavior(profile)
	}
}

// GetBehaviorScore returns the behavior score for a user (0-1, higher = more predictable)
func (ubp *UserBehaviorProfiler) GetBehaviorScore(userID string) float64 {
	profile := ubp.GetUserProfile(userID)
	if profile == nil {
		return 0.5 // Default score for unknown users
	}
	return profile.BehaviorScore
}

// GetPreferredCacheTime returns the preferred cache time for a user
func (ubp *UserBehaviorProfiler) GetPreferredCacheTime(userID string) time.Duration {
	profile := ubp.GetUserProfile(userID)
	if profile == nil {
		return 5 * time.Minute // Default
	}
	return profile.PreferredCacheTime
}

// getOrCreateProfile gets or creates a user profile
func (ubp *UserBehaviorProfiler) getOrCreateProfile(userID string) *UserProfile {
	profile, exists := ubp.profiles[userID]
	if !exists {
		profile = &UserProfile{
			UserID:        userID,
			QueryPatterns: make([]string, 0),
			LastActive:    time.Now(),
			BehaviorScore: 0.5, // Default neutral score
		}
		ubp.profiles[userID] = profile
	}
	return profile
}

// analyzeUserBehavior analyzes a user's behavior patterns
func (ubp *UserBehaviorProfiler) analyzeUserBehavior(profile *UserProfile) {
	// Analyze query patterns for complexity preference
	complexityCount := make(map[QueryComplexity]int)
	totalPatterns := len(profile.QueryPatterns)

	for _, query := range profile.QueryPatterns {
		// Use query analyzer to determine complexity
		complexity := AnalyzeQueryComplexity(query)
		complexityCount[complexity]++
	}

	// Determine preferred complexity
	maxCount := 0
	preferredComplexity := Medium
	for complexity, count := range complexityCount {
		if count > maxCount {
			maxCount = count
			preferredComplexity = complexity
		}
	}
	profile.PreferredComplexity = preferredComplexity

	// Calculate behavior score based on pattern consistency
	if totalPatterns > 0 {
		// Higher score for users with consistent query patterns
		consistencyScore := float64(maxCount) / float64(totalPatterns)

		// Factor in cache hit rate
		hitRateFactor := profile.CacheHitRate

		// Factor in query frequency (more queries = more predictable)
		frequencyFactor := 1.0
		if profile.TotalQueries > 100 {
			frequencyFactor = 1.2
		} else if profile.TotalQueries > 50 {
			frequencyFactor = 1.1
		} else if profile.TotalQueries > 20 {
			frequencyFactor = 1.0
		} else {
			frequencyFactor = 0.8
		}

		// Calculate final behavior score
		profile.BehaviorScore = (consistencyScore*0.4 + hitRateFactor*0.4 + frequencyFactor*0.2)

		// Ensure bounds
		if profile.BehaviorScore > 1.0 {
			profile.BehaviorScore = 1.0
		} else if profile.BehaviorScore < 0.0 {
			profile.BehaviorScore = 0.0
		}
	}

	// Calculate preferred cache time based on behavior
	profile.PreferredCacheTime = ubp.calculatePreferredCacheTime(profile)
}

// calculatePreferredCacheTime calculates the preferred cache time for a user
func (ubp *UserBehaviorProfiler) calculatePreferredCacheTime(profile *UserProfile) time.Duration {
	baseTime := 5 * time.Minute

	// Adjust based on behavior score
	if profile.BehaviorScore > 0.8 {
		// Very predictable users get longer cache times
		baseTime = 15 * time.Minute
	} else if profile.BehaviorScore > 0.6 {
		// Moderately predictable users get standard cache times
		baseTime = 8 * time.Minute
	} else if profile.BehaviorScore > 0.4 {
		// Somewhat predictable users get shorter cache times
		baseTime = 3 * time.Minute
	} else {
		// Unpredictable users get very short cache times
		baseTime = 1 * time.Minute
	}

	// Adjust based on preferred complexity
	switch profile.PreferredComplexity {
	case VeryComplex:
		baseTime *= 2 // Complex queries benefit from longer caching
	case Complex:
		baseTime = time.Duration(float64(baseTime) * 1.5)
	case Simple:
		baseTime = time.Duration(float64(baseTime) * 0.8)
	}

	return baseTime
}

// GetTopUsers returns the most active users
func (ubp *UserBehaviorProfiler) GetTopUsers(limit int) []*UserProfile {
	ubp.mu.RLock()
	defer ubp.mu.RUnlock()

	profiles := make([]*UserProfile, 0, len(ubp.profiles))
	for _, profile := range ubp.profiles {
		profiles = append(profiles, profile)
	}

	// Sort by total queries (descending)
	for i := 0; i < len(profiles)-1; i++ {
		for j := i + 1; j < len(profiles); j++ {
			if profiles[i].TotalQueries < profiles[j].TotalQueries {
				profiles[i], profiles[j] = profiles[j], profiles[i]
			}
		}
	}

	if limit > 0 && len(profiles) > limit {
		profiles = profiles[:limit]
	}

	return profiles
}

// GetStats returns statistics about user behavior profiling
func (ubp *UserBehaviorProfiler) GetStats() map[string]interface{} {
	ubp.mu.RLock()
	defer ubp.mu.RUnlock()

	totalUsers := len(ubp.profiles)
	totalQueries := int64(0)
	activeUsers := 0
	avgBehaviorScore := 0.0

	for _, profile := range ubp.profiles {
		totalQueries += profile.TotalQueries
		avgBehaviorScore += profile.BehaviorScore

		// Count active users (accessed within last 24 hours)
		if time.Since(profile.LastActive) < 24*time.Hour {
			activeUsers++
		}
	}

	if totalUsers > 0 {
		avgBehaviorScore /= float64(totalUsers)
	}

	return map[string]interface{}{
		"total_users":         totalUsers,
		"active_users":        activeUsers,
		"total_queries":       totalQueries,
		"avg_behavior_score":  avgBehaviorScore,
		"avg_queries_per_user": float64(totalQueries) / float64(totalUsers),
	}
}

// Cleanup removes old or inactive user profiles
func (ubp *UserBehaviorProfiler) Cleanup() {
	ubp.mu.Lock()
	defer ubp.mu.Unlock()

	cutoff := time.Now().Add(-30 * 24 * time.Hour) // 30 days ago

	for userID, profile := range ubp.profiles {
		// Remove profiles with very low activity and old last access
		if profile.TotalQueries < 3 && profile.LastActive.Before(cutoff) {
			delete(ubp.profiles, userID)
		}
	}

	logrus.WithField("remaining_profiles", len(ubp.profiles)).Debug("🧹 User profiler cleanup completed")
}

// AnalyzeQueryComplexity is a helper function to analyze query complexity
func AnalyzeQueryComplexity(query string) QueryComplexity {
	// Simple complexity analysis - could be enhanced with ML
	wordCount := len(strings.Fields(query))

	if wordCount > 15 {
		return VeryComplex
	} else if wordCount > 8 {
		return Complex
	} else if wordCount > 3 {
		return Medium
	}
	return Simple
}
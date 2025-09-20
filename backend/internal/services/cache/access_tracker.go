package cache

import (
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// AccessPatternTracker tracks access patterns for intelligent caching decisions
type AccessPatternTracker struct {
	patterns    map[string]*AccessPattern
	timeWindows []time.Duration
	mu          sync.RWMutex
}

// AccessPattern represents access patterns for a cache key
type AccessPattern struct {
	Key               string                    `json:"key"`
	TotalAccesses     int64                     `json:"total_accesses"`
	RecentAccesses    []time.Time               `json:"recent_accesses"`
	AccessFrequency   map[time.Duration]float64 `json:"access_frequency"`
	PeakHours         []int                     `json:"peak_hours"`
	UserDistribution  map[string]int            `json:"user_distribution"`
	LastUpdated       time.Time                 `json:"last_updated"`
}

// NewAccessPatternTracker creates a new access pattern tracker
func NewAccessPatternTracker() *AccessPatternTracker {
	return &AccessPatternTracker{
		patterns: make(map[string]*AccessPattern),
		timeWindows: []time.Duration{
			5 * time.Minute,
			1 * time.Hour,
			24 * time.Hour,
			7 * 24 * time.Hour,
		},
	}
}

// RecordAccess records an access to a cache key
func (apt *AccessPatternTracker) RecordAccess(key, userID string) {
	apt.mu.Lock()
	defer apt.mu.Unlock()

	now := time.Now()
	pattern := apt.getOrCreatePattern(key)

	pattern.TotalAccesses++
	pattern.RecentAccesses = append(pattern.RecentAccesses, now)
	pattern.UserDistribution[userID]++
	pattern.LastUpdated = now

	// Analyze frequency patterns
	apt.analyzeFrequencyPatterns(pattern)

	// Update peak hour analysis
	apt.updatePeakHours(pattern, now)

	// Clean old access records (keep last 24 hours)
	apt.cleanOldAccesses(pattern)
}

// GetAccessFrequency returns the access frequency for a key
func (apt *AccessPatternTracker) GetAccessFrequency(key string) float64 {
	apt.mu.RLock()
	defer apt.mu.RUnlock()

	pattern, exists := apt.patterns[key]
	if !exists {
		return 0.0
	}

	// Calculate access frequency over different time windows
	frequencies := make([]float64, 0, len(apt.timeWindows))
	for _, window := range apt.timeWindows {
		freq := apt.calculateFrequencyForWindow(pattern, window)
		frequencies = append(frequencies, freq)
	}

	// Weighted average of frequencies with more weight on recent patterns
	return apt.calculateWeightedFrequency(frequencies)
}

// GetPeakHours returns the peak access hours for a key
func (apt *AccessPatternTracker) GetPeakHours(key string) []int {
	apt.mu.RLock()
	defer apt.mu.RUnlock()

	pattern, exists := apt.patterns[key]
	if !exists {
		return nil
	}

	// Return copy to prevent external modification
	peakHours := make([]int, len(pattern.PeakHours))
	copy(peakHours, pattern.PeakHours)
	return peakHours
}

// GetUserDistribution returns user access distribution for a key
func (apt *AccessPatternTracker) GetUserDistribution(key string) map[string]int {
	apt.mu.RLock()
	defer apt.mu.RUnlock()

	pattern, exists := apt.patterns[key]
	if !exists {
		return nil
	}

	// Return copy to prevent external modification
	distribution := make(map[string]int)
	for user, count := range pattern.UserDistribution {
		distribution[user] = count
	}
	return distribution
}

// getOrCreatePattern gets or creates an access pattern for a key
func (apt *AccessPatternTracker) getOrCreatePattern(key string) *AccessPattern {
	pattern, exists := apt.patterns[key]
	if !exists {
		pattern = &AccessPattern{
			Key:              key,
			TotalAccesses:    0,
			RecentAccesses:   make([]time.Time, 0),
			AccessFrequency:  make(map[time.Duration]float64),
			PeakHours:        make([]int, 0),
			UserDistribution: make(map[string]int),
			LastUpdated:      time.Now(),
		}
		apt.patterns[key] = pattern
	}
	return pattern
}

// analyzeFrequencyPatterns analyzes access frequency patterns
func (apt *AccessPatternTracker) analyzeFrequencyPatterns(pattern *AccessPattern) {
	now := time.Now()

	for _, window := range apt.timeWindows {
		windowStart := now.Add(-window)
		accessCount := 0

		// Count accesses within the time window
		for _, accessTime := range pattern.RecentAccesses {
			if accessTime.After(windowStart) {
				accessCount++
			}
		}

		// Calculate frequency (accesses per unit time)
		frequency := float64(accessCount) / window.Seconds()
		pattern.AccessFrequency[window] = frequency
	}
}

// updatePeakHours updates peak hour analysis
func (apt *AccessPatternTracker) updatePeakHours(pattern *AccessPattern, accessTime time.Time) {
	hour := accessTime.Hour()

	// Simple peak hour detection - could be enhanced with more sophisticated analysis
	if len(pattern.PeakHours) == 0 {
		pattern.PeakHours = []int{hour}
		return
	}

	// Check if hour is already in peak hours
	for _, peakHour := range pattern.PeakHours {
		if peakHour == hour {
			return
		}
	}

	// Add new peak hour if we have high activity
	if len(pattern.RecentAccesses) > 10 {
		pattern.PeakHours = append(pattern.PeakHours, hour)

		// Keep only top 3 peak hours
		if len(pattern.PeakHours) > 3 {
			pattern.PeakHours = pattern.PeakHours[len(pattern.PeakHours)-3:]
		}
	}
}

// cleanOldAccesses removes old access records to prevent memory bloat
func (apt *AccessPatternTracker) cleanOldAccesses(pattern *AccessPattern) {
	now := time.Now()
	cutoff := now.Add(-24 * time.Hour) // Keep last 24 hours

	cleaned := make([]time.Time, 0)
	for _, accessTime := range pattern.RecentAccesses {
		if accessTime.After(cutoff) {
			cleaned = append(cleaned, accessTime)
		}
	}

	pattern.RecentAccesses = cleaned

	// If no recent accesses, consider cleaning up the pattern entirely
	if len(cleaned) == 0 && pattern.TotalAccesses > 100 {
		// Keep patterns with high total access count even if no recent activity
		return
	}
}

// calculateFrequencyForWindow calculates access frequency for a specific time window
func (apt *AccessPatternTracker) calculateFrequencyForWindow(pattern *AccessPattern, window time.Duration) float64 {
	now := time.Now()
	windowStart := now.Add(-window)

	accessCount := 0
	for _, accessTime := range pattern.RecentAccesses {
		if accessTime.After(windowStart) {
			accessCount++
		}
	}

	return float64(accessCount) / window.Seconds()
}

// calculateWeightedFrequency calculates weighted average of frequencies
func (apt *AccessPatternTracker) calculateWeightedFrequency(frequencies []float64) float64 {
	if len(frequencies) == 0 {
		return 0.0
	}

	// Weight recent time windows more heavily
	weights := []float64{0.4, 0.3, 0.2, 0.1} // 5min, 1hr, 24hr, 7day

	var weightedSum float64
	var totalWeight float64

	for i, frequency := range frequencies {
		if i < len(weights) {
			weightedSum += frequency * weights[i]
			totalWeight += weights[i]
		}
	}

	if totalWeight == 0 {
		return 0.0
	}

	return weightedSum / totalWeight
}

// GetStats returns statistics about access patterns
func (apt *AccessPatternTracker) GetStats() map[string]interface{} {
	apt.mu.RLock()
	defer apt.mu.RUnlock()

	totalPatterns := len(apt.patterns)
	totalAccesses := int64(0)
	activePatterns := 0

	for _, pattern := range apt.patterns {
		totalAccesses += pattern.TotalAccesses
		if len(pattern.RecentAccesses) > 0 {
			activePatterns++
		}
	}

	return map[string]interface{}{
		"total_patterns":   totalPatterns,
		"active_patterns":  activePatterns,
		"total_accesses":   totalAccesses,
		"avg_accesses_per_pattern": float64(totalAccesses) / float64(totalPatterns),
	}
}

// Cleanup removes old patterns to free memory
func (apt *AccessPatternTracker) Cleanup() {
	apt.mu.Lock()
	defer apt.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-7 * 24 * time.Hour) // 7 days ago

	for key, pattern := range apt.patterns {
		// Remove patterns with no recent activity and low total accesses
		if len(pattern.RecentAccesses) == 0 && pattern.TotalAccesses < 10 {
			delete(apt.patterns, key)
			continue
		}

		// Remove very old patterns
		if pattern.LastUpdated.Before(cutoff) && pattern.TotalAccesses < 100 {
			delete(apt.patterns, key)
		}
	}

	logrus.WithField("remaining_patterns", len(apt.patterns)).Debug("🧹 Access pattern cleanup completed")
}
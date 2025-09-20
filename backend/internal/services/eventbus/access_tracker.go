package eventbus

import (
	"sync"
	"time"
)

// AccessTracker tracks cache access patterns for optimization
type AccessTracker struct {
	accessPatterns map[string]*AccessPattern
	mu            sync.RWMutex
}

// NewAccessTracker creates a new access tracker
func NewAccessTracker() *AccessTracker {
	return &AccessTracker{
		accessPatterns: make(map[string]*AccessPattern),
	}
}

// RecordAccess records an access to a cache key
func (at *AccessTracker) RecordAccess(key string, timestamp time.Time) {
	at.mu.Lock()
	defer at.mu.Unlock()

	pattern, exists := at.accessPatterns[key]
	if !exists {
		pattern = &AccessPattern{
			Key:         key,
			TotalAccesses: 0,
			LastAccessed: timestamp,
			AccessTimes:  make([]time.Time, 0),
		}
		at.accessPatterns[key] = pattern
	}

	// Update access statistics
	pattern.TotalAccesses++
	pattern.LastAccessed = timestamp
	pattern.AccessTimes = append(pattern.AccessTimes, timestamp)

	// Keep only recent access times (last 100)
	if len(pattern.AccessTimes) > 100 {
		pattern.AccessTimes = pattern.AccessTimes[len(pattern.AccessTimes)-100:]
	}

	// Calculate access frequency (accesses per minute)
	if len(pattern.AccessTimes) >= 2 {
		timeSpan := pattern.AccessTimes[len(pattern.AccessTimes)-1].Sub(pattern.AccessTimes[0])
		if timeSpan.Minutes() > 0 {
			pattern.Frequency = float64(len(pattern.AccessTimes)) / timeSpan.Minutes()
		}
	}
}

// GetAccessPattern returns the access pattern for a key
func (at *AccessTracker) GetAccessPattern(key string) (*AccessPattern, bool) {
	at.mu.RLock()
	defer at.mu.RUnlock()

	pattern, exists := at.accessPatterns[key]
	if !exists {
		return nil, false
	}

	// Return a copy to prevent external modification
	patternCopy := *pattern
	patternCopy.AccessTimes = make([]time.Time, len(pattern.AccessTimes))
	copy(patternCopy.AccessTimes, pattern.AccessTimes)

	return &patternCopy, true
}

// GetHotKeys returns keys with high access frequency
func (at *AccessTracker) GetHotKeys(threshold float64, limit int) []string {
	at.mu.RLock()
	defer at.mu.RUnlock()

	type keyFreq struct {
		key   string
		freq  float64
	}

	var candidates []keyFreq
	for key, pattern := range at.accessPatterns {
		if pattern.Frequency >= threshold {
			candidates = append(candidates, keyFreq{key: key, freq: pattern.Frequency})
		}
	}

	// Sort by frequency (highest first)
	for i := 0; i < len(candidates)-1; i++ {
		for j := i + 1; j < len(candidates); j++ {
			if candidates[j].freq > candidates[i].freq {
				candidates[i], candidates[j] = candidates[j], candidates[i]
			}
		}
	}

	// Return top keys
	result := make([]string, 0, limit)
	for i, candidate := range candidates {
		if i >= limit {
			break
		}
		result = append(result, candidate.key)
	}

	return result
}

// GetColdKeys returns keys with low access frequency
func (at *AccessTracker) GetColdKeys(maxAge time.Duration, limit int) []string {
	at.mu.RLock()
	defer at.mu.RUnlock()

	now := time.Now()
	var candidates []string

	for key, pattern := range at.accessPatterns {
		if now.Sub(pattern.LastAccessed) > maxAge {
			candidates = append(candidates, key)
		}
	}

	// Return limited number of cold keys
	if len(candidates) > limit {
		candidates = candidates[:limit]
	}

	return candidates
}

// GetAccessStats returns overall access statistics
func (at *AccessTracker) GetAccessStats() map[string]interface{} {
	at.mu.RLock()
	defer at.mu.RUnlock()

	totalKeys := len(at.accessPatterns)
	totalAccesses := int64(0)
	avgFrequency := 0.0
	recentAccesses := 0

	now := time.Now()
	lastHour := now.Add(-time.Hour)

	for _, pattern := range at.accessPatterns {
		totalAccesses += pattern.TotalAccesses
		avgFrequency += pattern.Frequency

		// Count recent accesses (last hour)
		for _, accessTime := range pattern.AccessTimes {
			if accessTime.After(lastHour) {
				recentAccesses++
			}
		}
	}

	if totalKeys > 0 {
		avgFrequency /= float64(totalKeys)
	}

	return map[string]interface{}{
		"total_keys":       totalKeys,
		"total_accesses":   totalAccesses,
		"avg_frequency":    avgFrequency,
		"recent_accesses":  recentAccesses,
	}
}

// CleanupOldPatterns removes patterns older than the specified duration
func (at *AccessTracker) CleanupOldPatterns(maxAge time.Duration) int {
	at.mu.Lock()
	defer at.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-maxAge)
	removed := 0

	for key, pattern := range at.accessPatterns {
		if pattern.LastAccessed.Before(cutoff) {
			delete(at.accessPatterns, key)
			removed++
		}
	}

	return removed
}

// Reset clears all access patterns
func (at *AccessTracker) Reset() {
	at.mu.Lock()
	defer at.mu.Unlock()
	at.accessPatterns = make(map[string]*AccessPattern)
}
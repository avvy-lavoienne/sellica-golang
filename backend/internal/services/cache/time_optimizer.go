package cache

import (
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// TimeBasedOptimizer provides time-based optimization for caching decisions
type TimeBasedOptimizer struct {
	peakHours       map[int]float64     // Hour -> load multiplier
	dayPatterns     map[time.Weekday]float64
	seasonalFactors map[time.Month]float64
	config          *TimeOptimizationConfig
	mu              sync.RWMutex
}

// TimeOptimizationConfig holds configuration for time-based optimization
type TimeOptimizationConfig struct {
	PeakHourMultiplier    float64 `yaml:"peak_hour_multiplier"`
	OffPeakMultiplier     float64 `yaml:"off_peak_multiplier"`
	WeekendMultiplier     float64 `yaml:"weekend_multiplier"`
	BusinessHoursStart    int     `yaml:"business_hours_start"`
	BusinessHoursEnd      int     `yaml:"business_hours_end"`
	TimeZone              string  `yaml:"timezone"`
}

// NewTimeBasedOptimizer creates a new time-based optimizer
func NewTimeBasedOptimizer() *TimeBasedOptimizer {
	config := &TimeOptimizationConfig{
		PeakHourMultiplier: 1.3,
		OffPeakMultiplier:  0.9,
		WeekendMultiplier:  0.8,
		BusinessHoursStart: 9,
		BusinessHoursEnd:   18,
		TimeZone:          "Asia/Jakarta",
	}

	return &TimeBasedOptimizer{
		peakHours:       make(map[int]float64),
		dayPatterns:     make(map[time.Weekday]float64),
		seasonalFactors: make(map[time.Month]float64),
		config:          config,
	}
}

// CalculateTimeOfDayFactor calculates TTL multiplier based on time of day
func (tbo *TimeBasedOptimizer) CalculateTimeOfDayFactor(currentTime time.Time) float64 {
	hour := currentTime.Hour()
	weekday := currentTime.Weekday()

	// Base factor
	factor := 1.0

	// Apply business hours logic
	if tbo.isBusinessHours(hour) {
		factor *= tbo.config.PeakHourMultiplier
	} else {
		factor *= tbo.config.OffPeakMultiplier
	}

	// Apply weekend logic
	if tbo.isWeekend(weekday) {
		factor *= tbo.config.WeekendMultiplier
	}

	// Apply learned peak patterns
	if peakMultiplier, exists := tbo.peakHours[hour]; exists {
		factor *= peakMultiplier
	}

	return factor
}

// LearnFromAccessPatterns learns optimal caching patterns from access data
func (tbo *TimeBasedOptimizer) LearnFromAccessPatterns(patterns map[string]*AccessPattern) {
	tbo.mu.Lock()
	defer tbo.mu.Unlock()

	// Analyze hourly access patterns
	hourlyAccesses := make(map[int]int64)

	for _, pattern := range patterns {
		for _, accessTime := range pattern.RecentAccesses {
			hour := accessTime.Hour()
			hourlyAccesses[hour]++
		}
	}

	// Calculate peak hour multipliers based on actual usage
	maxAccesses := int64(0)
	for _, count := range hourlyAccesses {
		if count > maxAccesses {
			maxAccesses = count
		}
	}

	// Update peak hour multipliers
	for hour, count := range hourlyAccesses {
		if maxAccesses > 0 {
			tbo.peakHours[hour] = float64(count) / float64(maxAccesses)
		}
	}

	logrus.WithField("peak_hours_learned", len(tbo.peakHours)).Debug("🕐 Learned peak hour patterns")
}

// GetOptimalCacheTime returns the optimal cache time for a given time
func (tbo *TimeBasedOptimizer) GetOptimalCacheTime(baseTTL time.Duration, currentTime time.Time) time.Duration {
	factor := tbo.CalculateTimeOfDayFactor(currentTime)
	optimalTTL := time.Duration(float64(baseTTL) * factor)

	// Ensure reasonable bounds
	if optimalTTL < 30*time.Second {
		optimalTTL = 30 * time.Second
	}
	if optimalTTL > 2*time.Hour {
		optimalTTL = 2 * time.Hour
	}

	return optimalTTL
}

// IsPeakTime determines if the current time is a peak usage period
func (tbo *TimeBasedOptimizer) IsPeakTime(currentTime time.Time) bool {
	hour := currentTime.Hour()
	return tbo.isBusinessHours(hour)
}

// GetTimeBasedRecommendation provides caching recommendations based on time
func (tbo *TimeBasedOptimizer) GetTimeBasedRecommendation(currentTime time.Time) string {
	hour := currentTime.Hour()
	weekday := currentTime.Weekday()

	if tbo.isBusinessHours(hour) && !tbo.isWeekend(weekday) {
		return "Business hours - use longer TTL for better performance"
	} else if tbo.isWeekend(weekday) {
		return "Weekend - use shorter TTL to conserve resources"
	} else {
		return "Off-peak hours - balance performance and resource usage"
	}
}

// isBusinessHours checks if the given hour is within business hours
func (tbo *TimeBasedOptimizer) isBusinessHours(hour int) bool {
	return hour >= tbo.config.BusinessHoursStart && hour < tbo.config.BusinessHoursEnd
}

// isWeekend checks if the given weekday is a weekend
func (tbo *TimeBasedOptimizer) isWeekend(weekday time.Weekday) bool {
	return weekday == time.Saturday || weekday == time.Sunday
}

// GetPeakHours returns the learned peak hours
func (tbo *TimeBasedOptimizer) GetPeakHours() map[int]float64 {
	tbo.mu.RLock()
	defer tbo.mu.RUnlock()

	// Return copy to prevent external modification
	peakHours := make(map[int]float64)
	for hour, multiplier := range tbo.peakHours {
		peakHours[hour] = multiplier
	}
	return peakHours
}

// GetDayPatterns returns day-of-week patterns
func (tbo *TimeBasedOptimizer) GetDayPatterns() map[time.Weekday]float64 {
	tbo.mu.RLock()
	defer tbo.mu.RUnlock()

	// Return copy to prevent external modification
	dayPatterns := make(map[time.Weekday]float64)
	for day, pattern := range tbo.dayPatterns {
		dayPatterns[day] = pattern
	}
	return dayPatterns
}

// UpdateDayPattern updates the pattern for a specific day
func (tbo *TimeBasedOptimizer) UpdateDayPattern(day time.Weekday, loadFactor float64) {
	tbo.mu.Lock()
	defer tbo.mu.Unlock()

	tbo.dayPatterns[day] = loadFactor
}

// GetSeasonalFactor returns the seasonal factor for cache optimization
func (tbo *TimeBasedOptimizer) GetSeasonalFactor(month time.Month) float64 {
	tbo.mu.RLock()
	defer tbo.mu.RUnlock()

	if factor, exists := tbo.seasonalFactors[month]; exists {
		return factor
	}

	// Default seasonal factors based on typical government service usage
	defaultFactors := map[time.Month]float64{
		time.January: 1.2, // New year processing
		time.February: 1.0,
		time.March:   1.1, // End of quarter
		time.April:   1.0,
		time.May:     1.0,
		time.June:    1.1, // Mid-year processing
		time.July:    0.9, // Holiday season
		time.August:  0.8, // Peak holiday
		time.September: 1.1, // Back to school
		time.October: 1.0,
		time.November: 1.0,
		time.December: 1.3, // Year-end processing
	}

	return defaultFactors[month]
}

// SetSeasonalFactor sets the seasonal factor for a specific month
func (tbo *TimeBasedOptimizer) SetSeasonalFactor(month time.Month, factor float64) {
	tbo.mu.Lock()
	defer tbo.mu.Unlock()

	tbo.seasonalFactors[month] = factor
}

// GetStats returns statistics about time-based optimization
func (tbo *TimeBasedOptimizer) GetStats() map[string]interface{} {
	tbo.mu.RLock()
	defer tbo.mu.RUnlock()

	return map[string]interface{}{
		"peak_hours_count":     len(tbo.peakHours),
		"day_patterns_count":   len(tbo.dayPatterns),
		"seasonal_factors_count": len(tbo.seasonalFactors),
		"config":               tbo.config,
		"peak_hours":           tbo.GetPeakHours(),
		"day_patterns":         tbo.GetDayPatterns(),
	}
}

// Reset clears all learned patterns
func (tbo *TimeBasedOptimizer) Reset() {
	tbo.mu.Lock()
	defer tbo.mu.Unlock()

	tbo.peakHours = make(map[int]float64)
	tbo.dayPatterns = make(map[time.Weekday]float64)
	tbo.seasonalFactors = make(map[time.Month]float64)

	logrus.Info("🔄 Time-based optimizer patterns reset")
}
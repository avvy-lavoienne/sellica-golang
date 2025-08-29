package cache

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewSmartTTLManager(t *testing.T) {
	config := DefaultSmartTTLConfig()
	manager := NewSmartTTLManager(config)

	assert.NotNil(t, manager)
	assert.NotNil(t, manager.config)
	assert.NotNil(t, manager.accessPatterns)
	assert.NotNil(t, manager.userProfiles)
	assert.NotNil(t, manager.queryComplexities)
}

func TestDefaultSmartTTLConfig(t *testing.T) {
	config := DefaultSmartTTLConfig()

	assert.NotNil(t, config)
	assert.Equal(t, 300, config.BaseTimeToLive)
	assert.Equal(t, 60, config.MinTTL)
	assert.Equal(t, 3600, config.MaxTTL)
	assert.True(t, config.EnableUserBehavior)
	assert.True(t, config.EnableTimeOptimization)
}

func TestCalculateOptimalTTL_BasicFunctionality(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())
	ctx := context.Background()

	metadata := &CacheMetadata{
		Key:        "test_key",
		Query:      "SELECT * FROM users",
		UserID:     "user123",
		Confidence: 0.8,
		Complexity: "medium",
		DataAge:    time.Hour * 2,
	}

	ttl := manager.CalculateOptimalTTL(ctx, "test_key", metadata)

	// TTL should be within bounds
	assert.True(t, ttl >= time.Duration(manager.config.MinTTL)*time.Second)
	assert.True(t, ttl <= time.Duration(manager.config.MaxTTL)*time.Second)

	// Should be greater than base TTL due to confidence multiplier
	baseTTL := time.Duration(manager.config.BaseTimeToLive) * time.Second
	assert.True(t, ttl > baseTTL, "TTL should be increased due to confidence factor")
}

func TestCalculateConfidenceFactor(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	tests := []struct {
		confidence float64
		expected   float64
	}{
		{0.0, 0.75}, // Low confidence = shorter TTL (0.5 + (0-0.5)*0.5 = 0.75)
		{0.5, 1.0},  // Medium confidence = base TTL
		{1.0, 1.25}, // High confidence = longer TTL (0.5 + (1-0.5)*0.5 = 1.25)
	}

	for _, test := range tests {
		result := manager.calculateConfidenceFactor(test.confidence)
		assert.InDelta(t, test.expected, result, 0.01, "Confidence factor for %f", test.confidence)
	}
}

func TestCalculateComplexityFactor(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	tests := []struct {
		complexity string
		expected   float64
	}{
		{"low", 0.85},   // Low complexity = shorter TTL (1.0 - 0.3*0.5 = 0.85)
		{"medium", 1.0}, // Medium complexity = base TTL
		{"high", 1.15},  // High complexity = longer TTL (1.0 + 0.3*0.5 = 1.15)
	}

	for _, test := range tests {
		result := manager.calculateComplexityFactor(test.complexity)
		assert.InDelta(t, test.expected, result, 0.01, "Complexity factor for %s", test.complexity)
	}
}

func TestCalculateDataFreshnessFactor(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	tests := []struct {
		dataAge  time.Duration
		expected float64
	}{
		{time.Minute * 30, 1.1}, // Very fresh = longer TTL (1.0 + 0.2*0.5 = 1.1)
		{time.Hour * 6, 1.0},    // Moderately fresh = base TTL
		{time.Hour * 48, 0.9},   // Old data = shorter TTL (1.0 - 0.2*0.5 = 0.9)
	}

	for _, test := range tests {
		result := manager.calculateDataFreshnessFactor(test.dataAge)
		assert.InDelta(t, test.expected, result, 0.01, "Freshness factor for %v", test.dataAge)
	}
}

func TestCalculateTimeOfDayFactor(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	// Test time of day factor calculation
	// Note: This test doesn't mock time, so it will vary based on when it's run
	result := manager.calculateTimeOfDayFactor()
	assert.True(t, result >= 0.7 && result <= 1.3, "Time factor should be reasonable")

	// Test that result is a valid multiplier
	assert.True(t, result > 0, "Time factor should be positive")
}

func TestAnalyzeQueryComplexity(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	tests := []struct {
		query    string
		expected string // "low", "medium", "high"
	}{
		{"SELECT * FROM users", "low"},
		{"SELECT u.name FROM users u JOIN orders o ON u.id = o.user_id WHERE o.total > 100", "medium"}, // Complex but not "high" by score
		{"SELECT COUNT(*) FROM users WHERE active = true", "medium"},                                   // Has aggregation + filter = medium complexity
	}

	for _, test := range tests {
		complexity := manager.AnalyzeQueryComplexity(test.query)
		assert.NotNil(t, complexity)
		assert.Equal(t, test.expected, complexity.Level, "Complexity level for query: %s", test.query)
		assert.True(t, complexity.Score >= 0.0 && complexity.Score <= 1.0, "Score should be between 0 and 1")
	}
}

func TestRecordAccessPattern(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	metadata := &CacheMetadata{
		Key:    "test_key",
		Query:  "SELECT * FROM users",
		UserID: "user123",
	}

	// Record first access
	manager.recordAccessPattern("test_key", metadata)

	// Check if pattern was recorded
	manager.patternMu.RLock()
	pattern, exists := manager.accessPatterns["test_key"]
	manager.patternMu.RUnlock()

	assert.True(t, exists, "Access pattern should be recorded")
	assert.Equal(t, int64(1), pattern.AccessCount)
	assert.Equal(t, "user123", pattern.UserID)

	// Record second access
	metadata2 := &CacheMetadata{
		Key:    "test_key",
		Query:  "SELECT * FROM users",
		UserID: "user123",
	}
	manager.recordAccessPattern("test_key", metadata2)

	// Check if access count increased
	manager.patternMu.RLock()
	pattern2, exists2 := manager.accessPatterns["test_key"]
	manager.patternMu.RUnlock()

	assert.True(t, exists2)
	assert.Equal(t, int64(2), pattern2.AccessCount)
}

func TestUpdateUserProfile(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	userID := "user123"
	query := "SELECT * FROM users"
	accessTime := time.Now()

	// Update user profile
	manager.updateUserProfile(userID, "test_key", query, accessTime)

	// Check if profile was created
	manager.userMu.RLock()
	profile, exists := manager.userProfiles[userID]
	manager.userMu.RUnlock()

	assert.True(t, exists, "User profile should be created")
	assert.Equal(t, userID, profile.UserID)
	assert.Contains(t, profile.CommonQueries, query)
	assert.Contains(t, profile.PreferredTimeSlots, accessTime.Hour())
}

func TestTTLBounds(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())
	ctx := context.Background()

	// Test with extreme values that should be bounded
	metadata := &CacheMetadata{
		Key:        "test_key",
		Query:      "SELECT * FROM users",
		Confidence: 2.0, // Extreme confidence
		Complexity: "high",
		DataAge:    time.Hour * 24 * 365, // Very old data
	}

	ttl := manager.CalculateOptimalTTL(ctx, "test_key", metadata)

	minTTL := time.Duration(manager.config.MinTTL) * time.Second
	maxTTL := time.Duration(manager.config.MaxTTL) * time.Second

	assert.True(t, ttl >= minTTL, "TTL should not be below minimum")
	assert.True(t, ttl <= maxTTL, "TTL should not exceed maximum")
}

func TestGetStats(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	stats := manager.GetStats()

	assert.NotNil(t, stats)
	assert.Contains(t, stats, "config")
	assert.Contains(t, stats, "access_patterns")
	assert.Contains(t, stats, "user_profiles")
	assert.Contains(t, stats, "query_complexities")
	assert.Contains(t, stats, "learning_enabled")
	assert.Contains(t, stats, "user_behavior_enabled")
	assert.Contains(t, stats, "time_optimization_enabled")
}

func TestClose(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	// Add some test data
	metadata := &CacheMetadata{
		Key:    "test_key",
		Query:  "SELECT * FROM users",
		UserID: "user123",
	}
	manager.recordAccessPattern("test_key", metadata)

	// Verify data exists
	stats := manager.GetStats()
	initialPatterns := stats["access_patterns"].(int)
	assert.True(t, initialPatterns > 0, "Should have access patterns before close")

	// Close manager
	err := manager.Close()
	assert.NoError(t, err)

	// Verify data was cleared
	statsAfter := manager.GetStats()
	patternsAfter := statsAfter["access_patterns"].(int)
	assert.Equal(t, 0, patternsAfter, "Access patterns should be cleared after close")
}

func TestConcurrentAccess(t *testing.T) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())
	ctx := context.Background()

	// Test concurrent TTL calculations
	concurrency := 10
	iterations := 100

	done := make(chan bool, concurrency)

	for i := 0; i < concurrency; i++ {
		go func(id int) {
			for j := 0; j < iterations; j++ {
				metadata := &CacheMetadata{
					Key:        "test_key_" + string(rune(id*iterations+j)),
					Query:      "SELECT * FROM users WHERE id = ?",
					UserID:     "user" + string(rune(id)),
					Confidence: 0.8,
					Complexity: "medium",
				}

				ttl := manager.CalculateOptimalTTL(ctx, metadata.Key, metadata)
				assert.NotZero(t, ttl)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines to complete
	for i := 0; i < concurrency; i++ {
		select {
		case <-done:
			// Goroutine completed
		case <-time.After(time.Second * 10):
			t.Fatal("Test timed out")
		}
	}
}

func BenchmarkCalculateOptimalTTL(b *testing.B) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())
	ctx := context.Background()

	metadata := &CacheMetadata{
		Key:        "benchmark_key",
		Query:      "SELECT * FROM users WHERE active = true",
		UserID:     "bench_user",
		Confidence: 0.85,
		Complexity: "medium",
		DataAge:    time.Hour * 2,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = manager.CalculateOptimalTTL(ctx, metadata.Key, metadata)
	}
}

func BenchmarkAnalyzeQueryComplexity(b *testing.B) {
	manager := NewSmartTTLManager(DefaultSmartTTLConfig())

	queries := []string{
		"SELECT * FROM users",
		"SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id HAVING COUNT(o.id) > 5",
		"SELECT * FROM users WHERE created_at > ? AND active = true ORDER BY name LIMIT 100",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		query := queries[i%len(queries)]
		_ = manager.AnalyzeQueryComplexity(query)
	}
}
